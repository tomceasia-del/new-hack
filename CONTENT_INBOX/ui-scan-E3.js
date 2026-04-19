// UI Scan E3 — sidepanel.js lines 5800–9200
export const UI_SCAN_E3 = {

  // ─── LOG / ACTIVITY LOG ───────────────────────────────────────────────────

  log_empty_activity: 'ยังไม่มีกิจกรรม', // line 6189
  log_sm_empty: 'ยังไม่มี log — เริ่ม Generate หรือ Auto Run เพื่อดูสถานะ', // line 6532

  // ─── AUTOPOST FLOW — queue / item control ────────────────────────────────

  log_next_item_start: '🚀 เริ่มรายการถัดไป: {name} (เหลือ {remaining})', // line 5810
  log_next_item_remaining: '📦 เหลือ {remaining} รายการ — ถัดไป: {name}', // line 5811
  log_retry_round: '🔄 เริ่ม Retry รอบใหม่ — ทำรายการที่ล้มเหลวซ้ำ', // line 5813
  log_wait_before_next: '⏳ รอ {sec} วิ ก่อนรายการถัดไป...', // line 5818
  log_all_done: '🎉 ทำครบทุกสินค้าแล้ว! (สำเร็จ {posted}, ล้มเหลว {failed}, ข้าม {skipped})', // line 5823
  log_tiktok_upload_fail: '❌ {name}: TikTok Upload ล้มเหลว', // line 5833
  log_waiting_upload: '📤 {name}: รอ TikTok Upload... {elapsed} วิ', // line 5841
  log_waiting_upload_step: '⏳ รอ TikTok Upload... {elapsed} วิ', // line 5842
  log_tiktok_upload_timeout: '⏰ {name}: TikTok Upload timeout', // line 5850
  log_tiktok_post_done: '✅ {name}: โพส TikTok เสร็จสมบูรณ์!', // line 5867
  status_post_done: '✅ โพสเสร็จ!', // line 5868
  log_watchdog_timeout: '⏰ Timeout 30 นาที: {name} — ข้ามอัตโนมัติ', // line 5923
  log_autopost_start: '🚀 runAutoPost() เริ่มทำงาน', // line 5941
  error_no_queue: 'ไม่มีสินค้าในคิว กรุณาดึงสินค้าก่อน', // line 5944
  log_settings_clip: '⚙️ Settings: คลิป {duration} วิ', // line 5956
  log_reset_pending: '🔄 Reset สถานะสินค้าทั้งหมดเป็น pending...', // line 5962
  log_processing_item: '📦 เริ่มประมวลผล: {name}', // line 5977
  status_creating_image: '🖼️ เริ่มสร้างรูปภาพ...', // line 5993
  log_start_flow: '▶️ เริ่ม processFlowItem...', // line 5995
  log_no_item_in_queue: '⚠️ ไม่พบสินค้าในคิว', // line 5998
  log_stopped_by_user: '🛑 หยุดการทำงานโดยผู้ใช้', // line 6018
  status_stopped_by_user: '🛑 หยุดโดยผู้ใช้', // line 6037
  log_no_current_item: 'ไม่มีสินค้าที่กำลังทำอยู่', // line 6050
  log_skipping_item: '⏭️ ข้ามรายการ: {name}', // line 6054
  log_remaining_items: '📦 เหลือสินค้าอีก {remaining} รายการ', // line 6073
  status_waiting_3sec: '⏳ รอ 3 วินาที...', // line 6074

  // ─── BUTTON LABELS ───────────────────────────────────────────────────────

  btn_running: '🔄 กำลังรัน...', // line 6101
  btn_copy_done: '✅ คัดลอกแล้ว!', // line 7122
  btn_copy_all: '📋 คัดลอกทั้งหมด', // line 7124
  btn_view_raw: '📄 ดูแบบ Raw', // line 9027
  btn_view_card: '🎴 ดูแบบการ์ด', // line 9031
  btn_copy_label: '📋 Copy', // line 9590
  btn_copied_label: '✅ Copied!', // line 9587
  btn_retry: '🔄 Retry', // line 7927
  btn_retry_waiting: '🔄 รอ...', // line 7923

  // ─── SELECTED STYLES PREVIEW ─────────────────────────────────────────────

  label_not_selected: 'ยังไม่ได้เลือก', // line 6249
  label_selected_narrative: 'เลือกแล้ว: —', // line 6947 (empty state)
  label_selected_narrative_prefix: 'เลือกแล้ว: ', // line 6953

  // ─── SM LOG COUNT ────────────────────────────────────────────────────────

  label_log_count: '({n} รายการ)', // line 6511 / 6535

  // ─── AUTO POST TOGGLE ────────────────────────────────────────────────────

  log_autopost_toggle_on: '🚀 [AutoPost] เปิด Auto Post TikTok', // line ~6699
  log_autopost_toggle_off: '🚀 [AutoPost] ปิด Auto Post TikTok', // line ~6699

  // ─── STORY TYPE TEMPLATES (names + descriptions) ─────────────────────────

  story_type_custom_name: 'กำหนดเอง (Custom)', // line 6449
  story_type_custom_desc: 'ใส่หัวข้อเอง AI สร้างเรื่องให้อิสระ', // line 6449
  story_type_product_review_name: 'รีวิวสินค้า UGC', // line 6450
  story_type_product_review_desc: 'สาวไทยรีวิวสินค้าในสถานการณ์สุดครีเอท เน้นขายของ', // line 6450
  story_type_brand_story_name: 'เล่าเรื่องแบรนด์', // line 6451
  story_type_brand_story_desc: 'สร้างเรื่องราวรอบแบรนด์/สินค้าอย่างมีอารมณ์', // line 6451
  story_type_tutorial_name: 'สอนวิธีใช้ How-to', // line 6452
  story_type_tutorial_desc: 'สาธิตการใช้งานสินค้าทีละขั้นตอน', // line 6452
  story_type_drama_name: 'มินิซีรีส์ ดราม่า', // line 6453
  story_type_drama_desc: 'เรื่องสั้นมีพล็อต ตัวละคร ปมขัดแย้ง จบด้วยสินค้า', // line 6453
  story_type_fairytale_name: 'นิทาน / เรื่องเล่า', // line 6454
  story_type_fairytale_desc: 'ตัวละครแฟนตาซีผจญภัย เล่าเรื่องด้วย voiceover', // line 6454
  story_type_asmr_name: 'ASMR / Cinematic', // line 6455
  story_type_asmr_desc: 'เน้นภาพสวย เสียงบรรยากาศ ไม่มีบทพูด', // line 6455
  story_type_comedy_name: 'ตลก / Skit', // line 6456
  story_type_comedy_desc: 'สถานการณ์ตลกหักมุม จบด้วยสินค้าเป็น punchline', // line 6456
  story_type_comparison_name: 'เปรียบเทียบ ก่อน-หลัง', // line 6457
  story_type_comparison_desc: 'แสดงปัญหา → ใช้สินค้า → ผลลัพธ์ที่ดีขึ้น', // line 6457
  story_type_character_name: 'ตัวละคร Pixar / 3D', // line 6458
  story_type_character_desc: 'ตัวละคร 3D Animation เล่าเรื่องสนุก พูดไทย', // line 6458

  // ─── VISUAL STYLES (names) ───────────────────────────────────────────────

  visual_cinematic: 'ซีนีมาติกสมจริง (ภาพยนตร์คมชัด)', // line 6464
  visual_disney: 'แอนิเมชัน 3D (สไตล์ Pixar การ์ตูน 3 มิติ)', // line 6465
  visual_ghibli: 'สไตล์จิบลิ (การ์ตูนญี่ปุ่นอบอุ่น)', // line 6466
  visual_claymation: 'รูปปั้นดินน้ำมัน (เหมือนปั้นมือ)', // line 6468
  visual_crochet: 'ถักไหมพรม (น่ารัก นุ่มนิ่ม)', // line 6469
  visual_plushie: 'ตุ๊กตาผ้าขนฟู (ตุ๊กตาน่ากอด)', // line 6470
  visual_papercut: 'กระดาษตัด (งานฝีมือกระดาษ)', // line 6471
  visual_dragonball: 'สไตล์ดราก้อนบอล (การ์ตูนต่อสู้)', // line 6473
  visual_90sanime: 'อนิเมะยุค 90 (การ์ตูนญี่ปุ่นย้อนยุค)', // line 6474
  visual_gta: 'สไตล์ GTA (หน้าจอโหลดเกม)', // line 6475
  visual_watercolor: 'สีน้ำ (ภาพวาดนุ่มนวล)', // line 6477
  visual_chalk: 'ภาพวาดชอล์ก (วาดบนกระดานดำ)', // line 6478
  visual_oilpaint: 'สีน้ำมัน (ภาพวาดคลาสสิก)', // line 6479
  visual_popart: 'ป๊อปอาร์ต (สีจัด ตัดกันแรง)', // line 6480
  visual_pixel: 'พิกเซลอาร์ต (เกมย้อนยุค 8-bit)', // line 6482
  visual_cyberpunk: 'ไซเบอร์พังค์ / นีออน (ล้ำสมัย เรืองแสง)', // line 6483
  visual_vector: 'ภาพเวกเตอร์แบน (กราฟิกเรียบง่าย)', // line 6484
  visual_lego: 'สไตล์เลโก้ (ตัวต่อพลาสติก)', // line 6485
  visual_vaporwave: 'เวเปอร์เวฟ (ย้อนยุค สีม่วงชมพู)', // line 6487
  visual_emoji: 'สไตล์อีโมจิ (ไอคอนน่ารัก)', // line 6488

  // ─── MOOD / TONE LABELS (Thai UI labels) ─────────────────────────────────

  mood_cinematic_standard: 'ซีนีมาติก มาตรฐาน (ภาพยนตร์ทั่วไป)', // line 6966
  mood_dramatic: 'ดราม่า เข้มข้น (อารมณ์รุนแรง)', // line 6967
  mood_peaceful: 'สงบ ผ่อนคลาย (โทนอ่อนโยน)', // line 6968
  mood_energetic: 'มีพลัง สดใส (ตื่นเต้น กระฉับกระเฉง)', // line 6969
  mood_romantic: 'โรแมนติก นุ่มนวล (หวาน อบอุ่น)', // line 6970
  mood_mysterious: 'ลึกลับ มืด (น่าค้นหา)', // line 6971
  mood_playful: 'สนุกสนาน ขี้เล่น (สดใส ร่าเริง)', // line 6972
  mood_professional: 'มืออาชีพ สะอาด (น่าเชื่อถือ)', // line 6973
  mood_nostalgic: 'ย้อนยุค เรโทร (คิดถึงอดีต)', // line 6974
  mood_luxury: 'หรูหรา พรีเมียม (ไฮเอนด์)', // line 6975
  mood_horror: 'สยองขวัญ ระทึก (น่ากลัว)', // line 6976
  mood_comedy: 'ตลก ขำขัน (สนุก เบาสมอง)', // line 6977
  mood_epic: 'มหากาพย์ ยิ่งใหญ่ (อลังการ)', // line 6978
  mood_warm: 'อบอุ่น น่าอยู่ (เหมือนบ้าน)', // line 6979
  mood_futuristic: 'อนาคต ไซไฟ (ล้ำสมัย)', // line 6980
  mood_raw: 'ดิบ เท่ (ไม่ปรุงแต่ง)', // line 6981
  mood_dreamy: 'ฝันหวาน เลือนลาง (เหนือจริง)', // line 6982
  mood_urban: 'เมือง สตรีท (วัฒนธรรมถนน)', // line 6983
  mood_nature: 'ธรรมชาติ ออร์แกนิก (สีเขียว สดชื่น)', // line 6984
  mood_minimal: 'มินิมอล สะอาด (เรียบง่าย)', // line 6985

  // ─── HOOK OPTIONS ────────────────────────────────────────────────────────

  hook_auto: 'AI เลือกให้อัตโนมัติ', // line 7046
  hook_fomo: 'FOMO & Flash Sale (กลัวพลาด)', // line 7047
  hook_authentic: 'Authentic Vibe (เพื่อนป้ายยา)', // line 7048
  hook_obsession: 'Scarcity & Obsession (อวยยศ)', // line 7049
  hook_curiosity: 'Curiosity Gap & Shock (ช็อก)', // line 7050

  // ─── SCENE COUNT DROPDOWN ────────────────────────────────────────────────

  label_scene_count: '{n} ฉาก', // line 6882 / 6887
  label_scene_count_star: '{n} ฉาก ⭐', // line 6882 (for n=5)

  // ─── MANUAL SCENE INPUTS ─────────────────────────────────────────────────

  label_scene_product_checkbox: '📦 สินค้า', // line 6658
  placeholder_manual_scene: 'พิมพ์บทพูดฉากที่ {n}...', // line 6661

  // ─── QUEUE UI ────────────────────────────────────────────────────────────

  label_queue_empty: 'ยังไม่มีเรื่องในคิว', // line 7341
  error_queue_no_items: 'ไม่มีเรื่องในคิว', // line 7368
  error_queue_already_running: 'Queue กำลังทำงานอยู่แล้ว', // line 7374
  error_cannot_delete_running: 'ไม่สามารถลบเรื่องที่กำลังทำงานอยู่', // line 7312
  error_cannot_clear_running: 'ไม่สามารถล้างคิวขณะกำลังทำงาน', // line 7323
  error_custom_prompt_empty: 'โหมด Prompt กำหนดเอง: กรุณาใส่ข้อความในช่อง Prompt เต็มชุดก่อนเพิ่มเข้าคิว', // line 7276
  error_topic_empty: 'กรุณาใส่หัวข้อเรื่องก่อนเพิ่มเข้าคิว', // line 7281
  log_queue_item_added: '📋 [Queue] เพิ่มเรื่อง "{label}" เข้าคิว ({total} เรื่อง)', // line 7300
  log_queue_start: '🚀 [Queue] เริ่ม Queue — {total} เรื่อง', // line 7387
  status_queue_starting: '🚀 เริ่มต้น Queue...', // line 7388
  log_queue_story_start: '📖 [Queue] เริ่มเรื่องที่ {n}: "{label}"', // line 7402
  status_queue_story_progress: '📖 เรื่องที่ {n}/{total}: "{label}"', // line 7401
  log_queue_generating: '🤖 [Queue] กำลัง Generate script...', // line 7409
  status_queue_generating: '🤖 เรื่องที่ {n}: Generate script...', // line 7410
  log_queue_autopost_open: '🚀 [Queue] เรื่องที่ {n}: Auto Post เปิด — จะโพส TikTok หลังสร้างเสร็จ', // line 7429
  log_queue_pipeline_start: '🎬 [Queue] เริ่ม Pipeline...', // line 7435
  status_queue_pipeline_running: '🎬 เรื่องที่ {n}: Pipeline กำลังทำงาน...', // line 7436
  log_queue_waiting_tiktok: '📤 [Queue] เรื่องที่ {n}: กำลังรอ TikTok โพส...', // line 7444
  status_queue_waiting_tiktok: '📤 เรื่องที่ {n}: รอ TikTok โพส...', // line 7445
  log_queue_tiktok_done: '✅ [Queue] เรื่องที่ {n}: TikTok โพสเสร็จ!', // line 7447
  status_queue_tiktok_done: '✅ เรื่องที่ {n}: โพส TikTok เสร็จ!', // line 7448
  log_queue_wait_before_next: '⏳ [Queue] รอ 10 วิ ก่อนเริ่มเรื่องถัดไป...', // line 7472
  log_queue_story_done: '✅ [Queue] เรื่องที่ {n}: "{label}" — เสร็จสมบูรณ์!', // line 7477
  status_queue_story_done: '✅ เรื่องที่ {n}: เสร็จแล้ว!', // line 7478
  log_queue_story_failed: '❌ [Queue] เรื่อง "{label}" — ล้มเหลว: {error}', // line 7486
  status_queue_failed: '❌ ล้มเหลว: {error}', // line 7487
  log_queue_recover_tab: '🔄 [Queue] เหลือ {n} เรื่อง — กำลัง recover Google Flow tab...', // line 7497
  status_queue_reload_flow: '🔄 Reload Google Flow สำหรับเรื่องถัดไป...', // line 7498
  log_queue_flow_ready: '✅ [Queue] Google Flow tab พร้อม — เริ่มเรื่องถัดไป', // line 7502
  log_queue_recover_error: '⚠️ [Queue] Recover tab error: {error} — ลองต่อ...', // line 7505
  log_queue_all_done: '🎉 [Queue] Queue เสร็จสิ้น! สำเร็จ {completed} เรื่อง, ล้มเหลว {failed} เรื่อง', // line 7517
  status_queue_all_done: '🎉 Queue เสร็จ! {completed}/{total} สำเร็จ', // line 7518
  log_queue_stopped: '⏹️ [Queue] หยุดโดยผู้ใช้', // line 7532
  error_no_api_key: 'ไม่มี API Key — กรุณาตั้งค่า API Key ก่อนใช้งาน Queue', // line 7572
  log_queue_continue_response: '📝 [Queue] AI ตอบไม่ครบ — กำลังเรียกต่อ...', // line 7634
  log_queue_continue_round: '📝 [Queue] เรียกต่อรอบ {n}...', // line 7654
  log_queue_found_scenes: '🎬 [Queue] พบ {n} ฉาก — เริ่ม Pipeline', // line 7677
  status_queue_pipeline_starting: '🚀 [Queue] เริ่มต้น Pipeline...', // line 7700
  log_queue_opening_flow: '🌐 [Queue] กำลังเปิด Google Flow...', // line 7705
  log_queue_waiting_tiktok_post: '📤 [Queue] รอ TikTok โพส... {elapsed} วิ', // line 7739

  // ─── PIPELINE STEPS UI ───────────────────────────────────────────────────

  label_pipeline_summary: '{current} / {total} ฉาก', // line 7804
  label_pipeline_scene_num: 'ฉาก {n}', // line 7836
  status_pipeline_waiting: 'รอดำเนินการ', // line 7837
  label_pipeline_retry_title: 'Retry ฉากนี้', // line 7928 / 7952
  label_pipeline_retry_waiting_title: 'รอ Pipeline เสร็จก่อนถึงจะ Retry ได้', // line 7924
  label_pipeline_product_title: 'ใส่รูปสินค้าในฉากนี้', // line 7839

  // ─── RETRY SINGLE SCENE ──────────────────────────────────────────────────

  error_pipeline_busy: 'Pipeline กำลังทำงานอยู่ — รอให้เสร็จก่อน', // line 7961
  error_scene_not_found: 'ไม่พบข้อมูลฉากที่ {n}', // line 7967
  log_retry_scene_start: '🔄 [Storymode] Retry ฉากที่ {n}...', // line 7973
  status_retry_starting: '🔄 Retry ฉาก {n}: กำลังเริ่ม...', // line 7981
  status_retry_image: '🖼️ Retry ฉาก {n}: กำลังสร้าง Image...', // line 8014
  log_retry_image: '🖼️ [Retry] ฉาก {n}: กำลังสร้าง Image...', // line 8015
  status_retry_image_done: '✅ Retry ฉาก {n}: Image เสร็จ!', // line 8074
  log_retry_image_done: '✅ [Retry] ฉาก {n}: Image สำเร็จ', // line 8075
  log_retry_image_fail: '❌ [Retry] ฉาก {n}: Image ล้มเหลว — {error}', // line 8079
  status_retry_video: '🎬 Retry ฉาก {n}: กำลังสร้าง Video...', // line 8086
  log_retry_video: '🎬 [Retry] ฉาก {n}: กำลังสร้าง Video...', // line 8087
  status_retry_all_done: '✅ Retry ฉาก {n}: เสร็จครบ! (Image + Video)', // line 8125
  log_retry_all_done: '✅ [Retry] ฉาก {n}: เสร็จครบ!', // line 8126
  status_retry_video_fail: '⚠️ Retry ฉาก {n}: Image OK แต่ Video ล้มเหลว', // line 8129
  log_retry_video_fail: '⚠️ [Retry] ฉาก {n}: Video ล้มเหลว — {error}', // line 8130
  status_retry_image_fail_final: '❌ Retry ฉาก {n}: Image ล้มเหลว', // line 8133

  // ─── STORYMODE — START AUTO RUN ──────────────────────────────────────────

  error_no_scene_prompts: 'กรุณากด Generate ก่อนเพื่อสร้าง Scene Prompts', // line 8281
  error_no_scenes_in_output: 'ไม่พบ Scene Prompts ใน output กรุณา Generate ใหม่', // line 8291
  log_storymode_pipeline_start: '🎬 [Storymode] เริ่ม Pipeline — {n} ฉาก', // line 8298
  log_character_lock: '🔒 [Storymode] Character Lock: "{desc}..."', // line 8304
  log_character_lock_missing: '⚠️ [Storymode] ไม่พบ CHARACTER: block ในฉาก 1 — ตัวละครอาจไม่เหมือนกันทุกฉาก', // line 8307
  log_autopost_on: '🚀 [Storymode] Auto Post เปิด — จะโพส TikTok หลังสร้างเสร็จ', // line 8335
  status_starting: '🚀 เริ่มต้น...', // line 8349
  log_opening_flow: '🌐 [Storymode] กำลังเปิด Google Flow...', // line 8357
  log_storymode_error: '❌ [Storymode] เกิดข้อผิดพลาด: {error}', // line 8367
  error_storymode_generic: 'เกิดข้อผิดพลาด: {error}', // line 8368
  log_storymode_stopped: '⏹️ [Storymode] หยุดโดยผู้ใช้', // line 8378
  status_pipeline_stopped: '⏹️ หยุดแล้ว', // line 8388
  log_recover_flow_tab: '🔄 [Storymode] กำลัง recover Google Flow tab...', // line 8394
  log_content_script_no_response: '⚠️ [Storymode] Content script ไม่ตอบ — เปิด tab ใหม่...', // line 8420
  log_flow_tab_recovered: '✅ [Storymode] Google Flow tab recovered', // line 8422
  log_content_script_no_response_new: '⚠️ [Storymode] Content script ไม่ตอบหลังเปิด tab ใหม่', // line 8449
  log_flow_tab_opened: '✅ [Storymode] Google Flow tab opened', // line 8451

  // ─── STORYMODE — AUTO SCENE LOOP ─────────────────────────────────────────

  log_scene_loop_start: '🎬 [Storymode] เริ่มฉากที่ {n}/{total}', // line 8466
  status_tab_gone: '⚠️ Google Flow tab หายไป — รอ reload...', // line 8504
  status_tab_error: '⚠️ Tab error — รอ recover...', // line 8518
  log_scene_video_only: '🎬 [Storymode] ฉาก {n}: Video-Only mode — ข้าม Image', // line 8534
  status_retry_image_loop: '🔄 ฉาก {n}: Retry Image... ({attempt}/{max})', // line 8543
  log_retry_image_loop: '🔄 [Storymode] ฉาก {n}: Retry Image ครั้งที่ {attempt}/{max}...', // line 8544
  status_creating_image_loop: '🖼️ ฉาก {n}: กำลังสร้าง Image...', // line 8549
  log_creating_image_loop: '🖼️ [Storymode] ฉาก {n}: กำลังสร้าง Image...', // line 8550
  log_attach_product_and_char: '📷 [Storymode] ฉาก {n}: แนบ ref สินค้า + ตัวละคร', // line 8561
  log_attach_product: '📷 [Storymode] ฉาก {n}: แนบ ref สินค้า', // line 8563
  log_attach_char: '📷 [Storymode] ฉาก {n}: แนบ ref ตัวละคร', // line 8565
  log_no_product_image: '📷 [Storymode] ฉาก {n}: ไม่แนบรูปสินค้า (ตาม checkbox)', // line 8567
  log_no_product_in_scene: '📦 [Storymode] ฉาก {n}: ไม่ใส่รูปสินค้า (ตาม checkbox)', // line 8617
  status_image_done: '✅ ฉาก {n}: Image เสร็จแล้ว', // line 8636
  log_image_done: '✅ [Storymode] ฉาก {n}: Image สำเร็จ', // line 8637
  log_scene_stopped: '⏹️ [Storymode] ฉาก {n}: หยุดโดยผู้ใช้', // line 8646 / 8765
  log_google_labs_crash_image: '❌ [Storymode] ฉาก {n}: Google labs ล่ม — recover...', // line 8652
  log_image_fail: '⚠️ [Storymode] ฉาก {n}: Image ล้มเหลว — {error}', // line 8655
  log_no_video_prompt: '⚠️ [Storymode] ฉาก {n}: ข้าม Video เพราะไม่มี videoPrompt!', // line 8664
  status_retry_video_loop: '🔄 ฉาก {n}: Retry Video... ({attempt}/{max})', // line 8674
  log_retry_video_loop: '🔄 [Storymode] ฉาก {n}: Retry Video ครั้งที่ {attempt}/{max}...', // line 8675
  status_creating_video_loop: '🎬 ฉาก {n}: กำลังสร้าง Video...', // line 8681
  log_creating_video_loop: '🎬 [Storymode] ฉาก {n}: กำลังสร้าง Video...', // line 8682
  log_no_product_dialogue: '💬 [Storymode] ฉาก {n}: ไม่ใส่บทพูดสินค้า (ตาม checkbox)', // line 8690
  status_video_done: '✅ ฉาก {n}: Video เสร็จแล้ว', // line 8756
  log_video_done: '✅ [Storymode] ฉาก {n}: Video สำเร็จ', // line 8757
  log_google_labs_crash_video: '❌ [Storymode] ฉาก {n}: Google labs ล่มตอน Video — recover + retry...', // line 8770
  log_video_fail: '⚠️ [Storymode] ฉาก {n}: Video ล้มเหลว — {error}', // line 8773
  log_video_fail_max_retries: '❌ [Storymode] ฉาก {n}: Video ล้มเหลว {max} ครั้ง — ข้ามฉากนี้', // line 8777
  status_video_fail_skip: '⚠️ ฉาก {n}: Video ไม่สำเร็จ — ไปฉากถัดไป', // line 8784
  log_video_fail_max: '⚠️ [Storymode] ฉาก {n}: Video ไม่สำเร็จหลัง {max} ครั้ง', // line 8785
  log_image_fail_skip_video: '⚠️ [Storymode] ฉาก {n}: Image ไม่สำเร็จหลัง {max} ครั้ง — ข้าม Video ฉากนี้', // line 8793
  status_image_fail_skip_video: '⚠️ ฉาก {n}: Image ไม่สำเร็จ — ข้าม Video', // line 8794
  status_scene_complete: '✅ ฉากที่ {n} เสร็จครบแล้ว!', // line 8800
  log_scene_complete: '✅ [Storymode] ฉากที่ {n}/{total} เสร็จครบ!', // line 8801
  status_scene_fail_after_retry: '⚠️ ฉากที่ {n}: ไม่สำเร็จหลัง retry {max} ครั้ง', // line 8803

  // ─── STORYMODE — PIPELINE COMPLETION ─────────────────────────────────────

  status_all_scenes_done: '🎉 สร้างครบทุกฉากแล้ว!', // line 8820
  log_all_scenes_done: '🎉 [Storymode] สร้างครบทุกฉากแล้ว! ({total} ฉาก)', // line 8821
  status_opening_scenebuilder: '🎬 กำลังเปิด SceneBuilder...', // line 8830
  log_opening_scenebuilder: '🎬 [Storymode] กำลังเปิด SceneBuilder + Export...', // line 8831
  status_scenebuilder_progress: '🎬 กำลังเปิด SceneBuilder... {sec} วิ', // line 8853
  status_exporting: '📥 กำลัง Export... {sec} วิ', // line 8855
  status_waiting_download: '⏳ รอ Download... {sec} วิ', // line 8857
  status_pipeline_complete: '🎉✅ Pipeline เสร็จสิ้น! ครบทุกฉากแล้ว!', // line 8862
  log_pipeline_complete: '🎉✅ [Storymode] Pipeline เสร็จสิ้น! ครบทุกฉาก + Export แล้ว!', // line 8863
  status_scenebuilder_error: '⚠️ SceneBuilder error - แต่สร้างฉากครบแล้ว', // line 8866
  log_scenebuilder_error: '⚠️ [Storymode] SceneBuilder error — แต่สร้างฉากครบแล้ว', // line 8867
  log_failed_scenes_warning: '⚠️ [Storymode] มี {n} ฉากล้มเหลว — กดปุ่ม 🔄 Retry ที่ฉากนั้นเพื่อลองใหม่', // line 8883

  // ─── STORYMODE — waitForSceneStep ────────────────────────────────────────

  log_scene_step_fail: '❌ [Storymode] ฉาก {n} {step}: {error}', // line 8915
  log_scene_step_done: '✅ [Storymode] ฉาก {n} {step} เสร็จสมบูรณ์!', // line 8931
  log_scene_step_stale: '⚠️ [Storymode] ฉาก {n} {step}: ไม่ตอบสนอง {sec} วิ — content script อาจ crash', // line 8949

  // ─── LOADING INDICATORS (innerHTML) ─────────────────────────────────────

  loading_analyzing_product: '🔍 AI กำลังวิเคราะห์รูปสินค้า...', // line 7580
  loading_analyzing_character: '🔍 AI กำลังวิเคราะห์รูปตัวละคร reference...', // line 7592
  loading_generating_queue: '[Queue] กำลังสร้างสคริปต์ด้วย {provider}...', // line 7613

  // ─── STYLE FIX LOG ───────────────────────────────────────────────────────

  log_style_fix_photorealistic: '🎨 [Style Fix] Override art style → photorealistic ({n} ฉาก)', // line 8156

  // ─── SCENE CARDS TABLE HEADERS ───────────────────────────────────────────

  th_scene: 'ฉาก', // line 9438
  th_dialogue: '💬 บทพูด', // line 9439
  th_image_prompt: '🔴 Image Prompt', // line 9440
  th_video_prompt: '🟢 Video Prompt', // line 9441

  // ─── SCENE CARD ELEMENTS ─────────────────────────────────────────────────

  label_scene_cell: 'ฉาก {n}', // line 9457
  title_show_product_checkbox: 'ใส่รูปสินค้าในฉากนี้', // line 9460
  placeholder_dialogue_edit: 'บทพูดของตัวละคร (แก้ไขได้)', // line 9470
  label_storyboards_section: '📝 STORYBOARDS', // line 9531
  label_viral_caption_title: '📱 แคปชั่นสำหรับโพสต์ (TikTok/Reels)', // line 9567

};
