@echo off
echo ========================================
echo FIX COMPLETO - Remover Git LFS
echo ========================================
echo.

echo [1/6] Cancelando qualquer operacao Git em andamento...
git reset --hard HEAD
echo OK!
echo.

echo [2/6] Removendo TODOS os arquivos do Git LFS...
git lfs uninstall
echo OK!
echo.

echo [3/6] Limpando cache do Git...
git rm -r --cached .
echo OK!
echo.

echo [4/6] Removendo .gitattributes (que configura LFS)...
if exist .gitattributes del .gitattributes
echo OK!
echo.

echo [5/6] Adicionando TUDO novamente (SEM LFS)...
git add .
echo OK!
echo.

echo [6/6] Fazendo commit...
git commit -m "Fix: Remove Git LFS completely, add files normally"
echo OK!
echo.

echo ========================================
echo Correcao COMPLETA!
echo ========================================
echo.
echo IMPORTANTE: Agora execute:
echo   git push --force
echo.
echo Isso vai sobrescrever o historico e remover LFS completamente.
echo.
pause
