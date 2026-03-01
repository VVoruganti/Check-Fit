import type { DraftPiece } from "@/types/draft-piece";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { SCALE, createShape } from "./utils";

const FALLBACK_COLORS = [
  "#B07D62", // clay
  "#7B9E89", // sage
  "#8E7CC3", // lavender
  "#C2956B", // caramel
  "#6D9DB5", // dusty blue
  "#AA8A76", // tan
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[éèêë]/g, "e")
    .replace(/s$/, "")
    .trim();
}

/**
 * Creates simple pattern pieces for draft pieces that weren't covered
 * by standard generators. Uses rectangular shapes sized by heuristic.
 */
export function generateFallbackPieces(
  draftPieces: DraftPiece[],
  existingPieces: PatternPieceData[],
): PatternPieceData[] {
  const existingNames = new Set(existingPieces.map((p) => normalize(p.name)));

  const unmatched = draftPieces.filter(
    (d) => d.enabled && !existingNames.has(normalize(d.name)),
  );

  if (unmatched.length === 0) return [];

  const pieces: PatternPieceData[] = [];

  for (let i = 0; i < unmatched.length; i++) {
    const draft = unmatched[i];
    const id = slugify(draft.name);
    const color = FALLBACK_COLORS[i % FALLBACK_COLORS.length];

    // Size heuristic based on piece name
    let width = 4 * SCALE;
    let height = 4 * SCALE;

    const nameLower = draft.name.toLowerCase();
    if (
      nameLower.includes("loop") ||
      nameLower.includes("strap") ||
      nameLower.includes("tie")
    ) {
      width = 1.5 * SCALE;
      height = 6 * SCALE;
    } else if (
      nameLower.includes("appliqu") ||
      nameLower.includes("emblem") ||
      nameLower.includes("motif")
    ) {
      width = 3 * SCALE;
      height = 3 * SCALE;
    } else if (
      nameLower.includes("facing") ||
      nameLower.includes("band") ||
      nameLower.includes("binding")
    ) {
      width = 8 * SCALE;
      height = 2 * SCALE;
    }

    const shape = createShape([
      [-width / 2, height / 2],
      [width / 2, height / 2],
      [width / 2, -height / 2],
      [-width / 2, -height / 2],
    ]);

    pieces.push({
      id,
      name: draft.name,
      color,
      shape,
      flatPosition: [0, 0, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, 0, 0],
      assembledRotation: [0, 0, 0],
      cutCount: draft.quantity,
      cutOnFold: false,
      instructions: `Cut ${draft.quantity}. ${draft.notes}`,
    });
  }

  return pieces;
}
