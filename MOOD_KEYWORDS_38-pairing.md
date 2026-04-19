# MOOD_KEYWORDS — ชุด 38 (TikTok-oriented)

อัปเดตให้สอดคล้องกันทั้ง repo: คีย์เดียวกัน 38 รายการ + **Prompt Directive** ภาษาอังกฤษต่อคีย์ใน `MOOD_LLM_DIRECTIVE_BY_KEYWORD`

## แหล่งที่มา

| ส่วน | ไฟล์ |
|------|------|
| อาร์เรย์ `MOOD_KEYWORDS` | `CONTENT_CORE/02-master-prompt-template.js`, `1click-full-v3.40 (2)/js/promptTemplate.js`, `CONTENT_CORE/02b-hook-library.js`, `1click-web-app/js/promptTemplate.js`, `1click-full-v3.40 (2)/js/promptTemplate.original.js` |
| LLM directive ต่อคีย์ | `1click-full-v3.40 (2)/js/storymodePromptEnrich.js` (`export const MOOD_LLM_DIRECTIVE_BY_KEYWORD`), `storymode-mock-enrich-bundle.js` (ชุดเดียวกัน) |
| ป้ายไทย UI | `1click-full-v3.40 (2)/js/sidepanel.js` → `initSMMoodDropdown` → `MOOD_THAI_LABELS` |
| Mock HTML | `story-config-mock.html` |
| SYSTEM รายการ mood ในข้อความยาว | `CONTENT_CORE/02-master-prompt-template.js` (บรรทัด **Mood Keywords:** ในเทมเพลต) |

## รายการ 38 คีย์ (ลำดับเดียวกันทุกที่)

1. Cinematic Standard  
2. Emotional Drama  
3. Action Explosive  
4. Dark & Gritty  
5. Mystery Noir  
6. Red Alert / Conflict  
7. Romantic Drama  
8. Horror / Thriller  
9. Bright & Airy  
10. Rainy & Lonely  
11. Lo-Fi Cozy  
12. Vivid & Energetic  
13. Mute & Earth Tone  
14. Nature Organic  
15. Y2K Pop Energy  
16. Surreal Comedy  
17. Mutelu Mystical  
18. Thai Street Night  
19. Thai Vintage Town  
20. Vivid Thai Summer  
21. Thai Festival  
22. Local Homey  
23. Cyberpunk Neon  
24. Product Hero Clean  
25. ASMR Unboxing  
26. Beauty & Skincare Glow  
27. Food Porn Satisfying  
28. Rich & Flex  
29. Before & After Drama  
30. Haul & Lifestyle  
31. UGC Raw / Authentic  
32. Talking Head / POV  
33. Fisheye / Ultra Wide  
34. POV Bodycam  
35. Trending Transition  
36. Duet / Stitch Ready  
37. Glitch & Retro Digital  
38. Viral Hook Opener  

Directive แต่ละตัวอยู่ใน source เป็น string เดียวใน `MOOD_LLM_DIRECTIVE_BY_KEYWORD` (ดูไฟล์ข้างต้น)

## หมายเหตุ

- ค่า default `smMoodKeyword` ใน `sidepanel.js` ยังเป็น `Cinematic Standard` (ยังอยู่ในรายการ)
- โปรเจกต์อื่นที่ import `MOOD_KEYWORDS` เก่า (40 + emoji ในชื่อ) ต้องอัปเดตคีย์ให้ตรง 38 ชุดนี้
