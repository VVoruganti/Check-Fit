import * as THREE from "three";
import type { BodyMeasurements } from "@/types/measurements";
import { SCALE } from "./generators/utils";

/**
 * Resample a THREE.Shape to have many more points along its outline.
 * More outline points → finer triangulation → smoother cylindrical bending.
 */
function resampleShape(shape: THREE.Shape, divisions: number = 64): THREE.Shape {
  const points = shape.getPoints(divisions);
  if (points.length === 0) return shape;

  const newShape = new THREE.Shape();
  newShape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    newShape.lineTo(points[i].x, points[i].y);
  }
  newShape.closePath();
  return newShape;
}

/**
 * Get the appropriate wrap radius for a piece based on its ID and body measurements.
 */
export function getWrapRadius(
  pieceId: string,
  measurements: BodyMeasurements,
): number {
  const bustR = (measurements.bust / (2 * Math.PI)) * SCALE;
  const waistR = (measurements.waist / (2 * Math.PI)) * SCALE;
  const hipR = (measurements.hip / (2 * Math.PI)) * SCALE;
  const armR = (measurements.upperArm / (2 * Math.PI)) * SCALE;
  const neckR = (measurements.neck / (2 * Math.PI)) * SCALE;

  if (pieceId.includes("bodice")) return bustR * 1.03;
  if (pieceId.includes("sleeve")) return armR * 1.04;
  if (pieceId.includes("skirt")) return hipR * 1.08;
  if (pieceId.includes("pant"))
    return (measurements.thigh / (2 * Math.PI)) * SCALE * 1.08;
  if (pieceId === "collar") return neckR * 1.12;
  if (pieceId === "hood") return neckR * 1.75;
  if (pieceId === "waistband") return waistR * 1.03;
  if (pieceId.includes("pocket")) return bustR * 1.05;
  return bustR * 1.05;
}

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

/**
 * Vertical radius profile for a piece.
 * `t = 0` bottom of piece, `t = 1` top of piece.
 */
export function getWrapRadiusAtT(
  pieceId: string,
  measurements: BodyMeasurements,
  tRaw: number,
  fallbackRadius?: number,
): number {
  const t = clamp01(tRaw);
  const bustR = (measurements.bust / (2 * Math.PI)) * SCALE;
  const waistR = (measurements.waist / (2 * Math.PI)) * SCALE;
  const hipR = (measurements.hip / (2 * Math.PI)) * SCALE;
  const armR = (measurements.upperArm / (2 * Math.PI)) * SCALE;
  const neckR = (measurements.neck / (2 * Math.PI)) * SCALE;
  const shoulderR = (measurements.shoulderWidth / 2) * SCALE * 0.65;
  const thighR = (measurements.thigh / (2 * Math.PI)) * SCALE;
  const kneeR = (measurements.knee / (2 * Math.PI)) * SCALE;

  if (pieceId.includes("bodice")) {
    const upperTorsoR = bustR * 1.02;
    const shoulderZoneR = Math.max(shoulderR * 1.02, neckR + 0.065);
    const waistZoneR = waistR * 1.04;
    const lowTorsoR = waistR * 1.07;

    if (t >= 0.72) {
      return THREE.MathUtils.lerp(
        upperTorsoR,
        shoulderZoneR,
        (t - 0.72) / 0.28,
      );
    }
    if (t >= 0.24) {
      return THREE.MathUtils.lerp(waistZoneR, upperTorsoR, (t - 0.24) / 0.48);
    }
    return THREE.MathUtils.lerp(lowTorsoR, waistZoneR, t / 0.24);
  }

  if (pieceId.includes("sleeve")) {
    const cuffR = armR * 0.86;
    const capR = armR * 1.03;
    return THREE.MathUtils.lerp(cuffR, capR, t);
  }

  if (pieceId.includes("skirt")) {
    const topR = waistR * 1.03;
    const hipZoneR = hipR * 1.06;
    const hemR = hipR * 1.14;
    if (t >= 0.66) {
      return THREE.MathUtils.lerp(hipZoneR, topR, (t - 0.66) / 0.34);
    }
    return THREE.MathUtils.lerp(hemR, hipZoneR, t / 0.66);
  }

  if (pieceId.includes("pant")) {
    const topR = thighR * 1.06;
    const ankleR = kneeR * 0.96;
    return THREE.MathUtils.lerp(ankleR, topR, t);
  }

  if (pieceId === "collar") return neckR * 1.1;
  if (pieceId === "hood") return neckR * 1.65;
  if (pieceId === "waistband") return waistR * 1.03;
  if (pieceId.includes("pocket")) return bustR * 1.03;
  return fallbackRadius ?? bustR * 1.05;
}

export interface PieceGeometryData {
  geometry: THREE.ExtrudeGeometry;
  flatVerts: Float32Array;
  bentVerts: Float32Array;
}

export function bendPointAroundYAxis(
  point: [number, number, number],
  wrapRadius: number,
): [number, number, number] {
  const r = Math.max(wrapRadius, 0.08);
  const [x, y, z] = point;
  const angle = x / r;
  return [r * Math.sin(angle), y, z + r * Math.cos(angle) - r];
}

/**
 * Create an ExtrudeGeometry plus pre-computed flat and bent vertex arrays.
 * NO morph targets — we'll lerp positions manually in useFrame for reliability.
 *
 * Cylindrical bend formula (wrap around Y axis):
 *   angle = x / radius
 *   bentX  = radius * sin(angle)
 *   bentZ  = z + radius * cos(angle) - radius
 *   bentY  = y  (unchanged)
 */
export function createPieceGeometry(
  shape: THREE.Shape,
  wrapRadius: number,
  options?: { pieceId?: string; measurements?: BodyMeasurements },
): PieceGeometryData {
  const r = Math.max(wrapRadius, 0.08);

  // Resample outline for many vertices → smoother bend
  const hiRes = resampleShape(shape, 64);

  const geometry = new THREE.ExtrudeGeometry(hiRes, {
    depth: 0.02,
    bevelEnabled: false,
  });
  geometry.center();

  const positions = geometry.getAttribute("position");
  const flatVerts = new Float32Array(positions.array as ArrayLike<number>);
  const bentVerts = new Float32Array(positions.count * 3);
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const ySpan = Math.max(maxY - minY, 1e-6);
  const useAdaptiveRadius =
    Boolean(options?.pieceId) && Boolean(options?.measurements);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const t = (y - minY) / ySpan;
    const currentR = useAdaptiveRadius
      ? getWrapRadiusAtT(options!.pieceId!, options!.measurements!, t, r)
      : r;
    const bent = bendPointAroundYAxis([x, y, z], currentR);
    bentVerts[i * 3] = bent[0];
    bentVerts[i * 3 + 1] = bent[1];
    bentVerts[i * 3 + 2] = bent[2];
  }

  return { geometry, flatVerts, bentVerts };
}
