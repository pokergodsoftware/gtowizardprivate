# Upload completo de todos os spots para Cloudflare R2
# Com barra de progresso e tratamento de erros

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"
$BUCKET = "gto-wizard-spots"

# Cores
$colorSuccess = "Green"
$colorError = "Red"
$colorInfo = "Cyan"
$colorWarning = "Yellow"

Write-Host "=======================================" -ForegroundColor $colorInfo
Write-Host "Upload COMPLETO de Spots para R2" -ForegroundColor $colorInfo
Write-Host "=======================================" -ForegroundColor $colorInfo
Write-Host ""

# Contar total de spots
$categories = @("100-60", "60-40", "40-20", "near_bubble", "after_bubble", "2tables", "3tables", "final_table")
$totalSpots = 0
foreach ($cat in $categories) {
    $count = (Get-ChildItem ".\spots\$cat" -Directory -ErrorAction SilentlyContinue).Count
    $totalSpots += $count
}

Write-Host "Total de spots a enviar: $totalSpots" -ForegroundColor $colorInfo
Write-Host "Modo: $(if ($DryRun) { 'DRY RUN (simulação)' } else { 'REAL UPLOAD' })" -ForegroundColor $(if ($DryRun) { $colorWarning } else { $colorSuccess })
Write-Host ""

if (-not $DryRun) {
    $confirm = Read-Host "Deseja continuar? (S/N)"
    if ($confirm -ne "S" -and $confirm -ne "s") {
        Write-Host "Upload cancelado." -ForegroundColor $colorWarning
        exit
    }
}

Write-Host ""
$totalFiles = 0
$successFiles = 0
$errorFiles = 0
$currentSpot = 0

foreach ($cat in $categories) {
    $spots = Get-ChildItem ".\spots\$cat" -Directory -ErrorAction SilentlyContinue | Sort-Object Name
    
    if ($spots.Count -eq 0) {
        continue
    }
    
    Write-Host "[$cat] $($spots.Count) spots" -ForegroundColor $colorInfo
    Write-Host ("=" * 60)
    
    foreach ($spot in $spots) {
        $currentSpot++
        $percentComplete = [math]::Round(($currentSpot / $totalSpots) * 100, 1)
        
        Write-Progress -Activity "Upload de Spots" `
            -Status "$currentSpot de $totalSpots - $cat/$($spot.Name)" `
            -PercentComplete $percentComplete
        
        Write-Host "  [$currentSpot/$totalSpots] $($spot.Name)" -NoNewline
        
        $spotErrors = 0
        
        # Upload settings.json
        $settingsPath = Join-Path $spot.FullName "settings.json"
        if (Test-Path $settingsPath) {
            $totalFiles++
            if (-not $DryRun) {
                $result = wrangler r2 object put "$BUCKET/spots/$cat/$($spot.Name)/settings.json" --file="$settingsPath" 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $successFiles++
                } else {
                    $errorFiles++
                    $spotErrors++
                }
            } else {
                $successFiles++
            }
        }
        
        # Upload equity.json
        $equityPath = Join-Path $spot.FullName "equity.json"
        if (Test-Path $equityPath) {
            $totalFiles++
            if (-not $DryRun) {
                $result = wrangler r2 object put "$BUCKET/spots/$cat/$($spot.Name)/equity.json" --file="$equityPath" 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $successFiles++
                } else {
                    $errorFiles++
                    $spotErrors++
                }
            } else {
                $successFiles++
            }
        }
        
        # Upload nodes
        $nodesPath = Join-Path $spot.FullName "nodes"
        if (Test-Path $nodesPath) {
            $nodeFiles = Get-ChildItem "$nodesPath\*.json"
            foreach ($nodeFile in $nodeFiles) {
                $totalFiles++
                if (-not $DryRun) {
                    $result = wrangler r2 object put "$BUCKET/spots/$cat/$($spot.Name)/nodes/$($nodeFile.Name)" --file="$($nodeFile.FullName)" 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        $successFiles++
                    } else {
                        $errorFiles++
                        $spotErrors++
                    }
                } else {
                    $successFiles++
                }
            }
        }
        
        if ($spotErrors -eq 0) {
            Write-Host " ✓" -ForegroundColor $colorSuccess
        } else {
            Write-Host " ✗ ($spotErrors erros)" -ForegroundColor $colorError
        }
    }
    
    Write-Host ""
}

Write-Progress -Activity "Upload de Spots" -Completed

Write-Host ""
Write-Host "=======================================" -ForegroundColor $colorInfo
Write-Host "RESUMO DO UPLOAD" -ForegroundColor $colorInfo
Write-Host "=======================================" -ForegroundColor $colorInfo
Write-Host "Spots processados: $currentSpot de $totalSpots" -ForegroundColor $colorSuccess
Write-Host "Arquivos enviados: $successFiles de $totalFiles" -ForegroundColor $colorSuccess
Write-Host "Erros: $errorFiles" -ForegroundColor $(if ($errorFiles -gt 0) { $colorError } else { $colorSuccess })
Write-Host ""

if (-not $DryRun -and $errorFiles -eq 0) {
    Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor $colorInfo
    Write-Host "1. Upload do metadata:" -ForegroundColor $colorWarning
    Write-Host "   wrangler r2 object put $BUCKET/solutions-metadata.json --file=./solutions-metadata.json"
    Write-Host "   wrangler r2 object put $BUCKET/solutions.json --file=./solutions.json"
    Write-Host ""
    Write-Host "2. Aguarde 5-10 minutos para propagação do CDN" -ForegroundColor $colorWarning
    Write-Host ""
    Write-Host "3. Teste: https://gtowizardprivate.vercel.app" -ForegroundColor $colorWarning
    Write-Host ""
    
    $uploadMetadata = Read-Host "Deseja fazer upload do metadata agora? (S/N)"
    if ($uploadMetadata -eq "S" -or $uploadMetadata -eq "s") {
        Write-Host ""
        Write-Host "Fazendo upload do metadata..." -ForegroundColor $colorInfo
        wrangler r2 object put "$BUCKET/solutions-metadata.json" --file="./solutions-metadata.json"
        wrangler r2 object put "$BUCKET/solutions.json" --file="./solutions.json"
        Write-Host "Metadata enviado! ✓" -ForegroundColor $colorSuccess
    }
}

Write-Host ""
Write-Host "Concluído!" -ForegroundColor $colorSuccess
