---
name: html-slide-effects
description: 為既有的 reveal.js HTML 簡報加入效果：逐步出現（fragment）、Auto-Animate、3D 翻卡、GSAP 逐字動畫、Three.js、計時條、點圖放大、手機捲動模式，並控管效能、減少動態效果與離線。當使用者說「加動畫」「加特效」「逐步出現」「卡片翻面」「Auto-Animate」「GSAP」「讓簡報更生動」「有什麼效果可以加」時使用；簡報本體用 html-slide-deck 做，加完效果回去重跑它的 QA。
---

# HTML 簡報進階技巧（reveal.js）

使用時機：使用者想讓 HTML 簡報更生動、更好講、更適合現場互動，或問「有什麼特效或技巧可以加」。簡報本體的製作流程（版型、圖片、QA、轉 PPTX）在 `html-slide-deck`；本 skill 只管加在其上的效果。加完效果一律回頭跑 `html-slide-deck` 的 `qa-screenshots.mjs`。

## 使用原則（先讀）

1. **只放在 4～5 個關鍵時刻**：封面、章節轉折、核心概念圖、收尾。其他頁保持乾淨。
2. **離線優先**：所有函式庫從 npm 取得後內嵌進 HTML，不引用 CDN。影片檔例外，放在 HTML 旁邊，不轉 base64。
3. **尊重減少動態效果**：系統開了「減少動態效果」時，一律退回淡入淡出（見第 5 節）。
4. **在實際播放的電腦上彩排**：3D 和粒子在舊筆電或外接投影時可能卡頓。
5. **每次加完都重跑驗收**：逐頁截圖時關閉轉場，確認沒有溢出，最終狀態正確。

先問使用者：聽眾是誰、現場有沒有網路、播放電腦的等級、想要「穩重」還是「驚豔」。醫療或學術聽眾預設偏穩重，只用第 1、2 級。

---

## 1. 內建功能（零成本，優先使用）

### 逐步出現（Fragments）
```html
<ul>
  <li class="fragment">第一點</li>
  <li class="fragment fade-up">第二點</li>
  <li class="fragment highlight-current-blue">目前講到這點</li>
</ul>
<div class="fragment" data-fragment-index="2">指定順序</div>
```
適合：條列、決策樹一步一步揭曉、比較表逐欄出現。

### Auto-Animate（相鄰兩頁自動補間）
```html
<section data-auto-animate>
  <div data-id="box" style="width:200px">Lv2</div>
</section>
<section data-auto-animate data-auto-animate-duration="0.8">
  <div data-id="box" style="width:900px">Lv2 Cloudflare Pages</div>
</section>
```
- 相同文字或相同 `src` 會自動配對；`data-id` 可手動指定配對。
- 可以動畫的屬性：位置、字級、顏色、背景、padding、margin。
- 適合：總覽圖放大成單項頁、流程圖某一步展開、prompt 變成結果。

### 轉場（每頁可不同）
```html
<section data-transition="zoom">章節頁</section>
<section data-transition="convex-in fade-out" data-transition-speed="slow">…</section>
```
樣式：none、fade、slide、convex、concave、zoom；背景用 `data-background-transition`。建議全場用 slide，只有章節頁用 zoom。

### 版面輔助 class
- `r-fit-text`：文字自動放到最大，適合一句話頁。
- `r-stretch`：圖片或影片填滿剩餘高度。
- `r-stack`：多個元素疊在同一位置，搭配 fragment 依序替換。

### 手機捲動模式（Scroll view，5.0 起）
- 網址加 `?view=scroll`，或設定 `view: 'scroll'`。
- `scrollActivationWidth` 控制手機是否自動切換；設 `null` 或 `0` 則關閉。
- 用途：部署後在封面放 QR，聽眾用手機跟著看、會後帶走。

### 點圖放大（Lightbox，5.2 起；html-slide-deck 範本已是 5.2）
```html
<img src="shot.png" data-preview-image>
<video data-preview-video="demo.mp4"></video>
```
需要 reveal.js 5.2 以上；從 5.1 升級後要重跑驗收。

### 背景影片
```html
<section data-background-video="demo.mp4" data-background-video-muted data-background-video-loop></section>
```
適合：現場 demo 的預錄備案。

