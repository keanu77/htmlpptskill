# CLAUDE.md：主筆規則

你是這份簡報的主筆。先讀 PLAN.md。

## 可以改
- `content.js`：所有文字、網址、講者備註
- `build.js`：版型渲染
- `styles/deck.css`：新增樣式

## 不要改
- `styles/base.css`（沿用 appendix-html 的視覺，要一致）
- `REVIEW.md`（Codex 的稽核紀錄，只能讀）
- `dist/`（由 build 產生）

## 規則
- 使用繁體中文、全形標點；平台名稱寫 GitHub、Cloudflare、Zeabur、Claude Artifacts
- 總頁數維持 50 頁；新增一頁就要刪一頁
- 必須可離線：不得引用 CDN、Google Fonts 或任何外部資源
- 每次修改後執行 `npm run all`，全部通過才 commit；commit 訊息用中文一句話
- 不確定的事實（價格、免費額度、功能）不要寫數字，寫「以官網為準」
- 不放病人可識別資訊；醫療敘述不做療效保證
- 處理 REVIEW.md 時，只修改使用者已勾選的項目
