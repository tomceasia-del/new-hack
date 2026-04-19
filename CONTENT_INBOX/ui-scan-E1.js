// UI Scan E1 — sidepanel.js lines 1–3200
// Format: key (generated from Thai/English meaning) : string value
// Extracted: all user-facing Thai strings + short English UI strings
// Source: /1click-full-v3.40 (2)/js/sidepanel.js

export const UI_SCAN_E1 = {

  // ─────────────────────────────────────────────
  // section: lines 1–200 — License System
  // ─────────────────────────────────────────────

  // --- device ID display ---
  msg_cannot_load:               'ไม่สามารถโหลดได้',                          // line 58

  // --- license error / success ---
  error_please_enter_license:    'กรุณาใส่ License Key',                        // line 142
  error_generic_with_msg:        'เกิดข้อผิดพลาด: ',                           // line 166
  btn_activate:                  'เปิดใช้งาน',                                  // line 296

  // ─────────────────────────────────────────────
  // section: lines 175–280 — Manage Devices (Login Screen)
  // ─────────────────────────────────────────────

  // --- validation ---
  error_fill_license_first:      '❌ กรุณากรอก License Key ให้ครบก่อน',          // line 185

  // --- loading state ---
  status_loading:                '⏳ กำลังโหลด...',                             // line 191

  // --- device list ---
  msg_no_devices_registered:     'ไม่มีอุปกรณ์ที่ลงทะเบียนกับ License นี้',       // line 203
  label_this_device:             'เครื่องนี้',                                   // line 216 / 341
  label_registered_date:         'ลงทะเบียน:',                                  // line 218
  label_last_used:               'ใช้ล่าสุด:',                                  // line 218
  btn_delete:                    '🗑️ ลบ',                                       // line 221
  msg_device_count_found:        '📱 พบ {n}/2 อุปกรณ์ที่ลงทะเบียน',             // line 237  (template — {n} = count)
  error_cannot_load_devices:     '❌ ไม่สามารถโหลดรายชื่ออุปกรณ์ได้: ',           // line 241
  btn_manage_devices:            '📱 จัดการอุปกรณ์ที่ลงทะเบียน',                 // line 245

  // --- delete device confirm (login screen) ---
  confirm_delete_self_device:    '⚠️ คุณกำลังจะลบ "เครื่องนี้" ออกจาก License\n\nหลังจากลบแล้ว คุณสามารถกด "เปิดใช้งาน" เพื่อลงทะเบียนใหม่ได้ทันที\n\nยืนยันหรือไม่?',  // line 253
  confirm_delete_other_device:   '🗑️ ต้องการลบอุปกรณ์นี้ออกจาก License หรือไม่?\n\nอุปกรณ์ที่ถูกลบจะต้องลงทะเบียนใหม่',                                              // line 254
  success_delete_device:         '✅ ลบอุปกรณ์สำเร็จ!',                         // line 267
  error_cannot_delete_device:    '❌ ไม่สามารถลบอุปกรณ์ได้',                     // line 272
  error_delete_device_failed:    '❌ เกิดข้อผิดพลาด: ',                          // line 275

  // ─────────────────────────────────────────────
  // section: lines 310–395 — Device Management (in-app)
  // ─────────────────────────────────────────────

  status_device_loading:         'กำลังโหลด...',                                // line 318  (innerHTML <p>)
  msg_no_devices_yet:            'ยังไม่มี Device ลงทะเบียน',                    // line 328  (innerHTML <p>)
  label_registered_date_full:    'ลงทะเบียน: ',                                 // line 336
  label_last_used_full:          'ใช้งานล่าสุด: ',                              // line 336
  btn_delete_this_device:        '🔓 ลบเครื่องนี้',                             // line 345
  error_load_devices_failed:     'เกิดข้อผิดพลาดในการโหลด',                      // line 353  (innerHTML <p>)

  // --- delete device confirm (in-app) ---
  confirm_delete_self_inapp:     '⚠️ คุณกำลังจะลบเครื่องนี้ออกจาก License\n\nหลังจากลบแล้ว คุณจะต้องใส่ License Key ใหม่เพื่อเข้าใช้งานอีกครั้ง\n\nยืนยันหรือไม่?', // line 359
  confirm_delete_device_inapp:   'ต้องการลบ Device นี้หรือไม่?',                // line 360
  success_delete_self_device:    'ลบเครื่องนี้สำเร็จ! กำลังกลับไปหน้า License...', // line 370
  success_delete_device_inapp:   'ลบ Device สำเร็จ',                            // line 375

  // --- check devices ---
  error_enter_license_first:     'กรุณาใส่ License Key ก่อน',                   // line 389

  // ─────────────────────────────────────────────
  // section: lines 415–468 — Profile Status
  // ─────────────────────────────────────────────

  status_no_license:             'ไม่มี License',                               // line 426
  status_invalid_license:        'License ไม่ถูกต้อง',                          // line 436
  status_unlimited:              '♾️ ไม่จำกัด',                                 // line 444
  status_expired:                '❌ หมดอายุ',                                   // line 452
  status_expiring_days:          '⚠️ เหลือ {n} วัน',                            // line 455  (template — {n} = daysLeft)
  status_valid_days:             '✅ เหลือ {n} วัน',                            // line 458  (template — {n} = daysLeft)
  status_unlimited_fallback:     'ไม่จำกัด',                                    // line 465

  // ─────────────────────────────────────────────
  // section: lines 532–574 — Flow Step Labels
  // ─────────────────────────────────────────────

  // --- FLOW_STEP_LABELS ---
  label_step_create_image:       '🖼️ สร้างรูปภาพ',                             // line 533
  label_step_frame_to_video:     '🎬 สร้างวิดีโอ',                              // line 534
  label_step_screen_builder:     '🎞️ ต่อคลิป',                                 // line 535
  label_step_upload_tiktok:      '📤 อัพโหลด TikTok',                           // line 536
  label_step_post_tiktok:        '📱 โพสต์ TikTok',                             // line 537

  // --- MODE_DATA durations ---
  label_duration_8s:             '8 วินาที',                                    // line 546
  label_duration_6s:             '6 วินาที',                                    // line 547
  label_duration_10s:            '10 วินาที',                                   // line 548

  // --- V2_FLOW_STEP_LABELS ---
  label_v2_step_create_image:    '🖼️ สร้างรูป (Template 1)',                    // line 569
  label_v2_step_create_video:    '🎬 สร้างวิดีโอ (Template 2)',                 // line 570
  label_v2_step_extend_video:    '🎞️ ต่อวิดีโอ (Template 3)',                   // line 571
  label_v2_step_upload_tiktok:   '📤 อัพโหลด TikTok',                           // line 572  (same as above, separate context)
  label_v2_step_post_tiktok:     '📱 โพสต์ TikTok',                             // line 573

  // ─────────────────────────────────────────────
  // section: lines 974–985 — Product Status Labels
  // ─────────────────────────────────────────────

  // --- PRODUCT_STATUS ---
  status_pending:                'รอดำเนินการ',                                  // line 976
  status_analyzing:              'กำลังวิเคราะห์',                              // line 977
  status_generating:             'กำลังสร้าง',                                  // line 978
  status_processing:             '🔄 กำลังทำ',                                  // line 979
  status_completed:              'เสร็จสิ้น',                                   // line 980
  status_posted_ok:              '✅ สำเร็จ',                                   // line 981
  status_failed:                 '❌ ล้มเหลว',                                  // line 982
  status_skipped:                '⏭️ ข้าม',                                     // line 983
  status_error:                  'ผิดพลาด',                                     // line 984

  // ─────────────────────────────────────────────
  // section: lines 1737–1874 — Prompt Checker UI (formatCheckerResult)
  // ─────────────────────────────────────────────

  // --- checker result header ---
  label_checker_header:          'ผลการตรวจสอบ Policy & คุณภาพ',               // line 1759

  // --- risk labels ---
  label_risk_low:                '✅ ความเสี่ยงต่ำ',                            // line 1747
  label_risk_medium:             '⚠️ ความเสี่ยงปานกลาง',                       // line 1748
  label_risk_high:               '❌ ความเสี่ยงสูง',                            // line 1749
  label_risk_unknown:            '❓ ไม่ทราบ',                                  // line 1750

  // --- quality badge ---
  label_quality_score:           '⭐ คุณภาพ: {n}/10',                           // line 1765  (template)

  // --- section headings ---
  label_summary:                 'สรุป:',                                       // line 1771
  label_original_analysis:       '🔍 วิเคราะห์ต้นฉบับ',                        // line 1776
  label_clean_script:            '✨ Script ใหม่คุณภาพสูง (พร้อมใช้)',          // line 1781
  btn_copy_script:               '📋 คัดลอก Script',                            // line 1784
  label_improvements_made:       '🚀 การปรับปรุงที่ทำ',                         // line 1791
  label_violations_count:        '❌ ประโยคที่ละเมิดนโยบาย ({n} รายการ)',        // line 1800  (template)
  label_quality_issues_count:    '📉 ปัญหาคุณภาพคอนเทนต์ ({n} รายการ)',          // line 1818  (template)
  msg_no_violations:             '✅ ไม่พบปัญหานโยบายหรือคุณภาพ - พร้อมโพสต์!', // line 1836
  label_tips:                    '💡 เคล็ดลับเพิ่มคุณภาพ',                      // line 1844

  // --- violation type labels ---
  label_violation_policy:        '📋 นโยบาย',                                   // line 1858
  label_violation_low_quality:   '📉 คุณภาพต่ำ',                               // line 1859
  label_violation_spam:          '🚫 สแปม',                                     // line 1860
  label_violation_engagement:    '🎣 Engagement Bait',                          // line 1861

  // --- severity labels ---
  label_severity_low:            '🟡 เล็กน้อย',                                // line 1869
  label_severity_medium:         '🟠 ปานกลาง',                                 // line 1870
  label_severity_high:           '🔴 รุนแรง',                                  // line 1871

  // --- copy result feedback ---
  success_copied:                '✅ คัดลอกแล้ว!',                              // line 1882
  error_cannot_copy:             'ไม่สามารถคัดลอกได้',                          // line 1890

  // ─────────────────────────────────────────────
  // section: lines 2002–2210 — Shared Settings + Selectors
  // ─────────────────────────────────────────────

  // --- shared character image upload ---
  placeholder_upload_image:      '+ อัปรูป',                                    // line 2041  (innerHTML span)

  // --- selector dropdown placeholder ---
  option_no_change:              '— ไม่เปลี่ยน —',                             // line 2180

  // --- shared selector section labels ---
  label_selector_product_category: '🏷️ หมวดสินค้า',                            // line 2160
  label_selector_hook_category:    '🎣 ฮุคเปิดคลิป (บทพูด)',                    // line 2161
  label_selector_art_style:        '🎨 สไตล์ภาพ',                              // line 2162
  label_selector_background:       '🏠 พื้นหลัง',                              // line 2163
  label_selector_video_style:      '🎬 Video Style',                            // line 2164
  label_selector_character:        '👤 ตัวละคร',                               // line 2165
  label_selector_dialogue_style:   '💬 สไตล์บทพูด',                            // line 2166
  label_selector_speaking_style:   '🗣️ วิธีพูด',                               // line 2167
  label_selector_voice_type:       '🎙️ ลักษณะเสียง',                           // line 2168
  label_selector_script_style:     '📝 โครงสร้าง Script',                      // line 2169

  // --- apply shared settings feedback ---
  success_applied_shared_settings: '✅ ใช้ตั้งค่าร่วมกับ {n} สินค้า (รูป: {m}{sel})', // line 2109  (template)

  // ─────────────────────────────────────────────
  // section: lines 2352–2392 — Google Flow Zoom Toggle
  // ─────────────────────────────────────────────

  btn_zoom_100:                  '🔍 100%',                                     // line 2363
  btn_zoom_33:                   '🔍 33%',                                      // line 2367
  tooltip_zoom_restore:          'คืนขนาด Google Flow เป็น 100%',               // line 2365  (title attr)
  tooltip_zoom_shrink:           'ย่อขนาด Google Flow เหลือ 33%',               // line 2369  (title attr)
  log_zoom_percent:              '🔍 Zoom Google Flow: {n}%',                   // line 2384  (addLog — template)
  warning_no_flow_tab:           '⚠️ ไม่พบ Tab Google Flow - กรุณาเปิด Google Flow ก่อน', // line 2386  (addLog)
  error_zoom_failed:             '❌ ส่งคำสั่ง Zoom ไม่สำเร็จ',                  // line 2390  (addLog)

  // ─────────────────────────────────────────────
  // section: lines 2394–2600 — Message Listener / Flow Status Map
  // ─────────────────────────────────────────────

  // --- flowStatus step messages ---
  status_waiting_flow:           '🌐 รอ Google Flow...',                        // line 2439
  status_image_generating:       '🖼️ กำลังสร้างรูปภาพ...',                     // line 2440
  status_image_done:             '✅ สร้างรูปเสร็จ → เริ่มสร้างวิดีโอ',         // line 2441
  status_video_generating_8s:    '🎬 กำลังสร้างวิดีโอ 8 วิ...',                // line 2442
  status_video_saved:            '💾 บันทึกวิดีโอแล้ว',                         // line 2443
  status_video_saved_8s:         '💾 บันทึกวิดีโอ 8 วิแล้ว → ไป TikTok',       // line 2444
  status_video_saved_16s:        '💾 บันทึกวิดีโอ 16 วิแล้ว → ไป TikTok',      // line 2445
  status_video_generating_16s:   '🎞️ กำลังสร้างวิดีโอ 16 วิ...',               // line 2446
  status_upload_in_progress:     '📤 กำลังอัพโหลดไป TikTok...',                // line 2447
  status_completed_8s:           '✅ วิดีโอ 8 วิเสร็จ',                        // line 2448
  status_completed_16s:          '✅ วิดีโอ 16 วิเสร็จ',                       // line 2449
  status_completed_download:     '⬇️ ดาวน์โหลดวิดีโอเสร็จ',                   // line 2450
  status_v2_image_generating:    '🖼️ [V2] กำลังสร้างรูป Template 1...',        // line 2451
  status_v2_image_done:          '✅ [V2] รูปเสร็จ → เริ่มสร้างวิดีโอ',        // line 2452
  status_v2_video_generating:    '🎬 [V2] กำลังสร้างวิดีโอ Template 2...',     // line 2453
  status_v2_video_saved:         '🎞️ [V2] วิดีโอเสร็จ → เริ่ม Extend',        // line 2454
  status_v2_extending:           '🎞️ [V2] กำลัง Extend Video...',              // line 2455
  status_v2_extend_done:         '✅ [V2] Extend เสร็จ → Download',            // line 2456

  // --- storage listener log ---
  log_post_success_storage:      '✅ โพสสำเร็จ! (via storage)',                 // line 2419  (addLog)

  // ─────────────────────────────────────────────
  // section: lines 2330–2350 — Copy Button
  // ─────────────────────────────────────────────

  btn_copy:                      '📋 คัดลอก',                                   // line 2337

  // ─────────────────────────────────────────────
  // section: lines 2687–2779 — handleItemPostedComplete
  // ─────────────────────────────────────────────

  log_post_success_item:         '✅ โพสสำเร็จ: {name}',                        // line 2711  (addLog — template)
  log_remaining_count:           '📦 เหลือ {n} รายการ — ถัดไป: {name}',         // line 2729  (addFlowLog — template)
  status_wait_10s:               '⏳ รอ 10 วินาที (เผื่อเน็ตช้า)...',           // line 2730  (updateFlowStep)
  log_retry_new_round:           '🔄 เริ่ม Retry รอบใหม่ — ทำรายการที่ล้มเหลวซ้ำ', // line 2732 / 2751 / 2807  (addLog)
  log_next_item_start:           '🚀 เริ่มรายการถัดไป: {name}',                 // line 2749  (addLog — template)
  log_all_done:                  '🎉 ทำครบทุกสินค้าแล้ว! (สำเร็จ {posted}, ล้มเหลว {failed}, ข้าม {skipped})', // line 2757 / 2768 / 2818  (addLog — template)
  success_all_done:              'ทำครบแล้ว! สำเร็จ {posted}/{total}',           // line 2758 / 2769 / 3023  (showSuccess — template)
  warning_no_processing_item:    '⚠️ ไม่พบสินค้าที่กำลังทำอยู่',                // line 2775  (addLog)

  // ─────────────────────────────────────────────
  // section: lines 2786–2870 — startNextItemFlow
  // ─────────────────────────────────────────────

  log_item_starting:             '🚀 {name}: เริ่มทำงาน...',                   // line 2825 / 2848  (addFlowLog — template)
  log_image_prompt_missing:      '📝 {name}: ยังไม่มี Image Prompt — จะสร้างใน processFlowItem', // line 2842  (addFlowLog — template)
  status_starting_image:         '🖼️ เริ่มสร้างรูปภาพ...',                     // line 2852  (updateFlowStep)

  // ─────────────────────────────────────────────
  // section: lines 2872–2920 — handleFlowStepCompleted
  // ─────────────────────────────────────────────

  log_step_image_done:           '✅ สร้างรูป เสร็จแล้ว!',                     // line 2877  (addFlowLog — image mode)
  log_step_video_done:           '✅ สร้างวิดีโอ เสร็จแล้ว!',                  // line 2877  (addFlowLog — video mode)
  log_video_done_go_tiktok:      '⏭️ {name}: Video เสร็จ → ไป TikTok Upload',  // line 2896 / 2490  (addFlowLog — template)
  log_extend_16s_in_progress:    '🎞️ {name}: Video 8 วิ เสร็จ → กำลัง Extend เป็น 16 วิ...', // line 2482  (addFlowLog — template)
  status_extending_16s:          '🎞️ กำลัง Extend เป็น 16 วิ...',             // line 2483  (updateFlowStep)
  log_wait_delay:                '⏳ รอ {n} วินาที...',                         // line 2917  (addFlowLog — template)

  // ─────────────────────────────────────────────
  // section: lines 2922–3035 — handleFlowStepFailed
  // ─────────────────────────────────────────────

  log_flow_error:                '❌ Google Flow ล้มเหลว: {msg}',               // line 2935  (addFlowLog — template)
  log_resume_step:               '🔄 Resume จาก Step {n} ({name})...',          // line 2948  (addFlowLog — template)
  log_item_failed:               '⏭️ {name}: ล้มเหลว — {msg}',                 // line 2967  (addFlowLog — template)
  warning_no_processing_item2:   '⚠️ ไม่พบรายการที่กำลังประมวลผล — ลองหารายการถัดไป', // line 2973  (addLog)
  error_handle_flow_error:       '❌ Error ใน handleFlowStepFailed: {msg}',     // line 3031  (addLog — template)

  // ─────────────────────────────────────────────
  // section: lines 3087–3152 — Products Update / Scraping Complete
  // ─────────────────────────────────────────────

  log_products_added:            'เพิ่มสินค้าใหม่ {n} รายการ',                 // line 3111  (addLog — template)
  log_scraping_done:             'ดึงสินค้าเสร็จสิ้น รวม {n} รายการ',          // line 3146  (addLog — template)
  status_scraping_complete:      'เสร็จสิ้น! ดึงได้ {n} สินค้า',               // line 3150  (updateScraperStatus message — template)

  // ─────────────────────────────────────────────
  // section: lines 3154–3230 — startScraping (single page)
  // ─────────────────────────────────────────────

  error_open_tiktok_first_single:  'กรุณาเปิดหน้า TikTok ก่อนกด "ดึงสินค้า"',  // line 3160  (showError)
  status_scraping_page:            'กำลังดึงหน้า {n}...',                       // line 3170  (updateScraperStatus — template)
  log_scraping_page:               '📄 เริ่มดึงสินค้าหน้า {n}',                 // line 3173  (addLog — template)
  status_scraping_data:            'กำลังดึงข้อมูล...',                         // line 3211  (updateScraperStatus)
  error_cannot_connect_refresh:    'ไม่สามารถเชื่อมต่อได้ กรุณารีเฟรชหน้า TikTok แล้วลองใหม่', // line 3215  (showError)
  status_connect_failed:           'เชื่อมต่อไม่สำเร็จ',                        // line 3218  (updateScraperStatus)
  error_generic_scrape:            'เกิดข้อผิดพลาด: ',                          // line 3224  (showError)

  // ─────────────────────────────────────────────
  // section: lines 3232–3298 — startScrapingAll (all pages)
  // ─────────────────────────────────────────────

  error_open_tiktok_first_all:   'กรุณาเปิดหน้า TikTok ก่อนกด "ดึงทุกหน้า"',  // line 3238  (showError)
  status_checking_page_count:    'กำลังตรวจสอบจำนวนหน้า...',                   // line 3244  (updateScraperStatus)
  log_scraping_all_pages:        '📄 เริ่มดึงสินค้าทุกหน้า...',                 // line 3247  (addLog)
  status_scraping_all_pages:     'กำลังดึงสินค้าทุกหน้า...',                   // line 3279  (updateScraperStatus)

  // ─────────────────────────────────────────────
  // section: lines 3300–3361 — stopScraping / clearAllProducts
  // ─────────────────────────────────────────────

  status_stopped_by_user:        'หยุดโดยผู้ใช้',                              // line 3314  (updateScraperStatus)
  confirm_delete_all_products:   'ต้องการลบสินค้าทั้งหมด {n} รายการ?',         // line 3351  (confirm — template)
  log_all_products_deleted:      'ลบสินค้าทั้งหมดแล้ว',                        // line 3359  (addLog)

  // ─────────────────────────────────────────────
  // section: lines 3363–3532 — Flow Progress Card
  // ─────────────────────────────────────────────

  // --- badge states ---
  fp_badge_completed:            'เสร็จสิ้น',                                   // line 3475  (textContent)
  fp_badge_with_failures:        'เสร็จ ({n} ล้มเหลว)',                         // line 3478  (textContent — template)
  fp_badge_progress:             '{done}/{total} รายการ',                       // line 3481  (textContent — template)

  // --- progress text ---
  fp_progress_text:              '{done} / {total} รายการ ({pct}%)',             // line 3497  (textContent — template)

  // --- item log labels ---
  fp_label_success:              'สำเร็จ',                                      // line 3514
  fp_label_failed:               'ล้มเหลว',                                     // line 3514
  fp_label_skipped:              'ข้าม',                                        // line 3514
  fp_label_processing:           'กำลังทำ...',                                  // line 3514

  // --- card title ---
  fp_title_all_done:             'ทำครบทุกรายการแล้ว!',                         // line 3527  (textContent)
  fp_title_working:              'กำลังทำงาน... ({done}/{total})',               // line 3529  (textContent — template)

  // ─────────────────────────────────────────────
  // section: lines 3534–3644 — Run Settings Modal / confirmAndRun
  // ─────────────────────────────────────────────

  error_no_products_in_queue:    'ไม่มีสินค้าในคิว',                            // line 3569  (showError)
  log_run_started:               'เริ่มรัน: คลิป {n} วิ, Delay {d} วิ, โหมด: {mode}', // line 3634  (addLog — template)

  // ─────────────────────────────────────────────
  // section: lines 3646–3685 — Product List (empty state)
  // ─────────────────────────────────────────────

  msg_no_products_yet:           'ยังไม่มีสินค้า',                              // line 3655  (innerHTML)
  hint_press_run:                'กด Run เพื่อดึงสินค้าจาก TikTok',             // line 3656  (innerHTML)

  // ─────────────────────────────────────────────
  // section: lines 2659–2670 — retryFailedItems
  // ─────────────────────────────────────────────

  log_clear_prompt_policy_fail:  '🗑️ {name}: ล้าง Prompt เก่า (policy fail) → สร้างใหม่', // line 2662  (addFlowLog — template)
  log_retry_item:                '🔄 {name}: Retry รอบที่ {n}/{max}',           // line 2665  (addFlowLog — template)
  log_retry_item_short:          '🔄 Retry {name} ({n}/{max})',                  // line 2666  (addLog — template)

  // ─────────────────────────────────────────────
  // section: lines 1310–1312 — reconcileAutopostHookId
  // ─────────────────────────────────────────────

  warning_hookid_mismatch:       '⚠️ hookId ไม่ตรงกัน: เนื้อหา={a} วิดีโอ={b} → ใช้ค่าจากวิดีโอ', // line 1310  (addFlowLog — template)

  // ─────────────────────────────────────────────
  // section: lines 1732–1734 — parseCheckerResponse fallback
  // ─────────────────────────────────────────────

  msg_cannot_analyze:            'ไม่สามารถวิเคราะห์ผลลัพธ์ได้',               // line 1732  (JSON fallback summary)

  // ─────────────────────────────────────────────
  // section: lines 2108 — selector count suffix
  // ─────────────────────────────────────────────

  msg_selector_count_suffix:     'Selector: {n} ค่า',                           // line 2108  (addLog suffix — template)

  // ─────────────────────────────────────────────
  // section: lines 3560–3564 — Schedule Preview
  // ─────────────────────────────────────────────

  label_schedule_today:          'วันนี้',                                      // line 3560  (schedule preview date label)
  msg_schedule_more_items:       '... (+{n} รายการ)',                            // line 3563  (schedule preview overflow — template)

  // ─────────────────────────────────────────────
  // section: misc addLog flow messages (scattered, lines 2386–3031)
  // ─────────────────────────────────────────────

  log_resume_pd_style:           '🔄 [PD-Style] Resume step {n} แทน restart ทั้งหมด', // line 2949  (addLog — template)

};
