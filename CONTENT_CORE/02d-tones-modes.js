/**
 * CONTENT_CORE/02d-tones-modes.js
 * Prompt Modes, Film Modes, Enforcement Rules, Caption Repair
 * Split from: 02-master-prompt-template.js lines 773–861
 * Contains: PROMPT_MODES, FILM_MODES, NEGATIVE_PROMPT, NO_TEXT_ENFORCEMENT,
 *           TIKTOK_CAPTION_REPAIR_PROMPT
 * Used by: storymode prompt builder, Google Flow prompt assembly
 */

export const PROMPT_MODES = [
  { id: 'default', name: 'Default (Pixar 3D)', icon: '🎬', desc: 'โหมดมาตรฐาน การ์ตูน 3D / ขายของ' },
  { id: 'step_story', name: 'Step Story', icon: '📝', desc: 'เล่าทีละขั้นตอน (ทำอาหาร, ประกอบของ, วิธีใช้)',
    directive: `ถ้าโจทย์เป็นงานทำอาหาร งานเตรียมของ หรือภารกิจต่อเนื่อง ให้แตกเป็นขั้นตอนที่เห็นภาพจริง เช่น หา/เก็บวัตถุดิบ -> เตรียมครัว/อุปกรณ์ -> ลงมือทำทีละช่วง -> กิน/โชว์ผลลัพธ์
ทุก Scene ต้องมี Action แบบละเอียดและมองเห็นได้จริง เช่น หยิบ ล้าง ปอก หั่น จัดของ จุดไฟ ตำ ย่าง ชิม กิน
การกระทำต้องสมจริงตามพร็อพและสรีระของตัวแสดง
แต่ละ Scene ควรโฟกัส 1 ขั้นตอนหลักเท่านั้น
🧩 STEP STORY ACTION BLUEPRINT: Action ต้องเขียนเป็น "สิ่งที่กล้องเห็นจริงในฉากนี้" ใช้ภาษาไทยล้วน 1-2 ประโยคสั้น โครงสร้าง: [ตัวแสดง] + [ใช้อวัยวะ/อุปกรณ์อะไร] + [ทำอะไรกับวัตถุใด] + [ใส่/วาง/ถือ/ขนไปที่ไหน] + [ผลลัพธ์ที่เห็นทันที]` },
  { id: 'dance', name: 'Dance Performance', icon: '💃', desc: 'เต้น/แสดง โฟกัสท่าทาง choreography',
    directive: `ค่าเริ่มต้นคือ dance-first และ performance-first
Choreography ต้องมีคุณสมบัติแบบไวรัล: จำง่าย ทำตามได้จริง อ่านออกใน 1 รอบดู มี signature move 1 ชุด
Image Prompt ต้องล็อกเป็น keyframe ของท่าเต้นที่อ่าน silhouette ออกชัด
Video Prompt ต้องระบุลำดับการเคลื่อนไหวจริง เช่น start pose, weight shift, footwork, arm path, turn, bounce, hit beat
ห้ามใช้ท่าเดิมซ้ำทุกฉาก ห้ามเขียน Video Prompt ให้ออกเป็นคนยืนพูดสลับ gesturing
ฉากสุดท้ายควรจบด้วย hero pose, signature ending หรือ product reveal` },
  { id: 'review', name: 'Product Review', icon: '📦', desc: 'รีวิวสินค้าหน้ากล้อง (3D / ยาย / คนจริง)',
    directive: `🎥 REVIEW MODE:
ผู้รีวิวต้องอยู่หน้ากล้องทุกฉาก สินค้าเป็น prop ที่ตัวละครถือ/ใช้/ชี้/วางบนโต๊ะเท่านั้น
🎙️ REVIEW DIALOGUE AUTHENTICITY LOCK: แต่ละ Scene ต้องรีวิวคนละ "มุม" ของสินค้า เช่น ความรู้สึกแรก วิธีใช้ ประสิทธิภาพ ความจุ/วัสดุ
ห้ามใช้ opening/hook เดิมซ้ำหลายฉาก ห้าม copy ถ้อยคำขายเดิมข้ามฉาก ให้พูดแบบคนรีวิวจากประสบการณ์จริง` },
  { id: 'benefit_story', name: 'Benefit Product Story', icon: '💊', desc: 'เล่าประโยชน์สินค้าแบบมีเรื่องราว (Pain → Solution → Benefits → CTA)',
    directive: `โครงสร้างเรื่องต้องเดินตาม:
ช่วง A: เปิดด้วยปัญหาที่ลูกค้ามักเจอ (Pain)
ช่วง B: แนะนำสินค้าว่าช่วยแก้ปัญหาอะไร (Solution Intro)
ช่วง C: อธิบายสรรพคุณ/ประโยชน์แบบเข้าใจง่าย (Benefits)
ช่วง D: ปิดการขายด้วย CTA ที่ชัดเจนและน่าเชื่อถือ (Close)` },
  { id: 'ab_test', name: 'A/B Test', icon: '🔀', desc: 'สร้าง 2 เวอร์ชันเปรียบเทียบ',
    directive: `สร้าง Storyboard ออกมาเป็น 2 เวอร์ชัน (A และ B) ที่แตกต่างกัน:
Version A: ใช้โทนหรือมุมนำเสนอแบบหนึ่ง
Version B: เปลี่ยนมุมนำเสนอหรือ hook ให้ต่างจาก A ชัดเจน
ทั้งสองเวอร์ชันใช้สินค้าเดียวกัน แต่เปลี่ยน angle/hook/tone เพื่อทดสอบผลลัพธ์` },
  { id: 'compliance', name: 'Compliance Mode', icon: '🛡️', desc: 'โหมดปลอดภัยสุด ผ่าน policy ทุกแพลตฟอร์ม',
    directive: `เข้มงวดเรื่องคำโฆษณาเกินจริงและ policy สูงสุด:
ห้ามใช้คำทุกชนิดที่อยู่ใน FORBIDDEN WORDS แบบไม่มีข้อยกเว้น
ทุกบทพูดต้องผ่านกรองคำ overclaim ก่อนส่ง
Image/Video Prompt ต้องไม่มีคำรุนแรง คำคุกคาม หรือ branded content
Caption ต้องมี disclaimer "ผลลัพธ์ขึ้นอยู่กับแต่ละบุคคล"` }
];

