export type DraftPieceType =
  | "bodice"
  | "sleeves"
  | "collar"
  | "hood"
  | "skirt"
  | "pants"
  | "waistband"
  | "pockets"
  | "cuffs";

export interface DraftPiece {
  id: string;
  name: string;
  type: DraftPieceType;
  quantity: number;
  notes: string;
  enabled: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
