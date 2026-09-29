// 用法：node print-pdf.mjs <index.html> <out.pdf>
// 用 reveal.js 的 ?print-pdf 模式直接印成 PDF（免 PowerPoint）。fragment 全展開；
// 要一頁一張請在 Reveal.initialize 設 pdfSeparateFragments:false（範本已設）。頁面尺寸取自 Reveal 設定。
import { requirePkg, launchOpts, fileUrl, waitReveal } from './resolve.mjs';
const { chromium } = requirePkg('playwright');
const [html, out] = process.argv.slice(2);
if (!html || !out) { console.error('usage: print-pdf.mjs <index.html> <out.pdf>'); process.exit(1); }
const b = await chromium.launch(launchOpts());
try {
  const p = await b.newPage();
  await p.goto((await fileUrl(html)) + '?print-pdf', { waitUntil: 'load', timeout: 60000 });
  await waitReveal(p, 1500);
  await p.waitForFunction(() => document.body.classList.contains('print-pdf') || document.documentElement.classList.contains('reveal-print'), null, { timeout: 20000 }).catch(() => {});
  const { width, height } = await p.evaluate(() => ({ width: Reveal.getConfig().width, height: Reveal.getConfig().height }));
  await p.pdf({ path: out, width: `${width}px`, height: `${height}px`, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log('wrote', out, `${width}×${height}`);
} finally { await b.close(); }
