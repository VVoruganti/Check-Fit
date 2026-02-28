import type { GarmentDescription } from "@/types/garment";

export const GARMENT_TEMPLATES: Record<string, GarmentDescription> = {
  dress: {
    category: "dress",
    summary: "A classic A-line dress with fitted bodice, set-in sleeves, and flared skirt",
    bodice: { present: true, neckline: "scoop", hasDarts: true, fit: "fitted" },
    sleeves: { present: true, style: "set-in", length: "short", hasCuff: false },
    collar: { present: true, style: "peter-pan" },
    skirt: { present: true, shape: "a-line", length: "knee" },
    closure: { type: "zipper", placement: "back" },
  },

  tee: {
    category: "top",
    summary: "A relaxed crew-neck T-shirt with short sleeves",
    bodice: { present: true, neckline: "crew", hasDarts: false, fit: "semi-fitted" },
    sleeves: { present: true, style: "set-in", length: "short", hasCuff: false },
    closure: { type: "pullover", placement: "none" },
  },

  hoodie: {
    category: "hoodie",
    summary: "A casual pullover hoodie with kangaroo pocket and ribbed cuffs",
    bodice: { present: true, neckline: "crew", hasDarts: false, fit: "loose" },
    sleeves: { present: true, style: "set-in", length: "long", hasCuff: true },
    hood: { present: true },
    pockets: { present: true, style: "kangaroo", count: 1 },
    cuffs: { present: true, style: "ribbed" },
    waistband: { present: true, style: "elastic", width: 2.5 },
    closure: { type: "pullover", placement: "none" },
  },

  pants: {
    category: "pants",
    summary: "Classic straight-leg pants with waistband",
    pants: { present: true, fit: "straight", length: "full" },
    waistband: { present: true, style: "contoured", width: 2 },
    pockets: { present: true, style: "inseam", count: 2 },
    closure: { type: "zipper", placement: "front" },
  },

  skirt: {
    category: "skirt",
    summary: "A simple A-line skirt with waistband",
    skirt: { present: true, shape: "a-line", length: "knee" },
    waistband: { present: true, style: "straight", width: 1.5 },
    closure: { type: "zipper", placement: "back" },
  },
};

export const TEMPLATE_NAMES: Record<string, string> = {
  dress: "Classic Dress",
  tee: "T-Shirt",
  hoodie: "Hoodie",
  pants: "Pants",
  skirt: "A-Line Skirt",
};
