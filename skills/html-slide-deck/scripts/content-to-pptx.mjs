// content.js（做法 B：一頁一物件）→ 原生可編輯 PPTX。文字、表格、卡片都是 PowerPoint 物件，講者備註帶入。
// 用法：node content-to-pptx.mjs <content.js> <out.pptx> [--renderers my-renderers.mjs] [--img-dirs img,assets,shots] [--min-pt 15] [--strict]
//   --renderers：自訂版型模組，export default (kit 工具) => ({ type: (s, k) => {...} })，同名覆蓋內建版型
//   --img-dirs：圖片搜尋目錄（相對 content.js），依序找 <name>.jpg/.png
//   --strict：有文字可能超框的警告就 exit 1
// 動畫、翻牌、fragment 不轉；翻牌頁改為正反面上下並列。字型 Microsoft JhengHei（Mac／Windows PowerPoint 都有）。
import { createRequire } from 'node:module';
import { resolve, dirname, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeFileSync, rmSync } from 'node:fs';
import { requirePkg, tryRequire } from './resolve.mjs';
import * as kit from './pptx-kit.mjs';
import builtins from './pptx-renderers.mjs';
import * as helpers from './pptx-renderers.mjs';

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : def; };
const strict = args.includes('--strict') && args.splice(args.indexOf('--strict'), 1);
const rendererFile = flag('--renderers');
const imgDirsArg = flag('--img-dirs', 'img,assets,shots');
const minPt = Number(flag('--min-pt', 15));
const [contentArg, outArg] = args;
if (!contentArg || !outArg) {
  console.error('用法：node content-to-pptx.mjs <content.js> <out.pptx> [--renderers file.mjs] [--img-dirs img,assets,shots] [--min-pt 15] [--strict]');
  process.exit(2);
}

const contentPath = resolve(contentArg);
const base = dirname(contentPath);
const { slides, meta = {} } = createRequire(import.meta.url)(contentPath);
if (!Array.isArray(slides) || !slides.length) { console.error(`${contentArg} 沒有匯出 slides 陣列`); process.exit(2); }

const PptxGenJS = requirePkg('pptxgenjs');
const QR = tryRequire('qrcode');
const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE';
pres.title = kit.plain(meta.title || '');
pres.author = kit.plain(meta.author || '');
pres.defineSlideMaster({
  title: 'DECK', background: { color: kit.C.bg },
  slideNumber: { x: kit.W - kit.M - 0.9, y: kit.H - 0.42, w: 0.9, h: 0.3, fontFace: kit.FONT.ui, fontSize: minPt, color: kit.C.dim, align: 'right' },
});

const k = new kit.Kit(pres, { imgDirs: imgDirsArg.split(',').map((d) => (isAbsolute(d) ? d : resolve(base, d))), minPt });
k.qr = async (url, box, label) => {
  if (!QR) { k.warn('沒有 qrcode 套件，QR 改為文字網址'); k.text(url, { ...box, h: 0.6 }, { max: 15 }); return; }
  const data = await QR.toDataURL(url, { margin: 1, errorCorrectionLevel: 'M', width: 600, color: { dark: '#0B1F2A', light: '#FFFFFF' } });
  const text = label || url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const lines = Math.max(1, Math.ceil(text.length * 0.62 * minPt / 72 / (box.w - 0.2)));
  const labelH = 0.14 + lines * minPt * 1.25 / 72;
  k.rect({ x: box.x, y: box.y, w: box.w, h: box.w + labelH }, { fill: kit.C.white, radius: 0.12 });
  k.slide.addImage({ data, x: box.x + 0.08, y: box.y + 0.08, w: box.w - 0.16, h: box.w - 0.16, altText: url });
  k.slide.addText(text, {
    x: box.x + 0.05, y: box.y + box.w - 0.08, w: box.w - 0.1, h: labelH, margin: 0, fontFace: kit.FONT.mono,
    fontSize: minPt, bold: true, color: kit.C.ink, align: 'center', valign: 'middle', hyperlink: { url },
  });
};

let R = builtins();
if (rendererFile) {
  const mod = await import(pathToFileURL(resolve(rendererFile)).href);
  R = { ...R, ...(await mod.default({ ...kit, ...helpers })) };
}

const missing = new Set();
for (const [i, s] of slides.entries()) {
  k.n = i + 1;
  k.slide = pres.addSlide({ masterName: 'DECK' });
  const r = R[s.type] || (missing.add(s.type), R.generic);
  try {
    await r(s, k);
  } catch (e) {
    // 欄位跟內建版型對不上：清掉畫到一半的物件，改用通用版面，不讓整份失敗
    if (r === R.generic) throw new Error(`第 ${i + 1} 頁（${s.type}）轉換失敗：${e.message}`);
    k.warn(`版型 ${s.type} 轉換失敗（${e.message}），改用通用版面`);
    k.slide._slideObjects.length = 0;   // pptxgenjs 內部陣列；沒有公開的移除 API
    await R.generic(s, k);
  }
  if (s.notes) k.slide.addNotes(kit.plain(s.notes));
}

await pres.writeFile({ fileName: resolve(outArg) });
if (missing.size) console.warn(`沒有對應版型、改用通用版面：${[...missing].join(', ')}（用 --renderers 補）`);
const log = `${resolve(outArg)}.warnings.txt`;
rmSync(log, { force: true });
if (k.warnings.length) {
  writeFileSync(log, k.warnings.join('\n') + '\n');
  console.warn(`${k.warnings.length} 個版面警告 → ${log}`);
  k.warnings.slice(0, 10).forEach((w) => console.warn('  ' + w));
}
console.log(`slides ${slides.length} → ${outArg}`);
if (strict && k.warnings.length) process.exit(1);
