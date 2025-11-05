@echo off
REM Upload dos spots 40-20 faltando no R2

echo ===================================
echo Upload de Spots 40-20 para R2
echo ===================================
echo.

set BUCKET=gto-wizard-spots
set BASE_PATH=spots/40-20

echo Fazendo upload de 14 spots...
echo.

REM speed32_12
echo [1/14] Uploading speed32_12...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_12/settings.json --file=./spots/40-20/speed32_12/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_12/equity.json --file=./spots/40-20/speed32_12/equity.json
for %%f in (spots\40-20\speed32_12\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_12/nodes/%%~nxf --file=./spots/40-20/speed32_12/nodes/%%~nxf
)

REM speed32_13
echo [2/14] Uploading speed32_13...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_13/settings.json --file=./spots/40-20/speed32_13/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_13/equity.json --file=./spots/40-20/speed32_13/equity.json
for %%f in (spots\40-20\speed32_13\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_13/nodes/%%~nxf --file=./spots/40-20/speed32_13/nodes/%%~nxf
)

REM speed32_15
echo [3/14] Uploading speed32_15...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_15/settings.json --file=./spots/40-20/speed32_15/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_15/equity.json --file=./spots/40-20/speed32_15/equity.json
for %%f in (spots\40-20\speed32_15\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_15/nodes/%%~nxf --file=./spots/40-20/speed32_15/nodes/%%~nxf
)

REM speed32_16
echo [4/14] Uploading speed32_16...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_16/settings.json --file=./spots/40-20/speed32_16/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_16/equity.json --file=./spots/40-20/speed32_16/equity.json
for %%f in (spots\40-20\speed32_16\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_16/nodes/%%~nxf --file=./spots/40-20/speed32_16/nodes/%%~nxf
)

REM speed32_17
echo [5/14] Uploading speed32_17...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_17/settings.json --file=./spots/40-20/speed32_17/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_17/equity.json --file=./spots/40-20/speed32_17/equity.json
for %%f in (spots\40-20\speed32_17\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_17/nodes/%%~nxf --file=./spots/40-20/speed32_17/nodes/%%~nxf
)

REM speed32_18
echo [6/14] Uploading speed32_18...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_18/settings.json --file=./spots/40-20/speed32_18/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_18/equity.json --file=./spots/40-20/speed32_18/equity.json
for %%f in (spots\40-20\speed32_18\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_18/nodes/%%~nxf --file=./spots/40-20/speed32_18/nodes/%%~nxf
)

REM speed32_2d
echo [7/14] Uploading speed32_2d...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_2d/settings.json --file=./spots/40-20/speed32_2d/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_2d/equity.json --file=./spots/40-20/speed32_2d/equity.json
for %%f in (spots\40-20\speed32_2d\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_2d/nodes/%%~nxf --file=./spots/40-20/speed32_2d/nodes/%%~nxf
)

REM speed32_5d
echo [8/14] Uploading speed32_5d...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_5d/settings.json --file=./spots/40-20/speed32_5d/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_5d/equity.json --file=./spots/40-20/speed32_5d/equity.json
for %%f in (spots\40-20\speed32_5d\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_5d/nodes/%%~nxf --file=./spots/40-20/speed32_5d/nodes/%%~nxf
)

REM speed32_6d
echo [9/14] Uploading speed32_6d...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_6d/settings.json --file=./spots/40-20/speed32_6d/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_6d/equity.json --file=./spots/40-20/speed32_6d/equity.json
for %%f in (spots\40-20\speed32_6d\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed32_6d/nodes/%%~nxf --file=./spots/40-20/speed32_6d/nodes/%%~nxf
)

REM speed50_1
echo [10/14] Uploading speed50_1...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_1/settings.json --file=./spots/40-20/speed50_1/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_1/equity.json --file=./spots/40-20/speed50_1/equity.json
for %%f in (spots\40-20\speed50_1\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_1/nodes/%%~nxf --file=./spots/40-20/speed50_1/nodes/%%~nxf
)

REM speed50_2
echo [11/14] Uploading speed50_2...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_2/settings.json --file=./spots/40-20/speed50_2/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_2/equity.json --file=./spots/40-20/speed50_2/equity.json
for %%f in (spots\40-20\speed50_2\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_2/nodes/%%~nxf --file=./spots/40-20/speed50_2/nodes/%%~nxf
)

REM speed50_3
echo [12/14] Uploading speed50_3...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_3/settings.json --file=./spots/40-20/speed50_3/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_3/equity.json --file=./spots/40-20/speed50_3/equity.json
for %%f in (spots\40-20\speed50_3\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_3/nodes/%%~nxf --file=./spots/40-20/speed50_3/nodes/%%~nxf
)

REM speed50_4
echo [13/14] Uploading speed50_4...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_4/settings.json --file=./spots/40-20/speed50_4/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_4/equity.json --file=./spots/40-20/speed50_4/equity.json
for %%f in (spots\40-20\speed50_4\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_4/nodes/%%~nxf --file=./spots/40-20/speed50_4/nodes/%%~nxf
)

REM speed50_5
echo [14/14] Uploading speed50_5...
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_5/settings.json --file=./spots/40-20/speed50_5/settings.json
wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_5/equity.json --file=./spots/40-20/speed50_5/equity.json
for %%f in (spots\40-20\speed50_5\nodes\*.json) do (
    wrangler r2 object put %BUCKET%/%BASE_PATH%/speed50_5/nodes/%%~nxf --file=./spots/40-20/speed50_5/nodes/%%~nxf
)

echo.
echo ===================================
echo Upload concluído!
echo ===================================
echo.
echo Aguarde 5-10 minutos para propagação do CDN
echo Depois teste em: https://gtowizardprivate.vercel.app
echo.
pause
