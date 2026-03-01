import * as THREE from "three";
import type { PatternPieceData } from "@/data/pattern-pieces";
import type { BodyMeasurements } from "@/types/measurements";
import { computeDressFormProfile } from "@/lib/assembly-positions";
import {
  bendPointAroundYAxis,
  getWrapRadius,
  getWrapRadiusAtT,
} from "@/lib/wrap-geometry";

export interface SolvedPieceTransform {
  position: [number, number, number];
  rotation: [number, number, number];
}

export type SolvedTransformMap = Record<string, SolvedPieceTransform>;

interface PieceState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  anchors: Record<string, THREE.Vector3>;
}

interface SeamConstraint {
  aPieceId: string;
  aAnchor: string;
  bPieceId: string;
  bAnchor: string;
  stiffness: number;
}

interface TargetConstraint {
  pieceId: string;
  anchor: string;
  target: THREE.Vector3;
  stiffness: number;
}

function toTuple(v: THREE.Vector3): [number, number, number] {
  return [v.x, v.y, v.z];
}

function buildAnchorMap(
  piece: PatternPieceData,
  measurements: BodyMeasurements | undefined,
): Record<string, THREE.Vector3> {
  const raw = piece.assembly?.anchors;
  if (!raw) return {};

  const out: Record<string, THREE.Vector3> = {};
  const radius = measurements ? getWrapRadius(piece.id, measurements) : 0.5;
  const entries = Object.entries(raw);
  const ys = entries.map(([, point]) => point[1]);
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 1;
  const ySpan = Math.max(maxY - minY, 1e-6);

  for (const [name, local] of entries) {
    const t = (local[1] - minY) / ySpan;
    const adaptiveR =
      measurements
        ? getWrapRadiusAtT(piece.id, measurements, t, radius)
        : radius;
    const bent = bendPointAroundYAxis(local, adaptiveR);
    out[name] = new THREE.Vector3(bent[0], bent[1], bent[2]);
  }

  return out;
}

function worldAnchor(
  state: PieceState | undefined,
  anchorName: string,
): THREE.Vector3 | null {
  if (!state) return null;
  const local = state.anchors[anchorName];
  if (!local) return null;
  return local.clone().applyEuler(state.rotation).add(state.position);
}

function addTarget(
  list: TargetConstraint[],
  pieceId: string,
  anchor: string,
  target: [number, number, number],
  stiffness: number,
) {
  list.push({
    pieceId,
    anchor,
    target: new THREE.Vector3(target[0], target[1], target[2]),
    stiffness,
  });
}

function addSeam(
  list: SeamConstraint[],
  aPieceId: string,
  aAnchor: string,
  bPieceId: string,
  bAnchor: string,
  stiffness: number,
) {
  list.push({ aPieceId, aAnchor, bPieceId, bAnchor, stiffness });
}

function bandT(topY: number, bottomY: number, y: number): number {
  const denom = topY - bottomY;
  if (Math.abs(denom) < 1e-6) return 0;
  return THREE.MathUtils.clamp((topY - y) / denom, 0, 1);
}

function torsoRadiusAtY(
  profile: ReturnType<typeof computeDressFormProfile>,
  y: number,
): number {
  const neckBaseR = profile.neckR + 0.08;
  const upperChestR = profile.bustR * 0.88;

  if (y >= profile.shoulderY) {
    const t = bandT(profile.neckY, profile.shoulderY, y);
    return THREE.MathUtils.lerp(neckBaseR, upperChestR, t);
  }
  if (y >= profile.bustY) {
    const t = bandT(profile.shoulderY, profile.bustY, y);
    return THREE.MathUtils.lerp(upperChestR, profile.bustR, t);
  }
  if (y >= profile.waistY) {
    const t = bandT(profile.bustY, profile.waistY, y);
    return THREE.MathUtils.lerp(profile.bustR, profile.waistR, t);
  }
  if (y >= profile.hipY) {
    const t = bandT(profile.waistY, profile.hipY, y);
    return THREE.MathUtils.lerp(profile.waistR, profile.hipR, t);
  }

  return profile.hipR;
}

function cylindricalPoint(y: number, radius: number, angleDeg: number): [number, number, number] {
  const angle = THREE.MathUtils.degToRad(angleDeg);
  return [Math.sin(angle) * radius, y, Math.cos(angle) * radius];
}

