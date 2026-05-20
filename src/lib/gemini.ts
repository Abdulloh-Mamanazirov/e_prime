import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are an expert E-Prime translator. E-Prime is a version of English that excludes all forms of the verb "to be" (am, is, are, was, were, be, being, been) and their contractions (I'm, you're, he's, she's, it's, that's, there's, we're, they're, isn't, aren't, wasn't, weren't).

Your job: Rewrite the user's text into natural, fluent E-Prime. 

Rules:
1. Remove ALL forms of "to be" and replace them with active, dynamic verbs.
2. Preserve the original meaning as closely as possible.
3. Keep the tone and register of the original text.
4. Do NOT add unnecessary words or change the structure more than needed.
5. The result MUST contain zero "to be" forms.

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "translated": "The E-Prime version of the text",
  "changes": [
    {
      "original": "the exact phrase that was changed",
      "replacement": "the new phrase",
      "reason": "brief explanation of why this violates E-Prime and how the replacement works"
    }
  ]
}

If the text already follows E-Prime (contains no "to be" forms), return:
{
  "translated": "the original text unchanged",
  "changes": []
}`;

export interface TranslationChange {
  original: string;
  replacement: string;
  reason: string;
}

export interface TranslationResult {
  translated: string;
  changes: TranslationChange[];
}

// ── Model fallback chain ──────────────────────────────────────────
// gemini-2.0-flash has ~1500 req/day on free tier (vs 20 for 2.5-flash).
// If daily quota exhausts, we fall through to the next model.
const MODEL_CHAIN = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
];

// ── Error helpers ─────────────────────────────────────────────────

/** Parse the retryDelay Google includes in 429/503 responses. */
function parseRetryDelay(error: unknown): number | null {
  try {
    const msg = String((error as any)?.message ?? "");
    // "Please retry in 20.192741211s."
    const inline = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
    if (inline) return Math.ceil(parseFloat(inline[1]) * 1000);
    // "retryDelay":"20s"
    const detail = msg.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
    if (detail) return Math.ceil(parseFloat(detail[1]) * 1000);
  } catch { /* swallow */ }
  return null;
}

/** True when the 429 is a *daily* quota (not per-minute rate limit). */
function isDailyQuotaError(error: unknown): boolean {
  const msg = String((error as any)?.message ?? "");
  return msg.includes("PerDay") || msg.includes("per day");
}

// ── Single-model attempt with retry ───────────────────────────────

async function tryModel(
  ai: InstanceType<typeof GoogleGenAI>,
  model: string,
  text: string,
): Promise<TranslationResult> {
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: text,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      });

      const raw = response?.text?.trim();
      if (!raw) throw new Error("Empty response from Gemini API");

      // Strip markdown code fences if present
      let json = raw;
      if (json.startsWith("```")) {
        json = json.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      try {
        const parsed = JSON.parse(json) as TranslationResult;
        if (!parsed.translated || !Array.isArray(parsed.changes)) {
          throw new Error("Invalid response structure");
        }
        return parsed;
      } catch {
        // JSON parse failed — return raw text as fallback
        return { translated: raw, changes: [] };
      }
    } catch (error: any) {
      const status: number | undefined = error?.status;

      // ── 429 Rate Limit ──────────────────────────────────────
      if (status === 429) {
        // Daily quota → don't retry, bubble up so the fallback chain
        // can switch to the next model.
        if (isDailyQuotaError(error)) throw error;

        // Per-minute rate limit → wait the exact delay Google tells us
        if (attempt < maxRetries) {
          const delay = parseRetryDelay(error) ?? 3000 * Math.pow(2, attempt);
          console.warn(`[${model}] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }

      // ── 503 Overloaded ──────────────────────────────────────
      if (status === 503 && attempt < maxRetries) {
        const delay = parseRetryDelay(error) ?? 2000 * Math.pow(2, attempt);
        console.warn(`[${model}] Service unavailable, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // Non-retryable or exhausted retries
      throw error;
    }
  }

  throw new Error(`Max retries exceeded for model ${model}`);
}

// ── Public entry point ────────────────────────────────────────────

export async function translateToEPrime(
  text: string,
  apiKey: string,
): Promise<TranslationResult> {
  const ai = new GoogleGenAI({ apiKey });

  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];
    try {
      console.log(`→ Translating with ${model}...`);
      return await tryModel(ai, model, text);
    } catch (error: any) {
      // Daily quota exhausted → fall through to next model
      if (error?.status === 429 && isDailyQuotaError(error)) {
        console.warn(`✗ Daily quota exhausted for ${model}, falling back...`);
        continue;
      }
      // Any other error on the last model → give up
      if (i === MODEL_CHAIN.length - 1) throw error;
      // Any other error on a non-last model → also try next model
      console.warn(`✗ ${model} failed (${error?.status ?? "unknown"}), falling back...`);
    }
  }

  throw new Error("All models in the fallback chain exhausted.");
}
