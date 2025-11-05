@echo off
REM Upload COMPLETO de todos os spots para Cloudflare R2
REM Este script faz upload de TODAS as categorias de spots

echo ========================================
echo Upload COMPLETO de Spots para R2
echo ========================================
echo.
echo Total de spots a enviar: 147
echo Categorias: 8
echo.
echo AVISO: Este processo pode demorar 30-60 minutos
echo dependendo da quantidade de nodes em cada spot.
echo.
pause
echo.

set BUCKET=gto-wizard-spots
set TOTAL=0
set ERRORS=0

echo [1/8] Uploading 100-60 (28 spots)...
echo ----------------------------------------
for /d %%s in (spots\100-60\*) do (
    set /a TOTAL+=1
    echo [!TOTAL!] %%~nxs
    wrangler r2 object put %BUCKET%/spots/100-60/%%~nxs/settings.json --file=%%s\settings.json 2>nul || set /a ERRORS+=1
    wrangler r2 object put %BUCKET%/spots/100-60/%%~nxs/equity.json --file=%%s\equity.json 2>nul || set /a ERRORS+=1
    for %%f in (%%s\nodes\*.json) do (
        wrangler r2 object put %BUCKET%/spots/100-60/%%~nxs/nodes/%%~nxf --file=%%f 2>nul || set /a ERRORS+=1
    )
)
echo.

echo [2/8] Uploading 60-40 (25 spots)...
echo ----------------------------------------
for /d %%s in (spots\60-40\*) do (
    set /a TOTAL+=1
    echo [!TOTAL!] %%~nxs
    wrangler r2 object put %BUCKET%/spots/60-40/%%~nxs/settings.json --file=%%s\settings.json 2>nul || set /a ERRORS+=1
    wrangler r2 object put %BUCKET%/spots/60-40/%%~nxs/equity.json --file=%%s\equity.json 2>nul || set /a ERRORS+=1
    for %%f in (%%s\nodes\*.json) do (
        wrangler r2 object put %BUCKET%/spots/60-40/%%~nxs/nodes/%%~nxf --file=%%f 2>nul || set /a ERRORS+=1
    )
)
echo.

echo [3/8] Uploading 40-20 (14 spots)...
echo ----------------------------------------
for /d %%s in (spots\40-20\*) do (
    set /a TOTAL+=1
    echo [!TOTAL!] %%~nxs
    wrangler r2 object put %BUCKET%/spots/40-20/%%~nxs/settings.json --file=%%s\settings.json 2>nul || set /a ERRORS+=1
    wrangler r2 object put %BUCKET%/spots/40-20/%%~nxs/equity.json --file=%%s\equity.json 2>nul || set /a ERRORS+=1
    for %%f in (%%s\nodes\*.json) do (
        wrangler r2 object put %BUCKET%/spots/40-20/%%~nxs/nodes/%%~nxf --file=%%f 2>nul || set /a ERRORS+=1
    )
)
echo.

echo [4/8] Uploading near_bubble (11 spots)...
echo ----------------------------------------
for /d %%s in (spots\near_bubble\*) do (
    set /a TOTAL+=1
    echo [!TOTAL!] %%~nxs
    wrangler r2 object put %BUCKET%/spots/near_bubble/%%~nxs/settings.json --file=%%s\settings.json 2>nul || set /a ERRORS+=1
    wrangler r2 object put %BUCKET%/spots/near_bubble/%%~nxs/equity.json --file=%%s\equity.json 2>nul || set /a ERRORS+=1
    for %%f in (%%s\nodes\*.json) do (
        wrangler r2 object put %BUCKET%/spots/near_bubble/%%~nxs/nodes/%%~nxf --file=%%f 2>nul || set /a ERRORS+=1
    )
)
echo.

echo [5/8] Uploading after_bubble (20 spots)...
echo ----------------------------------------
for /d %%s in (spots\after_bubble\*) do (
    set /a TOTAL+=1
    echo [!TOTAL!] %%~nxs
    wrangler r2 object put %BUCKET%/spots/after_bubble/%%~nxs/settings.json --file=%%s\settings.json 2>nul || set /a ERRORS+=1
    wrangler r2 object put %BUCKET%/spots/after_bubble/%%~nxs/equity.json --file=%%s\equity.json 2>nul || set /a ERRORS+=1
    for %%f in (%%s\nodes\*.json) do (
        wrangler r2 object put %BUCKET%/spots/after_bubble/%%~nxs/nodes/%%~nxf --file=%%f 2>nul || set /a ERRORS+=1
    )
)
echo.

echo [6/8] Uploading 2tables (9 spots)...
echo ----------------------------------------
for /d %%s in (spots\2tables\*) do (
    set /a TOTAL+=1
    echo [!TOTAL!] %%~nxs
    wrangler r2 object put %BUCKET%/spots/2tables/%%~nxs/settings.json --file=%%s\settings.json 2>nul || set /a ERRORS+=1
    wrangler r2 object put %BUCKET%/spots/2tables/%%~nxs/equity.json --file=%%s\equity.json 2>nul || set /a ERRORS+=1
    for %%f in (%%s\nodes\*.json) do (
        wrangler r2 object put %BUCKET%/spots/2tables/%%~nxs/nodes/%%~nxf --file=%%f 2>nul || set /a ERRORS+=1
    )
)
echo.

echo [7/8] Uploading 3tables (10 spots)...
echo ----------------------------------------
for /d %%s in (spots\3tables\*) do (
    set /a TOTAL+=1
    echo [!TOTAL!] %%~nxs
    wrangler r2 object put %BUCKET%/spots/3tables/%%~nxs/settings.json --file=%%s\settings.json 2>nul || set /a ERRORS+=1
    wrangler r2 object put %BUCKET%/spots/3tables/%%~nxs/equity.json --file=%%s\equity.json 2>nul || set /a ERRORS+=1
    for %%f in (%%s\nodes\*.json) do (
        wrangler r2 object put %BUCKET%/spots/3tables/%%~nxs/nodes/%%~nxf --file=%%f 2>nul || set /a ERRORS+=1
    )
)
echo.

echo [8/8] Uploading final_table (30 spots)...
echo ----------------------------------------
for /d %%s in (spots\final_table\*) do (
    set /a TOTAL+=1
    echo [!TOTAL!] %%~nxs
    wrangler r2 object put %BUCKET%/spots/final_table/%%~nxs/settings.json --file=%%s\settings.json 2>nul || set /a ERRORS+=1
    wrangler r2 object put %BUCKET%/spots/final_table/%%~nxs/equity.json --file=%%s\equity.json 2>nul || set /a ERRORS+=1
    for %%f in (%%s\nodes\*.json) do (
        wrangler r2 object put %BUCKET%/spots/final_table/%%~nxs/nodes/%%~nxf --file=%%f 2>nul || set /a ERRORS+=1
    )
)
echo.

echo ========================================
echo Upload CONCLUÍDO!
echo ========================================
echo.
echo Spots processados: !TOTAL!
echo Erros encontrados: !ERRORS!
echo.
echo PRÓXIMOS PASSOS:
echo 1. Upload do metadata:
echo    wrangler r2 object put %BUCKET%/solutions-metadata.json --file=./solutions-metadata.json
echo    wrangler r2 object put %BUCKET%/solutions.json --file=./solutions.json
echo.
echo 2. Aguarde 5-10 minutos para propagação do CDN
echo.
echo 3. Teste no Vercel: https://gtowizardprivate.vercel.app
echo.
pause
