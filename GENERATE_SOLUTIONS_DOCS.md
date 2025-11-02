# 📚 Documentação do Script generate_solutions.cjs

## 🎯 Objetivo

Script automatizado para gerenciar spots de poker GTO, sincronizando a pasta `spots/` com o arquivo `solutions.json`.

## ✨ Funcionalidades Implementadas

### 1. ✅ **Adicionar Spots da Pasta ao Site**
- Escaneia todas as pastas em `spots/[fase]/[spot_id]/`
- Valida estrutura necessária (settings.json, equity.json, nodes/)
- Adiciona automaticamente ao `solutions.json`

### 2. 🗑️ **Remover Spots do Site que Não Estão na Pasta**
- Compara `solutions.json` existente com spots na pasta
- Remove automaticamente spots que foram deletados da pasta
- Mantém o site sincronizado com a pasta física

### 3. 🔄 **Detectar e Deletar Duplicatas Físicas**
- Gera assinatura única para cada spot baseada em:
  - Stacks (ordenados)
  - Blinds
  - Bounties
  - Número de jogadores
  - Dados do primeiro node (player, street, actions)
- Quando encontra duplicata:
  - Mantém o primeiro spot encontrado
  - **DELETA FISICAMENTE** a pasta duplicada
  - Registra a ação no log

## 🔍 Como Funciona

### Fluxo de Execução

```
1. 📂 ESCANEAR PASTA
   ├─ Percorre todas as fases (100-60, 60-40, etc)
   ├─ Valida cada spot (settings.json, equity.json, nodes/)
   └─ Armazena dados válidos em memória

2. 📄 LER SOLUTIONS.JSON EXISTENTE
   └─ Carrega spots atualmente no site

3. 🗑️ IDENTIFICAR SPOTS PARA REMOVER
   └─ Spots no site mas não na pasta

4. 🔍 DETECTAR DUPLICATAS
   ├─ Compara assinaturas de todos os spots
   ├─ Identifica duplicatas
   └─ DELETA pastas duplicadas fisicamente

5. ✅ ADICIONAR SPOTS VÁLIDOS
   ├─ Cria nome descritivo
   ├─ Limita nodes (se necessário)
   └─ Adiciona ao array de solutions

6. 💾 SALVAR ARQUIVOS
   ├─ solutions.json (raiz)
   └─ public/solutions.json
```

## 📊 Assinatura de Spot (Detecção de Duplicatas)

A assinatura é gerada com base em:

```javascript
{
  stacks: [...stacks].sort((a, b) => a - b),  // Ordenado
  blinds: blinds,
  bounties: bounties ? [...bounties].sort() : [],
  numPlayers: stacks.length,
  firstNodePlayer: firstNodeData.player,
  firstNodeStreet: firstNodeData.street,
  firstNodeActionsCount: firstNodeData.actions.length
}
```

**Dois spots são considerados duplicatas se tiverem a mesma assinatura.**

## 🚀 Como Usar

### Executar o Script

```bash
node generate_solutions.cjs
```

Ou use o batch file:

```bash
generate_index.bat
```

### ⚠️ Importante

O script gera **DOIS** arquivos JSON:

1. **`solutions.json`** - Formato antigo (compatibilidade)
2. **`solutions-metadata.json`** - Formato usado pelo app (PRINCIPAL)

Ambos são salvos na raiz e em `public/`:
- `solutions.json` → `public/solutions.json`
- `solutions-metadata.json` → `public/solutions-metadata.json`

**O app carrega `solutions-metadata.json`, não `solutions.json`!**

## 📝 Exemplo de Saída

