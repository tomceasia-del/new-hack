#!/usr/bin/env python3
"""
Mall Mode pipeline — standalone module.

External inputs (API contract):
  user_prompt      : str           — main brief; client may prepend a block `【ข้อมูลจากการวิเคราะห์รูปสินค้าจริง — อ้างอิงเท่านั้น】` with JSON-derived facts from the product image so every scene stays grounded on that SKU (prices/promo only from that block or explicit user text)
  scene_count      : int 1-20      — number of scenes to generate
  reference_image  : str | None    — base64-encoded image data (optional)
  image_mime_type  : str           — default "image/jpeg" (used only with reference_image)
  enforce_forbidden: bool = True   — run forbidden-phrase gate on input + output

Rollup (same JSON object):
  voice_profile_th : str — Thai: one fixed narrator persona for **all** scenes (age vibe, gender tone,
                          pace, word choices). Every voice_script_th must sound like this same person.

Per-scene output schema:
  scene_number     : int (1-based)
  hero_id          : str (one of 6 heroes)
  scene_atmosphere : str (one of 6 atmospheres)
  store_id         : str | None
  name_on_sign     : str | None    — exact sign name for cloning
  image_prompt     : str           — English, first-person POV
  video_prompt     : str           — English; include one short Thai clause that voice matches voice_profile_th + voice_script_th (for editing consistency)
  caption_th       : str           — Thai TikTok caption in hero's voice
  voice_script_th  : str           — Thai spoken lines for VO/TTS this scene only (~15–20 words); must match voice_profile_th and hero_id tone

Forbidden gate runs on:
  - user_prompt (input)  → warning attached, Gemini still called
  - all text fields in each scene (output) → warnings listed per field
"""
from __future__ import annotations

import json
import os
import re
import ssl
import urllib.error
import urllib.parse
import urllib.request

# ─── paths ───────────────────────────────────────────────────────────

ROOT = os.path.dirname(os.path.realpath(__file__))
GEM_PACK = os.path.join(ROOT, "GEM_PACK_TIKTOK")
CONTENT_CORE_DIR = os.path.join(ROOT, "CONTENT_CORE")

# same fallback chain as serve_story_mock.py
GEMINI_MODEL_CHAIN = (
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
)

# ─── knowledge loading (lazy, cached) ────────────────────────────────

_KNOWLEDGE_CACHE: dict[str, str] | None = None
_FORBIDDEN_CACHE: list[str] | None = None


def load_mall_knowledge() -> dict[str, str]:
    """Load heroes / stamp / catalog markdown files (cached after first read)."""
    global _KNOWLEDGE_CACHE
    if _KNOWLEDGE_CACHE is not None:
        return _KNOWLEDGE_CACHE
    files = {
        "heroes":  os.path.join(GEM_PACK, "gem-kn-mall-mode-heroes.md"),
        "stamp":   os.path.join(GEM_PACK, "gem-kn-mall-mode-prompt-stamp.md"),
        "catalog": os.path.join(GEM_PACK, "gem-kn-mall-mode-store-catalog.md"),
    }
    _KNOWLEDGE_CACHE = {}
    for key, path in files.items():
        with open(path, "r", encoding="utf-8") as f:
            _KNOWLEDGE_CACHE[key] = f.read()
    return _KNOWLEDGE_CACHE


def load_forbidden_phrases() -> list[str]:
    """Extract forbidden phrase list from 01-forbidden-marketing-phrases.js (cached)."""
    global _FORBIDDEN_CACHE
    if _FORBIDDEN_CACHE is not None:
        return _FORBIDDEN_CACHE
    path = os.path.join(CONTENT_CORE_DIR, "01-forbidden-marketing-phrases.js")
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        m = re.search(r"`([^`]+)`", content, re.DOTALL)
        raw = m.group(1) if m else ""
    except OSError:
        raw = ""
    _FORBIDDEN_CACHE = [line.strip() for line in raw.splitlines() if line.strip()]
    return _FORBIDDEN_CACHE


# ─── system prompt ───────────────────────────────────────────────────

