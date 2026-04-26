/**
 * GET  /api/admin/access-requests — รายการรออนุมัติ + อนุมัติแล้ว (admin)
 * POST /api/admin/access-requests — { "action": "approve"|"reject"|"revoke", "email": "..." }
 */
'use strict';

const {
  assertAdminRequest,
  getAccessPendingList,
  getApprovedUserEmails,
  approveAccessEmail,
  rejectAccessEmail,
  revokeApprovedUser,
} = require('../_lib/auth-access');

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1 * 1024 * 1024) reject(new Error('Payload too large'));
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
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const ar = await assertAdminRequest(req);
  if (ar.error) {
    return res.status(ar.error).json({ ok: false, error: ar.msg });
  }

  if (req.method === 'GET') {
    const pending = await getAccessPendingList();
    const approved = await getApprovedUserEmails();
    return res.status(200).json({ ok: true, pending, approved });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await parseBody(req);
    } catch (e) {
      return res.status(400).json({ ok: false, error: 'invalid_json' });
    }
    const action = body && body.action != null ? String(body.action) : '';
    const email  = body && body.email != null ? String(body.email) : '';
    if (!email) {
      return res.status(400).json({ ok: false, error: 'missing_email' });
    }
    if (action === 'approve') {
      const r = await approveAccessEmail(email);
      if (r.error) {
        const st = r.error === 'kv_unconfigured' ? 503 : 500;
        return res.status(st).json({ ok: false, error: r.error });
      }
      const pending = await getAccessPendingList();
      const approved = await getApprovedUserEmails();
      return res.status(200).json({ ok: true, action: 'approved', pending, approved });
    }
    if (action === 'reject') {
      const r = await rejectAccessEmail(email);
      if (r.error) {
        const st = r.error === 'kv_unconfigured' ? 503 : 500;
        return res.status(st).json({ ok: false, error: r.error });
      }
      const pending = await getAccessPendingList();
      const approved = await getApprovedUserEmails();
      return res.status(200).json({ ok: true, action: 'rejected', pending, approved });
    }
    if (action === 'revoke') {
      const r = await revokeApprovedUser(email);
      if (r.error) {
        const st =
          r.error === 'kv_unconfigured' ? 503
            : r.error === 'cannot_revoke_admin' ? 400
              : 500;
        return res.status(st).json({ ok: false, error: r.error });
      }
      const pending = await getAccessPendingList();
      const approved = await getApprovedUserEmails();
      return res.status(200).json({ ok: true, action: 'revoked', pending, approved });
    }
    return res.status(400).json({ ok: false, error: 'bad_action' });
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' });
};
