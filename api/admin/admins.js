/**
 * /api/admin/admins
 * GET  — รายชื่อ admin (ต้อง login + เป็น admin)
 * POST — { "email": "..." } เพิ่ม admin
 * DELETE — ?email=... ลบ/ถอด admin (ต้องมี admin เหลืออย่างน้อย 1 คน)
 */
'use strict';

const {
  getAllAdminEmails,
  assertAdminRequest,
  addAdminEmail,
  removeAdminEmail,
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

function queryParam(req, key) {
  const s = String(req.url || '');
  const q = s.indexOf('?');
  if (q < 0) return '';
  return new URLSearchParams(s.slice(q)).get(key) || '';
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
    const admins = await getAllAdminEmails();
    return res.status(200).json({ ok: true, admins });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await parseBody(req);
    } catch (e) {
      return res.status(400).json({ ok: false, error: 'invalid_json' });
    }
    const email = body && body.email != null ? String(body.email) : '';
    const r = await addAdminEmail(email);
    if (r.error) {
      const st = r.error === 'invalid_email' ? 400 : 503;
      return res.status(st).json({ ok: false, error: r.error });
    }
    const admins = await getAllAdminEmails();
    return res.status(200).json({ ok: true, action: r.action, admins });
  }

  if (req.method === 'DELETE') {
    const email = queryParam(req, 'email');
    if (!email) {
      return res.status(400).json({ ok: false, error: 'missing_email' });
    }
    const r = await removeAdminEmail(email);
    if (r.error) {
      const map = { last_admin: 400, not_admin: 400, invalid_email: 400, kv_unconfigured: 503 };
      return res.status(map[r.error] || 500).json({ ok: false, error: r.error });
    }
    const admins = await getAllAdminEmails();
    return res.status(200).json({ ok: true, action: r.action, admins });
  }

  res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
  return res.status(405).json({ ok: false, error: 'method_not_allowed' });
};
