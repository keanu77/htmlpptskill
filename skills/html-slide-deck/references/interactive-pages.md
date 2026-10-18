# 互動頁：互動地圖、製作技巧頁（2026-10 講座實例）

手機即時投票另見 `live-poll/README.md`。以下兩種頁面都是純前端、離線可用。

## 互動地圖：點據點，看離中繼站多遠

適合「場館分散、據點涵蓋不到」這類論點：觀眾自己點，比一張靜態地圖有說服力。

資料（`data-map` 屬性或內嵌 JSON；距離先用 Python 以 haversine 算好）：
```json
{ "hubs":   [{ "name": "〈據點 A〉", "lng": 136.90, "lat": 35.17 }],
  "venues": [{ "name": "〈場館〉", "tags": ["〈項目〉"], "lng": 137.10, "lat": 35.05, "hub": "〈據點 A〉", "km": 24.3 }] }
```
```html
<section class="mapslide" data-map='…上面的 JSON…'>
  <svg class="map"></svg>
  <div class="info">點地圖上的場館</div>
  <button data-act="ring">20 km 圈</button> <button data-act="far">標出 20 km 外</button>
</section>
```
```js
// 範圍內用等距圓柱投影即可：經度乘 cos(緯度) 校正，誤差在幾十公里尺度可以忽略
const LNG0 = 136.45, LNG1 = 138.05, LAT0 = 34.56, LAT1 = 35.48, W = 800, FAR_KM = 20;
const KX = W / (LNG1 - LNG0), KY = KX / Math.cos((LAT0 + LAT1) / 2 * Math.PI / 180), H = (LAT1 - LAT0) * KY;
const P = (lng, lat) => [(lng - LNG0) * KX, (LAT1 - lat) * KY];
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); parent && parent.appendChild(n); return n; };

function initMap(sec) {
  if (sec.dataset.ready) return; sec.dataset.ready = '1';
  const data = JSON.parse(sec.dataset.map), svg = sec.querySelector('.map'), info = sec.querySelector('.info');
  svg.setAttribute('viewBox', `0 0 ${W} ${H.toFixed(0)}`);
  data.hubs.forEach(h => { const [x, y] = P(h.lng, h.lat); el('circle', { class: 'ring', cx: x, cy: y, r: FAR_KM / 111.32 * KY }, svg); });
  const link = el('line', { class: 'link', opacity: 0 }, svg);
  data.hubs.forEach(h => {                       // 據點先畫、場館點後畫，場館才在上層
    const [x, y] = P(h.lng, h.lat), g = el('g', { class: 'hub' }, svg);
    el('circle', { cx: x, cy: y, r: 15 }, g);
    el('text', { x: x + 22, y: y + 7 }, g).textContent = h.name;
  });
  data.venues.forEach(v => {
    const [x, y] = P(v.lng, v.lat);
    const c = el('circle', { class: 'v' + (v.km >= FAR_KM ? ' is-far' : ''), cx: x, cy: y, r: 8 }, svg);
    c.addEventListener('click', () => {
      info.innerHTML = `<b>${v.name}</b><br>${v.tags.join('、')}<br>最近：${v.hub}　${v.km.toFixed(1)} km 直線`;
      const hub = data.hubs.find(h => h.name === v.hub), [x2, y2] = P(hub.lng, hub.lat);
      Object.entries({ x1: x, y1: y, x2, y2, opacity: 1 }).forEach(([k, val]) => link.setAttribute(k, val));
    });
  });
  sec.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () =>
    b.classList.toggle('on', svg.classList.toggle(b.dataset.act === 'ring' ? 'rings' : 'far'))));
}
Reveal.on('slidechanged', e => e.currentSlide.classList.contains('mapslide') && initMap(e.currentSlide));
```
```css
.map .ring { fill: rgba(232,132,107,.08); stroke: var(--coral); stroke-dasharray: 8 7; opacity: 0; transition: opacity .4s }
.map.rings .ring { opacity: 1 }
.map .v { fill: var(--teal); stroke: #fff; stroke-width: 2; cursor: pointer }
.map.far .v.is-far { fill: var(--coral) }  .map.far .v:not(.is-far) { opacity: .35 }
.map .hub { pointer-events: none }          /* 不然據點標記會蓋住旁邊的場館、點不到 */
.map .link { stroke: var(--amber); stroke-width: 3; stroke-dasharray: 6 5 }
```
- 海岸線：Natural Earth `ne_10m_land` 裁到範圍內，存成 `[[lng, lat], …]` 折線陣列，用同一個 `P()` 畫 `polyline`。
- 範圍外的點（例如離主圖 100 km 的場館）不要硬塞進地圖，放在側欄文字，點一下一樣顯示資訊。
- 「幾個場館在 N km 外」要和備註的數字同一條規則算（`>=` 還是 `>`），剛好 20.0 km 的點會讓兩邊對不上。
- 同一份座標可以用 Pillow 輸出靜態圖給 PPTX 版；標籤擺放要檢查引線交叉與引線穿過別的標籤。

## 製作技巧頁：結尾前分享「這份簡報怎麼做的」

左邊格式比較表、右邊 AI 協作清單；放在 Q&A 前一頁。以下是講座實際使用的內容，換成你的。

| | PowerPoint／Keynote | PDF | HTML（reveal.js） |
|---|---|---|---|
| 修改 | 最直覺，誰都能改 | 只能回原檔改 | 改 PPT 或來源後一鍵重轉 |
| 動畫與互動 | 內建動畫；無法連網互動 | 無 | 程式動畫、地圖、手機即時投票 |
| 播放 | 需要軟體與字型 | 任何裝置 | 瀏覽器即可，單檔離線 |
| 影片／分享 | 檔案大、版本混亂 | 不能放影片 | 內嵌影片；可放網路分享 |
| 風險 | 跨電腦跑版 | 沒有講者備註 | 需測瀏覽器；投票需要網路 |

AI 協作清單（每項一行標題＋一行說明）：
- **程式產生投影片**：python-pptx／pptxgenjs 逐頁產生，字級、配色、版型一致
- **資料變圖表**：座標算距離、畫地圖；紀錄去識別後彙總
- **PPT → HTML**：講者在 PowerPoint 定稿，程式轉成 reveal.js 單檔
- **現場互動**：Cloudflare Worker 收手機作答，WebSocket 即時推到投影片
- **查核**：文獻逐條核對年份與數字
- 結語一句：「人負責內容與判斷，AI 負責把重複的工作寫成程式」

表格字級 ≥ 20px；1280×720 下左表約 700px、右欄約 440px 寬。

## 從 PPTX 轉出的 HTML 插入互動頁

講者在 PowerPoint 定稿、再轉 HTML 時，互動頁用「原 PPTX 第幾頁之後」描述插入位置（`after`），同一個 `after` 依清單順序排列，轉檔程式最後統一插入。插頁後投影片上印的頁碼會錯位：用 JS 在載入時依實際順序重編（找右下角、內容只有數字的文字框）。
