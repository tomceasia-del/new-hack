# Mission A — Discovery Inventory (รันแล้ว)

**วันที่:** 2026-04-17  
**ขอบเขต:** สำรวจ repo ว่ามี **prompt / แมป** สำหรับ **NARRATIVE (STYLE_OPTIONS 63)**, **MOOD (MOOD_KEYWORDS master 40)**, **VISUAL (master)** อยู่ที่ไหน และ **ช่องว่าง** เท่าใด

---

## สรุปผู้บริหาร (ตัวเลข)

| แกน | รายการใน catalog | มี prompt ละเอียดใน repo (สถานะ) | งาน “ตามหา/เขียน/ต่อสาย” ต่อไป |
|-----|------------------|----------------------------------|----------------------------------|
| **NARRATIVE** `STYLE_OPTIONS` id **1–63** | **63** | **39** จับคู่ `narrativeMap` ตรง · **4** (id 60–63) แชร์ **`politics_satire` 1 prompt** · **~2** ใกล้เคียง (12→`organ_tough_love`, 13→`pet_gossip`) · **18** ไม่มีใน `narrativeMap` (id **1–11, 14–20**) | เติม prompt เฉพาะ **อย่างน้อย 18** + แยก **60–63** ถ้าต้องการไม่แชร์ + รีวิวคุณภาพทั้ง 63 |
| **MOOD** `MOOD_KEYWORDS` (master) | **40** | อาร์เรย์เป็น **string อย่างเดียว** — **ไม่มี** `prompt` ต่อค่า · มีคนละระบบ **`TONES`** **10** รายการ (1 คือ `none` + prompt ว่าง) = **9** prompt สั้น · **`moodMap`** ใน `11-studio-maps.js` = **8 keys** | ถ้าเป้าคือ prompt 1:1 กับ 40 mood → **40** รายการต้องออกแบบ/ค้น หรือลด scope เป็น **8** ตาม Studio |
| **VISUAL** `VISUAL_STYLES` (master) | **50** | **50/50** มีฟิลด์ **`prompt`** ใน `CONTENT_CORE/02-master-prompt-template.js` (บรรทัด ~628–678) | **0** ในเชิงหา prompt — งานหลักคือ **integration**: extension `1click-full-v3.40 (2)/js/promptTemplate.js` ตั้ง `VISUAL_STYLES = {}` ว่าง |

---

## แหล่งอ้างอิงหลัก (หลักฐานใน repo)

| ไฟล์ | เนื้อหาที่เกี่ยวข้อง |
|------|------------------------|
| `CONTENT_CORE/02-master-prompt-template.js` | `STYLE_OPTIONS` (63), `MOOD_KEYWORDS` (40), `VISUAL_STYLES` (50 + `prompt`), `TONES` (มี `prompt`), `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` (กฎรวม + `**Styles:**` บางช่วง) |
| `CONTENT_CORE/11-studio-maps.js` | `narrativeMap` (**40 keys**, ประโยคคำสั่งภาษาอังกฤษ), `moodMap` (**8**), `visualMap` (**40 keys** — ไม่ครอบคลุม 50 visual id ทุกตัวแบบ 1:1) |
| `1click-full-v3.40 (2)/js/promptTemplate.js` | `STYLE_OPTIONS` แบบ **10 รายการ** (คนละชุดกับ master 63), `MOOD_KEYWORDS` **20 ค่า**, `VISUAL_STYLES = {}`, `TONES = {}`, `ADAPTIVE_VIDEO_DIRECTOR_PROMPT = ''` — **stub** |
| `1click-full-v3.40 (2)/js/sidepanel.js` | `buildUserMessage()` ส่งชื่อ narrative เป็นข้อความ · Studio บล็อก `narrativeMap`/`moodMap`/`visualMap` **ว่าง `''`** ในบางฟังก์ชัน (ตามรายงาน audit เดิม) |

---

## ตาราง STYLE_OPTIONS id 1–63 ↔ `narrativeMap` key

**คอลัมน์ `ระดับ`:**  
`DIRECT` = ใช้ข้อความใน `narrativeMap[key]` เป็นต้นทาง prompt ได้ทันที  
`SHARED` = id หลายตัวใช้ key เดียว (`politics_satire`)  
`RELATED` = ใกล้เคียงแต่ไม่ตรงบรีฟ  
`NONE` = ไม่มี key ใน `narrativeMap` (ต้องเขียน/หาแหล่งอื่น)

