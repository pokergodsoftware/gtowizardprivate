@echo off
echo ========================================
echo Removendo solutions-metadata.json do Git LFS
echo ========================================
echo.

echo [1/4] Removendo arquivo do Git LFS...
git lfs untrack "public/solutions-metadata.json"
git rm --cached public/solutions-metadata.json
echo OK!
echo.

echo [2/4] Atualizando .gitattributes...
powershell -Command "(Get-Content .gitattributes) | Where-Object { $_ -notmatch 'solutions-metadata.json' } | Set-Content .gitattributes"
echo OK!
echo.

echo [3/4] Adicionando arquivo normalmente (sem LFS)...
git add public/solutions-metadata.json
git add .gitattributes
echo OK!
echo.

echo [4/4] Fazendo commit...
git commit -m "Fix: Remove solutions-metadata.json from Git LFS"
echo OK!
echo.

echo ========================================
echo Correcao concluida!
echo ========================================
echo.
echo Agora execute: git push
echo.
pause
