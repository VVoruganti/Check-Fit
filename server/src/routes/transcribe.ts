import { Hono } from "hono";

const app = new Hono();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY ?? "";

app.post("/", async (c) => {
  const formData = await c.req.formData();
  const audioFile = formData.get("audio");

  if (!audioFile || !(audioFile instanceof File)) {
    return c.json({ error: "audio file required" }, 400);
  }

  try {
    // Forward the audio to Mistral's transcription endpoint
    const mistralForm = new FormData();
    mistralForm.append("file", audioFile, "audio.webm");
    mistralForm.append("model", "mistral-small-latest");

    const res = await fetch("https://api.mistral.ai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: mistralForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Transcription error:", res.status, errText);
      return c.json({ error: `Transcription failed: ${res.status}` }, 502);
    }

    const result = await res.json() as { text: string };
    return c.json({ text: result.text });
  } catch (err) {
    console.error("Transcribe route error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      500,
    );
  }
});

export default app;
