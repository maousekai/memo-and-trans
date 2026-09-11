import { useSyncExternalStore } from "react";
import { DictionaryEntry } from "../types/dictionary";
import { SavedWord, QueueType, GeneratedFlashcard, FSRSRating, StudyDashboardStats } from "../types/study";
import { WindowMode } from "../types/desktop";
import { AppSettings, NVIDIA_MODELS } from "../types/settings";
import { storageService } from "../services/database/storageService";
import { aiService } from "../services/ai/nvidiaProvider";
import { desktopBridge, BrowserDesktopBridge } from "../services/desktop/desktopBridge";
import { DEMO_DICTIONARY_ENTRIES } from "../data/demoEntries";
import { generateFlashcards, selectSmartCardType } from "../services/fsrs/fsrsEngine";
import { wordSuggestionService } from "../services/search/wordSuggestionService";

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
  queueType: QueueType;
  studyCards: GeneratedFlashcard[];
  activeCardIndex: number;
  isAnswerRevealed: boolean;
}

function normalizePersistedSettings(settings: AppSettings): AppSettings {
  // Migrate previews created before DeepSeek V4 became the default.
  if (!settings.defaultModel || settings.defaultModel.includes("nemotron")) {
    return { ...settings, defaultModel: NVIDIA_MODELS.FAST };
  }
  return settings;
}

const initialWord = DEMO_DICTIONARY_ENTRIES["mitigate"];
const initialSettings = normalizePersistedSettings(storageService.getSettings());

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

function notify() {
  listeners.forEach((listener) => listener());
}

function updateState(partial: Partial<AppState>) {
  state = { ...state, ...partial };
  notify();
}

// FSRS decides WHEN a word is due. The learning engine decides HOW to review it.
// Never fabricate a review queue when nothing is actually due/new/weak.
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
      // Persist one-time model migration so an old localStorage value cannot
      // silently switch the project back to Nemotron.
      storageService.saveSettings(state.settings);

      const status = await aiService.checkStatus();
      updateState({ aiStatus: status });

      desktopBridge.registerGlobalShortcut(state.settings.globalShortcut, () => {
        store.captureSelectedAndLookup();
      });

      store.setQueueType("due");
    } catch {
      // Continue with cached/demo state if desktop or API initialization fails.
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
      wordSuggestionService.recordSuccessfulSearch(entry.normalizedWord);
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
    const merged = { ...state.settings, ...newSettings };
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
