import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { SCALE, createCurvedShape, type ShapeCommand } from "./utils";
import { PIECE_COLORS } from "@/data/piece-colors";

export function generateSkirt(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  const skirt = description.skirt;
  if (!skirt) return [];

  const waistHalf = (measurements.waist / 4) * SCALE;
  const hipHalf = (measurements.hip / 4) * SCALE;

  // Length based on garment length
  const lengthMap = { mini: 16, knee: 22, midi: 30, maxi: 40 };
  const skirtLength = lengthMap[skirt.length] * SCALE;

  // Hip line position (typically 7-8 inches below waist)
  const hipLine = 7.5 * SCALE;

  // Hem width varies by shape
  const flareMap = { straight: 1.0, "a-line": 1.35, circle: 1.8, pencil: 0.95 };
  const hemHalf = hipHalf * flareMap[skirt.shape];

  function buildSkirtShape(): ShapeCommand[] {
    const commands: ShapeCommand[] = [];

    // Top-left (waist)
    commands.push({ type: "move", x: -waistHalf, y: skirtLength / 2 });

    // Right side of waist
    commands.push({ type: "line", x: waistHalf, y: skirtLength / 2 });

    // Right side down to hip
    commands.push({ type: "line", x: hipHalf, y: skirtLength / 2 - hipLine });

    // Right side curve to hem
    commands.push({
      type: "curve",
      cpX: hipHalf + (hemHalf - hipHalf) * 0.5,
      cpY: -skirtLength / 2 + skirtLength * 0.2,
      x: hemHalf,
      y: -skirtLength / 2,
    });

    // Hem bottom
    commands.push({ type: "line", x: -hemHalf, y: -skirtLength / 2 });

    // Left side curve up from hem to hip
    commands.push({
      type: "curve",
      cpX: -hipHalf - (hemHalf - hipHalf) * 0.5,
      cpY: -skirtLength / 2 + skirtLength * 0.2,
      x: -hipHalf,
      y: skirtLength / 2 - hipLine,
    });

    // Left hip to waist
    commands.push({ type: "line", x: -waistHalf, y: skirtLength / 2 });

    return commands;
  }

  const frontShape = createCurvedShape(buildSkirtShape());
  const backShape = createCurvedShape(buildSkirtShape());

  const pieces: PatternPieceData[] = [
    {
      id: "front-skirt",
      name: "Front Skirt",
      color: PIECE_COLORS["front-skirt"],
      shape: frontShape,
      flatPosition: [-2.5, -2.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, -0.6, waistHalf * 3],
      assembledRotation: [0, 0, 0],
      cutCount: 1,
      cutOnFold: true,
      instructions: `Cut 1 on fold. ${skirt.shape} shape, ${skirt.length} length.`,
    },
    {
      id: "back-skirt",
      name: "Back Skirt",
      color: PIECE_COLORS["back-skirt"],
      shape: backShape,
      flatPosition: [2.5, -2.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, -0.6, -waistHalf * 3],
      assembledRotation: [0, Math.PI, 0],
      cutCount: 1,
      cutOnFold: true,
      instructions: "Cut 1 on fold. Sew to front skirt at side seams.",
    },
  ];

  return pieces;
}
