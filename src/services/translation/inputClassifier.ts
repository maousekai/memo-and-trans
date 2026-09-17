import type { QueryMode } from "../../types/translation";
import { TOEIC_QUERY_ALIASES } from "../../data/toeicCoreEntries";
import { localDictionaryService } from "../dictionary/localDictionaryService";

function normalizeInput(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeSemanticAliasKey(value: string): string {
  return value.trim().toLowerCase().replace(/^[^a-z]+|[^a-z'-]+$/g, "").replace(/\s+/g, " ");
}

function lexicalTokens(value: string): string[] {
  return value.match(/[A-Za-z]+(?:['-][A-Za-z]+)*/g) || [];
}

function hasMultipleSentences(value: string): boolean {
  const terminalMatches = value.match(/[.!?]+(?:["')\]]+)?(?=\s|$)/g) || [];
  return terminalMatches.length >= 2 || /\n\s*\n/.test(value);
}

function hasSentenceTerminator(value: string): boolean {
  return /[.!?]+(?:["')\]]+)?\s*$/.test(value);
}

function looksLikeCompleteSentence(value: string, tokens: string[]): boolean {
  if (tokens.length < 3) return false;
  if (hasSentenceTerminator(value)) return true;

  // A comma, colon or semicolon alone never upgrades a short phrase to sentence mode.
  const lower = ` ${value.toLowerCase()} `;
  const finiteHints = [
    " is ", " are ", " was ", " were ", " am ", " be ", " been ", " being ",
    " has ", " have ", " had ", " do ", " does ", " did ", " can ", " could ",
    " will ", " would ", " should ", " may ", " might ", " must ", " need ",
  ];
  if (finiteHints.some((hint) => lower.includes(hint)) && tokens.length >= 5) return true;

  const pronounSubject = /^(i|you|we|they|he|she|it|this|that|these|those)\b/i.test(value);
  const verbish = /\b[a-z]+(?:ed|ing|s)\b/i.test(value);
  return pronounSubject && verbish && tokens.length >= 4;
}

export function classifyInput(rawInput: string): QueryMode {
  const input = normalizeInput(rawInput);
  if (!input) return "dictionary";

  const tokens = lexicalTokens(input);
  const semanticAlias = TOEIC_QUERY_ALIASES[normalizeSemanticAliasKey(input)];

  // Real dictionary headwords/inflections win, but semantic clue aliases such as
  // "profession or job" intentionally remain Translation Mode so the translation
  // is the primary answer and reverse-dictionary suggestions are secondary.
  if (!semanticAlias && localDictionaryService.lookupInstant(input.toLowerCase())) {
    return "dictionary";
  }

  if (tokens.length <= 1) return "dictionary";

  if (hasMultipleSentences(input) || input.includes("\n")) {
    return "translation_paragraph";
  }

  if (looksLikeCompleteSentence(input, tokens)) {
    return "translation_sentence";
  }

  return "translation_phrase";
}

export const inputClassifier = {
  classify: classifyInput,
};
