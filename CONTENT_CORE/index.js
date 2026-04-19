/**
 * CONTENT_CORE/index.js  — Barrel File (ประตูเดียว)
 * ====================================================
 * ทุก consumer import จากไฟล์นี้เสมอ
 * ไม่ว่าจะ split หรือ refactor ภายใน — import path ไม่เปลี่ยน
 *
 * Usage:
 *   import { HOOK_LIBRARY, VIDEO_STYLE_MAP, buildHookMasterPrompt } from './CONTENT_CORE/index.js'
 */

// ── 01  Forbidden Marketing Phrases ──────────────────────────────────────────
export { FORBIDDEN_MARKETING_PHRASES }                                   from './01-forbidden-marketing-phrases.js';

// ── 02  Master Prompt Template (split into 02a–02d for runtime efficiency) ──
// NOTE: 02-master-prompt-template.js ยังเก็บไว้เป็น reference ฉบับเต็ม (142K)
//       index.js ชี้ไปไฟล์ split เพื่อให้ runtime โหลดเฉพาะส่วนที่ต้องการ
export { ADAPTIVE_VIDEO_DIRECTOR_PROMPT }                                from './02a-director-prompt.js';
export {
  STYLE_OPTIONS,
  MOOD_KEYWORDS,
  PLATFORM_MODES,
  HOOK_LIBRARY,
  HOOK_CATEGORIES,
}                                                                        from './02b-hook-library.js';
export {
  VISUAL_STYLES,
  SCENE_TEMPLATES,
  DIALECTS,
  TONES,
  SCENE_LOCATIONS,
  PACINGS,
  SHOOTING_STYLES,
}                                                                        from './02c-visual-styles.js';
export {
  PROMPT_MODES,
  FILM_MODES,
  NEGATIVE_PROMPT,
  NO_TEXT_ENFORCEMENT,
  TIKTOK_CAPTION_REPAIR_PROMPT,
}                                                                        from './02d-tones-modes.js';

// ── 03  Body Description Safe Rewrites ───────────────────────────────────────
export {
  BODY_SHAPE_REWRITES,
  APPEARANCE_ADJECTIVE_REWRITES,
  SKIN_COLOR_REWRITES,
  CLOTHING_EXPOSURE_REWRITES,
  BODY_DESC_HARD_REMOVE,
  BODY_DESC_SAFE_REWRITES,
  sanitizeCharacterDesc,
}                                                                        from './03-body-desc-safe-rewrites.js';

// ── 04  Google Flow Policy ────────────────────────────────────────────────────
export {
  GOOGLE_FLOW_HARD_BAN,
  AUDIO_SAFE_REPLACEMENTS,
  GOOGLE_FLOW_LAYOUT_BAN,
  GOOGLE_FLOW_FORBIDDEN_WORDS,
  GOOGLE_FLOW_WORD_REPLACEMENTS,
  sanitizePromptForFlow,
  sanitizeDialogueForGoogleFlow,
}                                                                        from './04-google-flow-policy.js';

// ── 05  Prompt Screening Spec ─────────────────────────────────────────────────
export {
  VIOLENCE_AND_UNSAFE_EN,
  RISK_SNIPPETS,
  HARD_BAN_REGEXES,
  SCREEN_PRODUCT_ANALYSIS_KEYS,
  SCREENER_MODELS,
  GEMINI_SCREENER_SYSTEM,
  PROMPT_CHECKER_MODES,
  shouldSkipGeminiCompliance,
}                                                                        from './05-prompt-screening-spec.js';

// ── 06  UI Copy (split เป็น 06a–06e สำหรับ runtime efficiency) ───────────────
// NOTE: 06-ui-copy.js ยังเก็บไว้เป็น reference ฉบับเต็ม (1001 บรรทัด)
export {
  FEATURE_TABS,
  UI_COPY,
}                                                                        from './06a-tabs-core.js';
export {
  TOAST_MESSAGES,
  STATUS_MESSAGES,
}                                                                        from './06b-messages.js';
export {
  ERROR_MESSAGES,
  BUTTON_LABELS,
}                                                                        from './06c-errors-buttons.js';
export {
  PRODUCT_STATUS,
  BATCH_STATUS,
  CONFIRM_COPY,
}                                                                        from './06d-status-confirm.js';
export { UI_COPY_EXTENDED }                                              from './06e-extended.js';

