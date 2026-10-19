// 觀眾手機頁：等講者開題 → 作答（可改選）→ 揭曉後顯示答案。題目定義不含答案。
const PUBLIC_KEYS = ["type", "kicker", "title", "stem", "options", "min", "max", "unit"];

function publicPolls(polls) {
  return Object.fromEntries(Object.entries(polls.polls).map(([id, p]) =>
    [id, Object.fromEntries(PUBLIC_KEYS.filter(k => k in p).map(k => [k, p[k]]))]));
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function phonePage(polls) {
  const defs = JSON.stringify(publicPolls(polls)).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0E1F3B">
<title>${esc(polls.event || "現場互動")}</title>
<style>
:root{--paper:#F6F1E6;--card:#FFFDF8;--navy:#0E1F3B;--ink:#232B3A;--muted:#6E6A62;--rule:#DDD5C6;
  --red:#E5482B;--green:#2E7D50}
*{box-sizing:border-box}
html,body{margin:0;background:var(--paper);color:var(--ink);
  font:17px/1.55 -apple-system,"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif}
header{background:var(--navy);color:#fff;padding:14px 16px 12px;position:sticky;top:0;z-index:2}
header b{display:block;font-size:15px;letter-spacing:.04em;opacity:.8}
header span{font-size:13px;opacity:.7}
main{padding:18px 16px 40px;max-width:560px;margin:0 auto}
.kicker{color:var(--red);font-weight:700;font-size:15px}
h1{font-size:22px;line-height:1.35;margin:4px 0 10px;color:var(--navy)}
.stem{background:var(--card);border:1px solid var(--rule);border-radius:12px;padding:14px;margin:0 0 16px}
.opt{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:left;margin:0 0 10px;
  padding:14px;border:2px solid var(--rule);border-radius:12px;background:var(--card);color:var(--ink);
  font:inherit;cursor:pointer}
.opt i{flex:none;width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;
  font-style:normal;font-weight:700;display:grid;place-items:center}
.opt.sel{border-color:var(--navy);background:#E9EEF6}
.opt.ok{border-color:var(--green);background:#E6F2EA}
.opt.ok i{background:var(--green)}
.opt[disabled]{cursor:default}
.num{display:flex;gap:8px}
.num input{flex:1;min-width:0;font:inherit;font-size:22px;padding:12px;border:2px solid var(--rule);
  border-radius:12px;background:var(--card)}
.num button,.send{font:inherit;font-weight:700;padding:12px 18px;border:0;border-radius:12px;
  background:var(--navy);color:#fff}
.msg{margin:14px 0 0;color:var(--muted);font-size:15px;min-height:1.5em}
.msg.err{color:var(--red)}
.reveal{margin-top:16px;padding:14px;border-radius:12px;background:var(--navy);color:#fff}
.reveal b{color:#FFB199}
.wait{text-align:center;padding:60px 10px;color:var(--muted)}
.wait .dot{width:12px;height:12px;border-radius:50%;background:var(--red);margin:0 auto 16px;
  animation:p 1.4s infinite}
@keyframes p{50%{opacity:.25;transform:scale(.7)}}
.note{font-size:13px;color:var(--muted);margin-top:28px}
</style></head><body>
<header><b>${esc(polls.event || "現場互動")}</b><span id="conn">連線中…</span></header>
<main id="app"><div class="wait"><div class="dot"></div>連線中…</div></main>
<script>
const POLLS = ${defs};
const app = document.getElementById("app"), conn = document.getElementById("conn");
const L = "ABCDEFG";
let voter = null;
try { voter = localStorage.getItem("voter"); } catch (e) {}
if (!voter) {
  voter = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());
  try { localStorage.setItem("voter", voter); } catch (e) {}
}
const mine = {};
try { Object.assign(mine, JSON.parse(sessionStorage.getItem("mine") || "{}")); } catch (e) {}
const save = () => { try { sessionStorage.setItem("mine", JSON.stringify(mine)); } catch (e) {} };
let state = { active: null, phase: "closed" }, shown = "";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function render() {
  const key = state.active + "|" + state.phase;
  if (key === shown) return;
  shown = key;
  const p = POLLS[state.active];
  if (!p || state.phase === "closed" && mine[state.active] === undefined) {
    app.innerHTML = '<div class="wait"><div class="dot"></div>等講者開下一題<br>畫面會自動更新</div>' +
      '<p class="note">匿名作答，不收集任何個人資料。</p>';
    return;
  }
  const open = state.phase === "open", rv = state.reveal;
  let h = '<div class="kicker">' + esc(p.kicker) + '</div><h1>' + esc(p.title) + '</h1>' +
          '<div class="stem">' + esc(p.stem) + '</div>';
  if (p.type === "choice") {
    h += p.options.map((o, i) => '<button class="opt' + (mine[state.active] === i ? " sel" : "") +
      (rv && rv.answer === i ? " ok" : "") + '" data-i="' + i + '"' + (open ? "" : " disabled") +
      '><i>' + L[i] + '</i><span>' + esc(o) + '</span></button>').join("");
  } else {
    const v = mine[state.active];
    h += '<div class="num"><input id="n" type="number" inputmode="numeric" min="' + p.min + '" max="' + p.max +
      '" placeholder="輸入數字" value="' + (v === undefined ? "" : v) + '"' + (open ? "" : " disabled") + '>' +
      (open ? '<button id="go">送出</button>' : "") + '</div>';
  }
  h += '<p class="msg" id="msg">' + (open ? (mine[state.active] === undefined ? "" : "已送出，揭曉前可以改答案") :
        rv ? "" : "作答已截止") + '</p>';
  if (rv) {
    const ans = p.type === "choice" ? L[rv.answer] + "　" + esc(p.options[rv.answer]) : rv.answer + " " + esc(p.unit || "");
    h += '<div class="reveal"><b>答案：' + ans + '</b><br>' + esc(rv.explain) + '</div>';
  }
  app.innerHTML = h;
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => send(Number(b.dataset.i)));
  const go = document.getElementById("go");
  if (go) {
    const n = document.getElementById("n");
    go.onclick = () => send(n.value);
    n.onkeydown = e => { if (e.key === "Enter") send(n.value); };
  }
}

async function send(value) {
  const poll = state.active, p = POLLS[poll], msg = document.getElementById("msg");
  if (p.type === "number") {
    const v = Math.round(Number(value));
    if (value === "" || !Number.isFinite(v) || v < p.min || v > p.max) {
      msg.className = "msg err"; msg.textContent = "請輸入 " + p.min + "–" + p.max + " 的數字"; return;
    }
    value = v;
  }
  msg.className = "msg"; msg.textContent = "送出中…";
  try {
    const r = await fetch("/api/vote", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ poll, voter, value }) });
    if (r.status === 409) { msg.className = "msg err"; msg.textContent = "這題已經截止"; return; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    mine[poll] = value; save(); shown = ""; render();
  } catch (e) {
    msg.className = "msg err"; msg.textContent = "沒送出去，請再按一次（" + e.message + "）";
  }
}

function apply(s) { if (s && s.type === "state") { state = s; render(); } }

let ws = null, retry = 0, pollTimer = null, retryTimer = null;
function connect() {
  clearTimeout(retryTimer); retryTimer = null;       // 回到前景時先取消排定的重連，避免開兩條 socket
  if (ws && ws.readyState < 2) return;               // 已在連線中或已連上
  let sock;
  try {
    sock = ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws?role=phone");
  } catch (e) { return fallback(); }
  sock.onopen = () => { retry = 0; conn.textContent = "已連線"; clearInterval(pollTimer); pollTimer = null; };
  sock.onmessage = e => { if (e.data !== "pong") apply(JSON.parse(e.data)); };
  sock.onclose = () => {
    if (ws !== sock) return;                         // 舊 socket 晚到的 close
    conn.textContent = "重新連線中…";
    fallback();
    retryTimer = setTimeout(connect, Math.min(15000, 1000 * 2 ** retry++));
  };
}
function fallback() {
  if (pollTimer) return;
  const tick = async () => {
    try { const r = await fetch("/api/state", { cache: "no-store" }); apply(await r.json()); } catch (e) {}
  };
  tick(); pollTimer = setInterval(tick, 4000);
}
setInterval(() => { if (ws && ws.readyState === 1) ws.send("ping"); }, 25000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && (!ws || ws.readyState > 1)) connect();
});
connect();
</script></body></html>`;
}
