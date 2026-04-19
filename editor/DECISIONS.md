# DECISIONS.md — WebCodecs Video Editor v2

> Planning document สำหรับ Video Editor v2 — entry: `vdo edit v2/index.html` + `serve.py`
> อัปเดตล่าสุด: 2026-04-18

---

## 0. Project Structure

```
/vdo edit v2/
├── index.html              ← entry point (single HTML file)
├── src/
│   ├── engine/             ← Core processing (ไม่มี UI)
│   │   ├── demux.js        ← Module 1: Demuxer (mp4box.js)
│   │   ├── pipeline.js     ← Module 2+3: Decoder + Edit Layer + Encoder
│   │   ├── transcoder.js   ← MultiClipTranscoder
│   │   └── export.js       ← Module 5: ExportSession (mp4-muxer)
│   ├── ui/                 ← UI components
│   │   ├── upload.js       ← Step 1: Upload
│   │   ├── arrange.js      ← Step 2: Arrange (drag reorder)
│   │   ├── trim.js         ← Step 3: Trim (in/out point)
│   │   ├── caption.js      ← Step 4: Caption editor
│   │   ├── render.js       ← Step 5: Render progress
│   │   └── share.js        ← Step 6: Share / download
│   └── integration/        ← เชื่อม engine กับ UI
│       └── app.js          ← state management + step navigation
├── DECISIONS.md            ← ไฟล์นี้
└── serve.py                ← local dev server (ไม่ต้อง COOP/COEP)
```

---

## 1. Stack ที่เลือก และเหตุผล

### Stack: WebCodecs API + mp4box.js + mp4-muxer

| Library | บทบาท | เหตุผลที่เลือก |
|---|---|---|
| **WebCodecs API** | Decode/Encode video frames | Built-in Chrome, เข้าถึง GPU hardware encoder โดยตรง, เร็วกว่า FFmpeg.wasm 5-10x |
| **mp4box.js** | Demux MP4 input → samples | อ่าน track info, keyframe index (stss), edit list (elst), audio samples |
| **mp4-muxer** | Mux output → MP4 file | ออกแบบมาสำหรับ WebCodecs โดยเฉพาะ, API ง่าย, ~500KB |

### ทำไมไม่ใช้ FFmpeg.wasm (legacy FFmpeg UI ถอดออกแล้ว)

| ปัญหา FFmpeg.wasm | ผลกระทบ |
|---|---|
| ขนาด 30-40MB | โหลดครั้งแรกช้า |
| ต้องการ COOP/COEP headers | Deploy ยาก, ต้องมี custom server |
| ไม่รองรับ hardware GPU | Encode ช้า |
| มือถือ iPhone < 15 พัง | ตัด user กลุ่มใหญ่ออก |

### Target Platform

- **Chrome desktop เท่านั้น** — user ตัดต่อบน desktop แล้ว export ไปโพสต์บนมือถือ
- ไม่รองรับ Firefox, Safari, Edge, มือถือ (ทุกรุ่น)
- ไม่รองรับ Chrome บน iOS/Android (WKWebView / WebCodecs support ไม่สมบูรณ์)

### ข้อจำกัดของ Stack ที่เลือก

- Audio mixing ซับซ้อน (multiple tracks) ทำไม่ได้โดยตรง — ใช้ passthrough แทน
- WebCodecs ไม่ต้องการ COOP/COEP headers → deploy บน static hosting ได้เลย

---

## 2. User Flow: 6 Steps

```
Step 1: Upload   → drag & drop หลายไฟล์ (MP4)
Step 2: Arrange  → drag to reorder clips
Step 3: Trim     → in/out point per clip (snap to keyframe)
Step 4: Caption  → text + startSec + endSec + position (top/center/bottom)
Step 5: Render   → WebCodecs pipeline + progress bar + cancel
Step 6: Share    → download MP4 + เปิด platform (TikTok/IG/FB/YouTube)
```

---

## 3. Architecture: 5 Modules

### ภาพรวม Pipeline

