import { DictionaryEntry, SentenceEvaluation } from "../../types/dictionary";
import { AIProvider, AIStatus } from "./types";
import { DEMO_DICTIONARY_ENTRIES } from "../../data/demoEntries";
import { invokeNative, isTauriRuntime } from "../desktop/tauriInvoke";

const CACHE_KEY_PREFIX = "lexiglass_dict_cache_";
const DEFAULT_MODEL = "deepseek-ai/deepseek-v4-flash-0731";

function extractJson(raw: string): any {
  const text = String(raw || "").trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  const json = first >= 0 && last > first ? text.slice(first, last + 1) : text;
  return JSON.parse(json.replace(/,\s*([}\]])/g, "$1"));
}

function normalizeEntry(data: any, queryWord: string): DictionaryEntry {
  const normalizedWord = String(data?.normalizedWord || queryWord).trim().toLowerCase();
  const partsOfSpeech = Array.isArray(data?.partsOfSpeech) ? data.partsOfSpeech.map((pos: any) => ({
    type: String(pos?.type || "general"),
    forms: Array.isArray(pos?.forms) ? pos.forms.map(String) : [],
    meanings: Array.isArray(pos?.meanings) ? pos.meanings.map((m: any) => ({
      vietnamese: String(m?.vietnamese || m?.meaning || ""),
      englishDefinition: String(m?.englishDefinition || m?.definition || ""),
      register: typeof m?.register === "string" ? m.register : null,
      context: typeof m?.context === "string" ? m.context : null,
      examples: Array.isArray(m?.examples) ? m.examples.map((ex: any) => ({
        english: String(ex?.english || ""),
        vietnamese: String(ex?.vietnamese || ""),
      })) : [],
      collocations: Array.isArray(m?.collocations) ? m.collocations.map(String) : [],
    })) : [],
  })) : [];

  return {
    query: String(data?.query || queryWord),
    normalizedWord,
    language: "en",
    ipaUS: typeof data?.ipaUS === "string" ? data.ipaUS : null,
    ipaUK: typeof data?.ipaUK === "string" ? data.ipaUK : null,
    syllables: typeof data?.syllables === "string" ? data.syllables : null,
    cefr: typeof data?.cefr === "string" ? data.cefr : null,
    frequency: typeof data?.frequency === "string" ? data.frequency : null,
    partsOfSpeech,
    synonyms: Array.isArray(data?.synonyms) ? data.synonyms.map(String) : [],
    antonyms: Array.isArray(data?.antonyms) ? data.antonyms.map(String) : [],
    wordFamily: Array.isArray(data?.wordFamily) ? data.wordFamily.map((item: any) => ({
      word: String(item?.word || ""),
      type: String(item?.type || "related"),
      vietnameseMeaning: String(item?.vietnameseMeaning || ""),
    })) : [],
    commonCollocations: Array.isArray(data?.commonCollocations) ? data.commonCollocations.map(String) : [],
    commonMistakes: Array.isArray(data?.commonMistakes) ? data.commonMistakes.map((item: any) => ({
      incorrect: String(item?.incorrect || ""),
      correct: String(item?.correct || ""),
      explanationVietnamese: String(item?.explanationVietnamese || ""),
    })) : [],
    mnemonic: typeof data?.mnemonic === "string" ? data.mnemonic : null,
  };
}

function dictionaryPrompt(word: string) {
  return `You are an expert English-Vietnamese lexicographer. Analyze the English word or phrase: "${word}".
Return ONLY one valid JSON object, no markdown. Use natural Vietnamese and order common meanings first.
Schema:
{
  "query":"${word}","normalizedWord":"string","language":"en","ipaUS":"string|null","ipaUK":"string|null","syllables":"string|null","cefr":"A1|A2|B1|B2|C1|C2|null","frequency":"very-common|common|medium|uncommon|null",
  "partsOfSpeech":[{"type":"string","forms":["string"],"meanings":[{"vietnamese":"string","englishDefinition":"string","register":"neutral|formal|informal|academic|slang|null","context":"string|null","examples":[{"english":"string","vietnamese":"string"}],"collocations":["string"]}]}],
  "synonyms":["string"],"antonyms":["string"],"wordFamily":[{"word":"string","type":"string","vietnameseMeaning":"string"}],"commonCollocations":["string"],"commonMistakes":[{"incorrect":"string","correct":"string","explanationVietnamese":"string"}],"mnemonic":"string|null"
}`;
}

export class NvidiaNIMProvider implements AIProvider {
  private cache = new Map<string, DictionaryEntry>();

  constructor() { this.loadCacheFromStorage(); }

