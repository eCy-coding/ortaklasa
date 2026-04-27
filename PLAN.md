# Ortaklaşa — Uçtan Uca Master Plan

İki makinenin (Windows PC + MacBook) birlikte çalışması için **9 aşamalı**, sıralı, geri-alınabilir plan. Her aşama bağımsız; istediğin yerde durabilirsin.

## Mimari Özet

```
                    Tailscale Mesh VPN (şifreli, NAT/Firewall içermez)
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                            │
   ╔════╧═════════════╗                      ╔══════╧════════╗
   ║  Windows PC      ║                      ║  MacBook       ║
   ║  DESKTOP-ERT7724 ║◄────── SSH ─────────►║  (istemci)     ║
   ║  192.168.1.24    ║◄── Syncthing ───────►║                ║
   ║                  ║◄── Postgres/Redis ◄──║                ║
   ║                  ║◄── HTTP API ◄────────║                ║
   ║  ─────────────── ║                      ║  ───────────── ║
   ║  Sunucu rolü:    ║                      ║  İstemci rolü: ║
   ║  • Docker        ║                      ║  • Editör      ║
   ║  • Postgres      ║                      ║  • Hafif build ║
   ║  • Redis         ║                      ║  • Mobil/UI    ║
   ║  • Ollama (GPU)  ║                      ║                ║
   ║  • SSH server    ║                      ║                ║
   ║  • Build/CI      ║                      ║                ║
   ╚══════════════════╝                      ╚════════════════╝
                              │
                       GitHub/GitLab (private)
                       — kod kaynağı (source of truth)
```

## Risk Skalası

- 🟢 **Sıfır risk** — sadece dosya/yapılandırma, geri alınabilir
- 🟡 **Düşük risk** — kullanıcı modunda yazılım kurulumu
- 🟠 **Orta risk** — yönetici izni gerektirir, sistem servisi açar
- 🔴 **Yüksek risk** — ağ portu açar / system PATH değiştirir → bu projede yok

---

## Aşama 0 — Proje İskeleti 🟢

**Hedef:** Repo dosyalarını oluştur (zero install).

**Adımlar:** Bu turda tamamlandı.

- `package.json`, `.gitignore`, `.gitattributes`, `.editorconfig`
- `scripts/lib/platform.mjs` — OS tespit
- `scripts/doctor.mjs` — eksik araç kontrolü
- `.env.example`, `README.md`, `progress.txt`

