import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePattern } from "@/context/PatternContext";

export default function GenerateStep() {
  const navigate = useNavigate();
  const {
    patternPieces,
    effectiveDescription,
    garmentDescription,
    draftPieces,
    regeneratePattern,
  } = usePattern();
  const [status, setStatus] = useState("Initializing...");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Effect 1: trigger regeneration on mount
  useEffect(() => {
    console.log("[GenerateStep] Starting generation...");
    console.log("[GenerateStep] garmentDescription:", garmentDescription?.category ?? "null");
    console.log("[GenerateStep] draftPieces:", draftPieces.length, "enabled:", draftPieces.filter(p => p.enabled).length);
    console.log("[GenerateStep] effectiveDescription:", effectiveDescription?.category ?? "null");

    if (!effectiveDescription && !garmentDescription) {
      setError("No garment description available. Please go back and analyze an image or select a template.");
      setStatus("Error");
      return;
    }

    setStatus("Generating pattern pieces...");
    regeneratePattern();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect 2: navigate reactively once pieces are ready
  useEffect(() => {
    if (patternPieces.length > 0) {
      console.log("[GenerateStep] patternPieces ready:", patternPieces.length);
      setStatus(`Generated ${patternPieces.length} pieces. Redirecting...`);
      navigate("/pattern");
    }
  }, [patternPieces.length, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {error ? (
            <>
              <div className="flex justify-center mb-4 text-destructive">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Generation Failed</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate("/create/upload")}>
                Start Over
              </Button>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <svg
                  className="h-12 w-12 animate-spin text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M7.76 7.76L4.93 4.93" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Generating Pattern...
              </h2>
              <p className="text-muted-foreground mb-2">{status}</p>
              <p className="text-xs text-muted-foreground">
                {elapsed > 0 && `${elapsed}s elapsed`}
                {effectiveDescription &&
                  ` | ${effectiveDescription.category}`}
                {patternPieces.length > 0 &&
                  ` | ${patternPieces.length} pieces`}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
