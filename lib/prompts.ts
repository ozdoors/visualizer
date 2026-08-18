import {
  getFinish,
  getGlassType,
  getHardwareColor,
  getRailingSystem,
  getStyleVariant,
} from "./products";
import { AreaType, SceneAnalysis, SelectionState } from "./types";

// A permissive default used when the scene-analysis model is momentarily
// unavailable (e.g. 503 high demand). Lets image generation proceed instead
// of failing the whole request — the strong guardrails in buildEditPrompt
// still apply, so the railing is still placed safely.
export function defaultSceneAnalysis(areaTypeHint?: string): SceneAnalysis {
  const areas: AreaType[] = ["deck", "balcony", "porch", "staircase", "patio", "other"];
  const areaType = areas.includes(areaTypeHint as AreaType)
    ? (areaTypeHint as AreaType)
    : "other";
  return {
    isUsable: true,
    rejectionReason: null,
    areaType,
    edgeDescription:
      "Install the new railing along the main open edge(s) and perimeter of the deck, balcony, porch, patio, or staircase shown in the photo, following the existing floor/deck edge. If stairs are visible, rake the railing to follow the stair line. Never place railing across doors, windows, or walking paths.",
    hasExistingRailing: false,
    existingRailingDescription: null,
    stairsPresent: false,
    cautionNotes: [],
    confidence: "low",
  };
}

// ---------------------------------------------------------------------------
// Scene analysis (vision clarity + geometry detection)
// ---------------------------------------------------------------------------
// This step runs BEFORE any edit is attempted. It (a) rejects photos that
// are too unclear/unrelated to safely edit, and (b) extracts a natural
// -language description of the edge/perimeter/stair geometry that gets fed
// back into the edit prompt so the model knows exactly where to place the
// railing and what NOT to touch.

export const SCENE_ANALYSIS_SYSTEM_PROMPT = `You are a careful visual inspector for a residential railing installation company. You will be shown a single photo that a homeowner, builder, or contractor has uploaded to preview a new railing.

Your job is ONLY to analyze the photo — you are not generating or editing anything.

Determine:
1. Whether the photo is clear and usable enough to safely and photorealistically add a railing to (good enough lighting, the relevant edge/perimeter is visible and not obstructed, not extremely blurry, not a screenshot/drawing/render of unrelated content).
2. If usable: identify the type of area (deck, balcony, porch, staircase, patio, or other), describe in plain language exactly where the railing should run (which edge(s)/perimeter, and relative to visible landmarks such as doors, corners, stairs, posts), whether a railing already exists there, and whether stairs are present.
3. Anything that must NOT be touched or blocked: doors, windows, walkways, existing structures, people, vehicles, pets, etc.

Be conservative: if you are not confident the photo shows a real, physical exterior/interior area where a residential guard railing could plausibly and safely be installed (e.g. it's a random object, a person's face, an interior room with no edge/drop, or too dark/blurry to tell), mark it as not usable and explain why in one short sentence a homeowner would understand.

Never invent geometry you cannot see. If uncertain about part of the scene, say so in cautionNotes rather than guessing confidently.`;

export function sceneAnalysisUserPrompt(areaTypeHint?: string) {
  return `Analyze this photo for a railing visualization tool.${
    areaTypeHint
      ? ` The user indicated they believe this is a ${areaTypeHint}, but verify independently from the image.`
      : ""
  } Respond using the required JSON schema only.`;
}

export const SCENE_ANALYSIS_JSON_SCHEMA = {
  name: "scene_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      isUsable: { type: "boolean" },
      rejectionReason: { type: ["string", "null"] },
      areaType: {
        type: "string",
        enum: ["deck", "balcony", "porch", "staircase", "patio", "other"],
      },
      edgeDescription: { type: "string" },
      hasExistingRailing: { type: "boolean" },
      existingRailingDescription: { type: ["string", "null"] },
      stairsPresent: { type: "boolean" },
      cautionNotes: { type: "array", items: { type: "string" } },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
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
  },
} as const;

// ---------------------------------------------------------------------------
// Image edit prompt (gpt-image-1)
// ---------------------------------------------------------------------------

