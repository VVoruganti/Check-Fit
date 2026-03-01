import type { LLMPieceDefinition } from "@/types/llm-piece";
import type { PatternPieceData } from "@/data/pattern-pieces";
import type { ShapeCommand } from "@/lib/generators/utils";
import { SCALE, createCurvedShape, assignFlatPositions } from "@/lib/generators/utils";
import { PIECE_COLORS } from "@/data/piece-colors";

const FALLBACK_PALETTE = [
  "#B07D62", "#7B9E89", "#8E7CC3", "#C2956B", "#6D9DB5", "#AA8A76",
  "#C47A9E", "#6BA5A5", "#B5986B", "#7A8EB5",
];

function scaleCommands(commands: ShapeCommand[]): ShapeCommand[] {
  return commands.map((cmd) => {
    switch (cmd.type) {
      case "move":
        return { type: "move", x: cmd.x * SCALE, y: cmd.y * SCALE };
      case "line":
        return { type: "line", x: cmd.x * SCALE, y: cmd.y * SCALE };
      case "curve":
        return {
          type: "curve",
          cpX: cmd.cpX * SCALE,
          cpY: cmd.cpY * SCALE,
          x: cmd.x * SCALE,
          y: cmd.y * SCALE,
        };
    }
  });
}

function resolveColor(def: LLMPieceDefinition, index: number): string {
  if (def.color) return def.color;
  if (PIECE_COLORS[def.id]) return PIECE_COLORS[def.id];
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

export function convertLLMPieces(definitions: LLMPieceDefinition[]): PatternPieceData[] {
  if (definitions.length === 0) return [];

  const pieces: PatternPieceData[] = definitions.map((def, i) => {
    const scaled = scaleCommands(def.commands);
    const shape = createCurvedShape(scaled);

    return {
      id: def.id,
      name: def.name,
      color: resolveColor(def, i),
      shape,
      flatPosition: [0, 0, 0] as [number, number, number],
      flatRotation: [0, 0, 0] as [number, number, number],
      assembledPosition: [0, 0, 0] as [number, number, number],
      assembledRotation: [0, 0, 0] as [number, number, number],
      cutCount: def.cutCount,
      cutOnFold: def.cutOnFold,
      instructions: def.instructions,
    };
  });

  return assignFlatPositions(pieces);
}
