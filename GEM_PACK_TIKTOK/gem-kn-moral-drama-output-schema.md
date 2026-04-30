# Knowledge: โหมดละครคุณธรรม — Output Schema

> ใช้คู่กับ `gem-kn-moral-drama-stamp.md`  
> API: `POST /api/moral-drama-mode`  
> ทุกซีนต้องแปลงเป็น storyboard text ที่ frontend parse ได้ด้วย `=== SCENE N: NAME ===` format

---

## JSON Root Object

```json
{
  "character_profile_th": "<Thai: รูปลักษณ์/บุคลิก hero — ถ้ามีรูปให้บรรยายตามรูป; ถ้าไม่มีให้สร้างจาก seed story; ใช้สะกดเดียวกันทุกซีน>",
  "narrator_voice_th": "<Thai: บุคลิกผู้เล่า/น้ำเสียง 2–4 ประโยค — อายุโดยประมาณ, โทนเสียง, จังหวะพูด, particle ที่ใช้>",
  "moral_summary_th": "<Thai: บทเรียนรวมของทั้งชุด 1–2 ประโยค — ใช้สำหรับ caption ชุดหรือ title card จบ>",
  "scenes": [...]
}
```

---

## JSON ต่อ Scene

```json
{
  "scene_number":    "<int, 1-based>",
  "arc_point":       "<'hook' | 'escalation' | 'twist' | 'moral'>",
  "twist_flag":      "<bool — true เฉพาะซีนที่มี plot twist หลัก>",
  "scene_title_th":  "<Thai: ชื่อฉากสั้น 3–8 คำ — สื่ออารมณ์ เช่น 'วันที่เธอโกหกครั้งแรก'>",
  "moral_beat_th":   "<Thai: บทเรียนย่อยของซีนนี้ หรือ null ถ้าไม่ใช่ซีน moral/twist — 1 ประโยคสั้น>",
  "image_prompt":    "<English; camera angle ตามคู่มือ; VISUAL STYLE จาก user; NO text overlays, NO kinetic typography, NO price graphics>",
  "video_prompt":    "<English; motion, pacing, mood; VISUAL STYLE จาก user; NO text overlays, NO kinetic typography, NO price graphics>",
  "voice_script_th": "<Thai; บทพูดตัวละครหรือ narrator ในซีนนี้ — ห้ามว่าง; 15–50 คำ; tone ตาม narrator_voice_th>",
  "caption_th":      "<Thai; TikTok caption — teaser / คำถามคาใจ / บทเรียนย่อ; ห้ามคำต้องห้าม>"
}
```

---

## กฎ JSON Output

1. Output เป็น **JSON object เดียว** ไม่มี markdown fence ไม่มีข้อความก่อน/หลัง
2. `scenes` array ต้องมี **ตรงจำนวน** `scene_count` ที่รับมา
3. ต้องมี **ซีน twist อย่างน้อย 1 ซีน** (`twist_flag: true`) ไม่ว่า scene_count จะเป็นเท่าใด
4. ซีนสุดท้ายต้องเป็น `arc_point: "moral"` เสมอ
5. ห้ามซ้ำ `arc_point: "twist"` เกิน 1 ซีน เว้นแต่ scene_count ≥ 8
6. `voice_script_th` ห้ามว่าง ทุกซีนต้องมีบทพูด
7. `image_prompt` และ `video_prompt` ต้องมีวลี `NO text overlays, NO kinetic typography, NO price graphics`
8. `moral_beat_th` ต้องมีค่า (ไม่เป็น null) ในซีนที่มี `arc_point: "twist"` หรือ `"moral"`

---

## ตัวอย่าง Output (scene_count=3)

