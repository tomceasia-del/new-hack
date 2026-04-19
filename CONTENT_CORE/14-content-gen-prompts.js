/**
 * CONTENT_CORE/14-content-gen-prompts.js
 * AI Content Generation Prompts
 * Source: sidepanel.js lines 1163–1470
 *
 * These prompts are the main AI instructions for generating:
 * H1 headline, H2 subtitle, caption, speech/dialogue, CTA
 * for TikTok Shop product videos.
 *
 * Used in: callAPI() system message when generating content for each item
 */

// ==================== CONTENT GENERATION PROMPTS ====================

export const CONTENT_PROMPT_NORMAL = `คุณเป็นผู้เชี่ยวชาญด้านการสร้างเนื้อหา TikTok Shop สำหรับขายสินค้า

งานของคุณคือ:
1. คิดคำพาดหัว (H1, H2) - ประโยคสั้นเด็ดๆ ที่ดึงดูดความสนใจ
   - H1: คำสั้นๆ ที่โดดเด่น เช่น "1 แถม 1", "ลดราคา 50%", "ของมันต้องมี"
   - H2: ชื่อสินค้าหรือจุดเด่นสั้นๆ

2. สร้าง Caption สำหรับ TikTok - ดึงดูดใจ มี emoji และ hashtag

3. สร้างคำพูดสำหรับวิดีโอ (~8 วินาที) - พูดเชียร์ขายสินค้าเป็นภาษาไทย

4. สร้าง CTA (Call to Action) สั้นๆ ไม่เกิน 30 ตัวอักษร

⚠️ กฎสำคัญ:
- ห้ามใช้คำพาดหัวซ้ำกับที่เคยใช้แล้ว
- คิดคำใหม่ที่สร้างสรรค์และแตกต่าง
- สไตล์รอบนี้: [STYLE_PLACEHOLDER]

⚠️ กฎเพศ (สำคัญมาก):
- ถ้าตัวละครเป็นผู้ชาย: ใช้ครับ/นะครับ ห้ามใช้ค่ะ/นะคะ เด็ดขาด
- ถ้าตัวละครเป็นผู้หญิง: ใช้ค่ะ/นะคะ ห้ามใช้ครับ/นะครับ เด็ดขาด
- ห้ามสลับเพศเด็ดขาด

⚠️ กฎ CTA:
- ไม่เกิน 30 ตัวอักษร
- ห้ามใช้ emoji หรือสัญลักษณ์พิเศษทุกชนิด
- ใช้ได้เฉพาะ: ภาษาไทย ภาษาอังกฤษ ตัวเลข และช่องว่าง เท่านั้น
- ห้ามใช้คำที่อาจไม่เป็นจริง เช่น: "ส่งฟรี", "ฟรีค่าส่ง", "ส่งฟรีทั่วไทย", "รับประกันคืนเงิน", "ของแท้100%"
- ตัวอย่าง: "สั่งเลยวันนี้", "ของดีราคาถูก", "กดสั่งซื้อเลย"

ตอบเป็น JSON เท่านั้น (fields: h1, h2, caption, speech, cta, hookId)`;

