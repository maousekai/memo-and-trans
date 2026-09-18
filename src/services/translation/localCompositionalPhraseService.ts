import type {
  TranslationChunk,
  TranslationResult,
} from "../../types/translation";
import type { DictionaryEntry } from "../../types/dictionary";
import { localDictionaryService } from "../dictionary/localDictionaryService";

interface WordInfo {
  source: string;
  lemma: string;
  vi: string;
  pos: string;
}

interface SequenceTranslation {
  text: string;
  chunks: TranslationChunk[];
}

const ARTICLES = new Set(["a", "an", "the"]);

const MULTIWORD_TRANSLATIONS: Record<string, string> = {
  "next to": "bên cạnh",
  "in front of": "phía trước",
  "on top of": "trên",
  "across from": "đối diện",
  "out of": "ra khỏi",
  "in between": "ở giữa",
  "a group of": "một nhóm",
  "bus stop": "trạm xe buýt",
  "train station": "ga tàu",
  "parking lot": "bãi đỗ xe",
  "parking garage": "nhà để xe",
  "coffee shop": "quán cà phê",
  "office building": "tòa nhà văn phòng",
  "construction site": "công trường",
  "dining table": "bàn ăn",
};

const TOKEN_TRANSLATIONS: Record<string, string> = {
  outside: "bên ngoài",
  inside: "bên trong",
  near: "gần",
  beside: "bên cạnh",
  behind: "phía sau",
  under: "bên dưới",
  underneath: "bên dưới",
  above: "phía trên",
  over: "phía trên",
  on: "trên",
  at: "tại",
  in: "trong",
  into: "vào",
  onto: "lên",
  from: "từ",
  with: "với",
  without: "không có",
  for: "cho",
  around: "xung quanh",
  along: "dọc theo",
  down: "dọc theo",
  across: "băng qua",
  through: "qua",
  toward: "về phía",
  towards: "về phía",
  by: "bên cạnh",
  off: "khỏi",
  up: "lên",
  some: "một số",
  several: "vài",
  many: "nhiều",
  few: "một vài",
  all: "tất cả",
  both: "cả hai",
  people: "người",
  person: "người",
  bus: "xe buýt",
  desk: "bàn làm việc",
  street: "đường phố",
  sidewalk: "vỉa hè",
  pavement: "vỉa hè",
  doorway: "lối cửa",
  entrance: "lối vào",
  exit: "lối ra",
  building: "tòa nhà",
  truck: "xe tải",
  car: "ô tô",
  bicycle: "xe đạp",
  bike: "xe đạp",
  table: "bàn",
  chair: "ghế",
  shelf: "kệ",
  counter: "quầy",
  window: "cửa sổ",
  door: "cửa",
  box: "hộp",
  boxes: "các hộp",
  bag: "túi",
  bags: "các túi",
  package: "gói hàng",
  packages: "các gói hàng",
};

const VERB_TRANSLATIONS: Record<string, string> = {
  stand: "đứng",
  sit: "ngồi",
  walk: "đi bộ",
  wait: "chờ",
  look: "nhìn",
  watch: "quan sát",
  hold: "cầm",
  carry: "mang",
  wear: "mặc",
  talk: "nói chuyện",
  speak: "nói",
  cross: "băng qua",
  load: "chất hàng",
  unload: "dỡ hàng",
  push: "đẩy",
  pull: "kéo",
  ride: "đi",
  place: "đặt",
  put: "đặt",
  arrange: "sắp xếp",
  stack: "xếp chồng",
  lean: "dựa",
  point: "chỉ",
  read: "đọc",
  write: "viết",
  use: "sử dụng",
  open: "mở",
  close: "đóng",
  enter: "đi vào",
  leave: "rời khỏi",
  climb: "leo",
  clean: "dọn dẹp",
  sweep: "quét",
  serve: "phục vụ",
  work: "làm việc",
  prepare: "chuẩn bị",
  inspect: "kiểm tra",
  check: "kiểm tra",
  move: "di chuyển",
  drive: "lái",
  park: "đỗ",
  reach: "vươn tới",
  bend: "cúi",
  kneel: "quỳ",
  board: "lên",
};

const BE_FORMS = new Set(["am", "is", "are", "was", "were", "be", "been"]);
const PREPOSITION_STARTERS = new Set([
  "outside", "inside", "near", "beside", "behind", "under", "underneath",
  "above", "over", "on", "at", "in", "from", "with", "without", "around",
  "along", "across", "through", "toward", "towards", "next",
]);

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[“”"'‘’]/g, "")
    .replace(/[,.!?;:]+$/g, "")
    .replace(/\s+/g, " ");
}

function lexicalTokens(value: string): string[] {
  return normalize(value).match(/[a-z]+(?:-[a-z]+)*/g) || [];
}

function cleanMeaning(value: string): string {
  return String(value || "")
    .split(/[;；]/)[0]
    .replace(/\([^)]*\)/g, "")
    .trim();
}

