// 用法：node build-handout.mjs <renderDir> <out.pptx> [author]
// 一頁一張圖（render-slides.mjs 的輸出）＋講者備註進備忘稿。第三個參數只寫進 PPTX 的 author 中繼資料，畫面上不會出現。
import { requirePkg } from './resolve.mjs';
const pptxgen = requirePkg('pptxgenjs');
import { readFileSync, existsSync } from 'node:fs';
const [dir, out, author = ''] = process.argv.slice(2);
if (!dir || !out) { console.error('usage: build-handout.mjs <renderDir> <out.pptx> [author]'); process.exit(1); }
const raw = JSON.parse(readFileSync(`${dir}/meta.json`, 'utf8'));
const meta = Array.isArray(raw) ? { slides: raw, bg: 'rgb(11,31,42)', width: 1280, height: 720 } : raw;  // 舊版 meta.json 相容
const hex = (meta.bg.match(/\d+/g) || [11, 31, 42]).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('').toUpperCase();
const pres = new pptxgen(); pres.author = author;
const ratio = meta.width / meta.height; const W = 10, H = +(W / ratio).toFixed(3);
pres.defineLayout({ name: 'DECK', width: W, height: H }); pres.layout = 'DECK';
meta.slides.forEach((m, i) => {
  const base = `${dir}/s-${String(i + 1).padStart(3, '0')}`;
  const path = ['.jpg', '.png'].map(e => base + e).find(existsSync);
  if (!path) { console.error('缺圖', base); process.exit(1); }
  const s = pres.addSlide(); s.background = { color: hex };
  s.addImage({ path, x: 0, y: 0, w: W, h: H });
  s.addNotes((m.title ? `【${m.title}】\n` : '') + (m.notes || '（本頁無講者備註）'));
});
await pres.writeFile({ fileName: out });
console.log('wrote', out, meta.slides.length, 'slides');
