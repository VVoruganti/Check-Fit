import type { MeasurementKey } from "@/types/measurements";
import type { DraftPieceType } from "@/types/draft-piece";

const TYPE_MEASUREMENTS: Record<DraftPieceType, MeasurementKey[]> = {
  bodice: ["bust", "waist", "shoulderWidth", "neck", "backLength", "frontLength"],
  sleeves: ["armLength", "upperArm", "shoulderWidth"],
  collar: ["neck"],
  hood: ["neck"],
  skirt: ["waist", "hip"],
  pants: ["waist", "hip", "inseam", "thigh", "knee"],
  waistband: ["waist"],
  pockets: [],
  cuffs: ["upperArm"],
};

/**
 * Given enabled draft piece types, return the set of measurement keys
 * that are actually relevant for the current garment.
 */
export function getRelevantMeasurements(
  enabledTypes: DraftPieceType[],
): MeasurementKey[] {
  const keys = new Set<MeasurementKey>();
  for (const type of enabledTypes) {
    for (const key of TYPE_MEASUREMENTS[type]) {
      keys.add(key);
    }
  }
  return Array.from(keys);
}
