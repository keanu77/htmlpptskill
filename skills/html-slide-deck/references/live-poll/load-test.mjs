// 壓力測試：N 支假手機連 WebSocket、同時投一題，檢查講者畫面與手機都收到。Node 22+（內建 WebSocket）。
// 用法：ADMIN_KEY=… node load-test.mjs <https://….workers.dev> <題目 id> [N=150]
// 跑完會清空該題的票並關題；正式場次前不要對真的場次跑（會清掉那題的票）。
const [BASE, POLL, N = 150] = process.argv.slice(2);
const KEY = process.env.ADMIN_KEY;
if (!BASE || !POLL || !KEY) { console.error('usage: ADMIN_KEY=… node load-test.mjs <url> <poll-id> [N]'); process.exit(1); }
const WSB = BASE.replace(/^http/, 'ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ctl = body => fetch(BASE + '/api/control', { method: 'POST',
  headers: { 'content-type': 'application/json', authorization: 'Bearer ' + KEY }, body: JSON.stringify(body) })
  .then(r => { if (!r.ok) throw new Error('control HTTP ' + r.status); return r.json(); });

const screen = new WebSocket(WSB + '/ws?role=screen');
let results = {}, state = {};
screen.onmessage = e => { if (e.data === 'pong') return; const m = JSON.parse(e.data); if (m.type === 'results') results = m; else state = m; };
await new Promise((ok, bad) => { screen.onopen = ok; screen.onerror = bad; });

const seen = Array(+N).fill(null);
const socks = await Promise.all(Array.from({ length: +N }, (_, i) => new Promise((ok, bad) => {
  const ws = new WebSocket(WSB + '/ws?role=phone');
  ws.onmessage = e => { if (e.data !== 'pong') seen[i] = JSON.parse(e.data); };
  ws.onopen = () => ok(ws); ws.onerror = bad;
})));
await sleep(1000);
const phones = state.phones;
console.log('講者畫面看到手機數：', phones, '/', N);

const openedN = () => seen.filter(s => s && s.active === POLL && s.phase === 'open').length;
const opened = await ctl({ poll: POLL, phase: 'open', reset: true });
const def = opened.results;
await sleep(1000);
const gotOpen = openedN();
console.log('手機收到開題：', gotOpen, '/', N);

const value = i => (def.median !== undefined ? 50 + (i * 37) % 900 : i % def.counts.length);
const t0 = Date.now();
const codes = await Promise.all(Array.from({ length: +N }, (_, i) => fetch(BASE + '/api/vote', { method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ poll: POLL, voter: 'loadtest-' + String(i).padStart(4, '0'), value: value(i) }) }).then(r => r.status)));
const okVotes = codes.filter(c => c === 200).length;
console.log('投票成功：', okVotes, '/', N, '耗時', Date.now() - t0, 'ms');
await sleep(1000);
const total = results.total;
console.log('講者畫面統計總數：', total);

await ctl({ poll: POLL, phase: 'revealed' });
await sleep(1000);
const gotReveal = seen.filter(s => s && s.phase === 'revealed' && s.reveal).length;
console.log('手機收到揭曉：', gotReveal, '/', N);

await ctl({ poll: POLL, phase: 'closed', reset: true });
await ctl({ poll: null });
socks.forEach(s => s.close()); screen.close();
const ok = [phones, gotOpen, okVotes, total, gotReveal].every(n => n === +N);
console.log(ok ? '✓ 通過（測試票已清空）' : '✗ 有數字對不上，見上方');
setTimeout(() => process.exit(ok ? 0 : 1), 300);
