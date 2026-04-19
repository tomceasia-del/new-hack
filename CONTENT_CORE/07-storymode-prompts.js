/**
 * CONTENT_CORE/07-storymode-prompts.js
 * Storymode system prompt functions extracted from sidepanel.js
 * Source lines: getMinimalStorymodeSystemPrompt (6294), getStorymodeSystemPromptForGenerate (6316)
 */

// ==================== getMinimalStorymodeSystemPrompt ====================
// Lines 6294–6314 of sidepanel.js (21 lines)
// No external dependencies — returns a self-contained string.

export function getMinimalStorymodeSystemPrompt() {
  return `คุณคือ Creative Director สร้างสคริปต์ TikTok/Google Veo

OUTPUT FORMAT:
=== SCENE [N]: [NAME] ===
🔴 IMAGE PROMPT
\`\`\`
[english image prompt]
\`\`\`
🟢 VIDEO PROMPT
\`\`\`
[english video prompt with Thai dialogue]
\`\`\`

จบด้วย:
📝 VIRAL CAPTION
"[แคปชั่นไทย]"
#hashtags

RULES: image prompt ภาษาอังกฤษ, บทพูดภาษาไทย, prompt อยู่ใน code block เสมอ, ห้ามใส่ subtitle/text overlay ในวิดีโอ`;
}


// ==================== getStorymodeSystemPromptForGenerate ====================
// Lines 6317–6426 of sidepanel.js (110 lines)
// External variables read: VISUAL_STYLES, smVisualStyle, smStoryType,
//                          smOutputType, smMoodKeyword, smSceneCount
// visualStyleEngMap is a local const defined inside the function.

