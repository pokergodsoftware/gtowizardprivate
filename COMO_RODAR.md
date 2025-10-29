# Como Rodar o App no seu PC

## Pré-requisitos
- **Node.js v18 ou superior** instalado
- Windows (para os scripts batch)

## Passo a Passo

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar o projeto
Execute o script de setup que irá:
- Gerar o arquivo `solutions-metadata.json` com os metadados das soluções
- Criar um junction link de `public/spots` para `./spots`

```bash
.\generate_index.bat
```

**O que este script faz:**
- Varre a pasta `./spots/` e todas as subpastas
- Lê os arquivos `settings.json`, `equity.json` e lista os nodes disponíveis
- Gera `solutions-metadata.json` com caminhos relativos (`./spots/...`)
- Cria junction `public/spots` → `spots` para o Vite servir os arquivos

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

### 4. Acessar no navegador
Abra o endereço que aparecer no terminal (geralmente http://localhost:5173)

---

## Estrutura de Pastas

```
WizardPrivadoo/
├── spots/                          # Suas soluções de poker
│   ├── 100-60/                     # Fase do torneio
│   │   ├── 1/                      # ID do spot
│   │   │   ├── settings.json       # Configurações da mão
│   │   │   ├── equity.json         # Dados de equity
│   │   │   └── nodes/              # Nodes da árvore de decisão
│   │   │       ├── 0.json
│   │   │       ├── 1.json
│   │   │       └── ...
│   │   └── ...
│   ├── 60-40/
│   ├── final_table/
│   └── ...
├── public/
│   ├── spots/                      # Junction link → ./spots
│   └── solutions-metadata.json     # Metadados (gerado)
├── solutions-metadata.json         # Metadados (gerado)
└── generate_index.bat              # Script de setup
```

---

## Como Funciona

### Lazy Loading (Carregamento Sob Demanda)
O app usa **lazy loading** para máxima performance:

1. **Inicialização**: Carrega apenas `solutions-metadata.json` (leve, ~200KB)
2. **Seleção de solução**: Carrega `settings.json` e `equity.json` da solução
3. **Navegação**: Carrega nodes individuais conforme você navega na árvore

**Benefícios:**
- ✅ Inicialização instantânea (<2s)
- ✅ Sem sobrecarga do navegador
- ✅ Suporta milhares de nodes sem problemas

### Caminhos Relativos
Todos os caminhos são relativos (`./spots/...`) para funcionar tanto em desenvolvimento quanto em produção.

---

## Troubleshooting

### Erro: "solutions-metadata.json not found"
Execute novamente:
```bash
.\generate_index.bat
```

### Spots não aparecem na biblioteca
1. Verifique se a pasta `spots/` existe e tem a estrutura correta
2. Execute `.\generate_index.bat` novamente
3. Verifique o console do terminal para erros

### Junction link não foi criado
Execute manualmente:
```bash
mklink /J "public\spots" "spots"
```

### Erro ao carregar nodes
1. Verifique se os arquivos JSON estão válidos
2. Verifique se o junction `public/spots` existe
3. Reinicie o servidor (`npm run dev`)

---

## Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview da build
- `.\generate_index.bat` - Setup completo do projeto

---

## Adicionando Novos Spots

1. Coloque a pasta do spot em `./spots/[fase]/[id]/`
2. Certifique-se que tem a estrutura:
   ```
   [id]/
   ├── settings.json
   ├── equity.json
   └── nodes/
       ├── 0.json
       └── ...
   ```
3. Execute `.\generate_index.bat`
4. Reinicie o servidor

Veja `COMO_ADICIONAR_SPOTS.md` para mais detalhes.
