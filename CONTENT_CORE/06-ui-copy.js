/**
 * UI COPY & FEATURE NAMES (keep_partial จาก sidepanel.html)
 * ===========================================================
 * เก็บเฉพาะ: ชื่อแท็บ/feature + ข้อความ UI สำหรับอ้างอิง UX แอปใหม่
 * แหล่งที่มา: sidepanel.html บรรทัด 1-1682
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

// ==================== UI Copy ====================
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


// ==================== Toast / Success Messages (จาก sidepanel.js E5) ====================
export const TOAST_MESSAGES = {
  // showSuccess / showLicenseSuccess calls
  allDone:              'ทำครบแล้ว! สำเร็จ ${stats.posted}/${stats.total}',  // lines 2758, 2769, 3023
  storymodeFlowSent:    'ส่ง … Prompt ฉาก ${scene} ไป Google Flow แล้ว!',   // line 9662
  flowTabOpened:        'เปิด Google Flow แล้ว — รอหน้าโหลดเสร็จแล้วจะทำงานอัตโนมัติ', // line 9667
  deviceRemoved:        'ลบเครื่องนี้สำเร็จ! กำลังกลับไปหน้า License...',  // line 370
  deviceRemovedShort:   'ลบ Device สำเร็จ',                                  // line 375
};


// ==================== Status / Progress Messages (จาก sidepanel.js E5) ====================
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


// ==================== Error Messages (จาก sidepanel.js E5) ====================
export const ERROR_MESSAGES = {
  // License (lines 142, 166, 389)
  enterLicenseKey:      'กรุณาใส่ License Key',
  errorWithDetail:      'เกิดข้อผิดพลาด: …',
  enterLicenseFirst:    'กรุณาใส่ License Key ก่อน',
  cantDeleteDevice:     'ไม่สามารถลบอุปกรณ์ได้',            // line 272

  // Copy (line 1890)
  cantCopy:             'ไม่สามารถคัดลอกได้',

  // Scraping (lines 3160–3292)
  openTikTokFirst:      'กรุณาเปิดหน้า TikTok ก่อนกด "ดึงสินค้า"',
  openTikTokAllPages:   'กรุณาเปิดหน้า TikTok ก่อนกด "ดึงทุกหน้า"',
  cantConnect:          'ไม่สามารถเชื่อมต่อได้ กรุณารีเฟรชหน้า TikTok แล้วลองใหม่',

  // Prompts / queue (lines 4102, 4535–4628)
  createPromptFirst:    'กรุณาสร้าง Prompt ก่อนเปิด Flow',
  setApiKeyFirst:       'กรุณาตั้งค่า API Key ก่อนใช้งาน',
  noItemsInQueue:       'ไม่มีสินค้าในคิว',
  setApiKeySettings:    'กรุณาตั้งค่า API Key ก่อนใช้งาน (ไปที่แท็บ Settings)',

  // AutoPost / Storymode (lines 5944–9678)
  noItemsScrapeFirst:   'ไม่มีสินค้าในคิว กรุณาดึงสินค้าก่อน',
  pipelineRunning:      'Pipeline กำลังทำงานอยู่ — รอให้เสร็จก่อน',
  sceneNotFound:        'ไม่พบข้อมูลฉากที่ …',
  pressGenerateFirst:   'กรุณากด Generate ก่อน…',
  noScenePrompts:       'ไม่พบ Scene Prompts…',
  noPromptForScene:     'ไม่มี prompt สำหรับฉากนี้',

  // Story queue (lines 7276–7373)
  enterCustomPrompt:    'โหมด Prompt กำหนดเอง: กรุณาใส่ข้อความ…',
  enterTopicFirst:      'กรุณาใส่หัวข้อเรื่องก่อน…',
  cantDeleteActive:     'ไม่สามารถลบเรื่องที่กำลังทำงานอยู่',
  cantClearWhileRunning:'ไม่สามารถล้างคิวขณะกำลังทำงาน',
  noStoriesInQueue:     'ไม่มีเรื่องในคิว',
  queueAlreadyRunning:  'Queue กำลังทำงานอยู่แล้ว',

  // Clear data (lines 9806–9811)
  clearFail:            '❌ ล้างไม่สำเร็จ: …',
  clearFailShort:       '❌ ไม่สำเร็จ: …',

  // API / Gemini (lines 10066, 10227–10645)
  setApiKeyGemini:      'กรุณาตั้งค่า API Key ก่อนใช้งาน (OpenAI หรือ Google AI) ไปที่แท็บ "ตั้งค่า API"',
  allGeminiRateLimited: 'All Gemini models rate limited — กรุณารอสักครู่แล้วลองใหม่',
  openAINoResponse:     'OpenAI ไม่ตอบกลับ — กรุณาลองใหม่',
  geminiNoResponse:     'Gemini ไม่ตอบกลับ (…) — …',
  setGoogleApiKey:      'กรุณาตั้งค่า Google AI API Key ก่อน (ไปที่แท็บ ⚙️)',
  noImageReceived:      'ไม่ได้รับรูปภาพจาก …',
  noVideoFromVeo:       'ไม่ได้รับวีดีโอจาก Veo 3.1…',
  veoTimeout:           'Veo 3.1 timeout: รอนานเกิน 5 นาที',
  videoDownloadFail:    'ดาวน์โหลดวีดีโอจาก URI ไม่สำเร็จ',
  cantParseResult:      'ไม่สามารถวิเคราะห์ผลลัพธ์ได้',        // line 1732

  // alert() calls
  noVideoYet:           'ยังไม่มีวีดีโอที่สร้างไว้',            // line 10925
  mergeVideoFail:       'รวมวีดีโอไม่สำเร็จ: …',                // line 10960
  enterPromptFirst:     'กรุณาใส่ Prompt หลัก หรือ Storytelling ก่อน', // line 11363
  errorDetail:          '❌ เกิดข้อผิดพลาด: …',
  postingInProgress:    'กำลังโพสต์อยู่ — รอให้เสร็จก่อนค่อยล้าง', // line 12310
  videoFilesOnly:       'กรุณาเลือกไฟล์ Video เท่านั้น…',        // line 12671
  enterTemplateName:    'กรุณาใส่ชื่อ Template',                  // line 13363
  enterTemplatePrompt:  'กรุณาใส่ Prompt',                        // line 13364
  fillV2Settings:       'กรุณากรอก Template Settings ให้ครบทุกช่อง (ลักษณะบรรจุภัณฑ์, ประเภท, พื้นผิว, ฉากหลัง, การเคลื่อนไหวฉากหลัง)', // line 14053
};


// ==================== Button / Label Text (จาก sidepanel.js E5) ====================
export const BUTTON_LABELS = {
  // Generic actions
  activate:             'เปิดใช้งาน',                 // line 295
  copy:                 '📋 คัดลอก',
  copiedSuccess:        '✅ คัดลอกแล้ว!',
  copyAll:              'คัดลอกทั้งหมด',
  copyScript:           '📋 คัดลอก Script',
  uploadPhoto:          '+ อัปรูป',                    // line 2041
  deleteDevice:         '🗑️ ลบ',
  deleteThisDevice:     '🔓 ลบเครื่องนี้',
  thisDevice:           'เครื่องนี้',
  registered:           'ลงทะเบียน:',
  lastUsed:             'ใช้ล่าสุด',
  lastUsedFull:         'ใช้งานล่าสุด',

  // Generate / create buttons
  generating:           '⏳ กำลังสร้าง...',
  generateAllPrompts:   '✨ AI สร้าง Prompts ทั้งหมด',
  createScript:         'สร้างสคริปต์ TikTok',

  // Studio pipeline buttons (lines 10790–10961)
  creatingAll:          'กำลังสร้างทั้งหมด...',
  createAll:            '🚀 สร้างทั้งหมด (รูป + วีดีโอ)',
  createNewImage:       '🖼️ สร้างรูปใหม่',
  createImage:          '🖼️ สร้างรูป',
  createNewVideo:       '🎬 สร้างวีดีโอใหม่',
  createVideo:          '🎬 สร้างวีดีโอ',
  createdDone:          '✅ สร้างเสร็จ',
  mergingVideo:         'กำลังรวมวีดีโอ...',
  downloaded:           '✅ ดาวน์โหลดแล้ว!',
  mergeAllVideo:        '🎞️ รวมวีดีโอทั้งหมด',
  uploadedClickChange:  '✅ อัพโหลดแล้ว (คลิกเพื่อเปลี่ยน)',

  // Master prompt (lines 11368–11612)
  generatingMasterPrompt: 'กำลังสร้าง Master Prompt...',
  masterPromptDone:     'สร้างเสร็จ! (คลิกเพื่อสร้างใหม่)',
  mergeMasterPrompt:    'ผสานข้อมูล → สร้าง Master Prompt',

  // Studio image/video counts (lines 12200–12314)
  createImageN:         'สร้างรูป (N ฉาก)',
  createImageSingle:    'สร้างรูป',
  createVideoN:         'สร้างวีดีโอ (N ฉาก)',
  createVideoSingle:    'สร้างวีดีโอ',
  creatingImageDots:    'กำลังสร้างรูป...',
  creatingVideoDots:    'กำลังสร้างวีดีโอ...',
  doneTick:             '✅ เสร็จ!',

  // Veo subtitle (line 12446)
  veoWithImage:         'Veo 3.1 (+ รูปที่เลือก)',

  // AI caption/CTA (lines 12530–12630)
  aiCreateCaption:      '🤖 AI สร้าง Caption',
  aiCreateCta:          '🤖 AI สร้าง CTA',

  // Template save (lines 13381–13382)
  saved:                '✅ บันทึกแล้ว!',
  saveTemplate:         'บันทึก Template',

  // V2 progress (line 13582)
  doneV2:               'เสร็จแล้ว',

  // Zoom buttons (lines 2363–2369)
  zoomReset:            'คืนขนาด Google Flow เป็น 100%',
  zoomMini:             'ย่อขนาด Google Flow เหลือ 33%',

  // Scene per-flow (lines 9630–9666)
  openingDots:          '⏳ กำลังเปิด...',
  sentTick:             '✅ ส่งแล้ว!',
  openedTick:           '✅ เปิดแล้ว!',

  // Clear data btn (line 9795)
  clearingDots:         '⏳ กำลังล้าง...',

  // Raw/card toggle (lines 9027–9031)
  viewRaw:              'ดูแบบ Raw',
  viewCard:             'ดูแบบการ์ด',

  // Empty states (various lines)
  noActivity:           'ยังไม่มีกิจกรรม',
  noLog:                'ยังไม่มี log — …',
  noStoryInQueue:       'ยังไม่มีเรื่องในคิว',
  pressMergeToCreate:   'กด "ผสานข้อมูล" เพื่อสร้าง Scene',
  noImageVideo:         'ยังไม่มีรูป/วีดีโอ — …',
  noHistory:            'ยังไม่มีประวัติ',
  noTemplateInCategory: 'ยังไม่มี Template ในหมวดนี้',
  noProducts:           'ยังไม่มีสินค้า',
  pullProductsHint:     'กด "ดึงสินค้า"…',

  // Tag states (lines 6249, 6947–6953)
  notSelected:          'ยังไม่ได้เลือก',
  selectedNone:         'เลือกแล้ว: —',
  selectedPrefix:       'เลือกแล้ว: ',

  // Scene selector labels (from renderSharedSelectors lines 2160–2180)
  categoryLabel:        '🏷️ หมวดสินค้า',
  hookLabel:            '🎣 ฮุคเปิดคลิป (บทพูด)',
  visualStyleLabel:     '🎨 สไตล์ภาพ',
  backgroundLabel:      '🏠 พื้นหลัง',
  characterLabel:       '👤 ตัวละคร',
  dialogStyleLabel:     '💬 สไตล์บทพูด',
  speakingStyleLabel:   '🗣️ วิธีพูด',
  voiceToneLabel:       '🎙️ ลักษณะเสียง',
  scriptStructureLabel: '📝 โครงสร้าง Script',
  noChangeOption:       '— ไม่เปลี่ยน —',
};


// ==================== Product Status Constants (from sidepanel.js lines 975–984) ====================
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

// Batch status map (lines 4604–4606)
export const BATCH_STATUS = {
  pending:    'รอดำเนินการ',
  inProgress: 'กำลังดำเนินการ',
  success:    'สำเร็จ',
};


// ==================== Confirm Dialog Copy (จาก sidepanel.js E5) ====================
export const CONFIRM_COPY = {
  deleteAllProducts:    'ต้องการลบสินค้าทั้งหมด … รายการ?',   // line 3351
  resetStats:           'รีเซ็ตสถิติทั้งหมด?',                  // line 13224
  deleteTemplate:       'ลบ Template นี้?',                      // line 13341
  deleteAllV2:          'ลบสินค้าทั้งหมดใน V2?',                // line 14153
};


// ==================== MERGED FROM UI SCAN E1–E5 ====================
// Source: sidepanel.js full-file scan (982 entries before dedup)
// Added: 351 new entries (after removing duplicates of existing 06-ui-copy.js values)

export const UI_COPY_EXTENDED = {

  // ─── ERROR MESSAGES ───────────────────────────────────────────────
  error_cannot_delete_device:       '❌ ไม่สามารถลบอุปกรณ์ได้',                                                              // E1 line 272  (❌ prefix — distinct from existing 'ไม่สามารถลบอุปกรณ์ได้')
  error_generic_with_msg:           'เกิดข้อผิดพลาด: ',                                                                        // E1 line 166  (bare prefix, no trailing …)
  error_handle_flow_error:          '❌ Error ใน handleFlowStepFailed: {msg}',                                                 // E1 line 3031
  error_cannot_load_devices:        '❌ ไม่สามารถโหลดรายชื่ออุปกรณ์ได้: ',                                                    // E1 line 241  (no trailing …)
  error_no_api_key_queue:           'ไม่มี API Key — กรุณาตั้งค่า API Key ก่อนใช้งาน Queue',                                  // E3 line 7572
  error_custom_prompt_empty:        'โหมด Prompt กำหนดเอง: กรุณาใส่ข้อความในช่อง Prompt เต็มชุดก่อนเพิ่มเข้าคิว',            // E3 line 7276
  error_topic_empty:                'กรุณาใส่หัวข้อเรื่องก่อนเพิ่มเข้าคิว',                                                    // E3 line 7281
  error_scene_not_found:            'ไม่พบข้อมูลฉากที่ {n}',                                                                   // E3 line 7967  ({n} template)
  error_no_scene_prompts:           'กรุณากด Generate ก่อนเพื่อสร้าง Scene Prompts',                                           // E3 line 8281
  error_no_scenes_in_output:        'ไม่พบ Scene Prompts ใน output กรุณา Generate ใหม่',                                       // E3 line 8291
  error_storymode_generic:          'เกิดข้อผิดพลาด: {error}',                                                                  // E3 line 8368  ({error} template)
  error_no_api_key_openai_google:   'กรุณาตั้งค่า API Key ก่อนใช้งาน (OpenAI หรือ Google AI)',                                  // E2 line 5346  (shorter — no 'ไปที่แท็บ' suffix)
  error_gemini_empty:               'Gemini ไม่ตอบกลับ ({blockReason}) — อาจถูก safety filter block หรือ prompt ยาวเกินไป',   // E4 line 10343
  error_no_image_from_gemini:       'ไม่ได้รับรูปภาพจาก Gemini API',                                                           // E4 line 10573
  error_no_image_from_flash:        'ไม่ได้รับรูปภาพจาก Gemini 3.1 Flash Image API',                                           // E4 line 10634
  error_no_veo_operation:           'ไม่ได้รับ operation name จาก Veo 3.1',                                                     // E4 line 10695
  error_no_video_from_veo:          'ไม่ได้รับวีดีโอจาก Veo 3.1 — ดู Console log เพื่อตรวจสอบ response',                      // E4 line 10761
  error_merge_failed:               'รวมวีดีโอไม่สำเร็จ: {message}',                                                            // E4 line 10960  ({message} template)
  error_no_api_key_studio:          'กรุณาตั้งค่า API Key ก่อนใช้งาน (OpenAI หรือ Google AI) ไปที่แท็บ ⚙️ ตั้งค่า',          // E4 line 11510
  error_studio_generate_fail:       '❌ เกิดข้อผิดพลาด: {message}',                                                            // E4 line 11611
  error_select_image_first:         'กรุณาสร้างรูปก่อน แล้วเลือกรูปที่ต้องการสร้างวีดีโอ',                                     // E4 line 12262
  error_cache_failed:               '❌ ล้างไม่สำเร็จ: {error}',                                                               // E4 line 9806  ({error} template)
  error_cache_exception:            '❌ ไม่สำเร็จ: {message}',                                                                  // E4 line 9811
  error_platform_api_key:           'กรุณาตั้งค่า Google AI API Key ก่อน (แท็บ ⚙️)',                                           // E5 line 12534  (short form)
  error_platform_file_type:         'กรุณาเลือกไฟล์ Video เท่านั้น (.mp4, .mov, .webm)',                                        // E5 line 12685
  error_platform_read_file:         'อ่านไฟล์ Video ไม่สำเร็จ',                                                                 // E5 line 12970
  error_platform_timeout:           'Timeout — กรุณาอัพโหลด video เอง',                                                         // E5 line 13063
  error_v2_template_incomplete:     'กรุณากรอกข้อมูล Template Settings ให้ครบก่อนรัน',                                          // E5 line 13450

  // ─── STATUS MESSAGES ──────────────────────────────────────────────
  status_wait_10s:                  '⏳ รอ 10 วินาที (เผื่อเน็ตช้า)...',                                                        // E1 line 2730
  status_starting_image:            '🖼️ เริ่มสร้างรูปภาพ...',                                                                  // E1 line 2852
  status_extending_16s:             '🎞️ กำลัง Extend เป็น 16 วิ...',                                                           // E1 line 2483
  status_waiting_flow:              '🌐 รอ Google Flow...',                                                                       // E1 line 2439
  status_image_generating:          '🖼️ กำลังสร้างรูปภาพ...',                                                                  // E1 line 2440  (flow step)
  status_image_done_flow:           '✅ สร้างรูปเสร็จ → เริ่มสร้างวิดีโอ',                                                     // E1 line 2441
  status_video_generating_8s:       '🎬 กำลังสร้างวิดีโอ 8 วิ...',                                                             // E1 line 2442
  status_video_generating_16s:      '🎞️ กำลังสร้างวิดีโอ 16 วิ...',                                                           // E1 line 2446
  status_video_saved:               '💾 บันทึกวิดีโอแล้ว',                                                                      // E1 line 2443
  status_video_saved_8s:            '💾 บันทึกวิดีโอ 8 วิแล้ว → ไป TikTok',                                                    // E1 line 2444
  status_video_saved_16s:           '💾 บันทึกวิดีโอ 16 วิแล้ว → ไป TikTok',                                                   // E1 line 2445
  status_upload_in_progress:        '📤 กำลังอัพโหลดไป TikTok...',                                                              // E1 line 2447
  status_completed_8s:              '✅ วิดีโอ 8 วิเสร็จ',                                                                      // E1 line 2448
  status_completed_16s:             '✅ วิดีโอ 16 วิเสร็จ',                                                                     // E1 line 2449
  status_completed_download:        '⬇️ ดาวน์โหลดวิดีโอเสร็จ',                                                                 // E1 line 2450
  status_v2_image_generating:       '🖼️ [V2] กำลังสร้างรูป Template 1...',                                                     // E1 line 2451
  status_v2_image_done:             '✅ [V2] รูปเสร็จ → เริ่มสร้างวิดีโอ',                                                     // E1 line 2452
  status_v2_video_generating:       '🎬 [V2] กำลังสร้างวิดีโอ Template 2...',                                                  // E1 line 2453
  status_v2_video_saved:            '🎞️ [V2] วิดีโอเสร็จ → เริ่ม Extend',                                                     // E1 line 2454
  status_v2_extending:              '🎞️ [V2] กำลัง Extend Video...',                                                           // E1 line 2455
  status_v2_extend_done:            '✅ [V2] Extend เสร็จ → Download',                                                          // E1 line 2456
  status_scraping_complete:         'เสร็จสิ้น! ดึงได้ {n} สินค้า',                                                             // E1 line 3150  ({n} template)
  status_expiring_days:             '⚠️ เหลือ {n} วัน',                                                                         // E1 line 455   ({n} template — distinct from ${daysLeft})
  status_valid_days:                '✅ เหลือ {n} วัน',                                                                          // E1 line 458
  status_scraping_page:             'กำลังดึงหน้า {n}...',                                                                       // E1 line 3170  ({n} template)
  status_fp_badge_with_failures:    'เสร็จ ({n} ล้มเหลว)',                                                                       // E1 line 3478
  status_fp_badge_progress:         '{done}/{total} รายการ',                                                                      // E1 line 3481
  status_fp_progress_text:          '{done} / {total} รายการ ({pct}%)',                                                           // E1 line 3497
  status_fp_label_failed:           'ล้มเหลว',                                                                                    // E1 line 3514
  status_fp_label_skipped:          'ข้าม',                                                                                       // E1 line 3514
  status_fp_label_processing:       'กำลังทำ...',                                                                                 // E1 line 3514
  status_post_done:                 '✅ โพสเสร็จ!',                                                                              // E3 line 5868
  status_starting:                  '🚀 เริ่มต้น...',                                                                            // E3 line 8349
  status_pipeline_stopped:          '⏹️ หยุดแล้ว',                                                                              // E3 line 8388
  status_tab_gone:                  '⚠️ Google Flow tab หายไป — รอ reload...',                                                   // E3 line 8504
  status_tab_error:                 '⚠️ Tab error — รอ recover...',                                                              // E3 line 8518
  status_creating_image_loop:       '🖼️ ฉาก {n}: กำลังสร้าง Image...',                                                         // E3 line 8549
  status_retry_image_loop:          '🔄 ฉาก {n}: Retry Image... ({attempt}/{max})',                                              // E3 line 8543
  status_retry_video_loop:          '🔄 ฉาก {n}: Retry Video... ({attempt}/{max})',                                              // E3 line 8674
  status_creating_video_loop:       '🎬 ฉาก {n}: กำลังสร้าง Video...',                                                          // E3 line 8681
  status_video_done:                '✅ ฉาก {n}: Video เสร็จแล้ว',                                                               // E3 line 8756
  status_scene_complete:            '✅ ฉากที่ {n} เสร็จครบแล้ว!',                                                               // E3 line 8800
  status_scene_fail_after_retry:    '⚠️ ฉากที่ {n}: ไม่สำเร็จหลัง retry {max} ครั้ง',                                         // E3 line 8803
  status_video_fail_skip:           '⚠️ ฉาก {n}: Video ไม่สำเร็จ — ไปฉากถัดไป',                                               // E3 line 8784
  status_image_fail_skip_video:     '⚠️ ฉาก {n}: Image ไม่สำเร็จ — ข้าม Video',                                                // E3 line 8794
  status_all_scenes_done:           '🎉 สร้างครบทุกฉากแล้ว!',                                                                   // E3 line 8820
  status_opening_scenebuilder:      '🎬 กำลังเปิด SceneBuilder...',                                                              // E3 line 8830
  status_scenebuilder_progress:     '🎬 กำลังเปิด SceneBuilder... {sec} วิ',                                                    // E3 line 8853
  status_exporting:                 '📥 กำลัง Export... {sec} วิ',                                                               // E3 line 8855
  status_waiting_download:          '⏳ รอ Download... {sec} วิ',                                                                 // E3 line 8857
  status_pipeline_complete:         '🎉✅ Pipeline เสร็จสิ้น! ครบทุกฉากแล้ว!',                                                  // E3 line 8862
  status_scenebuilder_error:        '⚠️ SceneBuilder error - แต่สร้างฉากครบแล้ว',                                               // E3 line 8866
  status_retry_starting:            '🔄 Retry ฉาก {n}: กำลังเริ่ม...',                                                          // E3 line 7981
  status_retry_image:               '🖼️ Retry ฉาก {n}: กำลังสร้าง Image...',                                                   // E3 line 8014
  status_retry_image_done:          '✅ Retry ฉาก {n}: Image เสร็จ!',                                                           // E3 line 8074
  status_retry_video:               '🎬 Retry ฉาก {n}: กำลังสร้าง Video...',                                                    // E3 line 8086
  status_retry_all_done:            '✅ Retry ฉาก {n}: เสร็จครบ! (Image + Video)',                                              // E3 line 8125
  status_retry_video_fail:          '⚠️ Retry ฉาก {n}: Image OK แต่ Video ล้มเหลว',                                            // E3 line 8129
  status_retry_image_fail_final:    '❌ Retry ฉาก {n}: Image ล้มเหลว',                                                          // E3 line 8133
  status_queue_starting:            '🚀 เริ่มต้น Queue...',                                                                      // E3 line 7388
  status_queue_story_progress:      '📖 เรื่องที่ {n}/{total}: "{label}"',                                                       // E3 line 7401
  status_queue_generating:          '🤖 เรื่องที่ {n}: Generate script...',                                                      // E3 line 7410
  status_queue_pipeline_running:    '🎬 เรื่องที่ {n}: Pipeline กำลังทำงาน...',                                                 // E3 line 7436
  status_queue_waiting_tiktok:      '📤 เรื่องที่ {n}: รอ TikTok โพส...',                                                       // E3 line 7445
  status_queue_tiktok_done:         '✅ เรื่องที่ {n}: โพส TikTok เสร็จ!',                                                      // E3 line 7448
  status_queue_story_done:          '✅ เรื่องที่ {n}: เสร็จแล้ว!',                                                             // E3 line 7478
  status_queue_failed:              '❌ ล้มเหลว: {error}',                                                                       // E3 line 7487
  status_queue_reload_flow:         '🔄 Reload Google Flow สำหรับเรื่องถัดไป...',                                                // E3 line 7498
  status_queue_all_done:            '🎉 Queue เสร็จ! {completed}/{total} สำเร็จ',                                               // E3 line 7518
  status_generating_video_progress: 'กำลังสร้างวีดีโอ... ({elapsed} วิ)',                                                        // E4 line 10770  ({elapsed} template)
  status_generating_script:         'กำลังสร้างสคริปต์ด้วย {providerLabel}...',                                                  // E4 line 10102  ({} template)
  status_ai_continue:               'AI เขียนยังไม่จบ — กำลังต่อ... ({cont}/{max})',                                            // E4 line 10125
  status_analyzing_product_noicon:  'AI กำลังวิเคราะห์รูปสินค้า...',                                                            // E4 line 10081  (no 🔍 icon)
  status_analyzing_char_noicon:     'AI กำลังวิเคราะห์รูปตัวละคร reference...',                                                  // E4 line 10093  (no 🔍 icon)
  status_studio_pending:            '⏳ รอ',                                                                                      // E4 line 11919
  status_studio_generating:         '🔄 กำลังสร้าง...',                                                                         // E4 line 11920
  status_studio_done:               '✅ เสร็จ',                                                                                  // E4 line 11921
  status_studio_error:              '❌ ผิดพลาด',                                                                                // E4 line 11922
  status_platform_preparing:        '⏳ กำลังเตรียม Video: ${videoName}...',                                                     // E5 line 12963
  status_platform_posting:          '⏳ [${n}/${total}] โพสต์ "${videoName}" → ${platform}...',                                  // E5 line 12977
  status_platform_wait_next:        '⏳ รอ 8 วินาที แล้วทำรายการถัดไป (เผื่อเน็ตช้า)...',                                      // E5 line 13001
  status_platform_complete:         '✅ เสร็จสิ้น — สำเร็จ ${done} รายการ',                                                    // E5 line 13011
  status_v2_badge_complete:         'เสร็จแล้ว',                                                                                  // E5 line 13582

  // ─── LOG MESSAGES ─────────────────────────────────────────────────
  log_post_success_storage:         '✅ โพสสำเร็จ! (via storage)',                                                               // E1 line 2419
  log_post_success_item:            '✅ โพสสำเร็จ: {name}',                                                                     // E1 line 2711
  log_remaining_count:              '📦 เหลือ {n} รายการ — ถัดไป: {name}',                                                      // E1 line 2729
  log_retry_new_round:              '🔄 เริ่ม Retry รอบใหม่ — ทำรายการที่ล้มเหลวซ้ำ',                                           // E1 line 2732
  log_next_item_start:              '🚀 เริ่มรายการถัดไป: {name}',                                                               // E1 line 2749
  log_all_done:                     '🎉 ทำครบทุกสินค้าแล้ว! (สำเร็จ {posted}, ล้มเหลว {failed}, ข้าม {skipped})',               // E1 line 2757
  log_success_all_done:             'ทำครบแล้ว! สำเร็จ {posted}/{total}',                                                        // E1 line 2758  ({} template — distinct from ${} variant)
  log_warning_no_processing_item:   '⚠️ ไม่พบสินค้าที่กำลังทำอยู่',                                                             // E1 line 2775
  log_item_starting:                '🚀 {name}: เริ่มทำงาน...',                                                                  // E1 line 2825
  log_image_prompt_missing:         '📝 {name}: ยังไม่มี Image Prompt — จะสร้างใน processFlowItem',                             // E1 line 2842
  log_step_image_done:              '✅ สร้างรูป เสร็จแล้ว!',                                                                    // E1 line 2877
  log_step_video_done:              '✅ สร้างวิดีโอ เสร็จแล้ว!',                                                                 // E1 line 2877
  log_video_done_go_tiktok:         '⏭️ {name}: Video เสร็จ → ไป TikTok Upload',                                                // E1 line 2896
  log_extend_16s_in_progress:       '🎞️ {name}: Video 8 วิ เสร็จ → กำลัง Extend เป็น 16 วิ...',                               // E1 line 2482
  log_wait_delay:                   '⏳ รอ {n} วินาที...',                                                                       // E1 line 2917
  log_flow_error:                   '❌ Google Flow ล้มเหลว: {msg}',                                                             // E1 line 2935
  log_resume_step:                  '🔄 Resume จาก Step {n} ({name})...',                                                        // E1 line 2948
  log_resume_pd_style:              '🔄 [PD-Style] Resume step {n} แทน restart ทั้งหมด',                                        // E1 line 2949
  log_item_failed:                  '⏭️ {name}: ล้มเหลว — {msg}',                                                               // E1 line 2967
  log_no_processing_item:           '⚠️ ไม่พบรายการที่กำลังประมวลผล — ลองหารายการถัดไป',                                        // E1 line 2973
  log_products_added:               'เพิ่มสินค้าใหม่ {n} รายการ',                                                               // E1 line 3111
  log_scraping_done:                'ดึงสินค้าเสร็จสิ้น รวม {n} รายการ',                                                        // E1 line 3146
  log_scraping_page:                '📄 เริ่มดึงสินค้าหน้า {n}',                                                                 // E1 line 3173
  log_scraping_all_pages:           '📄 เริ่มดึงสินค้าทุกหน้า...',                                                              // E1 line 3247
  log_all_products_deleted:         'ลบสินค้าทั้งหมดแล้ว',                                                                       // E1 line 3359
  log_run_started:                  'เริ่มรัน: คลิป {n} วิ, Delay {d} วิ, โหมด: {mode}',                                       // E1 line 3634
  log_clear_prompt_policy_fail:     '🗑️ {name}: ล้าง Prompt เก่า (policy fail) → สร้างใหม่',                                   // E1 line 2662
  log_retry_item:                   '🔄 {name}: Retry รอบที่ {n}/{max}',                                                         // E1 line 2665
  log_retry_item_short:             '🔄 Retry {name} ({n}/{max})',                                                                // E1 line 2666
  log_hookid_mismatch:              '⚠️ hookId ไม่ตรงกัน: เนื้อหา={a} วิดีโอ={b} → ใช้ค่าจากวิดีโอ',                         // E1 line 1310
  log_zoom_percent:                 '🔍 Zoom Google Flow: {n}%',                                                                  // E1 line 2384  ({n} template)
  log_wait_5sec:                    '⏳ รอ 5 วินาที...',                                                                          // E2 line 2985
  log_wait_before_next:             '⏳ รอ {sec} วิ ก่อนรายการถัดไป...',                                                        // E2 line 5818
  log_google_flow_failed:           '❌ Google Flow ล้มเหลว: ${errorMsg}',                                                       // E2 line 2935  (${} variant)
  log_remaining_next:               '📦 เหลือ ${remaining} รายการ — ถัดไป: ${nextItem.name}',                                   // E2 line 2984
  log_character_added:              'เพิ่มตัวละครให้สินค้า',                                                                      // E2 line 4596
  log_batch_generate_start:         'เริ่มสร้าง Prompts + Caption + CTA สำหรับ ${productQueue.length} สินค้า',                  // E2 line 4656
  log_batch_generate_done:          '✅ สร้าง Prompts + Caption + CTA เสร็จสิ้น ${completed}/${productQueue.length} สินค้า',    // E2 line 5046
  log_caption_generated:            'สร้าง แคปชั่น สำเร็จ',                                                                      // E2 line 5126
  log_cta_generated:                'สร้าง CTA สำเร็จ',                                                                           // E2 line 5126
  log_action_analyzing:             'กำลัง วิเคราะห์: ${item.name}',                                                             // E2 line 5189
  log_action_generating_media:      'กำลัง สร้าง Media: ${item.name}',                                                           // E2 line 5189
  log_action_policy_check:          'กำลัง ตรวจ Policy: ${item.name}',                                                           // E2 line 5189
  log_action_done_analyze:          'วิเคราะห์ เสร็จสิ้น',                                                                       // E2 line 5215
  log_action_done_media:            'สร้าง Media เสร็จสิ้น',                                                                      // E2 line 5215
  log_action_done_policy:           'ตรวจ Policy เสร็จสิ้น',                                                                      // E2 line 5215
  log_caption_fallback:             '⚠️ ${item.name}: Caption fallback (Auto Post)',                                             // E2 line 5406
  log_cta_fallback:                 '⚠️ ${item.name}: CTA fallback (Auto Post)',                                                 // E2 line 5410
  log_item_flow_done:               '✅ ${item.name}: เสร็จสิ้น',                                                               // E2 line 5423
  log_step_failed:                  '❌ ${item.name}: Step ล้มเหลว — ${stepError.message}',                                      // E2 line 5435
  log_tiktok_upload_starting:       '📤 ${item.name}: กำลังเริ่ม TikTok Upload...',                                             // E2 line 5483
  log_creating_image:               '🖼️ ${item.name}: เริ่มสร้างรูปภาพ...',                                                     // E2 line 5493
  log_creating_video:               '🎬 ${item.name}: กำลังสร้างวิดีโอ...',                                                     // E2 line 5501
  log_stopped_by_user:              '⏹️ หยุดโดยผู้ใช้',                                                                         // E2 line 5516
  log_video_done:                   '✅ ${item.name}: Video เสร็จแล้ว!',                                                        // E2 line 5521
  log_extending_to_16s:             '🎞️ ${item.name}: Video 8 วิ เสร็จ — กำลัง Extend เป็น 16 วิ... (${elapsed} วิ)',         // E2 line 5529
  log_waiting_video:                '🎬 ${item.name}: รอวิดีโอ... ${elapsed} วิ',                                               // E2 line 5538
  log_tiktok_upload_begin:          '📤 ${item.name}: เริ่ม TikTok Upload...',                                                   // E2 line 5563
  log_item_stopped:                 '⏹️ ${item.name}: หยุดโดยผู้ใช้',                                                           // E2 line 5762
  log_tiktok_done:                  '✅ ${item.name}: TikTok เสร็จแล้ว!',                                                       // E2 line 5771
  log_item_success:                 '✅ เสร็จ: ${item.name}',                                                                    // E2 line 5789
  log_remaining_next_item:          '📦 เหลือ ${remaining} รายการ — ถัดไป: ${nextPending.name}',                                // E2 line 5811
  log_tiktok_upload_failed:         '❌ ${item.name}: TikTok Upload ล้มเหลว',                                                   // E2 line 5833
  log_waiting_tiktok_upload:        '📤 ${item.name}: รอ TikTok Upload... ${elapsed} วิ',                                       // E2 line 5841
  log_tiktok_timeout:               '⏰ ${item.name}: TikTok Upload timeout',                                                    // E2 line 5850
  log_tiktok_post_done:             '✅ ${item.name}: โพส TikTok เสร็จสมบูรณ์!',                                               // E2 line 5867
  log_watchdog_timeout:             '⏰ Timeout 30 นาที: ${currentItem.name} — ข้ามอัตโนมัติ',                                  // E2 line 5923
  log_autopost_start:               '🚀 runAutoPost() เริ่มทำงาน',                                                               // E2 line 5941
  log_settings_clip:                '⚙️ Settings: คลิป ${runSettings.clipDuration} วิ',                                         // E2 line 5956
  log_reset_pending:                '🔄 Reset สถานะสินค้าทั้งหมดเป็น pending...',                                                 // E2 line 5962
  log_processing_item:              '📦 เริ่มประมวลผล: ${pendingItem.name}',                                                     // E2 line 5977
  log_process_flow_start:           '▶️ เริ่ม processFlowItem...',                                                               // E2 line 5995
  log_no_queue:                     '⚠️ ไม่พบสินค้าในคิว',                                                                      // E2 line 5998
  log_stopped_by_user_full:         '🛑 หยุดการทำงานโดยผู้ใช้',                                                                  // E2 line 6018
  log_flow_step_stopped:            '🛑 หยุดโดยผู้ใช้',                                                                         // E2 line 6037
  log_no_current_item:              'ไม่มีสินค้าที่กำลังทำอยู่',                                                                 // E2 line 6050
  log_skip_item:                    '⏭️ ข้ามรายการ: ${currentItem.name}',                                                       // E2 line 6054
  log_skipped_by_user:              'ข้ามรายการนี้',                                                                              // E2 line 6066
  log_remaining_items:              '📦 เหลือสินค้าอีก ${remaining} รายการ',                                                    // E2 line 6073
  log_sm_empty:                     'ยังไม่มี log — เริ่ม Generate หรือ Auto Run เพื่อดูสถานะ',                                  // E3 line 6532
  log_autopost_toggle_on:           '🚀 [AutoPost] เปิด Auto Post TikTok',                                                       // E3 line ~6699
  log_autopost_toggle_off:          '🚀 [AutoPost] ปิด Auto Post TikTok',                                                        // E3 line ~6699
  log_queue_item_added:             '📋 [Queue] เพิ่มเรื่อง "{label}" เข้าคิว ({total} เรื่อง)',                                // E3 line 7300
  log_queue_start:                  '🚀 [Queue] เริ่ม Queue — {total} เรื่อง',                                                   // E3 line 7387
  log_queue_story_start:            '📖 [Queue] เริ่มเรื่องที่ {n}: "{label}"',                                                  // E3 line 7402
  log_queue_generating:             '🤖 [Queue] กำลัง Generate script...',                                                       // E3 line 7409
  log_queue_autopost_open:          '🚀 [Queue] เรื่องที่ {n}: Auto Post เปิด — จะโพส TikTok หลังสร้างเสร็จ',                 // E3 line 7429
  log_queue_pipeline_start:         '🎬 [Queue] เริ่ม Pipeline...',                                                              // E3 line 7435
  log_queue_waiting_tiktok:         '📤 [Queue] เรื่องที่ {n}: กำลังรอ TikTok โพส...',                                          // E3 line 7444
  log_queue_tiktok_done:            '✅ [Queue] เรื่องที่ {n}: TikTok โพสเสร็จ!',                                               // E3 line 7447
  log_queue_wait_before_next:       '⏳ [Queue] รอ 10 วิ ก่อนเริ่มเรื่องถัดไป...',                                              // E3 line 7472
  log_queue_story_done:             '✅ [Queue] เรื่องที่ {n}: "{label}" — เสร็จสมบูรณ์!',                                      // E3 line 7477
  log_queue_story_failed:           '❌ [Queue] เรื่อง "{label}" — ล้มเหลว: {error}',                                           // E3 line 7486
  log_queue_recover_tab:            '🔄 [Queue] เหลือ {n} เรื่อง — กำลัง recover Google Flow tab...',                           // E3 line 7497
  log_queue_flow_ready:             '✅ [Queue] Google Flow tab พร้อม — เริ่มเรื่องถัดไป',                                       // E3 line 7502
  log_queue_recover_error:          '⚠️ [Queue] Recover tab error: {error} — ลองต่อ...',                                        // E3 line 7505
  log_queue_all_done:               '🎉 [Queue] Queue เสร็จสิ้น! สำเร็จ {completed} เรื่อง, ล้มเหลว {failed} เรื่อง',         // E3 line 7517
  log_queue_stopped:                '⏹️ [Queue] หยุดโดยผู้ใช้',                                                                  // E3 line 7532
  log_queue_continue_response:      '📝 [Queue] AI ตอบไม่ครบ — กำลังเรียกต่อ...',                                               // E3 line 7634
  log_queue_continue_round:         '📝 [Queue] เรียกต่อรอบ {n}...',                                                            // E3 line 7654
  log_queue_found_scenes:           '🎬 [Queue] พบ {n} ฉาก — เริ่ม Pipeline',                                                   // E3 line 7677
  log_queue_opening_flow:           '🌐 [Queue] กำลังเปิด Google Flow...',                                                       // E3 line 7705
  log_queue_waiting_tiktok_post:    '📤 [Queue] รอ TikTok โพส... {elapsed} วิ',                                                 // E3 line 7739
  log_style_fix_photorealistic:     '🎨 [Style Fix] Override art style → photorealistic ({n} ฉาก)',                             // E3 line 8156
  log_scene_loop_start:             '🎬 [Storymode] เริ่มฉากที่ {n}/{total}',                                                   // E3 line 8466
  log_storymode_pipeline_start:     '🎬 [Storymode] เริ่ม Pipeline — {n} ฉาก',                                                  // E3 line 8298
  log_character_lock:               '🔒 [Storymode] Character Lock: "{desc}..."',                                               // E3 line 8304
  log_character_lock_missing:       '⚠️ [Storymode] ไม่พบ CHARACTER: block ในฉาก 1 — ตัวละครอาจไม่เหมือนกันทุกฉาก',           // E3 line 8307
  log_autopost_on:                  '🚀 [Storymode] Auto Post เปิด — จะโพส TikTok หลังสร้างเสร็จ',                             // E3 line 8335
  log_opening_flow:                 '🌐 [Storymode] กำลังเปิด Google Flow...',                                                   // E3 line 8357
  log_storymode_error:              '❌ [Storymode] เกิดข้อผิดพลาด: {error}',                                                   // E3 line 8367
  log_storymode_stopped:            '⏹️ [Storymode] หยุดโดยผู้ใช้',                                                             // E3 line 8378
  log_recover_flow_tab:             '🔄 [Storymode] กำลัง recover Google Flow tab...',                                           // E3 line 8394
  log_content_script_no_response:   '⚠️ [Storymode] Content script ไม่ตอบ — เปิด tab ใหม่...',                                 // E3 line 8420
  log_flow_tab_recovered:           '✅ [Storymode] Google Flow tab recovered',                                                   // E3 line 8422
  log_flow_tab_opened:              '✅ [Storymode] Google Flow tab opened',                                                      // E3 line 8451
  log_scene_video_only:             '🎬 [Storymode] ฉาก {n}: Video-Only mode — ข้าม Image',                                    // E3 line 8534
  log_attach_product_and_char:      '📷 [Storymode] ฉาก {n}: แนบ ref สินค้า + ตัวละคร',                                        // E3 line 8561
  log_attach_product:               '📷 [Storymode] ฉาก {n}: แนบ ref สินค้า',                                                   // E3 line 8563
  log_attach_char:                  '📷 [Storymode] ฉาก {n}: แนบ ref ตัวละคร',                                                  // E3 line 8565
  log_no_product_image:             '📷 [Storymode] ฉาก {n}: ไม่แนบรูปสินค้า (ตาม checkbox)',                                   // E3 line 8567
  log_no_product_in_scene:          '📦 [Storymode] ฉาก {n}: ไม่ใส่รูปสินค้า (ตาม checkbox)',                                   // E3 line 8617
  log_image_done:                   '✅ [Storymode] ฉาก {n}: Image สำเร็จ',                                                     // E3 line 8637
  log_scene_stopped:                '⏹️ [Storymode] ฉาก {n}: หยุดโดยผู้ใช้',                                                   // E3 line 8646
  log_google_labs_crash_image:      '❌ [Storymode] ฉาก {n}: Google labs ล่ม — recover...',                                     // E3 line 8652
  log_image_fail:                   '⚠️ [Storymode] ฉาก {n}: Image ล้มเหลว — {error}',                                         // E3 line 8655
  log_no_video_prompt:              '⚠️ [Storymode] ฉาก {n}: ข้าม Video เพราะไม่มี videoPrompt!',                              // E3 line 8664
  log_no_product_dialogue:          '💬 [Storymode] ฉาก {n}: ไม่ใส่บทพูดสินค้า (ตาม checkbox)',                                // E3 line 8690
  log_video_done_sm:                '✅ [Storymode] ฉาก {n}: Video สำเร็จ',                                                     // E3 line 8757
  log_google_labs_crash_video:      '❌ [Storymode] ฉาก {n}: Google labs ล่มตอน Video — recover + retry...',                    // E3 line 8770
  log_video_fail:                   '⚠️ [Storymode] ฉาก {n}: Video ล้มเหลว — {error}',                                         // E3 line 8773
  log_video_fail_max_retries:       '❌ [Storymode] ฉาก {n}: Video ล้มเหลว {max} ครั้ง — ข้ามฉากนี้',                          // E3 line 8777
  log_video_fail_max:               '⚠️ [Storymode] ฉาก {n}: Video ไม่สำเร็จหลัง {max} ครั้ง',                                // E3 line 8785
  log_image_fail_skip_video:        '⚠️ [Storymode] ฉาก {n}: Image ไม่สำเร็จหลัง {max} ครั้ง — ข้าม Video ฉากนี้',           // E3 line 8793
  log_scene_complete:               '✅ [Storymode] ฉากที่ {n}/{total} เสร็จครบ!',                                              // E3 line 8801
  log_all_scenes_done:              '🎉 [Storymode] สร้างครบทุกฉากแล้ว! ({total} ฉาก)',                                         // E3 line 8821
  log_opening_scenebuilder:         '🎬 [Storymode] กำลังเปิด SceneBuilder + Export...',                                         // E3 line 8831
  log_pipeline_complete:            '🎉✅ [Storymode] Pipeline เสร็จสิ้น! ครบทุกฉาก + Export แล้ว!',                           // E3 line 8863
  log_scenebuilder_error:           '⚠️ [Storymode] SceneBuilder error — แต่สร้างฉากครบแล้ว',                                  // E3 line 8867
  log_failed_scenes_warning:        '⚠️ [Storymode] มี {n} ฉากล้มเหลว — กดปุ่ม 🔄 Retry ที่ฉากนั้นเพื่อลองใหม่',             // E3 line 8883
  log_scene_step_fail:              '❌ [Storymode] ฉาก {n} {step}: {error}',                                                   // E3 line 8915
  log_scene_step_done:              '✅ [Storymode] ฉาก {n} {step} เสร็จสมบูรณ์!',                                             // E3 line 8931
  log_scene_step_stale:             '⚠️ [Storymode] ฉาก {n} {step}: ไม่ตอบสนอง {sec} วิ — content script อาจ crash',         // E3 line 8949
  log_retry_scene_start:            '🔄 [Storymode] Retry ฉากที่ {n}...',                                                       // E3 line 7973
  log_retry_image:                  '🖼️ [Retry] ฉาก {n}: กำลังสร้าง Image...',                                                 // E3 line 8015
  log_retry_image_done:             '✅ [Retry] ฉาก {n}: Image สำเร็จ',                                                        // E3 line 8075
  log_retry_image_fail:             '❌ [Retry] ฉาก {n}: Image ล้มเหลว — {error}',                                             // E3 line 8079
  log_retry_video:                  '🎬 [Retry] ฉาก {n}: กำลังสร้าง Video...',                                                 // E3 line 8087
  log_retry_all_done:               '✅ [Retry] ฉาก {n}: เสร็จครบ!',                                                           // E3 line 8126
  log_retry_video_fail:             '⚠️ [Retry] ฉาก {n}: Video ล้มเหลว — {error}',                                            // E3 line 8130
  log_character_analyzed:           '[Storymode] วิเคราะห์ตัวละครเสร็จ — style: {style}, gender: {gender}',                    // E4 line 9984
  log_character_partial:            '[Storymode] วิเคราะห์ตัวละครได้บางส่วน (text mode)',                                       // E4 line 9988
  log_character_fail:               '[Storymode] วิเคราะห์รูปตัวละครไม่สำเร็จ — ใช้ photorealistic fallback',                  // E4 line 9993
  log_product_analyzed:             '[Storymode] วิเคราะห์สินค้าเสร็จ — {productType} ({brand})',                              // E4 line 10031
  log_product_analyzed_text:        '[Storymode] วิเคราะห์สินค้าเสร็จ (text mode)',                                             // E4 line 10035
  log_product_fail:                 '[Storymode] วิเคราะห์รูปสินค้าไม่สำเร็จ — {message}',                                     // E4 line 10040
  log_v2_timeout_skip:              '⏰ Timeout 35 นาที: ${name} — ข้ามอัตโนมัติ',                                             // E5 line 13636
  log_v2_item_failed:               '❌ ล้มเหลว: ${name} — ${reason}',                                                          // E5 line 13653
  log_v2_goto_next:                 '🔄 ไปรายการถัดไป...',                                                                      // E5 line 13666
  log_v2_all_done:                  '🎉 ทำครบแล้ว! (สำเร็จ ${posted}, ล้มเหลว ${failed})',                                     // E5 line 13671
  log_v2_process_flow_start:        '🔄 ${name}: เริ่ม processFlow',                                                            // E5 line 13689
  log_v2_build_prompts:             '⚡ ${name}: สร้าง V2 Prompts...',                                                          // E5 line 13697
  log_v2_item_complete:             '✅ ${name}: เสร็จสิ้น',                                                                    // E5 line 13707
  log_v2_step_failed:               '❌ ${name}: Step ล้มเหลว — ${error}',                                                      // E5 line 13718
  log_v2_create_image:              '🖼️ ${name}: สร้างรูปภาพ (Template 1)...',                                                  // E5 line 13738
  log_v2_create_video:              '🎬 ${name}: กำลังสร้างวิดีโอ (Template 2)...',                                             // E5 line 13743
  log_v2_video_done:                '✅ ${name}: Video เสร็จ!',                                                                  // E5 line 13755
  log_v2_extending:                 '🎞️ ${name}: Video เสร็จ กำลัง Extend... (${sec} วิ)',                                     // E5 line 13761
  log_v2_extend_video:              '🎞️ ${name}: Extend Video (Template 3)...',                                                  // E5 line 13781
  log_v2_extend_done:               '✅ ${name}: Extend เสร็จ!',                                                                 // E5 line 13793
  log_v2_to_tiktok:                 '📤 ${name}: → TikTok Upload',                                                              // E5 line 13810
  log_v2_open_flow:                 '🌐 ${name}: เปิด Google Flow (${mode})...',                                                 // E5 line 13827
  log_v2_reload_flow:               '🔄 ${name}: Reload Google Flow...',                                                         // E5 line 13861
  log_v2_wait_tiktok:               '📤 ${name}: รอ TikTok Upload + Post...',                                                   // E5 line 13883
  log_v2_tiktok_done:               '✅ ${name}: TikTok เสร็จแล้ว!',                                                            // E5 line 13896
  log_v2_item_success:              '✅ เสร็จ: ${name}',                                                                         // E5 line 13908
  log_v2_next_item:                 '🚀 ถัดไป: ${name} (เหลือ ${remaining})',                                                   // E5 line 13924
  log_v2_wait_before_next:          '⏳ รอ ${sec} วิ ก่อนรายการถัดไป...',                                                      // E5 line 13927
  log_v2_tiktok_upload_failed:      '❌ ${name}: TikTok Upload ล้มเหลว',                                                        // E5 line 13939
  log_v2_tiktok_posted:             '✅ ${name}: โพส TikTok เสร็จ!',                                                            // E5 line 13959
  log_v2_start_item:                '🚀 ${name}: เริ่มทำงาน...',                                                                 // E5 line 13989
  log_v2_autov2_start:              '🎬 runAutoV2() เริ่มทำงาน',                                                                 // E5 line 14043
  log_v2_template_missing:          '❌ กรุณากรอก Template Settings ให้ครบก่อนรัน',                                             // E5 line 14052
  log_v2_reset_pending:             '🔄 Reset สถานะสินค้าทั้งหมดเป็น pending...',                                                // E5 line 14063
  log_v2_start_processing:          '📦 เริ่มประมวลผล: ${name}',                                                                 // E5 line 14072
  log_v2_stopped:                   '⏹️ หยุดทำงาน',                                                                             // E5 line 14092
  log_v2_skip_item:                 '⏭️ ข้าม: ${name}',                                                                         // E5 line 14100
  log_v2_products_added:            '📦 เพิ่ม ${added} สินค้าใหม่ (รวม ${total})',                                              // E5 line 14120

  // ─── BUTTON / LABEL TEXT ──────────────────────────────────────────
  btn_zoom_100:                     '🔍 100%',                                                                                    // E1 line 2363
  btn_zoom_33:                      '🔍 33%',                                                                                     // E1 line 2367
  btn_copy_prompt:                  '📋 Copy',                                                                                    // E2 line 3874
  btn_open_flow:                    '🚀 Flow',                                                                                    // E2 line 3875
  btn_copy_prompt_done:             '✅ Copied',                                                                                  // E2 line 4050
  btn_copy_prompt_empty:            '❌ ว่าง',                                                                                   // E2 line 4053
  btn_ai_generate:                  '✨ AI',                                                                                      // E2 line 3927
  btn_ai_analyze:                   'AI Analyze',                                                                                 // E2 line 3946
  btn_generate_media:               'Generate Media',                                                                             // E2 line 3949
  btn_policy_check:                 'Policy Check',                                                                               // E2 line 3952
  btn_generate_all:                 '✨ Generate All',                                                                            // E2 line 5053
  btn_running:                      '🔄 กำลังรัน...',                                                                            // E2 line 6101
  btn_run:                          'Run',                                                                                        // E2 line 6101
  btn_tab_image:                    '🖼️ ภาพ',                                                                                    // E2 line 3862
  btn_tab_video8:                   '🎬 8 วิ',                                                                                   // E2 line 3863
  btn_tab_video16:                  '🎞️ 16 วิ',                                                                                  // E2 line 3864
  btn_view_raw_icon:                '📄 ดูแบบ Raw',                                                                              // E3 line 9027  (with 📄 icon)
  btn_view_card_icon:               '🎴 ดูแบบการ์ด',                                                                             // E3 line 9031  (with 🎴 icon)
  btn_copied_label:                 '✅ Copied!',                                                                                 // E3 line 9587
  btn_copied_all:                   '✅ Copied All!',                                                                             // E4 line 9608
  btn_copy_all_images:              '📋 Copy All Images',                                                                        // E4 line 9611
  btn_copy_all_videos:              '📋 Copy All Videos',                                                                        // E4 line 9611
  btn_retry:                        '🔄 Retry',                                                                                   // E3 line 7927
  btn_retry_waiting:                '🔄 รอ...',                                                                                   // E3 line 7923
  btn_auto_reset:                   '🚀 Auto',                                                                                    // E4 line 9671
  btn_error:                        '❌ Error',                                                                                   // E4 line 9677
  btn_progress_scenes:              '{completed}/{total} ฉาก...',                                                                 // E4 line 10909
  btn_create_all_media:             'สร้างทั้งหมด (รูป + วีดีโอ)',                                                               // E4 line 10913  (no 🚀 icon)
  btn_merge_videos:                 'รวมวีดีโอทั้งหมด',                                                                           // E4 line 10956  (no 🎞️ icon)
  btn_tab_dialogue:                 '💬 บทพูด',                                                                                   // E4 line 11795
  btn_generate_scene_title:         'สร้าง',                                                                                      // E4 line 11827
  btn_delete_scene_title:           'ลบ',                                                                                         // E4 line 11828
  btn_create_image_n_scenes:        'สร้างรูป ({N} ฉาก)',                                                                        // E4 line 12200
  btn_create_video_n_scenes:        'สร้างวีดีโอ ({N} ฉาก)',                                                                     // E4 line 12208
  btn_generating_image_progress:    'สร้างรูป {i}/{total}...',                                                                    // E4 line 12230
  btn_generating_video_progress:    'สร้างวีดีโอ {i}/{total}...',                                                                 // E4 line 12269
  btn_select_image:                 '✅ เลือก',                                                                                   // E4 line 12372
  btn_select_image_title:           'เลือกรูปนี้สำหรับสร้างวีดีโอ',                                                               // E5 line 12372
  btn_download_title:               'ดาวน์โหลด',                                                                                  // E4 line 12373
  btn_platform_start_all:           'เริ่มโพสต์ทั้งหมด (${pending} รายการ)',                                                     // E5 line 12881
  btn_platform_start_done:          'โพสต์เสร็จแล้ว',                                                                            // E5 line 12882
  btn_tpl_use:                      '📝 ใช้งาน',                                                                                  // E5 line 13286
  btn_tpl_save:                     '💾 บันทึก Template',                                                                        // E5 line 13382  (with 💾 icon)

  // ─── PLACEHOLDERS ─────────────────────────────────────────────────
  placeholder_image_prompt:         'Prompt สำหรับสร้างรูปภาพ...',                                                               // E2 line 3868
  placeholder_video8_prompt:        'Prompt สำหรับวิดีโอ 8 วินาที...',                                                           // E2 line 3869
  placeholder_video16_prompt:       'Prompt สำหรับวิดีโอ 16 วินาที...',                                                          // E2 line 3870
  placeholder_custom_speech:        'เช่น สวยปังมากแม่, ผิวเด้งมาก, ต้องลอง!',                                                   // E2 line 3909
  placeholder_caption:              'ใส่แคปชั่นสำหรับโพสต์...',                                                                  // E2 line 3931
  placeholder_cta:                  'เช่น: กดซื้อเลย!, ลิงก์ในไบโอ',                                                            // E2 line 3940
  placeholder_manual_scene:         'พิมพ์บทพูดฉากที่ {n}...',                                                                   // E3 line 6661
  placeholder_dialogue_edit:        'บทพูดของตัวละคร (แก้ไขได้)',                                                                 // E3 line 9470
  placeholder_studio_dialogue:      'บทพูดของตัวละครในฉากนี้ (แก้ไขได้ตามใจ)',                                                   // E4 line 11801

  // ─── LABELS ───────────────────────────────────────────────────────
  label_step_create_image:          '🖼️ สร้างรูปภาพ',                                                                            // E1 line 533
  label_step_frame_to_video:        '🎬 สร้างวิดีโอ',                                                                            // E1 line 534
  label_step_screen_builder:        '🎞️ ต่อคลิป',                                                                               // E1 line 535
  label_step_upload_tiktok:         '📤 อัพโหลด TikTok',                                                                         // E1 line 536
  label_step_post_tiktok:           '📱 โพสต์ TikTok',                                                                           // E1 line 537
  label_duration_8s:                '8 วินาที',                                                                                   // E1 line 546
  label_duration_6s:                '6 วินาที',                                                                                   // E1 line 547
  label_duration_10s:               '10 วินาที',                                                                                  // E1 line 548
  label_v2_step_create_image:       '🖼️ สร้างรูป (Template 1)',                                                                  // E1 line 569
  label_v2_step_create_video:       '🎬 สร้างวิดีโอ (Template 2)',                                                               // E1 line 570
  label_v2_step_extend_video:       '🎞️ ต่อวิดีโอ (Template 3)',                                                                // E1 line 571
  label_checker_header:             'ผลการตรวจสอบ Policy & คุณภาพ',                                                              // E1 line 1759
  label_risk_low:                   '✅ ความเสี่ยงต่ำ',                                                                          // E1 line 1747
  label_risk_medium:                '⚠️ ความเสี่ยงปานกลาง',                                                                     // E1 line 1748
  label_risk_high:                  '❌ ความเสี่ยงสูง',                                                                          // E1 line 1749
  label_risk_unknown:               '❓ ไม่ทราบ',                                                                                // E1 line 1750
  label_quality_score:              '⭐ คุณภาพ: {n}/10',                                                                         // E1 line 1765
  label_summary:                    'สรุป:',                                                                                       // E1 line 1771
  label_original_analysis:          '🔍 วิเคราะห์ต้นฉบับ',                                                                      // E1 line 1776
  label_clean_script:               '✨ Script ใหม่คุณภาพสูง (พร้อมใช้)',                                                        // E1 line 1781
  label_improvements_made:          '🚀 การปรับปรุงที่ทำ',                                                                       // E1 line 1791
  label_violations_count:           '❌ ประโยคที่ละเมิดนโยบาย ({n} รายการ)',                                                     // E1 line 1800
  label_quality_issues_count:       '📉 ปัญหาคุณภาพคอนเทนต์ ({n} รายการ)',                                                      // E1 line 1818
  label_tips:                       '💡 เคล็ดลับเพิ่มคุณภาพ',                                                                   // E1 line 1844
  label_violation_policy:           '📋 นโยบาย',                                                                                  // E1 line 1858
  label_violation_low_quality:      '📉 คุณภาพต่ำ',                                                                              // E1 line 1859
  label_violation_spam:             '🚫 สแปม',                                                                                   // E1 line 1860
  label_violation_engagement:       '🎣 Engagement Bait',                                                                        // E1 line 1861
  label_severity_low:               '🟡 เล็กน้อย',                                                                              // E1 line 1869
  label_severity_medium:            '🟠 ปานกลาง',                                                                               // E1 line 1870
  label_severity_high:              '🔴 รุนแรง',                                                                                 // E1 line 1871
  label_selector_video_style:       '🎬 Video Style',                                                                            // E1 line 2164
  label_applied_shared_settings:    '✅ ใช้ตั้งค่าร่วมกับ {n} สินค้า (รูป: {m}{sel})',                                          // E1 line 2109
  label_schedule_today:             'วันนี้',                                                                                      // E1 line 3560
  label_schedule_more_items:        '... (+{n} รายการ)',                                                                          // E1 line 3563
  label_log_count:                  '({n} รายการ)',                                                                               // E3 line 6511
  label_style_settings:             '🎨 ตั้งค่าสไตล์',                                                                          // E2 line 3880
  label_category_image:             '📸 ภาพ',                                                                                    // E2 line 3887
  label_category_video:             '🎬 วิดีโอ',                                                                                 // E2 line 3891
  label_category_voice:             '🗣️ เสียง/บทพูด',                                                                          // E2 line 3897
  label_custom_speech:              '💬 คำพูดเพิ่มเติม (เฉพาะสินค้านี้)',                                                        // E2 line 3908
  label_cta:                        'CTA (Call to Action)',                                                                       // E2 line 3935
  label_no_characters:              'ยังไม่มีตัวละคร',                                                                            // E2 line 3747
  label_creating_video:             '🎬 กำลังสร้างวิดีโอ...',                                                                   // E2 line 5502
  label_extending_to_16s:           '🎞️ Extend เป็น 16 วิ... ${elapsed} วิ',                                                   // E2 line 5530
  label_waiting_video:              '🎬 รอวิดีโอ... ${elapsed} วิ',                                                             // E2 line 5539
  label_waiting_tiktok_upload:      '⏳ รอ TikTok Upload... ${elapsed} วิ',                                                     // E2 line 5842
  label_post_done:                  '✅ โพสเสร็จ!',                                                                              // E2 line 5868
  label_wait_3sec:                  '⏳ รอ 3 วินาที...',                                                                         // E2 line 6074
  label_scene_count:                '{n} ฉาก',                                                                                    // E3 line 6882
  label_scene_count_star:           '{n} ฉาก ⭐',                                                                                // E3 line 6882  (n=5 special)
  label_scene_product_checkbox:     '📦 สินค้า',                                                                                  // E3 line 6658
  label_pipeline_summary:           '{current} / {total} ฉาก',                                                                   // E3 line 7804
  label_pipeline_scene_num:         'ฉาก {n}',                                                                                   // E3 line 7836
  label_pipeline_retry_title:       'Retry ฉากนี้',                                                                              // E3 line 7928
  label_pipeline_retry_waiting:     'รอ Pipeline เสร็จก่อนถึงจะ Retry ได้',                                                      // E3 line 7924
  label_pipeline_product_title:     'ใส่รูปสินค้าในฉากนี้',                                                                      // E3 line 7839
  label_storyboards_section:        '📝 STORYBOARDS',                                                                            // E3 line 9531
  label_viral_caption_title:        '📱 แคปชั่นสำหรับโพสต์ (TikTok/Reels)',                                                     // E3 line 9567
  label_col_scene:                  'ฉาก',                                                                                        // E4 line 9438
  label_col_dialogue:               '💬 บทพูด',                                                                                   // E4 line 9439
  label_col_image_prompt:           '🔴 Image Prompt',                                                                           // E4 line 9440
  label_col_video_prompt:           '🟢 Video Prompt',                                                                           // E4 line 9441
  label_scene_number:               'ฉาก {N}',                                                                                   // E4 line 9457
  label_show_product_title:         'ใส่รูปสินค้าในฉากนี้',                                                                      // E4 line 9460
  label_forbidden_saved:            '✅ บันทึกแล้ว {N} คำ',                                                                      // E4 line 9770
  label_cache_mode_cache:           'Cache',                                                                                      // E4 line 9797
  label_cache_mode_cache_cookies:   'Cache + Cookies',                                                                           // E4 line 9797
  label_cache_mode_all:             'ทั้งหมด',                                                                                    // E4 line 9797
  label_cache_cleared:              '✅ ล้าง {mode} เรียบร้อย!',                                                                 // E4 line 9803
  label_scene_count_option:         '{N} ฉาก',                                                                                   // E4 line 11080
  label_scene_count_5:              '5 ฉาก ⭐',                                                                                  // E4 line 11081
  label_scene_count_10:             '10 ฉาก 🔥',                                                                                 // E4 line 11082
  label_studio_empty_hint:          'กด "ผสานข้อมูล" เพื่อสร้าง Scene',                                                          // E4 line 11782
  label_select_image_option:        '🖼️ Image',                                                                                  // E4 line 11814
  label_select_video_option:        '🎬 Video',                                                                                   // E4 line 11815
  label_preview_count_1:            '1 รูป',                                                                                     // E4 line 11818
  label_preview_count_2:            '2 รูป',                                                                                     // E4 line 11819
  label_preview_count_3:            '3 รูป',                                                                                     // E4 line 11820
  label_preview_count_4:            '4 รูป',                                                                                     // E4 line 11821
  label_studio_result_count:        '{imgCount} รูป / {vidCount} วีดีโอ',                                                        // E4 line 12348
  label_studio_grid_empty:          'ยังไม่มีรูป/วีดีโอ — กด "สร้างรูป" หรือ "สร้างวีดีโอ" เพื่อเริ่ม',                        // E4 line 12351
  label_veo_with_ref:               'Veo 3.1 (+ รูปที่เลือก)',                                                                   // E4 line 12446
  label_veo_no_ref:                 'Veo 3.1',                                                                                    // E4 line 12450
  label_caption_char_count:         '{len} / 2200',                                                                               // E4 line 12520
  label_cta_char_count:             '{len} / 30',                                                                                  // E4 line 12582
  label_platform_schedule_now:      'ทันที',                                                                                       // E5 line 12903
  label_platform_no_caption:        '(ไม่มี Caption)',                                                                            // E5 line 12907
  label_platform_char_count_reset:  '0 / 2200',                                                                                   // E5 line 12837
  label_tpl_cat_general:            '📦 ทั่วไป',                                                                                  // E5 line 13244
  label_tpl_cat_fashion:            '👗 แฟชั่น',                                                                                 // E5 line 13245
  label_tpl_cat_food:               '🍕 อาหาร',                                                                                  // E5 line 13246
  label_tpl_cat_beauty:             '💄 ความงาม',                                                                                // E5 line 13247
  label_tpl_cat_tech:               '📱 เทคโนโลยี',                                                                             // E5 line 13248
  label_tpl_cat_home:               '🏠 บ้าน/ไลฟ์สไตล์',                                                                       // E5 line 13249
  label_tpl_cat_custom:             '✏️ กำหนดเอง',                                                                              // E5 line 13250
  label_tpl_count:                  '${count} รายการ',                                                                           // E5 line 13269
  label_tpl_no_name:                'ไม่มีชื่อ',                                                                                  // E5 line 13281
  label_v2_progress:                '${done} / ${total} รายการ',                                                                 // E5 line 13553
  label_v2_flow_wait_video:         '🎬 รอวิดีโอ Template 2...',                                                                 // E5 line 13744
  label_v2_flow_wait_extend:        '🎞️ รอ Extend Video...',                                                                    // E5 line 13782
  label_v2_flow_wait_tiktok:        '📤 รอ TikTok Upload + Post...',                                                            // E5 line 13884
  label_v2_flow_step_done:          '✅ เสร็จ!',                                                                                  // E5 line 13897
  label_v2_reason_success:          'เสร็จสมบูรณ์',                                                                              // E5 line 13909
  label_v2_reason_skipped:          'ข้ามโดยผู้ใช้',                                                                             // E5 line 14101
  label_v2_flow_creating_image:     '🖼️ เริ่มสร้างรูปภาพ...',                                                                  // E5 line 14000
  label_narrative_none_selected:    'เลือกแล้ว: —',                                                                              // E4 line 11207
  label_narrative_selected:         'เลือกแล้ว: {names}',                                                                        // E4 line 11210

  // ─── GENERAL MESSAGES ─────────────────────────────────────────────
  msg_cannot_load:                  'ไม่สามารถโหลดได้',                                                                           // E1 line 58
  msg_no_devices_registered:        'ไม่มีอุปกรณ์ที่ลงทะเบียนกับ License นี้',                                                    // E1 line 203
  msg_device_count_found:           '📱 พบ {n}/2 อุปกรณ์ที่ลงทะเบียน',                                                          // E1 line 237
  msg_selector_count_suffix:        'Selector: {n} ค่า',                                                                         // E1 line 2108
  msg_no_violations:                '✅ ไม่พบปัญหานโยบายหรือคุณภาพ - พร้อมโพสต์!',                                              // E1 line 1836
  msg_hint_press_run:               'กด Run เพื่อดึงสินค้าจาก TikTok',                                                           // E1 line 3656
  msg_hint_press_fetch:             'กด "ดึงสินค้า" เพื่อดึงจาก TikTok',                                                         // E2 line 3815
  msg_alert_product_details:        'สินค้า: ${item.name}\nID: ${item.productId}\nราคา: ${item.price}\nURL: ${item.url}',        // E2 line 4621
  msg_prompt_ready:                 '✅ Prompt ฉาก {scene} พร้อมแล้ว!',                                                         // E4 line 9706
  msg_go_to_generator:              'ไปที่ {type} Generator แล้วกด Auto Paste',                                                   // E4 line 9707
  msg_dash_history_empty:           'ยังไม่มีประวัติ',                                                                            // E5 line 13170
  msg_tpl_list_empty:               'ยังไม่มี Template ในหมวดนี้',                                                                // E5 line 13272
  msg_v2_queue_empty:               'ยังไม่มีสินค้า',                                                                            // E5 line 13593
  msg_v2_queue_hint:                'กด "ดึงสินค้า" เพื่อดึงจาก TikTok',                                                         // E5 line 13593
  msg_v2_log_empty:                 'ยังไม่มีกิจกรรม',                                                                           // E5 line 14157

  // ─── STORYMODE / STUDIO UI ────────────────────────────────────────
  // Story type names + descriptions
  story_type_custom_name:           'กำหนดเอง (Custom)',                                                                          // E3 line 6449
  story_type_custom_desc:           'ใส่หัวข้อเอง AI สร้างเรื่องให้อิสระ',                                                       // E3 line 6449
  story_type_product_review_name:   'รีวิวสินค้า UGC',                                                                           // E3 line 6450
  story_type_product_review_desc:   'สาวไทยรีวิวสินค้าในสถานการณ์สุดครีเอท เน้นขายของ',                                          // E3 line 6450
  story_type_brand_story_name:      'เล่าเรื่องแบรนด์',                                                                          // E3 line 6451
  story_type_brand_story_desc:      'สร้างเรื่องราวรอบแบรนด์/สินค้าอย่างมีอารมณ์',                                               // E3 line 6451
  story_type_tutorial_name:         'สอนวิธีใช้ How-to',                                                                         // E3 line 6452
  story_type_tutorial_desc:         'สาธิตการใช้งานสินค้าทีละขั้นตอน',                                                           // E3 line 6452
  story_type_drama_name:            'มินิซีรีส์ ดราม่า',                                                                         // E3 line 6453
  story_type_drama_desc:            'เรื่องสั้นมีพล็อต ตัวละคร ปมขัดแย้ง จบด้วยสินค้า',                                          // E3 line 6453
  story_type_fairytale_name:        'นิทาน / เรื่องเล่า',                                                                        // E3 line 6454
  story_type_fairytale_desc:        'ตัวละครแฟนตาซีผจญภัย เล่าเรื่องด้วย voiceover',                                             // E3 line 6454
  story_type_asmr_name:             'ASMR / Cinematic',                                                                          // E3 line 6455
  story_type_asmr_desc:             'เน้นภาพสวย เสียงบรรยากาศ ไม่มีบทพูด',                                                      // E3 line 6455
  story_type_comedy_name:           'ตลก / Skit',                                                                                // E3 line 6456
  story_type_comedy_desc:           'สถานการณ์ตลกหักมุม จบด้วยสินค้าเป็น punchline',                                             // E3 line 6456
  story_type_comparison_name:       'เปรียบเทียบ ก่อน-หลัง',                                                                    // E3 line 6457
  story_type_comparison_desc:       'แสดงปัญหา → ใช้สินค้า → ผลลัพธ์ที่ดีขึ้น',                                                 // E3 line 6457
  story_type_character_name:        'ตัวละคร Pixar / 3D',                                                                       // E3 line 6458
  story_type_character_desc:        'ตัวละคร 3D Animation เล่าเรื่องสนุก พูดไทย',                                               // E3 line 6458
  // Visual styles
  visual_cinematic:                 'ซีนีมาติกสมจริง (ภาพยนตร์คมชัด)',                                                           // E3 line 6464
  visual_disney:                    'แอนิเมชัน 3D (สไตล์ Pixar การ์ตูน 3 มิติ)',                                                 // E3 line 6465
  visual_ghibli:                    'สไตล์จิบลิ (การ์ตูนญี่ปุ่นอบอุ่น)',                                                        // E3 line 6466
  visual_claymation:                'รูปปั้นดินน้ำมัน (เหมือนปั้นมือ)',                                                          // E3 line 6468
  visual_crochet:                   'ถักไหมพรม (น่ารัก นุ่มนิ่ม)',                                                               // E3 line 6469
  visual_plushie:                   'ตุ๊กตาผ้าขนฟู (ตุ๊กตาน่ากอด)',                                                             // E3 line 6470
  visual_papercut:                  'กระดาษตัด (งานฝีมือกระดาษ)',                                                                // E3 line 6471
  visual_dragonball:                'สไตล์ดราก้อนบอล (การ์ตูนต่อสู้)',                                                           // E3 line 6473
  visual_90sanime:                  'อนิเมะยุค 90 (การ์ตูนญี่ปุ่นย้อนยุค)',                                                     // E3 line 6474
  visual_gta:                       'สไตล์ GTA (หน้าจอโหลดเกม)',                                                                // E3 line 6475
  visual_watercolor:                'สีน้ำ (ภาพวาดนุ่มนวล)',                                                                     // E3 line 6477
  visual_chalk:                     'ภาพวาดชอล์ก (วาดบนกระดานดำ)',                                                              // E3 line 6478
  visual_oilpaint:                  'สีน้ำมัน (ภาพวาดคลาสสิก)',                                                                  // E3 line 6479
  visual_popart:                    'ป๊อปอาร์ต (สีจัด ตัดกันแรง)',                                                               // E3 line 6480
  visual_pixel:                     'พิกเซลอาร์ต (เกมย้อนยุค 8-bit)',                                                            // E3 line 6482
  visual_cyberpunk:                 'ไซเบอร์พังค์ / นีออน (ล้ำสมัย เรืองแสง)',                                                  // E3 line 6483
  visual_vector:                    'ภาพเวกเตอร์แบน (กราฟิกเรียบง่าย)',                                                          // E3 line 6484
  visual_lego:                      'สไตล์เลโก้ (ตัวต่อพลาสติก)',                                                               // E3 line 6485
  visual_vaporwave:                 'เวเปอร์เวฟ (ย้อนยุค สีม่วงชมพู)',                                                          // E3 line 6487
  visual_emoji:                     'สไตล์อีโมจิ (ไอคอนน่ารัก)',                                                                // E3 line 6488
  // Extended visual styles (E4)
  visual_mute_earth:                'โทนดิน เงียบสงบ (สีธรรมชาติอ่อนๆ)',                                                         // E4 line 11282
  visual_mutelu_mystical:           'สายมู ลึกลับ (เครื่องราง โหราศาสตร์)',                                                      // E4 line 11283
  visual_thai_street:               'ถนนไทยยามค่ำ (บรรยากาศตลาดกลางคืน)',                                                        // E4 line 11284
  visual_rainy_lonely:              'วันฝนตก เหงาๆ (อารมณ์อ่อนไหว)',                                                             // E4 line 11285
  visual_thai_vintage:              'ไทยวินเทจ (ย้อนยุคเมืองเก่า)',                                                              // E4 line 11286
  visual_y2k_pop:                   'Y2K ไทยป๊อป (แฟชั่นยุค 2000)',                                                             // E4 line 11287
  visual_vivid_summer:              'ซัมเมอร์ไทยสดใส (สีจัด แดดร้อน)',                                                          // E4 line 11288
  visual_rich_flex:                 'รวยอวดของ (หรูหรา โชว์ไลฟ์สไตล์)',                                                         // E4 line 11289
  visual_local_homey:               'บ้านๆ อบอุ่น (สไตล์ชาวบ้านน่ารัก)',                                                        // E4 line 11290
  visual_surreal_comedy:            'ตลกเหนือจริง (แปลก ขำ ไม่คาดคิด)',                                                         // E4 line 11291
  visual_ugc_raw:                   'UGC ดิบๆ (ถ่ายมือถือไม่ปรุงแต่ง)',                                                         // E4 line 11293
  visual_fisheye:                   'เลนส์ฟิชอาย (มุมกว้างบิดเบี้ยว)',                                                          // E4 line 11294
  visual_bodycam_pov:               'กล้องติดตัว / มุมมองคนที่ 1',                                                              // E4 line 11295
  visual_hyper_macro:               'มาโครซูมใกล้ (เห็นรายละเอียดจิ๋ว)',                                                        // E4 line 11296
  visual_glitch:                    'กลิทช์บิดเบี้ยว (ภาพเพี้ยน สั่น)',                                                         // E4 line 11297
  visual_old_money:                 'Old Money (รวยเก่า หรูเรียบ)',                                                              // E4 line 11298
  visual_lofi_chill:                'โลไฟ ชิลล์ (เพลงเบาๆ ผ่อนคลาย)',                                                          // E4 line 11299
  visual_liminal_space:             'พื้นที่เหนือจริง (ฝันกลางวัน ประหลาด)',                                                     // E4 line 11300
  visual_cottagecore:               'คอทเทจคอร์ (ชนบท เทพนิยาย)',                                                               // E4 line 11301
  visual_paparazzi:                 'ปาปารัสซี่ (แฟลชแรง สไตล์แอบถ่าย)',                                                        // E4 line 11302
  // Mood / tone labels
  mood_cinematic_standard:          'ซีนีมาติก มาตรฐาน (ภาพยนตร์ทั่วไป)',                                                        // E3 line 6966
  mood_dramatic:                    'ดราม่า เข้มข้น (อารมณ์รุนแรง)',                                                             // E3 line 6967
  mood_peaceful:                    'สงบ ผ่อนคลาย (โทนอ่อนโยน)',                                                                // E3 line 6968
  mood_energetic:                   'มีพลัง สดใส (ตื่นเต้น กระฉับกระเฉง)',                                                      // E3 line 6969
  mood_romantic:                    'โรแมนติก นุ่มนวล (หวาน อบอุ่น)',                                                            // E3 line 6970
  mood_mysterious:                  'ลึกลับ มืด (น่าค้นหา)',                                                                     // E3 line 6971
  mood_playful:                     'สนุกสนาน ขี้เล่น (สดใส ร่าเริง)',                                                           // E3 line 6972
  mood_professional:                'มืออาชีพ สะอาด (น่าเชื่อถือ)',                                                              // E3 line 6973
  mood_nostalgic:                   'ย้อนยุค เรโทร (คิดถึงอดีต)',                                                               // E3 line 6974
  mood_luxury:                      'หรูหรา พรีเมียม (ไฮเอนด์)',                                                                 // E3 line 6975
  mood_horror:                      'สยองขวัญ ระทึก (น่ากลัว)',                                                                  // E3 line 6976
  mood_comedy:                      'ตลก ขำขัน (สนุก เบาสมอง)',                                                                  // E3 line 6977
  mood_epic:                        'มหากาพย์ ยิ่งใหญ่ (อลังการ)',                                                               // E3 line 6978
  mood_warm:                        'อบอุ่น น่าอยู่ (เหมือนบ้าน)',                                                               // E3 line 6979
  mood_futuristic:                  'อนาคต ไซไฟ (ล้ำสมัย)',                                                                      // E3 line 6980
  mood_raw:                         'ดิบ เท่ (ไม่ปรุงแต่ง)',                                                                     // E3 line 6981
  mood_dreamy:                      'ฝันหวาน เลือนลาง (เหนือจริง)',                                                              // E3 line 6982
  mood_urban:                       'เมือง สตรีท (วัฒนธรรมถนน)',                                                                 // E3 line 6983
  mood_nature:                      'ธรรมชาติ ออร์แกนิก (สีเขียว สดชื่น)',                                                      // E3 line 6984
  mood_minimal:                     'มินิมอล สะอาด (เรียบง่าย)',                                                                  // E3 line 6985
  // Hook options
  hook_auto:                        'AI เลือกให้อัตโนมัติ',                                                                       // E3 line 7046
  hook_fomo:                        'FOMO & Flash Sale (กลัวพลาด)',                                                              // E3 line 7047
  hook_authentic:                   'Authentic Vibe (เพื่อนป้ายยา)',                                                             // E3 line 7048
  hook_obsession:                   'Scarcity & Obsession (อวยยศ)',                                                              // E3 line 7049
  hook_curiosity:                   'Curiosity Gap & Shock (ช็อก)',                                                              // E3 line 7050
  // Narrative style options (E4)
  label_narrative_veggie_gangster:  'ผักนักเลง / อาหารขี้บ่น',                                                                   // E4 line 11124
  label_narrative_organ_tough_love: 'อวัยวะ Tough Love (ตับ ไต ไส้ พุง)',                                                       // E4 line 11125
  label_narrative_appliance_life:   'เครื่องใช้ไฟฟ้าสู้ชีวิต',                                                                   // E4 line 11126
  label_narrative_politics_satire:  'การเมืองจอมแซะ',                                                                            // E4 line 11127
  label_narrative_money_wallet:     'เงินในบัญชี / กระเป๋าตังค์',                                                               // E4 line 11128
  label_narrative_ghost_shrine:     'ผีเจ้าที่ / ผีบ้านผีเรือน',                                                               // E4 line 11129
  label_narrative_land_house:       'โฉนดที่ดิน / บ้านขี้เหงา',                                                                 // E4 line 11130
  label_narrative_package_sad:      'พัสดุขี้น้อยใจ',                                                                            // E4 line 11131
  label_narrative_lucky_charm:      'ไอเทมสายมู / เครื่องราง',                                                                   // E4 line 11132
  label_narrative_skincare_cream:   'สกินแคร์ / ครีมซอง',                                                                       // E4 line 11133
  label_narrative_inner_voice:      'เสียงในหัว (Inner Voice)',                                                                  // E4 line 11134
  label_narrative_alarm_clock:      'นาฬิกาปลุกจอมด่า',                                                                          // E4 line 11135
  label_narrative_computer_office:  'คอมพิวเตอร์ / โน้ตบุ๊กออฟฟิศ',                                                             // E4 line 11136
  label_narrative_coffee_milk_tea:  'กาแฟ / ชานมเพื่อนรัก',                                                                     // E4 line 11137
  label_narrative_energy_bar:       'พลังงาน (Energy Bar)',                                                                      // E4 line 11138
  label_narrative_pet_gossip:       'สัตว์เลี้ยงนินทาเจ้าของ',                                                                   // E4 line 11139
  label_narrative_plant_talk:       'ต้นไม้พูดได้',                                                                              // E4 line 11140
  label_narrative_shoes_passport:   'รองเท้า / พาสปอร์ต',                                                                       // E4 line 11141
  label_narrative_dating_app:       'แอปนัดเดท / มือถือ',                                                                       // E4 line 11142
  label_narrative_closet_clothes:   'เสื้อผ้าในตู้',                                                                             // E4 line 11143
  label_narrative_de_influencer:    'สายช็อตฟีล (บอกตรงๆ ไม่เชียร์)',                                                           // E4 line 11145
  label_narrative_fortune_teller:   'สายมูเตลู (ดูดวง เสริมดวง)',                                                               // E4 line 11146
  label_narrative_asmr_seller:      'ASMR ขายเงียบๆ (เสียงกระซิบ)',                                                             // E4 line 11147
  label_narrative_over_sharer:      'เล่าหมดเปลือก (แชร์ทุกเรื่อง)',                                                            // E4 line 11148
  label_narrative_main_character:   'ตัวเอกของเรื่อง / มุมมองคนที่ 1',                                                          // E4 line 11149
  label_narrative_investigator:     'สายสืบสวน (เจาะลึก ค้นหาความจริง)',                                                        // E4 line 11150
  label_narrative_isan_joy:         'ไทบ้านม่วนซื่น (สำเนียงอีสาน สนุก)',                                                       // E4 line 11152
  label_narrative_southern_direct:  'คนใต้ใจเต็ม (สำเนียงใต้ พูดตรง)',                                                         // E4 line 11153
  label_narrative_northern_chill:   'สาวเจียงใหม่ (สำเนียงเหนือ อ่อนหวาน)',                                                     // E4 line 11154
  label_narrative_sassy_queen:      'ตัวมารดาโฮ่งๆ (แซ่บ จัดจ้าน)',                                                             // E4 line 11156
  label_narrative_gossiper:         'สายเผือก / ป้าข้างบ้าน (ชอบนินทา)',                                                        // E4 line 11157
  label_narrative_self_made:        'วัยรุ่นสร้างตัว (ขยัน ทำเอง)',                                                             // E4 line 11158
  label_narrative_prankster_couple: 'คู่รักหยุมหัว (แกล้งกัน ขำๆ)',                                                             // E4 line 11159
  label_narrative_underdog:         'สู้ชีวิต (จากศูนย์สู่ฮีโร่)',                                                               // E4 line 11160
  label_narrative_voiceover_troll:  'นักพากย์นรก (พากย์เสียงตลก)',                                                              // E4 line 11161
  label_narrative_fangirl:          'ติ่งอวยยศ (แฟนคลับคลั่ง)',                                                                  // E4 line 11162
  label_narrative_local_guru:       'สูตรผีบอก (ภูมิปัญญาชาวบ้าน)',                                                             // E4 line 11163
  label_narrative_mindset_coach:    'ไลฟ์โค้ช (สร้างแรงบันดาลใจ)',                                                              // E4 line 11164
  label_narrative_satirist:         'สายแซะสังคม (เสียดสีขำๆ)',                                                                  // E4 line 11165
  label_narrative_glutton:          'สายกินดุดัน (กินจุ รีวิวอาหาร)',                                                            // E4 line 11166

  // ─── OTHER UI STRINGS ─────────────────────────────────────────────
  confirm_delete_self_device:       '⚠️ คุณกำลังจะลบ "เครื่องนี้" ออกจาก License\n\nหลังจากลบแล้ว คุณสามารถกด "เปิดใช้งาน" เพื่อลงทะเบียนใหม่ได้ทันที\n\nยืนยันหรือไม่?', // E1 line 253
  confirm_delete_other_device:      '🗑️ ต้องการลบอุปกรณ์นี้ออกจาก License หรือไม่?\n\nอุปกรณ์ที่ถูกลบจะต้องลงทะเบียนใหม่',   // E1 line 254
  confirm_delete_self_inapp:        '⚠️ คุณกำลังจะลบเครื่องนี้ออกจาก License\n\nหลังจากลบแล้ว คุณจะต้องใส่ License Key ใหม่เพื่อเข้าใช้งานอีกครั้ง\n\nยืนยันหรือไม่?', // E1 line 359
  confirm_delete_device_inapp:      'ต้องการลบ Device นี้หรือไม่?',                                                             // E1 line 360
  confirm_delete_all_products:      'ต้องการลบสินค้าทั้งหมด {n} รายการ?',                                                       // E1 line 3351  ({n} template)
  confirm_dash_reset:               'รีเซ็ตสถิติทั้งหมด?',                                                                       // E5 line 13224
  confirm_tpl_delete:               'ลบ Template นี้?',                                                                          // E5 line 13341
  confirm_v2_clear_all:             'ลบสินค้าทั้งหมดใน V2?',                                                                    // E5 line 14153
  label_last_used_colon:            'ใช้ล่าสุด:',                                                                                // E1 line 218  (with colon — distinct from 'ใช้ล่าสุด')
  label_registered_date_space:      'ลงทะเบียน: ',                                                                               // E1 line 336  (with trailing space)
  label_last_used_full_space:       'ใช้งานล่าสุด: ',                                                                            // E1 line 336  (with trailing space)
  success_delete_self_device:       '✅ ลบอุปกรณ์สำเร็จ!',                                                                      // E1 line 267  (already in STATUS_MESSAGES but distinct ✅ prefixed form)
  loading_analyzing_product:        '🔍 AI กำลังวิเคราะห์รูปสินค้า...',                                                         // E3 line 7580  (loading indicator)
  loading_analyzing_character:      '🔍 AI กำลังวิเคราะห์รูปตัวละคร reference...',                                              // E3 line 7592
  loading_generating_queue:         '[Queue] กำลังสร้างสคริปต์ด้วย {provider}...',                                               // E3 line 7613
  option_no_change_dash:            '— ไม่เปลี่ยน —',                                                                           // E1 line 2180  (already in BUTTON_LABELS but archived here for flat-key reference)
};  // end UI_COPY_EXTENDED

