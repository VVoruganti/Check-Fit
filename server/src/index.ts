import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env BEFORE any other imports so env vars are available at module init.
// Bun auto-loads .env from cwd, but when cwd is project root we also need
// to check server/.env. This loader fills in any vars not already set.
for (const envPath of [
  resolve(import.meta.dirname, "../../.env"),        // server/.env (relative to src/)
  resolve(import.meta.dirname, "../../../.env"),      // root .env
]) {
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      const value = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // File not found — skip
  }
}

// Now import everything else (env vars are set before these modules init)
const { serve } = await import("@hono/node-server");
const { Hono } = await import("hono");
const { cors } = await import("hono/cors");
const { default: vision } = await import("./routes/vision.js");
const { default: chat } = await import("./routes/chat.js");
const { default: transcribe } = await import("./routes/transcribe.js");
const { default: tts } = await import("./routes/tts.js");
const { default: generatePieces } = await import("./routes/generate-pieces.js");
const { default: refinePiece } = await import("./routes/refine-piece.js");

const app = new Hono();

app.use("/*", cors({ origin: "*" }));

app.route("/api/vision", vision);
app.route("/api/chat", chat);
app.route("/api/transcribe", transcribe);
app.route("/api/tts", tts);
app.route("/api/generate-pieces", generatePieces);
app.route("/api/refine-piece", refinePiece);

app.get("/api/health", (c) => c.json({ status: "ok" }));

const port = parseInt(process.env.PORT ?? "3001", 10);

console.log(`Check-Fit server listening on http://localhost:${port}`);
console.log(`MISTRAL_API_KEY: ${process.env.MISTRAL_API_KEY ? `${process.env.MISTRAL_API_KEY.slice(0, 8)}...` : "NOT SET"}`);

serve({ fetch: app.fetch, port });
