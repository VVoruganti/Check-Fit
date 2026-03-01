import type { GarmentDescription } from "@/types/garment";
import type { BodyMeasurements } from "@/types/measurements";
import type { DraftPiece } from "@/types/draft-piece";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { GENERATORS } from "./generators";
import { generateFallbackPieces } from "./generators/fallback";
import { assignFlatPositions } from "./generators/utils";

/**
 * Main orchestrator: GarmentDescription + measurements → PatternPieceData[]
 *
 * Iterates through all registered generators. Each generator checks whether
 * its component is present in the description and returns pieces accordingly.
 * If draftPieces are provided, any enabled drafts not covered by standard
 * generators get simple fallback shapes so they appear in the viewer.
 * Finally assigns auto-laid-out flat positions.
 */
export function generatePattern(
  description: GarmentDescription,
  measurements: BodyMeasurements,
  draftPieces?: DraftPiece[],
): PatternPieceData[] {
  const pieces: PatternPieceData[] = [];

  for (const generator of GENERATORS) {
    pieces.push(...generator(measurements, description));
  }

  if (draftPieces && draftPieces.length > 0) {
    pieces.push(...generateFallbackPieces(draftPieces, pieces));
  }

  return assignFlatPositions(pieces);
}
