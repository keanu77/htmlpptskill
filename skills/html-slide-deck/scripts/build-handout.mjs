// 用法：node build-handout.mjs <renderDir> <out.pptx> "<author/footer>"
// 需要 pptxgenjs 與 sharp/PIL 不需要；先把 PNG 轉 JPG（python PIL）可把檔案從 18 MB 壓到 7 MB。
import { requirePkg } from './resolve.mjs';
const pptxgen = requirePkg('pptxgenjs');
import { readFileSync, existsSync } from 'node:fs';
const [dir, out, author = ''] = process.argv.slice(2);
if (!dir || !out) { console.error('usage: build-handout.mjs <renderDir> <out.pptx> [author]'); process.exit(1); }
const meta = JSON.parse(readFileSync(`${dir}/meta.json`, 'utf8'));
const pres = new pptxgen(); pres.layout = 'LAYOUT_16x9'; pres.author = author;
meta.forEach((m, i) => {
  const base = `${dir}/s-${String(i + 1).padStart(2, '0')}`;
  const path = existsSync(base + '.jpg') ? base + '.jpg' : base + '.png';
  const s = pres.addSlide(); s.background = { color: '0B1F2A' };
  s.addImage({ path, x: 0, y: 0, w: 10, h: 5.625 });
  s.addNotes((m.title ? `【${m.title}】\n` : '') + (m.notes || '（本頁無講者備註）'));
});
await pres.writeFile({ fileName: out });
console.log('wrote', out, meta.length, 'slides');
