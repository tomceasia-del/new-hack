/**
 * Phase C — อัปโหลดชั่วคราวไป endpoint ของคุณ แล้วแชร์เป็น URL (navigator.share)
 *
 * ตั้งค่า: เก็บ URL ใน localStorage ผ่าน UI หรือ DevTools
 * สัญญาเซิร์ฟเวอร์ (แนะนำ):
 *   - POST multipart/form-data ฟิลด์ชื่อ `file` = ไฟล์วิดีโอ
 *   - Response: Content-Type application/json แบบ { "url": "https://..." }
 *     หรือ body เป็น plain text URL เดียว
 *   - ต้องตั้ง CORS ให้ origin ของแอป (เช่น https://yourdomain) และไม่ควรใช้ credentials จากเบราว์เซอร์
 */

const LS_UPLOAD_ENDPOINT = 'vdo-editor-share-upload-endpoint'

function isValidHttpUrl(s) {
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/** @returns {string} URL ฐานที่ใช้ POST หรือสตริงว่าง */
export function getShareUploadEndpoint() {
  try {
    const raw = localStorage.getItem(LS_UPLOAD_ENDPOINT)?.trim()
    if (!raw || !isValidHttpUrl(raw)) return ''
    return raw
  } catch {
    return ''
  }
}

/** @param {string} url */
export function setShareUploadEndpoint(url) {
  const t = String(url || '').trim()
  if (!t) {
    try {
      localStorage.removeItem(LS_UPLOAD_ENDPOINT)
    } catch {
      /* ignore */
    }
    return
  }
  if (!isValidHttpUrl(t)) return
  try {
    localStorage.setItem(LS_UPLOAD_ENDPOINT, t)
  } catch {
    /* ignore */
  }
}

/**
 * @param {Blob} blob
 * @param {string} filename
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [opts]
 * @returns {Promise<string|null>} URL สาธารณะ หรือ null ถ้าไม่ได้ตั้ง endpoint
 */
export async function uploadVideoForShareLink(blob, filename, opts = {}) {
  const endpoint = getShareUploadEndpoint()
  if (!endpoint) return null

  const timeoutMs = Math.max(10_000, opts.timeoutMs ?? 120_000)
  const fd = new FormData()
  fd.append('file', blob, filename)

  const ctrl = new AbortController()
  const tid = setTimeout(() => ctrl.abort(), timeoutMs)
  if (opts.signal) {
    if (opts.signal.aborted) ctrl.abort()
    else opts.signal.addEventListener('abort', () => ctrl.abort(), { once: true })
  }
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: fd,
      mode: 'cors',
      credentials: 'omit',
      signal: ctrl.signal,
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    if (ct.includes('application/json')) {
      const j = await res.json()
      const url =
        (typeof j.url === 'string' && j.url) ||
        (typeof j.publicUrl === 'string' && j.publicUrl) ||
        (typeof j.link === 'string' && j.link) ||
        (typeof j.href === 'string' && j.href) ||
        ''
      if (url.startsWith('http')) return url
      throw new Error('JSON ตอบกลับไม่มีฟิลด์ url')
    }
    const text = (await res.text()).trim()
    const m = text.match(/https?:\/\/[^\s"'<>]+/)
    const url = m ? m[0] : text
    if (url.startsWith('http')) return url
    throw new Error('ตอบกลับไม่ใช่ URL')
  } finally {
    clearTimeout(tid)
  }
}
