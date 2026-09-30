// @ts-nocheck -- Executed by Bun.
import React from 'react';
import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { DictionaryPronunciation } from '../src/components/dictionary/DictionaryPronunciation';

test('both pronunciation controls survive missing or generic-only IPA', () => {
  for (const metadata of [
    { ipaUS: null, ipaUK: null },
    { ipa: '/bæŋk/', ipaUS: null, ipaUK: null },
    { ipaUS: '/bæŋk/', ipaUK: null },
    { ipaUS: '/bæŋk/', ipaUK: '/bæŋk/' },
  ]) {
    const markup = renderToStaticMarkup(<DictionaryPronunciation entry={{ query: 'bank', ...metadata }} />);
    expect(markup.match(/<button\b/g)).toHaveLength(2);
    expect(markup).toContain('aria-label="Phát âm Mỹ (US)"');
    expect(markup).toContain('aria-label="Phát âm Anh (UK)"');
    if (metadata.ipa) expect(markup.match(/\/bæŋk\//g)).toHaveLength(1);
  }
});
