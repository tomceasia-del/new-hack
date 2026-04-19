# PIPELINE — แผนที่หลักฐัน (Evidence map)

เอกสารนี้บันทึก **ความสัมพันธ์ที่อ่านได้จากโค้ด** เท่านั้น: จาก → ถึง → หลักฐัน (ไฟล์ + บรรทัดโดยประมาณ)  
**ไม่ได้รันแอป** และ **ไม่ได้สร้าง workflow ใหม่** — แค่ชี้ว่าโค้ดเชื่อมกันอย่างไร

ดูภาพรวมแบบสังเคราะห์เพิ่มได้ที่ `PIPELINE-WORKFLOW-DISCOVERY.md`

---

## 1) Extension — กราฟ import (โมดูล → `sidepanel.js`)

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `./promptTemplate.js` | `sidepanel.js` (symbols ที่ import) | `1click-full-v3.40 (2)/js/sidepanel.js` บรรทัด 1 — `STYLE_OPTIONS`, `ADAPTIVE_VIDEO_DIRECTOR_PROMPT`, `MOOD_KEYWORDS`, `HOOK_LIBRARY`, `HOOK_CATEGORIES`, `VISUAL_STYLES` |
| `./storymodePromptEnrich.js` | `sidepanel.js` | บรรทัด 2 — `getMoodDirective`, `formatNarrativePromptsForMessage` |
| `./prompt-screening.js` | `sidepanel.js` | บรรทัด 3–9 — `screenChatMessages` และฟังก์ชันที่เกี่ยวข้อง |

---

## 2) Extension — UI state → ตัวแปร `smVisualStyle` (ตัวอย่างหนึ่งจุดยึด)

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `VISUAL_STYLES[]` (จาก `promptTemplate.js`) | ตัวแปร `smVisualStyle` เก็บ **`style.name`** | `initSMVisualDropdown` บรรทัด 7039–7047 — `item.dataset.value = style.id` แต่เมื่อคลิกใช้ `smVisualStyle = style.name` |
| ค่าเริ่มต้น module | `smVisualStyle` | บรรทัด 6268 — `let smVisualStyle = 'Cartoon Nova 3D';` |

---

## 3) Extension — ปุ่มสร้างสคริปต์ → `generateScript`

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `#generate-btn` / `#generate-btn-top` `click` | `generateScript` | บรรทัด 7129–7139 — `addEventListener('click', generateScript)` |

---

## 4) Extension — Storymode: ประกอบข้อความ → ส่ง API (ปุ่มสร้างสคริปต์)

ลำดับตาม **ลำดับคำสั่งใน `generateScript`** (ไม่ใช่ลำดับความสำคัญทางธุรกิจ)

| ลำดับในโค้ด | จาก | ถึง | หลักฐัน |
|-------------|-----|-----|---------|
| 1 | DOM + state (`sm*` ฯลฯ) | สตริง `userMessage` | `buildUserMessage` 9914–9987 — อ่าน `#topic-input`, `smStoryType`, `smSceneCount`, `smVisualStyle`, `smMoodKeyword`, `smNarrativeStyles`, … เรียก `getMoodDirective`, `formatNarrativePromptsForMessage`, อ่าน `VISUAL_STYLES.find(v => v.name === smVisualStyle)` |
| 2 | `userMessage` + ผล vision (ถ้ามี) | `userMessage` ต่อท้าย | 10115–10136 — `analyzeProductForStorymode` / `analyzeCharacterForStorymode` แล้ว `userMessage += …` |
| 3 | `userMessage` | `userMessage` หลัง guard | 10141 — `applyGoogleFlowUserInputGuard(userMessage)` |
| 4 | state + `VISUAL_STYLES` + enrich | สตริง system | 10143 — `getStorymodeSystemPromptForGenerate()` (นิยาม 6317–6453; ภายในใช้ `getMoodDirective` / `formatNarrativePromptsForMessage` ที่ 6394–6395) |
| 5 | ผลวิเคราะห์ตัวละคร photoreal | ต่อท้าย system | 10144–10146 — เงื่อนไข `smCharacterAnalysisResult.visual_style === 'photorealistic'` |
| 6 | `system` + `user` | `conversationHistory` | 10148–10151 |
| 7 | `conversationHistory` | ผล LLM (+ screening) | 10153 — `callAPIWithMeta` → 10288–10297 เรียก `screenChatMessages` แล้ว `callOpenAI` / `callGoogleAI` |
| 8 | ผลที่อาจถูกตัด | รอบต่อ | 10159–10168 — ลูป `MAX_CONTINUE` ส่ง user `'ต่อ'` |

