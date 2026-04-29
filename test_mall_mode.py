#!/usr/bin/env python3
"""
Mall Mode smoke test — รัน end-to-end โดยตรงผ่าน mall_mode.run_mall_mode()
ไม่ต้องเปิด server ก่อน — ต้องการ GEMINI_API_KEY ใน environment

Usage:
    export GEMINI_API_KEY=your_key
    python test_mall_mode.py

Optional: ส่งรูปอ้างอิงเป็น base64
    python test_mall_mode.py --image /path/to/product.jpg
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys

# ── path setup ──────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, ROOT)

from mall_mode import (  # noqa: E402
    validate_request,
    check_forbidden,
    load_mall_knowledge,
    load_forbidden_phrases,
    parse_mall_gemini_json,
    run_mall_mode,
)

PASS = "\033[32m✓\033[0m"
FAIL = "\033[31m✗\033[0m"
WARN = "\033[33m⚠\033[0m"


def header(title: str) -> None:
    print(f"\n{'─'*60}")
    print(f"  {title}")
    print(f"{'─'*60}")


def assert_ok(condition: bool, label: str) -> bool:
    icon = PASS if condition else FAIL
    print(f"  {icon}  {label}")
    return condition


# ── unit tests (no network) ─────────────────────────────────────────

def test_knowledge_loading() -> bool:
    header("1 · Knowledge loading")
    ok = True
    kn = load_mall_knowledge()
    ok &= assert_ok("heroes" in kn and len(kn["heroes"]) > 100, "heroes.md loaded")
    ok &= assert_ok("stamp" in kn and len(kn["stamp"]) > 100, "stamp.md loaded")
    ok &= assert_ok("catalog" in kn and len(kn["catalog"]) > 100, "catalog.md loaded")
    phrases = load_forbidden_phrases()
    ok &= assert_ok(len(phrases) >= 50, f"forbidden phrases loaded ({len(phrases)} entries)")
    return ok


def test_validate_request() -> bool:
    header("2 · Request validation")
    ok = True

    valid, _ = validate_request({"user_prompt": "เลือกลิปสติกที่ Sephora", "scene_count": 3})
    ok &= assert_ok(valid, "valid request passes")

    invalid, err = validate_request({"user_prompt": "", "scene_count": 3})
    ok &= assert_ok(not invalid, f"empty user_prompt rejected: {err}")

    invalid, err = validate_request({"user_prompt": "test", "scene_count": 0})
    ok &= assert_ok(not invalid, f"scene_count=0 rejected: {err}")

    invalid, err = validate_request({"user_prompt": "test", "scene_count": 25})
    ok &= assert_ok(not invalid, f"scene_count=25 rejected: {err}")

    invalid, err = validate_request({"user_prompt": "test", "scene_count": 2, "enforce_forbidden": "yes"})
    ok &= assert_ok(not invalid, f"enforce_forbidden=string rejected: {err}")

    return ok


def test_forbidden_check() -> bool:
    header("3 · Forbidden phrase check")
    ok = True

    hits = check_forbidden("สินค้านี้รับประกันผล 100% การันตีเห็นผลทันที")
    ok &= assert_ok(len(hits) > 0, f"detects forbidden phrases: {hits[:3]}")

    hits_clean = check_forbidden("ของดี น่าลอง ราคาคุ้ม")
    ok &= assert_ok(len(hits_clean) == 0, "clean text passes: no hits")

    return ok


def test_parse_mall_gemini_json() -> bool:
    header("3b · parse_mall_gemini_json (object + legacy array)")
    ok = True
    raw_obj = (
        '{"voice_profile_th": "พูดแบบสาววัยทำงาน ค่ะ", '
        '"scenes": [{"scene_number": 1, "caption_th": "ทดสอบ"}]}'
    )
    scenes, vp = parse_mall_gemini_json(raw_obj)
    ok &= assert_ok(vp == "พูดแบบสาววัยทำงาน ค่ะ", "object format: voice_profile_th")
    ok &= assert_ok(len(scenes) == 1 and scenes[0].get("scene_number") == 1, "object format: scenes")

    raw_arr = '[{"scene_number": 1, "caption_th": "เก่า"}]'
    scenes2, vp2 = parse_mall_gemini_json(raw_arr)
    ok &= assert_ok(vp2 is None, "legacy array: no voice_profile_th")
    ok &= assert_ok(len(scenes2) == 1, "legacy array: one scene")
    return ok


# ── integration test (requires GEMINI_API_KEY) ───────────────────────

def test_gemini_pipeline(gemini_key: str, ref_image_path: str | None = None) -> bool:
    header("4 · Gemini pipeline — end-to-end (Watsons, 2 scenes)")

    body: dict = {
        "user_prompt": "เดินแผนกดูแลผิวที่ Watsons บน Central The Mall Robinson หยิบ moisturizer แล้วเทียบ 2 แบรนด์",
        "scene_count": 2,
        "enforce_forbidden": True,
    }

    if ref_image_path:
        try:
            with open(ref_image_path, "rb") as f:
                body["reference_image"] = base64.b64encode(f.read()).decode()
            # infer mime type from extension
            ext = os.path.splitext(ref_image_path)[1].lower()
            body["image_mime_type"] = {"jpg": "image/jpeg", "jpeg": "image/jpeg",
                                        "png": "image/png", "webp": "image/webp"}.get(ext.lstrip("."), "image/jpeg")
            print(f"  · reference image: {ref_image_path}")
        except OSError as e:
            print(f"  {WARN}  ไม่สามารถอ่านรูป: {e} — ทดสอบแบบไม่มีรูปแทน")

    print(f"  · user_prompt: {body['user_prompt'][:60]}…")
    print(f"  · scene_count: {body['scene_count']}")

    result = run_mall_mode(body, gemini_key)

    ok = True
    ok &= assert_ok(result.get("ok") is True, f"pipeline ok (model: {result.get('model', 'n/a')})")

    if not result.get("ok"):
        print(f"  {FAIL}  error: {result.get('error')}")
        if result.get("raw"):
            print(f"  raw (first 300 chars): {result['raw'][:300]}")
        return False

    scenes = result.get("scenes", [])
    ok &= assert_ok(len(scenes) == 2, f"got {len(scenes)} scenes (expected 2)")

    for scene in scenes:
        n = scene.get("scene_number", "?")
        hero = scene.get("hero_id", "missing")
        atm = scene.get("scene_atmosphere", "missing")
        store = scene.get("name_on_sign") or scene.get("store_id") or "–"
        img = scene.get("image_prompt", "")
        vid = scene.get("video_prompt", "")
        cap = scene.get("caption_th", "")

        ok &= assert_ok(bool(img), f"scene {n}: image_prompt present")
        ok &= assert_ok(bool(vid), f"scene {n}: video_prompt present")
        ok &= assert_ok(bool(cap), f"scene {n}: caption_th present")

        pov_ok = "pov" in img.lower() or "first-person" in img.lower() or "first person" in img.lower()
        ok &= assert_ok(pov_ok, f"scene {n}: image_prompt contains POV keyword")

        print(f"\n  ── Scene {n} ──────────────────────────────────────")
        print(f"     hero: {hero}  |  atmosphere: {atm}  |  store: {store}")
        print(f"     image_prompt : {img[:120]}…")
        print(f"     video_prompt : {vid[:120]}…")
        print(f"     caption_th   : {cap[:80]}…")

    if result.get("warnings"):
        print(f"\n  {WARN}  Warnings ({len(result['warnings'])}):")
        for w in result["warnings"]:
            print(f"       · {w}")

    return ok


# ── main ─────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Mall Mode smoke test")
    parser.add_argument("--image", metavar="PATH", help="optional reference image path")
    args = parser.parse_args()

    all_ok = True
    all_ok &= test_knowledge_loading()
    all_ok &= test_validate_request()
    all_ok &= test_forbidden_check()
    all_ok &= test_parse_mall_gemini_json()

    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        print(f"\n  {WARN}  GEMINI_API_KEY ไม่พบ — ข้ามการทดสอบ Gemini pipeline")
        print("       ตั้งค่า: export GEMINI_API_KEY=your_key แล้วรันใหม่")
    else:
        all_ok &= test_gemini_pipeline(key, ref_image_path=args.image)

    header("Summary")
    if all_ok:
        print(f"  {PASS}  ทุก test ผ่าน\n")
        return 0
    else:
        print(f"  {FAIL}  มี test ที่ไม่ผ่าน — ดู log ด้านบน\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
