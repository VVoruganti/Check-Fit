import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { SCALE, createCurvedShape, type ShapeCommand } from "./utils";
import { PIECE_COLORS } from "@/data/piece-colors";

export function generateBodice(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  const bodice = description.bodice;
  if (!bodice) return [];

  const easeMap = { fitted: 1, "semi-fitted": 2, loose: 4 };
  const ease = easeMap[bodice.fit];

  const halfWidth = (measurements.bust / 4 + ease) * SCALE;
  const height = measurements.backLength * SCALE;

  // Neckline depth varies by style
  const neckDepthMap = { crew: 0.15, "v-neck": 0.4, scoop: 0.3, square: 0.25, boat: 0.08 };
  const neckDepth = height * neckDepthMap[bodice.neckline];
  const neckWidth = halfWidth * 0.4;

  // Armhole curves
  const armholeDepth = height * 0.45;

  const necklineStyle = bodice.neckline;
  const bodiceFit = bodice.fit;

  function buildBodiceShape(isFront: boolean): ShapeCommand[] {
    const nd = isFront ? neckDepth : neckDepth * 0.5; // back neckline is shallower
    const commands: ShapeCommand[] = [];

    // Start at top-left shoulder
    commands.push({ type: "move", x: -halfWidth, y: height / 2 - armholeDepth * 0.2 });

    // Left armhole curve down
    commands.push({
      type: "curve",
      cpX: -halfWidth - halfWidth * 0.05,
      cpY: height / 2 - armholeDepth,
      x: -halfWidth + halfWidth * 0.1,
      y: -height / 2,
    });

    // Bottom edge
    commands.push({ type: "line", x: halfWidth - halfWidth * 0.1, y: -height / 2 });

    // Right armhole curve up
    commands.push({
      type: "curve",
      cpX: halfWidth + halfWidth * 0.05,
      cpY: height / 2 - armholeDepth,
      x: halfWidth,
      y: height / 2 - armholeDepth * 0.2,
    });

    // Shoulder to neckline (right side)
    commands.push({ type: "line", x: neckWidth, y: height / 2 });

    // Neckline curve
    if (necklineStyle === "v-neck" && isFront) {
      commands.push({ type: "line", x: 0, y: height / 2 - nd });
      commands.push({ type: "line", x: -neckWidth, y: height / 2 });
    } else if (necklineStyle === "square" && isFront) {
      commands.push({ type: "line", x: neckWidth, y: height / 2 - nd });
      commands.push({ type: "line", x: -neckWidth, y: height / 2 - nd });
      commands.push({ type: "line", x: -neckWidth, y: height / 2 });
    } else {
      // crew, scoop, boat — smooth curve
      commands.push({
        type: "curve",
        cpX: 0,
        cpY: height / 2 - nd,
        x: -neckWidth,
        y: height / 2,
      });
    }

    return commands;
  }

  const frontShape = createCurvedShape(buildBodiceShape(true));
  const backShape = createCurvedShape(buildBodiceShape(false));

  const pieces: PatternPieceData[] = [
    {
      id: "front-bodice",
      name: "Front Bodice",
      color: PIECE_COLORS["front-bodice"],
      shape: frontShape,
      flatPosition: [-2.5, 1.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, 0.8, halfWidth * 3],
      assembledRotation: [0, 0, 0],
      cutCount: 1,
      cutOnFold: true,
      instructions: `Cut 1 on fold. ${necklineStyle} neckline, ${bodiceFit} fit.`,
    },
    {
      id: "back-bodice",
      name: "Back Bodice",
      color: PIECE_COLORS["back-bodice"],
      shape: backShape,
      flatPosition: [2.5, 1.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, 0.8, -halfWidth * 3],
      assembledRotation: [0, Math.PI, 0],
      cutCount: 1,
      cutOnFold: true,
      instructions: "Cut 1 on fold. Sew to front bodice at shoulders and sides.",
    },
  ];

  return pieces;
}
