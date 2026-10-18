# 規劃與設計原則、現成工具（整理自 X 使用者分享，2026-10-17）

> 來源是 X 上的使用者分享，非官方文件；工具未經實測，看需求再自行評估。原始整理與來源連結：repo `docs/html-slides-tips-from-x-2026-10-17.md`（修改時兩處一起改）。

## 規劃與設計原則（第 1 步「大綱」時套用）

- **先想受眾、結論、敘事結構，再生成頁面**；依內容選圖表、表格、時間線、轉場，輸出可離線分享的單檔 HTML。
- **固定畫布、自包含單檔**（本 skill 是 1280×720）；大字、留白、統一設計系統；在瀏覽器預覽中改，必要時才加動畫。
- **字型、留白、線條、配色、動效要像同一套設計**，不要拼湊模板：只用範本的 tokens 與 class。
- **一份來源輸出多種格式**（簡報、PDF、網站），避免同一內容改三次：本 skill 以 HTML（或 content.js）為源頭，講義 PPTX／PDF 由腳本產生。
- **互動區塊依結構挑**：點擊深挖、滑桿重算、現場投票；整份依「結論與依據／分類／比較／因果／解決方案／順序」其中一種組織。互動頁做法見 SKILL.md 第 3 節。

## 現成 Skill 與工具（需要時參考）

| 名稱 | 用途 |
|---|---|
| guizang-ppt-skill | 文章或大綱轉瀏覽器 HTML 簡報，雜誌風／瑞士風，講稿備註、排練計時、獨立觀眾螢幕 |
| ppt-master | 原生可編輯 PPTX |
| frontend-slides | 高完成度 HTML 簡報 |
| ppt-director | 先導演再生成，HTML 預覽審查後轉 PPTX |
| html-to-ppt | 先寫 HTML 簡報再匯出原生 PPTX，文字、表格、圖表可編輯 |
| Slide Studio | 像 PowerPoint 一樣編輯 AI 生成的 HTML 簡報，匯出仍是乾淨 HTML、保留動畫 |
| DeckFlow | PPTX 轉 HTML 簡報，輸出分頁 HTML 與素材 |
| Quarkdown | 一份 Markdown 同時輸出簡報、PDF、網站 |
| Lieflat Charts | 貼文所述：字型、留白、線條、配色、動效一致的設計 Skill，支援 SKILL.md 的 Agent |
