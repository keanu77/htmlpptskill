#!/bin/bash
# 用法：pptx-to-pdf.sh <in.pptx> <out.pdf>
# 用 macOS 上的 Microsoft PowerPoint 原生開啟並匯出 PDF（字型與版面最忠實，供 QA）。
# 只會關閉本腳本開啟的那一份文件。非 macOS 或沒有 PowerPoint 請改用 print-pdf.mjs。
set -u
[ $# -eq 2 ] || { echo "usage: pptx-to-pdf.sh <in.pptx> <out.pdf>" >&2; exit 1; }
[ "$(uname)" = "Darwin" ] || { echo "只支援 macOS＋PowerPoint；其他平台請用 node scripts/print-pdf.mjs" >&2; exit 1; }
[ -d "/Applications/Microsoft PowerPoint.app" ] || { echo "找不到 Microsoft PowerPoint" >&2; exit 1; }
[ -f "$1" ] || { echo "找不到 $1" >&2; exit 1; }
mkdir -p "$(dirname "$2")"
IN="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; OUT="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
rm -f "$OUT"
for attempt in 1 2; do
  R=$(osascript - "$IN" "$OUT" <<'APPLESCRIPT' 2>&1
on run argv
  set src to POSIX file (item 1 of argv)
  set dst to POSIX file (item 2 of argv)
  with timeout of 400 seconds
    tell application "Microsoft PowerPoint"
      try
        open src
        delay 8
        set doc to active presentation
        set n to count of slides of doc
        save doc in dst as save as PDF
        delay 6
        close doc saving no
        return "ok " & n
      on error e
        return "ERR " & e
      end try
    end tell
  end timeout
end run
APPLESCRIPT
)
  echo "attempt $attempt: $R"
  if [ -f "$OUT" ]; then
    command -v pdfinfo >/dev/null 2>&1 && echo "pages: $(pdfinfo "$OUT" | awk '/Pages/{print $2}')"
    exit 0
  fi
  sleep 5
done
echo "FAILED: PowerPoint export（首次執行需在螢幕前允許「自動化」權限；SSH／無 GUI 環境無法使用）" >&2; exit 1
