// 驗收：逐頁截圖（含垂直子頁、fragment 展開）、檢查溢出與 JS 錯誤、擋掉對外請求、逐張 .qrcard 解碼比對 data-url、頁數對 content.js。
// 用法：npm run check（第一次請先 npx playwright install chromium；已有 Chromium 可設 CHROMIUM_PATH）。有問題 → exit 1。
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { slides } = require(path.join(root, 'content.js'));
const out = path.join(root, 'check-output');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const problems = [], warnings = [], errors = [], external = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  await ctx.route('**/*', r => (/^(file|data|blob):/.test(r.request().url()) ? r.continue() : (external.push(r.request().url().slice(0, 160)), r.abort())));
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message.slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  await page.goto(pathToFileURL(path.join(root, 'dist/index.html')).href);
  await page.waitForFunction(() => window.Reveal && Reveal.isReady(), null, { timeout: 60000 });
  await page.evaluate(() => Reveal.configure({ transition: 'none', backgroundTransition: 'none', autoAnimateDuration: 0 }));
  const idx = await page.evaluate(() => Reveal.getSlides().map(s => { const { h, v } = Reveal.getIndices(s); return { h, v: v || 0 }; }));
  if (idx.length !== slides.length) problems.push(`頁數 ${idx.length} ≠ content.js ${slides.length}`);

  for (let i = 0; i < idx.length; i++) {
    await page.evaluate(({ h, v }) => { Reveal.slide(h, v); let g = 0; while (Reveal.nextFragment() && g++ < 200) {} }, idx[i]);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(out, `${String(i + 1).padStart(3, '0')}.png`) });
    const o = await page.evaluate(() => { const s = Reveal.getCurrentSlide();
      return s.scrollHeight > s.clientHeight + 4 || s.scrollWidth > s.clientWidth + 4 ? [s.scrollWidth, s.scrollHeight] : null; });
    if (o) problems.push(`第 ${i + 1} 頁溢出 ${o.join('×')}`);
    const cards = page.locator('section.present .qrcard'); const n = await cards.count();
    for (let k = 0; k < n; k++) {
      const tmp = path.join(out, `_qr-${i + 1}-${k + 1}.png`); await cards.nth(k).screenshot({ path: tmp });
      const png = PNG.sync.read(fs.readFileSync(tmp)); const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
      const want = await cards.nth(k).getAttribute('data-url');
      if (!code) problems.push(`第 ${i + 1} 頁第 ${k + 1} 張 QR 無法解碼`);
      else if (!want) warnings.push(`第 ${i + 1} 頁第 ${k + 1} 張 QR 沒有 data-url`);
      else if (code.data !== want) problems.push(`第 ${i + 1} 頁第 ${k + 1} 張 QR 是 ${code.data}，應為 ${want}`);
      else if (/example\.com|replace-me/.test(code.data)) warnings.push(`第 ${i + 1} 頁 QR 仍是占位網址 ${code.data}`);
    }
  }
} finally { await browser.close(); }
if (errors.length) problems.push(`JS／資源錯誤 ${errors.length} 則：${errors.slice(0, 3).join(' | ')}`);
if (external.length) problems.push(`對外請求 ${external.length} 個（離線會壞）：${external.slice(0, 3).join(' | ')}`);
console.log(`共 ${slides.length} 頁，截圖在 check-output/`);
if (warnings.length) console.log('警告：\n- ' + warnings.join('\n- '));
if (problems.length) { console.log('問題：\n- ' + problems.join('\n- ')); process.exit(1); }
console.log('全部通過：無溢出、無 JS 錯誤、無對外請求、QR 皆與 data-url 相符');
