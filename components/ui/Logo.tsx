"use client";

import { useState } from "react";
import { BRAND } from "@/lib/brand";

// Renders the live site logo, falling back to the bundled /oz-logo.svg if the
// remote image fails to load (e.g. CDN path change or offline).
export function Logo({ className }: { className?: string }) {
  const [src, setSrc] = useState(BRAND.logoUrl);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={BRAND.name}
      className={className}
      onError={() => {
        if (src !== "/oz-logo.svg") setSrc("/oz-logo.svg");
      }}
    />
  );
}
