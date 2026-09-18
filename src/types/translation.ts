export type QueryMode =
  | "dictionary"
  | "translation_phrase"
  | "translation_sentence"
  | "translation_paragraph";

export type TranslationSource = "local" | "cache" | "gemini" | "nvidia";

export interface TranslationChunk {
  source: string;
  target: string;
  explanation?: string;
}

export interface TranslationVocabulary {
  word: string;
  meaning: string;
  worthLearning: boolean;
}

export interface GrammarNote {
  title: string;
  explanation: string;
}

export interface ReverseSuggestion {
  word: string;
  meaning: string;
  score: number;
}

export interface FastTranslation {
  translatedText: string;
  alternativeTranslations: string[];
  source: TranslationSource;
  localStrategy?: "exact" | "composed";
  confidence?: number;
  latencyMs: number;
  isPartial?: boolean;
  segmentIndex?: number;
  segmentCount?: number;
}

export interface TranslationAnalysis {
  chunks: TranslationChunk[];
  keyVocabulary: TranslationVocabulary[];
  grammarNotes: GrammarNote[];
  naturalnessNote?: string | null;
  reverseSuggestions?: ReverseSuggestion[];
}

export interface TranslationResult extends FastTranslation, TranslationAnalysis {
  sourceText: string;
  sourceLanguage: "en";
  targetLanguage: "vi";
  analysisStatus: "none" | "pending" | "complete" | "failed";
}

export interface TranslationProviderStatus {
  configured: boolean;
  provider: string;
  model: string;
  storageType?: string;
}

export interface TranslationRequestOptions {
  sourceLanguage?: "en";
  targetLanguage?: "vi";
  timeoutMs?: number;
}
