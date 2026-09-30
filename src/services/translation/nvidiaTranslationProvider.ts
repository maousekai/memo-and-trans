import { parseModelJson, analysisSchema } from "../ai/responseValidation";
import type {
  FastTranslation,
  TranslationAnalysis,
  TranslationProviderStatus,
  TranslationRequestOptions,
} from "../../types/translation";
import type { TranslationProvider } from "./providerTypes";
import { invokeNative, isTauriRuntime } from "../desktop/tauriInvoke";
import { aiService } from "../ai/nvidiaProvider";

async function queryWeb(body: Record<string, unknown>): Promise<any> {
  const response = await fetch('/api/translation/nvidia', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(Number(body.timeoutMs) || 10000),
  });
  if (!response.ok) throw new Error('NVIDIA chưa trả được kết quả. Hãy kiểm tra API key hoặc thử lại.');
  return response.json();
}

export const NVIDIA_RIVA_TRANSLATION_MODEL = "nvidia/riva-translate-4b-instruct-v2";
export const NVIDIA_ANALYSIS_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";


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
      model: NVIDIA_RIVA_TRANSLATION_MODEL,
      storageType: status.proxy,
    };
  }

  async translate(text: string, options: TranslationRequestOptions = {}): Promise<FastTranslation> {
    const startedAt = performance.now();
    const timeoutMs = Math.min(15000, Math.max(500, options.timeoutMs || 10000));
    const translatedText = String(
      isTauriRuntime() ? await invokeNative<string>("translate_nvidia_riva", {
        text,
        timeoutMs,
      }) : (await queryWeb({ text, mode: 'translate', timeoutMs })).translatedText,
    ).trim();

    if (!translatedText) throw new Error("NVIDIA Riva Translate trả về bản dịch rỗng.");

    return {
      translatedText,
      alternativeTranslations: [],
      source: "nvidia",
      confidence: 0.93,
      latencyMs: Math.round(performance.now() - startedAt),
      isPartial: false,
    };
  }

  async analyze(
    text: string,
    translation: string,
    options: TranslationRequestOptions = {},
  ): Promise<TranslationAnalysis> {
    const timeoutMs = Math.min(15000, Math.max(500, options.timeoutMs || 10000));
    if (!isTauriRuntime()) return analysisSchema.parse(await queryWeb({ text, translation, mode: 'analyze', timeoutMs }));
    const raw = await invokeNative<string>("query_nvidia_nim", {
      model: NVIDIA_ANALYSIS_MODEL,
      prompt: analyzePrompt(text, translation),
      temperature: 0.05,
      timeoutMs,
    });
    return analysisSchema.parse(parseModelJson(raw));
  }
}

export const nvidiaTranslationProvider = new NvidiaTranslationProvider();
