---
name: html-slide-deck
description: 用 reveal.js 製作或修改 HTML 簡報（單檔、可離線、深色專業版型、真實截圖、QR、互動頁），逐頁截圖 QA 並驗證 QR，再輸出講義 PPTX／PDF 或原生可編輯 PPTX。當使用者說「做一份 HTML 簡報」「reveal.js 簡報」「簡報加底圖／截圖／QR」「HTML 簡報轉 PPT／講義／PDF」「離線簡報」時使用。要加動畫特效時搭配 html-slide-effects。
---

# HTML 簡報（reveal.js）完整流程

`$SKILL` 代表本檔所在目錄（Claude Code：`~/.claude/skills/html-slide-deck`；Codex：`~/.codex/skills/…`；Gemini：`~/.gemini/skills/…`；Grok：`~/.grok/skills/…`）。腳本在 `$SKILL/scripts/`，範本在 `$SKILL/references/`。
腳本需要 Node 18+、`playwright`（＋Chromium）、`pptxgenjs`、Python 3（`segno`、`pillow`、`python-pptx`）；套件從**執行目錄往上**找 `node_modules`，找不到再找 npm 全域（可設 `SKILL_PKG_ROOT`）。依賴請使用者在終端機先裝好，不要在對話中代裝。

## 0. 先問三件事（一次問完）

1. 觀眾與難度：專業版（可放指令）或零基礎版（全篇不放終端機指令，指令只進講者備註）。
2. 圖片來源：AI 底圖（任何生圖工具；本 skill 附 `scripts/gen-image.sh`，預設綁 Codex CLI、可用 `GEN_CMD` 換）、真實截圖（Playwright，免登入頁面）、或兩者。需要登入的畫面請使用者提供截圖。
3. 現場：有沒有網路（沒有→交付前一定內嵌）、要不要 QR、要不要特效（要→載入 `html-slide-effects`；醫學／學術場預設穩重）。

配色與字型沿用 `references/reveal-template.html` 的 tokens（bg 0B1F2A、amber F2B84B、teal 3FC1B7、coral E8846B、green 6FCF97；字型堆疊 Noto Sans TC → PingFang TC → Microsoft JhengHei）。

## 1. 大綱 → 確認 → 生成

- 先輸出大綱表（頁碼｜標題｜內容摘要｜標記 [BG]/[SHOT]/[INTERACT]/[VIZ]），**等使用者確認再寫 HTML**。
- **兩種做法，先選一種**：
  - **A 單檔手寫**（≤25 頁、一次交付）：複製 `references/reveal-template.html`，直接寫 `<section>`。範本預設從 CDN 載 reveal.js 5.2；交付前跑 `node $SKILL/scripts/inline-assets.mjs in.html out.html` 內嵌 reveal.js 與圖片（執行目錄要有 `reveal.js` 套件：`npm i reveal.js@5`）。
  - **B 內容／版型分離**（>25 頁、多輪改稿、要離線、要 QR 驗證）：複製 `references/offline-build-template/` 成新專案，填 `PLAN.md`，`content.js` 一頁一個物件（`type` 決定版型、`notes` 為備註），`npm install && npm run all` 產出 `dist/index.html`（reveal.js、CSS、圖片、QR 全內嵌）。範本是 8 頁中性起手；50 頁完整實例在 repo `examples/workshop-2026/`。
- 一頁一個 `<section>`，講者備註放 `<aside class="notes">`（播放時按 S）。
- 版型只用範本裡的 class：`chip`、`card`、`grid g2/g3/g4`、`steps`、`mock`（假瀏覽器框放截圖）、`qrcard`、`note`、`chapter`、`viz`（滑桿前後對比）。
- 章節頁 `data-background-image` 放底圖，opacity 0.9–0.95；內容頁若要底圖用 0.35 以下。
- 範本裡的 `〈…〉`、`example.com`、`replace-me` 都是占位，交付前全部換掉（QA 會對占位網址發警告）。

## 2. 圖片

**AI 底圖**：`GEN_DEST=<dir> $SKILL/scripts/gen-image.sh "<prompt>" <name>`。prompt < 350 字元；固定句型：「簡報章節底圖，橫式 16:9。深藍綠色背景（#0B1F2A），右半部〈主體〉以〈章節色〉細光線勾勒，左半部大片暗色留白。極簡、電影感，無任何文字與字母。」每張留 `_versions/<name>/vN.png`。嵌入前轉 JPG（≤1600 寬，q80–85）。

**真實截圖**（Playwright，從專案根目錄跑）：viewport 1440×900、deviceScaleFactor 1.5–2；`waitUntil:'load'` 加 `waitForTimeout(2500)`（`networkidle` 在 GitHub 這類站會逾時）。headless 被擋（例如 PubMed 403）或需要登入的頁面：請使用者提供截圖，或用 CLI 內建的瀏覽器工具（若有）。工具首頁截上方 1440×540 放進 `mock` 框最好看。

