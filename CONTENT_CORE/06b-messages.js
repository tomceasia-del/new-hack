/**
 * 06b-messages.js — Toast & Status Messages
 * ==========================================
 * Split จาก 06-ui-copy.js (lines 55–148)
 * เนื้อหา: TOAST_MESSAGES, STATUS_MESSAGES
 */

// ==================== Toast / Success Messages ====================
export const TOAST_MESSAGES = {
  // showSuccess / showLicenseSuccess calls
  allDone:              'ทำครบแล้ว! สำเร็จ ${stats.posted}/${stats.total}',  // lines 2758, 2769, 3023
  storymodeFlowSent:    'ส่ง … Prompt ฉาก ${scene} ไป Google Flow แล้ว!',   // line 9662
  flowTabOpened:        'เปิด Google Flow แล้ว — รอหน้าโหลดเสร็จแล้วจะทำงานอัตโนมัติ', // line 9667
  deviceRemoved:        'ลบเครื่องนี้สำเร็จ! กำลังกลับไปหน้า License...',  // line 370
  deviceRemovedShort:   'ลบ Device สำเร็จ',                                  // line 375
};


// ==================== Status / Progress Messages ====================
export const STATUS_MESSAGES = {
  // Login / device management (lines 185–275)
  noLicenseKey:         '❌ กรุณากรอก License Key ให้ครบก่อน',
  devicesFound:         '📱 พบ ${n}/2 อุปกรณ์ที่ลงทะเบียน',
  devicesLoadFail:      '❌ ไม่สามารถโหลดรายชื่ออุปกรณ์ได้: …',
  deviceDeleteSuccess:  '✅ ลบอุปกรณ์สำเร็จ!',
  deviceDeleteFail:     '❌ … ไม่สามารถลบอุปกรณ์ได้',
  genericError:         '❌ เกิดข้อผิดพลาด: …',
  loading:              '⏳ กำลังโหลด...',                                    // line 191, 245
  manageDevices:        '📱 จัดการอุปกรณ์ที่ลงทะเบียน',
  loadingShort:         'กำลังโหลด...',                                       // line 318
  noDevices:            'ยังไม่มี Device ลงทะเบียน',                          // line 328
  loadError:            'เกิดข้อผิดพลาดในการโหลด',                            // line 353

  // License status (lines 426–465)
  noLicense:            'ไม่มี License',
  licenseInvalid:       'License ไม่ถูกต้อง',
  unlimited:            '♾️ ไม่จำกัด',
  expired:              '❌ หมดอายุ',
  expiresWarning:       '⚠️ เหลือ ${daysLeft} วัน',
  expiresOk:            '✅ เหลือ ${daysLeft} วัน',
  unlimitedShort:       'ไม่จำกัด',

  // Scraping (lines 3150, 3169–3286)
  scrapeDone:           'เสร็จสิ้น! ดึงได้ … สินค้า',
  scrapingPage:         'กำลังดึงหน้า ${targetPage}...',
  scrapingData:         'กำลังดึงข้อมูล...',
  checkingPages:        'กำลังตรวจสอบจำนวนหน้า...',
  scrapingAllPages:     'กำลังดึงสินค้าทุกหน้า...',
  connectFail:          'เชื่อมต่อไม่สำเร็จ',
  stoppedByUser:        'หยุดโดยผู้ใช้',

  // Flow progress UI (lines 3475–3529)
  done:                 'เสร็จสิ้น',
  doneWithFail:         'เสร็จ (… ล้มเหลว)',
  itemCount:            '… / … รายการ',
  allItemsDone:         'ทำครบทุกรายการแล้ว!',
  working:              'กำลังทำงาน...',

  // Loading panels / AI generation (lines 5159, 10073–10126)
  processing:           'กำลังประมวลผล...',
  generating:           'กำลังสร้าง...',
  aiAnalyzingProduct:   '🔍 AI กำลังวิเคราะห์รูปสินค้า...',
  aiAnalyzingChar:      '🔍 AI กำลังวิเคราะห์รูปตัวละคร reference...',
  generatingScript:     'กำลังสร้างสคริปต์ด้วย ${providerLabel}...',
  queueGenerating:      '[Queue] กำลังสร้างสคริปต์...',
  aiContinuing:         '⏳ AI เขียนยังไม่จบ — กำลังต่อ...',

  // Studio media progress (lines 10770–10909)
  creatingVideo:        'กำลังสร้างวีดีโอ... (${elapsed} วิ)',
  creatingImage:        'กำลังสร้างรูป...',
  creatingVideoLong:    'กำลังสร้างวีดีโอ... (อาจใช้เวลา 2-5 นาที)',
  sceneProgress:        '${completed}/${total} ฉาก...',

  // Platform posting (lines 12963–13011)
  preparingVideo:       '⏳ กำลังเตรียม Video: …',
  postingItem:          '⏳ […] โพสต์ "…" → …',
  waitingNext:          '⏳ รอ 8 วินาที แล้วทำรายการถัดไป...',
  postingDone:          '✅ เสร็จสิ้น — สำเร็จ … รายการ…',

  // Google API (lines 13118–13121)
  googleApiReady:       'Google API Key พร้อมใช้งาน',
  googleApiNotSet:      'ยังไม่ได้ตั้งค่า Google API Key (ไปที่แท็บ ⚙️)',

  // Settings / cache (lines 9770–9885)
  savedWords:           '✅ บันทึกแล้ว ${words.length} คำ',
  clearedBannedWords:   '🗑️ ล้างคำต้องห้ามเพิ่มเติมแล้ว',
  clearedData:          '✅ ล้าง ${labels[mode]} เรียบร้อย!',
  savedSettings:        '✅ บันทึกการตั้งค่าเรียบร้อย!',
  connectedChatGPT:     'เชื่อมต่อ ChatGPT แล้ว',
  connectedGemini:      'เชื่อมต่อ Gemini AI แล้ว',
  noApiKey:             'ยังไม่ได้ตั้งค่า API Key (OpenAI หรือ Google AI)',

  // Zoom Flow (lines 2384–2390)
  zoomFlow:             '🔍 Zoom Google Flow: ${zoomLevel}%',
  zoomNoTab:            '⚠️ ไม่พบ Tab Google Flow - กรุณาเปิด Google Flow ก่อน',
  zoomFail:             '❌ ส่งคำสั่ง Zoom ไม่สำเร็จ',

  // Scene ready notification (lines 9706–9707)
  sceneReady:           '✅ Prompt ฉาก ${scene} พร้อมแล้ว!',
  gotoAutoPaste:        'ไปที่ … แล้วกด Auto Paste',
};
