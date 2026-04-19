/**
 * PROMPT SCREENING SPEC (keep_partial จาก prompt-screening.js)
 * =============================================================
 * เก็บเฉพาะ: (1) ปรัชญาการ screening, (2) ชื่อ placeholder ที่ต้องเติม,
 *             (3) data model keys, (4) เงื่อนไข skip Gemini
 * ทิ้ง: fetch/cache/hash mechanics
 *
 * แหล่งที่มา: prompt-screening.js บรรทัด 1-170
 */

/**
 * ปรัชญาการ Screening (จาก comment บรรทัด 1-9):
 *
 * คัดกรอง prompt ก่อนส่งออกไป Google Gemini / Flow pipeline
 * ประหยัดค่า API:
 *  - แชต: เรียก Gemini screener เฉพาะข้อความ user ล่าสุดในรอบนั้น (ประวัติเก่าใช้แค่ local)
 *  - ข้ามรอบ Gemini ถ้าข้อความสั้น / local แก้แล้ว / ไม่มีสัญญาณเสี่ยงและไม่ยาวเกินเกณฑ์
 *  - แคชผล sanitize ซ้ำ (LRU)
 *  - ใช้ gemini-2.0-flash ก่อน (มักถูกกว่า) แล้วค่อย fallback
 */

// ==================== Import rules จากไฟล์ canonical (Option A — DRY) ====================
import { GOOGLE_FLOW_HARD_BAN } from './04-google-flow-policy.js';
import { BODY_DESC_HARD_REMOVE } from './03-body-desc-safe-rewrites.js';

/**
 * คำรุนแรง/อันตราย (ภาษาอังกฤษ) — ใช้ local screen ก่อนส่ง Gemini
 * ที่มา: สอดคล้องกับ GOOGLE_FLOW_HARD_BAN (04) แต่เก็บเป็น string สำหรับ fast contains-check
 */
export const VIOLENCE_AND_UNSAFE_EN = [
  // Violence / Dangerous — Google Imagen safety code 61493863, 62263041
  'kill', 'murder', 'blood', 'gore', 'weapon', 'gun', 'knife',
  'stab', 'shoot', 'explode', 'bomb', 'suicide', 'drug', 'narcotic',
  // Sexual / Nudity — Google Imagen safety code 90789179
  'naked', 'nude', 'sex', 'erotic', 'porn', 'nsfw', 'undressed', 'topless', 'bottomless',
  // Vulgar — Google Imagen safety code 32635315
  'fuck', 'shit', 'bitch', 'bastard', 'cunt',
  // Platform-banned (TikTok + Google Flow confirmed)
  'yourshop', 'YourShop', 'Your Shop',
];

/**
 * สัญญาณว่าควรให้ Gemini ช่วยวิเคราะห์ (ไม่พึ่งแค่ local)
 * Pattern เหล่านี้บ่งชี้ว่าข้อความอาจมี overclaim / misleading content
 * ที่ต้องการ Gemini ตรวจสอบเชิงความหมาย ไม่ใช่แค่ keyword match
 */
export const RISK_SNIPPETS = [
  /\b(guaranteed?|warranty|cure|treat|prevent|heal|diagnose|medical|clinical)\b/gi,
  /\b(lose \d+\s*kg|ลดน้ำหนัก \d+|burn fat|slim fast|weight loss)\b/gi,
  /\b(100%\s*(safe|effective|natural|guaranteed)|money.?back|no risk)\b/gi,
  /\b(cheapest|lowest price|best price in|limited time offer|act now)\b/gi,
  /\b(approved by|certified by|endorsed by|recommended by doctor|clinically proven)\b/gi,
  /\bfda[\s-]?approved\b/gi,
  /\b(no side effect|ไม่มีผลข้างเคียง|รับประกันผล|การันตี)\b/gi,
];

/**
 * คำ/รูปแบบที่ห้ามทุกช่องทาง (บทพูด + ข้อความบนภาพ + caption) — ลบออก
 * Import จาก canonical sources เพื่อไม่ให้กฎซ้ำซ้อนหรือขัดกัน
 */
