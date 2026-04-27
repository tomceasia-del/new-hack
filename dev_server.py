#!/usr/bin/env python3
"""
Local dev: static + เส้นทางเดียวกับ Vercel (rewrites) + /api แบบอ่านได้
- URL: /, /login, /admin, /cs, /result, /editor … ใช้ได้ (ไม่ต้องใส่ .html ทุกที่)
- /api/gemini* ยัง forward ตาม serve_story_mock (ต้องมี GEMINI_API_KEY ถ้าใช้ mock)
- /api/auth/* และ /api/admin/* สตับใน RAM — อ่าน/ปรับ state สำหรับทดสอบ UI บนเครื่อง
  ปิด session จำลอง: LOCAL_DEV_AUTH=0 python3 dev_server.py

รัน:  python3 dev_server.py
พอร์ต: PORT (default 8880) หรือช่อง 8880–8889
"""
from __future__ import annotations

import json
import os
import platform
import socket
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse
from http import HTTPStatus

# parent handler (มี /api/gemini, /api/gemini-verify)
import serve_story_mock

ROOT = serve_story_mock.ROOT
MOCK_HTML = serve_story_mock.MOCK_HTML
URL_FILE = os.path.join(ROOT, "dev-server.url")

DEFAULT_PORT = int(os.environ.get("PORT", "8880") or 8880)
PORT_LO, PORT_HI = 8880, 8889

# in-memory: จำลองคิวอนุมัติ (UI admin-approvals)
_ST_PENDING: list[dict] = [
    {
        "email": "ตัวอย่าง+คิว@local.test",
        "name": "Demo คิว (local only)",
        "requestedAt": "2025-12-15T10:00:00.000Z",
    }
]
_ST_APPROVED: list[str] = []
_ST_ADMINS: list[str] = ["dev@local.lan", "dev@local.test"]


def _use_fake_session() -> bool:
    v = (os.environ.get("LOCAL_DEV_AUTH", "1") or "1").strip().lower()
    return v not in ("0", "false", "no", "off")


def _cors(self) -> None:
    self.send_header("Access-Control-Allow-Origin", "*")
    self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS, HEAD")
    self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie")
    self.send_header("Access-Control-Allow-Credentials", "true")


def _send_json(
    h: serve_story_mock.MockHandler, status: int, obj: dict, extra_headers: list[tuple[str, str]] | None = None
) -> None:
    data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
    h.send_response(status)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(data)))
    h.send_header("X-Local-Dev", "1")
    h.send_header("Cache-Control", "no-store")
    for k, v in extra_headers or []:
        h.send_header(k, v)
    h.end_headers()
    h.wfile.write(data)


def _read_json_body(h: serve_story_mock.MockHandler, cap: int = 1_048_576) -> dict:
    n = int(h.headers.get("Content-Length", 0) or 0)
    n = min(max(n, 0), cap)
    raw = h.rfile.read(n) if n else b""
    if not raw:
        return {}
    return json.loads(raw.decode("utf-8"))


def _norm(pure_path: str) -> str:
    p = pure_path or "/"
    if p != "/" and p.endswith("/"):
        return p.rstrip("/")
    return p


def _rewrite(pure_path: str) -> str:
    p = _norm(pure_path)
    m = {
        "/": f"/{serve_story_mock.resolve_entry_page()}",
        "/login": f"/{serve_story_mock.LOGIN_HTML}",
        "/admin": "/admin.html",
        "/admin/approvals": "/admin-approvals.html",
        "/cs": f"/{MOCK_HTML}",
        "/story-config-mock": f"/{MOCK_HTML}",
        "/result": "/story-config-result.html",
        "/editor": "/editor/index.html",
    }
    return m.get(p, pure_path)


