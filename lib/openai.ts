import OpenAI, { toFile } from "openai";
import { env, requireEnv } from "./env";
import {
  MEASUREMENT_JSON_SCHEMA,
  MEASUREMENT_SYSTEM_PROMPT,
  SCENE_ANALYSIS_JSON_SCHEMA,
  SCENE_ANALYSIS_SYSTEM_PROMPT,
  sceneAnalysisUserPrompt,
} from "./prompts";
import { MeasurementEstimate, SceneAnalysis } from "./types";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY", env.openaiApiKey()) });
  }
  return client;
}

/** Fetches image bytes from either a public URL or a local API route. */
async function fetchImageBytes(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image for analysis (${res.status}): ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function toDataUrl(buffer: Buffer, mime = "image/jpeg"): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

/**
 * Step 4 — vision-based clarity + geometry detection. Runs before any edit
 * is attempted so we never hallucinate railing placement on an unusable or
 * ambiguous photo.
 */
export async function analyzeScene(
  imageUrl: string,
  areaTypeHint?: string
): Promise<SceneAnalysis> {
  const openai = getClient();
  const bytes = await fetchImageBytes(imageUrl);
  const dataUrl = toDataUrl(bytes);

  const completion = await openai.chat.completions.create({
    model: env.openaiVisionModel(),
    messages: [
      { role: "system", content: SCENE_ANALYSIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: sceneAnalysisUserPrompt(areaTypeHint) },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    response_format: { type: "json_schema", json_schema: SCENE_ANALYSIS_JSON_SCHEMA },
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Scene analysis returned no content.");
  return JSON.parse(raw) as SceneAnalysis;
}

/**
 * Step 5 — the actual photorealistic railing edit via gpt-image-1.
 * Returns raw PNG bytes.
 */
export async function generateRailingEdit(
  imageUrl: string,
  prompt: string,
  reference?: { data: string; mimeType: string } | null,
  // Composite (two-pass) is implemented for the Gemini provider; on OpenAI we
  // fall back to a single pass. Accepted here to keep a matching signature.
  _composite?: { plainPrompt: string; arrangement: string } | null
): Promise<Buffer> {
  void _composite;
  const openai = getClient();
  const bytes = await fetchImageBytes(imageUrl);

  const file = await toFile(bytes, "photo.png", { type: "image/png" });

  // If a product style-reference image is provided, pass it as an additional
  // input image and tell the model to match its hardware style (but not its
  // scene).
  let image: Awaited<ReturnType<typeof toFile>> | Awaited<ReturnType<typeof toFile>>[] = file;
  let effectivePrompt = prompt;
  if (reference) {
    const refExt = reference.mimeType.includes("png") ? "png" : reference.mimeType.includes("webp") ? "webp" : "jpg";
    const refFile = await toFile(Buffer.from(reference.data, "base64"), `reference.${refExt}`, {
      type: reference.mimeType,
    });
    image = [file, refFile];
    effectivePrompt = `${prompt}\n\nThe FIRST image is the photo to edit. The SECOND image is a STYLE REFERENCE of our actual railing product — match the railing's hardware profiles, mounting, proportions, and colour to it, but do NOT copy the reference's background or scene. Only edit the first image, keeping its scene, lighting, and perspective unchanged.`;
  }

  const result = await openai.images.edit({
    model: env.openaiImageModel(),
    image,
    prompt: effectivePrompt,
    size: "auto",
    quality: (process.env.OPENAI_IMAGE_QUALITY as "low" | "medium" | "high" | "auto") || "high",
    input_fidelity: "high",
    n: 1,
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image edit returned no image data.");
  return Buffer.from(b64, "base64");
}

/**
 * Step 6 — internal-only AI measurement estimate. Never surfaced to the
 * customer; only included in the internal quotation email.
 */
export async function estimateMeasurements(
  originalUrl: string,
  generatedUrl: string
): Promise<MeasurementEstimate> {
  const openai = getClient();
  const [originalBytes, generatedBytes] = await Promise.all([
    fetchImageBytes(originalUrl),
    fetchImageBytes(generatedUrl),
  ]);

  const completion = await openai.chat.completions.create({
    model: env.openaiVisionModel(),
    messages: [
      { role: "system", content: MEASUREMENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Original photo (for scale reference):" },
          { type: "image_url", image_url: { url: toDataUrl(originalBytes) } },
          { type: "text", text: "Photo with proposed railing added:" },
          { type: "image_url", image_url: { url: toDataUrl(generatedBytes) } },
        ],
      },
    ],
    response_format: { type: "json_schema", json_schema: MEASUREMENT_JSON_SCHEMA },
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Measurement estimation returned no content.");
  return JSON.parse(raw) as MeasurementEstimate;
}