  private loadCacheFromStorage() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_KEY_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const entry = JSON.parse(raw);
            this.cache.set(entry.normalizedWord.toLowerCase(), entry);
          }
        }
      }
    } catch { /* ignore */ }
  }

  private saveToCache(entry: DictionaryEntry) {
    const key = entry.normalizedWord.toLowerCase();
    this.cache.set(key, entry);
    try { localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(entry)); } catch { /* ignore */ }
  }

  async checkStatus(): Promise<AIStatus> {
    if (isTauriRuntime()) {
      try {
        const status = await invokeNative<{ configured: boolean; storage_type: string }>("get_api_key_status");
        return {
          configured: status.configured,
          defaultModel: DEFAULT_MODEL,
          provider: "NVIDIA NIM",
          proxy: status.configured ? status.storage_type : "Chưa cấu hình API key",
        };
      } catch {
        return { configured: false, defaultModel: DEFAULT_MODEL, provider: "NVIDIA NIM", proxy: "Native bridge unavailable" };
      }
    }

    try {
      const res = await fetch("/api/ai/status");
      if (!res.ok) throw new Error("Failed to check AI status");
      return await res.json();
    } catch {
      return { configured: false, defaultModel: DEFAULT_MODEL, provider: "NVIDIA NIM", proxy: "Offline / Fallback" };
    }
  }

  async saveApiKey(key: string): Promise<void> {
    if (!isTauriRuntime()) throw new Error("Chỉ có thể lưu API key an toàn trong bản Desktop.");
    await invokeNative("save_api_key", { key: key.trim() });
  }

  async testConnection(model = DEFAULT_MODEL): Promise<void> {
    if (!isTauriRuntime()) throw new Error("Kiểm tra kết nối native chỉ khả dụng trong bản Desktop.");
    const raw = await invokeNative<string>("query_nvidia_nim", {
      model,
      prompt: 'Return exactly this JSON object: {"ok":true}',
      temperature: 0,
    });
    const parsed = extractJson(raw);
    if (parsed?.ok !== true) throw new Error("NVIDIA API trả về phản hồi không hợp lệ.");
  }

  async lookupWord(word: string, model?: string, forceRefresh = false): Promise<DictionaryEntry> {
    const normalized = word.trim().toLowerCase();
    if (!normalized) throw new Error("Vui lòng nhập từ hoặc cụm từ tiếng Anh.");

    if (!forceRefresh) {
      const cached = this.cache.get(normalized);
      if (cached) return cached;
    }

    if (isTauriRuntime()) {
      try {
        const raw = await invokeNative<string>("query_nvidia_nim", {
          model: model || DEFAULT_MODEL,
          prompt: dictionaryPrompt(normalized),
          temperature: 0.15,
        });
        const entry = normalizeEntry(extractJson(raw), normalized);
        if (!entry.partsOfSpeech.length) throw new Error("AI không trả về dữ liệu từ điển hợp lệ.");
        this.saveToCache(entry);
        return entry;
      } catch (err: any) {
        if (DEMO_DICTIONARY_ENTRIES[normalized]) return DEMO_DICTIONARY_ENTRIES[normalized];
        const message = String(err?.message || err || "Không thể kết nối NVIDIA NIM.");
        if (message.toLowerCase().includes("not configured")) {
          throw new Error("Chưa kết nối NVIDIA API. Vào Sổ học tập → Cài đặt → NVIDIA API để nhập API key.");
        }
        throw new Error(message);
      }
    }

    try {
      const res = await fetch("/api/ai/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: normalized, model }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401 || errData.code === "NO_API_KEY") {
          if (DEMO_DICTIONARY_ENTRIES[normalized]) return DEMO_DICTIONARY_ENTRIES[normalized];
          throw new Error("Chưa cấu hình NVIDIA_API_KEY cho Browser Preview.");
        }
        throw new Error(errData.error || `Lỗi từ NVIDIA NIM (${res.status})`);
      }
      const entry = normalizeEntry(await res.json(), normalized);
      this.saveToCache(entry);
      return entry;
    } catch (err: any) {
      if (DEMO_DICTIONARY_ENTRIES[normalized]) return DEMO_DICTIONARY_ENTRIES[normalized];
      throw err;
    }
  }

  async evaluateSentence(word: string, sentence: string, meaningContext?: string, model?: string): Promise<SentenceEvaluation> {
    if (isTauriRuntime()) {
      try {
        const prompt = `Evaluate this learner sentence using the target English word "${word}".\nSentence: "${sentence}"\nTarget meaning: "${meaningContext || ""}"\nReturn ONLY JSON: {"overallScore":number,"grammarScore":number,"meaningScore":number,"naturalnessScore":number,"collocationScore":number,"isAccurate":boolean,"vietnameseFeedback":"string","correctedSentence":"string|null","betterAlternatives":["string"]}`;
        return extractJson(await invokeNative<string>("query_nvidia_nim", {
          model: model || DEFAULT_MODEL,
          prompt,
          temperature: 0.15,
        })) as SentenceEvaluation;
      } catch {
        return this.simulateSentenceEvaluation(word, sentence);
      }
    }

    try {
      const res = await fetch("/api/ai/evaluate-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, userSentence: sentence, targetMeaning: meaningContext, model }),
      });
      if (!res.ok) throw new Error("Không thể chấm điểm câu qua NVIDIA AI.");
      return await res.json();
    } catch {
      return this.simulateSentenceEvaluation(word, sentence);
    }
  }

  private simulateSentenceEvaluation(word: string, sentence: string): SentenceEvaluation {
    const lower = sentence.toLowerCase();
    const hasWord = lower.includes(word.toLowerCase());
    const lengthValid = sentence.trim().split(/\s+/).length >= 5;
    if (!hasWord) {
      return { overallScore: 35, grammarScore: 70, meaningScore: 30, naturalnessScore: 40, collocationScore: 20, isAccurate: false, vietnameseFeedback: `Câu chưa sử dụng từ khóa mục tiêu "${word}".`, betterAlternatives: [] };
    }
    if (!lengthValid) {
      return { overallScore: 60, grammarScore: 75, meaningScore: 65, naturalnessScore: 60, collocationScore: 50, isAccurate: true, vietnameseFeedback: "Câu đúng nhưng còn quá ngắn; hãy thêm ngữ cảnh tự nhiên hơn.", correctedSentence: sentence.endsWith(".") ? sentence : `${sentence}.`, betterAlternatives: [] };
    }
    return { overallScore: 90, grammarScore: 92, meaningScore: 90, naturalnessScore: 88, collocationScore: 88, isAccurate: true, vietnameseFeedback: "Cách dùng từ phù hợp và tự nhiên.", betterAlternatives: [] };
  }
}

export const aiService = new NvidiaNIMProvider();
