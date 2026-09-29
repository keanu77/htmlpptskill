# 貢獻指南

- `skills/` 是唯一來源；改了腳本或範本，`README.md` 的目錄樹與 `CHANGELOG.md` 一起更新。
- 改 `.mjs` 跑 `node --check`；改 Python 跑 `ruff check`；改 shell 跑 `bash -n`（有 shellcheck 更好）。
- 範本與範例不得含個人資訊、金鑰、只在某台機器成立的路徑；占位一律用 `〈…〉` 或 `example.com`。
- 動到 QA 或範本時，本機跑一次 `skills/html-slide-deck/references/offline-build-template` 的 `npm run all`，再用 `scripts/qa-screenshots.mjs` 跑 `dist/index.html`。
- 開 issue 請附：CLI 與版本、作業系統、Node 版本、指令與完整錯誤訊息。
