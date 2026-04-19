# Content Stub Recommendations
Generated: 2026-04-16
Source: Hunt agents H1–H6 across extension codebase

---

## 1. buildHookMasterPrompt + HOOK_MASTER_SECTION + getEnhancedPrompt

### What was found

- **`buildHookMasterPrompt(overrideCat, usedHookIds)`** and **`getEnhancedPrompt(overrideHookCat, usedHookIds)`** are stubs at `sidepanel.js` lines 1–24 — both return `''`.
- **`HOOK_MASTER_SECTION`** is a constant also set to `''`.
- **`promptTemplate.js`** (shipped extension) exports `HOOK_LIBRARY = {}` and `HOOK_CATEGORIES = {}` — empty placeholders.
- **Full content** lives in `CONTENT_CORE/02-master-prompt-template.js` (`ADAPTIVE_VIDEO_DIRECTOR_PROMPT`, lines 104–126): 200 hooks in 4 psychology buckets — **FOMO (1–50)**, **Authentic (51–100)**, **Scarcity & Obsession (101–150)**, **Curiosity (151–200)**.
- **`promptTemplate.original.js`** contains the full `HOOK_LIBRARY` with `{ id, cat, ... }` structure.
- **`HOOK_CATEGORY_MAP`** at `sidepanel.js` 935–941 maps selectors `auto | FOMO | AUTHENTIC | OBSESSION | CURIOSITY`.
- `CONTENT_PROMPT_*` templates require `hookId` as a numeric field in the JSON response.

### How it's used (call sites)

| Call Site | Lines | Role | Arguments |
|-----------|-------|------|-----------|
| Single-item content gen | 4333–4339 | `system` for `callAPI` | `HOOK_MASTER_SECTION + buildHookMasterPrompt(item.hookCategory)` (no `usedHookIds`) |
| Batch autopost gen | 4813–4821 | `system` for `callAPI` | `HOOK_MASTER_SECTION + buildHookMasterPrompt(item.hookCategory, batchUsedHookIds)` |
| Quick action handler | 5184–5187 | `system` for `callAPI` | `getEnhancedPrompt(item.hookCategory)` |
| Studio master prompt | 11556–11560 | `system` for `callAPI` | `getEnhancedPrompt()` (no args) — then result feeds `parseScenesToCards` |

### Recommendation

#### `HOOK_MASTER_SECTION` (stable prefix string)

```
You are a TikTok Shop hook-and-speech director for the Thai e-commerce market.
Your role is to select or compose a psychologically resonant OPENING HOOK that
hooks the viewer in the first 1–2 seconds of the video. Hooks are drawn from a
200-entry Hook Library categorized into 4 buckets by psychological angle.

Policy:
- Hooks appear ONLY in spoken dialogue (Scene 1 / opening speech). Do NOT embed
  hook instructions into image/video prompts.
- The `hookId` you return must be an integer 1–200 corresponding to the Hook Library.
- Adapt the hook to the specific product and its highlights — do not use a generic sentence.
- Keep all output aligned with TikTok Shop safety guidelines: no false medical claims,
  no guarantee language, no competitor attacks.
- Language: speech lines in Thai; all other fields as per the content template.
```

#### `buildHookMasterPrompt(overrideCat, usedHookIds)` — proposed return value

```js
function buildHookMasterPrompt(overrideCat, usedHookIds) {
  const catMap = {
    auto:       { label: 'AI selects best fit',            range: '1–200' },
    FOMO:       { label: 'Fear Of Missing Out',            range: '1–50'  },
    AUTHENTIC:  { label: 'Authentic / Real-person review', range: '51–100'},
    OBSESSION:  { label: 'Scarcity & Obsession',           range: '101–150'},
    CURIOSITY:  { label: 'Curiosity / Pattern interrupt',  range: '151–200'},
  };
  const cat = catMap[overrideCat] || catMap['auto'];

  let prompt = `
## HOOK MASTER INSTRUCTIONS
Hook Category: ${cat.label} (ID range ${cat.range})
`;

  if (overrideCat && overrideCat !== 'auto') {
    prompt += `
Restrict hookId to the range ${cat.range}. The opening speech MUST reflect the
"${cat.label}" psychological angle. Viewers in this category respond to: `;
    if (overrideCat === 'FOMO')      prompt += `urgency, limited availability, "everyone else is buying this".`;
    if (overrideCat === 'AUTHENTIC') prompt += `real testimonials, before/after feeling, relatable everyday struggle solved.`;
    if (overrideCat === 'OBSESSION') prompt += `exclusive scarcity, cult-product feeling, "can't stop using it".`;
    if (overrideCat === 'CURIOSITY') prompt += `surprising fact, pattern interrupt, "you won't believe what this does".`;
  } else {
    prompt += `
