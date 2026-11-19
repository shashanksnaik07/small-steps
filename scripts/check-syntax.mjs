// Syntax-checks every JavaScript file in src/, api/ and tests/. Used by CI.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
  });
}

let bad = 0;
for (const f of ['src', 'api', 'tests'].flatMap(walk)) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) { bad++; console.error(f + '\n' + r.stderr); }
}
if (bad) process.exit(1);
console.log('All files parse.');
