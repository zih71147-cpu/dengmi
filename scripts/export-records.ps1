# Export quiz records (deduped by student id, no ranking) to a folder.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\export-records.ps1 [-OutDir <path>]
param(
    [string]$OutDir = [Environment]::GetFolderPath('Desktop')
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
    $candidate = Join-Path $env:LOCALAPPDATA 'PortableNode\node.exe'
    if (Test-Path $candidate) { $node = $candidate }
}
if (-not $node) { throw 'node.exe not found (install Node.js or set PATH)' }

Write-Host "[export] out dir: $OutDir" -ForegroundColor Cyan
& $node (Join-Path $root 'scripts\export-records.cjs') $OutDir
exit $LASTEXITCODE
