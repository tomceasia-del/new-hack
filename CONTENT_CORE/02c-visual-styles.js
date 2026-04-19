/**
 * CONTENT_CORE/02c-visual-styles.js
 * Visual Styles Library + Scene Templates + Supporting Arrays
 * Split from: 02-master-prompt-template.js lines 627–839
 * Contains: VISUAL_STYLES (50 entries), SCENE_TEMPLATES, DIALECTS, TONES,
 *           SCENE_LOCATIONS, PACINGS, SHOOTING_STYLES
 * Used by: 11-studio-maps.js, sidepanel.js storymode visual selector
 */

// ══════════════════════════════════════════════════════════════
export const VISUAL_STYLES = [
  { id: 'none', name: 'โหมดเลือกอัตโนมัติ', icon: '⚪', desc: 'ให้ระบบเลือกสไตล์ภาพให้เหมาะกับโจทย์', category: 'None', prompt: 'No fixed visual style. Use a clean, coherent default visual style that matches the scene context.' },
  { id: 'real_cinematic', name: 'Movieframe Real', icon: '🎞️', desc: 'โทนภาพยนตร์คนจริง แสงเงาหรูแบบหนังใหญ่', category: 'Mainstream', prompt: 'photorealistic cinematic film still, Hollywood movie quality, dramatic lighting, lens flare, shallow depth of field, 35mm film grain' },
  { id: 'disney_pixar_3d', name: 'Cartoon Nova 3D', icon: '🏰', desc: 'การ์ตูน 3D น่ารัก ดวงตาเด่น ฟีลแฟมิลี่ฟิล์ม', category: 'Mainstream', prompt: '3D animated CGI feature film character, pixar animation style, expressive eyes, soft smooth skin texture, subsurface scattering, Unreal Engine 5 render' },
  { id: 'surreal_anthropomorphic_3d', name: 'Surreal Anthropomorphic 3D', icon: '🦊', desc: '3D เหนือจริงกึ่ง body-horror คาแรกเตอร์วัตถุแปลงเป็นสิ่งมีชีวิต', category: 'Mainstream', prompt: 'uncanny surreal anthropomorphic 3D, grotesque body-part character, realistic skin pores, eerie facial expression, cinematic horror lighting, unsettling organic texture' },
  { id: 'ghibli', name: 'Mosslight Anime', icon: '🌿', desc: 'อะนิเมะอบอุ่น ลายเส้นสีน้ำธรรมชาติละมุน', category: 'Mainstream', prompt: 'Studio Ghibli anime style, watercolor painting, soft pastel colors, hand-drawn animation, warm nostalgic atmosphere, lush nature details, Hayao Miyazaki inspired' },
  { id: 'claymation', name: 'Plasticine Motion', icon: '🖼️', desc: 'งานปั้นดินน้ำมันหยุดภาพ มีเทกซ์เจอร์จับต้องได้', category: 'Craft', prompt: 'claymation stop-motion style, clay sculpted characters, fingerprint textures on surface, plasticine material, warm studio lighting, Wallace and Gromit style' },
  { id: 'crochet', name: 'Threadloom Craft', icon: '🧶', desc: 'โลกงานถักไหมพรม ลายเส้นนุ่มและอบอุ่น', category: 'Craft', prompt: 'amigurumi crochet style, knitted yarn texture, soft wool material, handmade craft aesthetic, cozy warm colors, detailed stitch patterns visible' },
  { id: 'plushie', name: 'Fluffy Toyverse', icon: '🧸', desc: 'ฟีลตุ๊กตาขนฟู นุ่มฟู น่ารักทั้งเฟรม', category: 'Craft', prompt: 'plushie felt toy style, soft fluffy fur texture, stuffed animal aesthetic, button eyes, fabric stitching details, kawaii cute proportions' },
  { id: 'paper_cutout', name: 'Paperstage Layer', icon: '✂️', desc: 'งานกระดาษซ้อนชั้น สไตล์สต็อปโมชั่นมีมิติ', category: 'Craft', prompt: 'paper cutout stop motion style, layered paper craft, construction paper textures, visible paper edges and shadows, colorful collage aesthetic' },
  { id: 'dragonball', name: 'Shonen Burst Ink', icon: '🐉', desc: 'พลังอนิเมะแอ็กชัน เส้นคม ท่าทางดุดัน', category: 'Nostalgia', prompt: 'Dragon Ball anime style, Akira Toriyama art style, bold outlines, dynamic action pose, energy aura effects, muscular proportions, shonen manga aesthetic' },
  { id: '90s_anime', name: 'Retro Moonbeam Anime', icon: '🌌', desc: 'กลิ่นอายอนิเมะยุค 90 แสงนุ่มฝันหวาน', category: 'Nostalgia', prompt: '1990s Japanese anime style, Sailor Moon aesthetic, soft diffused lighting, sparkle effects, cel-shaded animation, pastel color palette, dreamy atmosphere' },
  { id: 'gta_style', name: 'Street Noir Illustration', icon: '🔫', desc: 'ภาพวาดเมืองดิบเข้ม โทนเกมอาชญากรรมคลาสสิก', category: 'Nostalgia', prompt: 'GTA game loading screen art style, semi-realistic illustration, bold black outlines, high contrast, urban gritty aesthetic, satirical portrait style' },
  { id: 'watercolor', name: 'Mistwash Water Art', icon: '🖼️', desc: 'สีน้ำละลายละมุน โทนอาร์ตเล่าอารมณ์', category: 'Artistic', prompt: 'watercolor painting style, soft washes of color, visible brush strokes, wet-on-wet technique, delicate translucent layers, artistic illustration' },
  { id: 'chalk_art', name: 'Cafe Chalk Scene', icon: '☕', desc: 'ภาพวาดชอล์กบนกระดาน ฟีลคาเฟ่กึ่งวินเทจ', category: 'Artistic', prompt: 'chalk art on blackboard style, white and colored chalk drawing, chalkboard texture background, hand-drawn sketch aesthetic, cafe menu board style' },
  { id: 'oil_painting', name: 'Masterstroke Oil', icon: '🖼️', desc: 'งานสีน้ำมันพู่กันชัด ลึก ขรึม มีพลัง', category: 'Artistic', prompt: 'classical oil painting style, visible impasto brush strokes, rich deep colors, dramatic chiaroscuro lighting, Renaissance master painting technique' },
  { id: 'pop_art', name: 'Punch Pop Comic', icon: '💥', desc: 'สีแรงสไตล์ป๊อปคอมิก เด่นสะดุดตา', category: 'Artistic', prompt: 'Pop Art style, Roy Lichtenstein inspired, Ben-Day dots, bold primary colors, comic book aesthetic, speech bubbles, halftone pattern, Andy Warhol influence' },
  { id: 'pixel_art', name: 'Retrobit Pixels', icon: '👾', desc: 'พิกเซลเกมยุคเก่า ฟีลเกมเมอร์คลาสสิก', category: 'Digital', prompt: 'pixel art 8-bit retro game style, low resolution aesthetic, visible square pixels, limited color palette, nostalgic video game graphics, NES/SNES era' },
  { id: 'cyberpunk_neon', name: 'Neongrid Future', icon: '🌃', desc: 'เมืองอนาคตนีออนจัด แสงฉ่ำโทนดิจิทัล', category: 'Digital', prompt: 'cyberpunk neon style, vibrant neon lights, dark futuristic cityscape, holographic effects, rain-slicked streets, blade runner aesthetic, purple and cyan glow' },
  { id: 'vector_flat', name: 'Cleanline Vector UI', icon: '📱', desc: 'กราฟิกเวกเตอร์สะอาด เนี้ยบแบบงานโปรดักต์', category: 'Digital', prompt: 'flat vector illustration style, clean geometric shapes, minimal shading, modern app UI aesthetic, solid colors, professional infographic style' },
  { id: 'lego_style', name: 'Brickbox Universe', icon: '🧱', desc: 'จักรวาลตัวต่อบล็อกทั้งฉาก สนุกและแปลกตา', category: 'Digital', prompt: 'Lego brick style, everything made of Lego blocks, plastic toy aesthetic, Lego minifigure characters, bright primary colors, toy photography style' },
  { id: 'vaporwave', name: 'Pastel Synthwave', icon: '🏛️', desc: 'นีออนพาสเทลชมพูม่วง กลิ่นอายเรโทรไซเบอร์', category: 'Unique', prompt: 'vaporwave aesthetic, pink and purple gradient, Greek marble statue, retro 80s computer graphics, glitch effects, palm trees, sunset grid, lo-fi dream' },
  { id: 'emoji_icon', name: 'Emoji Bubbletoon', icon: '😊', desc: 'โลกไอคอนกลมสดใส เรียบง่ายสบายตา', category: 'Unique', prompt: 'emoji icon style, round cute characters, simple flat design, bright cheerful colors, minimal details, emoticon aesthetic, app icon style' },
  { id: 'thai_temple_mural', name: 'Siam Mural Heritage', icon: '🛕', desc: 'ลายไทยประยุกต์ละเอียดอ่อน วิจิตรแบบจิตรกรรมผนัง', category: 'Thai & Asian', prompt: 'Thai temple mural painting style, traditional Thai art, intricate gold leaf details, Buddhist iconography, elegant flowing lines, royal Thai aesthetic' },
  { id: 'thai_retro_poster', name: 'Thai Cinema Vintage', icon: '🎞️', desc: 'โปสเตอร์หนังไทยยุคเก่า สีแรง ฟอนต์วาดมือ', category: 'Thai & Asian', prompt: 'vintage Thai movie poster style, bold hand-painted typography, vibrant saturated colors, 1970s Thai cinema aesthetic, dramatic composition' },
  { id: 'webtoon_manhwa', name: 'K-Scroll Romance', icon: '📖', desc: 'เว็บตูนเกาหลีลื่นตา คาแรกเตอร์โดดเด่น', category: 'Thai & Asian', prompt: 'Korean webtoon manhwa style, beautiful character design, soft shading, romantic atmosphere, vertical scroll comic format, clean line art' },
  { id: 'thai_ghost_comic', name: 'Thai Pulp Horror', icon: '👻', desc: 'การ์ตูนผีไทยขาวดำดิบๆ สยองแบบคลาสสิก', category: 'Thai & Asian', prompt: 'Thai horror comic style, black and white ink drawing, creepy atmosphere, vintage Thai ghost story aesthetic, dramatic shadows, horror manga influence' },
  { id: 'thai_realistic_ghost', name: 'Siam Phantom Cine', icon: '🕯️', desc: 'ผีไทยสมจริง โทนหนังหลอนหนักบรรยากาศ', category: 'Thai & Asian', prompt: 'photorealistic Thai ghost cinematic style, eerie abandoned Thai house setting, low-key moonlight and candlelight, subtle fog, realistic skin texture, suspenseful horror atmosphere, handheld thriller framing' },
  { id: 'thai_ancient_ghost', name: 'Lantern Era Spirit', icon: '🏮', desc: 'ไทยโบราณเรือนไทยและแสงตะเกียง ลึกลับขลัง', category: 'Thai & Asian', prompt: 'photorealistic ancient Thai ghost style, traditional Thai costume, old Thai wooden house, oil lamp and candle lighting, antique atmosphere, soft drifting fog, cinematic period horror framing' },
  { id: 'hospital_ghost_realism', name: 'Silent Ward Apparition', icon: '🏥', desc: 'โรงพยาบาลเงียบวังเวง โทนซีดหลอนสมจริง', category: 'Thai & Asian', prompt: 'photorealistic hospital ghost style, empty hospital corridor at night, cold fluorescent lighting, sterile white-green palette, subtle haze, suspenseful cinematic composition, realistic horror tension' },
  { id: 'forest_ghost_realism', name: 'Moonfog Forest Haunt', icon: '🌲', desc: 'ป่าหมอกจันทร์หนาว สยองแบบธรรมชาติจริง', category: 'Thai & Asian', prompt: 'photorealistic forest ghost style, dense Thai jungle at night, moonlight through trees, ground mist and drifting fog, natural eerie atmosphere, cinematic thriller framing, realistic textures' },
  { id: 'y2k_purikura', name: 'Purikura Popflash', icon: '📸', desc: 'ฟีลตู้สติ๊กเกอร์ญี่ปุ่นพาสเทล วิ้งวับน่ารัก', category: 'Thai & Asian', prompt: 'Japanese purikura photo booth style, big sparkling eyes, pastel colors, cute decorative frames, glitter effects, Y2K kawaii aesthetic' },
  { id: 'ukiyo_e', name: 'Edo Woodwave Print', icon: '🌊', desc: 'ภาพพิมพ์ไม้ญี่ปุ่นโบราณ เส้นคลื่นคมชัด', category: 'Thai & Asian', prompt: 'Japanese ukiyo-e woodblock print style, traditional wave patterns, bold outlines, flat color areas, Hokusai inspired, Edo period aesthetic' },
  { id: 'doodle_art', name: 'Chaos Doodle Frame', icon: '✏️', desc: 'ลายเส้นขยุกขยิกเต็มเฟรม สนุก กวน และไวรัล', category: 'Trendy', prompt: 'doodle art style, hand-drawn sketchy lines, playful illustrations, filled frame composition, black ink on white, casual fun aesthetic' },
  { id: 'double_exposure', name: 'Echo Overlay Portrait', icon: '🌲', desc: 'ภาพซ้อนคนกับฉากธรรมชาติ อาร์ตลึกมีชั้นเชิง', category: 'Trendy', prompt: 'double exposure photography style, portrait merged with nature landscape, silhouette blending, artistic overlay, dreamy atmospheric effect' },
  { id: 'risograph', name: 'Indie Riso Print', icon: '🖨️', desc: 'งานพิมพ์ริโซ่จุดสกรีน ฟีลแมกกาซีนอินดี้', category: 'Trendy', prompt: 'risograph print style, halftone dot pattern, limited color palette, slight misregistration, indie zine aesthetic, textured paper look' },
  { id: 'origami', name: 'Foldcraft Dimension', icon: '🦢', desc: 'ทุกอย่างพับกระดาษมีมิติ แสงเงาคมชัด', category: 'Trendy', prompt: 'origami paper folding style, geometric paper sculptures, crisp folds and creases, soft shadows, minimalist Japanese aesthetic' },
  { id: 'surrealism', name: 'Dreambend Surreal', icon: '🃏', desc: 'โลกเหนือจริงบิดความฝัน ภาพแปลกตาน่าจำ', category: 'Trendy', prompt: 'surrealist art style, Salvador Dali inspired, dreamlike impossible scenes, melting objects, bizarre juxtapositions, subconscious imagery' },
  { id: 'gothic_dark_fantasy', name: 'Obsidian Gothic Tale', icon: '🏰', desc: 'ดาร์กแฟนตาซีหม่นลึก ปราสาทลึกลับอลังการ', category: 'Trendy', prompt: 'gothic dark fantasy style, medieval castle, dramatic dark atmosphere, mysterious fog, ornate architecture, dark romantic aesthetic' },
  { id: 'cctv_analog_horror', name: 'Analog CCTV Dread', icon: '📹', desc: 'ฟุตเทจกล้องวงจรปิดหลอน ขาวดำมีเวลาแสดง', category: 'Trendy', prompt: 'CCTV analog horror surveillance footage style, infrared night-vision monochrome, fixed wide-angle security camera framing, visible timestamp overlay, low-light noise, scan lines, compression artifacts, eerie empty space, unsettling liminal atmosphere' },
  { id: 'isometric_3d', name: 'Isovista Mini City', icon: '🏗️', desc: 'มุมเฉียงไอโซเมตริก เห็นฉากเหมือนไดโอรามา', category: 'Advanced 3D', prompt: 'isometric 3D illustration style, 30-degree angle view, miniature diorama aesthetic, clean geometric shapes, soft shadows, architectural visualization' },
  { id: 'low_poly_3d', name: 'Poly Retro Forge', icon: '🧿', desc: '3D เหลี่ยมก้อนสไตล์เกมยุคคลาสสิก', category: 'Advanced 3D', prompt: 'low-poly 3D style, geometric faceted surfaces, PS1 era video game aesthetic, limited polygon count, nostalgic retro 3D graphics' },
  { id: 'glitch_art', name: 'Signalbreak Glitch', icon: '📺', desc: 'ศิลป์ภาพแตกสัญญาณรบกวน โทนดิจิทัลพังเท่ๆ', category: 'Advanced 3D', prompt: 'glitch art style, digital corruption effects, RGB color splitting, scan lines, data moshing, broken signal aesthetic, cyberpunk error' },
  { id: 'neon_line_art', name: 'Neonwire Outline', icon: '💡', desc: 'เส้นเรืองแสงนีออนบนพื้นมืด ล้ำทันสมัย', category: 'Advanced 3D', prompt: 'neon line art style, glowing light trails on dark background, luminous outlines, electric blue and pink, futuristic minimalist' },
  { id: 'cyber_sigilism', name: 'Sigilpunk Edge', icon: '🗡️', desc: 'ลายคมดาร์ก Y2K โทนไซเบอร์กบฏ', category: 'Advanced 3D', prompt: 'cyber sigilism style, sharp angular tribal tattoo designs, dark Y2K aesthetic, symmetrical patterns, black ink on skin, edgy street fashion' },
  { id: 'hyper_realistic', name: 'Hyperdetail Human', icon: '🧑', desc: 'ภาพบุคคลสมจริงมาก รายละเอียดผิวครบ', category: 'Advanced 3D', prompt: 'hyper-realistic portrait photography, extreme detail, visible skin pores, professional studio lighting, 8K resolution, photorealistic rendering' },
  { id: 'steampunk', name: 'Steamgear Chronicle', icon: '🛠️', desc: 'เครื่องกลไอน้ำทองเหลือง ฟีลวิกตอเรียย้อนยุค', category: 'Advanced 3D', prompt: 'steampunk style, Victorian era machinery, brass gears and cogs, steam-powered technology, industrial revolution aesthetic, retro-futuristic' },
  { id: 'polaroid_snapshot', name: 'Flashfade Polaroid', icon: '🖼️', desc: 'ภาพโพลารอยด์วินเทจ ขอบขาวแฟลชซีดนิดๆ', category: 'Advanced 3D', prompt: 'polaroid instant photo style, white border frame, flash photography, slightly faded colors, nostalgic vintage memory aesthetic, casual snapshot' },
  { id: 'thai_commercial_tv', name: 'Thai TV Promo Plus', icon: '📺', desc: 'งานพรีเซนต์สไตล์โฆษณาทีวีไทย ชัดและเข้าถึงง่าย', category: 'Thai & Asian', prompt: 'Thai TV commercial style, clean bright lighting, polished product presentation, energetic presenter framing, high clarity broadcast aesthetic' },
  { id: 'cinematic_food_closeup', name: 'Gourmet Macro Cinema', icon: '🍜', desc: 'โคลสอัปอาหารแบบหนัง เน้นเทกซ์เจอร์ชวนหิว', category: 'Trendy', prompt: 'cinematic food close-up style, macro texture detail, steam and gloss highlights, appetizing warm tones, shallow depth of field, high-end food commercial look' },
  { id: 'minimal_product_studio', name: 'Pure Studio Product', icon: '🧴', desc: 'ภาพสินค้าเรียบหรูมินิมอล โทนพรีเมียมสะอาด', category: 'Digital', prompt: 'minimal product studio style, clean gradient backdrop, soft box lighting, premium catalog composition, subtle reflections, modern luxury branding aesthetic' }
];

