import type { BodyMeasurements } from "@/types/measurements";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { generateBodice } from "./bodice";
import { generateSleeves } from "./sleeves";
import { generateSkirt } from "./skirt";
import { generateCollar } from "./collar";
import { generatePants } from "./pants";
import { generateHood } from "./hood";
import { generateWaistband } from "./waistband";
import { generatePockets } from "./pockets";

export type PieceGenerator = (
  measurements: BodyMeasurements,
  description: GarmentDescription,
) => PatternPieceData[];

// Registry: ordered list of generators. Each checks description for its component.
export const GENERATORS: PieceGenerator[] = [
  generateBodice,
  generateSleeves,
  generateCollar,
  generateHood,
  generateSkirt,
  generatePants,
  generateWaistband,
  generatePockets,
];
