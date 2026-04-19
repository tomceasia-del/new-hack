# Knowledge: Creative Options — สไตล์การเล่าเรื่อง / อารมณ์ / ภาพ / กล้อง / ภาษา
> ดึงจาก CONTENT_CORE/02-master-prompt-template.js
> ใช้เป็น Knowledge ใน Gem — ให้ผู้ใช้เลือกก่อนสร้าง Storyboard หรือ Video Prompt

---

## 1. สไตล์การเล่าเรื่อง / บุคลิกตัวละคร (STYLE_OPTIONS)

เลือก 1 รหัสแล้วระบุในข้อมูลสินค้า Gem จะปรับบทพูด น้ำเสียง และมุมกล้องให้ตรงสไตล์

### หมวดขายของ
| ID | ชื่อ | คำอธิบาย |
|----|------|----------|
| 1 | Hard Sell | ขายตรงๆ จัดหนัก |
| 2 | Soft Sell | ขายแบบนุ่มนวล |
| 3 | Unboxer | แกะกล่องรีวิว |
| 4 | Skeptic | สงสัย ไม่เชื่อง่าย |
| 5 | FOMO | กลัวพลาด รีบซื้อ |
| 6 | Villain vs Hero | ตัวร้าย vs ฮีโร่ |
| 7 | Tough Love | รักแบบแข็งกร้าว |
| 8 | Tsundere | ปากแข็ง ใจอ่อน |
| 9 | The Nag | จู้จี้ บ่นไม่หยุด |
| 10 | Drama Queen | ดราม่าสุดๆ |
| 11 | Talking Object | สิ่งของพูดได้ |
| 12 | Organ War | อวัยวะทะเลาะกัน |
| 13 | Pet Translator | แปลภาษาสัตว์ |
| 14 | Time Traveler | นักเดินทางข้ามเวลา |
| 15 | God vs Devil | เทพ vs ปีศาจ |
| 16 | Geek | สายเนิร์ด ความรู้จัด |
| 17 | Myth Buster | ทำลายความเชื่อผิดๆ |
| 18 | Q&A | ถาม-ตอบ |
| 19 | Anchor | พิธีกรข่าว |
| 20 | Trends Hunter | ตามล่าเทรนด์ |
| 21 | ASMR Seller | สายเสพเสียง ฮีลใจ กระซิบขาย |

### หมวด Viral Personas
| ID | ชื่อ | คำอธิบาย |
|----|------|----------|
| 22 | De-influencer | สายช็อตฟีล นักดับฝัน ห้ามซื้อ! |
| 23 | Fortune Teller | สายมูเตลู ทักจิตวิทยา |
| 24 | Over-Sharer | เล่าหมดเปลือก ดราม่าชีวิต |
| 25 | Main Character | ตัวมัม ศูนย์กลางจักรวาล POV |
| 26 | Investigator | สายสืบ ขุดคุ้ยหลังบ้าน |
| 27 | Isan Joy | ไทบ้านม่วนซื่น จ้วดจ้าด |
| 28 | Southern Direct | คนใต้ใจเต็ม หรอยแรง |
| 29 | Northern Chill | สาวเจียงใหม่ละมุน อู้กำเมือง |
| 30 | Sassy Queen | ตัวมารดาโฮ่งๆ จริตตัวแม่ |
| 31 | Gossiper | สายเผือก ป้าข้างบ้าน ซุบซิบ |
| 32 | Self-Made | วัยรุ่นสร้างตัว ทรงซ้อ |
| 33 | Prankster Couple | คู่รักหยุมหัว แกล้งแฟน |
| 34 | Underdog | สู้ชีวิตแต่ชีวิตสู้กลับ |
| 35 | Voiceover Troll | นักพากย์นรก พากย์กวนๆ |
| 36 | Fangirl/Fanboy | ติ่งอวยยศ รีวิวเหมือนโดนเมนตก |
| 37 | Local Guru | สูตรผีบอก ภูมิปัญญาชาวบ้าน |
| 38 | Mindset Coach | ไลฟ์โค้ชกระชากสติ คำคมกระแทกใจ |
| 39 | Satirist | สายแซะสังคม เสียดสีกระแส |
| 40 | Glutton | สายสวบดุดัน อร่อยแสงออกปาก |

