// @ts-nocheck -- Bun provides bun:test at runtime; production tsc should ignore runner-only globals.
import { describe, expect, test } from "bun:test";
import { classifyInput } from "../src/services/translation/inputClassifier";
import { buildReverseSuggestions } from "../src/services/translation/localPhraseService";
import { splitTranslationSegments } from "../src/services/translation/translationService";
import { lookupCompositionalPhrase } from "../src/services/translation/localCompositionalPhraseService";

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
