@echo off
echo ========================================
echo Testando Build para Vercel
echo ========================================
echo.

echo [1/3] Limpando pasta dist...
if exist dist rmdir /s /q dist
echo OK!
echo.

echo [2/3] Executando build...
call npm run build
if errorlevel 1 (
    echo ERRO: Build falhou!
    pause
    exit /b 1
)
echo OK!
echo.

echo [3/3] Verificando arquivos copiados...
echo.

if exist "dist\solutions-metadata.json" (
    echo [OK] dist\solutions-metadata.json existe
) else (
    echo [ERRO] dist\solutions-metadata.json NAO existe!
    echo.
    echo Copiando manualmente...
    copy "public\solutions-metadata.json" "dist\solutions-metadata.json"
)
echo.

if exist "dist\spots" (
    echo [OK] dist\spots\ existe
    dir /b "dist\spots" | findstr /r ".*" >nul
    if errorlevel 1 (
        echo [AVISO] dist\spots\ esta vazia!
    ) else (
        echo [OK] dist\spots\ contem arquivos
    )
) else (
    echo [ERRO] dist\spots\ NAO existe!
    echo.
    echo Copiando manualmente...
    xcopy /E /I /Y "public\spots" "dist\spots"
)
echo.

echo ========================================
echo Verificacao de Build Completa!
echo ========================================
echo.
echo Testando preview local...
echo Abra http://localhost:4173 no navegador
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

call npm run preview