### หมวดสิ่งของพูดได้
| ID | ชื่อ | คำอธิบาย |
|----|------|----------|
| 41 | ผักนักเลง | ผักด่าคนไม่กิน อาหารยั่วคนลดน้ำหนัก |
| 42 | อวัยวะ Tough Love | ตับ ไต ไส้ พุง มาเทศน์เรื่องสุขภาพ |
| 43 | เครื่องใช้ไฟฟ้าสู้ชีวิต | แอร์/พัดลม/ตู้เย็น บ่นเรื่องการใช้งาน |
| 44 | เงินในบัญชี | บ่นเรื่องความถังแตก โดนโอนออก |
| 45 | ผีเจ้าที่ | สายมูเมาท์เรื่องของแก้บนและคนในบ้าน |
| 46 | โฉนดที่ดิน | สายอสังหาฯ ที่ดินอยากขายตัวเอง |
| 47 | พัสดุขี้น้อยใจ | กล่องพัสดุที่โดนดองหน้าบ้าน |
| 48 | ไอเทมสายมู | หินมงคล/พระเครื่อง คุยเรื่องดวงเจ้าของ |
| 49 | สกินแคร์ทวงความยุติธรรม | ครีมเถียงกับสิว หน้าสดมาทวง |
| 50 | เสียงในหัว | ตัวขี้เกียจ VS ตัวขยัน เถียงกันในใจ |
| 51 | นาฬิกาปลุกจอมด่า | ปลุกแบบด่าให้ตื่นไปทำตามเป้าหมาย |
| 52 | คอมพิวเตอร์ออฟฟิศ | บ่นเรื่องไฟล์หนัก เจ้านายสั่งแก้ |
| 53 | กาแฟเพื่อนรัก | ทวงบุญคุณว่าเป็นคนทำให้เจ้าของตื่น |
| 54 | พลังงาน Energy Bar | แสดงค่าพลังชีวิต Burnout สไตล์เกม |
| 55 | สัตว์เลี้ยงนินทา | หมาแมวใช้ Animation ปากพูดวิจารณ์เรา |
| 56 | ต้นไม้พูดได้ | บ่นเรื่องแดด น้ำ คนเดินผ่านแบบกวนๆ |
| 57 | รองเท้า/พาสปอร์ต | สายเที่ยวที่บ่นว่าอยากออกไปข้างนอก |
| 58 | แอปนัดเดท | มาแฉเรื่องแชทและความลับความรัก |
| 59 | เสื้อผ้าในตู้ | ประท้วงที่โดนเก็บจนฝุ่นจับ บ่นเจ้าของอ้วน |

### หมวดการเมือง/เสียดสี
| ID | ชื่อ | คำอธิบาย |
|----|------|----------|
| 60 | เก้าอี้รัฐมนตรี | บ่นว่าใครๆ ก็อยากมานั่ง แต่พอนั่งแล้วลุกยากจัง |
| 61 | งบประมาณพูดได้ | เงินงบมาเล่าว่าควรไปที่ไหน แต่ดันไปโผล่ที่ไหน |
| 62 | นโยบายขายฝัน | ตัวละครนโยบายแก้ตัวว่าทำไมยังทำไม่ได้ |
| 63 | ไมโครโฟนสภา | ไมค์มาแฉว่าวันนี้ได้ยินสมาชิกนินทาอะไรบ้าง |

---

## 2. โหมดโครงสร้างเรื่อง (PROMPT_MODES)

| ID | ชื่อ | เหมาะกับ |
|----|------|----------|
| default | Default (Pixar 3D) | ขายของทั่วไป คลิปสั้น 6–8 ซีน |
| step_story | Step Story | ทำอาหาร ประกอบของ วิธีใช้ทีละขั้น |
| dance | Dance Performance | เต้น/แสดง choreography ไวรัล |
| review | Product Review | รีวิวสินค้าหน้ากล้อง หลายมุม |
| benefit_story | Benefit Product Story | Pain → Solution → Benefits → CTA |
| ab_test | A/B Test | สร้าง 2 เวอร์ชันเปรียบเทียบ hook/tone |
| compliance | Compliance Mode | ปลอดภัยสุด ผ่าน policy ทุกแพลตฟอร์ม |