export function getStorymodeSystemPromptForGenerate() {
  const visualStyleEngMap = {
    'cinematic': 'Photorealistic cinematic style, natural lighting, high detail, realistic proportions, movie-quality visuals, 8K resolution',
    'disney': 'Pixar 3D Animation style, vibrant colors, expressive characters, smooth rendering, Disney-quality lighting',
    'ghibli': 'Studio Ghibli anime style, hand-drawn aesthetic, soft watercolor backgrounds, gentle lighting, Japanese animation',
    'claymation': 'Claymation stop-motion style, handmade clay texture, warm lighting, miniature set design',
    'crochet': 'Crochet knitted style, soft yarn texture, handmade aesthetic, cozy warm colors',
    'plushie': 'Plush toy style, soft fluffy fabric texture, cute kawaii aesthetic, studio photography',
    'papercut': 'Paper cut-out style, layered paper craft, handmade collage aesthetic, flat illustration',
    'dragonball': 'Dragon Ball anime style, dynamic action poses, bold linework, vibrant manga aesthetic',
    '90sanime': '90s anime style, cel-shaded, retro color palette, nostalgic Japanese animation',
    'gta': 'GTA loading screen style, bold illustration, saturated colors, urban aesthetic',
    'watercolor': 'Watercolor painting style, soft color blending, fluid brush strokes, artistic texture',
    'chalk': 'Chalk drawing style, blackboard texture, hand-drawn chalk aesthetic, vintage schoolboard',
    'oilpaint': 'Oil painting style, rich brush strokes, classical art aesthetic, Renaissance lighting',
    'popart': 'Pop Art style, bold primary colors, halftone dots, comic book aesthetic',
    'pixel': 'Pixel art style, 8-bit retro game aesthetic, blocky characters, limited color palette',
    'cyberpunk': 'Cyberpunk neon style, glowing lights, futuristic cityscape, dark with neon accents',
    'vector': 'Flat vector illustration, clean geometric shapes, minimal design, modern graphic style',
    'lego': 'LEGO brick style, plastic brick texture, blocky characters, toy photography aesthetic',
    'vaporwave': 'Vaporwave aesthetic, pastel purple-pink gradients, retro 80s-90s, glitch effects',
    'emoji': 'Emoji style, cute rounded icons, simple expressive faces, flat colorful design'
  };

  const visualId = VISUAL_STYLES.find(v => v.name === smVisualStyle)?.id || 'disney';
  const visualDesc = visualStyleEngMap[visualId] || visualStyleEngMap['disney'];

  const isProductAd = visualId === 'cinematic' && (smStoryType === 'product_review' || smStoryType === 'comparison' || smStoryType === 'tutorial');
  const isAnimated = ['disney', 'ghibli', 'claymation', 'crochet', 'plushie', 'dragonball', '90sanime', 'lego', 'pixel', 'emoji', 'popart', 'cyberpunk', 'vaporwave', 'papercut', 'gta', 'vector'].includes(visualId);
  const isCinematic = visualId === 'cinematic' || visualId === 'oilpaint' || visualId === 'watercolor' || visualId === 'chalk';
  const isFairytale = smStoryType === 'fairytale' || smStoryType === 'character_story';
  const isASMR = smStoryType === 'asmr';

  let imageTemplate, videoTemplate;

  if (isProductAd) {
    imageTemplate = `สร้างภาพโฆษณาสินค้ามืออาชีพ สินค้า[PRODUCT_NAME] [PRODUCT_DESCRIPTION] ตามภาพที่แนบไป สไตล์[CREATIVE_SCENARIO] [SCENE_DESCRIPTION] REAL HUMAN PHOTO มีสาววัยรุ่นคนไทย อายุ 20-25 ปีใช้งานสินค้า ใส่ข้อความภาษาไทยบนภาพว่า"[THAI_BOLD_TEXT]" [SCENE_SETTING] [CAMERA_DISTANCE] single image, no collage, no multiple panels, no split screen Use the exact product appearance from the attached reference image (pd-product.png). The bold text overlay MUST be in Thai language (ภาษาไทย).`;
    videoTemplate = `สาวไทยพูดขายสินค้า ([SCENE_NUM]) [PRODUCT_NAME] [PRODUCT_DESCRIPTION] [ACTION_IN_SCENE] ถือสินค้าโชว์ บทพูดไทย "[THAI_DIALOGUE]" มุมกล้องตั้งนิ่งจนจบคลิป ใช้ฉากและการจัดวางตามภาพที่แนบ NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, All dialogue is AUDIO ONLY reduce contrast, natural skintone, soft highlights, no oversharpen, low contrast, soft colors, natural tone, film look, soft light`;
  } else if (isASMR) {
    imageTemplate = `${visualDesc}. FIXED overhead/top-down camera angle (45-60°). [SCENE_DESCRIPTION]. [DETAILED_OBJECTS_AND_PROPS]. The full scene is visible from above, brightly illuminated by natural light.\n\n[Character Reference: [CHARACTER_REFS]]`;
    videoTemplate = `[ACTION_DESCRIPTION], overhead static camera (45-60°), ASMR sounds of [AMBIENT_SOUNDS], realistic movement, natural motion. NO speech, NO text, stable form, no morphing, no extra limbs`;
  } else if (isFairytale) {
    imageTemplate = `${visualDesc}. [CHARACTER_NAME] - [CHARACTER_DESCRIPTION]. Background: [BACKGROUND_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [ALL_CHARACTER_REFS]]`;
    videoTemplate = `ACTION ONLY: [CHARACTER_ACTION], with young Thai female voice voiceover narration, MUST use young Thai female voice only, do NOT switch to different voice gender, NO lip sync, character does NOT speak, background narration only. Thai voiceover narrated by young Thai female voice says: "[THAI_NARRATION]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`;
  } else if (isAnimated) {
    imageTemplate = `${visualDesc}. [CHARACTER_NAME] - [CHARACTER_DESCRIPTION], [CHARACTER_POSE_AND_EXPRESSION]. Background: [BACKGROUND_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [ALL_CHARACTER_REFS]]`;
    videoTemplate = `ACTION ONLY: [CHARACTER_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent young Thai female voice throughout entire clip, do NOT switch voice gender. Only animate the existing characters from the image, do not add new characters or change their appearance. Character says in Thai with young Thai female voice: "[THAI_DIALOGUE]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`;
  } else {
    imageTemplate = `${visualDesc}. [SCENE_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [CHAR_REFS]]`;
    videoTemplate = `ACTION ONLY: [CHARACTER_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent young Thai female voice throughout entire clip, do NOT switch voice gender. Character says in Thai with young Thai female voice: "[THAI_DIALOGUE]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`;
  }

  const outputTypeNote = smOutputType === 'image' ? 'สร้างเฉพาะ 🔴 IMAGE PROMPT เท่านั้น (ไม่ต้องมี VIDEO PROMPT)' :
                          smOutputType === 'video' ? 'สร้างเฉพาะ 🟢 VIDEO PROMPT เท่านั้น (ไม่ต้องมี IMAGE PROMPT)' :
                          'สร้างทั้ง 🔴 IMAGE PROMPT และ 🟢 VIDEO PROMPT ในทุกฉาก';

  return `คุณคือ Creative Director มืออาชีพสำหรับ TikTok / Google Veo สร้างสคริปต์วิดีโอสั้นที่มี prompt สำหรับสร้างภาพและวิดีโอ AI

═══ VISUAL STYLE ═══
สไตล์ที่ผู้ใช้เลือก: ${smVisualStyle}
English style directive: ${visualDesc}
ทุก prompt ต้องใช้สไตล์นี้เท่านั้น ห้ามเปลี่ยนสไตล์ระหว่างฉาก

═══ MOOD / TONE ═══
${smMoodKeyword}

═══ OUTPUT FORMAT (สำคัญมาก — ต้องตามนี้เป๊ะ) ═══

${outputTypeNote}

สำหรับแต่ละฉาก ใช้ format นี้:

=== SCENE [N]: [SCENE_NAME] ===

🔴 IMAGE PROMPT
\`\`\`
[image prompt ภาษาอังกฤษ ตามเทมเพลตด้านล่าง]
\`\`\`

🟢 VIDEO PROMPT
\`\`\`
[video prompt ภาษาอังกฤษ ตามเทมเพลตด้านล่าง — บทพูด/narration เป็นภาษาไทย]
\`\`\`

ท้ายสุดหลังฉากสุดท้าย:

📝 VIRAL CAPTION
"[แคปชั่นภาษาไทยสำหรับโพสต์ TikTok — ดึงดูด กระตุ้นให้ดู]"
#แฮชแท็ก1 #แฮชแท็ก2 #แฮชแท็ก3 #แฮชแท็ก4

═══ IMAGE PROMPT TEMPLATE ═══
${imageTemplate}

═══ VIDEO PROMPT TEMPLATE ═══
${videoTemplate}

═══ CRITICAL RULES ═══
1. Image prompt ต้องเป็นภาษาอังกฤษ (ยกเว้นข้อความ Thai bold text บนภาพ ถ้ามี)
2. Video prompt ต้องเป็นภาษาอังกฤษ ยกเว้นบทพูด/narration ที่ต้องเป็นภาษาไทย
3. บทพูดภาษาไทยต้องเป็นธรรมชาติ สนุก น่าสนใจ เหมือนคนไทยพูดจริง
4. ทุกฉากต้องใช้สไตล์ภาพเดียวกัน: ${visualDesc}
5. ห้ามใส่ subtitle, text overlay, captions ในวิดีโอ — dialogue เป็น AUDIO ONLY
6. Image ต้องเป็น single image, no collage, no multiple panels
7. ตัวละครต้อง consistent ทุกฉาก — หน้าตา เสื้อผ้า สไตล์เดียวกัน
8. ถ้ามี Character Reference ให้ใส่ท้าย image prompt ทุกฉาก
9. ถ้ามีสินค้า ต้องเห็นสินค้าชัดเจนในทุกฉาก
10. Scene header ต้องใช้ === SCENE N: NAME === เท่านั้น (สำคัญสำหรับ parser)
11. Prompt ต้องอยู่ใน code block (\`\`\`) เสมอ
12. จำนวนฉาก: ${smSceneCount} ฉาก
13. เสียงพูดต้องเป็น young Thai female voice เสมอ (ยกเว้น ASMR ที่ไม่มีเสียงพูด)`;
}


