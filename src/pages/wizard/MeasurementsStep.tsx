import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { usePattern } from "@/context/PatternContext";
import {
  MEASUREMENT_LABELS,
  UPPER_BODY_KEYS,
  LOWER_BODY_KEYS,
  type MeasurementKey,
} from "@/types/measurements";
import { getRelevantMeasurements } from "@/lib/relevant-measurements";

export default function MeasurementsStep() {
  const navigate = useNavigate();
  const { measurements, setMeasurement, draftPieces, garmentDescription, setStep } =
    usePattern();

  const enabledTypes = useMemo(
    () => draftPieces.filter((p) => p.enabled).map((p) => p.type),
    [draftPieces],
  );

  const relevantKeys = useMemo(
    () =>
      enabledTypes.length > 0
        ? new Set(getRelevantMeasurements(enabledTypes))
        : null, // null = show all (template fallback path)
    [enabledTypes],
  );

  const filterKeys = (keys: MeasurementKey[]) =>
    relevantKeys ? keys.filter((k) => relevantKeys.has(k)) : keys;

  const upperKeys = filterKeys(UPPER_BODY_KEYS);
  const lowerKeys = filterKeys(LOWER_BODY_KEYS);

  const renderMeasurementCard = (key: MeasurementKey) => (
    <Card key={key} className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <label className="text-sm text-muted-foreground" htmlFor={key}>
          {MEASUREMENT_LABELS[key]}
        </label>
        <div className="flex items-baseline gap-1 mt-1">
          <Input
            id={key}
            type="number"
            step={0.5}
            min={1}
            max={100}
            value={measurements[key]}
            onChange={(e) =>
              setMeasurement(key, parseFloat(e.target.value) || 0)
            }
            className="text-2xl font-bold text-primary h-auto py-0 px-1 border-0 border-b border-transparent focus:border-primary bg-transparent w-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-sm text-muted-foreground">in</span>
        </div>
      </CardContent>
    </Card>
  );

  const handleGenerate = () => {
    setStep("generate");
    navigate("/create/generate");
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Body Measurements
          </h1>
          {relevantKeys && (
            <Badge variant="secondary">
              {relevantKeys.size} relevant fields
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {garmentDescription
            ? `Adjust measurements for your ${garmentDescription.summary.toLowerCase()}.`
            : "Enter your body measurements to generate a custom pattern."}
          {relevantKeys &&
            " Only measurements needed for your selected pieces are shown."}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Body Silhouette */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 flex flex-col items-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Body Reference
              </h3>
              <svg
                viewBox="0 0 200 400"
                className="w-full max-w-[200px] h-auto"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <ellipse cx="100" cy="35" rx="22" ry="28" className="stroke-primary/40" />
                <line x1="92" y1="62" x2="92" y2="80" className="stroke-primary/40" />
                <line x1="108" y1="62" x2="108" y2="80" className="stroke-primary/40" />
                <line x1="92" y1="80" x2="55" y2="90" className="stroke-primary/60" />
                <line x1="108" y1="80" x2="145" y2="90" className="stroke-primary/60" />
                <line x1="55" y1="90" x2="40" y2="190" className="stroke-primary/40" />
                <line x1="145" y1="90" x2="160" y2="190" className="stroke-primary/40" />
                <path d="M 55 90 Q 58 130 65 150 Q 60 160 58 180 Q 62 200 70 210" className="stroke-primary/60" />
                <path d="M 145 90 Q 142 130 135 150 Q 140 160 142 180 Q 138 200 130 210" className="stroke-primary/60" />
                <line x1="62" y1="120" x2="138" y2="120" className="stroke-chart-1" strokeDasharray="4 4" />
                <text x="155" y="124" className="fill-chart-1 text-[8px]" stroke="none">Bust</text>
                <line x1="65" y1="150" x2="135" y2="150" className="stroke-chart-2" strokeDasharray="4 4" />
                <text x="148" y="154" className="fill-chart-2 text-[8px]" stroke="none">Waist</text>
                <line x1="58" y1="195" x2="142" y2="195" className="stroke-chart-5" strokeDasharray="4 4" />
                <text x="155" y="199" className="fill-chart-5 text-[8px]" stroke="none">Hip</text>
                <line x1="70" y1="210" x2="75" y2="350" className="stroke-primary/40" />
                <line x1="130" y1="210" x2="125" y2="350" className="stroke-primary/40" />
                <line x1="85" y1="210" x2="88" y2="350" className="stroke-primary/40" />
                <line x1="115" y1="210" x2="112" y2="350" className="stroke-primary/40" />
                <ellipse cx="81" cy="355" rx="12" ry="5" className="stroke-primary/30" />
                <ellipse cx="119" cy="355" rx="12" ry="5" className="stroke-primary/30" />
              </svg>
              <p className="mt-4 text-xs text-muted-foreground text-center">
                Dotted lines indicate key measurement points
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Measurements Grid */}
        <div className="lg:col-span-2 space-y-8">
          {upperKeys.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
                  />
                </svg>
                Upper Body
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upperKeys.map(renderMeasurementCard)}
              </div>
            </div>
          )}

          {upperKeys.length > 0 && lowerKeys.length > 0 && <Separator />}

          {lowerKeys.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                  />
                </svg>
                Lower Body
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lowerKeys.map(renderMeasurementCard)}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button size="lg" onClick={handleGenerate}>
              Generate Pattern
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
