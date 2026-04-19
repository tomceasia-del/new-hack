# CONTENT EXTRACTION QUEUE
> เป้าหมาย: แยก "คำพูด + กฎเนื้อหา + logic คอนเทนต์" ออกจากกลไก Chrome extension
> อัปเดตล่าสุด: Phase 1 วิเคราะห์ครบทุกไฟล์

---

## RUBRIC สถานะสุดท้าย (ใช้ร่วมกันทุกบทบาท)

| สถานะ | ความหมาย |
|--------|-----------|
| `keep_full` | เนื้อหา/กฎล้วน — เก็บเข้าชุดหลักทั้งหมด |
| `keep_partial` | มีเนื้อหาปนกลไก — ระบุ sub/ส่วนที่เก็บ |
| `drop_mechanics` | กลไกล้วน — ไม่เก็บในงานคำพูด |
| `inbox_scrap` | มีประโยชน์แต่เล็กน้อย/ไม่ใช่คำ — เก็บไว้ใน inbox รอจัดหมวด |

## กฎเชื่อใจ (Trust Rules)
- ขัดกันเรื่อง **ข้อเท็จจริงในไฟล์** → เชื่อฝั่งที่อ้างบรรทัด/คำค้นที่ตรวจได้
- ขัดกันเรื่อง **ความหมาย/นโยบาย** → ตั้ง ความขัดแย้ง = Y ไม่ตัดเอง
- ที่เหลือ → จับคู่ rubric + น้ำหนัก W

---

## QUEUE (เรียงตาม W สูง → ต่ำ)

| # | ไฟล์ | บรรทัด | W | Scout_สรุป | Auditor_สรุป | Analyst_คำแนะ | ความขัดแย้ง | คำถาม_Orchestrator | คำตอบ_คน | สถานะสุดท้าย |
|---|------|--------|---|------------|--------------|---------------|-------------|-------------------|-----------|--------------|
| 1 | `js/forbidden-words-list.js` | 212 | 5 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `keep_full` | N | - | - | - |
| 2 | `js/promptTemplate.original.js` | 861 | 5 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `keep_full` | N | - | - | - |
| 3 | `js/sidepanel.js` | 14,225 | 5 | [sub แยกด้านล่าง] | [sub แยกด้านล่าง] | `keep_partial` | Y | [Orchestrator ด้านล่าง] | - | - |
| 4 | `js/prompt-screening.js` | 170 | 4 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `keep_partial` | N | - | - | - |
| 5 | `1CLICK_AUTOMATIC_SYSTEM_SPEC.md` | 911 | 4 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `inbox_scrap` | N | - | - | - |
| 6 | `js/content-googleflow.js` | 15,107 | 2 | [sub แยกด้านล่าง] | [sub แยกด้านล่าง] | `keep_partial` | Y | [Orchestrator ด้านล่าง] | - | - |
| 7 | `js/background.js` | 1,850 | 2 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `inbox_scrap` | N | - | - | - |
| 8 | `js/content.js` | 2,652 | 3 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `inbox_scrap` | N | - | - | - |
| 9 | `js/content-tiktok-platform.js` | 1,655 | 2 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `inbox_scrap` | N | - | - | - |
| 10 | `js/content-facebook.js` | 305 | 2 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `inbox_scrap` | N | - | - | - |
| 11 | `js/content-youtube.js` | 423 | 2 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `inbox_scrap` | N | - | - | - |
| 12 | `sidepanel.html` | 1,682 | 3 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `keep_partial` | N | - | - | - |
| 13 | `js/api.js` | 102 | 2 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `inbox_scrap` | N | - | - | - |
| 14 | `js/promptTemplate.js` | 53 | 3 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `drop_mechanics` | N | - | - | - |
| 15 | `js/promptTemplate.encoded.js` | 112 | 2 | [Scout ด้านล่าง] | [Auditor ด้านล่าง] | `drop_mechanics` | N | - | - | - |
| 16 | `js/license-service.js` | 315 | 1 | กลไก license ล้วน | ยืนยัน กลไกล้วน | `drop_mechanics` | N | - | - | - |
| 17 | `js/firebase-config.js` | 51 | 1 | config XOR-encoded | ยืนยัน config ล้วน | `drop_mechanics` | N | - | - | - |
| 18 | `js/tiktok-click-helper.js` | 1,383 | 1 | กลไก click simulation | ยืนยัน กลไกล้วน | `drop_mechanics` | N | - | - | - |
| 19 | `js/intercept-blob.js` | 135 | 1 | intercept video blob | ยืนยัน กลไกล้วน | `drop_mechanics` | N | - | - | - |
| 20 | `js/offscreen.js` | 61 | 1 | อ่านไฟล์จาก disk | ยืนยัน กลไกล้วน | `drop_mechanics` | N | - | - | - |
| 21 | `manifest.json` | 120 | 1 | ประกาศ extension | ยืนยัน config ล้วน | `drop_mechanics` | N | - | - | - |
| 22 | `test-runner.js` | ~50 | 1 | ทดสอบ | ยืนยัน | `drop_mechanics` | N | - | - | - |
| 23 | `test-all.html` | 196 | 1 | test page | ยืนยัน | `drop_mechanics` | N | - | - | - |
| 24 | `offscreen.html` | 7 | 1 | โครงหน้า offscreen | ยืนยัน | `drop_mechanics` | N | - | - | - |
| 25 | `check_content.ps1` | ~30 | 2 | PowerShell script ตรวจ content | ยืนยัน กลไกล้วน | `drop_mechanics` | N | - | - | - |
| 26 | `css/sidepanel.css` | ~200 | 1 | สไตล์ | ยืนยัน | `drop_mechanics` | N | - | - | - |
| 27 | `images/logo*.svg` | - | 1 | โลโก้ | ยืนยัน | `drop_mechanics` | N | - | - | - |
| 28 | `images/icon*.svg` | - | 1 | ไอคอน | ยืนยัน | `drop_mechanics` | N | - | - | - |
| 29 | `icons/icon.svg` | - | 1 | ไอคอน | ยืนยัน | `drop_mechanics` | N | - | - | - |

