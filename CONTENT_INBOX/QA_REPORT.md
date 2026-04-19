# CONTENT_CORE Quality Audit Report

**Date:** 2026-04-16  
**Auditor:** Automated QA (Cursor Agent)  
**Scope:** CONTENT_CORE files 01–15 (excluding 03-body-desc-safe-rewrites.js and 06-ui-copy.js, which were not listed in audit scope)

---

## Summary

| Metric | Count |
|---|---|
| Files in CONTENT_CORE folder | 15 |
| Files audited (in scope) | 13 |
| Files **PASS** | 10 |
| Files **FAIL / need fix** | 3 |
| Files **not audited** (out of scope) | 2 (03, 06) |

**Files needing fixes:** `08-visual-style-templates.js`, `09-v2-prompts.js`, `14-content-gen-prompts.js`

---

## File-by-File Results

---

### 01 - forbidden-marketing-phrases.js

**Status: PASS**

**Verification method:** The constant name `FORBIDDEN_MARKETING_PHRASES` does **not** appear in `sidepanel.js` (grep returned no matches). In the source, forbidden words are referenced inline in the master prompt (rule 5) and via `GOOGLE_FLOW_FORBIDDEN_WORDS = []` (empty array, runtime-populated). The CONTENT_CORE file is a compiled standalone export derived from the forbidden word categories listed in the master prompt template.

**Findings:**
- File is not empty (212 lines).
- Exports `FORBIDDEN_MARKETING_PHRASES` as a processed array (split/trimmed from template string).
- Contains ~200 Thai and English forbidden marketing phrases covering all categories from rule 5 of the master prompt: overclaim, medical claims, before/after, doctor endorsements, guarantee language, and FOMO pressure phrases.
- No truncation detected — ends cleanly at line 211.
- Duplicate entries intentionally present (`ดีท็อกซ์`, `ลดน้ำหนัก`, `ฆ่าเชื้อสิว`, `ไม่มีผลข้างเคียง`) — these are filtered harmlessly by the `.filter()` call.

**Issues:** None.

---

### 02 - master-prompt-template.js

**Status: PASS**

**Verification method:** Source is `promptTemplate.original.js` — the file IS the source. Line count comparison: source and CONTENT_CORE file are the same content.

**Findings:**
- File is not empty or truncated (861 lines, ends with `// End of file` comment).
- All 18 expected exports present and complete:
  - `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` ✅ (275 lines, all 16 system rules present)
  - `STYLE_OPTIONS` ✅ (63 style entries, ids 1–63)
  - `MOOD_KEYWORDS` ✅ (40 entries)
  - `PLATFORM_MODES` ✅ (flow, grok, supergrok)
  - `HOOK_LIBRARY` ✅ (200 hooks, 4 categories × 50)
  - `HOOK_CATEGORIES` ✅
  - `VISUAL_STYLES` ✅ (50 entries)
  - `SCENE_TEMPLATES` ✅ (8 scenes)
  - `DIALECTS` ✅ (8 entries)
  - `TONES` ✅ (10 entries)
  - `SCENE_LOCATIONS` ✅ (15 entries)
  - `PACINGS` ✅ (5 entries)
  - `SHOOTING_STYLES` ✅ (7 entries)
  - `PROMPT_MODES` ✅ (8 entries)
  - `FILM_MODES` ✅ (4 entries)
  - `NEGATIVE_PROMPT` ✅
  - `NO_TEXT_ENFORCEMENT` ✅
  - `TIKTOK_CAPTION_REPAIR_PROMPT` ✅
- Backtick template strings all open and close correctly.

**Issues:** None.

---

### 04 - google-flow-policy.js

**Status: PASS**

**Verification method:** Cross-checked against `content-googleflow.js` lines 1808–1832 (`sanitizePromptForFlow`).

**Source `softReplace` object (lines 1816–1820) — 10 pairs:**
```
scream→exclaim softly, shriek→gasp, thunder→gentle rain,
explosion→gentle pop, gunshot→soft tap, siren→gentle chime,
alarm→soft notification, crash→soft landing, bang→soft knock,
roar→gentle hum
```

