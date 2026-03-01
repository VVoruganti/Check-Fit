import { Mistral } from "@mistralai/mistralai";

let _client: Mistral | null = null;

/** Lazy-initialized Mistral client — reads API key at first use, not at import time */
export function getMistral(): Mistral {
  if (!_client) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error("MISTRAL_API_KEY not set. Add it to server/.env or root .env");
    }
    _client = new Mistral({ apiKey });
  }
  return _client;
}

export const VISION_MODEL = "mistral-large-2512";
export const CHAT_MODEL = "mistral-large-2512";
export const STT_MODEL = "mistral-small-latest";
