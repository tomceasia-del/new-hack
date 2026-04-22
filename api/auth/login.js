/**
 * GET /api/auth/login
 * Redirects the browser to Google's OAuth 2.0 consent screen.
 * Sets a short-lived `oauth_state` cookie for CSRF protection.
 */
'use strict';
const crypto = require('crypto');
const { getBaseUrl, setCookie } = require('./_helpers');

module.exports = function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('GOOGLE_CLIENT_ID is not configured');
  }

  // Random state for CSRF protection
  const state = crypto.randomBytes(20).toString('hex');
  const callbackUrl = `${getBaseUrl(req)}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  callbackUrl,
    response_type: 'code',
    scope:         'openid email profile',
    state,
    access_type:   'online',
    prompt:        'select_account',
  });

  res.setHeader('Set-Cookie',
    setCookie('oauth_state', state, {
      httpOnly: true, secure: true, sameSite: 'Lax',
      path: '/', maxAge: 300, // 5 min
    })
  );

  return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};