---

## รายละเอียด Scout → Auditor → Analyst ต่อไฟล์/sub

---

### 1) js/forbidden-words-list.js (W5, 212 บรรทัด)

**Scout:**
เนื้อหาล้วน 100% — รายการวลีโฆษณาห้ามใช้ ~200 รายการในภาษาไทยและอังกฤษ ไม่มีกลไก Chrome ใดๆ
เนื้อหาที่พบ (จำแนกได้เป็น 7 กลุ่มตามความหมาย):
1. น้ำหนักลดและรูปร่าง: ลดความอ้วน, ลดน้ำหนัก, ดักจับไขมัน, สลายไขมัน, ระเบิดพุง, เพรียวถาวร ฯลฯ
2. ผิว/ความขาว/ความงาม: ขาวไว, ขาวอมชมพู, ลดเม็ดสีเมลานิน, หน้าเด้ง, หน้าเด็ก, ชะลอความแก่ ฯลฯ
3. การแพทย์/รักษา: รักษาโรค, หายขาด, ป้องกันมะเร็ง, ฆ่าเชื้อสิว, FDA Approved, Medical Grade ฯลฯ
4. การันตีผล/overclaim: การันตี, รับประกันผล, 100%, Best Seller, No.1, เห็นผลทันที ฯลฯ
5. กดดันซื้อ/scarcity: ช้าคืออด (ไม่พบในไฟล์นี้ แต่อยู่ใน prompt), แจกฟรี, รายได้หลักแสน, สั่งนอกระบบ ฯลฯ
6. คำช่องทางนอกระบบ: แอดไลน์, Line ID, WhatsApp, โอนนอกระบบ
7. Placeholder ที่ไม่ใช่คำห้าม: yourshop, brandname, shopname, บาท, เฮ้ย (คำ placeholder สำหรับ test)

**Auditor:**
Scout ครบถ้วน ไม่พบกลไก Chrome ใดๆ ยืนยัน เนื้อหาล้วน
สังเกตเพิ่ม: "เฮ้ย", "yourshop", "brandname", "shopname", "บาท" เป็น placeholder ไม่ใช่คำห้ามจริง ควรแยกออกเมื่อจัดหมวด

**Analyst:**
→ `keep_full` ไม่ขัดแย้ง
หมายเหตุ: ตอนจัดหมวดหลักให้แยก placeholder ออก (yourshop/brandname/shopname) และตัด "เฮ้ย" ออกจากลิสต์นี้ (มันเป็นคำห้ามใน prompt ไม่ใช่คำโฆษณา)

---

