// @ts-nocheck -- Bun test runner.
import { beforeAll, afterAll, afterEach, test, expect } from 'bun:test';
import express from 'express';
import { translationRouter } from '../server/translationRoutes';
const originalFetch = globalThis.fetch;
const originalKey = process.env.GEMINI_API_KEY;
let server, base;
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/translation', translationRouter);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api/translation`;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalKey;
});
afterAll(() => new Promise(resolve => server.close(resolve)));
test('status and missing-key errors are JSON API responses', async () => {
  delete process.env.GEMINI_API_KEY;
  const status = await originalFetch(base + '/status');
  expect(status.headers.get('content-type')).toContain('application/json');
  expect((await status.json()).configured).toBe(false);
  const response = await originalFetch(base + '/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Hello.' }) });
  expect(response.status).toBe(503);
  expect((await response.json()).error).toContain('API key');
});
test('truncated Gemini answers are rejected instead of cached', async () => {
  process.env.GEMINI_API_KEY = 'test-only';
  globalThis.fetch = async () => Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"translatedText":"partial"}' }] } }] });
  const response = await originalFetch(base + '/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Hello.' }) });
  expect(response.status).toBe(502);
});
test('complete multipart answers preserve punctuation inside JSON', async () => {
  process.env.GEMINI_API_KEY = 'test-only';
  globalThis.fetch = async () => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ thought: true, text: 'ignored reasoning' }, { text: '{"translatedText":' }, { text: '"Giữ ,} nguyên.","alternativeTranslations":[]}' }] } }] });
  const response = await originalFetch(base + '/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Keep it.' }) });
  expect(response.status).toBe(200);
  expect((await response.json()).translatedText).toBe('Giữ ,} nguyên.');
});
