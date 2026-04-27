// Görev → Makine atama (master prompt §4 implementasyonu).
//
//   match(M,T)        : Makine M, görev T'yi karşılıyor mu?
//   score(M,T)        : Eşleşen makineler arasında öncelik skoru.
//   routable(T)       : T'yi karşılayan tüm makineler.
//   selectMachine(T)  : argmax score(M,T) — tek makine döndürür.
//   explainNoMatch(T) : Hiçbiri eşleşmezse, makine başına eksiklik raporu.
//
// Bağımlılıklar:
//   KNOWN_MACHINES      — platform.mjs içinden, makine yetenek matrisi.
//   isOnline / load     — şimdilik stub; Stage 2/8 sonrası gerçekleştirilecek.

import { KNOWN_MACHINES, HOSTNAME } from './platform.mjs';

// Stub — Stage 2 sonrası: `tailscale status --json` parse edilir.
function isOnline(_machine) { return true; }

// Stub — ileride: makine başı aktif görev sayısı.
function load(_machine) { return 0; }

// === Çekirdek matematik ===

export function match(machine, task) {
  const tags = new Set(machine.tags || []);
  for (const t of (task.requiredTags || [])) {
    if (!tags.has(t)) return false;
  }
  if (typeof task.minCores === 'number' &&
      (machine.cores ?? -Infinity) < task.minCores) return false;
  if (typeof task.minRamGb === 'number' &&
      (machine.ramGb ?? -Infinity) < task.minRamGb) return false;
  if (task.needsGpu && !machine.hasGpu) return false;
  if (task.needsRoot && machine.role !== 'server') return false;
  if (!isOnline(machine)) return false;
  return true;
}

export function score(machine, task) {
  let s = 0;
  const hints = task.hints || [];
  if (machine.role === 'server' && hints.includes('preferred')) s += 100;
  if (machine.hasGpu && task.needsGpu) s += 50;
  if (typeof task.minRamGb === 'number' &&
      (machine.ramGb ?? 0) > 2 * task.minRamGb) s += 25;
  s -= 10 * load(machine);
  return s;
}

export function routable(task) {
  return Object.entries(KNOWN_MACHINES)
    .map(([host, m]) => ({ host, ...m }))
    .filter(m => match(m, task));
}

export function selectMachine(task) {
  const candidates = routable(task);
  if (!candidates.length) {
    throw new Error(
      `[dispatch] Görev için uygun makine yok.\n` +
      `Görev: ${JSON.stringify(task, null, 2)}\n` +
      `Sebep:${explainNoMatch(task)}`
    );
  }
  return candidates.sort((a, b) => score(b, task) - score(a, task))[0];
}

export function explainNoMatch(task) {
  const parts = [];
  for (const [host, m] of Object.entries(KNOWN_MACHINES)) {
    const machine = { host, ...m };
    const why = [];
    const tags = new Set(machine.tags || []);
    for (const t of (task.requiredTags || [])) {
      if (!tags.has(t)) why.push(`tag '${t}' yok`);
    }
    if (typeof task.minCores === 'number' &&
        (machine.cores ?? 0) < task.minCores)
      why.push(`cores ${machine.cores ?? '?'} < ${task.minCores}`);
    if (typeof task.minRamGb === 'number' &&
        (machine.ramGb ?? 0) < task.minRamGb)
      why.push(`ram ${machine.ramGb ?? '?'}GB < ${task.minRamGb}GB`);
    if (task.needsGpu && !machine.hasGpu) why.push('GPU yok');
    if (task.needsRoot && machine.role !== 'server') why.push('server değil');
    if (!isOnline(machine)) why.push('offline');
    parts.push(`  • ${host}: ${why.join(', ') || '(eşleşiyor — bug?)'}`);
  }
  return '\n' + parts.join('\n');
}

export function isCurrentMachine(machine) {
  return (machine.host || machine.hostname) === HOSTNAME;
}

// === CLI: örnek görevle dispatch dene ===
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const examples = [
    { name: 'train-llm',  requiredTags: ['gpu'],    minCores: 4, minRamGb: 8,
      needsGpu: true, hints: ['preferred'] },
    { name: 'lint',       requiredTags: [],         minCores: 1, minRamGb: 1 },
    { name: 'ios-build',  requiredTags: ['ios'],    minCores: 2, minRamGb: 4 },
    { name: 'docker-up',  requiredTags: ['docker'], minCores: 2, minRamGb: 4 },
  ];
  for (const t of examples) {
    process.stdout.write(`[${t.name.padEnd(12)}] `);
    try {
      const m = selectMachine(t);
      console.log(`→ ${m.host}  (score=${score(m, t)})`);
    } catch (e) {
      console.log(`✗ ${e.message.split('\n')[0]}`);
    }
  }
}
