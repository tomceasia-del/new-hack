#!/usr/bin/env python3
"""
เซิร์ฟ story-config-mock.html ผ่าน http://127.0.0.1 อย่าง robust
- ใช้ SimpleHTTPRequestHandler + directory=ROOT (เสิร์ฟทุกไฟล์ใน workspace root อย่างปลอดภัย)
  → รองรับทั้ง story-config-mock.html, story-config-result.html, JS คู่หน้า, favicon
- มี endpoint เดียวกับ Vercel: GET /api/gemini-verify, POST /api/gemini (key จาก GEMINI_API_KEY ใน environment)
  → ผู้ใช้ mock รันจาก URL นี้จะใช้ API ของคุณเป็น backend ไม่ฝัง key ใน browser
- ฆ่า server เก่าในช่วง 8777-8799 ก่อนทุกครั้ง
- เลือกพอร์ตแรกที่ว่างได้, อัพเดต story-mock-server.url
- เปิดเบราว์เซอร์อัตโนมัติไปหน้า login — `GET /` จะ 302 ไป `login.html` (mock หลักยังใช้ที่ `story-config-mock.html` หรือ `/cs` บน Vercel)
- Ctrl+C ปิดสะอาด
"""
from __future__ import annotations

import http.server
import json
import os
import platform
import signal
import socket
import socketserver
import ssl
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.realpath(__file__))
PORT_LO, PORT_HI = 8777, 8799
MOCK_HTML = "story-config-mock.html"
LOGIN_HTML = "login.html"
URL_FILE = os.path.join(ROOT, "story-mock-server.url")

# สอดคล้องกับ api/gemini.js + storymode-mock-gemini-core.js
GEMINI_MODEL_CHAIN = (
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
)


def _gemini_key() -> str | None:
    k = os.environ.get("GEMINI_API_KEY", "").strip()
    return k or None


def _cors_api_headers(handler: http.server.BaseHTTPRequestHandler) -> None:
    """ให้ client อื่น (หรือ dev แยกพอร์ต) เรียก API คุณเป็น backend ได้"""
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")


def _http_get_json(url: str, timeout: int = 45) -> tuple[int, dict]:
    req = urllib.request.Request(url, method="GET")
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


def _http_post_json(url: str, body: dict, timeout: int = 180) -> tuple[int, dict]:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
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


def log(msg: str) -> None:
    print(msg, flush=True)


def kill_old_servers() -> None:
    """ฆ่า process ที่ listen อยู่บน 127.0.0.1:8777-8799 (เฉพาะของโปรเจ็กต์นี้)"""
    killed = []
    for port in range(PORT_LO, PORT_HI + 1):
        try:
            out = subprocess.check_output(
                ["lsof", "-ti", f"TCP:127.0.0.1:{port}"],
                stderr=subprocess.DEVNULL,
                timeout=2,
            ).decode().split()
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
            continue
        for pid in out:
            try:
                pid_int = int(pid)
                if pid_int == os.getpid():
                    continue
                os.kill(pid_int, signal.SIGTERM)
                killed.append((port, pid_int))
            except (ValueError, ProcessLookupError, PermissionError):
                pass
    if killed:
        time.sleep(0.3)
        log(f"  ปิด server เก่า: {killed}")


