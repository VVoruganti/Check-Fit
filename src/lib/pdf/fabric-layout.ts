import type { jsPDF } from "jspdf";
import type { PatternPieceData } from "@/data/pattern-pieces";
import {
  MARGIN,
  PRINTABLE_WIDTH,
  PRINTABLE_HEIGHT,
  SEAM_ALLOWANCE,
  DEFAULT_FABRIC_WIDTH,
  FONT,
} from "./constants";
import { getPieceBounds, type PieceBounds } from "./piece-bounds";

interface PlacedPiece {
  pieceIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isFoldCopy: boolean;
}

export interface FabricLayout {
  fabricWidth: number;
  fabricLength: number;
  fabricYards: number;
  isFolded: boolean;
  placements: PlacedPiece[];
}

/**
 * Compute fabric layout using shelf-packing algorithm.
 *
 * - Fabric is folded in half (usable width = fabricWidth / 2).
 * - cutOnFold pieces are placed at full width against fold edge.
 * - Other pieces placed within half-width, repeated per cutCount.
 * - Shelf packing: sort by height descending, fill rows left-to-right.
 */
export function computeFabricLayout(
  pieces: PatternPieceData[],
  fabricWidth: number = DEFAULT_FABRIC_WIDTH,
): FabricLayout {
  const halfWidth = fabricWidth / 2;
  const gap = 0.5; // inches between pieces

  // Build list of rectangles to place
  interface PlaceRect {
    pieceIndex: number;
    width: number;
    height: number;
    isFoldCopy: boolean;
  }

  const rects: PlaceRect[] = [];
  const boundsCache: PieceBounds[] = [];

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const bounds = getPieceBounds(piece.shape);
    boundsCache.push(bounds);
    const w = bounds.widthInches + 2 * SEAM_ALLOWANCE;
    const h = bounds.heightInches + 2 * SEAM_ALLOWANCE;

    if (piece.cutOnFold) {
      // cutOnFold: piece spans full width (placed against fold)
      for (let c = 0; c < piece.cutCount; c++) {
        rects.push({ pieceIndex: i, width: w, height: h, isFoldCopy: false });
      }
    } else {
      for (let c = 0; c < piece.cutCount; c++) {
        rects.push({ pieceIndex: i, width: w, height: h, isFoldCopy: c > 0 });
      }
    }
  }

  // Sort by height descending (shelf packing heuristic)
  rects.sort((a, b) => b.height - a.height);

  // Shelf packing
  const placements: PlacedPiece[] = [];
  let currentY = 0;
  let shelfHeight = 0;
  let currentX = 0;
  const maxWidth = halfWidth;

  for (const rect of rects) {
    const fitsOnShelf = currentX + rect.width <= maxWidth;

    if (!fitsOnShelf) {
      // Start new shelf
      currentY += shelfHeight + gap;
      currentX = 0;
      shelfHeight = 0;
    }

    placements.push({
      pieceIndex: rect.pieceIndex,
      x: currentX,
      y: currentY,
      width: rect.width,
      height: rect.height,
      isFoldCopy: rect.isFoldCopy,
    });

    currentX += rect.width + gap;
    shelfHeight = Math.max(shelfHeight, rect.height);
  }

  const fabricLength = currentY + shelfHeight;
  // Yardage: ceil to nearest 1/8 yard + 10% waste
  const rawYards = (fabricLength / 36) * 1.1;
  const fabricYards = Math.ceil(rawYards * 8) / 8;

  return {
    fabricWidth,
    fabricLength,
    fabricYards,
    isFolded: true,
    placements,
  };
}

/** Color palette for piece rectangles in the layout diagram. */
const LAYOUT_COLORS: [number, number, number][] = [
  [173, 216, 230],
  [255, 182, 193],
  [144, 238, 144],
  [255, 218, 185],
  [221, 160, 221],
  [176, 224, 230],
  [255, 228, 181],
  [216, 191, 216],
];

/**
 * Render the fabric layout diagram on a new page.
 * Shows a scaled-down view of all pieces arranged on the fabric.
 */
