/**
 * CONTENT_CORE/13-image-video-prompt-templates.js
 * Image and Video generation prompt templates
 * Source: sidepanel.js lines 990–1162
 *
 * These templates are used in buildImagePrompt() and buildVideoPrompt()
 * Placeholders like [CHARACTER_PLACEHOLDER], [H1_PLACEHOLDER] etc. are
 * replaced at runtime with actual values.
 */

// ==================== IMAGE PROMPT TEMPLATES ====================

export const IMAGE_PROMPT_TEMPLATE = `[ART_STYLE_PLACEHOLDER]. [CHARACTER_PLACEHOLDER] is featured in a high-quality lifestyle environment suitable for the reference product's usage. The background context should be dynamic and varied, determined by the product itself. The background is blurred to keep focus on the subject. The character is positioned slightly lower in the frame to leave empty space at the top for text header. The character is holding or presenting the reference product in an engaging, enthusiastic manner suitable to the product's size and weight.

High quality, 4k, sharp focus on the product.

Add a professional graphic design text overlay positioned strictly at the top center of the frame (Header/Banner style).
The H1 headline [H1_PLACEHOLDER]
and H2 subtitle [H2_PLACEHOLDER]

should be rendered in a typography style and color palette that automatically matches the product's packaging. The text must be placed at the very top edge, clear of the character's face, using a layout that looks like a video title or headline.

Background style hint: [BACKGROUND_PLACEHOLDER]

⚠️ CRITICAL: Never render the literal text "H1" or "H2" in the image. Only render the actual headline content provided in the placeholders. The words "H1" and "H2" are just labels - display only the Thai text that follows them.

[VARIATION_PLACEHOLDER]`;

export const IMAGE_PROMPT_TEMPLATE_NO_TEXT = `[ART_STYLE_PLACEHOLDER]. [CHARACTER_PLACEHOLDER] is featured in a high-quality lifestyle environment suitable for the reference product's usage. The background context should be dynamic and varied, determined by the product itself. The background is blurred to keep focus on the subject. The character is holding or presenting the reference product in an engaging, enthusiastic manner suitable to the product's size and weight.

High quality, 4k, sharp focus on the product.

Background style hint: [BACKGROUND_PLACEHOLDER]

[VARIATION_PLACEHOLDER]`;

// ==================== VIDEO PROMPT TEMPLATES ====================

export const VIDEO_PROMPT_STEP1_VARIATIONS = [
  `The person shown in the reference image begins an enthusiastic product introduction to the camera. Match the voice to the person's appearance and gender. The person leans slightly forward with genuine excitement, making direct eye contact with the camera while holding the reference product confidently. High energy opening tone, as if starting a longer story about the product. Natural movement. Keep the camera relatively stable to ensure the text header at the top remains visible and readable.

⚠️ TEXT / FONT PRESERVATION (CRITICAL — MUST OBEY):
- DO NOT change, modify, animate, morph, re-render, or distort ANY text that appears in the reference image.
- The text overlay (headline, subtitle) MUST remain EXACTLY as-is: same font, same size, same color, same position, same language.
- Treat all on-screen text as a FROZEN STATIC LAYER — it must not move, wobble, fade, resize, or change in any way.
- If the text is in Thai, it MUST stay in Thai with the exact same characters. DO NOT re-generate or re-type the text.

AUDIO / SPEECH (CRITICAL):
- LANGUAGE: The character MUST speak in Thai only. DO NOT speak English or any other language.
- Match voice gender to the character's appearance
- Clear Thai pronunciation, native Thai tone, natural speaking speed`
];

export const VIDEO_PROMPT_STEP1 = {
  step: 2,
  action: "Frame_to_Video",
  tool: "VEO 3.1",
  prompt_text: VIDEO_PROMPT_STEP1_VARIATIONS[0],
  dialogue_script: "[SPEECH1_PLACEHOLDER]",
  technical_settings: {
    seed: 4294967295,
    consistency_mode: "strict_character_lock",
    camera_movement: "static_with_handheld_shake",
    negative_prompt: "English speech, wrong gender voice, text distortions, morphing text, font changes, font animation, changing font, text re-rendering, text wobble, text resize, subtitles, captions, watermarks, logos, graphical elements, blurry text, UI elements",
    audio_mode: "speech_only",
    audio_negative_prompt: "English, foreign language, music, background music, instrumental, ambient noise, sound effects, melody, wrong gender voice, male voice when female selected, female voice when male selected"
  }
};

export const VIDEO_PROMPT_STEP2_VARIATIONS = [
  `Visually continue the scene seamlessly. The character MUST speak in Thai only. Audio: The person immediately begins the new dialogue line exactly at the start of this clip, with zero overlap or repetition from the previous dialogue. Match the voice to the person's appearance and gender from the previous clip. The character MUST speak in Thai only. The person interacts with the product features (e.g., pointing at the ports, pressing a button, or showing the sleek design) to demonstrate usage, tilting it towards the camera lens. Then looks back at the camera with a satisfied, convincing nod. High energy tone. Maintain camera framing to keep the top header visible.

⚠️ TEXT / FONT PRESERVATION (CRITICAL — MUST OBEY):
- DO NOT change, modify, animate, morph, re-render, or distort ANY text that appears in the video.
- All text overlays MUST remain EXACTLY as-is: same font, same size, same color, same position, same language.
- Treat all on-screen text as a FROZEN STATIC LAYER — it must not move, wobble, fade, resize, or change in any way.
- If the text is in Thai, it MUST stay in Thai with the exact same characters. DO NOT re-generate or re-type the text.`
];

