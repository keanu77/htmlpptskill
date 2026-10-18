# Changelog

## 1.3.0 — 2026-10-18

- 新增觀眾手機即時投票 `skills/html-slide-deck/references/live-poll/`：Cloudflare Worker＋Durable Object 後端（手機頁、題目 JSON、WebSocket 推播、斷線輪詢）、投影片端 `screen/live-poll.js`／`.css`、`load-test.mjs`（150 支手機壓測）；新腳本 `scripts/poll-slides.mjs` 把占位 section 換成加入頁與投票頁並注入講者端程式。源自 2026-10 學會演講的做法（現場 60 人使用）。
- 新增 `references/interactive-pages.md`：互動地圖（經緯度投影 SVG、距離圈）、製作技巧頁（格式比較表＋AI 協作清單）、PPTX 轉 HTML 插入互動頁與頁碼重編。`docs/TECHNIQUES.md` 補 4.5–4.7，README 同步。
- X 簡報技巧整理的「流程與設計原則」「現成 Skill 與工具」併入 skill：`references/design-principles.md`，SKILL.md 第 1 步要求規劃前先讀；原 docs 檔標註兩處一起改。
- README 新增不收合的「📱 現場互動」章節與截圖（`docs/live-poll.png`），導覽列與流程圖同步。
- 新增 `docs/html-slides-tips-from-x-2026-10-17.md`：整理自 X 使用者分享的 HTML 簡報流程原則、現成 Skill／工具與本專案固定規則（含來源連結）；README 目錄樹補連結。
- 修正：固定規則原本只在 `docs/`，`install.sh` 不會安裝、skill 也沒引用。改為在兩個 skill 各附 `references/fixed-rules.md`（規則文字照抄），並在各自 `SKILL.md` 要求先讀並遵守；README 開頭簡介補上這兩點。

## 1.2.0 — 2026-09-30
- 新增 `docs/TECHNIQUES.md`：播放快捷鍵、換場設定、逐步出現／Auto-Animate／3D 翻卡／卡片牆飛入／GSAP 逐字／Three.js 粒子／Spotlight／計時條／lightbox／頁內測驗的可複製程式碼、STATIC 開關、常見的坑。
- 建議換場改為全場 `fade`＋`fast`、章節頁 `zoom`；範例腳本同步。
- `examples/three-particles-entry.js`：Three.js 封面粒子模組。

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
