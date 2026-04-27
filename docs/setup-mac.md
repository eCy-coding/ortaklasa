# MacBook kurulum

> Detaylı plan: [`PLAN.md`](../PLAN.md). Bu dosya yalnızca Mac'e özgü adımları özetler.

## 1. Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## 2. Temel araçlar

```bash
brew install git node python@3.11 syncthing
brew install --cask tailscale
```

## 3. Tailscale

1. Menü çubuğundaki Tailscale ikonundan **Log In**.
2. Windows PC ile **aynı hesabı** kullan.
3. `tailscale status` → Windows PC görünmeli.

## 4. SSH anahtarı

```bash
ssh-keygen -t ed25519 -C "macbook-baris" -f ~/.ssh/ortaklasa
cat ~/.ssh/ortaklasa.pub
# Çıktıyı Windows PC'deki C:\Users\Barış\.ssh\authorized_keys dosyasına ekle
```

`~/.ssh/config` dosyasına ekle:

```
Host ortaklasa-win
    HostName desktop-ert7724.<TAILNET>.ts.net
    User Barış
    IdentityFile ~/.ssh/ortaklasa
    ServerAliveInterval 30
```

Test:

```bash
ssh ortaklasa-win "hostname"
# DESKTOP-ERT7724
```

## 5. Repo klonla

```bash
git clone <repo-url> ~/Code/ortaklasa
cd ~/Code/ortaklasa
cp .env.example .env  # değerleri doldur
npm install
npm run doctor
```

## 6. KNOWN_MACHINES'e ekle

`scripts/lib/platform.mjs` dosyasındaki `KNOWN_MACHINES` objesine MacBook'unu ekle:

```js
'<senin-mac-hostname>': {
  role: 'client',
  tags: ['mac', 'ios', 'light'],
  note: 'MacBook — istemci rolü',
},
```

`hostname` komutuyla kendi makinenin adını öğrenebilirsin.

## 7. Syncthing eşle

1. `http://localhost:8384` aç
2. Cihaz ekle → Windows PC'nin ID'sini gir
3. Klasör paylaş: `~/Code/ortaklasa/shared` ↔ Windows tarafındaki aynı klasör

## Geri alma

```bash
brew uninstall git node syncthing
brew uninstall --cask tailscale
rm -rf ~/Code/ortaklasa
```
