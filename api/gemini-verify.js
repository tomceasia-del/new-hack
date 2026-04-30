/**
 * GET /api/gemini-verify — ตรวจว่า Gemini API key ตั้งบน Vercel แล้วและใช้งานได้
 */
const path = require('path');
const { resolveGeminiApiKeyFromEnv } = require(path.join(__dirname, '_lib', 'gemini-env-key.js'));

function applyGeminiApiCors(req, res) {
  const origin = req.headers && req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  applyGeminiApiCors(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (req.method === 'HEAD') {
    return res.status(204).end();
  }

  const key = resolveGeminiApiKeyFromEnv();
  if (!key) {
    return res.status(503).json({
      ok: false,
      error:
        'ยังไม่มี Gemini API key — ตั้ง GEMINI_API_KEY หรือ GOOGLE_AI_API_KEY / GOOGLE_API_KEY ใน Vercel Environment Variables'
    });
  }

  try {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=' +
      encodeURIComponent(key.trim());
    const r = await fetch(url);
    const body = await r.json().catch(() => ({}));
    if (!r.ok || (body.error && body.error.message)) {
      return res.status(502).json({
        ok: false,
        error: (body.error && body.error.message) || 'HTTP ' + r.status
      });
    }
    return res.status(200).json({ ok: true, mode: 'server' });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e && e.message ? e.message : String(e)
    });
  }
};
