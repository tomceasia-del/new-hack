// UI Scan E4 — sidepanel.js lines 8800–12200
export const UI_SCAN_E4 = {

  // ─── Auto Run / Storymode Progress ───────────────────────────────────────

  status_scene_done: 'ฉากที่ {N} เสร็จครบแล้ว!',                                     // line 8800 (updateAutoRunProgress)
  log_scene_done: '[Storymode] ฉากที่ {N}/{total} เสร็จครบ!',                         // line 8801 (addLog success)
  status_scene_fail_retry: 'ฉากที่ {N}: ไม่สำเร็จหลัง retry {MAX} ครั้ง',            // line 8803 (updateAutoRunProgress)
  status_all_scenes_done: 'สร้างครบทุกฉากแล้ว!',                                       // line 8820 (updateAutoRunProgress)
  log_all_scenes_done: '[Storymode] สร้างครบทุกฉากแล้ว! ({total} ฉาก)',               // line 8821 (addLog success)
  status_opening_scenebuilder: 'กำลังเปิด SceneBuilder...',                             // line 8830 (updateAutoRunProgress)
  log_opening_scenebuilder: '[Storymode] กำลังเปิด SceneBuilder + Export...',           // line 8831 (addLog info)
  status_scenebuilder_progress: 'กำลังเปิด SceneBuilder... {sec} วิ',                   // line 8853 (updateAutoRunProgress)
  status_exporting: 'กำลัง Export... {sec} วิ',                                         // line 8855 (updateAutoRunProgress)
  status_waiting_download: 'รอ Download... {sec} วิ',                                    // line 8857 (updateAutoRunProgress)
  status_pipeline_complete: 'Pipeline เสร็จสิ้น! ครบทุกฉากแล้ว!',                      // line 8862 (updateAutoRunProgress)
  log_pipeline_complete: '[Storymode] Pipeline เสร็จสิ้น! ครบทุกฉาก + Export แล้ว!',   // line 8863 (addLog success)
  status_scenebuilder_error: 'SceneBuilder error - แต่สร้างฉากครบแล้ว',                 // line 8866 (updateAutoRunProgress)
  log_scenebuilder_error: '[Storymode] SceneBuilder error — แต่สร้างฉากครบแล้ว',        // line 8867 (addLog warning)
  log_failed_scenes: '[Storymode] มี {N} ฉากล้มเหลว — กดปุ่ม 🔄 Retry ที่ฉากนั้นเพื่อลองใหม่', // line 8883 (addLog warning)

  // ─── waitForSceneStep logs ────────────────────────────────────────────────

  log_scene_flow_error: '[Storymode] ฉาก {sceneNumber} {stepType}: {errMsg}',           // line 8915 (addLog error)
  log_scene_step_done: '[Storymode] ฉาก {sceneNumber} {stepType} เสร็จสมบูรณ์!',       // line 8931 (addLog success)
  log_scene_stale: '[Storymode] ฉาก {sceneNumber} {stepType}: ไม่ตอบสนอง {staleSec} วิ — content script อาจ crash', // line 8949 (addLog warning)

  // ─── Toggle View Button ───────────────────────────────────────────────────

  btn_view_raw: 'ดูแบบ Raw',                                                             // line 9027 (toggleBtn.innerHTML)
  btn_view_card: 'ดูแบบการ์ด',                                                           // line 9031 (toggleBtn.innerHTML)

  // ─── Scene Cards Table Headers ────────────────────────────────────────────

  label_col_scene: 'ฉาก',                                                                // line 9438 (th)
  label_col_dialogue: '💬 บทพูด',                                                        // line 9439 (th)
  label_col_image_prompt: '🔴 Image Prompt',                                              // line 9440 (th)
  label_col_video_prompt: '🟢 Video Prompt',                                              // line 9441 (th)

  // ─── Scene Card Inline Strings ────────────────────────────────────────────

  label_scene_number: 'ฉาก {N}',                                                         // line 9457 (div inner)
  label_show_product_title: 'ใส่รูปสินค้าในฉากนี้',                                      // line 9460 (label title attr)
  placeholder_dialogue_edit: 'บทพูดของตัวละคร (แก้ไขได้)',                               // line 9470 (textarea placeholder)
  btn_copy: '📋 Copy',                                                                    // line 9480, 9493 (buttons)
  btn_auto: '🚀 Auto',                                                                    // line 9481, 9494 (buttons)

  // ─── Storyboard Section ───────────────────────────────────────────────────

  label_storyboards_title: '📝 STORYBOARDS',                                             // line 9531 (section title)
  label_storyboard_scene_num: 'ฉาก {N}',                                                 // line 9545 (prompt-card-number)
  btn_copy_storyboard: '📋 Copy',                                                         // line 9549 (button)

  // ─── Viral Caption Section ────────────────────────────────────────────────

  label_caption_title: '📱 แคปชั่นสำหรับโพสต์ (TikTok/Reels)',                          // line 9567 (section title)
  btn_copy_all_caption: '📋 Copy All',                                                    // line 9568 (button)

  // ─── Copy Button States ───────────────────────────────────────────────────

  btn_copied: '✅ Copied!',                                                               // line 9587 (btn.textContent after copy)
  btn_copy_reset: '📋 Copy',                                                              // line 9590 (btn.textContent after timeout)
  btn_copied_all: '✅ Copied All!',                                                       // line 9608 (btn.textContent after copy all)
  btn_copy_all_images: '📋 Copy All Images',                                              // line 9611 (btn.textContent after timeout, image)
  btn_copy_all_videos: '📋 Copy All Videos',                                              // line 9611 (btn.textContent after timeout, video)

  // ─── Auto-Run Scene Buttons (card view) ──────────────────────────────────

  error_no_prompt: 'ไม่มี prompt สำหรับฉากนี้',                                          // line 9626 (showError)
  btn_opening: '⏳ กำลังเปิด...',                                                        // line 9630 (btn.textContent)
  btn_sent: '✅ ส่งแล้ว!',                                                               // line 9661 (btn.textContent)
  success_prompt_sent: 'ส่ง {type} Prompt ฉาก {scene} ไป Google Flow แล้ว!',             // line 9662 (showSuccess)
  btn_opened: '✅ เปิดแล้ว!',                                                            // line 9666 (btn.textContent)
  success_flow_opened: 'เปิด Google Flow แล้ว — รอหน้าโหลดเสร็จแล้วจะทำงานอัตโนมัติ',   // line 9667 (showSuccess)
  btn_auto_reset: '🚀 Auto',                                                              // line 9671 (btn.textContent after timeout)
  btn_error: '❌ Error',                                                                  // line 9677 (btn.textContent)
  error_generic: 'เกิดข้อผิดพลาด: {message}',                                            // line 9678 (showError)

  // ─── Auto-Run Notification Toast ─────────────────────────────────────────

  msg_prompt_ready: '✅ Prompt ฉาก {scene} พร้อมแล้ว!',                                  // line 9706 (notification span)
  msg_go_to_generator: 'ไปที่ {type} Generator แล้วกด Auto Paste',                       // line 9707 (notification span)

  // ─── Settings: Custom Forbidden Words ────────────────────────────────────

  msg_forbidden_saved: '✅ บันทึกแล้ว {N} คำ',                                           // line 9770 (forbiddenMsg.textContent)
  msg_forbidden_cleared: '🗑️ ล้างคำต้องห้ามเพิ่มเติมแล้ว',                               // line 9783 (forbiddenMsg.textContent)

  // ─── Settings: Clear Browser Cache ───────────────────────────────────────

  btn_clearing_cache: '⏳ กำลังล้าง...',                                                 // line 9795 (btn.innerHTML)
  label_cache_mode_cache: 'Cache',                                                        // line 9797 (labels object)
  label_cache_mode_cache_cookies: 'Cache + Cookies',                                     // line 9797 (labels object)
  label_cache_mode_all: 'ทั้งหมด',                                                       // line 9797 (labels object)
  success_cache_cleared: '✅ ล้าง {mode} เรียบร้อย!',                                    // line 9803 (msg.textContent)
  error_cache_failed: '❌ ล้างไม่สำเร็จ: {error}',                                       // line 9806 (msg.textContent)
  error_cache_exception: '❌ ไม่สำเร็จ: {message}',                                      // line 9811 (msg.textContent)

  // ─── Settings: Save Settings ─────────────────────────────────────────────

  success_settings_saved: '✅ บันทึกการตั้งค่าเรียบร้อย!',                               // line 9864 (msg.textContent)

  // ─── API Status Indicator ─────────────────────────────────────────────────

  status_connected_chatgpt: 'เชื่อมต่อ ChatGPT แล้ว',                                   // line 9879 (statusEl innerHTML text)
  status_connected_gemini: 'เชื่อมต่อ Gemini AI แล้ว',                                  // line 9882 (statusEl innerHTML text)
  status_no_api_key: 'ยังไม่ได้ตั้งค่า API Key (OpenAI หรือ Google AI)',                 // line 9885 (statusEl innerHTML text)

  // ─── Character Analysis Logs ─────────────────────────────────────────────

  log_character_analyzed: '[Storymode] วิเคราะห์ตัวละครเสร็จ — style: {style}, gender: {gender}', // line 9984 (addLog success)
  log_character_partial: '[Storymode] วิเคราะห์ตัวละครได้บางส่วน (text mode)',            // line 9988 (addLog warning)
  log_character_fail: '[Storymode] วิเคราะห์รูปตัวละครไม่สำเร็จ — ใช้ photorealistic fallback', // line 9993 (addLog warning)

  // ─── Product Analysis Logs ───────────────────────────────────────────────

  log_product_analyzed: '[Storymode] วิเคราะห์สินค้าเสร็จ — {productType} ({brand})',    // line 10031 (addLog success)
  log_product_analyzed_text: '[Storymode] วิเคราะห์สินค้าเสร็จ (text mode)',              // line 10035 (addLog success)
  log_product_fail: '[Storymode] วิเคราะห์รูปสินค้าไม่สำเร็จ — {message}',               // line 10040 (addLog warning)

  // ─── Generate Script (Storymode) ─────────────────────────────────────────

  error_no_api_key: 'กรุณาตั้งค่า API Key ก่อนใช้งาน (OpenAI หรือ Google AI) ไปที่แท็บ "ตั้งค่า API"', // line 10066 (throw Error)
  btn_generating: 'กำลังสร้าง...',                                                        // line 10073 (btn.innerHTML spinner)
  status_analyzing_product: 'AI กำลังวิเคราะห์รูปสินค้า...',                              // line 10081 (outputContent loading span)
  status_analyzing_character: 'AI กำลังวิเคราะห์รูปตัวละคร reference...',                 // line 10093 (outputContent loading span)
  status_generating_script: 'กำลังสร้างสคริปต์ด้วย {providerLabel}...',                   // line 10102 (outputContent loading span)
  status_ai_continue: 'AI เขียนยังไม่จบ — กำลังต่อ... ({cont}/{max})',                   // line 10125 (outputContent loading span)
  btn_generate_script: 'สร้างสคริปต์ TikTok',                                             // line 10144 (btn.innerHTML reset)

  // ─── API Errors ───────────────────────────────────────────────────────────

  error_gemini_rate_limited: 'All Gemini models rate limited — กรุณารอสักครู่แล้วลองใหม่', // line 10227 (throw Error)
  error_openai_empty: 'OpenAI ไม่ตอบกลับ — กรุณาลองใหม่',                                // line 10291 (throw Error)
  error_gemini_empty: 'Gemini ไม่ตอบกลับ ({blockReason}) — อาจถูก safety filter block หรือ prompt ยาวเกินไป', // line 10343 (throw Error)

  // ─── Image Generation ────────────────────────────────────────────────────

  error_no_google_key: 'กรุณาตั้งค่า Google AI API Key ก่อน (ไปที่แท็บ ⚙️)',            // line 10396, 10645 (throw Error)
  error_no_image_from_gemini: 'ไม่ได้รับรูปภาพจาก Gemini API',                           // line 10573 (throw Error)
  error_no_image_from_flash: 'ไม่ได้รับรูปภาพจาก Gemini 3.1 Flash Image API',            // line 10634 (throw Error)

  // ─── Video Generation (Veo 3.1) ──────────────────────────────────────────

  error_no_veo_operation: 'ไม่ได้รับ operation name จาก Veo 3.1',                        // line 10695 (throw Error)
  error_video_download_fail: 'ดาวน์โหลดวีดีโอจาก URI ไม่สำเร็จ',                         // line 10745 (throw Error)
  error_no_video_from_veo: 'ไม่ได้รับวีดีโอจาก Veo 3.1 — ดู Console log เพื่อตรวจสอบ response', // line 10761 (throw Error)
  status_generating_video_progress: 'กำลังสร้างวีดีโอ... ({elapsed} วิ)',                 // line 10770 (previewArea innerHTML span)
  error_veo_timeout: 'Veo 3.1 timeout: รอนานเกิน 5 นาที',                                // line 10774 (throw Error)

  // ─── Scene-Level Media Buttons ────────────────────────────────────────────

  btn_generating_scene: 'กำลังสร้าง...',                                                  // line 10790, 10831 (btn.innerHTML with spinner)
  status_generating_image: 'กำลังสร้างรูป...',                                            // line 10791 (previewArea loading span)
  status_generating_video_long: 'กำลังสร้างวีดีโอ... (อาจใช้เวลา 2-5 นาที)',              // line 10832 (previewArea loading span)
  btn_scene_done: '✅ สร้างเสร็จ',                                                        // line 10809, 10856 (btn.innerHTML)
  btn_make_new_image: '🖼️ สร้างรูปใหม่',                                                  // line 10811 (btn.innerHTML after timeout)
  btn_make_image: '🖼️ สร้างรูป',                                                          // line 10816 (btn.innerHTML reset)
  btn_make_new_video: '🎬 สร้างวีดีโอใหม่',                                               // line 10858 (btn.innerHTML after timeout)
  btn_make_video: '🎬 สร้างวีดีโอ',                                                       // line 10863 (btn.innerHTML reset)

  // ─── Generate All Media Button ────────────────────────────────────────────

  btn_generating_all: 'กำลังสร้างทั้งหมด...',                                             // line 10879 (btn.innerHTML with spinner)
  btn_progress_scenes: '{completed}/{total} ฉาก...',                                      // line 10909 (btn.innerHTML with spinner)
  btn_create_all_media: 'สร้างทั้งหมด (รูป + วีดีโอ)',                                    // line 10913 (btn.innerHTML reset)

  // ─── Merge Videos ─────────────────────────────────────────────────────────

  error_no_videos_to_merge: 'ยังไม่มีวีดีโอที่สร้างไว้',                                  // line 10925 (alert)
  btn_merging_videos: 'กำลังรวมวีดีโอ...',                                                 // line 10930 (btn.innerHTML with spinner)
  btn_downloaded: '✅ ดาวน์โหลดแล้ว!',                                                    // line 10955 (btn.innerHTML)
  btn_merge_videos: 'รวมวีดีโอทั้งหมด',                                                   // line 10956, 10961 (btn.innerHTML reset)
  error_merge_failed: 'รวมวีดีโอไม่สำเร็จ: {message}',                                    // line 10960 (alert)

  // ─── Studio Tab: Product Upload ───────────────────────────────────────────

  label_uploaded_click_change: '✅ อัพโหลดแล้ว (คลิกเพื่อเปลี่ยน)',                       // line 11041 (uploadArea.innerHTML)

  // ─── Studio Scene Count Dropdown ─────────────────────────────────────────

  label_scene_count_option: '{N} ฉาก',                                                    // line 11080 (dropdown item)
  label_scene_count_5: '5 ฉาก ⭐',                                                        // line 11081 (dropdown item)
  label_scene_count_10: '10 ฉาก 🔥',                                                     // line 11082 (dropdown item)

  // ─── Narrative Style Dropdown Options ────────────────────────────────────

  label_narrative_veggie_gangster: 'ผักนักเลง / อาหารขี้บ่น',                            // line 11124
  label_narrative_organ_tough_love: 'อวัยวะ Tough Love (ตับ ไต ไส้ พุง)',                 // line 11125
  label_narrative_appliance_life: 'เครื่องใช้ไฟฟ้าสู้ชีวิต',                              // line 11126
  label_narrative_politics_satire: 'การเมืองจอมแซะ',                                      // line 11127
  label_narrative_money_wallet: 'เงินในบัญชี / กระเป๋าตังค์',                             // line 11128
  label_narrative_ghost_shrine: 'ผีเจ้าที่ / ผีบ้านผีเรือน',                              // line 11129
  label_narrative_land_house: 'โฉนดที่ดิน / บ้านขี้เหงา',                                 // line 11130
  label_narrative_package_sad: 'พัสดุขี้น้อยใจ',                                          // line 11131
  label_narrative_lucky_charm: 'ไอเทมสายมู / เครื่องราง',                                 // line 11132
  label_narrative_skincare_cream: 'สกินแคร์ / ครีมซอง',                                   // line 11133
  label_narrative_inner_voice: 'เสียงในหัว (Inner Voice)',                                 // line 11134
  label_narrative_alarm_clock: 'นาฬิกาปลุกจอมด่า',                                        // line 11135
  label_narrative_computer_office: 'คอมพิวเตอร์ / โน้ตบุ๊กออฟฟิศ',                        // line 11136
  label_narrative_coffee_milk_tea: 'กาแฟ / ชานมเพื่อนรัก',                                // line 11137
  label_narrative_energy_bar: 'พลังงาน (Energy Bar)',                                     // line 11138
  label_narrative_pet_gossip: 'สัตว์เลี้ยงนินทาเจ้าของ',                                  // line 11139
  label_narrative_plant_talk: 'ต้นไม้พูดได้',                                             // line 11140
  label_narrative_shoes_passport: 'รองเท้า / พาสปอร์ต',                                   // line 11141
  label_narrative_dating_app: 'แอปนัดเดท / มือถือ',                                       // line 11142
  label_narrative_closet_clothes: 'เสื้อผ้าในตู้',                                        // line 11143
  label_narrative_de_influencer: 'สายช็อตฟีล (บอกตรงๆ ไม่เชียร์)',                       // line 11145
  label_narrative_fortune_teller: 'สายมูเตลู (ดูดวง เสริมดวง)',                           // line 11146
  label_narrative_asmr_seller: 'ASMR ขายเงียบๆ (เสียงกระซิบ)',                            // line 11147
  label_narrative_over_sharer: 'เล่าหมดเปลือก (แชร์ทุกเรื่อง)',                           // line 11148
  label_narrative_main_character: 'ตัวเอกของเรื่อง / มุมมองคนที่ 1',                      // line 11149
  label_narrative_investigator: 'สายสืบสวน (เจาะลึก ค้นหาความจริง)',                      // line 11150
  label_narrative_isan_joy: 'ไทบ้านม่วนซื่น (สำเนียงอีสาน สนุก)',                         // line 11152
  label_narrative_southern_direct: 'คนใต้ใจเต็ม (สำเนียงใต้ พูดตรง)',                     // line 11153
  label_narrative_northern_chill: 'สาวเจียงใหม่ (สำเนียงเหนือ อ่อนหวาน)',                 // line 11154
  label_narrative_sassy_queen: 'ตัวมารดาโฮ่งๆ (แซ่บ จัดจ้าน)',                            // line 11156
  label_narrative_gossiper: 'สายเผือก / ป้าข้างบ้าน (ชอบนินทา)',                          // line 11157
  label_narrative_self_made: 'วัยรุ่นสร้างตัว (ขยัน ทำเอง)',                              // line 11158
  label_narrative_prankster_couple: 'คู่รักหยุมหัว (แกล้งกัน ขำๆ)',                       // line 11159
  label_narrative_underdog: 'สู้ชีวิต (จากศูนย์สู่ฮีโร่)',                                // line 11160
  label_narrative_voiceover_troll: 'นักพากย์นรก (พากย์เสียงตลก)',                         // line 11161
  label_narrative_fangirl: 'ติ่งอวยยศ (แฟนคลับคลั่ง)',                                    // line 11162
  label_narrative_local_guru: 'สูตรผีบอก (ภูมิปัญญาชาวบ้าน)',                             // line 11163
  label_narrative_mindset_coach: 'ไลฟ์โค้ช (สร้างแรงบันดาลใจ)',                           // line 11164
  label_narrative_satirist: 'สายแซะสังคม (เสียดสีขำๆ)',                                   // line 11165
  label_narrative_glutton: 'สายกินดุดัน (กินจุ รีวิวอาหาร)',                               // line 11166

  // ─── Narrative Tags Display ───────────────────────────────────────────────

  label_narrative_none_selected: 'เลือกแล้ว: —',                                          // line 11207 (narrativeTags.textContent)
  label_narrative_selected: 'เลือกแล้ว: {names}',                                         // line 11210 (narrativeTags.textContent)

  // ─── Mood Dropdown Options ────────────────────────────────────────────────

  label_mood_cinematic: 'ซีนีมาติก มาตรฐาน (ภาพยนตร์ทั่วไป)',                            // line 11216
  label_mood_dramatic: 'ดราม่า เข้มข้น (อารมณ์รุนแรง)',                                  // line 11217
  label_mood_peaceful: 'สงบ ผ่อนคลาย (โทนอ่อนโยน)',                                      // line 11218
  label_mood_energetic: 'มีพลัง สดใส (ตื่นเต้น กระฉับกระเฉง)',                            // line 11219
  label_mood_romantic: 'โรแมนติก นุ่มนวล (หวาน อบอุ่น)',                                  // line 11220
  label_mood_mysterious: 'ลึกลับ มืด (น่าค้นหา)',                                         // line 11221
  label_mood_playful: 'สนุกสนาน ขี้เล่น (สดใส ร่าเริง)',                                  // line 11222
  label_mood_professional: 'มืออาชีพ สะอาด (น่าเชื่อถือ)',                                // line 11223

  // ─── Visual Style Dropdown Options ───────────────────────────────────────

  label_visual_cinematic: 'ซีนีมาติกสมจริง (ภาพยนตร์คมชัด)',                             // line 11261
  label_visual_disney: 'แอนิเมชัน 3D (สไตล์ Pixar การ์ตูน 3 มิติ)',                       // line 11262
  label_visual_ghibli: 'สไตล์จิบลิ (การ์ตูนญี่ปุ่นอบอุ่น)',                              // line 11263
  label_visual_claymation: 'รูปปั้นดินน้ำมัน (เหมือนปั้นมือ)',                             // line 11264
  label_visual_amigurumi: 'ถักไหมพรม (น่ารัก นุ่มนิ่ม)',                                   // line 11265
  label_visual_plushie: 'ตุ๊กตาผ้าขนฟู (ตุ๊กตาน่ากอด)',                                  // line 11266
  label_visual_paper_cutout: 'กระดาษตัด (งานฝีมือกระดาษ)',                                // line 11267
  label_visual_dragonball: 'สไตล์ดราก้อนบอล (การ์ตูนต่อสู้)',                             // line 11268
  label_visual_90s_anime: 'อนิเมะยุค 90 (การ์ตูนญี่ปุ่นย้อนยุค)',                         // line 11269
  label_visual_gta_style: 'สไตล์ GTA (หน้าจอโหลดเกม)',                                    // line 11270
  label_visual_watercolor: 'สีน้ำ (ภาพวาดนุ่มนวล)',                                       // line 11271
  label_visual_chalk_art: 'ภาพวาดชอล์ก (วาดบนกระดานดำ)',                                  // line 11272
  label_visual_oil_painting: 'สีน้ำมัน (ภาพวาดคลาสสิก)',                                  // line 11273
  label_visual_pop_art: 'ป๊อปอาร์ต (สีจัด ตัดกันแรง)',                                    // line 11274
  label_visual_pixel_art: 'พิกเซลอาร์ต (เกมย้อนยุค 8-bit)',                               // line 11275
  label_visual_cyberpunk: 'ไซเบอร์พังค์ / นีออน (ล้ำสมัย เรืองแสง)',                     // line 11276
  label_visual_vector_flat: 'ภาพเวกเตอร์แบน (กราฟิกเรียบง่าย)',                           // line 11277
  label_visual_lego_style: 'สไตล์เลโก้ (ตัวต่อพลาสติก)',                                  // line 11278
  label_visual_vaporwave: 'เวเปอร์เวฟ (ย้อนยุค สีม่วงชมพู)',                              // line 11279
  label_visual_emoji_style: 'สไตล์อีโมจิ (ไอคอนน่ารัก)',                                 // line 11280
  label_visual_mute_earth: 'โทนดิน เงียบสงบ (สีธรรมชาติอ่อนๆ)',                          // line 11282
  label_visual_mutelu_mystical: 'สายมู ลึกลับ (เครื่องราง โหราศาสตร์)',                    // line 11283
  label_visual_thai_street: 'ถนนไทยยามค่ำ (บรรยากาศตลาดกลางคืน)',                        // line 11284
  label_visual_rainy_lonely: 'วันฝนตก เหงาๆ (อารมณ์อ่อนไหว)',                             // line 11285
  label_visual_thai_vintage: 'ไทยวินเทจ (ย้อนยุคเมืองเก่า)',                              // line 11286
  label_visual_y2k_pop: 'Y2K ไทยป๊อป (แฟชั่นยุค 2000)',                                  // line 11287
  label_visual_vivid_summer: 'ซัมเมอร์ไทยสดใส (สีจัด แดดร้อน)',                          // line 11288
  label_visual_rich_flex: 'รวยอวดของ (หรูหรา โชว์ไลฟ์สไตล์)',                            // line 11289
  label_visual_local_homey: 'บ้านๆ อบอุ่น (สไตล์ชาวบ้านน่ารัก)',                         // line 11290
  label_visual_surreal_comedy: 'ตลกเหนือจริง (แปลก ขำ ไม่คาดคิด)',                       // line 11291
  label_visual_ugc_raw: 'UGC ดิบๆ (ถ่ายมือถือไม่ปรุงแต่ง)',                              // line 11293
  label_visual_fisheye: 'เลนส์ฟิชอาย (มุมกว้างบิดเบี้ยว)',                               // line 11294
  label_visual_bodycam_pov: 'กล้องติดตัว / มุมมองคนที่ 1',                               // line 11295
  label_visual_hyper_macro: 'มาโครซูมใกล้ (เห็นรายละเอียดจิ๋ว)',                         // line 11296
  label_visual_glitch: 'กลิทช์บิดเบี้ยว (ภาพเพี้ยน สั่น)',                              // line 11297
  label_visual_old_money: 'Old Money (รวยเก่า หรูเรียบ)',                                 // line 11298
  label_visual_lofi_chill: 'โลไฟ ชิลล์ (เพลงเบาๆ ผ่อนคลาย)',                            // line 11299
  label_visual_liminal_space: 'พื้นที่เหนือจริง (ฝันกลางวัน ประหลาด)',                    // line 11300
  label_visual_cottagecore: 'คอทเทจคอร์ (ชนบท เทพนิยาย)',                                // line 11301
  label_visual_paparazzi: 'ปาปารัสซี่ (แฟลชแรง สไตล์แอบถ่าย)',                           // line 11302

  // ─── Studio Master Prompt Generation ─────────────────────────────────────

  error_no_studio_prompt: 'กรุณาใส่ Prompt หลัก หรือ Storytelling ก่อน',                 // line 11363 (alert)
  btn_generating_master: 'กำลังสร้าง Master Prompt...',                                   // line 11368 (btn.innerHTML)
  error_no_api_key_studio: 'กรุณาตั้งค่า API Key ก่อนใช้งาน (OpenAI หรือ Google AI) ไปที่แท็บ ⚙️ ตั้งค่า', // line 11510 (throw Error)
  btn_master_prompt_done: 'สร้างเสร็จ! (คลิกเพื่อสร้างใหม่)',                            // line 11607 (btn.innerHTML)
  error_studio_generate_fail: '❌ เกิดข้อผิดพลาด: {message}',                             // line 11611 (alert)
  btn_master_prompt_reset: 'ผสานข้อมูล → สร้าง Master Prompt',                            // line 11612 (btn.innerHTML reset)

  // ─── Studio Scene Cards (Render) ─────────────────────────────────────────

  label_studio_empty_hint: 'กด "ผสานข้อมูล" เพื่อสร้าง Scene',                           // line 11782 (empty state div)
  btn_tab_dialogue: '💬 บทพูด',                                                           // line 11795 (tab button)
  btn_tab_image: '🖼️ Image',                                                              // line 11796 (tab button)
  btn_tab_video: '🎬 Video',                                                               // line 11797 (tab button)
  placeholder_studio_dialogue: 'บทพูดของตัวละครในฉากนี้ (แก้ไขได้ตามใจ)',                // line 11801 (textarea placeholder)
  label_select_image_option: '🖼️ Image',                                                  // line 11814 (select option)
  label_select_video_option: '🎬 Video',                                                   // line 11815 (select option)
  label_preview_count_1: '1 รูป',                                                         // line 11818 (select option)
  label_preview_count_2: '2 รูป',                                                         // line 11819 (select option)
  label_preview_count_3: '3 รูป',                                                         // line 11820 (select option)
  label_preview_count_4: '4 รูป',                                                         // line 11821 (select option)
  btn_generate_scene_title: 'สร้าง',                                                      // line 11827 (button title attr)
  btn_delete_scene_title: 'ลบ',                                                            // line 11828 (button title attr)

  // ─── Studio Status Text ───────────────────────────────────────────────────

  status_pending: '⏳ รอ',                                                                // line 11919 (getStudioStatusText)
  status_generating: '🔄 กำลังสร้าง...',                                                  // line 11920 (getStudioStatusText)
  status_done: '✅ เสร็จ',                                                                // line 11921 (getStudioStatusText)
  status_error: '❌ ผิดพลาด',                                                             // line 11922 (getStudioStatusText)

  // ─── Studio Pipeline Buttons ─────────────────────────────────────────────

  btn_create_image_n_scenes: 'สร้างรูป ({N} ฉาก)',                                        // line 12200 (updateSelectedSceneCount)
  btn_create_image: 'สร้างรูป',                                                            // line 12202 (updateSelectedSceneCount)
  btn_create_video_n_scenes: 'สร้างวีดีโอ ({N} ฉาก)',                                     // line 12208 (updateSelectedSceneCount)
  btn_create_video: 'สร้างวีดีโอ',                                                         // line 12210 (updateSelectedSceneCount)
  btn_generating_images: 'กำลังสร้างรูป...',                                               // line 12220 (generateStudioImages)
  btn_generating_image_progress: 'สร้างรูป {i}/{total}...',                               // line 12230 (generateStudioImages)
  btn_images_done: '✅ เสร็จ!',                                                            // line 12234, 12306 (btn text)
  btn_generating_videos: 'กำลังสร้างวีดีโอ...',                                            // line 12247 (generateStudioVideos)
  error_select_image_first: 'กรุณาสร้างรูปก่อน แล้วเลือกรูปที่ต้องการสร้างวีดีโอ',       // line 12262 (throw Error)
  btn_generating_video_progress: 'สร้างวีดีโอ {i}/{total}...',                            // line 12269 (generateStudioVideos)
  btn_video_error: '❌ Error',                                                             // line 12309 (btn text)
  error_video_generic: 'เกิดข้อผิดพลาด: {message}',                                      // line 12310 (alert)

  // ─── Studio Grid ──────────────────────────────────────────────────────────

  label_studio_result_count: '{imgCount} รูป / {vidCount} วีดีโอ',                        // line 12348 (countEl.textContent)
  label_studio_grid_empty: 'ยังไม่มีรูป/วีดีโอ — กด "สร้างรูป" หรือ "สร้างวีดีโอ" เพื่อเริ่ม', // line 12351 (grid empty div)
  btn_select_image: '✅ เลือก',                                                            // line 12372 (studio-item-select button)
  btn_download_title: 'ดาวน์โหลด',                                                        // line 12373, 12382 (button title attr)

  // ─── Studio Video Button Sub-label ────────────────────────────────────────

  label_veo_with_ref: 'Veo 3.1 (+ รูปที่เลือก)',                                          // line 12446 (subEl.textContent)
  label_veo_no_ref: 'Veo 3.1',                                                             // line 12450 (subEl.textContent)

  // ─── Platform Tab: Caption ────────────────────────────────────────────────

  label_caption_char_count: '{len} / 2200',                                               // line 12520 (charCount.textContent)
  btn_ai_generating_caption: '⏳ กำลังสร้าง...',                                          // line 12530 (aiCaptionBtn.textContent)
  error_no_google_key_platform: 'กรุณาตั้งค่า Google AI API Key ก่อน (แท็บ ⚙️)',         // line 12534 (alert)
  btn_ai_caption_reset: '🤖 AI สร้าง Caption',                                            // line 12560 (aiCaptionBtn.textContent reset)

  // ─── Platform Tab: CTA Char Count ────────────────────────────────────────

  label_cta_char_count: '{len} / 30',                                                     // line 12582 (ctaCount.textContent)
};
