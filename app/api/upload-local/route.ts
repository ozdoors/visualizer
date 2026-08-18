import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { storeBuffer } from "@/lib/storage";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

// Fallback upload path used only when BLOB_READ_WRITE_TOKEN isn't configured
// (local development or a self-hosted Node server without Vercel's request
// body limits). See lib/storage.ts.
export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type || "unknown"}` },
      { status: 400 }
    );
  }

  const maxBytes = env.maxUploadMb() * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File exceeds the ${env.maxUploadMb()}MB limit.` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storeBuffer(buffer, {
    contentType: file.type,
    keyPrefix: "upload",
    extension: EXT_BY_TYPE[file.type] ?? "bin",
  });

  return NextResponse.json({ url: stored.url, key: stored.key });
}
