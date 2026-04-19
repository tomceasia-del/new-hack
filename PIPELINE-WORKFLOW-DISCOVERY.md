# PIPELINE & WORKFLOW DISCOVERY — new hack repo

**แผนที่หลักฐันแบบ “จาก → ถึง → หลักฐัน” (ไม่สังเคราะห์เป็นขั้นเชิงนิยาย):** ดู `PIPELINE-EVIDENCE-MAP.md`

## สรุปผู้บริหาร (Executive summary)

Pipeline หลักใน repo นี้ประกอบด้วย **การประกอบข้อความส่ง LLM** (บทบาท `system` + `user`) สำหรับโหมดต่าง ๆ โดยเฉพาะ **Storymode** ใน Chrome extension ที่รวมหัวข้อสินค้า/เรื่อง, จำนวนฉาก, สไตล์ภาพ, mood, narrative (STYLE_OPTIONS id), hook category, manual script, disclaimer ฯลฯ เข้าเป็น **user message** และใช้ **system prompt** แบบ Creative Director (รวม VISUAL / MOOD / NARRATIVE EN blocks, image/video templates, critical rules) จาก `getStorymodeSystemPromptForGenerate()` — บางขั้นตอนเสริม **วิเคราะห์รูปสินค้า/ตัวละคร** แล้วแนบบล็อกข้อความต่อท้าย user message ก่อนเรียก API

**“Story config”** ในความหมายของ UI/เอกสารรอบ repo หมายถึงชุดตัวเลือกที่ผู้ใช้ตั้ง (เช่น ฉาก, mood, visual, narrative ids, hook) ซึ่งใน extension เก็บในตัวแปร/UI state แล้วถูกอ่านใน `buildUserMessage()` / `getStorymodeSystemPromptForGenerate()` — ไฟล์ `story-config-mock.html` สาธิต **payload JSON** จากชิปเดียวกับ master บางส่วน แต่ visual ชุดหนึ่งยังเป็น **legacy 20 รายการ** ไม่เท่ากับ `VISUAL_STYLES` เต็มใน `promptTemplate.js` (50+1)

เอกสารฉบับนี้ **บันทึก flow ที่ออกแบบ/มีอยู่ในโค้ดจริง** เท่านั้น ไม่ได้สร้าง workflow ใหม่นอกจากที่ repo มี

---

## Touchmap — ลำดับขั้น (AS-IS / designed)

