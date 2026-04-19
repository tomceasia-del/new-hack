/**
 * GOOGLE FLOW POLICY — Content Sanitization Rules
 * =================================================
 * แหล่งที่มา:
 *  - content-googleflow.js บรรทัด 1807-1832 (sanitizePromptForFlow — logic จริงที่ทำงาน)
 *  - sidepanel.js บรรทัด 1640-1690 (slot โครงที่ยังไม่มีข้อมูล → เติมแล้ว)
 *  - Google Imagen/Veo Responsible AI Guidelines (2026)
 *  - TikTok Community Guidelines — Sensitive and Mature Themes (2025)
 *
 * วัตถุประสงค์:
 *  ล้าง prompt ก่อนส่งเข้า Google Flow (Veo/Imagen) เพื่อหลีกเลี่ยง policy violation
 *  แบ่งเป็น 4 ชั้น (ลำดับ runtime จริง):
 *    ชั้น 1: audio soft-replace (แทนคำเสียง — ต้องมาก่อน hard-ban)
 *    ชั้น 2: hard-ban (ตัดทิ้งคำต้องห้ามสมบูรณ์)
 *    ชั้น 3: layout-ban (ตัดทิ้งคำด้านรูปร่าง/ตำแหน่ง)
 *    ชั้น 4: cleanup (ตัด whitespace ซ้ำ)
 *
 *  Pipeline integration: Runs immediately before paste-to-Slate
 *  (pipeline Steps 6/image, 9/video8s, 14/extend — all AUTOPOST_STEPS paste phases)
 *  See content-googleflow.js pasteImagePromptToSlate/pasteVideoPrompt8ToSlate/pasteVideoPrompt16ToSlate
 */

// ==================== ชั้นที่ 1 — HARD BAN PATTERNS ====================
// Google Veo/Imagen Safety Categories: Sexual (90789179), Violence (61493863), Vulgar (32635315)
// ตัดออกทิ้งโดยไม่มีคำแทน

export const GOOGLE_FLOW_HARD_BAN = [
  // Violence / Dangerous content (code 62263041, 61493863)
  /\b(kill|murder|blood|gore|weapon|gun|knife|stab|shoot|explode|bomb|suicide|drug|narcotic)\b/gi,

  // Sexual / Nudity (code 90789179)
  /\b(naked|nude|sex|erotic|porn|nsfw|undressed|topless|bottomless)\b/gi,

  // Vulgar (code 32635315)
  /\b(fuck|shit|ass|bitch|bastard|cunt|dick|cock)\b/gi,
];

// ==================== ชั้นที่ 2 — SOFT REPLACE (Audio/Sound) ====================
// แปลงคำเสียงดัง/รุนแรง → คำนุ่มนวลที่ Google Flow ยอมรับ
// "ไม่ตัดทิ้ง แต่เปลี่ยนเป็นคำอ่อนๆ ให้ยังมีบรรยากาศเสียงคลอได้"

export const AUDIO_SAFE_REPLACEMENTS = {
  'scream':    'exclaim softly',
  'shriek':    'gasp',
  'thunder':   'gentle rain',
  'explosion': 'gentle pop',
  'gunshot':   'soft tap',
  'siren':     'gentle chime',
  'alarm':     'soft notification',
  'crash':     'soft landing',
  'bang':      'soft knock',
  'roar':      'gentle hum',
  'shout':     'call out',
  'yell':      'speak loudly',
  'blast':     'burst of energy',
  'smash':     'tap firmly',
  'slam':      'close firmly',
};

// ==================== ชั้นที่ 3 — LAYOUT BAN ====================
// Google Flow ไม่รองรับ multi-panel / split-screen — ตัดออกเพื่อป้องกัน error

export const GOOGLE_FLOW_LAYOUT_BAN =
  /\b(split[- ]?screen|side[- ]?by[- ]?side|before[- ]?and[- ]?after|collage|multi[- ]?panel|diptych|triptych|two[- ]?panel|dual[- ]?image)\b/gi;

// ==================== ชั้นที่ 4 — DIALOGUE FORBIDDEN WORDS ====================
// คำต้องห้ามเฉพาะในบทพูด/audio ของ Google Flow
// รวม hard ban + คำโฆษณา marketing (จาก forbidden-words-list.js)

export const GOOGLE_FLOW_FORBIDDEN_WORDS = [
  // Hard ban (เหมือน HARD_BAN แต่เฉพาะบทพูด)
  'kill', 'murder', 'suicide', 'drug', 'naked', 'nude', 'sex', 'porn',
  // คำที่ทำให้ audio generation ล้มเหลวจาก error จริง (ทดสอบโดยทีม extension)
  'yourshop', 'YourShop', 'Your Shop',
];

