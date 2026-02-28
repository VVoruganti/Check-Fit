import type { BodyMeasurements } from "@/types/measurements";
import { SCALE } from "./generators/utils";

/**
 * Compute dress-form–relative assembly positions based on measurements.
 * Returns offsets for each component zone.
 */
export function computeAssemblyProfile(measurements: BodyMeasurements) {
  const bustRadius = (measurements.bust / (2 * Math.PI)) * SCALE;
  const waistRadius = (measurements.waist / (2 * Math.PI)) * SCALE;
  const hipRadius = (measurements.hip / (2 * Math.PI)) * SCALE;

  // Vertical positions (dress form centered around 0)
  const shoulderY = measurements.backLength * SCALE * 0.5 + 0.3;
  const bustY = shoulderY - 4 * SCALE;
  const waistY = shoulderY - measurements.backLength * SCALE;
  const hipY = waistY - 8 * SCALE;

  return {
    bustRadius,
    waistRadius,
    hipRadius,
    shoulderY,
    bustY,
    waistY,
    hipY,
    // Offsets for piece placement
    bodiceZ: bustRadius * 1.1,
    skirtZ: hipRadius * 1.0,
    sleeveX: bustRadius + bustRadius * 0.8,
    collarY: shoulderY + 0.15,
    hoodY: shoulderY + bustRadius * 2,
  };
}
