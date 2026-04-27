# Windows PC kurulum

> Detaylı plan: [`PLAN.md`](../PLAN.md). Bu dosya yalnızca Windows'a özgü adımları özetler.

Mevcut durum: git, ssh-client, python 3.11, wsl, winget, windsurf yüklü.

## Eksik araçlar (sırayla kurulacak)

| Araç | Aşama | Komut |
|---|---|---|
| Node.js LTS | 6 | `winget install --id OpenJS.NodeJS.LTS --scope user` |
| Tailscale | 2 | `winget install --id tailscale.tailscale --scope user` |
| OpenSSH Server | 3 | `Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0` (yönetici) |
| Syncthing | 4 | `winget install --id Syncthing.Syncthing --scope user` |
| Docker Desktop | 5 | `winget install --id Docker.DockerDesktop` (yönetici) |

## Kurulum sonrası

```powershell
git clone <repo-url> $HOME\Desktop\ortaklasa
cd $HOME\Desktop\ortaklasa
npm run doctor
```

`doctor` ✓ verince Aşama 7'ye (MacBook onboarding) geç.

## Tailscale ACL (önerilen)

SSH yalnızca **kendi tailnet** cihazlarından gelebilsin:

```hujson
// tailnet ACL
{
  "acls": [
    { "action": "accept", "src": ["autogroup:member"], "dst": ["*:*"] }
  ],
  "ssh": [
    { "action": "accept", "src": ["autogroup:member"], "dst": ["autogroup:self"], "users": ["root","autogroup:nonroot"] }
  ]
}
```

## Geri alma

Her aşamanın geri alma komutu [`PLAN.md`](../PLAN.md)'da var. Tamamen sıfırlamak için:

1. `winget uninstall` ile kurduklarını kaldır
2. `Remove-WindowsCapability -Online -Name OpenSSH.Server*`
3. Repo klasörünü sil
