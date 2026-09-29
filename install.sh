#!/bin/bash
# 把兩個 skill 安裝到你用的 AI coding agent。
# 用法：./install.sh [claude|codex|gemini|grok|all] [--project] [--force]
#   預設 all：偵測到哪個 CLI（指令在 PATH 或 ~/.<cli>/ 存在）就裝到它的使用者層級目錄
#   --project：改裝到目前目錄的 .agents/skills/（Gemini、Grok、Codex 都會掃；跟著專案一起 commit）
#   --force：目標已存在時直接覆蓋；否則先搬到 <cli 目錄>/skills-backup/<name>.bak-<時間>
# 各 CLI 的使用者層級 skill 目錄：
#   Claude Code  ~/.claude/skills/        Codex CLI  ~/.codex/skills/
#   Gemini CLI   ~/.gemini/skills/        Grok Build ~/.grok/skills/（也會讀 ~/.claude/skills/）
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS=(html-slide-deck html-slide-effects)
TARGET=all; PROJECT=0; FORCE=0
for a in "$@"; do case "$a" in --project) PROJECT=1;; --force) FORCE=1;; claude|codex|gemini|grok|all) TARGET=$a;; *) echo "未知參數 $a" >&2; exit 1;; esac; done

node -e 'process.exit(+process.versions.node.split(".")[0] >= 18 ? 0 : 1)' 2>/dev/null || echo "⚠ 需要 Node 18+（腳本用 ES modules 與 top-level await）"

install_to() {  # $1 = 目的目錄
  local dest="$1"; mkdir -p "$dest"
  for s in "${SKILLS[@]}"; do
    if [ -d "$dest/$s" ]; then
      if [ $FORCE -eq 1 ]; then rm -rf "$dest/$s"
      else mkdir -p "$dest/../skills-backup"; mv "$dest/$s" "$dest/../skills-backup/$s.bak-$(date +%Y%m%d%H%M%S)"; echo "  既有 $dest/$s 已移到 $(cd "$dest/.." && pwd)/skills-backup/（放在 skills/ 底下會被當成另一個 skill；用 --force 直接覆蓋）"; fi
    fi
    cp -R "$DIR/skills/$s" "$dest/$s"
  done
  if command -v npm >/dev/null 2>&1; then
    (cd "$dest/html-slide-deck" && npm ci --no-audit --no-fund --loglevel=error 2>/dev/null || npm install --no-audit --no-fund --loglevel=error) \
      || echo "  ⚠ npm install 失敗：QA 的 QR 解碼需要 jsqr／pngjs，稍後到 $dest/html-slide-deck 再跑 npm install"
  else
    echo "  ⚠ 沒有 npm：QA 的 QR 解碼會要求 QA_SKIP_QR=1"
  fi
  echo "✓ 已安裝到 $dest"
}

if [ $PROJECT -eq 1 ]; then install_to "$PWD/.agents/skills"; echo "（Claude Code 讀的是 .claude/skills/，需要就再跑：./install.sh claude）"; exit 0; fi

want() { [ "$TARGET" = all ] || [ "$TARGET" = "$1" ]; }
has()  { command -v "$1" >/dev/null 2>&1 || [ -d "$HOME/.$1" ] || [ "$TARGET" = "$1" ]; }
n=0
want claude && has claude && { install_to "$HOME/.claude/skills"; n=$((n+1)); }
want codex  && has codex  && { install_to "$HOME/.codex/skills";  n=$((n+1)); }
want gemini && has gemini && { install_to "$HOME/.gemini/skills"; n=$((n+1)); }
want grok   && has grok   && { install_to "$HOME/.grok/skills";   n=$((n+1)); }
[ $n -gt 0 ] || { echo "沒有偵測到 claude／codex／gemini／grok；指定目標：./install.sh claude" >&2; exit 1; }

cat <<'MSG'

重新開啟 CLI 後（各家指令以其文件為準）：
  Claude Code  輸入 / 會在自動完成看到 /html-slide-deck、/html-slide-effects；或直接說「做一份 HTML 簡報」
  Codex CLI    直接描述任務即可自動觸發；也可輸入 $html-slide-deck
  Gemini CLI   gemini skills list 應該看得到；也可 gemini skills link <本 repo>/skills/html-slide-deck
  Grok Build   直接描述任務即可自動觸發

還需要（腳本從執行目錄往上找 node_modules，找不到再找 npm 全域）：
  npm i -D playwright && npx playwright install chromium     逐頁截圖 QA、講義渲染、PDF（Linux 無 GUI 再加 install-deps）
  npm i -g pptxgenjs                                          圖片型講義與原生 PPTX
  python3 -m pip install -r requirements.txt                  QR、montage、PPTX 局部修改（建議用 venv）
解除安裝：刪掉各 CLI skills 目錄下的 html-slide-deck 與 html-slide-effects。
MSG
