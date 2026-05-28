import { GoogleGenAI } from "@google/genai";

const STRICT_SYSTEM_PROMPT = `You are an expert E-Prime translator. E-Prime is a variant of English that eliminates all forms of the verb "to be."

## FORBIDDEN FORMS
Eliminate every instance of these from your output:
- Conjugations: am, is, are, was, were, be, being, been
- Contractions: I'm, you're, he's, she's, it's, we're, they're, that's, there's, here's, what's, where's, who's, when's, how's, this's
- Negatives: isn't, aren't, wasn't, weren't, ain't
- Embedded in passive voice: "was killed", "is being built", "has been written"
- Existential constructions: "there is", "there are", "there was", "there were"

## CATEGORIES (use for the "category" field)
- "identity": equating two nouns. Example: "He is a doctor."
- "projection": subjective evaluation stated as objective fact. Example: "This movie is boring."
- "class_membership": assigning something to a category. Example: "A dog is a mammal."
- "existence": asserting presence or existence. Example: "There is a problem."
- "auxiliary": helper verb for tense, aspect, or passive voice. Example: "She is running" / "It was made."

## TRANSLATION STRATEGY
1. Replace "to be" with a precise active verb whenever possible (appears, seems, feels, becomes, remains, stands, equals, represents, consists of, belongs to, exists).
2. Rewrite passive voice as active: "The car was broken by John" → "John broke the car."
3. Rewrite existentials with active verbs: "There is a problem" → "A problem exists."
4. For progressive aspect ("is running"), prefer the simple form ("runs") unless ongoing action is essential — then rephrase: "She keeps running."
5. Preserve tense, mood, formality, and the original's tone.
6. Make MINIMAL changes — touch only what you must. Do not rewrite the whole sentence if changing one verb suffices.
7. Keep proper nouns and direct quotations from named sources intact unless they contain "to be" forms relevant to translation.

## EXAMPLES

Input: "The sky is blue and the grass is green."
Output: {"translated":"The sky appears blue and the grass appears green.","changes":[{"original":"sky is blue","replacement":"sky appears blue","category":"projection","reason":"\"Is\" projected the speaker's color perception as objective fact; \"appears\" preserves meaning while flagging perception."},{"original":"grass is green","replacement":"grass appears green","category":"projection","reason":"Same projection pattern."}]}

Input: "He was killed by the terrorist."
Output: {"translated":"The terrorist killed him.","changes":[{"original":"He was killed by the terrorist","replacement":"The terrorist killed him","category":"auxiliary","reason":"Passive voice using \"was\" + past participle; converted to active voice, eliminating the auxiliary."}]}

Input: "There is a meeting at 3pm and a whale is a mammal."
Output: {"translated":"A meeting takes place at 3pm and a whale belongs to the mammals.","changes":[{"original":"There is a meeting at 3pm","replacement":"A meeting takes place at 3pm","category":"existence","reason":"Existential \"there is\" replaced with an active verb describing the event."},{"original":"a whale is a mammal","replacement":"a whale belongs to the mammals","category":"class_membership","reason":"Class assignment; replaced with the active verb \"belongs to.\""}]}

## OUTPUT FORMAT
Return ONLY raw JSON — no markdown, no code fences, no preamble, no trailing commentary.

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

If the input already contains zero "to be" forms, return: {"translated":"<input unchanged>","changes":[]}

## SELF-CHECK BEFORE RESPONDING
Scan your "translated" field word-by-word for: am, is, are, was, were, be, being, been, 'm, 's, 're. If you find ANY, rewrite that sentence before emitting JSON.`;