Infer the best hook category from the product name and highlights provided.
Select a hookId that best matches the product's appeal.`;
  }

  if (Array.isArray(usedHookIds) && usedHookIds.length > 0) {
    prompt += `

BATCH DEDUPLICATION: The following hookIds have already been used in this batch —
do NOT repeat them: [${usedHookIds.join(', ')}].
Choose a different ID so each product in this batch has a unique hook angle.`;
  }

  prompt += `

OUTPUT CONTRACT:
- "hookId": integer ${cat.range}
- "speech" (Scene 1 opening line): Thai, ≤15 words, embeds the hook psychologically
- Do not place the hook in any other field
`;
  return prompt;
}
```

#### `getEnhancedPrompt(overrideHookCat, usedHookIds)` — two behaviors

**With `item.hookCategory` (quick-action / tool call):**
Return `HOOK_MASTER_SECTION + buildHookMasterPrompt(overrideHookCat, usedHookIds)` — lightweight hook-biased system prompt for single-field generation tasks.

**With no args (Studio master prompt generation, line 11558):**
Return the full `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` from `CONTENT_CORE/02-master-prompt-template.js` concatenated with `HOOK_MASTER_SECTION`. This is the rich Creative Director prompt that drives `parseScenesToCards` output (Storymode `=== SCENE N ===` / code-block format, Thai dialogue, VIRAL CAPTION rules, etc.).

```js
function getEnhancedPrompt(overrideHookCat, usedHookIds) {
  if (!overrideHookCat) {
    // Studio / full Storymode path — return the full director + hook master
    return ADAPTIVE_VIDEO_DIRECTOR_PROMPT + '\n\n' + HOOK_MASTER_SECTION;
  }
  // Quick action / per-item path — hook bias only
  return HOOK_MASTER_SECTION + buildHookMasterPrompt(overrideHookCat, usedHookIds);
}
```

---

## 2. RANDOM_CHARACTERS pool

### What was found

- Defined at `sidepanel.js` ~4128: `const RANDOM_CHARACTERS = [{ desc: '', gender: 'female' }]` with `// TODO: USER_PROMPT`.
- Used in **single-item** (4126–4188) and **batch** (4686–4740) flows when `CHARACTER_STYLE_MAP[item.character]` is `'AI เลือกให้อัตโนมัติ'` and no `item.characterImage` is provided.
- `charPool` is optionally **filtered by `productGender`** (detected from product name), so the pool must contain **both genders** in sufficient quantity.
- The selected `char.desc` becomes `characterDesc` → `item.generatedCharacter` → `[CHARACTER_PLACEHOLDER]` in `buildImagePrompt` for `ai_auto` mode.
- `PIXAR_3D_CHARACTERS` (lines 708–723, 14 entries) provides the structural template: `{ id, desc, gender, personality, bestFor }`. Current code only reads `desc` and `gender`.
- `CONTENT_CORE/02-master-prompt-template.js` rule 10 ("DEFAULT THAI CHARACTER LOCK"): without a ref image, humans should read as Thai in prompts.
- `CHARACTER_STYLE_MAP` keys define 20 archetypes (sweet reviewer female, confident seller male, expert professional, friendly best friend, young energetic creator, calm minimal host, luxury brand owner, tech geek, funny entertainer, news anchor, caring mom reviewer, fitness coach, beauty guru, corporate CEO, lifestyle vlogger, street interview host, luxury model, calm storyteller, hardcore sales closer, futuristic AI avatar).

### Recommended entries (12 characters — both genders, Thai appearance, archetypes aligned to `CHARACTER_STYLE_MAP`)

```js
const RANDOM_CHARACTERS = [
  // Female
  { desc: 'Young Thai woman in her mid-20s, warm friendly smile, natural makeup, casual trendy outfit — pastel top, light jeans — authentic UGC creator vibe, realistic studio photography', gender: 'female' },
  { desc: 'Thai beauty enthusiast woman, late 20s, soft glam makeup with dewy skin, pastel coordinated outfit, polished and approachable, beauty-review lighting, realistic photography', gender: 'female' },
  { desc: 'Thai mother figure in her early 40s, gentle caring expression, minimal makeup, comfortable home-friendly blouse, trustworthy and warm reviewer energy, realistic photography', gender: 'female' },
  { desc: 'Thai female lifestyle vlogger, 25–30, relaxed casual aesthetic, colorful layered accessories, coffee in hand, bright natural daylight background, realistic photography', gender: 'female' },
  { desc: 'Thai luxury model, late 20s, understated elegant makeup, silk blouse, pearl accessories, premium brand look, soft studio lighting with neutral backdrop, realistic photography', gender: 'female' },
  { desc: 'Thai young female creator, early 20s, playful energetic expression, trendy Y2K-influenced streetwear, vibrant background, selfie-style UGC framing, realistic photography', gender: 'female' },

  // Male
  { desc: 'Thai man in his late 20s, confident friendly smile, neat casual shirt open collar, product presenter energy, clean modern background, realistic photography', gender: 'male' },
  { desc: 'Thai fitness coach man, 30s, athletic build, fitted sportswear, motivating thumbs-up expression, bright gym or outdoor setting, realistic photography', gender: 'male' },
  { desc: 'Thai tech professional man, late 20s, smart casual — button shirt + slim chinos — wire-frame glasses optional, calm authoritative tone, minimal modern office behind, realistic photography', gender: 'male' },
  { desc: 'Thai corporate professional man, 35–45, well-groomed, business casual blazer, leadership presence, neutral premium studio backdrop, realistic photography', gender: 'male' },
  { desc: 'Thai street-style male creator, early 20s, streetwear hoodie and cap, expressive energetic pose, urban environment, realistic photography', gender: 'male' },
  { desc: 'Thai male lifestyle host, late 20s, relaxed linen shirt, easy-going charismatic smile, café or home-office environment softly blurred behind, realistic photography', gender: 'male' },
];
```

