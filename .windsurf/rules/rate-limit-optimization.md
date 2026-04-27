---
trigger: always_on
description: Trial kullanıcılar için global API rate limit hatasını ("Permission denied: all API providers are over their global rate limit for trial users") önlemek ve token/kota tüketimini minimize etmek için her işlemde uygulanacak kurallar.
---

# Rate Limit & Token Tasarrufu Kuralları

<context>
- **Hata:** `Permission denied: all API providers are over their global rate limit for trial users`
- **Anlamı:** Windsurf'ün kullandığı tüm yukarı akış model sağlayıcıları (Anthropic, OpenAI, Google, vb.) trial kullanıcılar için global kapasiteye ulaşmış durumda. Bu kullanıcıya özel değil, küresel bir kapasite sorunudur.
- **Resmî çözüm (Windsurf Docs):** Birkaç saniye bekleyip yeniden dene. Kotalar günlük ve haftalık olarak takvim tarihine göre sıfırlanır.
- **Hedef:** Her işlemi minimum token, minimum istek ve maksimum verimlilikle tamamlamak.
</context>

<token_economy>
- Her cevabı mümkün olan en az token ile üret. Gereksiz açıklama, tekrar ve nezaket cümlesi ekleme.
- Asla aynı dosyayı, aynı oturumda ihtiyaç olmadıkça birden fazla kez okuma. Zihinsel modeli koru.
- Kod bloklarını mesajda tekrar yazma. Mevcut kodu göstermek için citation formatını kullan: `@absolute/path:start-end`.
- Uzun listeler yerine kısa bullet'lar kullan. Tablo sadece gerçekten gerektiğinde.
- Cevabı bitirdiğinde özet/summary ekleme zorunluluğu yoksa ekleme.
</token_economy>

<tool_call_efficiency>
- Bağımsız tool call'ları **her zaman** tek bir mesajda paralel çalıştır (örn. birden fazla `read_file`, `grep_search`, `run_command`).
- Aynı dosyada birden fazla değişiklik için `edit` yerine `multi_edit` kullan.
- Geniş kod tabanı keşfi için manuel `grep_search`/`list_dir` yerine `code_search` (Fast Context) ile başla; sonuçları daralt.
- `find_by_name` ile glob pattern kullan; aynı amaca yönelik birden fazla arama yapma.
- Komut çıktısını sınırla: `Get-CimInstance ... | Select-Object <sadece-gerekli-alanlar>`, `head -n`, `Select-Object -First N` gibi filtrelerle.
- Gereksiz `read_file` çağırma: bilgi tool çıktısında zaten varsa tekrar dosyayı açma.
</tool_call_efficiency>

<context_minimization>
- Sadece görev için **gerçekten gerekli** dosyaları context'e al. Tüm projeyi taramaktan kaçın.
- Büyük dosyaları okurken `offset`/`limit` ile sadece ilgili satır aralığını oku.
- `@-mention` kullanırken tüm klasörü değil, mümkünse tek dosya/sembol mention et.
- Önceki konuşma bağlamı yeterliyse aynı bilgiyi yeniden topla**ma**.
- Kullanıcının verdiği dosya yolu/sembol adlarını doğrudan kullan; tahmin için ek arama yapma.
</context_minimization>

<model_selection>
- Rutin/küçük görevler (basit edit, formatlama, açıklama) için **SWE-1.5** veya ücretsiz modelleri tercih et — kotaya yazılmaz.
- Karmaşık planlama/refactor için tek bir frontier model'da kal; model değiştirme cache'i bozar ve token maliyetini artırır.
- Tek bir oturumda aynı modeli kullanmak prompt cache'inden faydalanır → input token maliyeti düşer.
</model_selection>

<rate_limit_handling>
- Bir tool call veya istek `rate limit` / `429` / `resource_exhausted` / `all API providers are over their global rate limit` hatası verirse:
  1. **Dur**, aynı isteği hemen tekrar deneme (retry-storm token yakar).
  2. Kullanıcıya kısaca durumu bildir ve **30–60 sn** bekle.
  3. Yeniden denerken isteği daha küçük parçaya böl (daha az context, daha kısa prompt).
  4. Mümkünse daha hafif bir modele geç (SWE-1.5 vb.).
