# DECISIONS.md — WebCodecs Video Editor

> Planning document สำหรับ WebCodecs editor ที่จะสร้างใหม่ทั้งหมด
> อัปเดตล่าสุด: 2026-04-18

---

## 1. Stack ที่เลือก และเหตุผล

### Stack: WebCodecs API + mp4box.js + mp4-muxer

| Library | บทบาท | เหตุผลที่เลือก |
|---|---|---|
| **WebCodecs API** | Decode/Encode video frames | Built-in Chrome, เข้าถึง GPU hardware encoder โดยตรง, เร็วกว่า FFmpeg.wasm 5-10x |
| **mp4box.js** | Demux MP4 input → samples | อ่าน track info, keyframe index (stss), edit list (elst), audio samples |
| **mp4-muxer** | Mux output → MP4 file | ออกแบบมาสำหรับ WebCodecs โดยเฉพาะ, API ง่าย, ~500KB |

### ทำไมไม่ใช้ FFmpeg.wasm (UI เดิมที่เคยใช้ FFmpeg.wasm — ถอดออกแล้ว)

| ปัญหา FFmpeg.wasm | ผลกระทบ |
|---|---|
| ขนาด 30-40MB | โหลดครั้งแรกช้า |
| ต้องการ COOP/COEP headers | Deploy ยาก, ต้องมี custom server |
| ไม่รองรับ hardware GPU | Encode ช้า, มือถือ crash |
| มือถือ iPhone < 15 พัง | ตัด user กลุ่มใหญ่ออก |

### Target Platform

- **Chrome desktop เท่านั้น** — user ตัดต่อบน desktop แล้ว export ไปโพสต์บนมือถือ
- ไม่รองรับ Firefox, Safari, Edge, มือถือ (ทุกรุ่น)
- ไม่รองรับ Chrome บน iOS/Android (WKWebView / WebCodecs support ไม่สมบูรณ์)

### ข้อจำกัดของ Stack ที่เลือก

- Audio mixing ซับซ้อน (multiple tracks) ทำไม่ได้โดยตรง — ใช้ passthrough แทน

---

## 2. Architecture: 5 Modules

### ภาพรวม Pipeline

```
[Input MP4]
    │
    ▼
[Module 1: Demuxer]  — mp4box.js
    │  video samples (EncodedVideoChunk-ready)
    │  audio samples (raw AAC)
    │  keyframe map, edit list, track info
    ▼
[Module 2: Decoder]  — VideoDecoder (WebCodecs)
    │  VideoFrame (raw pixels) + timestamp
    ▼
[Module 3: Edit Layer]
    │  Trim: ข้าม frame นอก [trimStart, trimEnd]
    │  Reorder: adjust timestamp += clipOffset
    │  Caption burn: Canvas 2D drawText ทับ VideoFrame
    ▼
[Module 4: Encoder]  — VideoEncoder (WebCodecs)
    │  EncodedVideoChunk (H.264)
    │  + Audio passthrough (ไม่ re-encode)
    ▼
[Module 5: Muxer]  — mp4-muxer
    │
    ▼
[MP4 Blob → download]
```

### Module 1: Demuxer

- ใช้ `mp4box.js` อ่าน MP4 → video samples + audio samples
- อ่าน `stss box` สำหรับ keyframe index map (binary search ตอน seek)
- อ่าน `elst box` (Edit List) สำหรับ audio start offset
- **onSamples ต้อง declare ภายใน onReady** (ดู issue A3)

### Module 2: Decoder

- สร้าง `VideoDecoder` ใหม่ต่อคลิป (SPS/PPS อาจต่างกัน)
- Seek to keyframe ก่อน trimStart เสมอ แล้ว decode-and-discard จนถึง target
- Preview ใช้ `video.currentTime` (เบา) / Export ใช้ WebCodecs exact seek
- ต้อง `.close()` ทุก `VideoFrame` หลังใช้ — ป้องกัน memory leak