// ══════════════════════════════════════════════════════════════
// 🎬 SCENE TEMPLATES — เทมเพลตท่าทาง/แอคชัน/กล้องตามซีน 1-8
// ══════════════════════════════════════════════════════════════
export const SCENE_TEMPLATES = {
  1: { name: 'Hook - Pattern Interrupt', tag: 'HOOK', expression: 'shocked, wide eyes, mouth open in disbelief', action: 'dramatic reaction pose, pointing at something unexpected', extra_img: 'visual curiosity, odd element, high contrast', extra_vid: 'Sudden dramatic entrance, breaking the fourth wall', camera: 'Quick zoom-in to face, dutch angle' },
  2: { name: 'ปัญหา / ความขัดแย้ง', tag: '', expression: 'frustrated, annoyed, confused', action: 'arms crossed, shaking head, looking at the problem', extra_img: '', extra_vid: 'Expressing frustration with exaggerated body language', camera: 'Medium shot, slight pan left' },
  3: { name: 'สาธิต / พิสูจน์', tag: '', expression: 'confident, smiling, demonstrating', action: 'showing the product in action, demonstrating features', extra_img: '', extra_vid: 'Confidently showing product features with hand gestures', camera: 'Close-up on product in hand, then face' },
  4: { name: 'Social Proof / ยืนยัน', tag: '', expression: 'amazed, impressed, nodding with approval', action: 'giving thumbs up, showing testimonials', extra_img: '', extra_vid: 'Dramatic comparison moment, jaw drop reaction', camera: 'Over-the-shoulder angle, dynamic side angle' },
  5: { name: 'ผลลัพธ์ / เปรียบเทียบ', tag: '', expression: 'surprised, excited, eyes sparkling', action: 'showing improved results, revealing transformation', extra_img: '', extra_vid: 'Eyes light up, dramatic reveal moment', camera: 'Dolly zoom, dramatic reveal angle' },
  6: { name: 'เปิดตัว / ค้นพบ', tag: '', expression: 'proud, reassuring, trustworthy smile', action: 'discovering something amazing, holding up the product', extra_img: '', extra_vid: 'Breaking into a confident dance or celebration', camera: 'Medium shot, eye-level, stable' },
  7: { name: 'Shoppertainment Tie-in', tag: 'SELL', expression: 'excited, persuasive, friendly wink', action: 'holding the product packaging, pointing at camera', extra_img: 'holding the product packaging, pointing at camera, authentic look', extra_vid: 'Showing product to camera, pointing at link', camera: 'Pull back to full body, then quick zoom to product' },
  8: { name: 'Closing - Emotional ROI', tag: 'CLOSE', expression: 'warm smile, waving, urgent but friendly', action: 'holding the product packaging, pointing at camera, showing price/promo', extra_img: 'holding the product packaging, pointing at camera, authentic look', extra_vid: 'Showing product to camera, pointing at link, waving goodbye', camera: 'Close-up on product, then pull back to character' }
};