```
[Input MP4]
    │
    ▼
[Module 1: Demuxer]  — mp4box.js  (src/engine/demux.js)
    │  video samples (EncodedVideoChunk-ready)
    │  audio samples (raw AAC)
    │  keyframe map, edit list, track info
    ▼
[Module 2: Decoder]  — VideoDecoder (WebCodecs)
    │  VideoFrame (raw pixels) + timestamp
    ▼
[Module 3: Edit Layer]            (src/engine/pipeline.js)
    │  Trim: ข้าม frame นอก [trimStart, trimEnd]
    │  Reorder: adjust timestamp += clipOffset
    │  Caption burn: Canvas 2D drawText ทับ VideoFrame
    ▼
[Module 4: Encoder]  — VideoEncoder (WebCodecs)
    │  EncodedVideoChunk (H.264)
    │  + Audio passthrough (ไม่ re-encode)
    ▼
[Module 5: Muxer]  — mp4-muxer    (src/engine/export.js)
    │
    ▼
[MP4 Blob → download]
```

### Module 1: Demuxer (`src/engine/demux.js`)

- ใช้ `mp4box.js` อ่าน MP4 → video samples + audio samples
- อ่าน `stss box` สำหรับ keyframe index map (binary search ตอน seek)
- อ่าน `elst box` (Edit List) สำหรับ audio start offset
- **onSamples ต้อง declare ภายใน onReady** (ดู issue A3)

### Module 2: Decoder (`src/engine/pipeline.js`)

- สร้าง `VideoDecoder` ใหม่ต่อคลิป (SPS/PPS อาจต่างกัน)
- Seek to keyframe ก่อน trimStart เสมอ แล้ว decode-and-discard จนถึง target
- Preview ใช้ `video.currentTime` (เบา) / Export ใช้ WebCodecs exact seek
- ต้อง `.close()` ทุก `VideoFrame` หลังใช้ — ป้องกัน memory leak

### Module 3: Edit Layer (`src/engine/pipeline.js`)

**Trim**:
- Preview: snap to nearest keyframe (เร็ว, ไม่ exact)
- Export: decode-to-target (แม่นยำ, ทำครั้งเดียว)

**Multi-clip timestamp offset**:
```javascript
// assumes constant fps (30fps) — user-generated clips จาก iPhone/Android
// ถ้ารองรับ VFR ในอนาคตต้องเปลี่ยนสูตรนี้
const frameDurUs = Math.round(1_000_000 / fps)       // fixed 1/30s
clipOffset[0]    = 0
clipOffset[n]    = _globalTimestampUs + frameDurUs   // หลัง clip[n-1] encode เสร็จ
output_ts        = frame.timestamp + clipOffset
```

**Caption burn**:
- ใช้ `OffscreenCanvas` + `ctx.drawImage` + `ctx.fillText`
- Caption data เป็น structured array (ดู issue C1):
  ```javascript
  captions: [{ startSec, endSec, text, position }]
  // position: 'top' | 'center' | 'bottom'
  ```
- Lookup ด้วย local timestamp ของแต่ละคลิป (ไม่ใช่ global)

### Module 4: Encoder (`src/engine/pipeline.js`)

**Config (default)**:
```javascript
{
  codec:                'avc1.4D401F',  // H.264 Main Profile 3.1
  width:                720,
  height:               1280,           // 9:16
  framerate:            30,
  bitrate:              3_000_000,      // 3 Mbps
  bitrateMode:          'variable',
  hardwareAcceleration: 'prefer-hardware',
}
```

**Backpressure thresholds**:
```javascript
ENCODE_QUEUE_PAUSE  = 8
ENCODE_QUEUE_RESUME = 3
DECODE_QUEUE_MAX    = 16
```

**Audio**: passthrough raw AAC samples — ไม่ re-encode

### Module 5: Muxer (`src/engine/export.js`)

- ใช้ `mp4-muxer` กับ `ArrayBufferTarget`
- `fastStart: 'in-memory'` — moov box อยู่ต้นไฟล์
- `finalize()` → `ArrayBuffer` → `Blob` → `URL.createObjectURL` → download
- Revoke URL หลัง 60 วินาที

---

## 4. Issues และวิธีแก้ที่ตกลงกันแล้ว

### กลุ่ม A: Audio

#### [A1] audioOffset คำนวณผิด unit — floating point error สะสม

**ปัญหา**: แปลง ticks → microseconds → ticks โดยไม่จำเป็น

