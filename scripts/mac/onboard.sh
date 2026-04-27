#!/bin/bash
# Mac onboarding — tek komut tüm Mac kurulumunu yapar.
#
# Kullanım:
#   bash <(curl -fsSL https://raw.githubusercontent.com/eCy-coding/ortaklasa/main/scripts/mac/onboard.sh)
#
# Adımlar (idempotent — tekrar çalıştırılabilir):
#   1) Homebrew                                      otomatik
#   2) Brew paketleri (git, node, syncthing)         otomatik
#   3) Tailscale install + login                     login interaktif
#   4) SSH keygen + ~/.ssh/config                    otomatik
#   5) Pub key'i scp ile Win'e gönder                Win SSH parolası interaktif (1 kez)
#   6) Repo clone                                    otomatik
#   7) .env oluştur (template'ten)                   otomatik (PG_PASSWORD manuel)
#   8) KNOWN_MACHINES'e Mac eklenir                  otomatik
#   9) npm install + doctor                          otomatik

set -euo pipefail

# === Konfigürasyon ===
WIN_HOST="${WIN_HOST:-desktop-ert7724.tail75df7f.ts.net}"
WIN_USER="${WIN_USER:-Barış}"
REPO_URL="${REPO_URL:-https://github.com/eCy-coding/ortaklasa.git}"
CODE_DIR="${CODE_DIR:-$HOME/Code/ortaklasa}"

# === Renkler ===
G='\033[1;32m'; Y='\033[1;33m'; R='\033[1;31m'; C='\033[1;36m'; B='\033[1;34m'; N='\033[0m'
step() { echo -e "\n${B}═══ $1 ═══${N}"; }
ok()   { echo -e "${G}✓${N} $1"; }
warn() { echo -e "${Y}⚠${N} $1"; }
err()  { echo -e "${R}✗${N} $1" >&2; }
info() { echo -e "${C}ℹ${N} $1"; }

# === macOS kontrol ===
if [[ "$(uname)" != "Darwin" ]]; then
  err "Bu script sadece macOS içindir. Tespit: $(uname)"
  exit 1
fi

echo -e "${B}╔════════════════════════════════════════╗${N}"
echo -e "${B}║  ortaklasa — Mac onboarding            ║${N}"
echo -e "${B}║  Hedef: $WIN_HOST  ${N}"
echo -e "${B}╚════════════════════════════════════════╝${N}"

# === 1/9 Homebrew ===
step "1/9  Homebrew"
if command -v brew >/dev/null 2>&1; then
  ok "Brew kurulu: $(brew --version | head -1)"
else
  warn "Brew yok, kuruluyor (yönetici parolası isteyebilir)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Apple Silicon Mac için PATH
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    # Profile'a kalıcı ekle
    if ! grep -q "/opt/homebrew/bin/brew shellenv" "$HOME/.zprofile" 2>/dev/null; then
      echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
    fi
  fi
  ok "Brew kuruldu"
fi

# === 2/9 Temel paketler ===
step "2/9  Brew paketleri"
for pkg in git node syncthing; do
  if brew list "$pkg" >/dev/null 2>&1; then
    ok "$pkg zaten kurulu"
  else
    info "$pkg kuruluyor..."
    brew install "$pkg"
    ok "$pkg kuruldu"
  fi
done
ok "git $(git --version | awk '{print $3}')"
ok "node $(node --version)"
ok "syncthing $(syncthing --version | head -1 | awk '{print $2}')"

# === 3/9 Tailscale ===
step "3/9  Tailscale"
if [[ -d /Applications/Tailscale.app ]]; then
  ok "Tailscale zaten kurulu"
else
  brew install --cask tailscale
  ok "Tailscale kuruldu"
fi

TS_BIN="/Applications/Tailscale.app/Contents/MacOS/Tailscale"
TS_IP=""

# Login kontrol — IP varsa login OK
if [[ -x "$TS_BIN" ]]; then
  TS_IP=$("$TS_BIN" ip -4 2>/dev/null | head -1 || true)
fi

