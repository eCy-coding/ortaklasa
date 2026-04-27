# Aşama 3 — Windows'ta OpenSSH Server kurulumu (yönetici PowerShell gerekir).
#
# Kullanım (yönetici PowerShell olarak):
#   Set-Location <repo-path>
#   PowerShell -ExecutionPolicy Bypass -File .\scripts\win\install-openssh.ps1
#
# Bu script ATOMIC değildir — her adım bağımsız hata verebilir; -ErrorAction Stop
# ile ilk hatada durur. Geri al: Aşama 3 rollback (master prompt §9).

#Requires -RunAsAdministrator

$ErrorActionPreference = 'Stop'
Write-Host "=== Aşama 3 — OpenSSH Server kurulum ===" -ForegroundColor Cyan

# 1) Capability ekle
Write-Host "[1/5] OpenSSH.Server capability ekleniyor..."
$cap = Get-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0'
if ($cap.State -eq 'Installed') {
    Write-Host "    zaten yüklü, atlandı."
} else {
    Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0 | Out-Null
    Write-Host "    ✓ kuruldu."
}

# 2) Servisi başlat + otomatik başlatma
Write-Host "[2/5] sshd servisi başlatılıyor..."
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'
Get-Service sshd | Select-Object Name, Status, StartType | Format-Table -AutoSize

# 3) Firewall kuralı (varsayılan kural OpenSSH-Server-In-TCP gelir)
Write-Host "[3/5] Firewall kuralı kontrol..."
$rule = Get-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -ErrorAction SilentlyContinue
if ($rule) {
    Enable-NetFirewallRule -Name 'OpenSSH-Server-In-TCP'
    Write-Host "    ✓ aktif."
} else {
    Write-Host "    Kural bulunamadı; manuel ekleniyor..."
    New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' `
        -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 | Out-Null
}

# 4) authorized_keys hazırla
Write-Host "[4/5] authorized_keys dosyası..."
$sshDir = Join-Path $env:USERPROFILE '.ssh'
$authPath = Join-Path $sshDir 'authorized_keys'
if (-not (Test-Path $sshDir))   { New-Item -ItemType Directory -Path $sshDir -Force | Out-Null }
if (-not (Test-Path $authPath)) {
    New-Item -ItemType File -Path $authPath -Force | Out-Null
    icacls $authPath /inheritance:r | Out-Null
    icacls $authPath /grant:r "$($env:USERNAME):F" "SYSTEM:F" "Administrators:F" | Out-Null
    Write-Host "    ✓ oluşturuldu (boş): $authPath"
} else {
    Write-Host "    zaten var: $authPath"
}

# 5) sshd_config sıkılaştır (opsiyonel — şablon kopyala)
Write-Host "[5/5] sshd_config şablonu..."
$src = Join-Path $PSScriptRoot '..\..\config\sshd\sshd_config.tailnet.template'
$dst = Join-Path $env:ProgramData 'ssh\sshd_config'
if (Test-Path $src) {
    Write-Host "    Şablon: $src"
    Write-Host "    Hedef : $dst"
    Write-Host "    Bu adım manuel — şablonu inceleyip ListenAddress satırını"
    Write-Host "    Tailscale IP'n ile doldur (tailscale ip -4), sonra:"
    Write-Host "      Stop-Service sshd"
    Write-Host "      Copy-Item '$src' '$dst' -Force"
    Write-Host "      Start-Service sshd"
}

Write-Host ""
Write-Host "=== KURULUM TAMAM ===" -ForegroundColor Green
Write-Host "Sıradaki adım: Mac'ten public key'i $authPath dosyasına ekle."
Write-Host "Test (Mac'ten): ssh $env:USERNAME@$env:COMPUTERNAME 'hostname'"
