import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { SCALE, createCurvedShape, type ShapeCommand } from "./utils";
import { PIECE_COLORS } from "@/data/piece-colors";

export function generateHood(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  if (!description.hood) return [];

  // Hood sized to head — approximately neck/2 height, neck/2 width
  const neckHalf = (measurements.neck / 2) * SCALE;
  const hoodHeight = neckHalf * 2.5;
  const hoodWidth = neckHalf * 1.8;

  function buildHoodShape(): ShapeCommand[] {
    const commands: ShapeCommand[] = [];

    // Start at bottom-left (neck seam)
    commands.push({ type: "move", x: -hoodWidth * 0.1, y: -hoodHeight / 2 });

    // Back edge going up
    commands.push({ type: "line", x: -hoodWidth * 0.1, y: hoodHeight * 0.1 });

    // Top of hood (crown curve)
    commands.push({
      type: "curve",
      cpX: -hoodWidth * 0.1,
      cpY: hoodHeight / 2 + hoodHeight * 0.2,
      x: hoodWidth * 0.5,
      y: hoodHeight / 2,
    });

    // Front edge curving down (face opening)
    commands.push({
      type: "curve",
      cpX: hoodWidth * 0.8,
      cpY: hoodHeight * 0.3,
      x: hoodWidth * 0.6,
      y: -hoodHeight / 2,
    });

    // Bottom (neck seam)
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
      assembledPosition: [0, 2.0, -0.2],
      assembledRotation: [0.2, 0, 0],
      cutCount: 2,
      cutOnFold: false,
      instructions: "Cut 2. Sew center back seam, then attach to neckline.",
    },
  ];
}
