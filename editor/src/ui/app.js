/**
 * Video Editor v2 — Upload + Arrange ในพาเนลเดียว (กริด 3 คอลัมน์, mobile-first)
 */

import { probeClip } from '../engine/demux.js'
import { renderProjectToMp4, writeToFolder } from '../engine/renderMp4Export.js'
import { downloadProjectMetadataJson, saveProjectToIndexedDB } from '../engine/projectSave.js'
import {
  clearRenderFolderHandle,
  ensureFolderPermission,
  isFolderPickerSupported,
  loadRenderFolderHandle,
  pickRenderFolder,
} from '../engine/folderTarget.js'
import {
  getShareUploadEndpoint,
  setShareUploadEndpoint,
  uploadVideoForShareLink,
} from '../engine/shareUploadPhaseC.js'
import {
  getBgRenderDelayMs,
  getRenderStrategy,
  isChromeDesktop,
  shouldSpeculativelyPreload,
} from '../engine/deviceCapabilities.js'

/* ── Design envelope (ออกแบบให้ Chrome desktop เท่านั้น) ──────────────────
 * - คลิป input: ≤ 1.5 นาที, ≤ 50 MB
 * - Output หลัง trim: เฉลี่ย ~15 วินาที
 * - Render pipeline: MediaRecorder แบบ near-real-time บน Chrome desktop
 */
const MAX_CLIP_DURATION_SEC = 90
const MAX_CLIP_BYTES = 50 * 1024 * 1024
const TYPICAL_OUTPUT_SEC = 15

/**
 * @typedef {{
 *   id: string,
 *   file: File,
 *   name: string,
 *   durationSec: number,
 *   trimInSec: number,
 *   trimOutSec: number,
 *   thumbDataUrl: string | null,
 *   loading: boolean,
 *   error: string | null,
 *   fromProbe: boolean,
 * }} Clip
 */

/** @type {Clip[]} */
let clips = []
/** @type {1 | 3 | 4} workspace = 1, trim = 3, caption = 4 */
let step = 1
/** ข้อความ caption ฝั่ง client (รอเชื่อม API) */
let captionDraftText = ''
/** กำลัง Render (MediaRecorder) — ล็อกปุ่ม Caption */
let _captionExporting = false
/** ผลเรนเดอร์ล่าสุด — ปุ่มแชร์วิดีโอ (Web Share API) */
/** @type {{ blob: Blob, mimeType: string, filename: string, isMp4: boolean } | null} */
let lastExportVideo = null

/* ── Background render (Chrome desktop only) — เริ่มตอนกดถัดไปจาก Trim ────
 * เป้าหมาย: ตอน user กรอก caption เสร็จกด Render, blob พร้อมใช้งานทันที
 * ถ้า bg ยังรันอยู่ → แสดง overlay แล้ว await promise เดิม
 * ถ้า bg error → เงียบไว้, เด้งตอน user กด render บน caption (silent-fail policy)
 */
/** @type {Promise<any> | null} */
let _bgRenderPromise = null
/** @type {{ blob: Blob, mimeType: string, isMp4: boolean, filename: string, width: number, height: number } | null} */
let _bgRenderResult = null
/** @type {Error | null} */
let _bgRenderError = null
/** @type {AbortController | null} */
let _bgRenderAbort = null
let dragFromIndex = null

let _touchFrom = null
let _touchTimer = null
let _touchCard = null
let _touchActive = false
let _touchStartX = 0
let _touchStartY = 0
let _touchLastX = 0
let _touchLastY = 0

const el = {
  stepPills: /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('[data-step-pill]')),
  panelImport: /** @type {HTMLElement} */ (document.getElementById('panel-import')),
  panelNext: /** @type {HTMLElement} */ (document.getElementById('panel-next')),
  dropzone: /** @type {HTMLElement} */ (document.getElementById('dropzone')),
  fileInput: /** @type {HTMLInputElement} */ (document.getElementById('file-input')),
  clipArrangeGrid: /** @type {HTMLElement} */ (document.getElementById('clip-arrange-grid')),
  btnNext: /** @type {HTMLButtonElement} */ (document.getElementById('btn-next')),
  btnTrimNext: /** @type {HTMLButtonElement} */ (document.getElementById('btn-trim-next')),
  trimToolbarStep3: /** @type {HTMLElement | null} */ (document.getElementById('trim-toolbar-step3')),
  trimToolbarStep4: /** @type {HTMLElement | null} */ (document.getElementById('trim-toolbar-step4')),
  captionWorkspace: /** @type {HTMLElement | null} */ (document.getElementById('caption-workspace')),
  captionDraft: /** @type {HTMLTextAreaElement | null} */ (document.getElementById('caption-draft')),
  btnCaptionFetchStub: /** @type {HTMLButtonElement | null} */ (document.getElementById('btn-caption-fetch-stub')),
  btnCaptionBackTrim: /** @type {HTMLButtonElement | null} */ (document.getElementById('btn-caption-back-trim')),
  btnCaptionRender: /** @type {HTMLButtonElement | null} */ (document.getElementById('btn-caption-render')),
  btnCaptionSave: /** @type {HTMLButtonElement | null} */ (document.getElementById('btn-caption-save')),
  btnShareExportedVideo: /** @type {HTMLButtonElement | null} */ (
    document.getElementById('btn-share-exported-video')
  ),
  trimViewerWrap: /** @type {HTMLElement} */ (document.getElementById('trim-viewer-wrap')),
  trimVideo: /** @type {HTMLVideoElement} */ (document.getElementById('trim-video')),
  trimPreviewHit: /** @type {HTMLButtonElement} */ (document.getElementById('trim-preview-hit')),
  trimPreviewMute: /** @type {HTMLButtonElement} */ (document.getElementById('trim-preview-mute')),
  trimPreviewFullscreen: /** @type {HTMLButtonElement} */ (document.getElementById('trim-preview-fullscreen')),
  trimRail: /** @type {HTMLElement} */ (document.getElementById('trim-rail')),
  trimRange: /** @type {HTMLElement} */ (document.getElementById('trim-range')),
  trimHandleIn: /** @type {HTMLButtonElement} */ (document.getElementById('trim-handle-in')),
  trimHandleOut: /** @type {HTMLButtonElement} */ (document.getElementById('trim-handle-out')),
  trimReadout: /** @type {HTMLElement} */ (document.getElementById('trim-readout')),
  trimClipIndexTray: /** @type {HTMLElement} */ (document.getElementById('trim-clip-index-tray')),
  trimTimelineWrap: /** @type {HTMLElement} */ (document.getElementById('trim-timeline-wrap')),
  trimGlobalRail: /** @type {HTMLElement} */ (document.getElementById('trim-global-rail')),
  trimGlobalPlayhead: /** @type {HTMLButtonElement} */ (document.getElementById('trim-global-playhead')),
  trimGlobalReadout: /** @type {HTMLElement} */ (document.getElementById('trim-global-readout')),
  trimGlobalWrap: /** @type {HTMLElement} */ (document.getElementById('trim-global-wrap')),
  trimSpeedBlock: /** @type {HTMLElement | null} */ (document.getElementById('trim-speed-block')),
  trimPreviewSpeed: /** @type {HTMLInputElement | null} */ (document.getElementById('trim-preview-speed')),
  trimPreviewSpeedValue: /** @type {HTMLOutputElement | null} */ (document.getElementById('trim-preview-speed-value')),
  btnFolderTarget: /** @type {HTMLButtonElement | null} */ (document.getElementById('btn-folder-target')),
  btnFolderClear: /** @type {HTMLButtonElement | null} */ (document.getElementById('btn-folder-clear')),
  folderTargetLabel: /** @type {HTMLElement | null} */ (document.getElementById('folder-target-label')),
  renderOverlay: /** @type {HTMLElement | null} */ (document.getElementById('render-overlay')),
  renderOverlaySub: /** @type {HTMLElement | null} */ (document.getElementById('render-overlay-sub')),
  renderOverlayCancel: /** @type {HTMLButtonElement | null} */ (document.getElementById('render-overlay-cancel')),
  toastStack: /** @type {HTMLElement | null} */ (document.getElementById('toast-stack')),
  shareUploadEndpointInput: /** @type {HTMLInputElement | null} */ (
    document.getElementById('share-upload-endpoint-input')
  ),
  btnShareUploadEndpointSave: /** @type {HTMLButtonElement | null} */ (
    document.getElementById('btn-share-upload-endpoint-save')
  ),
}

/** @type {FileSystemDirectoryHandle | null} */
let renderFolderHandle = null
/** @type {AbortController | null} */
let _renderAbort = null

function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '—'
  const m = Math.floor(sec / 60)
  const sFloor = Math.floor(sec % 60)
  if (m === 0) return `${Math.round(sec * 100) / 100} วินาที`
  return `${m}:${String(sFloor).padStart(2, '0')} นาที`
}

function captureThumbnail(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = url

    const cleanup = () => {
      URL.revokeObjectURL(url)
      video.removeAttribute('src')
      video.load()
    }

    const fail = () => {
      cleanup()
      resolve(null)
    }

    video.addEventListener('error', fail, { once: true })

    video.addEventListener(
      'loadeddata',
      () => {
        const w = video.videoWidth
        const h = video.videoHeight
        if (!w || !h) {
          fail()
          return
        }
        const t =
          Number.isFinite(video.duration) && video.duration > 0.25
            ? Math.min(0.1, video.duration * 0.02)
            : 0.04
        video.currentTime = t
      },
      { once: true },
    )

    video.addEventListener(
      'seeked',
      () => {
        try {
          const w = video.videoWidth
          const h = video.videoHeight
          const tw = 160
          const th = Math.round(tw * (h / w))
          const canvas = document.createElement('canvas')
          canvas.width = tw
          canvas.height = th
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            fail()
            return
          }
          ctx.drawImage(video, 0, 0, tw, th)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
          cleanup()
          resolve(dataUrl)
        } catch {
          fail()
        }
      },
      { once: true },
    )
  })
}

function durationFromVideo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = url
    video.addEventListener('loadedmetadata', () => {
      const d = video.duration
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(d) ? d : 0)
    })
    video.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      resolve(0)
    })
  })
}

async function analyzeFile(file) {
  let durationSec = 0
  let fromProbe = false
  let probeErr = null

  try {
    const probe = await probeClip(file)
    durationSec = probe.durationSec
    fromProbe = true
  } catch (e) {
    probeErr = e instanceof Error ? e.message : String(e)
    durationSec = await durationFromVideo(file)
  }

  const thumbDataUrl = await captureThumbnail(file)

  return {
    durationSec,
    thumbDataUrl,
    fromProbe,
    error: fromProbe ? null : probeErr,
  }
}

function clipId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function filterVideoFiles(fileList) {
  return [...fileList].filter((f) => {
    const t = f.type
    const n = f.name.toLowerCase()
    return t === 'video/mp4' || t === 'video/quicktime' || n.endsWith('.mp4') || n.endsWith('.mov')
  })
}

/** ตรวจขนาดไฟล์ (≤ 50 MB ต่อคลิปตามดีไซน์) */
function checkFileSizeLimit(file) {
  if (file.size > MAX_CLIP_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    showToast(`ไฟล์ "${file.name}" ใหญ่ ${mb} MB — จำกัด 50 MB/คลิป`, 'error', 5000)
    return false
  }
  return true
}

