@echo off
echo Setting up public directory for Vite...
echo.

REM Criar pasta public se não existir
if not exist "public" mkdir public

REM Tentar criar junction (não precisa de admin)
echo Creating junction for spots folder...
mklink /J "public\spots" "spots"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Junction creation failed. This is normal if it already exists.
    echo If spots are not loading, you may need to run as administrator.
)

echo.
echo Done! Press any key to exit.
pause > nul
