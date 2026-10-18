// 用法：node poll-slides.mjs <in.html> <out.html> --worker <live-poll worker 目錄> --url <https://….workers.dev>
//       node poll-slides.mjs <in.html> <out.html> --polls <polls.json> --sim [人數]   模擬模式：不連後端、不含 key，可公開（Demo 用）
// 把 HTML 裡的占位 section 換成手機即時投票頁，並在最後一個 </body> 前注入樣式、設定與投影片端程式。
//   <section data-poll-join></section>       → 加入頁（大 QR＋在線手機數）
//   <section data-poll="題目 id"></section>  → 投票頁（題目取自 <worker>/src/polls.json）
// ADMIN_KEY 依序取環境變數 ADMIN_KEY、<worker>/.dev.vars。產出的 HTML 內含這把 key，只給講者電腦用，不要外流。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requirePkg } from './resolve.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCREEN = join(HERE, '..', 'references', 'live-poll', 'screen');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const VALUED = ['--worker', '--url', '--polls'];
const simAt = args.indexOf('--sim');
const simN = simAt >= 0 && /^\d+$/.test(args[simAt + 1] || '');
const SIM = simAt < 0 ? 0 : (simN ? Number(args[simAt + 1]) : 60);
const [input, output] = args.filter((a, i) => !a.startsWith('--') && !VALUED.includes(args[i - 1]) && !(simN && i === simAt + 1));
const worker = opt('--worker'), url = (opt('--url') || '').replace(/\/$/, '');
const pollsFile = opt('--polls') || (worker && join(worker, 'src', 'polls.json'));
const liveOk = worker && /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(url + '/');
if (!input || !output || !pollsFile || (!SIM && !liveOk)) {
  console.error('usage: poll-slides.mjs <in.html> <out.html> --worker <dir> --url <https://...>（本機測試可用 http://localhost:8787）\n' +
    '       poll-slides.mjs <in.html> <out.html> --polls <polls.json> --sim [人數]'); process.exit(1);
}

function adminKey() {
  if (process.env.ADMIN_KEY) return process.env.ADMIN_KEY;
  const f = join(worker, '.dev.vars');
  const line = existsSync(f) && readFileSync(f, 'utf8').split('\n').find(l => l.startsWith('ADMIN_KEY='));
  if (!line) { console.error(`找不到 ADMIN_KEY：設環境變數，或在 ${f} 寫 ADMIN_KEY=…`); process.exit(2); }
  return line.slice('ADMIN_KEY='.length).trim();
}

const { event, polls } = JSON.parse(readFileSync(pollsFile, 'utf8'));
const QR = requirePkg('qrcode');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const host = url.replace(/^https?:\/\//, '');
const L = 'ABCDEFG';

const simCard = () => `<div class="lp-sim">示範模式<br><b>模擬 ${SIM} 人作答</b><br>正式使用時這裡是加入 QR</div>`;
const qrCard = async () => {
  if (SIM) return simCard();
  const svg = await QR.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0B1F2A', light: '#FFFFFF' } });
  return `<div class="qrcard" data-url="${esc(url)}">${svg.replace('<svg ', '<svg class="qrsvg" ')}<div class="qrl">${esc(host)}</div></div>`;
};

async function joinSlide() {
  return `<section class="lp lp-joinslide"><div class="lp-kicker">現場互動</div><h2>拿出手機，一起作答</h2>
<div class="lp-join">${await qrCard()}<div><div>用手機相機掃 QR，或輸入網址</div><div class="lp-join-url">${esc(host)}</div>
<div class="lp-join-n"><span class="lp-dot"></span><b class="lp-phones">0</b> 支手機已加入</div>
<div class="lp-join-s">匿名作答，不收集個人資料；揭曉前可以改答案。</div><div class="lp-net"></div></div></div>
<aside class="notes">請大家掃 QR，等加入人數穩定再往下。</aside></section>`;
}

async function pollSlide(id) {
  const p = polls[id];
  if (!p) { console.error(`polls.json 沒有題目 ${id}`); process.exit(2); }
  let body, notes;
  if (p.type === 'choice') {
    body = `<div class="lp-opts">${p.options.map((o, i) => `<div class="lp-opt"><i>${L[i]}</i><div class="lp-opt-t">${esc(o)}</div>` +
      `<div class="lp-bar"><span></span></div><b class="lp-pct">0%</b></div>`).join('')}</div>`;
    notes = `給 30–40 秒作答，作答數穩定後按 A 揭曉。答案：${L[p.answer]}　${p.options[p.answer]}。${p.explain}`;
  } else {
    body = `<div class="lp-hist">${p.bins.map(([lo, hi]) => `<div class="lp-bin"><div class="lp-bin-bar"><span></span><b></b></div>` +
      `<div class="lp-bin-l">${hi < p.max ? lo + '–' + hi : lo + ' 以上'}</div></div>`).join('')}</div>` +
      `<div class="lp-median">全場中位數 <b class="lp-med">—</b></div>`;
    notes = `請大家猜一個數字，看分布與中位數後按 A 揭曉。答案 ${p.answer} ${p.unit || ''}。${p.explain}`;
  }
  return `<section class="lp lp-${p.type}" data-poll="${esc(id)}"><div class="lp-wrap"><div>
<div class="lp-kicker">${esc(p.kicker || '')}</div><h2>${esc(p.title)}</h2><div class="lp-stem">${esc(p.stem)}</div>${body}
<div class="lp-answer"><div class="lp-answer-h"></div><div class="lp-answer-b"></div></div></div>
<div class="lp-side">${await qrCard()}<div class="lp-count"><b class="lp-total">0</b> 人作答</div>
<div class="lp-phones-line"><span class="lp-dot"></span><b class="lp-phones">0</b> 支手機在線</div><div class="lp-net"></div>
<div class="lp-hint">按 A 揭曉</div></div></div>
<aside class="notes">${esc(notes)}（彩排後按 Shift+R 清空這題）</aside></section>`;
}

let s = readFileSync(input, 'utf8');
const used = [];
for (const m of [...s.matchAll(/<section data-poll-join><\/section>|<section data-poll="([^"]+)"><\/section>/g)]) {
  const html = m[1] ? await pollSlide(m[1]) : await joinSlide();
  if (m[1]) used.push(m[1]);
  s = s.replace(m[0], () => html);
}
if (!used.length && !s.includes('lp-joinslide')) { console.error('沒有找到占位 <section data-poll="…"></section>'); process.exit(1); }

const cfg = JSON.stringify(SIM ? { sim: SIM, polls, event } : { url, key: adminKey(), polls, event }).replace(/</g, '\\u003c');
const inject = `<style>${readFileSync(join(SCREEN, 'live-poll.css'), 'utf8')}</style>\n` +
  `<script>window.POLL_CFG=${cfg};</script>\n<script>${readFileSync(join(SCREEN, 'live-poll.js'), 'utf8')}</script>\n`;
const at = s.lastIndexOf('</body>');   // notes.js 原始碼裡也有 </body>，一定要找最後一個
if (at < 0) { console.error('找不到 </body>'); process.exit(1); }
writeFileSync(output, s.slice(0, at) + inject + s.slice(at));
console.log('wrote', output, '投票頁', used.length, '題：', used.join(', '));
console.log(SIM ? `模擬模式：${SIM} 人，不含 key，可公開。` : '⚠ 產出檔內含 ADMIN_KEY：只放講者電腦，不要上傳或寄出。');
