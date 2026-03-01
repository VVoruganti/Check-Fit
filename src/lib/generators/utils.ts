import * as THREE from "three";
import type { PatternPieceData } from "@/data/pattern-pieces";

// 1 inch = 0.083 Three.js units (consistent scale)
export const SCALE = 0.083;

/** Build a THREE.Shape from an array of [x, y] points (straight lines). */
export function createShape(points: [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();
  return shape;
}

/** Build a THREE.Shape using moveTo, lineTo, and quadraticCurveTo commands. */
export type ShapeCommand =
  | { type: "move"; x: number; y: number }
  | { type: "line"; x: number; y: number }
  | { type: "curve"; cpX: number; cpY: number; x: number; y: number };

export function createCurvedShape(commands: ShapeCommand[]): THREE.Shape {
  const shape = new THREE.Shape();
  for (const cmd of commands) {
    switch (cmd.type) {
      case "move":
        shape.moveTo(cmd.x, cmd.y);
        break;
      case "line":
        shape.lineTo(cmd.x, cmd.y);
        break;
      case "curve":
        shape.quadraticCurveTo(cmd.cpX, cmd.cpY, cmd.x, cmd.y);
        break;
    }
  }
  shape.closePath();
  return shape;
}

function getShapeBounds(
  shape: THREE.Shape,
  divisions: number = 80,
): { minX: number; maxX: number; minY: number; maxY: number } {
  const pts = shape.getPoints(divisions);
  if (pts.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = pts[0].x;
  let maxX = pts[0].x;
  let minY = pts[0].y;
  let maxY = pts[0].y;

  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Convert anchor points expressed in shape coordinates to local coordinates
 * centered like the extruded geometry (geometry.center()).
 */
export function createLocalizedAnchors(
  shape: THREE.Shape,
  anchors: Record<string, [number, number]>,
): Record<string, [number, number, number]> {
  const bounds = getShapeBounds(shape);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  const out: Record<string, [number, number, number]> = {};
  for (const [key, point] of Object.entries(anchors)) {
    out[key] = [point[0] - centerX, point[1] - centerY, 0];
  }
  return out;
}

/** Auto-layout pieces in a grid for flat/exploded view. */
export function assignFlatPositions(pieces: PatternPieceData[]): PatternPieceData[] {
  const cols = Math.ceil(Math.sqrt(pieces.length));
  const spacing = 3.0;

  return pieces.map((piece, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const totalCols = Math.min(pieces.length - row * cols, cols);
    const offsetX = -(totalCols - 1) * spacing / 2;
    const offsetY = -(Math.ceil(pieces.length / cols) - 1) * spacing / 4;

    return {
      ...piece,
      flatPosition: [
        offsetX + col * spacing,
        offsetY - row * spacing + 1,
        0,
      ] as [number, number, number],
    };
  });
}