class LocalDevHandler(serve_story_mock.MockHandler):
    server_version = "local-dev/1"

    def do_OPTIONS(self) -> None:  # noqa: N802
        p = urllib.parse.urlparse(self.path).path
        if p == "/api/gemini" or p == "/api/gemini-verify" or p.startswith("/api/"):
            self.send_response(HTTPStatus.NO_CONTENT)
            _cors(self)
            self.end_headers()
            return
        self.send_error(HTTPStatus.NOT_FOUND, "Not found")

    def do_DELETE(self) -> None:  # noqa: N802
        p = urllib.parse.urlparse(self.path).path
        if p != "/api/admin/admins":
            return self.send_error(HTTPStatus.NOT_FOUND, "Not found")
        if not _use_fake_session():
            return _send_json(self, HTTPStatus.UNAUTHORIZED, {"ok": False, "error": "unauthorized"})

        qs = urllib.parse.urlparse(self.path).query
        email = (urllib.parse.parse_qs(qs).get("email") or [""])[0]
        if not email:
            return _send_json(self, HTTPStatus.BAD_REQUEST, {"ok": False, "error": "missing_email"})
        if email in _ST_ADMINS and len(_ST_ADMINS) > 1:
            _ST_ADMINS.remove(email)
            return _send_json(
                self,
                200,
                {
                    "ok": True,
                    "action": "removed",
                    "admins": list(_ST_ADMINS),
                },
            )
        if email in _ST_ADMINS:
            return _send_json(self, HTTPStatus.BAD_REQUEST, {"ok": False, "error": "cannot_delete_last_admin"})
        return _send_json(self, HTTPStatus.BAD_REQUEST, {"ok": False, "error": "not_found"})

    def do_GET(self) -> None:  # noqa: N802
        p = _norm(urllib.parse.urlparse(self.path).path)

        if p in ("/api/gemini-verify", "/api/gemini"):
            return serve_story_mock.MockHandler.do_GET(self)
        if p == "/api/auth/login":
            self.send_response(HTTPStatus.FOUND)
            self.send_header("Location", f"/{serve_story_mock.LOGIN_HTML}?info=local_dev")
            _cors(self)
            self.send_header("X-Local-Dev", "1")
            self.end_headers()
            return
        if p == "/api/auth/logout":
            self.send_response(HTTPStatus.FOUND)
            self.send_header("Location", f"/{serve_story_mock.LOGIN_HTML}")
            _cors(self)
            self.send_header(
                "Set-Cookie",
                "cs_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax",
            )
            self.send_header("X-Local-Dev", "1")
            self.end_headers()
            return
        if p == "/api/auth/session":
            if not _use_fake_session():
                return _send_json(self, HTTPStatus.UNAUTHORIZED, {"authenticated": False})
            return _send_json(
                self,
                200,
                {
                    "authenticated": True,
                    "isAdmin": True,
                    "user": {
                        "name": "Local Dev",
                        "email": "dev@local.lan",
                    },
                },
            )
        if p == "/api/admin/access-requests":
            if not _use_fake_session():
                return _send_json(self, 403, {"ok": False, "error": "forbidden"})
            return _send_json(
                self,
                200,
                {
                    "ok": True,
                    "pending": list(_ST_PENDING),
                    "approved": list(_ST_APPROVED),
                },
            )
        if p == "/api/admin/admins":
            if not _use_fake_session():
                return _send_json(self, 403, {"ok": False, "error": "forbidden"})
            return _send_json(self, 200, {"ok": True, "admins": list(_ST_ADMINS)})

        new_pure = _rewrite(p)
        u = urllib.parse.urlparse(self.path)
        self.path = new_pure + ("?" + u.query if u.query else "")

        return serve_story_mock.MockHandler.do_GET(self)

    def do_POST(self) -> None:  # noqa: N802
        p = urllib.parse.urlparse(self.path).path
        if p == "/api/gemini":
            return serve_story_mock.MockHandler.do_POST(self)
        if p == "/api/auth/session" or p == "/api/gemini-verify":
            return self.send_error(HTTPStatus.METHOD_NOT_ALLOWED, "Method not allowed")

        if p == "/api/admin/access-requests":
            if not _use_fake_session():
                return _send_json(self, 403, {"ok": False, "error": "forbidden"})
            try:
                body = _read_json_body(self)
            except (json.JSONDecodeError, ValueError, UnicodeError):
                return _send_json(self, 400, {"ok": False, "error": "invalid_json"})

            action = (body.get("action") or "").strip()
            email = (body.get("email") or "").strip()
            if not email:
                return _send_json(self, 400, {"ok": False, "error": "missing_email"})

            if action == "approve":
                _ST_PENDING[:] = [x for x in _ST_PENDING if (x.get("email") or "") != email]
                if email not in _ST_APPROVED:
                    _ST_APPROVED.append(email)
                return _send_json(
                    self,
                    200,
                    {"ok": True, "action": "approved", "pending": list(_ST_PENDING), "approved": list(_ST_APPROVED)},
                )
            if action == "reject":
                _ST_PENDING[:] = [x for x in _ST_PENDING if (x.get("email") or "") != email]
                return _send_json(
                    self,
                    200,
                    {"ok": True, "action": "rejected", "pending": list(_ST_PENDING), "approved": list(_ST_APPROVED)},
                )
            if action == "revoke":
                if email in _ST_APPROVED:
                    _ST_APPROVED.remove(email)
                return _send_json(
                    self,
                    200,
                    {"ok": True, "action": "revoked", "pending": list(_ST_PENDING), "approved": list(_ST_APPROVED)},
                )
            return _send_json(self, 400, {"ok": False, "error": "bad_action"})

        if p == "/api/admin/admins":
            if not _use_fake_session():
                return _send_json(self, 403, {"ok": False, "error": "forbidden"})
            try:
                body = _read_json_body(self)
            except (json.JSONDecodeError, ValueError, UnicodeError):
                return _send_json(self, 400, {"ok": False, "error": "invalid_json"})
            email = (body.get("email") or "").strip()
            if not email or "@" not in email:
                return _send_json(self, 400, {"ok": False, "error": "invalid_email"})
            if email not in _ST_ADMINS:
                _ST_ADMINS.append(email)
            return _send_json(self, 200, {"ok": True, "action": "added", "admins": list(_ST_ADMINS)})

        return self.send_error(HTTPStatus.NOT_FOUND, "Not found")


