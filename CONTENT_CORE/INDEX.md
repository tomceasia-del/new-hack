# CONTENT_CORE — Index & Navigation Guide

## วิธีใช้

**อ่าน INDEX นี้ก่อนเสมอ** — บอกว่าของที่ต้องการอยู่ไฟล์ไหน บรรทัดเท่าไหร่  
**Import ผ่าน `index.js` เสมอ** — ไม่ import ตรงจากไฟล์ย่อย

```javascript
// ✅ ถูก
import { HOOK_LIBRARY, VIDEO_STYLE_MAP } from './CONTENT_CORE/index.js'

// ❌ ผิด (fragile — พังถ้า internal structure เปลี่ยน)
import { HOOK_LIBRARY } from './CONTENT_CORE/02-master-prompt-template.js'
```

---

## ต้องการอะไร → ดูไฟล์ไหน

### AI System Prompts & Director Logic

| Export | ไฟล์ | หมายเหตุ |
|--------|------|---------|
| `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` | `02.js` / `02a-director-prompt.js` | System prompt หลักทุก AI call |
| `getEnhancedPrompt()` | `12-hook-master.js` | Returns director prompt + hooks |
| `getMinimalStorymodeSystemPrompt()` | `07-storymode-prompts.js` | Short version |
| `getStorymodeSystemPromptForGenerate()` | `07-storymode-prompts.js` | Full storymode version |
| `getSystemPromptForSceneGeneration()` | `07-storymode-prompts.js` | Alias → ใช้ใน generateScenesFromMasterPrompt |

### Hook System

| Export | ไฟล์ |
|--------|------|
| `HOOK_LIBRARY` (250 entries) | `02.js` / `02b-hook-library.js` |
| `HOOK_CATEGORIES` | `02.js` / `02b-hook-library.js` |
| `HOOK_MASTER_SECTION` | `12-hook-master.js` |
| `buildHookMasterPrompt(cat, usedIds)` | `12-hook-master.js` |

### Image & Video Generation

| Export | ไฟล์ |
|--------|------|
| `IMAGE_PROMPT_TEMPLATE` | `13-image-video-prompt-templates.js` |
| `IMAGE_PROMPT_TEMPLATE_NO_TEXT` | `13-image-video-prompt-templates.js` |
| `PIXAR3D_IMAGE_TEMPLATE` | `13-image-video-prompt-templates.js` |
| `CINEMATIC_IMAGE_TEMPLATE` | `13-image-video-prompt-templates.js` |
| `STORYBOOK_IMAGE_TEMPLATE` | `13-image-video-prompt-templates.js` |
| `VIDEO_PROMPT_STEP1` / `STEP2` | `13-image-video-prompt-templates.js` |
| `buildImagePrompt(item)` | `14-content-gen-prompts.js` |
| `buildVideoPromptStep1(item, script)` | `14-content-gen-prompts.js` |
| `buildVideoPromptStep2(item, script)` | `14-content-gen-prompts.js` |
| `getVisualStylePromptTemplates(style)` | `08-visual-style-templates.js` |

### Content Generation (H1/H2/Caption/Speech)

| Export | ไฟล์ |
|--------|------|
| `CONTENT_PROMPT_NORMAL` | `14-content-gen-prompts.js` |
| `CONTENT_PROMPT_EXTEND` | `14-content-gen-prompts.js` |
| `CONTENT_PROMPT_NO_TEXT` | `14-content-gen-prompts.js` |
| `buildContentGenerationPrompt(item,...)` | `14-content-gen-prompts.js` |

### Style Descriptor Maps (Dropdown → Thai label)

| Export | ไฟล์ | keys ≈ |
|--------|------|--------|
| `VIDEO_STYLE_MAP` | `15-style-descriptor-maps.js` | 30 |
| `SPEAKING_STYLE_MAP` | `15-style-descriptor-maps.js` | 25 |
| `VOICE_TONE_MAP` | `15-style-descriptor-maps.js` | 29 |
| `SCRIPT_STYLE_MAP` | `15-style-descriptor-maps.js` | 21 |
| `THAI_ART_STYLE_MAP` | `15-style-descriptor-maps.js` | 15 |
| `DIALOGUE_STYLE_MAP` | `15-style-descriptor-maps.js` | 15 |
| `PRODUCT_CATEGORY_MAP` | `15-style-descriptor-maps.js` | 12 |
| `HOOK_CATEGORY_MAP` | `15-style-descriptor-maps.js` | 5 |
| `CHARACTER_STYLE_MAP` | `10-random-pools.js` | 36 |
| `BACKGROUND_STYLE_MAP` | `10-random-pools.js` | 50 |
| `DROPDOWN_OPTIONS` | `15-style-descriptor-maps.js` | combines all above |

### Studio Maps (Narrative / Mood / Visual)

| Export | ไฟล์ | keys ≈ |
|--------|------|--------|
| `narrativeMap` | `11-studio-maps.js` | 40 |
| `moodMap` | `11-studio-maps.js` | 8 |
| `visualMap` | `11-studio-maps.js` | 39 |
| `formatMap` | `11-studio-maps.js` | 5 |

