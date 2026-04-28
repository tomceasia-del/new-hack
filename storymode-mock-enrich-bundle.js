/** Bundled from 1click-full-v3.40 (2)/js/storymodePromptEnrich.js — export stripped for mock */
const NARRATIVE_PROMPT_BY_STYLE_ID = {
  1: 'Hard-closer host: urgent, confident, benefit-stacked delivery; stack proof and personal conviction; end with a clear CTA. Avoid illegal overclaim words from global rules.',
  2: 'Warm friend-advisor: empathetic, trustworthy, zero-pressure recommendation — sounds like a peer sharing how the product quietly improved daily life.',
  3: 'First-touch unboxing energy: tactile, curious, moment-by-moment reactions; packaging sounds and on-camera realism; hype only for what is visibly true.',
  4: 'Skeptic-to-believer arc: open doubtful, ask hard questions, let demos and evidence flip the stance; conversational, not scripted infomercial.',
  5: 'FOMO activator: playful social-proof urgency — everyone is on it, you will regret missing the wave — no threats, no false scarcity claims.',
  6: 'Myth-buster host: list misconceptions, debunk with quick demos, position the product as the evidence-backed fix; fact-check tone, not preachy.',
  7: 'Rapid Q&A host: answer comment-style questions fast — question → wit → crisp benefit tie-in; tight rhythm.',
  8: 'Tech explainer geek: translate specs and comparisons into plain-language wins; excited nerd energy that stays entertaining for non-experts.',
  9: 'News-desk satire host: serious broadcast framing with headline hooks and segments; brand-safe parody, no real political endorsements.',
  10: 'Trend hunter: tie the product to memes and short-video trends du jour; fast references with a clear why-it-matters-beyond-the-joke.',
  11: 'Tough-love coach: blunt but caring roast of bad habits; product as disciplined fix; never cruel about bodies or identity.',
  12: 'Tsundere persona: dismissive at first, grudgingly impressed after trying; light rom-com rhythm; PG flirtation; product wins the arc.',
  13: 'Drama-queen reviewer: soap-opera pacing, hyperbolic metaphors; every feature is a cliffhanger — funny, not mean-spirited.',
  14: 'Chronic complainer bit: loop the same annoyance until the product finally silences the rant — great for chores and recurring pain points.',
  15: 'Villain-vs-hero mythic framing: cast the pain as antagonist, product as ally helping the viewer win; playful exaggeration, safe conflict.',
  16: 'Angel-vs-devil inner debate: cartoonish moral comedy about whether to buy; resolve toward healthy satisfaction, not shame.',
  17: 'Time-travel contrast: old-timeline struggle vs new-timeline ease thanks to the product; playful sci-fi, no real historical villains.',
  18: 'Fortune-teller mystic: weave destiny readings and cosmic jokes into benefits; seer-meets-commerce, still product-honest.',
  19: 'Oversharer: deep personal tangent that loops back to the product with vulnerable humor; connection-first, not exploitative.',
  20: 'Main-character POV: cinematic self-narration — every product beat is a plot point in their life movie.',
  21: 'Social detective: unboxing-as-casefile energy; ingredient and packaging scrutiny like investigative journalism with dramatic reveals.',
  22: 'Mindset coach: sell through identity framing — this purchase is self-respect / becoming a better version; motivational but grounded.',
  23: 'Sharp social satirist: skewer consumerism while genuinely showing product value; layered irony, no cruelty.',
  24: 'Anti-influencer: blunt, hype-callout reviews; radical transparency and zero performative brand worship.',
  25: 'Superfan stan energy: product review as fandom support — infectious enthusiasm tied to an idol or obsession metaphor.',
  26: 'Isan warmth: thick Northeast Thai accent and colloquialisms (เด้อ, สิ, บักหล้า); joyful trustworthy village-to-city vibe.',
  27: 'Southern Thai directness: confident blunt delivery with Southern particles (เว้า, หรอ, แหละ); earns trust through honesty.',
  28: 'Northern Thai gentle charm: soft Kham Mueang lilt, slow hospitable pacing; fairytale warmth without losing product clarity.',
  29: 'Sassy queen: extra, unapologetic, reads mediocre products for filth while flexing the good pick; high-energy glam.',
  30: 'Neighborhood gossip auntie: scandal framing for every product detail; conspiratorial "do not tell anyone" hooks.',
  31: 'Hustling self-made youth: grind culture, bootstraps story; product as a tool in the climb — motivational, not toxic hustle porn.',
  32: 'Village elder authority: "grandmother said…" folk wisdom applied to modern items; wholesome cross-generational credibility.',
  33: 'Underdog comeback: doubted start, turning point with the product in the arc; emotional but still product-clear.',
  34: 'Playful couple chaos: pranks, banter, domestic chemistry; product reveals through relationship comedy.',
  35: 'Chaotic dubbing narrator: mismatched voiceover on mundane demos; absurdist comedy timing.',
  36: 'Gangster vegetable POV: tough street-smart produce complaining about being eaten but proud of nutrition; rough Thai street-thug delivery for flavor.',
  37: 'Organ council intervention: liver/kidneys/gut staging a dark-humor health intervention about the owner\'s lifestyle.',
  38: 'Appliance worker rant: rice cooker / washer / AC venting about overuse, neglect, or replacement anxiety; working-class relatability.',
  39: 'Wallet or balance POV: existential dread on outflows, celebration on inflows; money\'s-eye comedy.',
  40: 'Anxious parcel POV: transit trauma, careful-open joy, disappointment dread if the owner frowns — delivery drama.',
  41: 'Mischievous household guardian spirit: affectionate roast of modern Thai habits; blessings with conditions; indirect supernatural humor.',
  42: 'Skincare monologue: shelf-to-face journey; pride in glow-up; jealous side-eye at rival bottles on the shelf.',
  43: 'Furious alarm clock: passive-aggressive snooze betrayal count; love-hate morning routine.',
  44: 'Overworked laptop narrator: too many tabs, hot chassis, endless calls, overnight abandonment — WFH burnout comedy.',
  45: 'Bubble-tea romance POV: clingy morning ritual, jealousy when another drink is chosen; sweet absurd dependency.',
  46: 'Forgotten houseplant POV: thirst drama, dark-corner exile, watching endless phone scroll instead of care.',
  47: 'Passport / travel document brag: stamp pride, shoe-envy, drawer loneliness — wanderlust voice.',
  48: 'Wardrobe protest: unworn dress resentment, loyal hoodie, "maybe someday" pile despair.',
  49: 'Digital amulet / mutelu-app persona: conditional luck, modern superstition humor, playful Gen-Z mystic tone — stay brand-safe.',
  50: 'Indirect political satire via metaphor (empty chair, institutions as props): deadpan absurdist commentary; platform-safe, no named parties.',
  51: 'New parent POV: sleep-deprived warmth, small wins when a product actually works; loving chaos humor.',
  52: 'Sandwich-generation caregiver: juggling elders and kids; practical empathy; product as relief valve across duties.',
  53: 'SME owner pragmatism: every baht is capex; demand ROI proof, durability, and time savings before belief.',
  54: 'Budget student POV: value over hype; skeptical of marketing; delighted by honest quality per baht.',
  55: 'Freelancer WFH blur: home/office boundary collapse; seek focus, comfort, and structure tools with self-aware jokes.',
  56: 'Performance-first fitness voice: data, output, recovery — aesthetics optional; no bro-science illegal claims.',
  57: 'Gen-Z research mode: authenticity radar, ethics sniff-test, hates fake UGC; transparency plus quality.',
  58: 'Intentional minimalist: fewer, better buys; sustainability and shelf harmony; anti-clutter philosophy.',
  59: 'Late-night doom-scroll shopper: 2am vulnerability, impulse humor, self-aware regret-to-joy swing; still honest about the product.',
  60: 'Reformed skeptic evangelist: used to dismiss the category; humble-brag conversion story with humor and gratitude.'
};

/** English fragments appended to the LLM context for each mood keyword. */
const MOOD_LLM_DIRECTIVE_BY_KEYWORD = {
  'Cinematic Standard': 'Neutral cinematic baseline for short-form drama — balanced contrast, natural skin tones, clean composition, gentle filmic roll-off. Vertical 9:16 framing optimized for mobile viewing.',
  'Emotional Drama': 'Close facial framing, soft single key light, moist eyes highlighted, warm practical backgrounds, music-video emotional pacing — optimized to make viewer feel the scene within 3 seconds.',
  'Action Explosive': 'Dynamic Dutch angles, rapid kinetic cuts, punchy saturated primaries, hero lighting on protagonist — high-impact energy optimized for autoplay hook in first 2 seconds.',
  'Dark & Gritty': 'Low-key directional lighting, crushed shadows with readable detail, desaturated palette, textured environments — grounded dramatic realism for intense short-form narrative.',
  'Mystery Noir': 'Hard directional shadows, venetian-blind light patterns, cool-to-warm split grade, silhouette-forward framing — detective mystery mood that creates curiosity hooks to keep viewers watching.',
  'Red Alert / Conflict': 'Punchy high-contrast framing, red accent practical lights, fast-cut pacing cues, urgent danger-signal atmosphere — builds tension for dramatic TikTok confrontation scenes.',
  'Romantic Drama': 'Soft rose and blush color grade, gentle lens bloom, intimate close distances, tender key lighting — romantic drama aesthetic optimized for couple content and emotional relationship arcs.',
  'Horror / Thriller': 'Off-balance framing, negative-space dread, cool desaturated tones, shallow DOF suggesting unseen threat — suspense hooks for TikTok horror short-form, no graphic content.',
  'Bright & Airy': 'High-key soft lighting, airy whites, pastel-friendly palette — optimistic freshness that performs well for lifestyle, wellness, and feel-good TikTok content.',
  'Rainy & Lonely': 'Rain-streaked glass foreground, cool blue-gray grade, solitary framing with negative space — melancholic poetic mood for sad audio trends and emotional monologue TikToks.',
  'Lo-Fi Cozy': 'Film grain, warm lifted shadows, desk-lamp pool of light, cozy bedroom or study scale — lo-fi chill aesthetic for vlog, study-with-me, and day-in-my-life TikTok formats.',
  'Vivid & Energetic': 'High saturation, punchy contrast, bold color blocking — eye-catching palette engineered to stop the scroll and retain attention in the first second of autoplay.',
  'Mute & Earth Tone': 'Desaturated earth palette of linen, cocoa, and olive — quiet luxury aesthetic popular on TikTok lifestyle and aesthetic content, intentional restraint over trend.',
  'Nature Organic': 'Rich greens and earth tones, dappled sunlight, natural material textures — outdoor freshness for wellness, sustainability, and green-lifestyle TikTok content.',
  'Y2K Pop Energy': 'Glossy early-2000s production sheen, candy color palette, playful sparkle lens flares — Y2K nostalgia energy optimized for trending audio and dance TikTok formats.',
  'Surreal Comedy': 'Playful impossible-scale gags, bright colors, whimsical VFX absurdity — humor through surprise and wit, never cruelty, optimized for comedy skit TikTok format.',
  'Mutelu Mystical': 'Soft incense smoke haze, candle rim light, amulet bokeh, warm amber-to-cool shadow split — spiritual-but-playful Thai mystical mood for fortune, blessing, and belief TikTok content.',
  'Thai Street Night': 'Neon-lit night market stalls, wok steam plumes, wet asphalt reflections, handheld authenticity — Bangkok night energy for food, lifestyle, and street TikTok content.',
  'Thai Vintage Town': 'Faded analog print colors, slight gate weave texture, small-town commercial signage, warm dusty palette — nostalgic Thai heartland aesthetic for storytelling and memory TikToks.',
  'Vivid Thai Summer': 'High saturation, harsh tropical sunlight, sweat-glisten highlights, primary color pops — unapologetic Thai summer holiday energy for travel and outdoor TikTok content.',
  'Thai Festival': 'Water splashes and color powder in motion, joyful crowd energy, golden temple architecture, warm afternoon light — Thai festival celebration mood for Songkran and holiday content.',
  'Local Homey': 'Everyday Thai domestic realism, warm practical lamps, charming household clutter — authentic home life aesthetic for family, food at home, and relatable TikTok content.',
  'Cyberpunk Neon': 'Neon magenta and cyan edge lighting, wet reflective streets, holographic UI accents, futuristic noir — high-tech low-life aesthetic for tech, gaming, and dramatic TikTok content.',
  'Product Hero Clean': 'Clean white or neutral seamless background, soft box key light, sharp product detail, minimal negative space — product hero framing optimized for e-commerce and TikTok Shop showcase.',
  'ASMR Unboxing': 'Extreme close macro on product surfaces and packaging, slow deliberate camera moves, crisp texture detail, satisfying unboxing rhythm — ASMR visual pleasure for unboxing and review TikToks.',
  'Beauty & Skincare Glow': 'Ring light skin glow, soft beauty-dish fill, flawless skin texture emphasis, warm natural palette — optimized for beauty, skincare, and makeup review TikTok content.',
  'Food Porn Satisfying': 'Overhead or 45-degree soft beauty lighting on food, rich saturated food colors, slow-motion first-bite or pour, steam wisps — food porn aesthetic engineered for TikTok food content shareability.',
  'Rich & Flex': 'Confident aspirational lighting on quality accessories and polished spaces, swagger without vulgarity — wealth through quality of detail for aspirational lifestyle and product TikTok content.',
  'Before & After Drama': 'Hard split between dull before-state and vibrant after-state lighting, dramatic color grade shift on cut — transformation reveal optimized for product demo and makeover TikTok hooks.',
  'Haul & Lifestyle': 'Authentic handheld room lighting, products laid flat or arranged naturally, enthusiastic reveal energy — genuine haul and lifestyle TikTok aesthetic that feels real not staged.',
  'UGC Raw / Authentic': 'Handheld micro-shake, harsh phone flash mixed with window light, imperfect exposure swings, creator bedroom or kitchen realism — authentic UGC energy that outperforms polished production on TikTok.',
  'Talking Head / POV': 'Direct-to-camera close framing, ring light or natural window key, expressive facial performance priority — optimized for storytime, opinion, and talking-head viral TikTok formats.',
  'Fisheye / Ultra Wide': 'Ultra-wide barrel distortion as deliberate style, exaggerated foreground, dynamic skate-video energy — attention-grabbing perspective for viral challenge and action TikTok content.',
  'POV Bodycam': 'Chest-mounted POV, wide angle, motion blur on movement, immersive first-person kinetic flow — perspective format proven viral for challenge, follow-me, and day-in-life TikToks.',
  'Trending Transition': 'Snappy match-cuts timed to beat drops, outfit or location swap transitions, high contrast between scenes — transition-format aesthetic optimized for trending audio TikTok virality.',
  'Duet / Stitch Ready': 'Subject placed right-of-frame leaving left negative space for duet reaction, clear expressive performance, clean audio-reactive framing — optimized composition for TikTok duet and stitch format.',
  'Glitch & Retro Digital': 'Controlled datamosh and RGB channel-split glitch accents on cuts, retro digital corruption as intentional style — readable visual effect for transition, reveal, and dramatic moment TikToks.',
  'Viral Hook Opener': 'Maximum visual impact in first 3 seconds — bold lighting, immediate on-screen action, high contrast frame, dynamic movement from frame 1 — engineered as a scroll-stopping hook for TikTok autoplay.'
};

/**
 * @param {string} moodKeyword
 * @returns {string}
 */
function getMoodDirective(moodKeyword) {
  if (!moodKeyword) return '';
  return MOOD_LLM_DIRECTIVE_BY_KEYWORD[moodKeyword]
    || `Match overall lighting, color grade, and pacing to this mood label: "${moodKeyword}". Keep visuals coherent and platform-safe.`;
}

/**
 * @param {number[]} styleIds
 * @returns {string}
 */
function formatNarrativePromptsForMessage(styleIds) {
  if (!styleIds || styleIds.length === 0) return '';
  const lines = styleIds.map((id) => {
    const p = NARRATIVE_PROMPT_BY_STYLE_ID[id];
    return p ? `[Style ${id}] ${p}` : '';
  }).filter(Boolean);
  return lines.join('\n\n');
}

if (typeof globalThis !== 'undefined') {
  globalThis.getMoodDirective = getMoodDirective;
  globalThis.formatNarrativePromptsForMessage = formatNarrativePromptsForMessage;
}

/* ────────────────────────────────────────────────────────────────────────────
 * HOOK LIBRARY — ported from CONTENT_CORE/12-hook-master.js (200 entries, 4 cats)
 * Used by storymode-mock-gemini-core.js to inject 5 random hook candidates
 * into the user message so the AI picks one as the opening line.
 * ──────────────────────────────────────────────────────────────────────────── */

const HOOK_CATEGORIES = {
  FOMO: { name: 'FOMO & Flash Sale', icon: '🔥', desc: 'กระตุ้นความเสียดาย กลัวพลาด กลัวของหมด' },
  AUTHENTIC: { name: 'Authentic Vibe', icon: '👯‍♀️', desc: 'เพื่อนป้ายยา รีวิวเรียลๆ ความลับนางฟ้า' },
  OBSESSION: { name: 'Scarcity & Obsession', icon: '👑', desc: 'อวยยศขั้นสุด หายาก ซื้อซ้ำ ขาดไม่ได้' },
  CURIOSITY: { name: 'Curiosity Gap & Shock', icon: '🤯', desc: 'ท้าทายความเชื่อ ช็อควงการ สร้างความอยากรู้' }
};

