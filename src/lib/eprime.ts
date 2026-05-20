// E-Prime violation detection and scoring utilities
// All forms of "to be" that violate E-Prime

const TO_BE_FORMS = [
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "being",
  "been",
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
];

// Contraction patterns that contain "to be" forms
const CONTRACTION_PATTERNS = [
  /\b\w+'m\b/gi,       // I'm
  /\b\w+'re\b/gi,      // you're, we're, they're
  /\b(?:it|he|she|that|there|what|who|where|here)'s\b/gi, // it's, he's, she's, that's, there's
];

export interface ViolationMatch {
  word: string;
  index: number;
  length: number;
}

/**
 * Detects all E-Prime violations in a text.
 * Returns an array of violation matches with their positions.
 */
export function detectViolations(text: string): ViolationMatch[] {
  const violations: ViolationMatch[] = [];

  // Check for standalone "to be" forms
  for (const form of TO_BE_FORMS) {
    const regex = new RegExp(`\\b${form}\\b`, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      violations.push({
        word: match[0],
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // Check for contractions
  for (const pattern of CONTRACTION_PATTERNS) {
    // Create a fresh regex instance each time
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      violations.push({
        word: match[0],
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // Sort by index and deduplicate
  violations.sort((a, b) => a.index - b.index);

  // Deduplicate overlapping violations
  const deduplicated: ViolationMatch[] = [];
  for (const v of violations) {
    const last = deduplicated[deduplicated.length - 1];
    if (!last || v.index >= last.index + last.length) {
      deduplicated.push(v);
    }
  }

  return deduplicated;
}

/**
 * Calculates the E-Prime compliance score.
 * Returns a percentage (0-100) where 100 means fully compliant.
 */
export function calculateScore(text: string): number {
  if (!text.trim()) return 100;

  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return 100;

  const violations = detectViolations(text);
  const violationCount = violations.length;

  const score = Math.max(0, ((words.length - violationCount) / words.length) * 100);
  return Math.round(score * 10) / 10;
}

/**
 * Checks if a text is E-Prime compliant (no "to be" violations).
 */
export function isEPrimeCompliant(text: string): boolean {
  return detectViolations(text).length === 0;
}

/**
 * Returns all "to be" forms grouped by category for the Info Strip.
 */
export function getToBeFormsReference() {
  return {
    present: ["am", "is", "are"],
    past: ["was", "were"],
    infinitive: ["be"],
    participles: ["being", "been"],
    negatives: ["isn't", "aren't", "wasn't", "weren't"],
    contractions: ["I'm", "you're", "we're", "they're", "he's", "she's", "it's", "that's", "there's", "what's", "who's"],
  };
}
