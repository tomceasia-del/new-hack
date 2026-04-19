/**
 * CONTENT_CORE/contracts.js  — Data Contracts & Safe Accessors
 * ==============================================================
 * Derives valid key sets directly from data (never hardcoded).
 * Provides safeGet() so runtime never crashes on missing keys.
 *
 * Usage:
 *   import { VALID_VIDEO_STYLES, safeGetStyle, safeGetMap } from './CONTENT_CORE/contracts.js'
 *   const label = safeGetStyle('videoStyle', item.videoStyle)
 */

import {
  VIDEO_STYLE_MAP,
  SPEAKING_STYLE_MAP,
  VOICE_TONE_MAP,
  SCRIPT_STYLE_MAP,
  THAI_ART_STYLE_MAP,
  DIALOGUE_STYLE_MAP,
  PRODUCT_CATEGORY_MAP,
  HOOK_CATEGORY_MAP,
  CHARACTER_STYLE_MAP,
  BACKGROUND_STYLE_MAP,
  HOOK_CATEGORIES,
  VISUAL_STYLES,
  TONES,
  formatMap,
  narrativeMap,
  moodMap,
  visualMap,
} from './index.js';

// ==================== VALID KEY SETS ====================
// Derived at import time — always in sync with actual data

/** Valid keys for item.videoStyle dropdown */
export const VALID_VIDEO_STYLES      = Object.keys(VIDEO_STYLE_MAP);

/** Valid keys for item.speakingStyle dropdown */
export const VALID_SPEAKING_STYLES   = Object.keys(SPEAKING_STYLE_MAP);

/** Valid keys for item.voiceType dropdown */
export const VALID_VOICE_TYPES       = Object.keys(VOICE_TONE_MAP);

/** Valid keys for item.scriptStyle dropdown */
export const VALID_SCRIPT_STYLES     = Object.keys(SCRIPT_STYLE_MAP);

/** Valid keys for item.thaiArtStyle dropdown */
export const VALID_THAI_ART_STYLES   = Object.keys(THAI_ART_STYLE_MAP);

/** Valid keys for item.dialogueStyle dropdown */
export const VALID_DIALOGUE_STYLES   = Object.keys(DIALOGUE_STYLE_MAP);

/** Valid keys for item.productCategory dropdown */
export const VALID_PRODUCT_CATS      = Object.keys(PRODUCT_CATEGORY_MAP);

/** Valid keys for item.hookCategory dropdown */
export const VALID_HOOK_CATS         = Object.keys(HOOK_CATEGORY_MAP);

/** Valid keys for item.character dropdown */
export const VALID_CHARACTERS        = Object.keys(CHARACTER_STYLE_MAP);

/** Valid keys for item.background dropdown */
export const VALID_BACKGROUNDS       = Object.keys(BACKGROUND_STYLE_MAP);

/** Valid FOMO/AUTHENTIC/OBSESSION/CURIOSITY category keys */
export const VALID_HOOK_CATEGORIES   = Object.keys(HOOK_CATEGORIES);

/** Valid visual style IDs from VISUAL_STYLES library */
export const VALID_VISUAL_STYLE_IDS  = VISUAL_STYLES.map(v => v.id);

/** Valid tone IDs from TONES library */
export const VALID_TONE_IDS          = TONES.map(t => t.id);

/** Valid studio format keys */
export const VALID_FORMAT_KEYS       = Object.keys(formatMap);

/** Valid studio narrative keys */
export const VALID_NARRATIVE_KEYS    = Object.keys(narrativeMap);

/** Valid studio mood keys */
export const VALID_MOOD_KEYS         = Object.keys(moodMap);

/** Valid studio visual keys */
export const VALID_VISUAL_KEYS       = Object.keys(visualMap);

// ==================== ALL MAPS (for generic lookup) ====================
// Unified map registry — use with safeGetMap(mapName, key)
export const ALL_STYLE_MAPS = {
  videoStyle:       VIDEO_STYLE_MAP,
  speakingStyle:    SPEAKING_STYLE_MAP,
  voiceType:        VOICE_TONE_MAP,
  scriptStyle:      SCRIPT_STYLE_MAP,
  thaiArtStyle:     THAI_ART_STYLE_MAP,
  dialogueStyle:    DIALOGUE_STYLE_MAP,
  productCategory:  PRODUCT_CATEGORY_MAP,
  hookCategory:     HOOK_CATEGORY_MAP,
  character:        CHARACTER_STYLE_MAP,
  background:       BACKGROUND_STYLE_MAP,
};

// ==================== SAFE ACCESSORS ====================
/**
 * Get a value from any style map safely.
 * Falls back to: ai_auto → first key → fallback string
 *
 * @param {'videoStyle'|'speakingStyle'|'voiceType'|'scriptStyle'|'thaiArtStyle'|'dialogueStyle'|'productCategory'|'hookCategory'|'character'|'background'} mapName
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 *
 * @example
 * safeGetMap('videoStyle', 'viral_tiktok')
 * // → 'ไวรัล TikTok - ฮุคเด็ด'
 *
 * safeGetMap('videoStyle', 'unknown_key')
 * // → 'AI เลือกให้อัตโนมัติ'  (fallback to ai_auto)
 */
export function safeGetMap(mapName, key, fallback = '') {
  const map = ALL_STYLE_MAPS[mapName];
  if (!map) return fallback;
  return map[key] ?? map['ai_auto'] ?? Object.values(map)[0] ?? fallback;
}

/**
 * Shorthand: get Thai label from any style map.
 * Equivalent to getStyleDescription() in sidepanel.js line 969.
 */
export function getStyleLabel(field, value) {
  return safeGetMap(field, value, value);
}

/**
 * Check if a key is valid in a given map.
 * @param {string} mapName
 * @param {string} key
 * @returns {boolean}
 */
export function isValidKey(mapName, key) {
  const map = ALL_STYLE_MAPS[mapName];
  return map ? Object.prototype.hasOwnProperty.call(map, key) : false;
}

/**
 * Sanitize an item's style fields — replace invalid keys with 'ai_auto'.
 * Prevents runtime errors from stale/unknown dropdown values.
 * @param {Object} item
 * @returns {Object} item with sanitized style fields
 */
export function sanitizeItemStyles(item) {
  const fields = Object.keys(ALL_STYLE_MAPS);
  const sanitized = { ...item };
  for (const field of fields) {
    if (sanitized[field] && !isValidKey(field, sanitized[field])) {
      console.warn(`[contracts] invalid ${field} key: "${sanitized[field]}" → fallback to ai_auto`);
      sanitized[field] = 'ai_auto';
    }
  }
  return sanitized;
}
