import { DictionaryEntry, SentenceEvaluation } from "../../types/dictionary";

export interface AIStatus {
  configured: boolean;
  defaultModel: string;
  provider: string;
  proxy: string;
}

export interface AIProvider {
  lookupWord(word: string, model?: string): Promise<DictionaryEntry>;
  evaluateSentence(word: string, sentence: string, meaningContext?: string): Promise<SentenceEvaluation>;
  checkStatus(): Promise<AIStatus>;
}
