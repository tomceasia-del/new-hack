/**
 * POST /api/moral-drama-mode — Moral Drama Mode pipeline (Vercel serverless)
 *
 * Body:
 *   user_prompt              : string  (required; seed story / premise)
 *   scene_count              : int 1-20 (default 5)
 *   character_visual_styles  : array<{id, thai, en, prompt}> (optional; from VISUAL_STYLES picker)
 *   reference_image          : string | null  — base64 hero image (optional)
 *   image_mime_type          : string (default "image/jpeg")
 *   enforce_forbidden        : bool (default true)
 *
 * Response (ok):
 *   { ok: true, scenes: [...], character_profile_th, narrator_voice_th, moral_summary_th, scene_count, model, warnings? }
 * Response (error):
 *   { ok: false, error: string }
 */

const fs = require('fs');
const path = require('path');

const { resolveGeminiApiKeyFromEnv } = require(path.join(__dirname, '_lib', 'gemini-env-key.js'));

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

function applyCors(req, res) {
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

function loadMoralDramaKnowledge() {
  if (_knowledgeCache) return _knowledgeCache;
  const files = {
    stamp:  path.join(GEM_PACK, 'gem-kn-moral-drama-stamp.md'),
    schema: path.join(GEM_PACK, 'gem-kn-moral-drama-output-schema.md'),
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

// ─── Parse Gemini JSON ────────────────────────────────────────────────

function parseMoralDramaGeminiJson(rawText) {
  let stripped = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    const data = JSON.parse(stripped);
    if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.scenes)) {
      return {
        scenes: data.scenes,
        character_profile_th: data.character_profile_th || null,
        narrator_voice_th: data.narrator_voice_th || null,
        moral_summary_th: data.moral_summary_th || null,
      };
    }
    // fallback: top-level array
    if (Array.isArray(data)) {
      return { scenes: data, character_profile_th: null, narrator_voice_th: null, moral_summary_th: null };
    }
  } catch (_) {
    /* fall through */
  }
  const arrMatch = stripped.match(/\[[\s\S]*\]/);
  const jsonStr = arrMatch ? arrMatch[0] : stripped;
  const scenes = JSON.parse(jsonStr);
  return {
    scenes: Array.isArray(scenes) ? scenes : [scenes],
    character_profile_th: null,
    narrator_voice_th: null,
    moral_summary_th: null,
  };
}

// ─── System prompt ────────────────────────────────────────────────────

