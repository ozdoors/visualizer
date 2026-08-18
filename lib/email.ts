import { Resend } from "resend";
import { AREA_TYPE_LABELS, getFinish, getGlassType, getHardwareColor, getRailingSystem, getStyleVariant } from "./products";
import { env, requireEnv } from "./env";
import { MEASUREMENT_DISCLAIMER } from "./prompts";
import { MeasurementEstimate, QuoteRequestPayload } from "./types";

let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) resend = new Resend(requireEnv("RESEND_API_KEY", env.resendApiKey()));
  return resend;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function measurementRows(measurements: (MeasurementEstimate | null)[]): string {
  return measurements
    .map((m, i) => {
      if (!m) {
        return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">Photo ${i + 1}</td>
        <td colspan="7" style="padding:8px 12px;border-bottom:1px solid #eee;color:#999;">Estimate unavailable (service was busy) — please assess on-site.</td>
      </tr>`;
      }
      return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">Photo ${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${m.railingLengthFt.toFixed(1)} ft</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${m.corners}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${m.stairSections}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${m.estimatedPosts}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${m.estimatedGlassPanels}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${m.estimatedHeightInches}"</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${esc(m.confidence)}</td>
      </tr>`;
    })
    .join("");
}

function photoRows(photos: QuoteRequestPayload["photos"]): string {
  return photos
    .map(
      (p, i) => `
      <tr>
        <td style="padding:8px;text-align:center;">
          <p style="font:12px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#666;margin:0 0 4px;">Photo ${i + 1} — Before</p>
          <a href="${p.originalUrl}"><img src="${p.originalUrl}" width="260" style="border-radius:12px;display:block;" /></a>
        </td>
        <td style="padding:8px;text-align:center;">
          <p style="font:12px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#666;margin:0 0 4px;">Photo ${i + 1} — After (AI-generated)</p>
          <a href="${p.generatedUrl}"><img src="${p.generatedUrl}" width="260" style="border-radius:12px;display:block;" /></a>
        </td>
      </tr>`
    )
    .join("");
}

export function buildQuoteEmailHtml(
  payload: QuoteRequestPayload,
  measurements: (MeasurementEstimate | null)[]
): string {
  const system = getRailingSystem(payload.selection.systemSlug);
  const color = getHardwareColor(payload.selection.hardwareColorId);
  const glass = payload.selection.glassTypeId ? getGlassType(payload.selection.glassTypeId) : null;
  const finish = getFinish(payload.selection.finishId);
  const areaLabel = AREA_TYPE_LABELS[payload.areaType] ?? payload.areaType;
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  return `
  <div style="font-family:${font};background:#f5f5f7;padding:24px;">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
      <div style="background:#111318;color:#fff;padding:24px 28px;">
        <h1 style="margin:0;font-size:20px;">New Railing Visualizer Quote Request</h1>
        <p style="margin:6px 0 0;font-size:13px;color:#b9bcc4;">OZ Aluminium Railing — ozaluminiumrailing.ca/visualizer</p>
      </div>

      <div style="padding:24px 28px;">
        <h2 style="font-size:15px;margin:0 0 8px;color:#111318;">Customer Information</h2>
        <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;">
          <tr><td style="padding:4px 0;width:120px;color:#777;">Name</td><td>${esc(payload.customer.name)}</td></tr>
          <tr><td style="padding:4px 0;color:#777;">Email</td><td><a href="mailto:${esc(payload.customer.email)}">${esc(payload.customer.email)}</a></td></tr>
          <tr><td style="padding:4px 0;color:#777;">Phone</td><td>${esc(payload.customer.phone)}</td></tr>
          <tr><td style="padding:4px 0;color:#777;">Address</td><td>${esc(payload.customer.address)}</td></tr>
          ${payload.customer.notes ? `<tr><td style="padding:4px 0;color:#777;">Notes</td><td>${esc(payload.customer.notes)}</td></tr>` : ""}
        </table>

        <h2 style="font-size:15px;margin:20px 0 8px;color:#111318;">Selected System</h2>
        <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;">
          <tr><td style="padding:4px 0;width:160px;color:#777;">System</td><td>${esc(system?.name ?? payload.selection.systemSlug)}</td></tr>
          ${
            system && getStyleVariant(system, payload.selection.styleVariantId)
              ? `<tr><td style="padding:4px 0;color:#777;">Design</td><td>${esc(getStyleVariant(system, payload.selection.styleVariantId)!.name)}</td></tr>`
              : ""
          }
          <tr><td style="padding:4px 0;color:#777;">Hardware Color</td><td>${esc(color?.name ?? payload.selection.hardwareColorId)}${payload.selection.customColorNote ? ` — ${esc(payload.selection.customColorNote)}` : ""}</td></tr>
          ${glass ? `<tr><td style="padding:4px 0;color:#777;">Glass</td><td>${esc(glass.name)} Tempered</td></tr>` : ""}
          <tr><td style="padding:4px 0;color:#777;">Finish</td><td>${esc(finish?.name ?? payload.selection.finishId)}</td></tr>
          <tr><td style="padding:4px 0;color:#777;">Estimated Area</td><td>${esc(areaLabel)}</td></tr>
        </table>

        <h2 style="font-size:15px;margin:20px 0 8px;color:#111318;">Estimated Measurements (internal only)</h2>
        <table style="width:100%;font-size:13px;color:#333;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#fafafa;">
              <th style="padding:8px 12px;text-align:left;">Photo</th>
              <th style="padding:8px 12px;text-align:left;">Length</th>
              <th style="padding:8px 12px;text-align:left;">Corners</th>
              <th style="padding:8px 12px;text-align:left;">Stair Sections</th>
              <th style="padding:8px 12px;text-align:left;">Posts</th>
              <th style="padding:8px 12px;text-align:left;">Glass Panels</th>
              <th style="padding:8px 12px;text-align:left;">Height</th>
              <th style="padding:8px 12px;text-align:left;">Confidence</th>
            </tr>
          </thead>
          <tbody>${measurementRows(measurements)}</tbody>
        </table>
        <p style="font-size:12px;color:#999;margin-top:8px;">${MEASUREMENT_DISCLAIMER}</p>

        <h2 style="font-size:15px;margin:20px 0 8px;color:#111318;">Photos</h2>
        <table style="width:100%;border-collapse:collapse;">${photoRows(payload.photos)}</table>
      </div>
    </div>
  </div>`;
}

export async function sendQuoteEmail(
  payload: QuoteRequestPayload,
  measurements: (MeasurementEstimate | null)[]
) {
  const client = getResend();
  const html = buildQuoteEmailHtml(payload, measurements);
  const system = getRailingSystem(payload.selection.systemSlug);

  return client.emails.send({
    from: env.emailFrom(),
    to: [env.companyEmail()],
    replyTo: payload.customer.email,
    subject: `New Quote Request — ${system?.name ?? "Railing"} for ${payload.customer.name}`,
    html,
  });
}
