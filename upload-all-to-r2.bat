@echo off
echo ========================================
echo Upload COMPLETO para Cloudflare R2
echo ========================================
echo.
echo Bucket: gto-wizard-spots
echo URL: https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev
echo.

REM Verificar se wrangler está instalado
where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Wrangler nao encontrado!
    echo.
    echo Instale com: npm install -g wrangler
    echo.
    pause
    exit /b 1
)

echo [1/2] Fazendo upload do solutions-metadata.json...
wrangler r2 object put gto-wizard-spots/solutions-metadata.json --file=public/solutions-metadata.json

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha no upload do metadata!
    pause
    exit /b 1
)

echo.
echo [2/2] Fazendo upload da pasta spots/ (pode demorar alguns minutos)...
echo.

REM Upload recursivo da pasta spots
wrangler r2 object put gto-wizard-spots --file=spots --recursive

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [OK] Upload concluido com sucesso!
    echo ========================================
    echo.
    echo Teste as URLs:
    echo - Metadata: https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/solutions-metadata.json
    echo - Spot exemplo: https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/spots/100-60/speed32_1/settings.json
    echo.
    echo Proximo passo: Fazer deploy no Vercel
    echo.
) else (
    echo.
    echo [ERRO] Falha no upload dos spots!
    echo.
)

pause
