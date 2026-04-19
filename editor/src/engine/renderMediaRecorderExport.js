/**
 * Export ช่วง trim ด้วย MediaRecorder + video.captureStream()
 * ผลลัพธ์มักเป็น WebM (VP8/VP9) — ดาวน์โหลดอัตโนมัติ
 * เวลารอโดยประมาณ ≈ (trimOut − trimIn) / playbackSpeed (วินาทีจริง)
 */

/** จำกัดความเร็วให้สอดคล้องกับ UI พรีวิว (1.0 … 1.5 ขั้น 0.05) */
function clampExportPlaybackSpeed(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 1
  const clamped = Math.min(1.5, Math.max(1, n))
  return Math.round((clamped / 0.05) * 0.05 * 100) / 100
}

/**
 * @param {HTMLVideoElement} video
 * @returns {Promise<void>}
 */
function waitSeeked(video) {
  return new Promise((resolve, reject) => {
    video.addEventListener('seeked', () => resolve(), { once: true })
    video.addEventListener('error', () => reject(new Error('seek วิดีโอล้มเหลว')), { once: true })
  })
}

function pickRecorderMime() {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

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

function safeFilename(name) {
  return String(name || 'clip')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

/**
 * @param {{ file: File, trimInSec: number, trimOutSec: number, name?: string }} clip
 * @param {{ signal?: AbortSignal, onTick?: (t: number) => void, playbackSpeed?: number }} [opts]
 *   playbackSpeed — ความเร็วเดียวกับพรีวิว (ค่าเริ่มต้น 1)
 * @returns {Promise<Blob>}
 */
export async function exportClipWithMediaRecorder(clip, opts = {}) {
  const { signal, onTick, playbackSpeed: playbackSpeedRaw } = opts
  const playbackSpeed = clampExportPlaybackSpeed(playbackSpeedRaw ?? 1)
  const mime = pickRecorderMime()
  if (!mime) throw new Error('เบราว์เซอร์นี้ไม่รองรับการบันทึกวิดีโอ (ลอง Chrome desktop)')

  const t0 = Math.max(0, clip.trimInSec)
  const t1 = Math.max(t0 + 0.05, clip.trimOutSec)
  const dur = t1 - t0
  if (!Number.isFinite(dur) || dur < 0.05) throw new Error('ช่วงตัดสั้นเกินไป')

  const url = URL.createObjectURL(clip.file)
  const video = document.createElement('video')
  video.src = url
  video.playsInline = true
  video.muted = false

  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('โหลด metadata หมดเวลา')), 20_000)
      const done = () => clearTimeout(timer)
      video.addEventListener(
        'loadedmetadata',
        () => {
          done()
          resolve()
        },
        { once: true },
      )
      video.addEventListener(
        'error',
        () => {
          done()
          reject(new Error('โหลดวิดีโอไม่ได้'))
        },
        { once: true },
      )
    })

    video.currentTime = t0
    await waitSeeked(video)

    try {
      video.playbackRate = playbackSpeed
    } catch {
      video.playbackRate = 1
    }

    const stream = video.captureStream()
    if (!stream.getVideoTracks().length) {
      throw new Error('captureStream ไม่มีวิดีโอ — ลองไฟล์อื่น')
    }

    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 })
    const chunks = /** @type {Blob[]} */ ([])
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data)
    }

    await new Promise((resolve, reject) => {
      let tickIv = /** @type {ReturnType<typeof setInterval> | null} */ (null)

      const onAbort = () => {
        if (tickIv) clearInterval(tickIv)
        tickIv = null
        try {
          video.pause()
        } catch {
          /* ignore */
        }
        try {
          rec.stop()
        } catch {
          /* ignore */
        }
        stream.getTracks().forEach((tr) => {
          try {
            tr.stop()
          } catch {
            /* ignore */
          }
        })
        reject(new Error('ยกเลิก'))
      }
      signal?.addEventListener('abort', onAbort, { once: true })

      rec.onerror = (ev) => {
        if (tickIv) clearInterval(tickIv)
        signal?.removeEventListener('abort', onAbort)
        try {
          video.pause()
        } catch {
          /* ignore */
        }
        stream.getTracks().forEach((tr) => {
          try {
            tr.stop()
          } catch {
            /* ignore */
          }
        })
        reject(ev.error || new Error('MediaRecorder error'))
      }

      rec.onstop = () => {
        if (tickIv) clearInterval(tickIv)
        signal?.removeEventListener('abort', onAbort)
        stream.getTracks().forEach((tr) => {
          try {
            tr.stop()
          } catch {
            /* ignore */
          }
        })
        resolve()
      }

      tickIv = setInterval(() => {
        if (signal?.aborted) return
        const t = video.currentTime
        onTick?.(t)
        if (t >= t1 - 0.04) {
          if (tickIv) clearInterval(tickIv)
          tickIv = null
          video.pause()
          try {
            rec.requestData?.()
          } catch {
            /* ignore */
          }
          setTimeout(() => {
            try {
              rec.stop()
            } catch {
              /* ignore */
            }
          }, 200)
        }
      }, 40)

      rec.start(400)
      video.play().catch((e) => {
        if (tickIv) clearInterval(tickIv)
        signal?.removeEventListener('abort', onAbort)
        stream.getTracks().forEach((tr) => {
          try {
            tr.stop()
          } catch {
            /* ignore */
          }
        })
        reject(e instanceof Error ? e : new Error(String(e)))
      })
    })

    const ext = mime.includes('webm') ? 'webm' : 'bin'
    const base = safeFilename(clip.name || clip.file.name || 'export')
    const blob = new Blob(chunks, { type: mime.split(';')[0] || 'video/webm' })
    triggerDownload(blob, `${base}-trim.${ext}`)
    return blob
  } finally {
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
    video.load()
  }
}

/**
 * @param {Array<{ file: File, trimInSec: number, trimOutSec: number, name?: string }>} clips
 * @param {{ signal?: AbortSignal, onClipStart?: (i: number, n: number) => void, playbackSpeed?: number }} [opts]
 */
export async function exportAllClipsSequentially(clips, opts = {}) {
  const { signal, onClipStart, playbackSpeed } = opts
  if (!clips.length) throw new Error('ไม่มีคลิป')
  let i = 0
  for (const c of clips) {
    if (signal?.aborted) throw new Error('ยกเลิก')
    onClipStart?.(i, clips.length)
    await exportClipWithMediaRecorder(c, { signal, playbackSpeed })
    i += 1
    if (i < clips.length) await new Promise((r) => setTimeout(r, 700))
  }
}
