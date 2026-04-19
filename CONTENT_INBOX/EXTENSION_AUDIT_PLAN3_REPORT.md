# Extension Audit — Plan 3 Report
> วันที่: 16 เมษายน 2026  
> แหล่งตรวจ: `1click-full-v3.40 (2)/`  
> เทียบกับ: `CONTENT_CORE/` และ `GEM_PACK_TIKTOK/`  
> วิธี: Extension-first (Phase 1 → Core diff → Gem diff → Non-TikTok → Backlog)

---

## สรุปภาพรวม

| เรื่อง | สถานะ |
|--------|-------|
| ส่วนที่ย้ายไป CONTENT_CORE ครบ (Match) | promptTemplate / STYLE_OPTIONS / HOOK_LIBRARY / VISUAL_STYLES / FILM_MODES / FILM_MODES + 02-master ทั้งหมด; forbidden-words-list; Flow sanitize stubs → 04 |
| ส่วนที่ย้ายแล้วแต่ขาดรายละเอียด (Partial) | taxonomy maps (sidepanel) / VIDEO_PROMPT_STEP* / CONTENT_PROMPT_* / screening spec / Hook ใน Gem |
| ส่วนที่หายไปจาก CONTENT_CORE (Missing) | Storymode prompts / variation pools / micro-templates / checker / product heuristics / Studio maps |
| Gem: โหมดที่มีชื่อแต่ไม่มี directive | step_story, dance, review, benefit_story, ab_test, cinematic, kids, ghost_cctv |
| Non-TikTok ที่ไม่ควรอยู่ใน TikTok pack | YouTube/Facebook upload, Flow/Grok agnostic engine, FILM_MODES general |

---

## Phase 1 — Extension Inventory (สรุปสำคัญ)

### หมวด copy_rule (ต้องอยู่ใน CONTENT_CORE)

| # | item | ไฟล์ | บรรทัดโดยประมาณ |
|---|------|------|----------------|
| 1 | `CONTENT_PROMPT_NORMAL / EXTEND / NO_TEXT / NO_TEXT_EXTEND` — Thai TikTok rules | `sidepanel.js` | 1162–1271 |
| 2 | `VIDEO_STYLE_MAP`, `CHARACTER_STYLE_MAP`, `SPEAKING_STYLE_MAP`, `VOICE_TONE_MAP`, `SCRIPT_STYLE_MAP`, `DIALOGUE_STYLE_MAP`, `PRODUCT_CATEGORY_MAP`, `HOOK_CATEGORY_MAP` | `sidepanel.js` | 576–942 |
| 3 | `TIME_VARIATIONS`, `MOOD_VARIATIONS`, `CAMERA_VARIATIONS` | `sidepanel.js` | 1016–1051 |
| 4 | `VIDEO_PROMPT_STEP1_*`, `VIDEO_PROMPT_STEP2_*`, negative prompt strings | `sidepanel.js` | 1055–1125 |
| 5 | `IMAGE_PROMPT_TEMPLATE`, `IMAGE_PROMPT_TEMPLATE_NO_TEXT` | `sidepanel.js` | 988–1012 |
| 6 | `CREATIVE_SCENE_*`, `PIXAR3D_*`, `CINEMATIC_*`, `STORYBOOK_*` templates | `sidepanel.js` | 1132–1158 |
| 7 | `getStorymodeSystemPromptForGenerate()` — Thai/English Storymode system prompt | `sidepanel.js` | 6316–6425 |
| 8 | `buildUserMessage()` — Thai structured user message | `sidepanel.js` | 9890–9950 |
| 9 | `detectProductCategory`, `detectProductGender` regex rules | `sidepanel.js` | 1393–1437 |
| 10 | `sanitizePromptForFlow` — real English policy sanitizer | `content-googleflow.js` | 1807–1831 |
| 11 | `getStorymodeSystemPromptForGenerate` Thai/English storyboard rules with scene format | `sidepanel.js` | 6316–6425 |
| 12 | Platform CTA prompt (TikTok ≤30 chars, youth tone) | `sidepanel.js` | 12599–12612 |

### หมวด TODO_empty / passthrough_fn (ว่างในเดิม — ตรวจว่าเติมใน core แล้วหรือยัง)