// ══════════════════════════════════════════════════════════════
// 🗣️ DIALECTS — ภาษาถิ่นสำหรับบทพูด
// ══════════════════════════════════════════════════════════════
export const DIALECTS = [
  { id: 'none', name: 'ไม่เลือก', icon: '⚪', desc: 'ไม่ระบุภาษาถิ่น', prompt: '' },
  { id: 'central', name: 'ภาคกลาง (มาตรฐาน)', icon: '🗣️', desc: 'ภาษาไทยมาตรฐาน ไม่มีถิ่น', prompt: 'Use standard Thai language, clear pronunciation, no regional accent or dialect markers' },
  { id: 'isan', name: 'อีสาน', icon: '🇱🇦', desc: "ภาษาอีสาน 'เด้อ คักๆ เจ้าเว้าหยัง'", prompt: 'Use Isan dialect with characteristic tone markers: เด้อ, คักๆ, เจ้าเว้า, phrases should sound like northeastern Thai speakers' },
  { id: 'northern', name: 'เหนือ', icon: '🏔️', desc: "ภาษาเหนือ 'อู้อะหยัง เน้อ'", prompt: 'Use Northern Thai dialect: อู้, เน้อ, หล่าว, เหลิง including northern speech patterns and soft pronunciation' },
  { id: 'southern', name: 'ใต้', icon: '🌴', desc: "ภาษาใต้ 'หมายเว้ย แหลงอะไร'", prompt: 'Use Southern Thai dialect: หมายเว้ย, เหลง, แหลง, ฟัด, fast-paced delivery characteristic of southern speakers' },
  { id: 'bangkok_urban', name: 'กรุงเทพวัยรุ่น', icon: '🏙️', desc: 'ภาษากลางร่วมสมัย ติดศัพท์โซเชียลพอดี', prompt: 'Use modern Bangkok urban Thai with natural social-media phrasing, trendy but still understandable to a broad audience' },
  { id: 'formal_thai', name: 'ทางการสุภาพ', icon: '🎙️', desc: 'สุภาพชัดเจน เหมาะงานพรีเซนต์/องค์กร', prompt: 'Use formal polite Thai with clear sentence structure and professional wording suitable for brand communication' },
  { id: 'thai_english_mix', name: 'ไทยผสมอังกฤษ', icon: '🌐', desc: 'ไทยหลักสลับคีย์เวิร์ดอังกฤษแบบธรรมชาติ', prompt: 'Use Thai as the main language with natural light English code-switching for key terms and modern marketing style' }
];

