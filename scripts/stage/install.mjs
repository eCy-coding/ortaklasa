// Aşama bazlı installer — kullanıcı tarafından ÇAĞRILIR (otomatik değil).
// Kullanım: node scripts/stage/install.mjs <stage-name>
//
// stage-name: tailscale | syncthing | node | docker | openssh | gh
//
// Bu script winget/brew komutunu yazdırır VE çalıştırır. winget kendi
// onay penceresini açar (kullanıcı onayı her zaman var). Otomatik
// SafeToAutoRun=true ile asla çağrılmamalı.

import { execSync, spawnSync } from 'node:child_process';
import { IS_WIN, IS_MAC, HOSTNAME } from '../lib/platform.mjs';
import { header, ok, info, err, warn, bail } from '../lib/log.mjs';

const STAGE_MAP = {
  tailscale: {
    win: { mgr: 'winget', args: ['install', '--id', 'tailscale.tailscale',
                                  '--scope', 'user', '--accept-source-agreements'] },
    mac: { mgr: 'brew',   args: ['install', '--cask', 'tailscale'] },
    note: 'Login: Tailscale tray app → menüden "Log in".',
  },
  syncthing: {
    win: { mgr: 'winget', args: ['install', '--id', 'Syncthing.Syncthing',
                                  '--scope', 'user', '--accept-source-agreements'] },
    mac: { mgr: 'brew',   args: ['install', 'syncthing'] },
    note: 'UI: http://localhost:8384',
  },
  node: {
    win: { mgr: 'winget', args: ['install', '--id', 'OpenJS.NodeJS.LTS',
                                  '--scope', 'user', '--accept-source-agreements'] },
    mac: { mgr: 'brew',   args: ['install', 'node'] },
    note: 'Sonra: npm install && npm run doctor',
  },
  docker: {
    win: { mgr: 'winget', args: ['install', '--id', 'Docker.DockerDesktop',
                                  '--accept-source-agreements'] },
    mac: { mgr: 'brew',   args: ['install', '--cask', 'docker'] },
    note: 'Win: yönetici + WSL2 + restart gerekir. Aşama 5.',
    requiresAdmin: true,
  },
  openssh: {
    win: null, // Windows capability — ayrı script
    mac: null, // Mac'te macOS ile gelir
    note: 'Win: yönetici PS\'de  scripts\\win\\install-openssh.ps1  çalıştır.\n' +
          'Mac: zaten yüklü.',
    requiresAdmin: true,
  },
  gh: {
    win: { mgr: 'winget', args: ['install', '--id', 'GitHub.cli',
                                  '--scope', 'user', '--accept-source-agreements'] },
    mac: { mgr: 'brew',   args: ['install', 'gh'] },
    note: 'Sonra: gh auth login',
  },
};

const stage = process.argv[2];
if (!stage || !STAGE_MAP[stage]) {
  bail(`Kullanım: node scripts/stage/install.mjs <${Object.keys(STAGE_MAP).join('|')}>`, 64);
}

header(`stage:install ${stage} — ${HOSTNAME}`);

const cfg = STAGE_MAP[stage];
const platCfg = IS_WIN ? cfg.win : IS_MAC ? cfg.mac : null;

if (cfg.requiresAdmin) {
  warn('Bu adım yönetici/admin yetkisi gerektirir.');
}

if (!platCfg) {
  if (cfg.note) info(cfg.note);
  process.exit(0);
}

info(`Komut: ${platCfg.mgr} ${platCfg.args.join(' ')}`);
info('(Devam etmek istemiyorsan Ctrl+C basabilirsin)');

// Komutun mevcudiyetini kontrol et
try {
  execSync(`${platCfg.mgr} --version`, { stdio: 'ignore' });
} catch {
  err(`${platCfg.mgr} bulunamadı. Önce paket yöneticisini kur.`);
  if (IS_MAC) info('Homebrew: https://brew.sh');
  process.exit(2);
}

// Komutu çalıştır (winget/brew kendi onay UI'sini gösterir)
const r = spawnSync(platCfg.mgr, platCfg.args, { stdio: 'inherit' });
if (r.status !== 0) {
  err(`Kurulum başarısız (exit ${r.status}).`);
  process.exit(r.status ?? 1);
}

ok(`${stage} kurulumu tamam.`);
if (cfg.note) info(cfg.note);
