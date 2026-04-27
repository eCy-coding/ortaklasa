# AGENTS.md — ortaklasa

> **Always-on**. Her oturumda otomatik yüklenir. Hafif tut. Detaylar için referansla.

## Proje
Windows PC + MacBook = tek dağıtık geliştirme ortamı.

## Makineler

| Rol | Hostname | OS | Tags |
|---|---|---|---|
| **Sunucu** | `DESKTOP-ERT7724` | Windows 10 22H2 | `gpu, docker, heavy, win` |
| **İstemci** | `<TBD>` (Mac) | macOS | `mac, ios, light` |

## Önce oku, sonra hareket et

1. **`progress.txt`** — şu an hangi aşamadayız?
2. **`.windsurf/rules/prompts/2bilgisayar.txt`** — uçtan uca master prompt (kimlik, kurallar, mimari, matematik, DAG, geri-alma, smoke test).
3. **`PLAN.md`** — 9 aşamalı yol haritası (komutlar + doğrulama + rollback).
4. **`docs/architecture.md`** — bileşen + akış.

## Aktif kurallar (auto-load)
- `.windsurf/rules/rate-limit-optimization.md` — token economy + multi-machine awareness.

## Her görevde 5 reflex

1. **Hangi makinede?** Tag tabanlı karar. GPU/build/Docker → Win. Editör/mobil → Mac.
2. **Cross-platform yaz.** `path.join`, LF, `npm` script. `.ps1`/`.sh` sadece OS-spesifik.
3. **Secret yok.** `.env` Git'e GİRMEZ; `.env.example` girer.
4. **Auto-install yok.** Her kurulum kullanıcı onayı ister.
5. **Rate limit alınca DUR.** 30-60 sn bekle, parçala, hafif modele geç.

## Hızlı kontrol
```bash
npm run doctor          # ortam kontrolü
node scripts/lib/platform.mjs   # bu makine kim?
```

## Yeni dosya nereye?
- script (cross-platform) → `scripts/<name>.mjs`
- doc → `docs/<topic>.md`
- rule → `.windsurf/rules/<name>.md` (frontmatter ile)
- workflow → `.windsurf/workflows/<name>.md`
- prompt → `.windsurf/rules/prompts/<name>.txt`

## Yasaklar
- `cd` komutu (kullan: `Cwd` parametresi)
- Hard-coded path separator
- CRLF üretmek
- System PATH değiştirmek
- Otomatik commit
