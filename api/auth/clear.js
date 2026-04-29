/**
 * GET /api/auth/clear
 * ล้าง cookies ทั้งหมดที่เซิร์ฟเวอร์เคยตั้ง + legacy names ที่เก่าเก็บค้าง
 * ป้องกันลูปกลับเข้าสู่ 494 REQUEST_HEADER_TOO_LARGE
 */
'use strict';
const { setCookie, SESSION_COOKIE, getBaseUrl } = require('./_helpers');

const COOKIE_PATHS = ['/', '/api', '/api/auth'];
const LEGACY_NAMES = [
  SESSION_COOKIE,
  'oauth_state',
  'gcs_session',
  'gcs_user',
  'gcs_admin',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
  'session',
  'token',
  'access_token',
  'refresh_token',
];

module.exports = function handler(req, res) {
  const setCookies = [];
  for (const name of LEGACY_NAMES) {
    for (const path of COOKIE_PATHS) {
      setCookies.push(setCookie(name, '', {
        httpOnly: true, secure: true, sameSite: 'Lax', path, maxAge: 0,
      }));
      setCookies.push(setCookie(name, '', {
        secure: true, sameSite: 'Lax', path, maxAge: 0,
      }));
    }
  }
  res.setHeader('Set-Cookie', setCookies);
  res.setHeader('Cache-Control', 'no-store');
  if (req.query && req.query.json === '1') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).end(JSON.stringify({ ok: true, cleared: LEGACY_NAMES.length }));
  }
  return res.redirect(302, `${getBaseUrl(req)}/reset.html?ok=1`);
};
