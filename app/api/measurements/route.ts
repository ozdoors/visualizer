import { NextResponse } from "next/server";
import { z } from "zod";
import { estimateMeasurements } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({
  originalUrl: z.string().url(),
  generatedUrl: z.string().url(),
});

// Internal-only endpoint. Estimated measurements are company information —
// see Step 6 of the spec — and must never be rendered in the public
// customer-facing wizard. This route exists for optional internal tooling
// (e.g. an admin dashboard) and is guarded by INTERNAL_API_SECRET. The
// public wizard never calls this route directly; /api/request-quote calls
// the underlying lib/openai.ts function server-side instead.
export async function POST(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret) {
    const provided = request.headers.get("x-internal-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const estimate = await estimateMeasurements(parsed.data.originalUrl, parsed.data.generatedUrl);
    return NextResponse.json({ estimate });
  } catch (error) {
    console.error("measurements error:", error);
    return NextResponse.json({ error: "Failed to estimate measurements." }, { status: 500 });
  }
}
