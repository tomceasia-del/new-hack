/**
 * BODY DESCRIPTION SAFE REWRITES
 * ================================
 * แหล่งที่มา (research จาก official docs 2026):
 *  - Google Imagen Responsible AI Guidelines
 *    https://cloud.google.com/vertex-ai/generative-ai/docs/image/responsible-ai-imagen
 *  - Google Veo Responsible AI Guidelines
 *    https://cloud.google.com/vertex-ai/generative-ai/docs/video/responsible-ai-and-usage-guidelines
 *  - TikTok Community Guidelines — Sensitive and Mature Themes (eff. Sep 13, 2025)
 *    https://www.tiktok.com/community-guidelines/en/sensitive-mature-themes/
 *  - Google Veo Prompt Guide (Safe person description examples)
 *    https://cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide
 *
 * วัตถุประสงค์:
 *  INTERNAL sanitization สำหรับ AI-generated character description
 *  (≠ Google Flow policy โดยตรง — ดู 04-google-flow-policy.js สำหรับ Flow-specific rules)
 *
 *  เมื่อ AI วิเคราะห์รูปภาพตัวละครและสร้าง character description ออกมา
 *  อาจมีคำบรรยายร่างกายที่ trigger Google Flow policy (Sexual / Hate / Toxic)
 *  ไฟล์นี้ระบุ regex pattern + คำแทนที่ที่ "fashion-safe" สำหรับงาน UGC / e-commerce
 *
 * Google Safety Codes ที่เกี่ยวข้อง:
 *  90789179 / 43188360 = Sexual (suggestive body descriptions)
 *  57734940 / 22137204 = Hate (skin color discrimination)
 *  78610348            = Toxic
 *  32635315            = Vulgar
 *
 * หลักการแทนที่:
 *  - ไม่ตัดทิ้ง แต่แทนด้วยคำที่ยังสื่อ "ลักษณะตัวละคร" ได้
 *  - ใช้ภาษา fashion industry ที่เป็นกลางและ inclusive
 *  - อ้างอิงตัวอย่างจาก Veo/Imagen prompt guide อย่างเป็นทางการ
 */

// ==================== กลุ่ม A — Body Shape / Physique ====================
// คำบรรยายรูปร่างที่ trigger Sexual filter ของ Google
// Google Veo safe alternative: "elegant posture", "confident silhouette"

export const BODY_SHAPE_REWRITES = [
  { pattern: /\bslim\s+figure\b/gi,          replace: 'elegant posture' },
  { pattern: /\bslender\s+(body|figure|build)\b/gi, replace: 'graceful build' },
  { pattern: /\bcurvy\s+figure\b/gi,          replace: 'confident silhouette' },
  { pattern: /\bhourglass\s+figure\b/gi,       replace: 'elegant form' },
  { pattern: /\btoned\s+(body|physique)\b/gi,  replace: 'active lifestyle look' },
  { pattern: /\bathletic\s+build\b/gi,         replace: 'energetic presence' },
  { pattern: /\bvoluptuous\b/gi,               replace: 'confident style' },
  { pattern: /\bsexy\s+(figure|body|curves)\b/gi, replace: 'stylish appearance' },
  { pattern: /\bpetite\s+(figure|frame)\b/gi,  replace: 'compact elegant frame' },
  { pattern: /\bbig\s+bust\b/gi,               replace: 'full upper body' },
  { pattern: /\blong\s+legs\b/gi,              replace: 'tall frame' },
  { pattern: /\bflat\s+(stomach|tummy|belly)\b/gi, replace: 'slender midsection' },
  { pattern: /\bwell[- ]proportioned\b/gi,     replace: 'balanced physique' },
  { pattern: /\bbody\s+curves\b/gi,            replace: 'natural silhouette' },
  { pattern: /\bfull\s+figure\b/gi,            replace: 'generous silhouette' },
];

// ==================== กลุ่ม B — Explicit Appearance Adjectives ====================
// คำคุณศัพท์บรรยายลักษณะที่ trigger Sexual / Vulgar filter
// Google safe alternative: "confident", "engaging", "dynamic"

export const APPEARANCE_ADJECTIVE_REWRITES = [
  { pattern: /\bsexy\b/gi,        replace: 'confident' },
  { pattern: /\bsultry\b/gi,      replace: 'expressive' },
  { pattern: /\bseductive\b/gi,   replace: 'engaging' },
  { pattern: /\bprovocative\b/gi, replace: 'dynamic' },
  { pattern: /\bsensual\b/gi,     replace: 'elegant' },
  { pattern: /\berotic\b/gi,      replace: 'stylish' },
  { pattern: /\bhot\b(?=\s+(?:woman|man|girl|guy|person|model))/gi, replace: 'stylish' },
  { pattern: /\bsteamy\b/gi,      replace: 'warm-toned' },
  { pattern: /\bflirty\b/gi,      replace: 'playful' },
  { pattern: /\bbusty\b/gi,       replace: 'full-figured' },
  { pattern: /\bskinny\b/gi,      replace: 'slender' },
  { pattern: /\bwaifish\b/gi,     replace: 'light-framed' },
];

