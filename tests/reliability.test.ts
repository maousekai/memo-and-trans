// @ts-nocheck -- Executed by Bun; no production dependency on the test runner.
import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { parseModelJson, translationSchema, evaluationSchema } from "../src/services/ai/responseValidation";
import { translationService } from "../src/services/translation/translationService";
import { geminiTranslationProvider } from "../src/services/translation/geminiProvider";
import { nvidiaTranslationProvider } from "../src/services/translation/nvidiaTranslationProvider";
import { translationCache } from "../src/services/translation/translationCache";
import { localDictionaryService } from "../src/services/dictionary/localDictionaryService";
import { classifyInput } from "../src/services/translation/inputClassifier";
import { wordSuggestionService } from "../src/services/search/wordSuggestionService";
import { NvidiaNIMProvider } from "../src/services/ai/nvidiaProvider";
import { StorageService } from "../src/services/database/storageService";
import { DICTIONARY_CORRECTIONS } from "../src/data/dictionaryCorrections";
import { generateFlashcards } from "../src/services/fsrs/fsrsEngine";
import { upgradeSavedEntry } from '../src/services/dictionary/entryIntegrity';
import { speechService } from '../src/services/pronunciation/speechService';

class MemoryStorage {
  values = new Map();
  fail = false;
  get length() { return this.values.size; }
  key(i) { return [...this.values.keys()][i] ?? null; }
  getItem(k) { return this.values.get(k) ?? null; }
  setItem(k, v) { if (this.fail) throw new Error("QuotaExceededError"); this.values.set(k, v); }
  removeItem(k) { this.values.delete(k); }
}
const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const originalStorage = globalThis.localStorage;
const originalAudio = globalThis.Audio;
const providers = [geminiTranslationProvider, nvidiaTranslationProvider];
const methods = providers.map((p) => ({ getStatus: p.getStatus, translate: p.translate, analyze: p.analyze }));
let memory;
beforeEach(() => {
  memory = new MemoryStorage();
  globalThis.localStorage = memory;
  globalThis.window = { location: { href: "http://lexiglass.local/" }, setTimeout, clearTimeout };
  translationService.clearProviderStatusCache();
});
afterEach(() => {
  providers.forEach((p, i) => Object.assign(p, methods[i]));
  globalThis.fetch = originalFetch;
  globalThis.window = originalWindow;
  globalThis.localStorage = originalStorage;
  globalThis.Audio = originalAudio;
  translationService.clearProviderStatusCache();
});
function enableProviders() {
  for (const provider of providers) {
    provider.getStatus = async () => ({ configured: true, provider: provider.id, model: "test" });
  }
}
function fast(source, translatedText) {
  return { source, translatedText, alternativeTranslations: [], latencyMs: 1 };
}

describe("translation integrity", () => {
  test("general sentences go to cloud with numbers intact", async () => {
    enableProviders();
    const calls = [];
    nvidiaTranslationProvider.translate = async (text) => {
      calls.push(text); return fast("nvidia", "đang chờ 2 người");
    };
    const result = await translationService.translate("waiting for 2 people");
    expect(calls).toEqual(["waiting for 2 people"]);
    expect(result.translatedText).toBe("đang chờ 2 người");
    expect(result.source).toBe("nvidia");
  });
  test("loaded dictionary never suppresses cloud for looking for work", async () => {
    await localDictionaryService.lookupOffline("work");
    enableProviders();
    nvidiaTranslationProvider.translate = async () => fast("nvidia", "một số người đang tìm việc làm");
    const result = await translationService.translate("some people are looking for work");
    expect(result.source).toBe("nvidia");
    expect(result.translatedText).toContain("tìm việc");
  });
  test("offline mode refuses an unsupported general sentence", async () => {
    await expect(translationService.translate("waiting for 2 people", { offlineOnly: true })).rejects.toThrow("offline");
  });
  test("secondary provider is used after primary request fails", async () => {
    enableProviders();
    nvidiaTranslationProvider.translate = async () => { throw new Error("temporary outage"); };
    geminiTranslationProvider.translate = async () => fast("gemini", "Xin hãy đợi hai phút.");
    const result = await translationService.translate("Please wait for two minutes.");
    expect(result.source).toBe("gemini");
  });
  test("newly configured provider is retried without a ten minute wait", async () => {
    let configured = false;
    nvidiaTranslationProvider.getStatus = async () => ({ configured, provider: "NVIDIA", model: "test" });
    geminiTranslationProvider.getStatus = async () => ({ configured: false, provider: "Gemini", model: "test" });
    await expect(translationService.translate("Please wait for two minutes.")).rejects.toThrow();
    configured = true;
    nvidiaTranslationProvider.translate = async () => fast("nvidia", "Xin hãy đợi hai phút.");
    expect((await translationService.translate("Please wait for two minutes.")).source).toBe("nvidia");
  });
  test("force refresh calls the requested provider again", async () => {
    enableProviders();
    let count = 0;
    nvidiaTranslationProvider.translate = async () => fast("nvidia", "lần " + ++count);
    await translationService.translate("Please wait for two minutes.");
    await translationService.translate("Please wait for two minutes.");
    const result = await translationService.translate("Please wait for two minutes.", { forceRefresh: true });
    expect(count).toBe(2);
    expect(result.translatedText).toBe("lần 2");
  });
  test("cache distinguishes case and provider preference, keeping origin", async () => {
    enableProviders();
    nvidiaTranslationProvider.translate = async () => fast("nvidia", "Giúp chúng tôi.");
    geminiTranslationProvider.translate = async () => fast("gemini", "Giúp Hoa Kỳ.");
    await translationService.translate("Could you please help us tomorrow?");
    expect(translationCache.read("Could you please help US tomorrow?")).toBeNull();
    expect(translationCache.read("Could you please help us tomorrow?", "online:gemini")).toBeNull();
    const cached = await translationService.translate("Could you please help us tomorrow?");
    expect(cached.source).toBe("nvidia");
    expect(cached.fromCache).toBe(true);
    const switched = await translationService.translate("Could you please help us tomorrow?", { providerPreference: "gemini" });
    expect(switched.source).toBe("gemini");
  });
  test("multiword classification is unchanged after dictionary lookup", async () => {
    const before = classifyInput("parking lot");
    globalThis.fetch = async () => Response.json({ entries: { "parking lot": [{ p: "noun", v: ["bãi đỗ xe"], e: [], f: [] }] }, aliases: {}, ranks: {} });
    await localDictionaryService.lookupOffline("parking lot");
    expect(classifyInput("parking lot")).toBe(before);
  });
});

