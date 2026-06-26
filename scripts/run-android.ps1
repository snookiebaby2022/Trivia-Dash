# Local Android build — requires Android Studio + a running emulator or USB device.
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path "$sdk\platform-tools\adb.exe")) {
  Write-Error "Android SDK not found at $sdk. Install Android Studio, or use cloud build: npm run build:dev:android"
  exit 1
}

$env:ANDROID_HOME = $sdk
$env:Path = "$sdk\platform-tools;$sdk\emulator;$env:Path"

$devices = & adb devices | Select-String "device$"
if (-not $devices) {
  Write-Host "No emulator/device detected. Open Android Studio -> Device Manager -> start a virtual device, then retry."
  exit 1
}

Set-Location (Split-Path $PSScriptRoot -Parent)
npx expo run:android @args
