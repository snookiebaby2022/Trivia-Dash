param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Profile,
  [Parameter(Mandatory = $true, Position = 1)]
  [ValidateSet('android', 'ios')]
  [string]$Platform
)

# EAS cloud build without Git (fixes "git command not found" on Windows).
$env:EAS_NO_VCS = "1"
Set-Location (Split-Path $PSScriptRoot -Parent)
npx eas-cli build --profile $Profile --platform $Platform --non-interactive
