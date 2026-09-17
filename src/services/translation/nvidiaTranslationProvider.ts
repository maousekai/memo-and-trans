import type {
  FastTranslation,
  TranslationAnalysis,
  TranslationProviderStatus,
  TranslationRequestOptions,
} from "../../types/translation";
import type { TranslationProvider } from "./providerTypes";
import { invokeNative, isTauriRuntime } from "../desktop/tauriInvoke";
import { aiService } from "../ai/nvidiaProvider";

const NVIDIA_TRANSLATION_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";

function extractJson(raw: string): any {
  const text = String(raw || "").trim();
  if (!text) throw new Error("NVIDIA không trả về nội dung.");
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  return JSON.parse((first >= 0 && last > first ? text.slice(first, last + 1) : text).replace(/,\s*([}\]])/g, "$1"));
}

function translatePrompt(text: string): string {
  return `Translate this English text to natural Vietnamese. Preserve punctuation and meaning. Return ONLY JSON: {"translatedText":"string","alternativeTranslations":["string"]}. Max 2 alternatives.\nTEXT:\n${text}`;
}

function analyzePrompt(text: string, translation: string): string {
  return `Analyze this English text for a Vietnamese learner. Return ONLY JSON: {"chunks":[{"source":"string","target":"string","explanation":"string"}],"keyVocabulary":[{"word":"string","meaning":"string","worthLearning":true}],"grammarNotes":[{"title":"string","explanation":"string"}],"naturalnessNote":"string|null","reverseSuggestions":[]}. Keep concise. Max 5 chunks, 5 vocabulary items, 3 notes.\nENGLISH:\n${text}\nVIETNAMESE:\n${translation}`;
}

export class NvidiaTranslationProvider implements TranslationProvider {
  readonly id = "nvidia" as const;

  async getStatus(): Promise<TranslationProviderStatus> {
    const status = await aiService.checkStatus();
    return {
      configured: status.configured,
      provider: "NVIDIA NIM",
      model: NVIDIA_TRANSLATION_MODEL,
      storageType: status.proxy,
    };
  }

  async translate(text: string, options: TranslationRequestOptions = {}): Promise<FastTranslation> {
    if (!isTauriRuntime()) throw new Error("NVIDIA translation fallback requires Desktop mode.");
    const startedAt = performance.now();
    const raw = await invokeNative<string>("query_nvidia_nim", {
      model: NVIDIA_TRANSLATION_MODEL,
      prompt: translatePrompt(text),
      temperature: 0.05,
    });
    const data = extractJson(raw);
    const translatedText = String(data?.translatedText || "").trim();
    if (!translatedText) throw new Error("NVIDIA trả về bản dịch rỗng.");
    return {
      translatedText,
      alternativeTranslations: Array.isArray(data?.alternativeTranslations)
        ? data.alternativeTranslations.map(String).filter(Boolean).slice(0, 2)
        : [],
      source: "nvidia",
      confidence: 0.88,
      latencyMs: Math.round(performance.now() - startedAt),
      isPartial: false,
    };
  }

  async analyze(
    text: string,
    translation: string,
    _options: TranslationRequestOptions = {},
  ): Promise<TranslationAnalysis> {
    if (!isTauriRuntime()) throw new Error("NVIDIA analysis fallback requires Desktop mode.");
    const raw = await invokeNative<string>("query_nvidia_nim", {
      model: NVIDIA_TRANSLATION_MODEL,
      prompt: analyzePrompt(text, translation),
      temperature: 0.05,
    });
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
      reverseSuggestions: [],
    };
  }
}

export const nvidiaTranslationProvider = new NvidiaTranslationProvider();
