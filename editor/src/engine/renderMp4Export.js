/**
 * Render project → MP4 ไฟล์เดียว (9:16) — เงียบเบื้องหลัง
 *
 * ตรงกับหน้า Trim: ลำดับคลิปตาม arrange, ตัด trimIn–trimOut, ใช้ playbackSpeed, มีเสียง
 *
 * เวลา render (สำคัญ):
 *   - โหมดนี้เล่นวิดีโอจริงทีละคลิปขณะบันทึก (MediaRecorder) — เวลาโดยประมาณ ≈ ความยาวรวมหลังหารด้วย playbackSpeed
 *   - จึงไม่สามารถบีบให้เหลือไม่กี่วินาทีได้ถ้าคลิปยาวหลายนาที (ไม่ใช่ FFmpeg แบบเร็วกว่าเวลาจริง)
 *   - มือถือ Safari/iOS: encode + canvas หนักมาก — ใช้ 720p และ fps ต่ำช่วยได้
 *
 * ข้อจำกัด:
 *   - Desktop Chrome ทำงานได้ดีที่สุด; Safari มือถืออาจช้าหรือค้าง
 *   - ถ้า MediaRecorder ไม่รองรับ MP4 → fallback เป็น WebM
 *   - แท็บต้องเปิดอยู่ระหว่าง render (ซ่อนแท็บอาจทำให้ pump หยุด)
 */

const DEFAULT_FPS = 30
/** หลัง seek ให้ decoder นิ่งก่อนเล่น — ลดเฟรมแรกเพี้ยน/บล็อกระหว่างคลิป */
const POST_SEEK_SETTLE_MS = 120

function pickMp4Mime() {
  const candidates = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1.64001F,mp4a.40.2',
    'video/mp4;codecs=avc1.42E01F,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4',
  ]
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

