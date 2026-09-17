import type {
  FastTranslation,
  TranslationAnalysis,
  TranslationProviderStatus,
  TranslationRequestOptions,
} from "../../types/translation";

export interface TranslationProvider {
  readonly id: "gemini" | "nvidia";
  getStatus(): Promise<TranslationProviderStatus>;
  saveApiKey?(key: string): Promise<void>;
  translate(text: string, options?: TranslationRequestOptions): Promise<FastTranslation>;
  analyze(text: string, translation: string, options?: TranslationRequestOptions): Promise<TranslationAnalysis>;
}
