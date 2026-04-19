/**
 * 06c-errors-buttons.js — Error Messages & Button Labels
 * ======================================================
 * Split จาก 06-ui-copy.js (lines 151–323)
 * เนื้อหา: ERROR_MESSAGES, BUTTON_LABELS
 */

// ==================== Error Messages ====================
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


// ==================== Button / Label Text ====================
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
