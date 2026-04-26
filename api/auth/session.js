/**
 * GET /api/auth/session
 * Returns the authenticated user from the signed session cookie, or 401.
 * Called by client-side auth guards in the HTML pages.
 */
'use strict';
const { verifyJWT, parseCookies, SESSION_COOKIE, isEmailAllowed } = require('./_helpers');

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const cookies = parseCookies(req.headers.cookie);
  const token   = cookies[SESSION_COOKIE];

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return res.status(500).json({ authenticated: false, error: 'Server misconfiguration' });
  }

  try {
    const payload = verifyJWT(token, secret);
    // รองรับ JWT รุ่นเก่า (email/name) กับรุ่นเบา (e/u) เพื่อกัน 494
    const email = (payload.e != null ? payload.e : payload.email) || '';
    if (!isEmailAllowed(email)) {
      return res.status(401).json({ authenticated: false, reason: 'email_not_approved' });
    }
    const name =
      (payload.n != null && String(payload.n).trim()) ||
      (payload.name != null && String(payload.name).trim()) ||
      (email ? String(email).split('@')[0] : '') ||
      '';
    return res.status(200).json({
      authenticated: true,
      user: {
        name:    name,
        email:   email,
        picture: payload.picture,
      },
    });
  } catch (e) {
    return res.status(401).json({ authenticated: false });
  }
};
