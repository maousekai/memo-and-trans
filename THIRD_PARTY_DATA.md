# Third-party dictionary data

LexiGlass bundles a generated subset of 5,000 frequent English headwords from **thichhoc-dict** for instant offline English–Vietnamese lookup.

- Project: https://github.com/thichhoc-org/thichhoc-dict
- Data license: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- Upstream sources documented by thichhoc-dict include WordNet 3.1 (Princeton), CMUdict (Carnegie Mellon University), and Wiktionary.
- LexiGlass modifies the upstream data by frequency filtering, deduplicating headwords, compacting senses, normalizing parts of speech, and generating an inflection alias index.

The bundled dictionary subset is therefore distributed under CC BY-SA 4.0. LexiGlass application code retains its own repository license; the share-alike requirement applies to the derived dictionary data.
