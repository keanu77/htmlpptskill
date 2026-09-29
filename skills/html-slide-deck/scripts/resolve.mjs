// 共用：依序從執行目錄、其上層目錄、npm 全域目錄解析套件（playwright / pptxgenjs）。
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const SKILL_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export function tryRequire(name) { try { return requirePkg(name, true); } catch { return null; } }

export function requirePkg(name, soft = false) {
  const tried = [];
  if (existsSync(join(SKILL_ROOT, 'node_modules', name))) return createRequire(join(SKILL_ROOT, '/'))(name);
  let dir = process.cwd();
  while (true) {
    if (existsSync(join(dir, 'node_modules', name))) return createRequire(join(dir, '/'))(name);
    tried.push(dir);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    if (existsSync(join(g, name))) return createRequire(g + '/')(name);
    tried.push(g);
  } catch { /* npm 不存在時略過 */ }
  if (soft) throw new Error('missing ' + name);
  console.error(`找不到套件 ${name}。已找過：\n  ${tried.join('\n  ')}\n請在專案根目錄 npm i -D ${name}，或 npm i -g ${name}。`);
  process.exit(2);
}