### 講者要知道的快捷鍵
`S` 講者備註、`Esc`／`O` 總覽、`F` 全螢幕、`B` 或 `.` 黑屏、`G` 跳頁、網址加 `?print-pdf` 匯出 PDF。

---

## 2. 小型外掛（可內嵌）

| 外掛 | 用途 | 注意 |
|---|---|---|
| elapsed-time-bar（tkrkt） | 底部時間進度條，和頁數進度條對照，看出講快還是講慢 | 設 `allottedTime`（毫秒），可暫停、重設 |
| Chalkboard（rajgoel） | `C` 在投影片上畫、`B` 開黑板、`D` 下載畫記 | 需要 Font Awesome（自有授權），要一起內嵌才能離線；`B` 與 reveal 內建黑屏鍵衝突，要改鍵 |
| Spotlight（denniskniep） | 滑鼠變聚光燈，其他區域變暗 | 講解截圖細節時很有效 |
| reveal.js-menu | 側邊目錄快速跳頁 | Q&A 時找頁面方便 |

內嵌方式：把外掛的 JS 與 CSS 讀進建置腳本，直接寫進 `<script>` 與 `<style>`，並加入 `plugins: [...]`。套件名稱與版本以各外掛 repo 為準，**不要猜 npm 名稱**；抓不到就自己寫（計時條約 20 行）。

不建議：需要伺服器的投票或問答外掛（Poll、Seminar、Questions）。現場互動改用使用者自己的課堂互動工具，並準備口頭提問作為沒網路時的備案。

---

## 3. 3D 與炫技動畫

### CSS 3D（純 CSS，離線）
卡片翻面：
```css
.flip { perspective: 1000px; }
.flip .inner { transition: transform .8s; transform-style: preserve-3d; position: relative; }
.flip.visible .inner { transform: rotateY(180deg); }
.flip .front, .flip .back { backface-visibility: hidden; position: absolute; inset: 0; }
.flip .back { transform: rotateY(180deg); }
```
```html
<div class="flip fragment custom"><div class="inner"><div class="front">工具名稱</div><div class="back">教學用法</div></div></div>
```
```css
.reveal .fragment.custom { opacity: 1; visibility: inherit; }   /* 沒有 custom 時，卡片在點擊前是隱形的，正面看不到 */
.flip.visible .inner { transform: rotateY(180deg); }
```
（fragment 顯示時加上 `visible` class → 翻面；一組卡片想一次翻，把 `fragment custom` 放在容器上，卡片用 `transition-delay` 錯開。）

立體階梯：父層 `perspective: 1200px`，每一階 `transform: rotateX(20deg) translateZ(n*40px)`，每階加 `fragment` 依序升起。

卡片牆飛入：每張卡片的起始狀態是 `transform: translateZ(-800px) rotateY(40deg); opacity: 0`，出現時回到 0；用 `transition-delay` 錯開。

### GSAP（2025 年起完全免費，含 SplitText、MorphSVG）
- 從 npm 安裝 `gsap`，內嵌 `dist/gsap.min.js`（約 70 KB）；需要外掛時一起內嵌，例如 `dist/SplitText.min.js`。
- 在切換到該頁時才播放：
```js
Reveal.on('slidechanged', (e) => {
  if (e.currentSlide.id === 'cover') {
    gsap.from('#cover h1 .char', { y: 40, opacity: 0, stagger: 0.04, duration: 0.6 });
  }
});
```
- 數字跳動：
```js
const o = { v: 0 };
gsap.to(o, { v: 13, duration: 1.2, onUpdate: () => (el.textContent = Math.round(o.v)) });
```
適合：封面標題逐字浮現、收尾數字計數、流程圖 SVG 形狀變形。

### Three.js（真 3D，檔案大）
- 新版只提供 ES module，要用 esbuild 把 three 和自己的程式打包成一個 IIFE 檔，再內嵌。
- 只在需要的頁面執行 render loop，離開就停：
```js
Reveal.on('slidechanged', (e) => (running = e.currentSlide.id === 'cover'));
```
- 適合：封面粒子星空、旋轉地球、可轉動的解剖模型。
- 會讓 HTML 增加數百 KB，務必在播放電腦上測試幀率。

