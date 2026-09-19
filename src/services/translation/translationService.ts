import type {
  FastTranslation,
  TranslationAnalysis,
  TranslationProviderStatus,
  TranslationResult,
} from "../../types/translation";
import { translationCache } from "./translationCache";
import { localPhraseService } from "./localPhraseService";
import { localCompositionalPhraseService } from "./localCompositionalPhraseService";
import { geminiTranslationProvider } from "./geminiProvider";
import { nvidiaTranslationProvider } from "./nvidiaTranslationProvider";
import type { TranslationProvider } from "./providerTypes";

export type TranslationProviderPreference = "auto" | "gemini" | "nvidia";

export interface TranslateOptions {
  offlineOnly?: boolean;
  providerPreference?: TranslationProviderPreference;
  segmentIndex?: number;
}

const MAX_SEGMENT_CHARS = 1500;

// v18.1 uses a soft-first cloud strategy. Gemini gets a short first chance,
// while the fallback still has enough real time to answer before the hard stop.
const CLOUD_HARD_LIMIT_MS = 8000;
const RIVA_PRIMARY_LIMIT_MS = 5000;
const GEMINI_PRIMARY_LIMIT_MS = 3000;
const FALLBACK_LIMIT_MS = 2800;
const STATUS_TIMEOUT_MS = 500;
const PROVIDER_STATUS_TTL_MS = 1000 * 60 * 10;
const ANALYSIS_PROVIDER_BUDGET_MS = 4500;

type CachedProviderStatus = {
  status: TranslationProviderStatus;
  expiresAt: number;
};

const providerStatusCache = new Map<TranslationProvider["id"], CachedProviderStatus>();

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
      const nextWhitespace = remaining.indexOf(" ", maxChars);
      if (nextWhitespace > 0) {
        cutAt = nextWhitespace;
      } else {
        cutAt = remaining.length;
      }
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
    localStrategy: fast.localStrategy,
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

export function translationProviderOrder(preference: TranslationProviderPreference): TranslationProvider[] {
  if (preference === "gemini") return [geminiTranslationProvider, nvidiaTranslationProvider];
  // Auto now prefers NVIDIA Riva Translate because it is translation-specific.
  return [nvidiaTranslationProvider, geminiTranslationProvider];
}

export function analysisProviderOrder(preference: TranslationProviderPreference): TranslationProvider[] {
  if (preference === "nvidia") return [nvidiaTranslationProvider, geminiTranslationProvider];
  // Gemini remains the preferred enrichment/grammar analyzer.
  return [geminiTranslationProvider, nvidiaTranslationProvider];
}

async function getCachedProviderStatus(
  provider: TranslationProvider,
  forceRefresh = false,
): Promise<TranslationProviderStatus> {
  const now = Date.now();
  const cached = providerStatusCache.get(provider.id);
  if (!forceRefresh && cached && cached.expiresAt > now) return cached.status;

  try {
    const status = await withDeadline(
      provider.getStatus(),
      STATUS_TIMEOUT_MS,
      `${provider.id} status timeout`,
    );
    providerStatusCache.set(provider.id, {
      status,
      expiresAt: now + PROVIDER_STATUS_TTL_MS,
    });
    return status;
  } catch {
    // Status probing must never consume the whole user-facing translation path.
    // If probing itself is flaky, try the actual provider request once.
    return {
      configured: true,
      provider: provider.id === "gemini" ? "Google Gemini" : "NVIDIA NIM",
      model: "unknown",
    };
  }
}

