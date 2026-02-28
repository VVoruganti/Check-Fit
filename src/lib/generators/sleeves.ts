import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { SCALE, createCurvedShape, type ShapeCommand } from "./utils";
import { PIECE_COLORS } from "@/data/piece-colors";

export function generateSleeves(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  const sleeves = description.sleeves;
  if (!sleeves) return [];

  const ease = 1.5;
  const halfWidth = (measurements.upperArm / 2 + ease) * SCALE;

  // Length multiplier based on sleeve length
  const lengthMultiplier = { short: 0.35, "three-quarter": 0.7, long: 1.0 };
  const sleeveLength = measurements.armLength * lengthMultiplier[sleeves.length] * SCALE;

  // Sleeve cap height (~40% of width for set-in)
  const capHeight = sleeves.style === "set-in" ? halfWidth * 0.8 : halfWidth * 0.3;
  const sleeveLen = sleeves.length;
  const sleeveStyle = sleeves.style;

  function buildSleeveShape(): ShapeCommand[] {
    const commands: ShapeCommand[] = [];

    // Start at top-left of cap
    commands.push({ type: "move", x: -halfWidth, y: sleeveLength / 2 - capHeight * 0.3 });

    // Sleeve cap curve (bell-shaped)
    commands.push({
      type: "curve",
      cpX: -halfWidth * 0.5,
      cpY: sleeveLength / 2 + capHeight,
      x: 0,
      y: sleeveLength / 2 + capHeight,
    });
    commands.push({
      type: "curve",
      cpX: halfWidth * 0.5,
      cpY: sleeveLength / 2 + capHeight,
      x: halfWidth,
      y: sleeveLength / 2 - capHeight * 0.3,
    });

    // Right side down
    const taperAmount = sleeveLen === "long" ? halfWidth * 0.15 : 0;
    commands.push({ type: "line", x: halfWidth - taperAmount, y: -sleeveLength / 2 });

    // Bottom edge (possibly with cuff notch)
    commands.push({ type: "line", x: -(halfWidth - taperAmount), y: -sleeveLength / 2 });

    // Left side up
    // closes back to start

    return commands;
  }

  const shape = buildSleeveShape();
  const leftShape = createCurvedShape(shape);
  const rightShape = createCurvedShape(shape);

  const pieces: PatternPieceData[] = [
    {
      id: "left-sleeve",
      name: "Left Sleeve",
      color: PIECE_COLORS["left-sleeve"],
      shape: leftShape,
      flatPosition: [-4, -0.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [-1.0, 0.8, 0],
      assembledRotation: [0, 0, -0.3],
      cutCount: 1,
      cutOnFold: false,
      instructions: `Cut 1. ${sleeveLen} ${sleeveStyle} sleeve. Set cap into armhole.`,
    },
    {
      id: "right-sleeve",
      name: "Right Sleeve",
      color: PIECE_COLORS["right-sleeve"],
      shape: rightShape,
      flatPosition: [4, -0.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [1.0, 0.8, 0],
      assembledRotation: [0, 0, 0.3],
      cutCount: 1,
      cutOnFold: false,
      instructions: `Cut 1. Mirror of left sleeve.`,
    },
  ];

  return pieces;
}
