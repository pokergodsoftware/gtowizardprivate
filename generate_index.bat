@echo off
echo ========================================
echo   GTO Wizard Private - Setup Script
echo ========================================
echo.

echo [1/2] Generating solutions.json...
node generate_solutions.cjs

echo.
echo [2/2] Setting up public directory...
if not exist "public\spots" (
    mklink /J "public\spots" "spots" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Junction created successfully!
    ) else (
        echo Junction already exists or failed.
    )
) else (
    echo Junction already exists.
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo You can now run: npm run dev
echo.
pause