**`GOOGLE_FLOW_WORD_REPLACEMENTS` in CONTENT_CORE (lines 131–161):**
All 10 source `softReplace` pairs present ✅:
- `scream` → `exclaim softly` ✅
- `shriek` → `gasp` ✅
- `thunder` → `gentle rain` ✅
- `explosion` → `gentle pop` ✅
- `gunshot` → `soft tap` ✅
- `siren` → `gentle chime` ✅
- `alarm` → `soft notification` ✅
- `crash` → `soft landing` ✅
- `bang` → `soft knock` ✅
- `roar` → `gentle hum` ✅

**Additional exports verified:**
- `GOOGLE_FLOW_HARD_BAN` ✅ (3 regex patterns matching source)
- `AUDIO_SAFE_REPLACEMENTS` ✅ (15 pairs — 10 source pairs + 5 extended: shout, yell, blast, smash, slam. These are enhancements, not discrepancies.)
- `GOOGLE_FLOW_LAYOUT_BAN` ✅ (regex matches source line 1829)
- `GOOGLE_FLOW_FORBIDDEN_WORDS` ✅
- `sanitizePromptForFlow()` ✅ (logic order matches source: soft-replace → hard-ban → layout-ban → cleanup)
- `sanitizeDialogueForGoogleFlow()` ✅

**Issues:** None critical. `AUDIO_SAFE_REPLACEMENTS` has 5 extra pairs vs source — intentional enhancement.

---

### 05 - prompt-screening-spec.js

**Status: PASS**

**Findings:**
- File is not empty (212 lines).
- All expected exports present:
  - `VIOLENCE_AND_UNSAFE_EN` ✅ (array of 37 unsafe English terms)
  - `RISK_SNIPPETS` ✅ (7 regex patterns for overclaim detection)
  - `HARD_BAN_REGEXES` ✅ (spreads from canonical sources via import)
  - `SCREEN_PRODUCT_ANALYSIS_KEYS` ✅ (9 field names)
  - `shouldSkipGeminiCompliance()` ✅ (3-condition skip logic)
  - `SCREENER_MODELS` ✅ (3 Gemini model strings)
  - `GEMINI_SCREENER_SYSTEM` ✅ (full system prompt)
  - `PROMPT_CHECKER_MODES` ✅ (4 modes: strict, balanced, conversion, thai)
- Imports from `./04-google-flow-policy.js` and `./03-body-desc-safe-rewrites.js` ✅
- No truncated backtick strings — all template literals close correctly.

**Issues:** None.

---

### 07 - storymode-prompts.js

**Status: PASS**

**Findings:**
- File is not empty (226 lines).
- `getSystemPromptForSceneGeneration()` exported ✅ (wrapper alias).
- `getMinimalStorymodeSystemPrompt()` and `getStorymodeSystemPromptForGenerate()` defined but **not directly exported** — by design, accessed only via the wrapper export.
- `visualStyleMap` (inside `getStorymodeSystemPromptForGenerate`) covers 20 style keys; `visualStyleMap` at line 159 (for `generateScenesFromMasterPrompt`) covers 22 keys including `ugc_raw` and `thai_street` — both variants documented.
- Runtime variable dependencies noted inline (`VISUAL_STYLES`, `smVisualStyle`, `smStoryType`, `smOutputType`, `smMoodKeyword`, `smSceneCount`) — these are sidepanel.js globals, not importable. Documented in file header.
- No truncated backtick strings.

**Issues:** None critical. Runtime variable dependencies are a known limitation of extracting from a non-module source.

---

### 08 - visual-style-templates.js

**Status: FAIL**

**Findings:**
- File is not empty (119 lines).
- **CRITICAL — No exports:** `getVisualStylePromptTemplates()` is defined but not exported (`export` keyword missing). Any import of this file will get nothing.
- **BUG — Duplicate key:** The `'90sanime'` key appears **twice** in the templates object (lines 76–79 and 81–84 are identical blocks). In JavaScript, the second definition silently overwrites the first — this is not a functional bug (same content) but indicates a copy-paste error.
- Referenced external variable `studioSelectedVisual` (line 117) is a sidepanel.js DOM global, not importable — documented as expected.

**Issues:**
1. ❌ `getVisualStylePromptTemplates` function is NOT exported — module is effectively empty.
2. ⚠️ Duplicate `'90sanime'` key (lines ~76 and ~81) — should be deduplicated.