### 2) js/promptTemplate.original.js (W5, 861 บรรทัด)

**Scout:**
เนื้อหาล้วน 100% ไม่มีกลไก Chrome ใดๆ เป็นไฟล์ที่มีคุณค่าสูงสุดในโปรเจกต์

เนื้อหาแบ่งเป็น 15 ส่วนหลัก:

**A. ADAPTIVE_VIDEO_DIRECTOR_PROMPT (บรรทัด 1-275) — Master System Prompt:**
- Platform modes (Flow 8s, Grok 6s, Super Grok 10s) + กฎ style/persona
- System Override 16 ข้อ: ห้าม auto-gen, no trademarks, full scene sequence, story continuity, FORBIDDEN WORDS (5 หมวด overclaim), dialogue permission, ASMR, dialogue length, anatomy lock, Thai character lock, voice lock, scene progression, opening rule, output compression, Google Flow policy, product truth lock
- Viral Intelligence 4 ข้อ: Reali-TEA, Pattern Interrupt, Shoppertainment, Sonic Driver
- Product Image Mode: สินค้าเป็น prop, ตัวละครคือคน
- No Ghost Mode
- Label Text Lock
- Review Dialogue Authenticity Lock
- Text Overlay Continuity
- Trend Injection 4 ข้อ + Audio safe list
- Advanced AI Capabilities
- Hook Master AI: 4 หมวด, วิธีใช้, ตัวอย่าง
- Dialogue Naturalness & TTS-Safe: 6 ข้อ (ใช้ภาษาพูด, ห้ามคำยาก, TTS-SAFE rules ห้าม อย./ตัวเลขดิบ/%, ห้ามสัญลักษณ์, จังหวะ, ห้ามขึ้นต้นซ้ำ)
- กฎเหล็ก 5 ข้อ: Input Loyalty, No Skipping, Sales Mode (2 ซีนสุดท้ายขายของ), No Bold, Format
- Input Parsing: ตัวเลขคือ Style, ซีนต้องมีคำว่า "ซีน", Media Recognition, Multi-Language
- Output Format Template (storyboard + image prompt + video prompt blocks)
- Multi-turn Continuation Rules

**B. STYLE_OPTIONS (บรรทัด 277-348):** 63 styles พร้อม id/name/description (Hard Sell → Political Satire)

**C. MOOD_KEYWORDS (บรรทัด 350-394):** 40 mood keywords (Cinematic Standard → Paparazzi Flash)

**D. PLATFORM_MODES (บรรทัด 396-400):** flow/grok/supergrok + duration/words/sentences

**E. HOOK_LIBRARY (บรรทัด 407-615):** 200 hooks แบ่ง 4 category พร้อม text จริง

**F. HOOK_CATEGORIES (บรรทัด 617-622):** 4 หมวด FOMO/AUTHENTIC/OBSESSION/CURIOSITY + desc

**G. VISUAL_STYLES (บรรทัด 628-679):** 50 visual styles พร้อม id/name/icon/desc/prompt

**H. SCENE_TEMPLATES (บรรทัด 684-693):** 8 scene types พร้อม expression/action/camera

**I. DIALECTS (บรรทัด 698-707):** 8 dialect options พร้อม prompt

**J. TONES (บรรทัด 712-723):** 10 tone options พร้อม prompt

**K. SCENE_LOCATIONS (บรรทัด 728-744):** 15 locations พร้อม prompt

**L. PACINGS (บรรทัด 749-755):** 5 pacing options พร้อม prompt

**M. SHOOTING_STYLES (บรรทัด 760-768):** 7 shooting styles พร้อม prompt

**N. PROMPT_MODES (บรรทัด 773-810):** 8 prompt modes (Default, Step Story, Dance, Review, Benefit Story, A/B Test, Compliance Mode) พร้อม directive

**O. FILM_MODES (บรรทัด 815-835):** 4 film modes (none, Cinematic, Kids Drama, Ghost CCTV) พร้อม prompt

**P. NEGATIVE_PROMPT + NO_TEXT_ENFORCEMENT (บรรทัด 840-842):** สตริงห้าม text/anatomy

**Q. TIKTOK_CAPTION_REPAIR_PROMPT (บรรทัด 847-859):** system prompt สำหรับ caption สั้น