// ══════════════════════════════════════════════════════════════
// 🎭 TONES — โทนบุคลิกสำหรับงาน
// ══════════════════════════════════════════════════════════════
export const TONES = [
  { id: 'none', name: 'ไม่เลือก', icon: '⚪', desc: 'ไม่ระบุโทนบุคลิก', prompt: '' },
  { id: 'funny', name: 'ตลก 😂', icon: '😂', desc: 'ตลกขำ สดใสร่าเริง', prompt: 'Make it funny, lighthearted, comedic with jokes and witty remarks, use humor to engage viewers' },
  { id: 'dramatic', name: 'ลึกซึ้ง 🎭', icon: '🎭', desc: 'ลึกซึ้ง จริงใจ สั่นใจ', prompt: 'Make it dramatic, emotionally touching, heartfelt with meaningful depth that resonates with viewers' },
  { id: 'haunted', name: 'หลอนเหมือนผี 👻', icon: '👻', desc: 'ลึกลับ วังเวง กดดันเบาๆ', prompt: 'Make it eerie and haunted with unsettling suspense, ghostlike tension, and mysterious chilling atmosphere' },
  { id: 'romantic', name: 'โรแมนติก 💕', icon: '💕', desc: 'อบอุ่น ความรักความหมาย', prompt: 'Make it romantic, warm, tender with elements of love, affection and emotional connection' },
  { id: 'thrilling', name: 'ระทึก 😱', icon: '😱', desc: 'สั่นขวัญ ตื่นตะลึง ต้องรู้เดี๋ยวนี้', prompt: 'Make it thrilling, suspenseful, keep viewers on the edge of their seat with dramatic tension' },
  { id: 'chill', name: 'ชิลล์ 😎', icon: '😎', desc: 'สบายๆ ไม่เร่งรัด relax', prompt: 'Make it chill, relaxed, laid-back with a casual and easygoing vibe that feels effortless' },
  { id: 'professional', name: 'มืออาชีพ 💼', icon: '💼', desc: 'น่าเชื่อถือ ชัดเจน สื่อสารตรงประเด็น', prompt: 'Make it professional, credible, and concise with confident brand-safe language and clear value communication' },
  { id: 'inspirational', name: 'สร้างแรงบันดาลใจ ✨', icon: '✨', desc: 'ฮึกเหิม เชิงบวก ชวนลงมือทำ', prompt: 'Make it inspirational and uplifting, motivating viewers with positive momentum and practical encouragement' },
  { id: 'urgent', name: 'เร่งด่วน ⏰', icon: '⏰', desc: 'กระชับ เร็ว มี sense of urgency', prompt: 'Make it urgent and action-oriented with concise high-impact wording that encourages immediate response' }
];