export const HARD_BAN_REGEXES = [
  ...GOOGLE_FLOW_HARD_BAN,
  ...BODY_DESC_HARD_REMOVE,
];

// ==================== Data Model Keys ที่ต้อง screen ====================
// (จาก screenProductAnalysisObject บรรทัด 163)
// AI generate ข้อมูลเหล่านี้ → ต้อง screen ทุก field ก่อนใช้

export const SCREEN_PRODUCT_ANALYSIS_KEYS = [
  'appearance',     // คำบรรยายรูปลักษณ์สินค้า
  'features',       // คุณสมบัติ
  'targetAudience', // กลุ่มเป้าหมาย
  'usage',          // วิธีใช้
  'videoTips',      // เคล็ดลับทำวิดีโอ
  'summary_en',     // สรุปภาษาอังกฤษ
  'productType',    // ประเภทสินค้า
  'brand',          // แบรนด์
  'colorTone',      // โทนสี
];

// ==================== เงื่อนไข Skip Gemini Screener ====================
// ข้ามการเรียก Gemini เพื่อประหยัด cost เมื่อ:

export function shouldSkipGeminiCompliance(original, afterLocal) {
  if (!afterLocal || afterLocal.length <= 28) return true;  // ข้อความสั้นเกินไป
  if (afterLocal !== original) return true;                 // local แก้ไขแล้ว = ไม่จำเป็นต้องส่ง Gemini ซ้ำ
  if (afterLocal.length < 3200) return true;               // ข้อความไม่ยาวและไม่เสี่ยง
  return false;
}

// ==================== SCREENER MODELS (ถูก → แพง) ====================
// ใช้โมเดลราคาถูกก่อน fallback ไปแพงกว่าเมื่อจำเป็น
export const SCREENER_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
];

// ==================== GEMINI_SCREENER_SYSTEM ====================
// System prompt for Gemini compliance screening API calls
// Used by: geminiComplianceSanitize() in prompt-screening.js
export const GEMINI_SCREENER_SYSTEM = `You are a TikTok Shop and Google Flow content compliance expert.
Your job is to review the submitted content for policy violations and return a structured JSON response.

PLATFORMS: TikTok Shop (Thailand) + Google Flow (Imagen/Veo)

VIOLATION CATEGORIES to check:
1. HEALTH_CLAIM: Unverified medical/health claims (cure, treat, clinically proven, guaranteed results, ลดน้ำหนัก X กก, รักษา, รับประกันผล)
2. OVERCLAIM: Superlative claims without proof (best, #1, world's first, ดีที่สุดในโลก, อันดับ 1)
3. COMPETITOR: Mentioning competitor brand names or comparing directly
4. FORBIDDEN_PHRASE: TikTok Shop or Google Flow hard-banned phrases (see FORBIDDEN_MARKETING_PHRASES)
5. VIOLENCE_SEXUAL: Violent, sexual, or nudity-adjacent content
6. BODY_SHAME: Body description that may trigger image generation safety filters
7. PLATFORM_SPECIFIC: Mentioning other platforms (yourshop, Shopee, Lazada, etc.)

OUTPUT FORMAT (JSON only, no markdown):
{
  "pass": true|false,
  "issues": [
    { "type": "VIOLATION_CATEGORY", "text": "exact offending text", "severity": "hard|soft" }
  ],
  "suggested_fixes": [
    { "original": "original text", "replacement": "safer alternative" }
  ],
  "summary": "one sentence summary in Thai"
}

RULES:
- Return pass: true only if zero hard violations found
- Soft violations = flag but can still pass
- Keep suggested_fixes actionable and Thai-language where applicable
- Do NOT rewrite the entire content — only flag and suggest specific fixes`;

