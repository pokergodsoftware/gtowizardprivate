@echo off
echo ========================================
echo Upload do solutions-metadata.json para R2
echo ========================================
echo.

echo [1/1] Fazendo upload do solutions-metadata.json...
echo.

cmd /c "wrangler r2 object put gto-wizard-spots/solutions-metadata.json --file=public/solutions-metadata.json"

echo.
echo Teste a URL:
echo https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/solutions-metadata.json
echo.

pause
