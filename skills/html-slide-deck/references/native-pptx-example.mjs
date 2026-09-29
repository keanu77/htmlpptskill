// 原生可編輯 PPTX 最小範例。用法：node native-pptx-example.mjs out.pptx（從有 pptxgenjs 的專案目錄跑；圖片缺少時該頁略過圖）
import { requirePkg } from '../scripts/resolve.mjs';
const pptxgen = requirePkg('pptxgenjs');
import { existsSync } from 'node:fs';
import { C, F, W, H, M, FOOT, chrome, title, card, numberedList, pillRow, frame } from './pptxgenjs-helpers.mjs';
const pic = (p) => existsSync(p) ? p : (console.warn('缺圖', p), null);
const pres = new pptxgen(); pres.layout = 'LAYOUT_16x9';
let n = 0;
const slide = (o = {}) => { n += 1; const s = pres.addSlide(); chrome(pres, s, { ...o, n, foot: FOOT }); return s; };
const txt = (s, text, o) => s.addText(text, { fontFace: F.ui, color: C.text, margin: 0, ...o });
{ // 章節頁：底圖＋大字
  const s = slide({ notes: '章節頁備註' }); if (pic('images/bg-chapter.jpg')) s.addImage({ path: 'images/bg-chapter.jpg', x: 0, y: 0, w: W, h: H });
  txt(s, '01', { x: 0.9, y: 1.1, w: 3, h: 1.1, fontSize: 60, bold: true, color: C.amber });
  txt(s, '章節標題', { x: 0.9, y: 2.2, w: 6, h: 0.8, fontSize: 38, bold: true });
  txt(s, '副標（寬度限 4.3 吋，避開右半底圖主體）', { x: 0.9, y: 3.05, w: 4.3, h: 0.8, fontSize: 14, color: C.muted });
}
{ // 內容頁：三卡＋說明
  const s = slide({ section: '01 章節', notes: '備註' }); title(s, '三個重點');
  pillRow(pres, s, [{ label: '一', body: '說明' }, { label: '二', body: '說明' }, { label: '三', body: '說明' }], { y: 1.65, h: 1.6, colors: [C.amber, C.teal, C.green] });
  card(pres, s, { x: M, y: 3.5, w: 9, h: 0.8, fill: C.card2 }); txt(s, '一句總結', { x: 0.8, y: 3.5, w: 8.4, h: 0.8, fontSize: 14, color: C.muted, valign: 'middle' });
}
{ // 工具頁：截圖框＋步驟＋QR
  const s = slide({ section: '工具', notes: '備註' }); title(s, '工具名稱');
  txt(s, '一句介紹', { x: M, y: 1.38, w: 6.1, h: 0.5, fontSize: 12.5 });
  if (pic('images/shot.jpg')) frame(pres, s, { x: M, y: 1.92, w: 6.1, path: 'images/shot.jpg', imgW: 2160, imgH: 900, caption: '', maxH: 1.4 });
  txt(s, '教學用法', { x: M, y: 3.85, w: 3, h: 0.25, fontSize: 11, bold: true, color: C.teal });
  numberedList(pres, s, ['用法一', '用法二', '用法三'], { x: M, y: 4.12, w: 6.1, rowH: 0.31, size: 11.5, color: C.teal, badge: 0.26 });
  card(pres, s, { x: 7.0, y: 1.45, w: 2.5, h: 2.84, fill: 'FFFFFF', radius: 0.1 }); if (pic('images/qr.png')) s.addImage({ path: 'images/qr.png', x: 7.1, y: 1.55, w: 2.3, h: 2.3 });
  s.addText('example.tw', { x: 7.05, y: 3.89, w: 2.4, h: 0.34, fontFace: F.mono, fontSize: 8.5, bold: true, color: C.ink, align: 'center', margin: 0 });
}
await pres.writeFile({ fileName: process.argv[2] || 'deck.pptx' }); console.log('wrote', n);
