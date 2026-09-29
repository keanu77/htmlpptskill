# htmlpptskill

用 Claude Code 做 **HTML 簡報（reveal.js）**，再轉成**講義 PPTX／PDF** 的完整流程。
兩個 skill、一套腳本、一份可直接跑的離線範本，全部來自實際講座（2026-09）踩過的雷。

| Skill | 管什麼 |
|---|---|
| `html-slide-deck` | 簡報本體：大綱確認 → 版型 → 圖片與 QR → 互動頁 → 逐頁 QA（含 QR 解碼比對）→ 轉講義 PPTX／PDF／原生可編輯 PPTX |
| `html-slide-effects` | 加在其上的效果：fragment、Auto-Animate、3D 翻卡、GSAP、計時條、lightbox、手機捲動模式、效能與離線守則 |

## 安裝

```bash
git clone https://github.com/keanu77/htmlpptskill.git
cd htmlpptskill && ./install.sh
```

`install.sh` 會把 `skills/` 下兩個資料夾複製到 `~/.claude/skills/`，並在 `html-slide-deck` 裡 `npm install` QA 用的小套件（jsqr、pngjs）。重開 `claude` 後輸入 `/skills` 就看得到。

另外需要（腳本會從執行目錄往上找 `node_modules`，找不到再找 npm 全域）：

- Node 18+、`playwright`（`npm i -D playwright && npx playwright install chromium`）
- `pptxgenjs`（講義與原生 PPTX；`npm i -g pptxgenjs` 即可）
- Python 3 與 `segno`、`pillow`、`python-pptx`
- 只有 `scripts/pptx-to-pdf.sh` 需要 macOS 的 PowerPoint；`scripts/gen-image.sh` 綁 Codex CLI 生圖，可換成任何生圖工具

## 流程

```
問觀眾／網路／要不要特效 → 大綱表（等確認）
  ├─ A 單檔手寫（≤25 頁）：複製 references/reveal-template.html
  └─ B 內容／版型分離（>25 頁、離線、多輪改稿）：複製 references/offline-build-template/
        content.js（一頁一個物件）＋ build.js（每種 type 一個渲染函式）→ npm run all → dist/index.html
圖片：AI 底圖（≤1600 寬轉 JPG）、Playwright 真實截圖、segno QR（每張 .qrcard 加 data-url）
QA：node scripts/qa-screenshots.mjs index.html out/   ← 逐頁截圖、JS 錯誤、溢出、QR 逐張解碼比對、montage.png
講義：node scripts/render-slides.mjs → node scripts/build-handout.mjs（圖片型 PPTX＋備忘稿）
      node scripts/print-pdf.mjs（?print-pdf 直接印 PDF，不用 PowerPoint）
      references/pptxgenjs-helpers.mjs（原生可編輯 PPTX，字型 Microsoft JhengHei）
效果：載入 html-slide-effects，加完回頭重跑 QA
```

## 目錄

```
skills/
  html-slide-deck/
    SKILL.md                      主流程（給 Claude 讀）
    package.json                  jsqr、pngjs
    scripts/
      qa-screenshots.mjs          逐頁 QA＋QR 解碼＋montage
      render-slides.mjs           1920×1080 逐頁截圖＋meta.json（標題、備註），fragment 全展開
      build-handout.mjs           圖片型講義 PPTX
      print-pdf.mjs               ?print-pdf → PDF
      resolve.mjs                 套件解析（skill 目錄 → 執行目錄往上 → npm 全域）
      montage.py                  contact sheet
      pptx-to-pdf.sh              PowerPoint 原生匯出（macOS）
      gen-image.sh                Codex CLI 生圖（可換）
    references/
      reveal-template.html        深色版型、chip／card／grid／steps／mock／qrcard／viz／Classlido 互動頁
      offline-build-template/     做法 B 完整範本（50 頁實例、23 種版型、check.mjs 驗收、CLAUDE.md／AGENTS.md 分工）
      pptxgenjs-helpers.mjs       原生 PPTX 的 theme 與 helper
      native-pptx-example.mjs     原生 PPTX 最小範例
      pitfalls.md                 踩過的雷與可複用片段
  html-slide-effects/
    SKILL.md
examples/
  pptx-edits-back-to-html.py      實例：講者在 PPTX 上手改後，把修改回灌 HTML 並加上全部效果
```

## 實例：examples/pptx-edits-back-to-html.py

作者把 52 頁工作坊 HTML 轉成 PPTX 給自己改，改完再回到 HTML。腳本做的事：

1. 用 python-pptx 把 PPTX 逐頁文字抽出來和 HTML 比對，找出真正是人改的句子（產生器改寫的另計）。
2. PPTX 裡手動加的 QR 圖片用 jsqr 解碼，還原成網址，再用 segno 產生 SVG 放回 HTML。
3. 先把 HTML 的 base64 圖片換成 `__IMGn__` 占位符再動正則，最後放回。
4. 套 fragment、章節 zoom、Auto-Animate、3D 翻卡、GSAP 逐字、內嵌測驗、計時條、lightbox（reveal.js 5.2.1）。
5. `STATIC` 開關：`navigator.webdriver` 或 `?print-pdf` 時關掉動畫、`autoAnimateDuration: 0`，QA 截圖與 PDF 才是最終狀態。

腳本綁定那份簡報的字串，直接跑不會成功；它示範的是每一種技巧怎麼安全地套進既有 HTML。

## 幾條硬規矩

- 大綱先確認再寫 HTML；QA 必做且要看 `montage.png`；改完至少再驗一輪。
- 會場可能沒網路：reveal.js、字型、圖片、QR 全部內嵌，`grep 'src="http\|@import\|fonts.googleapis'` 必須是 0。
- 每張 `.qrcard` 都要 `data-url`，QA 會逐張解碼比對，QR 錯了會被抓到。
- 醫學／學術場預設穩重：fragment 與章節 zoom 就好，3D 與 GSAP 放在封面、章節、核心概念、收尾四到五處。
- 部署（Cloudflare Pages 等）前先問；不自動開公開 repo。

## 授權

MIT。範本裡的示例內容（工具名稱、網址）屬作者，換成你自己的。
