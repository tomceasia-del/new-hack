# Knowledge: โหมดละครคุณธรรม — Output Schema

> ใช้คู่กับ `gem-kn-moral-drama-stamp.md`  
> API: `POST /api/moral-drama-mode`  
> ทุกซีนต้องแปลงเป็น storyboard text ที่ frontend parse ได้ด้วย `=== SCENE N: NAME ===` format

---

## JSON Root Object

```json
{
  "hero_bible_th": "<Thai: HERO BIBLE — ฉลาก ROLE ล็อกตลอดเรื่อง + ประโยคลักษณะเต็มต่อบทบาท; สะกด ROLE เดิมทุกซีน>",
  "character_profile_th": "<Thai: ตัวละครหลัก — สอดคล้อง hero_bible_th และรูปอ้างอิง (ถ้ามี)>",
  "narrator_voice_th": "<Thai: บุคลิกผู้เล่า/น้ำเสียง 2–4 ประโยค — อายุโดยประมาณ, โทนเสียง, จังหวะพูด, particle ที่ใช้>",
  "moral_summary_th": "<Thai: บทเรียนรวมของทั้งชุด 1–2 ประโยค — ใช้สำหรับ caption ชุดหรือ title card จบ>",
  "scenes": [...]
}
```

**`hero_bible_th`:** บังคับเมื่อมีหลายคนในเฟรมหรือหลายบทบาท — ถ้ามี hero เดียว ให้ระบุ ROLE เดียวให้ชัด (ห้ามให้ฝั่งภาพไปใช้คำทั่วไปแทน ROLE ที่ล็อก)

---

## JSON ต่อ Scene

```json
{
  "scene_number":    "<int, 1-based>",
  "arc_point":       "<'hook' | 'escalation' | 'twist' | 'moral'>",
  "twist_flag":      "<bool — true เฉพาะซีนที่มี plot twist หลัก>",
  "scene_title_th":  "<Thai: ชื่อฉากสั้น 3–8 คำ — สื่ออารมณ์ เช่น 'วันที่เธอโกหกครั้งแรก'>",
  "moral_beat_th":   "<Thai: บทเรียนย่อยของซีนนี้ หรือ null ถ้าไม่ใช่ซีน moral/twist — 1 ประโยคสั้น>",
  "hero_full_detail": "<English; บังคับ — บรรยายภาพครบทุกคนที่เห็นในเฟรมฉากนี้: เพศ · ช่วงวัย · ใบหน้า (อย่างน้อย 2 จุด) · ผิว · ผม · รูปร่าง · ชุดทีละชิ้น — ผูกกับ ROLE จาก hero_bible_th; พิมพ์ซ้ำประโยคเต็มทุกฉาก ห้ามอ้าง field อื่นแทนคำบรรยาย; ห้ามใช้แค่ \"a woman\" / \"a man\" / \"young woman\" อย่างเดียวโดยไม่มีรายละเอียดที่ล็อก>",
  "image_prompt":    "<English; โหมดภาพ — เฉพาะกล้อง แสง องค์ประกอบ + VISUAL STYLE + ห้ามใส่บทพูด/รายการผู้พูด/Speaker/Dialogue/voice_script; ลักษณะคนต้องสอดคล้องกับ hero_full_detail ของ **ซีนนี้เท่านั้น** (นำคำบรรยายจาก hero_full_detail มาใช้ในประโยคภาพ ไม่ใช้คำสั่งให้ไปดู field อื่น); NO text overlays, NO kinetic typography, NO price graphics>",
  "video_prompt":    "<English; motion, pacing, mood; VISUAL STYLE จาก user; ลักษณะคนสอดคล้อง hero_full_detail ซีนนี้ — ห้ามคัดลอกบทพูดทั้งบทเป็นรายการใน prompt ภาพเคลื่อนไหว (ใช้คำบรรยายการเคลื่อนไหว/อารมณ์); NO text overlays, NO kinetic typography, NO price graphics>",
  "voice_script_th": "<Thai; บทพูดตัวละครหรือ narrator ในซีนนี้ — ห้ามว่าง; 15–50 คำ; tone ตาม narrator_voice_th>",
  "caption_th":      "<Thai; TikTok caption — teaser / คำถามคาใจ / บทเรียนย่อ; ห้ามคำต้องห้าม>"
}
```

### กฎ `hero_full_detail` + `image_prompt` (สำคัญ)

