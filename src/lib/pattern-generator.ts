import type { GarmentDescription } from "@/types/garment";
import type { BodyMeasurements } from "@/types/measurements";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { GENERATORS } from "./generators";
import { assignFlatPositions } from "./generators/utils";

/**
 * Legacy orchestrator: GarmentDescription + measurements → PatternPieceData[]
 *
 * Kept as reference implementation. Production path now uses LLM generation
 * via /api/generate-pieces + convertLLMPieces() in llm-to-pattern.ts.
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