async function addFiles(fileList) {
  const allVideos = filterVideoFiles(fileList)
  const files = allVideos.filter(checkFileSizeLimit)
  if (!files.length) return

  const placeholders = files.map((file) => {
    const clip = {
      id: clipId(),
      file,
      name: file.name,
      durationSec: 0,
      trimInSec: 0,
      trimOutSec: 0,
      thumbDataUrl: null,
      loading: true,
      error: null,
      fromProbe: false,
    }
    clips.push(clip)
    return clip
  })

  renderClipArrangeGrid()

  await Promise.all(
    placeholders.map(async (clip) => {
      const r = await analyzeFile(clip.file)
      clip.durationSec = r.durationSec
      clip.thumbDataUrl = r.thumbDataUrl
      clip.fromProbe = r.fromProbe
      clip.error = r.error
      clip.loading = false
      ensureClipTrim(clip)
    }),
  )

  /* ตัดคลิปที่ยาวเกิน 1.5 นาทีออก (ตามดีไซน์) */
  const overLimit = clips.filter(
    (c) => c.durationSec > MAX_CLIP_DURATION_SEC + 0.5 && placeholders.includes(c),
  )
  if (overLimit.length) {
    const names = overLimit.map((c) => `${c.name} (${c.durationSec.toFixed(1)}s)`).join(', ')
    showToast(`คลิปเกิน 1.5 นาที ถูกตัดออก: ${names}`, 'error', 6000)
    clips = clips.filter((c) => !overLimit.includes(c))
  }

  /* Speculative preload — warm browser media cache สำหรับคลิปที่เหลือ
     ไม่เก็บ reference (fire-and-forget) — browser จัด LRU cache เอง */
  if (shouldSpeculativelyPreload()) {
    for (const c of clips) {
      if (placeholders.includes(c)) warmClipVideoCache(c.file)
    }
  }

  renderClipArrangeGrid()
  syncButtons()
}

/**
 * Warm browser's media cache สำหรับคลิปหนึ่งไฟล์
 * สร้าง hidden <video preload="auto"> → self-cleanup ใน 30s
 * ไม่ควรทำบน mobile เก่า (RAM น้อย + battery)
 */
function warmClipVideoCache(file) {
  try {
    const v = document.createElement('video')
    v.preload = 'auto'
    v.muted = true
    v.playsInline = true
    const url = URL.createObjectURL(file)
    v.src = url
    v.load()
    const cleanup = () => {
      try { URL.revokeObjectURL(url) } catch { /* ignore */ }
      try { v.removeAttribute('src'); v.load() } catch { /* ignore */ }
    }
    v.addEventListener('loadeddata', () => setTimeout(cleanup, 0), { once: true })
    setTimeout(cleanup, 30_000)
  } catch {
    /* ignore — preload เป็น optional */
  }
}

function removeClip(id) {
  clips = clips.filter((c) => c.id !== id)
  if (!clips.length) lastExportVideo = null
  /* clip list เปลี่ยน → bg render ที่ยังรันอยู่ไม่ valid แล้ว */
  invalidateBgRender()
  renderClipArrangeGrid()
  syncButtons()
}

// ── Trim (step 3): duration + in/out on timeline ─────────────────────────────

const TRIM_MIN_GAP = 0.25

function snapTrimPreviewSpeed(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 1
  const clamped = Math.min(1.5, Math.max(1, n))
  return Math.round((clamped / 0.05) * 0.05 * 100) / 100
}

function syncTrimSpeedUI() {
  const s = trimPreviewPlaybackSpeed
  if (el.trimPreviewSpeed) {
    el.trimPreviewSpeed.value = String(s)
    el.trimPreviewSpeed.setAttribute('aria-valuenow', String(s))
    el.trimPreviewSpeed.setAttribute('aria-valuetext', `${s.toFixed(2)} เท่า`)
  }
  if (el.trimPreviewSpeedValue) {
    el.trimPreviewSpeedValue.textContent = `${s.toFixed(2)}×`
  }
}

function applyTrimPreviewPlaybackRate() {
  if (!el.trimVideo) return
  try {
    el.trimVideo.playbackRate = trimPreviewPlaybackSpeed
  } catch {
    /* ignore */
  }
}

function bindTrimPreviewSpeedOnce() {
  if (_trimPreviewSpeedBound) return
  _trimPreviewSpeedBound = true
  if (!el.trimPreviewSpeed) return
  el.trimPreviewSpeed.addEventListener('input', () => {
    trimPreviewPlaybackSpeed = snapTrimPreviewSpeed(parseFloat(el.trimPreviewSpeed.value))
    syncTrimSpeedUI()
    applyTrimPreviewPlaybackRate()
  })
}

function trimEffectiveGap(clip) {
  const d = trimDurationForClip(clip)
  return Math.min(TRIM_MIN_GAP, d / 2)
}

/** @type {string | null} */
let trimSelectedId = null
/** @type {string | null} */
let trimVideoUrl = null
/** @type {'in' | 'out' | null} */
let _trimDrag = null
let _trimPointersBound = false

/** Global playhead (seconds) on concatenated trim timeline (arrange order). */
let trimGlobalPlayheadSec = 0
/** Playhead handle is being dragged (scrub). */
let _globalPHScrub = false
/** Rail: pointer captured from background (not playhead). */
let _globalRailHasCapture = false
let _globalRailDragged = false
let _globalRailDownX = 0
let _globalRailDownY = 0
let _globalRailBound = false
let _trimVideoTimeBound = false
let _stepPillsBound = false
let _trimPreviewMuteBound = false
let _trimViewerHitBound = false
let _trimPreviewFullscreenBound = false
/** After concat advance, call play() when next clip metadata is ready. */
let _previewResumePlay = false
let _concatAdvancing = false
/** ความเร็วพรีวิววิดีโอ — 1.00 … 1.50 ขั้น 0.05 */
let trimPreviewPlaybackSpeed = 1
let _trimPreviewSpeedBound = false
let _trimHandleDownX = 0
let _trimHandleDownY = 0
let _trimHandleMoved = false
/** หลังลาก in/out — กด `click` ตามมาไม่ให้ขยับไทม์ไลน์รวม (ข้อ 4). */
let _suppressTrimHandleClick = false

/** Effective duration for trim math (probe and/or decoded video element). */
function trimDurationForClip(clip) {
  const cd = clip.durationSec || 0
  let vd = 0
  if (trimSelectedId === clip.id && el.trimVideo) {
    const t = el.trimVideo.duration
    if (Number.isFinite(t) && t > 0) vd = t
  }
  return Math.max(cd, vd, 0.01)
}

function clampTrim(clip) {
  const d = trimDurationForClip(clip)
  const effGap = trimEffectiveGap(clip)
  let a = clip.trimInSec
  let b = clip.trimOutSec
  if (!Number.isFinite(a)) a = 0
  if (!Number.isFinite(b)) b = d
  a = Math.max(0, Math.min(a, d - effGap))
  b = Math.max(effGap, Math.min(b, d))
  if (b < a + effGap) {
    b = Math.min(d, a + effGap)
    if (b < a + effGap) a = Math.max(0, b - effGap)
  }
  clip.trimInSec = a
  clip.trimOutSec = b
}

function ensureClipTrim(clip) {
  const d = trimDurationForClip(clip)
  if (!Number.isFinite(clip.trimInSec)) clip.trimInSec = 0
  if (!Number.isFinite(clip.trimOutSec)) clip.trimOutSec = d
  clampTrim(clip)
}

/** Reset every clip's in/out to full probed duration (ขั้น 5). */
function resetAllTrimsToProbedSource() {
  clips.forEach((c) => {
    const d = Math.max(c.durationSec || 0, 0.01)
    c.trimInSec = 0
    c.trimOutSec = d
    ensureClipTrim(c)
  })
}

function formatTrimTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec % 60)
  const m = Math.floor(sec / 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function getTrimSelectedClip() {
  return clips.find((c) => c.id === trimSelectedId) ?? null
}

function isTrimCaptionPreviewStep() {
  return step === 3 || step === 4
}

/** เวลาไฟล์บนคลิปปัจจุบันจาก playhead บนไทม์ไลน์รวม */
function seekFileSecForGlobalPlayhead() {
  const clip = getTrimSelectedClip() ?? clips[0] ?? null
  if (!clip) return 0
  const { starts } = globalStartsTotal()
  const i = clips.findIndex((c) => c.id === clip.id)
  if (i < 0) return clip.trimInSec
  const local = clip.trimInSec + (trimGlobalPlayheadSec - starts[i])
  return Math.max(clip.trimInSec, Math.min(clip.trimOutSec, local))
}

/** @returns {{ starts: number[], lens: number[], total: number }} */
function globalStartsTotal() {
  clips.forEach((c) => ensureClipTrim(c))
  const lens = clips.map((c) => Math.max(0, c.trimOutSec - c.trimInSec))
  const starts = /** @type {number[]} */ ([])
  let acc = 0
  for (const L of lens) {
    starts.push(acc)
    acc += L
  }
  return { starts, lens, total: acc }
}

/**
 * @param {number} g
 * @returns {{ clip: Clip | null, index: number, localFileSec: number, g: number }}
 */
function globalResolveG(g) {
  const { starts, lens, total } = globalStartsTotal()
  const gg = Math.max(0, Math.min(g, total))
  if (!clips.length || total <= 0) {
    return { clip: null, index: -1, localFileSec: 0, g: gg }
  }
  let i = 0
  for (; i < clips.length; i++) {
    if (gg < starts[i] + lens[i]) break
  }
  if (i >= clips.length) {
    const last = clips.length - 1
    const c = clips[last]
    return { clip: c, index: last, localFileSec: c.trimOutSec, g: gg }
  }
  const clip = clips[i]
  const localFileSec = clip.trimInSec + (gg - starts[i])
  return { clip, index: i, localFileSec, g: gg }
}

/** Map file time on a clip to global concatenated time. */
function fileTimeToGlobal(clipId, fileSec) {
  const { starts } = globalStartsTotal()
  const i = clips.findIndex((c) => c.id === clipId)
  if (i < 0) return 0
  const c = clips[i]
  const clamped = Math.max(c.trimInSec, Math.min(c.trimOutSec, fileSec))
  return starts[i] + (clamped - c.trimInSec)
}

/**
 * ตั้งตำแหน่ง global `g` แล้ว seek พรีวิวจากช่วงของ `clipId` เท่านั้น — ไม่สลับคลิป
 * (ขอบ out บน global เท่ากับจุดต่อคลิป; `globalResolveG` จะไปตกคลิปถัดไป)
 */
function applyGlobalPlayheadStayOnClip(g, clipId) {
  clips.forEach((c) => ensureClipTrim(c))
  const { total, starts } = globalStartsTotal()
  const gg = Math.max(0, Math.min(Number.isFinite(g) ? g : 0, total))
  trimGlobalPlayheadSec = gg
  updateGlobalPlayheadVisual()
  updateGlobalReadout()
  const clip = clips.find((c) => c.id === clipId)
  if (!clip || trimSelectedId !== clip.id || !el.trimVideo) return
  const i = clips.findIndex((c) => c.id === clipId)
  if (i < 0) return
  const local = clip.trimInSec + (gg - starts[i])
  const seek = Math.max(clip.trimInSec, Math.min(clip.trimOutSec, local))
  if (el.trimVideo.readyState >= 1) {
    try {
      el.trimVideo.currentTime = seek
    } catch {
      /* ignore */
    }
    updateTrimRailVisuals()
  }
}

/** คลิก in/out — ขยับไทม์ไลน์รวม + seek ที่จุดตัดบนคลิปปัจจุบัน (ไม่ไปคลิปถัดไป) */
function jumpGlobalPlayheadToClipFileTime(clipId, fileSec) {
  const clip = clips.find((c) => c.id === clipId)
  if (!clip) return
  clips.forEach((c) => ensureClipTrim(c))
  const g = fileTimeToGlobal(clip.id, fileSec)
  applyGlobalPlayheadStayOnClip(g, clipId)
}

function clampGlobalPlayhead() {
  const { total } = globalStartsTotal()
  trimGlobalPlayheadSec = Math.max(0, Math.min(trimGlobalPlayheadSec, total))
}

function updateGlobalPlayheadVisual() {
  if (!el.trimGlobalPlayhead) return
  const { total } = globalStartsTotal()
  if (total <= 0) {
    el.trimGlobalPlayhead.style.left = '0%'
    return
  }
  const pct = (trimGlobalPlayheadSec / total) * 100
  el.trimGlobalPlayhead.style.left = `${pct}%`
}

function updateGlobalReadout() {
  if (!el.trimGlobalReadout) return
  const { total } = globalStartsTotal()
  el.trimGlobalReadout.textContent = `${formatTrimTime(trimGlobalPlayheadSec)} / ${formatTrimTime(total)}`
}

function isTrimViewerFullscreen() {
  const w = el.trimViewerWrap
  if (!w) return false
  return document.fullscreenElement === w || document.webkitFullscreenElement === w
}

function syncTrimFullscreenButton() {
  const btn = el.trimPreviewFullscreen
  if (!btn) return
  const on = isTrimViewerFullscreen()
  btn.setAttribute('aria-pressed', on ? 'true' : 'false')
  btn.setAttribute('title', on ? 'ออกจากเต็มจอ' : 'พรีวิวเต็มจอ')
  btn.setAttribute('aria-label', on ? 'ออกจากเต็มจอ' : 'พรีวิวเต็มจอ กดอีกครั้งเพื่อออก')
  const icon = btn.querySelector('.trim-preview-fs-icon')
  if (icon) icon.textContent = on ? '⤓' : '⛶'
}

async function toggleTrimViewerFullscreen() {
  const w = el.trimViewerWrap
  if (!w) return
  try {
    if (isTrimViewerFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    } else if (w.requestFullscreen) {
      await w.requestFullscreen()
    } else if (w.webkitRequestFullscreen) {
      w.webkitRequestFullscreen()
    }
  } catch {
    /* ignore */
  }
  syncTrimFullscreenButton()
}

/** เล่นต่อคลิปถัดไปเมื่อถึง trim out หรือท้ายไฟล์ (พรีวิวต่อเนื่อง). */
function tryAdvancePreviewConcat() {
  if (_concatAdvancing || _trimDrag || _globalPHScrub || _globalRailDragged || _globalRailHasCapture) return
  const clip = getTrimSelectedClip()
  if (!clip || !el.trimVideo || el.trimVideo.paused) return
  const t = el.trimVideo.currentTime
  const dur = el.trimVideo.duration
  const atTrimOut = t >= clip.trimOutSec - 0.08
  const atFileEnd =
    Number.isFinite(dur) && dur > 0 && t >= dur - 0.12
  if (!atTrimOut && !atFileEnd) return
  const idx = clips.findIndex((c) => c.id === clip.id)
  if (idx < 0 || idx >= clips.length - 1) {
    el.trimVideo.pause()
    try {
      el.trimVideo.currentTime = Math.min(t, clip.trimOutSec)
    } catch {
      /* ignore */
    }
    trimGlobalPlayheadSec = fileTimeToGlobal(clip.id, el.trimVideo.currentTime)
    updateGlobalPlayheadVisual()
    updateGlobalReadout()
    return
  }
  const next = clips[idx + 1]
  _concatAdvancing = true
  _previewResumePlay = true
  selectTrimClip(next.id, next.trimInSec)
}

/** Seek preview video from global timeline position (concat order = clips order). */
function applyGlobalPlayhead(g) {
  clips.forEach((c) => ensureClipTrim(c))
  const { total } = globalStartsTotal()
  const gg = Math.max(0, Math.min(Number.isFinite(g) ? g : 0, total))
  trimGlobalPlayheadSec = gg
  const r = globalResolveG(gg)
  updateGlobalPlayheadVisual()
  updateGlobalReadout()
  if (!r.clip) return
  const seek = Math.max(r.clip.trimInSec, Math.min(r.clip.trimOutSec, r.localFileSec))
  if (r.clip.id !== trimSelectedId) {
    selectTrimClip(r.clip.id, seek)
  } else if (el.trimVideo && el.trimVideo.readyState >= 1) {
    try {
      el.trimVideo.currentTime = seek
    } catch {
      /* ignore */
    }
    updateTrimRailVisuals()
  }
}

function updateTrimReadout() {
  const clip = getTrimSelectedClip()
  if (!clip || !el.trimReadout) return
  const d = trimDurationForClip(clip)
  el.trimReadout.textContent = `${formatTrimTime(clip.trimInSec)} — ${formatTrimTime(clip.trimOutSec)} / ${formatTrimTime(d)}`
}

function updateTrimRailVisuals() {
  const clip = getTrimSelectedClip()
  if (!clip || !el.trimRail || !el.trimRange || !el.trimHandleIn || !el.trimHandleOut) return
  const d = trimDurationForClip(clip)
  clampTrim(clip)
  const pIn = (clip.trimInSec / d) * 100
  const pOut = (clip.trimOutSec / d) * 100
  const w = ((clip.trimOutSec - clip.trimInSec) / d) * 100
  el.trimRange.style.left = `${pIn}%`
  el.trimRange.style.width = `${Math.max(w, 0)}%`
  el.trimHandleIn.style.left = `${pIn}%`
  el.trimHandleOut.style.left = `${pOut}%`
  updateTrimReadout()
}

function renderTrimClipIndexTray() {
  if (!el.trimClipIndexTray) return
  el.trimClipIndexTray.innerHTML = clips
    .map(
      (c, index) =>
        `<button type="button" class="trim-clip-index-btn${c.id === trimSelectedId ? ' is-active' : ''}" data-trim-clip="${escapeAttr(c.id)}" role="tab" aria-selected="${c.id === trimSelectedId ? 'true' : 'false'}" aria-label="คลิป ${index + 1}">${index + 1}</button>`,
    )
    .join('')
}

/**
 * @param {string} id
 * @param {number} [seekFileSec] when set (from global scrub), keep `trimGlobalPlayheadSec`; after load seek here
 */
function selectTrimClip(id, seekFileSec) {
  const clip = clips.find((c) => c.id === id)
  if (!clip) return
  trimSelectedId = id
  renderTrimClipIndexTray()

  const fromChip = typeof seekFileSec !== 'number' || !Number.isFinite(seekFileSec)
  if (fromChip) {
    const { starts } = globalStartsTotal()
    const idx = clips.findIndex((c) => c.id === id)
    trimGlobalPlayheadSec = idx >= 0 && starts[idx] !== undefined ? starts[idx] : 0
    clampGlobalPlayhead()
    updateGlobalPlayheadVisual()
    updateGlobalReadout()
  }

  if (!el.trimVideo) {
    ensureClipTrim(clip)
    updateTrimRailVisuals()
    return
  }

  if (trimVideoUrl) {
    URL.revokeObjectURL(trimVideoUrl)
    trimVideoUrl = null
  }
  el.trimVideo.pause()
  el.trimVideo.removeAttribute('src')
  el.trimVideo.load()

  trimVideoUrl = URL.createObjectURL(clip.file)
  el.trimVideo.src = trimVideoUrl

  const onMeta = () => {
    _concatAdvancing = false
    ensureClipTrim(clip)
    updateTrimRailVisuals()
    const seek =
      typeof seekFileSec === 'number' && Number.isFinite(seekFileSec)
        ? Math.max(clip.trimInSec, Math.min(clip.trimOutSec, seekFileSec))
        : clip.trimInSec
    el.trimVideo.volume = 1
    el.trimVideo.muted = el.trimPreviewMute?.getAttribute('aria-pressed') === 'true'
    el.trimVideo.currentTime = seek
    applyTrimPreviewPlaybackRate()
    el.trimVideo.removeEventListener('loadedmetadata', onMeta)
    syncTrimPreviewMuteButton()
    updateGlobalPlayheadVisual()
    updateGlobalReadout()
    if (_previewResumePlay) {
      _previewResumePlay = false
      el.trimVideo.play().catch(() => {})
    }
  }
  el.trimVideo.addEventListener('loadedmetadata', onMeta)

  ensureClipTrim(clip)
  updateTrimRailVisuals()
}

/** หยุดพรีวิวชั่วคราว — ไม่ revoke URL (ใช้ตอนไป Step Caption) */
function pauseTrimPreviewForCaption() {
  _globalPHScrub = false
  _globalRailHasCapture = false
  _globalRailDragged = false
  _previewResumePlay = false
  _concatAdvancing = false
  el.trimGlobalWrap?.classList.remove('is-global-scrub')
  if (el.trimViewerWrap && isTrimViewerFullscreen()) {
    try {
      if (document.exitFullscreen) document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    } catch {
      /* ignore */
    }
  }
  syncTrimFullscreenButton()
  el.trimVideo?.pause()
}

/** คืนทรัพยากรพรีวิวทั้งหมด (กลับขั้นนำเข้า / ออกจาก flow) */
function releaseTrimPreviewResources() {
  _globalPHScrub = false
  _globalRailHasCapture = false
  _globalRailDragged = false
  _previewResumePlay = false
  _concatAdvancing = false
  el.trimGlobalWrap?.classList.remove('is-global-scrub')
  if (el.trimViewerWrap && isTrimViewerFullscreen()) {
    try {
      if (document.exitFullscreen) document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    } catch {
      /* ignore */
    }
  }
  syncTrimFullscreenButton()
  if (trimVideoUrl) {
    URL.revokeObjectURL(trimVideoUrl)
    trimVideoUrl = null
  }
  if (el.trimVideo) {
    el.trimVideo.pause()
    el.trimVideo.removeAttribute('src')
    el.trimVideo.load()
  }
  trimSelectedId = null
  _trimDrag = null
  trimGlobalPlayheadSec = 0
  el.trimTimelineWrap?.classList.remove('is-trimming')
  trimPreviewPlaybackSpeed = 1
  syncTrimSpeedUI()
}

/**
 * @param {boolean} resetFromImport true = จากขั้นนำเข้า (รีเซ็ต trim + mute)
 */
function enterTrimStep(resetFromImport = true) {
  if (resetFromImport) {
    trimPreviewPlaybackSpeed = 1
    syncTrimSpeedUI()
    resetAllTrimsToProbedSource()
    if (el.trimPreviewMute) {
      el.trimPreviewMute.setAttribute('aria-pressed', 'false')
      const icon = el.trimPreviewMute.querySelector('.trim-preview-mute-icon')
      if (icon) icon.textContent = '🔊'
      el.trimPreviewMute.setAttribute('aria-label', 'ปิดเสียงพรีวิว')
      el.trimPreviewMute.setAttribute('title', 'ปิดเสียงพรีวิว')
    }
    if (el.trimVideo) {
      el.trimVideo.muted = false
      el.trimVideo.volume = 1
    }
  }
  bindTrimPointerHandlers()
  bindGlobalPreviewOnce()
  bindTrimPreviewMuteOnce()
  bindTrimPreviewSpeedOnce()

  if (!clips.length) {
    trimSelectedId = null
    if (trimVideoUrl) {
      URL.revokeObjectURL(trimVideoUrl)
      trimVideoUrl = null
    }
    if (el.trimVideo) {
      el.trimVideo.pause()
      el.trimVideo.removeAttribute('src')
      el.trimVideo.load()
    }
    renderTrimClipIndexTray()
    if (el.trimReadout) el.trimReadout.textContent = '—'
    updateGlobalPlayheadVisual()
    updateGlobalReadout()
    return
  }

  if (resetFromImport) {
    trimGlobalPlayheadSec = 0
    selectTrimClip(clips[0].id)
  } else {
    const id =
      trimSelectedId && clips.some((c) => c.id === trimSelectedId) ? trimSelectedId : clips[0].id
    const seek = seekFileSecForGlobalPlayhead()
    selectTrimClip(id, seek)
  }
}

function onTrimClipIndexTrayClick(e) {
  if (!el.trimClipIndexTray) return
  const btn = e.target.closest?.('[data-trim-clip]')
  if (!btn || !el.trimClipIndexTray.contains(btn)) return
  const id = btn.getAttribute('data-trim-clip')
  if (id) selectTrimClip(id)
}

function bindTrimClipIndexTrayOnce() {
  if (!el.trimClipIndexTray || el.trimClipIndexTray.dataset.trimClipBound === '1') return
  el.trimClipIndexTray.dataset.trimClipBound = '1'
  el.trimClipIndexTray.addEventListener('click', onTrimClipIndexTrayClick)
}

function onTrimHandlePointerDown(e) {
  if (e.button !== 0) return
  const t = /** @type {HTMLElement} */ (e.currentTarget)
  _trimHandleDownX = e.clientX
  _trimHandleDownY = e.clientY
  _trimHandleMoved = false
  _suppressTrimHandleClick = false
  _trimDrag = t.id === 'trim-handle-in' ? 'in' : 'out'
  t.setPointerCapture(e.pointerId)
  el.trimTimelineWrap?.classList.add('is-trimming')
}

function onTrimHandlePointerMove(e) {
  if (!_trimDrag) return
  if (Math.abs(e.clientX - _trimHandleDownX) > 4 || Math.abs(e.clientY - _trimHandleDownY) > 4) {
    _trimHandleMoved = true
  }
  const clip = getTrimSelectedClip()
  if (!clip || !el.trimRail) return
  const rect = el.trimRail.getBoundingClientRect()
  if (rect.width <= 0) return
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const d = trimDurationForClip(clip)
  const t = ratio * d
  const g = trimEffectiveGap(clip)
  if (_trimDrag === 'in') {
    clip.trimInSec = Math.min(t, clip.trimOutSec - g)
  } else {
    clip.trimOutSec = Math.max(t, clip.trimInSec + g)
  }
  clampTrim(clip)
  updateTrimRailVisuals()
  if (el.trimVideo) {
    el.trimVideo.currentTime = _trimDrag === 'out' ? clip.trimOutSec : clip.trimInSec
  }
  clampGlobalPlayhead()
  updateGlobalPlayheadVisual()
  updateGlobalReadout()
}

function onTrimHandlePointerUp(e) {
  if (!_trimDrag) return
  const t = /** @type {HTMLElement} */ (e.currentTarget)
  try {
    t.releasePointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
  _trimDrag = null
  el.trimTimelineWrap?.classList.remove('is-trimming')
  if (_trimHandleMoved) {
    _suppressTrimHandleClick = true
    clampGlobalPlayhead()
    const c = getTrimSelectedClip()
    if (c) applyGlobalPlayheadStayOnClip(trimGlobalPlayheadSec, c.id)
    else applyGlobalPlayhead(trimGlobalPlayheadSec)
  }
}

/** คลิก handle = ขยับไทม์ไลน์รวมเท่านั้น (ข้อ 3) — ไม่สลับคลิป. */
function onTrimHandleInClick(e) {
  e.stopPropagation()
  if (_suppressTrimHandleClick) {
    _suppressTrimHandleClick = false
    return
  }
  const clip = getTrimSelectedClip()
  if (!clip) return
  jumpGlobalPlayheadToClipFileTime(clip.id, clip.trimInSec)
}

function onTrimHandleOutClick(e) {
  e.stopPropagation()
  if (_suppressTrimHandleClick) {
    _suppressTrimHandleClick = false
    return
  }
  const clip = getTrimSelectedClip()
  if (!clip) return
  jumpGlobalPlayheadToClipFileTime(clip.id, clip.trimOutSec)
}

function onTrimGlobalSetFromClient(clientX) {
  if (!el.trimGlobalRail) return
  const rect = el.trimGlobalRail.getBoundingClientRect()
  if (rect.width <= 0) return
  const { total } = globalStartsTotal()
  if (total <= 0) return
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  applyGlobalPlayhead(ratio * total)
}

function togglePreviewPlayPause() {
  if (!el.trimVideo?.src) return
  if (el.trimVideo.paused) {
    el.trimVideo.volume = 1
    el.trimVideo.muted = el.trimPreviewMute?.getAttribute('aria-pressed') === 'true'
    applyTrimPreviewPlaybackRate()
    el.trimVideo.play().catch(() => {})
  } else {
    el.trimVideo.pause()
  }
}

function onTrimGlobalRailPointerDown(e) {
  if (e.button !== 0) return
  if (el.trimGlobalPlayhead && (e.target === el.trimGlobalPlayhead || el.trimGlobalPlayhead.contains(/** @type {Node} */ (e.target)))) {
    return
  }
  _globalRailHasCapture = true
  _globalRailDragged = false
  _globalRailDownX = e.clientX
  _globalRailDownY = e.clientY
  el.trimGlobalRail.setPointerCapture(e.pointerId)
}

function onTrimGlobalRailPointerMove(e) {
  if (!_globalRailHasCapture) return
  const dx = e.clientX - _globalRailDownX
  const dy = e.clientY - _globalRailDownY
  if (!_globalRailDragged && dx * dx + dy * dy > 64) {
    _globalRailDragged = true
    el.trimGlobalWrap?.classList.add('is-global-scrub')
    onTrimGlobalSetFromClient(e.clientX)
  } else if (_globalRailDragged) {
    onTrimGlobalSetFromClient(e.clientX)
  }
}

function onTrimGlobalRailPointerUp(e) {
  if (!_globalRailHasCapture) return
  _globalRailHasCapture = false
  try {
    el.trimGlobalRail.releasePointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
  if (!_globalRailDragged) {
    onTrimGlobalSetFromClient(e.clientX)
  }
  _globalRailDragged = false
  el.trimGlobalWrap?.classList.remove('is-global-scrub')
}

function onTrimGlobalPlayheadDown(e) {
  if (e.button !== 0) return
  _globalPHScrub = true
  el.trimGlobalWrap?.classList.add('is-global-scrub')
  el.trimGlobalPlayhead.setPointerCapture(e.pointerId)
}

function onTrimGlobalPlayheadMove(e) {
  if (!_globalPHScrub) return
  onTrimGlobalSetFromClient(e.clientX)
}

function onTrimGlobalPlayheadUp(e) {
  if (!_globalPHScrub) return
  _globalPHScrub = false
  el.trimGlobalWrap?.classList.remove('is-global-scrub')
  try {
    el.trimGlobalPlayhead.releasePointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
}

/** จบไฟล์แล้วยังมีคลิปถัดไป — ต่อเลย (กรณี trimOut ชิดท้ายไฟล์ / `ended`). */
function onTrimPreviewVideoEnded() {
  if (!isTrimCaptionPreviewStep() || _concatAdvancing || _trimDrag) return
  const clip = getTrimSelectedClip()
  if (!clip) return
  const idx = clips.findIndex((c) => c.id === clip.id)
  if (idx < 0 || idx >= clips.length - 1) return
  _concatAdvancing = true
  _previewResumePlay = true
  const next = clips[idx + 1]
  selectTrimClip(next.id, next.trimInSec)
}

function bindTrimVideoTimeSyncOnce() {
  if (_trimVideoTimeBound || !el.trimVideo) return
  _trimVideoTimeBound = true
  el.trimVideo.addEventListener('timeupdate', () => {
    if (!isTrimCaptionPreviewStep() || _globalPHScrub || _globalRailDragged || _globalRailHasCapture || _trimDrag)
      return
    const clip = getTrimSelectedClip()
    if (!clip || !trimSelectedId || el.trimVideo.paused) return
    trimGlobalPlayheadSec = fileTimeToGlobal(clip.id, el.trimVideo.currentTime)
    updateGlobalPlayheadVisual()
    updateGlobalReadout()
    tryAdvancePreviewConcat()
  })
  el.trimVideo.addEventListener('ended', onTrimPreviewVideoEnded)
}

function bindTrimViewerHitOnce() {
  if (_trimViewerHitBound || !el.trimPreviewHit) return
  _trimViewerHitBound = true
  el.trimPreviewHit.addEventListener('click', () => togglePreviewPlayPause())
}

function bindGlobalPreviewOnce() {
  if (_globalRailBound) return
  if (!el.trimGlobalRail || !el.trimGlobalPlayhead || !el.trimGlobalWrap) return
  _globalRailBound = true
  bindTrimVideoTimeSyncOnce()
  el.trimGlobalRail.addEventListener('pointerdown', onTrimGlobalRailPointerDown)
  el.trimGlobalRail.addEventListener('pointermove', onTrimGlobalRailPointerMove)
  el.trimGlobalRail.addEventListener('pointerup', onTrimGlobalRailPointerUp)
  el.trimGlobalRail.addEventListener('pointercancel', onTrimGlobalRailPointerUp)
  el.trimGlobalPlayhead.addEventListener('pointerdown', onTrimGlobalPlayheadDown)
  el.trimGlobalPlayhead.addEventListener('pointermove', onTrimGlobalPlayheadMove)
  el.trimGlobalPlayhead.addEventListener('pointerup', onTrimGlobalPlayheadUp)
  el.trimGlobalPlayhead.addEventListener('pointercancel', onTrimGlobalPlayheadUp)
}

function bindTrimPointerHandlers() {
  if (_trimPointersBound) return
  if (!el.trimHandleIn || !el.trimHandleOut) return
  _trimPointersBound = true
  bindTrimClipIndexTrayOnce()
  el.trimHandleIn.addEventListener('pointerdown', onTrimHandlePointerDown)
  el.trimHandleIn.addEventListener('pointermove', onTrimHandlePointerMove)
  el.trimHandleIn.addEventListener('pointerup', onTrimHandlePointerUp)
  el.trimHandleIn.addEventListener('pointercancel', onTrimHandlePointerUp)
  el.trimHandleOut.addEventListener('pointerdown', onTrimHandlePointerDown)
  el.trimHandleOut.addEventListener('pointermove', onTrimHandlePointerMove)
  el.trimHandleOut.addEventListener('pointerup', onTrimHandlePointerUp)
  el.trimHandleOut.addEventListener('pointercancel', onTrimHandlePointerUp)
  el.trimHandleIn.addEventListener('click', onTrimHandleInClick)
  el.trimHandleOut.addEventListener('click', onTrimHandleOutClick)
}

function thumbBlock(clip) {
  if (clip.loading) {
    return `<div class="thumb-916"><div class="thumb-skel">กำลังอ่าน…</div></div>`
  }
  if (clip.thumbDataUrl) {
    return `<div class="thumb-916"><img src="${clip.thumbDataUrl}" alt="" decoding="async" draggable="false"></div>`
  }
  return `<div class="thumb-916"><div class="thumb-skel">ไม่มีภาพ</div></div>`
}

function renderClipArrangeGrid() {
  if (!clips.length) {
    el.clipArrangeGrid.innerHTML =
      '<p class="grid-empty">ยังไม่มีคลิป</p>'
    return
  }

  el.clipArrangeGrid.innerHTML = clips
    .map(
      (c, index) => `
    <article class="arrange-card" draggable="false" data-index="${index}" data-id="${c.id}">
      <div class="arrange-card-inner">
        <button type="button" class="arrange-drag-handle" draggable="true" aria-label="ลากจัดลำดับ"></button>
        <button type="button" class="btn-remove-corner" draggable="false" data-remove="${c.id}" aria-label="ลบคลิป"></button>
        ${thumbBlock(c)}
        <div class="arrange-card-body">
          <div class="clip-name" title="${escapeAttr(c.name)}">${escapeHtml(c.name)}</div>
          <div class="clip-meta">${
            c.loading ? '…' : formatDuration(c.durationSec)
          }${c.error ? ' · <span class="warn-text">สำรอง</span>' : ''}</div>
        </div>
      </div>
    </article>`,
    )
    .join('')
}

/** Reorder existing cards in the DOM to match `clips` (avoids full innerHTML rebuild). */
function reorderClipArrangeDOM() {
  const grid = el.clipArrangeGrid
  const articles = [...grid.querySelectorAll('.arrange-card')]
  if (articles.length === 0 || articles.length !== clips.length) {
    renderClipArrangeGrid()
    return
  }
  const byId = new Map(articles.map((a) => [a.dataset.id, a]))
  for (const c of clips) {
    if (!byId.has(c.id)) {
      renderClipArrangeGrid()
      return
    }
  }
  const frag = document.createDocumentFragment()
  for (const c of clips) {
    const node = byId.get(c.id)
    if (node) frag.appendChild(node)
  }
  grid.appendChild(frag)
  grid.querySelectorAll('.arrange-card').forEach((article, i) => {
    article.dataset.index = String(i)
  })
}

// ── Arrange reorder: hit-test + floating ghost (HTML5 DnD + touch long-press) ──

/** @type {HTMLElement | null} */
let _dragGhostEl = null
let _ghostOffsetX = 0
let _ghostOffsetY = 0

function cardAtPoint(x, y) {
  const els = document.elementsFromPoint(x, y)
  for (const node of els) {
    const card = node.closest?.('.arrange-card')
    if (card) return /** @type {HTMLElement} */ (card)
  }
  return null
}

function removeArrangeDragGhost() {
  _dragGhostEl?.remove()
  _dragGhostEl = null
}

function createArrangeDragGhost(card, clientX, clientY) {
  removeArrangeDragGhost()
  const rect = card.getBoundingClientRect()
  const clone = /** @type {HTMLElement} */ (card.cloneNode(true))
  clone.classList.add('arrange-drag-ghost')
  clone.removeAttribute('draggable')
  clone
    .querySelectorAll('[data-remove], .btn-remove-corner, .arrange-drag-handle')
    .forEach((b) => b.remove())
  _ghostOffsetX = clientX - rect.left
  _ghostOffsetY = clientY - rect.top
  clone.style.width = `${rect.width}px`
  clone.style.boxSizing = 'border-box'
  document.body.appendChild(clone)
  _dragGhostEl = clone
  positionArrangeDragGhost(clientX, clientY)
}

function positionArrangeDragGhost(clientX, clientY) {
  if (!_dragGhostEl) return
  _dragGhostEl.style.left = `${clientX - _ghostOffsetX}px`
  _dragGhostEl.style.top = `${clientY - _ghostOffsetY}px`
}

function clearDropSlotPreview() {
  el.clipArrangeGrid
    .querySelectorAll('.arrange-card.drop-slot-before, .arrange-card.drop-slot-after')
    .forEach((c) => c.classList.remove('drop-slot-before', 'drop-slot-after'))
}

/** @returns {{ card: HTMLElement, before: boolean, rawInsert: number } | null} */
function dropTargetFromPointer(clientX, clientY) {
  const over = cardAtPoint(clientX, clientY)
  if (!over) return null
  const idx = parseInt(over.dataset.index ?? '-1', 10)
  if (idx < 0) return null
  const rect = over.getBoundingClientRect()
  const before = clientX < rect.left + rect.width / 2
  const n = clips.length
  const rawInsert = Math.max(0, Math.min(before ? idx : idx + 1, n))
  return { card: over, before, rawInsert }
}

function updateDropSlotPreview(clientX, clientY) {
  clearDropSlotPreview()
  const hit = dropTargetFromPointer(clientX, clientY)
  if (!hit) return
  hit.card.classList.add(hit.before ? 'drop-slot-before' : 'drop-slot-after')
}

function applyReorderAtRawInsert(from, rawInsert) {
  const n = clips.length
  if (from < 0 || from >= n) return
  const to = Math.max(0, Math.min(rawInsert, n))
  if (to === from || to === from + 1) return
  const [item] = clips.splice(from, 1)
  const insertAt = from < to ? to - 1 : to
  clips.splice(insertAt, 0, item)
  reorderClipArrangeDOM()
}

function abortArrangeInteraction() {
  document.removeEventListener('drag', onArrangeDocumentDrag)
  clearTimeout(_touchTimer)
  _touchTimer = null
  removeArrangeDragGhost()
  clearDropSlotPreview()
  dragFromIndex = null
  el.clipArrangeGrid.querySelectorAll('.arrange-card.dragging').forEach((c) =>
    c.classList.remove('dragging'),
  )
  _touchCard = null
  _touchActive = false
  _touchFrom = null
}

function onArrangeDocumentDrag(e) {
  if (dragFromIndex == null) return
  if (e.clientX === 0 && e.clientY === 0) return
  positionArrangeDragGhost(e.clientX, e.clientY)
  updateDropSlotPreview(e.clientX, e.clientY)
}

/** @param {HTMLElement} handle */
function onHandleDragStart(e, handle) {
  const card = handle.closest('.arrange-card')
  if (!card) return
  dragFromIndex = parseInt(card.dataset.index ?? '-1', 10)
  card.classList.add('dragging')
  e.dataTransfer?.setData('text/plain', String(dragFromIndex))
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      e.dataTransfer.setDragImage(canvas, 0, 0)
    } catch {
      /* ignore */
    }
  }
  createArrangeDragGhost(card, e.clientX, e.clientY)
  document.addEventListener('drag', onArrangeDocumentDrag)
}

/** @param {HTMLElement} handle */
function onHandleDragEnd(e, handle) {
  document.removeEventListener('drag', onArrangeDocumentDrag)
  handle.closest('.arrange-card')?.classList.remove('dragging')
  removeArrangeDragGhost()
  clearDropSlotPreview()
  dragFromIndex = null
}

function onGridHandleDragStart(e) {
  const handle = e.target.closest?.('.arrange-drag-handle')
  if (!handle || !el.clipArrangeGrid.contains(handle)) return
  onHandleDragStart(/** @type {DragEvent} */ (e), handle)
}

function onGridHandleDragEnd(e) {
  const handle = e.target.closest?.('.arrange-drag-handle')
  if (!handle || !el.clipArrangeGrid.contains(handle)) return
  onHandleDragEnd(/** @type {DragEvent} */ (e), handle)
}

function onGridArrangeDragOver(e) {
  const card = e.target.closest?.('.arrange-card')
  if (!card || !el.clipArrangeGrid.contains(card)) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  if (dragFromIndex == null) return
  positionArrangeDragGhost(e.clientX, e.clientY)
  updateDropSlotPreview(e.clientX, e.clientY)
}

function onGridArrangeDrop(e) {
  const card = e.target.closest?.('.arrange-card')
  if (!card || !el.clipArrangeGrid.contains(card)) return
  e.preventDefault()
  clearDropSlotPreview()
  removeArrangeDragGhost()
  const from = dragFromIndex
  dragFromIndex = null
  document.removeEventListener('drag', onArrangeDocumentDrag)
  if (from == null) return
  const hit = dropTargetFromPointer(e.clientX, e.clientY)
  if (hit) applyReorderAtRawInsert(from, hit.rawInsert)
}

// ── Touch reorder on handle only (iOS / Android; bypasses HTML5 DnD) ─────────

/** Shorter on dedicated handle (less conflict with page scroll). */
const LONG_PRESS_MS = 260

function cancelPendingLongPress() {
  clearTimeout(_touchTimer)
  _touchTimer = null
  _touchCard?.classList.remove('dragging')
  _touchCard = null
}

/** @param {HTMLElement} handle */
function onHandleTouchStart(e, handle) {
  if (e.touches.length !== 1) return
  const card = handle.closest('.arrange-card')
  if (!card) return
  const t = e.touches[0]
  _touchStartX = t.clientX
  _touchStartY = t.clientY
  _touchLastX = t.clientX
  _touchLastY = t.clientY
  _touchCard = card
  _touchActive = false
  _touchFrom = null

  clearTimeout(_touchTimer)
  _touchTimer = setTimeout(() => {
    _touchTimer = null
    _touchFrom = parseInt(card.dataset.index ?? '-1', 10)
    _touchActive = true
    card.classList.add('dragging')
    createArrangeDragGhost(card, _touchLastX, _touchLastY)
    if (navigator.vibrate) navigator.vibrate(10)
  }, LONG_PRESS_MS)
}

function onGridHandleTouchStart(e) {
  const handle = e.target.closest?.('.arrange-drag-handle')
  if (!handle || !el.clipArrangeGrid.contains(handle)) return
  onHandleTouchStart(e, handle)
}

function onHandleTouchMove(e) {
  if (!_touchCard && !_touchTimer && !_touchActive) return
  if (e.touches.length !== 1) {
    if (_touchActive) abortArrangeInteraction()
    else cancelPendingLongPress()
    return
  }
  const touch = e.touches[0]
  _touchLastX = touch.clientX
  _touchLastY = touch.clientY
  if (!_touchActive) {
    const dx = Math.abs(touch.clientX - _touchStartX)
    const dy = Math.abs(touch.clientY - _touchStartY)
    const dist = Math.hypot(dx, dy)
    const verticalScrollIntent = dy > 36 && dy > dx * 1.2
    const largeMove = dist > 44
    if (verticalScrollIntent || largeMove) cancelPendingLongPress()
    return
  }
  // Native scroll may own the gesture — touchmove is then non-cancelable.
  if (!e.cancelable) {
    abortArrangeInteraction()
    return
  }
  e.preventDefault()
  positionArrangeDragGhost(touch.clientX, touch.clientY)
  updateDropSlotPreview(touch.clientX, touch.clientY)
}

function finishTouchReorderAbort() {
  abortArrangeInteraction()
}

function onHandleTouchEnd(e) {
  clearTimeout(_touchTimer)
  _touchTimer = null
  if (!_touchActive || _touchFrom == null) {
    _touchCard?.classList.remove('dragging')
    _touchCard = null
    _touchActive = false
    _touchFrom = null
    return
  }

  const from = _touchFrom
  const touch = e.changedTouches[0]
  clearDropSlotPreview()
  removeArrangeDragGhost()
  const hit = dropTargetFromPointer(touch.clientX, touch.clientY)
  if (hit) applyReorderAtRawInsert(from, hit.rawInsert)
  el.clipArrangeGrid.querySelectorAll('.arrange-card.dragging').forEach((c) =>
    c.classList.remove('dragging'),
  )
  _touchCard = null
  _touchActive = false
  _touchFrom = null
}

function onGridArrangeClick(e) {
  const btn = e.target.closest?.('[data-remove]')
  if (!btn || !el.clipArrangeGrid.contains(btn)) return
  e.stopPropagation()
  e.preventDefault()
  const id = btn.getAttribute('data-remove')
  if (id) removeClip(id)
}

function bindClipArrangeGrid() {
  const grid = el.clipArrangeGrid
  if (grid.dataset.arrangeBound === '1') return
  grid.dataset.arrangeBound = '1'
  grid.addEventListener('click', onGridArrangeClick)
  grid.addEventListener('dragstart', onGridHandleDragStart)
  grid.addEventListener('dragend', onGridHandleDragEnd)
  grid.addEventListener('dragover', onGridArrangeDragOver)
  grid.addEventListener('drop', onGridArrangeDrop)
  grid.addEventListener('touchstart', onGridHandleTouchStart, { passive: false })
}

function onDocumentTouchStartMaybeAbortArrange(e) {
  if (!_touchActive && !_touchTimer && dragFromIndex == null) return
  const path = e.composedPath?.() ?? []
  for (const node of path) {
    if (node instanceof Element && (node === el.clipArrangeGrid || el.clipArrangeGrid.contains(node)))
      return
  }
  abortArrangeInteraction()
}

function onDocumentKeydownArrangeEscape(e) {
  if (e.key !== 'Escape') return
  if (!_touchActive && !_touchTimer && dragFromIndex == null) return
  abortArrangeInteraction()
}

function bindArrangeSafetyNet() {
  if (document.documentElement.dataset.arrangeSafety === '1') return
  document.documentElement.dataset.arrangeSafety = '1'
  document.addEventListener('touchstart', onDocumentTouchStartMaybeAbortArrange, true)
  document.addEventListener('touchmove', onDocumentTouchMoveArrange, { capture: true, passive: false })
  document.addEventListener('touchend', onDocumentTouchEndArrange, true)
  document.addEventListener('touchcancel', onDocumentTouchEndArrange, true)
  document.addEventListener('keydown', onDocumentKeydownArrangeEscape)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) abortArrangeInteraction()
  })
}

