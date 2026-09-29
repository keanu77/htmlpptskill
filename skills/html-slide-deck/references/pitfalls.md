# 踩過的雷與可複用片段（2026-09-28／29）

## reveal.js 版面
- `.reveal ol` 主題自帶編號，自訂步驟清單要用 `.reveal ol.steps { list-style:none }` 覆蓋，否則「1.」和圓圈數字同時出現。
- `center: true` 時 section 高度隨內容，`position:absolute` 的側邊色條會斷；改用 `data-background-gradient="linear-gradient(90deg,#F2B84B 0,#F2B84B 18px,transparent 18px), linear-gradient(…)"`。
- 截圖 QA 要等轉場結束（`transition:'slide'` 800ms）再截，否則整頁往右偏 180px，看起來像被切掉。
- `qa-screenshots` 的 `overflow: true` 若只出現在有 `.callout` 且 `bottom:-14px` 的截圖頁，是 callout 故意超出邊界，不是真溢出；其他頁出現才要處理。
- 說明卡（`.note`）最後 1–2 字或標點掉行：改稿（刪句尾「。」、換詞），不要調寬度硬撐。
- 講者備註外掛（notes.js）原始碼含 `</body>` 字串；用程式插入 script 要找**最後一個** `</body>`，否則會插進外掛的模板把它弄壞（症狀：RevealNotes is not defined）。
- 內嵌 base64 的 HTML 要用正則處理時，先把 `data:image/...;base64,...` 換成占位符再操作；base64 解碼要補 `=` padding。

## 圖片
- Codex 生圖 prompt 超過 350 字元會卡住；每張約 1–2 分鐘，可 5–8 張並行（各自 `codex exec`）。
- 底圖 PNG 1672×941 約 1.6 MB；轉 JPG q82 約 40–130 KB。
- GitHub commits 頁截圖裁掉黑色導覽列：
  ```python
  def white(y): return all(px.getpixel((x,y))>235 for x in (300,900,1400,2000))
  y0=next(y for y in range(0,600) if all(white(y+k) for k in range(30)))
  ```
- Playwright `goto(..., waitUntil:'networkidle')` 在 GitHub 會逾時，用 `'load'` + `waitForTimeout(2500)`。
- 腳本放在有 symlink node_modules 的目錄會解析到另一版 Playwright（缺瀏覽器 shell），一律從專案根目錄跑。

## QR
- 既有 SVG QR（`<path stroke d="M1 1.5h7m3 0h2…">`）轉 PNG 不必解碼，直接光柵化：
  ```python
  import re; from PIL import Image, ImageDraw
  def raster(d, W, H, scale=12):
      im=Image.new('L',(W*scale,H*scale),255); dr=ImageDraw.Draw(im); x=y=0.0
      for cmd,args in re.findall(r'([Mmh])([^Mmh]*)', d):
          nums=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', args)]
          if cmd=='M': x,y=nums[0],nums[1]
          elif cmd=='m': x+=nums[0]; y+=nums[1]
          elif cmd=='h':
              n=nums[0]; row=int(y-0.5); dr.rectangle([int(x*scale),row*scale,int((x+n)*scale)-1,(row+1)*scale-1],fill=0); x+=n
      return im
  ```
- 新 QR 用 segno（pip install segno）；PNG：`segno.make(url, error='m').save(p, scale=12, border=1, dark='#0B1F2A')`。

## PPTX（pptxgenjs）
- 字型：Microsoft JhengHei（PowerPoint Mac 找不到 PingFang TC，會換 Calibri、表格中文消失）；等寬 Menlo。
- LibreOffice 渲染把粗體換成手寫字型，只能用 PowerPoint 原生匯出做 QA（`scripts/pptx-to-pdf.sh`）。
- 中文文字框寬度：CJK 每字約 0.16–0.17 吋（10.5pt），Latin 約 0.085 吋；chip 寬度按字元類別估。
- `numberedList` 的圓圈要和 rowH 對齊（helper 有 `badge` 參數）；截圖框 `frame()` 用 `maxH` 限高避免壓到頁尾（頁尾 y=5.2）。
- 媒體先轉 JPG，否則 50 張圖 20 MB。
- osascript 偶發 `-9074` 或 AppleEvent 逾時：先關閉所有 presentation，加 `with timeout`，`delay 8` 再存；檔案本身通常沒問題。
- `save p in dst` 的 dst 要用 `POSIX file "…"`，字串路徑會靜默失敗。

