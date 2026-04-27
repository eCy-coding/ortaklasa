// iOS build — yalnızca Mac'te (M2). Bu projede şimdilik demo.
// Kullanım: node scripts/mobile-ios.mjs

import { execSync } from 'node:child_process';
import { HOSTNAME, requireTag } from './lib/platform.mjs';
import { header, ok, info, err } from './lib/log.mjs';

header(`mobile:ios — ${HOSTNAME}`);
requireTag('ios', 'mobile:ios');

// xcodebuild kurulu mu?
try {
  const v = execSync('xcodebuild -version', { encoding: 'utf8' });
  info('Xcode:', v.split('\n')[0]);
  ok('Mac iOS build ortamı hazır.');
  info('(Bu proje şu an demo — gerçek iOS hedefi eklendiğinde burası genişleyecek.)');
} catch {
  err('xcodebuild bulunamadı. Xcode App Store\'dan kur veya:');
  err('  xcode-select --install');
  process.exit(2);
}
