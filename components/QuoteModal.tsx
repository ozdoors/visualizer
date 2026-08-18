"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { Button } from "./ui/Button";
import { AreaType, CustomerInfo, SelectionState } from "@/lib/types";

export function QuoteModal({
  photos,
  selection,
  areaType,
  onClose,
}: {
  photos: { originalUrl: string; generatedUrl: string }[];
  selection: SelectionState;
  areaType: AreaType;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/request-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          selection,
          areaType,
          photos,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <GlassCard className="relative w-full max-w-md bg-white/95 p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-black/5"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {status === "done" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">Request received</h3>
            <p className="text-sm text-[var(--color-ink-soft)]">
              Thanks, {form.name.split(" ")[0] || "there"}! Our team will review your photos and
              follow up with a formal quote shortly. Final measurements will be confirmed
              during an on-site visit.
            </p>
            <Button onClick={onClose}>Done</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                Request your final quote
              </h3>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                Share your contact details and our team will follow up with pricing and next
                steps.
              </p>
            </div>

            <Field label="Full name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input"
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="input"
              />
            </Field>
            <Field label="Project address">
              <input
                required
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="input"
              />
            </Field>
            <Field label="Notes (optional)">
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="input resize-none"
              />
            </Field>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" loading={status === "submitting"} className="mt-2 w-full">
              {status === "submitting" ? "Sending…" : "Submit request"}
            </Button>
            <p className="text-center text-[11px] text-[var(--color-ink-soft)]">
              By submitting, you agree to be contacted by OZ Aluminium Railing about your
              project.
            </p>
          </form>
        )}
      </GlassCard>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          background: white;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
        }
        .input:focus {
          border-color: var(--color-ink);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--color-ink-soft)]">{label}</span>
      {children}
    </label>
  );
}
