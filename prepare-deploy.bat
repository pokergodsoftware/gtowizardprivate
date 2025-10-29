@echo off
echo ========================================
echo Preparando arquivos para deploy no Vercel
echo ========================================
echo.

echo [1/4] Gerando solutions-metadata.json...
node generate_solutions_lazy.cjs
if errorlevel 1 (
    echo ERRO: Falha ao gerar solutions-metadata.json
    exit /b 1
)
echo OK!
echo.

echo [2/4] Verificando arquivos necessarios...
if not exist "public\solutions-metadata.json" (
    echo ERRO: public\solutions-metadata.json nao encontrado!
    exit /b 1
)
echo OK! solutions-metadata.json encontrado
echo.

echo [3/4] Verificando pasta spots...
if not exist "public\spots" (
    echo AVISO: public\spots nao encontrado!
    echo Copiando spots para public...
    xcopy /E /I /Y spots public\spots
    if errorlevel 1 (
        echo ERRO: Falha ao copiar spots
        exit /b 1
    )
)
echo OK! Pasta spots encontrada
echo.

echo [4/4] Listando arquivos para commit...
echo.
echo Arquivos que serao commitados:
echo - .gitignore (atualizado)
echo - .gitattributes (novo)
echo - vercel.json (novo)
echo - public/solutions-metadata.json
echo - public/spots/ (pasta completa)
echo.

echo ========================================
echo Preparacao concluida!
echo ========================================
echo.
echo Proximos passos:
echo 1. git add .
echo 2. git commit -m "Add public files for Vercel deploy"
echo 3. git push
echo.
echo O Vercel fara deploy automatico apos o push!
echo ========================================

pause
