/**
 * บันทึกโปรเจกต์: IndexedDB (ไฟล์คลิป + meta) + ดาวน์โหลด JSON metadata
 */

const DB_NAME = 'vdo-editor-v2'
const DB_VERSION = 1

/**
 * @returns {Promise<IDBDatabase>}
 */
function openEditorDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (ev) => {
      const db = /** @type {IDBDatabase} */ (ev.target.result)
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files')
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
    }
  })
}

/**
 * @param {Array<{ id: string, file: File, name: string, trimInSec: number, trimOutSec: number, durationSec: number }>} clips
 * @param {string} captionDraftText
 * @param {number} [trimPreviewPlaybackSpeed] ความเร็วพรีวิว 1.0–1.5
 */
export async function saveProjectToIndexedDB(clips, captionDraftText, trimPreviewPlaybackSpeed = 1) {
  const db = await openEditorDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['files', 'meta'], 'readwrite')
    tx.onerror = () => reject(tx.error ?? new Error('indexedDB transaction failed'))
    tx.oncomplete = () => resolve()

    const files = tx.objectStore('files')
    for (const c of clips) {
      files.put(c.file, c.id)
    }

    const payload = {
      savedAt: Date.now(),
      captionDraftText,
      trimPreviewPlaybackSpeed,
      clipIds: clips.map((c) => c.id),
      clipMeta: clips.map((c) => ({
        id: c.id,
        name: c.name,
        trimInSec: c.trimInSec,
        trimOutSec: c.trimOutSec,
        durationSec: c.durationSec,
      })),
    }
    tx.objectStore('meta').put(payload, 'last')
  })
}

/**
 * @param {Array<{ id: string, name: string, trimInSec: number, trimOutSec: number, durationSec: number }>} clipsMeta
 * @param {string} captionDraftText
 * @param {number} [trimPreviewPlaybackSpeed]
 */
export function downloadProjectMetadataJson(clipsMeta, captionDraftText, trimPreviewPlaybackSpeed = 1) {
  const body = JSON.stringify(
    {
      v: 1,
      savedAt: new Date().toISOString(),
      captionDraftText,
      trimPreviewPlaybackSpeed,
      clips: clipsMeta,
    },
    null,
    2,
  )
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([body], { type: 'application/json;charset=utf-8' }))
  a.download = `vdo-project-${Date.now()}.json`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000)
}
