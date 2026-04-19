/**
 * 06d-status-confirm.js — Product/Batch Status & Confirm Dialogs
 * ==============================================================
 * Split จาก 06-ui-copy.js (lines 326–353)
 * เนื้อหา: PRODUCT_STATUS, BATCH_STATUS, CONFIRM_COPY
 */

// ==================== Product Status Constants ====================
// (from sidepanel.js lines 975–984)
export const PRODUCT_STATUS = {
  pending:    'รอดำเนินการ',
  analyzing:  'กำลังวิเคราะห์',
  creating:   'กำลังสร้าง',
  inProgress: '🔄 กำลังทำ',
  done:       'เสร็จสิ้น',
  success:    '✅ สำเร็จ',
  failed:     '❌ ล้มเหลว',
  skipped:    '⏭️ ข้าม',
  error:      'ผิดพลาด',
};

// ==================== Batch Status Map ====================
// (lines 4604–4606)
export const BATCH_STATUS = {
  pending:    'รอดำเนินการ',
  inProgress: 'กำลังดำเนินการ',
  success:    'สำเร็จ',
};


// ==================== Confirm Dialog Copy ====================
export const CONFIRM_COPY = {
  deleteAllProducts:    'ต้องการลบสินค้าทั้งหมด … รายการ?',   // line 3351
  resetStats:           'รีเซ็ตสถิติทั้งหมด?',                  // line 13224
  deleteTemplate:       'ลบ Template นี้?',                      // line 13341
  deleteAllV2:          'ลบสินค้าทั้งหมดใน V2?',                // line 14153
};
