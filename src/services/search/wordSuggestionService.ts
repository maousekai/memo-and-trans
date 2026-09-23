import { DEMO_DICTIONARY_ENTRIES } from "../../data/demoEntries";
import type { SavedWord } from "../../types/study";
import { localDictionaryService } from "../dictionary/localDictionaryService";

export type WordSuggestionSource =
  | "dictionary"
  | "history"
  | "vocabulary"
  | "spelling";

export type WordSuggestionReason =
  | "prefix"
  | "common-typo"
  | "edit-distance"
  | "transposition"
  | "keyboard-neighbor"
  | "history"
  | "saved";

export interface WordSuggestion {
  word: string;
  score: number;
  source: WordSuggestionSource;
  reason?: WordSuggestionReason;
  editDistance?: number;
  partOfSpeech?: string;
  vietnameseMeaning?: string;
}

interface HistoryItem {
  word: string;
  count: number;
  lastUsedAt: string;
}

interface Candidate {
  word: string;
  source: WordSuggestionSource;
  boost: number;
  partOfSpeech?: string;
  vietnameseMeaning?: string;
}

const HISTORY_KEY = "lexiglass_search_history_v1";

const COMMON_CORRECTIONS: Record<string, string[]> = {
  recieved: ["received"],
  recieve: ["receive"],
  recive: ["receive"],
  enviroment: ["environment"],
  enviornment: ["environment"],
  definately: ["definitely"],
  definatly: ["definitely"],
  comprehensve: ["comprehensive"],
  comprihensive: ["comprehensive"],
  mitgate: ["mitigate"],
  mitagte: ["mitigate"],
  becuase: ["because"],
  beacuse: ["because"],
  teh: ["the"],
  hte: ["the"],
  thier: ["their"],
  wierd: ["weird"],
  seperate: ["separate"],
  occured: ["occurred"],
  occurance: ["occurrence"],
  untill: ["until"],
  succesful: ["successful"],
  sucessful: ["successful"],
  neccessary: ["necessary"],
  necesary: ["necessary"],
  accomodation: ["accommodation"],
  accomodate: ["accommodate"],
  begining: ["beginning"],
  beleive: ["believe"],
  calender: ["calendar"],
  collegue: ["colleague"],
  concious: ["conscious"],
  developement: ["development"],
  embarass: ["embarrass"],
  existance: ["existence"],
  experiance: ["experience"],
  foriegn: ["foreign"],
  freind: ["friend"],
  goverment: ["government"],
  grammer: ["grammar"],
  immediatly: ["immediately"],
  independant: ["independent"],
  knowlege: ["knowledge"],
  langauge: ["language"],
  maintainance: ["maintenance"],
  privilage: ["privilege"],
  pronounciation: ["pronunciation"],
  recomend: ["recommend"],
  recomendation: ["recommendation"],
  restaraunt: ["restaurant"],
  rythym: ["rhythm"],
  sentance: ["sentence"],
  tommorow: ["tomorrow"],
  vocabularly: ["vocabulary"],
  writting: ["writing"],
  studys: ["studies", "study"],
};

