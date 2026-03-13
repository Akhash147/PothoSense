# deploy_all.ps1
# Run this from E:\Pothosense\
# It copies every fixed file to the correct location using proper UTF-8 encoding

param([string]$root = "E:\Pothosense")

$fe    = "$root\frontend\src"
$expo  = "$root\pothosense-expo"
$back  = "$root\backend"

function Put {
  param($src, $dst)
  $dir = Split-Path $dst -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  # Read as UTF-8, write as UTF-8 without BOM
  $text = [System.IO.File]::ReadAllText($src, [System.Text.Encoding]::UTF8)
  $enc  = New-Object System.Text.UTF8Encoding $false   # $false = no BOM
  [System.IO.File]::WriteAllText($dst, $text, $enc)
  Write-Host "  -> $dst" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "PothoSense - Deploy All Fixes" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# --- BACKEND ---
Write-Host "[1] Backend" -ForegroundColor Yellow
Put "$root\analytics.js"   "$back\routes\analytics.js"
Put "$root\auth.js"        "$back\routes\auth.js"
Put "$root\server.js"      "$back\server.js"
Write-Host "    Backend done" -ForegroundColor Green

# --- FRONTEND website ---
Write-Host "[2] Frontend website" -ForegroundColor Yellow
Put "$root\Navbar.js"        "$fe\components\Navbar.js"
Put "$root\CitizenAuth.js"   "$fe\pages\CitizenAuth.js"
Put "$root\StaffLogin.js"    "$fe\pages\StaffLogin.js"
Put "$root\StaffDashboard.js" "$fe\pages\StaffDashboard.js"
Put "$root\Leaderboard.js"   "$fe\pages\Leaderboard.js"
Put "$root\VerifyRepairs.js" "$fe\pages\VerifyRepairs.js"
Put "$root\PotholeMap.js"    "$fe\pages\PotholeMap.js"
Put "$root\RouteSafety.js"   "$fe\pages\RouteSafety.js"
Put "$root\translations.js"  "$fe\i18n\translations.js"
Write-Host "    Frontend done" -ForegroundColor Green

# --- MOBILE app ---
Write-Host "[3] Mobile (Expo)" -ForegroundColor Yellow
Put "$root\app_layout.js"            "$expo\app\_layout.js"
Put "$root\app.json"                  "$expo\app.json"
Put "$root\api.js"                    "$expo\utils\api.js"
Put "$root\NotificationsScreen.js"    "$expo\app\notifs\index.js"
Put "$root\GamificationScreen.js"     "$expo\app\badges\index.js"
Put "$root\MapScreen.js"              "$expo\app\map\index.js"
Put "$root\RouteSafetyScreen.js"      "$expo\app\safety\index.js"
Put "$root\VerifyRepairsScreen.js"    "$expo\app\verify\index.js"
Write-Host "    Mobile done" -ForegroundColor Green

Write-Host ""
Write-Host "All files deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Open api.js and set your PC's IP address" -ForegroundColor White
Write-Host "     File: $expo\utils\api.js" -ForegroundColor DarkGray
Write-Host "     Run 'ipconfig' in cmd to find your IPv4 address" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  2. Restart backend:" -ForegroundColor White
Write-Host "     cd $back && node server.js" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  3. Restart frontend:" -ForegroundColor White
Write-Host "     cd $root\frontend && npm start" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  4. Restart Expo (MUST use --clear):" -ForegroundColor White
Write-Host "     cd $expo && npx expo start --clear" -ForegroundColor DarkGray
Write-Host ""
