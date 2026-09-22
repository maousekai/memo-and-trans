// @ts-nocheck -- Bun provides bun:test at runtime; production tsc should ignore runner-only globals.
import { describe, expect, test } from "bun:test";
import { localDictionaryService } from "../src/services/dictionary/localDictionaryService";

describe("v18.2.1 dictionary resilience", () => {
  test("production offline dictionary is actually generated before tests", () => {
    expect(localDictionaryService.offlineCount).toBe(20000);
  });

  test("repair is guaranteed offline", () => {
    const entry = localDictionaryService.lookupInstant("repair");
    expect(entry?.normalizedWord).toBe("repair");
    expect(entry?.partsOfSpeech?.length).toBeGreaterThan(0);
  });

  test("the reported bug repaire autocorrects to repair without cloud", () => {
    const resolution = localDictionaryService.resolveLookup("repaire");
    expect(resolution.correctedFrom).toBe("repaire");
    expect(resolution.resolvedWord).toBe("repair");
    expect(resolution.entry?.normalizedWord).toBe("repair");
    expect(resolution.suggestions[0]?.word).toBe("repair");
    expect(resolution.suggestions[0]?.distance).toBe(1);
  });

  test("generic adjacent-transposition typo is recovered from local vocabulary", () => {
    const resolution = localDictionaryService.resolveLookup("resposne");
    expect(resolution.resolvedWord).toBe("response");
    expect(resolution.entry?.normalizedWord).toBe("response");
    expect(resolution.correctedFrom).toBe("resposne");
  });

  test("valid exact words are never autocorrected", () => {
    const resolution = localDictionaryService.resolveLookup("language");
    expect(resolution.correctedFrom).toBeNull();
    expect(resolution.resolvedWord).toBe("language");
    expect(resolution.entry?.normalizedWord).toBe("language");
  });
});
