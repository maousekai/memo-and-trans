import { Router } from 'express';
import { z } from 'zod';
import { parseModelJson, analysisSchema, translationSchema } from '../src/services/ai/responseValidation';
import { GEMINI_TRANSLATION_MODEL, translationPrompt, analysisPrompt } from '../src/services/translation/translationPrompts';

export const translationRouter = Router();
const inputSchema = z.object({
  text: z.string().trim().min(1).max(12000),
  mode: z.enum(['translate', 'analyze']).default('translate'),
  translation: z.string().max(16000).default(''),
  timeoutMs: z.number().int().min(500).max(15000).default(10000),
});

translationRouter.get('/status', (_req, res) => {
  res.json({ configured: Boolean(process.env.GEMINI_API_KEY?.trim()), provider: 'Google Gemini', model: GEMINI_TRANSLATION_MODEL });
});

translationRouter.post('/:provider', async (req, res) => {
  if (!['gemini', 'nvidia'].includes(req.params.provider)) { res.status(404).json({ error: 'Unknown provider' }); return; }
  const parsed = inputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Văn bản hoặc yêu cầu dịch không hợp lệ.' }); return; }
  const { text, mode, translation, timeoutMs } = parsed.data;
  const gemini = req.params.provider === 'gemini';
  const key = (gemini ? process.env.GEMINI_API_KEY : process.env.NVIDIA_API_KEY)?.trim();
  if (!key) { res.status(503).json({ error: 'Chưa cấu hình API key phía máy chủ.' }); return; }
  const prompt = mode === 'translate' ? translationPrompt(text) : analysisPrompt(text, translation);
  try {
    const response = await fetch(gemini
      ? `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TRANSLATION_MODEL}:generateContent`
      : 'https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
      headers: gemini ? { 'Content-Type': 'application/json', 'x-goog-api-key': key }
        : { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(gemini ? {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.05, maxOutputTokens: 4096, responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'minimal' } },
      } : {
        model: mode === 'translate' ? 'nvidia/riva-translate-4b-instruct-v2' : 'nvidia/nemotron-3.5-lightning-30b-a3b',
        messages: [{ role: 'system', content: mode === 'translate' ? 'en-vi' : 'Return only compact valid JSON.' }, { role: 'user', content: mode === 'translate' ? text : prompt }],
        temperature: 0, max_tokens: 4096, stream: false,
      }),
    });
    if (!response.ok) { res.status(502).json({ error: `Dịch vụ dịch trả lỗi HTTP ${response.status}. Hãy kiểm tra key hoặc thử lại.` }); return; }
    const payload = await response.json();
    let raw: string;
    if (gemini) {
      const candidate = payload?.candidates?.[0];
      if (candidate?.finishReason !== 'STOP') throw new Error('incomplete');
      raw = (candidate.content?.parts || []).filter((p: any) => !p.thought && typeof p.text === 'string').map((p: any) => p.text).join('');
    } else {
      const choice = payload?.choices?.[0];
      if (choice?.finish_reason !== 'stop' || typeof choice?.message?.content !== 'string') throw new Error('incomplete');
      raw = choice.message.content;
    }
    const data = !gemini && mode === 'translate' ? { translatedText: raw, alternativeTranslations: [] } : parseModelJson(raw);
    res.json(mode === 'translate' ? translationSchema.parse(data) : analysisSchema.parse(data));
  } catch {
    res.status(502).json({ error: 'Dịch vụ chưa trả được kết quả đầy đủ, hợp lệ. Hãy thử lại.' });
  }
});
