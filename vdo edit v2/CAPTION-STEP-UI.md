# Caption (Step 4) — UI สเปก

ขอบเขต: **เฉพาะขั้น Caption** ไม่เปลี่ยนพฤติกรรมหน้า Trim

## 1) ซ่อน in/out readout เฉพาะ Caption

- บรรทัดเวลาใต้ rail (`#trim-readout`) ยังแสดงตอน **Trim (step 3)**
- ตอน **Caption (step 4)** ใส่ class เพื่อซ่อน (CSS) — ไม่ลบ element เพื่อให้ `updateTrimReadout()` ยังรันได้เมื่อสลับกลับ Trim

## 2) โลโก้ในโซน Caption

- วางใน `#caption-workspace` แถวบน จัดกึ่งกลาง (`flex` + `justify-content: center`)
- ค่าเริ่มต้น: **SVG inline** (คมทุกความละเอียด ไม่พึ่ง hotlink)
- ถ้าต้องการรูปจาก URL: แทนที่บล็อก `.caption-brand-mark` ใน `index.html` ด้วย  
  `<img class="caption-brand-img" src="https://..." width="56" height="56" alt="ชื่อแอป" decoding="async" />`  
  แนะนำไฟล์ SVG/PNG @2x และโดเมนที่อนุญาต hotlink

## 3) ปุ่มโซเชียล (ไม่ผูก API)

- **เปิดใช้** เมื่อมีข้อความในกล่อง caption (หลัง `trim()` แล้วไม่ว่าง)
- **ปิด** เมื่อว่าง — `title` / `aria-label` บอกให้พิมพ์ก่อน
- คลิก (client-only): คัดลอก caption ไปคลิปบอร์ด แล้ว `window.open` ไปหน้าแพลตฟอร์มทั่วไป (ผู้ใช้โพสต์/อัปโหลดไฟล์เอง) — ไม่เรียก backend

## 4) Render (ใช้งานได้จริง)

- โมดูล: `src/engine/renderMediaRecorderExport.js`
- วิธี: `video.captureStream()` + `MediaRecorder` เล่นช่วง `trimIn` → `trimOut` แล้วดาวน์โหลด
- ผลลัพธ์มักเป็น **`.webm`** (VP8/VP9) — **ไม่ใช่** pipeline WebCodecs + MP4 ตาม DECISIONS (ทำทีหลังได้)
- หลายคลิป: export **ทีละไฟล์** ตามลำดับ หน่วง ~700 ms ระหว่างดาวน์โหลด
- ปุ่ม `#btn-caption-render` — ล็อกระหว่าง export (`_captionExporting`)

## 5) Save (ใช้งานได้จริง)

- โมดูล: `src/engine/projectSave.js`
- **IndexedDB** `vdo-editor-v2`: store `files` (key = `clip.id`, value = `File`) + store `meta` key `last` (caption + trim meta)
- **ดาวน์โหลด** `vdo-project-*.json` — metadata + caption + **`trimPreviewPlaybackSpeed`** (1.0–1.5) — ไม่ embed วิดีโอใน JSON
- ปุ่ม `#btn-caption-save`

## การอัปเดตโค้ดที่เกี่ยวข้อง

- `index.html` — โลโก้ใน caption, `data-share-platform` บนปุ่มแชร์, ข้อความ hint, แถบปุ่ม Render / Save
- `src/ui/app.css` — `.trim-readout--caption-hidden`, `.caption-brand-row`, แถบ `.caption-action-row`
- `src/ui/app.js` — import engine, `syncCaptionStep4Buttons`, handler Render/Save