> **Note:** Keep at least 5–6 entries per gender. The `productGender` filter can otherwise collapse the pool to a single entry, which removes all randomization.

---

## 3. GEMINI_SCREENER_SYSTEM + PROMPT_CHECKER_MODES

### What was found

**`prompt-screening.js`** (shipped extension):
- `GEMINI_SCREENER_SYSTEM = ''` (empty string stub)
- `VIOLENCE_AND_UNSAFE_EN = []`, `RISK_SNIPPETS = []`, `HARD_BAN_REGEXES = []` — all empty
- All screening functions (`geminiComplianceSanitize`, `screenPromptForOutbound`, `screenChatMessages`) return inputs unchanged
- `localScreenText` is identity; `stripHardBannedPhrases` is a no-op

**`CONTENT_CORE/05-prompt-screening-spec.js`** (canonical):
- `VIOLENCE_AND_UNSAFE_EN` — filled word list (violence/drugs/sexual/vulgar + yourshop variants)
- `RISK_SNIPPETS` — RegExp patterns for health claims, superlatives, "FDA approved", Thai marketing phrases
- `HARD_BAN_REGEXES` — `[...GOOGLE_FLOW_HARD_BAN, ...BODY_DESC_HARD_REMOVE]` (populated via `04-google-flow-policy.js` and `03-body-desc-safe-rewrites.js`)
- `GEMINI_SCREENER_SYSTEM` is explicitly **not defined** in `05`

**`sidepanel.js` call chain:** `fetchGeminiWithFallback` → `applyLocalScreenToGeminiRequestBody` (identity), `callAPI` → `screenChatMessages` (passthrough), `enhancePromptWithGemini` → `screenPromptForOutbound` (passthrough), `generateVideoWithVeo3` → `screenPromptForOutbound` (passthrough), `preFlightPolicyScreen` → returns `prompt || ''` (no sanitization), `checkScriptPolicy` → builds `checkerMode.prompt + script + JSON instruction`.

### PROMPT_CHECKER_MODES full object (from `sidepanel.js` 1601–1621)

```js
const PROMPT_CHECKER_MODES = {
  strict: {
    name: 'Strict TikTok Shop',
    description: 'ตรวจสอบตามนโยบาย TikTok Shop อย่างเข้มงวด',
    prompt: ''   // TODO — see recommendation below
  },
  balanced: {
    name: 'Balanced (Social + TikTok)',
    description: 'ตรวจสอบทั้ง TikTok Shop และ Social Media ทั่วไป',
    prompt: ''   // TODO
  },
  conversion: {
    name: 'Conversion-Safe',
    description: 'ปลอดภัยแต่ยังคงพลังการขาย',
    prompt: ''   // TODO
  },
  thai: {
    name: 'Thai Market Safe',
    description: 'ตรวจสอบตามกฎหมายไทยและ TikTok Thailand',
    prompt: ''   // TODO
  }
};
```

Also: `PROMPT_CHECKER_TEMPLATE = ''` (line 1597) — currently unused base template.

### Recommendation for GEMINI_SCREENER_SYSTEM content

```
You are a compliance sanitizer for TikTok Shop and Google Imagen/Flow content.
You receive a text prompt or script snippet that will be used in an advertising video.

Your job:
1. Detect and REMOVE or REWRITE any content that violates the following policies:
   - Violence, gore, self-harm, dangerous acts
   - Sexual or explicit content of any kind
   - Drug references, controlled substances
   - Vulgar language or hate speech
   - Prohibited health/medical claims: "cures", "treats", "FDA approved", clinical guarantees
   - Weight-loss absolute claims: "lose X kg in N days"
   - Competitor attacks or false comparisons
   - Misleading superlatives: "best in the world", "guaranteed results"
   - TikTok Shop forbidden phrases (yourshop policy violations)
2. PRESERVE commercial intent: keep product names, benefits, CTAs, pricing, and emotional appeal where they do not violate policy.
3. Handle Thai and English mixed text. Apply rules to both languages equally.
4. Do NOT add new promotional claims or embellish the content.

Output format — return ONLY valid JSON, no markdown:
{"sanitized": "<cleaned text>", "changed": true|false, "flags": ["<reason1>", ...]}

If nothing needs changing, return {"sanitized": "<original text>", "changed": false, "flags": []}.
```

### Recommended `PROMPT_CHECKER_MODES[x].prompt` values

**`strict.prompt`:**
```
You are a STRICT TikTok Shop policy reviewer. Your task is to check an ad script for
policy violations and return a structured JSON audit.

Flag and recommend REJECTION or REWRITE for ANY of the following:
- Medical/health claims (cures, treats, clinically proven, before/after guarantees)
- Weight-loss specific claims (lose X kg, guaranteed slim, fat burner)
- Competitor attacks or brand comparisons
- Fake social proof (fabricated reviews, inflated numbers)
- Targeting minors or implying adult content
- Dangerous product instructions
- Prohibited categories: alcohol, tobacco, prescription-only items

Output ONLY valid JSON:
{"verdict": "pass"|"rewrite"|"reject", "issues": [{"phrase": "...", "rule": "...", "suggestion": "..."}], "rewritten_script": "<full rewrite if verdict=rewrite, else null>"}
```