// ==================== visualStyleMap (from generateScenesFromMasterPrompt) ====================
// Source: sidepanel.js lines ~11631–11656 (inside generateScenesFromMasterPrompt)
// Note: This is a SEPARATE map from visualStyleEngMap above — used by the Studio pipeline,
//       not by the Storymode system prompt. Includes ugc_raw and thai_street which are
//       absent from visualStyleEngMap.

const visualStyleMap = {
  'cinematic': 'Real Cinematic photography style, film grain, dramatic lighting, Hollywood movie quality',
  'disney': 'High-end premium 3D studio animation style, vibrant saturated colors, expressive cartoon characters with big eyes, smooth 3D rendering, next-gen graphics render, masterpiece',
  'ghibli': 'Studio Ghibli anime style, hand-drawn aesthetic, soft watercolor backgrounds, gentle lighting, Japanese animation',
  'claymation': 'Claymation stop-motion style like Wallace & Gromit, tactile clay textures, handmade feel',
  'crochet': 'Amigurumi crochet style, everything made of yarn and wool, soft knitted textures',
  'plushie': 'Plushie felt toy style, fluffy soft textures, cute stuffed animal aesthetic',
  'papercut': 'Paper cutout stop-motion style, layered paper textures, craft aesthetic',
  'dragonball': 'Dragon Ball anime style, muscular characters, dynamic action poses, bold lines',
  '90sanime': '90s Japanese anime style like Sailor Moon, sparkly eyes, soft glowing lighting, retro anime',
  'gta': 'GTA loading screen art style, semi-realistic illustration with bold black outlines',
  'watercolor': 'Watercolor painting style, soft flowing colors, artistic brush strokes',
  'chalk': 'Chalk art style on blackboard, cafe chalkboard aesthetic',
  'oilpaint': 'Oil painting style, visible brush strokes, rich textures, classical art',
  'popart': 'Pop Art comic style, bold colors, halftone dots, Roy Lichtenstein inspired',
  'pixel': '8-bit pixel art style, retro video game aesthetic',
  'cyberpunk': 'Cyberpunk neon style, glowing neon lights, futuristic dark atmosphere',
  'vector': 'Vector flat illustration style, clean lines, modern app design aesthetic',
  'lego': 'LEGO brick style, everything made of LEGO blocks',
  'vaporwave': 'Vaporwave aesthetic, pink and purple tones, Greek statues, retro 80s',
  'emoji': 'Emoji icon style, round cute icons, simple colorful design',
  'ugc_raw': 'UGC raw unfiltered style, handheld phone camera, authentic unedited, REAL HUMAN PHOTO',
  'thai_street': 'Thai street food night market style, neon signs, steam and smoke, authentic Bangkok'
};