function meaningFromEntry(entry: DictionaryEntry, preferredPos?: string): WordInfo | null {
  const parts = entry.partsOfSpeech || [];
  const preferred = preferredPos
    ? parts.find((part) => String(part.type || "").toLowerCase().includes(preferredPos))
    : null;
  const part = preferred || parts[0];
  const meaning = part?.meanings?.find((item) => cleanMeaning(item.vietnamese));
  if (!part || !meaning) return null;

  return {
    source: entry.query,
    lemma: (entry.normalizedWord || entry.query || "").toLowerCase(),
    vi: cleanMeaning(meaning.vietnamese),
    pos: String(part.type || "general").toLowerCase(),
  };
}

function lookupWord(word: string, preferredPos?: string): WordInfo | null {
  const override = TOKEN_TRANSLATIONS[word];
  if (override && !preferredPos) {
    return { source: word, lemma: word, vi: override, pos: "override" };
  }

  const entry = localDictionaryService.lookupInstant(word);
  if (!entry) return null;
  const info = meaningFromEntry(entry, preferredPos);
  if (!info) return null;
  return { ...info, source: word };
}

function verbCandidates(token: string): string[] {
  const candidates = [token];
  if (token === "lying") candidates.push("lie");
  if (token === "tying") candidates.push("tie");
  if (token.endsWith("ing") && token.length > 4) {
    const stem = token.slice(0, -3);
    candidates.push(stem);
    if (/([a-z])\1$/.test(stem)) candidates.push(stem.slice(0, -1));
    candidates.push(stem + "e");
  }
  if (token.endsWith("ed") && token.length > 3) {
    const stem = token.slice(0, -2);
    candidates.push(stem);
    if (/([a-z])\1$/.test(stem)) candidates.push(stem.slice(0, -1));
    candidates.push(stem + "e");
  }
  if (token.endsWith("d") && token.length > 3) candidates.push(token.slice(0, -1));
  return [...new Set(candidates)];
}

function lookupVerb(token: string): WordInfo | null {
  for (const candidate of verbCandidates(token)) {
    if (VERB_TRANSLATIONS[candidate]) {
      return {
        source: token,
        lemma: candidate,
        vi: VERB_TRANSLATIONS[candidate],
        pos: "verb",
      };
    }
    const info = lookupWord(candidate, "verb");
    if (info) {
      const preferred = VERB_TRANSLATIONS[info.lemma] || cleanMeaning(info.vi);
      if (preferred) return { ...info, source: token, vi: preferred };
    }
  }
  return null;
}

function matchMultiword(tokens: string[], index: number): { length: number; source: string; target: string } | null {
  for (const length of [3, 2]) {
    const source = tokens.slice(index, index + length).join(" ");
    const target = MULTIWORD_TRANSLATIONS[source];
    if (target) return { length, source, target };
  }
  return null;
}

function translateContentRun(tokens: string[]): SequenceTranslation | null {
  const infos = tokens.map((token) => lookupWord(token));
  if (infos.some((info) => !info)) return null;
  const resolved = infos as WordInfo[];

  let ordered = resolved;
  if (
    resolved.length >= 2 &&
    resolved[resolved.length - 1].pos.includes("noun") &&
    resolved.slice(0, -1).every((item) => item.pos.includes("adjective"))
  ) {
    ordered = [resolved[resolved.length - 1], ...resolved.slice(0, -1)];
  }

  return {
    text: ordered.map((item) => item.vi).join(" "),
    chunks: resolved.map((item) => ({
      source: item.source,
      target: item.vi,
    })),
  };
}

function isBoundaryToken(token: string): boolean {
  return ARTICLES.has(token) || Boolean(TOKEN_TRANSLATIONS[token]) || PREPOSITION_STARTERS.has(token);
}

function translateSequence(tokens: string[]): SequenceTranslation | null {
  const out: string[] = [];
  const chunks: TranslationChunk[] = [];
  let index = 0;

  while (index < tokens.length) {
    const multi = matchMultiword(tokens, index);
    if (multi) {
      out.push(multi.target);
      chunks.push({ source: multi.source, target: multi.target });
      index += multi.length;
      continue;
    }

    const token = tokens[index];
    if (ARTICLES.has(token)) {
      index += 1;
      continue;
    }

    const override = TOKEN_TRANSLATIONS[token];
    if (override) {
      out.push(override);
      chunks.push({ source: token, target: override });
      index += 1;
      continue;
    }

    let end = index + 1;
    while (
      end < tokens.length &&
      !isBoundaryToken(tokens[end]) &&
      !matchMultiword(tokens, end)
    ) {
      end += 1;
    }

    const translatedRun = translateContentRun(tokens.slice(index, end));
    if (!translatedRun) return null;
    out.push(translatedRun.text);
    chunks.push(...translatedRun.chunks);
    index = end;
  }

  const text = out.join(" ").replace(/\s+/g, " ").trim();
  return text ? { text, chunks } : null;
}

function isPresentParticiple(token: string): boolean {
  return token === "lying" || token === "tying" || /ing$/.test(token);
}

