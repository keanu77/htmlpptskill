// 用法：node print-pdf.mjs <index.html> <out.pdf>
// 用 reveal.js 的 ?print-pdf 模式直接印成 PDF（免 PowerPoint）。fragment 全部展開；要一頁一張請在 Reveal.initialize 設 pdfSeparateFragments:false。
import { requirePkg } from './resolve.mjs';
const { chromium } = requirePkg('playwright');
import { resolve } from 'node:path';
const [html, out] = process.argv.slice(2);
if (!html || !out) { console.error('usage: print-pdf.mjs <index.html> <out.pdf>'); process.exit(1); }
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://' + resolve(html) + '?print-pdf', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(4000);
await p.pdf({ path: out, width: '1280px', height: '720px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await b.close(); console.log('wrote', out);