```javascript
// ❌ เดิม
const trackDurUs = mdhd.duration / clipTs * 1_000_000
audioOffset += Math.round(trackDurUs / 1_000_000 * this.audioTimescale)

// ✅ ที่ตกลง — แปลงครั้งเดียว
if (clipTs === this.audioTimescale) {
  audioOffset += mdhd.duration  // ตรง ไม่มี float
} else {
  audioOffset += Math.round(mdhd.duration / clipTs * this.audioTimescale)
}
```

#### [A2] audioDecoderConfig ไม่ถูกส่งถ้า clip แรกไม่มี audio

**ปัญหา**: condition `i === 0 && s === clip.audioSamples[0]` พังถ้า clips[0] ไม่มี audio

**วิธีแก้**: ใช้ flag `audioConfigSent`
```javascript
let audioConfigSent = false  // declare ก่อน loop clips ทั้งหมด

for (const s of clip.audioSamples) {
  const needsMeta = !audioConfigSent && clip.audioDecoderConfig

  this._muxer.addAudioChunkRaw(
    s.data, 'key', timestampUs, durationUs,
    needsMeta
      ? { decoderConfig: { description: clip.audioDecoderConfig } }
      : undefined
  )

  if (needsMeta) audioConfigSent = true
}
```

**เหตุผลที่ไม่ใช้ `addTrack` alternative**: ยังไม่ได้ verify ว่า mp4-muxer version รองรับ

#### [A3] demuxClip — ใช้ `info` ก่อน declare (closure/timing bug)

**ปัญหา**: `mp4.onSamples` ถูก assign ก่อน `mp4.onReady` → `info` ยัง undefined

**วิธีแก้**: ย้าย `onSamples` ไว้ภายใน `onReady` + ใช้ track id map
```javascript
mp4.onReady = (info) => {
  const trackTypeMap = {}
  for (const t of info.videoTracks) trackTypeMap[t.id] = 'video'
  for (const t of info.audioTracks) trackTypeMap[t.id] = 'audio'

  mp4.onSamples = (id, user, sampleList) => {
    const type = trackTypeMap[id]
    if (type) samples[type].push(...sampleList)
  }

  for (const track of info.tracks) {
    mp4.setExtractionOptions(track.id, null, { nbSamples: Infinity })
  }
  mp4.start()
}
```

---

### กลุ่ม P: Pipeline

#### [P1] _waitForFrame ใช้ polling แทน event-driven

**ปัญหา**: `setTimeout(10ms)` อาจ miss frame หรือ resolve 2 ครั้ง

**วิธีแก้**: event-driven ผ่าน `_frameWake` resolver
```javascript
_waitForFrame() {
  if (this._frameQueue.length > 0) return Promise.resolve()
  return new Promise(r => { this._frameWake = r })
}
// decoder output: const wake = this._frameWake; this._frameWake = null; wake?.()
// cancel():       this._frameWake?.()  ← ปลด hang
```

#### [P2] _waitDrain race condition — processClip hang ตลอดไป

**ปัญหา**: frameQueue หมดก่อน drainResolve ถูก set

**วิธีแก้**: เช็ค queue ก่อน set resolver
```javascript
_waitDrain() {
  if (this._frameQueue.length === 0) return Promise.resolve()
  return new Promise(r => { this._drainResolve = r })
}
// cancel(): this._drainResolve?.()  ← ปลด hang
```

#### [P3] _burnCaption ไม่เช็ค closed state

**ปัญหา**: cancel() ขณะ burn → `drawImage` บน closed frame → DOMException

**วิธีแก้**: guard ต้น function + หลัง drawImage
```javascript
_burnCaption(frame, ...) {
  if (this._cancelled) { frame.close(); return null }
  ctx.drawImage(frame, ...)
  if (this._cancelled) { frame.close(); return null }
  // ... continue
}
// encode loop: if (!outputFrame) break
```

**cancel() ที่สมบูรณ์** ปลด hang ทั้ง 3 จุด:
```javascript
cancel() {
  this._cancelled = true
  this._frameWake?.()     // ปลด P1
  this._drainResolve?.()  // ปลด P2
  this._cleanup()         // ปิด encoder, clear queue, GC
}
```

---

### กลุ่ม C: Caption และ UX

#### [C1] captionsFn รับ global timestamp แทน local

