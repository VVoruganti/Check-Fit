import { Hono } from "hono";
import { getMistral, CHAT_MODEL } from "../lib/mistral.js";

const app = new Hono();

interface GenerateRequest {
  garmentDescription: unknown;
  draftPieces: { id: string; name: string; type: string; quantity: number; notes: string; enabled: boolean }[];
  measurements: Record<string, number>;
}

const GENERATE_SYSTEM_PROMPT = `You are a sewing pattern shape generator. Given a garment description, list of pattern pieces, and body measurements (all in inches), you produce ShapeCommand arrays that define the outline of each piece.

## Coordinate System
- All coordinates are in INCHES
- Origin (0,0) is at the center of each piece
- Positive X is right, positive Y is up
- Each piece should be a closed shape starting with a "move" command

## ShapeCommand Format
Three command types:
- { "type": "move", "x": number, "y": number } — move to starting point (always first)
- { "type": "line", "x": number, "y": number } — straight line to point
- { "type": "curve", "cpX": number, "cpY": number, "x": number, "y": number } — quadratic bezier curve (cpX/cpY is the control point, x/y is the endpoint)

## Sizing Guidelines
Use the provided body measurements to determine piece dimensions:
- Bodice width ≈ (bust / 4) + 1 inch ease per piece (front/back)
- Bodice height ≈ backLength or frontLength measurement
- Sleeve width at top ≈ (upperArm / 2) + 1 inch ease
- Sleeve length ≈ armLength measurement adjusted for sleeve style
- Pants width at hip ≈ (hip / 4) + 1 inch ease per leg
- Pants inseam ≈ inseam measurement
- Waistband length ≈ waist / 2 per piece
- Collar/Hood: derive from neck measurement
- For decorative pieces (appliqués, loops, straps): use reasonable small dimensions (2-6 inches)

## Shape Quality
- Use curves for necklines, armholes, sleeve caps, hip curves, and crotch curves
- Use straight lines for side seams, hems, and center lines
- Include dart markings as subtle notches where applicable
- Pieces should look like realistic sewing pattern pieces, not simple rectangles

## Example: A simple front bodice (bust=36, backLength=16)

{ "type": "move", "x": -10, "y": 8 }   // top-left (shoulder)
{ "type": "curve", "cpX": -4, "cpY": 9, "x": 0, "y": 5 }  // neckline curve
{ "type": "curve", "cpX": 4, "cpY": 9, "x": 10, "y": 8 }   // neckline to shoulder
{ "type": "line", "x": 10, "y": 4 }     // shoulder to armhole start
{ "type": "curve", "cpX": 11, "cpY": 0, "x": 10, "y": -4 }  // armhole curve
{ "type": "line", "x": 10, "y": -8 }    // side seam
{ "type": "line", "x": -10, "y": -8 }   // hem
{ "type": "line", "x": -10, "y": -4 }   // side seam up
{ "type": "curve", "cpX": -11, "cpY": 0, "x": -10, "y": 4 } // armhole
// shape auto-closes back to start

## Example: A belt loop (small piece)

{ "type": "move", "x": -0.75, "y": 3 }
{ "type": "line", "x": 0.75, "y": 3 }
{ "type": "line", "x": 0.75, "y": -3 }
{ "type": "line", "x": -0.75, "y": -3 }

## Output Format
Return a JSON object with a single "pieces" key containing an array of piece definitions:

{
  "pieces": [
    {
      "id": "front-bodice",
      "name": "Front Bodice",
      "commands": [ ...ShapeCommand array... ],
      "cutCount": 1,
      "cutOnFold": true,
      "instructions": "Cut 1 on fold. Mark dart positions.",
      "color": "#c47a5a"
    },
    ...
  ]
}

Generate a piece for EVERY item in the draft pieces list. Do not skip any pieces. Each piece must have a unique id (kebab-case) and realistic shape commands sized according to the measurements.`;

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.log(`[generate-pieces] Rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
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
  const body = await c.req.json<GenerateRequest>();

  // Default enabled to true — LLMs sometimes omit the field when rewriting piece arrays
  const enabledPieces = body.draftPieces.filter((p) => p.enabled !== false);
  console.log(`[generate-pieces] Request — ${enabledPieces.length} enabled pieces, category: ${(body.garmentDescription as any)?.category ?? "unknown"}`);

  if (enabledPieces.length === 0) {
    return c.json({ error: "No enabled draft pieces to generate" }, 400);
  }

  const userContent = `Generate pattern piece shapes for this garment:

Garment description:
${JSON.stringify(body.garmentDescription, null, 2)}

Pattern pieces to generate:
${JSON.stringify(enabledPieces.map((p) => ({ id: p.id, name: p.name, type: p.type, quantity: p.quantity, notes: p.notes })), null, 2)}

Body measurements (inches):
${JSON.stringify(body.measurements, null, 2)}

Generate a ShapeCommand array for each piece. Size them according to the measurements. Return the JSON object.`;

  try {
    console.log(`[generate-pieces] Calling Mistral ${CHAT_MODEL} (json_object)...`);
    const response = await callWithRetry(() =>
      getMistral().chat.complete({
        model: CHAT_MODEL,
        responseFormat: { type: "json_object" },
        messages: [
          { role: "system", content: GENERATE_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    );

    const elapsed = Date.now() - start;
    console.log(`[generate-pieces] Mistral responded in ${elapsed}ms`);

    const text = response.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") {
      console.error(`[generate-pieces] Empty response from model`);
      return c.json({ error: "Empty response from model" }, 502);
    }

    console.log(`[generate-pieces] Parsing response (${text.length} chars)...`);
    const parsed = JSON.parse(text);
    const pieces = parsed.pieces ?? [];

    console.log(`[generate-pieces] Success — ${pieces.length} pieces generated, total time: ${Date.now() - start}ms`);
    return c.json({ pieces });
  } catch (err) {
    const elapsed = Date.now() - start;
    console.error(`[generate-pieces] Error after ${elapsed}ms:`, err);
    const status = (err as { statusCode?: number }).statusCode;
    return c.json(
      {
        error: err instanceof Error ? err.message : "Piece generation failed",
        retryable: status === 429,
      },
      status === 429 ? 429 : 500,
    );
  }
});

export default app;
