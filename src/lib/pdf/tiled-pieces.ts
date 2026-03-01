import type { jsPDF } from "jspdf";
import type { PatternPieceData } from "@/data/pattern-pieces";
import {
  MARGIN,
  TILE_WIDTH,
  TILE_HEIGHT,
  TILE_OVERLAP,
  PRINTABLE_WIDTH,
  PRINTABLE_HEIGHT,
  CROSSHAIR_SIZE,
  TEST_SQUARE_SIZE,
  SEAM_ALLOWANCE,
} from "./constants";
import { getPieceBounds, type PieceBounds } from "./piece-bounds";
import { shapeToPathOps } from "./shape-to-pdf";

export interface TileInfo {
  row: number;
  col: number;
  totalRows: number;
  totalCols: number;
  /** Clip rectangle in piece-inches from top-left of the piece's bounding box. */
  clipX: number;
  clipY: number;
  clipW: number;
  clipH: number;
}

/**
 * Calculate the tile grid needed to print a piece at 1:1 scale.
 * Includes seam allowance in the total size.
 */
export function calculateTileGrid(bounds: PieceBounds): TileInfo[] {
  const totalW = bounds.widthInches + 2 * SEAM_ALLOWANCE;
  const totalH = bounds.heightInches + 2 * SEAM_ALLOWANCE;

  const cols = Math.max(1, Math.ceil(totalW / TILE_WIDTH));
  const rows = Math.max(1, Math.ceil(totalH / TILE_HEIGHT));

  const tiles: TileInfo[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({
        row: r,
        col: c,
        totalRows: rows,
        totalCols: cols,
        clipX: c * TILE_WIDTH,
        clipY: r * TILE_HEIGHT,
        clipW: Math.min(TILE_WIDTH, totalW - c * TILE_WIDTH),
        clipH: Math.min(TILE_HEIGHT, totalH - r * TILE_HEIGHT),
      });
    }
  }

  return tiles;
}

/** Draw crosshair registration marks at the four corners of the printable area. */
function drawRegistrationMarks(doc: jsPDF) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.01);

  const positions = [
    [MARGIN, MARGIN],
    [MARGIN + PRINTABLE_WIDTH, MARGIN],
    [MARGIN, MARGIN + PRINTABLE_HEIGHT],
    [MARGIN + PRINTABLE_WIDTH, MARGIN + PRINTABLE_HEIGHT],
  ];

  for (const [x, y] of positions) {
    doc.line(x - CROSSHAIR_SIZE, y, x + CROSSHAIR_SIZE, y);
    doc.line(x, y - CROSSHAIR_SIZE, x, y + CROSSHAIR_SIZE);
  }
}

/** Draw a 1" test square in the bottom-right corner. */
function drawTestSquare(doc: jsPDF) {
  const x = MARGIN + PRINTABLE_WIDTH - TEST_SQUARE_SIZE - 0.1;
  const y = MARGIN + PRINTABLE_HEIGHT - TEST_SQUARE_SIZE - 0.3;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.02);
  doc.rect(x, y, TEST_SQUARE_SIZE, TEST_SQUARE_SIZE);

  doc.setFontSize(6);
  doc.setTextColor(0, 0, 0);
  doc.text('1" test square', x + TEST_SQUARE_SIZE / 2, y + TEST_SQUARE_SIZE + 0.15, {
    align: "center",
  });
}

/** Draw a mini tile-grid diagram showing which tile this page is. */
function drawTileMap(doc: jsPDF, tile: TileInfo) {
  const mapX = MARGIN + 0.15;
  const mapY = MARGIN + PRINTABLE_HEIGHT - 0.8;
  const cellSize = 0.2;

  doc.setFontSize(6);
  doc.setTextColor(80, 80, 80);
  doc.text("Tile map:", mapX, mapY - 0.1);

  for (let r = 0; r < tile.totalRows; r++) {
    for (let c = 0; c < tile.totalCols; c++) {
      const cx = mapX + c * cellSize;
      const cy = mapY + r * cellSize;

      if (r === tile.row && c === tile.col) {
        doc.setFillColor(0, 0, 0);
        doc.rect(cx, cy, cellSize, cellSize, "F");
      } else {
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(0.008);
        doc.rect(cx, cy, cellSize, cellSize, "S");
      }
    }
  }
}

