// 用法：node qa-screenshots.mjs <index.html> <outdir> [width=1280] [height=720]
// 逐頁截圖（先關閉轉場）、檢查 JS 錯誤、notes、溢出（高與寬）、解碼頁上的 QR 並與 .qrcard[data-url] 比對，最後拼 montage.png。
import { requirePkg, tryRequire } from './resolve.mjs';
const { chromium } = requirePkg('playwright');
const jsQR = tryRequire('jsqr'), pngjs = tryRequire('pngjs');
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const [html, outdir, W = '1280', Hh = '720'] = process.argv.slice(2);
if (!html || !outdir) { console.error('usage: qa-screenshots.mjs <index.html> <outdir>'); process.exit(1); }
mkdirSync(outdir, { recursive: true });
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: +W, height: +Hh } })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
await p.goto('file://' + resolve(html), { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(2000);
await p.evaluate(() => Reveal.configure({ transition: 'none', backgroundTransition: 'none' })); // 不關轉場會截到滑動中的畫面
await p.evaluate((all) => { window.__ALLFRAG = all; }, process.env.QA_FRAGMENTS !== '0'); // 預設把 fragment 全部展開後才截圖（QA_FRAGMENTS=0 保留初始狀態）
const total = await p.evaluate(() => Reveal.getTotalSlides());
const report = [];
for (let i = 0; i < total; i++) {
  await p.evaluate((i) => { Reveal.slide(i); if (window.__ALLFRAG) { let g = 0; while (Reveal.nextFragment() && g++ < 200) {} } }, i);
  await p.waitForTimeout(400);
  const f = `${outdir}/h-${String(i + 1).padStart(2, '0')}.png`;
  await p.screenshot({ path: f });
  const m = await p.evaluate(() => { const s = Reveal.getCurrentSlide(); const h = s.querySelector('h1,h2'); return { title: h ? h.textContent.trim() : '', notes: !!s.querySelector('aside.notes'), overflow: s.scrollHeight > s.clientHeight + 4 || s.scrollWidth > s.clientWidth + 4 }; });
  if (jsQR && pngjs) {  // 逐張 .qrcard 截圖解碼（一頁多個 QR 也能各自比對）；有 data-url 就比對，沒有就只回報
    const cards = p.locator('section.present .qrcard');
    const n = await cards.count(); const got = [];
    for (let k = 0; k < n; k++) {
      const tmp = `${outdir}/_qr.png`; await cards.nth(k).screenshot({ path: tmp });
      const png = pngjs.PNG.sync.read(readFileSync(tmp)); const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
      const want = await cards.nth(k).getAttribute('data-url');
      got.push(code ? code.data : null);
      if (!code) m.qrProblem = (m.qrProblem || '') + `第 ${k + 1} 張 QR 無法解碼；`;
      else if (want && code.data !== want) m.qrProblem = (m.qrProblem || '') + `第 ${k + 1} 張 QR 是 ${code.data}，data-url 為 ${want}；`;
    }
    if (n) m.qr = got;
  }
  report.push({ n: i + 1, ...m });
  if (!m.notes || m.overflow || m.qrProblem) console.log('slide', i + 1, JSON.stringify(m));
}
writeFileSync(`${outdir}/report.json`, JSON.stringify({ total, errors: errs, slides: report }, null, 1));
console.log('slides', total, 'errors', errs);
await b.close();
const mt = spawnSync('python3', [resolve(dirname(fileURLToPath(import.meta.url)), 'montage.py'), outdir], { encoding: 'utf8' });
console.log(mt.status === 0 ? mt.stdout.trim() : 'montage skipped: ' + (mt.stderr || '').trim().slice(-200));
