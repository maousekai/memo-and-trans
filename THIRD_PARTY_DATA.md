# Third-party dictionary data

LexiGlass bundles the **full validated English–Vietnamese lexicon available from thichhoc-dict at build time**, rather than a small frequency-limited subset. CI refuses to build if fewer than 140,000 validated headwords/phrases are produced. Inflection aliases are bundled alongside the headwords so forms such as past tense, plurals, and irregular forms can resolve to their lemma offline.

Bilingual usage examples are supplemented from the Tatoeba English–Vietnamese corpus distributed by ManyThings.

## English–Vietnamese dictionary

- Project: https://github.com/thichhoc-org/thichhoc-dict
- Data license: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- Upstream sources documented by thichhoc-dict include WordNet 3.1 (Princeton), CMUdict (Carnegie Mellon University), and Wiktionary.
- LexiGlass modifies the upstream data by validating/deduplicating headwords, compacting senses, normalizing parts of speech, preserving inflection forms, and generating an offline lemma/inflection lookup index.
- LexiGlass also builds a runtime spelling index over the bundled headwords and inflection forms. This index is used for prefix completion and fuzzy spelling suggestions without sending the query to an AI model.

The derived dictionary data is distributed under CC BY-SA 4.0. LexiGlass application code retains its own repository license; the share-alike requirement applies to the derived dictionary data.

### Data-quality note

thichhoc-dict currently labels its English–Vietnamese dictionary as beta and documents that its Vietnamese senses have machine-generated coverage but have not yet been fully human-reviewed. LexiGlass therefore keeps the upstream English glosses alongside Vietnamese meanings where available and does not treat an LLM response as authoritative dictionary data.

Dictionary lookup in LexiGlass is deterministic:

1. exact bundled headword,
2. bundled inflection/lemma alias,
3. public dictionary source for an exact unknown form,
4. offline fuzzy spelling suggestions.

AI services are not part of the word-existence/spelling decision path.

## English–Vietnamese example sentences

- Corpus: Tatoeba English–Vietnamese sentence pairs via ManyThings
- Source: https://www.manythings.org/bilingual/vie/
- Download used by the build: https://www.manythings.org/anki/vie-eng.zip
- License stated by ManyThings for the Tatoeba sentence data: Creative Commons Attribution 2.0 France (CC BY 2.0 FR)
- LexiGlass indexes the corpus locally and embeds at most two matching bilingual sentence pairs for a dictionary headword when suitable examples are available.

These examples are used as learning material and remain attributed to the Tatoeba/ManyThings corpus under its stated license.
