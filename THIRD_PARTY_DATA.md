# Third-party dictionary data

LexiGlass builds its offline dictionary from multiple open data sources instead of relying on an LLM for word existence or spelling.

## Primary English–Vietnamese dictionary

- Project: https://github.com/thichhoc-org/thichhoc-dict
- Data license: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- Upstream sources documented by thichhoc-dict include WordNet 3.1 (Princeton), CMUdict (Carnegie Mellon University), and Wiktionary.
- LexiGlass preserves all validated headwords that fit the supported dictionary character set, including normal dictionary punctuation such as digits, periods, slashes, plus signs and hyphens.
- Inflection forms are indexed separately so past tense, plurals and irregular forms can resolve to a lemma offline.

thichhoc-dict labels its English–Vietnamese dictionary as beta. Its Vietnamese meanings have broad machine-generated coverage but are not yet fully human-reviewed. LexiGlass therefore keeps English glosses alongside Vietnamese meanings when available.

## Supplemental Vietnamese Wiktionary data

LexiGlass also consumes the Vietnamese-language Wiktionary dump through the machine-readable Wiktextract/Kaikki export:

- Kaikki / Wiktextract raw data: https://kaikki.org/viwiktionary/rawdata.html
- Original source: Vietnamese Wiktionary
- LexiGlass only imports English-language entries from that dump.
- Imported fields can include Vietnamese glosses, inflected forms, IPA and bilingual examples when present.
- The Wiktionary/Kaikki data remains subject to the source project's applicable attribution and share-alike licensing terms.

This supplemental source is used to fill gaps in headword and example coverage rather than to overwrite a richer primary entry blindly.

## English–Vietnamese example sentences

LexiGlass embeds bilingual examples from two offline-capable sources:

1. Wiktionary examples that include both the English sentence and a Vietnamese translation.
2. Tatoeba English–Vietnamese sentence pairs distributed by ManyThings.

Tatoeba / ManyThings details:

- Source: https://www.manythings.org/bilingual/vie/
- Download used by the build: https://www.manythings.org/anki/vie-eng.zip
- License stated by ManyThings for the Tatoeba sentence data: Creative Commons Attribution 2.0 France (CC BY 2.0 FR)

The generator deduplicates examples and embeds at most two concise bilingual examples per headword. If an offline entry still has no example, the app may query the public Dictionary API in the background for a conventional English example sentence. This does not block the main dictionary result and does not use an LLM.

## Lookup architecture

Dictionary lookup is deterministic:

1. exact bundled headword,
2. bundled inflection/lemma alias,
3. public dictionary source for an exact unknown form,
4. offline fuzzy spelling suggestions.

AI services are not part of the word-existence or spelling-decision path.
