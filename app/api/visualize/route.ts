import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeScene, generateRailingEdit } from "@/lib/ai";
import { buildEditPrompt, defaultSceneAnalysis } from "@/lib/prompts";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";
import { storeBuffer } from "@/lib/storage";
import { getRailingSystem, getStyleVariant } from "@/lib/products";
import { getReferenceImage } from "@/lib/reference";
import { SceneAnalysis } from "@/lib/types";

export const runtime = "nodejs";
// Allow long generations on hosts that support it (e.g. Vercel Pro = up to
// 300s). On the Vercel free/Hobby plan this is capped at 60s automatically —
// which is why the fast Lite model is the default (see lib/env.ts).
export const maxDuration = 300;

const SelectionSchema = z.object({
  systemSlug: z.string().min(1),
  hardwareColorId: z.string().min(1),
  customColorNote: z.string().max(200).optional(),
  glassTypeId: z.string().nullable(),
  finishId: z.string().min(1),
  styleVariantId: z.string().optional(),
});

const BodySchema = z.object({
  photoUrl: z.string().url(),
  selection: SelectionSchema,
  areaTypeHint: z.string().optional(),
});

export async function POST(request: Request) {
  const rl = checkRateLimit(`visualize:${clientKeyFromHeaders(request.headers)}`, {
    max: 12,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { photoUrl, selection, areaTypeHint } = parsed.data;

  const requestedSystem = getRailingSystem(selection.systemSlug);
  if (!requestedSystem) {
    return NextResponse.json({ error: "Unknown railing system selected." }, { status: 400 });
  }

  // Safety net: the decorative spindle designs are "design only" — the AI can
  // only reliably render plain straight spindles. If a request somehow arrives
  // asking for a design-only variant (e.g. a stale client), fall back to the
  // straight design instead of attempting to generate an unreliable preview.
  const requestedVariant = getStyleVariant(requestedSystem, selection.styleVariantId);
  if (requestedVariant?.designOnly) {
    const generable = requestedSystem.styleVariants?.find((v) => !v.designOnly);
    selection.styleVariantId = generable?.id;
  }

  const started = Date.now();

  try {
    // Step 4: detect geometry / reject unusable photos before touching pixels.
    // The analysis model can be separately overloaded; if it is, we degrade
    // gracefully to sensible defaults rather than blocking image generation
    // (which runs on a different model). The strong rules in buildEditPrompt
    // still keep the railing placement safe.
    let sceneAnalysis: SceneAnalysis;
    try {
      sceneAnalysis = await analyzeScene(photoUrl, areaTypeHint);
    } catch (analysisErr) {
      console.warn(
        "Scene analysis unavailable — proceeding with defaults:",
        (analysisErr as Error)?.message
      );
      sceneAnalysis = defaultSceneAnalysis(areaTypeHint);
    }

    if (!sceneAnalysis.isUsable) {
      return NextResponse.json(
        {
          error:
            sceneAnalysis.rejectionReason ||
            "We couldn't clearly identify a deck, balcony, porch, or stair edge in this photo.",
          sceneAnalysis,
          code: "UNCLEAR_IMAGE",
        },
        { status: 422 }
      );
    }

    // Step 5: generate the photorealistic edit. If a real product photo is
    // bundled at public/references/<slug>.(jpg|png|webp), it's shown to the
    // model as a style reference so the railing matches the actual hardware.
    const prompt = buildEditPrompt(selection, sceneAnalysis);
    // Prefer a design-variant-specific reference photo, then the system's.
    let reference = selection.styleVariantId
      ? await getReferenceImage(`${selection.systemSlug}__${selection.styleVariantId}`)
      : null;
    if (!reference) reference = await getReferenceImage(selection.systemSlug);

    // Intricate designs flagged `composite` use a two-pass pipeline (plain
    // render, then insert the exact ornament) — only when we have a reference.
    const system = getRailingSystem(selection.systemSlug)!;
    const variant = getStyleVariant(system, selection.styleVariantId);
    const composite =
      variant?.composite && reference
        ? {
            plainPrompt: buildEditPrompt(
              { ...selection, styleVariantId: "straight" },
              sceneAnalysis
            ),
            arrangement: variant.promptFragment,
          }
        : null;

    const editedBuffer = await generateRailingEdit(photoUrl, prompt, reference, composite);
    const stored = await storeBuffer(editedBuffer, {
      contentType: "image/png",
      keyPrefix: "generated",
      extension: "png",
    });

    return NextResponse.json({
      generatedUrl: stored.url,
      sceneAnalysis,
      generationMs: Date.now() - started,
    });
  } catch (error) {
    console.error("visualize error:", error);
    return NextResponse.json(
      {
        error:
          "We ran into a problem generating your preview. Please try again in a moment.",
        code: "GENERATION_FAILED",
      },
      { status: 500 }
    );
  }
}