/**
 * Render all tiled pages for a single pattern piece.
 * Each tile is a new page showing the piece region at 1:1 scale.
 */
export function renderTiledPiece(doc: jsPDF, piece: PatternPieceData): void {
  const bounds = getPieceBounds(piece.shape);
  const tiles = calculateTileGrid(bounds);

  for (const tile of tiles) {
    doc.addPage();

    // --- Page header ---
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${piece.name} — Tile ${tile.row * tile.totalCols + tile.col + 1} of ${tiles.length}`,
      MARGIN,
      MARGIN - 0.1,
    );

    // --- Clip region setup ---
    // The piece is drawn at full size and translated so the correct tile
    // region falls within the printable area.
    const pieceOffsetX = MARGIN + TILE_OVERLAP / 2 - tile.clipX + SEAM_ALLOWANCE;
    const pieceOffsetY = MARGIN + TILE_OVERLAP / 2 - tile.clipY + SEAM_ALLOWANCE;

    // Use save/restore with clip rect to only show the tile region
    doc.saveGraphicsState();

    // Clip to printable area
    doc.rect(MARGIN, MARGIN, PRINTABLE_WIDTH, PRINTABLE_HEIGHT);
    doc.clip("evenodd");

    // Draw the piece shape
    const ops = shapeToPathOps(piece.shape, pieceOffsetX, pieceOffsetY);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.02);
    doc.path(ops).stroke();

    // Draw seam allowance dashed
    const saScale = bounds.widthInches > 0
      ? (bounds.widthInches + 2 * SEAM_ALLOWANCE) / bounds.widthInches
      : 1;
    const saScaleY = bounds.heightInches > 0
      ? (bounds.heightInches + 2 * SEAM_ALLOWANCE) / bounds.heightInches
      : 1;

    // Compute seam allowance outline offset
    const saOffX = pieceOffsetX - SEAM_ALLOWANCE;
    const saOffY = pieceOffsetY - SEAM_ALLOWANCE;
    const saOps = shapeToPathOps(piece.shape, saOffX, saOffY);
    const centerX = saOffX + bounds.widthInches / 2 + SEAM_ALLOWANCE;
    const centerY = saOffY + bounds.heightInches / 2 + SEAM_ALLOWANCE;

    const scaledOps = saOps.map((op) => {
      const c = op.c.map((val, i) => {
        const isX = i % 2 === 0;
        const center = isX ? centerX : centerY;
        const s = isX ? saScale : saScaleY;
        return center + (val - center) * s;
      });
      return { ...op, c };
    });

    doc.setLineDashPattern([0.1, 0.08], 0);
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.01);
    doc.path(scaledOps).stroke();
    doc.setLineDashPattern([], 0);

    // Grain line if visible in this tile
    const grainX = pieceOffsetX + bounds.widthInches / 2;
    const grainTop = pieceOffsetY + bounds.heightInches * 0.2;
    const grainBottom = pieceOffsetY + bounds.heightInches * 0.8;
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.01);
    doc.line(grainX, grainTop, grainX, grainBottom);

    // Piece label
    const labelX = pieceOffsetX + bounds.widthInches / 2;
    const labelY = pieceOffsetY + bounds.heightInches / 2;
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(piece.name, labelX, labelY, { align: "center" });

    doc.restoreGraphicsState();

    // --- Overlay elements (outside clip) ---
    drawRegistrationMarks(doc);
    drawTestSquare(doc);
    drawTileMap(doc, tile);

    // Overlap indicators along edges
    if (tile.col > 0) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([0.05, 0.05], 0);
      doc.line(MARGIN + TILE_OVERLAP / 2, MARGIN, MARGIN + TILE_OVERLAP / 2, MARGIN + PRINTABLE_HEIGHT);
      doc.setLineDashPattern([], 0);
    }
    if (tile.row > 0) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([0.05, 0.05], 0);
      doc.line(MARGIN, MARGIN + TILE_OVERLAP / 2, MARGIN + PRINTABLE_WIDTH, MARGIN + TILE_OVERLAP / 2);
      doc.setLineDashPattern([], 0);
    }
  }
}
