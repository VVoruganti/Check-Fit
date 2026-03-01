import * as THREE from "three";

export type AssemblyRole =
  | "torso-front"
  | "torso-back"
  | "sleeve-left"
  | "sleeve-right"
  | "collar"
  | "other";

export interface PieceAssemblyMetadata {
  role?: AssemblyRole;
  anchors?: Record<string, [number, number, number]>;
}

export interface PatternPieceData {
  id: string;
  name: string;
  color: string;
  shape: THREE.Shape;
  flatPosition: [number, number, number];
  flatRotation: [number, number, number];
  assembledPosition: [number, number, number];
  assembledRotation: [number, number, number];
  cutCount: number;
  cutOnFold: boolean;
  instructions: string;
  assembly?: PieceAssemblyMetadata;
}

// Pattern pieces are now generated dynamically via generatePattern().
// See src/lib/pattern-generator.ts and src/context/PatternContext.tsx.
