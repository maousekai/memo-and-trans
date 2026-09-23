import type { DictionaryEntry, Example, PartOfSpeech } from "../../types/dictionary";
import { DEMO_DICTIONARY_ENTRIES } from "../../data/demoEntries";
import { TOEIC_CORE_ENTRIES, TOEIC_QUERY_ALIASES } from "../../data/toeicCoreEntries";
import {
  OFFLINE_DICTIONARY_10000_COUNT,
  OFFLINE_DICTIONARY_ALIAS_COUNT,
  OFFLINE_DICTIONARY_EXAMPLE_WORD_COUNT,
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

const FAST_CACHE_PREFIX = "lexiglass_fast_dict_cache_";
const FAST_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const EXAMPLE_CACHE_PREFIX = "lexiglass_dict_examples_v1_";
const EXAMPLE_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 90;

const CORE_LEXICON: Record<string, CoreWord> = {
  manager: { pos: "noun", vi: "người quản lý; quản lý", en: "a person responsible for controlling or organizing part of a business or organization", ipa: "/ˈmæn.ɪ.dʒər/", forms: ["managers"], example: "She works as a project manager.", exampleVi: "Cô ấy làm việc với vai trò quản lý dự án." },
  manage: { pos: "verb", vi: "quản lý; xoay xở", en: "to control or organize people, work, money, or a situation", ipa: "/ˈmæn.ɪdʒ/", forms: ["manages", "managing", "managed"] },
  management: { pos: "noun", vi: "sự quản lý; ban quản lý", en: "the activity of controlling and organizing a business or other organization", ipa: "/ˈmæn.ɪdʒ.mənt/" },
  environment: { pos: "noun", vi: "môi trường", en: "the surroundings or conditions in which a person, animal, or plant lives or operates", ipa: "/ɪnˈvaɪ.rən.mənt/" },
  environmental: { pos: "adjective", vi: "thuộc môi trường", en: "relating to the natural world and the impact of human activity on it", ipa: "/ɪnˌvaɪ.rənˈmen.təl/" },
  receive: { pos: "verb", vi: "nhận; tiếp nhận", en: "to get or be given something", ipa: "/rɪˈsiːv/", forms: ["receives", "receiving", "received"] },
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
const offlineEntryCache = new Map<string, DictionaryEntry>();
const inFlight = new Map<string, Promise<DictionaryEntry | null>>();

interface OfflineShard {
  entries: Record<string, OfflinePackedPart[]>;
  aliases: Record<string, string>;
}

export interface OfflineWordSuggestion {
  word: string;
  matchedForm?: string;
  editDistance?: number;
  score: number;
  reason: "prefix" | "spelling";
}

type FuzzyCandidate = {
  form: string;
  lemma: string;
  headword: boolean;
};

const shardCache = new Map<string, OfflineShard>();
const shardPromises = new Map<string, Promise<OfflineShard>>();
let offlineHeadwords: string[] | null = null;
let headwordPromise: Promise<string[]> | null = null;

function isSingleEnglishWord(value: string): boolean {
  return /^[a-z][a-z'-]{1,47}$/.test(value);
}

function shardKey(value: string): string {
  const first = String(value || "").trim().toLowerCase()[0] || "_";
  return /[a-z0-9]/.test(first) ? first : "_";
}

function dictionaryAssetUrl(relativePath: string): string {
  return new URL(`/dictionary/${relativePath}`, window.location.href).toString();
}

async function loadShard(key: string): Promise<OfflineShard> {
  const cached = shardCache.get(key);
  if (cached) return cached;

  const existing = shardPromises.get(key);
  if (existing) return existing;

  const task = (async () => {
    try {
      const response = await fetch(dictionaryAssetUrl(`shards/${encodeURIComponent(key)}.json`), {
        cache: "force-cache",
      });
      if (!response.ok) return { entries: {}, aliases: {} };
      const payload = await response.json() as OfflineShard;
      const normalized: OfflineShard = {
        entries: payload?.entries || {},
        aliases: payload?.aliases || {},
      };
      shardCache.set(key, normalized);
      return normalized;
    } catch {
      const empty = { entries: {}, aliases: {} };
      shardCache.set(key, empty);
      return empty;
    } finally {
      shardPromises.delete(key);
    }
  })();

  shardPromises.set(key, task);
  return task;
}

async function loadAllHeadwords(): Promise<string[]> {
  if (offlineHeadwords) return offlineHeadwords;
  if (headwordPromise) return headwordPromise;

  headwordPromise = (async () => {
    try {
      const response = await fetch(dictionaryAssetUrl("headwords.json"), { cache: "force-cache" });
      if (!response.ok) return [];
      const values = await response.json();
      offlineHeadwords = Array.isArray(values)
        ? values.map((item) => String(item)).filter(isSingleEnglishWord)
        : [];
      return offlineHeadwords;
    } catch {
      offlineHeadwords = [];
      return offlineHeadwords;
    } finally {
      headwordPromise = null;
    }
  })();

  return headwordPromise;
}

function loadedShardCandidates(input: string): FuzzyCandidate[] {
  const shard = shardCache.get(shardKey(input));
  if (!shard) return [];
  const candidates: FuzzyCandidate[] = [];

  for (const word of Object.keys(shard.entries)) {
    if (isSingleEnglishWord(word)) candidates.push({ form: word, lemma: word, headword: true });
  }
  for (const [form, lemma] of Object.entries(shard.aliases)) {
    if (isSingleEnglishWord(form)) candidates.push({ form, lemma, headword: false });
  }
  return candidates;
}

function maxEditDistance(length: number): number {
  if (length <= 4) return 1;
  if (length <= 8) return 2;
  return 3;
}

function damerauLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }
  return matrix[a.length][b.length];
}

function normalizeWord(value: string): string {
  let normalized = String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ");

  // Strip normal sentence punctuation around a lookup, but preserve dictionary
  // punctuation inside terms such as 24/7, a/c, dot-com, C++, and .22.
  normalized = normalized.replace(/^[\"\s]+|[\"\s]+$/g, "");
  if (/^[a-z][a-z'-]*[!?;,.:]$/i.test(normalized)) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
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

function entryHasExamples(entry: DictionaryEntry | null | undefined): boolean {
  return Boolean(entry?.partsOfSpeech?.some((part) =>
    part.meanings?.some((meaning) => Array.isArray(meaning.examples) && meaning.examples.length > 0)
  ));
}

function readPersistentExampleCache(word: string): Example[] {
  try {
    const raw = localStorage.getItem(`${EXAMPLE_CACHE_PREFIX}${word}`);
    if (!raw) return [];
    const payload = JSON.parse(raw) as { cachedAt: number; examples: Example[] };
    if (
      !Array.isArray(payload?.examples) ||
      Date.now() - Number(payload.cachedAt || 0) > EXAMPLE_CACHE_MAX_AGE_MS
    ) {
      localStorage.removeItem(`${EXAMPLE_CACHE_PREFIX}${word}`);
      return [];
    }
    return payload.examples.filter((item) => item?.english).slice(0, 2);
  } catch {
    return [];
  }
}

function writePersistentExampleCache(word: string, examples: Example[]): void {
  if (!examples.length) return;
  try {
    localStorage.setItem(
      `${EXAMPLE_CACHE_PREFIX}${word}`,
      JSON.stringify({ cachedAt: Date.now(), examples: examples.slice(0, 2) }),
    );
  } catch {
    // Example caching is optional.
  }
}

function mergeExamplesIntoEntry(entry: DictionaryEntry, examples: Example[]): DictionaryEntry {
  if (!examples.length || entryHasExamples(entry)) return entry;
  const partsOfSpeech = entry.partsOfSpeech.map((part, partIndex) => ({
    ...part,
    meanings: part.meanings.map((meaning, meaningIndex) => (
      partIndex === 0 && meaningIndex === 0
        ? { ...meaning, examples: examples.slice(0, 2) }
        : meaning
    )),
  }));
  return { ...entry, partsOfSpeech };
}

function extractPublicExamples(payload: any): Example[] {
  const examples: Example[] = [];
  for (const entry of Array.isArray(payload) ? payload : []) {
    for (const meaning of Array.isArray(entry?.meanings) ? entry.meanings : []) {
      for (const definition of Array.isArray(meaning?.definitions) ? meaning.definitions : []) {
        const english = String(definition?.example || "").trim();
        if (!english || examples.some((item) => item.english === english)) continue;
        examples.push({ english, vietnamese: "" });
        if (examples.length >= 2) return examples;
      }
    }
  }
  return examples;
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
  offlineAliasCount: Object.keys(OFFLINE_DICTIONARY_10000_ALIASES).length,
  offlineExampleWordCount: OFFLINE_DICTIONARY_EXAMPLE_WORD_COUNT,

  lookupInstant(rawWord: string): DictionaryEntry | null {
    const rawNormalized = normalizeWord(rawWord);
    if (!rawNormalized) return null;
    const word = resolveToeicQuery(rawNormalized);
    const cachedExamples = readPersistentExampleCache(word);
    const toeic = TOEIC_CORE_ENTRIES[word];
    if (toeic) return mergeExamplesIntoEntry(toeic, cachedExamples);
    const demo = DEMO_DICTIONARY_ENTRIES[word];
    if (demo) return mergeExamplesIntoEntry(demo, cachedExamples);
    const core = CORE_LEXICON[word];
    if (core) return mergeExamplesIntoEntry(coreToEntry(word, core), cachedExamples);
    const offline = offlineToEntry(word);
    if (offline) return mergeExamplesIntoEntry(offline, cachedExamples);
    const cached = publicCache.get(word) || readPersistentFastCache(word);
    return cached ? mergeExamplesIntoEntry(cached, cachedExamples) : null;
  },

  suggestPrefix(rawWord: string, limit = 8): OfflineWordSuggestion[] {
    const prefix = normalizeWord(rawWord);
    if (!isSingleEnglishWord(prefix)) return [];

    const words = getOfflineHeadwords();
    const start = lowerBound(words, prefix);
    const output: OfflineWordSuggestion[] = [];
    for (let index = start; index < words.length && output.length < limit; index += 1) {
      const word = words[index];
      if (!word.startsWith(prefix)) break;
      if (word === prefix) continue;
      output.push({
        word,
        score: Math.min(0.98, 0.78 + prefix.length / Math.max(word.length, 1) * 0.18),
        reason: "prefix",
      });
    }
    return output;
  },

  suggestSpelling(rawWord: string, limit = 5): OfflineWordSuggestion[] {
    const input = normalizeWord(rawWord);
    if (!isSingleEnglishWord(input)) return [];
    if (offlineToEntry(input)) return [];

    const allowed = maxEditDistance(input.length);
    const buckets = ensureFuzzyBuckets();
    const primary: FuzzyCandidate[] = [];

    for (let length = Math.max(2, input.length - allowed); length <= input.length + allowed; length += 1) {
      primary.push(...(buckets.get(`${input[0]}:${length}`) || []));
    }

    const scoreCandidates = (candidates: FuzzyCandidate[]) => {
      const byLemma = new Map<string, OfflineWordSuggestion>();
      for (const candidate of candidates) {
        const distance = damerauLevenshtein(input, candidate.form);
        if (distance > allowed) continue;
        const similarity = 1 - distance / Math.max(input.length, candidate.form.length);
        const score = Math.min(
          0.999,
          0.62 + similarity * 0.34 + (candidate.headword ? 0.025 : 0),
        );
        const existing = byLemma.get(candidate.lemma);
        const suggestion: OfflineWordSuggestion = {
          word: candidate.lemma,
          matchedForm: candidate.headword ? undefined : candidate.form,
          editDistance: distance,
          score,
          reason: "spelling",
        };
        if (!existing || suggestion.score > existing.score) byLemma.set(candidate.lemma, suggestion);
      }
      return [...byLemma.values()].sort(
        (a, b) => (a.editDistance || 9) - (b.editDistance || 9)
          || b.score - a.score
          || a.word.localeCompare(b.word),
      );
    };

    let ranked = scoreCandidates(primary);
    if (!ranked.length) {
      // Only pay the broader search cost when the first letter itself is likely
      // mistyped. This path runs on submitted lookups, not on every keystroke.
      const broader: FuzzyCandidate[] = [];
      for (const [key, list] of buckets) {
        const length = Number(key.split(":")[1]);
        if (Math.abs(length - input.length) <= allowed) broader.push(...list);
      }
      ranked = scoreCandidates(broader);
    }

    return ranked.slice(0, limit);
  },

  resolveInflection(rawWord: string): string | null {
    const word = normalizeWord(rawWord);
    return OFFLINE_DICTIONARY_10000_ALIASES[word] || null;
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

  hasExamples(entry: DictionaryEntry | null | undefined): boolean {
    return entryHasExamples(entry);
  },

  async enrichExamples(entry: DictionaryEntry, timeoutMs = 1800): Promise<DictionaryEntry> {
    if (entryHasExamples(entry)) return entry;
    const word = normalizeWord(entry.normalizedWord || entry.query);
    if (!word || word.includes(" ")) return entry;

    const cachedExamples = readPersistentExampleCache(word);
    if (cachedExamples.length) return mergeExamplesIntoEntry(entry, cachedExamples);

    try {
      const response = await fetchWithTimeout(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        timeoutMs,
      );
      if (!response.ok) return entry;
      const payload = await response.json();
      const examples = extractPublicExamples(payload);
      if (!examples.length) return entry;
      writePersistentExampleCache(word, examples);
      return mergeExamplesIntoEntry(entry, examples);
    } catch {
      return entry;
    }
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
