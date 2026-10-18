/* 手機即時投票：投影片端（講者電腦）。需要 window.POLL_CFG = { url, key, polls }，由 scripts/poll-slides.mjs 注入。
   進到投票頁自動開題；離開投票頁手機回到「等下一題」。
   講者鍵：A 揭曉、Shift+R 清空本題（彩排後用）。網路斷了照樣能按 A 顯示答案。
   網址加 ?offline 完全不連線；自動化瀏覽器（QA 截圖）與 ?print-pdf 也不連線，跟 STATIC 開關同一套判斷，要測連線加 ?live。 */
(() => {
  const CFG = window.POLL_CFG;
  const Q = location.search;
  const OFFLINE = /[?&]offline/.test(Q) || (!/[?&]live/.test(Q) && (navigator.webdriver || Q.includes('print-pdf')));
  const L = 'ABCDEFG';
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const pollSec = id => document.querySelector(`section[data-poll="${id}"]`);
  const results = {};
  let current = null, ws = null, wsRetry = 0, poller = null;

  /* ---------------------------------------------------------------- 網路 */
  async function api(path, opts = {}) {
    if (OFFLINE) throw new Error('offline');
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 5000);
    try {
      const r = await fetch(CFG.url + path, { ...opts, signal: ctl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(timer); }
  }
  const control = body => api('/api/control', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + CFG.key },
    body: JSON.stringify(body),
  });

  function setNet(ok, msg) {
    document.documentElement.classList.toggle('lp-live', ok);
    $$('.lp-net').forEach(el => { el.textContent = ok ? '' : msg; });
  }

  function onMessage(m) {
    if (m.type === 'state') $$('.lp-phones').forEach(el => { el.textContent = m.phones; });
    if (m.type === 'results') { results[m.poll] = m; render(m.poll); }
  }

  function connect() {
    if (OFFLINE) return setNet(false, '離線模式：按 A 仍可揭曉');
    try { ws = new WebSocket(CFG.url.replace(/^http/, 'ws') + '/ws?role=screen'); }
    catch (e) { return startPolling(); }
    ws.onopen = () => { wsRetry = 0; setNet(true); stopPolling(); };
    ws.onmessage = e => { if (e.data !== 'pong') onMessage(JSON.parse(e.data)); };
    ws.onclose = () => {
      setNet(false, '連線中斷，重試中…（按 A 仍可揭曉）');
      startPolling();
      setTimeout(connect, Math.min(15000, 1000 * 2 ** wsRetry++));
    };
  }
  setInterval(() => { if (ws && ws.readyState === 1) ws.send('ping'); }, 25000);

  function startPolling() {
    if (poller || OFFLINE) return;
    poller = setInterval(async () => {
      try {
        onMessage(await api('/api/state'));
        if (current) onMessage(await api('/api/results?poll=' + current));
      } catch (e) { /* 下一輪再試；畫面已顯示斷線提示 */ }
    }, 2500);
  }
  function stopPolling() { clearInterval(poller); poller = null; }

  /* ---------------------------------------------------------------- 投票頁 */
  function render(id) {
    const sec = pollSec(id), res = results[id], def = CFG.polls[id];
    if (!sec || !res || !def) return;
    sec.querySelector('.lp-total').textContent = res.total;
    if (def.type === 'choice') {
      $$('.lp-opt', sec).forEach((el, i) => {
        const pct = res.total ? Math.round(res.counts[i] / res.total * 100) : 0;
        el.querySelector('.lp-bar span').style.width = pct + '%';
        el.querySelector('.lp-pct').textContent = pct + '%';
      });
    } else {
      const max = Math.max(1, ...res.counts);
      $$('.lp-bin', sec).forEach((el, i) => {
        el.querySelector('span').style.height = (res.counts[i] / max * 100) + '%';
        el.querySelector('b').textContent = res.counts[i] || '';
      });
      sec.querySelector('.lp-med').textContent = res.median == null ? '—' : res.median + ' ' + (def.unit || '');
    }
    if (res.phase === 'revealed') showAnswer(id);
  }

  function showAnswer(id) {
    const sec = pollSec(id), def = CFG.polls[id], res = results[id];
    sec.classList.add('lp-revealed');
    if (def.type === 'choice') {
      $$('.lp-opt', sec).forEach((el, i) => el.classList.toggle('ok', i === def.answer));
      sec.querySelector('.lp-answer-h').textContent = `答案：${L[def.answer]}　${def.options[def.answer]}`;
    } else {
      $$('.lp-bin', sec).forEach((el, i) => {
        const [lo, hi] = def.bins[i];
        el.classList.toggle('ok', def.answer >= lo && def.answer <= hi);
      });
      const lo = Math.round(def.answer * 0.8), hi = Math.round(def.answer * 1.2);
      const close = res && res.total ? `；猜在 ${lo}–${hi} 之間的有 ${res.close} 人` : '';
      sec.querySelector('.lp-answer-h').textContent = `答案：${def.answer} ${def.unit || ''}${close}`;
    }
    sec.querySelector('.lp-answer-b').textContent = def.explain;
  }

  function clearAnswer(id) {
    const sec = pollSec(id);
    sec.classList.remove('lp-revealed');
    $$('.ok', sec).forEach(el => el.classList.remove('ok'));
  }

  async function enterPoll(id) {
    current = id;
    try {
      const res = await api('/api/results?poll=' + id);
      results[id] = res;
      if (res.phase !== 'revealed') {
        const r = await control({ poll: id, phase: 'open' });
        results[id] = r.results;
      } else {
        await control({ poll: id, phase: 'revealed' });     // 回到已揭曉的題：讓手機也顯示答案
      }
      render(id);
    } catch (e) {
      setNet(false, '連不到投票伺服器（按 A 仍可揭曉）');
    }
  }

  async function reveal(id) {
    if (results[id]) results[id].phase = 'revealed';
    showAnswer(id);
    try { const r = await control({ poll: id, phase: 'revealed' }); results[id] = r.results; render(id); }
    catch (e) { setNet(false, '揭曉沒送到手機（網路）'); }
  }

  async function resetPoll(id) {
    clearAnswer(id);
    try { const r = await control({ poll: id, phase: 'open', reset: true }); results[id] = r.results; render(id); }
    catch (e) { setNet(false, '清空失敗（網路）'); }
  }

  function onShow(sec) {
    const id = sec && sec.dataset.poll;
    if (id) return enterPoll(id);
    if (current) { current = null; control({ poll: null }).catch(() => {}); }
  }

  // capture 階段攔截，避免和 reveal.js 內建鍵衝突；只在投票頁生效
  document.addEventListener('keydown', e => {
    if (!current || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.key === 'a' || e.key === 'A') && !e.shiftKey) { e.preventDefault(); reveal(current); }
    if (e.key === 'R' && e.shiftKey) { e.preventDefault(); resetPoll(current); }
  }, true);

  function start() {
    if ($$('section[data-poll], .lp-joinslide').length) connect();
    Reveal.on('slidechanged', e => onShow(e.currentSlide));
    onShow(Reveal.getCurrentSlide());
  }
  if (Reveal.isReady()) start(); else Reveal.on('ready', start);
})();