```json
{
  "character_profile_th": "ผู้หญิงอายุประมาณ 28 ปี ผมสั้นประบ่า ใส่เสื้อขาวสะอาด ดูเหนื่อยแต่มีความมุ่งมั่นในแววตา",
  "narrator_voice_th": "เสียงผู้หญิงอายุกลางคน โทนสงบแต่หนักแน่น พูดช้า มีเว้นจังหวะ ใช้คำว่า 'นะคะ' และ 'แต่ว่า' บ่อย",
  "moral_summary_th": "ความจริงอาจเจ็บปวด แต่มันไม่เคยทำร้ายเราได้นานเท่าการโกหกตัวเอง",
  "scenes": [
    {
      "scene_number": 1,
      "arc_point": "hook",
      "twist_flag": false,
      "scene_title_th": "วันที่ทุกอย่างดูสมบูรณ์แบบ",
      "moral_beat_th": null,
      "image_prompt": "Medium close-up of a young woman smiling at her phone, warm golden-hour light through apartment window, Cinematic Realism style, shallow depth of field, NO text overlays, NO kinetic typography, NO price graphics",
      "video_prompt": "Slow pan from phone screen to woman's face, warm lens flare, soft ambient sound, Cinematic Realism style, gentle handheld stability, NO text overlays, NO kinetic typography, NO price graphics",
      "voice_script_th": "วันนั้นเธอรู้สึกว่าตัวเองโชคดีที่สุดในโลก — ทุกอย่างในชีวิตอยู่ในที่ที่ควรจะอยู่ นะคะ",
      "caption_th": "ดูเผินๆ เหมือนชีวิตสมบูรณ์แบบ... แต่เดี๋ยวก่อน 👀"
    },
    {
      "scene_number": 2,
      "arc_point": "twist",
      "twist_flag": true,
      "scene_title_th": "ความจริงที่ซ่อนอยู่ใต้รอยยิ้ม",
      "moral_beat_th": "สิ่งที่เราแสดงต่อโลก กับสิ่งที่เราเป็นตอนอยู่คนเดียว — อาจไม่เคยเหมือนกันเลย",
      "image_prompt": "Extreme close-up of woman's eyes filling with tears as she reads a message, reflection of screen in iris, Cinematic Realism style, cold blue tint contrast with warm background, NO text overlays, NO kinetic typography, NO price graphics",
      "video_prompt": "Tight shot of phone dropping in slow motion, cut to wide shot of empty apartment, silence then ambient sound rush, Cinematic Realism style, NO text overlays, NO kinetic typography, NO price graphics",
      "voice_script_th": "แต่ข้อความนั้น... มันเปลี่ยนทุกอย่าง ในเสี้ยววินาที เธอตระหนักว่า — สิ่งที่เธอเชื่อมาตลอด ไม่เคยเป็นความจริงเลย",
      "caption_th": "บางครั้งความเจ็บปวดที่สุด คือสิ่งที่เราไม่ทันตั้งตัว 💔"
    },
    {
      "scene_number": 3,
      "arc_point": "moral",
      "twist_flag": false,
      "scene_title_th": "บทเรียนที่ไม่มีวันลืม",
      "moral_beat_th": "ความจริงอาจเจ็บปวด แต่มันไม่เคยทำร้ายเราได้นานเท่าการโกหกตัวเอง",
      "image_prompt": "Woman sitting alone by window at dusk, peaceful expression despite sadness, golden bokeh background, Cinematic Realism style, wide shot, NO text overlays, NO kinetic typography, NO price graphics",
      "video_prompt": "Slow zoom out from close-up to wide, warm sunset light, soft piano ambient, fade to black, Cinematic Realism style, NO text overlays, NO kinetic typography, NO price graphics",
      "voice_script_th": "เธอเสียน้ำตาไปมาก แต่ก็ได้บทเรียนที่ไม่มีวันลืม — ว่าความจริง ไม่ว่าจะเจ็บแค่ไหน ก็ยังดีกว่าการใช้ชีวิตอยู่กับสิ่งที่ไม่มีอยู่จริงนะคะ",
      "caption_th": "ความจริงอาจเจ็บปวด แต่มันไม่เคยทำร้ายเราได้นานเท่าการโกหกตัวเอง ❤️‍🩹"
    }
  ]
}
```