### Character & Background Pools

| Export | ไฟล์ |
|--------|------|
| `RANDOM_CHARACTERS` (14 Pixar) | `10-random-pools.js` |
| `RANDOM_BACKGROUNDS` (50 entries) | `10-random-pools.js` |

### Policy & Compliance

| Export | ไฟล์ |
|--------|------|
| `FORBIDDEN_MARKETING_PHRASES` | `01-forbidden-marketing-phrases.js` |
| `GOOGLE_FLOW_HARD_BAN` | `04-google-flow-policy.js` |
| `GOOGLE_FLOW_WORD_REPLACEMENTS` | `04-google-flow-policy.js` |
| `AUDIO_SAFE_REPLACEMENTS` | `04-google-flow-policy.js` |
| `sanitizePromptForFlow(text)` | `04-google-flow-policy.js` |
| `BODY_DESC_SAFE_REWRITES` | `03-body-desc-safe-rewrites.js` |
| `sanitizeCharacterDesc(desc)` | `03-body-desc-safe-rewrites.js` |
| `GEMINI_SCREENER_SYSTEM` | `05-prompt-screening-spec.js` |
| `PROMPT_CHECKER_MODES` | `05-prompt-screening-spec.js` |
| `shouldSkipGeminiCompliance()` | `05-prompt-screening-spec.js` |

### UI Copy

| Export | ไฟล์ |
|--------|------|
| `TOAST_MESSAGES` | `06-ui-copy.js` |
| `STATUS_MESSAGES` | `06-ui-copy.js` |
| `ERROR_MESSAGES` | `06-ui-copy.js` |
| `BUTTON_LABELS` | `06-ui-copy.js` |
| `FEATURE_TABS` | `06-ui-copy.js` |
| `UI_COPY_EXTENDED` | `06-ui-copy.js` |
| `CONFIRM_COPY` | `06-ui-copy.js` |

### V2 Prompts (Product Showcase / Unboxing)

| Export | ไฟล์ |
|--------|------|
| `buildV2ImagePrompt(item, s)` | `09-v2-prompts.js` |
| `buildV2VideoPrompt(item, s)` | `09-v2-prompts.js` |
| `buildV2ExtendPrompt(item, s)` | `09-v2-prompts.js` |
| `getV2TemplateSettings()` | `09-v2-prompts.js` |

### Data Contracts (Validation)

| Export | ไฟล์ |
|--------|------|
| `VALID_VIDEO_STYLES`, `VALID_CHARACTERS`, ... | `contracts.js` |
| `safeGetMap(mapName, key)` | `contracts.js` |
| `getStyleLabel(field, value)` | `contracts.js` |
| `sanitizeItemStyles(item)` | `contracts.js` |
| `isValidKey(mapName, key)` | `contracts.js` |

---

## โครงสร้างไฟล์

```
CONTENT_CORE/
├── index.js                      ← Barrel: import ทุกอย่างจากนี่
├── contracts.js                  ← Valid keys + safe accessors
├── INDEX.md                      ← ไฟล์นี้
│
├── 01-forbidden-marketing-phrases.js
├── 02-master-prompt-template.js  ← Full (142K) — reference
│   ├── 02a-director-prompt.js    ← Split: ADAPTIVE_VIDEO_DIRECTOR_PROMPT only
│   ├── 02b-hook-library.js       ← Split: HOOK_LIBRARY + HOOK_CATEGORIES
│   ├── 02c-visual-styles.js      ← Split: VISUAL_STYLES + SCENE_TEMPLATES + TONES
│   └── 02d-tones-modes.js        ← Split: PROMPT_MODES + FILM_MODES + enforcement
│
├── 03-body-desc-safe-rewrites.js
├── 04-google-flow-policy.js
├── 05-prompt-screening-spec.js
├── 06-ui-copy.js                 ← Full (131K) — reference
│
├── 07-storymode-prompts.js
├── 08-visual-style-templates.js
├── 09-v2-prompts.js
├── 10-random-pools.js
├── 11-studio-maps.js
├── 12-hook-master.js
├── 13-image-video-prompt-templates.js
├── 14-content-gen-prompts.js
└── 15-style-descriptor-maps.js
```

---

## ถ้าแก้ไฟล์ไหน → ต้องตรวจที่ไหนด้วย

| แก้ | ตรวจ |
|-----|------|
| `VIDEO_STYLE_MAP` (15) | `buildImagePrompt()` (14), `DROPDOWN_OPTIONS` (15) |
| `HOOK_LIBRARY` (02b) | `buildHookMasterPrompt()` (12) |
| `FORBIDDEN_MARKETING_PHRASES` (01) | `05-prompt-screening-spec.js` import |
| `BACKGROUND_STYLE_MAP` (10) | `buildImagePrompt()` (14), `VALID_BACKGROUNDS` (contracts) |
| `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` (02a) | `getEnhancedPrompt()` (12) |