function onDocumentTouchMoveArrange(e) {
  if (!_touchCard && !_touchTimer && !_touchActive) return
  onHandleTouchMove(e)
}

function onDocumentTouchEndArrange(e) {
  if (!_touchCard && !_touchTimer && !_touchActive) return
  onHandleTouchEnd(e)
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;')
}

function syncButtons() {
  const busy = clips.some((c) => c.loading)
  const has = clips.length > 0
  el.btnNext.disabled = !has || busy
  if (el.btnTrimNext) {
    el.btnTrimNext.disabled = step !== 3 || !has || busy
  }
  syncCaptionStep4Buttons()
}

/* ── Overlay / Toast / Folder helpers ─────────────────────────────────── */

function showRenderOverlay(message) {
  if (!el.renderOverlay) return
  if (el.renderOverlaySub) el.renderOverlaySub.textContent = message || 'กำลังเตรียมไฟล์'
  el.renderOverlay.classList.remove('hidden')
}

function updateRenderOverlay(message) {
  if (el.renderOverlaySub) el.renderOverlaySub.textContent = message || ''
}

function hideRenderOverlay() {
  if (!el.renderOverlay) return
  el.renderOverlay.classList.add('hidden')
}

function showToast(message, variant = 'ok', durationMs = 4000) {
  if (!el.toastStack) {
    window.alert(message)
    return
  }
  const toast = document.createElement('div')
  toast.className = `toast toast--${variant}`
  toast.setAttribute('role', variant === 'error' ? 'alert' : 'status')
  const icon = document.createElement('span')
  icon.className = 'toast-icon'
  icon.setAttribute('aria-hidden', 'true')
  icon.textContent = variant === 'ok' ? '✓' : variant === 'warn' ? '!' : variant === 'error' ? '⚠' : '•'
  const body = document.createElement('div')
  body.className = 'toast-body'
  body.textContent = message
  toast.append(icon, body)
  el.toastStack.appendChild(toast)

  const dismiss = () => {
    if (!toast.isConnected) return
    toast.classList.add('is-leaving')
    setTimeout(() => toast.remove(), 240)
  }
  setTimeout(dismiss, Math.max(1500, durationMs))
  toast.addEventListener('click', dismiss)
}

