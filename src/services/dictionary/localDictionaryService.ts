import type { DictionaryEntry, PartOfSpeech } from "../../types/dictionary";
import { DEMO_DICTIONARY_ENTRIES } from "../../data/demoEntries";
import { TOEIC_CORE_ENTRIES, TOEIC_QUERY_ALIASES } from "../../data/toeicCoreEntries";
import {
  OFFLINE_DICTIONARY_10000,
  OFFLINE_DICTIONARY_10000_COUNT,
  OFFLINE_DICTIONARY_10000_ALIASES,
} from "../../data/offlineDictionary10000.generated";

interface CoreWord {
  pos: string;
  vi: string;
  en: string;
  ipa?: string;
  forms?: string[];
  example?: string;
  exampleVi?: string;
}

interface OfflinePackedPart {
  p: string;
  i?: string;
  v: string[];
  e: string[];
  f: string[];
  x?: Array<[string, string]>;
}

export interface LocalSpellingSuggestion {
  word: string;
  distance: number;
  score: number;
}

export interface LocalLookupResolution {
  requestedWord: string;
  resolvedWord: string;
  entry: DictionaryEntry | null;
  correctedFrom: string | null;
  suggestions: LocalSpellingSuggestion[];
}

const FAST_CACHE_PREFIX = "lexiglass_fast_dict_cache_";
const FAST_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