**Auditor:**
Scout ครบถ้วนและแม่นยำ ยืนยันทุกส่วน เป็นเนื้อหาล้วน ไม่มีกลไก chrome/fetch/DOM
Spot-check: บรรทัด 275 จบ template, บรรทัด 277 เริ่ม STYLE_OPTIONS — ไม่มี export mechanics
หมายเหตุเพิ่ม: VISUAL_STYLES มี prompt สำหรับ AI image generation — อาจแยกเป็นหมวด "visual style library" เพิ่มเติมเมื่อจัดชุดหลัก

**Analyst:**
→ `keep_full` ไม่ขัดแย้ง
ทั้ง 17 ส่วนเป็นเนื้อหาและกฎล้วน เก็บเข้าชุดหลักได้ทันทีโดยจัดหมวดตามส่วน A-Q

---

### 3) js/sidepanel.js (W5, ~14,225 บรรทัด) — แบ่ง sub

#### sub 3A: license_init (บรรทัด 1-100)

**Scout:**
ส่วนนี้เป็น license UI init ล้วน — `initLicenseSystem()`, auto-format input, button click handler
มีเนื้อหาเล็กน้อย: `DEV_MODE = false` (product flag), ข้อความ "DEV MODE" string

**Auditor:** ยืนยัน กลไก UI + license เป็นหลัก ไม่มีกฎเนื้อหา

**Analyst:** → `drop_mechanics`

---

#### sub 3B: strings_กฎ_forbidden_flow (ค้นหา GOOGLE_FLOW_FORBIDDEN_WORDS, BODY_DESC, AUDIO_SAFE)

**Scout (บรรทัด ~1625-1680):**
พบ 6 โครงที่เป็น "content policy placeholder" สำคัญ:
1. `GOOGLE_FLOW_FORBIDDEN_WORDS = []` — คำต้องห้ามสำหรับ Flow audio (ว่าง, TODO)
2. `GOOGLE_FLOW_WORD_REPLACEMENTS = {}` — คำแทนที่ (ว่าง, TODO)
3. `sanitizeDialogueForGoogleFlow(dialogue)` — logic sanitize บทพูด (passthrough, TODO)
4. `BODY_DESC_SAFE_REWRITES = []` — คำบรรยายร่างกายที่ต้องแทนที่ (ว่าง, TODO)
5. `sanitizeCharacterDesc(desc)` — sanitize character description (passthrough, TODO)
6. `AUDIO_SAFE_REPLACEMENTS = {}` — audio keyword replacements (ว่าง, TODO)
7. `userCustomForbiddenWords` + `loadCustomForbiddenWords()` — custom words จาก user (มีกลไก chrome.storage)

**Auditor:**
ยืนยัน Scout ถูก — ส่วนนี้สำคัญมาก แม้จะว่างอยู่ แต่ **โครงสร้างและชื่อตัวแปรบอก "กฎที่ต้องมี"** ในผลิตภัณฑ์ใหม่:
- คำห้าม Flow audio (ต่างจาก marketing forbidden)
- การ rewrite คำบรรยายร่างกาย
- Audio safe replacements
นี่คือ "spec ที่ซ่อนอยู่ในโค้ด" ที่ควรนำไปทำเป็น requirement ในแอปใหม่

**Analyst:**
→ `keep_partial` + `inbox_scrap` — **ไม่มีเนื้อหา (TODO ทั้งหมด)** แต่โครง 6 รายการบอก "ช่องว่างที่ต้องเติม"
ความขัดแย้ง: ควรเก็บเป็น "requirement ที่ยังไม่มีข้อมูล" หรือ drop?
→ ตั้ง Y เพื่อถามคน

---

#### sub 3C: strings_กฎ_hook_builder (บรรทัด ~1-30 — buildHookMasterPrompt)

**Scout:**
```
function buildHookMasterPrompt(overrideCat, usedHookIds) { return ''; }
const HOOK_MASTER_SECTION = '';
function getEnhancedPrompt(overrideHookCat, usedHookIds) { return ''; }
```
ทั้งหมดเป็น placeholder TODO — ฟังก์ชันว่าง

**Auditor:** ยืนยัน — กลไก + placeholder ว่าง logic จริงอยู่ใน promptTemplate.original.js แล้ว

**Analyst:** → `drop_mechanics` — เนื้อหาจริงอยู่ใน promptTemplate.original.js แล้ว

---

### 4) js/prompt-screening.js (W4, 170 บรรทัด)

