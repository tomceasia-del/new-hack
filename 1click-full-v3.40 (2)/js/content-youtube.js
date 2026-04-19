// ============================================================
// Content Script: YouTube Studio Upload (Shorts/Video)
// ============================================================
(function() {
  'use strict';
  
  console.log('[YT Auto] Content script loaded on:', window.location.href);
  
  const delay = ms => new Promise(r => setTimeout(r, ms));
  let _isHandling = false;
  
  // ── Status Panel ──
  function createStatusPanel() {
    if (document.getElementById('yt-auto-status')) return;
    const panel = document.createElement('div');
    panel.id = 'yt-auto-status';
    panel.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:#ff0000;color:#fff;padding:12px 18px;border-radius:10px;font:13px/1.4 sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:320px;';
    panel.textContent = '⏳ YouTube Auto — เริ่มทำงาน...';
    document.body.appendChild(panel);
  }
  
  function updateStatus(text) {
    const el = document.getElementById('yt-auto-status');
    if (el) el.textContent = text;
  }
  
  // ── Check for Platform Data ──
  async function checkForPlatformData() {
    if (_isHandling) return;
    
    try {
      const result = await chrome.storage.local.get(['platformPostData']);
      const data = result.platformPostData;
      
      if (!data || data.platform !== 'youtube') return;
      if (Date.now() - data.timestamp > 300000) {
        console.log('[YT Auto] Platform data is stale, ignoring');
        return;
      }
      
      _isHandling = true;
      console.log('[YT Auto] Found platform post data, starting upload...');
      await handleYouTubeUpload(data);
    } catch (err) {
      console.error('[YT Auto] Error:', err);
      _isHandling = false;
    }
  }
  
  // ── Main Upload Flow ──
  async function handleYouTubeUpload(data) {
    createStatusPanel();
    
    try {
      updateStatus('⏳ รอหน้า YouTube Studio โหลด...');
      await delay(4000);
      
      // Step 1: Upload Video
      updateStatus('📤 กำลังอัพโหลด Video...');
      const uploaded = await retryAction(() => uploadVideo(data.videoBlob), 3, 5000);
      
      if (!uploaded) {
        const clipText = `${data.title || ''}\n\n${data.caption || ''}`.trim();
        await copyToClipboard(clipText);
        updateStatus('⚠️ อัพโหลดไม่สำเร็จ — เลือกไฟล์เอง (Title+Desc อยู่ใน Clipboard)');
        await chrome.storage.local.remove(['platformPostData']);
        chrome.runtime.sendMessage({ type: 'PLATFORM_POST_DONE', platform: 'youtube', success: false, error: 'Upload failed' });
        _isHandling = false;
        return;
      }
      
      // Wait for YouTube to process and show the detail form
      updateStatus('⏳ รอ YouTube ประมวลผล...');
      await waitForElement('div[id="textbox"][contenteditable="true"]', 30000);
      await delay(3000);
      
      // Step 2: Set Title
      const title = data.title || data.caption?.split('\n')[0]?.slice(0, 100) || 'Video';
      updateStatus('📝 กำลังใส่ Title...');
      await retryAction(() => setYouTubeTitle(title), 3, 3000);
      await delay(1500);
      
      // Step 3: Set Description
      if (data.caption) {
        updateStatus('📝 กำลังใส่ Description...');
        await retryAction(() => setYouTubeDescription(data.caption), 3, 3000);
        await delay(1500);
      }
      
      // Step 4: Navigate to Visibility step if scheduling
      if (data.scheduleType === 'scheduled' && data.scheduleTime) {
        updateStatus('⏰ กำลังไปหน้า Visibility เพื่อตั้งเวลา...');
        await navigateToVisibilityStep();
        await delay(2000);
        
        updateStatus('⏰ กำลังตั้งเวลาโพสต์...');
        await setYouTubeSchedule(data.scheduleTime);
        await delay(2000);
      }
      
      updateStatus('✅ เสร็จสิ้น! ตรวจสอบแล้วกด Publish / Schedule');
      
      await chrome.storage.local.remove(['platformPostData']);
      chrome.runtime.sendMessage({ type: 'PLATFORM_POST_DONE', platform: 'youtube', success: true });
      
    } catch (err) {
      console.error('[YT Auto] Upload error:', err);
      updateStatus('❌ Error: ' + err.message);
      await chrome.storage.local.remove(['platformPostData']);
      chrome.runtime.sendMessage({ type: 'PLATFORM_POST_DONE', platform: 'youtube', success: false, error: err.message });
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
      
      // Method 1: File input
      const fileInputs = document.querySelectorAll('input[type="file"]');
      if (fileInputs.length > 0) {
        console.log('[YT Auto] Found file input(s):', fileInputs.length);
        for (const input of fileInputs) {
          if (input.accept && !input.accept.includes('video') && !input.accept.includes('*')) continue;
          input.files = dataTransfer.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('[YT Auto] File set on input');
          return true;
        }
      }
      
      // Method 2: Click SELECT FILES button then set file
      const selectBtn = document.querySelector('#select-files-button, [id*="select-files"]');
      if (selectBtn) {
        console.log('[YT Auto] Found select files button');
        selectBtn.click();
        await delay(1000);
        const newInputs = document.querySelectorAll('input[type="file"]');
        if (newInputs.length > 0) {
          newInputs[0].files = dataTransfer.files;
          newInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      
      // Method 3: Drag & Drop
      const dropTargets = ['#drop-area', '[id*="upload"]', '.upload-dialog', 'ytcp-uploads-dialog'];
      for (const sel of dropTargets) {
        const zone = document.querySelector(sel);
        if (zone) {
          console.log('[YT Auto] Trying drag & drop on:', sel);
          ['dragenter', 'dragover'].forEach(evt => {
            zone.dispatchEvent(new DragEvent(evt, { bubbles: true, cancelable: true, dataTransfer }));
          });
          zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
          return true;
        }
      }
      
      return false;
    } catch (e) {
      console.error('[YT Auto] Upload error:', e);
      return false;
    }
  }
  
  // ── Set Title ──
  async function setYouTubeTitle(titleText) {
    // YouTube Studio title: first #textbox inside the dialog
    const textboxes = document.querySelectorAll('div[id="textbox"][contenteditable="true"]');
    const titleBox = textboxes[0]; // first = title
    
    if (titleBox && titleBox.offsetParent !== null) {
      console.log('[YT Auto] Found title field');
      titleBox.focus();
      await delay(200);
      document.execCommand('selectAll');
      document.execCommand('insertText', false, titleText);
      titleBox.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    
    // Fallback: aria-label
    const selectors = [
      '#textbox[aria-label*="title" i]',
      'ytcp-social-suggestions-textbox #textbox',
      '#title-textarea #textbox'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) {
        el.focus();
        await delay(200);
        document.execCommand('selectAll');
        document.execCommand('insertText', false, titleText);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }
    
    console.log('[YT Auto] Title field not found');
    return false;
  }
  
  // ── Set Description ──
  async function setYouTubeDescription(descText) {
    const textboxes = document.querySelectorAll('div[id="textbox"][contenteditable="true"]');
    
    // second textbox = description
    if (textboxes.length >= 2) {
      const descBox = textboxes[1];
      console.log('[YT Auto] Found description field');
      descBox.focus();
      await delay(200);
      document.execCommand('selectAll');
      document.execCommand('insertText', false, descText);
      descBox.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    
    // Fallback
    const descEl = document.querySelector('#textbox[aria-label*="description" i], #description-textarea #textbox');
    if (descEl) {
      descEl.focus();
      await delay(200);
      document.execCommand('selectAll');
      document.execCommand('insertText', false, descText);
      descEl.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    
    console.log('[YT Auto] Description field not found');
    return false;
  }
  
  // ── Navigate to Visibility Step ──
  // YouTube Studio upload wizard: Details → Video elements → Checks → Visibility
  async function navigateToVisibilityStep() {
    // Click "NEXT" button multiple times to reach Visibility step
    for (let step = 0; step < 3; step++) {
      const nextBtn = document.querySelector('#next-button, [id="next-button"] button, ytcp-button#next-button');
      if (nextBtn) {
        console.log('[YT Auto] Clicking NEXT button, step:', step + 1);
        nextBtn.click();
        await delay(2000);
      } else {
        // Try tp-yt-paper-tab for "Visibility"
        const tabs = document.querySelectorAll('tp-yt-paper-tab, [role="tab"]');
        for (const tab of tabs) {
          const text = (tab.textContent || '').trim().toLowerCase();
          if (text.includes('visibility') || text.includes('การเผยแพร่')) {
            console.log('[YT Auto] Found Visibility tab');
            tab.click();
            await delay(1500);
            return;
          }
        }
        break;
      }
    }
  }
  
  // ── Schedule ──
  async function setYouTubeSchedule(scheduleTime) {
    try {
      const dt = new Date(scheduleTime);
      console.log('[YT Auto] Setting schedule to:', dt.toISOString());
      
      // Step A: Select "Schedule" radio in Visibility step
      // YouTube Studio has: Public / Unlisted / Private / Schedule
      const radioLabels = document.querySelectorAll('tp-yt-paper-radio-button, [role="radio"], #schedule-radio-button, [name="SCHEDULE"]');
      let foundScheduleRadio = false;
      
      for (const radio of radioLabels) {
        const text = (radio.textContent || '').trim().toLowerCase();
        const name = (radio.getAttribute('name') || '').toLowerCase();
        if (text.includes('schedule') || text.includes('ตั้งเวลา') || name === 'schedule') {
          console.log('[YT Auto] Found Schedule radio');
          radio.click();
          foundScheduleRadio = true;
          await delay(2000);
          break;
        }
      }
      
      if (!foundScheduleRadio) {
        // Fallback: click by text
        const allSpans = document.querySelectorAll('span, div');
        for (const el of allSpans) {
          const text = (el.textContent || '').trim().toLowerCase();
          if (text === 'schedule' || text === 'ตั้งเวลา') {
            const clickTarget = el.closest('[role="radio"]') || el.closest('tp-yt-paper-radio-button') || el;
            clickTarget.click();
            await delay(2000);
            break;
          }
        }
      }
      
      // Step B: Set Date
      const dateStr = `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}/${dt.getFullYear()}`;
      
      // YouTube Studio uses <ytcp-date-picker> or input inside it
      const dateInput = document.querySelector(
        'ytcp-date-picker input, input[aria-label*="date" i], input[aria-label*="วัน" i], #datepicker-trigger input'
      );
      
      if (dateInput) {
        console.log('[YT Auto] Setting date:', dateStr);
        setNativeValue(dateInput, dateStr);
        await delay(1000);
      } else {
        // Try clicking date picker and selecting
        const datePicker = document.querySelector('ytcp-date-picker, [id*="date-picker"]');
        if (datePicker) {
          console.log('[YT Auto] Found date picker, clicking...');
          datePicker.click();
          await delay(1000);
        }
      }
      
      // Step C: Set Time
      const timeSelectors = [
        'ytcp-form-input-container input[aria-label*="time" i]',
        'input[aria-label*="time" i]',
        'input[aria-label*="เวลา" i]',
        '#time-of-day-trigger input'
      ];
      
      const hours24 = dt.getHours();
      const hours12 = hours24 % 12 || 12;
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      const ampm = hours24 >= 12 ? 'PM' : 'AM';
      const timeStr = `${hours12}:${minutes} ${ampm}`;
      
      for (const sel of timeSelectors) {
        const timeInput = document.querySelector(sel);
        if (timeInput) {
          console.log('[YT Auto] Setting time:', timeStr);
          setNativeValue(timeInput, timeStr);
          await delay(1000);
          break;
        }
      }
      
      // Try dropdown approach for time
      const timeDropdown = document.querySelector('ytcp-form-input-container[id*="time"], #time-of-day-container');
      if (timeDropdown) {
        timeDropdown.click();
        await delay(500);
        // Look for matching time in dropdown list
        const options = document.querySelectorAll('tp-yt-paper-item, [role="option"], [role="menuitem"]');
        for (const opt of options) {
          const optText = (opt.textContent || '').trim();
          if (optText.includes(`${hours12}:${minutes}`) && optText.toLowerCase().includes(ampm.toLowerCase())) {
            console.log('[YT Auto] Selecting time option:', optText);
            opt.click();
            break;
          }
        }
      }
      
      console.log('[YT Auto] Schedule set:', dateStr, timeStr);
    } catch (err) {
      console.error('[YT Auto] Schedule error:', err);
    }
  }
  
  // ── Helpers ──
  function setNativeValue(el, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  async function waitForElement(selector, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (document.querySelector(selector)) return true;
      await delay(500);
    }
    return false;
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
  setTimeout(checkForPlatformData, 3000);
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.platformPostData && changes.platformPostData.newValue) {
      checkForPlatformData();
    }
  });
  
})();
