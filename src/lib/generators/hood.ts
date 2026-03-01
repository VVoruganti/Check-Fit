import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { SCALE, createCurvedShape, type ShapeCommand } from "./utils";
import { PIECE_COLORS } from "@/data/piece-colors";
import { computeDressFormProfile } from "@/lib/assembly-positions";

export function generateHood(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  if (!description.hood) return [];

  const profile = computeDressFormProfile(measurements);

  const neckHalf = (measurements.neck / 2) * SCALE;
  const hoodHeight = neckHalf * 2.5;
  const hoodWidth = neckHalf * 1.8;

  function buildHoodShape(): ShapeCommand[] {
    const commands: ShapeCommand[] = [];

    commands.push({ type: "move", x: -hoodWidth * 0.1, y: -hoodHeight / 2 });
    commands.push({ type: "line", x: -hoodWidth * 0.1, y: hoodHeight * 0.1 });

    commands.push({
      type: "curve",
      cpX: -hoodWidth * 0.1,
      cpY: hoodHeight / 2 + hoodHeight * 0.2,
      x: hoodWidth * 0.5,
      y: hoodHeight / 2,
    });

    commands.push({
      type: "curve",
      cpX: hoodWidth * 0.8,
      cpY: hoodHeight * 0.3,
      x: hoodWidth * 0.6,
      y: -hoodHeight / 2,
    });

    commands.push({ type: "line", x: -hoodWidth * 0.1, y: -hoodHeight / 2 });

    return commands;
  }

  const shape = createCurvedShape(buildHoodShape());

  return [
    {
      id: "hood",
      name: "Hood",
      color: PIECE_COLORS.hood,
      shape,
      flatPosition: [0, 3.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, profile.neckY + hoodHeight * 0.4, -profile.neckR * 0.5],
      assembledRotation: [0.2, 0, 0],
      cutCount: 2,
      cutOnFold: false,
      instructions: "Cut 2. Sew center back seam, then attach to neckline.",
    },
  ];
}
