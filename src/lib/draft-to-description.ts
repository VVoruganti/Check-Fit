import type { GarmentDescription } from "@/types/garment";
import type { DraftPiece, DraftPieceType } from "@/types/draft-piece";

/**
 * Component keys in GarmentDescription that map to DraftPieceType.
 * "cuffs" maps to sleeves.hasCuff rather than its own top-level key.
 */
const TYPE_TO_COMPONENT: Record<DraftPieceType, keyof GarmentDescription | null> = {
  bodice: "bodice",
  sleeves: "sleeves",
  collar: "collar",
  hood: "hood",
  skirt: "skirt",
  pants: "pants",
  waistband: "waistband",
  pockets: "pockets",
  cuffs: null, // handled via sleeves.hasCuff
};

/**
 * Takes a full GarmentDescription from the LLM and a DraftPiece[] with
 * user toggles, returns a filtered GarmentDescription with disabled
 * components stripped. Generators already check `if (!description.bodice) return []`
 * so this is the only bridge needed.
 */
export function applyDraftPieces(
  base: GarmentDescription,
  drafts: DraftPiece[],
): GarmentDescription {
  const enabledTypes = new Set(
    drafts.filter((d) => d.enabled).map((d) => d.type),
  );

  const result: GarmentDescription = {
    category: base.category,
    summary: base.summary,
    closure: base.closure,
  };

  for (const [type, componentKey] of Object.entries(TYPE_TO_COMPONENT)) {
    if (!componentKey) continue;
    if (enabledTypes.has(type as DraftPieceType) && base[componentKey]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[componentKey] = base[componentKey];
    }
  }

  // Handle cuffs: if cuffs are disabled but sleeves are present, set hasCuff = false
  if (result.sleeves && !enabledTypes.has("cuffs")) {
    result.sleeves = { ...result.sleeves, hasCuff: false };
  }

  return result;
}
