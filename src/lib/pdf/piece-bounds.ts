import type * as THREE from "three";
import { THREEJS_TO_INCHES } from "./constants";

export interface PieceBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  widthInches: number;
  heightInches: number;
  areaInches: number;
}

/**
 * Compute bounding box and area of a THREE.Shape in inches.
 * Uses shape.getPoints() and the shoelace formula for area.
 */
export function getPieceBounds(shape: THREE.Shape): PieceBounds {
  const pts = shape.getPoints(80);
  if (pts.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, widthInches: 0, heightInches: 0, areaInches: 0 };
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

  // Shoelace formula for area (in Three.js units²)
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  area = Math.abs(area) / 2;

  const scale = THREEJS_TO_INCHES;
  return {
    minX,
    maxX,
    minY,
    maxY,
    widthInches: (maxX - minX) * scale,
    heightInches: (maxY - minY) * scale,
    areaInches: area * scale * scale,
  };
}