**Scout:**
เนื้อหาที่พบ:
1. **Policy description (บรรทัด 1-9):** ปรัชญาการ screening: ประหยัด API, Gemini เฉพาะข้อ user ล่าสุด, แคช LRU, Flash ก่อน fallback — นี่คือ **product/ops logic** ที่มีประโยชน์
2. **Placeholder slots (TODO):** VIOLENCE_AND_UNSAFE_EN, RISK_SNIPPETS, HARD_BAN_REGEXES, GEMINI_SCREENER_SYSTEM, localScreenText — 5 ช่องว่างที่ต้องเติมในผลิตภัณฑ์ใหม่
3. **screenProductAnalysisObject:** รายการ fields ที่ต้อง screen: appearance, features, targetAudience, usage, videoTips, summary_en, productType, brand, colorTone — เป็น data model ที่มีประโยชน์
4. **shouldSkipGeminiCompliance:** เงื่อนไข "ข้าม AI screener" (ถ้าข้อความสั้น/local แก้แล้ว/ไม่เสี่ยง) — ops logic
กลไก: fetch Gemini, cache Map, hash function — ไม่เก็บ

**Auditor:**
ยืนยัน Scout ถูก บรรทัด 163 (keys array ใน screenProductAnalysisObject) เป็นเนื้อหาจริง
เพิ่ม: บรรทัด 131-143 (ฟังก์ชัน screen ต่างๆ passthrough) บ่งบอก "API surface" ของระบบ screening — มีประโยชน์เป็น spec

**Analyst:**
→ `keep_partial`: เก็บเฉพาะ (1) comment block บรรทัด 1-9, (2) รายการ TODO placeholders ชื่อตัวแปร, (3) keys ใน screenProductAnalysisObject, (4) เงื่อนไข shouldSkipGeminiCompliance
ทิ้ง: fetch/cache/hash/Map mechanics

---

### 5) 1CLICK_AUTOMATIC_SYSTEM_SPEC.md (W4, 911 บรรทัด)

**Scout:**
เป็นเอกสารสเปคระบบที่ถูกสร้างขึ้นจากการวิเคราะห์ extension แล้ว ประกอบด้วย:
- สรุป Firebase config (decoded) → ไม่เกี่ยวกับคำพูด
- สรุป HMAC/License → ไม่เกี่ยวกับคำพูด
- สรุป AI Providers + models → inbox (ข้อมูล ops)
- สรุป TikTok/FB/YT upload selectors → drop_mechanics
- สรุป Google Flow pipeline → drop_mechanics
- Data models → inbox (เป็น TypeScript interface ที่มีประโยชน์สำหรับ DB design)
- API Endpoints → inbox
- UI Components tab names → inbox

**Auditor:**
ยืนยัน — spec นี้เป็น "derivative document" ไม่ใช่ source of truth ของเนื้อหา ข้อมูล content จริงอยู่ใน promptTemplate.original.js และ forbidden-words-list.js แล้ว

**Analyst:**
→ `inbox_scrap` — เก็บเป็น reference สำหรับ DB design และ system architecture ไม่ใช่ชุดกฎคำพูด

---

### 6) js/content-googleflow.js (W2, ~15,107 บรรทัด) — แบ่ง sub

#### sub 6A: step_labels และ status messages

**Scout:**
ค้นหา pattern `updateStatus` / step descriptions ในไฟล์ขนาดใหญ่
พบ: ข้อความสถานะการทำงาน เช่น "⏳ รอหน้า Upload โหลด...", "📤 กำลังอัพโหลด Video...", "🛒 กำลังปักตะกร้า..." ฯลฯ — เป็น UI copy ไม่ใช่กฎคำพูด

**Scout เพิ่ม (Google Flow steps):**
พบ comment blocks บรรยาย step ที่สำคัญ:
Step 1-13 ใน comment: New Project, Select Mode, Upload Image, Add to Prompt, Paste Prompt, Generate, Wait Image, Add to Video, Paste Video, Select Video, Wait Video, Download, Extend
นี่คือ **workflow/SOP ที่อาจมีประโยชน์** สำหรับทำแอปภายหลัง

