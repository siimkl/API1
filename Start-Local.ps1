$ErrorActionPreference = "Stop"

$siteDirectory = Join-Path $PSScriptRoot "dist"
$localUrl = "http://localhost:8765"

if (-not (Test-Path -LiteralPath (Join-Path $siteDirectory "index.html"))) {
    throw "The local site build was not found in: $siteDirectory"
}

Write-Host "API päringulabor käivitub aadressil $localUrl" -ForegroundColor Cyan
Write-Host "Kohaliku serveri peatamiseks vajuta Ctrl+C." -ForegroundColor DarkGray

Start-Process $localUrl
python -m http.server 8765 --bind 127.0.0.1 --directory $siteDirectory