def build_system_prompt(scene_count: int) -> str:
    """Build the Gemini system prompt embedding all mall knowledge."""
    kn = load_mall_knowledge()
    return f"""You are running in **Mall Mode (โหมดห้าง)** — a standalone TikTok content generation system.
Your task: generate exactly **{scene_count}** realistic first-person POV mall scene prompt(s).

---
## HEROES (6 types)
{kn['heroes']}

---
## PROMPT STAMP (rules, POV rules, checklist)
{kn['stamp']}

---
## STORE CATALOG (real sign names, tags)
{kn['catalog']}

---
## OUTPUT FORMAT

Respond with a **single valid JSON object** (not an array at top level). No markdown fences. No text before/after the JSON.

Shape:
{{
  "voice_profile_th": "<Thai: ONE narrator — AT LEAST 4–8 sentences: age range, speech pace, particles/habit words, mall-shopper vibe; if user names a target product, describe pack/color/shape ONCE in detail for reuse — PROMPT STAMP §5e>",
  "scenes": [
    {{
      "scene_number":     <int, 1-based>,
      "hero_id":          <"deal_spot"|"trend_find"|"restock_win"|"bulk_value"|"try_love"|"diy_trade">,
      "scene_atmosphere": <"pharmacy_health"|"cosmetics_open"|"department_store"|"supermarket_aisle"|"electronics_floor"|"building_megastore">,
      "store_id":         <store_id from catalog, or null>,
      "name_on_sign":     <exact name_on_sign from catalog, or null>,
      "image_prompt":     <English; first-person POV; realistic store clone; specific branding>,
      "video_prompt":     <English POV walking + optionally one short Thai clause echoing voice_script_th mood — same narrator as voice_profile_th>,
      "caption_th":       <Thai; TikTok caption; match hero_id §5b–5c; CTA buy on TikTok; no forbidden phrases>,
      "voice_script_th":  <Thai; walking POV dialogue for THIS scene — NEVER empty; ~18–40 Thai words ok when repeating full product name + pack traits; MUST match voice_profile_th AND hero_id §5c>
    }},
    ... exactly {scene_count} objects in `scenes`
  ]
}}

## STRICT RULES
1. ALL camera angles: **first-person POV only** (กล้องอยู่ที่สายตาคนเดิน — ห้ามมุม third-person ทุกกรณี)
2. Use exact `name_on_sign` from catalog to clone store atmosphere (ป้ายจริง, สีร้านจริง)
3. NEVER use forbidden phrases: การันตี, รับรอง, เห็นผลทันที, ขาวเร่งด่วน, ลดน้ำหนัก,
   Best Seller, No.1, Before After, ปาฏิหาริย์, ดีที่สุด, การันตีผล, ฯลฯ
4. **Voice consistency (Thai):** `voice_profile_th` defines the single speaker for the whole clip series. Every `voice_script_th` must sound like that same person while following each scene's `hero_id` per PROMPT STAMP §5c. Follow **§5e** for long persona + identical brand/pack spelling across scenes.
5. **`caption_th` voice — must match `hero_id`:** Follow PROMPT STAMP sections **§5b** and **§5c**. `voice_script_th` is the lines read aloud; `caption_th` can be slightly punchier for TikTok but same narrator identity as `voice_profile_th`.
6. **Anti-patterns for `caption_th` / `voice_script_th`:** Do NOT write like a TV ad or studio reviewer. DO write like one real shopper walking — spontaneity, reacting to POV.
7. Output ONLY the JSON object — no markdown, no preamble, no explanation
8. **Product grounding:** The user message may include a Thai block `【ข้อมูลจากการวิเคราะห์รูปสินค้าจริง — อ้างอิงเท่านั้น】` with structured facts from the **reference product image**. Every scene must describe **that exact product** (brand, pack, colors, visible text). Do NOT swap in a different SKU or invent packaging from retail memory.
9. **Price / promo / ป้ายลด:** Percent-off, baht prices, bundle deals, expiry lines — **only** if stated in that image-analysis block or in explicit user text. **Never** invent sale numbers or shelf-sticker wording from model memory. If no price/promo appears there, write scenes **without** fabricated prices or fake promo copy.
10. **Names & spelling lock:** Mall name, store sign, and product brand (e.g. Q'Care White, yellow box, blue jar) must use the **same spelling and descriptors** in every scene — PROMPT STAMP **§5e**.
11. **Hero walking dialogue:** Every scene MUST include non-empty `voice_script_th` — natural monologue while walking/stopping in POV; no silent scenes.
"""


