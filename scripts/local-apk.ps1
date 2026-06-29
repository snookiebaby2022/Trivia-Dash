# Local release APK - runs prebuild (Play Games SDK) then Gradle assembleRelease
# Requires: JDK 17+, Android SDK, upload keystore in android/

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Import-DotEnv {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith('#')) { return }
        $eq = $line.IndexOf('=')
        if ($eq -lt 1) { return }
        $name = $line.Substring(0, $eq).Trim()
        $value = $line.Substring($eq + 1).Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}

Import-DotEnv (Join-Path $PWD ".env")

$appJson = Get-Content (Join-Path $PWD "app.json") -Raw | ConvertFrom-Json
$versionCode = $appJson.expo.android.versionCode
$versionName = $appJson.expo.android.versionName
if (-not $versionName) { $versionName = $appJson.expo.version }

$Sdk = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $Sdk)) {
    Write-Error "Android SDK not found at $Sdk. Install Android Studio or command-line tools."
}
$env:ANDROID_HOME = $Sdk
$env:ANDROID_SDK_ROOT = $Sdk

$GradleHome = "C:\gradle-cache"
if (-not (Test-Path $GradleHome)) {
    New-Item -ItemType Directory -Path $GradleHome -Force | Out-Null
}
$env:GRADLE_USER_HOME = $GradleHome
Write-Host "GRADLE_USER_HOME=$GradleHome"

$Java = Get-ChildItem "C:\Program Files\Microsoft\jdk-*\bin\java.exe" -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
if (-not $Java) {
    $Java = (Get-Command java -ErrorAction SilentlyContinue).Source
}
if (-not $Java) {
    Write-Error "JDK not found. Install: winget install Microsoft.OpenJDK.17"
}
$env:JAVA_HOME = Split-Path (Split-Path $Java -Parent) -Parent
Write-Host "JAVA_HOME=$($env:JAVA_HOME)"

$KeystoreProps = Join-Path $PWD "android\keystore.properties"
$KeystoreFile = Join-Path $PWD "android\upload-keystore.jks"
if (-not (Test-Path $KeystoreProps) -or -not (Test-Path $KeystoreFile)) {
    Write-Host ""
    Write-Host "PLAY UPLOAD KEY REQUIRED" -ForegroundColor Yellow
    Write-Host "1. Open https://expo.dev/accounts/snookiebaby/projects/trivia-dash/credentials"
    Write-Host "2. Android - Production - Keystore - Download"
    Write-Host "3. Save as android\upload-keystore.jks"
    Write-Host "4. Copy android\keystore.properties.example to android\keystore.properties"
    Write-Host ""
    Write-Error "Missing android/keystore.properties or android/upload-keystore.jks"
}

if ($env:EXPO_PUBLIC_PLAY_GAMES_APP_ID) {
    Write-Host "Play Games APP_ID=$($env:EXPO_PUBLIC_PLAY_GAMES_APP_ID)"
}
else {
    Write-Host "WARNING: EXPO_PUBLIC_PLAY_GAMES_APP_ID not set in .env" -ForegroundColor Yellow
}

Write-Host "Running expo prebuild (android)..."
npx expo prebuild --platform android --no-install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Building release APK ($versionName / versionCode $versionCode)..."
Push-Location android
try {
    & .\gradlew.bat assembleRelease --no-daemon
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}

$Src = Join-Path $PWD "android\app\build\outputs\apk\release\app-release.apk"
$Dst = Join-Path $PWD "TriviaDash-$versionName-v$versionCode.apk"
Copy-Item $Src $Dst -Force
$Size = (Get-Item $Dst).Length
Write-Host ""
Write-Host "Done: $Dst ($([math]::Round($Size/1MB, 1)) MB)" -ForegroundColor Green
Write-Host "Install: adb install -r `"$Dst`""
