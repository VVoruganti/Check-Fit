// GarmentDescription — the contract between VLM analysis and pattern generator

export type NecklineStyle = "crew" | "v-neck" | "scoop" | "square" | "boat";
export type SleeveStyle = "set-in" | "raglan" | "kimono";
export type SleeveLength = "short" | "three-quarter" | "long";
export type CollarStyle = "peter-pan" | "mandarin" | "notched" | "band";
export type SkirtShape = "a-line" | "straight" | "circle" | "pencil";
export type GarmentLength = "mini" | "knee" | "midi" | "maxi";
export type PantFit = "slim" | "straight" | "wide-leg";
export type PantLength = "shorts" | "capri" | "ankle" | "full";
export type ClosureType = "none" | "buttons" | "zipper" | "pullover";
export type ClosurePlacement = "front" | "back" | "side" | "none";
export type GarmentCategory = "dress" | "top" | "hoodie" | "jacket" | "pants" | "skirt" | "jumpsuit";

export interface GarmentDescription {
  category: GarmentCategory;
  summary: string;

  bodice?: {
    present: true;
    neckline: NecklineStyle;
    hasDarts: boolean;
    fit: "fitted" | "semi-fitted" | "loose";
  };
  sleeves?: {
    present: true;
    style: SleeveStyle;
    length: SleeveLength;
    hasCuff: boolean;
  };
  collar?: {
    present: true;
    style: CollarStyle;
  };
  hood?: {
    present: true;
  };
  skirt?: {
    present: true;
    shape: SkirtShape;
    length: GarmentLength;
  };
  pants?: {
    present: true;
    fit: PantFit;
    length: PantLength;
  };
  waistband?: {
    present: true;
    style: "straight" | "elastic" | "contoured";
    width: number;
  };
  pockets?: {
    present: true;
    style: "patch" | "inseam" | "kangaroo";
    count: number;
  };
  cuffs?: {
    present: true;
    style: "straight" | "ribbed" | "folded";
  };
  closure: {
    type: ClosureType;
    placement: ClosurePlacement;
  };
}
