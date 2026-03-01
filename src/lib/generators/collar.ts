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

export function generateCollar(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  const collar = description.collar;
  if (!collar) return [];

  const profile = computeDressFormProfile(measurements);

  const neckHalf = (measurements.neck / 2) * SCALE;

  const widthMap = { "peter-pan": 2.5, mandarin: 1.5, notched: 3.0, band: 1.0 };
  const collarWidth = widthMap[collar.style] * SCALE;

  const halfSpan = neckHalf * 1.2;

  function buildCollarShape(): ShapeCommand[] {
    const commands: ShapeCommand[] = [];

    commands.push({ type: "move", x: -halfSpan, y: 0 });
    commands.push({
      type: "curve",
      cpX: -halfSpan * 0.5,
      cpY: collarWidth * 1.5,
      x: 0,
      y: collarWidth * 1.6,
    });
    commands.push({
      type: "curve",
      cpX: halfSpan * 0.5,
      cpY: collarWidth * 1.5,
      x: halfSpan,
      y: 0,
    });

    commands.push({
      type: "curve",
      cpX: halfSpan * 0.5,
      cpY: -collarWidth * 0.3,
      x: 0,
      y: -collarWidth * 0.4,
    });
    commands.push({
      type: "curve",
      cpX: -halfSpan * 0.5,
      cpY: -collarWidth * 0.3,
      x: -halfSpan,
      y: 0,
    });

    return commands;
  }

  const shape = createCurvedShape(buildCollarShape());
  const collarAnchors = createLocalizedAnchors(shape, {
    centerFront: [0, -collarWidth * 0.35],
    centerBack: [0, collarWidth * 1.5],
    leftTip: [-halfSpan, 0],
    rightTip: [halfSpan, 0],
  });

  return [
    {
      id: "collar",
      name: "Collar",
      color: PIECE_COLORS.collar,
      shape,
      flatPosition: [0, 3.0, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, profile.neckY, 0],
      assembledRotation: [-0.3, 0, 0],
      cutCount: 2,
      cutOnFold: false,
      instructions: `Cut 2 (self + interfacing). ${collar.style} style.`,
      assembly: {
        role: "collar",
        anchors: collarAnchors,
      },
    },
  ];
}