**QR**：
- PNG：`segno.make(url, error='m').save('x.png', scale=12, border=1, dark='#0B1F2A')`
- 放進 HTML 的 SVG：`segno.make(url, error='m').save(io.BytesIO(), kind='svg', xmldecl=False, svgclass=None, lineclass=None, omitsize=True, dark='#0B1F2A', light='#fff', border=1)` 再 `.decode()`（**要 BytesIO，StringIO 會 TypeError**），加 `class="qrsvg"` 放進 `.qrcard`。
- 做法 B 由 build.js 用 npm `qrcode` 產生。
- **每張 `.qrcard` 都要 `data-url="…"`**，QA 逐張解碼比對；解不開或不符就是失敗。
- 既有 SVG QR 要轉 PNG：用 `references/pitfalls.md` 的光柵化函式，不必解碼。

## 3. 互動

- **課堂互動平台**（多數不能 iframe）：互動頁＝掃碼加入 QR＋場次代碼（`.cl-code` 以 localStorage 跨頁同步，範本「範例 8」含完整頁面與腳本；`.cl-code-input` 要 `stopPropagation` 否則 reveal 吃掉按鍵）＋「開啟主持畫面」新分頁按鈕＋學生端截圖。範本以 `example.com` 占位，換成你的平台網址。
- **滑桿對比**（`viz`）：適合「沒有版本控制 vs 有」這類前後對比。
- 頁面裡放**真的能用的東西**（可作答的小測驗、可拉的滑桿）比截圖更有說服力；純 JS、離線可用。

## 4. QA（必做）

```bash
node $SKILL/scripts/qa-screenshots.mjs <index.html> <outdir>
```
- 先關閉轉場、展開全部 fragment，逐頁截 `h-NNN.png`（含垂直子頁），檢查 JS 錯誤、溢出（高與寬）、對外網路請求、每頁有無備註，**逐張 `.qrcard` 解碼比對 `data-url`**，寫 `report.json`，拼 `montage.png`（需 Python＋Pillow）。有問題 **exit 1**。
- `QA_OFFLINE=1` 時對外請求視為失敗（交付前必跑一次）；`QA_SKIP_QR=1` 明確略過 QR；`QA_FRAGMENTS=0` 保留初始狀態；沒跑過 `npx playwright install` 可設 `CHROMIUM_PATH`。
- 看圖：先看 `montage.png`，再逐張看有標記的 `h-NNN.png`（`report.json` 的 `problems`／`warnings`）；支援並行 agent 的 CLI 可分派另一輪只看圖、不看 HTML。每張一行、標嚴重度。修完至少再驗一輪。
- 輸出太長時只看 `problems`、`warnings` 與有標記的頁，不要整份 `report.json` 印出來。
- 常見誤判與真問題見 `references/pitfalls.md`。
- 這些腳本會執行簡報裡的 JavaScript，只對自己產生的 HTML 跑。

## 5. 轉出 PPTX／PDF

**圖片型講義**（外觀 100% 一致，文字不可編）：
```bash
node $SKILL/scripts/render-slides.mjs <index.html> <dir>          # 1280×720 ×1.5 → JPEG + meta.json
node $SKILL/scripts/build-handout.mjs <dir> <out.pptx> "<作者>"   # 一頁一圖＋備忘稿；第三個參數只寫進中繼資料
```
**PDF 講義**（最快、跨平台）：`node $SKILL/scripts/print-pdf.mjs <index.html> <out.pdf>`（reveal 的 `?print-pdf`，fragment 全展開；範本已設 `pdfSeparateFragments:false`，否則每個 fragment 各印一頁）。

**原生可編輯 PPTX**：用 `references/pptxgenjs-helpers.mjs`（theme＋helpers：chrome/title/card/pillRow/numberedList/twoCol/frame/mono）逐頁重建，範例見 `references/native-pptx-example.mjs`。字型 **Microsoft JhengHei**（Mac 與 Windows 的 PowerPoint 都有；PingFang 在 PowerPoint Mac 不可用）；等寬 Menlo／Consolas。媒體先轉 JPG。

**驗證**：macOS＋PowerPoint 用 `$SKILL/scripts/pptx-to-pdf.sh <in.pptx> <out.pdf>`（原生匯出，只關閉它自己開的文件；首次執行要在螢幕前允許「自動化」權限）。沒有 PowerPoint：圖片型講義本身就是截圖，不必再驗；原生 PPTX 用 LibreOffice `soffice --headless --convert-to pdf` 只能驗位置，不能驗字型。

**在使用者改過的 PPTX 上加東西**：不要重建，用 python-pptx 依座標找形狀局部修改，另存新檔（範例：`references/pitfalls.md`）。**使用者在 PPTX 手改後要回灌 HTML**：完整實例 repo `examples/pptx-edits-back-to-html.py`。

## 6. 交付與收尾

- 產物放使用者指定目錄（預設 `deliverables/<deck-name>/`）：`index.html`（單檔）、講義 PPTX／PDF、可編輯 PPTX。
- 交付前：`QA_OFFLINE=1` 跑一次 QA；把播放方式寫給使用者：方向鍵翻頁、`S` 講者備註、`Esc`／`O` 總覽、`F` 全螢幕、`B` 黑屏、`G` 跳頁、`?print-pdf` 匯出、`?view=scroll` 手機捲動閱讀。
- 部署、開 repo 前**一定先問**。
- 有動畫的 deck 必加 STATIC 開關（見 `html-slide-effects`），QA 截圖與 PDF 才是最終狀態。
- 在專案筆記記下：源頭是 HTML（或 content.js），改內容後三支腳本的順序（HTML → 可編輯 PPTX → 講義）。
