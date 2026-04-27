---
name: safe-install
description: Yeni bir paket/uygulama kurulumu önerirken protokol — Win'de winget, Mac'te brew, otomatik install YASAK, her zaman kullanıcı onayı.
---

# Skill: safe-install

## Temel ilke

> **Hiçbir kurulum kullanıcı onayı olmadan yapılmaz.**
> Install komutları için ASLA `SafeToAutoRun=true` kullanma.

## Karar matrisi

| Durum | Win komutu | Mac komutu |
|---|---|---|
| **Kullanıcı kapsamı** (önerilen) | `winget install --id <ID> --scope user` | `brew install <name>` |
| **Sistem kapsamı** (admin) | `winget install --id <ID>` (admin shell) | `sudo brew install` (genelde gerekmez) |
| **GUI uygulama** | `winget install --id <ID>` | `brew install --cask <name>` |
| **Windows feature** | `Add-WindowsCapability -Online -Name <X>` (admin) | — |

## Süreç

1. **Tespit** — Kullanıcının ihtiyaç duyduğu paket nedir? Hangi aşamada/için gerekli?
2. **Kontrol** — Zaten yüklü mü?
   - Win: `Get-Command <bin> -ErrorAction SilentlyContinue`
   - Mac: `command -v <bin>`
3. **Kapsam belirle** — User-scope yeterli mi? (Genelde evet.) Admin gerekli mi?
4. **Komut sun** — `SafeToAutoRun=false` ile, kullanıcı onaylasın.
5. **Doğrula** — Kurulum sonrası `<bin> --version`.
6. **Doctor** — `npm run doctor` ile tüm ortamı yeniden ölç.
7. **Memory** — Memory'ye not düş: `"<paket> installed on <host> at <tarih>"`.

## Yasaklar

- ❌ Otomatik kurulum (`SafeToAutoRun=true` ile install komutu)
- ❌ Kullanıcının system PATH'ini kalıcı değiştirmek (`[Environment]::SetEnvironmentVariable(... 'Machine')`)
- ❌ Birden fazla paket yöneticisi karıştırmak (Win'de chocolatey + winget — kafa karıştırır)
- ❌ Beta/preview kanalı (`--channel preview`) — stabilite için release kanalı
- ❌ Onaysız `--ignore-security-hash`, `--accept-source-agreements --accept-package-agreements` ile by-pass

## Uninstall karşılığı (rollback)

Her install için karşılığını biliyor olmalısın:

| Install | Uninstall |
|---|---|
| `winget install <ID>` | `winget uninstall <ID>` |
| `brew install <name>` | `brew uninstall <name>` |
| `brew install --cask <name>` | `brew uninstall --cask <name>` |
| `Add-WindowsCapability -Name <X>` | `Remove-WindowsCapability -Online -Name <X>` |
| Manuel installer (.exe/.msi) | Add/Remove Programs (Settings → Apps) |

## Bilinen ID'ler (bu projede)

| Paket | Win (winget ID) | Mac (brew) |
|---|---|---|
| Node.js LTS | `OpenJS.NodeJS.LTS` | `node` |
| Tailscale | `tailscale.tailscale` | `--cask tailscale` |
| Syncthing | `Syncthing.Syncthing` | `syncthing` |
| Docker Desktop | `Docker.DockerDesktop` | `--cask docker` |
| GitHub CLI | `GitHub.cli` | `gh` |
| Python 3.11 | `Python.Python.3.11` | `python@3.11` |

## Bağlı dosyalar

- `@docs/setup-windows.md` — Win paket listesi
- `@docs/setup-mac.md` — Mac paket listesi
- `@scripts/doctor.mjs` — kontrol matrisi