### Module 3: Edit Layer

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
  ```
- Lookup ด้วย local timestamp ของแต่ละคลิป (ไม่ใช่ global)

### Module 4: Encoder

**Config มือถือ (default)**:
```javascript
{
  codec:               'avc1.4D401F',  // H.264 Main Profile 3.1
  width:               720,
  height:              1280,           // 9:16
  framerate:           30,
  bitrate:             3_000_000,      // 3 Mbps
  bitrateMode:         'variable',
  hardwareAcceleration: 'prefer-hardware',
}
```

**Backpressure thresholds (RAM 4-6GB)**:
```javascript
ENCODE_QUEUE_PAUSE  = 8
ENCODE_QUEUE_RESUME = 3
DECODE_QUEUE_MAX    = 16
```

**Audio**: passthrough raw AAC samples — ไม่ re-encode

### Module 5: Muxer

- ใช้ `mp4-muxer` (npm) กับ `ArrayBufferTarget`
- `fastStart: 'in-memory'` — moov box อยู่ต้นไฟล์
- `finalize()` → `ArrayBuffer` → `Blob` → `URL.createObjectURL` → download
- Revoke URL หลัง 60 วินาที

---

## 3. Issues ที่พบและวิธีแก้ที่ตกลงกันแล้ว

### กลุ่ม A: Audio

#### [A1] audioOffset คำนวณผิด unit — floating point error สะสม

**ปัญหา**: แปลง ticks → microseconds → ticks โดยไม่จำเป็น
```javascript
// ❌ เดิม (2 ขั้นตอน)
const trackDurUs = mdhd.duration / clipTs * 1_000_000
audioOffset += Math.round(trackDurUs / 1_000_000 * this.audioTimescale)

// ✅ ที่ตกลง (1 ขั้นตอน)
if (clipTs === this.audioTimescale) {
  audioOffset += mdhd.duration                                    // ตรง ไม่มี float
} else {
  audioOffset += Math.round(mdhd.duration / clipTs * this.audioTimescale)
}
```

#### [A2] audioDecoderConfig ไม่ถูกส่งถ้า clip แรกไม่มี audio

**ปัญหา**: condition `i === 0 && s === clip.audioSamples[0]` พังถ้า clips[0] ไม่มี audio

**วิธีแก้**: ใช้ flag `audioConfigSent` แทน index check
```javascript
let audioConfigSent = false  // declare ก่อน loop clips ทั้งหมด

