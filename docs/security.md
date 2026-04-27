# Güvenlik kuralları

## Sırlar (`.env` dosyaları)

- `.env` dosyaları **asla** Git'e girmez. `.gitignore` korur ama dikkatli ol.
- Repo'da yalnızca `.env.example` bulunur — değer yerine **placeholder**.
- Her makine kendi `.env`'ini tutar. Mac ve Win sürümleri farklı olabilir (örn. `MAC_HOST` vs `WINDOWS_HOST` farklı yorumlanır).
- API anahtarı / token / şifre kullandın mı? `.env`'e ekle, asla kod içine.

## Tailscale ACL

Default ACL "yalnızca kendi cihazların" şeklinde:

```hujson
"acls": [
  { "action": "accept", "src": ["autogroup:member"], "dst": ["*:*"] }
]
```

Bu **kişisel kullanım** için yeterli. Bir başkasını tailnet'e davet edersen:
1. Bunun otomatik tüm cihazlara erişim olacağını unutma.
2. Tag'leri kullan: `tag:server`, `tag:client` ile dar yetkilendir.

## SSH

- **Sadece anahtar tabanlı kimlik** (`PasswordAuthentication no`).
- `PermitRootLogin no` — kök/admin uzaktan giriş yasak.
- Anahtar üretimi her zaman ed25519: `ssh-keygen -t ed25519 -C "<açıklama>"`.
- Her makine için **ayrı** anahtar (`~/.ssh/ortaklasa`, `~/.ssh/work` vb.).
- Anahtar paroları (`-N "<parola>"`) önerilir; ssh-agent ile bir kez gir, oturum boyunca kullan.

## Postgres

- Şifre `.env` içinde **PG_PASSWORD**. Default değer kullanma — `change-me` olmamalı.
- Compose dosyasında `0.0.0.0:5432:5432` bind var; **Tailscale ACL** dış erişimi engeller.
- pg_hba.conf default'u image'dan gelir; ileride `md5`/`scram-sha-256` zorunlu kıl.
- Yedek: `pg_dump` ile günlük cron (Stage 5+ planlanacak).

## Syncthing

- UI yalnızca **localhost:8384** üzerinde dinler — başka cihaza UI verme.
- Cihaz eşleme **Tailscale IP** üzerinden olsun (LAN değil).
- `.stignore` ile asla `.env` paylaşma (template'te zaten var).

## Docker

- Docker Desktop default WSL2 backend; daemon'a erişim **WSL2 sanal makine** içinden.
- `docker.sock` host'ta açık değil (Win) — bu güvenlik artısı.
- Image kaynağı: yalnızca **resmi imajlar** (`postgres`, `redis`, `ollama/ollama`). 3rd-party tag çekme.
- Volume'lara secret yazma; environment variable üzerinden geç.

## Git / GitHub

- Repo **private** olmalı (`.env.example` bile public'te bilgi sızdırır).
- Commit imzalama (GPG/SSH signing) opsiyonel ama önerilir:
  ```bash
  git config --global commit.gpgsign true
  git config --global gpg.format ssh
  git config --global user.signingkey ~/.ssh/ortaklasa.pub
  ```
- `git push --force` YASAK (main branch'ine).
- API anahtarı yanlışlıkla commit'lendi mi? `git filter-repo` ile temizle, **token'ı hemen iptal et** (yeni token oluştur).

## Yedekleme

| Veri | Nereye | Sıklık |
|---|---|---|
| Kod | GitHub remote | her commit |
| `.env` | El ile (1Password, parola yöneticisi) | manuel |
| Postgres | `pg_dump` cron | günlük |
| Syncthing `.stversions` | Otomatik | her değişiklik |

## Tehdit modeli — kişisel kullanım

Bu proje **tek kişi**, **iki kişisel cihaz** içindir. Saldırgan modeli:

1. ✅ İnternet'ten port tarama → korunmalı (Tailscale, Win Firewall).
2. ✅ Wi-Fi sniffing → şifreli (Tailscale WireGuard, Syncthing TLS).
3. ⚠ Cihaz fiziksel ele geçirilirse → disk şifrelemesi şart (BitLocker on Win, FileVault on Mac).
4. ⚠ Repo public yapılırsa → `.env.example` bile yapı bilgisi sızdırır.
5. ⚠ Sosyal mühendislik → Tailscale invite link'ini paylaşma, GitHub OAuth tokenları paylaşma.
