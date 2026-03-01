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
import type { LLMPieceDefinition } from "@/types/llm-piece";
import { DEFAULT_MEASUREMENTS } from "@/data/default-measurements";
import { applyDraftPieces } from "@/lib/draft-to-description";
import { convertLLMPieces } from "@/lib/llm-to-pattern";
import { generatePiecesFromLLM } from "@/lib/api";

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
  // LLM generation state
  pieceDefinitions: LLMPieceDefinition[];
  generating: boolean;
  generateError: string | null;
  // Viewer chat state
  viewerChatMessages: ChatMessage[];
  viewerChatLoading: boolean;
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
  // LLM generation actions
  generateFromLLM: () => Promise<void>;
  setPieceDefinitions: (defs: LLMPieceDefinition[]) => void;
  updatePieceDefinition: (id: string, updated: LLMPieceDefinition) => void;
  // Viewer chat actions
  addViewerChatMessage: (message: ChatMessage) => void;
  setViewerChatLoading: (loading: boolean) => void;
  clearViewerChat: () => void;
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

  // LLM generation state
  const [pieceDefinitions, setPieceDefinitions] = useState<LLMPieceDefinition[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Viewer chat state
  const [viewerChatMessages, setViewerChatMessages] = useState<ChatMessage[]>([]);
  const [viewerChatLoading, setViewerChatLoading] = useState(false);

  // Derived: apply draft piece toggles to base description
  const effectiveDescription = useMemo(() => {
    if (!garmentDescription) return null;
    if (draftPieces.length === 0) return garmentDescription;
    return applyDraftPieces(garmentDescription, draftPieces);
  }, [garmentDescription, draftPieces]);

  // Derived: convert LLM piece definitions to renderable pattern pieces
  const patternPieces = useMemo(
    () => convertLLMPieces(pieceDefinitions),
    [pieceDefinitions],
  );

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

  // LLM generation action
  const generateFromLLM = useCallback(async () => {
    const desc = effectiveDescription ?? garmentDescription;
    if (!desc) {
      setGenerateError("No garment description available.");
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    setPieceDefinitions([]);
    try {
      const pieces = await generatePiecesFromLLM(desc, draftPieces, measurements);
      setPieceDefinitions(pieces);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [effectiveDescription, garmentDescription, draftPieces, measurements]);

  const updatePieceDefinition = useCallback(
    (id: string, updated: LLMPieceDefinition) => {
      setPieceDefinitions((prev) =>
        prev.map((p) => (p.id === id ? updated : p)),
      );
    },
    [],
  );

  // Viewer chat actions
  const addViewerChatMessage = useCallback((message: ChatMessage) => {
    setViewerChatMessages((prev) => [...prev, message]);
  }, []);

  const clearViewerChat = useCallback(() => {
    setViewerChatMessages([]);
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
      pieceDefinitions,
      generating,
      generateError,
      viewerChatMessages,
      viewerChatLoading,
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
      generateFromLLM,
      setPieceDefinitions,
      updatePieceDefinition,
      addViewerChatMessage,
      setViewerChatLoading,
      clearViewerChat,
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
      pieceDefinitions,
      generating,
      generateError,
      viewerChatMessages,
      viewerChatLoading,
      setStep,
      setGarmentDescription,
      toggleDraftPiece,
      updateDraftPiece,
      addChatMessage,
      clearChat,
      setMeasurement,
      setMeasurements,
      generateFromLLM,
      updatePieceDefinition,
      addViewerChatMessage,
      clearViewerChat,
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
