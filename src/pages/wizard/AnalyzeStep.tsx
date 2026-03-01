import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePattern } from "@/context/PatternContext";
import { analyzeGarmentImage, getTemplate } from "@/lib/api";
import type { DraftPiece } from "@/types/draft-piece";

/** Build a default set of draft pieces from a GarmentDescription */
function descriptionToDraftPieces(
  desc: import("@/types/garment").GarmentDescription,
): DraftPiece[] {
  const pieces: DraftPiece[] = [];
  let id = 1;
  const add = (
    name: string,
    type: DraftPiece["type"],
    qty: number,
    notes = "",
  ) => {
    pieces.push({
      id: String(id++),
      name,
      type,
      quantity: qty,
      notes,
      enabled: true,
    });
  };

  if (desc.bodice) {
    add("Front Bodice", "bodice", 1, "Cut on fold");
    add("Back Bodice", "bodice", 1, "Cut on fold");
  }
  if (desc.sleeves) {
    add("Sleeve", "sleeves", 2);
  }
  if (desc.collar) {
    add("Collar", "collar", 1, `Style: ${desc.collar.style}`);
  }
  if (desc.hood) {
    add("Hood", "hood", 2, "Mirror pair");
  }
  if (desc.skirt) {
    add("Front Skirt", "skirt", 1);
    add("Back Skirt", "skirt", 1);
  }
  if (desc.pants) {
    add("Front Leg", "pants", 2);
    add("Back Leg", "pants", 2);
  }
  if (desc.waistband) {
    add("Waistband", "waistband", 1, `${desc.waistband.style} style`);
  }
  if (desc.pockets) {
    add("Pocket", "pockets", desc.pockets.count, `${desc.pockets.style} style`);
  }
  if (desc.cuffs) {
    add("Cuff", "cuffs", 2, `${desc.cuffs.style} style`);
  }

  return pieces;
}

const STATUS_MESSAGES = [
  "Sending image to AI...",
  "Identifying garment type...",
  "Analyzing construction details...",
  "Detecting pattern pieces...",
  "Finalizing analysis...",
];

export default function AnalyzeStep() {
  const navigate = useNavigate();
  const {
    uploadedImage,
    analyzing,
    setAnalyzing,
    setGarmentDescription,
    setAnalysisText,
    setDraftPieces,
    setStep,
  } = usePattern();
  const started = useRef(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Rotate status messages every 3s
  useEffect(() => {
    if (!analyzing) return;
    const interval = setInterval(() => {
      setStatusIdx((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [analyzing]);

  // Elapsed timer
  useEffect(() => {
    if (!analyzing) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [analyzing]);

  useEffect(() => {
    if (started.current) return;
    if (!uploadedImage) {
      navigate("/create/upload");
      return;
    }
    started.current = true;
    setAnalyzing(true);

    console.log("[AnalyzeStep] Starting vision analysis...");
    const startTime = Date.now();

    analyzeGarmentImage(uploadedImage)
      .then((result) => {
        console.log(`[AnalyzeStep] Vision success in ${Date.now() - startTime}ms — category: ${result.garmentDescription.category}, pieces: ${result.draftPieces.length}`);
        setGarmentDescription(result.garmentDescription);
        setAnalysisText(result.analysis);
        setDraftPieces(
          result.draftPieces.length > 0
            ? result.draftPieces
            : descriptionToDraftPieces(result.garmentDescription),
        );
        setStep("refine");
        navigate("/create/refine");
      })
      .catch((err) => {
        console.error(`[AnalyzeStep] Vision failed after ${Date.now() - startTime}ms:`, err);
        setError(err.message || "Analysis failed");
        // Auto-fallback after showing error briefly
        setTimeout(() => {
          const desc = getTemplate("dress");
          setGarmentDescription(desc, "dress");
          setDraftPieces(descriptionToDraftPieces(desc));
          setStep("refine");
          navigate("/create/refine");
        }, 2000);
      })
      .finally(() => {
        setAnalyzing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {error ? (
            <>
              <div className="flex justify-center mb-4 text-amber-500">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2">Analysis failed</h2>
              <p className="text-sm text-muted-foreground mb-2">{error}</p>
              <p className="text-xs text-muted-foreground">Falling back to template...</p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {uploadedImage && (
                    <img
                      src={uploadedImage}
                      alt="Analyzing"
                      className="w-32 h-32 object-cover rounded-lg opacity-60"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="h-10 w-10 animate-spin text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M7.76 7.76L4.93 4.93" />
                    </svg>
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Analyzing Garment...
              </h2>
              <p className="text-muted-foreground mb-2">
                {STATUS_MESSAGES[statusIdx]}
              </p>
              <p className="text-xs text-muted-foreground">
                {elapsed > 0 && `${elapsed}s elapsed`}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      {!error && elapsed > 15 && (
        <Button
          variant="ghost"
          className="mt-4 text-sm"
          onClick={() => {
            const desc = getTemplate("dress");
            setGarmentDescription(desc, "dress");
            setDraftPieces(descriptionToDraftPieces(desc));
            setAnalyzing(false);
            setStep("refine");
            navigate("/create/refine");
          }}
        >
          Taking too long? Skip to template
        </Button>
      )}
    </div>
  );
}
