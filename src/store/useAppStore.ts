import { useSyncExternalStore } from "react";
import { DictionaryEntry } from "../types/dictionary";
import { SavedWord, QueueType, GeneratedFlashcard, FSRSRating, StudyDashboardStats } from "../types/study";
import { WindowMode } from "../types/desktop";
import { AppSettings, DEFAULT_SETTINGS, NVIDIA_MODELS } from "../types/settings";
import { storageService } from "../services/database/storageService";
import { aiService } from "../services/ai/nvidiaProvider";
import { desktopBridge, BrowserDesktopBridge } from "../services/desktop/desktopBridge";
import { DEMO_DICTIONARY_ENTRIES } from "../data/demoEntries";
import { generateFlashcards, selectSmartCardType } from "../services/fsrs/fsrsEngine";
import { wordSuggestionService } from "../services/search/wordSuggestionService";
import { localDictionaryService } from "../services/dictionary/localDictionaryService";

export type StudyTab = "notebook" | "flashcards" | "dashboard" | "settings";
export type LookupSource = "cache" | "saved" | "local" | "public" | "ai" | "demo" | null;
type ExpandedWindowMode = Exclude<WindowMode, "bubble">;

interface AppState {
  windowMode: WindowMode;
  lastExpandedMode: ExpandedWindowMode;
  studyTab: StudyTab;
  isPinned: boolean;
  searchQuery: string;
  currentEntry: DictionaryEntry | null;
  isLoading: boolean;
  isEnriching: boolean;
  lookupSource: LookupSource;
  error: string | null;
  isDemoEntry: boolean;
  savedWords: SavedWord[];
  settings: AppSettings;
  aiStatus: {
    configured: boolean;
    provider: string;
    defaultModel: string;
  };
  queueType: QueueType;
  studyCards: GeneratedFlashcard[];
  activeCardIndex: number;
  isAnswerRevealed: boolean;
}

function normalizePersistedSettings(settings: AppSettings): AppSettings {
  const merged: AppSettings = { ...DEFAULT_SETTINGS, ...settings };
  if (!merged.defaultModel || merged.defaultModel.includes("nemotron")) {
    merged.defaultModel = NVIDIA_MODELS.FAST;
  }
  return merged;
}

function normalizeLookupWord(value: string): string {
  return value.trim().toLowerCase();
}

