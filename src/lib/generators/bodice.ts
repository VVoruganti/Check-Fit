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

export function generateBodice(
  measurements: BodyMeasurements,
  description: GarmentDescription,
): PatternPieceData[] {
  const bodice = description.bodice;
  if (!bodice) return [];

  const profile = computeDressFormProfile(measurements);

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
    const nd = isFront ? neckDepth : neckDepth * 0.5;
    const commands: ShapeCommand[] = [];

    commands.push({ type: "move", x: -halfWidth, y: height / 2 - armholeDepth * 0.2 });

    commands.push({
      type: "curve",
      cpX: -halfWidth - halfWidth * 0.05,
      cpY: height / 2 - armholeDepth,
      x: -halfWidth + halfWidth * 0.1,
      y: -height / 2,
    });

    commands.push({ type: "line", x: halfWidth - halfWidth * 0.1, y: -height / 2 });

    commands.push({
      type: "curve",
      cpX: halfWidth + halfWidth * 0.05,
      cpY: height / 2 - armholeDepth,
      x: halfWidth,
      y: height / 2 - armholeDepth * 0.2,
    });

    commands.push({ type: "line", x: neckWidth, y: height / 2 });

    if (necklineStyle === "v-neck" && isFront) {
      commands.push({ type: "line", x: 0, y: height / 2 - nd });
      commands.push({ type: "line", x: -neckWidth, y: height / 2 });
    } else if (necklineStyle === "square" && isFront) {
      commands.push({ type: "line", x: neckWidth, y: height / 2 - nd });
      commands.push({ type: "line", x: -neckWidth, y: height / 2 - nd });
      commands.push({ type: "line", x: -neckWidth, y: height / 2 });
    } else {
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
  const topY = height / 2;
  const bottomY = -height / 2;
  const armholeY = height / 2 - armholeDepth * 0.2;
  const sideY = bottomY + height * 0.18;

  const frontAnchors = createLocalizedAnchors(frontShape, {
    shoulderLeft: [-halfWidth * 0.92, armholeY],
    shoulderRight: [halfWidth * 0.92, armholeY],
    armholeLeft: [-halfWidth * 0.96, armholeY - armholeDepth * 0.18],
    armholeRight: [halfWidth * 0.96, armholeY - armholeDepth * 0.18],
    sideLeft: [-halfWidth * 0.86, sideY],
    sideRight: [halfWidth * 0.86, sideY],
    neckCenter: [0, topY - neckDepth],
  });

  const backAnchors = createLocalizedAnchors(backShape, {
    shoulderLeft: [-halfWidth * 0.92, armholeY],
    shoulderRight: [halfWidth * 0.92, armholeY],
    armholeLeft: [-halfWidth * 0.96, armholeY - armholeDepth * 0.18],
    armholeRight: [halfWidth * 0.96, armholeY - armholeDepth * 0.18],
    sideLeft: [-halfWidth * 0.86, sideY],
    sideRight: [halfWidth * 0.86, sideY],
    neckCenter: [0, topY - neckDepth * 0.5],
  });

  return [
    {
      id: "front-bodice",
      name: "Front Bodice",
      color: PIECE_COLORS["front-bodice"],
      shape: frontShape,
      flatPosition: [-2.5, 1.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, profile.bodiceCenterY, profile.bustR],
      assembledRotation: [0, 0, 0],
      cutCount: 1,
      cutOnFold: true,
      instructions: `Cut 1 on fold. ${necklineStyle} neckline, ${bodiceFit} fit.`,
      assembly: {
        role: "torso-front",
        anchors: frontAnchors,
      },
    },
    {
      id: "back-bodice",
      name: "Back Bodice",
      color: PIECE_COLORS["back-bodice"],
      shape: backShape,
      flatPosition: [2.5, 1.5, 0],
      flatRotation: [0, 0, 0],
      assembledPosition: [0, profile.bodiceCenterY, -profile.bustR],
      assembledRotation: [0, Math.PI, 0],
      cutCount: 1,
      cutOnFold: true,
      instructions: "Cut 1 on fold. Sew to front bodice at shoulders and sides.",
      assembly: {
        role: "torso-back",
        anchors: backAnchors,
      },
    },
  ];
}