1. **แหล่งความจริงฝั่งรูปต่อซีน = `hero_full_detail` ของซีนนั้น** — ห้ามเขียนใน JSON ว่า “ตาม character_profile” / “see scene 1” / “pull from root” แทนประโยคบรรยายใน field
2. **`image_prompt` ไม่รวม** รายการผู้พูด, บทจากวิดีโอ, `Speaker:`, `Dialogue:`, หรือข้อความ `voice_script_th` — มีได้แค่ภาษาอธิบายภาพที่สอดคล้อง `hero_full_detail`
3. **ห้ามคำทั่วไปแทน ROLE:** ถ้า hero_bible ล็อก ROLE_ANTAGONIST เป็นผู้หญิงชุดแดงรุนแรง ต้องใช้รายละเอียดเดียวกันในประโยค — ไม่ใช้แค่ “a woman in a red dress” โดยไม่ผูกลักษณะที่ล็อก (ถ้าล็อกแล้วต้องครบตามข้อ 1 ของ hero_full_detail)

---

## กฎ JSON Output

1. Output เป็น **JSON object เดียว** ไม่มี markdown fence ไม่มีข้อความก่อน/หลัง
2. `scenes` array ต้องมี **ตรงจำนวน** `scene_count` ที่รับมา
3. ต้องมี **ซีน twist อย่างน้อย 1 ซีน** (`twist_flag: true`) ไม่ว่า scene_count จะเป็นเท่าใด
4. ซีนสุดท้ายต้องเป็น `arc_point: "moral"` เสมอ
5. ห้ามซ้ำ `arc_point: "twist"` เกิน 1 ซีน เว้นแต่ scene_count ≥ 8
6. `voice_script_th` ห้ามว่าง ทุกซีนต้องมีบทพูด
7. **ทุกซีนต้องมี `hero_full_detail` (string ภาษาอังกฤษ ไม่ว่าง)** — บรรยายภาพครบในฟิลด์นี้ของซีนนั้นเท่านั้น ห้ามอ้างให้ผู้ใช้ไปดึงจากฟิลด์อื่นแทนประโยค
8. **`image_prompt` ห้ามมี** `Speaker:` / `Dialogue:` / บทพูดไทย / รายการผู้พูดจากวิดีโอ — มีได้แค่คำบรรยายภาพที่สอดคล้อง **`hero_full_detail` ของซีนนั้น**
9. `image_prompt` และ `video_prompt` ต้องมีวลี `NO text overlays, NO kinetic typography, NO price graphics`
10. `moral_beat_th` ต้องมีค่า (ไม่เป็น null) ในซีนที่มี `arc_point: "twist"` หรือ `"moral"`
11. **`hero_bible_th`** แนะนำให้มีเสมอ — ล็อก ROLE + ลักษณะเพื่อไม่ให้โมเดลภาพถดถอยไปใช้คำกว้างๆ เช่น "woman" / "man" อย่างเดียว

---

## ตัวอย่าง Output (scene_count=3)

