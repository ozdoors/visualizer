import { readFile } from "fs/promises";
import path from "path";

export interface ReferenceImage {
  data: string; // base64
  mimeType: string;
}

const EXTS: Array<[string, string]> = [
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
];

/**
 * Loads an optional product "style reference" photo bundled at
 * public/references/<slug>.<ext>. If you drop a real photo of each railing
 * system there (named by its slug), the AI is shown that photo as a visual
 * style guide so the generated railing closely matches your actual hardware.
 * Returns null if no reference file exists — generation then relies on the
 * text prompt alone, exactly as before.
 */
export async function getReferenceImage(slug: string): Promise<ReferenceImage | null> {
  const safeSlug = path.basename(slug); // guard against traversal
  for (const [ext, mimeType] of EXTS) {
    try {
      const p = path.join(process.cwd(), "public", "references", `${safeSlug}.${ext}`);
      const buf = await readFile(p);
      return { data: buf.toString("base64"), mimeType };
    } catch {
      // try next extension
    }
  }
  return null;
}
