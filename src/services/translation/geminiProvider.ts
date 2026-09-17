import type {
  FastTranslation,
  TranslationAnalysis,
  TranslationProviderStatus,
  TranslationRequestOptions,
} from "../../types/translation";
import type { TranslationProvider } from "./providerTypes";
import { invokeNative, isTauriRuntime } from "../desktop/tauriInvoke";

export const GEMINI_TRANSLATION_MODEL = "gemini-3.5-flash-lite";

function extractJson(raw: string): any {
  const text = String(raw || "").trim();
  if (!text) throw new Error("Gemini không trả về nội dung.");
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  const json = first >= 0 && last > first ? text.slice(first, last + 1) : text;
  return JSON.parse(json.replace(/,\s*([}\]])/g, "$1"));
}

function translationPrompt(text: string): string {
  return `Translate the following English text into natural Vietnamese. Preserve tone and punctuation. Do not add information. Return ONLY compact JSON with this shape: {"translatedText":"string","alternativeTranslations":["string"]}. Give at most 2 alternatives and only when useful.\n\nTEXT:\n${text}`;
}

function analysisPrompt(text: string, translation: string): string {
  return `Analyze this English text for a Vietnamese learner. Keep it concise and practical. Return ONLY compact JSON matching: {"chunks":[{"source":"string","target":"string","explanation":"string"}],"keyVocabulary":[{"word":"string","meaning":"string","worthLearning":true}],"grammarNotes":[{"title":"string","explanation":"string"}],"naturalnessNote":"string|null","reverseSuggestions":[{"word":"string","meaning":"string","score":0.0}]}. Use max 5 chunks, 5 vocabulary items, 3 grammar notes. Reverse suggestions are only for clue-like phrases such as definitions; otherwise return [].\n\nENGLISH:\n${text}\n\nVIETNAMESE:\n${translation}`;
}

export class GeminiTranslationProvider implements TranslationProvider {
  readonly id = "gemini" as const;

  async getStatus(): Promise<TranslationProviderStatus> {
    if (isTauriRuntime()) {
      try {
        const status = await invokeNative<{ configured: boolean; storage_type: string }>("get_gemini_key_status");
        return {
          configured: status.configured,
          provider: "Google Gemini",
          model: GEMINI_TRANSLATION_MODEL,
          storageType: status.storage_type,
        };
      } catch {
        return { configured: false, provider: "Google Gemini", model: GEMINI_TRANSLATION_MODEL };
      }
    }

    try {
      const response = await fetch("/api/translation/status");
      if (!response.ok) throw new Error();
      const status = await response.json();
      return {
        configured: Boolean(status?.configured),
        provider: "Google Gemini",
        model: status?.model || GEMINI_TRANSLATION_MODEL,
      };
    } catch {
      return { configured: false, provider: "Google Gemini", model: GEMINI_TRANSLATION_MODEL };
    }
  }

  async saveApiKey(key: string): Promise<void> {
    if (!isTauriRuntime()) throw new Error("Gemini API key chỉ được lưu trong bản Desktop Windows.");
    await invokeNative("save_gemini_api_key", { key: key.trim() });
  }

  async translate(text: string, options: TranslationRequestOptions = {}): Promise<FastTranslation> {
    const startedAt = performance.now();
    const timeoutMs = options.timeoutMs || 4500;
    let raw: string;

    if (isTauriRuntime()) {
      raw = await invokeNative<string>("query_gemini", {
        model: GEMINI_TRANSLATION_MODEL,
        prompt: translationPrompt(text),
        timeoutMs,
      });
    } else {
      const response = await fetch("/api/translation/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: "translate", timeoutMs }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(detail || `Gemini translation failed (${response.status}).`);
      }
      raw = JSON.stringify(await response.json());
    }

    const data = extractJson(raw);
    const translatedText = String(data?.translatedText || "").trim();
    if (!translatedText) throw new Error("Gemini trả về bản dịch rỗng.");

    return {
      translatedText,
      alternativeTranslations: Array.isArray(data?.alternativeTranslations)
        ? data.alternativeTranslations.map(String).filter(Boolean).slice(0, 2)
        : [],
      source: "gemini",
      latencyMs: Math.round(performance.now() - startedAt),
      confidence: 0.93,
      isPartial: false,
    };
  }

  async analyze(
    text: string,
    translation: string,
    options: TranslationRequestOptions = {},
  ): Promise<TranslationAnalysis> {
    const timeoutMs = Math.max(2500, options.timeoutMs || 4500);
    let raw: string;

    if (isTauriRuntime()) {
      raw = await invokeNative<string>("query_gemini", {
        model: GEMINI_TRANSLATION_MODEL,
        prompt: analysisPrompt(text, translation),
        timeoutMs,
      });
    } else {
      const response = await fetch("/api/translation/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, translation, mode: "analyze", timeoutMs }),
      });
      if (!response.ok) throw new Error("Gemini analysis unavailable.");
      raw = JSON.stringify(await response.json());
    }

    const data = extractJson(raw);
    return {
      chunks: Array.isArray(data?.chunks)
        ? data.chunks.slice(0, 5).map((item: any) => ({
            source: String(item?.source || ""),
            target: String(item?.target || ""),
            explanation: item?.explanation ? String(item.explanation) : undefined,
          })).filter((item: any) => item.source && item.target)
        : [],
      keyVocabulary: Array.isArray(data?.keyVocabulary)
        ? data.keyVocabulary.slice(0, 5).map((item: any) => ({
            word: String(item?.word || ""),
            meaning: String(item?.meaning || ""),
            worthLearning: item?.worthLearning !== false,
          })).filter((item: any) => item.word && item.meaning)
        : [],
      grammarNotes: Array.isArray(data?.grammarNotes)
        ? data.grammarNotes.slice(0, 3).map((item: any) => ({
            title: String(item?.title || "Ngữ pháp"),
            explanation: String(item?.explanation || ""),
          })).filter((item: any) => item.explanation)
        : [],
      naturalnessNote: typeof data?.naturalnessNote === "string" ? data.naturalnessNote : null,
      reverseSuggestions: Array.isArray(data?.reverseSuggestions)
        ? data.reverseSuggestions.slice(0, 4).map((item: any) => ({
            word: String(item?.word || ""),
            meaning: String(item?.meaning || ""),
            score: Math.max(0, Math.min(1, Number(item?.score || 0))),
          })).filter((item: any) => item.word)
        : [],
    };
  }
}

export const geminiTranslationProvider = new GeminiTranslationProvider();
