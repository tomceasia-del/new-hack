/**
 * src/engine/demux.js — Module 1: Demuxer
 *
 * Exports:
 *   probeClip(file)                              → Promise<ProbeResult>  (fast, no samples)
 *   demuxClip(file)                              → Promise<DemuxResult>
 *   nearestKeyframeBefore(keyframeTimes, sec)    → number (seconds)
 *   extractAudioDecoderConfig(aTrack)            → Uint8Array | undefined
 *
 * DemuxResult: {
 *   videoSamples:     object[],   // mp4box samples, EncodedVideoChunk-ready
 *   audioSamples:     object[],   // raw AAC samples for passthrough
 *   info:             object,     // mp4box getInfo() result
 *   keyframeTimes:    number[],   // sorted keyframe timestamps (seconds)
 *   audioElstOffset:  number,     // edit list offset in audio track ticks (A3)
 * }
 *
 * Requires: MP4Box loaded globally (window.MP4Box via CDN in index.html)
 */

// ─────────────────────────────────────────────────────────
//  Public: probeClip (metadata only — no sample extraction)
// ─────────────────────────────────────────────────────────

/**
 * Fast container probe for Upload / Arrange UI.
 * Does NOT extract video/audio samples (unlike demuxClip) — avoids loading
 * entire mdat into sample buffers just to read duration and track layout.
 *
 * @param {File} file
 * @returns {Promise<{ info: object, durationSec: number, videoWidth: number, videoHeight: number, codec: string|null, hasVideo: boolean, hasAudio: boolean }>}
 */
export async function probeClip(file) {
  return new Promise((resolve, reject) => {
    const MP4Box = window.MP4Box
    if (!MP4Box) {
      reject(new Error('MP4Box not loaded — add CDN script to index.html'))
      return
    }

    const mp4 = MP4Box.createFile()
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error('mp4box: timeout — ไฟล์อาจไม่ใช่ MP4/MOV ที่อ่านได้'))
    }, 12000)

    mp4.onError = (e) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(new Error(`mp4box error: ${e}`))
    }

    mp4.onReady = (info) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      const v = info.videoTracks[0] ?? null
      const a = info.audioTracks[0] ?? null
      const dur = info.timescale ? info.duration / info.timescale : 0
      resolve({
        info,
        durationSec: dur,
        videoWidth:  v?.track_width ?? 0,
        videoHeight: v?.track_height ?? 0,
        codec:       v?.codec ?? null,
        hasVideo:    !!v,
        hasAudio:    !!a,
      })
    }

    file.arrayBuffer()
      .then((buffer) => {
        buffer.fileStart = 0
        mp4.appendBuffer(buffer)
        mp4.flush()
      })
      .catch((err) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(err)
      })
  })
}

// ─────────────────────────────────────────────────────────
//  Public: demuxClip
// ─────────────────────────────────────────────────────────

/**
 * Demux an MP4 File into video and audio samples.
 *
 * [A3 fix]: onSamples is declared INSIDE onReady callback.
 * trackTypeMap is built there, so it is always defined
 * when onSamples fires — no closure/timing bug.
 *
 * @param {File} file
 * @returns {Promise<DemuxResult>}
 */
export async function demuxClip(file) {
  return new Promise((resolve, reject) => {
    const MP4Box = window.MP4Box
    if (!MP4Box) {
      reject(new Error('MP4Box not loaded — add CDN script to index.html'))
      return
    }

    const mp4     = MP4Box.createFile()
    const samples = { video: [], audio: [] }
    let   resolvedInfo = null

    mp4.onError = (e) => reject(new Error(`mp4box error: ${e}`))

    // ── [A3 fix] onSamples declared INSIDE onReady ──────────────────────────
    mp4.onReady = (info) => {
      resolvedInfo = info

      // Total samples expected across all tracks — used to detect completion
      const totalExpected = info.tracks.reduce((sum, t) => sum + (t.nb_samples ?? 0), 0)
      let   totalCollected = 0

      console.debug(`[demux] onReady: ${info.tracks.length} tracks, totalExpected=${totalExpected}`)

      // Build track type map — keyed by track id
      const trackTypeMap = {}
      for (const t of info.videoTracks) trackTypeMap[t.id] = 'video'
      for (const t of info.audioTracks) trackTypeMap[t.id] = 'audio'

      // Assign onSamples now that trackTypeMap is ready in scope
      mp4.onSamples = (id, _user, sampleList) => {
        const type = trackTypeMap[id]
        if (type) samples[type].push(...sampleList)

        // Resolve when all expected samples have been collected
        totalCollected += sampleList.length
        console.debug(`[demux] onSamples id=${id} type=${type} +${sampleList.length} total=${totalCollected}/${totalExpected}`)
        if (totalExpected > 0 && totalCollected >= totalExpected) {
          finalize()
        }
      }

      // Request all samples from every track
      for (const track of info.tracks) {
        mp4.setExtractionOptions(track.id, null, { nbSamples: Infinity })
      }

      mp4.start()
    }
    // ────────────────────────────────────────────────────────────────────────

    // onFlush = secondary completion signal (fires after mp4.flush())
    // Primary = sample count in onSamples above
    mp4.onFlush = () => finalize()

    let finalized = false
    function finalize() {
      if (finalized) return
      finalized = true

      if (!resolvedInfo) {
        reject(new Error('mp4box: no track info — is this a valid MP4?'))
        return
      }

      const vTrack = resolvedInfo.videoTracks[0] ?? null
      const aTrack = resolvedInfo.audioTracks[0] ?? null

      resolve({
        videoSamples:    samples.video,
        audioSamples:    samples.audio,
        info:            resolvedInfo,
        keyframeTimes:   buildKeyframeTimes(samples.video, vTrack?.timescale ?? 90000),
        audioElstOffset: getAudioElstOffset(aTrack),
      })
    }

    // Feed the entire file as one ArrayBuffer
    file.arrayBuffer()
      .then((buffer) => {
        buffer.fileStart = 0
        mp4.appendBuffer(buffer)
        mp4.flush()

        // Timeout fallback: onFlush doesn't fire in mp4box 0.5.2 when the whole
        // buffer is fed at once. sample-count tracking (above) is primary.
        // This is the last-resort safety net if both mechanisms miss.
        setTimeout(() => {
          if (!finalized) {
            console.warn(`[demux] timeout fallback fired. video=${samples.video.length} audio=${samples.audio.length}`)
            finalize()
          }
        }, 3000)
      })
      .catch(reject)
  })
}

