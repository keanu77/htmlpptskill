// 原生可編輯 PPTX 的共用工具：HTML 片段 → 文字 run、估算文字高度並自動縮字、圖片等比放置、卡片、表格。
// content-to-pptx.mjs 與自訂版型（--renderers）都用這裡的函式。座標單位：英吋；字級：pt。
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const W = 13.333, H = 7.5, M = 0.6;          // LAYOUT_WIDE；HTML 1280×720 → 1px = 0.75pt
export const C = {
  bg: '0B1F2A', card: '13303C', card2: '1A3E4C', line: '2A5262',
  text: 'F3F7F8', muted: 'A3B8C0', dim: '6F8791', ink: '0B1F2A', white: 'FFFFFF',
  amber: 'F2B84B', teal: '3FC1B7', coral: 'E8846B', green: '6FCF97',
};
export const FONT = { ui: 'Microsoft JhengHei', mono: 'Menlo' };
export const ACCENTS = ['teal', 'amber', 'coral', 'green'];
export const col = (name, fallback = C.teal) => C[name] || (/^[0-9a-f]{6}$/i.test(name || '') ? name : fallback);

// ---------- HTML 片段 → 段落 ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] !== '#') return ENT[e.toLowerCase()] ?? m;
  return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
});

/** 支援 <b> <strong> <i> <em> <br> <ul>/<ol>/<li> <p> <div>；其他標籤略過、保留文字。回傳 [{bullet, runs:[{text,bold,italic}|{br:true}]}] */
export function parseHtml(html) {
  const paras = [];
  let cur = null, bold = 0, ital = 0;
  const open = (bullet = false) => { cur = { bullet, runs: [] }; paras.push(cur); };
  for (const tk of String(html ?? '').split(/(<[^>]+>)/)) {
    if (!tk) continue;
    const m = tk.match(/^<(\/?)([a-z0-9]+)/i);
    if (!m) {
      const text = decode(tk.replace(/\s+/g, ' '));
      if (!text.trim() && (!cur || !cur.runs.length)) continue;
      if (!cur) open();
      cur.runs.push({ text, bold: bold > 0, italic: ital > 0 });
      continue;
    }
    const close = m[1] === '/', tag = m[2].toLowerCase();
    if (tag === 'b' || tag === 'strong') bold = Math.max(0, bold + (close ? -1 : 1));
    else if (tag === 'i' || tag === 'em') ital = Math.max(0, ital + (close ? -1 : 1));
    else if (tag === 'br') { if (!cur) open(); cur.runs.push({ br: true }); }
    else if (tag === 'li') { if (close) cur = null; else open(true); }
    else if (['ul', 'ol', 'p', 'div', 'h1', 'h2', 'h3'].includes(tag)) cur = null;
  }
  return paras.map(trimPara).filter((p) => p.runs.some((r) => r.text && r.text.trim()));
}

function trimPara(p) {
  const runs = p.runs.map((r) => ({ ...r }));
  let lineStart = true;
  for (const r of runs) {
    if (r.br) { lineStart = true; continue; }
    if (lineStart) { r.text = r.text.replace(/^\s+/, ''); lineStart = r.text === ''; }
  }
  const last = [...runs].reverse().find((r) => !r.br);
  if (last) last.text = last.text.replace(/\s+$/, '');
  while (runs.length && runs[runs.length - 1].br) runs.pop();
  return { ...p, runs };
}

export const plain = (html) => parseHtml(html).map((p) => p.runs.map((r) => (r.br ? '\n' : r.text)).join('')).join('\n');