| # | item | ไฟล์ | สถานะใน CONTENT_CORE |
|---|------|------|----------------------|
| 1 | `GOOGLE_FLOW_FORBIDDEN_WORDS=[]`, `AUDIO_SAFE_REPLACEMENTS={}`, `sanitizeDialogueForGoogleFlow` passthrough | `sidepanel.js` ~1640 | **TODO_was_empty** → เติมใน `04-google-flow-policy.js` |
| 2 | `BODY_DESC_SAFE_REWRITES=[]`, `sanitizeCharacterDesc` passthrough | `sidepanel.js` ~1656 | **TODO_was_empty** → เติมใน `03-body-desc-safe-rewrites.js` |
| 3 | `buildHookMasterPrompt=''`, `HOOK_MASTER_SECTION=''`, `getEnhancedPrompt=''` | `sidepanel.js` ~13–24 | **Partial** → Hook rules อยู่ใน `02` แต่ไม่ใช่ export เดิม |
| 4 | `OVERCLAIM_RULES_BASE=''`, `buildProductImageLockBlock=''`, `AUTOPOST_SPEECH_HOOK_PROBLEM_CTA=''` | `sidepanel.js` ~483–505 | **Partial** → บางส่วนอยู่ใน `02` director prompt |
| 5 | `PROMPT_CHECKER_TEMPLATE=''`, `PROMPT_CHECKER_MODES` (empty prompts) | `sidepanel.js` ~1594–1622 | **Missing** |
| 6 | `RANDOM_CHARACTERS=[]`, `RANDOM_BACKGROUNDS=[]` | `sidepanel.js` ~4126 | **Missing** |
| 7 | Studio maps: `narrativeMap`, `visualMap`, `moodMap`, `systemPrompt=''` | `sidepanel.js` ~11372–11715 | **Missing** |
| 8 | `prompt-screening.js`: `VIOLATION_AND_UNSAFE_EN=[]`, `RISK_SNIPPETS=[]`, `HARD_BAN_REGEXES=[]`, `GEMINI_SCREENER_SYSTEM=''` | `prompt-screening.js` | **Partial** → `05-prompt-screening-spec.js` มีรายการแต่ไม่มี `GEMINI_SCREENER_SYSTEM` |
| 9 | `getProductInteraction`, `getVideoAction`, `getCategoryImageTemplate`, `getCategoryVideoAction` ทุกตัว `return ''` | `sidepanel.js` ~1440–1461 | **Missing** |
| 10 | `analyzeProductWithAI` prompt=`''`; `analyzeCharacterForStorymode`/`analyzeProductForStorymode` prompts=`''` | `sidepanel.js` ~5299, 9967–10014 | **Missing** |

---

## Phase 2 — Parity vs CONTENT_CORE

