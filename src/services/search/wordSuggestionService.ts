import { DEMO_DICTIONARY_ENTRIES } from "../../data/demoEntries";
import type { SavedWord } from "../../types/study";

export type WordSuggestionSource =
  | "dictionary"
  | "history"
  | "vocabulary"
  | "spelling"
  | "ai";

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

interface CandidateMeta {
  word: string;
  source: WordSuggestionSource;
  frequencyRank: number;
  boost: number;
  partOfSpeech?: string;
  vietnameseMeaning?: string;
}

const HISTORY_KEY = "lexiglass_search_history_v1";

// High-confidence mistakes that Vietnamese/English learners commonly make.
// These are handled locally so an obvious typo never needs an NVIDIA request.
const COMMON_CORRECTIONS: Record<string, string[]> = {
  recieve: ["receive"],
  recive: ["receive"],
  enviroment: ["environment"],
  enviornment: ["environment"],
  environmental: ["environmental"],
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
  beleif: ["belief"],
  calender: ["calendar"],
  collegue: ["colleague"],
  concious: ["conscious"],
  conveniant: ["convenient"],
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
  childs: ["children", "child"],
};

// A compact, frequency-oriented seed lexicon. It is deliberately not a full
// dictionary: saved words, recent searches and demo dictionary data are merged
// into it at runtime. DeepSeek is used only as a fallback when local matching
// has no confident answer.
const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with",
  "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if",
  "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him",
  "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than",
  "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how",
  "our", "work", "first", "well", "way", "even", "new", "want", "because", "these", "give", "day", "most", "us",
  "ability", "able", "accept", "access", "accurate", "achieve", "acquire", "action", "active", "adapt", "address",
  "advance", "advantage", "affect", "allow", "almost", "already", "ambiguous", "ambiguity", "analysis", "analyze",
  "application", "apply", "approach", "appropriate", "argument", "article", "assess", "assessment", "assume", "attention",
  "available", "avoid", "aware", "balance", "beautiful", "beautifully", "beautify", "behavior", "benefit", "business",
  "capacity", "category", "challenge", "change", "clear", "collaboration", "common", "communication", "community",
  "compare", "comparison", "complete", "complex", "comprehensive", "comprehensively", "comprehensible", "comprehension",
  "concept", "condition", "consider", "consistent", "context", "continue", "control", "correct", "create", "critical",
  "culture", "current", "data", "decision", "define", "definition", "demonstrate", "describe", "description", "design",
  "detail", "develop", "developer", "developing", "development", "difference", "difficult", "direct", "discover", "effect",
  "effective", "efficient", "environment", "environmental", "establish", "evaluate", "evaluation", "evidence", "example",
  "experience", "explain", "feature", "focus", "function", "generate", "government", "grammar", "identify", "immediately",
  "impact", "important", "improve", "include", "increase", "independent", "information", "intelligent", "language", "learn",
  "learning", "maintain", "maintenance", "meaning", "method", "mitigate", "mitigation", "model", "natural", "necessary",
  "notice", "occur", "occurrence", "option", "organize", "performance", "phrase", "practice", "prefer", "prevent", "process",
  "produce", "production", "pronounce", "pronunciation", "quality", "question", "receive", "recognize", "recommend",
  "recommendation", "reduce", "related", "remember", "research", "respond", "response", "result", "retain", "retention",
  "review", "sentence", "separate", "similar", "simple", "specific", "spelling", "strategy", "structure", "study", "studies",
  "subtle", "subtly", "successful", "suggest", "suggestion", "support", "system", "technology", "translate", "translation",
  "understand", "usage", "useful", "valid", "value", "vocabulary", "weak", "weird", "word", "writing",
];

const KEYBOARD_NEIGHBORS: Record<string, string> = {
  q: "wa", w: "qase", e: "wsdr", r: "edft", t: "rfgy", y: "tghu", u: "yhji", i: "ujko", o: "iklp", p: "ol",
  a: "qwsz", s: "awedxz", d: "serfcx", f: "drtgvc", g: "ftyhbv", h: "gyujnb", j: "huikmn", k: "jiolm", l: "kop",
  z: "asx", x: "zsdc", c: "xdfv", v: "cfgb", b: "vghn", n: "bhjm", m: "njk",
};

