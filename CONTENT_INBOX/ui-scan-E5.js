// UI Scan E5 — sidepanel.js lines 11800–14225
export const UI_SCAN_E5 = {

  // ─── Studio Scene Card ───────────────────────────────────────────────────────
  placeholder_studio_dialogue: 'บทพูดของตัวละครในฉากนี้ (แก้ไขได้ตามใจ)',  // line 11801
  label_studio_type_image: '🖼️ Image',                                        // line 11814
  label_studio_type_video: '🎬 Video',                                        // line 11815
  label_studio_preview_1: '1 รูป',                                            // line 11818
  label_studio_preview_2: '2 รูป',                                            // line 11819
  label_studio_preview_3: '3 รูป',                                            // line 11820
  label_studio_preview_4: '4 รูป',                                            // line 11821
  btn_studio_scene_gen_title: 'สร้าง',                                        // line 11827 (title attr)
  btn_studio_scene_del_title: 'ลบ',                                           // line 11828 (title attr)

  // ─── Studio Status Labels ─────────────────────────────────────────────────
  status_studio_pending: '⏳ รอ',                                             // line 11919
  status_studio_generating: '🔄 กำลังสร้าง...',                              // line 11920
  status_studio_done: '✅ เสร็จ',                                             // line 11921
  status_studio_error: '❌ ผิดพลาด',                                         // line 11922

  // ─── Studio Pipeline Button Labels ───────────────────────────────────────
  btn_studio_gen_img_with_count: 'สร้างรูป (${selectedImages} ฉาก)',         // line 12200 (template)
  btn_studio_gen_img: 'สร้างรูป',                                             // line 12202
  btn_studio_gen_vid_with_count: 'สร้างวีดีโอ (${selectedVideos} ฉาก)',      // line 12209 (template)
  btn_studio_gen_vid: 'สร้างวีดีโอ',                                         // line 12211
  btn_studio_gen_img_running: 'กำลังสร้างรูป...',                            // line 12220
  btn_studio_gen_img_progress: 'สร้างรูป ${i+1}/${total}...',                // line 12230 (template)
  btn_studio_gen_img_done: '✅ เสร็จ!',                                      // line 12234
  btn_studio_gen_vid_running: 'กำลังสร้างวีดีโอ...',                         // line 12247
  btn_studio_gen_vid_progress: 'สร้างวีดีโอ ${i+1}/${total}...',             // line 12269 (template)
  btn_studio_gen_vid_done: '✅ เสร็จ!',                                      // line 12306
  btn_studio_gen_vid_error: '❌ Error',                                       // line 12309
  error_studio_video_gen: 'เกิดข้อผิดพลาด: ',                               // line 12310 (prefix for alert)
  error_studio_no_image: 'กรุณาสร้างรูปก่อน แล้วเลือกรูปที่ต้องการสร้างวีดีโอ',  // line 12262

  // ─── Studio Grid ──────────────────────────────────────────────────────────
  label_studio_result_count: '${imgCount} รูป / ${vidCount} วีดีโอ',         // line 12348 (template)
  msg_studio_grid_empty: 'ยังไม่มีรูป/วีดีโอ — กด "สร้างรูป" หรือ "สร้างวีดีโอ" เพื่อเริ่ม', // line 12351
  btn_studio_select_image: '✅ เลือก',                                        // line 12372
  btn_studio_select_image_title: 'เลือกรูปนี้สำหรับสร้างวีดีโอ',             // line 12372 (title attr)
  btn_studio_download_title: 'ดาวน์โหลด',                                    // line 12373 / 12382 (title attr)

  // ─── Studio Video Button Sub-label ───────────────────────────────────────
  label_studio_veo_with_ref: 'Veo 3.1 (+ รูปที่เลือก)',                      // line 12446
  label_studio_veo_no_ref: 'Veo 3.1',                                        // line 12450

  // ─── Studio API Status ────────────────────────────────────────────────────
  status_studio_api_ready: 'Google API Key พร้อมใช้งาน',                     // line 13118
  status_studio_api_missing: 'ยังไม่ได้ตั้งค่า Google API Key (ไปที่แท็บ ⚙️)', // line 13121

  // ─── Platform Tab — AI Caption / CTA Buttons ─────────────────────────────
  btn_platform_ai_caption_running: '⏳ กำลังสร้าง...',                       // line 12530
  btn_platform_ai_caption: '🤖 AI สร้าง Caption',                            // line 12560
  btn_platform_ai_cta_running: '⏳ กำลังสร้าง...',                           // line 12591
  btn_platform_ai_cta: '🤖 AI สร้าง CTA',                                    // line 12630
  error_platform_api_key: 'กรุณาตั้งค่า Google AI API Key ก่อน (แท็บ ⚙️)',  // line 12534 / 12595

  // ─── Platform Tab — Queue UI ──────────────────────────────────────────────
  error_platform_queue_busy: 'กำลังโพสต์อยู่ — รอให้เสร็จก่อนค่อยล้าง',    // line 12671
  error_platform_file_type: 'กรุณาเลือกไฟล์ Video เท่านั้น (.mp4, .mov, .webm)', // line 12685
  label_platform_char_count_reset: '0 / 2200',                               // line 12837
  btn_platform_start_all: 'เริ่มโพสต์ทั้งหมด (${pending} รายการ)',           // line 12881 (template)
  btn_platform_start_done: 'โพสต์เสร็จแล้ว',                                // line 12882
  label_platform_schedule_now: 'ทันที',                                       // line 12903
  label_platform_no_caption: '(ไม่มี Caption)',                              // line 12907
  btn_platform_queue_remove_title: 'ลบ',                                     // line 12914 (title attr)

  // ─── Platform Tab — Post Status ───────────────────────────────────────────
  status_platform_preparing: '⏳ กำลังเตรียม Video: ${videoName}...',        // line 12963 (template)
  error_platform_read_file: 'อ่านไฟล์ Video ไม่สำเร็จ',                     // line 12970
  status_platform_posting: '⏳ [${n}/${total}] โพสต์ "${videoName}" → ${platform}...', // line 12977 (template)
  status_platform_wait_next: '⏳ รอ 8 วินาที แล้วทำรายการถัดไป (เผื่อเน็ตช้า)...', // line 13001
  status_platform_complete: '✅ เสร็จสิ้น — สำเร็จ ${done} รายการ',          // line 13011 (template)
  error_platform_timeout: 'Timeout — กรุณาอัพโหลด video เอง',               // line 13063

  // ─── Dashboard Tab ────────────────────────────────────────────────────────
  msg_dash_history_empty: 'ยังไม่มีประวัติ',                                  // line 13170
  confirm_dash_reset: 'รีเซ็ตสถิติทั้งหมด?',                                // line 13224

  // ─── Templates Tab ────────────────────────────────────────────────────────
  label_tpl_cat_general: '📦 ทั่วไป',                                        // line 13244
  label_tpl_cat_fashion: '👗 แฟชั่น',                                        // line 13245
  label_tpl_cat_food: '🍕 อาหาร',                                            // line 13246
  label_tpl_cat_beauty: '💄 ความงาม',                                        // line 13247
  label_tpl_cat_tech: '📱 เทคโนโลยี',                                        // line 13248
  label_tpl_cat_home: '🏠 บ้าน/ไลฟ์สไตล์',                                  // line 13249
  label_tpl_cat_custom: '✏️ กำหนดเอง',                                       // line 13250
  label_tpl_count: '${count} รายการ',                                        // line 13269 (template)
  msg_tpl_list_empty: 'ยังไม่มี Template ในหมวดนี้',                         // line 13272
  label_tpl_no_name: 'ไม่มีชื่อ',                                            // line 13281
  btn_tpl_use: '📝 ใช้งาน',                                                  // line 13286
  btn_tpl_copy: '📋 คัดลอก',                                                 // line 13287
  btn_tpl_copy_done: '✅ คัดลอกแล้ว!',                                       // line 13332
  confirm_tpl_delete: 'ลบ Template นี้?',                                    // line 13341
  error_tpl_no_name: 'กรุณาใส่ชื่อ Template',                               // line 13363
  error_tpl_no_prompt: 'กรุณาใส่ Prompt',                                    // line 13364
  btn_tpl_save_done: '✅ บันทึกแล้ว!',                                       // line 13381
  btn_tpl_save: '💾 บันทึก Template',                                        // line 13382

  // ─── Auto V2 — Errors & Alerts ───────────────────────────────────────────
  error_v2_template_incomplete: 'กรุณากรอกข้อมูล Template Settings ให้ครบก่อนรัน', // line 13450
  error_v2_template_alert: 'กรุณากรอก Template Settings ให้ครบทุกช่อง (ลักษณะบรรจุภัณฑ์, ประเภท, พื้นผิว, ฉากหลัง, การเคลื่อนไหวฉากหลัง)', // line 14053
  error_v2_no_queue: 'ไม่มีสินค้าในคิว กรุณาดึงสินค้าก่อน',                // line 14046

  // ─── Auto V2 — Flow Progress UI ──────────────────────────────────────────
  label_v2_progress: '${done} / ${total} รายการ',                           // line 13553 / 13564 (template)
  status_v2_flow_done: '✅ เสร็จ',                                           // line 13576
  label_v2_badge_complete: 'เสร็จแล้ว',                                     // line 13582

  // ─── Auto V2 — Product Queue Empty State ─────────────────────────────────
  msg_v2_queue_empty: 'ยังไม่มีสินค้า',                                      // line 13593
  msg_v2_queue_hint: 'กด "ดึงสินค้า" เพื่อดึงจาก TikTok',                   // line 13593

  // ─── Auto V2 — Activity Log Messages ─────────────────────────────────────
  log_v2_timeout_skip: '⏰ Timeout 35 นาที: ${name} — ข้ามอัตโนมัติ',       // line 13636 (template)
  log_v2_item_failed: '❌ ล้มเหลว: ${name} — ${reason}',                    // line 13653 (template)
  log_v2_goto_next: '🔄 ไปรายการถัดไป...',                                  // line 13666
  log_v2_all_done: '🎉 ทำครบแล้ว! (สำเร็จ ${posted}, ล้มเหลว ${failed})',   // line 13671 (template)
  log_v2_process_flow_start: '🔄 ${name}: เริ่ม processFlow',               // line 13689 (template)
  log_v2_build_prompts: '⚡ ${name}: สร้าง V2 Prompts...',                  // line 13697 (template)
  log_v2_item_complete: '✅ ${name}: เสร็จสิ้น',                             // line 13707 (template)
  log_v2_step_failed: '❌ ${name}: Step ล้มเหลว — ${error}',               // line 13718 (template)
  log_v2_create_image: '🖼️ ${name}: สร้างรูปภาพ (Template 1)...',           // line 13738 (template)
  log_v2_create_video: '🎬 ${name}: กำลังสร้างวิดีโอ (Template 2)...',      // line 13743 (template)
  label_v2_flow_wait_video: '🎬 รอวิดีโอ Template 2...',                    // line 13744 (flow step text)
  log_v2_video_done: '✅ ${name}: Video เสร็จ!',                             // line 13755 (template)
  log_v2_extending: '🎞️ ${name}: Video เสร็จ กำลัง Extend... (${sec} วิ)', // line 13761 (template)
  log_v2_extend_video: '🎞️ ${name}: Extend Video (Template 3)...',          // line 13781 (template)
  label_v2_flow_wait_extend: '🎞️ รอ Extend Video...',                       // line 13782 (flow step text)
  log_v2_extend_done: '✅ ${name}: Extend เสร็จ!',                           // line 13793 (template)
  log_v2_to_tiktok: '📤 ${name}: → TikTok Upload',                          // line 13810 (template)
  log_v2_open_flow: '🌐 ${name}: เปิด Google Flow (${mode})...',             // line 13827 (template)
  log_v2_reload_flow: '🔄 ${name}: Reload Google Flow...',                   // line 13861 (template)
  log_v2_wait_tiktok: '📤 ${name}: รอ TikTok Upload + Post...',             // line 13883 (template)
  label_v2_flow_wait_tiktok: '📤 รอ TikTok Upload + Post...',               // line 13884 (flow step text)
  log_v2_tiktok_done: '✅ ${name}: TikTok เสร็จแล้ว!',                      // line 13896 (template)
  label_v2_flow_step_done: '✅ เสร็จ!',                                     // line 13897 (flow step text)
  log_v2_item_success: '✅ เสร็จ: ${name}',                                  // line 13908 (template)
  label_v2_reason_success: 'เสร็จสมบูรณ์',                                  // line 13909
  log_v2_next_item: '🚀 ถัดไป: ${name} (เหลือ ${remaining})',               // line 13924 (template)
  log_v2_wait_before_next: '⏳ รอ ${sec} วิ ก่อนรายการถัดไป...',            // line 13927 (template)
  log_v2_tiktok_upload_failed: '❌ ${name}: TikTok Upload ล้มเหลว',         // line 13939 (template)
  log_v2_tiktok_posted: '✅ ${name}: โพส TikTok เสร็จ!',                    // line 13959 (template)
  log_v2_start_item: '🚀 ${name}: เริ่มทำงาน...',                           // line 13989 (template)
  label_v2_flow_creating_image: '🖼️ เริ่มสร้างรูปภาพ...',                  // line 14000 (flow step text)
  log_v2_autov2_start: '🎬 runAutoV2() เริ่มทำงาน',                         // line 14043
  log_v2_template_missing: '❌ กรุณากรอก Template Settings ให้ครบก่อนรัน', // line 14052
  log_v2_reset_pending: '🔄 Reset สถานะสินค้าทั้งหมดเป็น pending...',       // line 14063
  log_v2_start_processing: '📦 เริ่มประมวลผล: ${name}',                    // line 14072 (template)
  log_v2_stopped: '⏹️ หยุดทำงาน',                                           // line 14092
  log_v2_skip_item: '⏭️ ข้าม: ${name}',                                     // line 14100 (template)
  label_v2_reason_skipped: 'ข้ามโดยผู้ใช้',                                // line 14101
  log_v2_products_added: '📦 เพิ่ม ${added} สินค้าใหม่ (รวม ${total})',     // line 14120 (template)
  msg_v2_log_empty: 'ยังไม่มีกิจกรรม',                                      // line 14157
  confirm_v2_clear_all: 'ลบสินค้าทั้งหมดใน V2?',                           // line 14153
};
