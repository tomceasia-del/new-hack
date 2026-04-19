# Full Extension Content Scan Report
Generated: 2026-04-16
Method: Overlapping window scan (27 agents, Wave 1) + Merge (2 agents, Wave 2)
Files scanned: 17 JS files (all except promptTemplate.encoded.js)

---

## Table of Contents

1. [COPY_RULE Master Table](#section-1-copy_rule-master-table)
2. [TODO_EMPTY Master List](#section-2-todo_empty-master-list)
3. [Per-File Summary](#section-3-per-file-summary)
4. [Content Categories Found](#section-4-content-categories-found)
5. [Gaps & Recommendations](#section-5-gaps--recommendations)

---

## Section 1: COPY_RULE Master Table

> Grouped by source file. Each row represents a distinct content item (variable, block, or logical cluster).  
> **Type** codes: `const` = named JS constant; `tpl` = template literal; `str` = string literal; `obj` = object/map; `arr` = array; `comment` = developer comment with copy content; `import` = value lives in another file.

---

### FILE: `promptTemplate.original.js` (862 lines)

> This is the **canonical content source** file. Its runtime counterpart `promptTemplate.js` is nearly empty (see TODO_EMPTY section).

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 1–275 | `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` | `tpl` | Thai/English "Adaptive Video Director" master prompt (~275 lines). Covers: Flow/Grok/Super Grok timing; image style unlink; persona enforcement; system overrides (no image-gen tools, no trademarks, safe render keywords, full scene sequence, long-batch continuity, forbidden ad words, extreme dialogue permission, ASMR no-dialogue, dialogue length/anatomy/voice/Thai default/scene progression/global opening ban/output compression/Flow policy/product truth); viral intelligence; product-as-prop; NO GHOST rules; label text lock; review authenticity; text overlay continuity; trend injection + soft-only audio; advanced capabilities; Hook Master concept; dialogue naturalness + TTS-safe; steel rules; input/parsing; mandatory output format (storyboard, per-scene image/video code blocks, multi-turn "ต่อ", DIRECTOR'S TIPS). |
| 277–348 | `STYLE_OPTIONS` | `arr` | 63 style personas: ids 1–21 sales/viral base styles; 22–40 "Viral Personas"; 41–59 talking objects; 60–63 political/satire. Each `{ id, name, description }`. |
| 350–394 | `MOOD_KEYWORDS` | `arr` | 40 mood strings: 20 original English (Cinematic Standard → Mystery Noir) + 20 Thai/trend extensions (Mute & Earth Tone, Thai Street Night, UGC Raw, Liminal Space, etc.). |
| 396–400 | `PLATFORM_MODES` | `obj` | Keys `flow`, `grok`, `supergrok`: each `{ name, duration, words, sentences }`. Note: `words: '20-30'` for Flow vs master prompt's 15–20 rule — reconcile in product logic. |
| 407–615 | `HOOK_LIBRARY` | `arr` | **200 hooks** `{ id, cat, text }`: ids 1–50 FOMO; 51–100 AUTHENTIC; 101–150 OBSESSION; 151–200 CURIOSITY. Thai hook one-liners for Scene 1 dialogue. |
| 617–622 | `HOOK_CATEGORIES` | `obj` | Four keys `FOMO`, `AUTHENTIC`, `OBSESSION`, `CURIOSITY`: each `{ name, icon, desc }` (Thai descriptions). |
| 628–679 | `VISUAL_STYLES` | `arr` | 50 entries `{ id, name, icon, desc, category, prompt }` plus `none`: image-gen prefix prompts (real_cinematic, disney_pixar_3d, ghibli, craft, nostalgia, artistic, digital, Thai & Asian, trendy, advanced 3D, etc.). |
| 684–693 | `SCENE_TEMPLATES` | `obj` | Keys `1`–`8`: scene archetypes (Hook, problem, demo, social proof, result, reveal, shoppertainment, closing) with `name`, `tag`, `expression`, `action`, `extra_img`, `extra_vid`, `camera`. |
| 698–707 | `DIALECTS` | `arr` | `none`, `central`, `isan`, `northern`, `southern`, `bangkok_urban`, `formal_thai`, `thai_english_mix` — `{ id, name, icon, desc, prompt }` (English LLM prompt fragments). |
| 712–723 | `TONES` | `arr` | `none`, `funny`, `dramatic`, `haunted`, `romantic`, `thrilling`, `chill`, `professional`, `inspirational`, `urgent` — `{ id, name, icon, desc, prompt }`. |
| 728–744 | `SCENE_LOCATIONS` | `arr` | 17 locations incl. `inside_human_body`, indoor/outdoor, studio, warehouse, beach, market, haunted school/mansion, cemetery, abandoned temple — `{ id, name, icon, desc, prompt }`. |
| 749–755 | `PACINGS` | `arr` | `none`, `fast`, `normal`, `slow`, `dynamic_mix` — `{ id, name, icon, desc, prompt }`. |
| 760–768 | `SHOOTING_STYLES` | `arr` | `none`, `cinematic`, `casual`, `documentary`, `vlog`, `asmr`, `macro` — `{ id, name, icon, desc, prompt }`. |
| 773–810 | `PROMPT_MODES` | `arr` | 7 storyboard modes: `default`, `step_story`, `dance`, `review`, `benefit_story`, `ab_test`, `compliance`. Each has Thai `directive` string (see detailed content in agent B5 notes). |
| 815–835 | `FILM_MODES` | `arr` | `none`, `cinematic`, `kids`, `ghost_cctv` — `{ id, name, icon, desc, prompt }`. Full prompt text for cinematic/kids/ghost_cctv in agent B5 notes. |
| 840 | `NEGATIVE_PROMPT` | `str` | Single-line negative prompt: text distortions, duplicate overlays, subtitles, watermarks, extra limbs, etc. |
| 842 | `NO_TEXT_ENFORCEMENT` | `str` | Stricter no on-screen text / typography enforcement string. |
| 847–859 | `TIKTOK_CAPTION_REPAIR_PROMPT` | `tpl` | "TikTok Caption Finisher" mini-prompt: output TikTok caption in Thai + 3 hashtags; no storyboard. |

---

### FILE: `sidepanel.js` (14,225+ lines)

> Primary UI and AI orchestration file. 211 COPY_RULE entries found by M1. Key clusters below.

#### Import References (Line 1)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 1 | `STYLE_OPTIONS`, `ADAPTIVE_VIDEO_DIRECTOR_PROMPT`, `MOOD_KEYWORDS`, `HOOK_LIBRARY`, `HOOK_CATEGORIES` | `import` | All imported from `./promptTemplate.js`. In the runtime file this means all are empty/minimal stubs. |

#### Flow & Mode Configuration (Lines 508–607)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 508–514 | `FLOW_STEPS` | `obj` | Step ids: `create_image`, `frame_to_video`, `screen_builder`, `upload_tiktok`, `post_tiktok`. |
| 516–530 | `FLOW_CONFIG` | `obj` | Maps `8`/`16` (seconds) to ordered step arrays. |
| 532–538 | `FLOW_STEP_LABELS` | `obj` | Thai UI labels per step (สร้างรูปภาพ, สร้างวิดีโอ, ต่อคลิป, อัพโหลด/โพสต์ TikTok). |
| 540–543 | `FLOW_URLS` | `obj` | Google Flow + TikTok upload URLs. |
| 545–549 | `MODE_DATA` | `obj` | Modes `flow`/`grok`/`supergrok`: icon, name, duration text (Thai). |
| 552–574 | `V2_FLOW_STEPS`, `V2_FLOW_CONFIG`, `V2_FLOW_STEP_LABELS` | `const` | V2 flow ids + Thai labels (Template 1–3, TikTok steps). |

#### Style/Character Taxonomy Maps (Lines 576–941)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 576–607 | `VIDEO_STYLE_MAP` | `obj` | Keys → Thai descriptions (themes, UGC, viral, regional accents). |
| 610–661 | `BACKGROUND_STYLE_MAP` | `obj` | Keys → Thai background/scene labels. |
| 664–705 | `CHARACTER_STYLE_MAP` | `obj` | Keys → Thai character archetypes + Pixar 3D variants + no-face/hand options. |
| 708–723 | `PIXAR_3D_CHARACTERS` | `arr` | Objects with `id`, English `desc`, `gender`, `personality`, `bestFor` category tags. |
| 730–740 | `categoryKeywords` | `obj` | Thai + English keyword lists per category (food, beauty, tech, fashion, health, fitness, kids, home, pet). |
| 765–769 | `PIXAR_3D_CHARACTER_IDS` | `arr` | Pixar 3D selector id strings. |
| 775–805 | `SPEAKING_STYLE_MAP` | `obj` | Keys → Thai speaking style labels (incl. regional dialect options). |
| 808–838 | `VOICE_TONE_MAP` | `obj` | Keys → Thai voice/tone labels. |
| 841–863 | `SCRIPT_STYLE_MAP` | `obj` | Keys → Thai script-structure labels. |
| 866–882 | `THAI_ART_STYLE_MAP` | `obj` | Keys → Thai art/visual style labels. |
| 885–901 | `DIALOGUE_STYLE_MAP` | `obj` | Keys → Thai dialogue style labels + quoted example phrases. Note: `funny_viral` explicitly forbids เฮ้ย. |
| 904–917 | `PRODUCT_CATEGORY_MAP` | `obj` | Keys → Thai category labels with emoji + shooting hints. |
| 920–933 | `SCENE_CONFIG` | `obj` | `8`/`16`: min/max scenes, style id, Thai description. |
| 935–941 | `HOOK_CATEGORY_MAP` | `obj` | Hook category keys → Thai labels (FOMO, Authentic, etc.). |

#### Image & Video Prompt Templates (Lines 990–1160)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 990–1004 | `IMAGE_PROMPT_TEMPLATE` | `tpl` | English image prompt: art/character/background, H1/H2, blur, 4K, text overlay rules, CRITICAL about H1/H2 labels. |
| 1006–1012 | `IMAGE_PROMPT_TEMPLATE_NO_TEXT` | `tpl` | Same structure without headline overlay block. |
| 1016–1027 | `TIME_VARIATIONS` | `arr` | Thai lighting/time-of-day phrases. |
| 1029–1040 | `MOOD_VARIATIONS` | `arr` | Thai mood/atmosphere phrases. |
| 1042–1051 | `CAMERA_VARIATIONS` | `arr` | Thai camera/composition phrases. |
| 1055–1068 | `VIDEO_PROMPT_STEP1_VARIATIONS` | `arr` | English: enthusiastic intro, Thai-only speech, text/font preservation rules, audio rules. |
| 1076 | `VIDEO_FONT_FREEZE_RULE` | `tpl` | English: text/font preservation block for video. |
| 1078–1092 | `VIDEO_PROMPT_STEP1` | `obj` | `action`, `tool`, `prompt_text`, `dialogue_script` placeholder, `technical_settings` with English `negative_prompt`/`audio_negative_prompt`. |
| 1096–1104 | `VIDEO_PROMPT_STEP2_VARIATIONS` | `arr` | English: extend scene, Thai only, product demo, font freeze rules. |
| 1110–1125 | `VIDEO_PROMPT_STEP2` | `obj` | Same shape as step 1 for extend video. |
| 1132 | `CREATIVE_SCENE_IMAGE_TEMPLATE` | `tpl` | Thai + English: product ad image, REAL HUMAN PHOTO, Thai overlay, single image, reference image name. |
| 1134 | `CREATIVE_SCENE_VIDEO_TEMPLATE` | `tpl` | Thai sales dialogue + English: no subtitles/captions, film look. |
| 1138–1140 | `PIXAR3D_IMAGE_TEMPLATE`, `PIXAR3D_VIDEO_TEMPLATE` | `tpl` | English Pixar 3D image/video instructions, speech in Thai placeholder. |
| 1146–1150 | `CINEMATIC_IMAGE_TEMPLATE`, `CINEMATIC_VIDEO_TEMPLATE` | `tpl` | English photorealistic/cinematic prompts. |
| 1154–1158 | `STORYBOOK_IMAGE_TEMPLATE`, `STORYBOOK_VIDEO_TEMPLATE` | `tpl` | English storybook + voiceover (no lip sync); Thai narration placeholder. |

#### Content Generation Prompts (Lines 1163–1271)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 1163–1193 | `CONTENT_PROMPT_NORMAL` | `tpl` | Thai: TikTok Shop expert, H1/H2, caption, ~8s speech, CTA, rules (no duplicate headlines, gender particles, CTA charset/forbidden claims), JSON fields `h1,h2,caption,speech,cta,hookId`. |
| 1196–1229 | `CONTENT_PROMPT_EXTEND` | `tpl` | Same as NORMAL + `speech2`, continuity rule, JSON includes `speech2`. |
| 1232–1249 | `CONTENT_PROMPT_NO_TEXT` | `tpl` | Caption, speech, CTA; JSON `caption,speech,cta,hookId`. |
| 1252–1271 | `CONTENT_PROMPT_NO_TEXT_EXTEND` | `tpl` | No H1/H2; `speech`+`speech2`; JSON fields listed. |

#### Policy Checker (Lines 1594–1872)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 1601–1621 | `PROMPT_CHECKER_MODES` | `obj` | Modes `strict`, `balanced`, `conversion`, `thai`: Thai `name`/`description`; all `prompt` strings **empty** (`TODO: USER_PROMPT`). |
| 1692–1702 | `checkScriptPolicy` | `tpl` | Builds reviewer prompt: `${checkerMode.prompt}`, `Script to review:`, fenced script, `Return ONLY valid JSON...`. |
| 1756–1851 | `formatCheckerResult` | `tpl` | User-facing checker UI: "ผลการตรวจสอบ Policy & คุณภาพ", risk badges, quality/summary/new-script sections, Thai copy. |
| 1857–1862 | `getViolationTypeLabel` | `obj` | `policy`→`📋 นโยบาย`, `low_quality`→`📉 คุณภาพต่ำ`, `spam`→`🚫 สแปม`, `engagement_bait`→`🎣 Engagement Bait`. |
| 1868–1872 | `getSeverityLabel` | `obj` | `low`→`🟡 เล็กน้อย`, `medium`→`🟠 ปานกลาง`, `high`→`🔴 รุนแรง`. |

#### UI Selector Config (Lines 2159–2180)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 2159–2169 | `selectorConfig` | `arr` | UI labels (emoji + TH/EN): หมวดสินค้า, ฮุคเปิดคลิป, สไตล์ภาพ, พื้นหลัง, Video Style, ตัวละคร, สไตล์บทพูด, วิธีพูด, ลักษณะเสียง, โครงสร้าง Script. |
| 2438–2456 | `statusStepMap` | `obj` | Flow status → Thai progress strings (Google Flow/TikTok/V2). |

#### Story Mode Configuration (Lines 6265–7051)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 6265–6274 | SM state defaults | `state` | `smMoodKeyword='Cinematic Standard'`, `smVisualStyle='3D Pixar Animation'`, `smHookCategory='auto'`, `smStoryType='custom'`, `smScriptMode='ai'`, `smOutputType='both'`. |
| 6284–6291 | `getStorymodePipelineHintFooter` | `tpl` | User-message footer: output must use `=== SCENE N: NAME ===`, image/video prompt in code blocks, viral caption. |
| 6294–6314 | `getMinimalStorymodeSystemPrompt` | `tpl` | Short system prompt: Creative Director for TikTok/Veo; OUTPUT FORMAT rules (English image prompt, Thai dialogue, code blocks, no subtitle). |
| 6318–6338 | `visualStyleEngMap` | `obj` | id → English style directive (cinematic, disney, ghibli, claymation, etc.). |
| 6351–6366 | `imageTemplate`/`videoTemplate` branches | `tpl` | Branch templates: product ad (Thai overlay), ASMR (overhead), fairytale (voiceover), animated (lip sync Thai female), default cinematic. |
| 6372–6425 | `getStorymodeSystemPromptForGenerate` | `tpl` | Full Storymode system prompt: Creative Director, VISUAL STYLE, MOOD/TONE, OUTPUT FORMAT, VIRAL CAPTION, IMAGE/VIDEO TEMPLATE, CRITICAL RULES 1–13 (English/Thai, audio-only, consistency, scene count, young Thai female voice except ASMR). |
| 6448–6459 | `STORY_TYPE_TEMPLATES` | `arr` | 10 story types: custom, product_review, brand_story, tutorial, drama, fairytale, asmr, comedy, comparison, character_story — each with `name`, `icon`, `description` (Thai). **Note:** renderer reads `tmpl.desc` not `tmpl.description` — likely bug. |
| 6462–6489 | `VISUAL_STYLES` | `arr` | 20 entries: `id`, Thai `name`, `icon`. |
| 6956–6986 | `MOOD_THAI_LABELS` | `obj` | English mood key → Thai label (Cinematic Standard … Minimal/Clean). |
| 7044–7051 | `HOOK_OPTIONS` | `arr` | Hook library: auto, FOMO, AUTHENTIC, OBSESSION, CURIOSITY — `name`/`icon` (Thai + English). |

#### Caption/CTA Repair & Overclaim (Lines 9037–9080)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 9042–9047 | `overclaimWords` | `arr` | Caption overclaim terms stripped: Thai + English (การันตี, 100%, FDA, No.1, แพทย์รับรอง, etc.). |
| 9069–9071 | `healthKeywords` | `arr` | Health/beauty disclaimer trigger keywords: ผิว, สิว, เซรั่ม, ครีม, วิตามิน, สุขภาพ, กันแดด, etc. |
| 9074 | `disclaimer` | `str` | `ผลลัพธ์ขึ้นอยู่กับสภาพผิว/ร่างกายของแต่ละบุคคล`. |

#### Social Media Caption/CTA AI Prompts (Lines 12538–12612)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 12538–12545 | caption AI `prompt` | `tpl` | Thai: TikTok/Facebook/YouTube caption; hook; friendly tone; emoji; 3–5 hashtags; max 150 words; caption-only output. |
| 12601–12612 | CTA AI `prompt` | `tpl` | Thai CTA rules (≤30 chars); comment/FOMO; youth Thai; don't copy caption; example phrases; single CTA, no quotes. |

#### V2 Template Prompts (Lines 13432–13460)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 13432–13435 | `buildV2ImagePrompt` | `tpl` | Photoreal product-unboxing shot: packaging, price tag, box, surface, background, 8K commercial style. |
| 13438–13440 | `buildV2VideoPrompt` | `tpl` | Timed beats [00:00–00:06]: static shot, hand motion, price emphasis. |
| 13443–13444 | `buildV2ExtendPrompt` | `tpl` | Continuation: hand picks up product, shows thickness/weight, subtle background motion. |

#### Storymode Visual/Narrative Style Maps (Lines 11631–12108)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 11631–11654 | `visualStyleMap` (inner, partial) | `obj` | English visual descriptions (subset): cinematic, disney, ghibli, crochet, 90sanime, gta, etc. |
| 11663–11696 | `buildCompleteDefaultPrompt` defaults | `tpl` | Defaults: product showcase; hold phrase; "High quality, 8K... no text..."; video "7-8 seconds", "AUDIO: Thai language voice only". |
| 11965–12007 | `visualStyleMap` (full outer) | `obj` | Full English descriptions for all `studioSelectedVisual` ids. **Note: key sets differ from inner version at 11631 — alignment risk.** |
| 12013–12104 | `getVisualStylePromptTemplates` | `obj` | Per-style `imagePrompt`/`videoPrompt` for disney, cinematic, ghibli, claymation, cyberpunk, ugc_raw, thai_street, crochet, plushie, dragonball, 90sanime, watercolor, popart, pixel, lego. |
| 11121–11167 | `narrativeStyles` | `arr` | 40 narrative/character style options: `id`, Thai `name`, `icon` (e.g. `veggie_gangster`, `isan_joy`, `glutton`). |
| 11214–11224 | `moodOptions` | `arr` | Mood keywords with Thai names + icons. |
| 11258–11303 | `visualOptions` | `arr` | 40 visual/art styles: `id`, Thai `name`, `icon`. |

#### Reference-Image Matching Directives (Lines 10457–10523)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 10457–10477 | `refInstructions` (product + character) | `tpl` | `MANDATORY REFERENCE MATCHING`: product/character rules (skin tone, face, hair, outfit). |
| 10479–10480 | `refInstructions` (product-only) | `tpl` | `MANDATORY PRODUCT MATCHING` — exact brand/packaging. |
| 10482–10495 | `refInstructions` (character-only) | `tpl` | `MANDATORY CHARACTER MATCHING` — face/outfit rules. |
| 10500–10523 | full scene prompt | `tpl` | `PRIMARY TASK`, `REQUIREMENTS`, `SCENE REQUIREMENTS`, `FORMAT (9:16)`, `ABSOLUTE VIOLATIONS` list. |

#### Voice & Audio Directives (Lines 4289–4493)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 4289–4304 | `voiceGenderDirective` | `str` | Thai/English voice rules: `VOICE GENDER: Female/Male Thai voice…`, ห้ามใช้เสียง…, Match voice gender to character. |
| 4434–4436 | `wearableVideoVariations` | `arr` | English wearable video action + `AUDIO / SPEECH (CRITICAL)` Thai-only rules. |
| 4456–4457 | `video8WithDialogue` | `tpl` | `DIALOGUE / SPEECH CONTENT (CRITICAL — The character MUST say exactly this in Thai):`. |
| 4488–4490 | `voiceLock16` | `tpl` | `VOICE LOCK: MUST use the same … Thai voice…`. |
| 8724–8737 | `safeAudioBlock` | `tpl` | `AUDIO / SPEECH (CRITICAL)`: Thai only, voice, style, optional dialogue, soft ambient, banned loud/SFX list, SCENE-AWARE CONTINUITY. |

#### Category Detection (Lines 1397–1432)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 1397–1421 | `detectProductCategory` | `regex` | Thai + English keyword patterns for fashion, shoes, accessory, beauty, food, tech. |
| 1428–1432 | `detectProductGender` | `regex` | `femaleProducts`/`maleProducts` regex strings. |
| 4390–4394 | `WEARABLE_CATS`/`wearableRule` | `arr+tpl` | Categories: `fashion`, `shoes`, `bags`, `accessory_watch`, `accessory`; Thai rule that character must wear/use product. |

#### TPL Categories (Line 13243–13251)
| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 13243–13251 | `TPL_CATEGORIES` | `obj` | Template category labels: general, fashion, food, beauty, tech, home, custom (emoji + Thai). |

---

### FILE: `content-googleflow.js` (15,107 lines)

> Google Flow & TikTok pipeline automation. 178 COPY_RULE entry groups found by M2. Primarily status strings and UI matchers; one substantive rules block.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 15–33 | `AUTOPOST_STEPS` | `obj` | Autopost pipeline step labels: `step1_NewProject` … `step17_OpenTikTok` with human-readable strings. |
| 36–44 | `STORY_STEPS` | `obj` | Storymode/scene pipeline labels: `Scene Step 1: Select Image/Portrait/x1` … `Scene Step 7: Add Video to Scene`. |
| 1807–1831 | `sanitizePromptForFlow` | `obj+fn` | **Only substantive policy block in file.** `banned` regexes (violence/weapons, NSFW, loud/sfx words); `softReplace` map (e.g. `scream`→`exclaim softly`, `thunder`→`gentle rain`); strips composite layout terms (`split-screen`, `collage`, `diptych`, etc.). |
| 4274–4280 | `VIDEO_MODEL_TEXT_MAP` | `obj` | Taxonomy map: keys `veo_fast`, `veo_quality`, `veo_lite`, etc. → arrays of lowercase label fragments for menu matching. |
| 5084 | `extendKeywords` | `arr` | `['extend', 'ต่อ', 'ขยาย', 'continue', 'ต่อวิดีโอ', 'extend video', 'extend clip', 'add extension']` |
| 6259 | `extendKeywords` (step 13 variant) | `arr` | `['extend', 'ต่อวิดีโอ', 'ขยาย', 'extend video', 'extend clip']` — separate from above. |
| 11321–11322 | `errorKeywords` (image) | `arr` | `['something went wrong', 'violate our policies', 'try a different prompt']` |
| 11694–11695 | `errorKeywords` (video) | `arr` | Same as image version + `'audio generation failed'` |
| 12813–12817 | `MODEL_TEXT_MAP` | `obj` | Pipeline taxonomy: maps `flowImageModel` keys (`imagen_4`, `nano_banana_pro`, `nano_banana_2`) to menu search phrases. |
| 14527–14530 | (block comment) | `comment` | `AUTO V2 — 3-Step Veo 3.1 Pipeline`; Template 1/2/3 steps named here (image→video→extend). |
| 14404–15080 | `flowStatus` values | `str` | V2 state machine: `running`, `v2_image_generating`, `v2_image_done`, `v2_video_generating`, `v2_video_saved`, `v2_extending`, `v2_extend_done`, `completed_download`. |
| (many) | `showNotification` / `updateStatus` | `str` | Hundreds of Thai (+ some English) status/toast strings throughout the file. |

---

### FILE: `content.js` (2,652 lines)

> TikTok scraper + upload automation content script.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 756–1013 | `sendMessage('status')` | `str/tpl` | Thai status messages: เริ่มดึงข้อมูล, เสร็จสิ้น, กำลังดึงหน้า N, หยุดการดึงข้อมูล, etc. |
| 1345–1361 | `clickAddProductLinks` | `str` | English UI phrases: `add product link`, `add products`, `tag products`, etc. |
| 1947 | `months` | `arr` | `'January'`–`'December'` (calendar parsing). |
| 2351–2582 | `updateUploadStatus` | `str/tpl` | Thai upload UX: wait/upload/caption/product-pin/draft/schedule/post steps. |
| 2434–2436 | `targetTexts` | `arr` | Draft: `['Save draft', 'Save Draft', 'Drafts', 'Save as draft']`; else `['Post', 'Schedule']`. |
| 2504 | `flowMsg` | `str` | `'Video ถูกบันทึก Draft แล้ว!'`, `'Video ถูก Schedule แล้ว!'`, `'Video ถูก Post แล้ว!'`. |

---

### FILE: `background.js` (1,851 lines)

> Service worker automation — plumbing only. No AI prompts, forbidden words, or copy rules.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 38 | console log | `str` | `1CLICK AUTOMATIC SYSTEM installed/updated:` |
| 128 | `justification` | `str` | Offscreen permission text: `Read downloaded video file and convert to base64` |
| 372 | Slate detection | `str` | Placeholder text `What happens next` used to detect uncompleted paste (mechanic). |
| (others) | error strings | `str` | `editor not found`, `all methods failed`, `no tab`, `Element not found`, etc. — internal error messages. |

---

### FILE: `content-tiktok-platform.js` (1,655 lines)

> TikTok Studio upload queue automation.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 22–217 | `updateStatus` | `str/tpl` | Thai upload queue status strings (17 step labels, errors, success/fail). |
| 151, 166, 182 | TikTok button labels | `str` | `'Post'`, `'Schedule'` — UI matching. |
| 627–906 | product link flow | `str` | Thai status for 6-step product-link modal: [0/6]–[6/6]. |
| 1060–1151 | schedule steps | `str` | Thai steps [1/3]–[3/3] for schedule setup. |
| 1317 | `months` | `arr` | English month names January–December (calendar). |

---

### FILE: `tiktok-click-helper.js` (1,381 lines)

> MAIN-world React automation — almost entirely mechanics.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 516–557 | `clickRadio` | `str` | TikTok scheduling UI labels: `'Schedule'` / `'Now'`. |
| 1055 | `SCHEDULE_FIELDS` | `arr` | API JSON field names: `schedule_time`, `publish_time`, `scheduled_publish_time`, etc. |

---

### FILE: `content-youtube.js`

> YouTube Studio upload automation.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 18–108 | `updateStatus` | `str/tpl` | Thai status strings: อัพโหลด Video, ใส่ Title, ใส่ Description, ตั้งเวลา, เสร็จสิ้น, Error. |
| 78 | title fallback | `str` | Default title `'Video'` when no title/caption. |
| 255 | tab match | `str` | `'visibility'`, `'การเผยแพร่'`. |
| 281, 295 | schedule match | `str` | `'schedule'`, `'ตั้งเวล'`. |

---

### FILE: `content-facebook.js`

> Facebook video upload automation.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 18–97 | `updateStatus` | `str/tpl` | Thai status strings: อัพโหลด Video, ใส่ Caption, ตั้งเวลา, เสร็จสิ้น, Error. |
| 203 | schedule match | `str` | `'schedule'`, `'ตั้งเวลา'`, `'schedule reel'`, `'schedule post'`. |

---

### FILE: `license-service.js`

> Firebase license validation — no marketing rules.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 56–228 | error/success messages | `str/tpl` | Thai: กรุณาใส่ License Key, ไม่สามารถเชื่อมต่อ, License Key ไม่ถูกต้อง, หมดอายุ, ถูกระงับ, ยินดีต้อนรับกลับ!, ลงทะเบียนสำเร็จ, ยังไม่ได้ลงทะเบียน, etc. |
| 114 | max-devices message | `tpl` | `License Key นี้ใช้งานครบ ${this.maxDevices} โปรไฟล์แล้ว` |

---

### FILE: `forbidden-words-list.js`

> Pure content asset — one large exported constant.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 1–end | `FORBIDDEN_MARKETING_PHRASES` | `arr` | **~130 Thai + English forbidden marketing phrases** covering: weight loss claims, skin whitening, medical cures, guaranteed results, competitor/brand names, scam patterns (รวยเร็ว, โอนนอกระบบ), overclaim vocab (การันตี, No.1, FDA Approved), crowding/FOMO fakes. Includes: เฮ้ย, yourshop, your shop, brandname, shopname as per-platform banned terms. |

---

### FILE: `prompt-screening.js`

> Prompt screener — mostly empty stubs (see TODO_EMPTY).

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 10 | `FORBIDDEN_MARKETING_PHRASES` | `import` | Content lives in `forbidden-words-list.js`. |
| 121 | `SCREENER_MODELS` | `arr` | Model IDs: `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-pro`. |
| 163 | `keys` in `screenProductAnalysisObject` | `arr` | Fields screened: `appearance`, `features`, `targetAudience`, `usage`, `videoTips`, `summary_en`, `productType`, `brand`, `colorTone`. |

---

### FILE: `api.js`

> API layer — mechanics with one content-adjacent item.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 16–23 | `safetySettings` | `obj` | Gemini safety categories all set to `BLOCK_NONE`; auto-injected to avoid PROHIBITED_CONTENT. |
| 56 | rate-limit error | `str` | Thai: `All Gemini models rate limited — กรุณารอสักครู่แล้วลองใหม่` |
| 69 | system content | `ref` | System prompt = `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` (imported from `promptTemplate.js`, currently empty). |

---

### FILE: `promptTemplate.js` (runtime, 53 lines)

> **WARNING: Nearly all empty.** This is the file actually loaded by the extension at runtime.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 4 | `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` | `str` | **Empty** `''`. |
| 5–16 | `STYLE_OPTIONS` | `arr` | 10 entries with `{ id, name }` only (no `description`): storytelling, review, tutorial, drama, comedy, asmr, ugc, fairytale, comparison, unboxing. |
| 17–38 | `MOOD_KEYWORDS` | `arr` | 20 mood labels in English (Cinematic Standard … Minimal/Clean) — real data. |
| 39–50 | all other exports | `obj` | `PLATFORM_MODES`, `HOOK_LIBRARY`, `HOOK_CATEGORIES`, `VISUAL_STYLES`, `SCENE_TEMPLATES`, `DIALECTS`, `TONES`, `SCENE_LOCATIONS`, `PACINGS`, `SHOOTING_STYLES`, `PROMPT_MODES`, `FILM_MODES` — **all empty `{}`**. |
| 51–53 | `NEGATIVE_PROMPT`, `NO_TEXT_ENFORCEMENT`, `TIKTOK_CAPTION_REPAIR_PROMPT` | `str` | **All empty `''`**. |

---

### FILE: `intercept-blob.js`

> Video blob capture — mechanics only. No content rules.

| Line | Variable/Key | Type | Summary |
|------|-------------|------|---------|
| 21–30 | status values | `obj` | `converting`, `success`, `error`; `message` pattern `FileReader error from ` + source. |

---

### FILE: `offscreen.js` / `firebase-config.js`

> Utility/config files — no marketing rules or AI prompts.

---

## Section 2: TODO_EMPTY Master List

> Items that are explicitly stubbed empty with `TODO: USER_PROMPT` or are passthrough functions waiting for content.

### FILE: `sidepanel.js` — 33 items

| Line | Variable | Type | Note |
|------|----------|------|------|
| 13–16 | `buildHookMasterPrompt` | `fn` | `TODO: USER_PROMPT`; returns `''`. |
| 19 | `HOOK_MASTER_SECTION` | `const` | `TODO: USER_PROMPT`; `''`. |
| 22–24 | `getEnhancedPrompt` | `fn` | `TODO: USER_PROMPT`; returns `''`. |
| 484–485 | `OVERCLAIM_RULES_BASE` | `const` | `TODO: USER_PROMPT`; empty template literal. |
| 498–501 | `buildProductImageLockBlock` | `fn` | `TODO: USER_PROMPT`; returns `''`. |
| 505 | `AUTOPOST_SPEECH_HOOK_PROBLEM_CTA` | `const` | `TODO: USER_PROMPT`; `''`. |
| 1074 | `VIDEO_PROMPT_STEP1_AUDIO` | `const` | Empty `''`; comment says audio rules embedded above. |
| 1440–1460 | `getProductInteraction`, `getVideoAction`, `getCategoryImageTemplate`, `getCategoryVideoAction` | `fn` | Each `TODO: USER_PROMPT`; return `''`. |
| 1597 | `PROMPT_CHECKER_TEMPLATE` | `const` | Empty `''`. |
| 1601–1621 | `PROMPT_CHECKER_MODES.*.prompt` | `str` | All four mode `prompt` values are `''` (`strict`, `balanced`, `conversion`, `thai`). |
| 1641–1642 | `GOOGLE_FLOW_FORBIDDEN_WORDS` | `const` | `TODO: USER_PROMPT`; `[]`. |
| 1646 | `GOOGLE_FLOW_WORD_REPLACEMENTS` | `const` | `TODO: USER_PROMPT`; `{}`. |
| 1650–1651 | `sanitizeDialogueForGoogleFlow` | `fn` | `TODO: USER_PROMPT`; passthrough `return dialogue`. |
| 1656 | `BODY_DESC_SAFE_REWRITES` | `const` | `TODO: USER_PROMPT`; `[]`. |
| 1660–1661 | `sanitizeCharacterDesc` | `fn` | `TODO: USER_PROMPT`; passthrough `return desc`. |
| 1668 | `AUDIO_SAFE_REPLACEMENTS` | `const` | `TODO: USER_PROMPT`; `{}`. |
| 1671–1672 | `sanitizeVideoPrompt` | `fn` | `TODO: USER_PROMPT`; passthrough `return prompt \|\| ''`. |
| 1680–1681 | `applyGoogleFlowUserInputGuard` | `fn` | `TODO: USER_PROMPT`; passthrough `return text`. |
| 1687–1688 | `preFlightPolicyScreen` | `fn` | `TODO: USER_PROMPT`; passthrough `return prompt \|\| ''`. |
| 4127 | `RANDOM_CHARACTERS` | `arr` | `[{ desc: '', gender: 'female' }]` — `desc` is `''`; `TODO: USER_PROMPT`. |
| 4130 | `RANDOM_BACKGROUNDS` | `arr` | `['']` — single empty string; `TODO: USER_PROMPT`. |
| 4726 | `thaiArtStyleDesc` | `str` | `= ''` after Pixar branch; `TODO: USER_PROMPT`. |
| 4731 | `characterDesc` | `str` | `= ''` when characterImage; `TODO: USER_PROMPT`. |
| 5095 | `prompt` | `str` | `= ''`; generate-caption action; `TODO: USER_PROMPT`. |
| 5099 | `prompt` | `str` | `= ''`; generate-cta action; `TODO: USER_PROMPT`. |
| 5168 | `prompt` | `str` | `= ''`; `case 'ai'`; `TODO: USER_PROMPT`. |
| 5174 | `prompt` | `str` | `= ''`; `case 'media'`; `TODO: USER_PROMPT`. |
| 5301 | `analysisPrompt` | `str` | `= ''`; Gemini product image analysis; `TODO: USER_PROMPT`. |
| 9967–9968 | `analysisPrompt` | `str` | `TODO: USER_PROMPT`; character analysis sends no text prompt. |
| 10013–10014 | `analysisPrompt` | `str` | `TODO: USER_PROMPT`; product analysis sends no text prompt. |
| 10360–10361 | `systemInstruction` | `str` | `TODO: USER_PROMPT`; Gemini enhancement uses only inline rewrite text. |
| 11372–11479 | `formatMap`, `narrativeMap`, `moodMap`, `visualMap` | `obj` | All values `''`; Studio master-prompt maps are entirely empty. |
| 11715 | `systemPrompt` | `str` | `= ''` in `generateScenesFromMasterPrompt`; `TODO: USER_PROMPT`. |

---

### FILE: `prompt-screening.js` — 8 items

| Line | Variable | Type | Note |
|------|----------|------|------|
| 13 | `VIOLENCE_AND_UNSAFE_EN` | `arr` | Empty `[]`; `TODO: USER_PROMPT`. |
| (near 13) | `RISK_SNIPPETS` | `arr` | Empty `[]`; `TODO: USER_PROMPT`. |
| (near 13) | `HARD_BAN_REGEXES` | `arr` | Empty `[]`; `TODO: USER_PROMPT`. |
| (near 13) | `GEMINI_SCREENER_SYSTEM` | `str` | Empty `''`; `TODO: USER_PROMPT`. |
| — | `localScreenText` | `fn` | Passthrough `return text`. |
| — | `geminiComplianceSanitize` | `fn` | Returns `{ sanitized: text, changed: false }` — no real sanitize. |
| — | `screenPromptForOutbound` | `fn` | Passthrough `return text`. |
| — | `screenChatMessages` | `fn` | Passthrough `return messages`. |

---

### FILE: `promptTemplate.js` (runtime) — 13 items

| Line | Variable | Type | Note |
|------|----------|------|------|
| 4 | `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` | `str` | Empty `''` — the master prompt is not loaded in the runtime file. |
| 39–50 | `PLATFORM_MODES` | `obj` | Empty `{}`. |
| 39–50 | `HOOK_LIBRARY` | `obj` | Empty `{}` — all 200 hooks missing from runtime. |
| 39–50 | `HOOK_CATEGORIES` | `obj` | Empty `{}`. |
| 39–50 | `VISUAL_STYLES` | `obj` | Empty `{}`. |
| 39–50 | `SCENE_TEMPLATES` | `obj` | Empty `{}`. |
| 39–50 | `DIALECTS` | `obj` | Empty `{}`. |
| 39–50 | `TONES` | `obj` | Empty `{}`. |
| 39–50 | `SCENE_LOCATIONS` | `obj` | Empty `{}`. |
| 39–50 | `PACINGS` | `obj` | Empty `{}`. |
| 39–50 | `SHOOTING_STYLES` | `obj` | Empty `{}`. |
| 39–50 | `PROMPT_MODES` | `obj` | Empty `{}`. |
| 39–50 | `FILM_MODES` | `obj` | Empty `{}`. |
| 51–53 | `NEGATIVE_PROMPT`, `NO_TEXT_ENFORCEMENT`, `TIKTOK_CAPTION_REPAIR_PROMPT` | `str` | All empty `''`. |

---

### FILE: `content-googleflow.js` — 8 marginal items

| Line | Variable | Type | Note |
|------|----------|------|------|
| 9593 | `videoPrompt` | `expr` | `videoPrompt8 \|\| prompt \|\| ''` — empty string fallback when both fields missing. |
| 10646 | `videoPrompt16` | `expr` | `flowData?.videoPrompt16 \|\| ''` — empty string fallback. |
| 12428–12429 | `h1Headline`, `h2Subtitle` | `str` | Empty strings in TikTok auto-post payload — intentional blank-copy slots. |
| (misc) | empty arrays | `arr` | Several `[]` used as loop containers, not content stubs. |

---

## Section 3: Per-File Summary

| File | Total Lines | COPY_RULE Count | TODO_EMPTY Count | Key Findings |
|------|-------------|-----------------|------------------|--------------|
| `promptTemplate.original.js` | 862 | **29** (but covers 800+ lines of rich content) | 2 (intentional `none` slots) | **Master content source**: ADAPTIVE_VIDEO_DIRECTOR_PROMPT, 200-hook library, 63 styles, 50 visual styles, scene templates, dialects, tones, locations, pacing, prompt/film modes, negative prompt, caption repair prompt |
| `sidepanel.js` | 14,225+ | **211** | **33** | Primary UI + AI orchestration; all taxonomy maps, content prompts, image/video templates, storymode system prompts, caption/CTA AI prompts, V2 templates, overclaim strip list; 33 stubs awaiting `USER_PROMPT` fill |
| `content-googleflow.js` | 15,107 | **178** (mostly status strings) | 8 | Pipeline automation; only `sanitizePromptForFlow` has substantive policy content (banned regexes, soft replacements); no AI prompts or copy rules defined inline |
| `content.js` | 2,652 | 40 | 1 | TikTok scraper + upload automation; caption/CTA are pass-through from storage; month names for calendar; upload step status strings |
| `background.js` | 1,851 | 24 | 3 | Service worker plumbing only; error strings and install log; no copy rules |
| `content-tiktok-platform.js` | 1,655 | 78 | 4 | Upload queue automation; Thai step-by-step status strings; calendar month names; no content-generation rules |
| `tiktok-click-helper.js` | 1,381 | 8 | 0 | MAIN-world React automation; only Schedule/Now radio labels and API field names |
| `content-youtube.js` | ~310 | 25 | 0 | YouTube upload automation; Thai status strings; `'Video'` default title |
| `content-facebook.js` | ~230 | 11 | 0 | Facebook upload automation; Thai status strings |
| `license-service.js` | ~310 | 17 | 0 | License validation; Thai error/success messages only |
| `forbidden-words-list.js` | ~160 | **1** (130+ phrases) | 0 | Pure content asset: complete forbidden marketing phrases list (Thai + English) |
| `prompt-screening.js` | ~170 | 9 | **8** | Screener scaffolding; all actual rule arrays/system prompt are empty stubs |
| `promptTemplate.js` (runtime) | 53 | 4 | **13** | **CRITICAL GAP**: Runtime file loaded by extension has STYLE_OPTIONS (10 items, stripped) and MOOD_KEYWORDS (20 items) only; everything else empty |
| `api.js` | ~110 | 6 | 0 | API layer; Gemini safety settings; Thai rate-limit error |
| `intercept-blob.js` | ~140 | 14 | 0 | Blob capture mechanics; log/status strings only |
| `offscreen.js` | ~60 | 4 | 0 | File I/O; error strings only |
| `firebase-config.js` | ~55 | 3 | 0 | Config; no plaintext secrets; no copy rules |

**TOTALS (approximate):**
- Total COPY_RULE entries across all files: **~462** (211 + 178 + ~40 + ~24 + ~78 + ~8 + ~29 + ~25 + ~17 + ~11 + 1 + 9 + 4 + 6 + 14 + 4 + 3)
- Total TODO_EMPTY across all files: **~62**
- Total lines scanned: ~37,000+

---

## Section 4: Content Categories Found

### A. Prompt / System Instructions

**What exists:**
- `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` (~275 lines) — full master creative director prompt for TikTok video storyboards
- `getMinimalStorymodeSystemPrompt` — short storymode creative director system prompt
- `getStorymodeSystemPromptForGenerate` — full storymode system prompt with 13 critical rules
- `IMAGE_PROMPT_TEMPLATE` / `IMAGE_PROMPT_TEMPLATE_NO_TEXT` — image generation prompts
- `VIDEO_PROMPT_STEP1` / `VIDEO_PROMPT_STEP2` + variations — video generation prompts (8s/16s)
- `CONTENT_PROMPT_NORMAL` / `CONTENT_PROMPT_EXTEND` / `CONTENT_PROMPT_NO_TEXT` / `CONTENT_PROMPT_NO_TEXT_EXTEND` — content generation prompts for AI
- `CREATIVE_SCENE_IMAGE_TEMPLATE`, `CREATIVE_SCENE_VIDEO_TEMPLATE`, `PIXAR3D_IMAGE_TEMPLATE`, `PIXAR3D_VIDEO_TEMPLATE`, `CINEMATIC_IMAGE_TEMPLATE`, `CINEMATIC_VIDEO_TEMPLATE`, `STORYBOOK_IMAGE_TEMPLATE`, `STORYBOOK_VIDEO_TEMPLATE` — scene-type-specific templates
- `buildV2ImagePrompt`, `buildV2VideoPrompt`, `buildV2ExtendPrompt` — V2 product shot templates
- `refInstructions` (product/character/both) — reference image matching directives
- `safeAudioBlock` — audio/speech critical rules block
- `TIKTOK_CAPTION_REPAIR_PROMPT` — caption finisher mini-prompt
- `GEMINI_SCREENER_SYSTEM` — **EMPTY** (stub in prompt-screening.js)
- `PROMPT_CHECKER_MODES.*.prompt` — **ALL EMPTY** (4 modes: strict/balanced/conversion/thai)

**Files containing it:** `promptTemplate.original.js`, `sidepanel.js`, `prompt-screening.js`

---

### B. Content Rules & Directives

**What exists:**
- `CONTENT_PROMPT_NORMAL` / `CONTENT_PROMPT_EXTEND` — H1/H2 rules, gender particle rules, CTA charset, JSON field spec
- `PROMPT_MODES` (7 modes with Thai `directive` text): step_story, dance, review, benefit_story, ab_test, compliance
- `FILM_MODES` (cinematic, kids, ghost_cctv) with detailed English/Thai prompt rules
- `sanitizePromptForFlow` in `content-googleflow.js` — banned regexes, soft replacements, layout term stripping
- `sanitizePromptForFlow` equivalent stubs in `sidepanel.js` (lines 1641–1688) — **ALL EMPTY**
- `OVERCLAIM_RULES_BASE` — **EMPTY** stub
- `buildProductImageLockBlock` — **EMPTY** stub
- `preFlightPolicyScreen` — **EMPTY** passthrough
- `AUTOPOST_SPEECH_HOOK_PROBLEM_CTA` — **EMPTY** stub

**Files containing it:** `promptTemplate.original.js`, `sidepanel.js`, `content-googleflow.js`

---

### C. Forbidden Words / Safe Replacements

**What exists:**
- `FORBIDDEN_MARKETING_PHRASES` (~130 phrases) — full list of forbidden Thai + English marketing claims
- `GOOGLE_FLOW_FORBIDDEN_WORDS` — **EMPTY** `[]` stub
- `GOOGLE_FLOW_WORD_REPLACEMENTS` — **EMPTY** `{}` stub
- `BODY_DESC_SAFE_REWRITES` — **EMPTY** `[]` stub
- `AUDIO_SAFE_REPLACEMENTS` — **EMPTY** `{}` stub
- `VIOLENCE_AND_UNSAFE_EN` — **EMPTY** `[]` stub
- `RISK_SNIPPETS` — **EMPTY** `[]` stub
- `HARD_BAN_REGEXES` — **EMPTY** `[]` stub
- `sanitizeDialogueForGoogleFlow` — **EMPTY** passthrough
- `sanitizeCharacterDesc` — **EMPTY** passthrough
- `sanitizeVideoPrompt` — **EMPTY** passthrough
- `softReplace` map in `sanitizePromptForFlow` — real content: e.g. `scream`→`exclaim softly`, `thunder`→`gentle rain`
- `overclaimWords` in sidepanel.js — live: การันตี, 100%, FDA, No.1, แพทย์รับรอง, etc.
- `healthKeywords` + `disclaimer` — live health disclaimer trigger system

**Files containing it:** `forbidden-words-list.js`, `sidepanel.js`, `content-googleflow.js`, `prompt-screening.js`
**CONTENT_CORE coverage:** `01-forbidden-marketing-phrases.js`, `03-body-desc-safe-rewrites.js`, `04-google-flow-policy.js`

---

### D. Story Modes & Film Modes

**What exists:**
- `FILM_MODES` — `cinematic`, `kids`, `ghost_cctv` (full prompts in `promptTemplate.original.js`)
- `PROMPT_MODES` — 7 modes with Thai `directive` text
- `STORY_TYPE_TEMPLATES` — 10 story types with Thai name/icon/description
- `smStoryType` state default — `custom`

**Files containing it:** `promptTemplate.original.js`, `sidepanel.js`
**Known bug:** `STORY_TYPE_TEMPLATES` defines `description` key but renderer reads `tmpl.desc`.

---

### E. Style / Tone / Mood Options

**What exists (very large category):**
- `STYLE_OPTIONS` — 63 style personas (in `promptTemplate.original.js`); 10 basic entries (in runtime `promptTemplate.js`)
- `MOOD_KEYWORDS` — 40 moods (original); 20 (runtime)
- `VISUAL_STYLES` — 50 entries with image-gen prompts (original); 20 entries (sidepanel.js Storymode); `{}` in runtime
- `VIDEO_STYLE_MAP` — sidepanel taxonomy map (Thai labels)
- `BACKGROUND_STYLE_MAP` — sidepanel taxonomy map (Thai labels)
- `CHARACTER_STYLE_MAP` — sidepanel taxonomy map (Thai labels)
- `SPEAKING_STYLE_MAP` — sidepanel taxonomy map (Thai labels)
- `VOICE_TONE_MAP` — sidepanel taxonomy map (Thai labels)
- `SCRIPT_STYLE_MAP` — sidepanel taxonomy map (Thai labels)
- `THAI_ART_STYLE_MAP` — sidepanel taxonomy map (Thai labels)
- `DIALOGUE_STYLE_MAP` — sidepanel taxonomy map (Thai labels + example phrases)
- `TONES` — 10 tones (original only, runtime empty)
- `SHOOTING_STYLES` — 7 styles (original only, runtime empty)
- `DIALECTS` — 8 dialect options (original only, runtime empty)
- `PACINGS` — 5 pacing options (original only, runtime empty)
- `narrativeStyles` — 40 entries (sidepanel.js Studio)
- `moodOptions` — array (sidepanel.js Studio)
- `visualOptions` — 40 entries (sidepanel.js Studio)
- `MOOD_THAI_LABELS` — English mood → Thai display label map
- `visualStyleEngMap` — English style directives for storymode

**Files containing it:** `promptTemplate.original.js`, `sidepanel.js`
**Critical note:** Runtime `promptTemplate.js` has these all as `{}` — extension currently uses mostly empty style options.

---

### F. Hook / CTA Templates

**What exists:**
- `HOOK_LIBRARY` — **200 hooks** `{ id, cat, text }` across FOMO/AUTHENTIC/OBSESSION/CURIOSITY (in `promptTemplate.original.js`; `{}` in runtime)
- `HOOK_CATEGORIES` — 4 categories with Thai descriptions (original; `{}` in runtime)
- `HOOK_CATEGORY_MAP` — sidepanel.js: hook category keys → Thai display labels
- `HOOK_OPTIONS` — 5 entries with Thai names/icons (sidepanel.js storymode)
- `buildHookMasterPrompt` — **EMPTY** function stub
- `HOOK_MASTER_SECTION` — **EMPTY** stub
- `AUTOPOST_SPEECH_HOOK_PROBLEM_CTA` — **EMPTY** stub
- Caption AI prompt (sidepanel.js 12538–12545) — live prompt with hook/tone rules
- CTA AI prompt (sidepanel.js 12601–12612) — live prompt with ≤30 char rules, FOMO style

**Files containing it:** `promptTemplate.original.js`, `sidepanel.js`

---

### G. Platform-specific Rules (TikTok / YouTube / Facebook / Google Flow)

**What exists:**

*TikTok:*
- `AUTOPOST_STEPS` / `STORY_STEPS` — pipeline step labels in `content-googleflow.js`
- `sanitizePromptForFlow` — Google Flow banned regexes + soft replacements
- `GOOGLE_FLOW_FORBIDDEN_WORDS` / `GOOGLE_FLOW_WORD_REPLACEMENTS` — **EMPTY** stubs
- V2 pipeline 3-step (image→video→extend) — step names in comments; prompt bodies from `currentFlowData`
- TikTok upload flow strings in `content.js`, `content-tiktok-platform.js`
- `window.location.href = 'https://www.tiktok.com/tiktokstudio/upload'` — hardcoded URL
- Error keywords for policy detection: `violate our policies`, `try a different prompt`, `audio generation failed`

*YouTube:*
- Status strings in `content-youtube.js`; tab/schedule label matching (`visibility`, `การเผยแพร่`)

*Facebook:*
- Status strings in `content-facebook.js`; schedule label matching (`schedule`, `ตั้งเวลา`)

*Google Flow:*
- `sanitizePromptForFlow` policy rules (the only substantive policy block in `content-googleflow.js`)
- `VIDEO_MODEL_TEXT_MAP` / `MODEL_TEXT_MAP` — Veo/image model dropdown text matching
- Error detection heuristics: `failed`+`violat`/`policies`/`audio generation failed`/`something went wrong`
- Step-resume strings for each pipeline step

**Files containing it:** `content-googleflow.js`, `content.js`, `content-tiktok-platform.js`, `content-youtube.js`, `content-facebook.js`, `sidepanel.js`

---

### H. Taxonomy Maps

**What exists:**
- `PRODUCT_CATEGORY_MAP` — Thai category labels (sidepanel.js)
- `TPL_CATEGORIES` — Template categories: general, fashion, food, beauty, tech, home, custom
- `PIXAR_3D_CHARACTERS` + `pixarCharMap` — character id → description/gender
- `categoryKeywords` — per-category Thai + English keyword lists
- `WEARABLE_CATS` / `BATCH_WEARABLE_CATS` — wearable product category arrays
- `SCENE_TEMPLATES` — 8 scene archetypes (original only; `{}` in runtime)
- `SCENE_CONFIG` — min/max scenes per duration
- `VIDEO_MODEL_TEXT_MAP` / `MODEL_TEXT_MAP` — Veo/image model dropdown taxonomy
- `detectProductCategory` regex patterns — inline fashion/shoes/beauty/food/tech detection
- `detectProductGender` regex patterns — female/male product detection

**Files containing it:** `promptTemplate.original.js`, `sidepanel.js`, `content-googleflow.js`

---

### I. UI Messages / SOP Steps

**What exists (very large):**
- Hundreds of Thai emoji-prefixed status strings in `sidepanel.js`, `content-googleflow.js`, `content.js`, `content-tiktok-platform.js`, `content-youtube.js`, `content-facebook.js`
- `AUTOPOST_STEPS` / `STORY_STEPS` step label objects
- `FLOW_STEP_LABELS` / `V2_FLOW_STEP_LABELS` — Thai UI labels per flow step
- `MODE_DATA` — mode names + duration copy
- `statusStepMap` — flow status → Thai progress strings
- `selectorConfig` — UI dropdown field labels
- `PRODUCT_STATUS` — status keys → Thai label + color token
- `statusMap` — `pending`/`processing`/`completed` → Thai
- `TPL_CATEGORIES` — template category UI labels
- License service messages — Thai error/success copy
- `formatCheckerResult` — Thai HTML policy checker UI copy

**Files containing it:** All automation files + `sidepanel.js`

---

### J. Other

**What exists:**
- `PLATFORM_MODES` — flow/grok/supergrok timing config (original; `{}` in runtime)
- `safetySettings` in `api.js` — Gemini BLOCK_NONE safety categories
- `GEMINI_MODEL_CHAIN` — model fallback chain IDs
- `SCREENER_MODELS` — screener model IDs
- `SCHEDULE_FIELDS` — TikTok API field names
- `SKIP_TS_KEYS` — React state timestamp key filter
- `NEGATIVE_PROMPT` / `NO_TEXT_ENFORCEMENT` — image generation negative prompts (original only; `''` in runtime)
- Photorealistic `stripPatterns` — RegExp array for removing 3D/CGI style phrases from prompts

---

## Section 5: Gaps & Recommendations

### 5.1 What's in the Extension but MISSING or INCOMPLETE in CONTENT_CORE

The `CONTENT_CORE` directory currently has 6 files:

| CONTENT_CORE File | What It Covers | Assessment |
|---|---|---|
| `01-forbidden-marketing-phrases.js` | `FORBIDDEN_MARKETING_PHRASES` from `forbidden-words-list.js` | ✅ Appears covered |
| `02-master-prompt-template.js` | `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` + all libraries (861 lines ≈ `promptTemplate.original.js`) | ✅ Appears to match original |
| `03-body-desc-safe-rewrites.js` | `BODY_DESC_SAFE_REWRITES`, `sanitizeCharacterDesc` rules | ✅ Covers one stub group |
| `04-google-flow-policy.js` | `GOOGLE_FLOW_FORBIDDEN_WORDS`, `GOOGLE_FLOW_WORD_REPLACEMENTS`, `sanitizeDialogueForGoogleFlow`, `sanitizeVideoPrompt`, `sanitizeCharacterDesc`, `AUDIO_SAFE_REPLACEMENTS` | ✅ Covers Google Flow stubs |
| `05-prompt-screening-spec.js` | `VIOLENCE_AND_UNSAFE_EN`, `RISK_SNIPPETS`, `HARD_BAN_REGEXES`, `GEMINI_SCREENER_SYSTEM` | ✅ Covers screening stubs |
| `06-ui-copy.js` | Some UI copy | ⚠️ Likely incomplete (52 lines vs hundreds of status strings) |

**Content in the extension NOT yet in any CONTENT_CORE file:**

1. **sidepanel.js taxonomy maps** (very large) — `VIDEO_STYLE_MAP`, `BACKGROUND_STYLE_MAP`, `CHARACTER_STYLE_MAP`, `SPEAKING_STYLE_MAP`, `VOICE_TONE_MAP`, `SCRIPT_STYLE_MAP`, `THAI_ART_STYLE_MAP`, `DIALOGUE_STYLE_MAP`, `PRODUCT_CATEGORY_MAP`, `HOOK_CATEGORY_MAP` — all define Thai display labels. No CONTENT_CORE equivalent.

2. **CONTENT_PROMPT_NORMAL / EXTEND / NO_TEXT / NO_TEXT_EXTEND** (sidepanel.js lines 1163–1271) — the actual AI content-generation prompts used for every product post. Not extracted to CONTENT_CORE.

3. **IMAGE_PROMPT_TEMPLATE / IMAGE_PROMPT_TEMPLATE_NO_TEXT** (sidepanel.js lines 990–1012) — image generation templates. Not in CONTENT_CORE.

4. **VIDEO_PROMPT_STEP1 / VIDEO_PROMPT_STEP2 + variations** (sidepanel.js lines 1055–1125) — video prompt templates. Not in CONTENT_CORE.

5. **Scene-type templates** (`CREATIVE_SCENE_*`, `PIXAR3D_*`, `CINEMATIC_*`, `STORYBOOK_*`) (sidepanel.js lines 1132–1158) — Not in CONTENT_CORE.

6. **PROMPT_CHECKER_MODES** (sidepanel.js lines 1601–1621) — 4 checker mode prompt strings all empty (`TODO: USER_PROMPT`). Should be filled and tracked in CONTENT_CORE.

7. **Storymode system prompts** — `getStorymodeSystemPromptForGenerate`, `getMinimalStorymodeSystemPrompt` — not in CONTENT_CORE.

8. **getVisualStylePromptTemplates** — per-style image/video prompt templates for 15 visual styles (disney, cinematic, ghibli, claymation, etc.) — not in CONTENT_CORE.

9. **V2 template prompts** — `buildV2ImagePrompt`, `buildV2VideoPrompt`, `buildV2ExtendPrompt` — not in CONTENT_CORE.

10. **PIXAR_3D_CHARACTERS** array + `categoryKeywords` — character definitions with personality/bestFor tags. Not in CONTENT_CORE.

11. **Caption repair/overclaim system** — `overclaimWords`, `healthKeywords`, `disclaimer` (sidepanel.js 9037–9080). Not in CONTENT_CORE.

12. **TIKTOK_CAPTION_REPAIR_PROMPT** — mini-prompt for caption finisher (exists in original, empty in runtime). Not explicitly extracted.

13. **Studio master-prompt maps** (`formatMap`, `narrativeMap`, `moodMap`, `visualMap`) — all empty in sidepanel.js. Not in CONTENT_CORE with values.

14. **sanitizePromptForFlow rules block** (content-googleflow.js lines 1807–1831) — the only real policy block in the Google Flow file (banned regexes, soft replacements, layout term stripping). May partially overlap with `04-google-flow-policy.js`.

---

### 5.2 TODO_EMPTY Stubs That Need Content

**High priority (blocking features):**

| Stub | Location | Impact |
|------|----------|--------|
| `PROMPT_CHECKER_MODES.*.prompt` (4 modes) | sidepanel.js 1601–1621 | Policy checker non-functional without prompts |
| `buildHookMasterPrompt` + `HOOK_MASTER_SECTION` | sidepanel.js 13–19 | Hook-based prompt enrichment disabled |
| `getEnhancedPrompt` | sidepanel.js 22–24 | Per-category system prompt enhancement disabled |
| `GEMINI_SCREENER_SYSTEM` | prompt-screening.js | Gemini compliance screen has no system instructions |
| `prompt` in generate-caption/CTA/ai/media actions | sidepanel.js 5095–5174 | AI analysis actions send empty prompts |
| `analysisPrompt` (character + product) | sidepanel.js 9967, 10013 | Product/character analysis sends no text to API |
| Studio maps: `formatMap`, `narrativeMap`, `moodMap`, `visualMap` | sidepanel.js 11372–11479 | Studio master prompt assembles with empty context |
| `systemPrompt` in `generateScenesFromMasterPrompt` | sidepanel.js 11715 | Scene generation has no system instruction |
| `RANDOM_CHARACTERS` / `RANDOM_BACKGROUNDS` | sidepanel.js 4127/4130 | Random character/background pools are empty |

**Medium priority (degraded quality):**

| Stub | Location | Impact |
|------|----------|--------|
| `GOOGLE_FLOW_FORBIDDEN_WORDS` / `GOOGLE_FLOW_WORD_REPLACEMENTS` | sidepanel.js 1641–1646 | Google Flow dialogue is not sanitized |
| `sanitizeDialogueForGoogleFlow` | sidepanel.js 1650–1651 | Passthrough — dialogue sent raw to Flow |
| `BODY_DESC_SAFE_REWRITES` | sidepanel.js 1656 | Character description is not rewritten for safety |
| `sanitizeCharacterDesc` | sidepanel.js 1660–1661 | Passthrough — may pass unsafe body terms to image gen |
| `AUDIO_SAFE_REPLACEMENTS` | sidepanel.js 1668 | Audio/speech prompt is not sanitized |
| `sanitizeVideoPrompt` | sidepanel.js 1671–1672 | Video prompt goes unsanitized |
| `applyGoogleFlowUserInputGuard` | sidepanel.js 1680–1681 | User input guard is inactive |
| `preFlightPolicyScreen` | sidepanel.js 1687–1688 | Pre-flight screen is disabled |
| `OVERCLAIM_RULES_BASE` | sidepanel.js 484–485 | Overclaim rule enforcement has no base content |
| `buildProductImageLockBlock` | sidepanel.js 498–501 | Product lock block in image prompts is empty |
| `VIOLENCE_AND_UNSAFE_EN` / `RISK_SNIPPETS` / `HARD_BAN_REGEXES` | prompt-screening.js | Screening passes all text through without filtering |
| `localScreenText` / `geminiComplianceSanitize` | prompt-screening.js | Sanitization functions are no-ops |

**Low priority (optional enhancements):**

| Stub | Location | Impact |
|------|----------|--------|
| `AUTOPOST_SPEECH_HOOK_PROBLEM_CTA` | sidepanel.js 505 | CTA hook for speech problem not defined |
| `thaiArtStyleDesc` | sidepanel.js 4726 | Thai art style description is empty after Pixar branch |
| `characterDesc` on characterImage path | sidepanel.js 4731 | Character description not injected when image provided |

---

### 5.3 Surprises & Unexpected Findings

1. **`promptTemplate.js` (runtime) vs `promptTemplate.original.js` — CRITICAL**: The file actually imported by the extension (`promptTemplate.js`) has only 53 lines and is nearly all empty. The 862-line `promptTemplate.original.js` contains the full content but is NOT loaded at runtime. The extension currently runs with: empty master director prompt, 10 style options (no descriptions), 20 mood keywords, and no HOOK_LIBRARY, VISUAL_STYLES, SCENE_TEMPLATES, DIALECTS, TONES, SCENE_LOCATIONS, PACINGS, SHOOTING_STYLES, PROMPT_MODES, or FILM_MODES. **This is likely the single most important gap to fix.**

2. **Two `visualStyleMap` definitions in `sidepanel.js`** (lines 11631 and 11965) have non-overlapping key sets — key-alignment risk that could cause `defaultTemplate` to fire more than intended in `getVisualStylePromptTemplates`.

3. **`STORY_TYPE_TEMPLATES` bug**: defines key `description` but renderer reads `tmpl.desc` — all 10 story type descriptions will be `undefined` in the UI dropdown.

4. **TikTok timeout mismatch** in `content-googleflow.js`: error message displayed to user says "15 นาที" but `maxWaitMs` is set to `25 * 60 * 1000` (25 minutes) for the video generation step.

5. **Duplicate content** in `forbidden-words-list.js`: at least 3 phrases appear twice in the source (ดีท็อกซ์, ลดน้ำหนัก, ไม่มีผลข้างเคียง, ฆ่าเชื้อสิว). Runtime deduplication handles this but the source should be cleaned.

6. **`PLATFORM_MODES` word count inconsistency**: `promptTemplate.original.js` has `words: '20-30'` for Flow mode, but `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` body mandates 15–20 words for dialogue. These need reconciliation.

7. **`HOOK_LIBRARY` absent from runtime**: The 200-hook FOMO/AUTHENTIC/OBSESSION/CURIOSITY library is defined in `promptTemplate.original.js` but is `{}` in `promptTemplate.js`. Any feature that calls `HOOK_LIBRARY[hookId]` or iterates hook categories will get nothing.

8. **`sanitizePromptForFlow` in `content-googleflow.js`** (lines 1807–1831) contains real policy rules (banned regex patterns, soft replacements) but these are NOT referenced by `sidepanel.js` stubs which define their own empty passthrough versions. The two sanitization systems are disconnected.

9. **Studio master-prompt maps all empty** (`formatMap`, `narrativeMap`, `moodMap`, `visualMap` in sidepanel.js 11372–11479): Studio mode sends raw ids/keywords to the LLM instead of descriptive text. User-facing quality of Studio-generated scenes will be significantly lower than intended.

10. **`uploadCharacterImageIfExistsOLD_STEP7`** in `content-googleflow.js` (~line 8405) is marked `OLD - DISABLED` in a comment — confirm whether this code path is still referenced elsewhere before any refactor.

11. **`buildHookMasterPrompt` and `getEnhancedPrompt` being empty** means the current sidepanel.js AI calls use no system prompt enrichment and no hook guidance — every product gets the same vanilla prompt regardless of hook category selection.

---

*End of report.*