// ══════════════════════════════════════════════════════════════
// 📍 SCENE LOCATIONS — โลเคชันฉากพร้อม prompt
// ══════════════════════════════════════════════════════════════
export const SCENE_LOCATIONS = [
  { id: 'none', name: 'ไม่เลือก', icon: '⚪', desc: 'ไม่ระบุสถานที่', prompt: '' },
  { id: 'inside_human_body', name: 'ภายในร่างกายมนุษย์', icon: '🫀', desc: 'โฟกัสตำแหน่งในร่างกาย เช่น ผิว ข้อต่อ ระบบย่อยอาหาร', prompt: 'Set scenes inside the human body and choose anatomically relevant zones that match the product context, such as skin layers, oral cavity, throat, stomach, intestines, liver, blood vessels, muscles, joints, or respiratory pathways.' },
  { id: 'indoor_home', name: 'ภายในบ้าน', icon: '🏠', desc: 'ห้องนั่งเล่น ห้องนอน ห้องเก็บของ', prompt: 'Scene inside a home environment: living room, bedroom, kitchen, creates intimate and personal atmosphere' },
  { id: 'indoor_cafe', name: 'สถานที่สาธารณะ', icon: '☕', desc: 'ร้านกาแฟ ห้างสรรพสินค้า ออฟฟิศ', prompt: 'Scene in public indoor spaces: cafe, shopping mall, office, busy atmosphere with people around' },
  { id: 'outdoor_nature', name: 'กลางแจ้ง (ธรรมชาติ)', icon: '🌲', desc: 'สวน ไร่ ธรรมชาติ', prompt: 'Scene in nature outdoors: garden, farm, waterfall, forest, natural and serene environment' },
  { id: 'outdoor_city', name: 'กลางแจ้ง (เมือง)', icon: '🌆', desc: 'ถนน สวนสาธารณะ ตลาด', prompt: 'Scene in urban outdoor setting: street, public park, market, downtown area with city elements' },
  { id: 'mixed', name: 'พิกพิก (ทั้งใน-นอก)', icon: '🔄', desc: 'ผสมผสานทั้งพื้นที่', prompt: 'Mix scenes between indoor and outdoor locations for variety and dynamic visual storytelling' },
  { id: 'studio_set', name: 'สตูดิโอเซ็ต', icon: '🎞️', desc: 'ฉากควบคุมแสง พื้นหลังจัดวางชัด', prompt: 'Use a controlled studio set environment with clean backdrop, deliberate set dressing, and consistent lighting for product clarity' },
  { id: 'warehouse_industrial', name: 'โกดัง/อินดัสเทรียล', icon: '🏭', desc: 'โครงสร้างดิบ เท่ แข็งแรง', prompt: 'Set scenes in an industrial warehouse environment with raw textures, metallic elements, and spacious depth' },
  { id: 'beach_tropical', name: 'ชายหาดทรอปิคอล', icon: '🏖️', desc: 'ทะเล แสงแดด ลมพริ้ว สดชื่น', prompt: 'Set scenes on a tropical beach with sunlight, breeze, and vibrant natural coastal atmosphere' },
  { id: 'market_local', name: 'ตลาด/ตลาดสด', icon: '🛒', desc: 'แผงขายของ ทางเดินตลาด คนคึกคัก', prompt: 'Set scenes in a lively local market with colorful stalls, organic crowd movement, street commerce details, and energetic community atmosphere' },
  { id: 'haunted_school', name: 'โรงเรียนหลอน', icon: '🏫', desc: 'โถงเรียนเก่า ไฟกะพริบ บรรยากาศวังเวง', prompt: 'Set scenes in a haunted abandoned school with flickering lights, dusty hallways, old classrooms, eerie silence, and unsettling atmosphere' },
  { id: 'haunted_mansion', name: 'คฤหาสน์ร้างหลอน', icon: '🏚️', desc: 'บ้านเก่าหลังใหญ่ เฟอร์นิเจอร์คลุมผ้า เสียงลม', prompt: 'Set scenes in a haunted abandoned mansion with dusty vintage furniture, torn curtains, creaking wooden floors, moonlight beams, and oppressive supernatural tension' },
  { id: 'cemetery_night', name: 'สุสานกลางคืน', icon: '🪦', desc: 'หลุมศพเก่า หมอกต่ำ แสงจันทร์ซีด', prompt: 'Set scenes in a night cemetery with aged tombstones, drifting ground fog, pale moonlight, dead trees, and eerie silence that suggests unseen presence' },
  { id: 'abandoned_temple', name: 'วัดร้างยามค่ำ', icon: '🛕', desc: 'ศาลาวัดเก่า ระฆังเงียบ ธูปจางๆ', prompt: 'Set scenes in an abandoned temple at night with dark pavilion corridors, old altar details, faint incense smoke, distant bell ambience, and Thai spiritual horror mood' }
];

