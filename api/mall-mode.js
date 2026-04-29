/**
 * POST /api/mall-mode — Mall Mode pipeline (Vercel serverless)
 * สัญญา request/response เหมือน mall_mode.py
 *
 * Body:
 *   user_prompt      : string  (required; may include prepended image-analysis ground-truth block from client)
 *   scene_count      : int 1-20 (default 5)
 *   reference_image  : string | null  — base64 image (optional)
 *   image_mime_type  : string (default "image/jpeg")
 *   enforce_forbidden: bool (default true)
 *
 * Response (ok):
 *   { ok: true, scenes: [...], scene_count, model, warnings? }
 * Response (error):
 *   { ok: false, error: string }
 */

const fs = require('fs');
const path = require('path');

const GEMINI_MODEL_CHAIN = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
];

const ROOT = path.resolve(__dirname, '..');
const GEM_PACK = path.join(ROOT, 'GEM_PACK_TIKTOK');
const CONTENT_CORE_DIR = path.join(ROOT, 'CONTENT_CORE');

// ─── CORS ────────────────────────────────────────────────────────────

function applyMallApiCors(req, res) {
  const origin = req.headers && req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Gemini-Key');
}

// ─── Body parser ─────────────────────────────────────────────────────

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 24 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
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

// ─── Knowledge loading (cached per cold start) ────────────────────────

let _knowledgeCache = null;
let _forbiddenCache = null;

function loadMallKnowledge() {
  if (_knowledgeCache) return _knowledgeCache;
  const files = {
    heroes:  path.join(GEM_PACK, 'gem-kn-mall-mode-heroes.md'),
    stamp:   path.join(GEM_PACK, 'gem-kn-mall-mode-prompt-stamp.md'),
    catalog: path.join(GEM_PACK, 'gem-kn-mall-mode-store-catalog.md'),
  };
  _knowledgeCache = {};
  for (const [key, filePath] of Object.entries(files)) {
    _knowledgeCache[key] = fs.readFileSync(filePath, 'utf8');
  }
  return _knowledgeCache;
}

function loadForbiddenPhrases() {
  if (_forbiddenCache) return _forbiddenCache;
  const filePath = path.join(CONTENT_CORE_DIR, '01-forbidden-marketing-phrases.js');
  let raw = '';
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const m = content.match(/`([^`]+)`/s);
    raw = m ? m[1] : '';
  } catch (_) {
    raw = '';
  }
  _forbiddenCache = raw.split('\n').map(l => l.trim()).filter(Boolean);
  return _forbiddenCache;
}

// ─── Forbidden check ─────────────────────────────────────────────────

function checkForbidden(text, phrases) {
  if (!phrases) phrases = loadForbiddenPhrases();
  const lower = (text || '').toLowerCase();
  return phrases.filter(p => lower.includes(p.toLowerCase()));
}

// ─── Parse Gemini JSON (object + scenes or legacy array) ─────────────

function parseMallGeminiJson(rawText) {
  let stripped = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    const data = JSON.parse(stripped);
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const sc = data.scenes;
      if (Array.isArray(sc)) {
        let voiceProfileTh = null;
        if (typeof data.voice_profile_th === 'string' && data.voice_profile_th.trim()) {
          voiceProfileTh = data.voice_profile_th.trim();
        }
        return { scenes: sc, voice_profile_th: voiceProfileTh };
      }
    }
    if (Array.isArray(data)) {
      return { scenes: data, voice_profile_th: null };
    }
  } catch (_) {
    /* fall through */
  }
  const arrMatch = stripped.match(/\[[\s\S]*\]/);
  const jsonStr = arrMatch ? arrMatch[0] : stripped;
  const scenes = JSON.parse(jsonStr);
  const arr = Array.isArray(scenes) ? scenes : [scenes];
  return { scenes: arr, voice_profile_th: null };
}

// ─── System prompt ────────────────────────────────────────────────────

function buildSystemPrompt(sceneCount) {
  const kn = loadMallKnowledge();
  return `You are running in **Mall Mode (โหมดห้าง)** — a standalone TikTok content generation system.
Your task: generate exactly **${sceneCount}** realistic first-person POV mall scene prompt(s).

---
## HEROES (6 types)
${kn.heroes}

---
## PROMPT STAMP (rules, POV rules, checklist)
${kn.stamp}

---
## STORE CATALOG (real sign names, tags)
${kn.catalog}

---
## OUTPUT FORMAT

Respond with a **single valid JSON object** (not an array at top level). No markdown fences. No text before/after the JSON.

