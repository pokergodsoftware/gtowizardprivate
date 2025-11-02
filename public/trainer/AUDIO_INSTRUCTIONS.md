# Instruções para Áudios do Timebank

## Arquivos Necessários

Coloque os seguintes arquivos de áudio nesta pasta:

1. **timebank1.mp3**
   - Deve tocar quando o timebank chegar em **8 segundos**
   - Som de alerta suave/médio
   - Duração recomendada: 0.5-1 segundo

2. **timebank2.mp3**
   - Deve tocar quando o timebank chegar em **4 segundos**
   - Som de alerta mais urgente/agudo
   - Duração recomendada: 0.5-1 segundo
   - Pode ser um beep duplo para maior urgência

## Como Adicionar os Áudios

1. Grave ou baixe os sons de alerta desejados
2. Converta para formato MP3
3. Renomeie para `timebank1.mp3` e `timebank2.mp3`
4. Coloque nesta pasta: `public/trainer/`

## Sugestões de Sons

- **timebank1.mp3**: "Beep" simples, tom médio (800Hz)
- **timebank2.mp3**: "Beep beep" duplo, tom agudo (1200Hz)

## Nota

Atualmente o sistema usa Web Audio API para gerar beeps programaticamente.
Quando você adicionar os arquivos MP3 reais, eles substituirão os beeps gerados.
