import { describe, expect, test } from "bun:test";
import { classifyInput } from "../src/services/translation/inputClassifier";
import { buildReverseSuggestions } from "../src/services/translation/localPhraseService";
import { splitTranslationSegments } from "../src/services/translation/translationService";

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
