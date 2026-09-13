import type { DictionaryEntry, PartOfSpeech } from "../../types/dictionary";
import { DEMO_DICTIONARY_ENTRIES } from "../../data/demoEntries";

interface CoreWord {
  pos: string;
  vi: string;
  en: string;
  ipa?: string;
  forms?: string[];
  example?: string;
  exampleVi?: string;
}

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
const inFlight = new Map<string, Promise<DictionaryEntry | null>>();

function normalizeWord(value: string): string {
  return value.trim().toLowerCase().replace(/^[^a-z]+|[^a-z'-]+$/g, "");
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
  lookupInstant(rawWord: string): DictionaryEntry | null {
    const word = normalizeWord(rawWord);
    if (!word) return null;
    const demo = DEMO_DICTIONARY_ENTRIES[word];
    if (demo) return demo;
    const core = CORE_LEXICON[word];
    return core ? coreToEntry(word, core) : publicCache.get(word) || null;
  },

  async lookupPublic(rawWord: string, timeoutMs = 1400): Promise<DictionaryEntry | null> {
    const word = normalizeWord(rawWord);
    if (!word || word.includes(" ")) return null;
    const cached = publicCache.get(word);
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
        if (entry) publicCache.set(word, entry);
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
    const word = normalizeWord(rawWord);
    if (!word || this.lookupInstant(word)) return;
    void this.lookupPublic(word, 1800);
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
