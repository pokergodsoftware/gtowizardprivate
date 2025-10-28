# Como Adicionar Novos Spots

## Problema Resolvido

O problema estava no arquivo `solutions.json` que usava caminhos absolutos (`/spots/...`) em vez de caminhos relativos (`./spots/...`). Isso impedia o Vite de encontrar os arquivos corretamente.

## Estrutura de Pastas

Os spots devem estar organizados da seguinte forma:

```
spots/
├── 100-60/          # 100~60% left
│   ├── 1/
│   │   ├── settings.json
│   │   ├── equity.json
│   │   └── nodes/
│   │       ├── 0.json
│   │       ├── 1.json
│   │       └── ...
│   └── 2/
│       └── ...
├── 60-40/           # 60~40% left
├── 40-20/           # 40~20% left
├── near_bubble/     # Near bubble
├── 3tables/         # 3 tables
├── 2tables/         # 2 tables
└── final_table/     # Final table
    ├── speed20_1/
    ├── speed32_1/
    └── ...
```

## Como Adicionar Novos Spots

### Opção 1: Regenerar Automaticamente (Recomendado)

1. Adicione seus spots na pasta `spots/` seguindo a estrutura acima
2. Execute o arquivo `generate_index.bat` (Windows) ou rode:
   ```bash
   node generate_solutions.cjs
   ```
3. O arquivo `solutions.json` será regenerado automaticamente com todos os spots encontrados

### Opção 2: Adicionar Manualmente

Edite o arquivo `solutions.json` e adicione uma nova entrada:

```json
{
  "path": "./spots/final_table/speed20_1",
  "fileName": "FT 3-handed 20bb avg",
  "tournamentPhase": "Final table",
  "nodeIds": [0, 1, 2, 3, 4, 5]
}
```

**Importante:** 
- Use `./spots/...` (caminho relativo) e NÃO `/spots/...` (caminho absoluto)
- Liste todos os IDs dos nodes disponíveis na pasta `nodes/`

## Fases do Torneio Disponíveis

- `100~60% left`
- `60~40% left`
- `40~20% left`
- `Near bubble`
- `3 tables`
- `2 tables`
- `Final table`

## Script de Geração

O script `generate_solutions.cjs` faz automaticamente:

1. ✅ Varre todas as pastas em `spots/`
2. ✅ Valida se existem `settings.json`, `equity.json` e `nodes/`
3. ✅ Extrai número de jogadores e stack médio
4. ✅ Lista todos os node IDs disponíveis
5. ✅ Gera nomes descritivos automaticamente
6. ✅ Ordena por fase do torneio

## Exemplo de Saída

```
Added: 100~60% left - 6p 12bb #1
Added: Final table - 3p 11bb (speed20_1)
✓ Generated solutions.json with 51 solutions
```

## Solução Atual

Atualmente o projeto tem **51 soluções** carregadas automaticamente:
- 16 spots de "100~60% left"
- 10 spots de "60~40% left"
- 25 spots de "Final table"

## Troubleshooting

### Spots não aparecem na aplicação

1. Verifique se os caminhos em `solutions.json` começam com `./spots/`
2. Confirme que cada pasta tem `settings.json`, `equity.json` e `nodes/`
3. Verifique o console do navegador para erros de carregamento
4. Regenere o `solutions.json` com o script

### Erro ao carregar nodes

- Certifique-se de que todos os IDs em `nodeIds` correspondem a arquivos existentes em `nodes/`
- Os arquivos devem ser nomeados como `0.json`, `1.json`, etc.
