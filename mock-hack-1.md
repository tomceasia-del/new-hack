# Mock hack 1 — บันทึกอ้างอิง

**อัปเดต:** 2026-04-17  
**โฟลเดอร์โปรเจกต์:** `new hack`  
**ไฟล์หลักของ mock:** `story-config-mock.html`

เอกสารนี้รวมสิ่งที่ออกแบบไว้ใน mock, แหล่งข้อมูลใน repo จริง, และช่องว่างระหว่าง spec กับ extension — ใช้ต่อยอด implement หรือ sync กับ `sidepanel.js` / master prompt ได้จากที่เดียว

---

## 1. วัตถุประสงค์

- สาธิต **layout + ตัวเลือก** ก่อนส่ง AI (โหมดขายสินค้า / Story mode)
- ให้ **JSON payload** เป็นสัญญา (contract) ว่าฟอร์มจะส่งอะไรบ้าง
- จัดแถวข้อมูลให้ **ตรงกับ master** ที่เป็นแหล่งความจริง (director, mood, narrative) และ **ตรงกับ extension** ในส่วนที่ UI จริงใช้อยู่ (เช่น `VISUAL_STYLES`, `HOOK_OPTIONS`)

---

## 2. เปิด mock

- เปิดไฟล์ในเบราว์เซอร์:  
  `file:///Users/nasato/Desktop/new%20hack/story-config-mock.html`  
  (หรือดับเบิลคลิก / ลากเข้า Chrome)
- ถ้า `file://` ถูกบล็อกนโยบาย — รันเซิร์ฟเวอร์ static ชั่วคราวแล้วเปิดผ่าน `http://localhost/...`

---

## 3. ส่วนฟอร์ม (checklist 0–7)

| # | หัวข้อ | แหล่งข้อมูลใน repo |
|---|--------|---------------------|
| 0 | โหมด (ขายสินค้า / Story) | แยก pipeline ใน mock เท่านั้น |
| 1 | Prompt ข้อความ | user input |
| 2 | รูปสินค้า / ตัวละคร | mock แนบชื่อไฟล์ + thumb; ไม่ส่ง base64 ใน JSON ตัวอย่าง |
| 3 | จำนวนฉาก | slider 1–20; ข้อจำกัดจริงอยู่ที่ system prompt |
| Hook | ฮุค Scene 1 (`HOOK_OPTIONS`) | `1click-full-v3.40 (2)/js/sidepanel.js` → `initSMHookDropdown()` |
| 4 | Narrative หลายเลือก | `CONTENT_CORE/02-master-prompt-template.js` → `STYLE_OPTIONS` (63) — ฝัง JSON ใน mock |
| 5 | Mood หลายเลือก | master → `MOOD_KEYWORDS` (40) + แมปไทยบางคีย์ตาม `sidepanel.js` |
| 6 | Visual หลายเลือก | `sidepanel.js` → `VISUAL_STYLES` (20), default `disney` |
| 7 | H1/H2 บนภาพ | mock มี toggle; **ใน extension บันทึกแล้วแต่ยังไม่อ่านใน `buildUserMessage()`** (ช่องว่างที่รู้) |

---

## 4. Hook — สเปก (director) vs พฤติกรรม extension

### 4.1 สเปกใน director (ความหมาย “ข้างใน” 200 ฮุค)

อ้าง **`CONTENT_CORE/02a-director-prompt.js`** — Hook Library **200 แบบ**, แบ่ง **4 หมวด** โดยใช้เลขอ้างอิงช่วงละ ~50:

| หมวด | Hook ID (ช่วง) |
|------|-----------------|
| FOMO & Flash Sale | 1–50 |
| Authentic Vibe | 51–100 |
| Scarcity & Obsession | 101–150 |
| Curiosity Gap & Shock | 151–200 |

แนวทางใน prompt: ให้ **LLM** วิเคราะห์สินค้า → เลือกหมวด/เลขในคลัง → **ดัดแปลง** เป็นบทพูด Scene 1 (ไม่ใช่บังคับว่าแอปต้อง `Math.random()` จากไฟล์ 200 สตริง)

### 4.2 พฤติกรรม extension ปัจจุบัน (`sidepanel.js`)

- `HOOK_OPTIONS`: `auto`, `FOMO`, `AUTHENTIC`, `OBSESSION`, `CURIOSITY` (แสดงผลเหมือน dropdown ในรูป)
- **`buildUserMessage()`**: ถ้าไม่ใช่ `auto` จะแปะบรรทัดประมาณ  
  `═══ ประเภท Hook ═══` + **รหัสหมวด** (`FOMO` ฯลฯ) เท่านั้น — **ไม่แนบลิสต์ 200 ประโยค**
