# Deploy Guide — Vercel (Project CS + Video Editor v2)

โครงที่จัดไว้ deploy เป็น **static site** บน Vercel ใต้โดเมนเดียว
- `/` → Project CS (`story-config-mock.html`)
- `/cs` → Project CS (alias)
- `/result` → หน้าผลเจน (`story-config-result.html`)
- `/editor` / `/editor/` → Video Editor v2 (`editor/index.html`)

## โครงไฟล์สำคัญ

```
/
├── story-config-mock.html         ← CS (หลัก)
├── story-config-result.html       ← CS (ผลเจน)
├── storymode-mock-enrich-bundle.js
├── storymode-mock-gemini-core.js
├── editor/                        ← Video Editor v2 (ชื่อโฟลเดอร์ไม่มีช่องว่าง)
│   ├── index.html
│   └── src/...
├── vercel.json                    ← routes + headers
├── .vercelignore                  ← กันไฟล์/โฟลเดอร์ภายในไม่ให้ขึ้น
└── README-deploy.md
```

โฟลเดอร์ `vdo edit v2/` **ต้นฉบับ** ยังอยู่สำหรับ dev ท้องถิ่น (`python3 serve.py`) — production ใช้ `editor/` ที่ copy ไว้

## วิธี deploy

### ทาง CLI (ครั้งแรก)
```bash
cd "/Users/nasato/Desktop/new hack"
npx vercel           # preview
npx vercel --prod    # production
```
เลือก scope / project ตามที่มีอยู่ บอก “Other / Static” เป็น framework ถ้าถาม

### ทาง Git (แนะนำระยะยาว)
1. Push repo นี้ขึ้น GitHub/GitLab/Bitbucket
2. Vercel → **Import Project** → เลือก repo
3. **Framework Preset:** Other
4. **Build Command:** (เว้นว่าง)
5. **Output Directory:** (เว้นว่าง — ใช้ root)
6. Deploy → ได้ Preview URL ต่อ branch

## ตรวจหลัง deploy (Preview)

- [ ] `/` โหลดหน้า CS, เห็น nav ด้านบน (Project CS / Video Editor v2)
- [ ] `/editor/` โหลด Video Editor, มี nav กลับ Project CS
- [ ] Network tab: `storymode-mock-enrich-bundle.js`, `storymode-mock-gemini-core.js` โหลด 200
- [ ] Network tab: `editor/src/ui/app.css`, `app.js` โหลด 200
- [ ] `unpkg.com/mp4box` โหลดได้ (ถ้าเซ็ต CSP อย่าลืม allow)
- [ ] ทดลองใน Chrome desktop (Video Editor v2 ออกแบบมาสำหรับ Chrome)

## การเพิ่ม CSP ภายหลัง (optional)

ถ้าจะปิด CSP ให้เพิ่มใน `vercel.json` → `headers`:
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://generativelanguage.googleapis.com; connect-src 'self' https://generativelanguage.googleapis.com https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self' blob:"
}
```
**ระวัง:** WebCodecs + mp4box อาจต้องการ `blob:` ใน `worker-src` / `media-src`

## API key (ถ้าจะ production จริง)

ตอนนี้ CS เรียก Gemini ฝั่ง client ด้วย key ใน `localStorage` — เหมาะเป็น prototype เท่านั้น
ทางที่ปลอดภัย:
1. เพิ่ม **Vercel Serverless Function** (เช่น `/api/gemini.js`)
2. เก็บ key ใน **Environment Variables** (Vercel Dashboard → Settings → Environment Variables)
3. แก้ `storymode-mock-gemini-core.js` ให้ fetch ไปที่ `/api/gemini` แทน Google URL โดยตรง

## โดเมนจริง

Vercel → Project → **Settings → Domains** → Add Domain → ชี้ CNAME/Nameserver ตามคำแนะนำ
SSL ออกอัตโนมัติ (Let's Encrypt)

## Rollback

Vercel เก็บ **ทุก deployment** — ใน Dashboard กด **Promote to Production** ของ deployment เก่าได้ทันที