function isPastParticiple(token: string): boolean {
  return /(ed|en)$/.test(token) || new Set([
    "held", "built", "put", "set", "left", "made", "driven", "written", "read",
  ]).has(token);
}

function buildResult(
  sourceText: string,
  translatedText: string,
  confidence: number,
  chunks: TranslationChunk[],
  startedAt: number,
): TranslationResult {
  return {
    sourceText: sourceText.trim(),
    translatedText,
    alternativeTranslations: [],
    source: "local",
    localStrategy: "composed",
    confidence,
    latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
    isPartial: false,
    sourceLanguage: "en",
    targetLanguage: "vi",
    chunks,
    keyVocabulary: [],
    grammarNotes: [],
    naturalnessNote: null,
    reverseSuggestions: [],
    analysisStatus: "pending",
  };
}

export function lookupCompositionalPhrase(rawText: string): TranslationResult | null {
  const startedAt = performance.now();
  const tokens = lexicalTokens(rawText);
  if (tokens.length < 2 || tokens.length > 8) return null;

  // "being loaded onto a truck" -> "đang được chất hàng lên xe tải"
  if (tokens[0] === "being" && tokens[1] && isPastParticiple(tokens[1])) {
    const verb = lookupVerb(tokens[1]);
    const tail = translateSequence(tokens.slice(2));
    if (!verb || !tail) return null;
    return buildResult(
      rawText,
      ["đang được", verb.vi, tail.text].filter(Boolean).join(" "),
      0.94,
      [
        { source: "being " + tokens[1], target: "đang được " + verb.vi, explanation: "cấu trúc bị động đang diễn ra" },
        ...tail.chunks,
      ],
      startedAt,
    );
  }

  // "some people are standing outside" -> "một số người đang đứng bên ngoài"
  const beIndex = tokens.findIndex((token, index) => index > 0 && index < 4 && BE_FORMS.has(token));
  if (beIndex > 0 && tokens[beIndex + 1]) {
    const subject = translateSequence(tokens.slice(0, beIndex));
    if (!subject) return null;

    const predicate = tokens[beIndex + 1];
    if (isPresentParticiple(predicate)) {
      const verb = lookupVerb(predicate);
      const tail = translateSequence(tokens.slice(beIndex + 2));
      if (!verb || !tail) return null;
      return buildResult(
        rawText,
        [subject.text, "đang", verb.vi, tail.text].filter(Boolean).join(" "),
        0.95,
        [
          ...subject.chunks,
          { source: tokens.slice(beIndex, beIndex + 2).join(" "), target: "đang " + verb.vi, explanation: "be + V-ing → hành động đang diễn ra" },
          ...tail.chunks,
        ],
        startedAt,
      );
    }

    if (isPastParticiple(predicate)) {
      const verb = lookupVerb(predicate);
      const tail = translateSequence(tokens.slice(beIndex + 2));
      if (!verb || !tail) return null;
      return buildResult(
        rawText,
        [subject.text, "được", verb.vi, tail.text].filter(Boolean).join(" "),
        0.91,
        [
          ...subject.chunks,
          { source: tokens.slice(beIndex, beIndex + 2).join(" "), target: "được " + verb.vi, explanation: "be + past participle → cấu trúc bị động" },
          ...tail.chunks,
        ],
        startedAt,
      );
    }
  }

  // "standing outside" / "waiting for the bus"
  if (isPresentParticiple(tokens[0])) {
    const verb = lookupVerb(tokens[0]);
    const tail = translateSequence(tokens.slice(1));
    if (!verb || !tail) return null;
    return buildResult(
      rawText,
      ["đang", verb.vi, tail.text].filter(Boolean).join(" "),
      0.95,
      [
        { source: tokens[0], target: "đang " + verb.vi, explanation: "V-ing → hành động đang diễn ra" },
        ...tail.chunks,
      ],
      startedAt,
    );
  }

  // Short imperative/base-verb chunks such as "wait outside".
  const firstVerb = lookupVerb(tokens[0]);
  if (firstVerb) {
    const tail = translateSequence(tokens.slice(1));
    if (!tail) return null;
    return buildResult(
      rawText,
      [firstVerb.vi, tail.text].filter(Boolean).join(" "),
      0.89,
      [
        { source: tokens[0], target: firstVerb.vi },
        ...tail.chunks,
      ],
      startedAt,
    );
  }

  // Safe prepositional/adverbial chunks such as "outside the building".
  if (PREPOSITION_STARTERS.has(tokens[0]) || matchMultiword(tokens, 0)) {
    const translated = translateSequence(tokens);
    if (!translated) return null;
    return buildResult(rawText, translated.text, 0.90, translated.chunks, startedAt);
  }

  // Deliberately do not compose arbitrary adjective/noun strings. Cloud is safer
  // for phrases where Vietnamese word order cannot be inferred confidently.
  return null;
}

export const localCompositionalPhraseService = {
  lookup: lookupCompositionalPhrase,
};
