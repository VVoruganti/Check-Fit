import { Outlet, useNavigate, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { usePattern, type WizardStep } from "@/context/PatternContext";

const STEPS: { step: WizardStep; path: string; label: string }[] = [
  { step: "upload", path: "/create/upload", label: "Upload" },
  { step: "analyze", path: "/create/analyze", label: "Analyze" },
  { step: "refine", path: "/create/refine", label: "Refine" },
  { step: "measure", path: "/create/measure", label: "Measure" },
  { step: "generate", path: "/create/generate", label: "Generate" },
];

export default function WizardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentStep, setStep } = usePattern();

  const currentIdx = STEPS.findIndex(
    (s) => s.path === location.pathname || s.step === currentStep,
  );
  const prevStep = currentIdx > 0 ? STEPS[currentIdx - 1] : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((s, i) => {
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            return (
              <div key={s.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isDone
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`mt-1 text-xs ${isActive ? "font-medium text-primary" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 mt-[-1rem] ${
                      isDone ? "bg-primary/40" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <Outlet />

      {/* Back button */}
      {prevStep && (
        <div className="mt-6">
          <Button
            variant="ghost"
            onClick={() => {
              setStep(prevStep.step);
              navigate(prevStep.path);
            }}
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to {prevStep.label}
          </Button>
        </div>
      )}
    </div>
  );
}
