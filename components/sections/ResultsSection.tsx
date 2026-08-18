"use client";

import { AlertTriangle, Info, RefreshCw, Sparkles } from "lucide-react";
import { CompareSlider } from "../CompareSlider";
import { Button } from "../ui/Button";
import { GenerationResult, WizardPhoto } from "@/lib/types";

export function ResultsSection({
  photos,
  results,
  onRegenerate,
}: {
  photos: WizardPhoto[];
  results: Record<string, GenerationResult>;
  onRegenerate: (photo: WizardPhoto) => void;
}) {
  const readyPhotos = photos.filter((p) => p.status === "done" && p.remoteUrl);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-ink)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-strong)]" />
        <p>
          <span className="font-semibold">Please note:</span> these images are
          AI-generated and may contain errors. This tool is meant to help you visualise
          the end product — the final result can vary slightly. Exact measurements and the
          finished design are confirmed during an on-site visit.
        </p>
      </div>

      {readyPhotos.map((photo) => {
        const result = results[photo.id];
        return (
          <div key={photo.id} className="flex flex-col gap-3">
            {(!result || result.status === "loading") && (
              <div className="shimmer flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-3xl">
                <Sparkles className="h-6 w-6 text-[var(--color-ink-soft)]" />
                <p className="text-sm text-[var(--color-ink-soft)]">
                  Generating your photorealistic preview…
                </p>
              </div>
            )}

            {result?.status === "error" && (
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--color-border)] bg-white p-6 text-center">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <p className="max-w-md text-sm text-[var(--color-ink)]">{result.error}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  Try a clearer, well-lit photo that shows the full edge where the railing
                  should go.
                </p>
                <Button variant="secondary" onClick={() => onRegenerate(photo)}>
                  <RefreshCw className="h-4 w-4" /> Try again
                </Button>
              </div>
            )}

            {result?.status === "done" && result.generatedUrl && (
              <>
                <CompareSlider beforeUrl={photo.previewUrl} afterUrl={result.generatedUrl} />
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => onRegenerate(photo)}>
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate this photo
                  </Button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