function torsoTarget(
  profile: ReturnType<typeof computeDressFormProfile>,
  y: number,
  angleDeg: number,
  radialScale: number,
): [number, number, number] {
  const r = torsoRadiusAtY(profile, y) * radialScale;
  return cylindricalPoint(y, r, angleDeg);
}

export function solveAssembledTransforms(
  pieces: PatternPieceData[],
  measurements?: BodyMeasurements,
): SolvedTransformMap {
  const solved: SolvedTransformMap = {};
  for (const piece of pieces) {
    solved[piece.id] = {
      position: [...piece.assembledPosition] as [number, number, number],
      rotation: [...piece.assembledRotation] as [number, number, number],
    };
  }

  if (!measurements) return solved;

  const profile = computeDressFormProfile(measurements);
  const states = new Map<string, PieceState>();

  for (const piece of pieces) {
    const role = piece.assembly?.role;
    const rotation = [...piece.assembledRotation] as [number, number, number];

    // Keep sleeve axes stable so cylindrical wrapping tracks arm direction.
    if (role === "sleeve-left") rotation[2] = -Math.PI / 2;
    if (role === "sleeve-right") rotation[2] = Math.PI / 2;

    states.set(piece.id, {
      position: new THREE.Vector3(
        piece.assembledPosition[0],
        piece.assembledPosition[1],
        piece.assembledPosition[2],
      ),
      rotation: new THREE.Euler(rotation[0], rotation[1], rotation[2], "XYZ"),
      anchors: buildAnchorMap(piece, measurements),
    });
  }

  const ids = new Set(pieces.map((p) => p.id));
  const has = (id: string) => ids.has(id);

  const seams: SeamConstraint[] = [];
  const targets: TargetConstraint[] = [];

  if (has("front-bodice") && has("back-bodice")) {
    addSeam(seams, "front-bodice", "sideLeft", "back-bodice", "sideRight", 0.22);
    addSeam(seams, "front-bodice", "sideRight", "back-bodice", "sideLeft", 0.22);
    addSeam(
      seams,
      "front-bodice",
      "shoulderLeft",
      "back-bodice",
      "shoulderRight",
      0.16,
    );
    addSeam(
      seams,
      "front-bodice",
      "shoulderRight",
      "back-bodice",
      "shoulderLeft",
      0.16,
    );

    addTarget(
      targets,
      "front-bodice",
      "neckCenter",
      torsoTarget(profile, profile.neckY - 0.02, 0, 1.02),
      0.24,
    );
    addTarget(
      targets,
      "back-bodice",
      "neckCenter",
      torsoTarget(profile, profile.neckY - 0.02, 180, 1.02),
      0.24,
    );

    const shoulderY = profile.shoulderY - 0.02;
    addTarget(
      targets,
      "front-bodice",
      "shoulderLeft",
      torsoTarget(profile, shoulderY, -34, 1.03),
      0.18,
    );
    addTarget(
      targets,
      "front-bodice",
      "shoulderRight",
      torsoTarget(profile, shoulderY, 34, 1.03),
      0.18,
    );
    addTarget(
      targets,
      "back-bodice",
      "shoulderLeft",
      torsoTarget(profile, shoulderY, 146, 1.03),
      0.18,
    );
    addTarget(
      targets,
      "back-bodice",
      "shoulderRight",
      torsoTarget(profile, shoulderY, -146, 1.03),
      0.18,
    );

    const armholeY = profile.bustY + (profile.shoulderY - profile.bustY) * 0.42;
    addTarget(
      targets,
      "front-bodice",
      "armholeLeft",
      torsoTarget(profile, armholeY, -72, 1.04),
      0.16,
    );
    addTarget(
      targets,
      "front-bodice",
      "armholeRight",
      torsoTarget(profile, armholeY, 72, 1.04),
      0.16,
    );
    addTarget(
      targets,
      "back-bodice",
      "armholeLeft",
      torsoTarget(profile, armholeY, 108, 1.04),
      0.16,
    );
    addTarget(
      targets,
      "back-bodice",
      "armholeRight",
      torsoTarget(profile, armholeY, -108, 1.04),
      0.16,
    );

    const sideY = profile.bustY + (profile.waistY - profile.bustY) * 0.62;
    addTarget(
      targets,
      "front-bodice",
      "sideLeft",
      torsoTarget(profile, sideY, -100, 1.03),
      0.14,
    );
    addTarget(
      targets,
      "front-bodice",
      "sideRight",
      torsoTarget(profile, sideY, 100, 1.03),
      0.14,
    );
    addTarget(
      targets,
      "back-bodice",
      "sideLeft",
      torsoTarget(profile, sideY, 100, 1.03),
      0.14,
    );
    addTarget(
      targets,
      "back-bodice",
      "sideRight",
      torsoTarget(profile, sideY, -100, 1.03),
      0.14,
    );
  }

  if (has("left-sleeve")) {
    addTarget(
      targets,
      "left-sleeve",
      "capTop",
      [-profile.shoulderHalfW - profile.armR * 0.92, profile.shoulderY - 0.06, 0],
      0.22,
    );
    addTarget(
      targets,
      "left-sleeve",
      "underarm",
      [
        -profile.shoulderHalfW - profile.armR * 1.9,
        profile.shoulderY - profile.armR * 1.25,
        0,
      ],
      0.11,
    );
    if (has("front-bodice")) {
      addSeam(seams, "front-bodice", "armholeLeft", "left-sleeve", "capFront", 0.2);
    }
    if (has("back-bodice")) {
      addSeam(seams, "back-bodice", "armholeRight", "left-sleeve", "capBack", 0.2);
    }
  }

  if (has("right-sleeve")) {
    addTarget(
      targets,
      "right-sleeve",
      "capTop",
      [profile.shoulderHalfW + profile.armR * 0.92, profile.shoulderY - 0.06, 0],
      0.22,
    );
    addTarget(
      targets,
      "right-sleeve",
      "underarm",
      [
        profile.shoulderHalfW + profile.armR * 1.9,
        profile.shoulderY - profile.armR * 1.25,
        0,
      ],
      0.11,
    );
    if (has("front-bodice")) {
      addSeam(seams, "front-bodice", "armholeRight", "right-sleeve", "capFront", 0.2);
    }
    if (has("back-bodice")) {
      addSeam(seams, "back-bodice", "armholeLeft", "right-sleeve", "capBack", 0.2);
    }
  }

  if (has("collar")) {
    if (has("front-bodice")) {
      addSeam(seams, "collar", "centerFront", "front-bodice", "neckCenter", 0.26);
    }
    if (has("back-bodice")) {
      addSeam(seams, "collar", "centerBack", "back-bodice", "neckCenter", 0.26);
    }
    addTarget(
      targets,
      "collar",
      "centerBack",
      torsoTarget(profile, profile.neckY + 0.02, 180, 0.98),
      0.16,
    );
    addTarget(
      targets,
      "collar",
      "leftTip",
      torsoTarget(profile, profile.neckY, -80, 1.02),
      0.12,
    );
    addTarget(
      targets,
      "collar",
      "rightTip",
      torsoTarget(profile, profile.neckY, 80, 1.02),
      0.12,
    );
  }

  const iterations = 42;
  for (let i = 0; i < iterations; i++) {
    for (const seam of seams) {
      const aState = states.get(seam.aPieceId);
      const bState = states.get(seam.bPieceId);
      const a = worldAnchor(aState, seam.aAnchor);
      const b = worldAnchor(bState, seam.bAnchor);
      if (!aState || !bState || !a || !b) continue;

      const delta = b.sub(a).multiplyScalar(0.5 * seam.stiffness);
      aState.position.add(delta);
      bState.position.sub(delta);
    }

    for (const target of targets) {
      const state = states.get(target.pieceId);
      const anchor = worldAnchor(state, target.anchor);
      if (!state || !anchor) continue;
      const delta = target.target.clone().sub(anchor).multiplyScalar(target.stiffness);
      state.position.add(delta);
    }

    const front = states.get("front-bodice");
    if (front && front.position.z < profile.bustR * 0.74) {
      front.position.z = THREE.MathUtils.lerp(front.position.z, profile.bustR * 0.74, 0.35);
    }

    const back = states.get("back-bodice");
    if (back && back.position.z > -profile.bustR * 0.74) {
      back.position.z = THREE.MathUtils.lerp(back.position.z, -profile.bustR * 0.74, 0.35);
    }
  }

  for (const piece of pieces) {
    const state = states.get(piece.id);
    if (!state) continue;

    solved[piece.id] = {
      position: toTuple(state.position),
      rotation: [state.rotation.x, state.rotation.y, state.rotation.z],
    };
  }

  return solved;
}