**`balanced.prompt`:**
```
You are a BALANCED policy reviewer for TikTok Shop and general social media.
Apply TikTok Shop prohibited-claims rules but allow standard social media CTAs,
emotional benefit language, and lifestyle framing if not deceptive.

Distinguish:
- BLOCK: medical guarantees, false numbers, competitor attacks, dangerous instructions
- ALLOW: "feel amazing", "love this product", "limited stock", emotional testimonial language,
  standard urgency CTAs

Output ONLY valid JSON:
{"verdict": "pass"|"rewrite"|"reject", "issues": [{"phrase": "...", "rule": "...", "suggestion": "..."}], "rewritten_script": "<full rewrite if verdict=rewrite, else null>"}
```

**`conversion.prompt`:**
```
You are a CONVERSION-SAFE reviewer. Preserve as much persuasive and sales power as possible.
Only flag content that is HIGH RISK (definite policy violation likely to cause account strike).

Keep: hooks, CTAs, urgency language, emotional benefits, product positioning.
Flag only: direct medical cure claims, illegal guarantees, clearly banned phrases.
Prefer REWRITE over REJECT — suggest minimal edits that maintain selling power.

Output ONLY valid JSON:
{"verdict": "pass"|"rewrite"|"reject", "issues": [{"phrase": "...", "rule": "...", "suggestion": "..."}], "rewritten_script": "<full rewrite if verdict=rewrite, else null>"}
```

**`thai.prompt`:**
```
You are a THAI MARKET policy reviewer. Apply Thai legal standards AND TikTok Thailand policy.

Flag specifically:
- Thai FDA/อย claims: ผ่านการรับรอง, อย. เลขที่, วิตามินรักษา, สมุนไพรรักษาโรค
- Traditional medicine overclaims: แก้, บำบัด, รักษา + any disease name
- Thai financial claims: การันตีผลตอบแทน, รวยได้จริง
- Weight/beauty Thai phrasing: ผอม X กิโล, ขาวใน X วัน (with numeric guarantee)
- Thai defamation risk: โจมตีคู่แข่ง, เปรียบเทียบ
- Alcohol promotion rules (พ.ร.บ. เครื่องดื่มแอลกอฮอล์)
- Criminal liability phrases under Thai Consumer Protection Act

Output ONLY valid JSON:
{"verdict": "pass"|"rewrite"|"reject", "issues": [{"phrase": "...", "rule": "...", "suggestion": "..."}], "rewritten_script": "<full rewrite if verdict=rewrite, else null>"}
```

---

## 4. Studio Maps (formatMap / narrativeMap / moodMap / visualMap)

### Full maps with all keys (as found in `sidepanel.js` ~11372–11479)

All four maps are defined with empty string values. Keys reproduced in full:

```
formatMap: ugc | podcast | review | tutorial | cinematic

narrativeMap (40 keys): veggie_gangster | organ_tough_love | appliance_life |
  politics_satire | money_wallet | ghost_shrine | land_house | package_sad |
  lucky_charm | skincare_cream | inner_voice | alarm_clock | computer_office |
  coffee_milk_tea | energy_bar | pet_gossip | plant_talk | shoes_passport |
  dating_app | closet_clothes | de_influencer | fortune_teller | asmr_seller |
  over_sharer | main_character | investigator | isan_joy | southern_direct |
  northern_chill | sassy_queen | gossiper | self_made | prankster_couple |
  underdog | voiceover_troll | fangirl | local_guru | mindset_coach |
  satirist | glutton

moodMap (8 keys): cinematic | dramatic | peaceful | energetic | romantic |
  mysterious | playful | professional

visualMap (40 keys): cinematic | disney | ghibli | claymation | amigurumi |
  plushie | paper_cutout | dragonball | 90s_anime | gta_style | watercolor |
  chalk_art | oil_painting | pop_art | pixel_art | cyberpunk | vector_flat |
  lego_style | vaporwave | emoji_style | mute_earth | mutelu_mystical |
  thai_street | rainy_lonely | thai_vintage | y2k_pop | vivid_summer |
  rich_flex | local_homey | surreal_comedy | ugc_raw | fisheye | bodycam_pov |
  hyper_macro | glitch | old_money | lofi_chill | liminal_space | cottagecore | paparazzi
```

### Recommended values for each key

> **Implementation note:** `narrativeMap[id]` is inserted into the user message as `/ Style: a+b+...` — model sees these strings directly. `moodMap[id]` → `/ Mood: ...`, `visualMap[id]` → `/ Visual: ...`. `formatMap` is currently **unused** in code but should be wired after filling.

#### `formatMap`