### impress.js（整份變成 3D 畫布，類似 Prezi）
- 每頁用 `data-x`、`data-y`、`data-z`、`data-rotate-y`、`data-scale` 定位，頁與頁之間鏡頭飛行。
- 要換掉整個框架，只在使用者明確想要全場鏡頭飛行時才用。一般用 reveal.js 在單頁內模擬即可。

### View Transitions API
適合多頁式網站的頁面間轉場；reveal.js 單頁簡報通常不需要。

---

## 4. 最有說服力的互動：頁面裡放能用的東西

- 講「AI 30 秒做出測驗」時，同一頁直接放一個能作答的小測驗（純 JS，離線可用），現場請聽眾點。
- 講工具時放 QR code（用 `qrcode` 套件在建置時產生 SVG 內嵌），並用解碼驗證網址正確。
- 示範結果比描述結果更有說服力，這類頁面優先於任何特效。

---

## 5. 減少動態效果與效能保護

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition-duration: .01ms !important; }
}
```
```js
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
// STATIC：QA 截圖（Playwright）與 ?print-pdf 時關掉所有動畫，截到的才是最終狀態
const STATIC = navigator.webdriver || location.search.indexOf('print-pdf') >= 0;
if (STATIC) document.documentElement.classList.add('static');
Reveal.initialize({ transition: REDUCE ? 'fade' : 'slide', autoAnimateDuration: STATIC ? 0 : 0.9, pdfSeparateFragments: false /* ... */ });
if (REDUCE || STATIC) { /* 不啟動 GSAP 與 Three.js、計時條，直接顯示最終狀態 */ }
```
```css
html.static .flip .inner, html.static .reveal .fragment { transition: none !important; }
```
`prefers-reduced-motion` 的 CSS 只作用在自己加的效果（`.flip`、GSAP 目標、fragment），不要用全域 `*` 把 reveal 換頁也壓掉。

---

## 6. 建議配置（依風格）

| 風格 | 使用 |
|---|---|
| 穩重（醫學、學術） | Fragments、Auto-Animate、章節 zoom、時間進度條、點圖放大、頁內互動 |
| 中間 | 再加 CSS 3D 階梯或卡片翻面、GSAP 封面與收尾 |
| 驚豔（發表會、開幕） | 再加 Three.js 封面、卡片牆飛入、Spotlight |

---

## 7. 驗收清單

- [ ] 逐頁截圖（先 `Reveal.configure({ transition: 'none' })`），沒有溢出
- [ ] 有 fragment 的頁面：`?print-pdf` 匯出時所有內容都出現
- [ ] 拔網路後重開，所有動畫、圖片、QR 正常
- [ ] 開啟「減少動態效果」後，簡報仍可完整閱讀
- [ ] 在實際播放的電腦上跑過一次，3D 頁面沒有卡頓
- [ ] HTML 檔案大小可接受（一般 < 5 MB）
- [ ] 向使用者說明：加了哪些效果、在哪幾頁、怎麼關掉

## 與 html-slide-deck 的接點

- Fragment 頁在 `render-slides.mjs` 轉講義時只會截到**最終狀態**（腳本已關閉轉場）；要每個 fragment 各一張就先把該頁拆成多頁。
- 內嵌 GSAP／外掛時，插入位置要在 reveal.js 之後、`Reveal.initialize` 之前；找**最後一個** `</body>`（notes.js 原始碼裡也有一個）。
- 加了 `elapsed-time-bar` 之類的外掛後，`qa-screenshots.mjs` 的 `errors` 若出現外掛的 console error 要先修，再看版面。

## 參考來源（2026-09 查閱）
- https://revealjs.com/auto-animate/
- https://revealjs.com/transitions/
- https://revealjs.com/scroll-view/
- https://github.com/hakimel/reveal.js/releases
- https://github.com/hakimel/reveal.js/wiki/Plugins,-Tools-and-Hardware
- https://github.com/rajgoel/reveal.js-plugins
- https://github.com/tkrkt/reveal.js-elapsed-time-bar
- https://github.com/denniskniep/reveal.js-plugin-spotlight
- https://github.com/impress/impress.js
- https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/