ฟังก์ชันส่งจริง:

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `callAPI` | `screenChatMessages` → `callOpenAI` / `callGoogleAI` | 10267–10285 |
| `callAPIWithMeta` | เช่นเดียวกัน + คืน `truncated` | 10288–10297 |

---

## 5) Extension — Queue: เส้นทางคล้ายกันแต่ใช้ `generateScriptForQueue`

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| (caller) | `generateScriptForQueue` | 7435 — `await generateScriptForQueue();` |
| `buildUserMessage` | `userMessage` | 7582–7587 |
| รูปสินค้า/ตัวละคร | ต่อท้าย `userMessage` | 7601–7632 |
| `getStorymodeSystemPromptForGenerate` (+ override photoreal) | `systemPrompt` | 7639–7645 |
| `conversationHistory` | `callAPI` | 7647–7652 |
| ข้อความมีคำชวน “ต่อ” | `continueGenerationForQueue` | 7656–7659 → นิยาม 7665–7679 |

---

## 6) Web app — โหลดสคริปต์ → กดสร้างบท

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `app.html` ลำดับ `<script>` | `window.ONECLICK_PROMPT` แล้ว `window.generateScript` | `1click-web-app/app.html` 106–110 — `promptTemplate.js` → `api.js` → `app.js` |
| `window.ONECLICK_PROMPT.ADAPTIVE_VIDEO_DIRECTOR_PROMPT` | `directorPrompt()` | `1click-web-app/js/promptTemplate.js` ~863 (`window.ONECLICK_PROMPT`) และ `api.js` 2–7 |
| `#user-prompt` + ปุ่ม `#generate-btn` | `window.generateScript(provider, apiKey, userMessage)` | `app.js` 152–177 |
| OpenAI | `system` = director, `user` = textarea | `api.js` 52–63 |
| Google | ข้อความเดียว: director + separator + user | `api.js` 77–90 |

**หลักฐันขอบเขต:** เส้นนี้ **ไม่** เรียก `buildUserMessage` หรือ `getStorymodeSystemPromptForGenerate` ของ extension — ไม่มี import `sidepanel.js` ในเว็บ

---

## 7) Mock (`story-config-mock.html`) — UI → JSON เท่านั้น

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| ชิป / ฟอร์ม | อ็อบเจ็กต์ `payload` | `updatePreview` 557–586 |
| `payload` | `#json-out` | 587 — `JSON.stringify(payload, null, 2)` |

**หลักฐันขอบเขต:** ไฟล์นี้ **ไม่** เรียก `fetch` ไป LLM ใน snippet ที่ตรวจ; เป็น preview ของ config เท่านั้น

---

## 8) `CONTENT_CORE` — แพ็กเกจหลัก กับ extension

| ข้อเท็จจริงที่ตรวจด้วย `grep` | หลักฐัน |
|------------------------------|---------|
| โฟลเดอร์ `1click-full-v3.40 (2)` **ไม่มี** string `CONTENT_CORE` | ไม่พบการ import จาก extension bundle ไปยัง `CONTENT_CORE/` |
| `CONTENT_CORE/index.js` export `getStorymodeSystemPromptForGenerate` จาก `07-storymode-prompts.js` | บรรทัด 97–102 |
| Runtime Storymode ใน extension ใช้ **`getStorymodeSystemPromptForGenerate` ใน `sidepanel.js`** โดยตรง | 6317 — ชื่อฟังก์ชันเดียวกัน คนละไฟล์กับ `07-storymode-prompts.js` |

