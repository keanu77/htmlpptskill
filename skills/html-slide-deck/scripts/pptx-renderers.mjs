// 內建版型：content.js 的 type → 原生 PPTX 頁面。欄位名稱對齊 offline-build-template 與常見講座 deck。
// 自訂版型用 --renderers 傳入，同名會覆蓋這裡的版本。每個函式簽名：(s, k) => void | Promise<void>，k 是 Kit。
import { C, W, H, M, FONT, ACCENTS, col, plain, textWidth } from './pptx-kit.mjs';

const ul = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const accent = (i, list = ACCENTS) => list[i % list.length];
const fr = (str, n = 2) => (str ? String(str).split(/\s+/).map((x) => parseFloat(x) || 1) : Array(n).fill(1));

export default function builtins() {
  const R = {
    title(s, k) {
      k.background(s.bg || 'bg-cover', s.bgOp ?? 0.9);
      const box = { x: 0.7, y: 1.2, w: 8.6, h: 5.0 };
      k.rect(box, { fill: C.bg, radius: 0.2, transparency: 30 });
      const x = box.x + 0.45, w = box.w - 0.9;
      if (s.kicker) k.pill(plain(s.kicker), { x, y: box.y + 0.45, color: C.amber });
      k.stack([
        { t: 'text', html: s.title, max: 46, bold: true, boldColor: C.amber, lineH: 1.2 },
        s.sub && { t: 'text', html: s.sub, max: 24, color: C.muted },
        s.who && { t: 'text', html: s.who, max: 18, color: C.teal, bold: true, boldColor: C.teal },
      ], { x, y: box.y + 1.05, w, h: box.h - 1.35 }, { gap: 0.3, valign: 'top' });
    },

    section(s, k) {
      k.state.part = `${s.num ? `${s.num}｜` : ''}${plain(s.title)}`;
      k.state.partColor = s.color || 'teal';
      k.background(s.bg, 0.95);
      const x = 0.9, w = 6.6, c = col(k.state.partColor);
      const blocks = [
        s.num && { t: 'text', html: String(s.num), max: 80, bold: true, color: c, boldColor: c, lineH: 1.05 },
        { t: 'text', html: s.title, max: 46, bold: true, boldColor: C.amber, lineH: 1.2 },
        s.sub && { t: 'text', html: s.sub, max: 22, color: C.muted },
      ];
      const qs = s.qs || [];
      const qh = qs.length * 0.62;
      const top = k.stack(blocks, { x, y: 1.0, w, h: H - 2.2 - qh }, { gap: 0.2, valign: 'middle' });
      let y = Math.max(1.0, (H - 2.2 - qh - top.h) / 2 + 1.0) + top.h + 0.35;
      for (const q of qs) {
        k.rect({ x, y, w, h: 0.5 }, { fill: C.bg, radius: 0.06, transparency: 35 });
        k.slide.addShape(k.pres.shapes.RECTANGLE, { x, y, w: 0.06, h: 0.5, fill: { color: C.amber }, line: { color: C.amber, transparency: 100 } });
        k.text(q, { x: x + 0.22, y: y + 0.04, w: w - 0.3, h: 0.42 }, { max: 18, valign: 'middle' });
        y += 0.62;
      }
    },

    ask(s, k) {
      k.background(s.bg, s.bgOp ?? 0.25);
      k.head(null, { chip: s.chip, chipColor: s.chipColor });
      const bottom = k.src(s.src);
      const blocks = [
        { t: 'text', html: s.q, max: 42, bold: true, color: C.amber, boldColor: C.amber, align: 'center', lineH: 1.3 },
        s.sub && { t: 'text', html: s.sub, max: 22, color: C.muted, align: 'center' },
      ];
      if (!s.img) { k.stack(blocks, { x: 1.2, y: 1.0, w: W - 2.4, h: bottom - 1.0 }, { gap: 0.3 }); return; }
      const r = k.stack(blocks, { x: 1.2, y: 1.0, w: W - 2.4, h: 2.4 }, { gap: 0.2, valign: 'top' });
      const iy = 1.0 + r.h + 0.3;
      k.image(s.img, { x: M, y: iy, w: W - 2 * M, h: bottom - iy }, { frame: !s.imgDark && s.frame !== false });
    },

    statement(s, k) {
      k.background(s.bg, s.bgOp ?? 0.25);
      k.head(null, { chip: s.chip, chipColor: s.chipColor });
      const bottom = k.src(s.src);
      k.stack([
        { t: 'text', html: s.text, max: 32, bold: true, align: 'center', lineH: 1.5 },
        s.sub && { t: 'text', html: s.sub, max: 22, color: C.muted, align: 'center' },
      ], { x: 1.4, y: 1.0, w: W - 2.8, h: bottom - 1.0 }, { gap: 0.35 });
    },

    quiz(s, k) {
      k.head(s.q, { chip: s.reveal ? '解答' : s.chip || '來想想看', chipColor: 'amber' });
      let bottom = k.src(s.src);
      if (s.reveal && s.why) bottom = k.note(`<b>為什麼？</b> ${s.why}`, bottom);
      const area = { y: 1.75, h: bottom - 1.75 };
      const [ib, ob] = s.img ? k.split([1, 1.1], area) : [null, { x: M, w: W - 2 * M, ...area }];
      if (ib) k.image(s.img, ib, { frame: !s.imgDark });
      const n = s.opts.length, gap = 0.16;
      const oh = Math.min(0.95, (ob.h - gap * (n - 1)) / n);
      let y = ob.y + (ob.h - (oh * n + gap * (n - 1))) / 2;
      s.opts.forEach((o, i) => {
        const ok = s.reveal && i === s.answer, dim = s.reveal && !ok;
        k.rect({ x: ob.x, y, w: ob.w, h: oh }, { fill: ok ? '1D4A40' : C.card, line: ok ? C.green : undefined, lineW: 2, radius: 0.14, transparency: dim ? 45 : 0 });
        const letter = 'ABCDEF'[i];
        k.slide.addText(letter, { x: ob.x + 0.2, y, w: 0.5, h: oh, margin: 0, fontFace: FONT.ui, fontSize: 24, bold: true, color: ok ? C.green : dim ? C.dim : C.teal, valign: 'middle' });
        k.text(o, { x: ob.x + 0.75, y: y + 0.06, w: ob.w - 0.95, h: oh - 0.12 }, { max: 24, color: dim ? C.dim : C.text, valign: 'middle' });
        y += oh + gap;
      });
    },

    cards(s, k) {
      k.head(s.title, { chip: s.chip, chipColor: s.chipColor });
      let bottom = k.src(s.src);
      bottom = k.note(s.foot, bottom);
      let top = 1.75;
      if (s.lead) top += k.text(s.lead, { x: M, y: top, w: W - 2 * M, h: 0.9 }, { max: 20, color: C.muted }).need + 0.15;
      grid(k, s.items, s.n === 6 ? 3 : s.n || s.items.length, { y: top, h: bottom - top }, (it, i) => ({
        h: [it.k && `<b>${it.k}</b>`, it.h].filter(Boolean).join('<br>'), p: it.p || it.tag, ul: it.ul, img: it.img,
        color: it.c || (s.colors || ACCENTS)[i % (s.colors || ACCENTS).length], center: !!it.img,
      }));
    },

    stats(s, k) {
      k.head(s.title, { chip: s.chip });
      let bottom = k.src(s.src);
      bottom = k.note(s.foot, bottom);
      let top = 1.75;
      if (s.lead) top += k.text(s.lead, { x: M, y: top, w: W - 2 * M, h: 0.9 }, { max: 20, color: C.muted }).need + 0.15;
      const boxes = k.cols(s.items.length, { y: top, h: bottom - top });
      const need = Math.max(...s.items.map((it, i) => 1.1 + k.cardNeed({ h: it.h, p: it.p }, boxes[i].w)));
      const h = Math.min(bottom - top, need);
      s.items.forEach((it, i) => {
        const b = { ...boxes[i], y: top + (bottom - top - h) / 2, h };
        const c = col(it.c || accent(i));
        k.rect(b, { fill: C.card, radius: 0.16 });
        const npt = Math.max(20, Math.min(44, Math.floor((b.w - 0.5) * 72 / (textWidth(plain(it.n), 1, true) * 1.08))));
        k.slide.addText(plain(it.n), { x: b.x + 0.26, y: b.y + 0.2, w: b.w - 0.46, h: 0.85, margin: 0, fontFace: FONT.ui, fontSize: npt, bold: true, color: c, valign: 'middle', fit: 'none', wrap: false });
        k.card({ x: b.x, y: b.y + 1.0, w: b.w, h: b.h - 1.0 }, { h: it.h, p: it.p, color: it.c || accent(i), fill: C.card });
      });
    },

    flow(s, k) {
      k.head(s.title, { chip: s.chip });
      let bottom = k.src(s.src);
      bottom = k.note(s.foot, bottom);
      let top = 1.75;
      if (s.lead) top += k.text(s.lead, { x: M, y: top, w: W - 2 * M, h: 0.9 }, { max: 20, color: C.muted }).need + 0.15;
      const steps = s.steps, n = steps.length, aw = 0.35;
      const boxes = k.cols(n, { y: top, h: bottom - top, gap: aw + 0.1 });
      const need = Math.max(...steps.map((st, i) => 0.6 + k.cardNeed({ h: st.h, p: st.p }, boxes[i].w)));
      const h = Math.min(bottom - top, need), y = top + (bottom - top - h) / 2;
      steps.forEach((st, i) => {
        const b = { ...boxes[i], y, h }, c = st.c || accent(i, ['teal', 'amber', 'green', 'coral']);
        k.rect(b, { fill: C.card, radius: 0.16 });
        k.slide.addShape(k.pres.shapes.OVAL, { x: b.x + b.w / 2 - 0.22, y: b.y + 0.18, w: 0.44, h: 0.44, fill: { color: C.card2 }, line: { color: C.card2 } });
        k.slide.addText(String(i + 1), { x: b.x + b.w / 2 - 0.22, y: b.y + 0.18, w: 0.44, h: 0.44, margin: 0, fontFace: FONT.ui, fontSize: 16, bold: true, color: col(c), align: 'center', valign: 'middle' });
        k.card({ x: b.x, y: b.y + 0.55, w: b.w, h: b.h - 0.55 }, { h: st.h, p: st.p, color: c, center: true, fill: C.card });
        if (i < n - 1) k.slide.addText('→', { x: b.x + b.w + 0.02, y, w: aw + 0.06, h, margin: 0, fontFace: FONT.ui, fontSize: 24, color: C.dim, align: 'center', valign: 'middle' });
      });
    },

    table(s, k) {
      k.head(s.title, { chip: s.chip, tag: s.lv && lvTag(s.lv) });
      let bottom = k.src(s.src);
      bottom = k.note(s.foot, bottom);
      let top = 1.75;
      if (s.lead) top += k.text(s.lead, { x: M, y: top, w: W - 2 * M, h: 0.9 }, { max: 20, color: C.muted }).need + 0.15;
      k.table(s.rows, { head: s.headRow, y: top, h: bottom - top, max: s.small ? 20 : 22 });
    },

    figure(s, k) {
      k.head(s.title, { chip: s.chip, tag: s.lv && lvTag(s.lv) });
      const bottom = k.src(s.src);
      const area = { y: 1.75, h: bottom - 1.75 };
      const blocks = [
        s.lead && { t: 'text', html: s.lead, max: 20, color: C.muted },
        s.bullets && { t: 'list', items: s.bullets, max: 20 },
        ...(s.cards || []).map((c) => ({ t: 'card', h: c.h, p: c.p, color: c.c || 'teal', bar: true })),
        s.foot && { t: 'note', html: s.foot },
      ];
      // 文字放不下就把圖縮窄，最多讓文字欄變 2 倍
      let ratio = fr(s.cols), fb, tb;
      for (let grow = 1; grow <= 2.01; grow += 0.25) {
        [fb, tb] = k.split([ratio[0], ratio[1] * grow], area);
        if (s.side === 'right') [tb, fb] = k.split([ratio[0] * grow, ratio[1]], area);   // 圖在右：圖拿第二欄
        if (k.stackLayout(blocks, tb, { gap: 0.16, maxScale: 1 }).fits) break;
      }
      figureImages(k, s, fb);
      k.stack(blocks, tb, { gap: 0.16 });
    },

    labels(s, k) {
      k.head(s.title, { chip: s.chip });
      const bottom = k.src(s.src);
      const area = { y: 1.7, h: bottom - 1.7 };
      const [ib, sb] = s.side ? k.split([1.6, 1], area) : [{ x: M, w: W - 2 * M, ...area }];
      const r = k.image(s.img, ib, { frame: false });
      for (const [label, px, py] of s.labels) marker(k, label, r.x + r.w * px / 100, r.y + r.h * py / 100, 18);
      if (sb) k.stack([{ t: 'text', html: s.side, max: 20 }], sb);
    },

    compare(s, k) {
      if (!s.cols && s.rows) return R.table({ ...s, headRow: s.headRow || s.head }, k);   // 表格式比較
      k.head(s.title, { chip: s.chip });
      let bottom = k.src(s.src);
      bottom = k.note(s.foot, bottom);
      const boxes = k.cols(s.cols.length, { y: 1.75, h: bottom - 1.75, gap: 0.3 });
      s.cols.forEach((c, i) => {
        const b = boxes[i], color = col(c.c || ['teal', 'amber'][i % 2]);
        k.rect(b, { fill: C.card, radius: 0.16 });
        k.slide.addShape(k.pres.shapes.RECTANGLE, { x: b.x, y: b.y + 0.14, w: 0.07, h: b.h - 0.28, fill: { color }, line: { color, transparency: 100 } });
        const ix = b.x + 0.3, iw = b.w - 0.5;
        let y = b.y + 0.2;
        y += k.text(c.h, { x: ix, y, w: iw, h: 0.9 }, { max: 22, bold: true, color, boldColor: color, lineH: 1.25 }).need + 0.15;
        const body = [c.p, c.ul && ul(c.ul)].filter(Boolean).join('');
        const bodyNeed = body ? k.need(body, iw, 17) : 0;
        if (c.img) {
          const ih = Math.max(1.4, b.y + b.h - 0.2 - y - bodyNeed - 0.2);
          const r = k.image(c.img, { x: ix, y, w: iw, h: ih }, { frame: true });
          y = r.y + r.h + 0.2;
        }
        if (body) k.text(body, { x: ix, y, w: iw, h: b.y + b.h - 0.18 - y }, { max: 18, color: C.muted });
      });
    },

    flips(s, k) {
      k.head(s.title, { chip: s.chip });
      const bottom = k.src(s.src);
      const boxes = k.cols(s.items.length, { y: 1.75, h: bottom - 1.75 });
      const fh = Math.min(boxes[0].h * 0.45, Math.max(...s.items.map((it) => k.need(it.myth, boxes[0].w - 0.5, 22, { lineH: 1.4 }))) + 0.95);
      s.items.forEach((it, i) => {
        const b = boxes[i], iw = b.w - 0.5;
        k.rect({ ...b, h: fh }, { fill: C.card, line: C.coral, lineW: 2 });
        k.pill('迷思？', { x: b.x + 0.25, y: b.y + 0.2, h: 0.34, fill: C.coral, color: C.coral, textColor: C.ink });
        k.text(it.myth, { x: b.x + 0.25, y: b.y + 0.68, w: iw, h: fh - 0.82 }, { max: 22, bold: true, lineH: 1.4 });
        const by = b.y + fh + 0.15, bh = b.h - fh - 0.15;
        k.rect({ x: b.x, y: by, w: b.w, h: bh }, { fill: C.card2, line: C.green, lineW: 2 });
        k.pill('實證', { x: b.x + 0.25, y: by + 0.2, h: 0.34, fill: C.green, color: C.green, textColor: C.ink });
        k.text(it.fact, { x: b.x + 0.25, y: by + 0.68, w: iw, h: bh - 0.82 }, { max: 18 });
      });
    },

    bars(s, k) {
      k.head(s.title, { chip: s.chip });
      let bottom = k.src(s.src);
      bottom = k.note(s.foot, bottom);
      let top = 1.75;
      if (s.lead) top += k.text(s.lead, { x: M, y: top, w: W - 2 * M, h: 0.9 }, { max: 20, color: C.muted }).need + 0.2;
      const max = Math.max(...s.items.map((it) => it.v));
      const n = s.items.length, rh = Math.min(0.75, (bottom - top) / n);
      const lw = 3.4, vw = 1.8, tx = M + lw + 0.2, tw = W - 2 * M - lw - vw - 0.4;
      s.items.forEach((it, i) => {
        const y = top + i * rh + (rh - 0.42) / 2;
        k.text(it.h, { x: M, y: y - 0.1, w: lw, h: 0.62 }, { max: 19, bold: true, align: 'right', valign: 'middle' });
        k.rect({ x: tx, y, w: tw, h: 0.42 }, { fill: C.card, radius: 0.08 });
        k.rect({ x: tx, y, w: Math.max(0.12, tw * it.v / max), h: 0.42 }, { fill: col(it.c || 'teal'), radius: 0.08 });
        k.slide.addText([{ text: String(it.v), options: { bold: true, color: C.amber, fontSize: 24 } }, ...(s.unit ? [{ text: ` ${s.unit}`, options: { color: C.muted, fontSize: 15 } }] : [])],
          { x: tx + tw + 0.2, y: y - 0.1, w: vw, h: 0.62, margin: 0, fontFace: FONT.ui, valign: 'middle' });
      });
    },

    photos(s, k) {
      if (s.title) k.head(s.title, { chip: s.chip });
      const top = s.title ? 1.75 : 0.6;
      const capH = s.cap ? 0.7 : 0;
      const boxes = k.cols(s.imgs.length, { y: top, h: H - 0.5 - top - capH, gap: 0.25 });
      s.imgs.forEach((n, i) => k.image(n, boxes[i]));
      if (s.cap) k.text(s.cap, { x: M, y: H - 0.5 - capH + 0.1, w: W - 2 * M, h: capH - 0.1 }, { max: 20, color: C.muted, align: 'center' });
    },

    refs(s, k) {
      k.head(s.title, { chip: s.chip });
      const items = s.items.map((r, i) => `${i + 1}. ${r}`);
      const half = Math.ceil(items.length / 2);
      const [a, b] = k.split([1, 1], { y: 1.75, h: H - 0.5 - 1.75, gap: 0.4 });
      k.text(items.slice(0, half).map((x) => `<p>${x}</p>`).join(''), a, { max: 16, color: C.muted, gap: 0.3, lineH: 1.3 });
      k.text(items.slice(half).map((x) => `<p>${x}</p>`).join(''), b, { max: 16, color: C.muted, gap: 0.3, lineH: 1.3 });
    },

    async end(s, k) {
      k.background(s.bg || 'bg-closing', s.bgOp ?? 0.85);
      const imgs = [].concat(s.img || []);
      const hasSide = imgs.length || s.qr;
      const tw = hasSide ? 7.2 : W - 2 * M;
      k.stack([
        { t: 'text', html: s.title, max: 46, bold: true, lineH: 1.2 },
        s.sub && { t: 'text', html: s.sub, max: 22, color: C.muted },
        s.who && { t: 'text', html: s.who, max: 18, bold: true, color: C.teal, boldColor: C.teal },
      ], { x: 0.9, y: 0.8, w: tw - 0.3, h: H - 1.6 }, { gap: 0.3 });
      const sx = 0.9 + tw + 0.2, sw = W - M - sx;
      if (s.qr) { await k.qr(s.qr, { x: sx + (sw - 3) / 2, y: 1.6, w: 3 }, s.qrLabel); return; }
      const ih = (H - 1.2 - 0.2 * (imgs.length - 1)) / Math.max(1, imgs.length);
      imgs.forEach((n, i) => k.image(n, { x: sx, y: 0.6 + i * (ih + 0.2), w: sw, h: ih }));
    },

    // 沒有對應版型時：標題＋所有字串欄位當條列，至少保留內容與備註可編輯
    generic(s, k) {
      k.head(plain(s.title || s.q || s.text || s.type), { chip: s.chip });
      const bottom = k.src(s.src);
      const skip = new Set(['type', 'notes', 'title', 'q', 'img', 'imgs', 'shot', 'shotUrl', 'bg', 'src', 'chip', 'color', 'qr', 'qrLabel']);
      const lines = [];
      for (const [key, v] of Object.entries(s)) {
        if (skip.has(key)) continue;
        if (typeof v === 'string' || typeof v === 'number') lines.push(String(v));
        else if (Array.isArray(v)) v.forEach((x) => lines.push(typeof x === 'object' ? Object.values(x).filter((y) => typeof y === 'string').join('：') : String(x)));
      }
      let img = s.img || (s.imgs && s.imgs[0]) || s.shot;
      if (img) try { k.resolve(img); } catch { img = null; }
      const [tb, ib] = img ? k.split([1.2, 1], { y: 1.75, h: bottom - 1.75 }) : [{ x: M, y: 1.75, w: W - 2 * M, h: bottom - 1.75 }];
      if (lines.length) k.stack([{ t: 'list', items: lines, max: 20 }], tb);
      if (ib) k.image(img, ib, { frame: true });
    },
  };
  // offline-build-template 的別名
  return { ...R, question: R.ask, three: R.cards, steps: R.flow };
}