Shape:
{
  "voice_profile_th": "<Thai: ONE narrator — write AT LEAST 4–8 sentences: age range, speech pace, particles/habit words, mall-shopper vibe; if a target product is named by the user, describe pack/color/shape ONCE in detail here so later scenes can reuse identical wording — see PROMPT STAMP §5e>",
  "scenes": [
    {
      "scene_number":     <int, 1-based>,
      "hero_id":          <"deal_spot"|"trend_find"|"restock_win"|"bulk_value"|"try_love"|"diy_trade">,
      "scene_atmosphere": <"pharmacy_health"|"cosmetics_open"|"department_store"|"supermarket_aisle"|"electronics_floor"|"building_megastore">,
      "store_id":         <store_id from catalog, or null>,
      "name_on_sign":     <exact name_on_sign from catalog, or null>,
      "image_prompt":     <English; first-person POV; realistic store clone; specific branding>,
      "video_prompt":     <English POV walking; optional short Thai clause matching voice_profile_th + voice_script_th>,
      "caption_th":       <Thai TikTok caption; hero_id §5b–5c; CTA buy on TikTok; no forbidden phrases>,
      "voice_script_th":  <Thai; walking POV dialogue for THIS scene — NEVER empty; ~18–40 Thai words ok when repeating full product name + pack traits; MUST match voice_profile_th AND hero_id §5c>
    },
    ... exactly ${sceneCount} objects in "scenes"
  ]
}

## STRICT RULES
1. ALL camera angles: **first-person POV only** (กล้องอยู่ที่สายตาคนเดิน — ห้ามมุม third-person ทุกกรณี)
2. Use exact \`name_on_sign\` from catalog to clone store atmosphere (ป้ายจริง, สีร้านจริง)
3. NEVER use forbidden phrases: การันตี, รับรอง, เห็นผลทันที, ขาวเร่งด่วน, ลดน้ำหนัก,
   Best Seller, No.1, Before After, ปาฏิหาริย์, ดีที่สุด, การันตีผล, ฯลฯ
4. **Voice consistency (Thai):** \`voice_profile_th\` = single speaker for whole series; every \`voice_script_th\` must sound like that same person while following each scene \`hero_id\` (§5c). Follow **§5e** for long persona + identical brand/pack spelling across scenes.
5. **\`caption_th\`:** Follow §5b–§5c. \`voice_script_th\` = lines read aloud; \`caption_th\` may be punchier for TikTok but same narrator as \`voice_profile_th\`.
6. **Anti-patterns:** Do NOT write like TV ad / studio reviewer for \`caption_th\` / \`voice_script_th\`.
7. Output ONLY the JSON object — no markdown, no preamble, no explanation
8. **Product grounding:** The user message may include \`【ข้อมูลจากการวิเคราะห์รูปสินค้าจริง — อ้างอิงเท่านั้น】\` + structured facts from the **reference product image**. Every scene must describe **that exact product** (brand, pack, colors, visible text). Do NOT substitute another SKU or invent packaging from retail memory.
9. **Price / promo / ป้ายลด:** Percent-off, baht prices, bundles, expiry — **only** if present in that analysis block or explicit user text. **Never** invent sale amounts or shelf wording from model memory. If none appear, omit fabricated prices/promo copy.
10. **Names & spelling lock:** Mall name, store sign, and product brand (e.g. Q'Care White, yellow box, blue jar) must use the **same spelling and descriptors** in every scene where they appear — see PROMPT STAMP **§5e**.
11. **Hero walking dialogue:** Every scene MUST include non-empty \`voice_script_th\` — natural monologue while walking/stopping in POV, tied to what the camera sees; no silent scenes.
`;
}

// ─── Gemini call ──────────────────────────────────────────────────────

async function callGemini(apiKey, requestBody) {
  let lastErr = null;
  for (let i = 0; i < GEMINI_MODEL_CHAIN.length; i++) {
    const model = GEMINI_MODEL_CHAIN[i];
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      model +
      ':generateContent?key=' +
      encodeURIComponent(apiKey.trim());
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (response.status === 429) {
        lastErr = new Error('429 rate limit');
        continue;
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = (errData.error && errData.error.message) || 'HTTP ' + response.status;
        if (i < GEMINI_MODEL_CHAIN.length - 1 && response.status !== 401 && response.status !== 403) {
          lastErr = new Error(errMsg);
          continue;
        }
        throw new Error(errMsg);
      }
      const data = await response.json();
      const blockReason =
        (data.promptFeedback && data.promptFeedback.blockReason) ||
        (data.candidates && data.candidates[0] && data.candidates[0].finishReason);
      if (
        blockReason === 'PROHIBITED_CONTENT' ||
        blockReason === 'SAFETY' ||
        blockReason === 'BLOCKLIST'
      ) {
        if (i < GEMINI_MODEL_CHAIN.length - 1) {
          lastErr = new Error(String(blockReason));
          continue;
        }
      }
      const cparts =
        data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts;
      const text = (cparts && cparts[0] && cparts[0].text) || '';
      if (!text) {
        const fr =
          (data.candidates && data.candidates[0] && data.candidates[0].finishReason) ||
          (data.promptFeedback && data.promptFeedback.blockReason) ||
          'unknown';
        throw new Error('Gemini ไม่ตอบกลับ (' + fr + ')');
      }
      return { text, model };
    } catch (e) {
      lastErr = e;
      if (i < GEMINI_MODEL_CHAIN.length - 1) continue;
      throw e;
    }
  }
  throw lastErr || new Error('Gemini: all models failed');
}

