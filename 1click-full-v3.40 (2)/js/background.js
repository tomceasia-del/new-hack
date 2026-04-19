chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// ★ SAFETY NET: Global error handlers — จับ error แทนปล่อยให้ SW crash ★
self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW Safety] Unhandled promise rejection:', event.reason?.message || event.reason);
  event.preventDefault();
});

self.addEventListener('error', (event) => {
  console.error('[SW Safety] Uncaught error:', event.message, event.filename, event.lineno);
});

// ★ Keep Service Worker alive + auto-cleanup stale video data ★
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    const now = Date.now();
    // Auto-clear stale video base64 ถ้าค้างเกิน 3 นาที (ป้องกัน memory leak)
    if (capturedVideoBase64 && capturedVideoTime > 0 && (now - capturedVideoTime) > 180000) {
      console.log('[SW Cleanup] Auto-clearing stale video base64 (age:', Math.round((now - capturedVideoTime) / 1000), 's)');
      capturedVideoBase64 = null;
      capturedVideoSize = 0;
      capturedVideoStatus = 'idle';
      capturedVideoTime = 0;
    }
    // Auto-clear stale pendingVideoDownloadIds ถ้าค้างเกิน 5 นาที
    if (pendingVideoDownloadIds.size > 0 && capturedVideoTime > 0 && (now - capturedVideoTime) > 300000) {
      console.log('[SW Cleanup] Auto-clearing stale pending downloads:', pendingVideoDownloadIds.size);
      pendingVideoDownloadIds.clear();
      capturedVideoStatus = 'idle';
    }
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('1CLICK AUTOMATIC SYSTEM installed/updated:', details.reason);
  
  // ★ Force login on fresh install ★
  if (details.reason === 'install') {
    // Clear license cache to force login
    await chrome.storage.local.remove(['licenseKey', 'licenseData', 'licensedAt']);
    console.log('[License] Cleared license cache - user must login');
  }
  
  // On update, keep license but log
  if (details.reason === 'update') {
    console.log('[License] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// ★ จับ video download จาก Google Flow — รอ download เสร็จ → อ่านไฟล์จาก disk ★
let capturedVideoBase64 = null;
let capturedVideoSize = 0;
let capturedVideoTime = 0;
let capturedVideoStatus = 'idle'; // idle, downloading, reading, success, error

// เก็บ download IDs ที่น่าจะเป็น video จาก Google Flow
let pendingVideoDownloadIds = new Set();

// ★ จับ download เริ่มต้น — เก็บ ID ไว้ ★
chrome.downloads.onCreated.addListener((downloadItem) => {
  const url = downloadItem.url || '';
  const finalUrl = downloadItem.finalUrl || '';
  const mime = (downloadItem.mime || '').toLowerCase();
  const filename = (downloadItem.filename || '').toLowerCase();
  
  console.log('[Background] ★ Download created:', downloadItem.id, 
    'url:', url.substring(0, 100), 
    'finalUrl:', finalUrl.substring(0, 100),
    'mime:', mime, 
    'filename:', filename);

  // จับ download ที่น่าจะเป็น video จาก Google Flow
  const isBlob = url.startsWith('blob:');
  const isFromFlow = url.includes('labs.google') || finalUrl.includes('labs.google') ||
                     url.includes('googleapis.com') || finalUrl.includes('googleapis.com');
  const isMp4 = filename.endsWith('.mp4') || filename.endsWith('.webm');
  const isVideo = mime.includes('video') || mime.includes('octet-stream');

  // จับกว้าง: blob URL ใดๆ ที่เป็น video/mp4, หรือมาจาก labs.google/googleapis
  if (isBlob || isFromFlow || isMp4 || isVideo) {
    console.log('[Background] ★★★ Potential video download! ID:', downloadItem.id, 
      'isBlob:', isBlob, 'isFromFlow:', isFromFlow, 'isMp4:', isMp4, 'isVideo:', isVideo);
    pendingVideoDownloadIds.add(downloadItem.id);
    capturedVideoStatus = 'downloading';
    capturedVideoTime = Date.now();
  }
});

// ★ จับ download เสร็จ — อ่านไฟล์ผ่าน offscreen document → base64 ★
chrome.downloads.onChanged.addListener(async (delta) => {
  if (!pendingVideoDownloadIds.has(delta.id)) return;
  if (!delta.state || delta.state.current !== 'complete') return;

  console.log('[Background] ★ Video download COMPLETE! ID:', delta.id);
  pendingVideoDownloadIds.delete(delta.id);

  try {
    const downloads = await chrome.downloads.search({ id: delta.id });
    if (!downloads || downloads.length === 0) {
      console.log('[Background] ❌ Download not found:', delta.id);
      capturedVideoStatus = 'error';
      return;
    }

    const item = downloads[0];
    const filePath = item.filename;
    const fileSize = item.fileSize || item.totalBytes || 0;
    console.log('[Background] ★ Downloaded file:', filePath, 'size:', fileSize);

    if (fileSize < 500000) {
      console.log('[Background] ⚠️ File too small, skip:', fileSize);
      capturedVideoStatus = 'error';
      return;
    }

    capturedVideoStatus = 'reading';
    console.log('[Background] Creating offscreen document to read file...');

    // สร้าง offscreen document — force close ตัวเก่าก่อนถ้ามีค้าง
    try {
      try { await chrome.offscreen.closeDocument(); } catch (_) {}
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['BLOBS'],
        justification: 'Read downloaded video file and convert to base64'
      });
      console.log('[Background] Offscreen document created OK');
    } catch (e) {
      if (!e.message?.includes('Only a single offscreen')) {
        console.log('[Background] Offscreen create warning:', e.message);
      }
    }

    // ★ ส่ง message ไป offscreen — ใส่ target: 'offscreen' เพื่อให้ background listener ปล่อยผ่าน ★
    console.log('[Background] Sending READ_FILE_AS_BASE64 to offscreen, path:', filePath);
    const result = await chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'READ_FILE_AS_BASE64',
      filePath: filePath
    });

    console.log('[Background] Offscreen result:', result?.status, 'size:', result?.size || 0);

    if (result && result.status === 'success' && result.base64) {
      capturedVideoBase64 = result.base64;
      capturedVideoSize = result.size || fileSize;
      capturedVideoStatus = 'success';
      capturedVideoTime = Date.now();
      console.log('[Background] ★★★ Video base64 READY! Size:', capturedVideoSize, 'base64 len:', capturedVideoBase64.length);
    } else {
      console.log('[Background] ❌ Offscreen read failed:', result?.message || 'unknown');
      capturedVideoStatus = 'error';
    }

    // Cleanup offscreen
    try { await chrome.offscreen.closeDocument(); } catch(e) {}

  } catch (err) {
    console.log('[Background] ❌ Download read error:', err.message);
    capturedVideoStatus = 'error';
  }
});

// ── Debugger session tracking (ต้องประกาศก่อน listener ที่ใช้) ──
const _debuggerTabs = new Set();

chrome.debugger.onDetach.addListener((source) => {
  _debuggerTabs.delete(source.tabId);
  console.log('[Background] Debugger detached from tab:', source.tabId);
});

