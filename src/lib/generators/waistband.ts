import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { SCALE, createShape } from "./utils";
import { PIECE_COLORS } from "@/data/piece-colors";

export function generateWaistband(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  const wb = description.waistband;
  if (!wb) return [];

  const waistHalf = (measurements.waist / 2 + 1) * SCALE; // +1 inch ease
  const bandHeight = wb.width * SCALE;

  const shape = createShape([
    [-waistHalf, bandHeight / 2],
    [waistHalf, bandHeight / 2],
    [waistHalf, -bandHeight / 2],
    [-waistHalf, -bandHeight / 2],
  ]);

  return [
    {
      id: "waistband",
      name: "Waistband",
      color: PIECE_COLORS.waistband,
      shape,
      flatPosition: [0, 0.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, 0.05, 0],
      assembledRotation: [0, 0, 0],
      cutCount: 1,
      cutOnFold: true,
      instructions: `Cut 1 on fold. ${wb.style} style, ${wb.width}" wide.`,
    },
  ];
}
