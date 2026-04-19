# CONTENT INBOX — ข้อมูลอ้างอิง (inbox_scrap)
> ไฟล์ในนี้ไม่ใช่ "กฎเนื้อหา" โดยตรง แต่มีประโยชน์สำหรับ backend/ops/UX reference

---

## api-config.md — AI Model Config (จาก api.js)

### Models (ถูก → แพง)
- **Gemini**: `gemini-2.0-flash` → `gemini-2.5-flash` → `gemini-2.5-pro`
- **OpenAI**: `gpt-4-turbo-preview`

### Config
- `max_tokens`: 16,000
- `temperature`: 0.7
- `maxOutputTokens`: 16,384

### Gemini Safety Settings (BLOCK_NONE — ใช้ใน extension เพื่อไม่ให้ Gemini block prompt)
- HARASSMENT: BLOCK_NONE
- HATE_SPEECH: BLOCK_NONE
- SEXUALLY_EXPLICIT: BLOCK_NONE
- DANGEROUS_CONTENT: BLOCK_NONE

### Fallback Strategy
- ลองโมเดลถัดไปเมื่อ: 429 / rate limit / quota exhausted
- ถ้าทุกโมเดลล้มเหลว: throw error

---

## google-flow-sop.md — SOP Google Flow (จาก content-googleflow.js)

> ⚠️ หมายเหตุ: เลข "13 ขั้นตอน" ในเอกสารเก่า = สรุปเชิงผู้ใช้ ไม่ใช่จำนวน automation steps จริง
> Pipeline จริง = **AUTOPOST_STEPS 17 steps** + sub-steps + 2 pipeline เพิ่มเติม
> ดู `CONTENT_INBOX/sop-master.md` สำหรับ full reference

### Pipeline 1: AutoPost (17 Steps) — `flowType: 'autopost'`

**Actual execution order** (AUTOPOST_STEPS key numbers ≠ runtime order):
`step1 → step3 → step4 → [4b→4b-2→4b-3?] → step2 → step5 → step6 → step7 → step8 → step9 → step10 → step11 → step12 → [step13→14→15→16→17 ถ้า clipDuration=16]`

| Step | Name | Description |
|------|------|-------------|
| 1 | New Project | กด New Project, รอ Slate UI, set `flowStatus:'in_progress'` |
| 2 | Select Image/Portrait/x1 | เลือก dropdown Image→Portrait→x1 (รันหลัง step3/4 จริง) |
| 3 | Upload Image | กด + อัปโหลดรูปสินค้า (base64 หรือ URL) |
| 4 | Hover Image + Add to Prompt | คลิกขวารูปสินค้า → Add to Prompt |
| 4b | (optional) Upload Character | อัปโหลดรูปตัวละคร ถ้ามี characterImage |
| 5 | Paste Prompt | วาง imagePrompt ลง Slate (sanitizePromptForFlow ก่อน) |
| 6 | Generate | กด Generate รูป |
| 7 | Wait for Image | รอรูป ≤ 150s (2.5 นาที); policy retry ≤ 2 ครั้ง |
| 8 | Add Image to Video Prompt | Hover รูปที่ generate → Add to Prompt สำหรับวิดีโอ |
| 9 | Paste Video Prompt | วาง videoPrompt8 ลง Slate |
| 10 | Select Video + Frames | เลือก Video tab → Frames → Veo model → Generate |
| 11 | Wait for Video | รอวิดีโอ ≤ 180s (3 นาที); บันทึก blob → `video_saved_8s` |
| 12 | Download Video | ถ้า 8s: download+TikTok / ถ้า 16s: เข้า extend |
| 13 | Click Video to Extend | เฉพาะ clipDuration=16 — เข้า Scene Builder extend |
| 14 | Paste Extend Prompt | วาง videoPrompt16 |
| 15 | Generate Extend | กด Generate สำหรับ 16s clip |
| 16 | Wait for Extended Video | รอ ≤ 180s |
| 17 | Open TikTok Upload | เปิด TikTok upload tab |

**Key sub-steps:** 4b-2 (inject character URL), 4b-3 (hover character+AddToPrompt), 5a-c (Image/Portrait/x1 tabs), 10a-d (Video/Frames/Veo/Generate)

---

### Pipeline 2: Storymode (7 Steps per scene) — `flowType: 'storymode'`

Message-driven per-scene pipeline (NOT a TikTok chain). Assembles scenes in Scene Builder.
Entry: `action==='createSceneImage'` → `handleCreateSceneImageFull`, `action==='createSceneVideo'` → `handleCreateSceneVideoFull`

| Step | Name | Description |
|------|------|-------------|
| 1 | Select Image/Portrait/x1 | `pipeline_selectImagePortrait()` — pre-steps ก่อน (clickNewProject first scene, uploadUserImage) |
| 2 | Paste Image Prompt | `pipeline_pastePromptToSlate(imagePrompt)` |
| 3 | Click Generate | `pipeline_clickGenerate()` — image wait loop implicit หลัง step 3 |
| 4 | Add Image to Prompt | `pipeline_hoverImageAndAddToPrompt()` — set `autoRunSceneStatus.step:'image'` |
| 5 | Select Video Tabs | `pipeline_selectVideoTabs()` |
| 6 | Generate Video | paste videoPrompt → `pipeline_clickGenerate()` → wait loop |
| 7 | Add Video to Scene | `pipeline_hoverVideoAndAddToScene()` — set `autoRunSceneStatus.step:'video'` |

---

### Pipeline 3: Auto V2 — `flowType: 'autov2'`

"3-Step Veo 3.1 Pipeline" — ข้าม Step 3 (upload) และ 4 (hover)

```
clickNewProjectButton()
  → v2PasteImagePromptAndGenerate()   [v2_image_generating → v2_image_done]
  → v2AddImageAndStartVideo()
  → v2SwitchToVideoAndPastePrompt()   [v2_video_generating → v2_video_saved]
  → v2ExtendVideoAndDownload()         [v2_extending → v2_extend_done]
  → downloadVideoAndOpenTikTok()       [completed_download]
```

Data: `currentFlowData.prompt`, `v2VideoPrompt`, `v2ExtendPrompt`

---

## system-spec-summary.md — สรุปสเปคระบบ (จาก 1CLICK_AUTOMATIC_SYSTEM_SPEC.md)

### Data Model Fields (สำหรับ DB design)
```typescript
interface ProductItem {
  id: string;
  name: string;
  price: number;
  appearance: string;    // บรรยายรูปลักษณ์
  features: string;      // คุณสมบัติ
  targetAudience: string; // กลุ่มเป้าหมาย
  usage: string;         // วิธีใช้
  videoTips: string;     // เคล็ดลับวิดีโอ
  summary_en: string;    // สรุปภาษาอังกฤษ
  productType: string;   // ประเภทสินค้า
  brand: string;         // แบรนด์
  colorTone: string;     // โทนสี
  h1Headline: string;    // หัวข้อ H1 (6-8 คำ)
  h2Subtitle: string;    // หัวข้อ H2 (4-6 คำ)
  speech: string;        // บทพูด (15-20 คำ)
  imagePrompt: string;   // Image prompt สำหรับ Veo/Imagen
  videoPrompt8: string;  // Video prompt 8 วินาที
  videoPrompt16: string; // Video prompt 16 วินาที
}
```

### แพลตฟอร์มที่รองรับ
- TikTok Shop
- Facebook
- YouTube

---

## ux-status-labels.md — Status Labels (จาก content.js, content-tiktok-platform.js, background.js)
ดู `CONTENT_CORE/06-ui-copy.js` — รวมไว้แล้ว
