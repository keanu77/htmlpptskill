export const C = {
  bg: '0B1F2A', card: '13303C', card2: '1A3E4C', line: '2A5262',
  text: 'F3F7F8', muted: 'A3B8C0', dim: '6F8791',
  amber: 'F2B84B', teal: '3FC1B7', coral: 'E8846B', green: '6FCF97',
  ink: '0B1F2A',
};
export const F = { ui: 'Microsoft JhengHei', mono: 'Menlo' };
export const W = 10, H = 5.625, M = 0.5;
export const AUTHOR = '署名';
export const FOOT = '簡報名稱｜署名';


const t = (text, o = {}) => ({ text, options: o });

export function chrome(pres, slide, { section, tag, tagColor, n, notes, foot = FOOT, sectionColor = C.teal }) {
  slide.background = { color: C.bg };
  if (section) {
    const cw = Math.max(1.55, Math.min(4.5, 0.22 + section.length * 0.16));
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 0.32, w: cw, h: 0.3, fill: { color: C.card2 }, line: { color: C.card2 }, rectRadius: 0.15 });
    slide.addText(section, { x: M, y: 0.32, w: cw, h: 0.3, fontFace: F.ui, fontSize: 10.5, bold: true, color: sectionColor, align: 'center', valign: 'middle', margin: 0 });
  }
  if (tag) {
    const col = tagColor || C.amber;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: W - M - 1.7, y: 0.32, w: 1.7, h: 0.3, fill: { color: C.bg }, line: { color: col, width: 1 }, rectRadius: 0.15 });
    slide.addText(tag, { x: W - M - 1.7, y: 0.32, w: 1.7, h: 0.3, fontFace: F.ui, fontSize: 10.5, bold: true, color: col, align: 'center', valign: 'middle', margin: 0 });
  }
  slide.addText(foot, { x: M, y: H - 0.42, w: 6, h: 0.25, fontFace: F.ui, fontSize: 9, color: C.dim, margin: 0, valign: 'middle' });
  slide.addText(String(n).padStart(2, '0'), { x: W - M - 1, y: H - 0.42, w: 1, h: 0.25, fontFace: F.ui, fontSize: 9, color: C.dim, align: 'right', margin: 0, valign: 'middle' });
  if (notes) slide.addNotes(notes);
}

export function title(slide, text, { y = 0.72, size = 27, w = W - 2 * M } = {}) {
  slide.addText(text, { x: M, y, w, h: 0.75, fontFace: F.ui, fontSize: size, bold: true, color: C.text, margin: 0, valign: 'middle' });
}

export function sub(slide, text, { y = 1.42, w = W - 2 * M, size = 14, color = C.muted } = {}) {
  slide.addText(text, { x: M, y, w, h: 0.4, fontFace: F.ui, fontSize: size, color, margin: 0, valign: 'middle' });
}

export function card(pres, slide, { x, y, w, h, fill = C.card, radius = 0.12, line }) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: line ? { color: line, width: 1 } : { color: fill }, rectRadius: radius });
}

export function numBadge(pres, slide, { x, y, label, color = C.amber, size = 0.42, fontSize = 13 }) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: size, h: size, fill: { color }, line: { color } });
  slide.addText(label, { x, y, w: size, h: size, fontFace: F.ui, fontSize, bold: true, color: C.ink, align: 'center', valign: 'middle', margin: 0 });
}

