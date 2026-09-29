---
name: html-slide-deck
description: 用 reveal.js 做單檔 HTML 簡報（深色專業風、AI 底圖、真實網頁截圖、Classlido 互動頁），並轉出圖片型講義 PPTX 與原生可編輯 PPTX。當使用者說「做一份 HTML 簡報」「reveal.js 簡報」「把這份簡報加底圖／截圖」「HTML 簡報轉 PPT／講義」「用 Classlido 互動」時用。與 html-slide-builder（原作者版）的差別：不用 OpenAI draw、不接公開 Firebase、不自動開公開 GitHub repo；生圖走本機 CLI（可換）、互動走自家平台、部署前先問。
---

# HTML 簡報（reveal.js）完整流程

2026-09-28／29 實戰整理：EBM × AI 附錄 24 頁、臨床教師工作坊 52 頁。所有腳本在 `scripts/`，模板與版型在 `references/`。

## 0. 先問兩件事（一次問完）

1. 觀眾與難度：專業版（可放指令）或零基礎版（全篇不放終端機指令，指令只進講者備註）。
2. 圖片來源：AI 底圖（codex-image）、真實截圖（Playwright，免憑證頁面）、或兩者。需要登入的儀表板截圖請使用者提供。
3. 現場：有沒有網路（沒有→走離線內嵌）、要不要 QR、要不要特效（要→加載 `html-slide-effects`；醫學／學術場預設穩重，只用 fragment 與章節 zoom）。

配色與字型預設沿用 `references/reveal-template.html` 的 tokens（bg 0B1F2A、amber F2B84B、teal 3FC1B7、coral E8846B、green 6FCF97；Noto Sans TC 走 Google Fonts，離線退回系統字）。

## 1. 大綱 → 確認 → 生成

- 先輸出大綱表（頁碼｜標題｜內容摘要｜標記 [BG]/[SHOT]/[INTERACT]/[VIZ]），**等使用者確認再寫 HTML**。
- **兩種做法，先選一種**：
  - **A 單檔手寫**（≤25 頁、一次交付）：複製 `references/reveal-template.html` 直接寫 `<section>`。
  - **B 內容／版型分離**（>25 頁、會多輪改稿、要離線、要 QR 驗證）：複製 `references/offline-build-template/` 成新專案，`content.js` 一頁一個物件（`type` 決定版型、`notes` 為備註），`build.js` 每種 type 一個渲染函式，`npm install && npm run all` 產出 `dist/index.html`（reveal.js／CSS／圖片／QR 全部內嵌，零外部請求）。範本內含 50 頁工作坊實例與 23 種版型（title、section、three、flow、ladder、prompt、platform、compare、decision、tool、resources、end…），沒放的圖會自動略過。改內容只改 `content.js`。
- 一頁一個 `<section>`，講者備註放 `<aside class="notes">`，按 S 開講者視窗。
- 版型只用模板裡的 class：`chip`、`card`、`grid g2/g3/g4`、`steps`、`mock`（假瀏覽器框放截圖）、`qrcard`、`note`、`chapter`、`viz`（滑桿前後對比）。
- 章節頁用 `data-background-image` 放 AI 底圖，opacity 0.9–0.95；內容頁若要底圖用 0.35 以下。
- 單檔交付：圖片轉 base64 嵌入（JPEG q80–85，底圖 ≤1600 寬，截圖 ≤1200 寬）。模板預設從 CDN 載 reveal.js 與 Google Fonts；**會場可能沒網路就把 reveal.js／notes.js／CSS 內嵌**（工作坊版 2.8 MB 即此做法），做法見模板檔頭註解。

## 2. 圖片

**AI 底圖**（`scripts/gen-image.sh "<prompt>" <name>`，`GEN_DEST` 指定目錄）：
- prompt < 350 字元；固定句型：「簡報章節底圖，橫式 16:9。深藍綠色背景（#0B1F2A），右半部〈主體〉以〈章節色〉細光線勾勒，左半部大片暗色留白。極簡、電影感，無任何文字與字母。」
- 每張自動存 `_versions/<name>/vN.png`，重生不覆蓋；一批 5–8 張可並行。
- 嵌入前轉 JPG（PNG 1.6 MB → JPG 100 KB）。

