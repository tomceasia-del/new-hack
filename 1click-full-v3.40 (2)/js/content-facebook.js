// ============================================================
// Content Script: Facebook Upload (Reels/Feed/Story)
// ============================================================
(function() {
  'use strict';
  
  console.log('[FB Auto] Content script loaded on:', window.location.href);
  
  const delay = ms => new Promise(r => setTimeout(r, ms));
  let _isHandling = false;
  
  // ── Status Panel ──
  function createStatusPanel() {
    if (document.getElementById('fb-auto-status')) return;
    const panel = document.createElement('div');
    panel.id = 'fb-auto-status';
    panel.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:#1877f2;color:#fff;padding:12px 18px;border-radius:10px;font:13px/1.4 sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:320px;';
    panel.textContent = '⏳ Facebook Auto — เริ่มทำงาน...';
    document.body.appendChild(panel);
  }
  
  function updateStatus(text) {
    const el = document.getElementById('fb-auto-status');
    if (el) el.textContent = text;
  }
  
  // ── Check for Platform Data ──
  async function checkForPlatformData() {
    if (_isHandling) return;
    
    try {
      const result = await chrome.storage.local.get(['platformPostData']);
      const data = result.platformPostData;
      
      if (!data || data.platform !== 'facebook') return;
      if (Date.now() - data.timestamp > 300000) {
        console.log('[FB Auto] Platform data is stale, ignoring');
        return;
      }
      
      _isHandling = true;
      console.log('[FB Auto] Found platform post data, starting upload...');
      await handleFacebookUpload(data);
    } catch (err) {
      console.error('[FB Auto] Error:', err);
      _isHandling = false;
    }
  }
  
  // ── Main Upload Flow ──
  async function handleFacebookUpload(data) {
    createStatusPanel();
    
    try {
      // Wait for page to be ready
      updateStatus('⏳ รอหน้า Facebook โหลด...');
      await delay(4000);
      
      // Step 1: Upload Video
      updateStatus('📤 กำลังอัพโหลด Video...');
      const uploaded = await retryAction(() => uploadVideo(data.videoBlob), 3, 5000);
      
      if (!uploaded) {
        // Fallback: copy caption to clipboard
        await copyToClipboard(data.caption);
        updateStatus('⚠️ อัพโหลดไม่สำเร็จ — ลากไฟล์ใส่เอง (Caption อยู่ใน Clipboard)');
        await chrome.storage.local.remove(['platformPostData']);
        chrome.runtime.sendMessage({ type: 'PLATFORM_POST_DONE', platform: 'facebook', success: false, error: 'Upload failed — กรุณาอัพโหลด video เอง' });
        _isHandling = false;
        return;
      }
      
      updateStatus('⏳ รอ Facebook ประมวลผล Video...');
      await delay(8000);
      
      // Step 2: Set Caption
      if (data.caption) {
        updateStatus('📝 กำลังใส่ Caption...');
        await retryAction(() => setFacebookCaption(data.caption), 3, 3000);
        await delay(2000);
      }
      
      // Step 3: Schedule (if requested)
      if (data.scheduleType === 'scheduled' && data.scheduleTime) {
        updateStatus('⏰ กำลังตั้งเวลาโพสต์...');
        await setFacebookSchedule(data.scheduleTime);
        await delay(2000);
      }
      
      updateStatus('✅ เสร็จสิ้น! ตรวจสอบแล้วกด Publish / Schedule');
      
      await chrome.storage.local.remove(['platformPostData']);
      chrome.runtime.sendMessage({ type: 'PLATFORM_POST_DONE', platform: 'facebook', success: true });
      
    } catch (err) {
      console.error('[FB Auto] Upload error:', err);
      updateStatus('❌ Error: ' + err.message);
      await chrome.storage.local.remove(['platformPostData']);
      chrome.runtime.sendMessage({ type: 'PLATFORM_POST_DONE', platform: 'facebook', success: false, error: err.message });
    } finally {
      _isHandling = false;
    }
  }
  
  // ── Upload Video ──
  async function uploadVideo(base64Data) {
    try {
      const file = dataURLtoFile(base64Data, 'video.mp4');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      // Method 1: File input with video accept
      const videoInputs = document.querySelectorAll('input[type="file"][accept*="video"]');
      if (videoInputs.length > 0) {
        console.log('[FB Auto] Found video file input');
        videoInputs[0].files = dataTransfer.files;
        videoInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      
      // Method 2: Any file input
      const allInputs = document.querySelectorAll('input[type="file"]');
      if (allInputs.length > 0) {
        console.log('[FB Auto] Found generic file input, count:', allInputs.length);
        allInputs[0].files = dataTransfer.files;
        allInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      
      // Method 3: Drag & Drop on main area
      const dropTargets = [
        '[role="main"]',
        '[data-pagelet*="Reel"]',
        '[class*="upload"]',
        'form'
      ];
      for (const sel of dropTargets) {
        const zone = document.querySelector(sel);
        if (zone) {
          console.log('[FB Auto] Trying drag & drop on:', sel);
          ['dragenter', 'dragover'].forEach(evt => {
            zone.dispatchEvent(new DragEvent(evt, { bubbles: true, cancelable: true, dataTransfer }));
          });
          zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
          return true;
        }
      }
      
      return false;
    } catch (e) {
      console.error('[FB Auto] Upload error:', e);
      return false;
    }
  }
  
  // ── Set Caption ──
  async function setFacebookCaption(captionText) {
    const editorSelectors = [
      '[contenteditable="true"][role="textbox"]',
      '[contenteditable="true"][data-lexical-editor]',
      'div[contenteditable="true"][spellcheck]',
      'div[contenteditable="true"]',
      'textarea'
    ];
    
    for (const selector of editorSelectors) {
      const editors = document.querySelectorAll(selector);
      for (const editor of editors) {
        if (!editor.offsetParent) continue; // skip hidden
        console.log('[FB Auto] Found caption editor:', selector);
        editor.focus();
        await delay(300);
        
        // Clear existing content
        document.execCommand('selectAll');
        await delay(100);
        document.execCommand('insertText', false, captionText);
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('[FB Auto] Caption set successfully');
        return true;
      }
    }
    
    // Fallback: clipboard
    await copyToClipboard(captionText);
    console.log('[FB Auto] Caption copied to clipboard (editor not found)');
    return false;
  }
  
  // ── Schedule ──
  async function setFacebookSchedule(scheduleTime) {
    try {
      const dt = new Date(scheduleTime);
      console.log('[FB Auto] Setting schedule to:', dt.toISOString());
      
      // Step A: Find "Schedule" option — Facebook Reels uses a dropdown or radio
      // Look for text "Schedule" / "ตั้งเวลา"
      const allElements = document.querySelectorAll('span, div, label, [role="radio"], [role="menuitem"], [role="option"]');
      let scheduleBtn = null;
      
      for (const el of allElements) {
        const text = (el.textContent || '').trim().toLowerCase();
        if ((text === 'schedule' || text === 'ตั้งเวลา' || text === 'schedule reel' || text === 'schedule post')
            && el.offsetParent !== null) {
          scheduleBtn = el.closest('[role="radio"]') || el.closest('[role="menuitem"]') || el.closest('label') || el;
          break;
        }
      }
      
      if (scheduleBtn) {
        console.log('[FB Auto] Found schedule option, clicking...');
        scheduleBtn.click();
        await delay(2000);
      } else {
        // Try finding a "Schedule" button/link in publish area
        const btns = document.querySelectorAll('div[role="button"], span[role="button"], a');
        for (const btn of btns) {
          const text = (btn.textContent || '').trim().toLowerCase();
          if (text.includes('schedule') || text.includes('ตั้งเวลา')) {
            console.log('[FB Auto] Found schedule button in publish area');
            btn.click();
            await delay(2000);
            break;
          }
        }
      }
      
      // Step B: Set Date — Find date picker input
      const dateStr = `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}/${dt.getFullYear()}`;
      const dateInputs = document.querySelectorAll('input[type="text"], input[aria-label*="date" i], input[aria-label*="วัน" i]');
      
      for (const input of dateInputs) {
        const label = (input.getAttribute('aria-label') || input.placeholder || '').toLowerCase();
        if (label.includes('date') || label.includes('วัน')) {
          console.log('[FB Auto] Setting date:', dateStr);
          setNativeValue(input, dateStr);
          break;
        }
      }
      
      // Step C: Set Time
      const hours = String(dt.getHours() % 12 || 12);
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      const ampm = dt.getHours() >= 12 ? 'PM' : 'AM';
      const timeStr = `${hours}:${minutes} ${ampm}`;
      
      const timeInputs = document.querySelectorAll('input[type="text"], input[aria-label*="time" i], input[aria-label*="เวลา" i]');
      for (const input of timeInputs) {
        const label = (input.getAttribute('aria-label') || input.placeholder || '').toLowerCase();
        if (label.includes('time') || label.includes('เวลา')) {
          console.log('[FB Auto] Setting time:', timeStr);
          setNativeValue(input, timeStr);
          break;
        }
      }
      
      console.log('[FB Auto] Schedule set:', dateStr, timeStr);
    } catch (err) {
      console.error('[FB Auto] Schedule error:', err);
    }
  }
  
  // ── Helpers ──
  function setNativeValue(el, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  async function retryAction(fn, maxRetries, delayMs) {
    for (let i = 0; i < maxRetries; i++) {
      const result = await fn();
      if (result) return true;
      if (i < maxRetries - 1) await delay(delayMs);
    }
    return false;
  }
  
  async function copyToClipboard(text) {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch (e) {}
  }
  
  function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'video/mp4';
    const bstr = atob(arr[1] || '');
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mime });
  }
  
  // ── Init ──
  // ★ BUG #4 FIX: เปลี่ยนจาก setInterval → storage.onChanged.addListener ป้องกัน CPU leak ★
  setTimeout(checkForPlatformData, 3000);
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.platformPostData && changes.platformPostData.newValue) {
      checkForPlatformData();
    }
  });
  
})();
