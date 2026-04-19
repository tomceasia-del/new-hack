/**
 * GET /api/gemini-verify — ตรวจว่า GEMINI_API_KEY ตั้งบน Vercel แล้วและใช้งานได้
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (req.method === 'HEAD') {
    return res.status(204).end();
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key || !String(key).trim()) {
    return res.status(503).json({
      ok: false,
      error: 'GEMINI_API_KEY ยังไม่ได้ตั้งใน Vercel Environment Variables'
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
