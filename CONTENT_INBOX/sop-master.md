# Google Flow SOP — Master Reference + Web App Integration Guide
> Source: `content-googleflow.js` v3.40 | Last updated: 2026-04-16

---

## Table of Contents

1. [Technical Reference](#section-1-technical-reference)
   - 1.1 Pipeline Overview
   - 1.2 Step Enumerations
   - 1.3 Actual Execution Order (AutoPost)
   - 1.4 Sub-Step Breakdown
   - 1.5 Timing Constants
   - 1.6 `flowStatus` State Machine
   - 1.7 `currentFlowData` Field Definitions
   - 1.8 Concurrency Guard Flags
2. [Web App Integration Guide](#section-2-web-app-integration-guide)
   - 2.1 Entry Requirements
   - 2.2 Concurrency Contract
   - 2.3 Message Listener API
   - 2.4 AutoPost Pipeline — Per-Step Integration
   - 2.5 Storymode Pipeline — Message-Driven Integration
   - 2.6 Auto V2 Pipeline — Lifecycle Integration
   - 2.7 Error States & Recovery
   - 2.8 Important Behavioral Notes

---

## Section 1: Technical Reference

### 1.1 Pipeline Overview

Three distinct automation pipelines exist. They share the same Google Flow tab but must **never run concurrently**.

| Pipeline | Identifier | Steps | Trigger |
|---|---|---|---|
| **AutoPost** | `flowType: 'autopost'` | 17 (AUTOPOST_STEPS) | `FLOW_DATA` message or storage init |
| **Storymode / Scene Pipeline** | `flowType: 'storymode'` or `'pipeline'` | 7 per scene (STORY_STEPS) | `createSceneImage` / `createSceneVideo` messages |
| **Auto V2** | `flowType: 'autov2'` | 3 internal phases | `FLOW_DATA` message with `flowType:'autov2'` in storage |

---

### 1.2 Step Enumerations

#### AUTOPOST_STEPS (17 entries)

Defined in code. The **key name** is a logical identifier; the **value string** is what appears in `retryStep()` log output. ⚠️ The numbering in value strings does **not** reflect actual execution order (see §1.3).

| Key | Value String | Notes |
|---|---|---|
| `step1_NewProject` | `'step1: New Project'` | Always first |
| `step2_SelectMode` | `'step2: Select Image/Portrait/x1'` | Runs **after** step3 in actual execution |
| `step3_UploadImage` | `'step3: Upload Image'` | Runs second |
| `step4_HoverAddPrompt` | `'step4: Hover Image + Add to Prompt'` | Hover product image |
| `step5_PastePrompt` | `'step5: Paste Prompt'` | Image prompt |
| `step6_Generate` | `'step6: Generate'` | Click Generate button |
| `step7_WaitImage` | `'step7: Wait for Image'` | ≤ 150 s |
| `step8_AddToVideoPrompt` | `'step8: Add Image to Video Prompt'` | Hover generated image |
| `step9_PasteVideoPrompt` | `'step9: Paste Video Prompt'` | Video prompt 8 s |
| `step10_SelectVideo` | `'step10: Select Video + Frames'` | Tab switches + Veo model |
| `step11_WaitVideo` | `'step11: Wait for Video'` | ≤ 180 s |
| `step12_Download` | `'step12: Download Video'` | Blob fetch or button |
| `step13_ClickExtend` | `'step13: Click Video to Extend'` | 16 s only |
| `step14_PasteExtend` | `'step14: Paste Extend Prompt'` | 16 s only |
| `step15_GenerateExtend` | `'step15: Generate Extend'` | 16 s only |
| `step16_WaitExtend` | `'step16: Wait for Extended Video'` | 16 s only; ≤ 180 s |
| `step17_OpenTikTok` | `'step17: Open TikTok Upload'` | Final step |

#### STORY_STEPS (7 entries, runs once per scene)

| Key | Value String |
|---|---|
| `step1_SelectMode` | `'Scene Step 1: Select Image/Portrait/x1'` |
| `step2_PastePrompt` | `'Scene Step 2: Paste Image Prompt'` |
| `step3_Generate` | `'Scene Step 3: Click Generate'` |
| `step4_AddToPrompt` | `'Scene Step 4: Add Image to Prompt'` |
| `step5_SelectVideo` | `'Scene Step 5: Select Video Tabs'` |
| `step6_GenerateVideo` | `'Scene Step 6: Click Generate Video'` |
| `step7_AddToScene` | `'Scene Step 7: Add Video to Scene'` |

#### Auto V2 Internal Phases (no enum constant — named by function)

| Phase Function | Internal Name |
|---|---|
| `v2PasteImagePromptAndGenerate()` | `'V2: Paste Image Prompt'` |
| `v2AddImageAndStartVideo()` | `'V2: Add Image + Start Video'` |
| `v2SwitchToVideoAndPastePrompt()` | `'V2: Switch to Video + Paste Prompt'` |

---

### 1.3 Actual Execution Order (AutoPost)

The AUTOPOST_STEPS key numbers and log strings **do not match** the runtime call sequence. Actual sequence:

```
step1 → step3 → step4 → [step4b → step4b-2 → step4b-3] → step2 → step5 → step6 → step7
→ step8 → step9 → step10 → step11 → step12 → [step13 → step14 → step15 → step16 if 16s] → step17
```

| Execution Position | AUTOPOST_STEPS Key | Action |
|---|---|---|
| 1 | `step1_NewProject` | Click New Project button; set `flowStatus:'in_progress'` |
| 2 | `step3_UploadImage` | Upload product image via `+` button |
| 3 | `step4_HoverAddPrompt` | Hover uploaded product image → Add to Prompt |
| 4 | *(sub-step 4b)* | Upload character image (conditional) |
| 5 | *(sub-steps 4b-2, 4b-3)* | Add character image to Prompt (conditional) |
| 6 | `step2_SelectMode` | Select Image / Portrait / x1 in toolbar |
| 7 | `step5_PastePrompt` | Paste image prompt to Slate |
| 8 | `step6_Generate` | Click Generate button |
| 9 | `step7_WaitImage` | Poll for new image ≤ 150 s |
| 10 | `step8_AddToVideoPrompt` | Hover generated image → Add to Video Prompt |
| 11 | `step9_PasteVideoPrompt` | Paste video prompt 8 s (`videoPrompt8`) |
| 12 | `step10_SelectVideo` | Select Video tab → Frames tab → Veo model |
| 13 | `step11_WaitVideo` | Generate + poll for video ≤ 180 s; saves blob → `video_saved_8s` |
| 14 | `step12_Download` | Download / save 8 s video |
| 15 | `step13_ClickExtend` | *(16 s only)* Enter Scene Builder → select Extend |
| 16 | `step14_PasteExtend` | *(16 s only)* Paste `videoPrompt16` |
| 17 | `step15_GenerateExtend` | *(16 s only)* Click Generate Extend |
| 18 | `step16_WaitExtend` | *(16 s only)* Poll ≤ 180 s → `video_downloaded_16s` |
| 19 | `step17_OpenTikTok` | Open TikTok upload tab |

---

### 1.4 Sub-Step Breakdown

| Sub-Step ID | Parent Step | Description |
|---|---|---|
| `4b` | step4 | Upload product image blob to Google Flow `+` button |
| `4b-2` | step4 | Click `+` for character image slot |
| `4b-3` | step4 | Hover character image → Add to Prompt |
| `5a` | step5 | Locate Slate textarea / `PINHOLE_TEXT_AREA_ELEMENT_ID` |
| `5b` | step5 | Paste via `PASTE_TO_SLATE` background message (primary path) |
| `5c` | step5 | Paste via `textarea.value` setter (fallback) |
| `10a` | step10 | Click Video tab in media-type dropdown |
| `10b` | step10 | Click Frames tab |
| `10c` | step10 | Select Veo model from dropdown |
| `10d` | step10 | Click Generate button for video |
| `15b` | step16 | Poll Scene Builder for completed clip 2 |
| `15c` | step16 | Fetch/download extended video blob |

---

### 1.5 Timing Constants

| Constant / Context | Value | Notes |
|---|---|---|
| **AutoPost image wait** (step7) | ≤ 150 s | Notified as "สูงสุด 2.5 นาที"; exits early on detection |
| **AutoPost video wait** (step11) | `MAX_ATTEMPTS = 180` × 1 s = **180 s** | Each attempt checks blob/download button |
| **AutoPost extend wait** (step16) | `attempt <= 180` × 1 s = **180 s** | Minimum 20 s before video element check |
| **V2 image wait** | `IMG_WAIT = 50` × 3 s = **150 s** | Exits early on image detection |
| **V2 video wait** | `attempt <= 240` × 1 s = **240 s** | Scene builder second clip |
| **Storymode image wait** | `imageWaitSeconds(60) + 30` = **90 s** | Per scene |
| **Storymode video wait** | `TOTAL_WAIT = 180` s | Per scene; timeout → `flow_error` |
| **`retryStep` defaults** | `maxRetries = 4`, `delayMs = 5000 ms` | 4 retries × 5 s back-off |
| **`safeDelay` interrupt** | `interval = 2000 ms` | Checks `isFlowStopped()` every 2 s |
| **Scene Builder extend wait (Studio)** | `MAX_WAIT_MS = 5 × 60 × 1000` | 5 min total |
| **`waitForVideoReady`** | `maxWaitMs = 30000` ms | DOM `loadeddata` / `canplay` event |
| **Crash reload back-off** | `3000 + (crashRetryCount × 2000)` ms | Up to 3 reload retries |
| **Resume 16s: step delay** | 3000–5000 ms | Hard-coded before each resumed step |

---

### 1.6 `flowStatus` State Machine

All states written to `chrome.storage.local` key `flowStatus`. The `isFlowStopped()` function halts the chain when it reads `'stopped'`, `'skipped'`, or `'flow_error'`.

| State | Set By | Meaning | Next State(s) |
|---|---|---|---|
| `waiting_for_flow` | Sidepanel / Web App on dispatch | Data saved; waiting for content script init | `in_progress` |
| `in_progress` | step1 (New Project success) | Pipeline actively running | `step_completed`, `flow_error`, `stopped` |
| `step_completed` | Each step success | Intermediate heartbeat | `in_progress` (next step) |
| `video_saved_8s` | step11 success | 8 s video blob captured | `extending_16s` (if 16s), `completed_download` |
| `extending_16s` | step13 pre-click guard | Scene Builder extend in progress | `video_downloaded_16s`, `flow_error` |
| `video_downloaded_16s` | step16 success | 16 s video downloaded | `completed_16s`, `completed_download` |
| `completed_16s` | Step 16 final | 16 s clip complete (legacy alias) | — |
| `completed_download` | Download complete | Generic download success | — (sidepanel tears down) |
| `completed_download_manual` | Manual download path | User-assisted download done | — |
| `flow_error` | Any failed step / `retryStep` exhausted | Pipeline failed; halts chain | — (sidepanel handles) |
| `stopped` | Sidepanel / user action | Manual stop | — |
| `skipped` | Sidepanel / user action | Item skipped | — |
| `running` | Storymode scene start | `autoRunSceneStatus` active | `flow_error`, cleared on completion |
| `v2_image_generating` | V2 phase 1 start | Auto V2: generating image | `v2_image_done` |
| `v2_image_done` | V2 phase 1 complete | Auto V2: image ready | `v2_video_generating` |
| `v2_video_generating` | V2 phase 2 start | Auto V2: generating video | `v2_video_saved` |
| `v2_video_saved` | V2 phase 2 complete | Auto V2: 8 s video ready | `v2_extending` |
| `v2_extending` | V2 phase 3 start | Auto V2: extending video | `v2_extend_done` |
| `v2_extend_done` | V2 phase 3 complete | Auto V2: extended clip ready | `completed_download` |

---

### 1.7 `currentFlowData` Field Definitions

Written to `chrome.storage.local` key `currentFlowData` by the sidepanel before every pipeline dispatch.

#### AutoPost / Storymode fields

| Field | Type | Description |
|---|---|---|
| `itemId` | `string` | Queue item identifier; used to guard against product mixup in `getSafeFlowData()` |
| `mode` | `'image' \| 'video'` | Pipeline mode. Note: content script does **not** branch on this — see §2.8 |
| `prompt` | `string` | Image generation prompt (Template 1) |
| `productName` | `string` | Display name used in notifications |
| `productId` | `string` | TikTok product search ID |
| `imageUrl` | `string` | Product image URL (remote) |
| `productImageBase64` | `string` | Product image encoded as base64 (used for upload) |
| `characterUrl` | `string` | Character image URL (optional) |
| `h1Headline` | `string` | H1 headline (for TikTok post) |
| `h2Subtitle` | `string` | H2 subtitle |
| `caption` | `string` | TikTok post caption |
| `cta` | `string` | Call-to-action text |
| `clipDuration` | `8 \| 16` | Target clip length; drives 16s extend branch |
| `videoPromptData` | `object \| null` | Structured JSON video prompt (parsed from `videoPrompt`) |
| `hookId` | `number \| null` | Hook identifier from content generation |
| `hookIdFromVideo` | `number \| null` | Hook ID derived from video prompt |
| `hookIdFromContent` | `number \| null` | Hook ID derived from script content |
| `selectedHookId` | `number \| null` | Final selected hook ID |
| `videoPrompt8` | `string` | Extracted plain-text video prompt for 8 s clip |
| `videoPrompt16` | `string` | Extracted plain-text video prompt for 16 s clip |
| `postMode` | `'post' \| 'schedule' \| 'draft'` | TikTok posting mode |
| `scheduleTime` | `string \| null` | ISO 8601 scheduled time (if `postMode === 'schedule'`) |
| `flowImageModel` | `string` | Selected image model (`'auto'` default) |
| `flowVideoModel` | `string` | Selected video model (`'auto'` default) |
| `timestamp` | `number` | `Date.now()` at dispatch |

#### Additional Auto V2 fields

| Field | Type | Description |
|---|---|---|
| `v2VideoPrompt` | `string` | Video prompt for V2 Template 2 |
| `v2ExtendPrompt` | `string` | Extend prompt for V2 phase 3 |

---

### 1.8 Concurrency Guard Flags

Four module-level boolean flags prevent simultaneous pipeline runs.

| Flag | Pipeline |
|---|---|
| `_autoPostRunning` | AutoPost |
| `_autoV2Running` | Auto V2 |
| `_storymodeRunning` | Storymode / Scene Pipeline |
| `_studioRunning` | Studio |

`canStartSystem(name)` checks all four. If any other flag is `true`, it calls `showNotification('⚠️ {other} กำลังทำงานอยู่')` and returns `false`. `startSystem(name)` resets all flags, then sets only the named one.

`window._pipelineRunning` is an additional guard used by `createSceneVideo` to reject duplicate messages mid-scene.

---

## Section 2: Web App Integration Guide

### 2.1 Entry Requirements

Before dispatching any pipeline, the Web App **must**:

1. Build the `currentFlowData` object (see §1.7).
2. Write to `chrome.storage.local`:
   ```js
   chrome.storage.local.set({
     currentFlowData: flowData,
     flowStatus: 'waiting_for_flow',
     flowType: 'autopost' // or 'autov2'
   });
   ```
3. For AutoPost: also set backup keys to guard `clipDuration` across page reloads:
   ```js
   chrome.storage.local.set({
     autopostTargetClipDuration: clipDuration,
     autopostTargetItemId: item.id
   });
   ```
4. Ensure Google Flow tab is open at `https://labs.google/fx/tools/flow` and reload it **before** or immediately after writing storage (content script re-runs on load and reads `waiting_for_flow`).

---

### 2.2 Concurrency Contract

- Only **one** pipeline may run at a time. Check `flowStatus` before dispatching.
- If `flowStatus` is not `null`, not `'waiting_for_flow'`, and not a terminal state (`'completed_download'`, `'stopped'`, `'skipped'`, `'flow_error'`), the pipeline is busy — do not dispatch.
- The sidepanel reads `flowType` on init; if `flowType === 'storymode'` or `'pipeline'` and `autoRunSceneStatus.completed === false`, the content script **will abort** the AutoPost init and set `flowStatus:'flow_error'`.
- To force-unlock a stuck scene pipeline: send `{ action: 'resetPipelineLock' }`.

---

### 2.3 Message Listener API

The content script registers one `chrome.runtime.onMessage` listener. All messages must be sent from background or sidepanel context.

#### AutoPost trigger

```js
chrome.tabs.sendMessage(flowTabId, {
  type: 'FLOW_DATA',
  data: { /* currentFlowData fields */ }
});
```
Effect: sets `flowStopped=false`, writes `flowType:'autopost'`, `flowStatus:'waiting_for_flow'` to storage, then immediately calls `clickNewProjectButton()`.

#### Control messages

| `action` | Payload fields | Effect |
|---|---|---|
| `ping` | — | Returns `{ success: true, ready: true }` — use to verify content script is loaded |
| `resumeFromStep` | `stepNumber: N` | Resume AutoPost from step N (8–16 supported) |
| `resetPipelineLock` | — | Sets `window._pipelineRunning = false` |
| `createFirstScene` | `sceneNumber, prompt` | Storymode: create first scene (image+video) |
| `extendScene` | `sceneNumber, prompt` | Storymode: extend existing scene |
| `startSingleScene` | `type, sceneNumber, prompt` | Storymode: run one scene |
| `createSceneImage` | `sceneNumber, imagePrompt, isFirstScene, productImage, characterImage, isRetry` | Pipeline: image phase for one scene |
| `createSceneVideo` | `sceneNumber, videoPrompt, isRetry` | Pipeline: video phase for one scene; rejected if `_pipelineRunning` |
| `openSceneBuilderAndDownload` | — | Pipeline: open Scene Builder and download composite |

---

### 2.4 AutoPost Pipeline — Per-Step Integration

Each row shows: what the content script does, what `flowStatus` it reads/writes, and what notification string is shown.

#### Step 1 — New Project

| | Detail |
|---|---|
| **flowStatus written** | `'in_progress'` |
| **Notification (Thai)** | `'🖱️ กำลังกด New Project...'` → `'✅ กด New Project แล้ว!'` → `'⏳ รอหน้า New Project โหลด...'` → `'✅ เข้า New Project สำเร็จ!'` |
| **Failure notification** | `'❌ ไม่สามารถเข้า New Project ได้ — กรุณากด New Project เอง'` |
| **Web App input** | `flowType`, `flowStatus:'waiting_for_flow'`, full `currentFlowData` in storage |
| **Branch after success** | If `flowType==='autov2'` → V2 phase 1; else → Step 3 |

#### Step 3 — Upload Product Image

| | Detail |
|---|---|
| **Notification** | `'📷 กำลังกดปุ่ม + เพื่ออัพโหลดรูป...'` → `'⏳ รอ 8 วินาที (เผื่อเน็ตช้า)...'` → `'📥 กำลังอัพโหลดรูปสินค้า...'` → `'✅ อัพโหลดรูปสินค้าสำเร็จ! รอรูปปรากฏ...'` |
| **Failure notification** | `'⚠️ ไม่พบรูปสินค้า'` / `'⚠️ ไม่สามารถกดปุ่ม + ได้'` / `'⚠️ ไม่พบ file input'` |
| **Web App input required** | `currentFlowData.productImageBase64` (base64 string) **or** `imageUrl` (remote URL) |

#### Step 4 — Hover Product Image + Add to Prompt

| | Detail |
|---|---|
| **Notification** | `'🖱️ กำลัง Hover รูปแรก...'` → `'⏳ รอ 8 วินาที (เผื่อเน็ตช้า)...'` → `'🖱️ Hover รูป...'` → `'🖱️ คลิกขวา...'` → `'🔍 กำลังหา Add to Prompt...'` → `'🖱️ กด Add to Prompt...'` → `'✅ Add to Prompt เสร็จ!'` |
| **Failure** | `'⚠️ ไม่พบรูปที่จะ hover'` / `'⚠️ ไม่พบ Add to Prompt'` |

#### Step 4b / 4b-2 / 4b-3 — Character Image (conditional)

| | Detail |
|---|---|
| **Condition** | Executes only when `characterUrl` / `characterImage` is provided in `currentFlowData` |
| **Notification** | `'ℹ️ ไม่มีรูปตัวละคร - ข้ามไป Step 5'` (skip) or `'👤 กำลังอัพโหลดรูปตัวละคร...'` → `'✅ อัพโหลดรูปตัวละครสำเร็จ!'` → `'✅ เพิ่มตัวละครเสร็จ!'` |
| **Failure** | `'⚠️ ไม่พบรูปตัวละคร - ข้ามไป Step 5'` |
| **Web App input** | `currentFlowData.characterUrl` or a base64 character image in the `createSceneImage` message |

#### Step 2 — Select Image / Portrait / x1

| | Detail |
|---|---|
| **Notification** | `'🔧 กำลังเลือก Image - Portrait - x1...'` → `'⏳ รอ 6 วินาที (เผื่อเน็ตช้า)...'` → `'✅ เลือก Image แล้ว'` → `'✅ เลือก Portrait แล้ว'` → `'✅ เลือก x1 แล้ว'` → `'✅ Step 5 เสร็จ!'` |
| **Failure** | `'⚠️ ไม่พบ Image tab'` / `'⚠️ ไม่พบ Portrait tab'` / `'⚠️ ไม่พบ x1 tab'` |

#### Step 5 — Paste Image Prompt

| | Detail |
|---|---|
| **Notification** | `'📝 กำลังวาง Image Prompt...'` → `'⏳ รอ 6 วินาที (เผื่อเน็ตช้า)...'` → `'📝 กำลังวาง Prompt ผ่าน Slate API...'` → `'✅ วาง Image Prompt สำเร็จ (Slate API)!'` or `'✅ วาง Image Prompt สำเร็จ (textarea)!'` |
| **Failure** | `'⚠️ ไม่พบ Image Prompt'` / `'⚠️ ไม่พบ Slate editor'` / `'📋 Prompt อยู่ใน clipboard — กด Ctrl+V'` |
| **Web App input required** | `currentFlowData.prompt` (non-empty string) |

#### Step 6 — Generate Image

| | Detail |
|---|---|
| **Notification** | `'🚀 กำลังกด Generate...'` → `'⏳ รอ 6 วินาที (เผื่อเน็ตช้า)...'` → `'🖱️ กด Generate...'` → `'✅ กด Generate แล้ว!'` → `'⏳ รอรูป Generate เสร็จ (สูงสุด 2.5 นาที)...'` |
| **Policy retry** | `'🔄 Policy Retry N/3 — กด Generate ใหม่...'` |
| **Success** | `'✅ รูป Generate เสร็จแล้ว! ({details})'` |
| **Failure** | `'❌ Image Generation Failed: {reason} — ข้ามไปรายการถัดไป'` / `'❌ Google labs ล่ม!'` |
| **Failure → flowStatus** | `'flow_error'` |

#### Step 7 — Wait for Image *(merged into step6 function)*

*Polling happens inside the same function as Generate. Max wait ≤ 150 s.*

#### Step 8 — Add Generated Image to Video Prompt

| | Detail |
|---|---|
| **Notification** | `'🖱️ กำลัง Hover รูปแรก...'` → `'⏳ รอ 8 วินาที (เผื่อเน็ตช้า)...'` → `'🖱️ Hover รูป...'` → `'🖱️ กด Add to Prompt...'` → `'✅ Add to Prompt เสร็จ!'` |
| **Failure** | `'⚠️ ไม่พบ Add to Prompt - ลองคลิกขวาที่รูปด้วยตัวเอง'` |

#### Step 9 — Paste Video Prompt 8 s

| | Detail |
|---|---|
| **Notification** | `'📝 กำลังวาง Video Prompt 8 วิ...'` → `'⏳ รอ 8 วินาที (เผื่อเน็ตช้า)...'` → `'📝 กำลังวาง Video Prompt 8s ผ่าน Slate API...'` → `'✅ วาง Video Prompt 8 วิ สำเร็จ!'` |
| **Failure** | `'⚠️ ไม่พบ Video Prompt 8 วิ'` / `'📋 Prompt อยู่ใน clipboard — กด Ctrl+V'` |
| **Web App input required** | `currentFlowData.videoPrompt8` (non-empty string) |

#### Step 10 — Select Video + Frames + Veo model

| | Detail |
|---|---|
| **Notification** | `'🎬 กำลังเปลี่ยนเป็น Video + Frames...'` → `'⏳ รอ 4 วินาที...'` → `'🖱️ กด dropdown...'` → `'🎬 เลือก Video...'` → `'✅ เลือก Video แล้ว!'` → `'🖼️ เลือก Frames...'` → `'✅ เลือก Frames แล้ว!'` → `'🎬 กำลังเลือก {veoModelLabel}...'` → `'✅ เลือก {veoModelLabel} แล้ว!'` → `'✅ Step 10 เสร็จ!'` |
| **Failure** | `'⚠️ ไม่พบ Video tab'` / `'⚠️ ไม่พบ Frames tab'` / `'⚠️ ไม่พบ Veo dropdown'` |
| **Web App input** | `currentFlowData.flowVideoModel` (Veo model string; `'auto'` uses default) |

#### Step 11 — Wait for Video 8 s + Save

| | Detail |
|---|---|
| **flowStatus written on success** | `'video_saved_8s'` |
| **Notification** | `'🚀 กด Generate...'` → `'✅ กด Generate แล้ว!'` → `'⏳ รอ Video Generate (สูงสุด 3 นาที)...'` → `'⏳ Step 11: รอ Video 8 วิ Generate...'` → `'⏳ รอ Video 8 วิ Generate... (N/180 วิ)'` → `'✅ Smart Screen: Video พร้อม!'` → `'💾 กำลังบันทึก Video (8 วิ)...'` → `'✅ Step 11 เสร็จ! บันทึก Video 8 วิ แล้ว!'` |
| **16 s branch** | `'🎞️ 16 วิ mode — Scene Builder Extend...'` → jumps to step13 |
| **8 s branch** | `'📥 8 วิ — ดาวน์โหลดวีดีโอ...'` → step12 |
| **Failure** | `'❌ Generation Failed: {reason} — ข้ามรายการนี้'` / `'⚠️ ไม่พบ Video หลังจากรอ 3 นาที'` |

#### Step 12 — Download Video (8 s)

| | Detail |
|---|---|
| **flowStatus written** | `'completed_download'` or `'completed_download_manual'` |
| **Notification** | `'💾 กำลังบันทึก Video (8 วิ)...'` → `'⏳ รอ Video โหลดเสร็จ...'` → `'📥 ดาวน์โหลด Video... (N/retries)'` or `'🔄 ใช้ปุ่ม Download ของ Google Flow แทน...'` → `'✅ กดปุ่ม Download แล้ว — ใช้ไฟล์จาก Downloads'` |

#### Steps 13–16 — 16 s Extend (conditional on `clipDuration === 16`)

| Step | flowStatus written | Key Notification |
|---|---|---|
| 13 | `'extending_16s'` *(pre-click guard)* | `'🎬 กำลังเข้า Scene Builder...'` → `'➕ หาปุ่ม + ใน timeline...'` → `'🎬 เลือก Extend...'` |
| 14 | — | `'📝 วาง Extend Prompt...'` → `'📋 Prompt อยู่ใน clipboard — กด Ctrl+V'` (fallback) |
| 15 | — | `'🚀 กด Generate...'` → `'✅ กด Generate แล้ว!'` |
| 16 | `'video_downloaded_16s'` | `'⏳ รอ Clip 2 Generate...'` → `'✅ กด Generate แล้ว!'` |

**Web App input required for 16 s**: `currentFlowData.videoPrompt16` (non-empty string) and `clipDuration === 16`.

#### Step 17 — Open TikTok Upload

| | Detail |
|---|---|
| **Notification** | `'🔗 เปิด TikTok Upload...'` |
| **Effect** | Opens TikTok upload tab; `content-tiktok-platform.js` takes over |

---

### 2.5 Storymode Pipeline — Message-Driven Integration

Storymode is driven entirely by messages from the sidepanel. The content script **does not** auto-start on page load for storymode; the sidepanel explicitly sends messages.

#### Scene Image creation (`createSceneImage`)

```js
chrome.tabs.sendMessage(flowTabId, {
  action: 'createSceneImage',
  sceneNumber: 1,           // 1-based scene index
  imagePrompt: '...',       // image generation prompt
  isFirstScene: true,       // true only for scene 1
  productImage: '...',      // base64 product image (optional)
  characterImage: '...',    // base64 character image (optional)
  isRetry: false            // true on retry
});
```

Steps executed internally (maps to STORY_STEPS):
1. `step1`: Select Image/Portrait/x1
2. `step2`: Paste image prompt
3. `step3`: Click Generate
4. Wait for image (≤ 90 s): `'⏳ ฉาก N: รอ Image Generate...'` → `'✅ ฉาก N: Image เสร็จแล้ว!'`
5. `step4`: Hover generated image → Add to Prompt

On success: sets `autoRunSceneStatus: { sceneNumber: N, step: 'image', completed: true }`.
On failure: sets `flowStatus:'flow_error'`, `flowMessage:'Scene N: {reason}'`.

#### Scene Video creation (`createSceneVideo`)

```js
chrome.tabs.sendMessage(flowTabId, {
  action: 'createSceneVideo',
  sceneNumber: 1,
  videoPrompt: '...',
  isRetry: false
});
// Returns { success: false, reason: 'pipeline_busy' } if _pipelineRunning
```

Steps executed:
1. `step5`: Select Video Tabs
2. Paste video prompt
3. `step6`: Click Generate Video
4. Wait for video (≤ 180 s): `'⏳ ฉาก N: รอ Video Generate... (สูงสุด 180 วิ)'` → `'✅ ฉาก N: Video เสร็จแล้ว!'`
5. `step7`: Hover video → Add to Scene

On success: sets `autoRunSceneStatus: { sceneNumber: N, step: 'video', completed: true }`.
On timeout/failure: sets `flowStatus:'flow_error'`, `flowMessage:'Scene N: Video timeout after 180s'`.

#### Progress monitoring (Storymode)

Poll `autoRunSceneStatus` from storage:

| `autoRunSceneStatus.phase` | Meaning |
|---|---|
| `'waiting_generate'` | Waiting for generate click |
| `'generating'` | Generating; check `.elapsed` and `.pct` (0–100) |
| `'add_to_scene'` | Video done; adding to scene |

#### Scene Builder download

```js
chrome.tabs.sendMessage(flowTabId, { action: 'openSceneBuilderAndDownload' });
```
After all scenes are complete, this opens Scene Builder and triggers composite download.

---

### 2.6 Auto V2 Pipeline — Lifecycle Integration

Auto V2 is dispatched via storage (no direct `FLOW_DATA` message). The sidepanel writes `flowType:'autov2'` before reloading the Flow tab.

#### Dispatch sequence

```js
await chrome.storage.local.set({
  currentFlowData: { ...v2FlowData },   // includes v2VideoPrompt, v2ExtendPrompt
  flowStatus: 'waiting_for_flow',
  flowType: 'autov2'
});
// Then: chrome.tabs.update(flowTabId, { url: FLOW_URLS.GOOGLE_FLOW })
```

#### V2 flowStatus lifecycle

```
waiting_for_flow
    ↓ (content script init)
v2_image_generating   ← phase 1: paste image prompt → generate
    ↓
v2_image_done         ← image detected
    ↓
v2_video_generating   ← phase 2: add image → switch to video → paste video prompt → generate
    ↓
v2_video_saved        ← 8 s video saved
    ↓
v2_extending          ← phase 3: enter Scene Builder → paste extend prompt → generate
    ↓
v2_extend_done        ← extended clip ready
    ↓
completed_download    ← file downloaded; sidepanel polls for TikTok upload
```

#### Sidepanel polling pattern for V2

The sidepanel polls `flowStatus` from storage in a loop:

- Waits for `'v2_video_saved'` or `'completed_download'` before proceeding to TikTok upload.
- If `flowStatus === 'v2_extending'`, logs that extend is in progress.
- Waits for `'v2_extend_done'` or `'completed_download'` before proceeding.
- On TikTok success: clears `currentFlowData`, `flowStatus`, `flowType` back to `null`.

#### V2 sidepanel notification strings

| flowStatus | Sidepanel display |
|---|---|
| `v2_image_generating` | `'🖼️ [V2] กำลังสร้างรูป Template 1...'` |
| `v2_image_done` | `'✅ [V2] รูปเสร็จ → เริ่มสร้างวิดีโอ'` |
| `v2_video_generating` | `'🎬 [V2] กำลังสร้างวิดีโอ Template 2...'` |
| `v2_video_saved` | `'🎞️ [V2] วิดีโอเสร็จ → เริ่ม Extend'` |
| `v2_extending` | `'🎞️ [V2] กำลัง Extend Video...'` |
| `v2_extend_done` | `'✅ [V2] Extend เสร็จ → Download'` |

#### V2 content script notifications

| Phase | Notification |
|---|---|
| Phase 1 start | `'🎬 [V2] กำลังวาง Image Prompt...'` |
| Phase 1 paste success | `'✅ [V2] วาง Image Prompt สำเร็จ!'` |
| Phase 1 generate clicked | `'✅ [V2] กด Generate แล้ว — รอรูป...'` |
| Phase 1 poll | `'⏳ [V2] รอรูป... N วิ'` |
| Phase 1 success | `'✅ [V2] รูป Generate เสร็จ!'` |
| Phase 2 start | `'🖼️ [V2] กำลังเพิ่มรูปลง Prompt...'` |
| Phase 2 add success | `'✅ [V2] เพิ่มรูปลง Prompt แล้ว!'` |
| Phase 3 start | `'🎬 [V2] เปลี่ยนเป็น Video + Frames...'` |
| Phase 1/2 no prompt | `'❌ ไม่พบ Image Prompt'` / `'❌ ไม่พบปุ่ม Generate'` |

---

### 2.7 Error States & Recovery

| State / Scenario | `flowStatus` | Web App Response |
|---|---|---|
| `flow_error` (any step) | `'flow_error'` | Read `flowMessage` for detail; show error to user; optionally `resumeFromStep` |
| `stopped` | `'stopped'` | User-initiated; clean up queue item |
| `skipped` | `'skipped'` | Move to next item |
| Page crash detected | Stays at last set status | Content script auto-reloads page up to 3×; if still crashed → `flow_error` |
| Policy violation (image) | `'flow_error'` | Sidepanel receives `FLOW_FAILED` runtime message with `reason: 'policy_violation'` |
| Audio generation failed | `'flow_error'` | Same as above with `reason: 'audio_generation_failed'` |
| `retryStep` exhausted | `'flow_error'` | Same — sidepanel already has a `flow_error` listener |
| Scene video timeout | `'flow_error'` + `flowMessage: 'Scene N: Video timeout after 180s'` | Retry via `createSceneVideo` with `isRetry: true` |
| `pipeline_busy` | — | `createSceneVideo` returns `{ success: false, reason: 'pipeline_busy' }` — wait and retry |
| Resume 16s after page reload | Detected by `isExtending` or `needsExtend` on init | No Web App action needed — handled automatically |

#### `retryStep` error notification pattern

```
'🔄 {stepName} — retry N/4...'   ← on each retry
'❌ {stepName} ล้มเหลว 4 รอบ — แจ้ง sidepanel'   ← on final failure
```

---

### 2.8 Important Behavioral Notes

1. **`mode:'image'` does NOT skip video steps in `content-googleflow.js`.** The content script has no branch that skips `step9_PasteVideoPrompt` or `step10_SelectVideo` when `mode === 'image'`. The Web App / sidepanel is responsible for setting `videoPrompt8` to an empty string and handling the mode branch before dispatching.

2. **`itemId` mismatch guard**: `getSafeFlowData()` compares `stored.itemId` vs. `currentFlowData.itemId` in memory. If they differ (e.g., a new item was dispatched while a page reload was in-flight), the in-memory copy wins with a warning. Always write `itemId` in `currentFlowData`.

3. **`clipDuration` persistence**: `getTargetClipDuration()` reads both `currentFlowData.clipDuration` and the backup `autopostTargetClipDuration` (bound to `autopostTargetItemId`). Both must be written on dispatch for 16 s clips to survive page reloads.

4. **Storymode / AutoPost mutual exclusion**: On init, if `autoRunSceneStatus.completed === false` and `flowType === 'storymode'`, the content script sets `flowStatus:'flow_error'` and does not start AutoPost. Clear `autoRunSceneStatus` before switching pipeline types.

5. **Scene video concurrency guard**: `createSceneVideo` messages are rejected with `{ success: false, reason: 'pipeline_busy' }` if `window._pipelineRunning === true`. The Web App must wait for the previous scene's video to complete before sending the next `createSceneVideo`. Send `resetPipelineLock` to force-clear if needed.

6. **`safeDelay` stops on user action**: Any `await safeDelay(ms)` call inside AutoPost returns `false` and halts the chain within ≤ 2 s of `flowStatus` being set to `'stopped'` or `'skipped'`. The Web App can interrupt any running AutoPost by writing `flowStatus:'stopped'` to storage.

7. **Resume support**: AutoPost supports mid-pipeline resume at steps 8–16 via `resumeFromStep`. This is used automatically after page reload when `flowStatus === 'video_saved_8s'` and `clipDuration === 16`, but can also be triggered manually by the Web App.

8. **`flowType` must always be set** alongside `flowStatus`. The `isFlowStopped()` guard skips its check entirely if `flowType` is not `'autopost'` or `'autov2'`, meaning `stopped`/`skipped`/`flow_error` signals are only honoured for those two pipeline types.