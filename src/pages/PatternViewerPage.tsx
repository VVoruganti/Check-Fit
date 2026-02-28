import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePattern } from "@/context/PatternContext";
import type { PatternPieceData } from "@/data/pattern-pieces";

/** Convert a THREE.Shape to an SVG path string. */
function shapeToSvgPath(piece: PatternPieceData, scale: number, offsetX: number, offsetY: number): string {
  const shape = piece.shape;
  const curves = shape.curves;
  if (curves.length === 0) return "";

  let d = "";
  const tx = (x: number) => offsetX + x * scale;
  const ty = (y: number) => offsetY - y * scale; // flip Y for SVG

  // Get the starting point
  const startPoint = shape.getPoint(0);
  d += `M ${tx(startPoint.x)} ${ty(startPoint.y)} `;

  for (const curve of curves) {
    if (curve.type === "LineCurve") {
      const lc = curve as any;
      d += `L ${tx(lc.v2.x)} ${ty(lc.v2.y)} `;
    } else if (curve.type === "QuadraticBezierCurve") {
      const qc = curve as any;
      d += `Q ${tx(qc.v1.x)} ${ty(qc.v1.y)} ${tx(qc.v2.x)} ${ty(qc.v2.y)} `;
    } else {
      // Fallback: approximate with line
      const points = curve.getPoints(10);
      for (const pt of points) {
        d += `L ${tx(pt.x)} ${ty(pt.y)} `;
      }
    }
  }

  d += "Z";
  return d;
}

export default function PatternViewerPage() {
  const { patternPieces, garmentDescription } = usePattern();
  const [zoom, setZoom] = useState(1);
  const [showSeamAllowance, setShowSeamAllowance] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  // Auto-select the first piece when available
  const activePiece = selectedPiece ?? patternPieces[0]?.id ?? null;

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const resetZoom = () => setZoom(1);

  // Compute SVG paths for each piece
  const svgPaths = useMemo(() => {
    const svgScale = 150; // Scale from Three.js units to SVG pixels
    const centerX = 300;
    const centerY = 250;

    return patternPieces.map((piece) => ({
      id: piece.id,
      name: piece.name,
      color: piece.color,
      instructions: piece.instructions,
      cutCount: piece.cutCount,
      cutOnFold: piece.cutOnFold,
      path: shapeToSvgPath(piece, svgScale, centerX, centerY),
    }));
  }, [patternPieces]);

  const hasPieces = patternPieces.length > 0;
  const currentSvg = svgPaths.find((p) => p.id === activePiece);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pattern Viewer</h1>
          <p className="text-muted-foreground mt-1">
            {garmentDescription
              ? `${patternPieces.length} pieces — ${garmentDescription.summary}`
              : "View and customize your generated sewing pattern pieces."
            }
          </p>
        </div>
        <Button variant="outline" className="shrink-0">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download PDF
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Pattern Pieces Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pattern Pieces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {hasPieces ? (
                patternPieces.map((piece) => (
                  <button
                    key={piece.id}
                    onClick={() => setSelectedPiece(piece.id)}
                    className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors text-left ${
                      activePiece === piece.id
                        ? "bg-accent font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: piece.color }}
                    />
                    <span>{piece.name}</span>
                    {activePiece === piece.id && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Active
                      </Badge>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  <p>No pattern generated yet.</p>
                  <Button variant="link" size="sm" asChild className="mt-2">
                    <Link to="/upload">Select a template</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zoom */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Zoom: {Math.round(zoom * 100)}%
                </label>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={zoomOut}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom Out</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={resetZoom}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset Zoom</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={zoomIn}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom In</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <Separator />

              {/* Seam Allowance Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm">Seam Allowance</label>
                <button
                  onClick={() => setShowSeamAllowance(!showSeamAllowance)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showSeamAllowance ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showSeamAllowance ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <Separator />

              {/* Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Grid: 1 square = 1 inch</p>
                <p>Seam allowance: 5/8 inch</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SVG Canvas */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative overflow-auto bg-white" style={{ height: "600px" }}>
                {/* Graph Paper Background */}
                <svg
                  width="100%"
                  height="100%"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  <defs>
                    <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e8ddd0" strokeWidth="0.5" />
                    </pattern>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <rect width="50" height="50" fill="url(#smallGrid)" />
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d4c4b0" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Pattern Piece SVG */}
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 600 500"
                  className="relative"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                >
                  <defs>
                    <marker id="grainArrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill={currentSvg?.color ?? "#666"} />
                    </marker>
                  </defs>

                  {currentSvg && (
                    <g>
                      {/* Seam allowance (offset outline) */}
                      {showSeamAllowance && (
                        <path
                          d={currentSvg.path}
                          fill="none"
                          stroke={currentSvg.color}
                          strokeWidth="1"
                          strokeDasharray="8 4"
                          opacity="0.4"
                          transform="translate(0,0) scale(1.06)"
                          style={{ transformOrigin: "300px 250px" }}
                        />
                      )}

                      {/* Main piece outline */}
                      <path
                        d={currentSvg.path}
                        fill={currentSvg.color}
                        fillOpacity="0.15"
                        stroke={currentSvg.color}
                        strokeWidth="2"
                      />

                      {/* Grain line */}
                      <line
                        x1="300" y1="140" x2="300" y2="360"
                        stroke={currentSvg.color}
                        strokeWidth="1"
                        markerEnd="url(#grainArrow)"
                      />

                      {/* Label */}
                      <text
                        x="300" y="240"
                        textAnchor="middle"
                        fill={currentSvg.color}
                        fontWeight="600"
                        fontSize="14"
                      >
                        {currentSvg.name}
                      </text>
                      <text
                        x="300" y="260"
                        textAnchor="middle"
                        fill={currentSvg.color}
                        fontSize="10"
                        opacity="0.7"
                      >
                        {currentSvg.cutOnFold
                          ? `Cut ${currentSvg.cutCount} on fold`
                          : `Cut ${currentSvg.cutCount}`
                        }
                      </text>
                    </g>
                  )}

                  {!hasPieces && (
                    <text x="300" y="250" textAnchor="middle" fill="#999" fontSize="14">
                      No pattern generated — select a template on the Upload page
                    </text>
                  )}
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
