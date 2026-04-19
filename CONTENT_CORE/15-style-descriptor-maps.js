/**
 * CONTENT_CORE/15-style-descriptor-maps.js
 * Style Descriptor Maps for prompt assembly
 * Source: sidepanel.js lines 577–965
 *
 * These maps convert user-selected dropdown IDs into Thai/English
 * descriptor strings that are injected into content generation prompts.
 *
 * Used in: buildContentGenerationPrompt(), getStyleDescription()
 * Pattern: maps[field][value] → descriptor string
 */

export const VIDEO_STYLE_MAP = {
  'default_clean': 'สไตล์มาตรฐาน - สะอาด เรียบง่าย',
  'christmas': 'ธีมคริสต์มาส - ตกแต่งเทศกาล',
  'new_year': 'ธีมปีใหม่ - นับถอยหลัง',
  'chinese_new_year': 'ธีมตรุษจีน - สีแดงทอง',
  'valentine': 'ธีมวาเลนไทน์ - โรแมนติก',
  'songkran': 'ธีมสงกรานต์ - สดใส',
  'halloween': 'ธีมฮาโลวีน - ลึกลับ',
  'luxury_mall': 'สไตล์ห้างหรู - พรีเมียม',
  'premium_luxury': 'สไตล์หรูหรา - ไฮเอนด์',
  'minimal': 'มินิมอล - เรียบง่าย',
  'cute_kawaii': 'น่ารัก คาวาอี้ - พาสเทล',
  'bright_cheerful': 'สดใส ร่าเริง - มีชีวิตชีวา',
  'warm_friendly': 'อบอุ่น เป็นกันเอง',
  'seller_fierce': 'แม่ค้าดุ - ขายจริงจัง',
  'real_review': 'รีวิวจริง - ไม่ปรุงแต่ง',
  'viral_tiktok': 'ไวรัล TikTok - ฮุคเด็ด',
  'flash_sale': 'Flash Sale - เร่งด่วน',
  'before_after': 'Before/After - เปรียบเทียบ',
  'storytelling': 'เล่าเรื่อง - มีเนื้อหา',
  'ugc_real_user': 'UGC ผู้ใช้จริง - ธรรมชาติ',
  'business_pro': 'ธุรกิจมืออาชีพ - น่าเชื่อถือ',
  'tech_modern': 'เทคโนโลยี - ทันสมัย',
  'korean_clean': 'สไตล์เกาหลี - ผิวใส',
  'japanese_soft': 'สไตล์ญี่ปุ่น - นุ่มนวล',
  'no_face': 'ไม่เห็นหน้า - เน้นสินค้า',
  'silent_text': 'ไม่มีเสียง - ใช้ข้อความ',
  'big_text_sell': 'ตัวอักษรใหญ่ - เน้นขาย',
  'chill_lifestyle': 'ชิลล์ ไลฟ์สไตล์ - สบายๆ',
  'series_content': 'ซีรีส์ต่อเนื่อง - ตอนต่อตอน'
};

