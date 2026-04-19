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
├── api/
│   ├── gemini.js                  ← Serverless: เรียก Gemini (ใช้ GEMINI_API_KEY)
│   └── gemini-verify.js           ← GET: ตรวจว่า key ตั้งบน Vercel แล้ว
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

## Gemini API key (Production)

บน **Vercel** (ไม่ใช่ `localhost`):

1. Project → **Settings → Environment Variables**
2. เพิ่ม **`GEMINI_API_KEY`** = ค่าจาก [Google AI Studio](https://aistudio.google.com/apikey) (เลือก Environment: Production + Preview ตามต้องการ)
3. **Redeploy** โปรเจกต์หนึ่งครั้ง (หรือ push commit ใหม่)
4. เปิดหน้า CS — ถ้า `/api/gemini-verify` ตอบ **ok** จะขึ้นข้อความ **โหมดเซิร์ฟเวอร์** และไม่ต้องใส่ API key ในช่อง

**Local dev** (`localhost` / `127.0.0.1`): ยังใส่ API key ในหน้าและบันทึกใน `localStorage` ได้ตามเดิม (ไม่มี Serverless จาก `python3 serve_story_mock.py`)

**ทดบนเครื่องแบบมี API:** ใช้ `npx vercel dev` แล้วตั้ง `.env.local` หรือ env ของ Vercel CLI

## โดเมนจริง

Vercel → Project → **Settings → Domains** → Add Domain → ชี้ CNAME/Nameserver ตามคำแนะนำ
SSL ออกอัตโนมัติ (Let's Encrypt)

## Rollback

Vercel เก็บ **ทุก deployment** — ใน Dashboard กด **Promote to Production** ของ deployment เก่าได้ทันที
