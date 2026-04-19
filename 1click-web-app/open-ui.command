#!/bin/bash
# Double-click this file in Finder to serve the folder and open the mock UI in your browser.
cd "$(dirname "$0")" || exit 1
PORT=19401
CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 "http://127.0.0.1:${PORT}/index.html" 2>/dev/null || echo "000")
if [ "$CODE" != "200" ]; then
  (lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill -9) 2>/dev/null || true
  python3 -m http.server "$PORT" >/tmp/1click-web-app-http.log 2>&1 &
  sleep 0.5
fi
open "http://127.0.0.1:${PORT}/index.html"
