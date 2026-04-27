# Mac'ten gelen public key'i authorized_keys'e ekler.
#
# Akış:
#   1. Mac'te scripts/mac/onboard.sh scp ile ~/.ssh/from-mac.pub'a kopyalar
#   2. Win'de bu script: from-mac.pub → authorized_keys (idempotent)
#   3. Permission düzelt + geçici dosyayı sil
#
# Kullanım:
#   npm run mac:authorize
#   PowerShell -ExecutionPolicy Bypass -File scripts\win\add-mac-key.ps1

$ErrorActionPreference = 'Stop'

$src  = Join-Path $env:USERPROFILE '.ssh\from-mac.pub'
$auth = Join-Path $env:USERPROFILE '.ssh\authorized_keys'

Write-Host ""
Write-Host "═══ Mac SSH key authorize ═══" -ForegroundColor Cyan

if (-not (Test-Path $src)) {
  Write-Host "✗ Bulunamadı: $src" -ForegroundColor Red
  Write-Host ""
  Write-Host "Önce Mac'te onboard.sh'in scp adımı çalışmalı:" -ForegroundColor Yellow
  Write-Host "  bash <(curl -fsSL https://raw.githubusercontent.com/eCy-coding/ortaklasa/main/scripts/mac/onboard.sh)"
  exit 1
}

$pubKey = (Get-Content $src -Raw).Trim()
if (-not $pubKey) {
  Write-Host "✗ from-mac.pub boş." -ForegroundColor Red
  exit 1
}
Write-Host "+ from-mac.pub okundu ($($pubKey.Length) karakter)" -ForegroundColor Green

# authorized_keys yoksa oluştur
if (-not (Test-Path $auth)) {
  New-Item -ItemType File -Path $auth -Force | Out-Null
  Write-Host "+ authorized_keys oluşturuldu" -ForegroundColor Yellow
}

# Idempotent ekleme (zaten varsa atla)
$existing = Get-Content $auth -Raw -ErrorAction SilentlyContinue
if ($existing -and $existing.Contains($pubKey)) {
  Write-Host "○ Bu pub key zaten authorized_keys'te (eklenmedi)." -ForegroundColor Yellow
} else {
  # Newline ile ekle (sondaki LF garantili)
  if ($existing -and -not $existing.EndsWith("`n")) {
    Add-Content -Path $auth -Value "" -Encoding UTF8
  }
  Add-Content -Path $auth -Value $pubKey -Encoding UTF8
  Write-Host "✓ Pub key eklendi: $auth" -ForegroundColor Green
}

# Permission'ı sıkılaştır (sshd StrictModes için zorunlu)
$sid = ([Security.Principal.WindowsIdentity]::GetCurrent()).User.Value
icacls $auth /inheritance:r 2>&1 | Out-Null
icacls $auth /grant:r "*${sid}:F" "*S-1-5-18:F" "*S-1-5-32-544:F" 2>&1 | Out-Null
Write-Host "✓ İzinler sıkılaştırıldı (sadece kullanıcı + SYSTEM + Administrators)" -ForegroundColor Green

# Geçici dosyayı sil
Remove-Item $src -Force
Write-Host "✓ Geçici dosya silindi: from-mac.pub" -ForegroundColor Green

Write-Host ""
Write-Host "Mac'ten test et:" -ForegroundColor Cyan
Write-Host "  ssh ortaklasa-win 'hostname'" -ForegroundColor White
Write-Host "  → DESKTOP-ERT7724 (parolasız)" -ForegroundColor DarkGray
Write-Host ""