export function renderFabricLayout(
  doc: jsPDF,
  layout: FabricLayout,
  pieces: PatternPieceData[],
): void {
  doc.addPage();

  // --- Title ---
  doc.setFontSize(FONT.subtitle);
  doc.setTextColor(0, 0, 0);
  doc.text("Fabric Layout", MARGIN, MARGIN + 0.3);

  doc.setFontSize(FONT.body);
  doc.text(
    `${layout.fabricWidth}" wide fabric, folded — ${layout.fabricYards} yard(s) needed`,
    MARGIN,
    MARGIN + 0.6,
  );

  // --- Scale to fit on page ---
  const diagramTop = MARGIN + 1.0;
  const availableWidth = PRINTABLE_WIDTH;
  const availableHeight = PRINTABLE_HEIGHT - 1.5;
  const halfWidth = layout.fabricWidth / 2;

  const scaleX = availableWidth / halfWidth;
  const scaleY = availableHeight / Math.max(layout.fabricLength, 1);
  const scale = Math.min(scaleX, scaleY, 0.15); // cap at reasonable size

  const diagramW = halfWidth * scale;
  const diagramH = layout.fabricLength * scale;
  const diagramLeft = MARGIN + (availableWidth - diagramW) / 2;

  // --- Fabric rectangle ---
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.015);
  doc.setFillColor(255, 255, 240);
  doc.rect(diagramLeft, diagramTop, diagramW, diagramH, "FD");

  // --- Fold line (right edge) ---
  doc.setLineDashPattern([0.1, 0.05], 0);
  doc.setDrawColor(200, 0, 0);
  doc.setLineWidth(0.01);
  doc.line(
    diagramLeft + diagramW,
    diagramTop,
    diagramLeft + diagramW,
    diagramTop + diagramH,
  );
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6);
  doc.setTextColor(200, 0, 0);
  doc.text("FOLD", diagramLeft + diagramW + 0.05, diagramTop + diagramH / 2, {
    angle: 90,
  });

  // --- Place pieces ---
  for (const placement of layout.placements) {
    const color = LAYOUT_COLORS[placement.pieceIndex % LAYOUT_COLORS.length];
    const px = diagramLeft + placement.x * scale;
    const py = diagramTop + placement.y * scale;
    const pw = placement.width * scale;
    const ph = placement.height * scale;

    doc.setFillColor(color[0], color[1], color[2]);
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.008);
    doc.rect(px, py, pw, ph, "FD");

    // Piece label (only if rect is big enough)
    if (pw > 0.3 && ph > 0.15) {
      doc.setFontSize(5);
      doc.setTextColor(40, 40, 40);
      const label = pieces[placement.pieceIndex]?.name ?? `Piece ${placement.pieceIndex + 1}`;
      doc.text(label, px + pw / 2, py + ph / 2 + 0.02, { align: "center" });
    }

    // Grain arrow (vertical)
    if (ph > 0.4) {
      const arrowX = px + pw / 2;
      doc.setDrawColor(60, 60, 60);
      doc.setLineWidth(0.005);
      doc.line(arrowX, py + ph * 0.25, arrowX, py + ph * 0.75);
    }
  }

  // --- Legend ---
  const legendY = diagramTop + diagramH + 0.4;
  doc.setFontSize(FONT.small);
  doc.setTextColor(0, 0, 0);
  doc.text("Legend:", MARGIN, legendY);

  let lx = MARGIN;
  const ly = legendY + 0.25;
  for (let i = 0; i < pieces.length; i++) {
    const color = LAYOUT_COLORS[i % LAYOUT_COLORS.length];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(lx, ly, 0.15, 0.15, "F");
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.text(pieces[i].name, lx + 0.2, ly + 0.12);
    lx += doc.getTextWidth(pieces[i].name) + 0.5;
    if (lx > MARGIN + PRINTABLE_WIDTH - 1) {
      // Not enough room — skip remaining legend entries
      break;
    }
  }
}