function folderLabelFromHandle(handle) {
  if (!handle) return 'โฟลเดอร์ปลายทาง: ตามค่าเบราว์เซอร์'
  const name = handle.name || 'โฟลเดอร์ที่เลือก'
  return `ปลายทาง: ${name}`
}

function syncFolderTargetUI() {
  if (!el.btnFolderTarget || !el.folderTargetLabel) return
  const hasHandle = !!renderFolderHandle
  el.btnFolderTarget.dataset.set = hasHandle ? 'true' : 'false'
  el.folderTargetLabel.textContent = folderLabelFromHandle(renderFolderHandle)
  if (el.btnFolderClear) el.btnFolderClear.classList.toggle('hidden', !hasHandle)
  if (!isFolderPickerSupported()) {
    el.btnFolderTarget.setAttribute('disabled', 'true')
    el.folderTargetLabel.textContent = 'เบราว์เซอร์นี้ไม่รองรับเลือกโฟลเดอร์ (ใช้โฟลเดอร์ดาวน์โหลด)'
  }
}

async function initRenderFolderHandle() {
  if (!isFolderPickerSupported()) {
    syncFolderTargetUI()
    return
  }
  try {
    const saved = await loadRenderFolderHandle()
    if (saved) renderFolderHandle = saved
  } catch {
    /* ignore */
  }
  syncFolderTargetUI()
}

