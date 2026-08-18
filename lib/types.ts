// Shared type definitions for the railing visualizer.

export type AreaType =
  | "deck"
  | "balcony"
  | "porch"
  | "staircase"
  | "patio"
  | "other";

export interface HardwareColorOption {
  id: string;
  name: string;
  hex: string | null; // null for "custom" — swatch renders differently
  image: string; // path under /public
  isCustom?: boolean;
  promptFragment: string;
}

export interface GlassTypeOption {
  id: string;
  name: string;
  image: string;
  promptFragment: string;
}

export interface FinishOption {
  id: string;
  name: string;
  image: string;
  promptFragment: string;
}

export interface StyleVariant {
  id: string;
  name: string;
  image: string; // path under /public — swatch thumbnail
  promptFragment: string;
  // When true, use the two-pass "composite" pipeline (plain render, then
  // insert the exact ornament from the reference photo) for higher fidelity
  // on intricate decorative patterns. Requires a reference photo to exist.
  composite?: boolean;
  // When true, this design is shown for reference only — it is NOT clickable
  // and the AI does not attempt to generate it. The visualizer can only
  // reliably render plain straight spindles; the decorative designs are real
  // products customers must request a quote for. See the "design only" note
  // rendered under the Design picker in OptionsSection.
  designOnly?: boolean;
}

export interface RailingSystem {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  image: string;
  materialKind: "glass" | "aluminium";
  usesGlass: boolean;
  usesHardwareColor: boolean;
  promptDescriptor: string;
  qualityNotes: string;
  // Optional selectable design variations (e.g. spindle patterns).
  styleVariants?: StyleVariant[];
}

export interface UploadedPhoto {
  id: string;
  url: string;
  storageKey: string;
  originalName: string;
  width?: number;
  height?: number;
}

export interface SceneAnalysis {
  isUsable: boolean;
  rejectionReason: string | null;
  areaType: AreaType;
  edgeDescription: string;
  hasExistingRailing: boolean;
  existingRailingDescription: string | null;
  stairsPresent: boolean;
  cautionNotes: string[];
  confidence: "low" | "medium" | "high";
}

export interface SelectionState {
  systemSlug: string;
  hardwareColorId: string;
  customColorNote?: string;
  glassTypeId: string | null;
  finishId: string;
  styleVariantId?: string;
}

export interface VisualizeResult {
  photoId: string;
  originalUrl: string;
  generatedUrl: string;
  sceneAnalysis: SceneAnalysis;
  generationMs: number;
}

export interface MeasurementEstimate {
  railingLengthFt: number;
  corners: number;
  stairSections: number;
  estimatedPosts: number;
  estimatedGlassPanels: number;
  estimatedHeightInches: number;
  confidence: "low" | "medium" | "high";
  notes: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

// ---- Client wizard/UI state ----

export interface WizardPhoto {
  id: string;
  previewUrl: string;
  remoteUrl: string | null;
  status: "converting" | "uploading" | "done" | "error";
  error?: string;
  fileName: string;
}

export interface GenerationResult {
  photoId: string;
  status: "idle" | "loading" | "done" | "error";
  generatedUrl?: string;
  areaType?: string;
  error?: string;
}

export interface QuoteRequestPayload {
  customer: CustomerInfo;
  selection: SelectionState;
  areaType: AreaType;
  photos: {
    originalUrl: string;
    generatedUrl: string;
  }[];
}
