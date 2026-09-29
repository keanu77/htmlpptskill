// 用法：node render-slides.mjs <index.html> <outdir> [scale=1.5] [format=jpeg|png]
// 逐頁截圖（1280×720 CSS 像素 × scale，預設輸出 1920×1080 JPEG，隱藏控制列／頁碼、fragment 全展開）
// 並輸出 meta.json（title、notes、bg、size），供 build-handout.mjs 使用。QA_FRAGMENTS=0 保留初始狀態。
import { requirePkg, launchOpts, fileUrl, waitReveal, slideIndices } from './resolve.mjs';
const { chromium } = requirePkg('playwright');
import { mkdirSync, writeFileSync } from 'node:fs';
const [html, outdir, scale = '1.5', format = 'jpeg'] = process.argv.slice(2);
if (!html || !outdir) { console.error('usage: render-slides.mjs <index.html> <outdir> [scale] [jpeg|png]'); process.exit(1); }
mkdirSync(outdir, { recursive: true });
const b = await chromium.launch(launchOpts());
try {
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: +scale })).newPage();
  await p.goto(await fileUrl(html), { waitUntil: 'load', timeout: 60000 });
  await waitReveal(p, 800);
  await p.evaluate(() => Reveal.configure({ transition: 'none', backgroundTransition: 'none', autoAnimateDuration: 0 }));
  await p.addStyleTag({ content: '.reveal .controls,.reveal .progress,.reveal .slide-number{display:none!important}' });
  const bg = await p.evaluate(() => getComputedStyle(document.querySelector('.reveal-viewport') || document.body).backgroundColor);
  const all = process.env.QA_FRAGMENTS !== '0';
  const idx = await slideIndices(p); const meta = [];
  for (let i = 0; i < idx.length; i++) {
    await p.evaluate(({ h, v, all }) => { Reveal.slide(h, v); if (all) { let g = 0; while (Reveal.nextFragment() && g++ < 200) {} } }, { ...idx[i], all });
    await p.waitForTimeout(500);
    const ext = format === 'png' ? 'png' : 'jpg';
    await p.screenshot({ path: `${outdir}/s-${String(i + 1).padStart(3, '0')}.${ext}`, type: format === 'png' ? 'png' : 'jpeg', quality: format === 'png' ? undefined : 85 });
    meta.push(await p.evaluate(() => { const s = Reveal.getCurrentSlide(); const h = s.querySelector('h1,h2'); const n = s.querySelector('aside.notes');
      return { title: h ? h.textContent.replace(/\s+/g, ' ').trim() : '', notes: n ? n.textContent.replace(/\s+/g, ' ').trim() : '' }; }));
  }
  writeFileSync(`${outdir}/meta.json`, JSON.stringify({ bg, width: 1280, height: 720, slides: meta }, null, 1));
  console.log('rendered', idx.length, '→', outdir);
} finally { await b.close(); }
