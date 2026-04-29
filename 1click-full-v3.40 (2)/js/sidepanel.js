import { STYLE_OPTIONS, ADAPTIVE_VIDEO_DIRECTOR_PROMPT, MOOD_KEYWORDS, HOOK_LIBRARY, HOOK_CATEGORIES, VISUAL_STYLES } from './promptTemplate.js';
import { getMoodDirective, formatNarrativePromptsForMessage } from './storymodePromptEnrich.js';
import {
  screenChatMessages,
  applyLocalScreenToGeminiRequestBody,
  screenProductAnalysisObject,
  screenPromptForOutbound,
  stripHardBannedPhrases
} from './prompt-screening.js';

// ══════════════════════════════════════════════════════════════
// HOOK MASTER: สร้าง prompt section จาก HOOK_LIBRARY
// ══════════════════════════════════════════════════════════════
// TODO: USER_PROMPT
function buildHookMasterPrompt(overrideCat, usedHookIds) {
  return '';
}

// TODO: USER_PROMPT
const HOOK_MASTER_SECTION = '';

// TODO: USER_PROMPT
function getEnhancedPrompt(overrideHookCat, usedHookIds) {
  return '';
}

// ==================== License System ====================
let isLicenseValid = false;

// DEV MODE: Set to true to skip license check during development
const DEV_MODE = false;

// Initialize License Check on page load
document.addEventListener('DOMContentLoaded', initLicenseSystem);

async function initLicenseSystem() {
  console.log('[License] Initializing license system...');
  
  // DEV MODE: Skip license check
  if (DEV_MODE) {
    console.log('[License] DEV MODE - Skipping license check');
    isLicenseValid = true;
    showMainApp();
    return;
  }
  
  const licenseScreen = document.getElementById('license-screen');
  const mainApp = document.getElementById('main-app');
  const activateBtn = document.getElementById('activate-license-btn');
  const licenseInput = document.getElementById('license-key-input');
  
  // Display Device ID on login screen
  const deviceIdDisplay = document.getElementById('display-device-id');
  if (deviceIdDisplay) {
    try {
      const deviceId = await licenseService.getDeviceId();
      deviceIdDisplay.textContent = deviceId.substring(0, 25) + '...';
    } catch (e) {
      deviceIdDisplay.textContent = 'ไม่สามารถโหลดได้';
    }
  }
  
  // Auto-format license key input (XXXX-XXXX-XXXX-XXXX)
  if (licenseInput) {
    licenseInput.addEventListener('input', (e) => {
      formatLicenseInput(e);
      // ★ แสดง/ซ่อนปุ่มจัดการอุปกรณ์ เมื่อกรอก license key ครบ 19 ตัว ★
      const manageBtn = document.getElementById('manage-devices-login-btn');
      if (manageBtn) {
        manageBtn.style.display = e.target.value.length >= 19 ? 'block' : 'none';
      }
      // ซ่อน device list เมื่อเปลี่ยน key
      const deviceList = document.getElementById('login-device-list');
      if (deviceList) deviceList.style.display = 'none';
    });
  }
  
  // Activate button click
  if (activateBtn) {
    activateBtn.addEventListener('click', handleActivateLicense);
  }
  
  // ★ Manage devices from license login screen ★
  const manageDevicesBtn = document.getElementById('manage-devices-login-btn');
  if (manageDevicesBtn) {
    manageDevicesBtn.addEventListener('click', handleManageDevicesFromLogin);
  }
  
  // Check devices button
  const checkDevicesBtn = document.getElementById('check-devices-btn');
  if (checkDevicesBtn) {
    checkDevicesBtn.addEventListener('click', checkDevices);
  }
  
  // Enter key to activate
  if (licenseInput) {
    licenseInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleActivateLicense();
    });
  }
  
  // Check if already licensed
  try {
    const result = await licenseService.loadLocalLicense();
    
    if (result.success) {
      console.log('[License] Valid license found!');
      isLicenseValid = true;
      showMainApp();
    } else {
      console.log('[License] No valid license:', result.error);
      showLicenseScreen();
    }
  } catch (e) {
    console.error('[License] Error checking license:', e);
    showLicenseScreen();
  }
}

function formatLicenseInput(e) {
  let value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  let formatted = '';
  
  for (let i = 0; i < value.length && i < 16; i++) {
    if (i > 0 && i % 4 === 0) {
      formatted += '-';
    }
    formatted += value[i];
  }
  
  e.target.value = formatted;
}

async function handleActivateLicense() {
  const licenseInput = document.getElementById('license-key-input');
  const activateBtn = document.getElementById('activate-license-btn');
  const btnText = activateBtn?.querySelector('.license-btn-text');
  const btnLoading = activateBtn?.querySelector('.license-btn-loading');
  
  const licenseKey = licenseInput?.value?.trim();
  
  if (!licenseKey) {
    showLicenseError('กรุณาใส่ License Key');
    return;
  }
  
  // Show loading
  if (btnText) btnText.style.display = 'none';
  if (btnLoading) btnLoading.style.display = 'inline';
  if (activateBtn) activateBtn.disabled = true;
  
  try {
    const result = await licenseService.validateLicense(licenseKey);
    
    if (result.success) {
      showLicenseSuccess(result.message);
      isLicenseValid = true;
      
      // Wait a moment then show main app
      setTimeout(() => {
        showMainApp();
      }, 1500);
    } else {
      showLicenseError(result.error);
    }
  } catch (e) {
    showLicenseError('เกิดข้อผิดพลาด: ' + e.message);
  } finally {
    // Hide loading
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
    if (activateBtn) activateBtn.disabled = false;
  }
}

// ★ จัดการอุปกรณ์จากหน้า License Login ★
async function handleManageDevicesFromLogin() {
  const licenseInput = document.getElementById('license-key-input');
  const licenseKey = licenseInput?.value?.trim()?.toUpperCase();
  const statusMsg = document.getElementById('license-status-msg');
  const manageBtn = document.getElementById('manage-devices-login-btn');
  const deviceListContainer = document.getElementById('login-device-list');
  const deviceItemsEl = document.getElementById('login-device-items');
  
  if (!licenseKey || licenseKey.length < 19) {
    showLoginStatus('❌ กรุณากรอก License Key ให้ครบก่อน', 'error');
    return;
  }
  
  if (manageBtn) {
    manageBtn.disabled = true;
    manageBtn.innerHTML = '<span>⏳ กำลังโหลด...</span>';
  }
  
  try {
    // ดึง device ID ปัจจุบัน
    const currentDeviceId = await licenseService.getDeviceId();
    
    // ดึงรายชื่อ devices จาก Firebase
    const devices = await licenseService.getDevicesList(licenseKey);
    const deviceIds = Object.keys(devices || {});
    
    if (deviceIds.length === 0) {
      deviceItemsEl.innerHTML = '<div class="login-device-empty">ไม่มีอุปกรณ์ที่ลงทะเบียนกับ License นี้</div>';
    } else {
      deviceItemsEl.innerHTML = deviceIds.map(deviceId => {
        const device = devices[deviceId];
        const isCurrent = deviceId === currentDeviceId;
        const registeredDate = device.registeredAt ? new Date(device.registeredAt).toLocaleDateString('th-TH') : '-';
        const lastSeen = device.lastSeen ? new Date(device.lastSeen).toLocaleString('th-TH') : '-';
        
        return `
          <div class="login-device-item ${isCurrent ? 'is-current' : ''}">
            <div class="login-device-item-info">
              <div class="login-device-item-id">
                🖥️ ${deviceId.substring(0, 28)}...
                ${isCurrent ? '<span class="login-device-item-badge">เครื่องนี้</span>' : ''}
              </div>
              <div class="login-device-item-date">ลงทะเบียน: ${registeredDate} | ใช้ล่าสุด: ${lastSeen}</div>
            </div>
            <button class="login-device-item-delete" data-device-id="${deviceId}" data-is-current="${isCurrent}">
              🗑️ ลบ
            </button>
          </div>
        `;
      }).join('');
      
      // Attach delete handlers
      deviceItemsEl.querySelectorAll('.login-device-item-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          deleteDeviceFromLogin(licenseKey, btn.dataset.deviceId, btn.dataset.isCurrent === 'true');
        });
      });
    }
    
    // แสดง device list
    if (deviceListContainer) deviceListContainer.style.display = 'block';
    showLoginStatus(`📱 พบ ${deviceIds.length}/2 อุปกรณ์ที่ลงทะเบียน`, 'success');
    
  } catch (e) {
    console.error('[License] Load devices from login error:', e);
    showLoginStatus('❌ ไม่สามารถโหลดรายชื่ออุปกรณ์ได้: ' + e.message, 'error');
  } finally {
    if (manageBtn) {
      manageBtn.disabled = false;
      manageBtn.innerHTML = '<span>📱 จัดการอุปกรณ์ที่ลงทะเบียน</span>';
    }
  }
}

// ★ ลบ device จากหน้า login ★
async function deleteDeviceFromLogin(licenseKey, deviceId, isCurrent) {
  const confirmMsg = isCurrent
    ? '⚠️ คุณกำลังจะลบ "เครื่องนี้" ออกจาก License\n\nหลังจากลบแล้ว คุณสามารถกด "เปิดใช้งาน" เพื่อลงทะเบียนใหม่ได้ทันที\n\nยืนยันหรือไม่?'
    : '🗑️ ต้องการลบอุปกรณ์นี้ออกจาก License หรือไม่?\n\nอุปกรณ์ที่ถูกลบจะต้องลงทะเบียนใหม่';
  
  if (!confirm(confirmMsg)) return;
  
  try {
    const result = await licenseService.removeDevice(licenseKey, deviceId);
    
    if (result.success) {
      if (isCurrent) {
        // ลบเครื่องตัวเอง → clear local data
        await chrome.storage.local.remove(['licenseKey', 'licenseData', 'deviceId']);
      }
      
      showLoginStatus('✅ ลบอุปกรณ์สำเร็จ!', 'success');
      
      // Refresh device list
      setTimeout(() => handleManageDevicesFromLogin(), 500);
    } else {
      showLoginStatus('❌ ' + (result.error || 'ไม่สามารถลบอุปกรณ์ได้'), 'error');
    }
  } catch (e) {
    showLoginStatus('❌ เกิดข้อผิดพลาด: ' + e.message, 'error');
  }
}

// ★ แสดงข้อความสถานะที่หน้า login ★
function showLoginStatus(message, type) {
  const statusMsg = document.getElementById('license-status-msg');
  if (statusMsg) {
    statusMsg.style.display = 'block';
    statusMsg.className = `license-status-msg ${type}`;
    statusMsg.textContent = message;
  }
}

function showLicenseError(message) {
  const btnText = document.querySelector('#activate-license-btn .license-btn-text');
  if (btnText) {
    btnText.textContent = '❌ ' + message;
    btnText.style.color = '#ff6b6b';
    setTimeout(() => {
      btnText.textContent = 'เปิดใช้งาน';
      btnText.style.color = '';
    }, 3000);
  }
}

function showLicenseSuccess(message) {
  const btnText = document.querySelector('#activate-license-btn .license-btn-text');
  if (btnText) {
    btnText.textContent = '✅ ' + message;
    btnText.style.color = '#51cf66';
  }
}

// ★ Device Management Functions ★
async function showDeviceManagement(licenseKey) {
  const deviceManagement = document.getElementById('device-management');
  const deviceList = document.getElementById('device-list');
  const deviceCount = document.getElementById('device-count');
  
  if (!deviceManagement || !licenseKey) return;
  
  deviceManagement.style.display = 'block';
  deviceList.innerHTML = '<p style="color:#888;font-size:11px;">กำลังโหลด...</p>';
  
  try {
    const devices = await licenseService.getDevicesList(licenseKey);
    const currentDeviceId = await licenseService.getCurrentDeviceId();
    const deviceIds = Object.keys(devices);
    
    deviceCount.textContent = deviceIds.length;
    
    if (deviceIds.length === 0) {
      deviceList.innerHTML = '<p style="color:#888;font-size:11px;">ยังไม่มี Device ลงทะเบียน</p>';
      return;
    }
    
    deviceList.innerHTML = deviceIds.map(deviceId => {
      const device = devices[deviceId];
      const isCurrent = deviceId === currentDeviceId;
      const registeredDate = device.registeredAt ? new Date(device.registeredAt).toLocaleDateString('th-TH') : '-';
      const lastSeen = device.lastSeen ? new Date(device.lastSeen).toLocaleString('th-TH') : '-';
      
      return `
        <div class="device-item ${isCurrent ? 'current' : ''}">
          <div class="device-info">
            <div class="device-id">${deviceId.substring(0, 30)}...${isCurrent ? '<span class="device-current-badge">เครื่องนี้</span>' : ''}</div>
            <div class="device-date">ลงทะเบียน: ${registeredDate} | ใช้งานล่าสุด: ${lastSeen}</div>
          </div>
          <button class="btn-remove-device ${isCurrent ? 'btn-remove-self' : ''}" onclick="removeDevice('${licenseKey}', '${deviceId}', ${isCurrent})">
            ${isCurrent ? '🔓 ลบเครื่องนี้' : '🗑️ ลบ'}
          </button>
        </div>
      `;
    }).join('');
    
  } catch (e) {
    console.error('[License] Load devices error:', e);
    deviceList.innerHTML = '<p style="color:#f44;font-size:11px;">เกิดข้อผิดพลาดในการโหลด</p>';
  }
}

async function removeDevice(licenseKey, deviceId, isSelf = false) {
  const confirmMsg = isSelf 
    ? '⚠️ คุณกำลังจะลบเครื่องนี้ออกจาก License\n\nหลังจากลบแล้ว คุณจะต้องใส่ License Key ใหม่เพื่อเข้าใช้งานอีกครั้ง\n\nยืนยันหรือไม่?'
    : 'ต้องการลบ Device นี้หรือไม่?';
  
  if (!confirm(confirmMsg)) return;
  
  const result = await licenseService.removeDevice(licenseKey, deviceId);
  
  if (result.success) {
    if (isSelf) {
      // ★ ลบเครื่องตัวเอง: clear local license แล้ว reload ไปหน้า login ★
      await chrome.storage.local.remove(['licenseKey', 'licenseData', 'deviceId']);
      showLicenseSuccess('ลบเครื่องนี้สำเร็จ! กำลังกลับไปหน้า License...');
      setTimeout(() => {
        location.reload();
      }, 1500);
    } else {
      showLicenseSuccess('ลบ Device สำเร็จ');
      // Refresh device list
      await showDeviceManagement(licenseKey);
    }
  } else {
    showLicenseError(result.error);
  }
}

async function checkDevices() {
  const licenseInput = document.getElementById('license-key-input');
  const licenseKey = licenseInput.value.trim().toUpperCase();
  
  if (!licenseKey) {
    showLicenseError('กรุณาใส่ License Key ก่อน');
    return;
  }
  
  await showDeviceManagement(licenseKey);
}

function showLicenseScreen() {
  const licenseScreen = document.getElementById('license-screen');
  const mainApp = document.getElementById('main-app');
  
  if (licenseScreen) licenseScreen.style.display = 'flex';
  if (mainApp) mainApp.style.display = 'none';
}

function showMainApp() {
  const licenseScreen = document.getElementById('license-screen');
  const mainApp = document.getElementById('main-app');
  
  if (licenseScreen) licenseScreen.style.display = 'none';
  if (mainApp) mainApp.style.display = 'block';
  
  // Update profile status display
  updateProfileStatus();
}

// ★ Update Profile Status Display ★
async function updateProfileStatus() {
  const profileStatus = document.getElementById('profile-status');
  const profileBadge = document.getElementById('profile-badge');
  
  if (!profileStatus) return;
  
  try {
    const { licenseKey, licenseData } = await chrome.storage.local.get(['licenseKey', 'licenseData']);
    
    if (!licenseKey) {
      profileStatus.textContent = 'ไม่มี License';
      profileStatus.className = 'profile-status expired';
      return;
    }
    
    // Fetch latest license data from Firebase
    const response = await fetch(`${FIREBASE_DB_URL}/licenses/${licenseKey}.json`);
    const license = await response.json();
    
    if (!license) {
      profileStatus.textContent = 'License ไม่ถูกต้อง';
      profileStatus.className = 'profile-status expired';
      return;
    }
    
    // Check expiry
    if (!license.expiresAt) {
      // ไม่จำกัด
      profileStatus.textContent = '♾️ ไม่จำกัด';
      profileStatus.className = 'profile-status unlimited';
    } else {
      const expiresAt = new Date(license.expiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 0) {
        profileStatus.textContent = '❌ หมดอายุ';
        profileStatus.className = 'profile-status expired';
      } else if (daysLeft <= 7) {
        profileStatus.textContent = `⚠️ เหลือ ${daysLeft} วัน`;
        profileStatus.className = 'profile-status expiring';
      } else {
        profileStatus.textContent = `✅ เหลือ ${daysLeft} วัน`;
        profileStatus.className = 'profile-status unlimited';
      }
    }
    
  } catch (e) {
    console.error('[Profile] Error updating status:', e);
    profileStatus.textContent = 'ไม่จำกัด';
    profileStatus.className = 'profile-status unlimited';
  }
}

// ==================== Main App Variables ====================
let selectedStyles = [];
let selectedMode = 'flow';
let conversationHistory = [];
let products = [];
let selectedProduct = null;
let characters = [];
let selectedCharacter = null;
let isScraperRunning = false;
let productQueue = [];
let activityLogs = [];
let currentFlowItem = null;

// ==================== Overclaim Rules (คำต้องห้าม) ====================
// TODO: USER_PROMPT — วาง overclaim rules ใหม่ที่นี่
const OVERCLAIM_RULES_BASE = ``;

let userCustomForbiddenWords = [];

function getOverclaimRules() {
  if (!userCustomForbiddenWords || userCustomForbiddenWords.length === 0) return OVERCLAIM_RULES_BASE;
  return OVERCLAIM_RULES_BASE + (userCustomForbiddenWords.length > 0 ? `\n${userCustomForbiddenWords.join(', ')}` : '');
}
let OVERCLAIM_RULES = OVERCLAIM_RULES_BASE;

/**
 * บล็อกบังคับสินค้าให้ตรงรูปอ้างอิง 100% — ใช้ใน image / video prompt ทุกเส้นทาง AutoPost
 */
// TODO: USER_PROMPT — วาง product lock block ใหม่ที่นี่
function buildProductImageLockBlock(productName) {
  const n = String(productName || '').trim() || 'this product';
  return '';
}

// TODO: USER_PROMPT — วาง speech structure template ใหม่ที่นี่
const AUTOPOST_SPEECH_HOOK_PROBLEM_CTA = ``;

// ==================== Flow Configuration ====================
const FLOW_STEPS = {
  CREATE_IMAGE: 'create_image',
  FRAME_TO_VIDEO: 'frame_to_video',
  SCREEN_BUILDER: 'screen_builder',
  UPLOAD_TIKTOK: 'upload_tiktok',
  POST_TIKTOK: 'post_tiktok'
};

const FLOW_CONFIG = {
  8: [
    FLOW_STEPS.CREATE_IMAGE,
    FLOW_STEPS.FRAME_TO_VIDEO,
    FLOW_STEPS.UPLOAD_TIKTOK,
    FLOW_STEPS.POST_TIKTOK
  ],
  16: [
    FLOW_STEPS.CREATE_IMAGE,
    FLOW_STEPS.FRAME_TO_VIDEO,
    FLOW_STEPS.SCREEN_BUILDER,
    FLOW_STEPS.UPLOAD_TIKTOK,
    FLOW_STEPS.POST_TIKTOK
  ]
};

const FLOW_STEP_LABELS = {
  [FLOW_STEPS.CREATE_IMAGE]: '🖼️ สร้างรูปภาพ',
  [FLOW_STEPS.FRAME_TO_VIDEO]: '🎬 สร้างวิดีโอ',
  [FLOW_STEPS.SCREEN_BUILDER]: '🎞️ ต่อคลิป',
  [FLOW_STEPS.UPLOAD_TIKTOK]: '📤 อัพโหลด TikTok',
  [FLOW_STEPS.POST_TIKTOK]: '📱 โพสต์ TikTok'
};

const FLOW_URLS = {
  GOOGLE_FLOW: 'https://labs.google/fx/tools/flow',
  TIKTOK_UPLOAD: 'https://www.tiktok.com/creator-center/upload'
};

const MODE_DATA = {
  flow: { icon: '🌊', name: 'Flow', duration: '8 วินาที' },
  grok: { icon: '⚡', name: 'Grok', duration: '6 วินาที' },
  supergrok: { icon: '🔥', name: 'Super Grok', duration: '10 วินาที' }
};

// ==================== Auto V2 Flow Configuration ====================
const V2_FLOW_STEPS = {
  CREATE_IMAGE: 'v2_create_image',
  CREATE_VIDEO: 'v2_create_video',
  EXTEND_VIDEO: 'v2_extend_video',
  UPLOAD_TIKTOK: 'v2_upload_tiktok',
  POST_TIKTOK: 'v2_post_tiktok'
};

const V2_FLOW_CONFIG = [
  V2_FLOW_STEPS.CREATE_IMAGE,
  V2_FLOW_STEPS.CREATE_VIDEO,
  V2_FLOW_STEPS.EXTEND_VIDEO,
  V2_FLOW_STEPS.UPLOAD_TIKTOK,
  V2_FLOW_STEPS.POST_TIKTOK
];

const V2_FLOW_STEP_LABELS = {
  [V2_FLOW_STEPS.CREATE_IMAGE]: '🖼️ สร้างรูป (Template 1)',
  [V2_FLOW_STEPS.CREATE_VIDEO]: '🎬 สร้างวิดีโอ (Template 2)',
  [V2_FLOW_STEPS.EXTEND_VIDEO]: '🎞️ ต่อวิดีโอ (Template 3)',
  [V2_FLOW_STEPS.UPLOAD_TIKTOK]: '📤 อัพโหลด TikTok',
  [V2_FLOW_STEPS.POST_TIKTOK]: '📱 โพสต์ TikTok'
};

// Video Style Map (Thai)
const VIDEO_STYLE_MAP = {
  'default_clean': 'สไตล์มาตรฐาน - สะอาด เรียบง่าย',
  'christmas': 'ธีมคริสต์มาส - ตกแต่งเทศกาล',
  'new_year': 'ธีมปีใหม่ - นับถอยหลัง',
  'chinese_new_year': 'ธีมตรุษจีน - สีแดงทอง',
  'valentine': 'ธีมวาเลนไทน์ - โรแมนติก',
  'songkran': 'ธีมสงกรานต์ - สดใส',
  'halloween': 'ธีมฮาโลวีน - ลึกลับ',
  'luxury_mall': 'สไตล์ห้างหรู - พรีเมียม',
  'premium_luxury': 'สไตล์หรูหรา - ไฮเอนด์',
  'minimal': 'มินิมอล - เรียบง่าย',
  'cute_kawaii': 'น่ารัก คาวาอี้ - พาสเทล',
  'bright_cheerful': 'สดใส ร่าเริง - มีชีวิตชีวา',
  'warm_friendly': 'อบอุ่น เป็นกันเอง',
  'seller_fierce': 'แม่ค้าดุ - ขายจริงจัง',
  'real_review': 'รีวิวจริง - ไม่ปรุงแต่ง',
  'viral_tiktok': 'ไวรัล TikTok - ฮุคเด็ด',
  'flash_sale': 'Flash Sale - เร่งด่วน',
  'before_after': 'Before/After - เปรียบเทียบ',
  'storytelling': 'เล่าเรื่อง - มีเนื้อหา',
  'ugc_real_user': 'UGC ผู้ใช้จริง - ธรรมชาติ',
  'business_pro': 'ธุรกิจมืออาชีพ - น่าเชื่อถือ',
  'tech_modern': 'เทคโนโลยี - ทันสมัย',
  'korean_clean': 'สไตล์เกาหลี - ผิวใส',
  'japanese_soft': 'สไตล์ญี่ปุ่น - นุ่มนวล',
  'no_face': 'ไม่เห็นหน้า - เน้นสินค้า',
  'silent_text': 'ไม่มีเสียง - ใช้ข้อความ',
  'big_text_sell': 'ตัวอักษรใหญ่ - เน้นขาย',
  'chill_lifestyle': 'ชิลล์ ไลฟ์สไตล์ - สบายๆ',
  'series_content': 'ซีรีส์ต่อเนื่อง - ตอนต่อตอน'
};

// Background Style Map (Thai)
const BACKGROUND_STYLE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'white_studio': 'สตูดิโอขาว - มืออาชีพ',
  'home_living_room': 'ห้องนั่งเล่น - อบอุ่น',
  'modern_office': 'ออฟฟิศทันสมัย - น่าเชื่อถือ',
  'luxury_black_gold': 'ดำทอง - หรูหรา',
  'soft_pastel': 'พาสเทลนุ่มนวล',
  'tech_digital': 'เทคโนโลยี - นีออน',
  'cafe_korean': 'คาเฟ่เกาหลี - อบอุ่น',
  'minimal_dark': 'มินิมอลมืด - ซีนีมาติก',
  'nature_outdoor': 'กลางแจ้ง - ธรรมชาติ',
  'bedroom_cozy': 'ห้องนอน - ผ่อนคลาย',
  'neon_studio': 'สตูดิโอนีออน - สีสัน',
  'retail_store': 'ร้านค้า - แสดงสินค้า',
  'kitchen_home': 'ห้องครัว - ใช้งานจริง',
  'conference_room': 'ห้องประชุม - ธุรกิจ',
  'gradient_modern': 'ไล่สีทันสมัย',
  'blur_bokeh': 'เบลอโบเก้ - เน้นสินค้า',
  'futuristic_ai_room': 'ห้อง AI - ล้ำสมัย',
  'mall_luxury': 'ห้างหรู - พรีเมียม',
  'morning_sunlight': 'แสงเช้า - สดใส',
  'night_cinematic': 'กลางคืน - ซีนีมาติก',
  'living_room': 'ห้องนั่งเล่น - โซฟา',
  'bedroom': 'ห้องนอน - สไตลิช',
  'home_office': 'โฮมออฟฟิศ - โต๊ะทำงาน',
  'desk_setup': 'โต๊ะคอม - เซ็ตอัพ',
  'packing_corner': 'มุมแพ็คของ - แม่ค้าออนไลน์',
  'kitchen': 'ห้องครัว - สะอาด',
  'luxury_bathroom': 'ห้องน้ำหรู - จากุซซี่',
  'condo_city_view': 'คอนโด - วิวเมือง',
  'country_house': 'บ้านชนบท - สวน',
  'cafe': 'คาเฟ่ - กาแฟ',
  'restaurant': 'ร้านอาหาร - หรูหรา',
  'hotel_lobby': 'ล็อบบี้โรงแรม - หรู',
  'office': 'ออฟฟิศ - ทำงาน',
  'car_interior': 'ในรถ - แดชบอร์ด',
  'gas_station': 'ปั๊มน้ำมัน',
  'flea_market': 'ตลาดนัด - สีสัน',
  'city_street': 'ถนนในเมือง',
  'bts_mrt': 'สถานี BTS/MRT',
  'beach': 'ชายหาด - ทะเล',
  'mountain_nature': 'ภูเขา - ธรรมชาติ',
  'park': 'สวนสาธารณะ',
  'christmas': 'ธีมคริสต์มาส',
  'new_year': 'ธีมปีใหม่',
  'chinese_new_year': 'ธีมตรุษจีน',
  'valentine': 'ธีมวาเลนไทน์',
  'songkran': 'ธีมสงกรานต์',
  'halloween': 'ธีมฮาโลวีน',
  'white_minimal': 'ขาวมินิมอล',
  'studio_backdrop': 'สตูดิโอ - ฉากสีพื้น'
};

// Character Style Map (Thai)
const CHARACTER_STYLE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'sweet_reviewer_female': 'สาวรีวิว - น่ารัก เป็นกันเอง',
  'confident_seller_male': 'หนุ่มขายของ - มั่นใจ พลังเยอะ',
  'expert_professional': 'ผู้เชี่ยวชาญ - น่าเชื่อถือ',
  'friendly_best_friend': 'เพื่อนสนิท - คุยสบายๆ',
  'young_energetic_creator': 'ครีเอเตอร์วัยรุ่น - สดใส',
  'calm_minimal_host': 'พิธีกรสงบ - มินิมอล',
  'luxury_brand_owner': 'เจ้าของแบรนด์หรู - หรูหรา',
  'tech_geek_specialist': 'สายเทค - ฉลาด วิเคราะห์',
  'funny_entertainer': 'ตลก - สนุกสนาน',
  'serious_news_anchor': 'ผู้ประกาศข่าว - จริงจัง',
  'caring_mom_reviewer': 'คุณแม่รีวิว - ใส่ใจ',
  'fitness_coach': 'โค้ชฟิตเนส - สร้างแรงบันดาลใจ',
  'beauty_guru': 'บิวตี้กูรู - มั่นใจ',
  'corporate_ceo': 'CEO บริษัท - ผู้นำ',
  'lifestyle_vlogger': 'ไลฟ์สไตล์ Vlogger - สบายๆ',
  'street_interview_host': 'สัมภาษณ์ริมถนน - สนุก',
  'luxury_model': 'นางแบบหรู - พรีเมียม',
  'calm_storyteller': 'นักเล่าเรื่อง - สงบ',
  'hardcore_sales_closer': 'นักขายตัวยง - ปิดการขาย',
  'futuristic_ai_avatar': 'อวาตาร์ AI - ล้ำสมัย',
  // ★ Pixar 3D Characters — AI วิเคราะห์สินค้าแล้วเลือกตัวละคร 3D ให้เหมาะ ★
  'pixar_3d_ai_auto': '🏰 3D Pixar AI เลือกตัวละคร — AI วิเคราะห์สินค้าแล้วเลือก 3D character ที่เหมาะที่สุด',
  'pixar_3d_cute_girl': '🏰 3D สาวน่ารัก — ตาโต ยิ้มหวาน สดใส',
  'pixar_3d_cool_boy': '🏰 3D หนุ่มเท่ — หล่อ มั่นใจ สไตล์โมเดิร์น',
  'pixar_3d_funny_chef': '🏰 3D เชฟตลก — อ้วนกลม ร่าเริง รักอาหาร',
  'pixar_3d_robot_helper': '🏰 3D หุ่นยนต์ผู้ช่วย — น่ารัก ฉลาด ล้ำสมัย',
  'pixar_3d_animal_mascot': '🏰 3D สัตว์มาสคอต — AI เลือกสัตว์ที่เข้ากับสินค้า',
  'pixar_3d_grandma': '🏰 3D คุณป้า — ใจดี อบอุ่น น่าเชื่อถือ',
  'pixar_3d_kid_genius': '🏰 3D นักวิทย์ — ฉลาด สงสัย ค้นพบสิ่งใหม่',
  'pixar_3d_superhero': '🏰 3D ซุปเปอร์ฮีโร่ — แข็งแกร่ง พลังเยอะ',
  'pixar_3d_fairy': '🏰 3D นางฟ้า/เอลฟ์ — สวยงาม เวทมนตร์ แฟนตาซี',
  'pixar_3d_office_worker': '🏰 3D พนักงานออฟฟิศ — มืออาชีพ น่าเชื่อถือ',
  // ★ ไม่มีคน ★
  'hand_only_review': 'มือรีวิวสินค้า - ไม่เห็นหน้าคน เน้นมือถือสินค้า',
  'product_only_no_person': 'สินค้าอย่างเดียว - ไม่มีคน เน้นสินค้า 100%',
  'back_silhouette': 'ถ่ายหลัง/เงา - เห็นคนแต่ไม่เห็นหน้า',
  'close_up_hands_product': 'มือ Close-up - ถือสินค้าใกล้กล้อง',
  'overhead_flatlay': 'มุมบน Flatlay - ไม่มีคน วางสินค้าสวยงาม',
  'unboxing_hands': 'แกะกล่อง - เห็นแค่มือแกะกล่องสินค้า'
};

// ★ Pixar 3D Character Library — ใช้เมื่อ AI เลือกตัวละคร 3D อัตโนมัติ ★
const PIXAR_3D_CHARACTERS = [
  { id: 'cute_girl', desc: 'Adorable 3D animated young woman with big expressive eyes, smooth round face, small cute nose, long flowing hair, bright cheerful smile, Pixar/Disney quality rendering', gender: 'female', personality: 'cheerful, sweet, enthusiastic', bestFor: ['beauty', 'skincare', 'fashion', 'accessories', 'lifestyle'] },
  { id: 'cool_boy', desc: 'Handsome 3D animated young man with stylish hair, confident smirk, sharp jawline, modern trendy outfit, Pixar/Disney quality rendering', gender: 'male', personality: 'confident, cool, trendy', bestFor: ['tech', 'gadgets', 'fashion', 'sports', 'automotive'] },
  { id: 'funny_chef', desc: 'Chubby jolly 3D animated chef with round belly, big rosy cheeks, tall white chef hat, enthusiastic expression, holding a wooden spoon, Pixar/Disney quality rendering', gender: 'male', personality: 'funny, warm, passionate about food', bestFor: ['food', 'kitchen', 'cooking', 'supplements', 'health_food'] },
  { id: 'robot_helper', desc: 'Cute compact 3D animated robot with round glowing eyes, smooth white metallic body, small antenna, friendly expression, subtle LED glow, Pixar/Disney quality rendering', gender: 'neutral', personality: 'smart, helpful, futuristic', bestFor: ['tech', 'gadgets', 'electronics', 'software', 'smart_home'] },
  { id: 'bear_mascot', desc: 'Fluffy adorable 3D animated teddy bear with soft brown fur, big round eyes, small pink nose, wearing a tiny bow tie, warm huggable look, Pixar/Disney quality rendering', gender: 'neutral', personality: 'cuddly, trustworthy, comforting', bestFor: ['kids', 'toys', 'baby', 'home', 'gifts', 'general'] },
  { id: 'cat_mascot', desc: 'Sleek elegant 3D animated cat with big bright eyes, fluffy tail, playful curious expression, wearing a tiny scarf, Pixar/Disney quality rendering', gender: 'neutral', personality: 'playful, curious, elegant', bestFor: ['beauty', 'lifestyle', 'pet', 'accessories', 'home_decor'] },
  { id: 'grandma', desc: 'Lovable 3D animated mature woman (50s) with round glasses, silver-streaked hair in a bun, warm friendly smile, cozy apron, Pixar/Disney quality rendering', gender: 'female', personality: 'wise, caring, trustworthy', bestFor: ['health', 'traditional', 'food', 'herbal', 'medicine', 'home'] },
  { id: 'kid_genius', desc: 'Bright-eyed 3D animated young scientist (20s) with oversized glasses, messy hair, lab coat, excited curious expression, holding a magnifying glass, Pixar/Disney quality rendering', gender: 'neutral', personality: 'curious, smart, discovering', bestFor: ['education', 'books', 'tech', 'science', 'toys'] },
  { id: 'superhero', desc: 'Heroic 3D animated character with cape flowing, strong confident pose, glowing eyes, sleek colorful suit, Pixar/Disney quality rendering', gender: 'male', personality: 'strong, protective, powerful', bestFor: ['sports', 'fitness', 'supplements', 'energy', 'automotive'] },
  { id: 'fairy', desc: 'Enchanting 3D animated fairy with delicate translucent wings, sparkling dress, flowing magical hair with glowing particles, ethereal beauty, Pixar/Disney quality rendering', gender: 'female', personality: 'magical, elegant, enchanting', bestFor: ['beauty', 'skincare', 'perfume', 'jewelry', 'luxury'] },
  { id: 'office_pro', desc: 'Sharp professional 3D animated office worker with neat hair, smart glasses, crisp business suit, confident pose with tablet in hand, Pixar/Disney quality rendering', gender: 'neutral', personality: 'professional, reliable, analytical', bestFor: ['business', 'finance', 'software', 'office', 'service'] },
  { id: 'dog_mascot', desc: 'Enthusiastic 3D animated golden retriever puppy with big floppy ears, wagging tail, tongue out, wearing a tiny bandana, pure joy expression, Pixar/Disney quality rendering', gender: 'neutral', personality: 'loyal, energetic, lovable', bestFor: ['pet', 'outdoor', 'sports', 'kids', 'general', 'food'] },
  { id: 'witch_cute', desc: 'Adorable 3D animated young witch with pointy hat, purple starry robe, holding a glowing potion bottle, mischievous cute smile, Pixar/Disney quality rendering', gender: 'female', personality: 'mysterious, playful, magical', bestFor: ['beauty', 'skincare', 'supplements', 'mystery_box', 'lifestyle'] },
  { id: 'muscle_trainer', desc: 'Athletic 3D animated fitness trainer in sportswear, sweatband, encouraging thumbs-up pose, energetic smile, Pixar/Disney quality rendering', gender: 'male', personality: 'motivating, energetic, strong', bestFor: ['fitness', 'sports', 'supplements', 'health', 'activewear'] }
];

// ★ AI วิเคราะห์สินค้าแล้วเลือก Pixar 3D Character ที่เหมาะที่สุด ★
function selectPixar3DCharacter(productName, productCategory) {
  const nameLower = (productName || '').toLowerCase();
  const cat = (productCategory || 'general').toLowerCase();
  
  const categoryKeywords = {
    food: ['อาหาร', 'ขนม', 'เครื่องดื่ม', 'กาแฟ', 'ชา', 'น้ำผลไม้', 'ซอส', 'เส้น', 'ข้าว', 'นม', 'โยเกิร์ต', 'ช็อก', 'คุกกี้', 'เค้ก', 'พิซซ่า', 'food', 'snack', 'drink', 'coffee'],
    beauty: ['ครีม', 'เซรั่ม', 'สกินแคร์', 'แป้ง', 'ลิปสติก', 'มาสคาร่า', 'อายไลเนอร์', 'บีบี', 'กันแดด', 'โลชั่น', 'สบู่', 'ล้างหน้า', 'โฟม', 'มาส์ก', 'น้ำหอม', 'beauty', 'serum', 'cream', 'skincare', 'makeup'],
    tech: ['โทรศัพท์', 'มือถือ', 'แท็บเล็ต', 'โน้ตบุ๊ค', 'หูฟัง', 'ลำโพง', 'กล้อง', 'ชาร์จ', 'สาย', 'เคส', 'usb', 'bluetooth', 'wireless', 'phone', 'laptop', 'camera', 'smart'],
    fashion: ['เสื้อ', 'กางเกง', 'กระโปรง', 'ชุด', 'รองเท้า', 'กระเป๋า', 'นาฬิกา', 'แว่น', 'หมวก', 'ผ้าพันคอ', 'เข็มขัด', 'shirt', 'dress', 'shoes', 'bag', 'watch'],
    health: ['วิตามิน', 'อาหารเสริม', 'โปรตีน', 'คอลลาเจน', 'กลูต้า', 'ไฟเบอร์', 'ยา', 'สมุนไพร', 'vitamin', 'supplement', 'protein', 'collagen'],
    fitness: ['ดัมเบล', 'โยคะ', 'วิ่ง', 'ออกกำลัง', 'ฟิตเนส', 'สปอร์ต', 'gym', 'fitness', 'sport', 'yoga', 'running'],
    kids: ['เด็ก', 'ของเล่น', 'นม', 'ผ้าอ้อม', 'เบบี้', 'baby', 'kid', 'toy', 'children'],
    home: ['บ้าน', 'ห้อง', 'โต๊ะ', 'เก้าอี้', 'ผ้า', 'หมอน', 'ที่นอน', 'ตู้', 'ชั้น', 'home', 'furniture', 'decor'],
    pet: ['สุนัข', 'แมว', 'สัตว์เลี้ยง', 'อาหารแมว', 'อาหารสุนัข', 'pet', 'dog', 'cat']
  };
  
  let detectedCategory = cat;
  if (detectedCategory === 'general' || detectedCategory === 'auto_detect') {
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => nameLower.includes(kw))) {
        detectedCategory = category;
        break;
      }
    }
  }
  
  const scored = PIXAR_3D_CHARACTERS.map(char => {
    let score = 0;
    if (char.bestFor.includes(detectedCategory)) score += 10;
    if (char.bestFor.includes('general')) score += 1;
    score += Math.random() * 3;
    return { ...char, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

// ★ ตรวจว่าเป็น Pixar 3D character หรือไม่ ★
const PIXAR_3D_CHARACTER_IDS = [
  'pixar_3d_ai_auto', 'pixar_3d_cute_girl', 'pixar_3d_cool_boy', 'pixar_3d_funny_chef',
  'pixar_3d_robot_helper', 'pixar_3d_animal_mascot', 'pixar_3d_grandma', 'pixar_3d_kid_genius',
  'pixar_3d_superhero', 'pixar_3d_fairy', 'pixar_3d_office_worker'
];
function isPixar3DCharacter(characterId) {
  return PIXAR_3D_CHARACTER_IDS.includes(characterId);
}

// Speaking Style Map (Thai)
const SPEAKING_STYLE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'fast_high_energy': 'เร็ว พลังเยอะ - ฮุคแรง',
  'calm_soft': 'สงบ นุ่มนวล - ผ่อนคลาย',
  'confident_authority': 'มั่นใจ - น่าเชื่อถือ',
  'friendly_chat': 'คุยสบายๆ - เป็นกันเอง',
  'step_by_step': 'สอนทีละขั้น - ชัดเจน',
  'excited_dynamic': 'ตื่นเต้น - มีพลัง',
  'logical_reasoning': 'เหตุผล - วิเคราะห์',
  'storytelling_flow': 'เล่าเรื่อง - ลื่นไหล',
  'problem_solution': 'ปัญหา → ทางออก',
  'question_hook': 'ตั้งคำถาม - ดึงความสนใจ',
  'data_explainer': 'อธิบายด้วยข้อมูล',
  'before_after_reveal': 'เปิดเผย Before/After',
  'soft_review': 'รีวิวนุ่มๆ - ไม่ขายตรง',
  'hard_sell': 'ขายตรง - กระตุ้นซื้อ',
  'motivational_push': 'สร้างแรงบันดาลใจ',
  'luxury_slow': 'หรูหรา - ช้าๆ',
  'news_report': 'รายงานข่าว - จริงจัง',
  'viral_short_cut': 'ตัดเร็ว - ประโยคสั้น',
  'empathetic': 'เข้าใจปัญหา - ใส่ใจ',
  'educational': 'ให้ความรู้ - สอน',
  'northern_gentle': 'สำเนียงเหนือ - อ่อนโยน',
  'northern_friendly': 'สำเนียงเหนือ - เป็นกันเอง',
  'northeastern_energetic': 'สำเนียงอีสาน - สนุกสนาน',
  'northeastern_story': 'สำเนียงอีสาน - เล่าเรื่อง',
  'central_natural': 'ภาคกลาง - ธรรมชาติ',
  'central_market_seller': 'แม่ค้าตลาด - ขายเก่ง',
  'southern_strong': 'สำเนียงใต้ - มั่นใจ',
  'southern_fast': 'สำเนียงใต้ - เร็ว พลังเยอะ'
};

// Voice Tone Map (Thai)
const VOICE_TONE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'female_clear_bright': 'ผู้หญิง - ใส สดใส',
  'female_soft_warm': 'ผู้หญิง - นุ่ม อบอุ่น',
  'female_confident': 'ผู้หญิง - มั่นใจ',
  'male_deep_calm': 'ผู้ชาย - ทุ้ม สงบ',
  'male_energetic': 'ผู้ชาย - พลังเยอะ',
  'male_authority': 'ผู้ชาย - น่าเชื่อถือ',
  'neutral_natural': 'กลางๆ - ธรรมชาติ',
  'youthful_trendy': 'วัยรุ่น - ทันสมัย',
  'luxury_smooth': 'หรูหรา - นุ่มนวล',
  'serious_news': 'ผู้ประกาศข่าว - จริงจัง',
  'motivational_strong': 'สร้างแรงบันดาลใจ - พลังเยอะ',
  'friendly_live': 'ไลฟ์สด - เป็นกันเอง',
  'gentle_asmr': 'ASMR - กระซิบ นุ่มนวล',
  'corporate_clean': 'องค์กร - สะอาด',
  'story_narrator': 'ผู้บรรยาย - เล่าเรื่อง',
  'sales_power': 'นักขาย - ปิดการขาย',
  'tech_ai': 'AI สังเคราะห์ - ล้ำสมัย',
  'calm_minimal': 'สงบ - มินิมอล',
  'dramatic_reveal': 'ดราม่า - เปิดเผย',
  'family_trust': 'ครอบครัว - น่าเชื่อถือ',
  'northern_female_soft': 'ผู้หญิงเหนือ - อ่อนโยน',
  'northern_male_calm': 'ผู้ชายเหนือ - สงบ',
  'northeastern_female_lively': 'ผู้หญิงอีสาน - สนุกสนาน',
  'northeastern_male_expressive': 'ผู้ชายอีสาน - มีอารมณ์',
  'central_standard_female': 'ผู้หญิงกลาง - มาตรฐาน',
  'central_standard_male': 'ผู้ชายกลาง - มาตรฐาน',
  'southern_female_strong': 'ผู้หญิงใต้ - มั่นใจ',
  'southern_male_fast': 'ผู้ชายใต้ - เร็ว พลังเยอะ'
};

// Script Style Map (Thai)
const SCRIPT_STYLE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'hook_problem_solution': 'ฮุค → ปัญหา → ทางออก',
  'soft_review_story': 'รีวิวนุ่มๆ - เล่าประสบการณ์',
  'top_3_reasons': '3 เหตุผลที่ต้องซื้อ',
  'before_after_case': 'Before/After - เปลี่ยนแปลง',
  'testimonial_case': 'รีวิวจากลูกค้าจริง',
  'faq_answer': 'ถาม-ตอบ FAQ',
  'demo_walkthrough': 'สาธิตทีละขั้นตอน',
  'comparison_competitor': 'เปรียบเทียบคู่แข่ง',
  'educational_value': 'ให้ความรู้ก่อนขาย',
  'hard_offer_close': 'ขายตรง - ปิดการขาย',
  'limited_time_offer': 'โปรจำกัดเวลา - นับถอยหลัง',
  'relatable_situation': 'สถานการณ์ที่เข้าใจได้',
  'data_proof': 'พิสูจน์ด้วยข้อมูล',
  'luxury_brand_story': 'เล่าเรื่องแบรนด์หรู',
  'viral_short_hook': 'ฮุคสั้น - ไวรัล',
  'emotional_pain_point': 'กระตุ้นอารมณ์ - Pain Point',
  'authority_explain': 'ผู้เชี่ยวชาญอธิบาย',
  'myth_busting': 'หักล้างความเชื่อผิดๆ',
  'challenge_style': 'ท้าทาย - ทดลอง',
  'series_episode': 'ซีรีส์ต่อเนื่อง - ตอนต่อตอน'
};

// Thai Art Style Map (NEW)
const THAI_ART_STYLE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'thai_temple_mural': 'จิตรกรรมฝาผนังวัด - ลายไทยประณีต ทองคำ',
  'thai_royal_palace': 'สไตล์ราชวงศ์ - พระราชวัง หรูหรา',
  'thai_lanna': 'ล้านนา - อบอุ่น เรียบง่าย ไม้สัก',
  'thai_modern_fusion': 'ไทยร่วมสมัย - ผสมผสานโมเดิร์น',
  'thai_silk_pattern': 'ลายผ้าไหมไทย - สีสันสดใส',
  'thai_gold_leaf': 'ทองคำเปลว - หรูหรา ประณีต',
  'realistic_ugc': 'UGC สมจริง - ธรรมชาติ ไม่ปรุงแต่ง',
  'cinematic_film': 'ซีนีมาติก - ภาพยนตร์ แสงเงาสวย',
  'anime_thai_cute': 'อนิเมะไทย - น่ารัก คาวาอี้',
  'watercolor_soft': 'สีน้ำ - นุ่มนวล โรแมนติก',
  'neon_cyberpunk': 'นีออน ไซเบอร์พังค์ - ล้ำสมัย',
  'vintage_retro': 'วินเทจ เรโทร - ย้อนยุค',
  'minimalist_clean': 'มินิมอล - สะอาด เรียบง่าย',
  'luxury_editorial': 'หรูหรา Editorial - นิตยสาร'
};

// Dialogue Style Map (NEW)
const DIALOGUE_STYLE_MAP = {
  'ai_auto': 'AI เลือกให้อัตโนมัติ',
  'hard_sell_urgent': 'ขายแรง เร่งด่วน - "หมดแล้วหมดเลย!"',
  'soft_friendly': 'นุ่มนวล เป็นกันเอง - "ลองดูนะคะ"',
  'funny_viral': 'ตลก ไวรัล - เปิดประโยคชวนติดตามแบบสนุก (ห้ามใช้คำว่า เฮ้ย)',
  'expert_trust': 'ผู้เชี่ยวชาญ น่าเชื่อถือ - "จากการทดสอบ..."',
  'fomo_scarcity': 'FOMO กลัวพลาด - "เหลือไม่กี่ชิ้น!"',
  'storytelling_engage': 'เล่าเรื่อง - "รู้มั้ยว่า..."',
  'question_hook': 'ตั้งคำถาม - "เคยเจอปัญหานี้มั้ย?"',
  'challenge_dare': 'ท้าทาย - "ไม่เชื่อลองดู!"',
  'emotional_touch': 'กระตุ้นอารมณ์ - "คิดถึงคนที่รัก..."',
  'comparison_shock': 'เปรียบเทียบ ช็อค - "ต่างกันขนาดนี้!"',
  'secret_reveal': 'เปิดเผยความลับ - "ไม่เคยบอกใคร..."',
  'trend_follow': 'ตามเทรนด์ - "ทุกคนกำลังพูดถึง..."',
  'real_review': 'รีวิวจริง - "ใช้มา 3 เดือน..."',
  'countdown_pressure': 'นับถอยหลัง - "เหลืออีก 10 ชิ้น!"'
};

// Product Category Map (Thai) — ให้ user เลือกหมวดสินค้าเอง
const PRODUCT_CATEGORY_MAP = {
  'auto_detect': 'ตรวจจับอัตโนมัติ (AI วิเคราะห์จากชื่อสินค้า)',
  'fashion': '👗 เสื้อผ้า / แฟชั่น (เน้นการเคลื่อนไหว ผิวสัมผัสผ้า)',
  'shoes': '👟 รองเท้า (เน้นพื้นผิวจริง มุมมองระดับสายตา)',
  'bags': '👜 กระเป๋า (วางแบบไม่ตั้งใจ เทียบขนาดกับคน)',
  'beauty': '💄 สกินแคร์ / เครื่องสำอาง (เนื้อสัมผัส ผิวสุขภาพดี)',
  'home_gadget': '🏠 ของใช้ในบ้าน / Gadget (บริบทการใช้งานจริง)',
  'food': '🍽️ อาหาร / เครื่องดื่ม / อาหารเสริม (น่าทาน เข้าถึงง่าย)',
  'accessory_watch': '⌚ เครื่องประดับ / นาฬิกา (แสงเงา สัดส่วนสวมใส่)',
  'tech': '📱 อิเล็กทรอนิกส์ / เทคโนโลยี (ฟีเจอร์ การใช้งาน)',
  'morning_routine': '🌅 กิจวัตรยามเช้า (สดใส ส่วนหนึ่งของชีวิตดี)',
  'in_use': '🤲 กำลังจะใช้ / ถืออยู่ (มือถือสินค้า น่าเชื่อถือ)',
  'on_the_go': '🏃 พกพาไปทุกที่ (สะดวก ไลฟ์สไตล์แอคทีฟ)'
};

// Scene Config for 8s vs 16s
const SCENE_CONFIG = {
  8: { 
    minScenes: 2, 
    maxScenes: 3, 
    style: 'quick_sell',
    description: 'สั้น กระชับ ฮุคแรง'
  },
  16: { 
    minScenes: 4, 
    maxScenes: 6, 
    style: 'storytelling',
    description: 'เล่าเรื่อง มีเนื้อหา'
  }
};

const HOOK_CATEGORY_MAP = {
  'auto': '🤖 AI เลือกให้อัตโนมัติ',
  'FOMO': '🔥 FOMO & Flash Sale (กลัวพลาด)',
  'AUTHENTIC': '👯‍♀️ Authentic Vibe (เพื่อนป้ายยา)',
  'OBSESSION': '👑 Scarcity & Obsession (อวยยศ)',
  'CURIOSITY': '🤯 Curiosity Gap & Shock (ช็อก)'
};

// Dropdown Options (using Maps)
const DROPDOWN_OPTIONS = {
  videoStyle: Object.keys(VIDEO_STYLE_MAP),
  character: Object.keys(CHARACTER_STYLE_MAP),
  background: Object.keys(BACKGROUND_STYLE_MAP),
  speakingStyle: Object.keys(SPEAKING_STYLE_MAP),
  voiceType: Object.keys(VOICE_TONE_MAP),
  scriptStyle: Object.keys(SCRIPT_STYLE_MAP),
  thaiArtStyle: Object.keys(THAI_ART_STYLE_MAP),
  dialogueStyle: Object.keys(DIALOGUE_STYLE_MAP),
  productCategory: Object.keys(PRODUCT_CATEGORY_MAP),
  hookCategory: Object.keys(HOOK_CATEGORY_MAP)
};

// Get description for dropdown value
function getStyleDescription(field, value) {
  const maps = {
    videoStyle: VIDEO_STYLE_MAP,
    character: CHARACTER_STYLE_MAP,
    background: BACKGROUND_STYLE_MAP,
    speakingStyle: SPEAKING_STYLE_MAP,
    voiceType: VOICE_TONE_MAP,
    scriptStyle: SCRIPT_STYLE_MAP,
    thaiArtStyle: THAI_ART_STYLE_MAP,
    dialogueStyle: DIALOGUE_STYLE_MAP,
    productCategory: PRODUCT_CATEGORY_MAP,
    hookCategory: HOOK_CATEGORY_MAP
  };
  return maps[field]?.[value] || value;
}

// Product Status
const PRODUCT_STATUS = {
  pending: { label: 'รอดำเนินการ', color: 'secondary' },
  analyzing: { label: 'กำลังวิเคราะห์', color: 'warning' },
  generating: { label: 'กำลังสร้าง', color: 'info' },
  processing: { label: '🔄 กำลังทำ', color: 'warning' },
  completed: { label: 'เสร็จสิ้น', color: 'success' },
  posted: { label: '✅ สำเร็จ', color: 'success' },
  failed: { label: '❌ ล้มเหลว', color: 'danger' },
  skipped: { label: '⏭️ ข้าม', color: 'secondary' },
  error: { label: 'ผิดพลาด', color: 'danger' }
};

// ==================== PROMPT TEMPLATES ====================
// ==================== IMAGE PROMPT TEMPLATES ====================

const IMAGE_PROMPT_TEMPLATE = `[ART_STYLE_PLACEHOLDER]. [CHARACTER_PLACEHOLDER] is featured in a high-quality lifestyle environment suitable for the reference product's usage. The background context should be dynamic and varied, determined by the product itself. The background is blurred to keep focus on the subject. The character is positioned slightly lower in the frame to leave empty space at the top for text header. The character is holding or presenting the reference product in an engaging, enthusiastic manner suitable to the product's size and weight.

High quality, 4k, sharp focus on the product.

Add a professional graphic design text overlay positioned strictly at the top center of the frame (Header/Banner style).
The H1 headline [H1_PLACEHOLDER]
and H2 subtitle [H2_PLACEHOLDER]

should be rendered in a typography style and color palette that automatically matches the product's packaging. The text must be placed at the very top edge, clear of the character's face, using a layout that looks like a video title or headline.

Background style hint: [BACKGROUND_PLACEHOLDER]

⚠️ CRITICAL: Never render the literal text "H1" or "H2" in the image. Only render the actual headline content provided in the placeholders. The words "H1" and "H2" are just labels - display only the Thai text that follows them.

[VARIATION_PLACEHOLDER]`;

const IMAGE_PROMPT_TEMPLATE_NO_TEXT = `[ART_STYLE_PLACEHOLDER]. [CHARACTER_PLACEHOLDER] is featured in a high-quality lifestyle environment suitable for the reference product's usage. The background context should be dynamic and varied, determined by the product itself. The background is blurred to keep focus on the subject. The character is holding or presenting the reference product in an engaging, enthusiastic manner suitable to the product's size and weight.

High quality, 4k, sharp focus on the product.

Background style hint: [BACKGROUND_PLACEHOLDER]

[VARIATION_PLACEHOLDER]`;

// ==================== IMAGE VARIATIONS ====================

const TIME_VARIATIONS = [
  'บรรยากาศตอนเช้าสดใส',
  'แสงกลางวันสว่างไสว',
  'บรรยากาศตอนบ่ายสบายๆ',
  'แสงเย็นอบอุ่น',
  'บรรยากาศตอนค่ำโรแมนติก',
  'แสงธรรมชาตินุ่มนวล',
  'บรรยากาศสดใส',
  'แสง soft light',
  'บรรยากาศตอนเช้ามืด',
  'แสงทอง golden hour'
];

const MOOD_VARIATIONS = [
  'บรรยากาศสดใสร่าเริง',
  'อารมณ์ผ่อนคลาย',
  'บรรยากาศกระตือรือร้น',
  'อารมณ์อบอุ่นเป็นกันเอง',
  'บรรยากาศมีชีวิตชีวา',
  'อารมณ์สงบเยือกเย็น',
  'บรรยากาศมั่นใจ',
  'อารมณ์สนุกสนาน',
  'บรรยากาศเป็นมิตร',
  'อารมณ์น่าตื่นเต้น'
];

const CAMERA_VARIATIONS = [
  'มุมกล้องใกล้ชิด',
  'มุมกล้องกว้าง',
  'มุมกล้องสูง',
  'มุมกล้องเตี้ย',
  'มุมกล้องปกติระดับสายตา',
  'โฟกัสที่สินค้าชัดเจน',
  'พื้นหลังเบลอสวย',
  'องค์ประกอบสมดุล'
];

// ==================== VIDEO PROMPT STEP 1 (8วิ — Frame_to_Video) ====================

const VIDEO_PROMPT_STEP1_VARIATIONS = [
  `The person shown in the reference image begins an enthusiastic product introduction to the camera. Match the voice to the person's appearance and gender. The person leans slightly forward with genuine excitement, making direct eye contact with the camera while holding the reference product confidently. High energy opening tone, as if starting a longer story about the product. Natural movement. Keep the camera relatively stable to ensure the text header at the top remains visible and readable.

⚠️ TEXT / FONT PRESERVATION (CRITICAL — MUST OBEY):
- DO NOT change, modify, animate, morph, re-render, or distort ANY text that appears in the reference image.
- The text overlay (headline, subtitle) MUST remain EXACTLY as-is: same font, same size, same color, same position, same language.
- Treat all on-screen text as a FROZEN STATIC LAYER — it must not move, wobble, fade, resize, or change in any way.
- If the text is in Thai, it MUST stay in Thai with the exact same characters. DO NOT re-generate or re-type the text.

AUDIO / SPEECH (CRITICAL):
- LANGUAGE: The character MUST speak in Thai only. DO NOT speak English or any other language.
- Match voice gender to the character's appearance
- Clear Thai pronunciation, native Thai tone, natural speaking speed`
];

function getRandomVideoPromptStep1() {
  return VIDEO_PROMPT_STEP1_VARIATIONS[Math.floor(Math.random() * VIDEO_PROMPT_STEP1_VARIATIONS.length)];
}

const VIDEO_PROMPT_STEP1_AUDIO = ``; // audio rules already embedded in prompt_text above

const VIDEO_FONT_FREEZE_RULE = `\n\n⚠️ TEXT / FONT PRESERVATION (CRITICAL — MUST OBEY):\n- DO NOT change, modify, animate, morph, re-render, or distort ANY text that appears in the image/video.\n- All text overlays MUST remain EXACTLY as-is: same font, same size, same color, same position, same language.\n- Treat all on-screen text as a FROZEN STATIC LAYER — no movement, no wobble, no fade, no resize.\n- Thai text MUST stay in Thai with the exact same characters. DO NOT re-generate or re-type the text.`;

const VIDEO_PROMPT_STEP1 = {
  step: 2,
  action: "Frame_to_Video",
  tool: "VEO 3.1",
  prompt_text: VIDEO_PROMPT_STEP1_VARIATIONS[0],
  dialogue_script: "[SPEECH1_PLACEHOLDER]",
  technical_settings: {
    seed: 4294967295,
    consistency_mode: "strict_character_lock",
    camera_movement: "static_with_handheld_shake",
    negative_prompt: "English speech, wrong gender voice, text distortions, morphing text, font changes, font animation, changing font, text re-rendering, text wobble, text resize, subtitles, captions, watermarks, logos, graphical elements, blurry text, UI elements",
    audio_mode: "speech_only",
    audio_negative_prompt: "English, foreign language, music, background music, instrumental, ambient noise, sound effects, melody, wrong gender voice, male voice when female selected, female voice when male selected"
  }
};

// ==================== VIDEO PROMPT STEP 2 (Extend — 16วิ) ====================

const VIDEO_PROMPT_STEP2_VARIATIONS = [
  `Visually continue the scene seamlessly. The character MUST speak in Thai only. Audio: The person immediately begins the new dialogue line exactly at the start of this clip, with zero overlap or repetition from the previous dialogue. Match the voice to the person's appearance and gender from the previous clip. The character MUST speak in Thai only. The person interacts with the product features (e.g., pointing at the ports, pressing a button, or showing the sleek design) to demonstrate usage, tilting it towards the camera lens. Then looks back at the camera with a satisfied, convincing nod. High energy tone. Maintain camera framing to keep the top header visible.

⚠️ TEXT / FONT PRESERVATION (CRITICAL — MUST OBEY):
- DO NOT change, modify, animate, morph, re-render, or distort ANY text that appears in the video.
- All text overlays MUST remain EXACTLY as-is: same font, same size, same color, same position, same language.
- Treat all on-screen text as a FROZEN STATIC LAYER — it must not move, wobble, fade, resize, or change in any way.
- If the text is in Thai, it MUST stay in Thai with the exact same characters. DO NOT re-generate or re-type the text.`
];

function getRandomVideoPromptStep2() {
  return VIDEO_PROMPT_STEP2_VARIATIONS[Math.floor(Math.random() * VIDEO_PROMPT_STEP2_VARIATIONS.length)];
}

const VIDEO_PROMPT_STEP2 = {
  step: 3,
  action: "Extend_Video",
  tool: "VEO 3.1",
  prompt_text: VIDEO_PROMPT_STEP2_VARIATIONS[0],
  dialogue_script: "[SPEECH2_PLACEHOLDER]",
  technical_settings: {
    seed: 4294967295,
    reference_mode: "extend_previous_clip",
    voice_consistency: "match_previous_clip_tone",
    camera_movement: "static_with_handheld_shake",
    negative_prompt: "English speech, wrong gender voice, text distortions, morphing text, font changes, font animation, changing font, text re-rendering, text wobble, text resize, subtitles, captions, watermarks, logos, graphical elements, blurry text, UI elements",
    audio_mode: "speech_only",
    audio_negative_prompt: "English, foreign language, music, background music, instrumental, ambient noise, sound effects, melody, wrong gender voice, male voice when female selected, female voice when male selected"
  }
};

// ==================== UGC CREATIVE SCENE TEMPLATES (AutoPost Alternative) ====================
// สำหรับ Custom Prompt ที่ต้องการฉากสร้างสรรค์ (เช่น ซอมบี้, ซาฟารี, ปีกเครื่องบิน)
// ระบบจะแทนที่ placeholders: [PRODUCT_NAME], [PRODUCT_DESC], [SCENE_STYLE], [SCENE_ACTION],
// [SCENE_DETAILS], [CHARACTER_DESC], [H1_PLACEHOLDER], [SCENE_BG], [SHOT_TYPE], [SPEECH_PLACEHOLDER]

const CREATIVE_SCENE_IMAGE_TEMPLATE = `สร้างภาพโฆษณาสินค้ามืออาชีพ สินค้า[PRODUCT_NAME] [PRODUCT_DESC]ตามภาพที่แนบไป สไตล์[SCENE_STYLE] ภาพรีวิวสินค้าขณะ[SCENE_ACTION] [SCENE_DETAILS] REAL HUMAN PHOTO มี[CHARACTER_DESC] ใช้งานสินค้า ใส่ข้อความภาษาไทยบนภาพว่า"[H1_PLACEHOLDER]" ฉาก[SCENE_BG] ถ่าย[SHOT_TYPE] single image, no collage, no multiple panels, no split screen Use the exact product appearance from the attached reference image (pd-product.png). The bold text overlay MUST be in Thai language (ภาษาไทย).`;

const CREATIVE_SCENE_VIDEO_TEMPLATE = `[CHARACTER_DESC]พูดขายสินค้า [PRODUCT_NAME] [PRODUCT_DESC] [SCENE_ACTION] ถือสินค้าโชว์ บทพูดไทย "[SPEECH_PLACEHOLDER]" มุมกล้องตั้งนิ่งจนจบคลิป ใช้ฉากและการจัดวางตามภาพที่แนบ NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, All dialogue is AUDIO ONLY reduce contrast, natural skintone, soft highlights, no oversharpen, low contrast, soft colors, natural tone, film look, soft light`;

// ── Pixar 3D Character Templates (สำหรับตัวละครการ์ตูน 3D) ──

const PIXAR3D_IMAGE_TEMPLATE = `Pixar 3D Animation style, vibrant colors, expressive characters, smooth rendering, Disney-quality lighting. [CHARACTER_NAME] - [CHARACTER_DESC], [POSE_DESC]. Background: [BG_DESC]. [SHOT_TYPE]. [PRODUCT_REFERENCE] No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.

[Character Reference: [CHARACTER_REFS]]`;

const PIXAR3D_VIDEO_TEMPLATE = `ACTION ONLY: [CHARACTER_NAME] [ACTION_DESC], speaking with [VOICE_TYPE], lip movement synced to audio, MUST maintain consistent [VOICE_TYPE] throughout entire clip, do NOT switch voice gender. Only animate the existing characters from the image, do not add new characters or change their appearance. Character says in Thai with [VOICE_TYPE]: "[SPEECH_PLACEHOLDER]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`;

// ── Photorealistic Cinematic Templates (สำหรับฉากถ่ายจริง ASMR / คุณภาพสูง) ──

const CINEMATIC_IMAGE_TEMPLATE = `Photorealistic cinematic style, natural lighting, high detail texture, realistic proportions, movie-quality visuals, 8K resolution. [CAMERA_ANGLE]. [CHARACTER_DESC]. [SCENE_SETUP]. [LIGHTING_DESC].

[Character Reference: [CHARACTER_REFS]]`;

const CINEMATIC_VIDEO_TEMPLATE = `[CHARACTER_DESC] [ACTION_DESC]. [CAMERA_STYLE], [AUDIO_STYLE]. Realistic movement, natural motion. NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, stable form, no morphing`;

// ── Storybook / Voiceover Narration Templates (สำหรับนิทาน / เล่าเรื่อง) ──

const STORYBOOK_IMAGE_TEMPLATE = `[VISUAL_STYLE]. [CHARACTER_NAME] - [CHARACTER_DESC]. Background: [BG_DESC]. [SHOT_TYPE]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.

[Character Reference: [CHARACTER_REFS]]`;

const STORYBOOK_VIDEO_TEMPLATE = `ACTION ONLY: [CHARACTER_NAME] [ACTION_DESC]. [NARRATION_STYLE]., with [VOICE_TYPE] voiceover narration, MUST use [VOICE_TYPE] only, do NOT switch to different voice gender, NO lip sync, character does NOT speak, background narration only. Thai voiceover narrated by [VOICE_TYPE] says: "[SPEECH_PLACEHOLDER]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`;

// ==================== CONTENT GENERATION PROMPTS ====================

// Normal Mode (8วิ) — มี H1/H2, speech 1 ตัว
const CONTENT_PROMPT_NORMAL = `คุณเป็นผู้เชี่ยวชาญด้านการสร้างเนื้อหา TikTok Shop สำหรับขายสินค้า

งานของคุณคือ:
1. คิดคำพาดหัว (H1, H2) - ประโยคสั้นเด็ดๆ ที่ดึงดูดความสนใจ
   - H1: คำสั้นๆ ที่โดดเด่น เช่น "1 แถม 1", "ลดราคา 50%", "ของมันต้องมี"
   - H2: ชื่อสินค้าหรือจุดเด่นสั้นๆ

2. สร้าง Caption สำหรับ TikTok - ดึงดูดใจ มี emoji และ hashtag

3. สร้างคำพูดสำหรับวิดีโอ (~8 วินาที) - พูดเชียร์ขายสินค้าเป็นภาษาไทย

4. สร้าง CTA (Call to Action) สั้นๆ ไม่เกิน 30 ตัวอักษร

⚠️ กฎสำคัญ:
- ห้ามใช้คำพาดหัวซ้ำกับที่เคยใช้แล้ว
- คิดคำใหม่ที่สร้างสรรค์และแตกต่าง
- สไตล์รอบนี้: [STYLE_PLACEHOLDER]

⚠️ กฎเพศ (สำคัญมาก):
- ถ้าตัวละครเป็นผู้ชาย: ใช้ครับ/นะครับ ห้ามใช้ค่ะ/นะคะ เด็ดขาด
- ถ้าตัวละครเป็นผู้หญิง: ใช้ค่ะ/นะคะ ห้ามใช้ครับ/นะครับ เด็ดขาด
- ห้ามสลับเพศเด็ดขาด

⚠️ กฎ CTA:
- ไม่เกิน 30 ตัวอักษร
- ห้ามใช้ emoji หรือสัญลักษณ์พิเศษทุกชนิด
- ใช้ได้เฉพาะ: ภาษาไทย ภาษาอังกฤษ ตัวเลข และช่องว่าง เท่านั้น
- ห้ามใช้คำที่อาจไม่เป็นจริง เช่น: "ส่งฟรี", "ฟรีค่าส่ง", "ส่งฟรีทั่วไทย", "รับประกันคืนเงิน", "ของแท้100%"
- ตัวอย่าง: "สั่งเลยวันนี้", "ของดีราคาถูก", "กดสั่งซื้อเลย"

ตอบเป็น JSON เท่านั้น (fields: h1, h2, caption, speech, cta, hookId)`;

// Extend Mode (16วิ) — มี H1/H2, speech + speech2
const CONTENT_PROMPT_EXTEND = `คุณเป็นผู้เชี่ยวชาญด้านการสร้างเนื้อหา TikTok Shop สำหรับขายสินค้า

งานของคุณคือ:
1. คิดคำพาดหัว (H1, H2) - ประโยคสั้นเด็ดๆ ที่ดึงดูดความสนใจ
   - H1: คำสั้นๆ ที่โดดเด่น เช่น "1 แถม 1", "ลดราคา 50%", "ของมันต้องมี"
   - H2: ชื่อสินค้าหรือจุดเด่นสั้นๆ

2. สร้าง Caption สำหรับ TikTok - ดึงดูดใจ มี emoji และ hashtag

3. สร้างคำพูดสำหรับวิดีโอ ส่วนที่ 1 (~8 วินาที) - พูดเชียร์ขายสินค้าเป็นภาษาไทย

4. สร้างคำพูดสำหรับวิดีโอ ส่วนที่ 2 (~8 วินาที) - ต่อจากส่วนแรก พูดเพิ่มเติมเกี่ยวกับจุดเด่น โปรโมชั่น หรือเชิญชวนให้ซื้อ

5. สร้าง CTA (Call to Action) สั้นๆ ไม่เกิน 30 ตัวอักษร

⚠️ กฎสำคัญ:
- ห้ามใช้คำพาดหัวซ้ำกับที่เคยใช้แล้ว
- คิดคำใหม่ที่สร้างสรรค์และแตกต่าง
- สไตล์รอบนี้: [STYLE_PLACEHOLDER]
- speech และ speech2 ต้องต่อเนื่องกัน เหมือนพูดคุยเรื่องเดียวกัน

⚠️ กฎเพศ (สำคัญมาก):
- ถ้าตัวละครเป็นผู้ชาย: ใช้ครับ/นะครับ ห้ามใช้ค่ะ/นะคะ เด็ดขาด
- ถ้าตัวละครเป็นผู้หญิง: ใช้ค่ะ/นะคะ ห้ามใช้ครับ/นะครับ เด็ดขาด
- ห้ามสลับเพศเด็ดขาด

⚠️ กฎ CTA:
- ไม่เกิน 30 ตัวอักษร
- ห้ามใช้ emoji หรือสัญลักษณ์พิเศษทุกชนิด
- ใช้ได้เฉพาะ: ภาษาไทย ภาษาอังกฤษ ตัวเลข และช่องว่าง เท่านั้น
- ห้ามใช้คำที่อาจไม่เป็นจริง เช่น: "ส่งฟรี", "ฟรีค่าส่ง", "ส่งฟรีทั่วไทย", "รับประกันคืนเงิน", "ของแท้100%"
- ตัวอย่าง: "สั่งเลยวันนี้", "ของดีราคาถูก", "กดสั่งซื้อเลย"

ตอบเป็น JSON เท่านั้น (fields: h1, h2, caption, speech, speech2, cta, hookId)`;

// No Text Mode (8วิ) — ไม่มี H1/H2
const CONTENT_PROMPT_NO_TEXT = `คุณเป็นผู้เชี่ยวชาญด้านการสร้างเนื้อหา TikTok Shop สำหรับขายสินค้า

งานของคุณคือ:
1. สร้าง Caption สำหรับ TikTok - ดึงดูดใจ มี emoji และ hashtag
2. สร้างคำพูดสำหรับวิดีโอ (~8 วินาที) - พูดเชียร์ขายสินค้าเป็นภาษาไทย
3. สร้าง CTA (Call to Action) สั้นๆ ไม่เกิน 30 ตัวอักษร

⚠️ กฎเพศ (สำคัญมาก):
- ถ้าตัวละครเป็นผู้ชาย: ใช้ครับ/นะครับ ห้ามใช้ค่ะ/นะคะ เด็ดขาด
- ถ้าตัวละครเป็นผู้หญิง: ใช้ค่ะ/นะคะ ห้ามใช้ครับ/นะครับ เด็ดขาด

⚠️ กฎ CTA:
- ไม่เกิน 30 ตัวอักษร
- ห้ามใช้ emoji หรือสัญลักษณ์พิเศษทุกชนิด
- ใช้ได้เฉพาะ: ภาษาไทย ภาษาอังกฤษ ตัวเลข และช่องว่าง เท่านั้น
- ห้ามใช้คำที่อาจไม่เป็นจริง เช่น: "ส่งฟรี", "ฟรีค่าส่ง", "รับประกันคืนเงิน", "ของแท้100%"

ตอบเป็น JSON เท่านั้น (fields: caption, speech, cta, hookId)`;

// No Text Extend Mode (16วิ) — ไม่มี H1/H2, มี speech + speech2
const CONTENT_PROMPT_NO_TEXT_EXTEND = `คุณเป็นผู้เชี่ยวชาญด้านการสร้างเนื้อหา TikTok Shop สำหรับขายสินค้า

งานของคุณคือ:
1. สร้าง Caption สำหรับ TikTok - ดึงดูดใจ มี emoji และ hashtag
2. สร้างคำพูดสำหรับวิดีโอ ส่วนที่ 1 (~8 วินาที) - พูดเชียร์ขายสินค้าเป็นภาษาไทย
3. สร้างคำพูดสำหรับวิดีโอ ส่วนที่ 2 (~8 วินาที) - ต่อจากส่วนแรก พูดเพิ่มเติมเกี่ยวกับจุดเด่นหรือเชิญชวนให้ซื้อ
4. สร้าง CTA (Call to Action) สั้นๆ ไม่เกิน 30 ตัวอักษร

⚠️ กฎเพศ (สำคัญมาก):
- ถ้าตัวละครเป็นผู้ชาย: ใช้ครับ/นะครับ ห้ามใช้ค่ะ/นะคะ เด็ดขาด
- ถ้าตัวละครเป็นผู้หญิง: ใช้ค่ะ/นะคะ ห้ามใช้ครับ/นะครับ เด็ดขาด
- speech และ speech2 ต้องต่อเนื่องกัน เหมือนพูดคุยเรื่องเดียวกัน

⚠️ กฎ CTA:
- ไม่เกิน 30 ตัวอักษร
- ห้ามใช้ emoji หรือสัญลักษณ์พิเศษทุกชนิด
- ใช้ได้เฉพาะ: ภาษาไทย ภาษาอังกฤษ ตัวเลข และช่องว่าง เท่านั้น
- ห้ามใช้คำที่อาจไม่เป็นจริง เช่น: "ส่งฟรี", "ฟรีค่าส่ง", "รับประกันคืนเงิน", "ของแท้100%"

ตอบเป็น JSON เท่านั้น (fields: caption, speech, speech2, cta, hookId)`;

// ★ Helper: บังคับจำนวนคำ H1/H2 — ตัดถ้าเกิน, ไม่แก้ถ้าอยู่ในช่วง ★
function enforceHeadlineWordCount(text, minWords, maxWords) {
  if (!text) return text;
  const words = text.trim().split(/\s+/);
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(' ');
  }
  return text.trim();
}

/** แปลง hookId จาก API (ตัวเลข / string) → number หรือ null */
function normalizeAutopostHookId(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * ซิงค์ hookId ลง queue item สำหรับเทส/Flow: ค่าจาก video JSON ชนะ content JSON ถ้าทั้งคู่มี
 * ตั้ง item.hookId / item.selectedHookId เป็นค่าที่ใช้จริง + เก็บ hookIdFromVideo / hookIdFromContent แยก
 */
function reconcileAutopostHookIdOnItem(item) {
  if (!item || !item.id) return;
  let fromVideo = null;
  if (item.videoPromptData != null && typeof item.videoPromptData === 'object') {
    fromVideo = normalizeAutopostHookId(item.videoPromptData.hookId);
    if (fromVideo != null) item.hookIdFromVideo = fromVideo;
    else delete item.hookIdFromVideo;
  }
  const fromContent = normalizeAutopostHookId(item.hookIdFromContent);
  if (fromContent != null) item.hookIdFromContent = fromContent;
  const canonical = fromVideo ?? fromContent ?? null;
  if (canonical != null) {
    item.hookId = canonical;
    item.selectedHookId = canonical;
  }
  if (fromVideo != null && fromContent != null && fromVideo !== fromContent) {
    addFlowLog(item.id, `⚠️ hookId ไม่ตรงกัน: เนื้อหา=${fromContent} วิดีโอ=${fromVideo} → ใช้ค่าจากวิดีโอ`, 'warning');
  }
}

/** ลบคำต้องห้ามระดับลูกค้า (เฮ้ย / YourShop ฯลฯ) จากข้อความและบทพูดที่เก็บใน queue */
function sanitizeAutopostItemHardBanned(item) {
  if (!item) return;
  const s = stripHardBannedPhrases;
  if (item.h1Headline) item.h1Headline = s(item.h1Headline);
  if (item.h2Subtitle) item.h2Subtitle = s(item.h2Subtitle);
  if (item.caption) item.caption = s(item.caption);
  if (item.cta) item.cta = s(item.cta);
  if (item.shortDialogue) item.shortDialogue = s(item.shortDialogue);
  if (item.longDialogue) item.longDialogue = s(item.longDialogue);
  if (item.continuationDialogue) item.continuationDialogue = s(item.continuationDialogue);
  if (typeof item.speech2 === 'string') item.speech2 = s(item.speech2);
  if (item.imagePrompt) item.imagePrompt = s(item.imagePrompt);
  if (item.videoPromptData != null && typeof item.videoPromptData === 'object' && Array.isArray(item.videoPromptData.scenes)) {
    for (const sc of item.videoPromptData.scenes) {
      if (sc.dialogue_th) sc.dialogue_th = s(sc.dialogue_th);
      if (sc.dialogue) sc.dialogue = s(sc.dialogue);
      if (typeof sc.description === 'string') sc.description = s(sc.description);
      if (typeof sc.action === 'string') sc.action = s(sc.action);
      if (typeof sc.scene_name === 'string') sc.scene_name = s(sc.scene_name);
    }
    try {
      item.videoPrompt = JSON.stringify(item.videoPromptData, null, 2);
    } catch (e) { /* ignore */ }
  } else if (typeof item.videoPrompt === 'string' && item.videoPrompt.trim().startsWith('{')) {
    try {
      const o = JSON.parse(item.videoPrompt);
      if (o.scenes && Array.isArray(o.scenes)) {
        for (const sc of o.scenes) {
          if (sc.dialogue_th) sc.dialogue_th = s(sc.dialogue_th);
          if (sc.dialogue) sc.dialogue = s(sc.dialogue);
          if (typeof sc.description === 'string') sc.description = s(sc.description);
          if (typeof sc.action === 'string') sc.action = s(sc.action);
        }
        item.videoPrompt = JSON.stringify(o, null, 2);
        item.videoPromptData = o;
      }
    } catch (e) { /* ignore */ }
  }
  for (const key of ['videoPrompt8', 'videoPrompt16']) {
    if (typeof item[key] !== 'string' || !item[key].trim().startsWith('{')) continue;
    try {
      const o = JSON.parse(item[key]);
      if (typeof o.dialogue_script === 'string') o.dialogue_script = s(o.dialogue_script);
      if (typeof o.prompt_text === 'string') o.prompt_text = s(o.prompt_text);
      item[key] = JSON.stringify(o, null, 2);
    } catch (e) { /* ignore */ }
  }
}

// ★ Helper: สร้าง full prompt message สำหรับส่ง Gemini — รวม product info + gender + style ★
// TODO: USER_PROMPT
function buildContentGenerationPrompt(item, isExtend, gender, style, usedHeadlines) {
  const wantH1 = item.showH1 !== false;
  const wantH2 = item.showH2 !== false;
  const wantText = wantH1 || wantH2;

  let base;
  if (wantText && isExtend) base = CONTENT_PROMPT_EXTEND;
  else if (wantText)        base = CONTENT_PROMPT_NORMAL;
  else if (isExtend)        base = CONTENT_PROMPT_NO_TEXT_EXTEND;
  else                      base = CONTENT_PROMPT_NO_TEXT;

  base = base.replace('[STYLE_PLACEHOLDER]', style || 'สไตล์อิสระ');

  let ctx = `\n\nข้อมูลสินค้า:\n- ชื่อ: ${item.name || 'สินค้า'}`;
  if (item.highlight) ctx += `\n- จุดเด่น: ${item.highlight}`;
  if (item.price)     ctx += `\n- ราคา: ${item.price}`;

  if (gender === 'female')     ctx += `\n\nตัวละครเป็นผู้หญิง → ใช้ค่ะ/นะคะ`;
  else if (gender === 'male')  ctx += `\n\nตัวละครเป็นผู้ชาย → ใช้ครับ/นะครับ`;

  if (usedHeadlines && usedHeadlines.length > 0) {
    ctx += `\n\n⚠️ คำพาดหัวที่เคยใช้แล้ว (ห้ามซ้ำ): ${usedHeadlines.join(', ')}`;
  }

  return base + ctx;
}

// ★ Product Category Detection — ตรวจจับประเภทสินค้าเพื่อปรับ prompt interaction ★
function detectProductCategory(productName) {
  const name = (productName || '').toLowerCase();
  
  // 👗 เสื้อผ้า/แฟชั่น
  const fashionKeywords = /เสื้อ|กางเกง|กระโปรง|ชุด|เดรส|แจ็คเก็ต|jacket|เสื้อยืด|เสื้อเชิ้ต|shirt|t-shirt|tshirt|polo|hoodie|sweater|cardigan|blazer|coat|jeans|pants|shorts|skirt|dress|blouse|top|crop|สูท|suit|uniform|ยูนิฟอร์ม|เสื้อกันหนาว|เลกกิ้ง|legging|บิกินี่|bikini|ชุดว่ายน้ำ|swimsuit|ชุดนอน|pajama|ผ้าพันคอ|scarf|เน็คไท|necktie|tie|vest|เสื้อกั๊ก|romper|jumpsuit|overalls|เอี๊ยม|แฟชั่น|fashion|เครื่องแต่งกาย|apparel|clothing|clothes/;
  
  // 👟 รองเท้า
  const shoesKeywords = /รองเท้า|shoe|sneaker|boot|sandal|slipper|heel|loafer|รองเท้าผ้าใบ|รองเท้าส้นสูง|รองเท้าแตะ|รองเท้าหนัง|รองเท้าบูท|คัชชู|ผ้าใบ|ส้นสูง|ส้นเตี้ย|รองเท้ากีฬา|รองเท้าวิ่ง/;
  
  // 👜 กระเป๋า/เครื่องประดับ
  const accessoryKeywords = /กระเป๋า|bag|handbag|backpack|clutch|wallet|กระเป๋าสตางค์|กระเป๋าเป้|กระเป๋าถือ|กระเป๋าสะพาย|นาฬิกา|watch|แว่น|glasses|sunglasses|สร้อย|necklace|แหวน|ring|ต่างหู|earring|กำไล|bracelet|หมวก|hat|cap|เข็มขัด|belt|ถุงเท้า|sock/;
  
  // 💄 เครื่องสำอาง/ความงาม
  const beautyKeywords = /ครีม|cream|เซรั่ม|serum|โลชั่น|lotion|ลิปสติก|lipstick|lip|แป้ง|powder|foundation|มาสคาร่า|mascara|อายไลเนอร์|eyeliner|บลัชออน|blush|คอนซีลเลอร์|concealer|สกินแคร์|skincare|กันแดด|sunscreen|spf|โทนเนอร์|toner|คลีนเซอร์|cleanser|มอยเจอร์|moisturizer|เมคอัพ|makeup|น้ำหอม|perfume|แชมพู|shampoo|ครีมบำรุง|เครื่องสำอาง|cosmetic|beauty/;
  
  // 🍽️ อาหาร/เครื่องดื่ม
  const foodKeywords = /อาหาร|food|ขนม|snack|เครื่องดื่ม|drink|ชา|tea|กาแฟ|coffee|น้ำผลไม้|juice|วิตามิน|vitamin|อาหารเสริม|supplement|โปรตีน|protein|คอลลาเจน|collagen/;
  
  // 📱 อิเล็กทรอนิกส์/เทคโนโลยี
  const techKeywords = /โทรศัพท์|phone|หูฟัง|earphone|earbuds|headphone|ลำโพง|speaker|tablet|แท็บเล็ต|เคส|case|สายชาร์จ|charger|power bank|กล้อง|camera|smart watch|สมาร์ทวอทช์/;

  if (fashionKeywords.test(name)) return 'fashion';
  if (shoesKeywords.test(name)) return 'shoes';
  if (accessoryKeywords.test(name)) return 'accessory';
  if (beautyKeywords.test(name)) return 'beauty';
  if (foodKeywords.test(name)) return 'food';
  if (techKeywords.test(name)) return 'tech';
  return 'general';
}

// ★ Product Gender Detection — วิเคราะห์เพศเป้าหมายจากชื่อสินค้า เพื่อ lock character + voice ให้ตรง ★
function detectProductGender(productName) {
  const name = (productName || '').toLowerCase();
  
  // 👩 สินค้าผู้หญิงชัดเจน
  const femaleProducts = /กระโปรง|skirt|เดรส|dress|บิกินี่|bikini|ชุดว่ายน้ำผู้หญิง|บรา|bra|สปอร์ตบรา|sports.?bra|ชุดชั้นในสตรี|ชุดชั้นในผู้หญิง|เลกกิ้ง|legging|ถุงน่อง|stocking|pantyhose|ส้นสูง|high.?heel|ลิปสติก|lipstick|มาสคาร่า|mascara|อายไลเนอร์|eyeliner|บลัชออน|blush|เครื่องสำอาง|cosmetic|makeup|เมคอัพ|ชุดคลุมท้อง|maternity|ผ้าอนามัย|sanitary|ชุดเจ้าสาว|wedding.?dress|ชุดราตรี|evening.?gown|เสื้อครอป|crop.?top|ต่างหู|earring|กิ๊บผม|hair.?clip|ที่คาดผม|headband|สาวๆ|ผู้หญิง|women|ladies|สตรี|feminine|เสื้อผู้หญิง|กางเกงผู้หญิง|รองเท้าผู้หญิง|รองเท้าส้นสูง|คัชชู|ชุดผู้หญิง|แฟชั่นผู้หญิง/;
  
  // 👨 สินค้าผู้ชายชัดเจน
  const maleProducts = /เน็คไท|necktie|สูทผู้ชาย|men.?s.?suit|เสื้อเชิ้ตผู้ชาย|men.?s.?shirt|มีดโกน|razor|shaving|โฟมโกนหนวด|aftershave|ชุดผู้ชาย|men.?s|ผู้ชาย|gentleman|เสื้อผู้ชาย|กางเกงผู้ชาย|รองเท้าผู้ชาย|แฟชั่นผู้ชาย|กางเกงสูทผู้ชาย|บ็อกเซอร์|boxer/;
  
  if (femaleProducts.test(name)) return 'female';
  if (maleProducts.test(name)) return 'male';
  return null; // unisex หรือไม่ระบุ
}

// ★ สร้าง Product Interaction Description ตามประเภทสินค้า ★
// TODO: USER_PROMPT
function getProductInteraction(category, productName, isNoPerson) {
  return '';
}

// ★ สร้าง Video Action Description ตามประเภทสินค้า ★
// TODO: USER_PROMPT
function getVideoAction(category, productName, isNoPerson) {
  return '';
}

// ★ Category Image Template — คืน prompt template เฉพาะหมวดสินค้า (Lifestyle Photography) ★
// TODO: USER_PROMPT
function getCategoryImageTemplate(category, productName, modelDesc, settingDesc) {
  return '';
}

// ★ Category Video Action Template — คืน video action เฉพาะหมวดสินค้า (Lifestyle Video) ★
// TODO: USER_PROMPT
function getCategoryVideoAction(category, productName, isNoPerson) {
  return '';
}

// ★ Build Image Prompt — inject ทุก selector เข้าโครงสร้าง prompt โดยตรง (deterministic, เสถียร) ★
function buildImagePrompt(item) {
  const wH1 = item.showH1 !== false;
  const wH2 = item.showH2 !== false;

  let prompt;
  if (wH1 || wH2) {
    prompt = IMAGE_PROMPT_TEMPLATE;
    prompt = prompt.replace('[H1_PLACEHOLDER]', wH1 ? (item.h1Headline || item.headline || item.name || '') : '');
    prompt = prompt.replace('[H2_PLACEHOLDER]', wH2 ? (item.h2Subtitle || item.subtitle || item.highlight || '') : '');
  } else {
    prompt = IMAGE_PROMPT_TEMPLATE_NO_TEXT;
  }

  // ── Art Style (selector: thaiArtStyle) ──
  const artStyle = THAI_ART_STYLE_MAP[item.thaiArtStyle];
  const artStyleText = (artStyle && artStyle !== 'AI เลือกให้อัตโนมัติ')
    ? artStyle
    : 'Realistic photo, UGC style, natural lighting';
  prompt = prompt.replace('[ART_STYLE_PLACEHOLDER]', artStyleText);

  // ── Character (selector: character) ──
  const charDesc = CHARACTER_STYLE_MAP[item.character];
  const charText = (charDesc && charDesc !== 'AI เลือกให้อัตโนมัติ')
    ? charDesc
    : (item.generatedCharacter || 'The provided character');
  prompt = prompt.replace('[CHARACTER_PLACEHOLDER]', charText);

  // ── Background (selector: background) ──
  const bgDesc = BACKGROUND_STYLE_MAP[item.background];
  const bgText = (bgDesc && bgDesc !== 'AI เลือกให้อัตโนมัติ')
    ? bgDesc
    : 'Dynamic background determined by the product context';
  prompt = prompt.replace('[BACKGROUND_PLACEHOLDER]', bgText);

  // ── Clothing detection → swap "holding" to "wearing" ──
  const nameLC = (item.name || '').toLowerCase();
  const isClothing = /เสื้อ|shirt|t-shirt|tshirt|polo|hoodie|sweater|cardigan|blazer|jacket|แจ็คเก็ต|เสื้อยืด|เสื้อเชิ้ต|เสื้อกันหนาว|เสื้อกั๊ก|vest|crop.?top|เสื้อครอป|blouse|top|coat|สูท|suit|กางเกง|pants|jeans|shorts|กางเกงขาสั้น|กางเกงขายาว|กางเกงยีนส์|legging|เลกกิ้ง|jogger/.test(nameLC);
  if (isClothing) {
    prompt = prompt.replace(
      'The character is holding or presenting the reference product in an engaging, enthusiastic manner suitable to the product\'s size and weight.',
      'The character is wearing the reference product as their outfit, styled naturally and fashionably. The clothing fits well and is clearly visible as the main focus. The character poses confidently to showcase how the garment looks when worn.'
    );
  }

  // ── Variation (randomised lighting / mood / camera) ──
  const timeHint = TIME_VARIATIONS[Math.floor(Math.random() * TIME_VARIATIONS.length)];
  const moodHint = MOOD_VARIATIONS[Math.floor(Math.random() * MOOD_VARIATIONS.length)];
  const camHint  = CAMERA_VARIATIONS[Math.floor(Math.random() * CAMERA_VARIATIONS.length)];
  prompt = prompt.replace('[VARIATION_PLACEHOLDER]', `${timeHint}, ${moodHint}, ${camHint}`);

  return prompt;
}

// ★ Build Video Prompt Step 1 (8 วิ) — inject selector ทุกตัวเข้าโครงสร้าง prompt (deterministic) ★
function buildVideoPromptStep1(item, dialogueScript) {
  const dialogue = dialogueScript || item.speech1 || VIDEO_PROMPT_STEP1.dialogue_script;
  let basePrompt = getRandomVideoPromptStep1() + VIDEO_PROMPT_STEP1_AUDIO;

  // ── Selector blocks ที่ถูก inject เข้า prompt โดยตรง ──
  const selectorDirectives = _buildVideoSelectorBlock(item);
  if (selectorDirectives) {
    basePrompt += `\n\n${selectorDirectives}`;
  }

  const promptWithDialogue = dialogue
    ? basePrompt + `\n\nDIALOGUE / SPEECH CONTENT (CRITICAL — The character MUST say exactly this in Thai):\n"${dialogue}"`
    : basePrompt;
  return { ...VIDEO_PROMPT_STEP1, prompt_text: promptWithDialogue, dialogue_script: dialogue };
}

// ★ Build Video Prompt Step 2 (Extend 16 วิ) — inject selector เช่นเดียวกัน ★
function buildVideoPromptStep2(item, dialogueScript) {
  const dialogue = dialogueScript || item.speech2 || VIDEO_PROMPT_STEP2.dialogue_script;
  let basePrompt = getRandomVideoPromptStep2();

  const selectorDirectives = _buildVideoSelectorBlock(item);
  if (selectorDirectives) {
    basePrompt += `\n\n${selectorDirectives}`;
  }

  const promptWithDialogue = dialogue
    ? basePrompt + `\n\nDIALOGUE / SPEECH CONTENT (CRITICAL — The character MUST continue saying exactly this in Thai):\n"${dialogue}"`
    : basePrompt;
  return { ...VIDEO_PROMPT_STEP2, prompt_text: promptWithDialogue, dialogue_script: dialogue };
}

// ★ Helper: สร้าง selector directive block สำหรับ video prompt — deterministic, เสถียร ★
function _buildVideoSelectorBlock(item) {
  const lines = [];

  // Voice Type
  const voiceDesc = VOICE_TONE_MAP[item.voiceType];
  if (voiceDesc && voiceDesc !== 'AI เลือกให้อัตโนมัติ') {
    const vk = (item.voiceType || '');
    const isFemale = vk.includes('female');
    const isMale = vk.includes('male') && !vk.includes('female');
    if (isFemale) lines.push(`VOICE GENDER: Female Thai voice. ${voiceDesc}. ห้ามใช้เสียงผู้ชายเด็ดขาด`);
    else if (isMale) lines.push(`VOICE GENDER: Male Thai voice. ${voiceDesc}. ห้ามใช้เสียงผู้หญิงเด็ดขาด`);
    else lines.push(`VOICE TONE: ${voiceDesc}`);
  }

  // Speaking Style
  const speakDesc = SPEAKING_STYLE_MAP[item.speakingStyle];
  if (speakDesc && speakDesc !== 'AI เลือกให้อัตโนมัติ') {
    lines.push(`SPEAKING STYLE: ${speakDesc}`);
  }

  // Video Style
  const vidDesc = VIDEO_STYLE_MAP[item.videoStyle];
  if (vidDesc && vidDesc !== 'สไตล์มาตรฐาน - สะอาด เรียบง่าย' && vidDesc !== 'AI เลือกให้อัตโนมัติ') {
    lines.push(`VISUAL STYLE: ${vidDesc}`);
  }

  // Script Style
  const scriptDesc = SCRIPT_STYLE_MAP[item.scriptStyle];
  if (scriptDesc && scriptDesc !== 'AI เลือกให้อัตโนมัติ') {
    lines.push(`SCRIPT STRUCTURE: ${scriptDesc}`);
  }

  // Dialogue Style
  const dlgDesc = DIALOGUE_STYLE_MAP[item.dialogueStyle];
  if (dlgDesc && dlgDesc !== 'AI เลือกให้อัตโนมัติ') {
    lines.push(`DIALOGUE STYLE: ${dlgDesc}`);
  }

  return lines.length > 0
    ? `USER SELECTOR DIRECTIVES (MUST follow):\n${lines.join('\n')}`
    : '';
}

// ==================== PROMPT CHECKER - TikTok Shop Policy Validator ====================
// ★ USER จะวาง prompt ใหม่ที่นี่ ★

const PROMPT_CHECKER_TEMPLATE = ``;

// Prompt Checker Modes
// TODO: USER_PROMPT
const PROMPT_CHECKER_MODES = {
  strict: {
    name: 'Strict TikTok Shop',
    description: 'ตรวจสอบตามนโยบาย TikTok Shop อย่างเข้มงวด',
    prompt: ''
  },
  balanced: {
    name: 'Balanced (Social + TikTok)',
    description: 'ตรวจสอบทั้ง TikTok Shop และ Social Media ทั่วไป',
    prompt: ''
  },
  conversion: {
    name: 'Conversion-Safe',
    description: 'ปลอดภัยแต่ยังคงพลังการขาย',
    prompt: ''
  },
  thai: {
    name: 'Thai Market Safe',
    description: 'ตรวจสอบตามกฎหมายไทยและ TikTok Thailand',
    prompt: ''
  }
};

// ==================== GOOGLE FLOW POLICY CHECKER ====================
// ★ User-defined custom forbidden words (loaded from chrome.storage.local) ★
async function loadCustomForbiddenWords() {
  try {
    const result = await chrome.storage.local.get('customForbiddenWords');
    if (result.customForbiddenWords && Array.isArray(result.customForbiddenWords)) {
      userCustomForbiddenWords = result.customForbiddenWords;
    }
  } catch (e) { console.log('[Settings] Error loading custom forbidden words:', e); }
}
loadCustomForbiddenWords();

function getEffectiveForbiddenWords() {
  return [...GOOGLE_FLOW_FORBIDDEN_WORDS, ...userCustomForbiddenWords];
}

// คำต้องห้ามที่ทำให้ Google Flow Audio Generation ล้มเหลว
// TODO: USER_PROMPT
const GOOGLE_FLOW_FORBIDDEN_WORDS = [];

// คำที่ควรแทนที่ (ไม่ห้ามแต่ควรเปลี่ยน)
// TODO: USER_PROMPT
const GOOGLE_FLOW_WORD_REPLACEMENTS = {};

// Function to sanitize dialogue for Google Flow audio generation
// TODO: USER_PROMPT
function sanitizeDialogueForGoogleFlow(dialogue) {
  return dialogue;
}

// ★ Regex patterns ที่บรรยายร่างกาย → แทนที่ด้วยคำ fashion-safe ★
// TODO: USER_PROMPT
const BODY_DESC_SAFE_REWRITES = [];

// ★ Sanitize character description — ลบคำบรรยายร่างกายที่ AI อาจสร้างมา + hard banned ★
// TODO: USER_PROMPT
function sanitizeCharacterDesc(desc) {
  return desc;
}

// ★ Sanitize ENTIRE video prompt (not just dialogue) for Google Flow policy ★
// ★ Audio keywords — แปลง "คำรุนแรง/ผิด policy" → "คำ soft ที่ Google Flow ยอมรับ" ★
// ไม่ตัดทิ้ง แต่เปลี่ยนเป็นคำอ่อนๆ ให้ยังมีบรรยากาศเสียงคลอได้
// TODO: USER_PROMPT
const AUDIO_SAFE_REPLACEMENTS = {};

// TODO: USER_PROMPT
function sanitizeVideoPrompt(prompt) {
  return prompt || '';
}

/**
 * V1.0.9-style `applyGoogleFlowPolicyCommandGuard` — ลดคำ/รูปแบบที่ดึงให้โมเดลหลุด policy ก่อนส่งเข้า Storymode
 * (ไม่ทำเท่า sanitizeVideoPrompt เต็มรูปแบบ — เก็บ intent ของ user ไว้)
 */
// TODO: USER_PROMPT
function applyGoogleFlowUserInputGuard(text) {
  return text;
}

// ★ v3.23: Pre-flight Outbound Policy Screen — ตรวจ prompt สุดท้ายก่อนส่ง Google Flow ★
// เข้มกว่า V1.0.9 ที่ตรวจเฉพาะ inbound — ระบบนี้ตรวจทั้ง inbound (user input) + outbound (generated prompt)
// TODO: USER_PROMPT
function preFlightPolicyScreen(prompt) {
  return prompt || '';
}

// Function to check script against TikTok policy
async function checkScriptPolicy(script, mode = 'strict') {
  const checkerMode = PROMPT_CHECKER_MODES[mode] || PROMPT_CHECKER_MODES.strict;
  
  const prompt = `${checkerMode.prompt}

Script to review:
"""
${script}
"""

Return ONLY valid JSON, no markdown code blocks.`;

  return prompt;
}

// Function to parse checker response
function parseCheckerResponse(response) {
  try {
    // Try to extract JSON from response
    let jsonStr = response;
    
    // Remove markdown code blocks if present
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    // Try to find JSON object
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse checker response:', error);
    return {
      clean_script: response,
      violations: [],
      risk_level: 'unknown',
      summary: 'ไม่สามารถวิเคราะห์ผลลัพธ์ได้'
    };
  }
}

// Function to format checker result for display
function formatCheckerResult(result) {
  const riskColors = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    unknown: 'secondary'
  };
  
  const riskLabels = {
    low: '✅ ความเสี่ยงต่ำ',
    medium: '⚠️ ความเสี่ยงปานกลาง',
    high: '❌ ความเสี่ยงสูง',
    unknown: '❓ ไม่ทราบ'
  };
  
  const qualityScore = parseInt(result.quality_score) || 0;
  const qualityColor = qualityScore >= 8 ? 'success' : qualityScore >= 5 ? 'warning' : 'danger';
  
  let html = `
    <div class="checker-result">
      <div class="checker-header">
        <h3>ผลการตรวจสอบ Policy & คุณภาพ</h3>
        <div class="checker-badges">
          <span class="risk-badge ${riskColors[result.risk_level] || 'secondary'}">
            ${riskLabels[result.risk_level] || riskLabels.unknown}
          </span>
          <span class="quality-badge ${qualityColor}">
            ⭐ คุณภาพ: ${qualityScore}/10
          </span>
        </div>
      </div>
      
      <div class="checker-summary">
        <strong>สรุป:</strong> ${result.summary || '-'}
      </div>
      
      ${result.original_analysis ? `
      <div class="checker-section original-analysis">
        <h4>🔍 วิเคราะห์ต้นฉบับ</h4>
        <div class="analysis-content">${result.original_analysis}</div>
      </div>` : ''}
      
      <div class="checker-section">
        <h4>✨ Script ใหม่คุณภาพสูง (พร้อมใช้)</h4>
        <div class="clean-script">${result.clean_script || '-'}</div>
        <button class="copy-script-btn" onclick="copyCleanScript(this)" data-script="${(result.clean_script || '').replace(/"/g, '&quot;')}">
          📋 คัดลอก Script
        </button>
      </div>
      
      ${result.improvements_made && result.improvements_made.length > 0 ? `
      <div class="checker-section improvements">
        <h4>🚀 การปรับปรุงที่ทำ</h4>
        <ul class="improvements-list">
          ${result.improvements_made.map(imp => `<li>✅ ${imp}</li>`).join('')}
        </ul>
      </div>` : ''}`;
  
  // Policy Violations
  if (result.violations && result.violations.length > 0) {
    html += `
      <div class="checker-section violations">
        <h4>❌ ประโยคที่ละเมิดนโยบาย (${result.violations.length} รายการ)</h4>
        <ul class="violation-list">
          ${result.violations.map(v => `
            <li class="violation-item ${v.type || 'policy'}">
              <div class="violation-type">${getViolationTypeLabel(v.type)}</div>
              <div class="violation-original">"${v.original}"</div>
              <div class="violation-reason">🚫 ${v.reason}</div>
              ${v.suggestion ? `<div class="violation-suggestion">💡 ${v.suggestion}</div>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>`;
  }
  
  // Quality Issues
  if (result.quality_issues && result.quality_issues.length > 0) {
    html += `
      <div class="checker-section quality-issues">
        <h4>📉 ปัญหาคุณภาพคอนเทนต์ (${result.quality_issues.length} รายการ)</h4>
        <ul class="quality-list">
          ${result.quality_issues.map(q => `
            <li class="quality-item ${q.severity || 'medium'}">
              <div class="quality-severity">${getSeverityLabel(q.severity)}</div>
              <div class="quality-issue">⚠️ ${q.issue}</div>
              <div class="quality-fix">✅ ${q.fix}</div>
            </li>
          `).join('')}
        </ul>
      </div>`;
  }
  
  // No issues found
  if ((!result.violations || result.violations.length === 0) && 
      (!result.quality_issues || result.quality_issues.length === 0)) {
    html += `
      <div class="checker-section no-violations">
        <p>✅ ไม่พบปัญหานโยบายหรือคุณภาพ - พร้อมโพสต์!</p>
      </div>`;
  }
  
  // Tips
  if (result.tips && result.tips.length > 0) {
    html += `
      <div class="checker-section tips">
        <h4>💡 เคล็ดลับเพิ่มคุณภาพ</h4>
        <ul class="tips-list">
          ${result.tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>`;
  }
  
  html += '</div>';
  return html;
}

// Helper function for violation type labels
function getViolationTypeLabel(type) {
  const labels = {
    'policy': '📋 นโยบาย',
    'low_quality': '📉 คุณภาพต่ำ',
    'spam': '🚫 สแปม',
    'engagement_bait': '🎣 Engagement Bait'
  };
  return labels[type] || labels['policy'];
}

// Helper function for severity labels
function getSeverityLabel(severity) {
  const labels = {
    'low': '🟡 เล็กน้อย',
    'medium': '🟠 ปานกลาง',
    'high': '🔴 รุนแรง'
  };
  return labels[severity] || labels['medium'];
}

// Copy clean script to clipboard
function copyCleanScript(btn) {
  const script = btn.dataset.script;
  if (script) {
    navigator.clipboard.writeText(script).then(() => {
      const originalText = btn.innerHTML;
      btn.innerHTML = '✅ คัดลอกแล้ว!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
      addLog('ไม่สามารถคัดลอกได้', 'error');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // ★ แสดง version จาก manifest.json ★
  const versionEl = document.getElementById('app-version');
  if (versionEl) {
    const manifest = chrome.runtime.getManifest();
    versionEl.textContent = `v${manifest.version}`;

    // 16 วิ เปิดใช้งานแล้ว (2-Clip Scene Builder)
  }
  
  initTabs();
  initPlatformModes();
  initStyleGrid();
  initStoryModeControls();
  initGenerateButton();
  initAutoPost();
  initAutoV2();
  initSettings();
  initActivityLog();
  initStudioTab();
  initPlatformTab();
  initDashboardTab();
  initTemplatesTab();
  initShareSheet();
  loadSettings();
  loadSelectedMode();
  loadSavedProducts();
  setupMessageListener();
});

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchToTab(tab.dataset.tab);
    });
  });
  
  // Settings button in header
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      switchToTab('settings');
    });
  }
}

function switchToTab(tabName) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.classList.remove('active'));
  
  // Find and activate the matching tab button
  const targetTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (targetTab) targetTab.classList.add('active');
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const tabId = tabName + '-tab';
  const tabContent = document.getElementById(tabId);
  if (tabContent) tabContent.classList.add('active');
}

function initPlatformModes() {
  const modes = document.querySelectorAll('.platform-mode-card');
  modes.forEach(mode => {
    mode.addEventListener('click', () => {
      modes.forEach(m => m.classList.remove('active'));
      mode.classList.add('active');
      selectedMode = mode.dataset.mode;
      updateModeDisplay();
      saveSelectedMode();
    });
  });
}

function updateModeDisplay() {
  const data = MODE_DATA[selectedMode];
  if (!data) return;
  
  const iconEl = document.getElementById('current-mode-icon');
  const nameEl = document.getElementById('current-mode-name');
  const durationEl = document.getElementById('current-mode-duration');
  
  if (iconEl) iconEl.textContent = data.icon;
  if (nameEl) nameEl.textContent = data.name;
  if (durationEl) durationEl.textContent = `(${data.duration})`;
}

async function saveSelectedMode() {
  await chrome.storage.local.set({ selectedMode });
}

async function loadSelectedMode() {
  const result = await chrome.storage.local.get(['selectedMode']);
  if (result.selectedMode) {
    selectedMode = result.selectedMode;
    document.querySelectorAll('.platform-mode-card').forEach(card => {
      card.classList.remove('active');
      if (card.dataset.mode === selectedMode) {
        card.classList.add('active');
      }
    });
    updateModeDisplay();
  }
}

// ==================== Auto Post Functions ====================

// ★ Shared Settings — รูปตัวละคร + คำพูด + ฉากหลัง ร่วมทุกสินค้า ★
let sharedCharacterImageBase64 = null;

function initSharedSettings() {
  const preview = document.getElementById('shared-char-preview');
  const fileInput = document.getElementById('shared-char-input');
  const clearBtn = document.getElementById('shared-char-clear');
  const applyBtn = document.getElementById('shared-apply-btn');
  const speechInput = document.getElementById('shared-custom-speech');
  const bgInput = document.getElementById('shared-custom-bg');
  
  // Click preview to upload image
  if (preview) {
    preview.addEventListener('click', () => fileInput?.click());
  }
  
  // Handle file selection
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        sharedCharacterImageBase64 = ev.target.result;
        preview.innerHTML = `<img src="${ev.target.result}" alt="Shared Character">`;
        if (clearBtn) clearBtn.style.display = 'flex';
        chrome.storage.local.set({ sharedCharacterImage: ev.target.result });
      };
      reader.readAsDataURL(file);
    });
  }
  
  // Clear shared image
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sharedCharacterImageBase64 = null;
      preview.innerHTML = '<span class="shared-image-placeholder">+ อัปรูป</span>';
      clearBtn.style.display = 'none';
      chrome.storage.local.remove('sharedCharacterImage');
    });
  }
  
  // Save shared speech/bg to storage on change
  if (speechInput) {
    speechInput.addEventListener('change', () => {
      chrome.storage.local.set({ sharedCustomSpeech: speechInput.value });
    });
  }
  if (bgInput) {
    bgInput.addEventListener('change', () => {
      chrome.storage.local.set({ sharedCustomBg: bgInput.value });
    });
  }
  
  // ★ Render shared selector dropdowns ★
  renderSharedSelectors();
  
  // Apply to all products
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const speech = speechInput?.value || '';
      const bg = bgInput?.value || '';
      const overwrite = document.getElementById('shared-overwrite-check')?.checked || false;
      let applied = 0;
      let selectorApplied = 0;
      
      // Collect shared selector values
      const selectorFields = ['productCategory', 'hookCategory', 'thaiArtStyle', 'background', 'videoStyle', 'character', 'dialogueStyle', 'speakingStyle', 'voiceType', 'scriptStyle'];
      const sharedSelectors = {};
      selectorFields.forEach(field => {
        const el = document.getElementById(`shared-selector-${field}`);
        if (el && el.value && el.value !== '_skip_') {
          sharedSelectors[field] = el.value;
        }
      });
      
      productQueue.forEach(item => {
        // Apply shared character image
        if (sharedCharacterImageBase64 && (overwrite || !item.characterImage)) {
          item.characterImage = sharedCharacterImageBase64;
          applied++;
        }
        // Apply shared custom speech
        if (speech && (overwrite || !item.customSpeech)) {
          item.customSpeech = speech;
        }
        // Apply shared custom background
        if (bg && (overwrite || !item.background || item.background === 'ai_auto')) {
          item.generatedBackground = bg;
        }
        // Apply shared selector settings
        Object.entries(sharedSelectors).forEach(([field, value]) => {
          const isDefault = !item[field] || item[field] === 'ai_auto' || item[field] === 'auto_detect' || item[field] === 'default_clean' || item[field] === 'auto';
          if (overwrite || isDefault) {
            item[field] = value;
            selectorApplied++;
          }
        });
      });
      
      saveQueue();
      saveSharedSelectors();
      renderProductQueue();
      const selectorMsg = Object.keys(sharedSelectors).length > 0 ? `, Selector: ${Object.keys(sharedSelectors).length} ค่า` : '';
      addLog(`✅ ใช้ตั้งค่าร่วมกับ ${productQueue.length} สินค้า (รูป: ${applied}${selectorMsg})`, 'success');
    });
  }
  
  // ★ PD-INSPIRED: Model selection save/load ★
  const flowImageModelEl = document.getElementById('flow-image-model');
  const flowVideoModelEl = document.getElementById('flow-video-model');
  if (flowImageModelEl) {
    flowImageModelEl.addEventListener('change', () => {
      chrome.storage.local.set({ flowImageModel: flowImageModelEl.value });
    });
  }
  if (flowVideoModelEl) {
    flowVideoModelEl.addEventListener('change', () => {
      chrome.storage.local.set({ flowVideoModel: flowVideoModelEl.value });
    });
  }

  // Load saved shared settings
  chrome.storage.local.get(['sharedCharacterImage', 'sharedCustomSpeech', 'sharedCustomBg', 'sharedSelectors', 'flowImageModel', 'flowVideoModel'], (result) => {
    if (result.sharedCharacterImage) {
      sharedCharacterImageBase64 = result.sharedCharacterImage;
      if (preview) preview.innerHTML = `<img src="${result.sharedCharacterImage}" alt="Shared Character">`;
      if (clearBtn) clearBtn.style.display = 'flex';
    }
    if (result.sharedCustomSpeech && speechInput) {
      speechInput.value = result.sharedCustomSpeech;
    }
    if (result.sharedCustomBg && bgInput) {
      bgInput.value = result.sharedCustomBg;
    }
    // Restore shared selector values
    if (result.sharedSelectors) {
      Object.entries(result.sharedSelectors).forEach(([field, value]) => {
        const el = document.getElementById(`shared-selector-${field}`);
        if (el) el.value = value;
      });
      updateSharedSelectorCount();
    }
    // ★ PD-INSPIRED: Restore model selection ★
    if (result.flowImageModel && flowImageModelEl) flowImageModelEl.value = result.flowImageModel;
    if (result.flowVideoModel && flowVideoModelEl) flowVideoModelEl.value = result.flowVideoModel;
  });
}

// ★ Render shared selector dropdowns ★
function renderSharedSelectors() {
  const grid = document.getElementById('shared-selector-grid');
  if (!grid) return;
  
  const selectorConfig = [
    { field: 'productCategory', label: '🏷️ หมวดสินค้า', map: PRODUCT_CATEGORY_MAP },
    { field: 'hookCategory', label: '🎣 ฮุคเปิดคลิป (บทพูด)', map: HOOK_CATEGORY_MAP },
    { field: 'thaiArtStyle', label: '🎨 สไตล์ภาพ', map: THAI_ART_STYLE_MAP },
    { field: 'background', label: '🏠 พื้นหลัง', map: BACKGROUND_STYLE_MAP },
    { field: 'videoStyle', label: '🎬 Video Style', map: VIDEO_STYLE_MAP },
    { field: 'character', label: '👤 ตัวละคร', map: CHARACTER_STYLE_MAP },
    { field: 'dialogueStyle', label: '💬 สไตล์บทพูด', map: DIALOGUE_STYLE_MAP },
    { field: 'speakingStyle', label: '🗣️ วิธีพูด', map: SPEAKING_STYLE_MAP },
    { field: 'voiceType', label: '🎙️ ลักษณะเสียง', map: VOICE_TONE_MAP },
    { field: 'scriptStyle', label: '📝 โครงสร้าง Script', map: SCRIPT_STYLE_MAP }
  ];
  
  grid.innerHTML = selectorConfig.map(({ field, label, map }) => {
    const options = Object.entries(map).map(([key, desc]) => 
      `<option value="${key}">${desc}</option>`
    ).join('');
    return `
      <div class="shared-selector-field">
        <label>${label}</label>
        <select class="shared-selector-dropdown" id="shared-selector-${field}" data-field="${field}">
          <option value="_skip_">— ไม่เปลี่ยน —</option>
          ${options}
        </select>
      </div>
    `;
  }).join('');
  
  // Add change listeners to update count + save
  grid.querySelectorAll('.shared-selector-dropdown').forEach(select => {
    select.addEventListener('change', () => {
      updateSharedSelectorCount();
      saveSharedSelectors();
    });
  });
}

// Update shared selector count badge
function updateSharedSelectorCount() {
  const countEl = document.getElementById('shared-selector-count');
  if (!countEl) return;
  const fields = ['productCategory', 'hookCategory', 'thaiArtStyle', 'background', 'videoStyle', 'character', 'dialogueStyle', 'speakingStyle', 'voiceType', 'scriptStyle'];
  let count = 0;
  fields.forEach(field => {
    const el = document.getElementById(`shared-selector-${field}`);
    if (el && el.value && el.value !== '_skip_') count++;
  });
  countEl.textContent = `${count}/${fields.length}`;
}

// Save shared selector values to storage
function saveSharedSelectors() {
  const fields = ['productCategory', 'hookCategory', 'thaiArtStyle', 'background', 'videoStyle', 'character', 'dialogueStyle', 'speakingStyle', 'voiceType', 'scriptStyle'];
  const values = {};
  fields.forEach(field => {
    const el = document.getElementById(`shared-selector-${field}`);
    if (el) values[field] = el.value;
  });
  chrome.storage.local.set({ sharedSelectors: values });
}

const SELECTOR_FIELDS = ['productCategory', 'hookCategory', 'thaiArtStyle', 'background', 'videoStyle', 'character', 'dialogueStyle', 'speakingStyle', 'voiceType', 'scriptStyle'];

function _getSharedSelectorValues() {
  const vals = {};
  SELECTOR_FIELDS.forEach(field => {
    const el = document.getElementById(`shared-selector-${field}`);
    if (el && el.value && el.value !== '_skip_') vals[field] = el.value;
  });
  return vals;
}

function _applySharedSelectorsToItem(item) {
  const shared = _getSharedSelectorValues();
  SELECTOR_FIELDS.forEach(field => {
    if (!item[field] || item[field] === 'ai_auto' || item[field] === 'auto_detect' || item[field] === 'default_clean' || item[field] === 'auto') {
      if (shared[field]) item[field] = shared[field];
    }
  });
  return item;
}

// Zoom state for Google Flow
let isGoogleFlowZoomed = false;

function initAutoPost() {
  // Control buttons
  const fetchBtn = document.getElementById('fetch-btn');
  const fetchAllBtn = document.getElementById('fetch-all-btn');
  const runBtn = document.getElementById('run-btn');
  const stopBtn = document.getElementById('stop-btn');
  const nextBtn = document.getElementById('next-btn');
  const refreshBtn = document.getElementById('refresh-products');
  const zoomToggleBtn = document.getElementById('zoom-toggle-btn');
  
  if (fetchBtn) fetchBtn.addEventListener('click', startScraping);
  if (fetchAllBtn) fetchAllBtn.addEventListener('click', startScrapingAll);
  if (runBtn) runBtn.addEventListener('click', showRunSettingsModal);
  if (stopBtn) stopBtn.addEventListener('click', stopAutoPost);
  if (nextBtn) nextBtn.addEventListener('click', nextProduct);
  if (refreshBtn) refreshBtn.addEventListener('click', refreshProducts);
  if (zoomToggleBtn) zoomToggleBtn.addEventListener('click', toggleGoogleFlowZoom);
  
  // Run Settings Modal
  const closeModalBtn = document.getElementById('close-run-modal');
  const cancelRunBtn = document.getElementById('cancel-run');
  const confirmRunBtn = document.getElementById('confirm-run');
  
  if (closeModalBtn) closeModalBtn.addEventListener('click', hideRunSettingsModal);
  if (cancelRunBtn) cancelRunBtn.addEventListener('click', hideRunSettingsModal);
  if (confirmRunBtn) confirmRunBtn.addEventListener('click', confirmAndRun);
  
  // ★ Toggle Schedule settings visibility เมื่อเปลี่ยน post-mode ★
  const postModeRadios = document.querySelectorAll('input[name="post-mode"]');
  postModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const scheduleSettings = document.getElementById('schedule-settings');
      if (scheduleSettings) {
        scheduleSettings.style.display = radio.value === 'schedule' ? 'block' : 'none';
      }
      // ตั้งค่า default start time = 1 ชม. ข้างหน้า (ปัดเป็นชั่วโมง)
      if (radio.value === 'schedule') {
        const startInput = document.getElementById('schedule-start-time');
        if (startInput && !startInput.value) {
          const now = new Date();
          now.setHours(now.getHours() + 1, 0, 0, 0); // ปัดเป็นชั่วโมงถัดไป
          const pad = n => String(n).padStart(2, '0');
          startInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        }
        updateSchedulePreview();
      }
    });
  });
  
  // ★ Update schedule preview เมื่อเปลี่ยน start time หรือ interval ★
  const schedStartInput = document.getElementById('schedule-start-time');
  const schedIntervalInput = document.getElementById('schedule-interval');
  if (schedStartInput) schedStartInput.addEventListener('change', updateSchedulePreview);
  if (schedIntervalInput) schedIntervalInput.addEventListener('input', updateSchedulePreview);
  
  // Character upload
  const characterInput = document.getElementById('character-input');
  const uploadBtn = document.getElementById('upload-character-btn');
  
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => characterInput?.click());
  }
  if (characterInput) {
    characterInput.addEventListener('change', handleCharacterUpload);
  }
  
  // Product search
  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
  }
  
  // Clear all products button
  const clearAllBtn = document.getElementById('clear-all-products');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllProducts);
  }
  
  // Generate All button
  const generateAllBtn = document.getElementById('generate-all-btn');
  if (generateAllBtn) {
    generateAllBtn.addEventListener('click', generateAllCaptionsAndCTAs);
  }
  
  // Copy button
  const copyBtn = document.getElementById('copy-autopost');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const output = document.getElementById('autopost-content')?.textContent;
      if (output) {
        navigator.clipboard.writeText(output).then(() => {
          copyBtn.textContent = '✅ คัดลอกแล้ว!';
          setTimeout(() => {
            copyBtn.textContent = '📋 คัดลอก';
          }, 2000);
        });
      }
    });
  }
  
  // ★ Shared Settings — รูปตัวละคร + คำพูด + ฉากหลัง ร่วมทุกสินค้า ★
  initSharedSettings();
  
  // Load saved data
  loadSavedCharacters();
  loadSavedQueue();
}

// Toggle Google Flow Zoom (33% / 100%)
async function toggleGoogleFlowZoom() {
  const btn = document.getElementById('zoom-toggle-btn');
  
  // Toggle zoom state
  isGoogleFlowZoomed = !isGoogleFlowZoomed;
  const zoomLevel = isGoogleFlowZoomed ? 33 : 100;
  
  // Update button appearance
  if (btn) {
    if (isGoogleFlowZoomed) {
      btn.textContent = '🔍 100%';
      btn.classList.add('active');
      btn.title = 'คืนขนาด Google Flow เป็น 100%';
    } else {
      btn.textContent = '🔍 33%';
      btn.classList.remove('active');
      btn.title = 'ย่อขนาด Google Flow เหลือ 33%';
    }
  }
  
  // Find Google Flow tab and send zoom command
  try {
    const tabs = await chrome.tabs.query({ url: 'https://labs.google/fx/tools/flow*' });
    
    if (tabs.length > 0) {
      // Send zoom command to content script
      await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'SET_ZOOM',
        zoomLevel: zoomLevel
      });
      
      addLog(`🔍 Zoom Google Flow: ${zoomLevel}%`, 'info');
    } else {
      addLog('⚠️ ไม่พบ Tab Google Flow - กรุณาเปิด Google Flow ก่อน', 'warning');
    }
  } catch (e) {
    console.error('[SidePanel] Error sending zoom command:', e);
    addLog('❌ ส่งคำสั่ง Zoom ไม่สำเร็จ', 'error');
  }
}

// รับข้อความจาก content script
function setupMessageListener() {
  console.log('[SidePanel] Setting up message listener...');
  
  // Listen for storage changes (more reliable than runtime.sendMessage)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log('[SidePanel] Storage changed:', namespace, Object.keys(changes));
    
    if (namespace === 'local' && changes.currentItemPosted) {
      console.log('[SidePanel] currentItemPosted changed:', changes.currentItemPosted);
      if (changes.currentItemPosted.newValue === true) {
        // ★ ถ้า FLOW_CONFIG chain กำลังทำงาน (มี item processing + flowState) → ปล่อยให้ openTikTokUpload poll จัดการ
        // ★ ถ้าไม่มี → เรียก handleItemPostedComplete โดยตรง (fallback เดิม)
        const processingItem = productQueue.find(p => p.status === 'processing' && p.flowState);
        if (processingItem) {
          console.log('[SidePanel] currentItemPosted=true — FLOW_CONFIG chain active, letting openTikTokUpload handle it');
          // ไม่ reset flag — ปล่อยให้ openTikTokUpload poll เจอแล้วจัดการเอง
        } else {
          // ★ FIX: เช็คว่าเป็น stale event หรือเปล่า (cooldown 15 วิ จาก post ล่าสุด) ★
          const timeSinceLastPost = Date.now() - _lastPostedTime;
          if (_lastPostedTime > 0 && timeSinceLastPost < 15000) {
            console.log(`[SidePanel] currentItemPosted=true — stale event (${Math.round(timeSinceLastPost/1000)}s since last post). Clearing flag, NOT calling handleItemPostedComplete.`);
            chrome.storage.local.set({ currentItemPosted: false });
          } else {
            console.log('[SidePanel] Detected item posted via storage - calling handleItemPostedComplete');
            addLog('✅ โพสสำเร็จ! (via storage)', 'success');
            chrome.storage.local.set({ currentItemPosted: false });
            handleItemPostedComplete();
          }
        }
      }
    }
    
    // Also listen for flowStatus changes
    if (namespace === 'local' && changes.flowStatus) {
      console.log('[SidePanel] flowStatus changed:', changes.flowStatus);
      const newStatus = changes.flowStatus.newValue;
      
      if (newStatus === 'posted') {
        console.log('[SidePanel] Flow status is posted (handled via currentItemPosted)');
        // ไม่เรียก handleItemPostedComplete() ที่นี่ — ใช้ currentItemPosted trigger อันเดียว
      }
      
      // Update Progress Card based on flow status
      const statusStepMap = {
        'waiting_for_flow': '🌐 รอ Google Flow...',
        'image_generating': '🖼️ กำลังสร้างรูปภาพ...',
        'image_done': '✅ สร้างรูปเสร็จ → เริ่มสร้างวิดีโอ',
        'video_generating': '🎬 กำลังสร้างวิดีโอ 8 วิ...',
        'video_saved': '💾 บันทึกวิดีโอแล้ว',
        'video_saved_8s': '💾 บันทึกวิดีโอ 8 วิแล้ว → ไป TikTok',
        'video_saved_16s': '💾 บันทึกวิดีโอ 16 วิแล้ว → ไป TikTok',
        'video_16s_generating': '🎞️ กำลังสร้างวิดีโอ 16 วิ...',
        'upload_in_progress': '📤 กำลังอัพโหลดไป TikTok...',
        'completed_8s': '✅ วิดีโอ 8 วิเสร็จ',
        'completed_16s': '✅ วิดีโอ 16 วิเสร็จ',
        'completed_download': '⬇️ ดาวน์โหลดวิดีโอเสร็จ',
        'v2_image_generating': '🖼️ [V2] กำลังสร้างรูป Template 1...',
        'v2_image_done': '✅ [V2] รูปเสร็จ → เริ่มสร้างวิดีโอ',
        'v2_video_generating': '🎬 [V2] กำลังสร้างวิดีโอ Template 2...',
        'v2_video_saved': '🎞️ [V2] วิดีโอเสร็จ → เริ่ม Extend',
        'v2_extending': '🎞️ [V2] กำลัง Extend Video...',
        'v2_extend_done': '✅ [V2] Extend เสร็จ → Download'
      };
      
      if (statusStepMap[newStatus] && flowStats.isRunning) {
        updateFlowStep(flowStats.currentItemId || flowStats.currentItemName, statusStepMap[newStatus], flowStats.currentItemName);
      }
      // ★ V2 flow status updates ★
      if (statusStepMap[newStatus] && v2FlowStats.isRunning) {
        const v2Current = v2GetProcessing();
        if (v2Current) {
          v2UpdateFlowStep(v2Current.id, statusStepMap[newStatus], v2Current.name);
        }
      }
      
      // ★ FIX: ถ้า flowStatus เป็น video_saved / completed_download → content script ทำ video เสร็จแล้ว + กำลังไป TikTok
      // ★ ต้องข้ามไป UPLOAD_TIKTOK ถ้า sidepanel ยังไม่ advance ไปถึง (fallback กรณี STEP_COMPLETED ไม่ถึง)
      // ★★ แต่ถ้า clipDuration=16 + status='video_saved_8s' → ห้าม jump! content script กำลัง extend อยู่ ★★
      const videoReadyStatuses = ['video_saved_8s', 'video_saved_16s', 'completed_download', 'completed_8s', 'completed_16s', 'video_downloaded_16s'];
      if (videoReadyStatuses.includes(newStatus) && isScraperRunning) {
        const currentItem = productQueue.find(p => p.status === 'processing' && p.flowState);
        if (currentItem && currentItem.flowState) {
          const clipDuration = currentItem.clipDuration || runSettings.clipDuration || 8;
          
          // ★ v3.04 FIX: ถ้าเป็น 16 วิ mode + เพิ่งได้ video_saved_8s → ต้องรอ extend ก่อน ★
          if (clipDuration === 16 && newStatus === 'video_saved_8s') {
            console.log(`[SidePanel] flowStatus=video_saved_8s BUT clipDuration=16 → content script is extending, NOT jumping to TikTok`);
            addFlowLog(currentItem.id, `🎞️ ${currentItem.name}: Video 8 วิ เสร็จ → กำลัง Extend เป็น 16 วิ...`, 'info');
            updateFlowStep(currentItem.id, '🎞️ กำลัง Extend เป็น 16 วิ...', currentItem.name);
            // ไม่ทำอะไร — ปล่อยให้ content script extend ต่อ → จะ set video_saved_16s เมื่อเสร็จ
          } else {
            const steps = FLOW_CONFIG[clipDuration];
            const uploadStepIndex = steps.indexOf(FLOW_STEPS.UPLOAD_TIKTOK);
            if (uploadStepIndex >= 0 && currentItem.flowState.currentStepIndex < uploadStepIndex) {
              console.log(`[SidePanel] flowStatus=${newStatus} → video done! Jumping to UPLOAD_TIKTOK (storage fallback)`);
              addFlowLog(currentItem.id, `⏭️ ${currentItem.name}: Video เสร็จ → ไป TikTok Upload`, 'info');
              for (let i = currentItem.flowState.currentStepIndex; i < uploadStepIndex; i++) {
                if (!currentItem.flowState.completedSteps.includes(steps[i])) {
                  currentItem.flowState.completedSteps.push(steps[i]);
                }
              }
              currentItem.flowState.currentStepIndex = uploadStepIndex;
              saveQueueNow();
              renderProductQueue();
              processFlowItem(currentItem);
            }
          }
        }
      }
    }
    
    // Listen for flowMessage changes to update Progress Card
    if (namespace === 'local' && changes.flowMessage && flowStats.isRunning) {
      const msg = changes.flowMessage.newValue;
      if (msg && flowStats.currentItemName) {
        updateFlowStep(flowStats.currentItemId || flowStats.currentItemName, msg, flowStats.currentItemName);
      }
    }
    
    // ★ Storage fallback: detect flow_error จาก Google Flow (กรณี runtime message ไม่ถึง) ★
    if (namespace === 'local' && changes.flowStatus && changes.flowStatus.newValue === 'flow_error') {
      const errorMsg = changes.flowMessage?.newValue || 'Google Flow error';
      console.log('[SidePanel] flow_error detected via storage fallback:', errorMsg);
      handleFlowStepFailed({ message: errorMsg, error: 'Google Flow Error (storage fallback)' });
    }
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle TikTok scraper messages
    if (message.source === 'tiktok-scraper') {
      console.log('[SidePanel] Received scraper message:', message.type, JSON.stringify(message.data).substring(0, 200));
      switch (message.type) {
        case 'ready':
          console.log('[SidePanel] Content script ready:', message.data.url);
          break;
          
        case 'status':
          updateScraperStatus(message.data);
          break;
          
        case 'progress':
          updateProgress(message.data);
          break;
          
        case 'products':
          handleProductsUpdate(message.data);
          break;
          
        case 'complete':
          handleScrapingComplete(message.data);
          break;
          
        case 'error':
          showError(message.data.message);
          break;
      }
    }
    
    // Handle Google Flow + TikTok Upload messages
    if (message.source === 'google-flow' || message.source === 'tiktok-upload') {
      switch (message.type) {
        case 'STEP_COMPLETED':
          console.log('[SidePanel] Flow step completed:', message.data);
          handleFlowStepCompleted(message.data);
          break;
        case 'STEP_FAILED':
          console.log('[SidePanel] Flow step FAILED:', message.data);
          handleFlowStepFailed(message.data);
          break;
        case 'ACTIVITY_LOG':
          // ★ Real-time Activity Log จาก content-googleflow.js → ส่งทั้ง 2 ที่ ★
          if (message.data?.message) {
            const flowKey = flowStats.currentItemId || 'google-flow';
            const flowName = flowStats.currentItemName || '';
            const prefix = flowName ? `${flowName}: ` : '';
            // 1) Flow Log ต่อสินค้า (Autopost tab)
            addFlowLog(flowKey, `${prefix}${message.data.message}`, message.data.logType || 'info');
            // 2) Activity Log หลัก (Storymode tab)
            addLog(`[Flow] ${message.data.message}`, message.data.logType || 'info');
          }
          break;
      }
    }
    
    // Handle TikTok Post completed message — fallback ถ้า storage.onChanged ไม่ fire
    if (message.action === 'itemPosted') {
      console.log('[SidePanel] Item posted (via message):', message.message);
      
      // ★ CRITICAL FIX: ถ้า FLOW_CONFIG chain กำลังทำงาน (มี item processing + flowState)
      // ★ ต้องปล่อยให้ openTikTokUpload poll จัดการอย่างเดียว — ไม่เรียก handleItemPostedComplete ซ้ำ
      // ★ เพราะ openTikTokUpload จะ shift queue เอง → ถ้าเรียก handleItemPostedComplete ด้วย = double-shift!
      const flowItem = productQueue.find(p => p.status === 'processing' && p.flowState);
      if (flowItem) {
        console.log(`[SidePanel] itemPosted message — FLOW_CONFIG chain active for "${flowItem.name}", letting openTikTokUpload handle it (prevent double-shift)`);
        return;
      }
      
      // ★ FIX: เช็ค cooldown ก่อน — ป้องกัน stale message จาก item ก่อนหน้า cascade ★
      const msgTimeSincePost = Date.now() - _lastPostedTime;
      if (_lastPostedTime > 0 && msgTimeSincePost < 15000) {
        console.log(`[SidePanel] itemPosted message — stale (${Math.round(msgTimeSincePost/1000)}s since last post), skip`);
      } else {
        handleItemPostedComplete();
      }
    }
  });
}

// Guard ป้องกัน handleItemPostedComplete ถูกเรียกซ้ำหลายครั้งพร้อมกัน
let _isHandlingPosted = false;
let _lastPostedItemId = null; // ★ Track item ID ที่เพิ่งโพสเสร็จ (ป้องกัน cascade) ★
let _lastPostedTime = 0; // ★ Timestamp ล่าสุดที่โพสเสร็จ ★
const MAX_RETRY_COUNT = 2; // ★ จำนวนรอบ retry สูงสุดสำหรับ failed items ★

// ★★★ QUEUE HELPERS — ไม่ลบ item ออกจาก queue อีกต่อไป ★★★
function getNextPendingItem() {
  return productQueue.find(item => item.status === 'pending');
}
function getCurrentProcessingItem() {
  return productQueue.find(item => item.status === 'processing');
}
function countByStatus(status) {
  return productQueue.filter(item => item.status === status).length;
}
function getQueueStats() {
  return {
    total: productQueue.length,
    pending: countByStatus('pending'),
    processing: countByStatus('processing'),
    posted: countByStatus('posted'),
    failed: countByStatus('failed'),
    skipped: countByStatus('skipped')
  };
}
function hasWorkRemaining() {
  return productQueue.some(item => item.status === 'pending' || item.status === 'processing');
}
function retryFailedItems() {
  const failedItems = productQueue.filter(item => item.status === 'failed' && (item.retryCount || 0) < MAX_RETRY_COUNT);
  if (failedItems.length === 0) return false;
  
  console.log(`[AutoPost] 🔄 Retry cycle: ${failedItems.length} failed items → reset to pending`);
  
  // ★ Force-clear ALL guards ก่อน retry เพื่อป้องกันการค้าง ★
  _isProcessingFlowStep = false;
  _pendingFlowItem = null;
  _isPostingToTikTok = false;
  _isHandlingPosted = false;
  _isStartingNextFlow = false;
  _isHandlingFlowError = false;
  
  failedItems.forEach(item => {
    item.retryCount = (item.retryCount || 0) + 1;
    
    // ★ ถ้า fail จาก policy → ล้าง prompt เก่าเพื่อให้สร้างใหม่ (ลด policy ซ้ำ) ★
    const reason = (item.failReason || '').toLowerCase();
    const isPolicyFail = reason.includes('policy') || reason.includes('violation');
    
    item.status = 'pending';
    item.flowState = null;
    item.failReason = null;
    
    if (isPolicyFail) {
      item.imagePrompt = null;
      item.videoPrompt = null;
      item.videoPrompt8 = null;
      item.videoPrompt16 = null;
      addFlowLog(item.id, `🗑️ ${item.name}: ล้าง Prompt เก่า (policy fail) → สร้างใหม่`, 'warning');
    }
    
    addFlowLog(item.id, `🔄 ${item.name}: Retry รอบที่ ${item.retryCount}/${MAX_RETRY_COUNT}`, 'warning');
    addLog(`🔄 Retry ${item.name} (${item.retryCount}/${MAX_RETRY_COUNT})`, 'warning');
  });
  saveQueueNow();
  renderProductQueue();
  return true;
}
function checkAllCompleteOrRetry() {
  const stats = getQueueStats();
  console.log('[AutoPost] Queue stats:', stats);
  if (stats.pending > 0) return 'continue';
  if (stats.failed > 0) {
    const canRetry = retryFailedItems();
    if (canRetry) return 'retry';
  }
  return 'done';
}
function getRemainingCount() {
  return productQueue.filter(item => item.status === 'pending' || item.status === 'processing').length;
}

// Handle when TikTok post is completed - ★ มาร์ก posted แล้วไปรายการถัดไป (ไม่ลบออกจาก queue) ★
async function handleItemPostedComplete() {
  if (_isHandlingPosted) {
    console.log('[SidePanel] handleItemPostedComplete already running - skip duplicate call');
    return;
  }
  _isHandlingPosted = true;
  
  const currentItem = getCurrentProcessingItem();
  
  if (currentItem) {
    if (currentItem.status !== 'processing') {
      console.log(`[SidePanel] handleItemPostedComplete: item "${currentItem.name}" status=${currentItem.status} (not processing) — skip stale trigger`);
      _isHandlingPosted = false;
      return;
    }
    
    const now = Date.now();
    _lastPostedItemId = currentItem.id;
    _lastPostedTime = now;
    
    // ★ มาร์ก posted — ไม่ลบออกจาก queue ★
    currentItem.status = 'posted';
    currentItem.posted = true;
    currentItem.postedAt = new Date().toISOString();
    addLog(`✅ โพสสำเร็จ: ${currentItem.name}`, 'success');
    
    recordFlowItemResult(currentItem.id, 'success', 'โพสสำเร็จ', currentItem.name);
    
    saveQueueNow();
    renderProductQueue();
    
    // ★ FIX: Clear stale failure timer ป้องกัน conflict กับ success path ★
    if (_pendingStartNextTimer) {
      clearTimeout(_pendingStartNextTimer);
      _pendingStartNextTimer = null;
    }
    
    const result = checkAllCompleteOrRetry();
    if (result === 'continue' || result === 'retry') {
      const nextItem = getNextPendingItem();
      if (nextItem) {
        const remaining = getRemainingCount();
        addFlowLog(nextItem.id, `📦 เหลือ ${remaining} รายการ — ถัดไป: ${nextItem.name}`, 'info');
        updateFlowStep(nextItem.id, '⏳ รอ 10 วินาที (เผื่อเน็ตช้า)...', nextItem.name);
        if (result === 'retry') {
          addLog(`🔄 เริ่ม Retry รอบใหม่ — ทำรายการที่ล้มเหลวซ้ำ`, 'warning');
        }
      }
      
      setTimeout(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000));
        _isProcessingFlowStep = false;
        _pendingFlowItem = null;
        _isPostingToTikTok = false;
        console.log('[AutoPost] ✅ All guards force-reset before starting next item');
        
        // ★ FIX: ใช้ checkAllCompleteOrRetry แทน getNextPendingItem เพื่อให้ retry failed items ด้วย ★
        const postResult = checkAllCompleteOrRetry();
        if ((postResult === 'continue' || postResult === 'retry') && isScraperRunning) {
          const nextPending = getNextPendingItem();
          if (nextPending) {
            addFlowLog(nextPending.id, `🚀 ${nextPending.name}: เริ่มทำงาน...`, 'info');
            addLog(`🚀 เริ่มรายการถัดไป: ${nextPending.name}`, 'info');
            if (postResult === 'retry') {
              addLog(`🔄 เริ่ม Retry รอบใหม่ — ทำรายการที่ล้มเหลวซ้ำ`, 'warning');
            }
          }
          startNextItemFlow();
        } else {
          const stats = getQueueStats();
          addLog(`🎉 ทำครบทุกสินค้าแล้ว! (สำเร็จ ${stats.posted}, ล้มเหลว ${stats.failed}, ข้าม ${stats.skipped})`, 'success');
          showSuccess(`ทำครบแล้ว! สำเร็จ ${stats.posted}/${stats.total}`);
          isScraperRunning = false;
          updateControlButtons();
          completeFlowProgress();
        }
        _isHandlingPosted = false;
      }, 100);
      return;
    } else {
      const stats = getQueueStats();
      addLog(`🎉 ทำครบทุกสินค้าแล้ว! (สำเร็จ ${stats.posted}, ล้มเหลว ${stats.failed}, ข้าม ${stats.skipped})`, 'success');
      showSuccess(`ทำครบแล้ว! สำเร็จ ${stats.posted}/${stats.total}`);
      isScraperRunning = false;
      updateControlButtons();
      completeFlowProgress();
    }
  } else {
    addLog(`⚠️ ไม่พบสินค้าที่กำลังทำอยู่`, 'warning');
  }
  
  _isHandlingPosted = false;
}

// Guard ป้องกัน startNextItemFlow ถูกเรียกซ้ำ
let _isStartingNextFlow = false;
let _pendingStartNextTimer = null; // ★ dedup timer ป้องกัน schedule ซ้ำ ★

// เริ่ม flow สำหรับสินค้ารายการถัดไป — ★ ใช้ getNextPendingItem() แทน productQueue[0] ★
async function startNextItemFlow() {
  if (_isStartingNextFlow) {
    console.log('[SidePanel] startNextItemFlow already running - skip duplicate call');
    return;
  }
  _isStartingNextFlow = true;
  
  try {
    // ★ หา item ที่ยัง pending (ไม่ใช่ [0] เสมอ เพราะไม่ shift แล้ว) ★
    const nextItem = getNextPendingItem();
    if (!nextItem) {
      // ★ FIX: ถ้ามี item กำลัง processing อยู่ → อย่าประกาศ done (อาจเป็น duplicate call) ★
      const processingItem = getCurrentProcessingItem();
      if (processingItem) {
        console.log(`[AutoPost] startNextItemFlow: No pending but "${processingItem.name}" is processing — skip (not done yet)`);
        return;
      }
      
      // ★ ไม่มี pending → เช็คว่าจบจริงหรือต้อง retry ★
      const result = checkAllCompleteOrRetry();
      if (result === 'retry') {
        addLog(`🔄 เริ่ม Retry รอบใหม่ — ทำรายการที่ล้มเหลวซ้ำ`, 'warning');
        // ★ Force-clear all guards ก่อน retry ★
        _isStartingNextFlow = false;
        _isProcessingFlowStep = false;
        _pendingFlowItem = null;
        _isHandlingFlowError = false;
        await new Promise(resolve => setTimeout(resolve, 3000));
        startNextItemFlow();
        return;
      }
      const stats = getQueueStats();
      addLog(`🎉 ทำครบทุกสินค้าแล้ว! (สำเร็จ ${stats.posted}, ล้มเหลว ${stats.failed}, ข้าม ${stats.skipped})`, 'success');
      completeFlowProgress();
      isScraperRunning = false;
      updateControlButtons();
      return;
    }
    
    addFlowLog(nextItem.id, `🚀 ${nextItem.name}: เริ่มทำงาน...`, 'info');
    resetItemWatchdog();
    
    await chrome.storage.local.set({ 
      currentItemPosted: false, 
      currentItemPostedAt: null,
      flowStatus: 'waiting_for_flow',
      flowMessage: null,
      currentFlowData: null,
      autopostTargetClipDuration: null,
      autopostTargetItemId: null
    });
    console.log('[AutoPost] ✅ Cleared stale storage before starting next item');
    
    // ★ FIX: ไม่ skip ถ้าไม่มี imagePrompt — processFlowItem จะสร้าง prompt ให้เอง ★
    // ★ เดิมข้าม → ทำให้รายการที่ 2+ ถูก skip หมดเพราะยังไม่ได้สร้าง prompt ★
    if (!nextItem.imagePrompt) {
      addFlowLog(nextItem.id, `📝 ${nextItem.name}: ยังไม่มี Image Prompt — จะสร้างใน processFlowItem`, 'info');
    }
    
    // ★ Set item status to processing + store clipDuration ★
    nextItem.status = 'processing';
    nextItem.clipDuration = nextItem.clipDuration || runSettings.clipDuration || 8;
    saveQueueNow();
    renderProductQueue();
    
    // Update Progress Card
    updateFlowStep(nextItem.id, '🖼️ เริ่มสร้างรูปภาพ...', nextItem.name);
    
    // ★ Initialize flow state for processFlowItem ★
    if (!nextItem.flowState) {
      nextItem.flowState = {
        currentStepIndex: 0,
        completedSteps: [],
        status: 'running'
      };
    }
    
    // ใช้ processFlowItem เพื่อเดินตาม FLOW_CONFIG (image → video → tiktok)
    processFlowItem(nextItem);
    
  } finally {
    // ★ ปลด guard ทันทีหลังส่งงาน (processFlowItem เป็น async ทำงานต่อเอง) ★
    _isStartingNextFlow = false;
  }
}

// Handle when a flow step is completed from Google Flow
async function handleFlowStepCompleted(data) {
  const { itemId, mode } = data;
  
  resetItemWatchdog(); // ★ Reset watchdog เมื่อ step สำเร็จ ★
  addFlowLog(itemId, `✅ ${mode === 'image' ? 'สร้างรูป' : 'สร้างวิดีโอ'} เสร็จแล้ว!`, 'success');
  
  // Find the item and update its flow state
  const item = productQueue.find(p => p.id === itemId);
  if (!item) {
    console.error('Item not found:', itemId);
    return;
  }
  
  // ★ FIX: content-googleflow.js ทำทั้ง image + video + navigate TikTok ในรอบเดียว
  // ★ เมื่อ mode === 'video' หมายความว่า video เสร็จแล้ว + กำลังไป TikTok
  // ★ ต้องข้ามไปที่ UPLOAD_TIKTOK โดยตรง ไม่ใช่แค่ advance 1 step (ซึ่งจะไป FRAME_TO_VIDEO แล้ว reload tab ทับ!)
  if (mode === 'video' && item.flowState) {
    const clipDuration = item.clipDuration || runSettings.clipDuration || 8;
    const steps = FLOW_CONFIG[clipDuration];
    const uploadStepIndex = steps.indexOf(FLOW_STEPS.UPLOAD_TIKTOK);
    
    if (uploadStepIndex >= 0 && item.flowState.currentStepIndex < uploadStepIndex) {
      console.log(`[SidePanel] Video done — jumping from step ${item.flowState.currentStepIndex} to UPLOAD_TIKTOK (index ${uploadStepIndex})`);
      addFlowLog(item.id, `⏭️ ${item.name}: Video เสร็จ → ไป TikTok Upload`, 'info');
      
      // Mark all skipped steps as completed
      for (let i = item.flowState.currentStepIndex; i < uploadStepIndex; i++) {
        if (!item.flowState.completedSteps.includes(steps[i])) {
          item.flowState.completedSteps.push(steps[i]);
        }
      }
      item.flowState.currentStepIndex = uploadStepIndex;
      saveQueueNow();
      renderProductQueue();
      processFlowItem(item);
      return;
    }
  }
  
  // Mark current step as complete (ปกติ — advance 1 step)
  completeCurrentStep(itemId);
  
  // Apply delay before next step
  if (runSettings.delaySeconds > 0) {
    addFlowLog(itemId, `⏳ รอ ${runSettings.delaySeconds} วินาที...`, 'info');
    await new Promise(resolve => setTimeout(resolve, runSettings.delaySeconds * 1000));
  }
}

// Guard ป้องกัน handleFlowStepFailed ถูกเรียกซ้ำ (message + storage fallback อาจ fire พร้อมกัน)
let _isHandlingFlowError = false;

// Handle when a flow step FAILS — ★ มาร์ก failed แล้วไปรายการถัดไป (ไม่ลบออกจาก queue) ★
async function handleFlowStepFailed(data) {
  if (_isHandlingFlowError) {
    console.log('[SidePanel] handleFlowStepFailed already running - skip duplicate');
    return;
  }
  _isHandlingFlowError = true;
  
  try {
    const errorMsg = data?.message || data?.error || 'Unknown error';
    addFlowLog(data?.itemId || 'flow-error', `❌ Google Flow ล้มเหลว: ${errorMsg}`, 'error');
    
    // ★ หา item ที่กำลัง processing (ไม่ใช่ [0] เสมอ) ★
    const currentItem = getCurrentProcessingItem();
    
    if (currentItem) {
      // ★ PD-INSPIRED: ลอง resume from step N ก่อน mark failed ★
      const failedStep = data?.failedStep || 0;
      const retryCount = currentItem._resumeRetryCount || 0;
      const MAX_RESUME_RETRIES = 1;

      if (failedStep >= 8 && retryCount < MAX_RESUME_RETRIES) {
        currentItem._resumeRetryCount = (currentItem._resumeRetryCount || 0) + 1;
        addFlowLog(currentItem.id, `🔄 Resume จาก Step ${failedStep} (${currentItem.name})...`, 'warning');
        addLog(`🔄 [PD-Style] Resume step ${failedStep} แทน restart ทั้งหมด`, 'info');
        
        try {
          const tabs = await chrome.tabs.query({ url: '*://labs.google/*' });
          if (tabs.length > 0) {
            await chrome.tabs.sendMessage(tabs[0].id, { action: 'resumeFromStep', stepNumber: failedStep });
            _isHandlingFlowError = false;
            return;
          }
        } catch (resumeErr) {
          console.warn('[AutoPost] Resume from step failed:', resumeErr.message);
        }
      }

      currentItem.status = 'failed';
      currentItem.failedAt = new Date().toISOString();
      currentItem.failReason = errorMsg;
      currentItem.flowState = null;
      addFlowLog(currentItem.id, `⏭️ ${currentItem.name}: ล้มเหลว — ${errorMsg}`, 'warning');
      recordFlowItemResult(currentItem.id, 'failed', errorMsg, currentItem.name);
      saveQueueNow();
      renderProductQueue();
    } else {
      console.warn('[AutoPost] handleFlowStepFailed: no processing item found — error may be stale:', errorMsg);
      addLog(`⚠️ ไม่พบรายการที่กำลังประมวลผล — ลองหารายการถัดไป`, 'warning');
    }
    
    await chrome.storage.local.set({ flowStatus: null, flowMessage: null });
    
    // ★ หารายการถัดไป (pending) หรือ retry — ทำเสมอไม่ว่าจะเจอ currentItem หรือไม่ ★
    const result = checkAllCompleteOrRetry();
    if ((result === 'continue' || result === 'retry') && isScraperRunning) {
      const nextItem = getNextPendingItem();
      if (nextItem) {
        const remaining = getRemainingCount();
        addFlowLog(nextItem.id, `📦 เหลือ ${remaining} รายการ — ถัดไป: ${nextItem.name}`, 'info');
        updateFlowStep(nextItem.id, '⏳ รอ 5 วินาที...', nextItem.name);
        if (result === 'retry') {
          addLog(`🔄 เริ่ม Retry รอบใหม่ — ทำรายการที่ล้มเหลวซ้ำ`, 'warning');
        }
      }
      
      // ★ FIX: ใช้ dedup timer ป้องกัน schedule startNextItemFlow ซ้ำจาก dual-trigger ★
      if (_pendingStartNextTimer) {
        console.log('[AutoPost] handleFlowStepFailed: Clearing previous pending startNextItemFlow timer (dedup)');
        clearTimeout(_pendingStartNextTimer);
      }
      _pendingStartNextTimer = setTimeout(async () => {
        _pendingStartNextTimer = null;
        try {
          await new Promise(resolve => setTimeout(resolve, 5000));
          _isProcessingFlowStep = false;
          _pendingFlowItem = null;
          _isPostingToTikTok = false;
          _isHandlingPosted = false;
          _isStartingNextFlow = false;
          console.log('[AutoPost] ✅ All guards force-reset before starting next item (after fail)');
          if (isScraperRunning) {
            startNextItemFlow();
          }
        } catch (e) {
          console.error('[AutoPost] startNextItemFlow after fail error:', e);
          _isProcessingFlowStep = false;
          _isStartingNextFlow = false;
        }
      }, 100);
    } else {
      // ★ FIX: ก่อนประกาศ done — เช็คว่ามี processing item อยู่ไหม ★
      const processingCheck = getCurrentProcessingItem();
      if (processingCheck && isScraperRunning) {
        console.log(`[AutoPost] handleFlowStepFailed: result='done' but "${processingCheck.name}" is processing — skip termination`);
      } else {
        const stats = getQueueStats();
        addLog(`🎉 ทำครบทุกสินค้าแล้ว! (สำเร็จ ${stats.posted}, ล้มเหลว ${stats.failed}, ข้าม ${stats.skipped})`, 'success');
        showSuccess(`ทำครบแล้ว! สำเร็จ ${stats.posted}/${stats.total}`);
        completeFlowProgress();
        isScraperRunning = false;
        updateControlButtons();
      }
    }
  } catch (e) {
    console.error('[AutoPost] handleFlowStepFailed CRITICAL ERROR:', e);
    addLog(`❌ Error ใน handleFlowStepFailed: ${e.message}`, 'error');
  } finally {
    _isHandlingFlowError = false;
  }
}

// อัพเดทสถานะ scraper
function updateScraperStatus(data) {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  const runBtn = document.getElementById('run-btn');
  const stopBtn = document.getElementById('stop-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (statusDot) {
    statusDot.className = 'status-dot ' + data.status;
  }
  if (statusText) {
    statusText.textContent = data.message;
  }
  
  // ★ ห้าม override isScraperRunning ที่นี่ — 
  // isScraperRunning ถูก set/unset โดย runAutoPost/stopAutoPost/handleItemPostedComplete โดยตรง
  // scraper status message ไม่ควร reset isScraperRunning เพราะจะทำให้ autopost หยุดกลางทาง ★

  // อัพเดทปุ่มตาม isScraperRunning ปัจจุบัน (ไม่เปลี่ยน state)
  if (runBtn) runBtn.disabled = isScraperRunning;
  if (stopBtn) stopBtn.disabled = !isScraperRunning;
  if (nextBtn) nextBtn.disabled = isScraperRunning;
  
  // แสดง/ซ่อน progress
  const progressSection = document.getElementById('progress-section');
  if (progressSection) {
    progressSection.style.display = isScraperRunning ? 'block' : 'none';
  }
}

// อัพเดท progress bar
function updateProgress(data) {
  const progressFill = document.getElementById('progress-fill');
  const progressCurrent = document.getElementById('progress-current');
  const progressTotal = document.getElementById('progress-total');
  const productCount = document.getElementById('product-count');
  
  if (data.total > 0 && progressFill) {
    const percent = (data.current / data.total) * 100;
    progressFill.style.width = `${percent}%`;
  }
  
  if (progressCurrent) progressCurrent.textContent = data.current;
  if (progressTotal) progressTotal.textContent = data.total;
  if (productCount && data.productCount !== undefined) {
    productCount.textContent = data.productCount;
  }
}

// รับข้อมูลสินค้า
function handleProductsUpdate(data) {
  console.log('[SidePanel] handleProductsUpdate called, products:', data.products?.length);
  if (data.products && data.products.length > 0) {
    // ★ V2: ถ้า tab autov2 active → ส่งเข้า V2 queue ด้วย ★
    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.dataset.tab === 'autov2') {
      v2HandleProducts(data.products);
    }
    
    // Merge products (ไม่ซ้ำ)
    const existingIds = new Set(productQueue.map(p => p.id));
    const newProducts = data.products.filter(p => !existingIds.has(p.id));
    
    // Add to queue with pending status + auto-stamp shared selectors
    const sharedSels = _getSharedSelectorValues();
    newProducts.forEach(product => {
      const item = { ...product, status: 'pending' };
      SELECTOR_FIELDS.forEach(f => { if (sharedSels[f]) item[f] = sharedSels[f]; });
      productQueue.push(item);
    });
    
    if (newProducts.length > 0) {
      const selCount = Object.keys(sharedSels).length;
      addLog(`เพิ่มสินค้าใหม่ ${newProducts.length} รายการ${selCount > 0 ? ` (ใช้ selector ${selCount} ค่า)` : ''}`, 'success');
    }
    
    renderProductQueue();
    saveQueue();
    updateProductCount();
  }
}

// Scraping เสร็จ
function handleScrapingComplete(data) {
  console.log('[SidePanel] handleScrapingComplete called, products:', data.products?.length);
  
  // ★ V2: ส่งเข้า V2 queue ด้วยถ้า tab active ★
  const activeTab = document.querySelector('.tab.active');
  if (activeTab && activeTab.dataset.tab === 'autov2' && data.products) {
    v2HandleProducts(data.products);
  }
  
  const sharedSels = _getSharedSelectorValues();
  const newProducts = (data.products || []).map(p => {
    const item = { ...p, status: 'pending', productId: p.id };
    SELECTOR_FIELDS.forEach(f => { if (sharedSels[f]) item[f] = sharedSels[f]; });
    return item;
  });
  
  // Merge without duplicates
  const existingIds = new Set(productQueue.map(p => p.id));
  const uniqueNew = newProducts.filter(p => !existingIds.has(p.id));
  productQueue = [...productQueue, ...uniqueNew];
  
  renderProductQueue();
  saveQueue();
  updateProductCount();
  
  addLog(`ดึงสินค้าเสร็จสิ้น รวม ${productQueue.length} รายการ`, 'success');
  
  updateScraperStatus({
    status: 'completed',
    message: `เสร็จสิ้น! ดึงได้ ${productQueue.length} สินค้า`
  });
}

// เริ่ม scraping
async function startScraping() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url?.includes('tiktok.com')) {
      showError('กรุณาเปิดหน้า TikTok ก่อนกด "ดึงสินค้า"');
      return;
    }
    
    // ★ อ่านเลขหน้าจาก input ★
    const pageInput = document.getElementById('page-input');
    const targetPage = parseInt(pageInput?.value) || 1;
    
    updateScraperStatus({
      status: 'running',
      message: `กำลังดึงหน้า ${targetPage}...`
    });
    
    addLog(`📄 เริ่มดึงสินค้าหน้า ${targetPage}`, 'info');
    
    // Inject content script ก่อน (ถ้ายังไม่มี)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/content.js']
      });
      console.log('Content script injected');
    } catch (e) {
      console.log('Content script may already be loaded:', e.message);
    }
    
    // รอให้ content script พร้อม แล้ว ping เช็ค
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const pingResp = await chrome.tabs.sendMessage(tab.id, { target: 'content-script', action: 'ping' });
      console.log('[SidePanel] Content script ping:', pingResp);
    } catch (pingErr) {
      console.warn('[SidePanel] Content script not responding, retrying inject...');
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['js/content.js'] });
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e2) { /* ignore */ }
    }
    
    // ส่งคำสั่งไปยัง content script พร้อมเลขหน้าที่ต้องการ
    try {
      const resp = await chrome.tabs.sendMessage(tab.id, {
        target: 'content-script',
        action: 'scrapeSinglePage',
        page: targetPage
      });
      console.log('[SidePanel] scrapeSinglePage sent, response:', resp);
      
      updateScraperStatus({
        status: 'running',
        message: 'กำลังดึงข้อมูล...'
      });
    } catch (msgError) {
      console.error('Message error:', msgError);
      showError('ไม่สามารถเชื่อมต่อได้ กรุณารีเฟรชหน้า TikTok แล้วลองใหม่');
      updateScraperStatus({
        status: 'error',
        message: 'เชื่อมต่อไม่สำเร็จ'
      });
    }
    
  } catch (error) {
    console.error('Start scraping error:', error);
    showError('เกิดข้อผิดพลาด: ' + error.message);
    updateScraperStatus({
      status: 'error',
      message: error.message
    });
  }
}

// ★ v3.23: ดึงสินค้าทุกหน้าอัตโนมัติ ★
async function startScrapingAll() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url?.includes('tiktok.com')) {
      showError('กรุณาเปิดหน้า TikTok ก่อนกด "ดึงทุกหน้า"');
      return;
    }
    
    updateScraperStatus({
      status: 'running',
      message: 'กำลังตรวจสอบจำนวนหน้า...'
    });
    
    addLog('📄 เริ่มดึงสินค้าทุกหน้า...', 'info');
    
    // Inject content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/content.js']
      });
    } catch (e) {
      console.log('Content script may already be loaded:', e.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      await chrome.tabs.sendMessage(tab.id, { target: 'content-script', action: 'ping' });
    } catch (pingErr) {
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['js/content.js'] });
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e2) { /* ignore */ }
    }
    
    try {
      const resp = await chrome.tabs.sendMessage(tab.id, {
        target: 'content-script',
        action: 'scrapeAllPages'
      });
      console.log('[SidePanel] scrapeAllPages sent, response:', resp);
      
      updateScraperStatus({
        status: 'running',
        message: 'กำลังดึงสินค้าทุกหน้า...'
      });
    } catch (msgError) {
      console.error('Message error:', msgError);
      showError('ไม่สามารถเชื่อมต่อได้ กรุณารีเฟรชหน้า TikTok แล้วลองใหม่');
      updateScraperStatus({
        status: 'error',
        message: 'เชื่อมต่อไม่สำเร็จ'
      });
    }
    
  } catch (error) {
    console.error('Start scraping all error:', error);
    showError('เกิดข้อผิดพลาด: ' + error.message);
    updateScraperStatus({
      status: 'error',
      message: error.message
    });
  }
}

// หยุด scraping
async function stopScraping() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, {
        target: 'content-script',
        action: 'stop'
      });
    }
    
    updateScraperStatus({
      status: 'stopped',
      message: 'หยุดโดยผู้ใช้'
    });
    
  } catch (error) {
    console.error('Stop scraping error:', error);
  }
}

// ไปหน้าถัดไป
async function nextPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, {
        target: 'content-script',
        action: 'next'
      });
    }
    
  } catch (error) {
    console.error('Next page error:', error);
  }
}

// รีเฟรชสินค้า
function refreshProducts() {
  productQueue = [];
  renderProductQueue();
  updateProductCount();
  chrome.storage.local.remove('productQueue');
}

// ลบสินค้าทั้งหมด
function clearAllProducts() {
  if (productQueue.length === 0) return;
  
  if (confirm(`ต้องการลบสินค้าทั้งหมด ${productQueue.length} รายการ?`)) {
    productQueue = [];
    characters = [];
    selectedCharacter = null;
    renderProductQueue();
    updateProductCount();
    saveQueue();
    saveCharacters();
    addLog('ลบสินค้าทั้งหมดแล้ว', 'warning');
  }
}

// ========== Flow Progress Card ==========
let flowStats = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  currentItemId: '',
  currentItemName: '',
  currentStep: '',
  items: [], // { id, name, status: 'success'|'failed'|'skipped'|'processing', reason? }
  isRunning: false
};

function showFlowProgressCard() {
  const card = document.getElementById('flow-progress-card');
  if (card) card.style.display = 'block';
}

function hideFlowProgressCard() {
  const card = document.getElementById('flow-progress-card');
  if (card) card.style.display = 'none';
}

function resetFlowStats(totalItems) {
  flowStats = {
    total: totalItems,
    success: 0,
    failed: 0,
    skipped: 0,
    currentItemId: '',
    currentItemName: '',
    currentStep: '',
    items: [],
    isRunning: true
  };
  updateFlowProgressCard();
  showFlowProgressCard();
}

function updateFlowStep(itemIdOrName, stepText, itemName) {
  // ★ รองรับทั้งเรียกแบบเดิม (name, step) และแบบใหม่ (id, step, name) ★
  const displayName = itemName || itemIdOrName;
  const itemId = itemName ? itemIdOrName : itemIdOrName; // ถ้าไม่ส่ง itemName มา ใช้ arg แรกเป็นทั้ง id และ name
  
  flowStats.currentItemId = itemId;
  flowStats.currentItemName = displayName;
  flowStats.currentStep = stepText;
  
  // Update processing item in log — ใช้ id เป็น key (ป้องกันชื่อซ้ำ)
  const existingIdx = flowStats.items.findIndex(i => i.id === itemId && i.status === 'processing');
  if (existingIdx === -1) {
    // ตรวจอีกที ว่า id นี้ถูก record เป็น success/failed/skipped ไปแล้วหรือยัง
    const alreadyDone = flowStats.items.find(i => i.id === itemId && i.status !== 'processing');
    if (!alreadyDone) {
      flowStats.items.push({ id: itemId, name: displayName, status: 'processing', step: stepText });
    }
  } else {
    flowStats.items[existingIdx].step = stepText;
  }
  
  updateFlowProgressCard();
}

function recordFlowItemResult(itemIdOrName, status, reason, itemName) {
  // ★ รองรับทั้งเรียกแบบเดิม (name, status, reason) และแบบใหม่ (id, status, reason, name) ★
  const displayName = itemName || itemIdOrName;
  const itemId = itemName ? itemIdOrName : itemIdOrName;
  
  // ★ DEDUP GUARD: ใช้ id เป็น key (ป้องกันชื่อซ้ำ) ★
  const alreadyCounted = flowStats.items.find(i => i.id === itemId && (i.status === 'success' || i.status === 'failed' || i.status === 'skipped'));
  if (alreadyCounted) {
    console.log(`[FlowStats] DEDUP: ${displayName} (id=${itemId}) already recorded as '${alreadyCounted.status}' — skipping duplicate '${status}'`);
    return;
  }
  
  // Update existing processing entry or add new — ใช้ id เป็น key
  const existingIdx = flowStats.items.findIndex(i => i.id === itemId && i.status === 'processing');
  if (existingIdx !== -1) {
    flowStats.items[existingIdx].status = status;
    flowStats.items[existingIdx].reason = reason || '';
  } else {
    flowStats.items.push({ id: itemId, name: displayName, status, reason: reason || '' });
  }
  
  if (status === 'success') flowStats.success++;
  else if (status === 'failed') flowStats.failed++;
  else if (status === 'skipped') flowStats.skipped++;
  
  // ★ บันทึกลง Dashboard ด้วย ★
  dashRecordEvent(displayName, status, 'tiktok', 'post');
  
  updateFlowProgressCard();
}

function completeFlowProgress() {
  flowStats.isRunning = false;
  flowStats.currentStep = 'เสร็จสิ้น';
  updateFlowProgressCard();
}

function updateFlowProgressCard() {
  const card = document.getElementById('flow-progress-card');
  if (!card) return;
  
  const done = flowStats.success + flowStats.failed + flowStats.skipped;
  const remaining = flowStats.total - done;
  const pct = flowStats.total > 0 ? Math.round((done / flowStats.total) * 100) : 0;
  
  // Badge
  const badge = document.getElementById('fp-badge');
  if (badge) {
    if (!flowStats.isRunning && done >= flowStats.total) {
      badge.textContent = 'เสร็จสิ้น';
      badge.className = 'fp-badge completed';
    } else if (flowStats.failed > 0 && !flowStats.isRunning) {
      badge.textContent = `เสร็จ (${flowStats.failed} ล้มเหลว)`;
      badge.className = 'fp-badge error';
    } else {
      badge.textContent = `${done}/${flowStats.total} รายการ`;
      badge.className = 'fp-badge';
    }
  }
  
  // Current item
  const itemNameEl = document.getElementById('fp-item-name');
  const stepEl = document.getElementById('fp-step');
  if (itemNameEl) itemNameEl.textContent = flowStats.currentItemName || '-';
  if (stepEl) stepEl.textContent = flowStats.currentStep || '-';
  
  // Progress bar
  const fill = document.getElementById('fp-progress-fill');
  if (fill) fill.style.width = `${pct}%`;
  
  const progressText = document.getElementById('fp-progress-text');
  if (progressText) progressText.textContent = `${done} / ${flowStats.total} รายการ (${pct}%)`;
  
  // Stats
  const successEl = document.getElementById('fp-success');
  const failedEl = document.getElementById('fp-failed');
  const skippedEl = document.getElementById('fp-skipped');
  const remainingEl = document.getElementById('fp-remaining');
  if (successEl) successEl.textContent = flowStats.success;
  if (failedEl) failedEl.textContent = flowStats.failed;
  if (skippedEl) skippedEl.textContent = flowStats.skipped;
  if (remainingEl) remainingEl.textContent = remaining;
  
  // Items log
  const logEl = document.getElementById('fp-items-log');
  if (logEl) {
    logEl.innerHTML = flowStats.items.map(item => {
      const icons = { success: '✅', failed: '❌', skipped: '⏭️', processing: '⏳' };
      const labels = { success: 'สำเร็จ', failed: 'ล้มเหลว', skipped: 'ข้าม', processing: 'กำลังทำ...' };
      return `<div class="fp-log-item ${item.status}">
        <span class="fp-log-icon">${icons[item.status] || '⏳'}</span>
        <span class="fp-log-name">${item.name}</span>
        <span class="fp-log-status">${item.reason || labels[item.status] || ''}</span>
      </div>`;
    }).reverse().join('');
  }
  
  // Title text
  const titleText = card.querySelector('.fp-title-text');
  if (titleText) {
    if (!flowStats.isRunning && done >= flowStats.total) {
      titleText.textContent = 'ทำครบทุกรายการแล้ว!';
    } else {
      titleText.textContent = `กำลังทำงาน... (${done}/${flowStats.total})`;
    }
  }
}

// ========== Run Settings Modal ==========
let runSettings = {
  clipDuration: 8,
  delaySeconds: 3,
  postMode: 'post',
  scheduleStartTime: null,
  scheduleInterval: 120,
  scheduleTimes: []
};

// ★ Preview ตารางเวลา Schedule ★
function updateSchedulePreview() {
  const previewEl = document.getElementById('schedule-preview');
  if (!previewEl) return;
  const startInput = document.getElementById('schedule-start-time');
  const intervalInput = document.getElementById('schedule-interval');
  if (!startInput?.value) { previewEl.textContent = ''; return; }
  const startDate = new Date(startInput.value);
  const intervalMin = parseInt(intervalInput?.value) || 120;
  const count = Math.min(productQueue.length || 1, 5);
  const pad = n => String(n).padStart(2, '0');
  const today = new Date();
  let preview = '';
  for (let i = 0; i < count; i++) {
    const t = new Date(startDate.getTime() + i * intervalMin * 60000);
    const isSameDay = t.getDate() === today.getDate() && t.getMonth() === today.getMonth() && t.getFullYear() === today.getFullYear();
    const dateStr = isSameDay ? 'วันนี้' : `${pad(t.getDate())}/${pad(t.getMonth() + 1)}`;
    preview += `#${i + 1}: ${dateStr} ${pad(t.getHours())}:${pad(t.getMinutes())}  `;
  }
  if ((productQueue.length || 0) > 5) preview += `... (+${productQueue.length - 5} รายการ)`;
  previewEl.textContent = preview;
}

function showRunSettingsModal() {
  if (productQueue.length === 0) {
    showError('ไม่มีสินค้าในคิว');
    return;
  }
  
  const modal = document.getElementById('run-settings-modal');
  const productCountEl = document.getElementById('run-product-count');
  
  if (productCountEl) {
    productCountEl.textContent = productQueue.length;
  }
  
  if (modal) {
    modal.style.display = 'flex';
  }
}

function hideRunSettingsModal() {
  const modal = document.getElementById('run-settings-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function confirmAndRun() {
  // Get settings from modal
  const durationRadio = document.querySelector('input[name="clip-duration"]:checked');
  const delayInput = document.getElementById('delay-seconds');
  
  runSettings.clipDuration = durationRadio ? parseInt(durationRadio.value) : 8;
  runSettings.delaySeconds = delayInput ? parseInt(delayInput.value) || 3 : 3;
  
  const postModeRadio = document.querySelector('input[name="post-mode"]:checked');
  runSettings.postMode = postModeRadio ? postModeRadio.value : 'post';
  
  const zoomRadio = document.querySelector('input[name="zoom-level"]:checked');
  runSettings.zoomLevel = zoomRadio ? parseInt(zoomRadio.value) : 100;
  
  // ★ Schedule settings ★
  if (runSettings.postMode === 'schedule') {
    const startInput = document.getElementById('schedule-start-time');
    const intervalInput = document.getElementById('schedule-interval');
    runSettings.scheduleStartTime = startInput?.value ? new Date(startInput.value).toISOString() : null;
    runSettings.scheduleInterval = parseInt(intervalInput?.value) || 120;
    
    // คำนวณ schedule time สำหรับแต่ละ item
    if (runSettings.scheduleStartTime) {
      const startMs = new Date(runSettings.scheduleStartTime).getTime();
      const intervalMs = runSettings.scheduleInterval * 60000;
      runSettings.scheduleTimes = productQueue.map((_, i) => new Date(startMs + i * intervalMs).toISOString());
    }
  } else {
    runSettings.scheduleTimes = [];
  }
  
  // Validate delay
  if (runSettings.delaySeconds < 1) runSettings.delaySeconds = 1;
  if (runSettings.delaySeconds > 60) runSettings.delaySeconds = 60;
  
  // Save settings
  chrome.storage.local.set({ runSettings });
  
  // Hide modal and start
  hideRunSettingsModal();
  
  const modeLabel = runSettings.postMode === 'draft' ? 'Draft' : runSettings.postMode === 'schedule' ? 'Schedule' : 'Post';
  let logMsg = `เริ่มรัน: คลิป ${runSettings.clipDuration} วิ, Delay ${runSettings.delaySeconds} วิ, โหมด: ${modeLabel}`;
  if (runSettings.postMode === 'schedule' && runSettings.scheduleTimes.length > 0) {
    const firstTime = new Date(runSettings.scheduleTimes[0]);
    const pad = n => String(n).padStart(2, '0');
    logMsg += ` (เริ่ม ${pad(firstTime.getDate())}/${pad(firstTime.getMonth() + 1)} ${pad(firstTime.getHours())}:${pad(firstTime.getMinutes())} ห่าง ${runSettings.scheduleInterval} นาที)`;
  }
  addLog(logMsg, 'info');
  
  // Start the actual auto post
  runAutoPost();
}

// แสดงรายการสินค้า
function renderProductList() {
  const listEl = document.getElementById('product-list');
  if (!listEl) return;
  
  if (products.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <span>📭</span>
        <p>ยังไม่มีสินค้า</p>
        <p class="hint">กด Run เพื่อดึงสินค้าจาก TikTok</p>
      </div>
    `;
    return;
  }
  
  const searchTerm = document.getElementById('product-search')?.value?.toLowerCase() || '';
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm)
  );
  
  listEl.innerHTML = filteredProducts.map(product => `
    <div class="product-item ${selectedProduct?.id === product.id ? 'selected' : ''}" 
         data-id="${product.id}">
      <img class="product-image" src="${product.image || ''}" 
           alt="${product.name}" 
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>📦</text></svg>'">
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-price">${product.price || '-'}</div>
      </div>
      <div class="product-check">✓</div>
    </div>
  `).join('');
  
  // Add click handlers
  listEl.querySelectorAll('.product-item').forEach(item => {
    item.addEventListener('click', () => selectProduct(item.dataset.id));
  });
}

// เลือกสินค้า
function selectProduct(productId) {
  selectedProduct = products.find(p => p.id === productId);
  
  // Update UI
  document.querySelectorAll('.product-item').forEach(item => {
    item.classList.toggle('selected', item.dataset.id === productId);
  });
  
  // Show selected product section
  const section = document.getElementById('selected-product-section');
  const display = document.getElementById('selected-product');
  
  if (section && display && selectedProduct) {
    section.style.display = 'block';
    display.innerHTML = `
      <img class="product-image" src="${selectedProduct.image || ''}" 
           alt="${selectedProduct.name}"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>📦</text></svg>'">
      <div class="product-info">
        <div class="product-name">${selectedProduct.name}</div>
        <div class="product-price">${selectedProduct.price || '-'}</div>
      </div>
    `;
  }
}

// ค้นหาสินค้า
function filterProducts() {
  renderProductList();
}

// ==================== Character Functions ====================

// อัพโหลดตัวละคร
function handleCharacterUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const newChar = {
      id: Date.now().toString(),
      image: e.target.result
    };
    characters.push(newChar);
    selectedCharacter = newChar.id;
    
    renderCharacterGrid();
    saveCharacters();
  };
  reader.readAsDataURL(file);
}

// แสดง character grid
function renderCharacterGrid() {
  const grid = document.getElementById('character-grid');
  if (!grid) return;
  
  if (characters.length === 0) {
    grid.innerHTML = '<p style="color: #888; font-size: 0.75rem; text-align: center;">ยังไม่มีตัวละคร</p>';
    return;
  }
  
  grid.innerHTML = characters.map(char => `
    <div class="character-item ${selectedCharacter === char.id ? 'selected' : ''}" data-id="${char.id}">
      <img src="${char.image}" alt="Character">
      <button class="delete-char" data-id="${char.id}">✕</button>
    </div>
  `).join('');
  
  // Click handlers
  grid.querySelectorAll('.character-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('delete-char')) {
        selectCharacter(item.dataset.id);
      }
    });
  });
  
  grid.querySelectorAll('.delete-char').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCharacter(btn.dataset.id);
    });
  });
}

function selectCharacter(charId) {
  selectedCharacter = charId;
  renderCharacterGrid();
}

function deleteCharacter(charId) {
  characters = characters.filter(c => c.id !== charId);
  if (selectedCharacter === charId) {
    selectedCharacter = characters.length > 0 ? characters[0].id : null;
  }
  renderCharacterGrid();
  saveCharacters();
}

function saveCharacters() {
  chrome.storage.local.set({ savedCharacters: characters, selectedCharacter });
}

async function loadSavedCharacters() {
  const result = await chrome.storage.local.get(['savedCharacters', 'selectedCharacter']);
  if (result.savedCharacters && result.savedCharacters.length > 0) {
    characters = result.savedCharacters;
    selectedCharacter = result.selectedCharacter || characters[0]?.id;
    renderCharacterGrid();
  }
}

// ==================== Product Queue Functions ====================

// แสดงรายการสินค้าแบบ Queue
function renderProductQueue() {
  const queueEl = document.getElementById('product-queue');
  if (!queueEl) return;
  
  if (productQueue.length === 0) {
    queueEl.innerHTML = `
      <div class="empty-state">
        <span>—</span>
        <p>ยังไม่มีสินค้า</p>
        <p class="hint">กด "ดึงสินค้า" เพื่อดึงจาก TikTok</p>
      </div>
    `;
    return;
  }
  
  const searchTerm = document.getElementById('product-search')?.value?.toLowerCase() || '';
  const filteredQueue = productQueue.filter(item => 
    item.name.toLowerCase().includes(searchTerm)
  );
  
  const selectedChar = characters.find(c => c.id === selectedCharacter);
  
  queueEl.innerHTML = filteredQueue.map((item, index) => {
    const statusInfo = PRODUCT_STATUS[item.status] || PRODUCT_STATUS.pending;
    return `
    <div class="queue-item ${item.status}" data-id="${item.id}">
      <div class="queue-header">
        <div class="queue-checkbox">
          <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${item.selected ? 'checked' : ''}>
        </div>
        <div class="queue-number">${index + 1}</div>
        <span class="queue-status ${statusInfo.color}">${statusInfo.label}</span>
        ${item.retryCount ? `<span class="retry-badge">Retry ${item.retryCount}/${MAX_RETRY_COUNT}</span>` : ''}
        <button class="queue-delete" data-id="${item.id}" title="ลบ">×</button>
      </div>
      
      ${item.status === 'failed' && item.failReason ? `<div class="fail-reason">💥 ${item.failReason}</div>` : ''}
      
      <div class="queue-product">
        <div class="queue-images">
          <img class="queue-product-image" src="${item.image || ''}" 
               alt="${item.name}"
               onerror="this.style.display='none'">
          <div class="queue-character ${item.characterImage ? '' : 'empty'}" data-id="${item.id}">
            ${item.characterImage ? `<img src="${item.characterImage}" alt="Character">` : '<span class="char-placeholder">+</span>'}
          </div>
        </div>
        <div class="queue-product-info">
          <div class="queue-product-name">${item.name}</div>
          <div class="queue-product-meta">
            <span class="meta-item">ID: ${item.productId || '-'}</span>
          </div>
        </div>
      </div>
      
      <div class="queue-prompts">
        <div class="prompt-tabs">
          <button class="prompt-tab active" data-id="${item.id}" data-tab="image">🖼️ ภาพ</button>
          <button class="prompt-tab" data-id="${item.id}" data-tab="video8">🎬 8 วิ</button>
          <button class="prompt-tab" data-id="${item.id}" data-tab="video16">🎞️ 16 วิ</button>
        </div>
        
        <div class="prompt-content" data-id="${item.id}">
          <textarea class="prompt-textarea active" data-id="${item.id}" data-field="imagePrompt" data-tab="image" placeholder="Prompt สำหรับสร้างรูปภาพ...">${item.imagePrompt || ''}</textarea>
          <textarea class="prompt-textarea" data-id="${item.id}" data-field="videoPrompt8" data-tab="video8" placeholder="Prompt สำหรับวิดีโอ 8 วินาที...">${item.videoPrompt8 || ''}</textarea>
          <textarea class="prompt-textarea" data-id="${item.id}" data-field="videoPrompt16" data-tab="video16" placeholder="Prompt สำหรับวิดีโอ 16 วินาที...">${item.videoPrompt16 || ''}</textarea>
        </div>
        
        <div class="prompt-actions">
          <button class="prompt-copy-btn" data-id="${item.id}" title="คัดลอก Prompt">📋 Copy</button>
          <button class="open-flow-btn" data-id="${item.id}" title="เปิด Google Flow">🚀 Flow</button>
        </div>
      </div>
      
      <details class="selector-group">
        <summary>🎨 ตั้งค่าสไตล์ <span class="selector-count">${countSelectedStyles(item)}/10</span></summary>
        <div class="selector-grid">
          <div class="selector-category">
            <span class="category-label">🏷️ หมวดสินค้า</span>
            ${renderDropdown('productCategory', 'ประเภทสินค้า', item.productCategory, item.id)}
          </div>
          <div class="selector-category">
            <span class="category-label">📸 ภาพ</span>
            ${renderDropdown('thaiArtStyle', 'สไตล์ภาพ', item.thaiArtStyle, item.id)}
            ${renderDropdown('background', 'พื้นหลัง', item.background, item.id)}
          </div>
          <div class="selector-category">
            <span class="category-label">🎬 วิดีโอ</span>
            ${renderDropdown('videoStyle', 'Video Style', item.videoStyle, item.id)}
            ${renderDropdown('character', 'ตัวละคร', item.character, item.id)}
          </div>
          <div class="selector-category">
            <span class="category-label">🗣️ เสียง/บทพูด</span>
            ${renderDropdown('hookCategory', '🎣 ฮุคเปิดคลิป', item.hookCategory, item.id)}
            ${renderDropdown('dialogueStyle', 'สไตล์บทพูด', item.dialogueStyle, item.id)}
            ${renderDropdown('speakingStyle', 'วิธีพูด', item.speakingStyle, item.id)}
            ${renderDropdown('voiceType', 'ลักษณะเสียง', item.voiceType, item.id)}
            ${renderDropdown('scriptStyle', 'โครงสร้าง', item.scriptStyle, item.id)}
          </div>
        </div>
      </details>
      
      <div class="custom-speech-field">
        <label class="custom-speech-label">💬 คำพูดเพิ่มเติม (เฉพาะสินค้านี้)</label>
        <input type="text" class="custom-speech-input" data-id="${item.id}" data-field="customSpeech" value="${item.customSpeech || ''}" placeholder="เช่น สวยปังมากแม่, ผิวเด้งมาก, ต้องลอง!">
      </div>
      
      <div class="h1h2-toggle-row" style="display:flex; gap:12px; padding:6px 0; align-items:center;">
        <label style="display:flex; align-items:center; gap:4px; font-size:12px; cursor:pointer; user-select:none;">
          <input type="checkbox" class="h1h2-toggle" data-id="${item.id}" data-field="showH1" ${item.showH1 !== false ? 'checked' : ''} style="accent-color:#fe2c55;">
          <span>H1 Headline</span>
        </label>
        <label style="display:flex; align-items:center; gap:4px; font-size:12px; cursor:pointer; user-select:none;">
          <input type="checkbox" class="h1h2-toggle" data-id="${item.id}" data-field="showH2" ${item.showH2 !== false ? 'checked' : ''} style="accent-color:#fe2c55;">
          <span>H2 Subtitle</span>
        </label>
      </div>
      
      <div class="queue-text-fields">
        <div class="text-field">
          <div class="field-header">
            <label>Caption</label>
            <button class="generate-btn" data-id="${item.id}" data-action="generate-caption" title="AI สร้างแคปชั่น">
              ✨ AI
            </button>
          </div>
          <textarea class="caption-input" data-id="${item.id}" data-field="caption" placeholder="ใส่แคปชั่นสำหรับโพสต์...">${item.caption || ''}</textarea>
        </div>
        <div class="text-field">
          <div class="field-header">
            <label>CTA (Call to Action)</label>
            <button class="generate-btn" data-id="${item.id}" data-action="generate-cta" title="AI สร้าง CTA">
              ✨ AI
            </button>
          </div>
          <input type="text" class="cta-input" data-id="${item.id}" data-field="cta" value="${item.cta || ''}" placeholder="เช่น: กดซื้อเลย!, กดตะกร้าได้เลย">
        </div>
      </div>
      
      <div class="queue-actions">
        <button class="action-btn" data-id="${item.id}" data-action="ai">
          AI Analyze
        </button>
        <button class="action-btn primary" data-id="${item.id}" data-action="media">
          Generate Media
        </button>
        <button class="action-btn" data-id="${item.id}" data-action="check">
          Policy Check
        </button>
      </div>
    </div>
  `}).join('');
  
  // Add event listeners
  queueEl.querySelectorAll('.queue-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteFromQueue(btn.dataset.id));
  });
  
  queueEl.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => handleQueueAction(btn.dataset.id, btn.dataset.action));
  });
  
  // Character upload click
  queueEl.querySelectorAll('.queue-character').forEach(el => {
    el.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => handleCharacterUploadForItem(e, el.dataset.id);
      input.click();
    });
  });
  
  // Checkbox change
  queueEl.querySelectorAll('.item-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const item = productQueue.find(p => p.id === cb.dataset.id);
      if (item) {
        item.selected = e.target.checked;
        saveQueue();
      }
    });
  });
  
  // Dropdown change
  queueEl.querySelectorAll('.selector-dropdown').forEach(select => {
    select.addEventListener('change', (e) => {
      const item = productQueue.find(p => p.id === select.dataset.id);
      if (item) {
        item[select.dataset.field] = e.target.value;
        saveQueue();
      }
    });
  });
  
  // Text input change (including prompt textareas + custom speech)
  queueEl.querySelectorAll('.highlight-input, .caption-input, .cta-input, .prompt-textarea, .custom-speech-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const item = productQueue.find(p => p.id === input.dataset.id);
      if (item) {
        item[input.dataset.field] = e.target.value;
        saveQueue();
      }
    });
  });
  
  // H1/H2 toggle checkboxes
  queueEl.querySelectorAll('.h1h2-toggle').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const item = productQueue.find(p => p.id === toggle.dataset.id);
      if (item) {
        item[toggle.dataset.field] = e.target.checked;
        saveQueue();
      }
    });
  });
  
  // Generate buttons (Caption, CTA)
  queueEl.querySelectorAll('.generate-btn').forEach(btn => {
    btn.addEventListener('click', () => handleGenerateAction(btn.dataset.id, btn.dataset.action));
  });
  
  // Prompt copy buttons (copy based on active tab)
  queueEl.querySelectorAll('.prompt-copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const itemId = btn.dataset.id;
      const item = productQueue.find(p => p.id === itemId);
      
      if (!item) return;
      
      // Get active tab to determine which prompt to copy
      const activeTab = queueEl.querySelector(`.prompt-tab[data-id="${itemId}"].active`);
      const tabName = activeTab?.dataset.tab || 'image';
      
      let promptText = '';
      if (tabName === 'image') {
        promptText = item.imagePrompt || '';
      } else if (tabName === 'video8') {
        promptText = item.videoPrompt8 || '';
      } else if (tabName === 'video16') {
        promptText = item.videoPrompt16 || '';
      }
      
      if (promptText) {
        await navigator.clipboard.writeText(promptText);
        btn.textContent = '✅ Copied';
        setTimeout(() => { btn.textContent = '📋 Copy'; }, 1500);
      } else {
        btn.textContent = '❌ ว่าง';
        setTimeout(() => { btn.textContent = '📋 Copy'; }, 1500);
      }
    });
  });
  
  // Prompt tabs
  queueEl.querySelectorAll('.prompt-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const itemId = tab.dataset.id;
      const tabName = tab.dataset.tab;
      
      // Update active tab
      queueEl.querySelectorAll(`.prompt-tab[data-id="${itemId}"]`).forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding textarea
      queueEl.querySelectorAll(`.prompt-textarea[data-id="${itemId}"]`).forEach(ta => {
        ta.classList.toggle('active', ta.dataset.tab === tabName);
      });
    });
  });
  
  // Open Flow button (quick action)
  queueEl.querySelectorAll('.open-flow-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const itemId = btn.dataset.id;
      const item = productQueue.find(p => p.id === itemId);
      if (!item) return;
      
      // Get active tab to determine mode
      const activeTab = queueEl.querySelector(`.prompt-tab[data-id="${itemId}"].active`);
      const tabName = activeTab?.dataset.tab || 'image';
      
      // Set the correct prompt based on active tab
      let mode = 'image';
      let prompt = item.imagePrompt || '';
      
      if (tabName === 'video8') {
        mode = 'video';
        prompt = item.videoPrompt8 || '';
        item.clipDuration = 8;
      } else if (tabName === 'video16') {
        mode = 'video';
        prompt = item.videoPrompt16 || '';
        item.clipDuration = 16;
      }
      
      if (!prompt) {
        showError('กรุณาสร้าง Prompt ก่อนเปิด Flow');
        return;
      }
      
      // Store prompt temporarily
      item.currentPrompt = prompt;
      saveQueueNow();
      
      // Open Google Flow
      await openGoogleFlow(item, mode);
    });
  });
}

// ★ Pipeline เดียวกับปุ่ม "สร้าง Prompts ทั้งหมด" — ใช้ selector ครบ + Hook + AI image/video ★
// options.skipContentIfExists: Autopost ถ้ามี H1/H2/Caption แล้ว ไม่เรียก AI สร้างเนื้อหาซ้ำ
// options.skipSaveRender: true เมื่อเรียกจาก generatePromptsForItem (จะ saveQueueNow เอง)
async function generateAllPromptsForItemInternal(item, provider, apiKey, options = {}) {
  _applySharedSelectorsToItem(item);
  const skipContentIfExists = !!options.skipContentIfExists;
  const skipSaveRender = !!options.skipSaveRender;
  const sharedSpeech = typeof document !== 'undefined' ? (document.getElementById('shared-custom-speech')?.value || '') : '';
  const customSpeech = (item.customSpeech || sharedSpeech || '').trim();

    // TODO: USER_PROMPT
    const RANDOM_CHARACTERS = [{ desc: '', gender: 'female' }];
    
    // TODO: USER_PROMPT
    const RANDOM_BACKGROUNDS = [''];
    
    // ★ ดึงค่า selector ทุกตัว ★
    let thaiArtStyleDesc = THAI_ART_STYLE_MAP[item.thaiArtStyle] || 'AI เลือกให้อัตโนมัติ';
    const dialogueStyleDesc = DIALOGUE_STYLE_MAP[item.dialogueStyle] || 'AI เลือกให้อัตโนมัติ';
    const videoStyleDesc = VIDEO_STYLE_MAP[item.videoStyle] || 'สไตล์มาตรฐาน';
    const speakingStyleDesc = SPEAKING_STYLE_MAP[item.speakingStyle] || 'AI เลือกให้อัตโนมัติ';
    const voiceTypeDesc = VOICE_TONE_MAP[item.voiceType] || 'AI เลือกให้อัตโนมัติ';
    const scriptStyleDesc = SCRIPT_STYLE_MAP[item.scriptStyle] || 'AI เลือกให้อัตโนมัติ';
    
    // ★ Character — รองรับแบบไม่มีคน (hand_only, product_only, etc.) ★
    let characterDesc = CHARACTER_STYLE_MAP[item.character] || 'AI เลือกให้อัตโนมัติ';
    let detectedGender = null;
    const NO_PERSON_CHARACTERS = ['hand_only_review', 'product_only_no_person', 'close_up_hands_product', 'overhead_flatlay', 'unboxing_hands'];
    const isNoPerson = NO_PERSON_CHARACTERS.includes(item.character);
    const isPixar3D = isPixar3DCharacter(item.character);
    let pixar3DCharInfo = null;
    
    // ★ วิเคราะห์เพศเป้าหมายจากชื่อสินค้า (กระโปรง→ผู้หญิง, สูทผู้ชาย→ผู้ชาย) ★
    const productGender = detectProductGender(item.name);
    if (productGender) {
      addFlowLog(item.id, `🔍 ${item.name}: สินค้า${productGender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'} → lock เพศ`, 'info');
    }
    
    if (isPixar3D) {
      // ★ Pixar 3D Character — AI วิเคราะห์สินค้าแล้วเลือกตัวละคร 3D ★
      const pixarCharMap = {
        'pixar_3d_cute_girl': 'cute_girl', 'pixar_3d_cool_boy': 'cool_boy', 'pixar_3d_funny_chef': 'funny_chef',
        'pixar_3d_robot_helper': 'robot_helper', 'pixar_3d_animal_mascot': null, 'pixar_3d_grandma': 'grandma',
        'pixar_3d_kid_genius': 'kid_genius', 'pixar_3d_superhero': 'superhero', 'pixar_3d_fairy': 'fairy',
        'pixar_3d_office_worker': 'office_pro'
      };
      
      if (item.character === 'pixar_3d_ai_auto' || !pixarCharMap[item.character]) {
        pixar3DCharInfo = selectPixar3DCharacter(item.name, item.productCategory || detectProductCategory(item.name));
        addFlowLog(item.id, `🏰 ${item.name}: AI เลือก 3D character → "${pixar3DCharInfo.id}" (${pixar3DCharInfo.personality})`, 'info');
      } else {
        const targetId = pixarCharMap[item.character];
        pixar3DCharInfo = PIXAR_3D_CHARACTERS.find(c => c.id === targetId) || selectPixar3DCharacter(item.name, 'general');
        addFlowLog(item.id, `🏰 ${item.name}: ใช้ 3D character "${pixar3DCharInfo.id}"`, 'info');
      }
      
      characterDesc = pixar3DCharInfo.desc;
      detectedGender = pixar3DCharInfo.gender === 'neutral' ? (productGender || 'female') : pixar3DCharInfo.gender;
      item._pixar3DInfo = pixar3DCharInfo;
    } else if (!characterDesc || characterDesc === 'AI เลือกให้อัตโนมัติ') {
      // ★ ถ้ามีรูป ref ห้ามสุ่ม character — ให้ AI ดูจากรูปแทน ★
      if (item.characterImage) {
        characterDesc = 'The person shown in the attached reference character image';
      } else {
        let charPool = RANDOM_CHARACTERS;
        if (productGender) {
          charPool = RANDOM_CHARACTERS.filter(c => c.gender === productGender);
          if (charPool.length === 0) charPool = RANDOM_CHARACTERS;
        }
        const selectedChar = charPool[Math.floor(Math.random() * charPool.length)];
        characterDesc = selectedChar.desc;
        detectedGender = selectedChar.gender;
      }
    }
    
    // ★ Pixar 3D: บังคับ Art Style เป็น 3D Pixar Animation ★
    if (isPixar3D) {
      thaiArtStyleDesc = 'Pixar 3D Animation style, vibrant colors, expressive characters, smooth rendering, Disney-quality lighting';
    }
    
    // ★ Background ★
    let backgroundDesc = BACKGROUND_STYLE_MAP[item.background] || 'AI เลือกให้อัตโนมัติ';
    if (!backgroundDesc || backgroundDesc === 'AI เลือกให้อัตโนมัติ') {
      backgroundDesc = RANDOM_BACKGROUNDS[Math.floor(Math.random() * RANDOM_BACKGROUNDS.length)];
    }
    const sharedCustomBg = (typeof document !== 'undefined' && document.getElementById('shared-custom-bg')?.value || '').trim();
    if (sharedCustomBg && (!item.background || item.background === 'ai_auto')) {
      backgroundDesc = sharedCustomBg;
      item.generatedBackground = sharedCustomBg;
    }
    
    // Store for consistency (background only — character will be stored after AI analysis below)
    item.generatedBackground = backgroundDesc;
    
    // ★ ตรวจจับประเภทสินค้า — ใช้ selector ถ้า user เลือก, ไม่งั้น auto-detect ★
    const userCategory = item.productCategory && item.productCategory !== 'auto_detect' ? item.productCategory : null;
    const autoCategory = detectProductCategory(item.name);
    const batchCategory = userCategory || autoCategory;
    const batchProductInteraction = getProductInteraction(batchCategory, item.name, isNoPerson);
    const categoryImageTemplate = getCategoryImageTemplate(batchCategory, item.name, characterDesc, backgroundDesc);
    const categoryVideoAction = getCategoryVideoAction(batchCategory, item.name, isNoPerson);
    if (userCategory) {
      addFlowLog(item.id, `🏷️ ${item.name}: user เลือกหมวด "${PRODUCT_CATEGORY_MAP[userCategory]}" → ใช้ template เฉพาะ`, 'info');
    } else if (batchCategory !== 'general') {
      addFlowLog(item.id, `🏷️ ${item.name}: ตรวจพบหมวด "${batchCategory}" → ปรับ interaction`, 'info');
    }
    
    addFlowLog(item.id, `🖼️ ${item.name}: สร้าง Prompt (${thaiArtStyleDesc})`, 'info');
    
    // ★ Detect gender จาก characterDesc (สำหรับ voice matching) ★
    if (!detectedGender && !isNoPerson) {
      const charLower = (characterDesc || '').toLowerCase();
      const isFemale = /woman|female|girl|lady|grandmother|mother|sister|aunt|queen|princess|แม่|คุณแม่|สาว|ผู้หญิง|หญิง|ยาย|ย่า|ป้า|น้า|พี่สาว|น้องสาว|เจ๊|cute.*girl|teenage.*girl|office worker \(woman\)|influencer style \(woman\)|บิวตี้|beauty|คุณแม่รีวิว|นางแบบ/.test(charLower);
      const isMale = /man\b|male|boy|gentleman|grandfather|father|brother|uncle|king|prince|พ่อ|คุณพ่อ|หนุ่ม|ผู้ชาย|ชาย|ปู่|ตา|ลุง|อา|พี่ชาย|น้องชาย|เฮีย|cute.*boy|teenage.*boy|office worker \(man\)|influencer style \(man\)|นักขาย|CEO/.test(charLower);
      if (isFemale) detectedGender = 'female';
      else if (isMale) detectedGender = 'male';
    }
    
    // ★ FIX: AI image analysis — ถ้ามี characterImage แต่ยังไม่รู้เพศ → วิเคราะห์เพศ + บรรยายหน้าตาจากรูป ref ★
    if (!detectedGender && !isNoPerson && item.characterImage) {
      addFlowLog(item.id, `🔍 ${item.name}: วิเคราะห์เพศ + บรรยายตัวละครจากรูป ref...`, 'info');
      try {
        const charAnalysisMessages = [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this person in the image. Reply with exactly:\nGENDER: female or male\nDESCRIPTION: a short English description of the person\'s appearance (age, hair, skin tone, build, style)' },
              { type: 'image_url', image_url: { url: item.characterImage } }
            ]
          }
        ];
        const charAnalysisResponse = await callAPI(provider, apiKey, charAnalysisMessages);
        const analysisText = (charAnalysisResponse || '').trim();
        
        // Parse gender
        const genderMatch = analysisText.match(/GENDER:\s*(female|male)/i);
        if (genderMatch) {
          detectedGender = genderMatch[1].toLowerCase();
          addFlowLog(item.id, `${detectedGender === 'female' ? '👩' : '👨'} ${item.name}: AI วิเคราะห์จากรูป = ${detectedGender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'}`, 'success');
        }
        
        // Parse description — ใช้ใน image prompt แทน generic text
        const descMatch = analysisText.match(/DESCRIPTION:\s*(.+)/i);
        if (descMatch && descMatch[1].trim().length > 10) {
          const aiCharDesc = sanitizeCharacterDesc(descMatch[1].trim());
          characterDesc = `The person from the reference image: ${aiCharDesc}`;
          addFlowLog(item.id, `📝 ${item.name}: AI บรรยายตัวละคร: ${aiCharDesc.substring(0, 60)}...`, 'info');
        }
      } catch (genderErr) {
        addFlowLog(item.id, `⚠️ ${item.name}: วิเคราะห์ตัวละครจากรูป ref ไม่สำเร็จ`, 'warning');
      }
    }
    
    // Store characterDesc after AI analysis (may include AI-generated description from ref image)
    item.generatedCharacter = characterDesc;
    
    // ★ FIX: ถ้ายังไม่มี detectedGender → ใช้ productGender เป็น fallback สุดท้าย ★
    if (!detectedGender && !isNoPerson && productGender) {
      detectedGender = productGender;
      addFlowLog(item.id, `🔒 ${item.name}: ใช้เพศจากสินค้า (${productGender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'}) เป็น fallback`, 'info');
    }
    
    // ★ Voice gender directive — ลำดับความสำคัญ: voiceType selector > AI ref image > detected gender > productGender ★
    let voiceGenderDirective = '';
    const singleVoiceKey = item.voiceType || 'ai_auto';
    const singleUserVoiceGender = singleVoiceKey.startsWith('female') || singleVoiceKey.startsWith('northern_female') || singleVoiceKey.startsWith('northeastern_female') || singleVoiceKey.startsWith('central_standard_female') || singleVoiceKey.startsWith('southern_female')
      ? 'female'
      : singleVoiceKey.startsWith('male') || singleVoiceKey.startsWith('northern_male') || singleVoiceKey.startsWith('northeastern_male') || singleVoiceKey.startsWith('central_standard_male') || singleVoiceKey.startsWith('southern_male')
        ? 'male'
        : null;
    
    if (singleUserVoiceGender) {
      detectedGender = singleUserVoiceGender;
      voiceGenderDirective = singleUserVoiceGender === 'female'
        ? 'VOICE GENDER: Female Thai voice. Match voice to female character appearance. ห้ามใช้เสียงผู้ชายเด็ดขาด'
        : 'VOICE GENDER: Male Thai voice. Match voice to male character appearance. ห้ามใช้เสียงผู้หญิงเด็ดขาด';
      addFlowLog(item.id, `🎙️ ${item.name}: เสียง${singleUserVoiceGender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'} (user เลือก)`, 'success');
    } else if (isNoPerson) {
      voiceGenderDirective = 'VOICE: Thai female voice narration.';
      addFlowLog(item.id, `🤚 ${item.name}: ไม่มีตัวละคร — เสียงตาม voiceType`, 'info');
    } else if (detectedGender === 'female') {
      voiceGenderDirective = 'VOICE GENDER: Female Thai voice. Match voice to female character appearance. ห้ามใช้เสียงผู้ชายเด็ดขาด';
      addFlowLog(item.id, `👩 ${item.name}: เสียงผู้หญิง`, 'info');
    } else if (detectedGender === 'male') {
      voiceGenderDirective = 'VOICE GENDER: Male Thai voice. Match voice to male character appearance. ห้ามใช้เสียงผู้หญิงเด็ดขาด';
      addFlowLog(item.id, `👨 ${item.name}: เสียงผู้ชาย`, 'info');
    } else {
      voiceGenderDirective = 'VOICE: Match voice gender to the character appearance in the reference image.';
      addFlowLog(item.id, `❓ ${item.name}: AI วิเคราะห์เพศเสียงเอง`, 'warning');
    }
    item.detectedGender = detectedGender || 'unknown';
    item.voiceGender = detectedGender || 'unknown';
    
    // ★ Unified Content Generation — H1/H2 + Caption + Speech + CTA ใน 1 call ★
    const wantH1 = item.showH1 !== false;
    const wantH2 = item.showH2 !== false;
    const clipDurationForContent = item.clipDuration || runSettings.clipDuration || 8;
    const isExtendMode = clipDurationForContent > 8;

    let shortDialogue;
    let longDialogue;

    if (skipContentIfExists && (item.h1Headline || item.h2Subtitle || item.caption)) {
      addFlowLog(item.id, `📝 ${item.name}: ใช้เนื้อหาที่มีอยู่ — สร้าง Image/Video prompt ตาม Selector`, 'info');
      if (wantH1) item.h1Headline = stripHardBannedPhrases(item.h1Headline || item.name);
      if (wantH2) item.h2Subtitle = stripHardBannedPhrases(item.h2Subtitle || item.highlight || '');
      if (!wantH1) item.h1Headline = '';
      if (!wantH2) item.h2Subtitle = '';
      item.caption = stripHardBannedPhrases(item.caption || '');
      item.cta = stripHardBannedPhrases(item.cta || '');
      shortDialogue = stripHardBannedPhrases(item.shortDialogue || customSpeech || `วันนี้ขอเล่าเรื่อง ${item.name} หน่อย น่าลองมากเลย!`);
      longDialogue = stripHardBannedPhrases(item.continuationDialogue || item.longDialogue || `ลองแล้วชอบ! ใครสนใจคอมเม้นท์มาเลย!`);
      item.shortDialogue = shortDialogue;
      if (isExtendMode) item.continuationDialogue = longDialogue;
    } else {
      addFlowLog(item.id, `📝 ${item.name}: AI สร้างเนื้อหาทั้งหมด (H1/H2/Caption/Speech/CTA)...`, 'info');
      const contentPrompt = buildContentGenerationPrompt(item, isExtendMode, detectedGender, dialogueStyleDesc, []);
      const singleHookSystemMsg = HOOK_MASTER_SECTION + buildHookMasterPrompt(item.hookCategory);
      let contentData = {};
      try {
        const contentResponse = await callAPI(provider, apiKey, [
          { role: 'system', content: singleHookSystemMsg },
          { role: 'user', content: contentPrompt }
        ]);
        contentData = JSON.parse(contentResponse.trim().replace(/```json\n?|\n?```/g, ''));
        addFlowLog(item.id, `✅ ${item.name}: สร้างเนื้อหาสำเร็จ`, 'success');
      } catch (e) {
        console.error('Content generation parse error:', e);
        addFlowLog(item.id, `⚠️ ${item.name}: parse JSON ไม่สำเร็จ — ใช้ fallback`, 'warning');
      }

      if (wantH1) item.h1Headline = enforceHeadlineWordCount(contentData.h1 || item.name, 6, 8);
      if (wantH2) item.h2Subtitle = enforceHeadlineWordCount(contentData.h2 || item.highlight || 'ตัวเลือกที่คุ้มค่า!', 4, 6);
      if (!wantH1) item.h1Headline = '';
      if (!wantH2) item.h2Subtitle = '';
      item.caption = contentData.caption || '';
      item.cta = (contentData.cta || '').replace(/^"|"$/g, '').replace(/"/g, '');
      item.h1Headline = stripHardBannedPhrases(item.h1Headline || '');
      item.h2Subtitle = stripHardBannedPhrases(item.h2Subtitle || '');
      item.caption = stripHardBannedPhrases(item.caption || '');
      item.cta = stripHardBannedPhrases(item.cta || '');
      shortDialogue = stripHardBannedPhrases(contentData.speech || customSpeech || `วันนี้ขอเล่าเรื่อง ${item.name} หน่อย น่าลองมากเลย!`);
      longDialogue = stripHardBannedPhrases(contentData.speech2 || `ลองแล้วชอบ! ใครสนใจคอมเม้นท์มาเลย!`);
      item.shortDialogue = shortDialogue;
      if (isExtendMode) item.continuationDialogue = longDialogue;
      const autoHookNorm = normalizeAutopostHookId(contentData.hookId);
      if (autoHookNorm != null) item.hookIdFromContent = autoHookNorm;
      reconcileAutopostHookIdOnItem(item);
    }
    
    // ★ Generate Image Prompt ผ่าน AI — ส่ง selector ทุกตัว ★
    addFlowLog(item.id, `🖼️ ${item.name}: AI สร้าง Image Prompt...`, 'info');
    
    const wantH1Img = item.showH1 !== false;
    const wantH2Img = item.showH2 !== false;
    const headlineSection = (wantH1Img || wantH2Img)
      ? `- H1: ${item.h1Headline || item.name || ''}\n- H2: ${item.h2Subtitle || item.highlight || ''}`
      : '(ไม่ต้องมี text overlay)';
    const textOverlayLine = (wantH1Img || wantH2Img)
      ? `ใส่ข้อความ H1 และ H2 ที่ด้านบนของภาพ (Header/Banner style) ห้ามเขียนคำว่า "H1" หรือ "H2" ลงในภาพ ให้เขียนเฉพาะเนื้อหาจริง`
      : 'ห้ามมี text overlay ใดๆ ในภาพ';
    const textCriticalLine = (wantH1Img || wantH2Img)
      ? `⚠️ CRITICAL: Never render the literal text "H1" or "H2" in the image. Only render the actual headline content.`
      : '';
    
    const productCategoryDesc = PRODUCT_CATEGORY_MAP[batchCategory] || PRODUCT_CATEGORY_MAP[item.productCategory] || PRODUCT_CATEGORY_MAP['auto_detect'];
    const selectorStyleBlock = `
- สไตล์ภาพ (ผู้ใช้เลือก): ${thaiArtStyleDesc}
- Video style: ${videoStyleDesc}
- สไตล์บทพูด: ${dialogueStyleDesc}
- วิธีพูด: ${speakingStyleDesc}
- โครงสร้างสคริปต์: ${scriptStyleDesc}
- ลักษณะเสียง (TTS): ${voiceTypeDesc}`;

    const WEARABLE_CATS = ['fashion', 'shoes', 'bags', 'accessory_watch', 'accessory'];
    const isWearable = WEARABLE_CATS.includes(batchCategory);
    const wearableRule = isWearable
      ? `ตัวละครต้องสวมใส่/ใช้งานสินค้าจริง (ไม่ใช่แค่ถือ) เช่น ใส่เสื้อ ใส่รองเท้า สะพายกระเป๋า`
      : '';

    const imagePromptRequest = `สร้าง prompt สำหรับเจนรูปภาพโฆษณาสินค้า ตอบกลับมาเป็น prompt ที่สะอาด เท่านั้น ห้ามมี markdown, backtick, หรือคำอธิบายเพิ่มเติม

ข้อมูล:
- สินค้า: ${item.name}
- จุดเด่น: ${item.highlight || 'ไม่ระบุ'}
- ตัวละคร: ${characterDesc}
- พื้นหลัง: ${backgroundDesc}
- หมวดสินค้า: ${productCategoryDesc}
${selectorStyleBlock}
${headlineSection}
${wearableRule ? `- กฎพิเศษ: ${wearableRule}` : ''}

โครงสร้าง prompt ที่ต้องการ:
${buildImagePrompt(item)}

${textOverlayLine}
${textCriticalLine}

single image, no collage, no multiple panels, no split screen.
Use the exact product appearance from the attached reference image (pd-product.png).`;

    // ★ FIX: ส่ง character ref image เป็น multimodal content ให้ AI เห็นรูปจริง ★
    const imagePromptContent = [];
    imagePromptContent.push({ type: 'text', text: imagePromptRequest });
    if (item.characterImage && !isNoPerson) {
      imagePromptContent.push({ type: 'image_url', image_url: { url: item.characterImage } });
      addFlowLog(item.id, `📸 ${item.name}: แนบรูปตัวละคร ref ไปให้ AI`, 'info');
    }
    const imageResponse = await callAPI(provider, apiKey, [{ role: 'user', content: imagePromptContent.length > 1 ? imagePromptContent : imagePromptRequest }]);
    item.imagePrompt = preFlightPolicyScreen(sanitizeVideoPrompt(imageResponse.trim()));
    
    addFlowLog(item.id, `🎬 ${item.name}: สร้าง Video Prompt 8วิ...`, 'info');

    // ★ Video 8s Prompt — ใส่ selector + voice directive + dialogue ★
    let video8Base = getRandomVideoPromptStep1() + VIDEO_PROMPT_STEP1_AUDIO;
    const isHandMode = item.character === 'hand_only_review' || item.character === 'close_up_hands_product' || item.character === 'unboxing_hands';
    // ★ v3.17: Wearable override — fashion/shoes ตัวละครต้องใส่สินค้าในวิดีโอ ★
    if (isWearable && !isNoPerson && !isPixar3D) {
      const wearableVideoVariations = [
        `The person shown in the reference image models the product by wearing/using it naturally. They move slightly to show the product from different angles, looking confident and stylish. Match the voice to the person's appearance and gender. The character MUST speak in Thai only.\n\nAUDIO / SPEECH (CRITICAL):\n- LANGUAGE: Thai only\n- Match voice gender to character appearance\n- Clear Thai pronunciation, natural speaking speed`
      ];
      video8Base = wearableVideoVariations[Math.floor(Math.random() * wearableVideoVariations.length)] + VIDEO_PROMPT_STEP1_AUDIO;
    }
    if (isPixar3D) {
      const p3d = pixar3DCharInfo || item._pixar3DInfo;
      video8Base = `ACTION ONLY: ${p3d ? p3d.id : 'The 3D character'} enthusiastically presents the product to the camera with expressive Pixar-style animation. Speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice throughout entire clip. The character MUST speak in Thai only. Stable form, no morphing, no extra limbs.`;
    } else if (isNoPerson) {
      const handInteraction = getProductInteraction(batchCategory, item.name, true);
      const handVideoAction = getVideoAction(batchCategory, item.name, true);
      if (isHandMode) {
        video8Base = `Close-up of hands unboxing and presenting the product "${item.name}". ${handInteraction} ${handVideoAction} Clean background, stable overhead or front camera angle. Thai female voice narration (AUDIO ONLY, no subtitles). The narration MUST be in Thai only.`;
      } else {
        video8Base = `Product-only showcase of "${item.name}". The product slowly rotates or is displayed from multiple angles on a clean background. ${handVideoAction} Cinematic lighting, smooth movement. Thai female voice narration (AUDIO ONLY, no subtitles). The narration MUST be in Thai only.`;
      }
    }
    
    const batchVideoAction = getVideoAction(batchCategory, item.name, isNoPerson);
    const wearableVideoRule = isWearable ? 'The character MUST be wearing/using the product throughout the entire video.' : '';
    const selectorBlock = _buildVideoSelectorBlock(item);
    const video8PromptText = preFlightPolicyScreen(sanitizeVideoPrompt(`${voiceGenderDirective}\n${video8Base}${VIDEO_FONT_FREEZE_RULE}${selectorBlock ? `\n\n${selectorBlock}` : ''}`));
    const video8WithDialogue = shortDialogue
      ? video8PromptText + `\n\nDIALOGUE / SPEECH CONTENT (CRITICAL — The character MUST say exactly this in Thai):\n"${shortDialogue}"`
      : video8PromptText;
    item.videoPrompt8 = JSON.stringify({
      step: 2, action: "Frame_to_Video", tool: "VEO 3.1",
      prompt_text: video8WithDialogue,
      dialogue_script: shortDialogue,
      technical_settings: VIDEO_PROMPT_STEP1.technical_settings
    }, null, 2);
    item.videoPrompt = item.videoPrompt8;
    item.shortDialogue = shortDialogue;
    item.longDialogue = longDialogue;
    
    addFlowLog(item.id, `🎬 ${item.name}: สร้าง Video Prompt 8วิเสร็จ`, 'info');
    
    // ★ Video 16s Prompt — ใส่ selector + voice directive + PART2 dialogue ★
    let video16Base = getRandomVideoPromptStep2();
    if (isWearable && !isNoPerson && !isPixar3D) {
      video16Base = `Visually continue the scene seamlessly. The person continues wearing/using the product naturally, showing additional features or angles. The character MUST speak in Thai only. Audio: The person immediately begins the new dialogue line exactly at the start of this clip. Match the voice to the person's appearance and gender from the previous clip. High energy tone.`;
    }
    if (isPixar3D) {
      const p3d16 = pixar3DCharInfo || item._pixar3DInfo;
      video16Base = `ACTION ONLY: Visually continue the scene seamlessly. ${p3d16 ? p3d16.id : 'The 3D character'} continues interacting with the product, showing more features excitedly. Speaking with young Thai female voice, MUST maintain consistent voice from previous clip. The character MUST speak in Thai only. Stable form, no morphing.`;
    } else if (isNoPerson) {
      if (isHandMode) {
        const catVideoAction = getCategoryVideoAction(batchCategory, item.name, true);
        video16Base = `Visually continue the scene seamlessly. Hands continue demonstrating product features. ${catVideoAction} Thai female voice narration continues (AUDIO ONLY, no subtitles). The narration MUST be in Thai only.`;
      } else {
        video16Base = `Visually continue the product showcase seamlessly. Show different angles or features of the product. Thai female voice narration continues (AUDIO ONLY, no subtitles). The narration MUST be in Thai only.`;
      }
    }

    const voiceLock16 = detectedGender 
      ? `\nVOICE LOCK: MUST use the same ${detectedGender} Thai voice as the previous clip. Do NOT switch gender.`
      : '';
    const video16PromptText = preFlightPolicyScreen(sanitizeVideoPrompt(`${voiceGenderDirective}${voiceLock16}\n${video16Base}${VIDEO_FONT_FREEZE_RULE}${selectorBlock ? `\n\n${selectorBlock}` : ''}`));
    const video16WithDialogue = longDialogue
      ? video16PromptText + `\n\nDIALOGUE / SPEECH CONTENT (CRITICAL — The character MUST continue saying exactly this in Thai):\n"${longDialogue}"`
      : video16PromptText;
    item.videoPrompt16 = JSON.stringify({
      step: 3, action: "Extend_Video", tool: "VEO 3.1",
      prompt_text: video16WithDialogue,
      dialogue_script: longDialogue,
      technical_settings: VIDEO_PROMPT_STEP2.technical_settings
    }, null, 2);

    const clipDurFinalize = item.clipDuration || runSettings.clipDuration || 8;
    if (clipDurFinalize !== 16) {
      item.videoPrompt16 = '';
    }

    sanitizeAutopostItemHardBanned(item);
    if (!skipSaveRender) {
      saveQueue();
      renderProductQueue();
    }

    addFlowLog(item.id, `✅ ${item.name}: Prompts เสร็จสิ้น`, 'success');
}

// Generate all prompts (Image, Video 8s, Video 16s) for a single item — UI wrapper
async function generateAllPromptsForItem(itemId) {
  const item = productQueue.find(p => p.id === itemId);
  if (!item) return;

  const btn = document.querySelector(`.generate-prompts-btn[data-id="${itemId}"]`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ กำลังสร้าง...';
  }

  try {
    const result = await chrome.storage.local.get(['provider', 'openaiKey', 'googleKey']);
    let provider = result.provider || 'openai';
    let apiKey = provider === 'openai' ? result.openaiKey : result.googleKey;
    if (!apiKey && result.googleKey) { provider = 'google'; apiKey = result.googleKey; }
    else if (!apiKey && result.openaiKey) { provider = 'openai'; apiKey = result.openaiKey; }

    if (!apiKey) {
      showError('กรุณาตั้งค่า API Key ก่อนใช้งาน');
      return;
    }

    await generateAllPromptsForItemInternal(item, provider, apiKey, { skipContentIfExists: false, skipSaveRender: false });
  } catch (error) {
    console.error('Generate prompts error:', error);
    showError('เกิดข้อผิดพลาด: ' + error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '✨ AI สร้าง Prompts ทั้งหมด';
    }
  }
}

// Render dropdown helper
function renderDropdown(field, label, value, itemId) {
  const options = DROPDOWN_OPTIONS[field] || [];
  const maps = {
    videoStyle: VIDEO_STYLE_MAP,
    character: CHARACTER_STYLE_MAP,
    background: BACKGROUND_STYLE_MAP,
    speakingStyle: SPEAKING_STYLE_MAP,
    voiceType: VOICE_TONE_MAP,
    scriptStyle: SCRIPT_STYLE_MAP,
    thaiArtStyle: THAI_ART_STYLE_MAP,
    dialogueStyle: DIALOGUE_STYLE_MAP,
    productCategory: PRODUCT_CATEGORY_MAP,
    hookCategory: HOOK_CATEGORY_MAP
  };
  const map = maps[field] || {};
  
  return `
    <div class="selector-field">
      <label>${label}</label>
      <select class="selector-dropdown" data-id="${itemId}" data-field="${field}">
        ${options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${map[opt] || opt}</option>`).join('')}
      </select>
    </div>
  `;
}

// Count how many styles are selected (not auto)
function countSelectedStyles(item) {
  const fields = ['thaiArtStyle', 'dialogueStyle', 'character', 'background', 
                  'speakingStyle', 'voiceType', 'videoStyle', 'scriptStyle', 'productCategory', 'hookCategory'];
  return fields.filter(f => item[f] && item[f] !== 'ai_auto' && item[f] !== 'auto').length;
}

function handleCharacterUploadForItem(e, itemId) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const item = productQueue.find(p => p.id === itemId);
    if (item) {
      item.characterImage = event.target.result;
      saveQueue();
      renderProductQueue();
      addLog('เพิ่มตัวละครให้สินค้า', 'success');
    }
  };
  reader.readAsDataURL(file);
}

function getStatusText(status) {
  const statusMap = {
    'pending': 'รอดำเนินการ',
    'processing': 'กำลังดำเนินการ',
    'completed': 'สำเร็จ'
  };
  return statusMap[status] || status;
}

function deleteFromQueue(itemId) {
  productQueue = productQueue.filter(item => item.id !== itemId);
  renderProductQueue();
  saveQueue();
  updateProductCount();
}

function showProductDetails(itemId) {
  const item = productQueue.find(p => p.id === itemId);
  if (item) {
    alert(`สินค้า: ${item.name}\nID: ${item.productId || item.id}\nราคา: ${item.price || '-'}\nURL: ${item.url || '-'}`);
  }
}

// Generate All (Prompts + Caption + CTA)
async function generateAllCaptionsAndCTAs() {
  if (productQueue.length === 0) {
    showError('ไม่มีสินค้าในคิว');
    return;
  }
  
  const btn = document.getElementById('generate-all-btn');
  const progressSection = document.getElementById('generate-progress');
  const progressFill = document.getElementById('generate-progress-fill');
  const currentEl = document.getElementById('generate-current');
  const totalEl = document.getElementById('generate-total');
  
  try {
    const result = await chrome.storage.local.get(['provider', 'openaiKey', 'googleKey']);
    let provider = result.provider || 'openai';
    let apiKey = provider === 'openai' ? result.openaiKey : result.googleKey;
    if (!apiKey && result.googleKey) { provider = 'google'; apiKey = result.googleKey; }
    else if (!apiKey && result.openaiKey) { provider = 'openai'; apiKey = result.openaiKey; }
    
    if (!apiKey) {
      showError('กรุณาตั้งค่า API Key ก่อนใช้งาน');
      return;
    }
    
    // Show progress
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-small"></span> กำลังสร้าง...';
    progressSection.style.display = 'block';
    totalEl.textContent = productQueue.length;
    
    addLog(`เริ่มสร้าง Prompts + Caption + CTA สำหรับ ${productQueue.length} สินค้า`, 'info');
    
    let completed = 0;
    const batchUsedHookIds = [];
    const batchUsedDialogues = [];
    
    for (const item of productQueue) {
      _applySharedSelectorsToItem(item);
      // Skip if already has all content
      const hasAllContent = item.imagePrompt && item.videoPrompt8 && item.videoPrompt16 && item.caption && item.cta;
      if (hasAllContent) {
        completed++;
        currentEl.textContent = completed;
        progressFill.style.width = `${(completed / productQueue.length) * 100}%`;
        continue;
      }
      
      try {
        // ========== STEP 1: Generate Prompts (Image + Video) ==========
        if (!item.imagePrompt || !item.videoPrompt8 || !item.videoPrompt16) {
          addFlowLog(item.id, `🎨 ${item.name}: สร้าง Prompts...`, 'info');
          
          // Get style descriptions from selectors
          let thaiArtStyleDesc = THAI_ART_STYLE_MAP[item.thaiArtStyle] || 'Thai temple mural painting style, traditional Thai art, intricate gold leaf details';
          const dialogueStyleDesc = DIALOGUE_STYLE_MAP[item.dialogueStyle] || 'friendly and engaging';
          const voiceTypeDesc = VOICE_TONE_MAP[item.voiceType] || 'natural Thai voice';
          const speakingStyleDesc = SPEAKING_STYLE_MAP[item.speakingStyle] || 'natural and conversational';
          const scriptStyleDesc = SCRIPT_STYLE_MAP[item.scriptStyle] || 'engaging viral style';
          const videoStyleDesc = VIDEO_STYLE_MAP[item.videoStyle] || 'สไตล์มาตรฐาน';
          
          // TODO: USER_PROMPT
          const RANDOM_CHARACTERS = [{ desc: '', gender: 'female' }];
          
          // TODO: USER_PROMPT
          const RANDOM_BACKGROUNDS = [''];
          
          let characterDesc = CHARACTER_STYLE_MAP[item.character];
          let earlyDetectedGender = null;
          const NO_PERSON_CHARACTERS_BATCH = ['hand_only_review', 'product_only_no_person', 'close_up_hands_product', 'overhead_flatlay', 'unboxing_hands'];
          const isNoPerson = NO_PERSON_CHARACTERS_BATCH.includes(item.character);
          const batchIsPixar3D = isPixar3DCharacter(item.character);
          let batchPixar3DInfo = null;
          
          // ★ วิเคราะห์เพศเป้าหมายจากชื่อสินค้า ★
          const batchProductGender = detectProductGender(item.name);
          if (batchProductGender) {
            addFlowLog(item.id, `🔍 ${item.name}: สินค้า${batchProductGender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'} → lock เพศ`, 'info');
          }
          
          if (batchIsPixar3D) {
            // ★ Pixar 3D Character — AI วิเคราะห์สินค้าแล้วเลือกตัวละคร 3D ★
            const pixarCharMap = {
              'pixar_3d_cute_girl': 'cute_girl', 'pixar_3d_cool_boy': 'cool_boy', 'pixar_3d_funny_chef': 'funny_chef',
              'pixar_3d_robot_helper': 'robot_helper', 'pixar_3d_animal_mascot': null, 'pixar_3d_grandma': 'grandma',
              'pixar_3d_kid_genius': 'kid_genius', 'pixar_3d_superhero': 'superhero', 'pixar_3d_fairy': 'fairy',
              'pixar_3d_office_worker': 'office_pro'
            };
            
            if (item.character === 'pixar_3d_ai_auto' || !pixarCharMap[item.character]) {
              batchPixar3DInfo = selectPixar3DCharacter(item.name, item.productCategory || detectProductCategory(item.name));
              addFlowLog(item.id, `🏰 ${item.name}: AI เลือก 3D → "${batchPixar3DInfo.id}" (${batchPixar3DInfo.personality})`, 'info');
            } else {
              const targetId = pixarCharMap[item.character];
              batchPixar3DInfo = PIXAR_3D_CHARACTERS.find(c => c.id === targetId) || selectPixar3DCharacter(item.name, 'general');
              addFlowLog(item.id, `🏰 ${item.name}: ใช้ 3D "${batchPixar3DInfo.id}"`, 'info');
            }
            
            characterDesc = batchPixar3DInfo.desc;
            earlyDetectedGender = batchPixar3DInfo.gender === 'neutral' ? (batchProductGender || 'female') : batchPixar3DInfo.gender;
            // TODO: USER_PROMPT
      thaiArtStyleDesc = '';
            item._pixar3DInfo = batchPixar3DInfo;
          } else if (!characterDesc || characterDesc === 'AI เลือกให้อัตโนมัติ') {
            if (item.characterImage) {
              // TODO: USER_PROMPT
        characterDesc = '';
            } else {
              let charPool = RANDOM_CHARACTERS;
              if (batchProductGender) {
                charPool = RANDOM_CHARACTERS.filter(c => c.gender === batchProductGender);
                if (charPool.length === 0) charPool = RANDOM_CHARACTERS;
              }
              const selectedChar = charPool[Math.floor(Math.random() * charPool.length)];
              characterDesc = selectedChar.desc;
              earlyDetectedGender = selectedChar.gender;
            }
          }
          
          let backgroundDesc = BACKGROUND_STYLE_MAP[item.background];
          if (!backgroundDesc || backgroundDesc === 'AI เลือกให้อัตโนมัติ') {
            backgroundDesc = RANDOM_BACKGROUNDS[Math.floor(Math.random() * RANDOM_BACKGROUNDS.length)];
          }
          
          // Store for consistency (background only — character stored after AI analysis below)
          item.generatedBackground = backgroundDesc;
          
          // ★ H1/H2 toggle check ★
          const batchWantH1 = item.showH1 !== false;
          const batchWantH2 = item.showH2 !== false;
          
          // ★ Random variations from top-level arrays ★
          const randomTime = TIME_VARIATIONS[Math.floor(Math.random() * TIME_VARIATIONS.length)];
          const randomMood = MOOD_VARIATIONS[Math.floor(Math.random() * MOOD_VARIATIONS.length)];
          const randomCamera = CAMERA_VARIATIONS[Math.floor(Math.random() * CAMERA_VARIATIONS.length)];
          
          // ★ FIX: Detect gender BEFORE image prompt so character gender is locked (เฉพาะกรณีมีคน) ★
          // Step 1: Text-based detection from characterDesc
          if (!isNoPerson && !earlyDetectedGender) {
            const charLower = (characterDesc || '').toLowerCase();
            const isFemale = /woman|female|girl|lady|grandmother|mother|sister|aunt|queen|princess|แม่|สาว|ผู้หญิง|หญิง|ยาย|cute.*girl|teenage.*girl/.test(charLower);
            const isMale = /man\b|male|boy|gentleman|grandfather|father|brother|uncle|king|prince|พ่อ|หนุ่ม|ผู้ชาย|ชาย|ปู่|cute.*boy|teenage.*boy/.test(charLower);
            if (isFemale) earlyDetectedGender = 'female';
            else if (isMale) earlyDetectedGender = 'male';
          }
          
          // Step 2: AI image analysis — ถ้ามี characterImage ให้วิเคราะห์เพศ + บรรยายหน้าตาจากรูปก่อนสร้าง prompt
          if (!isNoPerson && item.characterImage && !earlyDetectedGender) {
            addFlowLog(item.id, `🔍 ${item.name}: วิเคราะห์เพศ + บรรยายตัวละครจากรูป ref...`, 'info');
            try {
              const charAnalysisMessages = [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Analyze this person in the image. Reply with exactly:\nGENDER: female or male\nDESCRIPTION: a short English description of the person\'s appearance (age, hair, skin tone, build, style)' },
                    { type: 'image_url', image_url: { url: item.characterImage } }
                  ]
                }
              ];
              const charAnalysisResponse = await callAPI(provider, apiKey, charAnalysisMessages);
              const analysisText = (charAnalysisResponse || '').trim();
              
              const genderMatch = analysisText.match(/GENDER:\s*(female|male)/i);
              if (genderMatch) {
                earlyDetectedGender = genderMatch[1].toLowerCase();
                addFlowLog(item.id, `${earlyDetectedGender === 'female' ? '👩' : '👨'} ${item.name}: AI วิเคราะห์จากรูป = ${earlyDetectedGender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'}`, 'success');
              }
              
              const descMatch = analysisText.match(/DESCRIPTION:\s*(.+)/i);
              if (descMatch && descMatch[1].trim().length > 10) {
                const aiCharDesc = sanitizeCharacterDesc(descMatch[1].trim());
                characterDesc = `The person from the reference image: ${aiCharDesc}`;
                addFlowLog(item.id, `📝 ${item.name}: AI บรรยายตัวละคร: ${aiCharDesc.substring(0, 60)}...`, 'info');
              }
            } catch (earlyGenderErr) {
              addFlowLog(item.id, `⚠️ ${item.name}: วิเคราะห์ตัวละครจากรูปไม่สำเร็จ`, 'warning');
            }
          }
          
          // Store characterDesc after AI analysis (may include AI-generated description from ref image)
          item.generatedCharacter = characterDesc;
          
          const genderImageDirective = earlyDetectedGender 
            ? (earlyDetectedGender === 'female' ? 'The character is female.' : 'The character is male.')
            : '';
          
          // ★ Unified Content Generation — H1/H2 + Caption + Speech + CTA ใน 1 call ★
          addFlowLog(item.id, `📝 ${item.name}: AI สร้างเนื้อหาทั้งหมด (H1/H2/Caption/Speech/CTA)...`, 'info');
          const batchContentPrompt = buildContentGenerationPrompt(item, true, earlyDetectedGender || batchProductGender, dialogueStyleDesc, []);
          const hookSystemMsg = HOOK_MASTER_SECTION + buildHookMasterPrompt(item.hookCategory, batchUsedHookIds);
          // TODO: USER_PROMPT
          const usedDialogueWarning = '';
          let batchContentData = {};
          try {
            const batchContentResponse = await callAPI(provider, apiKey, [
              { role: 'system', content: hookSystemMsg + usedDialogueWarning },
              { role: 'user', content: batchContentPrompt }
            ]);
            batchContentData = JSON.parse(batchContentResponse.trim().replace(/```json\n?|\n?```/g, ''));
            addFlowLog(item.id, `✅ ${item.name}: สร้างเนื้อหาสำเร็จ`, 'success');
          } catch (contentErr) {
            console.error('Batch content generation parse error:', contentErr);
            addFlowLog(item.id, `⚠️ ${item.name}: parse JSON ไม่สำเร็จ — ใช้ fallback`, 'warning');
          }
          
          item.h1Headline = batchWantH1 ? enforceHeadlineWordCount(batchContentData.h1 || `${item.name} - น่าลองมาก!`, 6, 8) : '';
          item.h2Subtitle = batchWantH2 ? enforceHeadlineWordCount(batchContentData.h2 || 'พลาดคือเสียใจ! รีบเลย!', 4, 6) : '';
          item.caption = batchContentData.caption || '';
          item.cta = (batchContentData.cta || '').replace(/^"|"$/g, '').replace(/"/g, '');
          item.h1Headline = stripHardBannedPhrases(item.h1Headline || '');
          item.h2Subtitle = stripHardBannedPhrases(item.h2Subtitle || '');
          item.caption = stripHardBannedPhrases(item.caption || '');
          item.cta = stripHardBannedPhrases(item.cta || '');
          const h1Headline = item.h1Headline;
          const h2Headline = item.h2Subtitle;
          let shortDialogue = stripHardBannedPhrases(batchContentData.speech || `วันนี้ขอเล่าเรื่อง ${item.name} หน่อย น่าลองมากเลยนะ รีบมาดูเลย!`);
          let continuationDialogue = stripHardBannedPhrases(batchContentData.speech2 || `ลองแล้วชอบ! ใครสนใจคอมเม้นท์มาได้เลยนะ!`);
          
          // Track used dialogues for variety across batch
          batchUsedDialogues.push(shortDialogue);
          const batchHookNorm = normalizeAutopostHookId(batchContentData.hookId);
          if (batchHookNorm != null) {
            item.hookIdFromContent = batchHookNorm;
            batchUsedHookIds.push(batchHookNorm);
          }
          reconcileAutopostHookIdOnItem(item);
          
          // Generate Image Prompt using template — conditional H1/H2 text overlay
          const batchIsHandMode = item.character === 'hand_only_review' || item.character === 'close_up_hands_product' || item.character === 'unboxing_hands';
          const batchCategory = detectProductCategory(item.name);
          const BATCH_WEARABLE_CATS = ['fashion', 'shoes', 'bags', 'accessory_watch', 'accessory'];
          const batchIsWearable = BATCH_WEARABLE_CATS.includes(batchCategory);

          item.imagePrompt = buildImagePrompt(item);

          // ★ Dialogue จาก unified content call — ไม่ต้อง API call แยกแล้ว ★
          item.shortDialogue = shortDialogue;
          item.longDialogue = continuationDialogue;
          item.continuationDialogue = continuationDialogue;
          
          // ★ Detect gender for voice — ลำดับความสำคัญ: voiceType selector > AI image > characterDesc ★
          let detectedGender = earlyDetectedGender || null;
          let voiceGenderDirective = '';
          
          // ★ PRIORITY 1: ถ้า user เลือก voiceType ที่ระบุเพศชัดเจน → ใช้ตามที่ user เลือก ★
          const voiceKey = item.voiceType || 'ai_auto';
          const userSelectedVoiceGender = voiceKey.startsWith('female') || voiceKey.startsWith('northern_female') || voiceKey.startsWith('northeastern_female') || voiceKey.startsWith('central_standard_female') || voiceKey.startsWith('southern_female')
            ? 'female'
            : voiceKey.startsWith('male') || voiceKey.startsWith('northern_male') || voiceKey.startsWith('northeastern_male') || voiceKey.startsWith('central_standard_male') || voiceKey.startsWith('southern_male')
              ? 'male'
              : null;
          
          if (userSelectedVoiceGender) {
            detectedGender = userSelectedVoiceGender;
            voiceGenderDirective = userSelectedVoiceGender === 'female'
              ? 'VOICE GENDER: Female Thai voice. Match voice to female character appearance. ห้ามใช้เสียงผู้ชายเด็ดขาด'
              : 'VOICE GENDER: Male Thai voice. Match voice to male character appearance. ห้ามใช้เสียงผู้หญิงเด็ดขาด';
            addFlowLog(item.id, `🎙️ ${item.name}: เสียง${userSelectedVoiceGender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'} (user เลือก)`, 'success');
          } else if (isNoPerson) {
            voiceGenderDirective = 'VOICE: Thai female voice narration.';
            addFlowLog(item.id, `🤚 ${item.name}: ไม่มีตัวละคร — เสียงตาม voiceType`, 'info');
          } else {
            // ★ PRIORITY 2: ใช้ earlyDetectedGender (จาก AI image analysis หรือ text detection) ★
            // Fallback: ถ้ายังไม่มี → ลองดูจาก characterDesc
            if (!detectedGender) {
              const charLower = (characterDesc || '').toLowerCase();
              const isFemale = /woman|female|girl|lady|grandmother|mother|sister|aunt|queen|princess|แม่|คุณแม่|สาว|ผู้หญิง|หญิง|ยาย|ย่า|ป้า|น้า|พี่สาว|น้องสาว|เจ๊|cute.*girl|teenage.*girl|นาง|หล่อน|เธอ/.test(charLower);
              const isMale = /man\b|male|boy|gentleman|grandfather|father|brother|uncle|king|prince|พ่อ|คุณพ่อ|หนุ่ม|ผู้ชาย|ชาย|ปู่|ตา|ลุง|อา|พี่ชาย|น้องชาย|เฮีย|cute.*boy|teenage.*boy|นาย|หมอ(?!ย)|เขา/.test(charLower);
              if (isFemale) {
                detectedGender = 'female';
                addFlowLog(item.id, `👩 ${item.name}: ตรวจพบผู้หญิง`, 'info');
              } else if (isMale) {
                detectedGender = 'male';
                addFlowLog(item.id, `👨 ${item.name}: ตรวจพบผู้ชาย`, 'info');
              }
            }
            
            // ★ FIX: ถ้ายังไม่มี detectedGender → ใช้ batchProductGender เป็น fallback สุดท้าย ★
            if (!detectedGender && batchProductGender) {
              detectedGender = batchProductGender;
              addFlowLog(item.id, `🔒 ${item.name}: ใช้เพศจากสินค้า (${batchProductGender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'}) เป็น fallback`, 'info');
            }
            
            // Set voice gender directive based on detected gender
            if (detectedGender === 'female') {
              voiceGenderDirective = 'VOICE GENDER: Female Thai voice. Match voice to female character appearance. ห้ามใช้เสียงผู้ชายเด็ดขาด';
              addFlowLog(item.id, `👩 ${item.name}: เสียงผู้หญิง`, 'info');
            } else if (detectedGender === 'male') {
              voiceGenderDirective = 'VOICE GENDER: Male Thai voice. Match voice to male character appearance. ห้ามใช้เสียงผู้หญิงเด็ดขาด';
              addFlowLog(item.id, `👨 ${item.name}: เสียงผู้ชาย`, 'info');
            } else {
              voiceGenderDirective = 'VOICE: Match voice gender to the character appearance in the reference image.';
              addFlowLog(item.id, `❓ ${item.name}: AI วิเคราะห์เพศเสียงเอง`, 'warning');
            }
          }
          
          // ★ Store detected gender for later use ★
          item.detectedGender = detectedGender;
          
          // ★ GOOGLE FLOW POLICY CHECK - Sanitize dialogues before sending ★
          addFlowLog(item.id, `🔍 ${item.name}: ตรวจสอบ Policy...`, 'info');
          const cleanShortDialogue = sanitizeDialogueForGoogleFlow(shortDialogue);
          const cleanContinuationDialogue = sanitizeDialogueForGoogleFlow(continuationDialogue);
          
          // Log if any changes were made
          if (cleanShortDialogue !== shortDialogue) {
            addFlowLog(item.id, `⚠️ ${item.name}: แก้บทพูด PART1`, 'warning');
          }
          if (cleanContinuationDialogue !== continuationDialogue) {
            addFlowLog(item.id, `⚠️ ${item.name}: แก้บทพูด PART2`, 'warning');
          }
          
          const batchSelectorBlock = _buildVideoSelectorBlock(item);
          
          const batchCategory2 = PRODUCT_CATEGORY_MAP[item.productCategory] ? item.productCategory : detectProductCategory(item.name);
          const batchHandInteraction = getProductInteraction(batchCategory2, item.name, true);
          const batchHandVideoAction = getVideoAction(batchCategory2, item.name, true);
          
          let video8Base;
          if (batchIsPixar3D) {
            const bp3d = batchPixar3DInfo || item._pixar3DInfo;
            video8Base = `ACTION ONLY: ${bp3d ? bp3d.id : 'The 3D character'} enthusiastically presents the product to the camera with expressive Pixar-style animation. Speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice throughout entire clip. The character MUST speak in Thai only. Stable form, no morphing, no extra limbs.`;
          } else if (isNoPerson && batchIsHandMode) {
            video8Base = `Close-up of hands unboxing and presenting the product "${item.name}". ${batchHandInteraction} ${batchHandVideoAction} Clean background, stable overhead or front camera angle. Thai female voice narration (AUDIO ONLY, no subtitles). The narration MUST be in Thai only.`;
          } else if (isNoPerson) {
            video8Base = `Product-only showcase of "${item.name}". The product slowly rotates or is displayed from multiple angles on a clean background. ${batchHandVideoAction} Cinematic lighting, smooth movement. Thai female voice narration (AUDIO ONLY, no subtitles). The narration MUST be in Thai only.`;
          } else {
            video8Base = getRandomVideoPromptStep1() + VIDEO_PROMPT_STEP1_AUDIO;
          }
          {
            const batch8Text = preFlightPolicyScreen(sanitizeVideoPrompt(voiceGenderDirective + '\n\n' + video8Base + VIDEO_FONT_FREEZE_RULE + (batchSelectorBlock ? `\n\n${batchSelectorBlock}` : '')));
            const batch8WithDialogue = cleanShortDialogue
              ? batch8Text + `\n\nDIALOGUE / SPEECH CONTENT (CRITICAL — The character MUST say exactly this in Thai):\n"${cleanShortDialogue}"`
              : batch8Text;
            item.videoPrompt8 = JSON.stringify({
              step: 2, action: "Frame_to_Video", tool: "VEO 3.1",
              prompt_text: batch8WithDialogue,
              dialogue_script: cleanShortDialogue,
              technical_settings: VIDEO_PROMPT_STEP1.technical_settings
            }, null, 2);
          }

          item.videoPrompt = item.videoPrompt8;
          
          // ★ Generate Video Prompt 16s — รองรับ isNoPerson + selector settings ★
          let video16Base;
          if (batchIsPixar3D) {
            const bp3d16 = batchPixar3DInfo || item._pixar3DInfo;
            video16Base = `ACTION ONLY: Visually continue the scene seamlessly. ${bp3d16 ? bp3d16.id : 'The 3D character'} continues interacting with the product, showing more features excitedly. Speaking with young Thai female voice, MUST maintain consistent voice from previous clip. The character MUST speak in Thai only. Stable form, no morphing.`;
          } else if (isNoPerson && batchIsHandMode) {
            const batchCatVideoAction = getCategoryVideoAction(batchCategory2, item.name, true);
            video16Base = `Visually continue the scene seamlessly. Hands continue demonstrating product features. ${batchCatVideoAction} Thai female voice narration continues (AUDIO ONLY, no subtitles). The narration MUST be in Thai only.`;
          } else if (isNoPerson) {
            video16Base = `Visually continue the product showcase seamlessly. Show different angles or features of the product. Thai female voice narration continues (AUDIO ONLY, no subtitles). The narration MUST be in Thai only.`;
          } else {
            video16Base = getRandomVideoPromptStep2();
          }
          const voiceLock16 = detectedGender 
            ? `\nVOICE LOCK: MUST use the same ${detectedGender} Thai voice as the previous clip. Do NOT switch gender.`
            : '';
          {
            const batch16Text = preFlightPolicyScreen(sanitizeVideoPrompt(voiceGenderDirective + voiceLock16 + '\n\n' + video16Base + VIDEO_FONT_FREEZE_RULE + (batchSelectorBlock ? `\n\n${batchSelectorBlock}` : '')));
            const batch16WithDialogue = cleanContinuationDialogue
              ? batch16Text + `\n\nDIALOGUE / SPEECH CONTENT (CRITICAL — The character MUST continue saying exactly this in Thai):\n"${cleanContinuationDialogue}"`
              : batch16Text;
            item.videoPrompt16 = JSON.stringify({
              step: 3, action: "Extend_Video", tool: "VEO 3.1",
              prompt_text: batch16WithDialogue,
              dialogue_script: cleanContinuationDialogue,
              technical_settings: VIDEO_PROMPT_STEP2.technical_settings
            }, null, 2);
          }

          
          // ★ Store detected gender in item for reference ★
          item.voiceGender = detectedGender || 'unknown';
          
          // Store clean dialogues
          item.shortDialogue = cleanShortDialogue;
          item.continuationDialogue = cleanContinuationDialogue;
        }
        
        // ========== STEP 2: Caption & CTA — ใช้ค่าจาก unified content call ==========
        if (!item.caption) {
          addFlowLog(item.id, `⚠️ ${item.name}: Caption fallback`, 'warning');
          item.caption = `${item.name} ${item.highlight || ''} #TikTokShop #สินค้าดี`;
        }
        if (!item.cta) {
          addFlowLog(item.id, `⚠️ ${item.name}: CTA fallback`, 'warning');
          item.cta = 'กดสั่งซื้อเลย';
        }
        
        sanitizeAutopostItemHardBanned(item);
        
        // Update UI — แก้ค่าใน DOM ตรงๆ แทน full re-render (ลด lag กับ 30+ items)
        const captionInput = document.querySelector(`.caption-input[data-id="${item.id}"]`);
        const ctaInput = document.querySelector(`.cta-input[data-id="${item.id}"]`);
        if (captionInput) captionInput.value = item.caption;
        if (ctaInput) ctaInput.value = item.cta;
        const imgPromptEl = document.querySelector(`.prompt-textarea[data-id="${item.id}"][data-field="imagePrompt"]`);
        const vid8PromptEl = document.querySelector(`.prompt-textarea[data-id="${item.id}"][data-field="videoPrompt8"]`);
        const vid16PromptEl = document.querySelector(`.prompt-textarea[data-id="${item.id}"][data-field="videoPrompt16"]`);
        if (imgPromptEl) imgPromptEl.value = item.imagePrompt || '';
        if (vid8PromptEl) vid8PromptEl.value = item.videoPrompt8 || '';
        if (vid16PromptEl) vid16PromptEl.value = item.videoPrompt16 || '';
        
      } catch (itemError) {
        console.error(`Error generating for ${item.name}:`, itemError);
        addFlowLog(item.id, `❌ ${item.name}: เกิดข้อผิดพลาด`, 'error');
      }
      
      completed++;
      currentEl.textContent = completed;
      progressFill.style.width = `${(completed / productQueue.length) * 100}%`;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    saveQueueNow();
    renderProductQueue();
    addLog(`✅ สร้าง Prompts + Caption + CTA เสร็จสิ้น ${completed}/${productQueue.length} สินค้า`, 'success');
    
  } catch (error) {
    console.error('Generate all error:', error);
    addLog(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ Generate All';
    
    // Hide progress after 2 seconds
    setTimeout(() => {
      progressSection.style.display = 'none';
      progressFill.style.width = '0%';
    }, 2000);
  }
}

// AI Generate Caption และ CTA
async function handleGenerateAction(itemId, action) {
  const item = productQueue.find(p => p.id === itemId);
  if (!item) return;
  
  const btn = document.querySelector(`.generate-btn[data-id="${itemId}"][data-action="${action}"]`);
  const originalText = btn?.innerHTML;
  
  try {
    const result = await chrome.storage.local.get(['provider', 'openaiKey', 'googleKey']);
    let provider = result.provider || 'openai';
    let apiKey = provider === 'openai' ? result.openaiKey : result.googleKey;
    if (!apiKey && result.googleKey) { provider = 'google'; apiKey = result.googleKey; }
    else if (!apiKey && result.openaiKey) { provider = 'openai'; apiKey = result.openaiKey; }
    
    if (!apiKey) {
      showError('กรุณาตั้งค่า API Key ก่อนใช้งาน');
      return;
    }
    
    // Show loading
    if (btn) {
      btn.innerHTML = '<span class="spinner-small"></span>';
      btn.disabled = true;
    }
    
    let prompt = '';
    let targetField = '';
    
    if (action === 'generate-caption') {
      targetField = 'caption';
      // TODO: USER_PROMPT
      prompt = '';
    } else if (action === 'generate-cta') {
      targetField = 'cta';
      // TODO: USER_PROMPT
      prompt = '';
    }
    
    const messages = [
      { role: 'user', content: prompt }
    ];
    
    const response = await callAPI(provider, apiKey, messages);
    
    // Update item - ลบ " ออกจาก CTA
    let cleanedResponse = response.trim();
    if (targetField === 'cta') {
      cleanedResponse = cleanedResponse.replace(/^"|"$/g, '').replace(/"/g, '');
    }
    item[targetField] = cleanedResponse;
    saveQueue();
    
    // Update UI
    const inputEl = document.querySelector(
      targetField === 'caption' 
        ? `.caption-input[data-id="${itemId}"]`
        : `.cta-input[data-id="${itemId}"]`
    );
    if (inputEl) {
      inputEl.value = item[targetField];
    }
    
    addLog(`สร้าง ${targetField === 'caption' ? 'แคปชั่น' : 'CTA'} สำเร็จ`, 'success');
    
  } catch (error) {
    console.error('Generate error:', error);
    addLog(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
  } finally {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
}

async function handleQueueAction(itemId, action) {
  const item = productQueue.find(p => p.id === itemId);
  if (!item) return;
  
  const outputSection = document.getElementById('autopost-output');
  const outputContent = document.getElementById('autopost-content');
  
  try {
    const result = await chrome.storage.local.get(['provider', 'openaiKey', 'googleKey']);
    let provider = result.provider || 'openai';
    let apiKey = provider === 'openai' ? result.openaiKey : result.googleKey;
    if (!apiKey && result.googleKey) { provider = 'google'; apiKey = result.googleKey; }
    else if (!apiKey && result.openaiKey) { provider = 'openai'; apiKey = result.openaiKey; }
    
    if (!apiKey) {
      showError('กรุณาตั้งค่า API Key ก่อนใช้งาน (ไปที่แท็บ Settings)');
      return;
    }
    
    outputSection.style.display = 'block';
    outputContent.innerHTML = '<div class="loading"><div class="spinner"></div><span>กำลังประมวลผล...</span></div>';
    
    let prompt = '';
    let isCheckerMode = false;
    
    switch (action) {
      case 'ai':
        // AI Analyze - วิเคราะห์สินค้า
        // TODO: USER_PROMPT
        prompt = '';
        break;
      case 'media':
        // Generate Media - รวม Image + Video Prompt
        const clipDuration = item.clipDuration || runSettings.clipDuration || 8;
        // TODO: USER_PROMPT
        prompt = '';
        break;
      case 'check':
        // Policy Check - ตรวจ Script ตาม TikTok Policy
        isCheckerMode = true;
        const scriptToCheck = item.caption || item.highlight || item.name;
        prompt = await checkScriptPolicy(scriptToCheck, 'thai');
        break;
    }
    
    const messages = [
      { role: 'system', content: isCheckerMode ? '' : getEnhancedPrompt(item.hookCategory) },
      { role: 'user', content: prompt }
    ];
    
    addLog(`กำลัง ${action === 'ai' ? 'วิเคราะห์' : action === 'media' ? 'สร้าง Media' : 'ตรวจ Policy'}: ${item.name}`, 'info');
    
    const response = await callAPI(provider, apiKey, messages);
    
    // Handle checker mode differently
    if (isCheckerMode) {
      const checkerResult = parseCheckerResponse(response);
      outputContent.innerHTML = formatCheckerResult(checkerResult);
      
      // Save checker result to item
      item.policyCheck = checkerResult;
      
      // If clean_script available, offer to use it
      if (checkerResult.clean_script && checkerResult.violations?.length > 0) {
        item.cleanCaption = checkerResult.clean_script;
      }
    } else {
      outputContent.textContent = response;
    }
    
    // อัพเดทสถานะ
    item.status = 'processing';
    item[action + 'Result'] = response;
    renderProductQueue();
    saveQueue();
    
    addLog(`${action === 'ai' ? 'วิเคราะห์' : action === 'media' ? 'สร้าง Media' : 'ตรวจ Policy'} เสร็จสิ้น`, 'success');
    
  } catch (error) {
    addLog(`Error: ${error.message}`, 'error');
    outputContent.textContent = `Error: ${error.message}`;
  }
}

// ★ Debounced saveQueue — ลดการเขียน storage ซ้ำถี่เกินไป (รอ 1.5 วิ แล้วค่อย save ครั้งเดียว) ★
let _saveQueueTimer = null;
function saveQueue() {
  if (_saveQueueTimer) clearTimeout(_saveQueueTimer);
  _saveQueueTimer = setTimeout(() => {
    _saveQueueTimer = null;
    chrome.storage.local.set({ productQueue });
  }, 1500);
}
// ★ Force save ทันที — ใช้ตอนที่ต้อง save จริงๆ ก่อน navigate/flow change ★
function saveQueueNow() {
  if (_saveQueueTimer) clearTimeout(_saveQueueTimer);
  _saveQueueTimer = null;
  chrome.storage.local.set({ productQueue });
}

async function loadSavedQueue() {
  const result = await chrome.storage.local.get(['productQueue']);
  if (result.productQueue && result.productQueue.length > 0) {
    productQueue = result.productQueue;
    renderProductQueue();
    updateProductCount();
  }
}

function updateProductCount() {
  const countEl = document.getElementById('product-count');
  if (countEl) {
    countEl.textContent = productQueue.length;
  }
  
  // Enable/disable Run button
  const runBtn = document.getElementById('run-btn');
  if (runBtn) {
    runBtn.disabled = productQueue.length === 0;
  }
}

// ==================== Auto Post Control Functions ====================

// ★ วิเคราะห์สินค้าจากรูปภาพด้วย AI — ส่งรูปสินค้าให้ AI ดูแล้วส่ง description กลับมา ★
async function analyzeProductWithAI(item, provider, apiKey) {
  // ข้ามถ้ามี productAnalysis แล้ว หรือไม่มีรูปสินค้า
  if (item.productAnalysis) return item.productAnalysis;
  if (!item.image) return null;
  
  addFlowLog(item.id, `🔍 ${item.name}: AI กำลังวิเคราะห์รูปสินค้า...`, 'info');
  
  try {
    // ★ ดึงรูปสินค้าแปลงเป็น base64 ★
    let imageBase64 = null;
    let imageMime = 'image/jpeg';
    
    if (item.image.startsWith('data:')) {
      // รูปเป็น base64 อยู่แล้ว
      imageBase64 = item.image.replace(/^data:image\/\w+;base64,/, '');
      imageMime = item.image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    } else {
      // รูปเป็น URL → fetch แล้วแปลง base64
      const imgResponse = await fetch(item.image);
      if (!imgResponse.ok) throw new Error(`Fetch image failed: ${imgResponse.status}`);
      const imgBlob = await imgResponse.blob();
      imageMime = imgBlob.type || 'image/jpeg';
      
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(imgBlob);
      const dataUrl = await base64Promise;
      imageBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    }
    
    if (!imageBase64) throw new Error('ไม่สามารถแปลงรูปสินค้าเป็น base64 ได้');
    
    // ★ ส่งรูปให้ Gemini Vision วิเคราะห์ ★
    // TODO: USER_PROMPT
    const analysisPrompt = '';

    // ★ ใช้ Google Gemini Vision (multimodal) เสมอ เพราะต้องส่งรูป ★
    const googleKey = (await chrome.storage.local.get(['googleKey'])).googleKey || apiKey;
    
    const data = await fetchGeminiWithFallback(googleKey, {
      contents: [{
        parts: [
          { inlineData: { mimeType: imageMime, data: imageBase64 } },
          { text: analysisPrompt }
        ]
      }]
    }, 2048, 0.3);
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanText = rawText.trim().replace(/```json\n?|\n?```/g, '');
    
    try {
      const analysis = JSON.parse(cleanText);
      screenProductAnalysisObject(analysis);
      item.productAnalysis = analysis;
      addFlowLog(item.id, `✅ ${item.name}: วิเคราะห์สินค้าเสร็จ — ${analysis.productType} (${analysis.brand || 'ไม่ระบุ'})`, 'success');
      console.log('[ProductAnalysis]', item.name, analysis);
      return analysis;
    } catch (parseErr) {
      // Fallback: เก็บเป็น text ถ้า parse JSON ไม่ได้
      item.productAnalysis = { summary_en: cleanText, raw: true };
      addFlowLog(item.id, `✅ ${item.name}: วิเคราะห์สินค้าเสร็จ (text mode)`, 'success');
      return item.productAnalysis;
    }
  } catch (err) {
    console.warn('[ProductAnalysis] Error:', err.message);
    addFlowLog(item.id, `⚠️ ${item.name}: วิเคราะห์สินค้าไม่สำเร็จ — ${err.message}`, 'warning');
    return null;
  }
}

// Generate Image & Video Prompts for item using AI
async function generatePromptsForItem(item) {
  const result = await chrome.storage.local.get(['provider', 'openaiKey', 'googleKey']);
  let provider = result.provider || 'openai';
  let apiKey = provider === 'openai' ? result.openaiKey : result.googleKey;
  if (!apiKey && result.googleKey) { provider = 'google'; apiKey = result.googleKey; }
  else if (!apiKey && result.openaiKey) { provider = 'openai'; apiKey = result.openaiKey; }
  
  if (!apiKey) {
    throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน (OpenAI หรือ Google AI)');
  }

  // ★ Auto-apply shared settings ถ้า item ยังไม่มี ★
  if (!item.characterImage && sharedCharacterImageBase64) {
    item.characterImage = sharedCharacterImageBase64;
    addFlowLog(item.id, `📸 ${item.name}: ใช้รูปตัวละครร่วม`, 'info');
  }

  // ★ ใช้ pipeline เดียวกับปุ่ม "สร้าง Prompts ทั้งหมด" — รองรับ selector + Hook + AI ★
  await generateAllPromptsForItemInternal(item, provider, apiKey, {
    skipContentIfExists: !!(item.h1Headline || item.h2Subtitle || item.caption),
    skipSaveRender: true
  });

  saveQueueNow();
  return item;
}

// ★ Processing lock — ป้องกัน processFlowItem ถูกเรียกซ้อน (race condition จาก STEP_COMPLETED + storage listener) ★
let _isProcessingFlowStep = false;
let _pendingFlowItem = null;

// Process item through the flow
async function processFlowItem(item) {
  // ★ Lock: ถ้ากำลัง process อยู่ → จำ item ไว้แต่ไม่ทำซ้ำ ★
  if (_isProcessingFlowStep) {
    console.log(`[AutoPost] processFlowItem LOCKED — already processing. Skipping duplicate call for: ${item.name}`);
    addFlowLog(item.id, `⏸️ ${item.name}: รอ step ก่อนหน้า...`, 'info');
    _pendingFlowItem = item; // จำไว้กรณี step index เปลี่ยนระหว่าง lock
    return;
  }
  _isProcessingFlowStep = true;
  _pendingFlowItem = null;
  
  try {
  addFlowLog(item.id, `🔄 ${item.name}: เริ่ม processFlow`, 'info');
  
  const clipDuration = item.clipDuration || runSettings.clipDuration || 8;
  const steps = FLOW_CONFIG[clipDuration] || FLOW_CONFIG[8];
  
  addFlowLog(item.id, `📋 ${item.name}: ${steps.length} steps`, 'info');
  
  // Initialize flow state if not exists
  if (!item.flowState) {
    item.flowState = {
      currentStepIndex: 0,
      completedSteps: [],
      status: 'running'
    };
  }
  
  // Generate prompts if not exists
  if (!item.imagePrompt || !item.videoPrompt) {
    addFlowLog(item.id, `⚡ ${item.name}: สร้าง Prompts...`, 'info');
    await generatePromptsForItem(item);
  }
  
  // ★ Caption + CTA fallback — ปกติจะมีค่าจาก unified content call แล้ว ★
  if (!item.caption) {
    addFlowLog(item.id, `⚠️ ${item.name}: Caption fallback (Auto Post)`, 'warning');
    item.caption = `${item.name} ${item.highlight || ''} #TikTokShop #สินค้าดี`;
  }
  if (!item.cta) {
    addFlowLog(item.id, `⚠️ ${item.name}: CTA fallback (Auto Post)`, 'warning');
    item.cta = 'กดสั่งซื้อเลย';
  }
  
  saveQueueNow();
  
  // Get current step
  const currentStep = steps[item.flowState.currentStepIndex];
  
  if (!currentStep) {
    // All steps completed
    item.flowState.status = 'completed';
    item.status = 'completed';
    addFlowLog(item.id, `✅ ${item.name}: เสร็จสิ้น`, 'success');
    saveQueueNow();
    return;
  }
  
  addFlowLog(item.id, `▶️ ${item.name}: ${FLOW_STEP_LABELS[currentStep]}`, 'info');
  
  // Execute step (Content Script จะรับช่วงต่อ)
  try {
    await executeFlowStep(item, currentStep);
  } catch (stepError) {
    console.error('[AutoPost] executeFlowStep error:', stepError);
    addFlowLog(item.id, `❌ ${item.name}: Step ล้มเหลว — ${stepError.message}`, 'error');
    // ★ ส่งต่อให้ handleFlowStepFailed จัดการ (skip item + ทำรายการถัดไป) ★
    await handleFlowStepFailed({ message: stepError.message, itemId: item.id });
  }
  
  } finally {
    _isProcessingFlowStep = false;
    // ★ ถ้ามี pending item (ถูกเรียกซ้ำระหว่าง lock) → process ต่อ ★
    if (_pendingFlowItem) {
      const pending = _pendingFlowItem;
      _pendingFlowItem = null;
      console.log(`[AutoPost] Processing pending flow item after lock released: ${pending.name}`);
      processFlowItem(pending);
    }
  }
}

// Execute a single flow step
async function executeFlowStep(item, step) {
  addFlowLog(item.id, `⚡ ${item.name}: step=${step}`, 'info');
  currentFlowItem = item;
  
  // ★ GUARD: เช็ค flowStatus ก่อนทำ step — ถ้า video เสร็จแล้ว (content script ทำทั้ง image+video ในรอบเดียว)
  // ★ ห้ามไป reload Google Flow tab ทับ TikTok ที่กำลังจะเริ่ม! ★
  if (step === FLOW_STEPS.CREATE_IMAGE || step === FLOW_STEPS.FRAME_TO_VIDEO) {
    const storageCheck = await chrome.storage.local.get(['flowStatus']);
    const guardClipDuration = item.clipDuration || runSettings.clipDuration || 8;
    // ★ FIX: ถ้า 16 วิ mode + video_saved_8s → ยังไม่เสร็จ ยังต้อง extend → ห้าม skip ★
    const videoReadyStatuses = guardClipDuration >= 16
      ? ['video_saved_16s', 'completed_16s', 'completed_download', 'video_downloaded_16s']
      : ['video_saved', 'video_saved_8s', 'completed_8s', 'completed_download'];
    if (videoReadyStatuses.includes(storageCheck.flowStatus)) {
      console.log(`[AutoPost] executeFlowStep: SKIPPING ${step} — flowStatus is already "${storageCheck.flowStatus}" (video done!)`);
      addFlowLog(item.id, `⏭️ ${item.name}: ข้าม ${step} — video เสร็จแล้ว`, 'info');
      
      // ★ Jump ไป UPLOAD_TIKTOK โดยตรง ★
      const clipDuration = item.clipDuration || runSettings.clipDuration || 8;
      const steps = FLOW_CONFIG[clipDuration];
      const uploadStepIndex = steps.indexOf(FLOW_STEPS.UPLOAD_TIKTOK);
      if (uploadStepIndex >= 0) {
        for (let i = item.flowState.currentStepIndex; i < uploadStepIndex; i++) {
          if (!item.flowState.completedSteps.includes(steps[i])) {
            item.flowState.completedSteps.push(steps[i]);
          }
        }
        item.flowState.currentStepIndex = uploadStepIndex;
        saveQueueNow();
        renderProductQueue();
        addFlowLog(item.id, `📤 ${item.name}: กำลังเริ่ม TikTok Upload...`, 'info');
        await openTikTokUpload(item);
      }
      return; // ไม่ต้องทำ step เดิม
    }
  }
  
  switch(step) {
    case FLOW_STEPS.CREATE_IMAGE:
      // เปิด Google Flow และส่ง imagePrompt
      addFlowLog(item.id, `🖼️ ${item.name}: เริ่มสร้างรูปภาพ...`, 'info');
      await openGoogleFlow(item, 'image');
      break;
      
    case FLOW_STEPS.FRAME_TO_VIDEO:
      // ★ FIX: content-googleflow.js ทำ video ต่อจาก image อัตโนมัติแล้ว ★
      // ★ ห้าม openGoogleFlow(video) อีก → จะ reload tab ทับ TikTok ที่กำลังจะเริ่ม! ★
      // ★ แค่รอ poll flowStatus จนเป็น video_ready หรือ completed_download แล้วข้ามไป UPLOAD_TIKTOK ★
      addFlowLog(item.id, `🎬 ${item.name}: กำลังสร้างวิดีโอ...`, 'info');
      updateFlowStep(item.id, '🎬 กำลังสร้างวิดีโอ...', item.name);
      {
        const clipDur8or16 = item.clipDuration || runSettings.clipDuration || 8;
        const VIDEO_POLL_TIMEOUT = clipDur8or16 >= 16 ? 25 * 60 * 1000 : 10 * 60 * 1000; // 16วิ=25นาที, 8วิ=10นาที
        const VIDEO_POLL_INTERVAL = 5000; // 5 วิ
        const videoStartTime = Date.now();
        // ★ FIX: ถ้า 16 วิ mode → ห้าม break ที่ video_saved_8s (ยังต้อง extend ต่อ) ★
        const videoReadySet = clipDur8or16 >= 16
          ? new Set(['video_saved_16s', 'completed_16s', 'completed_download', 'video_downloaded_16s'])
          : new Set(['video_saved', 'video_saved_8s', 'completed_8s', 'completed_download']);
        let videoReady = false;
        
        while (Date.now() - videoStartTime < VIDEO_POLL_TIMEOUT) {
          if (!isScraperRunning) {
            addLog('⏹️ หยุดโดยผู้ใช้', 'warning');
            return;
          }
          const pollResult = await chrome.storage.local.get(['flowStatus']);
          if (videoReadySet.has(pollResult.flowStatus)) {
            addFlowLog(item.id, `✅ ${item.name}: Video เสร็จแล้ว!`, 'success');
            videoReady = true;
            break;
          }
          // ★ 16 วิ mode: แสดง status ว่ากำลัง extend เมื่อเจอ video_saved_8s ★
          if (clipDur8or16 >= 16 && pollResult.flowStatus === 'video_saved_8s') {
            const elapsed = Math.round((Date.now() - videoStartTime) / 1000);
            if (elapsed % 15 === 0) {
              addFlowLog(item.id, `🎞️ ${item.name}: Video 8 วิ เสร็จ — กำลัง Extend เป็น 16 วิ... (${elapsed} วิ)`, 'info');
              updateFlowStep(item.id, `🎞️ Extend เป็น 16 วิ... ${elapsed} วิ`, item.name);
            }
          }
          if (pollResult.flowStatus === 'flow_error') {
            throw new Error('Video generation failed (flow_error)');
          }
          const elapsed = Math.round((Date.now() - videoStartTime) / 1000);
          if (elapsed % 30 === 0) {
            addFlowLog(item.id, `🎬 ${item.name}: รอวิดีโอ... ${elapsed} วิ`, 'info');
            updateFlowStep(item.id, `🎬 รอวิดีโอ... ${elapsed} วิ`, item.name);
          }
          await new Promise(r => setTimeout(r, VIDEO_POLL_INTERVAL));
        }
        
        if (!videoReady) {
          throw new Error(`Video generation timeout (${clipDur8or16 >= 16 ? '25' : '10'} min)`);
        }
        
        // ★ Video เสร็จ → auto-advance ไป UPLOAD_TIKTOK ★
        // (content script navigate ไป TikTok แล้ว — ต้อง advance step ให้ sidepanel ตาม)
        addFlowLog(item.id, `⏭️ ${item.name}: Video เสร็จ → ไป TikTok Upload`, 'info');
        const clipDur = item.clipDuration || runSettings.clipDuration || 8;
        const allSteps = FLOW_CONFIG[clipDur];
        const uploadIdx = allSteps.indexOf(FLOW_STEPS.UPLOAD_TIKTOK);
        if (uploadIdx >= 0) {
          // Mark FRAME_TO_VIDEO as completed
          if (!item.flowState.completedSteps.includes(FLOW_STEPS.FRAME_TO_VIDEO)) {
            item.flowState.completedSteps.push(FLOW_STEPS.FRAME_TO_VIDEO);
          }
          item.flowState.currentStepIndex = uploadIdx;
          saveQueueNow();
          renderProductQueue();
          // เรียก openTikTokUpload โดยตรง (ไม่ต้องผ่าน processFlowItem อีกรอบ)
          addFlowLog(item.id, `📤 ${item.name}: เริ่ม TikTok Upload...`, 'info');
          await openTikTokUpload(item);
        }
      }
      break;
      
    case FLOW_STEPS.SCREEN_BUILDER:
      // เปิด ScreenBuilder (เฉพาะ 16 วิ)
      await openScreenBuilder(item);
      break;
      
    case FLOW_STEPS.UPLOAD_TIKTOK:
      // เปิด TikTok Upload
      await openTikTokUpload(item);
      break;
      
    case FLOW_STEPS.POST_TIKTOK:
      // โพสต์ TikTok
      await postToTikTok(item);
      break;
  }
}

// ★ Helper: รอ tab load เสร็จ (status === 'complete') ★
async function waitForTabLoaded(tabId, timeoutMs = 20000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === 'complete') {
        console.log('[SidePanel] Tab loaded:', tab.url?.substring(0, 60));
        return true;
      }
    } catch (e) {
      console.log('[SidePanel] waitForTabLoaded error:', e);
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('[SidePanel] waitForTabLoaded timeout after', timeoutMs, 'ms');
  return false;
}

function extractPromptText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed.prompt_text || trimmed;
    } catch (e) { /* not JSON */ }
  }
  return trimmed;
}

// Open Google Flow and send data
async function openGoogleFlow(item, mode) {
  addFlowLog(item.id, `🌐 ${item.name}: เปิด Google Flow (${mode})...`, 'info');
  console.log('[SidePanel] openGoogleFlow called with:', { item, mode });
  
  const clipDuration = item.clipDuration || runSettings.clipDuration || 8;
  
  // Get the correct prompt based on mode and duration — sanitize + pre-flight policy screen
  let prompt = '';
  if (mode === 'image') {
    prompt = preFlightPolicyScreen(sanitizeVideoPrompt(item.imagePrompt || ''));
  } else {
    if (clipDuration === 16) {
      prompt = preFlightPolicyScreen(sanitizeVideoPrompt(item.videoPrompt16 || item.videoPrompt || ''));
    } else {
      prompt = preFlightPolicyScreen(sanitizeVideoPrompt(item.videoPrompt8 || item.videoPrompt || ''));
    }
  }
  
  // Store current flow data for content script to pick up
  const flowData = {
    itemId: item.id,
    mode: mode, // 'image' or 'video'
    prompt: prompt,
    productName: item.name,
    productId: item.productId || item.id || '', // Product ID สำหรับค้นหาใน TikTok
    imageUrl: item.image || item.imageUrl || '', // URL รูปสินค้าจาก sidebar
    productImageBase64: smProductImage || item.productImageBase64 || '', // ★ รูปสินค้า base64 จาก Storymode ★
    characterUrl: item.characterImage || item.characterUrl || '', // URL รูปตัวละคร (ถ้ามี)
    h1Headline: item.h1Headline,
    h2Subtitle: item.h2Subtitle,
    caption: item.caption || '', // Caption สำหรับโพสต์ลง TikTok
    cta: item.cta || '', // CTA (Call to Action) สำหรับใส่ใน TikTok Product Link
    clipDuration: item.clipDuration || runSettings.clipDuration || 8,
    videoPromptData: item.videoPromptData || null,
    hookId: item.hookId != null ? item.hookId : null,
    hookIdFromVideo: item.hookIdFromVideo != null ? item.hookIdFromVideo : null,
    hookIdFromContent: item.hookIdFromContent != null ? item.hookIdFromContent : null,
    selectedHookId: item.selectedHookId != null ? item.selectedHookId : null,
    videoPrompt8: extractPromptText(item.videoPrompt8 || item.videoPrompt || ''),
    videoPrompt16: extractPromptText(item.videoPrompt16 || ''),
    postMode: runSettings.postMode || 'post', // ★ 'post', 'schedule' หรือ 'draft' ★
    scheduleTime: (runSettings.postMode === 'schedule' && runSettings.scheduleTimes.length > 0) 
      ? runSettings.scheduleTimes[productQueue.indexOf(item)] || runSettings.scheduleTimes[0] 
      : null,
    // ★ PD-INSPIRED: Explicit model selection ★
    flowImageModel: document.getElementById('flow-image-model')?.value || 'auto',
    flowVideoModel: document.getElementById('flow-video-model')?.value || 'auto',
    timestamp: Date.now()
  };
  
  // Save flow data to storage for content script
  // ★ flowType: 'autopost' เพื่อแยกจาก Storymode/Studio ★
  await chrome.storage.local.set({ 
    currentFlowData: flowData,
    autopostTargetClipDuration: clipDuration,
    autopostTargetItemId: item.id,
    flowStatus: 'waiting_for_flow',
    flowType: 'autopost'
  });
  
  // Check if Google Flow tab already exists
  const tabs = await chrome.tabs.query({ url: 'https://labs.google/fx/tools/flow*' });
  
  // ★ Zoom level สำหรับ Google Flow tab ★
  const zoomLevel = runSettings.zoomLevel || 100;
  const zoomFactor = zoomLevel / 100; // chrome.tabs.setZoom ใช้ค่า 0-1 (0.33 = 33%)
  let flowTabId = null;
  
  if (tabs.length > 0) {
    // ★ Tab exists → reload ไปหน้า Google Flow ใหม่เสมอ (reset state หลัง error/crash) ★
    flowTabId = tabs[0].id;
    addFlowLog(item.id, `🔄 ${item.name}: Reload Google Flow...`, 'info');
    await chrome.tabs.update(flowTabId, { url: FLOW_URLS.GOOGLE_FLOW, active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
    
    // ★ v3.04: รอ tab load เสร็จ → content script จะอ่าน storage เอง ★
    addFlowLog(item.id, `⏳ ${item.name}: รอ Google Flow โหลด...`, 'info');
    await waitForTabLoaded(flowTabId, 20000);
    
    addFlowLog(item.id, `📤 ${item.name}: ส่งข้อมูลไป Google Flow แล้ว`, 'success');
  } else {
    // ★ ไม่เปิด tab ใหม่ → ใช้ active tab เดิม navigate ไป Google Flow (ประหยัด RAM) ★
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
      flowTabId = activeTab.id;
      addFlowLog(item.id, `🔄 ${item.name}: Navigate ไป Google Flow...`, 'info');
      await chrome.tabs.update(activeTab.id, { url: FLOW_URLS.GOOGLE_FLOW });
    } else {
      // Fallback: ถ้าไม่มี active tab → เปิดใหม่
      const newTab = await chrome.tabs.create({
        url: FLOW_URLS.GOOGLE_FLOW,
        active: true
      });
      flowTabId = newTab.id;
      addFlowLog(item.id, `🆕 ${item.name}: เปิด Tab Google Flow ใหม่`, 'info');
    }
    
    // ★ v3.04: รอ tab load เสร็จ → content script จะอ่าน storage เอง ★
    if (flowTabId) {
      addFlowLog(item.id, `⏳ ${item.name}: รอ Google Flow โหลด...`, 'info');
      await waitForTabLoaded(flowTabId, 20000);
    }
  }
  
  // ★ ตั้ง Zoom ของ Google Flow tab ผ่าน Chrome API ★
  if (flowTabId && zoomLevel !== 100) {
    try {
      await chrome.tabs.setZoom(flowTabId, zoomFactor);
      addFlowLog(item.id, `🔍 ${item.name}: Zoom Google Flow ${zoomLevel}%`, 'info');
    } catch (e) {
      console.log('[SidePanel] setZoom error:', e);
    }
  }
  
  // Update item status
  item.flowStatus = `waiting_${mode}`;
  saveQueueNow();
  renderProductQueue();
}

async function openScreenBuilder(item) {
  addFlowLog(item.id, `⏭️ ${item.name}: ข้าม ScreenBuilder (ยังไม่รองรับ) → ไปขั้นตอนถัดไป`, 'info');
  console.log('[AutoPost] openScreenBuilder: skipping (not implemented) — auto-completing step');
  completeCurrentStep(item.id);
}

async function openTikTokUpload(item) {
  addFlowLog(item.id, `📤 ${item.name}: รอ TikTok Upload + Post...`, 'info');
  updateFlowStep(item.id, '📤 รอ TikTok Upload + Post...', item.name);
  console.log('[AutoPost] openTikTokUpload: waiting for TikTok content script to upload & post...');
  
  // ★ Content script (content-googleflow.js downloadVideoAndOpenTikTok) navigate ไป TikTok แล้ว
  // ★ TikTok content script (content.js) จะ upload video + กด Post → set currentItemPosted: true
  // ★ เรา poll รอจนกว่า currentItemPosted === true หรือ timeout (8วิ=15นาที, 16วิ=25นาที)
  
  const clipDuration = item.clipDuration || runSettings.clipDuration || 8;
  const TIKTOK_TIMEOUT_MS = clipDuration >= 16 ? 25 * 60 * 1000 : 15 * 60 * 1000; // 16วิ=25นาที, 8วิ=15นาที
  const POLL_INTERVAL_MS = 5000; // เช็คทุก 5 วิ
  const startTime = Date.now();
  let lastLog = 0;
  
  while (Date.now() - startTime < TIKTOK_TIMEOUT_MS) {
    if (!isScraperRunning) {
      addFlowLog(item.id, `⏹️ ${item.name}: หยุดโดยผู้ใช้`, 'warning');
      return;
    }
    
    // เช็ค currentItemPosted
    const result = await chrome.storage.local.get(['currentItemPosted', 'flowStatus']);
    
    if (result.currentItemPosted === true) {
      console.log('[AutoPost] TikTok posted! currentItemPosted === true');
      addFlowLog(item.id, `✅ ${item.name}: TikTok เสร็จแล้ว!`, 'success');
      updateFlowStep(item.id, '✅ เสร็จ!', item.name);
      
      // ★ Clear flags + มาร์ก posted — ไม่ลบออกจาก queue ★
      await chrome.storage.local.set({ 
        currentItemPosted: false,
        currentItemPostedAt: null,
        flowStatus: 'waiting_for_flow',
        flowMessage: null,
        currentFlowData: null,
        autopostTargetClipDuration: null,
        autopostTargetItemId: null
      });
      
      // Mark item posted (ไม่ shift)
      item.status = 'posted';
      item.posted = true;
      item.postedAt = new Date().toISOString();
      addLog(`✅ เสร็จ: ${item.name}`, 'success');
      recordFlowItemResult(item.id, 'success', 'เสร็จสมบูรณ์', item.name);
      
      _lastPostedItemId = item.id;
      _lastPostedTime = Date.now();
      
      saveQueueNow();
      renderProductQueue();
      
      // Reset ALL guards
      _isProcessingFlowStep = false;
      _pendingFlowItem = null;
      _isPostingToTikTok = false;
      _isHandlingPosted = false;
      
      // ★ หารายการถัดไป (pending) หรือ retry ★
      const cycleResult = checkAllCompleteOrRetry();
      if ((cycleResult === 'continue' || cycleResult === 'retry') && isScraperRunning) {
        const nextPending = getNextPendingItem();
        if (nextPending) {
          const remaining = getRemainingCount();
          addLog(`🚀 เริ่มรายการถัดไป: ${nextPending.name} (เหลือ ${remaining})`, 'info');
          addFlowLog(nextPending.id, `📦 เหลือ ${remaining} รายการ — ถัดไป: ${nextPending.name}`, 'info');
          if (cycleResult === 'retry') {
            addLog(`🔄 เริ่ม Retry รอบใหม่ — ทำรายการที่ล้มเหลวซ้ำ`, 'warning');
          }
        }
        // ★ FIX: 16 วิ ต้อง delay นานกว่า 8 วิ เพื่อให้ TikTok tab settle ก่อนเริ่มรายการถัดไป ★
        const nextDelay = clipDuration >= 16 ? 20000 : 10000;
        addFlowLog(item.id, `⏳ รอ ${nextDelay/1000} วิ ก่อนรายการถัดไป...`, 'info');
        await new Promise(resolve => setTimeout(resolve, nextDelay));
        startNextItemFlow();
      } else {
        const stats = getQueueStats();
        addLog(`🎉 ทำครบทุกสินค้าแล้ว! (สำเร็จ ${stats.posted}, ล้มเหลว ${stats.failed}, ข้าม ${stats.skipped})`, 'success');
        isScraperRunning = false;
        updateControlButtons();
        completeFlowProgress();
      }
      return;
    }
    
    // เช็ค flow_error
    if (result.flowStatus === 'flow_error') {
      addFlowLog(item.id, `❌ ${item.name}: TikTok Upload ล้มเหลว`, 'error');
      await chrome.storage.local.set({ flowStatus: null, flowMessage: null });
      throw new Error('TikTok upload/post failed');
    }
    
    // Log ทุก 30 วิ
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    if (Date.now() - lastLog > 30000) {
      addFlowLog(item.id, `📤 ${item.name}: รอ TikTok Upload... ${elapsed} วิ`, 'info');
      updateFlowStep(item.id, `⏳ รอ TikTok Upload... ${elapsed} วิ`, item.name);
      lastLog = Date.now();
    }
    
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  
  // Timeout
  addFlowLog(item.id, `⏰ ${item.name}: TikTok Upload timeout`, 'error');
  throw new Error(`TikTok upload timeout after ${clipDuration >= 16 ? '25' : '15'} minutes`);
}

// ★ Guard ป้องกัน postToTikTok ถูกเรียกซ้ำ (จาก openTikTokUpload poll + processFlowItem advance) ★
let _isPostingToTikTok = false;

async function postToTikTok(item) {
  // ★ ป้องกัน double-call → นับสินค้าเสร็จซ้ำ ★
  if (_isPostingToTikTok) {
    console.log(`[AutoPost] postToTikTok LOCKED — already posting ${item.name}, skip duplicate`);
    return;
  }
  _isPostingToTikTok = true;
  
  try {
    console.log(`[AutoPost] postToTikTok START: item="${item.name}", queueLength=${productQueue.length}, guards: processing=${_isProcessingFlowStep}, handling=${_isHandlingPosted}`);
    addFlowLog(item.id, `✅ ${item.name}: โพส TikTok เสร็จสมบูรณ์!`, 'success');
    updateFlowStep(item.id, '✅ โพสเสร็จ!', item.name);
    
    // ★ CRITICAL FIX: Force-reset processing guard ก่อนเรียก handleItemPostedComplete ★
    // ★ เพราะเราอยู่ใน call chain ของ processFlowItem → executeFlowStep → openTikTokUpload → postToTikTok ★
    // ★ ถ้าไม่ปลดตอนนี้ handleItemPostedComplete จะ shift queue → setTimeout(startNextItemFlow) ★
    // ★ แต่ processFlowItem finally block จะ process _pendingFlowItem ซ้อนอีกรอบ ★
    _isProcessingFlowStep = false;
    _pendingFlowItem = null;
    console.log('[AutoPost] postToTikTok: force-reset _isProcessingFlowStep before handleItemPostedComplete');
    
    await handleItemPostedComplete();
    console.log(`[AutoPost] postToTikTok END: queueLength=${productQueue.length}`);
  } finally {
    _isPostingToTikTok = false;
  }
}

// Mark current step as complete and move to next
function completeCurrentStep(itemId) {
  const item = productQueue.find(p => p.id === itemId);
  if (!item || !item.flowState) return;
  
  const clipDuration = item.clipDuration || 8;
  const steps = FLOW_CONFIG[clipDuration];
  const currentStep = steps[item.flowState.currentStepIndex];
  
  item.flowState.completedSteps.push(currentStep);
  item.flowState.currentStepIndex++;
  
  saveQueueNow();
  renderProductQueue();
  
  // Continue to next step
  processFlowItem(item);
}

// ★ Item timeout watchdog — ถ้า item ค้างเกิน 15 นาที → auto-skip ★
let _itemWatchdogTimer = null;
let _itemWatchdogStartTime = null;
const ITEM_TIMEOUT_MS = 30 * 60 * 1000; // 30 นาที (16s clip ใช้เวลา video+upload+post ~25 นาทีได้)

function startItemWatchdog() {
  stopItemWatchdog(); // clear เก่าก่อน
  _itemWatchdogStartTime = Date.now();
  _itemWatchdogTimer = setInterval(async () => {
    if (!isScraperRunning) { stopItemWatchdog(); return; }
    const elapsed = Date.now() - _itemWatchdogStartTime;
    const currentItem = productQueue.find(p => p.status === 'processing');
    if (!currentItem) { 
      // ไม่มี item processing → reset timer
      _itemWatchdogStartTime = Date.now();
      return; 
    }
    if (elapsed > ITEM_TIMEOUT_MS) {
      console.log(`[Watchdog] Item "${currentItem.name}" stuck for ${Math.round(elapsed/1000)}s — auto-skipping!`);
      addLog(`⏰ Timeout 30 นาที: ${currentItem.name} — ข้ามอัตโนมัติ`, 'error');
      handleFlowStepFailed({ message: `Timeout: item stuck for ${Math.round(elapsed/60000)} minutes` });
    }
  }, 30000); // เช็คทุก 30 วิ
  console.log('[Watchdog] Item watchdog started (30 min timeout)');
}

function stopItemWatchdog() {
  if (_itemWatchdogTimer) { clearInterval(_itemWatchdogTimer); _itemWatchdogTimer = null; }
  _itemWatchdogStartTime = null;
}

// ★ Reset watchdog เมื่อ item ใหม่เริ่ม ★
function resetItemWatchdog() {
  _itemWatchdogStartTime = Date.now();
}

function runAutoPost() {
  addLog('🚀 runAutoPost() เริ่มทำงาน', 'info');
  
  if (productQueue.length === 0) {
    showError('ไม่มีสินค้าในคิว กรุณาดึงสินค้าก่อน');
    return;
  }
  
  isScraperRunning = true;
  updateControlButtons();
  
  // ★ เริ่ม item timeout watchdog ★
  startItemWatchdog();
  
  // Log current settings
  console.log('Running with settings:', runSettings);
  addLog(`⚙️ Settings: คลิป ${runSettings.clipDuration} วิ`, 'info');
  
  // Reset all items to pending if no pending items found (allow re-run)
  let pendingItem = getNextPendingItem();
  
  if (!pendingItem) {
    addLog('🔄 Reset สถานะสินค้าทั้งหมดเป็น pending...', 'info');
    productQueue.forEach(item => {
      item.status = 'pending';
      item.flowState = null;
      item.retryCount = 0;
    });
    saveQueueNow();
    renderProductQueue();
    pendingItem = getNextPendingItem();
  }
  
  // Initialize Progress Card
  resetFlowStats(productQueue.length);
  
  if (pendingItem) {
    addLog(`📦 เริ่มประมวลผล: ${pendingItem.name}`, 'info');
    pendingItem.status = 'processing';
    pendingItem.clipDuration = runSettings.clipDuration;
    renderProductQueue();
    saveQueueNow();
    
    // ★ Clear stale storage ก่อน item แรก (ป้องกัน data จาก run ก่อนหลุดเข้ามา) ★
    chrome.storage.local.set({
      currentFlowData: null,
      autopostTargetClipDuration: null,
      autopostTargetItemId: null,
      currentItemPosted: false,
      flowStatus: 'waiting_for_flow',
      flowMessage: ''
    });
    
    updateFlowStep(pendingItem.id, '🖼️ เริ่มสร้างรูปภาพ...', pendingItem.name);
    
    addLog('▶️ เริ่ม processFlowItem...', 'info');
    processFlowItem(pendingItem);
  } else {
    addLog('⚠️ ไม่พบสินค้าในคิว', 'warning');
  }
}

// Get current run settings
function getRunSettings() {
  return runSettings;
}

function stopAutoPost() {
  if (!isScraperRunning) return;
  
  isScraperRunning = false;
  stopItemWatchdog(); // ★ หยุด watchdog ★
  
  // ★ FIX: Clear dedup timer ป้องกัน startNextItemFlow fire หลังหยุด ★
  if (_pendingStartNextTimer) {
    clearTimeout(_pendingStartNextTimer);
    _pendingStartNextTimer = null;
  }
  addLog('🛑 หยุดการทำงานโดยผู้ใช้', 'warning');
  
  // บันทึกรายการปัจจุบันเป็น "หยุด"
  const currentItem = productQueue.find(item => item.status === 'processing');
  if (currentItem) {
    currentItem.status = 'pending'; // กลับเป็น pending เพื่อรันใหม่ได้
    recordFlowItemResult(currentItem.id, 'failed', 'หยุดโดยผู้ใช้', currentItem.name);
    saveQueueNow();
    renderProductQueue();
  }
  
  // แจ้ง Google Flow ให้หยุด
  chrome.storage.local.set({ 
    flowStatus: 'stopped',
    flowMessage: 'หยุดโดยผู้ใช้'
  });
  
  // อัพเดท Progress Card
  flowStats.isRunning = false;
  flowStats.currentStep = '🛑 หยุดโดยผู้ใช้';
  updateFlowProgressCard();
  
  updateControlButtons();
  updateScraperStatus({ status: 'stopped', message: 'หยุดโดยผู้ใช้' });
}

async function nextProduct() {
  if (!isScraperRunning) return;
  
  // ★ หา item ที่กำลัง processing (ไม่ใช่ [0] เสมอ) ★
  const currentItem = getCurrentProcessingItem();
  if (!currentItem) {
    addLog('ไม่มีสินค้าที่กำลังทำอยู่', 'info');
    return;
  }
  
  addLog(`⏭️ ข้ามรายการ: ${currentItem.name}`, 'warning');
  
  recordFlowItemResult(currentItem.id, 'skipped', 'ข้ามโดยผู้ใช้', currentItem.name);
  
  // ★ มาร์ก skipped — ไม่ลบออกจาก queue ★
  currentItem.status = 'skipped';
  currentItem.flowState = null;
  saveQueueNow();
  renderProductQueue();
  
  await chrome.storage.local.set({ 
    flowStatus: 'skipped',
    flowMessage: 'ข้ามรายการนี้'
  });
  
  // ★ หารายการถัดไป (pending) ★
  const nextPending = getNextPendingItem();
  if (nextPending && isScraperRunning) {
    const remaining = getRemainingCount();
    addLog(`📦 เหลือสินค้าอีก ${remaining} รายการ`, 'info');
    updateFlowStep(nextPending.id, '⏳ รอ 3 วินาที...', nextPending.name);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (isScraperRunning) {
      startNextItemFlow();
    }
  } else {
    const stats = getQueueStats();
    addLog(`🎉 ทำครบทุกสินค้าแล้ว! (สำเร็จ ${stats.posted}, ล้มเหลว ${stats.failed}, ข้าม ${stats.skipped})`, 'success');
    isScraperRunning = false;
    completeFlowProgress();
    updateControlButtons();
  }
}

function updateControlButtons() {
  const fetchBtn = document.getElementById('fetch-btn');
  const fetchAllBtn = document.getElementById('fetch-all-btn');
  const runBtn = document.getElementById('run-btn');
  const stopBtn = document.getElementById('stop-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (fetchBtn) fetchBtn.disabled = isScraperRunning;
  if (fetchAllBtn) fetchAllBtn.disabled = isScraperRunning;
  if (runBtn) {
    runBtn.disabled = isScraperRunning || productQueue.length === 0;
    runBtn.textContent = isScraperRunning ? '🔄 กำลังรัน...' : 'Run';
  }
  if (stopBtn) stopBtn.disabled = !isScraperRunning;
  if (nextBtn) nextBtn.disabled = !isScraperRunning;
}

// บันทึกสินค้า
function saveProducts() {
  chrome.storage.local.set({ savedProducts: products });
}

// โหลดสินค้าที่บันทึกไว้
async function loadSavedProducts() {
  const result = await chrome.storage.local.get(['savedProducts']);
  if (result.savedProducts && result.savedProducts.length > 0) {
    products = result.savedProducts;
    renderProductQueue();
    updateProductCount();
  }
}

// แสดง error
function showError(message) {
  addLog(message, 'error');
  alert(message);
}

// ==================== Activity Log Functions ====================

function initActivityLog() {
  const clearBtn = document.getElementById('clear-log');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearActivityLog);
  }
  loadActivityLogs();
}

function addLog(message, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  
  const log = { time, message, type };
  activityLogs.unshift(log);
  
  // Keep only last 50 logs
  if (activityLogs.length > 50) {
    activityLogs = activityLogs.slice(0, 50);
  }
  
  renderActivityLog();
  saveActivityLogs();
  
  // ★ Push to Storymode Analytics Log UI ★
  pushToSmLog(time, message, type);
}

// ★ MERGE_CARDS: อัปเดต log ล่าสุดของ item เดิมแทนสร้างบรรทัดใหม่ (ลดรก) ★
function addFlowLog(itemKey, message, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  
  // หา log ล่าสุดที่ตรงกับ itemKey (ค้นจากบนลงล่าง = ใหม่สุดก่อน)
  const existingIdx = activityLogs.findIndex(l => l._flowKey === itemKey);
  if (existingIdx !== -1 && existingIdx < 3) {
    // อัปเดต log เดิม (ถ้าอยู่ใน 3 รายการล่าสุด)
    activityLogs[existingIdx].time = time;
    activityLogs[existingIdx].message = message;
    activityLogs[existingIdx].type = type;
  } else {
    // สร้างใหม่
    activityLogs.unshift({ time, message, type, _flowKey: itemKey });
    if (activityLogs.length > 50) {
      activityLogs = activityLogs.slice(0, 50);
    }
  }
  
  renderActivityLog();
  saveActivityLogs();
  
  // ★ Push to Storymode Analytics Log UI ★
  pushToSmLog(time, message, type);
}

function renderActivityLog() {
  const logEl = document.getElementById('activity-log');
  if (!logEl) return;
  
  if (activityLogs.length === 0) {
    logEl.innerHTML = '<div class="log-empty">ยังไม่มีกิจกรรม</div>';
    return;
  }
  
  logEl.innerHTML = activityLogs.map(log => `
    <div class="log-item ${log.type}">
      <span class="log-time">${log.time}</span>
      <span class="log-message">${log.message}</span>
    </div>
  `).join('');
}

function clearActivityLog() {
  activityLogs = [];
  renderActivityLog();
  saveActivityLogs();
}

function saveActivityLogs() {
  chrome.storage.local.set({ activityLogs });
}

async function loadActivityLogs() {
  const result = await chrome.storage.local.get(['activityLogs']);
  if (result.activityLogs) {
    activityLogs = result.activityLogs;
    renderActivityLog();
  }
}

function initStyleGrid() {
  const grid = document.getElementById('style-grid');
  if (!grid) return;
  
  STYLE_OPTIONS.forEach(style => {
    const item = document.createElement('div');
    item.className = 'style-item style-item-narrative';
    item.dataset.id = style.id;
    const ic = style.icon || '';
    item.innerHTML = `<span class="style-item-icon" aria-hidden="true">${ic}</span><span class="style-item-meta">${style.name}</span>`;
    item.title = style.description;
    
    item.addEventListener('click', () => {
      item.classList.toggle('selected');
      if (item.classList.contains('selected')) {
        selectedStyles.push(style.id);
      } else {
        selectedStyles = selectedStyles.filter(id => id !== style.id);
      }
      updateSelectedStylesPreview();
    });
    
    grid.appendChild(item);
  });
}

function updateSelectedStylesPreview() {
  const tagsEl = document.getElementById('selected-tags');
  if (!tagsEl) return;
  
  if (selectedStyles.length === 0) {
    tagsEl.textContent = 'ยังไม่ได้เลือก';
    tagsEl.style.color = 'var(--text-disabled)';
  } else {
    const styleNames = selectedStyles.map(id => {
      const style = STYLE_OPTIONS.find(s => s.id === id);
      if (!style) return id;
      return (style.icon ? style.icon + ' ' : '') + style.name;
    });
    tagsEl.textContent = styleNames.join(' + ');
    tagsEl.style.color = 'var(--primary-400)';
  }
}

// Story Mode state
let smSceneCount = 5;
let smPromptMode = 'storytelling';
let smPlatformMode = 'flow';
let smNarrativeStyles = [];
let smMoodKeyword = 'Cinematic Standard';
let smVisualStyle = 'Cartoon Nova 3D';
let smHookCategory = 'auto';
let smStoryType = 'custom';
let smScriptMode = 'ai'; // 'ai' | 'manual'
let smOutputType = 'both'; // 'both' | 'image' | 'video'
let smDisclaimer = '';
let smManualScenes = []; // [{text, showProduct, showProductDialogue}]
let smSceneProductControl = []; // per-scene product control from cards

const SM_CUSTOM_PROMPT_STORAGE_KEYS = [
  'smCustomPromptFull',
  'smCustomPromptText',
  'smCustomEnhancedSystem',
  'smCustomAppendPipelineHint'
];

/** ท้ายข้อความ user — ช่วย parseScenesToCards เมื่อผู้ใช้ใส่ prompt เอง */
function getStorymodePipelineHintFooter() {
  return `
สำคัญ: Output ต้องใช้ format นี้เท่านั้น เพื่อให้ระบบ parse ได้:
- ใช้ === SCENE N: NAME === เป็น header แต่ละฉาก
- ใช้ 🔴 IMAGE PROMPT ตามด้วย code block (\`\`\`)
- ใช้ 🟢 VIDEO PROMPT ตามด้วย code block (\`\`\`)
- จบด้วย 📝 VIRAL CAPTION + hashtags`;
}

/** System สั้นๆ เมื่อผู้ใช้ปิด getEnhancedPrompt ในโหมด prompt เต็มชุด */
function getMinimalStorymodeSystemPrompt() {
  return `คุณคือ Creative Director สร้างสคริปต์ TikTok/Google Veo

OUTPUT FORMAT:
=== SCENE [N]: [NAME] ===
🔴 IMAGE PROMPT
\`\`\`
[english image prompt]
\`\`\`
🟢 VIDEO PROMPT
\`\`\`
[english video prompt with Thai dialogue]
\`\`\`

จบด้วย:
📝 VIRAL CAPTION
"[แคปชั่นไทย]"
#hashtags

RULES: image prompt ภาษาอังกฤษ, บทพูดภาษาไทย, prompt อยู่ใน code block เสมอ, ห้ามใส่ subtitle/text overlay ในวิดีโอ`;
}

function getStorymodeSystemPromptForGenerate() {
  const visualStyleEngMap = {
    'cinematic': 'Photorealistic cinematic style, natural lighting, high detail, realistic proportions, movie-quality visuals, 8K resolution',
    'disney': 'Pixar 3D Animation style, vibrant colors, expressive characters, smooth rendering, Disney-quality lighting',
    'ghibli': 'Studio Ghibli anime style, hand-drawn aesthetic, soft watercolor backgrounds, gentle lighting, Japanese animation',
    'claymation': 'Claymation stop-motion style, handmade clay texture, warm lighting, miniature set design',
    'crochet': 'Crochet knitted style, soft yarn texture, handmade aesthetic, cozy warm colors',
    'plushie': 'Plush toy style, soft fluffy fabric texture, cute kawaii aesthetic, studio photography',
    'papercut': 'Paper cut-out style, layered paper craft, handmade collage aesthetic, flat illustration',
    'dragonball': 'Dragon Ball anime style, dynamic action poses, bold linework, vibrant manga aesthetic',
    '90sanime': '90s anime style, cel-shaded, retro color palette, nostalgic Japanese animation',
    'gta': 'GTA loading screen style, bold illustration, saturated colors, urban aesthetic',
    'watercolor': 'Watercolor painting style, soft color blending, fluid brush strokes, artistic texture',
    'chalk': 'Chalk drawing style, blackboard texture, hand-drawn chalk aesthetic, vintage schoolboard',
    'oilpaint': 'Oil painting style, rich brush strokes, classical art aesthetic, Renaissance lighting',
    'popart': 'Pop Art style, bold primary colors, halftone dots, comic book aesthetic',
    'pixel': 'Pixel art style, 8-bit retro game aesthetic, blocky characters, limited color palette',
    'cyberpunk': 'Cyberpunk neon style, glowing lights, futuristic cityscape, dark with neon accents',
    'vector': 'Flat vector illustration, clean geometric shapes, minimal design, modern graphic style',
    'lego': 'LEGO brick style, plastic brick texture, blocky characters, toy photography aesthetic',
    'vaporwave': 'Vaporwave aesthetic, pastel purple-pink gradients, retro 80s-90s, glitch effects',
    'emoji': 'Emoji style, cute rounded icons, simple expressive faces, flat colorful design'
  };

  const VISUAL_NAME_ALIASES = {
    '3D Pixar Animation': 'Cartoon Nova 3D',
    'แอนิเมชัน 3D (สไตล์ Pixar การ์ตูน 3 มิติ)': 'Cartoon Nova 3D',
    'ซีนีมาติกสมจริง (ภาพยนตร์คมชัด)': 'Movieframe Real'
  };
  const resolvedVisualName = VISUAL_NAME_ALIASES[smVisualStyle] || smVisualStyle;
  const visRow =
    VISUAL_STYLES.find(v => v.name === resolvedVisualName) ||
    VISUAL_STYLES.find(v => v.name === smVisualStyle) ||
    VISUAL_STYLES.find(v => v.id === 'disney_pixar_3d');
  const visualId = visRow?.id || 'disney_pixar_3d';
  const visualDesc =
    visRow?.prompt ||
    visualStyleEngMap[visualId] ||
    visualStyleEngMap.disney ||
    '3D animated CGI feature film look, expressive characters, soft cinematic lighting.';

  const PHOTOREAL_VISUAL_IDS = new Set([
    'real_cinematic', 'hyper_realistic', 'polaroid_snapshot', 'thai_realistic_ghost', 'thai_ancient_ghost',
    'hospital_ghost_realism', 'forest_ghost_realism', 'cctv_analog_horror', 'cinematic_food_closeup',
    'minimal_product_studio', 'thai_commercial_tv', 'double_exposure'
  ]);

  const isProductAd =
    (visualId === 'real_cinematic' || visualId === 'cinematic') &&
    (smStoryType === 'product_review' || smStoryType === 'comparison' || smStoryType === 'tutorial');
  const isAnimated = visualId !== 'none' && !PHOTOREAL_VISUAL_IDS.has(visualId);
  const isFairytale = smStoryType === 'fairytale' || smStoryType === 'character_story';
  const isASMR = smStoryType === 'asmr';

  let imageTemplate, videoTemplate;

  if (isProductAd) {
    imageTemplate = `สร้างภาพโฆษณาสินค้ามืออาชีพ สินค้า[PRODUCT_NAME] [PRODUCT_DESCRIPTION] ตามภาพที่แนบไป สไตล์[CREATIVE_SCENARIO] [SCENE_DESCRIPTION] REAL HUMAN PHOTO มีสาววัยรุ่นคนไทย อายุ 20-25 ปีใช้งานสินค้า ใส่ข้อความภาษาไทยบนภาพว่า"[THAI_BOLD_TEXT]" [SCENE_SETTING] [CAMERA_DISTANCE] single image, no collage, no multiple panels, no split screen Use the exact product appearance from the attached reference image (pd-product.png). The bold text overlay MUST be in Thai language (ภาษาไทย).`;
    videoTemplate = `สาวไทยพูดขายสินค้า ([SCENE_NUM]) [PRODUCT_NAME] [PRODUCT_DESCRIPTION] [ACTION_IN_SCENE] ถือสินค้าโชว์ บทพูดไทย "[THAI_DIALOGUE]" มุมกล้องตั้งนิ่งจนจบคลิป ใช้ฉากและการจัดวางตามภาพที่แนบ NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, All dialogue is AUDIO ONLY reduce contrast, natural skintone, soft highlights, no oversharpen, low contrast, soft colors, natural tone, film look, soft light`;
  } else if (isASMR) {
    imageTemplate = `${visualDesc}. FIXED overhead/top-down camera angle (45-60°). [SCENE_DESCRIPTION]. [DETAILED_OBJECTS_AND_PROPS]. The full scene is visible from above, brightly illuminated by natural light.\n\n[Character Reference: [CHARACTER_REFS]]`;
    videoTemplate = `[ACTION_DESCRIPTION], overhead static camera (45-60°), ASMR sounds of [AMBIENT_SOUNDS], realistic movement, natural motion. NO speech, NO text, stable form, no morphing, no extra limbs`;
  } else if (isFairytale) {
    imageTemplate = `${visualDesc}. [CHARACTER_NAME] - [CHARACTER_DESCRIPTION]. Background: [BACKGROUND_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [ALL_CHARACTER_REFS]]`;
    videoTemplate = `ACTION ONLY: [CHARACTER_ACTION], with young Thai female voice voiceover narration, MUST use young Thai female voice only, do NOT switch to different voice gender, NO lip sync, character does NOT speak, background narration only. Thai voiceover narrated by young Thai female voice says: "[THAI_NARRATION]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`;
  } else if (isAnimated) {
    imageTemplate = `${visualDesc}. [CHARACTER_NAME] - [CHARACTER_DESCRIPTION], [CHARACTER_POSE_AND_EXPRESSION]. Background: [BACKGROUND_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [ALL_CHARACTER_REFS]]`;
    videoTemplate = `ACTION ONLY: [CHARACTER_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent young Thai female voice throughout entire clip, do NOT switch voice gender. Only animate the existing characters from the image, do not add new characters or change their appearance. Character says in Thai with young Thai female voice: "[THAI_DIALOGUE]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`;
  } else {
    imageTemplate = `${visualDesc}. [SCENE_DESCRIPTION]. [CAMERA_SHOT]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [CHARACTER_REFS]]`;
    videoTemplate = `ACTION ONLY: [CHARACTER_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent young Thai female voice throughout entire clip, do NOT switch voice gender. Character says in Thai with young Thai female voice: "[THAI_DIALOGUE]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`;
  }

  const outputTypeNote = smOutputType === 'image' ? 'สร้างเฉพาะ 🔴 IMAGE PROMPT เท่านั้น (ไม่ต้องมี VIDEO PROMPT)' :
                          smOutputType === 'video' ? 'สร้างเฉพาะ 🟢 VIDEO PROMPT เท่านั้น (ไม่ต้องมี IMAGE PROMPT)' :
                          'สร้างทั้ง 🔴 IMAGE PROMPT และ 🟢 VIDEO PROMPT ในทุกฉาก';

  const moodDirectiveEn = getMoodDirective(smMoodKeyword);
  const narrativeBlock = formatNarrativePromptsForMessage(smNarrativeStyles);

  return `คุณคือ Creative Director มืออาชีพสำหรับ TikTok / Google Veo สร้างสคริปต์วิดีโอสั้นที่มี prompt สำหรับสร้างภาพและวิดีโอ AI

═══ VISUAL STYLE ═══
สไตล์ที่ผู้ใช้เลือก: ${smVisualStyle}
English style directive: ${visualDesc}
ทุก prompt ต้องใช้สไตล์นี้เท่านั้น ห้ามเปลี่ยนสไตล์ระหว่างฉาก

═══ MOOD / TONE ═══
${smMoodKeyword}
${moodDirectiveEn ? `English atmosphere: ${moodDirectiveEn}` : ''}

${narrativeBlock ? `═══ NARRATIVE PERSONA (EN — follow strictly) ═══\n${narrativeBlock}\n` : ''}
═══ OUTPUT FORMAT (สำคัญมาก — ต้องตามนี้เป๊ะ) ═══

${outputTypeNote}

สำหรับแต่ละฉาก ใช้ format นี้:

=== SCENE [N]: [SCENE_NAME] ===

🔴 IMAGE PROMPT
\`\`\`
[image prompt ภาษาอังกฤษ ตามเทมเพลตด้านล่าง]
\`\`\`

🟢 VIDEO PROMPT
\`\`\`
[video prompt ภาษาอังกฤษ ตามเทมเพลตด้านล่าง — บทพูด/narration เป็นภาษาไทย]
\`\`\`

ท้ายสุดหลังฉากสุดท้าย:

📝 VIRAL CAPTION
"[แคปชั่นภาษาไทยสำหรับโพสต์ TikTok — ดึงดูด กระตุ้นให้ดู]"
#แฮชแท็ก1 #แฮชแท็ก2 #แฮชแท็ก3 #แฮชแท็ก4

═══ IMAGE PROMPT TEMPLATE ═══
${imageTemplate}

═══ VIDEO PROMPT TEMPLATE ═══
${videoTemplate}

═══ CRITICAL RULES ═══
1. Image prompt ต้องเป็นภาษาอังกฤษ (ยกเว้นข้อความ Thai bold text บนภาพ ถ้ามี)
2. Video prompt ต้องเป็นภาษาอังกฤษ ยกเว้นบทพูด/narration ที่ต้องเป็นภาษาไทย
3. บทพูดภาษาไทยต้องเป็นธรรมชาติ สนุก น่าสนใจ เหมือนคนไทยพูดจริง
4. ทุกฉากต้องใช้สไตล์ภาพเดียวกัน: ${visualDesc}
5. ห้ามใส่ subtitle, text overlay, captions ในวิดีโอ — dialogue เป็น AUDIO ONLY
6. Image ต้องเป็น single image, no collage, no multiple panels
7. ตัวละครต้อง consistent ทุกฉาก — หน้าตา เสื้อผ้า สไตล์เดียวกัน
8. ถ้ามี Character Reference ให้ใส่ท้าย image prompt ทุกฉาก
9. ถ้ามีสินค้า ต้องเห็นสินค้าชัดเจนในทุกฉาก
10. Scene header ต้องใช้ === SCENE N: NAME === เท่านั้น (สำคัญสำหรับ parser)
11. Prompt ต้องอยู่ใน code block (\`\`\`) เสมอ
12. จำนวนฉาก: ${smSceneCount} ฉาก
13. เสียงพูดต้องเป็น young Thai female voice เสมอ (ยกเว้น ASMR ที่ไม่มีเสียงพูด)`;
}

// ★ v3.23: Modular Directive Composition — ประกอบ system prompt จาก directives ย่อย ★
function buildModularSystemPrompt() {
  const chkSys = document.getElementById('chk-sm-custom-enhanced-system');
  if (chkSys && !chkSys.checked) {
    return getMinimalStorymodeSystemPrompt();
  }
  return getStorymodeSystemPromptForGenerate();
}


// ★ Queue System state ★
let smStoryQueue = []; // [{id, config, status, result}]
let smQueueRunning = false;
let smCurrentQueueIndex = -1;
let smQueueIdCounter = 0;

// ★ Auto Post state ★
let smAutoPostEnabled = false;
let smAutoPostProductId = '';

const STORY_TYPE_TEMPLATES = [
  { id: 'custom', name: 'กำหนดเอง (Custom)', icon: '✏️', description: 'ใส่หัวข้อเอง AI สร้างเรื่องให้อิสระ' },
  { id: 'product_review', name: 'รีวิวสินค้า UGC', icon: '📦', description: 'สาวไทยรีวิวสินค้าในสถานการณ์สุดครีเอท เน้นขายของ' },
  { id: 'brand_story', name: 'เล่าเรื่องแบรนด์', icon: '🏷️', description: 'สร้างเรื่องราวรอบแบรนด์/สินค้าอย่างมีอารมณ์' },
  { id: 'tutorial', name: 'สอนวิธีใช้ How-to', icon: '📖', description: 'สาธิตการใช้งานสินค้าทีละขั้นตอน' },
  { id: 'drama', name: 'มินิซีรีส์ ดราม่า', icon: '🎭', description: 'เรื่องสั้นมีพล็อต ตัวละคร ปมขัดแย้ง จบด้วยสินค้า' },
  { id: 'fairytale', name: 'นิทาน / เรื่องเล่า', icon: '📚', description: 'ตัวละครแฟนตาซีผจญภัย เล่าเรื่องด้วย voiceover' },
  { id: 'asmr', name: 'ASMR / Cinematic', icon: '🎧', description: 'เน้นภาพสวย เสียงบรรยากาศ ไม่มีบทพูด' },
  { id: 'comedy', name: 'ตลก / Skit', icon: '😂', description: 'สถานการณ์ตลกหักมุม จบด้วยสินค้าเป็น punchline' },
  { id: 'comparison', name: 'เปรียบเทียบ ก่อน-หลัง', icon: '⚡', description: 'แสดงปัญหา → ใช้สินค้า → ผลลัพธ์ที่ดีขึ้น' },
  { id: 'character_story', name: 'ตัวละคร Pixar / 3D', icon: '🏰', description: 'ตัวละคร 3D Animation เล่าเรื่องสนุก พูดไทย' }
];

// ★ Storymode Analytics Log — push log entry to UI ★
let smLogCount = 0;
function pushToSmLog(time, message, type) {
  const container = document.getElementById('sm-log-container');
  if (!container) return;
  // Only show Storymode-related logs
  if (!message.includes('[Storymode]') && !message.includes('[Pipeline]') && !message.includes('Storymode') && !message.includes('ฉาก')) return;
  
  // Remove empty state
  const empty = container.querySelector('.sm-log-empty');
  if (empty) empty.remove();
  
  const entry = document.createElement('div');
  entry.className = `sm-log-entry ${type}`;
  entry.innerHTML = `<span class="sm-log-time">${time}</span>${message}`;
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
  
  smLogCount++;
  const countEl = document.getElementById('sm-log-count');
  if (countEl) countEl.textContent = `(${smLogCount} รายการ)`;
}

function initSmAnalyticsLog() {
  // Toggle collapse
  const toggle = document.getElementById('sm-analytics-toggle');
  const body = document.getElementById('sm-analytics-body');
  const arrow = document.getElementById('sm-analytics-arrow');
  if (toggle && body) {
    toggle.addEventListener('click', () => {
      const isHidden = body.style.display === 'none';
      body.style.display = isHidden ? '' : 'none';
      if (arrow) arrow.textContent = isHidden ? '▼' : '▶';
    });
  }
  // Clear button
  const clearBtn = document.getElementById('sm-log-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const container = document.getElementById('sm-log-container');
      if (container) {
        container.innerHTML = '<div class="sm-log-empty">ยังไม่มี log — เริ่ม Generate หรือ Auto Run เพื่อดูสถานะ</div>';
        smLogCount = 0;
        const countEl = document.getElementById('sm-log-count');
        if (countEl) countEl.textContent = '(0 รายการ)';
      }
    });
  }
}

function initStoryModeControls() {
  initSMImageButtons();
  initSMPromptModes();
  initSMPlatformModes();
  initSMSceneCountDropdown();
  initSMNarrativeDropdown();
  initSMMoodDropdown();
  initSMVisualDropdown();
  initSMHookDropdown();
  initSMDropdownClose();
  initSmAnalyticsLog();
  initSMStoryTypeDropdown();
  initSMScriptMode();
  initSMOutputType();
  initSMDisclaimer();
  initSMAutoPost();
  initSMCustomPromptMode();
}

// ★ Story Type Template Dropdown ★
function initSMStoryTypeDropdown() {
  const dropdown = document.getElementById('dropdown-story-type');
  const btn = document.getElementById('btn-story-type');
  const menu = document.getElementById('menu-story-type');
  const descEl = document.getElementById('story-type-desc');
  
  if (!dropdown || !btn || !menu) return;
  
  menu.innerHTML = '';
  STORY_TYPE_TEMPLATES.forEach(tmpl => {
    const item = document.createElement('div');
    item.className = 'sm-dropdown-item' + (tmpl.id === 'custom' ? ' selected' : '');
    item.dataset.value = tmpl.id;
    item.innerHTML = `<span class="sm-dropdown-item-icon">${tmpl.icon}</span><span class="sm-dropdown-item-text">${tmpl.name}</span>`;
    item.addEventListener('click', () => {
      menu.querySelectorAll('.sm-dropdown-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      smStoryType = tmpl.id;
      btn.querySelector('.sm-dropdown-value').textContent = tmpl.name;
      btn.querySelector('.sm-dropdown-icon').textContent = tmpl.icon;
      dropdown.classList.remove('open');
      
      if (descEl) {
        if (tmpl.id === 'custom') {
          descEl.classList.remove('visible');
        } else {
          descEl.textContent = tmpl.desc;
          descEl.classList.add('visible');
        }
      }
    });
    menu.appendChild(item);
  });
  
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    dropdown.classList.toggle('open');
  });
}

// ★ AI / Manual Script Mode Toggle ★
function initSMScriptMode() {
  const btns = document.querySelectorAll('.sm-script-mode-btn');
  const manualContainer = document.getElementById('manual-scripts-container');
  const refreshBtn = document.getElementById('refresh-manual-scenes');
  
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      smScriptMode = btn.dataset.mode;
      
      if (manualContainer) {
        manualContainer.style.display = smScriptMode === 'manual' ? 'block' : 'none';
        if (smScriptMode === 'manual') {
          renderManualSceneInputs();
        }
      }
    });
  });
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', renderManualSceneInputs);
  }
}

// ★ Render Manual Scene Inputs — สร้างช่องพิมพ์บทตามจำนวนฉาก ★
function renderManualSceneInputs() {
  const container = document.getElementById('manual-scenes-list');
  if (!container) return;
  
  container.innerHTML = '';
  smManualScenes = [];
  
  const template = STORY_TYPE_TEMPLATES.find(t => t.id === smStoryType);
  
  for (let i = 0; i < smSceneCount; i++) {
    const isLast2 = i >= (smSceneCount - 2);
    const sceneData = { text: '', showProduct: true, showProductDialogue: isLast2 };
    smManualScenes.push(sceneData);
    
    let sceneName = `ฉาก ${i + 1}`;
    if (template && template.structure) {
      const lines = template.structure.split('\n').filter(l => l.trim());
      if (lines[i + 1]) {
        const match = lines[i + 1].match(/ฉาก\s*\d+:\s*(.+)/);
        if (match) sceneName = `ฉาก ${i + 1}: ${match[1].split('—')[0].trim()}`;
      }
    }
    
    const item = document.createElement('div');
    item.className = 'sm-manual-scene-item';
    item.innerHTML = `
      <div class="sm-manual-scene-header">
        <span class="sm-manual-scene-num">${sceneName}</span>
        <div class="sm-manual-scene-product-toggle">
          <label><input type="checkbox" class="manual-scene-product" data-scene="${i}" checked> 📦 สินค้า</label>
        </div>
      </div>
      <textarea class="sm-manual-scene-textarea" data-scene="${i}" placeholder="พิมพ์บทพูดฉากที่ ${i + 1}..."></textarea>
    `;
    container.appendChild(item);
    
    const textarea = item.querySelector('textarea');
    textarea.addEventListener('input', (e) => {
      smManualScenes[i].text = e.target.value;
    });
    
    item.querySelector('.manual-scene-product').addEventListener('change', (e) => {
      smManualScenes[i].showProduct = e.target.checked;
    });
    // 💬 toggle removed — showProductDialogue auto-set to last 2 scenes only
  }
}

// ★ Output Type Toggle (image-only / clip-only / both) ★
function initSMOutputType() {
  const btns = document.querySelectorAll('.sm-output-type-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      smOutputType = btn.dataset.output;
    });
  });
}

// ★ Auto Post Toggle ★
function initSMAutoPost() {
  const toggle = document.getElementById('sm-autopost-toggle');
  const settings = document.getElementById('sm-autopost-settings');
  const productIdInput = document.getElementById('sm-autopost-product-id');
  
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      smAutoPostEnabled = e.target.checked;
      if (settings) settings.style.display = smAutoPostEnabled ? 'block' : 'none';
      addLog(`🚀 [AutoPost] ${smAutoPostEnabled ? 'เปิด' : 'ปิด'} Auto Post TikTok`, 'info');
    });
  }
  if (productIdInput) {
    productIdInput.addEventListener('input', (e) => {
      smAutoPostProductId = e.target.value.trim();
    });
  }
  
  // ★ Queue Buttons (ห้ามใช้ inline onclick — CSP บล็อก) ★
  const addBtn = document.getElementById('sm-queue-add-btn');
  const startBtn = document.getElementById('queue-start-btn');
  const stopBtn = document.getElementById('queue-stop-btn');
  const clearBtn = document.getElementById('queue-clear-btn');
  if (addBtn) addBtn.addEventListener('click', () => smAddToQueue());
  if (startBtn) startBtn.addEventListener('click', () => smStartQueue());
  if (stopBtn) stopBtn.addEventListener('click', () => smStopQueue());
  if (clearBtn) clearBtn.addEventListener('click', () => smClearQueue());
}

// ★ Disclaimer Input ★
function initSMDisclaimer() {
  const input = document.getElementById('sm-disclaimer');
  if (input) {
    input.addEventListener('input', (e) => {
      smDisclaimer = e.target.value.trim();
    });
  }
}

function persistSmCustomPromptFields() {
  const chkFull = document.getElementById('chk-sm-custom-prompt-full');
  const ta = document.getElementById('sm-custom-prompt-textarea');
  const chkSys = document.getElementById('chk-sm-custom-enhanced-system');
  const chkHint = document.getElementById('chk-sm-custom-append-pipeline-hint');
  chrome.storage.local.set({
    smCustomPromptFull: !!chkFull?.checked,
    smCustomPromptText: ta?.value || '',
    smCustomEnhancedSystem: chkSys?.checked !== false,
    smCustomAppendPipelineHint: chkHint?.checked !== false
  });
}

let _smCustomPromptSaveTimer = null;

// ★ โหมด Prompt เต็มชุด — เก็บใน chrome.storage ★
function initSMCustomPromptMode() {
  const chkFull = document.getElementById('chk-sm-custom-prompt-full');
  const wrap = document.getElementById('sm-custom-prompt-wrap');
  const ta = document.getElementById('sm-custom-prompt-textarea');
  const chkSys = document.getElementById('chk-sm-custom-enhanced-system');
  const chkHint = document.getElementById('chk-sm-custom-append-pipeline-hint');
  if (!chkFull || !wrap || !ta) return;

  chrome.storage.local.get(SM_CUSTOM_PROMPT_STORAGE_KEYS, (r) => {
    if (chrome.runtime.lastError) return;
    if (r.smCustomPromptFull) {
      chkFull.checked = true;
      wrap.style.display = 'block';
    }
    if (typeof r.smCustomPromptText === 'string' && r.smCustomPromptText) {
      ta.value = r.smCustomPromptText;
    }
    if (r.smCustomEnhancedSystem === false && chkSys) chkSys.checked = false;
    if (r.smCustomAppendPipelineHint === false && chkHint) chkHint.checked = false;
  });

  chkFull.addEventListener('change', () => {
    wrap.style.display = chkFull.checked ? 'block' : 'none';
    persistSmCustomPromptFields();
  });
  const scheduleSave = () => {
    if (_smCustomPromptSaveTimer) clearTimeout(_smCustomPromptSaveTimer);
    _smCustomPromptSaveTimer = setTimeout(persistSmCustomPromptFields, 400);
  };
  ta.addEventListener('input', scheduleSave);
  if (chkSys) chkSys.addEventListener('change', persistSmCustomPromptFields);
  if (chkHint) chkHint.addEventListener('change', persistSmCustomPromptFields);
}

// Store uploaded images as base64
let smProductImage = null;
let smCharacterImage = null;
let smCharacterLockDescription = null; // ★ v2.83: ล็อคตัวละครจาก Scene 1 — ใช้เหมือนกันทุกฉาก ★
let smCharacterAnalysisResult = null; // ★ v3.17: ผลวิเคราะห์ style ตัวละครจาก reference image ★

function initSMImageButtons() {
  const productInput = document.getElementById('input-product-image');
  const characterInput = document.getElementById('input-character-image');
  
  if (productInput) {
    productInput.addEventListener('change', (e) => handleImageUpload(e, 'product'));
  }
  
  if (characterInput) {
    characterInput.addEventListener('change', (e) => handleImageUpload(e, 'character'));
  }
  
  // Remove buttons
  document.querySelectorAll('.sm-preview-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const type = btn.dataset.type;
      removeImage(type);
    });
  });
}

function handleImageUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    
    if (type === 'product') {
      smProductImage = base64;
      document.getElementById('preview-product-img').src = base64;
      document.getElementById('preview-product').style.display = 'block';
      document.getElementById('btn-product-image').classList.add('has-image');
    } else {
      smCharacterImage = base64;
      document.getElementById('preview-character-img').src = base64;
      document.getElementById('preview-character').style.display = 'block';
      document.getElementById('btn-character-image').classList.add('has-image');
    }
  };
  reader.readAsDataURL(file);
}

function removeImage(type) {
  if (type === 'product') {
    smProductImage = null;
    document.getElementById('preview-product').style.display = 'none';
    document.getElementById('btn-product-image').classList.remove('has-image');
    document.getElementById('input-product-image').value = '';
  } else {
    smCharacterImage = null;
    document.getElementById('preview-character').style.display = 'none';
    document.getElementById('btn-character-image').classList.remove('has-image');
    document.getElementById('input-character-image').value = '';
  }
}

function initSMPromptModes() {
  const btns = document.querySelectorAll('.sm-prompt-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      smPromptMode = btn.dataset.mode;
    });
  });
}

function initSMPlatformModes() {
  const btns = document.querySelectorAll('.sm-platform-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      smPlatformMode = btn.dataset.mode;
      selectedMode = btn.dataset.mode;
      saveSelectedMode();
    });
  });
}

function initSMSceneCountDropdown() {
  const dropdown = document.getElementById('dropdown-scene-count');
  const btn = document.getElementById('btn-scene-count');
  const menu = document.getElementById('menu-scene-count');
  
  if (!dropdown || !btn || !menu) return;
  
  // Generate options 1-40
  menu.innerHTML = '';
  for (let i = 1; i <= 40; i++) {
    const item = document.createElement('div');
    item.className = 'sm-dropdown-item' + (i === 5 ? ' selected' : '');
    item.dataset.value = i;
    item.innerHTML = `<span class="sm-dropdown-item-text">${i} ฉาก ${i === 5 ? '⭐' : ''}</span>`;
    item.addEventListener('click', () => {
      menu.querySelectorAll('.sm-dropdown-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      smSceneCount = i;
      btn.querySelector('.sm-dropdown-value').textContent = `${i} ฉาก ${i === 5 ? '⭐' : ''}`;
      dropdown.classList.remove('open');
    });
    menu.appendChild(item);
  }
  
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    dropdown.classList.toggle('open');
  });
}

function initSMNarrativeDropdown() {
  const dropdown = document.getElementById('dropdown-narrative');
  const btn = document.getElementById('btn-narrative');
  const menu = document.getElementById('menu-narrative');
  const tagsEl = document.getElementById('selected-narrative-tags');
  
  if (!dropdown || !btn || !menu) return;
  
  // Generate options from STYLE_OPTIONS
  menu.innerHTML = '';
  STYLE_OPTIONS.forEach(style => {
    const item = document.createElement('div');
    item.className = 'sm-dropdown-item sm-dropdown-item-narrative';
    item.dataset.id = style.id;
    const ic = style.icon || '📌';
    item.innerHTML = `
      <span class="sm-dropdown-item-check">✓</span>
      <span class="sm-dropdown-item-icon sm-narrative-icon" aria-hidden="true">${ic}</span>
      <span class="sm-dropdown-item-text sm-narrative-label"><span class="sm-narrative-name">${style.name}</span></span>
    `;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      item.classList.toggle('selected');
      
      if (item.classList.contains('selected')) {
        smNarrativeStyles.push(style.id);
        selectedStyles.push(style.id);
      } else {
        smNarrativeStyles = smNarrativeStyles.filter(id => id !== style.id);
        selectedStyles = selectedStyles.filter(id => id !== style.id);
      }
      
      updateSMNarrativeTags();
    });
    menu.appendChild(item);
  });
  
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    dropdown.classList.toggle('open');
  });
}

function updateSMNarrativeTags() {
  const tagsEl = document.getElementById('selected-narrative-tags');
  if (!tagsEl) return;
  
  if (smNarrativeStyles.length === 0) {
    tagsEl.textContent = 'เลือกแล้ว: —';
  } else {
    const names = smNarrativeStyles.map(id => {
      const style = STYLE_OPTIONS.find(s => s.id === id);
      if (!style) return id;
      return (style.icon ? style.icon + ' ' : '') + style.name;
    });
    tagsEl.textContent = 'เลือกแล้ว: ' + names.join(', ');
  }
}

function initSMMoodDropdown() {
  const dropdown = document.getElementById('dropdown-mood');
  const btn = document.getElementById('btn-mood');
  const menu = document.getElementById('menu-mood');
  
  if (!dropdown || !btn || !menu) return;
  
  // Thai labels — keys must match MOOD_KEYWORDS in promptTemplate.js exactly
  const MOOD_THAI_LABELS = {
    'Cinematic Standard': 'มาตรฐานภาพยนตร์',
    'Emotional Drama': 'ละครอารมณ์',
    'Action Explosive': 'แอ็คชันระเบิด',
    'Dark & Gritty': 'มืดหนักโหด',
    'Mystery Noir': 'ลึกลับนัวร์',
    'Red Alert / Conflict': 'ความขัดแย้งสูงเดือด',
    'Romantic Drama': 'โรแมนติกดราม่า',
    'Horror / Thriller': 'สยองขวัญระทึกขวัญ',
    'Bright & Airy': 'สว่างโปร่งสบาย',
    'Rainy & Lonely': 'ฝนและความเหงา',
    'Lo-Fi Cozy': 'โลไฟอบอุ่น',
    'Vivid & Energetic': 'สดสะดุดตา',
    'Mute & Earth Tone': 'เอิร์ทโทนเงียบๆ',
    'Nature Organic': 'ธรรมชาติออร์แกนิก',
    'Y2K Pop Energy': 'Y2K ป็อปสนุก',
    'Surreal Comedy': 'ตลกเหนือจริง',
    'Mutelu Mystical': 'มูเตลูลึกลับ',
    'Thai Street Night': 'ถนนคืนไทย',
    'Thai Vintage Town': 'เมืองไทยวินเทจ',
    'Vivid Thai Summer': 'ร้อนระอุไทยซัมเมอร์',
    'Thai Festival': 'เทศกาลไทย',
    'Local Homey': 'บ้านๆ อบอุ่น',
    'Cyberpunk Neon': 'ไซเบอร์พังก์นีออน',
    'Product Hero Clean': 'โชว์สินค้าสะอาด',
    'ASMR Unboxing': 'แกะกล่อง ASMR',
    'Beauty & Skincare Glow': 'บิวตี้ผิวกระจ่าง',
    'Food Porn Satisfying': 'อาหารน่ากิน',
    'Rich & Flex': 'โชว์รวยมีระดับ',
    'Before & After Drama': 'ก่อนหลังดราม่า',
    'Haul & Lifestyle': 'ฮอลและไลฟ์สไตล์',
    'UGC Raw / Authentic': 'UGC ดิบจริง',
    'Talking Head / POV': 'พูดตรงกล้อง POV',
    'Fisheye / Ultra Wide': 'ฟิชอายไวด์',
    'POV Bodycam': 'บอดี้แคมมุมแรก',
    'Trending Transition': 'ทรานสิชันไวรัล',
    'Duet / Stitch Ready': 'พร้อม Duet และ Stitch',
    'Glitch & Retro Digital': 'กลิทช์วินเทจดิจิทัล',
    'Viral Hook Opener': 'เปิดตัวดึงคนดู 3 วิ'
  };

  // Generate options from MOOD_KEYWORDS
  menu.innerHTML = '';
  MOOD_KEYWORDS.forEach(mood => {
    const thaiLabel = MOOD_THAI_LABELS[mood] || mood;
    const item = document.createElement('div');
    item.className = 'sm-dropdown-item' + (mood === 'Cinematic Standard' ? ' selected' : '');
    item.dataset.value = mood;
    item.innerHTML = `<span class="sm-dropdown-item-icon">🎬</span><span class="sm-dropdown-item-text">${thaiLabel}</span>`;
    item.addEventListener('click', () => {
      menu.querySelectorAll('.sm-dropdown-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      smMoodKeyword = mood;
      btn.querySelector('.sm-dropdown-value').textContent = thaiLabel;
      dropdown.classList.remove('open');
    });
    menu.appendChild(item);
  });
  
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    dropdown.classList.toggle('open');
  });
}

function initSMVisualDropdown() {
  const dropdown = document.getElementById('dropdown-visual');
  const btn = document.getElementById('btn-visual');
  const menu = document.getElementById('menu-visual');
  
  if (!dropdown || !btn || !menu) return;
  
  // Generate options
  menu.innerHTML = '';
  VISUAL_STYLES.forEach(style => {
    const item = document.createElement('div');
    item.className = 'sm-dropdown-item' + (style.id === 'disney_pixar_3d' ? ' selected' : '');
    item.dataset.value = style.id;
    item.innerHTML = `<span class="sm-dropdown-item-icon">${style.icon}</span><span class="sm-dropdown-item-text">${style.name}</span>`;
    item.addEventListener('click', () => {
      menu.querySelectorAll('.sm-dropdown-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      smVisualStyle = style.name;
      btn.querySelector('.sm-dropdown-value').textContent = style.name;
      dropdown.classList.remove('open');
    });
    menu.appendChild(item);
  });

  const initialVis = VISUAL_STYLES.find(v => v.name === smVisualStyle) || VISUAL_STYLES.find(v => v.id === 'disney_pixar_3d');
  if (initialVis && btn) {
    smVisualStyle = initialVis.name;
    const valEl = btn.querySelector('.sm-dropdown-value');
    if (valEl) valEl.textContent = initialVis.name;
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    dropdown.classList.toggle('open');
  });
}

function initSMHookDropdown() {
  const HOOK_OPTIONS = [
    { id: 'auto', icon: '🤖', name: 'AI เลือกให้อัตโนมัติ' },
    { id: 'FOMO', icon: '🔥', name: 'FOMO & Flash Sale (กลัวพลาด)' },
    { id: 'AUTHENTIC', icon: '👯‍♀️', name: 'Authentic Vibe (เพื่อนป้ายยา)' },
    { id: 'OBSESSION', icon: '👑', name: 'Scarcity & Obsession (อวยยศ)' },
    { id: 'CURIOSITY', icon: '🤯', name: 'Curiosity Gap & Shock (ช็อก)' }
  ];

  function setupHookMenu(dropdown, btn, menu, isStudio) {
    if (!dropdown || !btn || !menu) return;
    menu.innerHTML = '';
    HOOK_OPTIONS.forEach(opt => {
      const item = document.createElement('div');
      item.className = 'sm-dropdown-item' + (opt.id === 'auto' ? ' selected' : '');
      item.dataset.value = opt.id;
      item.innerHTML = `<span class="sm-dropdown-item-icon">${opt.icon}</span><span class="sm-dropdown-item-text">${opt.name}</span>`;
      item.addEventListener('click', () => {
        menu.querySelectorAll('.sm-dropdown-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        smHookCategory = opt.id;
        btn.querySelector('.sm-dropdown-value').textContent = opt.name;
        btn.querySelector('.sm-dropdown-icon').textContent = opt.icon;
        dropdown.classList.remove('open');
      });
      menu.appendChild(item);
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDropdowns();
      dropdown.classList.toggle('open');
    });
  }

  setupHookMenu(
    document.getElementById('dropdown-hook'),
    document.getElementById('btn-hook'),
    document.getElementById('menu-hook'),
    false
  );
  setupHookMenu(
    document.getElementById('studio-dropdown-hook'),
    document.getElementById('studio-btn-hook'),
    document.getElementById('studio-menu-hook'),
    true
  );
}

function closeAllDropdowns() {
  document.querySelectorAll('.sm-dropdown').forEach(d => d.classList.remove('open'));
}

function initSMDropdownClose() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sm-dropdown')) {
      closeAllDropdowns();
    }
  });
}

function initGenerateButton() {
  const btn = document.getElementById('generate-btn');
  const btnTop = document.getElementById('generate-btn-top');
  const copyAllBtn = document.getElementById('copy-all-output');
  const toggleViewBtn = document.getElementById('toggle-view-btn');
  
  if (btn) {
    btn.addEventListener('click', generateScript);
  }
  
  if (btnTop) {
    btnTop.addEventListener('click', generateScript);
  }
  
  if (copyAllBtn) {
    copyAllBtn.addEventListener('click', () => {
      const output = document.getElementById('output-content').textContent;
      navigator.clipboard.writeText(output).then(() => {
        copyAllBtn.innerHTML = '<span>✅</span> คัดลอกแล้ว!';
        setTimeout(() => {
          copyAllBtn.innerHTML = '<span>📋</span> คัดลอกทั้งหมด';
        }, 2000);
      });
    });
  }
  
  if (toggleViewBtn) {
    toggleViewBtn.addEventListener('click', toggleSceneCardsView);
  }
  
  
  // Auto Run Storyboard buttons
  const autoRunBtn = document.getElementById('auto-run-btn');
  const stopAutoRunBtn = document.getElementById('stop-auto-run-btn');
  
  if (autoRunBtn) {
    autoRunBtn.addEventListener('click', startAutoRunStoryboard);
  }
  if (stopAutoRunBtn) {
    stopAutoRunBtn.addEventListener('click', stopAutoRunStoryboard);
  }
}

// =============================================
// Auto Run Storyboard — สร้างฉากต่อเนื่องอัตโนมัติ
// =============================================

let autoRunState = {
  isRunning: false,
  isStopped: false,
  currentScene: 0,
  totalScenes: 0,
  scenePrompts: [],
  startTime: null,
  failedScenes: [] // ★ v2.60: track failed scenes for per-scene retry ★
};

// Parse scene prompts จาก output text
function parseScenePrompts(outputText) {
  const scenes = [];
  // หา pattern: Scene 1:, Scene 2:, ฉากที่ 1:, ฉากที่ 2:, [Scene 1], etc.
  const sceneRegex = /(?:Scene|ฉากที่|ฉาก)\s*(\d+)[:\s\-\]]+([^\n]+(?:\n(?!(?:Scene|ฉากที่|ฉาก)\s*\d)[^\n]*)*)/gi;
  let match;
  while ((match = sceneRegex.exec(outputText)) !== null) {
    const sceneNum = parseInt(match[1]);
    const sceneContent = match[2].trim();
    scenes.push({
      number: sceneNum,
      prompt: sceneContent.substring(0, 500) // จำกัดความยาว
    });
  }
  
  // ถ้าไม่เจอ pattern ให้ลองแบ่งตาม --- หรือ ===
  if (scenes.length === 0) {
    const blocks = outputText.split(/[-=]{3,}/).filter(b => b.trim().length > 50);
    blocks.forEach((block, i) => {
      scenes.push({
        number: i + 1,
        prompt: block.trim().substring(0, 500)
      });
    });
  }
  
  return scenes;
}

// ★★★ QUEUE SYSTEM — สร้างคิวเรื่องต่อเนื่อง ★★★

// Snapshot ค่า config ปัจจุบันจาก UI
function snapshotStoryConfig() {
  return {
    topic: document.getElementById('topic-input')?.value?.trim() || '',
    storyType: smStoryType,
    sceneCount: smSceneCount,
    platformMode: smPlatformMode,
    promptMode: smPromptMode,
    narrativeStyles: [...smNarrativeStyles],
    moodKeyword: smMoodKeyword,
    visualStyle: smVisualStyle,
    scriptMode: smScriptMode,
    outputType: smOutputType,
    disclaimer: smDisclaimer,
    manualScenes: smManualScenes.map(s => ({ ...s })),
    productImage: smProductImage || null,
    characterImage: smCharacterImage || null,
    textH1H2: document.getElementById('chk-text-h1h2')?.checked || false,
    autoJson: document.getElementById('chk-auto-json')?.checked || false,
    autoPost: smAutoPostEnabled,
    autoPostProductId: smAutoPostProductId,
    customPromptFull: document.getElementById('chk-sm-custom-prompt-full')?.checked || false,
    customPromptText: document.getElementById('sm-custom-prompt-textarea')?.value || '',
    customEnhancedSystem: document.getElementById('chk-sm-custom-enhanced-system')?.checked !== false,
    customAppendPipelineHint: document.getElementById('chk-sm-custom-append-pipeline-hint')?.checked !== false
  };
}

// Restore ค่า config กลับเข้า state variables
function restoreStoryConfig(config) {
  const topicInput = document.getElementById('topic-input');
  if (topicInput) topicInput.value = config.topic || '';
  else console.warn('[restoreStoryConfig] topic-input not found');
  smStoryType = config.storyType || 'custom';
  smSceneCount = config.sceneCount || 5;
  smPlatformMode = config.platformMode || 'flow';
  smPromptMode = config.promptMode || 'storytelling';
  smNarrativeStyles = config.narrativeStyles ? [...config.narrativeStyles] : [];
  smNarrativeStyles = smNarrativeStyles.filter((id) => {
    const n = Number(id);
    return n >= 1 && n <= 60;
  });
  smMoodKeyword = config.moodKeyword || 'Cinematic Standard';
  smVisualStyle = config.visualStyle || 'Cartoon Nova 3D';
  smScriptMode = config.scriptMode || 'ai';
  smOutputType = config.outputType || 'both';
  smDisclaimer = config.disclaimer || '';
  smManualScenes = config.manualScenes ? config.manualScenes.map(s => ({ ...s })) : [];
  smProductImage = config.productImage || null;
  smCharacterImage = config.characterImage || null;
  smSceneProductControl = [];
  
  try {
    const chkH1H2 = document.getElementById('chk-text-h1h2');
    const chkJson = document.getElementById('chk-auto-json');
    if (chkH1H2) chkH1H2.checked = config.textH1H2 || false;
    if (chkJson) chkJson.checked = config.autoJson || false;
  } catch(e) { console.warn('[restoreStoryConfig] checkbox error:', e.message); }
  
  // Restore auto-post settings
  smAutoPostEnabled = config.autoPost || false;
  smAutoPostProductId = config.autoPostProductId || '';
  const apToggle = document.getElementById('sm-autopost-toggle');
  const apSettings = document.getElementById('sm-autopost-settings');
  const apProductId = document.getElementById('sm-autopost-product-id');
  if (apToggle) apToggle.checked = smAutoPostEnabled;
  if (apSettings) apSettings.style.display = smAutoPostEnabled ? 'block' : 'none';
  if (apProductId) apProductId.value = smAutoPostProductId;

  const chkCustomFull = document.getElementById('chk-sm-custom-prompt-full');
  const wrapCustom = document.getElementById('sm-custom-prompt-wrap');
  const taCustom = document.getElementById('sm-custom-prompt-textarea');
  const chkEnh = document.getElementById('chk-sm-custom-enhanced-system');
  const chkPipe = document.getElementById('chk-sm-custom-append-pipeline-hint');
  if (chkCustomFull) chkCustomFull.checked = !!config.customPromptFull;
  if (wrapCustom) wrapCustom.style.display = config.customPromptFull ? 'block' : 'none';
  if (taCustom) taCustom.value = typeof config.customPromptText === 'string' ? config.customPromptText : '';
  if (chkEnh) chkEnh.checked = config.customEnhancedSystem !== false;
  if (chkPipe) chkPipe.checked = config.customAppendPipelineHint !== false;
}

// เพิ่มเรื่องเข้าคิว
function smAddToQueue() {
  const config = snapshotStoryConfig();
  
  const customBody = (config.customPromptText || '').trim();
  if (config.customPromptFull) {
    if (!customBody) {
      showError('โหมด Prompt กำหนดเอง: กรุณาใส่ข้อความในช่อง Prompt เต็มชุดก่อนเพิ่มเข้าคิว');
      return;
    }
  } else if (!config.topic) {
    showError('กรุณาใส่หัวข้อเรื่องก่อนเพิ่มเข้าคิว');
    return;
  }
  
  smQueueIdCounter++;
  const tmpl = STORY_TYPE_TEMPLATES.find(t => t.id === config.storyType);
  const labelSource = config.topic.trim() || customBody;
  const label = `${labelSource.substring(0, 30)}${labelSource.length > 30 ? '...' : ''}`;
  
  smStoryQueue.push({
    id: smQueueIdCounter,
    config: config,
    status: 'pending', // pending | running | completed | failed
    result: null,
    label,
    templateName: tmpl ? tmpl.name : 'Custom',
    sceneCount: config.sceneCount
  });
  
  smRenderQueueList();
  addLog(`📋 [Queue] เพิ่มเรื่อง "${labelSource.substring(0, 30)}${labelSource.length > 30 ? '...' : ''}" เข้าคิว (${smStoryQueue.length} เรื่อง)`, 'info');
  
  // แสดง Queue section
  const queueSection = document.getElementById('queue-section');
  if (queueSection) queueSection.style.display = 'block';
}

// ลบเรื่องออกจากคิว
function smRemoveFromQueue(queueId) {
  if (smQueueRunning) {
    const item = smStoryQueue.find(q => q.id === queueId);
    if (item && item.status === 'running') {
      showError('ไม่สามารถลบเรื่องที่กำลังทำงานอยู่');
      return;
    }
  }
  smStoryQueue = smStoryQueue.filter(q => q.id !== queueId);
  smRenderQueueList();
}

// ล้างคิวทั้งหมด
function smClearQueue() {
  if (smQueueRunning) {
    showError('ไม่สามารถล้างคิวขณะกำลังทำงาน');
    return;
  }
  smStoryQueue = [];
  smRenderQueueList();
  const queueSection = document.getElementById('queue-section');
  if (queueSection) queueSection.style.display = 'none';
}

// Render รายการคิว
function smRenderQueueList() {
  const listEl = document.getElementById('queue-list');
  if (!listEl) return;
  
  const countEl = document.getElementById('queue-count');
  if (countEl) countEl.textContent = smStoryQueue.length;
  
  if (smStoryQueue.length === 0) {
    listEl.innerHTML = '<div class="queue-empty">ยังไม่มีเรื่องในคิว</div>';
    return;
  }
  
  listEl.innerHTML = smStoryQueue.map((item, i) => {
    const statusIcons = { pending: '⏳', running: '🔄', completed: '✅', failed: '❌' };
    const statusIcon = statusIcons[item.status] || '⏳';
    const isRunning = item.status === 'running';
    
    return `
      <div class="sm-queue-item ${item.status}" data-id="${item.id}">
        <div class="sm-queue-item-num">${i + 1}</div>
        <div class="sm-queue-item-info">
          <div class="sm-queue-item-label">${statusIcon} ${escapeHtml(item.label)}</div>
          <div class="sm-queue-item-meta">${item.templateName} · ${item.sceneCount} ฉาก · ${item.config.promptMode === 'ugc' ? 'UGC' : 'Story'}${item.status === 'failed' && item.result ? `<br><span style="color:#f87171;font-size:10px;">⚠️ ${escapeHtml(item.result.substring(0, 120))}</span>` : ''}</div>
        </div>
        <div class="sm-queue-item-actions">
          ${!isRunning && !smQueueRunning ? `<button class="queue-remove-btn" onclick="smRemoveFromQueue(${item.id})" title="ลบ">✕</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ★ Queue Runner — outer loop ★
async function smStartQueue() {
  if (smStoryQueue.length === 0) {
    showError('ไม่มีเรื่องในคิว');
    return;
  }
  
  if (smQueueRunning) {
    showError('Queue กำลังทำงานอยู่แล้ว');
    return;
  }
  
  smQueueRunning = true;
  smCurrentQueueIndex = 0;
  
  // อัพเดท UI
  const startBtn = document.getElementById('queue-start-btn');
  const stopBtn = document.getElementById('queue-stop-btn');
  if (startBtn) startBtn.style.display = 'none';
  if (stopBtn) stopBtn.style.display = 'inline-flex';
  
  const totalStories = smStoryQueue.filter(q => q.status === 'pending').length;
  addLog(`🚀 [Queue] เริ่ม Queue — ${totalStories} เรื่อง`, 'info');
  smUpdateQueueProgress(0, totalStories, '🚀 เริ่มต้น Queue...');
  
  for (let i = 0; i < smStoryQueue.length; i++) {
    if (!smQueueRunning) break;
    
    const item = smStoryQueue[i];
    if (item.status !== 'pending') continue;
    
    smCurrentQueueIndex = i;
    item.status = 'running';
    smRenderQueueList();
    
    const storyNum = smStoryQueue.filter((q, idx) => idx <= i && (q.status === 'running' || q.status === 'completed' || q.status === 'failed')).length;
    smUpdateQueueProgress(storyNum, totalStories, `📖 เรื่องที่ ${storyNum}/${totalStories}: "${item.label}"`);
    addLog(`📖 [Queue] เริ่มเรื่องที่ ${storyNum}: "${item.label}"`, 'info');
    
    try {
      // 1. Restore config
      restoreStoryConfig(item.config);
      
      // 2. Generate script via AI
      addLog(`🤖 [Queue] กำลัง Generate script...`, 'info');
      smUpdateQueueProgress(storyNum, totalStories, `🤖 เรื่องที่ ${storyNum}: Generate script...`);
      await generateScriptForQueue();
      
      // 3. เช็คว่า output มี content หรือไม่
      const outputContent = document.getElementById('output-content');
      if (!outputContent || !outputContent.textContent.trim()) {
        throw new Error('Generate script ไม่สำเร็จ — ไม่มี output');
      }
      
      // 4. ★ Set storyAutoPost flag ก่อนเริ่ม pipeline (ให้ content-googleflow.js รู้) ★
      if (item.config.autoPost) {
        await chrome.storage.local.set({
          storyAutoPost: {
            enabled: true,
            productId: item.config.autoPostProductId || '',
            caption: item.config.topic || '',
            storyNum: storyNum
          }
        });
        addLog(`🚀 [Queue] เรื่องที่ ${storyNum}: Auto Post เปิด — จะโพส TikTok หลังสร้างเสร็จ`, 'info');
      } else {
        await chrome.storage.local.set({ storyAutoPost: null });
      }
      
      // 5. Start auto-run (parse + run pipeline)
      addLog(`🎬 [Queue] เริ่ม Pipeline...`, 'info');
      smUpdateQueueProgress(storyNum, totalStories, `🎬 เรื่องที่ ${storyNum}: Pipeline กำลังทำงาน...`);
      await startAutoRunForQueue();
      
      // 6. รอ pipeline เสร็จ
      await waitForPipelineComplete();
      
      // 7. ★ ถ้าเปิด Auto Post → รอ TikTok โพสเสร็จ ★
      if (item.config.autoPost) {
        addLog(`📤 [Queue] เรื่องที่ ${storyNum}: กำลังรอ TikTok โพส...`, 'info');
        smUpdateQueueProgress(storyNum, totalStories, `📤 เรื่องที่ ${storyNum}: รอ TikTok โพส...`);
        await waitForTikTokStoryPostComplete();
        addLog(`✅ [Queue] เรื่องที่ ${storyNum}: TikTok โพสเสร็จ!`, 'success');
        smUpdateQueueProgress(storyNum, totalStories, `✅ เรื่องที่ ${storyNum}: โพส TikTok เสร็จ!`);
        // ★ Clear flags หลังโพสเสร็จ ★
        await chrome.storage.local.set({
          storyAutoPost: null,
          currentItemPosted: false,
          currentFlowData: null,
          autopostTargetClipDuration: null,
          autopostTargetItemId: null,
          flowStatus: null,
          flowMessage: null
        });
        
        // ★ ปิด TikTok tab ที่เหลือ เพื่อไม่ให้ content.js แทรก ★
        try {
          const tiktokTabs = await chrome.tabs.query({ url: '*://*.tiktok.com/*' });
          for (const tt of tiktokTabs) {
            console.log(`[Queue] Closing TikTok tab: ${tt.id}`);
            await chrome.tabs.remove(tt.id).catch(() => {});
          }
        } catch (e) {
          console.log('[Queue] Error closing TikTok tabs:', e.message);
        }
        
        // ★ รอ 10 วิ ให้ settle ก่อนเริ่มเรื่องถัดไป ★
        addLog(`⏳ [Queue] รอ 10 วิ ก่อนเริ่มเรื่องถัดไป...`, 'info');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      item.status = 'completed';
      addLog(`✅ [Queue] เรื่องที่ ${storyNum}: "${item.label}" — เสร็จสมบูรณ์!`, 'success');
      smUpdateQueueProgress(storyNum, totalStories, `✅ เรื่องที่ ${storyNum}: เสร็จแล้ว!`);
      
    } catch (error) {
      console.error(`[Queue] Story ${i + 1} error:`, error);
      const errMsg = error?.message || String(error) || 'Unknown error';
      item.status = 'failed';
      item.result = errMsg;
      const storyLabel = item?.label || `Story ${i + 1}`;
      addLog(`❌ [Queue] เรื่อง "${storyLabel}" — ล้มเหลว: ${errMsg.substring(0, 150)}`, 'error');
      smUpdateQueueProgress(storyNum || 1, totalStories, `❌ ล้มเหลว: ${errMsg.substring(0, 100)}`);
      // ★ Clear auto-post flags on failure too ★
      await chrome.storage.local.set({ storyAutoPost: null, currentItemPosted: false, currentFlowData: null, autopostTargetClipDuration: null, autopostTargetItemId: null, flowStatus: null, flowMessage: null }).catch(() => {});
    }
    
    smRenderQueueList();
    
    // 8. ถ้ายังมีเรื่องถัดไป → reload Google Flow tab
    const remaining = smStoryQueue.filter(q => q.status === 'pending');
    if (remaining.length > 0 && smQueueRunning) {
      addLog(`🔄 [Queue] เหลือ ${remaining.length} เรื่อง — กำลัง recover Google Flow tab...`, 'info');
      smUpdateQueueProgress(storyNum, totalStories, `🔄 Reload Google Flow สำหรับเรื่องถัดไป...`);
      try {
        await recoverGoogleFlowTab();
        await new Promise(resolve => setTimeout(resolve, 5000));
        addLog(`✅ [Queue] Google Flow tab พร้อม — เริ่มเรื่องถัดไป`, 'success');
      } catch (recoverErr) {
        console.error('[Queue] Recover tab error:', recoverErr);
        addLog(`⚠️ [Queue] Recover tab error: ${recoverErr.message} — ลองต่อ...`, 'warning');
      }
    }
  }
  
  // เสร็จทั้งหมด
  smQueueRunning = false;
  smCurrentQueueIndex = -1;
  
  const completed = smStoryQueue.filter(q => q.status === 'completed').length;
  const failed = smStoryQueue.filter(q => q.status === 'failed').length;
  
  addLog(`🎉 [Queue] Queue เสร็จสิ้น! สำเร็จ ${completed} เรื่อง${failed > 0 ? `, ล้มเหลว ${failed} เรื่อง` : ''}`, 'success');
  smUpdateQueueProgress(totalStories, totalStories, `🎉 Queue เสร็จ! ${completed}/${totalStories} สำเร็จ`);
  
  if (startBtn) startBtn.style.display = 'inline-flex';
  if (stopBtn) stopBtn.style.display = 'none';
  smRenderQueueList();
}

// หยุด Queue
function smStopQueue() {
  smQueueRunning = false;
  // หยุด pipeline ปัจจุบันด้วย
  if (autoRunState.isRunning) {
    stopAutoRunStoryboard();
  }
  addLog('⏹️ [Queue] หยุดโดยผู้ใช้', 'warning');
  
  const startBtn = document.getElementById('queue-start-btn');
  const stopBtn = document.getElementById('queue-stop-btn');
  if (startBtn) startBtn.style.display = 'inline-flex';
  if (stopBtn) stopBtn.style.display = 'none';
  
  // Mark running items as pending again
  smStoryQueue.forEach(q => {
    if (q.status === 'running') q.status = 'pending';
  });
  smRenderQueueList();
}

// Generate script โดยไม่ต้อง user กด button (สำหรับ Queue)
async function generateScriptForQueue() {
  const outputSection = document.getElementById('output-section');
  const outputContent = document.getElementById('output-content');
  const errorContainer = document.getElementById('error-container');
  
  if (errorContainer) errorContainer.innerHTML = '';
  
  if (!outputSection || !outputContent) {
    throw new Error('DOM elements not found: output-section or output-content');
  }
  
  let userMessage;
  try {
    userMessage = buildUserMessage();
  } catch (buildErr) {
    throw new Error(`buildUserMessage failed: ${buildErr.message}`);
  }
  
  console.log('[Queue] userMessage length:', userMessage?.length);
  
  const result = await chrome.storage.local.get(['provider', 'openaiKey', 'googleKey']);
  let provider = result.openaiKey ? 'openai' : (result.googleKey ? 'google' : (result.provider || 'openai'));
  let apiKey = provider === 'openai' ? result.openaiKey : result.googleKey;
  
  if (!apiKey) {
    throw new Error('ไม่มี API Key — กรุณาตั้งค่า API Key ก่อนใช้งาน Queue');
  }
  
  outputSection.style.display = 'block';
  
  // วิเคราะห์รูปสินค้า (ถ้ามี)
  let smProductAnalysis = null;
  if (smProductImage) {
    outputContent.innerHTML = `<div class="loading"><div class="spinner"></div><span>🔍 AI กำลังวิเคราะห์รูปสินค้า...</span></div>`;
    smProductAnalysis = await analyzeProductForStorymode(smProductImage);
    
    if (smProductAnalysis) {
      const analysisBlock = `\n\n=== 🔍 AI PRODUCT ANALYSIS (จากรูปสินค้าที่แนบ) ===\nประเภทสินค้า: ${smProductAnalysis.productType || 'N/A'}\nลักษณะ: ${smProductAnalysis.appearance || 'N/A'}\nแบรนด์: ${smProductAnalysis.brand || 'N/A'}\nจุดเด่น: ${smProductAnalysis.features || 'N/A'}\nกลุ่มเป้าหมาย: ${smProductAnalysis.targetAudience || 'N/A'}\nวิธีใช้: ${smProductAnalysis.usage || 'N/A'}\nโทนสี: ${smProductAnalysis.colorTone || 'N/A'}\nคำแนะนำถ่ายวิดีโอ: ${smProductAnalysis.videoTips || 'N/A'}\nEnglish Summary (for Image Prompt): ${smProductAnalysis.summary_en || 'N/A'}\n\n⚠️⚠️⚠️ CRITICAL — กฎเหล็กจากการวิเคราะห์รูปสินค้า:\n1. Image Prompt ทุกฉากต้องบรรยายสินค้าให้ตรงกับผลวิเคราะห์ด้านบน 100%\n2. ห้ามสร้างสินค้าขึ้นมาเอง — ต้องตรงกับรูปที่แนบ\n3. Dialogue ต้องกล่าวถึงคุณสมบัติจริงของสินค้า\n4. ใช้ English Summary ใน Image Prompt`;
      userMessage += analysisBlock;
    }
  }

  // ★ v3.17: วิเคราะห์รูปตัวละคร reference — ตรวจ visual style + บรรยายตัวละคร ★
  smCharacterAnalysisResult = null;
  if (smCharacterImage) {
    outputContent.innerHTML = `<div class="loading"><div class="spinner"></div><span>🔍 AI กำลังวิเคราะห์รูปตัวละคร reference...</span></div>`;
    smCharacterAnalysisResult = await analyzeCharacterForStorymode(smCharacterImage);

    if (smCharacterAnalysisResult) {
      const styleLabel = {
        'photorealistic': 'Photorealistic (ภาพจริง)',
        '3d_animation': '3D Animation (Pixar/Disney)',
        'anime_2d': 'Anime / 2D Cartoon',
        'illustration': 'Illustration / Digital Art',
        'watercolor': 'Watercolor',
        'claymation': 'Claymation',
        'pixel_art': 'Pixel Art',
        'other': 'Other'
      }[smCharacterAnalysisResult.visual_style] || smCharacterAnalysisResult.visual_style;

      const charAnalysisBlock = `\n\n=== 🎭 AI CHARACTER REFERENCE ANALYSIS ===\n🎨 Detected Visual Style: ${styleLabel}\n👤 Character Description: ${smCharacterAnalysisResult.character_desc || 'N/A'}\n⚧ Gender: ${smCharacterAnalysisResult.gender || 'N/A'}\n🖼️ Art Style Directive: ${smCharacterAnalysisResult.style_prompt || 'N/A'}\n\n⚠️⚠️⚠️ CRITICAL — ART STYLE OVERRIDE (สำคัญที่สุด! ห้ามละเมิดเด็ดขาด!):\n1. ⛔ ห้ามใช้ "3D animated CGI", "3D Pixar", "Disney animation", "cartoon" style ถ้า Visual Style = Photorealistic!\n2. ✅ Image Prompt ทุกฉากต้องเริ่มต้นด้วย Art Style Directive: "${smCharacterAnalysisResult.style_prompt}"\n3. ✅ Character Description ในทุกฉากต้องตรงกับ reference: "${smCharacterAnalysisResult.character_desc}"\n4. ⛔ ห้ามเปลี่ยน art style ระหว่างฉากเด็ดขาด — ทุกฉากต้องใช้สไตล์เดียวกัน\n5. ⛔ ถ้า reference เป็นภาพจริง/ถ่ายจริง → ห้ามเปลี่ยนเป็นการ์ตูน/3D/anime เด็ดขาด!`;
      userMessage += charAnalysisBlock;
    }
  }
  
  const providerLabel = provider === 'openai' ? 'ChatGPT' : 'Gemini AI';
  outputContent.innerHTML = `<div class="loading"><div class="spinner"></div><span>[Queue] กำลังสร้างสคริปต์ด้วย ${providerLabel}...</span></div>`;

  // ★ v3.17: Override system prompt ถ้า character reference เป็น photorealistic ★
  let systemPrompt = getStorymodeSystemPromptForGenerate();
  if (smCharacterAnalysisResult && smCharacterAnalysisResult.visual_style === 'photorealistic') {
    const styleOverride = `\n\n⛔⛔⛔ ART STYLE OVERRIDE (HIGHEST PRIORITY!) ⛔⛔⛔\nThe user has uploaded a PHOTOREALISTIC character reference image.\n- ALL Image Prompts MUST use PHOTOREALISTIC style: "${smCharacterAnalysisResult.style_prompt}"\n- ⛔ ABSOLUTELY FORBIDDEN: "3D animated", "3D CGI", "3D Pixar", "Disney animation", "cartoon", "next-gen graphics render", "smooth 3D rendering"\n- ✅ REQUIRED: "photorealistic", "photography", "natural lighting", "ultra realistic", "DSLR quality"\n- Character description from reference: "${smCharacterAnalysisResult.character_desc}"\n- This overrides ALL previous style instructions including "3D Animation" default!`;
    systemPrompt += styleOverride;
    addLog(`🎨 [Style Override] System prompt updated → photorealistic mode`, 'info');
  }

  conversationHistory = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];
  
  const response = await callAPI(provider, apiKey, conversationHistory);
  outputContent.textContent = response;
  conversationHistory.push({ role: 'assistant', content: response });
  
  // ถ้า AI ยังไม่เสร็จ (มีคำว่า "ต่อ") → เรียก continueGeneration อัตโนมัติ
  if (response.includes("พิมพ์คำว่า 'ต่อ'") || response.includes('พิมพ์คำว่า "ต่อ"')) {
    addLog(`📝 [Queue] AI ตอบไม่ครบ — กำลังเรียกต่อ...`, 'info');
    await continueGenerationForQueue(provider, apiKey);
  }
  
}

// Continue generation อัตโนมัติ (สำหรับ Queue)
async function continueGenerationForQueue(provider, apiKey) {
  const outputContent = document.getElementById('output-content');
  const maxContinue = 3; // ป้องกัน infinite loop
  
  for (let round = 0; round < maxContinue; round++) {
    conversationHistory.push({ role: 'user', content: 'ต่อ' });
    const response = await callAPI(provider, apiKey, conversationHistory);
    outputContent.textContent += '\n\n' + response;
    conversationHistory.push({ role: 'assistant', content: response });
    
    if (!response.includes("พิมพ์คำว่า 'ต่อ'") && !response.includes('พิมพ์คำว่า "ต่อ"')) {
      break;
    }
    addLog(`📝 [Queue] เรียกต่อรอบ ${round + 2}...`, 'info');
  }
}

// Start auto-run pipeline สำหรับ Queue (เรียก startAutoRunStoryboard แบบ programmatic)
async function startAutoRunForQueue() {
  const outputContent = document.getElementById('output-content');
  if (!outputContent || !outputContent.textContent.trim()) {
    throw new Error('ไม่มี output สำหรับ auto-run');
  }
  
  // Parse scenes จาก output
  const rawOutput = outputContent.textContent;
  const parsedData = parseScenesToCards(rawOutput);
  const scenes = parsedData.scenes || [];
  
  if (scenes.length === 0) {
    throw new Error('ไม่พบฉากใน output');
  }

  // ★ v3.17: Post-process — override art style ให้ตรง character reference ★
  postProcessScenePromptsForStyle(scenes);
  
  addLog(`🎬 [Queue] พบ ${scenes.length} ฉาก — เริ่ม Pipeline`, 'info');
  
  // ตั้งค่า autoRunState
  autoRunState = {
    isRunning: true,
    isStopped: false,
    currentScene: 0,
    totalScenes: scenes.length,
    scenePrompts: scenes,
    startTime: Date.now(),
    failedScenes: []
  };
  
  await chrome.storage.local.set({ flowType: 'storymode' });
  
  // Render Pipeline steps
  renderPipelineSteps(scenes);
  
  const autoRunBtn = document.getElementById('auto-run-btn');
  const stopBtn = document.getElementById('stop-auto-run-btn');
  if (autoRunBtn) autoRunBtn.style.display = 'none';
  if (stopBtn) stopBtn.style.display = 'block';
  
  updateAutoRunProgress(0, scenes.length, '🚀 [Queue] เริ่มต้น Pipeline...');
  
  // เปิด Google Flow (ถ้ายังไม่ได้อยู่)
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.includes('labs.google')) {
    addLog('🌐 [Queue] กำลังเปิด Google Flow...', 'info');
    await chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow' });
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // เริ่ม scene loop
  await runAutoSceneLoop();
}

// ★ รอ TikTok โพสเสร็จ (poll currentItemPosted) ★
async function waitForTikTokStoryPostComplete() {
  const maxWaitMs = 25 * 60 * 1000; // 25 นาที (สอดคล้องกับ Auto Post 16s clip)
  const pollMs = 5000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    if (!smQueueRunning) throw new Error('Queue หยุดโดยผู้ใช้');
    
    const result = await chrome.storage.local.get(['currentItemPosted', 'flowStatus']);
    
    // ★ เช็ค posted ★
    if (result.currentItemPosted === true) {
      console.log('[Queue] TikTok story post complete!');
      return;
    }
    
    // ★ เช็ค error ★
    if (result.flowStatus === 'flow_error') {
      console.log('[Queue] TikTok post failed (flow_error)');
      throw new Error('TikTok post failed');
    }
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    if (elapsed % 30 === 0 && elapsed > 0) {
      addLog(`📤 [Queue] รอ TikTok โพส... ${elapsed} วิ`, 'info');
    }
    
    await new Promise(resolve => setTimeout(resolve, pollMs));
  }
  
  throw new Error('TikTok post timeout (15 นาที)');
}

// รอ pipeline เสร็จ (poll autoRunState)
async function waitForPipelineComplete() {
  const maxWaitMs = 3600000; // 1 ชั่วโมง
  const pollMs = 5000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    if (!smQueueRunning) throw new Error('Queue หยุดโดยผู้ใช้');
    
    if (!autoRunState.isRunning && !autoRunState.isStopped) {
      // Pipeline finished normally
      return;
    }
    
    if (autoRunState.isStopped) {
      throw new Error('Pipeline หยุดโดยผู้ใช้');
    }
    
    await new Promise(resolve => setTimeout(resolve, pollMs));
  }
  
  throw new Error('Pipeline timeout (1 ชั่วโมง)');
}

// อัพเดท Queue progress
function smUpdateQueueProgress(current, total, status) {
  const progressEl = document.getElementById('queue-progress');
  const progressText = document.getElementById('queue-progress-text');
  if (progressEl) progressEl.style.display = 'block';
  if (progressText) progressText.textContent = status;
}

// แสดง Auto Run section หลัง generate เสร็จ
function showAutoRunSection() {
  const section = document.getElementById('auto-run-section');
  if (section) {
    section.style.display = 'block';
  }
}

// ซ่อน Auto Run section
function hideAutoRunSection() {
  const section = document.getElementById('auto-run-section');
  if (section) {
    section.style.display = 'none';
  }
}

// อัพเดท progress (Pipeline view)
function updateAutoRunProgress(current, total, status) {
  const containerEl = document.getElementById('pipeline-container');
  const summaryEl = document.getElementById('pipeline-summary');
  const timeEl = document.getElementById('pipeline-time');
  const currentTextEl = document.getElementById('pipeline-current-text');
  
  if (containerEl) containerEl.style.display = 'block';
  if (summaryEl) summaryEl.textContent = `${current} / ${total} ฉาก`;
  if (currentTextEl) currentTextEl.textContent = status;
  
  // คำนวณเวลาที่ผ่านไป
  if (timeEl && autoRunState.startTime) {
    const elapsed = Math.floor((Date.now() - autoRunState.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // อัพเดท step ใน list
  updatePipelineStepStatus(current, status);
}

// ★ v2.60: สร้าง Pipeline steps list — พร้อม product checkboxes + retry button ★
function renderPipelineSteps(scenes) {
  const stepsEl = document.getElementById('pipeline-steps');
  if (!stepsEl) return;
  
  // ★ Reset failed scenes tracking ★
  autoRunState.failedScenes = [];
  
  stepsEl.innerHTML = scenes.map((scene, i) => {
    // ★ ดึง product control ปัจจุบัน (ถ้ามี) ★
    const ctrl = smSceneProductControl.find(c => c.sceneNumber === (i + 1));
    const showProd = ctrl ? ctrl.showProduct : true;
    const showDlg = ctrl ? ctrl.showProductDialogue : true;
    
    return `
    <div class="pipeline-step" id="pipeline-step-${i + 1}" style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid #333;flex-wrap:wrap;">
      <span class="step-icon" style="width:20px;text-align:center;">⏳</span>
      <span class="step-num" style="color:#aaa;font-size:11px;font-weight:bold;min-width:45px;">ฉาก ${i + 1}</span>
      <span class="step-status" style="flex:1;font-size:11px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">รอดำเนินการ</span>
      <span class="step-product-controls" style="display:flex;gap:4px;font-size:10px;">
        <label title="ใส่รูปสินค้าในฉากนี้" style="cursor:pointer;color:#888;"><input type="checkbox" class="pipeline-show-product" data-scene="${i + 1}" ${showProd ? 'checked' : ''} style="margin:0 2px 0 0;vertical-align:middle;">📦</label>
      </span>
      <button class="step-retry-btn" data-scene="${i + 1}" style="display:none;padding:2px 8px;font-size:10px;background:#f59e0b;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;" title="Retry ฉากนี้">🔄 Retry</button>
    </div>`;
  }).join('');
  
  // ★ Wire up pipeline product control checkboxes → sync กับ smSceneProductControl ★
  stepsEl.querySelectorAll('.pipeline-show-product').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const sceneNum = parseInt(e.target.dataset.scene);
      let ctrl = smSceneProductControl.find(c => c.sceneNumber === sceneNum);
      if (!ctrl) {
        ctrl = { sceneNumber: sceneNum, showProduct: true, showProductDialogue: true };
        smSceneProductControl.push(ctrl);
      }
      ctrl.showProduct = e.target.checked;
      // ★ Sync กับ scene cards checkboxes ด้วย ★
      const cardChk = document.querySelector(`.scene-show-product[data-scene="${sceneNum}"]`);
      if (cardChk) cardChk.checked = e.target.checked;
      console.log(`[Pipeline] ฉาก ${sceneNum}: สินค้า = ${e.target.checked ? 'ใส่' : 'ไม่ใส่'}`);
    });
  });
  
  // 💬 toggle removed — showProductDialogue auto-set to last 2 scenes only
  
  // ★ Wire up retry buttons ★
  stepsEl.querySelectorAll('.step-retry-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sceneNum = parseInt(btn.dataset.scene);
      btn.disabled = true;
      btn.textContent = '⏳ Retrying...';
      retrySingleScene(sceneNum - 1); // 0-indexed
    });
  });
}

// อัพเดท status ของ step
function updatePipelineStepStatus(stepNum, status) {
  const stepEl = document.getElementById(`pipeline-step-${stepNum}`);
  if (!stepEl) return;
  
  const iconEl = stepEl.querySelector('.step-icon');
  const statusEl = stepEl.querySelector('.step-status');
  const retryBtn = stepEl.querySelector('.step-retry-btn');
  
  // กำหนด icon ตาม status
  let icon = '⏳';
  let color = '#888';
  let isFailed = false;
  
  if (status.includes('กำลัง') || status.includes('🎬') || status.includes('🖼️')) {
    icon = '🔄';
    color = '#f59e0b';
  } else if (status.includes('✅') || status.includes('เสร็จ') || status.includes('ครบ')) {
    icon = '✅';
    color = '#10b981';
  } else if (status.includes('❌') || status.includes('ไม่สำเร็จ')) {
    icon = '❌';
    color = '#ef4444';
    isFailed = true;
  } else if (status.includes('⚠️') || status.includes('ล้มเหลว')) {
    icon = '⚠️';
    color = '#ef4444';
    isFailed = true;
  }
  
  if (iconEl) iconEl.textContent = icon;
  if (statusEl) {
    statusEl.textContent = status;
    statusEl.style.color = color;
  }
  
  // ★ v2.84: แสดง retry button ทันทีที่ฉากล้มเหลว (ไม่ต้องรอ pipeline จบ) ★
  if (retryBtn) {
    if (isFailed) {
      retryBtn.style.display = 'inline-block';
      // ★ Track failed scene ★
      if (!autoRunState.failedScenes.includes(stepNum)) {
        autoRunState.failedScenes.push(stepNum);
      }
      // ★ ถ้า pipeline ยังทำงานอยู่ → แสดงปุ่มแต่ disable ไว้ก่อน ★
      if (autoRunState.isRunning) {
        retryBtn.disabled = true;
        retryBtn.textContent = '🔄 รอ...';
        retryBtn.title = 'รอ Pipeline เสร็จก่อนถึงจะ Retry ได้';
      } else {
        retryBtn.disabled = false;
        retryBtn.textContent = '🔄 Retry';
        retryBtn.title = 'Retry ฉากนี้';
      }
    } else if (!isFailed) {
      retryBtn.style.display = 'none';
      // ★ Remove from failed scenes ★
      autoRunState.failedScenes = autoRunState.failedScenes.filter(s => s !== stepNum);
    }
  }
  
  // Scroll to current step
  stepEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ★ v2.84: เปิดใช้งานปุ่ม Retry ทุกฉากที่ล้มเหลว (เรียกเมื่อ pipeline จบ) ★
function enableFailedRetryButtons() {
  if (!autoRunState.failedScenes || autoRunState.failedScenes.length === 0) return;
  for (const sceneNum of autoRunState.failedScenes) {
    const stepEl = document.getElementById(`pipeline-step-${sceneNum}`);
    if (!stepEl) continue;
    const retryBtn = stepEl.querySelector('.step-retry-btn');
    if (retryBtn) {
      retryBtn.style.display = 'inline-block';
      retryBtn.disabled = false;
      retryBtn.textContent = '🔄 Retry';
      retryBtn.title = 'Retry ฉากนี้';
    }
  }
  console.log(`[Pipeline] Enabled retry buttons for failed scenes: ${autoRunState.failedScenes.join(', ')}`);
}

// ★ v2.60: Retry ฉากที่ล้มเหลว — รัน Image + Video ใหม่เฉพาะฉากนั้น ★
async function retrySingleScene(sceneIndex) {
  if (autoRunState.isRunning) {
    showError('Pipeline กำลังทำงานอยู่ — รอให้เสร็จก่อน');
    return;
  }
  
  const scene = autoRunState.scenePrompts[sceneIndex];
  if (!scene) {
    showError(`ไม่พบข้อมูลฉากที่ ${sceneIndex + 1}`);
    return;
  }
  
  const sceneNum = sceneIndex + 1;
  console.log(`[Retry] === Retrying Scene ${sceneNum} ===`);
  addLog(`🔄 [Storymode] Retry ฉากที่ ${sceneNum}...`, 'info');
  
  // ★ Set running state ★
  autoRunState.isRunning = true;
  autoRunState.isStopped = false;
  await chrome.storage.local.set({ flowType: 'storymode' });
  
  // อัพเดท UI
  updatePipelineStepStatus(sceneNum, `🔄 Retry ฉาก ${sceneNum}: กำลังเริ่ม...`);
  
  // ★ ดึง prompt ★
  let imagePrompt = scene.imagePrompt || scene.prompt || '';
  let videoPrompt = scene.videoPrompt || scene.prompt || '';
  
  // ★ ถ้าผู้ใช้แก้ไข dialogue → แทนที่ ★
  if (scene.dialogue && videoPrompt) {
    videoPrompt = replaceDialogueInVideoPrompt(videoPrompt, scene.dialogue);
  }
  
  // ★ หา Google Flow tab ★
  let tab;
  try {
    const tabs = await chrome.tabs.query({ url: '*://labs.google/*' });
    if (tabs.length > 0) {
      tab = tabs[0];
      await chrome.tabs.update(tab.id, { active: true });
    } else {
      tab = await chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow' });
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  } catch (e) {
    console.error('[Retry] Tab error:', e);
    tab = await recoverGoogleFlowTab();
  }
  
  // ★ Clear stale status ★
  await chrome.storage.local.set({ autoRunSceneStatus: null, flowStatus: null, flowMessage: null });
  
  // === STEP 1: Image ===
  let imageSuccess = false;
  if (imagePrompt) {
    updatePipelineStepStatus(sceneNum, `🖼️ Retry ฉาก ${sceneNum}: กำลังสร้าง Image...`);
    addLog(`🖼️ [Retry] ฉาก ${sceneNum}: กำลังสร้าง Image...`, 'info');
    
    try {
      // ★ เช็ค per-scene product control ★
      const sceneCtrl = smSceneProductControl.find(c => c.sceneNumber === sceneNum);
      const sceneShowProduct = sceneCtrl ? sceneCtrl.showProduct : true;
      const sceneProductImg = sceneShowProduct ? (smProductImage || null) : null;
      
      // ★ v3.17: Compact scene metadata + ART STYLE FIX ★
      let finalImagePrompt = imagePrompt;

      // ★ v3.17: Style override สำหรับ retry ★
      if (smCharacterAnalysisResult && smCharacterAnalysisResult.visual_style === 'photorealistic') {
        finalImagePrompt = finalImagePrompt
          .replace(/3D animated CGI[^,.]*/gi, '')
          .replace(/3D pixar[^,.]*/gi, '')
          .replace(/pixar[/ ]?disney[^,.]*/gi, '')
          .replace(/3D studio animation[^,.]*/gi, '')
          .replace(/next-gen graphics render/gi, '')
          .replace(/expressive cartoon characters[^,.]*/gi, '')
          .replace(/smooth 3D rendering/gi, '')
          .replace(/,\s*,/g, ',')
          .replace(/^[\s,]+/, '')
          .trim();
        if (!finalImagePrompt.toLowerCase().includes('photorealistic') && !finalImagePrompt.toLowerCase().includes('photography')) {
          finalImagePrompt = `${smCharacterAnalysisResult.style_prompt}, ${finalImagePrompt}`;
        }
      }

      if (smCharacterLockDescription) {
        finalImagePrompt = replaceCharacterBlock(finalImagePrompt, smCharacterLockDescription);
      }
      
      let retryMeta = '';
      if (sceneProductImg && smCharacterImage) {
        retryMeta += `\nRef images: 1st=PRODUCT (copy exact), 2nd=CHARACTER (same person every scene).`;
      } else if (sceneProductImg) {
        retryMeta += `\nRef image = PRODUCT. Copy exact product.`;
      } else if (smCharacterImage) {
        retryMeta += `\nRef image = CHARACTER. Same person every scene.`;
      }
      if (!sceneShowProduct && smProductImage) {
        retryMeta += `\nNo product in this scene — story/character only.`;
      }
      if (retryMeta) finalImagePrompt += `\n${retryMeta}`;
      
      // ★ v3.16: sanitize + v3.23: pre-flight policy screen ★
      finalImagePrompt = preFlightPolicyScreen(sanitizeVideoPrompt(finalImagePrompt));
      
      await chrome.tabs.sendMessage(tab.id, {
        action: 'createSceneImage',
        imagePrompt: finalImagePrompt,
        sceneNumber: sceneNum,
        isFirstScene: true,
        productImage: sceneProductImg,
        characterImage: smCharacterImage || null
      });
      
      await waitForSceneStep(sceneNum, 'image');
      updatePipelineStepStatus(sceneNum, `✅ Retry ฉาก ${sceneNum}: Image เสร็จ!`);
      addLog(`✅ [Retry] ฉาก ${sceneNum}: Image สำเร็จ`, 'success');
      imageSuccess = true;
    } catch (imgErr) {
      console.error(`[Retry] Scene ${sceneNum} Image error:`, imgErr);
      addLog(`❌ [Retry] ฉาก ${sceneNum}: Image ล้มเหลว — ${imgErr.message?.substring(0, 80)}`, 'error');
    }
  }
  
  // === STEP 2: Video ===
  if (videoPrompt && imageSuccess) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    updatePipelineStepStatus(sceneNum, `🎬 Retry ฉาก ${sceneNum}: กำลังสร้าง Video...`);
    addLog(`🎬 [Retry] ฉาก ${sceneNum}: กำลังสร้าง Video...`, 'info');
    
    try {
      let finalVideoPrompt = videoPrompt;
      const vidSceneCtrl = smSceneProductControl.find(c => c.sceneNumber === sceneNum);
      if (vidSceneCtrl && !vidSceneCtrl.showProductDialogue && smProductImage) {
        finalVideoPrompt += `\nNo product mention — focus on story/emotion.`;
      }
      
      // ★ v3.16: Compact metadata ★
      if (autoRunState && autoRunState.totalScenes > 1) {
        finalVideoPrompt += `\nScene ${sceneNum}/${autoRunState.totalScenes} (retry). Same character, continuous story.`;
        if (smCharacterLockDescription) {
          finalVideoPrompt += `\nCharacter: ${smCharacterLockDescription.substring(0, 500)}`;
        }
      }
      
      // ★ FIX: Reset pipeline lock ก่อนส่ง createSceneVideo ★
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'resetPipelineLock' });
      } catch (resetErr) {
        console.log(`[Retry] resetPipelineLock failed:`, resetErr.message);
      }
      
      // ★ v3.16: sanitize + v3.23: pre-flight policy screen ★
      finalVideoPrompt = preFlightPolicyScreen(sanitizeVideoPrompt(finalVideoPrompt));
      
      const vidResp = await chrome.tabs.sendMessage(tab.id, {
        action: 'createSceneVideo',
        videoPrompt: finalVideoPrompt,
        sceneNumber: sceneNum
      });
      
      if (vidResp && vidResp.success === false) {
        throw new Error(`Content script rejected: ${vidResp.reason || 'unknown'}`);
      }
      
      await waitForSceneStep(sceneNum, 'video');
      updatePipelineStepStatus(sceneNum, `✅ Retry ฉาก ${sceneNum}: เสร็จครบ! (Image + Video)`);
      addLog(`✅ [Retry] ฉาก ${sceneNum}: เสร็จครบ!`, 'success');
    } catch (vidErr) {
      console.error(`[Retry] Scene ${sceneNum} Video error:`, vidErr);
      updatePipelineStepStatus(sceneNum, `⚠️ Retry ฉาก ${sceneNum}: Image OK แต่ Video ล้มเหลว`);
      addLog(`⚠️ [Retry] ฉาก ${sceneNum}: Video ล้มเหลว — ${vidErr.message?.substring(0, 80)}`, 'warning');
    }
  } else if (!imageSuccess) {
    updatePipelineStepStatus(sceneNum, `❌ Retry ฉาก ${sceneNum}: Image ล้มเหลว`);
  }
  
  // ★ Reset running state ★
  autoRunState.isRunning = false;
  enableFailedRetryButtons(); // ★ v2.84: เปิดปุ่ม Retry ที่ยังค้างอยู่ ★
  await chrome.storage.local.set({ flowType: null, autoRunSceneStatus: null });
  console.log(`[Retry] === Scene ${sceneNum} Retry Complete ===`);
}

// ★ v2.85: CHARACTER IDENTITY LOCK — ดึง CHARACTER: block จาก Scene 1 แล้วบังคับใช้ทุกฉาก ★
// AI ถูกสั่งให้เขียน imagePrompt ในรูปแบบ "CHARACTER: ... SCENE: ..."
// ฟังก์ชันนี้จะดึง CHARACTER: block ออกมา เพื่อ copy-paste ลงทุกฉาก
// ★ v3.17: Post-process scene prompts — override art style ตาม character reference analysis ★
function postProcessScenePromptsForStyle(scenes) {
  if (!smCharacterAnalysisResult || !scenes || scenes.length === 0) return scenes;

  const detectedStyle = smCharacterAnalysisResult.visual_style;
  const stylePrompt = smCharacterAnalysisResult.style_prompt || '';
  const charDesc = smCharacterAnalysisResult.character_desc || '';

  if (detectedStyle !== 'photorealistic') return scenes;

  addLog(`🎨 [Style Fix] Override art style → photorealistic (${scenes.length} ฉาก)`, 'info');

  const stripPatterns = [
    /3D animated CGI[^,.;\n]*/gi,
    /3D pixar[^,.;\n]*/gi,
    /pixar[/ ]?disney[^,.;\n]*/gi,
    /disney[/ ]?pixar[^,.;\n]*/gi,
    /3D studio animation[^,.;\n]*/gi,
    /high-end premium 3D studio[^,.;\n]*/gi,
    /next-gen graphics render/gi,
    /expressive cartoon characters[^,.;\n]*/gi,
    /smooth 3D rendering/gi,
    /vibrant saturated colors/gi,
    /cartoon characters with big eyes/gi,
    /next-gen CG quality/gi,
    /3D animated[^,.;\n]*/gi,
    /CGI feature film[^,.;\n]*/gi,
    /3D character[^,.;\n]*/gi,
    /Pixar quality[^,.;\n]*/gi,
    /Disney quality[^,.;\n]*/gi,
    /3D animation style[^,.;\n]*/gi,
    /pixar animation style[^,.;\n]*/gi,
  ];

  function cleanPrompt(prompt) {
    if (!prompt) return prompt;
    let cleaned = prompt;
    for (const pattern of stripPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    cleaned = cleaned.replace(/,\s*,+/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').replace(/\s{2,}/g, ' ').trim();

    if (!cleaned.toLowerCase().includes('photorealistic') && !cleaned.toLowerCase().includes('photography')) {
      cleaned = `${stylePrompt}, ${cleaned}`;
    }
    return cleaned;
  }

  for (const scene of scenes) {
    if (scene.imagePrompt) {
      const original = scene.imagePrompt;
      scene.imagePrompt = cleanPrompt(scene.imagePrompt);
      if (original !== scene.imagePrompt) {
        console.log(`[Style Fix] Scene ${scene.number} imagePrompt cleaned:`, scene.imagePrompt.substring(0, 120));
      }
    }
  }

  return scenes;
}

function extractCharacterBlock(imagePrompt) {
  if (!imagePrompt) return null;
  
  // Strategy 1: หา "CHARACTER:" prefix ตามที่สั่ง AI ไว้
  const charMatch = imagePrompt.match(/CHARACTER:\s*([\s\S]*?)(?:\s*SCENE:|$)/i);
  if (charMatch && charMatch[1] && charMatch[1].trim().length > 15) {
    const extracted = charMatch[1].trim();
    console.log('[CharLock] Extracted CHARACTER: block:', extracted.substring(0, 100));
    return extracted;
  }
  
  // Strategy 2: ถ้า AI ไม่ได้ใช้ "CHARACTER:" prefix → ดึงส่วนแรกของ prompt (ก่อน SCENE:)
  const sceneIdx = imagePrompt.search(/SCENE:/i);
  if (sceneIdx > 20) {
    const beforeScene = imagePrompt.substring(0, sceneIdx).trim();
    if (beforeScene.length > 15) {
      console.log('[CharLock] Extracted text before SCENE:', beforeScene.substring(0, 100));
      return beforeScene;
    }
  }
  
  // Strategy 3: Fallback — ดึงประโยคแรกที่มี character keywords (face/hair/wearing/skin)
  const sentences = imagePrompt.split(/\.\s+/);
  let charSentences = [];
  for (const s of sentences) {
    const st = s.trim();
    if (st.length > 15 && st.match(/\b(?:character|person|woman|man|girl|boy|wearing|hair|skin|face|outfit|dress|shirt|eyes|necklace|earring|3D|animated|CGI|Pixar|cartoon)\b/i)) {
      charSentences.push(st);
    } else if (charSentences.length > 0) {
      break; // หยุดเมื่อเจอประโยคที่ไม่ใช่ character description
    }
  }
  if (charSentences.length > 0) {
    const result = charSentences.join('. ').trim();
    console.log('[CharLock] Extracted character sentences:', result.substring(0, 100));
    return result;
  }
  
  // Strategy 4: ใช้ 250 ตัวอักษรแรก ตัดที่ period/comma สุดท้าย
  const first250 = imagePrompt.substring(0, 250).trim();
  if (first250.length > 20) {
    const lastBreak = Math.max(first250.lastIndexOf('.'), first250.lastIndexOf(','));
    if (lastBreak > 30) {
      console.log('[CharLock] Fallback: first 250 chars truncated');
      return first250.substring(0, lastBreak).trim();
    }
    return first250;
  }
  
  return null;
}

// ★ v2.85: แทนที่ CHARACTER: block ในทุกฉากด้วย locked block จาก Scene 1 ★
// ถ้า prompt มี "CHARACTER: ... SCENE: ..." → แทนที่ส่วน CHARACTER ด้วยของฉาก 1
// ถ้าไม่มี → prepend CHARACTER block ของฉาก 1 ไว้ต้น prompt
function replaceCharacterBlock(imagePrompt, lockedCharBlock) {
  if (!lockedCharBlock || !imagePrompt) return imagePrompt;
  
  // ถ้า prompt มี "CHARACTER:" prefix → แทนที่ทั้ง block (greedy match จนถึง SCENE:)
  const charMatch = imagePrompt.match(/^([\s\S]*?)CHARACTER:\s*([\s\S]*?)(?=\s*(?:SCENE:|SETTING:|BACKGROUND:|ENVIRONMENT:|ACTION:|---|\n\n))/i);
  if (charMatch) {
    const before = charMatch[1] || '';
    const rest = imagePrompt.substring(charMatch[0].length);
    return `${before}CHARACTER: ${lockedCharBlock}\n${rest}`;
  }
  
  // ถ้าไม่มี "CHARACTER:" → prepend ไว้ต้น prompt พร้อม lock instruction
  return `🔒 CHARACTER IDENTITY LOCK (MUST match reference image exactly):\n${lockedCharBlock}\n\n${imagePrompt}`;
}

// เริ่ม Auto Run Storyboard
async function startAutoRunStoryboard() {
  const outputContent = document.getElementById('output-content');
  if (!outputContent || !outputContent.textContent.trim()) {
    showError('กรุณากด Generate ก่อนเพื่อสร้าง Scene Prompts');
    return;
  }
  
  // ★ ใช้ parseScenesToCards เพื่อดึง imagePrompt และ videoPrompt แยกกัน ★
  const parsedData = parseScenesToCards(outputContent.textContent);
  const scenes = parsedData.scenes;
  
  if (scenes.length === 0) {
    showError('ไม่พบ Scene Prompts ใน output กรุณา Generate ใหม่');
    return;
  }

  // ★ v3.17: Post-process — override art style ให้ตรง character reference ★
  postProcessScenePromptsForStyle(scenes);
  
  console.log('[Auto Run] Found', scenes.length, 'scenes with Image+Video prompts:', scenes);
  addLog(`🎬 [Storymode] เริ่ม Pipeline — ${scenes.length} ฉาก`, 'info');
  
  // ★ v2.85: CHARACTER IDENTITY LOCK — ดึง CHARACTER: block จาก Scene 1 แล้วบังคับใช้ทุกฉาก ★
  smCharacterLockDescription = extractCharacterBlock(scenes[0]?.imagePrompt || '');
  if (smCharacterLockDescription) {
    console.log('[Auto Run] CHARACTER LOCK extracted from Scene 1:', smCharacterLockDescription.substring(0, 120));
    addLog(`🔒 [Storymode] Character Lock: "${smCharacterLockDescription.substring(0, 60)}..."`, 'info');
  } else {
    console.log('[Auto Run] WARNING: Could not extract character block from Scene 1');
    addLog(`⚠️ [Storymode] ไม่พบ CHARACTER: block ในฉาก 1 — ตัวละครอาจไม่เหมือนกันทุกฉาก`, 'warning');
  }
  
  // ตั้งค่า state
  autoRunState = {
    isRunning: true,
    isStopped: false,
    currentScene: 0,
    totalScenes: scenes.length,
    scenePrompts: scenes,
    startTime: Date.now(),
    failedScenes: [] // ★ v2.60: reset failed scenes ★
  };
  
  // ★ Set flowType เพื่อป้องกัน Auto Post ทำงานซ้อน ★
  await chrome.storage.local.set({ flowType: 'storymode' });
  
  // ★ Set storyAutoPost flag ถ้าเปิด Auto Post (ให้ content-googleflow.js รู้) ★
  if (smAutoPostEnabled) {
    const topicInput = document.getElementById('topic-input');
    await chrome.storage.local.set({
      storyAutoPost: {
        enabled: true,
        productId: smAutoPostProductId || '',
        caption: topicInput?.value?.trim() || 'Story Mode Video',
        storyNum: 1
      }
    });
    addLog(`🚀 [Storymode] Auto Post เปิด — จะโพส TikTok หลังสร้างเสร็จ`, 'info');
  } else {
    await chrome.storage.local.set({ storyAutoPost: null });
  }
  
  // อัพเดท UI
  const autoRunBtn = document.getElementById('auto-run-btn');
  const stopBtn = document.getElementById('stop-auto-run-btn');
  if (autoRunBtn) autoRunBtn.style.display = 'none';
  if (stopBtn) stopBtn.style.display = 'block';
  
  // ★ Render Pipeline steps list ★
  renderPipelineSteps(scenes);
  
  updateAutoRunProgress(0, scenes.length, '🚀 เริ่มต้น...');
  
  // เปิด Google Flow
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // ถ้าไม่ได้อยู่ Google Flow ให้เปิดใหม่
    if (!tab?.url?.includes('labs.google')) {
      addLog('🌐 [Storymode] กำลังเปิด Google Flow...', 'info');
      await chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow' });
      await new Promise(resolve => setTimeout(resolve, 5000)); // รอ page load
    }
    
    // เริ่ม loop สร้างฉาก
    await runAutoSceneLoop();
    
  } catch (error) {
    console.error('[Auto Run] Error:', error);
    addLog(`❌ [Storymode] เกิดข้อผิดพลาด: ${error.message}`, 'error');
    showError('เกิดข้อผิดพลาด: ' + error.message);
    stopAutoRunStoryboard();
  }
}

// หยุด Auto Run
async function stopAutoRunStoryboard() {
  autoRunState.isRunning = false;
  autoRunState.isStopped = true;
  enableFailedRetryButtons(); // ★ v2.84: เปิดปุ่ม Retry ที่ยังค้างอยู่ ★
  addLog('⏹️ [Storymode] หยุดโดยผู้ใช้', 'warning');
  
  // ★ Clear flowType เพื่อให้ Auto Post ทำงานได้อีกครั้ง ★
  await chrome.storage.local.set({ flowType: null, autoRunSceneStatus: null });
  
  const autoRunBtn = document.getElementById('auto-run-btn');
  const stopBtn = document.getElementById('stop-auto-run-btn');
  if (autoRunBtn) autoRunBtn.style.display = 'block';
  if (stopBtn) stopBtn.style.display = 'none';
  
  updateAutoRunProgress(autoRunState.currentScene, autoRunState.totalScenes, '⏹️ หยุดแล้ว');
}

// ★ Helper: Recover Google Flow tab หลัง crash — reload หรือเปิดใหม่ ★
async function recoverGoogleFlowTab() {
  console.log('[Auto Run] Recovering Google Flow tab...');
  addLog('🔄 [Storymode] กำลัง recover Google Flow tab...', 'warning');
  try {
    // หา Google Flow tab ที่ยังเปิดอยู่
    const flowTabs = await chrome.tabs.query({ url: '*://labs.google/fx/tools/flow*' });
    if (flowTabs.length > 0) {
      const tab = flowTabs[0];
      console.log('[Auto Run] Found existing Google Flow tab, reloading...');
      await chrome.tabs.reload(tab.id);
      await chrome.tabs.update(tab.id, { active: true });
      // ★ รอนานขึ้น 20 วิ — Google Labs โหลดช้า ★
      await new Promise(resolve => setTimeout(resolve, 20000));
      // ★ รอ content script พร้อมจริง — ping สูงสุด 10 ครั้ง ★
      let scriptReady = false;
      for (let ping = 1; ping <= 10; ping++) {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
          console.log('[Auto Run] Content script ready after ping', ping);
          scriptReady = true;
          break;
        } catch (e) {
          console.log(`[Auto Run] Ping ${ping}/10 failed, waiting...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      if (!scriptReady) {
        console.log('[Auto Run] Content script not ready after 10 pings — tab may need fresh open');
        addLog('⚠️ [Storymode] Content script ไม่ตอบ — เปิด tab ใหม่...', 'warning');
      } else {
        addLog('✅ [Storymode] Google Flow tab recovered', 'success');
        return tab;
      }
    }
  } catch (e) {
    console.log('[Auto Run] Error finding/reloading tab:', e);
  }
  
  // ไม่มี tab → เปิดใหม่
  console.log('[Auto Run] Opening new Google Flow tab...');
  // ★ ต้องใช้ URL ที่ match content script pattern: labs.google/fx/tools/flow* ★
  const newTab = await chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow' });
  // ★ รอนานขึ้น 20 วิ + ping content script ★
  await new Promise(resolve => setTimeout(resolve, 20000));
  let scriptReady = false;
  for (let ping = 1; ping <= 10; ping++) {
    try {
      await chrome.tabs.sendMessage(newTab.id, { action: 'ping' });
      console.log('[Auto Run] Content script ready after ping', ping);
      scriptReady = true;
      break;
    } catch (e) {
      console.log(`[Auto Run] Ping ${ping}/10 failed, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  if (!scriptReady) {
    addLog('⚠️ [Storymode] Content script ไม่ตอบหลังเปิด tab ใหม่', 'warning');
  }
  addLog('✅ [Storymode] Google Flow tab opened', 'success');
  return newTab;
}

// Loop สร้างฉากต่อเนื่อง — ★ ทีละฉาก: Image → Video ★
// ★ v2.46: PERSISTENT RETRY — ไม่ข้ามฉาก ไม่หยุดกลางทาง — retry จนกว่าจะผ่านทุกฉาก ★
// เหตุผล: ฉากต้องต่อกัน ถ้าฉากไหนหลุดไป วิดีโอทั้งหมดก็ใช้ไม่ได้
async function runAutoSceneLoop() {
  const MAX_RETRIES_PER_STEP = 3; // retry สูงสุด 3 ครั้งต่อ step → ถ้าไม่ผ่าน ข้ามฉาก
  
  for (let i = 0; i < autoRunState.scenePrompts.length; i++) {
    if (autoRunState.isStopped) break;
    
    const scene = autoRunState.scenePrompts[i];
    autoRunState.currentScene = i + 1;
    addLog(`🎬 [Storymode] เริ่มฉากที่ ${i + 1}/${autoRunState.totalScenes}`, 'info');
    
    // ★ ดึง imagePrompt และ videoPrompt แยกกัน ★
    let imagePrompt = scene.imagePrompt || '';
    let videoPrompt = scene.videoPrompt || '';
    
    // ★ Fallback: ถ้า imagePrompt ว่าง ให้ใช้ scene.prompt (raw content) ★
    if (!imagePrompt && scene.prompt) {
      imagePrompt = scene.prompt;
      console.log(`[Auto Run] Scene ${i + 1}: Using fallback imagePrompt (raw content)`);
    }
    
    // ★ Fallback: ถ้า videoPrompt ว่าง ให้ใช้ scene.prompt (raw content) ★
    if (!videoPrompt && scene.prompt) {
      videoPrompt = scene.prompt;
      console.log(`[Auto Run] Scene ${i + 1}: Using fallback videoPrompt (raw content)`);
    }
    
    // ★ ถ้าผู้ใช้แก้ไข dialogue → แทนที่ dialogue เดิมใน videoPrompt ★
    if (scene.dialogue && videoPrompt) {
      videoPrompt = replaceDialogueInVideoPrompt(videoPrompt, scene.dialogue);
      console.log(`[Auto Run] Scene ${i + 1}: Applied user-edited dialogue`);
    }
    
    console.log(`[Auto Run] Scene ${i + 1}:`, { 
      imagePrompt: imagePrompt?.substring(0, 80) || 'EMPTY', 
      videoPrompt: videoPrompt?.substring(0, 80) || 'EMPTY',
      hasImagePrompt: !!imagePrompt,
      hasVideoPrompt: !!videoPrompt
    });
    
    // ★ Helper: เช็ค + recover tab ก่อนทำงาน ★
    const ensureTab = async () => {
      let tab;
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        tab = tabs[0];
        if (!tab?.url?.includes('labs.google')) {
          updateAutoRunProgress(i + 1, autoRunState.totalScenes, `⚠️ Google Flow tab หายไป — รอ reload...`);
          const flowTabs = await chrome.tabs.query({ url: '*://labs.google/*' });
          if (flowTabs.length > 0) {
            tab = flowTabs[0];
            await chrome.tabs.update(tab.id, { active: true });
            await new Promise(resolve => setTimeout(resolve, 5000));
          } else {
            const newTab = await chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow' });
            tab = newTab;
            await new Promise(resolve => setTimeout(resolve, 8000));
          }
        }
      } catch (tabErr) {
        console.error(`[Auto Run] Tab query error:`, tabErr);
        updateAutoRunProgress(i + 1, autoRunState.totalScenes, `⚠️ Tab error — รอ recover...`);
        tab = await recoverGoogleFlowTab();
      }
      return tab;
    };
    
    let tab = await ensureTab();
    
    // ★ Clear stale status ก่อนเริ่มฉากใหม่ ★
    await chrome.storage.local.set({ autoRunSceneStatus: null, flowStatus: null, flowMessage: null });
      
    // === STEP 1: สร้าง Image — ★ PERSISTENT RETRY จนกว่าจะผ่าน ★ ===
    let imageSuccess = false;
    const skipImage = !imagePrompt && videoPrompt;
    if (skipImage) {
      imageSuccess = true;
      addLog(`🎬 [Storymode] ฉาก ${i + 1}: Video-Only mode — ข้าม Image`, 'info');
    }
    if (imagePrompt) {
      for (let imgAttempt = 0; imgAttempt < MAX_RETRIES_PER_STEP; imgAttempt++) {
        if (autoRunState.isStopped) break;
        
        // ★ Retry delay: รอ 5 วิ ก่อน retry (ไม่ re-upload, ไม่กด New Project) ★
        if (imgAttempt > 0) {
          const retryDelay = 5000;
          updateAutoRunProgress(i + 1, autoRunState.totalScenes, `🔄 ฉาก ${i + 1}: Retry Image... (${imgAttempt + 1}/${MAX_RETRIES_PER_STEP})`);
          addLog(`🔄 [Storymode] ฉาก ${i + 1}: Retry Image ครั้งที่ ${imgAttempt + 1}/${MAX_RETRIES_PER_STEP}...`, 'warning');
          await chrome.storage.local.set({ autoRunSceneStatus: null, flowStatus: null, flowMessage: null });
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          tab = await ensureTab();
        } else {
          updateAutoRunProgress(i + 1, autoRunState.totalScenes, `🖼️ ฉาก ${i + 1}: กำลังสร้าง Image...`);
          addLog(`🖼️ [Storymode] ฉาก ${i + 1}: กำลังสร้าง Image...`, 'info');
        }
        
        try {
          // ★ Log ref images status (เฉพาะ attempt แรก) — รวม per-scene product control ★
          if (imgAttempt === 0) {
            const _scCtrl = smSceneProductControl.find(c => c.sceneNumber === (i + 1));
            const _showProd = _scCtrl ? _scCtrl.showProduct : true;
            const _showDlg = _scCtrl ? _scCtrl.showProductDialogue : true;
            
            if (smProductImage && _showProd && smCharacterImage) {
              addLog(`📷 [Storymode] ฉาก ${i + 1}: แนบ ref สินค้า + ตัวละคร`, 'info');
            } else if (smProductImage && _showProd) {
              addLog(`📷 [Storymode] ฉาก ${i + 1}: แนบ ref สินค้า`, 'info');
            } else if (smCharacterImage) {
              addLog(`📷 [Storymode] ฉาก ${i + 1}: แนบ ref ตัวละคร${smProductImage && !_showProd ? ' (ไม่ใส่สินค้า)' : ''}`, 'info');
            } else if (smProductImage && !_showProd) {
              addLog(`📷 [Storymode] ฉาก ${i + 1}: ไม่แนบรูปสินค้า (ตาม checkbox)`, 'info');
            }
          }
          
          // ★ เช็ค per-scene product control ★
          const sceneCtrl = smSceneProductControl.find(c => c.sceneNumber === (i + 1));
          const sceneShowProduct = sceneCtrl ? sceneCtrl.showProduct : true;
          const sceneProductImg = sceneShowProduct ? (smProductImage || null) : null;
          
          // ★ v3.17: Compact scene metadata + ART STYLE FIX ★
          let finalImagePrompt = imagePrompt;

          // ★ v3.17: Style override — ลบ style ที่ขัดกับ reference แล้วแทนด้วย style ที่ถูกต้อง ★
          if (smCharacterAnalysisResult && smCharacterAnalysisResult.visual_style === 'photorealistic') {
            finalImagePrompt = finalImagePrompt
              .replace(/3D animated CGI[^,.]*/gi, '')
              .replace(/3D pixar[^,.]*/gi, '')
              .replace(/pixar[/ ]?disney[^,.]*/gi, '')
              .replace(/3D studio animation[^,.]*/gi, '')
              .replace(/next-gen graphics render/gi, '')
              .replace(/expressive cartoon characters[^,.]*/gi, '')
              .replace(/smooth 3D rendering/gi, '')
              .replace(/,\s*,/g, ',')
              .replace(/^[\s,]+/, '')
              .trim();
            if (!finalImagePrompt.toLowerCase().includes('photorealistic') && !finalImagePrompt.toLowerCase().includes('photography')) {
              finalImagePrompt = `${smCharacterAnalysisResult.style_prompt}, ${finalImagePrompt}`;
            }
          }

          if (smCharacterLockDescription && i > 0) {
            finalImagePrompt = replaceCharacterBlock(finalImagePrompt, smCharacterLockDescription);
          }
          
          const totalScenes = autoRunState.totalScenes;
          const sceneRole = i === 0 ? 'OPENING' : (i === totalScenes - 1 ? 'FINAL' : 'MIDDLE');
          let metaBlock = '';
          
          if (totalScenes > 1) {
            metaBlock += `\nScene ${i + 1}/${totalScenes} (${sceneRole}). Same character across all scenes.`;
          }
          if (sceneProductImg && smCharacterImage) {
            metaBlock += `\nRef images: 1st=PRODUCT (copy exact), 2nd=CHARACTER (same person every scene).`;
          } else if (sceneProductImg) {
            metaBlock += `\nRef image = PRODUCT. Copy exact product.`;
          } else if (smCharacterImage) {
            metaBlock += `\nRef image = CHARACTER. Same person every scene.`;
          }
          if (!sceneShowProduct && smProductImage) {
            metaBlock += `\nNo product in this scene — story/character only.`;
            addLog(`📦 [Storymode] ฉาก ${i + 1}: ไม่ใส่รูปสินค้า (ตาม checkbox)`, 'info');
          }
          metaBlock += `\nSingle continuous image, no split-screen, no collage, no multi-panel, no side-by-side, no before/after.`;
          if (metaBlock) finalImagePrompt += `\n${metaBlock}`;
          
          // ★ v3.16: sanitize + v3.23: pre-flight policy screen ★
          finalImagePrompt = preFlightPolicyScreen(sanitizeVideoPrompt(finalImagePrompt));
          
          await chrome.tabs.sendMessage(tab.id, {
            action: 'createSceneImage',
            imagePrompt: finalImagePrompt,
            sceneNumber: i + 1,
            isFirstScene: (i === 0 && imgAttempt === 0),
            isRetry: imgAttempt > 0,
            productImage: sceneProductImg,
            characterImage: smCharacterImage || null
          });
          
          await waitForSceneStep(i + 1, 'image');
          updateAutoRunProgress(i + 1, autoRunState.totalScenes, `✅ ฉาก ${i + 1}: Image เสร็จแล้ว`);
          addLog(`✅ [Storymode] ฉาก ${i + 1}: Image สำเร็จ${imgAttempt > 0 ? ` (retry ${imgAttempt + 1})` : ''}`, 'success');
          imageSuccess = true;
          break; // สำเร็จ → ออกจาก retry loop
        } catch (imgError) {
          console.error(`[Auto Run] Scene ${i + 1} IMAGE error (attempt ${imgAttempt + 1}/${MAX_RETRIES_PER_STEP}):`, imgError);
          const errMsg = imgError.message || '';
          
          // ★ ถ้า user กดหยุด → ออกเลย ★
          if (errMsg.includes('Stopped') || autoRunState.isStopped) {
            addLog(`⏹️ [Storymode] ฉาก ${i + 1}: หยุดโดยผู้ใช้`, 'warning');
            break;
          }
          
          // ★ Crash recovery: reload tab เฉพาะกรณี page ล่ม ★
          if (errMsg.includes('crashed') || errMsg.includes('crash') || errMsg.includes('navigated') || errMsg.includes('closed')) {
            addLog(`❌ [Storymode] ฉาก ${i + 1}: Google labs ล่ม — recover...`, 'error');
            tab = await recoverGoogleFlowTab();
          } else {
            addLog(`⚠️ [Storymode] ฉาก ${i + 1}: Image ล้มเหลว — ${errMsg.substring(0, 80)}`, 'warning');
          }
        }
      }
    }
    
    // === STEP 2: สร้าง Video — ★ PERSISTENT RETRY จนกว่าจะผ่าน ★ ===
    console.log(`[Auto Run] Scene ${i + 1} VIDEO CHECK: videoPrompt=${!!videoPrompt} (${videoPrompt?.length || 0} chars), imageSuccess=${imageSuccess}`);
    if (!videoPrompt) {
      addLog(`⚠️ [Storymode] ฉาก ${i + 1}: ข้าม Video เพราะไม่มี videoPrompt!`, 'warning');
    }
    if (videoPrompt && imageSuccess) {
      let videoSuccess = false;
      for (let vidAttempt = 0; vidAttempt < MAX_RETRIES_PER_STEP; vidAttempt++) {
        if (autoRunState.isStopped) break;
        
        try {
          if (vidAttempt > 0) {
            const retryDelay = 5000;
            updateAutoRunProgress(i + 1, autoRunState.totalScenes, `🔄 ฉาก ${i + 1}: Retry Video... (${vidAttempt + 1}/${MAX_RETRIES_PER_STEP})`);
            addLog(`🔄 [Storymode] ฉาก ${i + 1}: Retry Video ครั้งที่ ${vidAttempt + 1}/${MAX_RETRIES_PER_STEP}...`, 'warning');
            await chrome.storage.local.set({ autoRunSceneStatus: null, flowStatus: null, flowMessage: null });
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            tab = await ensureTab();
          } else {
            await new Promise(resolve => setTimeout(resolve, 5000));
            updateAutoRunProgress(i + 1, autoRunState.totalScenes, `🎬 ฉาก ${i + 1}: กำลังสร้าง Video...`);
            addLog(`🎬 [Storymode] ฉาก ${i + 1}: กำลังสร้าง Video...`, 'info');
          }
          
          // ★ v3.16: Compact video metadata — รวมทุก block เป็นประโยคเดียว ★
          let finalVideoPrompt = videoPrompt;
          const vidSceneCtrl = smSceneProductControl.find(c => c.sceneNumber === (i + 1));
          if (vidSceneCtrl && !vidSceneCtrl.showProductDialogue && smProductImage) {
            finalVideoPrompt += `\nNo product mention in this scene — focus on story/emotion.`;
            addLog(`💬 [Storymode] ฉาก ${i + 1}: ไม่ใส่บทพูดสินค้า (ตาม checkbox)`, 'info');
          }
          
          const vidTotalScenes = autoRunState.totalScenes;
          if (vidTotalScenes > 1) {
            const vidRole = i === 0 ? 'OPENING' : (i === vidTotalScenes - 1 ? 'FINAL' : 'MIDDLE');
            finalVideoPrompt += `\nScene ${i + 1}/${vidTotalScenes} (${vidRole}). Same character, continuous story.`;
            if (smCharacterLockDescription) {
              finalVideoPrompt += `\nCharacter: ${smCharacterLockDescription.substring(0, 500)}`;
            }
          }
          
          // ★ FIX: Reset pipeline lock ก่อนส่ง createSceneVideo — ป้องกัน stale lock จาก image step ★
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'resetPipelineLock' });
          } catch (resetErr) {
            console.log(`[Auto Run] resetPipelineLock failed (tab may have reloaded):`, resetErr.message);
          }
          
          // ★ v3.16: sanitize video prompt ก่อนส่ง ★
          finalVideoPrompt = sanitizeVideoPrompt(finalVideoPrompt);
          
          // ★ v3.20: เพิ่ม safe audio block — soft ambient OK, ห้ามแค่คำรุนแรง ★
          if (!finalVideoPrompt.includes('AUDIO /') && !finalVideoPrompt.includes('audio_mode')) {
            const smDialogue = scene.dialogue || '';
            // ★ v3.23: Scene-aware continuity — Scene 1 vs Scene 2+ different rules ★
            const sceneNum = i + 1;
            const isFirstScene = sceneNum === 1;
            const textOverlayRule = isFirstScene
              ? '- Scene 1: H1/H2 text overlay allowed. Text must be static, sharp, no morphing/bouncing/sliding.'
              : `- Scene ${sceneNum}: STRICT no text, no typography, no words, no letters, no subtitles, no captions, no on-screen text.`;
            const continuityLevel = isFirstScene
              ? '- Establish character look, product appearance, and environment baseline for all subsequent scenes.'
              : `- MUST match Scene 1 exactly: same character face/hair/outfit, same product, same environment style.\n- New action/expression only — do NOT re-describe character from scratch.`;
            const safeAudioBlock = `\n\nAUDIO / SPEECH (CRITICAL):
- LANGUAGE: Thai only. DO NOT speak English.
- Voice: Clear Thai pronunciation, natural tone, native Thai speaker.
- Style: Engaging, natural speaking pace.${smDialogue ? `\n- Dialogue: "${smDialogue}"` : ''}
- Background: Soft gentle ambient music or melody is allowed. Keep it subtle and non-distracting.
- Do NOT use: loud sound effects, bass drops, screaming, horror sounds, ASMR whispers, heartbeat sounds, healing frequency, SFX.

SCENE-AWARE CONTINUITY (Scene ${sceneNum}):
- Product is a prop — character is the main subject.
- Product must match reference image exactly (color, shape, label text 100%).
${textOverlayRule}
${continuityLevel}
- No ghost, no apparition, no paranormal entity.
- Human anatomy: 1 head, 2 arms, 2 hands (5 fingers each), 2 legs. No extra limbs.`;
            finalVideoPrompt += safeAudioBlock;
          }
          
          // ★ v3.23: pre-flight policy screen ก่อนส่ง ★
          finalVideoPrompt = preFlightPolicyScreen(finalVideoPrompt);
          
          const vidResponse = await chrome.tabs.sendMessage(tab.id, {
            action: 'createSceneVideo',
            videoPrompt: finalVideoPrompt,
            sceneNumber: i + 1,
            isRetry: vidAttempt > 0
          });
          
          if (vidResponse && vidResponse.success === false) {
            throw new Error(`Content script rejected createSceneVideo: ${vidResponse.reason || 'unknown'}`);
          }
          
          await waitForSceneStep(i + 1, 'video');
          updateAutoRunProgress(i + 1, autoRunState.totalScenes, `✅ ฉาก ${i + 1}: Video เสร็จแล้ว`);
          addLog(`✅ [Storymode] ฉาก ${i + 1}: Video สำเร็จ${vidAttempt > 0 ? ` (retry ${vidAttempt + 1})` : ''}`, 'success');
          videoSuccess = true;
          break;
        } catch (vidError) {
          console.error(`[Auto Run] Scene ${i + 1} VIDEO error (attempt ${vidAttempt + 1}/${MAX_RETRIES_PER_STEP}):`, vidError);
          const vidErrMsg = vidError.message || '';
          
          if (vidErrMsg.includes('Stopped') || autoRunState.isStopped) {
            addLog(`⏹️ [Storymode] ฉาก ${i + 1}: หยุดโดยผู้ใช้`, 'warning');
            break;
          }
          
          if (vidErrMsg.includes('crashed') || vidErrMsg.includes('crash') || vidErrMsg.includes('navigated') || vidErrMsg.includes('closed')) {
            addLog(`❌ [Storymode] ฉาก ${i + 1}: Google labs ล่มตอน Video — recover + retry...`, 'error');
            tab = await recoverGoogleFlowTab();
          } else {
            addLog(`⚠️ [Storymode] ฉาก ${i + 1}: Video ล้มเหลว — ${vidErrMsg.substring(0, 80)}`, 'warning');
          }
          
          if (vidAttempt === MAX_RETRIES_PER_STEP - 1) {
            addLog(`❌ [Storymode] ฉาก ${i + 1}: Video ล้มเหลว ${MAX_RETRIES_PER_STEP} ครั้ง — ข้ามฉากนี้`, 'error');
          }
        }
      }
      
      if (!videoSuccess && !autoRunState.isStopped) {
        // ★ Video ไม่ผ่านจริงๆ หลัง retry หมด — ยังคงไปฉากถัดไป (เพราะ Image ผ่านแล้ว) ★
        updateAutoRunProgress(i + 1, autoRunState.totalScenes, `⚠️ ฉาก ${i + 1}: Video ไม่สำเร็จ — ไปฉากถัดไป`);
        addLog(`⚠️ [Storymode] ฉาก ${i + 1}: Video ไม่สำเร็จหลัง ${MAX_RETRIES_PER_STEP} ครั้ง`, 'error');
        // ★ v2.60: Track failed scene (video failed) ★
        if (!autoRunState.failedScenes.includes(i + 1)) {
          autoRunState.failedScenes.push(i + 1);
        }
      }
    } else if (videoPrompt && !imageSuccess && !autoRunState.isStopped) {
      // ★ Image ไม่ผ่านแม้ retry หมด → ยังคงไม่ข้าม Video — ลอง Video ด้วย ★
      addLog(`⚠️ [Storymode] ฉาก ${i + 1}: Image ไม่สำเร็จหลัง ${MAX_RETRIES_PER_STEP} ครั้ง — ข้าม Video ฉากนี้`, 'error');
      updateAutoRunProgress(i + 1, autoRunState.totalScenes, `⚠️ ฉาก ${i + 1}: Image ไม่สำเร็จ — ข้าม Video`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // ★ สรุปสถานะฉากนี้ ★
    if (imageSuccess) {
      updateAutoRunProgress(i + 1, autoRunState.totalScenes, `✅ ฉากที่ ${i + 1} เสร็จครบแล้ว!`);
      addLog(`✅ [Storymode] ฉากที่ ${i + 1}/${autoRunState.totalScenes} เสร็จครบ!`, 'success');
    } else {
      updateAutoRunProgress(i + 1, autoRunState.totalScenes, `⚠️ ฉากที่ ${i + 1}: ไม่สำเร็จหลัง retry ${MAX_RETRIES_PER_STEP} ครั้ง`);
      // ★ v2.60: Track failed scene for per-scene retry ★
      if (!autoRunState.failedScenes.includes(i + 1)) {
        autoRunState.failedScenes.push(i + 1);
      }
    }
    
    // ★ ไม่มี consecutive fail stop แล้ว — ข้ามไปฉากถัดไปเสมอ ★
    
    // รอก่อนทำฉากถัดไป (3 วิ เพื่อความเร็ว)
    if (i < autoRunState.scenePrompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // เสร็จสิ้น
  if (!autoRunState.isStopped) {
    updateAutoRunProgress(autoRunState.totalScenes, autoRunState.totalScenes, '🎉 สร้างครบทุกฉากแล้ว!');
    addLog(`🎉 [Storymode] สร้างครบทุกฉากแล้ว! (${autoRunState.totalScenes} ฉาก)`, 'success');
    console.log('[Auto Run] All scenes completed, opening SceneBuilder...');
    
    // ★ เปิด SceneBuilder และ Download ★
    try {
      // Query tab ใหม่เพื่อให้แน่ใจว่า tab.id ถูกต้อง
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('[Auto Run] Sending openSceneBuilderAndDownload to tab:', currentTab?.id);
      
      updateAutoRunProgress(autoRunState.totalScenes, autoRunState.totalScenes, '🎬 กำลังเปิด SceneBuilder...');
      addLog('🎬 [Storymode] กำลังเปิด SceneBuilder + Export...', 'info');
      
      // รอ 2 วินาทีก่อนเรียก SceneBuilder
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await chrome.tabs.sendMessage(currentTab.id, { action: 'openSceneBuilderAndDownload' });
      
      // รอ SceneBuilder + Export + Download เสร็จ (สูงสุด 180 วินาที)
      const maxWaitSec = 180;
      for (let sec = 0; sec < maxWaitSec; sec++) {
        if (autoRunState.isStopped) break;
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // ★ ตรวจสอบว่า content script ส่ง status มาหรือยัง ★
        const result = await chrome.storage.local.get(['pipelineCompleted']);
        if (result.pipelineCompleted) {
          console.log('[Auto Run] Pipeline completed signal received!');
          await chrome.storage.local.set({ pipelineCompleted: false });
          break;
        }
        
        if (sec < 10) {
          updateAutoRunProgress(autoRunState.totalScenes, autoRunState.totalScenes, `🎬 กำลังเปิด SceneBuilder... ${sec} วิ`);
        } else if (sec < 30) {
          updateAutoRunProgress(autoRunState.totalScenes, autoRunState.totalScenes, `📥 กำลัง Export... ${sec} วิ`);
        } else {
          updateAutoRunProgress(autoRunState.totalScenes, autoRunState.totalScenes, `⏳ รอ Download... ${sec} วิ`);
        }
      }
      
      // ★ แสดงข้อความเสร็จสิ้น ★
      updateAutoRunProgress(autoRunState.totalScenes, autoRunState.totalScenes, '🎉✅ Pipeline เสร็จสิ้น! ครบทุกฉากแล้ว!');
      addLog('🎉✅ [Storymode] Pipeline เสร็จสิ้น! ครบทุกฉาก + Export แล้ว!', 'success');
    } catch (e) {
      console.log('[Auto Run] SceneBuilder/Download error:', e);
      updateAutoRunProgress(autoRunState.totalScenes, autoRunState.totalScenes, '⚠️ SceneBuilder error - แต่สร้างฉากครบแล้ว');
      addLog('⚠️ [Storymode] SceneBuilder error — แต่สร้างฉากครบแล้ว', 'warning');
    }
    
    // ★ แสดง completion ก่อนหยุด — ไม่ให้ stopAutoRunStoryboard ทับข้อความ ★
    autoRunState.isRunning = false;
    enableFailedRetryButtons(); // ★ v2.84: เปิดปุ่ม Retry ที่ยังค้างอยู่ ★
    // ไม่ set isStopped = true เพราะไม่ใช่ user กดหยุด
    await chrome.storage.local.set({ flowType: null, autoRunSceneStatus: null });
    
    const autoRunBtn = document.getElementById('auto-run-btn');
    const stopBtn = document.getElementById('stop-auto-run-btn');
    if (autoRunBtn) autoRunBtn.style.display = 'block';
    if (stopBtn) stopBtn.style.display = 'none';
    
    // ★ v2.84: แสดง retry buttons สำหรับฉากที่ล้มเหลว (enableFailedRetryButtons ถูกเรียกด้านบนแล้ว) ★
    if (autoRunState.failedScenes.length > 0) {
      addLog(`⚠️ [Storymode] มี ${autoRunState.failedScenes.length} ฉากล้มเหลว — กดปุ่ม 🔄 Retry ที่ฉากนั้นเพื่อลองใหม่`, 'warning');
    }
    
    console.log('[Auto Run] === PIPELINE COMPLETED SUCCESSFULLY ===');
    return; // ★ return ก่อน stopAutoRunStoryboard เพื่อไม่ให้ทับข้อความ ★
  }
  
  stopAutoRunStoryboard();
}

// รอ step (image หรือ video) ของฉากเสร็จ
// ★ ปรับปรุง: poll เร็วขึ้น, log น้อยลง, เช็ค stale status, เช็ค tab crash ★
async function waitForSceneStep(sceneNumber, stepType) {
  const maxWaitMs = stepType === 'video' ? 600000 : 480000; // video 10 นาที, image 8 นาที
  const pollIntervalMs = 1500; // ★ poll เร็วขึ้นจาก 2000 → 1500 ★
  const startTime = Date.now();
  let lastLogTime = 0;
  let noChangeCount = 0; // ★ นับจำนวนรอบที่ status ไม่เปลี่ยน ★
  let lastStatusJson = '';
  
  console.log(`[Auto Run] Waiting for scene ${sceneNumber} ${stepType}...`);
  
  while (Date.now() - startTime < maxWaitMs) {
    if (autoRunState.isStopped) throw new Error('Stopped by user');
    
    const result = await chrome.storage.local.get(['autoRunSceneStatus', 'flowStatus', 'flowMessage']);
    const status = result.autoRunSceneStatus;
    
    // ★ เช็ค flow_error เพื่อข้ามทันทีไม่ต้องรอ timeout ★
    if (result.flowStatus === 'flow_error') {
      const errMsg = result.flowMessage || 'Unknown error';
      console.log(`[Auto Run] Scene ${sceneNumber} ${stepType} — flow_error: ${errMsg}`);
      addLog(`❌ [Storymode] ฉาก ${sceneNumber} ${stepType}: ${errMsg}`, 'error');
      await chrome.storage.local.set({ autoRunSceneStatus: null, flowStatus: null, flowMessage: null });
      throw new Error(`Scene ${sceneNumber} ${stepType} failed — ${errMsg}`);
    }
    
    // ★ Log ทุก 15 วินาที แทนทุก poll (ลด console spam) ★
    const now = Date.now();
    if (now - lastLogTime > 15000) {
      const elapsed = Math.round((now - startTime) / 1000);
      console.log(`[Auto Run] Waiting scene ${sceneNumber} ${stepType}... ${elapsed}s elapsed`, status);
      lastLogTime = now;
    }
    
    // ★ เช็ค completed ★
    if (status?.sceneNumber === sceneNumber && status?.step === stepType && status?.completed) {
      console.log(`[Auto Run] Scene ${sceneNumber} ${stepType} completed!`);
      addLog(`✅ [Storymode] ฉาก ${sceneNumber} ${stepType} เสร็จสมบูรณ์!`, 'success');
      await chrome.storage.local.set({ autoRunSceneStatus: null });
      return;
    }
    
    // ★ Stale detection: ถ้า status ไม่เปลี่ยนเลย → อาจ hang → throw error ★
    // ★ FIX: image generate อาจใช้เวลา 3-5 นาที (upload+generate+retry) → stale ต้องนานพอ ★
    const staleThresholdPolls = stepType === 'video' ? 160 : 200; // video = 240s (160×1.5s), image = 300s (200×1.5s = 5 นาที)
    const currentJson = JSON.stringify(status);
    if (currentJson === lastStatusJson) {
      noChangeCount++;
    } else {
      noChangeCount = 0;
      lastStatusJson = currentJson;
    }
    if (noChangeCount >= staleThresholdPolls) {
      const staleSec = Math.round(noChangeCount * pollIntervalMs / 1000);
      console.log(`[Auto Run] Scene ${sceneNumber} ${stepType} — STALE: no status change for ${staleSec}s`);
      addLog(`⚠️ [Storymode] ฉาก ${sceneNumber} ${stepType}: ไม่ตอบสนอง ${staleSec} วิ — content script อาจ crash`, 'warning');
      await chrome.storage.local.set({ autoRunSceneStatus: null, flowStatus: null });
      throw new Error(`Scene ${sceneNumber} ${stepType} stale — content script may have crashed`);
    }
    
    // ★ เช็ค tab ยัง alive ไหม (ทุก 30 วิ) ★
    if (now - lastLogTime < 2000 && noChangeCount > 0 && noChangeCount % 20 === 0) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url?.includes('labs.google')) {
          console.log(`[Auto Run] Scene ${sceneNumber} ${stepType} — tab navigated away!`);
          await chrome.storage.local.set({ autoRunSceneStatus: null, flowStatus: null });
          throw new Error(`Scene ${sceneNumber} ${stepType} — Google Flow tab closed/navigated`);
        }
      } catch (tabErr) {
        // Tab query failed — might be a crash
        if (tabErr.message?.includes('navigated') || tabErr.message?.includes('closed')) throw tabErr;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  throw new Error(`Scene ${sceneNumber} ${stepType} timeout after ${maxWaitMs / 1000}s`);
}

// รอ scene เสร็จ
async function waitForSceneComplete(sceneNumber) {
  const maxWaitMs = 300000; // 5 นาที (รองรับเน็ตช้า/คอมช้า)
  const pollIntervalMs = 3000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    if (autoRunState.isStopped) throw new Error('Stopped by user');
    
    // เช็ค status จาก storage
    const result = await chrome.storage.local.get(['autoRunSceneStatus', 'flowStatus']);
    const status = result.autoRunSceneStatus;
    
    // ★ เช็ค flow_error เพื่อข้ามทันทีไม่ต้องรอ timeout ★
    if (result.flowStatus === 'flow_error') {
      console.log(`[Auto Run] Scene ${sceneNumber} — flow_error detected! Skipping immediately`);
      await chrome.storage.local.set({ autoRunSceneStatus: null, flowStatus: null });
      throw new Error(`Scene ${sceneNumber} failed — Google Flow error`);
    }
    
    if (status?.sceneNumber === sceneNumber && status?.completed) {
      // Reset status
      await chrome.storage.local.set({ autoRunSceneStatus: null });
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  throw new Error(`Scene ${sceneNumber} timeout`);
}

// Toggle between raw output and scene cards view
let isCardView = false;

function toggleSceneCardsView() {
  const outputContent = document.getElementById('output-content');
  const sceneCardsContainer = document.getElementById('scene-cards-container');
  const toggleBtn = document.getElementById('toggle-view-btn');
  
  isCardView = !isCardView;
  
  if (isCardView) {
    // Parse and show scene cards
    const rawOutput = outputContent.textContent;
    const parsedScenes = parseScenesToCards(rawOutput);
    // ★ v3.17: Post-process style ★
    if (parsedScenes.scenes) postProcessScenePromptsForStyle(parsedScenes.scenes);
    renderSceneCards(parsedScenes);
    
    outputContent.style.display = 'none';
    sceneCardsContainer.style.display = 'flex';
    toggleBtn.innerHTML = '<span>📄</span> ดูแบบ Raw';
  } else {
    outputContent.style.display = 'block';
    sceneCardsContainer.style.display = 'none';
    toggleBtn.innerHTML = '<span>🎴</span> ดูแบบการ์ด';
  }
}

// Parse raw output into scene objects
// ★ v3.23: Caption Repair System — auto-fix overclaim, disclaimer, hashtag count ★
function repairViralCaption(caption, hashtags) {
  const warnings = [];
  let text = (caption || '').trim();

  // 1. ลบคำ overclaim ออกจาก caption
  const overclaimWords = [
    'การันตี', '100%', 'เห็นผลทันที', 'ได้ผลทุกคน', 'หายขาด',
    'รักษาโรค', 'FDA', 'อย.', 'Medical Grade', 'Clinical Proven',
    'ดีที่สุด', 'No.1', 'Certified', 'Guaranteed',
    'ขาวทันที', 'หน้าใสทันที', 'ยกกระชับทันที', 'ลดจริง',
    'แทนโบท็อกซ์', 'แพทย์รับรอง', 'หมอรับรอง', 'ไม่ต้องศัลยกรรม'
  ];
  for (const word of overclaimWords) {
    if (text.includes(word)) {
      text = text.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      warnings.push(`ลบคำ overclaim: "${word}"`);
    }
  }
  text = text.replace(/\s{2,}/g, ' ').trim();

  // 2. ตรวจ hashtags — ต้อง 4 ตัว
  let fixedHashtags = [...(hashtags || [])];
  if (fixedHashtags.length < 4) {
    warnings.push(`Hashtag มีแค่ ${fixedHashtags.length} ตัว (แนะนำ 4)`);
  }
  if (fixedHashtags.length > 6) {
    fixedHashtags = fixedHashtags.slice(0, 4);
    warnings.push('ตัด hashtag เหลือ 4 ตัว');
  }

  // 3. เพิ่ม disclaimer อัตโนมัติ (สินค้าสุขภาพ/บิวตี้)
  let disclaimer = '';
  const healthKeywords = ['ผิว', 'สิว', 'เซรั่ม', 'ครีม', 'คอลลาเจน', 'อาหารเสริม', 'วิตามิน',
    'สุขภาพ', 'ลดน้ำหนัก', 'ผอม', 'ขาว', 'กระจ่างใส', 'ริ้วรอย', 'เส้นผม',
    'แชมพู', 'บำรุง', 'ดูแลผิว', 'สกินแคร์', 'ลิป', 'กันแดด', 'มาส์ก'];
  const needsDisclaimer = healthKeywords.some(kw => text.includes(kw));
  if (needsDisclaimer) {
    disclaimer = 'ผลลัพธ์ขึ้นอยู่กับสภาพผิว/ร่างกายของแต่ละบุคคล';
  }

  return { text, hashtags: fixedHashtags, disclaimer, warnings };
}

function parseScenesToCards(rawOutput) {
  const scenes = [];
  
  // Debug: log first 500 chars of raw output
  console.log('Raw output preview:', rawOutput.substring(0, 500));
  
  // Find viral caption — รองรับหลาย format: 📝 VIRAL CAPTION, 📱 แคปชั่น, 📱 Viral Caption
  let viralCaption = '';
  let hashtags = [];
  
  // Strategy 1: 📝 VIRAL CAPTION "..."
  const captionMatch1 = rawOutput.match(/📝\s*VIRAL\s*CAPTION[^"]*"([^"]+)"/i);
  // Strategy 2: 📱 แคปชั่นสำหรับโพสต์ ... (หาข้อความหลัง header จนถึง hashtags)
  const captionMatch2 = rawOutput.match(/📱\s*(?:แคปชั่น[^\n]*|Viral\s*Caption[^\n]*)\n+([\s\S]*?)(?=\n\s*#|\n\s*$)/i);
  // Strategy 3: หาจาก section header แล้วเอาบรรทัดถัดไป
  const captionMatch3 = rawOutput.match(/(?:📱|📝)\s*(?:แคปชั่น|Viral\s*Caption|VIRAL\s*CAPTION)[^\n]*\n+([^\n#]+)/i);
  
  if (captionMatch1) {
    viralCaption = captionMatch1[1];
  } else if (captionMatch3) {
    viralCaption = captionMatch3[1].trim();
  } else if (captionMatch2) {
    viralCaption = captionMatch2[1].trim();
  }
  
  // ★ หา Hashtags จากทั้ง output — รองรับ #แฮชแท็กไทย และ #EnglishHashtag
  const allHashtags = rawOutput.match(/#[\w\u0E00-\u0E7F]+/g) || [];
  // เอาเฉพาะ hashtags ที่อยู่หลังส่วน caption/director's tips (ท้ายสุดของ output)
  const lastSection = rawOutput.slice(rawOutput.lastIndexOf('📱') !== -1 ? rawOutput.lastIndexOf('📱') : rawOutput.length - 500);
  const sectionHashtags = lastSection.match(/#[\w\u0E00-\u0E7F]+/g) || [];
  hashtags = sectionHashtags.length > 0 ? sectionHashtags : allHashtags.slice(-4);
  
  // Try multiple parsing strategies
  
  // Strategy 1: Split by scene markers with === SCENE X === or --- SCENE X --- (🎬 optional)
  const sceneHeaderRegex = /(?:={3,}|-{3,})\s*\n?\s*(?:🎬\s*)?SCENE\s*(\d+)[:\s]*([^\n=\-]*)\n?(?:\([^)]*\)\s*\n?)?(?:={3,}|-{3,})?/gi;
  const sceneHeaders = rawOutput.match(sceneHeaderRegex) || [];
  
  if (sceneHeaders.length > 0) {
    // Re-split using the same pattern
    let sceneBlocks = rawOutput.split(sceneHeaderRegex);
    
    // Since regex with capture groups in split creates extra entries, re-parse manually
    const headerPositions = [];
    let hMatch;
    const headerRegex2 = /(?:={3,}|-{3,})\s*\n?\s*(?:🎬\s*)?SCENE\s*(\d+)[:\s]*([^\n=\-]*)\n?(?:\([^)]*\)\s*\n?)?(?:={3,}|-{3,})?/gi;
    while ((hMatch = headerRegex2.exec(rawOutput)) !== null) {
      headerPositions.push({
        index: hMatch.index,
        endIndex: hMatch.index + hMatch[0].length,
        number: parseInt(hMatch[1]),
        name: (hMatch[2] || '').trim()
      });
    }
    
    headerPositions.forEach((hp, idx) => {
      const startIdx = hp.endIndex;
      const endIdx = headerPositions[idx + 1] ? headerPositions[idx + 1].index : rawOutput.length;
      const sceneContent = rawOutput.substring(startIdx, endIdx);
      
      const parsed = extractPrompts(sceneContent);
      scenes.push({
        number: hp.number,
        name: hp.name,
        prompt: sceneContent.trim().substring(0, 800),
        ...parsed
      });
    });
  }
  
  // Strategy 1.5: 🎬 SCENE X: (without === delimiters)
  if (scenes.length === 0) {
    const emojiSceneRegex = /🎬\s*SCENE\s*(\d+)[:\s]*([^\n]*)/gi;
    const emojiMatches = [];
    let eMatch;
    while ((eMatch = emojiSceneRegex.exec(rawOutput)) !== null) {
      emojiMatches.push({
        index: eMatch.index,
        endIndex: eMatch.index + eMatch[0].length,
        number: parseInt(eMatch[1]),
        name: (eMatch[2] || '').trim()
      });
    }
    
    if (emojiMatches.length > 0) {
      emojiMatches.forEach((em, idx) => {
        const startIdx = em.endIndex;
        const endIdx = emojiMatches[idx + 1] ? emojiMatches[idx + 1].index : rawOutput.length;
        const sceneContent = rawOutput.substring(startIdx, endIdx);
        
        const parsed = extractPrompts(sceneContent);
        scenes.push({
          number: em.number,
          name: em.name,
          prompt: sceneContent.trim().substring(0, 800),
          ...parsed
        });
      });
    }
  }
  
  // Strategy 2: If no scenes found, try simpler format (ฉาก X:)
  if (scenes.length === 0) {
    const simpleSceneRegex = /(?:ฉาก|Scene)\s*(\d+)[:\s]*([^\n]*)/gi;
    let match;
    let lastIndex = 0;
    const matches = [];
    
    while ((match = simpleSceneRegex.exec(rawOutput)) !== null) {
      matches.push({
        index: match.index,
        number: parseInt(match[1]),
        name: match[2].trim()
      });
    }
    
    matches.forEach((m, idx) => {
      const startIdx = m.index;
      const endIdx = matches[idx + 1] ? matches[idx + 1].index : rawOutput.length;
      const sceneContent = rawOutput.substring(startIdx, endIdx);
      
      const parsed = extractPrompts(sceneContent);
      // ★ เก็บ raw content ไว้ด้วยเผื่อ imagePrompt/videoPrompt ไม่มี ★
      scenes.push({
        number: m.number,
        name: m.name,
        prompt: sceneContent.trim().substring(0, 800), // raw content สำหรับ fallback
        ...parsed
      });
    });
  }
  
  // Strategy 3: If still no scenes, try to find any Image/Video prompts using ``` or --- blocks
  if (scenes.length === 0) {
    const allImagePrompts = [];
    const allVideoPrompts = [];
    
    // Find all image prompt sections and extract ``` or --- blocks
    const imgSections = rawOutput.split(/🔴\s*(?:IMAGE\s*PROMPT|\d+\.?\s*สร้างรูป[^\n]*)/gi);
    for (let i = 1; i < imgSections.length; i++) {
      const section = imgSections[i].split(/🟢/)[0]; // Get content before next 🟢
      // Try ``` blocks first - รองรับ ```text, ```plaintext etc.
      let codeBlocks = section.match(/```[\w]*\s*\n?[\s\S]*?\n?\s*```/g);
      if (codeBlocks && codeBlocks.length > 0) {
        const lastBlock = codeBlocks[codeBlocks.length - 1];
        const prompt = lastBlock.replace(/^```\w*\s*\n?/, '').replace(/\n?\s*```$/, '').trim();
        if (prompt) {
          allImagePrompts.push(prompt);
        }
      } else {
        // Try --- blocks
        const dashBlocks = section.match(/-{3}\s*\n([\s\S]*?)\n\s*-{3}/g);
        if (dashBlocks && dashBlocks.length > 0) {
          const lastBlock = dashBlocks[dashBlocks.length - 1];
          const prompt = lastBlock.replace(/^-{3}\s*\n?/, '').replace(/\n?\s*-{3}$/, '').trim();
          if (prompt && !prompt.includes('ถ้าโหมด')) {
            allImagePrompts.push(prompt);
          }
        }
      }
    }
    
    // Find all video prompt sections and extract ``` or --- blocks
    const vidSections = rawOutput.split(/🟢\s*(?:VIDEO\s*PROMPT|\d+\.?\s*สร้างวิดีโอ[^\n]*)/gi);
    for (let i = 1; i < vidSections.length; i++) {
      const section = vidSections[i].split(/={3,}|📝\s*VIRAL/)[0]; // Get content before next scene or viral
      // Try ``` blocks first - รองรับ ```text, ```plaintext etc.
      let codeBlocks = section.match(/```[\w]*\s*\n?[\s\S]*?\n?\s*```/g);
      if (codeBlocks && codeBlocks.length > 0) {
        const lastBlock = codeBlocks[codeBlocks.length - 1];
        const prompt = lastBlock.replace(/^```\w*\s*\n?/, '').replace(/\n?\s*```$/, '').trim();
        if (prompt) {
          allVideoPrompts.push(prompt);
        }
      } else {
        // Try --- blocks
        const dashBlocks = section.match(/-{3}\s*\n([\s\S]*?)\n\s*-{3}/g);
        if (dashBlocks && dashBlocks.length > 0) {
          const lastBlock = dashBlocks[dashBlocks.length - 1];
          const prompt = lastBlock.replace(/^-{3}\s*\n?/, '').replace(/\n?\s*-{3}$/, '').trim();
          if (prompt && !prompt.includes('ถ้าโหมด')) {
            allVideoPrompts.push(prompt);
          }
        }
      }
    }
    
    // Create scenes from found prompts
    const maxLen = Math.max(allImagePrompts.length, allVideoPrompts.length);
    for (let i = 0; i < maxLen; i++) {
      scenes.push({
        number: i + 1,
        name: '',
        storyboard: '',
        imagePrompt: allImagePrompts[i] || '',
        videoPrompt: allVideoPrompts[i] || ''
      });
    }
  }
  
  // Debug log
  console.log('Parsed scenes:', scenes.length, scenes);
  
  return { scenes, viralCaption, hashtags };
}

// Helper function to extract prompts from scene content
// ★ รองรับหลาย format: 🔴 IMAGE PROMPT, 🔴 1. สร้างรูป, Image Prompt:, "quoted prompt", ```code block``` ★
function extractPrompts(sceneContent) {
  let storyboard = '';
  let imagePrompt = '';
  let videoPrompt = '';
  
  // Extract storyboard — รองรับทั้ง "STORYBOARD" และ "Scene X (Hook..."
  const storyboardMatch = sceneContent.match(/(?:📝\s*)?STORYBOARD[:\s]*\n?([\s\S]*?)(?=🔴|$)/i);
  if (storyboardMatch) {
    storyboard = storyboardMatch[1].trim();
  }
  
  // Helper: extract code block content from a section (strip ```text label)
  function extractCodeBlock(section) {
    // Method 1: ``` code blocks (```text, ```plaintext, ``` etc.)
    const codeBlocks = section.match(/```[\w]*\s*\n?[\s\S]*?\n?\s*```/g);
    if (codeBlocks && codeBlocks.length > 0) {
      const lastBlock = codeBlocks[codeBlocks.length - 1];
      return lastBlock.replace(/^```\w*\s*\n?/, '').replace(/\n?\s*```$/, '').trim();
    }
    // Method 2: --- blocks
    const dashBlocks = section.match(/-{3}\s*\n([\s\S]*?)\n\s*-{3}/g);
    if (dashBlocks && dashBlocks.length > 0) {
      const lastBlock = dashBlocks[dashBlocks.length - 1];
      return lastBlock.replace(/^-{3}\s*\n?/, '').replace(/\n?\s*-{3}$/, '').trim();
    }
    // Method 3: "quoted prompt" (ทั้งก้อนในเครื่องหมายคำพูด)
    const quotedMatch = section.match(/"([^"]{20,})"/s);
    if (quotedMatch) {
      return quotedMatch[1].trim();
    }
    return '';
  }
  
  // ★ Helper: extract prompt text from section (with multiple fallbacks) ★
  function extractPromptText(section, headerRegex) {
    // Try 1: code blocks
    let prompt = extractCodeBlock(section);
    if (prompt && prompt.length > 10) return prompt;
    
    // Try 2: strip header and get remaining text
    const stripped = section.replace(headerRegex, '').trim();
    if (stripped.length > 10) {
      // Filter out instruction/logic lines
      const lines = stripped.split('\n').filter(l => {
        const t = l.trim();
        return t && !t.startsWith('👉') && !t.startsWith('(Logic') && !t.startsWith('(หาก') && !t.startsWith('หมายเหตุ');
      });
      if (lines.length > 0) return lines.join('\n').substring(0, 800);
    }
    
    return '';
  }
  
  // ★ IMAGE PROMPT — รองรับหลาย format ★
  // Format 1: 🔴 IMAGE PROMPT / 🔴 1. สร้างรูป
  const imgPatterns = [
    /🔴\s*(?:IMAGE\s*PROMPT|\d+\.?\s*สร้างรูป[^\n]*)[\s\S]*?(?=🟢|$)/i,
    /(?:Image\s*Prompt|IMAGE\s*PROMPT)[:\s]*\n?([\s\S]*?)(?=(?:Video\s*Prompt|VIDEO\s*PROMPT)|🟢|$)/i,
    /🖼️\s*(?:Image|รูป)[^\n]*[\s\S]*?(?=🎬|🟢|$)/i
  ];
  
  for (const pattern of imgPatterns) {
    const imageSection = sceneContent.match(pattern);
    if (imageSection) {
      imagePrompt = extractPromptText(imageSection[0], /^(?:🔴|🖼️)?\s*(?:IMAGE\s*PROMPT|Image\s*Prompt|\d+\.?\s*สร้างรูป[^\n]*|รูป[^\n]*)[:\s]*/i);
      if (imagePrompt) break;
    }
  }
  
  // ★ VIDEO PROMPT — รองรับหลาย format ★
  const vidPatterns = [
    /🟢\s*(?:VIDEO\s*PROMPT|\d+\.?\s*สร้างวิดีโอ[^\n]*)[\s\S]*?```[\s\S]*?```/i,
    /🟢\s*(?:VIDEO\s*PROMPT|\d+\.?\s*สร้างวิดีโอ[^\n]*)[\s\S]*?(?=={3,}|📝\s*VIRAL|🔴|ฉาก|Scene\s+\d|💡\s*DIRECTOR|$)/i,
    /(?:Video\s*Prompt|VIDEO\s*PROMPT)[:\s]*\n?([\s\S]*?)(?=={3,}|📝\s*VIRAL|🔴|Image\s*Prompt|ฉาก|Scene\s+\d|💡\s*DIRECTOR|$)/i,
    /🎬\s*(?:Video|วิดีโอ)[^\n]*[\s\S]*?(?=={3,}|📝|🔴|🖼️|ฉาก|Scene\s+\d|$)/i
  ];
  
  for (const pattern of vidPatterns) {
    const videoSection = sceneContent.match(pattern);
    if (videoSection) {
      videoPrompt = extractPromptText(videoSection[0], /^(?:🟢|🎬)?\s*(?:VIDEO\s*PROMPT|Video\s*Prompt|\d+\.?\s*สร้างวิดีโอ[^\n]*|วิดีโอ[^\n]*)[:\s]*/i);
      if (videoPrompt) break;
    }
  }
  
  // ★ Last resort fallback: ถ้ายังไม่มี prompt ให้ลองดึงจาก quoted strings ★
  if (!imagePrompt) {
    const allQuoted = sceneContent.match(/"([^"]{30,})"/g);
    if (allQuoted && allQuoted.length > 0) {
      imagePrompt = allQuoted[0].replace(/^"|"$/g, '').trim();
      if (allQuoted.length > 1 && !videoPrompt) {
        videoPrompt = allQuoted[1].replace(/^"|"$/g, '').trim();
      }
    }
  }
  
  // ★ Extract dialogue (บทพูด) from videoPrompt ★
  let dialogue = '';
  if (videoPrompt) {
    // Pattern 1: "บทพูดภาษาไทย..." inside video prompt (Thai text in quotes after dialogue keyword)
    const dlgMatch1 = videoPrompt.match(/(?:dialogue|บทพูด|speaks?|พูด)[^"]*"([^"]{10,})"/i);
    // Pattern 2: Thai text block — continuous Thai characters (at least 15 chars)
    const dlgMatch2 = videoPrompt.match(/"([ก-๙\s,.!?…\-–—'"()]{15,})"/);
    // Pattern 3: After "Thai dialogue:" or similar header
    const dlgMatch3 = videoPrompt.match(/(?:Thai\s*dialogue|บทพูด)\s*(?:naturally)?[:\s]*\n?"([^"]{10,})"/i);
    
    if (dlgMatch3) {
      dialogue = dlgMatch3[1].trim();
    } else if (dlgMatch1) {
      dialogue = dlgMatch1[1].trim();
    } else if (dlgMatch2) {
      dialogue = dlgMatch2[1].trim();
    }
  }
  
  // ★ Fallback: ดึงจาก sceneContent โดยตรง ★
  if (!dialogue) {
    const contentDlgMatch = sceneContent.match(/(?:🗣️|💬|บทพูด|Dialogue)[:\s]*\n?"?([ก-๙][ก-๙\s,.!?…\-–—'"()]{10,})"?/i);
    if (contentDlgMatch) {
      dialogue = contentDlgMatch[1].trim();
    }
  }
  
  console.log('[Parse] Extracted:', { 
    storyboard: storyboard.substring(0,50), 
    imagePrompt: imagePrompt.substring(0,80), 
    videoPrompt: videoPrompt.substring(0,80),
    dialogue: dialogue.substring(0,80)
  });
  
  return { storyboard, imagePrompt, videoPrompt, dialogue };
}

// Render scene cards to DOM - แสดงแบบ ฉาก 1 (Image + Video), ฉาก 2 (Image + Video) ไล่ลงไป
function renderSceneCards(parsedData) {
  const container = document.getElementById('scene-cards-container');
  container.innerHTML = '';
  
  const { scenes, viralCaption, hashtags } = parsedData;
  
  // === SCENES - แต่ละฉากมี Image + Video ===
  // ★ สร้างตาราง แสดง Image + Video Prompt ข้างกัน ★
  const table = document.createElement('table');
  table.className = 'scene-table';
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;';
  
  // Header row
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="background:#1a1a2e;color:#fff;">
      <th style="padding:8px;border:1px solid #333;width:60px;text-align:center;">ฉาก</th>
      <th style="padding:8px;border:1px solid #333;width:25%;">💬 บทพูด</th>
      <th style="padding:8px;border:1px solid #333;width:37%;">🔴 Image Prompt</th>
      <th style="padding:8px;border:1px solid #333;width:38%;">🟢 Video Prompt</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Body rows
  const tbody = document.createElement('tbody');
  
  scenes.forEach(scene => {
    const row = document.createElement('tr');
    row.style.cssText = 'background:#0d0d15;';
    
    // ฉาก column (with per-scene product control)
    const sceneCell = document.createElement('td');
    sceneCell.style.cssText = 'padding:8px;border:1px solid #333;text-align:center;vertical-align:top;';
    sceneCell.innerHTML = `
      <div style="font-weight:bold;color:#f59e0b;">ฉาก ${scene.number}</div>
      <div style="font-size:10px;color:#888;margin-top:4px;">${scene.name || ''}</div>
      <div class="scene-product-controls">
        <label title="ใส่รูปสินค้าในฉากนี้"><input type="checkbox" class="scene-show-product" data-scene="${scene.number}" checked> 📦</label>
      </div>
    `;
    row.appendChild(sceneCell);
    
    // Dialogue column (editable)
    const dialogueCell = document.createElement('td');
    dialogueCell.style.cssText = 'padding:8px;border:1px solid #333;vertical-align:top;background:#1a1a2e;border-left:3px solid #e94560;';
    const dialogueContent = scene.dialogue || '';
    dialogueCell.innerHTML = `
      <textarea class="scene-dialogue-edit" data-scene="${scene.number}" style="width:100%;min-height:150px;height:150px;background:#0d0d15;color:#fff;border:1px solid #e94560;border-radius:4px;padding:6px;font-size:11px;line-height:1.4;resize:vertical;" placeholder="บทพูดของตัวละคร (แก้ไขได้)">${escapeHtml(dialogueContent)}</textarea>
    `;
    row.appendChild(dialogueCell);
    
    // Image Prompt column
    const imageCell = document.createElement('td');
    imageCell.style.cssText = 'padding:8px;border:1px solid #333;vertical-align:top;background:#1a0a0a;';
    const imageContent = scene.imagePrompt || scene.prompt || '-';
    imageCell.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <button class="copy-btn small" data-content="${escapeHtml(imageContent)}" style="padding:2px 6px;font-size:10px;cursor:pointer;">📋 Copy</button>
        <button class="auto-run-btn small" data-type="image" data-scene="${scene.number}" data-prompt="${escapeHtml(imageContent)}" style="padding:2px 6px;font-size:10px;background:#f59e0b;color:#000;border:none;border-radius:4px;cursor:pointer;">🚀 Auto</button>
      </div>
      <div style="color:#e0e0e0;font-size:11px;line-height:1.4;max-height:150px;overflow-y:auto;white-space:pre-wrap;word-break:break-word;">${escapeHtml(imageContent)}</div>
    `;
    row.appendChild(imageCell);
    
    // Video Prompt column
    const videoCell = document.createElement('td');
    videoCell.style.cssText = 'padding:8px;border:1px solid #333;vertical-align:top;background:#0a1a0a;';
    const videoContent = scene.videoPrompt || '-';
    videoCell.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <button class="copy-btn small" data-content="${escapeHtml(videoContent)}" style="padding:2px 6px;font-size:10px;cursor:pointer;">📋 Copy</button>
        <button class="auto-run-btn small" data-type="video" data-scene="${scene.number}" data-prompt="${escapeHtml(videoContent)}" style="padding:2px 6px;font-size:10px;background:#10b981;color:#000;border:none;border-radius:4px;cursor:pointer;">🚀 Auto</button>
      </div>
      <div style="color:#e0e0e0;font-size:11px;line-height:1.4;max-height:150px;overflow-y:auto;white-space:pre-wrap;word-break:break-word;">${escapeHtml(videoContent)}</div>
    `;
    row.appendChild(videoCell);
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  container.appendChild(table);
  
  // ★ Wire up per-scene product control — showProductDialogue auto-set: last 2 scenes only ★
  smSceneProductControl = [];
  const totalScenes = scenes.length;
  scenes.forEach(scene => {
    const isLast2 = scene.number > (totalScenes - 2);
    smSceneProductControl.push({ sceneNumber: scene.number, showProduct: true, showProductDialogue: isLast2 });
  });
  
  container.querySelectorAll('.scene-show-product').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const sceneNum = parseInt(e.target.dataset.scene);
      const ctrl = smSceneProductControl.find(c => c.sceneNumber === sceneNum);
      if (ctrl) ctrl.showProduct = e.target.checked;
      console.log(`[Storymode] ฉาก ${sceneNum}: สินค้า = ${e.target.checked ? 'ใส่' : 'ไม่ใส่'}`);
    });
  });
  
  // 💬 toggle removed — showProductDialogue auto-set to last 2 scenes only
  
  // === STORYBOARD SECTION (collapsed by default) ===
  if (scenes.some(s => s.storyboard)) {
    const storyboardSection = document.createElement('div');
    storyboardSection.className = 'prompt-section collapsible';
    storyboardSection.innerHTML = `
      <div class="prompt-section-header clickable" onclick="this.parentElement.classList.toggle('expanded')">
        <span class="prompt-section-title">📝 STORYBOARDS</span>
        <span class="collapse-icon">▼</span>
      </div>
    `;
    
    const storyboardCardsContainer = document.createElement('div');
    storyboardCardsContainer.className = 'prompt-cards-grid storyboard-grid';
    
    scenes.forEach(scene => {
      if (scene.storyboard) {
        const card = document.createElement('div');
        card.className = 'prompt-card storyboard-card';
        card.innerHTML = `
          <div class="prompt-card-header">
            <span class="prompt-card-number">ฉาก ${scene.number}</span>
          </div>
          <div class="prompt-card-content">${escapeHtml(scene.storyboard)}</div>
          <div class="prompt-card-actions">
            <button class="copy-btn" data-content="${escapeHtml(scene.storyboard)}">📋 Copy</button>
          </div>
        `;
        storyboardCardsContainer.appendChild(card);
      }
    });
    
    storyboardSection.appendChild(storyboardCardsContainer);
    container.appendChild(storyboardSection);
  }
  
  // === VIRAL CAPTION SECTION (v3.23: Caption Repair System) ===
  if (viralCaption || hashtags.length > 0) {
    const repairedCaption = repairViralCaption(viralCaption, hashtags);
    const captionCard = document.createElement('div');
    captionCard.className = 'viral-caption-card';
    captionCard.innerHTML = `
      <div class="viral-caption-header">
        <span class="viral-caption-title">📱 แคปชั่นสำหรับโพสต์ (TikTok/Reels)</span>
        <button class="copy-btn" data-content="${escapeHtml(repairedCaption.text + '\n\n' + repairedCaption.hashtags.join(' ') + (repairedCaption.disclaimer ? '\n\n' + repairedCaption.disclaimer : ''))}">📋 Copy All</button>
      </div>
      <div class="viral-caption-content">${escapeHtml(repairedCaption.text)}</div>
      <div class="hashtags">
        ${repairedCaption.hashtags.map(tag => `<span class="hashtag">${tag}</span>`).join('')}
      </div>
      ${repairedCaption.disclaimer ? `<div class="caption-disclaimer" style="font-size:11px;color:var(--text-secondary);margin-top:6px;opacity:0.8;">⚠️ ${escapeHtml(repairedCaption.disclaimer)}</div>` : ''}
      ${repairedCaption.warnings.length > 0 ? `<div class="caption-warnings" style="font-size:11px;color:#f59e0b;margin-top:4px;">${repairedCaption.warnings.map(w => `⚡ ${escapeHtml(w)}`).join('<br>')}</div>` : ''}
    `;
    container.appendChild(captionCard);
  }
  
  // Add copy button event listeners
  container.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const content = btn.getAttribute('data-content');
      navigator.clipboard.writeText(content).then(() => {
        btn.classList.add('copied');
        btn.textContent = '✅ Copied!';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = '📋 Copy';
        }, 2000);
      });
    });
  });
  
  // Add copy all section button listeners
  container.querySelectorAll('.copy-all-section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      const cards = container.querySelectorAll(`.${type}-card`);
      const allPrompts = Array.from(cards).map((card, idx) => {
        const prompt = card.getAttribute('data-prompt');
        return `=== ฉาก ${idx + 1} ===\n${prompt}`;
      }).join('\n\n');
      
      navigator.clipboard.writeText(allPrompts).then(() => {
        btn.classList.add('copied');
        btn.textContent = '✅ Copied All!';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = `📋 Copy All ${type === 'image' ? 'Images' : 'Videos'}`;
        }, 2000);
      });
    });
  });
  
  // Add auto run button listeners - ★ เปิด Google Flow และส่ง prompt ไปทำงานอัตโนมัติ ★
  container.querySelectorAll('.auto-run-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const type = btn.getAttribute('data-type');
      const scene = btn.getAttribute('data-scene');
      const prompt = btn.getAttribute('data-prompt');
      
      if (!prompt || prompt === '-') {
        showError('ไม่มี prompt สำหรับฉากนี้');
        return;
      }
      
      btn.textContent = '⏳ กำลังเปิด...';
      btn.disabled = true;
      
      try {
        // เก็บ prompt ไว้ใน storage สำหรับ Google Flow content script
        await chrome.storage.local.set({
          currentFlowData: {
            prompt: prompt,
            mode: type, // 'image' หรือ 'video'
            sceneNumber: parseInt(scene),
            timestamp: Date.now()
          },
          flowStatus: 'pending'
        });
        
        // หา tab Google Flow ที่เปิดอยู่
        const tabs = await chrome.tabs.query({ url: '*://labs.google/*' });
        
        if (tabs.length > 0) {
          // มี tab อยู่แล้ว — ส่ง message ไปให้ content script
          const flowTab = tabs[0];
          await chrome.tabs.update(flowTab.id, { active: true });
          
          // ส่ง message ไปให้ content script เริ่มทำงาน
          await chrome.tabs.sendMessage(flowTab.id, {
            action: 'startSingleScene',
            prompt: prompt,
            type: type,
            sceneNumber: parseInt(scene)
          });
          
          btn.textContent = '✅ ส่งแล้ว!';
          showSuccess(`ส่ง ${type === 'image' ? 'Image' : 'Video'} Prompt ฉาก ${scene} ไป Google Flow แล้ว!`);
        } else {
          // ไม่มี tab — เปิดใหม่
          await chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow' });
          btn.textContent = '✅ เปิดแล้ว!';
          showSuccess(`เปิด Google Flow แล้ว — รอหน้าโหลดเสร็จแล้วจะทำงานอัตโนมัติ`);
        }
        
        setTimeout(() => {
          btn.textContent = '🚀 Auto';
          btn.disabled = false;
        }, 3000);
        
      } catch (error) {
        console.error('[Auto] Error:', error);
        btn.textContent = '❌ Error';
        showError('เกิดข้อผิดพลาด: ' + error.message);
        setTimeout(() => {
          btn.textContent = '🚀 Auto';
          btn.disabled = false;
        }, 2000);
      }
    });
  });
  
  // ★ Dialogue edit listeners — ผู้ใช้แก้ไขบทพูดแต่ละฉาก ★
  container.querySelectorAll('.scene-dialogue-edit').forEach(textarea => {
    textarea.addEventListener('input', (e) => {
      const sceneNum = parseInt(e.target.dataset.scene);
      const sceneObj = scenes.find(s => s.number === sceneNum);
      if (sceneObj) {
        sceneObj.dialogue = e.target.value;
        console.log(`[Storymode] Scene ${sceneNum} dialogue updated:`, e.target.value.substring(0, 50));
      }
    });
  });
  
}

// Show notification for auto run
function showAutoRunNotification(type, scene) {
  const notification = document.createElement('div');
  notification.className = 'auto-run-notification';
  notification.innerHTML = `
    <span>✅ Prompt ฉาก ${scene} พร้อมแล้ว!</span>
    <span>ไปที่ ${type === 'image' ? 'Image Generator' : 'Video Generator'} แล้วกด Auto Paste</span>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Show success toast notification
function showSuccess(message) {
  addLog(message, 'success');
  const toast = document.createElement('div');
  toast.className = 'auto-run-notification';
  toast.style.cssText = 'background:linear-gradient(135deg,#00b894,#00cec9);border:1px solid #00b894;';
  toast.innerHTML = `<span>✅ ${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function initSettings() {
  const saveBtn = document.getElementById('save-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }
  
  const clearBtns = document.querySelectorAll('.clear-cache-option');
  clearBtns.forEach(btn => {
    btn.addEventListener('click', () => clearBrowserCache(btn.dataset.mode, btn));
  });

  // ★ Custom Forbidden Words UI ★
  const saveForbiddenBtn = document.getElementById('save-forbidden-words');
  const clearForbiddenBtn = document.getElementById('clear-forbidden-words');
  const forbiddenInput = document.getElementById('custom-forbidden-words');
  const forbiddenMsg = document.getElementById('forbidden-words-message');

  chrome.storage.local.get('customForbiddenWords', (result) => {
    if (result.customForbiddenWords && Array.isArray(result.customForbiddenWords) && forbiddenInput) {
      forbiddenInput.value = result.customForbiddenWords.join(', ');
    }
  });

  if (saveForbiddenBtn) {
    saveForbiddenBtn.addEventListener('click', () => {
      const raw = (forbiddenInput?.value || '').trim();
      const words = raw.split(',').map(w => w.trim()).filter(w => w.length > 0);
      userCustomForbiddenWords = words;
      chrome.storage.local.set({ customForbiddenWords: words });
      if (forbiddenMsg) {
        forbiddenMsg.style.color = '#00d2d3';
        forbiddenMsg.textContent = `✅ บันทึกแล้ว ${words.length} คำ`;
        setTimeout(() => { forbiddenMsg.textContent = ''; }, 3000);
      }
    });
  }

  if (clearForbiddenBtn) {
    clearForbiddenBtn.addEventListener('click', () => {
      if (forbiddenInput) forbiddenInput.value = '';
      userCustomForbiddenWords = [];
      chrome.storage.local.set({ customForbiddenWords: [] });
      if (forbiddenMsg) {
        forbiddenMsg.style.color = '#f39c12';
        forbiddenMsg.textContent = '🗑️ ล้างคำต้องห้ามเพิ่มเติมแล้ว';
        setTimeout(() => { forbiddenMsg.textContent = ''; }, 3000);
      }
    });
  }
}

async function clearBrowserCache(mode, btn) {
  const msg = document.getElementById('clear-cache-message');
  const originalHTML = btn.innerHTML;
  const allBtns = document.querySelectorAll('.clear-cache-option');
  allBtns.forEach(b => b.disabled = true);
  btn.innerHTML = '⏳ กำลังล้าง...';
  
  const labels = { cache: 'Cache', cache_cookies: 'Cache + Cookies', all: 'ทั้งหมด' };
  
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'CLEAR_CACHE', mode: mode });
    if (resp && resp.success) {
      msg.style.color = '#00d2d3';
      msg.textContent = `✅ ล้าง ${labels[mode]} เรียบร้อย!`;
    } else {
      msg.style.color = '#f44';
      msg.textContent = '❌ ล้างไม่สำเร็จ: ' + (resp?.error || 'Unknown error');
    }
  } catch (e) {
    console.error('[Settings] Clear cache error:', e);
    msg.style.color = '#f44';
    msg.textContent = '❌ ไม่สำเร็จ: ' + e.message;
  }
  
  allBtns.forEach(b => b.disabled = false);
  btn.innerHTML = originalHTML;
  setTimeout(() => { msg.textContent = ''; }, 5000);
}

async function loadSettings() {
  const result = await chrome.storage.local.get(['provider', 'openaiKey', 'googleKey']);
  
  if (result.provider) {
    document.getElementById('provider-select').value = result.provider;
  }
  if (result.openaiKey) {
    document.getElementById('openai-key').value = result.openaiKey;
  }
  if (result.googleKey) {
    document.getElementById('google-key').value = result.googleKey;
  }
  
  updateApiStatus();
}

async function saveSettings() {
  const provider = document.getElementById('provider-select').value;
  let openaiKey = document.getElementById('openai-key').value.trim();
  let googleKey = document.getElementById('google-key').value.trim();
  
  // ★ Auto-detect misplaced keys: Google Key (AIza...) ใส่ช่อง OpenAI → ย้ายให้ถูกช่อง ★
  if (openaiKey && openaiKey.startsWith('AIza') && !googleKey) {
    googleKey = openaiKey;
    openaiKey = '';
    console.log('[Settings] Auto-moved Google Key from OpenAI field to Google field');
  }
  if (googleKey && googleKey.startsWith('sk-') && !openaiKey) {
    openaiKey = googleKey;
    googleKey = '';
    console.log('[Settings] Auto-moved OpenAI Key from Google field to OpenAI field');
  }
  
  await chrome.storage.local.set({
    provider,
    openaiKey,
    googleKey
  });
  
  // อัพเดท UI ให้ตรงกับค่าที่แก้แล้ว
  document.getElementById('openai-key').value = openaiKey;
  document.getElementById('google-key').value = googleKey;
  
  const msg = document.getElementById('settings-message');
  msg.style.color = '#00d2d3';
  msg.textContent = '✅ บันทึกการตั้งค่าเรียบร้อย!';
  
  updateApiStatus();
  
  setTimeout(() => {
    msg.textContent = '';
  }, 3000);
}

async function updateApiStatus() {
  const result = await chrome.storage.local.get(['openaiKey', 'googleKey']);
  const statusEl = document.getElementById('api-status');
  if (!statusEl) return;
  
  if (result.openaiKey) {
    statusEl.innerHTML = `<span class="status-dot connected"></span><span class="status-text">เชื่อมต่อ ChatGPT แล้ว</span>`;
    statusEl.classList.add('connected');
  } else if (result.googleKey) {
    statusEl.innerHTML = `<span class="status-dot connected"></span><span class="status-text">เชื่อมต่อ Gemini AI แล้ว</span>`;
    statusEl.classList.add('connected');
  } else {
    statusEl.innerHTML = `<span class="status-dot"></span><span class="status-text">ยังไม่ได้ตั้งค่า API Key (OpenAI หรือ Google AI)</span>`;
    statusEl.classList.remove('connected');
  }
}

function buildUserMessage() {
  const topicEl = document.getElementById('topic-input');
  const topic = topicEl ? topicEl.value.trim() : '';
  
  if (!topic) return '';

  const chkFull = document.getElementById('chk-sm-custom-prompt-full');
  const customTA = document.getElementById('sm-custom-prompt-textarea');
  if (chkFull?.checked && customTA?.value?.trim()) {
    const chkHint = document.getElementById('chk-sm-custom-append-pipeline-hint');
    let msg = customTA.value.trim();
    if (chkHint?.checked) {
      msg += '\n\n' + getStorymodePipelineHintFooter();
    }
    return msg;
  }

  const storyTypeObj = STORY_TYPE_TEMPLATES.find(t => t.id === smStoryType);
  const storyTypeLabel = storyTypeObj ? `${storyTypeObj.name} — ${storyTypeObj.description}` : smStoryType;

  const narrativeLabel = smNarrativeStyles.length > 0
    ? smNarrativeStyles.map(id => {
        const s = STYLE_OPTIONS.find(o => o.id === id);
        if (!s) return id;
        return (s.icon ? s.icon + ' ' : '') + s.name;
      }).join(', ')
    : 'อัตโนมัติ (AI เลือกให้)';

  let msg = `═══ หัวข้อ / สินค้า ═══\n${topic}\n`;
  msg += `\n═══ ประเภทเรื่อง ═══\n${storyTypeLabel}\n`;
  msg += `\n═══ จำนวนฉาก ═══\n${smSceneCount} ฉาก\n`;
  msg += `\n═══ สไตล์ภาพ ═══\n${smVisualStyle}\n`;
  msg += `\n═══ อารมณ์ / Mood ═══\n${smMoodKeyword}\n`;
  msg += `\n═══ แนวการเล่า ═══\n${narrativeLabel}\n`;

  const visForMsg = VISUAL_STYLES.find(v => v.name === smVisualStyle);
  if (visForMsg?.prompt) {
    msg += `\n═══ Visual style directive (EN; image prefix) ═══\n${visForMsg.prompt}\n`;
  }
  const moodDirective = getMoodDirective(smMoodKeyword);
  if (moodDirective) {
    msg += `\n═══ Mood directive (EN) ═══\n${moodDirective}\n`;
  }
  const narrativeDirectives = formatNarrativePromptsForMessage(smNarrativeStyles);
  if (narrativeDirectives) {
    msg += `\n═══ Narrative persona directives (EN; follow strictly) ═══\n${narrativeDirectives}\n`;
  }

  if (smOutputType !== 'both') {
    msg += `\n═══ ประเภท Output ═══\n${smOutputType === 'image' ? 'สร้างเฉพาะรูปภาพ' : 'สร้างเฉพาะวิดีโอ'}\n`;
  }

  if (smDisclaimer) {
    msg += `\n═══ ข้อความ Disclaimer ═══\n${smDisclaimer}\n`;
  }

  if (smHookCategory && smHookCategory !== 'auto') {
    msg += `\n═══ ประเภท Hook ═══\n${smHookCategory}\n`;
  }

  if (smScriptMode === 'manual' && smManualScenes.length > 0) {
    msg += '\n═══ บทพูดที่กำหนดเอง (Manual Scripts) ═══\n';
      smManualScenes.forEach((scene, i) => {
      if (scene.text) {
        msg += `ฉาก ${i + 1}: ${scene.text}`;
        if (!scene.showProduct) msg += ' [ไม่แสดงสินค้า]';
        msg += '\n';
      }
    });
    msg += 'ให้ใช้บทพูดด้านบนเป็นหลัก โดยปรับให้เข้ากับสถานการณ์ในแต่ละฉาก\n';
  }

  msg += `\nสร้างสคริปต์ ${smSceneCount} ฉาก ตาม format ที่กำหนดเลย`;

  return msg;
}

// ★ v3.17: วิเคราะห์รูปตัวละคร reference — ตรวจ style (photo/3D/anime/etc.) + บรรยายลักษณะ ★
async function analyzeCharacterForStorymode(imageBase64) {
  if (!imageBase64) return null;

  try {
    const googleKey = (await chrome.storage.local.get(['googleKey'])).googleKey;
    if (!googleKey) {
      console.warn('[Storymode] ไม่มี Google Key — ข้ามวิเคราะห์รูปตัวละคร');
      return null;
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    // TODO: USER_PROMPT
    const analysisPrompt = ``;

    const data = await fetchGeminiWithFallback(googleKey, {
      contents: [{
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: analysisPrompt }
        ]
      }]
    }, 1024, 0.2);
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanText = rawText.trim().replace(/```json\n?|\n?```/g, '');

    try {
      const analysis = JSON.parse(cleanText);
      console.log('[Storymode CharacterAnalysis]', analysis);
      addLog(`✅ [Storymode] วิเคราะห์ตัวละครเสร็จ — style: ${analysis.visual_style}, gender: ${analysis.gender}`, 'success');
      return analysis;
    } catch (parseErr) {
      console.log('[Storymode CharacterAnalysis] JSON parse failed, using fallback');
      addLog(`⚠️ [Storymode] วิเคราะห์ตัวละครได้บางส่วน (text mode)`, 'warning');
      return { visual_style: 'photorealistic', style_prompt: 'photorealistic photography, natural lighting, ultra realistic', character_desc: cleanText.substring(0, 200), gender: 'female' };
    }
  } catch (err) {
    console.warn('[Storymode CharacterAnalysis] Error:', err.message);
    addLog(`⚠️ [Storymode] วิเคราะห์รูปตัวละครไม่สำเร็จ — ใช้ photorealistic fallback`, 'warning');
    return { visual_style: 'photorealistic', style_prompt: 'photorealistic photography, natural lighting, ultra realistic', character_desc: '', gender: 'female' };
  }
}

// ★ วิเคราะห์รูปสินค้าสำหรับ Storymode — ส่งรูปให้ Gemini Vision ดูก่อนสร้าง Script ★
async function analyzeProductForStorymode(imageBase64) {
  if (!imageBase64) return null;
  
  try {
    const googleKey = (await chrome.storage.local.get(['googleKey'])).googleKey;
    if (!googleKey) {
      console.warn('[Storymode] ไม่มี Google Key — ข้ามวิเคราะห์รูปสินค้า');
      return null;
    }
    
    // แยก base64 data ออกจาก data URI
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    
    // TODO: USER_PROMPT
    const analysisPrompt = ``;

    const data = await fetchGeminiWithFallback(googleKey, {
      contents: [{
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: analysisPrompt }
        ]
      }]
    }, 2048, 0.3);
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanText = rawText.trim().replace(/```json\n?|\n?```/g, '');
    
    try {
      const analysis = JSON.parse(cleanText);
      screenProductAnalysisObject(analysis);
      console.log('[Storymode ProductAnalysis]', analysis);
      addLog(`✅ [Storymode] วิเคราะห์สินค้าเสร็จ — ${analysis.productType} (${analysis.brand || 'ไม่ระบุ'})`, 'success');
      return analysis;
    } catch (parseErr) {
      console.log('[Storymode ProductAnalysis] JSON parse failed, using raw text');
      addLog(`✅ [Storymode] วิเคราะห์สินค้าเสร็จ (text mode)`, 'success');
      return { summary_en: cleanText, raw: true };
    }
  } catch (err) {
    console.warn('[Storymode ProductAnalysis] Error:', err.message);
    addLog(`⚠️ [Storymode] วิเคราะห์รูปสินค้าไม่สำเร็จ — ${err.message}`, 'warning');
    return null;
  }
}

async function generateScript() {
  const btn = document.getElementById('generate-btn');
  const outputSection = document.getElementById('output-section');
  const outputContent = document.getElementById('output-content');
  const errorContainer = document.getElementById('error-container');
  
  if (errorContainer) errorContainer.innerHTML = '';
  
  try {
    let userMessage = buildUserMessage();
    
    // Story Mode — ใช้ provider ที่ user เลือก, fallback ตาม key ที่มี
    const storageData = await chrome.storage.local.get(['provider', 'openaiKey', 'googleKey']);
    let provider = storageData.provider || (storageData.openaiKey ? 'openai' : 'google');
    let apiKey = provider === 'openai' ? storageData.openaiKey : storageData.googleKey;
    if (!apiKey) {
      provider = provider === 'openai' ? 'google' : 'openai';
      apiKey = provider === 'openai' ? storageData.openaiKey : storageData.googleKey;
    }
    
    if (!apiKey) {
      throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน (OpenAI หรือ Google AI) ไปที่แท็บ "ตั้งค่า API"');
    }
    
    const providerLabel = provider === 'openai' ? 'ChatGPT' : 'Gemini AI';
    
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> กำลังสร้าง...';
    }
    
    if (outputSection) outputSection.style.display = 'block';
    
    // ★ ถ้ามีรูปสินค้า → วิเคราะห์ด้วย AI ก่อนสร้าง Script ★
    let smProductAnalysis = null;
    if (smProductImage) {
      outputContent.innerHTML = `<div class="loading"><div class="spinner"></div><span>🔍 AI กำลังวิเคราะห์รูปสินค้า...</span></div>`;
      smProductAnalysis = await analyzeProductForStorymode(smProductImage);
      
      if (smProductAnalysis) {
        const analysisBlock = `\n\n=== AI PRODUCT ANALYSIS (จากรูปสินค้าที่แนบ) ===\nประเภทสินค้า: ${smProductAnalysis.productType || 'N/A'}\nลักษณะ: ${smProductAnalysis.appearance || 'N/A'}\nแบรนด์: ${smProductAnalysis.brand || 'N/A'}\nจุดเด่น: ${smProductAnalysis.features || 'N/A'}\nกลุ่มเป้าหมาย: ${smProductAnalysis.targetAudience || 'N/A'}\nวิธีใช้: ${smProductAnalysis.usage || 'N/A'}\nโทนสี: ${smProductAnalysis.colorTone || 'N/A'}\nEnglish Summary (for Image Prompt): ${smProductAnalysis.summary_en || 'N/A'}\n\n⚠️ CRITICAL:\n1. Image Prompt ทุกฉากต้องบรรยายสินค้าให้ตรงกับผลวิเคราะห์ด้านบน 100%\n2. ห้ามสร้างสินค้าขึ้นมาเอง — ต้องตรงกับรูปที่แนบ\n3. Dialogue ต้องกล่าวถึงคุณสมบัติจริงของสินค้า\n4. ใช้ English Summary ใน Image Prompt`;
        userMessage += analysisBlock;
      }
    }

    // ★ v3.17: วิเคราะห์รูปตัวละคร reference + inject style override ★
    smCharacterAnalysisResult = null;
    if (smCharacterImage) {
      outputContent.innerHTML = `<div class="loading"><div class="spinner"></div><span>🔍 AI กำลังวิเคราะห์รูปตัวละคร reference...</span></div>`;
      smCharacterAnalysisResult = await analyzeCharacterForStorymode(smCharacterImage);

      if (smCharacterAnalysisResult) {
        const styleLabel = { 'photorealistic': 'Photorealistic', '3d_animation': '3D Animation', 'anime_2d': 'Anime', 'illustration': 'Illustration' }[smCharacterAnalysisResult.visual_style] || smCharacterAnalysisResult.visual_style;
        userMessage += `\n\n=== AI CHARACTER REFERENCE ANALYSIS ===\nDetected Visual Style: ${styleLabel}\nCharacter Description: ${smCharacterAnalysisResult.character_desc || 'N/A'}\nGender: ${smCharacterAnalysisResult.gender || 'N/A'}\nArt Style Directive: ${smCharacterAnalysisResult.style_prompt || 'N/A'}\n\n⚠️ CRITICAL — ART STYLE OVERRIDE:\n1. Image Prompt ทุกฉากต้องเริ่มด้วย Art Style Directive: "${smCharacterAnalysisResult.style_prompt}"\n2. Character Description ในทุกฉากต้องตรงกับ reference: "${smCharacterAnalysisResult.character_desc}"\n3. ห้ามเปลี่ยน art style ระหว่างฉาก — ทุกฉากต้องใช้สไตล์เดียวกัน`;
      }
    }
    
    outputContent.innerHTML = `<div class="loading"><div class="spinner"></div><span>กำลังสร้างสคริปต์ด้วย ${providerLabel}...</span></div>`;

    userMessage = applyGoogleFlowUserInputGuard(userMessage);

    let genSystemPrompt = getStorymodeSystemPromptForGenerate();
    if (smCharacterAnalysisResult && smCharacterAnalysisResult.visual_style === 'photorealistic') {
      genSystemPrompt += `\n\n⚠️ ART STYLE OVERRIDE (HIGHEST PRIORITY):\nThe user has uploaded a PHOTOREALISTIC character reference image.\n- ALL Image Prompts MUST use PHOTOREALISTIC style: "${smCharacterAnalysisResult.style_prompt}"\n- ABSOLUTELY FORBIDDEN: "3D animated", "3D CGI", "3D Pixar", "Disney animation", "cartoon"\n- REQUIRED: "photorealistic", "photography", "natural lighting", "ultra realistic"\n- Character description: "${smCharacterAnalysisResult.character_desc}"\n- This overrides ALL previous style instructions!`;
    }
    
    conversationHistory = [
      { role: 'system', content: genSystemPrompt },
      { role: 'user', content: userMessage }
    ];
    
    let result = await callAPIWithMeta(provider, apiKey, conversationHistory);
    let fullResponse = result.text;
    
    outputContent.textContent = fullResponse;
    conversationHistory.push({ role: 'assistant', content: fullResponse });
    
    // ★ Auto-continue: ถ้า AI output ถูกตัด → ส่ง "ต่อ" ให้ AI เขียนต่อ (สูงสุด 3 รอบ) ★
    const MAX_CONTINUE = 3;
    for (let cont = 0; cont < MAX_CONTINUE && result.truncated; cont++) {
      outputContent.innerHTML += `<div class="loading"><div class="spinner"></div><span>⏳ AI เขียนยังไม่จบ — กำลังต่อ... (${cont + 1}/${MAX_CONTINUE})</span></div>`;
      conversationHistory.push({ role: 'user', content: 'ต่อ' });
      result = await callAPIWithMeta(provider, apiKey, conversationHistory);
      fullResponse += '\n\n' + result.text;
      outputContent.textContent = fullResponse;
      conversationHistory.push({ role: 'assistant', content: result.text });
      console.log(`[Storymode] Auto-continue round ${cont + 1}, truncated: ${result.truncated}`);
    }
    
    // ★ แสดง Auto Run section หลัง generate เสร็จ ★
    showAutoRunSection();
    
  } catch (error) {
    if (errorContainer) errorContainer.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
    if (outputSection) outputSection.style.display = 'none';
    console.error('[Storymode] generateScript error:', error);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🎬</span> สร้างสคริปต์ TikTok';
    }
  }
}


// ★ Gemini Fallback Helper — auto-switch model เมื่อโดน rate limit (429) ★
const GEMINI_MODEL_CHAIN = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];

async function resolveGoogleKeyForScreening(primaryKey) {
  if (primaryKey && String(primaryKey).startsWith('AIza')) return primaryKey;
  const { googleKey } = await chrome.storage.local.get(['googleKey']);
  return googleKey || null;
}

async function fetchGeminiWithFallback(apiKey, requestBody, maxOutputTokens = 16384, temperature = 0.7, fetchOptions = {}) {
  const { skipOutboundScreen = false, topP = 0.85 } = fetchOptions || {};
  for (let i = 0; i < GEMINI_MODEL_CHAIN.length; i++) {
    const model = GEMINI_MODEL_CHAIN[i];
    try {
      console.log(`[Gemini] Trying model: ${model}...`);
      
      const body = JSON.parse(JSON.stringify(requestBody));
      if (!skipOutboundScreen) {
        applyLocalScreenToGeminiRequestBody(body);
      }
      if (!body.generationConfig) body.generationConfig = {};
      body.generationConfig.maxOutputTokens = maxOutputTokens;
      body.generationConfig.temperature = temperature;
      if (typeof topP === 'number' && topP > 0 && topP <= 1) {
        body.generationConfig.topP = topP;
      }
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );
      
      if (response.status === 429) {
        console.warn(`[Gemini] ⚠️ ${model} rate limited (429) — fallback to next model...`);
        continue;
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errMsg = error.error?.message || `HTTP ${response.status}`;
        // ★ Fallback on 404 (model not found), 400 (bad request), 500+ (server error) ★
        // Only 401/403 (auth) should be terminal
        if (i < GEMINI_MODEL_CHAIN.length - 1 && response.status !== 401 && response.status !== 403) {
          console.warn(`[Gemini] ⚠️ ${model} error (${response.status}: ${errMsg.substring(0, 80)}) — fallback to next model...`);
          continue;
        }
        throw new Error(errMsg);
      }
      
      const data = await response.json();
      
      // ★ เช็ค PROHIBITED_CONTENT / blocked → fallback ไป model ถัดไป ★
      const blockReason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
      if (blockReason === 'PROHIBITED_CONTENT' || blockReason === 'SAFETY' || blockReason === 'BLOCKLIST') {
        if (i < GEMINI_MODEL_CHAIN.length - 1) {
          console.warn(`[Gemini] ⚠️ ${model} blocked (${blockReason}) — fallback to next model...`);
          continue;
        }
      }
      
      if (model !== GEMINI_MODEL_CHAIN[0]) {
        console.log(`[Gemini] ✅ Success with fallback model: ${model}`);
      }
      return data;
      
    } catch (err) {
      if (i < GEMINI_MODEL_CHAIN.length - 1 && (err.message.includes('429') || err.message.includes('rate') || err.message.includes('quota') || err.message.includes('Resource has been exhausted'))) {
        console.warn(`[Gemini] ⚠️ ${model} error: ${err.message} — fallback to next model...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('All Gemini models rate limited — กรุณารอสักครู่แล้วลองใหม่');
}

async function callAPI(provider, apiKey, messages) {
  // ★ v1.91-fix3: Auto-detect misplaced key ★
  console.log('[callAPI] v1.91-fix3 called:', { provider, keyPrefix: apiKey?.substring(0, 8) });
  if (provider === 'openai' && apiKey && apiKey.startsWith('AIza')) {
    console.warn('[callAPI] OpenAI provider but key is Google (AIza...) — auto-switching to Google');
    provider = 'google';
  } else if (provider === 'google' && apiKey && apiKey.startsWith('sk-')) {
    console.warn('[callAPI] Google provider but key is OpenAI (sk-...) — auto-switching to OpenAI');
    provider = 'openai';
  }
  console.log('[callAPI] Final provider:', provider);

  const screenKey = await resolveGoogleKeyForScreening(apiKey);
  messages = await screenChatMessages(messages, screenKey);
  
  const result = provider === 'openai' 
    ? await callOpenAI(apiKey, messages) 
    : await callGoogleAI(apiKey, messages);
  return result.text;
}

async function callAPIWithMeta(provider, apiKey, messages) {
  if (provider === 'openai' && apiKey && apiKey.startsWith('AIza')) provider = 'google';
  else if (provider === 'google' && apiKey && apiKey.startsWith('sk-')) provider = 'openai';

  const screenKey = await resolveGoogleKeyForScreening(apiKey);
  messages = await screenChatMessages(messages, screenKey);

  return provider === 'openai' 
    ? await callOpenAI(apiKey, messages) 
    : await callGoogleAI(apiKey, messages);
}

async function callOpenAI(apiKey, messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 16384,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    let errorMsg = 'OpenAI API Error';
    try {
      const error = await response.json();
      errorMsg = error.error?.message || errorMsg;
    } catch (e) { errorMsg = `OpenAI API Error (HTTP ${response.status})`; }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  
  if (!data?.choices?.[0]?.message?.content) {
    console.error('[OpenAI] Empty response:', JSON.stringify(data?.choices?.slice(0, 1)));
    throw new Error('OpenAI ไม่ตอบกลับ — กรุณาลองใหม่');
  }
  
  const finishReason = data.choices[0].finish_reason;
  if (finishReason === 'length') {
    console.warn('[Story Mode] Output was truncated (hit max_tokens limit)');
  }
  
  return { text: data.choices[0].message.content, truncated: finishReason === 'length' };
}

async function callGoogleAI(apiKey, messages) {
  const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages.filter(m => m.role !== 'system');
  
  const contents = userMessages.map(msg => {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    // ★ รองรับ multimodal: msg.content เป็น array [{type:'text',...},{type:'image_url',...}] ★
    if (Array.isArray(msg.content)) {
      const parts = [];
      for (const part of msg.content) {
        if (part.type === 'text') {
          parts.push({ text: part.text });
        } else if (part.type === 'image_url' && part.image_url?.url) {
          const dataUrl = part.image_url.url;
          // แปลง data:image/xxx;base64,... → inlineData
          const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
          if (match) {
            parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
          } else {
            // URL ปกติ — ใช้ fileData (หรือ skip ถ้าไม่รองรับ)
            parts.push({ text: `[Image: ${dataUrl.substring(0, 100)}]` });
          }
        }
      }
      return { role, parts: parts.length > 0 ? parts : [{ text: String(msg.content) }] };
    }
    return { role, parts: [{ text: msg.content }] };
  });

  // ★ V1.0.9 pattern: systemInstruction แยกจาก contents (ไม่ยัด system เข้า user message แรก) ★
  const requestBody = { contents };
  if (systemPrompt && String(systemPrompt).trim()) {
    requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  // ★ V1.0.9 Gemini: temperature 0.55, topP 0.85, maxOutputTokens 16384 ★
  const data = await fetchGeminiWithFallback(apiKey, requestBody, 16384, 0.55, { topP: 0.85 });
  
  if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    const blockReason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || 'unknown';
    console.error('[Gemini] Empty response — candidates:', JSON.stringify(data?.candidates?.slice(0, 1)), 'feedback:', JSON.stringify(data?.promptFeedback));
    throw new Error(`Gemini ไม่ตอบกลับ (${blockReason}) — อาจถูก safety filter block หรือ prompt ยาวเกินไป`);
  }
  const geminiFinish = data.candidates[0].finishReason;
  return { text: data.candidates[0].content.parts[0].text, truncated: geminiFinish === 'MAX_TOKENS' };
}

// ============================================================
// ★ Step 1: Gemini Text API — สร้าง Image Prompt ภาษาอังกฤษระดับมืออาชีพ ★
// ใช้ Gemini Pro/Flash เป็น "คนคิด Prompt" ก่อนส่งไป Imagen 4
// ============================================================
async function enhancePromptWithGemini(rawPrompt, apiKey) {
  console.log('[Studio] Step 1: Enhancing prompt with Gemini Text API...');
  console.log('[Studio] Raw prompt:', rawPrompt.substring(0, 150));

  rawPrompt = await screenPromptForOutbound(rawPrompt, apiKey);
  
  try {
    // TODO: USER_PROMPT
    const systemInstruction = ``;

    const data = await fetchGeminiWithFallback(apiKey, {
      contents: [{
        parts: [{ text: `Rewrite this image prompt into a professional, detailed English prompt for AI image generation:\n\n${rawPrompt}` }]
      }],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      }
    }, 500, 0.7);

    const enhancedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (enhancedPrompt && enhancedPrompt.length > 20) {
      console.log('[Studio] ✅ Enhanced prompt:', enhancedPrompt.substring(0, 200));
      return enhancedPrompt;
    }

    console.warn('[Studio] Gemini returned empty/short response, using raw prompt');
    return rawPrompt;
  } catch (error) {
    console.warn('[Studio] enhancePromptWithGemini error:', error.message);
    return rawPrompt; // Fallback ใช้ prompt เดิม
  }
}

// ============================================================
// ★ Step 2: Gemini Imagen 4 - Image Generation API (returns array of images) ★
// ★ รองรับ studioProductImageBase64 เป็น reference ★
// ============================================================
async function generateImageWithGemini(prompt, sceneNumber, sampleCount = 4) {
  const result = await chrome.storage.local.get(['googleKey']);
  const apiKey = result.googleKey;
  
  if (!apiKey) {
    throw new Error('กรุณาตั้งค่า Google AI API Key ก่อน (ไปที่แท็บ ⚙️)');
  }
  
  console.log(`[1Click] Generating ${sampleCount} images for scene ${sceneNumber}...`);
  console.log(`[1Click] Has product image reference: ${!!studioProductImageBase64}`);
  console.log(`[1Click] Has SM product image: ${!!smProductImage}, SM character image: ${!!smCharacterImage}`);
  
  // ★ Step 1: ใช้ Gemini Text API สร้าง prompt ภาษาอังกฤษระดับมืออาชีพ ★
  console.log(`[1Click] Step 1: Enhancing prompt with Gemini Text API...`);
  const enhancedPrompt = await enhancePromptWithGemini(prompt, apiKey);
  console.log(`[1Click] Step 1 done. Enhanced prompt: ${enhancedPrompt.substring(0, 150)}...`);
  
  // ★ Step 2: ใช้ enhanced prompt ส่งไปสร้างรูปภาพ ★
  prompt = enhancedPrompt;
  
  // ★ รวม ref images: Studio ใช้ studioProductImageBase64, Storymode ใช้ smProductImage + smCharacterImage ★
  const hasProductRef = studioProductImageBase64 || smProductImage;
  const hasCharacterRef = smCharacterImage;
  const hasAnyRef = hasProductRef || hasCharacterRef;
  
  // ★ ถ้ามีรูป ref (product/character) ให้ใช้ Gemini 3.1 Flash Image multimodal ★
  if (hasAnyRef) {
    const productRefImage = studioProductImageBase64 || smProductImage;
    console.log(`[1Click] Using Gemini 3.1 Flash Image with ref images (product: ${!!productRefImage}, character: ${!!hasCharacterRef})... (${sampleCount} images requested)`);
    
    const allImages = [];
    
    // ★ Gemini 3.1 Flash Image สร้างได้ 1 รูปต่อ request → เรียกหลายครั้ง ★
    for (let i = 0; i < sampleCount; i++) {
      console.log(`[1Click] Generating image ${i + 1}/${sampleCount}...`);
      
      // Build parts with ref images + prompt
      const parts = [];
      
      // Add product image (ถ้ามี)
      if (productRefImage) {
        const base64Data = productRefImage.replace(/^data:image\/\w+;base64,/, '');
        const mimeType = productRefImage.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }
      
      // Add character image (ถ้ามี — Storymode only)
      if (hasCharacterRef) {
        const charBase64 = smCharacterImage.replace(/^data:image\/\w+;base64,/, '');
        const charMime = smCharacterImage.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
        parts.push({
          inlineData: {
            mimeType: charMime,
            data: charBase64
          }
        });
      }
      
      // ★ v2.61: Build ref instructions — เน้น clothing + outfit + accessories ★
      let refInstructions = '';
      if (productRefImage && hasCharacterRef) {
        refInstructions = `🚨 MANDATORY REFERENCE MATCHING — STRICTLY FOLLOW:
Two reference images attached: FIRST = PRODUCT, SECOND = CHARACTER/PERSON.

📦 PRODUCT (1st image): Use the EXACT same product — same brand name, same packaging design, same colors, same logo. Do NOT replace with a similar or generic product.

👤 CHARACTER (2nd image) — THIS IS THE MOST IMPORTANT RULE:

🔒 FACE & APPEARANCE (NON-NEGOTIABLE):
- SKIN TONE: MUST match EXACTLY. If reference person has FAIR/LIGHT skin → generate FAIR/LIGHT skin. Do NOT darken the skin. Do NOT change skin color at all.
- FACE: Same face shape, same eyes, same nose, same lips, same jawline — must be recognizably the SAME person
- HAIR: Same hairstyle, same hair color, same hair length
- AGE: Same approximate age range
- ETHNICITY: Do NOT change the person's ethnicity or racial appearance
- ⚠️ Do NOT describe body shape, body proportions, or how clothing fits the body. Focus on face and outfit design only.

👗 CLOTHING & OUTFIT (CRITICAL — DO NOT CHANGE):
- The character MUST wear the EXACT SAME OUTFIT as shown in the reference photo
- SAME clothing style, SAME clothing color, SAME fabric type, SAME neckline
- SAME accessories: jewelry, earrings, necklace, glasses — copy EXACTLY from reference
- DO NOT replace the outfit with a different one (e.g. do NOT change a pink camisole to a white shirt)
- If reference shows casual wear → keep casual. If formal → keep formal. MATCH EXACTLY.`;
      } else if (productRefImage) {
        refInstructions = `🚨 MANDATORY PRODUCT MATCHING:
The reference image is the PRODUCT. Use the EXACT same product — same brand, packaging, colors, logo. Do NOT substitute.`;
      } else if (hasCharacterRef) {
        refInstructions = `🚨 MANDATORY CHARACTER MATCHING — STRICTLY FOLLOW:
The reference image is the CHARACTER/PERSON.

🔒 FACE & APPEARANCE:
- SKIN TONE: MUST match EXACTLY. If fair/light skin → generate fair/light skin. Do NOT darken.
- FACE: Same face shape, eyes, nose, lips, jawline — must be the SAME person
- HAIR: Same hairstyle, hair color, hair length
- AGE: Same approximate age. Do NOT change ethnicity.
- ⚠️ Do NOT describe body shape or proportions. Focus on face and outfit design only.

👗 CLOTHING & OUTFIT (DO NOT CHANGE):
- MUST wear the EXACT SAME OUTFIT from the reference photo
- SAME style, color, fabric, neckline, accessories
- DO NOT replace the outfit with a different one.`;
      }
      
      // Add prompt with instruction to use ref images (add variation hint)
      parts.push({
        text: `${refInstructions}

🎯 PRIMARY TASK: Generate a product review scene using the EXACT references provided.

📦 REQUIREMENTS (MANDATORY):
1. ${productRefImage ? 'The product MUST be the EXACT SAME item from the reference — same brand, same package, same colors, same logo' : 'Focus on the scene described below'}
2. ${hasCharacterRef ? 'The character MUST be the SAME PERSON from the reference — SAME SKIN TONE (do NOT darken or change), same face, same hair, SAME OUTFIT/CLOTHING from reference photo' : 'Character should match the scene description'}
3. ${productRefImage ? 'The product must be clearly visible and be the MAIN FOCUS of the image' : ''}
4. Keep ALL visual details accurate — especially SKIN TONE, CLOTHING/OUTFIT, and PRODUCT BRANDING

🎨 SCENE REQUIREMENTS:
${prompt}

📐 FORMAT:
- Aspect ratio: 9:16 (vertical portrait format)
${productRefImage ? '- The product should occupy at least 30-50% of the image' : ''}
- Variation ${i + 1}: Different angle/composition but SAME references

❌ ABSOLUTE VIOLATIONS (will result in rejection):
- Changing the person's SKIN TONE or SKIN COLOR
- Changing the person's FACE or ETHNICITY
- Changing the person's CLOTHING/OUTFIT to something different from the reference
- Using a different product or brand
- Adding any text, words, letters, or typography in the image`
      });
      
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: parts }],
              generationConfig: {
                responseModalities: ['TEXT', 'IMAGE']
              }
            })
          }
        );
        
        if (!response.ok) {
          const error = await response.json();
          console.error(`[1Click] Gemini API Error (image ${i + 1}):`, error);
          continue; // Skip this image, try next
        }
        
        const data = await response.json();
        
        // Extract images from response
        if (data.candidates?.[0]?.content?.parts) {
          for (const part of data.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const imgMime = part.inlineData.mimeType || 'image/png';
              allImages.push(`data:${imgMime};base64,${part.inlineData.data}`);
            }
          }
        }
      } catch (e) {
        console.error(`[1Click] Error generating image ${i + 1}:`, e);
      }
      
      // Small delay between requests to avoid rate limiting
      if (i < sampleCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (allImages.length > 0) {
      console.log(`[1Click] Generated ${allImages.length} image(s) with ref images (product: ${!!productRefImage}, character: ${!!hasCharacterRef})`);
      return allImages;
    }
    
    throw new Error('ไม่ได้รับรูปภาพจาก Gemini API');
  }
  
  // ★ ถ้าไม่มีรูปสินค้า ใช้ Gemini 3.1 Flash Image (Nano Banana 2) text-to-image ★
  console.log(`[1Click] Using Gemini 3.1 Flash Image (Nano Banana 2) text-to-image... (${sampleCount} images requested)`);
  
  const allImages = [];
  
  // ★ Gemini 3.1 Flash Image สร้างได้ 1 รูปต่อ request → เรียกหลายครั้ง ★
  for (let i = 0; i < sampleCount; i++) {
    console.log(`[1Click] Generating image ${i + 1}/${sampleCount} (no product ref)...`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Generate an image based on this prompt. Aspect ratio: 9:16 (vertical portrait format). No text, no watermark, no trademark, no subtitles. Variation ${i + 1}.\n\n${prompt}` }]
            }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE']
            }
          })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        console.error(`[1Click] Gemini 3.1 Flash Image Error (image ${i + 1}):`, error);
        continue;
      }
      
      const data = await response.json();
      
      if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const imgMime = part.inlineData.mimeType || 'image/png';
            allImages.push(`data:${imgMime};base64,${part.inlineData.data}`);
            console.log(`[1Click] ✅ Image ${i + 1} generated successfully`);
          }
        }
      }
    } catch (err) {
      console.error(`[1Click] Image ${i + 1} generation error:`, err.message);
    }
    
    // รอ 1 วินาทีระหว่าง request เพื่อไม่ให้ rate limit
    if (i < sampleCount - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  if (allImages.length > 0) {
    console.log(`[1Click] Generated ${allImages.length} image(s) via Gemini 3.1 Flash Image`);
    return allImages;
  }
  
  throw new Error('ไม่ได้รับรูปภาพจาก Gemini 3.1 Flash Image API');
}

// ============================================================
// Veo 3.1 - Video Generation API (Long Running Operation)
// ============================================================
async function generateVideoWithVeo3(prompt, imageBase64, sceneNumber) {
  const result = await chrome.storage.local.get(['googleKey']);
  const apiKey = result.googleKey;
  
  if (!apiKey) {
    throw new Error('กรุณาตั้งค่า Google AI API Key ก่อน (ไปที่แท็บ ⚙️)');
  }
  
  console.log(`[1Click] Generating video for scene ${sceneNumber}...`);

  prompt = await screenPromptForOutbound(prompt, apiKey);
  
  // Build request body
  const requestBody = {
    instances: [{
      prompt: prompt
    }],
    parameters: {
      aspectRatio: '9:16'
    }
  };
  
  // Add reference image if available
  if (imageBase64) {
    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const base64Only = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    requestBody.instances[0].image = {
      bytesBase64Encoded: base64Only,
      mimeType: mimeType
    };
  }
  
  // Start generation (returns long-running operation)
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Veo 3.1 API Error');
  }

  const opData = await response.json();
  const operationName = opData.name;
  
  if (!operationName) {
    throw new Error('ไม่ได้รับ operation name จาก Veo 3.1');
  }
  
  console.log(`[1Click] Veo 3.1 operation started: ${operationName}`);
  
  // Poll for completion (max 5 minutes)
  const maxWait = 300000;
  const pollInterval = 10000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    const pollResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
      {
        method: 'GET',
        headers: { 'x-goog-api-key': apiKey }
      }
    );
    
    if (!pollResponse.ok) {
      const pollError = await pollResponse.json();
      throw new Error(pollError.error?.message || 'Veo 3.1 polling error');
    }
    
    const pollData = await pollResponse.json();
    
    if (pollData.done) {
      if (pollData.error) {
        throw new Error(pollData.error.message || 'Veo 3.1 generation failed');
      }
      
      console.log('[1Click] Veo 3.1 poll done, full response:', JSON.stringify(pollData, null, 2));
      
      // Try multiple response structures
      const resp = pollData.response || pollData.metadata || pollData;
      const videoResponse = resp.generateVideoResponse || resp;
      const samples = videoResponse?.generatedSamples || videoResponse?.videos || [];
      
      if (samples.length > 0) {
        const videoObj = samples[0].video || samples[0];
        const videoUri = videoObj.uri || videoObj.url;
        
        if (videoUri) {
          console.log(`[1Click] Veo 3.1 video ready, downloading from URI: ${videoUri}`);
          
          const videoResp = await fetch(videoUri, {
            headers: { 'x-goog-api-key': apiKey }
          });
          if (!videoResp.ok) throw new Error('ดาวน์โหลดวีดีโอจาก URI ไม่สำเร็จ');
          
          const videoBlob = await videoResp.blob();
          return URL.createObjectURL(videoBlob);
        }
        
        // Check for base64 encoded video
        const b64 = videoObj.bytesBase64Encoded || videoObj.base64;
        if (b64) {
          console.log(`[1Click] Veo 3.1 video ready (base64)`);
          return `data:video/mp4;base64,${b64}`;
        }
      }
      
      // Last resort: log full structure to help debug
      console.error('[1Click] Veo 3.1 unexpected response structure:', JSON.stringify(pollData));
      throw new Error('ไม่ได้รับวีดีโอจาก Veo 3.1 — ดู Console log เพื่อตรวจสอบ response');
    }
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`[1Click] Veo 3.1 still generating... (${elapsed}s)`);
    
    // Update UI with progress
    const previewArea = document.querySelector(`.scene-media-preview[data-scene="${sceneNumber}"] .vid-preview`);
    if (previewArea) {
      previewArea.innerHTML = `<div class="media-loading"><div class="spinner-sm"></div><span>กำลังสร้างวีดีโอ... (${elapsed} วิ)</span></div>`;
    }
  }
  
  throw new Error('Veo 3.1 timeout: รอนานเกิน 5 นาที');
}

// ============================================================
// Scene Image Generation Handler (called from scene card button)
// ============================================================
let generatedImages = {};  // { sceneNumber: base64DataUrl }
let generatedVideos = {};  // { sceneNumber: base64DataUrl }

async function handleGenerateImage(sceneNumber, prompt) {
  const btn = document.querySelector(`.gen-img-btn[data-scene="${sceneNumber}"]`);
  const previewArea = document.querySelector(`.scene-media-preview[data-scene="${sceneNumber}"] .img-preview`);
  
  if (!btn || !previewArea) return;
  
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> กำลังสร้าง...';
  previewArea.innerHTML = '<div class="media-loading"><div class="spinner-sm"></div><span>กำลังสร้างรูป...</span></div>';
  
  try {
    const imageDataUrl = await generateImageWithGemini(prompt, sceneNumber);
    generatedImages[sceneNumber] = imageDataUrl;
    
    previewArea.innerHTML = `
      <img src="${imageDataUrl}" alt="Scene ${sceneNumber}" class="preview-img" />
      <div class="preview-actions">
        <button class="preview-action-btn download-img" data-scene="${sceneNumber}" title="ดาวน์โหลด">💾</button>
      </div>
    `;
    
    // Add download listener
    previewArea.querySelector('.download-img')?.addEventListener('click', () => {
      downloadBase64File(imageDataUrl, `scene_${sceneNumber}_image.png`);
    });
    
    btn.innerHTML = '✅ สร้างเสร็จ';
    btn.disabled = false;
    setTimeout(() => { btn.innerHTML = '🖼️ สร้างรูปใหม่'; }, 2000);
    
  } catch (error) {
    console.error(`[1Click] Image gen error scene ${sceneNumber}:`, error);
    previewArea.innerHTML = `<div class="media-error">❌ ${error.message}</div>`;
    btn.innerHTML = '🖼️ สร้างรูป';
    btn.disabled = false;
  }
}

// ============================================================
// Scene Video Generation Handler (called from scene card button)
// ============================================================
async function handleGenerateVideo(sceneNumber, prompt) {
  const btn = document.querySelector(`.gen-vid-btn[data-scene="${sceneNumber}"]`);
  const previewArea = document.querySelector(`.scene-media-preview[data-scene="${sceneNumber}"] .vid-preview`);
  
  if (!btn || !previewArea) return;
  
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> กำลังสร้าง...';
  previewArea.innerHTML = '<div class="media-loading"><div class="spinner-sm"></div><span>กำลังสร้างวีดีโอ... (อาจใช้เวลา 2-5 นาที)</span></div>';
  
  try {
    const imageBase64 = generatedImages[sceneNumber] || null;
    const videoDataUrl = await generateVideoWithVeo3(prompt, imageBase64, sceneNumber);
    generatedVideos[sceneNumber] = videoDataUrl;
    
    previewArea.innerHTML = `
      <video src="${videoDataUrl}" controls playsinline class="preview-vid"></video>
      <div class="preview-actions">
        <button class="preview-action-btn download-vid" data-scene="${sceneNumber}" title="ดาวน์โหลด">💾</button>
      </div>
    `;
    
    // Add download listener (videoDataUrl may be blob URL or data URL)
    previewArea.querySelector('.download-vid')?.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = videoDataUrl;
      a.download = `scene_${sceneNumber}_video.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
    
    btn.innerHTML = '✅ สร้างเสร็จ';
    btn.disabled = false;
    setTimeout(() => { btn.innerHTML = '🎬 สร้างวีดีโอใหม่'; }, 2000);
    
  } catch (error) {
    console.error(`[1Click] Video gen error scene ${sceneNumber}:`, error);
    previewArea.innerHTML = `<div class="media-error">❌ ${error.message}</div>`;
    btn.innerHTML = '🎬 สร้างวีดีโอ';
    btn.disabled = false;
  }
}

// ============================================================
// Generate All Images + Videos for all scenes
// ============================================================
async function handleGenerateAllMedia() {
  const btn = document.getElementById('generate-all-media-btn');
  if (!btn) return;
  
  const sceneCards = document.querySelectorAll('.scene-card');
  if (sceneCards.length === 0) return;
  
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> กำลังสร้างทั้งหมด...';
  
  let completed = 0;
  const total = sceneCards.length;
  
  for (const card of sceneCards) {
    const sceneNum = card.querySelector('.scene-number')?.textContent?.match(/\d+/)?.[0];
    if (!sceneNum) continue;
    
    // Generate image first
    const imgBtn = card.querySelector('.gen-img-btn');
    if (imgBtn && !generatedImages[sceneNum]) {
      const imgPrompt = imgBtn.getAttribute('data-prompt');
      if (imgPrompt) {
        await handleGenerateImage(sceneNum, imgPrompt);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    // Then generate video
    const vidBtn = card.querySelector('.gen-vid-btn');
    if (vidBtn && !generatedVideos[sceneNum]) {
      const vidPrompt = vidBtn.getAttribute('data-prompt');
      if (vidPrompt) {
        await handleGenerateVideo(sceneNum, vidPrompt);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    completed++;
    btn.innerHTML = `<span class="spinner-sm"></span> ${completed}/${total} ฉาก...`;
  }
  
  btn.disabled = false;
  btn.innerHTML = '🚀 สร้างทั้งหมด (รูป + วีดีโอ)';
}

// ============================================================
// Merge all generated videos into one
// ============================================================
async function handleMergeVideos() {
  const btn = document.getElementById('merge-videos-btn');
  if (!btn) return;
  
  const videoKeys = Object.keys(generatedVideos).sort((a, b) => parseInt(a) - parseInt(b));
  if (videoKeys.length === 0) {
    alert('ยังไม่มีวีดีโอที่สร้างไว้');
    return;
  }
  
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> กำลังรวมวีดีโอ...';
  
  try {
    // Convert base64 videos to blobs
    const videoBlobs = [];
    for (const key of videoKeys) {
      const dataUrl = generatedVideos[key];
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      videoBlobs.push(blob);
    }
    
    // Simple concatenation using MediaSource or blob concat
    const mergedBlob = new Blob(videoBlobs, { type: 'video/mp4' });
    const url = URL.createObjectURL(mergedBlob);
    
    // Download merged video
    const a = document.createElement('a');
    a.href = url;
    a.download = `merged_video_${videoKeys.length}scenes_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    btn.innerHTML = '✅ ดาวน์โหลดแล้ว!';
    setTimeout(() => { btn.innerHTML = '🎞️ รวมวีดีโอทั้งหมด'; btn.disabled = false; }, 2000);
    
  } catch (error) {
    console.error('[1Click] Merge error:', error);
    alert('รวมวีดีโอไม่สำเร็จ: ' + error.message);
    btn.innerHTML = '🎞️ รวมวีดีโอทั้งหมด';
    btn.disabled = false;
  }
}

// ============================================================
// Helper: Download base64 data as file
// ============================================================
function downloadBase64File(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ============================================================
// Studio Tab — Flow-based System (Content + Style → Master Prompt → Scenes)
// ============================================================
let studioItems = []; // { type:'image'|'video', url:string, label:string, prompt:string, selected:boolean }
let selectedImageUrl = null; // รูปที่เลือกไว้สำหรับสร้างวีดีโอ
let studioScenes = []; // { id, prompt, type:'image'|'video', status:'pending'|'generating'|'done', result:null }
let studioMasterPrompt = '';
let studioProductImageBase64 = null;

// Studio style selections
let studioSelectedNarratives = [];
let studioSelectedMood = 'cinematic';
let studioSelectedVisual = 'disney';

// === Helper: Build Gemini API parts with all selected Studio data ===
function buildStudioGeminiParts(textPrompt) {
  // TODO: USER_PROMPT
  const parts = [];
  
  // 1. Add product image if uploaded
  if (studioProductImageBase64) {
    const base64Data = studioProductImageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = studioProductImageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    });
    parts.push({ text: `[PRODUCT IMAGE ABOVE]` });
  }
  
  // 2. Add all selected style context
  const styleContext = ``;
  
  // 3. Combine style context with text prompt
  parts.push({ text: styleContext + textPrompt });
  
  return parts;
}

function initStudioTab() {
  updateStudioApiStatus();
  initStudioStyleDropdowns();

  // === Paste Prompt from 1CLICK Web App (clipboard bridge) ===
  document.getElementById('studio-paste-btn')?.addEventListener('click', async () => {
    const msgEl = document.getElementById('studio-paste-msg');
    try {
      const text = await navigator.clipboard.readText();
      const payload = JSON.parse(text);
      if (payload._type !== '1click_bridge_v1') throw new Error('รูปแบบ Clipboard ไม่ถูกต้อง');
      if (payload.productName) {
        const nameEl = document.getElementById('studio-product-name');
        if (nameEl) nameEl.value = payload.productName;
      }
      if (payload.mainPrompt) {
        const promptEl = document.getElementById('studio-main-prompt');
        if (promptEl) promptEl.value = payload.mainPrompt;
      }
      if (msgEl) { msgEl.textContent = '✅ วาง Prompt จาก Web App แล้ว'; msgEl.className = 'studio-paste-msg'; }
      setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 3000);
    } catch (e) {
      if (msgEl) {
        msgEl.textContent = `❌ ${e.message || 'ไม่สามารถอ่าน Clipboard ได้'}`;
        msgEl.className = 'studio-paste-msg err';
        setTimeout(() => { msgEl.textContent = ''; }, 3000);
      }
    }
  });

  // === Product Image Upload ===
  const uploadArea = document.getElementById('studio-product-upload');
  const fileInput = document.getElementById('studio-product-file');
  const previewEl = document.getElementById('studio-product-preview');
  
  if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        studioProductImageBase64 = ev.target.result;
        if (previewEl) {
          previewEl.innerHTML = `<img src="${studioProductImageBase64}" alt="Product" />`;
        }
        uploadArea.innerHTML = '<span>✅ อัพโหลดแล้ว (คลิกเพื่อเปลี่ยน)</span>';
      };
      reader.readAsDataURL(file);
    });
  }
  
  // === Generate Master Prompt Button ===
  document.getElementById('studio-generate-master-btn')?.addEventListener('click', async () => {
    await generateStudioMasterPrompt();
  });
  
  // === Add Scene Button ===
  document.getElementById('studio-add-scene-btn')?.addEventListener('click', () => {
    addStudioScene();
  });
  
  // === Generate Image Button (Pipeline) ===
  document.getElementById('studio-gen-img-btn')?.addEventListener('click', async () => {
    await generateStudioImages();
  });
  
  // === Generate Video Button (Pipeline) ===
  document.getElementById('studio-gen-vid-btn')?.addEventListener('click', async () => {
    await generateStudioVideos();
  });
}

// Studio scene count
let studioSceneCount = 5;

// === Initialize Studio Style Dropdowns ===
function initStudioStyleDropdowns() {
  // SCENE COUNT dropdown
  const sceneCountMenu = document.getElementById('studio-menu-scene-count');
  const sceneCountBtn = document.getElementById('studio-btn-scene-count');
  
  if (sceneCountMenu) {
    const sceneOptions = [];
    for (let i = 1; i <= 20; i++) {
      let label = `${i} ฉาก`;
      if (i === 5) label += ' ⭐';
      if (i === 10) label += ' 🔥';
      sceneOptions.push({ value: i, label });
    }
    
    sceneCountMenu.innerHTML = sceneOptions.map(opt => `
      <div class="sm-dropdown-item ${opt.value === studioSceneCount ? 'selected' : ''}" data-value="${opt.value}">
        <span class="sm-dropdown-item-name">${opt.label}</span>
      </div>
    `).join('');
    
    sceneCountMenu.querySelectorAll('.sm-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        studioSceneCount = parseInt(item.dataset.value);
        sceneCountMenu.querySelectorAll('.sm-dropdown-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        if (sceneCountBtn) {
          let label = `${studioSceneCount} ฉาก`;
          if (studioSceneCount === 5) label += ' ⭐';
          if (studioSceneCount === 10) label += ' 🔥';
          sceneCountBtn.querySelector('.sm-dropdown-value').textContent = label;
        }
        sceneCountMenu.classList.remove('show');
      });
    });
  }
  
  if (sceneCountBtn) {
    sceneCountBtn.addEventListener('click', () => {
      sceneCountMenu?.classList.toggle('show');
    });
  }
  
  // Close scene count dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#studio-dropdown-scene-count')) {
      sceneCountMenu?.classList.remove('show');
    }
  });

  // NARRATIVE STYLE (multi-select) - 40 Character Styles
  const narrativeStyles = [
    // หมวดของพูดได้
    { id: 'veggie_gangster', name: 'ผักนักเลง / อาหารขี้บ่น', icon: '🥦' },
    { id: 'organ_tough_love', name: 'อวัยวะ Tough Love (ตับ ไต ไส้ พุง)', icon: '🧠' },
    { id: 'appliance_life', name: 'เครื่องใช้ไฟฟ้าสู้ชีวิต', icon: '🔌' },
    { id: 'politics_satire', name: 'การเมืองจอมแซะ', icon: '🏛️' },
    { id: 'money_wallet', name: 'เงินในบัญชี / กระเป๋าตังค์', icon: '💸' },
    { id: 'ghost_shrine', name: 'ผีเจ้าที่ / ผีบ้านผีเรือน', icon: '⛩️' },
    { id: 'land_house', name: 'โฉนดที่ดิน / บ้านขี้เหงา', icon: '🏠' },
    { id: 'package_sad', name: 'พัสดุขี้น้อยใจ', icon: '📦' },
    { id: 'lucky_charm', name: 'ไอเทมสายมู / เครื่องราง', icon: '📿' },
    { id: 'skincare_cream', name: 'สกินแคร์ / ครีมซอง', icon: '🧴' },
    { id: 'inner_voice', name: 'เสียงในหัว (Inner Voice)', icon: '😈' },
    { id: 'alarm_clock', name: 'นาฬิกาปลุกจอมด่า', icon: '⏰' },
    { id: 'computer_office', name: 'คอมพิวเตอร์ / โน้ตบุ๊กออฟฟิศ', icon: '💻' },
    { id: 'coffee_milk_tea', name: 'กาแฟ / ชานมเพื่อนรัก', icon: '☕' },
    { id: 'energy_bar', name: 'พลังงาน (Energy Bar)', icon: '⚡' },
    { id: 'pet_gossip', name: 'สัตว์เลี้ยงนินทาเจ้าของ', icon: '🐈' },
    { id: 'plant_talk', name: 'ต้นไม้พูดได้', icon: '🪴' },
    { id: 'shoes_passport', name: 'รองเท้า / พาสปอร์ต', icon: '👟' },
    { id: 'dating_app', name: 'แอปนัดเดท / มือถือ', icon: '📱' },
    { id: 'closet_clothes', name: 'เสื้อผ้าในตู้', icon: '👗' },
    // หมวดคาแรคเตอร์ไวรัล
    { id: 'de_influencer', name: 'สายช็อตฟีล (บอกตรงๆ ไม่เชียร์)', icon: '🛑' },
    { id: 'fortune_teller', name: 'สายมูเตลู (ดูดวง เสริมดวง)', icon: '🔮' },
    { id: 'asmr_seller', name: 'ASMR ขายเงียบๆ (เสียงกระซิบ)', icon: '🤫' },
    { id: 'over_sharer', name: 'เล่าหมดเปลือก (แชร์ทุกเรื่อง)', icon: '🤯' },
    { id: 'main_character', name: 'ตัวเอกของเรื่อง / มุมมองคนที่ 1', icon: '💅' },
    { id: 'investigator', name: 'สายสืบสวน (เจาะลึก ค้นหาความจริง)', icon: '🕵️' },
    // หมวดภาษาถิ่น
    { id: 'isan_joy', name: 'ไทบ้านม่วนซื่น (สำเนียงอีสาน สนุก)', icon: '🇹🇭' },
    { id: 'southern_direct', name: 'คนใต้ใจเต็ม (สำเนียงใต้ พูดตรง)', icon: '🌴' },
    { id: 'northern_chill', name: 'สาวเจียงใหม่ (สำเนียงเหนือ อ่อนหวาน)', icon: '🏔️' },
    // หมวดคาแรคเตอร์โซเชียลไทย
    { id: 'sassy_queen', name: 'ตัวมารดาโฮ่งๆ (แซ่บ จัดจ้าน)', icon: '👑' },
    { id: 'gossiper', name: 'สายเผือก / ป้าข้างบ้าน (ชอบนินทา)', icon: '🗣️' },
    { id: 'self_made', name: 'วัยรุ่นสร้างตัว (ขยัน ทำเอง)', icon: '💰' },
    { id: 'prankster_couple', name: 'คู่รักหยุมหัว (แกล้งกัน ขำๆ)', icon: '💑' },
    { id: 'underdog', name: 'สู้ชีวิต (จากศูนย์สู่ฮีโร่)', icon: '🥊' },
    { id: 'voiceover_troll', name: 'นักพากย์นรก (พากย์เสียงตลก)', icon: '🎭' },
    { id: 'fangirl', name: 'ติ่งอวยยศ (แฟนคลับคลั่ง)', icon: '🤩' },
    { id: 'local_guru', name: 'สูตรผีบอก (ภูมิปัญญาชาวบ้าน)', icon: '👴' },
    { id: 'mindset_coach', name: 'ไลฟ์โค้ช (สร้างแรงบันดาลใจ)', icon: '🧘' },
    { id: 'satirist', name: 'สายแซะสังคม (เสียดสีขำๆ)', icon: '🎪' },
    { id: 'glutton', name: 'สายกินดุดัน (กินจุ รีวิวอาหาร)', icon: '🍜' }
  ];
  
  const narrativeMenu = document.getElementById('studio-menu-narrative');
  const narrativeBtn = document.getElementById('studio-btn-narrative');
  const narrativeTags = document.getElementById('studio-selected-narrative-tags');
  
  if (narrativeMenu) {
    narrativeMenu.innerHTML = narrativeStyles.map(s => `
      <div class="sm-dropdown-item" data-value="${s.id}">
        <span class="sm-dropdown-item-icon">${s.icon}</span>
        <span class="sm-dropdown-item-name">${s.name}</span>
        <span class="sm-dropdown-item-check"></span>
      </div>
    `).join('');
    
    narrativeMenu.querySelectorAll('.sm-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = item.dataset.value;
        if (studioSelectedNarratives.includes(val)) {
          studioSelectedNarratives = studioSelectedNarratives.filter(v => v !== val);
          item.classList.remove('selected');
        } else {
          studioSelectedNarratives.push(val);
          item.classList.add('selected');
        }
        updateStudioNarrativeTags();
      });
    });
  }
  
  if (narrativeBtn) {
    narrativeBtn.addEventListener('click', () => {
      narrativeMenu?.classList.toggle('show');
    });
  }
  
  function updateStudioNarrativeTags() {
    if (!narrativeTags) return;
    if (studioSelectedNarratives.length === 0) {
      narrativeTags.textContent = 'เลือกแล้ว: —';
    } else {
      const names = studioSelectedNarratives.map(id => {
        const s = narrativeStyles.find(x => x.id === id);
        if (!s) return id;
        return (s.icon ? s.icon + ' ' : '') + s.name;
      });
      narrativeTags.textContent = 'เลือกแล้ว: ' + names.join(', ');
    }
  }
  
  // MOOD KEYWORDS
  const moodOptions = [
    { id: 'cinematic', name: 'ซีนีมาติก มาตรฐาน (ภาพยนตร์ทั่วไป)', icon: '🎬' },
    { id: 'dramatic', name: 'ดราม่า เข้มข้น (อารมณ์รุนแรง)', icon: '🔥' },
    { id: 'peaceful', name: 'สงบ ผ่อนคลาย (โทนอ่อนโยน)', icon: '🌿' },
    { id: 'energetic', name: 'มีพลัง สดใส (ตื่นเต้น กระฉับกระเฉง)', icon: '⚡' },
    { id: 'romantic', name: 'โรแมนติก นุ่มนวล (หวาน อบอุ่น)', icon: '💕' },
    { id: 'mysterious', name: 'ลึกลับ มืด (น่าค้นหา)', icon: '🌙' },
    { id: 'playful', name: 'สนุกสนาน ขี้เล่น (สดใส ร่าเริง)', icon: '🎉' },
    { id: 'professional', name: 'มืออาชีพ สะอาด (น่าเชื่อถือ)', icon: '💼' }
  ];
  
  const moodMenu = document.getElementById('studio-menu-mood');
  const moodBtn = document.getElementById('studio-btn-mood');
  
  if (moodMenu) {
    moodMenu.innerHTML = moodOptions.map(m => `
      <div class="sm-dropdown-item ${m.id === studioSelectedMood ? 'selected' : ''}" data-value="${m.id}">
        <span class="sm-dropdown-item-icon">${m.icon}</span>
        <span class="sm-dropdown-item-name">${m.name}</span>
      </div>
    `).join('');
    
    moodMenu.querySelectorAll('.sm-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        studioSelectedMood = item.dataset.value;
        moodMenu.querySelectorAll('.sm-dropdown-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        const opt = moodOptions.find(m => m.id === studioSelectedMood);
        if (moodBtn) {
          moodBtn.querySelector('.sm-dropdown-value').textContent = opt?.name || studioSelectedMood;
          moodBtn.querySelector('.sm-dropdown-icon').textContent = opt?.icon || '🎬';
        }
        moodMenu.classList.remove('show');
      });
    });
  }
  
  if (moodBtn) {
    moodBtn.addEventListener('click', () => {
      moodMenu?.classList.toggle('show');
    });
  }
  
  // VISUAL / ART STYLE - 40 Visual Styles
  const visualOptions = [
    // กลุ่มความนิยมสูงสุด (Mainstream)
    { id: 'cinematic', name: 'ซีนีมาติกสมจริง (ภาพยนตร์คมชัด)', icon: '🎬' },
    { id: 'disney', name: 'แอนิเมชัน 3D (สไตล์ Pixar การ์ตูน 3 มิติ)', icon: '🏰' },
    { id: 'ghibli', name: 'สไตล์จิบลิ (การ์ตูนญี่ปุ่นอบอุ่น)', icon: '🌿' },
    { id: 'claymation', name: 'รูปปั้นดินน้ำมัน (เหมือนปั้นมือ)', icon: '🎨' },
    { id: 'amigurumi', name: 'ถักไหมพรม (น่ารัก นุ่มนิ่ม)', icon: '🧶' },
    { id: 'plushie', name: 'ตุ๊กตาผ้าขนฟู (ตุ๊กตาน่ากอด)', icon: '🧸' },
    { id: 'paper_cutout', name: 'กระดาษตัด (งานฝีมือกระดาษ)', icon: '✂️' },
    { id: 'dragonball', name: 'สไตล์ดราก้อนบอล (การ์ตูนต่อสู้)', icon: '🐉' },
    { id: '90s_anime', name: 'อนิเมะยุค 90 (การ์ตูนญี่ปุ่นย้อนยุค)', icon: '🌙' },
    { id: 'gta_style', name: 'สไตล์ GTA (หน้าจอโหลดเกม)', icon: '🔫' },
    { id: 'watercolor', name: 'สีน้ำ (ภาพวาดนุ่มนวล)', icon: '🎨' },
    { id: 'chalk_art', name: 'ภาพวาดชอล์ก (วาดบนกระดานดำ)', icon: '☕' },
    { id: 'oil_painting', name: 'สีน้ำมัน (ภาพวาดคลาสสิก)', icon: '🖼️' },
    { id: 'pop_art', name: 'ป๊อปอาร์ต (สีจัด ตัดกันแรง)', icon: '💥' },
    { id: 'pixel_art', name: 'พิกเซลอาร์ต (เกมย้อนยุค 8-bit)', icon: '👾' },
    { id: 'cyberpunk', name: 'ไซเบอร์พังค์ / นีออน (ล้ำสมัย เรืองแสง)', icon: '🌃' },
    { id: 'vector_flat', name: 'ภาพเวกเตอร์แบน (กราฟิกเรียบง่าย)', icon: '📱' },
    { id: 'lego_style', name: 'สไตล์เลโก้ (ตัวต่อพลาสติก)', icon: '🧱' },
    { id: 'vaporwave', name: 'เวเปอร์เวฟ (ย้อนยุค สีม่วงชมพู)', icon: '🏛️' },
    { id: 'emoji_style', name: 'สไตล์อีโมจิ (ไอคอนน่ารัก)', icon: '😊' },
    // กลุ่ม Mood & Tone
    { id: 'mute_earth', name: 'โทนดิน เงียบสงบ (สีธรรมชาติอ่อนๆ)', icon: '🤎' },
    { id: 'mutelu_mystical', name: 'สายมู ลึกลับ (เครื่องราง โหราศาสตร์)', icon: '🕉️' },
    { id: 'thai_street', name: 'ถนนไทยยามค่ำ (บรรยากาศตลาดกลางคืน)', icon: '🍜' },
    { id: 'rainy_lonely', name: 'วันฝนตก เหงาๆ (อารมณ์อ่อนไหว)', icon: '🌧️' },
    { id: 'thai_vintage', name: 'ไทยวินเทจ (ย้อนยุคเมืองเก่า)', icon: '🎞️' },
    { id: 'y2k_pop', name: 'Y2K ไทยป๊อป (แฟชั่นยุค 2000)', icon: '🪩' },
    { id: 'vivid_summer', name: 'ซัมเมอร์ไทยสดใส (สีจัด แดดร้อน)', icon: '☀️' },
    { id: 'rich_flex', name: 'รวยอวดของ (หรูหรา โชว์ไลฟ์สไตล์)', icon: '🤑' },
    { id: 'local_homey', name: 'บ้านๆ อบอุ่น (สไตล์ชาวบ้านน่ารัก)', icon: '🏡' },
    { id: 'surreal_comedy', name: 'ตลกเหนือจริง (แปลก ขำ ไม่คาดคิด)', icon: '🤡' },
    // กลุ่ม Camera & Technique
    { id: 'ugc_raw', name: 'UGC ดิบๆ (ถ่ายมือถือไม่ปรุงแต่ง)', icon: '📱' },
    { id: 'fisheye', name: 'เลนส์ฟิชอาย (มุมกว้างบิดเบี้ยว)', icon: '👁️' },
    { id: 'bodycam_pov', name: 'กล้องติดตัว / มุมมองคนที่ 1', icon: '🏃' },
    { id: 'hyper_macro', name: 'มาโครซูมใกล้ (เห็นรายละเอียดจิ๋ว)', icon: '🔍' },
    { id: 'glitch', name: 'กลิทช์บิดเบี้ยว (ภาพเพี้ยน สั่น)', icon: '📺' },
    { id: 'old_money', name: 'Old Money (รวยเก่า หรูเรียบ)', icon: '🕰️' },
    { id: 'lofi_chill', name: 'โลไฟ ชิลล์ (เพลงเบาๆ ผ่อนคลาย)', icon: '🎧' },
    { id: 'liminal_space', name: 'พื้นที่เหนือจริง (ฝันกลางวัน ประหลาด)', icon: '🚪' },
    { id: 'cottagecore', name: 'คอทเทจคอร์ (ชนบท เทพนิยาย)', icon: '🍄' },
    { id: 'paparazzi', name: 'ปาปารัสซี่ (แฟลชแรง สไตล์แอบถ่าย)', icon: '📸' }
  ];
  
  const visualMenu = document.getElementById('studio-menu-visual');
  const visualBtn = document.getElementById('studio-btn-visual');
  
  if (visualMenu) {
    visualMenu.innerHTML = visualOptions.map(v => `
      <div class="sm-dropdown-item ${v.id === studioSelectedVisual ? 'selected' : ''}" data-value="${v.id}">
        <span class="sm-dropdown-item-icon">${v.icon}</span>
        <span class="sm-dropdown-item-name">${v.name}</span>
      </div>
    `).join('');
    
    visualMenu.querySelectorAll('.sm-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        studioSelectedVisual = item.dataset.value;
        visualMenu.querySelectorAll('.sm-dropdown-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        const opt = visualOptions.find(v => v.id === studioSelectedVisual);
        if (visualBtn) {
          visualBtn.querySelector('.sm-dropdown-value').textContent = opt?.name || studioSelectedVisual;
          visualBtn.querySelector('.sm-dropdown-icon').textContent = opt?.icon || '🎨';
        }
        visualMenu.classList.remove('show');
      });
    });
  }
  
  if (visualBtn) {
    visualBtn.addEventListener('click', () => {
      visualMenu?.classList.toggle('show');
    });
  }
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#studio-dropdown-narrative')) {
      narrativeMenu?.classList.remove('show');
    }
    if (!e.target.closest('#studio-dropdown-mood')) {
      moodMenu?.classList.remove('show');
    }
    if (!e.target.closest('#studio-dropdown-visual')) {
      visualMenu?.classList.remove('show');
    }
  });
}

// === Generate Master Prompt from Content + Style ===
async function generateStudioMasterPrompt() {
  const btn = document.getElementById('studio-generate-master-btn');
  const masterBox = document.getElementById('studio-master-prompt-box');
  const masterText = document.getElementById('studio-master-prompt-text');
  
  // Gather inputs
  const mainPrompt = document.getElementById('studio-main-prompt')?.value?.trim() || '';
  const storytelling = document.getElementById('studio-storytelling')?.value?.trim() || '';
  const format = document.getElementById('studio-format-select')?.value || 'ugc';
  
  if (!mainPrompt && !storytelling) {
    alert('กรุณาใส่ Prompt หลัก หรือ Storytelling ก่อน');
    return;
  }
  
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span> กำลังสร้าง Master Prompt...';
  
  try {
    // Build master prompt using AI
    const formatMap = {
      // TODO: USER_PROMPT
      'ugc': '',
      'podcast': '',
      'review': '',
      'tutorial': '',
      'cinematic': ''
    };
    
    // TODO: USER_PROMPT
    const narrativeMap = {
      'veggie_gangster': '',
      'organ_tough_love': '',
      'appliance_life': '',
      'politics_satire': '',
      'money_wallet': '',
      'ghost_shrine': '',
      'land_house': '',
      'package_sad': '',
      'lucky_charm': '',
      'skincare_cream': '',
      'inner_voice': '',
      'alarm_clock': '',
      'computer_office': '',
      'coffee_milk_tea': '',
      'energy_bar': '',
      'pet_gossip': '',
      'plant_talk': '',
      'shoes_passport': '',
      'dating_app': '',
      'closet_clothes': '',
      'de_influencer': '',
      'fortune_teller': '',
      'asmr_seller': '',
      'over_sharer': '',
      'main_character': '',
      'investigator': '',
      'isan_joy': '',
      'southern_direct': '',
      'northern_chill': '',
      'sassy_queen': '',
      'gossiper': '',
      'self_made': '',
      'prankster_couple': '',
      'underdog': '',
      'voiceover_troll': '',
      'fangirl': '',
      'local_guru': '',
      'mindset_coach': '',
      'satirist': '',
      'glutton': ''
    };
    
    // TODO: USER_PROMPT
    const moodMap = {
      'cinematic': '',
      'dramatic': '',
      'peaceful': '',
      'energetic': '',
      'romantic': '',
      'mysterious': '',
      'playful': '',
      'professional': ''
    };
    
    // TODO: USER_PROMPT
    const visualMap = {
      'cinematic': '',
      'disney': '',
      'ghibli': '',
      'claymation': '',
      'amigurumi': '',
      'plushie': '',
      'paper_cutout': '',
      'dragonball': '',
      '90s_anime': '',
      'gta_style': '',
      'watercolor': '',
      'chalk_art': '',
      'oil_painting': '',
      'pop_art': '',
      'pixel_art': '',
      'cyberpunk': '',
      'vector_flat': '',
      'lego_style': '',
      'vaporwave': '',
      'emoji_style': '',
      'mute_earth': '',
      'mutelu_mystical': '',
      'thai_street': '',
      'rainy_lonely': '',
      'thai_vintage': '',
      'y2k_pop': '',
      'vivid_summer': '',
      'rich_flex': '',
      'local_homey': '',
      'surreal_comedy': '',
      'ugc_raw': '',
      'fisheye': '',
      'bodycam_pov': '',
      'hyper_macro': '',
      'glitch': '',
      'old_money': '',
      'lofi_chill': '',
      'liminal_space': '',
      'cottagecore': '',
      'paparazzi': ''
    };
    
    // Get narrative styles text
    const narrativeText = studioSelectedNarratives.length > 0 
      ? studioSelectedNarratives.map(id => narrativeMap[id] || id).join(', ')
      : 'General storytelling';
    
    // Combine all elements into master prompt
    // TODO: USER_PROMPT
    const combinedPrompt = ``.trim();
    
    // ★ ใช้โครงสร้างเดียวกับ Storymode — fallback Gemini ถ้าไม่มี OpenAI ★
    const result = await chrome.storage.local.get(['provider', 'openaiKey', 'googleKey']);
    
    // ★ Smart key resolution: ดึง key ที่ใช้ได้จริงจากทุก field ★
    let realOpenaiKey = result.openaiKey && result.openaiKey.startsWith('sk-') ? result.openaiKey : null;
    let realGoogleKey = result.googleKey && result.googleKey.startsWith('AIza') ? result.googleKey : null;
    // ★ ถ้า Google Key ใส่ผิดช่อง (อยู่ใน openaiKey) → ดึงมาใช้เป็น Google Key ★
    if (!realGoogleKey && result.openaiKey && result.openaiKey.startsWith('AIza')) {
      realGoogleKey = result.openaiKey;
    }
    if (!realOpenaiKey && result.googleKey && result.googleKey.startsWith('sk-')) {
      realOpenaiKey = result.googleKey;
    }
    
    let studioProvider = realOpenaiKey ? 'openai' : (realGoogleKey ? 'google' : (result.provider || 'openai'));
    let apiKey = studioProvider === 'openai' ? realOpenaiKey : realGoogleKey;
    
    console.log('[Studio] Key resolution:', { studioProvider, hasKey: !!apiKey, keyPrefix: apiKey?.substring(0, 6) });
    
    if (!apiKey) {
      throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน (OpenAI หรือ Google AI) ไปที่แท็บ ⚙️ ตั้งค่า');
    }
    
    // ★ สร้าง user message เหมือน Storymode buildUserMessage() ★
    let userMessage = mainPrompt;
    if (storytelling) {
      userMessage += ` ${storytelling}`;
    }
    
    // Narrative Style
    if (studioSelectedNarratives.length > 0) {
      const narrativeNames = studioSelectedNarratives.map(id => narrativeMap[id] || id);
      userMessage += ` / Style: ${narrativeNames.join('+')}`;
    }
    
    // Scene count
    userMessage += ` / ${studioSceneCount} ฉาก`;
    
    // Platform Mode (Studio ใช้ Flow เป็น default)
    userMessage += ` / Flow (8 วินาที)`;
    
    // Format
    if (format === 'ugc') {
      userMessage += ` / รีวิวสินค้า UGC`;
    } else {
      userMessage += ` / Story Telling`;
    }
    
    // Mood
    const moodName = moodMap[studioSelectedMood] || 'Cinematic Standard';
    userMessage += ` / Mood: ${moodName}`;
    
    // Visual Style
    const visualName = visualMap[studioSelectedVisual] || '3D Pixar Animation';
    userMessage += ` / Visual: ${visualName}`;
    
    // Product image info
    if (studioProductImageBase64) {
      userMessage += ` / [มีรูปสินค้าแนบ]`;
    }
    
    // ★ Reinforcement เหมือน Storymode ★
    userMessage += `\n\n⚠️ สำคัญมาก (ห้ามละเมิด):\n1. หัวข้อหลักคือ "${mainPrompt}" — ต้องทำเกี่ยวกับเรื่องนี้เท่านั้น ห้ามเปลี่ยนหัวข้อเด็ดขาด\n2. ต้องสร้างให้ครบ ${studioSceneCount} ฉาก (Scene 1 ถึง Scene ${studioSceneCount}) ห้ามย่อ ห้ามข้าม ห้ามทำน้อยกว่าที่สั่ง`;
    
    console.log('[Studio] User message (Storymode format):', userMessage);
    
    // ★ ส่งผ่าน OpenAI ด้วย Enhanced Prompt (+ Hook Master) เหมือน Storymode เป๊ะ ★
    const messages = [
      { role: 'system', content: getEnhancedPrompt() },
      { role: 'user', content: userMessage }
    ];
    
    const aiResponse = await callAPI(studioProvider, apiKey, messages);
    studioMasterPrompt = aiResponse;
    
    console.log('[Studio] Master prompt generated (Storymode format), length:', studioMasterPrompt.length);
    
    // Show master prompt
    if (masterBox && masterText) {
      masterText.textContent = studioMasterPrompt;
      masterBox.style.display = 'block';
    }
    
    // ★ Parse scenes จาก output เหมือน Storymode (ใช้ parseScenesToCards ที่มีอยู่แล้ว) ★
    studioScenes = [];
    const parsedData = parseScenesToCards(studioMasterPrompt);
    
    if (parsedData.scenes && parsedData.scenes.length > 0) {
      console.log(`[Studio] Parsed ${parsedData.scenes.length} scenes from Storymode output`);
      studioScenes = parsedData.scenes.map((s, i) => ({
        id: i + 1,
        imagePrompt: s.imagePrompt || '',
        videoPrompt: s.videoPrompt || '',
        dialogue: s.dialogue || '',
        storyboard: s.storyboard || '',
        type: 'image',
        status: 'pending',
        result: null
      }));
    } else {
      // Fallback: สร้าง default scenes
      console.log('[Studio] No scenes parsed, generating defaults');
      await generateScenesFromMasterPrompt();
    }
    
    if (studioScenes.length === 0) {
      await generateScenesFromMasterPrompt();
    }
    
    // ★ Render scenes to UI ★
    renderStudioScenes();
    
    // Enable pipeline buttons
    document.getElementById('studio-gen-img-btn').disabled = false;
    document.getElementById('studio-gen-vid-btn').disabled = false;
    document.getElementById('studio-add-scene-btn').style.display = 'flex';
    
    btn.innerHTML = '<span>✅</span> สร้างเสร็จ! (คลิกเพื่อสร้างใหม่)';
    
  } catch (e) {
    console.error('[Studio] Error generating master prompt:', e);
    alert('❌ เกิดข้อผิดพลาด: ' + e.message);
    btn.innerHTML = '<span>🔄</span> ผสานข้อมูล → สร้าง Master Prompt';
  }
  
  btn.disabled = false;
}

// === Generate Scenes from Master Prompt ===
async function generateScenesFromMasterPrompt() {
  const result = await chrome.storage.local.get(['googleKey', 'openaiKey', 'provider']);
  let provider = result.provider || 'google';
  let apiKey = provider === 'google' ? result.googleKey : result.openaiKey;
  if (!apiKey && result.googleKey) { provider = 'google'; apiKey = result.googleKey; }
  else if (!apiKey && result.openaiKey) { provider = 'openai'; apiKey = result.openaiKey; }
  
  // ★ Auto-detect misplaced key prefix ★
  if (provider === 'openai' && apiKey && apiKey.startsWith('AIza')) { provider = 'google'; }
  else if (provider === 'google' && apiKey && apiKey.startsWith('sk-')) { provider = 'openai'; }
  
  // Get Visual Style description for prompts (sync with getSelectedVisualStyleDescription())
  const visualStyleMap = {
    'cinematic': 'Real Cinematic photography style, film grain, dramatic lighting, Hollywood movie quality',
    'disney': 'High-end premium 3D studio animation style, vibrant saturated colors, expressive cartoon characters with big eyes, smooth 3D rendering, next-gen graphics render, masterpiece',
    'ghibli': 'Studio Ghibli anime style, hand-drawn aesthetic, soft watercolor backgrounds, gentle lighting, Japanese animation',
    'claymation': 'Claymation stop-motion style like Wallace & Gromit, tactile clay textures, handmade feel',
    'crochet': 'Amigurumi crochet style, everything made of yarn and wool, soft knitted textures',
    'plushie': 'Plushie felt toy style, fluffy soft textures, cute stuffed animal aesthetic',
    'papercut': 'Paper cutout stop-motion style, layered paper textures, craft aesthetic',
    'dragonball': 'Dragon Ball anime style, muscular characters, dynamic action poses, bold lines',
    '90sanime': '90s Japanese anime style like Sailor Moon, sparkly eyes, soft glowing lighting, retro anime',
    'gta': 'GTA loading screen art style, semi-realistic illustration with bold black outlines',
    'watercolor': 'Watercolor painting style, soft flowing colors, artistic brush strokes',
    'chalk': 'Chalk art style on blackboard, cafe chalkboard aesthetic',
    'oilpaint': 'Oil painting style, visible brush strokes, rich textures, classical art',
    'popart': 'Pop Art comic style, bold colors, halftone dots, Roy Lichtenstein inspired',
    'pixel': '8-bit pixel art style, retro video game aesthetic',
    'cyberpunk': 'Cyberpunk neon style, glowing neon lights, futuristic dark atmosphere',
    'vector': 'Vector flat illustration style, clean lines, modern app design aesthetic',
    'lego': 'LEGO brick style, everything made of LEGO blocks',
    'vaporwave': 'Vaporwave aesthetic, pink and purple tones, Greek statues, retro 80s',
    'emoji': 'Emoji icon style, round cute icons, simple colorful design',
    'ugc_raw': 'UGC raw unfiltered style, handheld phone camera, authentic unedited, REAL HUMAN PHOTO',
    'thai_street': 'Thai street food night market style, neon signs, steam and smoke, authentic Bangkok'
  };
  
  const selectedVisualStyle = visualStyleMap[studioSelectedVisual] || 'High-end premium 3D studio animation style';
  const visualStylePrefix = `[VISUAL STYLE: ${selectedVisualStyle}] `;
  
  // ★ Get Prompt Templates for selected Visual Style ★
  const promptTemplates = getVisualStylePromptTemplates();
  
  // ★ สร้าง default prompt ที่สมบูรณ์ (ไม่มี placeholders) ★
  const buildCompleteDefaultPrompt = (sceneNum) => {
    // ใช้ข้อมูลจาก Master Prompt และ User Input
    const mainPrompt = document.getElementById('studio-main-prompt')?.value?.trim() || 'Product showcase';
    const storytelling = document.getElementById('studio-storytelling')?.value?.trim() || '';
    
    // สร้าง Image Prompt ที่สมบูรณ์
    let imagePrompt = `${selectedVisualStyle}, Scene ${sceneNum}: `;
    
    if (studioProductImageBase64) {
      // ถ้ามีรูปสินค้า
      imagePrompt += `A character enthusiastically presenting and holding the product from the reference image. `;
    }
    
    imagePrompt += `${mainPrompt}. `;
    
    if (storytelling) {
      imagePrompt += `Story context: ${storytelling}. `;
    }
    
    // เพิ่ม quality keywords
    imagePrompt += `High quality, 8K resolution, cinematic lighting, volumetric lighting, epic composition, no text, no watermark, no subtitles`;
    
    // สร้าง Video Prompt ที่สมบูรณ์
    let videoPrompt = `A high-quality ${studioSelectedVisual || 'cinematic'} style video clip (7-8 seconds). `;
    videoPrompt += `Scene ${sceneNum}: ${mainPrompt}. `;
    
    if (storytelling) {
      videoPrompt += `${storytelling}. `;
    }
    
    videoPrompt += `AUDIO: Thai language voice only. Natural Thai pronunciation. No English. No subtitles.`;
    
    return { imagePrompt, videoPrompt };
  };
  
  // Generate default scenes based on studioSceneCount (use user's selected Visual Style)
  const defaultScenes = [];
  for (let i = 1; i <= studioSceneCount; i++) {
    const prompts = buildCompleteDefaultPrompt(i);
    defaultScenes.push({
      id: i,
      imagePrompt: prompts.imagePrompt,
      videoPrompt: prompts.videoPrompt,
      type: 'image',
      status: 'pending',
      result: null
    });
  }
  
  if (apiKey) {
    try {
      // TODO: USER_PROMPT
      const systemPrompt = ``;
      
      let scenesJson = null;
      
      if (provider === 'google') {
        // Use helper function to build parts with all selected data
        const parts = buildStudioGeminiParts(systemPrompt + '\n\nMaster Prompt:\n' + studioMasterPrompt);
        
        const data = await fetchGeminiWithFallback(apiKey, {
          contents: [{ parts: parts }]
        }, 16384, 0.7);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) scenesJson = JSON.parse(jsonMatch[0]);
      } else {
        const aiResponse = await callAPI(provider, apiKey, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Master Prompt:\n' + studioMasterPrompt }
        ]);
        const text = aiResponse || '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) scenesJson = JSON.parse(jsonMatch[0]);
      }
      
      console.log(`[Studio] API returned ${scenesJson?.length || 0} scenes, expected ${studioSceneCount}`);
      
      if (scenesJson && Array.isArray(scenesJson) && scenesJson.length > 0) {
        // ★ ถ้า API ส่งมาน้อยกว่าที่ต้องการ ให้เติม default scenes ★
        const apiScenes = scenesJson.slice(0, studioSceneCount).map((s, i) => ({
          id: i + 1,
          imagePrompt: s.imagePrompt || s.prompt || `Scene ${i + 1} image`,
          videoPrompt: s.videoPrompt || `Scene ${i + 1} video animation`,
          type: 'image',
          status: 'pending',
          result: null
        }));
        
        // ถ้า API ส่งมาน้อยกว่า studioSceneCount ให้เติม default scenes
        if (apiScenes.length < studioSceneCount) {
          console.log(`[Studio] API returned only ${apiScenes.length} scenes, filling with defaults...`);
          for (let i = apiScenes.length; i < studioSceneCount; i++) {
            apiScenes.push(defaultScenes[i]);
          }
        }
        
        studioScenes = apiScenes;
      } else {
        console.log('[Studio] No valid scenes from API, using defaults');
        studioScenes = defaultScenes;
      }
    } catch (e) {
      console.warn('[Studio] Scene generation failed, using defaults:', e);
      studioScenes = defaultScenes;
    }
  } else {
    studioScenes = defaultScenes;
  }
  
  renderStudioScenes();
}

// === Render Scenes ===
function renderStudioScenes() {
  const container = document.getElementById('studio-scenes');
  if (!container) return;
  
  if (studioScenes.length === 0) {
    container.innerHTML = '<div class="studio-scene-empty">กด "ผสานข้อมูล" เพื่อสร้าง Scene</div>';
    return;
  }
  
  container.innerHTML = studioScenes.map((scene, idx) => `
    <div class="studio-scene-card" data-id="${scene.id}">
      <div class="studio-scene-selector">
        <input type="checkbox" class="studio-scene-checkbox" data-idx="${idx}" ${scene.selected ? 'checked' : ''} />
      </div>
      <div class="studio-scene-num">${scene.id}</div>
      <div class="studio-scene-content">
        <!-- Prompt Tabs -->
        <div class="studio-scene-tabs">
          <button class="studio-scene-tab active" data-idx="${idx}" data-tab="dialogue">💬 บทพูด</button>
          <button class="studio-scene-tab" data-idx="${idx}" data-tab="image">🖼️ Image</button>
          <button class="studio-scene-tab" data-idx="${idx}" data-tab="video">🎬 Video</button>
        </div>
        <!-- Dialogue (default visible) -->
        <div class="studio-scene-prompt-box" data-idx="${idx}" data-type="dialogue">
          <textarea class="studio-scene-textarea studio-dialogue-textarea" data-idx="${idx}" data-field="dialogue" rows="3" placeholder="บทพูดของตัวละครในฉากนี้ (แก้ไขได้ตามใจ)">${scene.dialogue || ''}</textarea>
        </div>
        <!-- Image Prompt -->
        <div class="studio-scene-prompt-box" data-idx="${idx}" data-type="image" style="display:none;">
          <textarea class="studio-scene-textarea" data-idx="${idx}" data-field="imagePrompt" rows="3">${scene.imagePrompt || ''}</textarea>
        </div>
        <!-- Video Prompt (hidden by default) -->
        <div class="studio-scene-prompt-box" data-idx="${idx}" data-type="video" style="display:none;">
          <textarea class="studio-scene-textarea" data-idx="${idx}" data-field="videoPrompt" rows="3">${scene.videoPrompt || ''}</textarea>
        </div>
        <!-- Type & Preview Count -->
        <div class="studio-scene-type">
          <select class="studio-scene-type-select" data-idx="${idx}">
            <option value="image" ${scene.type === 'image' ? 'selected' : ''}>🖼️ Image</option>
            <option value="video" ${scene.type === 'video' ? 'selected' : ''}>🎬 Video</option>
          </select>
          <select class="studio-scene-preview-count" data-idx="${idx}" ${scene.type === 'video' ? 'disabled' : ''}>
            <option value="1" ${(scene.previewCount || 1) === 1 ? 'selected' : ''}>1 รูป</option>
            <option value="2" ${scene.previewCount === 2 ? 'selected' : ''}>2 รูป</option>
            <option value="3" ${scene.previewCount === 3 ? 'selected' : ''}>3 รูป</option>
            <option value="4" ${scene.previewCount === 4 ? 'selected' : ''}>4 รูป</option>
          </select>
          <span class="studio-scene-status ${scene.status}">${getStudioStatusText(scene.status)}</span>
        </div>
      </div>
      <div class="studio-scene-actions">
        <button class="studio-scene-btn studio-scene-gen" data-idx="${idx}" title="สร้าง">▶️</button>
        <button class="studio-scene-btn studio-scene-del" data-idx="${idx}" title="ลบ">🗑️</button>
      </div>
    </div>
  `).join('');
  
  // Tab switching
  container.querySelectorAll('.studio-scene-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const idx = e.target.dataset.idx;
      const tabType = e.target.dataset.tab;
      const card = e.target.closest('.studio-scene-card');
      
      // Update tab active state
      card.querySelectorAll('.studio-scene-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      
      // Show/hide prompt boxes
      card.querySelectorAll('.studio-scene-prompt-box').forEach(box => {
        box.style.display = box.dataset.type === tabType ? 'block' : 'none';
      });
    });
  });
  
  // Textarea updates
  container.querySelectorAll('.studio-scene-textarea').forEach(el => {
    el.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const field = e.target.dataset.field;
      studioScenes[idx][field] = e.target.value;
    });
  });
  
  container.querySelectorAll('.studio-scene-type-select').forEach(el => {
    el.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      studioScenes[idx].type = e.target.value;
      
      // Enable/disable preview count based on type
      const card = e.target.closest('.studio-scene-card');
      const previewCountSelect = card.querySelector('.studio-scene-preview-count');
      if (previewCountSelect) {
        previewCountSelect.disabled = e.target.value === 'video';
      }
    });
  });
  
  // Preview count selection
  container.querySelectorAll('.studio-scene-preview-count').forEach(el => {
    el.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      studioScenes[idx].previewCount = parseInt(e.target.value);
    });
  });
  
  // Checkbox selection for Pipeline
  container.querySelectorAll('.studio-scene-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      studioScenes[idx].selected = e.target.checked;
      
      // Update card visual state
      const card = e.target.closest('.studio-scene-card');
      if (e.target.checked) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
      
      updateSelectedSceneCount();
    });
  });
  
  container.querySelectorAll('.studio-scene-gen').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(e.target.closest('button').dataset.idx);
      await generateSingleScene(idx);
    });
  });
  
  container.querySelectorAll('.studio-scene-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.closest('button').dataset.idx);
      studioScenes.splice(idx, 1);
      studioScenes.forEach((s, i) => s.id = i + 1);
      renderStudioScenes();
    });
  });
}

function getStudioStatusText(status) {
  switch (status) {
    case 'pending': return '⏳ รอ';
    case 'generating': return '🔄 กำลังสร้าง...';
    case 'done': return '✅ เสร็จ';
    case 'error': return '❌ ผิดพลาด';
    default: return status;
  }
}

// === Add New Scene ===
function addStudioScene() {
  const newId = studioScenes.length + 1;
  
  // ★ สร้าง prompt ที่สมบูรณ์แทน template ที่มี placeholders ★
  const visualStyle = getSelectedVisualStyleDescription();
  const mainPrompt = document.getElementById('studio-main-prompt')?.value?.trim() || 'Product showcase';
  const storytelling = document.getElementById('studio-storytelling')?.value?.trim() || '';
  
  let imagePrompt = `${visualStyle}, Scene ${newId}: `;
  if (studioProductImageBase64) {
    imagePrompt += `A character enthusiastically presenting and holding the product from the reference image. `;
  }
  imagePrompt += `${mainPrompt}. `;
  if (storytelling) {
    imagePrompt += `Story context: ${storytelling}. `;
  }
  imagePrompt += `High quality, 8K resolution, cinematic lighting, volumetric lighting, epic composition, no text, no watermark, no subtitles`;
  
  let videoPrompt = `A high-quality ${studioSelectedVisual || 'cinematic'} style video clip (7-8 seconds). `;
  videoPrompt += `Scene ${newId}: ${mainPrompt}. `;
  if (storytelling) {
    videoPrompt += `${storytelling}. `;
  }
  videoPrompt += `AUDIO: Thai language voice only. Natural Thai pronunciation. No English. No subtitles.`;
  
  studioScenes.push({
    id: newId,
    imagePrompt: imagePrompt,
    videoPrompt: videoPrompt,
    type: 'image',
    status: 'pending',
    result: null
  });
  renderStudioScenes();
}

// === Get Visual Style Description ===
function getSelectedVisualStyleDescription() {
  const visualStyleMap = {
    'cinematic': 'Real Cinematic photography style, film grain, dramatic lighting, Hollywood movie quality',
    'disney': 'High-end premium 3D studio animation style, vibrant saturated colors, expressive cartoon characters with big eyes, smooth 3D rendering, next-gen graphics render, masterpiece',
    'ghibli': 'Studio Ghibli anime style, hand-drawn aesthetic, soft watercolor backgrounds, gentle lighting, Japanese animation',
    'claymation': 'Claymation stop-motion style like Wallace & Gromit, tactile clay textures, handmade feel',
    'amigurumi': 'Amigurumi crochet style, everything made of yarn and wool, soft knitted textures',
    'plushie': 'Plushie felt toy style, fluffy soft textures, cute stuffed animal aesthetic',
    'paper_cutout': 'Paper cutout stop-motion style, layered paper textures, craft aesthetic',
    'dragonball': 'Dragon Ball anime style, muscular characters, dynamic action poses, bold lines',
    '90s_anime': '90s Japanese anime style like Sailor Moon, sparkly eyes, soft glowing lighting, retro anime',
    'gta_style': 'GTA loading screen art style, semi-realistic illustration with bold black outlines',
    'watercolor': 'Watercolor painting style, soft flowing colors, artistic brush strokes',
    'chalk_art': 'Chalk art style on blackboard, cafe chalkboard aesthetic',
    'oil_painting': 'Oil painting style, visible brush strokes, rich textures, classical art',
    'pop_art': 'Pop Art comic style, bold colors, halftone dots, Roy Lichtenstein inspired',
    'pixel_art': '8-bit pixel art style, retro video game aesthetic',
    'cyberpunk': 'Cyberpunk neon style, glowing neon lights, futuristic dark atmosphere',
    'vector_flat': 'Vector flat illustration style, clean lines, modern app design aesthetic',
    'lego_style': 'LEGO brick style, everything made of LEGO blocks',
    'vaporwave': 'Vaporwave aesthetic, pink and purple tones, Greek statues, retro 80s',
    'emoji_style': 'Emoji icon style, round cute icons, simple colorful design',
    'mute_earth': 'Muted earth tone colors, soft beige and brown, Korean cafe aesthetic',
    'mutelu_mystical': 'Mystical spiritual style, candlelight, incense smoke, Thai fortune teller vibe',
    'thai_street': 'Thai street food night market style, neon signs, steam and smoke, authentic Bangkok',
    'rainy_lonely': 'Rainy melancholic style, blue-grey tones, lonely heartbreak mood',
    'thai_vintage': 'Thai vintage film style, warm yellow tones, old Bangkok Chinatown aesthetic',
    'y2k_pop': 'Y2K pop style, bright vivid colors, Gen Z trendy aesthetic',
    'vivid_summer': 'Vivid Thai summer style, bright saturated colors, beach and sun',
    'rich_flex': 'Rich flex style, gold and luxury, sparkling wealth aesthetic',
    'local_homey': 'Local homey style, natural lighting, simple authentic Thai home',
    'surreal_comedy': 'Surreal comedy style, contrasting colors, Thai sitcom absurd humor',
    'ugc_raw': 'UGC raw unfiltered style, handheld phone camera, authentic unedited',
    'fisheye': 'Fisheye ultra wide lens style, distorted close-up, Gen Z viral',
    'bodycam_pov': 'Bodycam POV action style, first-person shaky camera, immersive',
    'hyper_macro': 'Hyper-macro satisfying style, extreme close-up textures, ASMR visual',
    'glitch': 'Glitch distorted style, digital artifacts, attention-grabbing',
    'old_money': 'Old money aesthetic, elegant classic luxury, understated wealth',
    'lofi_chill': 'Lo-Fi chillhop style, dim purple-pink lighting, late night study vibe',
    'liminal_space': 'Liminal space dreamcore style, empty familiar places, surreal uncanny',
    'cottagecore': 'Cottagecore fairy tale style, nature flowers, dreamy fantasy',
    'paparazzi': 'Paparazzi flash style, harsh flash photography, celebrity caught on camera'
  };
  return visualStyleMap[studioSelectedVisual] || 'High-end premium 3D studio animation style, vibrant saturated colors, expressive cartoon characters with big eyes, smooth 3D rendering, next-gen graphics render, masterpiece';
}

// === Get Visual Style Prompt Templates ===
// ★ เมื่อเลือก Visual Style จะได้โครง Prompt ที่เหมาะสมมาให้ ★
function getVisualStylePromptTemplates() {
  const templates = {
    // ── Pixar 3D / Disney ──
    'disney': {
      imagePrompt: `Pixar 3D Animation style, vibrant colors, expressive characters, smooth rendering, Disney-quality lighting. [SCENE_DESCRIPTION]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent young Thai female voice throughout entire clip, do NOT switch voice gender. Only animate the existing characters from the image, do not add new characters or change their appearance. Character says in Thai with young Thai female voice: "[DIALOGUE]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`
    },

    // ── Photorealistic Cinematic ──
    'cinematic': {
      imagePrompt: `Photorealistic cinematic style, natural lighting, high detail texture, realistic proportions, movie-quality visuals, 8K resolution. [CAMERA_ANGLE]. [SCENE_DESCRIPTION]. [Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `[SCENE_ACTION]. [CAMERA_STYLE], [AUDIO_STYLE]. Realistic movement, natural motion. NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, stable form, no morphing`
    },

    // ── Studio Ghibli ──
    'ghibli': {
      imagePrompt: `Studio Ghibli anime style, hand-drawn aesthetic, soft watercolor backgrounds, gentle lighting, Japanese animation. [SCENE_DESCRIPTION]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], with young Thai female voice voiceover narration, MUST use young Thai female voice only, do NOT switch to different voice gender, NO lip sync, character does NOT speak, background narration only. Thai voiceover narrated by young Thai female voice says: "[DIALOGUE]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`
    },

    // ── Claymation ──
    'claymation': {
      imagePrompt: `Claymation stop-motion style like Wallace & Gromit, tactile clay textures, handmade feel, warm studio lighting. [SCENE_DESCRIPTION]. No bold text overlay, no title text. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice throughout entire clip. Only animate the existing characters from the image. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`
    },

    // ── Cyberpunk ──
    'cyberpunk': {
      imagePrompt: `Cyberpunk neon style, glowing neon lights, futuristic dark atmosphere, volumetric fog, rain-slick reflective surfaces, holographic UI elements. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative neon signs and holographic text are OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice. Neon lights flicker subtly. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing`
    },

    // ── UGC Raw / Creative Scene ──
    'ugc_raw': {
      imagePrompt: `สร้างภาพโฆษณาสินค้ามืออาชีพ [SCENE_DESCRIPTION] REAL HUMAN PHOTO single image, no collage, no multiple panels, no split screen Use the exact product appearance from the attached reference image (pd-product.png). The bold text overlay MUST be in Thai language (ภาษาไทย).`,
      videoPrompt: `[SCENE_ACTION] ถือสินค้าโชว์ บทพูดไทย "[DIALOGUE]" มุมกล้องตั้งนิ่งจนจบคลิป ใช้ฉากและการจัดวางตามภาพที่แนบ NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, All dialogue is AUDIO ONLY reduce contrast, natural skintone, soft highlights, no oversharpen, low contrast, soft colors, natural tone, film look, soft light`
    },

    // ── Thai Street ──
    'thai_street': {
      imagePrompt: `Thai street food night market style, neon signs, steam and smoke, authentic Bangkok atmosphere. [SCENE_DESCRIPTION]. REAL HUMAN PHOTO single image, no collage. Use the exact product appearance from the attached reference image (pd-product.png). The bold text overlay MUST be in Thai language (ภาษาไทย).`,
      videoPrompt: `[SCENE_ACTION] ถือสินค้าโชว์ บทพูดไทย "[DIALOGUE]" มุมกล้องตั้งนิ่งจนจบคลิป NO subtitles or text overlays, NO captions, All dialogue is AUDIO ONLY reduce contrast, natural skintone, soft light, warm night market tones`
    },

    // ── Crochet / Amigurumi ──
    'crochet': {
      imagePrompt: `Amigurumi crochet style, everything made of yarn and wool, soft knitted textures, handcrafted feel. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, MUST maintain consistent voice. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing`
    },

    // ── Plushie ──
    'plushie': {
      imagePrompt: `Plushie felt toy style, fluffy soft textures, cute stuffed animal aesthetic, warm soft lighting. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, MUST maintain consistent voice. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing`
    },

    // ── Dragon Ball ──
    'dragonball': {
      imagePrompt: `Dragon Ball anime style, muscular characters, dynamic action poses, bold lines, energy auras, speed lines. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`
    },

    // ── 90s Anime ──
    '90sanime': {
      imagePrompt: `90s Japanese anime style like Sailor Moon, sparkly eyes, soft glowing lighting, retro anime. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing`
    },

    // ── Watercolor ──
    'watercolor': {
      imagePrompt: `Watercolor painting style, soft flowing colors, artistic brush strokes, dreamy translucent layers. [SCENE_DESCRIPTION]. No bold text overlay.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], with young Thai female voice voiceover narration, background narration only. Thai voiceover says: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form`
    },

    // ── Pop Art ──
    'popart': {
      imagePrompt: `Pop Art comic style, bold colors, halftone dots, Roy Lichtenstein inspired, thick black outlines. [SCENE_DESCRIPTION]. No bold text overlay outside comic bubbles.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form`
    },

    // ── Pixel Art ──
    'pixel': {
      imagePrompt: `8-bit pixel art style, retro video game aesthetic, limited color palette, blocky characters, nostalgic feel. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative pixel text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, retro 8-bit animation movement. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form`
    },

    // ── LEGO ──
    'lego': {
      imagePrompt: `LEGO brick style, everything made of LEGO blocks, toy photography, bright studio lighting. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative LEGO text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, stop-motion LEGO animation style. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing`
    }
  };

  const defaultTemplate = {
    imagePrompt: `[VISUAL_STYLE]. [SCENE_DESCRIPTION]. No bold text overlay, no title text. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
    videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`
  };
  
  return templates[studioSelectedVisual] || defaultTemplate;
}

// === Generate Single Scene ===
async function generateSingleScene(idx) {
  const scene = studioScenes[idx];
  if (!scene) return;
  
  scene.status = 'generating';
  renderStudioScenes();
  
  // Get Visual Style to ensure it's always in the prompt
  const visualStyle = getSelectedVisualStyleDescription();
  
  try {
    if (scene.type === 'image') {
      // Use imagePrompt for image generation
      let prompt = scene.imagePrompt || scene.prompt || `Scene ${scene.id}`;
      
      // ★ PRODUCT REINFORCEMENT: เพิ่มชื่อสินค้า/หัวข้อใน prompt เสมอ ★
      const mainTopic = document.getElementById('studio-main-prompt')?.value?.trim() || '';
      if (mainTopic && !prompt.toLowerCase().includes(mainTopic.toLowerCase())) {
        prompt = `${prompt}, featuring "${mainTopic}" as the main subject`;
      }
      
      // Ensure Visual Style is at the start of the prompt
      if (!prompt.toLowerCase().includes('style') && !prompt.toLowerCase().includes('premium') && !prompt.toLowerCase().includes('animation')) {
        prompt = `${visualStyle}, ${prompt}`;
      }
      
      // ★ v2.84: ไม่ต้องเพิ่ม --ar 9:16 ใน prompt อีกแล้ว — Google Flow ใช้ UI เลือก portrait แทน ★
      
      // Get preview count (1-4 images per scene)
      const previewCount = scene.previewCount || 1;
      
      console.log(`[Studio] Generating ${previewCount} image(s) with prompt:`, prompt);
      const imageUrls = await generateImageWithGemini(prompt, 'single', previewCount);
      
      if (imageUrls && imageUrls.length > 0) {
        // Store all preview images
        scene.result = imageUrls;
        scene.previewImages = imageUrls;
        
        // Add all images to studioItems
        imageUrls.forEach((url, i) => {
          studioItems.push({ 
            type: 'image', 
            url: url, 
            label: `Scene ${scene.id}${previewCount > 1 ? ` (${i + 1}/${previewCount})` : ''}`, 
            prompt: prompt, 
            selected: false 
          });
        });
      }
    } else {
      // Use videoPrompt for video generation
      let prompt = scene.videoPrompt || scene.prompt || `Scene ${scene.id} animation`;
      
      // Ensure Visual Style is at the start of the prompt
      if (!prompt.toLowerCase().includes('style') && !prompt.toLowerCase().includes('premium') && !prompt.toLowerCase().includes('animation')) {
        prompt = `${visualStyle}, ${prompt}`;
      }
      
      console.log('[Studio] Generating video with prompt:', prompt);
      const videoUrl = await generateVideoWithVeo3(prompt, selectedImageUrl, 'single');
      if (videoUrl) {
        scene.result = videoUrl;
        studioItems.push({ type: 'video', url: videoUrl, label: `Scene ${scene.id}`, prompt: prompt, selected: false });
      }
    }
    scene.status = 'done';
  } catch (e) {
    console.error('[Studio] Scene generation error:', e);
    scene.status = 'error';
  }
  
  renderStudioScenes();
  renderStudioGrid();
}

// === Update Selected Scene Count ===
function updateSelectedSceneCount() {
  const selectedCount = studioScenes.filter(s => s.selected).length;
  const imgBtn = document.getElementById('studio-gen-img-btn');
  const vidBtn = document.getElementById('studio-gen-vid-btn');
  
  if (imgBtn) {
    const selectedImages = studioScenes.filter(s => s.selected && s.type === 'image').length;
    if (selectedImages > 0) {
      imgBtn.querySelector('.studio-btn-text').textContent = `สร้างรูป (${selectedImages} ฉาก)`;
    } else {
      imgBtn.querySelector('.studio-btn-text').textContent = 'สร้างรูป';
    }
  }
  
  if (vidBtn) {
    const selectedVideos = studioScenes.filter(s => s.selected && s.type === 'video').length;
    if (selectedVideos > 0) {
      vidBtn.querySelector('.studio-btn-text').textContent = `สร้างวีดีโอ (${selectedVideos} ฉาก)`;
    } else {
      vidBtn.querySelector('.studio-btn-text').textContent = 'สร้างวีดีโอ';
    }
  }
}

// === Generate All Images (Pipeline) ===
async function generateStudioImages() {
  const btn = document.getElementById('studio-gen-img-btn');
  btn.disabled = true;
  btn.querySelector('.studio-btn-text').textContent = 'กำลังสร้างรูป...';
  
  // Filter: selected scenes first, if none selected then all image scenes
  let imageScenes = studioScenes.filter(s => s.selected && s.type === 'image' && s.status !== 'done');
  if (imageScenes.length === 0) {
    imageScenes = studioScenes.filter(s => s.type === 'image' && s.status !== 'done');
  }
  
  for (let i = 0; i < imageScenes.length; i++) {
    const idx = studioScenes.indexOf(imageScenes[i]);
    btn.querySelector('.studio-btn-text').textContent = `สร้างรูป ${i + 1}/${imageScenes.length}...`;
    await generateSingleScene(idx);
  }
  
  btn.querySelector('.studio-btn-text').textContent = '✅ เสร็จ!';
  setTimeout(() => {
    btn.querySelector('.studio-btn-text').textContent = 'สร้างรูป';
    btn.disabled = false;
    updateSelectedSceneCount();
  }, 2000);
}

// === Generate All Videos (Pipeline) ===
// ★ สร้าง video จากรูปที่เลือกใน grid (selectedImageUrl) ★
async function generateStudioVideos() {
  const btn = document.getElementById('studio-gen-vid-btn');
  btn.disabled = true;
  btn.querySelector('.studio-btn-text').textContent = 'กำลังสร้างวีดีโอ...';
  
  try {
    // ★ หารูปที่เลือกไว้ใน grid ★
    const selectedImages = studioItems.filter(item => item.type === 'image' && item.selected);
    
    if (selectedImages.length === 0) {
      // ถ้าไม่มีรูปเลือก ให้ใช้รูปแรก
      const firstImage = studioItems.find(item => item.type === 'image');
      if (firstImage) {
        selectedImages.push(firstImage);
      }
    }
    
    if (selectedImages.length === 0) {
      throw new Error('กรุณาสร้างรูปก่อน แล้วเลือกรูปที่ต้องการสร้างวีดีโอ');
    }
    
    console.log(`[Studio] Creating ${selectedImages.length} video(s) from selected images...`);
    
    for (let i = 0; i < selectedImages.length; i++) {
      const img = selectedImages[i];
      btn.querySelector('.studio-btn-text').textContent = `สร้างวีดีโอ ${i + 1}/${selectedImages.length}...`;
      
      // ★ หา videoPrompt จาก scene ที่ตรงกับรูปนี้ ★
      const sceneMatch = img.label.match(/Scene (\d+)/);
      const sceneId = sceneMatch ? parseInt(sceneMatch[1]) : 1;
      const scene = studioScenes.find(s => s.id === sceneId);
      
      let videoPrompt = scene?.videoPrompt || scene?.prompt || img.prompt || 'Animate this image with smooth motion';
      
      // ★ ถ้าผู้ใช้แก้ไข dialogue → แทนที่ dialogue เดิมใน videoPrompt ★
      if (scene?.dialogue) {
        videoPrompt = replaceDialogueInVideoPrompt(videoPrompt, scene.dialogue);
      }
      
      // เพิ่ม Visual Style ถ้ายังไม่มี
      const visualStyle = studioSelectedVisual || 'Cinematic';
      if (!videoPrompt.toLowerCase().includes('style')) {
        videoPrompt = `${visualStyle} style, ${videoPrompt}`;
      }
      
      console.log(`[Studio] Generating video for image ${i + 1}:`, videoPrompt.substring(0, 80));
      
      // ★ ส่งรูปไปเป็น reference ★
      const videoUrl = await generateVideoWithVeo3(videoPrompt, img.url, `scene-${sceneId}`);
      
      if (videoUrl) {
        studioItems.push({ 
          type: 'video', 
          url: videoUrl, 
          label: `Video ${sceneId}`, 
          prompt: videoPrompt, 
          selected: false 
        });
        renderStudioGrid();
      }
    }
    
    btn.querySelector('.studio-btn-text').textContent = '✅ เสร็จ!';
  } catch (e) {
    console.error('[Studio] Video generation error:', e);
    btn.querySelector('.studio-btn-text').textContent = '❌ Error';
    alert('เกิดข้อผิดพลาด: ' + e.message);
  }
  
  setTimeout(() => {
    btn.querySelector('.studio-btn-text').textContent = 'สร้างวีดีโอ';
    btn.disabled = false;
  }, 2000);
}

// ★ Helper: แทนที่ dialogue เดิมใน videoPrompt ด้วย dialogue ที่ผู้ใช้แก้ไข ★
function replaceDialogueInVideoPrompt(videoPrompt, newDialogue) {
  if (!newDialogue || !videoPrompt) return videoPrompt;
  
  // Pattern 1: "บทพูดเดิม" หลัง dialogue/speaks/Thai dialogue keyword
  const dlgPattern1 = /((?:dialogue|บทพูด|speaks?|พูด|Thai\s*dialogue)[^"]*")([^"]+)(")/i;
  if (dlgPattern1.test(videoPrompt)) {
    return videoPrompt.replace(dlgPattern1, `$1${newDialogue}$3`);
  }
  
  // Pattern 2: Thai text in quotes (continuous Thai chars ≥15)
  const dlgPattern2 = /(")([\u0E01-\u0E39\s,.!?…\-–—'"()]{15,})(")/;
  if (dlgPattern2.test(videoPrompt)) {
    return videoPrompt.replace(dlgPattern2, `$1${newDialogue}$3`);
  }
  
  // Pattern 3: ไม่เจอ pattern — append dialogue ต่อท้าย
  return videoPrompt + `\nThe character speaks the following Thai dialogue naturally: "${newDialogue}"`;
}

// === Render Studio Grid with selectable images ===
function renderStudioGrid() {
  const grid = document.getElementById('studio-grid');
  const countEl = document.getElementById('studio-result-count');
  if (!grid) return;
  
  grid.innerHTML = '';
  const imgCount = studioItems.filter(i => i.type === 'image').length;
  const vidCount = studioItems.filter(i => i.type === 'video').length;
  countEl.textContent = `${imgCount} รูป / ${vidCount} วีดีโอ`;
  
  if (studioItems.length === 0) {
    grid.innerHTML = '<div class="studio-grid-empty">ยังไม่มีรูป/วีดีโอ — กด "สร้างรูป" หรือ "สร้างวีดีโอ" เพื่อเริ่ม</div>';
    updateSelectedImageIndicator();
    return;
  }
  
  studioItems.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'studio-grid-item' + (item.selected ? ' selected' : '');
    div.setAttribute('data-idx', idx);
    
    if (item.type === 'image') {
      div.innerHTML = `
        <div class="studio-img-wrapper">
          <img src="${item.url}" alt="${item.label}" />
          <div class="studio-select-overlay">
            <span class="studio-select-check">${item.selected ? '✅' : '☐'}</span>
          </div>
        </div>
        <div class="studio-item-actions">
          <span class="studio-item-label">🖼️ ${item.label}</span>
          <div class="studio-item-btns">
            <button class="studio-item-select" data-idx="${idx}" title="เลือกรูปนี้สำหรับสร้างวีดีโอ">✅ เลือก</button>
            <button class="studio-item-dl" data-idx="${idx}" title="ดาวน์โหลด">💾</button>
          </div>
        </div>
      `;
    } else {
      div.innerHTML = `
        <video src="${item.url}" controls playsinline></video>
        <div class="studio-item-actions">
          <span class="studio-item-label">🎬 ${item.label}</span>
          <button class="studio-item-dl" data-idx="${idx}" title="ดาวน์โหลด">💾</button>
        </div>
      `;
    }
    
    grid.appendChild(div);
  });
  
  // === Image click to select ===
  grid.querySelectorAll('.studio-img-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', () => {
      const idx = parseInt(wrapper.closest('.studio-grid-item').getAttribute('data-idx'));
      selectStudioImage(idx);
    });
  });
  
  grid.querySelectorAll('.studio-item-select').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-idx'));
      selectStudioImage(idx);
    });
  });
  
  // === Download ===
  grid.querySelectorAll('.studio-item-dl').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-idx'));
      const item = studioItems[idx];
      if (!item) return;
      const ext = item.type === 'image' ? 'png' : 'mp4';
      const a = document.createElement('a');
      a.href = item.url;
      a.download = `studio_${item.type}_${idx + 1}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  });
  
  updateSelectedImageIndicator();
}

function selectStudioImage(idx) {
  // Deselect all images
  studioItems.forEach(item => {
    if (item.type === 'image') item.selected = false;
  });
  // Select this one
  studioItems[idx].selected = true;
  selectedImageUrl = studioItems[idx].url;
  
  console.log(`[Studio] Selected image ${idx} as reference for video generation`);
  renderStudioGrid();
}

function updateSelectedImageIndicator() {
  const vidBtn = document.getElementById('studio-gen-vid-btn');
  const refBadge = document.getElementById('studio-ref-badge');
  if (!vidBtn) return;
  
  const subEl = vidBtn.querySelector('.studio-btn-sub');
  if (selectedImageUrl) {
    subEl.textContent = 'Veo 3.1 (+ รูปที่เลือก)';
    vidBtn.classList.add('has-ref');
    if (refBadge) refBadge.style.display = 'inline';
  } else {
    subEl.textContent = 'Veo 3.1';
    vidBtn.classList.remove('has-ref');
    if (refBadge) refBadge.style.display = 'none';
  }
}

// ============================================================
// ★ PLATFORM TAB — Queue-based Multi-Post System ★
// ============================================================
let platformVideoFile = null;
let platformQueue = []; // Array of queue items
let platformQueueProcessing = false;

function initPlatformTab() {
  const uploadZone = document.getElementById('platform-upload-zone');
  const fileInput = document.getElementById('platform-video-input');
  const placeholder = document.getElementById('platform-upload-placeholder');
  const preview = document.getElementById('platform-upload-preview');
  const videoPreview = document.getElementById('platform-video-preview');
  const removeBtn = document.getElementById('platform-remove-video');
  const captionInput = document.getElementById('platform-caption');
  const charCount = document.getElementById('platform-char-count');
  
  if (!uploadZone) return;
  
  // === Video Upload: Click to select ===
  uploadZone.addEventListener('click', (e) => {
    if (e.target.closest('.platform-remove-btn') || e.target.closest('video')) return;
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handlePlatformVideoFile(e.target.files[0]);
    }
  });
  
  // === Drag & Drop ===
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePlatformVideoFile(e.dataTransfer.files[0]);
    }
  });
  
  // === Remove Video ===
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      platformVideoFile = null;
      fileInput.value = '';
      videoPreview.src = '';
      placeholder.style.display = '';
      preview.style.display = 'none';
      updatePlatformAddBtn();
    });
  }
  
  // === Caption char count ===
  if (captionInput) {
    captionInput.addEventListener('input', () => {
      const len = captionInput.value.length;
      charCount.textContent = `${len} / 2200`;
      updatePlatformAddBtn();
    });
  }
  
  // === AI Caption ===
  const aiCaptionBtn = document.getElementById('platform-ai-caption');
  if (aiCaptionBtn) {
    aiCaptionBtn.addEventListener('click', async () => {
      aiCaptionBtn.disabled = true;
      aiCaptionBtn.textContent = '⏳ กำลังสร้าง...';
      try {
        const result = await chrome.storage.local.get(['googleKey']);
        if (!result.googleKey) {
          alert('กรุณาตั้งค่า Google AI API Key ก่อน (แท็บ ⚙️)');
          return;
        }
        const videoFileName = platformVideoFile ? platformVideoFile.name : 'video';
        const prompt = `สร้างแคปชั่นสำหรับโพสต์ video "${videoFileName}" ลง TikTok, Facebook, YouTube
ให้:
1. ดึงดูดความสนใจตั้งแต่บรรทัดแรก
2. ใช้ภาษาที่เป็นกันเอง ทันสมัย
3. มี Emoji ที่เหมาะสม
4. มี Hashtag 3-5 อัน ท้ายแคปชั่น
5. ความยาวไม่เกิน 150 คำ
ตอบเป็นแคปชั่นเท่านั้น`;

        const data = await fetchGeminiWithFallback(result.googleKey, {
          contents: [{ parts: [{ text: prompt }] }]
        }, 400, 0.8);
        const caption = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (caption) {
          captionInput.value = caption;
          charCount.textContent = `${caption.length} / 2200`;
          updatePlatformAddBtn();
        }
      } catch (err) {
        console.error('[Platform] AI Caption error:', err);
      } finally {
        aiCaptionBtn.disabled = false;
        aiCaptionBtn.textContent = '🤖 AI สร้าง Caption';
      }
    });
  }
  
  // === Platform Toggles — show/hide body ===
  ['tiktok', 'facebook', 'youtube'].forEach(platform => {
    const checkbox = document.getElementById(`platform-${platform}-enabled`);
    const body = document.getElementById(`platform-${platform}-body`);
    if (checkbox && body) {
      checkbox.addEventListener('change', () => {
        body.style.display = checkbox.checked ? '' : 'none';
        updatePlatformAddBtn();
      });
    }
  });
  
  // === TikTok CTA char count ===
  const ctaInput = document.getElementById('platform-tiktok-cta');
  const ctaCount = document.getElementById('platform-tiktok-cta-count');
  if (ctaInput && ctaCount) {
    ctaInput.addEventListener('input', () => {
      ctaCount.textContent = `${ctaInput.value.length} / 30`;
    });
  }
  
  // === AI สร้าง CTA ===
  const aiCtaBtn = document.getElementById('platform-ai-cta');
  if (aiCtaBtn) {
    aiCtaBtn.addEventListener('click', async () => {
      aiCtaBtn.disabled = true;
      aiCtaBtn.textContent = '⏳ กำลังสร้าง...';
      try {
        const result = await chrome.storage.local.get(['googleKey']);
        if (!result.googleKey) {
          alert('กรุณาตั้งค่า Google AI API Key ก่อน (แท็บ ⚙️)');
          return;
        }
        const caption = document.getElementById('platform-caption')?.value || '';
        const productId = document.getElementById('platform-tiktok-product-id')?.value || '';
        
        const prompt = `สร้าง CTA สำหรับโพสต์ TikTok สั้นๆ ไม่เกิน 30 ตัวอักษร (ภาษาไทย)
ข้อมูลอ้างอิง:
- Caption: "${caption || 'ไม่มี'}"

สร้าง CTA ที่:
1. กระตุ้นให้คนคอมเม้นต์ถามรายละเอียด หรือกดดูสินค้าต่อ
2. สร้างความอยากรู้ + FOMO (กลัวพลาด)
3. ใช้ภาษาวัยรุ่นไทย ทันสมัย เป็นกันเอง
4. ⚠️ ห้ามลอก Caption มาวางตรงๆ — ต้องคิดประโยคใหม่ที่สร้างสรรค์
5. ตัวอย่างแนว: "ใครอยากรู้ราคาคอมเม้นต์มา!" / "กดตะกร้าด่วน ของหมดไม่รอ!" / "ดูต่อเลยแล้วจะรู้!"

ตอบเป็น CTA เพียง 1 อัน (ข้อความเดียว ไม่ต้องมีคำอธิบาย ไม่ต้องใส่เครื่องหมายคำพูด)`;

        const data = await fetchGeminiWithFallback(result.googleKey, {
          contents: [{ parts: [{ text: prompt }] }]
        }, 50, 0.9);
        let cta = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        // ตัดให้ไม่เกิน 30 ตัวอักษร
        cta = cta.replace(/^["'"]|["'"]$/g, '').trim();
        if (cta.length > 30) cta = cta.substring(0, 30);
        
        if (cta && ctaInput) {
          ctaInput.value = cta;
          if (ctaCount) ctaCount.textContent = `${cta.length} / 30`;
        }
      } catch (err) {
        console.error('[Platform] AI CTA error:', err);
      } finally {
        aiCtaBtn.disabled = false;
        aiCtaBtn.textContent = '🤖 AI สร้าง CTA';
      }
    });
  }
  
  // === Schedule toggle ===
  document.querySelectorAll('input[name="platform-schedule"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const dateTimeEl = document.getElementById('platform-schedule-datetime');
      if (dateTimeEl) {
        dateTimeEl.style.display = radio.value === 'scheduled' && radio.checked ? '' : 'none';
      }
      if (radio.value === 'scheduled' && radio.checked) {
        const timeInput = document.getElementById('platform-schedule-time');
        if (timeInput && !timeInput.value) {
          const now = new Date();
          now.setHours(now.getHours() + 1);
          now.setMinutes(0);
          timeInput.value = now.toISOString().slice(0, 16);
        }
      }
    });
  });
  
  // === Add to Queue ===
  const addBtn = document.getElementById('platform-add-queue-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => addToQueue());
  }
  
  // === Start All ===
  const startAllBtn = document.getElementById('platform-start-all-btn');
  if (startAllBtn) {
    startAllBtn.addEventListener('click', () => processQueue());
  }
  
  // === Clear Queue ===
  const clearBtn = document.getElementById('platform-clear-queue-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (platformQueueProcessing) {
        alert('กำลังโพสต์อยู่ — รอให้เสร็จก่อนค่อยล้าง');
        return;
      }
      platformQueue = [];
      renderQueue();
    });
  }
  
  renderQueue();
}

// === Handle video file ===
function handlePlatformVideoFile(file) {
  if (!file || !file.type.startsWith('video/')) {
    alert('กรุณาเลือกไฟล์ Video เท่านั้น (.mp4, .mov, .webm)');
    return;
  }
  
  platformVideoFile = file;
  const videoPreview = document.getElementById('platform-video-preview');
  const placeholder = document.getElementById('platform-upload-placeholder');
  const preview = document.getElementById('platform-upload-preview');
  const videoName = document.getElementById('platform-video-name');
  
  const url = URL.createObjectURL(file);
  videoPreview.src = url;
  videoName.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  placeholder.style.display = 'none';
  preview.style.display = '';
  
  updatePlatformAddBtn();
  console.log('[Platform] Video loaded:', file.name, file.size);
}

// === Update "Add to Queue" button state ===
function updatePlatformAddBtn() {
  const addBtn = document.getElementById('platform-add-queue-btn');
  if (!addBtn) return;
  
  const hasVideo = !!platformVideoFile;
  const hasAnyPlatform = ['tiktok', 'facebook', 'youtube'].some(p => {
    const cb = document.getElementById(`platform-${p}-enabled`);
    return cb && cb.checked;
  });
  
  addBtn.disabled = !(hasVideo && hasAnyPlatform);
}

// === Collect current form data into a queue item ===
function collectQueueItem() {
  const caption = document.getElementById('platform-caption')?.value || '';
  const scheduleType = document.querySelector('input[name="platform-schedule"]:checked')?.value || 'now';
  const scheduleTime = document.getElementById('platform-schedule-time')?.value || '';
  
  const platforms = [];
  if (document.getElementById('platform-tiktok-enabled')?.checked) {
    platforms.push({
      name: 'tiktok',
      productId: document.getElementById('platform-tiktok-product-id')?.value || '',
      cta: document.getElementById('platform-tiktok-cta')?.value || ''
    });
  }
  if (document.getElementById('platform-facebook-enabled')?.checked) {
    platforms.push({
      name: 'facebook',
      target: document.getElementById('platform-facebook-target')?.value || 'reels',
      privacy: document.getElementById('platform-facebook-privacy')?.value || 'public'
    });
  }
  if (document.getElementById('platform-youtube-enabled')?.checked) {
    platforms.push({
      name: 'youtube',
      title: document.getElementById('platform-youtube-title')?.value || '',
      type: document.getElementById('platform-youtube-type')?.value || 'shorts',
      privacy: document.getElementById('platform-youtube-privacy')?.value || 'public'
    });
  }
  
  return {
    id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    videoFile: platformVideoFile,
    videoName: platformVideoFile?.name || 'video.mp4',
    videoSize: platformVideoFile?.size || 0,
    thumbUrl: null, // will be set after
    caption,
    platforms,
    scheduleType,
    scheduleTime,
    status: 'pending', // pending | processing | done | error
    error: null
  };
}

// === Generate video thumbnail ===
function generateVideoThumb(file) {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;
      video.addEventListener('loadeddata', () => {
        video.currentTime = 1;
      });
      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 72;
        canvas.height = 72;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      });
      video.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

// === Add item to queue ===
async function addToQueue() {
  if (!platformVideoFile) return;
  
  const item = collectQueueItem();
  if (item.platforms.length === 0) return;
  
  // Generate thumbnail
  item.thumbUrl = await generateVideoThumb(platformVideoFile);
  
  platformQueue.push(item);
  console.log('[Platform] Added to queue:', item.id, item.videoName, item.platforms.map(p => p.name));
  
  renderQueue();
  resetPlatformForm();
}

// === Remove item from queue ===
function removeFromQueue(id) {
  if (platformQueueProcessing) return;
  platformQueue = platformQueue.filter(item => item.id !== id);
  renderQueue();
}

// === Reset form after adding to queue ===
function resetPlatformForm() {
  // Clear video
  platformVideoFile = null;
  const fileInput = document.getElementById('platform-video-input');
  const videoPreview = document.getElementById('platform-video-preview');
  const placeholder = document.getElementById('platform-upload-placeholder');
  const preview = document.getElementById('platform-upload-preview');
  if (fileInput) fileInput.value = '';
  if (videoPreview) videoPreview.src = '';
  if (placeholder) placeholder.style.display = '';
  if (preview) preview.style.display = 'none';
  
  // Clear caption
  const captionInput = document.getElementById('platform-caption');
  const charCount = document.getElementById('platform-char-count');
  if (captionInput) captionInput.value = '';
  if (charCount) charCount.textContent = '0 / 2200';
  
  // Clear YouTube title
  const ytTitle = document.getElementById('platform-youtube-title');
  if (ytTitle) ytTitle.value = '';
  
  // Clear TikTok fields
  const ttProduct = document.getElementById('platform-tiktok-product-id');
  if (ttProduct) ttProduct.value = '';
  const ttCta = document.getElementById('platform-tiktok-cta');
  if (ttCta) ttCta.value = '';
  const ttCtaCount = document.getElementById('platform-tiktok-cta-count');
  if (ttCtaCount) ttCtaCount.textContent = '0 / 30';
  
  // Reset schedule to "now"
  const nowRadio = document.querySelector('input[name="platform-schedule"][value="now"]');
  if (nowRadio) nowRadio.checked = true;
  const dtEl = document.getElementById('platform-schedule-datetime');
  if (dtEl) dtEl.style.display = 'none';
  
  updatePlatformAddBtn();
}

// === Render queue list UI ===
function renderQueue() {
  const listEl = document.getElementById('platform-queue-list');
  const emptyEl = document.getElementById('platform-queue-empty');
  const actionsEl = document.getElementById('platform-queue-actions');
  const countEl = document.getElementById('platform-queue-count');
  const startTextEl = document.getElementById('platform-start-all-text');
  
  if (!listEl) return;
  
  // Update count
  if (countEl) countEl.textContent = platformQueue.length;
  
  // Show/hide empty vs list
  if (emptyEl) emptyEl.style.display = platformQueue.length === 0 ? '' : 'none';
  if (actionsEl) actionsEl.style.display = platformQueue.length > 0 ? '' : 'none';
  
  // Update start button text
  if (startTextEl) {
    const pending = platformQueue.filter(i => i.status === 'pending').length;
    startTextEl.textContent = pending > 0
      ? `เริ่มโพสต์ทั้งหมด (${pending} รายการ)`
      : 'โพสต์เสร็จแล้ว';
  }
  
  // Render items
  listEl.innerHTML = '';
  platformQueue.forEach((item, index) => {
    const statusClass = item.status === 'processing' ? 'queue-processing'
      : item.status === 'done' ? 'queue-done'
      : item.status === 'error' ? 'queue-error' : '';
    
    const statusIcon = item.status === 'processing' ? '⏳'
      : item.status === 'done' ? '✅'
      : item.status === 'error' ? '❌'
      : '⏸️';
    
    const platformBadges = item.platforms.map(p =>
      `<span class="platform-queue-badge badge-${p.name}">${p.name === 'tiktok' ? 'TT' : p.name === 'facebook' ? 'FB' : 'YT'}</span>`
    ).join('');
    
    const scheduleText = item.scheduleType === 'scheduled' && item.scheduleTime
      ? new Date(item.scheduleTime).toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : 'ทันที';
    
    const captionPreview = item.caption
      ? (item.caption.length > 40 ? item.caption.slice(0, 40) + '...' : item.caption)
      : '(ไม่มี Caption)';
    
    const thumbHtml = item.thumbUrl
      ? `<img class="platform-queue-item-thumb" src="${item.thumbUrl}" alt="">`
      : `<div class="platform-queue-item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:14px;">🎬</div>`;
    
    const removeHtml = item.status === 'pending' && !platformQueueProcessing
      ? `<button class="platform-queue-item-remove" data-id="${item.id}" title="ลบ">✕</button>`
      : '';
    
    const el = document.createElement('div');
    el.className = `platform-queue-item ${statusClass}`;
    el.innerHTML = `
      <span class="platform-queue-item-num">${index + 1}</span>
      ${thumbHtml}
      <div class="platform-queue-item-info">
        <div class="platform-queue-item-caption">${captionPreview}</div>
        <div class="platform-queue-item-meta">
          <div class="platform-queue-item-platforms">${platformBadges}</div>
          <span>· ${scheduleText}</span>
          <span>· ${(item.videoSize / 1024 / 1024).toFixed(1)}MB</span>
        </div>
      </div>
      <span class="platform-queue-item-status">${statusIcon}</span>
      ${removeHtml}
    `;
    listEl.appendChild(el);
  });
  
  // Bind remove buttons
  listEl.querySelectorAll('.platform-queue-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromQueue(btn.dataset.id);
    });
  });
}

// === Process all queue items ===
async function processQueue() {
  if (platformQueueProcessing) return;
  
  const pending = platformQueue.filter(i => i.status === 'pending');
  if (pending.length === 0) return;
  
  platformQueueProcessing = true;
  const statusEl = document.getElementById('platform-post-status');
  const startBtn = document.getElementById('platform-start-all-btn');
  if (startBtn) startBtn.disabled = true;
  
  console.log(`[Platform] Processing queue: ${pending.length} items`);
  
  for (const item of pending) {
    item.status = 'processing';
    renderQueue();
    
    if (statusEl) statusEl.textContent = `⏳ กำลังเตรียม Video: ${item.videoName}...`;
    
    let videoBase64 = null;
    try {
      videoBase64 = await fileToBase64(item.videoFile);
    } catch (err) {
      item.status = 'error';
      item.error = 'อ่านไฟล์ Video ไม่สำเร็จ';
      renderQueue();
      continue;
    }
    
    // Post to each platform for this item
    for (const platform of item.platforms) {
      if (statusEl) statusEl.textContent = `⏳ [${platformQueue.indexOf(item) + 1}/${platformQueue.length}] โพสต์ "${item.videoName}" → ${platform.name}...`;
      
      try {
        await postToPlatform(platform, videoBase64, item.caption, item.scheduleType, item.scheduleTime);
        console.log(`[Platform] ✅ ${platform.name} done for item ${item.id}`);
        dashRecordEvent(item.videoName, 'success', platform.name, 'post');
      } catch (err) {
        console.error(`[Platform] ❌ ${platform.name} failed for item ${item.id}:`, err);
        item.error = `${platform.name}: ${err.message}`;
        dashRecordEvent(item.videoName, 'failed', platform.name, 'post');
      }
      
      // Wait between platforms (เผื่อเน็ตช้า)
      if (item.platforms.indexOf(platform) < item.platforms.length - 1) {
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    
    item.status = item.error ? 'error' : 'done';
    renderQueue();
    
    // Wait between queue items
    const nextPending = platformQueue.filter(i => i.status === 'pending');
    if (nextPending.length > 0) {
      if (statusEl) statusEl.textContent = `⏳ รอ 8 วินาที แล้วทำรายการถัดไป (เผื่อเน็ตช้า)...`;
      await new Promise(r => setTimeout(r, 8000));
    }
  }
  
  platformQueueProcessing = false;
  if (startBtn) startBtn.disabled = false;
  
  const doneCount = platformQueue.filter(i => i.status === 'done').length;
  const errorCount = platformQueue.filter(i => i.status === 'error').length;
  if (statusEl) statusEl.textContent = `✅ เสร็จสิ้น — สำเร็จ ${doneCount} รายการ${errorCount > 0 ? `, ล้มเหลว ${errorCount} รายการ` : ''}`;
  
  renderQueue();
}

// === Post to a single platform (shared logic) ===
async function postToPlatform(platform, videoBase64, caption, scheduleType, scheduleTime) {
  const UPLOAD_URLS = {
    tiktok: 'https://www.tiktok.com/creator#/upload?scene=creator_center',
    facebook: 'https://www.facebook.com/reels/create',
    youtube: 'https://studio.youtube.com/channel/UC/videos/upload'
  };
  
  const url = UPLOAD_URLS[platform.name];
  if (!url) throw new Error(`Unknown platform: ${platform.name}`);
  
  await chrome.storage.local.set({
    platformPostData: {
      platform: platform.name,
      videoBlob: videoBase64,
      caption: caption,
      scheduleType: scheduleType,
      scheduleTime: scheduleTime,
      ...platform,
      timestamp: Date.now()
    }
  });
  
  const tabs = await chrome.tabs.query({ url: `${url.split('?')[0]}*` });
  
  if (tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true, url: url });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url: url, active: true });
  }
  
  console.log(`[Platform] Opened ${platform.name} upload page`);
  
  return new Promise((resolve, reject) => {
    let settled = false;
    
    const cleanup = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      chrome.runtime.onMessage.removeListener(messageListener);
      chrome.storage.onChanged.removeListener(storageListener);
    };
    
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout — กรุณาอัพโหลด video เอง'));
    }, 120000);
    
    // วิธี 1: รับผ่าน chrome.runtime.onMessage
    const messageListener = (message) => {
      if (message.type === 'PLATFORM_POST_DONE' && message.platform === platform.name) {
        console.log('[Platform] Received PLATFORM_POST_DONE via message:', message);
        cleanup();
        if (message.success) {
          resolve();
        } else {
          reject(new Error(message.error || 'Post failed'));
        }
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    
    // วิธี 2: storage fallback — ถ้า sendMessage ส่งไม่ถึง
    const storageListener = (changes, area) => {
      if (area !== 'local' || !changes.platformPostDone?.newValue) return;
      const data = changes.platformPostDone.newValue;
      if (data.platform !== platform.name) return;
      // ตรวจ timestamp ไม่เก่าเกิน 30 วินาที
      if (Date.now() - data.timestamp > 30000) return;
      
      console.log('[Platform] Received platformPostDone via storage fallback:', data);
      // ลบ storage key
      chrome.storage.local.remove(['platformPostDone']);
      cleanup();
      if (data.success) {
        resolve();
      } else {
        reject(new Error(data.error || 'Post failed'));
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function updateStudioApiStatus() {
  const result = await chrome.storage.local.get(['googleKey']);
  const el = document.getElementById('studio-api-status');
  if (!el) return;
  
  if (result.googleKey) {
    el.classList.add('connected');
    el.innerHTML = '<span class="status-dot connected"></span><span class="status-text">Google API Key พร้อมใช้งาน</span>';
  } else {
    el.classList.remove('connected');
    el.innerHTML = '<span class="status-dot"></span><span class="status-text">ยังไม่ได้ตั้งค่า Google API Key (ไปที่แท็บ ⚙️)</span>';
  }
}

// ==========================================
// TAB 5: DASHBOARD — สรุปผลงาน
// ==========================================
const DASH_STORAGE_KEY = 'dashboardStats';

async function loadDashboardStats() {
  const result = await chrome.storage.local.get([DASH_STORAGE_KEY]);
  return result[DASH_STORAGE_KEY] || {
    total: 0, success: 0, failed: 0, skipped: 0,
    platforms: { tiktok: 0, facebook: 0, youtube: 0 },
    today: { posts: 0, images: 0, videos: 0, date: new Date().toDateString() },
    history: []
  };
}

async function saveDashboardStats(stats) {
  await chrome.storage.local.set({ [DASH_STORAGE_KEY]: stats });
}

function renderDashboard(stats) {
  document.getElementById('dash-total').textContent = stats.total || 0;
  document.getElementById('dash-success').textContent = stats.success || 0;
  document.getElementById('dash-failed').textContent = stats.failed || 0;
  document.getElementById('dash-skipped').textContent = stats.skipped || 0;

  document.getElementById('dash-tiktok-count').textContent = stats.platforms?.tiktok || 0;
  document.getElementById('dash-facebook-count').textContent = stats.platforms?.facebook || 0;
  document.getElementById('dash-youtube-count').textContent = stats.platforms?.youtube || 0;

  // Reset today if different date
  if (stats.today?.date !== new Date().toDateString()) {
    stats.today = { posts: 0, images: 0, videos: 0, date: new Date().toDateString() };
    saveDashboardStats(stats);
  }

  document.getElementById('dash-today-posts').textContent = stats.today?.posts || 0;
  document.getElementById('dash-today-images').textContent = stats.today?.images || 0;
  document.getElementById('dash-today-videos').textContent = stats.today?.videos || 0;

  // Render history
  const historyEl = document.getElementById('dash-history');
  if (!historyEl) return;

  const history = stats.history || [];
  if (history.length === 0) {
    historyEl.innerHTML = '<div class="dash-history-empty">ยังไม่มีประวัติ</div>';
    return;
  }

  historyEl.innerHTML = history.slice(0, 50).map(item => {
    const icon = item.status === 'success' ? '✅' : item.status === 'failed' ? '❌' : '⏭️';
    const time = item.time ? new Date(item.time).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';
    return `<div class="dash-history-item">
      <span class="dash-history-icon">${icon}</span>
      <span class="dash-history-text">${item.name || '-'}</span>
      <span class="dash-history-time">${time}</span>
    </div>`;
  }).join('');
}

// ★ Public API: เรียกจากที่อื่นเพื่อบันทึกสถิติ ★
async function dashRecordEvent(name, status, platform, type) {
  const stats = await loadDashboardStats();

  stats.total = (stats.total || 0) + 1;
  if (status === 'success') stats.success = (stats.success || 0) + 1;
  else if (status === 'failed') stats.failed = (stats.failed || 0) + 1;
  else if (status === 'skipped') stats.skipped = (stats.skipped || 0) + 1;

  if (platform && stats.platforms) {
    const p = platform.toLowerCase();
    if (p in stats.platforms) stats.platforms[p] = (stats.platforms[p] || 0) + 1;
  }

  // Today stats
  if (!stats.today || stats.today.date !== new Date().toDateString()) {
    stats.today = { posts: 0, images: 0, videos: 0, date: new Date().toDateString() };
  }
  if (type === 'post') stats.today.posts++;
  else if (type === 'image') stats.today.images++;
  else if (type === 'video') stats.today.videos++;

  // History (keep last 100)
  stats.history = stats.history || [];
  stats.history.unshift({ name, status, platform, type, time: Date.now() });
  if (stats.history.length > 100) stats.history = stats.history.slice(0, 100);

  await saveDashboardStats(stats);
  renderDashboard(stats);
}

async function initDashboardTab() {
  const stats = await loadDashboardStats();
  renderDashboard(stats);

  // Reset button
  const resetBtn = document.getElementById('dash-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('รีเซ็ตสถิติทั้งหมด?')) {
        const emptyStats = {
          total: 0, success: 0, failed: 0, skipped: 0,
          platforms: { tiktok: 0, facebook: 0, youtube: 0 },
          today: { posts: 0, images: 0, videos: 0, date: new Date().toDateString() },
          history: []
        };
        await saveDashboardStats(emptyStats);
        renderDashboard(emptyStats);
      }
    });
  }
}

// ==========================================
// TAB 6: TEMPLATES — Prompt Library
// ==========================================
const TPL_STORAGE_KEY = 'promptTemplates';

const TPL_CATEGORIES = {
  general: '📦 ทั่วไป',
  fashion: '👗 แฟชั่น',
  food: '🍕 อาหาร',
  beauty: '💄 ความงาม',
  tech: '📱 เทคโนโลยี',
  home: '🏠 บ้าน/ไลฟ์สไตล์',
  custom: '✏️ กำหนดเอง'
};

async function loadTemplates() {
  const result = await chrome.storage.local.get([TPL_STORAGE_KEY]);
  return result[TPL_STORAGE_KEY] || [];
}

async function saveTemplates(templates) {
  await chrome.storage.local.set({ [TPL_STORAGE_KEY]: templates });
}

function renderTemplateList(templates, filter) {
  const listEl = document.getElementById('tpl-list');
  const countEl = document.getElementById('tpl-count');
  if (!listEl) return;

  const filtered = filter && filter !== 'all' ? templates.filter(t => t.category === filter) : templates;

  countEl.textContent = `${filtered.length} รายการ`;

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="tpl-empty">ยังไม่มี Template ในหมวดนี้</div>';
    return;
  }

  listEl.innerHTML = filtered.map((tpl, idx) => {
    const badge = TPL_CATEGORIES[tpl.category] || tpl.category;
    const promptPreview = (tpl.prompt || '').substring(0, 120) + ((tpl.prompt || '').length > 120 ? '...' : '');
    return `<div class="tpl-item" data-id="${tpl.id}">
      <div class="tpl-item-header">
        <span class="tpl-item-name">${tpl.name || 'ไม่มีชื่อ'}</span>
        <span class="tpl-item-badge">${badge}</span>
      </div>
      <div class="tpl-item-prompt">${promptPreview}</div>
      <div class="tpl-item-actions">
        <button class="tpl-item-btn tpl-use-btn" data-id="${tpl.id}">📝 ใช้งาน</button>
        <button class="tpl-item-btn tpl-copy-btn" data-id="${tpl.id}">📋 คัดลอก</button>
        <button class="tpl-item-btn danger tpl-delete-btn" data-id="${tpl.id}">🗑️</button>
      </div>
    </div>`;
  }).join('');

  // Attach event listeners
  listEl.querySelectorAll('.tpl-use-btn').forEach(btn => {
    btn.addEventListener('click', () => useTemplate(btn.dataset.id));
  });
  listEl.querySelectorAll('.tpl-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => copyTemplate(btn.dataset.id));
  });
  listEl.querySelectorAll('.tpl-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteTemplate(btn.dataset.id));
  });
}

async function useTemplate(id) {
  const templates = await loadTemplates();
  const tpl = templates.find(t => t.id === id);
  if (!tpl) return;

  // Put prompt into Storymode topic-input
  const topicInput = document.getElementById('topic-input');
  if (topicInput) {
    topicInput.value = tpl.prompt;
    topicInput.dispatchEvent(new Event('input'));
  }

  // Switch to Storymode tab
  const storymodeTab = document.querySelector('.tab[data-tab="storymode"]');
  if (storymodeTab) storymodeTab.click();
}

async function copyTemplate(id) {
  const templates = await loadTemplates();
  const tpl = templates.find(t => t.id === id);
  if (!tpl) return;

  try {
    await navigator.clipboard.writeText(tpl.prompt);
    const btn = document.querySelector(`.tpl-copy-btn[data-id="${id}"]`);
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✅ คัดลอกแล้ว!';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    }
  } catch (e) {
    console.warn('[Templates] Clipboard copy failed:', e);
  }
}

async function deleteTemplate(id) {
  if (!confirm('ลบ Template นี้?')) return;

  let templates = await loadTemplates();
  templates = templates.filter(t => t.id !== id);
  await saveTemplates(templates);
  renderTemplateList(templates, currentTemplateFilter);
}

let currentTemplateFilter = 'all';

async function initTemplatesTab() {
  const templates = await loadTemplates();
  renderTemplateList(templates, 'all');

  // Save button
  const saveBtn = document.getElementById('tpl-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const name = document.getElementById('tpl-name-input')?.value?.trim();
      const category = document.getElementById('tpl-category-select')?.value || 'general';
      const prompt = document.getElementById('tpl-prompt-input')?.value?.trim();

      if (!name) { alert('กรุณาใส่ชื่อ Template'); return; }
      if (!prompt) { alert('กรุณาใส่ Prompt'); return; }

      const templates = await loadTemplates();
      templates.push({
        id: Date.now().toString(),
        name, category, prompt,
        createdAt: Date.now()
      });
      await saveTemplates(templates);

      // Clear form
      document.getElementById('tpl-name-input').value = '';
      document.getElementById('tpl-prompt-input').value = '';

      renderTemplateList(templates, currentTemplateFilter);

      // Flash save button
      saveBtn.textContent = '✅ บันทึกแล้ว!';
      setTimeout(() => { saveBtn.innerHTML = '<span>💾</span> บันทึก Template'; }, 1500);
    });
  }

  // Filter buttons
  document.querySelectorAll('.tpl-filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.tpl-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTemplateFilter = btn.dataset.filter;
      const templates = await loadTemplates();
      renderTemplateList(templates, currentTemplateFilter);
    });
  });
}

// =====================================================================
// ★★★ AUTO V2 — 3-Step Veo 3.1 Pipeline ★★★
// =====================================================================

let v2ProductQueue = [];
let v2IsRunning = false;
let v2RunSettings = { postMode: 'post', delaySeconds: 3, scheduleTimes: [] };
let v2FlowStats = { total: 0, success: 0, failed: 0, skipped: 0, isRunning: false };
let v2CurrentFlowItem = null;
let _v2IsProcessingFlowStep = false;
let _v2PendingFlowItem = null;
let _v2IsPostingToTikTok = false;
let _v2IsHandlingPosted = false;
let _v2IsStartingNextFlow = false;
let _v2IsHandlingFlowError = false;
let _v2ItemWatchdogTimer = null;
let _v2ItemWatchdogStartTime = null;
let _v2LastPostedItemId = null;
let _v2LastPostedTime = 0;

// ★ V2 Template Settings — read from UI ★
function getV2TemplateSettings() {
  return {
    packagingDesc: (document.getElementById('v2-packaging-desc')?.value || '').trim(),
    packagingType: (document.getElementById('v2-packaging-type')?.value || '').trim(),
    penColor: (document.getElementById('v2-pen-color')?.value || 'blue').trim(),
    surface: (document.getElementById('v2-surface')?.value || '').trim(),
    background: (document.getElementById('v2-background')?.value || '').trim(),
    handDirection: (document.getElementById('v2-hand-direction')?.value || 'right side').trim(),
    bgMovement: (document.getElementById('v2-bg-movement')?.value || '').trim()
  };
}

// ★ V2 Prompt Builders — Template 1, 2, 3 ★
function buildV2ImagePrompt(item, s) {
  const name = item.name || 'product';
  const price = item.price || '???';
  return `Static high-angle medium shot. Multiple ${s.packagingDesc} of ${name} and an open brown corrugated cardboard shipping box. A white paper price tag handwritten in bold ${s.penColor} marker reading '${price}'. 2-3 ${s.packagingType} are placed upright in front of the box, and 6-8 ${s.packagingType} are neatly stacked inside the open box visible from above. The price tag is placed on the table in the foreground. Shot on a ${s.surface}. Bright natural daylight, soft shadows, ${s.background} background. Vibrant product colors pop against the brown cardboard. Photorealistic, 8K resolution, sharp focus on products, commercial advertising style.`;
}

function buildV2VideoPrompt(item, s) {
  const price = item.price || '???';
  return `[00:00-00:02] Static high-angle medium shot. The camera remains completely still, focusing on the ${s.packagingType} and the handwritten price tag reading '${price}' on the table.\n[00:02-00:04] A human hand enters the frame from the ${s.handDirection}. The hand points its index finger at the ${s.packagingType}, making a small circular motion to highlight the product size.\n[00:04-00:06] The hand moves down to point repeatedly at the handwritten price tag reading '${price}' on the table to emphasize the cheap price. The background shows slight, natural movement like ${s.bgMovement}. Smooth cinematic motion, photorealistic.`;
}

function buildV2ExtendPrompt(item, s) {
  return `Continue the static high-angle medium shot seamlessly. The human hand and the ${s.packagingType}. The hand stops pointing at the price tag and reaches out to pick up one of the ${s.packagingType} from the table. The hand lifts the ${s.packagingType} slightly to show its thickness and weight to the camera, holding it for a moment to emphasize its value, before gently placing it back down on the table. The background continues its subtle natural movement. Smooth cinematic motion, photorealistic, consistent lighting.`;
}

function generateV2Prompts(item) {
  const s = getV2TemplateSettings();
  if (!s.packagingDesc || !s.packagingType || !s.surface || !s.background || !s.bgMovement) {
    throw new Error('กรุณากรอกข้อมูล Template Settings ให้ครบก่อนรัน');
  }
  item.v2ImagePrompt = buildV2ImagePrompt(item, s);
  item.v2VideoPrompt = buildV2VideoPrompt(item, s);
  item.v2ExtendPrompt = buildV2ExtendPrompt(item, s);
  if (!item.caption) {
    item.caption = `${item.name} ${item.price || ''} #TikTokShop #สินค้าดี`;
  }
  if (!item.cta) {
    item.cta = 'กดสั่งซื้อเลย';
  }
}

// ★ V2 Queue Helpers ★
function v2GetNextPending() { return v2ProductQueue.find(i => i.status === 'pending'); }
function v2GetProcessing() { return v2ProductQueue.find(i => i.status === 'processing'); }
function v2CountByStatus(st) { return v2ProductQueue.filter(i => i.status === st).length; }
function v2GetQueueStats() {
  return {
    total: v2ProductQueue.length,
    pending: v2CountByStatus('pending'),
    processing: v2CountByStatus('processing'),
    posted: v2CountByStatus('posted'),
    failed: v2CountByStatus('failed'),
    skipped: v2CountByStatus('skipped')
  };
}
function v2HasWorkRemaining() { return v2ProductQueue.some(i => i.status === 'pending' || i.status === 'processing'); }
function v2RetryFailed() {
  const failed = v2ProductQueue.filter(i => i.status === 'failed' && (i.retryCount || 0) < MAX_RETRY_COUNT);
  if (failed.length === 0) return false;
  failed.forEach(i => { i.retryCount = (i.retryCount || 0) + 1; i.status = 'pending'; i.flowState = null; i.failReason = null; });
  v2SaveQueue(); v2RenderQueue();
  return true;
}
function v2CheckAllCompleteOrRetry() {
  const s = v2GetQueueStats();
  if (s.pending > 0) return 'continue';
  if (s.failed > 0 && v2RetryFailed()) return 'retry';
  return 'done';
}
function v2GetRemainingCount() { return v2ProductQueue.filter(i => i.status === 'pending' || i.status === 'processing').length; }

// ★ V2 Persistence ★
let _v2SaveTimer = null;
function v2SaveQueue() {
  if (_v2SaveTimer) clearTimeout(_v2SaveTimer);
  _v2SaveTimer = setTimeout(() => {
    chrome.storage.local.set({ v2ProductQueue: v2ProductQueue });
  }, 500);
}
function v2SaveQueueNow() {
  if (_v2SaveTimer) clearTimeout(_v2SaveTimer);
  chrome.storage.local.set({ v2ProductQueue: v2ProductQueue });
}

// ★ V2 Logging ★
function v2AddLog(message, type = 'info') {
  const logEl = document.getElementById('v2-activity-log');
  if (!logEl) return;
  const empty = logEl.querySelector('.log-empty');
  if (empty) empty.remove();
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const now = new Date();
  entry.innerHTML = `<span class="log-time">${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}</span> ${message}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

let _v2LastLogItem = {};
function v2AddFlowLog(itemKey, message, type = 'info') {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
  const logEl = document.getElementById('v2-activity-log');
  if (!logEl) return;
  const empty = logEl.querySelector('.log-empty');
  if (empty) empty.remove();
  if (_v2LastLogItem[itemKey]) {
    _v2LastLogItem[itemKey].innerHTML = `<span class="log-time">${timeStr}</span> ${message}`;
    _v2LastLogItem[itemKey].className = `log-entry ${type}`;
  } else {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="log-time">${timeStr}</span> ${message}`;
    logEl.appendChild(entry);
    _v2LastLogItem[itemKey] = entry;
  }
  logEl.scrollTop = logEl.scrollHeight;
  console.log(`[AutoV2] ${message}`);
}

// ★ V2 Flow Progress UI ★
function v2ResetFlowStats(total) {
  v2FlowStats = { total, success: 0, failed: 0, skipped: 0, isRunning: true };
  const card = document.getElementById('v2-flow-progress-card');
  if (card) card.style.display = '';
  const el = (id) => document.getElementById(id);
  if (el('v2-fp-success')) el('v2-fp-success').textContent = '0';
  if (el('v2-fp-failed')) el('v2-fp-failed').textContent = '0';
  if (el('v2-fp-skipped')) el('v2-fp-skipped').textContent = '0';
  if (el('v2-fp-remaining')) el('v2-fp-remaining').textContent = total;
  if (el('v2-fp-progress-fill')) el('v2-fp-progress-fill').style.width = '0%';
  if (el('v2-fp-progress-text')) el('v2-fp-progress-text').textContent = `0 / ${total} รายการ`;
  if (el('v2-fp-items-log')) el('v2-fp-items-log').innerHTML = '';
}

function v2UpdateFlowStep(itemId, stepText, itemName) {
  const el = (id) => document.getElementById(id);
  if (el('v2-fp-item-name')) el('v2-fp-item-name').textContent = itemName || itemId;
  if (el('v2-fp-step')) el('v2-fp-step').textContent = stepText;
  const done = v2FlowStats.success + v2FlowStats.failed + v2FlowStats.skipped;
  const pct = v2FlowStats.total > 0 ? Math.round((done / v2FlowStats.total) * 100) : 0;
  if (el('v2-fp-progress-fill')) el('v2-fp-progress-fill').style.width = pct + '%';
  if (el('v2-fp-progress-text')) el('v2-fp-progress-text').textContent = `${done} / ${v2FlowStats.total} รายการ`;
  if (el('v2-fp-remaining')) el('v2-fp-remaining').textContent = v2FlowStats.total - done;
}

function v2RecordFlowResult(itemId, status, reason, itemName) {
  if (status === 'success') v2FlowStats.success++;
  else if (status === 'failed') v2FlowStats.failed++;
  else if (status === 'skipped') v2FlowStats.skipped++;
  const el = (id) => document.getElementById(id);
  if (el('v2-fp-success')) el('v2-fp-success').textContent = v2FlowStats.success;
  if (el('v2-fp-failed')) el('v2-fp-failed').textContent = v2FlowStats.failed;
  if (el('v2-fp-skipped')) el('v2-fp-skipped').textContent = v2FlowStats.skipped;
  v2UpdateFlowStep(itemId, status === 'success' ? '✅ เสร็จ' : '❌ ' + reason, itemName);
}

function v2CompleteFlowProgress() {
  v2FlowStats.isRunning = false;
  const el = document.getElementById('v2-fp-badge');
  if (el) { el.textContent = 'เสร็จแล้ว'; el.style.background = '#2d6a4f'; }
}

// ★ V2 Render Product Queue ★
function v2RenderQueue() {
  const queueEl = document.getElementById('v2-product-queue');
  if (!queueEl) return;
  const searchTerm = (document.getElementById('v2-product-search')?.value || '').toLowerCase();
  const filtered = searchTerm ? v2ProductQueue.filter(p => (p.name || '').toLowerCase().includes(searchTerm)) : v2ProductQueue;
  
  if (filtered.length === 0) {
    queueEl.innerHTML = '<div class="empty-state"><span>—</span><p>ยังไม่มีสินค้า</p><p class="hint">กด "ดึงสินค้า" เพื่อดึงจาก TikTok</p></div>';
    return;
  }
  
  const statusIcon = { pending: '⏳', processing: '🔄', posted: '✅', failed: '❌', skipped: '⏭️' };
  queueEl.innerHTML = filtered.map((p, i) => {
    const icon = statusIcon[p.status] || '⏳';
    const imgHtml = p.image ? `<img src="${p.image}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;">` : '<div style="width:40px;height:40px;border-radius:4px;background:#333;display:flex;align-items:center;justify-content:center;">📦</div>';
    return `<div class="product-item ${p.status === 'processing' ? 'processing' : ''}" style="display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid #333;">
      ${imgHtml}
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${icon} ${p.name || 'ไม่มีชื่อ'}</div>
        <div style="font-size:10px;color:#888;">${p.price || '-'} | ${p.status}</div>
      </div>
      <button class="btn-icon danger" onclick="window.v2RemoveItem('${p.id}')" title="ลบ" style="font-size:10px;">×</button>
    </div>`;
  }).join('');
  
  const countEl = document.getElementById('v2-product-count');
  if (countEl) countEl.textContent = v2ProductQueue.length;
}

// ★ V2 Control Buttons ★
function v2UpdateControlButtons() {
  const runBtn = document.getElementById('v2-run-btn');
  const stopBtn = document.getElementById('v2-stop-btn');
  const nextBtn = document.getElementById('v2-next-btn');
  if (runBtn) runBtn.disabled = v2IsRunning || v2ProductQueue.length === 0;
  if (stopBtn) stopBtn.disabled = !v2IsRunning;
  if (nextBtn) nextBtn.disabled = !v2IsRunning;
}

// ★ V2 Watchdog ★
function v2StartWatchdog() {
  v2StopWatchdog();
  _v2ItemWatchdogStartTime = Date.now();
  _v2ItemWatchdogTimer = setInterval(() => {
    if (!v2IsRunning) { v2StopWatchdog(); return; }
    const elapsed = Date.now() - _v2ItemWatchdogStartTime;
    const current = v2GetProcessing();
    if (!current) { _v2ItemWatchdogStartTime = Date.now(); return; }
    if (elapsed > 35 * 60 * 1000) {
      console.log(`[V2 Watchdog] Item "${current.name}" stuck — auto-skipping`);
      v2AddLog(`⏰ Timeout 35 นาที: ${current.name} — ข้ามอัตโนมัติ`, 'error');
      v2HandleStepFailed({ message: `Timeout: item stuck for ${Math.round(elapsed/60000)} minutes` });
    }
  }, 30000);
}
function v2StopWatchdog() { if (_v2ItemWatchdogTimer) { clearInterval(_v2ItemWatchdogTimer); _v2ItemWatchdogTimer = null; } _v2ItemWatchdogStartTime = null; }
function v2ResetWatchdog() { _v2ItemWatchdogStartTime = Date.now(); }

// ★ V2 Handle Step Failed ★
async function v2HandleStepFailed(data) {
  if (_v2IsHandlingFlowError) return;
  _v2IsHandlingFlowError = true;
  try {
    const current = v2GetProcessing();
    if (current) {
      current.status = 'failed';
      current.failReason = data?.message || 'Unknown error';
      v2AddLog(`❌ ล้มเหลว: ${current.name} — ${current.failReason}`, 'error');
      v2RecordFlowResult(current.id, 'failed', current.failReason, current.name);
      v2SaveQueueNow(); v2RenderQueue();
    }
    _v2IsProcessingFlowStep = false;
    _v2PendingFlowItem = null;
    _v2IsPostingToTikTok = false;
    _v2IsHandlingPosted = false;
    
    await chrome.storage.local.set({ flowStatus: null, currentFlowData: null, flowType: null });
    
    const result = v2CheckAllCompleteOrRetry();
    if ((result === 'continue' || result === 'retry') && v2IsRunning) {
      v2AddLog(`🔄 ไปรายการถัดไป...`, 'info');
      await new Promise(r => setTimeout(r, 5000));
      v2StartNextItemFlow();
    } else {
      const stats = v2GetQueueStats();
      v2AddLog(`🎉 ทำครบแล้ว! (สำเร็จ ${stats.posted}, ล้มเหลว ${stats.failed})`, 'success');
      v2IsRunning = false; v2UpdateControlButtons(); v2CompleteFlowProgress();
    }
  } finally {
    _v2IsHandlingFlowError = false;
  }
}

// ★ V2 processFlowItem ★
async function v2ProcessFlowItem(item) {
  if (_v2IsProcessingFlowStep) {
    _v2PendingFlowItem = item;
    return;
  }
  _v2IsProcessingFlowStep = true;
  _v2PendingFlowItem = null;
  
  try {
    v2AddFlowLog(item.id, `🔄 ${item.name}: เริ่ม processFlow`, 'info');
    const steps = V2_FLOW_CONFIG;
    
    if (!item.flowState) {
      item.flowState = { currentStepIndex: 0, completedSteps: [], status: 'running' };
    }
    
    if (!item.v2ImagePrompt || !item.v2VideoPrompt || !item.v2ExtendPrompt) {
      v2AddFlowLog(item.id, `⚡ ${item.name}: สร้าง V2 Prompts...`, 'info');
      generateV2Prompts(item);
    }
    
    v2SaveQueueNow();
    
    const currentStep = steps[item.flowState.currentStepIndex];
    if (!currentStep) {
      item.flowState.status = 'completed';
      item.status = 'completed';
      v2AddFlowLog(item.id, `✅ ${item.name}: เสร็จสิ้น`, 'success');
      v2SaveQueueNow();
      return;
    }
    
    v2AddFlowLog(item.id, `▶️ ${item.name}: ${V2_FLOW_STEP_LABELS[currentStep]}`, 'info');
    
    try {
      await v2ExecuteFlowStep(item, currentStep);
    } catch (stepError) {
      console.error('[AutoV2] executeFlowStep error:', stepError);
      v2AddFlowLog(item.id, `❌ ${item.name}: Step ล้มเหลว — ${stepError.message}`, 'error');
      v2HandleStepFailed({ message: stepError.message });
    }
  } finally {
    _v2IsProcessingFlowStep = false;
    if (_v2PendingFlowItem) {
      const pending = _v2PendingFlowItem;
      _v2PendingFlowItem = null;
      v2ProcessFlowItem(pending);
    }
  }
}

// ★ V2 executeFlowStep ★
async function v2ExecuteFlowStep(item, step) {
  v2AddFlowLog(item.id, `⚡ ${item.name}: step=${step}`, 'info');
  v2CurrentFlowItem = item;
  
  switch(step) {
    case V2_FLOW_STEPS.CREATE_IMAGE:
      v2AddFlowLog(item.id, `🖼️ ${item.name}: สร้างรูปภาพ (Template 1)...`, 'info');
      await v2OpenGoogleFlow(item, 'v2_image', item.v2ImagePrompt);
      break;
      
    case V2_FLOW_STEPS.CREATE_VIDEO: {
      v2AddFlowLog(item.id, `🎬 ${item.name}: กำลังสร้างวิดีโอ (Template 2)...`, 'info');
      v2UpdateFlowStep(item.id, '🎬 รอวิดีโอ Template 2...', item.name);
      const VIDEO_TIMEOUT = 15 * 60 * 1000;
      const POLL_MS = 5000;
      const start = Date.now();
      const readySet = new Set(['v2_video_saved', 'completed_download']);
      let ready = false;
      
      while (Date.now() - start < VIDEO_TIMEOUT) {
        if (!v2IsRunning) return;
        const poll = await chrome.storage.local.get(['flowStatus']);
        if (readySet.has(poll.flowStatus)) {
          v2AddFlowLog(item.id, `✅ ${item.name}: Video เสร็จ!`, 'success');
          ready = true;
          break;
        }
        if (poll.flowStatus === 'v2_extending') {
          const el = Math.round((Date.now() - start) / 1000);
          if (el % 15 === 0) v2AddFlowLog(item.id, `🎞️ ${item.name}: Video เสร็จ กำลัง Extend... (${el} วิ)`, 'info');
        }
        if (poll.flowStatus === 'flow_error') throw new Error('Video generation failed');
        const el = Math.round((Date.now() - start) / 1000);
        if (el % 30 === 0) v2UpdateFlowStep(item.id, `🎬 รอวิดีโอ... ${el} วิ`, item.name);
        await new Promise(r => setTimeout(r, POLL_MS));
      }
      
      if (!ready) throw new Error('Video generation timeout (15 min)');
      
      v2AddFlowLog(item.id, `⏭️ ${item.name}: Video เสร็จ → รอ Extend`, 'info');
      if (!item.flowState.completedSteps.includes(V2_FLOW_STEPS.CREATE_VIDEO)) {
        item.flowState.completedSteps.push(V2_FLOW_STEPS.CREATE_VIDEO);
      }
      item.flowState.currentStepIndex = V2_FLOW_CONFIG.indexOf(V2_FLOW_STEPS.EXTEND_VIDEO);
      v2SaveQueueNow(); v2RenderQueue();
      break;
    }
      
    case V2_FLOW_STEPS.EXTEND_VIDEO: {
      v2AddFlowLog(item.id, `🎞️ ${item.name}: Extend Video (Template 3)...`, 'info');
      v2UpdateFlowStep(item.id, '🎞️ รอ Extend Video...', item.name);
      const EXT_TIMEOUT = 15 * 60 * 1000;
      const EXT_POLL = 5000;
      const extStart = Date.now();
      const extReadySet = new Set(['v2_extend_done', 'completed_download']);
      let extReady = false;
      
      while (Date.now() - extStart < EXT_TIMEOUT) {
        if (!v2IsRunning) return;
        const poll = await chrome.storage.local.get(['flowStatus']);
        if (extReadySet.has(poll.flowStatus)) {
          v2AddFlowLog(item.id, `✅ ${item.name}: Extend เสร็จ!`, 'success');
          extReady = true;
          break;
        }
        if (poll.flowStatus === 'flow_error') throw new Error('Extend Video failed');
        const el = Math.round((Date.now() - extStart) / 1000);
        if (el % 30 === 0) v2UpdateFlowStep(item.id, `🎞️ รอ Extend... ${el} วิ`, item.name);
        await new Promise(r => setTimeout(r, EXT_POLL));
      }
      
      if (!extReady) throw new Error('Extend Video timeout (15 min)');
      
      if (!item.flowState.completedSteps.includes(V2_FLOW_STEPS.EXTEND_VIDEO)) {
        item.flowState.completedSteps.push(V2_FLOW_STEPS.EXTEND_VIDEO);
      }
      item.flowState.currentStepIndex = V2_FLOW_CONFIG.indexOf(V2_FLOW_STEPS.UPLOAD_TIKTOK);
      v2SaveQueueNow(); v2RenderQueue();
      v2AddFlowLog(item.id, `📤 ${item.name}: → TikTok Upload`, 'info');
      await v2OpenTikTokUpload(item);
      break;
    }
      
    case V2_FLOW_STEPS.UPLOAD_TIKTOK:
      await v2OpenTikTokUpload(item);
      break;
      
    case V2_FLOW_STEPS.POST_TIKTOK:
      await v2PostToTikTok(item);
      break;
  }
}

// ★ V2 Open Google Flow ★
async function v2OpenGoogleFlow(item, mode, prompt) {
  v2AddFlowLog(item.id, `🌐 ${item.name}: เปิด Google Flow (${mode})...`, 'info');
  
  const flowData = {
    itemId: item.id,
    mode: mode,
    prompt: prompt || '',
    productName: item.name,
    productId: item.productId || item.id || '',
    imageUrl: item.image || item.imageUrl || '',
    caption: item.caption || '',
    cta: item.cta || '',
    v2VideoPrompt: item.v2VideoPrompt || '',
    v2ExtendPrompt: item.v2ExtendPrompt || '',
    postMode: v2RunSettings.postMode || 'post',
    scheduleTime: (v2RunSettings.postMode === 'schedule' && v2RunSettings.scheduleTimes?.length > 0)
      ? v2RunSettings.scheduleTimes[v2ProductQueue.indexOf(item)] || v2RunSettings.scheduleTimes[0]
      : null,
    // ★ PD-INSPIRED: Explicit model selection ★
    flowImageModel: document.getElementById('flow-image-model')?.value || 'auto',
    flowVideoModel: document.getElementById('flow-video-model')?.value || 'auto',
    timestamp: Date.now()
  };
  
  await chrome.storage.local.set({
    currentFlowData: flowData,
    flowStatus: 'waiting_for_flow',
    flowType: 'autov2'
  });
  
  const tabs = await chrome.tabs.query({ url: 'https://labs.google/fx/tools/flow*' });
  let flowTabId = null;
  
  if (tabs.length > 0) {
    flowTabId = tabs[0].id;
    v2AddFlowLog(item.id, `🔄 ${item.name}: Reload Google Flow...`, 'info');
    await chrome.tabs.update(flowTabId, { url: FLOW_URLS.GOOGLE_FLOW, active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
    await waitForTabLoaded(flowTabId, 20000);
  } else {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
      flowTabId = activeTab.id;
      await chrome.tabs.update(activeTab.id, { url: FLOW_URLS.GOOGLE_FLOW });
    } else {
      const newTab = await chrome.tabs.create({ url: FLOW_URLS.GOOGLE_FLOW, active: true });
      flowTabId = newTab.id;
    }
    if (flowTabId) await waitForTabLoaded(flowTabId, 20000);
  }
  
  item.flowStatus = `waiting_${mode}`;
  v2SaveQueueNow(); v2RenderQueue();
}

// ★ V2 TikTok Upload ★
async function v2OpenTikTokUpload(item) {
  v2AddFlowLog(item.id, `📤 ${item.name}: รอ TikTok Upload + Post...`, 'info');
  v2UpdateFlowStep(item.id, '📤 รอ TikTok Upload + Post...', item.name);
  
  const TIMEOUT = 20 * 60 * 1000;
  const POLL = 5000;
  const start = Date.now();
  let lastLog = 0;
  
  while (Date.now() - start < TIMEOUT) {
    if (!v2IsRunning) return;
    const result = await chrome.storage.local.get(['currentItemPosted', 'flowStatus']);
    
    if (result.currentItemPosted === true) {
      v2AddFlowLog(item.id, `✅ ${item.name}: TikTok เสร็จแล้ว!`, 'success');
      v2UpdateFlowStep(item.id, '✅ เสร็จ!', item.name);
      
      await chrome.storage.local.set({
        currentItemPosted: false, currentItemPostedAt: null,
        flowStatus: 'waiting_for_flow', flowMessage: null,
        currentFlowData: null, flowType: null
      });
      
      item.status = 'posted';
      item.posted = true;
      item.postedAt = new Date().toISOString();
      v2AddLog(`✅ เสร็จ: ${item.name}`, 'success');
      v2RecordFlowResult(item.id, 'success', 'เสร็จสมบูรณ์', item.name);
      
      _v2LastPostedItemId = item.id;
      _v2LastPostedTime = Date.now();
      v2SaveQueueNow(); v2RenderQueue();
      
      _v2IsProcessingFlowStep = false;
      _v2PendingFlowItem = null;
      _v2IsPostingToTikTok = false;
      _v2IsHandlingPosted = false;
      
      const cycleResult = v2CheckAllCompleteOrRetry();
      if ((cycleResult === 'continue' || cycleResult === 'retry') && v2IsRunning) {
        const nextP = v2GetNextPending();
        if (nextP) {
          v2AddLog(`🚀 ถัดไป: ${nextP.name} (เหลือ ${v2GetRemainingCount()})`, 'info');
        }
        const delay = 15000;
        v2AddFlowLog(item.id, `⏳ รอ ${delay/1000} วิ ก่อนรายการถัดไป...`, 'info');
        await new Promise(r => setTimeout(r, delay));
        v2StartNextItemFlow();
      } else {
        const stats = v2GetQueueStats();
        v2AddLog(`🎉 ทำครบแล้ว! (สำเร็จ ${stats.posted}, ล้มเหลว ${stats.failed})`, 'success');
        v2IsRunning = false; v2UpdateControlButtons(); v2CompleteFlowProgress();
      }
      return;
    }
    
    if (result.flowStatus === 'flow_error') {
      v2AddFlowLog(item.id, `❌ ${item.name}: TikTok Upload ล้มเหลว`, 'error');
      await chrome.storage.local.set({ flowStatus: null, flowMessage: null });
      throw new Error('TikTok upload/post failed');
    }
    
    const elapsed = Math.round((Date.now() - start) / 1000);
    if (Date.now() - lastLog > 30000) {
      v2UpdateFlowStep(item.id, `⏳ รอ TikTok Upload... ${elapsed} วิ`, item.name);
      lastLog = Date.now();
    }
    await new Promise(r => setTimeout(r, POLL));
  }
  
  throw new Error('TikTok upload timeout (20 min)');
}

async function v2PostToTikTok(item) {
  if (_v2IsPostingToTikTok) return;
  _v2IsPostingToTikTok = true;
  try {
    v2AddFlowLog(item.id, `✅ ${item.name}: โพส TikTok เสร็จ!`, 'success');
    _v2IsProcessingFlowStep = false;
    _v2PendingFlowItem = null;
  } finally {
    _v2IsPostingToTikTok = false;
  }
}

// ★ V2 Start Next Item Flow ★
async function v2StartNextItemFlow() {
  if (_v2IsStartingNextFlow) return;
  _v2IsStartingNextFlow = true;
  
  try {
    const nextItem = v2GetNextPending();
    if (!nextItem) {
      const result = v2CheckAllCompleteOrRetry();
      if (result === 'retry') {
        _v2IsStartingNextFlow = false;
        await new Promise(r => setTimeout(r, 3000));
        v2StartNextItemFlow();
        return;
      }
      const stats = v2GetQueueStats();
      v2AddLog(`🎉 ทำครบแล้ว! (สำเร็จ ${stats.posted}, ล้มเหลว ${stats.failed})`, 'success');
      v2CompleteFlowProgress();
      v2IsRunning = false; v2UpdateControlButtons();
      return;
    }
    
    v2AddFlowLog(nextItem.id, `🚀 ${nextItem.name}: เริ่มทำงาน...`, 'info');
    v2ResetWatchdog();
    
    await chrome.storage.local.set({
      currentItemPosted: false, currentItemPostedAt: null,
      flowStatus: 'waiting_for_flow', flowMessage: null,
      currentFlowData: null, flowType: null
    });
    
    nextItem.status = 'processing';
    v2SaveQueueNow(); v2RenderQueue();
    v2UpdateFlowStep(nextItem.id, '🖼️ เริ่มสร้างรูปภาพ...', nextItem.name);
    
    if (!nextItem.flowState) {
      nextItem.flowState = { currentStepIndex: 0, completedSteps: [], status: 'running' };
    }
    
    v2ProcessFlowItem(nextItem);
  } finally {
    _v2IsStartingNextFlow = false;
  }
}

// ★ V2 Run Entry Point ★
function v2ShowRunModal() {
  const modal = document.getElementById('v2-run-settings-modal');
  if (!modal) return;
  const pendingCount = v2ProductQueue.filter(i => i.status === 'pending' || i.status !== 'posted').length;
  const countEl = document.getElementById('v2-run-product-count');
  if (countEl) countEl.textContent = pendingCount;
  modal.style.display = 'flex';
}

function v2CollectRunSettings() {
  const postModeRadio = document.querySelector('input[name="v2-post-mode"]:checked');
  v2RunSettings.postMode = postModeRadio ? postModeRadio.value : 'post';
  const delayInput = document.getElementById('v2-delay-seconds');
  v2RunSettings.delaySeconds = delayInput ? parseInt(delayInput.value) || 3 : 3;
  
  if (v2RunSettings.postMode === 'schedule') {
    const startInput = document.getElementById('v2-schedule-start-time');
    const intervalInput = document.getElementById('v2-schedule-interval');
    if (startInput?.value) {
      const startTime = new Date(startInput.value);
      const intervalMin = parseInt(intervalInput?.value) || 120;
      v2RunSettings.scheduleTimes = v2ProductQueue.map((_, i) => {
        const t = new Date(startTime.getTime() + i * intervalMin * 60 * 1000);
        return t.toISOString();
      });
    }
  }
}

function runAutoV2() {
  v2AddLog('🎬 runAutoV2() เริ่มทำงาน', 'info');
  
  if (v2ProductQueue.length === 0) {
    v2AddLog('ไม่มีสินค้าในคิว กรุณาดึงสินค้าก่อน', 'error');
    return;
  }
  
  const s = getV2TemplateSettings();
  if (!s.packagingDesc || !s.packagingType || !s.surface || !s.background || !s.bgMovement) {
    v2AddLog('❌ กรุณากรอก Template Settings ให้ครบก่อนรัน', 'error');
    alert('กรุณากรอก Template Settings ให้ครบทุกช่อง (ลักษณะบรรจุภัณฑ์, ประเภท, พื้นผิว, ฉากหลัง, การเคลื่อนไหวฉากหลัง)');
    return;
  }
  
  v2IsRunning = true;
  v2UpdateControlButtons();
  v2StartWatchdog();
  
  let pendingItem = v2GetNextPending();
  if (!pendingItem) {
    v2AddLog('🔄 Reset สถานะสินค้าทั้งหมดเป็น pending...', 'info');
    v2ProductQueue.forEach(item => { item.status = 'pending'; item.flowState = null; item.retryCount = 0; });
    v2SaveQueueNow(); v2RenderQueue();
    pendingItem = v2GetNextPending();
  }
  
  v2ResetFlowStats(v2ProductQueue.length);
  
  if (pendingItem) {
    v2AddLog(`📦 เริ่มประมวลผล: ${pendingItem.name}`, 'info');
    pendingItem.status = 'processing';
    v2RenderQueue(); v2SaveQueueNow();
    
    chrome.storage.local.set({
      currentFlowData: null, flowStatus: null, flowType: null,
      currentItemPosted: false, currentItemPostedAt: null
    }).then(() => {
      if (!pendingItem.flowState) {
        pendingItem.flowState = { currentStepIndex: 0, completedSteps: [], status: 'running' };
      }
      v2ProcessFlowItem(pendingItem);
    });
  }
}

function stopAutoV2() {
  v2IsRunning = false;
  v2StopWatchdog();
  v2UpdateControlButtons();
  v2AddLog('⏹️ หยุดทำงาน', 'warning');
  chrome.storage.local.set({ flowStatus: null, flowType: null, currentFlowData: null });
}

function v2NextProduct() {
  const current = v2GetProcessing();
  if (current) {
    current.status = 'skipped';
    v2AddLog(`⏭️ ข้าม: ${current.name}`, 'warning');
    v2RecordFlowResult(current.id, 'skipped', 'ข้ามโดยผู้ใช้', current.name);
    v2SaveQueueNow(); v2RenderQueue();
  }
  _v2IsProcessingFlowStep = false;
  _v2PendingFlowItem = null;
  v2StartNextItemFlow();
}

// ★ V2 Handle scraping messages (reuse same scraper as autopost) ★
function v2HandleProducts(products) {
  let added = 0;
  products.forEach(p => {
    const exists = v2ProductQueue.some(q => q.id === p.id || q.productId === p.productId);
    if (!exists) {
      v2ProductQueue.push({ ...p, status: 'pending' });
      added++;
    }
  });
  if (added > 0) {
    v2AddLog(`📦 เพิ่ม ${added} สินค้าใหม่ (รวม ${v2ProductQueue.length})`, 'success');
    v2SaveQueueNow(); v2RenderQueue(); v2UpdateControlButtons();
  }
}

// ★ V2 Init — event listeners + load saved queue ★
function initAutoV2() {
  const fetchBtn = document.getElementById('v2-fetch-btn');
  const fetchAllBtn = document.getElementById('v2-fetch-all-btn');
  const runBtn = document.getElementById('v2-run-btn');
  const stopBtn = document.getElementById('v2-stop-btn');
  const nextBtn = document.getElementById('v2-next-btn');
  const refreshBtn = document.getElementById('v2-refresh-products');
  const clearAllBtn = document.getElementById('v2-clear-all');
  const clearLogBtn = document.getElementById('v2-clear-log');
  const searchInput = document.getElementById('v2-product-search');
  
  if (fetchBtn) fetchBtn.addEventListener('click', () => {
    const page = parseInt(document.getElementById('v2-page-input')?.value) || 1;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapePage', page: page });
    });
  });
  if (fetchAllBtn) fetchAllBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeAllPages' });
    });
  });
  if (runBtn) runBtn.addEventListener('click', v2ShowRunModal);
  if (stopBtn) stopBtn.addEventListener('click', stopAutoV2);
  if (nextBtn) nextBtn.addEventListener('click', v2NextProduct);
  if (refreshBtn) refreshBtn.addEventListener('click', () => { v2RenderQueue(); v2UpdateControlButtons(); });
  if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
    if (confirm('ลบสินค้าทั้งหมดใน V2?')) { v2ProductQueue = []; v2SaveQueueNow(); v2RenderQueue(); v2UpdateControlButtons(); }
  });
  if (clearLogBtn) clearLogBtn.addEventListener('click', () => {
    const logEl = document.getElementById('v2-activity-log');
    if (logEl) logEl.innerHTML = '<div class="log-empty">ยังไม่มีกิจกรรม</div>';
    _v2LastLogItem = {};
  });
  if (searchInput) searchInput.addEventListener('input', v2RenderQueue);
  
  // V2 Run Modal
  const closeModal = document.getElementById('v2-close-run-modal');
  const cancelRun = document.getElementById('v2-cancel-run');
  const confirmRun = document.getElementById('v2-confirm-run');
  const modal = document.getElementById('v2-run-settings-modal');
  
  if (closeModal) closeModal.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });
  if (cancelRun) cancelRun.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });
  if (confirmRun) confirmRun.addEventListener('click', () => {
    v2CollectRunSettings();
    if (modal) modal.style.display = 'none';
    runAutoV2();
  });
  
  // Schedule toggle
  document.querySelectorAll('input[name="v2-post-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const schedSettings = document.getElementById('v2-schedule-settings');
      if (schedSettings) schedSettings.style.display = radio.value === 'schedule' && radio.checked ? '' : 'none';
    });
  });
  
  // Load saved queue
  chrome.storage.local.get(['v2ProductQueue', 'v2TemplateSettings'], (result) => {
    if (result.v2ProductQueue) {
      v2ProductQueue = result.v2ProductQueue;
      v2RenderQueue();
      v2UpdateControlButtons();
    }
    if (result.v2TemplateSettings) {
      const s = result.v2TemplateSettings;
      const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
      set('v2-packaging-desc', s.packagingDesc);
      set('v2-packaging-type', s.packagingType);
      set('v2-pen-color', s.penColor);
      set('v2-surface', s.surface);
      set('v2-background', s.background);
      set('v2-hand-direction', s.handDirection);
      set('v2-bg-movement', s.bgMovement);
    }
  });
  
  // Save template settings on input change
  ['v2-packaging-desc','v2-packaging-type','v2-pen-color','v2-surface','v2-background','v2-hand-direction','v2-bg-movement'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      chrome.storage.local.set({ v2TemplateSettings: getV2TemplateSettings() });
    });
  });
  
  v2UpdateControlButtons();
}

// ★ V2 Remove item (called from onclick in queue) ★
window.v2RemoveItem = function(itemId) {
  v2ProductQueue = v2ProductQueue.filter(p => p.id !== itemId);
  v2SaveQueueNow(); v2RenderQueue(); v2UpdateControlButtons();
};

// ★ Expose functions to window for onclick handlers in innerHTML (ES Module scope fix) ★
window.removeDevice = removeDevice;
window.copyCleanScript = copyCleanScript;
window.smRemoveFromQueue = smRemoveFromQueue;

// ============================================================
// Share Sheet — Step 6 Extension
// On-device download + Deep Link + IndexedDB Storage
// ============================================================

const SHARE_SHEET_DB_NAME = 'ShareSheetDB';
const SHARE_SHEET_DB_VERSION = 1;
const SHARE_SHEET_STORE = 'posts';

/** Open (or create) the ShareSheet IndexedDB */
function openShareSheetDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SHARE_SHEET_DB_NAME, SHARE_SHEET_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SHARE_SHEET_STORE)) {
        const store = db.createObjectStore(SHARE_SHEET_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('platform', 'platform', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save a post record to IndexedDB.
 * @param {{ productName:string, photoPrompt:string, videoPrompt:string, platform:string }} meta
 */
async function saveToShareSheetDB(meta) {
  try {
    const db = await openShareSheetDB();
    const record = {
      productName: meta.productName || '',
      photoPrompt: meta.photoPrompt || '',
      videoPrompt: meta.videoPrompt || '',
      platform: meta.platform || '',
      timestamp: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SHARE_SHEET_STORE, 'readwrite');
      const store = tx.objectStore(SHARE_SHEET_STORE);
      const req = store.add(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[ShareSheet] IndexedDB save failed:', err);
  }
}

/**
 * Download a Blob (or blob URL / data URL) as a file.
 * Returns the local filename used.
 */
async function shareSheetDownloadVideo(url, filename) {
  try {
    let href = url;
    if (url.startsWith('blob:') || url.startsWith('http')) {
      const resp = await fetch(url);
      const blob = await resp.blob();
      href = URL.createObjectURL(blob);
    }
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // revoke only if we created the object URL
    if (href !== url) setTimeout(() => URL.revokeObjectURL(href), 60000);
    return filename;
  } catch (err) {
    console.warn('[ShareSheet] Download failed:', err);
    throw err;
  }
}

/** Deep link URLs for each platform */
const SHARE_DEEP_LINKS = {
  facebook:  'https://www.facebook.com/reels/create/',
  youtube:   'https://studio.youtube.com/channel/upload',
  tiktok:    'https://www.tiktok.com/creator-center/upload',
  instagram: 'https://www.instagram.com/create/story/',
};

/**
 * Open the platform upload page.
 * caption is URL-encoded and appended where supported.
 */
function shareSheetOpenPlatform(platform, caption) {
  const base = SHARE_DEEP_LINKS[platform] || '#';
  let url = base;
  if (caption) {
    const enc = encodeURIComponent(caption);
    if (platform === 'facebook')  url = `${base}?description=${enc}`;
    if (platform === 'tiktok')    url = `${base}?caption=${enc}`;
  }
  chrome.tabs.create({ url, active: true });
}

/** Collect the best video URL from studioItems (selected first, then first video, then first image) */
function shareSheetPickBestItem() {
  if (!studioItems || studioItems.length === 0) return null;
  return (
    studioItems.find(i => i.selected && i.type === 'video') ||
    studioItems.find(i => i.type === 'video') ||
    studioItems.find(i => i.selected) ||
    studioItems[0]
  );
}

/** Show / hide the render progress bar */
function shareSheetSetProgress(visible, pct, label) {
  const el = document.getElementById('share-sheet-render');
  const bar = document.getElementById('share-sheet-render-bar');
  const lbl = document.getElementById('share-sheet-render-label');
  if (!el) return;
  if (visible) {
    el.classList.add('visible');
    if (bar) bar.style.width = `${pct}%`;
    if (lbl) lbl.textContent = label || '';
  } else {
    el.classList.remove('visible');
  }
}

/** Set the badge text in the share sheet header */
function shareSheetSetBadge(text) {
  const el = document.getElementById('share-sheet-badge');
  if (el) el.textContent = text || '';
}

/** Set the warning message */
function shareSheetSetWarning(text) {
  const el = document.getElementById('share-sheet-warning');
  if (el) el.textContent = text || '';
}

/**
 * Core handler: download video + (optionally) open platform + save to IndexedDB.
 * @param {'facebook'|'youtube'|'tiktok'|'instagram'|'save'} platform
 */
async function shareSheetHandlePlatform(platform) {
  const item = shareSheetPickBestItem();
  if (!item) {
    shareSheetSetWarning('⚠️ ยังไม่มีวิดีโอ — สร้างวิดีโอที่ Step 5 ก่อน');
    return;
  }

  // Disable all buttons while processing
  const btns = document.querySelectorAll('.share-btn');
  btns.forEach(b => b.disabled = true);
  shareSheetSetWarning('');
  shareSheetSetProgress(true, 10, 'เตรียมไฟล์วิดีโอ...');

  const caption = document.getElementById('ss-caption')?.value?.trim()
    || document.getElementById('platform-caption')?.value?.trim()
    || '';
  const productName = document.getElementById('studio-product-name')?.value?.trim()
    || document.querySelector('.queue-item-name')?.textContent?.trim()
    || 'product';
  const photoPrompt = studioMasterPrompt || '';
  const videoPrompt = item.prompt || '';
  const ext = item.type === 'video' ? 'mp4' : 'png';
  const ts = Date.now();
  const filename = `1click_${platform}_${ts}.${ext}`;

  try {
    shareSheetSetProgress(true, 40, 'กำลังดาวน์โหลดวิดีโอ...');
    await shareSheetDownloadVideo(item.url, filename);
    shareSheetSetProgress(true, 80, 'ดาวน์โหลดสำเร็จ!');

    if (platform !== 'save') {
      // Open platform with caption pre-filled
      setTimeout(() => shareSheetOpenPlatform(platform, caption), 600);
    }

    // Save metadata to IndexedDB for every action
    await saveToShareSheetDB({ productName, photoPrompt, videoPrompt, platform });

    shareSheetSetProgress(true, 100, platform === 'save' ? '💾 บันทึกสำเร็จ!' : '✅ ดาวน์โหลดแล้ว — เลือกไฟล์ใน App เพื่อโพสต์');
    shareSheetSetBadge('✓ Done');

    if (platform === 'save') {
      // Redirect to library page (if available)
      try {
        const libUrl = chrome.runtime.getURL('library.html');
        setTimeout(() => chrome.tabs.create({ url: libUrl, active: false }), 1200);
      } catch (_) { /* library page optional */ }
    }

    setTimeout(() => {
      shareSheetSetProgress(false);
      shareSheetSetBadge('');
    }, 3500);

  } catch (err) {
    shareSheetSetProgress(false);
    shareSheetSetWarning(`❌ เกิดข้อผิดพลาด: ${err.message || err}`);
  } finally {
    btns.forEach(b => b.disabled = false);
  }
}

/** Wire up all Share Sheet buttons */
function initShareSheet() {
  const map = {
    'ss-btn-facebook':  'facebook',
    'ss-btn-youtube':   'youtube',
    'ss-btn-tiktok':    'tiktok',
    'ss-btn-instagram': 'instagram',
    'ss-btn-save':      'save',
  };
  Object.entries(map).forEach(([id, platform]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => shareSheetHandlePlatform(platform));
  });
  console.log('[1Click] Share Sheet initialised');
}