// ---------- 文字寬度估算（Microsoft JhengHei） ----------
const WIDE = /[ᄀ-ᅟ←-⇿①-⓿■-➿⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u;
function charEm(ch) {
  if (WIDE.test(ch) || ch.codePointAt(0) > 0x1F000) return 1;
  if (ch === ' ') return 0.32;
  if ('il.,:;|!\'`'.includes(ch)) return 0.3;
  if ('()[]{}/\\-–ftjr'.includes(ch)) return 0.42;
  if (/[0-9]/.test(ch)) return 0.6;
  if ('mwMW—'.includes(ch)) return 0.95;
  if (/[A-Z]/.test(ch)) return 0.74;
  return 0.6;
}
const tokens = (s) => s.match(/[A-Za-z0-9'’\-.,:;%°±+=/()–]+\s*|\s+|./gu) || [];

/** 估算段落在寬 w（吋）、字級 pt 下的行數 */
function paraLines(p, w, pt, indentIn) {
  const avail = Math.max(0.2, w - (p.bullet ? indentIn : 0)) * 72 / pt;   // 以 em 計
  let lines = 1, x = 0;
  for (const r of p.runs) {
    if (r.br) { lines += 1; x = 0; continue; }
    const k = r.bold ? 1.04 : 1;
    for (const tk of tokens(r.text)) {
      const tw = [...tk].reduce((a, ch) => a + charEm(ch), 0) * k;
      if (x + tw <= avail || x === 0 && tw <= avail) { x += tw; continue; }
      if (tw > avail) {                       // 超長字串逐字斷
        for (const ch of tk) { const cw = charEm(ch) * k; if (x + cw > avail) { lines += 1; x = 0; } x += cw; }
        continue;
      }
      lines += 1; x = tk.trim() ? tw : 0;
    }
  }
  return lines;
}

export const LINE = 1.3;
const IMG_H = 1.5;   // 卡片內小圖高度   // 行距倍數（以 exact spacing 寫進 PPTX，估算才會準）
export function measure(paras, w, pt, { lineH = LINE, gap = 0.35 } = {}) {
  const indent = pt * 1.1 / 72;
  const lines = paras.reduce((a, p) => a + paraLines(p, w, pt, indent), 0);
  return (lines * pt * lineH + Math.max(0, paras.length - 1) * gap * pt) / 72;
}

/** 從 max 往下找放得進 h 的字級；到 min 仍放不下就回 ok:false */
export function fit(paras, w, h, { max = 20, min = 15, lineH = LINE, gap = 0.35 } = {}) {
  for (let pt = max; pt >= min; pt -= 0.5) {
    const need = measure(paras, w, pt, { lineH, gap });
    if (need <= h + 0.02) return { pt, need, ok: true };
  }
  return { pt: min, need: measure(paras, w, min, { lineH, gap }), ok: false };
}

function toRuns(paras, pt, o) {
  const out = [];
  paras.forEach((p, pi) => {
    let soft = false, first = true;
    const runs = p.runs.filter((r) => r.br || r.text);
    runs.forEach((r, ri) => {
      if (r.br) { soft = true; return; }
      const isLast = !runs.slice(ri + 1).some((x) => !x.br);
      const options = {
        bold: r.bold || !!o.bold, italic: r.italic || undefined,
        color: r.bold && o.boldColor ? o.boldColor : o.color,
        breakLine: isLast && pi < paras.length - 1,
        softBreakBefore: soft || undefined,
      };
      if (first && p.bullet) options.bullet = { indent: Math.round(pt * 1.1) };
      out.push({ text: r.text, options });
      soft = false; first = false;
    });
  });
  return out;
}

// ---------- 版面工具 ----------
export class Kit {
  constructor(pres, { imgDirs = [], minPt = 15, part = '', partColor = 'teal' } = {}) {
    this.pres = pres; this.imgDirs = imgDirs; this.minPt = minPt;
    this.state = { part, partColor }; this.warnings = []; this.n = 0; this.slide = null;
    this.sizeCache = new Map();
  }

  warn(msg) { this.warnings.push(`第 ${this.n} 頁：${msg}`); }

  /** 加文字。html 可以是字串或 parseHtml 的結果。o: max/min/color/boldColor/bold/align/valign/lineH/gap/face */
  text(html, box, o = {}) {
    const paras = Array.isArray(html) ? html : parseHtml(html);
    if (!paras.length) return { pt: 0, need: 0, ok: true };
    const min = Math.min(o.min ?? this.minPt, o.max ?? 20);
    const lineH = o.lineH ?? LINE, gap = o.gap ?? 0.35;
    const f = fit(paras, box.w, box.h, { max: o.max ?? 20, min, lineH, gap });
    if (!f.ok && !o.quiet) this.warn(`文字可能超出框（需 ${f.need.toFixed(2)} 吋，框 ${box.h.toFixed(2)} 吋）：「${plain(html).slice(0, 24)}…」`);
    this.slide.addText(toRuns(paras, f.pt, { color: C.text, boldColor: C.amber, ...o }), {
      x: box.x, y: box.y, w: box.w, h: box.h, margin: 0, fontFace: o.face || FONT.ui, fontSize: f.pt,
      color: o.color || C.text, align: o.align || 'left', valign: o.valign || 'top',
      lineSpacing: Math.round(f.pt * lineH * 10) / 10, paraSpaceAfter: Math.round(f.pt * gap), fit: 'none',
    });
    return f;
  }

  /** 文字在寬 w、字級 pt 下需要的高度（排版用） */
  need(html, w, pt, o = {}) { return measure(Array.isArray(html) ? html : parseHtml(html), w, pt, o); }

  rect(box, { fill = C.card, line, radius = 0.14, lineW = 1.5, transparency } = {}) {
    const shape = radius ? this.pres.shapes.ROUNDED_RECTANGLE : this.pres.shapes.RECTANGLE;
    this.slide.addShape(shape, {
      ...box, fill: { color: fill, transparency }, rectRadius: radius || undefined,
      line: line ? { color: line, width: lineW } : { color: fill, transparency: 100 },
    });
  }

  pill(label, { x, y, h = 0.38, color = C.teal, fill = C.card2, outline = false, pt = 15, bold = true, textColor }) {
    const w = textWidth(label, pt, bold) + 0.36;
    this.rect({ x, y, w, h }, { fill: outline ? C.bg : fill, line: outline ? color : undefined, radius: h / 2 });
    this.slide.addText(label, { x, y, w, h, margin: 0, fontFace: FONT.ui, fontSize: pt, bold, color: textColor || color, align: 'center', valign: 'middle' });
    return w;
  }

  /** 頁首：章節 chip ＋ 標題；回傳內容起點 y */
  head(title, { chip, chipColor, tag } = {}) {
    const label = chip ?? this.state.part;
    const cc = col(chipColor || this.state.partColor);
    if (label) this.pill(label, { x: M, y: 0.38, color: cc, outline: chipColor === 'coral' || chipColor === 'green' });
    if (!title) return 0.95;
    const tagW = tag ? textWidth(tag.label, 15, true) + 0.5 : 0;
    const f = this.text(title, { x: M, y: 0.86, w: W - 2 * M - tagW, h: 0.62 }, { max: 30, min: 22, bold: true, boldColor: null, valign: 'middle', lineH: 1.2, quiet: false });
    if (tag) {
      const tw = textWidth(plain(title), f.pt, true);
      this.pill(tag.label, { x: Math.min(M + tw + 0.25, W - M - tagW), y: 0.98, color: col(tag.color), outline: true });
    }
    return 1.68;
  }

  /** 頁尾出處；回傳出處上緣 y（內容不要超過這裡） */
  src(text) {
    if (!text) return H - 0.45;
    const w = W - 2 * M - 0.9;
    const h = Math.min(0.9, this.need(text, w, this.minPt, { lineH: 1.25 }) + 0.02);
    const y = H - 0.35 - h;
    this.text(text, { x: M, y, w, h }, { max: this.minPt, color: C.dim, boldColor: C.muted, lineH: 1.25 });
    return y - 0.12;
  }

  /** 底部提示框（HTML 的 .note）；在 yBottom 之上，回傳框上緣 y */
  note(html, yBottom, { x = M, w = W - 2 * M, max = 17, color = C.muted } = {}) {
    if (!html) return yBottom;
    const inner = w - 0.5;
    const h = Math.min(1.6, this.need(html, inner, max) + 0.28);
    const y = yBottom - h;
    this.rect({ x, y, w, h }, { fill: C.card2, radius: 0.14 });
    this.text(html, { x: x + 0.25, y: y + 0.14, w: inner, h: h - 0.28 }, { max, color, valign: 'middle' });
    return y - 0.16;
  }

  resolve(name) {
    for (const dir of this.imgDirs) for (const ext of ['jpg', 'jpeg', 'png']) {
      const f = join(dir, `${name}.${ext}`);
      if (existsSync(f)) return f;
    }
    if (existsSync(name)) return name;
    throw new Error(`找不到圖片 ${name}（搜尋 ${this.imgDirs.join(', ')}）`);
  }

  size(file) {
    if (!this.sizeCache.has(file)) this.sizeCache.set(file, imageSize(file));
    return this.sizeCache.get(file);
  }

  /** 圖片等比塞進 box。o: align(left|center|right) valign(top|middle|bottom) frame(白底圖框) pad */
  image(name, box, o = {}) {
    const file = this.resolve(name);
    const { w: iw, h: ih } = this.size(file);
    const pad = o.frame ? (o.pad ?? 0.08) : 0;
    const bw = box.w - 2 * pad, bh = box.h - 2 * pad;
    const s = Math.min(bw / iw, bh / ih);
    const w = iw * s, h = ih * s;
    const ax = { left: 0, center: 0.5, right: 1 }[o.align || 'center'];
    const ay = { top: 0, middle: 0.5, bottom: 1 }[o.valign || 'middle'];
    const x = box.x + pad + (bw - w) * ax, y = box.y + pad + (bh - h) * ay;
    if (o.frame) this.rect({ x: x - pad, y: y - pad, w: w + 2 * pad, h: h + 2 * pad }, { fill: C.white, radius: 0.12 });
    this.slide.addImage({ path: file, x, y, w, h, ...(o.transparency ? { transparency: o.transparency } : {}) });
    return { x, y, w, h };
  }

  /** 整頁底圖＋暗色遮罩（opacity 0–1 對應 HTML 的 data-background-opacity） */
  background(name, opacity = 0.9) {
    if (!name) return;
    let file;
    try { file = this.resolve(name); } catch { return; }
    const { w: iw, h: ih } = this.size(file);
    const s = Math.max(W / iw, H / ih);
    this.slide.addImage({ path: file, x: (W - iw * s) / 2, y: (H - ih * s) / 2, w: iw * s, h: ih * s });
    if (opacity < 1) this.rect({ x: 0, y: 0, w: W, h: H }, { fill: C.bg, radius: 0, transparency: Math.round(opacity * 100) });
  }

  /** 卡片：標題（色）＋內文；bar=true 左側色條。回傳卡片 box */
  card(box, { h: title, p, ul, color = 'teal', bar = false, center = false, fill = C.card, img, titleMax = 20, bodyMax = 17, bodyColor = C.muted }) {
    const c = col(color);
    this.rect(box, { fill, radius: 0.16 });
    if (bar) this.slide.addShape(this.pres.shapes.RECTANGLE, { x: box.x, y: box.y + 0.14, w: 0.07, h: box.h - 0.28, fill: { color: c }, line: { color: c, transparency: 100 } });
    const ix = box.x + 0.26, iw = box.w - 0.46;
    let y = box.y + 0.2;
    const bottom = box.y + box.h - 0.18;
    if (img) {
      const r = this.image(img, { x: ix, y, w: iw, h: Math.min(IMG_H, (bottom - y) * 0.5) }, { frame: true, pad: 0.05 });
      y = r.y + r.h + 0.16;
    }
    if (title) {
      const th = Math.min(bottom - y, this.need(title, iw, titleMax, { lineH: 1.25 }) + 0.02);
      const f = this.text(title, { x: ix, y, w: iw, h: th }, { max: titleMax, bold: true, color: c, boldColor: c, align: center ? 'center' : 'left', lineH: 1.25 });
      y += Math.min(th, f.need) + 0.1;
    }
    const body = [p, ul ? `<ul>${ul.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''].filter(Boolean).join('');
    if (body && bottom - y > 0.2) this.text(body, { x: ix, y, w: iw, h: bottom - y }, { max: bodyMax, color: bodyColor, align: center ? 'center' : 'left' });
    return box;
  }

  /** 表格。rows：二維陣列（HTML 字串）。o: head（表頭列）、colW（比例）、firstCol（第一欄當標題）、max、y、h */
  table(rows, { head, x = M, y, w = W - 2 * M, h, colW, max = 21, firstCol = true, headColor = C.amber, firstColor = C.teal, highlight = [] }) {
    const all = head ? [head, ...rows] : rows;
    const ncol = Math.max(...all.map((r) => r.length));
    const ratio = colW || autoColW(all, ncol);
    const sum = ratio.reduce((a, b) => a + b, 0);
    let cw = ratio.map((r) => (r / sum) * w);
    if (firstCol && !colW) {   // 第一欄（列標題）盡量不換行，最多占 30%
      const want = Math.min(0.3 * w, Math.max(...rows.map((r) => textWidth(plain(r[0] ?? ''), max, true))) + 0.25);
      if (want > cw[0]) { const rest = (w - want) / (w - cw[0]); cw = cw.map((c, i) => (i ? c * rest : want)); }
    }
    const padX = 0.1, padY = 0.06;
    const cells = all.map((r) => r.map((c) => parseHtml(c == null || c === '' ? '' : String(c))));
    const rowH = (pt) => cells.map((r) => Math.max(...r.map((ps, i) => (ps.length ? measure(ps, cw[i] - 2 * padX, pt, { lineH: 1.3, gap: 0.2 }) : pt * 1.3 / 72))) + 2 * padY + 0.02);
    let pt = max, hs = rowH(pt);
    while (pt > this.minPt && hs.reduce((a, b) => a + b, 0) > h) { pt -= 0.5; hs = rowH(pt); }
    if (hs.reduce((a, b) => a + b, 0) > h + 0.01) this.warn(`表格可能超出（需 ${hs.reduce((a, b) => a + b, 0).toFixed(2)} 吋，可用 ${h.toFixed(2)} 吋）`);
    const border = { type: 'solid', pt: 0.75, color: C.line };
    const data = cells.map((r, ri) => r.map((ps, ci) => {
      const isHead = head && ri === 0, isFirst = firstCol && ci === 0 && !isHead;
      const hl = highlight.includes(head ? ri - 1 : ri);
      const color = isHead ? headColor : isFirst ? firstColor : hl ? C.amber : C.text;
      return {
        text: ps.length ? toRuns(ps, pt, { color, boldColor: isHead || isFirst ? color : C.amber, bold: isHead || isFirst }) : '',
        options: {
          fill: { color: isHead ? C.card2 : C.bg }, valign: 'top', margin: [padY, padX, padY, padX],
          border: [isHead ? { type: 'none' } : border, { type: 'none' }, isHead ? { type: 'solid', pt: 1.5, color: headColor } : border, { type: 'none' }],
        },
      };
    }));
    // 空白格補一個字元，PowerPoint 才會套用字級
    data.forEach((r) => r.forEach((c) => { if (!c.text) c.text = [{ text: ' ', options: { color: C.dim } }]; }));
    this.slide.addTable(data, { x, y, w, colW: cw, rowH: hs, fontFace: FONT.ui, fontSize: pt, color: C.text, lineSpacing: Math.round(pt * 1.3 * 10) / 10, paraSpaceAfter: Math.round(pt * 0.2), autoPage: false });
    return { pt, h: hs.reduce((a, b) => a + b, 0) };
  }

  /** 卡片在寬 w 下需要的高度（字級依 scale 縮放） */
  cardNeed(c, w, scale = 1) {
    const iw = w - 0.46, tp = this.pt(c.titleMax ?? 20, scale), bp = this.pt(c.bodyMax ?? 17, scale);
    const body = [c.p, c.ul ? `<ul>${c.ul.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''].filter(Boolean).join('');
    return 0.38 + (c.img ? IMG_H + 0.16 : 0) + (c.h ? this.need(c.h, iw, tp, { lineH: 1.25 }) + 0.1 : 0) + (body ? this.need(body, iw, bp) : 0);
  }

  pt(max, scale) { return Math.max(Math.min(this.minPt, max), Math.round(max * scale * 2) / 2); }

  /**
   * 直向堆疊區塊，找出放得下的最大縮放比再畫。blocks：
   *   { t:'text', html, max, color, bold, align }   { t:'list', items:[html], max }
   *   { t:'card', h, p, ul, color, bar, img }       { t:'note', html, max }
   * o.valign：top|middle（預設 middle）
   */
  stack(blocks, box, { gap = 0.18, valign = 'middle', maxScale = 1.25 } = {}) {
    const { list, sc, hs, total } = this.stackLayout(blocks, box, { gap, maxScale });
    if (total > box.h + 0.02) this.warn(`區塊堆疊可能超出（需 ${total.toFixed(2)} 吋，可用 ${box.h.toFixed(2)} 吋）`);
    let y = box.y + (valign === 'middle' ? Math.max(0, (box.h - total) / 2) : 0);
    list.forEach((b, i) => {
      const h = hs[i], r = { x: box.x, y, w: box.w, h: h + 0.04 };
      if (b.t === 'card') this.card({ ...r, h }, { ...b, titleMax: this.pt(b.titleMax ?? 19, sc), bodyMax: this.pt(b.max ?? 17, sc) });
      else if (b.t === 'note') this.noteBox(b.html, { ...r, h }, this.pt(b.max ?? 17, sc), b.color);
      else this.text(b.html, r, { max: this.pt(b.max ?? 20, sc), color: b.color, bold: b.bold, boldColor: b.boldColor, align: b.align, lineH: b.lineH });
      y += h + gap;
    });
    return { scale: sc, h: total };
  }

  /** 只算不畫：回傳縮放比與各區塊高度；fits 表示放得下 */
  stackLayout(blocks, box, { gap = 0.18, maxScale = 1.25 } = {}) {
    const list = blocks.filter(Boolean).map((b) => (b.t === 'list' ? { ...b, t: 'text', html: `<ul>${b.items.map((x) => `<li>${x}</li>`).join('')}</ul>` } : b));
    const needOf = (b, sc) => {
      if (b.t === 'card') return this.cardNeed({ ...b, titleMax: b.titleMax ?? 19, bodyMax: b.max ?? 17 }, box.w, sc);
      if (b.t === 'note') return this.need(b.html, box.w - 0.5, this.pt(b.max ?? 17, sc)) + 0.3;
      return this.need(b.html, box.w, this.pt(b.max ?? 20, sc), { lineH: b.lineH ?? LINE });
    };
    let sc = maxScale, hs;
    for (; sc >= 0.5; sc -= 0.03) {
      hs = list.map((b) => needOf(b, sc));
      if (hs.reduce((a, b) => a + b, 0) + gap * (list.length - 1) <= box.h) break;
    }
    sc = Math.max(sc, 0.5);
    const total = hs.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
    return { list, sc, hs, total, fits: total <= box.h + 0.02 };
  }

  noteBox(html, box, max = 17, color = C.muted) {
    this.rect(box, { fill: C.card2, radius: 0.14 });
    this.text(html, { x: box.x + 0.25, y: box.y + 0.15, w: box.w - 0.5, h: box.h - 0.26 }, { max, color, valign: 'middle' });
  }

  /** 一列 n 等分的 box */
  cols(n, { x = M, w = W - 2 * M, gap = 0.25, y, h }) {
    const cw = (w - gap * (n - 1)) / n;
    return Array.from({ length: n }, (_, i) => ({ x: x + i * (cw + gap), y, w: cw, h }));
  }

  /** 依比例切欄，例如 split([1.3,1]) */
  split(ratios, { x = M, w = W - 2 * M, gap = 0.4, y, h }) {
    const sum = ratios.reduce((a, b) => a + b, 0), avail = w - gap * (ratios.length - 1);
    let cx = x;
    return ratios.map((r) => { const bw = avail * r / sum; const b = { x: cx, y, w: bw, h }; cx += bw + gap; return b; });
  }
}

export function textWidth(s, pt, bold = false) {
  return [...String(s)].reduce((a, ch) => a + charEm(ch), 0) * (bold ? 1.04 : 1) * pt / 72;
}

function autoColW(rows, n) {
  const len = Array.from({ length: n }, (_, i) => Math.max(...rows.map((r) => plain(r[i] ?? '').length || 1)));
  return len.map((l) => Math.max(4, Math.min(l, 40)));
}

/** 讀 PNG／JPEG 像素尺寸（不需外部套件） */
export function imageSize(file) {
  const b = readFileSync(file);
  if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const mk = b[i + 1];
      if (mk >= 0xc0 && mk <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(mk)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  throw new Error(`無法讀取圖片尺寸：${file}（只支援 PNG／JPEG）`);
}
