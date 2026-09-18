import type { TranslationResult } from "../../types/translation";

const CACHE_VERSION = 2;
const CACHE_PREFIX = `lexiglass_translation_v${CACHE_VERSION}_`;
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 90;

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function hashText(value: string): string {
  // FNV-1a style non-cryptographic hash. This is only a localStorage key,
  // not a security primitive.
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function cacheKey(text: string): string {
  const normalized = normalizeText(text);
  return `${CACHE_PREFIX}en_vi_${hashText(normalized)}`;
}

export function readTranslationCache(text: string): TranslationResult | null {
  try {
    const raw = localStorage.getItem(cacheKey(text));
    if (!raw) return null;
    const payload = JSON.parse(raw) as {
      version: number;
      cachedAt: number;
      normalizedText: string;
      result: TranslationResult;
    };
    if (
      payload?.version !== CACHE_VERSION ||
      payload?.normalizedText !== normalizeText(text) ||
      !payload?.result?.translatedText ||
      Date.now() - payload.cachedAt > CACHE_MAX_AGE_MS
    ) {
      localStorage.removeItem(cacheKey(text));
      return null;
    }
    return {
      ...payload.result,
      source: "cache",
      latencyMs: 0,
    };
  } catch {
    return null;
  }
}

export function writeTranslationCache(text: string, result: TranslationResult): void {
  try {
    localStorage.setItem(
      cacheKey(text),
      JSON.stringify({
        version: CACHE_VERSION,
        cachedAt: Date.now(),
        normalizedText: normalizeText(text),
        result,
      }),
    );
  } catch {
    // Cache failure must never block translation.
  }
}

export const translationCache = {
  read: readTranslationCache,
  write: writeTranslationCache,
};
