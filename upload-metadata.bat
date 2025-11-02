@echo off
echo ========================================
echo Upload do solutions-metadata.json para R2
echo ========================================
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

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Upload concluido com sucesso!
    echo.
    echo Teste a URL:
    echo https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/solutions-metadata.json
    echo.
) else (
    echo.
    echo [ERRO] Falha no upload!
    echo.
)

pause