// ══════════════════════════════════════════════════════════════
// 🎥 FILM MODES — โหมดพิเศษด้านภาพยนตร์
// ══════════════════════════════════════════════════════════════
export const FILM_MODES = [
  { id: 'none', name: 'ไม่เลือก', icon: '⚪', desc: 'โหมดปกติ', prompt: '' },
  { id: 'cinematic', name: 'Cinematic Film 🎬', icon: '🎬', desc: 'โครงเรื่องแบบหนังใหญ่ ลึก มีมิติ',
    prompt: `🎥 CINEMATIC FILM ENGINE:
โครงเรื่องต้องมี setup, escalation, turning point, payoff ชัด
ใช้น้ำเสียงแบบหนัง: คุม subtext, motivation, silence, reveal, visual motif
Dialogue ต้องสั้น กระชับ เล่นได้จริง มีจังหวะนักแสดง
Image Prompt ต้องคิดแบบภาพยนตร์: foreground/background depth, motivated lighting, blocking` },
  { id: 'kids', name: 'Kids Drama 🧸', icon: '🧸', desc: 'เด็กดูได้ ผู้ใหญ่แสดง สีสดใส ปลอดภัย',
    prompt: `🧸 KIDS DRAMA ENGINE:
โหมดนี้หมายถึง "ผู้ใหญ่แสดง แต่ทำให้เด็กดูเข้าใจและสนุกได้"
ตัวละครผู้แสดงหลักต้องเป็นผู้ใหญ่ที่ดูอบอุ่น เป็นมิตร
Tone ต้อง bright, safe, wholesome, playful
ห้ามใช้ความรุนแรง ความหวาดกลัวหนัก การข่มขู่ เรื่องเพศ` },
  { id: 'ghost_cctv', name: 'Ghost CCTV 📹', icon: '📹', desc: 'กล้องวงจรปิดหลอน ห้ามมีคนจริง',
    prompt: `📹 GHOST CCTV MODE:
HUMAN RESTRICTION (บังคับ): ห้ามมีคนจริง ห้ามตัวละครมนุษย์ ห้ามใบหน้ามนุษย์ชัดเจนในทุกซีน
CAMERA MUST BE STATIC: กล้องวงจรปิดมุมสูงแบบ fixed wide shot เท่านั้น
ฟีลภาพต้องเป็นกล้องจริง: infrared night vision, monochrome/low saturation, noise, scan lines
ห้ามเผยตัวผีชัดเจน: ผีต้องเป็นเงา/เงาดำ/เงาพร่ามัว` }
];

// ══════════════════════════════════════════════════════════════
// 🔒 NEGATIVE PROMPT STRINGS — ใช้ต่อท้าย Image/Video Prompt
// ══════════════════════════════════════════════════════════════
export const NEGATIVE_PROMPT = 'text distortions, morphing text, duplicate text overlay, duplicate headline, subtitles, captions, speech bubble, karaoke lyrics, watermarks, logos, on-screen text, lower-third, auto-transcription, extra hands, extra arms, extra fingers, duplicate limbs, fused fingers';

export const NO_TEXT_ENFORCEMENT = 'no text, no typography, no words, no letters, no subtitles, no captions, no speech-bubble subtitles, no dialogue bubbles, no karaoke lyrics, no lower-third, no logos, no watermarks, no black text box, no auto-transcription';

// ══════════════════════════════════════════════════════════════
// 📱 TIKTOK CAPTION REPAIR SYSTEM
// ══════════════════════════════════════════════════════════════
export const TIKTOK_CAPTION_REPAIR_PROMPT = `คุณคือ TikTok Caption Finisher สำหรับระบบสตอรี่บอร์ดสินค้า

หน้าที่ของคุณมีอย่างเดียว: ช่วยคิดคอนเทนต์โพสต์สั้นๆสำหรับสินค้านี้ แล้วส่งกลับมาเป็น TikTok Caption ที่พร้อมใช้

กฎบังคับ:
- ต้องตอบกลับเฉพาะบล็อกนี้เท่านั้น และต้องตอบให้ครบทุกครั้ง:
📱 TikTok Caption:
[แคปชั่นภาษาไทย 1-2 ประโยค]

[#hashtag1 #hashtag2 #hashtag3]
- ห้ามส่ง storyboard ซ้ำ ห้ามส่ง Scene ห้ามส่ง Director's Tips ห้ามมีข้อความส่วนเกิน
- เขียนภาษาไทยเท่านั้น
- แคปชั่นต้องสั้น กระชับ และให้ฟีลเหมือนข้อความโพสต์สั้นๆที่พร้อมใช้บน TikTok`;

// End of file