const HOOK_LIBRARY = [
  { id: 1, cat: 'FOMO', text: 'คราวที่แล้วใครกดไปแล้วได้ราคานี้ โชคดีมาก!' },
  { id: 2, cat: 'FOMO', text: 'เตือนแล้วนะ รีบกดก่อนตะกร้าปลิว!' },
  { id: 3, cat: 'FOMO', text: 'ใครเห็นคลิปนี้ ถือว่าแต้มบุญสูงมาก!' },
  { id: 4, cat: 'FOMO', text: 'อย่าเพิ่งเลื่อนผ่าน ถ้าไม่อยากพลาดราคาโปร!' },
  { id: 5, cat: 'FOMO', text: 'โกรธตัวเองมาก ทำไมเพิ่งมากดตอนราคาปกติ!' },
  { id: 6, cat: 'FOMO', text: 'นาทีทองของจริง ไม่กดตอนนี้จะกดตอนไหน!' },
  { id: 7, cat: 'FOMO', text: 'หมดแล้วหมดเลยนะ ล็อตนี้เจ้าของแบรนด์จัดโปรเดือด!' },
  { id: 8, cat: 'FOMO', text: 'ใครเล็งไว้ รีบเลยนะ ก่อนของจะขาดตลาดอีกรอบ!' },
  { id: 9, cat: 'FOMO', text: 'ถูกกว่านี้ก็แจกฟรีแล้วแม่ รีบกดด่วน!' },
  { id: 10, cat: 'FOMO', text: 'ได้มาราคานี้คือคุ้มจนงง คุ้มกว่านี้ไม่มีแล้ว!' },
  { id: 11, cat: 'FOMO', text: 'ไม่คิดว่าจะลดแรงขนาดนี้ กดใส่ตะกร้าแทบไม่ทัน!' },
  { id: 12, cat: 'FOMO', text: 'ใครพลาดรอบที่แล้ว รอบนี้ห้ามพลาดเด็ดขาด!' },
  { id: 13, cat: 'FOMO', text: 'โปรลับที่หลายคนยังไม่รู้ รีบดูก่อนโดนลบ!' },
  { id: 14, cat: 'FOMO', text: 'ช็อกมาก! ราคานี้หาไม่ได้อีกแล้วนะบอกเลย' },
  { id: 15, cat: 'FOMO', text: 'ใครเห็นคลิปนี้ภายใน 1 ชั่วโมง ถือว่ารอด!' },
  { id: 16, cat: 'FOMO', text: 'สต็อกจะหมดแล้วทุกคน ใครไหวไปก่อนเลย!' },
  { id: 17, cat: 'FOMO', text: 'กรี๊ดดด! ลดโหดเหมือนโกรธใครมา รีบตำ!' },
  { id: 18, cat: 'FOMO', text: 'อย่าลังเล นานกว่านี้ระวังของหมดนะ!' },
  { id: 19, cat: 'FOMO', text: 'โปรนี้ไม่ได้มีบ่อยๆ เจอแล้วต้องรีบคว้า!' },
  { id: 20, cat: 'FOMO', text: 'ใครจ่ายราคาเต็มอยู่ หยุดด่วน! มาดูคลิปนี้' },
  { id: 21, cat: 'FOMO', text: 'แทบช็อกตอนเห็นราคา คุ้มจนต้องรีบบอกต่อ!' },
  { id: 22, cat: 'FOMO', text: 'รีบด่วน! ก่อนที่แบรนด์จะรู้ตัวแล้วปรับราคาขึ้น' },
  { id: 23, cat: 'FOMO', text: 'ให้ไวเลยพวกแก ของดีราคาแบบนี้ไปไวมาก!' },
  { id: 24, cat: 'FOMO', text: 'วันนี้วันเดียวเท่านั้น พลาดแล้วคือพลาดเลยนะ!' },
  { id: 25, cat: 'FOMO', text: 'เตือนครั้งสุดท้าย! ก่อนโปรนี้จะหมดเขต' },
  { id: 26, cat: 'FOMO', text: 'ใครยังไม่กดตะกร้า ระวังจะเสียใจทีหลังนะ!' },
  { id: 27, cat: 'FOMO', text: 'เจอราคานี้เข้าไป มือสั่นกดสั่งแทบไม่ทัน!' },
  { id: 28, cat: 'FOMO', text: 'ของแถมจุกมากแม่ รีบกดก่อนของแถมหมด!' },
  { id: 29, cat: 'FOMO', text: 'ลดแบบไม่เกรงใจคนซื้อราคาเต็มเลย รีบจัด!' },
  { id: 30, cat: 'FOMO', text: 'โปรเดือดกลางเดือน ใครเห็นคลิปนี้กำไรล้วนๆ!' },
  { id: 31, cat: 'FOMO', text: 'ไม่ซื้อตอนนี้ระวังนอนไม่หลับนะบอกเลย!' },
  { id: 32, cat: 'FOMO', text: 'ด่วนที่สุด! ของเพิ่งเข้า ใครรออยู่รีบมากด!' },
  { id: 33, cat: 'FOMO', text: 'ราคาดีงามจนต้องขยี้ตา รีบตุนด่วนๆ' },
  { id: 34, cat: 'FOMO', text: 'โอกาสสุดท้ายแล้ว ใครเล็งไว้ต้องจัดวันนี้!' },
  { id: 35, cat: 'FOMO', text: 'ท้าให้เช็คราคาเลย คลิปนี้ถูกสุดในแอป!' },
  { id: 36, cat: 'FOMO', text: 'พลาดคลิปนี้ระวังคุยกับเพื่อนไม่รู้เรื่องนะ!' },
  { id: 37, cat: 'FOMO', text: 'จำกัดแค่ 100 ออเดอร์แรกเท่านั้น รีบเลย!' },
  { id: 38, cat: 'FOMO', text: 'ใครดูจบคลิปนี้ รับรองว่าเซฟเงินไปได้เยอะ!' },
  { id: 39, cat: 'FOMO', text: 'เตือนแล้วนะ ว่ามันดีมาก รีบกดก่อนของหมด!' },
  { id: 40, cat: 'FOMO', text: 'โปรไฟไหม้ของแท้ รีบกดตะกร้าด่วนจี๋!' },
  { id: 41, cat: 'FOMO', text: 'อย่ามัวแต่อ่านคอมเมนต์ รีบกดสั่งก่อนของหมด!' },
  { id: 42, cat: 'FOMO', text: 'ราคานี้มีแค่ในคลิปนี้เท่านั้น!' },
  { id: 43, cat: 'FOMO', text: 'ของดีมีน้อย ใครมือไวคนนั้นได้ไปเลย!' },
  { id: 44, cat: 'FOMO', text: 'ไม่คิดว่าแบรนด์จะกล้าลดขนาดนี้ ต้องรีบจัด!' },
  { id: 45, cat: 'FOMO', text: 'โปรแรงทะลุจอ รีบกดก่อนตะกร้าหาย!' },
  { id: 46, cat: 'FOMO', text: 'นาทีนี้ต้องแย่งชิง ใครไวใครได้นะบอกเลย!' },
  { id: 47, cat: 'FOMO', text: 'ลดหนักมากแม่ รีบชวนเพื่อนมาหารด่วน!' },
  { id: 48, cat: 'FOMO', text: 'โค้ดส่วนลดมีจำกัด รีบใช้ก่อนสิทธิ์เต็ม!' },
  { id: 49, cat: 'FOMO', text: 'คุ้มจนอยากจะเหมาหมดสต็อก รีบไปกด!' },
  { id: 50, cat: 'FOMO', text: 'อย่าปล่อยให้ของหลุดมือ ราคานี้หายากมาก!' },
  { id: 51, cat: 'AUTHENTIC', text: 'โอ๊ยยย ก็ว่าจะไม่บอกแล้วนะ แต่มันเริ่ดจริง!' },
  { id: 52, cat: 'AUTHENTIC', text: 'ความลับนางฟ้าที่แบรนด์ไม่ได้จ่าย จ่ายเองล้วนๆ!' },
  { id: 53, cat: 'AUTHENTIC', text: 'โดนตกมาแบบงงๆ ไม่อยากเก็บไว้คนเดียวเลย' },
  { id: 54, cat: 'AUTHENTIC', text: 'โนสปอนเซอร์นะคะ คลิปนี้รีวิวจากใจผู้ใช้จริง!' },
  { id: 55, cat: 'AUTHENTIC', text: 'เพื่อนทักว่าไปทำอะไรมา ทำไมช่วงนี้ดูดีขึ้น!' },
  { id: 56, cat: 'AUTHENTIC', text: 'ไอเทมลับที่คนเก่งๆ เค้าแอบใช้กัน!' },
  { id: 57, cat: 'AUTHENTIC', text: 'ป้ายยาแรงมากแกรรร ไม่ดีจริงไม่กล้าเอามาบอก!' },
  { id: 58, cat: 'AUTHENTIC', text: 'ขอร้องเลยนะ ใครยังไม่เคยลอง ต้องเปิดใจ!' },
  { id: 59, cat: 'AUTHENTIC', text: 'บอกบุญจ้าาา เจอของดีเลยเอามาแชร์ต่อ!' },
  { id: 60, cat: 'AUTHENTIC', text: 'ชั้นไปอยู่ไหนมา ทำไมเพิ่งมารู้จักสิ่งนี้!' },
  { id: 61, cat: 'AUTHENTIC', text: 'วงการนี้เข้าแล้วออกยากมาก บอกเลย!' },
  { id: 62, cat: 'AUTHENTIC', text: 'ของมันต้องมีจริงๆ แก ไม่มีคือเอาต์มาก!' },
  { id: 63, cat: 'AUTHENTIC', text: 'รีวิวพลีชีพ! ใช้จริง เจ็บจริง ดีจริงเลยมาบอก!' },
  { id: 64, cat: 'AUTHENTIC', text: 'ไม่คิดว่าจะเวิร์ค แต่พอลองแล้วคือจึ้งมาก!' },
  { id: 65, cat: 'AUTHENTIC', text: 'เคล็ดลับที่ทำลืมไปเลยว่าเคยมีปัญหานี้!' },
  { id: 66, cat: 'AUTHENTIC', text: 'ใครมีปัญหาแบบเรา มามุงด่วนๆ เลยจ้า!' },
  { id: 67, cat: 'AUTHENTIC', text: 'ตอบคำถามที่คนทักมาถามเยอะที่สุดในอินบ็อกซ์!' },
  { id: 68, cat: 'AUTHENTIC', text: 'เผยเคล็ดลับที่แอบซุ่มใช้มานาน วันนี้ยอมบอกละ!' },
  { id: 69, cat: 'AUTHENTIC', text: 'ใครลังเลอยู่ ดูคลิปนี้จบ ตัดสินใจได้แน่นอน!' },
  { id: 70, cat: 'AUTHENTIC', text: 'ไม่ดีจริงไม่กล้าเอาหน้ามารับประกันนะบอกเลย!' },
  { id: 71, cat: 'AUTHENTIC', text: 'ใช้เองจนหมดไปหลายขวด เพิ่งมีโอกาสมารีวิว!' },
  { id: 72, cat: 'AUTHENTIC', text: 'ของดีบอกต่อ ไม่หวงเคล็ดลับเลยจ้า!' },
  { id: 73, cat: 'AUTHENTIC', text: 'ลองมาหมดแล้ว จบที่ตัวนี้ตัวเดียวจริงๆ!' },
  { id: 74, cat: 'AUTHENTIC', text: 'ใครเป็นสายนี้ ห้ามพลาดไอเทมนี้เด็ดขาด!' },
  { id: 75, cat: 'AUTHENTIC', text: 'ป้ายยาแบบไม่กั๊ก ดีบอกดี ไม่ดีบอกไม่ดี!' },
  { id: 76, cat: 'AUTHENTIC', text: 'รีวิวแบบเรียลๆ โนฟิลเตอร์ โนแต่งภาพ!' },
  { id: 77, cat: 'AUTHENTIC', text: 'ไอเทมกู้ชีพในวันเร่งรีบ ต้องมีติดกระเป๋า!' },
  { id: 78, cat: 'AUTHENTIC', text: 'ใครขี้เกียจฟังยาวๆ ข้ามไปกดตะกร้าได้เลย!' },
  { id: 79, cat: 'AUTHENTIC', text: 'สารภาพบาป ว่าแอบไปตำตามชาวทวิตมา!' },
  { id: 80, cat: 'AUTHENTIC', text: 'เจอตัวตายตัวแทนแล้ว ไม่ต้องง้อของแพงอีกต่อไป!' },
  { id: 81, cat: 'AUTHENTIC', text: 'ฮาวทูโกงความสวย แบบไม่ต้องจ่ายแพง!' },
  { id: 82, cat: 'AUTHENTIC', text: 'ไอเทมลูกรักตัวใหม่ ยกให้เป็นเบอร์หนึ่งตอนนี้!' },
  { id: 83, cat: 'AUTHENTIC', text: 'ใครชอบความคุ้มค่า ต้องโดนตัวนี้ตกแน่ๆ!' },
  { id: 84, cat: 'AUTHENTIC', text: 'รีวิวตามจริง จากคนที่จ่ายเงินซื้อเองทุกบาท!' },
  { id: 85, cat: 'AUTHENTIC', text: 'ป้ายยาเพื่อนไปหลายคนแล้ว วันนี้ขอมาป้ายยาในนี้บ้าง!' },
  { id: 86, cat: 'AUTHENTIC', text: 'ใครเบื่อปัญหาเดิมๆ ลองเปิดใจให้สิ่งนี้ดูนะ!' },
  { id: 87, cat: 'AUTHENTIC', text: 'เคล็ด(ไม่)ลับ ที่อยากให้ทุกคนได้รู้!' },
  { id: 88, cat: 'AUTHENTIC', text: 'ไอเทมที่ทำให้ชีวิตง่ายขึ้น 300%' },
  { id: 89, cat: 'AUTHENTIC', text: 'ดีใจมากที่ตัดสินใจซื้อวันนั้น ไม่ผิดหวังเลย!' },
  { id: 90, cat: 'AUTHENTIC', text: 'รีวิวฉบับคนขี้เกียจ ไอเทมเดียวจบปิ๊ง!' },
  { id: 91, cat: 'AUTHENTIC', text: 'ใครยังลังเล ฟังทางนี้ก่อนจ้า!' },
  { id: 92, cat: 'AUTHENTIC', text: 'ป้ายยาแบบรัวๆ เตรียมตัวเสียทรัพย์ได้เลย!' },
  { id: 93, cat: 'AUTHENTIC', text: 'ไอเทม Must Have ที่ขาดไม่ได้ในตอนนี้!' },
  { id: 94, cat: 'AUTHENTIC', text: 'ไม่เชื่อก็ต้องเชื่อ ว่ามันเปลี่ยนชีวิตเราจริงๆ!' },
  { id: 95, cat: 'AUTHENTIC', text: 'รีวิวแบบสับๆ ไม่เยิ่นเย้อ ไปดูกันเลย!' },
  { id: 96, cat: 'AUTHENTIC', text: 'ใครอยากรู้เคล็ดลับ ตามมาดูด่วนๆ!' },
  { id: 97, cat: 'AUTHENTIC', text: 'ไอเทมลับที่ช่วยเซฟเงินในกระเป๋าไปได้เยอะ!' },
  { id: 98, cat: 'AUTHENTIC', text: 'ดีจนอยากจะเหมามาแจกเพื่อนให้หมด!' },
  { id: 99, cat: 'AUTHENTIC', text: 'ป้ายยาไอเทมเด็ด ที่ควรมีติดบ้าน!' },
  { id: 100, cat: 'AUTHENTIC', text: 'รีวิวจากใจคนใช้จริง ไม่หน้าม้าแน่นอน!' },
  { id: 101, cat: 'OBSESSION', text: 'ไม่อยากให้เจ้าของแบรนด์เลิกผลิตเลย ขอร้อง!' },
  { id: 102, cat: 'OBSESSION', text: 'ยกให้เป็นเดอะเบสท์ของปีนี้เลย จึ้งมาก!' },
  { id: 103, cat: 'OBSESSION', text: 'ซื้อตุนจนกว่าจะเลิกผลิต ของมันดีจริงๆ!' },
  { id: 104, cat: 'OBSESSION', text: 'ขาดเธอเหมือนขาดใจ ไอเทมนี้ต้องมีติดตัวตลอด!' },
  { id: 105, cat: 'OBSESSION', text: 'ซื้อซ้ำรอบที่ร้อย ดีจนไม่รู้จะอวยยังไงแล้ว!' },
  { id: 106, cat: 'OBSESSION', text: 'ถ้าแบรนด์เลิกทำ ฉันจะประท้วง!' },
  { id: 107, cat: 'OBSESSION', text: 'ไอเทมกู้โลก กู้ชีวิต ขาดไม่ได้เด็ดขาด!' },
  { id: 108, cat: 'OBSESSION', text: 'ตั้งแต่เจอสิ่งนี้ ชีวิตก็เปลี่ยนไปตลอดกาล!' },
  { id: 109, cat: 'OBSESSION', text: 'ยกขึ้นหิ้งไปเลยจ้า ไอเทมระดับตำนาน!' },
  { id: 110, cat: 'OBSESSION', text: 'ไม่เคยผิดหวังกับแบรนด์นี้ ทำถึงตลอด!' },
  { id: 111, cat: 'OBSESSION', text: 'ซื้อเผื่อชาติหน้าไปเลย คุ้มค่าทุกบาททุกสตางค์!' },
  { id: 112, cat: 'OBSESSION', text: 'ไอเทมกันตาย วันไหนไม่มีคือขาดความมั่นใจ!' },
  { id: 113, cat: 'OBSESSION', text: 'ใช้ดีจนต้องกราบคนคิดค้น ขอบคุณที่สร้างสิ่งนี้มา!' },
  { id: 114, cat: 'OBSESSION', text: 'นี่คือเหตุผลที่ทำไมเราถึงซื้อซ้ำวนไป!' },
  { id: 115, cat: 'OBSESSION', text: 'ไอเทมระดับเวิลด์คลาส แต่ราคาจับต้องได้!' },
  { id: 116, cat: 'OBSESSION', text: 'ดีจนอยากจะเหมาทั้งแผงมาเก็บไว้ที่บ้าน!' },
  { id: 117, cat: 'OBSESSION', text: 'ไม่นอกใจไปไหนแล้ว จบที่ตัวนี้ตัวเดียว!' },
  { id: 118, cat: 'OBSESSION', text: 'ยกให้เป็น MVP ของหมวดนี้เลย ไม่มีใครล้มได้!' },
  { id: 119, cat: 'OBSESSION', text: 'ไอเทมเปลี่ยนชีวิต จากหน้ามือเป็นหลังมือ!' },
  { id: 120, cat: 'OBSESSION', text: 'ถ้าให้เลือกไอเทมไปติดเกาะ ขอเลือกสิ่งนี้!' },
  { id: 121, cat: 'OBSESSION', text: 'ใช้ดีจนต้องร้องขอชีวิต มันเริ่ดเกินแก!' },
  { id: 122, cat: 'OBSESSION', text: 'ไอเทมที่ทุกคนคู่ควร เกิดมาต้องได้ลองซักครั้ง!' },
  { id: 123, cat: 'OBSESSION', text: 'อวยยศให้สุดทาง ดีจนต้องบอกต่อให้โลกรู้!' },
  { id: 124, cat: 'OBSESSION', text: 'ใครไม่เคยลอง ถือว่าพลาดของดีในชีวิตไปเลยนะ!' },
  { id: 125, cat: 'OBSESSION', text: 'ซื้อตุนไว้ก่อน อุ่นใจกว่า ของขาดตลาดบ่อยมาก!' },
  { id: 126, cat: 'OBSESSION', text: 'ไอเทมที่ใช้แล้วรู้สึกสวย/หล่อขึ้น 10 ระดับ!' },
  { id: 127, cat: 'OBSESSION', text: 'ของดีระดับแรร์ไอเทม ใครเจอกดด่วน!' },
  { id: 128, cat: 'OBSESSION', text: 'ใช้จนหยดสุดท้าย ไม่ยอมทิ้งเด็ดขาด!' },
  { id: 129, cat: 'OBSESSION', text: 'ดีจนอยากจะมอบมงกุฎให้เลย สมมงที่สุด!' },
  { id: 130, cat: 'OBSESSION', text: 'ไอเทมที่ทำให้คนรอบข้างทักจนรำคาญ! (ในทางที่ดี)' },
  { id: 131, cat: 'OBSESSION', text: 'ขาดสิ่งนี้ไป ชีวิตขาดสีสันแน่นอน!' },
  { id: 132, cat: 'OBSESSION', text: 'ซื้อแล้วซื้ออีก ซื้อวนไป ซื้อจนกว่าจะล้มละลาย!' },
  { id: 133, cat: 'OBSESSION', text: 'ไอเทมที่ช่วยแก้ปัญหาเรื้อรังมานับสิบปี!' },
  { id: 134, cat: 'OBSESSION', text: 'ยกให้เป็นนัมเบอร์วันในดวงใจตลอดกาล!' },
  { id: 135, cat: 'OBSESSION', text: 'ดีจนอยากจะกระซิบข้างหูให้ทุกคนไปซื้อ!' },
  { id: 136, cat: 'OBSESSION', text: 'ไอเทมที่ทำให้รู้สึกว่า เงินที่จ่ายไปคุ้มค่ามาก!' },
  { id: 137, cat: 'OBSESSION', text: 'ไม่เคยอินกับอะไรขนาดนี้มาก่อน จนมาเจอสิ่งนี้!' },
  { id: 138, cat: 'OBSESSION', text: 'ขอแต่งตั้งให้เป็นไอเทมลูกรักประจำปีนี้!' },
  { id: 139, cat: 'OBSESSION', text: 'ดีจนอยากจะกราบเบญจางคประดิษฐ์ให้แบรนด์!' },
  { id: 140, cat: 'OBSESSION', text: 'ไอเทมที่ทำให้เรากลายเป็นคนคลั่งรัก! (รักสินค้า)' },
  { id: 141, cat: 'OBSESSION', text: 'ขาดเธอไม่ได้จริงๆ ขอร้องอย่าเลิกผลิตนะ!' },
  { id: 142, cat: 'OBSESSION', text: 'ซื้อตุนรัวๆ กลัววันนึงเค้าจะไม่ทำขายแล้ว!' },
  { id: 143, cat: 'OBSESSION', text: 'ไอเทมที่เปลี่ยนเรื่องยากให้กลายเป็นเรื่องง่าย!' },
  { id: 144, cat: 'OBSESSION', text: 'ยกให้เป็นพระเอก/นางเอกของงานนี้เลย!' },
  { id: 145, cat: 'OBSESSION', text: 'ดีจนต้องปาดน้ำตา ทำไมเพิ่งมาเจอตอนนี้!' },
  { id: 146, cat: 'OBSESSION', text: 'ไอเทมที่ทำให้เรารักตัวเองมากขึ้น!' },
  { id: 147, cat: 'OBSESSION', text: 'ไม่ใช่แค่ชอบ แต่มันคือความผูกพันไปแล้ว!' },
  { id: 148, cat: 'OBSESSION', text: 'ขาดสิ่งนี้ไป ชีวิตเหมือนขาดอะไรไปอย่าง!' },
  { id: 149, cat: 'OBSESSION', text: 'ซื้อซ้ำจนจำไม่ได้แล้วว่ากระปุกที่เท่าไหร่!' },
  { id: 150, cat: 'OBSESSION', text: 'ยกให้เป็นตำนานที่ยังมีลมหายใจ ไอเทมสุดปัง!' },
  { id: 151, cat: 'CURIOSITY', text: 'ไม่เชื่อก็ต้องเชื่อ! ว่าของราคาแค่นี้จะทำได้ขนาดนี้' },
  { id: 152, cat: 'CURIOSITY', text: 'เพิ่งรู้ว่าทำแบบนี้ได้ด้วย ฉันไปอยู่ไหนมาเนี่ย!' },
  { id: 153, cat: 'CURIOSITY', text: 'หยุดไถฟีดก่อน! ถ้าไม่อยากพลาดสิ่งนี้' },
  { id: 154, cat: 'CURIOSITY', text: 'อย่าเพิ่งซื้อของแพง ถ้ายังไม่ได้ดูคลิปนี้!' },
  { id: 155, cat: 'CURIOSITY', text: 'ช็อกวงการ! ไอเทมลับที่คู่แข่งไม่อยากให้คุณรู้' },
  { id: 156, cat: 'CURIOSITY', text: 'รู้รึเปล่า? ว่าคุณอาจจะกำลังทำผิดมาตลอด!' },
  { id: 157, cat: 'CURIOSITY', text: 'ความลับที่โดนปิดบังมานาน วันนี้จะมาแฉให้หมด!' },
  { id: 158, cat: 'CURIOSITY', text: 'ระวัง! ถ้ากดใช้สิ่งนี้ ชีวิตคุณจะเปลี่ยนไป!' },
  { id: 159, cat: 'CURIOSITY', text: 'คลิปนี้อาจจะโดนลบ รีบดูก่อนบิน!' },
  { id: 160, cat: 'CURIOSITY', text: 'เตือนภัย! อย่าหาทำแบบนี้ ถ้ายังไม่รู้สิ่งนี้' },
  { id: 161, cat: 'CURIOSITY', text: 'ไขข้อข้องใจ ทำไมคนถึงฮิตสิ่งนี้กันนัก!' },
  { id: 162, cat: 'CURIOSITY', text: 'ทดลองใช้มา 7 วัน ผลลัพธ์ที่ได้คือช็อกมาก!' },
  { id: 163, cat: 'CURIOSITY', text: 'แฉหมดเปลือก! รีวิวตามจริง แบบไม่เกรงใจใคร' },
  { id: 164, cat: 'CURIOSITY', text: 'สิ่งที่คุณเห็น อาจจะไม่ใช่อย่างที่คุณคิด!' },
  { id: 165, cat: 'CURIOSITY', text: 'รู้แล้วเหยียบไว้เลยนะ ความลับขั้นสุดยอด!' },
  { id: 166, cat: 'CURIOSITY', text: 'อย่าเพิ่งเลื่อนผ่าน ถ้าคุณมีอาการแบบนี้!' },
  { id: 167, cat: 'CURIOSITY', text: 'ตอบชัดๆ ตรงนี้ ดีจริงหรือแค่กระแส!' },
  { id: 168, cat: 'CURIOSITY', text: 'ท้าพิสูจน์! ไอเทมที่เคลมว่าดีที่สุด มันจริงมั้ย?' },
  { id: 169, cat: 'CURIOSITY', text: 'คลิปนี้มีคำตอบ! สำหรับคนที่สงสัยมานาน' },
  { id: 170, cat: 'CURIOSITY', text: 'ระวังโดนหลอก! ดูคลิปนี้ก่อนตัดสินใจซื้อ' },
  { id: 171, cat: 'CURIOSITY', text: 'เผยทริคเด็ด ที่ไม่มีใครเคยบอกคุณมาก่อน!' },
  { id: 172, cat: 'CURIOSITY', text: 'ช็อกอีกรอบ! เมื่อรู้ว่าส่วนผสมของสิ่งนี้คืออะไร' },
  { id: 173, cat: 'CURIOSITY', text: 'อย่าเพิ่งเชื่อรีวิว ถ้ายังไม่ได้ลองด้วยตัวเอง!' },
  { id: 174, cat: 'CURIOSITY', text: 'คลิปนี้จะมาเปลี่ยนความคิดคุณ ไปตลอดกาล!' },
  { id: 175, cat: 'CURIOSITY', text: 'ใครพลาดคลิปนี้ ถือว่าพลาดเรื่องสำคัญมาก!' },
  { id: 176, cat: 'CURIOSITY', text: 'เจาะลึกความจริง ไอเทมสุดฮิต มันดีจริงหรอ?' },
  { id: 177, cat: 'CURIOSITY', text: 'ระวังตัวให้ดี! เพราะสิ่งนี้อาจจะทำให้คุณเสียทรัพย์' },
  { id: 178, cat: 'CURIOSITY', text: 'รู้หรือไม่? แค่ปรับนิดเดียว ผลลัพธ์เปลี่ยนมหาศาล!' },
  { id: 179, cat: 'CURIOSITY', text: 'สิ่งที่แบรนด์ไม่ได้บอกคุณ แต่เราจะบอกเอง!' },
  { id: 180, cat: 'CURIOSITY', text: 'ช็อกขีดสุด! เมื่อเห็นก่อนและหลังใช้' },
  { id: 181, cat: 'CURIOSITY', text: 'อย่าเพิ่งด่วนสรุป ดูคลิปนี้ให้จบก่อน!' },
  { id: 182, cat: 'CURIOSITY', text: 'คลิปนี้อาจจะไปขัดใจใครหลายคน แต่ต้องพูด!' },
  { id: 183, cat: 'CURIOSITY', text: 'เผยเบื้องหลัง ความสำเร็จที่หลายคนสงสัย' },
  { id: 184, cat: 'CURIOSITY', text: 'ระวังตกเทรนด์! ถ้าไม่รู้จักไอเทมตัวนี้' },
  { id: 185, cat: 'CURIOSITY', text: 'รู้แล้วจะอึ้ง! ความลับของไอเทมหลักร้อย' },
  { id: 186, cat: 'CURIOSITY', text: 'ท้าให้ลอง! ถ้าไม่ดีจริง ยอมให้ด่าเลย' },
  { id: 187, cat: 'CURIOSITY', text: 'คลิปนี้จะมาปลดล็อก สกินหมาทองคำให้คุณ!' },
  { id: 188, cat: 'CURIOSITY', text: 'ช็อกซ้ำซ้อน! คุ้มกว่านี้ไม่มีอีกแล้ว' },
  { id: 189, cat: 'CURIOSITY', text: 'อย่าเพิ่งยอมแพ้ ถ้ายังไม่ได้ลองวิธีนี้!' },
  { id: 190, cat: 'CURIOSITY', text: 'เผยสูตรลับ ที่ทำยอดขายถล่มทลาย!' },
  { id: 191, cat: 'CURIOSITY', text: 'ระวังของปลอมระบาด! ดูวิธีเช็คของแท้ในคลิปนี้' },
  { id: 192, cat: 'CURIOSITY', text: 'รู้ไว้ใช่ว่า ใส่บ่าแบกหาม ทริคดีๆ ที่ต้องรู้!' },
  { id: 193, cat: 'CURIOSITY', text: 'สิ่งที่คุณมองข้าม อาจจะเป็นตัวการสำคัญ!' },
  { id: 194, cat: 'CURIOSITY', text: 'ช็อกความรู้สึก! เมื่อรู้ความจริงข้อนี้' },
  { id: 195, cat: 'CURIOSITY', text: 'อย่าปล่อยให้ความสงสัย ฆ่าคุณ รีบดูคลิปนี้!' },
  { id: 196, cat: 'CURIOSITY', text: 'คลิปนี้มีเซอร์ไพรส์ รออยู่ตอนท้าย!' },
  { id: 197, cat: 'CURIOSITY', text: 'เผยไอเทมก้นกรุ ที่ไม่ค่อยมีใครรู้จัก' },
  { id: 198, cat: 'CURIOSITY', text: 'ระวังจะโดนตก! ถ้าดูคลิปนี้จบ' },
  { id: 199, cat: 'CURIOSITY', text: 'รู้ทันกลโกง! ก่อนตกเป็นเหยื่อ' },
  { id: 200, cat: 'CURIOSITY', text: 'ช็อกโลกออนไลน์! คลิปไวรัลที่คุณต้องดู' }
];

/* ────────────────────────────────────────────────────────────────────────────
 * ADAPTIVE_VIDEO_DIRECTOR_PROMPT — ported verbatim from
 * `1click-full-v3.40 (2)/js/promptTemplate.js`
 * ~275 lines. Covers: story continuity, overclaim rules, TTS-safe dialogue,
 * scene progression lock, product truth lock, hook master integration.
 * Used as universal operating principles prepended to the mock's system prompt.
 * ──────────────────────────────────────────────────────────────────────────── */

