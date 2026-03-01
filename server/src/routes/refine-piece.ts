import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { getMistral, CHAT_MODEL } from "../lib/mistral.js";

const app = new Hono();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface LLMPieceDefinition {
  id: string;
  name: string;
  commands: { type: string; x?: number; y?: number; cpX?: number; cpY?: number }[];
  cutCount: number;
  cutOnFold: boolean;
  instructions: string;
  color?: string;
}

interface RefineRequest {
  messages: ChatMessage[];
  piece: LLMPieceDefinition;
  garmentDescription: unknown;
  measurements: Record<string, number>;
  allPieceNames: string[];
}

const REFINE_SYSTEM_PROMPT = `You are a sewing pattern piece refinement assistant. You are helping the user modify a specific pattern piece shape.

## ShapeCommand Format
The piece shape is defined by an array of commands (coordinates in INCHES, origin at piece center):
- { "type": "move", "x": number, "y": number } — starting point (always first)
- { "type": "line", "x": number, "y": number } — straight line to point
- { "type": "curve", "cpX": number, "cpY": number, "x": number, "y": number } — quadratic bezier curve

## How to Respond
1. Respond conversationally about what you're changing and why
2. When you modify the piece shape, include an <updates> block at the END of your response:

<updates>
{
  "id": "piece-id",
  "name": "Piece Name",
  "commands": [ ...updated ShapeCommand array... ],
  "cutCount": 1,
  "cutOnFold": false,
  "instructions": "Updated instructions...",
  "color": "#hexcolor"
}
</updates>

The <updates> block should contain the COMPLETE updated piece definition, not just changed fields.

If the user is just asking questions without requesting changes, respond normally without an <updates> block.

## Common Modifications
- "make wider" → increase X coordinates proportionally
- "make longer/taller" → increase Y coordinates proportionally
- "add curve to neckline" → replace line commands with curve commands along the neckline
- "add dart" → add a small V-notch at the appropriate position
- "make more fitted" → reduce ease (bring side seam coordinates closer to body measurement / 4)
- "round the corners" → replace line intersections with small curves

Be precise with coordinates. Maintain piece center at origin. Use sewing terminology.`;

app.post("/", async (c) => {
  const start = Date.now();
  const body = await c.req.json<RefineRequest>();

  console.log(`[refine-piece] Request — piece: ${body.piece.name}, ${body.messages.length} messages`);

  const systemContent = `${REFINE_SYSTEM_PROMPT}

Current piece being refined:
${JSON.stringify(body.piece, null, 2)}

Garment description:
${JSON.stringify(body.garmentDescription, null, 2)}

Body measurements (inches):
${JSON.stringify(body.measurements, null, 2)}

All pieces in this pattern: ${body.allPieceNames.join(", ")}`;

  try {
    console.log(`[refine-piece] Calling Mistral ${CHAT_MODEL} (streaming)...`);
    const stream = await getMistral().chat.stream({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemContent },
        ...body.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    return streamSSE(c, async (sseStream) => {
      let fullText = "";
      let chunks = 0;
      for await (const event of stream) {
        const delta = event.data?.choices?.[0]?.delta?.content;
        if (typeof delta === "string") {
          fullText += delta;
          chunks++;
          await sseStream.writeSSE({ data: JSON.stringify({ type: "text", content: delta }) });
        }
      }

      console.log(`[refine-piece] Stream complete — ${chunks} chunks, ${fullText.length} chars, ${Date.now() - start}ms`);

      // Parse <updates> block if present
      const updatesMatch = fullText.match(/<updates>\s*([\s\S]*?)\s*<\/updates>/);
      if (updatesMatch) {
        try {
          const updatedPiece = JSON.parse(updatesMatch[1]);
          console.log(`[refine-piece] Parsed <updates> block — piece: ${updatedPiece.name}, commands: ${updatedPiece.commands?.length ?? 0}`);
          await sseStream.writeSSE({
            data: JSON.stringify({ type: "updates", updatedPiece }),
          });
        } catch {
          console.warn(`[refine-piece] Failed to parse <updates> block`);
        }
      }

      await sseStream.writeSSE({ data: JSON.stringify({ type: "done" }) });
    });
  } catch (err) {
    console.error(`[refine-piece] Error after ${Date.now() - start}ms:`, err);
    return c.json(
      { error: err instanceof Error ? err.message : "Piece refinement failed" },
      500,
    );
  }
});

export default app;
