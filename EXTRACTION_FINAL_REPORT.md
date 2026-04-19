# รายงานปิดงาน — Content Extraction
> วันที่: 16 เมษายน 2026
> Phase 0-4 เสร็จสมบูรณ์

---

## สถิติสรุป

| หมวด | จำนวนไฟล์/sub | ผลลัพธ์ |
|------|---------------|---------|
| `keep_full` | 2 | → CONTENT_CORE (copy ตรง) |
| `keep_partial` | 5 | → CONTENT_CORE (เก็บบางส่วน/เติมข้อมูล) |
| `inbox_scrap` | 4 รายการ | → CONTENT_INBOX (ops reference) |
| `drop_mechanics` | 18 ไฟล์ | ไม่นำมาใช้ |
| **ไฟล์ source ทั้งหมด** | **29** | - |
| **ไฟล์ output ที่สร้าง** | **7** | CONTENT_CORE × 6 + CONTENT_INBOX × 1 |

---

## ผลลัพธ์ CONTENT_CORE (6 ไฟล์)

### 01 — Forbidden Marketing Phrases
- **ที่มา**: `js/forbidden-words-list.js`
- **เนื้อหา**: ~200 วลีโฆษณาต้องห้าม ภาษาไทย + อังกฤษ
- **หมวดหลัก**: น้ำหนักลด, ผิว/ความขาว, การแพทย์, overclaim, scarcity, ช่องทางนอกระบบ
- **หมายเหตุ**: ตอนใช้งานต้องแยก placeholder ออก (yourshop/brandname/shopname)

### 02 — Master Prompt Template
- **ที่มา**: `js/promptTemplate.original.js`
- **เนื้อหา**: 17 ส่วน — Master prompt + 63 styles + 40 moods + 200 hooks + 50 visual styles + 8 scene templates + dialects/tones/locations/pacings/shooting styles + 8 prompt modes + 4 film modes + negative prompt + caption repair
- **มูลค่า**: สูงสุดในโปรเจกต์ — เป็น "สมอง" ของระบบสร้าง content ทั้งหมด

### 03 — Body Description Safe Rewrites ⭐ (ใหม่ทั้งหมด)
- **ที่มา**: Research จาก Google Imagen/Veo Responsible AI + TikTok Guidelines 2025
- **เนื้อหา**: 5 กลุ่ม — body shape (15 pattern), appearance adjectives (12), skin color (10), clothing exposure (10), hard remove (3)
- **หมายเหตุ**: Slot นี้ว่างใน extension ทั้งหมด ข้อมูลนี้สร้างใหม่ทั้งหมดจาก research จริง

### 04 — Google Flow Policy
- **ที่มา**: `sanitizePromptForFlow` ใน `js/content-googleflow.js` (logic จริง) + slot ว่างใน sidepanel.js (เติมแล้ว)
- **เนื้อหา**: Hard ban (violence/sex/vulgar), Audio soft replace (15 คู่), Layout ban (split-screen), Dialogue forbidden words
- **ฟังก์ชัน**: `sanitizePromptForFlow()`, `sanitizeDialogueForGoogleFlow()`

### 05 — Prompt Screening Spec
- **ที่มา**: `js/prompt-screening.js` (เฉพาะส่วน spec)
- **เนื้อหา**: ปรัชญา cost-saving screening, placeholder ที่ต้องเติม (VIOLENCE_AND_UNSAFE_EN / RISK_SNIPPETS / HARD_BAN_REGEXES), data model keys 9 รายการ, เงื่อนไข skip Gemini, model list

### 06 — UI Copy & Feature Names
- **ที่มา**: `sidepanel.html` + `content.js` + `content-tiktok-platform.js` + `background.js`
- **เนื้อหา**: 7 feature tabs, license screen copy, status messages, log types

---

## ผลลัพธ์ CONTENT_INBOX (1 ไฟล์)

### inbox-reference.md
- AI model config (Gemini/GPT model list + parameters)
- SOP Google Flow 13 ขั้นตอน *(note: เลข 13 = editorial summary; automation pipeline จริง = 17 steps — ดู `CONTENT_INBOX/sop-master.md`)*
- Data model TypeScript interface
- Notes เกี่ยวกับ UX status labels

---

## ข้อที่คนตัดสินใจ (Human Gate)

| # | คำถาม | คำตอบที่เลือก | ผลลัพธ์ |
|---|-------|--------------|---------|
| 1 | โครง 6 slot ว่างใน sidepanel.js — เก็บหรือ drop? | **A — เก็บ + เติมข้อมูล** | สร้าง `03-body-desc-safe-rewrites.js` และ `04-google-flow-policy.js` ที่สมบูรณ์ |
| 2 | SOP Google Flow 13 ขั้นตอน — เก็บ inbox หรือ drop? | **A — เก็บ inbox** | บันทึกใน `CONTENT_INBOX/inbox-reference.md` |

---

## สิ่งที่ยังต้องทำในขั้นต่อไป (Next Phase)

1. **เติม VIOLENCE_AND_UNSAFE_EN / RISK_SNIPPETS / HARD_BAN_REGEXES** ใน `05-prompt-screening-spec.js` — ต้องการ content team หรือ research เพิ่มเติม
2. **แยก placeholder** ออกจาก `01-forbidden-marketing-phrases.js` (yourshop/brandname/shopname/เฮ้ย)
3. **ทดสอบ** `sanitizeCharacterDesc()` ด้วย AI-generated character descriptions จริง
4. **นำ CONTENT_CORE ไปใช้** ในการพัฒนา Web App

---

> รายงานนี้สร้างโดย Phase 4 — Executor Report
> ระบบ Multi-Agent: Scout → Auditor → Analyst → Orchestrator → Executor → Report
