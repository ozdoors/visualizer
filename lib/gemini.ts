import { GoogleGenAI, Type } from "@google/genai";
import { env, requireEnv } from "./env";
import {
  MEASUREMENT_SYSTEM_PROMPT,
  SCENE_ANALYSIS_SYSTEM_PROMPT,
  sceneAnalysisUserPrompt,
} from "./prompts";
import { MeasurementEstimate, SceneAnalysis } from "./types";

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY", env.geminiApiKey()) });
  }
  return client;
}

interface FetchedImage {
  data: string; // base64
  mimeType: string;
}

/**
 * Retries transient Google API errors (503 "high demand", 429 rate limit,
 * 500) with exponential backoff + jitter, so a temporary capacity spike
 * self-heals instead of failing the customer's request.
 */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const e = err as { status?: number; code?: number; message?: string };
      const status = e?.status ?? e?.code;
      const msg = e?.message ?? "";

      // Permanent conditions — retrying wastes time, fail fast so the real
      // cause (usually "enable billing") surfaces immediately.
      const permanent = /free.?tier|billing|check your plan|limit:\s*0/i.test(msg);

      const transient =
        !permanent &&
        (status === 503 ||
          status === 500 ||
          status === 429 ||
          /unavailable|overloaded|high demand|try again/i.test(msg));

      if (!transient || attempt === maxAttempts) break;

      // Short, bounded backoff (~0.6s, 1.2s) so the worst case is a couple
      // of seconds, never minutes.
      const delay = Math.min(3000, 600 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 300);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

