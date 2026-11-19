$host.UI.RawUI.WindowTitle = "HI IN Property Directory - Local Server"
Set-Location $PSScriptRoot

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  HI IN Property Directory - Starting Servers" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
