# PLAN.md（製作計劃；複製範本後先填這份）

- **主題／場合**：
- **聽眾與時間**：（約每頁 45–60 秒；章節頁、QR 頁可更快）
- **頁數上限**：
- **現場**：有無網路｜要不要 QR｜要不要講者備註（預設要）
- **視覺**：沿用 styles/base.css；底圖放 assets/（bg-*.jpg）；工具截圖放 shots/<key>.png
- **分工**（可選）：主筆＝＿＿＿；稽核＝＿＿＿（見 ROLE-AUTHOR.md／ROLE-REVIEWER.md）
- **待決事項**：

## 階段
1. 大綱（頁碼｜標題｜type｜摘要）→ 確認
2. content.js → `npm run all` 通過
3. 看 check-output/ 逐頁截圖 → 修 → 再驗
4. 交付 dist/index.html（＋講義 PPTX／PDF，用 html-slide-deck 的腳本）
