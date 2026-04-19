/**
 * คัดกรอง prompt ก่อนส่งออกไป Google Gemini / Flow pipeline
 *
 * ประหยัดค่า API:
 * - แชต: เรียก Gemini screener เฉพาะข้อความ user ล่าสุดในรอบนั้น (ประวัติเก่าใช้แค่ local)
 * - ข้ามรอบ Gemini ถ้าข้อความสั้น / local แก้แล้ว / ไม่มีสัญญาณเสี่ยงและไม่ยาวเกินเกณฑ์
 * - แคชผล sanitize ซ้ำ (LRU)
 * - ใช้ gemini-2.0-flash ก่อน (มักถูกกว่า) แล้วค่อย fallback
 */
import { FORBIDDEN_MARKETING_PHRASES } from './forbidden-words-list.js';

// TODO: USER_PROMPT
const VIOLENCE_AND_UNSAFE_EN = [];

/** สัญญาณว่าควรให้ Gemini ช่วยวิเคราะห์ (ไม่พึ่งแค่ local) */
// TODO: USER_PROMPT
const RISK_SNIPPETS = [];

/** คำ/รูปแบบที่ลูกค้าห้ามทุกช่องทาง (บทพูด + ข้อความบนภาพ + caption) — ลบออกจากข้อความ */
// TODO: USER_PROMPT
const HARD_BAN_REGEXES = [];

export function stripHardBannedPhrases(text) {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  for (const re of HARD_BAN_REGEXES) {
    re.lastIndex = 0;
    out = out.replace(re, '');
  }
  return out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

let _sortedMarketing = null;
function sortedMarketingPhrases() {
  if (!_sortedMarketing) {
    _sortedMarketing = [...new Set(FORBIDDEN_MARKETING_PHRASES)].sort((a, b) => b.length - a.length);
  }
  return _sortedMarketing;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hashScreenKey(apiKeyPrefix, text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h) ^ text.charCodeAt(i);
  return `${apiKeyPrefix}:${(h >>> 0).toString(36)}:${text.length}`;
}

const GEMINI_SCREEN_CACHE = new Map();
const MAX_SCREEN_CACHE = 72;

function screenCacheGet(key) {
  if (!GEMINI_SCREEN_CACHE.has(key)) return null;
  const val = GEMINI_SCREEN_CACHE.get(key);
  GEMINI_SCREEN_CACHE.delete(key);
  GEMINI_SCREEN_CACHE.set(key, val);
  return val;
}

function screenCacheSet(key, val) {
  if (GEMINI_SCREEN_CACHE.has(key)) GEMINI_SCREEN_CACHE.delete(key);
  GEMINI_SCREEN_CACHE.set(key, val);
  while (GEMINI_SCREEN_CACHE.size > MAX_SCREEN_CACHE) {
    const first = GEMINI_SCREEN_CACHE.keys().next().value;
    GEMINI_SCREEN_CACHE.delete(first);
  }
}

function hasLikelyComplianceRisk(s) {
  if (!s || s.length > 5000) return true;
  const lower = s.toLowerCase();
  for (const r of RISK_SNIPPETS) {
    const asciiOnly = /^[a-z0-9.%\s\-]+$/i.test(r);
    if (asciiOnly) {
      if (lower.includes(r.toLowerCase())) return true;
    } else if (s.includes(r)) {
      return true;
    }
  }
  return false;
}

/**
 * ข้ามรอบ Gemini เมื่อ local จัดการแล้วหรือข้อความสั้น/ดูปลอดภัย — ลดค่าใช้จ่าย
 */
function shouldSkipGeminiCompliance(original, afterLocal) {
  if (!afterLocal || afterLocal.length <= 28) return true;
  if (afterLocal !== original) return true;
  if (!hasLikelyComplianceRisk(original) && afterLocal.length < 3200) return true;
  return false;
}

/** สแกนและแทนที่เบื้องต้น (ไม่เรียกเครือข่าย) */
// TODO: USER_PROMPT
export function localScreenText(text) {
  return text;
}

// TODO: USER_PROMPT
const GEMINI_SCREENER_SYSTEM = '';

async function rawGeminiGenerate(apiKey, model, requestBody) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

/** ถูกกว่า → แพงกว่า; Pro ใช้แค่ตอน Flash พังจริงๆ */
const SCREENER_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];

/**
 * เรียก Gemini รอบแยก (ไม่ผ่าน fetchGeminiWithFallback ของ sidepanel เพื่อกัน recursion)
 */
// TODO: USER_PROMPT
export async function geminiComplianceSanitize(apiKey, text) {
  return { sanitized: text, changed: false };
}

/**
 * @param {boolean} allowGemini - false = local เท่านั้น (ใช้กับข้อความ user เก่าในแชต)
 */
// TODO: USER_PROMPT
export async function screenPromptForOutbound(text, geminiKey, allowGemini = true) {
  return text;
}

/** คัดเฉพาะข้อความจาก role:user — Gemini เฉพาะข้อ user ล่าสุด (ประหยัดสุดในแชตยาว) */
// TODO: USER_PROMPT
export async function screenChatMessages(messages, geminiKey) {
  return messages;
}

/**
 * Local-only บน body ที่จะส่ง Gemini (ไม่แตะ systemInstruction — กันทำลายเทมเพลตระบบ)
 */
export function applyLocalScreenToGeminiRequestBody(requestBody) {
  if (!requestBody?.contents) return;
  for (const block of requestBody.contents) {
    if (!block.parts) continue;
    for (const part of block.parts) {
      if (part.text && !part.inlineData) {
        part.text = localScreenText(part.text);
      }
    }
  }
}

/** หลังวิเคราะห์รูปสินค้า — ลดการ inject คำเสี่ยงเข้า storyboard (ไม่เรียก Gemini = ฟรี) */
export function screenProductAnalysisObject(analysis) {
  if (!analysis || typeof analysis !== 'object') return analysis;
  const keys = ['appearance', 'features', 'targetAudience', 'usage', 'videoTips', 'summary_en', 'productType', 'brand', 'colorTone'];
  for (const k of keys) {
    if (typeof analysis[k] === 'string') {
      analysis[k] = localScreenText(analysis[k]);
    }
  }
  return analysis;
}
