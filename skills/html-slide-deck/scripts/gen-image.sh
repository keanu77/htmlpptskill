#!/bin/bash
# usage: gen-image.sh "<prompt>" <dest-name>
set -u
PROMPT="$1"; NAME="$2"
DEST_DIR="${GEN_DEST:-$PWD/images}"
LEN=$(printf '%s' "$PROMPT" | python3 -c 'import sys; print(len(sys.stdin.read()))')
[ "$LEN" -ge 350 ] && { echo "ERROR prompt $LEN chars"; exit 1; }
LOG=$(mktemp -t codex-image.XXXXXX.log)
python3 - "$PROMPT" "$LOG" <<'PY'
import subprocess, sys
prompt, log_file = sys.argv[1], sys.argv[2]
with open(log_file, 'w') as out:
    try:
        r = subprocess.run(['codex','exec','--skip-git-repo-check',prompt], stdout=out, stderr=subprocess.STDOUT, timeout=300)
        sys.exit(r.returncode)
    except subprocess.TimeoutExpired:
        out.write("\nTIMEOUT after 300s\n"); sys.exit(124)
PY
RC=$?
[ $RC -eq 124 ] && { echo "TIMEOUT $NAME"; exit 1; }
SID=$(grep -m1 '^session id:' "$LOG" | awk '{print $3}')
[ -z "$SID" ] && { echo "no session id for $NAME; tail:"; tail -5 "$LOG"; exit 1; }
SRC="$HOME/.codex/generated_images/$SID"
VD="$DEST_DIR/_versions/$NAME"; mkdir -p "$VD"
V=$(( $(ls "$VD"/v*.png 2>/dev/null | wc -l) + 1 ))
n=0; for f in "$SRC"/*.png; do [ -f "$f" ] || continue; n=$((n+1)); cp "$f" "$VD/v${V}.png"; cp "$f" "$DEST_DIR/$NAME.png"; break; done
[ $n -eq 0 ] && { echo "no png for $NAME in $SRC"; ls "$SRC"; exit 1; }
echo "OK $NAME v$V $(python3 -c "from PIL import Image; print(Image.open('$DEST_DIR/$NAME.png').size)")"