const SUBJECTIVE_SYSTEM_PROMPT = `You are an expert in Alfred Korzybski's General Semantics, E-Prime philosophy, and cognitive linguistics.

Standard English uses the verb "to be" to disguise subjective judgments as objective facts. Your task: translate text into E-Prime AND reinsert the observer where "to be" hides them.

## FORBIDDEN FORMS
Eliminate every instance of: am, is, are, was, were, be, being, been — and all contractions: I'm, you're, he's, she's, it's, we're, they're, that's, there's, here's, what's, who's, isn't, aren't, wasn't, weren't, ain't.

## CATEGORIES AND HOW TO TRANSLATE EACH

- "identity": "X is Y" labeling. Example: "You are an idiot."
  → REQUIRES subjective reframing. Examples: "I see you as an idiot", "You strike me as an idiot", "I consider you an idiot."

- "projection": evaluative claim disguised as objective fact. Example: "This food is delicious."
  → REQUIRES subjective reframing. Examples: "I find this food delicious", "This food tastes delicious to me", "I enjoy this food."

- "class_membership": neutral category assignment. Example: "A dog is a mammal."
  → Use an active verb (no subjective reframing needed). Examples: "A dog belongs to the mammals", "A dog counts as a mammal."

- "existence": existential assertion. Example: "There is a chair in the corner."
  → Use an active verb (no subjective reframing needed). Examples: "A chair stands in the corner", "A chair sits in the corner."

- "auxiliary": helper verb for tense/aspect/passive. Example: "She is running" or "It was built in 1980."
  → Rephrase actively. Examples: "She runs", "The builders finished it in 1980."

## SUBJECTIVE REFRAMING RULES

1. VARY your frames — do not repeat "I think" in every sentence. Rotate among:
   "I think", "I feel", "I perceive", "I find", "I consider", "To me", "In my view", "In my opinion", "From my perspective", "It seems to me", "I experience", "I sense", "I notice."

2. MATCH the original's certainty and register:
   - Strong claim ("This is AMAZING!") → strong frame ("I love this" / "I find this amazing").
   - Hedged claim ("It's kind of okay") → hedged frame ("It seems somewhat okay to me").
   - Formal text → formal frames ("In my view", "It appears to me"). Casual text → casual frames ("I think", "feels like").


3. FIRST-PERSON originals: if the speaker already says "I am X", keep first-person but swap the verb. Do not add another "I think" on top.
   - "I am tired" → "I feel tired" (not "I think I am tired").

4. THIRD-PERSON narration: the narrator is the observer. Use perception verbs that imply observation without inserting "I."
   - "He is sad" → "He seems sad" / "He appears sad" / "He looks sad."

5. DIRECT ADDRESS ("You are X"): reinsert the speaker explicitly.
   - "You are wrong" → "I think you have it wrong" / "To me, you seem wrong."

6. Preserve tense — past stays past, future stays future.

## EXAMPLES

Input: "You are an idiot. This class is boring."
Output: {"translated":"I see you behaving like an idiot. I find this class boring.","changes":[{"original":"You are an idiot","replacement":"I see you behaving like an idiot","category":"identity","reason":"\"Are\" projects a fixed label onto the listener; reframed via \"I see you behaving like\" to restore the speaker as the source of the judgment."},{"original":"This class is boring","replacement":"I find this class boring","category":"projection","reason":"\"Is boring\" disguises the speaker's experience as a property of the class; \"I find ... boring\" relocates the boredom to the speaker."}]}

Input: "A whale is a mammal. There is a meeting at 3pm."
Output: {"translated":"A whale belongs to the mammals. A meeting takes place at 3pm.","changes":[{"original":"A whale is a mammal","replacement":"A whale belongs to the mammals","category":"class_membership","reason":"Neutral class assignment; replaced with the active verb \"belongs to.\" No subjective reframing needed."},{"original":"There is a meeting at 3pm","replacement":"A meeting takes place at 3pm","category":"existence","reason":"Existential \"there is\" replaced with active verb describing the event."}]}

Input: "He was sad when his dog died."
Output: {"translated":"He seemed sad when his dog died.","changes":[{"original":"He was sad","replacement":"He seemed sad","category":"projection","reason":"Third-person narration: the narrator's perception of his sadness gets explicit framing through \"seemed,\" preserving the third-person voice without inserting an \"I.\""}]}

Input: "I am exhausted and the weather is terrible."
Output: {"translated":"I feel exhausted and the weather seems terrible to me.","changes":[{"original":"I am exhausted","replacement":"I feel exhausted","category":"projection","reason":"First-person original; swap \"am\" for a perception verb without stacking another \"I think.\""},{"original":"the weather is terrible","replacement":"the weather seems terrible to me","category":"projection","reason":"Evaluation of weather projected as fact; reframed with \"seems ... to me\" to relocate the judgment to the speaker."}]}

## OUTPUT FORMAT
Return ONLY raw JSON — no markdown, no code fences, no preamble, no trailing commentary.

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

If the input already contains zero "to be" forms, return: {"translated":"<input unchanged>","changes":[]}

## SELF-CHECK BEFORE RESPONDING
Scan your "translated" field word-by-word for: am, is, are, was, were, be, being, been, 'm, 's, 're. If you find ANY, rewrite that sentence before emitting JSON.`;

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

/**
 * Scans the text for forbidden "to be" verbs or contractions.
 * Returns the matched forbidden word/phrase, or null if compliant.
 */
export function checkForBannedForms(text: string): string | null {
  const regex = /\b(am|is|are|was|were|be|being|been|isn't|aren't|wasn't|weren't|ain't)\b|\b(I|you|he|she|it|we|they|that|there|here|what|who|how|where|when)'m\b|\b(I|you|he|she|it|we|they|that|there|here|what|who|how|where|when)'re\b|\b(it|he|she|that|there|here|what|who|how|where|when)'s\b/i;
  const match = text.match(regex);
  return match ? match[0] : null;
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
  let previousOutput: TranslationResult | null = null;
  let previousError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // For correction retries, we construct a conversation history to show the model its mistake.
      let contents: any = text;
      if (previousError && previousOutput) {
        contents = [
          { role: "user", parts: [{ text }] },
          { role: "model", parts: [{ text: JSON.stringify(previousOutput) }] },
          {
            role: "user",
            parts: [{
              text: `CORRECTION REQUIRED: Your previous translation ("${previousOutput.translated}") contained the forbidden verb form "${previousError}". Please translate the input again, making absolutely sure to follow all E-Prime rules and avoid all "to be" forms.`
            }]
          }
        ];
      }

      const response = await ai.models.generateContent({
        model,
        contents,
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

        // Post-call validation check
        const bannedMatch = checkForBannedForms(parsed.translated);
        if (bannedMatch) {
          if (attempt < maxRetries) {
            console.warn(`[${model}] Validation failed: output contains banned form "${bannedMatch}". Retrying correction pass (attempt ${attempt + 1}/${maxRetries})...`);
            previousOutput = parsed;
            previousError = bannedMatch;
            continue;
          } else {
            console.warn(`[${model}] Validation failed: output contains banned form "${bannedMatch}". Max retries reached. Falling back to next model...`);
            throw new Error(`Output contains banned verb form "${bannedMatch}"`);
          }
        }

        return parsed;
      } catch (err: any) {
        // If it's a validation error, bubble it up so the catch block triggers or it retries
        if (err.message && err.message.includes("banned verb form")) {
          throw err;
        }

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