| ลำดับ | Stage name | Location (ไฟล์ + symbol/section) | UI เห็น? | Data in → Data out | Notes / gaps |
|------:|-------------|-----------------------------------|----------|---------------------|--------------|
| 1 | โหลด prompt catalog (director, styles, moods, hooks, visual library) | `1click-full-v3.40 (2)/js/promptTemplate.js` — `ADAPTIVE_VIDEO_DIRECTOR_PROMPT`, `STYLE_OPTIONS`, `MOOD_KEYWORDS`, `HOOK_LIBRARY`, `VISUAL_STYLES`, … | Extension: ใช้งานภายใน · Web: โหลดก่อน `api.js` | **In:** bundle JS · **Out:** exports / `window.ONECLICK_PROMPT` (web) | Web ใช้ `window.ONECLICK_PROMPT.ADAPTIVE_VIDEO_DIRECTOR_PROMPT` เป็น system (ดูแถว 93–96 web) |
| 2 | Storymode — init dropdowns & state | `1click-full-v3.40 (2)/js/sidepanel.js` — `initSMStoryTypeDropdown` (ประมาณบรรทัด 6558), `initSMScriptMode` (6600), `initSMOutputType` (6675), `initSMAutoPost` (6687), `initSMDisclaimer` (6717), `initSMCustomPromptMode` (6742), `initSMImageButtons` (6782), `initSMPromptModes` (6842), `initSMPlatformModes` (6853), `initSMSceneCountDropdown` (6866), `initSMNarrativeDropdown` (6897), `initSMMoodDropdown` (6954), **`initSMVisualDropdown` (7030)**, `initSMHookDropdown` (7068), `initSMDropdownClose` (7120) | Y | **In:** DOM + `VISUAL_STYLES` / `STYLE_OPTIONS` / `MOOD_KEYWORDS` · **Out:** globals เช่น `smVisualStyle` (**เก็บเป็น `name` ไม่ใช่ id** ที่บรรทัด 7047) | Hook ใช้ร่วม Studio (`setupHookMenu` บรรทัด 7077–7113) |
| 3 | Storymode — mood & narrative enrichment | `1click-full-v3.40 (2)/js/storymodePromptEnrich.js` — `getMoodDirective` (121), `formatNarrativePromptsForMessage` (131) · import ใน `sidepanel.js` บรรทัด 2 | N (logic) | **In:** `smMoodKeyword`, `smNarrativeStyles[]` · **Out:** สตริง EN สำหรับแปะใน user/system | `MOOD_LLM_DIRECTIVE_BY_KEYWORD` ต้องตรง string กับ `MOOD_KEYWORDS` |
| 4 | Storymode — system prompt | `sidepanel.js` — `getStorymodeSystemPromptForGenerate` (6317–6453), `buildModularSystemPrompt` (6456–6461) | Partial (checkbox enhanced system) | **In:** `smVisualStyle`, `VISUAL_STYLES`, `smStoryType`, `smOutputType`, `smMoodKeyword`, `smSceneCount`, enrich helpers · **Out:** สตริง system ยาว | มี `VISUAL_NAME_ALIASES` (6341–6345), `visualStyleEngMap` (6318–6338) สำรองเมื่อไม่มี `visRow.prompt` |
| 5 | Storymode — user message | `sidepanel.js` — `buildUserMessage` (9914–9987) | N (ข้อความก่อนส่ง API) | **In:** topic, story type, scene count, visual **name**, mood, narrative ids, output type, disclaimer, hook, manual scenes · **Out:** user string | Custom full prompt path (9920–9928) ข้ามโครงสร้างมาตรฐานได้ |
| 6 | Storymode — optional vision prepend | `sidepanel.js` — `analyzeProductForStorymode` (10036+), `analyzeCharacterForStorymode` (9991+), เรียกจาก `generateScript` / queue (เช่น 7601–7632, 10115+) | Y (loading ใน output) | **In:** base64 รูป · **Out:** บล็อกข้อความต่อท้าย `userMessage` / override system | `analysisPrompt` ว่าง (`TODO: USER_PROMPT` ที่ ~10004–10005, ~10050–10051) — gap ชัด |
| 7 | Storymode — API handoff | `sidepanel.js` — `generateScript` (~10082+), `generateScriptForQueue` (7571+), `conversationHistory` system+user (~7647–7650) | Y (`output-content`) | **In:** messages[] · **Out:** assistant text (สคริปต์/ซีน) | ต่อฉากยาว: logic `continueGeneration` เมื่อตอบมีคำว่า “ต่อ” (~7656+) |
| 8 | Studio tab — master prompt & maps | `sidepanel.js` — `initStudioTab` (11056+), `initStudioStyleDropdowns` (11109+), **`generateStudioMasterPrompt` (11389+)** | Y | **In:** ฟอร์ม Studio · **Out:** master prompt / pipeline ถัดไป | **Gap:** `formatMap`, `narrativeMap`, `moodMap`, `visualMap` ใน extension ยังเป็น `''` และ `combinedPrompt` ว่าง (~11408–11525) — ของจริงออกแบบไว้ใน `CONTENT_CORE/11-studio-maps.js` |
| 9 | Web app — director-only generation | `1click-web-app/app.html` โหลด `promptTemplate.js` แล้ว `api.js` แล้ว `app.js` (106–110) · `api.js` `directorPrompt` (2–8), `callOpenAI` (52–74), `callGoogleAI` (77–90), `generateScript` (93–97) · `app.js` handler (152–187) | Y (textarea + `#output`) | **In:** ข้อความผู้ใช้ดิบ · **Out:** ข้อความจาก LLM | **ไม่มี** story config panels — system = director เท่านั้น; Gemini รวม director+user ในบรรทัดเดียว (83) |
| 10 | Mock story config | `story-config-mock.html` — inline `<script>` ~391+ | Y | **In:** ชิป UI · **Out:** JSON preview (`#json-out`) | STYLE_OPTIONS + MOOD = **master**; VISUAL = **20 legacy ids** (`disney` ฯลฯ) คนละชุดกับ master `disney_pixar_3d` (~436–439); ไม่มี panel ผล API |
| 11 | CONTENT_CORE — canonical data & Storymode extract | `CONTENT_CORE/02-master-prompt-template.js` — `STYLE_OPTIONS` (~277+), `VISUAL_STYLES` (~628+) · `CONTENT_CORE/07-storymode-prompts.js` — mirror ของ system prompt (หมายเหตุ: logic เก่ากว่า sidepanel บางส่วน) · `CONTENT_CORE/11-studio-maps.js` — `narrativeMap`, `moodMap`, `visualMap`, `formatMap` | N (library) | **In:** import โดยแพ็กเกจ · **Out:** exports | `CONTENT_CORE/index.js` re-export `getStorymodeSystemPromptForGenerate` จาก `07-storymode-prompts.js` — ต้อง sync กับ extension เมื่อแก้ |

