---
name: dual-machine-deploy
description: Yeni bir özellik/değişiklik geldiğinde her iki makinenin (Win + Mac) ihtiyaç duyduğu adımları kontrol et ve senkron tut.
---

# Skill: dual-machine-deploy

## Ne zaman tetiklenir?

- Yeni servis (`docker-compose.yml`) eklendi/değişti
- Yeni env değişkeni (`.env.example`) eklendi
- Yeni script (`scripts/`) eklendi/silindi
- Yeni doc (`docs/setup-*.md`) güncellendi
- Bağımlılık değişti (`package.json`)
- Yeni rule/workflow (`.windsurf/`) eklendi
- `KNOWN_MACHINES` (`scripts/lib/platform.mjs`) değişti

## Akış

1. **Etki analizi** — Değişiklik hangi makineyi etkiler?
   - Sadece Win? (örn. Docker servisi)
   - Sadece Mac? (örn. Xcode build)
   - İkisi de? (örn. yeni env, yeni doc)
2. **Win adımları** — `docs/setup-windows.md` güncel mi? Yeni komut var mı?
3. **Mac adımları** — `docs/setup-mac.md` güncel mi? Yeni komut var mı?
4. **Senkron** — Git push gerekli mi? Syncthing klasörünü etkiliyor mu?
5. **Doğrulama** — `npm run doctor` her iki makinede ✓ veriyor mu?
6. **Geri-uyumluluk** — Mevcut bir makinedeki kullanıcı `git pull` yaptığında bozulmadan devam edebilir mi?

## Kontrol listesi (yeni özellik commit'i)

- [ ] `docs/setup-windows.md` ilgili bölüm güncel
- [ ] `docs/setup-mac.md` ilgili bölüm güncel
- [ ] `.env.example` — yeni değişken eklendiyse her iki makinede `.env`'e eklenmeli (kullanıcıya hatırlat)
- [ ] Yeni komut → README'de + `package.json scripts`'te
- [ ] `KNOWN_MACHINES` etkilenmediyse aynı; etkilendiyse her iki makine için doğru
- [ ] `progress.txt` ilgili aşama notu güncel
- [ ] Cross-platform path kullanımı (`path.join`, `pathlib`) — hard-code separator yok
- [ ] LF satır sonu (`.gitattributes` koruyor; yine de manuel kontrol)

## Sık hatalar

- ❌ Sadece Win'de test edip Mac'te denemeden push'lamak
- ❌ `.env` (gerçek) commit'lemek — `.gitignore` korur ama dikkat
- ❌ Hard-coded `\\` veya `/`
- ❌ CRLF satır sonu üreten editör
- ❌ `npm install` sonrası `package-lock.json` commit'lememek (Mac sürümü farklı çözebilir)

## Bağlı dosyalar

- `@docs/setup-windows.md`
- `@docs/setup-mac.md`
- `@scripts/doctor.mjs`
- `@scripts/lib/platform.mjs`
- `@.env.example`
- `@progress.txt`