describe("meaning and example integrity", () => {
  test("bank and work keep definitions and examples with their actual senses", async () => {
    const bank = await localDictionaryService.lookupOffline("bank");
    expect(bank.partsOfSpeech[0].meanings[0].vietnamese).toBe("ngân hàng");
    expect(bank.partsOfSpeech[0].meanings[0].englishDefinition).toContain("money");
    expect(bank.partsOfSpeech[0].meanings[1].englishDefinition).toContain("river");
    const work = await localDictionaryService.lookupOffline("work");
    expect(work.partsOfSpeech[0].meanings[0].englishDefinition).toContain("job");
    expect(work.partsOfSpeech[0].meanings[1].vietnamese).toBe("tác phẩm");
  });
  test("unpaired imports do not invent bilingual sense pairs or examples", async () => {
    globalThis.fetch = async () => Response.json({
      entries: { zebra: [
        { p: "n", v: ["nghĩa A", "nghĩa B"], e: ["unrelated definition"], f: [], x: [["First example.", "Ví dụ một."]] },
        { p: "noun", v: ["nghĩa A"], e: [], f: [], x: [["Second example.", "Ví dụ hai."]] },
      ] }, aliases: {}, ranks: {},
    });
    const result = await localDictionaryService.lookupOffline("zebra");
    expect(result.partsOfSpeech.length).toBe(1);
    expect(result.partsOfSpeech[0].meanings.every((m) => !m.englishDefinition && !m.examples.length)).toBe(true);
    expect(result.partsOfSpeech[0].unpairedEnglishDefinitions).toEqual(["unrelated definition"]);
    expect(result.usageExamples.length).toBe(2);
  });
  test("a temporary shard failure can recover on the next lookup", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      if (++calls === 1) throw new Error("transient");
      return Response.json({ entries: { quasar: [{ p: "noun", v: ["chuẩn tinh"], e: [], f: [] }] }, aliases: {}, ranks: {} });
    };
    expect(await localDictionaryService.lookupOffline("quasar")).toBeNull();
    expect(await localDictionaryService.lookupOffline("quasar")).not.toBeNull();
    expect(calls).toBe(2);
  });
  test("form is never silently replaced by from, even with a high score", () => {
    expect(wordSuggestionService.shouldAutoPreferSuggestion("form", {
      word: "from", score: .999, editDistance: 1, reason: "edit-distance",
    })).toBe(false);
  });
  test("study includes both noun and verb meanings", async () => {
    const result = await localDictionaryService.lookupOffline("study");
    expect(result.partsOfSpeech.map((p) => p.type)).toEqual(["verb", "noun"]);
  });
});