// Small frequency-oriented seed. Runtime vocabulary + history + demo words are
// merged into this set, so suggestions become more personal over time.
const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for", "not", "on", "with",
  "as", "you", "do", "at", "this", "but", "by", "from", "they", "we", "say", "or", "an", "will",
  "one", "all", "would", "there", "their", "what", "so", "if", "about", "who", "get", "which", "go",
  "when", "make", "can", "like", "time", "know", "take", "people", "year", "good", "could", "see",
  "other", "then", "now", "look", "come", "think", "also", "work", "first", "well", "way", "new",
  "because", "these", "most", "ability", "accept", "access", "accurate", "achieve", "action", "active",
  "adapt", "advance", "advantage", "affect", "allow", "ambiguous", "ambiguity", "analysis", "analyze",
  "application", "apply", "approach", "appropriate", "article", "assess", "assessment", "attention",
  "available", "avoid", "aware", "balance", "beautiful", "beautifully", "beautify", "benefit", "business",
  "category", "challenge", "change", "clear", "collaboration", "common", "communication", "community",
  "compare", "comparison", "complete", "complex", "comprehensive", "comprehensively", "comprehensible",
  "comprehension", "concept", "condition", "consider", "consistent", "context", "continue", "control",
  "correct", "create", "critical", "current", "data", "decision", "define", "definition", "demonstrate",
  "describe", "description", "design", "detail", "develop", "developer", "developing", "development",
  "difference", "difficult", "discover", "effect", "effective", "efficient", "environment", "environmental",
  "establish", "evaluate", "evaluation", "evidence", "example", "experience", "explain", "feature", "focus",
  "function", "generate", "government", "grammar", "identify", "immediately", "impact", "important", "improve",
  "include", "increase", "independent", "information", "intelligent", "language", "learn", "learning", "maintain",
  "maintenance", "meaning", "method", "mitigate", "mitigation", "model", "natural", "necessary", "notice",
  "occur", "occurrence", "option", "organize", "performance", "phrase", "practice", "prefer", "prevent",
  "process", "produce", "production", "pronounce", "pronunciation", "quality", "question", "receive", "recognize",
  "recommend", "recommendation", "reduce", "related", "remember", "research", "respond", "response", "result",
  "retain", "retention", "review", "sentence", "separate", "similar", "simple", "specific", "spelling",
  "strategy", "structure", "study", "studies", "subtle", "subtly", "successful", "suggest", "suggestion",
  "support", "system", "technology", "translate", "translation", "understand", "usage", "useful", "valid",
  "value", "vocabulary", "weak", "weird", "word", "writing",
];

const KEYBOARD_NEIGHBORS: Record<string, string> = {
  q: "wa", w: "qase", e: "wsdr", r: "edft", t: "rfgy", y: "tghu", u: "yhji", i: "ujko", o: "iklp", p: "ol",
  a: "qwsz", s: "awedxz", d: "serfcx", f: "drtgvc", g: "ftyhbv", h: "gyujnb", j: "huikmn", k: "jiolm", l: "kop",
  z: "asx", x: "zsdc", c: "xdfv", v: "cfgb", b: "vghn", n: "bhjm", m: "njk",
};

function normalizeWord(value: string): string {
  return value.trim().toLowerCase().replace(/^[^a-z]+|[^a-z'-]+$/g, "");
}

function maxDistance(length: number): number {
  if (length <= 4) return 1;
  if (length <= 8) return 2;
  return 3;
}

export function damerauLevenshtein(aRaw: string, bRaw: string): number {
  const a = normalizeWord(aRaw);
  const b = normalizeWord(bRaw);
  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
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
    }
  }
  return matrix[a.length][b.length];
}

function isTransposition(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const diffs: number[] = [];
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) diffs.push(i);
  return diffs.length === 2 && diffs[1] === diffs[0] + 1 && a[diffs[0]] === b[diffs[1]] && a[diffs[1]] === b[diffs[0]];
}

function isKeyboardNeighbor(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let changed = -1;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      if (changed !== -1) return false;
      changed = i;
    }
  }
  return changed >= 0 && Boolean(KEYBOARD_NEIGHBORS[a[changed]]?.includes(b[changed]));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(0.999, Number(value.toFixed(3))));
}

