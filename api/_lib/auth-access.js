/**
 * สิทธิ์ admin (ค่าเริ่ม + env) + ชุด extra/revoke บน Vercel KV
 * รวม isLoginAllowed = admin ตลอด หรือ ผ่าน AUTH_ALLOWED_EMAILS
 */
'use strict';

const { isEmailInAllowlist, verifyJWT, parseCookies, SESSION_COOKIE } = require('../auth/_helpers');

const KEY_EXTRA   = 'cs:admin_extra';
const KEY_REVOKED = 'cs:admin_revoked';
const KEY_ACCESS_PENDING     = 'cs:access_pending';
const KEY_ACCESS_PENDING_META = 'cs:access_pending_meta';
const KEY_APPROVED_USERS     = 'cs:approved_users';

/** ค่าเริ่มต้น — อนุมัตีโดยโค้ก (อนุญาตเพิ่มผ่าน env AUTH_ADMIN_SEED_EMAILS) */
const DEFAULT_ADMIN_EMAILS = [
  'tomceasia@gmail.com',
  'tosiittu@gmail.com',
];

function normEmail(s) {
  return String(s || '')
    .trim()
    .toLowerCase();
}

function parseEnvSeed() {
  const raw = process.env.AUTH_ADMIN_SEED_EMAILS;
  if (raw == null || !String(raw).trim()) return [];
  return String(raw)
    .split(',')
    .map((x) => normEmail(x))
    .filter(Boolean);
}

function builtinAdmins() {
  const s = new Set();
  for (const e of DEFAULT_ADMIN_EMAILS) s.add(normEmail(e));
  for (const e of parseEnvSeed()) s.add(e);
  return s;
}

function getKv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  try {
    return require('@vercel/kv').kv;
  } catch {
    return null;
  }
}

async function smembersSet(key) {
  const kv = getKv();
  if (!kv) return new Set();
  try {
    const list = (await kv.smembers(key)) || [];
    return new Set((list || []).map(normEmail).filter(Boolean));
  } catch (e) {
    console.error('[auth-access] smembers', key, e);
    return new Set();
  }
}

/**
 * รายชื่อ admin สำหรับแสดง / นับ
 */
async function getAllAdminEmails() {
  const base = builtinAdmins();
  const extra = await smembersSet(KEY_EXTRA);
  const rev = await smembersSet(KEY_REVOKED);
  const out = new Set();
  for (const e of base) {
    if (!rev.has(e)) out.add(e);
  }
  for (const e of extra) {
    if (!rev.has(e)) out.add(e);
  }
  return Array.from(out).sort();
}

/**
 * อีเมลนี้เป็น admin หรือไม่
 */
async function isAdminEmail(email) {
  const e = normEmail(email);
  if (!e) return false;
  const all = new Set(await getAllAdminEmails());
  return all.has(e);
}

/**
 * อีเมลอนุมัติผ่าน dashboard (KV) — นอก env AUTH_ALLOWED_EMAILS
 */
async function isKvApprovedUser(email) {
  const e = normEmail(email);
  if (!e) return false;
  const kv = getKv();
  if (!kv) return false;
  try {
    const m = await kv.sismember(KEY_APPROVED_USERS, e);
    return m === 1 || m === true;
  } catch (err) {
    console.error('[auth-access] sismember approved', err);
    return false;
  }
}

/**
 * อนุญาตล็อกอิน: admin, อนุมัติ KV, หรือ allowlist ใน env
 */
async function isLoginAllowed(email) {
  if (await isAdminEmail(email)) return true;
  if (await isKvApprovedUser(email)) return true;
  return isEmailInAllowlist(email);
}

/**
 * ลงคิวรอ admin อนุมัติ (ล็อกอิน Google สำเร็จแต่ยังไม่มีสิทธิ์)
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function addAccessRequest(rawEmail, meta) {
  const e = normEmail(rawEmail);
  if (!e) return { ok: false, error: 'invalid_email' };
  const kv = getKv();
  if (!kv) {
    return { ok: false, error: 'kv_unconfigured' };
  }
  try {
    const payload = {
      requestedAt: new Date().toISOString(),
      name: (meta && meta.name) ? String(meta.name).slice(0, 200) : '',
      sub:  (meta && meta.sub) ? String(meta.sub) : '',
    };
    await kv.sadd(KEY_ACCESS_PENDING, e);
    await kv.hset(KEY_ACCESS_PENDING_META, { [e]: JSON.stringify(payload) });
  } catch (err) {
    console.error('[auth-access] addAccessRequest', err);
    return { ok: false, error: 'kv_write' };
  }
  return { ok: true };
}

/**
 * รายการรออนุมัติ (เรียงใหม่ก่อน)
 * @returns { Promise<Array<{ email: string, requestedAt: string, name: string }>> }
 */
async function getAccessPendingList() {
  const kv = getKv();
  if (!kv) return [];
  let emails;
  try {
    emails = (await kv.smembers(KEY_ACCESS_PENDING)) || [];
  } catch (e) {
    console.error('[auth-access] getAccessPendingList', e);
    return [];
  }
  const out = [];
  for (const em of emails) {
    const e = normEmail(em);
    if (!e) continue;
    let requestedAt = '';
    let name = '';
    try {
      const raw = await kv.hget(KEY_ACCESS_PENDING_META, e);
      if (raw) {
        const o = JSON.parse(raw);
        requestedAt = o.requestedAt || '';
        name = o.name || '';
      }
    } catch {
      /* */
    }
    out.push({ email: e, requestedAt, name });
  }
  out.sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
  return out;
}

