import type { ShapeCommand } from "@/lib/generators/utils";

export interface LLMPieceDefinition {
  id: string;
  name: string;
  commands: ShapeCommand[];
  cutCount: number;
  cutOnFold: boolean;
  instructions: string;
  color?: string;
}
