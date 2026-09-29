// 用法：node render-slides.mjs <index.html> <outdir>
// 逐頁 1920×1080 截圖（隱藏控制列／頁碼）並輸出 meta.json（title, notes），供 build-handout.mjs 使用。
import { requirePkg } from './resolve.mjs';
const { chromium } = requirePkg('playwright');
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const [html, outdir] = process.argv.slice(2);
if (!html || !outdir) { console.error('usage: render-slides.mjs <index.html> <outdir>'); process.exit(1); }
mkdirSync(outdir, { recursive: true });
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 })).newPage();
await p.goto('file://' + resolve(html), { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(2500);
await p.evaluate(() => Reveal.configure({ transition: 'none', backgroundTransition: 'none' }));
await p.addStyleTag({ content: '.reveal .controls,.reveal .progress,.reveal .slide-number{display:none!important}' });
await p.evaluate((all) => { window.__ALLFRAG = all; }, process.env.QA_FRAGMENTS !== '0'); // 預設把 fragment 全部展開後才截圖（QA_FRAGMENTS=0 保留初始狀態）
const total = await p.evaluate(() => Reveal.getTotalSlides());
const meta = [];
for (let i = 0; i < total; i++) {
  await p.evaluate((i) => { Reveal.slide(i); if (window.__ALLFRAG) { let g = 0; while (Reveal.nextFragment() && g++ < 200) {} } }, i); await p.waitForTimeout(700);
  await p.screenshot({ path: `${outdir}/s-${String(i + 1).padStart(2, '0')}.png` });
  meta.push(await p.evaluate(() => { const s = Reveal.getCurrentSlide(); const h = s.querySelector('h1,h2'); const n = s.querySelector('aside.notes');
    return { title: h ? h.textContent.replace(/\s+/g, ' ').trim() : '', notes: n ? n.textContent.replace(/\s+/g, ' ').trim() : '' }; }));
}
writeFileSync(`${outdir}/meta.json`, JSON.stringify(meta, null, 1));
console.log('rendered', total, '→', outdir);
await b.close();
