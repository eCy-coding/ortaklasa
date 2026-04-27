// Docker Compose wrapper — yalnızca Windows'ta (M1) çalışır.
// Kullanım: node scripts/db.mjs <up|down|status|logs>

import { execSync, spawnSync } from 'node:child_process';
import { requireTag, HOSTNAME } from './lib/platform.mjs';
import { header, ok, info, err, bail } from './lib/log.mjs';

const action = process.argv[2];
const valid = ['up', 'down', 'status', 'logs', 'restart'];
if (!valid.includes(action)) {
  bail(`Kullanım: node scripts/db.mjs <${valid.join('|')}>`, 64);
}

header(`db:${action} — ${HOSTNAME}`);
requireTag('docker', `db:${action}`);

// docker mevcut mu?
try {
  execSync('docker --version', { stdio: 'ignore' });
} catch {
  err('Docker kurulu değil. Aşama 5 (PLAN.md) ile kur.');
  process.exit(2);
}

const cmds = {
  up:      ['compose', 'up', '-d'],
  down:    ['compose', 'down'],
  restart: ['compose', 'restart'],
  status:  ['compose', 'ps'],
  logs:    ['compose', 'logs', '-f', '--tail=100'],
};

info(`docker ${cmds[action].join(' ')}`);
const r = spawnSync('docker', cmds[action], { stdio: 'inherit' });
if (r.status !== 0) {
  err(`docker compose ${action} başarısız (exit ${r.status})`);
  process.exit(r.status ?? 1);
}
ok(`db:${action} tamam.`);
