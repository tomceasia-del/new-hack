# Share Sheet & On-Device Storage — Feature Spec

## Overview
Add Share Sheet functionality and on-device storage to the existing Video Editor project.
Do not modify or replace any current functionality — extend only.

---

## Feature: Share Sheet

### UI
- Location: Step 6 of the editor flow
- Buttons: Facebook / YouTube / TikTok / Instagram / Save
- Layout: Icon-based buttons, horizontal row

### Behavior by button

#### Facebook / YouTube / TikTok / Instagram
1. Render the edited video (on-device, using FFmpeg.wasm)
2. Save the rendered video file to user's device (trigger browser download)
3. Deep Link to the target platform app with caption pre-filled
4. User selects the downloaded video file inside the target app
5. User posts manually

#### Save
1. Render the edited video (on-device, using FFmpeg.wasm)
2. Save the rendered video file to user's device
3. Save metadata to IndexedDB (see Storage section below)
4. Redirect user to our library page (already built)

---

## Deep Link Reference

| Platform  | Deep Link Scheme |
|-----------|-----------------|
| TikTok    | Check TikTok developer docs for current Intent URL |
| Instagram | Check Meta developer docs for Share Dialog |
| Facebook  | Check Meta developer docs for Share Dialog |
| YouTube   | Check YouTube developer docs for upload handoff |

> Note: Each platform has its own Deep Link scheme. Dev team must verify against official docs before implementation.

---

## Storage — IndexedDB (On-Device Only)

### Rules
- All data stays on the user's device — no server, no upload
- Use IndexedDB via the browser
- Trigger save on every **Save or Post** action

### Data to store
| Field | Description |
|-------|-------------|
| ชื่อสินค้า | Product name |
| Prompt ภาพถ่าย | Photo prompt used |
| Prompt วิดีโอ | Video prompt used |
| Platform | Platform the user posted to |
| Timestamp | Date and time of action |
| TBD | Additional fields — moat team to define |

### Limitation to communicate to user
> If the user clears their browser data or switches devices, all stored data will be lost.

---

## Architecture Notes

- All processing is **on-device** (FFmpeg.wasm for rendering, IndexedDB for storage)
- No data leaves the user's device
- No backend or server required for this feature
- This feature works independently from the moat team's backend work

---

## Note for Moat Team (Separate Workstream)

The IndexedDB data structure above is the foundation for the moat feature.
Moat team to define additional fields and own the data schema going forward.
Frontend only needs to trigger the save event — moat team handles the rest.

---

## Out of Scope (this PR)
- Server-side storage
- Auto-sync across devices
- Analytics or tracking
