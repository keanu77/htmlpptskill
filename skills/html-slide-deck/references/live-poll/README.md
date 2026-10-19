# 手機即時投票（live-poll）

觀眾用手機掃 QR 作答，投影片即時顯示百分比或直方圖，講者按 `A` 揭曉，答案同步推到每支手機。
後端是一個 Cloudflare Worker＋Durable Object（SQLite），WebSocket 用 hibernation API，閒置不計費。
2026-10 學會演講現場 60 人同時使用；上台前本機與正式站都以 150 支假手機壓測過，150 票約 0.2–1.2 秒內寫入並推到投影片。

```
live-poll/
  worker/                 Cloudflare Worker（部署一次，之後只改 polls.json）
    src/index.js          路由、Durable Object、API、WebSocket 推播
    src/phone.js          觀眾手機頁（不含答案，揭曉後才由伺服器送出）
    src/polls.json        題目、選項、答案、解釋
    wrangler.jsonc
  screen/                 投影片端：由 scripts/poll-slides.mjs 注入
    live-poll.js          開題、即時更新、A 揭曉、Shift+R 清空、斷線改輪詢
    live-poll.css         沿用 reveal-template.html 的色彩 tokens
  load-test.mjs           N 支假手機壓測
```

## 什麼時候用

- 現場有穩定網路、想讓全場一起作答：用這個。
- 現場網路不確定：用頁內測驗（`docs/TECHNIQUES.md` 4.4，純前端、離線可用），或課堂互動平台。
- 這套沒有網路照樣能播：投票頁按 `A` 一樣顯示答案，只是沒有全場統計。

## 1. 部署（一次）

需要 Cloudflare 帳號（免費方案即可）與 Node 20+。部署前先問使用者。

```bash
cp -R $SKILL/references/live-poll/worker my-poll && cd my-poll
npm install                                   # 裝 wrangler 4
npx wrangler login
openssl rand -hex 24 | tee /dev/stderr | npx wrangler secret put ADMIN_KEY
printf 'ADMIN_KEY=%s\n' '<上一行印出的 key>' > .dev.vars && chmod 600 .dev.vars
npx wrangler deploy                           # 印出 https://slide-poll.<子網域>.workers.dev
cd ..                                         # 回到簡報目錄，下面的 --worker my-poll 才找得到
```

- `.dev.vars` 已在 `.gitignore`，**不要 commit**；`wrangler dev` 本機測試也讀它。
- `wrangler.jsonc` 的 `name` 改成你的；`compatibility_date` 不能晚於本機 wrangler 支援的日期，否則 `wrangler dev` 起不來。
- 同一個 Worker 給不同場次用：在 `wrangler.jsonc` 加 `"vars": { "ROOM_NAME": "場次名稱" }`，不同房間的票互不相干。

## 2. 寫題目

`src/polls.json`：`event` 是手機頁標題；每題一個 id。

| 欄位 | 選擇題 `choice` | 猜數字 `number` |
|---|---|---|
| `kicker`、`title`、`stem` | 小標、題目、題幹 | 同左 |
| `options` | 選項陣列 | — |
| `min`、`max`、`unit` | — | 允許範圍與單位 |
| `bins` | — | 直方圖分組 `[[lo, hi], …]`，最後一組 `hi` 等於 `max` 顯示「以上」 |
| `answer` | 正解的索引（0 起） | 正解數字；揭曉時另算「猜在 ±20% 內」人數 |
| `explain` | 揭曉後的說明 | 同左 |

改完 `npx wrangler deploy`。專業或醫療題目：題目與解釋要自己審過。

## 3. 放進簡報

在 HTML 裡要放投票的位置寫占位 section，然後產生講者版：

```html
<section data-poll-join></section>        <!-- 加入頁：大 QR＋在線手機數 -->
<section data-poll="warmup"></section>    <!-- 一題一頁，id 對應 polls.json -->
<section data-poll="guess"></section>
```
```bash
node $SKILL/scripts/poll-slides.mjs index.html index-live.html --worker my-poll --url https://slide-poll.<子網域>.workers.dev
```

