#!/bin/bash
# 用法：gen-image.sh "<prompt>" <dest-name>
# 產生一張簡報底圖到 ${GEN_DEST:-$PWD/images}/<dest-name>.png，並留版本 _versions/<name>/vN.png。
# 預設用本機 Codex CLI 生圖（依賴 codex exec 的 `session id:` 輸出與 ~/.codex/generated_images/<id>/，
# 這是 Codex CLI 0.15x 的行為，版本改了可能失效）。要換生圖工具：設 GEN_CMD，
# 例如 GEN_CMD='my-imagegen --out {out} "{prompt}"'，{prompt}／{out} 會被代入；命令必須把 PNG 寫到 {out}。
set -u
[ $# -eq 2 ] || { echo "usage: gen-image.sh \"<prompt>\" <dest-name>" >&2; exit 1; }
PROMPT="$1"; NAME="$2"
case "$NAME" in *[!A-Za-z0-9._-]*|"") echo "dest-name 只能用英數、點、底線、連字號" >&2; exit 1;; esac
DEST_DIR="${GEN_DEST:-$PWD/images}"; mkdir -p "$DEST_DIR"
[ ${#PROMPT} -lt 350 ] || { echo "ERROR prompt ${#PROMPT} chars（>=350 會卡住）" >&2; exit 1; }
VD="$DEST_DIR/_versions/$NAME"; mkdir -p "$VD"
V=$(( $(ls "$VD"/v*.png 2>/dev/null | wc -l) + 1 ))
OUT="$DEST_DIR/$NAME.png"

if [ -n "${GEN_CMD:-}" ]; then
  CMD="${GEN_CMD//\{prompt\}/$PROMPT}"; CMD="${CMD//\{out\}/$OUT}"
  bash -c "$CMD" || { echo "GEN_CMD 失敗" >&2; exit 1; }
  [ -f "$OUT" ] || { echo "GEN_CMD 沒有產生 $OUT" >&2; exit 1; }
else
  command -v codex >/dev/null 2>&1 || { echo "沒有 codex CLI；請設 GEN_CMD 換成你的生圖工具，或自行把圖放到 $OUT" >&2; exit 1; }
  LOG=$(mktemp "${TMPDIR:-/tmp}/codex-image.XXXXXX"); trap 'rm -f "$LOG"' EXIT
  WORK=$(mktemp -d "${TMPDIR:-/tmp}/codex-image-work.XXXXXX")  # 在空目錄執行，避免 agent 動到專案檔案
  # 只交付生圖任務，不讓自由文字變成一般 agent 指令
  ( cd "$WORK" && timeout 300 codex exec --skip-git-repo-check -s read-only "只做一件事：依下面描述生成一張圖片並存檔，不要執行其他指令、不要修改任何檔案。描述：$PROMPT" ) >"$LOG" 2>&1
  RC=$?; rmdir "$WORK" 2>/dev/null
  [ $RC -eq 124 ] && { echo "TIMEOUT $NAME（300s）" >&2; exit 1; }
  [ $RC -eq 0 ] || { echo "codex exit $RC；log 尾端：" >&2; tail -5 "$LOG" >&2; exit 1; }
  SID=$(grep -m1 '^session id:' "$LOG" | awk '{print $3}')
  [ -n "$SID" ] || { echo "log 裡沒有 session id（codex 版本可能已改）；log 尾端：" >&2; tail -5 "$LOG" >&2; exit 1; }
  SRC="$HOME/.codex/generated_images/$SID"
  F=$(ls "$SRC"/*.png 2>/dev/null | head -1)
  [ -n "$F" ] || { echo "在 $SRC 找不到 png" >&2; ls "$SRC" >&2 2>/dev/null; exit 1; }
  cp "$F" "$OUT"
fi
cp "$OUT" "$VD/v${V}.png"
echo "OK $NAME v$V → $OUT"