```
📂 Scanning spots folder...

⚠️  Skipping 100-60/corrupted_spot - missing files
✓ Found 52 valid spots in folder

📄 Found existing solutions.json with 51 solutions

🗑️  REMOVING 2 spots from site (not found in folder):
   - ./spots/final_table/old_spot_1
   - ./spots/100-60/deleted_spot

🔍 Checking for duplicates...

🔄 DUPLICATE FOUND: 100-60/speed32_2 (same as 100-60/speed32_1)
   🗑️  Deleting duplicate folder: D:\spots\100-60\speed32_2
   ✓ Deleted successfully

✓ Added: 100~60% left - 6p 10bb (speed32_1) (45 nodes)
✓ Added: Near bubble - 8p 15bb #0001 (67 nodes)
...

============================================================
📊 SUMMARY
============================================================
✓ Generated solutions.json with 44 solutions
✓ Generated solutions-metadata.json with 44 solutions
✓ Copied to public/solutions.json
✓ Copied to public/solutions-metadata.json

🗑️  Removed from site: 2 spots (not in folder)

🔄 Duplicates detected: 1
🗑️  Duplicate folders deleted: 1
============================================================
```

## ⚙️ Configurações

### Limitar Nodes por Solução

```javascript
const MAX_NODES_PER_SOLUTION = 999999999;
```

Altere este valor para limitar quantos nodes cada solução pode ter.

## 🎨 Mapeamento de Fases

```javascript
const phaseMapping = {
  '100-60': '100~60% left',
  '60-40': '60~40% left',
  '40-20': '40~20% left',
  'near_bubble': 'Near bubble',
  '3tables': '3 tables',
  '2tables': '2 tables',
  'final_table': 'Final table'
};
```

## 📁 Estrutura Esperada

```
spots/
├── 100-60/
│   ├── speed32_1/
│   │   ├── settings.json
│   │   ├── equity.json
│   │   └── nodes/
│   │       ├── 0.json
│   │       ├── 1.json
│   │       └── ...
│   └── ...
├── final_table/
│   └── 0001/
│       ├── settings.json
│       ├── equity.json
│       └── nodes/
└── ...
```

## ✅ Validações

O script valida:

1. ✅ **Arquivos obrigatórios existem**
   - settings.json
   - equity.json
   - pasta nodes/

2. ✅ **Dados válidos**
   - Número de jogadores
   - Stack médio em BB
   - Nodes JSON válidos

3. ✅ **Duplicatas**
   - Compara assinaturas
   - Deleta fisicamente pastas duplicadas

## 🛡️ Segurança

- **Backup recomendado**: Faça backup da pasta `spots/` antes de executar
- **Deleção permanente**: Duplicatas são deletadas fisicamente (não vão para lixeira)
- **Logs detalhados**: Todas as ações são registradas no console

## 🔧 Troubleshooting

### Spot não aparece no site

1. Verifique se a estrutura está correta
2. Execute o script e veja os logs
3. Procure por mensagens de erro específicas

### Duplicata não foi deletada

1. Verifique permissões da pasta
2. Veja o log de erro no console
3. Delete manualmente se necessário

### Solutions.json não atualiza

1. Verifique se o script terminou sem erros
2. Confirme que `public/solutions.json` também foi atualizado
3. Limpe cache do navegador

## 📌 Notas Importantes

- ⚠️ **Duplicatas são deletadas permanentemente**
- ✅ Sempre mantém o primeiro spot encontrado
- 🔄 Sincronização automática pasta ↔ site
- 📊 Relatório detalhado ao final da execução

## 🎯 Casos de Uso

### Adicionar Novos Spots
1. Copie pasta do spot para `spots/[fase]/`
2. Execute `node generate_solutions.cjs`
3. Spot aparece automaticamente no site

### Remover Spots
1. Delete pasta do spot de `spots/[fase]/`
2. Execute `node generate_solutions.cjs`
3. Spot é removido automaticamente do site

### Limpar Duplicatas
1. Execute `node generate_solutions.cjs`
2. Script detecta e deleta duplicatas automaticamente
3. Apenas uma cópia de cada spot permanece

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console
2. Confirme estrutura de pastas
3. Faça backup antes de executar
4. Teste com poucos spots primeiro
