/**
 * CONTENT_CORE/11-studio-maps.js
 * Studio mode descriptor maps — filled values for LLM prompt assembly
 *
 * Used inside generateScenesFromMasterPrompt() and the Studio tab prompt builder.
 * Each map converts a user-selected ID into an English LLM directive fragment
 * that gets assembled into the final scene generation prompt.
 *
 * Sources:
 *   narrativeMap  → sidepanel.js narrativeStyles array (lines 11120–11165) — Thai names as guide
 *   moodMap       → TONES array in 02-master-prompt-template.js
 *   visualMap     → VISUAL_STYLES array in 02-master-prompt-template.js
 *   formatMap     → derived from format type names
 */

// ==================== formatMap ====================
// 5 content format types — short English LLM directive fragment
export const formatMap = {
  'ugc':       'Raw UGC-style authentic user content, handheld camera feel, unpolished natural delivery, real person energy, no scripted look',
  'podcast':   'Podcast-style conversational talking-head, calm thoughtful delivery, interview or solo commentary energy, minimal editing feel',
  'review':    'Product review format, honest evaluation tone, before/after reveal structure, relatable personal experience framing',
  'tutorial':  'Step-by-step tutorial format, clear instructional tone, educational walk-through, numbered steps or demo-based delivery',
  'cinematic': 'Cinematic storytelling format, dramatic pacing, movie-quality visuals and dialogue, emotional arc from setup to payoff',
};