- Aynı oturumda 2'den fazla rate limit hatası alındıysa, kullanıcıya kotanın resetlenmesini beklemesini öner (günlük/haftalık reset).
</rate_limit_handling>

<task_discipline>
- Her görev başında tek bir kısa plan oluştur, **sadece bir adımı** in_progress yap.
- Plan dışına çıkma; "bonus" iyileştirmeler yapma — bunlar fazladan token harcar.
- Görev tamamlanmadan dosyaları tekrar tekrar gözden geçirme; tek geçişte bitir.
- Yardımcı script, geçici dosya, özet `.md` dosyaları **kullanıcı istemedikçe** oluşturma.
</task_discipline>

<command_execution>
- PowerShell komutlarında çıktıyı daralt: `Select-Object`, `Format-List`/`Format-Table -AutoSize`, `Where-Object`.
- Komutu `Blocking=true` yapmadan önce uzun süreceğini düşünüyorsan async başlat.
- `cd` kullanma; `Cwd` parametresini kullan.
- Aynı bilgiyi farklı komutlarla iki kez sorgulama (örn. `systeminfo` + `Get-ComputerInfo` ikisini birden).
</command_execution>

<communication>
- Türkçe yanıt ver (kullanıcının dili).
- "Anladım", "harika fikir", "tabii ki" gibi onay cümleleri kullanma — direkt işe başla.
- Tool çağrısı öncesi tek cümlelik niyet açıklaması yeterli; uzun gerekçe yazma.
- Görev sonunda 1-2 satırlık net tamamlama özeti ver.
</communication>

<multi_machine_awareness>
- Bu proje **iki makinede** birlikte çalışır: Windows PC (`DESKTOP-ERT7724`, Ryzen 5 5600 + RTX 3060 Ti, 16 GB) ve **MacBook**.
- Her görevde şu soruları sor: (a) Hangi makinede çalışmalı? (b) Cross-platform mu, OS'a özgü mü? (c) Diğer makineye senkron olmalı mı?
- **Yol/Path:** Asla hard-coded `\` veya `/` kullanma. Node.js'de `path.join()`, Python'da `pathlib.Path`, shell'de değişkenle.
- **Satır sonu:** Her zaman LF. `.gitattributes` ile `* text=auto eol=lf`. CRLF üretme.
- **Komut yazımı:** `package.json` script'leri veya Node.js script'leri tercih et — `cross-env`, `shx`, `rimraf` ile platform-bağımsız. Saf `.ps1`/`.sh` sadece OS'a özgü işler için (`scripts/win/*.ps1`, `scripts/mac/*.sh`).
- **Ağır iş ataması:** GPU/derleme/Docker → Windows. Editör/dokümantasyon/mobil → Mac. Tag tabanlı script: `npm run heavy:gpu` yalnızca Windows'ta çalışır, makineyi tespit eder, yanlış makinede uyarı verir.
- **Network varsayımları:** Tailscale mesh VPN üzerinde çalışır kabul et (her makinenin sabit `*.ts.net` hostname'i vardır). LAN'a (`192.168.1.x`) bağımlı kod yazma.
- **Sırlar/secrets:** `.env` dosyaları **Git'e girmez**, `.env.example` girer. Her makine kendi `.env`'ini tutar.
- **Servisler:** Postgres, Redis, Ollama gibi servisler Windows'ta Docker'da çalışır; Mac bunlara Tailscale üzerinden bağlanır. Mac'te de offline-friendly bir fallback (SQLite vb.) düşün.
- **Dosya senkronu:** Git = kod (source of truth). Syncthing = büyük binary/asset/dataset (Git'e konmayacak). Otomatik commit yapma — kullanıcı kontrol eder.
- **Dokümante et:** `docs/setup-windows.md` ve `docs/setup-mac.md` her zaman güncel kalmalı; bir adım eklediysen ikisinde de yansıt.
- **Test diciplini:** Bir makinede çalışan kodun diğerinde de çalıştığını varsayma — değiştirdiğin script'i her iki platformda da test edilebilir tut (en azından `--dry-run` modu).
</multi_machine_awareness>
