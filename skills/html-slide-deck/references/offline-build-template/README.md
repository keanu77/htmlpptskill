# 離線 reveal.js 簡報範本（做法 B：內容／版型分離）

```bash
cp -R <本目錄> my-deck && cd my-deck
npm install && npx playwright install chromium   # 已有 Chromium 可改設 CHROMIUM_PATH
# 編輯 content.js（一頁一個物件），底圖放 assets/、工具截圖放 shots/<key>.png
npm run all      # build → dist/index.html，再逐頁截圖驗收（check-output/）
```

- 版型（type）：title、about、question、three、section、agents、flow、ladder、prompt、platform、terms、fork、steps、autodeploy、domains、backend、compare、decision、catoverview、cat、tool、demosteps、risk、resources、end（渲染函式在 build.js）。
- 50 頁完整實例：repo 的 `examples/workshop-2026/content.js`，複製過來取代 content.js 即可 build（截圖與底圖需自備）。
- `content.js` 的文字欄位視為可信 HTML；網址與標籤會跳脫。
- 講義 PPTX／PDF：用 html-slide-deck 的 `render-slides.mjs`、`build-handout.mjs`、`print-pdf.mjs` 對 `dist/index.html` 跑。
