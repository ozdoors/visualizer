// Centralized, lazy access to environment variables.
// Nothing here throws at import time so `next build` works without secrets
// configured — routes that actually need a value validate it when called.

function readEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  // Which image engine to use: "gemini" (default, cheaper) or "openai".
  aiProvider: () => readEnv("AI_PROVIDER", "gemini").toLowerCase(),

  // --- Google Gemini (default provider) ---
  geminiApiKey: () => readEnv("GEMINI_API_KEY"),
  // Preferred image model for the railing edit (Step 5). Defaults to the
  // low-latency Lite model for speed/reliability; the full model is used
  // automatically as a fallback (see lib/gemini.ts).
  geminiImageModel: () => readEnv("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-lite-image"),
  // Vision model for scene analysis (Step 4) + measurements (Step 6).
  geminiVisionModel: () => readEnv("GEMINI_VISION_MODEL", "gemini-3.5-flash"),

  // --- OpenAI (alternative provider) ---
  openaiApiKey: () => readEnv("OPENAI_API_KEY"),
  // gpt-image-1.5 is the current image model (gpt-image-1 retires Oct 2026).
  // Use gpt-image-1-mini for a cheaper/faster option.
  openaiImageModel: () => readEnv("OPENAI_IMAGE_MODEL", "gpt-image-1.5"),
  openaiVisionModel: () => readEnv("OPENAI_VISION_MODEL", "gpt-4o"),

  resendApiKey: () => readEnv("RESEND_API_KEY"),
  emailFrom: () => readEnv("EMAIL_FROM", "visualizer@ozaluminiumrailing.ca"),
  companyEmail: () => readEnv("COMPANY_EMAIL", "info@ozaluminiumrailing.ca"),

  blobToken: () => readEnv("BLOB_READ_WRITE_TOKEN"),
  storageDriver: () =>
    readEnv("STORAGE_DRIVER", readEnv("BLOB_READ_WRITE_TOKEN") ? "vercel-blob" : "local"),

  maxUploadMb: () => Number(readEnv("NEXT_PUBLIC_MAX_UPLOAD_MB", "20")),

  siteUrl: () => readEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
};

export class MissingConfigError extends Error {
  constructor(name: string) {
    super(
      `Missing required configuration: ${name}. Check your .env.local / hosting environment variables (see .env.example).`
    );
    this.name = "MissingConfigError";
  }
}

export function requireEnv(name: string, value: string): string {
  if (!value) throw new MissingConfigError(name);
  return value;
}