// ==================== กลุ่ม C — Skin Color Descriptors ====================
// คำบรรยายสีผิวที่อาจ trigger Hate / Discrimination filter (code 57734940)
// Google Imagen/Veo ใช้ neutral tone descriptors แทน racial color terms
// อ้างอิง: TikTok ห้าม discriminatory content

export const SKIN_COLOR_REWRITES = [
  { pattern: /\bfair\s+skin(ned)?\b/gi,        replace: 'natural complexion' },
  { pattern: /\bwhite\s+skin(ned)?\b/gi,        replace: 'light complexion' },
  { pattern: /\bpale\s+skin(ned)?\b/gi,         replace: 'light complexion' },
  { pattern: /\bdark\s+skin(ned)?\b/gi,         replace: 'warm complexion' },
  { pattern: /\bbrown\s+skin(ned)?\b/gi,         replace: 'warm complexion' },
  { pattern: /\btan\s+skin(ned)?\b/gi,           replace: 'golden complexion' },
  { pattern: /\bolive\s+skin(ned)?\b/gi,         replace: 'warm olive complexion' },
  { pattern: /\bporcelain\s+skin\b/gi,           replace: 'smooth complexion' },
  { pattern: /\bglowing\s+white\s+skin\b/gi,     replace: 'radiant complexion' },
  { pattern: /\blight\s+skin(ned)?\b/gi,         replace: 'natural complexion' },
];

// ==================== กลุ่ม D — Clothing Exposure ====================
// คำบรรยายเสื้อผ้าที่อาจ trigger Sexual filter ของ Google Flow
// แทนด้วยคำ fashion industry

export const CLOTHING_EXPOSURE_REWRITES = [
  { pattern: /\brevealing\s+(outfit|clothing|dress|attire)\b/gi, replace: 'stylish outfit' },
  { pattern: /\btight[- ]fitting\b/gi,     replace: 'form-fitting' },
  { pattern: /\blow[- ]cut\b/gi,           replace: 'open neckline style' },
  { pattern: /\bskimpy\b/gi,               replace: 'minimal style' },
  { pattern: /\bexposed\s+midriff\b/gi,    replace: 'crop style' },
  { pattern: /\bbare\s+(shoulders|back|legs|arms)\b/gi, replace: 'open shoulder style' },
  { pattern: /\bsee[- ]through\b/gi,       replace: 'sheer fabric' },
  { pattern: /\bbackless\b/gi,             replace: 'open back style' },
  { pattern: /\bstrapless\b/gi,            replace: 'strapless style' },
  { pattern: /\bmicro\s+(skirt|dress|shorts)\b/gi, replace: 'mini style' },
];

// ==================== กลุ่ม E — Hard Remove (ไม่มีคำแทน) ====================
// คำที่ต้องลบออกทันที — ซ้ำซ้อนกับ GOOGLE_FLOW_HARD_BAN แต่เฉพาะใน character desc

export const BODY_DESC_HARD_REMOVE = [
  /\b(naked|nude|undressed|topless|bottomless|unclothed)\b/gi,
  /\b(explicit|NSFW|18\+)\b/gi,
  /\bsexuall?y\s+\w+/gi,
];

// ==================== รวมทุกกลุ่ม ====================
export const BODY_DESC_SAFE_REWRITES = [
  ...BODY_SHAPE_REWRITES,
  ...APPEARANCE_ADJECTIVE_REWRITES,
  ...SKIN_COLOR_REWRITES,
  ...CLOTHING_EXPOSURE_REWRITES,
];

// ==================== ฟังก์ชัน sanitize ====================

/**
 * sanitizeCharacterDesc — แทนที่คำบรรยายร่างกายอันตรายใน character description
 * ที่ AI สร้างจากการวิเคราะห์รูปภาพ reference
 *
 * @param {string} desc - คำบรรยายตัวละครที่ AI สร้าง
 * @returns {string} - คำบรรยายที่ปลอดภัยสำหรับ Google Flow
 */
export function sanitizeCharacterDesc(desc) {
  if (!desc || typeof desc !== 'string') return desc || '';
  let d = desc;

  // ขั้น 1: hard remove ก่อน
  for (const rx of BODY_DESC_HARD_REMOVE) {
    d = d.replace(rx, '');
  }

  // ขั้น 2: rewrite คำบรรยายตามกลุ่ม
  for (const { pattern, replace } of BODY_DESC_SAFE_REWRITES) {
    d = d.replace(pattern, replace);
  }

  // ขั้น 3: cleanup
  return d.replace(/\s{2,}/g, ' ').trim();
}

/**
 * ตัวอย่างการใช้:
 *
 * Input:  "young woman, long black hair, slim figure, fair skin, sexy curves, wearing revealing outfit"
 * Output: "young woman, long black hair, elegant posture, natural complexion, stylish appearance, wearing stylish outfit"
 *
 * Input:  "athletic man, toned body, tan skin, wearing tight-fitting shirt"
 * Output: "athletic man, active lifestyle look, golden complexion, wearing form-fitting shirt"
 */
