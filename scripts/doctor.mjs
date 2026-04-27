// Ortam kontrolü: hangi araçlar var, hangileri eksik.
// İki makine için ortak kontrol listesi; OS'a göre öneri verir.
//
// Kullanım: node scripts/doctor.mjs
// Çıkış kodu: 0 = her şey tamam, 1 = eksik var (uyarı), 2 = kritik eksik

import { execSync } from 'node:child_process';
import { IS_WIN, IS_MAC, HOSTNAME, currentMachine, TOTAL_MEM_GB, CPU_COUNT } from './lib/platform.mjs';

const checks = [
  { name: 'git',       cmd: 'git --version',        critical: true,  install: { win: 'winget install Git.Git', mac: 'brew install git' } },
  { name: 'node',      cmd: 'node --version',       critical: true,  install: { win: 'winget install OpenJS.NodeJS.LTS', mac: 'brew install node' } },
  { name: 'npm',       cmd: 'npm --version',        critical: true,  install: { win: '(node ile gelir)', mac: '(node ile gelir)' } },
  { name: 'ssh',       cmd: 'ssh -V',               critical: true,  install: { win: '(Windows 10+ ile gelir)', mac: '(macOS ile gelir)' } },
  { name: 'tailscale', cmd: 'tailscale version',    critical: false, install: { win: 'winget install tailscale.tailscale', mac: 'brew install --cask tailscale' } },
  { name: 'syncthing', cmd: 'syncthing --version',  critical: false, install: { win: 'winget install Syncthing.Syncthing', mac: 'brew install syncthing' } },
  { name: 'docker',    cmd: 'docker --version',     critical: false, install: { win: 'winget install Docker.DockerDesktop', mac: 'brew install --cask docker' } },
  { name: 'python',    cmd: IS_WIN ? 'python --version' : 'python3 --version', critical: false, install: { win: 'winget install Python.Python.3.11', mac: 'brew install python@3.11' } },
];

function run(cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split('\n')[0].trim();
  } catch {
    return null;
  }
}

console.log(`\n=== ortaklasa doctor — ${HOSTNAME} ===`);
console.log(`role: ${currentMachine().role}  |  tags: ${currentMachine().tags.join(', ')}`);
console.log(`hw  : ${CPU_COUNT} core / ${TOTAL_MEM_GB} GB RAM\n`);

let missing = 0;
let missingCritical = 0;

for (const c of checks) {
  const ver = run(c.cmd);
  if (ver) {
    console.log(`  ✓ ${c.name.padEnd(12)} ${ver}`);
  } else {
    const tag = c.critical ? '✗ KRİTİK' : '○ opsiyonel';
    console.log(`  ${tag.padEnd(12)} ${c.name.padEnd(12)} -- yok`);
    const hint = IS_WIN ? c.install.win : IS_MAC ? c.install.mac : '(linux: paket yöneticinizle kurun)';
    console.log(`               kurulum: ${hint}`);
    missing++;
    if (c.critical) missingCritical++;
  }
}

console.log('');
if (missingCritical > 0) {
  console.log(`✗ ${missingCritical} kritik araç eksik. PLAN.md → Aşama 6'ya bak.`);
  process.exit(2);
} else if (missing > 0) {
  console.log(`○ ${missing} opsiyonel araç eksik. İhtiyaç duydukça PLAN.md'deki ilgili aşamayı çalıştır.`);
  process.exit(1);
} else {
  console.log('✓ Her şey hazır.');
  process.exit(0);
}