async function fetchImage(url: string): Promise<FetchedImage> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image (${res.status}): ${url}`);
  }
  const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { data: buffer.toString("base64"), mimeType };
}

// ---- Gemini response schemas (uses the SDK's Type enum) ----

const SCENE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isUsable: { type: Type.BOOLEAN },
    rejectionReason: { type: Type.STRING, nullable: true },
    areaType: {
      type: Type.STRING,
      enum: ["deck", "balcony", "porch", "staircase", "patio", "other"],
    },
    edgeDescription: { type: Type.STRING },
    hasExistingRailing: { type: Type.BOOLEAN },
    existingRailingDescription: { type: Type.STRING, nullable: true },
    stairsPresent: { type: Type.BOOLEAN },
    cautionNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
    confidence: { type: Type.STRING, enum: ["low", "medium", "high"] },
  },
  required: [
    "isUsable",
    "rejectionReason",
    "areaType",
    "edgeDescription",
    "hasExistingRailing",
    "existingRailingDescription",
    "stairsPresent",
    "cautionNotes",
    "confidence",
  ],
};

const MEASUREMENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    railingLengthFt: { type: Type.NUMBER },
    corners: { type: Type.INTEGER },
    stairSections: { type: Type.INTEGER },
    estimatedPosts: { type: Type.INTEGER },
    estimatedGlassPanels: { type: Type.INTEGER },
    estimatedHeightInches: { type: Type.NUMBER },
    confidence: { type: Type.STRING, enum: ["low", "medium", "high"] },
    notes: { type: Type.STRING },
  },
  required: [
    "railingLengthFt",
    "corners",
    "stairSections",
    "estimatedPosts",
    "estimatedGlassPanels",
    "estimatedHeightInches",
    "confidence",
    "notes",
  ],
};

/** Step 4 — vision clarity + geometry detection. */
export async function analyzeScene(
  imageUrl: string,
  areaTypeHint?: string
): Promise<SceneAnalysis> {
  const ai = getClient();
  const img = await fetchImage(imageUrl);

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: env.geminiVisionModel(),
      contents: [
        {
          role: "user",
          parts: [
            { text: sceneAnalysisUserPrompt(areaTypeHint) },
            { inlineData: { mimeType: img.mimeType, data: img.data } },
          ],
        },
      ],
      config: {
        systemInstruction: SCENE_ANALYSIS_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: SCENE_SCHEMA,
        temperature: 0.2,
      },
    })
  );

  const text = response.text;
  if (!text) throw new Error("Scene analysis returned no content.");
  return JSON.parse(text) as SceneAnalysis;
}

type ImgPart = { text: string } | { inlineData: { mimeType: string; data: string } };

const IMAGE_MODELS = () => [
  ...new Set(
    [
      env.geminiImageModel(),
      "gemini-3.1-flash-lite-image",
      "gemini-3.1-flash-image",
    ].filter(Boolean)
  ),
];

const REFERENCE_INSTRUCTION =
  "The following SECOND image is a STYLE REFERENCE of our actual railing product. Match the railing's hardware profiles, mounting style, proportions, colour and — critically — reproduce any DECORATIVE PATTERN (scrolls, S-scrolls, belly balusters, ornaments) with the SAME shape, COUNT, and ARRANGEMENT as shown in this reference; do not simplify, reduce the number of ornaments, or replace the pattern with a single element. Do NOT copy the reference's background, building, deck, sky, or any of its scenery — only the FIRST image is being edited; apply the railing style onto the FIRST image while keeping the FIRST image's own scene, lighting, and perspective unchanged.";

/** Runs one image-generation call with model fallback + retry; returns PNG bytes. */
async function runImageGeneration(parts: ImgPart[]): Promise<Buffer> {
  const ai = getClient();
  let lastErr: unknown;
  for (const model of IMAGE_MODELS()) {
    try {
      const response = await withRetry(() =>
        ai.models.generateContent({ model, contents: [{ role: "user", parts }] })
      );
      const out = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of out) {
        if (part.inlineData?.data) return Buffer.from(part.inlineData.data, "base64");
      }
      throw new Error(`Model ${model} returned no image data.`);
    } catch (err) {
      lastErr = err;
      console.warn(`Image model "${model}" failed, trying next fallback:`, (err as Error)?.message);
    }
  }
  throw lastErr ?? new Error("Image edit returned no image data.");
}

/**
 * Step 5 — the photorealistic railing edit.
 *
 * Normal path: one pass. If `composite` is provided (used for ornate scroll
 * designs the model can't reliably draw in one shot), a TWO-PASS pipeline runs:
 *   pass 1 — render a PLAIN straight-picket railing on the photo (reliable),
 *   pass 2 — feed that render + the exact scroll photo and insert the ornaments,
 * which reproduces the real decorative pattern far more faithfully.
 */
export async function generateRailingEdit(
  imageUrl: string,
  prompt: string,
  reference?: { data: string; mimeType: string } | null,
  composite?: { plainPrompt: string; arrangement: string } | null
): Promise<Buffer> {
  const img = await fetchImage(imageUrl);

  if (composite && reference) {
    // Pass 1 — plain railing, no ornament.
    const plain = await runImageGeneration([
      { text: composite.plainPrompt },
      { inlineData: { mimeType: img.mimeType, data: img.data } },
    ]);

    // Pass 2 — insert the exact scroll ornament from the reference photo.
    const insertPrompt =
      "The FIRST image is a photo that already shows a plain aluminium spindle railing installed. The SECOND image is a close photo of our real decorative scroll ornament. Add the decorative scroll ornaments into the railing panels of the FIRST image, copying the EXACT scroll silhouette, size proportion, count and arrangement shown in the SECOND image. " +
      composite.arrangement +
      " Match the railing's existing colour, perspective and lighting so the ornaments look welded in place and photorealistic. Keep the deck, building, sky, background and the railing frame otherwise unchanged. Do not copy the second image's background.";
    return runImageGeneration([
      { text: insertPrompt },
      { inlineData: { mimeType: "image/png", data: plain.toString("base64") } },
      { inlineData: { mimeType: reference.mimeType, data: reference.data } },
    ]);
  }

  // Single-pass path.
  const parts: ImgPart[] = [
    { text: prompt },
    { inlineData: { mimeType: img.mimeType, data: img.data } },
  ];
  if (reference) {
    parts.push({ text: REFERENCE_INSTRUCTION });
    parts.push({ inlineData: { mimeType: reference.mimeType, data: reference.data } });
  }
  return runImageGeneration(parts);
}

/** Step 6 — internal-only AI measurement estimate. */
export async function estimateMeasurements(
  originalUrl: string,
  generatedUrl: string
): Promise<MeasurementEstimate> {
  const ai = getClient();
  const [original, generated] = await Promise.all([
    fetchImage(originalUrl),
    fetchImage(generatedUrl),
  ]);

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: env.geminiVisionModel(),
      contents: [
        {
          role: "user",
          parts: [
            { text: "Original photo (for scale reference):" },
            { inlineData: { mimeType: original.mimeType, data: original.data } },
            { text: "Photo with proposed railing added:" },
            { inlineData: { mimeType: generated.mimeType, data: generated.data } },
          ],
        },
      ],
      config: {
        systemInstruction: MEASUREMENT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: MEASUREMENT_SCHEMA,
        temperature: 0.2,
      },
    })
  );

  const text = response.text;
  if (!text) throw new Error("Measurement estimation returned no content.");
  return JSON.parse(text) as MeasurementEstimate;
}
