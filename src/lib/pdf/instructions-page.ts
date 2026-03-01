import type { jsPDF } from "jspdf";
import type { GarmentDescription } from "@/types/garment";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { MARGIN, PRINTABLE_WIDTH, FONT, PAGE_HEIGHT } from "./constants";

/**
 * Standard assembly steps keyed by component.
 * Steps are only included if the component is present in the garment.
 */
const ASSEMBLY_STEPS: { component: string; check: (g: GarmentDescription) => boolean; steps: string[] }[] = [
  {
    component: "Bodice",
    check: (g) => !!g.bodice,
    steps: [
      "Sew front and back bodice darts (if applicable).",
      "Join front and back bodice at shoulder seams, right sides together. Press seams open.",
      "Join front and back bodice at side seams. Press seams open.",
    ],
  },
  {
    component: "Sleeves",
    check: (g) => !!g.sleeves,
    steps: [
      "Sew the sleeve seam (underarm). Press seam open.",
      "Ease the sleeve cap into the armhole, matching notches. Pin and stitch.",
      "If cuffs are included, attach cuff to sleeve hem.",
    ],
  },
  {
    component: "Collar",
    check: (g) => !!g.collar,
    steps: [
      "Interface the upper collar piece (if using interfacing).",
      "Sew upper and under collar together along outer edge. Trim, turn, and press.",
      "Pin collar to neckline, matching center back and shoulder marks. Stitch in place.",
    ],
  },
  {
    component: "Hood",
    check: (g) => !!g.hood,
    steps: [
      "Sew the two hood pieces together along the center back seam.",
      "Attach the hood to the neckline, right sides together. Stitch and press seam down.",
    ],
  },
  {
    component: "Skirt",
    check: (g) => !!g.skirt,
    steps: [
      "Sew skirt side seams (or center back seam if applicable). Press seams open.",
      "Attach skirt to bodice at waistline, matching side seams and center marks.",
    ],
  },
  {
    component: "Pants",
    check: (g) => !!g.pants,
    steps: [
      "Sew front and back leg inseams. Press seams open.",
      "Sew the front and back crotch seams. Press.",
      "Join the two legs at the center seam, matching inseam intersections.",
    ],
  },
  {
    component: "Waistband",
    check: (g) => !!g.waistband,
    steps: [
      "Interface the waistband (if using interfacing).",
      "Fold waistband in half lengthwise, press. Attach to waist edge of garment.",
      "If elastic: thread elastic through the waistband casing, secure ends.",
    ],
  },
  {
    component: "Pockets",
    check: (g) => !!g.pockets,
    steps: [
      "Finish pocket edges (fold under and press, or serge).",
      "Position pockets on garment according to layout markings. Pin and topstitch in place.",
    ],
  },
  {
    component: "Closure",
    check: (g) => g.closure.type !== "none" && g.closure.type !== "pullover",
    steps: [
      "Install closure (zipper, buttons, or snaps) at the marked placement.",
      "For zippers: baste the seam closed, press, install zipper, remove basting.",
      "For buttons: mark button and buttonhole positions. Sew buttonholes first, then buttons.",
    ],
  },
  {
    component: "Finishing",
    check: () => true,
    steps: [
      "Hem the garment at the marked hemline. Press before stitching.",
      "Finish all raw seam edges (serge, zigzag, or French seam).",
      "Give the finished garment a final press.",
    ],
  },
];

/**
 * Render the instructions page with cutting guide and assembly order.
 */
export function renderInstructionsPage(
  doc: jsPDF,
  garmentDescription: GarmentDescription,
  pieces: PatternPieceData[],
): void {
  doc.addPage();

  let y = MARGIN + 0.3;

  // --- Section 1: Cutting Guide ---
  doc.setFontSize(FONT.subtitle);
  doc.setTextColor(0, 0, 0);
  doc.text("Cutting Guide", MARGIN, y);
  y += 0.15;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.005);
  doc.line(MARGIN, y, MARGIN + PRINTABLE_WIDTH, y);
  y += 0.25;

  doc.setFontSize(FONT.body);
  for (const piece of pieces) {
    // Check if we need a new page
    if (y > PAGE_HEIGHT - MARGIN - 0.5) {
      doc.addPage();
      y = MARGIN + 0.3;
    }

    doc.setTextColor(0, 0, 0);
    const cutLabel = piece.cutOnFold
      ? `Cut ${piece.cutCount} on fold`
      : `Cut ${piece.cutCount}`;
    doc.text(`${piece.name} (${cutLabel})`, MARGIN + 0.15, y);
    y += 0.2;

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(FONT.small);
    const lines = doc.splitTextToSize(piece.instructions, PRINTABLE_WIDTH - 0.4);
    doc.text(lines, MARGIN + 0.3, y);
    y += lines.length * 0.17 + 0.15;

    doc.setFontSize(FONT.body);
  }

  y += 0.2;

  // --- Section 2: Assembly Order ---
  if (y > PAGE_HEIGHT - MARGIN - 2) {
    doc.addPage();
    y = MARGIN + 0.3;
  }

  doc.setFontSize(FONT.subtitle);
  doc.setTextColor(0, 0, 0);
  doc.text("Assembly Order", MARGIN, y);
  y += 0.15;

  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y, MARGIN + PRINTABLE_WIDTH, y);
  y += 0.25;

  let stepNumber = 1;

  for (const section of ASSEMBLY_STEPS) {
    if (!section.check(garmentDescription)) continue;

    // Check page space
    if (y > PAGE_HEIGHT - MARGIN - 1) {
      doc.addPage();
      y = MARGIN + 0.3;
    }

    // Section heading
    doc.setFontSize(FONT.body);
    doc.setTextColor(0, 0, 0);
    doc.text(section.component, MARGIN + 0.15, y);
    y += 0.22;

    // Steps
    doc.setFontSize(FONT.small);
    doc.setTextColor(60, 60, 60);

    for (const step of section.steps) {
      if (y > PAGE_HEIGHT - MARGIN - 0.4) {
        doc.addPage();
        y = MARGIN + 0.3;
      }

      const lines = doc.splitTextToSize(`${stepNumber}. ${step}`, PRINTABLE_WIDTH - 0.6);
      doc.text(lines, MARGIN + 0.3, y);
      y += lines.length * 0.17 + 0.08;
      stepNumber++;
    }

    y += 0.1;
  }
}