---

## ช่องทางที่ครอบคลุม (channels)

### Extension — `1click-full-v3.40 (2)/js/sidepanel.js`

- **`buildUserMessage`** (~9914–9987): ประกอบ user จาก topic, `STORY_TYPE_TEMPLATES`, `smSceneCount`, **`smVisualStyle` (ชื่อไทย/การตลาด)**, `smMoodKeyword`, narrative ids → ชื่อจาก `STYLE_OPTIONS`; ถ้ามี `VISUAL_STYLES.find(v => v.name === smVisualStyle)?.prompt` จะแปะบล็อก EN; เรียก `getMoodDirective` / `formatNarrativePromptsForMessage`
- **`getStorymodeSystemPromptForGenerate`** (~6317–6453): สร้าง `visualDesc` จากแถว `VISUAL_STYLES` + alias + `visualStyleEngMap`; ฝัง mood/narrative EN; templates ตาม product ad / ASMR / fairytale / animated / photoreal
- **`initSM*`** — รวม init Storymode ที่ ~6539–6554 และฟังก์ชันรายตัวตามตารางด้านบน; **`initSMVisualDropdown`** (~7030–7065) ตั้ง `smVisualStyle = style.name` ขณะที่ `dataset.value` เป็น **`style.id`** (เช่น `disney_pixar_3d`)

### Extension — `promptTemplate.js` + `storymodePromptEnrich.js`

- **`1click-full-v3.40 (2)/js/promptTemplate.js`**: แคตตาล็อกหลัก — ตัวอย่าง `VISUAL_STYLES` บรรทัด 628–679 (`disney_pixar_3d` + ชื่อแสดง `Cartoon Nova 3D` ที่ 631)
- **`1click-full-v3.40 (2)/js/storymodePromptEnrich.js`**: `NARRATIVE_PROMPT_BY_STYLE_ID`, `MOOD_LLM_DIRECTIVE_BY_KEYWORD`, ฟังก์ชัน format/get

### Web — `1click-web-app/`

- **`app.html`**: สคริปต์ `js/promptTemplate.js` → `js/api.js` → `js/app.js` (106–110)
- **`js/promptTemplate.js`**: mirror ของ master; **`window.ONECLICK_PROMPT`** (~863–882)
- **`js/api.js`**: OpenAI ใช้ `system: directorPrompt()` + `user: userMessage` (61–63); Google ใช้ข้อความเดียว `directorPrompt() + '\n\n---\n\nUser Input: ' + userMessage` (83)
- **`js/app.js`**: อ่าน textarea, เรียก `window.generateScript` (152–177)

### Mock — `story-config-mock.html`

- **Embedded JSON**: `STYLE_OPTIONS` / `MOOD_KEYWORDS` อ้างอิง **master** (`CONTENT_CORE/02-master-prompt-template.js`) — คอมเมนต์ ~392–395
- **`VISUAL_STYLES`**: ชุด **20 รายการ legacy** คู่กับ dropdown เดิมใน sidepanel ก่อนขยายเต็ม (~436–439); default checkbox `disney` (~517)
- **HOOK_OPTIONS** (~441–448) คู่ `initSMHookDropdown`
- **ช่องว่าง**: H1/H2 toggle (~368–378) บอกว่า extension ยังไม่อ่านใน `buildUserMessage` (อ้างอิง mock-hack-1)

### CONTENT_CORE — Studio vs Storymode

- **`02-master-prompt-template.js`**: แหล่ง master ของ `STYLE_OPTIONS`, `VISUAL_STYLES` (50+1), `MOOD_KEYWORDS`, director body ฯลฯ
- **`11-studio-maps.js`**: `formatMap`, `narrativeMap` (~30+), `moodMap` (~83+), `visualMap` (~98+) — ออกแบบให้ประกอบ Studio / `generateScenesFromMasterPrompt` (คอมเมนต์หัวไฟล์) — **คนละสถานะกับ maps ว่างใน `sidepanel.js` Studio block (~11408–11516)**
- **`07-storymode-prompts.js`**: สำเนา `getStorymodeSystemPromptForGenerate` / minimal — ใช้ `visualStyleEngMap` key แบบสั้น (`disney`, `cinematic`) และ default id `'disney'` (~64–65) ต่างจาก runtime extension ที่ใช้ `disney_pixar_3d` — **ความคลาดเคลื่อนระหว่าง mirror กับของจริง**

---

## Naming / alias gotchas

