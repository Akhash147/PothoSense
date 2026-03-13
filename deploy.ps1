# ================================================================
#  PothoSense v4 Deploy Script
#  Place this file at: E:\Pothosense\deploy.ps1
#  Run with: powershell -ExecutionPolicy Bypass -File "E:\Pothosense\deploy.ps1"
#
#  All new files (backend\, frontend\, mobile\ subfolders of THIS
#  script's location) must also be in E:\Pothosense\
# ================================================================

$Root        = "E:\Pothosense"
$BackendDir  = "$Root\backend\routes"
$FrontendDir = "$Root\frontend\src"
$MobileDir   = "$Root\pothosense-expo\app"
$CompDir     = "$Root\pothosense-expo\components"

#  Helpers 
function CopyFile {
    param($Src, $Dst)
    if (-not (Test-Path $Src)) {
        Write-Host "  SKIP (file not found): $Src" -ForegroundColor DarkGray
        return
    }
    $DstDir = Split-Path $Dst
    if (-not (Test-Path $DstDir)) {
        New-Item -ItemType Directory -Path $DstDir -Force | Out-Null
    }
    Copy-Item $Src $Dst -Force
    Write-Host "  OK   $Dst" -ForegroundColor Green
}

function DeleteFile {
    param($Path)
    if (Test-Path $Path) {
        Remove-Item $Path -Force
        Write-Host "  DEL  $Path" -ForegroundColor Yellow
    } else {
        Write-Host "  SKIP (not found): $Path" -ForegroundColor DarkGray
    }
}

#  Banner 
Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  PothoSense v4 Deploy" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta

# ================================================================
#  BACKEND
# ================================================================
Write-Host ""
Write-Host "[1/3] BACKEND" -ForegroundColor Cyan

CopyFile "$Root\auth_v4.js"             "$BackendDir\auth.js"
CopyFile "$Root\assignments.js"         "$BackendDir\assignments.js"
CopyFile "$Root\schema_migration_v4.sql" "$Root\backend\schema_migration_v4.sql"

# Patch server.js  add assignments route if not already there
$serverFile = "$Root\backend\server.js"
if (Test-Path $serverFile) {
    $content = Get-Content $serverFile -Raw
    if ($content -notmatch "assignmentsRouter") {
        Write-Host "  Patching server.js..." -ForegroundColor Yellow
        $line1   = "const assignmentsRouter = require('./routes/assignments');"
        $line2   = "app.use('/api/assignments', assignmentsRouter);"
        $newline = [System.Environment]::NewLine
        $inject  = $line1 + $newline + $line2 + $newline
        $content = $content -replace "app\.listen\(", ($inject + "app.listen(")
        Set-Content -Path $serverFile -Value $content -Encoding UTF8
        Write-Host "  OK   assignments route added to server.js" -ForegroundColor Green
    } else {
        Write-Host "  SKIP assignments route already in server.js" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  WARN server.js not found at $serverFile" -ForegroundColor Red
}

Write-Host "  --> Run schema_migration_v4.sql in MySQL Workbench!" -ForegroundColor Yellow

# ================================================================
#  FRONTEND (Web)
# ================================================================
Write-Host ""
Write-Host "[2/3] FRONTEND (Web)" -ForegroundColor Cyan

CopyFile "$Root\App_v4.js"              "$FrontendDir\App.js"
CopyFile "$Root\SupervisorDashboard.js" "$FrontendDir\pages\SupervisorDashboard.js"
CopyFile "$Root\SupervisorLogin.js"     "$FrontendDir\pages\SupervisorLogin.js"
CopyFile "$Root\Navbar.js"              "$FrontendDir\components\Navbar.js"
CopyFile "$Root\CitizenAuth.js"         "$FrontendDir\pages\CitizenAuth.js"
CopyFile "$Root\StaffLogin.js"          "$FrontendDir\pages\StaffLogin.js"
CopyFile "$Root\StaffDashboard.js"      "$FrontendDir\pages\StaffDashboard.js"
CopyFile "$Root\WebAITranslator.js"     "$FrontendDir\utils\AITranslator.js"

Write-Host "  --> Also update AppContext.js manually (see AppContext_patch.js)" -ForegroundColor Yellow

# ================================================================
#  MOBILE (Expo)
# ================================================================
Write-Host ""
Write-Host "[3/3] MOBILE (Expo)" -ForegroundColor Cyan

# Delete old sub-layout files  these are the cause of routing errors
Write-Host "  Removing old _layout.js files that break routing..." -ForegroundColor Yellow
DeleteFile "$MobileDir\citizen\_layout.js"
DeleteFile "$MobileDir\staff\_layout.js"

# Root layout
CopyFile "$Root\app_layout_FINAL.js"                    "$MobileDir\_layout.js"

# Home screen
CopyFile "$Root\index_screen.js"                        "$MobileDir\index.js"

# Citizen screens
CopyFile "$Root\citizen_login.js"                       "$MobileDir\citizen\login.js"
CopyFile "$Root\citizen_report.js"                      "$MobileDir\citizen\report.js"
CopyFile "$Root\citizen_my_reports.js"                  "$MobileDir\citizen\my-reports.js"
CopyFile "$Root\citizen_track.js"                       "$MobileDir\citizen\track.js"

# Staff screens
CopyFile "$Root\staff_login.js"                         "$MobileDir\staff\login.js"
CopyFile "$Root\staff_dashboard.js"                     "$MobileDir\staff\dashboard.js"

# Supervisor screens (new)
CopyFile "$Root\supervisor_login.js"                    "$MobileDir\supervisor\login.js"
CopyFile "$Root\supervisor_dashboard.js"                "$MobileDir\supervisor\dashboard.js"

# Components
CopyFile "$Root\BottomNav.js"                           "$CompDir\BottomNav.js"

Write-Host "  --> Also update AppContext.js manually (see AppContext_supervisor_additions.js)" -ForegroundColor Yellow

#  Done 
Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  Files copied!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Do these steps IN ORDER to finish:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. MySQL Workbench: run schema_migration_v4.sql" -ForegroundColor White
Write-Host "  2. Update AppContext.js (see AppContext_patch.js and" -ForegroundColor White
Write-Host "     AppContext_supervisor_additions.js)" -ForegroundColor White
Write-Host "  3. Start backend:" -ForegroundColor White
Write-Host "       cd E:\Pothosense\backend" -ForegroundColor DarkGray
Write-Host "       node server.js" -ForegroundColor DarkGray
Write-Host "  4. Start frontend:" -ForegroundColor White
Write-Host "       cd E:\Pothosense\frontend" -ForegroundColor DarkGray
Write-Host "       npm start" -ForegroundColor DarkGray
Write-Host "  5. Start Expo (--clear wipes stale cache):" -ForegroundColor White
Write-Host "       cd E:\Pothosense\pothosense-expo" -ForegroundColor DarkGray
Write-Host "       npx expo start --clear" -ForegroundColor DarkGray
Write-Host ""
