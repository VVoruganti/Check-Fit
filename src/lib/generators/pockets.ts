import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { SCALE, createCurvedShape, type ShapeCommand } from "./utils";
import { PIECE_COLORS } from "@/data/piece-colors";
import { computeDressFormProfile } from "@/lib/assembly-positions";

export function generatePockets(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  const pocket = description.pockets;
  if (!pocket) return [];

  const profile = computeDressFormProfile(measurements);

  if (pocket.style === "kangaroo") {
    const width = (measurements.bust / 3) * SCALE;
    const height = 7 * SCALE;

    const commands: ShapeCommand[] = [
      { type: "move", x: -width, y: height / 2 },
      { type: "line", x: width, y: height / 2 },
      { type: "line", x: width, y: -height / 2 },
      { type: "curve", cpX: 0, cpY: -height / 2 - height * 0.15, x: -width, y: -height / 2 },
    ];

    const shape = createCurvedShape(commands);

    return [
      {
        id: "kangaroo-pocket",
        name: "Kangaroo Pocket",
        color: PIECE_COLORS["kangaroo-pocket"],
        shape,
        flatPosition: [0, -1, 0],
        flatRotation: [0, 0, 0],
        assembledPosition: [0, profile.waistY - 0.1, profile.bustR + 0.03],
        assembledRotation: [0, 0, 0],
        cutCount: 1,
        cutOnFold: false,
        instructions: "Cut 1. Center on front bodice at waist level.",
      },
    ];
  }

  if (pocket.style === "patch") {
    const size = 5.5 * SCALE;
    const commands: ShapeCommand[] = [
      { type: "move", x: -size / 2, y: size / 2 },
      { type: "line", x: size / 2, y: size / 2 },
      { type: "line", x: size / 2, y: -size / 2 },
      { type: "curve", cpX: 0, cpY: -size / 2 - size * 0.1, x: -size / 2, y: -size / 2 },
    ];

    const shape = createCurvedShape(commands);

    return [
      {
        id: "patch-pocket",
        name: "Patch Pocket",
        color: PIECE_COLORS["patch-pocket"],
        shape,
        flatPosition: [0, -1, 0],
        flatRotation: [0, 0, 0],
        assembledPosition: [0, profile.bodiceCenterY - 0.1, profile.bustR + 0.03],
        assembledRotation: [0, 0, 0],
        cutCount: pocket.count,
        cutOnFold: false,
        instructions: `Cut ${pocket.count}. Press edges and topstitch in place.`,
      },
    ];
  }

  return [];
}