// ─── Mall Mode pipeline ────────────────────────────────────────────────

async function runMallMode(body, apiKey) {
  // 1. validate
  const userPrompt = typeof body.user_prompt === 'string' ? body.user_prompt.trim() : '';
  if (!userPrompt) return { ok: false, error: 'user_prompt ต้องไม่ว่าง (string)' };

  const sceneCount = Math.min(20, Math.max(1, parseInt(body.scene_count || 5, 10) || 5));
  const enforce = body.enforce_forbidden !== false;
  const refImage = body.reference_image || null;
  const imageMime = body.image_mime_type || 'image/jpeg';

  const warnings = [];

  // 2. forbidden check on input (warn only)
  if (enforce) {
    const hits = checkForbidden(userPrompt);
    if (hits.length > 0) {
      warnings.push('user_prompt มีคำต้องห้าม: ' + hits.slice(0, 8).join(', ') + ' — ระบบจะหลีกเลี่ยงในผลลัพธ์');
    }
  }

  // 3. build Gemini request
  const systemPrompt = buildSystemPrompt(sceneCount);
  const parts = [];
  if (refImage) {
    parts.push({ inlineData: { mimeType: imageMime, data: refImage } });
  }
  parts.push({ text: `สร้าง ${sceneCount} ซีน สำหรับ: ${userPrompt}` });

  const requestBody = {
    contents: [{ role: 'user', parts }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
      topP: 0.9,
    },
  };

  // 4. call Gemini
  let rawText, usedModel;
  try {
    const result = await callGemini(apiKey, requestBody);
    rawText = result.text;
    usedModel = result.model;
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }

  // 5. parse JSON (object + scenes or legacy array)
  let scenes;
  let voiceProfileTh = null;
  try {
    const parsed = parseMallGeminiJson(rawText);
    scenes = parsed.scenes;
    voiceProfileTh = parsed.voice_profile_th;
  } catch (e) {
    return {
      ok: false,
      error: 'ไม่สามารถ parse JSON จาก Gemini: ' + (e && e.message ? e.message : String(e)),
      raw: rawText
    };
  }

  // 6. forbidden check on output fields (warn only)
  if (enforce) {
    const phrases = loadForbiddenPhrases();
    if (voiceProfileTh) {
      const hits = checkForbidden(voiceProfileTh, phrases);
      if (hits.length > 0) {
        warnings.push('voice_profile_th: ' + hits.join(', '));
      }
    }
    for (const scene of scenes) {
      for (const field of ['image_prompt', 'video_prompt', 'caption_th', 'voice_script_th']) {
        const hits = checkForbidden(scene[field] || '', phrases);
        if (hits.length > 0) {
          warnings.push(`scene ${scene.scene_number || '?'} [${field}]: ` + hits.join(', '));
        }
      }
    }
  }

  const result = { ok: true, scenes, scene_count: scenes.length, model: usedModel };
  if (voiceProfileTh) result.voice_profile_th = voiceProfileTh;
  if (warnings.length > 0) result.warnings = warnings;
  return result;
}

// ─── Handler ──────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  applyMallApiCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // API key — env var เท่านั้น (ถ้ามี X-Gemini-Key ส่งมาใช้ fallback สำหรับ local dev)
  const envKey = (process.env.GEMINI_API_KEY || '').trim();
  const headerKey = (req.headers['x-gemini-key'] || '').trim();
  const apiKey = envKey || headerKey;
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error: 'GEMINI_API_KEY ยังไม่ได้ตั้งใน Vercel Environment Variables',
    });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
  }

  try {
    const result = await runMallMode(body, apiKey);
    return res.status(result.ok ? 200 : 400).json(result);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e && e.message ? e.message : String(e),
    });
  }
};
