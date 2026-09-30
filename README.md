<div align="center">

# htmlpptskill

**跟 AI 說一句「做一份 HTML 簡報」，拿到能離線播、QR 驗過、還附講義 PPTX／PDF 的成品。**

reveal.js 簡報製作流程，包成兩個 Agent Skill。<br>
Claude Code・Codex CLI・Gemini CLI・Grok Build 都能裝。

[![CI](https://github.com/keanu77/htmlpptskill/actions/workflows/ci.yml/badge.svg)](https://github.com/keanu77/htmlpptskill/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
![Node 18+](https://img.shields.io/badge/Node-18%2B-3FC1B7)
![Agent Skills](https://img.shields.io/badge/Agent%20Skills-SKILL.md-F2B84B)

<img src="docs/showcase.png" width="900" alt="封面逐字浮現、3D 翻卡、頁內可作答的測驗、雙 QR 工具頁">

<sub>實際講座成品：封面 GSAP 逐字浮現、七張卡片一次翻面、頁內真的能作答的測驗、網站＋repo 雙 QR。54 頁、3 MB、拔掉網路照樣播。</sub>

<p>
<a href="#30-秒安裝">安裝</a>　·　<a href="#10-分鐘看到第一份成品">10 分鐘上手</a>　·　<a href="#-快捷鍵換場與動畫技巧">快捷鍵、換場與動畫技巧</a>　·　<a href="#疑難排解">疑難排解</a>
</p>

</div>

---

## 為什麼不用 PowerPoint 就好？

| 你遇過的事 | 這個 repo 的做法 |
|---|---|
| 會場沒網路，簡報裡的字型、圖、外掛全部掛掉 | 交付前 `QA_OFFLINE=1` 跑一次：任何對外請求都算失敗，reveal.js、字型、圖片、QR 全內嵌成**單一 HTML** |
| QR 印錯，台下掃到 404 | QA 會把每張 QR **逐張截圖解碼**，跟你寫的網址比對，不符就 exit 1 |
| AI 產的投影片文字溢出、少講者備註，播到一半才發現 | 逐頁截圖拼成一張 `montage.png`，溢出、JS 錯誤、缺備註一次列出 |
| 主辦單位要 PPTX，你只有 HTML | `render-slides` → `build-handout`：一頁一圖的 PPTX，講者備註進備忘稿；PDF 一行指令 |
| 想要「炫一點」但怕翻車 | 效果 skill 分穩重／中間／驚豔三檔，內建減少動態效果與 QA 靜態模式 |
| 講者在 PPTX 上手改了字，改動回不去 HTML | 附完整實例：從 PPTX 抽文字、解 QR 圖、回灌 HTML |

## 兩個 skill

| Skill | 一句話 | 什麼時候會被觸發 |
|---|---|---|
| **`html-slide-deck`** | 從大綱到交付的主流程：版型、圖片、QR、互動頁、逐頁 QA、講義 PPTX／PDF、原生可編輯 PPTX | 「做一份 HTML 簡報」「reveal.js」「簡報加截圖／QR」「轉 PPT／講義」「離線簡報」 |
| **`html-slide-effects`** | 加在其上的效果：逐步出現、Auto-Animate、3D 翻卡、GSAP 逐字、計時條、點圖放大、手機捲動 | 「加動畫」「卡片翻面」「讓簡報更生動」「有什麼效果可以加」 |

## 30 秒安裝

```bash
git clone https://github.com/keanu77/htmlpptskill.git && cd htmlpptskill
./install.sh                # 偵測到哪個 CLI 就裝哪個；既有同名 skill 先搬到 skills-backup/
```

| 你的 CLI | 裝到哪 | 之後怎麼叫 |
|---|---|---|
| **Claude Code** | `~/.claude/skills/` | 輸入 `/` 看到 `/html-slide-deck`，或直接說「做一份 HTML 簡報」。也可當 plugin：`/plugin marketplace add keanu77/htmlpptskill` → `/plugin install htmlpptskill@keanu77` |
| **Codex CLI** | `~/.codex/skills/` | 直接描述任務，或 `$html-slide-deck` |
| **Gemini CLI** | `~/.gemini/skills/` | `gemini skills list` 確認；或 `gemini skills link <repo>/skills/html-slide-deck` |
| **Grok Build** | `~/.grok/skills/` | 直接描述任務（它也會讀 `~/.claude/skills/`） |

只裝一家：`./install.sh codex`。跟專案一起 commit：`./install.sh --project`（裝到 `.agents/skills/`，三家都掃）。

<details>
<summary><b>腳本要用的東西</b>（第一次裝好就不用再管）</summary>

```bash
npm i -D playwright && npx playwright install chromium   # 截圖 QA、講義渲染、PDF；Linux 無 GUI 再加 install-deps
npm i -g pptxgenjs                                        # 圖片型講義與原生 PPTX
python3 -m pip install -r requirements.txt                # segno、pillow、python-pptx（建議 venv）
```
腳本從**執行目錄往上**找 `node_modules`，找不到再找 npm 全域；也可設 `SKILL_PKG_ROOT`。

| 平台 | 支援 |
|---|---|
| macOS | 全功能（`pptx-to-pdf.sh` 需要 Microsoft PowerPoint） |
| Linux | 全功能，除了 PowerPoint 原生匯出（PDF 改用 `print-pdf.mjs`）；無 GUI 主機要裝中文字型（Noto Sans CJK） |
| Windows | 腳本用 `node` 直接跑；`install.sh` 用 WSL 或手動複製 `skills\*`；`python3` 通常是 `python`（設 `PYTHON=python`） |
</details>

## 10 分鐘看到第一份成品

```bash
mkdir my-deck && cd my-deck && npm init -y
npm i -D playwright && npx playwright install chromium && npm i reveal.js@5 pptxgenjs
SKILL=~/.claude/skills/html-slide-deck                       # 換成你的 CLI 的路徑

cp $SKILL/references/reveal-template.html draft.html         # 9 頁範本，〈…〉與 example.com 都是占位
node $SKILL/scripts/inline-assets.mjs draft.html index.html  # 內嵌 reveal.js 與圖片 → 離線單檔
QA_OFFLINE=1 node $SKILL/scripts/qa-screenshots.mjs index.html qa/     # 逐頁截圖、QR、溢出 → 看 qa/montage.png
node $SKILL/scripts/render-slides.mjs index.html render/
node $SKILL/scripts/build-handout.mjs render/ handout.pptx "講者"       # 圖片型講義（備註進備忘稿）
node $SKILL/scripts/print-pdf.mjs index.html handout.pdf               # PDF 講義
```

或者什麼都不打，直接跟 agent 說：

> 用 html-slide-deck 做一份 20 頁的「XXX」簡報，聽眾是住院醫師，會場沒網路，每個工具頁放 QR。

它會先給你大綱表等你確認，再產 HTML、跑 QA、交付三種檔案。

## 流程長什麼樣

```
問三件事（觀眾／有沒有網路／要不要特效）→ 大綱表（等你確認）
  ├─ A 單檔手寫（≤25 頁）      references/reveal-template.html → inline-assets.mjs
  └─ B 內容／版型分離（>25 頁） references/offline-build-template/：content.js 一頁一個物件 → npm run all
圖片：AI 底圖（任何生圖工具）、Playwright 真實截圖、segno QR（每張 .qrcard 帶 data-url）
QA：qa-screenshots.mjs ─ 截圖、溢出、JS 錯誤、對外請求、QR 逐張解碼比對、montage.png ─ 有問題 exit 1
交付：index.html（單檔）＋ 講義 PPTX ＋ PDF（＋ 原生可編輯 PPTX）
效果：html-slide-effects → 加完回頭重跑 QA
```

<details>
<summary><b>做法 B 的範本裡有什麼</b></summary>

- `content.js`：8 頁中性起手，一頁一個物件（`type` 決定版型、`notes` 是備註）。50 頁完整實例在 `examples/workshop-2026/`，複製過來就能 build。
- `build.js`：25 種版型的渲染函式（封面、章節、三卡、流程、階梯、prompt、平台優缺點、比較表、決策樹、工具頁＋大 QR、資源頁…）。
- `scripts/check.mjs`：頁數對 content.js、溢出、JS 錯誤、對外請求、QR 逐張解碼。
- `PLAN.md`＋`ROLE-AUTHOR.md`／`ROLE-REVIEWER.md`：想讓兩個 agent 一個主筆一個稽核，角色由你指定。
</details>

## 🎬 快捷鍵、換場與動畫技巧

以下是作者 55 頁工作坊簡報實際用過、驗證過的做法，適用 reveal.js 5.2。點開每一項看可直接複製的程式碼。同一份內容也在 [docs/TECHNIQUES.md](docs/TECHNIQUES.md)。

### ⌨️ 播放快捷鍵

**reveal.js 內建**

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

**自己加的**

| 鍵 | 功能 | 程式碼 |
|---|---|---|
| `X` | 聚光燈開關，滾輪調大小 | 4.1 |
| `T` | 計時條重新計時 | 4.2 |
| 點截圖 | 放大，`Esc` 關閉 | 4.3 |

自訂鍵位前先確認沒撞到內建：`B`、`S`、`F`、`G`、`O`、`N`、`P`、`H/J/K/L`（方向）已被佔用。在輸入框裡按鍵要 `e.stopPropagation()`，否則 reveal 會把數字當成翻頁。

### 🔀 換場

**建議：一般頁淡入淡出，章節頁才有動作。**

每一頁都滑動（`slide`）看久了會累，也讓「換段落」失去標記。作者最後用的配置：

| 頁面 | 換場 |
|---|---|
| 一般內容頁 | `fade`＋`fast`（約 0.4 秒） |
| 章節頁 | `zoom` |
| 兩頁要「長出來」 | Auto-Animate（見 3.2） |

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

<details>
<summary><b>全部換場選項</b></summary>

| 屬性 | 值 |
|---|---|
| `transition`（全場）或 `data-transition`（單頁） | `none`、`fade`、`slide`、`convex`、`concave`、`zoom` |
| 進場與離場分開 | `data-transition="zoom-in fade-out"`、`"slide-in fade-out"` |
| 速度 | `transitionSpeed` 或 `data-transition-speed`：`default`、`fast`、`slow` |
| 背景 | `backgroundTransition` 或 `data-background-transition`，選項同上 |

建議：全場只用一種基本換場，特殊換場留給章節頁與一兩個關鍵時刻。

</details>

### ✨ 動畫技巧

<details>
<summary><b>3.1 逐步出現（fragment）</b></summary>

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

</details>

<details>
<summary><b>3.2 Auto-Animate：相鄰兩頁自動補間</b></summary>

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

</details>

<details>
<summary><b>3.3 3D 翻卡</b></summary>

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

</details>

<details>
<summary><b>3.4 卡片牆飛入</b></summary>

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

</details>

<details>
<summary><b>3.5 GSAP 逐字浮現</b></summary>

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

</details>

<details>
<summary><b>3.6 Three.js 封面粒子</b></summary>

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

</details>

### 🎤 講者工具

<details>
<summary><b>4.1 Spotlight 聚光燈</b></summary>

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

</details>

<details>
<summary><b>4.2 講者計時條</b></summary>

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

</details>

<details>
<summary><b>4.3 點圖放大（lightbox）</b></summary>

reveal.js 5.2 起內建，加一個屬性就好。

```html
<img src="shot.jpg" data-preview-image title="點一下放大" style="cursor:zoom-in">
<video data-preview-video="demo.mp4"></video>
<a href="https://example.com" data-preview-link>在簡報裡開網頁</a>   <!-- 對方網站不能禁止 iframe -->
```

</details>

<details>
<summary><b>4.4 頁內可作答的測驗</b></summary>

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

</details>

### 🧪 讓動畫不妨礙 QA、PDF 與無障礙

<details>
<summary><b>STATIC 開關與 reduced-motion</b></summary>

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

</details>

### 🎚️ 怎麼挑：穩重、中間、驚豔

| 風格 | 用哪些 | 適合 |
|---|---|---|
| 穩重 | fade 換場、章節 zoom、逐步出現、計時條、點圖放大、頁內測驗 | 醫學、學術、教學 |
| 中間 | ＋ Auto-Animate、3D 翻卡、GSAP 封面與收尾 | 工作坊、內訓 |
| 驚豔 | ＋ Three.js 封面、卡片牆飛入、Spotlight | 發表會、開幕、示範「HTML 簡報能做什麼」 |

只放在 4 到 5 個關鍵時刻：封面、章節轉折、核心概念、收尾。其他頁保持乾淨。作者的 55 頁簡報用了 12 種技巧，但每種只出現在一兩頁。

<details>
<summary><b>範例簡報的技巧對照頁數</b></summary>

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

</details>

### 🕳️ 常見的坑

<details>
<summary><b>十個踩過的雷與解法</b></summary>

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

</details>

## 這些規矩是踩過雷才寫的

- **大綱先確認再寫 HTML。** AI 一口氣產 50 頁再改，比先對齊大綱貴十倍。
- **QA 必做、要看圖。** `montage.png` 先看，有標記的頁再看大圖；改完至少再驗一輪。
- **每張 QR 都要 `data-url`。** 沒有它 QA 比對不了，占位網址（example.com）會被警告。
- **會場當作沒網路。** 交付前 `QA_OFFLINE=1`；字型走系統堆疊，不下載 Google Fonts。
- **部署、開 repo 前一定先問。** skill 不會自己把東西推到公網。
- **QA 腳本會執行簡報裡的 JavaScript。** 只對自己產生的 HTML 跑。

## 目錄

```
skills/
  html-slide-deck/
    SKILL.md                      主流程（給 agent 讀）
    scripts/                      qa-screenshots、render-slides、build-handout、print-pdf、inline-assets、
                                  resolve、montage.py、pptx-to-pdf.sh（macOS）、gen-image.sh（可換生圖工具）
    references/
      reveal-template.html        深色版型：chip／card／grid／steps／mock／qrcard／viz／互動頁（reveal.js 5.2）
      offline-build-template/     做法 B：content.js＋build.js＋check.mjs＋PLAN.md＋角色檔
      pptxgenjs-helpers.mjs       原生 PPTX 的 theme 與 helper（＋ native-pptx-example.mjs）
      pitfalls.md                 踩過的雷與可複用片段
  html-slide-effects/SKILL.md
examples/
  workshop-2026/content.js        50 頁工作坊完整內容
  pptx-edits-back-to-html.py      講者在 PPTX 手改後回灌 HTML＋全部效果的實例（見 examples/README.md）
docs/TECHNIQUES.md                快捷鍵、換場、動畫技巧參考（附程式碼）
docs/*.png                        成果圖
.claude-plugin/                   Claude Code plugin／marketplace 設定
AGENTS.md、CLAUDE.md              給在本 repo 工作的 agent
```

## 疑難排解

| 現象 | 處理 |
|---|---|
| `找不到套件 playwright` | 在有 `node_modules` 的專案目錄執行，或 `npm i -g playwright`，或設 `SKILL_PKG_ROOT` |
| `缺 jsqr／pngjs` | 到 skill 目錄 `npm install`；或 `QA_SKIP_QR=1` 明確略過 |
| Chromium 沒下載 | `npx playwright install chromium`；已有 Chromium 就設 `CHROMIUM_PATH` |
| 截圖中文變方框（Linux） | 裝 Noto Sans CJK |
| PubMed 等站對 headless 回 403 | 請使用者提供截圖，或用 CLI 內建瀏覽器工具（若有） |
| `osascript -9074`／逾時 | `pptx-to-pdf.sh` 會重試一次；首次要在螢幕前允許「自動化」；SSH 無法用 |
| PDF 頁數比投影片多 | `Reveal.initialize` 加 `pdfSeparateFragments: false`（範本已設） |

## 來歷

作者是運動醫學科醫師，2026-09 為臨床教師工作坊做了 24 頁附錄與 54 頁主簡報，把過程寫成 skill，再請 Codex、Claude、Grok、Gemini 四個模型審一輪（結果在 [CHANGELOG](CHANGELOG.md)）。範本裡的示例內容屬作者，換成你自己的。

## 授權

程式碼與腳本 MIT。範本與 `examples/` 的示例文字、網址、截圖僅供替換參考；第三方字型與外掛請自行確認授權。

---

<details>
<summary><b>English summary</b></summary>

Two Agent Skills (open `SKILL.md` format) for building **reveal.js HTML slide decks** with an AI coding agent, plus the scripts that make them trustworthy:

- **html-slide-deck**: outline-first workflow, dark professional template, real screenshots, QR codes, interactive pages, per-slide screenshot QA (overflow, JS errors, external requests, **QR decoded and compared with `data-url`**), export to handout PPTX (notes included), PDF, and native editable PPTX.
- **html-slide-effects**: fragments, Auto-Animate, 3D flip cards, GSAP, timer bar, lightbox, scroll view, with reduced-motion and a STATIC switch so QA screenshots and PDFs capture the final state.

Works with Claude Code, OpenAI Codex CLI, Gemini CLI and Grok Build (`./install.sh` detects them). Docs are in Traditional Chinese; the scripts and templates are language-neutral.
</details>
