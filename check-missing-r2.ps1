# Script para verificar quais spots de 40-20 estão faltando no R2

Write-Host "=== Verificando spots 40-20 ===" -ForegroundColor Cyan
Write-Host ""

# Spots locais
$localSpots = Get-ChildItem ".\spots\40-20" -Directory | Select-Object -ExpandProperty Name | Sort-Object
Write-Host "Spots LOCAIS (14):" -ForegroundColor Green
$localSpots | ForEach-Object { Write-Host "  - $_" }

Write-Host ""
Write-Host "=== Testando acesso ao R2 via CDN ===" -ForegroundColor Cyan

$cdnBase = "https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev"
$missingSpots = @()

foreach ($spot in $localSpots) {
    $url = "$cdnBase/spots/40-20/$spot/settings.json"
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -ErrorAction Stop
        Write-Host "✓ $spot" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ $spot (FALTANDO)" -ForegroundColor Red
        $missingSpots += $spot
    }
}

Write-Host ""
if ($missingSpots.Count -gt 0) {
    Write-Host "=== SPOTS FALTANDO NO R2 ($($missingSpots.Count)) ===" -ForegroundColor Red
    $missingSpots | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    
    Write-Host ""
    Write-Host "Para fazer upload dos spots faltando:" -ForegroundColor Cyan
    foreach ($spot in $missingSpots) {
        Write-Host "  wrangler r2 object put gto-wizard-spots/spots/40-20/$spot/settings.json --file=./spots/40-20/$spot/settings.json" -ForegroundColor Gray
        Write-Host "  wrangler r2 object put gto-wizard-spots/spots/40-20/$spot/equity.json --file=./spots/40-20/$spot/equity.json" -ForegroundColor Gray
        Write-Host "  wrangler r2 object put gto-wizard-spots/spots/40-20/$spot/nodes --file=./spots/40-20/$spot/nodes --recursive" -ForegroundColor Gray
        Write-Host ""
    }
}
else {
    Write-Host "✓ Todos os spots estão no R2!" -ForegroundColor Green
}
