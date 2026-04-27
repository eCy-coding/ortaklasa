// .env yükleyici. Her makine kendi .env'ini tutar; repo'ya GİRMEZ.
// Basit bir parser: # yorumlar, KEY=VALUE, "tırnak" temizliği, ${VAR}
// interpolasyonu (tek geçişlik).

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, '..', '..');
export const ENV_FILE = path.join(REPO_ROOT, '.env');
export const ENV_EXAMPLE = path.join(REPO_ROOT, '.env.example');

export function parseEnvText(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  // ${VAR} interpolasyonu
  for (const k of Object.keys(out)) {
    out[k] = out[k].replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_, name) =>
      out[name] ?? process.env[name] ?? '');
  }
  return out;
}

export function loadEnv({ optional = false } = {}) {
  if (!existsSync(ENV_FILE)) {
    if (optional) return { ...process.env };
    throw new Error(
      `[env] .env bulunamadı: ${ENV_FILE}\n` +
      `Çözüm: 'cp .env.example .env' (Mac/Linux) veya ` +
      `'Copy-Item .env.example .env' (Win), sonra değerleri doldur.`
    );
  }
  const env = parseEnvText(readFileSync(ENV_FILE, 'utf8'));
  Object.assign(process.env, env);
  return { ...process.env, ...env };
}

export function requireEnv(keys, env = process.env) {
  const missing = keys.filter(k => !env[k]);
  if (missing.length) {
    console.error(`[env] Eksik değişken(ler): ${missing.join(', ')}`);
    console.error(`'.env' veya '.env.example' dosyasını kontrol et.`);
    process.exit(2);
  }
  return Object.fromEntries(keys.map(k => [k, env[k]]));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const env = loadEnv({ optional: true });
  const keys = Object.keys(env).filter(k => !k.startsWith('npm_') && k !== 'PATH');
  console.log(`Yüklü (npm/PATH hariç) ${keys.length} değişken.`);
  if (keys.length) console.log('Örnek 5:', keys.slice(0, 5).join(', '));
}