// Extend Mode (16วิ) — มี H1/H2, speech + speech2
export const CONTENT_PROMPT_EXTEND = `คุณเป็นผู้เชี่ยวชาญด้านการสร้างเนื้อหา TikTok Shop สำหรับขายสินค้า

งานของคุณคือ:
1. คิดคำพาดหัว (H1, H2) - ประโยคสั้นเด็ดๆ ที่ดึงดูดความสนใจ
   - H1: คำสั้นๆ ที่โดดเด่น เช่น "1 แถม 1", "ลดราคา 50%", "ของมันต้องมี"
   - H2: ชื่อสินค้าหรือจุดเด่นสั้นๆ

2. สร้าง Caption สำหรับ TikTok - ดึงดูดใจ มี emoji และ hashtag

3. สร้างคำพูดสำหรับวิดีโอ ส่วนที่ 1 (~8 วินาที) - พูดเชียร์ขายสินค้าเป็นภาษาไทย

4. สร้างคำพูดสำหรับวิดีโอ ส่วนที่ 2 (~8 วินาที) - ต่อจากส่วนแรก พูดเพิ่มเติมเกี่ยวกับจุดเด่น โปรโมชั่น หรือเชิญชวนให้ซื้อ

5. สร้าง CTA (Call to Action) สั้นๆ ไม่เกิน 30 ตัวอักษร

⚠️ กฎสำคัญ:
- ห้ามใช้คำพาดหัวซ้ำกับที่เคยใช้แล้ว
- คิดคำใหม่ที่สร้างสรรค์และแตกต่าง
- สไตล์รอบนี้: [STYLE_PLACEHOLDER]
- speech และ speech2 ต้องต่อเนื่องกัน เหมือนพูดคุยเรื่องเดียวกัน

⚠️ กฎเพศ (สำคัญมาก):
- ถ้าตัวละครเป็นผู้ชาย: ใช้ครับ/นะครับ ห้ามใช้ค่ะ/นะคะ เด็ดขาด
- ถ้าตัวละครเป็นผู้หญิง: ใช้ค่ะ/นะคะ ห้ามใช้ครับ/นะครับ เด็ดขาด
- ห้ามสลับเพศเด็ดขาด

⚠️ กฎ CTA:
- ไม่เกิน 30 ตัวอักษร
- ห้ามใช้ emoji หรือสัญลักษณ์พิเศษทุกชนิด
- ใช้ได้เฉพาะ: ภาษาไทย ภาษาอังกฤษ ตัวเลข และช่องว่าง เท่านั้น
- ห้ามใช้คำที่อาจไม่เป็นจริง เช่น: "ส่งฟรี", "ฟรีค่าส่ง", "ส่งฟรีทั่วไทย", "รับประกันคืนเงิน", "ของแท้100%"
- ตัวอย่าง: "สั่งเลยวันนี้", "ของดีราคาถูก", "กดสั่งซื้อเลย"

ตอบเป็น JSON เท่านั้น (fields: h1, h2, caption, speech, speech2, cta, hookId)`;

// No Text Mode (8วิ) — ไม่มี H1/H2
export const CONTENT_PROMPT_NO_TEXT = `คุณเป็นผู้เชี่ยวชาญด้านการสร้างเนื้อหา TikTok Shop สำหรับขายสินค้า

งานของคุณคือ:
1. สร้าง Caption สำหรับ TikTok - ดึงดูดใจ มี emoji และ hashtag
2. สร้างคำพูดสำหรับวิดีโอ (~8 วินาที) - พูดเชียร์ขายสินค้าเป็นภาษาไทย
3. สร้าง CTA (Call to Action) สั้นๆ ไม่เกิน 30 ตัวอักษร

⚠️ กฎเพศ (สำคัญมาก):
- ถ้าตัวละครเป็นผู้ชาย: ใช้ครับ/นะครับ ห้ามใช้ค่ะ/นะคะ เด็ดขาด
- ถ้าตัวละครเป็นผู้หญิง: ใช้ค่ะ/นะคะ ห้ามใช้ครับ/นะครับ เด็ดขาด

⚠️ กฎ CTA:
- ไม่เกิน 30 ตัวอักษร
- ห้ามใช้ emoji หรือสัญลักษณ์พิเศษทุกชนิด
- ใช้ได้เฉพาะ: ภาษาไทย ภาษาอังกฤษ ตัวเลข และช่องว่าง เท่านั้น
- ห้ามใช้คำที่อาจไม่เป็นจริง เช่น: "ส่งฟรี", "ฟรีค่าส่ง", "รับประกันคืนเงิน", "ของแท้100%"

ตอบเป็น JSON เท่านั้น (fields: caption, speech, cta, hookId)`;

