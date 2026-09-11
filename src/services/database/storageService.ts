import { SavedWord, FSRSRating, CardType, StudyDashboardStats } from "../../types/study";
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
const STORAGE_KEY_SETTINGS = "lexiglass_sqlite_settings_v2";

class StorageService {
  private words: Map<string, SavedWord> = new Map();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY_WORDS);
      if (stored) {
        const parsed: SavedWord[] = JSON.parse(stored);
        parsed.forEach((w) => {
          // Ensure backward compatibility fields
          if (w.learningStage === undefined) w.learningStage = (w.mastery > 70 ? 4 : w.mastery > 40 ? 2 : 1);
          if (!w.personalizedWeakness) w.personalizedWeakness = createDefaultPersonalizedWeakness();
          if (!w.weaknesses) w.weaknesses = createDefaultWeaknessProfile();
          this.words.set(w.normalizedWord.toLowerCase(), w);
        });
      } else {
        // Seed with initial saved demo words for immediate interactive review experience
        this.seedInitialData();
      }
      this.isInitialized = true;
    } catch (e) {
      console.error("Failed to initialize storage:", e);
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    const demo1 = DEMO_DICTIONARY_ENTRIES["mitigate"];
    const demo2 = DEMO_DICTIONARY_ENTRIES["subtle"];
    const demo3 = DEMO_DICTIONARY_ENTRIES["comprehensive"];

    if (demo1) {
      const word1: SavedWord = {
        id: "demo-mitigate",
        word: demo1.query,
        normalizedWord: demo1.normalizedWord.toLowerCase(),
        dictionary: demo1,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        tags: ["Academic", "IELTS"],
        notes: "Thường dùng trong báo cáo đánh giá rủi ro (risk management).",
        learningStage: 3, // Cloze stage
        mastery: 65,
        favorite: true,
        isKnown: false,
        fsrs: {
          ...createDefaultFSRSCard(),
          reps: 3,
          stability: 3.5,
          difficulty: 3.0,
          state: 2, // review state
          due: new Date(Date.now() - 3600000).toISOString(), // Due right now
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
        id: "demo-subtle",
        word: demo2.query,
        normalizedWord: demo2.normalizedWord.toLowerCase(),
        dictionary: demo2,
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        lastReviewedAt: null,
        tags: ["Advanced", "Literature"],
        notes: "Chú ý âm 'b' câm, không phát âm /b/.",
        learningStage: 1, // Recognition stage
        mastery: 40,
        favorite: false,
        isKnown: false,
        fsrs: {
          ...createDefaultFSRSCard(),
          due: new Date().toISOString(), // Due today
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
        id: "demo-comprehensive",
        word: demo3.query,
        normalizedWord: demo3.normalizedWord.toLowerCase(),
        dictionary: demo3,
        createdAt: new Date().toISOString(),
        lastReviewedAt: null,
        tags: ["Business", "Academic"],
        notes: "Phân biệt với comprehensible (dễ hiểu).",
        learningStage: 0, // Introduction
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

    this.persist();
  }

  private persist() {
    try {
      const arr = Array.from(this.words.values());
      localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(arr));
    } catch (e) {
      console.error("Failed to persist to localStorage:", e);
    }
  }

  // --- CRUD Operations ---

  public getAllWords(): SavedWord[] {
    return Array.from(this.words.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getWordById(id: string): SavedWord | undefined {
    return Array.from(this.words.values()).find((w) => w.id === id);
  }

  public getWordByQuery(query: string): SavedWord | undefined {
    return this.words.get(query.trim().toLowerCase());
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
      this.persist();
      return existing;
    }

    const newWord: SavedWord = {
      id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      word: dictionary.query,
      normalizedWord: norm,
      dictionary,
      createdAt: new Date().toISOString(),
      lastReviewedAt: null,
      sourceContext: customData?.sourceContext,
      tags: customData?.tags || ["General"],
      notes: customData?.notes || "",
      learningStage: 0, // Starts at Stage 0 (Introduction)
      mastery: 15,
      favorite: false,
      isKnown: false,
      fsrs: createDefaultFSRSCard(),
      weaknesses: createDefaultWeaknessProfile(),
      personalizedWeakness: createDefaultPersonalizedWeakness(),
      history: [],
    };

    this.words.set(norm, newWord);
    this.persist();
    return newWord;
  }

  public updateWord(id: string, updates: Partial<SavedWord>): SavedWord | null {
    for (const [key, w] of this.words.entries()) {
      if (w.id === id) {
        const updated = { ...w, ...updates };
        this.words.set(key, updated);
        this.persist();
        return updated;
      }
    }
    return null;
  }

  public deleteWord(id: string): boolean {
    for (const [key, w] of this.words.entries()) {
      if (w.id === id) {
        this.words.delete(key);
        this.persist();
        return true;
      }
    }
    return false;
  }

  public toggleFavorite(id: string): boolean {
    for (const [key, w] of this.words.entries()) {
      if (w.id === id) {
        w.favorite = !w.favorite;
        this.persist();
        return w.favorite;
      }
    }
    return false;
  }

  public toggleKnown(id: string): boolean {
    for (const [key, w] of this.words.entries()) {
      if (w.id === id) {
        w.isKnown = !w.isKnown;
        if (w.isKnown) {
          w.mastery = 100;
          w.learningStage = 5;
        } else {
          w.learningStage = 1;
          w.mastery = computeMasteryScore(w.fsrs, w.learningStage, w.personalizedWeakness);
        }
        this.persist();
        return w.isKnown;
      }
    }
    return false;
  }

  public resetProgress(id: string): SavedWord | null {
    for (const [key, w] of this.words.entries()) {
      if (w.id === id) {
        w.fsrs = createDefaultFSRSCard();
        w.learningStage = 0;
        w.mastery = 0;
        w.isKnown = false;
        w.lastReviewedAt = null;
        w.weaknesses = createDefaultWeaknessProfile();
        w.personalizedWeakness = createDefaultPersonalizedWeakness();
        w.history = [];
        this.persist();
        return w;
      }
    }
    return null;
  }

  public recordReview(
    wordId: string,
    cardType: CardType,
    rating: FSRSRating,
    isMistake: boolean
  ): SavedWord | null {
    for (const [key, w] of this.words.entries()) {
      if (w.id === wordId) {
        const now = new Date();
        const { updatedCard, nextIntervalDays } = processFSRSReview(w.fsrs, rating, now);

        // Advance or adjust 5-stage vocabulary acquisition
        const nextStage = advanceLearningStage(w.learningStage ?? 0, rating);
        w.learningStage = nextStage;

        // Update weakness modeling
        const { updatedPersonalized, updatedErrors } = updateWeaknessProfile(
          w.personalizedWeakness,
          w.weaknesses,
          cardType,
          !isMistake && rating !== "again"
        );
        w.personalizedWeakness = updatedPersonalized;
        w.weaknesses = updatedErrors;

        w.fsrs = updatedCard;
        w.lastReviewedAt = now.toISOString();
        w.mastery = computeMasteryScore(updatedCard, w.learningStage, w.personalizedWeakness);

        w.history.push({
          id: `log_${Date.now()}`,
          wordId,
          cardType,
          rating,
          reviewedAt: now.toISOString(),
          intervalDays: nextIntervalDays,
        });

        this.persist();
        return w;
      }
    }
    return null;
  }

  // --- Statistics & Queues ---

  public getDashboardStats(): StudyDashboardStats {
    const all = Array.from(this.words.values());
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let dueToday = 0;
    let newToday = 0;
    let learned = 0;
    let totalLogs = 0;
    let successfulLogs = 0;

    all.forEach((w) => {
      // Due today
      if (new Date(w.fsrs.due).getTime() <= now.getTime() && !w.isKnown) {
        dueToday++;
      }

      // New words today
      const createdTime = new Date(w.createdAt).getTime();
      if (createdTime >= todayStart) {
        newToday++;
      }

      // Words learned (mastery >= 70 or marked known)
      if (w.mastery >= 70 || w.isKnown) {
        learned++;
      }

      // Retention calculation from review history
      w.history.forEach((h) => {
        totalLogs++;
        if (h.rating === "good" || h.rating === "easy") {
          successfulLogs++;
        }
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

  // --- Settings Persistence ---

  public getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
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