| id | ชื่อ | narrativeMap key | ระดับ |
|---:|------|------------------|--------|
| 1 | Hard Sell | — | NONE |
| 2 | Soft Sell | — | NONE |
| 3 | Unboxer | — | NONE |
| 4 | Skeptic | — | NONE |
| 5 | FOMO | — | NONE |
| 6 | Villain vs Hero | — | NONE |
| 7 | Tough Love | — | NONE |
| 8 | Tsundere | — | NONE |
| 9 | The Nag | — | NONE |
| 10 | Drama Queen | — | NONE |
| 11 | Talking Object | — | NONE |
| 12 | Organ War | `organ_tough_love` | RELATED |
| 13 | Pet Translator | `pet_gossip` | RELATED |
| 14 | Time Traveler | — | NONE |
| 15 | God vs Devil | — | NONE |
| 16 | Geek | — | NONE |
| 17 | Myth Buster | — | NONE |
| 18 | Q&A | — | NONE |
| 19 | Anchor | — | NONE |
| 20 | Trends Hunter | — | NONE |
| 21 | ASMR Seller | `asmr_seller` | DIRECT |
| 22 | De-influencer | `de_influencer` | DIRECT |
| 23 | Fortune Teller | `fortune_teller` | DIRECT |
| 24 | Over-Sharer | `over_sharer` | DIRECT |
| 25 | Main Character | `main_character` | DIRECT |
| 26 | Investigator | `investigator` | DIRECT |
| 27 | Isan Joy | `isan_joy` | DIRECT |
| 28 | Southern Direct | `southern_direct` | DIRECT |
| 29 | Northern Chill | `northern_chill` | DIRECT |
| 30 | Sassy Queen | `sassy_queen` | DIRECT |
| 31 | Gossiper | `gossiper` | DIRECT |
| 32 | Self-Made | `self_made` | DIRECT |
| 33 | Prankster Couple | `prankster_couple` | DIRECT |
| 34 | Underdog | `underdog` | DIRECT |
| 35 | Voiceover Troll | `voiceover_troll` | DIRECT |
| 36 | Fangirl/Fanboy | `fangirl` | DIRECT |
| 37 | Local Guru | `local_guru` | DIRECT |
| 38 | Mindset Coach | `mindset_coach` | DIRECT |
| 39 | Satirist | `satirist` | DIRECT |
| 40 | Glutton | `glutton` | DIRECT |
| 41 | ผักนักเลง | `veggie_gangster` | DIRECT |
| 42 | อวัยวะ Tough Love | `organ_tough_love` | DIRECT |
| 43 | เครื่องใช้ไฟฟ้าสู้ชีวิต | `appliance_life` | DIRECT |
| 44 | เงินในบัญชี | `money_wallet` | DIRECT |
| 45 | ผีเจ้าที่ | `ghost_shrine` | DIRECT |
| 46 | โฉนดที่ดิน | `land_house` | DIRECT |
| 47 | พัสดุขี้น้อยใจ | `package_sad` | DIRECT |
| 48 | ไอเทมสายมู | `lucky_charm` | DIRECT |
| 49 | สกินแคร์ทวงความยุติธรรม | `skincare_cream` | DIRECT |
| 50 | เสียงในหัว | `inner_voice` | DIRECT |
| 51 | นาฬิกาปลุกจอมด่า | `alarm_clock` | DIRECT |
| 52 | คอมพิวเตอร์ออฟฟิศ | `computer_office` | DIRECT |
| 53 | กาแฟเพื่อนรัก | `coffee_milk_tea` | DIRECT |
| 54 | พลังงาน Energy Bar | `energy_bar` | DIRECT |
| 55 | สัตว์เลี้ยงนินทา | `pet_gossip` | DIRECT |
| 56 | ต้นไม้พูดได้ | `plant_talk` | DIRECT |
| 57 | รองเท้า/พาสปอร์ต | `shoes_passport` | DIRECT |
| 58 | แอปนัดเดท | `dating_app` | DIRECT |
| 59 | เสื้อผ้าในตู้ | `closet_clothes` | DIRECT |
| 60 | เก้าอี้รัฐมนตรี | `politics_satire` | SHARED |
| 61 | งบประมาณพูดได้ | `politics_satire` | SHARED |
| 62 | นโยบายขายฝัน | `politics_satire` | SHARED |
| 63 | ไมโครโฟนสภา | `politics_satire` | SHARED |

**นับ `narrativeMap`:** มี **40 keys** (ดู `CONTENT_CORE/11-studio-maps.js` บรรทัด ~30–77)

---

## MOOD — รายละเอียดเพิ่ม

