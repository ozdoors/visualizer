"use client";

import clsx from "clsx";
import { Check, Mail, Phone } from "lucide-react";
import { FINISHES, GLASS_TYPES, HARDWARE_COLORS, getRailingSystem } from "@/lib/products";
import { BRAND } from "@/lib/brand";
import { SelectionState } from "@/lib/types";

interface SwatchOption {
  id: string;
  name: string;
  image: string;
}

export function isOptionsValid(selection: SelectionState): boolean {
  const system = getRailingSystem(selection.systemSlug);
  if (!system) return false;
  const needsGlass = system.usesGlass;
  const needsVariant = !!system.styleVariants?.length;
  return (
    !!selection.hardwareColorId &&
    !!selection.finishId &&
    (!needsGlass || !!selection.glassTypeId) &&
    (!needsVariant || !!selection.styleVariantId) &&
    (selection.hardwareColorId !== "custom" || !!selection.customColorNote?.trim())
  );
}

function SwatchGrid({
  title,
  options,
  selectedId,
  onSelect,
}: {
  title: string;
  options: SwatchOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <h3 className="w-full text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)] sm:w-40 sm:shrink-0">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2.5">
        {options.map((opt) => {
          const isSelected = opt.id === selectedId;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              title={opt.name}
              className="flex items-center gap-2"
            >
              <span
                className={clsx(
                  "relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 transition-all",
                  isSelected ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={opt.image} alt={opt.name} className="h-full w-full object-cover" />
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Check className="h-4 w-4 text-white" />
                  </span>
                )}
              </span>
              <span
                className={clsx(
                  "text-xs",
                  isSelected
                    ? "font-semibold text-[var(--color-ink)]"
                    : "text-[var(--color-ink-soft)]"
                )}
              >
                {opt.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OptionsSection({
  selection,
  setSelection,
}: {
  selection: SelectionState;
  setSelection: (updater: (prev: SelectionState) => SelectionState) => void;
}) {
  const system = getRailingSystem(selection.systemSlug);
  const needsGlass = system?.usesGlass ?? false;

  if (!system) {
    return (
      <p className="text-sm text-[var(--color-ink-soft)]">
        Select a railing system above to see the available color, glass, and finish options.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {system.styleVariants?.length ? (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Design
          </h3>
          <div className="flex flex-wrap gap-3">
            {system.styleVariants.map((v) => {
              const isSelected = v.id === selection.styleVariantId;

              // Design-only variants are shown for reference but are NOT
              // clickable — the AI can only reliably preview plain straight
              // spindles. These are real products the customer requests a
              // quote for (see the note below the grid).
              if (v.designOnly) {
                return (
                  <div
                    key={v.id}
                    title={`${v.name} — available on request, not previewable by the visualizer`}
                    aria-disabled="true"
                    className="flex cursor-not-allowed flex-col items-center gap-1.5"
                  >
                    <span className="relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--color-border)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={v.image}
                        alt={v.name}
                        className="h-full w-full object-cover opacity-45 grayscale"
                      />
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                        Quote only
                      </span>
                    </span>
                    <span className="text-xs text-[var(--color-ink-soft)]">{v.name}</span>
                  </div>
                );
              }

              return (
                <button
                  key={v.id}
                  onClick={() => setSelection((prev) => ({ ...prev, styleVariantId: v.id }))}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={clsx(
                      "relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-xl border-2 transition-all",
                      isSelected ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.image} alt={v.name} className="h-full w-full object-cover" />
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <Check className="h-5 w-5 text-white" />
                      </span>
                    )}
                  </span>
                  <span
                    className={clsx(
                      "text-xs",
                      isSelected
                        ? "font-semibold text-[var(--color-ink)]"
                        : "text-[var(--color-ink-soft)]"
                    )}
                  >
                    {v.name}
                  </span>
                </button>
              );
            })}
          </div>

          {system.styleVariants.some((v) => v.designOnly) ? (
            <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3.5 text-xs leading-relaxed text-[var(--color-ink-soft)]">
              <p>
                <span className="font-semibold text-[var(--color-ink)]">
                  About the decorative designs:
                </span>{" "}
                {system.styleVariants
                  .filter((v) => v.designOnly)
                  .map((v) => v.name)
                  .join(", ")}{" "}
                are custom designs we manufacture and install, but they can&apos;t be
                previewed by the visualizer — only the plain{" "}
                <span className="font-medium text-[var(--color-ink)]">Straight</span> spindle
                can be generated on your photo. We absolutely make these designs — contact us
                for a quote and we&apos;ll take care of the rest.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <a
                  href={BRAND.phoneHref}
                  className="inline-flex items-center gap-1.5 font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                >
                  <Phone className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  {BRAND.phone}
                </a>
                <a
                  href={BRAND.emailHref}
                  className="inline-flex items-center gap-1.5 font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                >
                  <Mail className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  {BRAND.email}
                </a>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <SwatchGrid
        title="Frame / Hardware Color"
        options={HARDWARE_COLORS}
        selectedId={selection.hardwareColorId}
        onSelect={(id) => setSelection((prev) => ({ ...prev, hardwareColorId: id }))}
      />
      {selection.hardwareColorId === "custom" && (
        <input
          type="text"
          placeholder="Describe the custom color you'd like (e.g. RAL 7016 anthracite grey)"
          value={selection.customColorNote ?? ""}
          onChange={(e) =>
            setSelection((prev) => ({ ...prev, customColorNote: e.target.value }))
          }
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
        />
      )}

      {needsGlass && (
        <SwatchGrid
          title="Glass Type"
          options={GLASS_TYPES}
          selectedId={selection.glassTypeId}
          onSelect={(id) => setSelection((prev) => ({ ...prev, glassTypeId: id }))}
        />
      )}

      <SwatchGrid
        title="Finish"
        options={FINISHES}
        selectedId={selection.finishId}
        onSelect={(id) => setSelection((prev) => ({ ...prev, finishId: id }))}
      />
    </div>
  );
}