// ══════════════════════════════════════════════════════════════
// ⏱️ PACINGS — ความเร็วจังหวะวิดีโอ
// ══════════════════════════════════════════════════════════════
export const PACINGS = [
  { id: 'none', name: 'ไม่เลือก', icon: '⚪', desc: 'ไม่ระบุความเร็ว', prompt: '' },
  { id: 'fast', name: 'เร็ว ⚡', icon: '⚡', desc: 'ตัดต่อเร็ว จังหวะแน่น ไม่นิ่ง', prompt: 'Fast paced editing with quick cuts, tight rhythm, energetic music, keeps viewers engaged without pausing' },
  { id: 'normal', name: 'ปกติ ▶️', icon: '▶️', desc: 'จังหวะปกติ ชัด เข้าใจง่าย', prompt: 'Normal pacing with balanced editing, clear story progression, easy to follow and understand' },
  { id: 'slow', name: 'ช้า 🐢', icon: '🐢', desc: 'ช้าๆ ใจเย็น showcase detail', prompt: 'Slow pacing with detailed shots, allows time to appreciate details and textures, showcase product features' },
  { id: 'dynamic_mix', name: 'ผสมเร็ว-ช้า 🎚️', icon: '🎚️', desc: 'เปิดเร็ว กลางช้า ปิดพีค', prompt: 'Use dynamic pacing with intentional tempo shifts: fast hook, clearer mid explanation, and high-impact ending' }
];