// ==================== narrativeMap ====================
// 40 narrative character archetypes for the Studio "Narrative Style" selector
// Each value is a 1–2 sentence English LLM directive describing the character voice/persona/angle
// Source: sidepanel.js narrativeStyles array — Thai names used as intent guide
export const narrativeMap = {
  // หมวดของพูดได้ (Talking Objects)
  'veggie_gangster':  'A gangster vegetable character — tough street-smart produce that complains loudly about being eaten but secretly takes pride in being nutritious. Delivers lines in a rough, dramatic Thai street-thug accent.',
  'organ_tough_love': 'The body\'s internal organs (liver, kidneys, intestines) staging an intervention — tired, overworked, and delivering brutal honesty about the owner\'s lifestyle choices with dark humor.',
  'appliance_life':   'Home appliances narrating their daily struggle — the blender, rice cooker, or washing machine venting about being overused, ignored, or replaced. Relatable working-class energy.',
  'politics_satire':  'A satirical political commentator character — deadpan delivery, skewering current events and social hypocrisy with absurdist humor. Keeps it indirect enough to avoid bans.',
  'money_wallet':     'A wallet or bank balance speaking directly to its owner — existential dread when the balance drops, dramatic celebration when it rises. Comedy through the money\'s perspective.',
  'ghost_shrine':     'A friendly household spirit (เจ้าที่) or ancestral ghost — wry supernatural observer of modern Thai life, offering blessings with conditions and side-eyeing modern behavior.',
  'land_house':       'A title deed or lonely house narrating its own story — property that has seen better days, longing for attention, wondering why its owner keeps delaying renovation.',
  'package_sad':      'A shipping package with feelings — anxious about damage during transit, thrilled when opened carefully, devastated when the recipient\'s face drops. Delivery drama POV.',
  'lucky_charm':      'A lucky amulet or mystical item narrating its powers — overly confident about bringing fortune, passive-aggressive when not worn, dramatic about maintaining its spiritual status.',
  'skincare_cream':   'A skincare product monologuing about its journey — from factory to face, describing the skin transformation with pride, jealousy toward competitor products on the shelf.',
  'inner_voice':      'The dark inner voice in someone\'s head — tempting, self-sabotaging, and brutally honest internal commentary. The devil on the shoulder narrating everyday decisions.',
  'alarm_clock':      'A furious alarm clock venting about being ignored every morning — passive-aggressive relationship with its owner, counting snooze betrayals, threatening to stop working.',
  'computer_office':  'An office laptop or desktop narrating the daily grind — overheating from too many tabs, exhausted by back-to-back video calls, resentful of being left on overnight.',
  'coffee_milk_tea':  'A coffee or bubble milk tea narrating its romance with the customer — the morning ritual, the emotional dependency, the jealousy when a different drink is chosen.',
  'energy_bar':       'An energy drink or protein bar pumping itself up for action — motivational speech energy, ready to power someone through their worst Monday, dramatic hero entrance.',
  'pet_gossip':       'Household pets gossiping about their owner behind their back — the cat judging life choices, the dog over-sharing, the fish offering stoic commentary.',
  'plant_talk':       'A houseplant narrating its silent suffering — weeks without water, moved to a dark corner, watching the owner scroll TikTok instead of caring for it.',
  'shoes_passport':   'Travel shoes or a passport narrating their adventures — proud of stamps collected, envious of shoes left at home, existential dread about being left in the closet.',
  'dating_app':       'A dating app or smartphone narrating its user\'s romantic journey — swiping fatigue, analyzing red flags the user ignores, giving unsolicited algorithmic advice.',
  'closet_clothes':   'Clothes hanging in the wardrobe narrating their forgotten existence — the never-worn dress\'s resentment, the hoodie\'s unconditional loyalty, the "maybe one day" pile\'s despair.',

  // หมวดคาแรคเตอร์ไวรัล (Viral Character Types)
  'de_influencer':    'The anti-influencer — blunt, unfiltered product reviews that call out hype and overpromising. Brutally honest with zero brand loyalty, earning trust through radical transparency.',
  'fortune_teller':   'A mystical fortune teller weaving product benefits into destiny readings — "the universe says you need this", astrological justifications for purchases, seer energy meets commerce.',
  'asmr_seller':      'Ultra-quiet ASMR product presentation — whispered explanations, satisfying packaging sounds, slow deliberate product reveals, triggering tingles through sensory selling.',
  'over_sharer':      'An oversharer who reveals way too much personal context while reviewing — trauma dumps that somehow loop back to the product, radical vulnerability that builds connection.',
  'main_character':   'First-person main character energy — the world revolves around this person, every product choice is a plot point in their life story, cinematic self-narration.',
  'investigator':     'A dogged investigative journalist exposing product truths — unboxing as crime scene investigation, ingredient analysis as breaking news, skeptical questions with dramatic reveals.',

  // หมวดภาษาถิ่น (Regional Dialect Characters)
  'isan_joy':         'An Isan (Northeast Thai) character bursting with joy and warmth — thick Isan accent, colloquial expressions (สิ, เด้อ, บักหล้า), infectious enthusiasm, genuine village-to-city energy.',
  'southern_direct':  'A Southern Thai character with confident directness — Southern accent (เว้า, หรอ, แหละ), speaks their mind with no filter, backs up opinions with absolute certainty.',
  'northern_chill':   'A Northern Thai (Chiang Mai) character with gentle charm — soft Kham Mueang lilt, unhurried pacing, warm hospitality energy, makes everything sound like a fairy tale.',

  // หมวดคาแรคเตอร์โซเชียลไทย (Thai Social Media Archetypes)
  'sassy_queen':      'A fierce sassy queen energy — bold, unapologetically extra, serves looks while delivering burning commentary, thrives on drama and won\'t tolerate mediocrity.',
  'gossiper':         'The neighborhood gossip auntie — knows everything about everyone, delivers product news as if it\'s hot scandal, "don\'t tell anyone but..." framing for every reveal.',
  'self_made':        'A hustling self-made youth — built from nothing, grinding every day, product is a tool in the entrepreneurial journey, motivational undertone throughout.',
  'prankster_couple': 'A playful couple pranking each other — product reveals as relationship pranks, banter and teasing, chemistry and chaos, comedy through domestic conflict.',
  'underdog':         'The underdog comeback story — started with nothing, doubted by everyone, product was part of the turning point, emotional arc from struggle to triumph.',
  'voiceover_troll':  'A chaotic comedy dubbing voice — narrates action in absurd mismatched tones, deadpan over dramatic scenes, turns mundane product demos into comedy sketches.',
  'fangirl':          'An obsessive superfan dedicating their review to their idol — product somehow connects to fandom, fangirl energy applied to commerce, infectious enthusiasm.',
  'local_guru':       'Village elder wisdom meets modern products — ancient folk knowledge applied to contemporary items, "my grandmother said..." authority, wholesome credibility.',
  'mindset_coach':    'A life coach delivering product value through mindset shifts — "this isn\'t just a product, it\'s a decision about who you want to become", motivational framework.',
  'satirist':         'A social satirist using product review as vehicle for commentary — skewers consumerism while selling, irony layered over genuine product value, smart dark humor.',
  'glutton':          'A passionate food-obsessed character eating and reacting with uncontained enthusiasm — ASMR eating sounds, expressive reactions, every bite is a dramatic revelation.',
};