const LV = { high: ['強', 'green'], mid: ['中', 'amber'], low: ['弱／無', 'coral'] };
export const lvTag = (lv) => (LV[lv] ? { label: `實證強度：${LV[lv][0]}`, color: LV[lv][1] } : null);

/** n 欄卡片網格；每列高度依內容，整體置中 */
export function grid(k, items, ncol, area, toCard) {
  const rows = Math.ceil(items.length / ncol), gap = 0.22;
  const boxes = k.cols(ncol, { y: 0, h: 0, gap: 0.25 });
  const cards = items.map(toCard);
  let scale = 1, rowH;
  for (scale = 1.25; scale >= 0.6; scale -= 0.04) {
    rowH = Array.from({ length: rows }, (_, r) => Math.max(...cards.slice(r * ncol, r * ncol + ncol).map((c, i) => k.cardNeed(c, boxes[i].w, scale))));
    if (rowH.reduce((a, b) => a + b, 0) + gap * (rows - 1) <= area.h) break;
  }
  const total = rowH.reduce((a, b) => a + b, 0) + gap * (rows - 1);
  if (total > area.h + 0.02) k.warn(`卡片網格可能超出（需 ${total.toFixed(2)} 吋，可用 ${area.h.toFixed(2)} 吋）`);
  let y = area.y + Math.max(0, (area.h - total) / 2);
  for (let r = 0; r < rows; r += 1) {
    const h = Math.min(rowH[r], area.h);
    const row = cards.slice(r * ncol, r * ncol + ncol);
    const offset = (ncol - row.length) * (boxes[0].w + 0.25) / 2;   // 最後一列不滿就置中
    row.forEach((c, i) => k.card({ ...boxes[i], x: boxes[i].x + offset, y, h }, { ...c, titleMax: k.pt(20, scale), bodyMax: k.pt(17, scale) }));
    y += h + gap;
  }
}