| # | finding | CONTENT_CORE_file | status | หมายเหตุ |
|---|---------|-------------------|--------|---------|
| 1 | `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` | `02` | **Match** | ย้ายครบ |
| 2 | `STYLE_OPTIONS` (63), `MOOD_KEYWORDS`, `PLATFORM_MODES`, `HOOK_LIBRARY` (200), `HOOK_CATEGORIES`, `VISUAL_STYLES` (50) | `02` | **Match** | |
| 3 | `SCENE_TEMPLATES`, `DIALECTS`, `TONES`, `SCENE_LOCATIONS`, `PACINGS`, `SHOOTING_STYLES`, `NEGATIVE_PROMPT`, `NO_TEXT_ENFORCEMENT`, `TIKTOK_CAPTION_REPAIR_PROMPT` | `02` | **Match** | |
| 4 | `PROMPT_MODES` (7 modes, directives ครบทุกอันยกเว้น default) | `02` | **Match** | `default` ไม่มี directive ทั้งใน extension และ core (ตั้งใจ) |
| 5 | `FILM_MODES` (4 modes, 3 มี prompt) | `02` | **Match** | `none` ว่างตั้งแต่ต้น |
| 6 | `forbidden-words-list.js` | `01` | **Match** | เหมือนทุกคำ |
| 7 | Google Flow stubs → 04/03 | `03`, `04` | **TODO_was_empty** (เติมแล้ว) | |
| 8 | `sanitizePromptForFlow` ใน `content-googleflow.js` | `04` | **Match** | Pipeline shape เดียวกัน |
| 9 | `CONTENT_PROMPT_NORMAL/EXTEND/NO_TEXT/NO_TEXT_EXTEND` | — | **Missing** | ไม่มีเป็น named export ใน core |
| 10 | `VIDEO_STYLE_MAP`, `CHARACTER_STYLE_MAP`, taxonomy maps ทั้งชุด | `02` (partial overlap) | **Partial** | ชื่อต่างกัน (VISUAL_STYLES vs VIDEO_STYLE_MAP) |
| 11 | `TIME_VARIATIONS`, `MOOD_VARIATIONS`, `CAMERA_VARIATIONS` | — | **Missing** | |
| 12 | `CREATIVE_SCENE_*`, `PIXAR3D_*`, `CINEMATIC_*`, `STORYBOOK_*` | — | **Missing** | |
| 13 | `getStorymodeSystemPromptForGenerate` | — | **Missing** | |
| 14 | `buildUserMessage` | — | **Missing** | |
| 15 | `PROMPT_CHECKER_TEMPLATE` / modes | — | **Missing** | |
| 16 | `detectProductCategory`, `detectProductGender` | — | **Missing** | |
| 17 | `GEMINI_SCREENER_SYSTEM` | `05` | **Missing** | `05` มีรายการ แต่ไม่มี system prompt สำหรับ Gemini screener |
| 18 | Studio maps + `systemPrompt` | — | **Missing** | |
| 19 | `FLOW_STEP_LABELS`, `V2_FLOW_STEP_LABELS`, `MODE_DATA` | `06` | **Missing** | `06` ไม่ครอบ step labels |
| 20 | `RANDOM_CHARACTERS`, `RANDOM_BACKGROUNDS` | — | **Missing** | |
| 21 | `prompt-screening.js` list/sanitizers | `05` | **Partial** | รายการมีใน `05` แต่ passthrough functions ยังอยู่ใน extension ไม่ถูก wire |

---

## Phase 3 — Parity vs GEM_PACK_TIKTOK

### PROMPT_MODES Gem Coverage

| mode_id | directive ใน 02 | ใน gem-kn-creative-options | coverage | gap |
|---------|----------------|--------------------------|----------|-----|
| `default` | ไม่มี directive | ชื่อ + เหมาะกับ | Full | ไม่มี gap (ทั้งสองตั้งใจว่าง) |
| `step_story` | STEP STORY ACTION BLUEPRINT ยาว ~550 chars | ชื่อ + 1 บรรทัด | **Name_only** | ขาด directive ทั้งหมด |
| `dance` | Dance engine ~520 chars | ชื่อ + 1 บรรทัด | **Name_only** | |
| `review` | Review rules ~280 chars | ชื่อ + 1 บรรทัด | **Name_only** | detail อยู่ใน tiktok-commerce-core แต่ไม่ใช่ mode directive |
| `benefit_story` | Pain→Solution→CTA ~200 chars | ชื่อ + 1 บรรทัด | **Name_only** | |
| `ab_test` | 2-version rules ~220 chars | ชื่อ + 1 บรรทัด | **Name_only** | |
| `compliance` | Forbidden+disclaimer | ชื่อ + partial (gem-kn-forbidden + INSTRUCTIONS) | **Partial** | intent มี แต่ไม่ใช่ directive string ตรงๆ |

### FILM_MODES Gem Coverage

| mode_id | prompt ใน 02 | ใน GEM_PACK | coverage | gap |
|---------|-------------|-----------|----------|-----|
| `none` | ว่าง | ไม่มีแถว | Full (ว่างตั้งใจ) | |
| `cinematic` | CINEMATIC FILM ENGINE ~280 chars | ไม่มีใน gem-kn ใด | **Missing** | |
| `kids` | KIDS DRAMA ENGINE ~280 chars | ชื่อใน creative-options แค่ hint | **Name_only** | |
| `ghost_cctv` | GHOST CCTV MODE ~380 chars (no humans, static cam, shadow-only) | Analog CCTV Dread อยู่ใน VISUAL_STYLES | **Name_only** | visual style ≠ film mode rules |

### Sections ของ ADAPTIVE_VIDEO_DIRECTOR_PROMPT ใน Gem

