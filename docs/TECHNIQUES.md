# reveal.js 簡報技巧參考：快捷鍵、換場、動畫

這份文件整理作者在 55 頁工作坊簡報實際用過、驗證過的技巧。每一段都附可直接複製的程式碼，適用 reveal.js 5.2。
完整實作在 [`examples/pptx-edits-back-to-html.py`](../examples/pptx-edits-back-to-html.py)，Three.js 模組在 [`examples/three-particles-entry.js`](../examples/three-particles-entry.js)。

**目錄**
1. [播放快捷鍵](#1-播放快捷鍵)
2. [換場（Transitions）](#2-換場transitions)
3. [動畫技巧](#3-動畫技巧)：逐步出現、Auto-Animate、3D 翻卡、卡片牆飛入、GSAP 逐字、Three.js 粒子
4. [講者工具](#4-講者工具)：Spotlight 聚光燈、計時條、點圖放大、頁內測驗
5. [讓動畫不妨礙 QA、PDF 與無障礙](#5-讓動畫不妨礙-qapdf-與無障礙)
6. [怎麼挑：穩重、中間、驚豔](#6-怎麼挑穩重中間驚豔)
7. [常見的坑](#7-常見的坑)

---

## 1. 播放快捷鍵

### reveal.js 內建

| 鍵 | 功能 |
|---|---|
| `→` `↓` `Space` `N` | 下一步（下一個 fragment 或下一頁） |
| `←` `↑` `P` | 上一步 |
| `S` | 開講者視窗：目前頁、下一頁、備註、計時 |
| `Esc` 或 `O` | 總覽（所有頁縮圖，點一下跳過去） |
| `F` | 全螢幕 |
| `B` 或 `.` | 黑屏（再按一次回來；問答時很好用） |
| `G` | 跳到指定頁碼 |
| `Home` `End` | 第一頁、最後一頁 |
| `Alt`＋點擊 | 放大點擊的位置（zoom 外掛，預設未載） |

網址參數：`?print-pdf` 進列印模式（瀏覽器另存 PDF）、`?view=scroll` 手機捲動閱讀、`#/10` 直接開第 11 頁（hash 從 0 起算）。

### 自己加的

| 鍵 | 功能 | 程式碼 |
|---|---|---|
| `X` | 聚光燈開關，滾輪調大小 | [4.1](#41-spotlight-聚光燈) |
| `T` | 計時條重新計時 | [4.2](#42-講者計時條) |
| 點截圖 | 放大，`Esc` 關閉 | [4.3](#43-點圖放大lightbox) |

自訂鍵位前先確認沒撞到內建：`B`、`S`、`F`、`G`、`O`、`N`、`P`、`H/J/K/L`（方向）已被佔用。在輸入框裡按鍵要 `e.stopPropagation()`，否則 reveal 會把數字當成翻頁。

---

## 2. 換場（Transitions）

### 建議配置：一般頁淡入淡出，章節頁才有動作

每一頁都滑動（`slide`）看久了會累，也讓「換段落」失去標記。作者最後用的配置：

| 頁面 | 換場 |
|---|---|
| 一般內容頁 | `fade`＋`fast`（約 0.4 秒） |
| 章節頁 | `zoom` |
| 兩頁要「長出來」 | Auto-Animate（見 [3.2](#32-auto-animate相鄰兩頁自動補間)） |

```js
Reveal.initialize({
  width: 1280, height: 720,
  transition: 'fade',          // 全場預設
  transitionSpeed: 'fast',     // default | fast | slow
  backgroundTransition: 'fade',
  // ...
});
```
```html
<!-- 章節頁單獨指定 -->
<section class="chapter" data-transition="zoom"> … </section>
```

### 全部選項

| 屬性 | 值 |
|---|---|
| `transition`（全場）或 `data-transition`（單頁） | `none`、`fade`、`slide`、`convex`、`concave`、`zoom` |
| 進場與離場分開 | `data-transition="zoom-in fade-out"`、`"slide-in fade-out"` |
| 速度 | `transitionSpeed` 或 `data-transition-speed`：`default`、`fast`、`slow` |
| 背景 | `backgroundTransition` 或 `data-background-transition`，選項同上 |

建議：全場只用一種基本換場，特殊換場留給章節頁與一兩個關鍵時刻。

---

## 3. 動畫技巧

### 3.1 逐步出現（fragment）

按一下出一項，講的時候聽眾不會先讀完整頁。零成本，最該先用。

```html
<ul>
  <li class="fragment">第一點</li>
  <li class="fragment fade-up">第二點（往上浮現）</li>
  <li class="fragment highlight-current-blue">講到這點時變色</li>
</ul>
<div class="fragment" data-fragment-index="2">指定出現順序</div>
```

**卡片與箭頭一起出現**（流程圖）：卡片和它前面的箭頭共用同一個 index。

```html
<div class="card fragment fade-up" data-fragment-index="1">教學想法</div>
<div class="arrow fragment"         data-fragment-index="2">→</div>
<div class="card fragment fade-up" data-fragment-index="2">Prompt</div>
```

**決策樹一列一列出現**：同一列的問題、「是 →」、結果共用 index，「↓ 否」用下一個 index。

效果名稱：`fade-up`、`fade-down`、`fade-left`、`fade-right`、`fade-in-then-out`、`grow`、`shrink`、`strike`、`highlight-red`、`highlight-current-blue` 等。

### 3.2 Auto-Animate：相鄰兩頁自動補間

兩頁都加 `data-auto-animate`，相同 `data-id` 的元素會自動從前一頁的位置、大小、顏色補間到後一頁。適合「總覽放大成單項」「一張卡長出一整排」。

```html
<section data-auto-animate>
  <h2>四階梯</h2>
  <div class="rung" data-id="lv0" style="width:560px;margin:40px auto 0">Lv0 Claude Artifacts</div>
</section>

<section data-auto-animate>
  <h2>四階梯</h2>
  <div class="ladder">
    <div class="rung" data-id="lv0" style="margin-top:132px">Lv0 Claude Artifacts</div>
    <div class="rung" style="margin-top:88px">Lv1 GitHub</div>
    <div class="rung" style="margin-top:44px">Lv2 Cloudflare</div>
    <div class="rung">Lv3 Zeabur</div>
  </div>
</section>
```
```js
Reveal.initialize({ autoAnimateDuration: 0.9, autoAnimateEasing: 'cubic-bezier(.4,.2,.2,1)' });
```

可以補間的：位置、尺寸、字級、顏色、背景、padding、margin。沒有 `data-id` 時，相同文字或相同 `src` 的元素也會自動配對。

### 3.3 3D 翻卡

按一下，一組卡片依序翻面（正面是分類，背面是工具名稱）；點單張可以翻回。

```html
<div class="grid flipall fragment custom">
  <div class="flip"><div class="inner">
    <div class="front card">① 影像判讀</div>
    <div class="back card">影像學習站<br>肩部影像課程</div>
  </div></div>
  <!-- 其他卡片 -->
</div>
```
```css
.reveal .fragment.custom.flipall { opacity: 1; visibility: inherit; }   /* 關鍵：沒有這行，正面在點擊前是隱形的 */
.flip { perspective: 1100px; height: 196px; cursor: pointer; }
.flip .inner { position: relative; width: 100%; height: 100%;
  transition: transform .9s cubic-bezier(.4,.2,.2,1); transform-style: preserve-3d; }
.flip .front, .flip .back { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.flip .back { transform: rotateY(180deg); }
.flipall.visible .flip:not(.off) .inner, .flip.on .inner { transform: rotateY(180deg); }
.flip:nth-child(2) .inner { transition-delay: .07s }   /* 以此類推，做出波浪 */
.flip:nth-child(3) .inner { transition-delay: .14s }
```
```js
document.querySelectorAll('.flip').forEach(c => c.addEventListener('click', () => {
  c.parentNode.classList.contains('visible') ? c.classList.toggle('off') : c.classList.toggle('on');
}));
```

原理：fragment 顯示時 reveal 會替元素加上 `visible` class，CSS 靠它觸發翻面。

### 3.4 卡片牆飛入

十幾張小卡從深處旋轉飛到定位，逐一錯開。純 CSS，不增加檔案大小。

```html
<div class="wall fragment custom">
  <div class="root">sportsmedicine.tw</div>
  <div class="subs"><span>imaging</span><span>shoulder</span><!-- … 12 張 --></div>
</div>
```
```css
.reveal .fragment.custom { opacity: 1; visibility: inherit; }
.wall { perspective: 1200px; }
.wall .subs { transform-style: preserve-3d; }
.wall .subs span { opacity: 0; transform: translateZ(-700px) translateX(260px) rotateY(50deg);
  transition: transform .8s cubic-bezier(.2,.7,.2,1), opacity .5s; }
.wall.visible .subs span { opacity: 1; transform: none; }
.wall .subs span:nth-child(2) { transition-delay: .06s }   /* 每張 +60 ms */
.wall .subs span:nth-child(3) { transition-delay: .12s }
.wall .root { transition: box-shadow .6s .9s, transform .6s .9s; }
.wall.visible .root { box-shadow: 0 0 46px rgba(242,184,75,.55); transform: scale(1.04); }  /* 最後一張落定後發光 */
```

### 3.5 GSAP 逐字浮現

封面與封底標題一個字一個字彈出。GSAP 3（`gsap.min.js` 約 70 KB）內嵌即可離線用。

```html
<h1 data-stagger>AI提升教學能力</h1>
```
```js
function split(el) {                     // 把文字拆成 <span class="ch">
  if (el.dataset.split) return; el.dataset.split = '1';
  [...el.childNodes].forEach(n => { if (n.nodeType !== 3) return;
    const f = document.createDocumentFragment();
    [...n.textContent].forEach(ch => { const s = document.createElement('span');
      s.className = 'ch'; s.textContent = ch === ' ' ? ' ' : ch; f.appendChild(s); });
    n.replaceWith(f); });
}
function play(slide) {
  const h = slide && slide.querySelector('h1[data-stagger]'); if (!h || STATIC || REDUCE) return;
  split(h);
  gsap.fromTo(h.querySelectorAll('.ch'), { y: 46, opacity: 0, rotateX: -70 },
    { y: 0, opacity: 1, rotateX: 0, duration: .7, stagger: .05, ease: 'back.out(1.7)', overwrite: true });
}
Reveal.on('ready', e => play(e.currentSlide));
Reveal.on('slidechanged', e => play(e.currentSlide));
```
```css
.reveal h1 .ch { display: inline-block; }   /* 沒有這行 transform 不會生效 */
```

`<br>` 會保留（只拆文字節點），多行標題可以直接用。

### 3.6 Three.js 封面粒子

封面底圖上疊一層緩慢飄動的 3D 粒子，滑鼠移動有視差。只在封面跑 render loop，離開就停。

**打包**（Three.js 新版只有 ES module，要打成一個檔才能內嵌）：
```bash
npm i three esbuild
npx esbuild three-particles-entry.js --bundle --minify --format=iife --outfile=three-particles.min.js   # 約 530 KB
```
**掛到封面背景**：
```js
(function () {
  if (STATIC || REDUCE || !window.initCoverParticles) return;
  let fx = null;
  function ensure() { if (fx) return fx; const bg = Reveal.getSlideBackground(0); if (!bg) return null;
    bg.style.overflow = 'hidden'; return (fx = window.initCoverParticles(bg, { count: 1600 })); }
  function sync() { const f = ensure(); if (!f) return; Reveal.getIndices().h === 0 ? f.start() : f.stop(); }
  Reveal.on('ready', sync); Reveal.on('slidechanged', sync);
  Reveal.on('resize', () => fx && fx.resize());
})();
```

模組重點（完整在 `examples/three-particles-entry.js`）：`PointsMaterial` 配 canvas 畫的圓形柔光 sprite（不需外部圖）、`AdditiveBlending`、`setPixelRatio(Math.min(devicePixelRatio, 1.5))`、`powerPreference: 'low-power'`。

**一定要在播放用的電腦接投影機實測一次幀率**，舊筆電可能卡。

---

## 4. 講者工具

### 4.1 Spotlight 聚光燈

按 `X` 開關，滑鼠周圍亮、其餘變暗，滾輪調大小。講截圖細節時用。自己寫約 25 行，不用外掛。

```css
.spot { position: fixed; inset: 0; z-index: 60; pointer-events: none; display: none; }
.spot.on { display: block; }
```
```js
(function () {
  if (STATIC) return;
  const c = document.createElement('canvas'); c.className = 'spot'; document.body.appendChild(c);
  const ctx = c.getContext('2d'); let on = false, x = innerWidth / 2, y = innerHeight / 2, R = 150;
  function draw() { if (!on) return; c.width = innerWidth; c.height = innerHeight;
    ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(0, 0, c.width, c.height);
    const g = ctx.createRadialGradient(x, y, R * .55, x, y, R);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; }
  addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; on && requestAnimationFrame(draw); }, { passive: true });
  addEventListener('wheel', e => { if (on) { R = Math.max(60, Math.min(400, R - e.deltaY * .3)); draw(); } }, { passive: true });
  document.addEventListener('keydown', e => {
    if ((e.key === 'x' || e.key === 'X') && !e.metaKey && !e.ctrlKey && e.target.tagName !== 'INPUT') {
      on = !on; c.classList.toggle('on', on); draw(); } });
})();
```

### 4.2 講者計時條

頂端一條細線，40 分鐘走完，超時變紅；按 `T` 重新計時。和 reveal 底部的頁數進度條對照，一眼看出講快還是講慢。

```css
.timebar { position: fixed; top: 0; left: 0; height: 5px; width: 0; background: #F2B84B; z-index: 50; transition: width 1s linear; }
.timebar.over { background: #E8846B; }
@media print { .timebar { display: none; } }
```
```js
(function () {
  if (STATIC) return;
  const ALLOT = 40 * 60 * 1000, bar = document.createElement('div'); bar.className = 'timebar'; document.body.appendChild(bar);
  let start = Date.now();
  const tick = () => { const p = Math.min(1, (Date.now() - start) / ALLOT); bar.style.width = p * 100 + '%'; bar.classList.toggle('over', p >= 1); };
  setInterval(tick, 1000); tick();
  document.addEventListener('keydown', e => { if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey) { start = Date.now(); tick(); } });
})();
```

### 4.3 點圖放大（lightbox）

reveal.js 5.2 起內建，加一個屬性就好。

```html
<img src="shot.jpg" data-preview-image title="點一下放大" style="cursor:zoom-in">
<video data-preview-video="demo.mp4"></video>
<a href="https://example.com" data-preview-link>在簡報裡開網頁</a>   <!-- 對方網站不能禁止 iframe -->
```

### 4.4 頁內可作答的測驗

講「AI 30 秒做出測驗」時，同一頁直接放一個能作答的測驗，現場請人點。比任何特效都有說服力，純 JS、離線可用。

```html
<div class="quiz" id="quiz1"></div>
```
```js
const Q = [{ q: '題目？', o: ['選項 A', '選項 B', '選項 C', '選項 D'], a: 2, e: '解釋' } /* … */];
let i = 0, score = 0; const box = document.getElementById('quiz1');
function show() {
  if (i >= Q.length) { box.innerHTML = `<div class="sc">${score} / ${Q.length}</div>`; return; }
  const q = Q[i];
  box.innerHTML = `<p>${q.q}</p>` + q.o.map((o, k) => `<button data-k="${k}">${'ABCD'[k]}. ${o}</button>`).join('') + `<div class="fb"></div>`;
  box.querySelectorAll('button').forEach(b => b.onclick = () => {
    const k = +b.dataset.k; if (k === q.a) score++;
    box.querySelectorAll('button').forEach(x => { x.disabled = true; if (+x.dataset.k === q.a) x.classList.add('ok'); });
    if (k !== q.a) b.classList.add('bad');
    box.querySelector('.fb').textContent = (k === q.a ? '答對。' : `正解是 ${'ABCD'[q.a]}。`) + q.e;
    setTimeout(() => { i++; show(); }, 1800);
  });
}
show();
```

醫療或專業題目：題目與解釋要自己審過，參考文獻不確定就標「待查證」。

---

## 5. 讓動畫不妨礙 QA、PDF 與無障礙

加了動畫之後，自動截圖會拍到動畫中途、PDF 會少內容。解法是一個 **STATIC 開關**：

```js
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Playwright 截圖（navigator.webdriver）或 ?print-pdf 時：關掉所有動畫，顯示最終狀態
const STATIC = navigator.webdriver || location.search.indexOf('print-pdf') >= 0;
if (STATIC) document.documentElement.classList.add('static');

Reveal.initialize({
  transition: 'fade', transitionSpeed: 'fast',
  autoAnimateDuration: STATIC ? 0 : 0.9,
  pdfSeparateFragments: false,     // 否則每個 fragment 各印一頁，54 頁變 79 頁
});
```
```css
html.static .flip .inner, html.static .reveal .fragment, html.static .wall .subs span { transition: none !important; }
@media (prefers-reduced-motion: reduce) {
  .flip .inner, .wall .subs span, .reveal .fragment { transition-duration: .01ms !important; }
}
```

原則：
- GSAP、Three.js、Spotlight、計時條都在開頭寫 `if (STATIC || REDUCE) return;`。
- `prefers-reduced-motion` 只作用在自己加的效果，不要用全域 `*` 把 reveal 換頁一起壓掉。
- 本 repo 的 `qa-screenshots.mjs` 會先關轉場、展開全部 fragment 再截圖，搭配 STATIC 開關就能拍到最終畫面。

---

## 6. 怎麼挑：穩重、中間、驚豔

| 風格 | 用哪些 | 適合 |
|---|---|---|
| 穩重 | fade 換場、章節 zoom、逐步出現、計時條、點圖放大、頁內測驗 | 醫學、學術、教學 |
| 中間 | ＋ Auto-Animate、3D 翻卡、GSAP 封面與收尾 | 工作坊、內訓 |
| 驚豔 | ＋ Three.js 封面、卡片牆飛入、Spotlight | 發表會、開幕、示範「HTML 簡報能做什麼」 |

只放在 4 到 5 個關鍵時刻：封面、章節轉折、核心概念、收尾。其他頁保持乾淨。作者的 55 頁簡報用了 12 種技巧，但每種只出現在一兩頁。

### 範例簡報的技巧對照

| 技巧 | 頁 |
|---|---|
| Three.js 粒子 | 1（封面） |
| GSAP 逐字 | 1、55 |
| 逐步出現 | 4、7、24、50、51、52 |
| 章節 zoom | 所有章節頁 |
| Auto-Animate | 8 → 9 |
| 頁內測驗 | 11 |
| 卡片牆飛入 | 19 |
| 3D 翻卡 | 25 |
| 點圖放大 | 所有截圖頁 |
| Spotlight（X） | 全場，示範在 14、46 |
| 計時條（T） | 全場 |

---

## 7. 常見的坑

| 現象 | 原因與解法 |
|---|---|
| 翻卡或卡片牆在點擊前整組看不見 | fragment 預設 `opacity:0`；加 `custom` class 並寫 `.reveal .fragment.custom { opacity:1; visibility:inherit }` |
| 截圖畫面往右偏、像被切掉 | 截到換場中途；截圖前 `Reveal.configure({ transition:'none' })` |
| Auto-Animate 頁截圖是半成品 | `autoAnimateDuration: STATIC ? 0 : 0.9` |
| PDF 頁數比投影片多 | `pdfSeparateFragments: false` |
| GSAP 逐字沒有動 | 拆出的 `span` 要 `display:inline-block` |
| `r-fit-text` 把整排版面撐爆 | 它會加 `nowrap`＋`inline-block`，放在 grid 的 `1fr` 欄會無限撐寬；多行文字改固定 `font-size` |
| 輸入框打數字就翻頁 | 輸入框的 `keydown` 要 `e.stopPropagation()` |
| 外掛鍵位沒反應或行為怪 | 撞到內建鍵（`B` 黑屏、`S` 講者、`O` 總覽）；換鍵 |
| 插入 script 後講者視窗壞掉（`RevealNotes is not defined`） | notes.js 原始碼裡也有 `</body>`；程式插入時找**最後一個** `</body>` |
| 3D 粒子頁卡頓 | 降 `count`、`setPixelRatio` 上限 1.5、離開封面就 `stop()` |