---

## 3. อารมณ์ / บรรยากาศ (TONES)

ใส่ใน Dialogue + Video Prompt เพื่อกำหนดน้ำเสียงตลอดคลิป

| ID | ชื่อ | prompt string |
|----|------|--------------|
| funny | ตลก 😂 | Make it funny, lighthearted, comedic with jokes and witty remarks, use humor to engage viewers |
| dramatic | ลึกซึ้ง 🎭 | Make it dramatic, emotionally touching, heartfelt with meaningful depth that resonates with viewers |
| haunted | หลอนเหมือนผี 👻 | Make it eerie and haunted with unsettling suspense, ghostlike tension, and mysterious chilling atmosphere |
| romantic | โรแมนติก 💕 | Make it romantic, warm, tender with elements of love, affection and emotional connection |
| thrilling | ระทึก 😱 | Make it thrilling, suspenseful, keep viewers on the edge of their seat with dramatic tension |
| chill | ชิลล์ 😎 | Make it chill, relaxed, laid-back with a casual and easygoing vibe that feels effortless |
| professional | มืออาชีพ 💼 | Make it professional, credible, and concise with confident brand-safe language and clear value communication |
| inspirational | สร้างแรงบันดาลใจ ✨ | Make it inspirational and uplifting, motivating viewers with positive momentum and practical encouragement |
| urgent | เร่งด่วน ⏰ | Make it urgent and action-oriented with concise high-impact wording that encourages immediate response |

---

## 4. Mood / บรรยากาศภาพ (MOOD_KEYWORDS)

เพิ่มใน Image Prompt เพื่อล็อกโทนสีและบรรยากาศ

### Mood ทั่วไป (20 แบบ)
Cinematic Standard, Bright & Airy, Warm & Cozy, Minimalist Clean, Luxury Gold, Dark & Gritty, Red Alert, Horror/Thriller, Action Explosive, Grunge/Dirty, Cyberpunk Neon, Pastel Dreamy, Futuristic Sci-Fi, Magical Fantasy, Wes Anderson, Retro 90s, Fresh & Cool, Romantic Rose, Nature Organic, Mystery Noir

### Mood สายฮิตไทย (10 แบบ)
Mute & Earth Tone, Mutelu Mystical, Thai Street Night, Rainy & Lonely, Thai Vintage Town, Y2K Thai Pop, Vivid Thai Summer, Rich & Flex, Local Homey, Surreal Comedy

### Mood Viral TikTok (10 แบบ)
UGC Raw / Unfiltered, Fisheye / Ultra Wide, Bodycam / POV Action, Hyper-Macro Satisfying, Glitch & Distorted, Old Money Aesthetic, Lo-Fi Chillhop, Liminal Space / Dreamcore, Cottagecore / Fairy Tale, Paparazzi Flash

---

## 5. สไตล์ภาพ / ศิลปะ (VISUAL_STYLES) — 50 แบบ

ใส่ prompt string ที่ระบุด้านล่างเป็น prefix ของทุก Image Prompt

### Mainstream
| ชื่อ | prompt string |
|------|--------------|
| Movieframe Real | photorealistic cinematic film still, Hollywood movie quality, dramatic lighting, lens flare, shallow depth of field, 35mm film grain |
| Cartoon Nova 3D | 3D animated CGI feature film character, pixar animation style, expressive eyes, soft smooth skin texture, subsurface scattering, Unreal Engine 5 render |
| Surreal Anthropomorphic 3D | uncanny surreal anthropomorphic 3D, grotesque body-part character, realistic skin pores, eerie facial expression, cinematic horror lighting, unsettling organic texture |
| Mosslight Anime | Studio Ghibli anime style, watercolor painting, soft pastel colors, hand-drawn animation, warm nostalgic atmosphere, lush nature details, Hayao Miyazaki inspired |