function bindFolderTargetOnce() {
  el.btnFolderTarget?.addEventListener('click', async () => {
    if (!isFolderPickerSupported()) {
      showToast('เบราว์เซอร์นี้ยังไม่รองรับเลือกโฟลเดอร์ — จะบันทึกลงโฟลเดอร์ดาวน์โหลด', 'warn')
      return
    }
    // ถ้ามี handle เดิมแล้ว กดอีกครั้ง = ตรวจ/ขอสิทธิ์ใหม่ (หรือเปลี่ยนโฟลเดอร์ถ้าจำเป็น)
    if (renderFolderHandle) {
      const ok = await ensureFolderPermission(renderFolderHandle)
      if (ok) {
        showToast(`พร้อมบันทึกลง: ${renderFolderHandle.name}`, 'ok')
        syncFolderTargetUI()
        return
      }
    }
    const picked = await pickRenderFolder()
    if (picked) {
      renderFolderHandle = picked
      syncFolderTargetUI()
      showToast(`ตั้งโฟลเดอร์ปลายทาง: ${picked.name}`, 'ok')
    }
  })
  el.btnFolderClear?.addEventListener('click', async (ev) => {
    ev.stopPropagation()
    renderFolderHandle = null
    await clearRenderFolderHandle()
    syncFolderTargetUI()
    showToast('ล้างโฟลเดอร์ปลายทางแล้ว — จะใช้โฟลเดอร์ดาวน์โหลด', 'ok', 2500)
  })
  el.renderOverlayCancel?.addEventListener('click', () => {
    if (_renderAbort) {
      try {
        _renderAbort.abort()
      } catch {
        /* ignore */
      }
      updateRenderOverlay('กำลังยกเลิก…')
    }
  })
}

function syncCaptionStep4Buttons() {
  const onCap = step === 4
  const busy = clips.some((c) => c.loading)
  const has = clips.length > 0
  const lock = !onCap || !has || busy || _captionExporting
  if (el.btnCaptionRender) el.btnCaptionRender.disabled = lock
  if (el.btnCaptionSave) el.btnCaptionSave.disabled = lock
  if (el.btnShareExportedVideo) el.btnShareExportedVideo.disabled = lock || !lastExportVideo
}

function syncCaptionTrimChrome() {
  const onCap = step === 4
  el.captionWorkspace?.classList.toggle('hidden', !onCap)
  el.trimToolbarStep3?.classList.toggle('hidden', onCap)
  el.trimToolbarStep4?.classList.toggle('hidden', !onCap)
  el.trimTimelineWrap?.classList.toggle('trim-readout--caption-hidden', onCap)
  el.trimGlobalReadout?.classList.toggle('trim-readout--caption-hidden', onCap)
  el.trimSpeedBlock?.classList.toggle('trim-readout--caption-hidden', onCap)
  el.trimClipIndexTray?.classList.toggle('trim-readout--caption-hidden', onCap)
  if (onCap && el.captionDraft) {
    el.captionDraft.value = captionDraftText
  }
  syncShareSocialState()
  syncCaptionStep4Buttons()
  syncShareUploadEndpointInput()
}

/** URL เปิดแท็บหลังคัดลอก caption — ไม่ส่งไฟล์วิดีโอ ไม่ใช่ deep link เข้าแอป (ไม่ผูก API) */
const CAPTION_SHARE_URLS = {
  tiktok: 'https://www.tiktok.com/',
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  youtube: 'https://www.youtube.com/upload',
}

const SHARE_PLATFORM_LABEL_TH = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
}

function getCaptionTextTrimmed() {
  return (el.captionDraft?.value ?? captionDraftText).trim()
}

function syncShareSocialState() {
  const onCap = step === 4
  const ok = onCap && getCaptionTextTrimmed().length > 0
  document.querySelectorAll('#caption-workspace [data-share-platform]').forEach((node) => {
    if (!(node instanceof HTMLButtonElement)) return
    node.disabled = !ok
    const key = /** @type {keyof typeof SHARE_PLATFORM_LABEL_TH} */ (node.dataset.sharePlatform ?? '')
    const labelTh = SHARE_PLATFORM_LABEL_TH[key] ?? key
    if (ok) {
      node.title =
        `คัดลอกข้อความแล้วเปิดเว็บ ${labelTh} — ไม่แนบไฟล์วิดีโอ ต้องอัปโหลดคลิปในแอปเอง (ใช้ปุ่ม「แชร์วิดีโอ」หรือไฟล์หลังเรนเดอร์)`
      node.setAttribute(
        'aria-label',
        `คัดลอก caption ไปคลิปบอร์ด แล้วเปิดเว็บ ${labelTh} ไม่ส่งไฟล์วิดีโอจากแอปนี้`,
      )
    } else {
      node.title = 'พิมพ์ caption ในกล่องด้านบนก่อน'
      node.setAttribute('aria-label', `${labelTh} — พิมพ์ caption ก่อน`)
    }
  })
}

async function onCaptionShareClick(e) {
  const btn = e.currentTarget
  if (!(btn instanceof HTMLButtonElement) || btn.disabled) return
  const text = getCaptionTextTrimmed()
  if (!text) return
  const key = /** @type {keyof typeof CAPTION_SHARE_URLS} */ (btn.dataset.sharePlatform ?? '')
  const labelTh = SHARE_PLATFORM_LABEL_TH[key] ?? key
  let copied = false
  try {
    await navigator.clipboard.writeText(text)
    copied = true
  } catch {
    /* ignore */
  }
  const url = key && key in CAPTION_SHARE_URLS ? CAPTION_SHARE_URLS[key] : 'https://www.tiktok.com/'
  window.open(url, '_blank', 'noopener,noreferrer')
  if (copied) {
    showToast(
      `คัดลอก caption แล้ว · เปิดเว็บ ${labelTh}\nวิดีโอไม่ถูกแนบ — อัปโหลดจากไฟล์หลังเรนเดอร์ หรือกด「แชร์วิดีโอ」`,
      'ok',
      5500,
    )
  } else {
    showToast(
      `เปิดเว็บ ${labelTh} แล้ว — คัดลอกข้อความไม่สำเร็จ ให้ลองเลือกและคัดลอกจากกล่อง caption เอง`,
      'warn',
      6000,
    )
  }
}

/** ดาวน์โหลด blob (fallback เมื่อ Web Share ไม่รองรับ) */
function downloadBlobAsFile(blob, filename) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** ไฟล์ใหญ่พอสมควร → ลอง Phase C (อัปโหลดแล้วแชร์ลิงก์) ก่อนแชร์เป็นไฟล์ */
const SHARE_PHASE_C_LARGE_BYTES = 20 * 1024 * 1024

/**
 * @param {string} publicUrl
 * @param {string} title
 * @param {string} [text]
 * @returns {Promise<'ok'|'abort'|'fail'>}
 */
async function tryShareNavigatorUrl(publicUrl, title, text) {
  const nav = navigator
  if (typeof nav.share !== 'function') return 'fail'
  try {
    if (typeof nav.canShare === 'function' && nav.canShare({ url: publicUrl })) {
      await nav.share({
        url: publicUrl,
        title: title || '',
        ...(text ? { text } : {}),
      })
      return 'ok'
    }
  } catch (e) {
    if (e && typeof e === 'object' && 'name' in e && /** @type {{ name?: string }} */ (e).name === 'AbortError') {
      return 'abort'
    }
  }
  try {
    await nav.share({
      title: title || 'วิดีโอ',
      text: text ? `${text}\n\n${publicUrl}` : publicUrl,
    })
    return 'ok'
  } catch (e) {
    if (e && typeof e === 'object' && 'name' in e && /** @type {{ name?: string }} */ (e).name === 'AbortError') {
      return 'abort'
    }
    return 'fail'
  }
}

/**
 * Phase C: อัปโหลดไป endpoint แล้วแชร์ลิงก์ / คลิปบอร์ด
 * @returns {Promise<boolean>} true = จบ flow แล้ว (ไม่ต้องดาวน์โหลดเพิ่ม ยกเว้นบางเคสที่ดาวน์โหลดแล้ว)
 */