**Fix required:** Add `export` keyword to `function getVisualStylePromptTemplates()` at line 13, and remove the duplicate `'90sanime'` block.

---

### 09 - v2-prompts.js

**Status: FAIL**

**Findings:**
- File is not empty (58 lines).
- Contains 4 functions: `buildV2ImagePrompt`, `buildV2VideoPrompt`, `buildV2ExtendPrompt`, `getV2TemplateSettings`.
- **CRITICAL — No exports:** None of the 4 functions have the `export` keyword. This module exports nothing.
- Logic content matches source (`sidepanel.js` ~lines 13418–13464) — functions are correctly transcribed.
- No truncated strings.

**Issues:**
1. ❌ All 4 functions missing `export` keyword — module exports nothing.

**Fix required:** Add `export` to each function declaration: `buildV2ImagePrompt`, `buildV2VideoPrompt`, `buildV2ExtendPrompt`, `getV2TemplateSettings`.

---

### 10 - random-pools.js

**Status: PASS**

**Findings:**
- File is not empty (184 lines).
- All expected exports present:
  - `RANDOM_CHARACTERS` ✅ (14 Pixar 3D character objects with full English desc, gender, personality, bestFor)
  - `RANDOM_BACKGROUNDS` ✅ (50 background entries with English desc and Thai label)
  - `CHARACTER_STYLE_MAP` ✅ (31 keys — matches source `sidepanel.js` line 664–705)
  - `BACKGROUND_STYLE_MAP` ✅ (42 keys — matches source lines 610–661)
- No truncated strings.

**Issues:** None.

---

### 11 - studio-maps.js

**Status: PASS**

**Findings:**
- File is not empty (144 lines).
- All expected exports present:
  - `formatMap` ✅ (5 format types)
  - `narrativeMap` ✅ (40 narrative archetypes — all 4 categories: Talking Objects, Viral Characters, Regional Dialects, Thai Social Media)
  - `moodMap` ✅ (8 mood options)
  - `visualMap` ✅ (39 visual style keys covering all core animation + Thai/trend + camera/technique styles)
- No truncated backtick strings.

**Issues:** None.

---

### 12 - hook-master.js

**Status: PASS**

**Findings:**
- File is not empty (102 lines).
- All expected exports present:
  - `HOOK_MASTER_SECTION` ✅ (stable prefix for hook-aware AI system messages)
  - `buildHookMasterPrompt(overrideCat, usedHookIds)` ✅ (category filtering + dedup logic)
  - `getEnhancedPrompt(overrideHookCat, usedHookIds)` ✅ (combines ADAPTIVE_VIDEO_DIRECTOR_PROMPT + hook selection)
- Imports from `./02-master-prompt-template.js` are correct: `HOOK_LIBRARY`, `HOOK_CATEGORIES`, `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` ✅
- Usage comments match actual call sites in sidepanel.js (lines 4333, 4814, 5185, 11558) ✅
- No truncated strings.

**Issues:** None.

---

### 13 - image-video-prompt-templates.js

**Status: PASS**

**Verification method:** Cross-checked against `sidepanel.js` lines 990–1162.

**All 14 expected exports present:**
1. `IMAGE_PROMPT_TEMPLATE` ✅ — content matches source line 990 exactly
2. `IMAGE_PROMPT_TEMPLATE_NO_TEXT` ✅ — matches source line 1006
3. `VIDEO_PROMPT_STEP1_VARIATIONS` ✅ — matches source lines 1055–1068
4. `VIDEO_PROMPT_STEP1` ✅ — matches source lines 1078–1092
5. `VIDEO_PROMPT_STEP2_VARIATIONS` ✅ — matches source lines 1096–1104
6. `VIDEO_PROMPT_STEP2` ✅ — matches source lines 1110–1125
7. `CREATIVE_SCENE_IMAGE_TEMPLATE` ✅ — matches source line 1132
8. `CREATIVE_SCENE_VIDEO_TEMPLATE` ✅ — matches source line 1134
9. `PIXAR3D_IMAGE_TEMPLATE` ✅ — matches source line 1138
10. `PIXAR3D_VIDEO_TEMPLATE` ✅ — matches source line 1142
11. `CINEMATIC_IMAGE_TEMPLATE` ✅ — matches source line 1146
12. `CINEMATIC_VIDEO_TEMPLATE` ✅ — matches source line 1150
13. `STORYBOOK_IMAGE_TEMPLATE` ✅ — matches source line 1154
14. `STORYBOOK_VIDEO_TEMPLATE` ✅ — matches source line 1158

