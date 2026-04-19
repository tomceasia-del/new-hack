// offscreen.js — อ่านไฟล์ video ที่ download เสร็จแล้ว แปลง base64 ส่งกลับ background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;
  if (message.type === 'READ_FILE_AS_BASE64') {
    const filePath = message.filePath;
    console.log('[Offscreen] Reading file:', filePath);

    // สร้าง file:// URL จาก local path
    // Windows path: C:\Users\...\file.mp4 → file:///C:/Users/.../file.mp4
    let fileUrl = filePath;
    if (!fileUrl.startsWith('file://')) {
      fileUrl = 'file:///' + fileUrl.replace(/\\/g, '/');
    }
    console.log('[Offscreen] File URL:', fileUrl);

    const xhr = new XMLHttpRequest();
    xhr.open('GET', fileUrl, true);
    xhr.responseType = 'blob';

    xhr.onload = function() {
      if (xhr.status === 0 || xhr.status === 200) {
        const blob = xhr.response;
        console.log('[Offscreen] File loaded! Size:', blob.size, 'Type:', blob.type);

        if (blob.size < 100000) {
          sendResponse({ status: 'error', message: 'File too small: ' + blob.size });
          return;
        }

        const reader = new FileReader();
        reader.onloadend = function() {
          console.log('[Offscreen] Base64 ready! Length:', reader.result.length);
          sendResponse({
            status: 'success',
            base64: reader.result,
            size: blob.size,
            type: blob.type
          });
        };
        reader.onerror = function() {
          console.log('[Offscreen] FileReader error');
          sendResponse({ status: 'error', message: 'FileReader error' });
        };
        reader.readAsDataURL(blob);
      } else {
        console.log('[Offscreen] XHR error status:', xhr.status);
        sendResponse({ status: 'error', message: 'XHR status ' + xhr.status });
      }
    };

    xhr.onerror = function() {
      console.log('[Offscreen] XHR network error for:', fileUrl);
      sendResponse({ status: 'error', message: 'XHR network error' });
    };

    xhr.send();
    return true; // async sendResponse
  }
});

console.log('[Offscreen] Offscreen document ready');
