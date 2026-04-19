// ★ intercept-blob.js — inject ก่อน Google Flow load (world:MAIN, document_start) ★
// Override URL.createObjectURL เพื่อจับ video blob ขนาดใหญ่ (>1MB) แปลง base64 ทันที
// ผลลัพธ์เก็บใน window.__captured16sBlob

(function() {
  'use strict';

  if (window.__blobInterceptInstalled) return;
  window.__blobInterceptInstalled = true;
  window.__captured16sBlob = null;

  console.log('[TikTok Auto INTERCEPT] ★ Installing blob intercept at document_start...');

  // ★ Helper: จับ blob แปลง base64 ★
  function captureBlob(blob, source) {
    if (window.__captured16sBlob && window.__captured16sBlob.status === 'success') {
      console.log('[TikTok Auto INTERCEPT] Already captured, skip from:', source);
      return;
    }
    console.log('[TikTok Auto INTERCEPT] ★★★ CAPTURING blob from [' + source + '] Size:', blob.size, 'Type:', blob.type);
    window.__captured16sBlob = { status: 'converting', size: blob.size, source: source };
    var reader = new FileReader();
    reader.onloadend = function() {
      window.__captured16sBlob = {
        status: 'success',
        base64: reader.result,
        size: blob.size,
        type: blob.type,
        source: source,
        capturedAt: Date.now()
      };
      console.log('[TikTok Auto INTERCEPT] ★★★ Video base64 READY from [' + source + ']! Size:', blob.size, 'base64 len:', reader.result.length);
    };
    reader.onerror = function() {
      window.__captured16sBlob = { status: 'error', message: 'FileReader error from ' + source };
      console.log('[TikTok Auto INTERCEPT] ❌ FileReader error from:', source);
    };
    reader.readAsDataURL(blob);
  }

  function isVideoBlob(blob) {
    if (!blob || blob.size < 1000000) return false;
    var t = (blob.type || '').toLowerCase();
    return t.includes('video') || t.includes('octet-stream') || t === '';
  }

  // ═══════════════════════════════════════════
  // ★ 1. Override URL.createObjectURL ★
  // ═══════════════════════════════════════════
  var blobUrlMap = {};
  var origCreateObjectURL = URL.createObjectURL;
  URL.createObjectURL = function(obj) {
    var url = origCreateObjectURL.call(URL, obj);
    try {
      if (obj && typeof obj.size === 'number') {
        console.log('[TikTok Auto INTERCEPT] [createObjectURL] type:', obj.type, 'size:', obj.size);
        blobUrlMap[url] = obj;
        if (isVideoBlob(obj)) {
          captureBlob(obj, 'createObjectURL');
        }
      }
    } catch(e) {}
    return url;
  };

  // ═══════════════════════════════════════════
  // ★ 2. Override URL.revokeObjectURL — ชะลอ revoke 30 วิ ★
  // ═══════════════════════════════════════════
  var origRevokeObjectURL = URL.revokeObjectURL;
  URL.revokeObjectURL = function(url) {
    try {
      console.log('[TikTok Auto INTERCEPT] [revokeObjectURL] url:', (url || '').substring(0, 50));
      // ชะลอ revoke 30 วินาที
      setTimeout(function() {
        origRevokeObjectURL.call(URL, url);
        delete blobUrlMap[url];
      }, 30000);
    } catch(e) {
      origRevokeObjectURL.call(URL, url);
    }
  };

  // ═══════════════════════════════════════════
  // ★ 3. Override HTMLAnchorElement.click — จับ blob จาก blobUrlMap ★
  // ═══════════════════════════════════════════
  var origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function() {
    try {
      var href = this.href || '';
      if (href.indexOf('blob:') === 0) {
        console.log('[TikTok Auto INTERCEPT] [<a>.click()] href:', href.substring(0, 60), 'download:', this.download);
        if (!window.__captured16sBlob || window.__captured16sBlob.status !== 'success') {
          var cachedBlob = blobUrlMap[href];
          if (cachedBlob && isVideoBlob(cachedBlob)) {
            console.log('[TikTok Auto INTERCEPT] [<a>.click()] Got blob from map! Size:', cachedBlob.size);
            captureBlob(cachedBlob, '<a>.click() map');
          }
        }
      }
    } catch(e) {}
    return origClick.call(this);
  };

  // ═══════════════════════════════════════════
  // ★ 4. Override fetch — จับ video response ★
  // ═══════════════════════════════════════════
  var origFetch = window.fetch;
  window.fetch = function() {
    var args = arguments;
    var url = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url) || '';
    return origFetch.apply(this, args).then(function(response) {
      try {
        var ct = (response.headers && response.headers.get('content-type') || '').toLowerCase();
        var cl = parseInt(response.headers && response.headers.get('content-length') || '0');
        if ((ct.indexOf('video') >= 0 || ct.indexOf('octet-stream') >= 0) && cl > 1000000) {
          console.log('[TikTok Auto INTERCEPT] [fetch] Video response! url:', url.substring(0, 80), 'size:', cl);
          var cloned = response.clone();
          cloned.blob().then(function(blob) {
            if (isVideoBlob(blob)) captureBlob(blob, 'fetch response');
          }).catch(function() {});
        }
        if (url.indexOf('getMediaUrlRedirect') >= 0) {
          console.log('[TikTok Auto INTERCEPT] [fetch] MediaUrlRedirect detected:', url.substring(0, 80));
          var cloned2 = response.clone();
          cloned2.blob().then(function(blob) {
            if (blob.size > 1000000) captureBlob(blob, 'fetch MediaUrlRedirect');
          }).catch(function() {});
        }
      } catch(e) {}
      return response;
    });
  };

  console.log('[TikTok Auto INTERCEPT] ★ Blob intercept installed at document_start! Monitoring: createObjectURL, revokeObjectURL, <a>.click(), fetch()');
})();