export const SPEAKING_STYLE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'fast_high_energy': 'เร็ว พลังเยอะ - ฮุคแรง',
  'calm_soft': 'สงบ นุ่มนวล - ผ่อนคลาย',
  'confident_authority': 'มั่นใจ - น่าเชื่อถือ',
  'friendly_chat': 'คุยสบายๆ - เป็นกันเอง',
  'step_by_step': 'สอนทีละขั้น - ชัดเจน',
  'excited_dynamic': 'ตื่นเต้น - มีพลัง',
  'logical_reasoning': 'เหตุผล - วิเคราะห์',
  'storytelling_flow': 'เล่าเรื่อง - ลื่นไหล',
  'problem_solution': 'ปัญหา → ทางออก',
  'question_hook': 'ตั้งคำถาม - ดึงความสนใจ',
  'data_explainer': 'อธิบายด้วยข้อมูล',
  'before_after_reveal': 'เปิดเผย Before/After',
  'soft_review': 'รีวิวนุ่มๆ - ไม่ขายตรง',
  'hard_sell': 'ขายตรง - กระตุ้นซื้อ',
  'motivational_push': 'สร้างแรงบันดาลใจ',
  'luxury_slow': 'หรูหรา - ช้าๆ',
  'news_report': 'รายงานข่าว - จริงจัง',
  'viral_short_cut': 'ตัดเร็ว - ประโยคสั้น',
  'empathetic': 'เข้าใจปัญหา - ใส่ใจ',
  'educational': 'ให้ความรู้ - สอน',
  'northern_gentle': 'สำเนียงเหนือ - อ่อนโยน',
  'northern_friendly': 'สำเนียงเหนือ - เป็นกันเอง',
  'northeastern_energetic': 'สำเนียงอีสาน - สนุกสนาน',
  'northeastern_story': 'สำเนียงอีสาน - เล่าเรื่อง',
  'central_natural': 'ภาคกลาง - ธรรมชาติ',
  'central_market_seller': 'แม่ค้าตลาด - ขายเก่ง',
  'southern_strong': 'สำเนียงใต้ - มั่นใจ',
  'southern_fast': 'สำเนียงใต้ - เร็ว พลังเยอะ'
};

export const VOICE_TONE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'female_clear_bright': 'ผู้หญิง - ใส สดใส',
  'female_soft_warm': 'ผู้หญิง - นุ่ม อบอุ่น',
  'female_confident': 'ผู้หญิง - มั่นใจ',
  'male_deep_calm': 'ผู้ชาย - ทุ้ม สงบ',
  'male_energetic': 'ผู้ชาย - พลังเยอะ',
  'male_authority': 'ผู้ชาย - น่าเชื่อถือ',
  'neutral_natural': 'กลางๆ - ธรรมชาติ',
  'youthful_trendy': 'วัยรุ่น - ทันสมัย',
  'luxury_smooth': 'หรูหรา - นุ่มนวล',
  'serious_news': 'ผู้ประกาศข่าว - จริงจัง',
  'motivational_strong': 'สร้างแรงบันดาลใจ - พลังเยอะ',
  'friendly_live': 'ไลฟ์สด - เป็นกันเอง',
  'gentle_asmr': 'ASMR - กระซิบ นุ่มนวล',
  'corporate_clean': 'องค์กร - สะอาด',
  'story_narrator': 'ผู้บรรยาย - เล่าเรื่อง',
  'sales_power': 'นักขาย - ปิดการขาย',
  'tech_ai': 'AI สังเคราะห์ - ล้ำสมัย',
  'calm_minimal': 'สงบ - มินิมอล',
  'dramatic_reveal': 'ดราม่า - เปิดเผย',
  'family_trust': 'ครอบครัว - น่าเชื่อถือ',
  'northern_female_soft': 'ผู้หญิงเหนือ - อ่อนโยน',
  'northern_male_calm': 'ผู้ชายเหนือ - สงบ',
  'northeastern_female_lively': 'ผู้หญิงอีสาน - สนุกสนาน',
  'northeastern_male_expressive': 'ผู้ชายอีสาน - มีอารมณ์',
  'central_standard_female': 'ผู้หญิงกลาง - มาตรฐาน',
  'central_standard_male': 'ผู้ชายกลาง - มาตรฐาน',
  'southern_female_strong': 'ผู้หญิงใต้ - มั่นใจ',
  'southern_male_fast': 'ผู้ชายใต้ - เร็ว พลังเยอะ'
};