async function getApprovedUserEmails() {
  const kv = getKv();
  if (!kv) return [];
  try {
    const list = (await kv.smembers(KEY_APPROVED_USERS)) || [];
    return list.map(normEmail).filter(Boolean).sort();
  } catch (e) {
    console.error('[auth-access] getApprovedUserEmails', e);
    return [];
  }
}

/**
 * อนุมัติ: ออกจาก pending, เข้า approved
 */
async function approveAccessEmail(rawEmail) {
  const e = normEmail(rawEmail);
  if (!e) return { error: 'invalid_email' };
  const kv = getKv();
  if (!kv) return { error: 'kv_unconfigured' };
  try {
    await kv.srem(KEY_ACCESS_PENDING, e);
    await kv.hdel(KEY_ACCESS_PENDING_META, e);
    await kv.sadd(KEY_APPROVED_USERS, e);
  } catch (err) {
    console.error('[auth-access] approveAccessEmail', err);
    return { error: 'kv_write' };
  }
  return { ok: true };
}

/**
 * ปฏิเสธ — ลบออกจาก pending
 */
async function rejectAccessEmail(rawEmail) {
  const e = normEmail(rawEmail);
  if (!e) return { error: 'invalid_email' };
  const kv = getKv();
  if (!kv) return { error: 'kv_unconfigured' };
  try {
    await kv.srem(KEY_ACCESS_PENDING, e);
    try {
      await kv.hdel(KEY_ACCESS_PENDING_META, e);
    } catch {
      /* */
    }
  } catch (err) {
    console.error('[auth-access] rejectAccessEmail', err);
    return { error: 'kv_write' };
  }
  return { ok: true };
}

/**
 * ถอนสิทธิ์ user ที่อนุมัติ (ไม่รวม admin)
 */
async function revokeApprovedUser(rawEmail) {
  const e = normEmail(rawEmail);
  if (!e) return { error: 'invalid_email' };
  if (await isAdminEmail(e)) {
    return { error: 'cannot_revoke_admin' };
  }
  const kv = getKv();
  if (!kv) return { error: 'kv_unconfigured' };
  try {
    await kv.srem(KEY_APPROVED_USERS, e);
  } catch (err) {
    console.error('[auth-access] revokeApprovedUser', err);
    return { error: 'kv_write' };
  }
  return { ok: true };
}

function getSessionEmailFromReq(req) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  try {
    const p = verifyJWT(token, secret);
    return (p.e != null ? p.e : p.email) || null;
  } catch {
    return null;
  }
}

async function assertAdminRequest(req) {
  const me = getSessionEmailFromReq(req);
  if (!me) return { error: 401, msg: 'unauthorized' };
  if (!(await isAdminEmail(me))) return { error: 403, msg: 'forbidden' };
  return { me: normEmail(me) };
}

/**
 * @returns {{ ok: true }|{ error: string }}
 */
async function addAdminEmail(rawEmail) {
  const e = normEmail(rawEmail);
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return { error: 'invalid_email' };
  }
  const kv = getKv();
  if (!kv) return { error: 'kv_unconfigured' };

  const base = builtinAdmins();
  const rev  = await smembersSet(KEY_REVOKED);
  if (base.has(e) && rev.has(e)) {
    try {
      await kv.srem(KEY_REVOKED, e);
    } catch (err) {
      console.error('[auth-access] srem revoked', err);
      return { error: 'kv_write' };
    }
    return { ok: true, action: 'restored' };
  }
  if (base.has(e)) {
    return { ok: true, action: 'already_builtin' };
  }
  try {
    const extra = await smembersSet(KEY_EXTRA);
    if (extra.has(e)) return { ok: true, action: 'already' };
    await kv.sadd(KEY_EXTRA, e);
  } catch (err) {
    console.error('[auth-access] sadd extra', err);
    return { error: 'kv_write' };
  }
  return { ok: true, action: 'added' };
}

/**
 * ถอด admin — กับ built-in ใส่ revoke; กับ extra ลบ extra
 * กันถอดคนสุดท้าย (ต้องมี admin อย่างน้อย 1 คน)
 */
async function removeAdminEmail(rawTarget) {
  const e = normEmail(rawTarget);
  if (!e) return { error: 'invalid_email' };
  const kv = getKv();
  if (!kv) return { error: 'kv_unconfigured' };

  const all = await getAllAdminEmails();
  if (all.length <= 1) {
    return { error: 'last_admin' };
  }
  if (!all.includes(e)) {
    return { error: 'not_admin' };
  }
  const base = builtinAdmins();
  const extra  = await smembersSet(KEY_EXTRA);
  if (base.has(e) && !extra.has(e)) {
    try {
      await kv.sadd(KEY_REVOKED, e);
    } catch (err) {
      console.error('[auth-access] sadd revoked', err);
      return { error: 'kv_write' };
    }
    return { ok: true, action: 'revoked' };
  }
  try {
    await kv.srem(KEY_EXTRA, e);
  } catch (err) {
    console.error('[auth-access] srem extra', err);
    return { error: 'kv_write' };
  }
  return { ok: true, action: 'removed' };
}

module.exports = {
  isAdminEmail,
  isLoginAllowed,
  isKvApprovedUser,
  getAllAdminEmails,
  getSessionEmailFromReq,
  assertAdminRequest,
  addAdminEmail,
  removeAdminEmail,
  addAccessRequest,
  getAccessPendingList,
  getApprovedUserEmails,
  approveAccessEmail,
  rejectAccessEmail,
  revokeApprovedUser,
  builtinAdmins: () => Array.from(builtinAdmins()).sort(),
};
