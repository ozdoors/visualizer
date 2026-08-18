"use client";

import { useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { SolidCard } from "./ui/GlassCard";
import { Button } from "./ui/Button";
import { SectionHeader } from "./SectionHeader";
import { UploadSection } from "./sections/UploadSection";
import { SystemSection } from "./sections/SystemSection";
import { OptionsSection, isOptionsValid } from "./sections/OptionsSection";
import { ResultsSection } from "./sections/ResultsSection";
import { QuoteModal } from "./QuoteModal";
import { AreaType, GenerationResult, SelectionState, WizardPhoto } from "@/lib/types";
import { getRailingSystem } from "@/lib/products";

export function OnePage() {
  const [photos, setPhotos] = useState<WizardPhoto[]>([]);
  const [selection, setSelection] = useState<SelectionState>({
    systemSlug: "",
    hardwareColorId: "black",
    glassTypeId: "clear",
    finishId: "matte",
  });
  const [results, setResults] = useState<Record<string, GenerationResult>>({});
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const readyPhotos = useMemo(
    () => photos.filter((p) => p.status === "done" && p.remoteUrl),
    [photos]
  );
  const uploadsBusy = photos.some(
    (p) => p.status === "converting" || p.status === "uploading"
  );

  const canCreate =
    readyPhotos.length > 0 &&
    !!selection.systemSlug &&
    isOptionsValid(selection) &&
    !uploadsBusy;

  const anyGenerating = Object.values(results).some((r) => r.status === "loading");
  const anyDone = Object.values(results).some((r) => r.status === "done");

  // Single attempt against the API with a safety timeout so the UI never
  // spins forever. Returns { ok, data, retryable }.
  const attemptVisualize = async (
    photo: WizardPhoto
  ): Promise<{ ok: boolean; data?: { generatedUrl: string; sceneAnalysis?: { areaType?: string } }; error?: string; retryable: boolean }> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150_000);
    try {
      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: photo.remoteUrl, selection }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 422 = unusable photo (don't retry — the user must pick a better one).
        const retryable = res.status !== 422;
        return { ok: false, error: data.error, retryable };
      }
      return { ok: true, data, retryable: false };
    } catch {
      return { ok: false, error: undefined, retryable: true };
    } finally {
      clearTimeout(timeout);
    }
  };

  const runGeneration = async (photo: WizardPhoto) => {
    if (!photo.remoteUrl) return;
    setResults((prev) => ({ ...prev, [photo.id]: { photoId: photo.id, status: "loading" } }));

    const maxAttempts = 3;
    let last: Awaited<ReturnType<typeof attemptVisualize>> | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      last = await attemptVisualize(photo);
      if (last.ok || !last.retryable) break;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500 * attempt)); // brief backoff, then silently retry
      }
    }

    if (last?.ok && last.data) {
      setResults((prev) => ({
        ...prev,
        [photo.id]: {
          photoId: photo.id,
          status: "done",
          generatedUrl: last.data!.generatedUrl,
          areaType: last.data!.sceneAnalysis?.areaType,
        },
      }));
    } else {
      setResults((prev) => ({
        ...prev,
        [photo.id]: {
          photoId: photo.id,
          status: "error",
          error:
            last?.error ||
            "Our design service is briefly busy. Please tap Try again — it usually works within a moment.",
        },
      }));
    }
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setHasGenerated(true);
    // Let the results area mount, then scroll to it.
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
    // Generate sequentially to stay within per-request timeouts.
    for (const photo of readyPhotos) {
      await runGeneration(photo);
    }
  };

  const quotePhotos = useMemo(
    () =>
      photos
        .filter((p) => p.remoteUrl && results[p.id]?.status === "done")
        .map((p) => ({
          originalUrl: p.remoteUrl as string,
          generatedUrl: results[p.id].generatedUrl as string,
        })),
    [photos, results]
  );

  const detectedAreaType: AreaType = useMemo(() => {
    const first = Object.values(results).find((r) => r.status === "done" && r.areaType);
    return (first?.areaType as AreaType) || "other";
  }, [results]);

  const systemChosen = !!getRailingSystem(selection.systemSlug);

  return (
    <div className="flex flex-col gap-6">
      {/* 1 — Upload */}
      <SolidCard className="p-6 sm:p-8">
        <SectionHeader
          index={1}
          title="Upload your photo"
          subtitle="Add one or more photos of your deck, porch, balcony, or staircase. JPG, PNG, HEIC, or WEBP — up to 20MB each."
        />
        <UploadSection photos={photos} setPhotos={setPhotos} />
      </SolidCard>

      {/* 2 — System */}
      <SolidCard className="p-6 sm:p-8">
        <SectionHeader
          index={2}
          title="Choose your railing system"
          subtitle="Select the product you'd like to preview on your photo."
        />
        <SystemSection
          selectedSlug={selection.systemSlug || null}
          onSelect={(slug) =>
            setSelection((prev) => {
              const sys = getRailingSystem(slug);
              return {
                ...prev,
                systemSlug: slug,
                glassTypeId: prev.glassTypeId ?? "clear",
                // Default to the first AI-generable design variant (skipping
                // any "design only" variants), or clear it for systems that
                // have no variants at all.
                styleVariantId: sys?.styleVariants?.length
                  ? (sys.styleVariants.find((v) => !v.designOnly) ?? sys.styleVariants[0]).id
                  : undefined,
              };
            })
          }
        />
      </SolidCard>

      {/* 3 — Options */}
      <SolidCard className="p-6 sm:p-8">
        <SectionHeader
          index={3}
          title="Choose your options"
          subtitle={
            systemChosen
              ? "Pick a hardware color, glass type (if applicable), and finish."
              : "Select a railing system first to unlock these options."
          }
        />
        <OptionsSection selection={selection} setSelection={setSelection} />
      </SolidCard>

      {/* Single Create action */}
      <div className="sticky bottom-4 z-30 flex flex-col items-center gap-2">
        <Button
          variant="accent"
          onClick={handleCreate}
          loading={anyGenerating}
          disabled={!canCreate}
          className="w-full max-w-sm px-8 py-4 text-base"
        >
          <Sparkles className="h-5 w-5" />
          {anyGenerating ? "Creating your visualization…" : "Create Visualization"}
        </Button>
        {!canCreate && !anyGenerating && (
          <p className="rounded-full bg-white/80 px-3 py-1 text-center text-xs text-[var(--color-ink-soft)] backdrop-blur">
            {uploadsBusy
              ? "Waiting for your photos to finish uploading…"
              : "Add a photo, choose a system, and pick your options to continue."}
          </p>
        )}
      </div>

      {/* Results */}
      {hasGenerated && (
        <div ref={resultsRef} className="scroll-mt-24">
          <SolidCard className="p-6 sm:p-8">
            <SectionHeader
              index={4}
              title="Your visualization"
              subtitle="Drag the slider to compare before and after. This can take up to 20 seconds per photo."
            />
            <ResultsSection
              photos={photos}
              results={results}
              onRegenerate={runGeneration}
            />
            <div className="mt-6 flex justify-center border-t border-[var(--color-border)] pt-6">
              <Button
                variant="primary"
                onClick={() => setShowQuoteModal(true)}
                disabled={!anyDone || anyGenerating}
                className="px-8"
              >
                Request Final Quote
              </Button>
            </div>
          </SolidCard>
        </div>
      )}

      {showQuoteModal && (
        <QuoteModal
          photos={quotePhotos}
          selection={selection}
          areaType={detectedAreaType}
          onClose={() => setShowQuoteModal(false)}
        />
      )}
    </div>
  );
}