### Craft
| ชื่อ | prompt string |
|------|--------------|
| Plasticine Motion | claymation stop-motion style, clay sculpted characters, fingerprint textures on surface, plasticine material, warm studio lighting, Wallace and Gromit style |
| Threadloom Craft | amigurumi crochet style, knitted yarn texture, soft wool material, handmade craft aesthetic, cozy warm colors, detailed stitch patterns visible |
| Fluffy Toyverse | plushie felt toy style, soft fluffy fur texture, stuffed animal aesthetic, button eyes, fabric stitching details, kawaii cute proportions |
| Paperstage Layer | paper cutout stop motion style, layered paper craft, construction paper textures, visible paper edges and shadows, colorful collage aesthetic |

### Nostalgia
| ชื่อ | prompt string |
|------|--------------|
| Shonen Burst Ink | Dragon Ball anime style, Akira Toriyama art style, bold outlines, dynamic action pose, energy aura effects, muscular proportions, shonen manga aesthetic |
| Retro Moonbeam Anime | 1990s Japanese anime style, Sailor Moon aesthetic, soft diffused lighting, sparkle effects, cel-shaded animation, pastel color palette, dreamy atmosphere |
| Street Noir Illustration | GTA game loading screen art style, semi-realistic illustration, bold black outlines, high contrast, urban gritty aesthetic, satirical portrait style |

### Artistic
| ชื่อ | prompt string |
|------|--------------|
| Mistwash Water Art | watercolor painting style, soft washes of color, visible brush strokes, wet-on-wet technique, delicate translucent layers, artistic illustration |
| Cafe Chalk Scene | chalk art on blackboard style, white and colored chalk drawing, chalkboard texture background, hand-drawn sketch aesthetic, cafe menu board style |
| Masterstroke Oil | classical oil painting style, visible impasto brush strokes, rich deep colors, dramatic chiaroscuro lighting, Renaissance master painting technique |
| Punch Pop Comic | Pop Art style, Roy Lichtenstein inspired, Ben-Day dots, bold primary colors, comic book aesthetic, speech bubbles, halftone pattern, Andy Warhol influence |

### Digital
| ชื่อ | prompt string |
|------|--------------|
| Retrobit Pixels | pixel art 8-bit retro game style, low resolution aesthetic, visible square pixels, limited color palette, nostalgic video game graphics, NES/SNES era |
| Neongrid Future | cyberpunk neon style, vibrant neon lights, dark futuristic cityscape, holographic effects, rain-slicked streets, blade runner aesthetic, purple and cyan glow |
| Cleanline Vector UI | flat vector illustration style, clean geometric shapes, minimal shading, modern app UI aesthetic, solid colors, professional infographic style |
| Brickbox Universe | Lego brick style, everything made of Lego blocks, plastic toy aesthetic, Lego minifigure characters, bright primary colors, toy photography style |
| Pure Studio Product | minimal product studio style, clean gradient backdrop, soft box lighting, premium catalog composition, subtle reflections, modern luxury branding aesthetic |

### Thai & Asian
| ชื่อ | prompt string |
|------|--------------|
| Siam Mural Heritage | Thai temple mural painting style, traditional Thai art, intricate gold leaf details, Buddhist iconography, elegant flowing lines, royal Thai aesthetic |
| Thai Cinema Vintage | vintage Thai movie poster style, bold hand-painted typography, vibrant saturated colors, 1970s Thai cinema aesthetic, dramatic composition |
| K-Scroll Romance | Korean webtoon manhwa style, beautiful character design, soft shading, romantic atmosphere, vertical scroll comic format, clean line art |
| Thai Pulp Horror | Thai horror comic style, black and white ink drawing, creepy atmosphere, vintage Thai ghost story aesthetic, dramatic shadows, horror manga influence |
| Siam Phantom Cine | photorealistic Thai ghost cinematic style, eerie abandoned Thai house setting, low-key moonlight and candlelight, subtle fog, realistic skin texture, suspenseful horror atmosphere, handheld thriller framing |
| Lantern Era Spirit | photorealistic ancient Thai ghost style, traditional Thai costume, old Thai wooden house, oil lamp and candle lighting, antique atmosphere, soft drifting fog, cinematic period horror framing |
| Silent Ward Apparition | photorealistic hospital ghost style, empty hospital corridor at night, cold fluorescent lighting, sterile white-green palette, subtle haze, suspenseful cinematic composition, realistic horror tension |
| Moonfog Forest Haunt | photorealistic forest ghost style, dense Thai jungle at night, moonlight through trees, ground mist and drifting fog, natural eerie atmosphere, cinematic thriller framing, realistic textures |
| Purikura Popflash | Japanese purikura photo booth style, big sparkling eyes, pastel colors, cute decorative frames, glitter effects, Y2K kawaii aesthetic |
| Edo Woodwave Print | Japanese ukiyo-e woodblock print style, traditional wave patterns, bold outlines, flat color areas, Hokusai inspired, Edo period aesthetic |
| Thai TV Promo Plus | Thai TV commercial style, clean bright lighting, polished product presentation, energetic presenter framing, high clarity broadcast aesthetic |

