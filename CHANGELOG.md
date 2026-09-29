# Changelog

## 1.1.0 — 2026-09-29
四模型審查（Codex／Claude／Grok／Gemini）後的整批修正：
- 安裝：`install.sh` 支援 Claude Code／Codex／Gemini／Grok 與 `--project`（.agents/skills）、既有目錄先備份、Node 版本檢查；加 Claude Code plugin 設定（`.claude-plugin/`）與根 `AGENTS.md`／`CLAUDE.md`。
- QA：有問題回傳 exit 1；逐張 `.qrcard` 解碼比對 `data-url`；記錄對外請求（`QA_OFFLINE=1` 時視為失敗）；支援垂直子頁、`CHROMIUM_PATH`、含空白的路徑；截圖檔名三位數；`render-slides` 直接輸出 JPEG。
- 新腳本 `inline-assets.mjs`（CDN 範本 → 離線單檔）；`print-pdf.mjs` 讀 Reveal 尺寸並等待就緒；`pptx-to-pdf.sh` 只關自己開的文件、路徑安全傳遞、非 macOS 明確退出；`gen-image.sh` 支援 `GEN_CMD`、在空目錄跑、prompt 前綴限制。
- 離線範本：`build.js` 全部文字改由 `content.js` 供給（含決策樹、標題、章節底圖）、`qrCard` 加 `data-url`、`pdfSeparateFragments:false`、reveal.js ^5.2；中性 8 頁起手 `content.js`；補 `PLAN.md`、`ROLE-AUTHOR.md`／`ROLE-REVIEWER.md`；50 頁實例移到 `examples/workshop-2026/`。
- SKILL.md 去廠商化（`$SKILL` 路徑、無 subagent／瀏覽器外掛名稱），`html-slide-effects` 補觸發語、STATIC 開關、翻卡 fragment 修正、快捷鍵衝突。
- 單檔範本：reveal.js 5.2.1、占位 QR（example.com）、去除個人內容。
- 新增 README 快速開始、支援矩陣、疑難排解、CONTRIBUTING、requirements.txt、CI。

## 1.0.0 — 2026-09-29
首次公開：html-slide-deck、html-slide-effects 兩個 skill、腳本、離線範本、回灌實例。
