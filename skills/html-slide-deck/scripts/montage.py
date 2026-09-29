#!/usr/bin/env python3
"""用法：montage.py <dir> [cols=4] [thumb_w=400]  把 dir 內 h-*.png / s-*.jpg 拼成 montage.png（標頁碼）。"""
import glob
import os
import sys

from PIL import Image, ImageDraw

d = sys.argv[1]
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 4
tw = int(sys.argv[3]) if len(sys.argv) > 3 else 400
files = sorted(glob.glob(os.path.join(d, "h-*.png"))) or sorted(glob.glob(os.path.join(d, "s-*.jpg"))) or sorted(glob.glob(os.path.join(d, "s-*.png")))
if not files:
    sys.exit("no h-*.png / s-*.jpg in " + d)
th = round(tw * 9 / 16)
rows = -(-len(files) // cols)
sheet = Image.new("RGB", (cols * tw, rows * (th + 20)), "#222")
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((tw, th))
    x, y = (i % cols) * tw, (i // cols) * (th + 20)
    sheet.paste(im, (x, y + 20))
    dr.text((x + 6, y + 4), f"{i + 1:03d}", fill="#F2B84B")
out = os.path.join(d, "montage.png")
sheet.save(out)
print("montage", out, len(files), "slides")