export const SCRIPT_STYLE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'hook_problem_solution': 'ฮุค → ปัญหา → ทางออก',
  'soft_review_story': 'รีวิวนุ่มๆ - เล่าประสบการณ์',
  'top_3_reasons': '3 เหตุผลที่ต้องซื้อ',
  'before_after_case': 'Before/After - เปลี่ยนแปลง',
  'testimonial_case': 'รีวิวจากลูกค้าจริง',
  'faq_answer': 'ถาม-ตอบ FAQ',
  'demo_walkthrough': 'สาธิตทีละขั้นตอน',
  'comparison_competitor': 'เปรียบเทียบคู่แข่ง',
  'educational_value': 'ให้ความรู้ก่อนขาย',
  'hard_offer_close': 'ขายตรง - ปิดการขาย',
  'limited_time_offer': 'โปรจำกัดเวลา - นับถอยหลัง',
  'relatable_situation': 'สถานการณ์ที่เข้าใจได้',
  'data_proof': 'พิสูจน์ด้วยข้อมูล',
  'luxury_brand_story': 'เล่าเรื่องแบรนด์หรู',
  'viral_short_hook': 'ฮุคสั้น - ไวรัล',
  'emotional_pain_point': 'กระตุ้นอารมณ์ - Pain Point',
  'authority_explain': 'ผู้เชี่ยวชาญอธิบาย',
  'myth_busting': 'หักล้างความเชื่อผิดๆ',
  'challenge_style': 'ท้าทาย - ทดลอง',
  'series_episode': 'ซีรีส์ต่อเนื่อง - ตอนต่อตอน'
};

export const THAI_ART_STYLE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'thai_temple_mural': 'จิตรกรรมฝาผนังวัด - ลายไทยประณีต ทองคำ',
  'thai_royal_palace': 'สไตล์ราชวงศ์ - พระราชวัง หรูหรา',
  'thai_lanna': 'ล้านนา - อบอุ่น เรียบง่าย ไม้สัก',
  'thai_modern_fusion': 'ไทยร่วมสมัย - ผสมผสานโมเดิร์น',
  'thai_silk_pattern': 'ลายผ้าไหมไทย - สีสันสดใส',
  'thai_gold_leaf': 'ทองคำเปลว - หรูหรา ประณีต',
  'realistic_ugc': 'UGC สมจริง - ธรรมชาติ ไม่ปรุงแต่ง',
  'cinematic_film': 'ซีนีมาติก - ภาพยนตร์ แสงเงาสวย',
  'anime_thai_cute': 'อนิเมะไทย - น่ารัก คาวาอี้',
  'watercolor_soft': 'สีน้ำ - นุ่มนวล โรแมนติก',
  'neon_cyberpunk': 'นีออน ไซเบอร์พังค์ - ล้ำสมัย',
  'vintage_retro': 'วินเทจ เรโทร - ย้อนยุค',
  'minimalist_clean': 'มินิมอล - สะอาด เรียบง่าย',
  'luxury_editorial': 'หรูหรา Editorial - นิตยสาร'
};

export const DIALOGUE_STYLE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'hard_sell_urgent': 'ขายแรง เร่งด่วน - "หมดแล้วหมดเลย!"',
  'soft_friendly': 'นุ่มนวล เป็นกันเอง - "ลองดูนะคะ"',
  'funny_viral': 'ตลก ไวรัล - เปิดประโยคชวนติดตามแบบสนุก (ห้ามใช้คำว่า เฮ้ย)',
  'expert_trust': 'ผู้เชี่ยวชาญ น่าเชื่อถือ - "จากการทดสอบ..."',
  'fomo_scarcity': 'FOMO กลัวพลาด - "เหลือไม่กี่ชิ้น!"',
  'storytelling_engage': 'เล่าเรื่อง - "รู้มั้ยว่า..."',
  'question_hook': 'ตั้งคำถาม - "เคยเจอปัญหานี้มั้ย?"',
  'challenge_dare': 'ท้าทาย - "ไม่เชื่อลองดู!"',
  'emotional_touch': 'กระตุ้นอารมณ์ - "คิดถึงคนที่รัก..."',
  'comparison_shock': 'เปรียบเทียบ ช็อค - "ต่างกันขนาดนี้!"',
  'secret_reveal': 'เปิดเผยความลับ - "ไม่เคยบอกใคร..."',
  'trend_follow': 'ตามเทรนด์ - "ทุกคนกำลังพูดถึง..."',
  'real_review': 'รีวิวจริง - "ใช้มา 3 เดือน..."',
  'countdown_pressure': 'นับถอยหลัง - "เหลืออีก 10 ชิ้น!"'
};

