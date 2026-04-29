/**
 * POST /api/tiktok-share-fetch — resolve a TikTok Shop share link via redirect chain,
 * extract og_info metadata, and fetch the cover image from CDN.
 *
 * Body:   { "url": "https://vt.tiktok.com/..." }
 * Response (ok):
 *   { ok: true, data: { product_id, title, cover_image_url, canonical_product_url,
 *                        share_region, seller_user_id, seller_unique_id, source_url,
 *                        cover_base64, cover_mime } }
 * Response (error):
 *   { ok: false, error: string, stage?: string }
 *
 * Robustness goals (เพื่อกัน Vercel โชว์ "An error occurred…" HTML page):
 *   - ทุก code path คืน JSON เสมอ (no throw out of handler)
 *   - ทุก network call มี per-request timeout ผ่าน AbortController
 *   - HEAD blocked / 405 → fallback เป็น GET (manual redirect)
 *   - Body ใช้ req.body ที่ Vercel parse แล้วถ้ามี (กัน parser hang)
 *
 * Does NOT require GEMINI_API_KEY.
 */

const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const PER_REQUEST_TIMEOUT_MS = 8000;
const MAX_HOPS = 10;
const MAX_COVER_BYTES = 4 * 1024 * 1024;

/** Strip pasted garbage (error messages) and keep first https URL whose host is *.tiktok.com */
function normalizeAndValidateTikTokUrl(input) {
  let s = String(input || '').trim();
  const extracted = s.match(/https?:\/\/[^\s"'<>]+/gi);
  if (extracted) {
    for (const cand of extracted) {
      try {
        const u = new URL(cand);
        if (u.hostname.toLowerCase().endsWith('tiktok.com')) {
          return u.href;
        }
      } catch {
        /* continue */
      }
    }
  }
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u;
  try {
    u = new URL(s);
  } catch {
    throw new Error(
      'รูปแบบลิงก์ไม่ถูกต้อง — วางลิงก์ TikTok เท่านั้น (เช่น https://vt.tiktok.com/...)',
    );
  }
  if (!u.hostname.toLowerCase().endsWith('tiktok.com')) {
    throw new Error(
      'โดเมนต้องเป็น TikTok เท่านั้น (vt.tiktok.com หรือ www.tiktok.com/view/product/...)',
    );
  }
  return u.href;
}

// ─── CORS ──────────────────────────────────────────────────────────────────

function applyCors(req, res) {
  const origin = req.headers && req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ─── Body parser (รองรับทั้ง Vercel auto-parsed body และ raw stream) ─────────

async function readJsonBody(req) {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch { /* fall through to stream */ }
    }
  }
  return await new Promise((resolve, reject) => {
    let raw = '';
    let timedOut = false;
    const t = setTimeout(() => {
      timedOut = true;
      reject(new Error('อ่าน body จาก request ช้าเกินไป'));
    }, 5000);
    req.on('data', (chunk) => {
      if (timedOut) return;
      raw += chunk;
      if (raw.length > 1 * 1024 * 1024) {
        clearTimeout(t);
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (timedOut) return;
      clearTimeout(t);
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on('error', (err) => {
      if (timedOut) return;
      clearTimeout(t);
      reject(err);
    });
  });
}

// ─── fetch helpers (timeout per request) ──────────────────────────────────

function fetchWithTimeout(url, init, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs || PER_REQUEST_TIMEOUT_MS);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

// ─── Redirect chain (HEAD → GET fallback) ─────────────────────────────────

async function resolveShareChain(startUrl) {
  let current = startUrl.trim();
  if (!current.startsWith('http')) current = 'https://' + current;
  let useGetFallback = false;

  for (let i = 0; i < MAX_HOPS; i++) {
    let res;
    const method = useGetFallback ? 'GET' : 'HEAD';
    try {
      res = await fetchWithTimeout(current, {
        method,
        redirect: 'manual',
        headers: { 'User-Agent': DEFAULT_UA, Accept: '*/*' },
      });
    } catch (e) {
      const reason = e && e.name === 'AbortError' ? 'timeout' : (e && e.message) || 'unknown';
      if (!useGetFallback) {
        useGetFallback = true;
        i--;
        continue;
      }
      throw new Error(`${method} ${current} failed: ${reason}`);
    }

    if (res.status === 405 && !useGetFallback) {
      useGetFallback = true;
      i--;
      continue;
    }

    const loc = res.headers.get('location');
    if ([301, 302, 303, 307, 308].includes(res.status) && loc) {
      try {
        current = new URL(loc, current).href;
      } catch {
        return current;
      }
      if (!useGetFallback && /\/(?:view\/)?product\/\d+/.test(current)) {
        return current;
      }
      continue;
    }
    return current;
  }
  return current;
}

// ─── Parse product URL query params (og_info) ─────────────────────────────

function parseProductUrl(productUrl) {
  let parsed;
  try { parsed = new URL(productUrl); } catch { return {}; }

  const qs = parsed.searchParams;
  let productId = null;
  const m = parsed.pathname.match(/\/(?:view\/)?product\/(\d+)/);
  if (m) productId = m[1];

  let ogInfo = null;
  const ogRaw = qs.get('og_info');
  if (ogRaw) {
    try { ogInfo = JSON.parse(decodeURIComponent(ogRaw)); } catch { ogInfo = null; }
  }

  const minimal = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;

  return {
    product_id: productId,
    canonical_product_url: minimal,
    title: (ogInfo && ogInfo.title) || null,
    cover_image_url: (ogInfo && ogInfo.image) || null,
    share_region: qs.get('share_region') || null,
    seller_user_id: qs.get('user_id') || null,
    seller_unique_id: qs.get('unique_id') || null,
  };
}

// ─── Cover image fetch ────────────────────────────────────────────────────

async function fetchCoverBase64(coverUrl) {
  const res = await fetchWithTimeout(
    coverUrl,
    { headers: { 'User-Agent': DEFAULT_UA } },
    PER_REQUEST_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`CDN ${res.status}`);
  const arr = await res.arrayBuffer();
  if (arr.byteLength > MAX_COVER_BYTES) {
    throw new Error(`cover image too large (${arr.byteLength} bytes)`);
  }
  const buf = Buffer.from(arr);
  const ct = res.headers.get('content-type') || 'image/webp';
  const mime = ct.split(';')[0].trim() || 'image/webp';
  return { cover_base64: buf.toString('base64'), cover_mime: mime };
}

// ─── Send JSON helper ─────────────────────────────────────────────────────

function sendJson(res, status, payload) {
  try {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(status).json(payload);
    }
  } catch {
    /* fall through to manual write */
  }
  try {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
  } catch {
    /* connection already closed */
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  try {
    applyCors(req, res);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS');
      return sendJson(res, 405, { ok: false, error: 'Method not allowed', stage: 'method' });
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      return sendJson(res, 400, {
        ok: false,
        error: 'Invalid JSON body: ' + (e && e.message ? e.message : String(e)),
        stage: 'body',
      });
    }

    const rawIn = String((body && body.url) || '').trim();
    if (!rawIn) return sendJson(res, 400, { ok: false, error: 'url ว่าง', stage: 'input' });

    let url;
    try {
      url = normalizeAndValidateTikTokUrl(rawIn);
    } catch (e) {
      return sendJson(res, 400, {
        ok: false,
        error: e.message || String(e),
        stage: 'validate',
      });
    }

    let finalUrl;
    try {
      finalUrl = await resolveShareChain(url);
    } catch (e) {
      return sendJson(res, 502, {
        ok: false,
        error: 'ตามลิงก์ไม่สำเร็จ: ' + (e.message || String(e)),
        stage: 'redirect',
        source_url: url,
      });
    }

    const meta = parseProductUrl(finalUrl);

    let coverFields = { cover_base64: null, cover_mime: 'image/webp' };
    if (meta.cover_image_url) {
      try {
        coverFields = await fetchCoverBase64(meta.cover_image_url);
      } catch {
        /* รูปไม่มาก็ส่ง metadata ได้ — UI จะ fallback ใช้ผลแบบไม่มีรูป */
      }
    }

    return sendJson(res, 200, {
      ok: true,
      data: {
        ...meta,
        source_url: url,
        ...coverFields,
      },
    });
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    try { console.error('[tiktok-share-fetch] catastrophic', e); } catch { /* ignore */ }
    return sendJson(res, 500, { ok: false, error: msg, stage: 'catastrophic' });
  }
};
