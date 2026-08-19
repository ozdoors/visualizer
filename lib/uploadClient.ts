// Client-side helpers: format validation, HEIC->JPEG conversion, and
// uploading the original photo to whichever storage backend is active.

export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

export interface UploadConfig {
  storageDriver: "vercel-blob" | "local";
  maxUploadMb: number;
}

let cachedConfig: UploadConfig | null = null;

export async function getUploadConfig(): Promise<UploadConfig> {
  if (cachedConfig) return cachedConfig;
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Could not load upload configuration.");
  cachedConfig = (await res.json()) as UploadConfig;
  return cachedConfig;
}

export function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    ACCEPTED_TYPES.includes(file.type) ||
    ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
  );
}

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

/** Converts HEIC/HEIF to JPEG in the browser so the AI pipeline and <img> previews can read it. */
export async function normalizeToJpegIfNeeded(file: File): Promise<File> {
  if (!isHeic(file)) return file;

  const heic2any = (await import("heic2any")).default;
  const converted = (await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  })) as Blob;

  const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([converted], newName, { type: "image/jpeg" });
}

/**
 * Shrinks a large photo in the browser before upload so the AI calls are fast
 * and cheap. Modern phone photos are 15–25MB / 4000px+, which is far more
 * than the models need (they downsample internally anyway) and slow to send.
 * We cap the longest edge to ~1600px and re-encode as JPEG. Falls back to the
 * original file if the browser can't decode it.
 */
export async function downscaleImage(file: File, maxEdge = 1600): Promise<File> {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxEdge / Math.max(width, height));

    // Already small enough — keep the original bytes.
    if (scale >= 1) {
      bitmap.close?.();
      return file;
    }

    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
    );
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadOriginalPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload-local", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Upload failed.");
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}
