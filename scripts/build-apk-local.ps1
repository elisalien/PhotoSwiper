# Build PhotoSwiper APK locally (no EAS queue)
$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$jdk = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
$gradleHome = "C:\g"

if (-not (Test-Path $jdk)) {
  Write-Error "JDK 17 introuvable: $jdk"
}
if (-not (Test-Path "$sdk\platforms")) {
  Write-Error "Android SDK introuvable: $sdk"
}

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:JAVA_HOME = $jdk
$env:GRADLE_USER_HOME = $gradleHome
$env:Path = "$jdk\bin;$sdk\platform-tools;$env:Path"

New-Item -ItemType Directory -Force -Path $gradleHome | Out-Null
New-Item -ItemType Directory -Force -Path "$root\dist" | Out-Null

if (-not (Test-Path "$root\android")) {
  Write-Host ">> expo prebuild..."
  npx expo prebuild --platform android
}

$sdkProp = "sdk.dir=$($sdk -replace '\\', '\\')"
Set-Content -Path "$root\android\local.properties" -Value $sdkProp -Encoding ASCII

Write-Host ">> Gradle assembleRelease..."
Set-Location "$root\android"
.\gradlew.bat assembleRelease --no-daemon
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$src = "$root\android\app\build\outputs\apk\release\app-release.apk"
$dst = "$root\dist\PhotoSwiper-local.apk"
Copy-Item $src $dst -Force
Write-Host ""
Write-Host "APK pret: $dst"
Get-Item $dst | Format-List Name, Length, FullName
