@echo off
setlocal enabledelayedexpansion

REM Define o nome do arquivo de saida.
set "OUTPUT_FILE=spots\index.txt"

echo Gerando o arquivo de indice para as solucoes...

REM Apaga o arquivo antigo, se existir, para comecar do zero.
if exist "%OUTPUT_FILE%" del "%OUTPUT_FILE%"

REM Percorre todas as subpastas dentro de 'spots' procurando por arquivos .zip
for /r "spots" %%f in (*.zip) do (
    REM Pega o caminho completo do arquivo (ex: C:\projeto\spots\100-60\arquivo.zip)
    set "full_path=%%f"
    
    REM Remove o caminho base do projeto e a pasta 'spots' para obter o caminho relativo.
    REM (ex: 100-60\arquivo.zip)
    set "relative_path=!full_path:%cd%\spots\=!"
    
    REM Troca as barras invertidas (\) por barras normais (/) para uso na web.
    set "web_path=!relative_path:\=/!"
    
    REM Escreve o caminho formatado no arquivo de saida.
    echo !web_path! >> "%OUTPUT_FILE%"
)

echo.
echo O arquivo '%OUTPUT_FILE%' foi criado com sucesso!
echo Pressione qualquer tecla para sair.
pause > nul