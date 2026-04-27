// GPU gerektiren ağır iş örneği. Yanlış makinede exit 2 ile durur.
// Şu an demo: nvidia-smi çağırır. Stage 5+ sonrası: gerçek iş (Ollama vs.)

import { execSync } from 'node:child_process';
import { HOSTNAME, requireTag, currentMachine } from './lib/platform.mjs';
import { header, ok, info, err } from './lib/log.mjs';

header(`heavy:gpu — ${HOSTNAME}`);
requireTag('gpu', 'heavy:gpu');

info('Bu makinede GPU mevcut. nvidia-smi çağrılıyor...');
try {
  const out = execSync('nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv',
    { encoding: 'utf8' });
  console.log(out);
  ok('GPU sağlıklı.');
} catch (e) {
  err('nvidia-smi çalıştırılamadı:', e.message.split('\n')[0]);
  err('NVIDIA driver kurulu mu? "nvidia-smi" PATH\'te mi?');
  process.exit(3);
}

info(`Detay: ${currentMachine().gpu ?? 'GPU adı bilinmiyor'}`);
