# AGENTS.md

給在這個 repo 裡工作的 AI coding agent（Codex、Gemini CLI、Grok Build、Claude Code 都會讀這個檔或同等檔案）。

## 這個 repo 是什麼
兩個 Agent Skill（`skills/html-slide-deck`、`skills/html-slide-effects`）加上腳本與範本，用來做 reveal.js HTML 簡報並轉講義 PPTX／PDF。使用者通常是**把 skill 裝到自己的 CLI 後在別的專案用**，不是在這個 repo 裡做簡報。

## 使用 skill 時
- 先讀 `skills/html-slide-deck/SKILL.md`；要加特效再讀 `skills/html-slide-effects/SKILL.md`。
- 腳本用 `node $SKILL/scripts/<name>.mjs` 執行（`$SKILL` 是裝好的 skill 目錄；在本 repo 內就是 `skills/html-slide-deck`）；套件由 `scripts/resolve.mjs` 從執行目錄往上找 `node_modules`，找不到再找 npm 全域。
- SKILL.md 裡提到「派 subagent 逐頁看截圖」的地方，沒有 subagent 功能的 CLI 就自己逐張看 `montage.png` 與 `h-XX.png`。
- 沒有 Chrome 擴充或 MCP 的環境，需要登入的頁面截圖請使用者提供，不要嘗試登入。

## 修改這個 repo 時
- `skills/` 是唯一來源；`README.md` 的目錄樹要跟著更新。
- 改 `.mjs` 後跑 `node --check`；改 Python 後跑 `ruff check`；改 shell 後跑 `bash -n`（有 shellcheck 更好）。CI 會跑同樣的檢查加範本 smoke build。
- 範本與範例裡不要放個人資訊、金鑰或只在某台機器成立的路徑。
- 不要自動部署、不要開新的公開 repo。
