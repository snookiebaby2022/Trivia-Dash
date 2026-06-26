# Local Play release AAB — version 1.0.0 / versionCode 13
# Requires: JDK 17+, Android SDK, Expo upload keystore in android/

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$Sdk = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $Sdk)) {
    Write-Error "Android SDK not found at $Sdk. Install Android Studio or command-line tools."
}
$env:ANDROID_HOME = $Sdk
$env:ANDROID_SDK_ROOT = $Sdk

# Short path avoids Windows MAX_PATH failures in Gradle transform caches
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
    Write-Host "PLAY UPLOAD KEY REQUIRED (v10 was signed with Expo credentials)" -ForegroundColor Yellow
    Write-Host "1. Open https://expo.dev/accounts/snookiebaby/projects/trivia-dash/credentials"
    Write-Host "2. Android → Production → Keystore → Download"
    Write-Host "3. Save as android\upload-keystore.jks"
    Write-Host "4. Copy android\keystore.properties.example → android\keystore.properties"
    Write-Host "5. Fill storePassword, keyPassword, keyAlias from the Expo download"
    Write-Host ""
    Write-Error "Missing android/keystore.properties or android/upload-keystore.jks"
}

Write-Host "Building release AAB (1.0.0 / versionCode 13)..."
Push-Location android
try {
    & .\gradlew.bat bundleRelease --no-daemon
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

$Src = Join-Path $PWD "android\app\build\outputs\bundle\release\app-release.aab"
$Dst = Join-Path $PWD "TriviaDash-1.0.0-v13.aab"
Copy-Item $Src $Dst -Force
$Size = (Get-Item $Dst).Length
Write-Host ""
Write-Host "Done: $Dst ($([math]::Round($Size/1MB, 1)) MB)" -ForegroundColor Green
Write-Host "Upload to Play Console → Internal testing → Create release"
