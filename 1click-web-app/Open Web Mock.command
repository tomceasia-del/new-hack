#!/bin/bash
cd "$(dirname "$0")"
exec python3 serve_web_mock.py
