import type { BodyMeasurements } from "@/types/measurements";
import { SCALE } from "./generators/utils";

const FORM_OFFSET_Y = 0.1; // dress form <group> position offset

/**
 * Compute dress-form-relative positions and radii from body measurements.
 * Y values are in WORLD space (includes the dress form's +0.1 offset).
 * Radii are circumference / 2π — the actual radius of the body at that zone.
 *
 * These values match the DressForm.tsx profile computation exactly.
 */
export function computeDressFormProfile(measurements: BodyMeasurements) {
  // Body radii (circumference → radius)
  const bustR = (measurements.bust / (2 * Math.PI)) * SCALE;
  const waistR = (measurements.waist / (2 * Math.PI)) * SCALE;
  const hipR = (measurements.hip / (2 * Math.PI)) * SCALE;
  const neckR = (measurements.neck / (2 * Math.PI)) * SCALE;
  const armR = (measurements.upperArm / (2 * Math.PI)) * SCALE;
  const shoulderHalfW = (measurements.shoulderWidth / 2) * SCALE;

  // Y positions — mirrors DressForm.tsx dynamic profile
  const totalHeight = measurements.backLength * SCALE;
  const shoulderY = totalHeight * 0.6 + FORM_OFFSET_Y;
  const bustY = shoulderY - totalHeight * 0.25;
  const waistY = shoulderY - totalHeight * 0.65;
  const hipY = waistY - 8 * SCALE;
  const neckY = shoulderY + 0.15;

  // Midpoints useful for piece centering
  const bodiceCenterY = (bustY + waistY) / 2;
  const upperBodyY = (shoulderY + bustY) / 2;

  return {
    bustR,
    waistR,
    hipR,
    neckR,
    armR,
    shoulderHalfW,
    shoulderY,
    bustY,
    waistY,
    hipY,
    neckY,
    bodiceCenterY,
    upperBodyY,
  };
}