// ── 07  Storymode Prompts ─────────────────────────────────────────────────────
export {
  getMinimalStorymodeSystemPrompt,
  getStorymodeSystemPromptForGenerate,
  getSystemPromptForSceneGeneration,
}                                                                        from './07-storymode-prompts.js';

// ── 08  Visual Style Templates ────────────────────────────────────────────────
export { getVisualStylePromptTemplates }                                 from './08-visual-style-templates.js';

// ── 09  V2 Prompts ────────────────────────────────────────────────────────────
export {
  buildV2ImagePrompt,
  buildV2VideoPrompt,
  buildV2ExtendPrompt,
  getV2TemplateSettings,
}                                                                        from './09-v2-prompts.js';

// ── 10  Random Pools ──────────────────────────────────────────────────────────
export {
  RANDOM_CHARACTERS,
  RANDOM_BACKGROUNDS,
  CHARACTER_STYLE_MAP,
  BACKGROUND_STYLE_MAP,
}                                                                        from './10-random-pools.js';

// ── 11  Studio Maps ───────────────────────────────────────────────────────────
export {
  formatMap,
  narrativeMap,
  moodMap,
  visualMap,
}                                                                        from './11-studio-maps.js';

// ── 12  Hook Master ───────────────────────────────────────────────────────────
export {
  HOOK_MASTER_SECTION,
  buildHookMasterPrompt,
  getEnhancedPrompt,
}                                                                        from './12-hook-master.js';

// ── 13  Image / Video Prompt Templates ───────────────────────────────────────
export {
  IMAGE_PROMPT_TEMPLATE,
  IMAGE_PROMPT_TEMPLATE_NO_TEXT,
  VIDEO_PROMPT_STEP1_VARIATIONS,
  VIDEO_PROMPT_STEP1,
  VIDEO_PROMPT_STEP2_VARIATIONS,
  VIDEO_PROMPT_STEP2,
  CREATIVE_SCENE_IMAGE_TEMPLATE,
  CREATIVE_SCENE_VIDEO_TEMPLATE,
  PIXAR3D_IMAGE_TEMPLATE,
  PIXAR3D_VIDEO_TEMPLATE,
  CINEMATIC_IMAGE_TEMPLATE,
  CINEMATIC_VIDEO_TEMPLATE,
  STORYBOOK_IMAGE_TEMPLATE,
  STORYBOOK_VIDEO_TEMPLATE,
}                                                                        from './13-image-video-prompt-templates.js';

// ── 14  Content Generation Prompts ────────────────────────────────────────────
export {
  CONTENT_PROMPT_NORMAL,
  CONTENT_PROMPT_EXTEND,
  CONTENT_PROMPT_NO_TEXT,
  CONTENT_PROMPT_NO_TEXT_EXTEND,
  TIME_VARIATIONS,
  MOOD_VARIATIONS,
  CAMERA_VARIATIONS,
  buildContentGenerationPrompt,
  buildImagePrompt,
  buildVideoPromptStep1,
  buildVideoPromptStep2,
}                                                                        from './14-content-gen-prompts.js';

// ── 15  Style Descriptor Maps ─────────────────────────────────────────────────
export {
  VIDEO_STYLE_MAP,
  SPEAKING_STYLE_MAP,
  VOICE_TONE_MAP,
  SCRIPT_STYLE_MAP,
  THAI_ART_STYLE_MAP,
  DIALOGUE_STYLE_MAP,
  PRODUCT_CATEGORY_MAP,
  HOOK_CATEGORY_MAP,
  DROPDOWN_OPTIONS,
}                                                                        from './15-style-descriptor-maps.js';

// ── 16  Pipeline Steps ────────────────────────────────────────────────────────
export {
  AUTOPOST_STEPS,
  STORY_STEPS,
  VIDEO_MODEL_TEXT_MAP,
  IMAGE_MODEL_TEXT_MAP,
}                                                                        from './16-pipeline-steps.js';

// ── 17  Platform Selectors ────────────────────────────────────────────────────
export {
  TIKTOK_CAPTION_SELECTORS,
  TIKTOK_UPLOAD_SELECTORS,
  TIKTOK_UPLOAD_READY_SELECTORS,
  YOUTUBE_UPLOAD_TARGETS,
  YOUTUBE_TITLE_SELECTORS,
  YOUTUBE_DESC_SELECTOR,
  YOUTUBE_TIME_SELECTORS,
  FACEBOOK_DROP_TARGETS,
  FACEBOOK_CAPTION_SELECTORS,
}                                                                        from './17-platform-selectors.js';
