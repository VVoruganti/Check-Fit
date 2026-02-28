import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { SCALE, createCurvedShape, type ShapeCommand } from "./utils";
import { PIECE_COLORS } from "@/data/piece-colors";

export function generateCollar(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  const collar = description.collar;
  if (!collar) return [];

  const neckHalf = (measurements.neck / 2) * SCALE;

  // Width varies by style
  const widthMap = { "peter-pan": 2.5, mandarin: 1.5, notched: 3.0, band: 1.0 };
  const collarWidth = widthMap[collar.style] * SCALE;

  // Crescent-shaped collar sized to neck
  const halfSpan = neckHalf * 1.2;

  function buildCollarShape(): ShapeCommand[] {
    const commands: ShapeCommand[] = [];

    // Outer edge (top, curves outward)
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

    // Inner edge (bottom, curves inward — neckline seam)
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

  return [
    {
      id: "collar",
      name: "Collar",
      color: PIECE_COLORS.collar,
      shape,
      flatPosition: [0, 3.0, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, 1.7, 0],
      assembledRotation: [-0.3, 0, 0],
      cutCount: 2,
      cutOnFold: false,
      instructions: `Cut 2 (self + interfacing). ${collar.style} style.`,
    },
  ];
}
