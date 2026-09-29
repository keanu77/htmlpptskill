// 用法：node inline-assets.mjs <in.html> <out.html>
// 把範本裡的 reveal.js CDN <link>／<script src> 換成內嵌（從 node_modules/reveal.js 讀），拿掉 Google Fonts，
// 並把相對路徑圖片轉成 base64。產出可離線播放的單檔。
import { pkgDir } from './resolve.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join, extname } from 'node:path';
const [input, output] = process.argv.slice(2);
if (!input || !output) { console.error('usage: inline-assets.mjs <in.html> <out.html>'); process.exit(1); }
const revealDir = pkgDir('reveal.js');
const rd = p => readFileSync(join(revealDir, p), 'utf8').replace(/@import[^;]+;/g, '');
let s = readFileSync(input, 'utf8'); const base = dirname(resolve(input));
s = s.replace(/<link[^>]+fonts\.googleapis[^>]*>\s*/g, '').replace(/<link[^>]+rel="preconnect"[^>]*>\s*/g, '');
s = s.replace(/<link rel="stylesheet" href="https?:\/\/[^"]*reveal\.js@?[^"]*\/dist\/([^"]+)" \/>/g, (_, f) => `<style>${rd('dist/' + f)}</style>`);
s = s.replace(/<script src="https?:\/\/[^"]*reveal\.js@?[^"]*\/(dist\/reveal\.js|plugin\/[^"]+)"><\/script>/g, (_, f) => `<script>${rd(f)}</script>`);
const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
let missing = 0;
s = s.replace(/(src|data-background-image)="([^"]+\.(?:jpe?g|png|webp|svg))"/g, (m, attr, p) => {
  if (/^(https?:|data:)/.test(p)) return m; const f = resolve(base, p);
  if (!existsSync(f)) { missing++; console.warn('缺圖', p); return m; }
  return `${attr}="data:${mime[extname(f).toLowerCase()]};base64,${readFileSync(f).toString('base64')}"`;
});
writeFileSync(output, s);
const ext = (s.match(/(?:\ssrc="https?:\/\/|<link[^>]+href="https?:\/\/|url\(["']?https?:\/\/)/g) || []).length;  // 只算會被載入的資源；<a href> 是導覽連結不算
console.log('wrote', output, (s.length / 1e6).toFixed(2), 'MB', '缺圖', missing, '殘留外部 src/href', ext);
if (ext) process.exit(1);