function normalizeWord(value: string): string {
  return value.trim().toLowerCase().replace(/^[^a-z]+|[^a-z'-]+$/g, "");
}

function isSingleEnglishWord(value: string): boolean {
  return /^[a-z][a-z'-]{1,48}$/i.test(value.trim());
}

function getMaxDistance(length: number): number {
  if (length <= 4) return 1;
  if (length <= 8) return 2;
  return 3;
}

export function damerauLevenshtein(aRaw: string, bRaw: string): number {
  const a = normalizeWord(aRaw);
  const b = normalizeWord(bRaw);
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

function isSingleAdjacentKeyboardSubstitution(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let differenceIndex = -1;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      if (differenceIndex !== -1) return false;
      differenceIndex = i;
    }
  }
  if (differenceIndex === -1) return false;
  return KEYBOARD_NEIGHBORS[a[differenceIndex]]?.includes(b[differenceIndex]) ?? false;
}

function isAdjacentTransposition(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const diffs: number[] = [];
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) diffs.push(i);
    if (diffs.length > 2) return false;
  }
  return (
    diffs.length === 2 &&
    diffs[1] === diffs[0] + 1 &&
    a[diffs[0]] === b[diffs[1]] &&
    a[diffs[1]] === b[diffs[0]]
  );
}

