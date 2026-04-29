// UI Merge 12 — deduplicated from ui-scan-E1 + ui-scan-E2
// Sources: sidepanel.js lines 1–3200 (E1) + lines 2800–6200 (E2)
// Entries before dedup: ~365 (213 E1 + 152 E2)
// Entries after dedup: 275
// Dedup rules applied:
//   • Exact duplicate key → keep E1 version
//   • Exact duplicate value (same Thai/English string) → keep more-descriptive key
//   • Template-variable-only differences ({n} vs ${var}) → treat as same, keep E1

export const UI_MERGE_12 = {

  // ─── ERROR MESSAGES ─────────────────────────────────────────────────────────

  error_please_enter_license:        'กรุณาใส่ License Key',
  error_generic_with_msg:            'เกิดข้อผิดพลาด: ',                                      // base prefix (no emoji) — covers error_generic_scrape
  error_delete_device_failed:        '❌ เกิดข้อผิดพลาด: ',                                   // same prefix + emoji variant
  error_fill_license_first:          '❌ กรุณากรอก License Key ให้ครบก่อน',
  error_cannot_load_devices:         '❌ ไม่สามารถโหลดรายชื่ออุปกรณ์ได้: ',
  error_cannot_delete_device:        '❌ ไม่สามารถลบอุปกรณ์ได้',
  error_load_devices_failed:         'เกิดข้อผิดพลาดในการโหลด',
  error_enter_license_first:         'กรุณาใส่ License Key ก่อน',
  error_cannot_copy:                 'ไม่สามารถคัดลอกได้',
  error_open_tiktok_first_single:    'กรุณาเปิดหน้า TikTok ก่อนกด "ดึงสินค้า"',
  error_open_tiktok_first_all:       'กรุณาเปิดหน้า TikTok ก่อนกด "ดึงทุกหน้า"',
  error_cannot_connect_refresh:      'ไม่สามารถเชื่อมต่อได้ กรุณารีเฟรชหน้า TikTok แล้วลองใหม่',
  error_no_products_in_queue:        'ไม่มีสินค้าในคิว',
  error_no_products_start:           'ไม่มีสินค้าในคิว กรุณาดึงสินค้าก่อน',
  error_zoom_failed:                 '❌ ส่งคำสั่ง Zoom ไม่สำเร็จ',
  error_handle_flow_error:           '❌ Error ใน handleFlowStepFailed: {msg}',
  error_generic:                     'เกิดข้อผิดพลาด: ${error.message}',                       // full template literal variant from E2
  error_no_api_key:                  'กรุณาตั้งค่า API Key ก่อนใช้งาน',
  error_no_api_key_settings:         'กรุณาตั้งค่า API Key ก่อนใช้งาน (ไปที่แท็บ Settings)',
  error_no_api_key_openai_google:    'กรุณาตั้งค่า API Key ก่อนใช้งาน (OpenAI หรือ Google AI)',
  error_no_prompt_for_flow:          'กรุณาสร้าง Prompt ก่อนเปิด Flow',

  // ─── STATUS / FLOW MESSAGES ──────────────────────────────────────────────────

  status_loading:                    '⏳ กำลังโหลด...',
  status_device_loading:             'กำลังโหลด...',
  status_no_license:                 'ไม่มี License',
  status_invalid_license:            'License ไม่ถูกต้อง',
  status_unlimited:                  '♾️ ไม่จำกัด',
  status_unlimited_fallback:         'ไม่จำกัด',
  status_expired:                    '❌ หมดอายุ',
  status_expiring_days:              '⚠️ เหลือ {n} วัน',
  status_valid_days:                 '✅ เหลือ {n} วัน',
  status_pending:                    'รอดำเนินการ',
  status_analyzing:                  'กำลังวิเคราะห์',
  status_generating:                 'กำลังสร้าง',
  status_processing:                 '🔄 กำลังทำ',
  status_in_progress:                'กำลังดำเนินการ',                                        // E2 status_processing (different value, renamed)
  status_completed:                  'เสร็จสิ้น',                                             // covers fp_badge_completed, status_flow_complete
  status_posted_ok:                  '✅ สำเร็จ',
  status_failed:                     '❌ ล้มเหลว',
  status_skipped:                    '⏭️ ข้าม',
  status_error:                      'ผิดพลาด',
  status_stopped_by_user:            'หยุดโดยผู้ใช้',                                         // covers msg_stopped_by_user, status_update_stopped
  status_connect_failed:             'เชื่อมต่อไม่สำเร็จ',

  // --- flow step statuses ---
  status_waiting_flow:               '🌐 รอ Google Flow...',
  status_starting_image:             '🖼️ เริ่มสร้างรูปภาพ...',                               // covers log_update_flow_step_image, log_update_step_image
  status_image_generating:           '🖼️ กำลังสร้างรูปภาพ...',
  status_image_done:                 '✅ สร้างรูปเสร็จ → เริ่มสร้างวิดีโอ',
  status_video_generating_8s:        '🎬 กำลังสร้างวิดีโอ 8 วิ...',
  status_video_generating_16s:       '🎞️ กำลังสร้างวิดีโอ 16 วิ...',
  status_video_saved:                '💾 บันทึกวิดีโอแล้ว',
  status_video_saved_8s:             '💾 บันทึกวิดีโอ 8 วิแล้ว → ไป TikTok',
  status_video_saved_16s:            '💾 บันทึกวิดีโอ 16 วิแล้ว → ไป TikTok',
  status_extending_16s:              '🎞️ กำลัง Extend เป็น 16 วิ...',
  status_upload_in_progress:         '📤 กำลังอัพโหลดไป TikTok...',
  status_completed_8s:               '✅ วิดีโอ 8 วิเสร็จ',
  status_completed_16s:              '✅ วิดีโอ 16 วิเสร็จ',
  status_completed_download:         '⬇️ ดาวน์โหลดวิดีโอเสร็จ',
  status_wait_10s:                   '⏳ รอ 10 วินาที (เผื่อเน็ตช้า)...',

  // --- V2 flow statuses ---
  status_v2_image_generating:        '🖼️ [V2] กำลังสร้างรูป Template 1...',
  status_v2_image_done:              '✅ [V2] รูปเสร็จ → เริ่มสร้างวิดีโอ',
  status_v2_video_generating:        '🎬 [V2] กำลังสร้างวิดีโอ Template 2...',
  status_v2_video_saved:             '🎞️ [V2] วิดีโอเสร็จ → เริ่ม Extend',
  status_v2_extending:               '🎞️ [V2] กำลัง Extend Video...',
  status_v2_extend_done:             '✅ [V2] Extend เสร็จ → Download',

  // --- scraping statuses ---
  status_scraping_complete:          'เสร็จสิ้น! ดึงได้ {n} สินค้า',                         // covers status_scraping_done (E2)
  status_scraping_page:              'กำลังดึงหน้า {n}...',
  status_scraping_data:              'กำลังดึงข้อมูล...',                                     // covers status_fetching_data (E2)
  status_checking_page_count:        'กำลังตรวจสอบจำนวนหน้า...',                             // covers status_checking_pages (E2)
  status_scraping_all_pages:         'กำลังดึงสินค้าทุกหน้า...',                             // covers status_fetching_all_pages (E2)

  // ─── LOG / FLOW MESSAGES ─────────────────────────────────────────────────────

  log_post_success_storage:          '✅ โพสสำเร็จ! (via storage)',
  log_post_success_item:             '✅ โพสสำเร็จ: {name}',
  log_retry_new_round:               '🔄 เริ่ม Retry รอบใหม่ — ทำรายการที่ล้มเหลวซ้ำ',
  log_retry_item:                    '🔄 {name}: Retry รอบที่ {n}/{max}',
  log_retry_item_short:              '🔄 Retry {name} ({n}/{max})',
  log_clear_prompt_policy_fail:      '🗑️ {name}: ล้าง Prompt เก่า (policy fail) → สร้างใหม่',
  log_all_done:                      '🎉 ทำครบทุกสินค้าแล้ว! (สำเร็จ {posted}, ล้มเหลว {failed}, ข้าม {skipped})',
  log_remaining_count:               '📦 เหลือ {n} รายการ — ถัดไป: {name}',                  // covers log_remaining_next, log_remaining_next_item (E2)
  log_remaining_items:               '📦 เหลือสินค้าอีก ${remaining} รายการ',
  log_next_item_start:               '🚀 เริ่มรายการถัดไป: {name}',
  log_next_item_start_remaining:     '🚀 เริ่มรายการถัดไป: ${nextPending.name} (เหลือ ${remaining})',
  log_item_starting:                 '🚀 {name}: เริ่มทำงาน...',                              // covers log_item_start (E2)
  log_image_prompt_missing:          '📝 {name}: ยังไม่มี Image Prompt — จะสร้างใน processFlowItem',  // covers log_no_image_prompt (E2)
  log_step_image_done:               '✅ สร้างรูป เสร็จแล้ว!',                               // covers log_flow_step_done_image (E2)
  log_step_video_done:               '✅ สร้างวิดีโอ เสร็จแล้ว!',                            // covers log_flow_step_done_video (E2)
  log_video_done_go_tiktok:          '⏭️ {name}: Video เสร็จ → ไป TikTok Upload',            // covers log_video_done_goto_tiktok, log_video_done_next_tiktok (E2)
  log_extend_16s_in_progress:        '🎞️ {name}: Video 8 วิ เสร็จ → กำลัง Extend เป็น 16 วิ...',
  log_wait_delay:                    '⏳ รอ {n} วินาที...',                                   // covers log_delay_wait (E2)
  log_wait_5sec:                     '⏳ รอ 5 วินาที...',
  log_wait_before_next:              '⏳ รอ ${nextDelay/1000} วิ ก่อนรายการถัดไป...',
  log_flow_error:                    '❌ Google Flow ล้มเหลว: {msg}',                         // covers log_google_flow_failed (E2)
  log_resume_step:                   '🔄 Resume จาก Step {n} ({name})...',                   // covers log_resume_from_step (E2)
  log_resume_pd_style:               '🔄 [PD-Style] Resume step {n} แทน restart ทั้งหมด',
  log_item_failed:                   '⏭️ {name}: ล้มเหลว — {msg}',
  log_zoom_percent:                  '🔍 Zoom Google Flow: {n}%',
  log_run_started:                   'เริ่มรัน: คลิป {n} วิ, Delay {d} วิ, โหมด: {mode}',

  // --- scraping logs ---
  log_products_added:                'เพิ่มสินค้าใหม่ {n} รายการ',
  log_scraping_done:                 'ดึงสินค้าเสร็จสิ้น รวม {n} รายการ',
  log_scraping_page:                 '📄 เริ่มดึงสินค้าหน้า {n}',
  log_scraping_all_pages:            '📄 เริ่มดึงสินค้าทุกหน้า...',
  log_all_products_deleted:          'ลบสินค้าทั้งหมดแล้ว',                                  // covers log_deleted_all (E2)

  // --- auto-post / processFlow logs (E2) ---
  log_autopost_start:                '🚀 runAutoPost() เริ่มทำงาน',
  log_settings_clip:                 '⚙️ Settings: คลิป ${runSettings.clipDuration} วิ',
  log_reset_pending:                 '🔄 Reset สถานะสินค้าทั้งหมดเป็น pending...',
  log_processing_item:               '📦 เริ่มประมวลผล: ${pendingItem.name}',
  log_process_flow_start:            '▶️ เริ่ม processFlowItem...',
  log_no_queue:                      '⚠️ ไม่พบสินค้าในคิว',
  log_creating_image:                '🖼️ ${item.name}: เริ่มสร้างรูปภาพ...',
  log_creating_video:                '🎬 ${item.name}: กำลังสร้างวิดีโอ...',
  log_video_done:                    '✅ ${item.name}: Video เสร็จแล้ว!',
  log_extending_to_16s:              '🎞️ ${item.name}: Video 8 วิ เสร็จ — กำลัง Extend เป็น 16 วิ... (${elapsed} วิ)',
  log_waiting_video:                 '🎬 ${item.name}: รอวิดีโอ... ${elapsed} วิ',
  log_tiktok_upload_starting:        '📤 ${item.name}: กำลังเริ่ม TikTok Upload...',
  log_tiktok_upload_begin:           '📤 ${item.name}: เริ่ม TikTok Upload...',
  log_tiktok_upload_failed:          '❌ ${item.name}: TikTok Upload ล้มเหลว',
  log_waiting_tiktok_upload:         '📤 ${item.name}: รอ TikTok Upload... ${elapsed} วิ',
  log_tiktok_timeout:                '⏰ ${item.name}: TikTok Upload timeout',
  log_tiktok_done:                   '✅ ${item.name}: TikTok เสร็จแล้ว!',
  log_tiktok_post_done:              '✅ ${item.name}: โพส TikTok เสร็จสมบูรณ์!',
  log_item_flow_done:                '✅ ${item.name}: เสร็จสิ้น',
  log_item_success:                  '✅ เสร็จ: ${item.name}',
  log_item_stopped:                  '⏹️ ${item.name}: หยุดโดยผู้ใช้',
  log_stopped_by_user:               '⏹️ หยุดโดยผู้ใช้',
  log_stopped_by_user_stop:          '🛑 หยุดการทำงานโดยผู้ใช้',
  log_step_failed:                   '❌ ${item.name}: Step ล้มเหลว — ${stepError.message}',
  log_watchdog_timeout:              '⏰ Timeout 30 นาที: ${currentItem.name} — ข้ามอัตโนมัติ',
  log_no_current_item:               'ไม่มีสินค้าที่กำลังทำอยู่',
  log_skip_item:                     '⏭️ ข้ามรายการ: ${currentItem.name}',

  // --- batch generate / AI logs (E2) ---
  log_batch_generate_start:          'เริ่มสร้าง Prompts + Caption + CTA สำหรับ ${productQueue.length} สินค้า',
  log_batch_generate_done:           '✅ สร้าง Prompts + Caption + CTA เสร็จสิ้น ${completed}/${productQueue.length} สินค้า',
  log_caption_generated:             'สร้าง แคปชั่น สำเร็จ',
  log_cta_generated:                 'สร้าง CTA สำเร็จ',
  log_caption_fallback:              '⚠️ ${item.name}: Caption fallback (Auto Post)',
  log_cta_fallback:                  '⚠️ ${item.name}: CTA fallback (Auto Post)',
  log_character_added:               'เพิ่มตัวละครให้สินค้า',
  log_action_analyzing:              'กำลัง วิเคราะห์: ${item.name}',
  log_action_generating_media:       'กำลัง สร้าง Media: ${item.name}',
  log_action_policy_check:           'กำลัง ตรวจ Policy: ${item.name}',
  log_action_done_analyze:           'วิเคราะห์ เสร็จสิ้น',
  log_action_done_media:             'สร้าง Media เสร็จสิ้น',
  log_action_done_policy:            'ตรวจ Policy เสร็จสิ้น',

  // ─── SUCCESS MESSAGES ────────────────────────────────────────────────────────

  success_delete_device:             '✅ ลบอุปกรณ์สำเร็จ!',
  success_delete_self_device:        'ลบเครื่องนี้สำเร็จ! กำลังกลับไปหน้า License...',
  success_delete_device_inapp:       'ลบ Device สำเร็จ',
  success_copied:                    '✅ คัดลอกแล้ว!',
  success_applied_shared_settings:   '✅ ใช้ตั้งค่าร่วมกับ {n} สินค้า (รูป: {m}{sel})',
  success_all_done:                  'ทำครบแล้ว! สำเร็จ {posted}/{total}',

  // ─── BUTTON / ACTION ─────────────────────────────────────────────────────────

  btn_activate:                      'เปิดใช้งาน',
  btn_delete:                        '🗑️ ลบ',
  btn_delete_this_device:            '🔓 ลบเครื่องนี้',
  btn_manage_devices:                '📱 จัดการอุปกรณ์ที่ลงทะเบียน',
  btn_copy:                          '📋 คัดลอก',
  btn_copy_script:                   '📋 คัดลอก Script',
  btn_copy_prompt:                   '📋 Copy',
  btn_copy_prompt_done:              '✅ Copied',
  btn_copy_prompt_empty:             '❌ ว่าง',
  btn_zoom_100:                      '🔍 100%',
  btn_zoom_33:                       '🔍 33%',
  btn_tab_image:                     '🖼️ ภาพ',
  btn_tab_video8:                    '🎬 8 วิ',
  btn_tab_video16:                   '🎞️ 16 วิ',
  btn_open_flow:                     '🚀 Flow',
  btn_ai_generate:                   '✨ AI',
  btn_ai_analyze:                    'AI Analyze',
  btn_generate_media:                'Generate Media',
  btn_policy_check:                  'Policy Check',
  btn_generate_all_prompts:          '✨ AI สร้าง Prompts ทั้งหมด',
  btn_generate_all:                  '✨ Generate All',
  btn_generating_loading:            '⏳ กำลังสร้าง...',
  btn_generating_spinner:            'กำลังสร้าง...',
  btn_running:                       '🔄 กำลังรัน...',
  btn_run:                           'Run',

  // ─── LABELS / UI TEXT ────────────────────────────────────────────────────────

  // --- device management labels ---
  label_this_device:                 'เครื่องนี้',
  label_registered_date:             'ลงทะเบียน:',
  label_last_used:                   'ใช้ล่าสุด:',
  label_registered_date_full:        'ลงทะเบียน: ',
  label_last_used_full:              'ใช้งานล่าสุด: ',

  // --- flow step labels ---
  label_step_create_image:           '🖼️ สร้างรูปภาพ',
  label_step_frame_to_video:         '🎬 สร้างวิดีโอ',
  label_step_screen_builder:         '🎞️ ต่อคลิป',
  label_step_upload_tiktok:          '📤 อัพโหลด TikTok',                                    // covers label_v2_step_upload_tiktok
  label_step_post_tiktok:            '📱 โพสต์ TikTok',                                      // covers label_v2_step_post_tiktok
  label_duration_8s:                 '8 วินาที',
  label_duration_6s:                 '6 วินาที',
  label_duration_10s:                '10 วินาที',

  // --- V2 step labels (distinct text) ---
  label_v2_step_create_image:        '🖼️ สร้างรูป (Template 1)',
  label_v2_step_create_video:        '🎬 สร้างวิดีโอ (Template 2)',
  label_v2_step_extend_video:        '🎞️ ต่อวิดีโอ (Template 3)',

  // --- policy checker labels ---
  label_checker_header:              'ผลการตรวจสอบ Policy & คุณภาพ',
  label_risk_low:                    '✅ ความเสี่ยงต่ำ',
  label_risk_medium:                 '⚠️ ความเสี่ยงปานกลาง',
  label_risk_high:                   '❌ ความเสี่ยงสูง',
  label_risk_unknown:                '❓ ไม่ทราบ',
  label_quality_score:               '⭐ คุณภาพ: {n}/10',
  label_summary:                     'สรุป:',
  label_original_analysis:           '🔍 วิเคราะห์ต้นฉบับ',
  label_clean_script:                '✨ Script ใหม่คุณภาพสูง (พร้อมใช้)',
  label_improvements_made:           '🚀 การปรับปรุงที่ทำ',
  label_violations_count:            '❌ ประโยคที่ละเมิดนโยบาย ({n} รายการ)',
  label_quality_issues_count:        '📉 ปัญหาคุณภาพคอนเทนต์ ({n} รายการ)',
  label_tips:                        '💡 เคล็ดลับเพิ่มคุณภาพ',
  label_violation_policy:            '📋 นโยบาย',
  label_violation_low_quality:       '📉 คุณภาพต่ำ',
  label_violation_spam:              '🚫 สแปม',
  label_violation_engagement:        '🎣 Engagement Bait',
  label_severity_low:                '🟡 เล็กน้อย',
  label_severity_medium:             '🟠 ปานกลาง',
  label_severity_high:               '🔴 รุนแรง',

  // --- shared selector labels ---
  label_selector_product_category:   '🏷️ หมวดสินค้า',                                       // covers label_category_product (E2)
  label_selector_hook_category:      '🎣 ฮุคเปิดคลิป (บทพูด)',
  label_selector_art_style:          '🎨 สไตล์ภาพ',
  label_selector_background:         '🏠 พื้นหลัง',
  label_selector_video_style:        '🎬 Video Style',
  label_selector_character:          '👤 ตัวละคร',
  label_selector_dialogue_style:     '💬 สไตล์บทพูด',
  label_selector_speaking_style:     '🗣️ วิธีพูด',
  label_selector_voice_type:         '🎙️ ลักษณะเสียง',
  label_selector_script_style:       '📝 โครงสร้าง Script',

  // --- queue item category labels (E2) ---
  label_style_settings:              '🎨 ตั้งค่าสไตล์',
  label_category_image:              '📸 ภาพ',
  label_category_video:              '🎬 วิดีโอ',
  label_category_voice:              '🗣️ เสียง/บทพูด',
  label_custom_speech:               '💬 คำพูดเพิ่มเติม (เฉพาะสินค้านี้)',
  label_cta:                         'CTA (Call to Action)',
  label_no_style_selected:           'ยังไม่ได้เลือก',
  label_no_characters:               'ยังไม่มีตัวละคร',

  // --- flow progress card labels ---
  fp_badge_with_failures:            'เสร็จ ({n} ล้มเหลว)',                                  // covers status_flow_done_with_failures (E2)
  fp_badge_progress:                 '{done}/{total} รายการ',                                // covers badge_progress_count (E2)
  fp_progress_text:                  '{done} / {total} รายการ ({pct}%)',                    // covers label_progress_text (E2)
  fp_label_success:                  'สำเร็จ',                                               // covers label_status_success (E2)
  fp_label_failed:                   'ล้มเหลว',                                              // covers label_status_failed (E2)
  fp_label_skipped:                  'ข้าม',                                                 // covers label_status_skipped (E2)
  fp_label_processing:               'กำลังทำ...',                                           // covers label_status_processing (E2)
  fp_title_all_done:                 'ทำครบทุกรายการแล้ว!',                                 // covers label_all_done (E2)
  fp_title_working:                  'กำลังทำงาน... ({done}/{total})',                      // covers label_working_progress (E2)

  // --- real-time progress labels (E2) ---
  label_loading_processing:          'กำลังประมวลผล...',
  label_creating_video:              '🎬 กำลังสร้างวิดีโอ...',
  label_extending_to_16s:            '🎞️ Extend เป็น 16 วิ... ${elapsed} วิ',
  label_waiting_video:               '🎬 รอวิดีโอ... ${elapsed} วิ',
  label_waiting_tiktok_upload:       '⏳ รอ TikTok Upload... ${elapsed} วิ',
  label_done:                        '✅ เสร็จ!',
  label_post_done:                   '✅ โพสเสร็จ!',
  label_flow_step_stopped:           '🛑 หยุดโดยผู้ใช้',
  label_log_empty:                   'ยังไม่มีกิจกรรม',

  // --- schedule / misc labels ---
  label_schedule_today:              'วันนี้',                                               // covers label_today (E2)

  // ─── PLACEHOLDER TEXT ────────────────────────────────────────────────────────

  placeholder_upload_image:          '+ อัปรูป',
  placeholder_image_prompt:          'Prompt สำหรับสร้างรูปภาพ...',
  placeholder_video8_prompt:         'Prompt สำหรับวิดีโอ 8 วินาที...',
  placeholder_video16_prompt:        'Prompt สำหรับวิดีโอ 16 วินาที...',
  placeholder_custom_speech:         'เช่น สวยปังมากแม่, ผิวเด้งมาก, ต้องลอง!',
  placeholder_caption:               'ใส่แคปชั่นสำหรับโพสต์...',
  placeholder_cta:                   'เช่น: กดซื้อเลย!, กดตะกร้าได้เลย',

  // ─── MSG / INFO ──────────────────────────────────────────────────────────────

  msg_cannot_load:                   'ไม่สามารถโหลดได้',
  msg_no_devices_registered:         'ไม่มีอุปกรณ์ที่ลงทะเบียนกับ License นี้',
  msg_device_count_found:            '📱 พบ {n}/2 อุปกรณ์ที่ลงทะเบียน',
  msg_no_devices_yet:                'ยังไม่มี Device ลงทะเบียน',
  msg_no_violations:                 '✅ ไม่พบปัญหานโยบายหรือคุณภาพ - พร้อมโพสต์!',
  msg_no_products_yet:               'ยังไม่มีสินค้า',                                       // covers label_no_products (E2)
  msg_cannot_analyze:                'ไม่สามารถวิเคราะห์ผลลัพธ์ได้',
  msg_selector_count_suffix:         'Selector: {n} ค่า',
  msg_schedule_more_items:           '... (+{n} รายการ)',                                    // covers label_more_items (E2)
  msg_skipped_by_user:               'ข้ามรายการนี้',

  // ─── WARNING MESSAGES ────────────────────────────────────────────────────────

  warning_no_flow_tab:               '⚠️ ไม่พบ Tab Google Flow - กรุณาเปิด Google Flow ก่อน',
  warning_hookid_mismatch:           '⚠️ hookId ไม่ตรงกัน: เนื้อหา={a} วิดีโอ={b} → ใช้ค่าจากวิดีโอ',
  warning_no_processing_item:        '⚠️ ไม่พบสินค้าที่กำลังทำอยู่',
  warning_no_processing_item2:       '⚠️ ไม่พบรายการที่กำลังประมวลผล — ลองหารายการถัดไป',   // covers log_no_processing_item (E2)

  // ─── CONFIRM DIALOGS ─────────────────────────────────────────────────────────

  confirm_delete_self_device:        '⚠️ คุณกำลังจะลบ "เครื่องนี้" ออกจาก License\n\nหลังจากลบแล้ว คุณสามารถกด "เปิดใช้งาน" เพื่อลงทะเบียนใหม่ได้ทันที\n\nยืนยันหรือไม่?',
  confirm_delete_other_device:       '🗑️ ต้องการลบอุปกรณ์นี้ออกจาก License หรือไม่?\n\nอุปกรณ์ที่ถูกลบจะต้องลงทะเบียนใหม่',
  confirm_delete_self_inapp:         '⚠️ คุณกำลังจะลบเครื่องนี้ออกจาก License\n\nหลังจากลบแล้ว คุณจะต้องใส่ License Key ใหม่เพื่อเข้าใช้งานอีกครั้ง\n\nยืนยันหรือไม่?',
  confirm_delete_device_inapp:       'ต้องการลบ Device นี้หรือไม่?',
  confirm_delete_all_products:       'ต้องการลบสินค้าทั้งหมด {n} รายการ?',                  // covers confirm_delete_all (E2)

  // ─── HINT TEXT ───────────────────────────────────────────────────────────────

  hint_press_run:                    'กด Run เพื่อดึงสินค้าจาก TikTok',                      // covers hint_press_run_to_fetch (E2)
  hint_press_fetch_button:           'กด "ดึงสินค้า" เพื่อดึงจาก TikTok',

  // ─── TOOLTIP ─────────────────────────────────────────────────────────────────

  tooltip_zoom_restore:              'คืนขนาด Google Flow เป็น 100%',
  tooltip_zoom_shrink:               'ย่อขนาด Google Flow เหลือ 33%',

  // ─── ALERT ───────────────────────────────────────────────────────────────────

  alert_product_details:             'สินค้า: ${item.name}\nID: ${item.productId || item.id}\nราคา: ${item.price || "-"}\nURL: ${item.url || "-"}',

  // ─── OPTION / SELECT ─────────────────────────────────────────────────────────

  option_no_change:                  '— ไม่เปลี่ยน —',

};
