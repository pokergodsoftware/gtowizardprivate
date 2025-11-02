@echo off
echo ========================================
echo Trigger Redeploy no Vercel
echo ========================================
echo.

echo Fazendo commit vazio para trigger redeploy...
git commit --allow-empty -m "chore: trigger redeploy to apply R2 CDN"

echo.
echo Fazendo push...
git push origin main

echo.
echo ========================================
echo Deploy iniciado!
echo ========================================
echo.
echo Acompanhe em: https://vercel.com/dashboard
echo.

pause
