/**
 * CONTENT_CORE/08-visual-style-templates.js
 * Per-visual-style image+video prompt templates
 * Source: sidepanel.js getVisualStylePromptTemplates() ~line 12013
 */

// ==================== getVisualStylePromptTemplates ====================
// Lines 12013–12112 of sidepanel.js (100 lines)
// External variable read: studioSelectedVisual
// Returns: templates[studioSelectedVisual] || defaultTemplate
// Fields: imagePrompt, videoPrompt (note: NOT imageTemplate/videoTemplate)

export function getVisualStylePromptTemplates(studioSelectedVisual) {
  const templates = {
    // ── Pixar 3D / Disney ──
    'disney': {
      imagePrompt: `Pixar 3D Animation style, vibrant colors, expressive characters, smooth rendering, Disney-quality lighting. [SCENE_DESCRIPTION]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent young Thai female voice throughout entire clip, do NOT switch voice gender. Only animate the existing characters from the image, do not add new characters or change their appearance. Character says in Thai with young Thai female voice: "[DIALOGUE]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`
    },

    // ── Photorealistic Cinematic ──
    'cinematic': {
      imagePrompt: `Photorealistic cinematic style, natural lighting, high detail texture, realistic proportions, movie-quality visuals, 8K resolution. [CAMERA_ANGLE]. [SCENE_DESCRIPTION]. [Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `[SCENE_ACTION]. [CAMERA_STYLE], [AUDIO_STYLE]. Realistic movement, natural motion. NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, stable form, no morphing`
    },

    // ── Studio Ghibli ──
    'ghibli': {
      imagePrompt: `Studio Ghibli anime style, hand-drawn aesthetic, soft watercolor backgrounds, gentle lighting, Japanese animation. [SCENE_DESCRIPTION]. No bold text overlay, no title text, no headline text on the image. Scene-decorative text like shop signs or labels is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], with young Thai female voice voiceover narration, MUST use young Thai female voice only, do NOT switch to different voice gender, NO lip sync, character does NOT speak, background narration only. Thai voiceover narrated by young Thai female voice says: "[DIALOGUE]" NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, NO titles, NO watermarks, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`
    },

    // ── Claymation ──
    'claymation': {
      imagePrompt: `Claymation stop-motion style like Wallace & Gromit, tactile clay textures, handmade feel, warm studio lighting. [SCENE_DESCRIPTION]. No bold text overlay, no title text. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice throughout entire clip. Only animate the existing characters from the image. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`
    },

    // ── Cyberpunk ──
    'cyberpunk': {
      imagePrompt: `Cyberpunk neon style, glowing neon lights, futuristic dark atmosphere, volumetric fog, rain-slick reflective surfaces, holographic UI elements. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative neon signs and holographic text are OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice. Neon lights flicker subtly. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing`
    },

    // ── UGC Raw / Creative Scene ──
    'ugc_raw': {
      imagePrompt: `สร้างภาพโฆษณาสินค้ามืออาชีพ [SCENE_DESCRIPTION] REAL HUMAN PHOTO single image, no collage, no multiple panels, no split screen Use the exact product appearance from the attached reference image (pd-product.png). The bold text overlay MUST be in Thai language (ภาษาไทย).`,
      videoPrompt: `[SCENE_ACTION] ถือสินค้าโชว์ บทพูดไทย "[DIALOGUE]" มุมกล้องตั้งนิ่งจนจบคลิป ใช้ฉากและการจัดวางตามภาพที่แนบ NO subtitles or text overlays, NO on-screen dialogue text, NO captions of any kind, All dialogue is AUDIO ONLY reduce contrast, natural skintone, soft highlights, no oversharpen, low contrast, soft colors, natural tone, film look, soft light`
    },

    // ── Thai Street ──
    'thai_street': {
      imagePrompt: `Thai street food night market style, neon signs, steam and smoke, authentic Bangkok atmosphere. [SCENE_DESCRIPTION]. REAL HUMAN PHOTO single image, no collage. Use the exact product appearance from the attached reference image (pd-product.png). The bold text overlay MUST be in Thai language (ภาษาไทย).`,
      videoPrompt: `[SCENE_ACTION] ถือสินค้าโชว์ บทพูดไทย "[DIALOGUE]" มุมกล้องตั้งนิ่งจนจบคลิป NO subtitles or text overlays, NO captions, All dialogue is AUDIO ONLY reduce contrast, natural skintone, soft light, warm night market tones`
    },

    // ── Crochet / Amigurumi ──
    'crochet': {
      imagePrompt: `Amigurumi crochet style, everything made of yarn and wool, soft knitted textures, handcrafted feel. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, MUST maintain consistent voice. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing`
    },

    // ── Plushie ──
    'plushie': {
      imagePrompt: `Plushie felt toy style, fluffy soft textures, cute stuffed animal aesthetic, warm soft lighting. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, MUST maintain consistent voice. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing`
    },

    // ── Dragon Ball ──
    'dragonball': {
      imagePrompt: `Dragon Ball anime style, muscular characters, dynamic action poses, bold lines, energy auras, speed lines. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`
    },

    // ── 90s Anime ──
    '90sanime': {
      imagePrompt: `90s Japanese anime style like Sailor Moon, sparkly eyes, soft glowing lighting, retro anime. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing`
    },

    // ── 90s Anime ──
    '90sanime': {
      imagePrompt: `90s Japanese anime style like Sailor Moon, sparkly eyes, soft glowing lighting, retro anime. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing`
    },

    // ── Watercolor ──
    'watercolor': {
      imagePrompt: `Watercolor painting style, soft flowing colors, artistic brush strokes, dreamy translucent layers. [SCENE_DESCRIPTION]. No bold text overlay.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], with young Thai female voice voiceover narration, background narration only. Thai voiceover says: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form`
    },

    // ── Pop Art ──
    'popart': {
      imagePrompt: `Pop Art comic style, bold colors, halftone dots, Roy Lichtenstein inspired, thick black outlines. [SCENE_DESCRIPTION]. No bold text overlay outside comic bubbles.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form`
    },

    // ── Pixel Art ──
    'pixel': {
      imagePrompt: `8-bit pixel art style, retro video game aesthetic, limited color palette, blocky characters, nostalgic feel. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative pixel text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, retro 8-bit animation movement. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form`
    },

    // ── LEGO ──
    'lego': {
      imagePrompt: `LEGO brick style, everything made of LEGO blocks, toy photography, bright studio lighting. [SCENE_DESCRIPTION]. No bold text overlay. Scene-decorative LEGO text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
      videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, stop-motion LEGO animation style. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing`
    }
  };

  const defaultTemplate = {
    imagePrompt: `[VISUAL_STYLE]. [SCENE_DESCRIPTION]. No bold text overlay, no title text. Scene-decorative text is OK.\n\n[Character Reference: [CHARACTER_REFS]]`,
    videoPrompt: `ACTION ONLY: [SCENE_ACTION], speaking with young Thai female voice, lip movement synced to audio, MUST maintain consistent voice. Character says in Thai: "[DIALOGUE]" NO subtitles, NO text overlays, All dialogue is AUDIO ONLY, stable form, no morphing, no extra limbs`
  };
  
  return templates[studioSelectedVisual] || templates['disney'] || defaultTemplate;
}