if [[ -z "$TS_IP" ]]; then
  warn "Tailscale login gerekli."
  info "Tailscale uygulaması açılıyor..."
  open -a Tailscale 2>/dev/null || true
  echo
  echo "  → Menü çubuğundaki Tailscale ikonuna tıkla"
  echo "  → 'Log in...' seç, Windows ile aynı hesapla giriş yap"
  echo
  read -r -p "Login tamamlandığında ENTER bas... " _

  # Tekrar dene (60sn'ye kadar)
  for i in {1..30}; do
    sleep 2
    TS_IP=$("$TS_BIN" ip -4 2>/dev/null | head -1 || true)
    [[ -n "$TS_IP" ]] && break
  done

  if [[ -z "$TS_IP" ]]; then
    err "Tailscale IP alınamadı — login tamamlanmamış olabilir"
    exit 1
  fi
fi

TS_FQDN=$("$TS_BIN" whois "$TS_IP" 2>/dev/null | grep -E "^\s*Name:" | head -1 | awk '{print $2}' || echo "")
ok "Tailnet IP : $TS_IP"
ok "Tailnet FQDN: ${TS_FQDN:-bilinmiyor}"

# === 4/9 SSH key + config ===
step "4/9  SSH key"
SSH_DIR="$HOME/.ssh"
SSH_KEY="$SSH_DIR/ortaklasa"
SSH_CONFIG="$SSH_DIR/config"

mkdir -p "$SSH_DIR" && chmod 700 "$SSH_DIR"

if [[ -f "$SSH_KEY" ]]; then
  ok "SSH key var: $SSH_KEY"
else
  ssh-keygen -t ed25519 -C "macbook-$(whoami)" -f "$SSH_KEY" -N "" >/dev/null
  ok "SSH key oluşturuldu (parolasız ed25519)"
fi

if [[ -f "$SSH_CONFIG" ]] && grep -q "^Host ortaklasa-win" "$SSH_CONFIG" 2>/dev/null; then
  ok "SSH config zaten var (ortaklasa-win)"
else
  cat >> "$SSH_CONFIG" <<EOF

Host ortaklasa-win
    HostName $WIN_HOST
    User $WIN_USER
    IdentityFile $SSH_KEY
    ServerAliveInterval 30
    ServerAliveCountMax 3
EOF
  chmod 600 "$SSH_CONFIG"
  ok "SSH config eklendi (ortaklasa-win → $WIN_HOST)"
fi

# === 5/9 Pub key Win'e gönder (scp) ===
step "5/9  Pub key Win'e gönderiliyor"
warn "İlk seferde Windows kullanıcı parolası istenecek (sadece bu sefer)."
echo
info "Public key:"
echo "  $(cat "$SSH_KEY.pub")"
echo

if scp -o StrictHostKeyChecking=accept-new "$SSH_KEY.pub" \
       "$WIN_USER@$WIN_HOST:~/.ssh/from-mac.pub" 2>&1; then
  ok "Pub key Win'e kopyalandı: ~/.ssh/from-mac.pub"
  echo
  warn "Win'de PowerShell aç ve şu komutu çalıştır:"
  echo -e "${C}    npm run mac:authorize${N}"
  echo "  (veya manuel: PowerShell -ExecutionPolicy Bypass -File scripts\\win\\add-mac-key.ps1)"
else
  err "scp başarısız oldu. Sebep: SSH server kapalı / parola yanlış / network."
  warn "Manuel olarak Win'e ekle:"
  echo -e "${C}$(cat "$SSH_KEY.pub")${N}"
fi

# === 6/9 Repo clone ===
step "6/9  Repo clone"
if [[ -d "$CODE_DIR/.git" ]]; then
  ok "Repo zaten var: $CODE_DIR"
  cd "$CODE_DIR"
  git pull --ff-only 2>/dev/null || warn "git pull başarısız (lokal değişiklik var?)"
else
  mkdir -p "$(dirname "$CODE_DIR")"
  git clone "$REPO_URL" "$CODE_DIR"
  cd "$CODE_DIR"
  ok "Repo clone'landı: $CODE_DIR"
fi

# === 7/9 .env oluştur ===
step "7/9  .env oluşturma"
if [[ -f .env ]]; then
  ok ".env zaten var"