// ══════════════════════════════════════════════════════════════
// 📷 SHOOTING STYLES — สไตล์การถ่ายภาพ/วิดีโอ
// ══════════════════════════════════════════════════════════════
export const SHOOTING_STYLES = [
  { id: 'none', name: 'ไม่เลือก', icon: '⚪', desc: 'ไม่ระบุสไตล์การถ่าย', prompt: '' },
  { id: 'cinematic', name: 'ภาพยนตร์ 🎬', icon: '🎬', desc: 'Wide shot ลึกมิติ ทัศนศิลป์', prompt: 'Cinematic shooting style with wide shots, depth, professional lighting, lens flares, shallow depth of field like film production' },
  { id: 'casual', name: 'สบายๆ 📱', icon: '📱', desc: 'UGC style ถ่ายแบบคนทั่วไป', prompt: 'Casual UGC style shot on mobile phone, natural lighting, close-ups, authentic and relatable like real people' },
  { id: 'documentary', name: 'สารคดี 📹', icon: '📹', desc: 'ตัวจริง ยาม ไม่คิด', prompt: 'Documentary style shooting with real situations, unscripted feel, candid moments, authentic documentary storytelling' },
  { id: 'vlog', name: 'วล็อก 🎥', icon: '🎥', desc: 'มือถือจัดเฟรมเอง เป็นกันเอง', prompt: 'Vlog self-recorded style with handheld camera, selfie angle, personal intimate framing, relatable creator vibe' },
  { id: 'asmr', name: 'ASMR 🎧', icon: '🎧', desc: 'เบาๆ เน้นเสียงเทกซ์เจอร์', prompt: 'ASMR style with extreme close-ups, textural focus, soft whisper tones, satisfying sound design, intimate sensory experience' },
  { id: 'macro', name: 'มาโคร 🔍', icon: '🔍', desc: 'ซูมเข้าใกล้สุด เห็นรายละเอียดจริง', prompt: 'Extreme macro close-up style with microscopic detail, shallow depth of field, product texture emphasis, professional product photography' }
];
