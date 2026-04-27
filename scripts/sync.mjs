// Syncthing durumu kontrolü. Local API'den okur.
// Kullanım: node scripts/sync.mjs <status>

import { execSync } from 'node:child_process';
import { HOSTNAME } from './lib/platform.mjs';
import { header, ok, info, warn, err } from './lib/log.mjs';

const action = process.argv[2] || 'status';
header(`sync:${action} — ${HOSTNAME}`);

// 1) Process check
let running = false;
try {
  if (process.platform === 'win32') {
    const out = execSync('tasklist /FI "IMAGENAME eq syncthing.exe" /FO CSV /NH 2>NUL',
      { encoding: 'utf8' });
    running = out.toLowerCase().includes('syncthing.exe');
  } else {
    execSync('pgrep -x syncthing', { stdio: 'ignore' });
    running = true;
  }
} catch { running = false; }

if (running) ok('syncthing process: çalışıyor');
else        warn('syncthing process: çalışmıyor');

// 2) HTTP UI check (default port 8384)
try {
  const r = await fetch('http://127.0.0.1:8384/rest/noauth/health',
    { signal: AbortSignal.timeout(2000) });
  if (r.ok) {
    ok('UI/API: 8384 erişilebilir');
  } else {
    warn(`UI/API: HTTP ${r.status}`);
  }
} catch (e) {
  warn('UI/API: 8384 cevap vermiyor (' + e.message.split('\n')[0] + ')');
  info('Syncthing kurulu değilse: Aşama 4 (PLAN.md) ile kur.');
}