**Note:** `TIME_VARIATIONS`, `MOOD_VARIATIONS`, `CAMERA_VARIATIONS`, `VIDEO_FONT_FREEZE_RULE`, and `VIDEO_PROMPT_STEP1_AUDIO` from the same source range are NOT exported. These are referenced by `buildContentGenerationPrompt` in the source — see File 14 findings.

**Issues:** None for the 14 specified exports.

---

### 14 - content-gen-prompts.js

**Status: FAIL**

**Verification method:** Cross-checked against `sidepanel.js` lines 1163–1570. The audit notes the full `buildContentGenerationPrompt` references `TIME_VARIATIONS`, `MOOD_VARIATIONS`, `CHARACTER_STYLE_MAP`, `BACKGROUND_STYLE_MAP`, `THAI_ART_STYLE_MAP`.

**Findings:**
- File is not empty (155 lines).

**(a) All 4 CONTENT_PROMPT_* constants — ✅ Present:**
- `CONTENT_PROMPT_NORMAL` ✅ (matches source lines 1163–1193)
- `CONTENT_PROMPT_EXTEND` ✅ (matches source lines 1195–1229)
- `CONTENT_PROMPT_NO_TEXT` ✅ (matches source lines 1231–1249)
- `CONTENT_PROMPT_NO_TEXT_EXTEND` ✅ (matches source lines 1251–1271)

**(b) TIME_VARIATIONS array — ❌ MISSING**
- Defined in source lines 1016–1027 (10 Thai time-of-day strings).
- Not present in this file or in file 13.
- The array is used by the full `buildContentGenerationPrompt` to rotate time-of-day variation into prompts.

**(c) MOOD_VARIATIONS array — ❌ MISSING**
- Defined in source lines 1029–1040 (10 Thai mood/atmosphere strings).
- Not present in this file or in file 13.

**(d) `buildContentGenerationPrompt` — ⚠️ Simplified / Incomplete**
- Present and exported ✅ (lines 129–154).
- Injects: base prompt ✅, STYLE_PLACEHOLDER ✅, product name/highlight/price ✅, gender ✅, usedHeadlines ✅.
- **Missing injections vs full source function:** Does NOT inject TIME_VARIATIONS rotation, MOOD_VARIATIONS rotation, CHARACTER_STYLE_MAP lookup, BACKGROUND_STYLE_MAP lookup, or THAI_ART_STYLE_MAP lookup — all of which the source function at ~line 1440–1570 incorporates to build richer prompts.

**Issues:**
1. ❌ `TIME_VARIATIONS` array missing (10 entries, source lines 1016–1027).
2. ❌ `MOOD_VARIATIONS` array missing (10 entries, source lines 1029–1040).
3. ⚠️ `buildContentGenerationPrompt` is a simplified stub — missing all variation/map injection logic present in the full source version.

**Fix required:**
- Add `TIME_VARIATIONS` and `MOOD_VARIATIONS` exports (can be moved from File 13 scope or added here).
- Expand `buildContentGenerationPrompt` to inject time, mood, and style map values as the full source function does.

---

### 15 - style-descriptor-maps.js

**Status: PASS** *(with minor note)*

**Verification method:** Cross-checked against `sidepanel.js` lines 577–965.

**Key counts — source vs CONTENT_CORE:**

| Map | Source count | CONTENT_CORE count | Expected | Match |
|---|---|---|---|---|
| VIDEO_STYLE_MAP | 29 | 29 | ~30 | ✅ |
| SPEAKING_STYLE_MAP | 29 | 29 | ~25 | ✅ |
| VOICE_TONE_MAP | 29 | 29 | ~29 | ✅ |
| SCRIPT_STYLE_MAP | 21 | 21 | ~21 | ✅ |
| THAI_ART_STYLE_MAP | 15 | 15 | ~15 | ✅ |
| DIALOGUE_STYLE_MAP | 15 | 15 | ~15 | ✅ |
| PRODUCT_CATEGORY_MAP | 12 | 12 | ~12 | ✅ |
| HOOK_CATEGORY_MAP | 5 | 5 | ~5 | ✅ |

