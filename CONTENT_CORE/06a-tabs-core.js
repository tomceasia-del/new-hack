/**
 * 06a-tabs-core.js — Feature Tabs & Core UI Copy
 * ================================================
 * Split จาก 06-ui-copy.js (lines 1–55)
 * เนื้อหา: FEATURE_TABS, UI_COPY
 */

// ==================== Feature Tabs (แท็บหลัก) ====================
export const FEATURE_TABS = [
  { id: 'auto_post',   label: 'Auto Post',   icon: '🚀', desc: 'โพสต์อัตโนมัติทุกแพลตฟอร์ม' },
  { id: 'storymode',   label: 'Storymode',   icon: '🎬', desc: 'สร้างวิดีโอแบบเล่าเรื่อง' },
  { id: 'studio',      label: 'Studio',      icon: '🎨', desc: 'สร้าง image/video prompt' },
  { id: 'platform',    label: 'Platform',    icon: '📤', desc: 'ตั้งค่าการโพสต์รายแพลตฟอร์ม' },
  { id: 'templates',   label: 'Templates',   icon: '📋', desc: 'เทมเพลตสำเร็จรูป' },
  { id: 'dashboard',   label: 'Dashboard',   icon: '📊', desc: 'สถิติและประวัติการโพสต์' },
  { id: 'settings',    label: 'Settings',    icon: '⚙️',  desc: 'ตั้งค่า API และการใช้งาน' },
];

// ==================== UI Copy (Core) ====================
export const UI_COPY = {
  // License screen
  license: {
    title: 'เปิดใช้งาน License',
    placeholder: 'กรอก License Key ที่ได้รับ...',
    deviceId: 'DEVICE ID ของคุณ',
    multiDevice: '1 License Key สามารถใช้งานได้พร้อมกัน 4 อุปกรณ์',
    activateBtn: 'เปิดใช้งาน',
    manageBtn: 'จัดการอุปกรณ์ที่ลงทะเบียน',
    noKey: 'ต้องการ License Key? ติดต่อผู้ดูแลระบบ',
  },

  // Status messages (จาก content.js / content-tiktok-platform.js)
  status: {
    scraping: '⏳ TikTok Scraper — กำลังดึงข้อมูล...',
    uploading: '📤 กำลังอัพโหลด Video...',
    captioning: '📝 กำลังใส่ Caption...',
    basket: '🛒 กำลังปักตะกร้า...',
    waiting: '⏳ รอหน้า Upload โหลด...',
    notReady: '⚠️ หน้า Upload ไม่พร้อม',
    generating: '⏳ รอรูป Generate เสร็จ (สูงสุด 2.5 นาที)...',
    rateLimit: '⚠️ All Gemini models rate limited — กรุณารอสักครู่แล้วลองใหม่',
    policyRetry: '🔄 Policy Retry — กด Generate ใหม่...',
  },

  // Activity log types
  logTypes: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  },
};