```json
{
  "hero_bible_th": "ROLE_HERO — ผู้หญิงวัยประมาณ 28 ปี ผมสีน้ำตาลประบ่า ตาทรงอัลมอนด์ ผิวขาวอมชมพู ร่างบาง เสื้อลินินสีขาวกับกางเกงขายาวสีเข้ม สายตาเหนื่อยแต่ยังมุ่งมั่น — ใช้คำว่า ROLE_HERO / ลักษณะเดิมทุกซีน",
  "character_profile_th": "ROLE_HERO: ผู้หญิงอายุประมาณ 28 ปี ผมสั้นประบ่า ใส่เสื้อขาวสะอาด ดูเหนื่อยแต่มีความมุ่งมั่นในแววตา",
  "narrator_voice_th": "เสียงผู้หญิงอายุกลางคน โทนสงบแต่หนักแน่น พูดช้า มีเว้นจังหวะ ใช้คำว่า 'นะคะ' และ 'แต่ว่า' บ่อย",
  "moral_summary_th": "ความจริงอาจเจ็บปวด แต่มันไม่เคยทำร้ายเราได้นานเท่าการโกหกตัวเอง",
  "scenes": [
    {
      "scene_number": 1,
      "arc_point": "hook",
      "twist_flag": false,
      "scene_title_th": "วันที่ทุกอย่างดูสมบูรณ์แบบ",
      "moral_beat_th": null,
      "hero_full_detail": "ROLE_HERO alone on camera: woman late twenties, ash-brown shoulder-length hair tucked behind one ear, almond-shaped tired eyes, fair warm skin with faint under-eye shadow, slim build, crisp white linen blouse buttoned to the collar, slim dark trousers; both hands holding a smartphone, soft smile; apartment interior. No other speaking subjects visible.",
      "image_prompt": "Medium close-up of ROLE_HERO — late twenties woman ash-brown shoulder-length hair almond tired eyes fair warm skin slim build white linen blouse dark trousers smiling down at smartphone screen, warm golden-hour light through apartment window, shallow depth of field, Cinematic Realism style, NO text overlays, NO kinetic typography, NO price graphics",
      "video_prompt": "Slow pan from glowing phone screen up to face: late twenties ash-brown shoulder-length hair almond eyes fair warm skin white linen blouse dark trousers, warm lens flare, gentle handheld, Cinematic Realism style, mood hopeful, NO text overlays, NO kinetic typography, NO price graphics",
      "voice_script_th": "วันนั้นเธอรู้สึกว่าตัวเองโชคดีที่สุดในโลก — ทุกอย่างในชีวิตอยู่ในที่ที่ควรจะอยู่ นะคะ",
      "caption_th": "ดูเผินๆ เหมือนชีวิตสมบูรณ์แบบ... แต่เดี๋ยวก่อน 👀"
    },
    {
      "scene_number": 2,
      "arc_point": "twist",
      "twist_flag": true,
      "scene_title_th": "ความจริงที่ซ่อนอยู่ใต้รอยยิ้ม",
      "moral_beat_th": "สิ่งที่เราแสดงต่อโลก กับสิ่งที่เราเป็นตอนอยู่คนเดียว — อาจไม่เคยเหมือนกันเลย",
      "hero_full_detail": "ROLE_HERO same locked look: late twenties, ash-brown shoulder-length hair, almond eyes welling with tears, fair warm skin, slim build, white linen blouse and dark trousers unchanged; face fills frame reading phone message; screen reflection visible in iris.",
      "image_prompt": "Extreme close-up ROLE_HERO late twenties ash-brown hair almond eyes tears fair warm skin white linen blouse visible at neckline, phone message reflection in iris, cold blue tint on face vs warm room, Cinematic Realism style, NO text overlays, NO kinetic typography, NO price graphics",
      "video_prompt": "Tight emotional hold on late twenties woman ash-brown hair almond eyes tears white linen blouse; tear rolls, micro jaw tremor; cold/warm color contrast; Cinematic Realism style, NO text overlays, NO kinetic typography, NO price graphics",
      "voice_script_th": "แต่ข้อความนั้น... มันเปลี่ยนทุกอย่าง ในเสี้ยววินาที เธอตระหนักว่า — สิ่งที่เธอเชื่อมาตลอด ไม่เคยเป็นความจริงเลย",
      "caption_th": "บางครั้งความเจ็บปวดที่สุด คือสิ่งที่เราไม่ทันตั้งตัว 💔"
    },
    {
      "scene_number": 3,
      "arc_point": "moral",
      "twist_flag": false,
      "scene_title_th": "บทเรียนที่ไม่มีวันลืม",
      "moral_beat_th": "ความจริงอาจเจ็บปวด แต่มันไม่เคยทำร้ายเราได้นานเท่าการโกหกตัวเอง",
      "hero_full_detail": "ROLE_HERO seated by dusk window: late twenties, ash-brown shoulder-length hair loose, almond eyes calm but sad, fair warm skin, slim build, same white linen blouse slightly wrinkled, dark trousers; hands folded in lap; city bokeh outside. Full locked traits restated.",
      "image_prompt": "Wide shot ROLE_HERO seated alone by window at dusk late twenties ash-brown shoulder-length hair almond eyes peaceful sad expression fair warm skin slim build wrinkled white linen blouse dark trousers, golden bokeh city lights, Cinematic Realism style, NO text overlays, NO kinetic typography, NO price graphics",
      "video_prompt": "Slow zoom out from mid-shot to wide, late twenties ash-brown hair almond eyes white linen blouse dark trousers by window, warm sunset fading, soft ambient piano suggestion, Cinematic Realism style, NO text overlays, NO kinetic typography, NO price graphics",
      "voice_script_th": "เธอเสียน้ำตาไปมาก แต่ก็ได้บทเรียนที่ไม่มีวันลืม — ว่าความจริง ไม่ว่าจะเจ็บแค่ไหน ก็ยังดีกว่าการใช้ชีวิตอยู่กับสิ่งที่ไม่มีอยู่จริงนะคะ",
      "caption_th": "ความจริงอาจเจ็บปวด แต่มันไม่เคยทำร้ายเราได้นานเท่าการโกหกตัวเอง ❤️‍🩹"
    }
  ]
}
```
