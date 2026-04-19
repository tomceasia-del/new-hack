/**
 * 17-platform-selectors.js — DOM Selectors for TikTok / YouTube / Facebook
 * =========================================================================
 * แหล่งที่มา:
 *   - content-tiktok-platform.js  (lines 264–325)
 *   - content-youtube.js          (lines 151, 188–193, 226–227, 327–335)
 *   - content-facebook.js         (lines 131–136, 158–165)
 *
 * เนื้อหา:
 *   CSS selector arrays ที่ extension ใช้หา element บน webpage แต่ละแพลตฟอร์ม
 *   เรียงจากแม่นยำที่สุด → fallback
 *
 * NOTE: selector เหล่านี้เปลี่ยนได้เมื่อแพลตฟอร์มอัปเดต UI — ควรทดสอบเป็นประจำ
 */

// ═══════════════════════════════════════════════════
//  TikTok Selectors
// ═══════════════════════════════════════════════════

// กล่องใส่ Caption (DraftJS editor) — เรียงจากแม่นยำ → fallback
export const TIKTOK_CAPTION_SELECTORS = [
  '.notranslate.public-DraftEditor-content[contenteditable="true"][role="combobox"]',
  '.public-DraftEditor-content[contenteditable="true"]',
  '[data-e2e="caption-editor"] [contenteditable="true"]',
  'div[contenteditable="true"][role="combobox"][spellcheck]',
  '[contenteditable="true"][role="textbox"]',
  'div[contenteditable="true"][spellcheck]',
];

// ปุ่ม/พื้นที่สำหรับ Upload video
export const TIKTOK_UPLOAD_SELECTORS = [
  'input[type="file"][accept*="video"]',     // Method 1: file input ที่รับ video
  'input[type="file"]',                       // Method 2: file input ทั่วไป
  '.upload-card',                             // Method 3: drag & drop zone
  '[class*="upload"]',
  '[data-e2e="upload-card"]',
];

// ตรวจว่าหน้า upload พร้อมแล้ว
export const TIKTOK_UPLOAD_READY_SELECTORS = [
  'input[type="file"][accept*="video"]',
  '[data-e2e="select_video_button"]',
  'button.upload-btn',
  '.upload-text-container',
];

// ═══════════════════════════════════════════════════
//  YouTube Selectors
// ═══════════════════════════════════════════════════

// พื้นที่ drag & drop video upload
export const YOUTUBE_UPLOAD_TARGETS = [
  '#drop-area',
  '[id*="upload"]',
  '.upload-dialog',
  'ytcp-uploads-dialog',
];

// กล่อง Title (fallback ถ้า textboxes[0] ไม่เจอ)
export const YOUTUBE_TITLE_SELECTORS = [
  '#textbox[aria-label*="title" i]',
  'ytcp-social-suggestions-textbox #textbox',
  '#title-textarea #textbox',
];

// กล่อง Description (fallback ถ้า textboxes[1] ไม่เจอ)
export const YOUTUBE_DESC_SELECTOR =
  '#textbox[aria-label*="description" i], #description-textarea #textbox';

// กล่องตั้ง Schedule Time
export const YOUTUBE_TIME_SELECTORS = [
  'ytcp-form-input-container input[aria-label*="time" i]',
  'input[aria-label*="time" i]',
  'input[aria-label*="เวลา" i]',
  '#time-of-day-trigger input',
];

// ═══════════════════════════════════════════════════
//  Facebook Selectors
// ═══════════════════════════════════════════════════

// พื้นที่ drag & drop video upload
export const FACEBOOK_DROP_TARGETS = [
  '[role="main"]',
  '[data-pagelet*="Reel"]',
  '[class*="upload"]',
  'form',
];

// กล่อง Caption / Description — เรียงจากแม่นยำ → fallback
export const FACEBOOK_CAPTION_SELECTORS = [
  '[contenteditable="true"][role="textbox"]',
  '[contenteditable="true"][data-lexical-editor]',
  'div[contenteditable="true"][spellcheck]',
  'div[contenteditable="true"]',
  'textarea',
];
