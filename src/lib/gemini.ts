import { GoogleGenAI } from "@google/genai";

const STRICT_SYSTEM_PROMPT = `You are an expert E-Prime translator. E-Prime is a version of English that excludes all forms of the verb "to be" (am, is, are, was, were, be, being, been) and their contractions (I'm, you're, he's, she's, it's, that's, there's, we're, they're, isn't, aren't, wasn't, weren't).

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
      "category": "identity" | "projection" | "class_membership" | "existence" | "auxiliary",
      "reason": "brief explanation of why this violates E-Prime and how the replacement works"
    }
  ]
}

If the text already follows E-Prime (contains no "to be" forms), return:
{
  "translated": "the original text unchanged",
  "changes": []
}`;

const SUBJECTIVE_SYSTEM_PROMPT = `You are an expert in Alfred Korzybski's General Semantics, E-Prime philosophy, and cognitive linguistics. 

Standard English uses the verb "to be" to make subjective projections seem like objective facts. For example:
- Projection: Saying "This class is boring" instead of acknowledging "I feel bored by this class".
- Identity: Saying "You are a mental disease" instead of "I think you represent a mental disease" or "To me, you behave like a mental disease".

Your job: Translate the user's text into E-Prime, but specifically focus on "Honest Subjectivity" (the Codex).

Rules:
1. Remove ALL forms of "to be" (am, is, are, was, were, be, being, been) and their contractions.
2. Identify the function of each "to be" form in the original sentence.
3. If the "to be" form functions as "projection" (subjective judgment/evaluation projected as objective fact) or "identity" (labeling someone/something), you MUST rewrite the statement to explicitly reinsert the observer/speaker. Use subjective reframing like "I think", "I feel", "I perceive", "To me", "In my view", "In my opinion", or "I experience".
4. If it is "class_membership", "existence", or an "auxiliary" helper verb, translate it to an active, descriptive verb (e.g., "A dog belongs to the canine group", "A building stands there", "He continues walking").
5. The translation MUST contain zero "to be" forms.

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "translated": "The E-Prime version of the text",
  "changes": [
    {
      "original": "the exact phrase that was changed",
      "replacement": "the new phrase",
      "category": "identity" | "projection" | "class_membership" | "existence" | "auxiliary",
      "reason": "brief explanation of the semantic function of 'to be' here and how the replacement reinserts subjectivity or active voice"
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
  category: "identity" | "projection" | "class_membership" | "existence" | "auxiliary";
  reason: string;
}

export interface TranslationResult {
  translated: string;
  changes: TranslationChange[];
}

// ── Model fallback chain ──────────────────────────────────────────
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
    const inline = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
    if (inline) return Math.ceil(parseFloat(inline[1]) * 1000);
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
  mode: "strict" | "subjective",
): Promise<TranslationResult> {
  const maxRetries = 2;
  const systemInstruction = mode === "strict" ? STRICT_SYSTEM_PROMPT : SUBJECTIVE_SYSTEM_PROMPT;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: text,
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              translated: { type: "STRING" },
              changes: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    original: { type: "STRING" },
                    replacement: { type: "STRING" },
                    category: {
                      type: "STRING",
                      enum: ["identity", "projection", "class_membership", "existence", "auxiliary"]
                    },
                    reason: { type: "STRING" },
                  },
                  required: ["original", "replacement", "category", "reason"],
                },
              },
            },
            required: ["translated", "changes"],
          },
        },
      });

      const raw = response?.text?.trim();
      if (!raw) throw new Error("Empty response from Gemini API");

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
        const match = json.match(/"translated"\s*:\s*"([^]*)/);
        if (match && match[1]) {
          let partialText = match[1];
          const changesIdx = partialText.indexOf('",\n  "changes"');
          if (changesIdx !== -1) {
            partialText = partialText.substring(0, changesIdx);
          } else {
            if (partialText.endsWith('"')) partialText = partialText.slice(0, -1);
          }
          
          partialText = partialText.replace(/\\n/g, "\n").replace(/\\"/g, '"');
          return { 
            translated: partialText + "\n\n[Note: Text was truncated due to length limits]", 
            changes: [] 
          };
        }
        
        return { 
          translated: "[Translation failed to parse or was truncated. Please try a shorter text.]", 
          changes: [] 
        };
      }
    } catch (error: any) {
      const status: number | undefined = error?.status;

      if (status === 429) {
        if (isDailyQuotaError(error)) throw error;

        if (attempt < maxRetries) {
          const delay = parseRetryDelay(error) ?? 3000 * Math.pow(2, attempt);
          console.warn(`[${model}] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }

      if (status === 503 && attempt < maxRetries) {
        const delay = parseRetryDelay(error) ?? 2000 * Math.pow(2, attempt);
        console.warn(`[${model}] Service unavailable, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw error;
    }
  }

  throw new Error(`Max retries exceeded for model ${model}`);
}

// ── Public entry point ────────────────────────────────────────────

export async function translateToEPrime(
  text: string,
  apiKey: string,
  mode: "strict" | "subjective" = "subjective",
): Promise<TranslationResult> {
  const ai = new GoogleGenAI({ apiKey });

  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];
    try {
      console.log(`→ Translating with ${model} in ${mode} mode...`);
      return await tryModel(ai, model, text, mode);
    } catch (error: any) {
      if (error?.status === 429 && isDailyQuotaError(error)) {
        console.warn(`✗ Daily quota exhausted for ${model}, falling back...`);
        continue;
      }
      if (i === MODEL_CHAIN.length - 1) throw error;
      console.warn(`✗ ${model} failed (${error?.status ?? "unknown"}), falling back...`);
    }
  }

  throw new Error("All models in the fallback chain exhausted.");
}
