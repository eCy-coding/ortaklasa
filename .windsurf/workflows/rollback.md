---
description: Bir aşamayı geri al — yıkıcı; her komut açık onay ister
---

Kullanım: `/rollback N`

⚠ **Bu workflow YIKICI komutlar içerir.** Otomatik çalıştırma YASAK.
Her komut için kullanıcıdan açık "evet" gerekir.

## Protokol

1. `@PLAN.md` ve `@.windsurf/rules/prompts/2bilgisayar.txt` §9'dan Aşama N'in "Geri al" / rollback komutunu oku.
2. Bağımlı aşamaları tespit et (DAG'a göre):
   - Aşama 2 düşerse → 3, 4, 5, 8 de etkilenir (network gider).
   - Aşama 3 düşerse → 8 etkilenir (Mac→Win SSH testi yapılamaz).
   - Aşama 5 düşerse → 8 kısmen düşer (DB testi yapılamaz).
   Kullanıcıya zincirleme etkiyi göster.
3. Her komut için ayrı onay iste:
   ```
   ⚠ ROLLBACK Aşama N — Adım k/m
   Komut : <komut>
   Etki  : <ne olacak, geri dönüşü var mı?>
   Onaylıyor musun? (evet / hayır / iptal)
   ```
4. Onay → komutu `SafeToAutoRun=false` ile çalıştır. Hata olursa raporla, devam etme.
5. Tamamlanınca:
   - `@progress.txt` → `Aşama N    □ TODO  (rollback: yyyy-mm-dd)`
   - Bağımlı aşamalar da etkilenmişse onları da güncelle.
   - Memory: `"Stage N rolled back — <sebep>"`

## Aşama → Geri al komutu

| Aşama | Komut |
|---|---|
| 1 | `git remote remove origin`  +  GitHub UI'dan repo sil |
| 2 | `winget uninstall tailscale.tailscale` ; `tailscale logout` |
| 3 | `Stop-Service sshd ; Set-Service sshd -StartupType Disabled ; Remove-WindowsCapability -Online -Name OpenSSH.Server*` (admin) |
| 4 | `winget uninstall Syncthing.Syncthing` |
| 5 | `docker compose down -v ; winget uninstall Docker.DockerDesktop` |
| 6 | `winget uninstall OpenJS.NodeJS.LTS` |
| 7 | Mac: `brew uninstall git node syncthing ; brew uninstall --cask tailscale` |
| 8 | (geri alınacak değişiklik yok — yalnızca okuma testi) |

## Felaket senaryosu

Birden çok aşama bozulduysa veya sistem bozulduysa, tam sıfırlama:

1. Repo klasörünü sil: `Remove-Item -Recurse -Force <repo>`
2. Yeni klone: `git clone https://github.com/eCy-coding/ortaklasa.git`
3. Tailscale logout + uninstall.
4. (Win admin) tüm Windows capability'leri remove et.
5. Master prompt §9 son madde — felaket kurtarma rehberi.
