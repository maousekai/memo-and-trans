# Third-party dictionary data

LexiGlass bundles a generated subset of **10,000 frequent English headwords/phrases** from **thichhoc-dict** for instant offline English–Vietnamese lookup, plus bilingual usage examples from the Tatoeba English–Vietnamese corpus distributed by ManyThings.

## English–Vietnamese dictionary

- Project: https://github.com/thichhoc-org/thichhoc-dict
- Data license: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- Upstream sources documented by thichhoc-dict include WordNet 3.1 (Princeton), CMUdict (Carnegie Mellon University), and Wiktionary.
- LexiGlass modifies the upstream data by frequency filtering, deduplicating headwords, compacting senses, normalizing parts of speech, and generating an inflection alias index.

The bundled dictionary subset is distributed under CC BY-SA 4.0. LexiGlass application code retains its own repository license; the share-alike requirement applies to the derived dictionary data.

## English–Vietnamese example sentences

- Corpus: Tatoeba English–Vietnamese sentence pairs via ManyThings
- Source: https://www.manythings.org/bilingual/vie/
- Download used by the build: https://www.manythings.org/anki/vie-eng.zip
- License stated by ManyThings for the Tatoeba sentence data: Creative Commons Attribution 2.0 France (CC BY 2.0 FR)
- LexiGlass indexes the corpus locally and embeds at most two matching bilingual sentence pairs for a dictionary headword when suitable examples are available.

These examples are used as learning material and remain attributed to the Tatoeba/ManyThings corpus under its stated license.