// ==================== ฟังก์ชัน sanitize ====================

/**
 * sanitizePromptForFlow — ล้าง prompt ก่อนส่งเข้า Google Flow Slate
 * ลำดับ runtime จริง: audio soft-replace → hard-ban → layout-ban → cleanup
 * (soft-replace ต้องมาก่อน hard-ban เพื่อป้องกัน regex ซ้อนกัน)
 */
export function sanitizePromptForFlow(text) {
  if (!text || typeof text !== 'string') return text || '';
  let p = text;

  // ขั้น 1: soft replace audio keywords ก่อน (ต้องมาก่อน hard-ban ไม่งั้น regex ซ้อนกัน)
  for (const [k, v] of Object.entries(AUDIO_SAFE_REPLACEMENTS)) {
    p = p.replace(new RegExp('\\b' + k + '\\b', 'gi'), v);
  }

  // ขั้น 2: hard ban — ตัดออกทิ้ง
  for (const rx of GOOGLE_FLOW_HARD_BAN) {
    p = p.replace(rx, '');
  }

  // ขั้น 3: layout ban — ตัดออกทิ้ง
  p = p.replace(GOOGLE_FLOW_LAYOUT_BAN, '');

  // ขั้น 4: cleanup whitespace
  p = p.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return p;
}

/**
 * sanitizeDialogueForGoogleFlow — ล้างเฉพาะบทพูด
 */
export function sanitizeDialogueForGoogleFlow(dialogue) {
  if (!dialogue || typeof dialogue !== 'string') return dialogue || '';
  let d = dialogue;

  // ตัด forbidden words ออกจากบทพูด
  for (const word of GOOGLE_FLOW_FORBIDDEN_WORDS) {
    d = d.replace(new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), '');
  }

  // ✂️ Strip yourshop ทุกรูปแบบ — ห้ามหลุดในบทพูดเด็ดขาด
  d = d.replace(/your\s*shop/gi, '');

  return d.replace(/\s{2,}/g, ' ').trim();
}

// ==================== GOOGLE_FLOW_WORD_REPLACEMENTS ====================
// Source: sanitizePromptForFlow() softReplace in content-googleflow.js (line 1816)
// Used by: sanitizeDialogueForGoogleFlow() and sanitizeVideoPrompt()
// Scope: dialogue-level word replacements (both English audio keywords + Thai dramatic words)
//
// NOTE: AUDIO_SAFE_REPLACEMENTS (video-prompt / TTS layer) is defined above (line 42).
//       This object covers dialogue text — a separate, broader replacement pass.
export const GOOGLE_FLOW_WORD_REPLACEMENTS = {
  // --- Audio dramatic words → soft alternatives (exact copy from sanitizePromptForFlow softReplace) ---
  'scream':    'exclaim softly',
  'shriek':    'gasp',
  'thunder':   'gentle rain',
  'explosion': 'gentle pop',
  'gunshot':   'soft tap',
  'siren':     'gentle chime',
  'alarm':     'soft notification',
  'crash':     'soft landing',
  'bang':      'soft knock',
  'roar':      'gentle hum',

  // --- Thai dialogue word replacements (prevent Google Flow audio generation failures) ---
  // คำรุนแรง / ดราม่า → คำอ่อนที่ Google Flow TTS ยอมรับ
  'ฆ่า':           'จากไป',        // kill → leave
  'ตาย':           'หลับ',         // die → sleep
  'เลือด':         'น้ำแดง',       // blood → red liquid
  'ปืน':           'อุปกรณ์',      // gun → equipment
  'ระเบิด':        'เสียงดัง',     // explode → loud sound
  'กรีดร้อง':      'ร้องเรียก',    // scream/shriek → call out
  'ทุบตี':         'สัมผัส',       // hit/beat → touch
  'ต่อสู้':        'โต้ตอบ',       // fight → respond
  'เจ็บปวด':      'รู้สึก',        // pain → feel
  'ทำลาย':         'เปลี่ยนแปลง',  // destroy → change
  'คำราม':         'พูดเบาๆ',      // growl/roar → speak softly
  'ระเบิดอารมณ์':  'แสดงออก',      // emotional explosion → express
  'แตกสลาย':      'เปลี่ยน',       // shatter → change
  'โกรธเกรี้ยว':  'กังวลใจ',       // furious → worried
  'ร้องโหยหวน':   'ร้องเรียกอย่างอ่อนโยน',  // howl → call gently
};