// No Text Extend Mode (16วิ) — ไม่มี H1/H2, มี speech + speech2
export const CONTENT_PROMPT_NO_TEXT_EXTEND = `คุณเป็นผู้เชี่ยวชาญด้านการสร้างเนื้อหา TikTok Shop สำหรับขายสินค้า

งานของคุณคือ:
1. สร้าง Caption สำหรับ TikTok - ดึงดูดใจ มี emoji และ hashtag
2. สร้างคำพูดสำหรับวิดีโอ ส่วนที่ 1 (~8 วินาที) - พูดเชียร์ขายสินค้าเป็นภาษาไทย
3. สร้างคำพูดสำหรับวิดีโอ ส่วนที่ 2 (~8 วินาที) - ต่อจากส่วนแรก พูดเพิ่มเติมเกี่ยวกับจุดเด่นหรือเชิญชวนให้ซื้อ
4. สร้าง CTA (Call to Action) สั้นๆ ไม่เกิน 30 ตัวอักษร

⚠️ กฎเพศ (สำคัญมาก):
- ถ้าตัวละครเป็นผู้ชาย: ใช้ครับ/นะครับ ห้ามใช้ค่ะ/นะคะ เด็ดขาด
- ถ้าตัวละครเป็นผู้หญิง: ใช้ค่ะ/นะคะ ห้ามใช้ครับ/นะครับ เด็ดขาด
- speech และ speech2 ต้องต่อเนื่องกัน เหมือนพูดคุยเรื่องเดียวกัน

⚠️ กฎ CTA:
- ไม่เกิน 30 ตัวอักษร
- ห้ามใช้ emoji หรือสัญลักษณ์พิเศษทุกชนิด
- ใช้ได้เฉพาะ: ภาษาไทย ภาษาอังกฤษ ตัวเลข และช่องว่าง เท่านั้น
- ห้ามใช้คำที่อาจไม่เป็นจริง เช่น: "ส่งฟรี", "ฟรีค่าส่ง", "รับประกันคืนเงิน", "ของแท้100%"

ตอบเป็น JSON เท่านั้น (fields: caption, speech, speech2, cta, hookId)`;

// ==================== CONTENT PROMPT BUILDER ====================
// buildContentGenerationPrompt — assembles prompt from item settings
// ★ Helper: สร้าง full prompt message สำหรับส่ง Gemini — รวม product info + gender + style ★
// TODO: USER_PROMPT
export function buildContentGenerationPrompt(item, isExtend, gender, style, usedHeadlines) {
  const wantH1 = item.showH1 !== false;
  const wantH2 = item.showH2 !== false;
  const wantText = wantH1 || wantH2;

  let base;
  if (wantText && isExtend) base = CONTENT_PROMPT_EXTEND;
  else if (wantText)        base = CONTENT_PROMPT_NORMAL;
  else if (isExtend)        base = CONTENT_PROMPT_NO_TEXT_EXTEND;
  else                      base = CONTENT_PROMPT_NO_TEXT;

  base = base.replace('[STYLE_PLACEHOLDER]', style || 'สไตล์อิสระ');

  let ctx = `\n\nข้อมูลสินค้า:\n- ชื่อ: ${item.name || 'สินค้า'}`;
  if (item.highlight) ctx += `\n- จุดเด่น: ${item.highlight}`;
  if (item.price)     ctx += `\n- ราคา: ${item.price}`;

  if (gender === 'female')     ctx += `\n\nตัวละครเป็นผู้หญิง → ใช้ค่ะ/นะคะ`;
  else if (gender === 'male')  ctx += `\n\nตัวละครเป็นผู้ชาย → ใช้ครับ/นะครับ`;

  if (usedHeadlines && usedHeadlines.length > 0) {
    ctx += `\n\n⚠️ คำพาดหัวที่เคยใช้แล้ว (ห้ามซ้ำ): ${usedHeadlines.join(', ')}`;
  }

  return base + ctx;
}

// ==================== PROMPT VARIATION ARRAYS ====================
// Source: sidepanel.js lines 1016–1051
// Used by buildImagePrompt to add variety across generations

export const TIME_VARIATIONS = [
  'บรรยากาศตอนเช้าสดใส',
  'แสงกลางวันสว่างไสว',
  'บรรยากาศตอนบ่ายสบายๆ',
  'แสงเย็นอบอุ่น',
  'บรรยากาศตอนค่ำโรแมนติก',
  'แสงธรรมชาตินุ่มนวล',
  'บรรยากาศสดใส',
  'แสง soft light',
  'บรรยากาศตอนเช้ามืด',
  'แสงทอง golden hour'
];

export const MOOD_VARIATIONS = [
  'บรรยากาศสดใสร่าเริง',
  'อารมณ์ผ่อนคลาย',
  'บรรยากาศกระตือรือร้น',
  'อารมณ์อบอุ่นเป็นกันเอง',
  'บรรยากาศมีชีวิตชีวา',
  'อารมณ์สงบเยือกเย็น',
  'บรรยากาศมั่นใจ',
  'อารมณ์สนุกสนาน',
  'บรรยากาศเป็นมิตร',
  'อารมณ์น่าตื่นเต้น'
];