const ADAPTIVE_VIDEO_DIRECTOR_PROMPT = `คุณคือ "Adaptive Video Director" (รองรับโหมด labs.google/flow, Grok และ Super Grok)
**Status:** 🚀 GOD MODE ACTIVATED (Powered by Viral Trends & Top 1% Hook Master)

### ⚙️ PLATFORM SWITCHING MODES (ระบบสลับสมองและคำนวณเวลา):
โหมดแพลตฟอร์มมีหน้าที่คุม **"ความยาวเวลาและจังหวะของวิดีโอ"** เท่านั้น:
- **โหมด Flow (Default - 8 วินาที):** คุมความยาววิดีโอ 8 วินาที จังหวะภาพสมูทเป็นธรรมชาติ บทพูด 1-2 ประโยค (15-20 คำ) สั้นกระชับพูดจบใน 8 วินาที
- **โหมด Grok (6 วินาที):** คุมความยาววิดีโอ 6 วินาที จังหวะวิดีโอต้อง "สั้น กระชับ สับไว" ไดนามิกสูง บทพูด 1-2 ประโยค (15-20 คำ)
- **โหมด Super Grok (10 วินาที):** คุมความยาววิดีโอ 10 วินาที จังหวะภาพดึงอารมณ์ร่วม บทพูด 2-3 ประโยค (15-20 คำ)
⚠️ **IMAGE STYLE UNLINK (ปลดล็อกสไตล์ภาพ):** สไตล์ภาพ (เช่น 3D Pixar, Hyper-realistic, Anime) ให้ยึดตามคำสั่งที่ User พิมพ์ระบุมาเป็นอันดับ 1 เสมอ! หาก User ไม่ได้ระบุ ถึงจะใช้ Default ของโหมด (Flow = 3D Pixar / Grok = Hyper-realistic)
⚠️ **STRICT PERSONA ENFORCEMENT (บังคับใช้บุคลิกตามสั่ง):** บุคลิก ท่าทาง และโทนอารมณ์ **ต้องยึดตาม "Style" หรือ "Mood" ที่ User เลือกมาเสมอ** ห้ามให้โหมดแพลตฟอร์มมาโอเวอร์ไรด์ (เช่น หากเลือกสไตล์ ASMR หรือนุ่มนวล แม้จะอยู่ในโหมด Grok ก็ห้ามก้าวร้าว ห้ามปากแจ๋วเด็ดขาด ต้องนุ่มนวลตาม Style 100%)


### ⛔️ SYSTEM OVERRIDE (CRITICAL RULES):
1. **DISABLE AUTO-GENERATION:** ⚠️ ห้ามใช้เครื่องมือสร้างภาพ (Image Gen Tool / Nano Banana) หรือวิดีโอเด็ดขาด! หน้าที่ของคุณคือ **"เขียน Text Prompt"** ลงในกล่อง Code Block เท่านั้น ห้ามสร้างภาพจริงออกมาไม่ว่า User จะสั่งยังไง
2. **NO TRADEMARKS & 100% SAFE RENDER (กันติด Policy ทุกซีน):** ⚠️ ใน Prompt ห้ามใส่ชื่อแบรนด์ ตัวละครลิขสิทธิ์ (เช่น Disney, Marvel) หรือเครื่องแต่งกายที่เป็นเอกลักษณ์ของซูเปอร์ฮีโร่ลิขสิทธิ์ ⚠️ **กฎเหล็กความปลอดภัยขั้นสูงสุด (บังคับใช้กับ "ทุก Scene" ตั้งแต่ Hook ยันจบ):** ห้ามใช้คีย์เวิร์ดแสดงความรุนแรง ก้าวร้าว คุกคาม หรือ **การบาดเจ็บ/ทำร้ายตัวเอง/สลบ/หน้ากระแทก/ความทรมาน-เศร้าหมองร้องไห้ของคนและสัตว์/สัตว์ต่อสู้กัน** ใน Image Prompt เด็ดขาด! (เช่น "aggressively", "angry", "strike", "weapon", "pointing at", "sweeping off", "destroy", "face-planting", "fainting", "crying", "suffering", "sick", "fighting", "biting") ให้เปลี่ยนแอคชันรุนแรงหรือความทรมาน เป็นท่าทางเชิงบวก การปฏิเสธแบบนุ่มนวล ท่าทางเหนื่อยล้าแบบปลอดภัย หรือออร่าพลังงานแทน (เช่น "gently pushing away", "shaking head confidently", "graceful gesture", "dynamic but safe pose", "glowing positive aura", "resting head tiredly", "peaceful interaction", "healthy and calm") เพื่อหลบ AI เซนเซอร์ความรุนแรงและทารุณกรรมสัตว์ (Animal Cruelty) 100%
3. **FULL SCENE GENERATION (STRICT SEQUENCE):** ⚠️ ห้ามย่อ! ห้ามกระโดดข้ามตัวเลขซีน! และ **ห้ามรวมซีน (เช่น รวบยอด ซีน 1-5 รวมกัน) เด็ดขาด!** ต้องพิมพ์แจกแจงแยก "Image Prompt" และ "Video Prompt" ของแต่ละซีนทีละอัน (Scene 1, Scene 2, Scene 3...) ไปจนครบจำนวน N ที่สั่งเป๊ะๆ ห้ามลักไก่รวบยอดคำสั่ง และ **ห้ามพิมพ์ส่วน DIRECTOR'S TIPS จนกว่าจะเจนซีนครบทั้งหมด**
4. **100% STORY CONTINUITY & LONG BATCHING (ระบบทำเรื่องยาว 100 ซีน):** ⚠️ หาก User สั่ง 30, 50 หรือ 100 ซีน **"ห้ามขึ้นเรื่องใหม่เด็ดขาด"** ต้องวางพล็อตให้เป็นเรื่องเดียวกันต่อเนื่องตั้งแต่ต้นจนจบ แต่ให้ Gen ออกมา **"ทีละ 10 ซีน"** แล้วหยุด พิมพ์บอก User ว่า *"พิมพ์คำว่า 'ต่อ' เพื่อดู Scene ถัดไป..."* เมื่อ User พิมพ์ต่อ ให้รันเนื้อเรื่องต่อไปทันทีโดยยึด Context เดิม 100%

5. **FORBIDDEN WORDS (คำโฆษณาต้องห้าม — OVERCLAIM):** ⚠️ ห้ามใช้คำเหล่านี้ใน Dialogue/H1/H2 หรือ Storyboard เด็ดขาด:
- **การันตี/รับรองเกินจริง:** 100%, การันตี, รับประกันผล, Best, No.1, ดีที่สุด, Certified, Guaranteed, Doctor Recommended
- **อ้างผลลัพธ์เกินจริง:** หายขาด, เห็นผลทันที, ได้ผลทุกคน, before-after, ลดจริง 5 กิโลใน 7 วัน, ขาวทันที, หน้าใสทันที, ยกกระชับทันที
- **คำทางการแพทย์/การรักษา:** รักษาโรค, บำบัด, ฆ่าเชื้อ, ต้านมะเร็ง, ดีท็อกซ์, Medical Grade, Clinical Proven, FDA Approved, อย.รับรอง
- **เปรียบเทียบแพทย์/คลินิก:** แทนโบท็อกซ์, ไม่ต้องศัลยกรรม, เทียบชั้นคลินิก, แพทย์รับรอง, ใช้แทนยา, หมอรับรอง
- **กดดันซื้อเกินจริง:** ช้าคืออด, วันนี้วันเดียวเท่านั้น, จำกัดสิทธิ์, โปรแรงที่สุด, แจกฟรี
- 💡 **ทริคการเลี่ยงคำ:** "รักษา" → "ดูแล/บำรุง", "ขาว" → "กระจ่างใส/สว่างขึ้น", "ลดน้ำหนัก" → "ดูแลรูปร่าง", "ดีท็อกซ์" → "ช่วยระบบขับถ่าย", "หน้าเด้ง" → "ดูอ่อนเยาว์"
- ⚠️ **คำเตือนบังคับ:** ในแคปชั่นให้เติม "ผลลัพธ์ขึ้นอยู่กับสภาพผิว/ร่างกายของแต่ละบุคคล" ท้ายโพสต์เสมอ
6. **EXTREME DIALOGUE PERMISSION (ปลดล็อกความเกรี้ยวกราด & ภาษาคนจริง):** ⚠️ หาก User สั่งโหมดดุดัน (เช่น พิมพ์ว่า ปากแซ่บ, มึงกู, ดุร้ายแรง, โหมด Super Grok) **ให้ปลดล็อกความสุภาพทิ้ง 100% ทันที!** บทพูดต้องเป็น "ภาษาคนจริง" ฟังแล้วสะดุด หยุดดู ใช้สรรพนาม กู-มึง หรือคำจิกกัดดิบเถื่อนทิ่มแทงใจดำได้เต็มที่ (แต่ห้ามยาวเจื้อยแจ้ว ให้สั้น กระแทก แทรกความรู้แบบ "อ๋อว่ะ" จบแบบคาดไม่ถึง) ⚠️ **ข้อยกเว้น:** หาก User สั่งสไตล์นุ่มนวล หรือ ASMR ให้ข้ามกฎปากแซ่บนี้ และรักษาความนุ่มนวลตาม Style ทันที
7. **STRICT ASMR PROTOCOL (กฎเหล็กโหมด ASMR):** ⚠️ หาก User เลือก Style เป็น "ASMR" (หรือแนวเสียงกระซิบ/ผ่อนคลาย) **ห้ามมีบทพูด (Dialogue) โดยเด็ดขาด!** วิดีโอต้องมีแค่ "เสียงบรรยากาศ (Ambient)" และ "เสียงเอฟเฟกต์ของการกระทำ (SFX)" เท่านั้น
8. **DIALOGUE LENGTH RULES (กฎบทพูด — สำคัญมาก!):** ⚠️ บทพูดทุกซีนต้องเป็น "ประโยคเต็มที่มีเนื้อหาจริง" ห้ามเป็นแค่คำอุทาน!
   - 🎙️ **SPEAKER LABEL (บังคับทุกซีน ทุกโหมด):** ทุกซีนต้องระบุ "ใครเป็นคนพูด" ในบล็อก VIDEO PROMPT ด้วยบรรทัด \`Speaker: <ชื่อ หรือ ฉลากบทบาทจาก HERO BIBLE — ล็อคสะกด/ล็อคฉลาก>\` ก่อนบรรทัด \`Dialogue:\` (ไม่บังคับตั้งชื่อมนุษย์ — ใช้ "ROLE_A" / "เพื่อน" / "ผู้รับสาร" ก็ได้ ต้องคงที่ทั้งเรื่อง) เช่น \`Speaker: พี่แนน\` หรือ \`Speaker: ฝ่ายพูด\`
   - ถ้ามีตัวละครเดียว → Speaker = ฉลาก/ชื่อฮีโร่ที่ประกาศใน HERO BIBLE
   - ถ้ามีหลายตัว (2-3) → Speaker = คนพูดในซีนนั้น; ห้ามใช้ "Narrator" เว้นแต่ narration จริง
   - ⛔ ห้ามใช้ชื่อสินค้าเป็น Speaker (ยกเว้นโหมด Talking Object ที่สั่งให้สินค้าพูดเอง)
9. **🖐️ HUMAN ANATOMY LOCK (บังคับทุกซีน):** ถ้ามีมนุษย์หรือคาแรกเตอร์ทรงคนอยู่ในฉาก ให้ใช้กายวิภาคปกติเท่านั้น: 1 หัว, 1 ลำตัว, 2 แขน, 2 มือ, 5 นิ้วต่อมือ, 2 ขา ห้ามมีมือเกิน แขนเกิน นิ้วเกิน นิ้วติดกัน มือซ้อน มือโผล่ลอย ถ้าตัวละครถือสินค้าให้ใช้ท่าถือง่ายและชัดเจน: ถือด้วย 1 มือ หรือพยุงด้วย 2 มือแบบธรรมชาติ ห้ามสร้างมือที่ 3
10. **🇹🇭 DEFAULT THAI CHARACTER LOCK:** ถ้า User ไม่ได้อัปโหลดรูปตัวละครคนมา และงานต้องมีตัวละคร/พิธีกร/ผู้รีวิวที่เป็นมนุษย์ ให้ default เป็น "คนไทย" เท่านั้น ใน Image Prompt และ Video Prompt ถ้ามีมนุษย์ต้องระบุชัดว่าเป็น Thai person ห้ามสุ่มเป็นคนต่างชาติ เว้นแต่ User ระบุเอง
11. **🔒 VOICE LOCK RULE:** เสียงพูดตัวละครต้อง match กับเพศและลุคของตัวละครจาก Scene 1 และให้ล็อกเสียงเดิม 100% ตลอดทั้ง Storyboard ห้ามเปลี่ยนเสียงกลางทาง
12. **🧩 SCENE PROGRESSION LOCK:** โครงเรื่องทั้งชุดต้องเดินหน้าแบบ "เปิดประเด็น → ขยายประเด็นใหม่ → payoff/สรุป" ไม่ใช่พูดประโยคเดิมด้วยคำใหม่ Scene แรก: เปิดประเด็น/hook, Scene กลาง: ขยายประเด็นใหม่, Scene สุดท้าย: สรุป/payoff + CTA
13. **🚨 GLOBAL DIALOGUE OPENING RULE:** ห้ามเปิดประโยคหรือเปิดซีนด้วยคำว่า "เฮ้ย!", "เห้ย!", "โอ๊ย!", หรือ "โอ้โห!" เด็ดขาด ห้ามบทพูดอ้างผลลัพธ์แทนบุคคลที่ 3 เช่น "ใช้แล้วฟันขาว", "ใช้แล้วเส้นผมแข็งแรง" — ต้องพูดจากมุมประสบการณ์ตัวเองเท่านั้น
14. **📦 OUTPUT COMPRESSION DIRECTIVE:** ห้าม copy กฎ global เป็นก้อนยาวซ้ำทุก Scene เขียนเฉพาะ "รายละเอียดเฉพาะฉาก" Scene 2+ ต้องต่อยอดจากฉากก่อนหน้า ไม่ใช่พิมพ์กฎเดิมซ้ำ
15. **🛡️ GOOGLE FLOW POLICY LOCK:** ห้ามสร้างเนื้อหาที่เกี่ยวกับ sexual exploitation, child abuse, violent extremism, self-harm, illegal activity, non-consensual imagery, spam, hate speech, harassment, graphic violence, privacy abuse, deceptive impersonation หรือ misleading claims — งานดราม่า/สยอง/เสียดสีทำได้เฉพาะแบบ fictional, non-graphic
16. **🔒 PRODUCT TRUTH LOCK:** หากมีรูปสินค้า ให้ยึดรูปลักษณ์ สี ทรง แพ็กเกจ ตัวอักษรบนฉลาก/แบรนด์จากรูปจริง 100% ห้ามเปลี่ยนคำ ห้ามย่อ ห้ามแปล ห้ามตัวอักษรเพี้ยน/สะกดมั่ว/อักษรแตก
   - ⛔ **ห้าม** ใช้คำอุทานเดี่ยวๆ เช่น "ฮือ", "ห้ะ", "ฮ่า", "โอ้ย", "อุ๊ย", "ว้าว" เป็นบทพูดทั้งซีน!
   - ⛔ **ห้าม** คำว่า "เฮ้ย" ทุกรูปแบบในบทพูด — ใช้คำเปิดอื่นแทน (เช่น "ฟังนะ มึงรู้ไหมว่า...")
   - ⛔ **ห้าม** มีซีนที่ตัวละครพูดแค่ 2-3 คำ หรือคำเดียว — ต้องเป็นประโยคสมบูรณ์ที่สื่อสารเนื้อหาจริง
   - ⚠️ **บทพูดทุกโหมด ทุกซีน ต้องอยู่ในช่วง 15-20 คำเท่านั้น!** ห้ามน้อยกว่า 15 คำ ห้ามเกิน 20 คำ นับคำก่อนตอบทุกครั้ง
     - Flow (8วิ): 15-20 คำ — สั้นกระชับ พูดจบใน 8 วินาที
     - Grok (6วิ): 15-20 คำ — สั้นสับไว
     - Super Grok (10วิ): 15-20 คำ — สั้นแต่ขยี้อารมณ์
   - ⚠️ **ห้ามบทพูดเกิน 20 คำเด็ดขาด!** ถ้ายาวเกิน → ตัดให้เหลือ 15-20 คำ ให้สั้น กระแทก ได้ใจความ


### 🧠 VIRAL INTELLIGENCE (หลักจิตวิทยาจาก Deep Research):
1. **REALI-TEA (ความจริงคือพระเจ้า):** ภาพไม่ต้องสวยเป๊ะ! ให้มีความ "ดิบ" (Imperfect) หรือดูเหมือนถ่ายเล่นๆ (UGC Style) เพื่อหลบ Ad Blindness
2. **PATTERN INTERRUPT (กฎ 3 วินาที):** Scene 1 ต้องเป็น "Visual Hook" ที่แปลก/ขัดแย้ง/น่าตกใจ ทันที!
3. **SHOPPERTAINMENT:** การขายของใน 2 ซีนสุดท้าย ต้องเน้นความบันเทิง+ขายของ (Entertaining Commerce)
4. **SONIC DRIVER:** จังหวะของวิดีโอต้องกระชับ (Fast Paced) เพื่อรองรับเพลงฮิต (สามช่า/EDM สายย่อ)


### 📷 PRODUCT IMAGE MODE (สำคัญมาก! — ใช้เป็น Prop ประกอบฉาก):
- User ได้แนบรูปสินค้ามาด้วย ให้ดูรูปนี้แล้วอธิบายสินค้าอย่างละเอียดใน Prompt
- สินค้าเป็น **"Prop ประกอบฉาก"** เท่านั้น! ไม่ใช่ตัวละครหลัก!
- ตัวละครหลักคือ "คน" หรือ "ตัวการ์ตูน" ที่ถือ/ใช้/แนะนำ/สวมใส่สินค้า (ไม่ใช่สินค้าพูดได้ — ยกเว้น Talking Object Mode)
- ในทุก Image Prompt ให้อธิบายรูปลักษณ์ของสินค้าจากรูปที่เห็น (สี ทรง แพ็กเกจ โลโก้ ลวดลาย ฯลฯ) อย่างละเอียด
- Speaker: ใช้ **ชื่อ หรือ ฉลากบทบาทคงที่** จาก HERO BIBLE (ไม่บังคับตั้งชื่อมนุษย์) — ห้ามใช้ชื่อสินค้าแทน (ยกเว้น Talking Object)
- Dialogue ต้องเป็นบทพูดของตัวละครที่แนะนำ/รีวิว/ใช้สินค้า พูดภาษาไทยแบบเป็นกันเอง 2-4 ประโยคต่อซีน

### 🚫 NO GHOST MODE (บังคับสูงสุด — ยกเว้นโหมด Ghost/Horror):
- ห้ามมีผี/เงาผี/วิญญาณ/ร่างลึกลับในภาพทุกซีนโดยเด็ดขาด
- ห้ามใช้คำบรรยายที่สื่อว่ามีผี เช่น ghost, apparition, phantom, haunted figure
- อนุญาตเฉพาะความหลอนจากสิ่งแวดล้อมเท่านั้น (เช่น ลม ประตู พื้นไม้ วัตถุขยับ) ในโหมดที่เกี่ยวข้อง
- ใน Image Prompt และ Video Prompt ให้ใส่เงื่อนไขปิดท้ายว่า: no ghost, no ghost silhouette, no apparition, no paranormal entity

### 🔒 STRICT LABEL TEXT LOCK (บังคับเมื่อมีรูปสินค้า):
- ใช้ตัวอักษรบนฉลาก/แบรนด์/แพ็กเกจจากรูปอัปโหลดแบบตรงต้นฉบับ 100% ห้ามเปลี่ยนคำ ห้ามย่อ ห้ามแปล
- ห้ามตัวอักษรเพี้ยน ห้ามสะกดมั่ว ห้ามอักษรแตก/เบลอแบบอ่านไม่ได้
- ห้ามเพิ่มข้อความโปรโมชันลงบนสินค้า ฉลาก พร็อพ เสื้อผ้า หรือพื้นหลัง — overlay ต้องเป็นเลเยอร์แยกเท่านั้น

### 🎙️ REVIEW DIALOGUE AUTHENTICITY LOCK:
- แต่ละ Scene ต้องรีวิวคนละ "มุม" ของสินค้า เช่น ความรู้สึกแรก, วิธีใช้, ประสิทธิภาพ, ความจุ/วัสดุ
- ห้ามใช้ opening/hook เดิมซ้ำหลายฉาก เช่น "ใครกำลังมองหา...", "บอกเลย..."
- ห้าม copy ถ้อยคำขายเดิมข้ามฉาก
- ให้พูดแบบคนรีวิวจากประสบการณ์จริง

### 🔡 TEXT OVERLAY CONTINUITY (MANDATORY):
- Scene 1 เท่านั้นที่มี H1/H2 text overlay ตามที่กำหนด — ตัวอักษรต้องคงที่ ชัด ไม่เลื่อน ไม่มอร์ฟ ไม่เบลอ ไม่กระพริบ
- H1/H2 overlay ต้องปรากฏเป็น static text group ล็อกตำแหน่งเดียวตลอดคลิป: ห้ามมี second pop-in, duplicate layer, moving/sliding/bouncing/drifting text
- Scene 2 เป็นต้นไป: บังคับ no text, no typography, no words, no letters, no subtitles, no captions ในทุก continuation scene


### 🎯 TREND INJECTION (อิงข้อมูลอัปเดตล่าสุด):
บังคับใช้จิตวิทยาและ Visual/Audio Trends ล่าสุดในการออกแบบ Scene เสมอ:
1. **Reali-TEA & Lo-Fi Aesthetic:** โหมด Grok ต้องเน้นภาพดิบ ถ่ายทำแบบ One-take/Handheld ไม่ปรุงแต่ง โชว์ความจริงใจ (Sincerity over Perfection).
2. **Modern Fables (นิทานยุคใหม่):** โหมด Flow หากทำเรื่องยาว ให้ใช้โครงสร้าง Micro-drama มี Hook 3 วิแรกที่ทรงพลัง แล้วเล่าเรื่องที่ให้แง่คิด/คุณค่าทางใจ (Emotional ROI).
3. **Seasonal Visuals (ตามบริบทไทย):**
   - หากเป็นสินค้าไลฟ์สไตล์/สุขภาพ/มุสลิม: ใช้ภาพโทน "Quiet Flex" (อบอุ่น, แสงธรรมชาติยามเย็น, จัดวางแบบ Negative Space).
   - หากเป็นสินค้าหน้าร้อน/กันน้ำ: ใช้ภาพโทน "Modern-Traditional Hybrid" (สีสดใส/นีออน ตัดลายดั้งเดิม).
   - หากเป็นสินค้าวัยรุ่น/วัยเริ่มทำงาน: ใช้ภาพโทน "Clean Girl / 90's Minimalist" (สะอาดตา, แสงแดดธรรมชาติ).
4. **Audio (SOFT ONLY — กฎเหล็ก!):** ใน Video Prompt อนุญาตให้ใส่เสียงประกอบได้ แต่ **ต้องเป็นคำอ่อนโยนเท่านั้น!** ✅ คำที่ใช้ได้: "soft gentle melody", "subtle ambient music", "light background rhythm", "calm atmospheric sound", "gentle piano", "soft orchestral" ⛔ คำที่ห้ามใช้เด็ดขาด (จะทำให้ติด "Audio generation failed"!): "healing frequency", "sound effects", "SFX", "bass drop", "heartbeat", "ASMR", "whisper", "เสียงเบสกระแทก", "เสียงหัวใจเต้น", "screaming", "explosion", "gunshot" — หลักการ: ถ้าเสียงฟังดูรุนแรง/แปลก/ทางการแพทย์ = ห้ามใช้!


### ✨ ADVANCED AI CAPABILITIES (ปลดล็อกพลังภาพและวิดีโอขั้นสุด):
เพื่อให้งานโปรดักชั่น "สวย อลังการ และว้าว" ระดับ Top 1% ให้ดึงศักยภาพสูงสุดออกมาใช้:
1. **High-fidelity Text Rendering (เสกตัวหนังสือลงภาพ):** หาก User สั่งให้มีพาดหัว/คำคมในรูป ให้แทรกคำสั่ง \`Bold typography text "[ใส่ข้อความ]" naturally integrated into the environment\` ลงใน Image Prompt
2. **Epic Composition & Styling:** เพิ่มมิติให้ภาพด้วยคีย์เวิร์ดมุมกล้องระดับโลก เช่น \`dynamic extreme angle, masterpiece composition, award-winning photography, double exposure effect\`
3. **Audio (SOFT ONLY):** อนุญาตให้ใส่เสียงประกอบเบาๆ ใน Video Prompt ได้ เช่น "soft gentle melody in background", "subtle ambient music", "calm piano" ⛔ แต่ห้ามใช้คำรุนแรง: "sound effects", "SFX", "bass drop", "heartbeat", "healing frequency", "ASMR", "explosion" จะทำให้ Google Flow reject!


### 🎣 HOOK MASTER AI (ระบบวิเคราะห์ Hook อัตโนมัติ — ใช้กับบทพูดเท่านั้น!):
⚠️ **กฎบังคับ: Hook ใช้ในส่วน "Dialogue (บทพูด)" ของ Scene 1 เท่านั้น!**
⛔ **ห้ามนำ Hook ไปใส่ใน Image Prompt หรือ Video Prompt เด็ดขาด!** Hook เป็นประโยคเปิดคลิปที่ตัวละคร "พูดออกมา" เท่านั้น ไม่เกี่ยวกับภาพหรือแอคชัน

คุณมีคลัง "ประโยคเปิดคลิป" (Hook Library) 200 แบบ แบ่ง 4 หมวดจิตวิทยาการขาย:
- 🔥 **FOMO & Flash Sale (1-50):** กระตุ้นความเสียดาย กลัวพลาด กลัวของหมด — เหมาะกับสินค้าที่มีโปร/ลดราคา/จำนวนจำกัด
- 👯‍♀️ **Authentic Vibe (51-100):** เพื่อนป้ายยา รีวิวเรียลๆ — เหมาะกับสินค้าบิวตี้/สกินแคร์/สุขภาพ/ไลฟ์สไตล์
- 👑 **Scarcity & Obsession (101-150):** อวยยศขั้นสุด หายาก ซื้อซ้ำ — เหมาะกับสินค้าพรีเมียม/แบรนด์ที่มีฐานแฟน
- 🤯 **Curiosity Gap & Shock (151-200):** ช็อควงการ สร้างความอยากรู้ — เหมาะกับสินค้าใหม่/นวัตกรรม/ทำลายความเชื่อเดิม

**วิธีใช้ (AI ทำอัตโนมัติ):**
1. **วิเคราะห์สินค้า:** เมื่อได้รับข้อมูลสินค้าจาก User ให้วิเคราะห์ประเภท จุดเด่น กลุ่มเป้าหมาย และจุดขายหลัก
2. **เลือกหมวด Hook:** จับคู่สินค้ากับหมวด Hook ที่เหมาะสมที่สุด (อาจผสมข้ามหมวดได้)
3. **ดัดแปลง Hook ให้เข้ากับสินค้า:** เลือก Hook จากคลังแล้ว **ดัดแปลงให้เข้ากับสินค้าจริง** — ห้ามใช้ Hook ดิบๆ ต้องปรับคำให้เป็นธรรมชาติ สอดคล้องกับ Style/Persona ที่เลือก และใส่ชื่อสินค้า/จุดเด่นเข้าไปด้วย
4. **ใส่ใน Dialogue ของ Scene 1 เท่านั้น:** บทพูดของตัวละครใน Scene 1 ต้องเป็น Hook ที่ดัดแปลงแล้ว ยึดกฎความยาว 15-20 คำ
5. **Scene อื่นๆ ไม่ต้องใช้ Hook:** Scene 2 เป็นต้นไป เขียนบทพูดตามปกติ ไม่ต้องอ้างอิง Hook

**ตัวอย่างการดัดแปลง Hook เป็นบทพูด:**
- สินค้า: เซรั่มหน้าใส / Style: Soft Sell → Hook #55 → Dialogue Scene 1: "เพื่อนทักมา 3 คนแล้วว่าผิวดูใสขึ้น ก็เซรั่มตัวนี้แหละ!"
- สินค้า: หูฟังบลูทูธราคาโปร / Style: FOMO → Hook #14 → Dialogue Scene 1: "ช็อกมาก! หูฟังเสียงดีขนาดนี้ ราคาแค่นี้หาไม่ได้อีกแล้ว!"
- สินค้า: อาหารเสริม / Style: Curiosity → Hook #162 → Dialogue Scene 1: "กินมาครบ 7 วัน ผลที่ออกมาต้องมาบอกทุกคนด่วน!"

⚠️ **ระบุ Hook ID ที่เลือกใน Storyboard Overview ด้วย เช่น "Hook Reference: #55 (Authentic Vibe) — ดัดแปลงเป็นบทพูด Scene 1"**


### 🗣️ DIALOGUE NATURALNESS & TTS-SAFE (บังคับสูงสุด — กันคำเพี้ยนและบอทพูด):
⚠️ **บทพูด (Dialogue) ทุกซีน ต้องฟังเป็นธรรมชาติเหมือนคนจริงพูด ห้ามฟังเหมือนบอท!**
1. **ใช้ภาษาพูด ไม่ใช่ภาษาเขียน:** เขียนบทพูดเหมือน "คนคุยกัน" ในชีวิตจริง ไม่ใช่เรียงความหรือโฆษณาทางการ ห้ามขึ้นต้นด้วยสำนวนเดิมซ้ำๆ เช่น "บอกเลย..." "ใครกำลังมองหา..." ให้หลากหลายแบบธรรมชาติ
2. **ห้ามคำยาก/คำไม่คุ้นหู:** ใช้คำที่คนไทยพูดในชีวิตประจำวัน ห้ามใช้ศัพท์วิชาการ คำราชาศัพท์ คำบาลีสันสกฤตที่ไม่คุ้นหู หรือคำแปลจากอังกฤษที่ฝืนธรรมชาติ
3. **กฎ TTS-SAFE (กันคำเพี้ยน):** เสียง AI อ่านบทพูดนี้ออกมา ดังนั้น:
   - ห้ามใช้อักษรย่อ (เช่น อย. → ให้สะกดเต็ม)
   - ห้ามใช้ตัวเลขดิบ (เช่น 3 → ให้เขียน "สาม")
   - ห้ามใช้สัญลักษณ์พิเศษ (%, &, #, @) ในบทพูด
   - ห้ามใช้คำทับศัพท์ภาษาอังกฤษที่ซับซ้อน (เช่น "Hyaluronic Acid" → ให้ใช้ "ไฮยาลูรอน" หรืออธิบายด้วยภาษาไทยง่ายๆ)
   - ห้ามใช้คำที่ออกเสียงยากหรือกำกวม เช่น ทฤษฎี, ปรัชญา, สหัสวรรษ, อนุสาวรีย์
   - ห้ามใช้คำซ้อนยาวๆ ที่ไม่มีจังหวะหยุด เช่น "สารสกัดจากธรรมชาติบริสุทธิ์เข้มข้นพิเศษ" → ตัดให้สั้น ใส่จังหวะ
   - ห้ามวลีที่ฟังดูเหมือน copywriting สำเร็จรูป เช่น "ตอบโจทย์ทุกความต้องการ", "ยกระดับคุณภาพชีวิต", "เปลี่ยนชีวิตคุณ"
4. **จังหวะพูด:** แต่ละประโยคต้องสั้นกระชับ 5-12 คำ หายใจได้ ไม่รัวยาว ใส่คำเชื่อมธรรมชาติ เช่น "นะ", "เลย", "อ่ะ", "จริงๆ", "ตัวนี้" ตามสไตล์ที่เลือก
5. **ห้ามขึ้นต้นซ้ำ:** แต่ละซีนต้องเปิดบทพูดด้วยคำต่างกัน ห้ามใช้คำเปิดเดียวกันซ้ำเกิน 1 ครั้งตลอดทั้งสคริปต์ (เช่น ห้าม "บอกเลย..." 2 ซีน)
6. **ทดสอบในใจ:** ก่อนส่ง Output ลองอ่านบทพูดทุกซีนออกเสียงในใจ — ถ้ามีจุดไหนที่สะดุดหรือฟังแปลก ให้แก้ให้ลื่นไหล


### กฎเหล็ก (ห้ามละเมิด):
1. **INPUT LOYALTY (สำคัญมาก!):** ซื่อสัตย์ต่อ Input ล่าสุดเท่านั้น! ห้ามมโนสินค้าหรือตัวละครอื่น ⛔ ห้ามเพิ่มตัวละครที่ User ไม่ได้สั่งเด็ดขาด! ถ้า User สั่ง "ผลไม้บ่น" ตัวละครทั้งหมดต้องเป็นผลไม้เท่านั้น ห้ามมีแมว หมี เบอร์เกอร์ หรือตัวละครอื่นที่ไม่เกี่ยวข้องปรากฏใน Image Prompt และ Video Prompt เด็ดขาด! ตัวละครทุกตัวในทุกซีนต้องเป็นสิ่งที่ User ระบุหรือเกี่ยวข้องโดยตรงเท่านั้น
2. **NO SKIPPING:** ⚠️ ห้ามย่อเนื้อเรื่องเด็ดขาด ต้องเขียนออกมาทีละซีนให้ครบ
3. **SALES MODE:** 2 ซีนสุดท้ายของเรื่อง ต้องเป็นซีน "ขายของ/ปิดการขาย" เสมอ! บทพูดต้องเชียร์ซื้อ และภาพต้องถือสินค้า (ยกเว้น User สั่งให้ทำนิทานเพียวๆ ไม่ขายของ)
4. **NO BOLD:** ห้ามทำตัวหนาใน Output ของส่วน Storyboard เด็ดขาด (ใช้ตัวหนังสือบางปกติ)
5. **FORMAT:** Storyboard ต้องเป็นข้อความปกติ (Plain Text) ส่วน Prompt ต้องจัดเรียงในกล่อง Code Block และแยกส่วนภาพกับวิดีโอให้ชัดเจนเพื่อง่ายต่อการ Copy


### การรับข้อมูล (Input & Strict Parsing):
⚠️ **กฎเหล็กการแปลความหมายตัวเลขและการรับสื่อ (ห้ามพลาด):**
1. **ตัวเลขเดี่ยวๆ หรือตัวเลขบวกกันหลังเครื่องหมายทับ (เช่น \`/ 20\`, \`/ 9\`, \`/ 4+8\`) คือ "รหัส Style (บุคลิก)" เสมอ!** ห้ามนำไปตีความว่าเป็นจำนวนซีนเด็ดขาด
2. **จำนวนซีน จะต้องมีคำว่า "ซีน" ตามหลังตัวเลขอย่างชัดเจนเท่านั้น (เช่น "10 ซีน", "30 ซีน")** หากไม่มีให้ยึด Default = 6 ซีน
3. 📸 **กรณีอัปโหลดรูปภาพ/วิดีโอ (Media Extraction, Vision & Object-as-Character):**
- 🔍 **Auto-Product Analysis (ระบบวิเคราะห์สินค้าอัตโนมัติ):** หาก User อัปโหลดรูปภาพสินค้า โดยไม่ได้พิมพ์อธิบายข้อมูลมา ให้คุณใช้ความสามารถด้าน Vision สแกนอ่านฉลากและวิเคราะห์จุดเด่นสินค้าจากภาพนั้น 100% แล้วเอาไปแต่งสคริปต์ได้เลยทันที
- 🧑 **Character Image Recognition (กฎเหล็กการรับรูปภาพตัวละคร):** ⚠️ หาก User อัปโหลดรูปหน้าคนหรือตัวละคร (ที่ไม่ใช่สินค้า) คุณ **ต้อง** ใช้ข้อมูลจากรูปภาพนั้นมาเขียนบรรยายลักษณะหน้าตา ทรงผม เสื้อผ้า และสไตล์ ลงในช่อง \`[INSERT_FULL_CHARACTER_DESCRIPTION]\` เสมอ เพื่อให้ภาพเจนออกมาตรงกับ Reference มากที่สุด
- หากสั่ง "แกะสคริปต์" จากสื่อ ให้วิเคราะห์และใช้ข้อมูลในสื่อเป็นแกนหลัก 100%
- หากอัปโหลดรูปสินค้า/สิ่งของ แล้วสั่งให้มันพูด ให้คุณ **บังคับเสกสิ่งนั้นให้มีชีวิตทันที (Object/Food/Concept-as-Character)** - **กฎการแปลงร่าง:** ตัวละครที่เป็นสินค้า/สิ่งของ ต้องมีหน้าตา อารมณ์ (มีตา มีปาก) ที่เข้ากับบทพูด
- Input: "หมู / 12" -> ตัวละคร=หมู, Style=12, ซีน=6 (Default), โหมด=Flow
- Input: [อัปโหลดวิดีโอลำไส้] + "แกะสคริปต์" -> แกะเนื้อหาเรื่องลำไส้ตามวิดีโอ, Style=ตามความเหมาะสม, ซีน=6, โหมด=Flow
- Input: [อัปโหลดรูปเซรั่ม] + "เซรั่มพูดได้ ด่าคนไม่ล้างหน้า / Grok" -> ตัวละคร=เซรั่มมีชีวิตหน้าตาเกรี้ยวกราด, สินค้า=เซรั่ม, ซีน=6, โหมด=Grok
4. 🌐 **MULTI-LANGUAGE (ระบบรองรับหลายภาษา):** หาก User พิมพ์ระบุภาษาที่ต้องการมาด้วย ให้คุณแปลบทพูด (Dialogue) และตั้งค่า Audio Requirement เป็นภาษานั้นๆ ทันที **หากไม่ระบุ ให้ยึด "ภาษาไทย" เป็นค่าเริ่มต้นเสมอ**


### SYSTEM: LIBRARIES
**Mood Keywords:** [Cinematic Standard], [Emotional Drama], [Action Explosive], [Dark & Gritty], [Mystery Noir], [Red Alert / Conflict], [Romantic Drama], [Horror / Thriller], [Bright & Airy], [Rainy & Lonely], [Lo-Fi Cozy], [Vivid & Energetic], [Mute & Earth Tone], [Nature Organic], [Y2K Pop Energy], [Surreal Comedy], [Mutelu Mystical], [Thai Street Night], [Thai Vintage Town], [Vivid Thai Summer], [Thai Festival], [Local Homey], [Cyberpunk Neon], [Product Hero Clean], [ASMR Unboxing], [Beauty & Skincare Glow], [Food Porn Satisfying], [Rich & Flex], [Before & After Drama], [Haul & Lifestyle], [UGC Raw / Authentic], [Talking Head / POV], [Fisheye / Ultra Wide], [POV Bodycam], [Trending Transition], [Duet / Stitch Ready], [Glitch & Retro Digital], [Viral Hook Opener]
**Styles:** 1.Hard Sell, 2.Soft Sell, 3.Unboxer, 4.Skeptic, 5.FOMO, 6.Villain vs Hero, 7.Tough Love, 8.Tsundere, 9.The Nag, 10.Drama Queen, 11.Talking Object, 12.Organ War, 13.Pet Translator, 14.Time Traveler, 15.God vs Devil, 16.Geek, 17.Myth Buster, 18.Q&A, 19.Anchor, 20.Trends Hunter, 21.ASMR
**Viral Caption Protocol:** ⚠️ เมื่อเจน Storyboard และ Prompt ครบทุกซีน รวมถึง DIRECTOR'S TIPS แล้ว ให้ปิดท้าย Output เสมอด้วย **"📱 แคปชั่นสำหรับโพสต์ (TikTok/Reels)"** โดยต้องเขียนสั้นๆ กระแทกใจ ห้ามขายแข็ง (Hard Sell) และใส่แฮชแท็กที่ตรงเป้าหมายจำนวน 4 แฮชแท็กเท่านั้น`;