| หัวข้อ | รายละเอียด |
|--------|------------|
| **ชื่อแสดง vs id (Visual)** | ใน `promptTemplate.js` แถว `disney_pixar_3d` ใช้ **`name: 'Cartoon Nova 3D'`** (~631) แต่ `smVisualStyle` ใน runtime ถือ **ชื่อ** จาก UI; `getStorymodeSystemPromptForGenerate` มี **`VISUAL_NAME_ALIASES`** แมปชื่อเก่า เช่น `'3D Pixar Animation'` → `'Cartoon Nova 3D'` (~6341–6345) |
| **Legacy id ใน mock vs master** | `story-config-mock.html` ใช้ id เช่น **`disney`**, `90sanime` (~437–438) ในขณะที่ master catalog ใช้ **`disney_pixar_3d`**, `90s_anime` (~631, 639) — grep หา id ผิดชุดจะพลาดการจับคู่ |
| **`visualStyleEngMap` vs `VISUAL_STYLES[].prompt`** | ใน extension `getStorymodeSystemPromptForGenerate` ใช้ **`visRow.prompt` ก่อน** แล้วค่อย fallback `visualStyleEngMap[visualId]` (~6352–6356); key ใน `visualStyleEngMap` เป็นชุดสั้น (~6318–6338) ไม่ครบทุก id ใน master 50+1 |
| **Director prompt list vs catalog** | `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` อาจอ้างอิง “Styles” เป็น **ชื่อ persona/marketing** ใน prose — ไม่ใช่รายการ id 1:1 กับ `STYLE_OPTIONS` ทั้ง 63 รายการ |
| **Studio `narrativeMap` keys** | เป็น slug (`veggie_gangster`, …) ไม่ใช่เลข id 1–63 ของ `STYLE_OPTIONS` — ดู `11-studio-maps.js` (~30+) |
| **CONTENT_CORE `07-storymode-prompts.js`** | ยังอิง logic/visual id แบบเก่า — อย่า assume ว่าเท่ากับ `sidepanel.js` ล่าสุด |

---

## Agent briefing (สำหรับ sub-agents — ภาษาไทย)

ก่อนค้น repo ควรทราบว่า: **ชื่อที่มนุษย์อ่าน (ภาษาไทย/การตลาด) กับ `id` ใน catalog มักไม่ตรงกัน** — โดยเฉพาะสไตล์ภาพ (Cartoon Nova 3D ↔ `disney_pixar_3d`) และ mock HTML ยังใช้ **ชุด visual id เก่า 20 รายการ** คนละแบบกับ `promptTemplate.js` เต็ม

**จุดยึดเวลา grep / อ่านโค้ด:** `STYLE_OPTIONS`, `VISUAL_STYLES`, `buildUserMessage`, `getStorymodeSystemPromptForGenerate`, `getMoodDirective`, `formatNarrativePromptsForMessage`, `initSMVisualDropdown`, `window.ONECLICK_PROMPT`, `generateStudioMasterPrompt`

**คำเตือน:** เอกสาร audit เก่าบางฉบับใน `CONTENT_INBOX/` อาจอธิบาย `promptTemplate.js` ว่าเป็น stub — ใน workspace ปัจจุบันไฟล์ runtime มี **เนื้อ director + catalog เต็ม** แล้ว (หัวไฟล์ ~1–80+) ควรยึดไฟล์จริงเป็นหลัก

---

## Missions reference (งาน discovery ที่คุยไว้ — pointer สั้น ๆ)

| Mission | ชี้ไปที่ |
|--------|---------|
| **Touchmap** | เอกสารนี้ + `sidepanel.js` / `api.js` / `story-config-mock.html` |
| **Alias / naming** | ส่วน Naming ด้านบน + `VISUAL_NAME_ALIASES`, `visualStyleEngMap`, mock `VISUAL_STYLES` |
| **Data inventory** | `MISSION-A-DISCOVERY-INVENTORY.md`, `CONTENT_EXTRACTION_QUEUE.md`, `CONTENT_INBOX/FULL_EXTENSION_SCAN_REPORT.md` |
| **Hidden rules / gaps** | `mock-hack-1.md` (H1/H2, TODO prompts), `story-config-mock.html` hints, Studio maps ว่างใน `sidepanel.js` ~11408–11516 |
| **Web wiring** | `1click-web-app/app.html` script order, `api.js` `directorPrompt` + `generateScript` |
| **Handoff Storymode ↔ CONTENT_CORE** | `CONTENT_CORE/index.js`, `07-storymode-prompts.js`, `11-studio-maps.js` vs extension runtime |

---

*อัปเดตจากการอ่านไฟล์ใน workspace ณ การจัดทำเอกสาร — เลขบรรทัดอ้างอิงช่วงที่ตรวจสอบแล้วตามข้อความในตาราง*
