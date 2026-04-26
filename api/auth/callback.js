/**
 * GET /api/auth/callback
 * Google redirects here after the user grants (or denies) consent.
 * Exchanges the auth code for tokens, verifies the ID token payload,
 * creates a signed session JWT, and sets a secure HttpOnly cookie.
 */
'use strict';
const { signJWT, parseCookies, setCookie, getBaseUrl, SESSION_COOKIE, SESSION_MAX_AGE, isEmailAllowed } = require('./_helpers');

module.exports = async function handler(req, res) {
  const { code, state, error } = req.query || {};

  // ── Error from Google ──────────────────────────────────────────────────────
  if (error) {
    return res.redirect(302, `${getBaseUrl(req)}/login.html?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return res.redirect(302, `${getBaseUrl(req)}/login.html?error=missing_code`);
  }

  // ── CSRF state check ────────────────────────────────────────────────────────
  const cookies    = parseCookies(req.headers.cookie);
  const savedState = cookies['oauth_state'];
  if (!state || !savedState || state !== savedState) {
    return res.redirect(302, `${getBaseUrl(req)}/login.html?error=state_mismatch`);
  }

  // ── Exchange code for tokens ────────────────────────────────────────────────
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const secret       = process.env.NEXTAUTH_SECRET;
  const callbackUrl  = `${getBaseUrl(req)}/api/auth/callback`;

  if (!clientId || !clientSecret || !secret) {
    return res.status(500).send('Auth environment variables are not fully configured');
  }

  let tokens;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  callbackUrl,
        grant_type:    'authorization_code',
      }).toString(),
    });
    tokens = await tokenRes.json();
  } catch (e) {
    console.error('[auth/callback] token exchange failed', e);
    return res.redirect(302, `${getBaseUrl(req)}/login.html?error=token_exchange_failed`);
  }

  if (tokens.error || !tokens.id_token) {
    console.error('[auth/callback] token error', tokens);
    return res.redirect(302, `${getBaseUrl(req)}/login.html?error=${encodeURIComponent(tokens.error || 'no_id_token')}`);
  }

  // ── Decode Google ID token payload (no need to verify signature here) ───────
  let profile;
  try {
    const parts = tokens.id_token.split('.');
    profile = JSON.parse(Buffer.from(
      parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64'
    ).toString('utf8'));
  } catch (e) {
    return res.redirect(302, `${getBaseUrl(req)}/login.html?error=id_token_decode_failed`);
  }

  const accountEmail = (profile.email && String(profile.email).trim()) || '';
  if (!accountEmail) {
    console.warn('[auth/callback] Google account has no email in id_token');
    return res.redirect(302, `${getBaseUrl(req)}/login.html?error=no_email`);
  }
  if (!isEmailAllowed(accountEmail)) {
    console.warn('[auth/callback] email not in AUTH_ALLOWED_EMAILS:', accountEmail);
    return res.redirect(302, `${getBaseUrl(req)}/login.html?error=email_not_approved`);
  }

  // ── Build + sign session JWT (ย่อ payload มากที่สุด) ───────────────────────
  // Vercel edge กันขนาด request header: Cookie รวมแล้วเกิน ~8kB → 494 REQUEST_HEADER_TOO_LARGE
  // ไม่ใส่ name / picture ใน token — แสดงชื่อฝั่ง /api/auth/session จาก local-part อีเมล
  const now = Math.floor(Date.now() / 1000);
  const emailNorm = accountEmail.slice(0, 254);
  const sessionJWT = signJWT(
    {
      u:   String(profile.sub || ''),
      e:   emailNorm,
      iat: now,
      exp: now + SESSION_MAX_AGE,
    },
    secret
  );

  // Clear CSRF cookie, set session cookie
  res.setHeader('Set-Cookie', [
    setCookie('oauth_state', '', { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 0 }),
    setCookie(SESSION_COOKIE, sessionJWT, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: SESSION_MAX_AGE }),
  ]);

  // ไป mock หลัก: ใช้ path ไฟล์ตรง ๆ + base จาก AUTH_BASE_URL/getBaseUrl
  // (กันบาง deploy ที่ /cs rewrite ยังไม่ match → Vercel 404)
  return res.redirect(302, `${getBaseUrl(req)}/story-config-mock.html`);
};
