import type { DictionaryEntry } from '../../types/dictionary';
import { DICTIONARY_CORRECTIONS } from '../../data/dictionaryCorrections';
import { DEMO_DICTIONARY_ENTRIES } from '../../data/demoEntries';
import { TOEIC_CORE_ENTRIES } from '../../data/toeicCoreEntries';

// Old saved entries used positional English/Vietnamese pairing. Preserve their
// content, but do not present unverified pairs or use their examples in quizzes.
export function upgradeSavedEntry(entry: DictionaryEntry): DictionaryEntry {
  const word = entry.normalizedWord.toLowerCase();
  const curated = DICTIONARY_CORRECTIONS[word] || TOEIC_CORE_ENTRIES[word] || DEMO_DICTIONARY_ENTRIES[word];
  if (curated) return { ...curated, dataVersion: 2, provenance: 'curated' };
  if (entry.dataVersion === 2) return entry;
  return {
    ...entry, dataVersion: 2, provenance: 'imported',
    usageExamples: [...(entry.usageExamples || []), ...entry.partsOfSpeech.flatMap((part) => part.meanings.flatMap((m) => m.examples || []))],
    partsOfSpeech: entry.partsOfSpeech.map((part) => ({
      ...part,
      unpairedEnglishDefinitions: [...new Set([...(part.unpairedEnglishDefinitions || []), ...part.meanings.map((m) => m.englishDefinition).filter(Boolean)])],
      meanings: part.meanings.map((m) => ({ ...m, englishDefinition: '', examples: [] })),
    })),
  };
}