```js
const formatMap = {
  ugc:        'Authentic handheld UGC review — real-person feel, casual handheld camera, talking-to-phone energy',
  podcast:    'Conversational podcast / monologue — relaxed host delivery, interview-style pacing, warm intimate tone',
  review:     'Experience-first product review arc — personal story, problem → discovery → transformation structure',
  tutorial:   'Step-by-step tutorial demo — clear numbered instructions, close-up product use, helpful explainer tone',
  cinematic:  'Cinematic filmic pacing — wide establishing shot, dramatic coverage, emotional scored atmosphere',
};
```

#### `moodMap`

```js
const moodMap = {
  cinematic:    'Cinematic Standard — neutral film tone, balanced exposure, composed framing',
  dramatic:     'Dramatic & Intense — high contrast, deep shadows, emotional tension',
  peaceful:     'Peaceful & Calm — soft natural light, slow pace, airy tranquil atmosphere',
  energetic:    'High Energy & Dynamic — fast cuts feel, vibrant color, movement and excitement',
  romantic:     'Romantic & Warm — golden-hour glow, soft bokeh, intimate and tender',
  mysterious:   'Mysterious & Moody — low key lighting, cool desaturated palette, suspense undertone',
  playful:      'Playful & Fun — bright punchy colors, upbeat whimsical energy, lighthearted',
  professional: 'Professional & Clean — crisp neutral palette, structured composition, corporate clarity',
};
```

#### `narrativeMap` (40 entries — Thai persona name + English premise for LLM)

```js
const narrativeMap = {
  veggie_gangster:    'Talking-vegetable gangsters — sassy Thai veggies nag viewers about diet and health (UGC comedy)',
  organ_tough_love:   'Internal organs giving tough-love lectures — body parts complain about bad habits (health comedy)',
  appliance_life:     'Home appliances living secret lives — fridge, washing machine gossip about their owner (object POV comedy)',
  politics_satire:    'Political satire angle — product debate framed as election campaign (Thai political parody)',
  money_wallet:       'Wallet/money perspective — coins and bills argue about being spent on this product (financial comedy)',
  ghost_shrine:       'Spirit house / ancestor ghost endorsement — Thai ghost blesses the product (supernatural comedy)',
  land_house:         'Real estate / property drama — product as investment or home upgrade (lifestyle drama)',
  package_sad:        'Sad packaging waiting to be chosen — lonely products on shelf longing for a buyer (emotional comedy)',
  lucky_charm:        'Lucky charm / amulet angle — product framed as a fortune-bringer (Thai superstition comedy)',
  skincare_cream:     'Skincare product speaks — cream talks about its ingredients and mission (beauty monologue)',
  inner_voice:        'Inner voice narration — character's honest inner thoughts contrasting polite outer speech (internal monologue)',
  alarm_clock:        'Alarm clock POV — morning routine story starting from the alarm, product is the hero (morning UGC)',
  computer_office:    'Office computer drama — work stress, keyboard, screen characters react to product (office comedy)',
  coffee_milk_tea:    'Coffee vs milk tea rivalry — drinks debate which pairs best with the product (beverage comedy)',
  energy_bar:         'Energy bar / snack pep talk — product as athlete coach giving motivational speech (sports comedy)',
  pet_gossip:         'Pet gossiping about owner — cat or dog narrates owner's product obsession (pet POV comedy)',
  plant_talk:         'House plants judging owner — succulents and plants comment on lifestyle (plant POV comedy)',
  shoes_passport:     'Shoes and passport arguing — footwear and travel docs debate next adventure (travel comedy)',
  dating_app:         'Dating app profile for the product — swipe-right moment, product sells itself like a date (romance parody)',
  closet_clothes:     'Clothes in the wardrobe staging a protest — outfits demand to be worn (fashion comedy)',
  de_influencer:      'De-influencer / anti-haul angle — honest "don't buy this unless…" reverse psychology hook',
  fortune_teller:     'Fortune teller predicts your life improves with this product — mystical Thai tarot framing',
  asmr_seller:        'ASMR-style product showcase — whispered close-up sensory selling, no hard sell',
  over_sharer:        'TMI oversharer — character reveals way too much personal context while recommending the product',
  main_character:     'Main character energy — user is the protagonist of their own movie; product is the plot device',
  investigator:       'Detective / investigator uncovers why this product is worth it — mystery reveal structure',
  isan_joy:           'Isan dialect and joy — northeast Thai warmth and humor, direct cheerful Isan personality',
  southern_direct:    'Southern Thai directness — straight-talking southern accent, no-nonsense honest review',
  northern_chill:     'Northern Thai chill (สำเนียงเหนือ) — gentle Lanna vibe, calm measured pace, wholesome tone',
  sassy_queen:        'Sassy queen energy — confident, unbothered, reads the product like a runway critique',
  gossiper:           'Village gossip style — ขี้นินทา character spills product "tea" like neighborhood gossip',
  self_made:          'Self-made hustle story — rags-to-results narrative, product as the turning point',
  prankster_couple:   'Couple prank / challenge — one partner tricks the other into trying the product (couple comedy)',
  underdog:           'Underdog comeback — humble product nobody believed in that changed everything (emotional arc)',
  voiceover_troll:    'Troll voiceover — documentary-serious narration over absurdly mundane product moment (deadpan comedy)',
  fangirl:            'Fangirl / fanboy obsession — unhinged fan energy treating product like a celebrity',
  local_guru:         'Local neighborhood guru — wise elder figure from the community endorses (community trust)',
  mindset_coach:      'Mindset coach reframes product as self-improvement — motivational speaker energy',
  satirist:           'Thai social satirist — sharp wit commenting on consumer culture while selling the product',
  glutton:            'Glutton / foodie extreme — maximum enthusiasm, sensory overload description (food/FMCG)',
};
```

