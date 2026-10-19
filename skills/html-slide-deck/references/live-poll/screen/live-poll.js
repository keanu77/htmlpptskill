/* 手機即時投票：投影片端（講者電腦）。需要 window.POLL_CFG = { url, key, polls }，由 scripts/poll-slides.mjs 注入。
   進到投票頁自動開題；離開投票頁手機回到「等下一題」。
   講者鍵：A 揭曉、Shift+R 清空本題（彩排後用）。網路斷了照樣能按 A 顯示答案。
   模擬模式（POLL_CFG.sim，公開 Demo 用）：不連後端、不需要 key，進投票頁自動跑出 sim 人的作答過程。
   網址加 ?offline 完全不連線；自動化瀏覽器（QA 截圖）與 ?print-pdf 也不連線，跟 STATIC 開關同一套判斷，要測連線加 ?live。 */
(() => {
  const CFG = window.POLL_CFG;
  const Q = location.search;
  const OFFLINE = /[?&]offline/.test(Q) || (!/[?&]live/.test(Q) && (navigator.webdriver || Q.includes('print-pdf')));
  const L = 'ABCDEFG';
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const pollSec = id => document.querySelector(`section[data-poll="${id}"]`);
  const results = {};
  let current = null, ws = null, wsRetry = 0, poller = null, navSeq = 0;

  /* ---------------------------------------------------------------- 模擬模式 */
  const SIM = CFG.sim ? (CFG.sim === true ? 60 : CFG.sim) : 0;
  const sims = {};                                  // id → { votes:[], timer }
  function simResults(id, phase) {
    const def = CFG.polls[id], v = sims[id].votes;
    const out = { type: 'results', poll: id, phase, total: v.length };
    if (def.type === 'choice') {
      out.counts = def.options.map((_, i) => v.filter(x => x === i).length);
    } else {
      const sorted = [...v].sort((a, b) => a - b);
      out.counts = def.bins.map(([lo, hi]) => v.filter(x => x >= lo && x <= hi).length);
      const mid = sorted.length >> 1;                 // 偶數筆取中間兩筆平均
      out.median = !sorted.length ? null : sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      out.close = v.filter(x => Math.abs(x - def.answer) <= def.answer * 0.2).length;
    }
    return out;
  }
  function simVote(def) {
    if (def.type === 'choice') {                    // 約一半選正解，其餘平均分散
      if (Math.random() < 0.48) return def.answer;
      const others = def.options.map((_, i) => i).filter(i => i !== def.answer);
      return others[Math.floor(Math.random() * others.length)];
    }
    const g = Math.round(def.answer * Math.exp((Math.random() + Math.random() - 1) * 0.9));
    return Math.min(def.max, Math.max(def.min, g));
  }
  function simStart(id) {
    const def = CFG.polls[id];
    if (sims[id]) return render(id);
    sims[id] = { votes: [], timer: null };
    sims[id].timer = setInterval(() => {
      const s = sims[id];
      for (let k = 0; k < 1 + Math.floor(Math.random() * 4) && s.votes.length < SIM; k++) s.votes.push(simVote(def));
      results[id] = simResults(id, results[id] && results[id].phase === 'revealed' ? 'revealed' : 'open');
      render(id);
      if (s.votes.length >= SIM) clearInterval(s.timer);
    }, 220);
  }
  function simReset(id) {
    if (sims[id]) clearInterval(sims[id].timer);
    delete sims[id]; delete results[id];
    clearAnswer(id); simStart(id);
  }

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
  // 控制請求排隊依序送出，快速換頁時「開題」不會晚於「離開」抵達後端
  let ctlChain = Promise.resolve();
  const control = body => (ctlChain = ctlChain.catch(() => {}).then(() => api('/api/control', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + CFG.key },
    body: JSON.stringify(body),
  })));

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

  async function enterPoll(id, seq) {
    current = id;
    if (SIM) return simStart(id);
    try {
      const res = await api('/api/results?poll=' + id);
      results[id] = res;
      if (seq !== navSeq) return;                         // 等待期間已換頁：不要再開這題
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
    if (SIM) return;
    try { const r = await control({ poll: id, phase: 'revealed' }); results[id] = r.results; render(id); }
    catch (e) { setNet(false, '揭曉沒送到手機（網路）'); }
  }

  async function resetPoll(id) {
    if (SIM) return simReset(id);
    clearAnswer(id);
    try { const r = await control({ poll: id, phase: 'open', reset: true }); results[id] = r.results; render(id); }
    catch (e) { setNet(false, '清空失敗（網路）'); }
  }

  function onShow(sec) {
    const id = sec && sec.dataset.poll, seq = ++navSeq;
    if (id) return enterPoll(id, seq);
    if (current) { current = null; if (!SIM) control({ poll: null }).catch(() => {}); }
  }

  // capture 階段攔截，避免和 reveal.js 內建鍵衝突；只在投票頁生效
  document.addEventListener('keydown', e => {
    if (!current || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.key === 'a' || e.key === 'A') && !e.shiftKey) { e.preventDefault(); reveal(current); }
    if (e.key === 'R' && e.shiftKey) { e.preventDefault(); resetPoll(current); }
  }, true);

  function start() {
    if (SIM) { setNet(true); $$('.lp-phones').forEach(el => { el.textContent = SIM; }); }
    else if ($$('section[data-poll], .lp-joinslide').length) connect();
    Reveal.on('slidechanged', e => onShow(e.currentSlide));
    onShow(Reveal.getCurrentSlide());
  }
  if (Reveal.isReady()) start(); else Reveal.on('ready', start);
})();