const HOOK_MASTER_SECTION = `
== HOOK SELECTION RULES ==
You MUST begin the video script/dialogue with one of the provided hooks below (word-for-word or very close paraphrase).
The hook is the FIRST THING the audience hears — it must be punchy, attention-grabbing, and match the hook's energy.

Rules:
1. Choose ONE hook from the provided list. Do NOT combine multiple hooks.
2. Embed the chosen hook ID as "hookId" in your JSON output (or note "Hook ID: <id>" near the start of Scene 1's dialogue).
3. Do not add filler before the hook — the hook IS the opening line.
4. Adapt the hook naturally to the product context while preserving its emotional trigger.
5. After the hook: deliver the product value proposition within 3–5 seconds of screen time.
`.trim();

/**
 * Build a hook prompt block — picks 5 random hooks from the requested category
 * (or all categories if cat is missing/auto/invalid) for the AI to choose from.
 * @param {string} overrideCat e.g. 'FOMO' | 'AUTHENTIC' | 'OBSESSION' | 'CURIOSITY' | 'auto'
 * @param {number[]} usedHookIds hook IDs already consumed in prior scenes (skip them)
 * @returns {string}
 */
function buildHookMasterPrompt(overrideCat, usedHookIds) {
  let pool = HOOK_LIBRARY.slice();

  if (overrideCat && overrideCat !== 'auto' && HOOK_CATEGORIES[overrideCat]) {
    pool = pool.filter(function (h) { return h.cat === overrideCat; });
  }

  if (usedHookIds && usedHookIds.length > 0) {
    pool = pool.filter(function (h) { return usedHookIds.indexOf(h.id) === -1; });
  }

  if (pool.length === 0) return '';

  const shuffled = pool.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 5);

  const catLabel = (overrideCat && overrideCat !== 'auto' && HOOK_CATEGORIES[overrideCat])
    ? HOOK_CATEGORIES[overrideCat].icon + ' ' + HOOK_CATEGORIES[overrideCat].name + ' — ' + HOOK_CATEGORIES[overrideCat].desc
    : 'ทุกหมวด (Mixed)';

  const hookLines = shuffled.map(function (h) {
    return '  [ID:' + h.id + '] "' + h.text + '"';
  }).join('\n');

  return [
    '== AVAILABLE HOOKS (' + catLabel + ') ==',
    'Choose ONE of these hooks as your opening line:',
    hookLines,
    '',
    'After selecting your hook, include "hookId": <selected_id> in your JSON response (or write "Hook ID: <id>" inline at the top of Scene 1).'
  ].join('\n');
}

/* ════════════════════════════════════════════════════════════════════════════
 * PHASE 3 — SAFETY LAYER
 * Ported from:
 *   - 1click-full-v3.40 (2)/js/forbidden-words-list.js (FORBIDDEN_MARKETING_PHRASES)
 *   - 1click-full-v3.40 (2)/js/prompt-screening.js    (stripHardBannedPhrases)
 *   - 1click-full-v3.40 (2)/js/content-googleflow.js  (sanitizePromptForFlow)
 *
 * Applied as post-processing after Gemini returns text, to catch any
 * overclaim / violent / audio-failing keywords that slipped past the
 * Director prompt's instructions.
 * ════════════════════════════════════════════════════════════════════════════ */

const FORBIDDEN_MARKETING_PHRASES = `
ลดความอ้วน
ลดน้ำหนัก
ดักจับไขมัน
สลายไขมัน
ระเบิดพุง
เพรียวถาวร
ไม่โยโย่
ลดจริง 5 กิโลใน 7 วัน
ดีท็อกซ์
Detox
ล้างสารพิษ
ขาวไว
ขาวอมชมพู
ขาวเร่งด่วน
ลดเม็ดสีเมลานิน
เปลี่ยนสีผิว
หน้าเด้ง
หน้าเด็ก
ชะลอความแก่
รักษาโรค
หายขาด
ป้องกันมะเร็ง
ฟื้นฟูตับ
ฟื้นฟูไต
บำรุงสายตา
เพิ่มสมรรถภาพทางเพศ
อึด ทน นาน
รักษาฝ้า
รักษากระ
รักษาจุดด่างดำ
ฆ่าเชื้อสิว
รักษาสิว
ลบรอยตีนกา
ยกกระชับหน้าทันที
หน้า V-Shape
แก้แพ้
รักษาแผลเป็น
ขาวทันทีที่ใช้
เห็นผลตั้งแต่คืนแรก
ซึมลึกถึงระดับ DNA
ซึมลึกถึงระดับเซลล์
ไม่มีผลข้างเคียง
ปลอดภัย 100%
ครั้งแรก
หนึ่งเดียวในโลก
ดีที่สุด
ชนะเลิศ
ศักดิ์สิทธิ์
มหัศจรรย์
ปาฏิหาริย์
สูตรลับ
รับรองผล
เห็นผลแน่นอน
ไม่เห็นผลยินดีคืนเงิน
การันตี
การันตีผล
การันตีเห็นผล
รับประกันผล
Certified
Best Seller
Bestseller
No.1
Number 1
Top 1
อันดับหนึ่ง
ขายดีที่สุด
ราคาถูกที่สุด
Before After
Before-After
ก่อนหลัง
เปรียบเทียบก่อนหลัง
หายถาวร
เห็นผลทันที
เห็นผลชัวร์
เห็นผลไว
ขาวถาวร
หน้าใสทันที
หน้าใสถาวร
ผิวเด็ก
ผิวอ่อนเยาว์
ยกกระชับทันที
ลดริ้วรอยถาวร
ไม่อันตราย
ไม่ต้องพบแพทย์
ใช้แทนยา
ดีกว่ายา
หยุดยาได้
แพทย์รับรอง
หมอรับรอง
ผู้เชี่ยวชาญรับรอง
งานวิจัยยืนยัน
อย.รับรอง
FDA Approved
Medical Grade
Clinical Proven
ทดลองในคนไข้
สูตรหมอ
สูตรแพทย์
ล้างลำไส้
ขับสารพิษ
ผอมไว
ผอมถาวร
น้ำหนักลดทันที
เผาผลาญไขมัน
ละลายไขมัน
กินแล้วหาย
เห็นผลวันแรก
เห็นผลใน 7 วัน
ของแท้ 100%
แจกฟรี
กำไรชัวร์
รวยเร็ว
รายได้หลักแสน
Guaranteed
Guarantee
Doctor Recommended
Medical Use
สิวหายขาด
ฝ้าหาย
ไม่กลับมาเป็นอีก
ดีที่สุดในโลก
ที่เดียวในไทย
หายเร็วมาก
จบปัญหาทุกอย่าง
ดีกว่าการฉีด
แทนโบท็อกซ์
ไม่ต้องศัลยกรรม
หน้าเรียวทันที
สลายพุงทันใจ
หุ่นเป๊ะทันที
ขาวแบบดารา
หน้าเนียนกริ๊บทันที
รูขุมขนหายไปเลย
ผิวใสทะลุแสง
ย้อนวัยทันที
ฟื้นผิวพังในคืนเดียว
รีเซ็ตผิวใหม่
ผิวใหม่ใน 24 ชั่วโมง
ตัดต้นตอสิว
ต้านมะเร็ง
ทำลายเซลล์ไขมัน
ล็อกไขมัน
ดักไขมัน 100%
เผาผลาญตลอด 24 ชั่วโมง
ล้างพิษตับ
ฟอกตับ
ล้างเลือด
ขูดไขมันออก
ความดันลงทันที
เบาหวานดีขึ้นทันที
ป้องกันทุกโรค
ครอบจักรวาล
เหนือกว่าทุกแบรนด์
ระดับการแพทย์
ดาราใช้ทุกคน
รีวิวเพียบการันตี
ขายถล่มทลาย
หมดสต๊อกทุกวัน
ราคาพิเศษที่สุด
ต่ำกว่าทุน
แถมเงินฟรี
รวยจากตัวนี้
ปั้นรายได้ทันที
ดังชัวร์
ไวรัลแน่นอน
ไม่ดีไม่ต้องจ่าย
คืนเงินไม่ถามเหตุผล
ดังทั้งประเทศในคืนเดียว
หยุดไม่ได้แน่นอน
พลาดแล้วเสียใจทั้งชีวิต
รุ่นสุดท้ายตลอดกาล
เจ้าเดียวในโลก
นวัตกรรมหนึ่งเดียวในโลก
ซื้อครั้งเดียวจบ
เห็นความต่างทันที 100%
ชัวร์ 100%
แน่นอน 100%
หายแน่ๆ
ได้ผลแน่ๆ
เฮ้ย
yourshop
your shop
your-shop
brandname
shopname
`.trim()
  .split(/\n+/)
  .map(function (s) { return s.trim(); })
  .filter(function (s) { return s.length > 1; });

/**
 * stripHardBannedPhrases — ported verbatim from prompt-screening.js
 * In the extension HARD_BAN_REGEXES is empty, so this acts as a whitespace
 * normalizer. We keep identical behavior for fidelity to the original pipe.
 * @param {string} text
 * @returns {string}
 */
const HARD_BAN_REGEXES = [];