**Doğrulama:** `node scripts/doctor.mjs` (Stage 6'dan sonra)

**Geri al:** Klasörü sil.

---

## Aşama 1 — Git + Uzak Repo 🟢

**Hedef:** Kodun source of truth'u Git olsun, iki makine de aynı yerden push/pull yapsın.

**Önkoşul:** GitHub (veya GitLab) hesabı.

**Windows komutları:**
```powershell
git init
git add .
git commit -m "chore: initial scaffold"
# Kullanıcı GitHub'da private repo açar; sonra:
git remote add origin git@github.com:<KULLANICI>/ortaklasa.git
git branch -M main
git push -u origin main
```

**Doğrulama:** `git remote -v` çıktısı remote'u göstermeli.

**Geri al:** `git remote remove origin` + repo'yu GitHub'dan sil.

---

## Aşama 2 — Tailscale (Mesh VPN) 🟡

**Hedef:** İki makine internet üzerinden, port forwarding olmadan, şifreli bağlansın. Her makinenin sabit `<host>.<tailnet>.ts.net` adı olur.

**Önkoşul:** [tailscale.com](https://tailscale.com) ücretsiz hesap.

**Windows:**
```powershell
winget install --id tailscale.tailscale --source winget --scope user
# Kurulum sonrası tray'den giriş yap
tailscale status
```

**Mac:** [Tailscale Mac App](https://tailscale.com/download/mac) (App Store veya .pkg).

**Doğrulama:**
- Windows'ta: `tailscale status` → Mac IP'sini görmeli
- Mac'te: `tailscale ping <windows-host>.ts.net` → cevap almalı

**Geri al:** Tailscale uygulamasından "Disconnect" + uninstall.

---

## Aşama 3 — Windows'ta SSH Server 🟠

**Hedef:** Mac'ten Windows'a SSH ile bağlan, terminal/Windsurf Remote SSH kullan.

**Yönetici PowerShell gerekir:**
```powershell
# 1) OpenSSH Server'ı ekle
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

# 2) Servisi başlat ve otomatik başlatma
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

# 3) Firewall: yalnızca Tailscale arayüzünden erişime izin ver
# (Tailscale kurulduktan sonra arayüz adı netleşir; alternatif olarak
#  Tailscale ACL'lerinden de yönetilebilir)
Get-NetFirewallRule -Name *ssh* | Format-Table -AutoSize
```

**Mac'ten anahtar üret + Windows'a kopyala:**
```bash
# Mac'te
ssh-keygen -t ed25519 -C "macbook-baris" -f ~/.ssh/ortaklasa
cat ~/.ssh/ortaklasa.pub
# Windows'ta C:\Users\Barış\.ssh\authorized_keys dosyasına ekle
```

**Doğrulama:** Mac'ten `ssh -i ~/.ssh/ortaklasa baris@<windows>.ts.net "hostname"` → `DESKTOP-ERT7724` döner.

**Geri al:**
```powershell
Stop-Service sshd
Set-Service -Name sshd -StartupType 'Disabled'
Remove-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
```

---

## Aşama 4 — Syncthing (büyük dosya senkronu) 🟡

**Hedef:** Git'e konmayacak büyük dosyalar (model ağırlıkları, asset, video, dataset) iki makine arasında otomatik senkron olsun.

**Windows:**
```powershell
winget install --id Syncthing.Syncthing --scope user
```

**Mac:**
```bash
brew install syncthing
brew services start syncthing
```

**Adımlar:**
1. Her iki makinede Syncthing UI açılır (`http://localhost:8384`)
2. Cihazlar Tailscale IP üzerinden eşleştirilir
3. Paylaşılacak klasör: `<repo>/shared/` (Git tarafından ignore edilir)

**Doğrulama:** Bir makinede `shared/` altına dosya at → diğerinde 1 dk içinde belirir.

**Geri al:** Syncthing UI'dan paylaşımı kaldır + uninstall.

---

## Aşama 5 — Docker Desktop (Windows) 🟠

**Hedef:** Postgres, Redis, Ollama gibi servisler Windows'ta container'da çalışsın. Mac'ten Tailscale üzerinden bağlan.

**Önkoşul:** WSL2 etkin olmalı.

**Windows (yönetici):**
```powershell
# WSL2'yi etkinleştir (yeniden başlatma gerekebilir)
wsl --install --no-distribution

# Docker Desktop kur
winget install --id Docker.DockerDesktop --scope machine
```

**`docker-compose.yml` (Stage 5'te oluşturulacak):**
- `postgres:16-alpine` (port 5432, Tailscale interface'ine bind)
- `redis:7-alpine` (port 6379)
- `ollama/ollama` (GPU passthrough, port 11434)

**Doğrulama:** Mac'ten `psql -h <windows>.ts.net -U postgres` çalışmalı.

**Geri al:** `docker compose down -v`, gerekirse Docker Desktop uninstall.

---

## Aşama 6 — Node.js + Cross-platform Task Runner 🟢

**Hedef:** `npm run X` komutları her iki makinede de aynı sonucu üretsin.

**Her iki makinede:**
```bash
# Windows
winget install --id OpenJS.NodeJS.LTS --scope user

# Mac
brew install node
```

**Sonra:**
```bash
npm install
npm run doctor   # ortam kontrolü
```

**Tag'li script örnekleri (`package.json`'da tanımlı):**
- `npm run dev` — her makinede çalışır (hafif)
- `npm run heavy:gpu` — yalnızca Windows'ta (GPU gerekir, Mac'te uyarı verir)
- `npm run mobile:ios` — yalnızca Mac'te
- `npm run db:up` — Docker compose, yalnızca Windows'ta

**Doğrulama:** `npm run doctor` her iki makinede ✓ vermeli.

---

## Aşama 7 — MacBook Onboarding 🟢

**Hedef:** Mac'i sıfırdan bu projeye dahil et.

**Gerekenler (`docs/setup-mac.md`):**
1. Homebrew kur
2. Git, Node, Tailscale, Syncthing kur
3. SSH anahtarı üret + Windows'a yetkilendir
4. Tailscale login (aynı hesap)
5. `git clone`
6. `npm install && npm run doctor`

**Doğrulama:** Mac'ten `npm run doctor` ✓.

---

## Aşama 8 — Doğrulama & Smoke Test 🟢

**Hedef:** Her şeyin uçtan uca çalıştığını kanıtla.

**Test matrisi:**
| Test | Beklenen sonuç |
|---|---|
| Mac → SSH → Win → `nvidia-smi` | RTX 3060 Ti detayları görünür |
| Mac → `psql -h win.ts.net` | bağlantı OK |
| `shared/test.bin` Win'de oluştur | Mac'te 1 dk'da görünür |
| Win'de `npm run heavy:gpu` | Çalışır |
| Mac'te `npm run heavy:gpu` | "Bu makinede GPU yok, atlanıyor" uyarısı |
| `git push` Win → `git pull` Mac | Aynı dosyalar |

---

## Sıradaki adım

Aşama 0 bu turda tamamlandı. Aşama 1'den başlamak için **"git başlat"** de.  
Belirli bir aşamayı atlamak/erken yapmak istersen aşama numarasıyla söyle.