| section | ใน gem-kn ไหน | coverage |
|---------|--------------|----------|
| SYSTEM OVERRIDE rules 1–16 | บางส่วนใน tiktok-commerce-core + forbidden-phrases | **Partial** |
| VIRAL INTELLIGENCE | tiktok-commerce-core §3 | **Full** |
| PRODUCT IMAGE MODE + LABEL LOCK | tiktok-commerce-core §4 | **Partial** |
| NO GHOST MODE | ไม่มี | **Missing** |
| HOOK MASTER AI | tiktok-commerce-core §2 + cta-caption §6 | **Partial** (hook table ไม่ครบ) |
| DIALOGUE NATURALNESS & TTS-SAFE 6 ข้อ | commerce-core §5 บางส่วน | **Partial** |
| Output Format template | ไม่มี | **Missing** |
| MULTI-TURN CONTINUATION RULES | ไม่มี | **Missing** |

---

## Phase 4 — Non-TikTok Inventory

| # | item | แหล่ง | แนะนำเก็บที่ |
|---|------|-------|-------------|
| 1 | YouTube auto-upload logic + UI | `content-youtube.js` | extension เท่านั้น (mechanic) |
| 2 | Facebook/Reels auto-upload logic + UI | `content-facebook.js` | extension เท่านั้น (mechanic) |
| 3 | "โพสต์อัตโนมัติทุกแพลตฟอร์ม" feature copy | `06-ui-copy.js` | อยู่ที่เดิมได้ |
| 4 | `Adaptive Video Director` + Flow/Grok/Super Grok timing | `02-master-prompt-template.js` | **core-only** หรือ **GEM_PACK_GENERAL** |
| 5 | `PROMPT_MODES` / `FILM_MODES` (general story engine) | `02-master-prompt-template.js` | **GEM_PACK_GENERAL** + `gem-kn-creative-options` v2 |
| 6 | `HOOK_LIBRARY` 200 hooks (TikTok-leaning แต่ไม่ผูกตะกร้า) | `02-master-prompt-template.js` | core + optional GEM_PACK_GENERAL |
| 7 | `Viral Caption Protocol` "(TikTok/Reels)" | `02-master-prompt-template.js` | GEM_PACK_GENERAL หรือ short-form caption KB |
| 8 | `FILM_MODES.cinematic`, `FILM_MODES.kids` | `02-master-prompt-template.js` | **ไม่ใช่ TikTok Shop** — GEM_PACK_GENERAL |
| 9 | `PROMPT_MODES.dance`, `step_story` | `02-master-prompt-template.js` | **ทั่วไป** — GEM_PACK_GENERAL |

---

## Phase 5 — Backlog (ลำดับงาน)

### P1 — สูงสุด (ส่งผลต่อ Gem ทำงานได้จริง)

| # | action | target | risk |
|---|--------|--------|------|
| B1 | เพิ่ม `gem-kn-narrative-engine.md` — รวม directive ของ PROMPT_MODES ทั้ง 6 และ FILM_MODES ทั้ง 3 (เต็มทุกตัว) | `GEM_PACK_TIKTOK/` หรือ `GEM_PACK_GENERAL/` | ต้อง re-QA เคส 8-A (visual style + mode) |
| B2 | เพิ่ม `gem-kn-output-format.md` — Output Format template, Multi-turn rules, storyboard structure | `GEM_PACK_TIKTOK/` | Gem ต้องการสิ่งนี้เพื่อให้ "ต่อ" ทำงานได้ |
| B3 | เพิ่มหรือเติม section ใน `gem-kn-creative-options.md` — System Override 1–16 ฉบับสั้นแต่ครบ, NO GHOST MODE, anatomy lock, product truth lock | `GEM_PACK_TIKTOK/gem-kn-creative-options.md` | อัปเดต `INSTRUCTIONS.md` ด้วย |

### P2 — กลาง (ช่องว่างใน CONTENT_CORE)

