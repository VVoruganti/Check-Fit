import { Hono } from "hono";
import { getMistral, VISION_MODEL } from "../lib/mistral.js";

const app = new Hono();

const VISION_SYSTEM_PROMPT = `You are a garment construction analyst. Given an image of a garment, analyze its construction and return a JSON object with exactly 3 keys:

1. "description" — a GarmentDescription object conforming to this schema:
{
  category: "dress" | "top" | "hoodie" | "jacket" | "pants" | "skirt" | "jumpsuit",
  summary: string (1-2 sentence description),
  bodice?: { present: true, neckline: "crew"|"v-neck"|"scoop"|"square"|"boat", hasDarts: boolean, fit: "fitted"|"semi-fitted"|"loose" },
  sleeves?: { present: true, style: "set-in"|"raglan"|"kimono", length: "short"|"three-quarter"|"long", hasCuff: boolean },
  collar?: { present: true, style: "peter-pan"|"mandarin"|"notched"|"band" },
  hood?: { present: true },
  skirt?: { present: true, shape: "a-line"|"straight"|"circle"|"pencil", length: "mini"|"knee"|"midi"|"maxi" },
  pants?: { present: true, fit: "slim"|"straight"|"wide-leg", length: "shorts"|"capri"|"ankle"|"full" },
  waistband?: { present: true, style: "straight"|"elastic"|"contoured", width: number (inches, 1-4) },
  pockets?: { present: true, style: "patch"|"inseam"|"kangaroo", count: number },
  cuffs?: { present: true, style: "straight"|"ribbed"|"folded" },
  closure: { type: "none"|"buttons"|"zipper"|"pullover", placement: "front"|"back"|"side"|"none" }
}
Only include component keys (bodice, sleeves, etc.) if the garment HAS that component. Always include category, summary, and closure.

2. "analysis" — A 2-3 paragraph human-readable analysis of the garment's construction: fabric type guesses, construction techniques, notable design details.

3. "draftPieces" — An array of piece objects:
[{ id: string, name: string, type: "bodice"|"sleeves"|"collar"|"hood"|"skirt"|"pants"|"waistband"|"pockets"|"cuffs", quantity: number, notes: string, enabled: true }]
Include one entry per pattern piece needed. Use descriptive names like "Front Bodice", "Back Bodice", "Left Sleeve", etc.

Return ONLY the JSON object, no markdown fences.`;

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.log(`Rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

app.post("/", async (c) => {
  const start = Date.now();
  const body = await c.req.json<{ image: string }>();
  if (!body.image) {
    return c.json({ error: "image field required" }, 400);
  }

  const imageSize = Math.round(body.image.length / 1024);
  console.log(`[vision] Request received — image payload: ${imageSize}KB`);

  try {
    console.log(`[vision] Calling Mistral ${VISION_MODEL}...`);
    const response = await callWithRetry(() =>
      getMistral().chat.complete({
        model: VISION_MODEL,
        responseFormat: { type: "json_object" },
        messages: [
          { role: "system", content: VISION_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                imageUrl: body.image,
              },
              {
                type: "text",
                text: "Analyze this garment and return the JSON object.",
              },
            ],
          },
        ],
      }),
    );

    const elapsed = Date.now() - start;
    console.log(`[vision] Mistral responded in ${elapsed}ms`);

    const text = response.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") {
      console.error(`[vision] Empty response from model`);
      return c.json({ error: "Empty response from vision model" }, 502);
    }

    console.log(`[vision] Parsing response (${text.length} chars)...`);
    const parsed = JSON.parse(text);

    const result = {
      garmentDescription: parsed.description ?? parsed.garmentDescription ?? parsed,
      analysis: parsed.analysis ?? "",
      draftPieces: parsed.draftPieces ?? [],
    };

    console.log(`[vision] Success — category: ${result.garmentDescription.category}, pieces: ${result.draftPieces.length}, total time: ${Date.now() - start}ms`);
    return c.json(result);
  } catch (err) {
    const elapsed = Date.now() - start;
    console.error(`[vision] Error after ${elapsed}ms:`, err);
    const status = (err as { statusCode?: number }).statusCode;
    return c.json(
      {
        error: err instanceof Error ? err.message : "Vision analysis failed",
        retryable: status === 429,
      },
      status === 429 ? 429 : 500,
    );
  }
});

export default app;