**Auditor:**
ยืนยัน Scout — ส่วน step labels/flow เป็น SOP มากกว่า "กฎคำพูด" โดยตรง
เนื้อหาที่เกี่ยวกับ content: มีหรือไม่? ต้องการ verify บรรทัดเฉพาะที่อาจมีกฎ prompt/content ปน
ตั้ง Y รอ Orchestrator ถามว่าจะเก็บ SOP workflow ไว้ด้วยหรือไม่

**Analyst:**
→ `inbox_scrap` (SOP workflow) + `drop_mechanics` (automation code)
ความขัดแย้ง Y: "SOP Google Flow ควรอยู่ใน inbox หรือ drop ทั้งหมด?"

---

### 7) js/background.js (W2, ~1,850 บรรทัด)

**Scout:**
ส่วนที่มีเนื้อหา (ไม่ใช่กลไก):
1. ข้อความ error/status สำหรับผู้ใช้: "⚠️ File too small, skip", "All Gemini models rate limited — กรุณารอสักครู่แล้วลองใหม่" — เป็น UX copy เล็กน้อย
2. ข้อความ Slate paste (บรรทัด ~220+): อธิบาย logic การวาง prompt ใน editor — กลไกล้วน
3. ไม่พบกฎคำพูดหรือ forbidden words ใดๆ

**Auditor:** ยืนยัน กลไกล้วน ไม่มีเนื้อหาที่ควรเก็บในชุดกฎคำพูด

**Analyst:** → `inbox_scrap` (เฉพาะ UX copy string เล็กน้อยถ้าต้องการ) มิฉะนั้น `drop_mechanics`

---

### 8) js/content.js (W3, ~2,652 บรรทัด)

**Scout:**
ส่วนที่มีเนื้อหา:
1. ข้อความ status panel: "⏳ TikTok Scraper — กำลังดึงข้อมูล...", flow label ต่างๆ
2. โครงสร้าง STATE (isRunning, isStopped, currentPage ฯลฯ) — กลไกล้วน
3. SELECTORS object — กลไก DOM ล้วน
4. ฟังก์ชัน simulateRealClick — กลไกล้วน
ไม่พบกฎเนื้อหาคำพูด

**Auditor:** ยืนยัน กลไก DOM scraper ล้วน ข้อความ status เป็น UX copy ไม่ใช่กฎเนื้อหา

**Analyst:** → `inbox_scrap` (UX copy เล็กน้อย) มิฉะนั้น `drop_mechanics`

---

### 9) js/content-tiktok-platform.js (W2, ~1,655 บรรทัด)

**Scout:**
ส่วนที่มีเนื้อหา:
1. Status messages: "📤 กำลังอัพโหลด Video...", "📝 กำลังใส่ Caption...", "🛒 กำลังปักตะกร้า...", "⏳ รอหน้า Upload โหลด...", "⚠️ หน้า Upload ไม่พร้อม" — UX copy ของ automation
2. Error messages: "Upload failed", "Upload page not ready" — UX copy
ไม่พบกฎเนื้อหาคำพูด

**Auditor:** ยืนยัน กลไก DOM automation ล้วน

**Analyst:** → `inbox_scrap` (status labels ถ้าจะทำ UI automation ภายหลัง) มิฉะนั้น `drop_mechanics`

---

### 10) js/content-facebook.js (W2, ~305 บรรทัด)

**Scout:**
กลไก DOM automation สำหรับ Facebook upload ล้วน — selectors, upload steps, caption, schedule
ไม่พบกฎเนื้อหาคำพูด มี UX copy เล็กน้อย: "[Facebook] Setting caption...", "[FB Platform] Uploading..."

**Auditor:** ยืนยัน กลไกล้วน

**Analyst:** → `drop_mechanics`

---

### 11) js/content-youtube.js (W2, ~423 บรรทัด)

**Scout:**
กลไก DOM automation สำหรับ YouTube upload — selectors, title/description input, schedule
ไม่พบกฎเนื้อหาคำพูด มี UX copy เล็กน้อย console logs

**Auditor:** ยืนยัน กลไกล้วน

**Analyst:** → `drop_mechanics`

---

### 12) sidepanel.html (W3, ~1,682 บรรทัด)

