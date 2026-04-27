---
description: MacBook'u projeye dahil et — donanım bilgisini topla, KNOWN_MACHINES'e ekle
---

Aşama 7 (MacBook onboarding) içinde çalıştırılır. Bu workflow Mac tarafından doğrudan, ya da Win tarafından kullanıcıdan bilgi alarak yürütülebilir.

## 1. Mac donanım keşfi

Kullanıcıdan Mac'te şu komutları çalıştırıp çıktıları paylaşmasını iste:

```bash
hostname
uname -a
sysctl -n hw.ncpu                                          # çekirdek sayısı
sysctl -n hw.memsize | awk '{ printf "%.0f", $1/1073741824 }'  # GB cinsinden RAM
sw_vers                                                    # macOS sürüm
sysctl -n machdep.cpu.brand_string 2>/dev/null || sysctl -n hw.model
```

## 2. KNOWN_MACHINES'e ekle

`scripts/lib/platform.mjs` dosyasındaki `KNOWN_MACHINES` objesine yeni entry ekle:

```js
'<mac-hostname>': {
  role: 'client',
  tags: ['mac', 'ios', 'light'],
  cores: <çekirdek-sayısı>,
  ramGb: <ram-gb>,
  hasGpu: false,
  os: 'darwin',
  note: 'MacBook — istemci rolü',
},
```

## 3. Mac kurulum kontrol listesi

`@docs/setup-mac.md` adımları:

1. Homebrew kur
2. `brew install git node syncthing`
3. `brew install --cask tailscale` → login (Win ile aynı hesap)
4. SSH anahtarı: `ssh-keygen -t ed25519 -C "macbook-baris" -f ~/.ssh/ortaklasa`
5. Public key'i Win'deki `~/.ssh/authorized_keys`'e ekle (Aşama 3 sonrası)
6. `git clone https://github.com/eCy-coding/ortaklasa.git ~/Code/ortaklasa`
7. `cp .env.example .env` → değerleri doldur
8. `npm install && npm run doctor`

## 4. Doğrulama

Mac tarafında:
```bash
npm run where    # KNOWN_MACHINES'te kendini görmeli
npm run doctor   # tüm kritik araçlar ✓
```

## 5. Kapanış

- Memory'ye kaydet: `"MacBook spec — <hostname,cpu,ram,os>"`
- `@progress.txt` Aşama 7 → ✓ DONE
- Önerilen sonraki aşama: 8 (smoke test) — Mac'ten Win'e SSH dahil.