// ─────────────────────────────────────────────────────────
//  Public: nearestKeyframeBefore
// ─────────────────────────────────────────────────────────

/**
 * Binary search — return the latest keyframe timestamp ≤ targetSec.
 *
 * Used by trim UI (snap to keyframe) and export seek.
 * Time complexity: O(log n)
 *
 * @param {number[]} keyframeTimes  sorted array from buildKeyframeTimes()
 * @param {number}   targetSec
 * @returns {number}                keyframe timestamp in seconds
 */
export function nearestKeyframeBefore(keyframeTimes, targetSec) {
  if (!keyframeTimes.length) return 0

  let lo = 0
  let hi = keyframeTimes.length - 1

  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (keyframeTimes[mid] <= targetSec) lo = mid
    else hi = mid - 1
  }

  return keyframeTimes[lo]
}

// ─────────────────────────────────────────────────────────
//  Public: extractAudioDecoderConfig
// ─────────────────────────────────────────────────────────

/**
 * Extract AudioDecoderConfig description bytes from an mp4box audio track.
 *
 * Used by ExportSession when sending the first audio chunk to mp4-muxer
 * (A2 fix: audioConfigSent flag — send config with first audio sample found,
 *  regardless of which clip index it comes from).
 *
 * @param {object|null} aTrack  mp4box audio track object
 * @returns {Uint8Array|undefined}
 */
export function extractAudioDecoderConfig(aTrack) {
  if (!aTrack) return undefined

  const stsd  = aTrack.trak?.mdia?.minf?.stbl?.stsd
  const entry = stsd?.entries?.[0]

  return (
    entry?.esds?.esd?.descs?.[0]?.descs?.[0]?.DecoderSpecificInfo?.data ??
    entry?.DecoderSpecificInfo ??
    undefined
  )
}

// ─────────────────────────────────────────────────────────
//  Private: buildKeyframeTimes
// ─────────────────────────────────────────────────────────

/**
 * Build a sorted array of keyframe timestamps (seconds) from video samples.
 *
 * Uses sample.is_sync (set by mp4box from stss box) — simpler and more
 * reliable than reading stss/stts boxes directly, since mp4box TrackDescription
 * objects don't expose raw box trees.
 *
 * @param {object[]} videoSamples  collected from onSamples
 * @param {number}   timescale     from info.videoTracks[0].timescale
 * @returns {number[]}             sorted keyframe timestamps in seconds
 */
function buildKeyframeTimes(videoSamples, timescale) {
  if (!videoSamples.length || !timescale) return []

  // Debug: inspect first sample to verify is_sync property exists
  const first = videoSamples[0]
  console.debug('[demux] first sample keys:', Object.keys(first))
  console.debug('[demux] first sample is_sync:', first.is_sync, '| flags:', first.flags, '| is_leading:', first.is_leading)

  const syncSamples = videoSamples.filter(s => s.is_sync)
  console.debug(`[demux] keyframes via is_sync: ${syncSamples.length} / ${videoSamples.length} samples`)

  // Fallback: if is_sync is never set, derive from sample flags (RAP bit = 0x02000000)
  if (syncSamples.length === 0) {
    console.warn('[demux] is_sync=false for all samples — trying flags fallback')
    const byFlags = videoSamples.filter(s => (s.flags & 0x02000000) === 0)
    console.debug(`[demux] keyframes via flags fallback: ${byFlags.length}`)
    if (byFlags.length > 0) {
      return byFlags.map(s => s.cts / timescale)
    }
    // Last resort: assume first sample of every second is a keyframe
    console.warn('[demux] flags fallback also 0 — returning first sample only')
    return [videoSamples[0].cts / timescale]
  }

  return syncSamples.map(s => s.cts / timescale)
}

// ─────────────────────────────────────────────────────────
//  Private: getAudioElstOffset
// ─────────────────────────────────────────────────────────

/**
 * Return the edit list media_time for the audio track.
 *
 * Some encoders (iPhone, CapCut) write an EditList (elst box) to skip
 * encoder priming samples (~2112 AAC silent frames) at the start.
 * This offset must be subtracted from audio sample CTS before muxing,
 * otherwise audio starts late per clip and drifts across multiple clips.
 *
 * @param {object|null} aTrack  mp4box audio track
 * @returns {number}            media_time in audio track timescale ticks (0 if absent)
 */
function getAudioElstOffset(aTrack) {
  if (!aTrack) return 0

  const entries = aTrack.trak?.edts?.elst?.entries
  if (!entries?.length) return 0

  // entry[0].media_time = start of real audio in media timeline
  return entries[0].media_time ?? 0
}