async function tryUploadAndShareUrlPhaseC(exp, caption) {
  if (!getShareUploadEndpoint()) return false
  let publicUrl
  try {
    publicUrl = await uploadVideoForShareLink(exp.blob, exp.filename, { timeoutMs: 180_000 })
  } catch (err) {
    showToast(
      `อัปโหลดชั่วคราวไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`,
      'warn',
      6500,
    )
    return false
  }
  if (!publicUrl) return false

  const outcome = await tryShareNavigatorUrl(publicUrl, exp.filename, caption || undefined)
  if (outcome === 'ok') {
    showToast('แชร์ลิงก์วิดีโอแล้ว — ลบไฟล์ชั่วคราวบนเซิร์ฟเวอร์ตามนโยบายของคุณ', 'ok', 5000)
    return true
  }
  if (outcome === 'abort') return true

  try {
    await navigator.clipboard.writeText(publicUrl)
  } catch {
    /* ignore */
  }
  showToast(
    'แชร์ลิงก์จากเบราว์เซอร์ไม่รองรับ — คัดลอก URL ไว้ในคลิปบอร์ดแล้ว + ดาวน์โหลดไฟล์ต้นฉบับ',
    'warn',
    7000,
  )
  downloadBlobAsFile(exp.blob, exp.filename)
  return true
}

function syncShareUploadEndpointInput() {
  if (!el.shareUploadEndpointInput) return
  el.shareUploadEndpointInput.value = getShareUploadEndpoint()
}

/** Phase A + C: แชร์ไฟล์ → หรืออัปโหลดแล้วแชร์ URL → หรือดาวน์โหลด */
async function shareLastExportedVideo() {
  const exp = lastExportVideo
  if (!exp) {
    showToast('ยังไม่มีไฟล์หลังเรนเดอร์ — กด Render ให้สำเร็จก่อน', 'warn')
    return
  }
  const caption = getCaptionTextTrimmed()
  const mime =
    exp.blob.type || exp.mimeType || (exp.isMp4 ? 'video/mp4' : 'video/webm')
  /** @type {File} */
  let file
  try {
    file = new File([exp.blob], exp.filename, { type: mime, lastModified: Date.now() })
  } catch {
    showToast('สร้างไฟล์สำหรับแชร์ไม่สำเร็จ — ดาวน์โหลดแทน', 'warn')
    downloadBlobAsFile(exp.blob, exp.filename)
    return
  }

  const nav = navigator
  let canShareFiles = false
  try {
    canShareFiles = typeof nav.canShare === 'function' && nav.canShare({ files: [file] })
  } catch {
    canShareFiles = false
  }

  const endpoint = getShareUploadEndpoint()
  const large = exp.blob.size >= SHARE_PHASE_C_LARGE_BYTES

  if (endpoint && (!canShareFiles || large)) {
    const done = await tryUploadAndShareUrlPhaseC(exp, caption)
    if (done) return
  }

  if (typeof nav.share === 'function' && canShareFiles) {
    try {
      await nav.share({
        files: [file],
        title: exp.filename,
        ...(caption ? { text: caption } : {}),
      })
      showToast('ส่งไปยังแอปที่คุณเลือกแล้ว', 'ok', 3500)
      return
    } catch (err) {
      const aborted =
        err &&
        typeof err === 'object' &&
        'name' in err &&
        /** @type {{ name?: string }} */ (err).name === 'AbortError'
      if (aborted) return
      if (endpoint && !large) {
        const recovered = await tryUploadAndShareUrlPhaseC(exp, caption)
        if (recovered) return
      }
      showToast(
        `แชร์ไฟล์ไม่สำเร็จ — ดาวน์โหลดแทน\n${err instanceof Error ? err.message : String(err)}`,
        'warn',
        5500,
      )
      downloadBlobAsFile(exp.blob, exp.filename)
      return
    }
  }

  downloadBlobAsFile(exp.blob, exp.filename)
  showToast(
    endpoint
      ? 'แชร์ไฟล์/ลิงก์ไม่สำเร็จ — ดาวน์โหลดแล้วเปิดจากแกลเลอรี/ไฟล์แล้วกดแชร์'
      : 'เบราว์เซอร์นี้ไม่รองรับแชร์ไฟล์วิดีโอ — ดาวน์โหลดแล้วเปิดจากแกลเลอรี/ไฟล์แล้วกดแชร์ (หรือตั้ง URL อัปโหลดชั่วคราวในเมนูขั้นสูง)',
    'warn',
    7000,
  )
}

function updateStepPills() {
  el.stepPills.forEach((pill) => {
    const sn = parseInt(pill.dataset.stepPill ?? '0', 10)
    pill.classList.remove('active', 'done', 'disabled')
    if (sn < step) pill.classList.add('done')
    else if (sn === step) pill.classList.add('active')
    else pill.classList.add('disabled')
    if (pill instanceof HTMLButtonElement) {
      pill.disabled = pill.classList.contains('disabled')
    }
  })
}

function setStep(n) {
  if (n !== 1 && n !== 3 && n !== 4) return
  const prev = step

  if (n === 1 && (prev === 3 || prev === 4)) releaseTrimPreviewResources()
  if (prev === 3 && n === 4) pauseTrimPreviewForCaption()

  step = /** @type {1 | 3 | 4} */ (n)

  el.panelImport.classList.toggle('hidden', n !== 1)
  el.panelNext.classList.toggle('hidden', !isTrimCaptionPreviewStep())

  if (n === 3 && prev === 1) enterTrimStep(true)
  else if (n === 3 && prev === 4) enterTrimStep(false)

  syncCaptionTrimChrome()
  updateStepPills()
  syncButtons()
}

function bindDropzone() {
  const dz = el.dropzone
  dz.addEventListener('click', () => el.fileInput.click())
  el.fileInput.addEventListener('change', () => {
    if (el.fileInput.files?.length) addFiles(el.fileInput.files)
    el.fileInput.value = ''
  })
  dz.addEventListener('dragover', (e) => {
    e.preventDefault()
    dz.classList.add('dragover')
  })
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'))
  dz.addEventListener('drop', (e) => {
    e.preventDefault()
    dz.classList.remove('dragover')
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
  })
}

el.btnNext.addEventListener('click', () => {
  if (!clips.length || clips.some((c) => c.loading)) return
  setStep(3)
})

function syncTrimPreviewMuteButton() {
  if (!el.trimPreviewMute || !el.trimVideo) return
  const m = el.trimVideo.muted
  el.trimPreviewMute.setAttribute('aria-pressed', m ? 'true' : 'false')
  const icon = el.trimPreviewMute.querySelector('.trim-preview-mute-icon')
  if (icon) icon.textContent = m ? '🔇' : '🔊'
  el.trimPreviewMute.setAttribute('aria-label', m ? 'เปิดเสียงพรีวิว' : 'ปิดเสียงพรีวิว')
  el.trimPreviewMute.setAttribute('title', m ? 'เปิดเสียงพรีวิว' : 'ปิดเสียงพรีวิว')
}

function bindTrimPreviewMuteOnce() {
  if (_trimPreviewMuteBound || !el.trimPreviewMute || !el.trimVideo) return
  _trimPreviewMuteBound = true
  el.trimPreviewMute.addEventListener('click', (e) => {
    e.stopPropagation()
    el.trimVideo.muted = !el.trimVideo.muted
    syncTrimPreviewMuteButton()
  })
}

function bindTrimPreviewFullscreenOnce() {
  if (_trimPreviewFullscreenBound) return
  if (!el.trimPreviewFullscreen || !el.trimViewerWrap) return
  _trimPreviewFullscreenBound = true
  el.trimPreviewFullscreen.addEventListener('click', (e) => {
    e.stopPropagation()
    void toggleTrimViewerFullscreen()
  })
  const onFs = () => {
    if (isTrimCaptionPreviewStep()) syncTrimFullscreenButton()
  }
  document.addEventListener('fullscreenchange', onFs)
  document.addEventListener('webkitfullscreenchange', onFs)
}

function bindStepPillsOnce() {
  if (_stepPillsBound) return
  _stepPillsBound = true
  el.stepPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      if (pill instanceof HTMLButtonElement && pill.disabled) return
      const sn = parseInt(pill.dataset.stepPill ?? '0', 10)
      if (sn === 1) setStep(1)
      if (sn === 3) {
        if (!clips.length || clips.some((c) => c.loading)) return
        setStep(3)
      }
      if (sn === 4) {
        if (!clips.length || clips.some((c) => c.loading)) return
        setStep(4)
      }
    })
  })
}

/**
 * คำนวณ render parameters จาก payload + speed (ใช้ร่วมกันระหว่าง bg + foreground)
 * @param {Array<{trimInSec:number, trimOutSec:number}>} payload
 * @param {number} speed
 */
function computeRenderParams(payload, speed) {
  const totalSelectedSec = payload.reduce(
    (sum, c) => sum + Math.max(0, c.trimOutSec - c.trimInSec),
    0,
  )
  const totalOutputSec = totalSelectedSec / Math.max(1, speed)
  const TARGET_BYTES = 14 * 1024 * 1024
  const audioBitrate = 128_000
  const secForSize = Math.max(totalOutputSec, 1)
  const rawVideoBitrate = Math.floor((TARGET_BYTES * 8) / secForSize - audioBitrate)
  const MIN_1080_BITRATE = 3_500_000
  const use720 = rawVideoBitrate < MIN_1080_BITRATE
  const width = use720 ? 720 : 1080
  const height = use720 ? 1280 : 1920
  const capBitrate = use720 ? 7_000_000 : 14_000_000
  const floorBitrate = use720 ? 2_000_000 : 3_000_000
  const videoBitrate = Math.max(floorBitrate, Math.min(rawVideoBitrate, capBitrate))
  const fps = 30
  return { totalOutputSec, width, height, videoBitrate, audioBitrate, fps }
}

/**
 * เริ่ม background render (เงียบ) — ไม่มี overlay, ไม่ trigger download, ไม่เขียน folder
 * จะเริ่มเฉพาะเมื่อ strategy = 'desktop-bg' เท่านั้น
 * ถ้า bg ทำงานอยู่หรือมี cached result แล้ว → no-op
 */
function startBackgroundRender() {
  if (_bgRenderPromise || _bgRenderResult) return
  if (getRenderStrategy() !== 'desktop-bg') return
  if (!clips.length || clips.some((c) => c.loading)) return

  clips.forEach((c) => ensureClipTrim(c))
  const payload = clips.map((c) => ({
    file: c.file,
    trimInSec: c.trimInSec,
    trimOutSec: c.trimOutSec,
    name: c.name,
  }))
  const speed = Math.max(1, Number(trimPreviewPlaybackSpeed) || 1)
  const params = computeRenderParams(payload, speed)

  _bgRenderAbort = new AbortController()
  _bgRenderError = null
  _bgRenderResult = null

  _bgRenderPromise = renderProjectToMp4(payload, {
    playbackSpeed: speed,
    width: params.width,
    height: params.height,
    fps: params.fps,
    videoBitrate: params.videoBitrate,
    audioBitrate: params.audioBitrate,
    signal: _bgRenderAbort.signal,
    outputName: `vdo-${Date.now()}`,
    noAutoDownload: true,
  })
    .then((result) => {
      _bgRenderResult = {
        blob: result.blob,
        mimeType: result.mimeType,
        isMp4: result.isMp4,
        filename: result.filename,
        width: params.width,
        height: params.height,
      }
      return _bgRenderResult
    })
    .catch((e) => {
      _bgRenderError = e instanceof Error ? e : new Error(String(e))
      return null
    })
    .finally(() => {
      _bgRenderPromise = null
      _bgRenderAbort = null
    })
}

/**
 * Invalidate bg render — abort ถ้ากำลังรัน, ล้าง cached result
 * เรียกเมื่อ user กลับไปแก้ trim หรือ clip list เปลี่ยน
 */
