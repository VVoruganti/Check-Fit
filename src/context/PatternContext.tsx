import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { GarmentDescription } from "@/types/garment";
import type { BodyMeasurements, MeasurementKey } from "@/types/measurements";
import type { PatternPieceData } from "@/data/pattern-pieces";
import { DEFAULT_MEASUREMENTS } from "@/data/default-measurements";
import { generatePattern } from "@/lib/pattern-generator";

interface PatternState {
  uploadedImage: string | null;
  garmentDescription: GarmentDescription | null;
  selectedTemplate: string | null;
  measurements: BodyMeasurements;
  patternPieces: PatternPieceData[];
  analyzing: boolean;
}

interface PatternActions {
  setUploadedImage: (image: string | null) => void;
  setGarmentDescription: (desc: GarmentDescription | null, templateKey?: string) => void;
  setMeasurement: (key: MeasurementKey, value: number) => void;
  setMeasurements: (measurements: BodyMeasurements) => void;
  setAnalyzing: (analyzing: boolean) => void;
  regeneratePattern: () => void;
}

type PatternContextType = PatternState & PatternActions;

const PatternContext = createContext<PatternContextType | null>(null);

export function PatternProvider({ children }: { children: ReactNode }) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [garmentDescription, setGarmentDescriptionRaw] = useState<GarmentDescription | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [measurements, setMeasurementsRaw] = useState<BodyMeasurements>(DEFAULT_MEASUREMENTS);
  const [analyzing, setAnalyzing] = useState(false);
  const [regenerateKey, setRegenerateKey] = useState(0);

  const patternPieces = useMemo(() => {
    if (!garmentDescription) return [];
    return generatePattern(garmentDescription, measurements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garmentDescription, measurements, regenerateKey]);

  const setGarmentDescription = useCallback((desc: GarmentDescription | null, templateKey?: string) => {
    setGarmentDescriptionRaw(desc);
    setSelectedTemplate(templateKey ?? null);
  }, []);

  const setMeasurement = useCallback((key: MeasurementKey, value: number) => {
    setMeasurementsRaw(prev => ({ ...prev, [key]: value }));
  }, []);

  const setMeasurements = useCallback((m: BodyMeasurements) => {
    setMeasurementsRaw(m);
  }, []);

  const regeneratePattern = useCallback(() => {
    setRegenerateKey(k => k + 1);
  }, []);

  const value: PatternContextType = useMemo(() => ({
    uploadedImage,
    garmentDescription,
    selectedTemplate,
    measurements,
    patternPieces,
    analyzing,
    setUploadedImage,
    setGarmentDescription,
    setMeasurement,
    setMeasurements,
    setAnalyzing,
    regeneratePattern,
  }), [
    uploadedImage, garmentDescription, selectedTemplate, measurements,
    patternPieces, analyzing, setGarmentDescription, setMeasurement,
    setMeasurements, regeneratePattern,
  ]);

  return (
    <PatternContext.Provider value={value}>
      {children}
    </PatternContext.Provider>
  );
}

export function usePattern(): PatternContextType {
  const ctx = useContext(PatternContext);
  if (!ctx) throw new Error("usePattern must be used within <PatternProvider>");
  return ctx;
}