for (const s of clip.audioSamples) {
  const needsMeta = !audioConfigSent && clip.audioDecoderConfig

  this._muxer.addAudioChunkRaw(
    s.data,
    'key',
    timestampUs,
    durationUs,
    needsMeta
      ? { decoderConfig: { description: clip.audioDecoderConfig } }
      : undefined
  )

  if (needsMeta) audioConfigSent = true
}
```

**เหตุผลที่ไม่ใช้ `addTrack` alternative**: ยังไม่ได้ verify ว่า mp4-muxer version ที่ใช้รองรับ — flag approach ปลอดภัยกว่าและทดสอบได้ง่ายกว่า

#### [A3] demuxClip — ใช้ `info` ก่อน declare (closure/timing bug)

**ปัญหา**: `mp4.onSamples` ถูก assign ก่อน `mp4.onReady` → `info` ยัง undefined

**วิธีแก้**: ย้าย `onSamples` assignment ไว้ภายใน `onReady` callback + ใช้ track id map
```javascript
mp4.onReady = (info) => {
  const trackTypeMap = {}
  for (const t of info.videoTracks) trackTypeMap[t.id] = 'video'
  for (const t of info.audioTracks) trackTypeMap[t.id] = 'audio'

  mp4.onSamples = (id, user, sampleList) => {
    const type = trackTypeMap[id]
    if (type) samples[type].push(...sampleList)
  }
  // ...
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
// ใน decoder output: this._frameWake?.(); this._frameWake = null
// ใน cancel(): this._frameWake?.()  ← ปลด hang
```

#### [P2] _waitDrain race condition — processClip hang ตลอดไป

**ปัญหา**: frameQueue หมดก่อน drainResolve ถูก set

**วิธีแก้**: เช็ค queue ก่อน set resolver + ปลดจาก cancel
```javascript
_waitDrain() {
  if (this._frameQueue.length === 0) return Promise.resolve()
  return new Promise(r => { this._drainResolve = r })
}
// ใน cancel(): this._drainResolve?.()  ← ปลด hang
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

**cancel() ที่สมบูรณ์** ต้องปลด hang ทั้ง 3 จุด:
```javascript
cancel() {
  this._cancelled = true
  this._frameWake?.()       // ปลด P1
  this._drainResolve?.()    // ปลด P2
  this._cleanup()           // ปิด encoder, clear queue, GC
}
```

---

### กลุ่ม C: Caption และ UX

#### [C1] captionsFn รับ global timestamp แทน local

**ปัญหา**: caller ต้องรู้ clip offset ก่อน เขียน caption condition ยาก

**วิธีแก้ที่ตกลง**: เปลี่ยนเป็น structured Caption Track array
```javascript
// per-clip captions
captions: [
  { startSec: 0,   endSec: 2,   text: 'สวัสดี',         position: 'bottom' },
  { startSec: 2.5, endSec: 5.0, text: 'วันนี้มาสอน...', position: 'bottom' },
]
// lookup ด้วย local timestamp ของคลิปนั้น
function getCaptionAt(captions, localSec) {
  return captions.find(c => localSec >= c.startSec && localSec < c.endSec) ?? null
}
```

**ข้อดีเพิ่ม**: serializable (save/load project), แสดงใน timeline UI ได้

#### [C2] caption position hardcode ที่ height * 0.88 ทับ safe zone

**ปัญหา**: TikTok/Instagram UI bar กินพื้นที่ ~15-18% จากล่าง

**วิธีแก้**: per-caption `position` field + platform presets
```javascript
const CAPTION_Y = { top: 0.12, center: 0.50, bottom: 0.80 }
// default: 'bottom' = 0.80 (safe สำหรับทุก platform)
// configurable per-caption
```

#### [C3] progress นับ clip แทน frame — กระโดดไม่สม่ำเสมอ

**ปัญหา**: clip A 30s, clip B 1s → progress 50% → 100% กระโดด

**วิธีแก้**: duration-based progress อัปเดตทุก frame
```javascript
// คำนวณ totalDurationSec จาก clips ก่อน export
const totalDurationSec = clips.reduce((s, c) =>
  s + ((c.trimEnd ?? c.durationSec) - (c.trimStart ?? 0)), 0)

// อัปเดตใน encode loop
onProgress(this._globalTimestampUs / 1_000_000 / totalDurationSec)
```

---

## 4. สิ่งที่ยังไม่ได้ทำ

| รายการ | หมายเหตุ |
|---|---|
| ยังไม่มีไฟล์ WebCodecs แม้แต่ไฟล์เดียว | ทุกอย่างยังเป็น design/planning |
| ยังไม่มี UI สำหรับ WebCodecs editor | Layout 3-column, timeline, caption editor |
| ยังไม่มี demuxClip implementation จริง | มีเฉพาะ pseudocode |
| ยังไม่มี trimming UI (snap to keyframe) | |
| ยังไม่มี thumbnail strip generator | สำหรับ preview ขณะลาก trim handle |
| ยังไม่มี project save/load | Caption track serialization |
| ยังไม่มี platform-specific export preset | TikTok / Instagram / YouTube |
| ยังไม่มี error handling ครบถ้วน | Codec not supported fallback |
---

## 5. สิ่งที่ห้ามเปลี่ยนโดยไม่แจ้ง

| ข้อห้าม | เหตุผล |
|---|---|
| **ห้ามเปลี่ยน Stack** จาก WebCodecs+mp4box.js+mp4-muxer | ทุก module ออกแบบมารองรับ stack นี้ |
| **ห้ามใช้ FFmpeg.wasm** ใน WebCodecs editor ใหม่ | เป็นเหตุผลหลักที่สร้างใหม่ |
| **ห้าม re-encode audio** | ใช้ passthrough เท่านั้น (ความเร็ว + คุณภาพ) |
| **ห้าม recreate VideoEncoder** ระหว่างคลิป | ต้องใช้ encoder เดียวตลอด export |
| **ห้ามใช้ global timestamp** ใน captionsFn | ใช้ Caption Track + local timestamp |
| **ห้ามใช้ height * 0.88** สำหรับ caption Y | ใช้ 0.80 เป็น default |
| **ห้ามเพิ่ม server-side processing** | ทุกอย่างต้องรันใน browser เท่านั้น |
| **ถ้าเจอ issue ใหม่ระหว่างแก้** ต้องแจ้งก่อน อย่าแก้เองโดยไม่บอก | ตามที่ตกลงกัน |

---

## ลำดับการพัฒนาที่แนะนำ

```
Phase 1: Core Engine (ไม่มี UI)
  1. demuxClip()         — mp4box.js, แก้ A3 ทันที
  2. TranscodePipeline   — decoder + encoder + backpressure, แก้ P1-P3
  3. MultiClipTranscoder — timestamp offset, ไม่ recreate encoder
  4. ExportSession       — muxer + audio passthrough, แก้ A1-A2
  5. Caption Track       — structured data, แก้ C1-C2-C3

Phase 2: UI
  6. Layout 3-column desktop + 1-column mobile
  7. Timeline + trim handle + thumbnail strip
  8. Caption editor (right panel)
  9. Progress bar + cancel button

Phase 3: Polish
  10. Export presets (TikTok / Instagram / YouTube)
  11. Project save/load
  12. Error handling + fallback (codec not supported)
  13. Deploy config (Vercel/Cloudflare — static hosting ธรรมดา ไม่ต้อง COOP/COEP)
```
