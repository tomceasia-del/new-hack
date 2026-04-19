# 📱 1CLICK AUTOMATIC SYSTEM — Web/Mobile App Specification

> **Version:** 3.40 (Based on Chrome Extension Analysis)  
> **Date:** April 2026  
> **Purpose:** Spec สำหรับทีม Web/Mobile ในการพัฒนา App ที่ดีกว่า Extension

---

## 📋 สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [สถาปัตยกรรม](#2-สถาปัตยกรรม)
3. [ระบบ License](#3-ระบบ-license)
4. [ระบบ AI Content Generation](#4-ระบบ-ai-content-generation)
5. [การเชื่อมต่อ Platform](#5-การเชื่อมต่อ-platform)
6. [Google Flow Integration](#6-google-flow-integration)
7. [Data Models](#7-data-models)
8. [API Endpoints](#8-api-endpoints)
9. [UI Components](#9-ui-components)
10. [ข้อจำกัดของ Extension ที่ App ควรแก้ไข](#10-ข้อจำกัดของ-extension-ที่-app-ควรแก้ไข)
11. [Security Considerations](#11-security-considerations)
12. [Recommendations สำหรับ Mobile App](#12-recommendations-สำหรับ-mobile-app)

---

## 1. ภาพรวมระบบ

### 1.1 วัตถุประสงค์
ระบบ **1CLICK AUTOMATIC SYSTEM** เป็นเครื่องมือสร้างคอนเทนต์วิดีโอสั้นอัตโนมัติ (TikTok, Facebook Reels, YouTube Shorts) โดยใช้ AI สำหรับ:

- สร้าง Script/Storyboard จาก AI (OpenAI GPT-4 / Google Gemini)
- สร้างภาพและวิดีโอผ่าน Google Labs Flow
- โพสต์อัตโนมัติไปยัง Social Platforms
- จัดการ Queue สำหรับโพสต์หลายรายการ

### 1.2 Core Features

| Feature | คำอธิบาย |
|---------|----------|
| **AI Script Generator** | สร้างบทพูด/Storyboard จากข้อมูลสินค้า |
| **Auto Post Pipeline** | อัปโหลด+โพสต์วิดีโอไปยัง TikTok/FB/YT อัตโนมัติ |
| **Product Scraper** | ดึงข้อมูลสินค้าจาก TikTok Affiliate |
| **Video Extend** | ต่อความยาววิดีโอจาก 8 วินาที เป็น 16 วินาที |
| **Multi-Platform Queue** | จัดคิวโพสต์หลาย platform พร้อมกัน |
| **License Management** | ระบบ License Key รองรับ 4 devices/license |

### 1.3 Supported Platforms

- **TikTok** — affiliate.tiktok.com, seller.tiktok.com
- **Facebook** — www.facebook.com, business.facebook.com  
- **YouTube** — studio.youtube.com
- **Google Flow** — labs.google/fx/tools/flow (Video Generation)

---

## 2. สถาปัตยกรรม

### 2.1 Current Extension Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  SidePanel   │  │  Background  │  │ Content Scripts  │  │
│  │  (Main UI)   │  │   Worker     │  │ (Per Platform)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                │                    │            │
│         └────────────────┼────────────────────┘            │
│                          │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              chrome.storage.local                     │  │
│  │              chrome.runtime.sendMessage               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
├─────────────────────────────────────────────────────────────┤
│  Firebase Realtime DB  │  OpenAI API  │  Google Gemini API  │
│  (License System)      │  (GPT-4)     │  (2.5 Flash/Pro)    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Proposed Mobile/Web Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile/Web App                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   React /    │  │   Backend    │  │   WebView /      │  │
│  │  React Native│  │   API Server │  │   Browser Auto   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                │                    │            │
│         └────────────────┼────────────────────┘            │
│                          │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Local Storage / SQLite                   │  │
│  │              + Cloud Sync (Firebase/Supabase)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. ระบบ License

### 3.1 License Data Model

```typescript
interface License {
  licenseKey: string;        // Format: XXXX-XXXX-XXXX-XXXX
  expiresAt?: string;        // ISO date หรือ null = ไม่จำกัด
  disabled: boolean;
  devices: {
    [deviceId: string]: {
      registeredAt: string;  // ISO date
      lastSeen: string;      // ISO date
      userAgent: string;     // First 100 chars
    }
  };
}
```

### 3.2 License Validation Flow

```
1. User กรอก License Key
      │
      ▼
2. ส่ง request ไป Firebase: /licenses/{KEY}.json
      │
      ▼
3. ตรวจสอบ:
   - License exists? → ไม่พบ = "License Key ไม่ถูกต้อง"
   - expiresAt < now? → "License Key หมดอายุแล้ว"
   - disabled = true? → "License Key ถูกระงับการใช้งาน"
   - devices >= 4? → "ใช้งานครบ 4 โปรไฟล์แล้ว"
      │
      ▼
4. ลงทะเบียน Device ใหม่ (ถ้ายังไม่มี)
   PUT /licenses/{KEY}/devices/{deviceId}.json
      │
      ▼
5. บันทึก License + HMAC signature ลง Local Storage
```

### 3.3 Security: HMAC Signature

Extension ใช้ HMAC signature ป้องกันการปลอม license ใน storage:

```javascript
// Secret key (XOR encoded)
const _hs = "Lic_S1gn_K3y_2026";

// Sign function (FNV-1a hash)
function _sign(licenseKey, deviceId) {
  const data = licenseKey + '|' + deviceId + '|' + this._hs;
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
```

**สำหรับ Mobile App:** ควรใช้ HMAC-SHA256 แทน และเก็บ secret ใน secure storage

### 3.4 Firebase Configuration (✅ Decoded)

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAU2sHCYyC9jTJMw41HzCX6USaNvcx6MEM",
  authDomain: "oneclick-admin-2026-841a8.firebaseapp.com",
  databaseURL: "https://oneclick-admin-2026-841a8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "oneclick-admin-2026-841a8",
  storageBucket: "oneclick-admin-2026-841a8.firebasestorage.app",
  messagingSenderId: "795789916740",
  appId: "1:795789916740:web:edd75421fe8d27e2449a11",
  measurementId: "G-GSFBJ5GH2R"
};

const FIREBASE_DB_URL = "https://oneclick-admin-2026-841a8-default-rtdb.asia-southeast1.firebasedatabase.app";
```

### 3.5 HMAC License Signature (✅ Decoded)

```javascript
// Secret key สำหรับ sign license data
const HMAC_SECRET = "Lic_S1gn_K3y_2026";

// Sign function (FNV-1a hash algorithm)
function signLicense(licenseKey, deviceId) {
  const data = licenseKey + '|' + deviceId + '|' + HMAC_SECRET;
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return (hash >>> 0).toString(36); // Convert to base36
}

// Verify function
function verifyLicense(licenseKey, deviceId, signature) {
  return signLicense(licenseKey, deviceId) === signature;
}
```

**⚠️ Security Note สำหรับ Production:**
- ควรเปลี่ยน HMAC_SECRET เป็นค่าใหม่ที่ยาวกว่า (32+ chars)
- ควรใช้ HMAC-SHA256 แทน FNV-1a สำหรับความปลอดภัยที่ดีกว่า
- ควรเก็บ secret ใน environment variables ไม่ใช่ในโค้ด

---

## 4. ระบบ AI Content Generation

### 4.1 AI Providers

| Provider | Model | Max Tokens | Use Case |
|----------|-------|------------|----------|
| OpenAI | gpt-4-turbo-preview | 16,000 | หลัก |
| Google | gemini-2.5-flash | 16,384 | Fallback |
| Google | gemini-2.0-flash | 16,384 | Fallback 2 |
| Google | gemini-2.5-pro | 16,384 | Fallback 3 |

### 4.2 Gemini Fallback System

```javascript
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];

async function fetchGeminiWithFallback(apiKey, requestBody) {
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', body: JSON.stringify(body) }
      );
      
      if (response.status === 429) continue; // Rate limited → try next
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      return await response.json();
    } catch (err) {
      if (err.message.includes('429') || err.message.includes('rate')) continue;
      throw err;
    }
  }
  throw new Error('All Gemini models rate limited');
}
```

### 4.3 Safety Settings (Gemini)

```javascript
safetySettings: [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
]
```

### 4.4 Master Prompt Structure

System prompt (`ADAPTIVE_VIDEO_DIRECTOR_PROMPT`) มีโครงสร้าง:

1. **Platform Modes** — Flow (8s), Grok (6s), Super Grok (10s)
2. **System Override Rules** — Safety, no trademarks, anatomy lock
3. **Forbidden Words (Overclaim)** — คำต้องห้ามทางการตลาด
4. **Viral Intelligence** — Pattern interrupt, shoppertainment
5. **Hook Master AI** — 200 hook templates แบ่ง 4 หมวด
6. **Dialogue Rules** — TTS-safe, natural language
7. **Output Format** — Storyboard structure

**ความยาว prompt:** ~15,000+ characters

### 4.5 Content Screening

ระบบกรอง prompt ก่อนส่งไป AI:

```javascript
// Forbidden words list
const FORBIDDEN_WORDS = [
  // Overclaim
  '100%', 'การันตี', 'รับประกันผล', 'Best', 'No.1',
  // Medical claims  
  'รักษาโรค', 'บำบัด', 'ฆ่าเชื้อ', 'ต้านมะเร็ง', 'FDA Approved',
  // Pressure tactics
  'ช้าคืออด', 'วันนี้วันเดียว', 'จำกัดสิทธิ์'
];

function screenPrompt(text) {
  for (const word of FORBIDDEN_WORDS) {
    if (text.includes(word)) {
      return { blocked: true, word };
    }
  }
  return { blocked: false };
}
```

---

## 5. การเชื่อมต่อ Platform

### 5.1 TikTok Upload Flow

```
1. Extension เปิด tabs ไปที่ TikTok Upload page
      │
      ▼
2. Content script ตรวจจับ platformPostData จาก storage
      │
      ▼
3. Upload Video:
   - Method 1: File input[type="file"][accept*="video"]
   - Method 2: Any file input
   - Method 3: Drag & Drop
      │
      ▼
4. Set Caption (contenteditable editor)
      │
      ▼
5. Add Product Link (ปักตะกร้า):
   - คลิก "Add product link" button
   - ใส่ Product ID
   - เลือก CTA
      │
      ▼
6. Schedule (Now / Scheduled)
      │
      ▼
7. Enable "AI-generated content" toggle
      │
      ▼
8. Click Post/Schedule button
```

### 5.2 Platform Post Data Model

```typescript
interface PlatformPostData {
  platform: 'tiktok' | 'facebook' | 'youtube';
  videoBlob: string;         // Base64 encoded video
  caption: string;
  title?: string;            // YouTube only
  productId?: string;        // TikTok only
  cta?: string;              // TikTok CTA text
  scheduleType: 'now' | 'scheduled';
  scheduleTime?: string;     // ISO date
  timestamp: number;         // Prevent stale data (>5 min)
}
```

### 5.3 Platform-Specific Selectors

#### TikTok
```javascript
// File input
'input[type="file"][accept*="video"]'

// Caption editor (Slate.js)
'[data-slate-editor="true"]'

// Schedule radio
'input[name="platform-schedule"]'

// Post button
'div[class*="Button__content--type-primary"]'
```

#### Facebook
```javascript
// Caption editor
'[contenteditable="true"][role="textbox"]'
'[contenteditable="true"][data-lexical-editor]'

// Schedule option
'span, div, label' containing 'schedule' or 'ตั้งเวลา'
```

#### YouTube
```javascript
// Title/Description
'div[id="textbox"][contenteditable="true"]'

// Next button
'#next-button, ytcp-button#next-button'

// Schedule radio
'tp-yt-paper-radio-button' containing 'Schedule'
```

---

## 6. Google Flow Integration

### 6.1 Google Flow คืออะไร

Google Labs Flow (labs.google/fx/tools/flow) เป็น AI tool สำหรับสร้างภาพและวิดีโอ ระบบใช้สำหรับ:

1. สร้างภาพจาก prompt (Image Generation)
2. แปลงภาพเป็นวิดีโอ (Image to Video)
3. ต่อวิดีโอให้ยาวขึ้น (Video Extend)

### 6.2 Autopost Pipeline Steps

```
Step 1:  New Project → คลิกปุ่มสร้าง project ใหม่
Step 2:  Select Mode → เลือก Image/Portrait/x1
Step 3:  Upload Image → อัปโหลดรูปสินค้า
Step 4:  Add to Prompt → Hover รูป + คลิก "Add to prompt"
Step 5:  Paste Prompt → วาง Image Prompt
Step 6:  Generate → คลิกปุ่ม Generate
Step 7:  Wait Image → รอ ~30-60s
Step 8:  Add to Video → คลิก "Add to video prompt"
Step 9:  Paste Video → วาง Video Prompt
Step 10: Select Video → เลือก Video tab + frames
Step 11: Wait Video → รอ ~2-5 นาที
Step 12: Download → ดาวน์โหลดวิดีโอ
Step 13: Extend (optional) → คลิกวิดีโอเพื่อต่อความยาว
```

### 6.3 Video Download Capture

Extension ใช้ chrome.downloads API จับวิดีโอที่ดาวน์โหลดจาก Google Flow:

```javascript
chrome.downloads.onCreated.addListener((item) => {
  const isBlob = item.url.startsWith('blob:');
  const isFromFlow = item.url.includes('labs.google') || 
                     item.url.includes('googleapis.com');
  const isVideo = item.mime.includes('video');
  
  if (isBlob || isFromFlow || isVideo) {
    pendingVideoDownloadIds.add(item.id);
  }
});

chrome.downloads.onChanged.addListener(async (delta) => {
  if (delta.state?.current === 'complete') {
    // Read file via offscreen document
    // Convert to base64
  }
});
```

### 6.4 Slate Editor Paste (Google Flow)

Google Flow ใช้ Slate.js editor ซึ่งต้อง handle พิเศษ:

```javascript
// Method 1: Find Slate editor via React Fiber
const fiberKey = Object.keys(editorEl).find(k =>
  k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
);
const slateEditor = /* traverse fiber to find editor */;

// Method 2: Clear existing content
slateEditor.selection = { 
  anchor: { path: [0, 0], offset: 0 }, 
  focus: { path: [lastIdx, 0], offset: lastTextLen } 
};
slateEditor.deleteFragment();

// Method 3: Insert new text
slateEditor.insertText(promptText);

// Method 4: Fallback - DOM manipulation
editorEl.textContent = '';
editorEl.dispatchEvent(new InputEvent('beforeinput', {
  inputType: 'insertFromPaste',
  data: null,
  dataTransfer: dt
}));
```

---

## 7. Data Models

### 7.1 Product Queue Item

```typescript
interface ProductQueueItem {
  id: string;
  productId: string;
  name: string;
  image?: string;
  price?: string;
  
  // Generated content
  imagePrompt?: string;
  videoPrompt?: string;
  videoPromptExtend?: string;
  dialogue?: string;
  headline?: string;
  
  // Settings
  clipDuration: 8 | 16;
  artStyle?: string;
  characterDesc?: string;
  backgroundDesc?: string;
  voiceType?: string;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'posted';
  retryCount?: number;
  error?: string;
  
  // Timestamps
  createdAt: string;
  processedAt?: string;
  postedAt?: string;
}
```

### 7.2 Flow Status

```typescript
type FlowStatus = 
  | 'idle'
  | 'running'
  | 'stopped'
  | 'skipped'
  | 'flow_error'
  | 'v2_video_saved'
  | 'v2_extend_done'
  | 'completed_download';
```

### 7.3 Template

```typescript
interface Template {
  id: string;
  name: string;
  category: 'general' | 'beauty' | 'tech' | 'food' | 'fashion';
  prompt: string;
  createdAt: string;
}
```

### 7.4 Dashboard Stats

```typescript
interface DashboardStats {
  total: number;
  success: number;
  failed: number;
  byPlatform: {
    tiktok: { success: number; failed: number };
    facebook: { success: number; failed: number };
    youtube: { success: number; failed: number };
  };
  history: Array<{
    name: string;
    status: 'success' | 'failed';
    platform: string;
    type: string;
    time: string;
  }>;
}
```

---

## 8. API Endpoints

### 8.1 Firebase Realtime Database

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/licenses/{key}.json` | GET | ดึงข้อมูล License |
| `/licenses/{key}/devices/{deviceId}.json` | PUT | ลงทะเบียน Device |
| `/licenses/{key}/devices/{deviceId}/lastSeen.json` | PUT | อัปเดต lastSeen |
| `/licenses/{key}/devices/{deviceId}.json` | DELETE | ลบ Device |

### 8.2 OpenAI API

```
POST https://api.openai.com/v1/chat/completions
Headers:
  Authorization: Bearer {API_KEY}
  Content-Type: application/json

Body:
{
  "model": "gpt-4-turbo-preview",
  "messages": [
    { "role": "system", "content": "{MASTER_PROMPT}" },
    { "role": "user", "content": "{USER_INPUT}" }
  ],
  "max_tokens": 16000,
  "temperature": 0.7
}
```

### 8.3 Google Gemini API

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}
Headers:
  Content-Type: application/json

Body:
{
  "contents": [{
    "parts": [{ "text": "{PROMPT}" }]
  }],
  "generationConfig": {
    "maxOutputTokens": 16384,
    "temperature": 0.7
  },
  "safetySettings": [...]
}
```

---

## 9. UI Components

### 9.1 Main Tabs

| Tab | Purpose |
|-----|---------|
| **Auto Post** | Pipeline หลัก: scrape → generate → post |
| **Storymode** | สร้าง multi-scene storyboard |
| **Studio** | Playground ทดลอง prompt |
| **Platform** | Queue โพสต์หลาย platform |
| **Templates** | บันทึก/เรียกใช้ prompt templates |
| **Dashboard** | สถิติการใช้งาน |
| **Settings** | API keys, preferences |

### 9.2 License Screen

```
┌─────────────────────────────────────────┐
│         1CLICK AUTOMATIC SYSTEM         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ XXXX-XXXX-XXXX-XXXX            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Device ID: device_17xxx...            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        เปิดใช้งาน               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📱 จัดการอุปกรณ์ที่ลงทะเบียน          │
│                                         │
└─────────────────────────────────────────┘
```

### 9.3 Auto Post Queue

```
┌─────────────────────────────────────────┐
│  🔍 ค้นหาสินค้า...                      │
├─────────────────────────────────────────┤
│  ┌─────┐ สินค้า A                      │
│  │ img │ ราคา: ฿299                    │
│  └─────┘ Status: ✅ Completed          │
│                                         │
│  ┌─────┐ สินค้า B                      │
│  │ img │ ราคา: ฿199                    │
│  └─────┘ Status: ⏳ Processing         │
│                                         │
│  ┌─────┐ สินค้า C                      │
│  │ img │ ราคา: ฿599                    │
│  └─────┘ Status: ⏸️ Pending            │
├─────────────────────────────────────────┤
│ [▶️ Run] [⏹️ Stop] [⏭️ Skip] [🗑️ Clear] │
└─────────────────────────────────────────┘
```

---

## 10. ข้อจำกัดของ Extension ที่ App ควรแก้ไข

### 10.1 Technical Limitations

| ปัญหา | สาเหตุ | แนวทางแก้ไขใน App |
|-------|--------|-------------------|
| **ต้องเปิด Chrome ตลอด** | Extension ทำงานใน browser | Backend server ทำงานแทน |
| **Content script ถูก block** | Website security | ใช้ official API (TikTok Open API) |
| **Service Worker timeout** | Chrome MV3 limitation | Persistent backend service |
| **Memory leak จาก video base64** | เก็บใน RAM | Stream/chunk upload |
| **Rate limit ต่อ user** | API key ต่อ user | Centralized API key management |

### 10.2 UX Limitations

| ปัญหา | แนวทางแก้ไข |
|-------|------------|
| Side panel เล็ก | Full-screen mobile UI |
| ต้อง manual login ทุก platform | OAuth integration |
| ไม่มี push notification | FCM/APNs notification |
| ไม่มี offline mode | Local queue + sync |
| ไม่มี collaboration | Multi-user workspace |

### 10.3 Security Improvements Needed

1. **API Keys:** ไม่ควรเก็บใน client → ย้ายไป backend
2. **Firebase Rules:** ปัจจุบัน public read → ต้องมี auth
3. **HMAC Secret:** Hardcoded → ใช้ secure key management
4. **License Check:** Client-side → Server-side validation

---

## 11. Security Considerations

### 11.1 Current Vulnerabilities (✅ แกะได้หมดแล้ว)

```
✅ Firebase config — decoded แล้ว (Section 3.4)
✅ HMAC secret — decoded แล้ว (Section 3.5)
⚠️ License validation ทำใน client (สามารถ bypass ได้)
⚠️ API keys เก็บใน chrome.storage.local
```

**สิ่งที่ทีม Mobile/Web ต้องทำ:**
1. ใช้ Firebase config จาก Section 3.4 ได้เลย
2. Implement HMAC sign/verify ตาม Section 3.5
3. ย้าย license validation ไป server-side
4. สร้าง backend เก็บ API keys แทน client

### 11.2 Recommended Security Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Mobile     │     │   Backend    │     │   External   │
│     App      │────▶│    Server    │────▶│    APIs      │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       │  Auth Token        │  API Keys (secure)
       │                    │  License Validation
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│   Firebase   │     │   Database   │
│   Auth       │     │   (Secure)   │
└──────────────┘     └──────────────┘
```

### 11.3 Implementation Checklist

- [ ] Implement proper authentication (Firebase Auth/Auth0)
- [ ] Move API keys to backend environment variables
- [ ] Server-side license validation
- [ ] Rate limiting per user
- [ ] Input sanitization for prompts
- [ ] Secure storage for sensitive data

---

## 12. Recommendations สำหรับ Mobile App

### 12.1 Tech Stack Recommendations

| Layer | Recommendation | Reason |
|-------|----------------|--------|
| **Frontend** | React Native / Flutter | Cross-platform, native performance |
| **Backend** | Node.js + Express / Fastify | Same language as extension |
| **Database** | PostgreSQL + Redis | Relational + caching |
| **Auth** | Firebase Auth / Auth0 | Proven, secure |
| **Storage** | S3 / Firebase Storage | Video storage |
| **Queue** | Bull / BullMQ | Job queue for auto-post |

### 12.2 Feature Prioritization

**Phase 1 (MVP):**
- [ ] User authentication
- [ ] License validation (server-side)
- [ ] AI script generation (Gemini)
- [ ] Manual video upload + post

**Phase 2:**
- [ ] TikTok Open API integration
- [ ] Auto-post queue
- [ ] Push notifications
- [ ] Templates

**Phase 3:**
- [ ] Multi-platform support (FB, YT)
- [ ] Video generation (partner with video API)
- [ ] Analytics dashboard
- [ ] Team collaboration

### 12.3 Platform API Integration

| Platform | API | Features |
|----------|-----|----------|
| **TikTok** | TikTok Content Posting API | Video upload, scheduling |
| **Facebook** | Graph API | Reels upload, insights |
| **YouTube** | YouTube Data API v3 | Video upload, metadata |

### 12.4 Mobile-Specific Features

1. **Camera Integration** — ถ่ายสินค้าแล้ว generate content ทันที
2. **Voice Input** — พูดคำอธิบายสินค้าแทนพิมพ์
3. **AR Preview** — ดูตัวอย่าง overlay บนสินค้าจริง
4. **Share Extension** — Share จาก TikTok app เข้า 1CLICK
5. **Widget** — Quick action จาก home screen

### 12.5 Monetization Opportunities

- **Subscription Tiers:** Basic / Pro / Enterprise
- **Usage-Based:** Credit system per video generated
- **White-Label:** ขายระบบให้ agency
- **Marketplace:** Template marketplace

---

## 📎 Appendix

### A. File Structure ของ Extension

```
1click-full-v3_40/
├── manifest.json
├── sidepanel.html
├── offscreen.html
├── css/
│   └── sidepanel.css
├── js/
│   ├── api.js                    # AI API calls
│   ├── background.js             # Service worker
│   ├── sidepanel.js              # Main UI (14,000+ lines)
│   ├── license-service.js        # License management
│   ├── firebase-config.js        # Firebase (encoded)
│   ├── promptTemplate.js         # Master prompt
│   ├── prompt-screening.js       # Content filter
│   ├── forbidden-words-list.js   # Banned words
│   ├── content.js                # TikTok Affiliate scraper
│   ├── content-tiktok-platform.js # TikTok upload
│   ├── content-facebook.js       # Facebook upload
│   ├── content-youtube.js        # YouTube upload
│   ├── content-googleflow.js     # Google Flow automation
│   ├── tiktok-click-helper.js    # DOM click helpers
│   ├── intercept-blob.js         # Blob URL interceptor
│   └── offscreen.js              # File reading
├── images/
│   ├── Logo.png
│   └── logo.svg
└── icons/
    └── icon.png
```

### B. Chrome Permissions Required

```json
{
  "permissions": [
    "storage",           // Local data
    "unlimitedStorage",  // Large video files
    "sidePanel",         // Side panel UI
    "activeTab",         // Current tab access
    "scripting",         // Inject scripts
    "tabs",              // Tab management
    "downloads",         // Capture downloads
    "offscreen",         // Read files
    "debugger",          // Advanced automation
    "browsingData",      // Clear cache
    "alarms"             // Keep alive
  ]
}
```

### C. Key Constants

```javascript
// Clip durations
const CLIP_DURATIONS = [8, 16]; // seconds

// Max devices per license
const MAX_DEVICES = 4;

// Stale data timeout
const STALE_DATA_TIMEOUT = 300000; // 5 minutes

// Video auto-clear timeout
const VIDEO_CLEAR_TIMEOUT = 180000; // 3 minutes

// Download pending clear timeout
const DOWNLOAD_CLEAR_TIMEOUT = 300000; // 5 minutes
```

---

**Document Prepared By:** Claude AI  
**Based On:** 1CLICK AUTOMATIC SYSTEM v3.40 Chrome Extension Analysis  
**For:** Web/Mobile Development Team

---

## ✅ สถานะการแกะโค้ด

| รายการ | สถานะ |
|--------|--------|
| Firebase Config | ✅ Decoded ครบ |
| HMAC Secret | ✅ Decoded ครบ |
| License System | ✅ เข้าใจ flow ทั้งหมด |
| AI Prompts | ✅ ได้ Master Prompt ครบ |
| Platform Integration | ✅ ได้ selectors และ flow |
| Google Flow Automation | ✅ ได้ทุก step |

**ทีม Web/Mobile สามารถเริ่มพัฒนาได้ทันที โดยไม่ต้องรบกวนทีม Extension!**