class WordSuggestionService {
  private readHistory(): HistoryItem[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 40) : [];
    } catch {
      return [];
    }
  }

  recordSuccessfulSearch(raw: string): void {
    const word = normalizeWord(raw);
    if (!word) return;
    const history = this.readHistory();
    const current = history.find((item) => normalizeWord(item.word) === word);
    if (current) {
      current.count += 1;
      current.lastUsedAt = new Date().toISOString();
    } else {
      history.unshift({ word, count: 1, lastUsedAt: new Date().toISOString() });
    }
    history.sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 40)));
    } catch {
      // History personalization is optional.
    }
  }

  private candidates(savedWords: SavedWord[]): Map<string, Candidate> {
    const result = new Map<string, Candidate>();
    const add = (candidate: Candidate) => {
      const word = normalizeWord(candidate.word);
      if (word.length < 2) return;
      const old = result.get(word);
      if (!old || candidate.boost > old.boost) result.set(word, { ...candidate, word });
    };

    COMMON_WORDS.forEach((word, index) => add({
      word,
      source: "dictionary",
      boost: Math.max(0.01, 0.055 - index * 0.00012),
    }));

    Object.values(DEMO_DICTIONARY_ENTRIES).forEach((entry) => {
      const primary = entry.partsOfSpeech[0];
      add({
        word: entry.normalizedWord,
        source: "dictionary",
        boost: 0.1,
        partOfSpeech: primary?.type,
        vietnameseMeaning: primary?.meanings[0]?.vietnamese,
      });
      entry.wordFamily.forEach((item) => add({
        word: item.word,
        source: "dictionary",
        boost: 0.06,
        partOfSpeech: item.type,
        vietnameseMeaning: item.vietnameseMeaning,
      }));
    });

    savedWords.forEach((saved) => {
      const primary = saved.dictionary.partsOfSpeech[0];
      add({
        word: saved.normalizedWord || saved.word,
        source: "vocabulary",
        boost: 0.17,
        partOfSpeech: primary?.type,
        vietnameseMeaning: primary?.meanings[0]?.vietnamese,
      });
    });

    this.readHistory().forEach((item) => add({
      word: item.word,
      source: "history",
      boost: 0.1 + Math.min(0.12, item.count * 0.018),
    }));

    return result;
  }

  suggest(inputRaw: string, savedWords: SavedWord[] = [], limit = 5): WordSuggestion[] {
    const input = normalizeWord(inputRaw);
    if (!/^[a-z][a-z'-]{1,48}$/.test(input)) return [];
    const candidates = this.candidates(savedWords);
    const results = new Map<string, WordSuggestion>();
    const push = (item: WordSuggestion) => {
      if (item.word === input) return;
      const old = results.get(item.word);
      if (!old || item.score > old.score) results.set(item.word, item);
    };

    localDictionaryService.suggestPrefix(input, Math.max(limit * 2, 10)).forEach((item) => {
      push({
        word: item.word,
        score: item.score,
        source: "dictionary",
        reason: "prefix",
      });
    });

    (COMMON_CORRECTIONS[input] || []).forEach((word, index) => {
      const meta = candidates.get(word);
      push({
        word,
        score: 0.995 - index * 0.01,
        source: "spelling",
        reason: "common-typo",
        editDistance: damerauLevenshtein(input, word),
        partOfSpeech: meta?.partOfSpeech,
        vietnameseMeaning: meta?.vietnameseMeaning,
      });
    });

    candidates.forEach((candidate, word) => {
      if (word === input) return;
      if (word.startsWith(input)) {
        const completion = input.length / word.length;
        push({
          word,
          score: clamp(0.71 + Math.min(0.18, completion * 0.18) + candidate.boost),
          source: candidate.source,
          reason: candidate.source === "history" ? "history" : candidate.source === "vocabulary" ? "saved" : "prefix",
          partOfSpeech: candidate.partOfSpeech,
          vietnameseMeaning: candidate.vietnameseMeaning,
        });
        return;
      }

      const allowed = maxDistance(input.length);
      if (Math.abs(word.length - input.length) > allowed) return;
      const distance = damerauLevenshtein(input, word);
      if (distance > allowed) return;

      const similarity = 1 - distance / Math.max(input.length, word.length);
      let reason: WordSuggestionReason = "edit-distance";
      let bonus = 0;
      if (isTransposition(input, word)) {
        reason = "transposition";
        bonus = 0.07;
      } else if (isKeyboardNeighbor(input, word)) {
        reason = "keyboard-neighbor";
        bonus = 0.045;
      }
      push({
        word,
        score: clamp(0.56 + similarity * 0.31 + candidate.boost + bonus - Math.max(0, distance - 1) * 0.025),
        source: candidate.source === "vocabulary" || candidate.source === "history" ? candidate.source : "spelling",
        reason,
        editDistance: distance,
        partOfSpeech: candidate.partOfSpeech,
        vietnameseMeaning: candidate.vietnameseMeaning,
      });
    });

    return [...results.values()].sort((a, b) => b.score - a.score || a.word.localeCompare(b.word)).slice(0, limit);
  }

  suggestCorrections(inputRaw: string, savedWords: SavedWord[] = [], limit = 5): WordSuggestion[] {
    const input = normalizeWord(inputRaw);
    if (!/^[a-z][a-z'-]{1,48}$/.test(input)) return [];

    const results = new Map<string, WordSuggestion>();
    const push = (item: WordSuggestion) => {
      if (item.word === input) return;
      const old = results.get(item.word);
      if (!old || item.score > old.score) results.set(item.word, item);
    };

    localDictionaryService.suggestSpelling(input, Math.max(limit * 2, 8)).forEach((item) => {
      push({
        word: item.word,
        score: item.score,
        source: "spelling",
        reason: "edit-distance",
        editDistance: item.editDistance,
      });
    });

    const personalCandidates = this.candidates(savedWords);
    (COMMON_CORRECTIONS[input] || []).forEach((word, index) => {
      const meta = personalCandidates.get(word);
      push({
        word,
        score: 0.995 - index * 0.01,
        source: "spelling",
        reason: "common-typo",
        editDistance: damerauLevenshtein(input, word),
        partOfSpeech: meta?.partOfSpeech,
        vietnameseMeaning: meta?.vietnameseMeaning,
      });
    });

    return [...results.values()]
      .sort((a, b) => (a.editDistance ?? 99) - (b.editDistance ?? 99) || b.score - a.score || a.word.localeCompare(b.word))
      .slice(0, limit);
  }

  async suggestCorrectionsAsync(
    inputRaw: string,
    savedWords: SavedWord[] = [],
    limit = 5,
  ): Promise<WordSuggestion[]> {
    const input = normalizeWord(inputRaw);
    if (!/^[a-z][a-z'-]{1,48}$/.test(input)) return [];

    const results = new Map<string, WordSuggestion>();
    const push = (item: WordSuggestion) => {
      if (item.word === input) return;
      const old = results.get(item.word);
      if (!old || item.score > old.score) results.set(item.word, item);
    };

    const offline = await localDictionaryService.suggestSpellingAsync(
      input,
      Math.max(limit * 2, 8),
    );
    offline.forEach((item) => {
      push({
        word: item.word,
        score: item.score,
        source: "spelling",
        reason: "edit-distance",
        editDistance: item.editDistance,
      });
    });

    const personalCandidates = this.candidates(savedWords);
    (COMMON_CORRECTIONS[input] || []).forEach((word, index) => {
      const meta = personalCandidates.get(word);
      push({
        word,
        score: 0.995 - index * 0.01,
        source: "spelling",
        reason: "common-typo",
        editDistance: damerauLevenshtein(input, word),
        partOfSpeech: meta?.partOfSpeech,
        vietnameseMeaning: meta?.vietnameseMeaning,
      });
    });

    return [...results.values()]
      .sort(
        (a, b) => (a.editDistance ?? 99) - (b.editDistance ?? 99)
          || b.score - a.score
          || a.word.localeCompare(b.word),
      )
      .slice(0, limit);
  }

  shouldAutoPreferSuggestion(inputRaw: string, suggestion?: WordSuggestion): boolean {
    if (!suggestion) return false;
    const input = normalizeWord(inputRaw);
    if (!input || suggestion.reason === "prefix") return false;
    return suggestion.reason === "common-typo" || (suggestion.score >= 0.93 && (suggestion.editDistance ?? 9) <= 1);
  }
}

export const wordSuggestionService = new WordSuggestionService();