**ข้อควรระวังเมื่ออ่าน:** สอง implementation อาจไม่ sync — ต้อง diff แยกถ้าต้องการความเท่ากันของข้อความ

---

## 9) Extension — โหลด entry (`DOMContentLoaded`)

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `DOMContentLoaded` | `initStudioTab()` รวมถึง Storymode / แท็บอื่น | `sidepanel.js` 1896–1918 — ลำดับ `initTabs` … `initStudioTab` … |

---

## 10) Extension — Studio: ปุ่ม Master Prompt → API

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `#studio-generate-master-btn` `click` | `generateStudioMasterPrompt()` | `initStudioTab` 11084–11087 |
| ฟอร์ม Studio (`#studio-main-prompt`, `#studio-storytelling`, …) + ตัวแปร `studioSelectedNarratives`, `studioSceneCount`, … | สตริง `userMessage` (ประกอบเองใน Studio — **ไม่** เรียก `buildUserMessage()`) | `generateStudioMasterPrompt` 11395–11591 — คอมเมนต์ 11550 บอกว่า “เหมือน Storymode” แต่โค้ดประกอบในฟังก์ชันนี้ |
| `formatMap` / `narrativeMap` / `moodMap` / `visualMap` | ค่า `''` ทุก key ที่เห็นใน snippet | 11408–11516 |
| `combinedPrompt` | นิยามเป็น template ว่างแล้ว `.trim()` → สตริงว่าง | 11524–11525 |
| `messages` | `system: getEnhancedPrompt()`, `user: userMessage` | 11593–11597 |
| `getEnhancedPrompt()` | `return ''` (stub) | `sidepanel.js` 19–25 |
| `messages` | LLM | 11599 — `callAPI(studioProvider, apiKey, messages)` |
| ข้อความตอบ | `studioMasterPrompt` + parse | 11600–11612 — `parseScenesToCards(studioMasterPrompt)` |

**หมายเหตุการค้น:** `CONTENT_CORE/11-studio-maps.js` export `narrativeMap`, `moodMap`, `visualMap` — **extension Studio ไม่ import** ไฟล์นั้น; maps อยู่ใน `sidepanel.js` เป็นอ็อบเจ็กต์ใน-place ตามตารางด้านบน

### 10b) Studio — หลัง `callAPI` ภายใน `generateStudioMasterPrompt` (ยังฟังก์ชันเดิม)

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `studioMasterPrompt` (ข้อความจาก LLM) | `parseScenesToCards(studioMasterPrompt)` | 11612 |
| ผล `{ scenes, … }` | `studioScenes` (map เป็นรายการที่มี `imagePrompt` / `videoPrompt` ฯลฯ) | 11614–11625 |
| `studioScenes.length === 0` | `await generateScenesFromMasterPrompt()` | 11627–11629 และอีกครั้ง 11632–11634 |
| `studioScenes` | UI | 11637 — `renderStudioScenes()`; 11640–11642 เปิดใช้ `#studio-gen-img-btn` / `#studio-gen-vid-btn` |

