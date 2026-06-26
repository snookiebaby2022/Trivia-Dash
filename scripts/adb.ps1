# Run adb with Android SDK platform-tools (no PATH setup required).
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdk\platform-tools\adb.exe"

if (-not (Test-Path $adb)) {
  Write-Host "adb not found at: $adb" -ForegroundColor Red
  Write-Host ""
  Write-Host "Install Android Studio, then SDK Manager -> Android SDK Platform-Tools"
  Write-Host "Or: winget install Google.PlatformTools"
  exit 1
}

& $adb @args
