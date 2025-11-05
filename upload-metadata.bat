@echo off
REM Upload do solutions-metadata.json para Cloudflare R2

echo ========================================
echo Upload de solutions-metadata.json
echo ========================================
echo.
echo Este script faz upload do arquivo de metadata
echo para o Cloudflare R2.
echo.

set BUCKET=gto-wizard-spots
set FILE=solutions-metadata.json

echo Verificando se o arquivo existe...
if not exist "%FILE%" (
    echo ERRO: Arquivo %FILE% nao encontrado!
    echo Execute primeiro: .\generate_index.bat
    pause
    exit /b 1
)

echo.
echo Fazendo upload de %FILE%...
wrangler r2 object put %BUCKET%/%FILE% --file=%FILE%

if errorlevel 1 (
    echo.
    echo ERRO: Falha no upload!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Upload concluido com sucesso!
echo ========================================
echo.
echo O arquivo esta disponivel em:
echo https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/%FILE%
echo.
echo Verificando o arquivo no CDN...
timeout /t 2 /nobreak >nul
curl -I https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/%FILE%
echo.
pause