### Trendy
| ชื่อ | prompt string |
|------|--------------|
| Chaos Doodle Frame | doodle art style, hand-drawn sketchy lines, playful illustrations, filled frame composition, black ink on white, casual fun aesthetic |
| Echo Overlay Portrait | double exposure photography style, portrait merged with nature landscape, silhouette blending, artistic overlay, dreamy atmospheric effect |
| Indie Riso Print | risograph print style, halftone dot pattern, limited color palette, slight misregistration, indie zine aesthetic, textured paper look |
| Foldcraft Dimension | origami paper folding style, geometric paper sculptures, crisp folds and creases, soft shadows, minimalist Japanese aesthetic |
| Dreambend Surreal | surrealist art style, Salvador Dali inspired, dreamlike impossible scenes, melting objects, bizarre juxtapositions, subconscious imagery |
| Obsidian Gothic Tale | gothic dark fantasy style, medieval castle, dramatic dark atmosphere, mysterious fog, ornate architecture, dark romantic aesthetic |
| Analog CCTV Dread | CCTV analog horror surveillance footage style, infrared night-vision monochrome, fixed wide-angle security camera framing, visible timestamp overlay, low-light noise, scan lines, compression artifacts, eerie empty space, unsettling liminal atmosphere |
| Pastel Synthwave | vaporwave aesthetic, pink and purple gradient, Greek marble statue, retro 80s computer graphics, glitch effects, palm trees, sunset grid, lo-fi dream |
| Emoji Bubbletoon | emoji icon style, round cute characters, simple flat design, bright cheerful colors, minimal details, emoticon aesthetic, app icon style |
| Gourmet Macro Cinema | cinematic food close-up style, macro texture detail, steam and gloss highlights, appetizing warm tones, shallow depth of field, high-end food commercial look |

### Advanced 3D
| ชื่อ | prompt string |
|------|--------------|
| Isovista Mini City | isometric 3D illustration style, 30-degree angle view, miniature diorama aesthetic, clean geometric shapes, soft shadows, architectural visualization |
| Poly Retro Forge | low-poly 3D style, geometric faceted surfaces, PS1 era video game aesthetic, limited polygon count, nostalgic retro 3D graphics |
| Signalbreak Glitch | glitch art style, digital corruption effects, RGB color splitting, scan lines, data moshing, broken signal aesthetic, cyberpunk error |
| Neonwire Outline | neon line art style, glowing light trails on dark background, luminous outlines, electric blue and pink, futuristic minimalist |
| Sigilpunk Edge | cyber sigilism style, sharp angular tribal tattoo designs, dark Y2K aesthetic, symmetrical patterns, black ink on skin, edgy street fashion |
| Hyperdetail Human | hyper-realistic portrait photography, extreme detail, visible skin pores, professional studio lighting, 8K resolution, photorealistic rendering |
| Steamgear Chronicle | steampunk style, Victorian era machinery, brass gears and cogs, steam-powered technology, industrial revolution aesthetic, retro-futuristic |
| Flashfade Polaroid | polaroid instant photo style, white border frame, flash photography, slightly faded colors, nostalgic vintage memory aesthetic, casual snapshot |

---

## 6. ความเร็วจังหวะ (PACINGS)

