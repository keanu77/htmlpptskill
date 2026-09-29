# examples/

## workshop-2026/content.js
作者 2026-09 臨床教師工作坊的 50 頁完整內容（做法 B）。複製到範本目錄取代 `content.js` 就能 build；底圖與截圖需自備（`assets/`、`shots/`），沒有會自動略過。內容與網址屬作者示例，換成你的。

## pptx-edits-back-to-html.py
實例，不是工具：講者把 52 頁 HTML 轉成 PPTX 後手改，再把修改回灌 HTML 並加上全部效果（fragment、Auto-Animate、3D 翻卡、GSAP、內嵌測驗、計時條、lightbox、reveal.js 5.2）。腳本綁定那份簡報的字串，直接跑不會成功；它示範每一種技巧怎麼用正則安全地套進既有 HTML。

前處理（把 base64 圖片換成占位符，讓正則不必掃過幾 MB 的圖）：
```python
import re, json
s = open('index.html', encoding='utf8').read(); imgs = []
def sub(m): imgs.append(m.group(0)); return f'__IMG{len(imgs)-1}__'
stripped = re.sub(r'data:image/[a-z]+;base64,[A-Za-z0-9+/=]+', sub, s)
open('stripped.html', 'w').write(stripped); json.dump({'imgs': imgs}, open('imgs.json', 'w'))
```
libs-dir：`mkdir libs && cd libs && npm init -y && npm i reveal.js@5 gsap`。

內嵌的五題肩關節超音波測驗是**示例題目，未經審查，勿直接教學使用**；參考文獻標「待查證」正是示範 prompt 裡的查證要求。