#### `visualMap`

> **Source:** Use the strings from `getSelectedVisualStyleDescription()` (`sidepanel.js` ~11950–12008) which already has English descriptions for these exact IDs. Below are aligned values:

```js
const visualMap = {
  cinematic:      'Cinematic live-action, film grain, natural color grading, realistic depth of field',
  disney:         'Disney 3D animation style, expressive characters, warm saturated palette, family-friendly render',
  ghibli:         'Studio Ghibli hand-drawn animation, painterly backgrounds, soft muted tones, whimsical detail',
  claymation:     'Claymation / stop-motion, clay texture, handmade imperfection, tactile warm aesthetic',
  amigurumi:      'Amigurumi crochet doll style, cute yarn texture, soft rounded shapes, pastel tones',
  plushie:        'Plush toy / stuffed animal render, fabric texture, chubby proportions, cozy soft aesthetic',
  paper_cutout:   'Paper cut-out flat collage, layered paper depth, clean graphic silhouettes, handcraft feel',
  dragonball:     'Dragon Ball Z anime style, bold outlines, dynamic action poses, vibrant energy effects',
  '90s_anime':    '1990s anime cel-shaded style, visible line art, flat color fills, classic retro aesthetic',
  gta_style:      'GTA / Rockstar Games loading screen art style, bold graphic poster illustration',
  watercolor:     'Watercolor painting, soft wet-on-wet edges, translucent layered washes, artistic mood',
  chalk_art:      'Chalk art on blackboard, white and pastel chalk lines, textured board background',
  oil_painting:   'Oil painting, thick impasto brushstrokes, rich saturated color, classical portrait quality',
  pop_art:        'Pop Art / Roy Lichtenstein style, halftone dots, primary colors, bold black outlines, comic feel',
  pixel_art:      'Pixel art / retro 8-bit or 16-bit sprite style, blocky pixels, limited color palette',
  cyberpunk:      'Cyberpunk neon-noir, rain-slicked streets, holographic signage, deep blue/magenta palette',
  vector_flat:    'Flat vector illustration, clean geometric shapes, minimal shadows, modern infographic aesthetic',
  lego_style:     'LEGO brick construction style, plastic stud texture, primary colors, toy-block world',
  vaporwave:      'Vaporwave aesthetic, pastel purple/pink/cyan, retro 80s grid, glitch elements, lo-fi nostalgia',
  emoji_style:    'Emoji / sticker flat art, bold outlines, bright solid fills, expressive cartoon faces',
  mute_earth:     'Muted earth tones, warm terracotta and sage, organic textures, calm sustainable aesthetic',
  mutelu_mystical: 'Thai mystical / mutelu amulet aesthetic, gold sacred geometry, red satin, candlelight glow',
  thai_street:    'Thai street photography style, vibrant market colors, natural Bangkok light, gritty real texture',
  rainy_lonely:   'Rainy melancholic mood, wet glass bokeh, cool blue-grey palette, lonely cinematic atmosphere',
  thai_vintage:   'Thai vintage / retro poster style, aged paper texture, classic Thai typography aesthetic',
  y2k_pop:        'Y2K pop aesthetic, chrome text, butterfly clips, bubblegum pink, early 2000s digital gloss',
  vivid_summer:   'Vivid saturated summer, tropical colors, high-key sunlight, energetic joyful outdoor feel',
  rich_flex:      'Luxury / rich flex aesthetic, gold accents, dark marble, premium packaging showcase',
  local_homey:    'Local Thai homey feel, warm home environment, family-friendly, approachable community warmth',
  surreal_comedy: 'Surreal absurdist comedy, unexpected scale changes, dream logic, deadpan bizarre scenarios',
  ugc_raw:        'Raw authentic UGC, handheld shaky cam, available light, real-person no-filter aesthetic',
  fisheye:        'Fisheye / ultra-wide lens distortion, barrel curve, immersive wide perspective',
  bodycam_pov:    'Body cam POV, first-person perspective, realistic handheld motion, documentary authenticity',
  hyper_macro:    'Hyper macro close-up, extreme product detail, razor-thin depth of field, textural focus',
  glitch:         'Digital glitch art, RGB split, scan lines, corrupted pixel artifacts, electronic distortion',
  old_money:      'Old money / quiet luxury, understated neutral palette, heritage materials, classic elegance',
  lofi_chill:     'Lo-fi chill aesthetic, grainy film look, warm amber tones, cozy soft focus, relaxed pace',
  liminal_space:  'Liminal space eerie calm, empty transitional environments, fluorescent light, uncanny quiet',
  cottagecore:    'Cottagecore, floral meadow setting, linen and wicker textures, pastoral soft-light nostalgia',
  paparazzi:      'Paparazzi / tabloid candid style, flash photography look, celebrity-caught-off-guard energy',
};
```

