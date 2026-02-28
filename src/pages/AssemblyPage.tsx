import { useState, useCallback } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PatternAssembly from "@/components/three/PatternAssembly";
import { usePattern } from "@/context/PatternContext";

export default function AssemblyPage() {
  const { patternPieces, measurements, garmentDescription } = usePattern();
  const [assembled, setAssembled] = useState(false);
  const [isolatedPiece, setIsolatedPiece] = useState<string | null>(null);
  const [hoveredPiece, setHoveredPiece] = useState<string | null>(null);

  const handleClickPiece = useCallback((id: string) => {
    setIsolatedPiece((prev) => (prev === id ? null : id));
  }, []);

  const handleHoverPiece = useCallback((id: string | null) => {
    setHoveredPiece(id);
  }, []);

  const toggleAssembly = () => {
    setAssembled((prev) => !prev);
    setIsolatedPiece(null);
  };

  const hasPieces = patternPieces.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">3D Assembly</h1>
          <p className="text-muted-foreground mt-1">
            {garmentDescription
              ? `${garmentDescription.summary} — ${patternPieces.length} pieces`
              : "See how your pattern pieces come together in 3D."
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="lg"
            onClick={toggleAssembly}
            className="min-w-[160px]"
            disabled={!hasPieces}
          >
            {assembled ? (
              <>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                Explode
              </>
            ) : (
              <>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 16l-4-4m0 0l4-4m-4 4H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Assemble
              </>
            )}
          </Button>
          {isolatedPiece && (
            <Button
              variant="outline"
              onClick={() => setIsolatedPiece(null)}
            >
              Show All
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
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
                    onClick={() => handleClickPiece(piece.id)}
                    onMouseEnter={() => setHoveredPiece(piece.id)}
                    onMouseLeave={() => setHoveredPiece(null)}
                    className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all text-left ${
                      isolatedPiece === piece.id
                        ? "bg-accent font-medium ring-1 ring-primary/20"
                        : hoveredPiece === piece.id
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className="h-3 w-3 rounded-full shrink-0 transition-transform"
                      style={{
                        backgroundColor: piece.color,
                        transform:
                          hoveredPiece === piece.id ? "scale(1.3)" : "scale(1)",
                      }}
                    />
                    <span className="truncate">{piece.name}</span>
                    {isolatedPiece === piece.id && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Solo
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">
                  Drag
                </kbd>
                <span>Rotate view</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">
                  Scroll
                </kbd>
                <span>Zoom in/out</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">
                  Click
                </kbd>
                <span>Isolate piece</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>
                  {assembled ? "Assembled view" : "Exploded view"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3D Viewport */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div
                className="relative"
                style={{
                  height: "600px",
                  background:
                    "radial-gradient(ellipse at center, #faf6f1 0%, #f0e8e0 50%, #e8ddd0 100%)",
                }}
              >
                <PatternAssembly
                  assembled={assembled}
                  isolatedPiece={isolatedPiece}
                  onHoverPiece={handleHoverPiece}
                  onClickPiece={handleClickPiece}
                  pieces={patternPieces}
                  measurements={measurements}
                />

                {/* Overlay status */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <Badge
                    variant={assembled ? "default" : "secondary"}
                    className="backdrop-blur"
                  >
                    {assembled ? "Assembled" : "Exploded"}
                  </Badge>
                  {isolatedPiece && (
                    <Badge variant="outline" className="backdrop-blur">
                      Viewing:{" "}
                      {patternPieces.find((p) => p.id === isolatedPiece)?.name}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