function invalidateBgRender() {
  try { _bgRenderAbort?.abort() } catch { /* ignore */ }
  _bgRenderAbort = null
  _bgRenderPromise = null
  _bgRenderResult = null
  _bgRenderError = null
}

/**
 * บันทึก blob → folder (ถ้ามี) หรือ fallback เป็น download
 * @param {Blob} blob
 * @param {string} filename
 * @returns {Promise<{ savedToFolder: boolean }>}
 */
async function persistRenderedBlob(blob, filename) {
  let savedToFolder = false
  if (renderFolderHandle) {
    try {
      savedToFolder = await writeToFolder(renderFolderHandle, filename, blob)
    } catch {
      savedToFolder = false
    }
  }
  if (!savedToFolder) downloadBlobAsFile(blob, filename)
  return { savedToFolder }
}

/**
 * ใช้ผล bg render ที่ cached ไว้ — save + toast + update state
 * (ใช้เมื่อ user คลิก render บน caption step)
 */
async function consumeBgRenderResult() {
  const r = _bgRenderResult
  if (!r) return
  _bgRenderResult = null
  const { savedToFolder } = await persistRenderedBlob(r.blob, r.filename)
  const sizeMb = (r.blob.size / (1024 * 1024)).toFixed(1)
  const where = savedToFolder ? 'โฟลเดอร์ที่เลือก' : 'โฟลเดอร์ดาวน์โหลด'
  const typeTh = r.isMp4 ? 'MP4' : 'WebM (เบราว์เซอร์ไม่รองรับ MP4 ตรง)'
  lastExportVideo = {
    blob: r.blob,
    mimeType: r.mimeType,
    filename: r.filename,
    isMp4: r.isMp4,
  }
  syncCaptionStep4Buttons()
  showToast(
    `เรนเดอร์สำเร็จ (พื้นหลัง) · ${typeTh} · ${sizeMb} MB · ${r.width}×${r.height}\nบันทึกไว้ที่ ${where}`,
    'ok',
  )
}

function bindCaptionUiOnce() {
  if (document.documentElement.dataset.captionUiBound === '1') return
  document.documentElement.dataset.captionUiBound = '1'
  el.btnTrimNext?.addEventListener('click', () => {
    if (step !== 3 || !clips.length || clips.some((c) => c.loading)) return
    /* Chrome desktop: เริ่ม bg render ก่อน, หน่วง 4s แล้วค่อยไป caption
       Strategy อื่น: ไปทันที (ไม่ต้อง delay เปล่า) */
    const delay = getBgRenderDelayMs()
    if (delay > 0) {
      startBackgroundRender()
      setTimeout(() => setStep(4), delay)
    } else {
      setStep(4)
    }
  })
  el.btnCaptionBackTrim?.addEventListener('click', () => {
    if (!clips.length) return
    /* กลับไปแก้ trim — invalidate bg render เผื่อ user เปลี่ยน trim จุดใด */
    invalidateBgRender()
    setStep(3)
  })
  el.captionDraft?.addEventListener('input', () => {
    captionDraftText = el.captionDraft?.value ?? ''
    syncShareSocialState()
  })
  el.btnCaptionFetchStub?.addEventListener('click', () => {
    const stub =
      '[stub เว็บ] คำบรรยายตัวอย่าง — ยังไม่เชื่อม API จริง\n' +
      (captionDraftText ? `\n---\n${captionDraftText}` : '')
    captionDraftText = stub
    if (el.captionDraft) el.captionDraft.value = stub
    syncShareSocialState()
  })
  document.querySelectorAll('#caption-workspace [data-share-platform]').forEach((node) => {
    node.addEventListener('click', onCaptionShareClick)
  })
  el.btnShareExportedVideo?.addEventListener('click', () => {
    void shareLastExportedVideo()
  })
  el.btnShareUploadEndpointSave?.addEventListener('click', () => {
    const raw = el.shareUploadEndpointInput?.value?.trim() ?? ''
    if (!raw) {
      setShareUploadEndpoint('')
      syncShareUploadEndpointInput()
      showToast('ล้าง URL อัปโหลดชั่วคราวแล้ว', 'ok', 2500)
      return
    }
    try {
      const u = new URL(raw)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('bad')
    } catch {
      showToast('URL ไม่ถูกต้อง — ต้องเป็น https:// หรือ http://', 'warn', 4000)
      return
    }
    setShareUploadEndpoint(raw)
    showToast('บันทึก URL อัปโหลดชั่วคราวแล้ว (POST multipart ฟิลด์ file)', 'ok', 3500)
  })

  el.btnCaptionRender?.addEventListener('click', async () => {
    if (_captionExporting || step !== 4 || !clips.length || clips.some((c) => c.loading)) return

    /* ──────── Cache-first path: bg render เสร็จแล้ว ──────── */
    if (_bgRenderResult) {
      _captionExporting = true
      syncCaptionStep4Buttons()
      try {
        await consumeBgRenderResult()
      } finally {
        _captionExporting = false
        syncCaptionStep4Buttons()
      }
      return
    }

    /* ──────── Bg render ยังรันอยู่ → show overlay + await promise เดิม ──────── */
    if (_bgRenderPromise) {
      _captionExporting = true
      syncCaptionStep4Buttons()
      showRenderOverlay('กำลังเรนเดอร์เบื้องหลัง · กรุณารอสักครู่')
      try {
        await _bgRenderPromise
        if (_bgRenderResult) {
          await consumeBgRenderResult()
        } else if (_bgRenderError) {
          const msg = _bgRenderError.message || String(_bgRenderError)
          if (msg !== 'ยกเลิก') {
            showToast(`Render ไม่สำเร็จ: ${msg}`, 'error', 6000)
          }
          _bgRenderError = null
        }
      } finally {
        hideRenderOverlay()
        _captionExporting = false
        syncCaptionStep4Buttons()
      }
      return
    }

    /* ──────── Silent bg error → เด้งเตือนแล้ว fall-through ไป foreground ──────── */
    if (_bgRenderError) {
      const msg = _bgRenderError.message || String(_bgRenderError)
      if (msg !== 'ยกเลิก') {
        showToast(`เจนเบื้องหลังไม่สำเร็จ: ${msg} — กำลังลองใหม่`, 'warn', 4000)
      }
      _bgRenderError = null
    }

    /* ──────── Foreground render (ไม่มี bg หรือ strategy อื่น) ──────── */
    clips.forEach((c) => ensureClipTrim(c))
    const payload = clips.map((c) => ({
      file: c.file,
      trimInSec: c.trimInSec,
      trimOutSec: c.trimOutSec,
      name: c.name,
    }))
    const speed = Math.max(1, Number(trimPreviewPlaybackSpeed) || 1)
    const params = computeRenderParams(payload, speed)

    /* Chrome-desktop gate — เฉพาะเส้น foreground (bg path ข้ามไปแล้ว) */
    if (!isChromeDesktop()) {
      const ok = window.confirm(
        'ระบบนี้ออกแบบให้ใช้ Chrome บนคอมพิวเตอร์\n' +
          'ถ้าใช้เบราว์เซอร์อื่น (เช่น Safari บน iPhone) การ Render อาจช้ามากหรือค้าง\n\n' +
          'แนะนำเปิดหน้านี้บน Chrome Mac/PC\n\n' +
          'ต้องการเรนเดอร์ต่อไปหรือไม่?',
      )
      if (!ok) return
    }
    if (params.totalOutputSec > 60) {
      const ok = window.confirm(
        `ผลลัพธ์ยาว ≈ ${params.totalOutputSec.toFixed(1)} วินาที — เกินจากเป้าหมายระบบ (ประมาณ 15 วินาที)\n` +
          'การ Render จะใช้เวลาประมาณเท่ากัน (MediaRecorder near real-time)\n\n' +
          'ต้องการเรนเดอร์ต่อหรือไม่?',
      )
      if (!ok) return
    }

    _captionExporting = true
    syncCaptionStep4Buttons()
    _renderAbort = new AbortController()
    const etaSec = Math.max(1, Math.ceil(params.totalOutputSec + payload.length * 1.2))
    showRenderOverlay(
      `เตรียมไฟล์ · ประมาณ ${etaSec} วินาที · ${params.width}×${params.height}@${params.fps}`,
    )

    try {
      const result = await renderProjectToMp4(payload, {
        playbackSpeed: speed,
        width: params.width,
        height: params.height,
        fps: params.fps,
        videoBitrate: params.videoBitrate,
        audioBitrate: params.audioBitrate,
        folderHandle: renderFolderHandle,
        signal: _renderAbort.signal,
        outputName: `vdo-${Date.now()}`,
        onProgress: ({ clipIndex, clipCount, phase }) => {
          const phaseTh =
            phase === 'loading'
              ? 'โหลดคลิป'
              : phase === 'recording'
                ? 'กำลังเรนเดอร์'
                : 'กำลังปิดไฟล์'
          updateRenderOverlay(
            `${phaseTh} ${Math.min(clipIndex + 1, clipCount)}/${clipCount} · ${params.width}×${params.height}`,
          )
        },
      })
      const sizeMb = (result.blob.size / (1024 * 1024)).toFixed(1)
      const where = result.savedToFolder ? 'โฟลเดอร์ที่เลือก' : 'โฟลเดอร์ดาวน์โหลด'
      const typeTh = result.isMp4 ? 'MP4' : 'WebM (เบราว์เซอร์ไม่รองรับ MP4 ตรง)'
      lastExportVideo = {
        blob: result.blob,
        mimeType: result.mimeType,
        filename: result.filename,
        isMp4: result.isMp4,
      }
      syncCaptionStep4Buttons()
      showToast(
        `เรนเดอร์สำเร็จ · ${typeTh} · ${sizeMb} MB · ${params.width}×${params.height}\nบันทึกไว้ที่ ${where}\nกด「แชร์วิดีโอ」เพื่อเปิดเมนูแชร์ของเครื่อง (มือถือ)`,
        'ok',
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'ยกเลิก') {
        showToast('ยกเลิกการเรนเดอร์แล้ว', 'warn')
      } else {
        showToast(`Render ไม่สำเร็จ: ${msg}`, 'error', 6000)
      }
    } finally {
      _renderAbort = null
      hideRenderOverlay()
      _captionExporting = false
      syncCaptionStep4Buttons()
    }
  })

  el.btnCaptionSave?.addEventListener('click', async () => {
    if (step !== 4 || !clips.length || clips.some((c) => c.loading) || _captionExporting) return
    captionDraftText = el.captionDraft?.value ?? captionDraftText
    try {
      await saveProjectToIndexedDB(clips, captionDraftText, trimPreviewPlaybackSpeed)
      downloadProjectMetadataJson(
        clips.map((c) => ({
          id: c.id,
          name: c.name,
          trimInSec: c.trimInSec,
          trimOutSec: c.trimOutSec,
          durationSec: c.durationSec,
        })),
        captionDraftText,
        trimPreviewPlaybackSpeed,
      )
      window.alert('บันทึกแล้ว: ไฟล์วิดีโอในเครื่อง (IndexedDB) + ดาวน์โหลด metadata .json')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      window.alert(`Save ไม่สำเร็จ: ${msg}`)
    }
  })
}

bindClipArrangeGrid()
bindArrangeSafetyNet()
bindDropzone()
renderClipArrangeGrid()
updateStepPills()
syncButtons()
bindGlobalPreviewOnce()
bindTrimViewerHitOnce()
bindTrimPreviewMuteOnce()
bindTrimPreviewFullscreenOnce()
bindStepPillsOnce()
bindCaptionUiOnce()
bindTrimPreviewSpeedOnce()
bindFolderTargetOnce()
syncTrimSpeedUI()
syncCaptionTrimChrome()
syncFolderTargetUI()
initRenderFolderHandle()
syncShareUploadEndpointInput()
