export interface BodyMeasurements {
  // Upper body (inches)
  bust: number;
  waist: number;
  shoulderWidth: number;
  armLength: number;
  upperArm: number;
  neck: number;
  backLength: number;
  frontLength: number;

  // Lower body (inches)
  hip: number;
  inseam: number;
  thigh: number;
  knee: number;
}

export type MeasurementKey = keyof BodyMeasurements;

export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  bust: "Bust",
  waist: "Waist",
  shoulderWidth: "Shoulder Width",
  armLength: "Arm Length",
  upperArm: "Upper Arm",
  neck: "Neck",
  backLength: "Back Length",
  frontLength: "Front Length",
  hip: "Hip",
  inseam: "Inseam",
  thigh: "Thigh",
  knee: "Knee",
};

export const UPPER_BODY_KEYS: MeasurementKey[] = [
  "bust", "waist", "shoulderWidth", "armLength",
  "upperArm", "neck", "backLength", "frontLength",
];

export const LOWER_BODY_KEYS: MeasurementKey[] = [
  "hip", "inseam", "thigh", "knee",
];
