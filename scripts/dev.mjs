// Universal dev runner — her iki makinede de çalışır.
// "Hangi makinedeyim, ne yapabilirim?" özetini verir.

import { HOSTNAME, currentMachine, IS_WIN, IS_MAC, CPU_COUNT, TOTAL_MEM_GB }
  from './lib/platform.mjs';
import { header, ok, info } from './lib/log.mjs';

header(`ortaklasa dev — ${HOSTNAME}`);

const m = currentMachine();
info('platform :', IS_WIN ? 'Windows' : IS_MAC ? 'macOS' : 'Linux');
info('hostname :', HOSTNAME);
info('hardware :', `${CPU_COUNT} core / ${TOTAL_MEM_GB} GB`);
info('role     :', m.role);
info('tags     :', (m.tags || []).join(', ') || '(yok)');
if (m.note) info('note     :', m.note);

ok('Dev ortamı hazır. `npm run doctor` ile detaylı kontrol yapabilirsin.');