function readAiCache(word: string): DictionaryEntry | null {
  try {
    const raw = localStorage.getItem(`lexiglass_dict_cache_${normalizeLookupWord(word)}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DictionaryEntry;
    return parsed?.partsOfSpeech?.length ? parsed : null;
  } catch {
    return null;
  }
}

function withDeadline<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`AI enrichment exceeded ${timeoutMs}ms budget`)), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const initialWord = DEMO_DICTIONARY_ENTRIES["mitigate"];
const initialSettings = normalizePersistedSettings(storageService.getSettings());

let state: AppState = {
  windowMode: "lookup",
  lastExpandedMode: "lookup",
  studyTab: "notebook",
  isPinned: true,
  searchQuery: "mitigate",
  currentEntry: initialWord,
  isLoading: false,
  isEnriching: false,
  lookupSource: "demo",
  error: null,
  isDemoEntry: true,
  savedWords: storageService.getAllWords(),
  settings: initialSettings,
  aiStatus: {
    configured: false,
    provider: "NVIDIA NIM",
    defaultModel: NVIDIA_MODELS.FAST,
  },
  queueType: "due",
  studyCards: [],
  activeCardIndex: 0,
  isAnswerRevealed: false,
};

const listeners = new Set<() => void>();
let searchGeneration = 0;

function notify() {
  listeners.forEach((listener) => listener());
}

function updateState(partial: Partial<AppState>) {
  state = { ...state, ...partial };
  notify();
}

function buildStudyQueue(type: QueueType, words: SavedWord[]): GeneratedFlashcard[] {
  const now = new Date();
  let candidateWords: SavedWord[] = [];

  if (type === "due") {
    candidateWords = words
      .filter((word) => !word.isKnown && new Date(word.fsrs.due).getTime() <= now.getTime())
      .sort((a, b) => new Date(a.fsrs.due).getTime() - new Date(b.fsrs.due).getTime());
  } else if (type === "new") {
    candidateWords = words
      .filter((word) => !word.isKnown && word.fsrs.reps === 0)
      .slice(0, state.settings.dailyNewWordTarget);
  } else if (type === "weak") {
    candidateWords = words
      .filter(
        (word) =>
          !word.isKnown &&
          (word.fsrs.lapses > 0 ||
            word.weaknesses.meaningErrors > 0 ||
            word.weaknesses.spellingErrors > 0 ||
            word.weaknesses.listeningErrors > 0 ||
            word.weaknesses.contextErrors > 0 ||
            word.weaknesses.productionErrors > 0 ||
            word.mastery < 50),
      )
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 10);
  }

  const generated: GeneratedFlashcard[] = [];
  candidateWords.forEach((word) => {
    const allCards = generateFlashcards(word);
    const preferredType = selectSmartCardType(word);
    const selected = allCards.find((card) => card.type === preferredType) || allCards[0];
    if (selected) generated.push(selected);
  });

  return generated;
}

export const store = {
  getState: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  init: async () => {
    try {
      storageService.saveSettings(state.settings);

      const status = await aiService.checkStatus();
      updateState({ aiStatus: status });

      desktopBridge.registerGlobalShortcut(state.settings.globalShortcut, () => {
        store.captureSelectedAndLookup();
      });

      store.setQueueType("due");

      if (state.settings.launchMinimized) {
        await store.setWindowMode("bubble");
      }
    } catch {
      // Continue with cached/demo state if desktop or API initialization fails.
    }
  },

  setWindowMode: async (mode: WindowMode) => {
    if (mode === "bubble") {
      updateState({ windowMode: mode });
    } else {
      updateState({ windowMode: mode, lastExpandedMode: mode });
    }
    await desktopBridge.setWindowMode(mode);
  },

  restoreExpandedWindow: async () => {
    await store.setWindowMode(state.lastExpandedMode || "lookup");
  },

  setStudyTab: (tab: StudyTab) => {
    updateState({ studyTab: tab });
  },

  togglePin: async () => {
    const next = !state.isPinned;
    updateState({ isPinned: next });
    await desktopBridge.setAlwaysOnTop(next);
  },

  setSearchQuery: (query: string) => {
    updateState({ searchQuery: query });
  },

  prefetchWord: (rawWord: string) => {
    const word = normalizeLookupWord(rawWord);
    if (word.length < 3 || word.includes(" ")) return;
    if (readAiCache(word) || localDictionaryService.lookupInstant(word)) return;
    localDictionaryService.prefetch(word);
  },

  searchWord: async (rawWord: string, forceRefresh = false) => {
    const word = rawWord.trim();
    if (!word) return;

    const generation = ++searchGeneration;
    const normalized = normalizeLookupWord(word);
    const startedAt = performance.now();

    const saved = state.savedWords.find(
      (item) => (item.normalizedWord || item.word).toLowerCase() === normalized,
    );
    const cached = forceRefresh ? null : readAiCache(normalized);
    const local = forceRefresh ? null : localDictionaryService.lookupInstant(normalized);
    const instantEntry = cached || saved?.dictionary || local;
    const instantSource: LookupSource = cached
      ? "cache"
      : saved?.dictionary
        ? "saved"
        : local
          ? (DEMO_DICTIONARY_ENTRIES[normalized] ? "demo" : "local")
          : null;

    updateState({
      isLoading: !instantEntry,
      isEnriching: Boolean(instantEntry && state.aiStatus.configured),
      error: null,
      searchQuery: word,
      currentEntry: instantEntry || state.currentEntry,
      lookupSource: instantSource,
      isDemoEntry: instantSource === "demo",
    });

    if (instantEntry) {
      wordSuggestionService.recordSuccessfulSearch(instantEntry.normalizedWord);
    }

    // Start non-NVIDIA dictionary and AI in parallel. The public dictionary is
    // intentionally given a very small latency budget so the UI never waits on it.
    const publicPromise = instantEntry
      ? Promise.resolve<DictionaryEntry | null>(null)
      : localDictionaryService.lookupPublic(normalized, 1400);

    const aiPromise = state.aiStatus.configured
      ? withDeadline(
          aiService.lookupWord(normalized, state.settings.defaultModel, true),
          4700,
        )
      : null;

    let fastEntry = instantEntry;

    if (!fastEntry) {
      const publicEntry = await publicPromise;
      if (generation !== searchGeneration) return;

      if (publicEntry) {
        fastEntry = publicEntry;
        wordSuggestionService.recordSuccessfulSearch(publicEntry.normalizedWord);
        updateState({
          currentEntry: publicEntry,
          isLoading: false,
          isEnriching: Boolean(aiPromise),
          error: null,
          lookupSource: "public",
          isDemoEntry: false,
        });
      }
    }

    if (aiPromise) {
      try {
        const aiEntry = await aiPromise;
        if (generation !== searchGeneration) return;
        const merged = localDictionaryService.mergeFastAndAi(fastEntry, aiEntry);
        wordSuggestionService.recordSuccessfulSearch(merged.normalizedWord);
        updateState({
          currentEntry: merged,
          isLoading: false,
          isEnriching: false,
          error: null,
          lookupSource: "ai",
          isDemoEntry: false,
        });
        return;
      } catch (error) {
        if (generation !== searchGeneration) return;
        if (fastEntry) {
          // A useful result already exists. AI is enrichment, so its failure must
          // never replace a valid local/public answer with a red error screen.
          updateState({ isLoading: false, isEnriching: false, error: null });
          return;
        }

        const message = String((error as any)?.message || error || "AI không phản hồi trong giới hạn 5 giây.");
        updateState({
          isLoading: false,
          isEnriching: false,
          error: `Không có dữ liệu nhanh cho “${word}”. ${message}`,
          lookupSource: null,
        });
        return;
      }
    }

    if (generation !== searchGeneration) return;
    if (fastEntry) {
      updateState({ isLoading: false, isEnriching: false, error: null });
      return;
    }

    const elapsed = Math.round(performance.now() - startedAt);
    updateState({
      isLoading: false,
      isEnriching: false,
      error: `Không tìm thấy “${word}” trong dữ liệu local/public (${elapsed} ms). Hãy kiểm tra chính tả hoặc kết nối NVIDIA API để bổ sung nghĩa nâng cao.`,
      lookupSource: null,
    });
  },

  captureSelectedAndLookup: async () => {
    const captured = await desktopBridge.captureSelectedText();
    if (captured && captured.trim()) {
      if (state.windowMode === "bubble") await store.setWindowMode("lookup");
      await store.searchWord(captured.trim());
    } else if (state.windowMode === "bubble") {
      await store.setWindowMode("lookup");
    }
  },

  saveCurrentWord: (tags?: string[], notes?: string) => {
    if (!state.currentEntry) return;
    storageService.saveWord(state.currentEntry, { tags, notes });
    updateState({ savedWords: storageService.getAllWords() });
  },

  isCurrentWordSaved: (): boolean => {
    if (!state.currentEntry) return false;
    return Boolean(storageService.getWordByQuery(state.currentEntry.normalizedWord));
  },

  updateSavedWord: (id: string, updates: Partial<SavedWord>) => {
    storageService.updateWord(id, updates);
    updateState({ savedWords: storageService.getAllWords() });
  },

  deleteSavedWord: (id: string) => {
    storageService.deleteWord(id);
    updateState({ savedWords: storageService.getAllWords() });
    store.setQueueType(state.queueType);
  },

  toggleFavorite: (id: string) => {
    storageService.toggleFavorite(id);
    updateState({ savedWords: storageService.getAllWords() });
  },

  toggleKnown: (id: string) => {
    storageService.toggleKnown(id);
    updateState({ savedWords: storageService.getAllWords() });
  },

  resetProgress: (id: string) => {
    storageService.resetProgress(id);
    updateState({ savedWords: storageService.getAllWords() });
  },

  updateSettings: (newSettings: Partial<AppSettings>) => {
    const merged = normalizePersistedSettings({ ...state.settings, ...newSettings });
    storageService.saveSettings(merged);
    updateState({ settings: merged });
  },

  setQueueType: (type: QueueType) => {
    const cards = buildStudyQueue(type, state.savedWords);
    updateState({
      queueType: type,
      studyCards: cards,
      activeCardIndex: 0,
      isAnswerRevealed: false,
    });
  },

  revealAnswer: () => {
    updateState({ isAnswerRevealed: true });
  },

  submitCardRating: (rating: FSRSRating) => {
    const currentCard = state.studyCards[state.activeCardIndex];
    if (!currentCard) return;

    const isMistake = rating === "again" || rating === "hard";
    storageService.recordReview(currentCard.wordId, currentCard.type, rating, isMistake);

    updateState({
      savedWords: storageService.getAllWords(),
      activeCardIndex: state.activeCardIndex + 1,
      isAnswerRevealed: false,
    });
  },

  restartStudyQueue: () => {
    store.setQueueType(state.queueType);
  },

  getStats: (): StudyDashboardStats => storageService.getDashboardStats(),

  setSimulatedClipboard: (text: string) => {
    if (desktopBridge instanceof BrowserDesktopBridge) {
      desktopBridge.setSimulatedClipboardText(text);
    }
  },
};

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}
