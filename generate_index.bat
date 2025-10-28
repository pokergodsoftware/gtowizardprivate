@echo off
setlocal enabledelayedexpansion

REM Define o caminho do arquivo de saida
set "output_file=spots\index.txt"
REM Define o diretorio base para escanear
set "base_dir=spots"

echo Gerando indice para os arquivos de solucao...

REM Comeca a escrever no arquivo de saida, sobrescrevendo se ja existir
(
  echo {
  set "first_dir=true"
  
  REM Loop em cada subdiretorio do diretorio base
  for /d %%d in (%base_dir%\*) do (
    set "dir_name=%%~nd"
    set "has_zip_files=false"
    
    REM Verifica se existem arquivos .zip no subdiretorio
    for %%f in ("%%d\*.zip") do (
      set "has_zip_files=true"
    )

    REM Se arquivos zip foram encontrados, processa o diretorio
    if !has_zip_files!==true (
      REM Adiciona uma virgula antes da entrada deste diretorio se nao for o primeiro
      if !first_dir!==true (
        set "first_dir=false"
      ) else (
        echo,
      )
      
      REM Escreve o nome do diretorio como uma chave JSON
      echo   "!dir_name!": [
      set "first_file=true"
      
      REM Loop em cada arquivo .zip no diretorio
      for %%f in ("%%d\*.zip") do (
        REM Adiciona uma virgula antes da entrada deste arquivo se nao for o primeiro
        if !first_file!==true (
          set "first_file=false"
        ) else (
          echo,
        )
        REM Escreve o nome do arquivo, entre aspas
        echo     "%%~nxf"
      )
      
      REM Fecha o array de arquivos para este diretorio
      echo   ]
    )
  )
  
  REM Fecha o objeto JSON principal
  echo }
) > "%output_file%"

echo.
echo O arquivo de indice '%output_file%' foi gerado com sucesso.
pause