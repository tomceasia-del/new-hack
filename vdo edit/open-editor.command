#!/bin/bash
# Video Editor v2 (WebCodecs) — see vdo edit v2/serve.py
SCRIPT_DIR="/Users/nasato/Desktop/new hack/vdo edit v2"
cd "$SCRIPT_DIR"
python3 "$SCRIPT_DIR/serve.py" &
SERVER_PID=$!
sleep 1.5
open "http://localhost:8766/"
echo "Video Editor v2 — Server PID: $SERVER_PID — ปิด Terminal นี้เพื่อหยุด server"
wait $SERVER_PID