| ID | ชื่อ | prompt string |
|----|------|--------------|
| fast | เร็ว ⚡ | Fast paced editing with quick cuts, tight rhythm, energetic music, keeps viewers engaged without pausing |
| normal | ปกติ ▶️ | Normal pacing with balanced editing, clear story progression, easy to follow and understand |
| slow | ช้า 🐢 | Slow pacing with detailed shots, allows time to appreciate details and textures, showcase product features |
| dynamic_mix | ผสมเร็ว-ช้า 🎚️ | Use dynamic pacing with intentional tempo shifts: fast hook, clearer mid explanation, and high-impact ending |

---

## 7. สไตล์กล้อง (SHOOTING_STYLES)

| ID | ชื่อ | prompt string |
|----|------|--------------|
| cinematic | ภาพยนตร์ 🎬 | Cinematic shooting style with wide shots, depth, professional lighting, lens flares, shallow depth of field like film production |
| casual | สบายๆ 📱 | Casual UGC style shot on mobile phone, natural lighting, close-ups, authentic and relatable like real people |
| documentary | สารคดี 📹 | Documentary style shooting with real situations, unscripted feel, candid moments, authentic documentary storytelling |
| vlog | วล็อก 🎥 | Vlog self-recorded style with handheld camera, selfie angle, personal intimate framing, relatable creator vibe |
| asmr | ASMR 🎧 | ASMR style with extreme close-ups, textural focus, soft whisper tones, satisfying sound design, intimate sensory experience |
| macro | มาโคร 🔍 | Extreme macro close-up style with microscopic detail, shallow depth of field, product texture emphasis, professional product photography |

---

## 8. ภาษาถิ่น (DIALECTS)

| ID | ชื่อ | prompt string |
|----|------|--------------|
| none | ไม่เลือก | (ไม่ใส่ prompt เพิ่ม) |
| central | ภาคกลาง (มาตรฐาน) | Use standard Thai language, clear pronunciation, no regional accent or dialect markers |
| isan | อีสาน | Use Isan dialect with characteristic tone markers: เด้อ, คักๆ, เจ้าเว้า, phrases should sound like northeastern Thai speakers |
| northern | เหนือ | Use Northern Thai dialect: อู้, เน้อ, หล่าว, เหลิง including northern speech patterns and soft pronunciation |
| southern | ใต้ | Use Southern Thai dialect: หมายเว้ย, เหลง, แหลง, ฟัด, fast-paced delivery characteristic of southern speakers |
| bangkok_urban | กรุงเทพวัยรุ่น | Use modern Bangkok urban Thai with natural social-media phrasing, trendy but still understandable to a broad audience |
| formal_thai | ทางการสุภาพ | Use formal polite Thai with clear sentence structure and professional wording suitable for brand communication |
| thai_english_mix | ไทยผสมอังกฤษ | Use Thai as the main language with natural light English code-switching for key terms and modern marketing style |

---

## 9. แนวทางผสมที่แนะนำสำหรับ TikTok Shop

| ประเภทสินค้า | Style แนะนำ | Tone | Visual | Shooting |
|-------------|------------|------|--------|----------|
| สกินแคร์/บิวตี้ | 2 Soft Sell หรือ 55 Authentic | dramatic / inspirational | Hyperdetail Human / Movieframe Real | casual / vlog |
| อาหาร/เครื่องดื่ม | 40 Glutton หรือ step_story | funny / chill | Gourmet Macro Cinema | macro / casual |
| แฟชั่น/เสื้อผ้า | 30 Sassy Queen หรือ 32 Self-Made | urgent / professional | Movieframe Real | cinematic |
| ของใช้ในบ้าน | 9 The Nag หรือ benefit_story | funny / dramatic | Cleanline Vector UI | documentary |
| อาหารเสริม/สุขภาพ | 4 Skeptic หรือ 17 Myth Buster | professional / inspirational | Movieframe Real | vlog |
| ของเล่น/เด็ก | Kids Drama mode | funny | Cartoon Nova 3D | casual |
| สินค้าไวรัล/ใหม่ | 22 De-influencer หรือ 26 Investigator | thrilling / curiosity | UGC Raw | casual |
