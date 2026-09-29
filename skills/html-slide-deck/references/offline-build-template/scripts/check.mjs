// 驗收：逐頁截圖、檢查溢出、解碼 QR 並比對 content.js 的網址
// 用法：npm run check（第一次請先 npx playwright install chromium）
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { slides, tools } = require(path.join(root, 'content.js'));
const out = path.join(root, 'check-output');
fs.mkdirSync(out, { recursive: true });

const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
await page.goto('file://' + path.join(root, 'dist/index.html'));
await page.waitForTimeout(800);
await page.evaluate(() => Reveal.configure({ transition: 'none', backgroundTransition: 'none' }));

const total = await page.evaluate(() => Reveal.getTotalSlides());
const problems = [];
if (total !== slides.length) problems.push(`頁數 ${total} ≠ content.js ${slides.length}`);

for (let i = 0; i < total; i++) {
  await page.evaluate((n) => Reveal.slide(n), i);
  await page.waitForTimeout(300);
  const file = path.join(out, `${String(i + 1).padStart(2, '0')}.png`);
  await page.screenshot({ path: file });
  const o = await page.evaluate(() => {
    const s = Reveal.getCurrentSlide();
    return s.scrollHeight > 720 || s.scrollWidth > 1280 ? [s.scrollWidth, s.scrollHeight] : null;
  });
  if (o) problems.push(`第 ${i + 1} 頁溢出 ${o.join('×')}`);

  const s = slides[i];
  if (s.type === 'tool') {
    const png = PNG.sync.read(fs.readFileSync(file));
    const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    const want = tools[s.key].url;
    if (!code) problems.push(`第 ${i + 1} 頁 QR 無法解碼`);
    else if (code.data !== want) problems.push(`第 ${i + 1} 頁 QR 是 ${code.data}，應為 ${want}`);
  }
}
await browser.close();

console.log(`共 ${total} 頁，截圖在 check-output/`);
if (problems.length) { console.log('問題：\n- ' + problems.join('\n- ')); process.exit(1); }
console.log('全部通過：無溢出、工具頁 QR 皆正確');
