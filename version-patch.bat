@echo off
echo ========================================
echo Atualizar Versao - PATCH (x.x.X)
echo ========================================
echo.

node update-version.cjs patch

echo.
echo Exemplo: 1.0.0 -^> 1.0.1
echo.

pause