export const VIDEO_PROMPT_STEP2 = {
  step: 3,
  action: "Extend_Video",
  tool: "VEO 3.1",
  prompt_text: VIDEO_PROMPT_STEP2_VARIATIONS[0],
  dialogue_script: "[SPEECH2_PLACEHOLDER]",
  technical_settings: {
    seed: 4294967295,
    reference_mode: "extend_previous_clip",
    voice_consistency: "match_previous_clip_tone",
    camera_movement: "static_with_handheld_shake",
    negative_prompt: "English speech, wrong gender voice, text distortions, morphing text, font changes, font animation, changing font, text re-rendering, text wobble, text resize, subtitles, captions, watermarks, logos, graphical elements, blurry text, UI elements",
    audio_mode: "speech_only",
    audio_negative_prompt: "English, foreign language, music, background music, instrumental, ambient noise, sound effects, melody, wrong gender voice, male voice when female selected, female voice when male selected"
  }
};

// ==================== UGC CREATIVE SCENE TEMPLATES ====================
// สำหรับ Custom Prompt ที่ต้องการฉากสร้างสรรค์ (เช่น ซอมบี้, ซาฟารี, ปีกเครื่องบิน)
// ระบบจะแทนที่ placeholders: [PRODUCT_NAME], [PRODUCT_DESC], [SCENE_STYLE], [SCENE_ACTION],
// [SCENE_DETAILS], [CHARACTER_DESC], [H1_PLACEHOLDER], [SCENE_BG], [SHOT_TYPE], [SPEECH_PLACEHOLDER]

export const CREATIVE_SCENE_IMAGE_TEMPLATE = `สร้างภาพโฆษณาสินค้ามืออาชีพ สินค้า[PRODUCT_NAME] [PRODUCT_DESC]ตามภาพที่แนบไป สไตล์[SCENE_STYLE] ภาพรีวิวสินค้าขณะ[SCENE_ACTION] [SCENE_DETAILS] REAL HUMAN PHOTO มี[CHARACTER_DESC] ใช้งานสินค้า ใส่ข้อความภาษาไทยบนภาพว่า"[H1_PLACEHOLDER]" ฉาก[SCENE_BG] ถ่าย[SHOT_TYPE] single image, no collage, no multiple panels, no split screen Use the exact product appearance from the attached reference image (pd-product.png). The bold text overlay MUST be in Thai language (ภาษาไทย).`;

export const CREATIVE_SCENE_VIDEO_TEMPLATE = `[CHARACTER_DESC]พูดขายสินค้า [PRODUCT_NAME] [PRODUCT_DESC] [SCENE_ACTION] ถือสินค้าโชว์ บทพูดไทย "[SPEECH_PLACEHOLDER]" มุมกล้องตั้งนิ่งจนจบคลิป ใช้ฉากและการจัดวางตามภาพที่แนบ NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, All dialogue is AUDIO ONLY reduce contrast, natural skintone, soft highlights, no oversharpen, low contrast, soft colors, natural tone, film look, soft light`;

// ── Pixar 3D Character Templates (สำหรับตัวละครการ์ตูน 3D) ──

export const PIXAR3D_IMAGE_TEMPLATE = `Pixar 3D Animation style, vibrant colors, expressive characters, smooth rendering, Disney-quality lighting. [CHARACTER_NAME] - [CHARACTER_DESC], [POSE_DESC]. Background: [BG_DESC]. [SHOT_TYPE]. [PRODUCT_REFERENCE] No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.

[Character Reference: [CHARACTER_REFS]]`;

export const PIXAR3D_VIDEO_TEMPLATE = `ACTION ONLY: [CHARACTER_NAME] [ACTION_DESC], speaking with [VOICE_TYPE], lip movement synced to audio, MUST maintain consistent [VOICE_TYPE] throughout entire clip, do NOT switch voice gender. Only animate the existing characters from the image, do not add new characters or change their appearance. Character says in Thai with [VOICE_TYPE]: "[SPEECH_PLACEHOLDER]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`;

// ── Photorealistic Cinematic Templates (สำหรับฉากถ่ายจริง ASMR / คุณภาพสูง) ──

export const CINEMATIC_IMAGE_TEMPLATE = `Photorealistic cinematic style, natural lighting, high detail texture, realistic proportions, movie-quality visuals, 8K resolution. [CAMERA_ANGLE]. [CHARACTER_DESC]. [SCENE_SETUP]. [LIGHTING_DESC].

[Character Reference: [CHARACTER_REFS]]`;

export const CINEMATIC_VIDEO_TEMPLATE = `[CHARACTER_DESC] [ACTION_DESC]. [CAMERA_STYLE], [AUDIO_STYLE]. Realistic movement, natural motion. NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, stable form, no morphing`;

// ── Storybook / Voiceover Narration Templates (สำหรับนิทาน / เล่าเรื่อง) ──

export const STORYBOOK_IMAGE_TEMPLATE = `[VISUAL_STYLE]. [CHARACTER_NAME] - [CHARACTER_DESC]. Background: [BG_DESC]. [SHOT_TYPE]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.

[Character Reference: [CHARACTER_REFS]]`;

export const STORYBOOK_VIDEO_TEMPLATE = `ACTION ONLY: [CHARACTER_NAME] [ACTION_DESC]. [NARRATION_STYLE]., with [VOICE_TYPE] voiceover narration, MUST use [VOICE_TYPE] only, do NOT switch to different voice gender, NO lip sync, character does NOT speak, background narration only. Thai voiceover narrated by [VOICE_TYPE] says: "[SPEECH_PLACEHOLDER]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`;
