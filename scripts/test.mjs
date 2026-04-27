// Uçtan uca smoke test (Aşama 8). Master prompt §10 ile eşleşir.
//
// Kullanım:
//   node scripts/test.mjs all       # tümünü sırayla çalıştır
//   node scripts/test.mjs t1        # tek test
//   node scripts/test.mjs t1 t3 t6  # birden fazla
//
// Çıkış kodu: başarısız test sayısı.

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { IS_WIN, IS_MAC, HOSTNAME, hasTag } from './lib/platform.mjs';
import { loadEnv } from './lib/env.mjs';
import { header, ok, info, warn, err, step } from './lib/log.mjs';

const env = loadEnv({ optional: true });

function cmd(c, opts = {}) {
  return execSync(c, { encoding: 'utf8', stdio: ['ignore','pipe','pipe'], ...opts }).trim();
}

// === Test'ler ===

async function t1_doctor() {
  // Doctor çıkış kodları:
  //   0 = tüm araçlar tamam     → ✓
  //   1 = opsiyonel eksik       → ⚠ tolere
  //   2 = kritik eksik          → ✗ fail
  try {
    cmd('node scripts/doctor.mjs');
    ok('T1 doctor: tüm araçlar ✓');
    return true;
  } catch (e) {
    const code = e.status ?? -1;
    if (code === 1) {
      warn('T1 doctor: opsiyonel araç eksik (tolere edildi)');
      return true;
    }
    err(`T1 doctor: exit ${code} — kritik araç eksik`);
    return false;
  }
}

async function t2_ssh() {
  // Mac → Win SSH (sadece Mac'te anlamlı)
  if (!hasTag('mac')) {
    warn("T2 ssh: Mac değilim, atlandı (yalnızca Mac'ten test edilir)");
    return true;
  }
  const host = env.WINDOWS_HOST;
  const user = env.SSH_USER;
  if (!host || !user) {
    err('T2 ssh: WINDOWS_HOST veya SSH_USER .env\'de yok');
    return false;
  }
  try {
    const out = cmd(`ssh -o BatchMode=yes -o ConnectTimeout=5 ${user}@${host} hostname`);
    ok(`T2 ssh: ${out}`);
    return true;
  } catch (e) {
    err('T2 ssh: bağlantı kurulamadı —', e.message.split('\n')[0]);
    return false;
  }
}

async function t3_postgres() {
  // psql ile select 1
  const host = env.PG_HOST, port = env.PG_PORT || 5432;
  const user = env.PG_USER, db = env.PG_DB;
  if (!host || !user || !db) {
    warn('T3 postgres: PG_* .env\'de eksik, atlandı');
    return true;
  }
  try {
    cmd(`psql -h ${host} -p ${port} -U ${user} -d ${db} -c "select 1;" -tA`);
    ok('T3 postgres: bağlantı + select 1 OK');
    return true;
  } catch (e) {
    err('T3 postgres: hata —', e.message.split('\n')[0]);
    return false;
  }
}

async function t4_syncthing() {
  // shared/ klasörü Syncthing tarafından senkronlanmalı
  if (!existsSync('shared')) {
    warn('T4 syncthing: shared/ klasörü yok — Aşama 4 yapılmamış');
    return true;
  }
  try {
    const r = await fetch('http://127.0.0.1:8384/rest/noauth/health',
      { signal: AbortSignal.timeout(2000) });
    if (r.ok) { ok('T4 syncthing: API erişilebilir'); return true; }
    err('T4 syncthing: HTTP ' + r.status); return false;
  } catch {
    err('T4 syncthing: API\'ye erişilemiyor (port 8384)');
    return false;
  }
}

async function t5_gpu_remote() {
  // Mac'ten Win'e SSH üzerinden npm run heavy:gpu
  if (!hasTag('mac')) {
    warn('T5 gpu-remote: yalnızca Mac\'ten anlamlı, atlandı');
    return true;
  }
  const host = env.WINDOWS_HOST, user = env.SSH_USER;
  if (!host || !user) { warn('T5: env eksik'); return true; }
  try {
    const out = cmd(
      `ssh ${user}@${host} "cd ortaklasa && npm run heavy:gpu --silent"`,
      { timeout: 30000 });
    ok('T5 gpu-remote: çalıştı');
    info(out.split('\n').slice(-3).join('\n'));
    return true;
  } catch (e) {
    err('T5 gpu-remote: hata —', e.message.split('\n')[0]);
    return false;
  }
}

async function t6_guard() {
  // Yanlış makinede tag-guard exit 2 vermeli
  if (hasTag('gpu')) {
    warn('T6 guard: bu makinede gpu tag\'i VAR, koruma testi yapılamaz');
    return true;
  }
  try {
    cmd('node scripts/heavy-gpu.mjs');
    err('T6 guard: koruma çalışmadı — exit 0 döndü, beklenen 2');
    return false;
  } catch (e) {
    if (e.status === 2) { ok('T6 guard: koruma exit 2 ✓'); return true; }
    err(`T6 guard: beklenmeyen exit ${e.status}`);
    return false;
  }
}

async function t7_git() {
  // Repo temiz, remote senkron mu?
  try {
    const status = cmd('git status --porcelain');
    if (status) {
      warn('T7 git: working tree kirli (uncommitted değişiklik var)');
      return true;
    }
    const remote = cmd('git remote -v');
    if (!remote) {
      warn('T7 git: remote yok (Aşama 1 push yapılmamış)');
      return true;
    }
    cmd('git fetch --dry-run', { stdio: 'ignore' });
    ok('T7 git: working tree temiz + remote erişilebilir');
    return true;
  } catch (e) {
    err('T7 git: hata —', e.message.split('\n')[0]);
    return false;
  }
}

const TESTS = {
  t1: t1_doctor,
  t2: t2_ssh,
  t3: t3_postgres,
  t4: t4_syncthing,
  t5: t5_gpu_remote,
  t6: t6_guard,
  t7: t7_git,
};

// === Orchestrator ===

const args = process.argv.slice(2);
const which = args.length === 0 || args[0] === 'all' ? Object.keys(TESTS) : args;

header(`smoke test — ${HOSTNAME}`);

let pass = 0, fail = 0, total = which.length;
for (let i = 0; i < which.length; i++) {
  const name = which[i];
  const fn = TESTS[name];
  if (!fn) { err(`Bilinmeyen test: ${name}`); fail++; continue; }
  step(i + 1, total, name);
  const r = await fn();
  r ? pass++ : fail++;
}

console.log('');
if (fail === 0) ok(`${pass}/${total} test başarılı.`);
else            err(`${pass}/${total} başarılı, ${fail} başarısız.`);
process.exit(fail);
