#!/bin/bash
# เปิด story-config-mock.html ผ่าน HTTP (โหลด JS คู่หน้าได้ครบ — ห้ามใช้ file://)
# ใช้ serve_story_mock.py: เลือกพอร์ตว่าง 8777–8799 + เขียน story-mock-server.url + เปิดเบราว์เซอร์

cd "$(dirname "$0")" || exit 1

echo ""
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Story Config Mock — localhost"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  โฟลเดอร์: $(pwd)"
echo ""

exec python3 serve_story_mock.py