- ถ้าเป็น **`auto`**: **ไม่ใส่** บล็อก `ประเภท Hook` ใน user message — ให้โมเดลไปตาม director
- **`buildHookMasterPrompt` / `HOOK_MASTER_SECTION`**: ใน bundle ปัจจุบันคืน **`''` (TODO)**; `promptTemplate.js` มี `HOOK_LIBRARY` / `HOOK_CATEGORIES` เป็น **`{}` ว่าง** — แปลว่า **ยังไม่มีการฉีดคลังฮุคจาก JS** เข้า system message ตามที่สเปกอธิบายไว้

### 4.3 แนวคิด “เลือกหมวดแล้วสุ่มใน 50”

- **สมเหตุสมผลเป็นแบบ implement** (เช่น สุ่ม `hookId` ในช่วงของหมวด แล้วให้ LLM ดัดแปลงจากแม่แบบ #N)
- **ไม่ใช่สิ่งที่ extension ทำอยู่ทุกอย่างในตอนนี้** — ตอนนี้เป็นการส่ง **ชื่อหมวด** + ให้ **LLM** ทำงานตาม prompt มากกว่า

---

## 5. JSON payload (mock) — ฟิลด์หลัก

ค่าที่ mock สร้างใน `<pre id="json-out">` (โครงสร้างปัจจุบัน):

- `mode` — `storymode` | `product_sell`
- `prompt`
- `images` — สถานะแนบ + ชื่อไฟล์
- `sceneCount`
- `narrativeStyleIds`, `narrativeStyles`
- `moodKeywords`, `moodKeywordsDetail`
- `visualStyleIds`, `visualStyles`
- `hookCategory`, `hook` (อ็อบเจ็กต์จาก `HOOK_OPTIONS`)
- `textH1H2Enabled`

**แนะนำต่อยอดใน mock (ยังไม่บังคับว่า implement แล้ว):**  
`hookLibrarySpec`, `hookIdRangeInclusive`, `sampledHookReferenceId`, `userMessageHookBlock`, `extensionImplementationNote` — ใช้จำลองสัญญาเต็มเมื่อต้องการ parity กับ director + การสุ่มในช่วงหมวด

---

## 6. ช่องว่าง / backlog ที่เกี่ยวข้อง

1. **HOOK_MASTER** — เติม `buildHookMasterPrompt` + ข้อมูล `HOOK_LIBRARY` จริง หรือโหลดจาก CONTENT_CORE  
2. **H1/H2** — อ่านค่า checkbox เข้า `buildUserMessage()` / story generation  
3. **Mood / Narrative ใน extension** — บางจุดเป็น single-select; mock เป็น multi — ตัดสินใจ spec เดียวกันกับ prod  
4. **Random ฝั่งแอป** — ถ้าต้องการ “สุ่มใน 50” จริง ต้องกำหนดว่าเก็บแม่แบบที่ไหนและส่งให้ LLM อย่างไร

---

## 7. ไฟล์อ้างอิงด่วน

| ไฟล์ | หมายเหตุ |
|------|-----------|
| `story-config-mock.html` | UI + payload ตัวอย่าง |
| `1click-full-v3.40 (2)/js/sidepanel.js` | `initSMHookDropdown`, `buildUserMessage`, `VISUAL_STYLES`, stubs HOOK |
| `1click-full-v3.40 (2)/js/promptTemplate.js` | `STYLE_OPTIONS`, `MOOD_KEYWORDS`, `HOOK_LIBRARY` ว่าง |
| `CONTENT_CORE/02a-director-prompt.js` | Hook Library 200 + กฎ Scene 1 |
| `CONTENT_CORE/02-master-prompt-template.js` | `STYLE_OPTIONS` master |

---

## 8. บันทึกการเปลี่ยนแปลง (changelog)

| วันที่ | เรื่อง |
|--------|--------|
| 2026-04-17 | สร้าง `mock-hack-1.md` — รวมบริบท mock, Hook 200/4 หมวด, ช่องว่าง extension |
| 2026-04-17 | **Mission A (Discovery):** รายงานสำรวจครบ — ดู `MISSION-A-DISCOVERY-INVENTORY.md` (ตาราง 63↔`narrativeMap`, MOOD 40, VISUAL 50, extension stub) |
| 2026-04-17 | **Discovery รอบสอง** บันทึกใน `MISSION-A-DISCOVERY-INVENTORY.md` — ไม่พบแหล่ง prompt narrative เพิ่ม |

*(เพิ่มแถวด้านล่างเมื่อมีการแก้ mock หรือ sync extension)*