## 在使用者改過的 PPTX 上局部加東西（python-pptx）
以座標找原形狀再調整，另存新檔，不重建：
```python
from pptx import Presentation; from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE; from pptx.dml.color import RGBColor
E=914400; near=lambda v,t,tol=0.06: abs(v/E-t)<tol
prs=Presentation('in.pptx'); s=prs.slides[24]
for sh in s.shapes:
    if near(sh.left,7.0) and near(sh.top,1.45): rect=sh          # 原 QR 白卡
    elif sh.shape_type==13 and near(sh.left,7.1): pic=sh            # 原 QR 圖
rect.left,rect.top,rect.width,rect.height=Inches(7.5),Inches(1.35),Inches(1.5),Inches(1.84)
card=s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.5), Inches(3.29), Inches(1.5), Inches(1.84))
card.adjustments[0]=0.07; card.fill.solid(); card.fill.fore_color.rgb=RGBColor(255,255,255); card.line.fill.background()
s.shapes.add_picture('repo-qr.png', Inches(7.6), Inches(3.39), Inches(1.3), Inches(1.3))
prs.save('out.pptx')
```

## Classlido
- `X-Frame-Options: DENY`＋CSP：不能 iframe；改 repo 公開無關。要嵌入得改 app 的 headers（`frame-ancestors`），但不建議。
- 訪客建題不需 AI Key；場次代碼六位數；Q&A 匿名顯示但平台保存場次資料。

## 做法 B（offline-build-template）
- `npm install` 不會下載瀏覽器；不想再裝一份就指到本機既有的 Playwright Chromium：
  `CHROMIUM_PATH="$(find ~/Library/Caches/ms-playwright -maxdepth 7 -type f -name 'Google Chrome for Testing' | head -1)" npm run check`
- 主題 CSS 內嵌時要拿掉 `@import`（Google Fonts），字型用系統堆疊 `'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif`。
- `img()` 找不到圖回傳 null 時不要直接塞進屬性（會出現 `src="null"`）；範本已改成 `bgAttr()`／`mock()` 自動略過。
- 一頁多個小 QR（資源頁）jsqr 解不出來，改成逐個 QR 元素單獨截圖再解，或只驗工具頁的大 QR。

## 動畫與 QA（2026-09-29 工作坊 v2）
- `r-fit-text` 放在 grid 的 `1fr` 欄裡會把欄撐到無限寬（inline-block＋nowrap），只適合單獨一行的大字；多行問句改固定 `font-size`。
- Auto-Animate 兩頁在 QA 截圖時會抓到補間中途 → `autoAnimateDuration: STATIC ? 0 : 0.9`。
- 3D 翻卡：`.flip{height:固定}`＋`.inner{transform-style:preserve-3d}`，fragment 用 `custom` class（`.reveal .fragment.custom.flipall{opacity:1}`）否則整組卡片在點擊前是隱形的；QA 時 `html.static .flip .inner{transition:none}`。
- 一頁多張 QR：jsqr 對整頁只解得出一張，`qa-screenshots` 已改成逐個 `.qrcard` 元素截圖解碼，每張都要 `data-url`。
- `?print-pdf` 預設 `pdfSeparateFragments:true`，54 頁會印成 79 頁；在 initialize 設 false。
- 用 python-pptx 抓 PPTX 裡的 QR 圖片、再用 jsqr 解碼，可還原使用者手動加的 QR 網址（`skill 目錄自帶的 node_modules` 有 jsqr／pngjs）。
