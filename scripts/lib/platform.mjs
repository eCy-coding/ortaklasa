// Cross-platform makine tespiti ve yetenek matrisi.
// Hangi script hangi makinede çalışmalı sorusunun tek kaynağı burası.

import os from 'node:os';
import { execSync } from 'node:child_process';

export const PLATFORM = process.platform; // 'win32' | 'darwin' | 'linux'
export const IS_WIN = PLATFORM === 'win32';
export const IS_MAC = PLATFORM === 'darwin';
export const IS_LINUX = PLATFORM === 'linux';

export const HOSTNAME = os.hostname();
export const ARCH = process.arch;
export const CPU_COUNT = os.cpus().length;
export const TOTAL_MEM_GB = Math.round(os.totalmem() / 1024 ** 3);

// Bilinen makineler — yeni makine eklenince buraya yaz.
export const KNOWN_MACHINES = {
  'DESKTOP-ERT7724': {
    role: 'server',
    tags: ['gpu', 'docker', 'heavy', 'win'],
    gpu: 'NVIDIA GeForce RTX 3060 Ti',
    note: 'Windows PC — sunucu rolü',
  },
  // Mac onboarding sonrası eklenecek:
  // 'macbook-baris': { role: 'client', tags: ['mac','ios','light'] },
};

export function currentMachine() {
  return KNOWN_MACHINES[HOSTNAME] ?? {
    role: 'unknown',
    tags: IS_WIN ? ['win'] : IS_MAC ? ['mac'] : ['linux'],
    note: `Bilinmeyen makine: ${HOSTNAME}. KNOWN_MACHINES'e ekle.`,
  };
}

export function hasTag(tag) {
  return currentMachine().tags.includes(tag);
}

export function requireTag(tag, taskName = 'bu görev') {
  if (!hasTag(tag)) {
    console.error(
      `\n[platform] ${taskName} '${tag}' tag'i gerektirir; ` +
      `'${HOSTNAME}' bu tag'e sahip değil.\n` +
      `Mevcut tag'ler: ${currentMachine().tags.join(', ') || '(yok)'}\n`
    );
    process.exit(2);
  }
}

export function detectGpu() {
  if (!IS_WIN) return null;
  try {
    const out = execSync('wmic path win32_VideoController get name', { encoding: 'utf8' });
    return out.split('\n').slice(1).map(s => s.trim()).filter(Boolean);
  } catch { return null; }
}

// CLI'dan doğrudan çağrıldığında özet yazdır.
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const m = currentMachine();
  console.log('hostname     :', HOSTNAME);
  console.log('platform     :', PLATFORM, ARCH);
  console.log('cpu / mem    :', `${CPU_COUNT} core / ${TOTAL_MEM_GB} GB`);
  console.log('role         :', m.role);
  console.log('tags         :', m.tags.join(', '));
  if (m.note) console.log('note         :', m.note);
}
