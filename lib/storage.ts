import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { env } from "./env";

const LOCAL_DIR = path.join(process.cwd(), ".data", "uploads");

export type StorageDriver = "vercel-blob" | "local";

export function activeStorageDriver(): StorageDriver {
  return env.blobToken() ? "vercel-blob" : "local";
}

export interface StoredFile {
  url: string;
  key: string;
}

/**
 * Stores a server-generated buffer (e.g. the OpenAI edit result) and
 * returns a URL the browser — and OpenAI's own API for follow-up calls —
 * can fetch. Uses Vercel Blob when configured, otherwise falls back to a
 * local `.data/uploads` folder served via /api/files/[key] (fine for local
 * dev or a persistent self-hosted Node server; NOT suitable for ephemeral
 * serverless filesystems in production — configure BLOB_READ_WRITE_TOKEN).
 */
export async function storeBuffer(
  buffer: Buffer,
  opts: { contentType: string; keyPrefix?: string; extension?: string }
): Promise<StoredFile> {
  const ext = opts.extension ?? "png";
  const key = `${opts.keyPrefix ?? "img"}-${randomUUID()}.${ext}`;

  if (activeStorageDriver() === "vercel-blob") {
    const blob = await put(key, buffer, {
      access: "public",
      contentType: opts.contentType,
      token: env.blobToken(),
    });
    return { url: blob.url, key: blob.pathname };
  }

  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, key), buffer);
  const base = env.siteUrl().replace(/\/$/, "");
  return { url: `${base}/api/files/${key}`, key };
}

export function localFilePath(key: string): string {
  // Prevent path traversal — only allow flat filenames we generated.
  const safeKey = path.basename(key);
  return path.join(LOCAL_DIR, safeKey);
}