---

## 5. systemPrompt in generateScenesFromMasterPrompt

### How the AI call is structured

`generateScenesFromMasterPrompt` is the **fallback** that fires when the primary `parseScenesToCards` step yields no scenes. It makes a second AI call:

- **Google (Gemini):** `systemPrompt` is **concatenated** with master text: `systemPrompt + '\n\nMaster Prompt:\n' + studioMasterPrompt` → passed as one text block inside `buildStudioGeminiParts`. `styleContext` inside that helper is currently forced to `''`.
- **OpenAI-style:** Classic roles: `{ role: 'system', content: systemPrompt }` + `{ role: 'user', content: 'Master Prompt:\n' + studioMasterPrompt }`.

**Expected output:** The parser does `text.match(/\[[\s\S]*\]/)` + `JSON.parse` — a **JSON array**. Each object is mapped to `{ imagePrompt: s.imagePrompt || s.prompt, videoPrompt: s.videoPrompt }`. No `=== SCENE ===` or code blocks.

**Call site:** Only inside `generateStudioMasterPrompt` as fallback (lines 11589–11704):
```js
} else {
  await generateScenesFromMasterPrompt();  // called if parseScenesToCards yields 0 scenes
}
if (studioScenes.length === 0) {
  await generateScenesFromMasterPrompt();  // second fallback
}
```

**Important:** Do NOT reuse `getStorymodeSystemPromptForGenerate()` here — it mandates Storymode text+code-block format which is incompatible with the JSON array parser.

### Recommendation

`systemPrompt` for this function should be a **short, strict JSON director**:

```
You are a creative director converting an existing video Master Prompt into
production-ready scene prompts.

TASK:
Read the Master Prompt provided in the user message and expand it into exactly
{studioSceneCount} distinct scenes. You must output ONLY a valid JSON array —
no markdown, no code fences, no explanation text outside the array.

OUTPUT SCHEMA (one object per scene):
[
  {
    "imagePrompt": "<English Imagen/Flux-ready visual description for this scene>",
    "videoPrompt": "<English stage direction + AUDIO: Thai language voice only. Natural Thai pronunciation. No English. No subtitles.>"
  },
  ...
]

RULES:
1. Produce EXACTLY {studioSceneCount} objects. Never fewer.
2. imagePrompt: English only. Include visual style from the Master Prompt if specified.
   Add: "photorealistic" or the named render style, product clearly visible, no watermarks,
   no on-screen text overlays, no subtitles.
3. videoPrompt: English stage direction describing motion/action, then end with:
   "AUDIO: Thai language voice only. Natural Thai pronunciation. No English. No subtitles."
4. If the Master Prompt includes a character description, embed it in each scene's imagePrompt.
5. If a product image was provided, reference the product as shown in the attached image.
6. Each scene must advance the narrative or showcase a distinct product angle.
7. Return ONLY the JSON array. No other text.
```

> **Implementation:** `studioSceneCount` must be interpolated at call time. The string can be built as a template literal or by replacing a placeholder. The `styleContext` variable in `buildStudioGeminiParts` should also be filled with the visual style description (from `getSelectedVisualStyleDescription(studioSelectedVisual)`) so Gemini receives it on the parts level.

---

## 6. RANDOM_BACKGROUNDS pool

### BACKGROUND_STYLE_MAP found (from `sidepanel.js` 610–661)

```
ai_auto → AI เลือกให้อัตโนมัติ
white_studio → สตูดิโอขาว - มืออาชีพ
home_living_room → ห้องนั่งเล่น - อบอุ่น
modern_office → ออฟฟิศทันสมัย - น่าเชื่อถือ
luxury_black_gold → ดำทอง - หรูหรา
soft_pastel → พาสเทลนุ่มนวล
tech_digital → เทคโนโลยี - นีออน
cafe_korean → คาเฟ่เกาหลี - อบอุ่น
minimal_dark → มินิมอลมืด - ซีนีมาติก
nature_outdoor → กลางแจ้ง - ธรรมชาติ
bedroom_cozy → ห้องนอน - ผ่อนคลาย
neon_studio → สตูดิโอนีออน - สีสัน
retail_store → ร้านค้า - แสดงสินค้า
kitchen_home → ห้องครัว - ใช้งานจริง
conference_room → ห้องประชุม - ธุรกิจ
gradient_modern → ไล่สีทันสมัย
blur_bokeh → เบลอโบเก้ - เน้นสินค้า
futuristic_ai_room → ห้อง AI - ล้ำสมัย
mall_luxury → ห้างหรู - พรีเมียม
morning_sunlight → แสงเช้า - สดใส
night_cinematic → กลางคืน - ซีนีมาติก
living_room → ห้องนั่งเล่น - โซฟา
bedroom → ห้องนอน - สไตลิช
home_office → โฮมออฟฟิศ - โต๊ะทำงาน
desk_setup → โต๊ะคอม - เซ็ตอัพ
packing_corner → มุมแพ็คของ - แม่ค้าออนไลน์
kitchen → ห้องครัว - สะอาด
luxury_bathroom → ห้องน้ำหรู - จากุซซี่
condo_city_view → คอนโด - วิวเมือง
country_house → บ้านชนบท - สวน
cafe → คาเฟ่ - กาแฟ
restaurant → ร้านอาหาร - หรูหรา
hotel_lobby → ล็อบบี้โรงแรม - หรู
office → ออฟฟิศ - ทำงาน
car_interior → ในรถ - แดชบอร์ด
gas_station → ปั๊มน้ำมัน
flea_market → ตลาดนัด - สีสัน
city_street → ถนนในเมือง
bts_mrt → สถานี BTS/MRT
beach → ชายหาด - ทะเล
mountain_nature → ภูเขา - ธรรมชาติ
park → สวนสาธารณะ
christmas → ธีมคริสต์มาส
new_year → ธีมปีใหม่
chinese_new_year → ธีมตรุษจีน
valentine → ธีมวาเลนไทน์
songkran → ธีมสงกรานต์
halloween → ธีมฮาโลวีน
white_minimal → ขาวมินิมอล
studio_backdrop → สตูดิโอ - ฉากสีพื้น
```

