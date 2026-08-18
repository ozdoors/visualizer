import {
  FinishOption,
  GlassTypeOption,
  HardwareColorOption,
  RailingSystem,
} from "./types";

// ---------------------------------------------------------------------------
// Railing systems
// ---------------------------------------------------------------------------
// `promptDescriptor` and `qualityNotes` feed directly into the AI image-edit
// prompt (see lib/prompts.ts). Keep them precise and material-accurate.
// `image` paths point at /public/products/*.svg placeholders — swap these
// for real product photography whenever it's available.

export const RAILING_SYSTEMS: RailingSystem[] = [
  {
    slug: "glass-spigot-top-rail",
    name: "Glass Railing: Spigot with Top Rail",
    shortName: "Spigot + Top Rail",
    description:
      "Frameless glass panels held by square base spigots and capped with a slim top rail — a sleek, minimal look with no vertical posts.",
    image: "/products/glass-spigot-top-rail.svg",
    materialKind: "glass",
    usesGlass: true,
    usesHardwareColor: true,
    promptDescriptor:
      "a glass spigot railing system with a top rail: large frameless clear tempered glass panels standing upright, each panel anchored at the bottom by two or three individual SQUARE powder-coated aluminium spigot base-clamps bolted directly to the deck/floor at evenly spaced intervals along the bottom edge, and capped along the very top by a single continuous slim SQUARE aluminium top rail running the full length; there are absolutely NO vertical posts between the glass panels and the panels butt together with thin vertical seams",
    qualityNotes:
      "Match the reference product style: discrete square base spigots (not a continuous channel), a straight level slim square top rail, and frameless glass in between. Render realistic clear glass with accurate reflections and true transparency showing the real background through it, subtle green-tinted polished glass edges, and spigots + top rail in the selected color with a correct matte powder-coated sheen. Keep the top rail perfectly straight and level and the spigots evenly spaced in correct perspective.",
  },
  {
    slug: "glass-spigot-clamps",
    name: "Spigot With Clamps Railing",
    shortName: "Spigot + Clamps",
    description:
      "Frameless glass panels held only by square base spigot clamps — an open, minimal look with no top rail and no posts.",
    image: "/products/glass-spigot-clamps.svg",
    materialKind: "glass",
    usesGlass: true,
    usesHardwareColor: true,
    promptDescriptor:
      "a frameless glass spigot railing with base clamps and NO top rail: large clear tempered glass panels standing upright, held ONLY at the bottom by discrete SQUARE powder-coated base spigot clamps bolted directly onto the deck/floor at evenly spaced intervals (two to three spigots per panel); the entire top edge of the glass is OPEN and polished with absolutely NO top rail and NO vertical posts between the panels; the glass panels butt together with thin vertical seams",
    qualityNotes:
      "Match the reference product style: small square base spigot clamps along the bottom only (in the selected colour, typically black), completely frameless open-top glass with a polished top edge, and NO top rail or posts anywhere. Render clear glass with realistic reflections and true transparency showing the real background through it, a subtle green-tinted polished top edge, and evenly spaced base spigots in correct perspective. Keep the whole run straight and level.",
  },
  {
    slug: "glass-posts-clamps",
    name: "Glass Railing (Post and Clamps)",
    shortName: "Post + Clamps",
    description:
      "High-clarity tempered glass panels held between sleek aluminium posts by surface-mounted clamps — open, modern, and strong.",
    image: "/products/glass-posts-clamps.svg",
    materialKind: "glass",
    usesGlass: true,
    usesHardwareColor: true,
    promptDescriptor:
      "a glass railing system with posts and clamps: clear tempered glass panels held between evenly spaced vertical SQUARE powder-coated aluminium posts, with each glass panel secured to the posts by two or three small visible surface-mounted aluminium glass clamps; the top edge of the glass is OPEN with NO continuous top rail across it; posts stand at every panel joint along the deck or balcony edge",
    qualityNotes:
      "Match the reference product style: slim square vertical posts at each panel joint, small metal glass clamps where each panel meets a post, and NO top rail over the glass. Render crisp square aluminium posts in the selected color following correct perspective, clear glass panels with realistic reflections and transparency between the posts, and clamp hardware with accurate small specular highlights. Keep posts perfectly vertical and evenly spaced.",
  },
  {
    slug: "aluminium-glass",
    name: "Aluminium Glass Railing",
    shortName: "Aluminium Glass",
    description:
      "6mm tempered glass panels set inside a durable powder-coated aluminium frame with top rail, bottom rail and posts — a clean, framed modern look.",
    image: "/products/aluminium-glass.svg",
    materialKind: "glass",
    usesGlass: true,
    usesHardwareColor: true,
    promptDescriptor:
      "an aluminium-framed glass railing system: clear 6mm tempered glass panels, where EACH panel is fully enclosed inside a powder-coated aluminium frame made up of a continuous horizontal top rail, a matching horizontal bottom rail sitting just above the deck surface, and slim SQUARE vertical aluminium posts at both ends of every panel; the framed glass panels run in a straight line along the deck, balcony, or porch edge",
    qualityNotes:
      "Match the reference product style: every glass panel is framed on all four sides (top rail, bottom rail, and posts) — this is a FRAMED glass railing, not frameless. Render the aluminium frame in the selected color with a realistic matte/satin powder-coated finish, clear glass with subtle realistic reflections and transparency, equal-width framed panels and evenly spaced posts in correct perspective, and perfectly straight, level top and bottom rails.",
  },
  {
    slug: "aluminium-spindle",
    name: "Aluminium Spindle Railing",
    shortName: "Aluminium Spindle",
    description:
      "Classic vertical aluminium spindles (pickets) between a top and bottom rail — choose from four designs: straight, belly/bow, decorative scroll, or S-scroll.",
    image: "/products/aluminium-spindle.svg",
    materialKind: "aluminium",
    usesGlass: false,
    usesHardwareColor: true,
    promptDescriptor:
      "an aluminium spindle (picket) railing system: evenly spaced thin vertical SQUARE aluminium spindles/pickets with roughly 4-inch code-compliant gaps between them, running between a horizontal top rail and a horizontal bottom rail, with square aluminium posts at intervals and at every corner; mounted along the deck, balcony, or porch edge",
    qualityNotes:
      "Match the reference product style: slim evenly spaced vertical pickets between a straight top rail and bottom rail, with square posts. Render a realistic powder-coated aluminium finish in the selected color with correct specular highlights, perfectly straight and level rails, and consistent picket spacing that correctly follows the perspective and any corners in the photo.",
    styleVariants: [
      {
        id: "straight",
        name: "Straight",
        image: "/variants/spindle-straight.svg",
        promptFragment:
          "Use plain STRAIGHT vertical square pickets evenly spaced with no decorative elements.",
      },
      {
        id: "belly",
        name: "Belly / Bow",
        image: "/variants/spindle-belly.svg",
        designOnly: true,
        promptFragment:
          "Use BELLY / BOW balusters where each vertical picket curves convexly outward at its middle (a basket / belly baluster shape) instead of being straight, matching the reference design.",
      },
      {
        id: "scroll",
        name: "Decorative Scroll",
        image: "/variants/spindle-scroll.svg",
        designOnly: true,
        promptFragment:
          "IMPORTANT — keep it restrained and elegant: the railing is MOSTLY plain straight vertical square pickets with normal open spacing. Add only a MODEST decorative treatment matching the reference: a single slim horizontal scroll/vine accent near the top of one section, plus one small vertical scroll motif centred in one section. Do NOT cover the whole railing in scrollwork, do NOT make a dense continuous ornamental band across the entire top, and keep the view open and clean.",
      },
      {
        id: "sscroll",
        name: "S-Scroll",
        image: "/variants/spindle-sscroll.svg",
        designOnly: true,
        promptFragment:
          "IMPORTANT — keep it restrained and elegant: the railing is MOSTLY plain straight vertical square pickets with normal open spacing. Add just ONE small, symmetric decorative accent centred in about one railing section: a compact cluster of slender cast S-scrolls (each an S-curve with a small spiral curled at both ends) — two mirror-image S-scrolls paired in the middle with one small S-scroll above-left, above-right, below-left and below-right. Keep every other picket plain and straight. Do NOT add a continuous scroll band along the top rail, do NOT cover the whole railing in scrollwork, do NOT draw butterfly/X shapes, and keep the view open. Match the S-scroll shape shown in the reference.",
      },
    ],
  },
];

