---
description: PLAN.md'deki bir aşamayı (1-8) sırayla yürüt — onay protokolü ile
---

Kullanım: `/run-stage N`  (N ∈ {1,2,3,4,5,6,7,8})

## Yürütme protokolü

1. `@PLAN.md` dosyasından "Aşama N" bölümünü oku.
2. `@progress.txt`'yi oku — önceki aşamaların ✓ DONE olduğunu doğrula.
   Eğer önkoşul aşama yapılmadıysa: kullanıcıya bildir, dur.
3. Aşamanın risk seviyesini belirt:
   - 🟢 **Sıfır risk** → otomatik çalıştırabilirim (`SafeToAutoRun=true`).
   - 🟡 **Düşük risk** (kullanıcı-modu install) → kullanıcıdan açık onay iste.
   - 🟠 **Orta risk** (admin/system service) → kullanıcı **ELLE** çalıştırsın; ben sadece komutu vereyim ve sonucu doğrulayayım.
4. Komutları sırayla yürüt. Her komut sonrası exit code kontrol et.
5. Aşama doğrulama testini çalıştır (`@PLAN.md`'deki "Doğrulama" bölümü).
6. Başarılıysa:
   - `@progress.txt`'yi güncelle: `Aşama N    ✓ DONE  (yyyy-mm-dd)`
   - Memory'ye not ekle (`create_memory`): `"Stage N complete — <kısa özet>"`
7. Sıradaki aşama önerisini ver.

## Hata durumunda

- Komut başarısız olursa **DUR**, başka komut çalıştırma.
- Hatayı `@docs/troubleshooting.md` ve master prompt §8.2 ile karşılaştır.
- Rollback'i kullanıcıya **sun** (otomatik uygulama).
- `@progress.txt`'yi `Aşama N    ✗ FAILED — <sebep>` olarak işaretle.

## Risk-aşama eşlemesi (referans)

| Aşama | Risk | Onay |
|---|---|---|
| 1 (git+remote) | 🟢 | otomatik |
| 2 (Tailscale) | 🟡 | install onayı |
| 3 (OpenSSH) | 🟠 | **admin elle** |
| 4 (Syncthing) | 🟡 | install onayı |
| 5 (Docker) | 🟠 | **admin elle** + WSL2 |
| 6 (Node.js) | 🟢 | install onayı |
| 7 (Mac) | 🟢 | Mac tarafında elle |
| 8 (smoke test) | 🟢 | otomatik |