- 腳本把占位換成完整投票頁（每頁右側 QR 都有 `data-url`，QA 會解碼比對），並在**最後一個** `</body>` 前注入樣式、設定與 `live-poll.js`。需要 npm `qrcode`：skill 目錄自帶（`install.sh` 或在 skill 目錄 `npm install` 會裝好）。
- ADMIN_KEY 取環境變數 `ADMIN_KEY` 或 `my-poll/.dev.vars`，**會寫進 `index-live.html`**：這份只放講者電腦，不上傳、不寄出、不 commit。要分享給觀眾的版本用沒跑過這支腳本的 `index.html`。
- 做法 B（content.js）：讓 build.js 對某個 type 輸出同樣的占位 section，build 完再跑這支。
- 從 PPTX 轉出的 HTML 也一樣：在轉檔程式插頁時插入占位 section。插頁後若投影片上印有頁碼，要重編。

### 模擬模式（公開 Demo、彩排用）

```bash
node $SKILL/scripts/poll-slides.mjs index.html demo.html --polls my-poll/src/polls.json --sim 60
```
不連後端、不需要 key，產出檔可以公開。進到投票頁會在幾秒內跑出 60 人的作答（選擇題約一半選正解，猜數字散在答案附近），`A` 揭曉、`Shift+R` 重跑；右側 QR 換成「示範模式」說明框。repo 的 Live Demo 就是這樣做的。

## 4. 現場操作

| 動作 | 做法 |
|---|---|
| 開題 | 翻到投票頁就自動開題，手機出現題目 |
| 揭曉 | `A`：投影片標出正解與說明，手機同步顯示答案 |
| 清空本題 | `Shift+R`（彩排後逐題按一次；或用下面的 curl） |
| 下一題 | 翻頁；離開投票頁時手機回到「等下一題」 |
| 回到已揭曉的題 | 手機會再顯示一次答案，不會重開 |
| 斷網 | 投影片顯示紅字提示、每 2.5 秒輪詢；`A` 照樣揭曉 |
| 不連線播放 | 網址加 `?offline` |

- 彩排後清空一題：`curl -X POST <url>/api/control -H "authorization: Bearer $ADMIN_KEY" -d '{"poll":"warmup","phase":"closed","reset":true}'`
- 演講前用自己的手機在會場網路實測一輪，再逐題 `Shift+R`。
- 手機頁匿名：用 localStorage 的隨機代號辨識同一支手機（可改答案、不重複計票），不收集個人資料。

## 5. 壓測

```bash
ADMIN_KEY=… node load-test.mjs https://slide-poll.<子網域>.workers.dev warmup 150   # Node 22+
```
開 N 支 WebSocket 假手機、開題、同時投票、揭曉，檢查講者畫面與每支手機都收到；最後清空那題的票。

## API

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/` | 手機頁 |
| GET | `/ws?role=phone\|screen` | WebSocket；收 `state`（目前題目、階段、在線手機數、揭曉後的答案）與 `results` |
| GET | `/api/state` | 同 WebSocket 的 `state`（斷線輪詢用） |
| GET | `/api/results?poll=id` | 該題統計 |
| POST | `/api/vote` | `{poll, voter, value}`；voter 須 8–64 字元英數或 `-`；題目未開放回 409；同一 voter 重投覆蓋 |
| POST | `/api/control` | 需 `Authorization: Bearer ADMIN_KEY`；`{poll \| null, phase: closed\|open\|revealed, reset}` |

## 踩過的雷

- 測試腳本的 voter 代號太短（`e2e-1`）會被格式檢查擋掉，看起來像「票數一直是 0」。
- 投影片端預設在自動化瀏覽器（`navigator.webdriver`）與 `?print-pdf` 不連線，QA 截圖才不會打 API、`QA_OFFLINE=1` 才會過；自己寫 E2E 要在網址加 `?live`。
- 未揭曉的答案框若用 `translateY` 藏在下方，QA 會判成溢出；改用 `scale`。
- 答案只在 `revealed` 時由伺服器送出；手機頁本身與 `/api/state` 在揭曉前都不含答案。
