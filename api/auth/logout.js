/**
 * GET /api/auth/logout
 * Clears the session cookie and redirects to the login page.
 */
'use strict';
const { setCookie, SESSION_COOKIE } = require('./_helpers');

module.exports = function handler(req, res) {
  res.setHeader('Set-Cookie',
    setCookie(SESSION_COOKIE, '', {
      httpOnly: true, secure: true, sameSite: 'Lax',
      path: '/', maxAge: 0,
    })
  );
  return res.redirect(302, '/');
};
