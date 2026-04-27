# Operasyon Runbook

> Günlük/haftalık operasyon adımları. "Bu sistem nasıl yönetilir?" sorusunun cevabı.

## Günlük rutinler

### Sabah — Win açılınca
```powershell
# 1. Servisleri kontrol
docker ps                        # Postgres/Redis/Ollama up?
Get-Service sshd, Tailscale     # SSH ve Tailscale running?
tailscale status                 # Mac online mı?

# 2. Repo durumu
git fetch
git status
```

### Sabah — Mac açılınca
```bash
# 1. Tailscale + tunnel kontrol
tailscale status                 # Win görünür mü?
ssh ortaklasa-win "hostname"     # SSH OK?

# 2. Repo
git fetch && git status
```

### Akşam — kapatmadan önce
- Çalışan değişiklikleri commit et (otomatik commit YASAK).
- Mac'te uzun süreli iş varsa `nohup` veya `screen`/`tmux` ile arkaplana al.

## Haftalık

- **Pazartesi**: `npm outdated` her iki makinede; `package-lock.json` güncelle.
- **Çarşamba**: `git log --since="1 week ago" --oneline` — haftanın özeti.
- **Cuma**: `pg_dump` yedek (Stage 5+ sonrası):
  ```powershell
  docker exec ortaklasa-postgres pg_dump -U ortaklasa ortaklasa > "backups\$(Get-Date -Format yyyy-MM-dd).sql"
  ```

## Sık komutlar

```powershell
# Doctor — her şey OK mu?
npm run doctor

# Şu an hangi makinedeyim?
npm run where

# Görev atama matematiği örneği
npm run dispatch

# DB
npm run db:up        # servisler başlasın (Win)
npm run db:down      # durdur
npm run db:status    # ps
npm run db:logs      # tail

# Smoke test
node scripts/test.mjs all
node scripts/test.mjs t1 t7    # seçili
```

## Aşama yürütme (yeni cihaz/sıfırdan)

1. `git clone https://github.com/eCy/ortaklasa.git`
2. `cp .env.example .env` → değerleri doldur
3. Stage runner ile aşama aşama:
   ```bash
   node scripts/stage/install.mjs node       # Aşama 6
   node scripts/stage/install.mjs tailscale  # Aşama 2
   # SSH server (Win, admin):
   #   PowerShell -ExecutionPolicy Bypass -File scripts\win\install-openssh.ps1
   node scripts/stage/install.mjs syncthing  # Aşama 4
   node scripts/stage/install.mjs docker     # Aşama 5
   ```
4. `npm install && npm run doctor`
5. `node scripts/test.mjs all`

## Yedekten geri yükleme

```powershell
# Postgres
Get-Content backups\2026-01-15.sql | docker exec -i ortaklasa-postgres psql -U ortaklasa ortaklasa

# .env (parola yöneticisinden)
# Manuel kopyala
```

## Olay müdahale

### "Win'e bağlanamıyorum (Mac'ten)"
1. `tailscale status` → Win listede mi?
2. Win açık mı? Wake-on-LAN gerekli olabilir.
3. SSH servisi: `ssh ortaklasa-win "Get-Service sshd"` — yine bağlanamıyorsan Tailscale'i Win'de yeniden başlat.

### "Postgres connection lost"
1. `docker ps` → container çalışıyor mu?
2. `docker logs ortaklasa-postgres --tail 50`
3. `npm run db:restart`

### "GitHub push reddedildi"
1. SSH key GitHub'a eklendi mi? (Settings → SSH keys)
2. Repo permission var mı?
3. `git push --verbose origin main` ile detay.

### "Tailscale tüm cihazları kaybetti"
1. `tailscale logout && tailscale up` (Win'de yönetici).
2. Yine olmuyorsa: tailscale.com → DNS sekmesinden cihaz silip yeniden ekle.

## Performans

| Metrik | Hedef | Nasıl ölç |
|---|---|---|
| SSH RTT (Mac→Win) | < 50ms | `ssh ortaklasa-win "exit"` time'la |
| Postgres latency | < 5ms | `psql -c "\timing on" -c "select 1"` |
| Syncthing senkron | < 1 dk | `shared/test.bin` ile |
| GPU iş başlatma | < 2s | `time ssh ortaklasa-win "nvidia-smi"` |