function clampScore(value: number): number {
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

  recordSuccessfulSearch(wordRaw: string): void {
    const word = normalizeWord(wordRaw);
    if (!word) return;

    const history = this.readHistory();
    const current = history.find((item) => normalizeWord(item.word) === word);
    if (current) {
      current.count += 1;
      current.lastUsedAt = new Date().toISOString();
      current.word = word;
    } else {
      history.unshift({ word, count: 1, lastUsedAt: new Date().toISOString() });
    }

    history.sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 40)));
    } catch {
      // History personalization is optional; ignore storage failures.
    }
  }

  private collectCandidates(savedWords: SavedWord[]): Map<string, CandidateMeta> {
    const map = new Map<string, CandidateMeta>();

    const add = (candidate: CandidateMeta) => {
      const key = normalizeWord(candidate.word);
      if (!key || key.length < 2) return;
      const previous = map.get(key);
      if (!previous || candidate.boost > previous.boost) {
        map.set(key, { ...candidate, word: key });
      } else {
        previous.boost = Math.max(previous.boost, candidate.boost);
        previous.partOfSpeech ||= candidate.partOfSpeech;
        previous.vietnameseMeaning ||= candidate.vietnameseMeaning;
      }
    };

    COMMON_WORDS.forEach((word, index) => {
      add({ word, source: "dictionary", frequencyRank: index, boost: Math.max(0, 0.055 - index * 0.00015) });
    });

    Object.values(DEMO_DICTIONARY_ENTRIES).forEach((entry, index) => {
      const primary = entry.partsOfSpeech[0];
      add({
        word: entry.normalizedWord,
        source: "dictionary",
        frequencyRank: index,
        boost: 0.09,
        partOfSpeech: primary?.type,
        vietnameseMeaning: primary?.meanings[0]?.vietnamese,
      });

      entry.wordFamily.forEach((familyWord, familyIndex) => {
        add({
          word: familyWord.word,
          source: "dictionary",
          frequencyRank: 500 + familyIndex,
          boost: 0.035,
          partOfSpeech: familyWord.type,
          vietnameseMeaning: familyWord.vietnameseMeaning,
        });
      });

      entry.synonyms.slice(0, 8).forEach((synonym, synonymIndex) => {
        add({ word: synonym, source: "dictionary", frequencyRank: 700 + synonymIndex, boost: 0.02 });
      });
    });

    savedWords.forEach((saved, index) => {
      const primary = saved.dictionary.partsOfSpeech[0];
      add({
        word: saved.normalizedWord || saved.word,
        source: "vocabulary",
        frequencyRank: index,
        boost: 0.16,
        partOfSpeech: primary?.type,
        vietnameseMeaning: primary?.meanings[0]?.vietnamese,
      });
    });

    this.readHistory().forEach((item, index) => {
      const countBoost = Math.min(0.12, item.count * 0.018);
      add({
        word: item.word,
        source: "history",
        frequencyRank: index,
        boost: 0.09 + countBoost,
      });
    });

    return map;
  }

  hasExactWord(inputRaw: string, savedWords: SavedWord[] = []): boolean {
    const input = normalizeWord(inputRaw);
    if (!input) return false;
    return this.collectCandidates(savedWords).has(input);
  }

  suggest(inputRaw: string, savedWords: SavedWord[] = [], limit = 5): WordSuggestion[] {
    const input = normalizeWord(inputRaw);
    if (!input || input.length < 2 || !isSingleEnglishWord(input)) return [];

    const candidates = this.collectCandidates(savedWords);
    const results = new Map<string, WordSuggestion>();

    const push = (suggestion: WordSuggestion) => {
      const key = normalizeWord(suggestion.word);
      if (!key || key === input) return;
      const previous = results.get(key);
      if (!previous || suggestion.score > previous.score) {
        results.set(key, { ...suggestion, word: key });
      }
    };

    const directCorrections = COMMON_CORRECTIONS[input] || [];
    directCorrections.forEach((word, index) => {
      const meta = candidates.get(word);
      push({
        word,
        score: clampScore(0.995 - index * 0.01),
        source: "spelling",
        reason: "common-typo",
        editDistance: damerauLevenshtein(input, word),
        partOfSpeech: meta?.partOfSpeech,
        vietnameseMeaning: meta?.vietnameseMeaning,
      });
    });

    candidates.forEach((candidate, word) => {
      if (word === input) return;

      if (word.startsWith(input) && input.length >= 2) {
        const completionRatio = Math.min(1, input.length / word.length);
        push({
          word,
          score: clampScore(0.73 + completionRatio * 0.17 + candidate.boost),
          source: candidate.source,
          reason: candidate.source === "history" ? "history" : candidate.source === "vocabulary" ? "saved" : "prefix",
          partOfSpeech: candidate.partOfSpeech,
          vietnameseMeaning: candidate.vietnameseMeaning,
        });
        return;
      }

      const maxDistance = getMaxDistance(input.length);
      if (Math.abs(word.length - input.length) > maxDistance) return;

      const distance = damerauLevenshtein(input, word);
      if (distance > maxDistance) return;

      const similarity = 1 - distance / Math.max(input.length, word.length);
      let reason: WordSuggestionReason = "edit-distance";
      let extra = 0;

      if (isAdjacentTransposition(input, word)) {
        reason = "transposition";
        extra += 0.07;
      } else if (isSingleAdjacentKeyboardSubstitution(input, word)) {
        reason = "keyboard-neighbor";
        extra += 0.045;
      }

      const lengthPenalty = distance > 1 ? 0.025 * (distance - 1) : 0;
      push({
        word,
        score: clampScore(0.57 + similarity * 0.30 + candidate.boost + extra - lengthPenalty),
        source: candidate.source === "vocabulary" || candidate.source === "history" ? candidate.source : "spelling",
        reason,
        editDistance: distance,
        partOfSpeech: candidate.partOfSpeech,
        vietnameseMeaning: candidate.vietnameseMeaning,
      });
    });

    return [...results.values()]
      .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))
      .slice(0, limit);
  }

  isLikelyTypo(inputRaw: string, suggestions: WordSuggestion[], savedWords: SavedWord[] = []): boolean {
    const input = normalizeWord(inputRaw);
    if (!input || !isSingleEnglishWord(input) || input.length < 3) return false;
    if (this.hasExactWord(input, savedWords)) return false;
    if (COMMON_CORRECTIONS[input]?.length) return true;

    const best = suggestions[0];
    if (!best) return false;
    if (best.reason === "prefix") return false;

    return (
      (best.reason === "transposition" && best.score >= 0.90) ||
      (best.reason === "keyboard-neighbor" && best.editDistance === 1 && best.score >= 0.90) ||
      (best.reason === "edit-distance" && best.editDistance === 1 && input.length >= 5 && best.score >= 0.91)
    );
  }

  mergeSuggestions(local: WordSuggestion[], remote: Array<{ text: string; confidence: number }>, limit = 5): WordSuggestion[] {
    const merged = new Map<string, WordSuggestion>();
    local.forEach((item) => merged.set(normalizeWord(item.word), item));

    remote.forEach((item) => {
      const word = normalizeWord(item.text);
      if (!word) return;
      const suggestion: WordSuggestion = {
        word,
        score: clampScore(item.confidence),
        source: "ai",
      };
      const previous = merged.get(word);
      if (!previous || suggestion.score > previous.score) merged.set(word, suggestion);
    });

    return [...merged.values()]
      .filter((item) => item.word.length > 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const wordSuggestionService = new WordSuggestionService();
