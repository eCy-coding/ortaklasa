---
description: Bu makinede ortam kontrolü çalıştır (npm run doctor) ve sonucu raporla
---

Bu workflow `scripts/doctor.mjs`'yi çalıştırır.

1. Workspace kökünde olduğundan emin ol.

// turbo
2. Kontrolü çalıştır:
   ```powershell
   npm run doctor
   ```

3. Çıkış kodunu yorumla:
   - **0** → her şey tamam, raporla.
   - **1** → opsiyonel araç eksik. Kullanıcıya hangi aşamayı çalıştıracağını söyle.
   - **2** → kritik araç eksik (git/node/ssh). Önce eksik olanı kur.

4. Eğer Node.js eksikse `npm` komutu çalışmaz; `node scripts/doctor.mjs` doğrudan çalıştırılamaz. Bu durumda **Aşama 6**'yı önce tamamla:
   ```powershell
   winget install --id OpenJS.NodeJS.LTS --scope user
   ```

5. Sonuç özeti: hangi araçlar var/yok, sıradaki aşama nedir? (PLAN.md'ye referansla)