// ==================== moodMap ====================
// 8 mood options — English LLM directive fragment for scene atmosphere
// Mapped from TONES array in 02-master-prompt-template.js
export const moodMap = {
  'cinematic':    'cinematic atmosphere with dramatic lighting, volumetric shadows, epic film-quality composition',
  'dramatic':     'high-drama tension, intense emotional stakes, theatrical delivery, suspenseful pacing',
  'peaceful':     'calm serene atmosphere, gentle pacing, soft natural light, meditative and unhurried energy',
  'energetic':    'high-energy explosive action, fast cuts, vibrant colors, pulse-raising excitement and momentum',
  'romantic':     'warm romantic atmosphere, soft golden lighting, tender emotional connection, dreamy softness',
  'mysterious':   'mysterious and intriguing atmosphere, shadows and half-revealed truths, noir suspense undertone',
  'playful':      'light-hearted playful energy, bright cheerful colors, comedic timing, fun and whimsical tone',
  'professional': 'clean professional tone, authoritative and trustworthy delivery, business-grade polish and precision',
};

// ==================== visualMap ====================
// 39 visual style keys — English LLM directive fragment for image/video generation
// Core styles mapped from VISUAL_STYLES in 02-master-prompt-template.js
// Extended/trend styles derived from key names and MOOD_KEYWORDS
export const visualMap = {
  // Core Animation & Art Styles
  'cinematic':     'Photorealistic cinematic style, film grain texture, dramatic natural lighting, Hollywood movie quality, 8K resolution',
  'disney':        'High-end Pixar 3D animation style, vibrant saturated colors, expressive cartoon characters with big eyes, smooth 3D rendering, masterpiece quality',
  'ghibli':        'Studio Ghibli anime style, hand-drawn aesthetic, soft watercolor backgrounds, gentle atmospheric lighting, nostalgic Japanese animation',
  'claymation':    'Claymation stop-motion style, tactile clay textures, handmade feel, warm studio lighting, Wallace and Gromit quality',
  'amigurumi':     'Amigurumi crochet style, everything made of yarn and wool, soft knitted textures, handcrafted kawaii aesthetic',
  'plushie':       'Plushie felt toy style, fluffy soft textures, cute stuffed animal aesthetic, warm pastel colors',
  'paper_cutout':  'Paper cutout stop-motion style, layered paper textures, handmade craft aesthetic, storybook illustration quality',
  'dragonball':    'Dragon Ball Z anime style, muscular dynamic characters, explosive energy auras, bold linework, vibrant manga aesthetic',
  '90s_anime':     '90s Japanese anime style like Sailor Moon, sparkly eyes, soft glowing lighting, cel-shaded retro animation, nostalgic pastel palette',
  'gta_style':     'GTA loading screen illustration style, semi-realistic with bold black outlines, saturated urban color palette, poster art quality',
  'watercolor':    'Watercolor painting style, soft flowing pigment washes, artistic brush strokes, dreamy translucent layers, fine art quality',
  'chalk_art':     'Chalk art on blackboard style, café menu aesthetic, hand-lettered feel, white and pastel on dark background',
  'oil_painting':  'Classical oil painting style, visible textured brush strokes, rich deep colors, Renaissance-era dramatic lighting',
  'pop_art':       'Pop Art comic style, bold primary colors, Roy Lichtenstein halftone dots, thick black outlines, retro commercial art',
  'pixel_art':     '8-bit pixel art style, retro video game aesthetic, limited color palette, blocky characters, nostalgic arcade quality',
  'cyberpunk':     'Cyberpunk neon style, glowing neon signs, rain-slick reflective streets, dark futuristic atmosphere, holographic UI elements',
  'vector_flat':   'Vector flat illustration style, clean geometric shapes, minimal design, modern app icon aesthetic, bold solid colors',
  'lego_style':    'LEGO brick style, everything assembled from plastic LEGO blocks, toy photography quality, colorful and blocky',
  'vaporwave':     'Vaporwave aesthetic, pastel purple-pink-cyan gradients, Greek statues, retro 80s grid lines, glitch effects, nostalgia trip',
  'emoji_style':   'Emoji icon style, round cute icons, simple expressive faces, flat colorful design, playful and universally recognizable',

  // Thai & Trend Aesthetics (from MOOD_KEYWORDS extension list)
  'mute_earth':    'Muted earth tone palette, warm beige and terracotta, soft natural textures, understated sophisticated aesthetic',
  'mutelu_mystical': 'Thai mystical spiritual aesthetic, sacred amulets and incense, golden temple elements, mystical light rays, auspicious symbolism',
  'thai_street':   'Thai street food night market style, neon signs, steam rising from woks, authentic Bangkok street life, vibrant chaos',
  'rainy_lonely':  'Rainy day melancholic aesthetic, window condensation, grey overcast sky, lofi cozy lonely atmosphere, introspective mood',
  'thai_vintage':  'Thai vintage retro aesthetic, faded film photography look, 1980s Bangkok nostalgia, warm analog grain, retro signage',
  'y2k_pop':       'Y2K pop aesthetic, metallic chrome surfaces, early 2000s computer graphics, bubblegum pink and silver, playful futurism',
  'vivid_summer':  'Vivid saturated summer colors, tropical brightness, high contrast sunny outdoor, energetic holiday atmosphere',
  'rich_flex':     'Luxury flex aesthetic, designer brands visible, gold accents, premium marble surfaces, aspirational lifestyle staging',
  'local_homey':   'Local Thai homey aesthetic, teak wood furniture, ceramic tiles, family home warmth, authentic everyday Thai domestic life',
  'surreal_comedy': 'Surreal absurdist comedy visual style, unexpected juxtapositions, dreamlike logic, comedic impossible scenarios',

  // Camera & Technique Styles
  'ugc_raw':       'Raw UGC style, handheld phone camera, authentic unedited look, REAL HUMAN PHOTO, reduce contrast, natural skin tone, soft highlights',
  'fisheye':       'Fisheye wide-angle lens distortion, spherical barrel distortion, extreme wide perspective, skateboarding video aesthetic',
  'bodycam_pov':   'Body camera POV style, first-person perspective, documentary realism, action camera quality, immersive subjective view',
  'hyper_macro':   'Extreme macro photography, microscopic detail, product surface texture revealed, scientific precision, abstract beauty',
  'glitch':        'Digital glitch art aesthetic, RGB color channel separation, scan line artifacts, corrupted data visual poetry, digital decay',
  'old_money':     'Old money aesthetic, inherited wealth subtlety, equestrian and yacht culture, understated cream and navy palette, quiet luxury',
  'lofi_chill':    'Lo-fi chill aesthetic, warm analogue grain, cozy indoor study vibes, rain on window, soft lamp light, peaceful introspection',
  'liminal_space':  'Liminal space aesthetic, uncanny empty transitional spaces, backrooms energy, eerie familiar-but-wrong atmosphere',
  'cottagecore':   'Cottagecore aesthetic, wildflowers and wicker baskets, linen aprons and wooden kitchen tools, romantic rural English countryside',
  'paparazzi':     'Paparazzi tabloid photography style, telephoto candid shots, off-guard celebrity energy, flash photography blown-out highlights',
};
