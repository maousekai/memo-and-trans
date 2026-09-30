import type { TranslationResult } from "../../types/translation";

const CACHE_VERSION = 4;
const CACHE_PREFIX = `lexiglass_translation_v${CACHE_VERSION}_`;
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
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

function cacheKey(text: string, scope: string): string {
  const normalized = normalizeText(text);
  return `${CACHE_PREFIX}en_vi_${hashText(scope + '\n' + normalized)}`;
}

export function readTranslationCache(text: string, scope = 'online:auto'): TranslationResult | null {
  try {
    const raw = localStorage.getItem(cacheKey(text, scope));
    if (!raw) return null;
    const payload = JSON.parse(raw) as {
      scope: string;
      version: number;
      cachedAt: number;
      normalizedText: string;
      result: TranslationResult;
    };
    if (
      payload?.version !== CACHE_VERSION ||
      payload.scope !== scope ||
      !Number.isFinite(payload.cachedAt) ||
      payload.result?.localStrategy === 'composed' ||
      payload?.normalizedText !== normalizeText(text) ||
      typeof payload?.result?.translatedText !== 'string' ||
      !payload.result.translatedText.trim() ||
      Date.now() - payload.cachedAt > CACHE_MAX_AGE_MS
    ) {
      localStorage.removeItem(cacheKey(text, scope));
      return null;
    }
    return {
      ...payload.result,
      fromCache: true,
      latencyMs: 0,
    };
  } catch {
    return null;
  }
}

export function writeTranslationCache(text: string, result: TranslationResult, scope = 'online:auto'): void {
  if (result.localStrategy === 'composed') return;
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter((key): key is string => Boolean(key));
    for (const key of keys) {
      if (key.startsWith('lexiglass_translation_v') && !key.startsWith(CACHE_PREFIX)) localStorage.removeItem(key);
    }
    const current = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    if (current.length >= 200) {
      current.sort((a, b) => {
        try { return JSON.parse(localStorage.getItem(a) || '{}').cachedAt - JSON.parse(localStorage.getItem(b) || '{}').cachedAt; }
        catch { return 0; }
      });
      for (const key of current.slice(0, current.length - 199)) localStorage.removeItem(key);
    }
    localStorage.setItem(
      cacheKey(text, scope),
      JSON.stringify({
        version: CACHE_VERSION,
        scope,
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