// ★ BUG #2 FIX: รวม listener ทั้งหมดเป็นตัวเดียว route ด้วย if/else ป้องกัน channel ค้าง ★
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // ★ CRITICAL: ไม่ handle message ที่ส่งไป offscreen — ปล่อยให้ offscreen.js รับ ★
  if (message.target === 'offscreen') return false;

  if (message.type === 'CLEAR_CACHE') {
    const mode = message.mode || 'cache';
    const opts = {};
    
    (async () => {
      try {
        if (mode === 'cache') {
          await chrome.browsingData.removeCache(opts);
        } else if (mode === 'cache_cookies') {
          await chrome.browsingData.removeCache(opts);
          await chrome.browsingData.removeCookies(opts);
        } else if (mode === 'all') {
          await chrome.browsingData.remove(opts, {
            cache: true,
            cookies: true,
            history: true,
            localStorage: true
          });
        }
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    
    return true; // async sendResponse
  }

  else if (message.source === 'tiktok-scraper') {
    // Forward to all extension pages (including side panel)
    chrome.runtime.sendMessage(message).catch(() => {
      // Side panel might not be open, ignore error
    });
  }
  
  // Handle Slate paste via page context (bypass CSP)
  else if (message.type === 'PASTE_TO_SLATE') {
    const tabId = sender.tab?.id;
    const promptText = message.promptText;
    if (tabId && promptText) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        world: 'MAIN',
        func: (text) => {
          try {
            var editorEl = document.querySelector('[data-slate-editor="true"]');
            if (!editorEl) {
              window.__slatePasteResult = { status: 'error', message: 'editor not found' };
              return;
            }

            // หา Slate Editor instance ผ่าน React Fiber
            var slateEditor = null;
            var fiberKey = Object.keys(editorEl).find(k =>
              k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
            );

            if (fiberKey) {
              var current = editorEl[fiberKey];
              for (var i = 0; i < 30 && current; i++) {
                if (current.memoizedProps?.editor) { slateEditor = current.memoizedProps.editor; break; }
                if (current.pendingProps?.editor) { slateEditor = current.pendingProps.editor; break; }
                if (current.stateNode?.editor) { slateEditor = current.stateNode.editor; break; }
                current = current.return;
              }
            }

            if (slateEditor && typeof slateEditor.insertText === 'function') {
              console.log('[TikTok Auto] PAGE: Found Slate editor instance via Fiber!');

              // ★★★ Clear existing content — ใช้หลายวิธีเพื่อให้แน่ใจว่า clear จริง ★★★
              var cleared = false;
              try {
                if (slateEditor.children && slateEditor.children.length > 0) {
                  // วิธี 1: ใช้ Transforms ถ้ามี (Slate >= 0.50)
                  var SlateTransforms = window.Slate?.Transforms || window.SlateTransforms;
                  var SlateEditor = window.Slate?.Editor || window.SlateEditor;
                  if (SlateTransforms && SlateEditor) {
                    try {
                      SlateTransforms.select(slateEditor, []);
                      SlateTransforms.delete(slateEditor, { at: { anchor: SlateEditor.start(slateEditor, []), focus: SlateEditor.end(slateEditor, []) } });
                      cleared = true;
                      console.log('[TikTok Auto] PAGE: Cleared via Transforms.delete');
                    } catch(e) { console.log('[TikTok Auto] PAGE: Transforms clear error:', e.message); }
                  }

                  // วิธี 2: select all + deleteFragment
                  if (!cleared) {
                    try {
                      // หา path สุดท้ายที่ถูกต้อง
                      var lastIdx = slateEditor.children.length - 1;
                      var lastNode = slateEditor.children[lastIdx];
                      var lastTextNode = lastNode?.children ? lastNode.children[lastNode.children.length - 1] : null;
                      var lastTextLen = lastTextNode?.text?.length || 0;
                      // ถ้าไม่มี text ลอง traverse ลึกกว่า
                      if (lastTextLen === 0 && lastNode?.children) {
                        for (var ci = lastNode.children.length - 1; ci >= 0; ci--) {
                          if (lastNode.children[ci]?.text?.length > 0) {
                            lastTextLen = lastNode.children[ci].text.length;
                            break;
                          }
                        }
                      }
                      slateEditor.selection = {
                        anchor: { path: [0, 0], offset: 0 },
                        focus: { path: [lastIdx, lastNode?.children ? lastNode.children.length - 1 : 0], offset: lastTextLen }
                      };
                      slateEditor.deleteFragment();
                      cleared = true;
                      console.log('[TikTok Auto] PAGE: Cleared via deleteFragment');
                    } catch(e) { console.log('[TikTok Auto] PAGE: deleteFragment error:', e.message); }
                  }

                  // วิธี 3: ลบทีละ node จากท้ายมาหน้า
                  if (!cleared) {
                    try {
                      while (slateEditor.children.length > 1) {
                        slateEditor.apply({ type: 'remove_node', path: [slateEditor.children.length - 1], node: slateEditor.children[slateEditor.children.length - 1] });
                      }
                      // clear text ใน node แรก
                      var firstText = slateEditor.children[0]?.children?.[0]?.text || '';
                      if (firstText.length > 0) {
                        slateEditor.selection = { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: firstText.length } };
                        slateEditor.deleteFragment();
                      }
                      cleared = true;
                      console.log('[TikTok Auto] PAGE: Cleared via remove_node loop');
                    } catch(e) { console.log('[TikTok Auto] PAGE: remove_node error:', e.message); }
                  }

                  // วิธี 4: deleteBackward หลายๆ ครั้ง
                  if (!cleared) {
                    try {
                      for (var db = 0; db < 100; db++) {
                        slateEditor.deleteBackward('character');
                      }
                      cleared = true;
                      console.log('[TikTok Auto] PAGE: Cleared via deleteBackward');
                    } catch(e) { console.log('[TikTok Auto] PAGE: deleteBackward error:', e.message); }
                  }
                }
                console.log('[TikTok Auto] PAGE: Content after clear:', JSON.stringify(slateEditor.children?.map(c => c?.children?.[0]?.text?.substring(0, 30))));
              } catch(e) { console.log('[TikTok Auto] PAGE: Clear error (ok):', e.message); }

              // ★ ตั้ง cursor ที่ต้นก่อน insert เสมอ ★
              try {
                slateEditor.selection = { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } };
              } catch(e) {}

              // Insert text — ครั้งเดียว
              try {
                slateEditor.insertText(text);
                console.log('[TikTok Auto] PAGE: insertText succeeded! Length:', text.length);
                
                // Dispatch events เพื่อ enable ปุ่ม Generate (ห้าม beforeinput กับ data)
                try {
                  editorEl.dispatchEvent(new Event('input', { bubbles: true }));
                  editorEl.dispatchEvent(new Event('change', { bubbles: true }));
                  if (slateEditor.onChange) slateEditor.onChange();
                } catch(evtErr) {}
                
                window.__slatePasteResult = { status: 'success', method: 'insertText' };
                return;
              } catch(e) { console.log('[TikTok Auto] PAGE: insertText error:', e.message); }

              // Fallback: insertNode — ครั้งเดียว
              try {
                slateEditor.insertNode({ type: 'paragraph', children: [{ text: text }] });
                console.log('[TikTok Auto] PAGE: insertNode succeeded!');
                try {
                  editorEl.dispatchEvent(new Event('input', { bubbles: true }));
                  editorEl.dispatchEvent(new Event('change', { bubbles: true }));
                  if (slateEditor.onChange) slateEditor.onChange();
                } catch(evtErr) {}
                window.__slatePasteResult = { status: 'success', method: 'insertNode' };
                return;
              } catch(e) { console.log('[TikTok Auto] PAGE: insertNode error:', e.message); }
            }

            // Fallback สุดท้าย: ใช้ DOM textContent replace แทน (ไม่ append)
            console.log('[TikTok Auto] PAGE: All Slate methods failed — using DOM replace...');
            editorEl.focus();
            // Clear DOM content ก่อน
            editorEl.textContent = '';
            var dt = new DataTransfer();
            dt.setData('text/plain', text);
            editorEl.dispatchEvent(new InputEvent('beforeinput', {
              bubbles: true, cancelable: true, inputType: 'insertFromPaste', data: null, dataTransfer: dt
            }));

            setTimeout(() => {
              var t = editorEl.textContent || '';
              if (t.length > 30 && !t.includes('What happens next')) {
                window.__slatePasteResult = { status: 'success', method: 'beforeinput-page' };
              } else {
                window.__slatePasteResult = { status: 'failed', message: 'all methods failed' };
              }
            }, 1000);

          } catch(e) {
            console.error('[TikTok Auto] PAGE ERROR:', e);
            window.__slatePasteResult = { status: 'error', message: e.message };
          }
        },
        args: [promptText]
      }).then(() => {
        sendResponse({ ok: true });
      }).catch(err => {
        console.log('[Background] PASTE_TO_SLATE error:', err);
        sendResponse({ ok: false, error: err.message });
      });
      return true; // async sendResponse
    }
  }

  // ★ PD-INSPIRED: READ_FLOW_STATE — อ่าน Flow internal state (clip/failed count) ผ่าน MAIN world ★
  else if (message.type === 'READ_FLOW_STATE') {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        world: 'MAIN',
        func: () => {
          try {
            // Walk all React fiber roots to find Flow's internal state
            const stateResult = { clipCount: 0, failedCount: 0, generatingCount: 0 };

            // Method 1: scan for _flowVeo* or similar global state
            for (const key of Object.keys(window)) {
              if (key.startsWith('_flow') || key.startsWith('__flow')) {
                const val = window[key];
                if (val && typeof val === 'object') {
                  if (typeof val.clipCount === 'number') stateResult.clipCount = val.clipCount;
                  if (typeof val.failedCount === 'number') stateResult.failedCount = val.failedCount;
                  if (typeof val.generatingCount === 'number') stateResult.generatingCount = val.generatingCount;
                }
              }
            }

            // Method 2: count visible media elements as fallback
            if (stateResult.clipCount === 0) {
              const imgs = document.querySelectorAll('img');
              let visibleCount = 0;
              let failedCount = 0;
              for (const img of imgs) {
                const rect = img.getBoundingClientRect();
                if (img.offsetParent !== null && rect.width > 60 && rect.height > 60) visibleCount++;
              }
              const failBadges = document.querySelectorAll('div, span');
              for (const el of failBadges) {
                const t = (el.textContent || '').trim();
                if (t.length >= 4 && t.length <= 30 && /failed/i.test(t) && el.offsetParent !== null) failedCount++;
              }
              stateResult.clipCount = visibleCount;
              stateResult.failedCount = failedCount;
            }

            // Method 3: check progress indicators
            const progressEls = document.querySelectorAll('div, span');
            let genCount = 0;
            for (const el of progressEls) {
              const t = (el.textContent || '').trim();
              if (/^\d{1,3}%$/.test(t) && el.offsetParent !== null) {
                const rect = el.getBoundingClientRect();
                if (rect.width < 200 && rect.height < 80) genCount++;
              }
            }
            stateResult.generatingCount = genCount;

            window._1clickFlowState = stateResult;
          } catch (e) {
            window._1clickFlowState = { error: e.message };
          }
        }
      }).then(async () => {
        await new Promise(r => setTimeout(r, 200));
        try {
          const readResult = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: 'MAIN',
            func: () => window._1clickFlowState || {}
          });
          const state = readResult?.[0]?.result || {};
          sendResponse({ success: true, ...state });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }
    sendResponse({ success: false, error: 'no tab' });
  }

  // ★ FOCUS_CURRENT_TAB: Focus tab ที่ส่ง message มา (ใช้หลัง video generate เสร็จ) ★
  else if (message.type === 'FOCUS_CURRENT_TAB') {
    const tabId = sender.tab?.id;
    const windowId = sender.tab?.windowId;
    if (tabId) {
      try {
        chrome.tabs.update(tabId, { active: true });
        if (windowId) chrome.windows.update(windowId, { focused: true });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    } else {
      sendResponse({ ok: false, error: 'no tabId' });
    }
    return true;
  }

  // ★ PRESS_ENTER_SLATE: กด Enter บน Slate editor จาก MAIN world เพื่อ trigger Generate ★
  else if (message.type === 'PRESS_ENTER_SLATE') {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ ok: false, error: 'No tab ID' });
      return false;
    }
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: () => {
        try {
          var editorEl = document.querySelector('[data-slate-editor="true"]');
          if (!editorEl) {
            console.log('[TikTok Auto] PAGE: Slate editor not found for Enter');
            return;
          }
          editorEl.focus();
          var enterDown = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true });
          var enterPress = new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true });
          var enterUp = new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true });
          editorEl.dispatchEvent(enterDown);
          editorEl.dispatchEvent(enterPress);
          editorEl.dispatchEvent(enterUp);
          console.log('[TikTok Auto] PAGE: Enter key dispatched on Slate editor');
        } catch(e) {
          console.error('[TikTok Auto] PAGE: Enter key error:', e);
        }
      }
    }).then(() => {
      sendResponse({ ok: true });
    }).catch(err => {
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }

  // Handle reading Slate paste result
  else if (message.type === 'READ_SLATE_PASTE_RESULT') {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ status: 'error', message: 'No tab ID' });
      return false;
    }
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: () => window.__slatePasteResult || { status: 'pending' }
    }).then(results => {
      sendResponse(results?.[0]?.result || { status: 'pending' });
    }).catch(err => {
      sendResponse({ status: 'error', message: err.message });
    });
    return true;
  }

  // ★ SIMULATE_PASTE: วาง caption ลง TikTok DraftJS editor ผ่าน MAIN world ★
  else if (message.type === 'SIMULATE_PASTE') {
    const tabId = sender.tab?.id;
    const captionText = message.text;
    if (tabId && captionText) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        world: 'MAIN',
        func: (text) => {
          try {
            // หา DraftJS editor element
            var editorEl = document.querySelector('.public-DraftEditor-content[contenteditable="true"]');
            if (!editorEl) {
              editorEl = document.querySelector('[contenteditable="true"][role="textbox"]');
            }
            if (!editorEl) {
              editorEl = document.querySelector('div[contenteditable="true"]');
            }
            if (!editorEl) {
              window.__draftPasteResult = { status: 'error', message: 'editor not found' };
              return;
            }

            // หา DraftJS Editor instance ผ่าน React Fiber
            var editorInstance = null;
            var fiberKey = Object.keys(editorEl).find(k =>
              k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
            );

            if (fiberKey) {
              var current = editorEl[fiberKey];
              for (var i = 0; i < 50 && current; i++) {
                // หา component ที่มี props.editorState (DraftJS Editor)
                var props = current.memoizedProps || current.pendingProps;
                if (props && props.editorState && typeof props.onChange === 'function') {
                  editorInstance = { editorState: props.editorState, onChange: props.onChange };
                  break;
                }
                // หา stateNode ที่มี editor state
                if (current.stateNode && current.stateNode.props) {
                  var sp = current.stateNode.props;
                  if (sp.editorState && typeof sp.onChange === 'function') {
                    editorInstance = { editorState: sp.editorState, onChange: sp.onChange };
                    break;
                  }
                }
                current = current.return;
              }
            }

            if (editorInstance) {
              console.log('[TikTok Paste] Found DraftJS editor instance via Fiber!');
              
              // ใช้ DraftJS API: Modifier.replaceWithFragment หรือ EditorState.push
              var EditorState = editorInstance.editorState.constructor;
              var ContentState = editorInstance.editorState.getCurrentContent().constructor;
              
              // สร้าง ContentState ใหม่จาก text
              var Modifier = null;
              
              // พยายามหา Draft global
              if (window.Draft) {
                Modifier = window.Draft.Modifier;
              }
              
              if (Modifier) {
                // ใช้ Modifier.replaceText
                var currentContent = editorInstance.editorState.getCurrentContent();
                var selection = editorInstance.editorState.getSelection();
                
                // Select all แล้ว replace
                var firstBlock = currentContent.getFirstBlock();
                var lastBlock = currentContent.getLastBlock();
                var selectAll = selection.merge({
                  anchorKey: firstBlock.getKey(),
                  anchorOffset: 0,
                  focusKey: lastBlock.getKey(),
                  focusOffset: lastBlock.getLength()
                });
                
                var newContent = Modifier.replaceText(currentContent, selectAll, text);
                var newEditorState = EditorState.push(editorInstance.editorState, newContent, 'insert-characters');
                editorInstance.onChange(newEditorState);
                
                console.log('[TikTok Paste] DraftJS Modifier.replaceText succeeded!');
                window.__draftPasteResult = { status: 'success', method: 'DraftJS-Modifier' };
                return;
              }
              
              // Fallback: ContentState.createFromText
              try {
                var newContent2 = ContentState.createFromText(text);
                var newState = EditorState.push(editorInstance.editorState, newContent2, 'insert-fragment');
                editorInstance.onChange(newState);
                console.log('[TikTok Paste] EditorState.push(createFromText) succeeded!');
                window.__draftPasteResult = { status: 'success', method: 'createFromText' };
                return;
              } catch(e2) {
                console.log('[TikTok Paste] createFromText failed:', e2.message);
              }
            }

            // Fallback: InputEvent insertFromPaste (ใน MAIN world)
            console.log('[TikTok Paste] No DraftJS instance found, trying insertFromPaste...');
            editorEl.focus();
            var dt = new DataTransfer();
            dt.setData('text/plain', text);
            editorEl.dispatchEvent(new InputEvent('beforeinput', {
              bubbles: true, cancelable: true, inputType: 'insertFromPaste', data: null, dataTransfer: dt
            }));
            
            setTimeout(() => {
              var t = editorEl.textContent || '';
              if (t.trim().length > 10) {
                window.__draftPasteResult = { status: 'success', method: 'beforeinput-page' };
              } else {
                window.__draftPasteResult = { status: 'failed', message: 'all methods failed' };
              }
            }, 1000);

          } catch(e) {
            console.error('[TikTok Paste] PAGE ERROR:', e);
            window.__draftPasteResult = { status: 'error', message: e.message };
          }
        },
        args: [captionText]
      }).then(() => {
        sendResponse({ ok: true });
      }).catch(err => {
        console.log('[Background] SIMULATE_PASTE error:', err);
        sendResponse({ ok: false, error: err.message });
      });
      return true; // async sendResponse
    }
    sendResponse({ ok: false, error: 'no tabId or text' });
    return false;
  }

  // ★ RESET_VIDEO_CAPTURE: reset captured video state ก่อน download ใหม่ ★
  else if (message.type === 'RESET_VIDEO_CAPTURE') {
    console.log('[Background] RESET_VIDEO_CAPTURE — clearing old video data');
    capturedVideoBase64 = null;
    capturedVideoSize = 0;
    capturedVideoTime = 0;
    capturedVideoStatus = 'idle';
    pendingVideoDownloadIds.clear();
    // ★ Reset __captured16sBlob ใน MAIN world ด้วย ★
    const resetTabId = sender.tab?.id;
    if (resetTabId) {
      chrome.scripting.executeScript({
        target: { tabId: resetTabId },
        world: 'MAIN',
        func: () => { window.__captured16sBlob = null; console.log('[TikTok Auto INTERCEPT] __captured16sBlob RESET!'); }
      }).catch(() => {});
    }
    sendResponse({ ok: true });
    return false;
  }

  // ★ INJECT_BLOB_INTERCEPT: no-op ★
  else if (message.type === 'INJECT_BLOB_INTERCEPT') {
    sendResponse({ ok: true });
    return false;
  }

  // ★ READ_CAPTURED_BLOB: อ่าน window.__captured16sBlob จาก MAIN world (intercept-blob.js) ★
  else if (message.type === 'READ_CAPTURED_BLOB') {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ status: 'error', message: 'no tab' });
      return false;
    }
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: () => {
        try {
          const cap = window.__captured16sBlob;
          if (!cap) return { status: 'empty' };
          if (cap.status === 'success' && cap.base64) {
            return { status: 'success', base64: cap.base64, size: cap.size, source: cap.source };
          }
          return { status: cap.status || 'unknown' };
        } catch(e) {
          return { status: 'error', message: e.message };
        }
      }
    }).then(results => {
      const res = results?.[0]?.result || { status: 'error', message: 'no result' };
      console.log('[Background] READ_CAPTURED_BLOB result:', res.status, 'size:', res.size || 0);
      // ★ ถ้าได้ video จาก intercept → ส่ง response ตรง ไม่เก็บซ้ำใน SW (ลด memory) ★
      if (res.status === 'success' && res.base64) {
        capturedVideoSize = res.size || 0;
        capturedVideoStatus = 'success';
        capturedVideoTime = Date.now();
        console.log('[Background] ★★★ Got video from intercept-blob! Size:', capturedVideoSize, '(not stored in SW — sent directly)');
      }
      sendResponse(res);
    }).catch(err => {
      console.log('[Background] READ_CAPTURED_BLOB error:', err.message);
      sendResponse({ status: 'error', message: err.message });
    });
    return true; // async
  }

  // ★ FETCH_VIDEO_BLOB: คืน base64 จาก onChanged+offscreen capture ★
  else if (message.type === 'FETCH_VIDEO_BLOB') {
    console.log('[Background] FETCH_VIDEO_BLOB:', capturedVideoStatus, 'size:', capturedVideoSize);

    // ★ download/read ค้าง (ยกเลิก / ล้มเหลวเงียบ) — reset ไม่เช่นนั้น flow จะ poll downloading ไม่รู้จบ ★
    const VIDEO_CAPTURE_STALE_MS = 10 * 60 * 1000;
    if (
      (capturedVideoStatus === 'downloading' || capturedVideoStatus === 'reading') &&
      capturedVideoTime > 0 &&
      Date.now() - capturedVideoTime > VIDEO_CAPTURE_STALE_MS
    ) {
      console.log('[Background] FETCH_VIDEO_BLOB: stale downloading/reading, resetting');
      capturedVideoBase64 = null;
      capturedVideoSize = 0;
      capturedVideoStatus = 'idle';
      capturedVideoTime = 0;
      pendingVideoDownloadIds.clear();
    }

    if (capturedVideoStatus === 'success' && capturedVideoBase64) {
      // ★ BUG #3 FIX: เก็บ base64 แล้ว clear ทุกตัวแปรทันที ป้องกัน SW crash จาก memory เกิน ★
      const b64 = capturedVideoBase64;
      const size = capturedVideoSize;
      capturedVideoBase64 = null;
      capturedVideoSize = 0;
      capturedVideoStatus = 'idle';
      capturedVideoTime = 0;
      console.log('[Background] ✅ Returning captured video base64! Size:', size, '(memory cleared)');
      sendResponse({ status: 'success', base64: b64, size: size });
      return false;
    }
    if (capturedVideoStatus === 'downloading') {
      sendResponse({ status: 'downloading' });
      return false;
    }
    if (capturedVideoStatus === 'reading') {
      sendResponse({ status: 'reading' });
      return false;
    }
    if (capturedVideoStatus === 'error') {
      sendResponse({ status: 'error', message: 'Capture failed' });
      // ★ คืนสถานะ idle หลังแจ้ง error — ไม่เช่นนั้นรอบถัดไปจะค้าง error จนกว่า RESET เท่านั้น ★
      capturedVideoBase64 = null;
      capturedVideoSize = 0;
      capturedVideoStatus = 'idle';
      capturedVideoTime = 0;
      pendingVideoDownloadIds.clear();
      return false;
    }
    sendResponse({ status: 'pending' });
    return false;
  }

  // Handle Google Flow step completion
  else if (message.type === 'FLOW_STEP_COMPLETED') {
    console.log('[Background] Flow step completed:', message.data);
    // Forward to side panel
    chrome.runtime.sendMessage({
      source: 'google-flow',
      type: 'STEP_COMPLETED',
      data: message.data
    }).catch(() => {
      // Side panel might not be open
    });
  }

  // Handle Google Flow error — forward to sidepanel so it can skip to next item
  else if (message.type === 'FLOW_ERROR') {
    console.log('[Background] Flow error:', message.data);
    chrome.runtime.sendMessage({
      source: 'google-flow',
      type: 'STEP_FAILED',
      data: message.data
    }).catch(() => {});
  }
  
  // ★ Handle screenshot request ★
  else if (message.type === 'CAPTURE_SCREENSHOT') {
    console.log('[Background] Screenshot request received');
    (async () => {
      try {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          sendResponse({ success: false, error: 'No active tab' });
          return;
        }
        
        // Capture visible tab as PNG
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
        console.log('[Background] Screenshot captured, size:', dataUrl.length);
        
        // Auto download if requested
        if (message.autoDownload) {
          const filename = message.filename || `screenshot_${Date.now()}.png`;
          await chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: false
          });
          console.log('[Background] Screenshot downloaded:', filename);
        }
        
        sendResponse({ success: true, dataUrl: dataUrl });
      } catch (e) {
        console.error('[Background] Screenshot error:', e);
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true; // Keep channel open for async response
  }

  // ── DEBUGGER_ENSURE_ATTACHED: ให้ debugger attach อยู่ ──
  else if (message.type === 'DEBUGGER_ENSURE_ATTACHED') {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ success: false }); return true; }

    if (_debuggerTabs.has(tabId)) {
      sendResponse({ success: true, alreadyAttached: true });
      return true;
    }

    chrome.debugger.attach({ tabId }, '1.3').then(() => {
      _debuggerTabs.add(tabId);
      console.log('[Background] Debugger attached to tab:', tabId);
      sendResponse({ success: true, alreadyAttached: false });
    }).catch(err => {
      console.log('[Background] Debugger attach error:', err.message);
      if (err.message?.includes('Already attached')) {
        _debuggerTabs.add(tabId);
        sendResponse({ success: true, alreadyAttached: true });
      } else {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  // ── DEBUGGER_DETACH ──
  else if (message.type === 'DEBUGGER_DETACH') {
    const tabId = sender.tab?.id;
    if (tabId && _debuggerTabs.has(tabId)) {
      chrome.debugger.detach({ tabId }).catch(() => {});
      _debuggerTabs.delete(tabId);
    }
    sendResponse({ success: true });
    return true;
  }

  else if (message.type === 'DEBUGGER_CLICK') {
    const { x, y, keepAttached } = message;
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ success: false, error: 'No tab ID' });
      return true;
    }

    (async () => {
      try {
        if (!_debuggerTabs.has(tabId)) {
          await chrome.debugger.attach({ tabId }, '1.3');
          _debuggerTabs.add(tabId);
          await new Promise(r => setTimeout(r, 500));
        }
        console.log('[Background] Debugger CLICK at:', x, y, keepAttached ? '(keepAttached)' : '');

        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
          type: 'mouseMoved', x, y
        });
        await new Promise(r => setTimeout(r, 100));
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
          type: 'mousePressed', x, y, button: 'left', clickCount: 1
        });
        await new Promise(r => setTimeout(r, 50));
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
          type: 'mouseReleased', x, y, button: 'left', clickCount: 1
        });

        console.log('[Background] Debugger click sent at:', x, y);

        // ★ keepAttached: ไม่ detach — ใช้ตอนเปิด calendar แล้วจะคลิก day cell ต่อ ★
        if (!keepAttached) {
          setTimeout(() => {
            chrome.debugger.detach({ tabId }).then(() => _debuggerTabs.delete(tabId)).catch(() => _debuggerTabs.delete(tabId));
          }, 500);
        }

        sendResponse({ success: true });
      } catch (err) {
        console.error('[Background] Debugger click error:', err);
        try { chrome.debugger.detach({ tabId }).catch(() => {}); } catch (e) {}
        _debuggerTabs.delete(tabId);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // ── DEBUGGER_CLICK_SELECTOR: หา element ด้วย JS ใน debugger แล้ว click ที่พิกัดจริง ──
  // วิธีนี้ได้ isTrusted: true + พิกัดหลัง reflow (debug bar อาจ shift layout)
  else if (message.type === 'DEBUGGER_CLICK_SELECTOR') {
    const { jsExpression } = message;
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ success: false, error: 'No tab ID' });
      return true;
    }

    (async () => {
      try {
        const wasAttached = _debuggerTabs.has(tabId);
        if (!wasAttached) {
          try {
            await chrome.debugger.attach({ tabId }, '1.3');
            _debuggerTabs.add(tabId);
            console.log('[Background] DEBUGGER_CLICK_SELECTOR: attached to tab', tabId);
            await new Promise(r => setTimeout(r, 300));
          } catch (attachErr) {
            if (attachErr.message?.includes('Already attached')) {
              _debuggerTabs.add(tabId);
            } else {
              console.log('[Background] DEBUGGER_CLICK_SELECTOR: attach error:', attachErr.message);
              sendResponse({ success: false, error: 'Debugger attach failed: ' + attachErr.message });
              return;
            }
          }
        }

        const expression = `(function() { ${jsExpression} })()`;
        const evalResult = await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
          expression,
          returnByValue: true
        });

        console.log('[Background] DEBUGGER evalResult:', JSON.stringify(evalResult?.result?.type), JSON.stringify(evalResult?.result?.value));

        const coords = evalResult?.result?.value;
        if (coords == null || typeof coords !== 'object' || typeof coords.x !== 'number' || typeof coords.y !== 'number') {
          console.log('[Background] DEBUGGER_CLICK_SELECTOR: no valid coords — element not found');
          sendResponse({ success: false, error: 'Element not found' });
          setTimeout(() => {
            chrome.debugger.detach({ tabId }).then(() => _debuggerTabs.delete(tabId)).catch(() => _debuggerTabs.delete(tabId));
          }, 200);
          return;
        }

        const { x, y } = coords;
        console.log('[Background] DEBUGGER_CLICK_SELECTOR clicking at:', x, y);

        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
          type: 'mouseMoved', x, y
        });
        await new Promise(r => setTimeout(r, 100));
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
          type: 'mousePressed', x, y, button: 'left', clickCount: 1
        });
        await new Promise(r => setTimeout(r, 50));
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
          type: 'mouseReleased', x, y, button: 'left', clickCount: 1
        });

        console.log('[Background] DEBUGGER_CLICK_SELECTOR: click sent at', x, y);

        setTimeout(() => {
          chrome.debugger.detach({ tabId }).then(() => {
            _debuggerTabs.delete(tabId);
          }).catch(() => {
            _debuggerTabs.delete(tabId);
          });
        }, 500);

        sendResponse({ success: true, x, y });
      } catch (err) {
        console.error('[Background] DEBUGGER_CLICK_SELECTOR error:', err);
        try { chrome.debugger.detach({ tabId }).catch(() => {}); } catch (e) {}
        _debuggerTabs.delete(tabId);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // ── EXEC_CLICK_BUTTON: ใช้ chrome.scripting.executeScript inject click ใน MAIN world ──
  else if (message.type === 'EXEC_CLICK_BUTTON') {
    const tabId = sender.tab?.id;
    const btnText = message.text;
    if (!tabId || !btnText) {
      sendResponse({ success: false, error: 'Missing tabId or text' });
      return true;
    }

    chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (text) => {
        // Helper: สร้าง safe synthetic event (non-enumerable HTMLElement refs → ป้องกัน DataCloneError)
        function makeSafeEvent(targetEl, currentTargetEl) {
          const rect = (currentTargetEl || targetEl).getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const evt = Object.create(null);
          evt.type = 'click';
          evt.bubbles = true;
          evt.cancelable = true;
          evt.clientX = x;
          evt.clientY = y;
          evt.screenX = x;
          evt.screenY = y;
          evt.pageX = x + window.scrollX;
          evt.pageY = y + window.scrollY;
          evt.button = 0;
          evt.buttons = 0;
          evt.defaultPrevented = false;
          evt.eventPhase = 3;
          evt.isTrusted = true;
          Object.defineProperties(evt, {
            target: { get: () => targetEl, enumerable: false },
            currentTarget: { get: () => currentTargetEl || targetEl, enumerable: false },
            nativeEvent: { get: () => new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }), enumerable: false },
            preventDefault: { value: function() { evt.defaultPrevented = true; }, enumerable: false },
            stopPropagation: { value: function() {}, enumerable: false },
            isPropagationStopped: { value: function() { return false; }, enumerable: false },
            isDefaultPrevented: { value: function() { return evt.defaultPrevented; }, enumerable: false },
            persist: { value: function() {}, enumerable: false }
          });
          return evt;
        }

        // หาปุ่ม TUXButton จาก label text
        const labels = document.querySelectorAll('.TUXButton-label');
        for (const label of labels) {
          if (label.textContent.trim() !== text) continue;
          const btn = label.closest('button');
          if (!btn || btn.offsetParent === null) continue;

          // Scroll into view
          btn.scrollIntoView({ block: 'center', behavior: 'instant' });

          // วิธี 1: หา __reactProps$ onClick
          const keys = Object.keys(btn);
          for (const key of keys) {
            if (key.startsWith('__reactProps$')) {
              const props = btn[key];
              if (props && typeof props.onClick === 'function') {
                props.onClick(makeSafeEvent(btn, btn));
                return { success: true, method: 'reactProps' };
              }
            }
          }

          // วิธี 2: traverse React fiber tree
          for (const key of keys) {
            if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
              let fiber = btn[key];
              for (let i = 0; i < 20 && fiber; i++) {
                const handler = fiber.memoizedProps?.onClick || fiber.pendingProps?.onClick;
                if (typeof handler === 'function') {
                  handler(makeSafeEvent(btn, btn));
                  return { success: true, method: 'fiberOnClick' };
                }
                fiber = fiber.return;
              }
            }
          }

          // วิธี 3: Full mouse event sequence + .click()
          const rect = btn.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const opts = { bubbles: true, cancelable: true, composed: true, view: window, clientX: cx, clientY: cy, button: 0, buttons: 1 };
          btn.dispatchEvent(new PointerEvent('pointerdown', opts));
          btn.dispatchEvent(new MouseEvent('mousedown', opts));
          btn.focus();
          btn.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
          btn.dispatchEvent(new MouseEvent('mouseup', { ...opts, buttons: 0 }));
          btn.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
          btn.click();
          return { success: true, method: 'dispatchEvents' };
        }
        return { success: false, error: 'Button not found' };
      },
      args: [btnText]
    }).then((results) => {
      const res = results?.[0]?.result;
      console.log('[Background] EXEC_CLICK_BUTTON result:', res);
      sendResponse(res || { success: false });
    }).catch((err) => {
      console.error('[Background] EXEC_CLICK_BUTTON error:', err);
      sendResponse({ success: false, error: err.message });
    });

    return true;
  }

  // ── EXEC_CLICK_RADIO: คลิก product radio ผ่าน chrome.scripting.executeScript MAIN world ──
  else if (message.type === 'EXEC_CLICK_RADIO') {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ success: false, error: 'No tabId' });
      return true;
    }

    chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        // Helper: สร้าง synthetic event ที่ไม่มี HTMLElement โดยตรง (ป้องกัน DataCloneError)
        // ใช้ getter แทน เพื่อให้ React handler เข้าถึง target ได้ แต่ IDB clone ไม่ crash
        function makeSyntheticEvent(type, targetEl, currentTargetEl) {
          const rect = (currentTargetEl || targetEl).getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          // สร้าง plain object ที่มีแค่ primitive values เป็น enumerable
          // HTMLElement references ทั้งหมดเป็น non-enumerable → ป้องกัน DataCloneError จาก IDB
          const evt = Object.create(null);
          // Primitive values (enumerable — safe สำหรับ structured clone)
          evt.type = type;
          evt.bubbles = true;
          evt.cancelable = true;
          evt.clientX = x;
          evt.clientY = y;
          evt.screenX = x;
          evt.screenY = y;
          evt.pageX = x + window.scrollX;
          evt.pageY = y + window.scrollY;
          evt.button = 0;
          evt.buttons = 0;
          evt.defaultPrevented = false;
          evt.eventPhase = 3;
          evt.isTrusted = true;
          // Non-enumerable: HTMLElement references + methods (ไม่ถูก clone โดย IDB)
          Object.defineProperties(evt, {
            target: { get: () => targetEl, enumerable: false },
            currentTarget: { get: () => currentTargetEl || targetEl, enumerable: false },
            nativeEvent: { get: () => new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }), enumerable: false },
            preventDefault: { value: function() { evt.defaultPrevented = true; }, enumerable: false },
            stopPropagation: { value: function() {}, enumerable: false },
            isPropagationStopped: { value: function() { return false; }, enumerable: false },
            isDefaultPrevented: { value: function() { return evt.defaultPrevented; }, enumerable: false },
            persist: { value: function() {}, enumerable: false }
          });
          return evt;
        }

        // หา product radio (ไม่ใช่ postSchedule)
        const radios = document.querySelectorAll('input[type="radio"].TUXRadioStandalone-input');
        let targetRadio = null;
        for (const r of radios) {
          if (r.name !== 'postSchedule' && r.offsetParent !== null) {
            targetRadio = r;
            break;
          }
        }
        if (!targetRadio) return { success: false, error: 'Radio not found' };

        // หา row container — ใช้แค่ row (onClick ของ TikTok อยู่ที่ row)
        const row = targetRadio.closest('tr') || targetRadio.closest('[class*="row"]') || targetRadio.closest('label') || targetRadio.closest('div[class*="product"]');
        // ลำดับ: row ก่อน (มักมี onClick ที่ถูกต้อง) → parent → radio
        const clickTargets = [row, targetRadio.parentElement, targetRadio].filter(Boolean);

        // วิธี 1: __reactProps$ onClick — เรียกแค่ตัวแรกที่เจอแล้วหยุด!
        let handlerCalled = false;
        for (const el of clickTargets) {
          if (handlerCalled) break;
          if (!el) continue;
          for (const key of Object.keys(el)) {
            if (handlerCalled) break;
            if (!key.startsWith('__reactProps$')) continue;
            const props = el[key];
            // เน้น onClick เป็นหลัก (onChange สำหรับ radio ไม่ค่อยใช้)
            if (props?.onClick && typeof props.onClick === 'function') {
              try {
                props.onClick(makeSyntheticEvent('click', targetRadio, el));
                handlerCalled = true;
                console.log('[EXEC_CLICK_RADIO] Called onClick on', el.tagName);
              } catch (e) {
                console.log('[EXEC_CLICK_RADIO] onClick error:', e.message);
              }
            }
          }
        }

        // วิธี 2: ถ้า props ไม่เจอ → ลอง fiber (เรียกแค่ onClick ตัวแรก)
        if (!handlerCalled) {
          for (const el of clickTargets) {
            if (handlerCalled) break;
            if (!el) continue;
            for (const key of Object.keys(el)) {
              if (handlerCalled) break;
              if (!key.startsWith('__reactFiber$') && !key.startsWith('__reactInternalInstance$')) continue;
              let fiber = el[key];
              for (let i = 0; i < 15 && fiber && !handlerCalled; i++) {
                const handler = fiber.memoizedProps?.onClick || fiber.pendingProps?.onClick;
                if (typeof handler === 'function') {
                  try {
                    handler(makeSyntheticEvent('click', targetRadio, el));
                    handlerCalled = true;
                    console.log('[EXEC_CLICK_RADIO] Called fiber onClick at level', i);
                  } catch (e) {}
                }
                fiber = fiber.return;
              }
            }
          }
        }

        // วิธี 3: ถ้ายังไม่สำเร็จ → .click() บน row แล้วก็ radio
        if (!handlerCalled) {
          if (row) row.click();
          targetRadio.click();
          console.log('[EXEC_CLICK_RADIO] Fallback: .click() on row + radio');
        }

        return { success: true, checked: targetRadio.checked, handlerCalled };
      }
    }).then((results) => {
      const res = results?.[0]?.result;
      console.log('[Background] EXEC_CLICK_RADIO result:', res);
      sendResponse(res || { success: false });
    }).catch((err) => {
      console.error('[Background] EXEC_CLICK_RADIO error:', err);
      sendResponse({ success: false, error: err.message });
    });

    return true;
  }

  // ── EXEC_CLICK_DATE_INPUT: คลิก date input ใน MAIN world เพื่อเปิด calendar dropdown ──
  else if (message.type === 'EXEC_CLICK_DATE_INPUT') {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ success: false }); return true; }

    chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        // หา date input
        let dateInput = null;
        const tuxInputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly]');
        for (const inp of tuxInputs) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(inp.value)) { dateInput = inp; break; }
        }
        if (!dateInput) {
          const inputs = document.querySelectorAll('input[readonly]');
          for (const inp of inputs) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(inp.value)) { dateInput = inp; break; }
          }
        }
        if (!dateInput) return { success: false, error: 'Date input not found' };

        console.log('[EXEC_CLICK_DATE_INPUT] Found:', dateInput.value, dateInput.className);

        // หา TUX containers ตาม structure จริง: input → TUXTextInputCore → TUXInputBox → TUXTextField
        const tuxInputBox = dateInput.closest('.TUXInputBox') || dateInput.closest('div[class*="TUXInputBox"]');
        const tuxCore = dateInput.closest('.TUXTextInputCore') || dateInput.parentElement;
        const calIcon = tuxCore?.querySelector('.TUXTextInputCore-leadingIconContainer, [class*="leadingIcon"]');
        const tuxField = dateInput.closest('.TUXTextField') || dateInput.closest('div[class*="TUXTextField"]');
        const clickTargets = [tuxInputBox, calIcon, tuxCore, tuxField, dateInput].filter(Boolean);
        console.log('[EXEC_CLICK_DATE_INPUT] Click targets:', clickTargets.map(e => e.className?.substring(0, 40)));

        // สร้าง synthetic React event
        function makeSyntheticEvent(el) {
          const rect = el.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const evt = Object.create(null);
          evt.type = 'click'; evt.bubbles = true; evt.cancelable = true;
          evt.clientX = x; evt.clientY = y; evt.button = 0; evt.isTrusted = true; evt.defaultPrevented = false;
          Object.defineProperties(evt, {
            target: { get: () => dateInput, enumerable: false },
            currentTarget: { get: () => el, enumerable: false },
            nativeEvent: { get: () => new MouseEvent('click', { bubbles: true }), enumerable: false },
            preventDefault: { value: () => {}, enumerable: false },
            stopPropagation: { value: () => {}, enumerable: false },
            persist: { value: () => {}, enumerable: false }
          });
          return evt;
        }

        // วิธี 1: __reactProps$ onClick/onMouseDown บน TUX containers
        let handlerCalled = false;
        for (const el of clickTargets) {
          if (handlerCalled) break;
          for (const key of Object.keys(el)) {
            if (handlerCalled) break;
            if (!key.startsWith('__reactProps$')) continue;
            const props = el[key];
            const handler = props?.onClick || props?.onMouseDown || props?.onFocus || props?.onPointerDown;
            if (typeof handler === 'function') {
              try {
                handler(makeSyntheticEvent(el));
                handlerCalled = true;
                console.log('[EXEC_CLICK_DATE_INPUT] Called __reactProps$ handler on', el.tagName, el.className?.substring(0, 50));
              } catch (e) {
                console.log('[EXEC_CLICK_DATE_INPUT] Handler error:', e.message);
              }
            }
          }
        }

        // วิธี 2: React fiber traversal — หา onClick/onMouseDown handler จาก fiber tree
        if (!handlerCalled) {
          for (const el of clickTargets) {
            if (handlerCalled) break;
            for (const key of Object.keys(el)) {
              if (!key.startsWith('__reactFiber$') && !key.startsWith('__reactInternalInstance$')) continue;
              let fiber = el[key];
              for (let i = 0; i < 20 && fiber; i++) {
                const props = fiber.memoizedProps || fiber.pendingProps;
                const handler = props?.onClick || props?.onMouseDown || props?.onFocus;
                if (typeof handler === 'function') {
                  try {
                    handler(makeSyntheticEvent(el));
                    handlerCalled = true;
                    console.log('[EXEC_CLICK_DATE_INPUT] Called fiber handler at depth', i, 'on', el.tagName);
                  } catch (e) { console.log('[EXEC_CLICK_DATE_INPUT] Fiber handler error:', e.message); }
                  break;
                }
                fiber = fiber.return;
              }
            }
          }
        }

        // Fallback: full native event sequence on all targets
        if (!handlerCalled) {
          for (const el of clickTargets) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0) continue;
            const opts = { bubbles: true, cancelable: true, view: window, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, button: 0 };
            el.dispatchEvent(new PointerEvent('pointerdown', opts));
            el.dispatchEvent(new MouseEvent('mousedown', opts));
            el.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
            el.dispatchEvent(new PointerEvent('pointerup', opts));
            el.dispatchEvent(new MouseEvent('mouseup', opts));
            el.dispatchEvent(new MouseEvent('click', opts));
            el.click();
          }
          console.log('[EXEC_CLICK_DATE_INPUT] Fallback: native events dispatched on', clickTargets.length, 'targets');
        }

        return { success: true, handlerCalled };
      }
    }).then((results) => {
      const res = results?.[0]?.result;
      console.log('[Background] EXEC_CLICK_DATE_INPUT result:', res);
      sendResponse(res || { success: false });
    }).catch((err) => {
      console.error('[Background] EXEC_CLICK_DATE_INPUT error:', err);
      sendResponse({ success: false, error: err.message });
    });

    return true;
  }

  // ── EXEC_CLICK_DATE_CELL: คลิกวันที่ใน calendar ผ่าน MAIN world ──
  else if (message.type === 'EXEC_CLICK_DATE_CELL') {
    const tabId = sender.tab?.id;
    const targetDay = message.day;
    if (!tabId || !targetDay) { sendResponse({ success: false }); return true; }

    chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (day) => {
        const num = parseInt(day);
        console.log('[EXEC_CLICK_DATE_CELL] Looking for day:', num);

        // ★ หา day cells ใน calendar — ค้นหาหลาย selectors ★
        const allEls = document.querySelectorAll(
          'td, [role="gridcell"], [class*="day-span"], [class*="calendar"] div, [class*="Calendar"] div, [class*="DatePicker"] div, [class*="DatePicker"] td, [class*="DatePicker"] span, [class*="TUXCalendar"] div, [class*="TUXCalendar"] td'
        );

        let targetCell = null;
        const candidates = [];
        for (const el of allEls) {
          const text = (el.textContent || '').trim();
          if (text !== String(num)) continue;
          if (el.childElementCount > 2) continue;
          if (el.offsetParent === null) continue;
          const cls = (el.className || '').toLowerCase();
          if (cls.includes('disabled') || cls.includes('outside') || cls.includes('other') || cls.includes('prev') || cls.includes('next')) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width < 10 || rect.height < 10) continue;
          candidates.push(el);
        }
        console.log('[EXEC_CLICK_DATE_CELL] Found', candidates.length, 'candidates for day', num);
        // Log each candidate for debugging
        candidates.forEach((c, idx) => {
          const r = c.getBoundingClientRect();
          console.log(`[EXEC_CLICK_DATE_CELL] [${idx}] tag:${c.tagName} children:${c.childElementCount} size:${r.width.toFixed(0)}x${r.height.toFixed(0)} class:${(c.className||'').substring(0,60)}`);
        });

        // ★ เรียง candidates: leaf node (childElementCount=0) ก่อน → แล้วเรียงตาม area เล็กสุด (innermost) ★
        candidates.sort((a, b) => {
          // Leaf nodes first
          if (a.childElementCount === 0 && b.childElementCount > 0) return -1;
          if (a.childElementCount > 0 && b.childElementCount === 0) return 1;
          // Then by smallest area (innermost element)
          const aRect = a.getBoundingClientRect();
          const bRect = b.getBoundingClientRect();
          return (aRect.width * aRect.height) - (bRect.width * bRect.height);
        });

        // ★ เลือก candidate ที่มี React onClick handler (ตัวเองหรือ parent) — เริ่มจาก innermost ★
        for (const cell of candidates) {
          let el = cell;
          for (let d = 0; d < 10 && el; d++) {
            for (const key of Object.keys(el)) {
              if (key.startsWith('__reactProps$') && el[key]?.onClick) {
                targetCell = cell;
                break;
              }
            }
            if (targetCell) break;
            el = el.parentElement;
          }
          if (targetCell) break;
        }
        // Fallback: ใช้ innermost candidate (ตัวแรกหลัง sort)
        if (!targetCell && candidates.length > 0) targetCell = candidates[0];

        if (!targetCell) {
          console.log('[EXEC_CLICK_DATE_CELL] Day cell not found:', num);
          return { success: false, error: 'Day not found' };
        }

        console.log('[EXEC_CLICK_DATE_CELL] Found day cell:', targetCell.tagName, targetCell.className?.substring(0, 80));

        // ★ วิธี 1: React __reactProps$ onClick — ไล่ขึ้น parent 10 levels ★
        let handlerCalled = false;
        let el = targetCell;
        for (let depth = 0; depth < 10 && !handlerCalled; depth++) {
          if (!el) break;
          for (const key of Object.keys(el)) {
            if (handlerCalled) break;
            if (!key.startsWith('__reactProps$')) continue;
            const props = el[key];
            if (props?.onClick && typeof props.onClick === 'function') {
              try {
                const rect = targetCell.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                const evt = Object.create(null);
                evt.type = 'click';
                evt.bubbles = true;
                evt.cancelable = true;
                evt.clientX = x;
                evt.clientY = y;
                evt.button = 0;
                evt.isTrusted = true;
                evt.defaultPrevented = false;
                Object.defineProperties(evt, {
                  target: { get: () => targetCell, enumerable: false },
                  currentTarget: { get: () => el, enumerable: false },
                  nativeEvent: { get: () => new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }), enumerable: false },
                  preventDefault: { value: () => { evt.defaultPrevented = true; }, enumerable: false },
                  stopPropagation: { value: () => {}, enumerable: false },
                  isPropagationStopped: { value: () => false, enumerable: false },
                  isDefaultPrevented: { value: () => evt.defaultPrevented, enumerable: false },
                  persist: { value: () => {}, enumerable: false }
                });
                props.onClick(evt);
                handlerCalled = true;
                console.log('[EXEC_CLICK_DATE_CELL] Called React onClick at depth', depth, el.tagName);
              } catch (e) {
                console.log('[EXEC_CLICK_DATE_CELL] onClick error:', e.message);
              }
            }
          }
          el = el.parentElement;
        }

        // ★ วิธี 2: React fiber memoizedProps onClick ★
        if (!handlerCalled) {
          el = targetCell;
          for (let depth = 0; depth < 10 && !handlerCalled; depth++) {
            if (!el) break;
            for (const key of Object.keys(el)) {
              if (handlerCalled) break;
              if (!key.startsWith('__reactFiber$') && !key.startsWith('__reactInternalInstance$')) continue;
              let fiber = el[key];
              for (let fi = 0; fi < 15 && fiber; fi++) {
                const props = fiber.memoizedProps || fiber.pendingProps;
                if (props?.onClick && typeof props.onClick === 'function') {
                  try {
                    const rect = targetCell.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    const evt = Object.create(null);
                    evt.type = 'click';
                    evt.bubbles = true;
                    evt.clientX = x;
                    evt.clientY = y;
                    evt.button = 0;
                    Object.defineProperties(evt, {
                      target: { get: () => targetCell, enumerable: false },
                      currentTarget: { get: () => targetCell, enumerable: false },
                      nativeEvent: { get: () => new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }), enumerable: false },
                      preventDefault: { value: () => {}, enumerable: false },
                      stopPropagation: { value: () => {}, enumerable: false },
                      persist: { value: () => {}, enumerable: false }
                    });
                    props.onClick(evt);
                    handlerCalled = true;
                    console.log('[EXEC_CLICK_DATE_CELL] Called fiber onClick at fiber depth', fi, el.tagName);
                  } catch (e) {
                    console.log('[EXEC_CLICK_DATE_CELL] fiber onClick error:', e.message);
                  }
                  break;
                }
                fiber = fiber.return;
              }
            }
            el = el.parentElement;
          }
        }

        // ★ วิธี 3: Full pointer/mouse event sequence (React 17+ event delegation) ★
        if (!handlerCalled) {
          const rect = targetCell.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const opts = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, screenX: x, screenY: y, button: 0 };
          targetCell.dispatchEvent(new PointerEvent('pointerdown', { ...opts, buttons: 1 }));
          targetCell.dispatchEvent(new MouseEvent('mousedown', { ...opts, buttons: 1 }));
          targetCell.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
          targetCell.dispatchEvent(new MouseEvent('mouseup', { ...opts, buttons: 0 }));
          targetCell.dispatchEvent(new PointerEvent('click', { ...opts, buttons: 0 }));
          targetCell.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
          targetCell.click();
          console.log('[EXEC_CLICK_DATE_CELL] Dispatched full event sequence at', x.toFixed(0), y.toFixed(0));
        }

        return { success: true, day: num, handlerCalled };
      },
      args: [targetDay]
    }).then((results) => {
      const res = results?.[0]?.result;
      console.log('[Background] EXEC_CLICK_DATE_CELL result:', res);
      sendResponse(res || { success: false });
    }).catch((err) => {
      console.error('[Background] EXEC_CLICK_DATE_CELL error:', err);
      sendResponse({ success: false, error: err.message });
    });

    return true;
  }

  // ── DEBUGGER_SET_DATE: เปิด calendar + คลิกวันที่ ใน debugger session เดียว ──
  // ★ v3.14: Complete rewrite — layout-shift handling, broad portal search, keyboard fallback ★
  else if (message.type === 'DEBUGGER_SET_DATE') {
    const tabId = sender.tab?.id;
    const targetDay = message.day;
    if (!tabId || !targetDay) { sendResponse({ success: false, error: 'Missing tabId or day' }); return true; }

    (async () => {
      try {
        // Step 0: Attach debugger
        if (!_debuggerTabs.has(tabId)) {
          try {
            await chrome.debugger.attach({ tabId }, '1.3');
            _debuggerTabs.add(tabId);
            console.log('[DEBUGGER_SET_DATE] Attached to tab', tabId);
          } catch (attachErr) {
            if (attachErr.message?.includes('Already attached')) {
              _debuggerTabs.add(tabId);
            } else {
              sendResponse({ success: false, error: 'Attach failed: ' + attachErr.message });
              return;
            }
          }
        }

        // Wait for debugger bar + layout shift to stabilize
        await new Promise(r => setTimeout(r, 800));

        // Step 1: Find date input coordinates AFTER debugger attached (layout may have shifted)
        const findJS = `(function() {
          const inputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly], input[readonly]');
          for (const inp of inputs) {
            if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(inp.value)) continue;
            const r = inp.getBoundingClientRect();
            if (r.width === 0) continue;
            const box = inp.closest('.TUXInputBox') || inp.closest('div[class*="InputBox"]') || inp.parentElement?.parentElement;
            const icon = inp.parentElement?.querySelector('[class*="leadingIcon"], [class*="Icon"], svg');
            const field = inp.closest('.TUXTextField') || inp.closest('div[class*="TextField"]');
            const targets = [];
            if (icon) { const ir = icon.getBoundingClientRect(); if (ir.width > 3) targets.push({ x: Math.round(ir.left + ir.width/2), y: Math.round(ir.top + ir.height/2), label: 'icon' }); }
            if (box) { const br = box.getBoundingClientRect(); if (br.width > 10) targets.push({ x: Math.round(br.left + br.width/2), y: Math.round(br.top + br.height/2), label: 'box' }); }
            targets.push({ x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2), label: 'input' });
            targets.push({ x: Math.round(r.right - 15), y: Math.round(r.top + r.height/2), label: 'arrow' });
            targets.push({ x: Math.round(r.left + 15), y: Math.round(r.top + r.height/2), label: 'left' });
            if (field) { const fr = field.getBoundingClientRect(); if (fr.width > 10) targets.push({ x: Math.round(fr.left + fr.width/2), y: Math.round(fr.top + fr.height/2), label: 'field' }); }
            console.log('[DEBUGGER_SET_DATE] Date input:', inp.value, 'targets:', targets.length);
            return { targets, value: inp.value };
          }
          return null;
        })()`;

        const findResult = await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
          expression: findJS, returnByValue: true
        });
        const dateInfo = findResult?.result?.value;
        if (!dateInfo?.targets?.length) {
          sendResponse({ success: false, error: 'Date input not found' });
          setTimeout(() => { chrome.debugger.detach({ tabId }).catch(() => {}); _debuggerTabs.delete(tabId); }, 200);
          return;
        }

        // Calendar search function (reusable)
        const searchCalendarJS = `(function() {
          const num = ${parseInt(targetDay)};
          // Search for calendar containers — including React portals at body root
          const calSelectors = [
            '[class*="picker-dropdown"]', '[class*="PickerPanel"]', '[class*="picker-panel"]',
            '[class*="DatePicker"]', '[class*="datepicker"]', '[class*="calendar"]', '[class*="Calendar"]',
            '[class*="TUXCalendar"]', '[class*="TUXDatePicker"]', '[role="grid"]', '[role="dialog"]',
            'table', '[class*="popup"]', '[class*="Popup"]', '[class*="dropdown"]', '[class*="Dropdown"]',
            '[class*="floating"]', '[class*="Floating"]', '[class*="overlay"]', '[class*="portal"]', '[class*="Portal"]'
          ];
          let calContainer = null;
          for (const sel of calSelectors) {
            const els = document.querySelectorAll(sel);
            for (const el of els) {
              if (el.offsetParent === null) continue;
              const r = el.getBoundingClientRect();
              if (r.width < 100 || r.height < 80) continue;
              const text = el.textContent || '';
              if (/\\b(1[0-9]|2[0-9]|30|31|[1-9])\\b/.test(text)) { calContainer = el; break; }
            }
            if (calContainer) break;
          }
          // Check last children of body (React portals)
          if (!calContainer) {
            const bodyKids = [...document.body.children].reverse().slice(0, 15);
            for (const child of bodyKids) {
              if (child.offsetParent === null && child.style?.display !== 'none') continue;
              const r = child.getBoundingClientRect();
              if (r.width < 80 || r.height < 60) continue;
              const style = window.getComputedStyle(child);
              if (style.position === 'absolute' || style.position === 'fixed' || parseInt(style.zIndex) > 50) {
                const text = child.textContent || '';
                if (/\\b(1[0-9]|2[0-9]|30|31|[1-9])\\b/.test(text)) {
                  calContainer = child;
                  console.log('[DEBUGGER_SET_DATE] Found in body portal:', child.tagName, (child.className||'').substring(0, 60));
                  break;
                }
              }
            }
          }
          if (!calContainer) {
            // Diagnostic
            const highZ = [];
            document.querySelectorAll('*').forEach(el => {
              const s = window.getComputedStyle(el);
              const z = parseInt(s.zIndex);
              if ((z > 50 || s.position === 'fixed') && el.offsetParent !== null) {
                const r = el.getBoundingClientRect();
                if (r.width > 50 && r.height > 50) highZ.push((el.className||'').substring(0,50) + ' z:' + z + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
              }
            });
            console.log('[DEBUGGER_SET_DATE] No calendar. High-z elements:', highZ.slice(0, 8));
            return null;
          }
          console.log('[DEBUGGER_SET_DATE] Calendar found:', calContainer.tagName, (calContainer.className||'').substring(0, 80));
          // Find day cell
          const cells = calContainer.querySelectorAll('td, button, div, span, [role="gridcell"]');
          const cands = [];
          for (const cell of cells) {
            const text = (cell.textContent || '').trim();
            if (text !== String(num)) continue;
            if (cell.childElementCount > 3) continue;
            const cls = (cell.className || '').toLowerCase();
            if (cls.includes('disabled') || cls.includes('outside') || cls.includes('prev-month') || cls.includes('next-month')) continue;
            const r = cell.getBoundingClientRect();
            if (r.width < 8 || r.height < 8) continue;
            cands.push({ x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2), children: cell.childElementCount, area: r.width * r.height, tag: cell.tagName, cls: (cell.className||'').substring(0, 50) });
          }
          cands.sort((a, b) => { if (a.children === 0 && b.children > 0) return -1; if (a.children > 0 && b.children === 0) return 1; return a.area - b.area; });
          console.log('[DEBUGGER_SET_DATE] Day', num, 'candidates:', cands.length);
          cands.forEach((c, i) => console.log('[DEBUGGER_SET_DATE]', i, c.tag, c.cls, c.x, c.y));
          return cands.length > 0 ? { x: cands[0].x, y: cands[0].y } : null;
        })()`;

        // Step 2: Try clicking each target until calendar opens
        let dayCoords = null;
        for (let attempt = 0; attempt < dateInfo.targets.length && !dayCoords; attempt++) {
          const target = dateInfo.targets[attempt];
          console.log('[DEBUGGER_SET_DATE] Click', target.label, 'at', target.x, target.y, '(attempt', attempt + 1, ')');

          await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y });
          await new Promise(r => setTimeout(r, 150));
          await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1 });
          await new Promise(r => setTimeout(r, 100));
          await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1 });

          await new Promise(r => setTimeout(r, 2500));

          const searchResult = await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
            expression: searchCalendarJS, returnByValue: true
          });
          dayCoords = searchResult?.result?.value;

          if (!dayCoords) {
            console.log('[DEBUGGER_SET_DATE] Calendar not found after click on', target.label, '- closing & retrying...');
            await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', { expression: 'document.body.click()' });
            await new Promise(r => setTimeout(r, 600));
          }
        }

        // Step 2b: Keyboard fallback — focus input + ArrowDown/Space/Enter
        if (!dayCoords) {
          console.log('[DEBUGGER_SET_DATE] Trying keyboard approach...');
          await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
            expression: `(function() { const inputs = document.querySelectorAll('input[readonly]'); for (const inp of inputs) { if (/^\\d{4}-\\d{2}-\\d{2}$/.test(inp.value)) { inp.focus(); return true; } } return false; })()`
          });
          await new Promise(r => setTimeout(r, 300));

          const keys = [
            { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
            { key: ' ', code: 'Space', keyCode: 32 },
            { key: 'Enter', code: 'Enter', keyCode: 13 }
          ];
          for (const ki of keys) {
            if (dayCoords) break;
            await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
              type: 'keyDown', key: ki.key, code: ki.code,
              windowsVirtualKeyCode: ki.keyCode, nativeVirtualKeyCode: ki.keyCode
            });
            await new Promise(r => setTimeout(r, 50));
            await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
              type: 'keyUp', key: ki.key, code: ki.code,
              windowsVirtualKeyCode: ki.keyCode, nativeVirtualKeyCode: ki.keyCode
            });
            await new Promise(r => setTimeout(r, 2000));
            const sr = await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
              expression: searchCalendarJS, returnByValue: true
            });
            dayCoords = sr?.result?.value;
            if (dayCoords) console.log('[DEBUGGER_SET_DATE] Calendar opened via key:', ki.key);
          }
        }

        if (!dayCoords) {
          console.log('[DEBUGGER_SET_DATE] Calendar could not be opened');
          setTimeout(() => { chrome.debugger.detach({ tabId }).catch(() => {}); _debuggerTabs.delete(tabId); }, 200);
          sendResponse({ success: false, error: 'Calendar not opened' });
          return;
        }

        // Step 3: Click day cell with trusted event
        console.log('[DEBUGGER_SET_DATE] Clicking day at', dayCoords.x, dayCoords.y);
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: dayCoords.x, y: dayCoords.y });
        await new Promise(r => setTimeout(r, 100));
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { type: 'mousePressed', x: dayCoords.x, y: dayCoords.y, button: 'left', clickCount: 1 });
        await new Promise(r => setTimeout(r, 80));
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: dayCoords.x, y: dayCoords.y, button: 'left', clickCount: 1 });

        await new Promise(r => setTimeout(r, 1000));

        // Step 4: Verify date changed
        const verifyResult = await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
          expression: `(function() { const inputs = document.querySelectorAll('input[readonly]'); for (const inp of inputs) { if (/^\\d{4}-\\d{2}-\\d{2}$/.test(inp.value)) return inp.value; } return null; })()`,
          returnByValue: true
        });
        const newValue = verifyResult?.result?.value;
        console.log('[DEBUGGER_SET_DATE] Date after click:', newValue);

        setTimeout(() => { chrome.debugger.detach({ tabId }).then(() => _debuggerTabs.delete(tabId)).catch(() => _debuggerTabs.delete(tabId)); }, 500);

        sendResponse({ success: true, newValue, x: dayCoords.x, y: dayCoords.y });
      } catch (err) {
        console.error('[DEBUGGER_SET_DATE] Error:', err);
        try { chrome.debugger.detach({ tabId }).catch(() => {}); } catch (e) {}
        _debuggerTabs.delete(tabId);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  return false; // default: ไม่ handle message นี้
});

// Inject content script when navigating to TikTok
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('tiktok.com')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['js/content.js']
    }).catch(err => {
      // Script might already be injected or page doesn't allow injection
      console.log('Content script injection:', err.message);
    });
  }
});