export const PRODUCT_CATEGORY_MAP = {
  'auto_detect': 'ตรวจจับอัตโนมัติ (AI วิเคราะห์จากชื่อสินค้า)',
  'fashion': '👗 เสื้อผ้า / แฟชั่น (เน้นการเคลื่อนไหว ผิวสัมผัสผ้า)',
  'shoes': '👟 รองเท้า (เน้นพื้นผิวจริง มุมมองระดับสายตา)',
  'bags': '👜 กระเป๋า (วางแบบไม่ตั้งใจ เทียบขนาดกับคน)',
  'beauty': '💄 สกินแคร์ / เครื่องสำอาง (เนื้อสัมผัส ผิวสุขภาพดี)',
  'home_gadget': '🏠 ของใช้ในบ้าน / Gadget (บริบทการใช้งานจริง)',
  'food': '🍽️ อาหาร / เครื่องดื่ม / อาหารเสริม (น่าทาน เข้าถึงง่าย)',
  'accessory_watch': '⌚ เครื่องประดับ / นาฬิกา (แสงเงา สัดส่วนสวมใส่)',
  'tech': '📱 อิเล็กทรอนิกส์ / เทคโนโลยี (ฟีเจอร์ การใช้งาน)',
  'morning_routine': '🌅 กิจวัตรยามเช้า (สดใส ส่วนหนึ่งของชีวิตดี)',
  'in_use': '🤲 กำลังจะใช้ / ถืออยู่ (มือถือสินค้า น่าเชื่อถือ)',
  'on_the_go': '🏃 พกพาไปทุกที่ (สะดวก ไลฟ์สไตล์แอคทีฟ)'
};

export const HOOK_CATEGORY_MAP = {
  'auto': '🤖 AI เลือกให้อัตโนมัติ',
  'FOMO': '🔥 FOMO & Flash Sale (กลัวพลาด)',
  'AUTHENTIC': '👯‍♀️ Authentic Vibe (เพื่อนป้ายยา)',
  'OBSESSION': '👑 Scarcity & Obsession (อวยยศ)',
  'CURIOSITY': '🤯 Curiosity Gap & Shock (ช็อก)'
};

// Note: character and background keys reference CHARACTER_STYLE_MAP / BACKGROUND_STYLE_MAP
// which live in sidepanel.js and are not exported from this file.
export const DROPDOWN_OPTIONS = {
  videoStyle: Object.keys(VIDEO_STYLE_MAP),
  speakingStyle: Object.keys(SPEAKING_STYLE_MAP),
  voiceType: Object.keys(VOICE_TONE_MAP),
  scriptStyle: Object.keys(SCRIPT_STYLE_MAP),
  thaiArtStyle: Object.keys(THAI_ART_STYLE_MAP),
  dialogueStyle: Object.keys(DIALOGUE_STYLE_MAP),
  productCategory: Object.keys(PRODUCT_CATEGORY_MAP),
  hookCategory: Object.keys(HOOK_CATEGORY_MAP)
};

export const PRODUCT_STATUS = {
  pending: { label: 'รอดำเนินการ', color: 'secondary' },
  analyzing: { label: 'กำลังวิเคราะห์', color: 'warning' },
  generating: { label: 'กำลังสร้าง', color: 'info' },
  processing: { label: '🔄 กำลังทำ', color: 'warning' },
  completed: { label: 'เสร็จสิ้น', color: 'success' },
  posted: { label: '✅ สำเร็จ', color: 'success' },
  failed: { label: '❌ ล้มเหลว', color: 'danger' },
  skipped: { label: '⏭️ ข้าม', color: 'secondary' },
  error: { label: 'ผิดพลาด', color: 'danger' }
};
