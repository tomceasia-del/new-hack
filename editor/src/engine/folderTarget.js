/**
 * โฟลเดอร์ปลายทางสำหรับไฟล์ Render
 * - ใช้ File System Access API (Chrome)
 * - เก็บ handle ใน IndexedDB (persist ข้าม session แต่ต้องขอ permission อีกครั้งตามสเปค)
 */

const DB_NAME = 'vdo-editor-v2'
const STORE = 'meta'
const KEY = 'renderFolderHandle'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (ev) => {
      const db = /** @type {IDBDatabase} */ (ev.target.result)
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files')
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
  })
}

export function isFolderPickerSupported() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

/** @returns {Promise<FileSystemDirectoryHandle | null>} */
export async function pickRenderFolder() {
  if (!isFolderPickerSupported()) return null
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
    await saveRenderFolderHandle(handle)
    return handle
  } catch {
    return null
  }
}

/** @param {FileSystemDirectoryHandle} handle */
export async function saveRenderFolderHandle(handle) {
  try {
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => resolve(undefined)
      tx.onerror = () => reject(tx.error ?? new Error('tx error'))
      tx.objectStore(STORE).put(handle, KEY)
    })
  } catch {
    /* ignore */
  }
}

/** @returns {Promise<FileSystemDirectoryHandle | null>} */
export async function loadRenderFolderHandle() {
  try {
    const db = await openDB()
    /** @type {FileSystemDirectoryHandle | null} */
    const handle = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error ?? new Error('get error'))
    })
    return handle
  } catch {
    return null
  }
}

export async function clearRenderFolderHandle() {
  try {
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => resolve(undefined)
      tx.onerror = () => reject(tx.error ?? new Error('tx error'))
      tx.objectStore(STORE).delete(KEY)
    })
  } catch {
    /* ignore */
  }
}

/**
 * ตรวจว่ายังมีสิทธิ์เขียนอยู่; ถ้ายังไม่ granted จะขอใหม่ (ต้องมี user gesture)
 * @param {FileSystemDirectoryHandle} handle
 */
export async function ensureFolderPermission(handle) {
  try {
    const q = await handle.queryPermission?.({ mode: 'readwrite' })
    if (q === 'granted') return true
    const r = await handle.requestPermission?.({ mode: 'readwrite' })
    return r === 'granted'
  } catch {
    return false
  }
}