const CORE_LEXICON: Record<string, CoreWord> = {
  manager: { pos: "noun", vi: "người quản lý; quản lý", en: "a person responsible for controlling or organizing part of a business or organization", ipa: "/ˈmæn.ɪ.dʒər/", forms: ["managers"], example: "She works as a project manager.", exampleVi: "Cô ấy làm việc với vai trò quản lý dự án." },
  manage: { pos: "verb", vi: "quản lý; xoay xở", en: "to control or organize people, work, money, or a situation", ipa: "/ˈmæn.ɪdʒ/", forms: ["manages", "managing", "managed"] },
  management: { pos: "noun", vi: "sự quản lý; ban quản lý", en: "the activity of controlling and organizing a business or other organization", ipa: "/ˈmæn.ɪdʒ.mənt/" },
  environment: { pos: "noun", vi: "môi trường", en: "the surroundings or conditions in which a person, animal, or plant lives or operates", ipa: "/ɪnˈvaɪ.rən.mənt/" },
  environmental: { pos: "adjective", vi: "thuộc môi trường", en: "relating to the natural world and the impact of human activity on it", ipa: "/ɪnˌvaɪ.rənˈmen.təl/" },
  receive: { pos: "verb", vi: "nhận; tiếp nhận", en: "to get or be given something", ipa: "/rɪˈsiːv/", forms: ["receives", "receiving", "received"] },
  repair: { pos: "verb", vi: "sửa chữa; sửa", en: "to fix something that is damaged, broken, or not working properly", ipa: "/rɪˈpeər/", forms: ["repairs", "repairing", "repaired"], example: "The technician repaired the machine.", exampleVi: "Kỹ thuật viên đã sửa chiếc máy." },
  because: { pos: "conjunction", vi: "bởi vì", en: "for the reason that", ipa: "/bɪˈkɒz/" },
  language: { pos: "noun", vi: "ngôn ngữ", en: "a system of communication used by a particular country or community", ipa: "/ˈlæŋ.ɡwɪdʒ/" },
  vocabulary: { pos: "noun", vi: "từ vựng; vốn từ", en: "the words known and used by a person or found in a language", ipa: "/vəˈkæb.jə.ler.i/" },
  translate: { pos: "verb", vi: "dịch", en: "to change words from one language into another", ipa: "/trænzˈleɪt/", forms: ["translates", "translating", "translated"] },
  translation: { pos: "noun", vi: "bản dịch; sự dịch", en: "the process of changing words from one language into another", ipa: "/trænzˈleɪ.ʃən/" },
  learn: { pos: "verb", vi: "học; tìm hiểu", en: "to gain knowledge or skill by studying, practicing, or experiencing", ipa: "/lɜːn/" },
  study: { pos: "verb", vi: "học; nghiên cứu", en: "to spend time learning about a subject", ipa: "/ˈstʌd.i/", forms: ["studies", "studying", "studied"] },
  example: { pos: "noun", vi: "ví dụ", en: "something that is typical of a group or used to explain an idea", ipa: "/ɪɡˈzɑːm.pəl/" },
  meaning: { pos: "noun", vi: "ý nghĩa; nghĩa", en: "the idea that a word, expression, sign, or action represents", ipa: "/ˈmiː.nɪŋ/" },
  word: { pos: "noun", vi: "từ", en: "a single unit of language that has meaning", ipa: "/wɜːd/" },
  sentence: { pos: "noun", vi: "câu", en: "a group of words that expresses a complete thought", ipa: "/ˈsen.təns/" },
  grammar: { pos: "noun", vi: "ngữ pháp", en: "the rules for how words change and combine to form sentences", ipa: "/ˈɡræm.ər/" },
  pronunciation: { pos: "noun", vi: "phát âm; cách phát âm", en: "the way in which a word or language is spoken", ipa: "/prəˌnʌn.siˈeɪ.ʃən/" },
  response: { pos: "noun", vi: "phản hồi; câu trả lời", en: "an answer or reaction to something", ipa: "/rɪˈspɒns/" },
  result: { pos: "noun", vi: "kết quả", en: "something that happens because of an action or process", ipa: "/rɪˈzʌlt/" },
  improve: { pos: "verb", vi: "cải thiện", en: "to become better or make something better", ipa: "/ɪmˈpruːv/" },
  effective: { pos: "adjective", vi: "hiệu quả", en: "successful in producing the intended result", ipa: "/ɪˈfek.tɪv/" },
  efficient: { pos: "adjective", vi: "hiệu suất cao; hiệu quả", en: "working well without wasting time, energy, or resources", ipa: "/ɪˈfɪʃ.ənt/" },
  important: { pos: "adjective", vi: "quan trọng", en: "having great value, influence, or effect", ipa: "/ɪmˈpɔː.tənt/" },
  necessary: { pos: "adjective", vi: "cần thiết", en: "needed in order to achieve a result", ipa: "/ˈnes.ə.ser.i/" },
  available: { pos: "adjective", vi: "có sẵn; khả dụng", en: "able to be used, obtained, or reached", ipa: "/əˈveɪ.lə.bəl/" },
  application: { pos: "noun", vi: "ứng dụng; đơn đăng ký", en: "a computer program designed for a particular purpose, or a formal request", ipa: "/ˌæp.lɪˈkeɪ.ʃən/" },
  develop: { pos: "verb", vi: "phát triển", en: "to grow, change, or cause something to become more advanced", ipa: "/dɪˈvel.əp/" },
  development: { pos: "noun", vi: "sự phát triển", en: "the process of growing, changing, or becoming more advanced", ipa: "/dɪˈvel.əp.mənt/" },
  technology: { pos: "noun", vi: "công nghệ", en: "scientific knowledge and equipment used for practical purposes", ipa: "/tekˈnɒl.ə.dʒi/" },
  system: { pos: "noun", vi: "hệ thống", en: "a set of connected things that work together", ipa: "/ˈsɪs.təm/" },
  model: { pos: "noun", vi: "mô hình", en: "a representation, example, or system used to explain or predict something", ipa: "/ˈmɒd.əl/" },
  data: { pos: "noun", vi: "dữ liệu", en: "facts or information collected for reference or analysis", ipa: "/ˈdeɪ.tə/" },
  research: { pos: "noun", vi: "nghiên cứu", en: "careful study of a subject in order to discover new information", ipa: "/rɪˈsɜːtʃ/" },
};

const publicCache = new Map<string, DictionaryEntry>();
const inFlight = new Map<string, Promise<DictionaryEntry | null>>();