# ─── parse Gemini JSON (object with scenes + voice_profile_th, or legacy array) ─


def parse_mall_gemini_json(raw_text: str) -> tuple[list[dict], str | None]:
    """
    Parse Gemini response: preferred `{ voice_profile_th, scenes }` or legacy `[ ... ]`.
    Returns (scenes, voice_profile_th or None).
    """
    stripped = raw_text.strip()
    stripped = re.sub(r"^```(?:json)?\s*", "", stripped, flags=re.IGNORECASE)
    stripped = re.sub(r"\s*```$", "", stripped)

    try:
        data = json.loads(stripped)
        if isinstance(data, dict):
            sc = data.get("scenes")
            if isinstance(sc, list):
                vp = data.get("voice_profile_th")
                voice_profile_th: str | None = (
                    vp.strip() if isinstance(vp, str) and vp.strip() else None
                )
                return sc, voice_profile_th
        if isinstance(data, list):
            return data, None
    except json.JSONDecodeError:
        pass

    m = re.search(r"\[.*\]", stripped, re.DOTALL)
    json_str = m.group(0) if m else stripped
    scenes = json.loads(json_str)
    if not isinstance(scenes, list):
        scenes = [scenes]
    return scenes, None


# ─── forbidden check ─────────────────────────────────────────────────

def check_forbidden(text: str, phrases: list[str] | None = None) -> list[str]:
    """Return list of forbidden phrases found in text (case-insensitive substring)."""
    if phrases is None:
        phrases = load_forbidden_phrases()
    text_lower = text.lower()
    return [p for p in phrases if p.lower() in text_lower]


# ─── request validation (contract-api) ───────────────────────────────

def validate_request(body: dict) -> tuple[bool, str]:
    """
    Validate incoming mall mode request body.
    Returns (ok, error_message).
    """
    user_prompt = body.get("user_prompt")
    if not isinstance(user_prompt, str) or not user_prompt.strip():
        return False, "user_prompt ต้องไม่ว่าง (string)"

    scene_count = body.get("scene_count", 1)
    if not isinstance(scene_count, int) or not (1 <= scene_count <= 20):
        return False, "scene_count ต้องเป็น integer 1–20"

    ref_img = body.get("reference_image")
    if ref_img is not None and not isinstance(ref_img, str):
        return False, "reference_image ต้องเป็น base64 string หรือ null"

    mime = body.get("image_mime_type", "image/jpeg")
    if not isinstance(mime, str):
        return False, "image_mime_type ต้องเป็น string"

    enforce = body.get("enforce_forbidden", True)
    if not isinstance(enforce, bool):
        return False, "enforce_forbidden ต้องเป็น boolean"

    return True, ""


# ─── Gemini HTTP helper ───────────────────────────────────────────────

def _http_post_json(url: str, payload: dict, timeout: int = 180) -> tuple[int, dict]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            raw = r.read().decode("utf-8", errors="replace")
            return r.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace") if e.fp else ""
        try:
            return e.code, json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return e.code, {"error": {"message": raw or str(e)}}


# ─── main pipeline ────────────────────────────────────────────────────

