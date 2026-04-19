/**
 * src/engine/deviceCapabilities.js — ตรวจความสามารถของ device
 *
 * ใช้เลือก render strategy:
 *   - desktop Chrome → bg render + speculative preload
 *   - mobile ใหม่ → preload ได้ แต่ไม่ bg render
 *   - mobile เก่า → direct transition, ไม่มี preload
 *
 * ทุก fn เป็น pure + SSR-safe (guard navigator/window undefined)
 */

/** อ่าน userAgent แบบปลอดภัย — ถ้าไม่มี navigator คืน '' */
function ua() {
  return typeof navigator !== 'undefined' ? (navigator.userAgent || '') : ''
}

/**
 * Chrome/Chromium desktop เท่านั้น
 * — ไม่ใช่ iOS/Android, ไม่ใช่ Safari, ไม่ใช่ Edge/Opera
 * @returns {boolean}
 */
export function isChromeDesktop() {
  if (typeof navigator === 'undefined') return false
  const s = ua()
  if (/iPhone|iPad|iPod|Android/i.test(s)) return false
  if (/Edg\/|OPR\//.test(s)) return false
  if (/Safari/.test(s) && !/Chrome/.test(s)) return false
  return /Chrome\/\d+/.test(s)
}

/**
 * Mobile OS ทุกตัว (iPhone / iPad / iPod / Android)
 * @returns {boolean}
 */
export function isMobile() {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod|Android/i.test(ua())
}

/**
 * Mobile รุ่นเก่า — ไม่เปิด bg render, preload ลดลง
 *
 * เกณฑ์ (ถือว่าเก่าถ้าตรงข้อใดข้อหนึ่ง):
 *   - deviceMemory < 4 GB
 *   - hardwareConcurrency < 6 core
 *   - iOS < 16 (UA: "OS 15_x")
 *   - ไม่เจอ hint อะไรเลย → เก่าไว้ก่อน (ปลอดภัย)
 * @returns {boolean}
 */
export function isOldMobile() {
  if (!isMobile()) return false

  const nav = typeof navigator !== 'undefined' ? navigator : null
  let sawHint = false

  if (nav && typeof nav.deviceMemory === 'number') {
    sawHint = true
    if (nav.deviceMemory < 4) return true
  }

  if (nav && typeof nav.hardwareConcurrency === 'number') {
    sawHint = true
    if (nav.hardwareConcurrency < 6) return true
  }

  const s = ua()
  const iosMatch = s.match(/OS (\d+)[_ ]/)
  if (iosMatch) {
    sawHint = true
    const major = parseInt(iosMatch[1], 10)
    if (Number.isFinite(major) && major < 16) return true
  }

  return !sawHint
}

/**
 * รองรับ WebCodecs (VideoEncoder + AudioEncoder)
 * @returns {boolean}
 */
export function hasWebCodecs() {
  return typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined'
}

/**
 * เลือก render strategy ตาม device
 * @returns {'desktop-bg' | 'desktop-foreground' | 'mobile-direct'}
 */
export function getRenderStrategy() {
  if (isChromeDesktop()) return 'desktop-bg'
  if (isMobile()) return 'mobile-direct'
  return 'desktop-foreground'
}

/**
 * ควรทำ speculative preload หรือไม่
 * — Chrome desktop เสมอ, mobile ใหม่ได้, mobile เก่าไม่เอา
 * @returns {boolean}
 */
export function shouldSpeculativelyPreload() {
  return isChromeDesktop() || (isMobile() && !isOldMobile())
}

/**
 * เวลารอสูงสุดระหว่าง transition (ms) — รอ preload พร้อม
 *   - Chrome desktop → 1500
 *   - Mobile ใหม่ → 2500 (โหลดช้ากว่า)
 *   - อื่น ๆ → 0 (ไม่รอ)
 * @returns {number}
 */
export function getTransitionCapMs() {
  if (isChromeDesktop()) return 1500
  if (isMobile() && !isOldMobile()) return 2500
  return 0
}

/**
 * ดีเลย์ก่อนเริ่ม background render (ms)
 *   - desktop-bg → 4000
 *   - อื่น ๆ → 0
 * @returns {number}
 */
export function getBgRenderDelayMs() {
  return getRenderStrategy() === 'desktop-bg' ? 4000 : 0
}