class TranslationService {
  async translate(rawText: string, options: TranslateOptions = {}): Promise<TranslationResult> {
    const text = rawText.trim();
    if (!text) throw new Error("Hãy nhập hoặc bôi đen văn bản tiếng Anh cần dịch.");

    const segments = splitTranslationSegments(text);
    const requestedSegmentIndex = options.segmentIndex ?? 0;
    if (!Number.isInteger(requestedSegmentIndex) || requestedSegmentIndex < 0 || requestedSegmentIndex >= segments.length) {
      throw new Error("Phần văn bản cần dịch không hợp lệ.");
    }

    const segment = segments[requestedSegmentIndex];
    if (!segment) throw new Error("Không có văn bản hợp lệ để dịch.");
    const displaySegmentIndex = requestedSegmentIndex + 1;

    // 1) Cache is always the fastest path.
    const cached = translationCache.read(segment);
    if (cached) {
      return {
        ...cached,
        sourceText: segment,
        isPartial: segments.length > 1,
        segmentIndex: displaySegmentIndex,
        segmentCount: segments.length,
        analysisStatus: cached.analysisStatus || "complete",
      };
    }

    // 2) Deterministic exact phrases remain the safest offline answer.
    const exactLocal = localPhraseService.lookup(segment);
    if (exactLocal && (exactLocal.confidence || 0) >= 0.95) {
      const result: TranslationResult = {
        ...exactLocal,
        isPartial: segments.length > 1,
        segmentIndex: displaySegmentIndex,
        segmentCount: segments.length,
      };
      translationCache.write(segment, result);
      return result;
    }

    // 3) Short TOEIC-style chunks are composed locally from grammar patterns +
    // offline dictionary data. They render immediately; cloud analysis is optional
    // enrichment and never blocks this result.
    const composedLocal = localCompositionalPhraseService.lookup(segment);
    if (composedLocal && (composedLocal.confidence || 0) >= 0.88) {
      const result: TranslationResult = {
        ...composedLocal,
        isPartial: segments.length > 1,
        segmentIndex: displaySegmentIndex,
        segmentCount: segments.length,
      };
      translationCache.write(segment, result);
      return result;
    }

    if (options.offlineOnly) {
      throw new Error("Không có bản dịch offline đủ tin cậy. Hãy tắt chế độ Chỉ dùng offline để sử dụng dịch cloud.");
    }

    // 4) Cloud-only cases get a real fallback window instead of forcing both
    // providers into one 4.5 second slot.
    const providers = translationProviderOrder(options.providerPreference || "auto");
    const startedAt = performance.now();
    const deadlineAt = startedAt + CLOUD_HARD_LIMIT_MS;
    let lastError: unknown = null;

    for (let index = 0; index < providers.length; index += 1) {
      const provider = providers[index];
      const remainingBeforeStatus = Math.floor(deadlineAt - performance.now());
      if (remainingBeforeStatus < 500) break;

      try {
        const status = await getCachedProviderStatus(provider);
        if (!status.configured) {
          lastError = new Error(`${status.provider} chưa được cấu hình API key.`);
          continue;
        }

        const remainingAfterStatus = Math.floor(deadlineAt - performance.now());
        if (remainingAfterStatus < 500) break;

        const providerCap = index === 0
          ? (provider.id === "nvidia" ? RIVA_PRIMARY_LIMIT_MS : GEMINI_PRIMARY_LIMIT_MS)
          : FALLBACK_LIMIT_MS;
        const translateBudget = Math.min(providerCap, remainingAfterStatus);
        if (translateBudget < 500) break;

        const fast = await withDeadline(
          provider.translate(segment, { timeoutMs: translateBudget }),
          translateBudget,
          `${provider.id} translation timeout`,
        );

        const result = composeResult(segment, {
          ...fast,
          latencyMs: Math.round(performance.now() - startedAt),
          isPartial: segments.length > 1,
          segmentIndex: displaySegmentIndex,
          segmentCount: segments.length,
        });
        translationCache.write(segment, result);
        return result;
      } catch (error) {
        lastError = error;
      }
    }

    const detail = String((lastError as any)?.message || lastError || "").trim();
    throw new Error(
      `AI cloud tạm thời không phản hồi sau khi đã thử nguồn chính và dự phòng trong tối đa ${CLOUD_HARD_LIMIT_MS / 1000}s.${detail ? ` (${detail})` : ""}`,
    );
  }

  async analyze(result: TranslationResult, options: TranslateOptions = {}): Promise<TranslationAnalysis> {
    if (options.offlineOnly) {
      return localPhraseService.analyze(result.sourceText);
    }

    // Exact curated local phrases already contain deterministic explanations.
    // Composed local phrases intentionally continue to cloud in the background.
    if (result.localStrategy === "exact") {
      return localPhraseService.analyze(result.sourceText);
    }

    const providers = analysisProviderOrder(options.providerPreference || "auto");
    let lastError: unknown = null;

    for (const provider of providers) {
      try {
        const status = await getCachedProviderStatus(provider);
        if (!status.configured) {
          lastError = new Error(`${status.provider} chưa được cấu hình API key.`);
          continue;
        }

        const analysis = await withDeadline(
          provider.analyze(result.sourceText, result.translatedText, { timeoutMs: ANALYSIS_PROVIDER_BUDGET_MS }),
          ANALYSIS_PROVIDER_BUDGET_MS,
          `${provider.id} analysis timeout`,
        );
        const localReverse = localPhraseService.reverse(result.sourceText);
        return {
          ...analysis,
          reverseSuggestions: (localReverse.length ? localReverse : (analysis.reverseSuggestions || [])).slice(0, 4),
        };
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw lastError;
    throw new Error("Không có nhà cung cấp cloud nào sẵn sàng để bổ sung phân tích.");
  }

  async getStatuses() {
    const [gemini, nvidia] = await Promise.all([
      getCachedProviderStatus(geminiTranslationProvider, true),
      getCachedProviderStatus(nvidiaTranslationProvider, true),
    ]);
    return { gemini, nvidia };
  }

  async saveGeminiApiKey(key: string): Promise<void> {
    await geminiTranslationProvider.saveApiKey?.(key);
    providerStatusCache.delete("gemini");
  }

  clearProviderStatusCache(): void {
    providerStatusCache.clear();
  }
}

export const translationService = new TranslationService();
