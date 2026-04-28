/**
 * Ported from `1click-full-v3.40 (2)/js/sidepanel.js`:
 * - `getStorymodeSystemPromptForGenerate` → `buildStorymodeSystemPromptFromPayload`
 * - User message shape aligned with `buildUserMessage`
 * - `GEMINI_MODEL_CHAIN` + `generateContent` (no `applyLocalScreenToGeminiRequestBody`)
 * Requires: `storymode-mock-enrich-bundle.js` (getMoodDirective, formatNarrativePromptsForMessage) —
 * ถ้า bundle ไม่มาหรือ global มองไม่เห็น ใช้ fallback ด้านล่าง
 */
(function () {
  'use strict';

  const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);

  /**
   * Bump when story prompt schema or pipeline rules change.
   * story-config-mock.html compares this to localStorage (not cookies) to drop stale hero analysis cache.
   */
  g.STORYMODE_PROMPT_ASSET_VERSION = 202604302;

  if (typeof g.getMoodDirective !== 'function') {
    g.getMoodDirective = function (moodKeyword) {
      if (!moodKeyword) return '';
      var map;
      try {
        map = typeof MOOD_LLM_DIRECTIVE_BY_KEYWORD !== 'undefined' ? MOOD_LLM_DIRECTIVE_BY_KEYWORD : void 0;
      } catch (e) {
        map = void 0;
      }
      if (map && map[moodKeyword]) return map[moodKeyword];
      return (
        'Match overall lighting, color grade, and pacing to this mood label: "' +
        moodKeyword +
        '". Keep visuals coherent and platform-safe.'
      );
    };
  }
  if (typeof g.formatNarrativePromptsForMessage !== 'function') {
    g.formatNarrativePromptsForMessage = function (styleIds) {
      if (!styleIds || !styleIds.length) return '';
      var map;
      try {
        map = typeof NARRATIVE_PROMPT_BY_STYLE_ID !== 'undefined' ? NARRATIVE_PROMPT_BY_STYLE_ID : void 0;
      } catch (e) {
        map = void 0;
      }
      if (map) {
        return styleIds
          .map(function (id) {
            var p = map[id];
            return p ? '[Style ' + id + '] ' + p : '';
          })
          .filter(function (l) {
            return l;
          })
          .join('\n\n');
      }
      return styleIds
        .map(function (id) {
          return '[Style ' + id + '] (narrative bundle not loaded)';
        })
        .join('\n\n');
    };
  }

  const getMoodDirective = g.getMoodDirective;
  const formatNarrativePromptsForMessage = g.formatNarrativePromptsForMessage;

  /**
   * คำโฆษณาต้องห้าม — ชุดเดียวกับ applyStorymodeSafetyToText หลังเจน (`stripForbiddenMarketing` จาก enrich-bundle)
   */
  function sanitizeStorymodeUserPlainText(text) {
    if (!text || typeof text !== 'string') return text || '';
    var fn =
      typeof g.stripForbiddenMarketing === 'function'
        ? g.stripForbiddenMarketing
        : typeof globalThis !== 'undefined' && typeof globalThis.stripForbiddenMarketing === 'function'
          ? globalThis.stripForbiddenMarketing
          : null;
    if (!fn) return text;
    try {
      return fn(text).text;
    } catch (err) {
      return text;
    }
  }

  if (typeof globalThis !== 'undefined' && typeof globalThis.stripForbiddenMarketing === 'function') {
    g.stripForbiddenMarketing = globalThis.stripForbiddenMarketing;
  }

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

  /**
   * กฎจำนวนคำต่อฉากเทียบกับ ~8 วินาทีต่อ clip (Flow / short-form) — ใส่ทั้ง system และ user
   * เพื่อกัน model มองข้ามบล็อก ADAPTIVE_VIDEO_DIRECTOR ที่ยาว/ถูก format override
   */
  function buildDialogueWordBudgetThai(isASMR, where) {
    if (isASMR) {
      if (where === 'user') {
        return (
          '═══ บทพูด / เสียง ═══\n' +
          'โหมด ASMR: ห้าม dialogue — ใช้เฉพาะเสียงบรรยากาศ/SFX ตามกฎ system\n' +
          '\n'
        );
      }
      return (
        '═══ DIALOGUE (ASMR) ═══\n' +
        'โหมด ASMR: ห้ามบทพูด (Dialogue) — ตาม Adaptive Video Director / STRICT ASMR PROTOCOL\n' +
        '\n'
      );
    }
    if (where === 'user') {
      return (
        '═══ กฎความยาวบทพูด (บังคับ — ทุกฉาก) ═══\n' +
        '• แต่ละฉาก = วิดีโอสั้น **~8 วินาที/clip (Flow)** — บทพูดหรือพากย์ภาษาไทย **15-20 คำต่อ 1 ฉาก** (นับ **รวม** dialogue ทั้งฉาก; รวมทุก beat ในฉากนั้น)\n' +
        '• ห้าม **น้อยกว่า 15 คำ** หรือ **เกิน 20 คำ** ใน dialogue ฉากเดียว — นับก่อน finalize; ถ้าเกินให้ **ตัดย่อ**; ถ้าไม่ถึง 15 ให้เติมให้ครบโดยยังสั้น-กระแทก\n' +
        '• ออกแบบบทให้ TTS/พูด **จบภายใน ~8 วิ** — ห้ามรัวยาว; รายละเอียดเพิ่มใน **ภาพ/แอคชัน** ไม่ใช่ยืดบทพูด\n' +
        '• หากมี **Sales Blueprint** หลาย beat ใน 1 ฉาก: **รวมนับ 15-20 คำทั้งฉาก** ห้ามถือแต่ละ beat เป็น 15-20 กล่องแยก\n' +
        '\n'
      );
    }
    return (
      '═══ DIALOGUE WORD BUDGET (8s clip / ฉาก) — บังคับก่อนกฎ “บทยาว/เล่าเยอะ” อื่น ═══\n' +
      '1) มาตรฐาน **Google Flow / คลิปสั้น: ~8 วินาทีต่อฉาก** — บทพูด/พากย์ภาษาไทย = **15-20 คำต่อฉาก** ตรงกับบรรทัด "Flow (8วิ): 15-20 คำ" ใน Director prompt\n' +
      '2) **นับรวมทุก** ก้อน dialogue, lip-sync, narration ไทยในฉากเดียว ถ้า blueprint รวมหลาย beat ในซีนเดียว → ยอด **รวม** ต้องอยู่ 15-20 คำ/ฉาก ไม่ใช่ 15-20 คำต่อ beat\n' +
      '3) **นับก่อน** ส่ง output: น้อยกว่า 15 หรือ เกิน 20 ถือว่า fail — แก้/ตัด/รวมประโยค แล้วส่งรอบสุดท้ายเท่านั้น\n' +
      '4) ห้ามใช้กฎ "2-4 ประโยค", "ยืดยาว" ฯลฯ มา **แทน** ข้อนี้ — ข้อ 15-20 คำ/8 วิ/ฉาก มี **ลำดับสูงกว่า** brief ยาวของ user\n' +
      '\n'
    );
  }

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
        'สาวไทยพูดขายสินค้า ([SCENE_NUM]) [PRODUCT_NAME] [PRODUCT_DESCRIPTION] [ACTION_IN_SCENE] ถือสินค้าโชว์ บทพูดไทย "[THAI_DIALOGUE]" มุมกล้องตั้งนิ่งจนจบคลิป ใช้ฉากและการจัดวางตามภาพที่แนบ NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, All dialogue is AUDIO ONLY reduce contrast, natural skintone, soft highlights, no oversharpen, low contrast, soft colors, natural tone, film look, soft light. End with Speaker: (one voice) and Dialogue: line. If another person is visible, they are silent (no second voice) for this line.';
    } else if (isASMR) {
      imageTemplate =
        visualDesc +
        '. FIXED overhead/top-down camera angle (45-60°). [SCENE_DESCRIPTION]. [DETAILED_OBJECTS_AND_PROPS]. The full scene is visible from above, brightly illuminated by natural light. Describe every visible person/object per HERO BIBLE — full in-scene text, not "see HERO BIBLE" shortcuts.';
      videoTemplate =
        '[ACTION_DESCRIPTION], overhead static camera (45-60°), ASMR sounds of [AMBIENT_SOUNDS], realistic movement, natural motion. NO speech, NO text, stable form, no morphing, no extra limbs';
    } else if (isFairytale) {
      imageTemplate =
        visualDesc +
        '. [CHARACTER_NAME] - [CHARACTER_DESCRIPTION]. Background: [BACKGROUND_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK. Paste full HERO BIBLE look for this character in this frame (not a "reference line" only).';
      videoTemplate =
        'ACTION ONLY: [CHARACTER_ACTION], Thai narration. Voice: match the narrator identity in the HERO BIBLE (age/gender/persona) — not a one-size-fits-all default. NO lip sync if narration-only. Thai voiceover says: "[THAI_NARRATION]" (exact wording lock). NO subtitles or on-screen text. AUDIO ONLY, stable form, no morphing, no extra limbs. End with Speaker: (Narrator or role) and Dialogue: — only that voice; other visible characters silent for this line.';
    } else if (isAnimated) {
      imageTemplate =
        visualDesc +
        '. [CHARACTER_NAME] - [CHARACTER_DESCRIPTION], [CHARACTER_POSE_AND_EXPRESSION]. Background: [BACKGROUND_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK. Full in-scene appearance text per HERO BIBLE; repeat on every new shot if the same character appears.';
      videoTemplate =
        'ACTION ONLY: [CHARACTER_ACTION], lip movement synced to Thai: "[THAI_DIALOGUE]". TTS/voice: match each Speaker in HERO BIBLE (age, gender, persona) — do NOT default every line to a single global voice if characters differ. One speaker per 8s clip/line; lock Thai dialogue text exactly. If other ROLE_ appear in action text, they are visual only for this line — no second voice, no lip-sync to this dialogue except the Speaker. NO subtitles, NO on-screen text. AUDIO ONLY, stable form, no morphing, no extra limbs. End with Speaker: and Dialogue: lines.';
    } else {
      imageTemplate =
        visualDesc +
        '. [SCENE_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK. Describe characters at full HERO BIBLE detail when visible; no "[Character Ref]" one-liners only.';
      videoTemplate =
        'ACTION ONLY: [CHARACTER_ACTION], lip-sync Thai: "[THAI_DIALOGUE]". Voice: match the speaking character from HERO BIBLE (Speaker line). Lock hero NAMES and this dialogue string exactly. Any other person on screen: silent, no lip-sync to this line. NO default voice trope; NO subtitles, NO on-screen text. AUDIO ONLY, stable form, no morphing, no extra limbs. End with Speaker: and Dialogue: — do not infer speaker from first ROLE_ in the action if it conflicts with Speaker.';
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

    const voiceOnlyNoMusicSfxBlock = isASMR
      ? (
          '═══ AUDIO (โหมด ASMR) ═══\n' +
          'ใช้ ambient / ASMR ตาม VIDEO TEMPLATE ด้านบนเท่านั้น — **ห้าม** Thai dialogue / narration\n\n'
        )
      : (
          '═══ AUDIO — Thai voice-only (บังคับทุกโหมดที่มี Dialogue; ยกเว้น ASMR) ═══\n' +
          'ห้าม **background music**, เพลงประกอบ, jingle, beat, soundtrack, muzak ใน IMAGE หรือ VIDEO prompt\n' +
          'ห้าม **sound effects** (SFX, stinger, foley, whoosh, transition hit, ambience bed) แยกจากเสียงพูด — ให้เหลือ **เสียงพูด/เล่าไทยเป็นหลักเท่านั้น**\n' +
          'ทุกฉากที่มี `Speaker` + `Dialogue` ให้จบท้าย 🟢 VIDEO ด้วยบรรทัดสรุป: **Audio: Thai voice-only. No music. No SFX.**\n\n'
        );

    var factoryDnaAugmentation = '';
    if (
      payload.mode === 'storymode' &&
      payload.factoryDna &&
      typeof payload.factoryDna === 'object' &&
      Object.keys(payload.factoryDna).length > 0
    ) {
      factoryDnaAugmentation =
        '\n\n═══ FACTORY / WAREHOUSE STYLE DNA (user-provided clone reference) ═══\n' +
        'The user message includes JSON **FACTORY DNA (v1)** — distilled from TikTok warehouse-style posts (post text + cover/thumbnail style cues + sales-voice analysis).\n' +
        'Use it as the **primary creative reference** for tone, pacing, hook/close rhythm, visual vibe, and product-talk patterns.\n' +
        'The brief under "หัวข้อ / สินค้า" may be short bullets (product, angles for this run). DNA carries clone signals only — **do not** expect or require per-scene JSON objects from the user.\n' +
        'It must **not** override: (1) Dialogue word budget per scene (~8s clip / 15–20 Thai words), (2) OUTPUT FORMAT below, (3) Thai voice-only audio rule (no BGM/SFX in prompts), (4) forbidden marketing / overclaim policies.\n' +
        'Do **not** paste DNA JSON into the final script output — translate into concrete IMAGE/VIDEO prompts and Thai `Dialogue` lines only.\n\n';
    }

    return (
      directorBlock +
      factoryDnaAugmentation +
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
      'ท้าย block นี้ทุกฉาก (parser + TTS) บังคับ 2 บรรทัด — อันดับเสียง: Speaker นี้ก่อน ROLE_ อื่นในส่วน ACTION/ภาพ)\n' +
      'Speaker: (ROLE_... หรือ ฉลากผู้พูด หนึ่งคน/ฉาก — คือ "ใครออกเสียง" หลัก)\n' +
      'Dialogue: "..." (บทไทยเดียวต่อฉาก 15-20 คำ)\n' +
      'ถ้า ACTION/ภาพอธิบายหลาย ROLE_ ให้ถือ Speaker/Dialogue นี้เป็นหลักเสียง; อีกคน/ตัว = เงียบ/ไม่ lip-sync กับบทนี้\n' +
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
      buildDialogueWordBudgetThai(isASMR, 'system') +
      voiceOnlyNoMusicSfxBlock +
      '═══ CRITICAL RULES ═══\n' +
      '1. Image prompt ต้องเป็นภาษาอังกฤษ (ยกเว้นข้อความ Thai bold text บนภาพ ถ้ามี)\n' +
      '2. Video prompt ต้องเป็นภาษาอังกฤษ ยกเว้นบทพูด/narration ที่ต้องเป็นภาษาไทย\n' +
      '3. บทพูดภาษาไทยต้องเป็นธรรมชาติ สนุก น่าสนใจ — และ **ยึด 15-20 คำ/ฉาก (~8 วิ)** ตามบล็อก "DIALOGUE WORD BUDGET" ทันทีก่อน/เหนือรายละเอียด style\n' +
      '4. ทุกฉากต้องใช้สไตล์ภาพเดียวกัน: ' +
      visualDesc +
      '\n' +
      '5. ห้ามใส่ subtitle, text overlay, captions ในวิดีโอ — dialogue เป็น AUDIO ONLY\n' +
      '6. Image ต้องเป็น single image, no collage, no multiple panels\n' +
      '7. ตัวละครต้อง consistent ทุกฉาก — หน้า เสื้อผ้า สไตล์เดียวกัน; ย้ำรายละเอียดเต็มต่อฉาก ห้ามอ้าง "same as HERO BIBLE" แทนคำบรรยาย\n' +
      '8. ห้ามแทนร่างตัวละครด้วยบรรทัด [Character Reference] อย่างเดียว — บรรยายตาม HERO BIBLE ในช่อง image prompt ของฉากนั้น\n' +
      '9. ถ้ามีสินค้า ต้องเห็นสินค้าชัดเจนในทุกฉาก\n' +
      '10. Scene header ต้องใช้ === SCENE N: NAME === เท่านั้น (สำคัญสำหรับ parser)\n' +
      '11. Prompt ต้องอยู่ใน code block (```) เสมอ\n' +
      '12. จำนวนฉาก: ' +
      smSceneCount +
      ' ฉาก\n' +
      '13. HERO + DIALOGUE — ล็อค **บทสนทนาไทย (Dialogue)**; **ข้อ: ห้ามบังคับตั้งชื่อมนุษย์** — อนุญาตใช้ฉลากบทบาทคงที่ (ROLE/เพื่อน/ฝ่ายรับสาร) แทนการตั้งชื่อ; ถ้าใช้ชื่อ/ฉลากแล้ว ต้องคงสะกด/ความหมายตัวเดิมทุกฉาก เสียง TTS สอดคล้องบทบาท; ไม่บังคับ "' +
      voiceEn +
      '" ทุกบท (hint) ' +
      voiceGenderBanTh +
      ' (ยกเว้น ASMR ไม่มีเสียงพูด)\n' +
      '14. HERO BIBLE — ใช้ฉบับด้านล่าง: รายละเอียดเต็ม ห้าม card ย่อ; ทุกครั้งที่พูด/ออกฉาก ย้ำรายละเอียดเพียงพอเพื่อ consistency (ไม่บังคับ "มีชื่อเล่นเสมอ")\n' +
      '15. SPEAKER + AUDIO (ยกเว้น ASMR ไม่มี speech): ท้าย block 🟢 VIDEO ทุกฉากต้องมี `Speaker:` (ROLE_ หรือ ฉลาก) กับ `Dialogue:` — บรรทัด Speaker คือ **master สำหรับเสียง**; แม้จะอธิบายหลาย ROLE_ ในส่วน ACTION/ภาพ ให้ **ตัวที่ไม่ใช่ Speaker เงียบ/ไม่ lip-sync กับบทนี้** — ห้ามให้ TTS/วีดีโอใช้ "ROLE_ ตัวแรก" แทน Speaker ถ้าขัดกัน\n' +
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
    const topic = sanitizeStorymodeUserPlainText((payload.prompt || '').trim());
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

    if (
      payload.mode === 'storymode' &&
      payload.factoryDna &&
      typeof payload.factoryDna === 'object' &&
      Object.keys(payload.factoryDna).length > 0
    ) {
      msg +=
        '\n═══ FACTORY DNA (v1 — โคลนสไตล์จากแพ็กโรงงาน: post + cover + sales voice) ═══\n' +
        JSON.stringify(payload.factoryDna, null, 2) +
        '\n';
    }

    // Domain knowledge: เฉพาะ storymode + เนะเรทีฟ ผักนักเลง (36) หรือ อวัยวะรวมตัว (37) — ห้ามใน product_sell
    var _dkNarr = payload.narrativeStyleIds || [];
    var _dkNarrativeOk = false;
    for (var _dki = 0; _dki < _dkNarr.length; _dki++) {
      var _dkId = Number(_dkNarr[_dki]);
      if (_dkId === 36 || _dkId === 37) {
        _dkNarrativeOk = true;
        break;
      }
    }
    if (
      payload.mode === 'storymode' &&
      _dkNarrativeOk &&
      payload.domainKnowledgeText &&
      String(payload.domainKnowledgeText).trim()
    ) {
      msg +=
        '\n══ DOMAIN KNOWLEDGE (local repository — ใช้เป็นขอบข่าย/ข้อเท็จจริงอ้างอิง ไม่แทนกฎ safety/overclaim ใน system) ══\n' +
        sanitizeStorymodeUserPlainText(String(payload.domainKnowledgeText).trim()) +
        '\n';
    }

    if (payload.productFactsText && String(payload.productFactsText).trim()) {
      msg +=
        '\n══ PRODUCT FACTS (local repository — numeric anchors for product consistency) ══\n' +
        sanitizeStorymodeUserPlainText(String(payload.productFactsText).trim()) +
        '\n';
    }

    if (payload.heroAnalysisText && String(payload.heroAnalysisText).trim()) {
      msg +=
        '\n══ HERO VISUAL CONSISTENCY (JSON จากรูปอ้างอิงตัวละคร — ล็อกหน้า/เสื้อ/สไตล์ ให้ฮีโร่นิ่งทุกฉาก) ══\n' +
        String(payload.heroAnalysisText).trim() +
        '\n';
    }

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
    {
      const userIsASMR = smStoryType === 'asmr';
      msg += buildDialogueWordBudgetThai(userIsASMR, 'user');
    }

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
      msg += '\n═══ HERO BIBLE (see system prompt) ═══\n';
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
    const productNames = (img.productNames && img.productNames.length)
      ? img.productNames
      : (img.productName ? [img.productName] : []);
    if (img.productAttached || img.characterAttached) {
      msg += '\n═══ รูปแนบ (ส่งภาพเป็น inlineData ให้ Gemini แล้ว) ═══\n';
      if (img.productAttached) {
        msg += 'สินค้า (' + (img.productAttachedCount || productNames.length || 1) + ' รูป): ' + (productNames.join(', ') || '(attached)') + '\n';
        if (img.productName) msg += 'รูปสินค้าหลักที่ใช้พิจารณาเอกลักษณ์: ' + img.productName + '\n';
      }
      if (img.characterAttached) {
        var ccounts = img.characterImageCounts;
        if (ccounts && ccounts.length) {
          msg += 'ตัวละคร (จำนวนรูป ref ต่อ slot 1/2/3): ' + ccounts.join(' / ') + ' รูป\n';
        } else {
          msg += 'ตัวละคร: ' + (charNames.length ? charNames.join(', ') : '(attached)') + '\n';
        }
        msg += 'ชื่อไฟล์อ้างอิง (รูปแรกแต่ละ slot): ' + (charNames.join(', ') || '(attached)') + '\n';
      }
      msg += 'ใช้ภาพแนบเป็น reference สำหรับสินค้า/ตัวละครในทุกฉาก ไม่ต้องเปลี่ยนหน้าตา/ฉลากสินค้า\n';
    }

    msg +=
      '\nสร้างสคริปต์ ' +
      (Number(payload.sceneCount) || 5) +
      ' ฉาก ตาม format ที่กำหนด — บทพูดไทย **15-20 คำ/ฉาก** (~8 วิ) ตามกล่อง "กฎความยาวบทพูด" ด้านบน';

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
    var safetyReport = { sanitized: false, overclaimHits: [], softReplaces: [] };
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
      text = marketing.text;
      safetyReport.overclaimHits = marketing.hits || [];
      safetyReport.softReplaces = marketing.softReplaces || [];
      if (safetyReport.overclaimHits.length > 0) {
        safetyReport.sanitized = true;
        try {
          console.warn(
            '[Storymode Safety] Marketing policy applied (remove or soft-replace):',
            safetyReport.overclaimHits,
            safetyReport.softReplaces && safetyReport.softReplaces.length
              ? { softReplaces: safetyReport.softReplaces }
              : {}
          );
        } catch (e) { /* ignore */ }
      }
    }
    return { text: text, safety: safetyReport };
  }

  /**
   * เมื่อ deploy บน Vercel + ตั้ง GEMINI_API_KEY — เรียก /api/gemini (ไม่ส่ง key ไป client)
   */
  async function mockFetchGeminiViaServer(systemPrompt, userText, images, opts) {
    opts = opts || {};
    var postBody = {
      systemPrompt: systemPrompt,
      userText: userText,
      images: images || []
    };
    if (
      (typeof opts.temperature === 'number' && !Number.isNaN(opts.temperature)) ||
      (typeof opts.maxOutputTokens === 'number' && !Number.isNaN(opts.maxOutputTokens))
    ) {
      postBody.generationConfig = {};
      if (typeof opts.temperature === 'number' && !Number.isNaN(opts.temperature)) {
        postBody.generationConfig.temperature = opts.temperature;
      }
      if (typeof opts.maxOutputTokens === 'number' && !Number.isNaN(opts.maxOutputTokens)) {
        postBody.generationConfig.maxOutputTokens = opts.maxOutputTokens;
      }
    }
    var r = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBody)
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
    var applied;
    if (opts.skipStorySafety) {
      applied = {
        text: String(rawText || ''),
        safety: { sanitized: false, overclaimHits: [], softReplaces: [] }
      };
    } else {
      applied = applyStorymodeSafetyToText(rawText);
    }
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
   * @param {{ skipStorySafety?: boolean, temperature?: number, maxOutputTokens?: number }} [opts] skipStorySafety: for JSON-only / analysis responses
   */
  async function mockFetchGeminiStorymode(apiKey, systemPrompt, userText, images, opts) {
    opts = opts || {};
    if (typeof window !== 'undefined' && window.__GEMINI_SERVER_MODE__) {
      return mockFetchGeminiViaServer(systemPrompt, userText, images, opts);
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
        body.generationConfig.maxOutputTokens = typeof opts.maxOutputTokens === 'number' ? opts.maxOutputTokens : 16384;
        body.generationConfig.temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.55;
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

        var applied;
        if (opts.skipStorySafety) {
          applied = { text: String(text), safety: { sanitized: false, overclaimHits: [], softReplaces: [] } };
        } else {
          applied = applyStorymodeSafetyToText(text);
        }
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

  function buildHeroAnalysisSystemPrompt() {
    return (
      'You are a character design analyst for short-form (TikTok/UGC) video. ' +
      'The user may attach 1+ reference image(s) for one or more character slots (Character 1 / 2 / 3) in a fixed order. ' +
      'Read every image, merge observations; where views conflict, prefer well-lit, face-visible shots. ' +
      'Output a single valid JSON object only — no markdown, no backticks, no commentary. ' +
      'Schema (top-level keys; use null for unknown; confidence: number 0-1): ' +
      'schema_version, identity (archetype, face_summary, hair: { color, style }, skin_tone, body: { build } ), ' +
      'wardrobe_hero (outfit_lock, accessories), rendering (style_read, lighting_guess), ' +
      'consistency (lock_phrase_en, lock_phrase_th — one short paragraph each, pasteable into image gen prompts to keep the hero identical), ' +
      'slots: optional object with keys character1, character2, character3 each { notes: string } when that slot has images, ' +
      'confidence: { overall: number }. ' +
      'lock_phrase must restate the same visible person/outfit, not a generic template.'
    );
  }

  function buildHeroAnalysisUserMessage(orderLegend) {
    return (
      'Task: output ONLY the JSON object described in the system instruction. ' +
      'Use the following mapping from image order to story slots (0-based indices refer to the attached images in the request):\n' +
      String(orderLegend || '(no legend)') +
      '\n\nIf a slot has no images, omit or null related slot notes. ' +
      'If multiple people appear, focus on the most prominent; note ambiguity in notes with lower confidence.'
    );
  }

  window.MockStorymodeGemini = {
    FACTORY_DNA_SCHEMA_VERSION: 'factory_dna_v1',
    STORYMODE_PROMPT_ASSET_VERSION: g.STORYMODE_PROMPT_ASSET_VERSION,
    STORY_TYPE_TEMPLATES: STORY_TYPE_TEMPLATES,
    buildStorymodeSystemPromptFromPayload: buildStorymodeSystemPromptFromPayload,
    buildStorymodeUserMessageFromPayload: buildStorymodeUserMessageFromPayload,
    mockFetchGeminiStorymode: mockFetchGeminiStorymode,
    buildHeroAnalysisSystemPrompt: buildHeroAnalysisSystemPrompt,
    buildHeroAnalysisUserMessage: buildHeroAnalysisUserMessage,
    RESULT_STORAGE_KEY: 'storymodeMockGeminiResultV1'
  };
})();
