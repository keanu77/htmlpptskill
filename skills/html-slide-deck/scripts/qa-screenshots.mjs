// 用法：node qa-screenshots.mjs <index.html> <outdir> [width=1280] [height=720]
// 逐頁截圖（先關閉轉場、展開全部 fragment）、記錄 JS 錯誤、缺備註、溢出（高與寬）、對外網路請求，
// 逐張 .qrcard 截圖解碼並與 data-url 比對，最後拼 montage.png。有錯誤 → exit 1。
// 環境變數：QA_OFFLINE=1 對外請求視為失敗；QA_FRAGMENTS=0 保留初始狀態；QA_SKIP_QR=1 允許沒有 jsqr；CHROMIUM_PATH、PYTHON、SKILL_PKG_ROOT。
import { requirePkg, tryRequire, launchOpts, fileUrl, waitReveal, slideIndices } from './resolve.mjs';
const { chromium } = requirePkg('playwright');
const jsQR = tryRequire('jsqr'), pngjs = tryRequire('pngjs');
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const [html, outdir, W = '1280', Hh = '720'] = process.argv.slice(2);
if (!html || !outdir) { console.error('usage: qa-screenshots.mjs <index.html> <outdir> [w] [h]'); process.exit(1); }
if (!(jsQR && pngjs) && process.env.QA_SKIP_QR !== '1') {
  console.error('缺 jsqr／pngjs，無法驗 QR。到 skill 目錄 npm install，或設 QA_SKIP_QR=1 明確略過。'); process.exit(2);
}
mkdirSync(outdir, { recursive: true });
const errors = [], external = [], problems = [], warnings = [];
const b = await chromium.launch(launchOpts());
try {
  const ctx = await b.newContext({ viewport: { width: +W, height: +Hh } });
  const offline = process.env.QA_OFFLINE === '1';
  await ctx.route('**/*', route => {  // 記錄對外請求；QA_OFFLINE=1 時擋掉（模擬會場沒網路）
    const u = route.request().url();
    if (/^(file|data|blob):/.test(u)) return route.continue();
    external.push(u.slice(0, 160)); return offline ? route.abort() : route.continue();
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message.slice(0, 400)));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 400)); });
  await p.goto(await fileUrl(html), { waitUntil: 'load', timeout: 60000 });
  await waitReveal(p, 500);
  await p.evaluate(() => Reveal.configure({ transition: 'none', backgroundTransition: 'none', autoAnimateDuration: 0 }));
  const all = process.env.QA_FRAGMENTS !== '0';
  const idx = await slideIndices(p);
  const report = [];
  for (let i = 0; i < idx.length; i++) {
    await p.evaluate(({ h, v, all }) => { Reveal.slide(h, v); if (all) { let g = 0; while (Reveal.nextFragment() && g++ < 200) {} } }, { ...idx[i], all });
    await p.waitForTimeout(400);
    const f = `${outdir}/h-${String(i + 1).padStart(3, '0')}.png`;
    await p.screenshot({ path: f });
    const m = await p.evaluate(() => { const s = Reveal.getCurrentSlide(); const h = s.querySelector('h1,h2');
      return { title: h ? h.textContent.trim() : '', notes: !!s.querySelector('aside.notes'),
               overflow: s.scrollHeight > s.clientHeight + 4 || s.scrollWidth > s.clientWidth + 4 }; });
    m.n = i + 1; m.h = idx[i].h; m.v = idx[i].v;
    if (jsQR && pngjs) {
      const cards = p.locator('section.present .qrcard'); const n = await cards.count(); const got = [];
      for (let k = 0; k < n; k++) {
        const tmp = `${outdir}/_qr-${String(i + 1).padStart(3, '0')}-${k + 1}.png`; await cards.nth(k).screenshot({ path: tmp });
        const png = pngjs.PNG.sync.read(readFileSync(tmp)); const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
        const want = await cards.nth(k).getAttribute('data-url'); got.push(code ? code.data : null);
        if (!code) m.qrProblem = (m.qrProblem || '') + `第 ${k + 1} 張 QR 無法解碼；`;
        else if (!want) warnings.push(`第 ${i + 1} 頁第 ${k + 1} 張 QR 沒有 data-url，無法比對（解碼為 ${code.data}）`);
        else if (code.data !== want) m.qrProblem = (m.qrProblem || '') + `第 ${k + 1} 張 QR 是 ${code.data}，data-url 為 ${want}；`;
        else if (/example\.com|replace-me|your-site/.test(code.data)) warnings.push(`第 ${i + 1} 頁 QR 仍是占位網址 ${code.data}`);
      }
      if (n) m.qr = got;
    }
    if (m.overflow) problems.push(`第 ${i + 1} 頁溢出`);
    if (m.qrProblem) problems.push(`第 ${i + 1} 頁 ${m.qrProblem}`);
    if (!m.notes) warnings.push(`第 ${i + 1} 頁沒有講者備註`);
    report.push(m);
    if (!m.notes || m.overflow || m.qrProblem) console.log('slide', i + 1, JSON.stringify(m));
  }
  if (errors.length) problems.push(`頁面 JS／資源錯誤 ${errors.length} 則（見 report.json errors）`);
  if (external.length) (offline ? problems : warnings).push(`對外請求 ${external.length} 個（離線會壞；見 report.json external；交付前用 QA_OFFLINE=1 驗）`);
  writeFileSync(`${outdir}/report.json`, JSON.stringify({ total: idx.length, errors, external, problems, warnings, slides: report }, null, 1));
} finally { await b.close(); }

const py = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const mt = spawnSync(py, [resolve(dirname(fileURLToPath(import.meta.url)), 'montage.py'), outdir], { encoding: 'utf8' });
if (mt.status === 0) console.log(mt.stdout.trim()); else warnings.push('montage 未產生：' + ((mt.stderr || mt.error?.message || '').trim().slice(-200)));

console.log(`\n共 ${(JSON.parse(readFileSync(`${outdir}/report.json`, 'utf8'))).total} 頁`);
if (warnings.length) console.log('警告：\n- ' + warnings.join('\n- '));
if (problems.length) { console.log('問題：\n- ' + problems.join('\n- ')); process.exit(1); }
console.log('QA 通過：無溢出、無 JS 錯誤、QR 全部相符' + (warnings.length ? '（有警告，見上）' : ''));
