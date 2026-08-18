"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { RAILING_SYSTEMS } from "@/lib/products";

export function SystemSection({
  selectedSlug,
  onSelect,
}: {
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {RAILING_SYSTEMS.map((system) => {
        const isSelected = system.slug === selectedSlug;
        return (
          <button
            key={system.slug}
            onClick={() => onSelect(system.slug)}
            title={system.description}
            className={clsx(
              "group flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-all",
              isSelected
                ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]"
                : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
            )}
          >
            <div className="relative aspect-[5/4] w-full bg-[var(--color-surface-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={system.image}
                alt={system.name}
                className="h-full w-full object-cover"
              />
              {isSelected && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)] text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold leading-snug text-[var(--color-ink)]">
                {system.shortName}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-[var(--color-ink-soft)]">
                {system.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