### 10c) `parseScenesToCards` — บทบาทใน pipe

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `rawOutput` (สตริง) | `{ scenes, viralCaption, hashtags }` | ฟังก์ชัน `parseScenesToCards` 9104–9307 — หลายกลยุทธ์ regex / split ตาม `=== SCENE`, 🎬 SCENE, บล็อก ``` หลัง 🔴/🟢 |

### 10d) `generateScenesFromMasterPrompt` — เมื่อ parse ไม่ได้ฉากหรือต้องการเติม

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `studioMasterPrompt`, `studioSceneCount`, DOM Studio, `studioSelectedVisual` | `defaultScenes` (สร้างในลูปด้วย `buildCompleteDefaultPrompt`) | 11656–11747 |
| Provider `google` | `fetchGeminiWithFallback` + `buildStudioGeminiParts(systemPrompt + '\n\nMaster Prompt:\n' + studioMasterPrompt)` | 11756–11762 — `systemPrompt` เป็น template ว่าง (11752) |
| Provider `openai` | `callAPI` ด้วย `user: 'Master Prompt:\n' + studioMasterPrompt` | 11767–11770 |
| ผล JSON ใน text (regex `\[[\s\S]*\]`) | `studioScenes` หรือ fallback `defaultScenes` | 11764–11807 |
| สุดท้าย | `renderStudioScenes()` | 11810 |

### 10e) Studio — สร้างรูป (ไม่ใช่ `callAPI` chat โดยตรง)

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `#studio-gen-img-btn` `click` | `generateStudioImages()` | `initStudioTab` 11094–11097 |
| `generateStudioImages` | ลูป `generateSingleScene(idx)` ต่อฉากที่เลือก/ทั้งหมด | 12254–12269 |
| `generateSingleScene` (type `image`) | `generateImageWithGemini(prompt, …)` | 12152–12185 |
| `generateImageWithGemini` | `enhancePromptWithGemini` แล้วเรียก Gemini / Imagen (หลาย `fetchGeminiWithFallback` ใน body) | เริ่มนิยาม 10428–10447 |

### 10f) Studio — สร้างวิดีโอ (Veo — ไม่ผ่าน `callAPI`)

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `#studio-gen-vid-btn` `click` | `generateStudioVideos()` | `initStudioTab` 11099–11102 |
| รูปที่เลือกใน `studioItems` + `studioScenes` | `videoPrompt` ต่อฉาก | 12281–12318 |
| `videoPrompt` + รูป | `generateVideoWithVeo3(videoPrompt, img.url, …)` | 12329 |
| `generateVideoWithVeo3` | `fetch` ไป `veo-3.1-generate-preview:predictLongRunning` + poll | 10711–10751; `screenPromptForOutbound` ก่อนส่ง 10687 |

---

## 11) Extension — `buildUserMessage` ถูกเรียกจากที่ไหน (ครบจาก `grep`)

| Caller | หลักฐัน |
|--------|---------|
| `generateScriptForQueue` | 7584 |
| `generateScript` | 10091 |
| คอมเมนต์ใน Studio (อธิบายเจตนา) | 11550 — **ไม่ใช่** การเรียกฟังก์ชัน |

---

## 12) Extension — `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` ใน `sidepanel.js`

| ข้อเท็จจริง | หลักฐัน |
|-------------|---------|
| ถูก import จาก `./promptTemplate.js` | บรรทัด 1 |
| **ไม่ปรากฏชื่อซ้ำ** ในไฟล์ที่เหลือ (ค้นด้วย `grep` `ADAPTIVE` / `DIRECTOR_PROMPT`) | มี match เฉพาะบรรทัด 1 — น่าหมายถึง import ที่ยังไม่ถูกใช้งานใน body ของ `sidepanel.js` (หรือถูก treeshake ภายนอกไม่ได้เพราะเป็นไฟล์เดียว) |

Storymode ใช้ **`getStorymodeSystemPromptForGenerate()`** เป็น system ไม่ใช่ `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` — ดูส่วน 4 ด้านบน

---

## 13) Extension — `js/api.js` ในโฟลเดอร์ extension กับ `sidepanel.html`

| ข้อเท็จจริง | หลักฐัน |
|-------------|---------|
| `sidepanel.html` โหลด `js/sidepanel.js` (module) เท่านั้น — **ไม่** โหลด `js/api.js` | `sidepanel.html` ~1678–1680 |
| `js/api.js` ใน extension import `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` และใช้ใน OpenAI/Gemini | `1click-full-v3.40 (2)/js/api.js` 1, 69, 89 |