// Screenshot in a browser-like frame. img: {path, w, h} in px
export function frame(pres, slide, { x, y, w, path, imgW, imgH, caption, maxH = 2.85 }) {
  const innerW = w - 0.16;
  let innerH = innerW * (imgH / imgW);
  let iw = innerW;
  if (maxH && innerH > maxH) { innerH = maxH; iw = innerH * (imgW / imgH); }
  const fw = iw + 0.16, fh = innerH + 0.42;
  card(pres, slide, { x, y, w: fw, h: fh, fill: C.card2, radius: 0.08 });
  ['E8846B', 'F2B84B', '6FCF97'].forEach((c, i) => slide.addShape(pres.shapes.OVAL, { x: x + 0.12 + i * 0.17, y: y + 0.1, w: 0.1, h: 0.1, fill: { color: c }, line: { color: c } }));
  slide.addImage({ path, x: x + 0.08, y: y + 0.32, w: iw, h: innerH });
  if (caption) slide.addText(caption, { x, y: y + fh + 0.05, w: fw, h: 0.28, fontFace: F.ui, fontSize: 9.5, color: C.dim, margin: 0, align: 'center' });
  return { w: fw, h: fh };
}

export function bulletList(slide, items, { x, y, w, h, size = 15, color = C.text, gap = 8 }) {
  const runs = items.map((it, i) => t(it, { bullet: { indent: 14 }, breakLine: i < items.length - 1, paraSpaceAfter: gap }));
  slide.addText(runs, { x, y, w, h, fontFace: F.ui, fontSize: size, color, margin: 0, valign: 'top' });
}

export function numberedList(pres, slide, items, { x, y, w, rowH = 0.62, size = 15, color = C.amber, textColor = C.text, badge = 0.36 }) {
  items.forEach((it, i) => {
    const yy = y + i * rowH;
    numBadge(pres, slide, { x, y: yy + (rowH - badge) / 2 - 0.02, label: String(i + 1), color, size: badge, fontSize: Math.round(badge * 33) });
    const body = typeof it === 'string' ? [t(it)] : [t(it.head, { bold: true, breakLine: true }), t(it.body, { color: C.muted, fontSize: size - 3 })];
    slide.addText(body, { x: x + badge + 0.16, y: yy, w: w - badge - 0.16, h: rowH - 0.05, fontFace: F.ui, fontSize: size, color: textColor, margin: 0, valign: 'middle' });
  });
}

export function twoCol(pres, slide, { y = 1.55, h = 3.4, left, right, leftColor = C.teal, rightColor = C.coral, size = 15 }) {
  const colW = (W - 2 * M - 0.3) / 2;
  [[M, left, leftColor], [M + colW + 0.3, right, rightColor]].forEach(([x, col, color]) => {
    card(pres, slide, { x, y, w: colW, h });
    slide.addShape(pres.shapes.RECTANGLE, { x: x + 0.3, y: y + 0.27, w: 0.08, h: 0.3, fill: { color }, line: { color } });
    slide.addText(col.title, { x: x + 0.5, y: y + 0.2, w: colW - 0.8, h: 0.45, fontFace: F.ui, fontSize: 16, bold: true, color, margin: 0, valign: 'middle' });
    bulletList(slide, col.items, { x: x + 0.3, y: y + 0.8, w: colW - 0.6, h: h - 0.95, size, gap: 10 });
  });
}

export function pillRow(pres, slide, items, { y, h = 0.9, gap = 0.18, x = M, w = W - 2 * M, labelSize = 22, bodySize = 12, colors }) {
  const n = items.length; const cw = (w - gap * (n - 1)) / n;
  items.forEach((it, i) => {
    const xx = x + i * (cw + gap); const col = colors ? colors[i % colors.length] : C.teal;
    card(pres, slide, { x: xx, y, w: cw, h });
    slide.addText(it.label, { x: xx, y: y + 0.12, w: cw, h: 0.42, fontFace: F.ui, fontSize: labelSize, bold: true, color: col, align: 'center', margin: 0, valign: 'middle' });
    slide.addText(it.body, { x: xx + 0.12, y: y + 0.55, w: cw - 0.24, h: h - 0.65, fontFace: F.ui, fontSize: bodySize, color: C.text, align: 'center', margin: 0, valign: 'top' });
  });
}

export function mono(slide, text, { x, y, w, h, size = 13, color = C.text, valign = 'middle' }) {
  slide.addText(text, { x, y, w, h, fontFace: F.mono, fontSize: size, color, margin: 0, valign });
}