function pickFallbackMime() {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

function clampSpeed(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 1
  const clamped = Math.min(1.5, Math.max(1, n))
  return Math.round((clamped / 0.05) * 0.05 * 100) / 100
}

function safeFilename(name) {
  return String(name || 'clip')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

/** ดาวน์โหลดผ่าน anchor (fallback) */
function triggerDownload(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000)
}

/** เขียนลงโฟลเดอร์ที่ผู้ใช้เลือก (File System Access API) */
async function writeToFolder(folderHandle, filename, blob) {
  if (!folderHandle) return false
  try {
    const perm = await folderHandle.queryPermission?.({ mode: 'readwrite' })
    if (perm !== 'granted') {
      const req = await folderHandle.requestPermission?.({ mode: 'readwrite' })
      if (req !== 'granted') return false
    }
    const fileHandle = await folderHandle.getFileHandle(filename, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()
    return true
  } catch {
    return false
  }
}

/** รอ event พร้อม timeout */
function waitMediaEvent(media, evt, timeoutMs, errMsg) {
  return new Promise((resolve, reject) => {
    let timer = null
    const cleanup = () => {
      if (timer) clearTimeout(timer)
      media.removeEventListener(evt, onEvt)
      media.removeEventListener('error', onErr)
    }
    const onEvt = () => {
      cleanup()
      resolve()
    }
    const onErr = () => {
      cleanup()
      reject(new Error(errMsg))
    }
    timer = setTimeout(() => {
      cleanup()
      reject(new Error(`${errMsg} (timeout)`))
    }, timeoutMs)
    media.addEventListener(evt, onEvt, { once: true })
    media.addEventListener('error', onErr, { once: true })
  })
}

/** รอ promise พร้อม timeout — ถ้าเกินเวลาจะ resolve(undefined) (ใช้กับ cleanup) */
function withTimeout(promise, ms) {
  return new Promise((resolve) => {
    let done = false
    const t = setTimeout(() => {
      if (!done) {
        done = true
        resolve(undefined)
      }
    }, ms)
    Promise.resolve(promise).then(
      (v) => {
        if (done) return
        done = true
        clearTimeout(t)
        resolve(v)
      },
      () => {
        if (done) return
        done = true
        clearTimeout(t)
        resolve(undefined)
      },
    )
  })
}

/** Chrome บางเคส AudioContext suspend หลัง await — ต้อง resume ก่อนเล่นเสียง */
async function ensureAudioContextRunning(ctx) {
  for (let i = 0; i < 30; i += 1) {
    if (ctx.state === 'closed') return
    if (ctx.state === 'running') return
    try {
      await ctx.resume()
    } catch {
      /* ignore */
    }
    if (ctx.state === 'running') return
    await new Promise((r) => setTimeout(r, 40))
  }
}

/**
 * @param {Array<{ file: File, trimInSec: number, trimOutSec: number, name?: string }>} clips
 * @param {{
 *   playbackSpeed?: number,
 *   width?: number,
 *   height?: number,
 *   fps?: number,
 *   videoBitrate?: number,
 *   audioBitrate?: number,
 *   outputName?: string,
 *   folderHandle?: FileSystemDirectoryHandle | null,
 *   signal?: AbortSignal,
 *   onProgress?: (info: { clipIndex: number, clipCount: number, phase: 'loading'|'recording'|'finalizing' }) => void,
 * }} [opts]
 * @returns {Promise<{ blob: Blob, mimeType: string, isMp4: boolean, filename: string, savedToFolder: boolean }>}
 */
export async function renderProjectToMp4(clips, opts = {}) {
  if (!Array.isArray(clips) || !clips.length) throw new Error('ไม่มีคลิป')

  const speed = clampSpeed(opts.playbackSpeed ?? 1)
  const width = Math.max(320, Math.round(opts.width ?? 1080))
  const height = Math.max(320, Math.round(opts.height ?? 1920))
  const fps = Math.max(24, Math.min(60, Math.round(opts.fps ?? DEFAULT_FPS)))
  const videoBitrate = Math.max(400_000, Math.round(opts.videoBitrate ?? 8_000_000))
  const audioBitrate = Math.max(64_000, Math.round(opts.audioBitrate ?? 128_000))
  const outputName = opts.outputName || `vdo-render-${Date.now()}`
  const folderHandle = opts.folderHandle ?? null
  const { signal, onProgress } = opts

  const mp4Mime = pickMp4Mime()
  const mime = mp4Mime || pickFallbackMime()
  if (!mime) throw new Error('เบราว์เซอร์นี้ไม่รองรับ MediaRecorder')
  const isMp4 = mime.startsWith('video/mp4')

  // ── Offscreen video ────────────────────────────────────────────────────
  const video = document.createElement('video')
  video.playsInline = true
  video.setAttribute('playsinline', '')
  video.muted = false
  video.volume = 1
  video.preload = 'auto'
  // blob: ไม่ตั้ง crossOrigin — บางเคสรบกวน MediaElementSource + เสียง

  // ── Canvas ผลลัพธ์ (9:16) — บังคับ sRGB ลดโอกาสสีเพี้ยน ───────────────
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx2d =
    canvas.getContext('2d', /** @type {any} */ ({ alpha: false, colorSpace: 'srgb' })) ||
    canvas.getContext('2d', { alpha: false })
  if (!ctx2d) throw new Error('canvas 2d ไม่พร้อม')
  ctx2d.imageSmoothingEnabled = true
  ctx2d.imageSmoothingQuality = 'high'
  ctx2d.fillStyle = '#000'
  ctx2d.fillRect(0, 0, width, height)

  // ── Audio graph: ป้อน MediaStreamDestination + sink gain=0 (เงียบลำโพง แต่ graph live) ─
  const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext
  if (!AC) throw new Error('เบราว์เซอร์ไม่รองรับ Web Audio')
  const audioCtx = new AC()
  const audioDest = audioCtx.createMediaStreamDestination()
  const audioSrc = audioCtx.createMediaElementSource(video)
  const silentSink = audioCtx.createGain()
  silentSink.gain.value = 0
  audioSrc.connect(audioDest)
  audioSrc.connect(silentSink)
  silentSink.connect(audioCtx.destination)

  await ensureAudioContextRunning(audioCtx)

  // ── รวม stream: canvas video + audio dest ─────────────────────────────
  const canvasStream = canvas.captureStream(fps)
  const combinedStream = new MediaStream()
  for (const t of canvasStream.getVideoTracks()) combinedStream.addTrack(t)
  for (const t of audioDest.stream.getAudioTracks()) combinedStream.addTrack(t)

  if (combinedStream.getAudioTracks().length === 0) {
    // ปิด resource ที่เปิดไว้
    try {
      await audioCtx.close()
    } catch {
      /* ignore */
    }
    throw new Error('ไม่พบ audio track — ระบบเสียงไม่พร้อม')
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: mime,
    videoBitsPerSecond: videoBitrate,
    audioBitsPerSecond: audioBitrate,
  })
  /** @type {Blob[]} */
  const chunks = []
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data)
  }

  // วาด: ขณะเล่นใช้ requestVideoFrameCallback ให้ตรงเฟรม decode — ขณะหยุด/โหลดใช้ setTimeout ตาม fps
  const frameMs = 1000 / fps
  /** @type {ReturnType<typeof setTimeout> | null} */
  let drawPumpTimer = null
  /** @type {number} */
  let vfcHandle = 0
  let drawing = true

  function stopDrawPump() {
    if (drawPumpTimer != null) {
      clearTimeout(drawPumpTimer)
      drawPumpTimer = null
    }
    if (vfcHandle && typeof video.cancelVideoFrameCallback === 'function') {
      try {
        video.cancelVideoFrameCallback(vfcHandle)
      } catch {
        /* ignore */
      }
      vfcHandle = 0
    }
  }

  const drawOneFrame = () => {
    if (!drawing) return
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (vw && vh) {
      const scale = Math.max(width / vw, height / vh)
      const dw = vw * scale
      const dh = vh * scale
      const dx = (width - dw) / 2
      const dy = (height - dh) / 2
      ctx2d.fillStyle = '#000'
      ctx2d.fillRect(0, 0, width, height)
      try {
        ctx2d.drawImage(video, dx, dy, dw, dh)
      } catch {
        /* ignore */
      }
    } else {
      ctx2d.fillStyle = '#000'
      ctx2d.fillRect(0, 0, width, height)
    }
  }

  const drawPumpTick = () => {
    if (!drawing) return

    if (drawPumpTimer != null) {
      clearTimeout(drawPumpTimer)
      drawPumpTimer = null
    }
    if (vfcHandle && typeof video.cancelVideoFrameCallback === 'function') {
      try {
        video.cancelVideoFrameCallback(vfcHandle)
      } catch {
        /* ignore */
      }
      vfcHandle = 0
    }

    const canVfc =
      typeof video.requestVideoFrameCallback === 'function' &&
      !video.paused &&
      !video.ended &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA

    if (canVfc) {
      vfcHandle = video.requestVideoFrameCallback(() => {
        vfcHandle = 0
        drawOneFrame()
        drawPumpTick()
      })
      return
    }

    drawOneFrame()
    drawPumpTimer = window.setTimeout(() => {
      drawPumpTimer = null
      drawPumpTick()
    }, frameMs)
  }

  /** @type {string[]} */
  const urls = []
  let aborted = false
  const onAbort = () => {
    aborted = true
  }
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    recorder.start(500)
    drawPumpTick()
    await ensureAudioContextRunning(audioCtx)
    // ให้ recorder + audio graph เริ่ม pump ก่อน
    await new Promise((r) => setTimeout(r, 120))

    for (let i = 0; i < clips.length; i += 1) {
      if (aborted) throw new Error('ยกเลิก')
      const clip = clips[i]
      onProgress?.({ clipIndex: i, clipCount: clips.length, phase: 'loading' })

      stopDrawPump()
      const url = URL.createObjectURL(clip.file)
      urls.push(url)
      video.src = url
      await waitMediaEvent(video, 'loadedmetadata', 20_000, 'โหลด metadata หมดเวลา')
      drawPumpTick()

      const t0 = Math.max(0, Number(clip.trimInSec) || 0)
      const t1 = Math.max(t0 + 0.05, Number(clip.trimOutSec) || t0 + 0.05)

      try {
        video.currentTime = t0
      } catch {
        /* ignore */
      }
      await waitMediaEvent(video, 'seeked', 10_000, 'seek ไม่สำเร็จ')
      await new Promise((r) => setTimeout(r, POST_SEEK_SETTLE_MS))
      try {
        video.playbackRate = speed
      } catch {
        /* ignore */
      }

      onProgress?.({ clipIndex: i, clipCount: clips.length, phase: 'recording' })
      await ensureAudioContextRunning(audioCtx)
      try {
        await video.play()
      } catch (e) {
        throw new Error(`เล่นวิดีโอไม่สำเร็จ: ${e instanceof Error ? e.message : e}`)
      }
      await ensureAudioContextRunning(audioCtx)

      await new Promise((resolve, reject) => {
        let iv = /** @type {ReturnType<typeof setInterval> | null} */ (null)
        const cleanup = () => {
          if (iv) clearInterval(iv)
          iv = null
        }
        iv = setInterval(() => {
          if (aborted) {
            cleanup()
            reject(new Error('ยกเลิก'))
            return
          }
          if (video.currentTime >= t1 - 0.04 || video.ended) {
            cleanup()
            try {
              video.pause()
            } catch {
              /* ignore */
            }
            resolve(undefined)
          }
        }, 30)
        video.addEventListener(
          'error',
          () => {
            cleanup()
            reject(new Error('เล่นวิดีโอผิดพลาด'))
          },
          { once: true },
        )
      })
    }

    onProgress?.({ clipIndex: clips.length, clipCount: clips.length, phase: 'finalizing' })
    await new Promise((r) => setTimeout(r, 250))
  } finally {
    drawing = false
    stopDrawPump()

    // stop recorder ด้วย timeout — ไม่ให้ค้างถ้า 'stop' ไม่ fire
    if (recorder.state !== 'inactive') {
      await withTimeout(
        new Promise((resolve) => {
          recorder.addEventListener('stop', () => resolve(undefined), { once: true })
          try {
            recorder.requestData?.()
          } catch {
            /* ignore */
          }
          try {
            recorder.stop()
          } catch {
            resolve(undefined)
          }
        }),
        3000,
      )
    }

    try {
      video.pause()
    } catch {
      /* ignore */
    }
    video.removeAttribute('src')
    try {
      video.load()
    } catch {
      /* ignore */
    }
    urls.forEach((u) => {
      try {
        URL.revokeObjectURL(u)
      } catch {
        /* ignore */
      }
    })
    await withTimeout(
      (async () => {
        try {
          await audioCtx.close()
        } catch {
          /* ignore */
        }
      })(),
      1500,
    )
    signal?.removeEventListener('abort', onAbort)
  }

  if (aborted) throw new Error('ยกเลิก')

  const ext = isMp4 ? 'mp4' : 'webm'
  const blobType = mime.split(';')[0] || (isMp4 ? 'video/mp4' : 'video/webm')
  const blob = new Blob(chunks, { type: blobType })
  const filename = `${safeFilename(outputName)}.${ext}`

  let savedToFolder = false
  if (folderHandle) {
    savedToFolder = await writeToFolder(folderHandle, filename, blob)
  }
  if (!savedToFolder) {
    triggerDownload(blob, filename)
  }

  return { blob, mimeType: blobType, isMp4, filename, savedToFolder }
}