function normalizeWord(value: string): string {
  return value.trim().toLowerCase().replace(/^[^a-z]+|[^a-z'-]+$/g, "");
}

const COMMON_LOCAL_CORRECTIONS: Record<string, string> = {
  repaire: "repair",
  recieve: "receive",
  recive: "receive",
  enviroment: "environment",
  becuase: "because",
  langauge: "language",
  grammer: "grammar",
  pronounciation: "pronunciation",
  sentance: "sentence",
  vocabularly: "vocabulary",
};

function spellingMaxDistance(length: number): number {
  if (length <= 4) return 1;
  if (length <= 9) return 2;
  return 3;
}

function damerauLevenshtein(a: string, b: string, maxDistance = Number.POSITIVE_INFINITY): number {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    let rowMin = Number.POSITIVE_INFINITY;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
      rowMin = Math.min(rowMin, matrix[i][j]);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
  }
  return matrix[a.length][b.length];
}

let spellingVocabularyCache: string[] | null = null;

function spellingVocabulary(): string[] {
  if (spellingVocabularyCache) return spellingVocabularyCache;
  const words = new Set<string>([
    ...Object.keys(CORE_LEXICON),
    ...Object.keys(TOEIC_CORE_ENTRIES),
    ...Object.keys(DEMO_DICTIONARY_ENTRIES),
    ...Object.keys(OFFLINE_DICTIONARY_10000),
    ...Object.keys(OFFLINE_DICTIONARY_10000_ALIASES),
  ]);
  spellingVocabularyCache = [...words].filter((word) => /^[a-z][a-z'-]{1,47}$/.test(word) && !word.includes(" "));
  return spellingVocabularyCache;
}

function suggestLocalSpellings(rawWord: string, limit = 5): LocalSpellingSuggestion[] {
  const input = normalizeWord(rawWord);
  if (!/^[a-z][a-z'-]{2,47}$/.test(input)) return [];
  const allowed = spellingMaxDistance(input.length);
  const results = new Map<string, LocalSpellingSuggestion>();

  const manual = COMMON_LOCAL_CORRECTIONS[input];
  if (manual) {
    const entry = offlineToEntry(manual)
      || (CORE_LEXICON[manual] ? coreToEntry(manual, CORE_LEXICON[manual]) : null)
      || TOEIC_CORE_ENTRIES[manual]
      || DEMO_DICTIONARY_ENTRIES[manual];
    if (entry) {
      results.set(manual, {
        word: manual,
        distance: damerauLevenshtein(input, manual, allowed),
        score: 0.999,
      });
    }
  }

  for (const candidate of spellingVocabulary()) {
    if (candidate === input) continue;
    if (Math.abs(candidate.length - input.length) > allowed) continue;
    // Most typos preserve their first letter. Requiring this for the generic
    // scan keeps a 20k-word dictionary correction fast and reduces false hits.
    if (candidate[0] !== input[0]) continue;

    const distance = damerauLevenshtein(input, candidate, allowed);
    if (distance > allowed) continue;
    const similarity = 1 - distance / Math.max(input.length, candidate.length);
    const score = Math.min(0.995, 0.62 + similarity * 0.34 - Math.max(0, distance - 1) * 0.06);
    const current = results.get(candidate);
    if (!current || score > current.score) {
      results.set(candidate, { word: candidate, distance, score: Number(score.toFixed(3)) });
    }
  }

  return [...results.values()]
    .sort((a, b) => b.score - a.score || a.distance - b.distance || a.word.localeCompare(b.word))
    .slice(0, limit);
}

function resolveToeicQuery(value: string): string {
  const normalized = normalizeWord(value);
  return TOEIC_QUERY_ALIASES[normalized] || normalized;
}

function normalizePos(pos: string): string {
  const key = String(pos || "").trim().toLowerCase();
  return ({
    n: "noun",
    v: "verb",
    adj: "adjective",
    adv: "adverb",
    prep: "preposition",
    conj: "conjunction",
    pron: "pronoun",
    det: "determiner",
    interj: "interjection",
    num: "numeral",
  } as Record<string, string>)[key] || key || "general";
}

function readPersistentFastCache(word: string): DictionaryEntry | null {
  try {
    const raw = localStorage.getItem(`${FAST_CACHE_PREFIX}${word}`);
    if (!raw) return null;
    const payload = JSON.parse(raw) as { cachedAt: number; entry: DictionaryEntry };
    if (!payload?.entry?.partsOfSpeech?.length || Date.now() - payload.cachedAt > FAST_CACHE_MAX_AGE_MS) {
      localStorage.removeItem(`${FAST_CACHE_PREFIX}${word}`);
      return null;
    }
    publicCache.set(word, payload.entry);
    return payload.entry;
  } catch {
    return null;
  }
}

function writePersistentFastCache(word: string, entry: DictionaryEntry): void {
  publicCache.set(word, entry);
  try {
    localStorage.setItem(
      `${FAST_CACHE_PREFIX}${word}`,
      JSON.stringify({ cachedAt: Date.now(), entry }),
    );
  } catch {
    // Fast cache is an optimization only; memory cache still works.
  }
}

function coreToEntry(word: string, core: CoreWord): DictionaryEntry {
  return {
    query: word,
    normalizedWord: word,
    language: "en",
    ipaUS: core.ipa || null,
    ipaUK: core.ipa || null,
    syllables: null,
    cefr: null,
    frequency: "common",
    partsOfSpeech: [{
      type: core.pos,
      forms: core.forms || [],
      meanings: [{
        vietnamese: core.vi,
        englishDefinition: core.en,
        register: null,
        context: null,
        examples: core.example ? [{ english: core.example, vietnamese: core.exampleVi || "" }] : [],
        collocations: [],
      }],
    }],
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    commonCollocations: [],
    commonMistakes: [],
    mnemonic: null,
  };
}

function offlineToEntry(requestedWord: string): DictionaryEntry | null {
  const baseWord = OFFLINE_DICTIONARY_10000[requestedWord]
    ? requestedWord
    : OFFLINE_DICTIONARY_10000_ALIASES[requestedWord];
  if (!baseWord) return null;

  const packed = OFFLINE_DICTIONARY_10000[baseWord] as OfflinePackedPart[] | undefined;
  if (!packed?.length) return null;

  const partsOfSpeech: PartOfSpeech[] = packed.map((part, partIndex) => {
    const senseCount = Math.max(part.v?.length || 0, part.e?.length || 0, 1);
    return {
      type: normalizePos(part.p),
      forms: Array.isArray(part.f) ? part.f : [],
      meanings: Array.from({ length: Math.min(4, senseCount) }, (_, index) => ({
        vietnamese: part.v?.[index] || part.v?.[0] || "",
        englishDefinition: part.e?.[index] || part.e?.[0] || "",
        register: null,
        context: null,
        examples: partIndex === 0 && index === 0 && Array.isArray(part.x)
          ? part.x.slice(0, 2).map(([english, vietnamese]) => ({ english, vietnamese }))
          : [],
        collocations: [],
      })).filter((meaning) => meaning.vietnamese || meaning.englishDefinition),
    };
  }).filter((part) => part.meanings.length > 0);

  if (!partsOfSpeech.length) return null;
  const ipa = packed.find((part) => part.i)?.i || null;

  return {
    query: baseWord,
    normalizedWord: baseWord,
    language: "en",
    ipaUS: ipa,
    ipaUK: ipa,
    syllables: null,
    cefr: null,
    frequency: "common",
    partsOfSpeech,
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    commonCollocations: [],
    commonMistakes: [],
    mnemonic: null,
  };
}

function mapPublicEntry(word: string, raw: any): DictionaryEntry | null {
  if (!raw || !Array.isArray(raw.meanings) || raw.meanings.length === 0) return null;

  const phonetic = raw.phonetic || raw.phonetics?.find((item: any) => item?.text)?.text || null;
  const partsOfSpeech: PartOfSpeech[] = raw.meanings.slice(0, 2).map((meaning: any) => ({
    type: String(meaning?.partOfSpeech || "general"),
    forms: [],
    meanings: (Array.isArray(meaning?.definitions) ? meaning.definitions : []).slice(0, 2).map((definition: any) => ({
      vietnamese: "Đang bổ sung nghĩa tiếng Việt…",
      englishDefinition: String(definition?.definition || ""),
      register: null,
      context: null,
      examples: definition?.example ? [{ english: String(definition.example), vietnamese: "" }] : [],
      collocations: [],
    })).filter((definition: any) => definition.englishDefinition),
  })).filter((pos: PartOfSpeech) => pos.meanings.length > 0);

  if (!partsOfSpeech.length) return null;

  return {
    query: word,
    normalizedWord: word,
    language: "en",
    ipaUS: phonetic,
    ipaUK: phonetic,
    syllables: null,
    cefr: null,
    frequency: null,
    partsOfSpeech,
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    commonCollocations: [],
    commonMistakes: [],
    mnemonic: null,
  };
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "force-cache",
    });
  } finally {
    window.clearTimeout(timer);
  }
}

export const localDictionaryService = {
  offlineCount: OFFLINE_DICTIONARY_10000_COUNT,

  suggestSpellings(rawWord: string, limit = 5): LocalSpellingSuggestion[] {
    return suggestLocalSpellings(rawWord, limit);
  },

  resolveLookup(rawWord: string): LocalLookupResolution {
    const requestedWord = normalizeWord(rawWord);
    if (!requestedWord) {
      return { requestedWord: "", resolvedWord: "", entry: null, correctedFrom: null, suggestions: [] };
    }

    const exact = this.lookupInstant(requestedWord);
    if (exact) {
      return {
        requestedWord,
        resolvedWord: exact.normalizedWord || requestedWord,
        entry: exact,
        correctedFrom: null,
        suggestions: [],
      };
    }

    const suggestions = suggestLocalSpellings(requestedWord, 5);
    const best = suggestions[0];
    const second = suggestions[1];
    const isManual = COMMON_LOCAL_CORRECTIONS[requestedWord] === best?.word;
    const uniqueOneEdit = Boolean(
      best &&
      best.distance === 1 &&
      requestedWord.length >= 4 &&
      (!second || second.distance > 1 || best.score - second.score >= 0.04),
    );

    if (best && (isManual || uniqueOneEdit)) {
      const correctedEntry = this.lookupInstant(best.word);
      if (correctedEntry) {
        return {
          requestedWord,
          resolvedWord: best.word,
          entry: correctedEntry,
          correctedFrom: requestedWord,
          suggestions,
        };
      }
    }

    return {
      requestedWord,
      resolvedWord: requestedWord,
      entry: null,
      correctedFrom: null,
      suggestions,
    };
  },

  lookupInstant(rawWord: string): DictionaryEntry | null {
    const rawNormalized = normalizeWord(rawWord);
    if (!rawNormalized) return null;
    const word = resolveToeicQuery(rawNormalized);
    const toeic = TOEIC_CORE_ENTRIES[word];
    if (toeic) return toeic;
    const demo = DEMO_DICTIONARY_ENTRIES[word];
    if (demo) return demo;
    const core = CORE_LEXICON[word];
    if (core) return coreToEntry(word, core);
    const offline = offlineToEntry(word);
    if (offline) return offline;
    return publicCache.get(word) || readPersistentFastCache(word);
  },

  async lookupPublic(rawWord: string, timeoutMs = 1800): Promise<DictionaryEntry | null> {
    const rawNormalized = normalizeWord(rawWord);
    if (!rawNormalized) return null;
    const word = resolveToeicQuery(rawNormalized);
    const toeic = TOEIC_CORE_ENTRIES[word];
    if (toeic) return toeic;
    if (word.includes(" ")) return null;
    const offline = offlineToEntry(word);
    if (offline) return offline;
    const cached = publicCache.get(word) || readPersistentFastCache(word);
    if (cached) return cached;
    const existing = inFlight.get(word);
    if (existing) return existing;

    const task = (async () => {
      try {
        const response = await fetchWithTimeout(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
          timeoutMs,
        );
        if (!response.ok) return null;
        const payload = await response.json();
        const entry = Array.isArray(payload) ? mapPublicEntry(word, payload[0]) : null;
        if (entry) writePersistentFastCache(word, entry);
        return entry;
      } catch {
        return null;
      } finally {
        inFlight.delete(word);
      }
    })();

    inFlight.set(word, task);
    return task;
  },

  prefetch(rawWord: string): void {
    const word = resolveToeicQuery(rawWord);
    if (!word || this.lookupInstant(word)) return;
    void this.lookupPublic(word, 2000);
  },

  mergeFastAndAi(fast: DictionaryEntry | null, ai: DictionaryEntry): DictionaryEntry {
    if (!fast) return ai;
    return {
      ...ai,
      query: ai.query || fast.query,
      normalizedWord: ai.normalizedWord || fast.normalizedWord,
      ipaUS: ai.ipaUS || fast.ipaUS,
      ipaUK: ai.ipaUK || fast.ipaUK,
      syllables: ai.syllables || fast.syllables,
      cefr: ai.cefr || fast.cefr,
      frequency: ai.frequency || fast.frequency,
      partsOfSpeech: ai.partsOfSpeech.length ? ai.partsOfSpeech : fast.partsOfSpeech,
    };
  },
};
