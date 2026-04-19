// Firebase Configuration for License System
// ★ Config ถูกเข้ารหัสเพื่อป้องกันการอ่าน plaintext ★

(function () {
  // ── Decode helper ──
  var _k = [0x1c, 0x3a, 0x57, 0x8e, 0x2b, 0x6d, 0x44, 0xf1, 0x19, 0x73, 0xa5, 0x3c, 0x88, 0x5f, 0x21, 0xc7];

  function _d(encoded) {
    try {
      var raw = atob(encoded);
      var result = '';
      for (var i = 0; i < raw.length; i++) {
        result += String.fromCharCode(raw.charCodeAt(i) ^ _k[i % _k.length]);
      }
      return result;
    } catch (e) { return ''; }
  }

  // ── Encoded config values ──
  // These are XOR-encoded then base64'd to prevent plaintext scraping
  var _c = {
    a: 'XXMt73gUBaQrAO1/0SZi/nZuHcNcWXW5YzD9Ct0MQIlqWS+4ZigJ',
    b: 'c1Qy7UcEJ5o0EsFR4TEM9SwIYaMTWXWQIV3DVfo6Q6ZvXzb+W0MnnnQ=',
    c: 'dE4j/lhXa952HcBf5DZCrDFbM+NCA2nDKUGTEbBrEKYkFzPrTQwxnW1e10jsPQ+mb1M2o1gCMYVxFsRP/G4PoXVIMuxKHiGVeAfEXuksROl9Sic=',
    d: 'c1Qy7UcEJ5o0EsFR4TEM9SwIYaMTWXWQIQ==',
    e: 'c1Qy7UcEJ5o0EsFR4TEM9SwIYaMTWXWQIV3DVfo6Q6ZvXyT6RB8llnxdxEz4',
    f: 'KwNiuRNUfcAvRJEM',
    g: 'LQBgtx5afMggQpMLvG8bsHlYbetPCXPELUGUWu1nRfUrX2W6H1QlwCg=',
    h: 'WxcQ3W0vDsReO5du',
  };

  // ── Build config object ──
  window.FIREBASE_CONFIG = {
    apiKey: _d(_c.a),
    authDomain: _d(_c.b),
    databaseURL: _d(_c.c),
    projectId: _d(_c.d),
    storageBucket: _d(_c.e),
    messagingSenderId: _d(_c.f),
    appId: _d(_c.g),
    measurementId: _d(_c.h),
  };

  window.FIREBASE_DB_URL = window.FIREBASE_CONFIG.databaseURL;

})();

// Export for Node.js (build tools)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIREBASE_CONFIG: typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG : {}, FIREBASE_DB_URL: typeof FIREBASE_DB_URL !== 'undefined' ? FIREBASE_DB_URL : '' };
}
