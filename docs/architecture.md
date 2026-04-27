# Mimari

## Bileşenler

| Katman | Bileşen | Çalıştığı yer | Amaç |
|---|---|---|---|
| Ağ | **Tailscale** | Her ikisi | Şifreli mesh VPN, sabit hostname |
| Kod | **Git + GitHub** | Her ikisi + uzak | Source of truth, versiyon kontrolü |
| Büyük dosya | **Syncthing** | Her ikisi (P2P) | Asset/dataset/model ağırlıkları |
| Uzaktan çalıştırma | **OpenSSH** | Win = sunucu, Mac = istemci | Mac → Win shell, Windsurf Remote |
| Servisler | **Docker Compose** | Yalnızca Win | Postgres, Redis, Ollama (GPU) |
| Görev runner | **npm scripts** + Node.js | Her ikisi | Tag tabanlı iş atama |
| Editör | **Windsurf** | Her ikisi | AI çift programcı |

## Veri akışı

```
Mac yazma akışı:
  editör → Git commit → GitHub push
                          ↓
                       Win pull → çalıştır

Mac → Win servis çağrısı:
  app → Tailscale → Win:5432 (Postgres)
                  → Win:6379 (Redis)
                  → Win:11434 (Ollama)

Mac → Win uzak komut:
  ssh ortaklasa-win "npm run heavy:gpu"
  → Windows'ta GPU ile çalışır, Mac'te sadece çıktıyı gösterir

Asset senkronu:
  shared/ klasörü ↔ Syncthing ↔ shared/ klasörü
  (Git'e değil, peer-to-peer)
```

## Görev tag matrisi

| Tag | Anlam | Hangi makinelerde çalışır |
|---|---|---|
| `gpu` | NVIDIA GPU gerekir | Windows |
| `docker` | Docker Desktop gerekir | Windows |
| `heavy` | Yoğun CPU/RAM | Windows (öncelikli) |
| `win` | Windows'a özgü API | Windows |
| `mac` | macOS'a özgü API | Mac |
| `ios` | Xcode gerekir | Mac |
| `light` | Hafif iş | Her ikisi |

`scripts/lib/platform.mjs` → `requireTag('gpu')` → makine bu tag'e sahip değilse `exit 2`.

## Karar kayıtları

- **Neden Tailscale?** Port forwarding yok, NAT'ı geçer, ücretsiz tier yeterli (3 kullanıcı, 100 cihaz), ACL ile incedir.
- **Neden Syncthing?** Tamamen P2P, bulut yok, Tailscale üzerinden geçince ek güvenlik. Git'e konmayacak büyük dosyalar için ideal.
- **Neden Windows = sunucu?** Daha güçlü CPU + dedikeli GPU + Ethernet. Mac taşınabilir → istemci.
- **Neden npm scripts?** Hem Win hem Mac'te `node` ile aynı script çalışır → ek bağımlılık yok. `make`/`just` yerine.
- **Neden `cross-platform/_todo.mjs` pattern'i?** API stabil kalır, implementasyon aşama aşama gelir.
