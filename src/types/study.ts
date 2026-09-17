import { DictionaryEntry } from "./dictionary";

export type CardType =
  | "en_to_vi"
  | "vi_to_en"
  | "cloze"
  | "listening"
  | "context_meaning"
  | "sentence_production";

export type FSRSRating = "again" | "hard" | "good" | "easy";

export type QueueType = "due" | "new" | "weak";

// 5-Stage Vocabulary Acquisition Pipeline
// 0: NEW (Introduction, pronunciation, meaning, first example)
// 1: RECOGNITION (Multiple choice meaning)
// 2: ACTIVE RECALL (Vietnamese -> Type English word/phrase)
// 3: CONTEXT (Cloze fill-in-the-blank with real example)
// 4: PRODUCTION (Sentence writing evaluated by AI for single words; mixed recall for phrases)
// 5: MATURE (Mixed retention check)
export type LearningStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface FSRSCardData {
  due: string; // ISO date string
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number; // 0: New, 1: Learning, 2: Review, 3: Relearning
  lastReview?: string;
}

export interface PersonalizedWeakness {
  meaningRecall: number; // 0.0 - 1.0 (1.0 = strong)
  spellingRecall: number;
  listeningRecall: number;
  contextRecall: number;
  productionRecall: number;
}

export interface WeaknessProfile {
  meaningErrors: number;
  spellingErrors: number;
  listeningErrors: number;
  contextErrors: number;
  productionErrors: number;
}

export interface ReviewLog {
  id: string;
  wordId: string; // Generic learning-item id kept for backward compatibility.
  cardType: CardType;
  rating: FSRSRating;
  reviewedAt: string;
  intervalDays: number;
  responseTimeMs?: number;
}

export interface SavedWord {
  kind?: "word";
  id: string;
  word: string;
  normalizedWord: string;
  dictionary: DictionaryEntry;
  createdAt: string;
  lastReviewedAt: string | null;
  sourceContext?: string;
  tags: string[];
  notes: string;
  mastery: number; // 0 - 100
  favorite: boolean;
  isKnown: boolean;
  learningStage: LearningStage;
  fsrs: FSRSCardData;
  weaknesses: WeaknessProfile;
  personalizedWeakness?: PersonalizedWeakness;
  history: ReviewLog[];
}

export interface SavedPhrase {
  kind: "phrase";
  id: string;
  sourceText: string;
  normalizedSource: string;
  translation: string;
  alternativeTranslations: string[];
  createdAt: string;
  lastReviewedAt: string | null;
  sourceContext?: string;
  tags: string[];
  notes: string;
  mastery: number;
  favorite: boolean;
  isKnown: boolean;
  learningStage: LearningStage;
  fsrs: FSRSCardData;
  weaknesses: WeaknessProfile;
  personalizedWeakness?: PersonalizedWeakness;
  history: ReviewLog[];
}

export type LearningItem = SavedWord | SavedPhrase;

export interface GeneratedFlashcard {
  id: string;
  wordId: string;
  word: string;
  itemKind?: "word" | "phrase";
  type: CardType;
  learningStage?: LearningStage;
  prompt: string;
  promptSecondary?: string;
  expectedAnswer: string;
  audioText?: string;
  contextSentence?: string;
  options?: string[]; // For multiple choice
  collocationsHint?: string[];
  vietnameseMeaning: string;
}

export interface StudyDashboardStats {
  wordsDueToday: number;
  newWordsToday: number;
  wordsLearned: number;
  retentionRate: number; // percentage e.g. 92
  currentStreak: number; // days
  totalReviewedCount: number;
}
