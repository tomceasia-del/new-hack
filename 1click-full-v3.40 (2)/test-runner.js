const fs = require('fs');
const path = require('path');

const dir = __dirname;
const sidepanelCode = fs.readFileSync(path.join(dir, 'js/sidepanel.js'), 'utf8');
const googleflowCode = fs.readFileSync(path.join(dir, 'js/content-googleflow.js'), 'utf8');
const promptCode = fs.readFileSync(path.join(dir, 'js/promptTemplate.js'), 'utf8');
const manifestData = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));

let pass = 0, fail = 0;
const failures = [];

function assert(name, condition) {
  if (condition) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  ❌ ${name}`);
  }
}

console.log('\n🧪 1CLICK AUTO TEST — Build v' + manifestData.version);
console.log('═'.repeat(60));

// ===== 1. MANIFEST =====
console.log('\n📋 Manifest & Version');
assert('Version = 3.04', manifestData.version === '3.04');
assert('Manifest V3', manifestData.manifest_version === 3);

// ===== 2. YOURSHOP BAN =====
console.log('\n🚫 YourShop Ban');
assert('OVERCLAIM_RULES: กฎ yourshop', sidepanelCode.includes('ห้ามใช้คำว่า "yourshop"'));
assert('OVERCLAIM_RULES: "Your Shop"', sidepanelCode.includes('"Your Shop"'));
assert('OVERCLAIM_RULES: ห้ามอ้างชื่อร้าน', sidepanelCode.includes('ห้ามอ้างถึงชื่อร้าน'));
assert('NORMAL prompt: yourshop+YourShop+Your Shop', sidepanelCode.includes('ห้ามใช้คำว่า "yourshop", "YourShop", "Your Shop"'));
assert('EXTEND prompt: yourshop rule (2+ จุด)', (sidepanelCode.match(/ห้ามใช้คำว่า "yourshop", "YourShop", "Your Shop"/g) || []).length >= 2);
assert('enforceHeadline: ลบ yourshop', sidepanelCode.includes(".replace(/yourshop/gi, '')"));
assert('enforceHeadline: ลบ your shop เว้นวรรค', sidepanelCode.includes(".replace(/your\\s*shop/gi, '')"));
assert('enforceHeadline: ลบ YourShop', sidepanelCode.includes(".replace(/YourShop/g, '')"));
assert('enforceHeadline: ลบ YOUR SHOP', sidepanelCode.includes(".replace(/YOUR\\s*SHOP/gi, '')"));
assert('sanitizeDialogue: strip yourshop', sidepanelCode.includes("// ★ v2.93: Strip yourshop ทุกรูปแบบ — ห้ามหลุดในบทพูดเด็ดขาด"));
assert('sanitizeVideoPrompt: strip yourshop', sidepanelCode.includes("// ★ v2.93: Strip yourshop ทุกรูปแบบ — ห้ามหลุดใน video prompt เด็ดขาด"));
assert('extractPrompts: sanitize dialogue', sidepanelCode.includes("// ★ v2.93: Sanitize dialogue — strip yourshop ทุกรูปแบบ"));
assert('autopost: sanitize shortDialogue', sidepanelCode.includes("sanitizeDialogueForGoogleFlow(autoContentData.speech || '')"));
assert('single: sanitize shortDialogue', sidepanelCode.includes("sanitizeDialogueForGoogleFlow(contentData.speech ||"));
assert('Storymode AutoRun: sanitize video', (sidepanelCode.match(/AI Sanitize videoPrompt|AI กำลัง sanitize video prompt/g) || []).length >= 3);
assert('sanitizeDialogue: strip คำอุทาน', sidepanelCode.includes("Strip คำอุทานเปิดประโยค"));
assert('NORMAL prompt: ห้ามคำอุทาน', sidepanelCode.includes('ห้ามขึ้นต้นด้วยคำอุทาน'));
assert('ห้ามคำอุทาน ≥6 จุด', (sidepanelCode.match(/ห้ามขึ้นต้น.*คำอุทาน|ห้ามขึ้นต้นบทพูดด้วยคำอุทาน/g) || []).length >= 6);
assert('imagePrompt: strip yourshop (single)', sidepanelCode.includes("// ★ v2.93: Strip yourshop จาก image prompt ที่ AI สร้างมา"));
assert('imagePrompt: strip yourshop (batch)', sidepanelCode.includes("// ★ v2.93: Strip yourshop จาก image prompt ★"));
assert('ไม่มี fallback เฮ้ย', !sidepanelCode.includes('เฮ้ย! ${item.name}'));
assert('yourshop ban ใน caption', sidepanelCode.includes('speech, caption หรือ CTA เด็ดขาด'));

// ===== 3. SPEECH 15-20 คำ (กระชับจบใน 8 วินาที) =====
console.log('\n📝 Speech 15-20 คำ (กระชับ 8 วิ)');
assert('มี 15-20 คำ', sidepanelCode.includes('พอดี 15-20 คำ') || sidepanelCode.includes('ไม่เกิน 15-20 คำ'));
assert('ห้ามเกิน 20 คำเด็ดขาด', sidepanelCode.includes('ห้ามเกิน 20 คำเด็ดขาด'));
assert('ไม่มี 14-18 คำ เหลือ', !sidepanelCode.includes('ไม่เกิน 14-18 คำ'));
assert('ไม่มี 25-30 คำ เหลือ', !sidepanelCode.includes('ไม่เกิน 25-30 คำ'));
assert('15-20 อย่างน้อย 4 จุด', ((sidepanelCode.match(/พอดี 15-20 คำ/g) || []).length + (sidepanelCode.match(/ไม่เกิน 15-20 คำ/g) || []).length) >= 4);
assert('Storymode: พอดี 15-20 คำ', sidepanelCode.includes('พอดี 15-20 คำ'));
assert('Flow rule: (15-20 คำ)', sidepanelCode.includes('(15-20 คำ)'));

// ===== 4. NO TEXT IN VIDEO =====
console.log('\n🎬 ห้าม Text ใน Video');
assert('STEP1 (8วิ): เก็บ text header', sidepanelCode.includes('Keep the camera relatively stable to ensure the text header'));
assert('STEP2 (16วิ): ห้าม text/typography', sidepanelCode.includes('Do NOT render any text, titles, subtitles, captions, or on-screen typography'));
assert('STEP2: ไม่มี keep header', !sidepanelCode.includes('Maintain camera framing to keep the top header visible'));
assert('Storymode visual: no font rendering', sidepanelCode.includes('no typography, no font rendering. The video must be completely clean of any text overlays'));
assert('Studio video: ห้าม text', sidepanelCode.includes('Do NOT render any text, titles, captions, or on-screen typography in the video'));
assert('STEP2 negative: text/font terms', sidepanelCode.includes('text overlays, on-screen text, titles, headlines, H1, H2, subtitles, captions, text distortions'));
assert('ไม่มี TEXT PRESERVATION ใน video16', !sidepanelCode.includes('TEXT PRESERVATION: Keep ALL existing Thai text overlay from previous clip'));

// ===== 5. STUDIO API RESTRICTION =====
console.log('\n🔒 Studio API Restriction');
assert('RESTRICTED_KEYS: key1', sidepanelCode.includes('AIzaSyDJqF_f5GuClZBx7XXgZ6wotK2Lxh7hMC0'));
assert('RESTRICTED_KEYS: key2', sidepanelCode.includes('AIzaSyCj35Yd9vs1rXt2NBN6cHTlnmsegDoN61k'));
assert('isStudioApiBlocked() exists', sidepanelCode.includes('async function isStudioApiBlocked()'));
assert('generateStudioMasterPrompt: guard', sidepanelCode.includes('generateStudioMasterPrompt() {\n  if (await isStudioApiBlocked())'));
assert('generateSingleScene: guard', sidepanelCode.includes('generateSingleScene(idx) {\n  if (await isStudioApiBlocked())'));
assert('generateStudioImages: guard', sidepanelCode.includes('generateStudioImages() {\n  if (await isStudioApiBlocked())'));
assert('generateStudioVideos: guard', sidepanelCode.includes('generateStudioVideos() {\n  if (await isStudioApiBlocked())'));
assert('Alert: API Key ไม่สามารถใช้', sidepanelCode.includes('API Key นี้ไม่สามารถใช้ใน Studio ได้'));

// ===== 6. ห้ามคนแก่/เด็ก =====
console.log('\n👤 ห้ามคนแก่/เด็ก (TikTok Policy)');
assert('OVERCLAIM: ห้ามเด็ก', sidepanelCode.includes('ห้ามมีเด็ก (children, kid, child, baby'));
assert('OVERCLAIM: ห้ามผู้สูงอายุ', sidepanelCode.includes('ห้ามมีผู้สูงอายุ (elderly, old person, senior'));
assert('OVERCLAIM: 20-40 ปี', sidepanelCode.includes('ตัวละครต้องเป็นผู้ใหญ่วัยทำงาน (อายุ 20-40 ปี)'));
assert('IMAGE_TEMPLATE: working-age adult', sidepanelCode.includes('MUST be a working-age adult (20-40 years old). Do NOT depict children'));
assert('IMAGE_TEMPLATE: 2+ จุด', (sidepanelCode.match(/MUST be a working-age adult \(20-40 years old\)/g) || []).length >= 2);
assert('VIDEO STEP1: working-age adult', sidepanelCode.includes('person MUST be a working-age adult (20-40 years old)'));
assert('VIDEO STEP1+2: 2+ จุด', (sidepanelCode.match(/person MUST be a working-age adult/g) || []).length >= 2);
assert('STEP1 negative: children/elderly', sidepanelCode.includes('children, kids, baby, elderly, old person, senior citizen'));
assert('STEP1+2 negative: 2+ จุด', (sidepanelCode.match(/children, kids, baby, elderly, old person, senior citizen/g) || []).length >= 2);

// ===== 7. WEARABLE PRODUCT INTERACTION (เสื้อผ้าให้ใส่เลย) =====
console.log('\n👗 Wearable Product Interaction');
// IMAGE_PROMPT_TEMPLATE — ต้องมีคำสั่ง WEARING สำหรับ clothing
assert('IMAGE_TEMPLATE: fashion WEARING on body', sidepanelCode.includes('if the product is clothing/fashion — the character MUST be WEARING it on the body (NOT holding it)'));
assert('IMAGE_TEMPLATE: shoes WEARING on feet', sidepanelCode.includes('if it is shoes — WEARING them on the feet'));
assert('IMAGE_TEMPLATE: accessory WEARING/CARRYING', sidepanelCode.includes('if it is an accessory (hat, watch, glasses, bag, jewelry) — WEARING or CARRYING it as intended'));
assert('IMAGE_TEMPLATE: ไม่มี "holding or presenting the reference product" เดิม', !sidepanelCode.includes('holding or presenting the reference product in an engaging'));
// IMAGE_TEMPLATE_NO_TEXT — ต้องมีเหมือนกัน
assert('IMAGE_TEMPLATE_NO_TEXT: fashion WEARING (2+ จุด)', (sidepanelCode.match(/the character MUST be WEARING it on the body \(NOT holding it\)/g) || []).length >= 2);

// VIDEO_PROMPT_STEP1 — ต้องมี wearable-aware
assert('VIDEO STEP1: fashion wearing on body', sidepanelCode.includes('if the product is clothing or fashion — the person MUST be wearing it on the body (not holding it)'));
assert('VIDEO STEP1: shoes wearing on feet', sidepanelCode.includes('if shoes — wearing them on the feet'));
assert('VIDEO STEP1: มี wearable-aware interaction (accessory)', sidepanelCode.includes('if accessory (hat, watch, glasses, bag) — wearing or carrying it'));

// VIDEO_PROMPT_STEP2 — ต้องมี wearable-aware continuation
assert('VIDEO STEP2: fashion still wearing', sidepanelCode.includes('if the product is clothing or fashion — the person MUST still be wearing it on the body'));
assert('VIDEO STEP2: shoes still wearing', sidepanelCode.includes('if shoes — still wearing them on the feet'));

// getProductInteraction — ต้องมี function body (ไม่ใช่ return '' อีกแล้ว)
assert('getProductInteraction: fashion case', sidepanelCode.includes("case 'fashion':\n      return `The character is WEARING the product"));
assert('getProductInteraction: shoes case', sidepanelCode.includes("case 'shoes':\n      return `The character is WEARING the shoes"));
assert('getProductInteraction: beauty case', sidepanelCode.includes("case 'beauty':\n      return `The character is applying"));
assert('getProductInteraction: tech case', sidepanelCode.includes("case 'tech':\n      return `The character is actively USING"));

// getVideoAction — ต้องมี function body
assert('getVideoAction: fashion WEARING entire video', sidepanelCode.includes('WEARING') && sidepanelCode.includes('on their body throughout the entire video'));
assert('getVideoAction: shoes WEARING entire duration', sidepanelCode.includes('on their feet throughout the video'));
assert('getVideoAction: clothing MUST stay on body', sidepanelCode.includes('The clothing MUST stay on the body at all times'));

// getCategoryImageTemplate — ต้องมี function body
assert('getCategoryImageTemplate: fashion photography', sidepanelCode.includes('Lifestyle fashion photography'));
assert('getCategoryImageTemplate: MUST be worn (NOT held)', sidepanelCode.includes('The clothing MUST be worn (NOT held, NOT on a hanger, NOT draped)'));

// getCategoryVideoAction — ต้องมี function body
assert('getCategoryVideoAction: FASHION VIDEO', sidepanelCode.includes('FASHION VIDEO: The character MUST be WEARING'));
assert('getCategoryVideoAction: FOOTWEAR VIDEO', sidepanelCode.includes('FOOTWEAR VIDEO: The character MUST be WEARING'));

// batchSubjectDesc — ต้องใช้ batchProductInteraction แทน hardcode
assert('batchSubjectDesc: ใช้ batchProductInteraction', sidepanelCode.includes('${batchProductInteraction}`'));
assert('batchSubjectDesc: ไม่มี "holding or presenting the product in an engaging" เดิม', !sidepanelCode.includes('The character is holding or presenting the product in an engaging, enthusiastic manner.`'));

// ===== 8. ห้ามอ้างปี 2026 =====
console.log('\n🚫 ห้ามอ้างปี 2026');
assert('ไม่มี "ปีปัจจุบัน: 2026" เหลือ', !sidepanelCode.includes('ปีปัจจุบัน: 2026'));
assert('ไม่มี "ปี 2026" ในตัวอย่าง H2', !sidepanelCode.includes('ทรงปังมาก ปี 2026'));
assert('ไม่มี "ให้ใช้ 2026 เท่านั้น"', !sidepanelCode.includes('ให้ใช้ 2026 เท่านั้น'));
assert('ไม่มี "MARCH 2026" ใน Studio', !sidepanelCode.includes('MARCH 2026'));
assert('ไม่มี "Deep Research 2026"', !sidepanelCode.includes('Deep Research 2026'));
assert('OVERCLAIM: ห้ามอ้างตัวเลขปี', sidepanelCode.includes('ห้ามอ้างตัวเลขปี (พ.ศ./ค.ศ.) ทุกชนิด'));
assert('H1/H2 กฎ: ห้ามมีตัวเลขปีทุกชนิด', sidepanelCode.includes('ห้ามมีตัวเลขปีทุกชนิด'));
assert('enforceHeadline: strip ปี+เลข4หลัก', sidepanelCode.includes('.replace(/ปี\\s*\\d{4}/g,'));
assert('enforceHeadline: strip ค.ศ. 202x-203x', sidepanelCode.includes('.replace(/\\b20[2-3]\\d\\b/g,'));
assert('enforceHeadline: strip พ.ศ. 256x-257x', sidepanelCode.includes('.replace(/\\b25[6-7]\\d\\b/g,'));

// ===== 9. SELECTOR SETTINGS in Content Prompt =====
console.log('\n🎛️ Bulk Selector → Content Prompt');
assert('buildContentGenerationPrompt: SELECTOR SETTINGS block', sidepanelCode.includes('SELECTOR SETTINGS (ผู้ใช้เลือกไว้'));
assert('buildContentGenerationPrompt: isUserSelected filter', sidepanelCode.includes("const isUserSelected = (key) => key && !AUTO_KEYS.includes(key)"));
assert('buildContentGenerationPrompt: dialogueStyle selector', sidepanelCode.includes('DIALOGUE_STYLE_MAP?.[item.dialogueStyle]'));
assert('buildContentGenerationPrompt: speakingStyle selector', sidepanelCode.includes('SPEAKING_STYLE_MAP?.[item.speakingStyle]'));
assert('buildContentGenerationPrompt: voiceType selector', sidepanelCode.includes('VOICE_TONE_MAP?.[item.voiceType]'));
assert('buildContentGenerationPrompt: scriptStyle selector', sidepanelCode.includes('SCRIPT_STYLE_MAP?.[item.scriptStyle]'));
assert('buildContentGenerationPrompt: videoStyle selector', sidepanelCode.includes('VIDEO_STYLE_MAP?.[item.videoStyle]'));
assert('buildContentGenerationPrompt: thaiArtStyle selector', sidepanelCode.includes('THAI_ART_STYLE_MAP?.[item.thaiArtStyle]'));
assert('buildContentGenerationPrompt: ต้องทำตาม selector', sidepanelCode.includes('ต้องสอดคล้องกับ selector ที่ผู้ใช้เลือกไว้'));

// ===== 10. CHARACTER IDENTITY LOCK (Storymode) =====
console.log('\n🔒 Character Identity Lock (Storymode)');
assert('promptTemplate: CHARACTER IDENTITY LOCK', promptCode.includes('CHARACTER IDENTITY LOCK'));
assert('promptTemplate: COPY-PASTE Character Description Block', promptCode.includes('COPY-PASTE Character Description Block'));
assert('promptTemplate: ห้ามบรรยายตัวละครใหม่', promptCode.includes('ห้ามบรรยายตัวละครใหม่ในแต่ละฉาก'));
assert('promptTemplate: VISUAL STYLE LOCK', promptCode.includes('VISUAL STYLE LOCK'));
assert('promptTemplate: 3D Pixar ห้ามเปลี่ยนเป็น Realistic', promptCode.includes('ฉากสุดท้ายก็ต้องเป็น 3D Pixar ห้ามเปลี่ยนเป็น Realistic'));
assert('buildUserMessage: CHARACTER IDENTITY LOCK (ไม่มี ref)', sidepanelCode.includes('CHARACTER IDENTITY LOCK (ล็อคตัวละคร'));
assert('buildUserMessage: VISUAL STYLE LOCK (ไม่มี ref)', sidepanelCode.includes('VISUAL STYLE LOCK (ล็อคสไตล์ภาพ'));
assert('buildUserMessage: VISUAL STYLE LOCK (มี ref)', sidepanelCode.includes('VISUAL STYLE LOCK: สไตล์ภาพที่ใช้ในฉาก 1'));
assert('buildUserMessage: ฉากสุดท้ายตัวละครเดิม', sidepanelCode.includes('ฉากสุดท้ายก็ต้องเป็นตัวละครเดิม'));

// ===== 11. GOOGLE FLOW 9:16 =====
console.log('\n📐 Google Flow 9:16 Fix');
assert('findTab: icon ก่อน aria-controls', googleflowCode.includes("if(_0x2bbf98&&_0x140315===_0x2bbf98)return _0x5a97f9"));
assert('Step 5b: findTab(null,"9:16","crop_9_16")', googleflowCode.includes("findTab(null,'9:16','crop_9_16')"));
assert('Step 5b: เช็ค _is916Active', googleflowCode.includes('_is916Active'));
assert('Step 5b: เช็ค data-state=active', googleflowCode.includes("getAttribute']('data-state')==='active'"));
assert('Step 5b: skip ถ้า active', googleflowCode.includes("9:16\\x20already\\x20active"));
assert('ไม่มี findTab(PORTRAIT) เดิม', !googleflowCode.includes("findTab('PORTRAIT','Portrait','crop_9_16')"));
assert('Pipeline Image: crop_9_16 active check', googleflowCode.includes("[Pipeline]\\x209:16\\x20already\\x20active"));
assert('Pipeline Video: crop_9_16 active check', googleflowCode.includes("[Pipeline]\\x209:16\\x20already\\x20active\\x20(video)"));

// ===== 12. H1/H2 WORD LIMIT =====
console.log('\n📏 H1/H2 Word Limit (≤8/≤6 คำ)');
assert('NORMAL prompt: H1 ไม่เกิน 8 คำ', sidepanelCode.includes('H1: **ไม่เกิน 8 คำ**'));
assert('NORMAL prompt: H2 ไม่เกิน 6 คำ', sidepanelCode.includes('H2: **ไม่เกิน 6 คำ**'));
assert('EXTEND prompt: H1 ไม่เกิน 8 คำ', (sidepanelCode.match(/H1: \*\*ไม่เกิน 8 คำ\*\*/g) || []).length >= 2);
assert('EXTEND prompt: H2 ไม่เกิน 6 คำ', (sidepanelCode.match(/H2: \*\*ไม่เกิน 6 คำ\*\*/g) || []).length >= 2);
assert('กฎท้าย: H1 ไม่เกิน 8 คำ, H2 ไม่เกิน 6 คำ', sidepanelCode.includes('H1 ไม่เกิน 8 คำ, H2 ไม่เกิน 6 คำ'));
assert('ตัวอย่างที่ห้าม (ยาวเกิน)', sidepanelCode.includes('ยาวเกิน!'));
assert('aiShortenHeadline function', sidepanelCode.includes('async function aiShortenHeadline(text, maxWords, type)'));
assert('aiShortenHeadline: single mode', sidepanelCode.includes("await aiShortenHeadline(item.h1Headline, 8, 'h1')"));
assert('aiShortenHeadline: batch mode', sidepanelCode.includes("await aiShortenHeadline(h1Headline, 8, 'h1')"));
assert('Storymode: H1/H2 WORD LIMIT', promptCode.includes('H1/H2 WORD LIMIT'));
assert('Storymode: H1 ไม่เกิน 8 คำ', promptCode.includes('H1 ต้องไม่เกิน 8 คำ'));

// ===== SUMMARY =====
console.log('\n' + '═'.repeat(60));
const total = pass + fail;
if (fail === 0) {
  console.log(`\n✅ ALL ${total} TESTS PASSED!`);
} else {
  console.log(`\n❌ ${fail} TESTS FAILED out of ${total}:`);
  failures.forEach(f => console.log(`   - ${f}`));
}
console.log(`\n   Pass: ${pass} | Fail: ${fail} | Total: ${total}`);
console.log(`   Build: v${manifestData.version} | Tested: ${new Date().toLocaleString()}\n`);

process.exit(fail > 0 ? 1 : 0);