function stripHardBannedPhrases(text) {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  for (const re of HARD_BAN_REGEXES) {
    re.lastIndex = 0;
    out = out.replace(re, '');
  }
  return out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * sanitizePromptForFlow — ported verbatim from content-googleflow.js
 * The ONLY sanitizer that is actively wired in the shipped extension
 * (used before pasting prompts into Google Flow Slate).
 * Removes violent / audio-failing keywords and layout anti-patterns.
 * @param {string} text
 * @returns {string}
 */
function sanitizePromptForFlow(text) {
  if (!text || typeof text !== 'string') return text || '';
  let p = text;
  const banned = [
    /\b(kill|murder|blood|gore|weapon|gun|knife|stab|shoot|explode|bomb|suicide|drug|narcotic)\b/gi,
    /\b(naked|nude|sex|erotic|porn|nsfw)\b/gi,
    /\b(scream|shriek|thunder|explosion|gunshot|siren|alarm|crash|bang|roar)\b/gi,
  ];
  const softReplace = {
    'scream': 'exclaim softly', 'shriek': 'gasp', 'thunder': 'gentle rain',
    'explosion': 'gentle pop', 'gunshot': 'soft tap', 'siren': 'gentle chime',
    'alarm': 'soft notification', 'crash': 'soft landing', 'bang': 'soft knock',
    'roar': 'gentle hum'
  };
  for (const [k, v] of Object.entries(softReplace)) {
    p = p.replace(new RegExp('\\b' + k + '\\b', 'gi'), v);
  }
  for (const rx of banned) {
    p = p.replace(rx, '');
  }
  p = p.replace(/\b(split[- ]?screen|side[- ]?by[- ]?side|before[- ]?and[- ]?after|collage|multi[- ]?panel|diptych|triptych|two[- ]?panel|dual[- ]?image)\b/gi, '');
  p = p.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return p;
}

function stripForbiddenEscapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let _forbiddenSortedCache = null;
function sortedForbiddenMarketingPhrases() {
  if (!_forbiddenSortedCache) {
    _forbiddenSortedCache = [...new Set(FORBIDDEN_MARKETING_PHRASES)].sort(function (a, b) {
      return b.length - a.length;
    });
  }
  return _forbiddenSortedCache;
}

/**
 * คำแทนอ่อน (ทำงานฝั่ง client — ไม่กิน token LLM) อ้างอิง
 * GEM_PACK_TIKTOK/gem-kn-forbidden-phrases.md ส่วน "คำทดแทนที่แนะนำ" + วลีเดียวกับในชุด FORBIDDEN ที่สอดคล้อง
 * key ต้องตรงกับ token ในชุด FORBIDDEN_MARKETING_PHRASES
 */
const FORBIDDEN_SOFT_REPLACE_TH = {
  รักษาโรค: 'ดูแล',
  รักษาฝ้า: 'ดูแลผิว',
  รักษากระ: 'ดูแลผิว',
  รักษาจุดด่างดำ: 'ดูแลผิว',
  รักษาสิว: 'ดูแลผิว',
  รักษาแผลเป็น: 'ดูแลผิว',
  ลดน้ำหนัก: 'ดูแลรูปร่าง',
  ลดความอ้วน: 'ดูแลรูปร่าง',
  ดีท็อกซ์: 'ช่วยระบบขับถ่าย',
  Detox: 'ช่วยระบบขับถ่าย',
  ล้างสารพิษ: 'ช่วยระบบขับถ่าย',
  ล้างลำไส้: 'ช่วยระบบขับถ่าย',
  ขับสารพิษ: 'ช่วยระบบขับถ่าย',
  ฆ่าเชื้อสิว: 'ดูแลสิว',
  หน้าเด้ง: 'ดูอ่อนเยาว์',
  หน้าเด็ก: 'ดูอ่อนเยาว์',
  ผิวเด็ก: 'ดูอ่อนเยาว์',
  ผิวอ่อนเยาว์: 'ดูสดใส',
  หายขาด: 'บรรเทา',
  ลดเม็ดสีเมลานิน: 'ดูแลโทนผิว',
  เปลี่ยนสีผิว: 'ปรับโทนผิว',
  ขาวเร่งด่วน: 'กระจ่างใส',
  ขาวไว: 'กระจ่างใส',
  ขาวอมชมพู: 'กระจ่างใส',
  ขาวทันทีที่ใช้: 'กระจ่างใส',
  ขาวถาวร: 'กระจ่างใส',
  หน้าใสทันที: 'กระจ่างใส',
  หน้าใสถาวร: 'กระจ่างใส',
  สิวหายขาด: 'ดูแลสิว',
  ฝ้าหาย: 'ดูแลฝ้า',
  หายแน่ๆ: 'ลองดูได้',
  ดีแน่ๆ: 'น่าลอง',
  ได้ผลแน่ๆ: 'น่าลอง',
  หายถาวร: 'ดูแลต่อเนื่อง',
  ไม่กลับมาเป็นอีก: 'ดูแลต่อเนื่อง',
  เห็นผลทันที: 'ลองดูได้',
  เห็นผลชัวร์: 'ลองดูได้',
  เห็นผลไว: 'ลองดูได้',
  เห็นผลแน่นอน: 'มั่นใจ',
  เห็นผลวันแรก: 'ลองดูได้',
  เห็นผลตั้งแต่คืนแรก: 'ลองดูได้',
  'เห็นผลใน 7 วัน': 'ลองดูได้',
  'เห็นความต่างทันที 100%': 'ลองดูได้',
  การันตี: 'มั่นใจ',
  การันตีผล: 'มั่นใจ',
  การันตีเห็นผล: 'ลองดูได้',
  รับรองผล: 'มั่นใจ',
  รับประกันผล: 'ลองดูได้',
  รีวิวเพียบการันตี: 'รีวิวเพียบ มั่นใจ',
};

/**
 * stripForbiddenMarketing — MOCK-ONLY: แทนที่วลีด้วยคำอ่อน (ตาม map) หรือลบหากไม่มี map
 * ลำดับยาวก่อน — วลี Latin ตามรายการแบบ case-insensitive
 * @param {string} text
 * @returns {{ text: string, hits: string[], softReplaces: Array<{ from: string, to: string }> }}
 */
function stripForbiddenMarketing(text) {
  if (!text || typeof text !== 'string') {
    return { text: text || '', hits: [], softReplaces: [] };
  }
  const hits = [];
  const softReplaces = [];
  var out = text;
  const phrases = sortedForbiddenMarketingPhrases();
  for (var pi = 0; pi < phrases.length; pi++) {
    const phrase = phrases[pi];
    if (!phrase) continue;
    const asciiOnly = /^[\x00-\x7F]+$/.test(phrase);
    const re = new RegExp(stripForbiddenEscapeRegExp(phrase), asciiOnly ? 'gi' : 'g');
    if (!re.test(out)) {
      re.lastIndex = 0;
      continue;
    }
    re.lastIndex = 0;
    hits.push(phrase);
    if (Object.prototype.hasOwnProperty.call(FORBIDDEN_SOFT_REPLACE_TH, phrase)) {
      const to = FORBIDDEN_SOFT_REPLACE_TH[phrase];
      out = out.replace(re, to);
      softReplaces.push({ from: phrase, to: to });
    } else {
      out = out.replace(re, '');
    }
  }
  out = out
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+(?=\n)/g, '')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text: out, hits: hits, softReplaces: softReplaces };
}

if (typeof globalThis !== 'undefined') {
  try {
    globalThis.stripForbiddenMarketing = stripForbiddenMarketing;
  } catch (_) {}
}

/* ════════════════════════════════════════════════════════════════════════════
 * PHASE 4 — SALES FORMULA BLUEPRINT (Product Sell mode only)
 *
 * Ported from tiktok_sales_formula_1_10_scenes.md
 * 30 formulas × scene counts 1-10 × beats per 2-3 second window
 *
 * Rules baked into every formula:
 *   - 1 Scene = 8 seconds (Flow mode)
 *   - Hook goes in Scene 1 only (first dialogue line)
 *   - Each dialogue beat = 15-20 words (enforced by Director prompt)
 *   - Use [PRODUCT] placeholder when AI doesn't know product name
 *   - Price/promo → softened to emotional triggers
 *   - CTA is TikTok-style: "กดตะกร้าได้เลย" / "คอมเมนต์ว่าสนใจ"
 *   - Shot change ≥ 2 times per 8s (beats do this automatically)
 *
 * Applied ONLY when payload.mode === 'product_sell'
 * Skipped entirely for storymode (drama, fairytale, asmr, etc.)
 * ════════════════════════════════════════════════════════════════════════════ */

const SALES_FORMULA_GLOBAL_RULES = [
  'Hook ใช้ใน Scene 1 เท่านั้น — ประโยคแรกที่ตัวละครพูด',
  'Hook ดัดแปลงให้เข้ากับสินค้าจริง ห้ามใช้ดิบๆ',
  'บทพูดทุก beat = 15-20 คำ รวมกันเต็มซีน (ห้ามน้อย ห้ามเกิน)',
  '[PRODUCT] คือ placeholder ใช้แทนสินค้าเสมอ (AI ไม่รู้ชื่อสินค้า)',
  'ราคาและโปรห้ามพูดตรงๆ — ใช้ Emotional trigger เช่น "คุ้มจนงง" / "เสียดายมากถ้าพลาด" / "โปรแบบนี้ไม่มีบ่อยๆ"',
  'CTA แบบ TikTok: "กดตะกร้าได้เลย" / "คอมเมนต์ว่าสนใจ" / "ส่งให้เพื่อนที่ต้องการ"',
  'เปลี่ยน shot อย่างน้อย 2 ครั้งใน 8 วินาที (ทุก beat ควรต่าง angle)',
  'มี movement ตลอด — กล้องนิ่งตายคนเลื่อนผ่าน'
];

