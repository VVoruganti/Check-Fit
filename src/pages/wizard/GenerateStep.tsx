import { useEffect, useRef, useState } from "react";
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
    generating,
    generateError,
    generateFromLLM,
  } = usePattern();
  const [status, setStatus] = useState("Initializing...");
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(false);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Effect 1: trigger LLM generation on mount
  useEffect(() => {
    console.log("[GenerateStep] Starting LLM generation...");
    console.log("[GenerateStep] garmentDescription:", garmentDescription?.category ?? "null");
    console.log("[GenerateStep] draftPieces:", draftPieces.length, "enabled:", draftPieces.filter(p => p.enabled).length);
    console.log("[GenerateStep] effectiveDescription:", effectiveDescription?.category ?? "null");

    if (!effectiveDescription && !garmentDescription) {
      return;
    }

    started.current = true;
    setStatus("Generating pattern pieces with AI...");
    generateFromLLM();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect 2: navigate once generation started AND pieces are ready
  useEffect(() => {
    if (started.current && !generating && patternPieces.length > 0) {
      console.log("[GenerateStep] patternPieces ready:", patternPieces.length);
      setStatus(`Generated ${patternPieces.length} pieces. Redirecting...`);
      navigate("/pattern");
    }
  }, [generating, patternPieces.length, navigate]);

  const hasError = generateError || (!effectiveDescription && !garmentDescription);
  const errorMessage = generateError ?? "No garment description available. Please go back and analyze an image or select a template.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {hasError ? (
            <>
              <div className="flex justify-center mb-4 text-destructive">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Generation Failed</h2>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
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
                {draftPieces.filter(p => p.enabled).length > 0 &&
                  ` | ${draftPieces.filter(p => p.enabled).length} pieces`}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
