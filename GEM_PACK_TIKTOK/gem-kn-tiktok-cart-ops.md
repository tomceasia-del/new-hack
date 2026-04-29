# Knowledge: TikTok Shop — การปักตะกร้า (Ops Flow)
> ดึงจาก 1CLICK_AUTOMATIC_SYSTEM_SPEC.md §5.1–5.2 และ content-tiktok-platform.js / content.js
> ใช้เป็น Knowledge ใน Gem — ช่วยผู้ใช้เข้าใจ flow จริง, เตรียมข้อมูลให้ครบก่อนโพสต์, และแก้ปัญหาเมื่อ automation ล้มเหลว

---

## 1. ลำดับขั้นอัปโหลด + ปักตะกร้า (ทั้ง Manual และ Automation)

```
1. เปิดหน้า TikTok Upload
   URL: https://www.tiktok.com/tiktokstudio/upload

2. อัปโหลดไฟล์วิดีโอ
   (Drag & Drop หรือเลือกไฟล์)

3. ใส่ Caption
   - ความยาว caption ไม่มีข้อจำกัดจาก TikTok อย่างเป็นทางการ แต่ที่แสดงผลเต็มมักถูกตัดหลัง ~150 ตัวอักษร
   - ห้ามคำต้องห้ามทุกชนิด

4. ปักตะกร้า (Add Product Link) ← จุดสำคัญ
   Step 4.1: คลิกปุ่ม "Add product link" หรือ "Tag products"
   Step 4.2: กดปุ่ม "+Add"
   Step 4.3: กด Next → เลือกแท็บ Showcase
   Step 4.4: ค้นหาด้วย Product ID → เลือกสินค้า → กด Next
   Step 4.5: ใส่ CTA text → กดปุ่ม "Add"

5. กำหนดเวลา (Schedule)
   - Post Now: โพสต์ทันที
   - Scheduled: ระบุวันเวลา (ISO date)

6. เปิด Toggle "AI-generated content" (ถ้า TikTok บังคับ)

7. กดปุ่ม Post หรือ Schedule
```

---

## 2. ข้อมูลที่ต้องเตรียมก่อนปักตะกร้า

| Field | ตัวอย่าง | หมายเหตุ |
|-------|---------|---------|
| `productId` | `1729384756192` | หา Product ID ได้จาก TikTok Shop Seller Center → Products |
| `cta` | `กดสั่งซื้อเลย` | สูงสุด 30 ตัวอักษร, ห้าม emoji, ห้ามคำต้องห้าม |
| `caption` | `ของมันต้องมี...` | ต้องผ่านการกรองคำต้องห้ามก่อน |
| `scheduleType` | `now` หรือ `scheduled` | ถ้า scheduled ต้องมี `scheduleTime` |
| `scheduleTime` | `2026-04-20T10:00:00` | รูปแบบ ISO 8601 |

---

## 3. Data Model (PlatformPostData)

```typescript
interface PlatformPostData {
  platform: 'tiktok';
  videoBlob: string;       // Base64 encoded video
  caption: string;         // TikTok caption (ผ่าน forbidden check แล้ว)
  productId?: string;      // TikTok Shop Product ID (ถ้าต้องการปักตะกร้า)
  cta?: string;            // CTA text (สูงสุด 30 ตัวอักษร, ห้าม emoji)
  scheduleType: 'now' | 'scheduled';
  scheduleTime?: string;   // ISO date (ถ้า scheduleType = 'scheduled')
  timestamp: number;       // Unix timestamp — ข้อมูลเก่ากว่า 5 นาทีจะถูก reject
}
```

---

## 4. ข้อควรระวังเมื่อปักตะกร้า

- **Product ID ต้องถูกต้อง 100%** — ถ้า ID ผิดระบบจะหา product ไม่เจอ
- **CTA ห้ามเกิน 30 ตัวอักษร** และห้าม emoji — ถ้าเกินจะใส่ค่าไม่ได้
- **สินค้าต้องอยู่ในแท็บ Showcase** ของ TikTok Shop ก่อน — ถ้ายังไม่ได้เพิ่มจะค้นหาไม่เจอ
- **Timestamp ของ Data ต้องไม่เก่ากว่า 5 นาที** — ถ้านานกว่านั้นระบบจะ reject เพื่อป้องกัน stale data

---

## 5. เมื่อ Automation ปักตะกร้าไม่สำเร็จ — ทำมือ

1. เปิด https://www.tiktok.com/tiktokstudio/upload
2. อัปโหลดวิดีโอ
3. ใส่ Caption
4. คลิก "Add product link" → "+Add" → Next → Showcase
5. พิมพ์ Product ID ในช่องค้นหา
6. เลือก radio ของสินค้า → Next
7. ใส่ CTA text (ไม่เกิน 30 ตัวอักษร ห้าม emoji) → กด Add
8. เลือก Schedule หรือ Post Now → กดโพสต์

---

## 6. CTA ที่ TikTok รองรับ (ตัวอย่างที่ผ่านแน่นอน)

- สั่งเลยวันนี้
- กดสั่งซื้อเลย
- ดูเพิ่มเติม
- ของดีราคาถูก
- กดตะกร้าได้เลย
- ดูในตะกร้า
- Shop Now
- Buy Now
- Learn More

---

## 7. ข้อมูลที่ Gem ควรถามก่อนช่วยสร้าง caption/CTA/speech

1. ชื่อสินค้าและจุดเด่น 3 ข้อ
2. ราคา/โปรโมชั่น (ถ้ามี)
3. กลุ่มเป้าหมาย (อายุ, เพศ, ปัญหาที่สินค้าแก้ได้)
4. เพศตัวละครในวิดีโอ (ชาย/หญิง) — ใช้กำหนดคำลงท้าย ครับ/ค่ะ
5. ความยาวคลิป (8 วิ หรือ 16 วิ) — กำหนดว่าต้องการ speech เดียวหรือ speech + speech2
6. มี H1/H2 overlay หรือไม่
7. Product ID (ถ้าจะปักตะกร้า)
8. CTA ที่ต้องการ (หรือให้ Gem เสนอ)
