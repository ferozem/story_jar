#!/usr/bin/env bash
# Play Store phone screenshots, straight from the real app rendered on web.
# Shoots each route at 540x960 (the width where the mobile layout stops clipping),
# then upscales x2 -> 1080x1920 (9:16). One set satisfies phone + 7" + 10" tablet slots.
# Usage: bash scripts/make_screenshots.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=8083
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
[ -x "$CHROME" ] || CHROME="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
WINROOT="$(pwd -W 2>/dev/null || pwd)"; WINROOT="${WINROOT//\//\\}"   # Windows path for Chrome
SHOTS="$WINROOT\\build\\shots"
mkdir -p build/shots build/screenshots

# routes: name|url  (edit here to change which screens are captured)
ROUTES=(
  "1-home|/"
  "2-library|/library"
  "3-category|/category/Honesty%20%26%20Trust"
  "4-reader|/reader/the-backward-badge?page=1"
)

echo "starting expo web on :$PORT ..."
CI=1 BROWSER=none npx expo start --web --port "$PORT" > /tmp/expo-web.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for i in $(seq 1 60); do
  curl -s -o /dev/null "http://localhost:$PORT" && break
  sleep 2
  [ "$i" = 60 ] && { echo "server never came up; see /tmp/expo-web.log"; exit 1; }
done
sleep 3  # let the first bundle settle

for r in "${ROUTES[@]}"; do
  name="${r%%|*}"; url="${r#*|}"
  "$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=540,960 \
    --virtual-time-budget=16000 --screenshot="$SHOTS\\$name.png" \
    "http://localhost:$PORT$url" 2>/dev/null
  echo "  shot $name"
done

python - "${ROUTES[@]}" <<'PY'
import sys
from PIL import Image
for r in sys.argv[1:]:
    name = r.split("|", 1)[0]
    im = Image.open(f"build/shots/{name}.png").convert("RGB").resize((1080, 1920), Image.LANCZOS)
    im.save(f"build/screenshots/{name}.png", "PNG")
    print("  wrote build/screenshots/%s.png %s" % (name, im.size))
PY

echo "done -> build/screenshots/"