**วิธีแก้**: structured Caption Track array per-clip
```javascript
captions: [
  { startSec: 0,   endSec: 2,   text: 'สวัสดี',         position: 'bottom' },
  { startSec: 2.5, endSec: 5.0, text: 'วันนี้มาสอน...', position: 'bottom' },
]

function getCaptionAt(captions, localSec) {
  return captions.find(c => localSec >= c.startSec && localSec < c.endSec) ?? null
}
```

**ข้อดีเพิ่ม**: serializable (save/load), แสดงใน timeline UI ได้

#### [C2] caption position hardcode ที่ height * 0.88 ทับ safe zone

**วิธีแก้**: per-caption `position` field + platform presets
```javascript
const CAPTION_Y = { top: 0.12, center: 0.50, bottom: 0.80 }
// default: 'bottom' = 0.80 (safe สำหรับ TikTok/Instagram/YouTube Shorts)
```

#### [C3] progress นับ clip แทน frame

**วิธีแก้**: duration-based progress อัปเดตทุก frame
```javascript
const totalDurationSec = clips.reduce((s, c) =>
  s + ((c.trimEnd ?? c.durationSec) - (c.trimStart ?? 0)), 0)

// อัปเดตใน encode loop ทุก frame
onProgress(this._globalTimestampUs / 1_000_000 / totalDurationSec)
```

---

## 5. สิ่งที่ยังไม่ได้ทำ

| รายการ | หมายเหตุ |
|---|---|
| ยังไม่มีไฟล์ code แม้แต่ไฟล์เดียว | ทุกอย่างยังเป็น design/planning |
| `src/engine/demux.js` | Module 1 |
| `src/engine/pipeline.js` | Module 2+3+4 |
| `src/engine/transcoder.js` | MultiClipTranscoder |
| `src/engine/export.js` | Module 5 + ExportSession |
| `src/ui/` ทุกไฟล์ | Steps 1-6 UI |
| `src/integration/app.js` | State + step navigation |
| `index.html` | Entry point |
| `serve.py` | Local dev server |
| Thumbnail strip generator | Preview ขณะลาก trim handle |
| Project save/load | Caption track serialization |
| Export presets | TikTok / Instagram / YouTube |
| Error handling | Codec not supported fallback |

---

## 6. สิ่งที่ห้ามเปลี่ยนโดยไม่แจ้ง

| ข้อห้าม | เหตุผล |
|---|---|
| **ห้ามเปลี่ยน Stack** จาก WebCodecs+mp4box.js+mp4-muxer | ทุก module ออกแบบมารองรับ stack นี้ |
| **ห้ามใช้ FFmpeg.wasm** | เป็นเหตุผลหลักที่สร้างใหม่ |
| **ห้าม re-encode audio** | passthrough เท่านั้น |
| **ห้าม recreate VideoEncoder** ระหว่างคลิป | ต้องใช้ encoder เดียวตลอด |
| **ห้ามใช้ global timestamp** ใน caption | ใช้ Caption Track + local timestamp |
| **ห้ามใช้ height * 0.88** สำหรับ caption Y | ใช้ 0.80 เป็น default |
| **ห้ามเพิ่ม server-side processing** | ทุกอย่างต้องรันใน browser |
| **ถ้าเจอ issue ใหม่ระหว่างแก้** ต้องแจ้งก่อน | อย่าแก้เองโดยไม่บอก |

---

## 7. ลำดับการพัฒนา

```
Phase 1: Core Engine (ไม่มี UI)
  1. src/engine/demux.js        — demuxClip() แก้ A3 ทันที
  2. src/engine/pipeline.js     — TranscodePipeline แก้ P1-P3
  3. src/engine/transcoder.js   — MultiClipTranscoder timestamp offset
  4. src/engine/export.js       — ExportSession + audio passthrough แก้ A1-A2
  5. Caption Track structure    — แก้ C1-C2-C3

Phase 2: UI
  6. index.html skeleton + step navigation
  7. src/ui/upload.js           — Step 1: drag & drop
  8. src/ui/arrange.js          — Step 2: drag reorder
  9. src/ui/trim.js             — Step 3: in/out + thumbnail strip
  10. src/ui/caption.js         — Step 4: caption editor
  11. src/ui/render.js          — Step 5: progress + cancel
  12. src/ui/share.js           — Step 6: download + platform

Phase 3: Polish
  13. Export presets (TikTok / Instagram / YouTube)
  14. Project save/load
  15. Error handling + codec fallback
  16. serve.py + deploy config (static hosting)
```
