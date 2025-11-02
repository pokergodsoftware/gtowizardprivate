@echo off
echo ========================================
echo Release - Atualizar Versao e Deploy
echo ========================================
echo.

REM Perguntar tipo de versão
echo Escolha o tipo de atualizacao:
echo 1. PATCH (x.x.X) - Correcoes de bugs
echo 2. MINOR (x.X.0) - Novas funcionalidades
echo 3. MAJOR (X.0.0) - Mudancas importantes
echo.

set /p choice="Digite 1, 2 ou 3: "

if "%choice%"=="1" (
    set version_type=patch
) else if "%choice%"=="2" (
    set version_type=minor
) else if "%choice%"=="3" (
    set version_type=major
) else (
    echo Opcao invalida!
    pause
    exit /b 1
)

echo.
echo [1/4] Atualizando versao (%version_type%)...
node update-version.cjs %version_type%

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao atualizar versao!
    pause
    exit /b 1
)

echo.
echo [2/4] Adicionando arquivos ao git...
git add package.json src/version.ts

echo.
echo [3/4] Fazendo commit...
for /f "delims=" %%i in ('node -p "require('./package.json').version"') do set NEW_VERSION=%%i
git commit -m "chore: release v%NEW_VERSION%"

echo.
echo [4/4] Fazendo push...
git push origin main

echo.
echo ========================================
echo Release v%NEW_VERSION% concluido!
echo ========================================
echo.
echo O Vercel fara deploy automaticamente.
echo Acompanhe em: https://vercel.com/dashboard
echo.

pause