// ==================== PROMPT_CHECKER_MODES ====================
// 4 checker modes — each is a system prompt for checkScriptPolicy()
// Used by: checkScriptPolicy(script, mode) in sidepanel.js ~line 1700
export const PROMPT_CHECKER_MODES = {
  strict: {
    name: 'Strict TikTok Shop',
    description: 'ตรวจสอบตามนโยบาย TikTok Shop อย่างเข้มงวด',
    prompt: `You are a strict TikTok Shop Thailand content compliance checker.
Review the script for ANY violation of TikTok Shop advertising policies.

HARD VIOLATIONS (must flag, cannot pass):
- Unverified health/medical claims: cure, treat, heal, clinically proven, FDA approved
- Weight loss guarantees: "ลดได้ X กก", "ลดน้ำหนักได้ภายใน X วัน"
- Superlative guarantees: รับประกัน 100%, การันตีผล
- Competitor platform mentions: Shopee, Lazada, Line Shop, yourshop
- Violent, sexual, or discriminatory content
- False urgency with fabricated scarcity: "เหลือแค่ X ชิ้น" (if unverifiable)

SOFT VIOLATIONS (flag but allow with fix):
- Overclaims: "ดีที่สุด", "อันดับ 1" without proof
- Vague benefit claims: "ช่วยให้ดีขึ้น" without specifics

Return JSON: { "pass": true|false, "score": 0-100, "violations": [...], "fixes": [...] }`
  },
  balanced: {
    name: 'Balanced (Social + TikTok)',
    description: 'ตรวจสอบทั้ง TikTok Shop และ Social Media ทั่วไป',
    prompt: `You are a balanced content compliance checker for TikTok and general social media in Thailand.
Review the script for violations that would get content removed or demonetized.

CHECK FOR:
- TikTok Shop hard bans (health claims, competitor mentions, explicit guarantees)
- General social media issues: hate speech, misinformation, dangerous advice
- Thai legal concerns: false advertising under Consumer Protection Act

ALLOW:
- Emotional appeals and storytelling
- Lifestyle claims ("ทำให้รู้สึกดีขึ้น", "ชีวิตดีขึ้น") without medical framing
- Mild urgency ("อย่าพลาด", "โอกาสนี้")

Return JSON: { "pass": true|false, "score": 0-100, "violations": [...], "fixes": [...] }`
  },
  conversion: {
    name: 'Conversion-Safe',
    description: 'ปลอดภัยแต่ยังคงพลังการขาย',
    prompt: `You are a conversion-optimized content compliance checker.
Your goal: keep maximum sales power while ensuring the content is policy-safe.

APPROACH:
- Only flag violations that WILL cause removal or ad rejection
- Suggest fixes that preserve the persuasive intent
- Allow strong CTAs, urgency, and emotional hooks if factually supportable
- Prefer "soften and reframe" over "remove"

MUST FLAG: Medical claims, explicit result guarantees, competitor names, platform names
ALLOW: Strong opinions, lifestyle benefits, social proof framing, urgency without false scarcity

Return JSON: { "pass": true|false, "score": 0-100, "violations": [...], "fixes": [...] }`
  },
  thai: {
    name: 'Thai Market Safe',
    description: 'ตรวจสอบตามกฎหมายไทยและ TikTok Thailand',
    prompt: `You are a Thai market content compliance checker familiar with Thai consumer law and TikTok Thailand policies.

THAI-SPECIFIC RULES:
- พรบ.คุ้มครองผู้บริโภค: ห้ามโฆษณาเกินจริง, ห้ามอ้างสรรพคุณเกินจริง
- อย./สสส.: ห้ามโฆษณายา เครื่องสำอาง อาหารเสริม เกินขอบเขตที่ได้รับอนุญาต
- TikTok Thailand: ห้ามใช้คำว่า "รักษา", "รับประกัน", "ลดได้จริง X กก" โดยไม่มีหลักฐาน

CHECK:
- ภาษาไทยที่มีนัยเกินจริง: "หายขาด", "ดีขึ้น 100%", "ไม่มีผลข้างเคียง"
- การอ้างอิงที่ไม่มีหลักฐาน
- การเปรียบเทียบกับคู่แข่ง

Return JSON: { "pass": true|false, "score": 0-100, "violations": [...], "fixes": [...] }`
  }
};
