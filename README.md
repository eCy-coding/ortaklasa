# ortaklasa

İki makinenin (Windows PC + MacBook) birlikte çalıştığı kişisel dağıtık geliştirme ortamı.

## Hızlı bakış

- **Windows PC** = sunucu rolü (Docker, Postgres, Redis, GPU işleri, build).
- **MacBook** = istemci rolü (editör, hafif build, mobil/UI).
- **Tailscale** mesh VPN üzerinden güvenli bağlantı.
- **Git** kod kaynağı, **Syncthing** büyük dosya senkronu.

## Hangi belgeden başlamalıyım?

| Sen kimsin | Aç |
|---|---|
| Master planı görmek istiyorum | [`PLAN.md`](./PLAN.md) |
| Windows PC'yi kuruyorum | [`docs/setup-windows.md`](./docs/setup-windows.md) |
| MacBook'u kuruyorum | [`docs/setup-mac.md`](./docs/setup-mac.md) |
| Mimariyi anlamak istiyorum | [`docs/architecture.md`](./docs/architecture.md) |
| Kuralları görmek istiyorum | [`.windsurf/rules/rate-limit-optimization.md`](./.windsurf/rules/rate-limit-optimization.md) |

## Tek satırlık ortam kontrolü

```bash
npm run doctor
```

Hangi araçlar var, hangileri eksik — listeler. Eksikleri kurmak için ilgili setup belgesine bakar.

## İlerleme

Şu an hangi aşamadayız: [`progress.txt`](./progress.txt)
