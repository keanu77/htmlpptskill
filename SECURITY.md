# 安全說明 / Security

## 回報漏洞 / Reporting a vulnerability

請用 GitHub 的 [Private vulnerability reporting](https://github.com/keanu77/htmlpptskill/security/advisories/new) 私下回報，不要開公開 issue。請附：受影響的檔案或腳本、重現步驟、影響範圍。
Please report privately via GitHub's private vulnerability reporting, not a public issue. Include the affected file or script, steps to reproduce, and impact.

## 手機即時投票的 ADMIN_KEY / The live-poll ADMIN_KEY

`scripts/poll-slides.mjs` 產生的**講者版 HTML 內含 ADMIN_KEY**。拿到這把 key 的人可以開題、關題、清空所有票數。
The presenter HTML produced by `scripts/poll-slides.mjs` **contains the ADMIN_KEY**. Anyone holding it can open, close and wipe every poll.

- 講者版只放講者電腦：**不要上傳到網站、GitHub Pages、雲端硬碟，不要寄出、不要 commit。**
  Keep the presenter file on the presenter's computer only: never publish it, put it on GitHub Pages or a shared drive, email it, or commit it.
- 要分享給觀眾或公開的版本，用沒跑過 `poll-slides.mjs` 的原始 HTML，或用模擬模式 `--sim`（不連後端、不含 key）。
  To share or publish, use the original HTML, or simulation mode `--sim` (no backend, no key).
- key 存在 `worker/.dev.vars`（已 gitignore）與 Cloudflare secret（`wrangler secret put ADMIN_KEY`），不要寫進原始碼。
  The key lives in `worker/.dev.vars` (gitignored) and a Cloudflare secret, never in source code.
- commit 前檢查 staged 內容沒有 key：`git diff --cached | grep -c "<你的 key>"` 應為 0。
  Before committing, check the staged diff does not contain the key.
- 懷疑外流就換一把：`openssl rand -hex 24`，重新 `wrangler secret put ADMIN_KEY`、更新 `.dev.vars`，再重新產生講者版。舊檔裡的 key 立即失效。
  If it may have leaked, rotate it and regenerate the presenter file; the old key stops working immediately.

投票後端的其他設計：手機頁與 `/api/state` 在揭曉前不含答案；投票的 voter 代號限 8–64 字元英數；request body 上限 2 KB；控制 API 需要 `Authorization: Bearer`。觀眾匿名作答，不收集個人資料。
Other backend properties: answers are never sent before the reveal; voter IDs are restricted to 8–64 alphanumeric characters; request bodies are capped at 2 KB; the control API requires a bearer token; voting is anonymous.

## QA 腳本會執行簡報裡的 JavaScript / QA scripts run the deck's JavaScript

`qa-screenshots.mjs`、`render-slides.mjs`、`print-pdf.mjs` 用 Chromium 開啟並執行簡報。只對自己產生或審過的 HTML 跑，不要拿來檢查來路不明的檔案。
These scripts open and execute the deck in Chromium. Only run them on HTML you generated or reviewed.

## 部署 / Deployment

兩個 skill 都不會自己部署或開公開 repo；agent 在部署、建立帳號或推到公網前必須先問使用者。
Neither skill deploys or creates public repositories on its own; the agent must ask before deploying, creating accounts or publishing.
