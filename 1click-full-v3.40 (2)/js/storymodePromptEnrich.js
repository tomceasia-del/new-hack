/**
 * Storymode prompt enrichment — narrative persona (60) + mood LLM fragments (38).
 * Keys for mood must match MOOD_KEYWORDS strings in promptTemplate.js exactly.
 */

/** @type {Record<number, string>} */
export const NARRATIVE_PROMPT_BY_STYLE_ID = {
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
  42: 'Skincare monologue: factory-to-face journey; pride in glow-up; jealous side-eye at rival bottles on the shelf.',
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
export const MOOD_LLM_DIRECTIVE_BY_KEYWORD = {
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
export function getMoodDirective(moodKeyword) {
  if (!moodKeyword) return '';
  return MOOD_LLM_DIRECTIVE_BY_KEYWORD[moodKeyword]
    || `Match overall lighting, color grade, and pacing to this mood label: "${moodKeyword}". Keep visuals coherent and platform-safe.`;
}

/**
 * @param {number[]} styleIds
 * @returns {string}
 */
export function formatNarrativePromptsForMessage(styleIds) {
  if (!styleIds || styleIds.length === 0) return '';
  const lines = styleIds.map((id) => {
    const p = NARRATIVE_PROMPT_BY_STYLE_ID[id];
    return p ? `[Style ${id}] ${p}` : '';
  }).filter(Boolean);
  return lines.join('\n\n');
}
