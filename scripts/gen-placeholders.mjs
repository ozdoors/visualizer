// One-time generator for placeholder SVG images (color swatches + product
// cards). Replace the output files with real product photography whenever
// it's available — the app just needs images at the same paths referenced
// in lib/products.ts.
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const root = path.join(process.cwd(), "public");

function swatchSvg({ hex, pattern }) {
  const fill = hex ?? "#ffffff";
  let overlay = "";
  if (pattern === "frost") {
    overlay = `<rect width="200" height="200" fill="white" opacity="0.35"/>`;
  }
  if (pattern === "custom") {
    overlay = `
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff5f6d"/>
          <stop offset="25%" stop-color="#ffc371"/>
          <stop offset="50%" stop-color="#47cf73"/>
          <stop offset="75%" stop-color="#2f80ed"/>
          <stop offset="100%" stop-color="#a259ff"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#g)"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="24" fill="${pattern === "custom" ? "#fff" : fill}"/>
    ${overlay}
    <rect x="1" y="1" width="198" height="198" rx="23" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="2"/>
  </svg>`;
}

function productSvg({ title, icon }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#eef1f6"/>
        <stop offset="100%" stop-color="#dfe3ea"/>
      </linearGradient>
    </defs>
    <rect width="640" height="480" fill="url(#bg)"/>
    <rect x="60" y="360" width="520" height="10" rx="4" fill="#b9c0cc"/>
    ${icon}
    <text x="320" y="440" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600" fill="#4a4d56" text-anchor="middle">${title}</text>
  </svg>`;
}

const swatches = [
  { file: "black.svg", hex: "#1C1C1E" },
  { file: "white.svg", hex: "#F5F5F7" },
  { file: "brown.svg", hex: "#5B4636" },
  { file: "custom.svg", hex: null, pattern: "custom" },
  { file: "glass-clear.svg", hex: "#DCE8EE" },
  { file: "glass-frosted.svg", hex: "#E9EEF1", pattern: "frost" },
  { file: "glass-grey.svg", hex: "#8B98A3" },
  { file: "glass-bronze.svg", hex: "#8A5A34" },
  { file: "finish-matte.svg", hex: "#B9BEC7" },
  { file: "finish-gloss.svg", hex: "#C9CEDA" },
];

mkdirSync(path.join(root, "swatches"), { recursive: true });
for (const s of swatches) {
  writeFileSync(path.join(root, "swatches", s.file), swatchSvg(s));
}

const railBar = `<rect x="120" y="180" width="400" height="10" fill="#6b7280"/>`;
const spindles = Array.from({ length: 10 })
  .map((_, i) => `<rect x="${130 + i * 38}" y="190" width="8" height="150" fill="#6b7280"/>`)
  .join("");
const glassPanel = `<rect x="120" y="190" width="400" height="150" fill="#a9c6d8" opacity="0.55"/><rect x="120" y="190" width="400" height="150" fill="none" stroke="#6b7280" stroke-width="4"/>`;
const posts = Array.from({ length: 5 })
  .map((_, i) => `<rect x="${130 + i * 96}" y="180" width="12" height="160" fill="#6b7280"/>`)
  .join("");
const spigotsSquare = Array.from({ length: 5 })
  .map((_, i) => `<rect x="${136 + i * 90}" y="330" width="14" height="20" fill="#6b7280"/>`)
  .join("");
const bottomRail = `<rect x="120" y="330" width="400" height="10" fill="#6b7280"/>`;
const clamps = Array.from({ length: 8 })
  .map((_, i) => `<rect x="${126 + i * 55}" y="250" width="10" height="14" fill="#6b7280"/>`)
  .join("");

const products = [
  { file: "glass-spigot-top-rail.svg", title: "Spigot + Top Rail", icon: glassPanel + spigotsSquare + railBar },
  { file: "glass-spigot-clamps.svg", title: "Spigot + Clamps", icon: glassPanel + spigotsSquare },
  { file: "glass-posts-clamps.svg", title: "Post + Clamps", icon: glassPanel + posts + clamps },
  { file: "aluminium-glass.svg", title: "Aluminium Glass Railing", icon: glassPanel + posts + railBar + bottomRail },
  { file: "aluminium-spindle.svg", title: "Aluminium Spindle Railing", icon: railBar + spindles + bottomRail },
];

mkdirSync(path.join(root, "products"), { recursive: true });
for (const p of products) {
  writeFileSync(path.join(root, "products", p.file), productSvg(p));
}

console.log("Generated placeholder swatches + product images.");
