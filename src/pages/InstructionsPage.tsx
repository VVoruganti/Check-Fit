import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const steps = [
  {
    title: "Prepare Your Fabric",
    description:
      "Pre-wash and iron your fabric to prevent shrinkage after the garment is completed. Lay the fabric on a flat surface with the right sides together, aligning the selvage edges.",
    tips: ["Use a steam iron for best results", "Check grain line direction"],
  },
  {
    title: "Cut Pattern Pieces",
    description:
      "Pin pattern pieces to the fabric following the layout guide. Cut along the cutting lines (outer lines if seam allowance is included). Transfer all notches, darts, and markings to the fabric using tailor's chalk or tracing paper.",
    tips: ["Use sharp fabric scissors", "Cut notches outward for easy matching"],
  },
  {
    title: "Sew Darts",
    description:
      'Fold each dart right sides together, matching the dart legs. Stitch from the wide end to the point, tapering to nothing at the tip. Tie off threads at the point rather than backstitching to avoid a dimple. Press bust darts downward and waist darts toward center.',
    tips: ["Stitch the last few stitches right along the fold", "Press over a tailor\'s ham for shaping"],
  },
  {
    title: "Join Shoulder Seams",
    description:
      "Place front and back bodice pieces right sides together. Pin and stitch the shoulder seams at 5/8 inch seam allowance. Finish seam allowances with a zigzag stitch or serger. Press seams open or toward the back.",
    tips: ["Match notches carefully", "Stay-stitch curved neckline first"],
  },
  {
    title: "Attach Collar",
    description:
      "Sew the two collar pieces right sides together along the outer edge. Turn right side out and press. Pin the collar to the neckline, matching center back and notches. Stitch in place and finish the seam.",
    tips: ["Grade seam allowances for less bulk", "Under-stitch to keep collar in place"],
  },
  {
    title: "Set In Sleeves",
    description:
      "Run two rows of ease stitching between the notches on the sleeve cap. Pin the sleeve into the armhole, matching notches and the sleeve cap to the shoulder seam. Distribute ease evenly and stitch. Press the seam toward the sleeve.",
    tips: ["Pin from the sleeve side", "Use a pressing ham to shape the sleeve cap"],
  },
  {
    title: "Sew Side Seams",
    description:
      "With right sides together, pin and stitch the side seams from the underarm to the hem in one continuous seam, including the sleeve underarm seam. Finish seam allowances and press open.",
    tips: ["Match the underarm seam intersections", "Reduce seam allowance to 3/8 inch at the underarm"],
  },
  {
    title: "Attach Skirt to Bodice",
    description:
      "Pin the front skirt to the front bodice at the waistline, right sides together. Repeat for the back pieces. Stitch the waist seam and press the seam allowances toward the bodice. You may topstitch for a clean finish.",
    tips: ["Match side seams and center markings", "Ease any fullness evenly"],
  },
  {
    title: "Hem the Garment",
    description:
      "Turn under the hem allowance and press. For a clean finish, fold the raw edge under 1/4 inch before folding the full hem allowance. Hand-stitch with a blind hem stitch or machine stitch with a blind hem foot.",
    tips: ["Use a hem gauge for even measurement", "Press before stitching for sharp creases"],
  },
  {
    title: "Final Pressing & Finishing",
    description:
      "Give the entire garment a final pressing, using a press cloth on the right side. Add any closures (buttons, zippers, hooks) as marked on the pattern. Trim all loose threads and give a final inspection.",
    tips: ["Press, don't iron (lift and set down)", "Try on the garment and make adjustments"],
  },
];

export default function InstructionsPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const progress = (completedSteps.size / steps.length) * 100;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Assembly Instructions</h1>
        <p className="mt-2 text-muted-foreground">
          Follow these steps to assemble your garment. Check off each step as you complete it.
        </p>
      </div>

      {/* Progress Tracker */}
      <Card className="mb-8">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              Progress: {completedSteps.size} of {steps.length} steps completed
            </span>
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {Math.round(progress)}%
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;

          return (
            <Card
              key={index}
              className={`transition-all cursor-pointer ${
                isCurrent ? "ring-2 ring-primary/20 shadow-md" : ""
              } ${isCompleted ? "opacity-75" : ""}`}
              onClick={() => setCurrentStep(index)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  {/* Step number / check */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStep(index);
                    }}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </button>
                  <div className="flex-1">
                    <CardTitle className={`text-lg ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                      {step.title}
                    </CardTitle>
                  </div>
                  {isCurrent && (
                    <Badge>Current</Badge>
                  )}
                </div>
              </CardHeader>
              {isCurrent && (
                <CardContent className="pt-0 pl-18">
                  <div className="ml-14">
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    {step.tips.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div>
                          <p className="text-sm font-medium mb-2">Tips:</p>
                          <ul className="space-y-1">
                            {step.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <svg className="h-4 w-4 shrink-0 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5.002 5.002 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                    <div className="flex gap-2 mt-6">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentStep(index - 1);
                        }}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(index);
                          if (index < steps.length - 1) {
                            setCurrentStep(index + 1);
                          }
                        }}
                      >
                        {isCompleted ? "Mark Incomplete" : "Complete & Next"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
