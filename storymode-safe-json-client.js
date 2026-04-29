/**
 * Story Config Mock — API/fetch ที่คืน HTML หรือข้อความแทน JSON
 *
 * ห้ามไปซ้ำ JSON.parse / response.json() + catch ในแต่ละปุ่ม — ใช้ window.StorymodeSafeJson เท่านั้น
 * (รวมข้อความภาษาไทยให้ผู้ใช้ปลายทางด้วย ไม่ต้องไล่แก้ catch ทีละที่)
 */
(function (global) {
  'use strict';

  var RX_JSONISH =
    /unexpected token|not valid json|is not valid json|json\.parse|position\s+at|expected json/i;

  /**
   * @param {string} text
   * @returns {{ ok: true, value: unknown } | { ok: false, snippet: string }}
   */
  function parseLenient(text) {
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch (_) {
      return {
        ok: false,
        snippet: String(text || '').replace(/\s+/g, ' ').slice(0, 160),
      };
    }
  }

  /**
   * แปลง error message จาก engine (SyntaxError / .json()) เป็นข้อความที่อ่านได้
   * @param {unknown} msg
   * @returns {string}
   */
  function friendlyErrorMessage(msg) {
    var s = String(msg == null ? '' : msg);
    if (RX_JSONISH.test(s)) {
      return (
        'ตอบกลับไม่ใช่ JSON (มักเป็นหน้า error ของโฮสต์หรือ proxy) — ' +
        'ลองใหม่หรือดูแท็บ Network (เช่น /api/tiktok-share-fetch /api/gemini /api/mall-mode)'
      );
    }
    return s;
  }

  global.StorymodeSafeJson = {
    parseLenient: parseLenient,
    friendlyErrorMessage: friendlyErrorMessage,
  };
})(typeof window !== 'undefined' ? window : globalThis);