### Recommended entries (12 backgrounds — English image-prompt ready)

```js
const RANDOM_BACKGROUNDS = [
  // Studio / neutral
  'Clean white cyclorama studio, soft even lighting, subtle floor reflection, professional product photography look',
  'Minimal dark cinematic backdrop, deep charcoal gradient, soft rim lighting from left, premium brand aesthetic',
  'Seamless pastel gradient — blush to cream — diffused softbox light, beauty and skincare product feel',
  'Modern gradient studio, warm amber to neutral white, subtle lens flare, polished commercial photography',

  // Interior / lifestyle
  'Cozy modern living room, warm tungsten accents, soft sofa and lush plants in background, shallow depth of field',
  'Bright contemporary home office desk setup, monitor and accessories softly blurred behind the subject',
  'Korean-style café interior, warm wood tones, hanging Edison bulbs, fairy light bokeh, latte on table',
  'Luxury hotel lobby, cream marble floors, tall arched windows, soft golden hour sunlight streaming in',

  // Outdoor / urban
  'Sunny outdoor city park, lush green canopy overhead, natural dappled sunlight, airy lifestyle feel',
  'Urban Bangkok street at dusk, warm city light bokeh, natural evening atmosphere, no trademarked signage',

  // Specialty
  'Neon-accent tech desk, cool blue and magenta LED highlights, dark background, futuristic clean setup',
  'Tropical beach boardwalk, golden late-afternoon sunlight, gentle ocean blur in background, fresh coastal mood',
];
```

> **Sync tip:** For a production-quality pool, map one English string per `BACKGROUND_STYLE_MAP` key (excluding `ai_auto`) so random picks mirror the named options. `SCENE_LOCATIONS[].prompt` strings from `CONTENT_CORE/02-master-prompt-template.js` can be sampled for variety (indoor_home, indoor_cafe, outdoor_nature, beach_tropical, etc.).

---

## Priority Summary

| Stub | Difficulty | Impact | Recommended Action |
|------|-----------|--------|-------------------|
| **1. buildHookMasterPrompt + HOOK_MASTER_SECTION + getEnhancedPrompt** | Medium | **Critical** — affects ALL content gen (single, batch, Studio) | Fill `HOOK_MASTER_SECTION` first (1 constant), then implement `buildHookMasterPrompt` as a JS function with category-range logic. Wire `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` from `CONTENT_CORE/02` into `getEnhancedPrompt()` no-args path. |
| **2. RANDOM_CHARACTERS pool** | Low | High — fixes blank `characterDesc` for all `ai_auto` single/batch runs | Drop in the 12 entries above. No code changes needed — only data. |
| **3. GEMINI_SCREENER_SYSTEM + PROMPT_CHECKER_MODES** | Medium | High — enables policy safety pipeline (currently all screening is no-op) | Fill `GEMINI_SCREENER_SYSTEM` first (1 string), then implement `geminiComplianceSanitize`. Port `VIOLENCE_AND_UNSAFE_EN`, `RISK_SNIPPETS`, `HARD_BAN_REGEXES` from `CONTENT_CORE/05`. Fill 4 mode prompts. |
| **4. Studio Maps (all four)** | Low | High — narativeMap empty strings cause LLM to receive raw IDs like `veggie_gangster` | Fill `narrativeMap` (40 entries) and `moodMap` (8 entries) first — highest LLM impact. `visualMap` can be extracted from `getSelectedVisualStyleDescription()`. Wire `formatMap` in code after filling. |
| **5. systemPrompt in generateScenesFromMasterPrompt** | Low | Medium — only a fallback path, but when triggered yields blank scenes | Implement as the short JSON-director prompt above (interpolate `studioSceneCount`). Also fill `styleContext` in `buildStudioGeminiParts`. |
| **6. RANDOM_BACKGROUNDS pool** | Low | Medium — fixes blank `backgroundDesc` for `ai_auto` runs; batch `buildImagePrompt` uses `BACKGROUND_STYLE_MAP` instead | Drop in the 12 English strings above. For full coverage, add a `generatedBackground` → `[BACKGROUND_PLACEHOLDER]` merge in the batch path of `buildImagePrompt`. |
