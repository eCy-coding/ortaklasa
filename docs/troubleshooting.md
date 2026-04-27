# Sorun giderme

> Bir hata aldıysan önce buraya bak. Bulunmuyorsa master prompt §8.2 ve `@PLAN.md`'deki ilgili aşama "Geri al" bölümüne bak.

## Bağlantı

### "ECONNREFUSED" / "Could not connect to <host>:<port>"

1. Tailscale çalışıyor mu? `tailscale status` → cihaz listesi gelmeli.
2. Hedef makine açık mı? `ping <host>.<tailnet>.ts.net`
3. Servis çalışıyor mu (Win'de)?
   - SSH:        `Get-Service sshd`
   - Postgres:   `docker ps | findstr postgres`
   - Redis:      `docker ps | findstr redis`
4. Firewall:    `Get-NetFirewallRule -Name 'OpenSSH*' | Format-Table -AutoSize`

### "Permission denied (publickey)"

1. Mac'teki public key Win'deki `~/.ssh/authorized_keys`'e eklenmiş mi?
   ```bash
   cat ~/.ssh/ortaklasa.pub   # Mac'te
   ```
   bu satır `C:\Users\<user>\.ssh\authorized_keys`'e olduğu gibi yapıştırılmalı.
2. Dosya izinleri (Win — admin değilsen):
   ```powershell
   icacls $env:USERPROFILE\.ssh\authorized_keys /inheritance:r `
          /grant:r "$($env:USERNAME):F" "SYSTEM:F" "Administrators:F"
   ```
3. SSH key path doğru mu? `ssh -i ~/.ssh/ortaklasa -v <user>@<host>`

## Ortam

### "command not found: npm" (veya `node`)

Aşama 6 yapılmamış. Kur:
- Win: `winget install --id OpenJS.NodeJS.LTS --scope user`
- Mac: `brew install node`

Sonra yeni terminal aç, `node --version` doğrula.

### `npm run doctor` exit 2 (kritik eksik)

Doctor çıktısındaki kurulum komutunu çalıştır. Sonra tekrar çalıştır.

### `node` çalışıyor ama `npm` yok / eski

PATH sorunu. Kontrol:
```powershell
where.exe node ; where.exe npm
```
Birden fazla node yüklüyse winget ile diğerlerini kaldır.

## Git

### CRLF/LF uyarıları

Bu beklenen davranış. `.gitattributes` LF zorunlu kılıyor; Win'de checkout'ta CRLF görebilirsin ama repo'da LF saklanıyor. Sorun değil.

Susturmak için:
```powershell
git config --global core.autocrlf input
```

### "fatal: refusing to merge unrelated histories"

GitHub'da repo açarken README/license işaretlemiş olabilirsin. Çözüm:
```bash
git pull origin main --allow-unrelated-histories
# çakışmaları çöz
git push
```

Ya da daha temiz: GitHub'daki repo'yu boşalt (yeni repo'yu README'siz aç).

## Docker

### "Docker Desktop is starting..."

İlk açılış 1-2 dakika sürer. WSL2 backend kullanıyorsa biraz daha. Sabırlı ol.

### "no matching manifest for windows/amd64"

Compose'taki bir image Linux only. Docker Desktop'ta Settings → "Use the WSL 2 based engine" aktif olmalı.

### `docker compose up` GPU pass-through hatası

NVIDIA Container Toolkit gerekli. Aşama 5'te ek adım:
- WSL2 içinde NVIDIA driver'ları
- `nvidia-ctk runtime configure --runtime=docker`

Şimdilik çalışmıyorsa `docker compose --profile no-gpu up` (Ollama'sız).

## Tailscale

### "tailscale: command not found"

Aşama 2 yapılmamış. Win: `winget install tailscale.tailscale`. Mac: `brew install --cask tailscale`.

### Magic DNS çalışmıyor

`tailscale status` çıktısındaki **MagicDNS** alanını kontrol et. Tailnet panelinden açık olmalı (DNS sekmesi).

## Rate limit (Cascade/Windsurf)

`Permission denied: all API providers are over their global rate limit for trial users` görürsen:

1. **DUR**, anında retry yapma. `@.windsurf/rules/rate-limit-optimization.md` §rate_limit_handling.
2. 30-60 sn bekle.
3. İsteği parçala, hafif modele geç (SWE-1.5).
4. 2'den fazla hata → günlük/haftalık reset bekle.

Reset bilgisi: <https://windsurf.com/subscription/manage-plan>