export function getStyleVariant(system: RailingSystem, id?: string) {
  if (!system.styleVariants || !id) return undefined;
  return system.styleVariants.find((v) => v.id === id);
}

export function getRailingSystem(slug: string): RailingSystem | undefined {
  return RAILING_SYSTEMS.find((s) => s.slug === slug);
}

// ---------------------------------------------------------------------------
// Hardware / frame color
// ---------------------------------------------------------------------------

export const HARDWARE_COLORS: HardwareColorOption[] = [
  {
    id: "black",
    name: "Black",
    hex: "#1C1C1E",
    image: "/swatches/black.svg",
    promptFragment: "finished in a matte black powder-coated aluminium",
  },
  {
    id: "white",
    name: "White",
    hex: "#F5F5F7",
    image: "/swatches/white.svg",
    promptFragment: "finished in a clean white powder-coated aluminium",
  },
  {
    id: "brown",
    name: "Brown",
    hex: "#5B4636",
    image: "/swatches/brown.svg",
    promptFragment: "finished in a warm bronze-brown powder-coated aluminium",
  },
  {
    id: "custom",
    name: "Custom",
    hex: null,
    image: "/swatches/custom.svg",
    isCustom: true,
    promptFragment: "finished in the customer-specified custom color",
  },
];

export function getHardwareColor(id: string): HardwareColorOption | undefined {
  return HARDWARE_COLORS.find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// Glass type (only shown for glass-based systems)
// ---------------------------------------------------------------------------

export const GLASS_TYPES: GlassTypeOption[] = [
  {
    id: "clear",
    name: "Clear",
    image: "/swatches/glass-clear.svg",
    promptFragment: "clear tempered glass with a natural, colorless transparency",
  },
  {
    id: "frosted",
    name: "Frosted",
    image: "/swatches/glass-frosted.svg",
    promptFragment:
      "frosted/acid-etched tempered glass with a soft, translucent, matte-white diffusion that obscures fine detail while still passing light",
  },
  {
    id: "grey-tint",
    name: "Grey Tint",
    image: "/swatches/glass-grey.svg",
    promptFragment: "grey-tinted tempered glass with a subtle smoked-grey transparency",
  },
  {
    id: "bronze-tint",
    name: "Bronze Tint",
    image: "/swatches/glass-bronze.svg",
    promptFragment: "bronze-tinted tempered glass with a warm amber-bronze transparency",
  },
];

export function getGlassType(id: string): GlassTypeOption | undefined {
  return GLASS_TYPES.find((g) => g.id === id);
}

// ---------------------------------------------------------------------------
// Finish
// ---------------------------------------------------------------------------

export const FINISHES: FinishOption[] = [
  {
    id: "matte",
    name: "Matte",
    image: "/swatches/finish-matte.svg",
    promptFragment: "a matte, non-reflective surface finish",
  },
  {
    id: "gloss",
    name: "Gloss",
    image: "/swatches/finish-gloss.svg",
    promptFragment: "a glossy, high-shine reflective surface finish",
  },
];

export function getFinish(id: string): FinishOption | undefined {
  return FINISHES.find((f) => f.id === id);
}

export const AREA_TYPE_LABELS: Record<string, string> = {
  deck: "Deck",
  balcony: "Balcony",
  porch: "Porch",
  staircase: "Staircase",
  patio: "Patio",
  other: "Outdoor/Indoor Area",
};