describe("AI response integrity", () => {
  test("valid punctuation inside JSON strings survives unchanged", () => {
    const value = { translatedText: "Ký hiệu ,} và ,] phải được giữ nguyên.", alternativeTranslations: [] };
    expect(translationSchema.parse(parseModelJson(JSON.stringify(value)))).toEqual(value);
  });
  test("invalid content and scores are rejected, not stringified", () => {
    expect(() => translationSchema.parse({ translatedText: {} })).toThrow();
    expect(() => evaluationSchema.parse({ overallScore: 900 })).toThrow();
  });
  test("an outage never produces a made-up score for repeated bank", async () => {
    window.__TAURI_INTERNALS__ = { invoke: async () => { throw new Error("offline"); } };
    await expect(new NvidiaNIMProvider().evaluateSentence("bank", "bank bank bank bank bank")).rejects.toThrow("Chưa chấm");
  });
});

describe("durable study data", () => {
  test('old saved entries lose false sense links without losing content or user notes', () => {
    const old = structuredClone(DICTIONARY_CORRECTIONS.form);
    old.normalizedWord = 'legacyword';
    delete old.dataVersion;
    const upgraded = upgradeSavedEntry(old);
    expect(upgraded.partsOfSpeech[0].meanings[0].englishDefinition).toBe('');
    expect(upgraded.partsOfSpeech[0].unpairedEnglishDefinitions).toContain(old.partsOfSpeech[0].meanings[0].englishDefinition);
    expect(upgraded.usageExamples).toContainEqual(old.partsOfSpeech[0].meanings[0].examples[0]);
    expect(old.partsOfSpeech[0].meanings[0].englishDefinition).not.toBe('');
  });
  test('untranslated public definitions do not produce a placeholder quiz answer', () => {
    const entry = structuredClone(DICTIONARY_CORRECTIONS.form);
    for (const part of entry.partsOfSpeech) for (const meaning of part.meanings) meaning.vietnamese = '';
    expect(generateFlashcards(new StorageService().saveWord(entry))).toEqual([]);
  });
  test("failed saves roll back both new and existing words", () => {
    const service = new StorageService();
    const saved = service.saveWord(DICTIONARY_CORRECTIONS.bank, { notes: "keep" });
    const durable = memory.getItem("lexiglass_sqlite_words_v2");
    memory.fail = true;
    expect(() => service.saveWord(DICTIONARY_CORRECTIONS.form)).toThrow();
    expect(service.getWordByQuery("form")).toBeUndefined();
    expect(() => service.saveWord(DICTIONARY_CORRECTIONS.bank, { notes: "lost" })).toThrow();
    expect(service.getWordById(saved.id).notes).toBe("keep");
    expect(memory.getItem("lexiglass_sqlite_words_v2")).toBe(durable);
  });
  test("failed phrase saves and review writes leave no phantom state", () => {
    const service = new StorageService();
    const saved = service.saveWord(DICTIONARY_CORRECTIONS.bank);
    memory.fail = true;
    expect(() => service.savePhrase("Hello.", "Xin chào.")).toThrow();
    expect(service.getPhraseBySource("Hello.")).toBeUndefined();
    expect(() => service.recordReview(saved.id, "en_to_vi", "good", false)).toThrow();
    expect(service.getWordById(saved.id).history).toHaveLength(0);
  });
  test("corrupt stored data is preserved rather than replaced by demo data", () => {
    memory.setItem("lexiglass_sqlite_words_v2", "{broken");
    const service = new StorageService();
    expect(() => service.saveWord(DICTIONARY_CORRECTIONS.bank)).toThrow();
    expect(memory.getItem("lexiglass_sqlite_words_v2")).toBe("{broken");
  });
  test("cloze expects worked when worked was removed from the example", () => {
    const service = new StorageService();
    const entry = structuredClone(DICTIONARY_CORRECTIONS.work);
    entry.partsOfSpeech = [entry.partsOfSpeech[1]];
    const card = generateFlashcards(service.saveWord(entry)).find((c) => c.type === "cloze");
    expect(card.expectedAnswer).toBe("worked");
    expect(card.prompt).toBe("She ________ in a hospital.");
  });
  test("a new notebook has zero reviews and zero streak", () => {
    const stats = new StorageService().getDashboardStats();
    expect(stats.currentStreak).toBe(0);
    expect(stats.retentionRate).toBe(0);
    expect(stats.totalReviewedCount).toBe(0);
  });
});

test('late speech responses cannot play over a newer request', async () => {
  let finishOlder;
  let calls = 0;
  const played = [];
  window.atob = atob;
  window.__TAURI_INTERNALS__ = { invoke: async () => {
    if (++calls === 1) return new Promise((resolve) => { finishOlder = resolve; });
    return btoa('new audio');
  } };
  globalThis.Audio = class {
    constructor(url) { this.src = url; }
    addEventListener() {}
    pause() {}
    async play() { played.push(this.src); }
  };
  speechService.configure({ speechProvider: 'nvidia-magpie', speechVoice: 'test', speechRate: 1 });
  const older = speechService.speak('older');
  await speechService.speak('newer');
  finishOlder(btoa('old audio'));
  await older;
  expect(played).toHaveLength(1);
  speechService.cancel();
});
