// Live Demo build：src/index.html → 內嵌 QR → inline-assets（reveal.js 內嵌）→ poll-slides --sim（模擬投票）→ ../docs/index.html
// 「這份 Demo 有多大」那題的答案在 build 時量實際檔案大小。
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QR from 'qrcode';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = join(HERE, '..', 'skills', 'html-slide-deck', 'scripts');
const BUILD = join(HERE, 'build'), OUT = join(HERE, '..', 'docs', 'index.html');
mkdirSync(BUILD, { recursive: true });
const run = (script, ...args) => execFileSync(process.execPath, [join(SCRIPTS, script), ...args], { cwd: HERE, stdio: 'inherit' });

const svg = await QR.toString('https://github.com/keanu77/htmlpptskill',
  { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0B1F2A', light: '#FFFFFF' } });
writeFileSync(join(BUILD, 'qr.html'), readFileSync(join(HERE, 'src', 'index.html'), 'utf8')
  .replace('__QR__', svg.replace('<svg ', '<svg class="qrsvg" ')));
run('inline-assets.mjs', join(BUILD, 'qr.html'), join(BUILD, 'inline.html'));

const polls = JSON.parse(readFileSync(join(HERE, 'polls.json'), 'utf8'));
let answer = 0;
for (let pass = 0; pass < 3; pass++) {
  polls.polls.size.answer = answer;
  writeFileSync(join(BUILD, 'polls.json'), JSON.stringify(polls));
  run('poll-slides.mjs', join(BUILD, 'inline.html'), OUT, '--polls', join(BUILD, 'polls.json'), '--sim', '60');
  const kb = Math.round(statSync(OUT).size / 1024);
  if (kb === answer) break;
  answer = kb;
}
console.log('Demo 大小', answer, 'KB →', OUT);
