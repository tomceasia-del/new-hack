# QA Checklist — Gem TikTok Shop
> ใช้ทดสอบทุกครั้งที่ตั้ง Gem ใหม่ หรืออัปเดต Knowledge

---

## ชุดทดสอบ (รัน 8 เคสนี้ครบก่อนใช้งานจริง)

### เคส 1: CTA เกิน 30 ตัวอักษร
Input speech ปกติ แต่ขอ CTA ว่า "กดสั่งซื้อได้เลยนะคะสินค้ามีจำนวนจำกัด"
ผลที่คาดหวัง: Gem ตัดหรือแก้ CTA ให้ไม่เกิน 30 ตัวอักษร

### เคส 2: CTA มี emoji
ขอ CTA ว่า "กดสั่งเลย 🛒"
ผลที่คาดหวัง: Gem ลบ emoji ออก output เป็น "กดสั่งเลย"

### เคส 3: Caption ใส่คำต้องห้าม
ระบุสินค้า: "ครีมที่การันตีผลขาวทันที"
ผลที่คาดหวัง: Gem แก้ "การันตีผล" → "มั่นใจในผลลัพธ์" และ "ขาวทันที" → "กระจ่างใสขึ้น" และต้องมีบรรทัด disclaimer ใน caption

### เคส 4: Speech เพศสลับ
ระบุเพศตัวละคร: ชาย แต่ speech มีคำว่า "นะคะ"
ผลที่คาดหวัง: Gem แก้ "นะคะ" เป็น "นะครับ" ทุกจุด

### เคส 5: ตัวเลขดิบใน speech
speech มีตัวเลข เช่น "ใช้แค่ 3 วัน ผิวดีขึ้นเลยค่ะ"
ผลที่คาดหวัง: Gem แก้ "3" เป็น "สาม" → "ใช้แค่สามวัน ผิวดีขึ้นเลยค่ะ"

### เคส 6: Hook ต้องอยู่ใน speech ไม่ใช่ใน caption
ตรวจว่า hookId ที่เลือกสะท้อนอยู่ใน speech เท่านั้น ไม่ปรากฏเป็น caption เปิด
ผลที่คาดหวัง: caption ไม่ใช่การคัดลอก Hook ทั้งประโยค

### เคส 7: โหมด Extend — speech2 ต้องต่อเนื่อง
ขอโหมด 16 วิ ตรวจว่า speech และ speech2 ต่อกันได้สมเหตุสมผล ไม่ขัดแย้งกัน
ผลที่คาดหวัง: speech2 ขยายประเด็นจาก speech ไม่ใช่พูดเรื่องใหม่ทั้งหมด

### เคส 8-A: เลือก Visual Style แล้ว prompt string ต้องเป็น prefix
เลือก "Thai Pulp Horror" ตรวจว่า Image Prompt ของทุกซีนเริ่มต้นด้วย "Thai horror comic style, black and white ink drawing..."
ผลที่คาดหวัง: Visual prompt string ปรากฏเป็น prefix ใน Image Prompt ทุกซีน ไม่ใช่แค่ซีนแรก

### เคส 8-B: เลือก Tone "ตลก" แล้วบทพูดต้องไม่เคร่งเครียด
เลือก Tone = ตลก ตรวจว่า speech/dialogue มีความ lighthearted/comedic
ผลที่คาดหวัง: บทพูดไม่ใช่โทนทางการ มีจังหวะตลกหรือ punchline

### เคส 8-C: ถาม "ให้ Gem เสนอ" สำหรับ Style + Visual + Tone
ไม่ระบุ 3 ข้อนั้น พิมพ์ว่า "ให้ Gem เสนอ"
ผลที่คาดหวัง: Gem เสนอ 2–3 ชุดตัวเลือกพร้อมเหตุผลสั้นๆ ก่อนสร้าง Storyboard ไม่ใช่สร้างทันที

### เคส 9: ไม่มี productId — ส่วน B ต้องหายไป
ระบุ productId: "ไม่มี"
ผลที่คาดหวัง: Output ส่วน B (สรุปตะกร้า) ต้องไม่ปรากฏ หรือระบุว่า "ไม่มีการปักตะกร้า"

---

## Regression เมื่ออัปเดต repo

เมื่อแก้ไฟล์ต้นทางต่อไปนี้:

| ไฟล์ที่เปลี่ยน | Knowledge ที่ต้องอัปเดต | เคส QA ที่ต้องรันซ้ำ |
|----------------|------------------------|---------------------|
| `CONTENT_CORE/01-forbidden-marketing-phrases.js` | `gem-kn-forbidden-phrases.md` | เคส 3, 4 |
| `sidepanel.js` (CONTENT_PROMPT_* หรือกฎ CTA) | `gem-kn-tiktok-shop-cta-caption.md` | เคส 1, 2, 5, 7, 8 |
| `02-master-prompt-template.js` (HOOK_LIBRARY) | `gem-kn-tiktok-shop-cta-caption.md` + `gem-kn-tiktok-commerce-core.md` | เคส 6 |
| `1CLICK_AUTOMATIC_SYSTEM_SPEC.md` (flow ปักตะกร้า) | `gem-kn-tiktok-cart-ops.md` | เคส 8 |

ขั้นตอน regression:
1. Export Knowledge ไฟล์ที่เกี่ยว → บันทึกเป็น `gem-kn-*-v[N+1].md`
2. แทนที่ไฟล์ใน Gem
3. รัน 8 เคสข้างต้น
4. บันทึกผลว่า pass/fail ในไฟล์นี้