else
  cp .env.example .env
  # Mac değerlerini güncelle (BSD sed)
  if [[ -n "$TS_FQDN" ]]; then
    sed -i '' "s|^MAC_HOST=.*|MAC_HOST=$TS_FQDN|" .env
  fi
  ok ".env oluşturuldu (template'ten)"
  warn "PG_PASSWORD'u Win'deki .env'den kopyala (parolaları senkron tut):"
  info "  Mac'te:  vim .env"
  info "  Win'de:  Get-Content C:\\Users\\Barış\\Desktop\\ortaklasa\\.env | Select-String '^PG_PASSWORD'"
fi

# === 8/9 KNOWN_MACHINES auto-patch ===
step "8/9  KNOWN_MACHINES güncellemesi"
MAC_HOSTNAME=$(hostname | sed 's/\.local$//')
PLATFORM_FILE="scripts/lib/platform.mjs"

if [[ ! -f "$PLATFORM_FILE" ]]; then
  err "$PLATFORM_FILE bulunamadı. Repo eksik mi?"
  exit 1
fi

if grep -q "'$MAC_HOSTNAME'" "$PLATFORM_FILE"; then
  ok "$MAC_HOSTNAME zaten KNOWN_MACHINES'te"
else
  CORES=$(sysctl -n hw.ncpu)
  RAM_GB=$(($(sysctl -n hw.memsize) / 1024 / 1024 / 1024))

  # Node.js ile güvenli patch (regex multiline)
  node -e "
    const fs = require('fs');
    const p = '$PLATFORM_FILE';
    let c = fs.readFileSync(p, 'utf8');
    if (c.includes(\"'$MAC_HOSTNAME'\")) process.exit(0);

    const entry = \`  '$MAC_HOSTNAME': {
    role: 'client',
    tags: ['mac', 'ios', 'light'],
    cores: $CORES,
    ramGb: $RAM_GB,
    hasGpu: false,
    os: 'darwin',
    note: 'MacBook — istemci rolü',
  },
\`;

    // 1. Tercih: yorum satırının ('Mac onboarding (Aşama 7)') hemen üstüne
    const commentRe = /(\n  \/\/ Mac onboarding[^\n]*\n)/;
    if (commentRe.test(c)) {
      c = c.replace(commentRe, '\n' + entry + '\$1');
    } else {
      // 2. Fallback: KNOWN_MACHINES'in kapanış '};' satırından önce
      c = c.replace(/(\n};\nexport function currentMachine)/, '\n' + entry + '};\nexport function currentMachine');
    }
    fs.writeFileSync(p, c);
  "
  ok "KNOWN_MACHINES'e eklendi: $MAC_HOSTNAME ($CORES core / ${RAM_GB} GB)"
  warn "Bu değişikliği commit etmen gerekiyor (Win ile sync için):"
  info "  git add $PLATFORM_FILE && git commit -m 'feat: KNOWN_MACHINES — Mac eklendi' && git push"
fi

# === 9/9 npm install + doctor ===
step "9/9  npm install + doctor"
npm install --silent
ok "npm dependencies hazır"

echo
echo -e "${C}=== Doctor ===${N}"
npm run doctor || warn "Doctor uyarı verdi (opsiyonel araç eksik olabilir — normal)"

# === Sonuç ===
echo
echo -e "${G}╔════════════════════════════════════════╗${N}"
echo -e "${G}║  ✓  Mac onboarding TAMAMLANDI          ║${N}"
echo -e "${G}╚════════════════════════════════════════╝${N}"
echo
echo "Sıradaki adımlar:"
echo
echo -e "  ${B}1.${N} Win'de PowerShell aç → ${C}npm run mac:authorize${N}"
echo -e "     (Mac'in pub key'ini authorized_keys'e ekler)"
echo
echo -e "  ${B}2.${N} Mac'te SSH testi:"
echo -e "     ${C}ssh ortaklasa-win 'hostname'${N}  →  DESKTOP-ERT7724"
echo
echo -e "  ${B}3.${N} Mac'te smoke test:"
echo -e "     ${C}node scripts/test.mjs all${N}"
echo
echo -e "  ${B}4.${N} KNOWN_MACHINES değişikliğini push et:"
echo -e "     ${C}git add scripts/lib/platform.mjs && git commit -m 'feat: Mac eklendi' && git push${N}"
echo
