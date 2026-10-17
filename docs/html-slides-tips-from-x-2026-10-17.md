# HTML 簡報技巧整理（來源：X 使用者分享，2026-10-17 整理）

> 以下為 X 上的使用者分享，非官方文件；工具未經實測，GitHub 星數為貼文所述。

## 流程與設計原則
- 先規劃受眾、結論與敘事結構，再生成頁面；依內容選用圖表、表格、時間線、轉場，輸出可離線分享的單檔 HTML。來源：https://x.com/leowu_love/status/2082124253437247863
- 1920×1080 自包含單檔 HTML；大字體、留白、統一設計系統；在瀏覽器預覽中修改，必要時再加動畫。來源：https://x.com/grok/status/2094649538795409803
- 字體、留白、線條、配色與動效要像同一套設計，而非拼湊模板（Lieflat Charts，支援 SKILL.md 的 Agent 皆可用）。來源：https://x.com/SlivenRed/status/2095689004289315064
- 一份 Markdown 同時輸出簡報、PDF、網站（Quarkdown），避免同內容改三次。來源：https://x.com/Ryrenz/status/2088999221751918792
- 互動式簡報可加點擊深挖、滑塊重算等動態區塊，依結論依據/分類/比較/因果/解決/順序等結構組織。來源：https://x.com/grok/status/2104797571373781273

## 現成 Skill 與工具
- guizang-ppt-skill（op7418）：文章或大綱轉瀏覽器 HTML 簡報，雜誌風與瑞士風，支援講稿備註、排練計時、獨立觀眾螢幕。來源：https://x.com/0xbroli/status/2109844345503551909
- PPT 三件套：ppt-master（原生可編輯 PPTX）、frontend-slides（高完成度 HTML 簡報）、guizang-ppt-skill。來源：https://x.com/aigcgu/status/2110364819144814686
- 8 個簡報 Skill 整理（含 ppt-director：先導演再生成，HTML 預覽審查後轉 PPTX）。來源：https://x.com/zstmfhy/status/2079713242742706366
- html-to-ppt：先寫 HTML 簡報再匯出原生 PPTX，文字、表格、圖表可編輯。來源：https://x.com/hubingkang/status/2109474068609298539
- 單檔 HTML 演講者模式：講者備註、計時器、黑屏，免安裝免網路。來源：https://x.com/QingQ77/status/2077299124215357910
- Slide Studio：像 PowerPoint 一樣編輯 AI 生成的 HTML 簡報，匯出仍是乾淨 HTML、保留動畫，純瀏覽器執行。來源：https://x.com/GoldenSun_01/status/2075881350281019635
- DeckFlow：PPTX 轉 HTML 簡報，輸出分頁 HTML 與素材，可再交給 Agent 修改。來源：https://x.com/DeckFlowHQ/status/2101962124063134205

## Keanu 的固定規則（套用到本專案）
- 社群輪播圖頁尾：「運動醫學科 吳易澄醫師製作 sportsmedicine.tw」
- 課程簡報不得刪頁，只能同數或增加
- 醫療內容避免絕對療效宣稱；解剖名詞、左右側、縮寫自我檢查，存疑標（待確認）
- 文獻預設引用近五年並標年份
