#!/usr/bin/env python3
"""用法：montage.py <dir> [cols=4]  把 dir 內 h-XX.png / s-XX.png 拼成 montage.png（每格 320 寬、標頁碼）。"""
import sys, glob, os
from PIL import Image, ImageDraw
d = sys.argv[1]; cols = int(sys.argv[2]) if len(sys.argv) > 2 else 4
files = sorted(glob.glob(os.path.join(d, 'h-*.png'))) or sorted(glob.glob(os.path.join(d, 's-*.png')))
if not files: sys.exit('no h-*.png / s-*.png in ' + d)
tw = 320; th = round(tw * 9 / 16); rows = -(-len(files) // cols)
sheet = Image.new('RGB', (cols * tw, rows * (th + 18)), '#222')
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((tw, th))
    x, y = (i % cols) * tw, (i // cols) * (th + 18)
    sheet.paste(im, (x, y + 18)); dr.text((x + 6, y + 3), f'{i + 1:02d}', fill='#F2B84B')
out = os.path.join(d, 'montage.png'); sheet.save(out); print('montage', out, len(files), 'slides')
