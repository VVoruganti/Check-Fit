import * as THREE from "three";

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
}

// Pattern pieces are now generated dynamically via generatePattern().
// See src/lib/pattern-generator.ts and src/context/PatternContext.tsx.
