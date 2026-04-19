#!/usr/bin/env python3
"""
Local dev server for /vdo edit v2/
Plain static server — WebCodecs does NOT need COOP/COEP headers.
"""
import http.server
import socketserver
import os
import sys

PORT      = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if self.path in ('/', ''):
            self.send_response(302)
            self.send_header('Location', '/index.html')
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):
        print(f"  {self.address_string()} — {fmt % args}")

socketserver.TCPServer.allow_reuse_address = True

print(f"\n  ╔══════════════════════════════════════╗")
print(f"  ║  Video Editor v2 — Dev Server        ║")
print(f"  ║  http://localhost:{PORT}/               ║")
print(f"  ╚══════════════════════════════════════╝")
print(f"  (Ctrl+C to stop)\n")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
