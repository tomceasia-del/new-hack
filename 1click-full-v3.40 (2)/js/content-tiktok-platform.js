// ============================================================
// Content Script: TikTok Platform Tab Upload (Queue System)
// ============================================================
// ไฟล์นี้แยกจาก content.js (Auto Post flow) โดยเด็ดขาด
// ใช้สำหรับ platformPostData จาก Platform tab / Queue เท่านั้น
// ============================================================
(function() {
  'use strict';

  console.log('[TikTok Platform] Content script loaded on:', window.location.href);

  const delay = ms => new Promise(r => setTimeout(r, ms));
  let _isHandling = false;
  let _hasCompleted = false; // ป้องกันการ run ซ้ำหลัง flow จบ

  // ── Status Panel ──
  function createStatusPanel() {
    if (document.getElementById('tiktok-platform-status')) return;
    const panel = document.createElement('div');
    panel.id = 'tiktok-platform-status';
    panel.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:linear-gradient(135deg,#fe2c55,#25f4ee);color:#fff;padding:12px 18px;border-radius:10px;font:13px/1.4 sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:320px;';
    panel.textContent = '⏳ TikTok Platform — เริ่มทำงาน...';
    document.body.appendChild(panel);
  }

  function updateStatus(text) {
    const el = document.getElementById('tiktok-platform-status');
    if (el) el.textContent = text;
    console.log('[TikTok Platform]', text);
  }

  // ── Check for Platform Data ──
  async function checkForPlatformData() {
    if (_isHandling) return;
    if (_hasCompleted) {
      console.log('[TikTok Platform] Flow already completed, ignoring');
      return;
    }
    if (!window.location.href.includes('/upload')) return;

    try {
      const result = await chrome.storage.local.get(['platformPostData']);
      const data = result.platformPostData;

      if (!data || data.platform !== 'tiktok') return;
      if (Date.now() - data.timestamp > 300000) {
        console.log('[TikTok Platform] Data is stale, ignoring');
        return;
      }

      _isHandling = true;
      console.log('[TikTok Platform] Found platform post data, starting upload...');
      console.log('[TikTok Platform] Data keys:', Object.keys(data).filter(k => k !== 'videoBlob'));
      console.log('[TikTok Platform] scheduleType:', data.scheduleType, '| scheduleTime:', data.scheduleTime, '| productId:', data.productId);
      await handlePlatformUpload(data);
    } catch (err) {
      console.error('[TikTok Platform] Error:', err);
      _isHandling = false;
    }
  }

  // ── Main Upload Flow ──
  async function handlePlatformUpload(data) {
    createStatusPanel();

    try {
      // Wait for upload page ready
      updateStatus('⏳ รอหน้า Upload โหลด...');
      const pageReady = await waitForUploadPage(30000);
      if (!pageReady) {
        updateStatus('⚠️ หน้า Upload ไม่พร้อม');
        notifyDone(false, 'Upload page not ready');
        return;
      }
      await delay(2000);

      // Step 1: Upload Video
      updateStatus('📤 กำลังอัพโหลด Video...');
      const uploaded = await retryAction(() => uploadVideo(data.videoBlob), 3, 5000);

      if (!uploaded) {
        updateStatus('⚠️ อัพโหลดไม่สำเร็จ — กรุณาลากไฟล์ใส่เอง');
        notifyDone(false, 'Upload failed');
        return;
      }

      await delay(5000);

      // Step 2: Set Caption
      if (data.caption) {
        updateStatus('📝 กำลังใส่ Caption...');
        await retryAction(() => setCaption(data.caption), 3, 5000);
        await delay(3000);
      }

      // Step 3: Add Product Link + CTA
      if (data.productId) {
        console.log('[TikTok Platform] === Starting Step 3: Add Product Link ===');
        updateStatus('🛒 กำลังปักตะกร้า...');
        const productAdded = await addProductLink(data.productId, data.cta || '');
        console.log('[TikTok Platform] === Step 3 result:', productAdded, '===');
        if (productAdded) {
          updateStatus('✅ ปักตะกร้าสำเร็จ!');
        } else {
          updateStatus('⚠️ ปักตะกร้าไม่สำเร็จ — ข้ามไปตั้งเวลา');
        }
        await delay(2000);
      } else {
        console.log('[TikTok Platform] No productId, skipping Step 3');
      }

      // Step 4: Schedule — Now หรือ Schedule
      console.log('[TikTok Platform] === Starting Step 4: Schedule ===');
      console.log('[TikTok Platform] scheduleType:', data.scheduleType, '| scheduleTime:', data.scheduleTime);
      if (data.scheduleType === 'scheduled' && data.scheduleTime) {
        updateStatus('⏰ กำลังตั้งเวลาโพสต์...');
        await setTikTokSchedule(data.scheduleTime);
        console.log('[TikTok Platform] === Step 4 done ===');
        await delay(2000);
      } else {
        // โพสต์ทันที — คลิก Now radio
        updateStatus('⏰ ตั้งค่า โพสต์ทันที...');
        await clickNowRadio();
        console.log('[TikTok Platform] === Step 4 (Now) done ===');
        await delay(1000);
      }

      // Step 5: กด Show more + เปิด AI-generated content
      console.log('[TikTok Platform] === Starting Step 5: Show more + AI ===');
      updateStatus('⚙️ กำลังเปิด Advanced Settings...');
      await clickShowMore();
      await delay(1500);
      await clickAIGeneratedContent();
      await delay(1000);
      console.log('[TikTok Platform] === Step 5 done ===');

      // Step 6: กดปุ่ม Post หรือ Schedule
      console.log('[TikTok Platform] === Starting Step 6: Post/Schedule button ===');
      updateStatus('🚀 กำลังกด Post/Schedule...');
      await delay(2000);

      // ★ หาปุ่มก่อน → notifyDone หลังเจอ → แล้วค่อย .click() ★
      // เพราะหลังกดแล้ว TikTok redirect ทันที → content script ตาย
      let postBtn = null;
      let postBtnMethod = '';
      for (let attempt = 0; attempt < 5 && !postBtn; attempt++) {
        // วิธี 1: หาจาก div.Button__content ที่มี text "Post" หรือ "Schedule"
        const btnContents = document.querySelectorAll('div[class*="Button__content--type-primary"], div[class*="Button__content"]');
        for (const bc of btnContents) {
          const txt = bc.textContent?.trim();
          if (txt === 'Post' || txt === 'Schedule') {
            const btn = bc.closest('button') || bc.closest('[role="button"]') || bc.parentElement;
            if (btn) {
              postBtn = btn;
              postBtnMethod = `Button__content "${txt}" (attempt ${attempt + 1})`;
              break;
            }
          }
        }

        // วิธี 2: หา button ที่มี text ตรงๆ
        if (!postBtn) {
          const allBtns = document.querySelectorAll('button, [role="button"]');
          for (const btn of allBtns) {
            const txt = btn.textContent?.trim();
            if ((txt === 'Post' || txt === 'Schedule') && btn.offsetParent !== null) {
              const rect = btn.getBoundingClientRect();
              if (rect.width > 50 && rect.height > 20) {
                postBtn = btn;
                postBtnMethod = `text match "${txt}" (attempt ${attempt + 1})`;
                break;
              }
            }
          }
        }

        // วิธี 3: หา button สำหรับ simulateRealClick
        if (!postBtn) {
          const allBtns = document.querySelectorAll('button');
          for (const btn of allBtns) {
            const txt = btn.textContent?.trim();
            if ((txt === 'Post' || txt === 'Schedule') && btn.offsetParent !== null) {
              postBtn = btn;
              postBtnMethod = `simulateRealClick "${txt}" (attempt ${attempt + 1})`;
              break;
            }
          }
        }

        if (!postBtn) {
          console.log(`[TikTok Platform] Post/Schedule button not found (attempt ${attempt + 1})`);
          await delay(3000);
        }
      }

      if (postBtn) {
        // ★ หาปุ่มเจอแล้ว → notifyDone ก่อน .click() เพราะหลังกดแล้ว redirect ★
        console.log('[TikTok Platform] Found Post button via', postBtnMethod, '— notifyDone before click');
        notifyDone(true);
        await delay(500);

        // กดปุ่ม
        if (postBtnMethod.includes('simulateRealClick')) {
          simulateRealClick(postBtn);
        } else {
          postBtn.click();
        }
        console.log('[TikTok Platform] Clicked Post button via', postBtnMethod);
        updateStatus('✅ กด Post สำเร็จ!');
      } else {
        updateStatus('⚠️ ไม่พบปุ่ม Post — กรุณากดเอง');
        notifyDone(false, 'Post button not found');
      }

    } catch (err) {
      console.error('[TikTok Platform] Upload error:', err);
      updateStatus('❌ Error: ' + err.message);
      notifyDone(false, err.message); // safe: ถ้า notifyDone(true) เรียกไปแล้ว platformPostData ถูกลบ → ครั้งนี้แค่ overwrite
    } finally {
      _isHandling = false;
      _hasCompleted = true; // ป้องกันไม่ให้ flow ถูก trigger ซ้ำ
      console.log('[TikTok Platform] Flow completed, will not re-trigger');
    }
  }

  // ── Notify Sidepanel ──
  function notifyDone(success, error) {
    chrome.storage.local.remove(['platformPostData']);

    // วิธี 1: sendMessage ตรง (sidepanel listener)
    try {
      chrome.runtime.sendMessage({
        type: 'PLATFORM_POST_DONE',
        platform: 'tiktok',
        success,
        error: error || undefined
      }, (resp) => {
        if (chrome.runtime.lastError) {
          console.log('[TikTok Platform] sendMessage PLATFORM_POST_DONE error:', chrome.runtime.lastError.message);
        } else {
          console.log('[TikTok Platform] sendMessage PLATFORM_POST_DONE delivered');
        }
      });
    } catch (e) {
      console.log('[TikTok Platform] sendMessage failed:', e.message);
    }

    // วิธี 2: storage fallback — sidepanel จะตรวจจับได้ผ่าน storage.onChanged
    chrome.storage.local.set({
      platformPostDone: {
        platform: 'tiktok',
        success,
        error: error || undefined,
        timestamp: Date.now()
      }
    });
    console.log('[TikTok Platform] notifyDone sent (message + storage fallback)');
  }

  // ── Wait for Upload Page ──
  async function waitForUploadPage(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const hasFileInput = document.querySelector('input[type="file"][accept*="video"]');
      const hasSelectBtn = document.querySelector('[data-e2e="select_video_button"], button.upload-btn, .upload-text-container');
      if (hasFileInput || hasSelectBtn) return true;
      await delay(500);
    }
    return false;
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
        console.log('[TikTok Platform] Found video file input');
        videoInputs[0].files = dataTransfer.files;
        videoInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      // Method 2: Any file input
      const allInputs = document.querySelectorAll('input[type="file"]');
      if (allInputs.length > 0) {
        allInputs[0].files = dataTransfer.files;
        allInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      // Method 3: Drag & Drop
      const dropZone = document.querySelector('.upload-card, [class*="upload"], [data-e2e="upload-card"]');
      if (dropZone) {
        console.log('[TikTok Platform] Trying drag & drop...');
        ['dragenter', 'dragover'].forEach(evt => {
          dropZone.dispatchEvent(new DragEvent(evt, { bubbles: true, cancelable: true, dataTransfer }));
        });
        dropZone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
        return true;
      }

      return false;
    } catch (e) {
      console.error('[TikTok Platform] Upload video error:', e);
      return false;
    }
  }

  // ── Set Caption ──
  async function setCaption(captionText) {
    // DraftJS editor selectors — เรียงจากแม่นยำที่สุด
    const editorSelectors = [
      '.notranslate.public-DraftEditor-content[contenteditable="true"][role="combobox"]',
      '.public-DraftEditor-content[contenteditable="true"]',
      '[data-e2e="caption-editor"] [contenteditable="true"]',
      'div[contenteditable="true"][role="combobox"][spellcheck]',
      '[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][spellcheck]'
    ];

    for (const selector of editorSelectors) {
      const editor = document.querySelector(selector);
      if (editor && editor.offsetParent !== null) {
        console.log('[TikTok Platform] Found caption editor:', selector);
        
        // Focus editor
        editor.focus();
        await delay(300);
        
        // Clear ข้อความเก่าทั้งหมด — selectAll + delete
        document.execCommand('selectAll', false, null);
        await delay(100);
        document.execCommand('delete', false, null);
        await delay(200);
        
        // วิธี 1: insertText (ดีที่สุดสำหรับ DraftJS)
        const inserted = document.execCommand('insertText', false, captionText);
        if (inserted) {
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('[TikTok Platform] Caption inserted via execCommand');
          return true;
        }
        
        // วิธี 2: Clipboard paste fallback
        try {
          editor.focus();
          await delay(100);
          const clipData = new DataTransfer();
          clipData.setData('text/plain', captionText);
          const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: clipData
          });
          editor.dispatchEvent(pasteEvent);
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('[TikTok Platform] Caption inserted via paste event');
          return true;
        } catch (e) {
          console.log('[TikTok Platform] Paste fallback failed:', e);
        }
        
        // วิธี 3: Direct innerHTML set (last resort สำหรับ DraftJS)
        try {
          const blockDiv = editor.querySelector('[data-block="true"]');
          if (blockDiv) {
            const spanEl = blockDiv.querySelector('span[data-offset-key]');
            if (spanEl) {
              spanEl.innerHTML = captionText;
              editor.dispatchEvent(new Event('input', { bubbles: true }));
              console.log('[TikTok Platform] Caption inserted via innerHTML');
              return true;
            }
          }
        } catch (e) {
          console.log('[TikTok Platform] innerHTML fallback failed:', e);
        }
      }
    }

    // Fallback: clipboard copy
    try { await navigator.clipboard.writeText(captionText); } catch (e) {}
    console.log('[TikTok Platform] Caption copied to clipboard (editor not found)');
    return false;
  }

  // ── Simulate Real Click (เหมือนคนคลิกจริง — หลายวิธีรวมกัน) ──
  function simulateRealClick(el) {
    if (!el) return;
    const text = el.textContent?.trim()?.substring(0, 50) || el.tagName;
    console.log('[TikTok Platform] simulateRealClick on:', text);

    try {
      // 1) Focus element ก่อน
      el.focus();

      // 2) Scroll ให้เห็น
      el.scrollIntoView({ block: 'center', behavior: 'instant' });

      // 3) Dispatch full pointer + mouse event sequence
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const eventOpts = {
        bubbles: true, cancelable: true, composed: true,
        clientX: x, clientY: y,
        screenX: x, screenY: y,
        view: window, button: 0, buttons: 1
      };
      
      el.dispatchEvent(new PointerEvent('pointerover', eventOpts));
      el.dispatchEvent(new MouseEvent('mouseover', eventOpts));
      el.dispatchEvent(new PointerEvent('pointerenter', eventOpts));
      el.dispatchEvent(new MouseEvent('mouseenter', eventOpts));
      el.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
      el.dispatchEvent(new MouseEvent('mousedown', eventOpts));
      el.dispatchEvent(new PointerEvent('pointerup', { ...eventOpts, buttons: 0 }));
      el.dispatchEvent(new MouseEvent('mouseup', { ...eventOpts, buttons: 0 }));
      el.dispatchEvent(new MouseEvent('click', { ...eventOpts, buttons: 0 }));

      // 4) DOM native .click() — React จะจับ event นี้ได้
      el.click();

      console.log('[TikTok Platform] click dispatched + el.click() called');
    } catch (err) {
      console.error('[TikTok Platform] simulateRealClick error:', err);
      // Last resort
      try { el.click(); } catch (e) {}
    }
  }

  // ── Set Input Value (React-compatible) ──
  function setNativeInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ── Find button by label text ──
  function findButtonByText(text) {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const btnText = (btn.textContent || '').trim();
      if (btnText === text || btnText.includes(text)) {
        if (btn.offsetParent !== null && btn.getAttribute('aria-disabled') !== 'true') {
          return btn;
        }
      }
    }
    return null;
  }

  // ── ส่งคำสั่งไป MAIN world (tiktok-click-helper.js) ผ่าน postMessage ──
  let _msgId = 0;
  function sendToMainWorld(action, payload) {
    return new Promise((resolve) => {
      const id = `cmd_${++_msgId}_${Date.now()}`;
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        console.log(`[TikTok Platform] MAIN world timeout for: ${action}`);
        resolve(false);
      }, 8000);

      function handler(event) {
        if (event.source !== window) return;
        if (!event.data || event.data.source !== 'tiktok-platform-result') return;
        if (event.data.id !== id) return;
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        console.log(`[TikTok Platform] MAIN world result:`, event.data.result);
        resolve(event.data.result);
      }

      window.addEventListener('message', handler);
      window.postMessage({ source: 'tiktok-platform-cmd', action, payload, id }, '*');
    });
  }

  // ── ส่งคำสั่งคลิกไป background ให้ใช้ chrome.scripting.executeScript (MAIN world) ──
  function execClickButton(text) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'EXEC_CLICK_BUTTON', text }, (resp) => {
        if (chrome.runtime.lastError) {
          console.log('[TikTok Platform] execClickButton error:', chrome.runtime.lastError.message);
          resolve(false);
        } else {
          console.log('[TikTok Platform] execClickButton result:', resp);
          resolve(resp?.success || false);
        }
      });
    });
  }

  // ── Click TUXButton — ลอง 4 วิธีเรียงลำดับ + retry ──
  async function clickTUXButton(text, timeoutMs = 15000) {
    const start = Date.now();
    let attempts = 0;

    while (Date.now() - start < timeoutMs) {
      const labels = document.querySelectorAll('.TUXButton-label');
      let targetBtn = null;
      for (const label of labels) {
        if (label.textContent.trim() === text) {
          const btn = label.closest('button');
          if (btn && btn.offsetParent !== null) { targetBtn = btn; break; }
        }
      }

      if (targetBtn) {
        attempts++;
        console.log(`[TikTok Platform] Found TUXButton "${text}", attempt ${attempts}...`);

        // ตรวจว่าปุ่มยัง disabled อยู่ไหม
        if (targetBtn.disabled || targetBtn.getAttribute('aria-disabled') === 'true') {
          console.log(`[TikTok Platform] Button "${text}" is disabled, waiting...`);
          await delay(1000);
          continue;
        }

        // Scroll into view
        targetBtn.scrollIntoView({ block: 'center', behavior: 'instant' });
        await delay(300);

        // วิธี 1: execClickButton — chrome.scripting.executeScript MAIN world (สดจาก background)
        const execResult = await execClickButton(text);
        await delay(800);
        if (execResult) {
          const gone = !findTUXButtonByText(text);
          if (gone) {
            console.log(`[TikTok Platform] execClickButton "${text}" SUCCESS — button gone`);
            return true;
          }
          console.log(`[TikTok Platform] execClickButton "${text}" returned success but button still exists`);
        }

        // วิธี 2: sendToMainWorld — postMessage → tiktok-click-helper.js
        await sendToMainWorld('CLICK_BUTTON', { text });
        await delay(800);
        if (!findTUXButtonByText(text)) {
          console.log(`[TikTok Platform] MAIN world click "${text}" SUCCESS — button gone`);
          return true;
        }

        // วิธี 3: simulateRealClick
        simulateRealClick(targetBtn);
        await delay(500);

        // วิธี 4: native .click()
        targetBtn.click();
        await delay(500);

        if (!findTUXButtonByText(text)) {
          console.log(`[TikTok Platform] simulateRealClick/click "${text}" SUCCESS — button gone`);
          return true;
        }

        // Retry สูงสุด 3 ครั้ง — ถ้าปุ่มยังอยู่ = ไม่สำเร็จจริง
        if (attempts >= 3) {
          console.log(`[TikTok Platform] clickTUXButton "${text}" — ${attempts} attempts exhausted, button still exists = FAILED`);
          return false;
        }

        console.log(`[TikTok Platform] clickTUXButton "${text}" — button still exists, retrying...`);
        await delay(1500);
        continue;
      }

      await delay(1000);
    }

    console.log(`[TikTok Platform] clickTUXButton "${text}" — NOT FOUND after ${timeoutMs}ms`);
    return false;
  }

  // ── Find TUXButton by label text (สำหรับ modal TikTok) ──
  function findTUXButtonByText(text) {
    // วิธี 1: หาจาก .TUXButton-label ที่ text ตรง แล้วไล่ขึ้นไปหา parent button
    const labels = document.querySelectorAll('.TUXButton-label');
    for (const label of labels) {
      if (label.textContent.trim() === text) {
        const btn = label.closest('button');
        if (btn && btn.offsetParent !== null && btn.getAttribute('aria-disabled') !== 'true') {
          console.log('[TikTok Platform] Found TUXButton:', text);
          return btn;
        }
      }
    }
    // วิธี 2: หาจาก button ที่มี class TUXButton--primary (Next, Add เป็น primary)
    const primaryBtns = document.querySelectorAll('button.TUXButton--primary, button[class*="TUXButton--primary"]');
    for (const btn of primaryBtns) {
      const btnText = (btn.textContent || '').trim();
      if (btnText === text && btn.offsetParent !== null) {
        console.log('[TikTok Platform] Found TUXButton--primary:', text);
        return btn;
      }
    }
    // Fallback: หาจาก button ทั่วไป
    return findButtonByText(text);
  }

  // ── Wait for element to appear ──
  async function waitForElement(selectorOrFn, timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = typeof selectorOrFn === 'function' ? selectorOrFn() : document.querySelector(selectorOrFn);
      if (el && el.offsetParent !== null) return el;
      await delay(500);
    }
    return null;
  }

  // ── Add Product Link (ปักตะกร้า) ──
  // Flow: คลิก "Add product links" → กด +Add → Next → Search Product ID → Select radio → Next → ใส่ CTA → กด Add
  async function addProductLink(productId, cta) {
    try {
      // === Step 0: คลิก "Add product links" บนหน้า Upload (Seller account) ===
      updateStatus('🛒 [0/6] กำลังหา "Add product links"...');

      const clickAddProductLinks = () => {
        const allClickables = document.querySelectorAll('a, button, span, div, p, [role="button"]');
        for (const el of allClickables) {
          const text = (el.textContent || '').trim().toLowerCase();
          if ((text.includes('add product link') || text === 'add products' || text === 'add product' || text === 'tag products') && el.offsetParent !== null) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 10 && rect.height > 5) {
              const target = el.closest('a') || el.closest('button') || el.closest('[role="button"]') || el;
              target.click();
              target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              console.log('[TikTok Platform] ✅ Clicked "Add product links":', text);
              return true;
            }
          }
        }
        const productSections = document.querySelectorAll('[class*="product" i], [class*="commerce" i], [class*="shopping" i]');
        for (const section of productSections) {
          const links = section.querySelectorAll('a, button, [role="button"], span[class*="link" i]');
          for (const link of links) {
            const text = (link.textContent || '').trim().toLowerCase();
            if ((text.includes('add') && (text.includes('product') || text.includes('link'))) || text.includes('tag product')) {
              if (link.offsetParent !== null) {
                link.click();
                link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                console.log('[TikTok Platform] ✅ Clicked product link in section:', text);
                return true;
              }
            }
          }
        }
        return false;
      };

      let productLinksClicked = false;
      for (let attempt = 0; attempt < 5 && !productLinksClicked; attempt++) {
        productLinksClicked = clickAddProductLinks();
        if (!productLinksClicked) {
          console.log(`[TikTok Platform] "Add product links" not found (attempt ${attempt + 1}/5)`);
          await delay(3000);
        }
      }

      if (productLinksClicked) {
        console.log('[TikTok Platform] ✅ "Add product links" clicked — waiting for + Add button...');
        await delay(4000);
      } else {
        console.log('[TikTok Platform] "Add product links" not found — ปุ่ม + Add อาจมีอยู่แล้ว (Creator account)');
      }

      // === Step 1: กดปุ่ม "+ Add" ===
      updateStatus('🛒 [1/6] กำลังกดปุ่ม + Add...');
      const addBtnReady = await waitForElement(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = (btn.textContent || '').trim();
          const hasPlus = btn.querySelector('[data-icon="Plus"], [data-testid="Plus"]');
          if ((text === 'Add' || text === '+ Add' || text.includes('Add')) && hasPlus) {
            if (btn.offsetParent !== null) return btn;
          }
        }
        // Fallback: หาปุ่ม "Add" ที่ไม่มี Plus icon แต่อยู่ใน product section
        for (const btn of buttons) {
          const text = (btn.textContent || '').trim();
          if (text === 'Add' && btn.offsetParent !== null) {
            const parent = btn.closest('[class*="product" i], [class*="commerce" i], [class*="modal" i]');
            if (parent) return btn;
          }
        }
        return null;
      }, 15000);

      if (!addBtnReady) {
        console.log('[TikTok Platform] + Add button not found');
        return false;
      }
      simulateRealClick(addBtnReady);
      await delay(2000);

      // === Step 2: กด "Next" ในหน้า Add link (ใช้วิธีเดียวกับ autopost) ===
      updateStatus('🛒 [2/6] กำลังกด Next...');
      let nextClicked1 = false;
      for (let attempt = 0; attempt < 3 && !nextClicked1; attempt++) {
        // วิธี autopost: direct selector + .click()
        const nextBtn = document.querySelector('div.common-modal-footer button.TUXButton.TUXButton--primary');
        if (nextBtn) {
          nextBtn.click();
          console.log(`[TikTok Platform] Step 2: Clicked Next via direct selector (attempt ${attempt + 1})`);
          nextClicked1 = true;
        } else {
          console.log(`[TikTok Platform] Step 2: Next not found via direct selector (attempt ${attempt + 1})`);
          nextClicked1 = await clickTUXButton('Next', 3000);
        }
        if (!nextClicked1) await delay(3000);
      }
      if (!nextClicked1) {
        console.log('[TikTok Platform] Next button (step 1) — all methods failed');
        return false;
      }
      await delay(4000);

      // === Step 2.5: คลิก tab "Showcase products" (สำหรับ seller channel ที่ default เป็น "My shop") ===
      updateStatus('🛒 [2.5/6] เช็ค tab Showcase products...');

      const findShowcaseTab = () => {
        const allClickables = document.querySelectorAll(
          '[role="tab"], [role="radio"], [class*="Tab"], [class*="tab"], button, label, a, span, div'
        );
        for (const el of allClickables) {
          const text = (el.textContent || '').trim().toLowerCase();
          if ((text === 'showcase products' || text === 'showcase product' || text === 'showcase') && el.offsetParent !== null) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 20 && rect.width < 500 && rect.height > 5 && rect.height < 100) {
              return el.closest('[role="tab"]') || el.closest('button') || el.closest('label') || el;
            }
          }
        }
        const radios = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        for (const radio of radios) {
          const label = radio.closest('label') || radio.parentElement;
          const labelText = (label?.textContent || '').toLowerCase();
          if (labelText.includes('showcase')) {
            if (!radio.checked) return radio;
          }
        }
        return null;
      };

      let showcaseClicked = false;
      for (let attempt = 0; attempt < 3 && !showcaseClicked; attempt++) {
        const tab = await waitForElement(findShowcaseTab, 10000);
        if (tab) {
          console.log(`[TikTok Platform] Found "Showcase products" tab (attempt ${attempt + 1}), clicking...`);
          simulateRealClick(tab);
          await delay(500);
          tab.click();
          await delay(500);
          await sendToMainWorld('CLICK_ELEMENT', { text: 'Showcase products' });
          await delay(2000);
          showcaseClicked = true;
          console.log('[TikTok Platform] ✅ Switched to Showcase products tab');
        } else {
          console.log(`[TikTok Platform] Showcase tab not found (attempt ${attempt + 1}/3)`);
          await delay(2000);
        }
      }

      if (!showcaseClicked) {
        console.log('[TikTok Platform] "Showcase products" tab not found after 3 attempts — อาจเป็น creator account (ไม่ใช่ seller), continuing...');
      }
      await delay(2000);

      // === Step 3: ค้นหา Product ID ในช่อง Search ===
      updateStatus('🛒 [3/6] กำลังค้นหา Product ID...');
      const searchInput = await waitForElement(() => {
        return document.querySelector('input[placeholder="Search products"], input[placeholder*="Search product" i], input.TUXTextInputCore-input');
      }, 10000);

      if (!searchInput) {
        console.log('[TikTok Platform] Search input not found');
        return false;
      }

      searchInput.focus();
      await delay(300);
      setNativeInputValue(searchInput, productId);
      await delay(500);

      // กดไอคอนแว่นขยายค้นหา
      const searchIcon = document.querySelector('.product-search-icon, [class*="product-search-icon"], [data-icon="Search"], [data-testid="Search"]');
      if (searchIcon) {
        simulateRealClick(searchIcon);
        console.log('[TikTok Platform] Clicked search icon');
      } else {
        // Fallback: กด Enter
        searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
        searchInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
        console.log('[TikTok Platform] Pressed Enter to search');
      }

      // รอผลค้นหาโหลด 5 วินาที
      updateStatus('🛒 [3/6] รอผลค้นหา...');
      await delay(5000);

      // === Step 4: เลือก Product (คลิก radio ตัวแรก) ===
      updateStatus('🛒 [4/6] กำลังเลือก Product...');
      const radio = await waitForElement(() => {
        const radios = document.querySelectorAll('input[type="radio"].TUXRadioStandalone-input');
        for (const r of radios) {
          if (r.name !== 'postSchedule' && r.offsetParent !== null) return r;
        }
        return null;
      }, 15000);

      if (!radio) {
        console.log('[TikTok Platform] Product radio not found after search');
        return false;
      }

      console.log('[TikTok Platform] Found product radio, clicking via EXEC_CLICK_RADIO...');
      // ใช้ chrome.scripting.executeScript MAIN world เพื่อ trigger React state
      const execRadioResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'EXEC_CLICK_RADIO' }, (resp) => {
          if (chrome.runtime.lastError) {
            console.log('[TikTok Platform] EXEC_CLICK_RADIO error:', chrome.runtime.lastError.message);
            resolve(false);
          } else {
            console.log('[TikTok Platform] EXEC_CLICK_RADIO result:', resp);
            resolve(resp?.success || false);
          }
        });
      });
      await delay(1000);

      // Fallback: simulateRealClick + sendToMainWorld
      if (!radio.checked) {
        const radioRow = radio.closest('tr') || radio.closest('[class*="row"]') || radio.closest('label') || radio.parentElement;
        simulateRealClick(radioRow);
        await delay(500);
        simulateRealClick(radio);
        await delay(500);
      }

      console.log('[TikTok Platform] Radio checked:', radio.checked);
      await delay(2000);

      // === Step 5: กด "Next" อีกครั้ง (ใช้วิธีเดียวกับ autopost) ===
      updateStatus('🛒 [5/6] กำลังกด Next...');
      let nextClicked2 = false;
      // วิธี autopost: direct selector + .click() — retry 3 ครั้ง
      for (let attempt = 0; attempt < 3 && !nextClicked2; attempt++) {
        const nextBtn = document.querySelector('div.common-modal-footer button.TUXButton.TUXButton--primary');
        if (nextBtn) {
          nextBtn.click();
          console.log(`[TikTok Platform] Clicked Next via direct selector (attempt ${attempt + 1})`);
          nextClicked2 = true;
        } else {
          console.log(`[TikTok Platform] Next button not found via direct selector (attempt ${attempt + 1})`);
          // Fallback: clickTUXButton
          nextClicked2 = await clickTUXButton('Next', 4000);
        }
        if (!nextClicked2) await delay(4000);
      }
      if (!nextClicked2) {
        console.log('[TikTok Platform] Next button (step 2) — all methods failed');
        return false;
      }
      await delay(5000);

      // === Step 6: ใส่ CTA แล้วกด "Add" ===
      if (cta) {
        updateStatus('🛒 [6/6] กำลังใส่ CTA...');
        const ctaInput = await waitForElement(() => {
          // หา input ที่อยู่ในหน้า CTA (ไม่ใช่ search input)
          const inputs = document.querySelectorAll('input.TUXTextInputCore-input[type="text"]');
          for (const inp of inputs) {
            // เอา input ที่มี aria-describedby (CTA input มี) หรือไม่ใช่ search
            const placeholder = (inp.placeholder || '').toLowerCase();
            if (!placeholder.includes('search')) return inp;
          }
          return null;
        }, 10000);

        if (ctaInput) {
          ctaInput.focus();
          await delay(300);
          // ลบข้อความเก่าทั้งหมด
          ctaInput.select();
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);
          await delay(200);
          // ใส่ CTA ใหม่
          setNativeInputValue(ctaInput, cta);
          await delay(500);
        }
      }

      // กดปุ่ม "Add" สุดท้าย
      updateStatus('🛒 กำลังกด Add...');
      const addClicked = await clickTUXButton('Add', 15000);
      if (!addClicked) {
        console.log('[TikTok Platform] Final Add button — all methods failed');
        return false;
      }
      await delay(3000);

      console.log('[TikTok Platform] Product link + CTA added successfully!');
      return true;

    } catch (err) {
      console.error('[TikTok Platform] addProductLink error:', err);
      return false;
    }
  }

  // ── Click "Now" radio ──
  async function clickNowRadio() {
    try {
      const radios = document.querySelectorAll('input[type="radio"][name="postSchedule"]');
      for (const radio of radios) {
        if (radio.value === 'now' || (radios.length === 2 && radio.value !== 'schedule')) {
          const container = radio.closest('span[class*="Radio"]') || radio.closest('label') || radio;
          simulateRealClick(container);
          if (!radio.checked) simulateRealClick(radio);
          console.log('[TikTok Platform] Clicked "Now" radio');
          return true;
        }
      }
      // Fallback: MAIN world
      return await sendToMainWorld('CLICK_RADIO', { value: 'now' });
    } catch (err) {
      console.error('[TikTok Platform] clickNowRadio error:', err);
      return false;
    }
  }

  // ── Click "Schedule" radio ──
  // ★ v2.62: ใช้ MAIN world เป็นหลัก เพราะ React state ต้อง trigger จาก MAIN world ★
  async function clickScheduleRadio() {
    try {
      // วิธี 1: MAIN world — trigger React handler ตรงๆ (ได้ผลที่สุด)
      const mainResult = await sendToMainWorld('CLICK_RADIO', { value: 'schedule' });
      if (mainResult) {
        console.log('[TikTok Platform] Schedule radio clicked via MAIN world');
        await delay(500);
        // Verify: เช็คว่า radio ถูก check จริงหรือไม่
        const radios = document.querySelectorAll('input[type="radio"]');
        for (const radio of radios) {
          if (radio.value === 'schedule' && radio.checked) {
            console.log('[TikTok Platform] ✅ Schedule radio verified checked');
            return true;
          }
        }
        // ถ้ายัง ไม่ checked ให้ลอง content script click เพิ่ม
        console.log('[TikTok Platform] MAIN world clicked but radio not checked, trying content script...');
      }

      // วิธี 2: หา "Schedule" text label แล้วคลิก (TikTok อาจไม่ใช้ name="postSchedule" แล้ว)
      const allLabels = document.querySelectorAll('span, label, div');
      for (const el of allLabels) {
        const text = (el.textContent || '').trim();
        if (text === 'Schedule' && el.offsetParent !== null) {
          // เช็คว่า element นี้อยู่ใน schedule/radio area (ไม่ใช่ปุ่มอื่น)
          const rect = el.getBoundingClientRect();
          if (rect.width < 200 && rect.height < 60) {
            // คลิก parent ที่เป็น radio container
            const radioContainer = el.closest('label') || el.closest('[class*="Radio"]') || el.closest('[class*="radio"]') || el;
            simulateRealClick(radioContainer);
            console.log('[TikTok Platform] Clicked "Schedule" label via text search');
            await delay(500);
            // ลอง MAIN world อีกรอบหลัง click label
            await sendToMainWorld('CLICK_RADIO', { value: 'schedule' });
            return true;
          }
        }
      }

      // วิธี 3: Original radio selector
      const radios = document.querySelectorAll('input[type="radio"]');
      for (const radio of radios) {
        if (radio.value === 'schedule' || radio.nextSibling?.textContent?.includes('Schedule')) {
          const container = radio.closest('span[class*="Radio"]') || radio.closest('label') || radio;
          simulateRealClick(container);
          if (!radio.checked) simulateRealClick(radio);
          console.log('[TikTok Platform] Clicked Schedule radio via input selector');
          return true;
        }
      }

      console.log('[TikTok Platform] ❌ Schedule radio not found');
      return false;
    } catch (err) {
      console.error('[TikTok Platform] clickScheduleRadio error:', err);
      return false;
    }
  }

  // ── Click "Show more" ──
  async function clickShowMore() {
    // หา "Show more" text
    const spans = document.querySelectorAll('span');
    for (const span of spans) {
      if (span.textContent.trim() === 'Show more' && span.offsetParent !== null) {
        const parent = span.closest('.more-btn') || span.closest('[data-e2e="advanced_settings_container"]') || span;
        simulateRealClick(parent);
        console.log('[TikTok Platform] Clicked "Show more"');
        return true;
      }
    }
    // Fallback: MAIN world
    return await sendToMainWorld('CLICK_ELEMENT', { text: 'Show more', tag: 'span' });
  }

  // ── Click "AI-generated content" toggle ──
  async function clickAIGeneratedContent() {
    const allEls = document.querySelectorAll('span, div, label');
    for (const el of allEls) {
      if (el.textContent.trim() === 'AI-generated content' && el.offsetParent !== null) {
        // หา toggle ที่อยู่ใกล้ๆ
        const container = el.closest('div');
        if (!container) continue;
        const toggle = container.querySelector('[role="switch"], [class*="Switch__content"], input[type="checkbox"]');
        if (toggle) {
          const state = toggle.getAttribute('aria-checked') || toggle.getAttribute('data-state');
          if (state === 'true' || state === 'checked') {
            console.log('[TikTok Platform] AI-generated content already enabled');
            return true;
          }
          simulateRealClick(toggle);
          console.log('[TikTok Platform] Clicked AI-generated content toggle');
          return true;
        }
      }
    }
    // Fallback: MAIN world
    return await sendToMainWorld('CLICK_ELEMENT', { text: 'AI-generated content', toggleSelector: '[role="switch"], [class*="Switch__content"]' });
  }

  // ── Schedule: ตั้งเวลาโพสต์ — ใช้ MAIN world เป็นหลัก ──
  // ★ v2.62: ปรับปรุง — ใช้ MAIN world + React props + verification ★
  async function setTikTokSchedule(scheduleTime) {
    try {
      const dt = new Date(scheduleTime);
      const targetHour = dt.getHours();
      const targetMinute = dt.getMinutes();
      const roundedMinute = Math.round(targetMinute / 5) * 5;
      const targetYear = dt.getFullYear();
      const targetMonth = dt.getMonth();
      const targetDay = dt.getDate();
      console.log('[TikTok Platform] Setting schedule:', targetHour, ':', roundedMinute, targetYear, '-', targetMonth + 1, '-', targetDay);

      // Step A: คลิก "Schedule" radio
      updateStatus('⏰ [1/3] เลือก Schedule...');
      await clickScheduleRadio();
      await delay(2000);

      // Verify Step A: เช็คว่า time/date input ปรากฏ (= schedule mode ถูกเลือก)
      let scheduleActive = await waitForElement(() => {
        const inputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly], input[readonly]');
        for (const inp of inputs) {
          if (/^\d{1,2}:\d{2}$/.test(inp.value)) return inp;
        }
        return null;
      }, 5000);

      if (!scheduleActive) {
        console.log('[TikTok Platform] ⚠️ Schedule mode not activated, retrying radio click...');
        await clickScheduleRadio();
        await delay(2000);
        scheduleActive = await waitForElement(() => {
          const inputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly], input[readonly]');
          for (const inp of inputs) {
            if (/^\d{1,2}:\d{2}$/.test(inp.value)) return inp;
          }
          return null;
        }, 5000);
      }

      const expectedTime = `${String(targetHour).padStart(2, '0')}:${String(roundedMinute).padStart(2, '0')}`;
      const expectedDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
      
      // ★ Step B: ตั้งเวลาก่อน (ไม่ส่ง date — date จะจัดการแยกใน Step C) ★
      // ป้องกัน timeout + parallel interference จากการ try date handlers นานเกินไป
      console.log('[TikTok Platform] Trying direct time set via React fiber (date will be separate)...');

      // Step B (Fallback): ตั้งเวลา — dropdown approach
      updateStatus('⏰ [2/3] กำลังตั้งเวลา...');
      const timeInput = scheduleActive || await waitForElement(() => {
        const inputs = document.querySelectorAll('input[readonly]');
        for (const inp of inputs) {
          if (/^\d{1,2}:\d{2}$/.test(inp.value)) return inp;
        }
        return null;
      }, 5000);

      if (timeInput) {
        const origTimeValue = timeInput.value;
        console.log('[TikTok Platform] Time input found, current value:', origTimeValue);

        // เปิด time dropdown — ใช้ทั้ง content script + MAIN world
        const timeContainer = timeInput.closest('div[class*="TUXTextInput"]') || timeInput.parentElement;
        simulateRealClick(timeContainer);
        await delay(500);
        await sendToMainWorld('CLICK_INPUT', { pattern: '^\\d{1,2}:\\d{2}$' });
        await delay(1500);

        // เลือกชั่วโมง — MAIN world
        console.log('[TikTok Platform] Selecting hour:', targetHour);
        await sendToMainWorld('CLICK_TIME_ITEM', { value: targetHour, column: 'hour' });
        await delay(1000);

        // เลือกนาที — MAIN world
        console.log('[TikTok Platform] Selecting minute:', roundedMinute);
        await sendToMainWorld('CLICK_TIME_ITEM', { value: roundedMinute, column: 'minute' });
        await delay(1000);

        // ปิด dropdown — คลิกที่ว่าง
        document.body.click();
        await delay(1000);

        // Verify: เช็คว่าเวลาเปลี่ยนจริง
        const newTimeValue = timeInput.value;
        console.log('[TikTok Platform] Time after selection:', newTimeValue, '| Expected:', expectedTime);

        if (newTimeValue !== expectedTime && newTimeValue === origTimeValue) {
          console.log('[TikTok Platform] ⚠️ Time did not change, retrying with direct React props...');
          // Retry: เปิด dropdown อีกรอบ
          simulateRealClick(timeContainer);
          await sendToMainWorld('CLICK_INPUT', { pattern: '^\\d{1,2}:\\d{2}$' });
          await delay(1500);
          await sendToMainWorld('CLICK_TIME_ITEM', { value: targetHour, column: 'hour' });
          await delay(1000);
          await sendToMainWorld('CLICK_TIME_ITEM', { value: roundedMinute, column: 'minute' });
          await delay(1000);
          document.body.click();
          await delay(1000);
          console.log('[TikTok Platform] Time after retry:', timeInput.value);
        }
      } else {
        console.log('[TikTok Platform] ❌ Time input not found');
      }

      // Step C: ตั้งวันที่
      updateStatus('⏰ [3/3] กำลังตั้งวันที่...');

      // หา date input (format: 2026-03-07) — ใช้ TUXTextInputCore-input selector ตรงๆ
      const dateInput = await waitForElement(() => {
        // วิธี 1: TUXTextInputCore-input ที่มี value เป็น date format
        const tuxInputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly]');
        for (const inp of tuxInputs) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(inp.value)) return inp;
        }
        // วิธี 2: fallback input[readonly]
        const inputs = document.querySelectorAll('input[readonly]');
        for (const inp of inputs) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(inp.value)) return inp;
        }
        return null;
      }, 8000);

      if (dateInput) {
        console.log('[TikTok Platform] Found date input, value:', dateInput.value, 'class:', dateInput.className);

        // ★★★ APPROACH 1: React fiber direct — setScheduleDirect ★★★
        // ลองตั้งวันที่ผ่าน React onChange/state hook + value lock
        console.log('[TikTok Platform] [Date] Approach 1: React fiber direct...');
        const directDateResult = await sendToMainWorld('SET_SCHEDULE_DIRECT', { time: null, date: expectedDate });
        if (directDateResult?.dateSet) {
          await delay(1000);
          // Double-check: verify after 1s that React didn't revert it
          const afterCheck = dateInput.value;
          console.log('[TikTok Platform] Approach 1 result: dateSet=true, value after 1s:', afterCheck, '| expected:', expectedDate);
          if (afterCheck === expectedDate) {
            console.log('[TikTok Platform] ✅ Date set via React fiber direct (confirmed)!');
          } else {
            console.log('[TikTok Platform] ⚠️ Date reverted after React fiber — will try other approaches');
          }
        }

        // ★★★ APPROACH 2: DEBUGGER trusted click to open calendar + click day ★★★
        if (dateInput.value !== expectedDate) {
          console.log('[TikTok Platform] [Date] Approach 2: DEBUGGER calendar (trusted click)...');
          try {
            const debugResult = await new Promise((resolve) => {
              chrome.runtime.sendMessage({ type: 'DEBUGGER_SET_DATE', day: targetDay }, (resp) => {
                if (chrome.runtime.lastError) resolve(null);
                else resolve(resp);
              });
            });
            if (debugResult?.success) {
              await delay(1500);
              console.log('[TikTok Platform] DEBUGGER_SET_DATE result: success, newValue:', debugResult.newValue, '| expected:', expectedDate);
              if (dateInput.value === expectedDate) {
                console.log('[TikTok Platform] ✅ Date set via DEBUGGER calendar!');
              }
            } else {
              console.log('[TikTok Platform] DEBUGGER_SET_DATE result:', debugResult);
            }
          } catch (e) { console.log('[TikTok Platform] DEBUGGER_SET_DATE error:', e.message); }
        }

        // ★★★ APPROACH 3: DEBUGGER_CLICK to open calendar (trusted hardware event) ★★★
        if (dateInput.value !== expectedDate) {
          console.log('[TikTok Platform] [Date] Approach 3: DEBUGGER_CLICK to open calendar...');

          // ★ Step 3a: ใช้ DEBUGGER_CLICK ที่ dateInput — CDP Input.dispatchMouseEvent = isTrusted:true ★
          const rect = dateInput.getBoundingClientRect();
          const cx = Math.round(rect.left + rect.width / 2);
          const cy = Math.round(rect.top + rect.height / 2);

          console.log('[TikTok Platform] DEBUGGER_CLICK on date input at:', cx, cy, '(keepAttached)');
          const dbgOpen = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: cx, y: cy, keepAttached: true }, (resp) => {
              if (chrome.runtime.lastError) resolve(null);
              else resolve(resp);
            });
          });
          console.log('[TikTok Platform] DEBUGGER_CLICK result:', dbgOpen?.success);
          await delay(2000);

          // ★ Step 3b: ถ้า calendar ยังไม่เปิด ลองคลิกที่ icon (ซ้ายสุดของ input) ★
          let calendarFound = !!document.querySelector(
            '[class*="picker-dropdown"], [class*="PickerPanel"], [class*="picker-panel"], ' +
            '[class*="DatePicker"][class*="panel"], [class*="calendar"], [class*="Calendar"], ' +
            '[class*="TUXCalendar"], [role="grid"], table[class*="date"]'
          );

          if (!calendarFound) {
            const icon = dateInput.parentElement?.querySelector('[class*="leadingIcon"], [class*="Icon"], svg');
            const box = dateInput.closest('.TUXInputBox') || dateInput.closest('div[class*="InputBox"]');
            const tryTargets = [icon, box].filter(Boolean);

            for (const el of tryTargets) {
              if (calendarFound) break;
              const elRect = el.getBoundingClientRect();
              if (elRect.width < 3) continue;
              const ex = Math.round(elRect.left + elRect.width / 2);
              const ey = Math.round(elRect.top + elRect.height / 2);
              console.log('[TikTok Platform] DEBUGGER_CLICK on', el.tagName, 'at:', ex, ey, '(keepAttached)');
              await new Promise((resolve) => {
                chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: ex, y: ey, keepAttached: true }, (resp) => {
                  if (chrome.runtime.lastError) resolve(null);
                  else resolve(resp);
                });
              });
              await delay(1500);
              calendarFound = !!document.querySelector(
                '[class*="picker-dropdown"], [class*="PickerPanel"], [class*="picker-panel"], ' +
                '[class*="DatePicker"][class*="panel"], [class*="calendar"], [class*="Calendar"], ' +
                '[class*="TUXCalendar"], [role="grid"], table[class*="date"]'
              );
              console.log('[TikTok Platform] After DEBUGGER_CLICK on', el.tagName, '— calendar found:', calendarFound);
            }
          }

          // ★ Step 3c: ถ้ายังไม่เปิด ลอง React handlers เสริม (แต่ไม่คาดหวังมาก) ★
          if (!calendarFound) {
            await sendToMainWorld('OPEN_CALENDAR', {});
            await delay(1000);
            await sendToMainWorld('CLICK_INPUT', { pattern: '^\\d{4}-\\d{2}-\\d{2}$' });
            await delay(1500);
          }

          // Check if calendar popup opened — broad search including React portals
          const calendarPopup = await waitForElement(() => {
            const sels = [
              '[class*="picker-dropdown"]', '[class*="PickerPanel"]', '[class*="picker-panel"]',
              '[class*="DatePicker"]', '[class*="calendar"]', '[class*="Calendar"]',
              '[class*="TUXCalendar"]', '[role="grid"]', '[role="dialog"] table',
              'table[class*="date"]'
            ];
            for (const sel of sels) {
              const el = document.querySelector(sel);
              if (el && el.offsetParent !== null) {
                const r = el.getBoundingClientRect();
                if (r.width > 80 && r.height > 60) return el;
              }
            }
            // Check last children of body (React portals)
            const bodyKids = [...document.body.children].reverse().slice(0, 10);
            for (const child of bodyKids) {
              const r = child.getBoundingClientRect();
              if (r.width > 100 && r.height > 80) {
                const style = window.getComputedStyle(child);
                if (style.position === 'absolute' || style.position === 'fixed' || parseInt(style.zIndex) > 50) {
                  const text = child.textContent || '';
                  if (/\b(1[0-9]|2[0-9]|30|31|[1-9])\b/.test(text)) return child;
                }
              }
            }
            return null;
          }, 3000);

          if (calendarPopup) {
            console.log('[TikTok Platform] ✅ Calendar popup opened!', calendarPopup.tagName, calendarPopup.className?.substring(0, 80));
          } else {
            console.log('[TikTok Platform] Calendar popup not found after all click attempts');
            const allVisiblePopups = document.querySelectorAll('[class*="popup"], [class*="Popup"], [class*="dropdown"], [class*="Dropdown"], [class*="floating"], [class*="panel"], [class*="Panel"], [class*="picker"], [class*="Picker"]');
            const visiblePopups = [...allVisiblePopups].filter(p => p.offsetParent !== null && p.getBoundingClientRect().height > 50);
            console.log('[TikTok Platform] Visible popups/panels:', visiblePopups.length);
            for (const p of visiblePopups.slice(0, 5)) {
              console.log('[TikTok Platform] Popup:', p.tagName, p.className?.substring(0, 120), 'size:', p.getBoundingClientRect().width, 'x', p.getBoundingClientRect().height);
            }
          }
        }

        // ★★★ APPROACH 4: Calendar navigation + day cell click ★★★
        if (dateInput.value !== expectedDate) {
          // Navigate เดือน — หา header ที่มี "Month / Year" หรือ "Month Year"
          const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          const maxNav = 24;

          for (let i = 0; i < maxNav; i++) {
            let headerEl = null;
            let headerText = '';

            const candidates = document.querySelectorAll(
              '[class*="calendar"] *, [class*="Calendar"] *, [class*="DatePicker"] *, [class*="datepicker"] *, [class*="panel"] *, [role="grid"] *, [class*="TUXCalendar"] *, [class*="picker"] *, [class*="Picker"] *'
            );
            for (const el of candidates) {
              if (el.childElementCount > 0) continue;
              const txt = (el.textContent || '').trim();
              const match = txt.match(/^(\w+)\s*\/?\s*(\d{4})$/);
              if (match && months.includes(match[1])) {
                headerEl = el;
                headerText = txt;
                break;
              }
            }

            if (!headerEl) {
              const broader = document.querySelectorAll('div, span, button');
              for (const el of broader) {
                if (el.childElementCount > 3) continue;
                const txt = (el.textContent || '').trim();
                const match = txt.match(/^(\w+)\s*\/?\s*(\d{4})$/);
                if (match && months.includes(match[1])) {
                  headerEl = el;
                  headerText = txt;
                  break;
                }
              }
            }

            if (!headerEl) {
              console.log('[TikTok Platform] Calendar header not found, stopping navigation');
              break;
            }

            console.log('[TikTok Platform] Calendar header:', headerText);

            let calMonth = -1, calYear = -1;
            for (let m = 0; m < months.length; m++) {
              if (headerText.includes(months[m])) { calMonth = m; break; }
            }
            const ym = headerText.match(/\d{4}/);
            if (ym) calYear = parseInt(ym[0]);

            console.log('[TikTok Platform] Calendar shows:', months[calMonth], calYear, '| Target:', months[targetMonth], targetYear);

            if (calMonth === targetMonth && calYear === targetYear) {
              console.log('[TikTok Platform] Correct month/year reached');
              break;
          }

          // Navigate
          const needForward = (targetYear > calYear) || (targetYear === calYear && targetMonth > calMonth);
          console.log('[TikTok Platform] Need to navigate:', needForward ? 'FORWARD >' : '< BACKWARD');

          // หาปุ่ม nav — ปุ่มที่มี SVG หรือ < > อยู่ใน calendar area
          let navClicked = false;
          const allBtns = document.querySelectorAll('button');
          const svgNavBtns = [...allBtns].filter(b => {
            if (!b.querySelector('svg')) return false;
            if (b.textContent.trim().length > 3) return false;
            const rect = b.getBoundingClientRect();
            // ต้องอยู่ในบริเวณ calendar (ส่วนบน)
            return rect.width > 0 && rect.height > 0 && rect.width < 60;
          });

          // เรียงตาม x position: ซ้าย = prev, ขวา = next
          svgNavBtns.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);

          if (svgNavBtns.length >= 2) {
            const navBtn = needForward ? svgNavBtns[svgNavBtns.length - 1] : svgNavBtns[0];
            simulateRealClick(navBtn);
            navClicked = true;
            console.log('[TikTok Platform] Clicked nav button via SVG');
          }

          if (!navClicked) {
            await sendToMainWorld('CLICK_CALENDAR_NAV', { direction: needForward ? 'next' : 'prev' });
            console.log('[TikTok Platform] Clicked nav via MAIN world');
          }
          await delay(800);
        }

        // ★ Helper: หา day cell element จาก calendar popup ★
        function findDayCell(day) {
          const dayCells = document.querySelectorAll(
            'td, [role="gridcell"], [class*="calendar"] button, [class*="Calendar"] button, ' +
            '[class*="DatePicker"] button, [class*="DatePicker"] div, [class*="DatePicker"] span, ' +
            '[class*="day"], [class*="Day"], [class*="date"] button, [class*="TUXCalendar"] td'
          );
          const candidates = [];
          for (const cell of dayCells) {
            const text = (cell.textContent || '').trim();
            if (text !== String(day)) continue;
            if (cell.childElementCount > 2) continue;
            if (cell.offsetParent === null) continue;
            const cls = (cell.className || '').toLowerCase();
            if (cls.includes('disabled') || cls.includes('outside') || cls.includes('other') || cls.includes('prev') || cls.includes('next')) continue;
            const rect = cell.getBoundingClientRect();
            if (rect.width < 10 || rect.height < 10) continue;
            candidates.push({ el: cell, rect });
          }
          candidates.sort((a, b) => {
            if (a.el.childElementCount === 0 && b.el.childElementCount > 0) return -1;
            if (a.el.childElementCount > 0 && b.el.childElementCount === 0) return 1;
            return (a.rect.width * a.rect.height) - (b.rect.width * b.rect.height);
          });
          return candidates.length > 0 ? candidates[0] : null;
        }

        // ★★★ APPROACH 5: Calendar day cell click — retry สูงสุด 3 รอบ ★★★
        if (dateInput.value !== expectedDate) {
          for (let dateAttempt = 0; dateAttempt < 3; dateAttempt++) {
            await delay(500);
            console.log('[TikTok Platform] [Date] Day cell click attempt', dateAttempt + 1, '/ 3, looking for day:', targetDay);

            let dateChanged = false;

            // 5a: Calendar อาจเปิดอยู่ → หา day cell แล้วคลิก
            const found = findDayCell(targetDay);
            if (found) {
              console.log('[TikTok Platform] Calendar open — day cell found:', found.el.tagName, 'children:', found.el.childElementCount);
              // EXEC_CLICK_DATE_CELL (React handlers via MAIN world)
              const execResult = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ type: 'EXEC_CLICK_DATE_CELL', day: targetDay }, (resp) => {
                  if (chrome.runtime.lastError) resolve(false);
                  else resolve(resp?.success);
                });
              });
              if (execResult) {
                await delay(1000);
                if (dateInput.value === expectedDate) {
                  console.log('[TikTok Platform] ✅ Date set via EXEC_CLICK_DATE_CELL!');
                  dateChanged = true;
                }
              }
              // DEBUGGER_CLICK at day cell coords
              if (!dateChanged) {
                const freshTarget = findDayCell(targetDay);
                if (freshTarget) {
                  const cx = Math.round(freshTarget.rect.left + freshTarget.rect.width / 2);
                  const cy = Math.round(freshTarget.rect.top + freshTarget.rect.height / 2);
                  console.log('[TikTok Platform] Trying DEBUGGER_CLICK at', cx, cy);
                  try {
                    const dbgResult = await new Promise((resolve) => {
                      chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: cx, y: cy }, (resp) => {
                        if (chrome.runtime.lastError) resolve(null);
                        else resolve(resp);
                      });
                    });
                    if (dbgResult?.success) {
                      await delay(1500);
                      if (dateInput.value === expectedDate) {
                        console.log('[TikTok Platform] ✅ Date set via DEBUGGER_CLICK!');
                        dateChanged = true;
                      }
                    }
                  } catch (e) { console.log('[TikTok Platform] DEBUGGER_CLICK error:', e.message); }
                }
              }
              // simulateRealClick on day cell
              if (!dateChanged) {
                const clickTarget = findDayCell(targetDay);
                if (clickTarget) {
                  simulateRealClick(clickTarget.el);
                  await sendToMainWorld('CLICK_DATE_CELL', { day: targetDay });
                  await delay(1000);
                  if (dateInput.value === expectedDate) {
                    console.log('[TikTok Platform] ✅ Date set via simulateRealClick!');
                    dateChanged = true;
                  }
                }
              }
            } else {
              console.log('[TikTok Platform] Calendar not open — no day cells found');
            }

            // 5b: DEBUGGER_SET_DATE — เปิด calendar + คลิก day ใน session เดียว
            if (!dateChanged) {
              try {
                console.log('[TikTok Platform] Trying DEBUGGER_SET_DATE (attempt)...');
                document.body.click();
                await delay(300);
                const debugResult = await new Promise((resolve) => {
                  chrome.runtime.sendMessage({ type: 'DEBUGGER_SET_DATE', day: targetDay }, (resp) => {
                    if (chrome.runtime.lastError) resolve(null);
                    else resolve(resp);
                  });
                });
                if (debugResult?.success) {
                  await delay(1500);
                  if (dateInput.value === expectedDate) {
                    console.log('[TikTok Platform] ✅ Date set via DEBUGGER_SET_DATE retry!');
                    dateChanged = true;
                  }
                }
              } catch (e) { console.log('[TikTok Platform] DEBUGGER_SET_DATE retry failed:', e.message); }
            }

            // 5c: Last resort — try setScheduleDirect one more time
            if (!dateChanged) {
              const retryDirect = await sendToMainWorld('SET_SCHEDULE_DIRECT', { time: null, date: expectedDate });
              if (retryDirect?.dateSet) {
                await delay(500);
                if (dateInput.value === expectedDate) {
                  console.log('[TikTok Platform] ✅ Date set via retry setScheduleDirect!');
                  dateChanged = true;
                }
              }
            }

            if (dateChanged) break;

            console.log('[TikTok Platform] Date input after attempt:', dateInput.value, '| Expected:', expectedDate);
            if (dateInput.value === expectedDate) break;

            if (dateAttempt < 2) {
              console.log('[TikTok Platform] ⚠️ Date not changed, reopening calendar via DEBUGGER_CLICK...');
              document.body.click();
              await delay(500);
              const reopenRect = dateInput.getBoundingClientRect();
              const reopenX = Math.round(reopenRect.left + reopenRect.width / 2);
              const reopenY = Math.round(reopenRect.top + reopenRect.height / 2);
              await new Promise((resolve) => {
                chrome.runtime.sendMessage({ type: 'DEBUGGER_CLICK', x: reopenX, y: reopenY, keepAttached: true }, (resp) => {
                  if (chrome.runtime.lastError) resolve(null);
                  else resolve(resp);
                });
              });
              await delay(2000);
            } else {
              console.log('[TikTok Platform] ❌ Date still not changed after 3 day-click attempts');
            }
          }
        }

        } // close APPROACH 4 if block

        // ปิด calendar + detach debugger
        await delay(500);
        document.body.click();
        await delay(500);
        try {
          chrome.runtime.sendMessage({ type: 'DEBUGGER_DETACH' }, () => {});
        } catch (e) {}

        // ★★★ LOCK_DATE_FALLBACK — absolute last resort ★★★
        if (dateInput.value !== expectedDate) {
          console.log('[TikTok Platform] [Date] ALL calendar approaches failed — using LOCK_DATE_FALLBACK...');
          const lockResult = await sendToMainWorld('LOCK_DATE_FALLBACK', {
            targetDate: expectedDate,
            currentDate: dateInput.value
          });
          console.log('[TikTok Platform] LOCK_DATE_FALLBACK result:', lockResult);
          await delay(500);
        }

        // ★★★ FINAL CHECK ★★★
        console.log('[TikTok Platform] Final date value:', dateInput.value, '| Expected:', expectedDate);
        if (dateInput.value !== expectedDate) {
          console.log('[TikTok Platform] ⚠️ Date could not be changed. Proceeding with current date.');
        }
      } else {
        console.log('[TikTok Platform] Date input not found, skipping date selection');
      }

      console.log('[TikTok Platform] Schedule set!');
      return true;
    } catch (err) {
      console.error('[TikTok Platform] Schedule error:', err);
      return false;
    }
  }

  // ── Helpers ──
  async function retryAction(fn, maxRetries, delayMs) {
    for (let i = 0; i < maxRetries; i++) {
      const result = await fn();
      if (result) return true;
      if (i < maxRetries - 1) await delay(delayMs);
    }
    return false;
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

  // ── Auto Post Schedule Bridge ──
  // ★ ให้ content.js (Auto Post) ขอตั้ง schedule ผ่าน CustomEvent ★
  // ★ ไม่ mix flow logic — แค่ expose setTikTokSchedule เป็น service ★
  window.addEventListener('autopost-schedule-request', async (e) => {
    const { scheduleTime } = e.detail || {};
    console.log('[TikTok Platform] Received autopost-schedule-request, scheduleTime:', scheduleTime);
    if (!scheduleTime) {
      window.dispatchEvent(new CustomEvent('autopost-schedule-result', { detail: { success: false, error: 'no scheduleTime' } }));
      return;
    }
    try {
      const result = await setTikTokSchedule(scheduleTime);
      console.log('[TikTok Platform] autopost-schedule-request done, result:', result);
      window.dispatchEvent(new CustomEvent('autopost-schedule-result', { detail: { success: !!result } }));
    } catch (err) {
      console.error('[TikTok Platform] autopost-schedule-request error:', err);
      window.dispatchEvent(new CustomEvent('autopost-schedule-result', { detail: { success: false, error: err.message } }));
    }
  });

  // ── Init ──
  // ใช้ storage.onChanged listener แทน setInterval เพื่อไม่รบกวน TikTok
  // จะทำงานเฉพาะเมื่อ sidepanel เขียน platformPostData ลง storage เท่านั้น
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.platformPostData && changes.platformPostData.newValue) {
      const data = changes.platformPostData.newValue;
      if (data.platform === 'tiktok') {
        console.log('[TikTok Platform] Detected platformPostData change, checking...');
        setTimeout(checkForPlatformData, 2000);
      }
    }
  });

  // เช็คครั้งเดียวตอนโหลด (กรณี page reload ขณะที่มี data อยู่แล้ว)
  if (window.location.href.includes('/upload')) {
    setTimeout(checkForPlatformData, 3000);
  }

})();
