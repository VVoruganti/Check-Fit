import type { GarmentDescription } from "@/types/garment";
import type { DraftPiece, ChatMessage } from "@/types/draft-piece";
import type { BodyMeasurements } from "@/types/measurements";
import type { LLMPieceDefinition } from "@/types/llm-piece";
import { GARMENT_TEMPLATES } from "@/data/garment-templates";

// ── Vision ──────────────────────────────────────────────

export interface VisionResult {
  garmentDescription: GarmentDescription;
  analysis: string;
  draftPieces: DraftPiece[];
}

export async function analyzeGarmentImage(
  imageDataUrl: string,
): Promise<VisionResult> {
  const res = await fetch("/api/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Vision request failed" }));
    throw new Error(err.error ?? `Vision error: ${res.status}`);
  }

  return res.json();
}

// ── Chat (SSE streaming) ────────────────────────────────

export interface ChatUpdate {
  updatedDescription?: Partial<GarmentDescription>;
  updatedPieces?: DraftPiece[];
}

export interface ChatStreamEvent {
  type: "text" | "updates" | "done";
  content?: string;
  updatedDescription?: Partial<GarmentDescription>;
  updatedPieces?: DraftPiece[];
}

export async function* streamChatRefinement(
  messages: ChatMessage[],
  draftPieces: DraftPiece[],
  garmentDescription: GarmentDescription,
): AsyncGenerator<ChatStreamEvent> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, draftPieces, garmentDescription }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Chat request failed" }));
    throw new Error(err.error ?? `Chat error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          const event = JSON.parse(data) as ChatStreamEvent;
          yield event;
        } catch {
          // Skip unparseable lines
        }
      }
    }
  }
}

// ── Transcription ───────────────────────────────────────

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");

  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Transcription failed" }));
    throw new Error(err.error ?? `Transcribe error: ${res.status}`);
  }

  const data = await res.json() as { text: string };
  return data.text;
}

// ── TTS ─────────────────────────────────────────────────

export async function synthesizeSpeech(text: string): Promise<Blob> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`TTS error: ${res.status}`);
  }

  return res.blob();
}

// ── Generate Pieces (LLM) ──────────────────────────────

export async function generatePiecesFromLLM(
  garmentDescription: GarmentDescription,
  draftPieces: DraftPiece[],
  measurements: BodyMeasurements,
): Promise<LLMPieceDefinition[]> {
  const res = await fetch("/api/generate-pieces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ garmentDescription, draftPieces, measurements }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Piece generation failed" }));
    throw new Error(err.error ?? `Generate error: ${res.status}`);
  }

  const data = (await res.json()) as { pieces?: LLMPieceDefinition[] };
  return data.pieces ?? [];
}

// ── Refine Piece (SSE streaming) ───────────────────────

export interface PieceRefineStreamEvent {
  type: "text" | "updates" | "done";
  content?: string;
  updatedPiece?: LLMPieceDefinition;
}

export async function* streamPieceRefinement(
  messages: ChatMessage[],
  piece: LLMPieceDefinition,
  garmentDescription: GarmentDescription,
  measurements: BodyMeasurements,
  allPieceNames: string[],
): AsyncGenerator<PieceRefineStreamEvent> {
  const res = await fetch("/api/refine-piece", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, piece, garmentDescription, measurements, allPieceNames }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Piece refinement failed" }));
    throw new Error(err.error ?? `Refine error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          const event = JSON.parse(data) as PieceRefineStreamEvent;
          yield event;
        } catch {
          // Skip unparseable lines
        }
      }
    }
  }
}

// ── Template fallback (offline) ─────────────────────────

export function getTemplate(templateKey: string): GarmentDescription {
  return GARMENT_TEMPLATES[templateKey] ?? GARMENT_TEMPLATES.dress;
}
