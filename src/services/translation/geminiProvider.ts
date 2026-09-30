import { parseModelJson, analysisSchema, translationSchema } from "../ai/responseValidation";
import type {
  FastTranslation,
  TranslationAnalysis,
  TranslationProviderStatus,
  TranslationRequestOptions,
} from "../../types/translation";
import type { TranslationProvider } from "./providerTypes";
import { invokeNative, isTauriRuntime } from "../desktop/tauriInvoke";

import { GEMINI_TRANSLATION_MODEL, translationPrompt, analysisPrompt } from "./translationPrompts";
export { GEMINI_TRANSLATION_MODEL } from "./translationPrompts";

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
    const timeoutMs = options.timeoutMs || 10000;
    let raw: string;

    if (isTauriRuntime()) {
      raw = await invokeNative<string>("query_gemini", {
        model: GEMINI_TRANSLATION_MODEL,
        prompt: translationPrompt(text),
        timeoutMs,
      });
    } else {
      const response = await fetch("/api/translation/gemini", {
        signal: AbortSignal.timeout(timeoutMs),
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

    const data = translationSchema.parse(parseModelJson(raw));
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
        signal: AbortSignal.timeout(timeoutMs),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, translation, mode: "analyze", timeoutMs }),
      });
      if (!response.ok) throw new Error("Gemini analysis unavailable.");
      raw = JSON.stringify(await response.json());
    }

    return analysisSchema.parse(parseModelJson(raw));
  }
}

export const geminiTranslationProvider = new GeminiTranslationProvider();
