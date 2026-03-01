import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { getMistral, CHAT_MODEL } from "../lib/mistral.js";

const app = new Hono();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  draftPieces: unknown[];
  garmentDescription: unknown;
}

const CHAT_SYSTEM_PROMPT = `You are a sewing pattern design assistant helping a user refine their garment pattern. You have access to the current garment description and draft pieces.

When the user asks to modify the pattern (add/remove pieces, change styles, adjust details), respond conversationally AND include an <updates> block at the END of your response with the changes in JSON format:

<updates>
{
  "updatedDescription": { ...partial GarmentDescription fields to merge... },
  "updatedPieces": [ ...full updated DraftPiece array... ]
}
</updates>

The updatedDescription should only contain the fields that changed. The updatedPieces should be the COMPLETE array with all pieces (not just changed ones).

DraftPiece format: { id: string, name: string, type: "bodice"|"sleeves"|"collar"|"hood"|"skirt"|"pants"|"waistband"|"pockets"|"cuffs", quantity: number, notes: string, enabled: boolean }

If the user is just chatting or asking questions (not requesting changes), respond normally without an <updates> block.

Be concise but helpful. Use sewing terminology when appropriate.`;

app.post("/", async (c) => {
  const start = Date.now();
  const body = await c.req.json<ChatRequest>();

  console.log(`[chat] Request received — ${body.messages.length} messages, ${body.draftPieces.length} pieces`);

  const systemContent = `${CHAT_SYSTEM_PROMPT}

Current garment description:
${JSON.stringify(body.garmentDescription, null, 2)}

Current draft pieces:
${JSON.stringify(body.draftPieces, null, 2)}`;

  try {
    console.log(`[chat] Calling Mistral ${CHAT_MODEL} (streaming)...`);
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

      console.log(`[chat] Stream complete — ${chunks} chunks, ${fullText.length} chars, ${Date.now() - start}ms`);

      // Parse <updates> block if present
      const updatesMatch = fullText.match(/<updates>\s*([\s\S]*?)\s*<\/updates>/);
      if (updatesMatch) {
        try {
          const updates = JSON.parse(updatesMatch[1]);
          console.log(`[chat] Parsed <updates> block — has description: ${!!updates.updatedDescription}, has pieces: ${!!updates.updatedPieces}`);
          await sseStream.writeSSE({
            data: JSON.stringify({ type: "updates", ...updates }),
          });
        } catch {
          console.warn(`[chat] Failed to parse <updates> block`);
        }
      }

      await sseStream.writeSSE({ data: JSON.stringify({ type: "done" }) });
    });
  } catch (err) {
    console.error(`[chat] Error after ${Date.now() - start}ms:`, err);
    return c.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      500,
    );
  }
});

export default app;
