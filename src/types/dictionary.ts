export type Register = "neutral" | "formal" | "informal" | "academic" | "slang";

export type WordFrequency = "very-common" | "common" | "medium" | "uncommon";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface Example {
  english: string;
  vietnamese: string;
}

export interface Meaning {
  vietnamese: string;
  englishDefinition: string;
  register: Register | null;
  context: string | null;
  examples: Example[];
  collocations: string[];
}

export interface PartOfSpeech {
  type: string;
  forms: string[];
  meanings: Meaning[];
}

export interface WordFamilyItem {
  word: string;
  type: string;
  vietnameseMeaning: string;
}

export interface CommonMistake {
  incorrect: string;
  correct: string;
  explanationVietnamese: string;
}

export interface DictionaryEntry {
  query: string;
  normalizedWord: string;
  language: string;
  ipaUS: string | null;
  ipaUK: string | null;
  syllables: string | null;
  cefr: CEFRLevel | string | null;
  frequency: WordFrequency | null;
  partsOfSpeech: PartOfSpeech[];
  synonyms: string[];
  antonyms: string[];
  wordFamily: WordFamilyItem[];
  commonCollocations: string[];
  commonMistakes: CommonMistake[];
  mnemonic: string | null;
}

export interface SentenceEvaluation {
  overallScore: number;
  grammarScore: number;
  meaningScore: number;
  naturalnessScore: number;
  collocationScore: number;
  isAccurate: boolean;
  vietnameseFeedback: string;
  correctedSentence?: string | null;
  betterAlternatives: string[];
}
