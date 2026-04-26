/**
 * Shared auth helpers — JWT signing (HS256) + cookie parsing.
 * Uses only Node.js built-in `crypto`; no npm packages required.
 */
'use strict';
const crypto = require('crypto');

// ── JWT (HS256) ─────────────────────────────────────────────────────────────

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function fromb64url(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Sign a payload as a compact HS256 JWT.
 * @param {object} payload
 * @param {string} secret
 * @returns {string}
 */
function signJWT(payload, secret) {
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body   = b64url(Buffer.from(JSON.stringify(payload)));
  const sig    = b64url(crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

/**
 * Verify and decode an HS256 JWT.
 * Throws if signature is invalid or token is expired.
 * @param {string} token
 * @param {string} secret
 * @returns {object} payload
 */
function verifyJWT(token, secret) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('Malformed token');

  const [header, body, sig] = parts;
  const expected = b64url(
    crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest()
  );
  // Constant-time comparison
  const aBuf = fromb64url(sig);
  const bBuf = fromb64url(expected);
  if (aBuf.length !== bBuf.length || !crypto.timingSafeEqual(aBuf, bBuf)) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(fromb64url(body).toString('utf8'));
  const expT = payload.exp != null ? payload.exp : payload.x;
  if (expT && expT < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  return payload;
}

// ── Cookie helpers ──────────────────────────────────────────────────────────

/**
 * Parse Cookie header into a plain object.
 * @param {string} header
 * @returns {Record<string,string>}
 */
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
  });
  return out;
}

/**
 * Build a Set-Cookie string.
 */
function setCookie(name, value, options = {}) {
  let s = `${name}=${encodeURIComponent(value)}`;
  if (options.maxAge != null) s += `; Max-Age=${options.maxAge}`;
  if (options.path)           s += `; Path=${options.path}`;
  if (options.httpOnly)       s += '; HttpOnly';
  if (options.secure)         s += '; Secure';
  if (options.sameSite)       s += `; SameSite=${options.sameSite}`;
  return s;
}

// ── Request helpers ─────────────────────────────────────────────────────────

/**
 * โยง redirect_uri กับ Google — ต้องตรงกับ "Authorized redirect URIs" ทุกตัวอักษร
 * ตัวอย่าง: https://www.example.com/api/auth/callback
 * แนะนำตั้งบน Vercel: AUTH_BASE_URL=https://www.example.com (รวม https และโดเมนจริงคู่กับ Google)
 * รองรับ NEXTAUTH_URL / PUBLIC_BASE_URL เป็นทางเลือก (เอาเฉพาะ origin)
 */
function isLocalhostHost(hostname) {
  return /^(localhost|127\.0\.0\.1)$/i.test(hostname || '');
}

function authBaseFromEnv() {
  const raw = process.env.AUTH_BASE_URL || process.env.NEXTAUTH_URL || process.env.PUBLIC_BASE_URL;
  if (!raw || !String(raw).trim()) return null;
  try {
    const u = new URL(String(raw).trim());
    if (!u.host) return null;
    let origin = `${u.protocol}//${u.host}`.replace(/\/$/, '');
    // โดเมนจริงใช้ https กับ Google เสมอ (กันพิมพ์ http: แล้วไม่ match redirect URI)
    if (!isLocalhostHost(u.hostname)) {
      origin = origin.replace(/^http:\/\//, 'https://');
    }
    return origin;
  } catch {
    return null;
  }
}

function firstHeaderToken(headerVal) {
  if (headerVal == null) return '';
  return String(headerVal).split(',')[0].trim();
}

/**
 * Public origin สำหรับ OAuth ใช้เดียวกับ token exchange
 */
function getBaseUrl(req) {
  const fromEnv = authBaseFromEnv();
  if (fromEnv) return fromEnv;

  const host =
    firstHeaderToken(req.headers['x-forwarded-host']) ||
    firstHeaderToken(req.headers.host) ||
    'localhost:3000';
  const hostOnly = host.split(':')[0];
  let proto = firstHeaderToken(req.headers['x-forwarded-proto']) || 'https';
  if (!isLocalhostHost(hostOnly) && process.env.VERCEL) {
    proto = 'https';
  }
  return `${proto}://${host}`;
}

// ── Session constants ───────────────────────────────────────────────────────

const SESSION_COOKIE  = 'gcs_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// ── Optional email allowlist (Google login) ──────────────────────────────
// AUTH_ALLOWED_EMAILS = "a@x.com, b@y.com" (case-insensitive)
// - ถ้า unset: ไม่กรอง (เหมาะ dev / local)
// - ถ้า set: อนุญาตเฉพาะอีเมล์ในรายการ; รายการว่าง = บล็อกทุกอีเมล์

/**
 * @returns {Set<string>|null} null หมายถึงยังไม่ใช้ allowlist; Set อาจว่าง
 */
function parseAllowedEmailsSet() {
  const raw = process.env.AUTH_ALLOWED_EMAILS;
  if (raw === undefined) return null;
  return new Set(
    String(raw)
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * อีเมล์ได้รับอนุมัติตาม AUTH_ALLOWED_EMAILS หรือไม่
 * @param {string} [email]
 * @returns {boolean}
 */
function isEmailAllowed(email) {
  const set = parseAllowedEmailsSet();
  if (set === null) return true;
  const e = (email || '').trim().toLowerCase();
  if (!e) return false;
  if (set.size === 0) return false;
  return set.has(e);
}

module.exports = {
  signJWT,
  verifyJWT,
  parseCookies,
  setCookie,
  getBaseUrl,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  isEmailAllowed,
};
