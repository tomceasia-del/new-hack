#!/usr/bin/env python3
"""
เซิร์ฟ story-config-mock.html ผ่าน http://127.0.0.1 อย่าง robust
- ใช้ SimpleHTTPRequestHandler + directory=ROOT (เสิร์ฟทุกไฟล์ใน workspace root อย่างปลอดภัย)
  → รองรับทั้ง story-config-mock.html, story-config-result.html, JS คู่หน้า, favicon
- ฆ่า server เก่าในช่วง 8777-8799 ก่อนทุกครั้ง
- เลือกพอร์ตแรกที่ว่างได้, อัพเดต story-mock-server.url
- เปิดเบราว์เซอร์อัตโนมัติ (macOS = open, อื่น ๆ = webbrowser.open)
- Ctrl+C ปิดสะอาด
"""
from __future__ import annotations

import http.server
import os
import platform
import signal
import socket
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse

ROOT = os.path.dirname(os.path.realpath(__file__))
PORT_LO, PORT_HI = 8777, 8799
MOCK_HTML = "story-config-mock.html"
URL_FILE = os.path.join(ROOT, "story-mock-server.url")


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
    """SimpleHTTPRequestHandler ที่ pin directory ไว้ที่ ROOT เสมอ + quiet log"""

    server_version = "story-mock/2"

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

    def do_GET(self):
        # "/" → redirect ไป mock หลัก
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path in ("", "/"):
            self.send_response(302)
            self.send_header("Location", f"/{MOCK_HTML}")
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
    log("   Story Config Mock — เซิร์ฟเวอร์พร้อม")
    log("")
    log(f"   {url}")
    log(f"   ไฟล์: {mock_abs}")
    log("")
    log("   Ctrl+C เพื่อปิด · log 4xx/5xx จะพิมพ์ด้านล่าง")
    log("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    log("")


def main() -> int:
    mock_abs = os.path.join(ROOT, MOCK_HTML)
    if not os.path.isfile(mock_abs):
        print(f"ไม่พบ {mock_abs}", file=sys.stderr)
        print(f"ROOT = {ROOT}", file=sys.stderr)
        return 1

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

    url = f"http://127.0.0.1:{port}/{MOCK_HTML}"
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
