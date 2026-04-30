/**
 * POST /api/gemini — เรียก Gemini ฝั่งเซิร์ฟเวอร์ (API key จาก env — ดู api/_lib/gemini-env-key.js)
 * Body: { systemPrompt?, userText, images? }
 */
const path = require('path');
const { resolveGeminiApiKeyFromEnv } = require(path.join(__dirname, '_lib', 'gemini-env-key.js'));

const GEMINI_MODEL_CHAIN = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-pro'
];

function applyGeminiApiCors(req, res) {
  const origin = req.headers && req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 12 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  applyGeminiApiCors(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = resolveGeminiApiKeyFromEnv();
  if (!key) {
    return res.status(503).json({
      error:
        'ยังไม่มี Gemini API key — ตั้ง GEMINI_API_KEY หรือ GOOGLE_AI_API_KEY / GOOGLE_API_KEY ใน Vercel Environment Variables'
    });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const systemPrompt = body.systemPrompt != null ? String(body.systemPrompt) : '';
  const userText = body.userText != null ? String(body.userText) : '';
  const images = Array.isArray(body.images) ? body.images : [];
  const clientGen = body.generationConfig && typeof body.generationConfig === 'object' ? body.generationConfig : {};

  if (!userText.trim()) {
    return res.status(400).json({ error: 'userText ว่าง' });
  }

  const parts = [];
  for (let ii = 0; ii < images.length; ii++) {
    const im = images[ii];
    if (im && im.data && im.mimeType) {
      parts.push({ inlineData: { mimeType: im.mimeType, data: im.data } });
    }
  }
  parts.push({ text: userText });
  const contents = [{ role: 'user', parts }];
  const requestBody = { contents };
  if (systemPrompt.trim()) {
    requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  let lastErr = null;
  for (let i = 0; i < GEMINI_MODEL_CHAIN.length; i++) {
    const model = GEMINI_MODEL_CHAIN[i];
    try {
      const b = JSON.parse(JSON.stringify(requestBody));
      if (!b.generationConfig) b.generationConfig = {};
      b.generationConfig.maxOutputTokens = 16384;
      b.generationConfig.temperature = 0.55;
      b.generationConfig.topP = 0.85;
      const allowed = ['temperature', 'maxOutputTokens', 'topP', 'topK'];
      for (const k of allowed) {
        if (Object.prototype.hasOwnProperty.call(clientGen, k) && clientGen[k] != null) {
          b.generationConfig[k] = clientGen[k];
        }
      }

      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/' +
        model +
        ':generateContent?key=' +
        encodeURIComponent(key.trim());

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });

      if (response.status === 429) {
        lastErr = new Error('429 rate limit');
        continue;
      }
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errMsg = (error.error && error.error.message) || 'HTTP ' + response.status;
        if (i < GEMINI_MODEL_CHAIN.length - 1 && response.status !== 401 && response.status !== 403) {
          lastErr = new Error(errMsg);
          continue;
        }
        return res.status(response.status >= 500 ? 502 : 400).json({ error: errMsg });
      }

      const data = await response.json();
      const blockReason =
        (data.promptFeedback && data.promptFeedback.blockReason) ||
        (data.candidates && data.candidates[0] && data.candidates[0].finishReason);
      if (
        blockReason === 'PROHIBITED_CONTENT' ||
        blockReason === 'SAFETY' ||
        blockReason === 'BLOCKLIST'
      ) {
        if (i < GEMINI_MODEL_CHAIN.length - 1) {
          lastErr = new Error(String(blockReason));
          continue;
        }
      }

      let text =
        data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text;

      if (!text) {
        const fr =
          (data.candidates && data.candidates[0] && data.candidates[0].finishReason) ||
          (data.promptFeedback && data.promptFeedback.blockReason) ||
          'unknown';
        return res.status(502).json({ error: 'Gemini ไม่ตอบกลับ (' + fr + ')' });
      }

      return res.status(200).json({
        text,
        model,
        truncated: data.candidates[0].finishReason === 'MAX_TOKENS'
      });
    } catch (e) {
      lastErr = e;
      if (i < GEMINI_MODEL_CHAIN.length - 1) continue;
      return res.status(502).json({
        error: e && e.message ? e.message : String(e)
      });
    }
  }

  return res.status(502).json({
    error: lastErr && lastErr.message ? lastErr.message : 'Gemini: all models failed'
  });
};