**真實截圖**（Playwright，從專案根目錄跑，用專案自己的 node_modules）：
- viewport 1440×900、deviceScaleFactor 1.5–2；`waitUntil: 'load'` 加 `waitForTimeout(2500)`，`networkidle` 在 GitHub 這類站會逾時。
- PubMed 會對 headless 回 403，改用 Chrome MCP 讀頁面文字。
- 工具首頁截上方 1440×540（16:5.3）放進 `mock` 框最好看；GitHub commits 頁要裁掉上方黑色導覽列（用「連續 30 列全白」偵測，單點取樣會被細線騙）。
- 需要登入的頁面（Cloudflare／Zeabur 儀表板）用 CSS 模擬畫面或請使用者截圖。Chrome MCP 分頁視窗可能只有 441px 且 resize 無效。

**QR code**：`python3 -c "import segno; segno.make(url, error='m').save('x.png', scale=12, border=1, dark='#0B1F2A')"`；要放進 HTML 用 `save(io.BytesIO(), kind='svg', xmldecl=False, svgclass=None, lineclass=None, omitsize=True, dark='#0B1F2A', light='#fff', border=1)`（**要 BytesIO，StringIO 會 TypeError**）再 `.decode()`，得到與模板一致的 `<path stroke=…>` 格式，加上 `class="qrsvg"` 放進 `.qrcard`。既有 SVG QR 要轉 PNG 時用 `references/pitfalls.md` 的光柵化函式，不必解碼。做法 B 在 build 時用 npm `qrcode` 產生（`QR.toString(url, { type: 'svg', margin: 1 })`）。**每個 `.qrcard` 加 `data-url="…"`**，QA 會解碼比對。

## 3. 互動

- **Classlido**（使用者自有平台）：不能 iframe（`X-Frame-Options: DENY`，改 repo 公開也無效）。互動頁＝掃碼加入 QR（/live/join）＋六位數代碼（`.cl-code` 以 localStorage 跨頁同步，模板「範例 8」含完整頁面與腳本；`.cl-code-input` 要 `stopPropagation` 否則 reveal 吃掉按鍵）＋「開啟主持畫面」新分頁按鈕＋學生手機端截圖。開場提問頁可放同一組 QR 與代碼。
- **滑桿對比**（`viz`）：適合「沒有版本控制 vs 有」這類前後對比。
- 不接原 skill 的公開 Firebase 示範專案（資料公開共用）。

## 4. QA（必做，用 subagent 逐頁看）

```bash
node ~/.claude/skills/html-slide-deck/scripts/qa-screenshots.mjs <index.html> <outdir>
```
- 逐頁截 1280×720（`h-XX.png`）、檢查 JS 錯誤、每頁有無 notes、內容是否溢出（高與寬）、**解碼頁上的 QR 並與 `.qrcard[data-url]` 比對**（jsqr 由 skill 自帶 `node_modules` 提供），寫 `report.json` 並拼 `montage.png`（`scripts/montage.py`，需 PIL）。腳本一開始就 `Reveal.configure({transition:'none'})`，不會截到滑動中的畫面。`errors` 內的 `ERR_FILE_NOT_FOUND` 代表圖片路徑錯；一頁多個小 QR 會「無法解碼」，屬正常。
- 做法 B 另有 `npm run check`（`scripts/check.mjs`）：頁數對 content.js、溢出、工具頁 QR 解碼；沒裝 Playwright 瀏覽器時設 `CHROMIUM_PATH`（見 pitfalls）。
- 離線驗收：`grep -c 'src="http\|@import\|fonts.googleapis' dist/index.html` 必須是 0，再拔網路重開一次。
- 常見誤判與真問題見 `references/pitfalls.md`：`ol.steps` 要用 `.reveal ol.steps` 覆蓋主題的編號、`center:true` 時側邊色條改用 `data-background-gradient` 做、說明卡標點掉行就改稿。
- 先自己看 `montage.png`，再派 general-purpose subagent 逐頁看 `h-XX.png` 列問題（每張一行、嚴重度）。修完至少再驗一輪。

