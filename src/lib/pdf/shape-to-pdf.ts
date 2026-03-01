import type * as THREE from "three";
import type { jsPDF } from "jspdf";
import { THREEJS_TO_INCHES, SEAM_ALLOWANCE } from "./constants";
import { getPieceBounds } from "./piece-bounds";
import type { PatternPieceData } from "@/data/pattern-pieces";

/** A single jsPDF path() operation. */
export interface PathOp {
  op: string;
  c: number[];
}

/**
 * Convert a THREE.Shape to an array of jsPDF path operations.
 *
 * offsetX/offsetY position the piece on the page (in inches).
 * The piece is drawn so that its bounding-box top-left aligns at (offsetX, offsetY).
 *
 * Adapted from PatternViewerPage.tsx shapeToSvgPath().
 * jsPDF path() only supports cubic beziers, so quadratics are promoted
 * using the exact formula: CP1 = P0 + 2/3*(QCP - P0), CP2 = P2 + 2/3*(QCP - P2).
 */
export function shapeToPathOps(
  shape: THREE.Shape,
  offsetX: number,
  offsetY: number,
): PathOp[] {
  const curves = shape.curves;
  if (curves.length === 0) return [];

  const bounds = getPieceBounds(shape);
  const scale = THREEJS_TO_INCHES;

  // Transform: shift so minX/minY is at origin, then place at offset.
  // Y is flipped (Three.js Y-up → PDF Y-down).
  const tx = (x: number) => offsetX + (x - bounds.minX) * scale;
  const ty = (y: number) => offsetY + (bounds.maxY - y) * scale;

  const ops: PathOp[] = [];

  const startPoint = shape.getPoint(0);
  ops.push({ op: "m", c: [tx(startPoint.x), ty(startPoint.y)] });

  let prevEnd = startPoint;

  for (const curve of curves) {
    if (curve.type === "LineCurve") {
      const lc = curve as any;
      ops.push({ op: "l", c: [tx(lc.v2.x), ty(lc.v2.y)] });
      prevEnd = lc.v2;
    } else if (curve.type === "QuadraticBezierCurve") {
      const qc = curve as any;
      const p0x = prevEnd.x;
      const p0y = prevEnd.y;
      const cpx = qc.v1.x;
      const cpy = qc.v1.y;
      const p2x = qc.v2.x;
      const p2y = qc.v2.y;

      // Quadratic → Cubic promotion
      const cp1x = p0x + (2 / 3) * (cpx - p0x);
      const cp1y = p0y + (2 / 3) * (cpy - p0y);
      const cp2x = p2x + (2 / 3) * (cpx - p2x);
      const cp2y = p2y + (2 / 3) * (cpy - p2y);

      ops.push({
        op: "c",
        c: [tx(cp1x), ty(cp1y), tx(cp2x), ty(cp2y), tx(p2x), ty(p2y)],
      });
      prevEnd = qc.v2;
    } else {
      // Fallback: sample points along the curve
      const points = curve.getPoints(10);
      for (const pt of points) {
        ops.push({ op: "l", c: [tx(pt.x), ty(pt.y)] });
      }
      prevEnd = points[points.length - 1];
    }
  }

  ops.push({ op: "h", c: [] }); // close path
  return ops;
}

/**
 * Draw a pattern piece on a jsPDF page at the given position.
 *
 * Renders:
 * 1. Seam allowance dashed outline (if showSeamAllowance)
 * 2. Main cutting-line outline
 * 3. Grain line arrow (vertical, centered)
 * 4. Piece name + cut instructions label
 */
export function drawPieceOnPage(
  doc: jsPDF,
  piece: PatternPieceData,
  offsetX: number,
  offsetY: number,
  options?: { showSeamAllowance?: boolean; clip?: { x: number; y: number; w: number; h: number } },
) {
  const bounds = getPieceBounds(piece.shape);
  const showSA = options?.showSeamAllowance ?? true;

  // --- Seam allowance outline (offset from center by SEAM_ALLOWANCE) ---
  if (showSA) {
    // Scale from piece center to add seam allowance
    const saScaleX = bounds.widthInches > 0 ? (bounds.widthInches + 2 * SEAM_ALLOWANCE) / bounds.widthInches : 1;
    const saScaleY = bounds.heightInches > 0 ? (bounds.heightInches + 2 * SEAM_ALLOWANCE) / bounds.heightInches : 1;
    const saCenterX = offsetX + bounds.widthInches / 2;
    const saCenterY = offsetY + bounds.heightInches / 2;
    const saOffsetX = saCenterX - (bounds.widthInches * saScaleX) / 2;
    const saOffsetY = saCenterY - (bounds.heightInches * saScaleY) / 2;

    const saOps = shapeToPathOps(piece.shape, saOffsetX, saOffsetY);
    // Scale ops relative to the offset origin
    const scaledOps = saOps.map((op) => {
      const c = op.c.map((val, i) => {
        const isX = i % 2 === 0;
        const center = isX ? saCenterX : saCenterY;
        const scale = isX ? saScaleX : saScaleY;
        return center + (val - center) * scale;
      });
      return { ...op, c };
    });

    doc.setLineDashPattern([0.1, 0.08], 0);
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.01);
    doc.path(scaledOps).stroke();
    doc.setLineDashPattern([], 0);
  }

  // --- Main outline ---
  const ops = shapeToPathOps(piece.shape, offsetX, offsetY);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.02);
  doc.path(ops).stroke();

  // --- Grain line (vertical arrow through center) ---
  const cx = offsetX + bounds.widthInches / 2;
  const grainTop = offsetY + bounds.heightInches * 0.2;
  const grainBottom = offsetY + bounds.heightInches * 0.8;

  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.01);
  doc.line(cx, grainTop, cx, grainBottom);
  // Arrow head
  const arrowSize = 0.1;
  doc.line(cx, grainBottom, cx - arrowSize, grainBottom - arrowSize * 1.5);
  doc.line(cx, grainBottom, cx + arrowSize, grainBottom - arrowSize * 1.5);

  // "GRAIN" label
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text("GRAIN", cx, grainTop - 0.05, { align: "center" });

  // --- Name + cut instructions ---
  const labelY = offsetY + bounds.heightInches / 2;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(piece.name, cx, labelY - 0.1, { align: "center" });

  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  const cutText = piece.cutOnFold
    ? `Cut ${piece.cutCount} on fold`
    : `Cut ${piece.cutCount}`;
  doc.text(cutText, cx, labelY + 0.15, { align: "center" });
}