export const CAMERA_VARIATIONS = [
  'มุมกล้องใกล้ชิด',
  'มุมกล้องกว้าง',
  'มุมกล้องสูง',
  'มุมกล้องเตี้ย',
  'มุมกล้องปกติระดับสายตา',
  'โฟกัสที่สินค้าชัดเจน',
  'พื้นหลังเบลอสวย',
  'องค์ประกอบสมดุล'
];

// ==================== IMAGE PROMPT BUILDER (FULL) ====================
// Source: sidepanel.js lines 1463–1515
// Handles: art style injection, character injection, background injection,
//          clothing detection, text overlay, TIME/MOOD/CAMERA variation

export function buildImagePrompt(item) {
  const wH1 = item.showH1 !== false;
  const wH2 = item.showH2 !== false;

  let prompt;
  if (wH1 || wH2) {
    prompt = IMAGE_PROMPT_TEMPLATE;
    prompt = prompt.replace('[H1_PLACEHOLDER]', wH1 ? (item.h1Headline || item.headline || item.name || '') : '');
    prompt = prompt.replace('[H2_PLACEHOLDER]', wH2 ? (item.h2Subtitle || item.subtitle || item.highlight || '') : '');
  } else {
    prompt = IMAGE_PROMPT_TEMPLATE_NO_TEXT;
  }

  // ── Art Style (selector: thaiArtStyle) ──
  const artStyle = THAI_ART_STYLE_MAP[item.thaiArtStyle];
  const artStyleText = (artStyle && artStyle !== 'AI เลือกให้อัตโนมัติ')
    ? artStyle
    : 'Realistic photo, UGC style, natural lighting';
  prompt = prompt.replace('[ART_STYLE_PLACEHOLDER]', artStyleText);

  // ── Character (selector: character) ──
  const charDesc = CHARACTER_STYLE_MAP[item.character];
  const charText = (charDesc && charDesc !== 'AI เลือกให้อัตโนมัติ')
    ? charDesc
    : (item.generatedCharacter || 'The provided character');
  prompt = prompt.replace('[CHARACTER_PLACEHOLDER]', charText);

  // ── Background (selector: background) ──
  const bgDesc = BACKGROUND_STYLE_MAP[item.background];
  const bgText = (bgDesc && bgDesc !== 'AI เลือกให้อัตโนมัติ')
    ? bgDesc
    : 'Dynamic background determined by the product context';
  prompt = prompt.replace('[BACKGROUND_PLACEHOLDER]', bgText);

  // ── Clothing detection → swap "holding" to "wearing" ──
  const nameLC = (item.name || '').toLowerCase();
  const isClothing = /เสื้อ|shirt|t-shirt|tshirt|polo|hoodie|sweater|cardigan|blazer|jacket|แจ็คเก็ต|เสื้อยืด|เสื้อเชิ้ต|เสื้อกันหนาว|เสื้อกั๊ก|vest|crop.?top|เสื้อครอป|blouse|top|coat|สูท|suit|กางเกง|pants|jeans|shorts|กางเกงขาสั้น|กางเกงขายาว|กางเกงยีนส์|legging|เลกกิ้ง|jogger/.test(nameLC);
  if (isClothing) {
    prompt = prompt.replace(
      'The character is holding or presenting the reference product in an engaging, enthusiastic manner suitable to the product\'s size and weight.',
      'The character is wearing the reference product as their outfit, styled naturally and fashionably. The clothing fits well and is clearly visible as the main focus. The character poses confidently to showcase how the garment looks when worn.'
    );
  }

  // ── Variation (randomised lighting / mood / camera) ──
  const timeHint = TIME_VARIATIONS[Math.floor(Math.random() * TIME_VARIATIONS.length)];
  const moodHint = MOOD_VARIATIONS[Math.floor(Math.random() * MOOD_VARIATIONS.length)];
  const camHint  = CAMERA_VARIATIONS[Math.floor(Math.random() * CAMERA_VARIATIONS.length)];
  prompt = prompt.replace('[VARIATION_PLACEHOLDER]', `${timeHint}, ${moodHint}, ${camHint}`);

  return prompt;
}

