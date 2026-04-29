// UI Scan E2 — sidepanel.js lines 2800–6200
export const UI_SCAN_E2 = {

  // ─── Log / Flow Messages ───────────────────────────────────────────────────

  log_retry_new_round: '🔄 เริ่ม Retry รอบใหม่ — ทำรายการที่ล้มเหลวซ้ำ',  // line 2807
  log_all_done: '🎉 ทำครบทุกสินค้าแล้ว! (สำเร็จ ${stats.posted}, ล้มเหลว ${stats.failed}, ข้าม ${stats.skipped})',  // line 2818
  log_item_start: '🚀 ${nextItem.name}: เริ่มทำงาน...',  // line 2825
  log_no_image_prompt: '📝 ${nextItem.name}: ยังไม่มี Image Prompt — จะสร้างใน processFlowItem',  // line 2842
  log_update_flow_step_image: '🖼️ เริ่มสร้างรูปภาพ...',  // line 2852 (updateFlowStep)
  log_flow_step_done_image: '✅ สร้างรูป เสร็จแล้ว!',  // line 2877
  log_flow_step_done_video: '✅ สร้างวิดีโอ เสร็จแล้ว!',  // line 2877
  log_video_done_goto_tiktok: '⏭️ ${item.name}: Video เสร็จ → ไป TikTok Upload',  // line 2896
  log_delay_wait: '⏳ รอ ${runSettings.delaySeconds} วินาที...',  // line 2917
  log_google_flow_failed: '❌ Google Flow ล้มเหลว: ${errorMsg}',  // line 2935
  log_resume_from_step: '🔄 Resume จาก Step ${failedStep} (${currentItem.name})...',  // line 2948
  log_resume_pd_style: '🔄 [PD-Style] Resume step ${failedStep} แทน restart ทั้งหมด',  // line 2949
  log_item_failed: '⏭️ ${currentItem.name}: ล้มเหลว — ${errorMsg}',  // line 2967
  log_no_processing_item: '⚠️ ไม่พบรายการที่กำลังประมวลผล — ลองหารายการถัดไป',  // line 2973
  log_remaining_next: '📦 เหลือ ${remaining} รายการ — ถัดไป: ${nextItem.name}',  // line 2984
  log_wait_5sec: '⏳ รอ 5 วินาที...',  // line 2985
  log_error_in_handler: '❌ Error ใน handleFlowStepFailed: ${e.message}',  // line 3031

  // ─── Products / Queue / Scraping ─────────────────────────────────────────

  log_products_added: 'เพิ่มสินค้าใหม่ ${newProducts.length} รายการ',  // line 3111
  log_scraping_done: 'ดึงสินค้าเสร็จสิ้น รวม ${productQueue.length} รายการ',  // line 3146
  status_scraping_done: 'เสร็จสิ้น! ดึงได้ ${productQueue.length} สินค้า',  // line 3150
  error_open_tiktok_first_single: 'กรุณาเปิดหน้า TikTok ก่อนกด "ดึงสินค้า"',  // line 3160
  status_scraping_page: 'กำลังดึงหน้า ${targetPage}...',  // line 3171
  log_scraping_page: '📄 เริ่มดึงสินค้าหน้า ${targetPage}',  // line 3173
  status_fetching_data: 'กำลังดึงข้อมูล...',  // line 3209 / 3211
  error_connect_failed: 'ไม่สามารถเชื่อมต่อได้ กรุณารีเฟรชหน้า TikTok แล้วลองใหม่',  // line 3215
  status_connect_failed: 'เชื่อมต่อไม่สำเร็จ',  // line 3218
  error_generic: 'เกิดข้อผิดพลาด: ${error.message}',  // line 3224
  error_open_tiktok_first_all: 'กรุณาเปิดหน้า TikTok ก่อนกด "ดึงทุกหน้า"',  // line 3237
  status_checking_pages: 'กำลังตรวจสอบจำนวนหน้า...',  // line 3244
  log_scraping_all_pages: '📄 เริ่มดึงสินค้าทุกหน้า...',  // line 3247
  status_fetching_all_pages: 'กำลังดึงสินค้าทุกหน้า...',  // line 3279
  status_stopped_by_user: 'หยุดโดยผู้ใช้',  // line 3314
  confirm_delete_all: 'ต้องการลบสินค้าทั้งหมด ${productQueue.length} รายการ?',  // line 3351
  log_deleted_all: 'ลบสินค้าทั้งหมดแล้ว',  // line 3359

  // ─── Flow Progress Card / Badges ─────────────────────────────────────────

  status_flow_complete: 'เสร็จสิ้น',  // line 3459 / 3475
  status_flow_done_with_failures: 'เสร็จ (${flowStats.failed} ล้มเหลว)',  // line 3478
  badge_progress_count: '${done}/${flowStats.total} รายการ',  // line 3481
  label_progress_text: '${done} / ${flowStats.total} รายการ (${pct}%)',  // line 3497
  label_status_success: 'สำเร็จ',  // line 3514
  label_status_failed: 'ล้มเหลว',  // line 3514
  label_status_skipped: 'ข้าม',  // line 3514
  label_status_processing: 'กำลังทำ...',  // line 3514
  label_all_done: 'ทำครบทุกรายการแล้ว!',  // line 3527
  label_working_progress: 'กำลังทำงาน... (${done}/${flowStats.total})',  // line 3529
  label_more_items: '... (+${productQueue.length - 5} รายการ)',  // line 3563
  label_today: 'วันนี้',  // line 3560

  // ─── Run Settings / Modals ────────────────────────────────────────────────

  error_no_products_in_queue: 'ไม่มีสินค้าในคิว',  // line 3569
  log_run_started: 'เริ่มรัน: คลิป ${runSettings.clipDuration} วิ, Delay ${runSettings.delaySeconds} วิ, โหมด: ${modeLabel}',  // line 3634

  // ─── Product List / Queue Empty States ───────────────────────────────────

  label_no_products: 'ยังไม่มีสินค้า',  // line 3656 / 3814
  hint_press_run_to_fetch: 'กด Run เพื่อดึงสินค้าจาก TikTok',  // line 3657
  hint_press_fetch_button: 'กด "ดึงสินค้า" เพื่อดึงจาก TikTok',  // line 3815
  label_no_characters: 'ยังไม่มีตัวละคร',  // line 3747

  // ─── Queue Item Prompt Tabs & Buttons ────────────────────────────────────

  btn_tab_image: '🖼️ ภาพ',  // line 3862
  btn_tab_video8: '🎬 8 วิ',  // line 3863
  btn_tab_video16: '🎞️ 16 วิ',  // line 3864
  placeholder_image_prompt: 'Prompt สำหรับสร้างรูปภาพ...',  // line 3868
  placeholder_video8_prompt: 'Prompt สำหรับวิดีโอ 8 วินาที...',  // line 3869
  placeholder_video16_prompt: 'Prompt สำหรับวิดีโอ 16 วินาที...',  // line 3870
  btn_copy_prompt: '📋 Copy',  // line 3874
  btn_open_flow: '🚀 Flow',  // line 3875
  btn_copy_prompt_done: '✅ Copied',  // line 4050
  btn_copy_prompt_empty: '❌ ว่าง',  // line 4053

  // ─── Selector / Style Labels ──────────────────────────────────────────────

  label_style_settings: '🎨 ตั้งค่าสไตล์',  // line 3880
  label_category_product: '🏷️ หมวดสินค้า',  // line 3883
  label_category_image: '📸 ภาพ',  // line 3887
  label_category_video: '🎬 วิดีโอ',  // line 3891
  label_category_voice: '🗣️ เสียง/บทพูด',  // line 3897
  label_custom_speech: '💬 คำพูดเพิ่มเติม (เฉพาะสินค้านี้)',  // line 3908
  placeholder_custom_speech: 'เช่น สวยปังมากแม่, ผิวเด้งมาก, ต้องลอง!',  // line 3909
  placeholder_caption: 'ใส่แคปชั่นสำหรับโพสต์...',  // line 3931
  label_cta: 'CTA (Call to Action)',  // line 3935
  placeholder_cta: 'เช่น: กดซื้อเลย!, กดตะกร้าได้เลย',  // line 3940
  btn_ai_generate: '✨ AI',  // line 3927 / 3937
  btn_ai_analyze: 'AI Analyze',  // line 3946
  btn_generate_media: 'Generate Media',  // line 3949
  btn_policy_check: 'Policy Check',  // line 3952

  // ─── Prompts Generation ──────────────────────────────────────────────────

  btn_generating_loading: '⏳ กำลังสร้าง...',  // line 4524
  error_no_api_key: 'กรุณาตั้งค่า API Key ก่อนใช้งาน',  // line 4535
  btn_generate_all_prompts: '✨ AI สร้าง Prompts ทั้งหมด',  // line 4546
  log_character_added: 'เพิ่มตัวละครให้สินค้า',  // line 4596

  // ─── Status Map (getStatusText) ──────────────────────────────────────────

  status_pending: 'รอดำเนินการ',  // line 4604
  status_processing: 'กำลังดำเนินการ',  // line 4605
  status_completed: 'สำเร็จ',  // line 4606

  // ─── Product Details Alert ────────────────────────────────────────────────

  alert_product_details: 'สินค้า: ${item.name}\nID: ${item.productId || item.id}\nราคา: ${item.price || "-"}\nURL: ${item.url || "-"}',  // line 4621

  // ─── Batch Generate All ──────────────────────────────────────────────────

  error_no_products_queue: 'ไม่มีสินค้าในคิว',  // line 4628
  btn_generating_spinner: 'กำลังสร้าง...',  // line 4652
  log_batch_generate_start: 'เริ่มสร้าง Prompts + Caption + CTA สำหรับ ${productQueue.length} สินค้า',  // line 4656
  log_batch_generate_done: '✅ สร้าง Prompts + Caption + CTA เสร็จสิ้น ${completed}/${productQueue.length} สินค้า',  // line 5046
  log_generic_error: 'เกิดข้อผิดพลาด: ${error.message}',  // line 5050
  btn_generate_all: '✨ Generate All',  // line 5053

  // ─── Single Caption / CTA Generate ──────────────────────────────────────

  error_no_api_key_settings: 'กรุณาตั้งค่า API Key ก่อนใช้งาน (ไปที่แท็บ Settings)',  // line 5154
  log_caption_generated: 'สร้าง แคปชั่น สำเร็จ',  // line 5126
  log_cta_generated: 'สร้าง CTA สำเร็จ',  // line 5126
  label_loading_processing: 'กำลังประมวลผล...',  // line 5159

  // ─── Queue Action Logs ────────────────────────────────────────────────────

  log_action_analyzing: 'กำลัง วิเคราะห์: ${item.name}',  // line 5189
  log_action_generating_media: 'กำลัง สร้าง Media: ${item.name}',  // line 5189
  log_action_policy_check: 'กำลัง ตรวจ Policy: ${item.name}',  // line 5189
  log_action_done_analyze: 'วิเคราะห์ เสร็จสิ้น',  // line 5215
  log_action_done_media: 'สร้าง Media เสร็จสิ้น',  // line 5215
  log_action_done_policy: 'ตรวจ Policy เสร็จสิ้น',  // line 5215

  // ─── Style Tags ──────────────────────────────────────────────────────────

  label_no_style_selected: 'ยังไม่ได้เลือก',  // line 6249

  // ─── processFlowItem Logs ─────────────────────────────────────────────────

  error_no_api_key_openai_google: 'กรุณาตั้งค่า API Key ก่อนใช้งาน (OpenAI หรือ Google AI)',  // line 5346
  log_caption_fallback: '⚠️ ${item.name}: Caption fallback (Auto Post)',  // line 5406
  log_cta_fallback: '⚠️ ${item.name}: CTA fallback (Auto Post)',  // line 5410
  log_item_flow_done: '✅ ${item.name}: เสร็จสิ้น',  // line 5423
  log_step_failed: '❌ ${item.name}: Step ล้มเหลว — ${stepError.message}',  // line 5435
  log_tiktok_upload_starting: '📤 ${item.name}: กำลังเริ่ม TikTok Upload...',  // line 5483
  log_creating_image: '🖼️ ${item.name}: เริ่มสร้างรูปภาพ...',  // line 5493
  log_creating_video: '🎬 ${item.name}: กำลังสร้างวิดีโอ...',  // line 5501
  label_creating_video: '🎬 กำลังสร้างวิดีโอ...',  // line 5502
  log_stopped_by_user: '⏹️ หยุดโดยผู้ใช้',  // line 5516
  log_video_done: '✅ ${item.name}: Video เสร็จแล้ว!',  // line 5521
  log_extending_to_16s: '🎞️ ${item.name}: Video 8 วิ เสร็จ — กำลัง Extend เป็น 16 วิ... (${elapsed} วิ)',  // line 5529
  label_extending_to_16s: '🎞️ Extend เป็น 16 วิ... ${elapsed} วิ',  // line 5530
  log_waiting_video: '🎬 ${item.name}: รอวิดีโอ... ${elapsed} วิ',  // line 5538
  label_waiting_video: '🎬 รอวิดีโอ... ${elapsed} วิ',  // line 5539
  log_video_done_next_tiktok: '⏭️ ${item.name}: Video เสร็จ → ไป TikTok Upload',  // line 5550
  log_tiktok_upload_begin: '📤 ${item.name}: เริ่ม TikTok Upload...',  // line 5563
  log_item_stopped: '⏹️ ${item.name}: หยุดโดยผู้ใช้',  // line 5762
  log_tiktok_done: '✅ ${item.name}: TikTok เสร็จแล้ว!',  // line 5771
  label_done: '✅ เสร็จ!',  // line 5772
  log_item_success: '✅ เสร็จ: ${item.name}',  // line 5789
  log_next_item_start: '🚀 เริ่มรายการถัดไป: ${nextPending.name} (เหลือ ${remaining})',  // line 5810
  log_remaining_next_item: '📦 เหลือ ${remaining} รายการ — ถัดไป: ${nextPending.name}',  // line 5811
  log_wait_before_next: '⏳ รอ ${nextDelay/1000} วิ ก่อนรายการถัดไป...',  // line 5818
  log_tiktok_upload_failed: '❌ ${item.name}: TikTok Upload ล้มเหลว',  // line 5833
  log_waiting_tiktok_upload: '📤 ${item.name}: รอ TikTok Upload... ${elapsed} วิ',  // line 5841
  label_waiting_tiktok_upload: '⏳ รอ TikTok Upload... ${elapsed} วิ',  // line 5842
  log_tiktok_timeout: '⏰ ${item.name}: TikTok Upload timeout',  // line 5850
  log_tiktok_post_done: '✅ ${item.name}: โพส TikTok เสร็จสมบูรณ์!',  // line 5867
  label_post_done: '✅ โพสเสร็จ!',  // line 5868
  log_watchdog_timeout: '⏰ Timeout 30 นาที: ${currentItem.name} — ข้ามอัตโนมัติ',  // line 5923

  // ─── runAutoPost / stopAutoPost / nextProduct ─────────────────────────────

  log_autopost_start: '🚀 runAutoPost() เริ่มทำงาน',  // line 5941
  error_no_products_start: 'ไม่มีสินค้าในคิว กรุณาดึงสินค้าก่อน',  // line 5944
  log_settings_clip: '⚙️ Settings: คลิป ${runSettings.clipDuration} วิ',  // line 5956
  log_reset_pending: '🔄 Reset สถานะสินค้าทั้งหมดเป็น pending...',  // line 5962
  log_processing_item: '📦 เริ่มประมวลผล: ${pendingItem.name}',  // line 5977
  log_update_step_image: '🖼️ เริ่มสร้างรูปภาพ...',  // line 5993
  log_process_flow_start: '▶️ เริ่ม processFlowItem...',  // line 5995
  log_no_queue: '⚠️ ไม่พบสินค้าในคิว',  // line 5998
  log_stopped_by_user_stop: '🛑 หยุดการทำงานโดยผู้ใช้',  // line 6018
  msg_stopped_by_user: 'หยุดโดยผู้ใช้',  // line 6024 / 6032 / 6041
  label_flow_step_stopped: '🛑 หยุดโดยผู้ใช้',  // line 6037
  status_update_stopped: 'หยุดโดยผู้ใช้',  // line 6041
  log_no_current_item: 'ไม่มีสินค้าที่กำลังทำอยู่',  // line 6050
  log_skip_item: '⏭️ ข้ามรายการ: ${currentItem.name}',  // line 6054
  msg_skipped_by_user: 'ข้ามรายการนี้',  // line 6066
  log_remaining_items: '📦 เหลือสินค้าอีก ${remaining} รายการ',  // line 6073
  label_wait_3sec: '⏳ รอ 3 วินาที...',  // line 6074
  btn_running: '🔄 กำลังรัน...',  // line 6101
  btn_run: 'Run',  // line 6101

  // ─── Activity Log ─────────────────────────────────────────────────────────

  label_log_empty: 'ยังไม่มีกิจกรรม',  // line 6189

  // ─── showSuccess (direct call) ────────────────────────────────────────────

  success_all_done: 'ทำครบแล้ว! สำเร็จ ${stats.posted}/${stats.total}',  // line 3023 (showSuccess)

  // ─── Prompt Generation (error / flow) ─────────────────────────────────────

  error_no_prompt_for_flow: 'กรุณาสร้าง Prompt ก่อนเปิด Flow',  // line 4102
};
