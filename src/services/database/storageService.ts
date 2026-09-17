import { SavedWord, SavedPhrase, FSRSRating, CardType, StudyDashboardStats, LearningItem } from "../../types/study";
import { DictionaryEntry } from "../../types/dictionary";
import {
  createDefaultFSRSCard,
  createDefaultWeaknessProfile,
  createDefaultPersonalizedWeakness,
  processFSRSReview,
  advanceLearningStage,
  updateWeaknessProfile,
  computeMasteryScore,
} from "../fsrs/fsrsEngine";
import { DEMO_DICTIONARY_ENTRIES } from "../../data/demoEntries";
import { AppSettings, DEFAULT_SETTINGS } from "../../types/settings";

const STORAGE_KEY_WORDS = "lexiglass_sqlite_words_v2";
const STORAGE_KEY_PHRASES = "lexiglass_saved_phrases_v2";
const STORAGE_KEY_LEGACY_PHRASES = "lexiglass_saved_phrases_v1";
const STORAGE_KEY_SETTINGS = "lexiglass_sqlite_settings_v2";

class StorageService {
  private words: Map<string, SavedWord> = new Map();
  private phrases: Map<string, SavedPhrase> = new Map();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private normalizePhrase(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
  }

  private hydrateCommonFields<T extends SavedWord | SavedPhrase>(item: T): T {
    if (item.learningStage === undefined) item.learningStage = (item.mastery > 70 ? 4 : item.mastery > 40 ? 2 : 1);
    if (!item.personalizedWeakness) item.personalizedWeakness = createDefaultPersonalizedWeakness();
    if (!item.weaknesses) item.weaknesses = createDefaultWeaknessProfile();
    if (!item.fsrs) item.fsrs = createDefaultFSRSCard();
    if (!Array.isArray(item.history)) item.history = [];
    if (!Array.isArray(item.tags)) item.tags = [];
    if (typeof item.notes !== "string") item.notes = "";
    if (typeof item.mastery !== "number") item.mastery = 0;
    if (typeof item.favorite !== "boolean") item.favorite = false;
    if (typeof item.isKnown !== "boolean") item.isKnown = false;
    return item;
  }

  private init() {
    if (this.isInitialized) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY_WORDS);
      if (stored) {
        const parsed: SavedWord[] = JSON.parse(stored);
        parsed.forEach((raw) => {
          const w = this.hydrateCommonFields({ ...raw, kind: "word" as const });
          this.words.set(w.normalizedWord.toLowerCase(), w);
        });
      } else {
        this.seedInitialData();
      }

      const storedPhrases = localStorage.getItem(STORAGE_KEY_PHRASES);
      if (storedPhrases) {
        const parsed: SavedPhrase[] = JSON.parse(storedPhrases);
        parsed.forEach((raw) => {
          const normalizedSource = raw.normalizedSource || this.normalizePhrase(raw.sourceText || "");
          if (!normalizedSource) return;
          const phrase = this.hydrateCommonFields({
            ...raw,
            kind: "phrase" as const,
            normalizedSource,
            alternativeTranslations: Array.isArray(raw.alternativeTranslations) ? raw.alternativeTranslations : [],
          });
          this.phrases.set(normalizedSource, phrase);
        });
      } else {
        this.migrateLegacyPhrases();
      }

