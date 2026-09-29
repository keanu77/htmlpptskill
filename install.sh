#!/bin/bash
# 把兩個 skill 複製到 ~/.claude/skills/，並安裝 QA 用的小套件（jsqr、pngjs）。
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p ~/.claude/skills
for s in html-slide-deck html-slide-effects; do
  rm -rf ~/.claude/skills/$s
  cp -R "$DIR/skills/$s" ~/.claude/skills/$s
done
cd ~/.claude/skills/html-slide-deck && npm install --no-audit --no-fund
echo "安裝完成。重新開啟 claude 後輸入 /skills 應該會看到 html-slide-deck 與 html-slide-effects。"
echo "還需要：playwright（npm i -D playwright && npx playwright install chromium）、pptxgenjs（npm i -g pptxgenjs）、python3 -m pip install segno pillow python-pptx"