function buildSystemPrompt(sceneCount, visualStylesText) {
  const kn = loadMoralDramaKnowledge();
  const styleSection = visualStylesText
    ? `\n---\n## VISUAL STYLE (จาก user)\n${visualStylesText}\nใช้ชื่อสไตล์นี้ใน image_prompt และ video_prompt ทุกซีน\n`
    : '';

  return `You are running in **Moral Drama Mode (โหมดละครคุณธรรม)** — a standalone TikTok short-drama generation system.
Your task: generate exactly **${sceneCount}** dramatic scenes with Moral lesson and at least one Plot Twist.

---
## RULES & CRAFT
${kn.stamp}
${styleSection}
---
## OUTPUT SCHEMA
${kn.schema}

---
## STRICT RULES
1. Output ONLY the JSON object — no markdown fences, no preamble, no explanation
2. scenes array MUST contain exactly ${sceneCount} objects
3. At least ONE scene must have "twist_flag": true
4. The LAST scene must have "arc_point": "moral"
5. "voice_script_th" MUST NOT be empty in any scene
6. Every image_prompt and video_prompt MUST include: NO text overlays, NO kinetic typography, NO price graphics
7. If a hero reference image is attached, describe the character's appearance consistently across ALL scenes (hair, clothing, build, facial features) matching the image exactly
8. "moral_beat_th" must be present (non-null) in scenes with arc_point "twist" or "moral"
9. Write in Thai for all Thai fields; English for image_prompt and video_prompt
10. Do NOT use forbidden phrases in voice_script_th, caption_th, or moral_beat_th
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

// ─── Moral Drama pipeline ─────────────────────────────────────────────

async function runMoralDramaMode(body, apiKey) {
  const userPrompt = typeof body.user_prompt === 'string' ? body.user_prompt.trim() : '';
  if (!userPrompt) return { ok: false, error: 'user_prompt ต้องไม่ว่าง (string)' };

  const sceneCount = Math.min(20, Math.max(1, parseInt(body.scene_count || 5, 10) || 5));
  const enforce = body.enforce_forbidden !== false;
  const refImage = body.reference_image || null;
  const imageMime = body.image_mime_type || 'image/jpeg';
  const visualStyles = Array.isArray(body.character_visual_styles) ? body.character_visual_styles : [];

  const warnings = [];

  // forbidden check on input (warn only)
  if (enforce) {
    const hits = checkForbidden(userPrompt);
    if (hits.length > 0) {
      warnings.push('user_prompt มีคำต้องห้าม: ' + hits.slice(0, 8).join(', ') + ' — ระบบจะหลีกเลี่ยงในผลลัพธ์');
    }
  }

  // build visual style description for system prompt
  let visualStylesText = '';
  if (visualStyles.length > 0) {
    visualStylesText = visualStyles
      .map(s => `- ${s.thai || s.en || s.id}: ${s.prompt || s.en || ''}`)
      .join('\n');
  }

  const systemPrompt = buildSystemPrompt(sceneCount, visualStylesText);

  // build user message parts
  const parts = [];
  if (refImage) {
    parts.push({ inlineData: { mimeType: imageMime, data: refImage } });
    parts.push({ text: '【รูปตัวละครหลัก (Hero)】ล็อกรูปลักษณ์ตัวละครหลักให้ตรงกับรูปนี้ทุกซีน' });
  }
  parts.push({
    text: `สร้างละครคุณธรรม ${sceneCount} ซีน\n\n【เรื่องราวเริ่มต้น / โจทย์】\n${userPrompt}`,
  });

  const requestBody = {
    contents: [{ role: 'user', parts }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.8,
      topP: 0.9,
    },
  };

  let rawText, usedModel;
  try {
    const result = await callGemini(apiKey, requestBody);
    rawText = result.text;
    usedModel = result.model;
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }

  let scenes, characterProfileTh, narratorVoiceTh, moralSummaryTh;
  try {
    const parsed = parseMoralDramaGeminiJson(rawText);
    scenes = parsed.scenes;
    characterProfileTh = parsed.character_profile_th;
    narratorVoiceTh = parsed.narrator_voice_th;
    moralSummaryTh = parsed.moral_summary_th;
  } catch (e) {
    return {
      ok: false,
      error: 'ไม่สามารถ parse JSON จาก Gemini: ' + (e && e.message ? e.message : String(e)),
      raw: rawText,
    };
  }

  // forbidden check on output fields (warn only)
  if (enforce) {
    const phrases = loadForbiddenPhrases();
    for (const scene of scenes) {
      for (const field of ['voice_script_th', 'caption_th', 'moral_beat_th']) {
        const hits = checkForbidden(scene[field] || '', phrases);
        if (hits.length > 0) {
          warnings.push(`scene ${scene.scene_number || '?'} [${field}]: ` + hits.join(', '));
        }
      }
    }
  }

  const result = { ok: true, scenes, scene_count: scenes.length, model: usedModel };
  if (characterProfileTh) result.character_profile_th = characterProfileTh;
  if (narratorVoiceTh) result.narrator_voice_th = narratorVoiceTh;
  if (moralSummaryTh) result.moral_summary_th = moralSummaryTh;
  if (warnings.length > 0) result.warnings = warnings;
  return result;
}

// ─── Handler ──────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const envKey = resolveGeminiApiKeyFromEnv();
  const headerKey = (req.headers['x-gemini-key'] || '').trim();
  const apiKey = envKey || headerKey;
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error:
        'ยังไม่มี Gemini API key — ตั้ง GEMINI_API_KEY หรือ GOOGLE_AI_API_KEY / GOOGLE_API_KEY บน Vercel หรือส่ง X-Gemini-Key (local)',
    });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
  }

  try {
    const result = await runMoralDramaMode(body, apiKey);
    return res.status(result.ok ? 200 : 400).json(result);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e && e.message ? e.message : String(e),
    });
  }
};

/** สำหรับ CLI / Python bridge (serve_story_mock) — เรียก pipeline โดยตรง */
module.exports.runMoralDramaMode = runMoralDramaMode;
