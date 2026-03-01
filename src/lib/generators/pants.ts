import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { SCALE, createCurvedShape, type ShapeCommand } from "./utils";
import { PIECE_COLORS } from "@/data/piece-colors";
import { computeDressFormProfile } from "@/lib/assembly-positions";

export function generatePants(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  const pants = description.pants;
  if (!pants) return [];

  const profile = computeDressFormProfile(measurements);

  const waistQuarter = (measurements.waist / 4) * SCALE;
  const hipQuarter = (measurements.hip / 4) * SCALE;
  const thighHalf = (measurements.thigh / 2) * SCALE;
  const kneeHalf = (measurements.knee / 2) * SCALE;

  const lengthMap = { shorts: 0.3, capri: 0.65, ankle: 0.9, full: 1.0 };
  const pantLength = measurements.inseam * lengthMap[pants.length] * SCALE;

  const fitMultiplier = { slim: 0.85, straight: 1.0, "wide-leg": 1.4 };
  const hemHalf = kneeHalf * fitMultiplier[pants.fit];

  const crotchDepth = 10.5 * SCALE;
  const crotchExtension = hipQuarter * 0.3;

  function buildPantShape(isFront: boolean): ShapeCommand[] {
    const commands: ShapeCommand[] = [];
    const crotchExt = isFront ? crotchExtension * 0.7 : crotchExtension;

    commands.push({ type: "move", x: -waistQuarter * 0.1, y: pantLength / 2 });
    commands.push({ type: "line", x: waistQuarter, y: pantLength / 2 });
    commands.push({ type: "line", x: hipQuarter, y: pantLength / 2 - crotchDepth * 0.5 });
    commands.push({
      type: "curve",
      cpX: hipQuarter * 1.05,
      cpY: 0,
      x: hemHalf,
      y: -pantLength / 2,
    });

    commands.push({ type: "line", x: -hemHalf * 0.3, y: -pantLength / 2 });

    commands.push({
      type: "curve",
      cpX: -thighHalf * 0.3,
      cpY: 0,
      x: -crotchExt,
      y: pantLength / 2 - crotchDepth,
    });

    commands.push({
      type: "curve",
      cpX: -crotchExt,
      cpY: pantLength / 2 - crotchDepth * 0.5,
      x: -waistQuarter * 0.1,
      y: pantLength / 2,
    });

    return commands;
  }

  const frontShape = createCurvedShape(buildPantShape(true));
  const backShape = createCurvedShape(buildPantShape(false));

  const pantCenterY = profile.hipY - pantLength / 2;
  const thighR = (measurements.thigh / (2 * Math.PI)) * SCALE;

  return [
    {
      id: "left-pant",
      name: "Front Pant",
      color: PIECE_COLORS["left-pant"],
      shape: frontShape,
      flatPosition: [-2.5, 0, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, pantCenterY, thighR],
      assembledRotation: [0, 0, 0],
      cutCount: 2,
      cutOnFold: false,
      instructions: `Cut 2. ${pants.fit} fit, ${pants.length} length.`,
    },
    {
      id: "right-pant",
      name: "Back Pant",
      color: PIECE_COLORS["right-pant"],
      shape: backShape,
      flatPosition: [2.5, 0, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, pantCenterY, -thighR],
      assembledRotation: [0, Math.PI, 0],
      cutCount: 2,
      cutOnFold: false,
      instructions: "Cut 2. Mirror for left/right. Sew inseam and side seams.",
    },
  ];
}
