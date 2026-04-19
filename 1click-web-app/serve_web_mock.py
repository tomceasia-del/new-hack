#!/usr/bin/env python3
"""เปิด 1CLICK UI mock (index.html) บน 127.0.0.1 พอร์ตว่าง + เปิดเบราว์เซอร์"""
import http.server
import os
import socketserver
import threading
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


def main():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", 0), QuietHandler)
    port = httpd.server_address[1]
    url = f"http://127.0.0.1:{port}/index.html"

    print("")
    print("UI Mock — เปิดลิงก์นี้ (หรือรอเบราว์เซอร์):")
    print(" ", url)
    print("")
    print("กด Ctrl+C เพื่อปิด")
    print("")

    def go():
        try:
            webbrowser.open(url)
        except Exception:
            pass

    threading.Timer(0.5, go).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nปิดแล้ว")
    finally:
        httpd.shutdown()


if __name__ == "__main__":
    main()
