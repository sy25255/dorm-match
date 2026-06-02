$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$url = "http://127.0.0.1:5173/dorm-match/"

function Test-Preview {
  try {
    $res = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 $url
    return [int]$res.StatusCode -lt 500
  } catch {
    return $false
  }
}

if (Test-Preview) {
  Write-Host "Local preview is already running: $url"
  exit 0
}

$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$out = Join-Path $root "vite-dev.out.log"
$err = Join-Path $root "vite-dev.err.log"

Start-Process `
  -FilePath $npm `
  -ArgumentList @("run", "dev", "--", "--host", "0.0.0.0", "--port", "5173") `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput $out `
  -RedirectStandardError $err

for ($i = 0; $i -lt 25; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Preview) {
    Write-Host "Local preview started: $url"
    exit 0
  }
}

Write-Error "Local preview did not become ready. Check frontend/vite-dev.err.log"