**ข้อควรระวัง:** ไฟล์ `api.js` ชุดนี้อยู่ใน repo ของ extension แต่ **อาจไม่ถูกดึงเข้า UI หลัก** ตาม `sidepanel.html` — ใช้งานจริงของเว็บอยู่ที่ `1click-web-app/js/api.js` (โครงคล้ายกัน)

---

## 14) Extension — จุดเรียก `callAPI(` ใน `sidepanel.js` (สรุปจาก grep)

| บรรทัด (โดยประมาณ) | บริบท / ฟังก์ชันที่ห่อ | หมายเหตุสั้น |
|--------------------|-------------------------|---------------|
| 4248 | `generateAllPromptsForItemInternal` — วิเคราะห์รูปตัวละคร (multimodal user message) | Product queue / per-item pipeline |
| 4337 | `generateAllPromptsForItemInternal` — สร้างเนื้อหา JSON (`buildContentGenerationPrompt` + `HOOK_MASTER_SECTION` stub) | `singleHookSystemMsg` |
| 4425 | `generateAllPromptsForItemInternal` — สร้าง `imagePrompt` (multimodal ถ้ามี `characterImage`) | หลัง content branch |
| 4785 | `generateAllCaptionsAndCTAs` — วิเคราะห์เพศ/บรรยายจากรูป (คนละลูปกับ 4248 แต่ logic คล้ายกัน) | ลูป `for (const item of productQueue)` เริ่ม 4663 |
| 4820 | `generateAllCaptionsAndCTAs` — unified content `callAPI` (batch) | `hookSystemMsg` + `batchContentPrompt` |
| 5107 | `handleGenerateAction` — caption / CTA | `prompt` เป็น `''` + `TODO: USER_PROMPT` (5095–5100) |
| 5192 | `handleQueueAction` — autopost queue (`ai` / `media` / `check`) | `ai`/`media` ใช้ `prompt = ''` + TODO; `check` ใช้ `checkScriptPolicy` |
| 7652 | `generateScriptForQueue` | Storymode queue |
| 7671 | `continueGenerationForQueue` | ต่อเมื่อมีคำชวน “ต่อ” |
| 11599 | `generateStudioMasterPrompt` | Studio master |
| 11767 | `generateScenesFromMasterPrompt` | OpenAI branch เท่านั้น (Google ใช้ `fetchGeminiWithFallback`) |

ฟังก์ชัน **`callAPIWithMeta`** ใช้เฉพาะ **`generateScript`** (Storymode ปุ่มหลัก) — ดูส่วน 4

---

## 15) `enhancePromptWithGemini` — ขั้น “ข้อความก่อนสร้างรูป”

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `rawPrompt` | `screenPromptForOutbound` | 10394 |
| ข้อความที่รีไรต์ | `fetchGeminiWithFallback` (max tokens 500) | 10400–10407 — `contents[0].parts[0].text` บังคับ rewrite เป็นภาษาอังกฤษ |
| `systemInstruction` | สตริงว่าง + `TODO: USER_PROMPT` | 10397–10406 |

**หมายเหตุ:** คอมเมนต์ด้านบนฟังก์ชันพูดถึง “Imagen 4” เป็นขั้นถัดไป แต่ **`generateImageWithGemini` ที่ตรวจแล้วใช้ `gemini-3.1-flash-image-preview:generateContent`** เท่านั้น (ไม่พบ URL Imagen ใน snippet นี้)

---

## 16) `generateImageWithGemini` — สาขา + endpoint ที่พิสูจน์ได้