**Scout:**
ข้อความผู้ใช้ที่พบ (UI copy):
1. License screen: "เปิดใช้งาน License", "กรอก License Key ที่ได้รับ...", "DEVICE ID ของคุณ", "1 License Key สามารถใช้งานได้พร้อมกัน 4 อุปกรณ์", "เปิดใช้งาน", "จัดการอุปกรณ์ที่ลงทะเบียน", "ต้องการ License Key? ติดต่อผู้ดูแลระบบ"
2. แท็บหลัก: Auto Post, Storymode, Studio, Platform, Templates, Dashboard, Settings (ชื่อฟีเจอร์)
3. ข้อความ placeholder ต่างๆ ในฟอร์ม
ส่วนที่เหลือเป็น HTML markup ล้วน

**Auditor:** ยืนยัน Scout — ข้อความ UI copy มีประโยชน์เล็กน้อยสำหรับออกแบบ UX แอปใหม่

**Analyst:** → `keep_partial` เก็บเฉพาะ (1) ชื่อแท็บ/feature names, (2) ข้อความ UI บน license screen สำหรับอ้างอิง UX แอปใหม่

---

### 13) js/api.js (W2, ~102 บรรทัด)

**Scout:**
เนื้อหาที่มีประโยชน์:
1. AI models list: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.5-pro`, `gpt-4-turbo-preview`
2. Config: `max_tokens: 16000`, `temperature: 0.7`, `maxOutputTokens: 16384`
3. Safety settings: BLOCK_NONE สำหรับ HARASSMENT, HATE_SPEECH, SEXUALLY_EXPLICIT, DANGEROUS_CONTENT
4. Fallback strategy: ลองโมเดลถัดไปเมื่อ 429/rate limit/quota exhausted
ส่วนที่เหลือเป็น fetch/HTTP mechanics

**Auditor:** ยืนยัน Scout — model list และ config เป็น ops/system config ไม่ใช่กฎเนื้อหา

**Analyst:** → `inbox_scrap` (model list + config เป็น ops reference สำหรับ backend design)

---

### 14) js/promptTemplate.js (W3, 53 บรรทัด)

**Scout:**
ดูจากขนาดและชื่อ — น่าจะเป็น placeholder ที่ re-export จาก encoded หรือ original
(จาก Grep ก่อนหน้า: `export const ADAPTIVE_VIDEO_DIRECTOR_PROMPT = '';` และ export อื่นๆ ว่าง)

**Auditor:** ยืนยัน — เป็น stub/placeholder เนื้อหาจริงอยู่ใน promptTemplate.original.js

**Analyst:** → `drop_mechanics` (ไม่มีเนื้อหา เป็น stub)

---

### 15) js/promptTemplate.encoded.js (W2, 112 บรรทัด)

**Scout:**
เป็น XOR-encoded version ของ promptTemplate.original.js — ถอดรหัสได้เป็นเนื้อหาเดียวกัน
ไม่มีเนื้อหาใหม่ที่ไม่ได้อยู่ใน original แล้ว

**Auditor:** ยืนยัน — duplicate ของ original ในรูป encoded

**Analyst:** → `drop_mechanics` (เนื้อหาซ้ำกับ original ที่ keep_full แล้ว)

---

## คำถาม Orchestrator สำหรับ Human Gate (Phase 2)

รวมแถวที่ `ความขัดแย้ง = Y`:

### คำถามที่ 1 — จาก sub 3B (sidepanel.js / strings_กฎ_forbidden_flow)

**บริบท:** พบโครงสร้าง 6 รายการที่เป็น TODO placeholder ในชุด Google Flow / audio / body description rules:
- `GOOGLE_FLOW_FORBIDDEN_WORDS` (ว่าง) — คำห้ามสำหรับ Flow audio
- `GOOGLE_FLOW_WORD_REPLACEMENTS` (ว่าง) — คำแทนที่
- `sanitizeDialogueForGoogleFlow` (passthrough) — logic sanitize
- `BODY_DESC_SAFE_REWRITES` (ว่าง) — rewrite คำบรรยายร่างกาย
- `sanitizeCharacterDesc` (passthrough) — sanitize character description
- `AUDIO_SAFE_REPLACEMENTS` (ว่าง) — audio replacements

**คำถาม:** โครง 6 รายการนี้ยังไม่มีข้อมูลจริงในไฟล์นี้ — ต้องการเก็บเป็น "requirement ที่ต้องเติมในแอปใหม่" (inbox_scrap) หรือ drop ทิ้งทั้งหมด?
- **ตัวเลือก A:** เก็บเป็น inbox — ชื่อตัวแปรทั้ง 6 เป็น requirement spec สำหรับทีม content/compliance
- **ตัวเลือก B:** drop — เนื้อหาว่างเปล่า ไม่มีประโยชน์จนกว่าจะมีข้อมูล

**คำตอบ_คน:** _____

---

### คำถามที่ 2 — จาก sub 6A (content-googleflow.js / SOP workflow)

**บริบท:** ในไฟล์ขนาดใหญ่ content-googleflow.js (~15k บรรทัด) มี comment blocks อธิบาย SOP workflow ของ Google Flow pipeline *(note: เลข 13 ขั้นตอนในเอกสารนี้ = editorial summary; automation steps จริงใน AUTOPOST_STEPS = 17 steps — ดู `CONTENT_INBOX/sop-master.md`)*

**คำถาม:** ต้องการเก็บ SOP workflow นี้ไว้หรือไม่?
- **ตัวเลือก A:** เก็บ inbox — SOP มีประโยชน์สำหรับทำความเข้าใจ product flow ถึงแม้จะไม่ใช้ automation extension
- **ตัวเลือก B:** drop — Google Flow เป็นเครื่องมือภายนอก ไม่เกี่ยวกับ "กฎคำพูด" โดยตรง

**คำตอบ_คน:** _____

---

## สถิติ Phase 1 (สรุปเบื้องต้น)

| สถานะ | จำนวนไฟล์/sub | รายการ |
|--------|---------------|--------|
| `keep_full` | 2 | forbidden-words-list.js, promptTemplate.original.js |
| `keep_partial` | 4 | prompt-screening.js (บางส่วน), sidepanel.js/sub-3B (รอคน), sidepanel.html (UX copy), content-googleflow.js/sub-6A (รอคน) |
| `inbox_scrap` | 7 | 1CLICK_SPEC.md, background.js, content.js, content-tiktok-platform.js, api.js, sidepanel.js/sub-3C+3A |
| `drop_mechanics` | 16 | ไฟล์กลไกทั้งหมด |
| รอคนตัดสิน (Y) | 2 | คำถามที่ 1 และ 2 ด้านบน |

---

## ที่เก็บสองชั้น (สร้างแล้ว — Phase 3 Executor เสร็จสมบูรณ์)

- **ชุดหลัก** → `CONTENT_CORE/` ✅ สร้างแล้ว
- **Inbox** → `CONTENT_INBOX/` ✅ สร้างแล้ว

---

## Phase 3 — Executor Log (สรุปไฟล์ที่สร้าง)

| ไฟล์ | แหล่งที่มา | หมายเหตุ |
|------|-----------|---------|
| `CONTENT_CORE/01-forbidden-marketing-phrases.js` | `js/forbidden-words-list.js` | keep_full — copy ตรง |
| `CONTENT_CORE/02-master-prompt-template.js` | `js/promptTemplate.original.js` | keep_full — copy ตรง |
| `CONTENT_CORE/03-body-desc-safe-rewrites.js` | slot ว่างใน sidepanel.js + research | **ใหม่ทั้งหมด** — เติมจาก Google Imagen/Veo + TikTok policy 2025 |
| `CONTENT_CORE/04-google-flow-policy.js` | `sanitizePromptForFlow` ใน content-googleflow.js + slot ว่าง sidepanel.js | keep_partial — logic จริง + เติม slot |
| `CONTENT_CORE/05-prompt-screening-spec.js` | `js/prompt-screening.js` | keep_partial — เฉพาะ spec/keys |
| `CONTENT_CORE/06-ui-copy.js` | `sidepanel.html` + `content.js` + `content-tiktok-platform.js` + `background.js` | keep_partial — UX copy รวมที่เดียว |
| `CONTENT_INBOX/inbox-reference.md` | `js/api.js` + `1CLICK_SPEC.md` + SOP จาก `content-googleflow.js` | inbox_scrap — ops reference |

### คำตอบคำถาม Orchestrator (Phase 2)

- **คำถามที่ 1** (โครง 6 slot ว่าง sidepanel.js): **ตอบ A** — เก็บ + เติมข้อมูลจาก research จริง → สร้างเป็น `03-body-desc-safe-rewrites.js` และ `04-google-flow-policy.js` ที่สมบูรณ์แล้ว
- **คำถามที่ 2** (SOP Google Flow 13 ขั้นตอน): **ตอบ A** — เก็บใน `CONTENT_INBOX/inbox-reference.md`