// ==================== Other prompt strings from generateScenesFromMasterPrompt ====================
// Source: sidepanel.js lines ~11656–11746
// These are assembled at runtime; preserved here for reference.

// Line 11656 — fallback when visualStyleMap lookup misses
const _FALLBACK_VISUAL_STYLE = 'High-end premium 3D studio animation style';

// Line 11657 — prefix prepended to every image prompt
// const visualStylePrefix = `[VISUAL STYLE: ${selectedVisualStyle}] `;

// Lines 11669–11693 — imagePrompt assembly fragments (runtime concatenation)
// imagePrompt  = `${selectedVisualStyle}, Scene ${sceneNum}: `
//             += `A character enthusiastically presenting and holding the product from the reference image. `  (product branch)
//             += `${mainPrompt}. `
//             += `Story context: ${storytelling}. `                                                            (storytelling branch)
//             += `High quality, 8K resolution, cinematic lighting, volumetric lighting, epic composition, no text, no watermark, no subtitles`

// Lines 11686–11693 — videoPrompt assembly fragments (runtime concatenation)
// videoPrompt  = `A high-quality ${studioSelectedVisual || 'cinematic'} style video clip (7-8 seconds). `
//             += `Scene ${sceneNum}: ${mainPrompt}. `
//             += `${storytelling}. `                                                                           (storytelling branch)
//             += `AUDIO: Thai language voice only. Natural Thai pronunciation. No English. No subtitles.`

// Line 11714 — TODO comment found above systemPrompt definition:
// // TODO: USER_PROMPT
// const systemPrompt = ``;   // <-- EMPTY — no content in source

// ==================== systemPrompt for generateScenesFromMasterPrompt ====================
// RECOMMENDATION: Replace `const systemPrompt = ''` (sidepanel.js ~line 11715) with:
//   const systemPrompt = getStorymodeSystemPromptForGenerate();
// or for a lightweight version:
//   const systemPrompt = getMinimalStorymodeSystemPrompt();
//
// generateScenesFromMasterPrompt() builds full visual context (selectedVisualStyle,
// format, narrative, mood) before calling the AI. Using getStorymodeSystemPromptForGenerate()
// provides complete storyboard output format rules matching the rest of the system.

export function getSystemPromptForSceneGeneration() {
  // Alias — use in generateScenesFromMasterPrompt to replace the empty systemPrompt
  return getStorymodeSystemPromptForGenerate();
}