      this.isInitialized = true;
    } catch (e) {
      console.error("Failed to initialize storage:", e);
      if (this.words.size === 0) this.seedInitialData();
      this.migrateLegacyPhrases();
    }
  }

  private migrateLegacyPhrases() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LEGACY_PHRASES);
      if (!raw) return;
      const legacy = JSON.parse(raw);
      if (!Array.isArray(legacy)) return;
      legacy.forEach((item: any) => {
        const sourceText = String(item?.sourceText || "").trim();
        const translation = String(item?.translation || "").trim();
        if (!sourceText || !translation) return;
        const normalizedSource = this.normalizePhrase(sourceText);
        if (this.phrases.has(normalizedSource)) return;
        const phrase: SavedPhrase = {
          kind: "phrase",
          id: String(item?.id || `phrase_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
          sourceText,
          normalizedSource,
          translation,
          alternativeTranslations: Array.isArray(item?.alternatives) ? item.alternatives.map(String) : [],
          createdAt: item?.createdAt || new Date().toISOString(),
          lastReviewedAt: null,
          tags: ["Phrase"],
          notes: "",
          mastery: 10,
          favorite: false,
          isKnown: false,
          learningStage: 0,
          fsrs: createDefaultFSRSCard(),
          weaknesses: createDefaultWeaknessProfile(),
          personalizedWeakness: createDefaultPersonalizedWeakness(),
          history: [],
        };
        this.phrases.set(normalizedSource, phrase);
      });
      this.persistPhrases();
    } catch {
      // Legacy migration is best-effort only.
    }
  }

  private seedInitialData() {
    const demo1 = DEMO_DICTIONARY_ENTRIES["mitigate"];
    const demo2 = DEMO_DICTIONARY_ENTRIES["subtle"];
    const demo3 = DEMO_DICTIONARY_ENTRIES["comprehensive"];

    if (demo1) {
      const word1: SavedWord = {
        kind: "word",
        id: "demo-mitigate",
        word: demo1.query,
        normalizedWord: demo1.normalizedWord.toLowerCase(),
        dictionary: demo1,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        tags: ["Academic", "IELTS"],
        notes: "Thường dùng trong báo cáo đánh giá rủi ro (risk management).",
        learningStage: 3,
        mastery: 65,
        favorite: true,
        isKnown: false,
        fsrs: {
          ...createDefaultFSRSCard(),
          reps: 3,
          stability: 3.5,
          difficulty: 3.0,
          state: 2,
          due: new Date(Date.now() - 3600000).toISOString(),
        },
        weaknesses: {
          meaningErrors: 0,
          spellingErrors: 1,
          listeningErrors: 0,
          contextErrors: 0,
          productionErrors: 1,
        },
        personalizedWeakness: {
          meaningRecall: 0.9,
          spellingRecall: 0.7,
          listeningRecall: 0.85,
          contextRecall: 0.75,
          productionRecall: 0.6,
        },
        history: [
          {
            id: "log-1",
            wordId: "demo-mitigate",
            cardType: "cloze",
            rating: "good",
            reviewedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
            intervalDays: 1,
          },
        ],
      };
      this.words.set(word1.normalizedWord, word1);
    }

    if (demo2) {
      const word2: SavedWord = {
        kind: "word",
        id: "demo-subtle",
        word: demo2.query,
        normalizedWord: demo2.normalizedWord.toLowerCase(),
        dictionary: demo2,
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        lastReviewedAt: null,
        tags: ["Advanced", "Literature"],
        notes: "Chú ý âm 'b' câm, không phát âm /b/.",
        learningStage: 1,
        mastery: 40,
        favorite: false,
        isKnown: false,
        fsrs: {
          ...createDefaultFSRSCard(),
          due: new Date().toISOString(),
        },
        weaknesses: {
          meaningErrors: 0,
          spellingErrors: 0,
          listeningErrors: 1,
          contextErrors: 0,
          productionErrors: 0,
        },
        personalizedWeakness: {
          meaningRecall: 0.85,
          spellingRecall: 0.8,
          listeningRecall: 0.55,
          contextRecall: 0.8,
          productionRecall: 0.7,
        },
        history: [],
      };
      this.words.set(word2.normalizedWord, word2);
    }

    if (demo3) {
      const word3: SavedWord = {
        kind: "word",
        id: "demo-comprehensive",
        word: demo3.query,
        normalizedWord: demo3.normalizedWord.toLowerCase(),
        dictionary: demo3,
        createdAt: new Date().toISOString(),
        lastReviewedAt: null,
        tags: ["Business", "Academic"],
        notes: "Phân biệt với comprehensible (dễ hiểu).",
        learningStage: 0,
        mastery: 20,
        favorite: true,
        isKnown: false,
        fsrs: createDefaultFSRSCard(),
        weaknesses: createDefaultWeaknessProfile(),
        personalizedWeakness: createDefaultPersonalizedWeakness(),
        history: [],
      };
      this.words.set(word3.normalizedWord, word3);
    }

    this.persistWords();
  }

  private persistWords() {
    try {
      localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(Array.from(this.words.values())));
    } catch (e) {
      console.error("Failed to persist words:", e);
    }
  }

  private persistPhrases() {
    try {
      localStorage.setItem(STORAGE_KEY_PHRASES, JSON.stringify(Array.from(this.phrases.values())));
    } catch (e) {
      console.error("Failed to persist phrases:", e);
    }
  }

  public getAllWords(): SavedWord[] {
    return Array.from(this.words.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getAllPhrases(): SavedPhrase[] {
    return Array.from(this.phrases.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getAllLearningItems(): LearningItem[] {
    return [...this.getAllWords(), ...this.getAllPhrases()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getWordById(id: string): SavedWord | undefined {
    return Array.from(this.words.values()).find((w) => w.id === id);
  }

  public getPhraseById(id: string): SavedPhrase | undefined {
    return Array.from(this.phrases.values()).find((p) => p.id === id);
  }

  public getWordByQuery(query: string): SavedWord | undefined {
    return this.words.get(query.trim().toLowerCase());
  }

  public getPhraseBySource(sourceText: string): SavedPhrase | undefined {
    return this.phrases.get(this.normalizePhrase(sourceText));
  }

  public saveWord(
    dictionary: DictionaryEntry,
    customData?: { tags?: string[]; notes?: string; sourceContext?: string }
  ): SavedWord {
    const norm = dictionary.normalizedWord.toLowerCase();
    const existing = this.words.get(norm);

    if (existing) {
      existing.dictionary = dictionary;
      if (customData?.tags) existing.tags = Array.from(new Set([...existing.tags, ...customData.tags]));
      if (customData?.notes !== undefined) existing.notes = customData.notes;
      if (customData?.sourceContext) existing.sourceContext = customData.sourceContext;
      this.persistWords();
      return existing;
    }

    const newWord: SavedWord = {
      kind: "word",
      id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      word: dictionary.query,
      normalizedWord: norm,
      dictionary,
      createdAt: new Date().toISOString(),
      lastReviewedAt: null,
      sourceContext: customData?.sourceContext,
      tags: customData?.tags || ["General"],
      notes: customData?.notes || "",
      learningStage: 0,
      mastery: 15,
      favorite: false,
      isKnown: false,
      fsrs: createDefaultFSRSCard(),
      weaknesses: createDefaultWeaknessProfile(),
      personalizedWeakness: createDefaultPersonalizedWeakness(),
      history: [],
    };

    this.words.set(norm, newWord);
    this.persistWords();
    return newWord;
  }

  public savePhrase(
    sourceText: string,
    translation: string,
    alternativeTranslations: string[] = [],
    customData?: { tags?: string[]; notes?: string; sourceContext?: string }
  ): SavedPhrase {
    const normalizedSource = this.normalizePhrase(sourceText);
    const existing = this.phrases.get(normalizedSource);
    if (existing) {
      existing.translation = translation;
      existing.alternativeTranslations = alternativeTranslations;
      if (customData?.tags) existing.tags = Array.from(new Set([...existing.tags, ...customData.tags]));
      if (customData?.notes !== undefined) existing.notes = customData.notes;
      if (customData?.sourceContext) existing.sourceContext = customData.sourceContext;
      this.persistPhrases();
      return existing;
    }

    const phrase: SavedPhrase = {
      kind: "phrase",
      id: `phrase_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sourceText: sourceText.trim(),
      normalizedSource,
      translation: translation.trim(),
      alternativeTranslations: alternativeTranslations.filter(Boolean),
      createdAt: new Date().toISOString(),
      lastReviewedAt: null,
      sourceContext: customData?.sourceContext,
      tags: customData?.tags || ["Phrase"],
      notes: customData?.notes || "",
      mastery: 10,
      favorite: false,
      isKnown: false,
      learningStage: 0,
      fsrs: createDefaultFSRSCard(),
      weaknesses: createDefaultWeaknessProfile(),
      personalizedWeakness: createDefaultPersonalizedWeakness(),
      history: [],
    };
    this.phrases.set(normalizedSource, phrase);
    this.persistPhrases();
    return phrase;
  }

  public updateWord(id: string, updates: Partial<SavedWord>): SavedWord | null {
    for (const [key, w] of this.words.entries()) {
      if (w.id === id) {
        const updated = { ...w, ...updates };
        this.words.set(key, updated);
        this.persistWords();
        return updated;
      }
    }
    return null;
  }

  public updatePhrase(id: string, updates: Partial<SavedPhrase>): SavedPhrase | null {
    for (const [key, phrase] of this.phrases.entries()) {
      if (phrase.id === id) {
        const updated = { ...phrase, ...updates, kind: "phrase" as const };
        this.phrases.set(key, updated);
        this.persistPhrases();
        return updated;
      }
    }
    return null;
  }

  public deleteWord(id: string): boolean {
    for (const [key, w] of this.words.entries()) {
      if (w.id === id) {
        this.words.delete(key);
        this.persistWords();
        return true;
      }
    }
    return false;
  }

  public deletePhrase(id: string): boolean {
    for (const [key, phrase] of this.phrases.entries()) {
      if (phrase.id === id) {
        this.phrases.delete(key);
        this.persistPhrases();
        return true;
      }
    }
    return false;
  }

  public toggleFavorite(id: string): boolean {
    const word = this.getWordById(id);
    if (word) {
      word.favorite = !word.favorite;
      this.persistWords();
      return word.favorite;
    }
    const phrase = this.getPhraseById(id);
    if (phrase) {
      phrase.favorite = !phrase.favorite;
      this.persistPhrases();
      return phrase.favorite;
    }
    return false;
  }

  public toggleKnown(id: string): boolean {
    const item = this.getWordById(id) || this.getPhraseById(id);
    if (!item) return false;
    item.isKnown = !item.isKnown;
    if (item.isKnown) {
      item.mastery = 100;
      item.learningStage = 5;
    } else {
      item.learningStage = 1;
      item.mastery = computeMasteryScore(item.fsrs, item.learningStage, item.personalizedWeakness);
    }
    if (item.kind === "phrase") this.persistPhrases();
    else this.persistWords();
    return item.isKnown;
  }

  public resetProgress(id: string): LearningItem | null {
    const item = this.getWordById(id) || this.getPhraseById(id);
    if (!item) return null;
    item.fsrs = createDefaultFSRSCard();
    item.learningStage = 0;
    item.mastery = 0;
    item.isKnown = false;
    item.lastReviewedAt = null;
    item.weaknesses = createDefaultWeaknessProfile();
    item.personalizedWeakness = createDefaultPersonalizedWeakness();
    item.history = [];
    if (item.kind === "phrase") this.persistPhrases();
    else this.persistWords();
    return item;
  }

  private recordItemReview(
    item: LearningItem,
    cardType: CardType,
    rating: FSRSRating,
    isMistake: boolean
  ): LearningItem {
    const now = new Date();
    const { updatedCard, nextIntervalDays } = processFSRSReview(item.fsrs, rating, now);
    item.learningStage = advanceLearningStage(item.learningStage ?? 0, rating);

    const { updatedPersonalized, updatedErrors } = updateWeaknessProfile(
      item.personalizedWeakness,
      item.weaknesses,
      cardType,
      !isMistake && rating !== "again"
    );
    item.personalizedWeakness = updatedPersonalized;
    item.weaknesses = updatedErrors;
    item.fsrs = updatedCard;
    item.lastReviewedAt = now.toISOString();
    item.mastery = computeMasteryScore(updatedCard, item.learningStage, item.personalizedWeakness);
    item.history.push({
      id: `log_${Date.now()}`,
      wordId: item.id,
      cardType,
      rating,
      reviewedAt: now.toISOString(),
      intervalDays: nextIntervalDays,
    });
    return item;
  }

  public recordReview(
    wordId: string,
    cardType: CardType,
    rating: FSRSRating,
    isMistake: boolean
  ): SavedWord | null {
    const word = this.getWordById(wordId);
    if (!word) return null;
    this.recordItemReview(word, cardType, rating, isMistake);
    this.persistWords();
    return word;
  }

  public recordPhraseReview(
    phraseId: string,
    cardType: CardType,
    rating: FSRSRating,
    isMistake: boolean
  ): SavedPhrase | null {
    const phrase = this.getPhraseById(phraseId);
    if (!phrase) return null;
    this.recordItemReview(phrase, cardType, rating, isMistake);
    this.persistPhrases();
    return phrase;
  }

  public getDashboardStats(): StudyDashboardStats {
    const all = this.getAllLearningItems();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let dueToday = 0;
    let newToday = 0;
    let learned = 0;
    let totalLogs = 0;
    let successfulLogs = 0;

    all.forEach((item) => {
      if (new Date(item.fsrs.due).getTime() <= now.getTime() && !item.isKnown) dueToday++;
      if (new Date(item.createdAt).getTime() >= todayStart) newToday++;
      if (item.mastery >= 70 || item.isKnown) learned++;
      item.history.forEach((h) => {
        totalLogs++;
        if (h.rating === "good" || h.rating === "easy") successfulLogs++;
      });
    });

    const retentionRate = totalLogs > 0 ? Math.round((successfulLogs / totalLogs) * 100) : 94;
    return {
      wordsDueToday: dueToday,
      newWordsToday: newToday,
      wordsLearned: learned,
      retentionRate,
      currentStreak: 3,
      totalReviewedCount: totalLogs,
    };
  }

  public getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      // Ignore
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(settings: AppSettings) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }
}

export const storageService = new StorageService();
