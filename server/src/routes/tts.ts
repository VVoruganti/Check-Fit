import { Hono } from "hono";
import { textToSpeech } from "../lib/elevenlabs.js";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json<{ text: string }>();
  if (!body.text) {
    return c.json({ error: "text field required" }, 400);
  }

  try {
    const audioStream = await textToSpeech(body.text);

    return new Response(audioStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("TTS route error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "TTS failed" },
      500,
    );
  }
});

export default app;
