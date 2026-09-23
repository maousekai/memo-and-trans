// @ts-nocheck -- Bun provides bun:test at runtime; production tsc should ignore runner-only globals.
import { describe, expect, test } from "bun:test";
import { classifyInput } from "../src/services/translation/inputClassifier";
import { buildReverseSuggestions } from "../src/services/translation/localPhraseService";
import {
  analysisProviderOrder,
  splitTranslationSegments,
  translationProviderOrder,
} from "../src/services/translation/translationService";
import {
  NVIDIA_ANALYSIS_MODEL,
  NVIDIA_RIVA_TRANSLATION_MODEL,
} from "../src/services/translation/nvidiaTranslationProvider";
import { lookupCompositionalPhrase } from "../src/services/translation/localCompositionalPhraseService";
import { wordSuggestionService } from "../src/services/search/wordSuggestionService";
import { localDictionaryService } from "../src/services/dictionary/localDictionaryService";
import {
  OFFLINE_DICTIONARY_10000_COUNT,
  OFFLINE_DICTIONARY_10000_ALIASES,
} from "../src/data/offlineDictionary10000.generated";
import { readFileSync } from "node:fs";

describe("v18 translation classifier regressions", () => {
  test("comma-terminated phrase stays phrase mode", () => {
    expect(classifyInput("For many of them,")).toBe("translation_phrase");
  });

  test("semantic clue stays translation-first instead of dictionary alias", () => {
    expect(classifyInput("profession or job")).toBe("translation_phrase");
  });

  test("complete punctuated sentence is sentence mode", () => {
    expect(classifyInput("For many of them, this is the first opportunity.")).toBe("translation_sentence");
  });
});

describe("v18 reverse lookup regressions", () => {
  test("profession or job returns the approved semantic group in order", () => {
    expect(buildReverseSuggestions("profession or job").map((item) => item.word)).toEqual([
      "occupation",
      "profession",
      "employment",
      "career",
    ]);
  });
});

describe("v18 paragraph segmentation regressions", () => {
  test("long paragraphs preserve all text and split at safe boundaries", () => {
    const input = Array.from(
      { length: 120 },
      (_, index) => `Sentence ${index + 1} contains several ordinary English words for segmentation.`,
    ).join(" ");

    const segments = splitTranslationSegments(input, 1500);
    expect(segments.length).toBeGreaterThan(1);
    expect(segments.every((segment) => segment.length <= 1500)).toBe(true);
    expect(segments.join(" ").replace(/\s+/g, " ")).toBe(input.replace(/\s+/g, " "));
  });

  test("an unusually long token is never cut in the middle", () => {
    const longToken = "a".repeat(1600);
    expect(splitTranslationSegments(longToken, 1500)).toEqual([longToken]);
  });
});


describe("v18.1 instant-first local phrase regressions", () => {
  test("standing outside resolves offline immediately", () => {
    const result = lookupCompositionalPhrase("standing outside");
    expect(result?.translatedText).toBe("đang đứng bên ngoài");
    expect(result?.source).toBe("local");
    expect(result?.localStrategy).toBe("composed");
    expect(result?.analysisStatus).toBe("pending");
  });

  test("common TOEIC Part 1 action chunks compose naturally", () => {
    expect(lookupCompositionalPhrase("waiting for the bus")?.translatedText).toBe("đang chờ xe buýt");
    expect(lookupCompositionalPhrase("sitting at a desk")?.translatedText).toBe("đang ngồi tại bàn làm việc");
    expect(lookupCompositionalPhrase("walking down the street")?.translatedText).toBe("đang đi bộ dọc theo đường phố");
  });

  test("short be + V-ing clauses can stay useful even when cloud is slow", () => {
    expect(lookupCompositionalPhrase("some people are standing outside")?.translatedText)
      .toBe("một số người đang đứng bên ngoài");
  });

  test("common passive image-description chunks are supported", () => {
    expect(lookupCompositionalPhrase("being loaded onto a truck")?.translatedText)
      .toBe("đang được chất hàng lên xe tải");
  });
});


describe("v18.2 NVIDIA Riva translation routing", () => {
  test("auto translation prefers NVIDIA Riva before Gemini", () => {
    expect(translationProviderOrder("auto").map((provider) => provider.id)).toEqual([
      "nvidia",
      "gemini",
    ]);
  });

  test("auto analysis still prefers Gemini before NVIDIA enrichment", () => {
    expect(analysisProviderOrder("auto").map((provider) => provider.id)).toEqual([
      "gemini",
      "nvidia",
    ]);
  });

  test("NVIDIA translation and analysis use separate task-specific models", () => {
    expect(NVIDIA_RIVA_TRANSLATION_MODEL).toBe("nvidia/riva-translate-4b-instruct-v2");
    expect(NVIDIA_ANALYSIS_MODEL).toBe("nvidia/nemotron-3.5-lightning-30b-a3b");
  });
});


describe("v18.3 real offline dictionary core", () => {
  test("build contains the full-scale lexicon rather than the old 20k subset", () => {
    expect(OFFLINE_DICTIONARY_10000_COUNT).toBeGreaterThanOrEqual(140000);
    expect(Object.keys(OFFLINE_DICTIONARY_10000_ALIASES).length).toBeGreaterThanOrEqual(100000);
  });

  test("common inflected forms expose their lemma offline without hiding exact entries", () => {
    expect(localDictionaryService.lookupInstant("repaired")?.normalizedWord).toBe("repair");
    expect(localDictionaryService.resolveInflection("stopped")).toBe("stop");
    expect(localDictionaryService.resolveInflection("ran")).toBe("run");
    expect(localDictionaryService.lookupInstant("stopped")).not.toBeNull();
  });

  test("repaire is suggested from the lexicon without a one-off hardcoded patch", () => {
    const suggestions = wordSuggestionService.suggestCorrections("repaire", [], 5);
    expect(suggestions.some((item) => item.word === "repair")).toBe(true);
  });

  test("prefix suggestions come from the offline dictionary index", () => {
    const suggestions = localDictionaryService.suggestPrefix("repa", 12);
    expect(suggestions.some((item) => item.word === "repair")).toBe(true);
  });

  test("generic transposition recovery searches the full offline lexicon", () => {
    const suggestions = wordSuggestionService.suggestCorrections("retian", [], 5);
    expect(suggestions.some((item) => item.word === "retain")).toBe(true);
  });

  test("dictionary lookup path does not call an LLM", () => {
    const source = readFileSync(new URL("../src/store/useAppStore.ts", import.meta.url), "utf8");
    const start = source.indexOf("searchWord: async");
    const end = source.indexOf("captureSelectedAndLookup: async", start);
    const searchWordSource = source.slice(start, end);
    expect(searchWordSource.includes("aiService.lookupWord")).toBe(false);
    expect(searchWordSource.includes("lookupPublic")).toBe(true);
    expect(searchWordSource.includes("suggestCorrections")).toBe(true);
  });
});
