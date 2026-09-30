export const GEMINI_TRANSLATION_MODEL = "gemini-3.5-flash-lite";


export function translationPrompt(text: string): string {
  return `Translate the following English text into natural Vietnamese. Preserve tone and punctuation. Do not add information. Return ONLY compact JSON with this shape: {"translatedText":"string","alternativeTranslations":["string"]}. Give at most 2 alternatives and only when useful.\n\nTEXT:\n${text}`;
}

export function analysisPrompt(text: string, translation: string): string {
  return `Analyze this English text for a Vietnamese learner. Keep it concise and practical. Return ONLY compact JSON matching: {"chunks":[{"source":"string","target":"string","explanation":"string"}],"keyVocabulary":[{"word":"string","meaning":"string","worthLearning":true}],"grammarNotes":[{"title":"string","explanation":"string"}],"naturalnessNote":"string|null","reverseSuggestions":[{"word":"string","meaning":"string","score":0.0}]}. Use max 5 chunks, 5 vocabulary items, 3 grammar notes. Reverse suggestions are only for clue-like phrases such as definitions; otherwise return [].\n\nENGLISH:\n${text}\n\nVIETNAMESE:\n${translation}`;
}

