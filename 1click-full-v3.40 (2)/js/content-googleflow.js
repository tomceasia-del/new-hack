// Content Script for Google Flow (labs.google/fx/tools/flow)
// This script handles automation on Google Flow page

console.log('[TikTok Auto] Google Flow Content Script loaded');

// ════════════════════════════════════════════════════════════════════════════
// ★★★ GLOBAL FLAGS - แยกแต่ละระบบไม่ให้ทำงานซ้ำซ้อน ★★★
// ════════════════════════════════════════════════════════════════════════════

let currentFlowData = null;
let isZoomedOut = false;

// ★★★ PD-INSPIRED: Clean step naming (step1_ through step6_ prefix) ★★★
// Autopost pipeline steps
const AUTOPOST_STEPS = {
  step1_NewProject:      'step1: New Project',
  step2_SelectMode:      'step2: Select Image/Portrait/x1',
  step3_UploadImage:     'step3: Upload Image',
  step4_HoverAddPrompt:  'step4: Hover Image + Add to Prompt',
  step5_PastePrompt:     'step5: Paste Prompt',
  step6_Generate:        'step6: Generate',
  step7_WaitImage:       'step7: Wait for Image',
  step8_AddToVideoPrompt:'step8: Add Image to Video Prompt',
  step9_PasteVideoPrompt:'step9: Paste Video Prompt',
  step10_SelectVideo:    'step10: Select Video + Frames',
  step11_WaitVideo:      'step11: Wait for Video',
  step12_Download:       'step12: Download Video',
  step13_ClickExtend:    'step13: Click Video to Extend',
  step14_PasteExtend:    'step14: Paste Extend Prompt',
  step15_GenerateExtend: 'step15: Generate Extend',
  step16_WaitExtend:     'step16: Wait for Extended Video',
  step17_OpenTikTok:     'step17: Open TikTok Upload'
};

// Storymode pipeline steps
const STORY_STEPS = {
  step1_SelectMode:      'Scene Step 1: Select Image/Portrait/x1',
  step2_PastePrompt:     'Scene Step 2: Paste Image Prompt',
  step3_Generate:        'Scene Step 3: Click Generate',
  step4_AddToPrompt:     'Scene Step 4: Add Image to Prompt',
  step5_SelectVideo:     'Scene Step 5: Select Video Tabs',
  step6_GenerateVideo:   'Scene Step 6: Click Generate Video',
  step7_AddToScene:      'Scene Step 7: Add Video to Scene'
};

async function getSafeFlowData() {
  const result = await chrome.storage.local.get(['currentFlowData']);
  const stored = result.currentFlowData || {};
  if (currentFlowData?.itemId && stored.itemId && stored.itemId !== currentFlowData.itemId) {
    console.warn('[TikTok Auto] ⚠️ itemId mismatch — storage:', stored.itemId, '| local:', currentFlowData.itemId, '— using local copy to prevent product mixup');
    return { ...currentFlowData };
  }
  return stored;
}

/** ความยาวคลิปเป้าหมาย (8/16) — อ่านจาก currentFlowData + backup ที่ผูก itemId (กัน clipDuration หลุดเป็น 8 และกัน backup ค้างข้ามรัน) */
async function getTargetClipDuration() {
  const r = await chrome.storage.local.get(['currentFlowData', 'autopostTargetClipDuration', 'autopostTargetItemId']);
  const fd = r.currentFlowData || {};
  const fromData = Number(fd.clipDuration);
  const backupDur = Number(r.autopostTargetClipDuration);
  const backupId = r.autopostTargetItemId;
  const itemId = fd.itemId;
  const sameItem =
    backupId != null &&
    itemId != null &&
    String(backupId) === String(itemId);

  let result = 8;
  let source = 'default';
  if (fromData === 16) { result = 16; source = 'currentFlowData.clipDuration'; }
  else if (sameItem && backupDur === 16) { result = 16; source = 'backup (autopostTargetClipDuration)'; }
  else if (fromData === 8) { result = 8; source = 'currentFlowData.clipDuration'; }
  else if (sameItem && backupDur === 8) { result = 8; source = 'backup (autopostTargetClipDuration)'; }

  console.log(`[TikTok Auto] getTargetClipDuration() = ${result} (source: ${source}) | fd.clipDuration=${fd.clipDuration} (Number=${fromData}) | backup=${backupDur} | sameItem=${sameItem} | itemId=${itemId} | backupId=${backupId}`);
  return result;
}

// ★ Flags สำหรับแต่ละระบบ - ห้ามทำงานพร้อมกัน ★
let _autoPostRunning = false;    // Auto Post กำลังทำงาน
let _storymodeRunning = false;   // Storymode/Pipeline กำลังทำงาน
let _studioRunning = false;      // Studio กำลังทำงาน
let _autoV2Running = false;      // Auto V2 กำลังทำงาน

// ★ Track uploaded reference image srcs to exclude from video detection ★
let _uploadedRefImageSrcs = new Set();

// ★ ฟังก์ชันเช็คว่าระบบไหนกำลังทำงานอยู่ ★
function getCurrentRunningSystem() {
  if (_autoPostRunning) return 'autopost';
  if (_autoV2Running) return 'autov2';
  if (_storymodeRunning) return 'storymode';
  if (_studioRunning) return 'studio';
  return null;
}

// ★ ฟังก์ชันเช็คว่าสามารถเริ่มระบบใหม่ได้หรือไม่ ★
function canStartSystem(systemName) {
  const currentSystem = getCurrentRunningSystem();
  if (currentSystem && currentSystem !== systemName) {
    console.log(`[TikTok Auto] ⚠️ ไม่สามารถเริ่ม ${systemName} ได้ - ${currentSystem} กำลังทำงานอยู่`);
    showNotification(`⚠️ ${currentSystem} กำลังทำงานอยู่`);
    return false;
  }
  return true;
}

// ★ ฟังก์ชันเริ่มระบบ ★
function startSystem(systemName) {
  if (!canStartSystem(systemName)) return false;
  
  // Reset all flags first
  _autoPostRunning = false;
  _autoV2Running = false;
  _storymodeRunning = false;
  _studioRunning = false;
  
  // Set the new system flag
  if (systemName === 'autopost') _autoPostRunning = true;
  else if (systemName === 'autov2') _autoV2Running = true;
  else if (systemName === 'storymode') _storymodeRunning = true;
  else if (systemName === 'studio') _studioRunning = true;
  
  console.log(`[TikTok Auto] ✅ เริ่ม ${systemName}`);
  return true;
}

// ★ ฟังก์ชันจับภาพหน้าจอ ★
async function captureScreenshot(filename = null, autoDownload = true) {
  console.log('[TikTok Auto] Capturing screenshot...');
  showNotification('📸 กำลังจับภาพหน้าจอ...');
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CAPTURE_SCREENSHOT',
      autoDownload: autoDownload,
      filename: filename || `storymode_screenshot_${Date.now()}.png`
    });
    
    if (response && response.success) {
      console.log('[TikTok Auto] Screenshot captured successfully!');
      showNotification('✅ จับภาพหน้าจอสำเร็จ!');
      return response.dataUrl;
    } else {
      console.error('[TikTok Auto] Screenshot failed:', response?.error);
      showNotification('❌ จับภาพหน้าจอล้มเหลว');
      return null;
    }
  } catch (e) {
    console.error('[TikTok Auto] Screenshot error:', e);
    showNotification('❌ จับภาพหน้าจอล้มเหลว');
    return null;
  }
}

// ★ ฟังก์ชันหยุดระบบ ★
function stopSystem(systemName) {
  if (systemName === 'autopost') _autoPostRunning = false;
  else if (systemName === 'storymode') _storymodeRunning = false;
  else if (systemName === 'studio') _studioRunning = false;
  else {
    // Stop all
    _autoPostRunning = false;
    _storymodeRunning = false;
    _studioRunning = false;
  }
  console.log(`[TikTok Auto] 🛑 หยุด ${systemName || 'all'}`);
}

// Legacy flags (for backward compatibility)
let isProcessing = false;
let flowStopped = false;

// เช็คว่า flow ถูกหยุดหรือข้ามหรือไม่ (สำหรับ Auto Post เท่านั้น)
async function isFlowStopped() {
  try {
    const result = await chrome.storage.local.get(['flowStatus', 'flowType']);
    const status = result.flowStatus;
    const flowType = result.flowType;
    
    // ★ ถ้าไม่ใช่ Auto Post / Auto V2 ไม่ต้องเช็ค flowStatus ★
    if ((flowType !== 'autopost' && flowType !== 'autov2') || (!_autoPostRunning && !_autoV2Running)) {
      return false;
    }
    
    if (status === 'stopped' || status === 'skipped') {
      console.log(`[TikTok Auto] Flow ${status} - หยุดการทำงาน`);
      flowStopped = true;
      isProcessing = false;
      _autoPostRunning = false;
      _autoV2Running = false;
      showNotification(`🛑 ${status === 'stopped' ? 'หยุดโดยผู้ใช้' : 'ข้ามรายการนี้'}`);
      return true;
    }
    // ★ ถ้าเป็น flow_error (policy violation etc.) ให้หยุด chain ทันที ★
    if (status === 'flow_error') {
      console.log('[TikTok Auto] Flow error detected — stopping current chain');
      flowStopped = true;
      isProcessing = false;
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// Safe delay ที่เช็ค stop ทุก 2 วินาที
async function safeDelay(ms) {
  const interval = 2000;
  let elapsed = 0;
  while (elapsed < ms) {
    const wait = Math.min(interval, ms - elapsed);
    await new Promise(resolve => setTimeout(resolve, wait));
    elapsed += wait;
    if (await isFlowStopped()) return false;
  }
  return true;
}

// Wrapper: เรียก step ถัดไป โดยเช็ค stop ก่อน
async function runNextStep(stepFn) {
  if (await isFlowStopped()) {
    console.log('[TikTok Auto] Flow stopped - ไม่ทำ step ถัดไป');
    return;
  }
  await stepFn();
}

// ★ Crash check helper: เช็คว่า Google Labs ล่มหรือยัง — เรียกก่อนทุก step สำคัญ ★
// ★ FIX: ต้องเช็คว่าเป็น error page จริง (ไม่มี UI elements) ไม่ใช่แค่มี text ค้างจาก extension notification ★
function isPageCrashed() {
  const hasFlowUI = document.querySelector('textarea, [contenteditable], button[aria-label]');
  if (hasFlowUI) return false; // ยังมี UI อยู่ → ไม่ได้ crash
  const mainContent = document.querySelector('main, #__next, [role="main"]');
  const checkText = (mainContent?.innerText || document.title || '').toLowerCase();
  return checkText.includes('application error') || checkText.includes('client-side exception');
}

// ★ Generation Failed / Policy Violation check — เช็คว่า generate ล้มเหลวหรือถูก reject ★
// return object { failed: true, reason: '...' } หรือ { failed: false }
function isGenerationFailed() {
  // 1. สแกน visible elements ที่มี "Failed" text
  const allElements = document.querySelectorAll('div, span, p, section, [role="alert"], [class*="error"], [class*="fail"], [class*="warning"]');
  for (const el of allElements) {
    if (el.offsetParent === null && !el.closest('[class*="overlay"]')) continue; // ซ่อนอยู่ → ข้าม
    const text = el.textContent?.trim() || '';
    if (text.length < 5 || text.length > 500) continue;
    const lower = text.toLowerCase();
    
    // Pattern: "Failed" + policy/violate keywords
    if (lower.includes('failed') && (lower.includes('violat') || lower.includes('policies') || lower.includes('sexual') || lower.includes('try a different'))) {
      console.log('[TikTok Auto] isGenerationFailed: Policy violation detected:', text.substring(0, 100));
      return { failed: true, reason: 'policy_violation', text: text.substring(0, 100) };
    }
    // Pattern: "Failed" standalone ใน card ที่มี icon ⚠️
    if ((lower.startsWith('failed') || lower.startsWith('⚠')) && lower.includes('prompt')) {
      console.log('[TikTok Auto] isGenerationFailed: Failed prompt detected:', text.substring(0, 100));
      return { failed: true, reason: 'failed_prompt', text: text.substring(0, 100) };
    }
  }
  
  // 2. Fallback: สแกนเฉพาะ toast/snackbar/alert elements (ไม่สแกน body ทั้งหมด — ลด false positive)
  const toastElements = document.querySelectorAll('[class*="toast"], [class*="snackbar"], [role="alert"]');
  for (const el of toastElements) {
    if (el.offsetParent === null) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > 800 && rect.height > 400) continue;
    const t = (el.textContent || '').toLowerCase().trim();
    if (t.length < 5 || t.length > 300) continue;
    if (t.includes('failed') && (t.includes('violat') || t.includes('policies') || t.includes('try a different'))) {
      return { failed: true, reason: 'policy_violation_toast', text: t.substring(0, 100) };
    }
    if (t.includes('audio generation failed')) {
      return { failed: true, reason: 'audio_generation_failed', text: t.substring(0, 100) };
    }
  }
  
  return { failed: false };
}

// ★★★ PD-INSPIRED: clickRetryOnFailedCard — กดปุ่ม Retry ของ Flow โดยตรง ★★★
// แทนการ re-generate ใหม่ทั้งหมด (เสถียรกว่า + เร็วกว่า)
async function clickRetryOnFailedCard() {
  console.log('[Flow] Looking for failed card retry button...');

  // Method 1: หาปุ่มที่มี text "Retry" หรือ "ลองอีกครั้ง" ใกล้กับ "Failed" badge
  const allButtons = document.querySelectorAll('button, [role="button"]');
  for (const btn of allButtons) {
    if (btn.offsetParent === null) continue;
    const text = (btn.textContent || '').trim().toLowerCase();
    if (text === 'retry' || text === 'ลองอีกครั้ง' || text === 'try again') {
      console.log('[Flow] Found retry button by text:', text);
      await simulateRealClick(btn);
      return true;
    }
  }

  // Method 2: หา icon "refresh" หรือ "replay" ใน failed card area
  const icons = document.querySelectorAll('i.google-symbols, span.google-symbols, i.material-icons');
  for (const icon of icons) {
    const iconText = (icon.textContent || '').trim().toLowerCase();
    if (iconText === 'refresh' || iconText === 'replay' || iconText === 'autorenew' || iconText === 'restart_alt') {
      const btn = icon.closest('button, [role="button"]');
      if (btn && btn.offsetParent !== null) {
        const nearFailed = btn.closest('[class*="fail"], [class*="error"]') ||
          Array.from(document.querySelectorAll('div, span')).some(el => {
            const t = (el.textContent || '').trim().toLowerCase();
            if (!t.includes('failed')) return false;
            const elRect = el.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            return Math.abs(elRect.top - btnRect.top) < 150;
          });
        if (nearFailed) {
          console.log('[Flow] Found retry button by icon near failed card:', iconText);
          await simulateRealClick(btn);
          return true;
        }
      }
    }
  }

  // Method 3: หา clickable element ใน card ที่มี "Failed" text
  const failedElements = document.querySelectorAll('div, span');
  for (const el of failedElements) {
    const text = (el.textContent || '').trim();
    if (text.length < 4 || text.length > 30 || !text.toLowerCase().includes('failed')) continue;
    if (el.offsetParent === null) continue;
    const card = el.closest('[class*="card"], [class*="grid"], [class*="item"]') || el.parentElement?.parentElement;
    if (card) {
      const retryBtn = card.querySelector('button, [role="button"]');
      if (retryBtn && retryBtn.offsetParent !== null) {
        console.log('[Flow] Found button inside failed card');
        await simulateRealClick(retryBtn);
        return true;
      }
    }
  }

  console.log('[Flow] No retry button found on failed cards');
  return false;
}

// ★★★ PD-INSPIRED: hideOverlayForClick / showOverlayAfterClick ★★★
// ซ่อน extension overlay ก่อนคลิก element ป้องกัน overlay บังปุ่ม
function hideOverlayForClick() {
  const overlays = document.querySelectorAll('.tap-notification, .tap-panel, [class*="tap-"], [id*="tiktok-auto"]');
  const hidden = [];
  for (const el of overlays) {
    if (el.offsetParent !== null && el.style.display !== 'none') {
      el.dataset._prevDisplay = el.style.display || '';
      el.dataset._prevVisibility = el.style.visibility || '';
      el.dataset._prevPointerEvents = el.style.pointerEvents || '';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      hidden.push(el);
    }
  }
  return hidden;
}

function showOverlayAfterClick(hidden) {
  for (const el of hidden) {
    el.style.visibility = el.dataset._prevVisibility || '';
    el.style.pointerEvents = el.dataset._prevPointerEvents || '';
    delete el.dataset._prevDisplay;
    delete el.dataset._prevVisibility;
    delete el.dataset._prevPointerEvents;
  }
}

// Wrapper: คลิกโดยซ่อน overlay ก่อน (เหมือน PD's clickWithOverlay)
async function clickWithOverlay(element) {
  const hidden = hideOverlayForClick();
  try {
    await simulateRealClick(element);
  } finally {
    await new Promise(r => setTimeout(r, 100));
    showOverlayAfterClick(hidden);
  }
}

// ★★★ PD-INSPIRED: deleteFailedClipInScenebuilder ★★★
// ลบ clip ที่ failed ใน Scene Builder ก่อน retry เพื่อ cleanup
async function deleteFailedClipInScenebuilder() {
  console.log('[Flow] Looking for failed clips in Scene Builder to delete...');
  let deletedCount = 0;

  const clips = document.querySelectorAll('[class*="clip"], [class*="scene-item"], [class*="timeline"] [role="button"]');
  for (const clip of clips) {
    if (clip.offsetParent === null) continue;
    const text = (clip.textContent || '').toLowerCase();
    if (!text.includes('failed') && !text.includes('error')) continue;

    // Right-click or find delete button
    const deleteBtn = clip.querySelector('button[aria-label*="delete" i], button[aria-label*="remove" i]');
    if (deleteBtn) {
      await simulateRealClick(deleteBtn);
      deletedCount++;
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }

    // Try context menu
    const rect = clip.getBoundingClientRect();
    clip.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    }));
    await new Promise(r => setTimeout(r, 500));

    const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"]');
    for (const item of menuItems) {
      const itemText = (item.textContent || '').toLowerCase();
      if (itemText.includes('delete') || itemText.includes('remove') || itemText.includes('ลบ')) {
        await simulateRealClick(item);
        deletedCount++;
        await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }
  }

  console.log(`[Flow] Deleted ${deletedCount} failed clips`);
  return deletedCount;
}

// ★★★ PD-INSPIRED: readFlowInternalState — อ่าน Flow internal state ★★★
// ส่ง message ไป MAIN world เพื่ออ่าน clip count / failed count จาก Flow's React state
async function readFlowInternalState() {
  try {
    const result = await chrome.runtime.sendMessage({ type: 'READ_FLOW_STATE' });
    if (result?.success) {
      return {
        clipCount: result.clipCount || 0,
        failedCount: result.failedCount || 0,
        generatingCount: result.generatingCount || 0,
        hasData: true
      };
    }
  } catch (e) {
    // MAIN world script not available — fallback to DOM
  }
  return { clipCount: 0, failedCount: 0, generatingCount: 0, hasData: false };
}

// ★ Smart Screen Check: เช็คว่ามีรูป/วิดีโอ ใหม่ ปรากฏใน result card หรือยัง ★
// ใช้กับ image wait loop เพื่อ detect ว่า generate เสร็จแล้ว โดยไม่ต้องรอ timeout
// initialSrcs = Set ของ src ที่มีอยู่ก่อน generate (snapshot ก่อนกด Generate)
// mode = 'image' | 'video'
// return { completed: true, newCount: N, details: '...' } หรือ { completed: false }
function isGenerationCompleted(initialSrcs, mode = 'image') {
  if (mode === 'image') {
    // เช็คว่ามีรูปใหม่ที่ visible + ขนาดใหญ่พอ (ไม่ใช่ icon/thumbnail)
    const allImages = document.querySelectorAll('img');
    let newImages = 0;
    for (const img of allImages) {
      if (!img.offsetParent) continue; // ซ่อนอยู่
      const rect = img.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80) continue; // เล็กเกินไป (icon)
      const src = img.src || '';
      if (!src || src.startsWith('data:image/svg')) continue; // SVG icon
      if (initialSrcs && initialSrcs.has(src)) continue; // รูปเก่า
      newImages++;
    }
    if (newImages > 0) {
      console.log(`[TikTok Auto] isGenerationCompleted(image): Found ${newImages} new images!`);
      return { completed: true, newCount: newImages, details: `${newImages} new images detected` };
    }
  } else if (mode === 'video') {
    // เช็คว่ามี video element ใหม่ที่มี src (blob: หรือ http)
    const allVideos = document.querySelectorAll('video');
    let newVideos = 0;
    for (const video of allVideos) {
      const src = video.src || video.currentSrc || '';
      if (!src || src.includes('gstatic.com')) continue;
      if (initialSrcs && initialSrcs.has(src)) continue; // video เก่า
      // เช็ค duration ถ้ามี
      if (video.duration && video.duration > 1) {
        newVideos++;
      } else if (src.startsWith('blob:') || src.startsWith('http')) {
        newVideos++; // blob/http = video จริง
      }
    }
    if (newVideos > 0) {
      console.log(`[TikTok Auto] isGenerationCompleted(video): Found ${newVideos} new videos!`);
      return { completed: true, newCount: newVideos, details: `${newVideos} new videos detected` };
    }
    
    // Fallback: เช็ค Download button ที่เพิ่งปรากฏ (บาง video ไม่มี <video> element แต่มีปุ่ม Download)
    const downloadBtns = document.querySelectorAll('button, [role="button"]');
    for (const btn of downloadBtns) {
      const icons = btn.querySelectorAll('i.google-symbols, i.material-icons, i[class*="icon"]');
      for (const icon of icons) {
        if (icon.textContent?.trim() === 'download' && btn.offsetParent !== null) {
          // มีปุ่ม Download visible = video น่าจะเสร็จแล้ว
          if (!initialSrcs || !initialSrcs.has('__download_btn_exists__')) {
            console.log('[TikTok Auto] isGenerationCompleted(video): Download button appeared!');
            return { completed: true, newCount: 1, details: 'Download button appeared' };
          }
        }
      }
    }
  }
  return { completed: false };
}

// ★ Helper: Snapshot รูป/วิดีโอปัจจุบัน ก่อน generate — เพื่อเปรียบเทียบทีหลัง ★
function snapshotCurrentMedia(mode = 'image') {
  const srcs = new Set();
  if (mode === 'image') {
    document.querySelectorAll('img').forEach(img => {
      if (img.src && img.offsetParent) srcs.add(img.src);
    });
  } else {
    document.querySelectorAll('video').forEach(v => {
      if (v.src) srcs.add(v.src);
      if (v.currentSrc) srcs.add(v.currentSrc);
    });
    // จำว่ามี Download button อยู่แล้วหรือไม่
    const downloadBtns = document.querySelectorAll('button i.google-symbols, button i.material-icons');
    for (const icon of downloadBtns) {
      if (icon.textContent?.trim() === 'download' && icon.closest('button')?.offsetParent) {
        srcs.add('__download_btn_exists__');
      }
    }
  }
  return srcs;
}

// ★ Retry wrapper: ลอง step สูงสุด maxRetries รอบ + delay ระหว่าง retry ★
// stepFn ควร return true ถ้าสำเร็จ, false/undefined ถ้าล้มเหลว, หรือ throw error
// ★ v3.04 ORIGINAL retryStep ★
async function retryStep(stepFn, stepName, maxRetries = 4, delayMs = 5000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (await isFlowStopped()) return false;
    if (isPageCrashed()) {
      console.log(`[TikTok Auto] [Retry] ${stepName} — Page CRASHED! Notifying sidepanel...`);
      showNotification('❌ Google Labs ล่ม!');
      await notifyFlowFailed(`Page crashed before ${stepName}`);
      return false;
    }
    try {
      console.log(`[TikTok Auto] [Retry] ${stepName} — attempt ${attempt}/${maxRetries}`);
      if (attempt > 0) {
        showNotification(`🔄 ${stepName} — retry ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      const result = await stepFn();
      if (result === false) {
        console.log(`[TikTok Auto] [Retry] ${stepName} returned false — attempt ${attempt}/${maxRetries}`);
        if (attempt === maxRetries) {
          console.log(`[TikTok Auto] [Retry] ${stepName} FAILED after ${maxRetries} attempts — notifying sidepanel`);
          showNotification(`❌ ${stepName} ล้มเหลว ${maxRetries} รอบ — แจ้ง sidepanel`);
          await notifyFlowFailed(`${stepName} failed after ${maxRetries} retries`);
          return false;
        }
        continue;
      }
      console.log(`[TikTok Auto] [Retry] ${stepName} completed OK (attempt ${attempt})`);
      return true;
    } catch (error) {
      console.error(`[TikTok Auto] [Retry] ${stepName} ERROR (attempt ${attempt}/${maxRetries}):`, error.message);
      if (attempt === maxRetries) {
        console.log(`[TikTok Auto] [Retry] ${stepName} FAILED after ${maxRetries} attempts — notifying sidepanel`);
        showNotification(`❌ ${stepName} ล้มเหลว ${maxRetries} รอบ — แจ้ง sidepanel`);
        await notifyFlowFailed(`${stepName} error: ${error.message}`);
        return false;
      }
    }
  }
  return false;
}

// ★ Helper: แจ้ง sidepanel ว่า flow ล้มเหลว (ทั้ง message + storage fallback) ★
// ★ PD-INSPIRED: เก็บ lastFailedStep เพื่อ resume from step N ★
async function notifyFlowFailed(errorMsg, explicitStep = 0) {
  // ★ Parse step number จาก error message เพื่อ resume, หรือใช้ค่าที่ส่งเข้ามาตรง ★
  const stepMatch = errorMsg.match(/step\s*(\d+)/i);
  const failedStep = explicitStep || (stepMatch ? parseInt(stepMatch[1]) : 0);

  // Storage fallback (sidepanel มี listener สำหรับ flow_error อยู่แล้ว)
  try {
    await chrome.storage.local.set({ 
      flowStatus: 'flow_error', 
      flowMessage: errorMsg,
      lastFailedStep: failedStep,
      lastFailedTime: Date.now()
    });
  } catch (e) {}
  
  // Runtime message (direct)
  try {
    await chrome.runtime.sendMessage({
      source: 'google-flow',
      type: 'STEP_FAILED',
      data: { message: errorMsg, error: errorMsg, failedStep: failedStep }
    });
  } catch (e) {}
}

// ★★★ PD-INSPIRED: resumeAutoPostFromStep — resume pipeline from specific step ★★★
// เหมือน PD's retryExtendFromStep4 / continueFromStep8Export
async function resumeAutoPostFromStep(stepNumber) {
  console.log(`[Flow] Resuming Auto Post from step ${stepNumber}...`);
  showNotification(`🔄 Resume จาก Step ${stepNumber}...`);

  if (stepNumber >= 13 && stepNumber <= 15) {
    // Resume from video extend (Steps 13-15)
    console.log('[Flow] Resuming from video extend pipeline (Step 13+)');
    
    // Step 13: Scene Builder Extend (new flow)
    if (stepNumber <= 13) {
      await extendViaSceneBuilder();
      return true;
    }
    
    // Step 14: Paste video prompt 16s
    if (stepNumber <= 14) {
      const step14Ok = await retryStep(() => pasteVideoPrompt16ToSlate(), 'Resume Step 14: Paste Video Prompt 16s');
      if (!step14Ok) return false;
    }
    
    // Step 15: Click generate for 16s
    if (stepNumber <= 15) {
      const step15Ok = await retryStep(() => clickGenerateForVideo16New(), 'Resume Step 15: Click Generate 16s');
      if (!step15Ok) return false;
    }
    
    return true;
  }

  if (stepNumber >= 8 && stepNumber <= 12) {
    // Resume from image-to-video pipeline (Steps 8-12)
    console.log('[Flow] Resuming from video creation pipeline (Step 8+)');
    
    if (stepNumber <= 8) {
      const step8Ok = await retryStep(() => hoverGeneratedImageAndAddToPrompt(), 'Resume Step 8: Hover Image + Add to Prompt');
      if (!step8Ok) return false;
    }
    
    if (stepNumber <= 9) {
      const step9Ok = await retryStep(() => pasteVideoPrompt8ToSlate(), 'Resume Step 9: Paste Video Prompt 8s');
      if (!step9Ok) return false;
    }
    
    if (stepNumber <= 10) {
      const step10Ok = await retryStep(() => selectVideoAndFrames(), 'Resume Step 10: Select Video + Frames');
      if (!step10Ok) return false;
    }
    
    return true;
  }

  console.log(`[Flow] Step ${stepNumber} does not support resume — need full restart`);
  return false;
}


// Toggle Zoom function - controlled from Extension sidepanel
function setZoom(zoomLevel) {
  if (zoomLevel === 33) {
    // Zoom out to 33%
    document.body.style.zoom = '33%';
    isZoomedOut = true;
    console.log('[TikTok Auto] Zoom: 33%');
    showNotification('🔍 Zoom: 33%');
  } else {
    // Reset zoom to 100%
    document.body.style.zoom = '100%';
    document.body.style.transform = '';
    document.body.style.transformOrigin = '';
    isZoomedOut = false;
    console.log('[TikTok Auto] Zoom: 100%');
    showNotification('🔍 Zoom: 100%');
  }
}

// Initialize when page is ready
async function init() {
  console.log('[TikTok Auto] Initializing Google Flow automation...');

  // Wait for page to fully load
  await waitForPageReady();
  
  // ★ Detect Google Labs crash → auto reload (สูงสุด 3 รอบ) ★
  if (isPageCrashed()) {
    // อ่าน retry count จาก URL hash เพื่อป้องกัน reload วนลูป
    const urlHash = window.location.hash || '';
    const retryMatch = urlHash.match(/#crash_retry=(\d+)/);
    const crashRetryCount = retryMatch ? parseInt(retryMatch[1]) : 0;
    
    if (crashRetryCount < 3) {
      const nextRetry = crashRetryCount + 1;
      console.log(`[TikTok Auto] ⚠️ Google Labs CRASHED! Auto-reload attempt ${nextRetry}/3...`);
      showNotification(`❌ Google Labs ล่ม — reload ครั้งที่ ${nextRetry}/3...`);
      await new Promise(resolve => setTimeout(resolve, 3000 + (crashRetryCount * 2000))); // รอนานขึ้นทุกรอบ
      window.location.href = `https://labs.google/fx/tools/flow#crash_retry=${nextRetry}`;
      return;
    } else {
      console.log('[TikTok Auto] ⚠️ Google Labs CRASHED 3 times! Giving up — notifying sidepanel...');
      showNotification('❌ Google Labs ล่มซ้ำ 3 รอบ — ข้ามรายการนี้');
      await notifyFlowFailed('Google Labs crashed 3 times — giving up');
      return;
    }
  }
  
  // ★ Clear crash retry hash ถ้า page โหลดสำเร็จ ★
  if (window.location.hash.includes('crash_retry')) {
    console.log('[TikTok Auto] Page recovered from crash! Clearing retry hash.');
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  // ★ FIX: Register message listener เสมอ ก่อน flow checks ★
  // ★ ป้องกัน page reload ระหว่าง Storymode → listener หาย → sidepanel ส่ง message ไม่ได้ ★
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle Zoom command from Extension
    if (message.type === 'SET_ZOOM') {
      const zoomLevel = message.zoomLevel;
      console.log('[TikTok Auto] Received zoom command:', zoomLevel);
      setZoom(zoomLevel);
      sendResponse({ success: true, zoomLevel: zoomLevel });
      return true;
    }

    if (message.type === 'FLOW_DATA') {
      // Always update with new data - reset stop flag
      flowStopped = false;
      currentFlowData = message.data;
      console.log('[TikTok Auto] Received NEW flow data:', currentFlowData);

      // Update storage with new data - ★ รวม flowType: 'autopost' ด้วย ★
      chrome.storage.local.set({
        currentFlowData: currentFlowData,
        flowStatus: 'waiting_for_flow',
        flowType: 'autopost'
      });

      showNotification(`📦 [Auto Post] สินค้าใหม่: ${currentFlowData.productName}`);

      // Remove old panel if exists
      const existingPanel = document.getElementById('tiktok-auto-panel');
      if (existingPanel) {
        existingPanel.remove();
      }

      // ★ v3.04 logic: เรียก clickNewProjectButton() ตรงๆ ★
      clickNewProjectButton();

      sendResponse({ success: true });
    }
    
    // ★ Auto Run Storyboard: สร้างฉากแรก ★
    else if (message.action === 'createFirstScene') {
      console.log('[TikTok Auto] createFirstScene:', message.sceneNumber, message.prompt);
      handleCreateFirstScene(message.prompt, message.sceneNumber);
      sendResponse({ success: true });
    }
    
    // ★ Auto Run Storyboard: ต่อฉาก (Extend) ★
    else if (message.action === 'extendScene') {
      console.log('[TikTok Auto] extendScene:', message.sceneNumber, message.prompt);
      handleExtendScene(message.prompt, message.sceneNumber);
      sendResponse({ success: true });
    }
    
    // ★ Storymode: รันฉากเดียว (จากปุ่ม Auto ในตาราง) ★
    else if (message.action === 'startSingleScene') {
      console.log('[TikTok Auto] startSingleScene:', message.type, message.sceneNumber, message.prompt?.substring(0, 50));
      handleSingleSceneAuto(message.prompt, message.type, message.sceneNumber);
      sendResponse({ success: true });
    }
    
    // ★ Ping: ตรวจสอบว่า content script พร้อมทำงาน ★
    else if (message.action === 'ping') {
      sendResponse({ success: true, ready: true });
      return true;
    }
    
    // ★ PD-INSPIRED: Resume from step N ★
    else if (message.action === 'resumeFromStep') {
      console.log('[TikTok Auto] Resume from step:', message.stepNumber);
      flowStopped = false;
      resumeAutoPostFromStep(message.stepNumber);
      sendResponse({ success: true });
    }

    // ★ Reset Pipeline Lock ★
    else if (message.action === 'resetPipelineLock') {
      console.log('[TikTok Auto] Resetting pipeline lock');
      window._pipelineRunning = false;
      sendResponse({ success: true });
      return true;
    }
    
    // ★ Pipeline: สร้าง Image สำหรับฉาก ★
    else if (message.action === 'createSceneImage') {
      console.log('[TikTok Auto] createSceneImage:', message.sceneNumber, 'isRetry:', !!message.isRetry, message.imagePrompt?.substring(0, 50));
      console.log('[TikTok Auto] Has productImage:', !!message.productImage, 'Has characterImage:', !!message.characterImage);
      handleCreateSceneImage(message.imagePrompt, message.sceneNumber, message.isFirstScene, message.productImage, message.characterImage, message.isRetry);
      sendResponse({ success: true });
    }
    
    // ★ Pipeline: สร้าง Video สำหรับฉาก ★
    else if (message.action === 'createSceneVideo') {
      console.log('[TikTok Auto] createSceneVideo:', message.sceneNumber, 'isRetry:', !!message.isRetry, message.videoPrompt?.substring(0, 50));
      if (window._pipelineRunning) {
        console.log('[TikTok Auto] ⚠️ Pipeline already running — REJECTING duplicate createSceneVideo');
        sendResponse({ success: false, reason: 'pipeline_busy' });
      } else {
        window._pipelineRunning = true;
        handleCreateSceneVideoFull(message.videoPrompt, message.sceneNumber, message.isRetry);
        sendResponse({ success: true });
      }
    }
    
    // ★ Pipeline: เปิด SceneBuilder และ Download ★
    else if (message.action === 'openSceneBuilderAndDownload') {
      console.log('[TikTok Auto] openSceneBuilderAndDownload');
      pipeline_openSceneBuilderAndDownload();
      sendResponse({ success: true });
    }
    
    return true;
  });

  // Check for pending flow data
  const result = await chrome.storage.local.get(['currentFlowData', 'flowStatus', 'autoRunSceneStatus', 'flowType']);
  
  console.log('[TikTok Auto] Init check - flowStatus:', result.flowStatus, 'flowType:', result.flowType, 'hasData:', !!result.currentFlowData);

  // ★ ถ้ากำลังรัน Storymode/Pipeline อยู่ → ไม่ต้องเริ่ม Auto Post ★
  // ต้องเช็คทั้ง: 1) autoRunSceneStatus ยังไม่เสร็จ 2) flowType เป็น storymode/pipeline 3) _storymodeRunning flag
  const isStorymodeActive = (
    result.autoRunSceneStatus && 
    result.autoRunSceneStatus.completed === false && 
    (result.flowType === 'storymode' || result.flowType === 'pipeline' || _storymodeRunning)
  );
  
  if (isStorymodeActive) {
    console.log('[TikTok Auto] Storymode page reloaded — listener registered, notifying sidepanel...');
    // ★ Fix B: แจ้ง sidepanel ทันทีว่า content script reload → ให้ retry ได้เร็ว ★
    await chrome.storage.local.set({ 
      flowStatus: 'flow_error', 
      flowMessage: 'content_script_reloaded — page reload ระหว่าง Storymode' 
    });
    return;
  }
  
  // ★ ถ้า flowType เป็น autopost แต่ autoRunSceneStatus ค้างอยู่ → clear มันทิ้ง ★
  if (result.flowType === 'autopost' && result.autoRunSceneStatus && result.autoRunSceneStatus.completed === false) {
    console.log('[TikTok Auto] Clearing stale autoRunSceneStatus for Auto Post');
    await chrome.storage.local.set({ autoRunSceneStatus: null });
  }

  // ★ Auto Post Flow — เฉพาะเมื่อ flowType === 'autopost' และ flowStatus === 'waiting_for_flow' ★
  if (result.currentFlowData && result.flowStatus === 'waiting_for_flow' && result.flowType === 'autopost') {
    if (!startSystem('autopost')) {
      console.log('[TikTok Auto] Cannot start Auto Post - another system is running');
      return;
    }
    
    currentFlowData = result.currentFlowData;
    console.log('[TikTok Auto] Found pending AUTO POST flow data:', currentFlowData);
    showNotification(`📦 [Auto Post] พร้อมสร้าง ${currentFlowData.mode === 'image' ? 'รูปภาพ' : 'วิดีโอ'} สำหรับ: ${currentFlowData.productName}`);

    // ★ v3.04 logic: retryStep → clickNewProjectButton() ★
    await retryStep(() => clickNewProjectButton(), AUTOPOST_STEPS.step1_NewProject);
  }

  // ★ Auto V2 Flow — flowType === 'autov2' ★
  if (result.currentFlowData && result.flowStatus === 'waiting_for_flow' && result.flowType === 'autov2') {
    if (!startSystem('autov2')) {
      console.log('[TikTok Auto] Cannot start Auto V2 - another system is running');
      return;
    }
    
    currentFlowData = result.currentFlowData;
    console.log('[TikTok Auto] Found pending AUTO V2 flow data:', currentFlowData);
    showNotification(`🎬 [Auto V2] เริ่ม: ${currentFlowData.productName}`);

    await retryStep(() => clickNewProjectButton(), 'V2 Step: Click New Project');
  }

  // === Resume 16 วิ flow: ถ้ากำลัง extend อยู่ (extending_16s) หรือ video 8s saved + clipDuration=16 ===
  // ★ PD-INSPIRED: ใช้ sessionStorage sub-step เพื่อ resume จากจุดที่ค้างไว้ได้แม่นยำ ★
  const isExtending = result.currentFlowData && result.flowStatus === 'extending_16s' && result.currentFlowData.clipDuration === 16;
  const needsExtend = result.currentFlowData && result.flowStatus === 'video_saved_8s' && result.currentFlowData.clipDuration === 16;
  
  if (isExtending || needsExtend) {
    currentFlowData = result.currentFlowData;
    const reason = isExtending ? 'extending_16s (resume)' : 'video_saved_8s → extend';
    
    // ★ PD-INSPIRED: Read session sub-step for smarter resume ★
    let extendSubStep = 'unknown';
    try { extendSubStep = sessionStorage.getItem('extendSubStep') || 'unknown'; } catch (e) {}
    
    // ★ Track reload count to prevent infinite loops ★
    let reloadCount = 0;
    try { reloadCount = parseInt(sessionStorage.getItem('extendRetryCount') || '0'); } catch (e) {}
    if (reloadCount >= 3) {
      console.log('[TikTok Auto] Resume: Too many extend reloads (' + reloadCount + ') — giving up');
      try { sessionStorage.removeItem('extendSubStep'); sessionStorage.removeItem('extendRetryCount'); } catch (e) {}
      await notifyFlowFailed('Extend failed: too many page reloads', 13);
      return;
    }
    try { sessionStorage.setItem('extendRetryCount', String(reloadCount + 1)); } catch (e) {}
    
    console.log(`[TikTok Auto] Resuming 16s flow: ${reason}, subStep: ${extendSubStep}, reloadCount: ${reloadCount}`);
    await chrome.storage.local.set({ flowStatus: 'extending_16s' });

    // ★ PD-INSPIRED: Resume from the exact sub-step ★
    if (extendSubStep.startsWith('sb_clip') || extendSubStep === 'sb_scenebuilder') {
      // อยู่ใน 2-Clip Scene Builder Pipeline → restart pipeline (safe)
      console.log('[TikTok Auto] Resume: Was in 2-Clip SB pipeline (' + extendSubStep + ') — restarting');
      showNotification('🔄 Resume 2-Clip Scene Builder...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await extendViaSceneBuilder();
    } else if (extendSubStep === 'step16_waiting') {
      console.log('[TikTok Auto] Resume: Was waiting for 16s video — resuming Step 16 directly');
      showNotification('🔄 Resume Step 16: รอ Video 16 วิ ต่อ...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await waitForVideo16sAndSave();
    } else if (extendSubStep === 'step15_generating') {
      console.log('[TikTok Auto] Resume: Generate was already clicked — resuming Step 16');
      showNotification('🔄 Resume Step 15→16: รอ Video Generate...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await waitForVideo16sAndSave();
    } else if (needsExtend && extendSubStep === 'unknown') {
      console.log('[TikTok Auto] Resume: Needs extend from scratch — starting Scene Builder');
      showNotification('🔄 Resume จาก Scene Builder Extend...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await extendViaSceneBuilder();
    } else {
      // Default: resume from Step 14 (paste) — ปลอดภัยที่สุด
      console.log('[TikTok Auto] Resume: Default — resuming from Step 14 (paste prompt)');
      showNotification('🔄 กลับมาทำ 16 วิ ต่อ — Step 14: วาง Prompt...');

      let slateFound = false;
      for (let w = 0; w < 20; w++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (document.querySelector('[data-slate-editor="true"]') || document.querySelector('[data-slate-placeholder]')) {
          slateFound = true;
          console.log(`[TikTok Auto] Resume: Slate editor found after ${w + 1}s`);
          break;
        }
      }
      if (!slateFound) {
        console.log('[TikTok Auto] Resume: Slate editor not found after 20s — trying anyway');
      }

      await retryStep(() => pasteVideoPrompt16ToSlate(), AUTOPOST_STEPS.step14_PasteExtend);
    }
  }
}

// Wait for page to be fully ready
async function waitForPageReady() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 20;

    const checkReady = () => {
      attempts++;
      // Check if main content is loaded
      const hasContent = document.body && document.body.innerHTML.length > 1000;

      if (hasContent || attempts >= maxAttempts) {
        resolve();
      } else {
        setTimeout(checkReady, 500);
      }
    };

    checkReady();
  });
}

// Close welcome popup if exists (e.g., "Meet the new Flow", "Nano Banana Pro")
async function closeWelcomePopup() {
  console.log('[TikTok Auto] Checking for welcome popup...');

  // Find close button (X) in popup/modal
  let closeButton = null;

  // Method 0: Press Escape key to close any modal
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  await new Promise(resolve => setTimeout(resolve, 300));

  // Method 1: Find by aria-label close
  closeButton = document.querySelector('button[aria-label="Close"], button[aria-label="close"], [aria-label="Close"], [aria-label="close"]');

  // Method 2: Find X icon button or close_small icon
  if (!closeButton) {
    const allButtons = document.querySelectorAll('button, [role="button"]');
    for (const btn of allButtons) {
      const text = btn.textContent?.trim() || '';
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      // Look for X or close icon
      if (text === '×' || text === 'X' || text === 'x' || text === 'close' || text === 'close_small' ||
        ariaLabel.includes('close') || ariaLabel.includes('dismiss') || ariaLabel.includes('ปิด')) {
        closeButton = btn;
        break;
      }
    }
  }

  // Method 3: Find by icon class (material icons, google symbols) - including close_small
  if (!closeButton) {
    const closeIcons = document.querySelectorAll('i.google-symbols, i.material-icons, svg');
    for (const icon of closeIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'close' || text === 'cancel' || text === 'clear' || text === 'close_small') {
        closeButton = icon.closest('button') || icon.parentElement;
        if (closeButton) break;
      }
    }
  }

  // Method 4: Find dialog close button by looking for X in dialog/modal
  if (!closeButton) {
    const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"], [class*="modal"], [class*="dialog"], [class*="popup"]');
    for (const dialog of dialogs) {
      const closeBtn = dialog.querySelector('button[aria-label*="close"], button[aria-label*="Close"], svg[data-testid="CloseIcon"]');
      if (closeBtn) {
        closeButton = closeBtn;
        break;
      }
      // Also look for X button in header
      const headerClose = dialog.querySelector('button:first-child, [class*="close"]');
      if (headerClose && headerClose.textContent?.trim().length <= 2) {
        closeButton = headerClose;
        break;
      }
    }
  }

  // Method 5: Find by clicking outside modal (backdrop)
  if (!closeButton) {
    const backdrop = document.querySelector('[data-state="open"] + [data-radix-portal], .modal-backdrop, [class*="backdrop"], [class*="overlay"]');
    if (backdrop) {
      console.log('[TikTok Auto] Found backdrop, clicking to close...');
      backdrop.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (closeButton) {
    console.log('[TikTok Auto] Found close button, clicking...', closeButton);
    showNotification('🖱️ ปิด popup...');
    await simulateRealClick(closeButton);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('[TikTok Auto] Popup closed');
  } else {
    console.log('[TikTok Auto] No welcome popup found');
  }
}

// Close any visible popup/dialog more aggressively
async function closeAnyVisiblePopup() {
  console.log('[TikTok Auto] Trying to close any visible popup...');
  
  // Method 1: Find any visible dialog/modal and click X button inside
  const possiblePopups = document.querySelectorAll('[role="dialog"], [role="alertdialog"], [class*="modal"], [class*="dialog"], [class*="popup"], [class*="Dialog"], [class*="Modal"]');
  
  for (const popup of possiblePopups) {
    if (popup.offsetParent === null) continue; // Skip hidden popups
    
    console.log('[TikTok Auto] Found visible popup:', popup);
    
    // Look for close button (X) in the popup
    const closeSelectors = [
      'button[aria-label*="close"]',
      'button[aria-label*="Close"]',
      '[class*="close"]',
      '[class*="Close"]',
      'svg[data-testid="CloseIcon"]',
      'button:has(svg)',
    ];
    
    for (const sel of closeSelectors) {
      try {
        const closeBtn = popup.querySelector(sel);
        if (closeBtn && closeBtn.offsetParent !== null) {
          console.log('[TikTok Auto] Found close button in popup:', closeBtn);
          await simulateRealClick(closeBtn);
          await new Promise(resolve => setTimeout(resolve, 500));
          return true;
        }
      } catch (e) {}
    }
    
    // Try clicking the first button that looks like X (small text content)
    const allBtns = popup.querySelectorAll('button');
    for (const btn of allBtns) {
      const text = btn.textContent?.trim() || '';
      if (text.length <= 2 || text === '×' || text === 'X' || text === 'x') {
        console.log('[TikTok Auto] Found X button:', btn);
        await simulateRealClick(btn);
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      }
    }
  }
  
  // Method 2: Press Escape key multiple times
  for (let i = 0; i < 3; i++) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Method 3: Click outside any modal (on backdrop)
  const backdrops = document.querySelectorAll('[class*="backdrop"], [class*="Backdrop"], [class*="overlay"], [class*="Overlay"]');
  for (const backdrop of backdrops) {
    if (backdrop.offsetParent !== null) {
      console.log('[TikTok Auto] Clicking backdrop to close popup');
      backdrop.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
  }
  
  return false;
}

// ★ v3.04 ORIGINAL LOGIC — clickNewProjectButton ★
async function clickNewProjectButton() {
  console.log('[TikTok Auto] Looking for New Project button...');

  await new Promise(resolve => setTimeout(resolve, 2000));
  await closeWelcomePopup();
  await closeAnyVisiblePopup();

  const selectors = [
    'button:has-text("New project")',
    'button:has-text("New Project")',
    '[role="button"]:has-text("New project")',
    'button[aria-label*="New"]',
    'button[aria-label*="new"]',
    'button[aria-label*="project"]',
    '.mdc-button',
    '.mat-button',
    'button.new-project',
    '[data-testid*="new"]',
    '[data-testid*="project"]'
  ];

  let button = null;

  // Method 1: Find by text content
  const allButtons = document.querySelectorAll('button, [role="button"], .clickable, [tabindex="0"]');
  for (const btn of allButtons) {
    const text = btn.textContent?.toLowerCase() || '';
    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
    if (text.includes('new project') || (text.includes('new') && text.includes('project')) ||
      text.includes('โปรเจกต์ใหม่') || text.includes('สร้างโปรเจกต์') ||
      ariaLabel.includes('new project') || ariaLabel.includes('new') || ariaLabel.includes('โปรเจกต์ใหม่')) {
      button = btn;
      console.log('[TikTok Auto] Found button by text:', btn);
      break;
    }
  }

  // Method 2: Find by selectors
  if (!button) {
    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el && el.offsetParent !== null) {
          button = el;
          console.log('[TikTok Auto] Found button by selector:', selector);
          break;
        }
      } catch (e) { /* invalid selector */ }
    }
  }

  // Method 3: Find by + New pattern
  if (!button) {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const text = el.textContent?.trim() || '';
      if ((text.includes('+') && text.toLowerCase().includes('new')) ||
        text === 'New project' || text === '+ New project' ||
        text === 'โปรเจกต์ใหม่' || text === '+ โปรเจกต์ใหม่') {
        if (el.onclick || el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' ||
          el.style.cursor === 'pointer' || window.getComputedStyle(el).cursor === 'pointer') {
          button = el;
          console.log('[TikTok Auto] Found button by + New pattern:', el);
          break;
        }
      }
    }
  }

  if (button) {
    console.log('[TikTok Auto] Clicking New Project button...');
    showNotification('🖱️ กำลังกด New Project...');

    // ★ PD-INSPIRED: ซ่อน overlay ก่อนคลิก ป้องกัน overlay บังปุ่ม ★
    const hiddenOverlays = hideOverlayForClick();

    // ★ FIX: ชดเชย CSS zoom เพื่อให้ Debugger click ตรงจุด ★
    const cssZoom = parseFloat(document.body.style.zoom) || 1;
    const zoomFactor = cssZoom > 1 ? cssZoom / 100 : (cssZoom > 0 ? cssZoom : 1); // "33%" → 0.33, "0.33" → 0.33
    const rect = button.getBoundingClientRect();
    const rawCenterX = rect.left + rect.width / 2;
    const rawCenterY = rect.top + rect.height / 2;
    const centerX = Math.round(rawCenterX / zoomFactor);
    const centerY = Math.round(rawCenterY / zoomFactor);
    console.log(`[TikTok Auto] Button coords: raw=(${Math.round(rawCenterX)},${Math.round(rawCenterY)}) zoom=${zoomFactor} adjusted=(${centerX},${centerY})`);

    let clickSuccess = false;

    // ★ วิธี 1: React Props onClick (ไม่ต้องพึ่ง coordinates เลย) ★
    const reactKeys = Object.keys(button);
    for (const key of reactKeys) {
      if (key.startsWith('__reactProps') || key.startsWith('__reactFiber')) {
        const props = button[key];
        if (props && typeof props.onClick === 'function') {
          console.log('[TikTok Auto] Method 1: React onClick found!');
          props.onClick({ type: 'click', target: button, currentTarget: button, preventDefault() {}, stopPropagation() {} });
          clickSuccess = true;
          break;
        }
      }
    }
    if (!clickSuccess) {
      const overlay = button.querySelector('[data-type="button-overlay"]');
      if (overlay) {
        const ovKeys = Object.keys(overlay);
        for (const key of ovKeys) {
          if (key.startsWith('__reactProps')) {
            const props = overlay[key];
            if (props && typeof props.onClick === 'function') {
              console.log('[TikTok Auto] Method 1b: React onClick on overlay!');
              props.onClick({ type: 'click', target: overlay, currentTarget: overlay, preventDefault() {}, stopPropagation() {} });
              clickSuccess = true;
              break;
            }
          }
        }
      }
    }

    // ★ วิธี 2: DEBUGGER_CLICK_SELECTOR (หาพิกัดใน debugger context — ไม่มี zoom shift) ★
    if (!clickSuccess) {
      try {
        const selectorJs = `(() => {
          const btns = document.querySelectorAll('button');
          for (const b of btns) {
            if (b.textContent?.includes('New project') || b.textContent?.includes('New Project')) {
              const r = b.getBoundingClientRect();
              if (r.width > 10 && r.height > 10) {
                const z = parseFloat(document.body.style.zoom) || 1;
                const zf = z > 1 ? z / 100 : (z > 0 ? z : 1);
                return { x: Math.round((r.left + r.width / 2) / zf), y: Math.round((r.top + r.height / 2) / zf) };
              }
            }
          }
          return null;
        })()`;
        const dbgSelResult = await chrome.runtime.sendMessage({
          type: 'DEBUGGER_CLICK_SELECTOR', jsExpression: selectorJs
        });
        if (dbgSelResult?.success) {
          clickSuccess = true;
          console.log('[TikTok Auto] Method 2: DEBUGGER_CLICK_SELECTOR success at', dbgSelResult.x, dbgSelResult.y);
        }
      } catch (e) {
        console.log('[TikTok Auto] Method 2 error:', e.message);
      }
    }

    // ★ วิธี 3: DEBUGGER_CLICK ปกติ (zoom-compensated) ★
    if (!clickSuccess) {
      try {
        const dbgResult = await chrome.runtime.sendMessage({
          type: 'DEBUGGER_CLICK', x: centerX, y: centerY
        });
        if (dbgResult?.success) {
          clickSuccess = true;
          console.log('[TikTok Auto] Method 3: DEBUGGER_CLICK success');
        }
      } catch (e) {
        console.log('[TikTok Auto] Method 3 error:', e.message);
      }
    }

    // ★ วิธี 4: Synthetic events fallback ★
    if (!clickSuccess) {
      console.log('[TikTok Auto] Method 4: Synthetic events fallback...');
      button.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 200));
      button.focus();
      await new Promise(resolve => setTimeout(resolve, 100));
      button.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      await simulateRealClick(button);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    // ★ PD-INSPIRED: คืน overlay ★
    showOverlayAfterClick(hiddenOverlays);
    showNotification('✅ กด New Project แล้ว!');
    console.log('[TikTok Auto] Click events dispatched');

    await chrome.storage.local.set({ flowStatus: 'in_progress' });
    showNotification('⏳ รอหน้า New Project โหลด...');

    let enteredProject = false;
    let homeGoneCount = 0; // นับว่า home button หายไปกี่รอบแล้ว
    for (let waitAttempt = 1; waitAttempt <= 10; waitAttempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      // ★ FIX: ใช้ .includes() แทน === เพราะ button อาจมี icon text เช่น "add_2" ติดมา ★
      const stillHome = Array.from(document.querySelectorAll('button, [role="button"], a')).some(
          el => {
            const t = (el.textContent || '').toLowerCase();
            return t.includes('new project') || t.includes('โปรเจกต์ใหม่');
          }
        );
      // ★ FIX: ต้องมี Slate editor จริงๆ ถึงจะนับว่าเข้า project — contenteditable อย่างเดียวไม่พอ ★
      const hasSlateEditor = document.querySelector('[data-slate-editor="true"]');
      const hasProjectUI = hasSlateEditor || document.querySelector('textarea[placeholder], img[src*="blob:"]');

      if (!stillHome) homeGoneCount++;

      // ★ เข้า project ถ้า: (1) มี project UI + home หายไป หรือ (2) home หายไป 3 รอบติด ★
      if ((hasProjectUI && !stillHome) || homeGoneCount >= 3) {
        enteredProject = true;
        console.log(`[TikTok Auto] ✅ Entered project! (attempt:${waitAttempt}) hasSlate:${!!hasSlateEditor} stillHome:${stillHome} homeGoneCount:${homeGoneCount}`);
        showNotification('✅ เข้า New Project สำเร็จ!');
        break;
      }
      if (hasProjectUI && stillHome) {
        console.log('[TikTok Auto] Has project UI but still see home button — waiting... (attempt:', waitAttempt, ')');
      }
      showNotification(`⏳ รอเข้า New Project... (${waitAttempt * 3} วิ)`);
      console.log(`[TikTok Auto] Still on home page — attempt:${waitAttempt} stillHome:${stillHome} hasSlate:${!!hasSlateEditor} homeGone:${homeGoneCount}`);
    }

    if (!enteredProject) {
      console.log('[TikTok Auto] ⚠️ Still on home after 30s — retrying click...');
      showNotification('⚠️ ยังไม่เข้า Project — ลองกดอีกครั้ง...');
      const retryBtn = Array.from(document.querySelectorAll('button, [role="button"], a')).find(
        el => {
          const t = el.textContent?.trim() || '';
          return t === '+ New project' || t === 'New project' || t.includes('New project') || t === '+ โปรเจกต์ใหม่';
        }
      );
      if (retryBtn) {
        // ★ FIX: ชดเชย CSS zoom สำหรับ retry click ★
        const retryZoom = parseFloat(document.body.style.zoom) || 1;
        const retryZF = retryZoom > 1 ? retryZoom / 100 : (retryZoom > 0 ? retryZoom : 1);
        const r2 = retryBtn.getBoundingClientRect();
        const rx = Math.round((r2.left + r2.width / 2) / retryZF);
        const ry = Math.round((r2.top + r2.height / 2) / retryZF);
        console.log(`[TikTok Auto] Retry click at adjusted (${rx},${ry}) zoom=${retryZF}`);

        // วิธี A: React onClick
        let retryReactOk = false;
        for (const key of Object.keys(retryBtn)) {
          if (key.startsWith('__reactProps')) {
            const p = retryBtn[key];
            if (p?.onClick) { p.onClick({ type:'click', target:retryBtn, currentTarget:retryBtn, preventDefault(){}, stopPropagation(){} }); retryReactOk = true; break; }
          }
        }
        // วิธี B: Debugger click (zoom-compensated)
        if (!retryReactOk) {
          try {
            await chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: rx, y: ry });
          } catch (e) { }
        }
        // วิธี C: simulateRealClick
        if (!retryReactOk) {
          await simulateRealClick(retryBtn);
        }
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
      const hasProjectUI2 = document.querySelector('[data-slate-editor], textarea, [contenteditable="true"], img[src*="blob:"]');
      if (!hasProjectUI2) {
        showNotification('❌ ไม่สามารถเข้า New Project ได้ — กรุณากด New Project เอง');
        console.log('[TikTok Auto] ❌ Cannot enter project after retry');
        return false;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // ★ V2 branch: ข้ามการอัปรูปสินค้า → วาง image prompt ตรงเลย ★
    const ftCheck = await chrome.storage.local.get(['flowType']);
    if (ftCheck.flowType === 'autov2') {
      await retryStep(() => v2PasteImagePromptAndGenerate(), 'V2: Paste Image Prompt');
    } else {
      await retryStep(() => pasteProductImageToFlow(), 'Step 3: Upload Image');
    }
    return true;

  } else {
    console.log('[TikTok Auto] New Project button not found - checking if already in project...');
    showNotification('🔍 ตรวจสอบว่าอยู่ใน Project แล้วหรือไม่...');

    const hasGeneratedImage = document.querySelector('img[src*="blob:"], img[width="100"], video');
    const hasCreateImageDropdown = Array.from(document.querySelectorAll('button, [role="button"]')).some(
      btn => btn.textContent?.toLowerCase().includes('create image') ||
        btn.textContent?.toLowerCase().includes('text to video') ||
        btn.textContent?.toLowerCase().includes('frames to video') ||
        btn.textContent?.toLowerCase().includes('สร้างรูปภาพ') ||
        btn.textContent?.toLowerCase().includes('ข้อความเป็นวิดีโอ')
    );

    if (hasGeneratedImage || hasCreateImageDropdown) {
      console.log('[TikTok Auto] Already in project, skipping New Project step...');
      showNotification('✅ อยู่ใน Project แล้ว - ข้าม New Project');
      await chrome.storage.local.set({ flowStatus: 'in_progress' });
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const ftCheck2 = await chrome.storage.local.get(['flowType']);
      if (ftCheck2.flowType === 'autov2') {
        await retryStep(() => v2PasteImagePromptAndGenerate(), 'V2: Paste Image Prompt');
      } else {
        await retryStep(() => pasteProductImageToFlow(), 'Step 3: Upload Image');
      }
      return true;
    }

    showNotification('⚠️ ไม่พบปุ่ม New Project - กรุณากดเอง');
    return false;
  }
}

// Create floating control panel
function createControlPanel() {
  // Remove existing panel if any
  const existingPanel = document.getElementById('tiktok-auto-panel');
  if (existingPanel) {
    existingPanel.remove();
  }

  const panel = document.createElement('div');
  panel.id = 'tiktok-auto-panel';
  panel.innerHTML = `
    <div class="tap-header">
      <span class="tap-logo">🎬</span>
      <span class="tap-title">TikTok Auto</span>
      <button class="tap-minimize" id="tap-minimize">−</button>
    </div>
    <div class="tap-content" id="tap-content">
      <div class="tap-info">
        <div class="tap-product">${currentFlowData?.productName || 'ไม่มีข้อมูล'}</div>
        <div class="tap-mode">โหมด: ${currentFlowData?.mode === 'image' ? '🖼️ สร้างรูป' : '🎬 สร้างวิดีโอ'}</div>
        <div class="tap-duration">${currentFlowData?.clipDuration || 8} วินาที</div>
      </div>
      
      <div class="tap-prompt-section">
        <label>Prompt:</label>
        <textarea id="tap-prompt" readonly>${currentFlowData?.prompt || ''}</textarea>
        <button class="tap-btn tap-copy" id="tap-copy-prompt">📋 Copy Prompt</button>
      </div>
      
      <div class="tap-actions">
        <button class="tap-btn tap-primary" id="tap-paste-prompt">📝 วาง Prompt</button>
        <button class="tap-btn tap-success" id="tap-complete-step">✅ เสร็จแล้ว</button>
      </div>
      
      <div class="tap-actions" style="margin-top: 8px;">
        <button class="tap-btn tap-auto" id="tap-create-image">🖼️ Create Image x2</button>
      </div>
      
      <div class="tap-status" id="tap-status">
        พร้อมใช้งาน
      </div>
    </div>
  `;

  // Add styles
  const styles = document.createElement('style');
  styles.textContent = `
    #tiktok-auto-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: 'Segoe UI', sans-serif;
      color: #fff;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .tap-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background: rgba(255,255,255,0.05);
      cursor: move;
    }
    
    .tap-logo {
      font-size: 20px;
      margin-right: 8px;
    }
    
    .tap-title {
      flex: 1;
      font-weight: 600;
      font-size: 14px;
    }
    
    .tap-minimize {
      background: none;
      border: none;
      color: #fff;
      font-size: 18px;
      cursor: pointer;
      padding: 0 8px;
    }
    
    .tap-content {
      padding: 16px;
    }
    
    .tap-content.minimized {
      display: none;
    }
    
    .tap-info {
      background: rgba(255,255,255,0.05);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    
    .tap-product {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
      color: #00d4ff;
    }
    
    .tap-mode, .tap-duration {
      font-size: 12px;
      color: rgba(255,255,255,0.7);
    }
    
    .tap-prompt-section {
      margin-bottom: 12px;
    }
    
    .tap-prompt-section label {
      display: block;
      font-size: 12px;
      color: rgba(255,255,255,0.7);
      margin-bottom: 4px;
    }
    
    #tap-prompt {
      width: 100%;
      height: 80px;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      color: #fff;
      font-size: 11px;
      padding: 8px;
      resize: none;
      margin-bottom: 8px;
    }
    
    .tap-btn {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .tap-copy {
      background: rgba(255,255,255,0.1);
      color: #fff;
      width: 100%;
    }
    
    .tap-copy:hover {
      background: rgba(255,255,255,0.2);
    }
    
    .tap-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    
    .tap-primary {
      flex: 1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
    
    .tap-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102,126,234,0.4);
    }
    
    .tap-success {
      flex: 1;
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: #fff;
    }
    
    .tap-success:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(56,239,125,0.4);
    }
    
    .tap-auto {
      flex: 1;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: #fff;
    }
    
    .tap-auto:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(245,87,108,0.4);
    }
    
    .tap-status {
      margin-top: 12px;
      padding: 8px;
      background: rgba(0,212,255,0.1);
      border-radius: 6px;
      font-size: 11px;
      text-align: center;
      color: #00d4ff;
    }
    
    .tap-notification {
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 999998;
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;

  document.head.appendChild(styles);
  document.body.appendChild(panel);

  // Add event listeners
  document.getElementById('tap-minimize').addEventListener('click', () => {
    const content = document.getElementById('tap-content');
    content.classList.toggle('minimized');
  });

  document.getElementById('tap-copy-prompt').addEventListener('click', copyPromptToClipboard);
  document.getElementById('tap-paste-prompt').addEventListener('click', pastePromptToFlow);
  document.getElementById('tap-complete-step').addEventListener('click', completeCurrentStep);
  document.getElementById('tap-create-image').addEventListener('click', clickCreateImageDropdown);

  // Make panel draggable
  makeDraggable(panel);
}

// Copy prompt to clipboard
async function copyPromptToClipboard() {
  if (!currentFlowData?.prompt) return;

  try {
    await navigator.clipboard.writeText(currentFlowData.prompt);
    updateStatus('📋 คัดลอก Prompt แล้ว!');
    showNotification('📋 คัดลอก Prompt แล้ว!');
  } catch (e) {
    console.error('Copy failed:', e);
    updateStatus('❌ คัดลอกไม่สำเร็จ');
  }
}

// Paste prompt to Google Flow input
async function pastePromptToFlow() {
  if (!currentFlowData?.prompt) return;

  updateStatus('🔍 กำลังหา Input field...');

  // Try to find the prompt input field in Google Flow
  // Note: Selectors may need adjustment based on actual Google Flow UI
  const possibleSelectors = [
    'textarea[placeholder*="prompt"]',
    'textarea[placeholder*="Prompt"]',
    'textarea[placeholder*="describe"]',
    'textarea[placeholder*="Describe"]',
    'textarea.prompt-input',
    'textarea[data-testid="prompt-input"]',
    'div[contenteditable="true"]',
    'textarea',
    'input[type="text"]'
  ];

  let inputField = null;

  for (const selector of possibleSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      // Check if element is visible
      if (el.offsetParent !== null) {
        inputField = el;
        break;
      }
    }
    if (inputField) break;
  }

  if (inputField) {
    // Focus and set value
    inputField.focus();

    if (inputField.tagName === 'TEXTAREA' || inputField.tagName === 'INPUT') {
      inputField.value = currentFlowData.prompt;
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
      inputField.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (inputField.contentEditable === 'true') {
      inputField.textContent = currentFlowData.prompt;
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    updateStatus('✅ วาง Prompt แล้ว!');
    showNotification('✅ วาง Prompt เรียบร้อย!');
  } else {
    updateStatus('⚠️ ไม่พบ Input field - กรุณาวางเอง');
    // Copy to clipboard as fallback
    await copyPromptToClipboard();
  }
}

// Complete current step and notify sidepanel
async function completeCurrentStep() {
  if (!currentFlowData) return;

  updateStatus('📤 กำลังแจ้ง SidePanel...');

  // Update storage to notify sidepanel
  await chrome.storage.local.set({
    flowStatus: 'step_completed',
    completedStep: {
      itemId: currentFlowData.itemId,
      mode: currentFlowData.mode,
      timestamp: Date.now()
    }
  });

  // Send message to sidepanel — ★ ต้องมี source: 'google-flow' + type: 'STEP_COMPLETED' ★
  try {
    await chrome.runtime.sendMessage({
      source: 'google-flow',
      type: 'STEP_COMPLETED',
      data: {
        itemId: currentFlowData.itemId,
        mode: currentFlowData.mode
      }
    });
  } catch (e) {
    console.log('Could not send message to sidepanel:', e);
  }

  updateStatus('✅ แจ้งเสร็จแล้ว! รอขั้นตอนถัดไป...');
  showNotification('✅ เสร็จสิ้น! กลับไปที่ SidePanel');

  // Clear current flow data
  currentFlowData = null;

  // Remove panel after delay
  setTimeout(() => {
    const panel = document.getElementById('tiktok-auto-panel');
    if (panel) panel.remove();
  }, 2000);
}

// Update status text
function updateStatus(text) {
  const statusEl = document.getElementById('tap-status');
  if (statusEl) {
    statusEl.textContent = text;
  }
}

// ★ v3.24: Final safety sanitizer before pasting prompt to Google Flow Slate ★
function sanitizePromptForFlow(text) {
  if (!text || typeof text !== 'string') return text || '';
  let p = text;
  const banned = [
    /\b(kill|murder|blood|gore|weapon|gun|knife|stab|shoot|explode|bomb|suicide|drug|narcotic)\b/gi,
    /\b(naked|nude|sex|erotic|porn|nsfw)\b/gi,
    /\b(scream|shriek|thunder|explosion|gunshot|siren|alarm|crash|bang|roar)\b/gi,
  ];
  const softReplace = {
    'scream': 'exclaim softly', 'shriek': 'gasp', 'thunder': 'gentle rain',
    'explosion': 'gentle pop', 'gunshot': 'soft tap', 'siren': 'gentle chime',
    'alarm': 'soft notification', 'crash': 'soft landing', 'bang': 'soft knock',
    'roar': 'gentle hum'
  };
  for (const [k, v] of Object.entries(softReplace)) {
    p = p.replace(new RegExp('\\b' + k + '\\b', 'gi'), v);
  }
  for (const rx of banned) {
    p = p.replace(rx, '');
  }
  // Strip composite/multi-panel instructions
  p = p.replace(/\b(split[- ]?screen|side[- ]?by[- ]?side|before[- ]?and[- ]?after|collage|multi[- ]?panel|diptych|triptych|two[- ]?panel|dual[- ]?image)\b/gi, '');
  p = p.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return p;
}

// Show notification + send to Activity Log in sidepanel
function showNotification(text, logType) {
  // ★ Auto-detect log type from emoji prefix ★
  if (!logType) {
    if (text.startsWith('✅') || text.startsWith('💾')) logType = 'success';
    else if (text.startsWith('❌')) logType = 'error';
    else if (text.startsWith('⚠️') || text.startsWith('🛑')) logType = 'warning';
    else logType = 'info';
  }

  // ★ ส่ง log ไป sidepanel Activity Log (real-time) ★
  try {
    chrome.runtime.sendMessage({
      source: 'google-flow',
      type: 'ACTIVITY_LOG',
      data: { message: text, logType: logType }
    }).catch(() => {}); // ignore if sidepanel not listening
  } catch (e) {
    // Extension context invalid — ไม่เป็นไร
  }

  // ★ On-screen notification ปิดแล้ว — ส่งไป Activity Log อย่างเดียว ★
}

// Step 3: Click + (Add Media) button and upload product image
async function pasteProductImageToFlow() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 3: Click + button and upload image...');
  showNotification('📷 กำลังกดปุ่ม + เพื่ออัพโหลดรูป...');

  showNotification('⏳ รอ 8 วินาที (เผื่อเน็ตช้า)...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Get product image from storage — ★ ใช้ base64 ก่อน, fallback เป็น URL ★
  const result = await chrome.storage.local.get(['currentFlowData']);
  const productImageBase64 = currentFlowData?.productImageBase64 || result.currentFlowData?.productImageBase64;
  const imageUrl = result.currentFlowData?.imageUrl || result.currentFlowData?.productImage;

  if (!productImageBase64 && !imageUrl) {
    console.log('[TikTok Auto] No product image found (neither base64 nor URL)');
    showNotification('⚠️ ไม่พบรูปสินค้า');
    return false;
  }

  if (productImageBase64) {
    console.log('[TikTok Auto] Using product image base64 from Storymode (length:', productImageBase64.length, ')');
  } else {
    console.log('[TikTok Auto] Using product image URL:', imageUrl);
  }

  // Click + (Add Media) button
  const addButtonClicked = await clickAddMediaButton();

  if (addButtonClicked) {
    // Wait for menu to appear, then click Upload image
    await new Promise(resolve => setTimeout(resolve, 1000));

    // ★ ใช้ base64 ถ้ามี, ไม่งั้นใช้ URL ★
    if (productImageBase64) {
      await injectImageFromBase64(productImageBase64);
    } else {
      await injectImageFromUrl(imageUrl);
    }

    return true;
  } else {
    console.log('[TikTok Auto] Could not click Add Media button');
    showNotification('⚠️ ไม่สามารถกดปุ่ม + ได้');
    return false;
  }
}

// Step 3 Fallback: Click + (Add Media) button
async function clickAddMediaButton() {
  console.log('[TikTok Auto] Step 3 Fallback: Looking for + (Add Media) button...');
  showNotification('🔍 กำลังหาปุ่ม + (Add Media)...');

  let addButton = null;

  // Method 1: Find by aria-haspopup="menu" with add icon
  const menuButtons = document.querySelectorAll('button[aria-haspopup="menu"]');
  for (const btn of menuButtons) {
    const icon = btn.querySelector('i');
    if (icon && icon.textContent?.trim().toLowerCase() === 'add') {
      addButton = btn;
      console.log('[TikTok Auto] Found Add Media button by aria-haspopup:', btn);
      break;
    }
  }

  // Method 2: Find by "Add Media" text
  if (!addButton) {
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      if (btn.textContent?.includes('Add Media') || btn.textContent?.includes('เพิ่มสื่อ')) {
        addButton = btn;
        console.log('[TikTok Auto] Found Add Media button by text:', btn);
        break;
      }
    }
  }

  // Method 3: Find by google-symbols add icon
  if (!addButton) {
    const addIcons = document.querySelectorAll('i.google-symbols, i[class*="google-symbols"]');
    for (const icon of addIcons) {
      if (icon.textContent?.trim().toLowerCase() === 'add') {
        addButton = icon.closest('button');
        if (addButton) {
          console.log('[TikTok Auto] Found Add button by icon:', addButton);
          break;
        }
      }
    }
  }

  if (addButton) {
    console.log('[TikTok Auto] Clicking + button...');
    showNotification('🖱️ กดปุ่ม +...');

    addButton.click();

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Now click "Upload image" option
    await clickUploadImageOption();

    return true;
  } else {
    console.log('[TikTok Auto] + button not found');
    showNotification('⚠️ ไม่พบปุ่ม +');
    return false;
  }
}

// Step 3b: Click "Upload image" option from menu
async function clickUploadImageOption() {
  console.log('[TikTok Auto] Looking for Upload image option...');
  showNotification('🔍 กำลังหา Upload image...');

  // Wait for menu to appear
  await new Promise(resolve => setTimeout(resolve, 1000));

  let uploadOption = null;

  // Method 1: Find menu items by role
  const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], [data-radix-collection-item]');
  console.log('[TikTok Auto] Found menu items:', menuItems.length);
  for (const item of menuItems) {
    const text = item.textContent?.toLowerCase() || '';
    console.log('[TikTok Auto] Menu item text:', text);
    if (text.includes('upload image') || text.includes('upload') || text.includes('อัปโหลด')) {
      uploadOption = item;
      console.log('[TikTok Auto] Found Upload image option:', item);
      break;
    }
  }

  // Method 2: Find by icon "upload"
  if (!uploadOption) {
    const uploadIcons = document.querySelectorAll('i.google-symbols, i[class*="google-symbols"]');
    for (const icon of uploadIcons) {
      if (icon.textContent?.trim().toLowerCase() === 'upload') {
        uploadOption = icon.closest('[role="menuitem"]') || icon.closest('button') || icon.parentElement;
        if (uploadOption) {
          console.log('[TikTok Auto] Found Upload by icon:', uploadOption);
          break;
        }
      }
    }
  }

  // Method 3: Find any visible element with "Upload" text
  if (!uploadOption) {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.offsetParent !== null && el.children.length === 0) {
        const text = el.textContent?.trim().toLowerCase() || '';
        if (text === 'upload image' || text === 'upload') {
          uploadOption = el.closest('[role="menuitem"]') || el.closest('button') || el;
          if (uploadOption) {
            console.log('[TikTok Auto] Found Upload by text:', uploadOption);
            break;
          }
        }
      }
    }
  }

  if (uploadOption) {
    console.log('[TikTok Auto] Clicking Upload image...');
    showNotification('🖱️ กด Upload image...');

    uploadOption.click();

    await new Promise(resolve => setTimeout(resolve, 1500));
    showNotification('✅ เลือก Upload image แล้ว!');

    return true;
  } else {
    console.log('[TikTok Auto] Upload image option not found');
    showNotification('⚠️ ไม่พบ Upload image');
    return false;
  }
}

// Step 3c-alt: Inject image from base64 into file input (รูปสินค้าจาก Storymode)
async function injectImageFromBase64(base64Data) {
  console.log('[TikTok Auto] Injecting image from base64 (length:', base64Data.length, ')');
  showNotification('📥 กำลังอัพโหลดรูปสินค้าจาก Storymode...');

  try {
    // Convert base64 to blob
    const mimeMatch = base64Data.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const rawBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const byteString = atob(rawBase64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], { type: mimeType });

    console.log('[TikTok Auto] Converted base64 to blob:', mimeType, blob.size, 'bytes');

    // Find file input
    let fileInput = document.querySelector('input[type="file"]');
    if (!fileInput) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      fileInput = document.querySelector('input[type="file"]');
    }

    if (fileInput) {
      console.log('[TikTok Auto] Found file input:', fileInput);

      // Create a File object from blob
      const ext = mimeType.split('/')[1] || 'png';
      const file = new File([blob], `product-image.${ext}`, { type: mimeType });

      // Create a DataTransfer to set files
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      // Dispatch change event
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));

      console.log('[TikTok Auto] Base64 image injected to file input!');
      showNotification('✅ อัพโหลดรูปสินค้าสำเร็จ! รอรูปปรากฏ...');

      await new Promise(resolve => setTimeout(resolve, 8000));

      // Continue to Step 4: Hover image and Add to Prompt
      await retryStep(() => hoverImageAndAddToPrompt(), 'Step 4: Hover Image + Add to Prompt');

      return true;
    } else {
      console.log('[TikTok Auto] File input not found');
      showNotification('⚠️ ไม่พบ file input');
      return false;
    }
  } catch (error) {
    console.error('[TikTok Auto] Error injecting base64 image:', error);
    showNotification('❌ Error: ' + error.message);
    return false;
  }
}

// Step 3c: Inject image from URL into file input
async function injectImageFromUrl(imageUrl) {
  console.log('[TikTok Auto] Injecting image from URL:', imageUrl);
  showNotification('📥 กำลังดาวน์โหลดและอัพโหลดรูป...');

  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    console.log('[TikTok Auto] Image blob:', blob.type, blob.size);

    // Find file input
    let fileInput = document.querySelector('input[type="file"]');

    if (!fileInput) {
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 1000));
      fileInput = document.querySelector('input[type="file"]');
    }

    if (fileInput) {
      console.log('[TikTok Auto] Found file input:', fileInput);

      // Create a File object from blob
      const file = new File([blob], 'product-image.png', { type: blob.type || 'image/png' });

      // Create a DataTransfer to set files
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      // Dispatch change event
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));

      console.log('[TikTok Auto] Image injected to file input!');
      showNotification('✅ อัพโหลดรูปสำเร็จ! รอรูปปรากฏ...');

      await new Promise(resolve => setTimeout(resolve, 8000));

      // Continue to Step 4: Hover image and Add to Prompt
      await retryStep(() => hoverImageAndAddToPrompt(), 'Step 4: Hover Image + Add to Prompt');

      return true;
    } else {
      console.log('[TikTok Auto] File input not found');
      showNotification('⚠️ ไม่พบ file input');
      return false;
    }
  } catch (error) {
    console.error('[TikTok Auto] Error injecting image:', error);
    showNotification('❌ Error: ' + error.message);
    return false;
  }
}

// Step 4: Right-click on first uploaded image and click "Add to Prompt"
async function hoverImageAndAddToPrompt() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 4: Right-click image and Add to Prompt...');
  showNotification('🖱️ กำลังหารูปที่อัพโหลด...');

  showNotification('⏳ รอ 8 วินาที (เผื่อเน็ตช้า)...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  // ★ Find the first uploaded image (blob: src) ★
  let targetImage = null;
  const allImages = document.querySelectorAll('img');
  
  for (const img of allImages) {
    // Look for blob images (uploaded images)
    if (img.src?.startsWith('blob:') && img.offsetParent !== null && img.width > 50) {
      targetImage = img;
      console.log('[TikTok Auto] Found first blob image:', img.src.substring(0, 50));
      break;
    }
  }

  // Fallback: Find large visible images
  if (!targetImage) {
    for (const img of allImages) {
      if (img.offsetParent !== null && img.width > 80 && img.height > 80) {
        const src = img.src?.toLowerCase() || '';
        if (!src.includes('icon') && !src.includes('logo') && !src.includes('avatar')) {
          targetImage = img;
          console.log('[TikTok Auto] Found large image:', img.width, 'x', img.height);
          break;
        }
      }
    }
  }

  if (!targetImage) {
    console.log('[TikTok Auto] No image found');
    showNotification('⚠️ ไม่พบรูปที่อัพโหลด');
    return false;
  }

  console.log('[TikTok Auto] Target image found, right-clicking...');
  showNotification('🖱️ คลิกขวาที่รูปแรก...');

  // ★ Scroll image into view ★
  targetImage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await new Promise(resolve => setTimeout(resolve, 800));

  // ★ Try right-click multiple times ★
  let addToPromptBtn = null;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    console.log('[TikTok Auto] Right-click attempt', attempt + 1);
    
    // ★ Get image position ★
    const rect = targetImage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // ★ Focus and hover first ★
    targetImage.focus?.();
    targetImage.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: centerX, clientY: centerY }));
    targetImage.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: centerX, clientY: centerY }));
    await new Promise(resolve => setTimeout(resolve, 300));

    // ★ Right-click on the image ★
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY,
      button: 2,
      view: window
    });
    targetImage.dispatchEvent(contextMenuEvent);

    // รอให้ context menu โหลด (เผื่อเน็ตช้า)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ★ Find "Add to Prompt" button ★
    addToPromptBtn = await findAddToPromptButton();
    
    if (addToPromptBtn) {
      console.log('[TikTok Auto] Found Add to Prompt at attempt', attempt + 1);
      break;
    }
    
    // ถ้าไม่เจอ ลองคลิกที่อื่นเพื่อปิด menu แล้วลองใหม่
    if (attempt < 2) {
      console.log('[TikTok Auto] Add to Prompt not found, retrying...');
      document.body.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (addToPromptBtn) {
    console.log('[TikTok Auto] Clicking Add to Prompt...');
    showNotification('🖱️ กด Add to Prompt...');

    // Click with multiple methods
    addToPromptBtn.click();
    
    // Also dispatch click event
    addToPromptBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('[TikTok Auto] Step 4 completed!');
    showNotification('✅ Add to Prompt เสร็จ!');

    // Check if there's a character image to upload
    await new Promise(resolve => setTimeout(resolve, 4000));
    await retryStep(() => uploadCharacterImageIfExists(), 'Step 4b: Upload Character Image');

    return true;
  } else {
    console.log('[TikTok Auto] Add to Prompt button not found after all attempts');
    showNotification('⚠️ ไม่พบ Add to Prompt - ลองคลิกขวาที่รูปด้วยตัวเอง');
    
    // ยังคงไปต่อ Step 4b
    await new Promise(resolve => setTimeout(resolve, 4000));
    await retryStep(() => uploadCharacterImageIfExists(), 'Step 4b: Upload Character Image');
    
    return false;
  }
}

// ★ Helper function to find "Add to Prompt" button ★
async function findAddToPromptButton() {
  console.log('[TikTok Auto] Looking for Add to Prompt...');

  // ★ Retry หลายรอบเพราะ menu อาจยังไม่โหลด ★
  for (let retry = 0; retry < 5; retry++) {
    if (retry > 0) {
      console.log('[TikTok Auto] Retry finding Add to Prompt...', retry);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    let addToPromptBtn = null;

    // Method 1: Find by role="menuitem" with "Add to Prompt" text
    const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], button, [class*="menu"] button, [class*="MenuItem"], li[role]');
    console.log('[TikTok Auto] Found menu items:', menuItems.length);
    
    for (const item of menuItems) {
      const text = item.textContent?.toLowerCase() || '';
      if (text.includes('add to prompt') || text.includes('addtoprompt') || text.includes('add_to_prompt') || text.includes('เพิ่มในพรอมต์') || text.includes('เพิ่มลงในพรอมต์')) {
        addToPromptBtn = item;
        console.log('[TikTok Auto] Found Add to Prompt button:', item.textContent?.substring(0, 30));
        break;
      }
    }

    // Method 2: Find by icon "add" with text
    if (!addToPromptBtn) {
      const addIcons = document.querySelectorAll('i.google-symbols, i[class*="material"], mat-icon, .material-icons, i');
      for (const icon of addIcons) {
        const iconText = icon.textContent?.trim().toLowerCase() || '';
        if (iconText === 'add' || iconText === 'add_circle' || iconText === 'playlist_add' || iconText === 'add_photo_alternate') {
          const parent = icon.closest('button, [role="menuitem"], [role="option"], [class*="menu-item"], [class*="MenuItem"], li');
          if (parent) {
            const parentText = parent.textContent?.toLowerCase() || '';
            if ((parentText.includes('prompt') || parentText.includes('พรอมต์') || parentText.includes('add') || parentText.includes('เพิ่ม')) && parent.offsetParent !== null) {
              addToPromptBtn = parent;
              console.log('[TikTok Auto] Found Add to Prompt by icon:', parentText.substring(0, 30));
              break;
            }
          }
        }
      }
    }

    // Method 3: Find any visible button/option with "Add" text in a menu/popup
    if (!addToPromptBtn) {
      const popups = document.querySelectorAll('[role="menu"], [role="listbox"], [class*="popup"], [class*="dropdown"], [class*="context"], [class*="Popover"], [class*="Menu"]');
      console.log('[TikTok Auto] Found popups:', popups.length);
      
      for (const popup of popups) {
        if (popup.offsetParent !== null) {
          const buttons = popup.querySelectorAll('button, [role="menuitem"], [role="option"], div[tabindex], li, span[role]');
          for (const btn of buttons) {
            const text = btn.textContent?.toLowerCase() || '';
            if ((text.includes('add') || text.includes('เพิ่ม')) && (text.includes('prompt') || text.includes('พรอมต์'))) {
              addToPromptBtn = btn;
              console.log('[TikTok Auto] Found Add to Prompt in popup:', text.substring(0, 30));
              break;
            }
          }
        }
        if (addToPromptBtn) break;
      }
    }

    // Method 4: Find by aria-label
    if (!addToPromptBtn) {
      const allElements = document.querySelectorAll('[aria-label*="Add"], [aria-label*="add"], [title*="Add"], [title*="add"]');
      for (const el of allElements) {
        const label = (el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
        if ((label.includes('prompt') || label.includes('พรอมต์')) && el.offsetParent !== null) {
          addToPromptBtn = el;
          console.log('[TikTok Auto] Found Add to Prompt by aria-label:', label);
          break;
        }
      }
    }

    if (addToPromptBtn) {
      return addToPromptBtn;
    }
  }

  console.log('[TikTok Auto] Add to Prompt not found after retries');
  return null;
}

// Step 4b: Upload character image using + button (same method as Step 3)
async function uploadCharacterImageIfExists() {
  if (await isFlowStopped()) return;

  // Get character image URL from storage
  const result = await chrome.storage.local.get(['currentFlowData']);
  const characterImageUrl = result.currentFlowData?.characterImage || result.currentFlowData?.characterUrl;

  if (!characterImageUrl) {
    console.log('[TikTok Auto] No character image found, skipping to Step 5...');
    showNotification('ℹ️ ไม่มีรูปตัวละคร - ข้ามไป Step 5');

    // Continue to Step 5
    await new Promise(resolve => setTimeout(resolve, 4000));
    await retryStep(() => selectImagePortraitX1(), 'Step 5: Select Image Portrait x1');

    return true;
  }

  console.log('[TikTok Auto] Step 4b: Uploading character image via + button...');
  console.log('[TikTok Auto] Character image URL:', characterImageUrl);
  showNotification('👤 กำลังอัพโหลดรูปตัวละคร...');

  // Wait a bit before starting
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Click + (Add Media) button
  const addButtonClicked = await clickAddMediaButton();

  if (addButtonClicked) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Inject character image directly to file input (skip Upload image option)
    await injectCharacterImageToFileInput(characterImageUrl);

    return true;
  } else {
    console.log('[TikTok Auto] Could not click Add Media button for character');
    showNotification('⚠️ ไม่สามารถกดปุ่ม + สำหรับตัวละคร');
    return false;
  }
}

// Inject character image directly to file input
async function injectCharacterImageToFileInput(imageUrl) {
  console.log('[TikTok Auto] Injecting character image from URL:', imageUrl);
  showNotification('📥 กำลังดาวน์โหลดรูปตัวละคร...');

  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    console.log('[TikTok Auto] Character image blob:', blob.type, blob.size);

    // Find file input
    let fileInput = document.querySelector('input[type="file"]');

    if (!fileInput) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      fileInput = document.querySelector('input[type="file"]');
    }

    if (fileInput) {
      console.log('[TikTok Auto] Found file input for character:', fileInput);

      // Create a File object from blob
      const file = new File([blob], 'character-image.png', { type: blob.type || 'image/png' });

      // Create a DataTransfer to set files
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      // Dispatch change event
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));

      console.log('[TikTok Auto] Character image injected to file input!');
      showNotification('✅ อัพโหลดรูปตัวละครสำเร็จ! รอรูปปรากฏ...');

      // ★ FIX: Snapshot รูปทั้งหมดที่มีอยู่ก่อน upload → เพื่อหารูปใหม่ที่เพิ่มมาหลัง upload ★
      const preUploadImageSrcs = new Set();
      document.querySelectorAll('img').forEach(img => {
        if (img.offsetParent !== null && img.width > 80 && img.height > 80) {
          preUploadImageSrcs.add(img.src);
        }
      });
      console.log('[TikTok Auto] Pre-upload character snapshot:', preUploadImageSrcs.size, 'images');

      await new Promise(resolve => setTimeout(resolve, 5000));

      // Hover and Add to Prompt for character image — ★ ส่ง snapshot ไปด้วย ★
      await retryStep(() => hoverCharacterImageAndAddToPrompt(preUploadImageSrcs), 'Step 4b-3: Hover Character + Add to Prompt');

      return true;
    } else {
      console.log('[TikTok Auto] File input not found for character');
      showNotification('⚠️ ไม่พบ file input สำหรับตัวละคร');
      return false;
    }
  } catch (error) {
    console.error('[TikTok Auto] Error injecting character image:', error);
    showNotification('❌ Error: ' + error.message);
    return false;
  }
}

// REMOVED: clickAddMediaButtonForCharacter - no longer needed
// Using Copy/Paste method instead of Upload button

// Placeholder for backward compatibility
async function clickAddMediaButtonForCharacter() {
  console.log('[TikTok Auto] clickAddMediaButtonForCharacter is deprecated, using paste method');
  return false;
}

// OLD CODE BELOW - keeping for reference
async function clickAddMediaButtonForCharacterOLD() {
  console.log('[TikTok Auto] Looking for + (Add Media) button for character...');
  showNotification('🔍 กำลังหาปุ่ม + สำหรับตัวละคร...');

  let addButton = null;

  // Method 1: Find by aria-haspopup="menu" with add icon
  const menuButtons = document.querySelectorAll('button[aria-haspopup="menu"]');
  for (const btn of menuButtons) {
    const icon = btn.querySelector('i');
    if (icon && icon.textContent?.trim().toLowerCase() === 'add') {
      addButton = btn;
      console.log('[TikTok Auto] Found Add Media button for character:', btn);
      break;
    }
  }

  // Method 2: Find by google-symbols add icon
  if (!addButton) {
    const addIcons = document.querySelectorAll('i.google-symbols, i[class*="google-symbols"]');
    for (const icon of addIcons) {
      if (icon.textContent?.trim().toLowerCase() === 'add') {
        addButton = icon.closest('button');
        if (addButton) {
          console.log('[TikTok Auto] Found Add button by icon for character:', addButton);
          break;
        }
      }
    }
  }

  if (addButton) {
    console.log('[TikTok Auto] Clicking + button for character...');
    showNotification('🖱️ กดปุ่ม + สำหรับตัวละคร...');

    addButton.click();

    await new Promise(resolve => setTimeout(resolve, 1500));

    return true;
  } else {
    console.log('[TikTok Auto] + button not found for character');
    showNotification('⚠️ ไม่พบปุ่ม + สำหรับตัวละคร');
    return false;
  }
}

// Step 4b-2: Inject character image from URL
async function injectCharacterImage(imageUrl) {
  console.log('[TikTok Auto] Injecting character image from URL:', imageUrl);
  showNotification('📥 กำลังดาวน์โหลดรูปตัวละคร...');

  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    console.log('[TikTok Auto] Character image blob:', blob.type, blob.size);

    // Find file input
    let fileInput = document.querySelector('input[type="file"]');

    if (!fileInput) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      fileInput = document.querySelector('input[type="file"]');
    }

    if (fileInput) {
      console.log('[TikTok Auto] Found file input for character');

      // Create a File object from blob
      const file = new File([blob], 'character-image.png', { type: blob.type || 'image/png' });

      // Create a DataTransfer to set files
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      // Dispatch change event
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));

      console.log('[TikTok Auto] Character image injected!');
      showNotification('✅ อัพโหลดรูปตัวละครสำเร็จ! รอรูปปรากฏ...');

      // ★ FIX: Snapshot รูปที่มีอยู่ก่อน upload → หารูปใหม่หลัง upload ★
      const preUploadSrcs = new Set();
      document.querySelectorAll('img').forEach(img => {
        if (img.offsetParent !== null && img.width > 80 && img.height > 80) {
          preUploadSrcs.add(img.src);
        }
      });

      await new Promise(resolve => setTimeout(resolve, 5000));

      // Hover and Add to Prompt for character image — ★ ส่ง snapshot ★
      await retryStep(() => hoverCharacterImageAndAddToPrompt(preUploadSrcs), 'Step 4b-3: Hover Character + Add to Prompt');

      return true;
    } else {
      console.log('[TikTok Auto] File input not found for character');
      showNotification('⚠️ ไม่พบ file input สำหรับตัวละคร');
      return false;
    }
  } catch (error) {
    console.error('[TikTok Auto] Error injecting character image:', error);
    showNotification('❌ Error: ' + error.message);
    return false;
  }
}

// Step 4b-3: Right-click character image and click Add to Prompt
// ★ FIX: รับ preUploadSrcs (snapshot รูปก่อน upload) เพื่อหารูปใหม่ที่เป็นตัวละครจริงๆ ★
async function hoverCharacterImageAndAddToPrompt(preUploadSrcs) {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 4b-3: Right-click character image and Add to Prompt...');
  showNotification('🖱️ กำลังหารูปตัวละคร...');

  // ★ รอรูปตัวละครปรากฏ — poll สูงสุด 30 วินาที แทนรอแบบ fixed ★
  showNotification('⏳ รอรูปตัวละครอัพโหลดเสร็จ...');
  let targetImage = null;
  
  for (let waitSec = 0; waitSec < 30; waitSec++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const allImages = document.querySelectorAll('img');
    
    // ★ วิธีที่ 1: หารูปใหม่ที่ไม่อยู่ใน snapshot (ถูกต้องที่สุด) ★
    if (preUploadSrcs && preUploadSrcs.size > 0) {
      for (const img of allImages) {
        if (img.offsetParent !== null && img.width > 80 && img.height > 80 && img.src) {
          if (!preUploadSrcs.has(img.src)) {
            const src = img.src.toLowerCase();
            if (!src.includes('icon') && !src.includes('logo') && !src.includes('avatar') && !src.includes('data:image/svg')) {
              targetImage = img;
              console.log('[TikTok Auto] ✅ Found NEW character image (not in pre-upload snapshot):', img.src?.substring(0, 60));
              break;
            }
          }
        }
      }
    }
    
    if (targetImage) break;
    
    if (waitSec % 5 === 4) {
      showNotification(`⏳ รอรูปตัวละคร... ${waitSec + 1} วิ`);
    }
  }
  
  // ★ Fallback: ถ้าไม่เจอรูปใหม่จาก snapshot → ใช้รูป blob ตัวสุดท้าย ★
  if (!targetImage) {
    console.log('[TikTok Auto] No new image found via snapshot, falling back to last blob image...');
    const allImages = document.querySelectorAll('img');
    const blobImages = [];
    for (const img of allImages) {
      if (img.src?.startsWith('blob:') && img.offsetParent !== null && img.width > 50) {
        blobImages.push(img);
      }
    }
    if (blobImages.length > 0) {
      targetImage = blobImages[blobImages.length - 1]; // blob ตัวสุดท้าย = upload ล่าสุด
      console.log('[TikTok Auto] Using last blob image as fallback:', targetImage.src?.substring(0, 60));
    }
  }
  
  // ★ Fallback 2: รูปใหญ่ตัวสุดท้าย ★
  if (!targetImage) {
    const allImages = document.querySelectorAll('img');
    const uploadedImages = [];
    for (const img of allImages) {
      if (img.offsetParent !== null && img.width > 80 && img.height > 80) {
        const src = img.src?.toLowerCase() || '';
        if (!src.includes('icon') && !src.includes('logo') && !src.includes('avatar')) {
          uploadedImages.push(img);
        }
      }
    }
    if (uploadedImages.length > 0) {
      targetImage = uploadedImages[uploadedImages.length - 1];
      console.log('[TikTok Auto] Using last large image as fallback 2:', targetImage.src?.substring(0, 60));
    }
  }

  if (!targetImage) {
    console.log('[TikTok Auto] No character image found');
    showNotification('⚠️ ไม่พบรูปตัวละคร - ข้ามไป Step 5');
    
    // Continue to Step 5 anyway
    await new Promise(resolve => setTimeout(resolve, 2000));
    await retryStep(() => selectImagePortraitX1(), 'Step 5: Select Image Portrait x1');
    return false;
  }

  console.log('[TikTok Auto] Right-clicking character image...');
  showNotification('🖱️ คลิกขวารูปตัวละคร...');

  // ★ Scroll image into view ★
  targetImage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await new Promise(resolve => setTimeout(resolve, 500));

  // ★ Get image position ★
  const rect = targetImage.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // ★ Right-click on the character image ★
  const contextMenuEvent = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: centerX,
    clientY: centerY,
    button: 2,
    view: window
  });
  targetImage.dispatchEvent(contextMenuEvent);

  await new Promise(resolve => setTimeout(resolve, 1500));

  // ★ Find and click "Add to Prompt" button ★
  let addToPromptBtn = await findAddToPromptButton();

  if (addToPromptBtn) {
    console.log('[TikTok Auto] Clicking Add to Prompt for character...');
    showNotification('🖱️ กด Add to Prompt สำหรับตัวละคร...');

    addToPromptBtn.click();

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('[TikTok Auto] Step 4b completed - Character added!');
    showNotification('✅ เพิ่มตัวละครเสร็จ!');

    // ★ Continue to Step 5 ★
    await new Promise(resolve => setTimeout(resolve, 4000));
    await retryStep(() => selectImagePortraitX1(), 'Step 5: Select Image Portrait x1');

    return true;
  } else {
    console.log('[TikTok Auto] Add to Prompt not found for character');
    showNotification('⚠️ ไม่พบ Add to Prompt - ลองคลิกขวาที่รูปตัวละครด้วยตัวเอง');
    
    // Still continue to Step 5 anyway
    await new Promise(resolve => setTimeout(resolve, 4000));
    await retryStep(() => selectImagePortraitX1(), 'Step 5: Select Image Portrait x1');
    
    return false;
  }
}

// Step 5: Click dropdown and select Image - Portrait - x1
async function selectImagePortraitX1() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 5: Selecting Image - Portrait - x1...');
  showNotification('🔧 กำลังเลือก Image - Portrait - x1...');

  showNotification('⏳ รอ 6 วินาที (เผื่อเน็ตช้า)...');
  await new Promise(resolve => setTimeout(resolve, 6000));

  // Find the dropdown button (Nano Banana Pro with crop icon)
  let dropdownButton = null;

  // Log all buttons for debugging
  const allButtons = document.querySelectorAll('button');
  console.log('[TikTok Auto] Found all buttons:', allButtons.length);

  // Method 1: Find button containing "Nano Banana Pro" text
  for (const btn of allButtons) {
    const text = btn.textContent || '';
    if (text.includes('Nano Banana Pro') || text.includes('🍌')) {
      dropdownButton = btn;
      console.log('[TikTok Auto] Found Nano Banana Pro button:', btn);
      break;
    }
  }

  // Method 2: Find by aria-haspopup="menu" with Nano/Banana text
  if (!dropdownButton) {
    const menuButtons = document.querySelectorAll('button[aria-haspopup="menu"]');
    for (const btn of menuButtons) {
      const text = btn.textContent?.toLowerCase() || '';
      if (text.includes('nano') || text.includes('banana')) {
        dropdownButton = btn;
        console.log('[TikTok Auto] Found dropdown by nano/banana text:', btn);
        break;
      }
    }
  }

  // Method 3: Find by class sc-46973129-1 (specific to this dropdown)
  if (!dropdownButton) {
    dropdownButton = document.querySelector('button.sc-46973129-1[aria-haspopup="menu"]');
    if (dropdownButton) {
      console.log('[TikTok Auto] Found dropdown by class sc-46973129-1:', dropdownButton);
    }
  }

  // Method 4: Find by crop icon
  if (!dropdownButton) {
    const cropIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of cropIcons) {
      const text = icon.textContent?.trim() || '';
      if (text.startsWith('crop_')) {
        dropdownButton = icon.closest('button[aria-haspopup="menu"]') || icon.closest('button');
        if (dropdownButton) {
          console.log('[TikTok Auto] Found dropdown by crop icon:', dropdownButton);
          break;
        }
      }
    }
  }

  // Method 5: Find button containing x1, x2, x3, x4 text (quantity selector)
  if (!dropdownButton) {
    for (const btn of allButtons) {
      const text = btn.textContent || '';
      if (/x[1-4]/.test(text) && btn.getAttribute('aria-haspopup') === 'menu') {
        dropdownButton = btn;
        console.log('[TikTok Auto] Found dropdown by x1-x4 text:', btn);
        break;
      }
    }
  }

  if (dropdownButton) {
    console.log('[TikTok Auto] Clicking dropdown button with mouse events...');
    showNotification('🖱️ กด dropdown...');

    // Use mouse events to properly trigger Radix UI dropdown
    const rect = dropdownButton.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    dropdownButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: centerX, clientY: centerY }));
    await new Promise(resolve => setTimeout(resolve, 50));
    dropdownButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: centerX, clientY: centerY }));
    await new Promise(resolve => setTimeout(resolve, 50));
    dropdownButton.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: centerX, clientY: centerY }));
    await new Promise(resolve => setTimeout(resolve, 50));
    dropdownButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: centerX, clientY: centerY }));
    await new Promise(resolve => setTimeout(resolve, 50));
    dropdownButton.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: centerX, clientY: centerY }));

    // Wait for menu to appear
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if dropdown opened (aria-expanded should be "true")
    const isOpen = dropdownButton.getAttribute('aria-expanded') === 'true' ||
      dropdownButton.getAttribute('data-state') === 'open';
    console.log('[TikTok Auto] Dropdown opened:', isOpen);

    if (!isOpen) {
      console.log('[TikTok Auto] Dropdown not opened, trying direct click...');
      dropdownButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Now look for the popup menu and select options
    await selectOptionsFromMenu(dropdownButton);
  } else {
    console.log('[TikTok Auto] Dropdown button not found');
    showNotification('⚠️ ไม่พบ dropdown button');
  }
}

// Helper: simulate full mouse click on element (pointerdown → mousedown → pointerup → mouseup → click)
async function simulateRealClick(element) {
  const rect = element.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const evtBase = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 };

  // ★ FIX: เพิ่ม hover events (mouseover/mouseenter/mousemove) ก่อน click
  //   ตาม pattern ของ PD-Auto-VIP ที่เสถียรกว่า — React components ต้อง detect hover ก่อน ★
  element.dispatchEvent(new MouseEvent('mouseover', { ...evtBase }));
  await new Promise(r => setTimeout(r, 20));
  element.dispatchEvent(new MouseEvent('mouseenter', { ...evtBase, bubbles: false }));
  await new Promise(r => setTimeout(r, 20));
  element.dispatchEvent(new MouseEvent('mousemove', { ...evtBase }));
  await new Promise(r => setTimeout(r, 30));

  // Pointer + Mouse down/up/click sequence
  element.dispatchEvent(new PointerEvent('pointerdown', { ...evtBase, pointerId: 1 }));
  await new Promise(r => setTimeout(r, 30));
  element.dispatchEvent(new MouseEvent('mousedown', { ...evtBase }));
  await new Promise(r => setTimeout(r, 40));
  element.dispatchEvent(new PointerEvent('pointerup', { ...evtBase, pointerId: 1 }));
  await new Promise(r => setTimeout(r, 30));
  element.dispatchEvent(new MouseEvent('mouseup', { ...evtBase }));
  await new Promise(r => setTimeout(r, 30));
  element.dispatchEvent(new MouseEvent('click', { ...evtBase }));

  // ★ FIX: ลบ backup element.click() — ป้องกัน double-click ทุกจุดที่เรียก simulateRealClick ★
}

// Helper: find a tab by matching criteria
// ★ v2.85 FIX: ค้นหาจากทุก button (ไม่จำกัด role="tab") เพราะ Google Flow UI เปลี่ยนบ่อย ★
function findTab(ariaKeyword, textMatch, iconMatch) {
  const tabs = document.querySelectorAll('[role="tab"], button.flow_tab_slider_trigger, [data-radix-collection-item]');
  const allBtns = document.querySelectorAll('button, [role="tab"], [data-radix-collection-item]');

  // ★ PORTRAIT: ค้นหาปุ่ม "9:16" ★
  if (textMatch === 'Portrait') {
    // วิธี 1: role="tab" ที่มี "9:16"
    for (const tab of tabs) {
      if ((tab.textContent?.trim() || '').includes('9:16')) return tab;
    }
    // วิธี 2: ทุก button ที่มี "9:16" (UI ใหม่อาจไม่มี role="tab")
    for (const btn of allBtns) {
      const t = btn.textContent?.trim() || '';
      if (t.includes('9:16') && btn.offsetParent !== null) return btn;
    }
    // วิธี 3: icon crop_9_16
    const icons = document.querySelectorAll('i.google-symbols, span.google-symbols');
    for (const icon of icons) {
      if (icon.textContent?.trim() === 'crop_9_16') {
        const btn = icon.closest('button') || icon.closest('[role="tab"]');
        if (btn) return btn;
      }
    }
    // วิธี 4: ปุ่มสุดท้ายในกลุ่ม aspect ratio
    const ratioButtons = [];
    for (const btn of allBtns) {
      const t = btn.textContent?.trim() || '';
      if (/^\d+:\d+$/.test(t) && btn.offsetParent !== null) ratioButtons.push(btn);
    }
    if (ratioButtons.length >= 4) {
      const last = ratioButtons[ratioButtons.length - 1];
      if (last.textContent?.trim() === '9:16') return last;
    }
    return null;
  }

  // ค้นหา tabs ปกติ (ทั้ง role="tab" และ button ทั่วไป)
  const searchSets = [tabs, allBtns];
  for (const set of searchSets) {
    for (const tab of set) {
      const ariaControls = tab.getAttribute('aria-controls') || '';
      const text = tab.textContent?.trim() || '';
      const icon = tab.querySelector('i.google-symbols');
      const iconText = icon?.textContent?.trim() || '';

      if (ariaKeyword && ariaControls.toUpperCase().includes(ariaKeyword.toUpperCase())) {
        return tab;
      }
      if (textMatch && (text === textMatch || text === iconMatch + textMatch) && tab.offsetParent !== null) {
        return tab;
      }
    }
  }
  return null;
}

// Step 5a-c: Select Image, Portrait, x1 tabs from the dropdown menu
async function selectOptionsFromMenu(dropdownButton) {
  console.log('[TikTok Auto] Step 5: Looking for tabs in dropdown popup...');

  // Debug: Log all tabs and buttons with class flow_tab_slider_trigger
  const allTabs = document.querySelectorAll('[role="tab"], button.flow_tab_slider_trigger, [data-radix-collection-item]');
  console.log('[TikTok Auto] Total tabs found:', allTabs.length);
  allTabs.forEach((item, i) => {
    const ac = item.getAttribute('aria-controls') || 'none';
    console.log(`[TikTok Auto] Tab ${i}: "${item.textContent?.trim().substring(0, 20)}" | aria-controls: ${ac} | class: ${item.className?.substring(0, 30)}`);
  });

  // Step 5a: Select Image
  console.log('[TikTok Auto] Step 5a: Clicking Image tab...');
  showNotification('🖱️ เลือก Image...');

  let imageClicked = false;
  let imageTab = findTab('IMAGE', 'Image', 'image');

  // Fallback: search by class flow_tab_slider_trigger with Image text
  if (!imageTab) {
    const triggers = document.querySelectorAll('button.flow_tab_slider_trigger');
    for (const t of triggers) {
      if ((t.textContent?.trim().includes('Image') || t.textContent?.trim().includes('รูปภาพ')) && !(t.textContent?.trim().includes('Video') || t.textContent?.trim().includes('วิดีโอ'))) {
        imageTab = t;
        break;
      }
    }
  }

  if (imageTab) {
    console.log('[TikTok Auto] Found Image tab, clicking with mouse events:', imageTab);
    await simulateRealClick(imageTab);
    imageClicked = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    console.log('[TikTok Auto] Image tab not found');
    showNotification('⚠️ ไม่พบ Image tab');
  }

  if (imageClicked) {
    console.log('[TikTok Auto] Image selected!');
    showNotification('✅ เลือก Image แล้ว');
  }

  // Step 5b: Select Portrait
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('[TikTok Auto] Step 5b: Clicking Portrait tab...');
  showNotification('🖱️ เลือก Portrait...');

  let portraitClicked = false;
  let portraitTab = findTab('PORTRAIT', 'Portrait', 'crop_9_16');

  if (!portraitTab) {
    const triggers = document.querySelectorAll('button.flow_tab_slider_trigger');
    for (const t of triggers) {
      if (t.textContent?.trim().includes('9:16') || t.textContent?.trim().includes('Portrait') || t.textContent?.trim().includes('แนวตั้ง')) {
        portraitTab = t;
        break;
      }
    }
  }

  if (portraitTab) {
    console.log('[TikTok Auto] Found Portrait tab, clicking with mouse events:', portraitTab);
    await simulateRealClick(portraitTab);
    portraitClicked = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    console.log('[TikTok Auto] Portrait tab not found');
    showNotification('⚠️ ไม่พบ Portrait tab');
  }

  if (portraitClicked) {
    console.log('[TikTok Auto] Portrait selected!');
    showNotification('✅ เลือก Portrait แล้ว');
  }

  // Step 5c: Select x1
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('[TikTok Auto] Step 5c: Clicking x1 tab...');
  showNotification('🖱️ เลือก x1...');

  let x1Clicked = false;

  // Find x1 tab - look for tab with exactly "x1" text
  let x1Tab = null;
  const allTabs2 = document.querySelectorAll('[role="tab"], button.flow_tab_slider_trigger');
  for (const tab of allTabs2) {
    const text = tab.textContent?.trim() || '';
    if (text === 'x1' && tab !== dropdownButton) {
      x1Tab = tab;
      break;
    }
  }

  // Also try aria-controls with -content-1
  if (!x1Tab) {
    for (const tab of allTabs2) {
      const ac = tab.getAttribute('aria-controls') || '';
      if (ac.match(/-content-1$/) && !ac.includes('-content-16')) {
        x1Tab = tab;
        break;
      }
    }
  }

  if (x1Tab) {
    console.log('[TikTok Auto] Found x1 tab, clicking with mouse events:', x1Tab);
    await simulateRealClick(x1Tab);
    x1Clicked = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    console.log('[TikTok Auto] x1 tab not found');
    showNotification('⚠️ ไม่พบ x1 tab');
  }

  if (x1Clicked) {
    console.log('[TikTok Auto] x1 selected!');
    showNotification('✅ เลือก x1 แล้ว');
  }

  console.log('[TikTok Auto] Step 5 completed - Image:', imageClicked, 'Portrait:', portraitClicked, 'x1:', x1Clicked);
  showNotification('✅ Step 5 เสร็จ! Image:' + imageClicked + ' Portrait:' + portraitClicked + ' x1:' + x1Clicked);

  // Continue to Step 6
  await new Promise(resolve => setTimeout(resolve, 6000));
  await retryStep(() => pasteImagePromptToSlate(), 'Step 6: Paste Image Prompt');
}

// Step 6: ดึง Image Prompt จาก currentFlowData แล้วใส่ใน Slate editor
async function pasteImagePromptToSlate() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 6: Pasting Image Prompt to Slate editor...');
  showNotification('📝 กำลังวาง Image Prompt...');

  showNotification('⏳ รอ 6 วินาที (เผื่อเน็ตช้า)...');
  await new Promise(resolve => setTimeout(resolve, 6000));

  // Get Image Prompt from storage
  const result = await chrome.storage.local.get(['currentFlowData']);
  // ★ รองรับทั้ง imagePrompt (Pipeline) และ prompt (Auto 8/16 วิ) ★
  const imagePrompt = result.currentFlowData?.imagePrompt || result.currentFlowData?.prompt;

  console.log('[TikTok Auto] Image Prompt:', imagePrompt?.substring(0, 100) + '...');

  if (!imagePrompt) {
    console.log('[TikTok Auto] No Image Prompt found in flow data');
    showNotification('⚠️ ไม่พบ Image Prompt');
    return false;
  }

  // ★ v3.32: Sanitize prompt ก่อนวาง ★
  const sanitizedPrompt = sanitizePromptForFlow(imagePrompt);

  // ★★★ วิธี MAIN (ลำดับแรกสุด): ใช้ PASTE_TO_SLATE ผ่าน background.js → MAIN world ★★★
  // เข้าถึง Slate Editor instance จริง (Transforms.insertText) → React state อัพเดท → ปุ่ม Generate enable
  try {
    console.log('[TikTok Auto] Step 6: Method MAIN: Sending PASTE_TO_SLATE via background (MAIN world)...');
    showNotification('📝 กำลังวาง Prompt ผ่าน Slate API...');

    await chrome.runtime.sendMessage({ type: 'PASTE_TO_SLATE', promptText: sanitizedPrompt });

    let mainResult = 'pending';
    for (let wait = 0; wait < 16; wait++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        const pasteCheck = await chrome.runtime.sendMessage({ type: 'READ_SLATE_PASTE_RESULT' });
        if (pasteCheck && pasteCheck.status !== 'pending') {
          mainResult = pasteCheck.status;
          console.log('[TikTok Auto] Step 6: MAIN world result:', pasteCheck.status, pasteCheck.method || pasteCheck.message || '');
          break;
        }
      } catch (e) {}
    }

    if (mainResult === 'success') {
      console.log('[TikTok Auto] Step 6: MAIN world (PASTE_TO_SLATE) succeeded!');
      showNotification('✅ วาง Image Prompt สำเร็จ (Slate API)!');

      await new Promise(resolve => setTimeout(resolve, 3000));
      await retryStep(() => clickGenerateButton(), AUTOPOST_STEPS.step6_Generate);
      return true;
    }
    console.log('[TikTok Auto] Step 6: MAIN world failed:', mainResult, '— falling back to DOM methods...');
  } catch (e) {
    console.log('[TikTok Auto] Step 6: MAIN world error:', e.message);
  }

  // ★★★ Fallback: ลองหา TEXTAREA ก่อน (Google Flow อาจเปลี่ยน UI จาก Slate → textarea) ★★★
  let promptTextarea = document.getElementById('PINHOLE_TEXT_AREA_ELEMENT_ID');
  if (!promptTextarea) {
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      const ph = (ta.placeholder || '').toLowerCase();
      if (ph.includes('generate') || ph.includes('describe') || ph.includes('prompt') || ph.includes('image') || ph.includes('video')) {
        promptTextarea = ta;
        break;
      }
    }
  }

  if (promptTextarea) {
    console.log('[TikTok Auto] Step 6: Found TEXTAREA — using textarea method');
    try {
      promptTextarea.focus();
      await new Promise(resolve => setTimeout(resolve, 300));

      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(promptTextarea, sanitizedPrompt);
      } else {
        promptTextarea.value = sanitizedPrompt;
      }

      promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      promptTextarea.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (promptTextarea.value.length > 20) {
        console.log('[TikTok Auto] Step 6: textarea method succeeded!');
        showNotification('✅ วาง Image Prompt สำเร็จ (textarea)!');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await retryStep(() => clickGenerateButton(), AUTOPOST_STEPS.step6_Generate);
        return true;
      }
    } catch (e) {
      console.log('[TikTok Auto] Step 6: textarea method error:', e);
    }
  }

  // ★★★ Fallback DOM methods A-D (เดิม) ★★★
  // Find the Slate editor (textbox with "What do you want to create?")
  let slateEditor = null;

  slateEditor = document.querySelector('[data-slate-editor="true"]');
  if (slateEditor) {
    console.log('[TikTok Auto] Found Slate editor by data-slate-editor:', slateEditor);
  }

  if (!slateEditor) {
    const placeholders = document.querySelectorAll('[data-slate-placeholder="true"]');
    for (const ph of placeholders) {
      if (ph.textContent?.includes('What do you want to create') || ph.textContent?.includes('คุณต้องการสร้างอะไร')) {
        slateEditor = ph.closest('[data-slate-editor="true"]') || ph.closest('[contenteditable="true"]');
        if (slateEditor) {
          console.log('[TikTok Auto] Found Slate editor by placeholder:', slateEditor);
          break;
        }
      }
    }
  }

  if (!slateEditor) {
    const editables = document.querySelectorAll('[contenteditable="true"]');
    for (const el of editables) {
      const text = el.textContent || '';
      if (el.querySelector('[data-slate-node]') || text.includes('What do you want to create') || text.includes('คุณต้องการสร้างอะไร')) {
        slateEditor = el;
        console.log('[TikTok Auto] Found Slate editor by contenteditable:', slateEditor);
        break;
      }
    }
  }

  if (!slateEditor) {
    const paragraphs = document.querySelectorAll('p[data-slate-node="element"]');
    for (const p of paragraphs) {
      slateEditor = p.closest('[data-slate-editor="true"]') || p.closest('[contenteditable="true"]');
      if (slateEditor) {
        console.log('[TikTok Auto] Found Slate editor by paragraph:', slateEditor);
        break;
      }
    }
  }

  if (!slateEditor) {
    console.log('[TikTok Auto] Slate editor not found');
    showNotification('⚠️ ไม่พบ Slate editor');
    try { await navigator.clipboard.writeText(sanitizedPrompt); } catch (e) {}
    showNotification('📋 Prompt อยู่ใน clipboard — กด Ctrl+V');
    return false;
  }

  try {
    slateEditor.focus();
    await new Promise(resolve => setTimeout(resolve, 500));

    const editorRect = slateEditor.getBoundingClientRect();
    slateEditor.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      clientX: editorRect.left + 10,
      clientY: editorRect.top + 10
    }));
    await new Promise(resolve => setTimeout(resolve, 500));

    // Clear existing text
    const existingText = slateEditor.textContent?.trim() || '';
    if (existingText.length > 0 && !existingText.includes('What do you want to create') && !existingText.includes('คุณต้องการสร้างอะไร')) {
      console.log('[TikTok Auto] Clearing existing text in Slate editor:', existingText.substring(0, 50) + '...');
      showNotification('🗑️ ล้าง Prompt เก่า...');
      document.execCommand('selectAll', false, null);
      await new Promise(resolve => setTimeout(resolve, 200));
      document.execCommand('delete', false, null);
      await new Promise(resolve => setTimeout(resolve, 300));
      const afterClear = slateEditor.textContent?.trim() || '';
      if (afterClear.length > 5 && !afterClear.includes('What do you want') && !afterClear.includes('คุณต้องการ')) {
        slateEditor.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 200));
        slateEditor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      console.log('[TikTok Auto] Slate editor cleared, remaining:', slateEditor.textContent?.substring(0, 30));
    }

    const paragraph = slateEditor.querySelector('p[data-slate-node="element"]') || slateEditor.querySelector('[data-slate-node="element"]');

    if (paragraph) {
      const selection = window.getSelection();
      const range = document.createRange();

      let textNode = paragraph;
      while (textNode.firstChild) {
        textNode = textNode.firstChild;
      }

      try {
        range.setStart(textNode, 0);
        range.setEnd(textNode, 0);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        range.selectNodeContents(paragraph);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    let success = false;

    // Method A: Simulate paste with DataTransfer
    console.log('[TikTok Auto] Method A: Simulating paste event with DataTransfer...');
    try {
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', sanitizedPrompt);

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer
      });
      slateEditor.dispatchEvent(pasteEvent);
      await new Promise(resolve => setTimeout(resolve, 500));

      const textA = slateEditor.textContent || '';
      console.log('[TikTok Auto] After paste event, text:', textA.substring(0, 80));
      if (textA.includes(sanitizedPrompt.substring(0, 20))) {
        success = true;
        console.log('[TikTok Auto] Method A succeeded!');
      }
    } catch (e) {
      console.log('[TikTok Auto] Method A error:', e);
    }

    // Method B: beforeinput with insertFromPaste type
    if (!success) {
      console.log('[TikTok Auto] Method B: beforeinput insertFromPaste...');
      const dataTransfer2 = new DataTransfer();
      dataTransfer2.setData('text/plain', sanitizedPrompt);

      const beforeInputEvent = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertFromPaste',
        data: sanitizedPrompt,
        dataTransfer: dataTransfer2
      });
      slateEditor.dispatchEvent(beforeInputEvent);
      await new Promise(resolve => setTimeout(resolve, 500));

      const textB = slateEditor.textContent || '';
      console.log('[TikTok Auto] After beforeinput, text:', textB.substring(0, 80));
      if (textB.includes(sanitizedPrompt.substring(0, 20))) {
        success = true;
        console.log('[TikTok Auto] Method B succeeded!');
      }
    }

    // Method C: execCommand insertText
    if (!success) {
      console.log('[TikTok Auto] Method C: execCommand insertText...');
      slateEditor.focus();
      const inserted = document.execCommand('insertText', false, sanitizedPrompt);
      console.log('[TikTok Auto] execCommand result:', inserted);
      await new Promise(resolve => setTimeout(resolve, 500));

      const textC = slateEditor.textContent || '';
      if (textC.includes(sanitizedPrompt.substring(0, 20))) {
        success = true;
        console.log('[TikTok Auto] Method C succeeded!');
      }
    }

    // Method D: beforeinput insertText
    if (!success) {
      console.log('[TikTok Auto] Method D: beforeinput insertText...');
      const inputEvent = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: sanitizedPrompt
      });
      slateEditor.dispatchEvent(inputEvent);
      await new Promise(resolve => setTimeout(resolve, 500));

      const textD = slateEditor.textContent || '';
      if (textD.includes(sanitizedPrompt.substring(0, 20))) {
        success = true;
        console.log('[TikTok Auto] Method D succeeded!');
      }
    }

    if (!success) {
      console.log('[TikTok Auto] All DOM paste methods failed, will copy to clipboard instead');
    }

    if (success) {
      console.log('[TikTok Auto] Step 6 completed - Image Prompt pasted successfully!');
      showNotification('✅ วาง Image Prompt สำเร็จ!');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await retryStep(() => clickGenerateButton(), AUTOPOST_STEPS.step6_Generate);
      
      return true;
    } else {
      console.log('[TikTok Auto] All methods failed to insert text');
      showNotification('⚠️ วาง Prompt ไม่สำเร็จ - ลอง copy ด้วยมือ');

      try {
        await navigator.clipboard.writeText(sanitizedPrompt);
        showNotification('📋 Copy Prompt ไว้แล้ว - กด Ctrl+V เพื่อวาง');
      } catch (e) {
        console.log('[TikTok Auto] Clipboard copy failed:', e);
      }
      return false;
    }

  } catch (error) {
    console.error('[TikTok Auto] Error pasting prompt:', error);
    showNotification('❌ Error: ' + error.message);
    return false;
  }
}

// Step 7: Click Generate (Create) button and wait for image generation
async function clickGenerateButton() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 7: Clicking Generate button...');
  showNotification('🚀 กำลังกด Generate...');

  showNotification('⏳ รอ 6 วินาที (เผื่อเน็ตช้า)...');
  await new Promise(resolve => setTimeout(resolve, 6000));

  let generateButton = null;

  // Method 1 (PRIORITY): Find button with arrow_forward icon - this is the blue circle Generate button
  const icons = document.querySelectorAll('i.google-symbols');
  for (const icon of icons) {
    const iconText = icon.textContent?.trim();
    if (iconText === 'arrow_forward' || iconText === 'send' || iconText === 'play_arrow') {
      const btn = icon.closest('button');
      // Make sure it's NOT a dialog/popup button and is visible
      if (btn && !btn.getAttribute('aria-haspopup') && btn.offsetParent !== null) {
        generateButton = btn;
        console.log('[TikTok Auto] Found Generate button by icon:', iconText, btn);
        break;
      }
    }
  }

  // Method 2: Find button with hidden "Create" span BUT exclude dialog buttons
  if (!generateButton) {
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      // Skip buttons that open dialogs/popups or are hidden
      if (btn.getAttribute('aria-haspopup') || btn.getAttribute('aria-expanded') || btn.offsetParent === null) continue;

      const hiddenSpan = btn.querySelector('span[hidden]');
      const spanText = hiddenSpan?.textContent?.trim() || '';
      if (spanText === 'Create' || spanText === 'Generate' || spanText === 'สร้าง') {
        generateButton = btn;
        console.log('[TikTok Auto] Found Generate button by hidden span text:', btn);
        break;
      }
    }
  }

  // Method 3: Find by class pattern sc-c70e41ad (exclude dialog buttons)
  if (!generateButton) {
    const candidates = document.querySelectorAll('button[class*="sc-c70e41ad"]');
    for (const btn of candidates) {
      if (!btn.getAttribute('aria-haspopup') && !btn.getAttribute('aria-expanded') && btn.offsetParent !== null) {
        generateButton = btn;
        console.log('[TikTok Auto] Found Generate button by class:', btn);
        break;
      }
    }
  }
  
  // Method 4: Find blue circular button (Generate button is usually blue and circular)
  if (!generateButton) {
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      if (btn.offsetParent === null) continue;
      const style = window.getComputedStyle(btn);
      const bgColor = style.backgroundColor;
      // Check if button has blue-ish background (Generate button is blue)
      if (bgColor.includes('rgb(66, 133, 244)') || bgColor.includes('rgb(26, 115, 232)') || bgColor.includes('rgb(25, 103, 210)')) {
        // Check if it has an icon inside
        const hasIcon = btn.querySelector('i.google-symbols, svg');
        if (hasIcon) {
          generateButton = btn;
          console.log('[TikTok Auto] Found Generate button by blue color:', btn);
          break;
        }
      }
    }
  }
  
  // Method 5: Find by aria-label containing "Generate" or "Create"
  if (!generateButton) {
    generateButton = document.querySelector('button[aria-label*="Generate"], button[aria-label*="Create"], button[aria-label*="generate"], button[aria-label*="create"], button[aria-label*="สร้าง"]');
    if (generateButton && generateButton.offsetParent !== null) {
      console.log('[TikTok Auto] Found Generate button by aria-label:', generateButton);
    } else {
      generateButton = null;
    }
  }

  // Method 6: Find the round button near the prompt input area (usually the Generate button)
  if (!generateButton) {
    const promptArea = document.querySelector('[data-slate-editor="true"]') || document.querySelector('textarea');
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      if (btn.offsetParent === null) continue;
      const rect = btn.getBoundingClientRect();
      if (rect.width > 30 && rect.width < 80 && Math.abs(rect.width - rect.height) < 10) {
        if (promptArea) {
          const pRect = promptArea.getBoundingClientRect();
          if (rect.top > pRect.top - 50 && Math.abs(rect.bottom - pRect.bottom) < 150) {
            generateButton = btn;
            console.log('[TikTok Auto] Found Generate button near prompt area:', btn);
            break;
          }
        } else {
          generateButton = btn;
          console.log('[TikTok Auto] Found Generate button by shape (no prompt area ref):', btn);
          break;
        }
      }
    }
  }

  // Debug: Log what we found
  console.log('[TikTok Auto] Generate button:', generateButton);
  console.log('[TikTok Auto] Has aria-haspopup:', generateButton?.getAttribute('aria-haspopup'));
  console.log('[TikTok Auto] Has aria-expanded:', generateButton?.getAttribute('aria-expanded'));

  if (generateButton) {
    console.log('[TikTok Auto] Clicking Generate button (single-click)...');
    showNotification('🖱️ กด Generate...');

    // ★ PD-INSPIRED: ซ่อน overlay ก่อนคลิก ★
    const hiddenOverlays = hideOverlayForClick();

    // ★ FIX: single-click เท่านั้น — ป้องกัน generate ซ้ำหลายครั้ง ★
    let genClicked = false;
    for (const key of Object.keys(generateButton)) {
      if (key.startsWith('__reactProps') || key.startsWith('__reactFiber')) {
        const props = generateButton[key];
        if (props && typeof props.onClick === 'function') {
          console.log('[TikTok Auto] Generate: Using React onClick');
          props.onClick({ type: 'click', target: generateButton, currentTarget: generateButton, preventDefault() {}, stopPropagation() {} });
          genClicked = true;
          break;
        }
      }
    }
    if (!genClicked) {
      const rect = generateButton.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      generateButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: cx, clientY: cy, pointerId: 1 }));
      await new Promise(r => setTimeout(r, 30));
      generateButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: cx, clientY: cy }));
      await new Promise(r => setTimeout(r, 30));
      generateButton.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: cx, clientY: cy, pointerId: 1 }));
      await new Promise(r => setTimeout(r, 30));
      generateButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: cx, clientY: cy }));
      await new Promise(r => setTimeout(r, 30));
      generateButton.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }));
    }

    // ★ PD-INSPIRED: คืน overlay ★
    await new Promise(r => setTimeout(r, 100));
    showOverlayAfterClick(hiddenOverlays);

    console.log('[TikTok Auto] Generate button clicked (once)!');
    showNotification('✅ กด Generate แล้ว!');

    // ★ Auto Post Flow: รอ Image Generate เสร็จ พร้อม error/crash/progress/smart screen detection ★
    // ★ v2.72: เพิ่ม policy retry — ถ้าติด policy จะกด Generate ใหม่สูงสุด 2 ครั้ง ★
    const IMG_WAIT_MAX = 50; // 50 x 3s = 150s (2.5 นาที)
    const IMG_POLICY_MAX_RETRIES = 2;
    let imgError = false;
    let imgSuccess = false;
    
    for (let policyRetry = 0; policyRetry <= IMG_POLICY_MAX_RETRIES; policyRetry++) {
      if (await isFlowStopped()) return false;
      
      if (policyRetry > 0) {
        console.log(`[TikTok Auto] Step 7: Policy retry ${policyRetry}/${IMG_POLICY_MAX_RETRIES} — re-clicking Generate...`);
        showNotification(`🔄 Policy Retry ${policyRetry}/${IMG_POLICY_MAX_RETRIES} — กด Generate ใหม่...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        // ★ PD-INSPIRED: ลองกดปุ่ม Retry ของ Flow ก่อน ★
        const flowRetryOk = await clickRetryOnFailedCard();
        if (flowRetryOk) {
          console.log(`[TikTok Auto] ✅ Used Flow's native retry button for policy retry`);
          showNotification(`🔄 ใช้ปุ่ม Retry ของ Flow...`);
        } else {
          await simulateRealClick(generateButton);
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      showNotification(`⏳ รอรูป Generate เสร็จ (สูงสุด 2.5 นาที)...${policyRetry > 0 ? ` [retry ${policyRetry}]` : ''}`);
      imgError = false;
      // ★ Smart Screen: Snapshot รูปเก่าก่อน generate เพื่อเปรียบเทียบ ★
      const preGenImages = snapshotCurrentMedia('image');
      console.log(`[TikTok Auto] Step 7: Pre-gen image snapshot: ${preGenImages.size} images`);
      
      for (let iwait = 0; iwait < IMG_WAIT_MAX; iwait++) {
        if (await isFlowStopped()) return false;
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // ★ เช็ค Google labs crash ★
        if (isPageCrashed()) {
          console.log('[TikTok Auto] Step 7: Google labs CRASHED!');
          showNotification('❌ Google labs ล่ม!');
          await notifyFlowFailed('Google labs crashed during image generation');
          return false;
        }
        
        // ★ เช็ค policy violation / failed — ใช้ isGenerationFailed() ที่เข้มกว่า ★
        const failCheck = isGenerationFailed();
        if (failCheck.failed) {
          console.log(`[TikTok Auto] Step 7: Generation FAILED! ${failCheck.reason} — ${failCheck.text}`);
          if (policyRetry < IMG_POLICY_MAX_RETRIES) {
            showNotification(`❌ ${failCheck.reason} — กำลัง retry... (${policyRetry + 1}/${IMG_POLICY_MAX_RETRIES})`);
          } else {
            showNotification(`❌ Image Generation Failed: ${failCheck.reason} — ข้ามไปรายการถัดไป`);
          }
          imgError = true;
          break;
        }
        
        // ★ Smart Screen Check: เช็คว่ามีรูปใหม่ปรากฏแล้วหรือยัง ★
        if (iwait >= 3) { // เริ่มเช็คหลัง 9 วิ
          const imgCheck = isGenerationCompleted(preGenImages, 'image');
          if (imgCheck.completed) {
            console.log(`[TikTok Auto] Step 7: ✅ Smart Screen detected image complete! ${imgCheck.details} (after ${(iwait+1)*3}s)`);
            showNotification(`✅ รูป Generate เสร็จแล้ว! (${imgCheck.details})`);
            imgSuccess = true;
            break;
          }
        }
        
        // ★ เช็ค progress (%) → ยังทำงานอยู่ = ดี ★
        const candidates = document.querySelectorAll('div, span, p');
        let stillGenerating = false;
        for (const el of candidates) {
          const t = el.textContent?.trim() || '';
          if (/^\d{1,3}%$/.test(t) && el.offsetParent !== null) {
            const rect = el.getBoundingClientRect();
            if (rect.width < 200 && rect.height < 80) { stillGenerating = true; break; }
          }
        }
        
        // ★ เช็ครูปใหม่ที่ generate แล้ว ★
        const currentImages = Array.from(document.querySelectorAll('img')).filter(i => i.offsetParent && i.getBoundingClientRect().width > 80);
        const newImages = currentImages.filter(i => !preGenImages.has(i.src) && i.src && !i.src.includes('data:image/svg'));
        if (newImages.length > 0 && iwait >= 5) {
          console.log('[TikTok Auto] Step 7: Generated image detected at ' + ((iwait + 1) * 3) + 's');
          showNotification('✅ รูปใหม่ถูกสร้างแล้ว!');
          imgSuccess = true;
          break;
        }
        
        if (stillGenerating) {
          showNotification(`⏳ Image กำลัง Generate... ${(iwait + 1) * 3} วิ`);
        } else {
          showNotification(`⏳ รอรูป Generate... ${(iwait + 1) * 3} วิ`);
        }
      }
      
      // ★ ถ้า generate สำเร็จ → ออกจาก retry loop ★
      if (imgSuccess) break;
      // ★ ถ้า error แต่ยังมี retry เหลือ → วนรอบถัดไป ★
      if (imgError && policyRetry < IMG_POLICY_MAX_RETRIES) continue;
      // ★ ถ้า error และ retry หมด → fail ★
      if (imgError) break;
    }
    
    if (imgError && !imgSuccess) {
      await notifyFlowFailed('Image generation failed after policy retries');
      return false;
    }
    
    // Step 8: Hover generated image and Add to Prompt
    await retryStep(() => hoverGeneratedImageAndAddToPrompt(), 'Step 8: Hover Generated Image + Add to Prompt');
    
    console.log('[TikTok Auto] Step 7 completed - Generate button clicked!');
    return true;

  } else {
    console.log('[TikTok Auto] Generate button not found');
    showNotification('⚠️ ไม่พบปุ่ม Generate - กรุณากดเอง');
    
    // Log all visible buttons for debugging
    console.log('[TikTok Auto] All visible buttons:');
    document.querySelectorAll('button').forEach((btn, i) => {
      if (btn.offsetParent !== null) {
        console.log(`[TikTok Auto] Button ${i}:`, btn.textContent?.substring(0, 50), btn.className?.substring(0, 50));
      }
    });
  }
}

// Step 8: Hover generated image (first one) and click "Add to Prompt"
async function hoverGeneratedImageAndAddToPrompt() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 8: Hovering generated image and clicking Add to Prompt...');
  showNotification('🖱️ กำลัง Hover รูปแรก...');

  // Wait for generated images to fully render
  showNotification('⏳ รอ 8 วินาที (เผื่อเน็ตช้า)...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Find the first generated/uploaded image (same logic as Step 4)
  let targetImage = null;

  // Method 1: Find image with blob: src
  const allImages = document.querySelectorAll('img');
  console.log('[TikTok Auto] Step 8: Found total images:', allImages.length);

  for (const img of allImages) {
    if (img.src?.startsWith('blob:') && img.offsetParent !== null) {
      targetImage = img;
      console.log('[TikTok Auto] Found blob image:', img.src?.substring(0, 50), 'Size:', img.width, 'x', img.height);
      break;
    }
  }

  // Method 2: Find large visible images (not icons)
  if (!targetImage) {
    for (const img of allImages) {
      if (img.offsetParent !== null && img.width > 80 && img.height > 80) {
        const src = img.src?.toLowerCase() || '';
        const className = img.className?.toLowerCase() || '';
        if (!src.includes('icon') && !src.includes('logo') &&
          !className.includes('icon') && !className.includes('logo')) {
          targetImage = img;
          console.log('[TikTok Auto] Found large image:', img.src?.substring(0, 50), 'Size:', img.width, 'x', img.height);
          break;
        }
      }
    }
  }

  // Method 3: Find image in main content area
  if (!targetImage) {
    const mainContent = document.querySelector('main, [role="main"], .content, [class*="content"]');
    if (mainContent) {
      const img = mainContent.querySelector('img');
      if (img && img.offsetParent !== null && img.width > 50) {
        targetImage = img;
        console.log('[TikTok Auto] Found image in main content:', img);
      }
    }
  }

  if (!targetImage) {
    console.log('[TikTok Auto] No image found to hover');
    showNotification('⚠️ ไม่พบรูปที่จะ hover');
    return false;
  }

  // ★ Save generated image src for 16s Clip 2 reuse ★
  if (targetImage.src) {
    window._lastGeneratedImageSrc = targetImage.src;
    console.log('[TikTok Auto] Step 8: Saved generated image src:', targetImage.src.substring(0, 60));
  }

  // === Hover on image (same as Step 4 which works) ===
  console.log('[TikTok Auto] Hovering on image...');
  showNotification('🖱️ Hover รูป...');

  const rect = targetImage.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Dispatch hover events
  targetImage.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: centerX, clientY: centerY }));
  targetImage.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: centerX, clientY: centerY }));
  targetImage.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: centerX, clientY: centerY }));

  await new Promise(resolve => setTimeout(resolve, 1000));

  // === Right-click to open context menu ===
  console.log('[TikTok Auto] Right-clicking image...');
  showNotification('🖱️ คลิกขวา...');

  const contextMenuEvent = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: centerX,
    clientY: centerY,
    button: 2
  });
  targetImage.dispatchEvent(contextMenuEvent);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // === Find and click "Add to Prompt" button ===
  console.log('[TikTok Auto] Looking for Add to Prompt...');
  showNotification('🔍 กำลังหา Add to Prompt...');

  let addToPromptBtn = null;

  // Method 1: Find by role="menuitem" with "Add to Prompt" text
  const menuItems = document.querySelectorAll('[role="menuitem"], button');
  for (const item of menuItems) {
    const text = item.textContent?.toLowerCase() || '';
    if (text.includes('add to prompt') || text.includes('addtoprompt')) {
      addToPromptBtn = item;
      console.log('[TikTok Auto] Found Add to Prompt button:', item);
      break;
    }
  }

  // Method 2: Find by icon "add" with text
  if (!addToPromptBtn) {
    const addIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of addIcons) {
      if (icon.textContent?.trim().toLowerCase() === 'add') {
        const parent = icon.closest('button, [role="menuitem"]');
        if (parent && parent.textContent?.toLowerCase().includes('prompt')) {
          addToPromptBtn = parent;
          console.log('[TikTok Auto] Found Add to Prompt by icon:', parent);
          break;
        }
      }
    }
  }

  if (addToPromptBtn) {
    console.log('[TikTok Auto] Clicking Add to Prompt...');
    showNotification('🖱️ กด Add to Prompt...');

    addToPromptBtn.click();

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('[TikTok Auto] Step 8 completed - Add to Prompt clicked!');
    showNotification('✅ Add to Prompt เสร็จ!');

    // ★ Auto Post Flow: เรียก Step 9 ต่อ ★
    await new Promise(resolve => setTimeout(resolve, 3000));
    await retryStep(() => pasteVideoPrompt8ToSlate(), AUTOPOST_STEPS.step9_PasteVideoPrompt);
    
    return true;

  } else {
    console.log('[TikTok Auto] Add to Prompt button not found after right-click');
    showNotification('⚠️ ไม่พบ Add to Prompt - ลอง hover อีกครั้ง');

    // Retry: hover again with more delay, then right-click
    targetImage.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: centerX, clientY: centerY }));
    targetImage.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: centerX, clientY: centerY }));
    targetImage.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: centerX, clientY: centerY }));

    // Also try hovering parent (the card/container)
    let parent = targetImage.parentElement;
    for (let i = 0; i < 5 && parent; i++) {
      parent.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: centerX, clientY: centerY }));
      parent.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: centerX, clientY: centerY }));
      parent.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: centerX, clientY: centerY }));
      parent = parent.parentElement;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try right-click again
    targetImage.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true,
      clientX: centerX, clientY: centerY, button: 2
    }));

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Search again
    const retryItems = document.querySelectorAll('[role="menuitem"], button');
    for (const item of retryItems) {
      const text = item.textContent?.toLowerCase() || '';
      if (text.includes('add to prompt') || text.includes('addtoprompt')) {
        console.log('[TikTok Auto] Found Add to Prompt on retry:', item);
        item.click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        showNotification('✅ Add to Prompt เสร็จ!');

        // ★ Auto Post Flow: เรียก Step 9 ต่อ ★
        await new Promise(resolve => setTimeout(resolve, 3000));
        await retryStep(() => pasteVideoPrompt8ToSlate(), AUTOPOST_STEPS.step9_PasteVideoPrompt);
        
        return true;
      }
    }

    showNotification('⚠️ ไม่พบ Add to Prompt');
    return false;
  }
}

// Step 9: Get videoPrompt8 from flowData and paste to Slate editor
async function pasteVideoPrompt8ToSlate() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 9: Pasting Video Prompt 8s to Slate editor...');
  showNotification('📝 กำลังวาง Video Prompt 8 วิ...');

  showNotification('⏳ รอ 8 วินาที (เผื่อเน็ตช้า)...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Get Video Prompt 8s from storage
  const result = await chrome.storage.local.get(['currentFlowData']);
  // ★ รองรับทั้ง videoPrompt8s (Pipeline) และ videoPrompt8 (Auto 8/16 วิ) ★
  let videoPrompt8 = result.currentFlowData?.videoPrompt8s || result.currentFlowData?.videoPrompt8;

  // ★ v3.23 FIX: ถ้าเป็น JSON string → parse เอา prompt_text ออกมา ★
  if (videoPrompt8 && videoPrompt8.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(videoPrompt8);
      videoPrompt8 = parsed.prompt_text || videoPrompt8;
      console.log('[TikTok Auto] Parsed JSON → extracted prompt_text for 8s');
    } catch (e) { /* ไม่ใช่ JSON — ใช้ค่าเดิม */ }
  }

  console.log('[TikTok Auto] Video Prompt 8s:', videoPrompt8?.substring(0, 100) + '...');

  if (!videoPrompt8) {
    console.log('[TikTok Auto] No Video Prompt 8s found in flow data');
    showNotification('⚠️ ไม่พบ Video Prompt 8 วิ');
    return false;
  }

  // ★ v3.32: Sanitize prompt ก่อนวาง ★
  videoPrompt8 = sanitizePromptForFlow(videoPrompt8);

  // ★★★ วิธี MAIN (ลำดับแรกสุด): ใช้ PASTE_TO_SLATE ผ่าน background.js → MAIN world ★★★
  try {
    console.log('[TikTok Auto] Step 9: Method MAIN: Sending PASTE_TO_SLATE via background (MAIN world)...');
    showNotification('📝 กำลังวาง Video Prompt 8s ผ่าน Slate API...');

    await chrome.runtime.sendMessage({ type: 'PASTE_TO_SLATE', promptText: videoPrompt8 });

    let mainResult = 'pending';
    for (let wait = 0; wait < 16; wait++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        const pasteCheck = await chrome.runtime.sendMessage({ type: 'READ_SLATE_PASTE_RESULT' });
        if (pasteCheck && pasteCheck.status !== 'pending') {
          mainResult = pasteCheck.status;
          console.log('[TikTok Auto] Step 9: MAIN world result:', pasteCheck.status, pasteCheck.method || pasteCheck.message || '');
          break;
        }
      } catch (e) {}
    }

    if (mainResult === 'success') {
      console.log('[TikTok Auto] Step 9: MAIN world (PASTE_TO_SLATE) succeeded!');
      showNotification('✅ วาง Video Prompt 8 วิ สำเร็จ (Slate API)!');

      await new Promise(resolve => setTimeout(resolve, 3000));
      await retryStep(() => selectVideoAndFrames(), AUTOPOST_STEPS.step10_SelectVideo);
      return true;
    }
    console.log('[TikTok Auto] Step 9: MAIN world failed:', mainResult, '— falling back to DOM methods...');
  } catch (e) {
    console.log('[TikTok Auto] Step 9: MAIN world error:', e.message);
  }

  // ★★★ Fallback DOM methods ★★★
  let slateEditor = null;

  slateEditor = document.querySelector('[data-slate-editor="true"]');
  if (!slateEditor) {
    const editables = document.querySelectorAll('[contenteditable="true"]');
    for (const el of editables) {
      if (el.querySelector('[data-slate-node]')) {
        slateEditor = el;
        break;
      }
    }
  }
  if (!slateEditor) {
    const paragraphs = document.querySelectorAll('p[data-slate-node="element"]');
    for (const p of paragraphs) {
      slateEditor = p.closest('[data-slate-editor="true"]') || p.closest('[contenteditable="true"]');
      if (slateEditor) break;
    }
  }

  if (!slateEditor) {
    console.log('[TikTok Auto] Slate editor not found for video prompt');
    showNotification('⚠️ ไม่พบ Slate editor');
    try { await navigator.clipboard.writeText(videoPrompt8); } catch (e) {}
    showNotification('📋 Prompt อยู่ใน clipboard — กด Ctrl+V');
    return false;
  }

  try {
    for (let focusTry = 0; focusTry < 3; focusTry++) {
      slateEditor.focus();
      await new Promise(resolve => setTimeout(resolve, 300));
      if (document.activeElement === slateEditor || slateEditor.contains(document.activeElement)) break;
      const editorRect = slateEditor.getBoundingClientRect();
      slateEditor.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: editorRect.left + 10, clientY: editorRect.top + 10 }));
      slateEditor.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: editorRect.left + 10, clientY: editorRect.top + 10 }));
      slateEditor.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: editorRect.left + 10, clientY: editorRect.top + 10 }));
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      slateEditor.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 300));
      slateEditor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('[TikTok Auto] Cleared editor with Ctrl+A + Backspace');
    } catch (e) {
      console.log('[TikTok Auto] Clear editor error (non-fatal):', e);
    }

    let success = false;
    const checkText = videoPrompt8.substring(0, 20);

    // Method A: beforeinput insertText
    console.log('[TikTok Auto] Method A: beforeinput insertText...');
    try {
      slateEditor.focus();
      await new Promise(resolve => setTimeout(resolve, 300));
      slateEditor.dispatchEvent(new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: videoPrompt8
      }));
      await new Promise(resolve => setTimeout(resolve, 800));

      const textA = slateEditor.textContent || '';
      if (textA.includes(checkText)) {
        success = true;
        console.log('[TikTok Auto] Method A succeeded!');
      }
    } catch (e) {
      console.log('[TikTok Auto] Method A error:', e);
    }

    // Method B: execCommand insertText
    if (!success) {
      console.log('[TikTok Auto] Method B: execCommand insertText...');
      try {
        slateEditor.focus();
        await new Promise(resolve => setTimeout(resolve, 300));
        document.execCommand('selectAll', false);
        await new Promise(resolve => setTimeout(resolve, 200));
        document.execCommand('delete', false);
        await new Promise(resolve => setTimeout(resolve, 300));
        document.execCommand('insertText', false, videoPrompt8);
        await new Promise(resolve => setTimeout(resolve, 800));

        const textB = slateEditor.textContent || '';
        if (textB.includes(checkText)) {
          success = true;
          console.log('[TikTok Auto] Method B succeeded!');
        }
      } catch (e) {
        console.log('[TikTok Auto] Method B error:', e);
      }
    }

    // Method C: Direct textContent + input event (last resort)
    if (!success) {
      console.log('[TikTok Auto] Method C: Direct textContent...');
      try {
        const leaf = slateEditor.querySelector('[data-slate-leaf="true"]');
        const textEl = leaf ? leaf.querySelector('[data-slate-string="true"]') || leaf.firstChild : null;
        if (textEl) {
          textEl.textContent = videoPrompt8;
        } else {
          const p = slateEditor.querySelector('p[data-slate-node="element"]') || slateEditor.querySelector('[data-slate-node="element"]');
          if (p) p.textContent = videoPrompt8;
          else slateEditor.textContent = videoPrompt8;
        }
        slateEditor.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 800));

        const textC = slateEditor.textContent || '';
        if (textC.includes(checkText)) {
          success = true;
          console.log('[TikTok Auto] Method C succeeded!');
        }
      } catch (e) {
        console.log('[TikTok Auto] Method C error:', e);
      }
    }

    if (success) {
      console.log('[TikTok Auto] Step 9 completed - Video Prompt 8s pasted successfully!');
      showNotification('✅ วาง Video Prompt 8 วิ สำเร็จ!');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await retryStep(() => selectVideoAndFrames(), AUTOPOST_STEPS.step10_SelectVideo);
      
      return true;
    } else {
      console.log('[TikTok Auto] All methods failed for video prompt');
      showNotification('⚠️ วาง Video Prompt ไม่สำเร็จ');
      try {
        await navigator.clipboard.writeText(videoPrompt8);
        showNotification('📋 Copy Video Prompt ไว้แล้ว - กด Ctrl+V เพื่อวาง');
      } catch (e) {
        console.log('[TikTok Auto] Clipboard copy failed:', e);
      }
      return false;
    }

  } catch (error) {
    console.error('[TikTok Auto] Error pasting video prompt:', error);
    showNotification('❌ Error: ' + error.message);
    return false;
  }
}

// Step 10: Click dropdown Nano Banana Pro → Change Image to Video → Select Frames
async function selectVideoAndFrames() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 10: Clicking dropdown to select Video + Frames...');
  showNotification('🎬 กำลังเปลี่ยนเป็น Video + Frames...');

  showNotification('⏳ รอ 4 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 4000));

  // Find the Nano Banana Pro dropdown button (same as Step 5)
  let dropdownButton = null;
  const allButtons = document.querySelectorAll('button');

  // Method 1: Find by emoji 🍌 + Nano
  for (const btn of allButtons) {
    const text = btn.textContent || '';
    if (text.includes('🍌') && text.includes('Nano')) {
      dropdownButton = btn;
      console.log('[TikTok Auto] Found dropdown by emoji:', btn);
      break;
    }
  }

  // Method 2: Find by aria-haspopup="menu" with Banana text
  if (!dropdownButton) {
    for (const btn of allButtons) {
      if (btn.getAttribute('aria-haspopup') === 'menu') {
        const text = btn.textContent || '';
        if (text.includes('Banana') || text.includes('Nano')) {
          dropdownButton = btn;
          console.log('[TikTok Auto] Found dropdown by aria-haspopup:', btn);
          break;
        }
      }
    }
  }

  // Method 3: Find by crop icon
  if (!dropdownButton) {
    const cropIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of cropIcons) {
      if (icon.textContent?.trim()?.startsWith('crop_')) {
        dropdownButton = icon.closest('button[aria-haspopup="menu"]') || icon.closest('button');
        if (dropdownButton) {
          console.log('[TikTok Auto] Found dropdown by crop icon:', dropdownButton);
          break;
        }
      }
    }
  }

  if (!dropdownButton) {
    console.log('[TikTok Auto] Dropdown button not found for Step 10');
    showNotification('⚠️ ไม่พบ dropdown button');
    return false;
  }

  // Click dropdown with mouse events (same as Step 5)
  console.log('[TikTok Auto] Clicking dropdown...');
  showNotification('🖱️ กด dropdown...');

  const rect = dropdownButton.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  dropdownButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: centerX, clientY: centerY }));
  await new Promise(resolve => setTimeout(resolve, 50));
  dropdownButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: centerX, clientY: centerY }));
  await new Promise(resolve => setTimeout(resolve, 50));
  dropdownButton.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: centerX, clientY: centerY }));
  await new Promise(resolve => setTimeout(resolve, 50));
  dropdownButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: centerX, clientY: centerY }));
  await new Promise(resolve => setTimeout(resolve, 50));
  dropdownButton.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: centerX, clientY: centerY }));

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check if opened
  const isOpen = dropdownButton.getAttribute('aria-expanded') === 'true' ||
    dropdownButton.getAttribute('data-state') === 'open';
  console.log('[TikTok Auto] Dropdown opened:', isOpen);

  if (!isOpen) {
    dropdownButton.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Step 10a: Select "Video" tab using simulateRealClick
  console.log('[TikTok Auto] Step 10a: Looking for Video tab...');
  showNotification('🎬 เลือก Video...');

  let videoClicked = false;
  let videoTab = findTab('-content-VIDEO', 'Video', 'videocam');

  // Exclude VIDEO_FRAMES match - re-check
  if (videoTab) {
    const ac = videoTab.getAttribute('aria-controls') || '';
    if (ac.includes('VIDEO_FRAMES')) {
      videoTab = null;
    }
  }

  // Fallback: search by class flow_tab_slider_trigger with Video text
  if (!videoTab) {
    const triggers = document.querySelectorAll('button.flow_tab_slider_trigger, [role="tab"]');
    for (const t of triggers) {
      const text = t.textContent?.trim() || '';
      const ac = t.getAttribute('aria-controls') || '';
      if ((text.includes('Video') && !text.includes('Nano') && text.length < 20) ||
        (ac.includes('-content-VIDEO') && !ac.includes('VIDEO_FRAMES'))) {
        videoTab = t;
        break;
      }
    }
  }

  if (videoTab) {
    console.log('[TikTok Auto] Found Video tab, clicking with mouse events:', videoTab);
    await simulateRealClick(videoTab);
    videoClicked = true;
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  if (videoClicked) {
    console.log('[TikTok Auto] Video selected!');
    showNotification('✅ เลือก Video แล้ว!');
  } else {
    console.log('[TikTok Auto] Video tab not found');
    showNotification('⚠️ ไม่พบ Video tab');
  }

  // Step 10b: Select "Frames" tab using simulateRealClick
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('[TikTok Auto] Step 10b: Looking for Frames tab...');
  showNotification('🖼️ เลือก Frames...');

  let framesClicked = false;
  let framesTab = findTab('VIDEO_FRAMES', 'Frames', 'crop_free');

  if (!framesTab) {
    const triggers = document.querySelectorAll('button.flow_tab_slider_trigger, [role="tab"]');
    for (const t of triggers) {
      const text = t.textContent?.trim() || '';
      if ((text.includes('Frames') || text.includes('เฟรม')) && text.length < 20) {
        framesTab = t;
        break;
      }
    }
  }

  if (framesTab) {
    console.log('[TikTok Auto] Found Frames tab, clicking with mouse events:', framesTab);
    await simulateRealClick(framesTab);
    framesClicked = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (framesClicked) {
    console.log('[TikTok Auto] Frames selected!');
    showNotification('✅ เลือก Frames แล้ว!');
  } else {
    console.log('[TikTok Auto] Frames tab not found');
    showNotification('⚠️ ไม่พบ Frames tab');
  }

  // ★ Step 10c: Click arrow_drop_down dropdown and select video model ★
  // ★ PD-INSPIRED: ใช้ model ที่ user เลือก แทน hardcode Veo 3.1 Fast ★
  await new Promise(resolve => setTimeout(resolve, 1000));

  const flowDataVeo = currentFlowData || {};
  const requestedVideoModel = flowDataVeo.flowVideoModel || 'auto';
  const VIDEO_MODEL_TEXT_MAP = {
    'veo_fast': ['veo 3.1', 'fast'],
    'veo_quality': ['veo 3.1', 'quality'],
    'veo_lite': ['veo 2', 'lite'],
    'veo_lite_lower': ['veo 2', 'lite', 'lower'],
    'veo_fast_lower': ['veo 3.1', 'fast', 'lower']
  };
  const veoSearchTexts = VIDEO_MODEL_TEXT_MAP[requestedVideoModel] || VIDEO_MODEL_TEXT_MAP['veo_fast_lower'];
  const veoModelLabel = requestedVideoModel !== 'auto' ? requestedVideoModel.replace(/_/g, ' ') : 'Veo 3.1 Fast';

  console.log(`[TikTok Auto] Step 10c: Looking for Veo dropdown — model: ${veoModelLabel}...`);
  showNotification(`🎬 กำลังเลือก ${veoModelLabel}...`);

  let veoDropdownClicked = false;
  let veoDropdown = null;

  // Method 1: Find button/element with arrow_drop_down icon
  const dropdownIcons = document.querySelectorAll('i.google-symbols');
  for (const icon of dropdownIcons) {
    if (icon.textContent?.trim() === 'arrow_drop_down') {
      veoDropdown = icon.closest('button') || icon.closest('[aria-haspopup]') || icon.parentElement;
      if (veoDropdown) {
        console.log('[TikTok Auto] Found Veo dropdown by arrow_drop_down icon:', veoDropdown);
        break;
      }
    }
  }

  // Method 2: Find by class pattern sc-a0dcecfb with arrow_drop_down
  if (!veoDropdown) {
    const candidates = document.querySelectorAll('[class*="sc-a0dcecfb"]');
    for (const el of candidates) {
      const icon = el.querySelector('i.google-symbols');
      if (icon && icon.textContent?.trim() === 'arrow_drop_down') {
        veoDropdown = el.closest('button') || el;
        console.log('[TikTok Auto] Found Veo dropdown by class:', veoDropdown);
        break;
      }
    }
  }

  if (veoDropdown) {
    console.log('[TikTok Auto] Clicking Veo dropdown...');
    await simulateRealClick(veoDropdown);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // ★ PD-INSPIRED: เลือก model ตามที่ user ตั้งค่า ★
    let veoOptionFound = false;
    const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], [data-radix-collection-item], span, div');
    
    for (const item of menuItems) {
      const text = (item.textContent?.trim() || '').toLowerCase();
      if (!text || text.length > 100) continue;
      const matchesAll = veoSearchTexts.every(s => text.includes(s.toLowerCase()));
      if (matchesAll) {
        console.log(`[TikTok Auto] Found ${veoModelLabel} option:`, text);
        showNotification(`🖱️ กด ${veoModelLabel}...`);
        
        const clickTarget = item.closest('[role="menuitem"]') || item.closest('[role="option"]') || item.closest('button') || item;
        await simulateRealClick(clickTarget);
        veoOptionFound = true;
        veoDropdownClicked = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      }
    }

    if (veoOptionFound) {
      console.log(`[TikTok Auto] ${veoModelLabel} selected!`);
      showNotification(`✅ เลือก ${veoModelLabel} แล้ว!`);
    } else {
      console.log(`[TikTok Auto] ${veoModelLabel} option not found in menu`);
      showNotification(`⚠️ ไม่พบ ${veoModelLabel} ในเมนู`);
    }
  } else {
    console.log('[TikTok Auto] Veo dropdown (arrow_drop_down) not found');
    showNotification('⚠️ ไม่พบ Veo dropdown');
  }

  console.log('[TikTok Auto] Step 10 completed - Video:', videoClicked, 'Frames:', framesClicked, 'Veo:', veoDropdownClicked);
  showNotification('✅ Step 10 เสร็จ! Video:' + videoClicked + ' Frames:' + framesClicked + ' Veo:' + veoDropdownClicked);

  // Step 10d: Click Generate button (arrow_forward)
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('[TikTok Auto] Step 10d: Clicking Generate button...');
  showNotification('🚀 กด Generate...');

  let genButton = null;

  // Method 1: Find by arrow_forward icon (exclude dialog buttons)
  const genIcons = document.querySelectorAll('i.google-symbols');
  for (const icon of genIcons) {
    if (icon.textContent?.trim() === 'arrow_forward') {
      const btn = icon.closest('button');
      if (btn && !btn.getAttribute('aria-haspopup')) {
        genButton = btn;
        console.log('[TikTok Auto] Found Generate button by arrow_forward:', btn);
        break;
      }
    }
  }

  // Method 2: Find by class sc-c70e41ad
  if (!genButton) {
    const candidates = document.querySelectorAll('button[class*="sc-c70e41ad"]');
    for (const btn of candidates) {
      if (!btn.getAttribute('aria-haspopup') && !btn.getAttribute('aria-expanded')) {
        genButton = btn;
        console.log('[TikTok Auto] Found Generate button by class:', btn);
        break;
      }
    }
  }

  if (genButton) {
    const gRect = genButton.getBoundingClientRect();
    const gCenterX = gRect.left + gRect.width / 2;
    const gCenterY = gRect.top + gRect.height / 2;

    genButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: gCenterX, clientY: gCenterY }));
    await new Promise(resolve => setTimeout(resolve, 50));
    genButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: gCenterX, clientY: gCenterY }));
    await new Promise(resolve => setTimeout(resolve, 50));
    genButton.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: gCenterX, clientY: gCenterY }));
    await new Promise(resolve => setTimeout(resolve, 50));
    genButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: gCenterX, clientY: gCenterY }));
    await new Promise(resolve => setTimeout(resolve, 50));
    genButton.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: gCenterX, clientY: gCenterY }));

    console.log('[TikTok Auto] Generate button clicked!');
    showNotification('✅ กด Generate แล้ว!');

    // ★ Auto Post Flow: รอ Video Generate พร้อม crash/error detection (แทน hardcode 90 วิ) ★
    showNotification('⏳ รอ Video Generate (สูงสุด 3 นาที)...');
    const VID_WAIT_MAX = 60; // 60 x 3s = 180s (3 นาที)
    let vidGenError = false;
    
    for (let vwait = 0; vwait < VID_WAIT_MAX; vwait++) {
      if (await isFlowStopped()) return false;
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // ★ เช็ค Google labs crash (ใช้ isPageCrashed ที่แก้แล้ว) ★
      if (isPageCrashed()) {
        console.log('[TikTok Auto] Step 10: Google labs CRASHED during video gen!');
        showNotification('❌ Google labs ล่ม!');
        await notifyFlowFailed('Google labs crashed during video generation');
        return false;
      }
      
      // ★ เช็ค policy violation / failed (เฉพาะหลัง 30 วิ เพื่อไม่จับ error เก่า) ★
      if (vwait >= 10) {
        // ★ ถ้ามี progress % = generation กำลังทำงาน → ข้ามเช็ค error ★
        const vCheckPage = document.body?.innerText || '';
        const vCheckProgress = vCheckPage.match(/(\d{1,3})%/);
        const vHasProgress = vCheckProgress && parseInt(vCheckProgress[1]) > 0 && parseInt(vCheckProgress[1]) <= 100;

        if (!vHasProgress) {
          const vErrorEls = document.querySelectorAll('[role="alert"], [class*="toast"], [class*="snackbar"], div, section');
          let vHasError = false;
          for (const el of vErrorEls) {
            if (el.offsetParent === null) continue;
            const rect = el.getBoundingClientRect();
            if (rect.width > 800 && rect.height > 400) continue;
            const t = el.textContent?.trim() || '';
            if (t.length < 5 || t.length > 300) continue;
            const tLower = t.toLowerCase();
            if (tLower.includes('failed') && (tLower.includes('violat') || tLower.includes('policies') || tLower.includes('try a different'))) {
              console.log('[TikTok Auto] Step 10: Found "Failed" card:', t.substring(0, 80));
              vHasError = true; break;
            }
            if (tLower.includes('audio generation failed')) { vHasError = true; break; }
          }
          if (vHasError) {
            console.log('[TikTok Auto] Step 10: Video generation error detected!');
            showNotification('❌ Video Generation ล้มเหลว — ข้ามไปรายการถัดไป');
            vidGenError = true;
            break;
          }
        }
      }
      
      // ★ เช็คว่ามี video element ใหม่แล้วหรือยัง → break ออกเร็ว ★
      if (vwait >= 15) {
        const vids = document.querySelectorAll('video');
        for (const v of vids) {
          if (v.offsetParent !== null && (v.src?.startsWith('blob:') || v.src?.includes('storage.google'))) {
            console.log('[TikTok Auto] Step 10: Video detected early at ' + ((vwait + 1) * 3) + 's');
            showNotification('✅ Video ถูกสร้างแล้ว!');
            vwait = VID_WAIT_MAX; // break outer loop
            break;
          }
        }
      }
      
      // ★ เช็ค progress (%) ★
      let vProgress = '';
      const vCandidates = document.querySelectorAll('div, span, p');
      for (const el of vCandidates) {
        const t = el.textContent?.trim() || '';
        if (/^\d{1,3}%$/.test(t) && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          if (rect.width < 200 && rect.height < 80) { vProgress = t; break; }
        }
      }
      
      if (vProgress) {
        showNotification(`⏳ Video กำลัง Generate... ${vProgress} (${(vwait + 1) * 3} วิ)`);
      } else {
        showNotification(`⏳ รอ Video Generate... ${(vwait + 1) * 3} วิ`);
      }
    }
    
    if (vidGenError) {
      await notifyFlowFailed('Video generation failed/policy violation');
      return false;
    }
    
    await retryStep(() => waitForVideo8sAndSave(), 'Step 11: Wait for Video 8s');
    
    console.log('[TikTok Auto] Step 10 completed - Generate button clicked!');
    return true;
  } else {
    console.log('[TikTok Auto] Generate button not found');
    showNotification('⚠️ ไม่พบปุ่ม Generate');
    return false;
  }
}

// Step 11: Wait for Video 8s generation (up to 3 minutes) and save video blob
async function waitForVideo8sAndSave() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 11: Waiting for Video 8s generation...');
  showNotification('⏳ Step 11: รอ Video 8 วิ Generate...');

  let videoBlobUrl = null;
  let videoElement = null;

  // Find video element with blob/https src
  const findVideo = () => {
    const videos = document.querySelectorAll('video');
    if (videos.length > 0) {
      console.log(`[TikTok Auto] Step 11: Found ${videos.length} video elements`);
    }

    for (const video of videos) {
      const src = video.src || video.currentSrc || '';

      if (src.startsWith('blob:')) {
        return { url: src, element: video, type: 'blob' };
      }
      if (src.includes('storage.googleapis.com') || src.includes('storage.google')) {
        return { url: src, element: video, type: 'google_storage' };
      }

      const sources = video.querySelectorAll('source');
      for (const source of sources) {
        const sourceSrc = source.src || '';
        if (sourceSrc.startsWith('blob:') || sourceSrc.includes('storage.googleapis.com')) {
          return { url: sourceSrc, element: video, type: 'source' };
        }
      }

      if (src.startsWith('https://') && video.duration > 0) {
        return { url: src, element: video, type: 'https' };
      }
    }
    return null;
  };

  // Wait for video to be ready
  const waitForVideoReady = async (videoEl, maxWaitMs = 30000) => {
    return new Promise((resolve) => {
      if (videoEl.readyState >= 2) {
        resolve(true);
        return;
      }
      const timeout = setTimeout(() => resolve(false), maxWaitMs);
      const onReady = () => { clearTimeout(timeout); resolve(true); };
      videoEl.addEventListener('loadeddata', onReady, { once: true });
      videoEl.addEventListener('canplay', onReady, { once: true });
      videoEl.load();
    });
  };

  // Check for download button (indicates video is ready)
  const checkDownloadButton = () => {
    const buttons = document.querySelectorAll('button, [role="button"]');
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      if (text.includes('download') || ariaLabel.includes('download') || text.includes('ดาวน์โหลด') || ariaLabel.includes('ดาวน์โหลด')) {
        return true;
      }
    }
    return false;
  };

  // Check for error messages (ครอบคลุม "Failed", "Audio generation failed", "violate our policies" ฯลฯ)
  const checkForErrors = () => {
    // ★ ถ้ามี progress % = generation กำลังทำงาน → ไม่ใช่ error ★
    const pageText = document.body?.innerText || '';
    const progressMatch = pageText.match(/(\d{1,3})%/);
    if (progressMatch) {
      const pct = parseInt(progressMatch[1]);
      if (pct > 0 && pct <= 100) return false;
    }

    // ★ หา "Failed" card element จริงๆ — ตรวจ element ขนาดเล็ก (card/toast) เท่านั้น ★
    const candidates = document.querySelectorAll('[role="alert"], [class*="toast"], [class*="snackbar"], div, section');
    for (const el of candidates) {
      if (el.offsetParent === null) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 800 && rect.height > 400) continue;
      const t = el.textContent?.trim() || '';
      if (t.length < 5 || t.length > 300) continue;
      const tLower = t.toLowerCase();
      if (tLower.includes('failed') && (tLower.includes('violat') || tLower.includes('policies') || tLower.includes('please try') || tLower.includes('try a different'))) {
        console.log('[TikTok Auto] Step 11: checkForErrors — Found "Failed" card:', t.substring(0, 80));
        return true;
      }
      if (tLower.includes('audio generation failed')) {
        console.log('[TikTok Auto] Step 11: checkForErrors — Audio generation failed');
        return true;
      }
      if (tLower.includes('something went wrong') && el.matches('[role="alert"], [class*="toast"], [class*="snackbar"]')) {
        console.log('[TikTok Auto] Step 11: checkForErrors — "something went wrong" in alert');
        return true;
      }
    }
    return false;
  };

  // Wait up to 3 minutes (180 seconds)
  const MAX_ATTEMPTS = 180;
  let downloadButtonFound = false;
  let errorDetected = false;
  // ★ Smart Screen: Snapshot video/download ก่อน generate ★
  const preGenVideoSrcs = snapshotCurrentMedia('video');
  console.log(`[TikTok Auto] Step 11: Pre-gen video snapshot: ${preGenVideoSrcs.size} items`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (await isFlowStopped()) return;
    // ★ Crash check ★
    if (isPageCrashed()) {
      console.log('[TikTok Auto] Step 11: Page CRASHED during video wait!');
      await notifyFlowFailed('Page crashed during video 8s generation');
      return;
    }
    // ★ Failed / Policy violation check — เช็คทุก 5 วิตั้งแต่ attempt 20 (ให้ generate มีเวลาเริ่ม) ★
    if (attempt > 20 && attempt % 5 === 0) {
      const failCheck = isGenerationFailed();
      if (failCheck.failed) {
        console.log(`[TikTok Auto] Step 11: Generation FAILED! Reason: ${failCheck.reason} — ${failCheck.text}`);
        showNotification(`❌ Generation Failed: ${failCheck.reason} — ข้ามรายการนี้`);
        await notifyFlowFailed(`Generation failed: ${failCheck.reason} - ${failCheck.text}`);
        return;
      }
    }
    // ★ Smart Screen Check: detect video/download button ปรากฏ (log เท่านั้น — findVideo จะ handle จริง) ★
    if (attempt > 10 && attempt % 5 === 0) {
      const vidCheck = isGenerationCompleted(preGenVideoSrcs, 'video');
      if (vidCheck.completed) {
        console.log(`[TikTok Auto] Step 11: Smart Screen: ${vidCheck.details} (attempt ${attempt})`);
        showNotification(`✅ Smart Screen: Video พร้อม! (${vidCheck.details})`);
      }
    }

    showNotification(`⏳ รอ Video 8 วิ Generate... (${attempt}/${MAX_ATTEMPTS} วิ)`);

    if (attempt % 15 === 0 || attempt <= 3) {
      console.log(`[TikTok Auto] Step 11: Checking for video... Attempt ${attempt}/${MAX_ATTEMPTS}`);
    }

    // Check for errors every 10 attempts (after 30s) — ให้เวลา generate พอสมควรก่อนเช็ค
    if (attempt > 30 && attempt % 10 === 0) {
      if (checkForErrors()) {
        console.log('[TikTok Auto] Step 11: Error detected!');
        showNotification('❌ พบ Error จาก Google API — ข้ามรายการนี้');
        errorDetected = true;
        break;
      }
    }

    // Hover elements to reveal video
    const elements = document.querySelectorAll('img, video, [class*="result"], [class*="output"]');
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, view: window }));
      }
    }

    const videoResult = findVideo();
    if (videoResult) {
      videoBlobUrl = videoResult.url;
      videoElement = videoResult.element;
      console.log('[TikTok Auto] Step 11: Found video!', videoBlobUrl);
      break;
    }

    // Check download button as fallback
    if (!downloadButtonFound && checkDownloadButton()) {
      downloadButtonFound = true;
      console.log('[TikTok Auto] Step 11: Download button found, waiting for blob...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      const retryResult = findVideo();
      if (retryResult) {
        videoBlobUrl = retryResult.url;
        videoElement = retryResult.element;
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Handle error
  if (errorDetected) {
    console.log('[TikTok Auto] Step 11: Skipping due to error');
    showNotification('⏭️ ข้ามรายการนี้เนื่องจาก Error');
    await notifyFlowFailed('Video 8s generation failed');
    return;
  }

  if (videoBlobUrl) {
    console.log('[TikTok Auto] Step 11: Saving video 8s...');
    showNotification('💾 กำลังบันทึก Video (8 วิ)...');

    // Wait for video to be ready
    if (videoElement && videoElement.readyState < 2) {
      showNotification('⏳ รอ Video โหลดเสร็จ...');
      await waitForVideoReady(videoElement, 30000);
    }

    // ★ Fetch video data พร้อม retry (แก้ ERR_QUIC_PROTOCOL_ERROR) ★
    let blob = null;
    const FETCH_MAX_RETRIES = 3;
    for (let fetchAttempt = 1; fetchAttempt <= FETCH_MAX_RETRIES; fetchAttempt++) {
      try {
        showNotification(`📥 ดาวน์โหลด Video... (${fetchAttempt}/${FETCH_MAX_RETRIES})`);
        console.log(`[TikTok Auto] Step 11: Fetch attempt ${fetchAttempt}/${FETCH_MAX_RETRIES} — ${videoBlobUrl.substring(0, 80)}`);
        
        // รอก่อน retry เพื่อให้ QUIC protocol recover
        if (fetchAttempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        const response = await fetch(videoBlobUrl);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        
        blob = await response.blob();
        if (blob.size < 1000) throw new Error(`Blob too small: ${blob.size} bytes`);
        
        console.log(`[TikTok Auto] Step 11: Fetch OK! blob size: ${blob.size}`);
        break; // สำเร็จ
      } catch (fetchError) {
        console.error(`[TikTok Auto] Step 11: Fetch attempt ${fetchAttempt} failed:`, fetchError.message);
        if (fetchAttempt === FETCH_MAX_RETRIES) {
          console.log('[TikTok Auto] Step 11: All fetch attempts failed, trying download button fallback...');
        }
      }
    }
    
    // ★ Fallback: ถ้า fetch ไม่ได้ ให้กดปุ่ม Download ของ Google Flow แทน ★
    if (!blob) {
      showNotification('🔄 ใช้ปุ่ม Download ของ Google Flow แทน...');
      console.log('[TikTok Auto] Step 11: Trying Google Flow download button fallback...');
      
      const downloadBtn = [...document.querySelectorAll('button, [role="button"]')].find(btn => {
        const text = (btn.textContent || '').toLowerCase();
        const label = (btn.getAttribute('aria-label') || '').toLowerCase();
        return text.includes('download') || label.includes('download') || text.includes('ดาวน์โหลด') || label.includes('ดาวน์โหลด');
      });
      
      if (downloadBtn) {
        console.log('[TikTok Auto] Step 11: Found download button, clicking...');
        downloadBtn.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        showNotification('✅ กดปุ่ม Download แล้ว — ใช้ไฟล์จาก Downloads');
        
        // เซฟ status แล้วไป TikTok ถึงแม้ไม่ได้ blob
        const flowData2 = await getSafeFlowData();
        const originalClipDuration2 = await getTargetClipDuration();
        
        await chrome.storage.local.set({
          currentFlowData: {
            ...flowData2,
            videoBlob: null,
            videoBlobUrl: videoBlobUrl,
            videoDuration: 8,
            videoSize: 0,
            videoSavedAt: new Date().toISOString(),
            clipDuration: originalClipDuration2,
            downloadedViaButton: true
          },
          flowStatus: 'video_saved_8s',
          flowMessage: 'Video 8 วินาที — ดาวน์โหลดผ่านปุ่ม Download'
        });
        
        // ★ FIX: เช็ค clipDuration — ถ้า 16 วิ ต้อง extend ต่อ ไม่ใช่ไป TikTok ★
        if (originalClipDuration2 === 16) {
          console.log('[TikTok Auto] Step 11: Download fallback BUT clipDuration=16 → entering Extend...');
          showNotification('🎞️ 16 วิ mode — Scene Builder Extend...');
          await new Promise(resolve => setTimeout(resolve, 4000));
          await extendViaSceneBuilder();
        } else {
          console.log('[TikTok Auto] Step 11: Download button fallback → going to TikTok');
          showNotification('🔗 เปิด TikTok Upload...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          window.location.href = 'https://www.tiktok.com/tiktokstudio/upload';
        }
        return;
      }
      
      // ★ ถ้าไม่มีปุ่ม Download ด้วย → throw error เพื่อให้ retryStep ทำงาน ★
      throw new Error('ดาวน์โหลด Video ไม่ได้ (ERR_QUIC_PROTOCOL_ERROR) และไม่พบปุ่ม Download');
    }

    // === Fetch สำเร็จ — ดำเนินการเซฟ blob ปกติ ===
    console.log('[TikTok Auto] Step 11: Video blob size:', blob.size);
    const videoDuration = videoElement?.duration || 8;

    // Convert to base64
    const reader = new FileReader();
    const base64Data = await new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Save to storage — เก็บ clipDuration เดิมจาก flowData + backup (ห้าม hardcode!)
    const flowData = await getSafeFlowData();
    const originalClipDuration = await getTargetClipDuration();

    await chrome.storage.local.set({
      currentFlowData: {
        ...flowData,
        videoBlob: base64Data,
        videoBlobUrl: videoBlobUrl,
        videoDuration: videoDuration,
        videoSize: blob.size,
        videoSavedAt: new Date().toISOString(),
        clipDuration: originalClipDuration
      },
      flowStatus: 'video_saved_8s',
      flowMessage: 'Video 8 วินาที บันทึกแล้ว'
    });

    console.log('[TikTok Auto] Step 11 completed! Video 8s saved! Target duration:', originalClipDuration);
    showNotification(`✅ Step 11 เสร็จ! บันทึก Video 8 วิ แล้ว! (target: ${originalClipDuration} วิ)`);

    // Check clipDuration: 8 วิ → ดาวน์โหลด+ไป TikTok, 16 วิ → extend ต่อ
    const targetDuration = originalClipDuration;

    if (targetDuration === 8) {
      // === 8 วิ: ดาวน์โหลดแล้วไป TikTok เลย ===
      console.log('[TikTok Auto] 8 วิ mode → Download + Open TikTok');
      showNotification('📥 8 วิ — ดาวน์โหลดวีดีโอ...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await retryStep(() => downloadVideoAndOpenTikTok(base64Data, blob.size), 'Step 12: Download + Open TikTok');
    } else {
      // === 16 วิ: เข้า Scene Builder Extend (PD-Style) ===
      console.log('[TikTok Auto] 16 วิ mode → Scene Builder Extend...');
      await new Promise(resolve => setTimeout(resolve, 4000));
      await extendViaSceneBuilder();
    }

  } else {
    // ★ ไม่พบ Video → throw error ให้ retryStep retry ทั้ง step ★
    console.log('[TikTok Auto] Step 11: Video not found after 3 minutes');
    showNotification('⚠️ ไม่พบ Video หลังจากรอ 3 นาที');
    throw new Error('ไม่พบ Video element หลังจากรอ 3 นาที');
  }
}

// =====================================================================
// ★★★ NEW 16s FLOW: Scene Builder Extend (PD-Inspired) ★★★
// แทนที่ Edit View Extend → ใช้ Scene Builder timeline: + → Extend → Generate → Export
// =====================================================================

// ★ Scene Builder: Navigate to Scene Builder page ★
async function sb_navigateToSceneBuilder() {
  console.log('[16s-SB] Navigating to Scene Builder...');
  showNotification('🎬 กำลังเข้า Scene Builder...');

  // Method 1: หา tab/button ที่มีคำว่า "Scene" / "Scene builder"
  const navItems = document.querySelectorAll('button, [role="tab"], [role="button"], a, nav button, nav a');
  for (const item of navItems) {
    if (item.offsetParent === null) continue;
    const txt = (item.textContent || '').trim().toLowerCase();
    const ariaLabel = (item.getAttribute('aria-label') || '').toLowerCase();
    if (txt.includes('scene') || ariaLabel.includes('scene') || txt.includes('filmstrip')) {
      console.log('[16s-SB] Found Scene Builder nav item:', txt);
      await simulateRealClick(item);
      await new Promise(r => setTimeout(r, 2000));
      if (sb_isInSceneBuilder()) return true;
    }
  }

  // Method 2: หาจาก menu items
  const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"]');
  for (const item of menuItems) {
    const txt = (item.textContent || '').trim().toLowerCase();
    if (txt.includes('scene') && item.offsetParent !== null) {
      console.log('[16s-SB] Found Scene Builder menu item:', txt);
      await simulateRealClick(item);
      await new Promise(r => setTimeout(r, 2000));
      if (sb_isInSceneBuilder()) return true;
    }
  }

  // Method 3: หาจาก icon + text
  const icons = document.querySelectorAll('i.google-symbols, i.material-icons');
  for (const icon of icons) {
    const iconTxt = (icon.textContent || '').trim().toLowerCase();
    if (iconTxt === 'movie_creation' || iconTxt === 'filmstrip' || iconTxt === 'stacked_bar_chart' || iconTxt === 'view_timeline') {
      const btn = icon.closest('button, [role="tab"], [role="button"], a');
      if (btn && btn.offsetParent !== null) {
        console.log('[16s-SB] Found Scene Builder icon button:', iconTxt);
        await simulateRealClick(btn);
        await new Promise(r => setTimeout(r, 2000));
        if (sb_isInSceneBuilder()) return true;
      }
    }
  }

  // Method 4: URL-based — ถ้ามี scene builder URL pattern
  const currentUrl = window.location.href;
  if (currentUrl.includes('/scene') || currentUrl.includes('/builder')) {
    console.log('[16s-SB] Already in Scene Builder URL');
    return true;
  }

  console.log('[16s-SB] Could not find Scene Builder navigation');
  return false;
}

// ★ Check if we're currently in Scene Builder ★
function sb_isInSceneBuilder() {
  const url = window.location.href.toLowerCase();
  if (url.includes('scene') || url.includes('builder') || url.includes('timeline')) return true;
  
  const bodyText = document.body?.innerText?.toLowerCase() || '';
  const hasTimeline = document.querySelector('[class*="timeline"], [class*="Timeline"], [class*="scene-builder"], [class*="SceneBuilder"]');
  const hasDurationText = /\d+:\d+\s*\/\s*\d+:\d+/.test(bodyText);
  const hasPlusBtn = sb_findPlusButton();
  
  return !!(hasTimeline || hasDurationText || hasPlusBtn);
}

// ★ Parse total seconds from Scene Builder timeline (e.g., "0:08 / 0:16") ★
function sb_getTotalSeconds() {
  const bodyText = document.body?.innerText || '';
  const match = bodyText.match(/(\d+):(\d+)\s*\/\s*(\d+):(\d+)/);
  if (match) {
    const currentMin = parseInt(match[1]);
    const currentSec = parseInt(match[2]);
    const totalMin = parseInt(match[3]);
    const totalSec = parseInt(match[4]);
    const current = currentMin * 60 + currentSec;
    const total = totalMin * 60 + totalSec;
    console.log(`[16s-SB] Duration: ${match[0]} → current: ${current}s, total: ${total}s`);
    return { current, total, text: match[0] };
  }
  return null;
}

// ★ Count clips in Scene Builder ★
function sb_countClips() {
  const dur = sb_getTotalSeconds();
  if (dur && dur.total > 0) {
    const clipCount = Math.round(dur.total / 8);
    console.log(`[16s-SB] Estimated clip count from duration: ${clipCount} (${dur.total}s / 8s)`);
    return clipCount;
  }
  
  const clipElements = document.querySelectorAll('[class*="clip"], [class*="Clip"], [class*="segment"], [class*="Segment"]');
  const visible = [...clipElements].filter(el => el.offsetParent !== null && el.getBoundingClientRect().width > 30);
  if (visible.length > 0) {
    console.log(`[16s-SB] Clip elements found: ${visible.length}`);
    return visible.length;
  }
  
  return 0;
}

// ★ Find the "+" button in the Scene Builder timeline ★
function sb_findPlusButton() {
  // Method 1: data-testid (PD uses PINHOLE_ADD_CLIP_CARD)
  const testIdBtn = document.querySelector('[data-testid*="ADD_CLIP"], [data-testid*="add_clip"], [data-testid*="PINHOLE"]');
  if (testIdBtn && testIdBtn.offsetParent !== null) return testIdBtn;

  // Method 2: button/role="button" ที่มี "+" text หรือ "add" icon
  const btns = document.querySelectorAll('button, [role="button"]');
  for (const btn of btns) {
    if (btn.offsetParent === null) continue;
    const txt = (btn.textContent || '').trim();
    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
    
    if (txt === '+' || txt === 'add' || ariaLabel.includes('add clip') || ariaLabel.includes('add scene')) {
      const rect = btn.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) return btn;
    }
    
    const icon = btn.querySelector('i.google-symbols, i.material-icons');
    if (icon) {
      const iconTxt = (icon.textContent || '').trim().toLowerCase();
      if (iconTxt === 'add' || iconTxt === 'add_circle' || iconTxt === 'add_2' || iconTxt === 'playlist_add') {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 10 && rect.height > 10) return btn;
      }
    }

    if (btn.innerHTML?.includes('>add<') || btn.innerHTML?.includes('>add_2<')) {
      return btn;
    }
  }

  // Method 3: wildcard — element ที่ text เป็น "+" แน่นอน + visible
  const allEls = document.querySelectorAll('div, span, i');
  for (const el of allEls) {
    if (el.children.length > 0) continue;
    if (el.textContent?.trim() === '+' && el.offsetParent !== null) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10 && rect.top > window.innerHeight * 0.3) {
        const clickable = el.closest('button, [role="button"]') || el;
        return clickable;
      }
    }
  }

  return null;
}

// ★ Click "+" button in timeline ★
async function sb_clickPlusInTimeline() {
  console.log('[16s-SB] Looking for + button in timeline...');
  showNotification('➕ หาปุ่ม + ใน timeline...');

  // ★ DEBUG: Log all buttons on page ★
  const allBtns = document.querySelectorAll('button, [role="button"]');
  console.log(`[16s-SB] DEBUG: Total buttons on page: ${allBtns.length}`);
  let dbgCount = 0;
  for (const btn of allBtns) {
    if (btn.offsetParent === null) continue;
    const rect = btn.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 5) continue;
    const txt = (btn.textContent || '').trim().substring(0, 40);
    const ariaLabel = btn.getAttribute('aria-label') || '';
    const testId = btn.getAttribute('data-testid') || '';
    const innerHTML = (btn.innerHTML || '').substring(0, 80);
    console.log(`[16s-SB] DEBUG btn[${dbgCount}]: text="${txt}" aria="${ariaLabel}" testid="${testId}" ${Math.round(rect.left)}x${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)} inner="${innerHTML}"`);
    dbgCount++;
    if (dbgCount > 40) break;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const plusBtn = sb_findPlusButton();
    if (plusBtn) {
      console.log('[16s-SB] Found + button:', plusBtn.tagName, (plusBtn.className || '').substring(0, 50), 'testid:', plusBtn.getAttribute('data-testid'));
      plusBtn.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise(r => setTimeout(r, 500));
      
      // Hide overlay before click
      hideOverlayForClick();
      await simulateRealClick(plusBtn);
      showOverlayAfterClick();
      
      console.log('[16s-SB] Clicked + button');
      await new Promise(r => setTimeout(r, 2000));
      return true;
    }
    await new Promise(r => setTimeout(r, 1000));
    if (attempt % 3 === 2) showNotification(`⏳ หาปุ่ม + (${attempt + 1}/10)...`);
  }

  console.log('[16s-SB] + button not found after 10 attempts');
  return false;
}

// ★ Select "Extend" from the dropdown menu after clicking "+" ★
async function sb_selectExtendOption() {
  console.log('[16s-SB] Looking for "Extend" option in menu...');
  showNotification('🎬 เลือก Extend...');

  for (let attempt = 0; attempt < 10; attempt++) {
    // ★ DEBUG: Log ทุก visible menu item / option / button ที่เห็น ★
    const allVisible = document.querySelectorAll('[role="option"], [role="menuitem"], [role="menuitemradio"], [role="listbox"] *, [role="menu"] *, [class*="popup"] *, [class*="popover"] *, [class*="dropdown"] *, [class*="overlay"] *');
    if (attempt === 0 || attempt === 3) {
      console.log('[16s-SB] DEBUG: Scanning visible items after + click...');
      const debugItems = document.querySelectorAll('*');
      let debugCount = 0;
      for (const el of debugItems) {
        if (el.offsetParent === null) continue;
        const txt = (el.textContent || '').trim();
        const role = el.getAttribute('role') || '';
        const tag = el.tagName.toLowerCase();
        if (txt.length > 0 && txt.length < 50 && (role === 'option' || role === 'menuitem' || role === 'menuitemradio' || role === 'button' || tag === 'button' || tag === 'li')) {
          console.log(`[16s-SB] DEBUG item[${debugCount}]: role="${role}" tag=${tag} text="${txt}" class="${(el.className || '').toString().substring(0, 60)}"`);
          debugCount++;
          if (debugCount > 30) break;
        }
      }
      if (debugCount === 0) {
        console.log('[16s-SB] DEBUG: No menu items found at all — menu may not have opened');
      }
    }

    // ★ Search for Extend option with broad matching ★
    const extendKeywords = ['extend', 'ต่อ', 'ขยาย', 'continue', 'ต่อวิดีโอ', 'extend video', 'extend clip', 'add extension'];
    const items = document.querySelectorAll('[role="option"], [role="menuitem"], [role="menuitemradio"], button, li, div[role="button"], span[role="button"], a');
    
    for (const item of items) {
      if (item.offsetParent === null) continue;
      const rect = item.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 10) continue;
      
      const txt = (item.textContent || '').trim().toLowerCase();
      const ariaLabel = (item.getAttribute('aria-label') || '').toLowerCase();
      const dataValue = (item.getAttribute('data-value') || '').toLowerCase();
      
      for (const kw of extendKeywords) {
        if (txt === kw || txt.includes(kw) || ariaLabel.includes(kw) || dataValue.includes(kw)) {
          console.log(`[16s-SB] Found "Extend" match: text="${txt}" keyword="${kw}" role="${item.getAttribute('role')}" tag=${item.tagName}`);
          await simulateRealClick(item);
          await new Promise(r => setTimeout(r, 2000));
          return true;
        }
      }
    }

    // ★ Alternative: ถ้ากด + แล้วเปิด Extend UI โดยตรง (ไม่มี dropdown) ★
    // ตรวจว่ามี Slate editor / textarea / prompt field โผล่มาเลย
    const slate = document.querySelector('[data-slate-editor="true"]');
    const textarea = document.querySelector('textarea[placeholder]');
    const placeholder = document.querySelector('[data-slate-placeholder]');
    if (slate || textarea || placeholder) {
      const phText = (placeholder?.textContent || slate?.getAttribute('placeholder') || textarea?.placeholder || '').toLowerCase();
      if (phText.includes('what happens') || phText.includes('next') || phText.includes('extend') || 
          phText.includes('describe') || phText.includes('prompt') || phText.length < 5) {
        console.log('[16s-SB] + button opened extend prompt directly (no dropdown needed)! placeholder:', phText);
        showNotification('✅ Extend UI เปิดแล้ว (direct)!');
        return true;
      }
    }

    // ★ Alternative: ถ้าปุ่ม + เปิด popup/modal ให้เลือกประเภท ★
    const popups = document.querySelectorAll('[class*="popup"], [class*="modal"], [class*="dialog"], [class*="overlay"], [class*="Popover"], [class*="Menu"]');
    for (const popup of popups) {
      if (popup.offsetParent === null) continue;
      const popupText = (popup.textContent || '').toLowerCase();
      for (const kw of extendKeywords) {
        if (popupText.includes(kw)) {
          // หา clickable element ข้างใน popup ที่มี extend keyword
          const clickables = popup.querySelectorAll('button, [role="button"], [role="option"], [role="menuitem"], li, a, div[tabindex], span[tabindex]');
          for (const cl of clickables) {
            const clTxt = (cl.textContent || '').trim().toLowerCase();
            if (clTxt.includes(kw) && cl.offsetParent !== null) {
              console.log(`[16s-SB] Found extend in popup: "${clTxt}"`);
              await simulateRealClick(cl);
              await new Promise(r => setTimeout(r, 2000));
              return true;
            }
          }
        }
      }
    }

    // รอ 1.5 วิ แล้วลองอีก
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 1500));
    } else if (attempt === 4) {
      // ลอง re-click + button
      console.log('[16s-SB] Re-clicking + button...');
      const plusBtn = sb_findPlusButton();
      if (plusBtn) {
        await simulateRealClick(plusBtn);
        await new Promise(r => setTimeout(r, 2000));
      }
    } else {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('[16s-SB] "Extend" option not found after all attempts');
  return false;
}

// ★ Fill extend prompt in the prompt field ★
async function sb_fillExtendPrompt(promptText) {
  console.log('[16s-SB] Filling extend prompt... length:', promptText?.length);
  showNotification('📝 วาง Extend Prompt...');

  if (!promptText) {
    console.log('[16s-SB] No prompt text provided');
    return false;
  }

  // Method 1: Slate editor (primary — Google Flow ใช้ Slate)
  const slate = document.querySelector('[data-slate-editor="true"]');
  if (slate) {
    console.log('[16s-SB] Found Slate editor — using PASTE_TO_SLATE');
    try {
      await chrome.runtime.sendMessage({ type: 'PASTE_TO_SLATE', promptText: promptText });
      await new Promise(r => setTimeout(r, 2000));
      
      let pasteOk = false;
      for (let p = 0; p < 8; p++) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const result = await chrome.runtime.sendMessage({ type: 'READ_SLATE_PASTE_RESULT' });
          if (result?.status === 'success') { pasteOk = true; break; }
          if (result?.status !== 'pending') break;
        } catch (e) {}
      }
      
      if (pasteOk) {
        console.log('[16s-SB] Slate paste successful!');
        return true;
      }
    } catch (e) {
      console.log('[16s-SB] PASTE_TO_SLATE error:', e);
    }
  }

  // Method 2: textarea
  const textareas = document.querySelectorAll('textarea');
  for (const ta of textareas) {
    if (ta.offsetParent === null) continue;
    const rect = ta.getBoundingClientRect();
    if (rect.width > 100 && rect.height > 30) {
      console.log('[16s-SB] Found textarea — filling...');
      ta.focus();
      ta.value = promptText;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
      
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(ta, promptText);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
      await new Promise(r => setTimeout(r, 1000));
      return true;
    }
  }

  // Method 3: contenteditable
  const editables = document.querySelectorAll('[contenteditable="true"]');
  for (const el of editables) {
    if (el.offsetParent === null) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > 100) {
      console.log('[16s-SB] Found contenteditable — filling...');
      el.focus();
      el.textContent = promptText;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 1000));
      return true;
    }
  }

  // Fallback: clipboard
  console.log('[16s-SB] No input field found — copying to clipboard');
  try { await navigator.clipboard.writeText(promptText); } catch (e) {}
  showNotification('📋 Prompt อยู่ใน clipboard — กด Ctrl+V');
  await new Promise(r => setTimeout(r, 5000));
  return true;
}

// ★ Click Generate button in extend view ★
async function sb_clickExtendGenerate() {
  console.log('[16s-SB] Clicking Generate button...');
  showNotification('🚀 กด Generate...');

  // ส่ง Enter ผ่าน MAIN world ก่อน (trigger Slate onChange → enable Generate)
  try {
    await chrome.runtime.sendMessage({ type: 'PRESS_ENTER_SLATE' });
  } catch (e) {}
  await new Promise(r => setTimeout(r, 2000));

  // หาปุ่ม Generate
  const findBtn = () => {
    // icon arrow_forward
    for (const icon of document.querySelectorAll('i.google-symbols, i.material-icons, i')) {
      const t = (icon.textContent || '').trim().toLowerCase();
      if (t === 'arrow_forward' || t === 'send') {
        const btn = icon.closest('button');
        if (btn && btn.offsetParent !== null && !btn.getAttribute('aria-haspopup')) return btn;
      }
    }
    // class-based
    for (const btn of document.querySelectorAll('button[class*="sc-c70e41ad"]')) {
      if (!btn.getAttribute('aria-haspopup')) return btn;
    }
    // text "Generate"
    for (const btn of document.querySelectorAll('button')) {
      const t = (btn.textContent || '').trim().toLowerCase();
      if ((t === 'generate' || t.includes('สร้าง')) && btn.offsetParent !== null) return btn;
    }
    return null;
  };

  for (let attempt = 0; attempt < 10; attempt++) {
    const btn = findBtn();
    if (btn) {
      btn.disabled = false;
      btn.removeAttribute('disabled');
      await simulateRealClick(btn);
      
      const reactKeys = Object.keys(btn);
      for (const key of reactKeys) {
        if (key.startsWith('__reactProps')) {
          const props = btn[key];
          if (props?.onClick) {
            props.onClick({ type: 'click', target: btn, currentTarget: btn, preventDefault() {}, stopPropagation() {} });
          }
        }
      }
      
      console.log('[16s-SB] Generate button clicked!');
      showNotification('✅ กด Generate แล้ว!');
      return true;
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('[16s-SB] Generate button not found');
  return false;
}

// ★ Wait for Clip 2 to appear in Scene Builder ★
async function sb_waitForClip2() {
  console.log('[16s-SB] Waiting for Clip 2 in Scene Builder...');
  showNotification('⏳ รอ Clip 2 Generate...');

  const startClipCount = sb_countClips();
  const startTime = Date.now();
  const MAX_WAIT_MS = 5 * 60 * 1000; // 5 นาที

  // Snapshot internal state
  const preState = await readFlowInternalState();
  console.log(`[16s-SB] Pre-generate state — clips: ${preState.clipCount}, failed: ${preState.failedCount}`);

  for (let attempt = 1; attempt <= 300; attempt++) {
    if (await isFlowStopped()) return false;
    if (Date.now() - startTime > MAX_WAIT_MS) {
      console.log('[16s-SB] Timeout waiting for Clip 2');
      return false;
    }

    // Check 1: Duration text เปลี่ยน
    const dur = sb_getTotalSeconds();
    if (dur && dur.total >= 14) {
      console.log(`[16s-SB] ✅ Duration reached ${dur.total}s — Clip 2 done!`);
      showNotification(`✅ Clip 2 สำเร็จ! Duration: ${dur.text}`);
      return true;
    }

    // Check 2: Clip count เพิ่ม
    const currentClips = sb_countClips();
    if (currentClips > startClipCount && currentClips >= 2) {
      console.log(`[16s-SB] ✅ Clip count increased: ${startClipCount} → ${currentClips}`);
      showNotification(`✅ Clip 2 สำเร็จ! (${currentClips} clips)`);
      return true;
    }

    // Check 3: Internal state
    if (attempt % 10 === 0 && preState.hasData) {
      const curState = await readFlowInternalState();
      if (curState.hasData) {
        const newClips = curState.clipCount - preState.clipCount;
        const newFailed = curState.failedCount - preState.failedCount;
        console.log(`[16s-SB] Internal: clips +${newClips}, failed +${newFailed}, generating: ${curState.generatingCount}`);
        
        if (newClips > 0 && curState.generatingCount === 0) {
          console.log('[16s-SB] ✅ New clip via internal state!');
          return true;
        }
        if (newFailed > 0 && curState.generatingCount === 0) {
          console.log('[16s-SB] ❌ Failed via internal state');
          // ลอง retry ด้วย native retry button
          const retried = await clickRetryOnFailedCard();
          if (retried) {
            console.log('[16s-SB] Native retry clicked — continue waiting');
            continue;
          }
          return false;
        }
      }
    }

    // Check 4: Page crash
    if (isPageCrashed()) {
      console.log('[16s-SB] Page crashed!');
      return false;
    }

    // Check 5: Generation failed (policy)
    if (attempt > 10 && attempt % 5 === 0) {
      const failCheck = isGenerationFailed();
      if (failCheck.failed) {
        console.log(`[16s-SB] Generation failed: ${failCheck.reason}`);
        const retried = await clickRetryOnFailedCard();
        if (!retried) return false;
        console.log('[16s-SB] Retried via native button — continue waiting');
      }
    }

    // Progress
    if (attempt % 15 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const pageText = document.body?.innerText || '';
      const pctMatch = pageText.match(/(\d{1,3})%/);
      const pctStr = pctMatch ? ` (${pctMatch[1]}%)` : '';
      showNotification(`⏳ รอ Clip 2... ${elapsed} วิ${pctStr}`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  return false;
}

// ★ Export video from Scene Builder ★
async function sb_exportAndDownload() {
  console.log('[16s-SB] Exporting video from Scene Builder...');
  showNotification('📥 กำลัง Export Video...');

  // ★ ลบ failed clips ก่อน export ★
  await deleteFailedClipInScenebuilder();
  await new Promise(r => setTimeout(r, 1000));

  // Reset video capture
  try { await chrome.runtime.sendMessage({ type: 'RESET_VIDEO_CAPTURE' }); } catch (e) {}

  // ★ หาและกดปุ่ม Export ★
  const findExportBtn = () => {
    const allBtns = document.querySelectorAll('button, [role="button"]');
    for (const btn of allBtns) {
      if (btn.offsetParent === null) continue;
      const txt = (btn.textContent || '').trim().toLowerCase();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      if (txt === 'export' || txt.includes('export') || ariaLabel.includes('export') || 
          txt === 'ส่งออก' || txt.includes('ส่งออก')) {
        return btn;
      }
      const icon = btn.querySelector('i.google-symbols, i.material-icons');
      if (icon && (icon.textContent?.trim() === 'file_download' || icon.textContent?.trim() === 'download')) {
        if (txt.includes('export') || ariaLabel.includes('export')) return btn;
      }
    }
    return null;
  };

  // ลอง Export สูงสุด 3 ครั้ง
  for (let exportAttempt = 0; exportAttempt < 3; exportAttempt++) {
    const exportBtn = findExportBtn();
    if (!exportBtn) {
      console.log('[16s-SB] Export button not found, attempt', exportAttempt);
      if (exportAttempt < 2) {
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }
      // Fallback: ลอง Download menu แทน
      console.log('[16s-SB] Falling back to Download button');
      return await sb_fallbackDownload();
    }

    console.log('[16s-SB] Clicking Export button (attempt', exportAttempt + 1, ')');
    await simulateRealClick(exportBtn);
    await new Promise(r => setTimeout(r, 3000));

    // ★ รอ Export เสร็จ — ดูจาก progress, toast, download link ★
    const exportOk = await sb_waitForExportComplete();
    if (exportOk) {
      console.log('[16s-SB] ✅ Export completed!');
      return true;
    }

    console.log('[16s-SB] Export attempt', exportAttempt + 1, 'failed');
  }

  // ลอง fallback download
  return await sb_fallbackDownload();
}

// ★ Wait for export to complete ★
async function sb_waitForExportComplete() {
  console.log('[16s-SB] Waiting for export to complete...');
  const startTime = Date.now();
  const MAX_WAIT = 120000; // 2 นาที

  for (let i = 0; i < 120; i++) {
    if (Date.now() - startTime > MAX_WAIT) break;

    // Check 1: Intercepted blob (from intercept-blob.js)
    try {
      const result = await chrome.runtime.sendMessage({ type: 'READ_CAPTURED_BLOB' });
      if (result?.status === 'success' && result.base64) {
        console.log('[16s-SB] ✅ Captured export blob! Size:', result.size);
        await sb_saveVideoToStorage(result.base64, result.size);
        return true;
      }
    } catch (e) {}

    // Check 2: Download completed (FETCH_VIDEO_BLOB)
    try {
      const result = await chrome.runtime.sendMessage({ type: 'FETCH_VIDEO_BLOB' });
      if (result?.status === 'success' && result.base64) {
        console.log('[16s-SB] ✅ Downloaded export video! Size:', result.size);
        await sb_saveVideoToStorage(result.base64, result.size);
        return true;
      }
    } catch (e) {}

    // Check 3: "Export complete" / "Download ready" text
    const bodyText = (document.body?.innerText || '').toLowerCase();
    if (bodyText.includes('export complete') || bodyText.includes('download ready') || 
        bodyText.includes('ส่งออกเสร็จ')) {
      console.log('[16s-SB] Export complete text detected');
      await new Promise(r => setTimeout(r, 2000));
      
      // ลอง fetch video จากหน้า
      const videoResult = await sb_fetchVideoFromPage();
      if (videoResult) {
        await sb_saveVideoToStorage(videoResult.base64, videoResult.size);
        return true;
      }
    }

    if (i % 10 === 0) {
      showNotification(`⏳ รอ Export... ${Math.round((Date.now() - startTime) / 1000)} วิ`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  // Last resort: fetch from video element
  const videoResult = await sb_fetchVideoFromPage();
  if (videoResult) {
    await sb_saveVideoToStorage(videoResult.base64, videoResult.size);
    return true;
  }

  return false;
}

// ★ Fallback: ใช้ Download button (เหมือนวิธีเดิม) ★
async function sb_fallbackDownload() {
  console.log('[16s-SB] Trying fallback Download...');
  
  const dlBtns = document.querySelectorAll('button[aria-haspopup="menu"], button');
  for (const btn of dlBtns) {
    if (btn.offsetParent === null) continue;
    const txt = (btn.textContent || '').toLowerCase();
    if (txt.includes('download') || txt.includes('ดาวน์โหลด')) {
      await simulateRealClick(btn);
      await new Promise(r => setTimeout(r, 2000));
      
      // กด Full Video → 720p
      const menuItems = document.querySelectorAll('[role="menuitem"], button');
      for (const item of menuItems) {
        if (/full\s*video/i.test(item.textContent || '')) {
          await simulateRealClick(item);
          await new Promise(r => setTimeout(r, 2000));
          break;
        }
      }
      const resItems = document.querySelectorAll('[role="menuitem"], button');
      for (const item of resItems) {
        if ((item.textContent || '').includes('720')) {
          await simulateRealClick(item);
          break;
        }
      }
      
      // รอ download
      await new Promise(r => setTimeout(r, 30000));
      
      // ลอง capture
      try {
        const result = await chrome.runtime.sendMessage({ type: 'READ_CAPTURED_BLOB' });
        if (result?.status === 'success' && result.base64) {
          await sb_saveVideoToStorage(result.base64, result.size);
          return true;
        }
      } catch (e) {}
      
      try {
        const result = await chrome.runtime.sendMessage({ type: 'FETCH_VIDEO_BLOB' });
        if (result?.status === 'success' && result.base64) {
          await sb_saveVideoToStorage(result.base64, result.size);
          return true;
        }
      } catch (e) {}
      
      break;
    }
  }

  // ลอง fetch จาก video element
  const videoResult = await sb_fetchVideoFromPage();
  if (videoResult) {
    await sb_saveVideoToStorage(videoResult.base64, videoResult.size);
    return true;
  }

  return false;
}

// ★ Fetch video blob from page video elements ★
async function sb_fetchVideoFromPage() {
  const videos = document.querySelectorAll('video');
  let bestSrc = null;
  let bestDur = 0;
  
  for (const v of videos) {
    const src = v.src || v.currentSrc || '';
    const dur = v.duration || 0;
    if (!src || src.includes('gstatic.com')) continue;
    if (dur >= 14 && dur > bestDur) {
      bestDur = dur;
      bestSrc = src;
    }
  }
  
  if (!bestSrc) {
    for (const v of videos) {
      const src = v.src || v.currentSrc || '';
      if (src && (src.startsWith('blob:') || src.includes('storage.googleapis.com'))) {
        bestSrc = src;
        break;
      }
    }
  }
  
  if (!bestSrc) return null;
  
  try {
    const resp = await fetch(bestSrc);
    const blob = await resp.blob();
    if (blob.size < 500000) return null;
    const reader = new FileReader();
    const base64 = await new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    console.log('[16s-SB] Fetched video from page! Size:', blob.size);
    return { base64, size: blob.size };
  } catch (e) {
    console.log('[16s-SB] Fetch video error:', e.message);
    return null;
  }
}

// ★ Save 16s video to storage ★
async function sb_saveVideoToStorage(base64, size) {
  try {
    const flowData = await getSafeFlowData();
    await chrome.storage.local.set({
      currentFlowData: {
        ...flowData,
        videoBlob: base64,
        videoSize: size,
        clipDuration: 16,
        videoDownloaded16: true,
        videoDownloadedAt16: new Date().toISOString(),
        clipDuration16: 16
      },
      flowStatus: 'video_downloaded_16s',
      flowMessage: 'Video 16 วินาที พร้อมอัพโหลด TikTok'
    });
    console.log('[16s-SB] ✅ Video saved to storage! Size:', size);
    showNotification('💾 บันทึก Video 16 วิ สำเร็จ! (' + Math.round(size / 1024 / 1024 * 10) / 10 + ' MB)');
  } catch (e) {
    console.log('[16s-SB] Save error:', e);
  }
}

// ★★★ MAIN ENTRY: extendViaSceneBuilder — 2-Clip Scene Builder Pipeline ★★★
// Flow: Image → Video1+AddToScene → Image→Video2+AddToScene → SceneBuilder→Download → TikTok
async function extendViaSceneBuilder() {
  if (await isFlowStopped()) return;
  console.log('[16s-SB] ═══ Starting 2-Clip Scene Builder Pipeline ═══');
  showNotification('🎬 เริ่ม 16 วิ (2 คลิป + Scene Builder)...');
  
  await chrome.storage.local.set({ flowStatus: 'extending_16s' });
  try { sessionStorage.setItem('extendSubStep', 'sb_clip1_start'); } catch (e) {}

  // ★ ดึง prompts ★
  const flowDataResult = await chrome.storage.local.get(['currentFlowData']);
  const fd = flowDataResult.currentFlowData || {};
  
  // prompt1 = Clip 1 (8 วิแรก — ใช้ videoPrompt8 ซึ่งเจนไปแล้วใน Step 8-11)
  // prompt2 = Clip 2 (8 วิหลัง — ใช้ videoPrompt16 สำหรับ clip ที่ 2)
  let prompt1 = fd.videoPrompt8 || fd.videoPrompt8s || fd.videoPrompt || '';
  let prompt2 = fd.videoPrompt16 || '';
  
  // Parse JSON if needed
  if (prompt1 && prompt1.trim().startsWith('{')) {
    try { prompt1 = JSON.parse(prompt1).prompt_text || prompt1; } catch (e) {}
  }
  if (prompt2 && prompt2.trim().startsWith('{')) {
    try { prompt2 = JSON.parse(prompt2).prompt_text || prompt2; } catch (e) {}
  }
  prompt1 = sanitizePromptForFlow(prompt1);
  prompt2 = sanitizePromptForFlow(prompt2);
  
  console.log('[16s-SB] Prompt 1 (Clip 1) length:', prompt1.length);
  console.log('[16s-SB] Prompt 2 (Clip 2) length:', prompt2.length);

  // ★ Snapshot current images/videos ★
  const snapshotSrcs = () => {
    const srcs = new Set();
    document.querySelectorAll('img').forEach(el => { if (el.src) srcs.add(el.src); });
    document.querySelectorAll('video').forEach(el => { if (el.src) srcs.add(el.src); if (el.currentSrc) srcs.add(el.currentSrc); });
    return srcs;
  };
  const initialSrcs = snapshotSrcs();

  // ============================================================
  // CLIP 1: Video 1 เจนเสร็จแล้ว (8 วิปกติ) → แค่กด "Add to Scene"
  // ============================================================
  console.log('[16s-SB] ═══ CLIP 1: Add Video 1 to Scene (already generated) ═══');
  showNotification('🎬 [Clip 1/2] Video 1 เจนเสร็จแล้ว → กด Add to Scene...');

  // ★ Clip 1 Step A: Video 1 ควรจะ generate เสร็จแล้ว (จาก flow ปกติ Step 8-11) ★
  // ★ ตอนนี้เราอยู่หลัง video_saved_8s = video 1 เจนเสร็จแล้ว → กด "Add to Scene" ★
  console.log('[16s-SB] Clip 1: Video 1 already generated (from Steps 8-11) — clicking Add to Scene...');
  try { sessionStorage.setItem('extendSubStep', 'sb_clip1_addToScene'); } catch (e) {}
  showNotification('🎬 [Clip 1/2] กด Add to Scene...');
  
  await new Promise(r => setTimeout(r, 3000));
  
  // ★ ใช้ pipeline_hoverVideoAndAddToScene ที่มีอยู่แล้ว ★
  try {
    await pipeline_hoverVideoAndAddToScene(null, null);
    console.log('[16s-SB] Clip 1: ✅ Add to Scene done!');
    showNotification('✅ [Clip 1/2] Add to Scene สำเร็จ!');
  } catch (e) {
    console.log('[16s-SB] Clip 1: Add to Scene error:', e.message, '— trying manual...');
    // Fallback: หา "Add to Scene" button เอง
    const atsBtn = await findAddToSceneButton();
    if (atsBtn) {
      await simulateRealClick(atsBtn);
      console.log('[16s-SB] Clip 1: ✅ Manual Add to Scene clicked');
    } else {
      console.log('[16s-SB] Clip 1: ⚠️ Add to Scene button not found — continuing anyway');
    }
  }
  
  await new Promise(r => setTimeout(r, 3000));

  // ============================================================
  // CLIP 2: Go back to image → Add to Prompt → Paste prompt2 → Generate → Add to Scene
  // ============================================================
  console.log('[16s-SB] ═══ CLIP 2: Generate Video 2 ═══');
  showNotification('🎬 [Clip 2/2] กลับไปที่รูป → สร้าง Video คลิปที่ 2...');
  try { sessionStorage.setItem('extendSubStep', 'sb_clip2_addToPrompt'); } catch (e) {}

  // ★ Clip 2 Step A: Hover รูป GENERATED ล่าสุด (ไม่ใช่รูปสินค้า/ตัวละคร/video!) → "Add to Prompt" ★
  console.log('[16s-SB] Clip 2: Finding LAST generated image...');
  showNotification('🖱️ [Clip 2/2] หารูปเจนล่าสุด → Add to Prompt...');
  
  await new Promise(r => setTimeout(r, 2000));
  
  let clip2AddToPromptOk = false;
  
  // ★ หารูปเจนล่าสุด: ข้ามรูปที่เป็น uploaded file + video thumbnail ★
  const findLastGeneratedImage = () => {
    // 1) สร้าง exclusion set: video thumbnails
    const videoCardImgSrcs = new Set();
    document.querySelectorAll('video').forEach(v => {
      const card = v.closest('[class*="card"], [class*="Card"], [class*="item"], [class*="Item"], [class*="result"]') || v.parentElement;
      if (card) card.querySelectorAll('img').forEach(img => { if (img.src) videoCardImgSrcs.add(img.src); });
    });
    
    // 2) วนหารูปขนาดใหญ่ที่ visible
    const allImages = document.querySelectorAll('img');
    let lastGenImage = null;
    
    for (const img of allImages) {
      if (img.offsetParent === null) continue;
      const rect = img.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80 || rect.top < 0) continue;
      
      const src = img.src || '';
      
      // ข้าม icons, logos
      if (src.includes('icon') || src.includes('logo') || src.includes('avatar') || src.includes('data:image/svg')) continue;
      
      // ข้าม video thumbnails
      if (videoCardImgSrcs.has(src)) continue;
      
      // ★ ข้ามรูป uploaded (product/character): ตรวจจาก label ข้างๆ ★
      // รูป uploaded จะมี label แบบ "filename.png" / "filename.jpg"
      const card = img.closest('[class*="card"], [class*="Card"], [class*="item"], [class*="Item"], [class*="result"]') || img.parentElement?.parentElement;
      let isUploaded = false;
      if (card) {
        const cardText = (card.textContent || '').trim().toLowerCase();
        // ถ้า card มีข้อความที่เป็น filename (xxx.png, xxx.jpg) → เป็นรูป uploaded
        if (/\.(png|jpg|jpeg|webp|gif|svg|bmp)$/i.test(cardText) || 
            cardText.includes('product-image') || cardText.includes('character-image') ||
            cardText.includes('product_image') || cardText.includes('character_image') ||
            cardText.includes('uploaded') || cardText.includes('reference')) {
          isUploaded = true;
        }
      }
      if (isUploaded) {
        console.log('[16s-SB] Skipping uploaded image:', (card?.textContent || '').trim().substring(0, 40));
        continue;
      }
      
      // ★ ข้ามรูป product/character จาก flowData ★
      if (fd.productImage && src === fd.productImage) continue;
      if (fd.characterUrl && src === fd.characterUrl) continue;
      
      // ★ ข้ามรูปที่ track ไว้ใน _uploadedRefImageSrcs ★
      if (_uploadedRefImageSrcs.has(src)) continue;
      
      // ผ่าน filter → เก็บไว้ (ไม่ break → เก็บตัวสุดท้าย = ล่าสุด)
      lastGenImage = img;
    }
    
    return lastGenImage;
  };
  
  let targetGenImage = findLastGeneratedImage();
  
  if (targetGenImage) {
    console.log('[16s-SB] Clip 2: ✅ Found LAST generated image!',
      'size:', targetGenImage.width, 'x', targetGenImage.height,
      'src:', (targetGenImage.src || '').substring(0, 60));
    
    // Scroll + Hover + Right-click + Add to Prompt
    targetGenImage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(r => setTimeout(r, 800));
    
    for (let attempt = 0; attempt < 3; attempt++) {
      const rect = targetGenImage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      // Hover
      targetGenImage.focus?.();
      targetGenImage.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: cx, clientY: cy }));
      targetGenImage.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: cx, clientY: cy }));
      targetGenImage.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: cx, clientY: cy }));
      await new Promise(r => setTimeout(r, 500));
      
      // Right-click
      targetGenImage.dispatchEvent(new MouseEvent('contextmenu', {
        bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 2, view: window
      }));
      await new Promise(r => setTimeout(r, 3000));
      
      // Find "Add to Prompt"
      const addBtn = await findAddToPromptButton();
      if (addBtn) {
        addBtn.click();
        addBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await new Promise(r => setTimeout(r, 1500));
        console.log('[16s-SB] Clip 2: ✅ Add to Prompt clicked (attempt', attempt + 1, ')!');
        clip2AddToPromptOk = true;
        break;
      }
      
      if (attempt < 2) {
        console.log('[16s-SB] Clip 2: Add to Prompt not found, retrying...', attempt + 1);
        document.body.click();
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  
  // ★ Fallback: ถ้าหาไม่เจอ → ใช้ pipeline version ★
  if (!clip2AddToPromptOk) {
    console.log('[16s-SB] Clip 2: Custom finder failed — trying pipeline fallback...');
    clip2AddToPromptOk = await pipeline_hoverImageAndAddToPrompt(null);
  }
  
  console.log('[16s-SB] Clip 2: Add to Prompt result:', clip2AddToPromptOk);
  
  await new Promise(r => setTimeout(r, 3000));

  // ★ Clip 2 Step B: Paste video prompt 2 (16 วิ) ★
  console.log('[16s-SB] Clip 2: Pasting video prompt 2 (16s)...');
  try { sessionStorage.setItem('extendSubStep', 'sb_clip2_paste'); } catch (e) {}
  showNotification('📝 [Clip 2/2] วาง Video Prompt 16 วิ...');
  
  const clip2Prompt = prompt2 || prompt1;
  if (clip2Prompt) {
    // ใช้ PASTE_TO_SLATE เหมือน Step 9 ของ flow ปกติ
    try {
      await chrome.runtime.sendMessage({ type: 'PASTE_TO_SLATE', promptText: clip2Prompt });
      let pasteOk = false;
      for (let p = 0; p < 16; p++) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const result = await chrome.runtime.sendMessage({ type: 'READ_SLATE_PASTE_RESULT' });
          if (result?.status === 'success') { pasteOk = true; break; }
          if (result?.status !== 'pending') break;
        } catch (e) {}
      }
      if (pasteOk) {
        console.log('[16s-SB] Clip 2: ✅ Prompt 2 pasted via PASTE_TO_SLATE');
      } else {
        console.log('[16s-SB] Clip 2: ⚠️ PASTE_TO_SLATE uncertain — trying sb_fillExtendPrompt');
        await sb_fillExtendPrompt(clip2Prompt);
      }
    } catch (e) {
      console.log('[16s-SB] Clip 2: PASTE_TO_SLATE error:', e.message, '— fallback');
      await sb_fillExtendPrompt(clip2Prompt);
    }
  }
  await new Promise(r => setTimeout(r, 3000));
  
  // ★ Clip 2 Step B2: Select Video + Frames tabs (ใช้ pipeline version — ไม่ chain ไป Generate/Wait) ★
  console.log('[16s-SB] Clip 2: Selecting Video + Frames tabs...');
  showNotification('🎬 [Clip 2/2] เลือก Video mode...');
  try {
    await pipeline_selectVideoTabs();
    console.log('[16s-SB] Clip 2: ✅ Video + Frames tabs selected');
  } catch (e) {
    console.log('[16s-SB] Clip 2: Tab selection error (non-critical):', e.message);
  }
  await new Promise(r => setTimeout(r, 1000));

  // ★ Clip 2 Step C: Click Generate ★
  console.log('[16s-SB] Clip 2: Click Generate...');
  try { sessionStorage.setItem('extendSubStep', 'sb_clip2_generate'); } catch (e) {}
  showNotification('🚀 [Clip 2/2] กด Generate...');
  
  const genOk = await sb_clickExtendGenerate();
  if (!genOk) {
    console.log('[16s-SB] Clip 2: Generate button not found — trying clickGenerateButton...');
    try {
      await clickGenerateButton();
    } catch (e) {
      console.log('[16s-SB] Clip 2: ⚠️ All generate methods failed');
      await notifyFlowFailed('16s: Generate button not found for Clip 2', 13);
      return;
    }
  }
  showNotification('✅ [Clip 2/2] กด Generate แล้ว! รอ video...');
  
  // ★ Clip 2 Step D: Wait for Video 2 ★
  console.log('[16s-SB] Clip 2: Waiting for video generation...');
  try { sessionStorage.setItem('extendSubStep', 'sb_clip2_waiting'); } catch (e) {}
  
  const clip2Srcs = snapshotSrcs();
  let video2Ready = false;
  
  for (let attempt = 1; attempt <= 240; attempt++) {
    if (await isFlowStopped()) return;
    
    if (isPageCrashed()) {
      await notifyFlowFailed('Page crashed during Clip 2 generation', 13);
      return;
    }
    
    // Check new video element
    if (attempt >= 20) {
      const videos = document.querySelectorAll('video');
      for (const v of videos) {
        const src = v.src || v.currentSrc || '';
        if (src && !clip2Srcs.has(src) && !src.includes('gstatic.com') && (v.duration >= 5 || src.startsWith('blob:'))) {
          console.log(`[16s-SB] Clip 2: ✅ New video detected! dur: ${v.duration}, src: ${src.substring(0, 60)}`);
          video2Ready = true;
          break;
        }
      }
      if (video2Ready) break;
    }
    
    // Check progress
    const pageText = document.body?.innerText || '';
    const pctMatch = pageText.match(/(\d{1,3})%/);
    if (attempt % 15 === 0) {
      const pctStr = pctMatch ? ` (${pctMatch[1]}%)` : '';
      showNotification(`⏳ [Clip 2/2] รอ Video 2... ${attempt} วิ${pctStr}`);
    }
    
    // Check failed
    if (attempt > 15 && attempt % 10 === 0) {
      const failCheck = isGenerationFailed();
      if (failCheck.failed) {
        console.log('[16s-SB] Clip 2: Generation failed:', failCheck.reason);
        const retried = await clickRetryOnFailedCard();
        if (!retried) {
          await notifyFlowFailed('16s Clip 2: Generation failed — ' + failCheck.reason, 13);
          return;
        }
      }
    }
    
    // Check completion via download button or internal state
    if (attempt >= 30 && attempt % 10 === 0) {
      const curState = await readFlowInternalState();
      if (curState.hasData && curState.generatingCount === 0 && curState.clipCount > 0) {
        const vids = document.querySelectorAll('video');
        for (const v of vids) {
          const src = v.src || v.currentSrc || '';
          if (src && !clip2Srcs.has(src)) {
            video2Ready = true;
            break;
          }
        }
        if (video2Ready) {
          console.log('[16s-SB] Clip 2: ✅ Video ready (internal state confirms)');
          break;
        }
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  if (!video2Ready) {
    console.log('[16s-SB] Clip 2: ⚠️ Video 2 not detected — continuing anyway');
    showNotification('⚠️ Video 2 อาจยังไม่เสร็จ — ลอง Add to Scene...');
  } else {
    showNotification('✅ [Clip 2/2] Video 2 สำเร็จ!');
  }
  
  await new Promise(r => setTimeout(r, 5000));

  // ★ Clip 2 Step E: Add to Scene ★
  console.log('[16s-SB] Clip 2: Add to Scene...');
  try { sessionStorage.setItem('extendSubStep', 'sb_clip2_addToScene'); } catch (e) {}
  showNotification('🎬 [Clip 2/2] กด Add to Scene...');
  
  try {
    await pipeline_hoverVideoAndAddToScene(clip2Srcs, null);
    console.log('[16s-SB] Clip 2: ✅ Add to Scene done!');
  } catch (e) {
    console.log('[16s-SB] Clip 2: Add to Scene error:', e.message);
    const atsBtn = await findAddToSceneButton();
    if (atsBtn) {
      await simulateRealClick(atsBtn);
      console.log('[16s-SB] Clip 2: ✅ Manual Add to Scene clicked');
    }
  }
  
  showNotification('✅ [Clip 2/2] Add to Scene สำเร็จ!');
  await new Promise(r => setTimeout(r, 3000));

  // ============================================================
  // SCENE BUILDER: Open → Download combined video
  // ============================================================
  console.log('[16s-SB] ═══ SCENE BUILDER: Download ═══');
  try { sessionStorage.setItem('extendSubStep', 'sb_scenebuilder'); } catch (e) {}
  showNotification('🎬 เปิด Scene Builder เพื่อ Download...');
  
  try {
    await pipeline_openSceneBuilderAndDownload();
    console.log('[16s-SB] ✅ Scene Builder download done!');
  } catch (e) {
    console.log('[16s-SB] Scene Builder download error:', e.message);
    // Fallback: ลอง export
    showNotification('⚠️ Scene Builder error — ลอง Export...');
    await sb_exportAndDownload();
  }
  
  // ★ Save 16s metadata ★
  try {
    const finalFlowData = await getSafeFlowData();
    await chrome.storage.local.set({
      currentFlowData: {
        ...finalFlowData,
        clipDuration: 16,
        videoDownloaded16: true,
        videoDownloadedAt16: new Date().toISOString()
      },
      flowStatus: 'video_downloaded_16s',
      flowMessage: 'Video 16 วินาที พร้อมอัพโหลด TikTok'
    });
  } catch (e) {
    console.log('[16s-SB] Save metadata error:', e);
  }

  // ★ Clear session state ★
  try { sessionStorage.removeItem('extendSubStep'); sessionStorage.removeItem('extendRetryCount'); } catch (e) {}

  // ============================================================
  // TIKTOK: Open Upload
  // ============================================================
  console.log('[16s-SB] ═══ TIKTOK UPLOAD ═══');
  showNotification('✅ 16 วิ (2 คลิป) เสร็จ! → TikTok Upload...');
  await new Promise(r => setTimeout(r, 3000));
  await retryStep(() => openTikTokFor16sVideo(), 'SB: Open TikTok');
  
  console.log('[16s-SB] ═══ 2-Clip Scene Builder Pipeline COMPLETE ═══');
}

// =====================================================================
// ★★★ OLD EXTEND FLOW (Legacy — kept as fallback) ★★★
// =====================================================================

// Step 13: Click left-click on the generated video to enter Extend mode
// ★ คลิกที่ video card/thumbnail เพื่อเข้า detail view → Slate editor จะโผล่ ★
async function clickVideoToExtend() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 13: Clicking on video to enter Extend...');
  showNotification('🖱️ Step 13: คลิกที่ Video เพื่อเข้า Extend...');

  // ★ Set extending_16s BEFORE click — ป้องกัน resume logic trigger ซ้ำถ้า page reload ★
  await chrome.storage.local.set({ flowStatus: 'extending_16s' });
  // ★ PD-INSPIRED: sessionStorage sub-step tracking for precise reload recovery ★
  try { sessionStorage.setItem('extendSubStep', 'step13_entering'); } catch (e) {}
  console.log('[TikTok Auto] Step 13: Set flowStatus=extending_16s (pre-click guard)');

  showNotification('⏳ รอ 3 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // ★ หา click target — ลำดับ: video element → parent card → img thumbnail ★
  let clickTarget = null;
  let clickMethod = '';

  // วิธี 1: หา <video> ที่ visible แล้วไล่หา parent card ที่คลิกได้
  const videos = document.querySelectorAll('video');
  console.log('[TikTok Auto] Step 13: Found', videos.length, 'video elements');

  for (const video of videos) {
    const src = video.src || video.currentSrc || '';
    const rect = video.getBoundingClientRect();
    if (rect.width > 50 && rect.height > 50 && (src.startsWith('blob:') || src.includes('storage.googleapis.com') || src.startsWith('https://'))) {
      // หา parent card container ที่มี click handler (ปกติ Google Flow ใช้ card wrapper)
      const card = video.closest('[class*="card"], [class*="Card"], [class*="result"], [class*="Result"], [class*="item"], [class*="Item"], [role="button"], [tabindex]')
                || video.closest('div[class]')?.parentElement
                || video.parentElement;
      clickTarget = card || video;
      clickMethod = card ? 'video parent card' : 'video element';
      console.log('[TikTok Auto] Step 13: Target via', clickMethod, '— tag:', clickTarget.tagName, 'class:', (clickTarget.className || '').substring(0, 60));
      break;
    }
  }

  // วิธี 2: fallback — หา visible video ที่ใหญ่ที่สุด
  if (!clickTarget) {
    let bestVideo = null;
    let bestArea = 0;
    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (rect.width > 50 && rect.height > 50 && area > bestArea) {
        bestArea = area;
        bestVideo = video;
      }
    }
    if (bestVideo) {
      clickTarget = bestVideo.closest('div[class]')?.parentElement || bestVideo;
      clickMethod = 'largest visible video';
    }
  }

  // วิธี 3: fallback — หา img thumbnail ที่น่าจะเป็น video result (มี play icon / video badge)
  if (!clickTarget) {
    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
      const rect = img.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80) continue;
      const parent = img.closest('[class*="card"], [class*="Card"], [class*="result"], [class*="Result"]');
      if (parent) {
        const hasVideoIndicator = parent.querySelector('video, [class*="play"], [class*="Play"], [class*="video"], [class*="Video"], svg');
        if (hasVideoIndicator) {
          clickTarget = parent;
          clickMethod = 'img card with video indicator';
          break;
        }
      }
    }
  }

  if (!clickTarget) {
    console.log('[TikTok Auto] Step 13: No video/card found to click');
    showNotification('⚠️ ไม่พบ Video element — ลอง DEBUGGER_CLICK ตรงกลางจอ');
    // Last resort: คลิกตรงกลางซ้ายของหน้า (ตำแหน่งที่ thumbnail น่าจะอยู่)
    try {
      const cx = Math.round(window.innerWidth * 0.2);
      const cy = Math.round(window.innerHeight * 0.35);
      console.log('[TikTok Auto] Step 13: DEBUGGER_CLICK at center-left:', cx, cy);
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: cx, y: cy }, (resp) => {
          if (chrome.runtime.lastError) resolve(null);
          else resolve(resp);
        });
      });
    } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // ★ v3.33 FIX: Snapshot Slate editor ก่อน click เพื่อเปรียบเทียบทีหลัง ★
  const preClickSlateEl = document.querySelector('[data-slate-editor="true"]');
  const preClickSlateContent = preClickSlateEl?.textContent?.trim() || '';
  const preClickSlateCount = document.querySelectorAll('[data-slate-editor="true"]').length;
  const preClickUrl = window.location.href;
  console.log('[TikTok Auto] Step 13: Pre-click snapshot — slateCount:', preClickSlateCount, 'contentLen:', preClickSlateContent.length, 'url:', preClickUrl);

  // ★ v3.33 FIX: เช็คว่า Extend UI เปิดจริง (ไม่ใช่ Slate editor ตัวเดิมจาก Step 9) ★
  const isExtendUIReady = () => {
    const currentSlate = document.querySelector('[data-slate-editor="true"]');
    const currentSlateCount = document.querySelectorAll('[data-slate-editor="true"]').length;
    const urlChanged = window.location.href !== preClickUrl;

    // Signal 1: URL เปลี่ยน + มี Slate = เข้าหน้าใหม่ (extend view) แน่นอน
    if (urlChanged && currentSlate) {
      console.log('[TikTok Auto] Step 13: Extend detected — URL changed + Slate exists');
      return true;
    }

    // Signal 2: Slate element เป็นคนละ DOM node กับก่อน click (React re-mount)
    if (currentSlate && preClickSlateEl && currentSlate !== preClickSlateEl) {
      console.log('[TikTok Auto] Step 13: Extend detected — Slate DOM node changed');
      return true;
    }

    // Signal 3: จำนวน Slate editors เพิ่มขึ้น (มี editor ใหม่ปรากฏ)
    if (currentSlateCount > preClickSlateCount) {
      console.log('[TikTok Auto] Step 13: Extend detected — Slate count increased:', preClickSlateCount, '→', currentSlateCount);
      return true;
    }

    // Signal 4: Slate editor ตัวเดิมแต่ content เปลี่ยนแปลงมาก (เช่น ว่างเปล่า = extend editor ที่ถูก clear)
    if (currentSlate) {
      const currentContent = currentSlate.textContent?.trim() || '';
      if (preClickSlateContent.length > 30 && currentContent.length < 20) {
        console.log('[TikTok Auto] Step 13: Extend detected — Slate content cleared (was', preClickSlateContent.length, 'now', currentContent.length, ')');
        return true;
      }
    }

    // Signal 5: Placeholder "What happens next?" = Extend editor แน่นอน (เฉพาะ Google Flow)
    const placeholders = document.querySelectorAll('[data-slate-placeholder], [data-placeholder]');
    for (const ph of placeholders) {
      const phText = (ph.textContent || ph.getAttribute('data-placeholder') || '').toLowerCase();
      if (phText.includes('what happens next') || phText.includes('next') || phText.includes('extend')) {
        console.log('[TikTok Auto] Step 13: Extend detected — placeholder "What happens next?" found');
        return true;
      }
    }
    // Slate editor กับ placeholder attribute
    if (currentSlate) {
      const slateHolder = currentSlate.getAttribute('placeholder') || currentSlate.getAttribute('data-placeholder') || '';
      if (slateHolder.toLowerCase().includes('what happens') || slateHolder.toLowerCase().includes('next')) {
        console.log('[TikTok Auto] Step 13: Extend detected — Slate has "what happens" placeholder attr');
        return true;
      }
    }

    // Signal 6: ปุ่ม "Done" / ">> Extend" tab / "Insert" visible = detail view (extend page)
    const allPageBtns = document.querySelectorAll('button, [role="button"], [role="tab"]');
    let hasExtendTab = false;
    let hasDoneBtn = false;
    for (const btn of allPageBtns) {
      const t = (btn.textContent?.trim() || '').toLowerCase();
      if (t === 'done') hasDoneBtn = true;
      if (t.includes('extend') && (t.includes('>>') || t.length < 20)) hasExtendTab = true;
    }
    if (hasExtendTab && (hasDoneBtn || currentSlate)) {
      console.log('[TikTok Auto] Step 13: Extend detected — "Extend" tab + "Done" button / Slate visible');
      return true;
    }

    // Signal 7: มี textarea ใหม่ปรากฏ (Google Flow อาจใช้ textarea แทน Slate)
    const textarea = document.querySelector('textarea[placeholder]');
    if (textarea && (!textarea.value || textarea.value.trim().length < 20)) {
      console.log('[TikTok Auto] Step 13: Extend detected — empty textarea found');
      return true;
    }

    // Signal 8: ไม่มี Slate ก่อน click แต่ตอนนี้มีแล้ว
    if (!preClickSlateEl && currentSlate) {
      console.log('[TikTok Auto] Step 13: Extend detected — Slate appeared (was absent before)');
      return true;
    }

    return false;
  };

  // ★ v3.33: ลองหาและกดปุ่ม "Extend" ใน detail view (Google Flow อาจต้องกดปุ่ม Extend ก่อน) ★
  const tryClickExtendButton = async () => {
    const extendKeywords = ['extend', 'ต่อวิดีโอ', 'ขยาย', 'extend video', 'extend clip'];
    const allClickable = document.querySelectorAll('button, [role="button"], a, [role="tab"], [role="menuitem"], span[class], div[class]');
    for (const el of allClickable) {
      const txt = (el.textContent?.trim() || '').toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      if (el.offsetParent === null) continue;
      for (const kw of extendKeywords) {
        if (txt === kw || ariaLabel.includes(kw) || (txt.includes(kw) && txt.length < 30)) {
          console.log('[TikTok Auto] Step 13: Found "Extend" button:', txt, '— clicking...');
          showNotification('🎬 กดปุ่ม Extend...');
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          await new Promise(resolve => setTimeout(resolve, 300));
          el.click();
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        }
      }
    }
    // ลองหา icon ที่มี tooltip "Extend"
    const icons = document.querySelectorAll('i.google-symbols, i.material-icons, mat-icon');
    for (const icon of icons) {
      const txt = icon.textContent?.trim().toLowerCase() || '';
      if (txt === 'expand' || txt === 'open_in_full' || txt === 'aspect_ratio' || txt === 'movie_creation' || txt === 'extension') {
        const btn = icon.closest('button') || icon.closest('[role="button"]') || icon.parentElement;
        if (btn && btn.offsetParent !== null) {
          const btnTxt = btn.textContent?.trim().toLowerCase() || '';
          const btnLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          if (btnTxt.includes('extend') || btnLabel.includes('extend') || btnTxt.length < 20) {
            console.log('[TikTok Auto] Step 13: Found Extend icon button:', txt, '— clicking...');
            showNotification('🎬 กดปุ่ม Extend (icon)...');
            btn.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
          }
        }
      }
    }
    return false;
  };

  // ★ Helper: รอ Extend UI เปิด (สูงสุด maxSec วินาที) — ถ้าไม่เจอ ลองกดปุ่ม Extend ★
  const waitForExtendUI = async (maxSec, label) => {
    let triedExtendBtn = false;
    for (let w = 0; w < maxSec; w++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (isExtendUIReady()) {
        console.log(`[TikTok Auto] Step 13: Extend UI ready after ${w + 1}s (${label})`);
        return true;
      }
      // ถ้ารอ 3 วิแล้วยังไม่เจอ Extend UI → ลองกดปุ่ม Extend (ถ้ามี)
      if (w === 3 && !triedExtendBtn) {
        triedExtendBtn = true;
        const clicked = await tryClickExtendButton();
        if (clicked) {
          console.log('[TikTok Auto] Step 13: Clicked Extend button — waiting for UI...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          if (isExtendUIReady()) return true;
        }
      }
      if (w % 5 === 4) showNotification(`⏳ รอ Extend UI... (${w + 1} วิ)`);
    }
    return false;
  };

  if (clickTarget) {
    console.log('[TikTok Auto] Step 13: Left-clicking via', clickMethod);
    showNotification('🖱️ คลิกซ้ายที่ Video...');

    clickTarget.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise(resolve => setTimeout(resolve, 500));

    let extendReady = false;

    // ★ วิธี 1: JS click (ไม่ต้องใช้ debugger — ไม่มี layout shift) ★
    console.log('[TikTok Auto] Step 13: Method 1 — JS click on', clickMethod);
    try {
      const r1 = clickTarget.getBoundingClientRect();
      const evtOpts = { bubbles: true, cancelable: true, view: window, clientX: r1.left + r1.width / 2, clientY: r1.top + r1.height / 2 };
      clickTarget.dispatchEvent(new PointerEvent('pointerdown', evtOpts));
      await new Promise(resolve => setTimeout(resolve, 50));
      clickTarget.dispatchEvent(new MouseEvent('mousedown', evtOpts));
      await new Promise(resolve => setTimeout(resolve, 50));
      clickTarget.dispatchEvent(new PointerEvent('pointerup', evtOpts));
      await new Promise(resolve => setTimeout(resolve, 50));
      clickTarget.dispatchEvent(new MouseEvent('mouseup', evtOpts));
      await new Promise(resolve => setTimeout(resolve, 50));
      clickTarget.dispatchEvent(new MouseEvent('click', evtOpts));
      console.log('[TikTok Auto] Step 13: JS click dispatched');
    } catch (e) {
      console.log('[TikTok Auto] Step 13: JS click error:', e.message);
    }

    // ★ v3.33: ใช้ waitForExtendUI แทน single check — ให้เวลาหน้า navigate เข้า detail view ★
    extendReady = await waitForExtendUI(8, 'JS click');

    // ★ วิธี 2: DEBUGGER_CLICK_SELECTOR (คำนวณ coords หลัง attach debugger — ไม่มี offset shift) ★
    if (!extendReady) {
      console.log('[TikTok Auto] Step 13: Method 2 — DEBUGGER_CLICK_SELECTOR');
      showNotification('🖱️ ลอง Debugger click (selector)...');
      try {
        const selectorJs = `(() => {
          const vids = document.querySelectorAll('video');
          for (const v of vids) {
            const r = v.getBoundingClientRect();
            if (r.width > 50 && r.height > 50 && (v.src?.startsWith('blob:') || v.src?.includes('storage.google') || v.src?.startsWith('https://'))) {
              const card = v.closest('[class*="card"], [class*="Card"], [class*="result"], [role="button"], [tabindex]') || v.closest('div[class]')?.parentElement || v;
              const cr = card.getBoundingClientRect();
              return { x: Math.round(cr.left + cr.width / 2), y: Math.round(cr.top + cr.height / 2) };
            }
          }
          let best = null, bestA = 0;
          for (const v of vids) {
            const r = v.getBoundingClientRect();
            if (r.width > 50 && r.height > 50 && r.width * r.height > bestA) { bestA = r.width * r.height; best = v; }
          }
          if (best) { const r = best.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }
          return null;
        })()`;
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK_SELECTOR', jsExpression: selectorJs }, (resp) => {
            if (chrome.runtime.lastError) resolve(null);
            else resolve(resp);
          });
        });
      } catch (e) { console.log('[TikTok Auto] Step 13: DEBUGGER_CLICK_SELECTOR error:', e.message); }

      extendReady = await waitForExtendUI(10, 'DEBUGGER_CLICK_SELECTOR');
    }

    // ★ วิธี 3 (fallback): DEBUGGER_CLICK แบบเดิม ★
    if (!extendReady) {
      console.log('[TikTok Auto] Step 13: Method 3 — DEBUGGER_CLICK (legacy)');
      showNotification('🖱️ ลอง Debugger click (coords)...');
      const targetRect = clickTarget.getBoundingClientRect();
      const cx = Math.round(targetRect.left + targetRect.width / 2);
      const cy = Math.round(targetRect.top + targetRect.height / 2);
      console.log('[TikTok Auto] Step 13: DEBUGGER_CLICK at', cx, cy);
      try {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: cx, y: cy }, (resp) => {
            if (chrome.runtime.lastError) resolve(null);
            else resolve(resp);
          });
        });
      } catch (e) { console.log('[TikTok Auto] Step 13: DEBUGGER_CLICK error:', e.message); }

      extendReady = await waitForExtendUI(10, 'DEBUGGER_CLICK');
    }

    // ★ วิธี 4 (last resort): DEBUGGER_CLICK ตรงกลางจอ ★
    if (!extendReady) {
      console.log('[TikTok Auto] Step 13: Method 4 — DEBUGGER_CLICK center-screen');
      showNotification('🖱️ ลองคลิกตรงกลาง...');
      const cx2 = Math.round(window.innerWidth * 0.3);
      const cy2 = Math.round(window.innerHeight * 0.4);
      try {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: cx2, y: cy2 }, (resp) => {
            if (chrome.runtime.lastError) resolve(null);
            else resolve(resp);
          });
        });
      } catch (e) {}
      extendReady = await waitForExtendUI(10, 'center-screen');
    }

    // ★ v3.33: ถ้ายังไม่เจอ Extend UI → ลองกดปุ่ม Extend โดยตรง (last resort) ★
    if (!extendReady) {
      console.log('[TikTok Auto] Step 13: All click methods failed — trying Extend button directly');
      showNotification('🔍 ลองหาปุ่ม Extend...');
      const clickedExtend = await tryClickExtendButton();
      if (clickedExtend) {
        extendReady = await waitForExtendUI(8, 'Extend button click');
      }
    }

    // ★ v3.33: ลองหลาย approach เพิ่ม ★
    if (!extendReady) {
      // ลอง double-click ที่วิดีโอ (บาง UI ต้อง double-click)
      console.log('[TikTok Auto] Step 13: Trying double-click on video...');
      try {
        const r2 = clickTarget.getBoundingClientRect();
        const dblOpts = { bubbles: true, cancelable: true, view: window, detail: 2, clientX: r2.left + r2.width / 2, clientY: r2.top + r2.height / 2 };
        clickTarget.dispatchEvent(new MouseEvent('dblclick', dblOpts));
      } catch (e) {}
      await new Promise(resolve => setTimeout(resolve, 3000));
      extendReady = isExtendUIReady();
    }

    if (extendReady) {
      console.log('[TikTok Auto] Step 13 completed! Extend UI is ready!');
      showNotification('✅ Step 13 เสร็จ! คลิก Video เข้า Extend แล้ว!');
    } else {
      console.log('[TikTok Auto] Step 13: ⚠️ Extend UI did not load after ALL methods');
      showNotification('⚠️ Extend UI อาจยังไม่พร้อม — ลองวาง prompt...');
      // ★ v3.33 LOG: แสดง DOM state เพื่อ debug ★
      const debugSlates = document.querySelectorAll('[data-slate-editor="true"]');
      console.log('[TikTok Auto] Step 13 DEBUG: Current Slate editors:', debugSlates.length, 'URL:', window.location.href, 'preClickUrl:', preClickUrl);
      debugSlates.forEach((s, i) => {
        const isSame = s === preClickSlateEl ? '(SAME as pre-click!)' : '(different node)';
        console.log(`  Slate[${i}]: contentLen=${s.textContent?.trim().length || 0} ${isSame}`);
      });
    }
    await new Promise(resolve => setTimeout(resolve, 2000));

    await retryStep(() => pasteVideoPrompt16ToSlate(), AUTOPOST_STEPS.step14_PasteExtend);
  } else {
    console.log('[TikTok Auto] Step 13: No click target found — trying center click');
    showNotification('⚠️ ไม่พบ Video — ลองคลิกตรงกลาง...');
    const cx = Math.round(window.innerWidth * 0.2);
    const cy = Math.round(window.innerHeight * 0.35);
    try {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: cx, y: cy }, (resp) => {
          if (chrome.runtime.lastError) resolve(null);
          else resolve(resp);
        });
      });
    } catch (e) {}

    const extendReady = await waitForExtendUI(15, 'no-target fallback');
    if (extendReady) {
      console.log('[TikTok Auto] Step 13: Extend UI opened via fallback click!');
      showNotification('✅ Step 13 เสร็จ!');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await retryStep(() => pasteVideoPrompt16ToSlate(), AUTOPOST_STEPS.step14_PasteExtend);
    } else {
      console.log('[TikTok Auto] Step 13: Failed — no target and no Extend UI');
      showNotification('❌ ไม่สามารถคลิกเข้า Extend ได้');
    }
  }
}

// Step 14: วาง videoPrompt16 ลง Slate editor (ใช้ pattern เดียวกับ Step 9 ที่พิสูจน์แล้วว่าทำงานได้)
async function pasteVideoPrompt16ToSlate() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 14: Pasting Video Prompt 16s to Slate...');
  showNotification('📝 Step 14: วาง Video Prompt 16 วิ...');
  try { sessionStorage.setItem('extendSubStep', 'step14_pasting'); } catch (e) {}

  showNotification('⏳ รอ 4 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 4000));

  // Get videoPrompt16 from storage
  const result = await chrome.storage.local.get(['currentFlowData']);
  let videoPrompt16 = result.currentFlowData?.videoPrompt16;

  // ★ v3.23 FIX: ถ้าเป็น JSON string → parse เอา prompt_text ออกมา ★
  if (videoPrompt16 && videoPrompt16.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(videoPrompt16);
      videoPrompt16 = parsed.prompt_text || videoPrompt16;
      console.log('[TikTok Auto] Step 14: Parsed JSON → extracted prompt_text for 16s');
    } catch (e) { /* ไม่ใช่ JSON — ใช้ค่าเดิม */ }
  }

  console.log('[TikTok Auto] Step 14: videoPrompt16 length:', videoPrompt16?.length);
  console.log('[TikTok Auto] Step 14: prompt first 80 chars:', videoPrompt16?.substring(0, 80));

  if (!videoPrompt16) {
    console.log('[TikTok Auto] Step 14: No videoPrompt16 found');
    showNotification('⚠️ ไม่พบ Video Prompt 16 วิ');
    return false;
  }

  // === หา Slate editor — ใช้วิธีเดียวกับ Step 9 ===
  let slateEditor = null;

  slateEditor = document.querySelector('[data-slate-editor="true"]');
  if (!slateEditor) {
    const editables = document.querySelectorAll('[contenteditable="true"]');
    for (const el of editables) {
      if (el.querySelector('[data-slate-node]')) {
        slateEditor = el;
        break;
      }
    }
  }
  if (!slateEditor) {
    const paragraphs = document.querySelectorAll('p[data-slate-node="element"]');
    for (const p of paragraphs) {
      slateEditor = p.closest('[data-slate-editor="true"]') || p.closest('[contenteditable="true"]');
      if (slateEditor) break;
    }
  }

  // Retry ถ้าหาไม่เจอ
  if (!slateEditor) {
    for (let retry = 0; retry < 10; retry++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      slateEditor = document.querySelector('[data-slate-editor="true"]');
      if (slateEditor) {
        console.log('[TikTok Auto] Step 14: Found Slate editor at retry', retry);
        break;
      }
    }
  }

  if (!slateEditor) {
    console.log('[TikTok Auto] Step 14: Slate editor not found!');
    showNotification('⚠️ ไม่พบ Slate editor');
    try { await navigator.clipboard.writeText(videoPrompt16); } catch (e) { }
    showNotification('📋 Prompt อยู่ใน clipboard แล้ว — กด Ctrl+V');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await retryStep(() => clickGenerateForVideo16New(), 'Step 15: Click Generate 16s');
    return;
  }

  console.log('[TikTok Auto] Step 14: Found Slate editor');

  // ★ v3.24: Final sanitize ก่อนวาง ★
  videoPrompt16 = sanitizePromptForFlow(videoPrompt16);

  try {
    console.log('[TikTok Auto] Step 14: Sending PASTE_TO_SLATE to background...');
    showNotification('📝 กำลังวาง Prompt ผ่าน Slate API...');

    try {
      await chrome.runtime.sendMessage({ type: 'PASTE_TO_SLATE', promptText: videoPrompt16 });
    } catch (e) {
      console.log('[TikTok Auto] Step 14: sendMessage error:', e);
    }

    // รอผลจาก page context (สูงสุด 8 วินาที)
    let pasteResult = 'pending';
    for (let wait = 0; wait < 16; wait++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        const result = await chrome.runtime.sendMessage({ type: 'READ_SLATE_PASTE_RESULT' });
        if (result && result.status !== 'pending') {
          pasteResult = result.status;
          console.log('[TikTok Auto] Step 14: Slate paste result:', result.status, result.method || result.message || '');
          break;
        }
      } catch (e) {
        // ไม่เป็นไร — ลอง poll ต่อ
      }
    }

    if (pasteResult === 'success') {
      console.log('[TikTok Auto] Step 14 completed — Slate internal state updated!');
      showNotification('✅ Step 14 เสร็จ! วาง Video Prompt 16 วิ สำเร็จ (Slate API)!');
    } else {
      // Fallback: copy to clipboard ให้ user กด Ctrl+V เอง
      console.log('[TikTok Auto] Step 14: Slate API failed:', pasteResult, '— copying to clipboard');
      showNotification('⚠️ วาง prompt อัตโนมัติไม่ได้ — กำลังก็อปไป clipboard...');
      try {
        await navigator.clipboard.writeText(videoPrompt16);
      } catch (e) {
        const tempTa = document.createElement('textarea');
        tempTa.value = videoPrompt16;
        tempTa.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
        document.body.appendChild(tempTa);
        tempTa.select();
        document.execCommand('copy');
        document.body.removeChild(tempTa);
      }
      showNotification('📋 Prompt อยู่ใน clipboard แล้ว — กด Ctrl+V ที่ช่อง "What happens next?"');

      // รอให้ user กด Ctrl+V
      console.log('[TikTok Auto] Step 14: Waiting 10s for manual paste...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // ★ Step 14 เสร็จ — วาง Prompt แล้ว → บังคับเลือก Veo 3.1 Fast ก่อนกด Generate ★
    console.log('[TikTok Auto] Step 14: ✅ Prompt pasted! → Force Veo 3.1 Fast...');
    showNotification('✅ วาง Prompt แล้ว → เลือก Veo 3.1 Fast...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // =========================================================================
    // ★ บังคับเลือก Veo 3.1 - Fast ด้วย React Props (จาก user fix) ★
    // =========================================================================
    let isVeoFastSelected = false;
    const MAX_VEO_RETRIES = 3;

    for (let veoAttempt = 1; veoAttempt <= MAX_VEO_RETRIES; veoAttempt++) {
      if (await isFlowStopped()) return;

      let veoDropdown = null;
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent?.includes('Veo') && btn.offsetParent !== null) {
          veoDropdown = btn;
          break;
        }
      }

      if (veoDropdown) {
        const btnText = veoDropdown.textContent || '';

        if (btnText.includes('Fast') && btnText.includes('3.1') && !btnText.includes('Lite')) {
          console.log('[TikTok Auto] Step 14: ✅ Veo 3.1 Fast is already selected!');
          isVeoFastSelected = true;
          break;
        }

        console.log('[TikTok Auto] Step 14: Opening Veo dropdown (attempt', veoAttempt, ')...');
        await simulateRealClick(veoDropdown);
        await new Promise(resolve => setTimeout(resolve, 1500));

        let fastOptionFound = null;
        const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], [data-radix-collection-item], li, span, div');

        for (const item of menuItems) {
          const val = (item.getAttribute('data-value') || item.getAttribute('value') || item.id || '').toLowerCase();
          const txt = item.textContent?.trim() || '';

          const isValueMatch = val === 'veo_3_1_fast';
          const isTextMatch = txt.includes('Veo 3.1') && txt.includes('Fast');

          if (isValueMatch || isTextMatch) {
            fastOptionFound = item.closest('[role="menuitem"]') || item.closest('[role="option"]') || item.closest('button') || item;
            console.log(`[TikTok Auto] Step 14: Veo target found! Text: "${txt}", Value: "${val}"`);
            break;
          }
        }

        if (fastOptionFound) {
          console.log('[TikTok Auto] Step 14: Force React onClick on Veo 3.1 Fast...');
          showNotification('⚡ Force Click เลือก Veo 3.1 Fast...');

          let reactClickTriggered = false;
          const reactKeys = Object.keys(fastOptionFound);
          for (const key of reactKeys) {
            if (key.startsWith('__reactProps')) {
              const props = fastOptionFound[key];
              if (props && typeof props.onClick === 'function') {
                props.onClick({
                  type: 'click',
                  target: fastOptionFound,
                  currentTarget: fastOptionFound,
                  preventDefault() {},
                  stopPropagation() {}
                });
                reactClickTriggered = true;
              }
              if (props && typeof props.onPointerDown === 'function') {
                props.onPointerDown({
                  type: 'pointerdown',
                  target: fastOptionFound,
                  preventDefault() {},
                  stopPropagation() {}
                });
              }
            }
          }

          if (!reactClickTriggered) {
            await simulateRealClick(fastOptionFound);
          }

          await new Promise(resolve => setTimeout(resolve, 1500));

          if (veoDropdown.textContent?.includes('Fast') && veoDropdown.textContent?.includes('3.1')) {
            console.log('[TikTok Auto] Step 14: ✅ Successfully forced Veo 3.1 Fast!');
            showNotification('✅ เปลี่ยนเป็น Veo 3.1 Fast สำเร็จ!');
            isVeoFastSelected = true;
            break;
          }
        }
      } else {
        console.log('[TikTok Auto] Step 14: Veo dropdown not found. Trying to recover UI...');
        let mainDropdown = [...document.querySelectorAll('button')].find(b => (b.textContent?.includes('Nano') || b.textContent?.includes('Imagen')) && b.offsetParent !== null);
        if (mainDropdown) {
          await simulateRealClick(mainDropdown);
          await new Promise(resolve => setTimeout(resolve, 1500));
          document.body.click();
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      if (!isVeoFastSelected && veoAttempt < MAX_VEO_RETRIES) {
        document.body.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!isVeoFastSelected) {
      showNotification('⚠️ เปลี่ยน Veo 3.1 Fast ไม่สำเร็จ — ไปต่อด้วย model ปัจจุบัน');
    }
    // =========================================================================

    console.log('[TikTok Auto] Step 14: ✅ Done! Moving to Step 15...');
    showNotification('✅ Step 14 เสร็จสิ้น! → ไป Step 15 (Enter + Generate)...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    await clickGenerateForVideo16New();

  } catch (error) {
    console.error('[TikTok Auto] Step 14 error:', error);
    showNotification('❌ Step 14 Error: ' + error.message);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await clickGenerateForVideo16New();
  }
}

// Step 14.5: เลือก Veo 3.1 (ไม่ใช่ Lite) จาก dropdown ก่อนกด Generate
async function selectVeoModelForExtend() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 14.5: เลือก Veo model จาก dropdown...');
  showNotification('🎬 เลือก Veo model...');

  // หา dropdown button ที่มีข้อความ "Veo" + มี aria-haspopup="menu"
  let veoDropdown = null;
  const menuButtons = document.querySelectorAll('button[aria-haspopup="menu"]');
  for (const btn of menuButtons) {
    if (btn.textContent?.includes('Veo')) {
      veoDropdown = btn;
      break;
    }
  }

  if (!veoDropdown) {
    // fallback: หาจาก class ที่ user ให้มา
    const fallbackBtns = document.querySelectorAll('button.sc-a0dcecfb-1');
    for (const btn of fallbackBtns) {
      if (btn.textContent?.includes('Veo')) {
        veoDropdown = btn;
        break;
      }
    }
  }

  if (!veoDropdown) {
    console.log('[TikTok Auto] Step 14.5: Veo dropdown ไม่เจอ — ข้ามไป (ใช้ค่าเดิม)');
    return;
  }

  const currentModel = veoDropdown.textContent?.replace(/arrow_drop_down/g, '').trim();
  console.log('[TikTok Auto] Step 14.5: Current model:', currentModel);

  // ถ้าเป็น Veo 3.1 (ไม่ใช่ Lite) อยู่แล้ว → ไม่ต้องเปลี่ยน
  if (currentModel && currentModel.includes('Veo') && !currentModel.includes('Lite')) {
    console.log('[TikTok Auto] Step 14.5: ✅ Already non-Lite model — no change needed');
    showNotification('✅ Veo model OK: ' + currentModel);
    return;
  }

  // คลิกเปิด dropdown
  veoDropdown.scrollIntoView({ block: 'center', behavior: 'instant' });
  await new Promise(resolve => setTimeout(resolve, 300));
  veoDropdown.click();
  console.log('[TikTok Auto] Step 14.5: Clicked dropdown — waiting for menu...');
  await new Promise(resolve => setTimeout(resolve, 1500));

  // หา menu items (Radix UI pattern)
  const menuItems = document.querySelectorAll(
    '[role="menuitem"], [role="menuitemradio"], [role="option"], [data-radix-collection-item]'
  );
  console.log('[TikTok Auto] Step 14.5: Found', menuItems.length, 'menu items');

  let targetItem = null;
  for (const item of menuItems) {
    const text = item.textContent?.trim();
    console.log('[TikTok Auto] Step 14.5: Menu item:', text);
    // เลือก Veo 3.1 ที่ไม่ใช่ Lite (อาจเป็น "Veo 3.1", "Veo 3.1 - Standard", ฯลฯ)
    if (text?.includes('Veo') && text?.includes('3.1') && !text?.includes('Lite')) {
      targetItem = item;
      break;
    }
  }

  if (!targetItem) {
    // fallback: หาจากข้อความ "Veo 3" ที่ไม่ใช่ Lite
    for (const item of menuItems) {
      const text = item.textContent?.trim();
      if (text?.includes('Veo') && !text?.includes('Lite')) {
        targetItem = item;
        break;
      }
    }
  }

  if (targetItem) {
    targetItem.click();
    const selectedText = targetItem.textContent?.trim();
    console.log('[TikTok Auto] Step 14.5: ✅ Selected:', selectedText);
    showNotification('✅ เลือก ' + selectedText);
  } else {
    console.log('[TikTok Auto] Step 14.5: ⚠️ Target option ไม่เจอ — ปิด dropdown ใช้ค่าเดิม');
    showNotification('⚠️ ไม่เจอ option ที่ต้องการ — ใช้ model เดิม');
    // กด Escape ปิด dropdown
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 300));
    document.body.click();
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Step 15: กด Enter บน Slate → กดปุ่ม Generate สำหรับ Extend Video 16 วิ
async function clickGenerateForVideo16New() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 15: กด Enter + Generate (Extend 16 วิ)...');
  showNotification('🚀 Step 15: กด Enter + Generate...');
  try { sessionStorage.setItem('extendSubStep', 'step15_generating'); } catch (e) {}

  // ★ v3.18 FIX: Restore PRESS_ENTER_SLATE — ส่ง Enter ผ่าน MAIN world เหมือน v3.04 ★
  // Enter key ใน MAIN world เท่านั้นที่ trigger React/Slate onChange → enable ปุ่ม Generate
  console.log('[TikTok Auto] Step 15: Sending PRESS_ENTER_SLATE via MAIN world...');
  showNotification('⌨️ กด Enter บน Slate...');
  try {
    await chrome.runtime.sendMessage({ type: 'PRESS_ENTER_SLATE' });
    console.log('[TikTok Auto] Step 15: ✅ PRESS_ENTER_SLATE sent!');
  } catch (e) {
    console.log('[TikTok Auto] Step 15: PRESS_ENTER_SLATE error:', e);
  }

  // รอให้ Slate process Enter + enable Generate button
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('[TikTok Auto] Step 15: Looking for Generate button...');

  // ★ ฟังก์ชันหาปุ่ม Generate — ใช้หลายวิธีเพื่อรองรับ UI ที่เปลี่ยน ★
  const findGenerateButton = () => {
    // Method 1: หา button ที่มี icon arrow_forward (google-symbols)
    const arrowIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of arrowIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'arrow_forward' || text === 'send') {
        const btn = icon.closest('button');
        if (btn && document.body.contains(btn) && !btn.getAttribute('aria-haspopup')) {
          console.log('[TikTok Auto] Step 15: Found via Method 1 (google-symbols)');
          return btn;
        }
      }
    }

    // Method 2: หา material-icons
    const materialIcons = document.querySelectorAll('i.material-icons, i[class*="material"]');
    for (const icon of materialIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'arrow_forward' || text === 'send') {
        const btn = icon.closest('button');
        if (btn && document.body.contains(btn) && !btn.getAttribute('aria-haspopup')) {
          console.log('[TikTok Auto] Step 15: Found via Method 2 (material-icons)');
          return btn;
        }
      }
    }

    // Method 3: หาจาก icon ทั้งหมด
    const allIcons = document.querySelectorAll('i');
    for (const icon of allIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'arrow_forward') {
        const btn = icon.closest('button');
        if (btn && document.body.contains(btn) && !btn.getAttribute('aria-haspopup')) {
          console.log('[TikTok Auto] Step 15: Found via Method 3 (all icons)');
          return btn;
        }
      }
    }

    // Method 4: หาจาก class sc-c70e41ad (Generate button class) — เหมือน Step 10
    const candidates = document.querySelectorAll('button[class*="sc-c70e41ad"]');
    for (const btn of candidates) {
      if (!btn.getAttribute('aria-haspopup') && !btn.getAttribute('aria-expanded')) {
        console.log('[TikTok Auto] Step 15: Found via Method 4 (sc-c70e41ad class)');
        return btn;
      }
    }

    // Method 5: หาปุ่มวงกลมที่มี SVG arrow ใกล้ Slate editor (Extend UI)
    const slateRef5 = document.querySelector('[data-slate-editor="true"]');
    const svgs = document.querySelectorAll('button svg, button path');
    for (const svg of svgs) {
      const btn = svg.closest('button');
      if (btn && document.body.contains(btn) && !btn.getAttribute('aria-haspopup')) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 20 && rect.width < 80 && rect.height > 20 && rect.height < 80) {
          if (slateRef5) {
            const sRect = slateRef5.getBoundingClientRect();
            if (rect.left > sRect.left && rect.top > sRect.top - 30 && Math.abs(rect.bottom - sRect.bottom) < 100) {
              console.log('[TikTok Auto] Step 15: Found via Method 5 (SVG near Slate)', rect);
              return btn;
            }
          } else {
            const docWidth = document.documentElement.scrollWidth || document.body.scrollWidth;
            if (rect.left > docWidth / 2) {
              console.log('[TikTok Auto] Step 15: Found via Method 5 (SVG button fallback)', rect);
              return btn;
            }
          }
        }
      }
    }

    // Method 6: หาปุ่มที่อยู่ใกล้ prompt box (Slate editor) ด้านขวา
    const slateEditor = document.querySelector('[data-slate-editor="true"]');
    if (slateEditor) {
      const slateRect = slateEditor.getBoundingClientRect();
      const allButtons = document.querySelectorAll('button');
      let bestBtn = null;
      let bestDist = Infinity;
      for (const btn of allButtons) {
        if (btn.getAttribute('aria-haspopup')) continue;
        const bRect = btn.getBoundingClientRect();
        if (bRect.width < 10 || bRect.height < 10) continue;
        // ปุ่ม Generate อยู่ทางขวาของ prompt box ใกล้ๆ ด้านล่าง
        if (bRect.left > slateRect.right - 100 && bRect.top > slateRect.top - 20) {
          const dist = Math.abs(bRect.top - slateRect.bottom) + Math.abs(bRect.left - slateRect.right);
          if (dist < bestDist) {
            bestDist = dist;
            bestBtn = btn;
          }
        }
      }
      if (bestBtn) {
        console.log('[TikTok Auto] Step 15: Found via Method 6 (near Slate editor)', bestBtn.getBoundingClientRect());
        return bestBtn;
      }
    }

    // Debug: log all buttons
    const allBtns = document.querySelectorAll('button');
    console.log('[TikTok Auto] Step 15: DEBUG - Total buttons on page:', allBtns.length);
    allBtns.forEach((btn, i) => {
      const r = btn.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && !btn.getAttribute('aria-haspopup')) {
        console.log(`[TikTok Auto] Step 15: DEBUG btn[${i}] text="${btn.textContent?.trim().substring(0, 30)}" class="${btn.className?.substring(0, 50)}" rect=${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    });

    return null;
  };

  let generateButton = findGenerateButton();
  console.log('[TikTok Auto] Step 15: Initial search, found:', !!generateButton);
  
  if (generateButton) {
    console.log('[TikTok Auto] Step 15: Button disabled?', generateButton.disabled);
    console.log('[TikTok Auto] Step 15: Button rect:', generateButton.getBoundingClientRect());
  }

  // Retry if not found
  if (!generateButton) {
    for (let i = 0; i < 10; i++) {
      showNotification(`🔄 ลองหาปุ่ม Generate ครั้งที่ ${i + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      generateButton = findGenerateButton();
      if (generateButton) {
        console.log('[TikTok Auto] Step 15: Found button at retry', i);
        break;
      }
    }
  }

  if (!generateButton) {
    console.log('[TikTok Auto] Step 15: No Generate button found! Trying Enter key on Slate...');
    showNotification('⚠️ ไม่พบปุ่ม Generate — ลอง Enter key...');
    
    const slateForEnter = document.querySelector('[data-slate-editor="true"]');
    if (slateForEnter) {
      slateForEnter.focus();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      slateForEnter.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      slateForEnter.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      slateForEnter.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      console.log('[TikTok Auto] Step 15: Enter key dispatched on Slate editor');
      showNotification('⏎ กด Enter บน Slate แล้ว — รอ Generate...');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const progressAfterEnter = (document.body?.innerText || '').match(/(\d{1,3})%/);
      if (progressAfterEnter && parseInt(progressAfterEnter[1]) > 0) {
        console.log(`[TikTok Auto] Step 15: ✅ Enter worked! Progress: ${progressAfterEnter[1]}%`);
        showNotification(`✅ Enter สำเร็จ! Generation เริ่มแล้ว (${progressAfterEnter[1]}%)`);
        await waitForVideo16sAndSave();
        return;
      }
      
      generateButton = findGenerateButton();
      if (generateButton) {
        console.log('[TikTok Auto] Step 15: Found Generate button after Enter!');
        showNotification('✅ พบปุ่ม Generate หลัง Enter!');
      }
    }
    
    if (!generateButton) {
      console.log('[TikTok Auto] Step 15: Still no button after Enter — waiting for manual action...');
      showNotification('⚠️ ไม่พบปุ่ม Generate — กรุณากดเอง แล้วระบบจะทำต่อ');
      await new Promise(resolve => setTimeout(resolve, 30000));
      await waitForVideo16sAndSave();
      return;
    }
  }

  // ★ รอให้ปุ่มพร้อม (ไม่ disabled) - แต่ไม่เกิน 5 วินาที ★
  let waitAttempts = 0;
  const maxWait = 5;
  while (generateButton.disabled && waitAttempts < maxWait) {
    console.log(`[TikTok Auto] Step 15: Button is disabled, waiting... (${waitAttempts + 1}/${maxWait})`);
    showNotification(`⏳ ปุ่ม Generate กำลังประมวลผล รอ ${waitAttempts + 1} วิ...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    waitAttempts++;
    
    // Re-find the button in case DOM changed
    generateButton = findGenerateButton();
    if (!generateButton) break;
  }

  // ★ ถ้าปุ่มยัง disabled → ลอง simulate keyboard input บน Slate editor เพื่อ trigger React onChange ★
  if (generateButton && generateButton.disabled) {
    console.log('[TikTok Auto] Step 15: Button still disabled! Trying to trigger Slate onChange via keyboard...');
    showNotification('🔧 กำลัง trigger Slate editor...');
    
    const slateEd = document.querySelector('[data-slate-editor="true"]');
    if (slateEd) {
      slateEd.focus();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // พิมพ์ space แล้วลบออก เพื่อ trigger onChange
      slateEd.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: ' ' }));
      await new Promise(resolve => setTimeout(resolve, 200));
      slateEd.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'deleteContentBackward' }));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ลอง KeyboardEvent
      slateEd.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
      slateEd.dispatchEvent(new KeyboardEvent('keypress', { key: ' ', code: 'Space', bubbles: true }));
      slateEd.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 300));
      slateEd.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true }));
      slateEd.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', code: 'Backspace', bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[TikTok Auto] Step 15: Keyboard simulation done');
      
      // Re-check button
      generateButton = findGenerateButton();
      if (generateButton) {
        console.log('[TikTok Auto] Step 15: After keyboard sim, button disabled?', generateButton.disabled);
      }
      
      // รอเพิ่มอีก 3 วินาที
      for (let i = 0; i < 3 && generateButton?.disabled; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        generateButton = findGenerateButton();
      }
    }
  }

  if (!generateButton || !document.body.contains(generateButton)) {
    console.log('[TikTok Auto] Step 15: Button lost! Trying Enter key...');
    showNotification('⚠️ ปุ่ม Generate หายไป — ลอง Enter key...');
    
    const slateFallback = document.querySelector('[data-slate-editor="true"]');
    if (slateFallback) {
      slateFallback.focus();
      await new Promise(resolve => setTimeout(resolve, 500));
      slateFallback.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      slateFallback.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      slateFallback.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      console.log('[TikTok Auto] Step 15: Enter key dispatched (button lost fallback)');
      showNotification('⏎ กด Enter แล้ว — รอ Generate...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    await waitForVideo16sAndSave();
    return;
  }

  // ★ คลิกปุ่ม - บังคับคลิกแม้ disabled ★
  console.log('[TikTok Auto] Step 15: Clicking Generate button... (disabled:', generateButton.disabled, ')');
  showNotification('🖱️ กด Generate...');

  try {
    // Force enable button
    generateButton.disabled = false;
    generateButton.removeAttribute('disabled');
    generateButton.removeAttribute('aria-disabled');
    generateButton.style.pointerEvents = 'auto';
    console.log('[TikTok Auto] Step 15: Force enabled button');

    // Scroll into view
    generateButton.scrollIntoView({ behavior: 'instant', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 200));

    // Focus
    generateButton.focus();

    // Get position
    const rect = generateButton.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    console.log('[TikTok Auto] Step 15: Button position x:', x, 'y:', y);

    // Native click
    generateButton.click();
    console.log('[TikTok Auto] Step 15: Native click done');

    // Dispatch events
    generateButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y, button: 0 }));
    await new Promise(resolve => setTimeout(resolve, 50));
    generateButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y, button: 0 }));
    generateButton.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y, button: 0 }));
    console.log('[TikTok Auto] Step 15: Mouse events dispatched');

    // Pointer events
    generateButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
    generateButton.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
    console.log('[TikTok Auto] Step 15: Pointer events dispatched');

    // React onClick
    const reactKeys = Object.keys(generateButton);
    for (const key of reactKeys) {
      if (key.startsWith('__reactProps')) {
        const props = generateButton[key];
        if (props?.onClick) {
          props.onClick({ type: 'click', target: generateButton, currentTarget: generateButton, preventDefault() {}, stopPropagation() {} });
          console.log('[TikTok Auto] Step 15: React onClick called from', key);
        }
      }
    }

    showNotification('✅ Step 15 เสร็จ! กด Generate แล้ว!');
    console.log('[TikTok Auto] Step 15 completed!');

  } catch (error) {
    console.error('[TikTok Auto] Step 15 click error:', error);
    showNotification('⚠️ คลิกไม่สำเร็จ — กรุณากดเอง');
  }

  // ★ รอ 15 วินาที แล้วอ่าน DOM ดูว่า generation เริ่มทำงานจริงไหม ★
  console.log('[TikTok Auto] Step 15: Waiting 15s then reading DOM state...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // ★ อ่าน DOM: ถ้ามี progress % = generation กำลังทำงาน → ไม่ต้อง retry → ข้ามไป Step 16 ★
  const pageTextCheck = document.body?.innerText || '';
  const progressCheck = pageTextCheck.match(/(\d{1,3})%/);
  const hasActiveProgress = progressCheck && parseInt(progressCheck[1]) > 0 && parseInt(progressCheck[1]) <= 100;
  
  if (hasActiveProgress) {
    console.log(`[TikTok Auto] Step 15: ✅ Generation active (${progressCheck[1]}%) — skipping retry, proceeding to Step 16`);
    showNotification(`✅ Generation กำลังทำงาน (${progressCheck[1]}%) — ไป Step 16 รอ video...`);
    // ไม่ retry — ไป Step 16 เลย
  } else {
    // ★ ไม่มี progress → เช็คว่ามี "Failed" จริงไหม ★
    // Retry เฉพาะกรณี: (1) เจอ "Failed" + policy text  (2) ไม่มี progress %  (3) ไม่มี video ใหม่กำลัง load
    const maxRetries = 3;
    for (let retry = 0; retry < maxRetries; retry++) {
      const currentText = document.body?.innerText || '';
      const currentTextLower = currentText.toLowerCase();
      
      // เช็ค progress อีกครั้ง — อาจเริ่มขึ้นมาแล้ว
      const currentProgress = currentText.match(/(\d{1,3})%/);
      if (currentProgress && parseInt(currentProgress[1]) > 0 && parseInt(currentProgress[1]) <= 100) {
        console.log(`[TikTok Auto] Step 15: Progress ${currentProgress[1]}% appeared — generation started, skipping retry`);
        showNotification(`✅ Generation เริ่มแล้ว (${currentProgress[1]}%) — ไป Step 16`);
        break;
      }
      
      // เช็ค "Failed" + policy violation
      const hasFailed = (currentTextLower.includes('failed') || currentTextLower.includes('ล้มเหลว')) && 
        (currentTextLower.includes('violat') || currentTextLower.includes('polic') || currentTextLower.includes('might violate') || currentTextLower.includes('ละเมิด') || currentTextLower.includes('นโยบาย'));
      
      if (!hasFailed) {
        console.log(`[TikTok Auto] Step 15: No "Failed" detected — proceeding to Step 16`);
        break;
      }
      
      console.log(`[TikTok Auto] Step 15: ⚠️ "Failed" + no progress → Retry ${retry + 1}/${maxRetries}`);
      showNotification(`⚠️ Prompt ถูก reject (ไม่มี progress) — Retry ${retry + 1}/${maxRetries}...`);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Clear Slate editor แล้ว paste ใหม่
      const slateRetry = document.querySelector('[data-slate-editor="true"]');
      if (slateRetry) {
        slateRetry.focus();
        await new Promise(resolve => setTimeout(resolve, 300));
        slateRetry.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 200));
        slateRetry.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Paste prompt ใหม่ (extract + sanitize)
      try {
        let retryP16 = currentFlowData?.videoPrompt16 || '';
        if (retryP16 && retryP16.trim().startsWith('{')) {
          try { retryP16 = JSON.parse(retryP16).prompt_text || retryP16; } catch (e) {}
        }
        retryP16 = sanitizePromptForFlow(retryP16);
        await chrome.runtime.sendMessage({ type: 'PASTE_TO_SLATE', promptText: retryP16 });
      } catch (e) {
        console.log('[TikTok Auto] Step 15: Re-paste error:', e);
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      // ★ v3.18 FIX: ใช้ PRESS_ENTER_SLATE ผ่าน MAIN world เหมือน v3.04 ★
      try {
        await chrome.runtime.sendMessage({ type: 'PRESS_ENTER_SLATE' });
        console.log(`[TikTok Auto] Step 15: Retry ${retry + 1} — PRESS_ENTER_SLATE sent`);
      } catch (e) {}
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // กด Generate
      let retryBtn = findGenerateButton();
      if (retryBtn) {
        retryBtn.disabled = false;
        retryBtn.removeAttribute('disabled');
        retryBtn.click();
        console.log(`[TikTok Auto] Step 15: Retry ${retry + 1} — clicked Generate`);
        showNotification(`🚀 Retry ${retry + 1} — กด Generate แล้ว!`);
      } else {
        // Fallback: Enter key บน Slate editor
        console.log(`[TikTok Auto] Step 15: Retry ${retry + 1} — no button, trying Enter key`);
        const slateEnterRetry = document.querySelector('[data-slate-editor="true"]');
        if (slateEnterRetry) {
          slateEnterRetry.focus();
          await new Promise(resolve => setTimeout(resolve, 300));
          slateEnterRetry.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
          slateEnterRetry.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
          slateEnterRetry.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
          showNotification(`⏎ Retry ${retry + 1} — กด Enter แล้ว`);
        }
      }
      
      // รอ 15 วิ ดูว่า progress ขึ้นไหม
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  // ไป Step 16
  console.log('[TikTok Auto] Step 15: Proceeding to Step 16...');
  await waitForVideo16sAndSave();
}

// Step 16: รอ Video 16 วิ generate เสร็จ → กด Download → รอ 40 วิ → จับ video → อัพ TikTok
// ถ้า error ให้ retry ได้ 3 ครั้ง
async function waitForVideo16sAndSave() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 16: รอ Video 16 วิ generate + download + อัพ TikTok...');
  showNotification('⏳ Step 16: รอ Video 16 วิ Generate...');
  try { sessionStorage.setItem('extendSubStep', 'step16_waiting'); } catch (e) {}

  // ★ Helper: หาปุ่ม Download ★
  const findDownloadButton = () => {
    const buttons = document.querySelectorAll('button[aria-haspopup="menu"]');
    for (const btn of buttons) {
      if ((btn.textContent?.toLowerCase().includes('download') || btn.textContent?.includes('ดาวน์โหลด')) && btn.offsetParent !== null) return btn;
    }
    const icons = document.querySelectorAll('i.google-symbols');
    for (const icon of icons) {
      if (icon.textContent?.trim() === 'download') {
        const btn = icon.closest('button');
        if (btn) return btn;
      }
    }
    return null;
  };

  // ★ Helper: เช็ค error — อ่าน DOM อย่างระวัง ★
  // return true = error จริง (ต้อง retry), false = ปกติหรือกำลัง generate
  const checkForErrors = () => {
    const allText = document.body?.innerText || '';
    
    // ★ ถ้ามี progress % = generation กำลังทำงาน → ไม่ใช่ error ★
    const progressMatch = allText.match(/(\d{1,3})%/);
    if (progressMatch) {
      const pct = parseInt(progressMatch[1]);
      if (pct > 0 && pct <= 100) {
        console.log(`[TikTok Auto] Step 16: checkForErrors — progress ${pct}% → NOT an error`);
        return false;
      }
    }
    
    // ★ หา "Failed" card element จริงๆ — ไม่ใช่แค่ text ทั้งหน้า ★
    // หา element ที่มี "Failed" + "violate"/"policies"/"try a" อยู่ใกล้กัน (ในตัวเดียวกัน)
    const candidates = document.querySelectorAll('div, section, article');
    for (const el of candidates) {
      const t = el.textContent?.trim() || '';
      // card ที่มี "Failed" + policy message จะมี text สั้นๆ (~200 chars)
      if (t.length > 10 && t.length < 300) {
        const tLower = t.toLowerCase();
        if (tLower.includes('failed') && (tLower.includes('violat') || tLower.includes('policies') || tLower.includes('please try'))) {
          console.log('[TikTok Auto] Step 16: checkForErrors — Found "Failed" card:', t.substring(0, 80));
          return true;
        }
      }
    }
    
    return false;
  };

  // ★ Helper: fetch video จาก <video> element → base64 ★
  // ★ เลือก video ใหม่ (ไม่อยู่ใน initialVideoSrcs) ที่ duration >= 14 วิ ก่อน ★
  const fetchVideoFromElement = async () => {
    const allVids = document.querySelectorAll('video');
    let bestSrc = null;
    let bestDur = 0;
    let fallbackSrc = null;
    let fallbackDur = 0;
    
    for (const v of allVids) {
      const src = v.src || v.currentSrc || '';
      const dur = v.duration || 0;
      if (!src || src.includes('gstatic.com')) continue;
      
      const isNew = !initialVideoSrcs.has(src);
      
      // ★ ลำดับ 1: video ใหม่ที่ dur >= 14 วิ = video 16 วิ จริง ★
      if (isNew && dur >= 14 && dur > bestDur) {
        bestDur = dur;
        bestSrc = src;
        console.log('[TikTok Auto] Step 16: fetchVideo — found NEW video dur:', dur, 'src:', src.substring(0, 60));
      }
      // ★ ลำดับ 2: video ใหม่ (ยังไม่มี duration) — เป็น blob/storage ★
      if (isNew && !bestSrc && (src.startsWith('blob:') || src.includes('storage.googleapis.com'))) {
        bestSrc = src;
        bestDur = dur;
      }
      // Fallback: video ที่ยาวที่สุด (กรณีไม่เจอ video ใหม่เลย)
      if (dur > fallbackDur) {
        fallbackDur = dur;
        fallbackSrc = src;
      }
    }
    
    const targetSrc = bestSrc || fallbackSrc;
    if (!targetSrc) return null;
    
    console.log('[TikTok Auto] Step 16: Fetching video —', bestSrc ? 'NEW video' : 'FALLBACK', 'src:', targetSrc.substring(0, 100), 'dur:', bestSrc ? bestDur : fallbackDur);
    try {
      const resp = await fetch(targetSrc);
      const blob = await resp.blob();
      if (blob.size < 500000) {
        console.log('[TikTok Auto] Step 16: Blob too small:', blob.size);
        return null;
      }
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      console.log('[TikTok Auto] Step 16: ✅ Video fetched! Size:', blob.size, '(' + Math.round(blob.size / 1024 / 1024 * 10) / 10 + ' MB)');
      return { base64, size: blob.size };
    } catch (e) {
      console.log('[TikTok Auto] Step 16: Fetch error:', e.message);
      return null;
    }
  };

  // ★ จำ video src เดิม ★
  const initialVideoSrcs = new Set();
  document.querySelectorAll('video').forEach(v => {
    if (v.src) initialVideoSrcs.add(v.src);
    if (v.currentSrc) initialVideoSrcs.add(v.currentSrc);
  });
  const initialVideoCount = document.querySelectorAll('video').length;
  console.log('[TikTok Auto] Step 16: Initial videos:', initialVideoCount);

  // ★ PD-INSPIRED: Snapshot clip count ก่อน generate เพื่อเปรียบเทียบทีหลัง ★
  const preExtendState = await readFlowInternalState();
  const clipCountBefore = preExtendState.clipCount;
  const failedCountBefore = preExtendState.failedCount;
  console.log('[TikTok Auto] Step 16: Pre-extend state — clips:', clipCountBefore, 'failed:', failedCountBefore, 'hasData:', preExtendState.hasData);

  // ★★★ MAIN LOOP: รอ video generate เสร็จ — retry สูงสุด 2 ครั้งถ้า error ★★★
  const MAX_RETRIES = 2;
  let video16Base64 = null;
  let video16Size = 0;

  // ★ FIX: ดึง prompt จาก storage เพื่อใช้ตอน retry (extract + sanitize) ★
  const flowDataResult = await chrome.storage.local.get(['currentFlowData']);
  let retryPrompt = flowDataResult.currentFlowData?.videoPrompt16 || '';
  if (retryPrompt && retryPrompt.trim().startsWith('{')) {
    try { retryPrompt = JSON.parse(retryPrompt).prompt_text || retryPrompt; } catch (e) {}
  }
  retryPrompt = sanitizePromptForFlow(retryPrompt);

  for (let genRetry = 0; genRetry <= MAX_RETRIES; genRetry++) {
    if (genRetry > 0) {
      console.log(`[TikTok Auto] Step 16: ★ RETRY ${genRetry}/${MAX_RETRIES} — re-generate...`);
      showNotification(`🔄 Retry Extend ครั้งที่ ${genRetry}/${MAX_RETRIES}...`);
      
      // ★ PD-INSPIRED: ลอง clickRetryOnFailedCard ก่อน — ใช้ Flow native retry button ★
      const nativeRetryOk = await clickRetryOnFailedCard();
      if (nativeRetryOk) {
        console.log('[TikTok Auto] Step 16: ✅ Native retry button clicked! Waiting for generation...');
        showNotification('✅ กดปุ่ม Retry ของ Flow สำเร็จ! รอ generate...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Skip re-paste — native retry ใช้ prompt เดิม
      } else {
        // ★ Fallback: re-paste prompt + generate ★
        console.log('[TikTok Auto] Step 16: No native retry — re-pasting prompt...');
        if (retryPrompt) {
          showNotification('📝 วาง Prompt ใหม่...');
          try {
            await chrome.runtime.sendMessage({ type: 'PASTE_TO_SLATE', promptText: retryPrompt });
          } catch (e) {
            console.log('[TikTok Auto] Step 16: Retry paste error:', e);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          let pasteOk = false;
          try {
            const pasteResult = await chrome.runtime.sendMessage({ type: 'READ_SLATE_PASTE_RESULT' });
            pasteOk = pasteResult?.status === 'success';
          } catch (e) { }
          
          if (!pasteOk) {
            console.log('[TikTok Auto] Step 16: Retry paste failed, trying clipboard...');
            try { await navigator.clipboard.writeText(retryPrompt); } catch (e) { }
            const editor = document.querySelector('[data-slate-editor="true"]');
            if (editor) {
              editor.focus();
              editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', code: 'KeyV', ctrlKey: true, bubbles: true }));
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          console.log('[TikTok Auto] Step 16: Retry — prompt pasted, pasteOk:', pasteOk);
        }
        
        try {
          const retrySlateEd = document.querySelector('[data-slate-editor="true"]');
          if (retrySlateEd) {
            retrySlateEd.focus();
            retrySlateEd.dispatchEvent(new Event('input', { bubbles: true }));
            retrySlateEd.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } catch (e) { }
        await new Promise(resolve => setTimeout(resolve, 3000));

        let foundRetryBtn16 = false;
        const allBtns = document.querySelectorAll('button');
        for (const btn of allBtns) {
          const icons = btn.querySelectorAll('i.google-symbols');
          for (const icon of icons) {
            if (icon.textContent?.trim() === 'arrow_forward') {
              btn.disabled = false;
              btn.removeAttribute('disabled');
              btn.click();
              console.log('[TikTok Auto] Step 16: Retry — clicked Generate');
              foundRetryBtn16 = true;
              break;
            }
          }
          if (foundRetryBtn16) break;
        }
        if (!foundRetryBtn16) {
          console.log('[TikTok Auto] Step 16: Retry — no button found, trying Enter key');
          const slateEnter16 = document.querySelector('[data-slate-editor="true"]');
          if (slateEnter16) {
            slateEnter16.focus();
            await new Promise(resolve => setTimeout(resolve, 300));
            slateEnter16.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
            slateEnter16.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
            slateEnter16.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
          }
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // ★ ขั้นตอน A: รอ video 16 วิ generate เสร็จ (~3 นาที สูงสุด 5 นาที) ★
    // ★ สำคัญ: ห้ามใช้ Download button เป็นเงื่อนไข เพราะมันมีอยู่แล้วสำหรับ video 8 วิ ★
    // ★ ใช้แค่: (1) video element ใหม่ที่ duration >= 14 วิ  (2) progress หายไป (= render เสร็จ) ★
    let videoReady = false;
    let lastProgressPct = -1;
    const MIN_WAIT_SECONDS = 20; // ★ FIX: ลดจาก 60→20 วิ — เช็ค video element เร็วขึ้น ★
    
    // ★ จำ Download button เดิม เพื่อเช็คว่ามีปุ่มใหม่โผล่ ★
    const initialDownloadBtns = new Set();
    document.querySelectorAll('button, [role="button"]').forEach(btn => {
      if (btn.textContent?.toLowerCase().includes('download') || 
          btn.querySelector('i.google-symbols')?.textContent?.trim() === 'download') {
        initialDownloadBtns.add(btn);
      }
    });
    
    for (let attempt = 1; attempt <= 180; attempt++) {
      if (await isFlowStopped()) return;
      // ★ Crash check ★
      if (isPageCrashed()) {
        console.log('[TikTok Auto] Step 16: Page CRASHED during 16s video wait!');
        await notifyFlowFailed('Page crashed during Step 16 video 16s generation');
        return;
      }
      // ★ Failed / Policy violation check — เช็คทุก 2 วิตั้งแต่ attempt 5 ★
      if (attempt > 5 && attempt % 2 === 0) {
        const failCheck = isGenerationFailed();
        if (failCheck.failed) {
          console.log(`[TikTok Auto] Step 16: Generation FAILED! ${failCheck.reason} — ${failCheck.text}`);
          // ★ v2.72 FIX: policy_violation → retry ด้วย (ไม่ skip ทันที เพราะ Google Flow อาจผ่านรอบถัดไป) ★
          showNotification(`❌ Generation Failed: ${failCheck.reason} — ${genRetry < MAX_RETRIES ? 'retry...' : 'ข้ามรายการ'}`);
          break; // ออกจาก inner loop ไป retry (รวม policy ด้วย)
        }
      }

      // แสดง progress
      if (attempt % 10 === 0 || attempt <= 3) {
        console.log(`[TikTok Auto] Step 16: Waiting for video 16s generation... (${attempt}/300 วิ)`);
        showNotification(`⏳ รอ Video 16 วิ Generate... (${attempt} วิ)`);
      }

      // เช็ค progress % จากหน้าเว็บ (เช่น "44%")
      const pageText = document.body?.innerText || '';
      const progressMatch = pageText.match(/(\d{1,3})%/);
      if (progressMatch) {
        const pct = parseInt(progressMatch[1]);
        if (pct !== lastProgressPct && pct > 0 && pct <= 100) {
          lastProgressPct = pct;
          if (attempt % 5 === 0 || pct >= 95) {
            console.log(`[TikTok Auto] Step 16: Generation progress: ${pct}%`);
            showNotification(`⏳ Video 16 วิ กำลัง Generate... ${pct}%`);
          }
          // ★ FIX: progress 100% → เสร็จแน่ → ไม่ต้องรอ MIN_WAIT ★
          if (pct >= 100 && attempt >= 10) {
            console.log('[TikTok Auto] Step 16: ✅ Progress reached 100%! Checking video...');
            await new Promise(resolve => setTimeout(resolve, 3000)); // รอ 3 วิ ให้ DOM อัพเดท
            const vids = document.querySelectorAll('video');
            for (const v of vids) {
              const src = v.src || v.currentSrc || '';
              if (src && !initialVideoSrcs.has(src) && !src.includes('gstatic.com')) {
                console.log('[TikTok Auto] Step 16: ✅ 100% + new video found! dur:', v.duration);
                videoReady = true;
                break;
              }
            }
            if (videoReady) break;
          }
        }
      }

      // ★ FIX: เช็ค Download button ใหม่ — ถ้ามีปุ่ม download ที่ไม่เคยมีก่อน = video เสร็จ ★
      if (attempt >= 15 && attempt % 3 === 0) {
        const allBtns = document.querySelectorAll('button, [role="button"]');
        for (const btn of allBtns) {
          const isDownload = btn.textContent?.toLowerCase().includes('download') ||
            btn.querySelector('i.google-symbols')?.textContent?.trim() === 'download';
          if (isDownload && !initialDownloadBtns.has(btn)) {
            console.log('[TikTok Auto] Step 16: ✅ New Download button appeared! Video generation done.');
            showNotification('✅ พบปุ่ม Download ใหม่! Video เสร็จแล้ว');
            videoReady = true;
            break;
          }
        }
        if (videoReady) break;
      }

      // ★ เช็ค error ตั้งแต่ 10 วิ ทุก 5 วิ — ถ้าเจอ Failed + ไม่มี progress → retry เร็ว ★
      if (attempt >= 10 && attempt % 5 === 0) {
        if (checkForErrors()) {
          console.log('[TikTok Auto] Step 16: ❌ "Failed" card detected + no progress → retry!');
          showNotification(`❌ Prompt ถูก reject! ${genRetry < MAX_RETRIES ? 'กำลัง retry...' : 'หมด retry แล้ว'}`);
          break; // ออกจาก loop ไป retry
        }
      }

      // ★ เช็ค video ใหม่ที่ duration >= 14 วิ (ต้องรอขั้นต่ำ MIN_WAIT_SECONDS) ★
      if (attempt >= MIN_WAIT_SECONDS) {
        const videos = document.querySelectorAll('video');
        for (const v of videos) {
          const src = v.src || v.currentSrc || '';
          const dur = v.duration || 0;
          if (src && !initialVideoSrcs.has(src) && !src.includes('gstatic.com')) {
            // ★ ต้องมี duration >= 14 วิ จริง ถึงจะถือว่าเป็น video 16 วิ ★
            if (dur >= 14 && !isNaN(dur)) {
              console.log('[TikTok Auto] Step 16: ✅ New 16s video detected! dur:', dur, 'src:', src.substring(0, 80));
              videoReady = true;
              break;
            }
            // หรือ src ใหม่ที่ไม่ใช่ video เดิม + เป็น blob/storage
            if ((src.startsWith('blob:') || src.includes('storage.googleapis.com')) && attempt >= 120) {
              console.log('[TikTok Auto] Step 16: ✅ New video with blob/storage src after 2 min! src:', src.substring(0, 80));
              videoReady = true;
              break;
            }
          }
        }
        if (videoReady) break;
        
        // ★ เช็ค: progress หายไปแล้ว (ไม่มี % ในหน้า) + มี video count เพิ่ม = generation เสร็จ ★
        if (attempt >= 90 && lastProgressPct > 0 && !progressMatch) {
          const currentCount = document.querySelectorAll('video').length;
          if (currentCount > initialVideoCount) {
            console.log('[TikTok Auto] Step 16: ✅ Progress gone + new video count! Generation likely done.');
            videoReady = true;
            break;
          }
        }
      }

      // ★ PD-INSPIRED: readFlowInternalState — ตรวจ clip count จาก React state ★
      if (attempt >= 15 && attempt % 10 === 0 && preExtendState.hasData) {
        const currentState = await readFlowInternalState();
        if (currentState.hasData) {
          const newClips = currentState.clipCount - clipCountBefore;
          const newFailed = currentState.failedCount - failedCountBefore;
          console.log(`[TikTok Auto] Step 16: Internal state — clips: ${clipCountBefore}→${currentState.clipCount} (+${newClips}), failed: ${failedCountBefore}→${currentState.failedCount} (+${newFailed}), generating: ${currentState.generatingCount}`);
          
          if (newClips > 0 && currentState.generatingCount === 0) {
            console.log('[TikTok Auto] Step 16: ✅ New clip detected via internal state! (clip count increased)');
            showNotification('✅ Extend สำเร็จ! (Internal state: clip count +' + newClips + ')');
            videoReady = true;
            break;
          }
          if (newFailed > 0 && currentState.generatingCount === 0) {
            console.log('[TikTok Auto] Step 16: ❌ Failed clip via internal state! (failed count increased)');
            showNotification('❌ Extend failed (Internal state: failed +' + newFailed + ')');
            break;
          }
        }
      }

      // ★ PD-INSPIRED: Stuck detection + reload recovery ★
      // ถ้ารอ 150 วิ (2.5 นาที) + ไม่มี progress + ไม่มี video ใหม่ → reload + resume
      if (attempt === 150 && lastProgressPct <= 0) {
        let extReloadCount = 0;
        try { extReloadCount = parseInt(sessionStorage.getItem('extendRetryCount') || '0'); } catch (e) {}
        if (extReloadCount < 2) {
          console.log('[TikTok Auto] Step 16: ⚠️ STUCK — no progress after 150s, reloading page (attempt ' + extReloadCount + ')');
          showNotification('⚠️ ค้าง — Reload หน้า แล้ว resume ต่อ...');
          try {
            sessionStorage.setItem('extendSubStep', 'step16_waiting');
            sessionStorage.setItem('extendRetryCount', String(extReloadCount + 1));
          } catch (e) {}
          window.location.reload();
          return;
        }
      }

      // Debug log ทุก 30 วินาที
      if (attempt % 30 === 0) {
        const allVids = document.querySelectorAll('video');
        console.log(`[TikTok Auto] Step 16: DEBUG — ${allVids.length} videos, initial: ${initialVideoCount}`);
        allVids.forEach((v, i) => {
          const src = v.src || v.currentSrc || 'none';
          const isNew = !initialVideoSrcs.has(src);
          console.log(`  video[${i}]: ${isNew ? '🆕' : '  '} dur=${(v.duration || 0).toFixed(1)}s src=${src.substring(0, 70)}`);
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!videoReady) {
      console.log(`[TikTok Auto] Step 16: Video not ready (retry ${genRetry}/${MAX_RETRIES})`);
      if (genRetry < MAX_RETRIES) {
        // ★ PD-INSPIRED: ลอง clickRetryOnFailedCard ก่อน continue retry loop ★
        const nativeRetryBefore = await clickRetryOnFailedCard();
        if (nativeRetryBefore) {
          console.log('[TikTok Auto] Step 16: Native retry clicked before loop continue');
        }
        continue;
      }
      // ★ Last resort: แจ้ง sidepanel พร้อม failedStep เพื่อ resume ★
      showNotification('⚠️ Video 16 วิ ไม่สำเร็จหลัง retry ทั้งหมด');
      await notifyFlowFailed('Video 16s generation failed after all retries', 13);
      return;
    }

    // ★ ขั้นตอน B: Video generate เสร็จ! จับ video จาก element ทันที ★
    console.log('[TikTok Auto] Step 16: ✅ Video 16s generation confirmed!');
    showNotification('✅ Video 16 วิ Generate เสร็จ! กำลังจับ video...');

    try {
      const fetchResult = await fetchVideoFromElement();
      if (fetchResult) {
        video16Base64 = fetchResult.base64;
        video16Size = fetchResult.size;
        console.log('[TikTok Auto] Step 16: ✅ Got video 16s! Size:', video16Size);
        showNotification('✅ จับ Video 16 วิ สำเร็จ! (' + Math.round(video16Size / 1024 / 1024 * 10) / 10 + ' MB)');
      }
    } catch (e) {
      console.log('[TikTok Auto] Step 16: Fetch video error:', e.message);
    }

    // ★ ขั้นตอน C: กดปุ่ม Download (720p) ★
    console.log('[TikTok Auto] Step 16: Looking for Download button...');
    showNotification('📥 กำลังกด Download...');

    // Reset video capture ก่อน download
    try { await chrome.runtime.sendMessage({ type: 'RESET_VIDEO_CAPTURE' }); } catch (e) { }

    let downloadBtn = null;
    for (let i = 0; i < 10; i++) {
      downloadBtn = findDownloadButton();
      if (downloadBtn) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (downloadBtn) {
      // ★ ขั้น 1: กด Download → เปิด submenu (Full Video / Clip 1 / Clip 2 / Zip) ★
      await simulateRealClick(downloadBtn);
      console.log('[TikTok Auto] Step 16: ✅ Download button clicked! Waiting for submenu...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ★ ขั้น 2: หา "Full Video" แล้วกด → เปิด submenu (720p / Original Size) ★
      let fullVideoOption = null;
      for (let fv = 0; fv < 10; fv++) {
        // หา menuitem / button ที่มีคำว่า "Full Video" หรือ "Full video"
        const menuItems = document.querySelectorAll('button[role="menuitem"], [role="menuitem"], [role="option"], button, div[role="button"]');
        for (const item of menuItems) {
          const t = item.textContent?.trim() || '';
           if ((/full\s*video/i.test(t) || t.includes('วิดีโอเต็ม')) && item.offsetParent !== null) {
            fullVideoOption = item;
            break;
          }
        }
        // Fallback: หา span ที่มี "Full Video"
        if (!fullVideoOption) {
          const spans = document.querySelectorAll('span, div, li');
          for (const s of spans) {
            const t = s.textContent?.trim() || '';
            if (/^Full\s*Video$/i.test(t) && s.offsetParent !== null) {
              fullVideoOption = s.closest('button') || s.closest('[role="menuitem"]') || s.parentElement;
              break;
            }
          }
        }
        if (fullVideoOption) break;
        // ถ้าไม่เจอ ลองกด Download อีกครั้ง
        if (fv === 3 || fv === 6) {
          await simulateRealClick(downloadBtn);
          console.log('[TikTok Auto] Step 16: Re-clicked Download button');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (fullVideoOption) {
        console.log('[TikTok Auto] Step 16: ✅ Found "Full Video" — clicking...');
        showNotification('📥 กด Full Video...');
        await simulateRealClick(fullVideoOption);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ★ ขั้น 3: หา 720p ใน submenu ★
        let option720 = null;
        for (let dd = 0; dd < 10; dd++) {
          // หา menuitem ที่มี "720"
          const items = document.querySelectorAll('button[role="menuitem"], [role="menuitem"], [role="option"], button, div[role="button"]');
          for (const item of items) {
            if (item.textContent?.includes('720') && item.offsetParent !== null) {
              option720 = item;
              break;
            }
          }
          // หา span "720p"
          if (!option720) {
            const spans = document.querySelectorAll('span, div');
            for (const s of spans) {
              if (s.textContent?.trim().includes('720') && s.offsetParent !== null) {
                option720 = s.closest('button') || s.closest('[role="menuitem"]') || s.parentElement;
                break;
              }
            }
          }
          if (option720) break;
          // Re-click Full Video ถ้าไม่เจอ
          if (dd === 3 || dd === 6) await simulateRealClick(fullVideoOption);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (option720) {
          await simulateRealClick(option720);
          console.log('[TikTok Auto] Step 16: ✅ 720p clicked!');
          showNotification('✅ เลือก Full Video → 720p แล้ว!');
        } else {
          console.log('[TikTok Auto] Step 16: 720p not found — trying Original Size');
          // Fallback: กด "Original Size" ถ้ามี
          const origItems = document.querySelectorAll('button[role="menuitem"], [role="menuitem"], [role="option"], button');
          for (const item of origItems) {
            if (item.textContent?.includes('Original') && item.offsetParent !== null) {
              await simulateRealClick(item);
              console.log('[TikTok Auto] Step 16: ✅ Original Size clicked!');
              showNotification('✅ เลือก Full Video → Original Size!');
              break;
            }
          }
        }
      } else {
        console.log('[TikTok Auto] Step 16: "Full Video" not found — trying direct 720p');
        showNotification('⚠️ ไม่เจอ Full Video — ลองหา 720p ตรง');
        // Fallback: ลองหา 720p ตรงเลย (สำหรับ UI เก่า)
        const items = document.querySelectorAll('button[role="menuitem"], [role="option"]');
        for (const item of items) {
          if (item.textContent?.includes('720') && item.offsetParent !== null) {
            await simulateRealClick(item);
            console.log('[TikTok Auto] Step 16: ✅ Direct 720p clicked (fallback)!');
            break;
          }
        }
      }
    } else {
      console.log('[TikTok Auto] Step 16: Download button not found');
      showNotification('⚠️ ไม่พบปุ่ม Download');
    }

    // ★ ขั้นตอน D: รอ download ~40 วินาที ★
    console.log('[TikTok Auto] Step 16: Waiting 40s for download to complete...');
    showNotification('⏳ รอ Download เสร็จ (~40 วินาที)...');
    for (let w = 0; w < 40; w++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (w % 10 === 0) showNotification(`⏳ รอ Download... (${w}/40 วิ)`);
    }

    // ★ ขั้นตอน E1: ลอง READ_CAPTURED_BLOB จาก intercept-blob.js (MAIN world) — วิธีที่เชื่อถือได้ที่สุด ★
    // intercept-blob.js จับ video blob ตอน Google สร้าง blob URL สำหรับ download → base64 พร้อมใช้
    console.log('[TikTok Auto] Step 16: Trying READ_CAPTURED_BLOB (intercept-blob.js)...');
    for (let poll = 0; poll < 10; poll++) {
      try {
        const result = await chrome.runtime.sendMessage({ type: 'READ_CAPTURED_BLOB' });
        if (result?.status === 'success' && result.base64) {
          const capSize = result.size || 0;
          console.log('[TikTok Auto] Step 16: READ_CAPTURED_BLOB success! Size:', capSize, 'source:', result.source, 'current video16Size:', video16Size);
          // ★ ใช้ video จาก intercept เสมอ ถ้ามันใหญ่กว่า preview ★
          if (!video16Base64 || capSize > video16Size) {
            video16Base64 = result.base64;
            video16Size = capSize;
            console.log('[TikTok Auto] Step 16: ✅ Using INTERCEPTED video! Size:', video16Size, '(' + Math.round(video16Size / 1024 / 1024 * 10) / 10 + ' MB)');
            showNotification('✅ จับ Video 16 วิ จาก intercept! (' + Math.round(video16Size / 1024 / 1024 * 10) / 10 + ' MB)');
          }
          break;
        } else if (result?.status === 'converting') {
          console.log('[TikTok Auto] Step 16: READ_CAPTURED_BLOB converting... polling');
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        } else {
          console.log('[TikTok Auto] Step 16: READ_CAPTURED_BLOB status:', result?.status);
          if (poll >= 3) break;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (e) {
        console.log('[TikTok Auto] Step 16: READ_CAPTURED_BLOB error:', e.message);
        break;
      }
    }

    // ★ ขั้นตอน E2: ลอง FETCH_VIDEO_BLOB จาก background (offscreen download capture) ★
    if (!video16Base64 || video16Size < 1000000) {
      console.log('[TikTok Auto] Step 16: Trying FETCH_VIDEO_BLOB (background download capture)...');
      for (let poll = 0; poll < 10; poll++) {
        try {
          const result = await chrome.runtime.sendMessage({ type: 'FETCH_VIDEO_BLOB' });
          if (result?.status === 'success' && result.base64) {
            const dlSize = result.size || 0;
            console.log('[TikTok Auto] Step 16: FETCH_VIDEO_BLOB success! Size:', dlSize);
            if (!video16Base64 || dlSize > video16Size) {
              video16Base64 = result.base64;
              video16Size = dlSize;
              console.log('[TikTok Auto] Step 16: ✅ Using DOWNLOADED video! Size:', video16Size);
              showNotification('✅ ใช้ Video จาก Download! (' + Math.round(video16Size / 1024 / 1024 * 10) / 10 + ' MB)');
            }
            break;
          } else if (result?.status === 'downloading' || result?.status === 'reading') {
            console.log('[TikTok Auto] Step 16: FETCH_VIDEO_BLOB status:', result.status);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          } else {
            console.log('[TikTok Auto] Step 16: FETCH_VIDEO_BLOB status:', result?.status);
            if (poll >= 3) break;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (e) {
          console.log('[TikTok Auto] Step 16: FETCH_VIDEO_BLOB error:', e.message);
          break;
        }
      }
    }

    // ★ ขั้นตอน F: ถ้ายังไม่มี → ลอง fetch จาก element อีกครั้ง ★
    if (!video16Base64) {
      try {
        const fetchResult = await fetchVideoFromElement();
        if (fetchResult) {
          video16Base64 = fetchResult.base64;
          video16Size = fetchResult.size;
          console.log('[TikTok Auto] Step 16: ✅ Got video from element (last fallback)! Size:', video16Size);
        }
      } catch (e) { }
    }

    // ถ้าได้ video แล้ว → ออกจาก retry loop
    if (video16Base64) break;
    console.log('[TikTok Auto] Step 16: ⚠️ No video captured, will retry if possible');
  }

  // ★ บันทึก videoBlob (16 วิ) ลง storage ★
  console.log('[TikTok Auto] Step 16: Saving video to storage...');
  try {
    const flowData = await getSafeFlowData();
    const saveData = {
      ...flowData,
      videoDownloaded16: true,
      videoDownloadedAt16: new Date().toISOString(),
      clipDuration16: 16
    };
    if (video16Base64) {
      saveData.videoBlob = video16Base64;
      saveData.videoSize = video16Size;
      saveData.clipDuration = 16;
      console.log('[TikTok Auto] Step 16: ✅ Saved 16s video! Size:', video16Size);
      showNotification('💾 บันทึก Video 16 วิ สำเร็จ! (' + Math.round(video16Size / 1024 / 1024 * 10) / 10 + ' MB)');
    } else {
      console.log('[TikTok Auto] Step 16: ⚠️ No video16 base64 — TikTok จะใช้ video เดิม');
      showNotification('⚠️ ไม่มี video 16 วิ — ใช้ video เดิม');
    }
    await chrome.storage.local.set({
      currentFlowData: saveData,
      flowStatus: 'video_downloaded_16s',
      flowMessage: 'Video 16 วินาที พร้อมอัพโหลด TikTok'
    });
  } catch (e) {
    console.log('[TikTok Auto] Step 16: Storage save error:', e);
  }

  // ★ PD-INSPIRED: Clear session state — extend completed successfully ★
  try { sessionStorage.removeItem('extendSubStep'); sessionStorage.removeItem('extendRetryCount'); } catch (e) {}

  // ★ ไป Step 17: เปิด TikTok Upload ★
  console.log('[TikTok Auto] Step 16 completed! → Step 17');
  showNotification('✅ Step 16 เสร็จ! เตรียมอัพ TikTok...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  await retryStep(() => openTikTokFor16sVideo(), 'Step 17: Open TikTok Upload');
}

// Step 17: เปิด TikTok Upload สำหรับ video 16 วิ (videoBlob ใน storage เป็น 16 วิ แล้วจาก Step 16)
async function openTikTokFor16sVideo() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 17: Opening TikTok Upload for 16s video...');
  showNotification('🔗 Step 17: เปิด TikTok Upload สำหรับ Video 16 วิ...');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // ตรวจสอบว่า videoBlob ใน storage เป็น 16 วิ จริง
  try {
    const storageResult = await chrome.storage.local.get(['currentFlowData']);
    const flowData = storageResult.currentFlowData || {};
    const hasBlob = !!(flowData.videoBlob);
    const blobLen = flowData.videoBlob?.length || 0;
    const clipDur = flowData.clipDuration || 0;
    console.log(`[TikTok Auto] Step 17: videoBlob exists: ${hasBlob}, length: ${blobLen}, clipDuration: ${clipDur}`);

    if (!hasBlob) {
      console.log('[TikTok Auto] Step 17: ⚠️ No videoBlob in storage — TikTok อาจอัพโหลดไม่ได้');
      showNotification('⚠️ ไม่มี videoBlob ใน storage — ลองอัพโหลดไฟล์ที่ดาวน์โหลดเอง');
    } else {
      console.log('[TikTok Auto] Step 17: ✅ videoBlob ready (16s) — TikTok จะอัพโหลดอัตโนมัติ');
      showNotification('✅ Video 16 วิ พร้อมอัพโหลด TikTok!');
    }
  } catch (e) {
    console.log('[TikTok Auto] Step 17: Storage check error:', e);
  }

  // ★ แจ้ง sidepanel ก่อน navigate ออก ★
  try {
    await chrome.runtime.sendMessage({
      source: 'google-flow',
      type: 'STEP_COMPLETED',
      data: { itemId: currentFlowData?.itemId, mode: 'video' }
    });
  } catch (e) {
    console.log('[TikTok Auto] Could not notify sidepanel:', e);
  }

  // เปิด TikTok Upload
  window.location.href = 'https://www.tiktok.com/tiktokstudio/upload';

  console.log('[TikTok Auto] === ALL STEPS COMPLETED (16s flow)! ===');
}

// Step 5: Click Upload button and inject image from URL
async function clickUploadAndInjectImage() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 5: Looking for Upload button...');
  showNotification('🔍 กำลังหาปุ่ม Upload...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find Upload button (icon with "upload" text)
  let uploadButton = null;
  const uploadIcons = document.querySelectorAll('i.google-symbols, i[class*="google-symbols"], .google-symbols');
  for (const icon of uploadIcons) {
    const text = icon.textContent?.trim().toLowerCase() || '';
    if (text === 'upload') {
      uploadButton = icon.closest('button') || icon.closest('[role="button"]') || icon.parentElement;
      console.log('[TikTok Auto] Found upload icon:', icon, 'Parent:', uploadButton);
      break;
    }
  }

  if (!uploadButton) {
    // Try finding by text
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const text = el.textContent?.trim().toLowerCase() || '';
      if (text === 'upload' && el.offsetParent !== null) {
        uploadButton = el.closest('button') || el;
        console.log('[TikTok Auto] Found upload by text:', uploadButton);
        break;
      }
    }
  }

  if (uploadButton) {
    console.log('[TikTok Auto] Clicking Upload button...');
    showNotification('🖱️ กดปุ่ม Upload...');

    // Before clicking, set up file input listener
    await setupFileInputListener();

    uploadButton.click();

    // delay เพื่อป้องกัน Policy จับบอท
    showNotification('⏳ รอ 2 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    showNotification('✅ กด Upload แล้ว - รอใส่รูป...');
  } else {
    console.log('[TikTok Auto] Upload button not found');
    showNotification('⚠️ ไม่พบปุ่ม Upload');
  }
}

// Setup listener to intercept file input and inject image
async function setupFileInputListener() {
  // Get image URL from storage
  const result = await chrome.storage.local.get(['currentFlowData']);
  const imageUrl = result.currentFlowData?.imageUrl;

  if (!imageUrl) {
    console.log('[TikTok Auto] No image URL found in flow data');
    showNotification('⚠️ ไม่พบ URL รูปภาพ');
    return;
  }

  console.log('[TikTok Auto] Image URL:', imageUrl);

  // Listen for file input being added to DOM or clicked
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeName === 'INPUT' && node.type === 'file') {
          console.log('[TikTok Auto] Found file input:', node);
          observer.disconnect();
          await injectImageToInput(node, imageUrl);
          return;
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Also check for existing file inputs
  const existingInputs = document.querySelectorAll('input[type="file"]');
  if (existingInputs.length > 0) {
    console.log('[TikTok Auto] Found existing file input');
    observer.disconnect();
    await injectImageToInput(existingInputs[0], imageUrl);
  }

  // Timeout after 5 seconds
  setTimeout(() => {
    observer.disconnect();
  }, 5000);
}

// Fetch image from URL and inject into file input
async function injectImageToInput(fileInput, imageUrl) {
  console.log('[TikTok Auto] Fetching image from URL:', imageUrl);
  showNotification('📥 กำลังดึงรูปภาพ...');

  try {
    // Fetch image
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Create File object
    const fileName = 'product-image.jpg';
    const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });

    // Create DataTransfer to set files
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    // Set files to input
    fileInput.files = dataTransfer.files;

    // Dispatch change event
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.dispatchEvent(new Event('input', { bubbles: true }));

    console.log('[TikTok Auto] Image injected to file input!');
    showNotification('⏳ รอรูปประมวลผล...');

    // ★ DOM Polling: รอจนรูปแสดงจริงในหน้า (max 30 วิ สำหรับคอมช้า) ★
    let imageLoaded = false;
    for (let wait = 0; wait < 30; wait++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // เช็คว่ามี image preview ปรากฏ (img ที่มี blob: src หรือ data: src ใหม่)
      const previewImgs = document.querySelectorAll('img');
      for (const img of previewImgs) {
        const src = img.src || '';
        if ((src.startsWith('blob:') || src.startsWith('data:')) && img.offsetParent !== null && img.naturalWidth > 50) {
          console.log('[TikTok Auto] Image preview detected! src:', src.substring(0, 60));
          imageLoaded = true;
          break;
        }
      }
      if (imageLoaded) break;
      
      // เช็คว่ามี canvas (crop UI) ปรากฏ
      const canvases = document.querySelectorAll('canvas');
      if (canvases.length > 0) {
        console.log('[TikTok Auto] Canvas (crop UI) detected!');
        imageLoaded = true;
        break;
      }
      
      // เช็คว่า dropdown Landscape/Portrait ปรากฏ = รูป process เสร็จแล้ว
      const comboboxes = document.querySelectorAll('button[role="combobox"]');
      for (const cb of comboboxes) {
        const t = cb.textContent?.toLowerCase() || '';
        if (t.includes('landscape') || t.includes('portrait') || t.includes('square')) {
          console.log('[TikTok Auto] Aspect ratio dropdown appeared — image ready!');
          imageLoaded = true;
          break;
        }
      }
      if (imageLoaded) break;
      
      // เช็คว่ามีปุ่ม "Crop and Save" ปรากฏ = รูปพร้อมแล้ว
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent?.toLowerCase().includes('crop') && btn.textContent?.toLowerCase().includes('save')) {
          console.log('[TikTok Auto] Crop and Save button appeared — image ready!');
          imageLoaded = true;
          break;
        }
      }
      if (imageLoaded) break;
      
      if (wait % 5 === 0) {
        console.log(`[TikTok Auto] Waiting for image to process... (${wait}/30 วิ)`);
        showNotification(`⏳ รอรูปประมวลผล... (${wait} วิ)`);
      }
    }
    
    if (imageLoaded) {
      console.log('[TikTok Auto] ✅ Image uploaded and processed!');
      showNotification('✅ รูปอัพโหลดสำเร็จ!');
    } else {
      console.log('[TikTok Auto] ⚠️ Image process timeout (30s) — proceeding anyway');
      showNotification('⚠️ รอนานเกิน 30 วิ — ไปต่อ');
    }
    
    // รอเพิ่มอีก 1 วิ เพื่อให้ UI stable
    await new Promise(resolve => setTimeout(resolve, 1000));
    await selectPortraitAndCropSave();

  } catch (error) {
    console.error('[TikTok Auto] Error fetching/injecting image:', error);
    showNotification('❌ ไม่สามารถดึงรูปได้: ' + error.message);
  }
}

// Step 6: Select Portrait from dropdown and click Crop and Save
async function selectPortraitAndCropSave() {
  console.log('[TikTok Auto] Step 6: Looking for aspect ratio dropdown...');
  showNotification('🔍 กำลังหา dropdown...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find dropdown with Landscape/Portrait (has crop_9_16 or crop_16_9 icon)
  let aspectDropdown = null;

  // Method 1: Find by role="combobox" with crop icon
  const comboboxes = document.querySelectorAll('button[role="combobox"]');
  for (const el of comboboxes) {
    const text = el.textContent?.trim().toLowerCase() || '';
    if (text.includes('landscape') || text.includes('portrait') || text.includes('square')) {
      aspectDropdown = el;
      console.log('[TikTok Auto] Found aspect ratio dropdown:', el);
      break;
    }
  }

  // Method 2: Find by crop icon
  if (!aspectDropdown) {
    const cropIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of cropIcons) {
      const text = icon.textContent?.trim() || '';
      if (text.includes('crop_')) {
        aspectDropdown = icon.closest('button[role="combobox"]') || icon.closest('button');
        if (aspectDropdown) {
          console.log('[TikTok Auto] Found dropdown by crop icon:', aspectDropdown);
          break;
        }
      }
    }
  }

  if (aspectDropdown) {
    console.log('[TikTok Auto] Clicking aspect ratio dropdown...');
    showNotification('🖱️ กด dropdown...');

    aspectDropdown.click();

    // delay เพื่อป้องกัน Policy จับบอท
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find and click Portrait option
    console.log('[TikTok Auto] Looking for Portrait option...');
    let portraitOption = null;

    const menuItems = document.querySelectorAll('[role="option"], [role="menuitem"], [data-radix-collection-item]');
    for (const item of menuItems) {
      const text = item.textContent?.trim().toLowerCase() || '';
      if (text.includes('portrait')) {
        portraitOption = item;
        console.log('[TikTok Auto] Found Portrait option:', item);
        break;
      }
    }

    // Also try broader search
    if (!portraitOption) {
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = el.textContent?.trim();
        if (text === 'Portrait' || text === 'portrait') {
          if (el.offsetParent !== null) {
            portraitOption = el.closest('[role="option"]') || el;
            console.log('[TikTok Auto] Found Portrait by text:', portraitOption);
            break;
          }
        }
      }
    }

    if (portraitOption) {
      console.log('[TikTok Auto] Clicking Portrait option...');
      showNotification('🖱️ เลือก Portrait...');

      portraitOption.click();

      // delay เพื่อป้องกัน Policy จับบอท
      showNotification('⏳ รอ 2 วินาที...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification('✅ เลือก Portrait แล้ว!');

      // Now click Crop and Save button
      await clickCropAndSave();
    } else {
      console.log('[TikTok Auto] Portrait option not found');
      showNotification('⚠️ ไม่พบ Portrait option');
    }
  } else {
    console.log('[TikTok Auto] Aspect ratio dropdown not found');
    showNotification('⚠️ ไม่พบ dropdown');
  }
}

// Click Crop and Save button
async function clickCropAndSave() {
  console.log('[TikTok Auto] Looking for Crop and Save button...');
  showNotification('🔍 กำลังหา Crop and Save...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  let cropButton = null;

  // Find button with "Crop and Save" text or crop icon
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = btn.textContent?.trim().toLowerCase() || '';
    if ((text.includes('crop') && text.includes('save')) || text.includes('ครอปและบันทึก') || text.includes('ครอบตัดและบันทึก')) {
      cropButton = btn;
      console.log('[TikTok Auto] Found Crop and Save button:', btn);
      break;
    }
  }

  // Also try finding by crop icon
  if (!cropButton) {
    const cropIcons = document.querySelectorAll('i.material-icons');
    for (const icon of cropIcons) {
      if (icon.textContent?.trim() === 'crop') {
        const parentBtn = icon.closest('button');
        if (parentBtn && parentBtn.textContent?.toLowerCase().includes('save')) {
          cropButton = parentBtn;
          console.log('[TikTok Auto] Found Crop and Save by icon:', cropButton);
          break;
        }
      }
    }
  }

  if (cropButton) {
    console.log('[TikTok Auto] Clicking Crop and Save button...');
    showNotification('🖱️ กด Crop and Save...');

    cropButton.click();

    // ★ DOM Polling: รอจน crop dialog หายไป = save เสร็จ (max 20 วิ) ★
    showNotification('⏳ รอ Crop and Save ประมวลผล...');
    let cropDone = false;
    for (let wait = 0; wait < 20; wait++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // เช็คว่าปุ่ม Crop and Save หายไปแล้ว = dialog ปิดแล้ว
      const stillHasCrop = [...document.querySelectorAll('button')].some(
        btn => btn.textContent?.toLowerCase().includes('crop') && btn.textContent?.toLowerCase().includes('save') && btn.offsetParent !== null
      );
      if (!stillHasCrop) {
        console.log('[TikTok Auto] Crop dialog closed — save completed!');
        cropDone = true;
        break;
      }
      
      if (wait % 5 === 0 && wait > 0) {
        console.log(`[TikTok Auto] Waiting for crop to finish... (${wait}/20 วิ)`);
        showNotification(`⏳ รอ Crop ประมวลผล... (${wait} วิ)`);
      }
    }
    
    if (cropDone) {
      showNotification('✅ Crop and Save เสร็จสิ้น!');
    } else {
      showNotification('⚠️ Crop timeout — ไปต่อ');
    }
    
    // รอ UI stable อีก 2 วิ
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('[TikTok Auto] Step 6 completed!');

    // Step 7: Check if character image exists, upload it
    await retryStep(() => uploadCharacterImageIfExists(), 'Step 4b: Upload Character Image');
  } else {
    console.log('[TikTok Auto] Crop and Save button not found');
    showNotification('⚠️ ไม่พบปุ่ม Crop and Save');
  }
}

// Step 7: Upload character image if exists in flow data (OLD - DISABLED)
async function uploadCharacterImageIfExistsOLD_STEP7() {
  console.log('[TikTok Auto] Step 7: Checking for character image... (OLD DISABLED)');

  // Get character URL from storage
  const result = await chrome.storage.local.get(['currentFlowData']);
  console.log('[TikTok Auto] Flow data:', result.currentFlowData);
  const characterUrl = result.currentFlowData?.characterUrl;
  console.log('[TikTok Auto] Character URL:', characterUrl);

  if (!characterUrl) {
    console.log('[TikTok Auto] No character image found, skipping to Step 8');
    showNotification('⏭️ ไม่มีรูปตัวละคร - ข้ามไป Settings');

    // Continue to Step 8: Settings (skip character upload)
    await clickSettingsButton();
    return;
  }

  console.log('[TikTok Auto] Character image found:', characterUrl);
  showNotification('🎭 พบรูปตัวละคร - รอรูปแรกอัพโหลด 10 วิ...');

  // Wait for first image to finish processing (wait for add button to appear)
  // ต้องรอประมาณ 10 วินาทีให้รูปแรกอัพโหลดเสร็จ add button จึงจะขึ้นมา
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Find the second add button (for character image)
  let addButton = null;

  // Find add icon button
  const addIcons = document.querySelectorAll('i.google-symbols');
  for (const icon of addIcons) {
    const text = icon.textContent?.trim().toLowerCase() || '';
    if (text === 'add') {
      const parentBtn = icon.closest('button');
      if (parentBtn && parentBtn.offsetParent !== null) {
        addButton = parentBtn;
        console.log('[TikTok Auto] Found add button for character:', addButton);
        break;
      }
    }
  }

  if (addButton) {
    console.log('[TikTok Auto] Clicking add button for character image...');
    showNotification('🖱️ กด Add สำหรับรูปตัวละคร...');

    addButton.click();

    // delay เพื่อป้องกัน Policy จับบอท
    showNotification('⏳ รอ 2 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now upload character image (similar to Step 5)
    await uploadCharacterImage(characterUrl);
  } else {
    console.log('[TikTok Auto] Add button for character not found');
    showNotification('⚠️ ไม่พบปุ่ม Add สำหรับตัวละคร');
  }
}

// Upload character image from URL
async function uploadCharacterImage(characterUrl) {
  console.log('[TikTok Auto] Uploading character image...');
  showNotification('🔍 กำลังหาปุ่ม Upload...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find Upload button
  let uploadButton = null;
  const uploadIcons = document.querySelectorAll('i.google-symbols');
  for (const icon of uploadIcons) {
    const text = icon.textContent?.trim().toLowerCase() || '';
    if (text === 'upload') {
      uploadButton = icon.closest('button') || icon.parentElement;
      break;
    }
  }

  if (uploadButton) {
    console.log('[TikTok Auto] Clicking Upload button for character...');
    showNotification('🖱️ กด Upload...');

    // Setup listener for file input
    await setupCharacterFileInputListener(characterUrl);

    uploadButton.click();

    // delay เพื่อป้องกัน Policy จับบอท
    showNotification('⏳ รอ 2 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log('[TikTok Auto] Upload button not found for character');
    showNotification('⚠️ ไม่พบปุ่ม Upload');
  }
}

// Setup listener for character file input
async function setupCharacterFileInputListener(characterUrl) {
  console.log('[TikTok Auto] Setting up character file input listener...');

  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeName === 'INPUT' && node.type === 'file') {
          console.log('[TikTok Auto] Found file input for character:', node);
          observer.disconnect();
          await injectCharacterImageToInput(node, characterUrl);
          return;
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Check existing file inputs
  const existingInputs = document.querySelectorAll('input[type="file"]');
  if (existingInputs.length > 0) {
    observer.disconnect();
    await injectCharacterImageToInput(existingInputs[0], characterUrl);
  }

  setTimeout(() => observer.disconnect(), 5000);
}

// Inject character image to file input
async function injectCharacterImageToInput(fileInput, characterUrl) {
  console.log('[TikTok Auto] Fetching character image from URL:', characterUrl);
  showNotification('📥 กำลังดึงรูปตัวละคร...');

  try {
    const response = await fetch(characterUrl);
    const blob = await response.blob();

    const fileName = 'character-image.jpg';
    const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    fileInput.files = dataTransfer.files;

    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.dispatchEvent(new Event('input', { bubbles: true }));

    console.log('[TikTok Auto] Character image injected successfully!');
    showNotification('✅ อัพโหลดรูปตัวละครสำเร็จ!');

    // Wait then do Portrait + Crop and Save for character
    // delay เพื่อป้องกัน Policy จับบอท
    showNotification('⏳ รอ 3 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await selectPortraitAndCropSaveForCharacter();

  } catch (error) {
    console.error('[TikTok Auto] Error fetching character image:', error);
    showNotification('❌ ไม่สามารถดึงรูปตัวละครได้');
  }
}

// Select Portrait and Crop and Save for character image
async function selectPortraitAndCropSaveForCharacter() {
  console.log('[TikTok Auto] Selecting Portrait for character image...');
  showNotification('🔍 กำลังหา dropdown สำหรับตัวละคร...');

  // delay ก่อนหา dropdown Portrait
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find dropdown with Landscape/Portrait
  let aspectDropdown = null;
  const comboboxes = document.querySelectorAll('button[role="combobox"]');
  for (const el of comboboxes) {
    const text = el.textContent?.trim().toLowerCase() || '';
    if (text.includes('landscape') || text.includes('portrait') || text.includes('square')) {
      aspectDropdown = el;
      break;
    }
  }

  // Method 2: Find by crop icon
  if (!aspectDropdown) {
    const cropIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of cropIcons) {
      const text = icon.textContent?.trim() || '';
      if (text.includes('crop_')) {
        aspectDropdown = icon.closest('button[role="combobox"]') || icon.closest('button');
        if (aspectDropdown) break;
      }
    }
  }

  if (aspectDropdown) {
    console.log('[TikTok Auto] Clicking aspect ratio dropdown for character...');
    showNotification('🖱️ กด dropdown...');

    aspectDropdown.click();

    // delay หลังกด dropdown
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find and click Portrait option
    let portraitOption = null;
    const menuItems = document.querySelectorAll('[role="option"], [role="menuitem"], [data-radix-collection-item]');
    for (const item of menuItems) {
      const text = item.textContent?.trim().toLowerCase() || '';
      if (text.includes('portrait')) {
        portraitOption = item;
        break;
      }
    }

    if (portraitOption) {
      console.log('[TikTok Auto] Clicking Portrait option for character...');
      showNotification('🖱️ เลือก Portrait...');

      portraitOption.click();

      // delay หลังเลือก Portrait
      showNotification('⏳ รอ 2 วินาที...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification('✅ เลือก Portrait แล้ว!');

      // Now click Crop and Save button
      await clickCropAndSaveForCharacter();
    } else {
      console.log('[TikTok Auto] Portrait option not found for character');
      showNotification('⚠️ ไม่พบ Portrait option');
    }
  } else {
    console.log('[TikTok Auto] Aspect ratio dropdown not found for character');
    showNotification('⚠️ ไม่พบ dropdown');
  }
}

// Click Crop and Save button for character image
async function clickCropAndSaveForCharacter() {
  console.log('[TikTok Auto] Looking for Crop and Save button for character...');
  showNotification('🔍 กำลังหา Crop and Save...');

  // delay ก่อนหา Crop and Save
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  let cropButton = null;
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = btn.textContent?.trim().toLowerCase() || '';
    if ((text.includes('crop') && text.includes('save')) || text.includes('ครอปและบันทึก') || text.includes('ครอบตัดและบันทึก')) {
      cropButton = btn;
      break;
    }
  }

  if (cropButton) {
    console.log('[TikTok Auto] Clicking Crop and Save button for character...');
    showNotification('🖱️ กด Crop and Save...');

    cropButton.click();

    // delay หลังกด Crop and Save + รอรูปอัพโหลดเสร็จ
    showNotification('⏳ รอรูปอัพโหลดเสร็จ 3 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[TikTok Auto] Step 7 completed - Character image uploaded!');
    showNotification('✅ Step 7 เสร็จสิ้น - รูปตัวละครอัพโหลดแล้ว!');

    // Continue to Step 8: Settings
    await clickSettingsButton();
  } else {
    console.log('[TikTok Auto] Crop and Save button not found for character');
    showNotification('⚠️ ไม่พบปุ่ม Crop and Save');
  }
}

// Step 8: Click Settings button (tune icon)
async function clickSettingsButton() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 8: Looking for Settings button...');
  showNotification('🔍 กำลังหาปุ่ม Settings...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  let settingsButton = null;

  // Find button with tune icon
  const tuneIcons = document.querySelectorAll('i.material-icons');
  for (const icon of tuneIcons) {
    const text = icon.textContent?.trim().toLowerCase() || '';
    if (text === 'tune') {
      settingsButton = icon.closest('button');
      if (settingsButton) {
        console.log('[TikTok Auto] Found Settings button:', settingsButton);
        break;
      }
    }
  }

  if (settingsButton) {
    console.log('[TikTok Auto] Clicking Settings button...');
    showNotification('🖱️ กด Settings...');

    settingsButton.click();

    // delay หลังกด Settings
    showNotification('⏳ รอ 2 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[TikTok Auto] Step 8 completed!');
    showNotification('✅ เปิด Settings แล้ว!');

    // Continue to Step 9: Select Outputs per Prompt = 1
    await selectOutputsPerPrompt();
  } else {
    console.log('[TikTok Auto] Settings button not found');
    showNotification('⚠️ ไม่พบปุ่ม Settings');
  }
}

// Step 9: Select Outputs per Prompt = 1
async function selectOutputsPerPrompt() {
  console.log('[TikTok Auto] Step 9: Looking for Outputs per Prompt dropdown...');
  showNotification('🔍 กำลังหา Outputs per Prompt...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find dropdown with "Outputs per Prompt" text
  let outputsDropdown = null;
  const allElements = document.querySelectorAll('button, div[role="combobox"]');
  for (const el of allElements) {
    const text = el.textContent?.toLowerCase() || '';
    if ((text.includes('outputs') && text.includes('prompt')) || text.includes('ผลลัพธ์ต่อพรอมต์') || text.includes('ผลลัพธ์')) {
      outputsDropdown = el;
      console.log('[TikTok Auto] Found Outputs per Prompt dropdown:', el);
      break;
    }
  }

  // Also try finding by arrow_drop_down icon near "Outputs"
  if (!outputsDropdown) {
    const labels = document.querySelectorAll('label, span, div');
    for (const label of labels) {
      const text = label.textContent?.toLowerCase() || '';
      if ((text.includes('outputs') && text.includes('prompt')) || text.includes('ผลลัพธ์ต่อพรอมต์') || text.includes('ผลลัพธ์')) {
        // Find nearby dropdown
        const parent = label.closest('div');
        if (parent) {
          const dropdown = parent.querySelector('button, [role="combobox"]');
          if (dropdown) {
            outputsDropdown = dropdown;
            break;
          }
        }
      }
    }
  }

  if (outputsDropdown) {
    console.log('[TikTok Auto] Clicking Outputs per Prompt dropdown...');
    showNotification('🖱️ กด Outputs per Prompt dropdown...');

    outputsDropdown.click();

    // delay หลังกด dropdown
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find and click option "1"
    let option1 = null;
    const options = document.querySelectorAll('[role="option"], [role="menuitem"], [data-radix-collection-item]');
    for (const opt of options) {
      const text = opt.textContent?.trim() || '';
      if (text === '1') {
        option1 = opt;
        console.log('[TikTok Auto] Found option 1:', opt);
        break;
      }
    }

    if (option1) {
      console.log('[TikTok Auto] Clicking option 1...');
      showNotification('🖱️ เลือก 1...');

      option1.click();

      // delay หลังเลือก
      showNotification('⏳ รอ 2 วินาที...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('[TikTok Auto] Step 9 completed!');
      showNotification('✅ เลือก Outputs per Prompt = 1 แล้ว!');

      // Continue to Step 10: Select Aspect Ratio
      await selectAspectRatio();
    } else {
      console.log('[TikTok Auto] Option 1 not found');
      showNotification('⚠️ ไม่พบ Option 1');
    }
  } else {
    console.log('[TikTok Auto] Outputs per Prompt dropdown not found');
    showNotification('⚠️ ไม่พบ Outputs per Prompt dropdown');
  }
}

// Step 10: Select Aspect Ratio = Portrait 9:16 for Image
async function selectAspectRatio() {
  console.log('[TikTok Auto] Step 10: Looking for Aspect Ratio dropdown...');
  showNotification('🔍 กำลังหา Aspect Ratio dropdown...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find Aspect Ratio dropdown
  let aspectRatioDropdown = null;
  const allElements = document.querySelectorAll('button, div[role="combobox"]');
  for (const el of allElements) {
    const text = el.textContent?.toLowerCase() || '';
    if ((text.includes('aspect') && text.includes('ratio')) || text.includes('อัตราส่วนภาพ') || text.includes('สัดส่วนภาพ') || text.includes('อัตราส่วน')) {
      aspectRatioDropdown = el;
      console.log('[TikTok Auto] Found Aspect Ratio dropdown:', el);
      break;
    }
  }

  // Also try finding by label
  if (!aspectRatioDropdown) {
    const labels = document.querySelectorAll('label, span, div');
    for (const label of labels) {
      const text = label.textContent?.toLowerCase() || '';
      if ((text.includes('aspect') && text.includes('ratio')) || text.includes('อัตราส่วนภาพ') || text.includes('สัดส่วนภาพ') || text.includes('อัตราส่วน')) {
        const parent = label.closest('div');
        if (parent) {
          const dropdown = parent.querySelector('button, [role="combobox"]');
          if (dropdown) {
            aspectRatioDropdown = dropdown;
            break;
          }
        }
      }
    }
  }

  if (aspectRatioDropdown) {
    console.log('[TikTok Auto] Clicking Aspect Ratio dropdown...');
    showNotification('🖱️ กด Aspect Ratio dropdown...');

    aspectRatioDropdown.click();

    // delay หลังกด dropdown
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find and click "Portrait 9:16" option
    let portraitOption = null;
    const options = document.querySelectorAll('[role="option"], [role="menuitem"], [data-radix-collection-item]');
    for (const opt of options) {
      const text = opt.textContent?.toLowerCase() || '';
      if ((text.includes('portrait') || text.includes('แนวตั้ง')) && text.includes('9:16')) {
        portraitOption = opt;
        console.log('[TikTok Auto] Found Portrait 9:16 option:', opt);
        break;
      }
    }

    if (portraitOption) {
      console.log('[TikTok Auto] Clicking Portrait 9:16...');
      showNotification('🖱️ เลือก Portrait 9:16...');

      portraitOption.click();

      // delay หลังเลือก
      showNotification('⏳ รอ 2 วินาที...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('[TikTok Auto] Step 10 completed!');
      showNotification('✅ เลือก Aspect Ratio = Portrait 9:16 แล้ว!');

      // Continue to Step 11: Paste Image Prompt
      await pasteImagePrompt();
    } else {
      console.log('[TikTok Auto] Portrait 9:16 option not found');
      showNotification('⚠️ ไม่พบ Portrait 9:16 - ข้ามไปวาง Prompt');
      // Continue anyway
      await pasteImagePrompt();
    }
  } else {
    console.log('[TikTok Auto] Aspect Ratio dropdown not found');
    showNotification('⚠️ ไม่พบ Aspect Ratio dropdown - ข้ามไปวาง Prompt');
    // Continue anyway
    await pasteImagePrompt();
  }
}

// Step 11: Paste Image Prompt from Sidebar to Google Flow textarea
async function pasteImagePrompt() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 11: Pasting Image Prompt...');
  showNotification('📝 กำลังวาง Image Prompt...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get Image Prompt from storage (flowData)
  const result = await chrome.storage.local.get(['currentFlowData']);
  // ★ รองรับทั้ง imagePrompt (Pipeline) และ prompt (Auto 8/16 วิ) ★
  const imagePrompt = result.currentFlowData?.imagePrompt || result.currentFlowData?.prompt;

  console.log('[TikTok Auto] Image Prompt:', imagePrompt?.substring(0, 100));

  if (!imagePrompt) {
    console.log('[TikTok Auto] No Image Prompt found');
    showNotification('⚠️ ไม่พบ Image Prompt');
    return;
  }

  // Find the textarea with id="PINHOLE_TEXT_AREA_ELEMENT_ID"
  let promptTextarea = document.getElementById('PINHOLE_TEXT_AREA_ELEMENT_ID');

  // Also try finding by placeholder
  if (!promptTextarea) {
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      const placeholder = ta.placeholder?.toLowerCase() || '';
      if (placeholder.includes('generate') && placeholder.includes('image')) {
        promptTextarea = ta;
        console.log('[TikTok Auto] Found textarea by placeholder:', ta);
        break;
      }
    }
  }

  if (promptTextarea) {
    console.log('[TikTok Auto] Found prompt textarea:', promptTextarea);
    showNotification('📝 วาง Prompt...');

    // Focus and set value
    promptTextarea.focus();
    promptTextarea.value = imagePrompt;

    // Dispatch events to trigger React state update
    promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    promptTextarea.dispatchEvent(new Event('change', { bubbles: true }));

    // Also try using native input setter for React
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeInputValueSetter.call(promptTextarea, imagePrompt);
    promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));

    // delay หลังวาง Prompt
    showNotification('⏳ รอ 2 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[TikTok Auto] Step 11 completed!');
    showNotification('✅ วาง Image Prompt เสร็จแล้ว!');

    // Continue to Step 12: Click Generate button
    await clickGenerateButtonOLD();
  } else {
    console.log('[TikTok Auto] Prompt textarea not found');
    showNotification('⚠️ ไม่พบ textarea สำหรับ Prompt');
  }
}

// Step 12 (OLD): Click Generate button (arrow_forward icon)
async function clickGenerateButtonOLD() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 12: Looking for Generate button...');
  showNotification('🔍 กำลังหาปุ่ม Generate...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Function to find generate button
  const findGenerateButton = () => {
    // Method 1: Find button with arrow_forward icon (google-symbols class)
    const arrowIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of arrowIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'arrow_forward' || text === 'send') {
        const btn = icon.closest('button');
        if (btn && document.body.contains(btn)) {
          return btn;
        }
      }
    }

    // Method 2: Find by material-icons class
    const materialIcons = document.querySelectorAll('i.material-icons');
    for (const icon of materialIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'arrow_forward' || text === 'send') {
        const btn = icon.closest('button');
        if (btn && document.body.contains(btn)) {
          return btn;
        }
      }
    }

    // Method 3: Find by button with submit/generate text
    const allButtons = document.querySelectorAll('button[type="submit"], button[aria-label*="Generate"], button[aria-label*="Send"]');
    for (const btn of allButtons) {
      if (document.body.contains(btn)) {
        return btn;
      }
    }

    return null;
  };

  let generateButton = findGenerateButton();

  // Retry if not found
  if (!generateButton) {
    for (let i = 0; i < 3; i++) {
      showNotification(`🔄 ลองหาปุ่ม Generate ครั้งที่ ${i + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      generateButton = findGenerateButton();
      if (generateButton) break;
    }
  }

  if (generateButton && document.body.contains(generateButton)) {
    console.log('[TikTok Auto] Clicking Generate button...');
    showNotification('🖱️ กด Generate...');

    try {
      generateButton.click();
    } catch (e) {
      console.log('[TikTok Auto] Click failed, trying alternative method...');
      generateButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }

    // delay หลังกด Generate
    showNotification('⏳ รอ 3 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[TikTok Auto] Step 12 completed!');
    showNotification('✅ กด Generate แล้ว!');

    // Continue to Step 13: Wait for image generation and click Add To Prompt
    await waitAndClickAddToPrompt();
  } else {
    console.log('[TikTok Auto] Generate button not found');
    showNotification('⚠️ ไม่พบปุ่ม Generate - กรุณากดเองแล้วรอ');
  }
}

// Helper function for retry logic
async function retryWithHover(findButtonFn, maxRetries = 5, retryDelay = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[TikTok Auto] Retry attempt ${attempt}/${maxRetries}...`);
    showNotification(`🔄 ลองครั้งที่ ${attempt}/${maxRetries}...`);

    // Find and hover over any large image/video
    const images = document.querySelectorAll('img, video');
    let targetElement = null;

    for (const el of images) {
      const width = el.width || el.offsetWidth || 0;
      const height = el.height || el.offsetHeight || 0;
      if (width > 100 && height > 100) {
        targetElement = el;
        break;
      }
    }

    if (targetElement) {
      // Simulate comprehensive hover events
      const rect = targetElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const hoverEvents = ['mouseenter', 'mouseover', 'mousemove', 'pointerenter', 'pointerover', 'pointermove'];
      for (const eventType of hoverEvents) {
        const event = new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: centerX,
          clientY: centerY
        });
        targetElement.dispatchEvent(event);

        // Also dispatch to parent elements
        let parent = targetElement.parentElement;
        let depth = 0;
        while (parent && parent !== document.body && depth < 10) {
          parent.dispatchEvent(new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: centerX,
            clientY: centerY
          }));
          parent = parent.parentElement;
          depth++;
        }
      }

      // Also try clicking on the element to trigger hover state
      const clickableParent = targetElement.closest('[class*="card"], [class*="item"], [class*="result"]');
      if (clickableParent) {
        clickableParent.dispatchEvent(new MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: centerX,
          clientY: centerY
        }));
      }
    }

    // Wait for hover menu to appear
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to find the button
    const button = findButtonFn();
    if (button) {
      return button;
    }

    // Wait before next retry
    if (attempt < maxRetries) {
      showNotification(`⏳ รอ ${retryDelay / 1000} วินาทีก่อนลองใหม่...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  return null;
}

// Step 13: Wait for image generation (30 seconds) and click Add To Prompt
async function waitAndClickAddToPrompt() {
  console.log('[TikTok Auto] Step 13: Waiting for image generation...');
  showNotification('⏳ รอ Image Generate 30 วินาที...');

  // Wait 30 seconds for image generation (เช็ค stop ทุก 2 วิ)
  if (!await safeDelay(30000)) return;

  console.log('[TikTok Auto] Looking for generated image to hover...');
  showNotification('🔍 กำลังหารูปที่ Generate แล้ว...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Function to find Add To Prompt button
  const findAddToPromptButton = () => {
    // Method 1: Find by prompt_suggestion icon
    const promptIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of promptIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'prompt_suggestion') {
        const btn = icon.closest('button');
        if (btn) {
          console.log('[TikTok Auto] Found Add To Prompt button by icon:', btn);
          return btn;
        }
      }
    }

    // Method 2: Find by button text
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      const text = btn.textContent?.toLowerCase() || '';
      if (text.includes('add to prompt') || ((text.includes('add') || text.includes('เพิ่ม')) && (text.includes('prompt') || text.includes('พรอมต์')))) {
        console.log('[TikTok Auto] Found Add To Prompt button by text:', btn);
        return btn;
      }
    }

    return null;
  };

  // First attempt - hover and find button
  let generatedImage = null;
  const images = document.querySelectorAll('img');

  // Find image in the output area
  for (const img of images) {
    const parent = img.closest('[class*="output"], [class*="result"], [class*="generated"]');
    if (parent) {
      generatedImage = img;
      console.log('[TikTok Auto] Found generated image:', img);
      break;
    }
  }

  // If not found, try finding any large image
  if (!generatedImage) {
    for (const img of images) {
      if (img.width > 100 && img.height > 100) {
        generatedImage = img;
        console.log('[TikTok Auto] Found large image as generated:', img);
        break;
      }
    }
  }

  if (generatedImage) {
    console.log('[TikTok Auto] Hovering over generated image...');
    showNotification('🖱️ Hover ที่รูปภาพ...');

    // Simulate mouse hover events
    const rect = generatedImage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const hoverEvents = ['mouseenter', 'mouseover', 'mousemove'];
    for (const eventType of hoverEvents) {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: centerX,
        clientY: centerY
      });
      generatedImage.dispatchEvent(event);

      // Also dispatch to parent elements
      let parent = generatedImage.parentElement;
      while (parent && parent !== document.body) {
        parent.dispatchEvent(new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        parent = parent.parentElement;
      }
    }

    // Wait for hover menu to appear
    showNotification('⏳ รอ menu ขึ้น 2 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Try to find button
  console.log('[TikTok Auto] Looking for Add To Prompt button...');
  showNotification('🔍 กำลังหาปุ่ม Add To Prompt...');

  let addToPromptButton = findAddToPromptButton();

  // If not found, use retry logic
  if (!addToPromptButton) {
    console.log('[TikTok Auto] Add To Prompt button not found, starting retry...');
    showNotification('⚠️ ไม่พบปุ่ม - เริ่ม Retry...');

    addToPromptButton = await retryWithHover(findAddToPromptButton, 5, 3000);
  }

  if (addToPromptButton) {
    console.log('[TikTok Auto] Clicking Add To Prompt button...');
    showNotification('🖱️ กด Add To Prompt...');

    addToPromptButton.click();

    // delay หลังกด Add To Prompt
    showNotification('⏳ รอ 3 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[TikTok Auto] Step 13 completed!');
    showNotification('✅ กด Add To Prompt แล้ว!');

    // Continue to Step 14: Change dropdown from Create Image to Frames To Video
    await changeToFramesToVideo();
  } else {
    console.log('[TikTok Auto] Add To Prompt button not found after all retries');
    showNotification('❌ ไม่พบปุ่ม Add To Prompt หลังลอง 5 ครั้ง');
    showNotification('⚠️ กรุณาตรวจสอบว่า Image Generate เสร็จแล้ว');
  }
}

// Step 14: Change dropdown from Create Image to Frames To Video
async function changeToFramesToVideo() {
  console.log('[TikTok Auto] Step 14: Changing to Frames To Video...');
  showNotification('🔍 กำลังหา Dropdown Create Image...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find dropdown with "Create Image" text
  let createImageDropdown = null;

  // Method 1: Find by span text
  const spans = document.querySelectorAll('span');
  for (const span of spans) {
    const text = span.textContent?.trim().toLowerCase() || '';
    if (text === 'create image') {
      // Find parent button or clickable element
      createImageDropdown = span.closest('button') || span.closest('[role="combobox"]') || span.closest('[class*="dropdown"]') || span.parentElement;
      if (createImageDropdown) {
        console.log('[TikTok Auto] Found Create Image dropdown:', createImageDropdown);
        break;
      }
    }
  }

  // Method 2: Find by button text
  if (!createImageDropdown) {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      if (text.includes('create image') || text.includes('สร้างรูปภาพ')) {
        createImageDropdown = btn;
        console.log('[TikTok Auto] Found Create Image button:', btn);
        break;
      }
    }
  }

  if (createImageDropdown) {
    console.log('[TikTok Auto] Clicking Create Image dropdown...');
    showNotification('🖱️ กด Dropdown...');

    createImageDropdown.click();

    // delay หลังกด dropdown
    showNotification('⏳ รอ 1.5 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find and click "Frames To Video" option
    let framesToVideoOption = null;
    const options = document.querySelectorAll('[role="option"], [role="menuitem"], [data-radix-collection-item], li, div[class*="option"], div[class*="menu-item"]');
    for (const opt of options) {
      const text = opt.textContent?.toLowerCase() || '';
      if ((text.includes('frame') || text.includes('เฟรม')) && (text.includes('video') || text.includes('วิดีโอ'))) {
        framesToVideoOption = opt;
        console.log('[TikTok Auto] Found Frames To Video option:', opt);
        break;
      }
    }

    // Also try finding by exact text
    if (!framesToVideoOption) {
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = el.textContent?.trim().toLowerCase() || '';
        if (text === 'frames to video' || text === 'frame to video' || text === 'เฟรมเป็นวิดีโอ') {
          framesToVideoOption = el;
          console.log('[TikTok Auto] Found Frames To Video by exact text:', el);
          break;
        }
      }
    }

    if (framesToVideoOption) {
      console.log('[TikTok Auto] Clicking Frames To Video option...');
      showNotification('🖱️ เลือก Frames To Video...');

      framesToVideoOption.click();

      // delay หลังเลือก
      showNotification('⏳ รอ 2 วินาที...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('[TikTok Auto] Step 14 completed!');
      showNotification('✅ เปลี่ยนเป็น Frames To Video แล้ว!');

      // Continue to Step 15: Settings for Video
      await clickSettingsForVideo();
    } else {
      console.log('[TikTok Auto] Frames To Video option not found');
      showNotification('⚠️ ไม่พบ Frames To Video option');
    }
  } else {
    console.log('[TikTok Auto] Create Image dropdown not found');
    showNotification('⚠️ ไม่พบ Dropdown Create Image');
  }
}

// Step 15: Click Settings for Video, select Outputs per Prompt = 1, Aspect Ratio = Portrait 9:16
async function clickSettingsForVideo() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 15: Looking for Settings button for Video...');
  showNotification('🔍 กำลังหาปุ่ม Settings สำหรับ Video...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  let settingsButton = null;

  // Find button with tune icon (material-icons-outlined class)
  const tuneIcons = document.querySelectorAll('i.material-icons-outlined, i.material-icons');
  for (const icon of tuneIcons) {
    const text = icon.textContent?.trim().toLowerCase() || '';
    if (text === 'tune') {
      settingsButton = icon.closest('button');
      if (settingsButton) {
        console.log('[TikTok Auto] Found Settings button for Video:', settingsButton);
        break;
      }
    }
  }

  if (settingsButton) {
    console.log('[TikTok Auto] Clicking Settings button for Video...');
    showNotification('🖱️ กด Settings...');

    settingsButton.click();

    // delay หลังกด Settings
    showNotification('⏳ รอ 2 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[TikTok Auto] Settings opened!');
    showNotification('✅ เปิด Settings แล้ว!');

    // Continue to select Outputs per Prompt = 1
    await selectOutputsPerPromptForVideo();
  } else {
    console.log('[TikTok Auto] Settings button not found for Video');
    showNotification('⚠️ ไม่พบปุ่ม Settings');
  }
}

// Step 15b: Select Outputs per Prompt = 1 for Video
async function selectOutputsPerPromptForVideo() {
  console.log('[TikTok Auto] Step 15b: Looking for Outputs per Prompt dropdown...');
  showNotification('🔍 กำลังหา Outputs per Prompt...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find dropdown with "Outputs per Prompt" text
  let outputsDropdown = null;
  const comboboxes = document.querySelectorAll('button[role="combobox"]');
  for (const el of comboboxes) {
    const text = el.textContent?.toLowerCase() || '';
    if ((text.includes('outputs') && text.includes('prompt')) || text.includes('ผลลัพธ์ต่อพรอมต์') || text.includes('ผลลัพธ์')) {
      outputsDropdown = el;
      console.log('[TikTok Auto] Found Outputs per Prompt dropdown:', el);
      break;
    }
  }

  if (outputsDropdown) {
    console.log('[TikTok Auto] Clicking Outputs per Prompt dropdown...');
    showNotification('🖱️ กด Outputs per Prompt dropdown...');

    outputsDropdown.click();

    // delay หลังกด dropdown
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find and click option "1"
    let option1 = null;
    const options = document.querySelectorAll('[role="option"], [role="menuitem"], [data-radix-collection-item]');
    for (const opt of options) {
      const text = opt.textContent?.trim() || '';
      if (text === '1') {
        option1 = opt;
        console.log('[TikTok Auto] Found option 1:', opt);
        break;
      }
    }

    if (option1) {
      console.log('[TikTok Auto] Clicking option 1...');
      showNotification('🖱️ เลือก 1...');

      option1.click();

      // delay หลังเลือก
      showNotification('⏳ รอ 2 วินาที...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('[TikTok Auto] Outputs per Prompt = 1 selected!');
      showNotification('✅ เลือก Outputs per Prompt = 1 แล้ว!');

      // Continue to select Aspect Ratio = Portrait 9:16
      await selectAspectRatioForVideo();
    } else {
      console.log('[TikTok Auto] Option 1 not found');
      showNotification('⚠️ ไม่พบตัวเลือก 1');
    }
  } else {
    console.log('[TikTok Auto] Outputs per Prompt dropdown not found');
    showNotification('⚠️ ไม่พบ Outputs per Prompt dropdown');
  }
}

// Step 15c: Select Aspect Ratio = Portrait 9:16 for Video
async function selectAspectRatioForVideo() {
  console.log('[TikTok Auto] Step 15c: Looking for Aspect Ratio dropdown...');
  showNotification('🔍 กำลังหา Aspect Ratio dropdown...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find dropdown with "Aspect Ratio" text
  let aspectDropdown = null;
  const comboboxes = document.querySelectorAll('button[role="combobox"]');
  for (const el of comboboxes) {
    const text = el.textContent?.toLowerCase() || '';
    if ((text.includes('aspect') && text.includes('ratio')) || text.includes('อัตราส่วนภาพ') || text.includes('สัดส่วนภาพ') || text.includes('อัตราส่วน')) {
      aspectDropdown = el;
      console.log('[TikTok Auto] Found Aspect Ratio dropdown:', el);
      break;
    }
  }

  // Also try finding by arrow_drop_down icon near Aspect Ratio label
  if (!aspectDropdown) {
    const labels = document.querySelectorAll('span');
    for (const label of labels) {
      const text = label.textContent?.toLowerCase() || '';
      if ((text.includes('aspect') && text.includes('ratio')) || text.includes('อัตราส่วนภาพ') || text.includes('สัดส่วนภาพ') || text.includes('อัตราส่วน')) {
        const parent = label.closest('button[role="combobox"]') || label.closest('button');
        if (parent) {
          aspectDropdown = parent;
          break;
        }
      }
    }
  }

  if (aspectDropdown) {
    console.log('[TikTok Auto] Clicking Aspect Ratio dropdown...');
    showNotification('🖱️ กด Aspect Ratio dropdown...');

    aspectDropdown.click();

    // delay หลังกด dropdown
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find and click Portrait (9:16) option
    let portraitOption = null;
    const options = document.querySelectorAll('[role="option"], [role="menuitem"], [data-radix-collection-item]');
    for (const opt of options) {
      const text = opt.textContent?.toLowerCase() || '';
      if ((text.includes('portrait') || text.includes('แนวตั้ง')) && text.includes('9:16')) {
        portraitOption = opt;
        console.log('[TikTok Auto] Found Portrait 9:16 option:', opt);
        break;
      }
    }

    if (portraitOption) {
      console.log('[TikTok Auto] Clicking Portrait 9:16...');
      showNotification('🖱️ เลือก Portrait 9:16...');

      portraitOption.click();

      // delay หลังเลือก
      showNotification('⏳ รอ 2 วินาที...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('[TikTok Auto] Step 15 completed!');
      showNotification('✅ เลือก Aspect Ratio = Portrait 9:16 แล้ว!');

      // Continue to Step 16: Paste Video Prompt (8 วิ)
      await pasteVideoPrompt();
    } else {
      console.log('[TikTok Auto] Portrait 9:16 option not found');
      showNotification('⚠️ ไม่พบ Portrait 9:16');
    }
  } else {
    console.log('[TikTok Auto] Aspect Ratio dropdown not found');
    showNotification('⚠️ ไม่พบ Aspect Ratio dropdown');
  }
}

// Step 16: Paste Video Prompt (8 วิ) from Sidebar to Google Flow textarea
async function pasteVideoPrompt() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 16: Pasting Video Prompt...');
  showNotification('🔍 กำลังหา Video Prompt...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get video prompt from storage
  const result = await chrome.storage.local.get(['currentFlowData']);
  const flowData = result.currentFlowData;

  // Use videoPrompt8 for 8 second video
  const videoPrompt = flowData?.videoPrompt8 || flowData?.prompt || '';

  if (!videoPrompt) {
    console.log('[TikTok Auto] No Video Prompt found in flowData');
    showNotification('⚠️ ไม่พบ Video Prompt');
    return;
  }

  console.log('[TikTok Auto] Video Prompt:', videoPrompt.substring(0, 100) + '...');
  showNotification('📝 พบ Video Prompt!');

  // Find the textarea
  let promptTextarea = document.getElementById('PINHOLE_TEXT_AREA_ELEMENT_ID');

  // Also try finding by placeholder
  if (!promptTextarea) {
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      const placeholder = ta.placeholder?.toLowerCase() || '';
      if (placeholder.includes('video') || placeholder.includes('generate')) {
        promptTextarea = ta;
        break;
      }
    }
  }

  if (promptTextarea) {
    console.log('[TikTok Auto] Found textarea, pasting Video Prompt...');
    showNotification('📝 วาง Video Prompt...');

    // Set value and trigger React events
    promptTextarea.focus();
    promptTextarea.value = videoPrompt;

    // Trigger input events for React
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeInputValueSetter.call(promptTextarea, videoPrompt);

    promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    promptTextarea.dispatchEvent(new Event('change', { bubbles: true }));

    // delay หลังวาง prompt
    showNotification('⏳ รอ 2 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[TikTok Auto] Step 16 completed!');
    showNotification('✅ วาง Video Prompt แล้ว!');

    // Continue to Step 17: Click Generate for Video
    await clickGenerateForVideo();
  } else {
    console.log('[TikTok Auto] Textarea not found');
    showNotification('⚠️ ไม่พบ textarea');
  }
}

// Step 17: Click Generate button for Video
async function clickGenerateForVideo() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 17: Looking for Generate button...');
  showNotification('🔍 กำลังหาปุ่ม Generate...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Function to find generate button
  const findGenerateButton = () => {
    // Method 1: Find button with arrow_forward icon
    const arrowIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of arrowIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'arrow_forward' || text === 'send') {
        const btn = icon.closest('button');
        if (btn && document.body.contains(btn)) {
          return btn;
        }
      }
    }

    // Method 2: Find by material-icons
    const materialIcons = document.querySelectorAll('i.material-icons');
    for (const icon of materialIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'arrow_forward' || text === 'send') {
        const btn = icon.closest('button');
        if (btn && document.body.contains(btn)) {
          return btn;
        }
      }
    }

    // Method 3: Find by button text
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      if ((text.includes('create') || text.includes('generate') || text.includes('สร้าง')) && document.body.contains(btn)) {
        return btn;
      }
    }

    return null;
  };

  let generateButton = findGenerateButton();

  // Retry if not found
  if (!generateButton) {
    for (let i = 0; i < 3; i++) {
      showNotification(`🔄 ลองหาปุ่ม Generate ครั้งที่ ${i + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      generateButton = findGenerateButton();
      if (generateButton) break;
    }
  }

  if (generateButton && document.body.contains(generateButton)) {
    // Wait until button is no longer disabled
    let waitAttempts = 0;
    while (generateButton.disabled && waitAttempts < 30) { // Wait up to 30 seconds
      console.log(`[TikTok Auto] Generate button is disabled, waiting... (${waitAttempts + 1}/30)`);
      showNotification(`⏳ ปุ่ม Generate กำลังประมวลผล รอ ${waitAttempts + 1} วิ...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      waitAttempts++;

      // Re-find the button in case DOM changed
      generateButton = findGenerateButton();
      if (!generateButton) break;
    }

    if (generateButton && document.body.contains(generateButton) && !generateButton.disabled) {
      console.log('[TikTok Auto] Clicking Generate button...');
      showNotification('🖱️ กด Generate...');

      try {
        generateButton.click();
      } catch (e) {
        console.log('[TikTok Auto] Click failed, trying alternative method...');
        generateButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }

      // delay หลังกด Generate
      showNotification('⏳ รอ 3 วินาที...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('[TikTok Auto] Step 17 completed!');
      showNotification('✅ กด Generate Video แล้ว!');

      // Get clip duration to decide next step (รวม backup กันค่าใน storage หลุด)
      const clipDuration = await getTargetClipDuration();

      if (clipDuration === 8) {
        // Flow 8 วิ: รอ Video Generate แล้ว Download + Post TikTok
        await waitAndDownloadVideo();
      } else {
        // Flow 16 วิ: ไปต่อ Scenebuilder
        await clickScenebuilder();
      }
    } else {
      console.log('[TikTok Auto] Generate button remained disabled too long');
      showNotification('⚠️ ปุ่ม Generate ไม่พร้อมใช้งาน ข้ามขั้นตอนนี้');
    }
  } else {
    console.log('[TikTok Auto] Generate button not found');
    showNotification('⚠️ ไม่พบปุ่ม Generate');
  }
}

// Step 18: Wait for Video Generation (Up to 3 minutes) and Save Video Blob (8 วินาที)
async function waitAndDownloadVideo() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 18 (8 วิ): Waiting for Video generation...');
  showNotification('⏳ รอ Video Generate (8 วิ)...');

  let videoBlobUrl = null;
  let videoElement = null;

  // Enhanced findVideo function - multiple methods
  const findVideo = () => {
    const videos = document.querySelectorAll('video');
    console.log(`[TikTok Auto] Found ${videos.length} video elements`);

    for (const video of videos) {
      const src = video.src || video.currentSrc || '';
      // Log video info for debugging
      console.log(`[TikTok Auto] Video src: ${src}, readyState: ${video.readyState}, duration: ${video.duration}`);

      // Method 1: Direct blob src
      if (src.startsWith('blob:')) {
        return { url: src, element: video, type: 'blob' };
      }

      // Method 2: Google Storage URL (https://storage.googleapis.com)
      if (src.includes('storage.googleapis.com') || src.includes('storage.google')) {
        console.log(`[TikTok Auto] Found Google Storage video: ${src}`);
        return { url: src, element: video, type: 'google_storage' };
      }

      // Method 3: Source elements
      const sources = video.querySelectorAll('source');
      for (const source of sources) {
        const sourceSrc = source.src || '';
        if (sourceSrc.startsWith('blob:') || sourceSrc.includes('storage.googleapis.com')) {
          return { url: sourceSrc, element: video, type: 'source' };
        }
      }

      // Method 4: Any HTTPS video URL with valid duration
      if (src.startsWith('https://') && video.duration > 0) {
        return { url: src, element: video, type: 'https' };
      }
    }
    return null;
  };

  // Helper: Wait for video to be ready (loadeddata event)
  const waitForVideoReady = async (videoElement, maxWaitMs = 30000) => {
    return new Promise((resolve) => {
      // Already ready
      if (videoElement.readyState >= 2) {
        console.log('[TikTok Auto] Video already ready, readyState:', videoElement.readyState);
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        console.log('[TikTok Auto] Video ready timeout');
        resolve(false);
      }, maxWaitMs);

      const onReady = () => {
        clearTimeout(timeout);
        console.log('[TikTok Auto] Video loadeddata event fired');
        resolve(true);
      };

      videoElement.addEventListener('loadeddata', onReady, { once: true });
      videoElement.addEventListener('canplay', onReady, { once: true });

      // Try to trigger load
      videoElement.load();
    });
  };

  // Also check for download button appearing (indicates video is ready)
  const checkDownloadButton = () => {
    const buttons = document.querySelectorAll('button, [role="button"]');
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      if (text.includes('download') || ariaLabel.includes('download') || text.includes('ดาวน์โหลด') || ariaLabel.includes('ดาวน์โหลด')) {
        console.log('[TikTok Auto] Found download button - video should be ready');
        return true;
      }
    }
    return false;
  };

  // Function to check for error messages on page
  const checkForErrors = () => {
    // ★ ถ้ามี progress % = generation กำลังทำงาน → ไม่ใช่ error ★
    const pageText = document.body?.innerText || '';
    const progressMatch = pageText.match(/(\d{1,3})%/);
    if (progressMatch) {
      const pct = parseInt(progressMatch[1]);
      if (pct > 0 && pct <= 100) return false;
    }
    // ★ หา "Failed" card/toast element จริงๆ — ไม่สแกนทั้งหน้า ★
    const candidates = document.querySelectorAll('[role="alert"], [class*="toast"], [class*="snackbar"], div, section');
    for (const el of candidates) {
      if (el.offsetParent === null) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 800 && rect.height > 400) continue;
      const t = el.textContent?.trim() || '';
      if (t.length < 5 || t.length > 300) continue;
      const tLower = t.toLowerCase();
      if (tLower.includes('failed') && (tLower.includes('violat') || tLower.includes('policies') || tLower.includes('please try') || tLower.includes('try a different'))) {
        console.log('[TikTok Auto] Pipeline checkForErrors — Found "Failed" card:', t.substring(0, 80));
        return true;
      }
      if (tLower.includes('audio generation failed')) return true;
      if (tLower.includes('something went wrong') && el.matches('[role="alert"], [class*="toast"], [class*="snackbar"]')) return true;
    }
    return false;
  };

  // Wait up to 2 minutes (120 attempts * 1000ms = 120s) - ลดลงเพื่อไม่ให้รอนานเกินไป
  const MAX_ATTEMPTS = 120;
  let downloadButtonFound = false;
  let errorDetected = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // ★ Crash check ★
    if (isPageCrashed()) {
      console.log('[TikTok Auto] Page CRASHED during video wait (pipeline)!');
      await notifyFlowFailed('Page crashed during video generation (pipeline)');
      return;
    }
    // ★ Failed / Policy violation check — เช็คทุก 5 วิตั้งแต่ attempt 20 ★
    if (attempt > 20 && attempt % 5 === 0) {
      const failCheck = isGenerationFailed();
      if (failCheck.failed) {
        console.log(`[TikTok Auto] Pipeline video: Generation FAILED! ${failCheck.reason} — ${failCheck.text}`);
        showNotification(`❌ Generation Failed: ${failCheck.reason} — ข้ามรายการนี้`);
        await notifyFlowFailed(`Generation failed (pipeline): ${failCheck.reason} - ${failCheck.text}`);
        return;
      }
    }
    showNotification(`⏳ รอ Video Generate (8 วิ)... (${attempt}/${MAX_ATTEMPTS} วิ)`);

    // Log every 10 attempts to reduce console spam
    if (attempt % 10 === 0 || attempt <= 3) {
      console.log(`[TikTok Auto] Checking for generated video... Attempt ${attempt}/${MAX_ATTEMPTS}`);
    }

    // Check for errors every 10 attempts (after attempt 30)
    if (attempt > 30 && attempt % 10 === 0) {
      if (checkForErrors()) {
        console.log('[TikTok Auto] Error detected! Stopping wait...');
        showNotification('❌ พบ Error จาก Google API - ข้ามรายการนี้');
        errorDetected = true;
        break;
      }
    }

    // Attempt to reveal the video if it's hidden under a result container
    const elements = document.querySelectorAll('img, video, [class*="result"], [class*="output"]');
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, view: window }));
        el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, view: window }));
      }
    }

    const videoResult = findVideo();
    if (videoResult) {
      videoBlobUrl = videoResult.url;
      videoElement = videoResult.element;
      console.log('[TikTok Auto] Found video blob:', videoBlobUrl);
      break;
    }

    // Check if download button appeared (fallback indicator)
    if (!downloadButtonFound && checkDownloadButton()) {
      downloadButtonFound = true;
      console.log('[TikTok Auto] Download button found, waiting a bit more for blob...');
      // Wait extra time for blob to be available
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try one more time
      const retryResult = findVideo();
      if (retryResult) {
        videoBlobUrl = retryResult.url;
        videoElement = retryResult.element;
        console.log('[TikTok Auto] Found video blob after download button:', videoBlobUrl);
        break;
      }
    }

    // Wait 1 second before next check
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // If error detected, skip to next item
  if (errorDetected) {
    console.log('[TikTok Auto] Skipping to next item due to error...');
    showNotification('⏭️ ข้ามรายการนี้เนื่องจาก Error');
    await notifyFlowFailed('Video generation failed - skipping');
    return;
  }

  if (videoBlobUrl) {
    console.log('[TikTok Auto] Saving video to storage...');
    console.log('[TikTok Auto] Video URL:', videoBlobUrl);
    showNotification('💾 กำลังบันทึก Video (8 วิ) ลง Storage...');

    try {
      // Wait for video to be ready before fetching (especially for Google Storage URLs)
      if (videoElement && videoElement.readyState < 2) {
        showNotification('⏳ รอ Video โหลดเสร็จ...');
        console.log('[TikTok Auto] Waiting for video to load, current readyState:', videoElement.readyState);
        await waitForVideoReady(videoElement, 30000);
        console.log('[TikTok Auto] Video ready, readyState:', videoElement.readyState);
      }

      // Fetch the video data
      showNotification('📥 กำลังดาวน์โหลด Video...');
      const response = await fetch(videoBlobUrl);

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('[TikTok Auto] Fetched video blob, size:', blob.size);

      // Get video duration for verification
      const videoDuration = videoElement?.duration || 8;
      console.log(`[TikTok Auto] Video duration: ${videoDuration}s, size: ${blob.size} bytes`);

      // Convert blob to base64 for storage
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      // Save to chrome.storage.local
      const flowData = await getSafeFlowData();
      const targetDur = await getTargetClipDuration();

      await chrome.storage.local.set({
        currentFlowData: {
          ...flowData,
          videoBlob: base64Data,
          videoBlobUrl: videoBlobUrl,
          videoDuration: videoDuration,
          videoSize: blob.size,
          videoSavedAt: new Date().toISOString(),
          clipDuration: targetDur
        },
        flowStatus: 'video_saved_8s',
        flowMessage: 'Video 8 วินาที บันทึกแล้ว พร้อมอัพโหลด TikTok'
      });

      console.log('[TikTok Auto] Video blob saved to storage! targetDur=', targetDur);
      showNotification(`✅ บันทึก Video ลง Storage แล้ว! (target: ${targetDur} วิ)`);

      if (targetDur === 16) {
        showNotification('🎞️ 16 วิ — Scene Builder Extend...');
        await new Promise(resolve => setTimeout(resolve, 4000));
        await extendViaSceneBuilder();
      } else {
        await openTikTokUpload();
      }
    } catch (error) {
      console.error('[TikTok Auto] Error saving video blob:', error);
      showNotification('⚠️ บันทึก Blob ไม่ได้ - กำลังลองดาวน์โหลดไฟล์แทน');

      // Fallback: Try to click download button
      await clickDownloadButton();
    }
  } else {
    console.log('[TikTok Auto] Video blob not found after 3 minutes');
    showNotification('⚠️ ไม่พบ Video Blob - ลองกดปุ่ม Download');

    // Fallback: Try to click download button
    await clickDownloadButton();
  }
}

// Helper: downloadVideoToLocal removed - ไม่ download ลงเครื่องแล้ว เก็บเป็น Blob อย่างเดียว

// Open TikTok Upload page directly (same tab)
async function openTikTokUpload() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Opening TikTok Upload page...');
  showNotification('🔗 กำลังเปิด TikTok Upload...');

  // delay เพื่อป้องกัน Policy จับบอท
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Open TikTok upload page in same tab
  window.location.href = 'https://www.tiktok.com/tiktokstudio/upload';

  console.log('[TikTok Auto] TikTok Upload page opened!');
  showNotification('✅ เปิด TikTok Upload แล้ว!');
  showNotification('📤 Content script จะอัพโหลด Video อัตโนมัติ...');
}

// Step 19: Click Download button and select Original Size 720p
async function clickDownloadButton() {
  console.log('[TikTok Auto] Step 19: Looking for Download button...');
  showNotification('🔍 กำลังหาปุ่ม Download...');

  // First, try to capture video blob before clicking download
  let videoBlob = null;
  let videoBlobUrl = null;

  const videos = document.querySelectorAll('video');
  for (const video of videos) {
    const src = video.src || video.currentSrc;
    if (src && (src.startsWith('blob:') || src.startsWith('http'))) {
      try {
        console.log('[TikTok Auto] Trying to fetch video from:', src);
        const response = await fetch(src);
        videoBlob = await response.blob();
        videoBlobUrl = src;
        console.log('[TikTok Auto] Captured video blob:', videoBlob.size, 'bytes');
        break;
      } catch (e) {
        console.log('[TikTok Auto] Failed to fetch video:', e);
      }
    }
  }

  // If we got the blob, save it to storage
  if (videoBlob && videoBlob.size > 0) {
    showNotification('💾 กำลังบันทึก Video ลง Storage...');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(videoBlob);
      const base64Data = await base64Promise;

      const flowData = await getSafeFlowData();
      const targetDurDl = await getTargetClipDuration();

      await chrome.storage.local.set({
        currentFlowData: {
          ...flowData,
          videoBlob: base64Data,
          videoBlobUrl: videoBlobUrl,
          videoSize: videoBlob.size,
          videoSavedAt: new Date().toISOString(),
          clipDuration: targetDurDl
        },
        flowStatus: 'video_saved_8s',
        flowMessage: 'Video 8 วินาที บันทึกแล้ว (via download fallback)'
      });

      console.log('[TikTok Auto] Video blob saved to storage via fallback! targetDur=', targetDurDl);
      showNotification(`✅ บันทึก Video ลง Storage แล้ว! (target: ${targetDurDl} วิ)`);

      if (targetDurDl === 16) {
        showNotification('🎞️ 16 วิ — Scene Builder Extend...');
        await new Promise(resolve => setTimeout(resolve, 4000));
        await extendViaSceneBuilder();
      } else {
        await openTikTokUpload();
      }
      return;
    } catch (error) {
      console.error('[TikTok Auto] Error saving video blob in fallback:', error);
    }
  }

  // If blob capture failed, proceed with download button click
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  let downloadButton = null;

  // Find button with download icon
  const downloadIcons = document.querySelectorAll('i.google-symbols');
  for (const icon of downloadIcons) {
    const text = icon.textContent?.trim().toLowerCase() || '';
    if (text === 'download') {
      downloadButton = icon.closest('button');
      if (downloadButton) {
        console.log('[TikTok Auto] Found Download button:', downloadButton);
        break;
      }
    }
  }

  if (downloadButton) {
    console.log('[TikTok Auto] Clicking Download button...');
    showNotification('🖱️ กด Download...');

    downloadButton.click();

    // delay หลังกด Download dropdown
    showNotification('⏳ รอ 1.5 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find and click "Original Size 720p" option
    let originalSizeOption = null;
    const options = document.querySelectorAll('[role="menuitem"], [role="option"], [data-radix-collection-item], div[class*="menu-item"]');
    for (const opt of options) {
      const text = opt.textContent?.toLowerCase() || '';
      if (text.includes('original') || text.includes('720p') || text.includes('720')) {
        originalSizeOption = opt;
        console.log('[TikTok Auto] Found Original Size 720p option:', opt);
        break;
      }
    }

    if (originalSizeOption) {
      console.log('[TikTok Auto] Clicking Original Size 720p...');
      showNotification('🖱️ เลือก Original Size 720p...');

      originalSizeOption.click();

      // delay หลังเลือก Download
      showNotification('⏳ รอ Download 5 วินาที...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('[TikTok Auto] Step 19 completed!');
      showNotification('✅ Download Video แล้ว!');
      showNotification('⚠️ Video ถูกดาวน์โหลดลงเครื่อง กรุณาอัพโหลดเอง');

      // Notify sidebar that flow is complete but manual upload needed
      await chrome.storage.local.set({
        flowStatus: 'completed_download_manual',
        flowMessage: 'Video 8 วินาที Download แล้ว - กรุณาอัพโหลด TikTok เอง'
      });

      // Open TikTok Upload for manual upload
      await openTikTokUpload();
    } else {
      console.log('[TikTok Auto] Original Size 720p option not found');
      showNotification('⚠️ ไม่พบ Original Size 720p');
    }
  } else {
    console.log('[TikTok Auto] Download button not found');
    showNotification('⚠️ ไม่พบปุ่ม Download');
  }
}

// Step 20: Open TikTok Home page
async function openTikTokHome() {
  console.log('[TikTok Auto] Step 20: Opening TikTok Home...');
  showNotification('🔗 กำลังเปิด TikTok...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Open TikTok home page in same tab
  window.location.href = 'https://www.tiktok.com/en/';

  console.log('[TikTok Auto] Step 20 completed!');
  showNotification('✅ เปิด TikTok แล้ว!');
  showNotification('✅ Flow 8 วินาที เสร็จสิ้น!');
}

// Step for 16 วิ: Wait for video, hover and click Add To Scene, then click Scenebuilder
async function clickScenebuilder() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 18 (16 วิ): Waiting for Video generation...');

  let videoFound = false;
  let errorDetected = false;

  const findVideo = () => {
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      // Check for any src (blob, https, etc.)
      if (video.src && video.src.length > 5) return video.src;
      // Check <source> children
      const sources = video.querySelectorAll('source');
      for (const source of sources) {
        if (source.src && source.src.length > 5) return source.src;
      }
      // Check if video has readyState > 0 (has data loaded)
      if (video.readyState > 0) return 'video-ready';
      // Check if video has duration
      if (video.duration > 0) return 'video-has-duration';
    }
    return null;
  };

  // Function to check for error messages on page
  const checkForErrors = () => {
    // ★ ถ้ามี progress % = generation กำลังทำงาน → ไม่ใช่ error ★
    const pageText = document.body?.innerText || '';
    const progressMatch = pageText.match(/(\d{1,3})%/);
    if (progressMatch) {
      const pct = parseInt(progressMatch[1]);
      if (pct > 0 && pct <= 100) return false;
    }
    const candidates = document.querySelectorAll('[role="alert"], [class*="toast"], [class*="snackbar"], div, section');
    for (const el of candidates) {
      if (el.offsetParent === null) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 800 && rect.height > 400) continue;
      const t = el.textContent?.trim() || '';
      if (t.length < 5 || t.length > 300) continue;
      const tLower = t.toLowerCase();
      if (tLower.includes('failed') && (tLower.includes('violat') || tLower.includes('policies') || tLower.includes('please try') || tLower.includes('try a different'))) {
        console.log('[TikTok Auto] Storymode checkForErrors — Found "Failed" card:', t.substring(0, 80));
        return true;
      }
      if (tLower.includes('audio generation failed')) return true;
      if (tLower.includes('something went wrong') && el.matches('[role="alert"], [class*="toast"], [class*="snackbar"]')) return true;
    }
    return false;
  };

  // Wait up to 2 minutes (120 attempts * 1000ms = 120s) - ลดลงเพื่อไม่ให้รอนานเกินไป
  const MAX_ATTEMPTS = 120;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // ★ Crash check ★
    if (isPageCrashed()) {
      console.log('[TikTok Auto] Page CRASHED during video wait (storymode)!');
      await notifyFlowFailed('Page crashed during video generation (storymode)');
      return;
    }
    // ★ Failed / Policy violation check — เช็คทุก 5 วิตั้งแต่ attempt 20 ★
    if (attempt > 20 && attempt % 5 === 0) {
      const failCheck = isGenerationFailed();
      if (failCheck.failed) {
        console.log(`[TikTok Auto] Storymode video: Generation FAILED! ${failCheck.reason} — ${failCheck.text}`);
        showNotification(`❌ Generation Failed: ${failCheck.reason} — ข้ามรายการนี้`);
        await notifyFlowFailed(`Generation failed (storymode): ${failCheck.reason} - ${failCheck.text}`);
        return;
      }
    }
    showNotification(`⏳ รอ Video Generate (8 วิ)... (${attempt}/${MAX_ATTEMPTS} วิ)`);

    // Log every 10 attempts
    if (attempt % 10 === 0 || attempt <= 3) {
      console.log(`[TikTok Auto] Checking for generated video... Attempt ${attempt}/${MAX_ATTEMPTS}`);
    }

    // Check for errors every 10 attempts (after attempt 30)
    if (attempt > 30 && attempt % 10 === 0) {
      if (checkForErrors()) {
        console.log('[TikTok Auto] Error detected! Stopping wait...');
        showNotification('❌ พบ Error จาก Google API - ข้ามรายการนี้');
        errorDetected = true;
        break;
      }
    }

    const elements = document.querySelectorAll('img, video, [class*="result"], [class*="output"]');
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, view: window }));
        el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, view: window }));
      }
    }

    const videoUrl = findVideo();
    if (videoUrl) {
      console.log('[TikTok Auto] Found video:', videoUrl);
      videoFound = true;
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // If error detected, skip to next item
  if (errorDetected) {
    console.log('[TikTok Auto] Skipping to next item due to error...');
    showNotification('⏭️ ข้ามรายการนี้เนื่องจาก Error');
    await notifyFlowFailed('Video generation failed - skipping');
    return;
  }

  if (videoFound) {
    console.log('[TikTok Auto] Video 8 วิ generate เสร็จ! ไปต่อ Add To Scene...');
    showNotification('✅ Video 8 วิ เสร็จ! กำลังไป Add To Scene...');
  } else {
    console.log('[TikTok Auto] Video not found after max attempts, continuing anyway...');
    showNotification('⚠️ ไม่พบ video แต่จะลองไปต่อ...');
  }

  // Wait a moment for UI to settle
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Click Add To Scene (robust selectors + retry)
  await clickAddToScene();
}

// Step 18b (16 วิ): Click Add To Scene button
async function clickAddToScene() {
  console.log('[TikTok Auto] Step 18b (16 วิ): Looking for Add To Scene button...');
  showNotification('🔍 กำลังหาปุ่ม Add To Scene...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  let addToSceneButton = null;

  const findAddToSceneButton = () => {
    // 1) by aria-label/title
    const ariaCandidates = document.querySelectorAll('button[aria-label], [role="button"][aria-label], button[title], [role="button"][title]');
    for (const el of ariaCandidates) {
      const aria = (el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
      if (aria.includes('add to scene') || aria.includes('add scene') || aria.includes('เพิ่มในฉาก') || aria.includes('เพิ่มลงในฉาก')) return el;
    }

    // 2) by visible text
    const clickables = document.querySelectorAll('button, [role="button"]');
    for (const el of clickables) {
      const text = (el.textContent || '').toLowerCase();
      if (text.includes('add to scene') || text.includes('add scene') || text.includes('เพิ่มในฉาก') || text.includes('เพิ่มลงในฉาก')) return el;
    }

    // 3) by google-symbols icon
    const icons = document.querySelectorAll('i.google-symbols');
    for (const icon of icons) {
      const t = (icon.textContent || '').trim().toLowerCase();
      if (t === 'add_to_photos' || t === 'add' || t === 'add_circle' || t === 'playlist_add') {
        const btn = icon.closest('button, [role="button"]');
        if (btn) return btn;
      }
    }

    return null;
  };

  // Try several times, some UIs show the button only after hover/scroll
  const MAX_TRIES = 15;
  for (let i = 1; i <= MAX_TRIES; i++) {
    addToSceneButton = findAddToSceneButton();
    if (addToSceneButton) break;

    // hover video elements directly with full mouse event sequence
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        video.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: cx, clientY: cy }));
        video.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: cx, clientY: cy }));
        video.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: cx, clientY: cy }));
        // Also hover parent containers
        let parent = video.parentElement;
        for (let p = 0; p < 3 && parent; p++) {
          parent.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: cx, clientY: cy }));
          parent.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: cx, clientY: cy }));
          parent.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: cx, clientY: cy }));
          parent = parent.parentElement;
        }
      }
    }

    // hover other potential preview/result areas
    const hoverTargets = document.querySelectorAll('img, [class*="result"], [class*="output"], [class*="preview"], [data-testid]');
    for (const el of hoverTargets) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 80 && rect.height > 80) {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, view: window }));
        el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, view: window }));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log all buttons and icons for debugging
    if (i === 5 || i === MAX_TRIES) {
      const allBtns = document.querySelectorAll('button, [role="button"]');
      console.log(`[TikTok Auto] All buttons on page (${allBtns.length}):`);
      allBtns.forEach((btn, idx) => {
        const text = (btn.textContent || '').trim().substring(0, 60);
        const aria = btn.getAttribute('aria-label') || '';
        if (text || aria) console.log(`  [${idx}] text="${text}" aria="${aria}"`);
      });
      const allIcons = document.querySelectorAll('i.google-symbols');
      console.log(`[TikTok Auto] All google-symbols icons (${allIcons.length}):`);
      allIcons.forEach((icon, idx) => {
        console.log(`  [${idx}] "${icon.textContent?.trim()}"`);
      });
    }

    console.log(`[TikTok Auto] Add To Scene not found yet (try ${i}/${MAX_TRIES})`);
  }

  if (addToSceneButton) {
    console.log('[TikTok Auto] Clicking Add To Scene button...');
    showNotification('🖱️ กด Add To Scene...');

    try {
      addToSceneButton.scrollIntoView({ block: 'center', inline: 'center' });
    } catch (e) {
      // ignore
    }

    addToSceneButton.click();

    // delay หลังกด Add To Scene
    showNotification('⏳ รอ 2 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[TikTok Auto] Add To Scene clicked!');
    showNotification('✅ กด Add To Scene แล้ว!');

    // Continue to click Scenebuilder button
    await clickScenebuilderButton();
  } else {
    console.log('[TikTok Auto] Add To Scene button not found, trying Scenebuilder directly...');
    showNotification('⚠️ ไม่พบปุ่ม Add To Scene - ลองกด Scenebuilder ตรง');

    // Try clicking Scenebuilder directly
    await clickScenebuilderButton();
  }
}

// Step 18c (16 วิ): Click Scenebuilder button
async function clickScenebuilderButton() {
  console.log('[TikTok Auto] Step 18c (16 วิ): Looking for Scenebuilder button...');
  showNotification('🔍 กำลังหาปุ่ม Scenebuilder...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  let scenebuilderButton = null;

  // Find Scenebuilder button by text
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    const text = btn.textContent?.toLowerCase() || '';
    if (text.includes('scenebuilder') || text.includes('scene builder')) {
      scenebuilderButton = btn;
      console.log('[TikTok Auto] Found Scenebuilder button:', btn);
      break;
    }
  }

  if (scenebuilderButton) {
    console.log('[TikTok Auto] Clicking Scenebuilder button...');
    showNotification('🖱️ กด Scenebuilder...');

    scenebuilderButton.click();

    // delay หลังกด Scenebuilder
    showNotification('⏳ รอ 3 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[TikTok Auto] Scenebuilder opened!');
    showNotification('✅ เปิด Scenebuilder แล้ว!');

    // Continue to click Add button in Scenebuilder
    await clickAddButtonInScenebuilder();
  } else {
    console.log('[TikTok Auto] Scenebuilder button not found');
    showNotification('⚠️ ไม่พบปุ่ม Scenebuilder');
  }
}

// Step 19 (16 วิ): Click Add button in Scenebuilder
async function clickAddButtonInScenebuilder() {
  console.log('[TikTok Auto] Step 19 (16 วิ): Looking for Add button in Scenebuilder...');
  showNotification('🔍 กำลังหาปุ่ม Add ใน Scenebuilder...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  let addButton = null;

  // Find button with "add" icon (material-icons)
  const addIcons = document.querySelectorAll('i.material-icons');
  for (const icon of addIcons) {
    const text = icon.textContent?.trim().toLowerCase() || '';
    if (text === 'add') {
      addButton = icon.closest('button') || icon.parentElement;
      if (addButton) {
        console.log('[TikTok Auto] Found Add button:', addButton);
        break;
      }
    }
  }

  if (addButton) {
    console.log('[TikTok Auto] Clicking Add button...');
    showNotification('🖱️ กด Add...');

    addButton.click();

    // delay หลังกด Add dropdown
    showNotification('⏳ รอ 1.5 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('[TikTok Auto] Add dropdown opened!');
    showNotification('✅ เปิด Add dropdown แล้ว!');

    // Continue to select Extend option
    await selectExtendOption();
  } else {
    console.log('[TikTok Auto] Add button not found in Scenebuilder');
    showNotification('⚠️ ไม่พบปุ่ม Add ใน Scenebuilder');
  }
}

// Step 20 (16 วิ): Select Extend option from dropdown
async function selectExtendOption() {
  console.log('[TikTok Auto] Step 20 (16 วิ): Looking for Extend option...');
  showNotification('🔍 กำลังหา Extend option...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 1.5 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 1500));

  let extendOption = null;

  // Find menuitem with "Extend" text
  const menuItems = document.querySelectorAll('[role="menuitem"]');
  for (const item of menuItems) {
    const text = item.textContent?.toLowerCase() || '';
    if (text.includes('extend')) {
      extendOption = item;
      console.log('[TikTok Auto] Found Extend option:', item);
      break;
    }
  }

  // Also try finding by icon (logout icon for Extend)
  if (!extendOption) {
    const logoutIcons = document.querySelectorAll('i.material-icons-outlined');
    for (const icon of logoutIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'logout') {
        extendOption = icon.closest('[role="menuitem"]') || icon.parentElement;
        if (extendOption) {
          console.log('[TikTok Auto] Found Extend option by icon:', extendOption);
          break;
        }
      }
    }
  }

  if (extendOption) {
    console.log('[TikTok Auto] Clicking Extend option...');
    showNotification('🖱️ เลือก Extend...');

    extendOption.click();

    // delay หลังเลือก Extend
    showNotification('⏳ รอ 2 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[TikTok Auto] Extend selected!');
    showNotification('✅ เลือก Extend แล้ว!');

    // Continue to paste Video Prompt 16 วิ
    await pasteVideoPrompt16();
  } else {
    console.log('[TikTok Auto] Extend option not found');
    showNotification('⚠️ ไม่พบ Extend option');
  }
}

// Step 21 (16 วิ): Paste Video Prompt 16 วิ from Sidebar to Google Flow textarea
async function pasteVideoPrompt16() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 21 (16 วิ): Pasting Video Prompt 16 วิ...');
  showNotification('🔍 กำลังหา Video Prompt 16 วิ...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get video prompt 16 from storage
  const result = await chrome.storage.local.get(['currentFlowData']);
  const flowData = result.currentFlowData;

  // Use videoPrompt16 for 16 second video
  const videoPrompt16 = flowData?.videoPrompt16 || '';

  if (!videoPrompt16) {
    console.log('[TikTok Auto] No Video Prompt 16 วิ found in flowData');
    showNotification('⚠️ ไม่พบ Video Prompt 16 วิ');
    return;
  }

  console.log('[TikTok Auto] Video Prompt 16 วิ:', videoPrompt16.substring(0, 100) + '...');
  showNotification('📝 พบ Video Prompt 16 วิ!');

  // Find the textarea
  let promptTextarea = document.getElementById('PINHOLE_TEXT_AREA_ELEMENT_ID');

  // Also try finding by placeholder
  if (!promptTextarea) {
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      const placeholder = ta.placeholder?.toLowerCase() || '';
      if (placeholder.includes('what happens next') || placeholder.includes('video') || placeholder.includes('generate')) {
        promptTextarea = ta;
        break;
      }
    }
  }

  if (promptTextarea) {
    console.log('[TikTok Auto] Found textarea, pasting Video Prompt 16 วิ...');
    showNotification('📝 วาง Video Prompt 16 วิ...');

    // Set value and trigger React events
    promptTextarea.focus();
    promptTextarea.value = videoPrompt16;

    // Trigger input events for React
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeInputValueSetter.call(promptTextarea, videoPrompt16);

    promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    promptTextarea.dispatchEvent(new Event('change', { bubbles: true }));

    // delay หลังวาง prompt
    showNotification('⏳ รอ 2 วินาที...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[TikTok Auto] Step 21 completed!');
    showNotification('✅ วาง Video Prompt 16 วิ แล้ว!');

    // Continue to Step 22: Click Generate for Video 16 วิ
    await clickGenerateForVideo16();
  } else {
    console.log('[TikTok Auto] Textarea not found');
    showNotification('⚠️ ไม่พบ textarea');
  }
}

// Step 22 (16 วิ): Click Generate button for Video 16 วิ
async function clickGenerateForVideo16() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 22 (16 วิ): Looking for Generate button...');
  showNotification('🔍 กำลังหาปุ่ม Generate...');

  // delay เพื่อป้องกัน Policy จับบอท
  showNotification('⏳ รอ 2 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Function to find generate button
  const findGenerateButton = () => {
    // Method 1: Find button with arrow_forward icon
    const arrowIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of arrowIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'arrow_forward' || text === 'send') {
        const btn = icon.closest('button');
        if (btn && document.body.contains(btn)) {
          return btn;
        }
      }
    }

    // Method 2: Find by material-icons
    const materialIcons = document.querySelectorAll('i.material-icons');
    for (const icon of materialIcons) {
      const text = icon.textContent?.trim().toLowerCase() || '';
      if (text === 'arrow_forward' || text === 'send') {
        const btn = icon.closest('button');
        if (btn && document.body.contains(btn)) {
          return btn;
        }
      }
    }

    // Method 3: Find by button text
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      if ((text.includes('create') || text.includes('generate') || text.includes('สร้าง')) && document.body.contains(btn)) {
        return btn;
      }
    }

    return null;
  };

  let generateButton = findGenerateButton();

  // Retry if not found
  if (!generateButton) {
    for (let i = 0; i < 3; i++) {
      showNotification(`🔄 ลองหาปุ่ม Generate ครั้งที่ ${i + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      generateButton = findGenerateButton();
      if (generateButton) break;
    }
  }

  if (generateButton && document.body.contains(generateButton)) {
    // Wait until button is no longer disabled
    let waitAttempts = 0;
    while (generateButton.disabled && waitAttempts < 30) { // Wait up to 30 seconds
      console.log(`[TikTok Auto] Generate button is disabled, waiting... (${waitAttempts + 1}/30)`);
      showNotification(`⏳ ปุ่ม Generate กำลังประมวลผล รอ ${waitAttempts + 1} วิ...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      waitAttempts++;

      // Re-find the button in case DOM changed
      generateButton = findGenerateButton();
      if (!generateButton) break;
    }

    if (generateButton && document.body.contains(generateButton) && !generateButton.disabled) {
      console.log('[TikTok Auto] Clicking Generate button...');
      showNotification('🖱️ กด Generate...');

      try {
        generateButton.click();
      } catch (e) {
        console.log('[TikTok Auto] Click failed, trying alternative method...');
        generateButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }

      // delay หลังกด Generate
      showNotification('⏳ รอ 3 วินาที...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('[TikTok Auto] Step 22 completed!');
      showNotification('✅ กด Generate Video 16 วิ แล้ว!');

      // Continue to Step 23: Wait for video generation and save blob
      await waitAndSaveVideoBlob();
    } else {
      console.log('[TikTok Auto] Generate button remained disabled too long');
      showNotification('⚠️ ปุ่ม Generate ไม่พร้อมใช้งาน ข้ามขั้นตอนนี้');
    }
  } else {
    console.log('[TikTok Auto] Generate button not found');
    showNotification('⚠️ ไม่พบปุ่ม Generate');
  }
}

// Step 23: Wait for Video Generation (Up to 5 minutes) and Save Video Blob (16 วินาที)
async function waitAndSaveVideoBlob() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 23 (16 วิ): Waiting for Video 16s generation...');
  showNotification('⏳ รอ Video Generate (16 วิ)...');

  let videoUrl = null;
  let videoElement = null;

  // Function to check for error messages on page
  const checkForErrors = () => {
    // ★ ถ้ามี progress % = generation กำลังทำงาน → ไม่ใช่ error ★
    const pageText = document.body?.innerText || '';
    const progressMatch = pageText.match(/(\d{1,3})%/);
    if (progressMatch) {
      const pct = parseInt(progressMatch[1]);
      if (pct > 0 && pct <= 100) return false;
    }
    const candidates = document.querySelectorAll('[role="alert"], [class*="toast"], [class*="snackbar"], div, section');
    for (const el of candidates) {
      if (el.offsetParent === null) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 800 && rect.height > 400) continue;
      const t = el.textContent?.trim() || '';
      if (t.length < 5 || t.length > 300) continue;
      const tLower = t.toLowerCase();
      if (tLower.includes('failed') && (tLower.includes('violat') || tLower.includes('policies') || tLower.includes('please try') || tLower.includes('try a different'))) {
        console.log('[TikTok Auto] 16s checkForErrors — Found "Failed" card:', t.substring(0, 80));
        return true;
      }
      if (tLower.includes('audio generation failed')) return true;
      if (tLower.includes('something went wrong') && el.matches('[role="alert"], [class*="toast"], [class*="snackbar"]')) return true;
    }
    return false;
  };

  // IMPORTANT: Remember ALL existing video elements and their src BEFORE generation
  // so we can detect only NEW videos (not the 8s video that's already on page)
  const existingVideos = new Set();
  document.querySelectorAll('video').forEach(v => {
    existingVideos.add(v);
    if (v.src) existingVideos.add(v.src);
    if (v.currentSrc) existingVideos.add(v.currentSrc);
  });
  const existingVideoCount = document.querySelectorAll('video').length;
  console.log(`[TikTok Auto] Existing videos on page before 16s generation: ${existingVideoCount}`);
  console.log(`[TikTok Auto] Known video srcs:`, [...existingVideos].filter(v => typeof v === 'string'));

  const findNewVideo = () => {
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      // Skip videos that existed BEFORE generation started
      if (existingVideos.has(video)) continue;

      // This is a NEW video element - check if it has loaded
      if (video.src && video.src.length > 5) {
        return { url: video.src, element: video };
      }
      const sources = video.querySelectorAll('source');
      for (const source of sources) {
        if (source.src && source.src.length > 5) {
          return { url: source.src, element: video };
        }
      }
      if (video.readyState >= 2 && video.duration > 0) {
        return { url: video.currentSrc || 'video-ready', element: video };
      }
    }

    // Also check if existing video elements got a NEW src (different from before)
    for (const video of videos) {
      const src = video.src || video.currentSrc || '';
      if (src.length > 5 && !existingVideos.has(src)) {
        return { url: src, element: video };
      }
    }

    return null;
  };

  // Wait up to 2 minutes (120 attempts * 1000ms = 120s) - ลดลงเพื่อไม่ให้รอนานเกินไป
  const MAX_ATTEMPTS = 120;
  let errorDetected = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // ★ Crash check ★
    if (isPageCrashed()) {
      console.log('[TikTok Auto] Page CRASHED during 16s video wait!');
      await notifyFlowFailed('Page crashed during video 16s generation');
      return;
    }
    // ★ Failed / Policy violation check — เช็คทุก 5 วิตั้งแต่ attempt 20 ★
    if (attempt > 20 && attempt % 5 === 0) {
      const failCheck = isGenerationFailed();
      if (failCheck.failed) {
        console.log(`[TikTok Auto] 16s video: Generation FAILED! ${failCheck.reason} — ${failCheck.text}`);
        showNotification(`❌ Generation Failed: ${failCheck.reason} — ข้ามรายการนี้`);
        await notifyFlowFailed(`Generation failed (16s): ${failCheck.reason} - ${failCheck.text}`);
        return;
      }
    }
    showNotification(`⏳ รอ Video 16 วิ Generate... (${attempt}/${MAX_ATTEMPTS} วิ)`);

    // Log every 10 attempts to reduce console spam
    if (attempt % 10 === 0 || attempt <= 3) {
      console.log(`[TikTok Auto] Waiting for 16s video... Attempt ${attempt}/${MAX_ATTEMPTS}`);
    }

    // Check for errors every 10 attempts (after attempt 30)
    if (attempt > 30 && attempt % 10 === 0) {
      if (checkForErrors()) {
        console.log('[TikTok Auto] Error detected! Stopping wait...');
        showNotification('❌ พบ Error จาก Google API - ข้ามไป TikTok');
        errorDetected = true;
        break;
      }
    }

    // Hover elements to reveal video
    const elements = document.querySelectorAll('img, video, [class*="result"], [class*="output"], [class*="preview"]');
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, view: window }));
        el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, view: window }));
      }
    }

    const videoResult = findNewVideo();
    if (videoResult) {
      videoUrl = videoResult.url;
      videoElement = videoResult.element;
      console.log('[TikTok Auto] Found NEW video 16s:', videoUrl);
      showNotification('✅ พบ Video 16 วิ ใหม่!');
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // If error detected, skip to next item
  if (errorDetected) {
    console.log('[TikTok Auto] Skipping to next item due to error...');
    showNotification('⏭️ ข้ามรายการนี้เนื่องจาก Error');

    // Notify sidepanel to move to next item
    await notifyFlowFailed('Video generation failed (403) - skipping to next item');
    return;
  }

  if (videoUrl) {
    console.log('[TikTok Auto] Video 16s found! Preparing to save...');
    showNotification('💾 กำลังบันทึก Video (16 วิ)...');

    try {
      let base64Data = null;
      let blobSize = 0;
      const videoDuration = videoElement?.duration || 16;

      // Only fetch if it's a fetchable URL (blob: or https:)
      if (videoUrl.startsWith('blob:') || videoUrl.startsWith('http')) {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        blobSize = blob.size;
        console.log(`[TikTok Auto] Video duration: ${videoDuration}s, size: ${blobSize} bytes`);

        // Convert blob to base64 for storage
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        base64Data = await base64Promise;
      } else {
        console.log(`[TikTok Auto] Video URL is not fetchable: ${videoUrl}, skipping blob save`);
      }

      // Save to chrome.storage.local
      const flowData = await getSafeFlowData();

      const saveData = {
        ...flowData,
        videoBlobUrl: videoUrl,
        videoDuration: videoDuration,
        videoSize: blobSize,
        videoSavedAt: new Date().toISOString(),
        clipDuration: 16
      };
      if (base64Data) saveData.videoBlob = base64Data;

      await chrome.storage.local.set({
        currentFlowData: saveData,
        flowStatus: 'video_saved_16s',
        flowMessage: 'Video 16 วินาที บันทึกแล้ว พร้อมอัพโหลด TikTok'
      });

      console.log('[TikTok Auto] Video 16s saved!');
      showNotification('✅ บันทึก Video (16 วิ) แล้ว!');

      // Continue to Step 24: Open TikTok Upload
      await openTikTokUploadFor16s();
    } catch (error) {
      console.error('[TikTok Auto] Error saving video:', error);
      showNotification('❌ เกิดข้อผิดพลาด - ลองไป TikTok ต่อ...');
      await openTikTokUploadFor16s();
    }
  } else {
    console.log('[TikTok Auto] Video 16s not found after max attempts');
    showNotification('⚠️ ไม่พบ Video 16 วิ หลังรอ 5 นาที');

    // Still try to go to TikTok - user may have video ready
    await openTikTokUploadFor16s();
  }
}

// Step 24: Open TikTok Upload for 16s video (same tab)
async function openTikTokUploadFor16s() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 24 (16 วิ): Opening TikTok Upload...');
  showNotification('🔗 กำลังเปิด TikTok Upload...');

  // delay เพื่อป้องกัน Policy จับบอท
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Open TikTok upload page in same tab
  window.location.href = 'https://www.tiktok.com/tiktokstudio/upload';

  console.log('[TikTok Auto] TikTok Upload page opened!');
  showNotification('✅ เปิด TikTok Upload แล้ว!');
  showNotification('📤 Content script จะอัพโหลด Video (16 วิ) อัตโนมัติ...');
}

// Legacy function - kept for compatibility (same tab)
async function openTikTokAndUpload() {
  console.log('[TikTok Auto] Step 24: Opening TikTok Upload...');
  showNotification('🔗 กำลังเปิด TikTok Upload...');

  // delay เพื่อป้องกัน Policy จับบอท
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Open TikTok upload page in same tab
  window.location.href = 'https://www.tiktok.com/tiktokstudio/upload';

  console.log('[TikTok Auto] Step 24 completed!');
  showNotification('✅ เปิด TikTok แล้ว!');
  showNotification('⏳ กำลังรอที่หน้า Home 8-15 วินาที...');

  // Notify sidebar that flow is complete
  await chrome.storage.local.set({
    flowStatus: 'completed_16s',
    flowMessage: 'Flow 16 วินาที เสร็จสิ้น - กำลังไป TikTok Home'
  });
}

// Download video (8 วิ) and open TikTok — called from Step 11 when clipDuration=8
async function downloadVideoAndOpenTikTok(base64Data, blobSize) {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] 8 วิ: Downloading video and opening TikTok...');
  showNotification('📥 ดาวน์โหลด Video 8 วิ...');

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Helper: download base64 as file
  function downloadBase64AsFile(base64, filename) {
    try {
      const byteString = atob(base64.split(',')[1]);
      const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('[TikTok Auto] Downloaded:', filename);
      return true;
    } catch (e) {
      console.error('[TikTok Auto] Download error for', filename, e);
      return false;
    }
  }

  // Download video file
  downloadBase64AsFile(base64Data, `video_8s_${Date.now()}.mp4`);
  showNotification('✅ ดาวน์โหลด Video 8 วิ เสร็จ!');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Update storage status
  await chrome.storage.local.set({
    flowStatus: 'completed_download',
    flowMessage: 'Video 8 วิ ดาวน์โหลดแล้ว — กำลังไป TikTok'
  });

  // ★ แจ้ง sidepanel ก่อน navigate ออก ★
  try {
    await chrome.runtime.sendMessage({
      source: 'google-flow',
      type: 'STEP_COMPLETED',
      data: { itemId: currentFlowData?.itemId, mode: 'video' }
    });
  } catch (e) {
    console.log('[TikTok Auto] Could not notify sidepanel:', e);
  }

  // Open TikTok Upload
  console.log('[TikTok Auto] 8 วิ: Opening TikTok Upload...');
  showNotification('🔗 เปิด TikTok Upload...');
  window.location.href = 'https://www.tiktok.com/tiktokstudio/upload';

  console.log('[TikTok Auto] === 8 วิ FLOW COMPLETED! ===');
}

// Make element draggable
function makeDraggable(element) {
  const header = element.querySelector('.tap-header');
  let isDragging = false;
  let offsetX, offsetY;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;
    element.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    element.style.left = (e.clientX - offsetX) + 'px';
    element.style.top = (e.clientY - offsetY) + 'px';
    element.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    element.style.cursor = 'default';
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ★★★ PIPELINE STORYBOARD FUNCTIONS — แยกจาก Auto 8/16 วิ โดยสิ้นเชิง ★★★
// ════════════════════════════════════════════════════════════════════════════

// ★ Pipeline: สร้าง Image สำหรับฉาก (ทีละฉาก) ★
// Flow: New Project (ฉากแรก) → Step 5 → Step 6 → Step 7 → รอ 35 วิ → Step 8
async function handleCreateSceneImage(imagePrompt, sceneNumber, isFirstScene, productImage = null, characterImage = null, isRetry = false) {
  // ★ Reset reference image tracking for each new scene ★
  if (!isRetry) {
    _uploadedRefImageSrcs = new Set();
  }
  
  // ★ เช็คว่าระบบอื่นกำลังทำงานอยู่หรือไม่ ★
  if (!startSystem('storymode')) {
    console.log('[Pipeline] Cannot start - another system is running');
    await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Cannot start — another system is running` });
    return;
  }
  
  console.log('[Pipeline] === Creating Scene Image ===');
  console.log('[Pipeline] Scene:', sceneNumber, 'isFirst:', isFirstScene, 'isRetry:', isRetry);
  console.log('[Pipeline] Image Prompt:', imagePrompt?.substring(0, 100));
  console.log('[Pipeline] Has productImage:', !!productImage, 'Has characterImage:', !!characterImage);
  
  if (!imagePrompt) {
    console.log('[Pipeline] ERROR: No image prompt provided!');
    showNotification('❌ ไม่มี Image Prompt!');
    stopSystem('storymode');
    return;
  }
  
  showNotification(`🖼️ ฉาก ${sceneNumber}: ${isRetry ? 'Retry ' : ''}กำลังสร้าง Image...`);
  
  // เก็บ status
  await chrome.storage.local.set({
    autoRunSceneStatus: { sceneNumber: sceneNumber, step: 'image', completed: false }
  });
  
  // รอหน้าโหลดเสร็จ
  await waitForPageReady();
  await new Promise(resolve => setTimeout(resolve, isRetry ? 1000 : 2000));
  
  // ★ isRetry = true → ข้าม New Project, ข้าม Upload, ข้าม Tab selection — แค่ paste prompt + Generate ★
  if (!isRetry) {
    // ถ้าเป็นฉากแรก ให้กด New Project ก่อน
    if (isFirstScene) {
      showNotification('🖱️ [Pipeline] กำลังกด New Project...');
      await pipeline_clickNewProject();
      showNotification('⏳ รอ UI พร้อม...');
      await new Promise(resolve => setTimeout(resolve, 8000));
    }
    
    // ★ Step 0A: Upload รูปสินค้า (ถ้ามี) ★
    if (productImage) {
      showNotification(`📷 ฉาก ${sceneNumber}: กำลัง Upload รูปสินค้า...`);
      console.log('[Pipeline] Step 0A: Uploading product image...');
      await pipeline_uploadUserImage(productImage);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // ★ Step 0B: Upload รูปตัวละคร/ref เพิ่มเติม (ถ้ามี) ★
    if (characterImage) {
      showNotification(`📷 ฉาก ${sceneNumber}: กำลัง Upload รูปตัวละคร...`);
      console.log('[Pipeline] Step 0B: Uploading character image...');
      await pipeline_uploadUserImage(characterImage);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // ★ Step 1: เลือก Image - Portrait - x1 ★
    showNotification(`🎨 ฉาก ${sceneNumber} Step 1: เลือก Image - Portrait - x1...`);
    const selectOk = await retryStep(() => pipeline_selectImagePortrait(), `Scene ${sceneNumber} ${STORY_STEPS.step1_SelectMode}`, 3, 4000);
    if (!selectOk) {
      console.log(`[Pipeline] Scene ${sceneNumber}: Select tabs failed — aborting to prevent wrong mode`);
      await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Select Image/Portrait/x1 failed` });
      stopSystem('storymode');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log('[Pipeline] RETRY MODE — skipping upload & tab selection, re-paste prompt + Generate');
  }
  
  // ★ Step 2: วาง Image Prompt หลังเลือก tab เสร็จ (ป้องกัน prompt ถูกล้างเมื่อเปลี่ยน mode) — ★ retry 3 รอบ ★
  showNotification(`📝 ฉาก ${sceneNumber} Step 2: วาง Image Prompt...`);
  const pasteOk = await retryStep(() => pipeline_pastePromptToSlate(imagePrompt), `Scene ${sceneNumber} ${STORY_STEPS.step2_PastePrompt}`, 3, 4000);
  if (!pasteOk) {
    console.log(`[Pipeline] Scene ${sceneNumber}: Paste prompt failed after retries — aborting`);
    await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Paste prompt failed` });
    stopSystem('storymode');
    return;
  }
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // ★ Step 3: กด Generate — ★ retry 3 รอบ ★
  showNotification(`🚀 ฉาก ${sceneNumber} Step 3: กด Generate...`);
  const genOk = await retryStep(() => pipeline_clickGenerate(), `Scene ${sceneNumber} ${STORY_STEPS.step3_Generate}`, 3, 4000);
  if (!genOk) {
    console.log(`[Pipeline] Scene ${sceneNumber}: Generate click failed after retries — aborting`);
    await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Generate click failed` });
    stopSystem('storymode');
    return;
  }
  
  // รอ Generate Image เสร็จ (สูงสุด 90 วินาที หรือจนกว่าจะเห็นรูปใหม่)
  const imageWaitSeconds = 60;
  let imageDetected = false;
  
  // ★ v2.46 FIX: ลด threshold จาก 100→60px เพื่อจับ grid thumbnails ★
  const getVisibleLargeImages = () => {
    const allImages = document.querySelectorAll('img');
    return Array.from(allImages).filter(img => {
      const rect = img.getBoundingClientRect();
      return img.offsetParent !== null && rect.width > 60 && rect.height > 60;
    });
  };
  
  const initialImages = getVisibleLargeImages();
  const initialImageCount = initialImages.length;
  // ★ FIX: ใช้ Set ที่ไม่เปลี่ยนแปลง — เป็น snapshot ก่อน Generate ครั้งแรกเท่านั้น ★
  const initialImageSrcs = new Set(initialImages.map(img => img.src));
  // ★ NEW: preGenerateImageSrcs — snapshot ก่อน Generate แต่ละรอบ (จะ refresh ทุก retry) ★
  let preGenerateImageSrcs = new Set(initialImageSrcs);
  let preGenerateImageCount = initialImageCount;
  console.log('[Pipeline] Initial large image count:', initialImageCount);
  console.log('[Pipeline] Initial image srcs:', [...initialImageSrcs].map(s => s.substring(0, 50)));
  
  // รอ 10 วินาทีก่อนเริ่มตรวจสอบ (ให้ generate เริ่มทำงาน)
  showNotification(`⏳ ฉาก ${sceneNumber}: รอ Generate เริ่ม...`);
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // ★ v2.46 FIX: ใช้ count-based Failed detection แทน DOM reference ★
  // นับจำนวน "Failed" badges ก่อน generate → ถ้าเพิ่มขึ้น = error ใหม่จริง
  const countFailedBadges = () => {
    let count = 0;
    const candidates = document.querySelectorAll('div, span, p');
    for (const el of candidates) {
      const t = el.textContent?.trim() || '';
      if (t.length >= 4 && t.length <= 30 && /failed/i.test(t) && el.offsetParent !== null) {
        count++;
      }
    }
    return count;
  };
  let preGenerateFailedCount = countFailedBadges();
  console.log('[Pipeline] Pre-existing Failed badge count:', preGenerateFailedCount);
  
  // ★ ฟังก์ชันตรวจจับ error สำหรับ Image generation ★
  const checkForImageError = () => {
    // Crash detection
    const hasFlowUI = document.querySelector('textarea, [contenteditable], button[aria-label]');
    if (!hasFlowUI) {
      const mainContent = document.querySelector('main, #__next, [role="main"]');
      const checkText = (mainContent?.innerText || document.title || '').toLowerCase();
      if (checkText.includes('application error') || checkText.includes('client-side exception')) {
        console.log('[Pipeline] ❌ Google labs CRASHED!');
        return 'crash';
      }
    }
    
    // ★ v2.46 FIX: เช็ค "Failed" badge ด้วย count — ถ้าจำนวนเพิ่มขึ้นจาก snapshot = error ใหม่จริง ★
    const currentFailedCount = countFailedBadges();
    if (currentFailedCount > preGenerateFailedCount) {
      console.log('[Pipeline] NEW "Failed" badge detected: before=' + preGenerateFailedCount + ' now=' + currentFailedCount);
      return 'failed';
    }
    
    // ★ v2.71 FIX: เช็คเฉพาะ toast/snackbar ที่อยู่ขอบจอ (top/bottom) — ไม่จับ content ตรงกลาง ★
    // ★ ลด keyword ที่กว้างเกินไป — เหลือแค่ keyword เฉพาะเจาะจงของ Google Flow error ★
    const errorKeywords = ['something went wrong', 'violate our policies', 'try a different prompt'];
    const errorElements = document.querySelectorAll('[class*="toast"], [class*="snackbar"]');
    for (const el of errorElements) {
      if (el.offsetParent === null) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 800 && rect.height > 400) continue;
      // ★ เฉพาะ toast ที่อยู่ขอบบน (top < 120) หรือขอบล่าง (bottom > viewportHeight - 120) ★
      const viewH = window.innerHeight;
      if (rect.top > 120 && rect.bottom < viewH - 120) continue;
      const text = (el.textContent || '').toLowerCase().trim();
      if (text.length < 3 || text.length > 500) continue;
      if (errorKeywords.some(k => text.includes(k))) return 'failed';
    }
    
    return false;
  };
  
  // ★ Image generation with retry loop — ★ v3.16: ลด maxRetries ให้ตรงกับ sidepanel (3) ★
  let imageRetryCount = 0;
  const maxImageRetries = 3;
  
  // ★ Helper: เช็คว่ามี progress indicator (รูปกำลัง generate อยู่) ★
  const isImageStillGenerating = () => {
    // เช็ค progress percentage text (เช่น "25%", "42%")
    const candidates = document.querySelectorAll('div, span, p');
    for (const el of candidates) {
      const t = el.textContent?.trim() || '';
      if (/^\d{1,3}%$/.test(t) && el.offsetParent !== null) {
        const rect = el.getBoundingClientRect();
        if (rect.width < 200 && rect.height < 80) {
          console.log('[Pipeline] Image still generating:', t);
          return true;
        }
      }
    }
    // เช็ค loading spinner/animation
    const spinners = document.querySelectorAll('[class*="loading"], [class*="progress"], [class*="spinner"]');
    for (const el of spinners) {
      if (el.offsetParent !== null) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 20 && rect.width < 300) return true;
      }
    }
    // ★ v2.46: เช็ค "Generating" / "Creating" text ที่อาจไม่มี % ★
    const genTexts = document.querySelectorAll('div, span');
    for (const el of genTexts) {
      const t = (el.textContent?.trim() || '').toLowerCase();
      if ((t.includes('generating') || t.includes('creating') || t.includes('loading')) && t.length < 50) {
        if (el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          if (rect.width < 400 && rect.height < 80 && rect.top > 30) {
            console.log('[Pipeline] Image still generating (text):', t);
            return true;
          }
        }
      }
    }
    return false;
  };
  
  // ★ Image wait loop ★
  const totalWaitSeconds = imageWaitSeconds + 30; // 90 วิ
  
  for (let i = totalWaitSeconds; i > 0; i--) {
    if (await isFlowStopped()) {
      return;
    }
    
    // ★ STEP 1: เช็ครูปใหม่ — เทียบกับ preGenerateImageSrcs (snapshot ก่อน Generate ล่าสุด) ★
    const currentImages = getVisibleLargeImages();
    const newImages = currentImages.filter(img => !preGenerateImageSrcs.has(img.src));
    
    if (newImages.length > 0) {
      console.log('[Pipeline] ✅ NEW Image detected! Found', newImages.length, 'new images');
      console.log('[Pipeline] New image srcs:', newImages.map(img => img.src.substring(0, 50)));
      imageDetected = true;
      showNotification(`✅ ฉาก ${sceneNumber}: Image เสร็จแล้ว!`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      break;
    }
    
    // ★ Fallback: จำนวนรูปเพิ่มขึ้น (ไม่ว่า src จะซ้ำหรือไม่) ★
    if (currentImages.length > preGenerateImageCount) {
      const trulyNew = currentImages.filter(img => !preGenerateImageSrcs.has(img.src) && img.src && !img.src.includes('data:image/svg'));
      if (trulyNew.length > 0) {
        console.log('[Pipeline] ✅ Image count increased with new srcs:', preGenerateImageCount, '->', currentImages.length);
        imageDetected = true;
        showNotification(`✅ ฉาก ${sceneNumber}: Image เสร็จแล้ว!`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        break;
      }
      // ★ PD-INSPIRED: ใช้ Flow internal state เช็ค clip count เพิ่มเติม ★
      if (trulyNew.length === 0 && i % 10 === 0) {
        const flowState = await readFlowInternalState();
        if (flowState.hasData && flowState.clipCount > preGenerateImageCount) {
          console.log('[Pipeline] ✅ Flow internal state confirms new clip:', flowState);
          imageDetected = true;
          showNotification(`✅ ฉาก ${sceneNumber}: Image เสร็จแล้ว! (Flow state)`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          break;
        }
      }
      // ★ v2.46: ถ้า count เพิ่มแต่ src เหมือนเดิม → อาจเป็น blob URL ซ้ำ → ก็นับว่าสำเร็จ ★
      if (currentImages.length >= preGenerateImageCount + 1) {
        console.log('[Pipeline] ✅ Image count increased (src may reuse):', preGenerateImageCount, '->', currentImages.length);
        imageDetected = true;
        showNotification(`✅ ฉาก ${sceneNumber}: Image เสร็จแล้ว! (count +${currentImages.length - preGenerateImageCount})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        break;
      }
    }
    
    // ★ STEP 2: ถ้ารูปกำลัง generate อยู่ → รอต่อ ห้าม retry ★
    if (isImageStillGenerating()) {
      showNotification(`⏳ ฉาก ${sceneNumber}: Image กำลัง Generate... ${i} วิ`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
    
    // ★ STEP 3: เช็ค error เฉพาะเมื่อ (ไม่มีรูปใหม่ + ไม่มี progress + รอนานพอ 50 วิ) ★
    const elapsed = totalWaitSeconds - i;
    if (elapsed >= 50 && i % 5 === 0) {
      const errorResult = checkForImageError();
      
      if (errorResult === 'crash') {
        console.log(`[Pipeline] ❌ Google labs crashed at scene ${sceneNumber}!`);
        showNotification(`❌ ฉาก ${sceneNumber}: Google labs ล่ม!`);
        await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Google labs crashed` });
        stopSystem('storymode');
        return;
      }
      
      if (errorResult === 'failed') {
        if (imageRetryCount < maxImageRetries) {
          imageRetryCount++;
          console.log(`[Pipeline] Image failed! Retry ${imageRetryCount}/${maxImageRetries} for scene ${sceneNumber}`);
          showNotification(`🔄 ฉาก ${sceneNumber}: Image ล้มเหลว — Retry ${imageRetryCount}/${maxImageRetries}...`);
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // ★ PD-INSPIRED: ลองกดปุ่ม Retry ของ Flow ก่อน (เร็วกว่า re-generate ใหม่) ★
          const flowRetryOk = await clickRetryOnFailedCard();
          if (flowRetryOk) {
            console.log(`[Pipeline] ✅ Used Flow's native retry button`);
            showNotification(`🔄 ฉาก ${sceneNumber}: ใช้ปุ่ม Retry ของ Flow...`);
          } else {
            // Fallback: re-generate ใหม่ทั้งหมด (เหมือนเดิม)
            console.log(`[Pipeline] Flow retry button not found — full re-generate`);
            await pipeline_selectImagePortrait();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await pipeline_pastePromptToSlate(imagePrompt);
            await new Promise(resolve => setTimeout(resolve, 2000));
            await pipeline_clickGenerate();
          }
          
          // ★ v2.46 FIX: ถ่าย snapshot ใหม่ ก่อน Generate รอบนี้ — ไม่ใส่เข้า initialImageSrcs ★
          const freshImages = getVisibleLargeImages();
          preGenerateImageSrcs = new Set(freshImages.map(img => img.src));
          preGenerateImageCount = freshImages.length;
          preGenerateFailedCount = countFailedBadges(); // reset Failed count snapshot
          
          await new Promise(resolve => setTimeout(resolve, 15000));
          i = totalWaitSeconds; // Reset countdown
          continue;
        } else {
          console.log(`[Pipeline] Image failed after ${maxImageRetries} retries for scene ${sceneNumber}`);
          showNotification(`❌ ฉาก ${sceneNumber}: Image ล้มเหลวหลัง retry ${maxImageRetries} ครั้ง`);
          await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber} image failed after retries` });
          stopSystem('storymode');
          return;
        }
      }
    }
    
    showNotification(`⏳ ฉาก ${sceneNumber}: รอ Image... ${i} วิ (${currentImages.length} รูป)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // ★ ถ้าไม่มีรูปใหม่จริง → set error ★
  if (!imageDetected) {
    console.log(`[Pipeline] ❌ Image not generated for scene ${sceneNumber} — skipping Add to Prompt`);
    showNotification(`❌ ฉาก ${sceneNumber}: ไม่มีรูปใหม่ — ข้ามฉากนี้`);
    await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber} image not generated` });
    stopSystem('storymode');
    return;
  }
  
  console.log('[Pipeline] Proceeding to Step 4...');
  
  // ★ Step 4: Hover รูปใหม่ + Add to Prompt — ★ retry 3 รอบ ★
  showNotification(`🖱️ ฉาก ${sceneNumber} Step 4: Add to Prompt...`);
  const addOk = await retryStep(() => pipeline_hoverImageAndAddToPrompt(initialImageSrcs), `Scene ${sceneNumber} ${STORY_STEPS.step4_AddToPrompt}`, 3, 5000);
  if (!addOk) {
    console.log(`[Pipeline] Scene ${sceneNumber}: Add to Prompt failed — aborting`);
    await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Add to Prompt failed` });
    stopSystem('storymode');
    return;
  }
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // ★ Snapshot all visible image srcs after image step — exclude from video detection ★
  const allImgsAfterImageStep = document.querySelectorAll('img');
  for (const img of allImgsAfterImageStep) {
    if (img.src && img.offsetParent !== null) {
      _uploadedRefImageSrcs.add(img.src);
    }
  }
  console.log('[Pipeline] Post-image-step tracked srcs:', _uploadedRefImageSrcs.size);
  
  // อัพเดท status ว่า Image เสร็จแล้ว
  await chrome.storage.local.set({
    autoRunSceneStatus: { sceneNumber: sceneNumber, step: 'image', completed: true }
  });
  
  // ★ ปลด lock เพื่อให้ step ถัดไปทำงานได้ ★
  stopSystem('storymode');
  
  showNotification(`✅ ฉาก ${sceneNumber}: Image เสร็จแล้ว!`);
  console.log('[Pipeline] === Scene Image Created ===');
}

// ★ Pipeline: สร้าง Video สำหรับฉาก (ต่อจาก Image) ★
// Flow: Step 9 → Step 10 → รอ 90 วิ → Step 12 → Step 13
async function handleCreateSceneVideoFull(videoPrompt, sceneNumber, isRetry = false) {
  console.log('[Pipeline] === Creating Scene Video ===');
  console.log('[Pipeline] Scene:', sceneNumber, 'isRetry:', isRetry);
  console.log('[Pipeline] Video Prompt:', videoPrompt?.substring(0, 100));
  
  if (!canStartSystem('storymode')) {
    console.log('[Pipeline] Cannot start video — another system is running');
    return;
  }
  _storymodeRunning = true;
  
  if (!videoPrompt) {
    console.log('[Pipeline] ERROR: No video prompt provided!');
    showNotification('❌ ไม่มี Video Prompt!');
    await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: No video prompt provided` });
    window._pipelineRunning = false;
    stopSystem('storymode');
    return;
  }
  
  showNotification(`🎬 ฉาก ${sceneNumber}: ${isRetry ? 'Retry ' : ''}กำลังสร้าง Video...`);
  
  // เก็บ status
  await chrome.storage.local.set({
    autoRunSceneStatus: { sceneNumber: sceneNumber, step: 'video', completed: false }
  });
  
  // รอหน้าโหลดเสร็จ
  await waitForPageReady();
  await new Promise(resolve => setTimeout(resolve, isRetry ? 1000 : 2000));
  
  // ★ isRetry = true → ข้าม Tab selection — แค่ paste prompt + Generate ★
  if (!isRetry) {
    showNotification(`🎬 ฉาก ${sceneNumber} Step 5: เลือก Video - Frames - x1...`);
    const vSelectOk = await retryStep(() => pipeline_selectVideoTabs(), `Scene ${sceneNumber} ${STORY_STEPS.step5_SelectVideo}`, 3, 4000);
    if (!vSelectOk) {
      console.log(`[Pipeline] Scene ${sceneNumber}: Select video tabs failed — aborting`);
      await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Select Video/Frames tabs failed` });
      stopSystem('storymode');
      window._pipelineRunning = false;
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log('[Pipeline] RETRY MODE — skipping tab selection, re-paste prompt + Generate');
  }
  
  // ★ Step 6: วาง Video Prompt — ★ 1 ครั้งเท่านั้น (ไม่ retry เพราะ paste จะ auto-generate) ★
  showNotification(`📝 ฉาก ${sceneNumber} Step 6: วาง Video Prompt...`);
  const vPasteOk = await pipeline_pastePromptToSlate(videoPrompt);
  if (!vPasteOk) {
    console.log(`[Pipeline] Scene ${sceneNumber}: Paste video prompt failed — aborting`);
    await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Paste video prompt failed` });
    _storymodeRunning = false;
    window._pipelineRunning = false;
    return;
  }
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // ★ Step 6b: กด Generate — 1 ครั้ง ★
  showNotification(`🚀 ฉาก ${sceneNumber} Step 6b: กด Generate...`);
  const vGenOk = await retryStep(() => pipeline_clickGenerate(), `Scene ${sceneNumber} ${STORY_STEPS.step6_GenerateVideo}`, 1, 4000);
  if (!vGenOk) {
    console.log(`[Pipeline] Scene ${sceneNumber}: Generate click failed — aborting`);
    await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Generate video click failed` });
    _storymodeRunning = false;
    window._pipelineRunning = false;
    return;
  }
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  let videoDetected = false;
  
  // ★ นับจำนวน video ทั้งหมดที่มองเห็นได้ก่อน generate ★
  const getVisibleVideos = () => {
    const allVideos = document.querySelectorAll('video');
    return Array.from(allVideos).filter(video => {
      const rect = video.getBoundingClientRect();
      return video.offsetParent !== null && rect.width > 50 && rect.height > 50;
    });
  };
  
  const initialVideos = getVisibleVideos();
  const initialVideoCount = initialVideos.length;
  // ★ FIX: จำทั้ง src AND currentSrc เพื่อไม่ให้ miss video ใหม่ ★
  const initialVideoSrcs = new Set();
  initialVideos.forEach(v => {
    if (v.src) initialVideoSrcs.add(v.src);
    if (v.currentSrc) initialVideoSrcs.add(v.currentSrc);
  });
  console.log('[Pipeline] Initial video count:', initialVideoCount, 'srcs:', initialVideoSrcs.size);
  
  // ★ FIX: จำ Download button เดิม เพื่อตรวจจับปุ่มใหม่ ★
  const initialDownloadBtnsForScene = new Set();
  document.querySelectorAll('button, [role="button"]').forEach(btn => {
    if (btn.textContent?.toLowerCase().includes('download') ||
        btn.querySelector('i.google-symbols')?.textContent?.trim() === 'download') {
      initialDownloadBtnsForScene.add(btn);
    }
  });
  
  // ★ นับ image ก่อน generate ด้วย (เพราะ video อาจแสดงเป็น thumbnail image) ★
  const getVisibleLargeImagesForVideo = () => {
    const allImages = document.querySelectorAll('img');
    return Array.from(allImages).filter(img => {
      const rect = img.getBoundingClientRect();
      return img.offsetParent !== null && rect.width > 80 && rect.height > 80;
    });
  };
  const initialImagesBeforeVideo = getVisibleLargeImagesForVideo();
  const initialImageSrcsBeforeVideo = new Set(initialImagesBeforeVideo.map(img => img.src));
  // ★ FIX: Also include all tracked reference image srcs in the baseline ★
  for (const refSrc of _uploadedRefImageSrcs) {
    initialImageSrcsBeforeVideo.add(refSrc);
  }
  console.log('[Pipeline] Initial image count before video:', initialImagesBeforeVideo.length, '+ ref:', _uploadedRefImageSrcs.size);
  
  // ★ Snapshot: จด Failed elements ที่มีอยู่ก่อน generate → ไม่นับ Failed เก่า ★
  const getFailedElements = () => {
    const failed = new Set();
    const candidates = document.querySelectorAll('div, span, p');
    for (const el of candidates) {
      const t = el.textContent?.trim() || '';
      if (t.length >= 4 && t.length <= 30 && /failed/i.test(t) && el.offsetParent !== null) {
        failed.add(el);
      }
    }
    return failed;
  };
  const preExistingFailedElements = getFailedElements();
  console.log('[Pipeline] Pre-existing Failed elements count:', preExistingFailedElements.size);
  
  // ★ ฟังก์ชันตรวจจับ error บนหน้าจอ — ★ เช็คเฉพาะ error ใหม่ (ไม่นับ Failed เก่าจากคลิปก่อนหน้า) ★
  // return 'crash' = Google labs ล่ม, 'failed' = generation failed, false = ปกติ
  const checkForGenerationError = () => {
    // ★ FIX: crash detection ต้องเช็คเฉพาะ page จริง ไม่ใช่ extension notification ★
    // เช็คว่าเป็น error page จริง: (1) ไม่มี interactive elements ของ Google Flow (2) มี error text ชัดเจน
    const hasFlowUI = document.querySelector('textarea, [contenteditable], button[aria-label]');
    if (!hasFlowUI) {
      // ไม่มี UI elements → อาจเป็น error page จริง → เช็ค error text เฉพาะ main content (ไม่รวม extension elements)
      const mainContent = document.querySelector('main, #__next, [role="main"]');
      const checkText = (mainContent?.innerText || document.title || '').toLowerCase();
      if (checkText.includes('application error') || checkText.includes('client-side exception')) {
        console.log('[Pipeline] ❌ Google labs CRASHED! (error page detected, no UI elements)');
        return 'crash';
      }
    }
    
    // ★ v2.71 FIX: เช็คเฉพาะ toast/snackbar จริง — เอา [class*="error"], [class*="fail"], [role="alert"] ออก (กว้างเกินไป จับ false positive) ★
    // ★ ลด keyword: เอา 'failed', 'try again', 'forbidden' ออก (ซ้ำกับ Failed badge / กว้างเกิน) ★
    const errorKeywords = ['something went wrong', 'audio generation failed', 'violate our policies', 'try a different prompt'];
    const errorElements = document.querySelectorAll('[class*="toast"], [class*="snackbar"]');
    
    for (const el of errorElements) {
      if (el.offsetParent === null) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 800 && rect.height > 400) continue;
      // ★ เฉพาะ toast ที่อยู่ขอบบน/ล่าง — ไม่จับ element ตรงกลางจอ ★
      const viewH = window.innerHeight;
      if (rect.top > 120 && rect.bottom < viewH - 120) continue;
      const text = (el.textContent || '').toLowerCase().trim();
      if (text.length < 3 || text.length > 500) continue;
      for (const keyword of errorKeywords) {
        if (text.includes(keyword)) {
          console.log('[Pipeline] ⚠️ Error detected in toast:', text.substring(0, 100));
          return 'failed';
        }
      }
    }
    
    // ★ เช็ค "Failed" badge เล็กบน video card — ★ เฉพาะ Failed ใหม่ (ไม่นับ Failed เก่าจากคลิปก่อนหน้า) ★
    const currentFailed = getFailedElements();
    let newFailedCount = 0;
    for (const el of currentFailed) {
      if (!preExistingFailedElements.has(el)) {
        const t = el.textContent?.trim() || '';
        console.log('[Pipeline] Found NEW "Failed" badge on video card:', t);
        newFailedCount++;
      }
    }
    if (newFailedCount > 0) return 'failed';
    
    return false;
  };
  
  // ★ Helper: หารูปล่าสุดที่ generate สำเร็จ (ไม่ใช่ Failed, ไม่ใช่ ref upload) แล้ว Add to Prompt ★
  const reAddLatestImageToPrompt = async () => {
    console.log('[Pipeline] Re-adding latest successful image to prompt...');
    showNotification(`🖼️ ฉาก ${sceneNumber}: หารูปล่าสุด → Add to Prompt...`);

    let targetImage = null;

    // หา blob images ที่มองเห็นได้ — เอาตัวสุดท้าย (ใหม่สุด) ที่ไม่ใช่ ref upload
    const blobImages = document.querySelectorAll('img[src^="blob:"]');
    for (const img of blobImages) {
      const rect = img.getBoundingClientRect();
      if (img.offsetParent === null || rect.width < 60 || rect.height < 60) continue;
      if (_uploadedRefImageSrcs.has(img.src)) continue;

      // ★ ข้ามรูปที่อยู่ใน Failed card — เช็คจาก parent ที่มีข้อความ "Failed" ★
      const card = img.closest('[class*="card"], [class*="Card"], [class*="item"], [class*="Item"]');
      if (card) {
        const cardText = card.textContent || '';
        if (/failed/i.test(cardText) && cardText.length < 200) continue;
      }

      targetImage = img;
    }

    // Fallback: หา large image ทั่วไป
    if (!targetImage) {
      const allImages = document.querySelectorAll('img');
      for (const img of allImages) {
        const rect = img.getBoundingClientRect();
        if (img.offsetParent === null || rect.width < 60 || rect.height < 60) continue;
        if (_uploadedRefImageSrcs.has(img.src)) continue;
        if (img.src.includes('data:image/svg')) continue;
        const card = img.closest('[class*="card"], [class*="Card"], [class*="item"], [class*="Item"]');
        if (card && /failed/i.test(card.textContent || '') && (card.textContent || '').length < 200) continue;
        targetImage = img;
      }
    }

    if (!targetImage) {
      console.log('[Pipeline] No successful image found for re-add');
      return false;
    }

    console.log('[Pipeline] Found latest image for re-add:', targetImage.src?.substring(0, 50));
    targetImage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 800));

    const rect = targetImage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    targetImage.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: cx, clientY: cy }));
    targetImage.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: cx, clientY: cy }));
    await new Promise(resolve => setTimeout(resolve, 300));
    targetImage.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 2, view: window
    }));
    await new Promise(resolve => setTimeout(resolve, 3000));

    const addBtn = await findAddToPromptButton();
    if (addBtn) {
      console.log('[Pipeline] Clicking Add to Prompt for retry reference...');
      await simulateRealClick(addBtn);
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification(`✅ ฉาก ${sceneNumber}: เพิ่มรูป ref ล่าสุดแล้ว`);
      return true;
    }

    console.log('[Pipeline] Add to Prompt button not found for re-add');
    document.body.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    return false;
  };

  // ★ ฟังก์ชัน retry เมื่อเจอ error ★
  const retryGenerate = async () => {
    console.log('[Pipeline] 🔄 Retrying video generation...');
    showNotification(`🔄 ฉาก ${sceneNumber}: พบ Error - กำลัง Retry...`);
    
    // รอ 5 วินาที ให้ error message หายจากหน้า
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // ★ Re-add latest successful image to prompt before retry ★
    try {
      const reAdded = await reAddLatestImageToPrompt();
      if (reAdded) {
        console.log('[Pipeline] Successfully re-added reference image for retry');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      console.log('[Pipeline] Re-add image failed (non-critical):', e.message);
    }
    
    // ★ วาง prompt ใหม่ ★
    if (videoPrompt) {
      try {
        await pipeline_pastePromptToSlate(videoPrompt);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.log('[Pipeline] Retry paste error:', e.message);
      }
    }
    
    // ★ กด Generate ★
    try {
      await pipeline_clickGenerate();
    } catch (e) {
      console.log('[Pipeline] Retry generate click failed:', e.message);
    }
    
    // ★ รอ 15 วิ ให้ error message เก่าหายจาก DOM ก่อนเริ่มตรวจจับ ★
    await new Promise(resolve => setTimeout(resolve, 15000));
  };
  
  // ★ FIX: Loop เดียว 180 วิ — ดู % progress ของ video ล่าสุด ★
  // ถ้า % ขึ้นปกติ → รอจนเสร็จ → Add to Scene
  // ถ้า % ไม่ขึ้น (ค้าง 30 วิ) หรือ error → ค่อย retry (วาง prompt ใหม่ 1 ครั้ง)
  const TOTAL_WAIT = 180;
  const STALL_THRESHOLD = 30; // ถ้า % ไม่ขึ้นนาน 30 วิ = ค้าง
  let retryCount = 0;
  const maxRetries = 3; // ★ v2.46: retry 3 ครั้ง (persistent retry) ★
  let videoFailed = false;
  let lastPct = -1;
  let lastPctChangeAt = 0; // วินาทีที่ % เปลี่ยนล่าสุด
  
  showNotification(`⏳ ฉาก ${sceneNumber}: รอ Video Generate... (สูงสุด ${TOTAL_WAIT} วิ)`);
  await chrome.storage.local.set({
    autoRunSceneStatus: { sceneNumber: sceneNumber, step: 'video', completed: false, phase: 'waiting_generate' }
  });
  
  for (let sec = 1; sec <= TOTAL_WAIT; sec++) {
    if (await isFlowStopped()) { _storymodeRunning = false; window._pipelineRunning = false; return; }
    
    // ★ Crash check ทุก 10 วิ ★
    if (sec % 10 === 0) {
      const genError = checkForGenerationError();
      if (genError === 'crash') {
        console.log(`[Pipeline] ❌ Google labs crashed at scene ${sceneNumber}!`);
        showNotification(`❌ ฉาก ${sceneNumber}: Google labs ล่ม!`);
        await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Google labs crashed` });
        stopSystem('storymode');
        window._pipelineRunning = false;
        return;
      }
    }
    
    // ★ Error check ตั้งแต่ 15 วิ ทุก 10 วิ — ★ ข้ามถ้ามี % progress (video กำลัง generate ปกติ) ★
    if (sec >= 15 && sec % 10 === 0) {
      // ★ FIX: เช็คว่า video กำลัง generate (% ขึ้นอยู่) → ถ้าใช่ "Failed" badge มาจากคลิปเก่า → ข้าม ★
      // ใช้ lastPct จาก video card detection (ไม่ใช่ body.innerText ที่จับ download badge ด้วย)
      const hasActiveProgress = lastPct > 0 && lastPct < 100;
      
      if (!hasActiveProgress) {
        const genError = checkForGenerationError();
        if (genError === 'failed') {
          console.log(`[Pipeline] ⚠️ Error detected at ${sec}s (no active progress)`);
          if (retryCount < maxRetries) {
            retryCount++;
            showNotification(`⚠️ ฉาก ${sceneNumber}: Error - Retry ${retryCount}/${maxRetries}...`);
            await retryGenerate();
            lastPct = -1;
            lastPctChangeAt = sec;
            continue;
          } else {
            showNotification(`⚠️ ฉาก ${sceneNumber}: Video ล้มเหลว — ทำ Add to Scene ต่อ`);
            videoFailed = true;
            break;
          }
        }
      } else {
        console.log(`[Pipeline] Skipping error check — video has active progress (${lastPct}%)`);
      }
    }
    
    // ★ ตรวจจับ video ใหม่ — 3 วิธี: (A) <video> tag ใหม่, (B) <img> thumbnail ใหม่, (C) Download button ใหม่ ★
    
    // (A) เช็ค <video> tag ใหม่
    const currentVideos = getVisibleVideos();
    const newVideos = currentVideos.filter(video => {
      const src = video.src || '';
      const csrc = video.currentSrc || '';
      return (src && !initialVideoSrcs.has(src)) || (csrc && !initialVideoSrcs.has(csrc));
    });
    
    if (newVideos.length > 0 || currentVideos.length > initialVideoCount) {
      console.log('[Pipeline] ✅ Video เสร็จ! (new <video> tag)', newVideos.length, 'new, total:', currentVideos.length);
      videoDetected = true;
      showNotification(`✅ ฉาก ${sceneNumber}: Video เสร็จแล้ว! → Add to Scene...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      break;
    }
    
    // (B) เช็ค <img> thumbnail ใหม่ (Google Flow อาจแสดง video เสร็จเป็น img)
    // ★ FIX: เริ่มเช็คหลัง 45 วิ + กรองรูป ref ที่ upload ไว้ออก (ป้องกัน false positive) ★
    if (sec >= 45 && sec % 3 === 0) {
      const currentImages = getVisibleLargeImagesForVideo();
      const newImages = currentImages.filter(img => {
        if (!img.src || initialImageSrcsBeforeVideo.has(img.src)) return false;
        if (_uploadedRefImageSrcs.has(img.src)) return false;
        return true;
      });
      if (newImages.length > 0) {
        console.log('[Pipeline] ✅ Video เสร็จ! (new thumbnail)', newImages.length, 'new images');
        videoDetected = true;
        showNotification(`✅ ฉาก ${sceneNumber}: Video เสร็จแล้ว! → Add to Scene...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        break;
      }
    }
    
    // (C) เช็ค Download button ใหม่ ทุก 5 วิ
    if (sec % 5 === 0) {
      const allBtns = document.querySelectorAll('button, [role="button"]');
      for (const btn of allBtns) {
        const isDownload = btn.textContent?.toLowerCase().includes('download') ||
          btn.querySelector('i.google-symbols')?.textContent?.trim() === 'download';
        if (isDownload && !initialDownloadBtnsForScene.has(btn)) {
          console.log('[Pipeline] ✅ Video เสร็จ! (new Download button)');
          videoDetected = true;
          showNotification(`✅ ฉาก ${sceneNumber}: Video เสร็จ! → Add to Scene...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          break;
        }
      }
      if (videoDetected) break;
    }
    
    // (D) เช็คว่ามี play button overlay บน video card (แปลว่า video เสร็จพร้อมเล่น)
    if (sec >= 15 && sec % 5 === 0) {
      const playBtns = document.querySelectorAll('button[aria-label*="play"], button[aria-label*="Play"], [class*="play"], [class*="Play"]');
      for (const pb of playBtns) {
        if (pb.offsetParent !== null) {
          const rect = pb.getBoundingClientRect();
          if (rect.width > 20 && rect.height > 20 && rect.top > 30) {
            console.log('[Pipeline] ✅ Video เสร็จ! (play button found)');
            videoDetected = true;
            showNotification(`✅ ฉาก ${sceneNumber}: Video เสร็จ! → Add to Scene...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            break;
          }
        }
      }
      if (videoDetected) break;
    }
    
    // ★ เช็ค progress % ของ video ล่าสุด — ★ เฉพาะ video card area ไม่รวม download badge ★
    // ★ FIX: หา % จาก video card elements เท่านั้น (ไม่ใช่ทั้ง body.innerText ซึ่งจะจับ download badge ด้วย) ★
    let currentPct = -1;
    const videoCards = document.querySelectorAll('[class*="card"], [class*="Card"], [class*="result"], [class*="Result"], [class*="item"], [class*="Item"], [class*="preview"], [class*="Preview"]');
    for (const card of videoCards) {
      const cardText = card.textContent || '';
      const cardPctMatch = cardText.match(/(\d{1,3})%/);
      if (cardPctMatch) {
        const rect = card.getBoundingClientRect();
        // ★ ต้องเป็น element ที่มองเห็นได้ ขนาดเหมือน video card (ไม่ใช่ download badge เล็กๆ มุมขวาบน) ★
        if (rect.width > 80 && rect.height > 80 && rect.top > 30) {
          currentPct = parseInt(cardPctMatch[1]);
          break;
        }
      }
    }
    // fallback: หา % จาก elements ที่อยู่ใกล้ video/thumbnail
    if (currentPct === -1) {
      const pctElements = document.querySelectorAll('div, span');
      for (const el of pctElements) {
        const t = el.textContent?.trim() || '';
        if (/^\d{1,3}%$/.test(t)) {
          const rect = el.getBoundingClientRect();
          // ★ ต้องอยู่ในพื้นที่ content (ไม่ใช่มุมขวาบนซึ่งเป็น download badge) ★
          if (rect.top > 40 && rect.left < 500 && rect.width < 100) {
            currentPct = parseInt(t);
            break;
          }
        }
      }
    }
    if (currentPct >= 0) {
      
      // ★ Video 100% → เสร็จแล้ว! ★
      if (currentPct >= 100 && sec >= 10) {
        console.log('[Pipeline] Progress 100%! Video done.');
        videoDetected = true;
        showNotification(`✅ ฉาก ${sceneNumber}: Video 100%! → Add to Scene...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        break;
      }
      
      // ★ จำ % ล่าสุด เพื่อเช็คว่าค้างหรือไม่ ★
      if (currentPct !== lastPct) {
        lastPct = currentPct;
        lastPctChangeAt = sec;
      }
    }
    
    // ★ เช็คว่า % ค้าง (ไม่ขึ้นนาน STALL_THRESHOLD วิ) → retry ★
    // ★ FIX: ต้องมี currentPct > 0 จริงๆ (จาก video card) ถึงจะนับว่า stall — ถ้า currentPct = -1 แปลว่าไม่เจอ % จาก video card = ไม่ stall ★
    if (sec >= 30 && lastPctChangeAt > 0 && currentPct > 0 && currentPct < 100 && (sec - lastPctChangeAt) >= STALL_THRESHOLD) {
      console.log(`[Pipeline] ⚠️ Progress stalled! ${lastPct}% ค้างมา ${sec - lastPctChangeAt} วิ`);
      if (retryCount < maxRetries) {
        retryCount++;
        showNotification(`⚠️ ฉาก ${sceneNumber}: Video ค้าง ${lastPct}% — Retry ${retryCount}/${maxRetries}...`);
        await retryGenerate();
        lastPct = -1;
        lastPctChangeAt = sec;
        continue;
      }
    }
    
    // ★ แสดง progress ★
    if (sec % 10 === 0) {
      if (currentPct >= 0) {
        showNotification(`⏳ ฉาก ${sceneNumber}: Video ${currentPct}%... (${sec}/${TOTAL_WAIT} วิ)`);
      } else {
        showNotification(`⏳ ฉาก ${sceneNumber}: รอ Video... (${sec}/${TOTAL_WAIT} วิ)`);
      }
    }
    
    // ★ Update status ทุก 15 วิ ป้องกัน stale detection ★
    if (sec % 15 === 0) {
      await chrome.storage.local.set({
        autoRunSceneStatus: { sceneNumber: sceneNumber, step: 'video', completed: false, phase: 'generating', elapsed: sec, pct: currentPct }
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (videoFailed) {
    console.log(`[Pipeline] Scene ${sceneNumber}: Video generation failed — aborting`);
    await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Video generation failed` });
    _storymodeRunning = false;
    window._pipelineRunning = false;
    return;
  }
  
  if (!videoDetected) {
    console.log('[Pipeline] Video wait timeout after', TOTAL_WAIT, 'sec — aborting scene');
    showNotification(`❌ ฉาก ${sceneNumber}: Timeout ${TOTAL_WAIT} วิ — Video ไม่เสร็จ`);
    await chrome.storage.local.set({ flowStatus: 'flow_error', flowMessage: `Scene ${sceneNumber}: Video timeout after ${TOTAL_WAIT}s` });
    _storymodeRunning = false;
    window._pipelineRunning = false;
    return;
  }
  
  // ★ Update status → Add to Scene phase ★
  await chrome.storage.local.set({
    autoRunSceneStatus: { sceneNumber: sceneNumber, step: 'video', completed: false, phase: 'add_to_scene' }
  });
  
  // ★ จับภาพหน้าจอหลัง video generate เสร็จ ★
  console.log('[Pipeline] Capturing screenshot after video generation...');
  await captureScreenshot(`storymode_scene${sceneNumber}_video_${Date.now()}.png`);
  
  // ★ Step 7: คลิกขวา Video → Add to Scene ทันที ★
  console.log('[Pipeline] Proceeding to Step 7: Add to Scene...');
  showNotification(`🎬 ฉาก ${sceneNumber} Step 7: คลิกขวา Video → Add to Scene...`);
  const addSceneOk = await retryStep(() => pipeline_hoverVideoAndAddToScene(initialVideoSrcs, initialImageSrcsBeforeVideo), `Scene ${sceneNumber} ${STORY_STEPS.step7_AddToScene}`, 3, 5000);
  if (!addSceneOk) {
    console.log(`[Pipeline] Scene ${sceneNumber}: Add to Scene failed — marking video done anyway`);
    showNotification(`⚠️ ฉาก ${sceneNumber}: Add to Scene ล้มเหลว — ข้ามไป`);
  }
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 13: อัพเดท status ว่า Video เสร็จแล้ว
  await chrome.storage.local.set({
    autoRunSceneStatus: { sceneNumber: sceneNumber, step: 'video', completed: true }
  });
  
  // ★ ปลด lock เพื่อให้ฉากถัดไปทำงานได้ ★
  stopSystem('storymode');
  window._pipelineRunning = false;
  
  showNotification(`✅ ฉาก ${sceneNumber}: Video เสร็จแล้ว!`);
  console.log('[Pipeline] === Scene Video Created ===');
}

// ★ Pipeline: เปิด SceneBuilder และ Download หลังทำงานครบทุกฉาก ★
async function pipeline_openSceneBuilderAndDownload() {
  console.log('[Pipeline] === Opening SceneBuilder and Download ===');
  
  // ★ Step 1: คลิก SceneBuilder button ★
  showNotification('🎬 กำลังเปิด SceneBuilder...');
  
  let sceneBuilderClicked = false;
  
  // วิธี 1: ใช้ exact CSS selector ที่ user ให้มา
  const exactSelector = '#__next > div.sc-c7ee1759-1.crzReP > div.sc-52d5d66-0.fHFgDN > div > div.sc-c514a881-0.eSKsqH.sc-52d5d66-8.hoeYaI > div > button.sc-e8425ea6-0.gLXNUV.sc-d3791a4f-0.sc-d3791a4f-4.sc-c514a881-2.ewQKQI.eaSocK.fMiwJv';
  const exactBtn = document.querySelector(exactSelector);
  if (exactBtn) {
    console.log('[Pipeline] Found SceneBuilder button via exact selector');
    await simulateRealClick(exactBtn);
    sceneBuilderClicked = true;
  }
  
  // วิธี 2: หาจาก icon play_movies
  if (!sceneBuilderClicked) {
    const allIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of allIcons) {
      if (icon.textContent?.trim() === 'play_movies') {
        const btn = icon.closest('button');
        if (btn) {
          console.log('[Pipeline] Found SceneBuilder button via play_movies icon');
          await simulateRealClick(btn);
          sceneBuilderClicked = true;
          break;
        }
      }
    }
  }
  
  // วิธี 3: หาจากข้อความ Scenebuilder
  if (!sceneBuilderClicked) {
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      const text = btn.textContent?.toLowerCase() || '';
      if (text.includes('scenebuilder') || text.includes('scene builder')) {
        console.log('[Pipeline] Found SceneBuilder button via text');
        await simulateRealClick(btn);
        sceneBuilderClicked = true;
        break;
      }
    }
  }
  
  if (!sceneBuilderClicked) {
    console.log('[Pipeline] SceneBuilder button not found');
    showNotification('⚠️ ไม่พบปุ่ม SceneBuilder');
    await chrome.storage.local.set({ pipelineCompleted: true });
    return false;
  }
  
  showNotification('✅ เปิด SceneBuilder แล้ว! รอ 5 วิ...');
  console.log('[Pipeline] SceneBuilder opened, waiting 5 seconds...');
  
  // ★ Step 2: รอ 5 วินาทีให้ UI พร้อม ★
  for (let i = 5; i > 0; i--) {
    if (await isFlowStopped()) return false;
    showNotification(`⏳ รอ SceneBuilder... ${i} วิ`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // ★ PD-INSPIRED: ลบ failed clips ก่อน export เพื่อ cleanup ★
  const deletedClips = await deleteFailedClipInScenebuilder();
  if (deletedClips > 0) {
    console.log(`[Pipeline] Cleaned up ${deletedClips} failed clip(s) before export`);
    showNotification(`🧹 ลบ ${deletedClips} clip ที่ failed ก่อน export`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // ★ Step 3: กดปุ่ม Download (icon) เพื่อเริ่ม Export ★
  showNotification('📥 กดปุ่ม Download เพื่อเริ่ม Export...');
  console.log('[Pipeline] Clicking Download button to start export...');
  
  let exportStarted = false;
  
  // วิธี 1: หาจาก exact class ที่ user ให้มา
  const downloadBtn = document.querySelector('button.sc-e8425ea6-0.gLXNUV.sc-f9321097-0.dEcyGg.sc-91e0914f-0.fNmmpX');
  if (downloadBtn) {
    console.log('[Pipeline] Found Download button via exact class');
    await simulateRealClick(downloadBtn);
    exportStarted = true;
  }
  
  // วิธี 2: หาจาก icon download ใน button
  if (!exportStarted) {
    const downloadIcons = document.querySelectorAll('i.google-symbols');
    for (const icon of downloadIcons) {
      if (icon.textContent?.trim() === 'download') {
        const btn = icon.closest('button');
        if (btn) {
          console.log('[Pipeline] Found Download button via download icon');
          await simulateRealClick(btn);
          exportStarted = true;
          break;
        }
      }
    }
  }
  
  if (!exportStarted) {
    console.log('[Pipeline] Download button not found');
    showNotification('⚠️ ไม่พบปุ่ม Download');
    await chrome.storage.local.set({ pipelineCompleted: true });
    return false;
  }
  
  showNotification('✅ เริ่ม Export แล้ว! รอ...');
  console.log('[Pipeline] Export started, waiting for completion...');
  
  // ★ Step 4: รอจนกว่า "Video exported!" จะปรากฏ (สูงสุด 120 วินาที) ★
  const maxExportWait = 120;
  let exportCompleted = false;
  
  // รอ 3 วินาทีก่อนเริ่มตรวจสอบ
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  for (let i = maxExportWait; i > 0; i--) {
    if (await isFlowStopped()) return false;
    
    // ตรวจสอบว่ามีข้อความ "Video exported!" หรือยัง
    const allText = document.body.innerText || '';
    if (allText.includes('Video exported!') || allText.includes('Video exported')) {
      console.log('[Pipeline] Video exported! detected');
      exportCompleted = true;
      showNotification('✅ Export เสร็จแล้ว!');
      await new Promise(resolve => setTimeout(resolve, 2000)); // รอ UI พร้อม
      break;
    }
    
    // ตรวจสอบว่ายังอยู่ใน Exporting... หรือไม่
    const isExporting = allText.includes('Exporting...');
    if (isExporting) {
      showNotification(`⏳ กำลัง Export... ${i} วิ`);
    } else {
      showNotification(`⏳ รอ Export... ${i} วิ`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!exportCompleted) {
    console.log('[Pipeline] Export timeout, trying to find Download anyway...');
    showNotification('⚠️ Export timeout - ลองหา Download...');
  }
  
  // ★ Step 5: หา Download link/video URL แล้ว download ลงเครื่อง ★
  showNotification('📥 กำลังหา Video เพื่อ Download ลงเครื่อง...');
  console.log('[Pipeline] Step 5: Finding video to download...');
  
  let videoDownloaded = false;
  let downloadUrl = null;
  
  // วิธี 1: หาจาก <a> download link (exact class)
  const downloadLink = document.querySelector('a.sc-fbdde67d-0.kUMoet');
  if (downloadLink && downloadLink.href) {
    downloadUrl = downloadLink.href;
    console.log('[Pipeline] Found Download link via exact class:', downloadUrl);
  }
  
  // วิธี 2: หาจาก <a> ที่มีข้อความ Download
  if (!downloadUrl) {
    const allLinks = document.querySelectorAll('a');
    for (const link of allLinks) {
      const text = link.textContent?.trim().toLowerCase() || '';
      if (text === 'download' && link.href) {
        downloadUrl = link.href;
        console.log('[Pipeline] Found Download link via text:', downloadUrl);
        break;
      }
    }
  }
  
  // วิธี 3: หาจาก <video> element ใน SceneBuilder
  if (!downloadUrl) {
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      const src = video.src || video.currentSrc || '';
      if (src && (src.startsWith('blob:') || src.startsWith('https://'))) {
        downloadUrl = src;
        console.log('[Pipeline] Found video element src:', downloadUrl);
        break;
      }
    }
  }
  
  // ★ Download video ลงเครื่อง ★
  if (downloadUrl) {
    showNotification('📥 กำลัง Download Video ลงเครื่อง...');
    console.log('[Pipeline] Downloading video from:', downloadUrl);
    
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      
      const blob = await response.blob();
      console.log('[Pipeline] Video blob size:', blob.size, 'bytes');
      
      if (blob.size > 0) {
        // สร้างชื่อไฟล์จากเวลาปัจจุบัน
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
        const fileName = `storymode_${timestamp}.mp4`;
        
        // สร้าง blob URL แล้ว trigger download
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 5000);
        
        videoDownloaded = true;
        console.log(`[Pipeline] ✅ Video downloaded as "${fileName}" (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);
        showNotification(`✅ Download เสร็จ! "${fileName}" (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);
      }
    } catch (fetchErr) {
      console.error('[Pipeline] Fetch download error:', fetchErr);
      showNotification('⚠️ Fetch download ไม่ได้ — ลองคลิก Download link แทน');
    }
    
    // Fallback: คลิก Download link ถ้า fetch ไม่ได้
    if (!videoDownloaded) {
      const linkEl = downloadLink || document.querySelector('a[href]');
      if (linkEl) {
        console.log('[Pipeline] Fallback: clicking download link directly');
        await simulateRealClick(linkEl);
        videoDownloaded = true;
      }
    }
  } else {
    // ★ ไม่พบ URL เลย → ลองคลิก link ตรงๆ ★
    console.log('[Pipeline] No download URL found, trying to click any Download link...');
    const allLinks = document.querySelectorAll('a');
    for (const link of allLinks) {
      const text = link.textContent?.trim().toLowerCase() || '';
      if (text === 'download' || text.includes('download')) {
        await simulateRealClick(link);
        videoDownloaded = true;
        console.log('[Pipeline] Clicked Download link as last resort');
        break;
      }
    }
  }
  
  if (!videoDownloaded) {
    console.log('[Pipeline] Download link not found');
    showNotification('⚠️ ไม่พบ Download link');
    await chrome.storage.local.set({ pipelineCompleted: true });
    return false;
  }
  
  // รอ 3 วินาทีให้ download เสร็จ
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // ★ เช็คว่าต้อง Auto Post ไป TikTok หรือไม่ ★
  const autoPostData = await chrome.storage.local.get(['storyAutoPost']);
  const storyAutoPost = autoPostData.storyAutoPost;
  
  if (storyAutoPost && storyAutoPost.enabled && downloadUrl) {
    console.log('[Pipeline] ★ Auto Post enabled — saving blob to storage for TikTok...');
    showNotification('🚀 Auto Post: กำลังเตรียม Video สำหรับ TikTok...');
    
    try {
      // ★ Fetch blob อีกครั้ง (เพราะ blob เดิมอาจถูก revoke แล้ว) ★
      let videoBlob = null;
      try {
        const refetchResp = await fetch(downloadUrl);
        if (refetchResp.ok) {
          videoBlob = await refetchResp.blob();
        }
      } catch (e) {
        console.log('[Pipeline] Re-fetch failed, trying video elements...', e.message);
      }
      
      // Fallback: หาจาก video element
      if (!videoBlob || videoBlob.size === 0) {
        const videos = document.querySelectorAll('video');
        for (const v of videos) {
          const src = v.src || v.currentSrc;
          if (src && (src.startsWith('blob:') || src.startsWith('https://'))) {
            try {
              const resp = await fetch(src);
              videoBlob = await resp.blob();
              if (videoBlob.size > 0) break;
            } catch (e) { /* skip */ }
          }
        }
      }
      
      if (videoBlob && videoBlob.size > 0) {
        // Convert blob → base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
        reader.readAsDataURL(videoBlob);
        const base64Data = await base64Promise;
        
        console.log(`[Pipeline] Video blob → base64 done (${(videoBlob.size / 1024 / 1024).toFixed(1)} MB)`);
        showNotification(`✅ Video พร้อม (${(videoBlob.size / 1024 / 1024).toFixed(1)} MB) → ไป TikTok...`);
        
        // ★ Save blob + caption + productId to storage (เหมือน Auto Post flow) ★
        await chrome.storage.local.set({
          currentFlowData: {
            videoBlob: base64Data,
            videoBlobUrl: downloadUrl,
            videoDuration: 0,
            videoSize: videoBlob.size,
            videoSavedAt: new Date().toISOString(),
            clipDuration: 8,
            caption: storyAutoPost.caption || 'Story Mode Video',
            productId: storyAutoPost.productId || '',
            h1Headline: '',
            h2Subtitle: ''
          },
          flowStatus: 'video_saved_8s',
          flowMessage: 'Story Mode Video พร้อมอัพโหลด TikTok',
          pipelineCompleted: true
        });
        
        console.log('[Pipeline] ★ Navigating to TikTok Upload...');
        showNotification('🔗 กำลังเปิด TikTok Upload...');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        window.location.href = 'https://www.tiktok.com/tiktokstudio/upload';
        return true;
      } else {
        console.log('[Pipeline] ⚠️ Cannot get video blob for Auto Post');
        showNotification('⚠️ Auto Post: ไม่สามารถดึง Video ได้ — ข้ามไป');
      }
    } catch (apErr) {
      console.error('[Pipeline] Auto Post error:', apErr);
      showNotification('⚠️ Auto Post error — ข้ามไป');
    }
  }
  
  showNotification('🎉✅ Pipeline เสร็จสิ้น! Video Download ลงเครื่องแล้ว!');
  console.log('[Pipeline] ✅ Video downloaded to local! Done!');
  
  // ★ ส่ง signal กลับให้ sidepanel.js รู้ว่าเสร็จแล้ว ★
  await chrome.storage.local.set({ pipelineCompleted: true });
  
  return true;
}

// ════════════════════════════════════════════════════════════════════════════
// ★★★ PIPELINE HELPER FUNCTIONS — ใช้เฉพาะ Pipeline เท่านั้น ★★★
// ════════════════════════════════════════════════════════════════════════════

// ★ Pipeline: กด New Project อย่างเดียว (ไม่เรียก Auto Post steps) ★
async function pipeline_clickNewProject() {
  console.log('[Pipeline] Clicking New Project button (pipeline-only)...');
  
  // Close any popup first
  await closeWelcomePopup();
  await closeAnyVisiblePopup();
  
  // Find New Project button
  let button = null;
  const allButtons = document.querySelectorAll('button, [role="button"]');
  console.log('[Pipeline] Total buttons on page:', allButtons.length);
  
  for (const btn of allButtons) {
    const text = btn.textContent?.trim() || '';
    const ariaLabel = btn.getAttribute('aria-label')?.trim() || '';
    
    if (text.includes('New project') || text.includes('New Project') || text.includes('โปรเจกต์ใหม่') || text.includes('สร้างโปรเจกต์') ||
        ariaLabel.includes('New project') || ariaLabel.includes('New Project') || ariaLabel.includes('โปรเจกต์ใหม่')) {
      button = btn;
      console.log('[Pipeline] Found New Project button by text:', text);
      break;
    }
    
    // Check for add icon
    if (btn.querySelector('i.google-symbols')?.textContent?.trim() === 'add') {
      button = btn;
      console.log('[Pipeline] Found New Project button by add icon');
      break;
    }
  }
  
  // ★ Fallback: หาจาก "+" icon ใน toolbar (new_project pattern) ★
  if (!button) {
    console.log('[Pipeline] Primary search failed, trying fallback patterns...');
    // Fallback 1: หาปุ่มที่มี icon "add" ใน material-icons
    const icons = document.querySelectorAll('i.material-icons, i.material-symbols-outlined, i.google-symbols, .material-icons');
    for (const icon of icons) {
      if (icon.textContent?.trim() === 'add' || icon.textContent?.trim() === 'add_circle') {
        const parentBtn = icon.closest('button, [role="button"]');
        if (parentBtn) {
          button = parentBtn;
          console.log('[Pipeline] Found New Project button by fallback icon:', icon.textContent);
          break;
        }
      }
    }
  }
  
  // ★ Fallback 2: หาจาก + New project link/anchor ★
  if (!button) {
    const links = document.querySelectorAll('a, [role="link"]');
    for (const link of links) {
      const text = link.textContent?.trim() || '';
      if (text.includes('New project') || text.includes('New Project') || text.includes('โปรเจกต์ใหม่')) {
        button = link;
        console.log('[Pipeline] Found New Project link:', text);
        break;
      }
    }
  }
  
  if (button) {
    await simulateRealClick(button);
    console.log('[Pipeline] ✅ New Project button clicked!');
    showNotification('✅ [Pipeline] กด New Project แล้ว!');
    return true;
  } else {
    // ★ Log all button texts for debugging ★
    const btnTexts = [];
    allButtons.forEach(b => {
      const t = b.textContent?.trim()?.substring(0, 40);
      if (t) btnTexts.push(t);
    });
    console.log('[Pipeline] ❌ New Project NOT FOUND. Button texts:', btnTexts.slice(0, 20));
    showNotification('⚠️ [Pipeline] ไม่พบปุ่ม New Project — ลองต่อไป');
    return false;
  }
}

// ★ Pipeline: Upload user image (base64) ไปยัง Google Flow ★
async function pipeline_uploadUserImage(base64Image) {
  console.log('[Pipeline] Uploading user image (base64)...');
  
  if (!base64Image) {
    console.log('[Pipeline] No base64 image provided');
    return false;
  }
  
  try {
    // ★ Step 1: กดปุ่ม + (Add Media) ★
    let addButton = null;
    
    // วิธี 1: หาจาก aria-haspopup="menu" with add icon
    const menuButtons = document.querySelectorAll('button[aria-haspopup="menu"]');
    for (const btn of menuButtons) {
      const icon = btn.querySelector('i');
      if (icon && icon.textContent?.trim().toLowerCase() === 'add') {
        addButton = btn;
        break;
      }
    }
    
    // วิธี 2: หาจาก google-symbols add icon
    if (!addButton) {
      const addIcons = document.querySelectorAll('i.google-symbols');
      for (const icon of addIcons) {
        if (icon.textContent?.trim().toLowerCase() === 'add') {
          addButton = icon.closest('button');
          if (addButton) break;
        }
      }
    }
    
    if (!addButton) {
      console.log('[Pipeline] Add button not found');
      showNotification('⚠️ ไม่พบปุ่ม + (Add Media)');
      return false;
    }
    
    console.log('[Pipeline] Clicking Add button...');
    await simulateRealClick(addButton);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // ★ Step 2: กด Upload image ★
    let uploadOption = null;
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    for (const item of menuItems) {
      const text = item.textContent?.toLowerCase() || '';
      if (text.includes('upload image') || text.includes('upload') || text.includes('อัปโหลด')) {
        uploadOption = item;
        break;
      }
    }
    
    if (uploadOption) {
      console.log('[Pipeline] Clicking Upload image...');
      await simulateRealClick(uploadOption);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // ★ Step 3: Inject image to file input ★
    let fileInput = document.querySelector('input[type="file"]');
    if (!fileInput) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      fileInput = document.querySelector('input[type="file"]');
    }
    
    if (!fileInput) {
      console.log('[Pipeline] File input not found');
      showNotification('⚠️ ไม่พบ file input');
      return false;
    }
    
    // Convert base64 to blob
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    // Detect mime type
    let mimeType = 'image/png';
    if (base64Image.includes('data:image/jpeg')) mimeType = 'image/jpeg';
    else if (base64Image.includes('data:image/gif')) mimeType = 'image/gif';
    else if (base64Image.includes('data:image/webp')) mimeType = 'image/webp';
    
    const blob = new Blob([byteArray], { type: mimeType });
    const file = new File([blob], 'user-image.png', { type: mimeType });
    
    // Set file to input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    
    // Dispatch events
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log('[Pipeline] User image uploaded!');
    showNotification('✅ อัพโหลดรูป User สำเร็จ! รอรูปปรากฏ...');
    
    // ★ รอให้รูปอัพโหลดเสร็จ — เช็คทุก 1 วิ สูงสุด 25 วินาที ★
    const uploadStartImages = document.querySelectorAll('img').length;
    let imageAppeared = false;
    for (let w = 0; w < 25; w++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const currentImageCount = document.querySelectorAll('img').length;
      // เช็คว่ามีรูปใหม่ปรากฏหรือยัง
      if (currentImageCount > uploadStartImages) {
        console.log('[Pipeline] New image appeared after', w + 1, 'seconds');
        imageAppeared = true;
        // รอเพิ่มอีก 3 วิ ให้ render เสร็จ
        await new Promise(resolve => setTimeout(resolve, 3000));
        break;
      }
      showNotification(`⏳ รอรูปอัพโหลด... ${25 - w} วิ`);
    }
    
    if (!imageAppeared) {
      console.log('[Pipeline] Image not detected after 25s, waiting fixed 20s...');
      showNotification('⏳ รอรูปอัพโหลดเสร็จ 20 วินาที...');
      await new Promise(resolve => setTimeout(resolve, 20000));
    }
    
    // ★ Track all current image srcs as reference images (to exclude from video detection) ★
    const allImgsAfterUpload = document.querySelectorAll('img');
    for (const img of allImgsAfterUpload) {
      if (img.src && img.offsetParent !== null) {
        _uploadedRefImageSrcs.add(img.src);
      }
    }
    console.log('[Pipeline] Tracked reference image srcs:', _uploadedRefImageSrcs.size);
    
    // ★ Step 4: Hover รูปแรก (uploaded image) และ Add to Prompt ★
    await pipeline_hoverUploadedImageAndAddToPrompt();
    
    return true;
  } catch (error) {
    console.error('[Pipeline] Error uploading user image:', error);
    showNotification('❌ Error: ' + error.message);
    return false;
  }
}

// Pipeline Step 2: เลือก Image - Portrait - x1
async function pipeline_selectImagePortrait() {
  console.log('[Pipeline] Step 2: Selecting Image - Portrait - x1...');
  
  // ★ Helper: หา dropdown button ★
  const findDropdown = () => {
    // วิธี 1: หาจาก class ที่เฉพาะเจาะจง
    let btn = document.querySelector('button.sc-46973129-1[aria-haspopup="menu"]');
    if (btn) return btn;
    // วิธี 2: หาจากข้อความ Nano Banana / Pro / Ultra
    const allButtons = document.querySelectorAll('button[aria-haspopup="menu"]');
    for (const b of allButtons) {
      const text = b.textContent || '';
      if (text.includes('Nano') || text.includes('Banana') || text.includes('Pro') || text.includes('Ultra') || text.includes('🍌')) {
        return b;
      }
    }
    // วิธี 3: หา button ที่มี aria-haspopup ที่อยู่ใกล้ prompt area (ด้านล่างของหน้า)
    for (const b of allButtons) {
      const rect = b.getBoundingClientRect();
      if (rect.bottom > window.innerHeight * 0.7 && rect.width > 80) return b;
    }
    return null;
  };
  
  // ★ Helper: หา tab button — ค้นหาจากทุก button (ไม่จำกัด role="tab" เพราะ Google Flow UI เปลี่ยนบ่อย) ★
  const findTab = (keyword) => {
    const roleTabs = document.querySelectorAll('button[role="tab"]');
    const allBtns = document.querySelectorAll('button, [role="tab"], [data-radix-collection-item]');
    
    // ★ PORTRAIT (9:16): ค้นหาปุ่มที่มี "9:16" ★
    if (keyword === 'PORTRAIT') {
      // วิธี 1: หาจาก role="tab" ที่มี text "9:16"
      for (const tab of roleTabs) {
        if ((tab.textContent?.trim() || '').includes('9:16')) return tab;
      }
      // วิธี 2: หาจากทุก button ที่มี text "9:16" (Google Flow UI ใหม่อาจไม่มี role="tab")
      for (const btn of allBtns) {
        const text = btn.textContent?.trim() || '';
        if (text.includes('9:16') && btn.offsetParent !== null) return btn;
      }
      // วิธี 3: icon crop_9_16
      const icons = document.querySelectorAll('i.google-symbols, span.google-symbols');
      for (const icon of icons) {
        if (icon.textContent?.trim() === 'crop_9_16') {
          const btn = icon.closest('button') || icon.closest('[role="tab"]');
          if (btn) return btn;
        }
      }
      // วิธี 4: หาปุ่มสุดท้ายในกลุ่ม aspect ratio (9:16 มักอยู่ขวาสุด)
      const ratioGroup = document.querySelectorAll('button');
      const ratioButtons = [];
      for (const btn of ratioGroup) {
        const t = btn.textContent?.trim() || '';
        if (/^\d+:\d+$/.test(t) && btn.offsetParent !== null) ratioButtons.push(btn);
      }
      if (ratioButtons.length >= 4) {
        const last = ratioButtons[ratioButtons.length - 1];
        if (last.textContent?.trim() === '9:16') return last;
      }
      return null;
    }
    
    // วิธี 1: จาก id
    const byId = document.querySelector(`button[role="tab"][id*="trigger-${keyword}"]`);
    if (byId) return byId;
    // วิธี 2: จากข้อความ (role="tab" ก่อน แล้ว fallback ทุก button)
    const searchSets = [roleTabs, allBtns];
    for (const set of searchSets) {
      for (const tab of set) {
        const text = tab.textContent?.trim() || '';
        if (keyword === '1') {
          if (text === 'x1' && tab.offsetParent !== null) return tab;
        } else if (keyword === 'IMAGE') {
          if ((text.includes('Image') || text.includes('รูปภาพ')) && !(text.includes('Video') || text.includes('วิดีโอ')) && tab.offsetParent !== null) return tab;
        }
      }
    }
    // วิธี 3: จาก icon
    if (keyword === 'IMAGE') {
      const icons = document.querySelectorAll('i.google-symbols, span.google-symbols');
      for (const icon of icons) {
        if (icon.textContent?.trim() === 'image') {
          const btn = icon.closest('button') || icon.closest('[role="tab"]');
          if (btn) return btn;
        }
      }
    }
    return null;
  };
  
  // ★ Helper: เช็คว่า x1 ถูก selected จริงหรือยัง ★
  const isX1Selected = () => {
    const tabs = document.querySelectorAll('button[role="tab"]');
    for (const tab of tabs) {
      const text = tab.textContent?.trim() || '';
      if (text === 'x1') {
        const selected = tab.getAttribute('aria-selected') === 'true' || tab.getAttribute('data-state') === 'active' || tab.classList.contains('active');
        console.log('[Pipeline] x1 tab aria-selected:', tab.getAttribute('aria-selected'), 'data-state:', tab.getAttribute('data-state'));
        return selected;
      }
    }
    return false;
  };
  
  // ★ เลือก x1 ครั้งเดียว (ไม่ retry เพราะ UI confirm attribute ไม่แน่นอน) ★
  let imageClicked = false;
  let portraitClicked = false;
  let x1Clicked = false;
  
  // Step 2.1: กด dropdown
  const dropdownBtn = findDropdown();
  if (dropdownBtn) {
    console.log('[Pipeline] Found dropdown:', dropdownBtn.textContent?.substring(0, 30));
    await simulateRealClick(dropdownBtn);
    await new Promise(resolve => setTimeout(resolve, 2500));

    // ★ PD-INSPIRED: เลือก model เฉพาะ ถ้า user ตั้งค่าไว้ ★
    const flowData = currentFlowData || {};
    const requestedModel = flowData.flowImageModel || 'auto';
    if (requestedModel !== 'auto') {
      const MODEL_TEXT_MAP = {
        'imagen_4': ['imagen 4', 'imagen4'],
        'nano_banana_pro': ['nano banana pro', 'banana pro'],
        'nano_banana_2': ['nano banana 2', 'banana 2']
      };
      const searchTexts = MODEL_TEXT_MAP[requestedModel] || [requestedModel.replace(/_/g, ' ')];
      const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], li, button');
      let modelClicked = false;
      for (const item of menuItems) {
        if (item.offsetParent === null) continue;
        const text = (item.textContent || '').toLowerCase().trim();
        if (searchTexts.some(s => text.includes(s))) {
          console.log(`[Pipeline] Selecting model: ${requestedModel} (matched: "${text}")`);
          await simulateRealClick(item);
          modelClicked = true;
          await new Promise(resolve => setTimeout(resolve, 1500));
          break;
        }
      }
      if (!modelClicked) {
        console.log(`[Pipeline] Model "${requestedModel}" not found in dropdown — using default`);
      }
    }
  } else {
    console.log('[Pipeline] Dropdown not found!');
  }
  
  // Step 2.2: เลือก Image tab
  const imageTab = findTab('IMAGE');
  if (imageTab) {
    console.log('[Pipeline] Found Image tab');
    await simulateRealClick(imageTab);
    imageClicked = true;
  }
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Step 2.3: เลือก Portrait tab
  const portraitTab = findTab('PORTRAIT');
  if (portraitTab) {
    console.log('[Pipeline] Found Portrait tab');
    await simulateRealClick(portraitTab);
    portraitClicked = true;
  }
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Step 2.4: เลือก x1 tab
  const x1Tab = findTab('1');
  if (x1Tab) {
    console.log('[Pipeline] Found x1 tab, clicking...');
    await simulateRealClick(x1Tab);
    x1Clicked = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    console.log('[Pipeline] x1 tab NOT found!');
  }
  
  console.log('[Pipeline] Step 2 completed - Image:', imageClicked, 'Portrait:', portraitClicked, 'x1:', x1Clicked);
  showNotification(`✅ Step 2: Image=${imageClicked}, Portrait=${portraitClicked}, x1=${x1Clicked}`);
  return x1Clicked;
}

// Pipeline Step 1/5: วาง Prompt ลง Slate editor (รับ prompt โดยตรง)
async function pipeline_pastePromptToSlate(prompt) {
  prompt = sanitizePromptForFlow(prompt);
  console.log('[Pipeline] Pasting prompt to Slate editor...');
  console.log('[Pipeline] Prompt:', prompt?.substring(0, 80));
  
  if (!prompt) {
    console.log('[Pipeline] ERROR: No prompt to paste!');
    return false;
  }
  
  // ★ Helper: ตรวจสอบว่า editor มี text จริง (ไม่ใช่แค่ placeholder) ★
  const hasRealText = (el) => {
    const text = (el.value || el.textContent || '').trim();
    return text.length > 20 && !text.includes('What do you want') && !text.includes('Generate');
  };
  
  // ★★★ วิธี -1 (ลำดับแรกสุด): ใช้ PASTE_TO_SLATE ผ่าน background.js → MAIN world ★★★
  // วิธีนี้เข้าถึง Slate Editor instance จริง (insertText) → React state อัพเดท → ปุ่ม Generate enable
  try {
    console.log('[Pipeline] Method MAIN: Sending PASTE_TO_SLATE via background (MAIN world)...');
    await chrome.runtime.sendMessage({ type: 'PASTE_TO_SLATE', promptText: prompt });
    
    // รอผลจาก page context (สูงสุด 8 วินาที)
    let mainResult = 'pending';
    for (let wait = 0; wait < 16; wait++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        const result = await chrome.runtime.sendMessage({ type: 'READ_SLATE_PASTE_RESULT' });
        if (result && result.status !== 'pending') {
          mainResult = result.status;
          console.log('[Pipeline] Method MAIN result:', result.status, result.method || result.message || '');
          break;
        }
      } catch (e) {}
    }
    
    if (mainResult === 'success') {
      console.log('[Pipeline] Method MAIN (PASTE_TO_SLATE) succeeded!');
      showNotification('✅ วาง Prompt สำเร็จ (Slate API)!');
      return true;
    }
    console.log('[Pipeline] Method MAIN failed:', mainResult, '— trying content script methods...');
  } catch (e) {
    console.log('[Pipeline] Method MAIN error:', e.message);
  }
  
  // ★★★ วิธี 0: ลองหา TEXTAREA ก่อน (Google Flow อาจเปลี่ยน UI จาก Slate → textarea) ★★★
  let promptTextarea = document.getElementById('PINHOLE_TEXT_AREA_ELEMENT_ID');
  if (!promptTextarea) {
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      const ph = (ta.placeholder || '').toLowerCase();
      if (ph.includes('generate') || ph.includes('describe') || ph.includes('prompt') || ph.includes('image') || ph.includes('video')) {
        promptTextarea = ta;
        break;
      }
    }
  }
  
  if (promptTextarea) {
    console.log('[Pipeline] Found TEXTAREA — using textarea paste method (like Auto Post)');
    try {
      promptTextarea.focus();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // ★ ใช้ nativeInputValueSetter เพื่อ bypass React state (วิธีที่ Auto Post ใช้สำเร็จ) ★
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(promptTextarea, prompt);
      } else {
        promptTextarea.value = prompt;
      }
      
      // Trigger React events
      promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      promptTextarea.dispatchEvent(new Event('change', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (promptTextarea.value.length > 20) {
        console.log('[Pipeline] Method 0 (textarea + nativeSetter) succeeded!');
        showNotification('✅ วาง Prompt สำเร็จ (textarea)!');
        return true;
      }
    } catch (e) {
      console.log('[Pipeline] Method 0 (textarea) error:', e);
    }
  }
  
  // ★ หา Slate editor ★
  let slateEditor = document.querySelector('[data-slate-editor="true"]');
  
  if (!slateEditor) {
    const editables = document.querySelectorAll('[contenteditable="true"]');
    for (const el of editables) {
      if (el.querySelector('[data-slate-node]')) {
        slateEditor = el;
        break;
      }
    }
  }
  
  // ★ Fallback: หา contenteditable ทั่วไป (ไม่จำเป็นต้องมี data-slate-node) ★
  if (!slateEditor) {
    const editables = document.querySelectorAll('[contenteditable="true"]');
    for (const el of editables) {
      // ข้ามพวก notification/tooltip ที่ extension สร้างขึ้น
      if (el.offsetHeight > 30 && el.offsetWidth > 100 && !el.closest('.tap-notification')) {
        slateEditor = el;
        console.log('[Pipeline] Using generic contenteditable fallback');
        break;
      }
    }
  }
  
  if (!slateEditor) {
    console.log('[Pipeline] Slate editor not found — trying clipboard fallback');
    // ★ ถ้าหา editor ไม่เจอเลย → copy to clipboard ให้ user วางเอง ★
    try {
      await navigator.clipboard.writeText(prompt);
      showNotification('📋 ไม่พบช่อง editor — กรุณากด Ctrl+V วาง Prompt (รอ 15 วิ)');
      for (let i = 15; i > 0; i--) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // เช็คว่ามี editor โผล่มาหรือยัง
        const newEditor = document.querySelector('[data-slate-editor="true"], textarea, [contenteditable="true"]');
        if (newEditor) {
          const txt = (newEditor.value || newEditor.textContent || '').trim();
          if (txt.length > 20) {
            console.log('[Pipeline] User pasted manually — detected text in editor');
            showNotification('✅ วาง Prompt สำเร็จ!');
            return true;
          }
        }
        showNotification(`📋 กรุณากด Ctrl+V (${i} วิ)`);
      }
    } catch (e) {
      console.log('[Pipeline] Clipboard fallback error:', e);
    }
    showNotification('⚠️ ไม่พบช่อง editor');
    return false;
  }
  
  console.log('[Pipeline] Found Slate editor:', slateEditor.className);
  
  // ★★★ Step 0: Clear text เก่าก่อน (Select All + Delete) ★★★
  try {
    slateEditor.focus();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Select All เพื่อลบ text เก่า
    const selClear = window.getSelection();
    const rangeClear = document.createRange();
    rangeClear.selectNodeContents(slateEditor);
    selClear.removeAllRanges();
    selClear.addRange(rangeClear);
    
    // กด Delete เพื่อลบ text ที่ select ไว้
    document.execCommand('delete', false, null);
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('[Pipeline] Cleared old text from Slate editor');
  } catch (clearErr) {
    console.log('[Pipeline] Clear old text failed (non-critical):', clearErr);
  }
  
  // ★★★ วิธี 1: Copy to clipboard จริง + DataTransfer paste event ★★★
  // ★ v2.59: เขียนลง clipboard จริงก่อน แล้วค่อย dispatch paste event ★
  try {
    // เขียนลง clipboard จริงก่อน (เผื่อ Slate อ่านจาก clipboard)
    try { await navigator.clipboard.writeText(prompt); } catch (_) {}
    
    slateEditor.focus();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // สร้าง DataTransfer object
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', prompt);
    
    // สร้าง paste event
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dataTransfer
    });
    
    // Dispatch paste event
    slateEditor.dispatchEvent(pasteEvent);
    
    // ★ v2.59: เพิ่ม wait จาก 500 → 1500ms เพื่อให้ Slate render ทัน ★
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (hasRealText(slateEditor)) {
      console.log('[Pipeline] Method 1 (clipboard + paste event) succeeded!');
      showNotification('✅ วาง Prompt สำเร็จ!');
      return true;
    }
    console.log('[Pipeline] Method 1 failed, trying method 2...');
  } catch (e) {
    console.log('[Pipeline] Method 1 error:', e);
  }
  
  // ★★★ วิธี 2: ใช้ InputEvent beforeinput — ทั้ง insertFromPaste และ insertText ★★★
  try {
    slateEditor.focus();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Select all first
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(slateEditor);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // ★ ลอง insertFromPaste ก่อน ★
    const dt = new DataTransfer();
    dt.setData('text/plain', prompt);
    
    const beforeInputEvent = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertFromPaste',
      data: prompt,
      dataTransfer: dt
    });
    slateEditor.dispatchEvent(beforeInputEvent);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (hasRealText(slateEditor)) {
      console.log('[Pipeline] Method 2a (beforeinput insertFromPaste) succeeded!');
      showNotification('✅ วาง Prompt สำเร็จ!');
      return true;
    }
    
    // ★ ลอง insertText แทน (Slate บาง version ใช้อันนี้) ★
    const beforeInputEvent2 = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: prompt
    });
    slateEditor.dispatchEvent(beforeInputEvent2);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (hasRealText(slateEditor)) {
      console.log('[Pipeline] Method 2b (beforeinput insertText) succeeded!');
      showNotification('✅ วาง Prompt สำเร็จ!');
      return true;
    }
    console.log('[Pipeline] Method 2 failed, trying method 3...');
  } catch (e) {
    console.log('[Pipeline] Method 2 error:', e);
  }
  
  // ★★★ วิธี 3: ใช้ execCommand('insertText') ★★★
  try {
    slateEditor.focus();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Select all and delete
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Insert text
    const success = document.execCommand('insertText', false, prompt);
    console.log('[Pipeline] execCommand insertText result:', success);
    
    // ★ v2.59: เพิ่ม wait จาก 500 → 1500ms ★
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (hasRealText(slateEditor)) {
      console.log('[Pipeline] Method 3 (execCommand) succeeded!');
      showNotification('✅ วาง Prompt สำเร็จ!');
      return true;
    }
    console.log('[Pipeline] Method 3 failed, trying method 4...');
  } catch (e) {
    console.log('[Pipeline] Method 3 error:', e);
  }
  
  // ★★★ วิธี 4: beforeinput ทีละตัวอักษร (ใช้ Slate-compatible events) ★★★
  // ★ v2.59 FIX: ลบ innerHTML='' ที่ทำลาย Slate state — ใช้ execCommand แทน ★
  try {
    slateEditor.focus();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ★ Clear ด้วย execCommand (ไม่ทำลาย Slate state) แทน innerHTML='' ★
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // พิมพ์ทีละตัวด้วย beforeinput event (Slate ฟัง event นี้)
    const shortPrompt = prompt.substring(0, 200);
    for (const char of shortPrompt) {
      const beforeInput = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: char
      });
      slateEditor.dispatchEvent(beforeInput);
      
      // ★ ให้ Slate มีเวลา process แต่ละตัวอักษร ★
      if (shortPrompt.indexOf(char) % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (hasRealText(slateEditor)) {
      console.log('[Pipeline] Method 4 (beforeinput typing) succeeded!');
      showNotification('✅ วาง Prompt สำเร็จ!');
      return true;
    }
    console.log('[Pipeline] Method 4 failed, trying method 5...');
  } catch (e) {
    console.log('[Pipeline] Method 4 error:', e);
  }
  
  // ★★★ วิธี 5: Copy to clipboard + แจ้ง user กด Ctrl+V ★★★
  try {
    await navigator.clipboard.writeText(prompt);
    console.log('[Pipeline] Copied to clipboard - waiting for manual paste');
    showNotification('📋 กรุณากด Ctrl+V เพื่อวาง Prompt (รอ 15 วิ)');
    
    // รอให้ user กด Ctrl+V
    for (let i = 15; i > 0; i--) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (hasRealText(slateEditor)) {
        console.log('[Pipeline] Method 5 (manual paste) succeeded!');
        showNotification('✅ วาง Prompt สำเร็จ!');
        return true;
      }
      // ★ เช็ค textarea ด้วย (เผื่อ UI เปลี่ยน) ★
      const ta = document.querySelector('textarea');
      if (ta && ta.value.length > 20) {
        console.log('[Pipeline] Method 5 detected text in textarea after manual paste');
        showNotification('✅ วาง Prompt สำเร็จ!');
        return true;
      }
      showNotification(`📋 กรุณากด Ctrl+V (${i} วิ)`);
    }
  } catch (e) {
    console.log('[Pipeline] Method 5 error:', e);
  }
  
  console.log('[Pipeline] All paste methods failed!');
  showNotification('⚠️ วาง Prompt ไม่สำเร็จ — กรุณาวางเอง');
  return false;
}

// Pipeline Step 3: กด Generate (ปุ่มสีน้ำเงินที่มี arrow_forward)
// ★ v2.83 FIX: force-enable disabled button + retry หาปุ่ม ★
async function pipeline_clickGenerate() {
  console.log('[Pipeline] Step 3: Clicking Generate button...');
  
  const findGenBtn = () => {
    // Method 1: หา icon arrow_forward (ไม่สน disabled)
    const icons = document.querySelectorAll('i.google-symbols, span.google-symbols');
    for (const icon of icons) {
      if (icon.textContent?.trim() === 'arrow_forward') {
        const btn = icon.closest('button');
        if (btn && !btn.getAttribute('aria-haspopup') && btn.offsetParent !== null) {
          return btn;
        }
      }
    }
    // Method 2: หา icon send
    for (const icon of icons) {
      if (icon.textContent?.trim() === 'send') {
        const btn = icon.closest('button');
        if (btn && !btn.getAttribute('aria-haspopup') && btn.offsetParent !== null) {
          return btn;
        }
      }
    }
    // Method 3: หาปุ่มกลมที่มี arrow icon
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      const icon = btn.querySelector('i.google-symbols');
      if (icon?.textContent?.includes('arrow') && !btn.getAttribute('aria-haspopup') && btn.offsetParent !== null) {
        return btn;
      }
    }
    return null;
  };
  
  // ★ รอหาปุ่มสูงสุด 10 วิ (UI อาจยังโหลดไม่เสร็จ) ★
  let genBtn = null;
  for (let i = 0; i < 10; i++) {
    genBtn = findGenBtn();
    if (genBtn) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!genBtn) {
    console.log('[Pipeline] Generate button not found after 10s — trying Enter key fallback');
    const slateEl = document.querySelector('[data-slate-editor="true"], [contenteditable="true"]');
    if (slateEl) {
      slateEl.focus();
      slateEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      slateEl.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      slateEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      console.log('[Pipeline] ✅ Enter key dispatched as fallback');
      showNotification('✅ กด Enter แทน Generate!');
      return true;
    }
    showNotification('⚠️ ไม่พบปุ่ม Generate');
    return false;
  }
  
  // ★ ถ้า disabled → รอสูงสุด 5 วิ ให้ enable เอง ★
  if (genBtn.disabled) {
    console.log('[Pipeline] Generate button is disabled, waiting up to 5s...');
    for (let w = 0; w < 5; w++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      genBtn = findGenBtn();
      if (genBtn && !genBtn.disabled) break;
    }
  }
  
  // ★ ถ้ายัง disabled → force-enable แล้วกด (Slate internal state อาจอัพเดทแล้วแต่ UI ไม่ทัน) ★
  if (genBtn && genBtn.disabled) {
    console.log('[Pipeline] Force-enabling disabled Generate button');
    genBtn.disabled = false;
    genBtn.removeAttribute('disabled');
    genBtn.removeAttribute('aria-disabled');
    genBtn.style.pointerEvents = 'auto';
  }
  
  if (genBtn) {
    console.log('[Pipeline] Clicking Generate button (single-click only)...');

    // ★ PD-INSPIRED: ซ่อน overlay ก่อนคลิก ป้องกัน overlay บังปุ่ม ★
    const hiddenOverlays = hideOverlayForClick();

    // ★ FIX: ใช้ single-click เท่านั้น ป้องกัน generate ซ้ำ 3 ครั้ง ★
    let clicked = false;

    // วิธี 1: React Props onClick (แม่นยำที่สุด, ไม่มี duplicate)
    for (const key of Object.keys(genBtn)) {
      if (key.startsWith('__reactProps') || key.startsWith('__reactFiber')) {
        const props = genBtn[key];
        if (props && typeof props.onClick === 'function') {
          console.log('[Pipeline] Generate: Using React onClick');
          props.onClick({ type: 'click', target: genBtn, currentTarget: genBtn, preventDefault() {}, stopPropagation() {} });
          clicked = true;
          break;
        }
      }
    }

    // วิธี 2: Synthetic pointer + mouse events (ไม่มี backup click)
    if (!clicked) {
      console.log('[Pipeline] Generate: Using synthetic events (single)');
      const rect = genBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      genBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: cx, clientY: cy, pointerId: 1 }));
      await new Promise(r => setTimeout(r, 30));
      genBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: cx, clientY: cy }));
      await new Promise(r => setTimeout(r, 30));
      genBtn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: cx, clientY: cy, pointerId: 1 }));
      await new Promise(r => setTimeout(r, 30));
      genBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: cx, clientY: cy }));
      await new Promise(r => setTimeout(r, 30));
      genBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }));
      clicked = true;
    }

    // ★ PD-INSPIRED: คืน overlay ★
    await new Promise(r => setTimeout(r, 100));
    showOverlayAfterClick(hiddenOverlays);

    console.log('[Pipeline] Generate button clicked (once)!');
    showNotification('✅ กด Generate แล้ว!');
    return true;
  }
  
  showNotification('⚠️ ไม่พบปุ่ม Generate');
  return false;
}

// Pipeline Step 8: Hover รูปใหม่ + Add to Prompt
// ★ initialImageSrcs = Set ของ src รูปที่มีอยู่ก่อน generate → ข้ามรูปเก่า เลือกเฉพาะรูปใหม่ ★
async function pipeline_hoverImageAndAddToPrompt(initialImageSrcs = null) {
  console.log('[Pipeline] Step 4/8: Hover NEW image and Add to Prompt...');
  console.log('[Pipeline] Has initialImageSrcs:', !!initialImageSrcs, 'count:', initialImageSrcs?.size || 0);
  
  // ★ หารูปที่ generate ใหม่ (ไม่อยู่ใน initialImageSrcs) ★
  // ★ v2.46 FIX: เอาตัว **สุดท้าย** (ใหม่สุด) แทนตัวแรก (เก่าสุด) ★
  let targetImage = null;
  
  // วิธี 1: หา blob image ที่มองเห็นได้ — เอาตัว **สุดท้าย** ที่ไม่ใช่รูปเก่า
  const blobImages = document.querySelectorAll('img[src^="blob:"]');
  console.log('[Pipeline] Found', blobImages.length, 'blob images');
  for (const img of blobImages) {
    const rect = img.getBoundingClientRect();
    if (img.offsetParent !== null && rect.width > 60 && rect.height > 60) {
      // ★ ข้ามรูปเก่า (ถ้ามี initialImageSrcs) ★
      if (initialImageSrcs && initialImageSrcs.has(img.src)) {
        continue;
      }
      targetImage = img; // ★ ไม่ break — เก็บตัวสุดท้าย (ใหม่สุด) ★
    }
  }
  if (targetImage) {
    const r = targetImage.getBoundingClientRect();
    console.log('[Pipeline] Found NEWEST blob image:', r.width, 'x', r.height, targetImage.src.substring(0, 50));
  }
  
  // วิธี 2: หารูปขนาดใหญ่ — เอาตัว **สุดท้าย** ที่ไม่ใช่รูปเก่า
  if (!targetImage) {
    const allImages = document.querySelectorAll('img');
    console.log('[Pipeline] Checking', allImages.length, 'total images');
    for (const img of allImages) {
      const rect = img.getBoundingClientRect();
      if (img.offsetParent !== null && rect.width > 60 && rect.height > 60 && rect.top > 0 && rect.left > 0) {
        // ★ ข้ามรูปเก่า ★
        if (initialImageSrcs && initialImageSrcs.has(img.src)) {
          continue;
        }
        targetImage = img; // ★ เก็บตัวสุดท้าย ★
      }
    }
    if (targetImage) {
      const r = targetImage.getBoundingClientRect();
      console.log('[Pipeline] Found NEWEST large image:', r.width, 'x', r.height);
    }
  }
  
  // ★ Fallback: ถ้าไม่เจอรูปใหม่ ให้เลือกรูป **สุดท้าย** ที่เจอ (ใหม่สุดใน DOM) ★
  if (!targetImage) {
    console.log('[Pipeline] No NEW image found, falling back to last visible image...');
    const blobImagesAll = document.querySelectorAll('img[src^="blob:"]');
    for (const img of blobImagesAll) {
      const rect = img.getBoundingClientRect();
      if (img.offsetParent !== null && rect.width > 60 && rect.height > 60) {
        targetImage = img; // ★ เก็บตัวสุดท้าย ★
      }
    }
    if (targetImage) {
      console.log('[Pipeline] Fallback: using last blob image');
    }
  }
  
  if (!targetImage) {
    console.log('[Pipeline] No image found for Add to Prompt');
    showNotification('⚠️ ไม่พบรูป');
    return false;
  }
  
  console.log('[Pipeline] Target image found, right-clicking...');
  showNotification('🖱️ คลิกขวาที่รูปล่าสุด...');
  
  // ★ Scroll image into view ★
  targetImage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // ★ Try right-click multiple times (เหมือน Auto Post version) ★
  let addToPromptBtn = null;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    console.log('[Pipeline] Right-click attempt', attempt + 1);
    
    // ★ Get image position (recalc หลัง scroll) ★
    const rect = targetImage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // ★ Focus and hover first ★
    targetImage.focus?.();
    targetImage.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: centerX, clientY: centerY }));
    targetImage.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: centerX, clientY: centerY }));
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ★ Right-click on the image ★
    targetImage.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true, clientX: centerX, clientY: centerY, button: 2, view: window
    }));
    
    // รอให้ context menu โหลด (เผื่อเน็ตช้า)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // ★ ใช้ findAddToPromptButton() helper (มี 4 methods + retry 5 รอบ) ★
    addToPromptBtn = await findAddToPromptButton();
    
    if (addToPromptBtn) {
      console.log('[Pipeline] Found Add to Prompt at attempt', attempt + 1);
      break;
    }
    
    // ถ้าไม่เจอ ลองคลิกที่อื่นเพื่อปิด menu แล้วลองใหม่
    if (attempt < 2) {
      console.log('[Pipeline] Add to Prompt not found, retrying...');
      document.body.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  if (addToPromptBtn) {
    console.log('[Pipeline] Clicking Add to Prompt...');
    showNotification('🖱️ กด Add to Prompt...');
    
    // Click with multiple methods
    addToPromptBtn.click();
    addToPromptBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('[Pipeline] Add to Prompt clicked!');
    showNotification('✅ Add to Prompt เสร็จ!');
    return true;
  }
  
  console.log('[Pipeline] Add to Prompt not found after all attempts');
  showNotification('⚠️ ไม่พบ Add to Prompt');
  return false;
}

// ★ Pipeline: Hover uploaded image + คลิกขวา + Add to Prompt ★
// ใช้เฉพาะหลังอัพรูป — ต่างจาก pipeline_hoverImageAndAddToPrompt ที่หารูป generated
async function pipeline_hoverUploadedImageAndAddToPrompt() {
  console.log('[Pipeline] Hover uploaded image and Add to Prompt...');
  showNotification('🖱️ กำลัง Hover รูปที่อัพโหลด...');
  
  // ★ หารูปในหน้า ★
  let targetImage = null;
  
  const allImages = document.querySelectorAll('img');
  console.log('[Pipeline] Total images on page:', allImages.length);
  
  // เก็บรูปที่มีขนาดใหญ่พอ + visible
  const visibleLargeImages = [];
  for (const img of allImages) {
    const rect = img.getBoundingClientRect();
    if (img.offsetParent !== null && rect.width > 50 && rect.height > 50 && rect.top > 0 && rect.left > 0) {
      visibleLargeImages.push({ img, rect, area: rect.width * rect.height });
    }
  }
  
  console.log('[Pipeline] Visible large images:', visibleLargeImages.length);
  
  // ★ Sort by position: top-left first ★
  if (visibleLargeImages.length > 0) {
    visibleLargeImages.sort((a, b) => {
      const rowDiff = Math.abs(a.rect.top - b.rect.top);
      if (rowDiff < 50) return a.rect.left - b.rect.left;
      return a.rect.top - b.rect.top;
    });
    
    targetImage = visibleLargeImages[0].img;
    const rect = visibleLargeImages[0].rect;
    console.log('[Pipeline] Selected FIRST image:', rect.width, 'x', rect.height, 'at', rect.left, rect.top);
    console.log('[Pipeline] Image src:', targetImage.src?.substring(0, 80));
  }
  
  if (!targetImage) {
    console.log('[Pipeline] No uploaded image found');
    showNotification('⚠️ ไม่พบรูปที่อัพโหลด');
    return false;
  }
  
  // ★ Hover รูป ★
  const rect = targetImage.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  console.log('[Pipeline] Hovering uploaded image at:', centerX, centerY);
  targetImage.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: centerX, clientY: centerY }));
  targetImage.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: centerX, clientY: centerY }));
  targetImage.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: centerX, clientY: centerY }));
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // ★ คลิกขวา ★
  console.log('[Pipeline] Right-clicking uploaded image...');
  showNotification('🖱️ คลิกขวาที่รูปสินค้า...');
  targetImage.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true, cancelable: true, clientX: centerX, clientY: centerY, button: 2, view: window
  }));
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // ★ หา "Add to prompt" แล้วคลิก ★
  let addToPromptClicked = false;
  
  // วิธี 1: หาจาก role="menuitem"
  const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"]');
  console.log('[Pipeline] Found', menuItems.length, 'menu items after right-click');
  for (const item of menuItems) {
    const text = item.textContent?.toLowerCase() || '';
    console.log('[Pipeline] Menu item:', text);
    if (text.includes('add to prompt')) {
      console.log('[Pipeline] Found "Add to Prompt" menu item!');
      await simulateRealClick(item);
      addToPromptClicked = true;
      break;
    }
  }
  
  // วิธี 2: หาจาก button/div ทั่วไป
  if (!addToPromptClicked) {
    const allButtons = document.querySelectorAll('button, div[role="button"], [data-radix-collection-item]');
    for (const btn of allButtons) {
      const text = btn.textContent?.toLowerCase() || '';
      if (text.includes('add to prompt')) {
        console.log('[Pipeline] Found "Add to Prompt" button!');
        await simulateRealClick(btn);
        addToPromptClicked = true;
        break;
      }
    }
  }
  
  // วิธี 3: หาจาก google-symbols icon "add"
  if (!addToPromptClicked) {
    const icons = document.querySelectorAll('i.google-symbols');
    for (const icon of icons) {
      if (icon.textContent?.trim() === 'add') {
        const parent = icon.closest('[role="menuitem"], button');
        if (parent && parent.textContent?.toLowerCase().includes('prompt')) {
          console.log('[Pipeline] Found "Add to Prompt" via icon');
          await simulateRealClick(parent);
          addToPromptClicked = true;
          break;
        }
      }
    }
  }
  
  if (addToPromptClicked) {
    console.log('[Pipeline] ✅ Add to Prompt clicked for uploaded image!');
    showNotification('✅ Add to Prompt (รูปสินค้า) เสร็จ!');
    return true;
  }
  
  console.log('[Pipeline] ⚠️ Add to Prompt not found after right-click');
  showNotification('⚠️ ไม่พบ Add to Prompt');
  return false;
}

// Pipeline Step: เลือก Video - Frames - Portrait - x1 tabs (ไม่กด Generate)
// ★ แยกออกจาก Generate เพราะต้องวาง prompt หลังเลือก tab — ไม่งั้น prompt ถูก clear ★
async function pipeline_selectVideoTabs() {
  console.log('[Pipeline] Selecting Video - Frames - Portrait - x1 tabs...');
  
  // ★ Step 1: กด dropdown "Nano Banana Pro" (ถ้ามี) ★
  let dropdownBtn = null;
  const allButtons = document.querySelectorAll('button[aria-haspopup="menu"]');
  
  for (const btn of allButtons) {
    const text = btn.textContent || '';
    if (text.includes('Nano') || text.includes('Banana') || text.includes('🍌')) {
      dropdownBtn = btn;
      console.log('[Pipeline] Found Nano Banana dropdown:', text.substring(0, 40));
      break;
    }
  }
  
  if (!dropdownBtn) {
    dropdownBtn = document.querySelector('button[aria-haspopup="menu"]');
    console.log('[Pipeline] Using fallback dropdown');
  }
  
  if (dropdownBtn) {
    console.log('[Pipeline] Clicking dropdown...');
    await simulateRealClick(dropdownBtn);
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // ★ Step 2: เลือก Video tab ★
  let videoClicked = false;
  const videoTabs = document.querySelectorAll('button[role="tab"]');
  
  for (const tab of videoTabs) {
    const text = tab.textContent?.toLowerCase() || '';
    const id = tab.id || '';
    if (((text.includes('video') || text.includes('วิดีโอ')) && !(text.includes('image') || text.includes('รูปภาพ'))) || id.includes('VIDEO')) {
      console.log('[Pipeline] Found Video tab:', text, 'id:', id);
      await simulateRealClick(tab);
      videoClicked = true;
      break;
    }
  }
  
  if (!videoClicked) {
    const icons = document.querySelectorAll('i.google-symbols');
    for (const icon of icons) {
      if (icon.textContent?.trim() === 'videocam') {
        const btn = icon.closest('button');
        if (btn) {
          console.log('[Pipeline] Found Video via icon');
          await simulateRealClick(btn);
          videoClicked = true;
          break;
        }
      }
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // ★ Step 3: เลือก Frames tab ★
  let framesClicked = false;
  const framesTabs = document.querySelectorAll('button[role="tab"]');
  
  for (const tab of framesTabs) {
    const text = tab.textContent?.toLowerCase() || '';
    const id = tab.id || '';
    if (text.includes('frames') || text.includes('frame') || text.includes('เฟรม') || id.includes('FRAMES') || id.includes('VIDEO_FRAMES')) {
      console.log('[Pipeline] Found Frames tab:', text, 'id:', id);
      await simulateRealClick(tab);
      framesClicked = true;
      break;
    }
  }
  
  if (!framesClicked) {
    const icons = document.querySelectorAll('i.google-symbols');
    for (const icon of icons) {
      if (icon.textContent?.trim() === 'crop_free') {
        const btn = icon.closest('button[role="tab"]');
        if (btn) {
          console.log('[Pipeline] Found Frames via icon');
          await simulateRealClick(btn);
          framesClicked = true;
          break;
        }
      }
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // ★ Step 4: เลือก Portrait (9:16) tab — ★ ค้นหา "9:16" ก่อน เพราะ 3:4 ก็เป็น portrait ★
  let portraitClicked = false;
  const portraitTabs = document.querySelectorAll('button[role="tab"]');
  
  // Priority 1: ค้นหา "9:16" จากข้อความ
  for (const tab of portraitTabs) {
    const text = tab.textContent?.trim() || '';
    if (text.includes('9:16')) {
      console.log('[Pipeline] Found 9:16 tab:', text);
      await simulateRealClick(tab);
      portraitClicked = true;
      break;
    }
  }
  // Fallback: ค้นหา Portrait / แนวตั้ง
  if (!portraitClicked) {
    for (const tab of portraitTabs) {
      const text = tab.textContent?.toLowerCase() || '';
      if (text.includes('portrait') || text.includes('แนวตั้ง')) {
        console.log('[Pipeline] Found Portrait tab:', text);
        await simulateRealClick(tab);
        portraitClicked = true;
        break;
      }
    }
  }
  // Fallback: icon crop_9_16
  if (!portraitClicked) {
    const icons = document.querySelectorAll('i.google-symbols, span.google-symbols');
    for (const icon of icons) {
      if (icon.textContent?.trim() === 'crop_9_16') {
        const btn = icon.closest('button[role="tab"]');
        if (btn) {
          console.log('[Pipeline] Found 9:16 via icon');
          await simulateRealClick(btn);
          portraitClicked = true;
          break;
        }
      }
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // ★ Step 5: เลือก x1 tab — ★ สำคัญ: ถ้าไม่เลือก x1 Google Flow จะสร้าง 3-4 คลิป ★
  let x1Clicked = false;
  const x1Tabs = document.querySelectorAll('button[role="tab"]');
  
  for (const tab of x1Tabs) {
    const text = tab.textContent?.trim() || '';
    const id = tab.id || '';
    // ★ FIX: ครอบคลุม x1, ×1, 1, x 1 ★
    const isX1 = text === 'x1' || text === '×1' || text === '1' || text === 'x 1' || 
      text.toLowerCase() === 'x1' || /^[x×]\s*1$/i.test(text) ||
      id.includes('-1') || id.includes('trigger-1') || id.includes('COUNT_1');
    if (isX1) {
      console.log('[Pipeline] Found x1 tab:', text, 'id:', id);
      // ★ FIX: ใช้ Debugger click (isTrusted) แทน synthetic ★
      const tRect = tab.getBoundingClientRect();
      try {
        const dbgResult = await chrome.runtime.sendMessage({
          type: 'DEBUGGER_CLICK', x: Math.round(tRect.left + tRect.width / 2), y: Math.round(tRect.top + tRect.height / 2)
        });
        x1Clicked = dbgResult?.success === true;
        console.log('[Pipeline] x1 Debugger click:', dbgResult?.success);
      } catch (e) {
        console.log('[Pipeline] x1 Debugger click error:', e.message);
      }
      // Fallback: simulateRealClick
      if (!x1Clicked) {
        await simulateRealClick(tab);
        x1Clicked = true;
      }
      break;
    }
  }
  
  // ★ FIX: ถ้าไม่เจอ x1 tab → log ปุ่มทั้งหมดเพื่อ debug ★
  if (!x1Clicked) {
    console.log('[Pipeline] ⚠️ x1 tab NOT FOUND! Listing all tabs:');
    x1Tabs.forEach((tab, i) => {
      console.log(`  tab[${i}]: text="${tab.textContent?.trim()}" id="${tab.id}" aria="${tab.getAttribute('aria-selected')}"`);
    });
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('[Pipeline] Tab selection done - Video:', videoClicked, 'Frames:', framesClicked, 'Portrait:', portraitClicked, 'x1:', x1Clicked);
  return { videoClicked, framesClicked, portraitClicked, x1Clicked };
}

// ★ Helper: หาปุ่ม "Add to Scene" — ใช้ logic เดียวกับ findAddToPromptButton ★
async function findAddToSceneButton() {
  console.log('[Pipeline] Looking for Add to Scene...');
  
  // ★ Retry หลายรอบเพราะ menu อาจยังไม่โหลด ★
  for (let retry = 0; retry < 5; retry++) {
    if (retry > 0) {
      console.log('[Pipeline] Retry finding Add to Scene...', retry);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    let addToSceneBtn = null;
    
    // Method 1: Find by role="menuitem" with "Add to Scene" text
    const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], button, [class*="menu"] button, [class*="MenuItem"], li[role]');
    for (const item of menuItems) {
      const text = item.textContent?.toLowerCase() || '';
      if (text.includes('add to scene') || text.includes('addtoscene') || text.includes('add_to_scene') || text.includes('เพิ่มในฉาก') || text.includes('เพิ่มลงในฉาก')) {
        addToSceneBtn = item;
        console.log('[Pipeline] Found Add to Scene (menuitem):', item.textContent?.substring(0, 40));
        break;
      }
    }
    
    // Method 2: Find by icon "play_movies"
    if (!addToSceneBtn) {
      const icons = document.querySelectorAll('i.google-symbols, i[class*="material"], mat-icon, .material-icons, i');
      for (const icon of icons) {
        const iconText = icon.textContent?.trim().toLowerCase() || '';
        if (iconText === 'play_movies' || iconText === 'movie' || iconText === 'video_library') {
          const parent = icon.closest('button, [role="menuitem"], [role="option"], [class*="menu-item"], [class*="MenuItem"], li');
          if (parent) {
            const parentText = parent.textContent?.toLowerCase() || '';
            if ((parentText.includes('scene') || parentText.includes('ฉาก') || parentText.includes('add') || parentText.includes('เพิ่ม')) && parent.offsetParent !== null) {
              addToSceneBtn = parent;
              console.log('[Pipeline] Found Add to Scene by icon:', parentText.substring(0, 40));
              break;
            }
          }
        }
      }
    }
    
    // Method 3: Find in popup/menu
    if (!addToSceneBtn) {
      const popups = document.querySelectorAll('[role="menu"], [role="listbox"], [class*="popup"], [class*="dropdown"], [class*="context"], [class*="Popover"], [class*="Menu"]');
      for (const popup of popups) {
        if (popup.offsetParent !== null) {
          const buttons = popup.querySelectorAll('button, [role="menuitem"], [role="option"], div[tabindex], li, span[role]');
          for (const btn of buttons) {
            const text = btn.textContent?.toLowerCase() || '';
            if ((text.includes('add') || text.includes('เพิ่ม')) && (text.includes('scene') || text.includes('ฉาก'))) {
              addToSceneBtn = btn;
              console.log('[Pipeline] Found Add to Scene in popup:', text.substring(0, 40));
              break;
            }
          }
        }
        if (addToSceneBtn) break;
      }
    }
    
    // Method 4: Find by aria-label
    if (!addToSceneBtn) {
      const allElements = document.querySelectorAll('[aria-label*="Add"], [aria-label*="add"], [title*="Add"], [title*="add"]');
      for (const el of allElements) {
        const label = (el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
        if ((label.includes('scene') || label.includes('ฉาก')) && el.offsetParent !== null) {
          addToSceneBtn = el;
          console.log('[Pipeline] Found Add to Scene by aria-label:', label);
          break;
        }
      }
    }
    
    if (addToSceneBtn) {
      return addToSceneBtn;
    }
  }
  
  return null;
}

// ★ Helper: ตรวจว่า video ยัง loading/downloading อยู่หรือไม่ ★
function isVideoStillLoading() {
  // ดู progress indicator (เช่น "46%", spinner, loading bar)
  const allText = document.body?.innerText || '';
  // หา percentage pattern เช่น "46%", "78%"
  const percentMatch = allText.match(/(\d{1,2})%/);
  if (percentMatch) {
    const percent = parseInt(percentMatch[1]);
    if (percent > 0 && percent < 100) {
      return { loading: true, percent: percent };
    }
  }
  // หา spinner/loading elements
  const spinners = document.querySelectorAll('[class*="spinner"], [class*="loading"], [class*="progress"], [role="progressbar"]');
  for (const spinner of spinners) {
    if (spinner.offsetParent !== null) {
      return { loading: true, percent: -1 };
    }
  }
  return { loading: false, percent: 100 };
}

// Pipeline Step 7: รอ video download เสร็จ → หา video บนสุดซ้ายสุด → right-click → Add to Scene
async function pipeline_hoverVideoAndAddToScene(initialVideoSrcs = null, initialImageSrcs = null) {
  console.log('[Pipeline] Step 7: รอ video download เสร็จ แล้ว Add to Scene...');
  
  // ★ STEP A: ไม่ต้องรอ download — video generate เสร็จแล้ว (loop 180 วิ ตรวจจับแล้ว) ★
  // แค่รอ 5 วิให้ UI พร้อมแล้วกด Add to Scene เลย
  console.log('[Pipeline] Video generate เสร็จแล้ว — รอ 5 วิให้ UI พร้อม...');
  showNotification('⏳ รอ UI พร้อม...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // ★ FIX: หา element ที่เป็น video/thumbnail ใหม่ล่าสุด (ไม่ใช่ top-left ที่เป็นคลิปเก่า!) ★
  // ★ ใช้ initialVideoSrcs/initialImageSrcs เพื่อกรอง video เก่าออก → เอาเฉพาะ video ที่พึ่ง generate ★
  const findNewestVideoElement = () => {
    let bestElement = null;
    let bestScore = -Infinity; // ★ ใช้ bottom-right score (ค่ามาก = ล่างสุดขวาสุด = ใหม่สุด) ★
    
    // ★ Priority 1: หา NEW <video> tags (ไม่อยู่ใน initialVideoSrcs) ★
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      if (video.offsetParent === null) continue;
      const rect = video.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 50 || rect.top < 0) continue;
      const src = video.src || '';
      const csrc = video.currentSrc || '';
      const isNew = initialVideoSrcs ? (!initialVideoSrcs.has(src) || !initialVideoSrcs.has(csrc)) : true;
      if (isNew) {
        const score = rect.top + rect.left; // ★ bottom-right = highest score = newest ★
        if (score > bestScore) {
          bestScore = score;
          bestElement = video;
        }
      }
    }
    if (bestElement) {
      console.log('[Pipeline] Found NEW video element (not in initial set)');
      return bestElement;
    }
    
    // ★ Priority 2: หา NEW <img> thumbnail (ไม่อยู่ใน initialImageSrcs) ★
    const images = document.querySelectorAll('img');
    for (const img of images) {
      if (img.offsetParent === null) continue;
      const rect = img.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80 || rect.top < 0) continue;
      const src = (img.src || '').toLowerCase();
      if (src.includes('icon') || src.includes('logo') || src.includes('avatar')) continue;
      const isNew = initialImageSrcs ? !initialImageSrcs.has(img.src) : true;
      if (isNew) {
        const score = rect.top + rect.left;
        if (score > bestScore) {
          bestScore = score;
          bestElement = img;
        }
      }
    }
    if (bestElement) {
      console.log('[Pipeline] Found NEW image thumbnail (not in initial set)');
      return bestElement;
    }
    
    // ★ Fallback: ถ้าหาใหม่ไม่เจอ → เอาล่าสุด (bottom-right) จากทั้งหมด ★
    console.log('[Pipeline] No new video/image found — falling back to bottom-right (newest position)');
    bestScore = -Infinity;
    for (const video of videos) {
      if (video.offsetParent === null) continue;
      const rect = video.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 50 || rect.top < 0) continue;
      const score = rect.top + rect.left;
      if (score > bestScore) { bestScore = score; bestElement = video; }
    }
    for (const img of images) {
      if (img.offsetParent === null) continue;
      const rect = img.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80 || rect.top < 0) continue;
      const src = (img.src || '').toLowerCase();
      if (src.includes('icon') || src.includes('logo') || src.includes('avatar')) continue;
      const score = rect.top + rect.left;
      if (score > bestScore) { bestScore = score; bestElement = img; }
    }
    
    return bestElement;
  };
  
  let targetElement = findNewestVideoElement();
  
  if (!targetElement) {
    console.log('[Pipeline] ไม่พบ video/thumbnail');
    showNotification('⚠️ ไม่พบ Video');
    return false;
  }
  
  const tRect = targetElement.getBoundingClientRect();
  console.log('[Pipeline] Target:', targetElement.tagName, tRect.width, 'x', tRect.height, 'at', tRect.top, tRect.left);
  
  // ★ Scroll into view ★
  targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // ★ STEP C: Right-click + หา Add to Scene (เหมือน pipeline_hoverImageAndAddToPrompt) ★
  let addToSceneBtn = null;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    console.log('[Pipeline] Right-click attempt', attempt + 1);
    showNotification(`🖱️ คลิกขวาที่ video... (${attempt + 1}/3)`);
    
    // Recalc position หลัง scroll
    const rect = targetElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Focus + Hover
    targetElement.focus?.();
    targetElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: centerX, clientY: centerY }));
    targetElement.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: centerX, clientY: centerY }));
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Right-click (contextmenu) — เหมือน pipeline_hoverImageAndAddToPrompt
    targetElement.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true, clientX: centerX, clientY: centerY, button: 2, view: window
    }));
    
    // รอให้ context menu โหลด (เผื่อเน็ตช้า)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // ★ ใช้ findAddToSceneButton() helper (4 methods + retry 5 รอบ) ★
    addToSceneBtn = await findAddToSceneButton();
    
    if (addToSceneBtn) {
      console.log('[Pipeline] Found Add to Scene at attempt', attempt + 1);
      break;
    }
    
    // ปิด menu แล้วลองใหม่
    if (attempt < 2) {
      console.log('[Pipeline] Add to Scene not found, retrying...');
      document.body.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  if (addToSceneBtn) {
    console.log('[Pipeline] Clicking Add to Scene...');
    showNotification('🖱️ กด Add to Scene...');
    
    addToSceneBtn.click();
    addToSceneBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('[Pipeline] ✅ Add to Scene clicked!');
    showNotification('✅ Add to Scene เสร็จ!');
    return true;
  }
  
  console.log('[Pipeline] ❌ Add to Scene not found after 3 attempts');
  showNotification('⚠️ ไม่พบปุ่ม Add to Scene');
  return false;
}

// ★ Step 12: Hover Video + คลิกขวา Add to Scene ★
async function hoverVideoAndAddToScene() {
  if (await isFlowStopped()) return;
  console.log('[TikTok Auto] Step 12: Hovering video and clicking Add to Scene...');
  showNotification('🎬 กำลัง Hover Video...');

  // รอให้ Video render เสร็จ
  showNotification('⏳ รอ 3 วินาที...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // หา Video element (ล่าสุดที่ generate)
  let targetVideo = null;

  // Method 1: หา video element ที่มี blob: src
  const allVideos = document.querySelectorAll('video');
  console.log('[TikTok Auto] Step 12: Found total videos:', allVideos.length);

  for (const video of allVideos) {
    if (video.src?.startsWith('blob:') && video.offsetParent !== null) {
      targetVideo = video;
      console.log('[TikTok Auto] Found blob video:', video.src?.substring(0, 50));
      break;
    }
  }

  // Method 2: หา video ที่มี poster หรือ visible
  if (!targetVideo) {
    for (const video of allVideos) {
      if (video.offsetParent !== null && (video.videoWidth > 50 || video.poster)) {
        targetVideo = video;
        console.log('[TikTok Auto] Found visible video:', video);
        break;
      }
    }
  }

  // Method 3: หา video ใน container ที่มี class เกี่ยวกับ output/result
  if (!targetVideo) {
    const containers = document.querySelectorAll('[class*="output"], [class*="result"], [class*="generated"]');
    for (const container of containers) {
      const video = container.querySelector('video');
      if (video && video.offsetParent !== null) {
        targetVideo = video;
        console.log('[TikTok Auto] Found video in output container:', video);
        break;
      }
    }
  }

  // Method 4: เอา video ตัวสุดท้าย
  if (!targetVideo && allVideos.length > 0) {
    targetVideo = allVideos[allVideos.length - 1];
    console.log('[TikTok Auto] Using last video:', targetVideo);
  }

  if (!targetVideo) {
    console.log('[TikTok Auto] No video found to hover');
    showNotification('⚠️ ไม่พบ Video ที่จะ hover');
    return;
  }

  // === Hover on video ===
  console.log('[TikTok Auto] Hovering on video...');
  showNotification('🖱️ Hover Video...');

  const rect = targetVideo.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Dispatch hover events
  targetVideo.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: centerX, clientY: centerY }));
  targetVideo.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: centerX, clientY: centerY }));
  targetVideo.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: centerX, clientY: centerY }));

  await new Promise(resolve => setTimeout(resolve, 1000));

  // === Right-click to open context menu ===
  console.log('[TikTok Auto] Right-clicking video...');
  showNotification('🖱️ คลิกขวา...');

  const contextMenuEvent = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: centerX,
    clientY: centerY,
    button: 2
  });
  targetVideo.dispatchEvent(contextMenuEvent);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // === Find and click "Add to Scene" button ===
  console.log('[TikTok Auto] Looking for Add to Scene...');
  showNotification('🔍 กำลังหา Add to Scene...');

  let addToSceneBtn = null;

  // Method 1: Find by role="menuitem" with "Add to Scene" text
  const menuItems = document.querySelectorAll('[role="menuitem"], button');
  for (const item of menuItems) {
    const text = item.textContent?.toLowerCase() || '';
    if (text.includes('add to scene') || text.includes('addtoscene')) {
      addToSceneBtn = item;
      console.log('[TikTok Auto] Found Add to Scene button:', item);
      break;
    }
  }

  // Method 2: Find by icon "play_movies" with text
  if (!addToSceneBtn) {
    const icons = document.querySelectorAll('i.google-symbols');
    for (const icon of icons) {
      if (icon.textContent?.trim().toLowerCase() === 'play_movies') {
        const parent = icon.closest('button, [role="menuitem"]');
        if (parent && parent.textContent?.toLowerCase().includes('scene')) {
          addToSceneBtn = parent;
          console.log('[TikTok Auto] Found Add to Scene by icon:', parent);
          break;
        }
      }
    }
  }

  if (addToSceneBtn) {
    console.log('[TikTok Auto] Clicking Add to Scene...');
    showNotification('🖱️ กด Add to Scene...');

    addToSceneBtn.click();

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('[TikTok Auto] Step 12 completed - Add to Scene clicked!');
    showNotification('✅ Add to Scene เสร็จ!');
  } else {
    console.log('[TikTok Auto] Add to Scene button not found after right-click');
    showNotification('⚠️ ไม่พบปุ่ม Add to Scene');
  }
}

// ★ Pipeline: สร้าง Video สำหรับฉาก (ทีละฉาก) ★
async function handleCreateSceneVideo(videoPrompt, sceneNumber) {
  console.log('[TikTok Auto] === Creating Scene Video ===');
  console.log('[TikTok Auto] Scene:', sceneNumber);
  console.log('[TikTok Auto] Video Prompt:', videoPrompt?.substring(0, 100));
  
  showNotification(`🎬 ฉาก ${sceneNumber}: กำลังสร้าง Video...`);
  
  // ★ เก็บ videoPrompt8s ลง storage เพื่อให้ Step 9 ใช้ได้ ★
  await chrome.storage.local.set({
    autoRunSceneStatus: { sceneNumber: sceneNumber, step: 'video', completed: false },
    currentFlowData: {
      videoPrompt8s: videoPrompt,
      sceneNumber: sceneNumber,
      mode: 'video',
      timestamp: Date.now()
    }
  });
  
  // รอหน้าโหลดเสร็จ
  await waitForPageReady();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 8: Hover รูปที่ generate ได้ แล้ว Add to Prompt
  // ★ ใช้ pipeline_hoverImageAndAddToPrompt แทน hoverGeneratedImageAndAddToPrompt เพื่อไม่ให้ทับซ้อนกับ Auto Post ★
  showNotification('🖱️ กำลัง Hover รูป + Add to Prompt...');
  await retryStep(() => pipeline_hoverImageAndAddToPrompt(), 'Step 8: Hover Image + Add to Prompt', 3);
  
  // Step 9: วาง Video Prompt
  await new Promise(resolve => setTimeout(resolve, 2000));
  showNotification('📝 กำลังวาง Video Prompt...');
  await retryStep(() => pasteVideoPrompt8ToSlate(), 'Step 9: Paste Video Prompt 8s', 3);
  
  // Step 10: เลือก Video - Frames + Veo 3.1 Fast + Generate
  await new Promise(resolve => setTimeout(resolve, 2000));
  showNotification('🎬 กำลังเลือก Video - Frames...');
  await retryStep(() => selectVideoAndFrames(), 'Step 10: Select Video - Frames', 3);
  
  // รอ Generate Video เสร็จ (90 วินาที)
  showNotification('⏳ รอ Generate Video...');
  for (let i = 90; i > 0; i--) {
    if (await isFlowStopped()) return;
    showNotification(`⏳ ฉาก ${sceneNumber}: รอ Video... ${i} วิ`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // อัพเดท status ว่า Video เสร็จแล้ว
  await chrome.storage.local.set({
    autoRunSceneStatus: { sceneNumber: sceneNumber, step: 'video', completed: true }
  });
  
  showNotification(`✅ ฉาก ${sceneNumber}: Video เสร็จแล้ว!`);
  console.log('[TikTok Auto] === Scene Video Created ===');
}

// ★ Pipeline: สร้างฉากแรก (กด New Project → วาง prompt → Generate) ★
async function handleCreateFirstScene(prompt, sceneNumber) {
  // ★ เช็คว่าระบบอื่นกำลังทำงานอยู่หรือไม่ ★
  if (!startSystem('storymode')) {
    console.log('[Storymode] Cannot start handleCreateFirstScene - another system is running');
    return;
  }
  
  console.log('[TikTok Auto] === Creating First Scene ===');
  console.log('[TikTok Auto] Scene:', sceneNumber, 'Prompt:', prompt?.substring(0, 100));
  
  showNotification(`🎬 กำลังสร้างฉากที่ ${sceneNumber}...`);
  
  // เก็บ prompt ไว้ใน storage
  await chrome.storage.local.set({
    currentFlowData: {
      prompt: prompt,
      mode: 'image', // ฉากแรกเริ่มจาก image
      sceneNumber: sceneNumber,
      timestamp: Date.now()
    },
    flowStatus: 'running',
    autoRunSceneStatus: { sceneNumber: sceneNumber, completed: false }
  });
  
  // รอหน้าโหลดเสร็จ
  await waitForPageReady();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 1: กด New Project (ถ้ายังไม่ได้อยู่ใน project)
  showNotification('🖱️ กำลังกด New Project...');
  await clickNewProjectButton();
  
  // รอ New Project โหลดเสร็จ
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Step 2: เลือก Image - Portrait - x1 ก่อน (ต้องตั้งค่า tab ก่อนวาง prompt — ไม่งั้น prompt ถูกล้างเมื่อเปลี่ยน tab)
  await selectImagePortraitX1();
  
  // Step 3: วาง prompt ลง Slate editor หลังเลือก tab เสร็จ
  await new Promise(resolve => setTimeout(resolve, 2000));
  showNotification('📝 กำลังวาง Prompt...');
  await pastePromptToSlateEditor(prompt);
  
  // รอ Generate เสร็จ (35 วินาที)
  showNotification('⏳ รอ Generate Image...');
  for (let i = 35; i > 0; i--) {
    if (await isFlowStopped()) return;
    showNotification(`⏳ รอ Generate... ${i} วินาที`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // อัพเดท status ว่าฉากนี้เสร็จแล้ว
  await chrome.storage.local.set({
    autoRunSceneStatus: { sceneNumber: sceneNumber, completed: true }
  });
  
  stopSystem('storymode');
  showNotification(`✅ ฉากที่ ${sceneNumber} เสร็จแล้ว!`);
  console.log('[TikTok Auto] === First Scene Created ===');
}

// ★ Pipeline: ต่อฉาก (Extend) — ใช้ภาพที่ generate ได้ต่อเป็น video ★
async function handleExtendScene(prompt, sceneNumber) {
  // ★ เช็คว่าระบบอื่นกำลังทำงานอยู่หรือไม่ ★
  if (!startSystem('storymode')) {
    console.log('[Storymode] Cannot start handleExtendScene - another system is running');
    return;
  }
  
  console.log('[TikTok Auto] === Extending Scene ===');
  console.log('[TikTok Auto] Scene:', sceneNumber, 'Prompt:', prompt?.substring(0, 100));
  
  showNotification(`🎬 กำลังต่อฉากที่ ${sceneNumber}...`);
  
  // เก็บ prompt ไว้ใน storage
  await chrome.storage.local.set({
    currentFlowData: {
      prompt: prompt,
      mode: 'video',
      sceneNumber: sceneNumber,
      timestamp: Date.now()
    },
    flowStatus: 'running',
    autoRunSceneStatus: { sceneNumber: sceneNumber, completed: false }
  });
  
  // รอหน้าโหลดเสร็จ
  await waitForPageReady();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 1: Hover รูปที่ generate ได้ แล้ว Add to Prompt
  // ★ ใช้ pipeline_hoverImageAndAddToPrompt แทน hoverGeneratedImageAndAddToPrompt เพื่อไม่ให้ทับซ้อนกับ Auto Post ★
  showNotification('🖱️ กำลัง Hover รูป + Add to Prompt...');
  await pipeline_hoverImageAndAddToPrompt();
  
  // Step 2: วาง Video prompt
  await new Promise(resolve => setTimeout(resolve, 2000));
  showNotification('📝 กำลังวาง Video Prompt...');
  await pastePromptToSlateEditor(prompt);
  
  // Step 3: เลือก Video - Frames + Veo 3.1 Fast
  await new Promise(resolve => setTimeout(resolve, 2000));
  await selectVideoAndFrames();
  
  // รอ Generate Video เสร็จ (90 วินาที)
  showNotification('⏳ รอ Generate Video...');
  for (let i = 90; i > 0; i--) {
    if (await isFlowStopped()) return;
    showNotification(`⏳ รอ Generate Video... ${i} วินาที`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // อัพเดท status ว่าฉากนี้เสร็จแล้ว
  await chrome.storage.local.set({
    autoRunSceneStatus: { sceneNumber: sceneNumber, completed: true }
  });
  
  stopSystem('storymode');
  showNotification(`✅ ฉากที่ ${sceneNumber} เสร็จแล้ว!`);
  console.log('[TikTok Auto] === Scene Extended ===');
}

// ★ Storymode: รันฉากเดียวจากปุ่ม Auto ในตาราง ★
async function handleSingleSceneAuto(prompt, type, sceneNumber) {
  // ★ เช็คว่าระบบอื่นกำลังทำงานอยู่หรือไม่ ★
  if (!startSystem('storymode')) {
    console.log('[Storymode] Cannot start - another system is running');
    return;
  }
  
  console.log('[TikTok Auto] === Starting Single Scene Auto ===');
  console.log('[TikTok Auto] Type:', type, 'Scene:', sceneNumber);
  console.log('[TikTok Auto] Prompt:', prompt?.substring(0, 100));
  
  showNotification(`🚀 เริ่ม Auto ฉาก ${sceneNumber} (${type === 'image' ? 'Image' : 'Video'})...`);
  
  // เก็บ prompt ไว้ใน storage
  await chrome.storage.local.set({
    currentFlowData: {
      prompt: prompt,
      mode: type,
      sceneNumber: sceneNumber,
      timestamp: Date.now()
    },
    flowStatus: 'running'
  });
  
  // รอหน้าโหลดเสร็จ
  await waitForPageReady();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (type === 'image') {
    // ★ Image Mode: เลือก tab ก่อน → วาง prompt ทีหลัง (ป้องกัน prompt ถูกล้างเมื่อเปลี่ยน mode) ★
    await selectImagePortraitX1();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    showNotification('🖼️ กำลังวาง Image Prompt...');
    await pastePromptToSlateEditor(prompt);
    
  } else if (type === 'video') {
    // ★ Video Mode: เลือก tab ก่อน → วาง prompt ทีหลัง ★
    await selectVideoAndFrames();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    showNotification('🎬 กำลังวาง Video Prompt...');
    await pastePromptToSlateEditor(prompt);
  }
  
  stopSystem('storymode');
  console.log('[TikTok Auto] === Single Scene Auto Started ===');
}

// Helper: วาง prompt ลง Slate editor
async function pastePromptToSlateEditor(prompt) {
  console.log('[TikTok Auto] Pasting prompt to Slate editor...');
  
  // หา Slate editor
  let slateEditor = document.querySelector('[data-slate-editor="true"]');
  
  if (!slateEditor) {
    const editables = document.querySelectorAll('[contenteditable="true"]');
    for (const el of editables) {
      if (el.querySelector('[data-slate-node]')) {
        slateEditor = el;
        break;
      }
    }
  }
  
  if (!slateEditor) {
    console.log('[TikTok Auto] Slate editor not found');
    showNotification('⚠️ ไม่พบ Slate editor — กรุณาวาง prompt ด้วยมือ');
    
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(prompt);
      showNotification('📋 Copy Prompt ไว้แล้ว — กด Ctrl+V เพื่อวาง');
    } catch (e) {
      console.log('[TikTok Auto] Clipboard copy failed:', e);
    }
    return false;
  }
  
  // Focus editor
  slateEditor.focus();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Click on editor
  const editorRect = slateEditor.getBoundingClientRect();
  slateEditor.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    clientX: editorRect.left + 10,
    clientY: editorRect.top + 10
  }));
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Try paste methods
  let success = false;
  
  // Method A: Paste event
  try {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', prompt);
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dataTransfer
    });
    slateEditor.dispatchEvent(pasteEvent);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (slateEditor.textContent?.includes(prompt.substring(0, 20))) {
      success = true;
      console.log('[TikTok Auto] Paste method succeeded!');
    }
  } catch (e) {
    console.log('[TikTok Auto] Paste method error:', e);
  }
  
  // Method B: execCommand
  if (!success) {
    slateEditor.focus();
    document.execCommand('insertText', false, prompt);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (slateEditor.textContent?.includes(prompt.substring(0, 20))) {
      success = true;
      console.log('[TikTok Auto] execCommand method succeeded!');
    }
  }
  
  if (success) {
    showNotification('✅ วาง Prompt สำเร็จ!');
    return true;
  } else {
    showNotification('⚠️ วาง Prompt ไม่สำเร็จ — กรุณาวางด้วยมือ');
    try {
      await navigator.clipboard.writeText(prompt);
      showNotification('📋 Copy Prompt ไว้แล้ว — กด Ctrl+V เพื่อวาง');
    } catch (e) {
      console.log('[TikTok Auto] Clipboard copy failed:', e);
    }
    return false;
  }
}

// =====================================================================
// ★★★ AUTO V2 — 3-Step Veo 3.1 Pipeline (Content Script) ★★★
// =====================================================================

// V2 Step 1: Paste image prompt (Template 1) directly to Slate → Generate → Wait for image
async function v2PasteImagePromptAndGenerate() {
  if (await isFlowStopped()) return;
  console.log('[AutoV2] Step 1: Pasting Image Prompt (Template 1) to Slate...');
  showNotification('🎬 [V2] กำลังวาง Image Prompt...');

  await new Promise(r => setTimeout(r, 6000));
  await chrome.storage.local.set({ flowStatus: 'v2_image_generating' });

  const result = await chrome.storage.local.get(['currentFlowData']);
  const imagePrompt = result.currentFlowData?.prompt;
  if (!imagePrompt) {
    console.log('[AutoV2] No image prompt found');
    showNotification('❌ ไม่พบ Image Prompt');
    await notifyFlowFailed('No V2 image prompt found');
    return false;
  }

  const sanitized = sanitizePromptForFlow(imagePrompt);
  let pasteOk = false;

  // PASTE_TO_SLATE via background.js → MAIN world
  try {
    await chrome.runtime.sendMessage({ type: 'PASTE_TO_SLATE', promptText: sanitized });
    for (let w = 0; w < 16; w++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const check = await chrome.runtime.sendMessage({ type: 'READ_SLATE_PASTE_RESULT' });
        if (check && check.status === 'success') { pasteOk = true; break; }
        if (check && check.status !== 'pending') break;
      } catch (e) {}
    }
  } catch (e) {
    console.log('[AutoV2] PASTE_TO_SLATE error:', e.message);
  }

  // Fallback: textarea
  if (!pasteOk) {
    let ta = document.getElementById('PINHOLE_TEXT_AREA_ELEMENT_ID');
    if (!ta) {
      for (const t of document.querySelectorAll('textarea')) {
        const ph = (t.placeholder || '').toLowerCase();
        if (ph.includes('generate') || ph.includes('describe') || ph.includes('prompt') || ph.includes('image')) { ta = t; break; }
      }
    }
    if (ta) {
      ta.focus();
      await new Promise(r => setTimeout(r, 300));
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) { setter.call(ta, sanitized); ta.dispatchEvent(new Event('input', { bubbles: true })); pasteOk = true; }
    }
  }

  if (!pasteOk) {
    try { await navigator.clipboard.writeText(sanitized); } catch (e) {}
    showNotification('📋 Prompt อยู่ใน clipboard — กด Ctrl+V');
    return false;
  }

  showNotification('✅ [V2] วาง Image Prompt สำเร็จ!');
  await new Promise(r => setTimeout(r, 3000));

  // Click Generate button
  const genBtn = v2FindGenerateButton();
  if (!genBtn) {
    showNotification('❌ ไม่พบปุ่ม Generate');
    await notifyFlowFailed('Generate button not found for V2 image');
    return false;
  }

  await simulateRealClick(genBtn);
  await new Promise(r => setTimeout(r, 200));
  genBtn.click();
  showNotification('✅ [V2] กด Generate แล้ว — รอรูป...');

  // Wait for image generation
  const preGenImages = snapshotCurrentMedia('image');
  const IMG_WAIT = 50;
  let imgOk = false;

  for (let i = 0; i < IMG_WAIT; i++) {
    if (await isFlowStopped()) return false;
    await new Promise(r => setTimeout(r, 3000));
    if (isPageCrashed()) { await notifyFlowFailed('Page crashed during V2 image gen'); return false; }
    const fail = isGenerationFailed();
    if (fail.failed) { await notifyFlowFailed('V2 image gen failed: ' + fail.reason); return false; }
    if (i >= 3) {
      const chk = isGenerationCompleted(preGenImages, 'image');
      if (chk.completed) { imgOk = true; break; }
    }
    const cur = Array.from(document.querySelectorAll('img')).filter(im => im.offsetParent && im.getBoundingClientRect().width > 80);
    const fresh = cur.filter(im => !preGenImages.has(im.src) && im.src && !im.src.includes('data:image/svg'));
    if (fresh.length > 0 && i >= 5) { imgOk = true; break; }
    showNotification(`⏳ [V2] รอรูป... ${(i+1)*3} วิ`);
  }

  if (!imgOk) { await notifyFlowFailed('V2 image generation timeout'); return false; }

  showNotification('✅ [V2] รูป Generate เสร็จ!');
  await chrome.storage.local.set({ flowStatus: 'v2_image_done' });

  // Proceed to: add image to prompt → switch to video → paste video prompt
  await new Promise(r => setTimeout(r, 2000));
  await retryStep(() => v2AddImageAndStartVideo(), 'V2: Add Image + Start Video');
  return true;
}

// V2 helper: find generate button
function v2FindGenerateButton() {
  // Method 1: arrow_forward icon
  for (const icon of document.querySelectorAll('i.google-symbols')) {
    const t = icon.textContent?.trim();
    if (t === 'arrow_forward' || t === 'send' || t === 'play_arrow') {
      const btn = icon.closest('button');
      if (btn && !btn.getAttribute('aria-haspopup') && btn.offsetParent !== null) return btn;
    }
  }
  // Method 2: hidden "Create" span
  for (const btn of document.querySelectorAll('button')) {
    if (btn.getAttribute('aria-haspopup') || btn.offsetParent === null) continue;
    const hs = btn.querySelector('span[hidden]');
    if (hs && (hs.textContent?.trim() === 'Create' || hs.textContent?.trim() === 'Generate')) return btn;
  }
  // Method 3: aria-label
  const al = document.querySelector('button[aria-label*="Generate"], button[aria-label*="Create"]');
  if (al && al.offsetParent !== null) return al;
  return null;
}

// V2 Step 2: Add generated image to prompt → select Video+Frames → paste video prompt → generate video
async function v2AddImageAndStartVideo() {
  if (await isFlowStopped()) return;
  console.log('[AutoV2] Step 2: Adding image to prompt, then switching to video...');
  showNotification('🖼️ [V2] กำลังเพิ่มรูปลง Prompt...');

  // Reuse the "Add to Prompt" logic from hoverGeneratedImageAndAddToPrompt
  await retryStep(() => hoverGeneratedImageAndAddToPromptV2(), 'V2: Add Image to Prompt');
}

// V2 version of hoverGeneratedImageAndAddToPrompt (doesn't chain to pasteVideoPrompt8)
async function hoverGeneratedImageAndAddToPromptV2() {
  if (await isFlowStopped()) return;
  showNotification('⏳ [V2] รอ 3 วิ...');
  await new Promise(r => setTimeout(r, 3000));

  // Find generated images (same logic as original Step 8)
  const allImages = Array.from(document.querySelectorAll('img')).filter(img => {
    const rect = img.getBoundingClientRect();
    return rect.width > 80 && rect.height > 80 && img.offsetParent !== null && img.src && !img.src.includes('data:image/svg');
  });

  if (allImages.length === 0) {
    showNotification('⚠️ ไม่พบรูปที่ Generate');
    return false;
  }

  // Use the last generated image
  const target = allImages[allImages.length - 1];
  const rect = target.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // Hover to reveal "Add to Prompt" button
  target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: cx, clientY: cy }));
  target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: cx, clientY: cy }));
  target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: cx, clientY: cy }));
  await new Promise(r => setTimeout(r, 1500));

  // Find "Add to Prompt" button
  let addBtn = null;
  for (const btn of document.querySelectorAll('button, [role="button"]')) {
    const text = (btn.textContent || '').toLowerCase();
    const label = (btn.getAttribute('aria-label') || '').toLowerCase();
    if (text.includes('add to prompt') || text.includes('เพิ่มใน prompt') || label.includes('add to prompt') || label.includes('add_to_photos')) {
      if (btn.offsetParent !== null) { addBtn = btn; break; }
    }
  }
  // Fallback: icon search
  if (!addBtn) {
    for (const icon of document.querySelectorAll('i.google-symbols')) {
      if (icon.textContent?.trim() === 'add_to_photos') {
        addBtn = icon.closest('button') || icon.parentElement;
        if (addBtn) break;
      }
    }
  }

  if (addBtn) {
    await simulateRealClick(addBtn);
    showNotification('✅ [V2] เพิ่มรูปลง Prompt แล้ว!');
    console.log('[AutoV2] Added image to prompt');
  } else {
    // Try right-click context menu approach
    const contextEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: cx, clientY: cy });
    target.dispatchEvent(contextEvent);
    await new Promise(r => setTimeout(r, 1000));
    for (const item of document.querySelectorAll('[role="menuitem"], [role="option"]')) {
      const t = (item.textContent || '').toLowerCase();
      if (t.includes('add to prompt') || t.includes('เพิ่มใน')) {
        await simulateRealClick(item);
        showNotification('✅ [V2] เพิ่มรูปลง Prompt (context menu)');
        break;
      }
    }
  }

  await new Promise(r => setTimeout(r, 3000));

  // Now switch to Video + Frames mode and paste video prompt
  await retryStep(() => v2SwitchToVideoAndPastePrompt(), 'V2: Switch to Video + Paste Prompt');
  return true;
}

// V2 Step 3: Switch to Video mode → paste Template 2 → Generate → Wait for video
async function v2SwitchToVideoAndPastePrompt() {
  if (await isFlowStopped()) return;
  console.log('[AutoV2] Step 3: Switching to Video + Frames mode...');
  showNotification('🎬 [V2] เปลี่ยนเป็น Video + Frames...');

  await new Promise(r => setTimeout(r, 4000));

  // Find and click dropdown (reuse same pattern as selectVideoAndFrames)
  let dropdownBtn = null;
  for (const btn of document.querySelectorAll('button')) {
    const text = btn.textContent || '';
    if ((text.includes('🍌') && text.includes('Nano')) || 
        (btn.getAttribute('aria-haspopup') === 'menu' && (text.includes('Banana') || text.includes('Nano')))) {
      dropdownBtn = btn; break;
    }
  }
  if (!dropdownBtn) {
    for (const icon of document.querySelectorAll('i.google-symbols')) {
      if (icon.textContent?.trim()?.startsWith('crop_')) {
        dropdownBtn = icon.closest('button[aria-haspopup="menu"]') || icon.closest('button');
        if (dropdownBtn) break;
      }
    }
  }

  if (dropdownBtn) {
    await simulateRealClick(dropdownBtn);
    await new Promise(r => setTimeout(r, 2000));

    // Select "Video" tab
    let videoTab = findTab('-content-VIDEO', 'Video', 'videocam');
    if (videoTab) {
      const ac = videoTab.getAttribute('aria-controls') || '';
      if (ac.includes('VIDEO_FRAMES')) videoTab = null;
    }
    if (!videoTab) {
      for (const t of document.querySelectorAll('button.flow_tab_slider_trigger, [role="tab"]')) {
        const text = t.textContent?.trim() || '';
        const ac = t.getAttribute('aria-controls') || '';
        if ((text.includes('Video') && !text.includes('Nano') && text.length < 20) ||
            (ac.includes('-content-VIDEO') && !ac.includes('VIDEO_FRAMES'))) { videoTab = t; break; }
      }
    }
    if (videoTab) { await simulateRealClick(videoTab); await new Promise(r => setTimeout(r, 1500)); }

    // Select "Frames" tab
    let framesTab = findTab('VIDEO_FRAMES', 'Frames', 'crop_free');
    if (!framesTab) {
      for (const t of document.querySelectorAll('button.flow_tab_slider_trigger, [role="tab"]')) {
        const text = t.textContent?.trim() || '';
        if ((text.includes('Frames') || text.includes('เฟรม')) && text.length < 20) { framesTab = t; break; }
      }
    }
    if (framesTab) { await simulateRealClick(framesTab); await new Promise(r => setTimeout(r, 1000)); }
  }

  // Select Veo 3.1 Fast if available
  await new Promise(r => setTimeout(r, 1000));
  let veoDropdown = null;
  for (const icon of document.querySelectorAll('i.google-symbols')) {
    if (icon.textContent?.trim() === 'arrow_drop_down') {
      veoDropdown = icon.closest('button') || icon.closest('[aria-haspopup]') || icon.parentElement;
      if (veoDropdown) break;
    }
  }
  if (veoDropdown) {
    await simulateRealClick(veoDropdown);
    await new Promise(r => setTimeout(r, 1500));
    for (const item of document.querySelectorAll('[role="menuitem"], [role="option"], span, div')) {
      const text = item.textContent?.trim() || '';
      if (text.includes('Veo 3.1') && text.includes('Fast')) {
        const clickTarget = item.closest('[role="menuitem"], [role="option"]') || item;
        await simulateRealClick(clickTarget);
        showNotification('✅ [V2] เลือก Veo 3.1 Fast');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // Paste Template 2 (Video Prompt with timestamps)
  showNotification('📝 [V2] กำลังวาง Video Prompt...');
  await new Promise(r => setTimeout(r, 3000));
  
  const fd = await chrome.storage.local.get(['currentFlowData']);
  const videoPrompt = fd.currentFlowData?.v2VideoPrompt;
  if (!videoPrompt) {
    await notifyFlowFailed('No V2 video prompt found');
    return false;
  }

  const sanitized = sanitizePromptForFlow(videoPrompt);
  let pasteOk = false;

  try {
    await chrome.runtime.sendMessage({ type: 'PASTE_TO_SLATE', promptText: sanitized });
    for (let w = 0; w < 16; w++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const check = await chrome.runtime.sendMessage({ type: 'READ_SLATE_PASTE_RESULT' });
        if (check && check.status === 'success') { pasteOk = true; break; }
        if (check && check.status !== 'pending') break;
      } catch (e) {}
    }
  } catch (e) {}

  if (!pasteOk) {
    try { await navigator.clipboard.writeText(sanitized); } catch (e) {}
    showNotification('📋 Video Prompt อยู่ใน clipboard — กด Ctrl+V');
  } else {
    showNotification('✅ [V2] วาง Video Prompt สำเร็จ!');
  }

  await new Promise(r => setTimeout(r, 3000));

  // Click Generate for video
  const genBtn = v2FindGenerateButton();
  if (genBtn) {
    await simulateRealClick(genBtn);
    await new Promise(r => setTimeout(r, 200));
    genBtn.click();
    showNotification('✅ [V2] กด Generate Video แล้ว — รอวิดีโอ...');
  }

  await chrome.storage.local.set({ flowStatus: 'v2_video_generating' });

  // Wait for video generation
  const preGenVideos = snapshotCurrentMedia('video');
  const VID_WAIT = 80; // 80 * 3s = 240s = 4 min
  let vidOk = false;

  for (let i = 0; i < VID_WAIT; i++) {
    if (await isFlowStopped()) return false;
    await new Promise(r => setTimeout(r, 3000));
    if (isPageCrashed()) { await notifyFlowFailed('Page crashed during V2 video gen'); return false; }
    const fail = isGenerationFailed();
    if (fail.failed) { await notifyFlowFailed('V2 video gen failed: ' + fail.reason); return false; }
    
    // Check for new video elements
    const curVids = Array.from(document.querySelectorAll('video')).filter(v => { const r = v.getBoundingClientRect(); return r.width > 50 && r.height > 50 && v.offsetParent !== null; });
    const newVids = curVids.filter(v => !preGenVideos.has(v.src || v.currentSrc || ''));
    if (newVids.length > 0 && i >= 10) { vidOk = true; break; }
    
    if (i >= 5) {
      const chk = isGenerationCompleted(preGenVideos, 'video');
      if (chk.completed) { vidOk = true; break; }
    }
    
    if (i % 10 === 0) showNotification(`⏳ [V2] รอวิดีโอ... ${(i+1)*3} วิ`);
  }

  if (!vidOk) { await notifyFlowFailed('V2 video generation timeout'); return false; }

  showNotification('✅ [V2] Video เสร็จ! → เริ่ม Extend...');
  await chrome.storage.local.set({ flowStatus: 'v2_video_saved' });

  // Proceed to Extend Video
  await new Promise(r => setTimeout(r, 3000));
  await retryStep(() => v2ExtendVideoAndDownload(), 'V2: Extend Video + Download');
  return true;
}

// V2 Step 4: Click video to enter Extend mode → paste Template 3 → generate → wait → download → TikTok
async function v2ExtendVideoAndDownload() {
  if (await isFlowStopped()) return;
  console.log('[AutoV2] Step 4: Entering Extend mode...');
  showNotification('🎞️ [V2] เข้า Extend mode...');

  await chrome.storage.local.set({ flowStatus: 'v2_extending' });
  await new Promise(r => setTimeout(r, 3000));

  // Find and click the generated video to enter extend mode (same as clickVideoToExtend)
  let clickTarget = null;
  const videos = document.querySelectorAll('video');
  for (const video of videos) {
    const src = video.src || video.currentSrc || '';
    const rect = video.getBoundingClientRect();
    if (rect.width > 50 && rect.height > 50 && (src.startsWith('blob:') || src.includes('storage.googleapis.com') || src.startsWith('https://'))) {
      const card = video.closest('[class*="card"], [class*="Card"], [class*="result"], [class*="Result"], [class*="item"], [class*="Item"], [role="button"], [tabindex]')
                || video.closest('div[class]')?.parentElement
                || video.parentElement;
      clickTarget = card || video;
      break;
    }
  }

  if (!clickTarget) {
    let bestVideo = null, bestArea = 0;
    for (const v of videos) {
      const r = v.getBoundingClientRect();
      const a = r.width * r.height;
      if (r.width > 50 && r.height > 50 && a > bestArea) { bestArea = a; bestVideo = v; }
    }
    if (bestVideo) clickTarget = bestVideo.closest('div[class]')?.parentElement || bestVideo.parentElement || bestVideo;
  }

  if (!clickTarget) {
    showNotification('❌ [V2] ไม่พบ video สำหรับ Extend');
    await notifyFlowFailed('No video found for V2 extend');
    return false;
  }

  await simulateRealClick(clickTarget);
  showNotification('⏳ [V2] รอ Extend UI โหลด...');

  // Wait for Extend UI / Slate editor to appear
  let slateFound = false;
  for (let w = 0; w < 20; w++) {
    await new Promise(r => setTimeout(r, 1500));
    // Check for extend-related UI elements
    const hasSlate = document.querySelector('[data-slate-editor="true"]') || document.querySelector('[data-slate-placeholder]');
    const hasExtendBtn = Array.from(document.querySelectorAll('button, [role="button"]')).some(
      btn => (btn.textContent || '').toLowerCase().includes('extend')
    );
    if (hasSlate || hasExtendBtn) { slateFound = true; break; }
  }

  // Try clicking "Extend" button if present
  for (const btn of document.querySelectorAll('button, [role="button"]')) {
    const text = (btn.textContent || '').toLowerCase();
    if (text.includes('extend') && btn.offsetParent !== null) {
      await simulateRealClick(btn);
      showNotification('✅ [V2] กด Extend');
      await new Promise(r => setTimeout(r, 3000));
      break;
    }
  }

  // Wait for slate editor after extend button click
  for (let w = 0; w < 15; w++) {
    await new Promise(r => setTimeout(r, 1000));
    if (document.querySelector('[data-slate-editor="true"]') || document.querySelector('textarea')) break;
  }

  // Paste Template 3 (Extend Prompt)
  showNotification('📝 [V2] กำลังวาง Extend Prompt...');
  await new Promise(r => setTimeout(r, 3000));

  const fd = await chrome.storage.local.get(['currentFlowData']);
  const extendPrompt = fd.currentFlowData?.v2ExtendPrompt;
  if (!extendPrompt) {
    await notifyFlowFailed('No V2 extend prompt found');
    return false;
  }

  const sanitized = sanitizePromptForFlow(extendPrompt);
  let pasteOk = false;
  try {
    await chrome.runtime.sendMessage({ type: 'PASTE_TO_SLATE', promptText: sanitized });
    for (let w = 0; w < 16; w++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const check = await chrome.runtime.sendMessage({ type: 'READ_SLATE_PASTE_RESULT' });
        if (check && check.status === 'success') { pasteOk = true; break; }
        if (check && check.status !== 'pending') break;
      } catch (e) {}
    }
  } catch (e) {}

  if (!pasteOk) {
    try { await navigator.clipboard.writeText(sanitized); } catch (e) {}
    showNotification('📋 Extend Prompt อยู่ใน clipboard — กด Ctrl+V');
  } else {
    showNotification('✅ [V2] วาง Extend Prompt สำเร็จ!');
  }

  await new Promise(r => setTimeout(r, 3000));

  // Click Generate for extend
  const genBtn = v2FindGenerateButton();
  if (genBtn) {
    await simulateRealClick(genBtn);
    await new Promise(r => setTimeout(r, 200));
    genBtn.click();
    showNotification('✅ [V2] กด Generate Extend — รอ...');
  }

  // Wait for extended video
  const preExtVideos = snapshotCurrentMedia('video');
  const EXT_WAIT = 80;
  let extOk = false;

  for (let i = 0; i < EXT_WAIT; i++) {
    if (await isFlowStopped()) return false;
    await new Promise(r => setTimeout(r, 3000));
    if (isPageCrashed()) { await notifyFlowFailed('Page crashed during V2 extend'); return false; }
    const fail = isGenerationFailed();
    if (fail.failed) { await notifyFlowFailed('V2 extend failed: ' + fail.reason); return false; }
    
    const extVids = Array.from(document.querySelectorAll('video')).filter(v => { const r = v.getBoundingClientRect(); return r.width > 50 && r.height > 50 && v.offsetParent !== null; });
    const newVids = extVids.filter(v => !preExtVideos.has(v.src || v.currentSrc || ''));
    if (newVids.length > 0 && i >= 10) { extOk = true; break; }
    
    if (i >= 5) {
      const chk = isGenerationCompleted(preExtVideos, 'video');
      if (chk.completed) { extOk = true; break; }
    }
    
    if (i % 10 === 0) showNotification(`⏳ [V2] รอ Extend... ${(i+1)*3} วิ`);
  }

  if (!extOk) { await notifyFlowFailed('V2 extend video timeout'); return false; }

  showNotification('✅ [V2] Extend เสร็จ! → Download + TikTok...');
  await chrome.storage.local.set({ flowStatus: 'v2_extend_done' });

  await new Promise(r => setTimeout(r, 3000));

  const allVideos = Array.from(document.querySelectorAll('video')).filter(v => { const r = v.getBoundingClientRect(); return r.width > 50 && r.height > 50 && v.offsetParent !== null; });
  if (allVideos.length > 0) {
    const vid = allVideos[allVideos.length - 1];
    const src = vid.src || vid.currentSrc || '';
    
    // Try to capture video data via fetch
    let base64Data = null;
    let blobSize = 0;
    try {
      if (src.startsWith('blob:') || src.startsWith('https://')) {
        const resp = await fetch(src);
        const blob = await resp.blob();
        blobSize = blob.size;
        const reader = new FileReader();
        base64Data = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.log('[AutoV2] Could not capture video:', e.message);
    }

    if (base64Data) {
      await downloadVideoAndOpenTikTok(base64Data, blobSize);
    } else {
      // Fallback: just navigate to TikTok
      showNotification('⚠️ [V2] ไม่สามารถ capture video — ไป TikTok...');
      await chrome.storage.local.set({ flowStatus: 'completed_download' });
      
      const fd2 = await getSafeFlowData();
      const caption = fd2.caption || '';
      const productId = fd2.productId || '';
      const postMode = fd2.postMode || 'post';
      
      chrome.runtime.sendMessage({
        type: 'STEP_COMPLETED',
        data: { itemId: fd2.itemId, mode: 'video', step: 'v2_complete' }
      });
      
      window.location.href = `https://www.tiktok.com/creator-center/upload?caption=${encodeURIComponent(caption)}&product_id=${encodeURIComponent(productId)}`;
    }
  } else {
    showNotification('❌ [V2] ไม่พบวิดีโอ');
    await notifyFlowFailed('No video found after V2 extend');
  }
  
  return true;
}

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
