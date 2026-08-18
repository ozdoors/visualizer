import { NextResponse } from "next/server";
import { z } from "zod";
import { estimateMeasurements } from "@/lib/ai";
import { sendQuoteEmail } from "@/lib/email";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";
import { MeasurementEstimate } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 45;

const CustomerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  address: z.string().min(1).max(300),
  notes: z.string().max(1000).optional(),
});

const SelectionSchema = z.object({
  systemSlug: z.string().min(1),
  hardwareColorId: z.string().min(1),
  customColorNote: z.string().max(200).optional(),
  glassTypeId: z.string().nullable(),
  finishId: z.string().min(1),
  styleVariantId: z.string().optional(),
});

const BodySchema = z.object({
  customer: CustomerSchema,
  selection: SelectionSchema,
  areaType: z.enum(["deck", "balcony", "porch", "staircase", "patio", "other"]),
  photos: z
    .array(z.object({ originalUrl: z.string().url(), generatedUrl: z.string().url() }))
    .min(1)
    .max(10),
  // Honeypot field — real users never fill this in.
  companyWebsite: z.string().max(0).optional(),
});

// Step 7/8: builds the internal quotation summary + measurement estimate
// and emails it to the company. Nothing in this route's response is meant
// to be shown to the customer beyond a generic confirmation.
export async function POST(request: Request) {
  const rl = checkRateLimit(`quote:${clientKeyFromHeaders(request.headers)}`, {
    max: 5,
    windowMs: 30 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a while before submitting again." },
      { status: 429 }
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your contact details and try again." }, { status: 400 });
  }
  if (parsed.data.companyWebsite) {
    // Honeypot tripped — silently succeed without sending anything.
    return NextResponse.json({ ok: true });
  }

  const payload = parsed.data;

  try {
    // Measurement estimation is a best-effort internal extra. If the model is
    // busy, we must NOT lose the customer's lead — fall back to a null
    // estimate per photo and still send the email.
    const measurements: (MeasurementEstimate | null)[] = await Promise.all(
      payload.photos.map((p) =>
        estimateMeasurements(p.originalUrl, p.generatedUrl).catch((e) => {
          console.warn("Measurement estimate unavailable for a photo:", (e as Error)?.message);
          return null;
        })
      )
    );

    await sendQuoteEmail(payload, measurements);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("request-quote error:", error);
    return NextResponse.json(
      { error: "We couldn't submit your request right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
