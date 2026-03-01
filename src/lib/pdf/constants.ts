import { SCALE } from "@/lib/generators/utils";

// Three.js units → inches conversion
export const THREEJS_TO_INCHES = 1 / SCALE; // ~12.048

// Page setup (US Letter, inches)
export const PAGE_WIDTH = 8.5;
export const PAGE_HEIGHT = 11;
export const MARGIN = 0.5;
export const PRINTABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN;
export const PRINTABLE_HEIGHT = PAGE_HEIGHT - 2 * MARGIN;

// Tile overlap so pieces can be aligned when taping pages together
export const TILE_OVERLAP = 0.5;
export const TILE_WIDTH = PRINTABLE_WIDTH - TILE_OVERLAP;
export const TILE_HEIGHT = PRINTABLE_HEIGHT - TILE_OVERLAP;

// Sewing
export const SEAM_ALLOWANCE = 5 / 8; // inches

// Fabric widths (inches)
export const FABRIC_WIDTHS = [45, 60] as const;
export const DEFAULT_FABRIC_WIDTH = 45;

// Registration marks
export const CROSSHAIR_SIZE = 0.15; // half-length of crosshair arms
export const TEST_SQUARE_SIZE = 1; // 1" test square

// Layout diagram scale (fit fabric diagram onto one page)
export const LAYOUT_SCALE_TARGET = Math.min(PRINTABLE_WIDTH, PRINTABLE_HEIGHT);

// Font sizes (points converted to inches: 1pt = 1/72 in)
export const FONT = {
  title: 24,
  subtitle: 14,
  body: 10,
  small: 8,
  label: 7,
} as const;
