"""
เซิร์ฟไฟล์ mock จากโฟลเดอร์โปรเจกต์แบบชัดเจน (อ่านจากดิสก์)
ลดปัญหา 404 จาก SimpleHTTPRequestHandler / path แปลก / ทรัพยากรคู่หน้า
"""
import http.server
import mimetypes
import os
import sys
import urllib.parse

MOCK_HTML = "story-config-mock.html"
MOCK_PATH = "/" + MOCK_HTML

# ไฟล์ที่ story-config-mock.html อ้างอิงแบบ relative
ALLOWED_ROOT_FILES = frozenset(
    (
        MOCK_HTML,
        "storymode-mock-enrich-bundle.js",
        "storymode-mock-gemini-core.js",
        "factory-dna-v1.example.json",
        "factory-dna-v2.example.json",
    )
)


def clean_request_path(path: str) -> str:
    p = urllib.parse.unquote(urllib.parse.urlparse(path).path)
    if not p.startswith("/"):
        p = "/" + p
    while "//" in p:
        p = p.replace("//", "/")
    if len(p) > 1:
        p = p.rstrip("/")
    return p or "/"


def make_mock_project_handler(root: str):
    root_real = os.path.realpath(root)

    class MockProjectHandler(http.server.SimpleHTTPRequestHandler):
        server_version = "mock-static/1"

        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=root_real, **kwargs)

        def log_message(self, fmt, *args):
            pass

        def send_error(self, code, message=None, explain=None):
            if code == 404:
                print(
                    "[mock-http] 404",
                    clean_request_path(self.path),
                    "raw=",
                    repr(self.path),
                    file=sys.stderr,
                )
            return super().send_error(code, message, explain)

        def do_GET(self):
            c = clean_request_path(self.path)
            if c == "/":
                self.send_response(302)
                self.send_header("Location", MOCK_PATH)
                self.end_headers()
                return
            name = c[1:] if c.startswith("/") else c
            if not name or ".." in name:
                self.send_error(400, "Bad path")
                return
            if "/" in name:
                # อนุญาตเฉพาะ tree ใต้ domains/ (โหลด domain knowledge ตอน local mock)
                if not name.startswith("domains/") or ".." in name:
                    self.send_error(400, "Bad path")
                    return
                return super().do_GET()
            if name in ALLOWED_ROOT_FILES:
                self._send_root_file(name)
                return
            return super().do_GET()

        def _send_root_file(self, name: str) -> None:
            fp = os.path.join(root_real, name)
            if not os.path.isfile(fp):
                self.send_error(404, "File not on disk")
                return
            try:
                with open(fp, "rb") as f:
                    data = f.read()
            except OSError:
                self.send_error(500, "Read error")
                return
            ctype, _ = mimetypes.guess_type(name)
            if not ctype:
                ctype = "application/octet-stream"
            if ctype.startswith("text/") or ctype in ("application/javascript", "text/javascript"):
                if "charset" not in ctype:
                    ctype = ctype + "; charset=utf-8"
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

    return MockProjectHandler
