@echo off
setlocal enabledelayedexpansion

:: Define o nome do arquivo de saida
set "OUTPUT_FILE=solutions.json"
:: Define a pasta principal a ser escaneada
set "SPOTS_DIR=spots"

echo Gerando %OUTPUT_FILE% a partir da pasta '%SPOTS_DIR%'...

:: Inicia o array JSON, substituindo o arquivo antigo
echo [ > %OUTPUT_FILE%

:: Variavel para controlar a virgula entre os objetos JSON
set "first_entry=true"

:: Loop nas subpastas da pasta 'spots' (ex: 'final_table')
for /d %%P in ("%SPOTS_DIR%\*") do (
  :: Loop nas subpastas de cada fase (ex: 'speed20_1')
  for /d %%S in ("%%P\*") do (
    set "solutionPath=%%S"
    
    :: Verifica se a pasta e uma solucao valida (contem a pasta 'nodes')
    if exist "!solutionPath!\nodes" (
      
      :: Adiciona uma virgula antes de cada entrada, exceto a primeira
      if !first_entry! == true (
        set "first_entry=false"
      ) else (
        echo ,>> %OUTPUT_FILE%
      )

      :: Extrai os metadados
      set "jsonPath=!solutionPath:\=/!"
      set "fileName=%%~nS"
      set "phase=%%~nP"
      
      :: Constroi a lista de nodeIds
      set "nodeList="
      for %%F in ("!solutionPath!\nodes\*.json") do (
        set "nodeList=!nodeList!,%%~nF"
      )
      if defined nodeList (
         set "nodeList=[!nodeList:~1!]"
      ) else (
         set "nodeList=[]"
      )

      :: Escreve o objeto JSON no arquivo
      (
        echo   {
        echo     "path": "./!jsonPath!",
        echo     "fileName": "!fileName!",
        echo     "tournamentPhase": "!phase!",
        echo     "nodeIds": !nodeList!
        echo   }
      ) >> %OUTPUT_FILE%
      echo   - Encontrada solucao: !phase!/!fileName!
    )
  )
)

:: Fecha o array JSON
echo ] >> %OUTPUT_FILE%

echo.
echo Concluido! O arquivo %OUTPUT_FILE% foi atualizado.
echo Pressione qualquer tecla para sair.
pause >nul