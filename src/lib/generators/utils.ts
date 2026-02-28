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
