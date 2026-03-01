import { jsPDF } from "jspdf";
import type { PatternPieceData } from "@/data/pattern-pieces";
import type { GarmentDescription } from "@/types/garment";
import type { BodyMeasurements } from "@/types/measurements";
import { PAGE_WIDTH, PAGE_HEIGHT } from "./constants";
import { renderCoverPage } from "./cover-page";
import { renderTiledPiece } from "./tiled-pieces";
import { computeFabricLayout, renderFabricLayout } from "./fabric-layout";
import { renderInstructionsPage } from "./instructions-page";

/**
 * Generate a printable PDF sewing pattern and trigger browser download.
 *
 * Pages:
 * 1.     Cover — garment info, measurements, piece inventory, fabric requirements
 * 2–N.   Pattern pieces — each piece tiled at 1:1 scale with registration marks
 * N+1.   Fabric layout — scaled diagram showing piece arrangement on fabric
 * N+2.   Instructions — cutting guide + assembly order
 */
export async function generatePatternPDF(
  pieces: PatternPieceData[],
  garmentDescription: GarmentDescription,
  measurements: BodyMeasurements,
): Promise<void> {
  const doc = new jsPDF({
    unit: "in",
    format: [PAGE_WIDTH, PAGE_HEIGHT],
    orientation: "portrait",
  });

  // --- 1. Fabric layout (compute first so cover page can show yardage) ---
  const fabricLayout = computeFabricLayout(pieces);

  // --- 2. Cover page (first page, already exists) ---
  renderCoverPage(doc, garmentDescription, measurements, pieces, fabricLayout);

  // --- 3. Tiled pattern piece pages ---
  for (const piece of pieces) {
    renderTiledPiece(doc, piece);
  }

  // --- 4. Fabric layout diagram ---
  renderFabricLayout(doc, fabricLayout, pieces);

  // --- 5. Instructions ---
  renderInstructionsPage(doc, garmentDescription, pieces);

  // --- Save ---
  const filename = `checkfit-${garmentDescription.category}-pattern.pdf`;
  doc.save(filename);
}
