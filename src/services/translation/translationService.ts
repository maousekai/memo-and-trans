import type {
  FastTranslation,
  TranslationAnalysis,
  TranslationResult,
} from "../../types/translation";
import { translationCache } from "./translationCache";
import { localPhraseService } from "./localPhraseService";
import { geminiTranslationProvider } from "./geminiProvider";
import { nvidiaTranslationProvider } from "./nvidiaTranslationProvider";
import type { TranslationProvider } from "./providerTypes";

export type TranslationProviderPreference = "auto" | "gemini" | "nvidia";

export interface TranslateOptions {
  offlineOnly?: boolean;
  providerPreference?: TranslationProviderPreference;
}

const MAX_SEGMENT_CHARS = 1500;
const TOTAL_CLOUD_BUDGET_MS = 4500;
const PRIMARY_BUDGET_MS = 3000;

function withDeadline<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function splitTranslationSegments(rawText: string, maxChars = MAX_SEGMENT_CHARS): string[] {
  const text = rawText.trim();
  if (!text) return [];
  if (text.length <= maxChars) return [text];

  const segments: string[] = [];
  let remaining = text;

  while (remaining.length > maxChars) {
    const windowText = remaining.slice(0, maxChars + 1);
    const sentenceMatches = [...windowText.matchAll(/[.!?](?:["')\]]+)?(?=\s|$)/g)];
    const lastSentenceBoundary = sentenceMatches.length
      ? (sentenceMatches[sentenceMatches.length - 1].index || 0) + sentenceMatches[sentenceMatches.length - 1][0].length
      : -1;

    let cutAt = lastSentenceBoundary >= Math.floor(maxChars * 0.55)
      ? lastSentenceBoundary
      : windowText.lastIndexOf(" ", maxChars);

    if (cutAt < Math.floor(maxChars * 0.4)) {
      cutAt = maxChars;
      while (cutAt > 1 && /[A-Za-zÀ-ỹ0-9]/.test(remaining[cutAt] || "") && /[A-Za-zÀ-ỹ0-9]/.test(remaining[cutAt - 1] || "")) {
        cutAt -= 1;
      }
      if (cutAt < 2) cutAt = maxChars;
    }

    const segment = remaining.slice(0, cutAt).trim();
    if (!segment) break;
    segments.push(segment);
    remaining = remaining.slice(cutAt).trim();
  }

  if (remaining) segments.push(remaining);
  return segments;
}

function composeResult(sourceText: string, fast: FastTranslation): TranslationResult {
  const reverseSuggestions = localPhraseService.reverse(sourceText);
  return {
    sourceText,
    translatedText: fast.translatedText,
    alternativeTranslations: fast.alternativeTranslations || [],
    source: fast.source,
    confidence: fast.confidence,
    latencyMs: fast.latencyMs,
    isPartial: Boolean(fast.isPartial),
    segmentIndex: fast.segmentIndex,
    segmentCount: fast.segmentCount,
    sourceLanguage: "en",
    targetLanguage: "vi",
    chunks: [],
    keyVocabulary: [],
    grammarNotes: [],
    naturalnessNote: null,
    reverseSuggestions,
    analysisStatus: "pending",
  };
}

function providerOrder(preference: TranslationProviderPreference): TranslationProvider[] {
  if (preference === "nvidia") return [nvidiaTranslationProvider, geminiTranslationProvider];
  return [geminiTranslationProvider, nvidiaTranslationProvider];
}

class TranslationService {
  async translate(rawText: string, options: TranslateOptions = {}): Promise<TranslationResult> {
    const text = rawText.trim();
    if (!text) throw new Error("Hãy nhập hoặc bôi đen văn bản tiếng Anh cần dịch.");

    const segments = splitTranslationSegments(text);
    const segment = segments[0];
    if (!segment) throw new Error("Không có văn bản hợp lệ để dịch.");

    // Canonical pipeline: cache/local are hard short-circuits. They never trigger
    // a cloud request after a hit.
    const cached = translationCache.read(segment);
    if (cached) {
      return {
        ...cached,
        sourceText: segment,
        isPartial: segments.length > 1,
        segmentIndex: 1,
        segmentCount: segments.length,
        analysisStatus: cached.analysisStatus === "complete" ? "complete" : "none",
      };
    }

    const local = localPhraseService.lookup(segment);
    if (local && (local.confidence || 0) >= 0.95) {
      const result = {
        ...local,
        isPartial: segments.length > 1,
        segmentIndex: 1,
        segmentCount: segments.length,
      };
      translationCache.write(segment, result);
      return result;
    }

    if (options.offlineOnly) {
      throw new Error("Không có bản dịch offline đủ tin cậy. Hãy tắt chế độ Chỉ dùng offline để sử dụng dịch cloud.");
    }

    const preference = options.providerPreference || "auto";
    const providers = providerOrder(preference);
    const startedAt = performance.now();
    let lastError: unknown = null;

    for (let index = 0; index < providers.length; index += 1) {
      const provider = providers[index];
      const elapsed = performance.now() - startedAt;
      const remaining = TOTAL_CLOUD_BUDGET_MS - elapsed;
      if (remaining < 250) break;

      const budget = index === 0
        ? Math.min(PRIMARY_BUDGET_MS, remaining)
        : Math.min(1400, remaining);

      try {
        const status = await withDeadline(
          provider.getStatus(),
          Math.min(600, Math.max(250, budget)),
          `${provider.id} status timeout`,
        ).catch(() => ({ configured: true, provider: provider.id, model: "unknown" }));

        if (!status.configured) {
          lastError = new Error(`${status.provider} chưa được cấu hình API key.`);
          continue;
        }

        const fast = await withDeadline(
          provider.translate(segment, { timeoutMs: Math.max(500, Math.floor(budget)) }),
          Math.max(500, Math.floor(budget)),
          `${provider.id} translation timeout`,
        );

        const result = composeResult(segment, {
          ...fast,
          latencyMs: Math.round(performance.now() - startedAt),
          isPartial: segments.length > 1,
          segmentIndex: 1,
          segmentCount: segments.length,
        });
        translationCache.write(segment, result);
        return result;
      } catch (error) {
        lastError = error;
      }
    }

    const detail = String((lastError as any)?.message || lastError || "Không có nhà cung cấp dịch khả dụng.");
    throw new Error(`Không thể dịch trong giới hạn ${TOTAL_CLOUD_BUDGET_MS / 1000}s. ${detail}`);
  }

  async analyze(result: TranslationResult, options: TranslateOptions = {}): Promise<TranslationAnalysis> {
    if (result.source === "local" || options.offlineOnly) {
      return localPhraseService.analyze(result.sourceText);
    }

    const providers = providerOrder(options.providerPreference || "auto");
    let lastError: unknown = null;
    for (const provider of providers) {
      try {
        const status = await provider.getStatus();
        if (!status.configured) continue;
        const analysis = await withDeadline(
          provider.analyze(result.sourceText, result.translatedText, { timeoutMs: 4500 }),
          4500,
          `${provider.id} analysis timeout`,
        );
        const localReverse = localPhraseService.reverse(result.sourceText);
        return {
          ...analysis,
          reverseSuggestions: (analysis.reverseSuggestions?.length ? analysis.reverseSuggestions : localReverse).slice(0, 4),
        };
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) throw lastError;
    return localPhraseService.analyze(result.sourceText);
  }

  async getStatuses() {
    const [gemini, nvidia] = await Promise.all([
      geminiTranslationProvider.getStatus(),
      nvidiaTranslationProvider.getStatus(),
    ]);
    return { gemini, nvidia };
  }

  async saveGeminiApiKey(key: string): Promise<void> {
    await geminiTranslationProvider.saveApiKey?.(key);
  }
}

export const translationService = new TranslationService();