def pick_port() -> int | None:
    cands: list[int] = [DEFAULT_PORT]
    for p in range(PORT_LO, PORT_HI + 1):
        if p != DEFAULT_PORT:
            cands.append(p)
    for p in cands:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    return None


def _open_url(url: str) -> None:
    try:
        if platform.system() == "Darwin":
            subprocess.Popen(
                ["open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
            return
    except OSError:
        pass
    try:
        import webbrowser

        webbrowser.open(url)
    except Exception:
        pass


def _banner(url: str) -> None:
    k = (os.environ.get("GEMINI_API_KEY") or "").strip()
    auth_on = _use_fake_session()
    print("", flush=True)
    print("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", flush=True)
    print("   Local dev — ทุก path ตาม Vercel + /api จำลอง (RAM)", flush=True)
    print(f"   {url}", flush=True)
    print("", flush=True)
    print("   ทางลัด: /  /login  /cs  /result  /admin  /admin/approvals  /editor", flush=True)
    if auth_on:
        print("   ✓ session จำลอง: login ดูแล้วจะเด้ง mock — ตั้ง LOCAL_DEV_AUTH=0 ถ้าจะเทสหน้า login", flush=True)
    else:
        print("   · LOCAL_DEV_AUTH=0 — ยังไม่ login (401 /api/auth/session)", flush=True)
    if k:
        print("   ✓ GEMINI_API_KEY: ใช้กับ /api/gemini ได้", flush=True)
    else:
        print("   · ไม่มี GEMINI_API_KEY (หรือ export ก่อนรัน)", flush=True)
    print("", flush=True)
    print("   Ctrl+C ปิด", flush=True)
    print("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", flush=True)
    print("", flush=True)


def main() -> int:
    p = pick_port()
    if p is None:
        print(f"ไม่มีพอร์ตว่าง (ลอง {PORT_LO}-{PORT_HI} และ {DEFAULT_PORT})", file=sys.stderr)
        return 1
    serve_story_mock.socketserver.TCPServer.allow_reuse_address = True
    try:
        httpd = socketserver.ThreadingTCPServer(("127.0.0.1", p), LocalDevHandler)
    except OSError as e:
        print(f"เริ่มเซิร์ฟเวอร์ไม่ได้: {e}", file=sys.stderr)
        return 1
    httpd.daemon_threads = True
    base = f"http://127.0.0.1:{p}"
    try:
        with open(URL_FILE, "w", encoding="utf-8") as f:
            f.write(base + "\n")
    except OSError:
        pass
    _banner(base + "/")
    threading.Timer(0.35, lambda: _open_url(base + "/")).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  หยุด dev server แล้ว", flush=True)
    finally:
        try:
            httpd.server_close()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # pragma: no cover
        import traceback

        print(f"ERROR: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
