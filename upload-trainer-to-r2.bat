@echo off
echo ========================================
echo Upload Trainer Assets para R2
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

echo [1/1] Fazendo upload da pasta trainer/...
echo.

REM Upload recursivo da pasta trainer
wrangler r2 object put gto-wizard-spots --file=public/trainer --recursive

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [OK] Upload concluido com sucesso!
    echo ========================================
    echo.
    echo Arquivos enviados:
    echo - table.png
    echo - final_table.png
    echo - cards.png
    echo - avatar1.png ate avatar8.png
    echo - timebank1.mp3
    echo - timebank2.mp3
    echo - action_button.png
    echo.
    echo Teste as URLs:
    echo - Mesa: https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/trainer/table.png
    echo - Avatar: https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/trainer/avatar1.png
    echo - Audio: https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/trainer/timebank1.mp3
    echo.
) else (
    echo.
    echo [ERRO] Falha no upload!
    echo.
)

pause
