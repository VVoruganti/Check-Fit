import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { GarmentDescription } from "@/types/garment";
import type { BodyMeasurements, MeasurementKey } from "@/types/measurements";
import type { PatternPieceData } from "@/data/pattern-pieces";
import type { DraftPiece, ChatMessage } from "@/types/draft-piece";
import { DEFAULT_MEASUREMENTS } from "@/data/default-measurements";
import { generatePattern } from "@/lib/pattern-generator";
import { applyDraftPieces } from "@/lib/draft-to-description";

export type WizardStep =
  | "upload"
  | "analyze"
  | "refine"
  | "measure"
  | "generate"
  | "patterns";

interface PatternState {
  currentStep: WizardStep;
  uploadedImage: string | null;
  garmentDescription: GarmentDescription | null;
  analysisText: string | null;
  analyzing: boolean;
  draftPieces: DraftPiece[];
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  effectiveDescription: GarmentDescription | null;
  measurements: BodyMeasurements;
  patternPieces: PatternPieceData[];
  selectedTemplate: string | null;
}

interface PatternActions {
  setStep: (step: WizardStep) => void;
  setUploadedImage: (image: string | null) => void;
  setGarmentDescription: (
    desc: GarmentDescription | null,
    templateKey?: string,
  ) => void;
  setAnalysisText: (text: string | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setDraftPieces: (pieces: DraftPiece[]) => void;
  toggleDraftPiece: (id: string) => void;
  updateDraftPiece: (id: string, updates: Partial<DraftPiece>) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatLoading: (loading: boolean) => void;
  clearChat: () => void;
  setMeasurement: (key: MeasurementKey, value: number) => void;
  setMeasurements: (measurements: BodyMeasurements) => void;
  regeneratePattern: () => void;
}

type PatternContextType = PatternState & PatternActions;

const PatternContext = createContext<PatternContextType | null>(null);

export function PatternProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [garmentDescription, setGarmentDescriptionRaw] =
    useState<GarmentDescription | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [draftPieces, setDraftPieces] = useState<DraftPiece[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [measurements, setMeasurementsRaw] = useState<BodyMeasurements>(
    DEFAULT_MEASUREMENTS,
  );
  const [regenerateKey, setRegenerateKey] = useState(0);

  // Derived: apply draft piece toggles to base description
  const effectiveDescription = useMemo(() => {
    if (!garmentDescription) return null;
    if (draftPieces.length === 0) return garmentDescription;
    return applyDraftPieces(garmentDescription, draftPieces);
  }, [garmentDescription, draftPieces]);

  // Derived: generate pattern pieces from effective description + measurements
  const patternPieces = useMemo(() => {
    if (!effectiveDescription) return [];
    return generatePattern(effectiveDescription, measurements, draftPieces);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDescription, measurements, draftPieces, regenerateKey]);

  const setStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const setGarmentDescription = useCallback(
    (desc: GarmentDescription | null, templateKey?: string) => {
      setGarmentDescriptionRaw(desc);
      setSelectedTemplate(templateKey ?? null);
    },
    [],
  );

  const toggleDraftPiece = useCallback((id: string) => {
    setDraftPieces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
    );
  }, []);

  const updateDraftPiece = useCallback(
    (id: string, updates: Partial<DraftPiece>) => {
      setDraftPieces((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [],
  );

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message]);
  }, []);

  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  const setMeasurement = useCallback((key: MeasurementKey, value: number) => {
    setMeasurementsRaw((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setMeasurements = useCallback((m: BodyMeasurements) => {
    setMeasurementsRaw(m);
  }, []);

  const regeneratePattern = useCallback(() => {
    setRegenerateKey((k) => k + 1);
  }, []);

  const value: PatternContextType = useMemo(
    () => ({
      currentStep,
      uploadedImage,
      garmentDescription,
      analysisText,
      analyzing,
      draftPieces,
      chatMessages,
      chatLoading,
      effectiveDescription,
      measurements,
      patternPieces,
      selectedTemplate,
      setStep,
      setUploadedImage,
      setGarmentDescription,
      setAnalysisText,
      setAnalyzing,
      setDraftPieces,
      toggleDraftPiece,
      updateDraftPiece,
      setChatMessages,
      addChatMessage,
      setChatLoading,
      clearChat,
      setMeasurement,
      setMeasurements,
      regeneratePattern,
    }),
    [
      currentStep,
      uploadedImage,
      garmentDescription,
      analysisText,
      analyzing,
      draftPieces,
      chatMessages,
      chatLoading,
      effectiveDescription,
      measurements,
      patternPieces,
      selectedTemplate,
      setStep,
      setGarmentDescription,
      toggleDraftPiece,
      updateDraftPiece,
      addChatMessage,
      clearChat,
      setMeasurement,
      setMeasurements,
      regeneratePattern,
    ],
  );

  return (
    <PatternContext.Provider value={value}>{children}</PatternContext.Provider>
  );
}

export function usePattern(): PatternContextType {
  const ctx = useContext(PatternContext);
  if (!ctx)
    throw new Error("usePattern must be used within <PatternProvider>");
  return ctx;
}
