import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePattern } from "@/context/PatternContext";
import { streamChatRefinement } from "@/lib/api";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import type { GarmentDescription } from "@/types/garment";

export default function RefineStep() {
  const navigate = useNavigate();
  const {
    analysisText,
    garmentDescription,
    draftPieces,
    chatMessages,
    chatLoading,
    toggleDraftPiece,
    addChatMessage,
    setChatLoading,
    setGarmentDescription,
    setDraftPieces,
    setStep,
  } = usePattern();

  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { isRecording, startRecording, stopRecording } = useVoiceChat({
    onTranscription: (text) => {
      setInputValue(text);
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || chatLoading || !garmentDescription) return;

    setInputValue("");
    addChatMessage({ role: "user", content: text });
    setChatLoading(true);

    try {
      const allMessages = [...chatMessages, { role: "user" as const, content: text }];
      let assistantText = "";

      for await (const event of streamChatRefinement(
        allMessages,
        draftPieces,
        garmentDescription,
      )) {
        if (event.type === "text" && event.content) {
          assistantText += event.content;
        }
        if (event.type === "updates") {
          if (event.updatedPieces) {
            // Default enabled to true — LLMs often omit the field when rewriting the array
            setDraftPieces(
              event.updatedPieces.map((p) => ({
                ...p,
                enabled: p.enabled !== false,
              })),
            );
          }
          if (event.updatedDescription) {
            setGarmentDescription({
              ...garmentDescription,
              ...event.updatedDescription,
            } as GarmentDescription);
          }
        }
      }

      // Remove <updates> block from displayed text
      const cleanText = assistantText
        .replace(/<updates>[\s\S]*?<\/updates>/g, "")
        .trim();
      if (cleanText) {
        addChatMessage({ role: "assistant", content: cleanText });
      }
    } catch (err) {
      console.error("Chat error:", err);
      addChatMessage({
        role: "assistant",
        content: "Sorry, I had trouble processing that. Please try again.",
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContinue = () => {
    setStep("measure");
    navigate("/create/measure");
  };

  const enabledCount = draftPieces.filter((p) => p.enabled).length;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Left: Piece Cards */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pattern Pieces</h2>
          <Badge variant="secondary">
            {enabledCount} / {draftPieces.length} enabled
          </Badge>
        </div>

        {analysisText && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {analysisText}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {draftPieces.map((piece) => (
            <button
              key={piece.id}
              onClick={() => toggleDraftPiece(piece.id)}
              className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                piece.enabled
                  ? "border-primary/40 bg-primary/5"
                  : "border-border opacity-50"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  piece.enabled
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {piece.enabled && (
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{piece.name}</span>
                  <Badge variant="outline" className="text-xs">
                    x{piece.quantity}
                  </Badge>
                </div>
                {piece.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {piece.notes}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {piece.type}
              </Badge>
            </button>
          ))}
        </div>

        <Button className="w-full" size="lg" onClick={handleContinue}>
          Continue to Measurements
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

      {/* Right: Chat Interface */}
      <div className="lg:col-span-3">
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Refine with AI</CardTitle>
            <p className="text-xs text-muted-foreground">
              Ask to add, remove, or modify pieces. Try "add a hood" or "change
              sleeves to kimono style".
            </p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
              {chatMessages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <p className="mb-2">No messages yet.</p>
                  <p>
                    Chat with the AI to refine your pattern pieces, or toggle
                    them on the left.
                  </p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {isRecording ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  )}
                </svg>
              </Button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask to modify pieces..."
                disabled={chatLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || chatLoading}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
