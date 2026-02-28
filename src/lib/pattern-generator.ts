import type { GarmentDescription } from "@/types/garment";
import type { BodyMeasurements } from "@/types/measurements";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { GENERATORS } from "./generators";
import { assignFlatPositions } from "./generators/utils";

/**
 * Main orchestrator: GarmentDescription + measurements → PatternPieceData[]
 *
 * Iterates through all registered generators. Each generator checks whether
 * its component is present in the description and returns pieces accordingly.
 * Finally assigns auto-laid-out flat positions.
 */
export function generatePattern(
  description: GarmentDescription,
  measurements: BodyMeasurements,
): PatternPieceData[] {
  const pieces: PatternPieceData[] = [];

  for (const generator of GENERATORS) {
    pieces.push(...generator(measurements, description));
  }

  return assignFlatPositions(pieces);
}