// ==================== VIDEO PROMPT BUILDERS ====================
// Source: sidepanel.js lines 1517–1592

export function buildVideoPromptStep1(item, dialogueScript) {
  const dialogue = dialogueScript || item.speech1 || VIDEO_PROMPT_STEP1.dialogue_script;
  let basePrompt = getRandomVideoPromptStep1() + VIDEO_PROMPT_STEP1_AUDIO;

  // ── Selector blocks ที่ถูก inject เข้า prompt โดยตรง ──
  const selectorDirectives = _buildVideoSelectorBlock(item);
  if (selectorDirectives) {
    basePrompt += `\n\n${selectorDirectives}`;
  }

  const promptWithDialogue = dialogue
    ? basePrompt + `\n\nDIALOGUE / SPEECH CONTENT (CRITICAL — The character MUST say exactly this in Thai):\n"${dialogue}"`
    : basePrompt;
  return { ...VIDEO_PROMPT_STEP1, prompt_text: promptWithDialogue, dialogue_script: dialogue };
}

export function buildVideoPromptStep2(item, dialogueScript) {
  const dialogue = dialogueScript || item.speech2 || VIDEO_PROMPT_STEP2.dialogue_script;
  let basePrompt = getRandomVideoPromptStep2();

  const selectorDirectives = _buildVideoSelectorBlock(item);
  if (selectorDirectives) {
    basePrompt += `\n\n${selectorDirectives}`;
  }

  const promptWithDialogue = dialogue
    ? basePrompt + `\n\nDIALOGUE / SPEECH CONTENT (CRITICAL — The character MUST continue saying exactly this in Thai):\n"${dialogue}"`
    : basePrompt;
  return { ...VIDEO_PROMPT_STEP2, prompt_text: promptWithDialogue, dialogue_script: dialogue };
}

// ★ Helper: สร้าง selector directive block สำหรับ video prompt — deterministic, เสถียร ★
function _buildVideoSelectorBlock(item) {
  const lines = [];

  // Voice Type
  const voiceDesc = VOICE_TONE_MAP[item.voiceType];
  if (voiceDesc && voiceDesc !== 'AI เลือกให้อัตโนมัติ') {
    const vk = (item.voiceType || '');
    const isFemale = vk.includes('female');
    const isMale = vk.includes('male') && !vk.includes('female');
    if (isFemale) lines.push(`VOICE GENDER: Female Thai voice. ${voiceDesc}. ห้ามใช้เสียงผู้ชายเด็ดขาด`);
    else if (isMale) lines.push(`VOICE GENDER: Male Thai voice. ${voiceDesc}. ห้ามใช้เสียงผู้หญิงเด็ดขาด`);
    else lines.push(`VOICE TONE: ${voiceDesc}`);
  }

  // Speaking Style
  const speakDesc = SPEAKING_STYLE_MAP[item.speakingStyle];
  if (speakDesc && speakDesc !== 'AI เลือกให้อัตโนมัติ') {
    lines.push(`SPEAKING STYLE: ${speakDesc}`);
  }

  // Video Style
  const vidDesc = VIDEO_STYLE_MAP[item.videoStyle];
  if (vidDesc && vidDesc !== 'สไตล์มาตรฐาน - สะอาด เรียบง่าย' && vidDesc !== 'AI เลือกให้อัตโนมัติ') {
    lines.push(`VISUAL STYLE: ${vidDesc}`);
  }

  // Script Style
  const scriptDesc = SCRIPT_STYLE_MAP[item.scriptStyle];
  if (scriptDesc && scriptDesc !== 'AI เลือกให้อัตโนมัติ') {
    lines.push(`SCRIPT STRUCTURE: ${scriptDesc}`);
  }

  // Dialogue Style
  const dlgDesc = DIALOGUE_STYLE_MAP[item.dialogueStyle];
  if (dlgDesc && dlgDesc !== 'AI เลือกให้อัตโนมัติ') {
    lines.push(`DIALOGUE STYLE: ${dlgDesc}`);
  }

  return lines.length > 0
    ? `USER SELECTOR DIRECTIVES (MUST follow):\n${lines.join('\n')}`
    : '';
}
