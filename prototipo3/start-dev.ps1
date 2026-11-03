$ErrorActionPreference = 'Stop'

$backendPath = Join-Path $PSScriptRoot 'backend'
$frontendPath = Join-Path $PSScriptRoot 'frontend'

Start-Process -FilePath 'powershell.exe' -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location -LiteralPath '$backendPath'; npm run dev"
)

Start-Process -FilePath 'powershell.exe' -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location -LiteralPath '$frontendPath'; npm run dev"
)

Write-Host 'Backend: http://127.0.0.1:4000/api/health'
Write-Host 'Frontend: http://127.0.0.1:3000'
