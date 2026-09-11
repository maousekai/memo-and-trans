import { useSyncExternalStore } from "react";
import { DictionaryEntry } from "../types/dictionary";
import { SavedWord, QueueType, GeneratedFlashcard, FSRSRating, CardType, StudyDashboardStats } from "../types/study";
import { WindowMode } from "../types/desktop";
import { AppSettings, DEFAULT_SETTINGS } from "../types/settings";
import { storageService } from "../services/database/storageService";
import { aiService } from "../services/ai/nvidiaProvider";
import { desktopBridge, BrowserDesktopBridge } from "../services/desktop/desktopBridge";
import { DEMO_DICTIONARY_ENTRIES } from "../data/demoEntries";
import { generateFlashcards, selectSmartCardType } from "../services/fsrs/fsrsEngine";

export type StudyTab = "notebook" | "flashcards" | "dashboard" | "settings";

interface AppState {
  windowMode: WindowMode;
  studyTab: StudyTab;
  isPinned: boolean;
  searchQuery: string;
  currentEntry: DictionaryEntry | null;
  isLoading: boolean;
  error: string | null;
  isDemoEntry: boolean;
  savedWords: SavedWord[];
  settings: AppSettings;
  aiStatus: {
    configured: boolean;
    provider: string;
    defaultModel: string;
  };
  // Study session
  queueType: QueueType;
  studyCards: GeneratedFlashcard[];
  activeCardIndex: number;
  isAnswerRevealed: boolean;
}

const initialWord = DEMO_DICTIONARY_ENTRIES["mitigate"];

let state: AppState = {
  windowMode: "lookup",
  studyTab: "notebook",
  isPinned: true,
  searchQuery: "mitigate",
  currentEntry: initialWord,
  isLoading: false,
  error: null,
  isDemoEntry: true,
  savedWords: storageService.getAllWords(),
  settings: storageService.getSettings(),
  aiStatus: {
    configured: false,
    provider: "NVIDIA NIM",
    defaultModel: "nvidia/nemotron-3.5-lightning-30b-a3b",
  },
  queueType: "due",
  studyCards: [],
  activeCardIndex: 0,
  isAnswerRevealed: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function updateState(partial: Partial<AppState>) {
  state = { ...state, ...partial };
  notify();
}

// Prepare review cards for current queue
function buildStudyQueue(type: QueueType, words: SavedWord[]): GeneratedFlashcard[] {
  const now = new Date();
  let candidateWords: SavedWord[] = [];

  if (type === "due") {
    candidateWords = words.filter(
      (w) => !w.isKnown && new Date(w.fsrs.due).getTime() <= now.getTime()
    );
    if (candidateWords.length === 0) {
      // If nothing overdue, pick words with lowest stability
      candidateWords = [...words]
        .filter((w) => !w.isKnown)
        .sort((a, b) => a.fsrs.stability - b.fsrs.stability)
        .slice(0, 10);
    }
  } else if (type === "new") {
    candidateWords = words.filter((w) => w.fsrs.reps === 0);
    if (candidateWords.length === 0) {
      candidateWords = words.slice(0, 5);
    }
  } else if (type === "weak") {
    candidateWords = words.filter(
      (w) =>
        w.fsrs.lapses > 0 ||
        w.weaknesses.meaningErrors > 0 ||
        w.weaknesses.spellingErrors > 0 ||
        w.mastery < 50
    );
    if (candidateWords.length === 0) {
      candidateWords = words.slice(0, 5);
    }
  }

  const generated: GeneratedFlashcard[] = [];
  candidateWords.forEach((word) => {
    const all = generateFlashcards(word);
    const preferredType = selectSmartCardType(word);
    const matched = all.find((c) => c.type === preferredType) || all[0];
    if (matched) generated.push(matched);
  });

  return generated.length > 0 ? generated : [];
}

export const store = {
  getState: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // Actions
  init: async () => {
    try {
      const status = await aiService.checkStatus();
      updateState({ aiStatus: status });

      // Register global shortcut on bridge
      desktopBridge.registerGlobalShortcut("Ctrl + Shift + D", () => {
        store.captureSelectedAndLookup();
      });

      // Prepare initial study queue
      store.setQueueType("due");
    } catch {
      // Continue with demo state
    }
  },

  setWindowMode: async (mode: WindowMode) => {
    updateState({ windowMode: mode });
    await desktopBridge.setWindowMode(mode);
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

  searchWord: async (rawWord: string, forceRefresh = false) => {
    const word = rawWord.trim();
    if (!word) return;

    updateState({ isLoading: true, error: null, searchQuery: word });

    try {
      const entry = await aiService.lookupWord(word, state.settings.defaultModel, forceRefresh);
      const isDemo = Boolean(DEMO_DICTIONARY_ENTRIES[entry.normalizedWord.toLowerCase()]);
      updateState({
        currentEntry: entry,
        isLoading: false,
        error: null,
        isDemoEntry: isDemo,
      });
    } catch (err: any) {
      updateState({
        isLoading: false,
        error: err.message || "Không thể tra cứu từ vựng.",
      });
    }
  },

  captureSelectedAndLookup: async () => {
    const captured = await desktopBridge.captureSelectedText();
    if (captured && captured.trim()) {
      if (state.windowMode === "bubble") {
        await store.setWindowMode("lookup");
      }
      await store.searchWord(captured.trim());
    } else {
      if (state.windowMode === "bubble") {
        await store.setWindowMode("lookup");
      }
    }
  },

  saveCurrentWord: (tags?: string[], notes?: string) => {
    if (!state.currentEntry) return;
    storageService.saveWord(state.currentEntry, { tags, notes });
    updateState({
      savedWords: storageService.getAllWords(),
    });
  },

  isCurrentWordSaved: (): boolean => {
    if (!state.currentEntry) return false;
    return Boolean(storageService.getWordByQuery(state.currentEntry.normalizedWord));
  },

  updateSavedWord: (id: string, updates: Partial<SavedWord>) => {
    storageService.updateWord(id, updates);
    updateState({
      savedWords: storageService.getAllWords(),
    });
  },

  deleteSavedWord: (id: string) => {
    storageService.deleteWord(id);
    updateState({
      savedWords: storageService.getAllWords(),
    });
    // refresh study queue if in progress
    store.setQueueType(state.queueType);
  },

  toggleFavorite: (id: string) => {
    storageService.toggleFavorite(id);
    updateState({
      savedWords: storageService.getAllWords(),
    });
  },

  toggleKnown: (id: string) => {
    storageService.toggleKnown(id);
    updateState({
      savedWords: storageService.getAllWords(),
    });
  },

  resetProgress: (id: string) => {
    storageService.resetProgress(id);
    updateState({
      savedWords: storageService.getAllWords(),
    });
  },

  updateSettings: (newSettings: Partial<AppSettings>) => {
    const merged = { ...state.settings, ...newSettings };
    storageService.saveSettings(merged);
    updateState({ settings: merged });
  },

  // Flashcards & Spaced repetition
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

    const nextIndex = state.activeCardIndex + 1;
    updateState({
      savedWords: storageService.getAllWords(),
      activeCardIndex: nextIndex,
      isAnswerRevealed: false,
    });
  },

  restartStudyQueue: () => {
    store.setQueueType(state.queueType);
  },

  getStats: (): StudyDashboardStats => {
    return storageService.getDashboardStats();
  },

  setSimulatedClipboard: (text: string) => {
    if (desktopBridge instanceof BrowserDesktopBridge) {
      desktopBridge.setSimulatedClipboardText(text);
    }
  },
};

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}
