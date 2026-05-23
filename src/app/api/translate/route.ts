import { translateToEPrime } from "@/lib/gemini";
import { isEPrimeCompliant } from "@/lib/eprime";
import { translationQueue } from "@/lib/queue";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, mode } = body;

    if (!text || typeof text !== "string") {
      return Response.json(
        { error: "Missing or invalid 'text' field" },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();
    const translationMode = mode === "strict" ? "strict" : "subjective";

    // Skip API call entirely if text already complies with E-Prime
    if (isEPrimeCompliant(trimmedText)) {
      return Response.json({
        translated: trimmedText,
        changes: [],
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY not configured on server" },
        { status: 500 }
      );
    }

    // Route through the queue so requests run one-at-a-time
    // with a minimum 1.5s gap — prevents burst-firing the API
    const result = await translationQueue.enqueue(() =>
      translateToEPrime(trimmedText, apiKey, translationMode)
    );

    return Response.json(result);
  } catch (error) {
    console.error("Translation error:", error);
    return Response.json(
      { error: "Translation failed. Please try again." },
      { status: 500 }
    );
  }
}