def pick_port() -> int | None:
    for p in range(PORT_LO, PORT_HI + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    return None


class MockHandler(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler ที่ pin directory ไว้ที่ ROOT + /api/gemini* เป็น backend จริง (GEMINI_API_KEY)"""

    server_version = "story-mock/3+api"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        # เงียบ request ปกติ 200/304 — โชว์แค่ 4xx/5xx
        try:
            status = int(args[1]) if len(args) > 1 and str(args[1]).isdigit() else 0
        except (ValueError, IndexError):
            status = 0
        if status >= 400:
            sys.stderr.write(
                f"  [{self.log_date_time_string()}] {fmt % args}\n"
            )

    def end_headers(self):
        # dev: ห้าม cache เพื่อให้แก้ไฟล์แล้วรีเฟรชเห็นทันที
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _send_json(self, status: int, obj: dict) -> None:
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        _cors_api_headers(self)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:
        p = urllib.parse.urlparse(self.path).path
        if p in ("/api/gemini", "/api/gemini-verify"):
            self.send_response(204)
            _cors_api_headers(self)
            self.end_headers()
            return
        self.send_error(404, "Not found")

    def _handle_gemini_verify(self) -> None:
        k = _gemini_key()
        if not k:
            self._send_json(
                503,
                {"ok": False, "error": "ตั้งค่า GEMINI_API_KEY ใน environment ก่อน (export GEMINI_API_KEY=... )"},
            )
            return
        try:
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models"
                f"?pageSize=1&key={urllib.parse.quote(k)}"
            )
            st, body = _http_get_json(url)
            if st != 200 or (isinstance(body, dict) and body.get("error")):
                em = (body.get("error") or {}).get("message") if isinstance(body, dict) else None
                self._send_json(502, {"ok": False, "error": em or f"HTTP {st}"})
                return
            self._send_json(200, {"ok": True, "mode": "server"})
        except (urllib.error.HTTPError, urllib.error.URLError, OSError, json.JSONDecodeError) as e:
            self._send_json(500, {"ok": False, "error": str(e)})

    def _handle_gemini_post(self) -> None:
        k = _gemini_key()
        if not k:
            self._send_json(503, {"error": "GEMINI_API_KEY ยังไม่ได้ตั้งใน environment (ฝั่งเซิร์ฟเวอร์)"})
            return
        try:
            n = int(self.headers.get("Content-Length", 0) or 0)
            n = min(n, 12 * 1024 * 1024)
            raw = self.rfile.read(n) if n else b""
            body = json.loads(raw.decode("utf-8")) if raw else {}
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"error": "Invalid JSON body"})
            return

        system_prompt = str(body.get("systemPrompt") or "")
        user_text = str(body.get("userText") or "")
        images = body.get("images")
        if not isinstance(images, list):
            images = []
        if not user_text.strip():
            self._send_json(400, {"error": "userText ว่าง"})
            return

        parts: list[dict] = []
        for im in images:
            if not isinstance(im, dict):
                continue
            d, mt = im.get("data"), im.get("mimeType")
            if d and mt:
                parts.append({"inlineData": {"mimeType": str(mt), "data": str(d)}})
        parts.append({"text": user_text})
        request_body: dict = {"contents": [{"role": "user", "parts": parts}]}
        if system_prompt.strip():
            request_body["systemInstruction"] = {"parts": [{"text": system_prompt}]}

        client_gen = body.get("generationConfig")
        if not isinstance(client_gen, dict):
            client_gen = {}

        last_err: str | None = None
        for i, model in enumerate(GEMINI_MODEL_CHAIN):
            b = json.loads(json.dumps(request_body))
            b.setdefault("generationConfig", {})
            b["generationConfig"].setdefault("maxOutputTokens", 16384)
            b["generationConfig"].setdefault("temperature", 0.55)
            b["generationConfig"].setdefault("topP", 0.85)
            for k, v in client_gen.items():
                if k in ("temperature", "maxOutputTokens", "topP", "topK") and v is not None:
                    b["generationConfig"][k] = v
            gurl = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model}:generateContent?key={urllib.parse.quote(k)}"
            )
            try:
                st, data = _http_post_json(gurl, b, timeout=180)
                if st == 429:
                    last_err = "429 rate limit"
                    continue
                if st != 200:
                    em = (data.get("error") or {}).get("message") if isinstance(data, dict) else None
                    if (
                        i < len(GEMINI_MODEL_CHAIN) - 1
                        and st not in (401, 403)
                    ):
                        last_err = em or f"HTTP {st}"
                        continue
                    self._send_json(502 if st >= 500 else 400, {"error": em or f"HTTP {st}"})
                    return
                cands = (data or {}).get("candidates") or []
                c0 = cands[0] if cands else {}
                pfb = (data or {}).get("promptFeedback") or {}
                block_reason = pfb.get("blockReason") or c0.get("finishReason")
                if block_reason in ("PROHIBITED_CONTENT", "SAFETY", "BLOCKLIST"):
                    if i < len(GEMINI_MODEL_CHAIN) - 1:
                        last_err = str(block_reason)
                        continue
                cparts = ((c0.get("content") or {}).get("parts") or [])
                text = (cparts[0].get("text") if cparts and isinstance(cparts[0], dict) else None) or ""
                if not text:
                    fr = c0.get("finishReason") or pfb.get("blockReason") or "unknown"
                    self._send_json(502, {"error": f"Gemini ไม่ตอบกลับ ({fr})"})
                    return
                truncated = c0.get("finishReason") == "MAX_TOKENS"
                self._send_json(200, {"text": text, "model": model, "truncated": truncated})
                return
            except (urllib.error.HTTPError, urllib.error.URLError, OSError, json.JSONDecodeError) as e:
                last_err = str(e)
                if i < len(GEMINI_MODEL_CHAIN) - 1:
                    continue
                self._send_json(502, {"error": last_err})
                return
        self._send_json(502, {"error": last_err or "Gemini: all models failed"})

    def do_POST(self) -> None:
        p = urllib.parse.urlparse(self.path).path
        if p == "/api/gemini":
            self._handle_gemini_post()
            return
        self.send_error(404, "Not found")

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        p = parsed.path
        if p == "/api/gemini-verify":
            self._handle_gemini_verify()
            return
        if p in ("", "/"):
            target = LOGIN_HTML if os.path.isfile(os.path.join(ROOT, LOGIN_HTML)) else MOCK_HTML
            self.send_response(302)
            self.send_header("Location", f"/{target}")
            self.end_headers()
            return
        super().do_GET()


def open_browser(url: str) -> None:
    try:
        if platform.system() == "Darwin":
            subprocess.Popen(
                ["open", url],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return
    except OSError:
        pass
    try:
        import webbrowser
        webbrowser.open(url)
    except Exception:
        pass


def write_url_file(url: str) -> None:
    try:
        with open(URL_FILE, "w", encoding="utf-8") as f:
            f.write(url + "\n")
    except OSError:
        pass


def banner(url: str, mock_abs: str) -> None:
    log("")
    log("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    log("   Story Config Mock — เซิร์ฟเวอร์พร้อม (มี /api/gemini เป็น backend)")
    log("")
    log(f"   {url}  (หน้า login — mock หลัก: /{MOCK_HTML} หรือ /cs)")
    log(f"   ไฟล์ mock: {mock_abs}")
    log("")
    if _gemini_key():
        log("   ✓ GEMINI_API_KEY: ตั้งแล้ว — หน้า mock จะใช้ตัวนี้เป็น API backend (ไม่ต้องใส่ key ในบราวเซอร์)")
    else:
        log("   · ยังไม่มี GEMINI_API_KEY — export GEMINI_API_KEY=... ก่อนรัน หรือใส่ key ในช่องหน้าเว็บ")
    log("")
    log("   Ctrl+C เพื่อปิด · log 4xx/5xx จะพิมพ์ด้านล่าง")
    log("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    log("")


def main() -> int:
    mock_abs = os.path.join(ROOT, MOCK_HTML)
    login_abs = os.path.join(ROOT, LOGIN_HTML)
    if not os.path.isfile(mock_abs):
        print(f"ไม่พบ {mock_abs}", file=sys.stderr)
        print(f"ROOT = {ROOT}", file=sys.stderr)
        return 1
    if not os.path.isfile(login_abs):
        print(f"แจ้งเตือน: ไม่พบ {login_abs} (จะเปิดเบราว์เซอร์ไป {MOCK_HTML} แทน)", file=sys.stderr)

    kill_old_servers()

    port = pick_port()
    if port is None:
        print(f"ไม่มีพอร์ตว่างในช่วง {PORT_LO}-{PORT_HI}", file=sys.stderr)
        return 1

    socketserver.TCPServer.allow_reuse_address = True
    try:
        httpd = socketserver.ThreadingTCPServer(("127.0.0.1", port), MockHandler)
    except OSError as e:
        print(f"เริ่มเซิร์ฟเวอร์ไม่ได้: {e}", file=sys.stderr)
        return 1
    httpd.daemon_threads = True

    open_page = LOGIN_HTML if os.path.isfile(os.path.join(ROOT, LOGIN_HTML)) else MOCK_HTML
    url = f"http://127.0.0.1:{port}/{open_page}"
    write_url_file(url)
    banner(url, mock_abs)

    threading.Timer(0.35, lambda: open_browser(url)).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        log("\n  ปิดเซิร์ฟเวอร์แล้ว")
    finally:
        try:
            httpd.server_close()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        import traceback
        print(f"ERROR: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
