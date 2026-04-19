/**
 * Ported from `1click-full-v3.40 (2)/js/sidepanel.js`:
 * - `getStorymodeSystemPromptForGenerate` → `buildStorymodeSystemPromptFromPayload`
 * - User message shape aligned with `buildUserMessage`
 * - `GEMINI_MODEL_CHAIN` + `generateContent` (no `applyLocalScreenToGeminiRequestBody`)
 * Requires: `storymode-mock-enrich-bundle.js` (getMoodDirective, formatNarrativePromptsForMessage)
 */
(function () {
  'use strict';

  const STORY_TYPE_TEMPLATES = [
    { id: 'custom', name: 'กำหนดเอง (Custom)', icon: '✏️', description: 'ใส่หัวข้อเอง AI สร้างเรื่องให้อิสระ' },
    { id: 'product_review', name: 'รีวิวสินค้า UGC', icon: '📦', description: 'สาวไทยรีวิวสินค้าในสถานการณ์สุดครีเอท เน้นขายของ' },
    { id: 'brand_story', name: 'เล่าเรื่องแบรนด์', icon: '🏷️', description: 'สร้างเรื่องราวรอบแบรนด์/สินค้าอย่างมีอารมณ์' },
    { id: 'tutorial', name: 'สอนวิธีใช้ How-to', icon: '📖', description: 'สาธิตการใช้งานสินค้าทีละขั้นตอน' },
    { id: 'drama', name: 'มินิซีรีส์ ดราม่า', icon: '🎭', description: 'เรื่องสั้นมีพล็อต ตัวละคร ปมขัดแย้ง จบด้วยสินค้า' },
    { id: 'fairytale', name: 'นิทาน / เรื่องเล่า', icon: '📚', description: 'ตัวละครแฟนตาซีผจญภัย เล่าเรื่องด้วย voiceover' },
    { id: 'asmr', name: 'ASMR / Cinematic', icon: '🎧', description: 'เน้นภาพสวย เสียงบรรยากาศ ไม่มีบทพูด' },
    { id: 'comedy', name: 'ตลก / Skit', icon: '😂', description: 'สถานการณ์ตลกหักมุม จบด้วยสินค้าเป็น punchline' },
    { id: 'comparison', name: 'เปรียบเทียบ ก่อน-หลัง', icon: '⚡', description: 'แสดงปัญหา → ใช้สินค้า → ผลลัพธ์ที่ดีขึ้น' },
    { id: 'character_story', name: 'ตัวละคร Pixar / 3D', icon: '🏰', description: 'ตัวละคร 3D Animation เล่าเรื่องสนุก พูดไทย' }
  ];

  const visualStyleEngMap = {
    cinematic: 'Photorealistic cinematic style, natural lighting, high detail, realistic proportions, movie-quality visuals, 8K resolution',
    disney: 'Pixar 3D Animation style, vibrant colors, expressive characters, smooth rendering, Disney-quality lighting',
    ghibli: 'Studio Ghibli anime style, hand-drawn aesthetic, soft watercolor backgrounds, gentle lighting, Japanese animation',
    claymation: 'Claymation stop-motion style, handmade clay texture, warm lighting, miniature set design',
    crochet: 'Crochet knitted style, soft yarn texture, handmade aesthetic, cozy warm colors',
    plushie: 'Plush toy style, soft fluffy fabric texture, cute kawaii aesthetic, studio photography',
    papercut: 'Paper cut-out style, layered paper craft, handmade collage aesthetic, flat illustration',
    dragonball: 'Dragon Ball anime style, dynamic action poses, bold linework, vibrant manga aesthetic',
    '90sanime': '90s anime style, cel-shaded, retro color palette, nostalgic Japanese animation',
    gta: 'GTA loading screen style, bold illustration, saturated colors, urban aesthetic',
    watercolor: 'Watercolor painting style, soft color blending, fluid brush strokes, artistic texture',
    chalk: 'Chalk drawing style, blackboard texture, hand-drawn chalk aesthetic, vintage schoolboard',
    oilpaint: 'Oil painting style, rich brush strokes, classical art aesthetic, Renaissance lighting',
    popart: 'Pop Art style, bold primary colors, halftone dots, comic book aesthetic',
    pixel: 'Pixel art style, 8-bit retro game aesthetic, blocky characters, limited color palette',
    cyberpunk: 'Cyberpunk neon style, glowing lights, futuristic cityscape, dark with neon accents',
    vector: 'Flat vector illustration, clean geometric shapes, minimal design, modern graphic style',
    lego: 'LEGO brick style, plastic brick texture, blocky characters, toy photography aesthetic',
    vaporwave: 'Vaporwave aesthetic, pastel purple-pink gradients, retro 80s-90s, glitch effects',
    emoji: 'Emoji style, cute rounded icons, simple expressive faces, flat colorful design'
  };

  const PHOTOREAL_VISUAL_IDS = new Set([
    'real_cinematic',
    'hyper_realistic',
    'polaroid_snapshot',
    'thai_realistic_ghost',
    'thai_ancient_ghost',
    'hospital_ghost_realism',
    'forest_ghost_realism',
    'cctv_analog_horror',
    'cinematic_food_closeup',
    'minimal_product_studio',
    'thai_commercial_tv',
    'double_exposure'
  ]);

  function buildStorymodeSystemPromptFromPayload(payload, opts) {
    opts = opts || {};
    const smStoryType =
      opts.storyType || (payload.mode === 'product_sell' ? 'product_review' : 'custom');
    const smOutputType = opts.outputType || 'both';
    const smSceneCount = Number(payload.sceneCount) || 5;

    const vObj = (payload.visualStyles && payload.visualStyles[0]) || null;
    const visualId =
      (payload.visualStyleIds && payload.visualStyleIds[0]) || (vObj && vObj.id) || 'disney';
    const smVisualStyleDisplay = (vObj && vObj.name) || String(visualId);
    const visualDesc =
      visualStyleEngMap[visualId] ||
      visualStyleEngMap.disney ||
      '3D animated CGI feature film look, expressive characters, soft cinematic lighting.';

    const isProductAd =
      (visualId === 'real_cinematic' || visualId === 'cinematic') &&
      (smStoryType === 'product_review' ||
        smStoryType === 'comparison' ||
        smStoryType === 'tutorial');
    const isAnimated = visualId !== 'none' && !PHOTOREAL_VISUAL_IDS.has(visualId);
    const isFairytale = smStoryType === 'fairytale' || smStoryType === 'character_story';
    const isASMR = smStoryType === 'asmr';

    /* Phase 5 — resolve voice once, reuse in every video template */
    const resolvedVoice =
      (typeof resolveVoiceDirective === 'function')
        ? resolveVoiceDirective(payload)
        : { gender: 'female', voiceEn: 'young Thai female voice', voiceLabelTh: 'หญิง (default)', source: 'fallback' };
    const voiceEn = resolvedVoice.voiceEn;
    const voiceGenderBanTh = resolvedVoice.gender === 'male'
      ? 'ห้ามใช้เสียงผู้หญิงเด็ดขาด'
      : 'ห้ามใช้เสียงผู้ชายเด็ดขาด';

    /* Phase A — deterministic character card (token-efficient, single-clip lock).
     * Built from payload.prompt via keyword → role → defaults. No AI pre-pass. */
    const characterCardResult =
      (typeof buildCompactCharacterCard === 'function' && !isASMR)
        ? buildCompactCharacterCard(payload, resolvedVoice)
        : null;

    var imageTemplate;
    var videoTemplate;

    if (isProductAd) {
      imageTemplate =
        'สร้างภาพโฆษณาสินค้ามืออาชีพ สินค้า[PRODUCT_NAME] [PRODUCT_DESCRIPTION] ตามภาพที่แนบไป สไตล์[CREATIVE_SCENARIO] [SCENE_DESCRIPTION] REAL HUMAN PHOTO มีสาววัยรุ่นคนไทย อายุ 20-25 ปีใช้งานสินค้า ใส่ข้อความภาษาไทยบนภาพว่า"[THAI_BOLD_TEXT]" [SCENE_SETTING] [CAMERA_DISTANCE] single image, no collage, no multiple panels, no split screen Use the exact product appearance from the attached reference image (pd-product.png). The bold text overlay MUST be in Thai language (ภาษาไทย).';
      videoTemplate =
        'สาวไทยพูดขายสินค้า ([SCENE_NUM]) [PRODUCT_NAME] [PRODUCT_DESCRIPTION] [ACTION_IN_SCENE] ถือสินค้าโชว์ บทพูดไทย "[THAI_DIALOGUE]" มุมกล้องตั้งนิ่งจนจบคลิป ใช้ฉากและการจัดวางตามภาพที่แนบ NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, All dialogue is AUDIO ONLY reduce contrast, natural skintone, soft highlights, no oversharpen, low contrast, soft colors, natural tone, film look, soft light';
    } else if (isASMR) {
      imageTemplate =
        visualDesc +
        '. FIXED overhead/top-down camera angle (45-60°). [SCENE_DESCRIPTION]. [DETAILED_OBJECTS_AND_PROPS]. The full scene is visible from above, brightly illuminated by natural light.\n\n[Character Reference: [CHARACTER_REFS]]';
      videoTemplate =
        '[ACTION_DESCRIPTION], overhead static camera (45-60°), ASMR sounds of [AMBIENT_SOUNDS], realistic movement, natural motion. NO speech, NO text, stable form, no morphing, no extra limbs';
    } else if (isFairytale) {
      imageTemplate =
        visualDesc +
        '. [CHARACTER_NAME] - [CHARACTER_DESCRIPTION]. Background: [BACKGROUND_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [ALL_CHARACTER_REFS]]';
      videoTemplate =
        'ACTION ONLY: [CHARACTER_ACTION], with ' + voiceEn + ' voiceover narration, MUST use ' + voiceEn + ' only, do NOT switch to different voice gender, NO lip sync, character does NOT speak, background narration only. Thai voiceover narrated by ' + voiceEn + ' says: "[THAI_NARRATION]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs';
    } else if (isAnimated) {
      imageTemplate =
        visualDesc +
        '. [CHARACTER_NAME] - [CHARACTER_DESCRIPTION], [CHARACTER_POSE_AND_EXPRESSION]. Background: [BACKGROUND_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [ALL_CHARACTER_REFS]]';
      videoTemplate =
        'ACTION ONLY: [CHARACTER_ACTION], speaking with ' + voiceEn + ', lip movement synced to audio, MUST maintain consistent ' + voiceEn + ' throughout entire clip, do NOT switch voice gender. Only animate the existing characters from the image, do not add new characters or change their appearance. Character says in Thai with ' + voiceEn + ': "[THAI_DIALOGUE]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs';
    } else {
      imageTemplate =
        visualDesc +
        '. [SCENE_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [CHARACTER_REFS]]';
      videoTemplate =
        'ACTION ONLY: [CHARACTER_ACTION], speaking with ' + voiceEn + ', lip movement synced to audio, MUST maintain consistent ' + voiceEn + ' throughout entire clip, do NOT switch voice gender. Character says in Thai with ' + voiceEn + ': "[THAI_DIALOGUE]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs';
    }

    const outputTypeNote =
      smOutputType === 'image'
        ? 'สร้างเฉพาะ 🔴 IMAGE PROMPT เท่านั้น (ไม่ต้องมี VIDEO PROMPT)'
        : smOutputType === 'video'
          ? 'สร้างเฉพาะ 🟢 VIDEO PROMPT เท่านั้น (ไม่ต้องมี IMAGE PROMPT)'
          : 'สร้างทั้ง 🔴 IMAGE PROMPT และ 🟢 VIDEO PROMPT ในทุกฉาก';

    const moods =
      payload.moodKeywords && payload.moodKeywords.length
        ? payload.moodKeywords
        : ['Cinematic Standard'];
    const primaryMood = moods[0];
    const smMoodKeyword = moods.join(', ');
    var moodDirectiveEn = getMoodDirective(primaryMood);
    if (moods.length > 1) {
      moodDirectiveEn +=
        '\n\nAdditional mood labels to blend coherently: ' +
        moods
          .slice(1)
          .map(function (m) {
            return '"' + m + '"';
          })
          .join(', ');
    }

    const narrativeBlock = formatNarrativePromptsForMessage(payload.narrativeStyleIds || []);

    var moodSection = '═══ MOOD / TONE ═══\n' + smMoodKeyword + '\n';
    if (moodDirectiveEn) moodSection += 'English atmosphere: ' + moodDirectiveEn + '\n';

    var narrativeSection = '';
    if (narrativeBlock) {
      narrativeSection =
        '═══ NARRATIVE PERSONA (EN — follow strictly) ═══\n' + narrativeBlock + '\n';
    }

    const hasBlueprint =
      payload.mode === 'product_sell' &&
      payload.salesFormulaId &&
      typeof findSalesFormula === 'function' &&
      findSalesFormula(payload.salesFormulaId);

    const blueprintOverride = hasBlueprint
      ? (
          '\n═══════════════════════════════════════════════════════════\n' +
          '🔓 BLUEPRINT OVERRIDE (ปลดล็อคเฉพาะเมื่อมี SALES FORMULA BLUEPRINT):\n' +
          'ผู้ใช้เลือก Sales Formula แล้ว — blueprint คือแหล่งความจริงเดียวสำหรับโครงเรื่อง\n' +
          '⛔ DISABLE กฎต่อไปนี้ใน Adaptive Video Director เพราะขัดกับ blueprint:\n' +
          '  • กฎ SALES MODE "2 ซีนสุดท้ายต้องเป็นซีนขายของ/ปิดการขาย" — ยกเลิก\n' +
          '  • กฎ SHOPPERTAINMENT "การขายของใน 2 ซีนสุดท้าย" — ยกเลิก\n' +
          '  • REVIEW DIALOGUE AUTHENTICITY LOCK "แต่ละ Scene ต้องรีวิวคนละมุมของสินค้า" — ยกเลิก\n' +
          '  • PRODUCT IMAGE MODE "Dialogue ต้องเป็นบทพูดของตัวละครที่แนะนำ/รีวิว/ใช้สินค้า" — ยกเลิก (ใช้ dialogue ตาม blueprint)\n' +
          '✅ ENFORCE กฎใหม่จาก blueprint:\n' +
          '  1. ทำตาม scene role ที่ blueprint กำหนด เช่น\n' +
          '     - Scene Hook/Problem = ไม่พูดถึงสินค้า เล่าปัญหาให้คนดู relate\n' +
          '     - Scene Agitate = ขยี้ความเจ็บปวด ไม่ใช่เชียร์สินค้า\n' +
          '     - Scene Product/How It Works = แนะนำสินค้าเป็นทางออก\n' +
          '     - Scene Proof/Testimony = แสดงผลลัพธ์/รีวิว\n' +
          '     - Scene CTA = ปิดการขาย (ซีนสุดท้ายเท่านั้น ยกเว้น formula 1A-1E ที่ทุก beat อยู่ในซีนเดียว)\n' +
          '  2. STORY CONTINUITY 100% — ทุก scene ต้องต่อเนื่องเป็นเรื่องเดียวกัน ไม่ใช่รีวิวแยก\n' +
          '     - ตัวละครเดียวกัน สถานที่ต่อเนื่อง อารมณ์ไหลต่อ\n' +
          '     - Scene 2 ต่อจาก Scene 1 (ปัญหายังอยู่/ความรู้สึกเดิม)\n' +
          '     - Scene สุดท้ายเท่านั้นที่มี CTA\n' +
          '  3. CTA ใช้แค่ครั้งเดียวใน scene สุดท้ายตาม blueprint — ห้ามเชียร์ซื้อทุกซีน\n' +
          '  4. Dialogue ทำตาม beat blueprint เป๊ะๆ — ห้ามใช้ template "แนะนำ/รีวิว/ใช้สินค้า" ทุกซีน\n' +
          '  5. จำนวนซีนตาม blueprint.sceneCount (1-10 ซีน)\n' +
          '═══════════════════════════════════════════════════════════\n\n'
        )
      : '';

    const directorBlock =
      (typeof ADAPTIVE_VIDEO_DIRECTOR_PROMPT !== 'undefined' && ADAPTIVE_VIDEO_DIRECTOR_PROMPT)
        ? (
            ADAPTIVE_VIDEO_DIRECTOR_PROMPT +
            '\n\n' +
            '═══════════════════════════════════════════════════════════\n' +
            '⚠️ FORMAT OVERRIDE (สำคัญมาก — ใช้แทน Output Format ของ Adaptive Video Director ด้านบน):\n' +
            'โปรแกรมนี้มี parser ที่ต้องการ format แบบเฉพาะ ให้ข้าม Output Format ใน Director prompt\n' +
            'แล้วใช้ format ที่กำหนดใน "═══ OUTPUT FORMAT ═══" ด้านล่างเท่านั้น\n' +
            'กฎ Forbidden Words (OVERCLAIM), TTS-safe, Hook Master, Dialogue 15-20 คำ,\n' +
            'Human Anatomy Lock, Product Truth Lock ใน Director prompt ยังบังคับใช้ทุกข้อ\n' +
            '═══════════════════════════════════════════════════════════\n' +
            blueprintOverride
          )
        : '';

    return (
      directorBlock +
      'คุณคือ Creative Director มืออาชีพสำหรับ TikTok / Google Veo สร้างสคริปต์วิดีโอสั้นที่มี prompt สำหรับสร้างภาพและวิดีโอ AI\n\n' +
      '═══ VISUAL STYLE ═══\n' +
      'สไตล์ที่ผู้ใช้เลือก: ' +
      smVisualStyleDisplay +
      '\n' +
      'English style directive: ' +
      visualDesc +
      '\n' +
      'ทุก prompt ต้องใช้สไตล์นี้เท่านั้น ห้ามเปลี่ยนสไตล์ระหว่างฉาก\n\n' +
      moodSection +
      '\n' +
      narrativeSection +
      '═══ OUTPUT FORMAT (สำคัญมาก — ต้องตามนี้เป๊ะ) ═══\n\n' +
      outputTypeNote +
      '\n\nสำหรับแต่ละฉาก ใช้ format นี้:\n\n' +
      '=== SCENE [N]: [SCENE_NAME] ===\n\n' +
      '🔴 IMAGE PROMPT\n' +
      '```\n' +
      '[image prompt ภาษาอังกฤษ ตามเทมเพลตด้านล่าง]\n' +
      '```\n\n' +
      '🟢 VIDEO PROMPT\n' +
      '```\n' +
      '[video prompt ภาษาอังกฤษ ตามเทมเพลตด้านล่าง — บทพูด/narration เป็นภาษาไทย]\n' +
      '```\n\n' +
      'ท้ายสุดหลังฉากสุดท้าย:\n\n' +
      '📝 VIRAL CAPTION\n' +
      '"[แคปชั่นภาษาไทยสำหรับโพสต์ TikTok — ดึงดูด กระตุ้นให้ดู]"\n' +
      '#แฮชแท็ก1 #แฮชแท็ก2 #แฮชแท็ก3 #แฮชแท็ก4\n\n' +
      '═══ IMAGE PROMPT TEMPLATE ═══\n' +
      imageTemplate +
      '\n\n' +
      '═══ VIDEO PROMPT TEMPLATE ═══\n' +
      videoTemplate +
      '\n\n' +
      '═══ CRITICAL RULES ═══\n' +
      '1. Image prompt ต้องเป็นภาษาอังกฤษ (ยกเว้นข้อความ Thai bold text บนภาพ ถ้ามี)\n' +
      '2. Video prompt ต้องเป็นภาษาอังกฤษ ยกเว้นบทพูด/narration ที่ต้องเป็นภาษาไทย\n' +
      '3. บทพูดภาษาไทยต้องเป็นธรรมชาติ สนุก น่าสนใจ เหมือนคนไทยพูดจริง\n' +
      '4. ทุกฉากต้องใช้สไตล์ภาพเดียวกัน: ' +
      visualDesc +
      '\n' +
      '5. ห้ามใส่ subtitle, text overlay, captions ในวิดีโอ — dialogue เป็น AUDIO ONLY\n' +
      '6. Image ต้องเป็น single image, no collage, no multiple panels\n' +
      '7. ตัวละครต้อง consistent ทุกฉาก — หน้าตา เสื้อผ้า สไตล์เดียวกัน\n' +
      '8. ถ้ามี Character Reference ให้ใส่ท้าย image prompt ทุกฉาก\n' +
      '9. ถ้ามีสินค้า ต้องเห็นสินค้าชัดเจนในทุกฉาก\n' +
      '10. Scene header ต้องใช้ === SCENE N: NAME === เท่านั้น (สำคัญสำหรับ parser)\n' +
      '11. Prompt ต้องอยู่ใน code block (```) เสมอ\n' +
      '12. จำนวนฉาก: ' +
      smSceneCount +
      ' ฉาก\n' +
      '13. VOICE LOCK — เสียงพูดต้องเป็น "' + voiceEn + '" เสมอตลอดทุกซีน ' + voiceGenderBanTh + ' (ยกเว้น ASMR ที่ไม่มีเสียงพูด)\n' +
      '14. CHARACTER LOCK — ใช้ CHARACTER CARD ด้านล่างตรงตัว ทุกซีนเหมือนกัน (face/hair/outfit/voice)\n' +
      '\n' +
      (
        (characterCardResult && typeof buildCompactCardInjectionBlock === 'function')
          ? '\n' + buildCompactCardInjectionBlock(characterCardResult, payload) + '\n'
          : ''
      ) +
      (
        (payload.mode === 'product_sell' &&
          payload.hookCategory &&
          typeof HOOK_MASTER_SECTION !== 'undefined' &&
          payload.hookCategory !== 'auto')
          ? '\n\n═══ HOOK SELECTION (จาก HOOK LIBRARY ใน user message) ═══\n' + HOOK_MASTER_SECTION
          : ''
      ) +
      (
        payload.mode === 'product_sell'
          ? (
              '\n\n═══ PRODUCT SELL MODE — SALES RULES (บังคับเฉพาะโหมดขายสินค้า) ═══\n' +
              'A. PRODUCT PLACEHOLDER — ถ้าผู้ใช้ไม่ให้ชื่อสินค้าใน brief ให้ใช้ "[PRODUCT]" ในบทพูดและ image prompt ห้ามเดาชื่อสินค้าเอง\n' +
              'B. PRICE / PROMO SOFTENING — ห้ามพูดราคาเป็นตัวเลข เช่น "ลด 50%" "เหลือ 199" ให้เปลี่ยนเป็น emotional trigger:\n' +
              '   - "คุ้มจนงง" / "เสียดายมากถ้าพลาด" / "ถูกกว่าซื้อกาแฟสองแก้ว"\n' +
              '   - "โปรแบบนี้ไม่มีบ่อยๆ" / "ราคานี้วันนี้เท่านั้น"\n' +
              'C. TikTok CTA FORMAT — ประโยคปิด "ซีนสุดท้าย" ต้องเป็น TikTok-native ไม่ใช่ telesale:\n' +
              '   - "กดตะกร้าได้เลย" / "กดตะกร้าก่อนหมด"\n' +
              '   - "คอมเมนต์ว่าสนใจ" / "ส่งให้เพื่อนที่ต้องการ"\n' +
              '   - ห้ามใช้: "โทรสั่งเลย" / "ติดต่อสอบถาม" / "Inbox มาเลย"\n' +
              '   ⛔ CTA ใช้ครั้งเดียวในซีนสุดท้ายตาม blueprint ห้ามพูดปิดการขายทุกซีน\n' +
              'D. SHOT CHANGE MINIMUM — ทุก 8 วินาที ต้องเปลี่ยนมุมกล้อง/ช็อตอย่างน้อย 2 ครั้ง (pattern interrupt)\n' +
              '   ถ้า beat ใน blueprint กำหนดมา 3 beat/ฉาก = 3 shots — ต้องใช้ camera angle ต่างกันทั้งสามช็อต\n' +
              'E. FOLLOW BLUEPRINT — ถ้ามี "SALES FORMULA BLUEPRINT" ใน user message\n' +
              '   ต้องทำ Visual + Dialogue ของทุก beat ตามที่กำหนดเป๊ะๆ ห้ามข้าม ห้ามรวม beat\n' +
              '   Dialogue ของแต่ละ Scene = รวม beat ทั้งหมดใน Scene นั้น (15-20 คำต่อซีน)\n' +
              'F. STORY CONTINUITY 100% — ทุกซีนต้องเป็นเรื่องเดียวกันต่อเนื่อง\n' +
              '   - ตัวละครเดียวกันตลอด (ไม่เปลี่ยนหน้า/ชุด/ชื่อ)\n' +
              '   - สถานที่ต่อเนื่อง หรือ transition มีเหตุผล\n' +
              '   - อารมณ์ไหลต่อจากซีนก่อน (Scene 2 ต่อจาก Scene 1 ไม่ reset)\n' +
              '   - ถ้า formula มีขั้น Problem/Agitate → ซีนนั้นต้อง "เล่าปัญหา" ไม่ใช่รีวิวสินค้า\n' +
              'G. NO PER-SCENE SELLING — ห้ามเชียร์ซื้อ/พูดคำ CTA ในซีนที่ blueprint ไม่ได้สั่ง\n' +
              '   - Scene Hook/Problem = เน้นปัญหา อารมณ์ ไม่พูดถึงสินค้า\n' +
              '   - Scene Agitate = ขยี้ปัญหา ไม่เชียร์สินค้า\n' +
              '   - Scene Product/How-It-Works = แนะนำเป็นทางออก (ยังไม่ใช่ CTA)\n' +
              '   - Scene CTA = ปิดการขาย (ซีนสุดท้ายเท่านั้น)\n' +
              'H. OVERCLAIM GUARD ยังคงบังคับใช้ — ห้ามใช้คำในรายการ FORBIDDEN_MARKETING_PHRASES\n' +
              '   (ลดความอ้วน / หายขาด / ที่สุดในโลก / อย.รับรอง / ฯลฯ)'
            )
          : ''
      )
    );
  }

  function buildStorymodeUserMessageFromPayload(payload, opts) {
    opts = opts || {};
    const topic = (payload.prompt || '').trim();
    if (!topic) return '';

    const smStoryType =
      opts.storyType || (payload.mode === 'product_sell' ? 'product_review' : 'custom');
    const storyTypeObj = STORY_TYPE_TEMPLATES.find(function (t) {
      return t.id === smStoryType;
    });
    const hasBlueprintUser =
      payload.mode === 'product_sell' &&
      payload.salesFormulaId &&
      typeof findSalesFormula === 'function' &&
      findSalesFormula(payload.salesFormulaId);
    const storyTypeLabel = hasBlueprintUser
      ? 'โหมดขายสินค้า (เดินตาม Sales Formula Blueprint ด้านล่างเป๊ะๆ ไม่ใช่รีวิวคนละมุมต่อซีน)'
      : (storyTypeObj ? storyTypeObj.name + ' — ' + storyTypeObj.description : smStoryType);

    const narrativeLabel =
      payload.narrativeStyles && payload.narrativeStyles.length > 0
        ? payload.narrativeStyles
            .map(function (s) {
              return s.name;
            })
            .join(', ')
        : 'อัตโนมัติ (AI เลือกให้)';

    const vObj = (payload.visualStyles && payload.visualStyles[0]) || null;
    const visualLabel =
      payload.visualStyles && payload.visualStyles.length > 0
        ? payload.visualStyles
            .map(function (v) {
              return (v.icon || '') + ' ' + (v.en || v.name || v.id);
            })
            .join(' | ')
        : '(ไม่ได้เลือกสไตล์)';

    const moods =
      payload.moodKeywords && payload.moodKeywords.length
        ? payload.moodKeywords.join(', ')
        : 'Cinematic Standard';

    const smOutputType = opts.outputType || 'both';

    var msg = '═══ หัวข้อ / สินค้า ═══\n' + topic + '\n';

    /* Phase 4 — วาง Sales Formula Blueprint ไว้ "บนสุด" ก่อนกฎอื่นใดใน user message
     * เพื่อให้ Gemini อ่าน structure ก่อน แล้วค่อยนำไปปรับให้เข้ากับ inputs อื่น
     * Guard ด้วย mode + salesFormulaId เสมอ (storymode ข้ามทั้งก้อน) */
    if (
      payload.mode === 'product_sell' &&
      payload.salesFormulaId &&
      typeof buildSalesFormulaBlueprint === 'function'
    ) {
      const blueprintTop = buildSalesFormulaBlueprint(payload.salesFormulaId);
      if (blueprintTop) {
        msg += '\n═══ 🎯 SALES FORMULA BLUEPRINT (โครงสูตรหลัก — บังคับตามนี้ก่อนกฎอื่น) ═══\n';
        msg += blueprintTop + '\n';
        msg += '\n⚠️ Blueprint นี้เหนือกฎ "รีวิวคนละมุม", "2 ซีนสุดท้ายต้องปิดการขาย"\n';
        msg += '⚠️ Scene roles ใน blueprint คือโครงแน่นอน ทำตามเป๊ะ อย่าใส่ CTA ทุกซีน\n';
        msg += '⚠️ เนื้อเรื่องต้องต่อเนื่องเป็นเรื่องเดียว ตัวละครเดียว อารมณ์ไหลต่อ\n';
      }
    }

    msg += '\n═══ ประเภทเรื่อง ═══\n' + storyTypeLabel + '\n';
    msg += '\n═══ จำนวนฉาก ═══\n' + (Number(payload.sceneCount) || 5) + ' ฉาก\n';

    /* Phase A — short CHARACTER CARD reference in user message (token-efficient).
     * Full card is defined ONCE in the system prompt; here we just point back to it
     * so Gemini keeps character/voice consistent without re-sending ~80 tokens. */
    const userCardRv =
      (typeof resolveVoiceDirective === 'function') ? resolveVoiceDirective(payload) : null;
    const userCardResult =
      (typeof buildCompactCharacterCard === 'function' && userCardRv)
        ? buildCompactCharacterCard(payload, userCardRv)
        : null;
    if (userCardResult && typeof buildCardUserReference === 'function') {
      msg += '\n═══ CHARACTER & VOICE (see CHARACTER CARD in system) ═══\n';
      msg += buildCardUserReference(userCardResult) + '\n';
    }

    msg += '\n═══ สไตล์ภาพ ═══\n' + visualLabel + '\n';
    msg += '\n═══ อารมณ์ / Mood ═══\n' + moods + '\n';
    msg += '\n═══ แนวการเล่า ═══\n' + narrativeLabel + '\n';

    const primaryMood =
      (payload.moodKeywords && payload.moodKeywords[0]) || 'Cinematic Standard';
    const moodDirective = getMoodDirective(primaryMood);
    if (moodDirective) {
      msg += '\n═══ Mood directive (EN) ═══\n' + moodDirective + '\n';
    }
    const narrativeDirectives = formatNarrativePromptsForMessage(payload.narrativeStyleIds || []);
    if (narrativeDirectives) {
      msg +=
        '\n═══ Narrative persona directives (EN; follow strictly) ═══\n' +
        narrativeDirectives +
        '\n';
    }

    if (smOutputType !== 'both') {
      msg +=
        '\n═══ ประเภท Output ═══\n' +
        (smOutputType === 'image' ? 'สร้างเฉพาะรูปภาพ' : 'สร้างเฉพาะวิดีโอ') +
        '\n';
    }

    if (payload.mode === 'product_sell' && payload.hookCategory && payload.hookCategory !== 'auto') {
      const catObj = (typeof HOOK_CATEGORIES !== 'undefined' && HOOK_CATEGORIES[payload.hookCategory]) || null;
      const catLabel = catObj
        ? catObj.icon + ' ' + catObj.name + ' — ' + catObj.desc
        : payload.hookCategory;
      msg += '\n═══ ประเภท Hook ═══\n' + catLabel + '\n';
    }

    if (payload.mode === 'product_sell' && typeof buildHookMasterPrompt === 'function') {
      const hookBlock = buildHookMasterPrompt(payload.hookCategory, payload.usedHookIds || []);
      if (hookBlock) {
        msg += '\n═══ HOOK LIBRARY (เลือก 1 ฮุคเป็นบรรทัดแรก) ═══\n' + hookBlock + '\n';
      }
    }


    if (vObj && vObj.prompt) {
      msg +=
        '\n═══ Visual style directive (EN; image prefix) ═══\n' +
        vObj.prompt +
        '\n';
    }

    msg +=
      '\n═══ Text overlay (Scene 1) ═══\n' +
      (payload.textH1H2Enabled
        ? 'ต้องการข้อความ H1/H2 บนภาพฉากแรก (ระบุใน image prompt ตามความเหมาะสม)'
        : 'ไม่บังคับ H1/H2 บนภาพ') +
      '\n';

    const img = payload.images || {};
    const charNames = (img.characterNames && img.characterNames.length)
      ? img.characterNames
      : (img.characterName ? [img.characterName] : []);
    if (img.productAttached || img.characterAttached) {
      msg += '\n═══ รูปแนบ (ส่งภาพเป็น inlineData ให้ Gemini แล้ว) ═══\n';
      if (img.productAttached) msg += 'สินค้า: ' + (img.productName || '(attached)') + '\n';
      if (img.characterAttached) {
        msg += 'ตัวละคร (' + charNames.length + ' รูป): ' + (charNames.join(', ') || '(attached)') + '\n';
      }
      msg += 'ใช้ภาพแนบเป็น reference สำหรับสินค้า/ตัวละครในทุกฉาก ไม่ต้องเปลี่ยนหน้าตา/แพ็กเกจ\n';
    }

    msg += '\nสร้างสคริปต์ ' + (Number(payload.sceneCount) || 5) + ' ฉาก ตาม format ที่กำหนดเลย';

    return msg;
  }

  const GEMINI_MODEL_CHAIN = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-pro'
  ];

  /** Post-process Gemini text (same rules as direct client path). */
  function applyStorymodeSafetyToText(text) {
    var safetyReport = { sanitized: false, overclaimHits: [] };
    if (typeof sanitizePromptForFlow === 'function') {
      var cleaned = sanitizePromptForFlow(text);
      if (cleaned !== text) {
        safetyReport.sanitized = true;
        text = cleaned;
      }
    }
    if (typeof stripHardBannedPhrases === 'function') {
      text = stripHardBannedPhrases(text);
    }
    if (typeof stripForbiddenMarketing === 'function') {
      var marketing = stripForbiddenMarketing(text);
      safetyReport.overclaimHits = marketing.hits || [];
      if (safetyReport.overclaimHits.length > 0) {
        try {
          console.warn(
            '[Storymode Safety] Overclaim phrases detected in output:',
            safetyReport.overclaimHits
          );
        } catch (e) { /* ignore */ }
      }
    }
    return { text: text, safety: safetyReport };
  }

  /**
   * เมื่อ deploy บน Vercel + ตั้ง GEMINI_API_KEY — เรียก /api/gemini (ไม่ส่ง key ไป client)
   */
  async function mockFetchGeminiViaServer(systemPrompt, userText, images) {
    var r = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: systemPrompt,
        userText: userText,
        images: images || []
      })
    });
    var data = await r.json().catch(function () {
      return {};
    });
    if (!r.ok) {
      throw new Error(data.error || 'HTTP ' + r.status);
    }
    var rawText = data.text;
    var model = data.model;
    var truncated = !!data.truncated;
    var applied = applyStorymodeSafetyToText(rawText);
    return {
      text: applied.text,
      model: model,
      truncated: truncated,
      safety: applied.safety
    };
  }

  /**
   * @param {string} apiKey
   * @param {string} systemPrompt
   * @param {string} userText
   * @param {Array<{mimeType:string,data:string}>} [images] raw base64 (no "data:..." prefix); product first, then character refs
   */
  async function mockFetchGeminiStorymode(apiKey, systemPrompt, userText, images) {
    if (typeof window !== 'undefined' && window.__GEMINI_SERVER_MODE__) {
      return mockFetchGeminiViaServer(systemPrompt, userText, images);
    }
    const parts = [];
    if (Array.isArray(images) && images.length) {
      for (var ii = 0; ii < images.length; ii++) {
        var im = images[ii];
        if (im && im.data && im.mimeType) {
          parts.push({ inlineData: { mimeType: im.mimeType, data: im.data } });
        }
      }
    }
    parts.push({ text: userText });
    const contents = [{ role: 'user', parts: parts }];
    const requestBody = { contents: contents };
    if (systemPrompt && String(systemPrompt).trim()) {
      requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    var lastErr = null;
    for (var i = 0; i < GEMINI_MODEL_CHAIN.length; i++) {
      var model = GEMINI_MODEL_CHAIN[i];
      try {
        var body = JSON.parse(JSON.stringify(requestBody));
        if (!body.generationConfig) body.generationConfig = {};
        body.generationConfig.maxOutputTokens = 16384;
        body.generationConfig.temperature = 0.55;
        body.generationConfig.topP = 0.85;

        var url =
          'https://generativelanguage.googleapis.com/v1beta/models/' +
          model +
          ':generateContent?key=' +
          encodeURIComponent(apiKey);

        var response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.status === 429) {
          lastErr = new Error('429 rate limit');
          continue;
        }
        if (!response.ok) {
          var error = await response.json().catch(function () {
            return {};
          });
          var errMsg = (error.error && error.error.message) || 'HTTP ' + response.status;
          if (i < GEMINI_MODEL_CHAIN.length - 1 && response.status !== 401 && response.status !== 403) {
            lastErr = new Error(errMsg);
            continue;
          }
          throw new Error(errMsg);
        }

        var data = await response.json();
        var blockReason =
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

        var text =
          data &&
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text;
        if (!text) {
          var fr =
            (data.candidates && data.candidates[0] && data.candidates[0].finishReason) ||
            (data.promptFeedback && data.promptFeedback.blockReason) ||
            'unknown';
          throw new Error('Gemini ไม่ตอบกลับ (' + fr + ')');
        }

        /* Phase 3 — Safety Layer post-processing */
        var applied = applyStorymodeSafetyToText(text);
        text = applied.text;
        var safetyReport = applied.safety;

        return {
          text: text,
          model: model,
          truncated: data.candidates[0].finishReason === 'MAX_TOKENS',
          safety: safetyReport
        };
      } catch (e) {
        lastErr = e;
        if (i < GEMINI_MODEL_CHAIN.length - 1) continue;
        throw e;
      }
    }
    throw lastErr || new Error('Gemini: all models failed');
  }

  window.MockStorymodeGemini = {
    STORY_TYPE_TEMPLATES: STORY_TYPE_TEMPLATES,
    buildStorymodeSystemPromptFromPayload: buildStorymodeSystemPromptFromPayload,
    buildStorymodeUserMessageFromPayload: buildStorymodeUserMessageFromPayload,
    mockFetchGeminiStorymode: mockFetchGeminiStorymode,
    RESULT_STORAGE_KEY: 'storymodeMockGeminiResultV1'
  };
})();