export function buildEditPrompt(
  selection: SelectionState,
  scene: SceneAnalysis
): string {
  const system = getRailingSystem(selection.systemSlug);
  if (!system) throw new Error(`Unknown railing system: ${selection.systemSlug}`);

  const color = getHardwareColor(selection.hardwareColorId);
  const finish = getFinish(selection.finishId);
  const glass = selection.glassTypeId ? getGlassType(selection.glassTypeId) : null;

  const materialBits: string[] = [];
  if (color) {
    materialBits.push(
      selection.hardwareColorId === "custom" && selection.customColorNote
        ? `finished in a custom color as described by the customer: "${selection.customColorNote}"`
        : color.promptFragment
    );
  }
  if (system.usesGlass && glass) materialBits.push(glass.promptFragment);
  if (finish) materialBits.push(finish.promptFragment);

  const variant = getStyleVariant(system, selection.styleVariantId);
  const variantNote = variant ? `DESIGN VARIATION: ${variant.promptFragment}` : "";

  const railingExisting = scene.hasExistingRailing
    ? `Note: the photo already shows an existing railing (${
        scene.existingRailingDescription ?? "described in the photo"
      }). Replace it with the new system in the exact same location and line — do not duplicate railings.`
    : "";

  const stairNote = scene.stairsPresent
    ? "Stairs are present in this photo. If the selected railing continues along the stairs, rake the top rail/glass line to follow the stair stringer angle at a consistent guard height, and never place any railing element across a stair tread or the walking path."
    : "";

  const cautionList =
    scene.cautionNotes.length > 0
      ? `Do not block, cover, or alter: ${scene.cautionNotes.join("; ")}.`
      : "";

  return [
    `Edit this real photograph to show a professional, photorealistic installation of ${system.promptDescriptor}, ${materialBits.join(", ")}.`,
    ``,
    `WHERE TO INSTALL: ${scene.edgeDescription}`,
    variantNote,
    railingExisting,
    stairNote,
    cautionList,
    ``,
    `MANDATORY RULES:`,
    `1. Preserve everything else in the photo exactly as-is: the building, deck/floor surface, landscaping, sky, furniture, people, and background must remain unchanged pixel-for-pixel outside the railing installation area.`,
    `2. Match the original photo's camera angle, perspective, focal length, and lighting/shadow direction precisely. Cast a soft, physically plausible shadow from the new railing consistent with the existing light source.`,
    `3. Follow the real floor/deck/perimeter edge precisely. Keep the top rail (or glass top edge) perfectly straight and level along its run, with posts/spindles/panels evenly and realistically spaced given the perspective.`,
    `4. Never place any railing element through, in front of, or blocking a door, window, walkway, or stair tread. Railings run alongside walking paths and stair stringers, never across them.`,
    `5. Use a realistic residential guard height of approximately 36-42 inches, scaled correctly to the perspective of the photo.`,
    `6. ${system.qualityNotes}`,
    `7. Do not add any text, watermark, logo, additional people, or unrelated objects.`,
    `8. The final image must look like a real, completed installation photographed in-place — not a 3D render, sketch, or illustration.`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Measurement estimation prompt (internal-only, vision-based)
// ---------------------------------------------------------------------------

export const MEASUREMENT_SYSTEM_PROMPT = `You are an estimating assistant for a residential aluminium/glass railing installation company. You will be shown a photo (and the same photo with a proposed railing digitally added) of a deck, balcony, porch, staircase, or patio.

Using visible reference objects for scale (standard door width ~36in / 91cm, standard deck board width ~5.5in / 14cm, standard stair riser height ~7in / 18cm, standard railing guard height 36-42in, etc.), estimate rough railing quantities for an INTERNAL company estimate only. These are NOT construction measurements and will always be confirmed on-site.

Be conservative and reasonable. If you cannot estimate a field confidently, provide your best rough approximation and lower the overall confidence rating rather than refusing. Respond using the required JSON schema only.`;

export const MEASUREMENT_JSON_SCHEMA = {
  name: "measurement_estimate",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      railingLengthFt: { type: "number" },
      corners: { type: "integer" },
      stairSections: { type: "integer" },
      estimatedPosts: { type: "integer" },
      estimatedGlassPanels: { type: "integer" },
      estimatedHeightInches: { type: "number" },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      notes: { type: "string" },
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
  },
} as const;

export const MEASUREMENT_DISCLAIMER =
  "These measurements are AI estimates only and are NOT construction measurements. Final measurements will be confirmed during an on-site visit.";