**DROPDOWN_OPTIONS — minor discrepancy:**
- Source (line 944–955) has 10 keys including `character` and `background`.
- CONTENT_CORE (line 194–203) has 8 keys — **missing `character` and `background` keys**.
- A comment in the file explains this: `CHARACTER_STYLE_MAP` and `BACKGROUND_STYLE_MAP` live in `10-random-pools.js` and can't be referenced without an import. This is a documented design decision, not an oversight.

**Extra export:**
- `PRODUCT_STATUS` (lines 205–215) — not in source range 577–965 (it's at source line 975–984), but included as a convenience. Content matches source exactly.

**Issues:**
- ⚠️ `DROPDOWN_OPTIONS` missing `character` and `background` keys vs source (documented intentionally).

---

## Issues Summary Table

| File | Issue Type | Description | Severity |
|---|---|---|---|
| 08-visual-style-templates.js | Missing export | `getVisualStylePromptTemplates` not exported — module appears empty to importers | **CRITICAL** |
| 08-visual-style-templates.js | Duplicate key | `'90sanime'` key duplicated in templates object | LOW |
| 09-v2-prompts.js | Missing exports | All 4 functions (`buildV2ImagePrompt`, `buildV2VideoPrompt`, `buildV2ExtendPrompt`, `getV2TemplateSettings`) missing `export` keyword | **CRITICAL** |
| 14-content-gen-prompts.js | Missing constants | `TIME_VARIATIONS` (10 entries) not exported | HIGH |
| 14-content-gen-prompts.js | Missing constants | `MOOD_VARIATIONS` (10 entries) not exported | HIGH |
| 14-content-gen-prompts.js | Simplified function | `buildContentGenerationPrompt` missing variation injection (TIME, MOOD, CHARACTER_STYLE_MAP, BACKGROUND_STYLE_MAP, THAI_ART_STYLE_MAP) vs full source version | MEDIUM |
| 15-style-descriptor-maps.js | Minor omission | `DROPDOWN_OPTIONS` missing `character` and `background` keys (intentionally documented) | LOW |

---

## Recommended Fixes

### Fix 1: `08-visual-style-templates.js` — Add export
```javascript
// Change line 13 from:
function getVisualStylePromptTemplates() {
// To:
export function getVisualStylePromptTemplates() {
```
Also remove the duplicate `'90sanime'` block (lines 81–85).

### Fix 2: `09-v2-prompts.js` — Add exports
```javascript
export function buildV2ImagePrompt(item, s) { ... }
export function buildV2VideoPrompt(item, s) { ... }
export function buildV2ExtendPrompt(item, s) { ... }
export function getV2TemplateSettings() { ... }
```

### Fix 3: `14-content-gen-prompts.js` — Add missing arrays
Add these exports (from source `sidepanel.js` lines 1016–1040):
```javascript
export const TIME_VARIATIONS = [
  'บรรยากาศตอนเช้าสดใส', 'แสงกลางวันสว่างไสว', 'บรรยากาศตอนบ่ายสบายๆ',
  'แสงเย็นอบอุ่น', 'บรรยากาศตอนค่ำโรแมนติก', 'แสงธรรมชาตินุ่มนวล',
  'บรรยากาศสดใส', 'แสง soft light', 'บรรยากาศตอนเช้ามืด', 'แสงทอง golden hour'
];

export const MOOD_VARIATIONS = [
  'บรรยากาศสดใสร่าเริง', 'อารมณ์ผ่อนคลาย', 'บรรยากาศกระตือรือร้น',
  'อารมณ์อบอุ่นเป็นกันเอง', 'บรรยากาศมีชีวิตชีวา', 'อารมณ์สงบเยือกเย็น',
  'บรรยากาศมั่นใจ', 'อารมณ์สนุกสนาน', 'บรรยากาศเป็นมิตร', 'อารมณ์น่าตื่นเต้น'
];
```
Then expand `buildContentGenerationPrompt` to inject a random item from each variation into the assembled prompt.

---

*End of Report*
