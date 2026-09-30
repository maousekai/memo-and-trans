import { z } from "zod";

// Never repair JSON by replacing punctuation inside string values.
export function parseModelJson(raw: string): unknown {
  const text = raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\s*\x60\x60\x60$/, "");
  try { return JSON.parse(text); } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first < 0 || last <= first) throw new Error("AI trả về JSON không hợp lệ.");
    return JSON.parse(text.slice(first, last + 1));
  }
}

const nonempty = z.string().trim().min(1);
export const translationSchema = z.object({
  translatedText: nonempty,
  alternativeTranslations: z.array(nonempty).max(2).default([]),
});
export const analysisSchema = z.object({
  chunks: z.array(z.object({
    source: nonempty, target: nonempty, explanation: z.string().optional(),
  })).max(5),
  keyVocabulary: z.array(z.object({
    word: nonempty, meaning: nonempty, worthLearning: z.boolean(),
  })).max(5),
  grammarNotes: z.array(z.object({
    title: nonempty, explanation: nonempty,
  })).max(3),
  naturalnessNote: z.string().nullable().optional(),
  reverseSuggestions: z.array(z.object({
    word: nonempty, meaning: nonempty, score: z.number().min(0).max(1),
  })).max(4).default([]),
});
const score = z.number().finite().min(0).max(100);
export const evaluationSchema = z.object({
  overallScore: score, grammarScore: score, meaningScore: score,
  naturalnessScore: score, collocationScore: score,
  isAccurate: z.boolean(), vietnameseFeedback: nonempty,
  correctedSentence: z.string().nullable().optional(),
  betterAlternatives: z.array(z.string()),
});
