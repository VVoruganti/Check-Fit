import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import {
  SCALE,
  createCurvedShape,
  createLocalizedAnchors,
  type ShapeCommand,
} from "./utils";
import { PIECE_COLORS } from "@/data/piece-colors";
import { computeDressFormProfile } from "@/lib/assembly-positions";

export function generateSleeves(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  const sleeves = description.sleeves;
  if (!sleeves) return [];

  const profile = computeDressFormProfile(measurements);

  const ease = 1.5;
  const halfWidth = (measurements.upperArm / 2 + ease) * SCALE;

  const lengthMultiplier = { short: 0.35, "three-quarter": 0.7, long: 1.0 };
  const sleeveLength = measurements.armLength * lengthMultiplier[sleeves.length] * SCALE;

  const capHeight = sleeves.style === "set-in" ? halfWidth * 0.8 : halfWidth * 0.3;
  const sleeveLen = sleeves.length;
  const sleeveStyle = sleeves.style;

  function buildSleeveShape(): ShapeCommand[] {
    const commands: ShapeCommand[] = [];

    commands.push({ type: "move", x: -halfWidth, y: sleeveLength / 2 - capHeight * 0.3 });

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

    const taperAmount = sleeveLen === "long" ? halfWidth * 0.15 : 0;
    commands.push({ type: "line", x: halfWidth - taperAmount, y: -sleeveLength / 2 });
    commands.push({ type: "line", x: -(halfWidth - taperAmount), y: -sleeveLength / 2 });

    return commands;
  }

  const leftShape = createCurvedShape(buildSleeveShape());
  const rightShape = createCurvedShape(buildSleeveShape());
  const baseAnchors = {
    capTop: [0, sleeveLength / 2 + capHeight] as [number, number],
    capFront: [halfWidth * 0.78, sleeveLength / 2 + capHeight * 0.35] as [
      number,
      number,
    ],
    capBack: [-halfWidth * 0.78, sleeveLength / 2 + capHeight * 0.35] as [
      number,
      number,
    ],
    underarm: [0, -sleeveLength / 2] as [number, number],
  };
  const leftAnchors = createLocalizedAnchors(leftShape, baseAnchors);
  const rightAnchors = createLocalizedAnchors(rightShape, baseAnchors);

  // Sleeves extend horizontally from shoulders.
  // Rotate ~-90° around Z so the tube axis (local Y) points along -X (left arm).
  const armY = profile.shoulderY - 0.05;

  return [
    {
      id: "left-sleeve",
      name: "Left Sleeve",
      color: PIECE_COLORS["left-sleeve"],
      shape: leftShape,
      flatPosition: [-4, -0.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [-profile.shoulderHalfW, armY, 0],
      assembledRotation: [0, 0, -Math.PI / 2 + 0.15],
      cutCount: 1,
      cutOnFold: false,
      instructions: `Cut 1. ${sleeveLen} ${sleeveStyle} sleeve. Set cap into armhole.`,
      assembly: {
        role: "sleeve-left",
        anchors: leftAnchors,
      },
    },
    {
      id: "right-sleeve",
      name: "Right Sleeve",
      color: PIECE_COLORS["right-sleeve"],
      shape: rightShape,
      flatPosition: [4, -0.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [profile.shoulderHalfW, armY, 0],
      assembledRotation: [0, 0, Math.PI / 2 - 0.15],
      cutCount: 1,
      cutOnFold: false,
      instructions: `Cut 1. Mirror of left sleeve.`,
      assembly: {
        role: "sleeve-right",
        anchors: rightAnchors,
      },
    },
  ];
}