| ลำดับในโค้ด | เงื่อนไข | การเรียก API | หลักฐัน |
|-------------|-----------|---------------|---------|
| 1 | เสมอ | `enhancePromptWithGemini(prompt, apiKey)` แล้วแทนที่ `prompt` | 10441–10446 |
| 2a | มี ref สินค้า (Studio หรือ Storymode) และ/หรือ ref ตัวละคร Storymode | ลูป `sampleCount` → `fetch` … `models/gemini-3.1-flash-image-preview:generateContent` + `responseModalities: ['TEXT','IMAGE']` + `parts` มี `inlineData` จาก ref | 10453–10576 |
| 2b | ไม่เข้าเงื่อนไข ref | ลูปเดียวกัน → **URL เดียวกัน** `gemini-3.1-flash-image-preview:generateContent` แบบ text-only part | 10613–10637 |
| 3 | สำเร็จ | คืน array ของ `data:image/...;base64,...` จาก `part.inlineData` | 10587–10591, 10647–10652 |
| 4 | ไม่ได้รูป | `throw` ข้อความอ้างอิง “Gemini 3.1 Flash Image” | 10610–10611, 10671 |

---

## 17) Platform tab — AI Caption / AI CTA (**ไม่** ใช้ `callAPI`)

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `#platform-ai-caption` `click` | `fetchGeminiWithFallback(googleKey, { contents: … }, 400, 0.8)` | `initPlatformTab` 12563–12586 |
| `#platform-ai-cta` `click` | `fetchGeminiWithFallback(..., 50, 0.9)` | 12623–12653 |
| `processQueue` / `postToPlatform` | เปิดแท็บอัปโหลด TikTok/Facebook/YouTube + `chrome.storage` — **ไม่** grep เจอ `callAPI` ในบล็อกนี้ | `processQueue` 12983+; `postToPlatform` 13054+ |

---

## 18) Dashboard tab + Templates tab

| แท็บ | การเรียก LLM (`callAPI` / `fetchGemini`) | หลักฐัน |
|------|------------------------------------------|---------|
| **Dashboard** | ไม่พบใน `initDashboardTab` — โหลด/บันทึกสถิติ + ปุ่มรีเซ็ต | `initDashboardTab` 13253–13273 |
| **Templates** | ไม่พบใน `initTemplatesTab` / `useTemplate` / `loadTemplates` — CRUD ใน `chrome.storage.local` + ใส่ค่า `#topic-input` | 13290–13433 |

---

## 19) Auto V2 (`sidepanel.js`) — คิว, ขั้น, และจุดเชื่อม **นอก** `callAPI`

### 19a) ค่าคงที่และลำดับขั้น

| หลักฐัน | รายละเอียด |
|---------|------------|
| `V2_FLOW_STEPS` + `V2_FLOW_CONFIG` | บรรทัด 552–566 — ลำดับ: `v2_create_image` → `v2_create_video` → `v2_extend_video` → `v2_upload_tiktok` → `v2_post_tiktok` |
| `FLOW_URLS.GOOGLE_FLOW` | 541–544 — `https://labs.google/fx/tools/flow` |
| `initAutoV2()` | เรียกจาก `DOMContentLoaded` บรรทัด 1912 (คู่กับ `initStudioTab` ฯลฯ) |

### 19b) สร้างข้อความ prompt (ไม่มี LLM ใน `generateV2Prompts`)

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| UI `#v2-*` | อ็อบเจ็กต์ `s` | `getV2TemplateSettings` 13456–13465 |
| `item` + `s` | `item.v2ImagePrompt` / `v2VideoPrompt` / `v2ExtendPrompt` | `generateV2Prompts` 13484–13497 — เรียก `buildV2ImagePrompt`, `buildV2VideoPrompt`, `buildV2ExtendPrompt` (13469–13481) |
| ไม่ครบฟิลด์ | `throw` | 13486–13488 |

### 19c) รัน flow รายสินค้า — `v2ProcessFlowItem` → `v2ExecuteFlowStep`