## 5. 轉出 PPTX

**圖片型講義**（外觀 100% 一致，文字不可編）：
```bash
node scripts/render-slides.mjs <index.html> <outdir>      # 1920×1080 PNG + meta.json(標題/備註)
node scripts/build-handout.mjs <outdir> <out.pptx> "<頁尾文字>"   # 一頁一圖＋備忘稿
```
套件由 `scripts/resolve.mjs` 解析：從**執行目錄往上**找 `node_modules`，找不到再用 `npm root -g`；在有 playwright 的專案根目錄執行即可（pptxgenjs 可裝專案或全域），缺套件會列出找過的路徑後退出。先把 PNG 轉 JPG 再組講義（`build-handout` 會優先取同名 `.jpg`），檔案可小一半以上。
**原生可編輯版**：用 `references/pptxgenjs-helpers.mjs`（theme＋helpers：chrome/title/card/pillRow/numberedList/twoCol/frame/mono）逐頁重建，範例見 `references/native-pptx-example.mjs`。字型 **Microsoft JhengHei**（PowerPoint Mac 看不到 PingFang，會換成 Calibri 且表格中文消失）；等寬用 Menlo。媒體先轉 JPG，否則檔案 20 MB 起跳。

**PDF 講義最快的做法**：`node scripts/print-pdf.mjs <index.html> <out.pdf>`（reveal 的 `?print-pdf` 模式，1280×720 一頁一張，fragment 全展開，不需要 PowerPoint；`Reveal.initialize` 要設 `pdfSeparateFragments:false`，否則每個 fragment 各印一頁）。

**驗證一律用 PowerPoint 原生匯出**：`scripts/pptx-to-pdf.sh <in.pptx> <out.pdf>`（osascript，含關閉殘留文件與逾時重試）。LibreOffice 會把粗體換成手寫字型，不能拿來判斷版面。再 `pdftoppm -jpeg -r 110` 切圖給 subagent QA。

**在使用者改過的 PPTX 上加東西**：不要重建，用 python-pptx 依座標找形狀局部修改，另存新檔（範例：`references/pitfalls.md`「repo QR」段）。

## 6. 交付與收尾

- 產物放 `deliverables/<deck-name>/`：`index.html`（單檔）、講義 PPTX/PDF、可編輯 PPTX/PDF。
- 部署（`wrangler pages deploy <dir> --project-name …`）前**一定先問**；不自動 `gh repo create --public`。
- 交付時說明播放方式：方向鍵翻頁、`S` 講者備註、`Esc`／`O` 總覽、`F` 全螢幕、`B` 黑屏、`G` 跳頁、網址加 `?print-pdf` 匯出 PDF、加 `?view=scroll` 手機捲動閱讀。
- 要第二雙眼睛時用範本的 `CLAUDE.md`（主筆：可改 content／build／deck.css）＋`AGENTS.md`（Codex 稽核：只寫 REVIEW.md，查連結、QR、事實、用詞、醫療與隱私、版面、離線），使用者勾選後再改。
- HANDOFF 記：源頭是 HTML（或 content.js），改內容後三支腳本的順序（HTML → 可編輯 PPTX → 講義）。
- 想加逐步出現、Auto-Animate、計時條、3D、GSAP → 載入 `html-slide-effects`，加完回來重跑 QA。
- **有動畫的 deck 必加 STATIC 開關**：`var STATIC = navigator.webdriver || location.search.indexOf('print-pdf') >= 0;`，STATIC 時關 GSAP／計時條、`autoAnimateDuration: 0`、`html.static .fragment{transition:none}`，QA 截圖與 PDF 才是最終狀態。完整實例：本 repo `examples/pptx-edits-back-to-html.py`。
