# Sync docs/obsidian → OneDrive Obsidian vault
$src = Join-Path $PSScriptRoot "..\docs\obsidian"
$dst = Join-Path $env:USERPROFILE "OneDrive\Documents\Obsidian Vault\Raafat-Furniture"

if (-not (Test-Path $src)) {
  Write-Error "Source not found: $src"
  exit 1
}

New-Item -ItemType Directory -Force -Path $dst | Out-Null

Get-ChildItem $src -Filter "*.md" | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $dst $_.Name) -Force
  Write-Host "Synced $($_.Name)"
}

# Optional: copy README as vault hint
if (Test-Path (Join-Path $src "README.md")) {
  Copy-Item (Join-Path $src "README.md") (Join-Path $dst "README.md") -Force
}

Write-Host "Done → $dst"