| ขั้น (`V2_FLOW_STEPS`) | พฤติกรรมใน `sidepanel.js` | หลักฐัน |
|------------------------|---------------------------|---------|
| `CREATE_IMAGE` | `v2OpenGoogleFlow(item, 'v2_image', item.v2ImagePrompt)` | `v2ExecuteFlowStep` 13774–13777 |
| `CREATE_VIDEO` | รอ poll `chrome.storage.local` คีย์ `flowStatus` จนอยู่ใน `{'v2_video_saved','completed_download'}` (timeout 15 นาที) แล้วเลื่อน index ไป EXTEND | 13779–13814 |
| `EXTEND_VIDEO` | poll `flowStatus` จน `{'v2_extend_done','completed_download'}` แล้วเรียก `v2OpenTikTokUpload(item)` | 13817–13849 |
| `UPLOAD_TIKTOK` | `v2OpenTikTokUpload(item)` | 13852–13854 |
| `POST_TIKTOK` | `v2PostToTikTok(item)` | 13856–13858 |
| *(ก่อน `switch`)* | ถ้าไม่มี `v2ImagePrompt` / `v2VideoPrompt` / `v2ExtendPrompt` → `generateV2Prompts(item)` | 13733–13736 |

### 19d) เปิด Google Flow — handoff ไปแท็บเบราว์เซอร์

| จาก | ถึง | หลักฐัน |
|-----|-----|---------|
| `v2OpenGoogleFlow` | `chrome.storage.local.set({ currentFlowData, flowStatus: 'waiting_for_flow', flowType: 'autov2' })` | 13887–13891 |
| ต่อมา | `chrome.tabs.query/update/create` ไป `FLOW_URLS.GOOGLE_FLOW` (หรือ reload แท็บ flow ที่มีอยู่) | 13893–13911 |
| `item` | `item.flowStatus = 'waiting_${mode}'` | 13914–13915 |

**ไม่พบ** `callAPI` / `fetchGeminiWithFallback` ภายใน `v2OpenGoogleFlow` — การสร้างรูป/วิดีโออยู่ฝั่ง **หน้า labs.google + content script**

### 19e) TikTok — รอสัญญาณจาก storage

| ฟังก์ชัน | พฤติกรรม | หลักฐัน |
|---------|----------|---------|
| `v2OpenTikTokUpload` | loop poll `currentItemPosted` + `flowStatus` (timeout 20 นาที); เมื่อสำเร็จ reset storage และ `item.status = 'posted'` | 13919–13972 |
| `v2PostToTikTok` | log + clear flags — **ไม่** เปิด URL เองใน snippet นี้ | 13992–14001 |

### 19f) Content script (หลักฐันขอบเขต)

| ไฟล์ | หลักฐัน |
|------|---------|
| `js/content-googleflow.js` | บรรทัด ~873–875 — ถ้า `flowType === 'autov2'` และ `flowStatus === 'waiting_for_flow'` จะ `startSystem('autov2')` (ฝั่ง DOM Flow) |

รายละเอียดขั้นย่อยภายใน content script **ยังไม่** แตะเป็นตารางในเอกสารนี้

### 19g) ฟังก์ชันอื่นที่ใช้ `generateImageWithGemini` / `generateVideoWithVeo3` (คนละเส้นกับ Auto V2)

| ฟังก์ชัน | บทบาท | หลักฐัน |
|----------|--------|---------|
| `handleGenerateImage` / `handleGenerateVideo` | ปุ่มสร้างรูป/วิดีโอต่อฉาก (scene card) → `generateImageWithGemini` / `generateVideoWithVeo3` | 10820–10874 |

---

## 20) สิ่งที่เอกสารนี้ **ยังไม่** พิสูจน์ละเอียด

- **`content-googleflow.js`** — ลำดับคลิก/สถานะย่อยทั้งหมดหลัง `startSystem('autov2')`
- **background service worker** (ถ้ามี) — ยังไม่ grep
- พฤติกรรม runtime จริง (เครือข่าย, key, error)

---

*สร้างจากการอ่าน/grep ใน workspace — อัปเดตเมื่อโครงสร้างโค้ดเปลี่ยน*