/** 圖上的標記（中心點對齊座標） */
export function marker(k, label, cx, cy, pt = 18) {
  const w = textWidth(plain(label), pt, true) + 0.3, h = pt / 72 * 1.55;
  k.rect({ x: cx - w / 2, y: cy - h / 2, w, h }, { fill: C.teal, radius: 0.08 });
  k.slide.addText(plain(label), { x: cx - w / 2, y: cy - h / 2, w, h, margin: 0, fontFace: FONT.ui, fontSize: pt, bold: true, color: '06222A', align: 'center', valign: 'middle' });
}

function figureImages(k, s, fb) {
  const imgs = Array.isArray(s.img) ? s.img : [s.img];
  const frame = !s.dark;
  if (s.marks) {
    const r = k.image(imgs[0], fb, { frame });
    for (const [label, px, py] of s.marks) marker(k, label, r.x + r.w * px / 100, r.y + r.h * py / 100, 15);
    return;
  }
  const capH = s.cap ? 0.45 : 0;
  const boxes = k.cols(imgs.length, { x: fb.x, w: fb.w, y: fb.y, h: fb.h - capH, gap: 0.15 });
  imgs.forEach((n, i) => k.image(n, boxes[i], { frame }));
  if (s.cap) k.text(s.cap, { x: fb.x, y: fb.y + fb.h - capH, w: fb.w, h: capH }, { max: 15, color: C.dim, align: 'center' });
}