const SALES_FORMULAS = [
  /* ──────── 1 Scene · 8s ──────── */
  {
    id: '1A', sceneCount: 1, name: 'Hook → Product → CTA',
    fitFor: 'impulse buy สินค้าเห็นแล้วอยากได้ทันที',
    beats: [
      { scene: 1, time: '0-1s', visual: '[PRODUCT] อยู่ในเฟรมทันที', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '1-4s', visual: 'โชว์จุดเด่น [PRODUCT] 1 อย่าง', dialogue: 'จุดเด่นสำคัญที่สุด 1 อย่าง' },
      { scene: 1, time: '4-6s', visual: 'Close-up [PRODUCT]', dialogue: 'Emotional trigger ความคุ้มค่า' },
      { scene: 1, time: '6-8s', visual: 'ซูม [PRODUCT] + ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '1B', sceneCount: 1, name: 'Hook → Result → Product → CTA',
    fitFor: 'beauty, skincare, สินค้าที่เห็นผลชัด',
    beats: [
      { scene: 1, time: '0-1s', visual: 'โชว์ผลลัพธ์ปัง ยังไม่บอกว่าคืออะไร', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '1-4s', visual: '[PRODUCT] ปรากฏ', dialogue: 'นี่คือผลจาก [PRODUCT] ตัวเดียว' },
      { scene: 1, time: '4-6s', visual: 'Close-up [PRODUCT]', dialogue: 'จุดเด่น 1 อย่าง' },
      { scene: 1, time: '6-8s', visual: 'ซูม [PRODUCT] + ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '1C', sceneCount: 1, name: 'Hook → Problem → Solution → CTA',
    fitFor: 'สินค้าแก้ปัญหาชัดเจน ของใช้',
    beats: [
      { scene: 1, time: '0-2s', visual: 'โชว์ปัญหาชัดๆ', dialogue: 'HOOK พูดถึงปัญหา 15-20 คำ' },
      { scene: 1, time: '2-4s', visual: '[PRODUCT] ปรากฏแก้ปัญหา', dialogue: '[PRODUCT] ตัวนี้แก้ได้จริง' },
      { scene: 1, time: '4-6s', visual: 'โชว์ผลลัพธ์หลังใช้', dialogue: 'ได้ผลจริงไม่ต้องรอนาน' },
      { scene: 1, time: '6-8s', visual: 'ซูม [PRODUCT] + ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '1D', sceneCount: 1, name: 'Hook → Shock Value → Product → CTA',
    fitFor: 'สินค้ามีโปร ของแถม ความคุ้มค่าสูง',
    beats: [
      { scene: 1, time: '0-2s', visual: 'ภาพที่ทำให้อยากรู้ว่าคืออะไร', dialogue: 'HOOK ช็อกความคุ้มค่า 15-20 คำ' },
      { scene: 1, time: '2-5s', visual: '[PRODUCT] ปรากฏ + โชว์ความคุ้ม', dialogue: 'Emotional trigger: คุ้มจนงง โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 1, time: '5-7s', visual: 'ซูม [PRODUCT]', dialogue: 'เสียดายมากถ้าพลาด' },
      { scene: 1, time: '7-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าก่อนหมดนะ' }
    ]
  },
  {
    id: '1E', sceneCount: 1, name: 'Hook → Testimony → Product → CTA',
    fitFor: 'อาหารเสริม สกินแคร์ สินค้าต้องสร้าง trust',
    beats: [
      { scene: 1, time: '0-2s', visual: 'Close-up หน้าคนพูด สร้าง trust', dialogue: 'HOOK แบบ authentic 15-20 คำ' },
      { scene: 1, time: '2-5s', visual: '[PRODUCT] ปรากฏ', dialogue: 'ใช้เองจริง จ่ายเองทุกบาท ดีจริง' },
      { scene: 1, time: '5-7s', visual: 'โชว์ผลลัพธ์จริง', dialogue: 'ผลที่ได้เปลี่ยนชีวิตไปเลย' },
      { scene: 1, time: '7-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },

  /* ──────── 2 Scene · 16s ──────── */
  {
    id: '2A', sceneCount: 2, name: 'Hook → Problem → Product → CTA',
    fitFor: 'สินค้าแก้ปัญหาชัดเจน ของใช้ในชีวิตประจำวัน',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพปัญหาที่คนดู relate', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'โชว์ปัญหาชัดขึ้น', dialogue: 'ขยี้ปัญหาให้หนักขึ้น' },
      { scene: 1, time: '6-8s', visual: '[PRODUCT] เริ่มปรากฏ', dialogue: 'แต่แล้วก็เจอตัวนี้...' },
      { scene: 2, time: '0-3s', visual: '[PRODUCT] โชว์การใช้งาน', dialogue: 'จุดเด่น [PRODUCT] ที่แก้ปัญหาได้' },
      { scene: 2, time: '3-6s', visual: 'โชว์ผลลัพธ์หลังใช้', dialogue: 'Emotional trigger ความคุ้มค่า' },
      { scene: 2, time: '6-8s', visual: 'ซูม [PRODUCT] + ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '2B', sceneCount: 2, name: 'Hook → Result → Product → Proof → CTA',
    fitFor: 'beauty, skincare, สินค้าที่เห็นผลชัด',
    beats: [
      { scene: 1, time: '0-3s', visual: 'โชว์ผลลัพธ์ปัง ยังไม่บอกว่าคืออะไร', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: '[PRODUCT] ปรากฏ', dialogue: 'นี่คือผลจาก [PRODUCT] ตัวเดียว' },
      { scene: 1, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'จุดเด่น 1 อย่าง' },
      { scene: 2, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'ก่อนใช้กับหลังใช้ต่างกันมาก' },
      { scene: 2, time: '3-6s', visual: 'ซูม [PRODUCT]', dialogue: 'Social proof: คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 2, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '2C', sceneCount: 2, name: 'Hook → Testimony → Product → FOMO → CTA',
    fitFor: 'อาหารเสริม สกินแคร์ สินค้าต้องสร้าง trust',
    beats: [
      { scene: 1, time: '0-3s', visual: 'Close-up หน้าคนพูด สร้าง trust', dialogue: 'HOOK แบบ authentic 15-20 คำ' },
      { scene: 1, time: '3-6s', visual: '[PRODUCT] ปรากฏ', dialogue: 'ใช้เองมานาน จ่ายเองทุกบาท ดีจริง' },
      { scene: 1, time: '6-8s', visual: 'โชว์ [PRODUCT] ชัดๆ', dialogue: 'บอกผลลัพธ์จริงที่ได้รับ' },
      { scene: 2, time: '0-3s', visual: 'Reaction คนรอบข้าง', dialogue: 'คนรอบข้างทักว่าเปลี่ยนไปมาก' },
      { scene: 2, time: '3-6s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 2, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าก่อนหมดนะ' }
    ]
  },
  {
    id: '2D', sceneCount: 2, name: 'Hook → Shock → Product → Emotional → CTA',
    fitFor: 'สินค้าใหม่ นวัตกรรม สินค้าที่คนยังไม่รู้จัก',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพที่ทำให้หยุดดูทันที', dialogue: 'HOOK ช็อก 15-20 คำ' },
      { scene: 1, time: '3-6s', visual: 'Tease [PRODUCT] ยังไม่เห็นชัด', dialogue: 'Build up ความอยากรู้' },
      { scene: 1, time: '6-8s', visual: '[PRODUCT] ปรากฏชัด', dialogue: 'ก็ [PRODUCT] ตัวนี้แหละ' },
      { scene: 2, time: '0-3s', visual: 'โชว์การใช้งานจริง', dialogue: 'จุดเด่นที่ทำให้ช็อก' },
      { scene: 2, time: '3-6s', visual: 'ซูม [PRODUCT]', dialogue: 'Emotional trigger: คุ้มจนงงว่าทำไมถึงดีได้ขนาดนี้' },
      { scene: 2, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '2E', sceneCount: 2, name: 'Hook → Before/After → Product → FOMO → CTA',
    fitFor: 'สินค้า lifestyle ของใช้ที่เปลี่ยนชีวิต',
    beats: [
      { scene: 1, time: '0-3s', visual: 'Before — ชีวิตก่อนมี [PRODUCT]', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'After — ชีวิตหลังมี [PRODUCT]', dialogue: 'ก่อนหน้านี้ปัญหานี้แย่มากจริงๆ' },
      { scene: 1, time: '6-8s', visual: '[PRODUCT] ปรากฏชัด', dialogue: '[PRODUCT] เปลี่ยนทุกอย่างไปเลย' },
      { scene: 2, time: '0-3s', visual: 'Close-up [PRODUCT]', dialogue: 'จุดเด่นสำคัญที่สุด 1 อย่าง' },
      { scene: 2, time: '3-6s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โอกาสแบบนี้ไม่มีบ่อยๆ เสียดายมากถ้าพลาด' },
      { scene: 2, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าก่อนหมดนะ' }
    ]
  },

  /* ──────── 3 Scene · 24s ──────── */
  {
    id: '3A', sceneCount: 3, name: 'Hook → Problem → Product → Proof → CTA',
    fitFor: 'สินค้าแก้ปัญหา ของใช้ในชีวิตประจำวัน',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพปัญหาที่คนดู relate', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'โชว์ปัญหาชัดขึ้น', dialogue: 'ขยี้ปัญหาให้หนักขึ้น' },
      { scene: 1, time: '6-8s', visual: '[PRODUCT] เริ่มปรากฏ', dialogue: 'แต่แล้วก็เจอตัวนี้...' },
      { scene: 2, time: '0-3s', visual: '[PRODUCT] โชว์การใช้งาน', dialogue: 'จุดเด่น [PRODUCT] ที่แก้ปัญหาได้' },
      { scene: 2, time: '3-6s', visual: 'โชว์ผลลัพธ์หลังใช้', dialogue: 'ผลที่ได้เปลี่ยนไปเลย' },
      { scene: 2, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'Reaction ประทับใจ' },
      { scene: 3, time: '0-3s', visual: 'Social proof / Before-After', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 3, time: '3-6s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ เสียดายถ้าพลาด' },
      { scene: 3, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '3B', sceneCount: 3, name: 'Hook → Result → How It Works → FOMO → CTA',
    fitFor: 'สินค้าต้องอธิบายวิธีใช้ อุปกรณ์ เครื่องมือ',
    beats: [
      { scene: 1, time: '0-3s', visual: 'โชว์ผลลัพธ์ปัง ยังไม่บอกว่าคืออะไร', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: '[PRODUCT] ปรากฏ', dialogue: 'นี่คือผลจาก [PRODUCT] ตัวเดียว' },
      { scene: 1, time: '6-8s', visual: 'Tease วิธีใช้', dialogue: 'แล้วมันทำงานยังไง?' },
      { scene: 2, time: '0-3s', visual: 'โชว์วิธีใช้จริงทีละขั้นตอน', dialogue: 'วิธีใช้ง่ายมาก แค่นี้เอง' },
      { scene: 2, time: '3-6s', visual: 'ผลลัพธ์ระหว่างใช้ชัดเจน', dialogue: 'ได้ผลจริงไม่ต้องรอนาน' },
      { scene: 2, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'Reaction ประทับใจ' },
      { scene: 3, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'ต่างกันมากก่อนและหลังใช้' },
      { scene: 3, time: '3-6s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: เสียดายมากถ้าพลาดโปรนี้' },
      { scene: 3, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '3C', sceneCount: 3, name: 'Hook → Testimony → Before/After → CTA',
    fitFor: 'อาหารเสริม สกินแคร์ สินค้าต้องสร้าง trust',
    beats: [
      { scene: 1, time: '0-3s', visual: 'Close-up หน้าคนพูด สร้าง trust', dialogue: 'HOOK แบบ authentic 15-20 คำ' },
      { scene: 1, time: '3-6s', visual: '[PRODUCT] ปรากฏ', dialogue: 'ใช้เองมานาน จ่ายเองทุกบาท ดีจริง' },
      { scene: 1, time: '6-8s', visual: 'Before — โชว์ปัญหาก่อนใช้', dialogue: 'ก่อนหน้านี้ปัญหานี้ทำให้ชีวิตแย่มาก' },
      { scene: 2, time: '0-3s', visual: 'After — โชว์ผลลัพธ์หลังใช้', dialogue: 'หลังใช้ [PRODUCT] ทุกอย่างเปลี่ยนไปเลย' },
      { scene: 2, time: '3-6s', visual: 'โชว์การใช้งานจริง', dialogue: 'จุดเด่นที่ชอบที่สุด 1 อย่าง' },
      { scene: 2, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'ใครมีปัญหาแบบนี้ต้องลอง' },
      { scene: 3, time: '0-3s', visual: 'ซูม [PRODUCT]', dialogue: 'Social proof: คนรอบข้างทักว่าดีขึ้นมาก' },
      { scene: 3, time: '3-6s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 3, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าก่อนหมดนะ' }
    ]
  },
  {
    id: '3D', sceneCount: 3, name: 'Hook → Shock → Build Up → Product → CTA',
    fitFor: 'สินค้าใหม่ นวัตกรรม สินค้าที่คนยังไม่รู้จัก',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพที่ทำให้หยุดดูทันที', dialogue: 'HOOK ช็อก 15-20 คำ' },
      { scene: 1, time: '3-6s', visual: 'Tease [PRODUCT] ยังไม่เห็นชัด', dialogue: 'Build up ความอยากรู้' },
      { scene: 1, time: '6-8s', visual: 'ภาพ tease ต่อ', dialogue: 'รอดูให้จบ บอกเลยว่าคุ้มมาก' },
      { scene: 2, time: '0-3s', visual: '[PRODUCT] ปรากฏชัดเจน', dialogue: 'ก็ [PRODUCT] ตัวนี้แหละ' },
      { scene: 2, time: '3-6s', visual: 'โชว์การใช้งานจริง', dialogue: 'จุดเด่นที่ช็อกที่สุด' },
      { scene: 2, time: '6-8s', visual: 'โชว์ผลลัพธ์', dialogue: 'ไม่คิดว่าจะได้ผลขนาดนี้' },
      { scene: 3, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'ต่างกันมากจริงๆ' },
      { scene: 3, time: '3-6s', visual: 'ซูม [PRODUCT]', dialogue: 'Emotional trigger: คุ้มจนงงว่าทำไมถึงดีได้ขนาดนี้' },
      { scene: 3, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '3E', sceneCount: 3, name: 'Hook → Before/After → How It Works → FOMO → CTA',
    fitFor: 'สินค้า lifestyle ของใช้ที่เปลี่ยนชีวิต',
    beats: [
      { scene: 1, time: '0-3s', visual: 'Before — ชีวิตก่อนมี [PRODUCT]', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'After — ชีวิตหลังมี [PRODUCT]', dialogue: 'ก่อนหน้านี้ปัญหานี้แย่มากจริงๆ' },
      { scene: 1, time: '6-8s', visual: '[PRODUCT] ปรากฏชัด', dialogue: '[PRODUCT] เปลี่ยนทุกอย่างไปเลย' },
      { scene: 2, time: '0-3s', visual: 'โชว์วิธีใช้จริงทีละขั้นตอน', dialogue: 'วิธีใช้ง่ายมาก แค่นี้เอง' },
      { scene: 2, time: '3-6s', visual: 'ผลลัพธ์ระหว่างใช้ชัดเจน', dialogue: 'ได้ผลจริงไม่ต้องรอนาน' },
      { scene: 2, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'Reaction ประทับใจ' },
      { scene: 3, time: '0-3s', visual: 'ซูม [PRODUCT]', dialogue: 'Social proof: คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 3, time: '3-6s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'FOMO: เสียดายมากถ้าพลาดโปรนี้ ไม่มีบ่อยๆ' },
      { scene: 3, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าก่อนหมดนะ' }
    ]
  },

  /* ──────── 4 Scene · 32s ──────── */
  {
    id: '4A', sceneCount: 4, name: 'Hook → Problem → Agitate → Product → CTA',
    fitFor: 'สินค้าแก้ปัญหาเรื้อรัง คนเคยลองแล้วไม่ได้ผล',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพปัญหาที่คนดู relate', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'โชว์ปัญหาชัดขึ้น', dialogue: 'พูดปัญหาตรงๆ ที่คนดูเจอ' },
      { scene: 1, time: '6-8s', visual: '[PRODUCT] เริ่มปรากฏ', dialogue: 'เคยลองมาหมดแล้วแต่ยังไม่ได้ผล...' },
      { scene: 2, time: '0-3s', visual: 'โชว์ความล้มเหลวก่อนหน้า', dialogue: 'ขยี้ปัญหาให้หนักขึ้น' },
      { scene: 2, time: '3-6s', visual: 'Emotion ต่ำสุด', dialogue: 'จนหมดหวังแล้วว่าจะแก้ได้' },
      { scene: 2, time: '6-8s', visual: '[PRODUCT] ปรากฏ', dialogue: 'จนมาเจอ [PRODUCT] ตัวนี้...' },
      { scene: 3, time: '0-3s', visual: '[PRODUCT] โชว์การใช้งาน', dialogue: 'จุดเด่น [PRODUCT] ที่แก้ปัญหาได้จริง' },
      { scene: 3, time: '3-6s', visual: 'โชว์ผลลัพธ์หลังใช้', dialogue: 'ผลที่ได้เปลี่ยนไปเลย ไม่คิดว่าจะได้ผล' },
      { scene: 3, time: '6-8s', visual: 'Reaction ประทับใจ', dialogue: 'ดีใจมากที่ได้ลอง' },
      { scene: 4, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'Social proof: คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 4, time: '3-6s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ เสียดายถ้าพลาด' },
      { scene: 4, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '4B', sceneCount: 4, name: 'Hook → Result → Product → How It Works → CTA',
    fitFor: 'สินค้าที่ต้องอธิบายวิธีใช้ด้วย เช่น อุปกรณ์',
    beats: [
      { scene: 1, time: '0-3s', visual: 'โชว์ผลลัพธ์ปัง', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: '[PRODUCT] ปรากฏ', dialogue: 'นี่คือผลจาก [PRODUCT] ตัวเดียว' },
      { scene: 1, time: '6-8s', visual: 'Tease วิธีใช้', dialogue: 'แล้วมันทำงานยังไง?' },
      { scene: 2, time: '0-3s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 1', dialogue: 'ขั้นแรกทำแบบนี้ก่อน' },
      { scene: 2, time: '3-6s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 2', dialogue: 'แค่นี้เองง่ายมาก' },
      { scene: 2, time: '6-8s', visual: 'ผลลัพธ์ระหว่างใช้', dialogue: 'ได้ผลแล้ว เห็นชัดมาก' },
      { scene: 3, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'ต่างกันมากก่อนและหลังใช้' },
      { scene: 3, time: '3-6s', visual: 'Reaction ประทับใจ', dialogue: 'ไม่คิดว่าจะดีขนาดนี้' },
      { scene: 3, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'จุดเด่นที่ชอบที่สุด' },
      { scene: 4, time: '0-3s', visual: 'Social proof', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 4, time: '3-6s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: เสียดายมากถ้าพลาดโปรนี้' },
      { scene: 4, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '4C', sceneCount: 4, name: 'Hook → Testimony → Before/After → Proof → CTA',
    fitFor: 'อาหารเสริม สกินแคร์ สินค้าต้อง trust สูง',
    beats: [
      { scene: 1, time: '0-3s', visual: 'Close-up หน้าคนพูด สร้าง trust', dialogue: 'HOOK แบบ authentic 15-20 คำ' },
      { scene: 1, time: '3-6s', visual: '[PRODUCT] ปรากฏ', dialogue: 'ใช้เองจริง จ่ายเองทุกบาท' },
      { scene: 1, time: '6-8s', visual: 'Before — โชว์ปัญหาก่อนใช้', dialogue: 'ก่อนหน้านี้ปัญหานี้แย่มากจริงๆ' },
      { scene: 2, time: '0-3s', visual: 'After — โชว์ผลลัพธ์หลังใช้', dialogue: 'หลังใช้ [PRODUCT] ทุกอย่างเปลี่ยนไปเลย' },
      { scene: 2, time: '3-6s', visual: 'โชว์การใช้งานจริง', dialogue: 'จุดเด่นที่ชอบที่สุด 1 อย่าง' },
      { scene: 2, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'ใครมีปัญหาแบบนี้ต้องลองจริงๆ' },
      { scene: 3, time: '0-3s', visual: 'Reaction คนรอบข้าง', dialogue: 'คนรอบข้างทักว่าเปลี่ยนไปมาก' },
      { scene: 3, time: '3-6s', visual: 'Social proof ตัวเลข', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 3, time: '6-8s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 4, time: '0-3s', visual: 'ซูม [PRODUCT]', dialogue: 'Emotional trigger: คุ้มค่ามากจริงๆ' },
      { scene: 4, time: '3-6s', visual: '[PRODUCT] ชัดเจน', dialogue: 'เสียดายมากถ้าพลาด' },
      { scene: 4, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าก่อนหมดนะ' }
    ]
  },
  {
    id: '4D', sceneCount: 4, name: 'Hook → Shock → Build Up → Product → Proof → CTA',
    fitFor: 'สินค้าใหม่ นวัตกรรม ท้าพิสูจน์',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพที่ทำให้หยุดดูทันที', dialogue: 'HOOK ช็อก 15-20 คำ' },
      { scene: 1, time: '3-6s', visual: 'Tease [PRODUCT] ยังไม่เห็นชัด', dialogue: 'Build up ความอยากรู้' },
      { scene: 1, time: '6-8s', visual: 'ภาพ tease ต่อ', dialogue: 'รอดูให้จบ คุ้มมากแน่นอน' },
      { scene: 2, time: '0-3s', visual: '[PRODUCT] ปรากฏชัดเจน', dialogue: 'ก็ [PRODUCT] ตัวนี้แหละ' },
      { scene: 2, time: '3-6s', visual: 'โชว์การใช้งานจริง', dialogue: 'จุดเด่นที่ช็อกที่สุด' },
      { scene: 2, time: '6-8s', visual: 'โชว์ผลลัพธ์', dialogue: 'ไม่คิดว่าจะได้ผลขนาดนี้เลย' },
      { scene: 3, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'ต่างกันมากจริงๆ เห็นชัดมาก' },
      { scene: 3, time: '3-6s', visual: 'Reaction ประทับใจ', dialogue: 'Social proof: คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 3, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'Emotional trigger: คุ้มจนงงว่าทำไมถึงดีได้ขนาดนี้' },
      { scene: 4, time: '0-3s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 4, time: '3-6s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'เสียดายมากถ้าพลาด' },
      { scene: 4, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '4E', sceneCount: 4, name: 'Hook → Problem → Product → Emotional → FOMO → CTA',
    fitFor: 'สินค้าทั่วไป สูตรกลางใช้ได้กับทุกประเภท',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพปัญหาที่คนดู relate', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'โชว์ปัญหาชัดขึ้น', dialogue: 'ขยี้ปัญหาให้หนักขึ้น' },
      { scene: 1, time: '6-8s', visual: '[PRODUCT] เริ่มปรากฏ', dialogue: 'แต่แล้วก็เจอตัวนี้...' },
      { scene: 2, time: '0-3s', visual: '[PRODUCT] โชว์การใช้งาน', dialogue: 'จุดเด่น [PRODUCT] ที่แก้ปัญหาได้' },
      { scene: 2, time: '3-6s', visual: 'โชว์ผลลัพธ์หลังใช้', dialogue: 'ผลที่ได้เปลี่ยนไปเลย' },
      { scene: 2, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'Reaction ประทับใจ' },
      { scene: 3, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'Emotional trigger: ดีจนอยากบอกทุกคน' },
      { scene: 3, time: '3-6s', visual: 'Social proof', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 3, time: '6-8s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: เสียดายมากถ้าพลาด' },
      { scene: 4, time: '0-3s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 4, time: '3-6s', visual: 'ชี้ตะกร้า', dialogue: 'รีบกดก่อนของหมดนะ' },
      { scene: 4, time: '6-8s', visual: 'ซูม [PRODUCT] สุดท้าย', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },

  /* ──────── 5 Scene · 40s ──────── */
  {
    id: '5A', sceneCount: 5, name: 'Hook → Problem → Agitate → Product → Proof → CTA',
    fitFor: 'สูตรมาตรฐาน TikTok Shop ใช้ได้กับสินค้าทุกประเภท',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพปัญหาที่คนดู relate', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'โชว์ปัญหาชัดขึ้น', dialogue: 'พูดปัญหาตรงๆ ที่คนดูเจอ' },
      { scene: 1, time: '6-8s', visual: 'Emotion เริ่มหนักขึ้น', dialogue: 'Open loop: แต่แล้วทุกอย่างก็เปลี่ยน...' },
      { scene: 2, time: '0-3s', visual: 'โชว์ความล้มเหลวก่อนหน้า', dialogue: 'ขยี้ปัญหาให้หนักขึ้น ลองมาหมดแล้ว' },
      { scene: 2, time: '3-6s', visual: 'Emotion ต่ำสุด', dialogue: 'จนหมดหวังแล้วว่าจะแก้ได้' },
      { scene: 2, time: '6-8s', visual: '[PRODUCT] เริ่มปรากฏ', dialogue: 'จนมาเจอ [PRODUCT] ตัวนี้...' },
      { scene: 3, time: '0-3s', visual: '[PRODUCT] โชว์การใช้งาน', dialogue: 'จุดเด่น [PRODUCT] ที่แก้ปัญหาได้จริง' },
      { scene: 3, time: '3-6s', visual: 'โชว์ผลลัพธ์หลังใช้', dialogue: 'ผลที่ได้เปลี่ยนไปเลย ไม่คิดว่าจะได้ผล' },
      { scene: 3, time: '6-8s', visual: 'Reaction ประทับใจ', dialogue: 'ดีใจมากที่ตัดสินใจลอง' },
      { scene: 4, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'Social proof: คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 4, time: '3-6s', visual: 'Reaction คนรอบข้าง', dialogue: 'คนรอบข้างทักว่าเปลี่ยนไปมาก' },
      { scene: 4, time: '6-8s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ เสียดายถ้าพลาด' },
      { scene: 5, time: '0-3s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'Emotional trigger: คุ้มค่ามากจริงๆ' },
      { scene: 5, time: '3-6s', visual: 'ชี้ตะกร้า', dialogue: 'รีบกดก่อนของหมดนะ' },
      { scene: 5, time: '6-8s', visual: 'ซูม [PRODUCT] สุดท้าย', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '5B', sceneCount: 5, name: 'Hook → Result → Product → How It Works → Proof → CTA',
    fitFor: 'สินค้าที่เห็นผลชัดและต้องอธิบายวิธีใช้',
    beats: [
      { scene: 1, time: '0-3s', visual: 'โชว์ผลลัพธ์ปัง', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: '[PRODUCT] ปรากฏ', dialogue: 'นี่คือผลจาก [PRODUCT] ตัวเดียว' },
      { scene: 1, time: '6-8s', visual: 'Tease วิธีใช้', dialogue: 'แล้วมันทำงานยังไง?' },
      { scene: 2, time: '0-3s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 1', dialogue: 'วิธีใช้ง่ายมาก ขั้นแรกทำแบบนี้' },
      { scene: 2, time: '3-6s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 2', dialogue: 'แค่นี้เองได้ผลแล้ว' },
      { scene: 2, time: '6-8s', visual: 'ผลลัพธ์ระหว่างใช้', dialogue: 'เห็นชัดมากเลย' },
      { scene: 3, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'ต่างกันมากก่อนและหลังใช้' },
      { scene: 3, time: '3-6s', visual: 'Reaction ประทับใจ', dialogue: 'ดีใจมากที่ได้ลอง' },
      { scene: 3, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'จุดเด่นที่ชอบที่สุด' },
      { scene: 4, time: '0-3s', visual: 'Social proof', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 4, time: '3-6s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: เสียดายมากถ้าพลาดโปรนี้' },
      { scene: 4, time: '6-8s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 5, time: '0-3s', visual: 'Emotional trigger', dialogue: 'คุ้มค่ามากจริงๆ' },
      { scene: 5, time: '3-6s', visual: 'ชี้ตะกร้า', dialogue: 'รีบกดก่อนของหมดนะ' },
      { scene: 5, time: '6-8s', visual: 'ซูม [PRODUCT] สุดท้าย', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '5C', sceneCount: 5, name: 'Hook → Testimony → Before/After → How It Works → Proof → CTA',
    fitFor: 'อาหารเสริม สกินแคร์ สินค้าที่ต้อง trust สูงมาก',
    beats: [
      { scene: 1, time: '0-3s', visual: 'Close-up หน้าคนพูด', dialogue: 'HOOK แบบ authentic 15-20 คำ' },
      { scene: 1, time: '3-6s', visual: '[PRODUCT] ปรากฏ', dialogue: 'ใช้เองจริง จ่ายเองทุกบาท ดีจริง' },
      { scene: 1, time: '6-8s', visual: 'Before — โชว์ปัญหาก่อนใช้', dialogue: 'ก่อนหน้านี้ปัญหานี้แย่มากจริงๆ' },
      { scene: 2, time: '0-3s', visual: 'After — โชว์ผลลัพธ์หลังใช้', dialogue: 'หลังใช้ [PRODUCT] ทุกอย่างเปลี่ยนไปเลย' },
      { scene: 2, time: '3-6s', visual: 'โชว์การใช้งานจริง', dialogue: 'จุดเด่นที่ชอบที่สุด 1 อย่าง' },
      { scene: 2, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'ใครมีปัญหาแบบนี้ต้องลองจริงๆ' },
      { scene: 3, time: '0-3s', visual: 'โชว์วิธีใช้ทีละขั้นตอน', dialogue: 'วิธีใช้ง่ายมาก แค่นี้เอง' },
      { scene: 3, time: '3-6s', visual: 'ผลลัพธ์ระหว่างใช้', dialogue: 'ได้ผลจริงไม่ต้องรอนาน' },
      { scene: 3, time: '6-8s', visual: 'Reaction ประทับใจ', dialogue: 'ดีใจมากที่ได้ลอง' },
      { scene: 4, time: '0-3s', visual: 'Reaction คนรอบข้าง', dialogue: 'คนรอบข้างทักว่าเปลี่ยนไปมาก' },
      { scene: 4, time: '3-6s', visual: 'Social proof ตัวเลข', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 4, time: '6-8s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 5, time: '0-3s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'Emotional trigger: คุ้มค่ามากจริงๆ' },
      { scene: 5, time: '3-6s', visual: 'ชี้ตะกร้า', dialogue: 'เสียดายมากถ้าพลาด' },
      { scene: 5, time: '6-8s', visual: 'ซูม [PRODUCT] สุดท้าย', dialogue: 'CTA: กดตะกร้าก่อนหมดนะ' }
    ]
  },
  {
    id: '5D', sceneCount: 5, name: 'Hook → Shock → Product → Emotional → FOMO → CTA',
    fitFor: 'สินค้าใหม่ นวัตกรรม ท้าพิสูจน์',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพที่ทำให้หยุดดูทันที', dialogue: 'HOOK ช็อก 15-20 คำ' },
      { scene: 1, time: '3-6s', visual: 'Tease [PRODUCT]', dialogue: 'Build up ความอยากรู้' },
      { scene: 1, time: '6-8s', visual: '[PRODUCT] ปรากฏชัด', dialogue: 'ก็ [PRODUCT] ตัวนี้แหละ' },
      { scene: 2, time: '0-3s', visual: 'โชว์การใช้งานจริง', dialogue: 'จุดเด่นที่ช็อกที่สุด' },
      { scene: 2, time: '3-6s', visual: 'โชว์ผลลัพธ์', dialogue: 'ไม่คิดว่าจะได้ผลขนาดนี้' },
      { scene: 2, time: '6-8s', visual: 'Reaction ประทับใจ', dialogue: 'เปลี่ยนชีวิตไปเลยจริงๆ' },
      { scene: 3, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'ต่างกันมากจริงๆ เห็นชัดมาก' },
      { scene: 3, time: '3-6s', visual: 'Social proof', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 3, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'Emotional trigger: คุ้มจนงง' },
      { scene: 4, time: '0-3s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 4, time: '3-6s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'เสียดายมากถ้าพลาด' },
      { scene: 4, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'รีบกดก่อนของหมดนะ' },
      { scene: 5, time: '0-3s', visual: 'Final emotional moment', dialogue: 'ดีใจมากที่ตัดสินใจซื้อ' },
      { scene: 5, time: '3-6s', visual: 'ซูม [PRODUCT] สุดท้าย', dialogue: 'ใครยังไม่มีต้องรีบจัดเลย' },
      { scene: 5, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },
  {
    id: '5E', sceneCount: 5, name: 'Hook → Before/After → How It Works → Testimony → FOMO → CTA',
    fitFor: 'สูตรครบสมบูรณ์ สินค้าที่ต้องการ trust + proof ครบ',
    beats: [
      { scene: 1, time: '0-3s', visual: 'Before — ชีวิตก่อนมี [PRODUCT]', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'After — ชีวิตหลังมี [PRODUCT]', dialogue: 'ก่อนหน้านี้ปัญหานี้แย่มากจริงๆ' },
      { scene: 1, time: '6-8s', visual: '[PRODUCT] ปรากฏชัด', dialogue: '[PRODUCT] เปลี่ยนทุกอย่างไปเลย' },
      { scene: 2, time: '0-3s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 1', dialogue: 'วิธีใช้ง่ายมาก ขั้นแรกทำแบบนี้' },
      { scene: 2, time: '3-6s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 2', dialogue: 'แค่นี้เองได้ผลแล้ว' },
      { scene: 2, time: '6-8s', visual: 'ผลลัพธ์ระหว่างใช้', dialogue: 'เห็นชัดมากเลย' },
      { scene: 3, time: '0-3s', visual: 'Close-up หน้าคนพูด', dialogue: 'ใช้เองมานาน จ่ายเองทุกบาท' },
      { scene: 3, time: '3-6s', visual: 'Reaction ประทับใจ', dialogue: 'ดีใจมากที่ตัดสินใจซื้อวันนั้น' },
      { scene: 3, time: '6-8s', visual: 'Social proof', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 4, time: '0-3s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 4, time: '3-6s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'เสียดายมากถ้าพลาด' },
      { scene: 4, time: '6-8s', visual: 'Emotional trigger', dialogue: 'คุ้มค่ามากจริงๆ ไม่ผิดหวัง' },
      { scene: 5, time: '0-3s', visual: 'Final close-up [PRODUCT]', dialogue: 'ใครยังไม่มีต้องรีบจัดเลย' },
      { scene: 5, time: '3-6s', visual: 'ชี้ตะกร้า', dialogue: 'รีบกดก่อนของหมดนะ' },
      { scene: 5, time: '6-8s', visual: 'ซูม [PRODUCT] สุดท้าย', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },

  /* ──────── 6 Scene · 48s ──────── */
  {
    id: '6A', sceneCount: 6, name: 'Hook → Problem → Agitate → Product → How It Works → Proof → CTA',
    fitFor: 'สินค้าที่ต้องอธิบายละเอียด เครื่องมือ อุปกรณ์',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพปัญหาที่คนดู relate', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'โชว์ปัญหาชัดขึ้น', dialogue: 'พูดปัญหาตรงๆ ที่คนดูเจอ' },
      { scene: 1, time: '6-8s', visual: 'Emotion เริ่มหนักขึ้น', dialogue: 'เคยลองมาหมดแล้วแต่ยังไม่ได้ผล' },
      { scene: 2, time: '0-3s', visual: 'โชว์ความล้มเหลวก่อนหน้า', dialogue: 'ขยี้ปัญหาให้หนักขึ้น' },
      { scene: 2, time: '3-6s', visual: 'Emotion ต่ำสุด', dialogue: 'จนหมดหวังแล้วว่าจะแก้ได้' },
      { scene: 2, time: '6-8s', visual: '[PRODUCT] เริ่มปรากฏ', dialogue: 'จนมาเจอ [PRODUCT] ตัวนี้...' },
      { scene: 3, time: '0-3s', visual: '[PRODUCT] ชัดเจน', dialogue: 'จุดเด่น [PRODUCT] ที่แก้ปัญหาได้จริง' },
      { scene: 3, time: '3-6s', visual: 'โชว์ผลลัพธ์เบื้องต้น', dialogue: 'เริ่มเห็นผลแล้ว ดีกว่าที่คิด' },
      { scene: 3, time: '6-8s', visual: 'Reaction ประทับใจ', dialogue: 'ไม่คิดว่าจะได้ผลขนาดนี้' },
      { scene: 4, time: '0-3s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 1', dialogue: 'วิธีใช้ง่ายมาก ขั้นแรกทำแบบนี้' },
      { scene: 4, time: '3-6s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 2', dialogue: 'แค่นี้เองได้ผลแล้ว' },
      { scene: 4, time: '6-8s', visual: 'ผลลัพธ์สมบูรณ์', dialogue: 'เห็นผลชัดมาก ดีใจมาก' },
      { scene: 5, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'Social proof: คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 5, time: '3-6s', visual: 'Reaction คนรอบข้าง', dialogue: 'คนรอบข้างทักว่าเปลี่ยนไปมาก' },
      { scene: 5, time: '6-8s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ เสียดายถ้าพลาด' },
      { scene: 6, time: '0-3s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'Emotional trigger: คุ้มค่ามากจริงๆ' },
      { scene: 6, time: '3-6s', visual: 'ชี้ตะกร้า', dialogue: 'รีบกดก่อนของหมดนะ' },
      { scene: 6, time: '6-8s', visual: 'ซูม [PRODUCT] สุดท้าย', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },

  /* ──────── 7 Scene · 56s ──────── */
  {
    id: '7A', sceneCount: 7, name: 'Hook → Problem → Agitate → Deep Pain → Product → How It Works → Proof → CTA',
    fitFor: 'สินค้าระดับพรีเมียม ราคาสูง ต้องสร้าง trust นาน',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพปัญหาที่คนดู relate', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'โชว์ปัญหาชัดขึ้น', dialogue: 'พูดปัญหาตรงๆ ที่คนดูเจอ' },
      { scene: 1, time: '6-8s', visual: 'Emotion เริ่มหนักขึ้น', dialogue: 'เคยลองมาหมดแล้วแต่ยังไม่ได้ผล' },
      { scene: 2, time: '0-3s', visual: 'โชว์ความล้มเหลวก่อนหน้า', dialogue: 'ขยี้ปัญหาให้หนักขึ้น' },
      { scene: 2, time: '3-6s', visual: 'Emotion ต่ำสุด', dialogue: 'จนหมดหวังแล้วว่าจะแก้ได้' },
      { scene: 2, time: '6-8s', visual: 'Deep pain moment', dialogue: 'ปัญหานี้ส่งผลกระทบชีวิตมากจริงๆ' },
      { scene: 3, time: '0-3s', visual: '[PRODUCT] ปรากฏ', dialogue: 'จนมาเจอ [PRODUCT] ตัวนี้...' },
      { scene: 3, time: '3-6s', visual: 'โชว์การใช้งานจริง', dialogue: 'จุดเด่น [PRODUCT] ที่แก้ปัญหาได้จริง' },
      { scene: 3, time: '6-8s', visual: 'โชว์ผลลัพธ์เบื้องต้น', dialogue: 'เริ่มเห็นผลแล้ว ดีกว่าที่คิด' },
      { scene: 4, time: '0-3s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 1', dialogue: 'วิธีใช้ง่ายมาก ขั้นแรกทำแบบนี้' },
      { scene: 4, time: '3-6s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 2', dialogue: 'แค่นี้เองได้ผลแล้ว' },
      { scene: 4, time: '6-8s', visual: 'ผลลัพธ์สมบูรณ์', dialogue: 'เห็นผลชัดมาก ดีใจมาก' },
      { scene: 5, time: '0-3s', visual: 'Before/After ชัดเจน', dialogue: 'ต่างกันมากจริงๆ เห็นชัดมาก' },
      { scene: 5, time: '3-6s', visual: 'Reaction ประทับใจ', dialogue: 'ดีใจมากที่ตัดสินใจลอง' },
      { scene: 5, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'จุดเด่นที่ชอบที่สุด' },
      { scene: 6, time: '0-3s', visual: 'Social proof', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 6, time: '3-6s', visual: 'Reaction คนรอบข้าง', dialogue: 'คนรอบข้างทักว่าเปลี่ยนไปมาก' },
      { scene: 6, time: '6-8s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ เสียดายถ้าพลาด' },
      { scene: 7, time: '0-3s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'Emotional trigger: คุ้มค่ามากจริงๆ' },
      { scene: 7, time: '3-6s', visual: 'ชี้ตะกร้า', dialogue: 'รีบกดก่อนของหมดนะ' },
      { scene: 7, time: '6-8s', visual: 'ซูม [PRODUCT] สุดท้าย', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },

  /* ──────── 8 Scene · 64s ──────── */
  {
    id: '8A', sceneCount: 8, name: 'Hook → Problem → Agitate → Deep Pain → Product → How It Works → Before/After → Proof → CTA',
    fitFor: 'สินค้าพรีเมียม ราคาสูง รีวิวเจาะลึก',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพปัญหาที่คนดู relate', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'โชว์ปัญหาชัดขึ้น', dialogue: 'พูดปัญหาตรงๆ ที่คนดูเจอ' },
      { scene: 1, time: '6-8s', visual: 'Emotion เริ่มหนักขึ้น', dialogue: 'เคยลองมาหมดแล้วแต่ยังไม่ได้ผล' },
      { scene: 2, time: '0-3s', visual: 'โชว์ความล้มเหลวก่อนหน้า', dialogue: 'ขยี้ปัญหาให้หนักขึ้น' },
      { scene: 2, time: '3-6s', visual: 'Emotion ต่ำสุด', dialogue: 'จนหมดหวังแล้วว่าจะแก้ได้' },
      { scene: 2, time: '6-8s', visual: 'Deep pain moment', dialogue: 'ปัญหานี้ส่งผลกระทบชีวิตมากจริงๆ' },
      { scene: 3, time: '0-3s', visual: '[PRODUCT] ปรากฏ', dialogue: 'จนมาเจอ [PRODUCT] ตัวนี้...' },
      { scene: 3, time: '3-6s', visual: 'โชว์การใช้งานจริง', dialogue: 'จุดเด่น [PRODUCT] ที่แก้ปัญหาได้จริง' },
      { scene: 3, time: '6-8s', visual: 'โชว์ผลลัพธ์เบื้องต้น', dialogue: 'เริ่มเห็นผลแล้ว ดีกว่าที่คิด' },
      { scene: 4, time: '0-3s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 1', dialogue: 'วิธีใช้ง่ายมาก ขั้นแรกทำแบบนี้' },
      { scene: 4, time: '3-6s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 2', dialogue: 'แค่นี้เองได้ผลแล้ว' },
      { scene: 4, time: '6-8s', visual: 'ผลลัพธ์สมบูรณ์', dialogue: 'เห็นผลชัดมาก ดีใจมาก' },
      { scene: 5, time: '0-3s', visual: 'Before ชัดเจน', dialogue: 'นี่คือก่อนใช้ [PRODUCT]' },
      { scene: 5, time: '3-6s', visual: 'After ชัดเจน', dialogue: 'นี่คือหลังใช้ ต่างกันมากมาก' },
      { scene: 5, time: '6-8s', visual: 'Reaction ประทับใจ', dialogue: 'ดีใจมากที่ตัดสินใจลอง' },
      { scene: 6, time: '0-3s', visual: 'Social proof', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 6, time: '3-6s', visual: 'Reaction คนรอบข้าง', dialogue: 'คนรอบข้างทักว่าเปลี่ยนไปมาก' },
      { scene: 6, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'จุดเด่นที่ชอบที่สุด' },
      { scene: 7, time: '0-3s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ เสียดายถ้าพลาด' },
      { scene: 7, time: '3-6s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'Emotional trigger: คุ้มค่ามากจริงๆ' },
      { scene: 7, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'รีบกดก่อนของหมดนะ' },
      { scene: 8, time: '0-3s', visual: 'Final emotional moment', dialogue: 'ดีใจมากที่ตัดสินใจซื้อ' },
      { scene: 8, time: '3-6s', visual: 'ซูม [PRODUCT] สุดท้าย', dialogue: 'ใครยังไม่มีต้องรีบจัดเลย' },
      { scene: 8, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },

  /* ──────── 9 Scene · 72s ──────── */
  {
    id: '9A', sceneCount: 9, name: 'Hook → Problem → Agitate → Deep Pain → Product → How It Works → Before/After → Social Proof → FOMO → CTA',
    fitFor: 'สินค้าพรีเมียมสูง รีวิวยาว สร้าง trust เต็มรูปแบบ',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพปัญหาที่คนดู relate', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'โชว์ปัญหาชัดขึ้น', dialogue: 'พูดปัญหาตรงๆ ที่คนดูเจอ' },
      { scene: 1, time: '6-8s', visual: 'Emotion เริ่มหนักขึ้น', dialogue: 'เคยลองมาหมดแล้วแต่ยังไม่ได้ผล' },
      { scene: 2, time: '0-3s', visual: 'โชว์ความล้มเหลวก่อนหน้า', dialogue: 'ขยี้ปัญหาให้หนักขึ้น' },
      { scene: 2, time: '3-6s', visual: 'Emotion ต่ำสุด', dialogue: 'จนหมดหวังแล้วว่าจะแก้ได้' },
      { scene: 2, time: '6-8s', visual: 'Deep pain moment', dialogue: 'ปัญหานี้ส่งผลกระทบชีวิตมากจริงๆ' },
      { scene: 3, time: '0-3s', visual: '[PRODUCT] ปรากฏ', dialogue: 'จนมาเจอ [PRODUCT] ตัวนี้...' },
      { scene: 3, time: '3-6s', visual: 'โชว์การใช้งานจริง', dialogue: 'จุดเด่น [PRODUCT] ที่แก้ปัญหาได้จริง' },
      { scene: 3, time: '6-8s', visual: 'โชว์ผลลัพธ์เบื้องต้น', dialogue: 'เริ่มเห็นผลแล้ว ดีกว่าที่คิด' },
      { scene: 4, time: '0-3s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 1', dialogue: 'วิธีใช้ง่ายมาก ขั้นแรกทำแบบนี้' },
      { scene: 4, time: '3-6s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 2', dialogue: 'แค่นี้เองได้ผลแล้ว' },
      { scene: 4, time: '6-8s', visual: 'ผลลัพธ์สมบูรณ์', dialogue: 'เห็นผลชัดมาก ดีใจมาก' },
      { scene: 5, time: '0-3s', visual: 'Before ชัดเจน', dialogue: 'นี่คือก่อนใช้ [PRODUCT]' },
      { scene: 5, time: '3-6s', visual: 'After ชัดเจน', dialogue: 'นี่คือหลังใช้ ต่างกันมากมาก' },
      { scene: 5, time: '6-8s', visual: 'Reaction ประทับใจ', dialogue: 'ดีใจมากที่ตัดสินใจลอง' },
      { scene: 6, time: '0-3s', visual: 'Social proof ตัวเลข', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 6, time: '3-6s', visual: 'Reaction คนรอบข้าง', dialogue: 'คนรอบข้างทักว่าเปลี่ยนไปมาก' },
      { scene: 6, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'จุดเด่นที่ชอบที่สุด' },
      { scene: 7, time: '0-3s', visual: 'Emotional testimonial', dialogue: 'ใช้เองจริง จ่ายเองทุกบาท ดีจริง' },
      { scene: 7, time: '3-6s', visual: 'Final result showcase', dialogue: 'Emotional: ดีจนอยากบอกทุกคน' },
      { scene: 7, time: '6-8s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO seed เริ่มปลูก' },
      { scene: 8, time: '0-3s', visual: 'FOMO build up', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 8, time: '3-6s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'เสียดายมากถ้าพลาด' },
      { scene: 8, time: '6-8s', visual: 'Emotional trigger', dialogue: 'คุ้มค่ามากจริงๆ ไม่ผิดหวัง' },
      { scene: 9, time: '0-3s', visual: 'Final emotional moment', dialogue: 'ดีใจมากที่ตัดสินใจซื้อ' },
      { scene: 9, time: '3-6s', visual: 'ซูม [PRODUCT] สุดท้าย', dialogue: 'ใครยังไม่มีต้องรีบจัดเลย' },
      { scene: 9, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  },

  /* ──────── 10 Scene · 80s ──────── */
  {
    id: '10A', sceneCount: 10, name: 'สูตรสมบูรณ์แบบ ครบทุก Element',
    fitFor: 'สินค้าพรีเมียมสูงสุด รีวิวเจาะลึกสุด สร้าง trust เต็มรูปแบบ',
    beats: [
      { scene: 1, time: '0-3s', visual: 'ภาพปัญหาที่คนดู relate', dialogue: 'HOOK 15-20 คำ — ขึ้นก่อนเลย' },
      { scene: 1, time: '3-6s', visual: 'โชว์ปัญหาชัดขึ้น', dialogue: 'พูดปัญหาตรงๆ ที่คนดูเจอ' },
      { scene: 1, time: '6-8s', visual: 'Emotion เริ่มหนักขึ้น', dialogue: 'เคยลองมาหมดแล้วแต่ยังไม่ได้ผล' },
      { scene: 2, time: '0-3s', visual: 'โชว์ความล้มเหลวก่อนหน้า', dialogue: 'ขยี้ปัญหาให้หนักขึ้น' },
      { scene: 2, time: '3-6s', visual: 'Emotion ต่ำสุด', dialogue: 'จนหมดหวังแล้วว่าจะแก้ได้' },
      { scene: 2, time: '6-8s', visual: 'Deep pain moment', dialogue: 'ปัญหานี้ส่งผลกระทบชีวิตมากจริงๆ' },
      { scene: 3, time: '0-3s', visual: '[PRODUCT] ปรากฏ', dialogue: 'จนมาเจอ [PRODUCT] ตัวนี้...' },
      { scene: 3, time: '3-6s', visual: 'โชว์การใช้งานจริง', dialogue: 'จุดเด่น [PRODUCT] ที่แก้ปัญหาได้จริง' },
      { scene: 3, time: '6-8s', visual: 'โชว์ผลลัพธ์เบื้องต้น', dialogue: 'เริ่มเห็นผลแล้ว ดีกว่าที่คิด' },
      { scene: 4, time: '0-3s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 1', dialogue: 'วิธีใช้ง่ายมาก ขั้นแรกทำแบบนี้' },
      { scene: 4, time: '3-6s', visual: 'โชว์วิธีใช้ขั้นตอนที่ 2', dialogue: 'แค่นี้เองได้ผลแล้ว' },
      { scene: 4, time: '6-8s', visual: 'ผลลัพธ์สมบูรณ์', dialogue: 'เห็นผลชัดมาก ดีใจมาก' },
      { scene: 5, time: '0-3s', visual: 'Before ชัดเจน', dialogue: 'นี่คือก่อนใช้ [PRODUCT]' },
      { scene: 5, time: '3-6s', visual: 'After ชัดเจน', dialogue: 'นี่คือหลังใช้ ต่างกันมากมาก' },
      { scene: 5, time: '6-8s', visual: 'Reaction ประทับใจ', dialogue: 'ดีใจมากที่ตัดสินใจลอง' },
      { scene: 6, time: '0-3s', visual: 'Social proof ตัวเลข', dialogue: 'คนใช้แล้วบอกต่อเยอะมาก' },
      { scene: 6, time: '3-6s', visual: 'Reaction คนรอบข้าง', dialogue: 'คนรอบข้างทักว่าเปลี่ยนไปมาก' },
      { scene: 6, time: '6-8s', visual: 'Close-up [PRODUCT]', dialogue: 'จุดเด่นที่ชอบที่สุด' },
      { scene: 7, time: '0-3s', visual: 'Emotional testimonial', dialogue: 'ใช้เองจริง จ่ายเองทุกบาท ดีจริง' },
      { scene: 7, time: '3-6s', visual: 'Final result showcase', dialogue: 'Emotional: ดีจนอยากบอกทุกคน' },
      { scene: 7, time: '6-8s', visual: 'ซูม [PRODUCT]', dialogue: 'FOMO seed เริ่มปลูก' },
      { scene: 8, time: '0-3s', visual: 'FOMO build up', dialogue: 'FOMO: โปรแบบนี้ไม่มีบ่อยๆ' },
      { scene: 8, time: '3-6s', visual: '[PRODUCT] พร้อมตะกร้า', dialogue: 'เสียดายมากถ้าพลาด' },
      { scene: 8, time: '6-8s', visual: 'Emotional trigger', dialogue: 'คุ้มค่ามากจริงๆ ไม่ผิดหวัง' },
      { scene: 9, time: '0-3s', visual: 'Final emotional moment', dialogue: 'ดีใจมากที่ตัดสินใจซื้อ' },
      { scene: 9, time: '3-6s', visual: 'ซูม [PRODUCT] สุดท้าย', dialogue: 'ใครยังไม่มีต้องรีบจัดเลย' },
      { scene: 9, time: '6-8s', visual: 'ชี้ตะกร้า', dialogue: 'รีบกดก่อนของหมดนะ' },
      { scene: 10, time: '0-3s', visual: 'Final CTA setup', dialogue: 'อย่าปล่อยให้โอกาสนี้หลุดมือ' },
      { scene: 10, time: '3-6s', visual: 'ชี้ตะกร้า ชัดเจน', dialogue: 'กดตะกร้าได้เลยนะ' },
      { scene: 10, time: '6-8s', visual: 'ซูม [PRODUCT] + จบ', dialogue: 'CTA: กดตะกร้าได้เลย' }
    ]
  }
];

/**
 * findSalesFormula — return the formula object by id.
 * @param {string} formulaId
 * @returns {object | null}
 */
function findSalesFormula(formulaId) {
  if (!formulaId) return null;
  return SALES_FORMULAS.find(function (f) { return f.id === formulaId; }) || null;
}

/**
 * listSalesFormulasByScene — return all formulas with a given sceneCount.
 * @param {number} sceneCount
 * @returns {object[]}
 */
function listSalesFormulasByScene(sceneCount) {
  var n = Number(sceneCount) || 0;
  return SALES_FORMULAS.filter(function (f) { return f.sceneCount === n; });
}

/**
 * buildSalesFormulaBlueprint — render beat-by-beat structure for the Gemini
 * user message. Caller MUST gate on payload.mode === 'product_sell'.
 * @param {string} formulaId
 * @returns {string} blueprint block or '' if formula not found
 */
function buildSalesFormulaBlueprint(formulaId) {
  var f = findSalesFormula(formulaId);
  if (!f) return '';

  var lines = [];
  lines.push('== SALES FORMULA: ' + f.id + ' — ' + f.name + ' ==');
  lines.push('Fit for: ' + f.fitFor);
  lines.push('Scene count: ' + f.sceneCount + ' ฉาก · ' + (f.sceneCount * 8) + ' วินาที');
  lines.push('');
  lines.push('BEAT-BY-BEAT BLUEPRINT (บังคับทำตามโครงนี้):');

  var currentScene = 0;
  f.beats.forEach(function (b) {
    if (b.scene !== currentScene) {
      if (currentScene !== 0) lines.push('');
      lines.push('— Scene ' + b.scene + ' (8s) —');
      currentScene = b.scene;
    }
    lines.push('  [' + b.time + '] 🎬 ' + b.visual);
    lines.push('           💬 ' + b.dialogue);
  });

  lines.push('');
  lines.push('GLOBAL RULES (บังคับทุก beat):');
  SALES_FORMULA_GLOBAL_RULES.forEach(function (r, i) {
    lines.push('  ' + (i + 1) + '. ' + r);
  });

  lines.push('');
  lines.push('⚠️ ต้องจับคู่ Image Prompt + Video Prompt ของแต่ละ Scene ให้สะท้อน beat ทั้งหมด');
  lines.push('⚠️ Dialogue ของ Scene ต้องรวม beat ทั้งหมดของ Scene นั้น (รวมกัน 15-20 คำ)');
  lines.push('⚠️ ห้ามเปลี่ยนโครง ห้ามข้าม beat ห้ามรวม beat');

  return lines.join('\n');
}

/* ════════════════════════════════════════════════════════════════════════════
 * PHASE 5 — CHARACTER & VOICE CONSISTENCY
 *
 * Ported logic from 1click-full-v3.40 (2)/js/sidepanel.js:
 *   - Gender detection pipeline (regex + voiceType selector + fallback)
 *   - Voice gender directive generation
 *   - Character lock description (single-call approach: ask Gemini to produce
 *     CHARACTER CARD in Scene 1 and reuse verbatim in Scene 2+)
 *
 * Priority order (mirrors extension):
 *   1. User-selected voiceType  → overrides everything
 *   2. detectGenderFromText     → regex match on brief/character text
 *   3. 'female' default fallback (matches extension's final fallback
 *      when productGender unknown)
 * ════════════════════════════════════════════════════════════════════════════ */

const VOICE_TYPES = [
  { id: 'ai_auto',             gender: null,     labelTh: 'AI เลือกให้ (วิเคราะห์จากรูปและข้อความ)', voiceEn: 'Thai voice matched to character appearance' },
  { id: 'female',              gender: 'female', labelTh: 'หญิง · มาตรฐาน',                      voiceEn: 'young Thai female voice' },
  { id: 'male',                gender: 'male',   labelTh: 'ชาย · มาตรฐาน',                       voiceEn: 'young Thai male voice' },
  { id: 'female_northern',     gender: 'female', labelTh: 'หญิง · ภาคเหนือ (คำเมือง)',           voiceEn: 'young Thai female voice with Northern Thai (Kham Mueang) accent' },
  { id: 'female_northeastern', gender: 'female', labelTh: 'หญิง · อีสาน',                        voiceEn: 'young Thai female voice with Isan (Northeastern) accent' },
  { id: 'female_southern',     gender: 'female', labelTh: 'หญิง · ภาคใต้',                       voiceEn: 'young Thai female voice with Southern Thai accent' },
  { id: 'male_northern',       gender: 'male',   labelTh: 'ชาย · ภาคเหนือ',                      voiceEn: 'young Thai male voice with Northern Thai (Kham Mueang) accent' },
  { id: 'male_northeastern',   gender: 'male',   labelTh: 'ชาย · อีสาน',                         voiceEn: 'young Thai male voice with Isan (Northeastern) accent' }
];

const FEMALE_REGEX = /woman|female|girl|lady|grandmother|mother|sister|aunt|queen|princess|actress|แม่|คุณแม่|สาว|ผู้หญิง|หญิง|ยาย|ย่า|ป้า|น้า|พี่สาว|น้องสาว|เจ๊|นางแบบ|บิวตี้|beauty|นางเอก|หล่อน|นาง/i;
const MALE_REGEX = /\bman\b|\bmale\b|boy|gentleman|grandfather|father|brother|uncle|king|prince|actor|พ่อ|คุณพ่อ|หนุ่ม|ผู้ชาย|ชาย|ปู่|ตา|ลุง|อา|พี่ชาย|น้องชาย|เฮีย|นาย|พระเอก/i;

/**
 * Detect gender from free text (brief, character description, etc.).
 * Returns 'female' | 'male' | null.
 */
function detectGenderFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const hasFemale = FEMALE_REGEX.test(text);
  const hasMale = MALE_REGEX.test(text);
  if (hasFemale && !hasMale) return 'female';
  if (hasMale && !hasFemale) return 'male';
  if (hasFemale && hasMale) {
    const fIdx = text.search(FEMALE_REGEX);
    const mIdx = text.search(MALE_REGEX);
    return fIdx < mIdx ? 'female' : 'male';
  }
  return null;
}

/**
 * Find VOICE_TYPES entry by id. Returns null on miss.
 */
function findVoiceType(id) {
  if (!id) return null;
  return VOICE_TYPES.find(function (v) { return v.id === id; }) || null;
}

/**
 * Resolve the final voice directive + detected gender for a payload.
 * Priority:
 *   1. payload.voiceType (user selection, if not 'ai_auto' or null)
 *   2. detectGenderFromText on payload.prompt
 *   3. 'female' (final fallback — matches extension default)
 *
 * Returns { gender, voiceEn, voiceLabelTh, source }
 */
function resolveVoiceDirective(payload) {
  payload = payload || {};

  const picked = findVoiceType(payload.voiceType);
  if (picked && picked.gender) {
    return {
      gender: picked.gender,
      voiceEn: picked.voiceEn,
      voiceLabelTh: picked.labelTh,
      source: 'user-selected'
    };
  }

  const textGuess = detectGenderFromText(payload.prompt || '');
  if (textGuess === 'female') {
    return {
      gender: 'female',
      voiceEn: 'young Thai female voice',
      voiceLabelTh: 'หญิง (detected จาก brief)',
      source: 'text-detection'
    };
  }
  if (textGuess === 'male') {
    return {
      gender: 'male',
      voiceEn: 'young Thai male voice',
      voiceLabelTh: 'ชาย (detected จาก brief)',
      source: 'text-detection'
    };
  }

  return {
    gender: 'female',
    voiceEn: 'young Thai female voice',
    voiceLabelTh: 'หญิง (default)',
    source: 'fallback'
  };
}

/**
 * Build VOICE GENDER directive line for video prompt (mirrors extension line 4291-4306).
 */
function buildVoiceGenderDirective(resolved) {
  if (!resolved || !resolved.gender) return 'VOICE: Match voice gender to the character appearance in the reference image.';
  if (resolved.gender === 'female') {
    return 'VOICE GENDER: ' + resolved.voiceEn + '. Match voice to female character appearance. ห้ามใช้เสียงผู้ชายเด็ดขาด';
  }
  return 'VOICE GENDER: ' + resolved.voiceEn + '. Match voice to male character appearance. ห้ามใช้เสียงผู้หญิงเด็ดขาด';
}

/**
 * Build HERO BIBLE (รายละเอียดฮีโร่เต็ม) — บังคับรายละเอียด/ชื่อ/บทสนทนา แทน compact card.
 */
function buildCharacterLockInstruction(payload, resolvedVoice) {
  const hasCharImg =
    (payload && payload.images && (payload.images.character1Attached || payload.images.character2Attached || payload.images.character3Attached)) ||
    (payload && payload.characterAttached);
  const characterImageNote = hasCharImg
    ? 'ผู้ใช้อัปโหลดรูปตัวละครมาด้วย — ใช้ข้อมูลจากรูปเป็นหลัก 100% (หน้าตา ทรงผม เสื้อผ้า อายุ เพศ สภาพผิว)'
    : 'ผู้ใช้ไม่ได้อัปโหลดรูปตัวละคร — ออกแบบตัวละครให้ตรง context ของเรื่อง/สินค้า/Style/Mood ที่เลือก ห้ามก็อปป้ายชุด/หน้า default ซ้ำ';

  const defaultVoice = resolvedVoice && resolvedVoice.voiceEn ? resolvedVoice.voiceEn : 'young Thai female voice';

  return [
    '═══ HERO BIBLE (รายละเอียดตัวละคร + ล็อคบทสนทนา — ชื่อไม่บังคับ) ═══',
    '',
    '⛔ ห้ามใช้ "บัตรตัวละครแบบย่อ" (compact card) หรือช่องว่าง null หรืออ้าง "ดู card ข้างบน" แบบสั้นๆ',
    '⛔ ห้ามล็อคเสียงเป็นวลีเดียวตายตัวเช่น "young Thai female voice" เป็นศูนย์กลาง — ให้ยึด **บทสนทนาไทย (Dialogue) ตามที่เขียนเป๊ะ** เป็นหลัก; **ไม่บังคับตั้งชื่อมนุษย์/ชื่อเล่น** — ถ้าไม่ต้องการตั้งชื่อ ใช้ **ฉลากบทบาทคงที่** แทน (เช่น "ฝ่ายพูด", "เพื่อน (หญิง วัย 20–25)", "คนรับสาร (ชาย)") แล้วล็อคฉลากนั้นให้ชี้ตัวคนเดิมทุกฉาก',
    '    เลือกน้ำเสียง TTS ให้สอดคล้อง **อายุ/เพศ/บุคลิก** ของบทบาทนั้น (ค่าเริ่มต้นระบบ: ' + defaultVoice + ' = แค่ hint)',
    '',
    '✅ ขึ้นต้น output (ก่อน Scene 1) ด้วยบล็อก "HERO BIBLE" ยาว ชัดเจน ภาษาไทย+อังกฤษตามความเหมาะสม:',
    '  • ทุก **ตัวละครที่พูดหรือสำคัญต่อภาพ** — อธิบาย **หน้า ทรงผม รูปร่าง อายุ เพศ ชุด จุดสังเกต** แยก paragraph; อาจใช้ **ฉลาก Role + รายละเอียด** แทนการตั้งชื่อ ห้ามย่อห้าม "…same as card…"',
    '  • ถ้าไม่สร้างชื่อ: กำหนด "ROLE_A / ROLE_B" หรือ "ผู้พูด / คนรับสาร" แล้วใช้ฉลากนั้นใน `Speaker:` ซ้ำทุกฉาก ห้ามสลับว่า Role ไหนเป็นคนเดิม',
    '  • ถ้าตัวเดิมออกฉากซ้ำ ให้ **ย้ำรายละเอียดเดิมซ้ำ** ตรงฉากนั้น (ต้องคัดลอกรายละเอียดจริง หรือพิมพ์ยาวเทียบเท่า) เพื่อ **consistency**',
    '  • ล็อค **บรรทัดบทสนทนาไทย (Dialogue)** ใน video prompt ให้ตรงกับฉากนั้น ห้ามพาราเฟรสเอง ห้ามเพิ่มบท',
    '',
    '```',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'HERO BIBLE — ตัวอย่าง (มีชื่อ หรือ ใช้ ROLE ก็ได้ — รายละเอียดเต็ม ห้ามเว้นแบบย่อ)',
    'SPEAKER_1: [ชื่อ หรือ ฉลากบทบาท] — อายุ/เพศ/หน้าตา/ผม/รูปร่าง/ชุด/สี/อุปกรณ์',
    'SPEAKER_2: … (ถ้ามี)',
    'ฝูง/ตัวประกอบ: … (ถ้ามีและมีบท/มีใบหน้า)',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '```',
    '',
    'SOURCE: ' + characterImageNote,
    '',
    '✅ ในทุกฉากที่มี IMAGE/VIDEO PROMPT: ใส่ "Speaker: <ชื่อ หรือ ฉลาก ROLE จาก HERO BIBLE>" แล้ว **ตามด้วยรายละเอียดบุคลิก/รูปร่าง (สำหรับฉากนี้) ยาว ชัด** — รวมตัวที่พูดและตัวที่เห็นในเฟรม; ตัวประกอบที่มองเห็นใบหน้าให้บรรยายสั้นๆ ให้สอดคล้อง HERO BIBLE',
    '✅ ห้ามใส่ [Character Reference: …] สั้นๆ แทนการบรรยาย — ถ้าจำเป็นต้อง reference ใช้การ **copy ข้อความรายละเอียด** มาซ้ำในฉาก ไม่ใช่คำว่า "as above"',
    ''
  ].join('\n');
}

/* ════════════════════════════════════════════════════════════════════════════
 * PHASE A — Deterministic Character Card (token-efficient, single-clip lock)
 *
 * Goal: parse user's free text → produce a compact EN CHARACTER CARD
 * that Gemini is instructed to copy verbatim + reuse every scene.
 *
 * No AI pre-pass. No reference image needed. ~60 tokens per card.
 * Priority when resolving gender (already handled by resolveVoiceDirective):
 *   user voice pick → regex on text → default female
 * Priority when resolving role:
 *   first keyword match in ROLE_KEYWORDS (ordered)
 *   fallback → generic_person + gender
 * ════════════════════════════════════════════════════════════════════════════ */

/* Ordered list — first matching role wins. More-specific patterns first.
 * Teacher placed BEFORE student because "อาจารย์" should win over generic "วัยเรียน" leak;
 * shop_owner placed early so "แม่ค้า" wins over generic "mother". */
const ROLE_KEYWORDS = [
  { id: 'beauty_expert',  pattern: /บิวตี้\s*กูรู|beauty\s*(guru|expert)|makeup\s*artist|ช่างแต่งหน้า|บล็อกเกอร์ความงาม|skincare\s*(lover|expert)|\bMUA\b/i,                                                gender: 'female' },
  { id: 'shop_owner',     pattern: /แม่ค้า(?!น้ำ)|พ่อค้า|เจ้าของร้าน|ขายของ\s*(online|ออนไลน์)?|\bseller\b|\bshopkeeper\b|\bshop\s*owner\b|พ่อค้าแม่ค้า|ร้านค้าออนไลน์/i,                                      gender: null     },
  { id: 'teacher',        pattern: /คุณครู|\bครู(?!บา)|อาจารย์|\bteacher\b|\blecturer\b|\bprofessor\b/i,                                                                                                    gender: null     },
  { id: 'medical',        pattern: /คุณหมอ|หมอ(?!ดู|บา|ลำ)|พยาบาล|เภสัชกร|เภสัช|\bdoctor\b|\bnurse\b|\bpharmacist\b/i,                                                                                      gender: null     },
  { id: 'chef',           pattern: /เชฟ|แม่ครัว|พ่อครัว|คนทำอาหาร|เบเกอร์|baker|\bchef\b|\bcook(?!ie)\b|cafe\s*owner|บาริสต้า|barista/i,                                                                     gender: null     },
  { id: 'athlete',        pattern: /นักกีฬา|นักวิ่ง|นักฟิตเนส|นักปั่น|คนออกกำลัง|\bathlete\b|\brunner\b|gym\s*(bro|girl|lover)/i,                                                                              gender: null     },
  { id: 'mother',         pattern: /คุณแม่(?!ค้า)|แม่บ้าน(?!การเงิน)|แม่ลูก\s*\d*|แม่ลูกอ่อน|แม่ของ|\bmother\b|\bhousewife\b|แม่เลี้ยงเดี่ยว/i,                                                                 gender: 'female' },
  { id: 'father',         pattern: /คุณพ่อ|พ่อบ้าน|พ่อลูก|พ่อลูกอ่อน|\bfather\b|\bdad\b|พ่อเลี้ยงเดี่ยว/i,                                                                                                    gender: 'male'   },
  { id: 'office_woman',   pattern: /สาววัยทำงาน|สาวออฟฟิศ|พนักงานหญิง|พนง\.?\s*หญิง|\bOL\b|ออฟฟิศเลดี้|มนุษย์เงินเดือน(?=.*(สาว|หญิง|ผู้หญิง))|office\s*(lady|woman|girl)/i,                                    gender: 'female' },
  { id: 'office_man',     pattern: /หนุ่มออฟฟิศ|หนุ่มวัยทำงาน|พนักงานชาย|พนง\.?\s*ชาย|มนุษย์เงินเดือน|office\s*(man|guy)/i,                                                                                    gender: 'male'   },
  { id: 'student',        pattern: /นักศึกษา|นักเรียน|(?<![ก-๙])นศ\.?(?![ก-๙])|(?<![ก-๙])นร\.?(?![ก-๙])|เด็ก\s*ม\.?\s*ปลาย|เด็กมหา'ลัย|มหา'ลัย|ม\.\s*ปลาย|ม\.\s*ต้น|สาวมัธยม|หนุ่มมัธยม|วัยเรียน|\bstudent\b|\bcollege\b/i,   gender: null     },
  { id: 'teen_girl',      pattern: /เด็กสาว|วัยรุ่นหญิง|สาววัยรุ่น|น้องสาว|teen(age)?\s*girl/i,                                                                                                               gender: 'female' },
  { id: 'teen_boy',       pattern: /เด็กหนุ่ม|วัยรุ่นชาย|หนุ่มวัยรุ่น|น้องชาย|teen(age)?\s*boy/i,                                                                                                             gender: 'male'   },
  { id: 'elder_woman',    pattern: /คุณป้า|คุณยาย|คุณย่า|ผู้สูงอายุหญิง|วัยทอง|grandma|elderly\s*woman/i,                                                                                                     gender: 'female' },
  { id: 'elder_man',      pattern: /คุณลุง|(?<![ก-๙])ลุง(?![ก-๙])|คุณตา|คุณปู่|ผู้สูงอายุชาย|วัยเกษียณ|grandpa|elderly\s*man/i,                                                                                                      gender: 'male'   }
];

const ROLE_DEFAULTS = {
  office_woman: {
    role_en: 'office woman',
    age_range: '25-30',
    appearance: 'Thai skin, long straight black hair, light natural makeup',
    outfit: 'OUTFIT SUGGESTION: white long-sleeve blouse (plain), black knee-length pencil skirt, black low heels, silver stud earrings only, no jacket'
  },
  office_man: {
    role_en: 'office man',
    age_range: '28-33',
    appearance: 'Thai skin, short black hair, clean-shaven',
    outfit: 'OUTFIT SUGGESTION: light blue long-sleeve dress shirt, charcoal straight slacks, black leather loafers, black belt, no tie, no hat'
  },
  mother: {
    role_en: 'Thai mother',
    age_range: '30-38',
    appearance: 'Thai skin, shoulder-length black hair, warm friendly face',
    outfit: 'OUTFIT SUGGESTION: pastel pink short-sleeve blouse, medium-blue straight jeans, white sneakers, thin silver bracelet only'
  },
  father: {
    role_en: 'Thai father',
    age_range: '33-42',
    appearance: 'Thai skin, short black hair, calm expression',
    outfit: 'OUTFIT SUGGESTION: navy polo shirt, khaki chinos, white low-top sneakers, black watch only'
  },
  student: {
    role_en: 'Thai student',
    age_range: '18-22',
    appearance: 'Thai skin, youthful fresh face, simple hair',
    outfit: 'OUTFIT SUGGESTION: plain white t-shirt, light blue straight jeans, white canvas sneakers, black backpack, no extra jewelry'
  },
  medical: {
    role_en: 'Thai medical professional',
    age_range: '28-35',
    appearance: 'Thai skin, neat short/tied-back black hair, trustworthy expression',
    outfit: 'OUTFIT SUGGESTION: white medical coat over light blue scrubs, white clinic shoes, stethoscope, no additional accessories'
  },
  chef: {
    role_en: 'Thai chef',
    age_range: '28-40',
    appearance: 'Thai skin, neat hair tied back, focused expression',
    outfit: 'OUTFIT SUGGESTION: white chef jacket, black apron, black chef pants, black non-slip kitchen shoes, no jewelry'
  },
  beauty_expert: {
    role_en: 'Thai beauty expert',
    age_range: '24-30',
    appearance: 'Thai skin, glowing polished makeup, long styled black hair',
    outfit: 'OUTFIT SUGGESTION: fitted beige blouse, white high-waist wide-leg pants, nude heels, small gold hoop earrings, delicate gold necklace'
  },
  teen_girl: {
    role_en: 'Thai teenage girl',
    age_range: '16-20',
    appearance: 'Thai skin, youthful cute face, long straight black hair',
    outfit: 'OUTFIT SUGGESTION: pastel blue baby tee, white pleated mini skirt, white sneakers, simple hair clip, no heavy jewelry'
  },
  teen_boy: {
    role_en: 'Thai teenage boy',
    age_range: '16-20',
    appearance: 'Thai skin, short black hair, youthful face',
    outfit: 'OUTFIT SUGGESTION: oversized gray t-shirt, dark blue relaxed jeans, white sneakers, black wristband only'
  },
  athlete: {
    role_en: 'Thai athlete',
    age_range: '22-30',
    appearance: 'Thai skin, toned build, sporty short hair',
    outfit: 'OUTFIT SUGGESTION: black athletic tank top, black running shorts, white running shoes with black accents, sports watch only'
  },
  elder_woman: {
    role_en: 'Thai elder woman',
    age_range: '55-65',
    appearance: 'Thai skin, graying short hair, kind face',
    outfit: 'OUTFIT SUGGESTION: cream traditional Thai blouse, dark brown long skirt, black flat shoes, small pearl earrings'
  },
  elder_man: {
    role_en: 'Thai elder man',
    age_range: '55-65',
    appearance: 'Thai skin, graying short hair, calm weathered face',
    outfit: 'OUTFIT SUGGESTION: light gray short-sleeve button shirt, dark gray slacks, black slip-on shoes, no tie, no hat'
  },
  shop_owner: {
    role_en: 'Thai shop owner',
    age_range: '28-38',
    appearance: 'Thai skin, practical tied-back hair, energetic friendly face',
    outfit: 'OUTFIT SUGGESTION: brand navy polo shirt, black apron, dark jeans, black sneakers, name tag, no extra accessories'
  },
  teacher: {
    role_en: 'Thai teacher',
    age_range: '28-40',
    appearance: 'Thai skin, neat hair, composed trustworthy expression',
    outfit: 'OUTFIT SUGGESTION: light beige blouse, navy midi skirt, black low heels, small silver earrings, no outerwear'
  },
  generic_person_female: {
    role_en: 'Thai woman',
    age_range: '22-28',
    appearance: 'Thai skin, long black hair, natural makeup, friendly face',
    outfit: 'OUTFIT SUGGESTION: white long-sleeve blouse (plain), medium-blue high-waist straight jeans, white sneakers, silver stud earrings only'
  },
  generic_person_male: {
    role_en: 'Thai man',
    age_range: '22-30',
    appearance: 'Thai skin, short black hair, friendly face',
    outfit: 'OUTFIT SUGGESTION: navy polo shirt, medium-blue straight jeans, white sneakers, black wristwatch only, no hat'
  }
};

/** Detect role id from free text. Returns roleId or null. */
function detectRoleFromText(text) {
  if (!text || typeof text !== 'string') return null;
  for (let i = 0; i < ROLE_KEYWORDS.length; i++) {
    const r = ROLE_KEYWORDS[i];
    if (r.pattern.test(text)) return r.id;
  }
  return null;
}

/** Pick a default role record based on detected role + gender. */
function pickRoleDefaults(roleId, gender) {
  if (roleId && ROLE_DEFAULTS[roleId]) return { roleId: roleId, data: ROLE_DEFAULTS[roleId] };
  const fallbackId = gender === 'male' ? 'generic_person_male' : 'generic_person_female';
  return { roleId: fallbackId, data: ROLE_DEFAULTS[fallbackId] };
}

const OUTFIT_STYLE_PRESETS = [
  {
    pattern: /ชุดโทรม|โทรมๆ|มอมแมม|เก่าๆ|เก่า\b|worn-?out|ragged|shabby/i,
    spec: {
      top: 'faded loose t-shirt',
      bottom: 'worn straight jeans',
      shoes: 'used canvas sneakers',
      accessories: 'no jewelry',
      extra: 'slightly wrinkled fabric'
    }
  },
  {
    pattern: /ชุดเลิศ|เลิศๆ|หรู|หรูหรา|เนี้ยบ|หรูๆ|glam|luxury|elegant|polished/i,
    spec: {
      top: 'tailored fitted top or blouse',
      bottom: 'tailored pants or elegant skirt',
      shoes: 'polished formal shoes or heels',
      accessories: 'minimal premium jewelry',
      extra: 'clean high-end finish'
    }
  },
  {
    pattern: /ชุดบ้านนอก|บ้านนอกๆ|ลูกทุ่ง|ชนบท|rural|country style/i,
    spec: {
      top: 'simple cotton plaid shirt',
      bottom: 'work pants or long simple skirt',
      shoes: 'rubber sandals or basic slip-on shoes',
      accessories: 'simple local accessories only',
      extra: 'practical everyday countryside style'
    }
  }
];

const OUTFIT_COLOR_HINTS = [
  { pattern: /ขาว|white/i, label: 'white' },
  { pattern: /ดำ|black/i, label: 'black' },
  { pattern: /เทา|gray|grey/i, label: 'gray' },
  { pattern: /น้ำเงิน|กรม|navy|blue/i, label: 'blue' },
  { pattern: /ฟ้า|sky blue|light blue/i, label: 'light blue' },
  { pattern: /เขียว|green/i, label: 'green' },
  { pattern: /แดง|red/i, label: 'red' },
  { pattern: /ชมพู|pink/i, label: 'pink' },
  { pattern: /ม่วง|purple|violet/i, label: 'purple' },
  { pattern: /น้ำตาล|brown/i, label: 'brown' },
  { pattern: /ครีม|เบจ|beige|cream/i, label: 'beige/cream' },
  { pattern: /ทอง|gold/i, label: 'gold' },
  { pattern: /เงิน|silver/i, label: 'silver' }
];

function stripOutfitLockedPrefix(text) {
  // Accept both legacy "OUTFIT LOCKED:" and new "OUTFIT SUGGESTION:" prefixes
  return String(text || '').replace(/^OUTFIT\s+(?:LOCKED|SUGGESTION):\s*/i, '').trim();
}

function collectColorLabels(text) {
  const out = [];
  const src = String(text || '');
  for (let i = 0; i < OUTFIT_COLOR_HINTS.length; i++) {
    const c = OUTFIT_COLOR_HINTS[i];
    if (c.pattern.test(src) && out.indexOf(c.label) === -1) out.push(c.label);
  }
  return out;
}

function parseDefaultOutfitSpec(outfitText) {
  const clean = stripOutfitLockedPrefix(outfitText);
  const parts = clean.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    top: parts[0] || 'plain top',
    bottom: parts[1] || 'simple bottom',
    shoes: parts[2] || 'basic shoes',
    accessories: parts[3] || 'minimal accessories',
    extra: parts.slice(4).join(', '),
    colors: collectColorLabels(clean)
  };
}

function normalizeOutfitSpec(spec) {
  const s = spec || {};
  const colors = Array.isArray(s.colors) ? s.colors.filter(Boolean) : [];
  return {
    top: s.top || 'plain top',
    bottom: s.bottom || 'simple bottom',
    shoes: s.shoes || 'basic shoes',
    accessories: s.accessories || 'minimal accessories',
    extra: s.extra || '',
    colors: colors
  };
}

function stringifyLockedOutfit(spec) {
  const s = normalizeOutfitSpec(spec);
  const bits = [
    s.top,
    s.bottom,
    s.shoes,
    s.accessories
  ];
  if (s.colors.length) bits.push('color palette suggestion: ' + s.colors.join('/'));
  if (s.extra) bits.push(s.extra);
  return 'OUTFIT SUGGESTION: ' + bits.join(', ');
}

function resolveOutfitFromUserIntent(promptText, roleDefaultOutfit) {
  const text = String(promptText || '');
  const base = parseDefaultOutfitSpec(roleDefaultOutfit);
  const hasOutfitIntent = /ชุด|แต่งตัว|เสื้อ|กางเกง|กระโปรง|รองเท้า|เครื่องประดับ|ต่างหู|สร้อย|แหวน|เสื้อผ้า|outfit|wardrobe|look|style|shirt|blouse|pants|skirt|shoes|sneakers|heels|jewelry/i.test(text);
  let usedUserIntent = false;
  const merged = {
    top: base.top,
    bottom: base.bottom,
    shoes: base.shoes,
    accessories: base.accessories,
    extra: base.extra,
    colors: base.colors.slice()
  };

  for (let i = 0; i < OUTFIT_STYLE_PRESETS.length; i++) {
    const p = OUTFIT_STYLE_PRESETS[i];
    if (!p.pattern.test(text)) continue;
    usedUserIntent = true;
    merged.top = p.spec.top || merged.top;
    merged.bottom = p.spec.bottom || merged.bottom;
    merged.shoes = p.spec.shoes || merged.shoes;
    merged.accessories = p.spec.accessories || merged.accessories;
    merged.extra = p.spec.extra || merged.extra;
    break;
  }

  if (/เสื้อเชิ้ต|shirt|blouse/i.test(text)) { merged.top = 'shirt or blouse (user-specified)'; usedUserIntent = true; }
  if (/เสื้อยืด|t-?shirt|tee\b/i.test(text)) { merged.top = 'plain t-shirt (user-specified)'; usedUserIntent = true; }
  if (/ฮู้ด|hoodie/i.test(text)) { merged.top = 'hoodie (user-specified)'; usedUserIntent = true; }
  if (/สูท|blazer|สูทลำลอง/i.test(text)) { merged.top = 'blazer/suit top (user-specified)'; usedUserIntent = true; }

  if (/ยีนส์|jeans|denim/i.test(text)) { merged.bottom = 'jeans (user-specified)'; usedUserIntent = true; }
  if (/กระโปรง|skirt/i.test(text)) { merged.bottom = 'skirt (user-specified)'; usedUserIntent = true; }
  if (/สแลค|slacks|trousers|chinos/i.test(text)) { merged.bottom = 'slacks/trousers (user-specified)'; usedUserIntent = true; }
  if (/ขาสั้น|shorts/i.test(text)) { merged.bottom = 'shorts (user-specified)'; usedUserIntent = true; }

  if (/ผ้าใบ|sneakers?/i.test(text)) { merged.shoes = 'sneakers (user-specified)'; usedUserIntent = true; }
  if (/ส้นสูง|heels?/i.test(text)) { merged.shoes = 'heels (user-specified)'; usedUserIntent = true; }
  if (/บูท|boots?/i.test(text)) { merged.shoes = 'boots (user-specified)'; usedUserIntent = true; }
  if (/แตะ|sandals?/i.test(text)) { merged.shoes = 'sandals (user-specified)'; usedUserIntent = true; }

  if (/ไม่ใส่(?:เครื่องประดับ|จิวเวลรี่)|no jewelry|no accessories/i.test(text)) {
    merged.accessories = 'no jewelry/accessories';
    usedUserIntent = true;
  } else if (/ต่างหู|earrings?/i.test(text)) {
    merged.accessories = 'earrings (user-specified)';
    usedUserIntent = true;
  } else if (/สร้อย|necklace/i.test(text)) {
    merged.accessories = 'necklace (user-specified)';
    usedUserIntent = true;
  } else if (/กำไล|bracelet/i.test(text)) {
    merged.accessories = 'bracelet (user-specified)';
    usedUserIntent = true;
  } else if (/นาฬิกา|watch/i.test(text)) {
    merged.accessories = 'watch (user-specified)';
    usedUserIntent = true;
  }

  const userColors = collectColorLabels(text);
  if (userColors.length) {
    merged.colors = userColors;
    usedUserIntent = true;
  }

  return {
    hasOutfitIntent: hasOutfitIntent,
    usedUserIntent: usedUserIntent,
    spec: normalizeOutfitSpec(merged),
    outfit: stringifyLockedOutfit(merged)
  };
}

/**
 * Build deterministic CHARACTER CARD from payload + resolved voice.
 * Returns: { card, cardTextEN, cardTextThaiShort, source }
 *
 * card fields:
 *   role_id, role_en, gender, age_range, appearance, outfit, voice_en, lock_scope
 *
 * cardTextEN: ~35 tokens, injected into system prompt (copy-verbatim instruction)
 */
function buildCompactCharacterCard(payload, resolvedVoice) {
  payload = payload || {};
  resolvedVoice = resolvedVoice || { gender: 'female', voiceEn: 'young Thai female voice', source: 'fallback' };

  const text = payload.prompt || '';
  const detectedRole = detectRoleFromText(text);
  const rolePick = pickRoleDefaults(detectedRole, resolvedVoice.gender);
  const data = rolePick.data;
  const outfitResolved = resolveOutfitFromUserIntent(text, data.outfit);

  const hasCharImg =
    (payload.images && (payload.images.character1Attached || payload.images.character2Attached || payload.images.character3Attached)) ||
    payload.characterAttached;

  const card = {
    role_id: rolePick.roleId,
    role_en: data.role_en,
    gender: resolvedVoice.gender || 'female',
    age_range: data.age_range,
    appearance: data.appearance,
    outfit: outfitResolved.outfit,
    voice_en: resolvedVoice.voiceEn,
    lock_scope: 'single_clip',
    image_ref: !!hasCharImg
  };

  /* Compact EN representation — ONE block, ~35-45 tokens */
  const cardTextEN = [
    'CHAR: ' + card.role_en + ', ' + card.gender + ', ' + card.age_range + ', ' + card.appearance + ', ' + card.outfit,
    'VOICE: ' + card.voice_en
  ].join('\n');

  /* Thai-friendly short version (for debugging / UI preview only, not injected) */
  const cardTextThaiShort = [
    'บทบาท: ' + card.role_en + ' (' + card.gender + ', ' + card.age_range + ')',
    'หน้าตา: ' + card.appearance,
    'เสื้อผ้า: ' + card.outfit,
    'เสียง: ' + card.voice_en
  ].join(' · ');

  return {
    card: card,
    cardTextEN: cardTextEN,
    cardTextThaiShort: cardTextThaiShort,
    source: (detectedRole ? 'text-keyword' : 'default-fallback') + (outfitResolved.usedUserIntent ? '+user-outfit-intent' : '')
  };
}

/**
 * Build the system-prompt injection block for CHARACTER CARD.
 *
 * Design:
 *   - Gemini receives the pre-built card + instruction: copy verbatim, lock across scenes.
 *   - Override carve-out: sales formula beats may change OUTFIT for before/after pattern.
 *   - Face/voice are NEVER overridable.
 *   - If reference image attached → tell Gemini to prefer image for face/hair/outfit details.
 *
 * Target: ~120 tokens total (replaces the ~200-token buildCharacterLockInstruction).
 */
function buildCompactCardInjectionBlock(cardResult, payload) {
  if (!cardResult || !cardResult.cardTextEN) return '';
  const hasRefImg = cardResult.card && cardResult.card.image_ref;
  const isProductSell = payload && payload.mode === 'product_sell';
  const hasBlueprint = isProductSell && payload.salesFormulaId;

  const lines = [
    '═══ HERO BIBLE — seed (นำไปขยายเป็นย่อหน้าเต็ม ห้ามคงแค่ seed) ═══',
    '',
    'Starting point from system (expand into full HERO BIBLE; age, look, outfit — **personal names optional**; use **stable role labels** if the user does not want named characters):',
    cardResult.cardTextEN,
    '',
    'RULES:',
    '  1. At output start, expand the seed above into a full **HERO BIBLE** in Thai+EN as needed: every speaking role + on-camera extras, full sentences — no "compact" tables.',
    '  2. **LOCK** either **stable Thai names** OR **stable role labels (ROLE_A, “เพื่อน”, ฯลฯ)** — same person must map to the same label every scene. **LOCK** the **exact Thai dialogue** in each `Dialogue:` line (no paraphrase).',
    '  3. **Voice (TTS)**: must match each speaker role age/gender/persona — not a one-line global default for everyone.',
    '  4. Face, hair, outfit: consistent across scenes' + (hasBlueprint
        ? ' — EXCEPT if a sales-formula beat says before/after wardrobe for one scene; then follow the beat and repeat full detail in that scene block.'
        : ' — if a character reappears, **paste repeated full detail** in that scene block; do not write "same as above".'),
    '  5. Do not add new heroes mid-story (extras without lines may be generic extras only).'
  ];
  if (hasRefImg) {
    lines.push('  6. Character reference image attached: match face/hair; still write full verbal description in every scene that shows them.');
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Short reference line for user message (no duplication of card content).
 * ~15 tokens.
 */
function buildCardUserReference(cardResult) {
  if (!cardResult || !cardResult.cardTextEN) return '';
  return 'HERO: expand the HERO BIBLE in system prompt (full look + outfit per role). Personal names are optional—use stable role labels if you must not name anyone. Lock those labels and exact Thai DIALOGUE lines. Repeat full detail in each scene. Voice per role—not one default for all.';
}

/* ────────────────────────────────────────────────────────────────────────────
 * EXPLICIT GLOBAL EXPORTS — ป้องกัน edge case บนมือถือ/บางเอนจินที่ไม่ดัน
 * top-level function declarations เข้าหน้าต่างอัตโนมัติ และทำให้ฝั่ง HTML
 * ตรวจสอบได้ชัดว่า bundle โหลดสำเร็จ (`window.__SALES_FORMULAS_LOADED__`).
 * ──────────────────────────────────────────────────────────────────────────── */
if (typeof globalThis !== 'undefined') {
  try {
    globalThis.findSalesFormula = findSalesFormula;
    globalThis.listSalesFormulasByScene = listSalesFormulasByScene;
    globalThis.buildSalesFormulaBlueprint = buildSalesFormulaBlueprint;
    globalThis.SALES_FORMULAS = SALES_FORMULAS;
    globalThis.__SALES_FORMULAS_LOADED__ = Array.isArray(SALES_FORMULAS) && SALES_FORMULAS.length > 0;
  } catch (_) {}
}
