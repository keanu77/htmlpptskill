// 共用：解析 playwright / pptxgenjs / jsqr 等套件。
// 順序：SKILL_PKG_ROOT 環境變數 → skill 目錄自帶 node_modules（只給 jsqr/pngjs 這類小套件）→ 執行目錄往上 → npm 全域。
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SKILL_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SKILL_LOCAL = new Set(['jsqr', 'pngjs']);  // 其他套件不從 skill 目錄取，避免撿到缺瀏覽器的舊版 playwright

function fromDir(dir, name) {
  return existsSync(join(dir, 'node_modules', name)) ? createRequire(join(dir, 'package.json'))(name) : null;
}

// 回傳套件所在目錄（給 inline-assets 讀 reveal.js 的檔案）
export function pkgDir(name) {
  const dirs = [process.env.SKILL_PKG_ROOT, SKILL_LOCAL.has(name) ? SKILL_ROOT : null].filter(Boolean);
  let d = process.cwd(); while (true) { dirs.push(d); const parent = dirname(d); if (parent === d) break; d = parent; }
  try { dirs.push(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().replace(/\/node_modules$/, '')); } catch { /* 沒有 npm */ }
  for (const dir of dirs) { const c = join(dir, 'node_modules', name); if (existsSync(c)) return c; }
  console.error(`找不到套件 ${name}；請 npm i ${name}（可設 SKILL_PKG_ROOT）。`); process.exit(2);
}

export function tryRequire(name) { try { return requirePkg(name, true); } catch { return null; } }

export function requirePkg(name, soft = false) {
  const tried = [];
  if (process.env.SKILL_PKG_ROOT) { const m = fromDir(process.env.SKILL_PKG_ROOT, name); if (m) return m; tried.push(process.env.SKILL_PKG_ROOT); }
  if (SKILL_LOCAL.has(name)) { const m = fromDir(SKILL_ROOT, name); if (m) return m; tried.push(SKILL_ROOT); }
  let dir = process.cwd();
  while (true) {
    const m = fromDir(dir, name); if (m) return m;
    tried.push(dir);
    const parent = dirname(dir); if (parent === dir) break; dir = parent;
  }
  try {
    const g = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (existsSync(join(g, name))) return createRequire(join(g, name, 'package.json'))(name);
    tried.push(g);
  } catch { /* 沒有 npm */ }
  if (soft) throw new Error('missing ' + name);
  console.error(`找不到套件 ${name}。已找過：\n  ${tried.join('\n  ')}\n請在專案根目錄 npm i -D ${name}，或 npm i -g ${name}，或設 SKILL_PKG_ROOT=<有 node_modules 的目錄>。`);
  process.exit(2);
}

// Playwright 共用：尊重 CHROMIUM_PATH（沒跑過 npx playwright install 時指到既有 Chromium）
export function launchOpts() { return process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}; }

// 把 file:// 路徑做成合法 URL（含空白、中文、Windows 磁碟機）
export async function fileUrl(p) { const { pathToFileURL } = await import('node:url'); const { resolve } = await import('node:path'); return pathToFileURL(resolve(p)).href; }

// 等 reveal.js 就緒（取代固定 sleep）
export async function waitReveal(page, extraMs = 300) {
  await page.waitForFunction(() => window.Reveal && Reveal.isReady && Reveal.isReady(), null, { timeout: 60000 });
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
  await page.waitForTimeout(extraMs);
}

// 逐張投影片（含垂直子頁）：回傳 [{h, v}]
export async function slideIndices(page) {
  return page.evaluate(() => Reveal.getSlides().map(s => { const { h, v } = Reveal.getIndices(s); return { h, v: v || 0 }; }));
}