| # | action | target | risk |
|---|--------|--------|------|
| B4 | สร้าง `07-storymode-prompts.js` — `CONTENT_PROMPT_NORMAL/EXTEND/NO_TEXT/NO_TEXT_EXTEND`, `IMAGE_PROMPT_TEMPLATE`, `VIDEO_PROMPT_STEP1/2`, `CREATIVE_SCENE_*`, `PIXAR3D_*`, `CINEMATIC_*`, `STORYBOOK_*` | `CONTENT_CORE/07-storymode-prompts.js` | ไม่กระทบ Gem โดยตรง แต่ถ้าสร้าง 1click web-app ใหม่ต้องใช้ |
| B5 | สร้าง `08-storymode-runtime.js` — `getStorymodeSystemPromptForGenerate`, `buildUserMessage`, variation pools (TIME/MOOD/CAMERA) | `CONTENT_CORE/08-storymode-runtime.js` | |
| B6 | เติม `GEMINI_SCREENER_SYSTEM` ใน `05-prompt-screening-spec.js` | `CONTENT_CORE/05-prompt-screening-spec.js` | |
| B7 | เติม `detectProductCategory` / `detectProductGender` regex rules | `CONTENT_CORE/09-product-heuristics.js` (ไฟล์ใหม่) | |

### P3 — ต่ำ / ตัดสินใจทีหลัง

| # | action | target | risk |
|---|--------|--------|------|
| B8 | ตัดสินใจ: `RANDOM_CHARACTERS` / `RANDOM_BACKGROUNDS` — เติมใน core หรือเป็น user config | `CONTENT_CORE` หรือ `CONTENT_INBOX` | ขึ้นกับ use case จริง |
| B9 | ตัดสินใจ: Studio maps (`narrativeMap`, `moodMap`, `visualMap`, `systemPrompt`) — ยังใช้กับ web-app ใหม่หรือไม่ | `CONTENT_CORE/10-studio-maps.js` (ถ้าต้องการ) | |
| B10 | สร้าง `GEM_PACK_GENERAL/` — Flow/Grok/cinematic/kids/dance/step_story modes ที่ไม่ใช่ TikTok Shop | `GEM_PACK_GENERAL/` (โฟลเดอร์ใหม่) | |
| B11 | อัปเดต `06-ui-copy.js` — เพิ่ม `FLOW_STEP_LABELS`, `MODE_DATA` | `CONTENT_CORE/06-ui-copy.js` | |

---

## Regression / QA ที่ต้องรันหลังแก้ไข

| เมื่อแก้ไข | รันเคสใน `gem-qa-checklist.md` | เคสใหม่ที่ต้องเพิ่ม |
|------------|-------------------------------|---------------------|
| เพิ่ม `gem-kn-narrative-engine.md` | เคส 8-A, 8-B, 8-C | เคสใหม่: เลือก `step_story` แล้วต้องได้ลำดับขั้นตอนที่เป็น action จริง |
| เพิ่ม `gem-kn-output-format.md` | เคส 7 (extend) | เคสใหม่: พิมพ์ "ต่อ" แล้วต้องได้ซีนถัดไป continuity ถูกต้อง |
| แก้ `gem-kn-creative-options.md` (System Override) | เคส 3, 5 | เคสใหม่: เลือก ghost_cctv / cinematic แล้วต้องมี HUMAN RESTRICTION / engine rules ใน output |
| เพิ่ม `07-storymode-prompts.js` ใน core | — (ไม่กระทบ Gem โดยตรง) | ทดสอบ web-app ถ้ามี |

---

## สรุปสำหรับการตัดสินใจ

**ต้องทำก่อน (ไม่งั้น Gem ใช้งาน mode เรื่องราวไม่ได้):**
- B1: `gem-kn-narrative-engine.md` — directive ครบ 6 PROMPT_MODES + 3 FILM_MODES  
- B2: `gem-kn-output-format.md` — Output Format + Multi-turn  
- B3: เติม System Override ที่ขาดใน `gem-kn-creative-options.md`

**ตัดสินใจว่าจะทำ GEM_PACK_GENERAL หรือไม่ (B10):**  
ถ้าต้องการใช้ Gem กับงานที่ไม่ใช่ TikTok Shop ควรแยกแพ็กชัด ไม่ merge เข้า TikTok Gem

**ที่เหลือ (B4–B9) เป็นงาน CONTENT_CORE ที่สำคัญสำหรับ web-app รอบหน้า** ไม่ใช่ด่วนสำหรับ Gem
