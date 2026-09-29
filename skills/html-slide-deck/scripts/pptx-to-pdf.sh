#!/bin/bash
# 用法：pptx-to-pdf.sh <in.pptx> <out.pdf>
# 用 PowerPoint 原生開啟並匯出 PDF（忠實渲染，供 QA）。先關閉殘留文件；-9074／逾時就重試一次。
set -u
IN="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; OUT="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
osascript -e 'with timeout of 120 seconds
tell application "Microsoft PowerPoint"
  set c to count of presentations
  repeat with i from c to 1 by -1
    try
      close presentation i saving no
    end try
  end repeat
end tell
end timeout' >/dev/null 2>&1
for attempt in 1 2; do
  R=$(osascript <<APPLESCRIPT 2>&1
with timeout of 400 seconds
tell application "Microsoft PowerPoint"
  try
    open POSIX file "$IN"
    delay 8
    set n to count of slides of active presentation
    save active presentation in POSIX file "$OUT" as save as PDF
    delay 6
    close active presentation saving no
    return "ok " & n
  on error e
    return "ERR " & e
  end try
end tell
end timeout
APPLESCRIPT
)
  echo "attempt $attempt: $R"
  [ -f "$OUT" ] && { echo "pages: $(pdfinfo "$OUT" 2>/dev/null | awk '/Pages/{print $2}')"; exit 0; }
  sleep 5
done
echo "FAILED: PowerPoint export" >&2; exit 1
