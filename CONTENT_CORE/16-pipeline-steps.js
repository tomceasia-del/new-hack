/**
 * 16-pipeline-steps.js — Pipeline Step Definitions & Model Maps
 * ==============================================================
 * แหล่งที่มา: content-googleflow.js (lines 15–50, 4274–4285, 12813–12818)
 *
 * เนื้อหา:
 *   - AUTOPOST_STEPS  : 17 ขั้นตอนของ AutoPost pipeline (New Project → TikTok)
 *   - STORY_STEPS     : 7 ขั้นตอนของ Storymode scene pipeline
 *   - VIDEO_MODEL_TEXT_MAP : map ชื่อ Veo model key → ข้อความที่ Google Flow แสดง
 *   - IMAGE_MODEL_TEXT_MAP : map ชื่อ Imagen model key → ข้อความที่ dropdown แสดง
 */

// ── AutoPost Pipeline Steps (17 steps: Google Flow → TikTok) ──────────────────
export const AUTOPOST_STEPS = {
  step1_NewProject:       'step1: New Project',
  step2_SelectMode:       'step2: Select Image/Portrait/x1',
  step3_UploadImage:      'step3: Upload Image',
  step4_HoverAddPrompt:   'step4: Hover Image + Add to Prompt',
  step5_PastePrompt:      'step5: Paste Prompt',
  step6_Generate:         'step6: Generate',
  step7_WaitImage:        'step7: Wait for Image',
  step8_AddToVideoPrompt: 'step8: Add Image to Video Prompt',
  step9_PasteVideoPrompt: 'step9: Paste Video Prompt',
  step10_SelectVideo:     'step10: Select Video + Frames',
  step11_WaitVideo:       'step11: Wait for Video',
  step12_Download:        'step12: Download Video',
  step13_ClickExtend:     'step13: Click Video to Extend',
  step14_PasteExtend:     'step14: Paste Extend Prompt',
  step15_GenerateExtend:  'step15: Generate Extend',
  step16_WaitExtend:      'step16: Wait for Extended Video',
  step17_OpenTikTok:      'step17: Open TikTok Upload',
};

// ── Storymode Scene Pipeline Steps (7 steps per scene) ────────────────────────
export const STORY_STEPS = {
  step1_SelectMode:    'Scene Step 1: Select Image/Portrait/x1',
  step2_PastePrompt:   'Scene Step 2: Paste Image Prompt',
  step3_Generate:      'Scene Step 3: Click Generate',
  step4_AddToPrompt:   'Scene Step 4: Add Image to Prompt',
  step5_SelectVideo:   'Scene Step 5: Select Video Tabs',
  step6_GenerateVideo: 'Scene Step 6: Click Generate Video',
  step7_AddToScene:    'Scene Step 7: Add Video to Scene',
};

// ── Veo Video Model → UI Text Map ──────────────────────────────────────────────
// key คือ model slug ที่ extension ใช้
// value คือ array ของ text ที่ต้องหาใน Google Flow dropdown (case-insensitive)
export const VIDEO_MODEL_TEXT_MAP = {
  'veo_fast':        ['veo 3.1', 'fast'],
  'veo_quality':     ['veo 3.1', 'quality'],
  'veo_lite':        ['veo 2', 'lite'],
  'veo_lite_lower':  ['veo 2', 'lite', 'lower'],
  'veo_fast_lower':  ['veo 3.1', 'fast', 'lower'],
};

// ── Imagen/Image Model → UI Text Map ──────────────────────────────────────────
// key คือ model slug, value คือ array ของ text ที่ต้องหาใน dropdown
export const IMAGE_MODEL_TEXT_MAP = {
  'imagen_4':          ['imagen 4', 'imagen4'],
  'nano_banana_pro':   ['nano banana pro', 'banana pro'],
  'nano_banana_2':     ['nano banana 2', 'banana 2'],
};
