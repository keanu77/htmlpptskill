// 現場互動投票：手機作答、投影片即時顯示。
// 一場演講一個 Durable Object（SQLite），WebSocket 用 hibernation API 推播。
// 題目在 polls.json；講者控制用 ADMIN_KEY（wrangler secret put ADMIN_KEY）。
import { DurableObject } from "cloudflare:workers";
import POLLS from "./polls.json";
import { phonePage } from "./phone.js";

const DEFAULT_ROOM = "default";   // 同一個 Worker 要給不同場次用，設 vars.ROOM_NAME
const PHASES = ["closed", "open", "revealed"];
const MAX_BODY = 2048;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*",
               "cache-control": "no-store" },
  });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: {
        "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST",
        "access-control-allow-headers": "content-type,authorization" } });
    }
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(phonePage(POLLS), { headers: {
        "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
    if (url.pathname === "/ws" || url.pathname.startsWith("/api/")) {
      const room = env.ROOM.get(env.ROOM.idFromName(env.ROOM_NAME || DEFAULT_ROOM));
      return room.fetch(req);
    }
    return new Response("Not found", { status: 404 });
  },
};

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS votes(
      poll TEXT NOT NULL, voter TEXT NOT NULL, value TEXT NOT NULL, ts INTEGER NOT NULL,
      PRIMARY KEY (poll, voter))`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS phase(poll TEXT PRIMARY KEY, phase TEXT NOT NULL)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY, v TEXT)`);
  }

  // ---------------------------------------------------------------- 狀態
  active() {
    const row = this.sql.exec(`SELECT v FROM kv WHERE k = 'active'`).toArray()[0];
    return row && POLLS.polls[row.v] ? row.v : null;
  }

  phaseOf(poll) {
    const row = this.sql.exec(`SELECT phase FROM phase WHERE poll = ?`, poll).toArray()[0];
    return row ? row.phase : "closed";
  }

  state() {
    const active = this.active();
    const phase = active ? this.phaseOf(active) : "closed";
    const def = active && POLLS.polls[active];
    // 答案只在揭曉後才送到手機，手機頁本身不帶答案
    const reveal = phase === "revealed" ? { answer: def.answer, explain: def.explain } : null;
    return { type: "state", active, phase, reveal, phones: this.ctx.getWebSockets("phone").length };
  }

  results(poll) {
    const def = POLLS.polls[poll];
    const rows = this.sql.exec(`SELECT value FROM votes WHERE poll = ?`, poll).toArray();
    const out = { type: "results", poll, phase: this.phaseOf(poll), total: rows.length };
    if (def.type === "choice") {
      out.counts = def.options.map(() => 0);
      for (const r of rows) out.counts[Number(r.value)] += 1;
    } else {
      const vals = rows.map(r => Number(r.value)).sort((a, b) => a - b);
      out.counts = def.bins.map(([lo, hi]) => vals.filter(v => v >= lo && v <= hi).length);
      out.median = vals.length ? vals[Math.floor((vals.length - 1) / 2)] : null;
      const tol = def.answer * 0.2;
      out.close = vals.filter(v => Math.abs(v - def.answer) <= tol).length;
    }
    return out;
  }

  broadcast(tag, msg) {
    const s = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets(tag)) {
      try { ws.send(s); } catch { /* 斷線的 socket 由 webSocketClose 收尾 */ }
    }
  }

  pushAll(poll) {
    const st = this.state();
    this.broadcast("phone", st);
    this.broadcast("screen", st);
    if (poll) this.broadcast("screen", this.results(poll));
  }

  // ---------------------------------------------------------------- HTTP
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") return this.upgrade(req, url);
    try {
      if (url.pathname === "/api/state" && req.method === "GET") return json(this.state());
      if (url.pathname === "/api/results" && req.method === "GET") {
        const poll = url.searchParams.get("poll");
        if (!POLLS.polls[poll]) return json({ error: "unknown poll" }, 404);
        return json(this.results(poll));
      }
      if (url.pathname === "/api/vote" && req.method === "POST") return this.vote(await this.body(req));
      if (url.pathname === "/api/control" && req.method === "POST") {
        if (!this.authorized(req)) return json({ error: "unauthorized" }, 401);
        return this.control(await this.body(req));
      }
      return json({ error: "not found" }, 404);
    } catch (err) {
      console.error("room error", url.pathname, err && err.stack || err);
      return json({ error: err.message || "bad request" }, err.status || 500);
    }
  }

  async body(req) {
    const text = await req.text();
    if (text.length > MAX_BODY) throw Object.assign(new Error("body too large"), { status: 413 });
    try { return JSON.parse(text || "{}"); }
    catch { throw Object.assign(new Error("invalid json"), { status: 400 }); }
  }

  authorized(req) {
    const key = this.env.ADMIN_KEY;
    return Boolean(key) && req.headers.get("authorization") === `Bearer ${key}`;
  }

  vote({ poll, voter, value }) {
    const def = POLLS.polls[poll];
    if (!def) return json({ error: "unknown poll" }, 404);
    if (typeof voter !== "string" || !/^[a-z0-9-]{8,64}$/i.test(voter)) return json({ error: "bad voter" }, 400);
    if (this.active() !== poll || this.phaseOf(poll) !== "open") return json({ error: "closed" }, 409);
    let v;
    if (def.type === "choice") {
      v = Number(value);
      if (!Number.isInteger(v) || v < 0 || v >= def.options.length) return json({ error: "bad option" }, 400);
    } else {
      v = Math.round(Number(value));
      if (!Number.isFinite(v) || v < def.min || v > def.max) return json({ error: "out of range" }, 400);
    }
    this.sql.exec(`INSERT INTO votes(poll, voter, value, ts) VALUES (?, ?, ?, ?)
                   ON CONFLICT(poll, voter) DO UPDATE SET value = excluded.value, ts = excluded.ts`,
                  poll, voter, String(v), Date.now());
    this.broadcast("screen", this.results(poll));
    return json({ ok: true });
  }

  control({ poll, phase, reset }) {
    if (poll !== null && !POLLS.polls[poll]) return json({ error: "unknown poll" }, 404);
    if (phase !== undefined && !PHASES.includes(phase)) return json({ error: "bad phase" }, 400);
    if (poll && reset) this.sql.exec(`DELETE FROM votes WHERE poll = ?`, poll);
    this.sql.exec(`INSERT INTO kv(k, v) VALUES ('active', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v`,
                  poll || "");
    if (poll && phase) {
      this.sql.exec(`INSERT INTO phase(poll, phase) VALUES (?, ?)
                     ON CONFLICT(poll) DO UPDATE SET phase = excluded.phase`, poll, phase);
    }
    this.pushAll(poll);
    return json({ ok: true, ...this.state(), results: poll ? this.results(poll) : null });
  }

  // ---------------------------------------------------------------- WebSocket
  upgrade(req, url) {
    if (req.headers.get("upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
    const role = url.searchParams.get("role") === "screen" ? "screen" : "phone";
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], [role]);
    pair[1].send(JSON.stringify(this.state()));
    const active = this.active();
    if (role === "screen" && active) pair[1].send(JSON.stringify(this.results(active)));
    if (role === "phone") this.broadcast("screen", this.state());
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  webSocketMessage(ws, msg) {
    if (msg === "ping") ws.send("pong");
  }

  webSocketClose(ws, code) {
    try { ws.close(code, "bye"); } catch { /* 已關閉 */ }
    this.broadcast("screen", this.state());
  }

  webSocketError() {
    this.broadcast("screen", this.state());
  }
}
