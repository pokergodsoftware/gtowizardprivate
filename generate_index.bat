@echo off
setlocal enabledelayedexpansion

REM Define o caminho do arquivo de saida
set "output_file=spots\index.txt"
REM Define o diretorio base para escanear
set "base_dir=spots"

echo Gerando indice para os arquivos de solucao...

(
  echo {
  set "first_dir=true"
  
  for /d %%d in (%base_dir%\*) do (
    set "dir_name=%%~nd"
    
    if exist "%%d\*.zip" (
      
      if "!first_dir!"=="true" (
        set "first_dir=false"
      ) else (
        echo,
      )
      
      echo   "!dir_name!": [
      set "first_file=true"
      
      for %%f in ("%%d\*.zip") do (
        if "!first_file!"=="true" (
          set "first_file=false"
        ) else (
          echo     ,
        )
        echo     "%%~nxf"
      )
      
      echo   ]
    )
  )
  
  echo }
) > "%output_file%"

echo.
echo O arquivo de indice '%output_file%' foi gerado com sucesso.
pause