def run_mall_mode(body: dict, gemini_key: str) -> dict:
    """
    Full mall mode pipeline:
      validate → forbidden(input) → build Gemini request →
      call Gemini (multimodal if image) → parse JSON →
      forbidden(output) → return scenes

    Args:
        body       : parsed JSON request dict
        gemini_key : Gemini API key (from env)

    Returns dict with keys:
        ok               : bool
        scenes           : list[dict]     — present when ok=True
        voice_profile_th : str | None     — Thai narrator profile (when JSON object format)
        scene_count      : int
        model            : str            — model that responded
        warnings         : list[str]      — forbidden-phrase hits (non-blocking)
        error            : str            — present when ok=False
        raw              : str            — Gemini raw text on parse failure
    """
    # 1. validate
    ok, err = validate_request(body)
    if not ok:
        return {"ok": False, "error": err}

    user_prompt: str  = body["user_prompt"].strip()
    scene_count: int  = int(body.get("scene_count", 1))
    enforce: bool     = bool(body.get("enforce_forbidden", True))
    ref_image: str | None = body.get("reference_image")
    image_mime: str   = body.get("image_mime_type", "image/jpeg")

    warnings: list[str] = []

    # 2. input forbidden check (warn, do not block)
    if enforce:
        hits = check_forbidden(user_prompt)
        if hits:
            warnings.append(
                "user_prompt มีคำต้องห้าม: "
                + ", ".join(hits[:8])
                + " — ระบบจะหลีกเลี่ยงในผลลัพธ์"
            )

    # 3. build Gemini request
    system_prompt = build_system_prompt(scene_count)

    parts: list[dict] = []
    if ref_image:
        parts.append({"inlineData": {"mimeType": image_mime, "data": ref_image}})
    parts.append({"text": f"สร้าง {scene_count} ซีน สำหรับ: {user_prompt}"})

    request_body: dict = {
        "contents": [{"role": "user", "parts": parts}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {
            "maxOutputTokens": 8192,
            "temperature": 0.7,
            "topP": 0.9,
        },
    }

    # 4. call Gemini with fallback chain
    last_err: str | None = None
    raw_text = ""
    used_model = ""

    for i, model in enumerate(GEMINI_MODEL_CHAIN):
        gurl = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={urllib.parse.quote(gemini_key)}"
        )
        try:
            st, data = _http_post_json(gurl, request_body)
        except (urllib.error.URLError, OSError, json.JSONDecodeError) as e:
            last_err = str(e)
            if i < len(GEMINI_MODEL_CHAIN) - 1:
                continue
            return {"ok": False, "error": last_err}

        if st == 429:
            last_err = "429 rate limit"
            continue
        if st != 200:
            em = (data.get("error") or {}).get("message") if isinstance(data, dict) else None
            if i < len(GEMINI_MODEL_CHAIN) - 1 and st not in (401, 403):
                last_err = em or f"HTTP {st}"
                continue
            return {"ok": False, "error": em or f"HTTP {st}"}

        cands = (data or {}).get("candidates") or []
        c0 = cands[0] if cands else {}
        pfb = (data or {}).get("promptFeedback") or {}
        block_reason = pfb.get("blockReason") or c0.get("finishReason")
        if block_reason in ("PROHIBITED_CONTENT", "SAFETY", "BLOCKLIST"):
            if i < len(GEMINI_MODEL_CHAIN) - 1:
                last_err = str(block_reason)
                continue

        cparts = ((c0.get("content") or {}).get("parts") or [])
        raw_text = (
            cparts[0].get("text")
            if cparts and isinstance(cparts[0], dict)
            else None
        ) or ""
        used_model = model
        break

    if not raw_text:
        return {"ok": False, "error": last_err or "Gemini ไม่ตอบกลับ"}

    # 5. parse JSON (object with voice_profile_th + scenes, or legacy array)
    voice_profile_th: str | None = None
    try:
        scenes, voice_profile_th = parse_mall_gemini_json(raw_text)
    except json.JSONDecodeError as e:
        return {
            "ok": False,
            "error": f"ไม่สามารถ parse JSON จาก Gemini: {e}",
            "raw": raw_text,
        }

    # 6. output forbidden check (warn per field, do not strip)
    if enforce:
        forbidden_phrases = load_forbidden_phrases()
        if voice_profile_th:
            hits = check_forbidden(voice_profile_th, forbidden_phrases)
            if hits:
                warnings.append("voice_profile_th: " + ", ".join(hits))
        for scene in scenes:
            for field in ("image_prompt", "video_prompt", "caption_th", "voice_script_th"):
                text = scene.get(field, "")
                if not isinstance(text, str):
                    continue
                hits = check_forbidden(text, forbidden_phrases)
                if hits:
                    warnings.append(
                        f"scene {scene.get('scene_number', '?')} [{field}]: "
                        + ", ".join(hits)
                    )

    result: dict = {
        "ok": True,
        "scenes": scenes,
        "scene_count": len(scenes),
        "model": used_model,
    }
    if voice_profile_th:
        result["voice_profile_th"] = voice_profile_th
    if warnings:
        result["warnings"] = warnings
    return result
