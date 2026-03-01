import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { SCALE, createCurvedShape, type ShapeCommand } from "./utils";
import { PIECE_COLORS } from "@/data/piece-colors";
import { computeDressFormProfile } from "@/lib/assembly-positions";

export function generateSkirt(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  const skirt = description.skirt;
  if (!skirt) return [];

  const profile = computeDressFormProfile(measurements);

  const waistHalf = (measurements.waist / 4) * SCALE;
  const hipHalf = (measurements.hip / 4) * SCALE;

  const lengthMap = { mini: 16, knee: 22, midi: 30, maxi: 40 };
  const skirtLength = lengthMap[skirt.length] * SCALE;

  const hipLine = 7.5 * SCALE;

  const flareMap = { straight: 1.0, "a-line": 1.35, circle: 1.8, pencil: 0.95 };
  const hemHalf = hipHalf * flareMap[skirt.shape];

  function buildSkirtShape(): ShapeCommand[] {
    const commands: ShapeCommand[] = [];

    commands.push({ type: "move", x: -waistHalf, y: skirtLength / 2 });
    commands.push({ type: "line", x: waistHalf, y: skirtLength / 2 });
    commands.push({ type: "line", x: hipHalf, y: skirtLength / 2 - hipLine });

    commands.push({
      type: "curve",
      cpX: hipHalf + (hemHalf - hipHalf) * 0.5,
      cpY: -skirtLength / 2 + skirtLength * 0.2,
      x: hemHalf,
      y: -skirtLength / 2,
    });

    commands.push({ type: "line", x: -hemHalf, y: -skirtLength / 2 });

    commands.push({
      type: "curve",
      cpX: -hipHalf - (hemHalf - hipHalf) * 0.5,
      cpY: -skirtLength / 2 + skirtLength * 0.2,
      x: -hipHalf,
      y: skirtLength / 2 - hipLine,
    });

    commands.push({ type: "line", x: -waistHalf, y: skirtLength / 2 });

    return commands;
  }

  const frontShape = createCurvedShape(buildSkirtShape());
  const backShape = createCurvedShape(buildSkirtShape());

  // Skirt hangs from waist — center Y is waist minus half the skirt length
  const skirtCenterY = profile.waistY - skirtLength / 2;
  // Use hip radius for wrapping (skirt drapes over hips)
  const skirtR = (profile.hipR + profile.waistR) / 2;

  return [
    {
      id: "front-skirt",
      name: "Front Skirt",
      color: PIECE_COLORS["front-skirt"],
      shape: frontShape,
      flatPosition: [-2.5, -2.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, skirtCenterY, skirtR],
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
      assembledPosition: [0, skirtCenterY, -skirtR],
      assembledRotation: [0, Math.PI, 0],
      cutCount: 1,
      cutOnFold: true,
      instructions: "Cut 1 on fold. Sew to front skirt at side seams.",
    },
  ];
}