- **`MOOD_KEYWORDS` (master):** 40 strings — **ไม่มี prompt ต่อ mood**
- **`TONES` (master):** 10 แถว, แถว `none` มี `prompt: ''` → **9** prompt สั้น (บรรทัด ~712–723 ใน `02-master-prompt-template.js`)
- **`moodMap`:** 8 keys — ไม่ครอบ 40 ค่าของ `MOOD_KEYWORDS`

---

## VISUAL — รายละเอียดเพิ่ม

- Master **`VISUAL_STYLES`:** **50** รายการ แต่ละรายการมี **`prompt`**
- **`visualMap`:** **40** keys (ไม่เท่ากับ 50 id — งาน parity ระหว่าง `visualMap` ↔ `VISUAL_STYLES` เป็นขั้นถัดไป)
- Extension runtime: **`VISUAL_STYLES = {}`** ใน `1click-full-v3.40 (2)/js/promptTemplate.js`

---

## Discovery รอบสอง (เสร็จแล้ว — 2026-04-17)

สแกนเพิ่มตามแผน: **ไม่พบแหล่งใหม่** ที่มี “prompt ละเอียดต่อ Narrative id 1–63” นอกเหนือจากรอบแรก

| เป้าหมายการค้น | ผลลัพธ์ | หมายเหตุ |
|----------------|---------|----------|
| `1click-full-v3.40 (2)/js/promptTemplate.original.js` | **ไม่มี** `prompt` ต่อ style ใน `STYLE_OPTIONS` | โครงสร้างเดียวกับ master: `{ id, name, description }` + `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` เต็ม (บรรทัด ~171 มี `**Styles:**` รวม Hard Sell เป็นชื่อใน list) |
| `1click-full-v3.40 (2)/js/promptTemplate.encoded.js` | ข้อมูลถูก **เข้ารหัส XOR+Base64** แล้ว decode เป็น `ADAPTIVE_VIDEO_DIRECTOR_PROMPT` และ `STYLE_OPTIONS = JSON.parse(_d(_s))` | **ไม่ใช่ชุด prompt แยก 63 แบบ** — เป็น bundle เดียวกับ master ในรูปแบบ encoded |
| `1click-web-app/js/promptTemplate.js` | เหมือน **original / master** | ตัวอย่าง `Hard Sell`: แค่ `description` สั้น + อยู่ใน director เดียวกัน |
| `GEM_PACK_TIKTOK/*.md` | ตาราง **id / ชื่อ / คำอธิบายสั้น** เท่านั้น | ไม่มี paragraph prompt ต่อ style เกินตาราง |
| `CONTENT_INBOX/*.md` | ยืนยันซ้ำ: **master อยู่ที่ `promptTemplate.original.js`**; runtime stub ตัดข้อมูล | ไม่ชี้ไฟล์ลับที่มี 63 prompt ยาวแยก |
| `CONTENT_CORE/02b-hook-library.js` | mirror `STYLE_OPTIONS` / HOOK | ไม่เพิ่ม narrative prompt รายตัว |

**สรุปรอบสอง:** ความมั่นใจว่า **“ไม่มีไฟล์ซ่อนที่ยังไม่เปิด”** สำหรับ 63 narrative prompts แบบที่ต้องการ — **ยังคงต้องออกแบบ/เขียน** ช่วง id ที่ `NONE` และปรับคุณภาพช่วงที่มีต้นทางจาก `narrativeMap` อยู่แล้ว

---

## คำสั่งถัดไป (สำหรับ Agent B / Implementation)

1. สร้าง **`narrativePromptByStyleId`** (หรือเทียบเท่า) ครอบคลุม **63** — seed จาก `narrativeMap` ตามตารางด้านบน แล้วเติมช่อง **NONE** และแยก **SHARED**
2. ตัดสินใจ MOOD: **40 prompts** ตาม `MOOD_KEYWORDS` หรือย่อเป็น **8** + แมปจาก UI
3. VISUAL: **import/duplicate** master `VISUAL_STYLES` เข้า extension หรือ build pipeline แทน `{}`
4. เพิ่ม **validation** ตอน build: ห้ามขาด id / ห้าม `prompt` ว่าง

---

## Changelog

| วันที่ | รายการ |
|--------|--------|
| 2026-04-17 | สร้าง `MISSION-A-DISCOVERY-INVENTORY.md` — สำรวจครบ 63 narrative, MOOD 40, VISUAL 50 + extension stub |
| 2026-04-17 | **Discovery รอบสอง:** สแกน `promptTemplate.original.js`, `promptTemplate.encoded.js`, `1click-web-app/js/promptTemplate.js`, `GEM_PACK_TIKTOK/`, `CONTENT_INBOX/`, `02b-hook-library.js` — **ไม่พบ prompt ละเอียด 63 แบบเพิ่ม** |
