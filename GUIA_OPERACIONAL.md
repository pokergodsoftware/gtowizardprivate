# Guia Operacional - GTO Wizard Private

## 📋 Índice
1. [Commit e Push](#commit-e-push)
2. [Adicionar Novos Spots](#adicionar-novos-spots)
3. [Adicionar Imagens PNG](#adicionar-imagens-png)
4. [Upload para Cloudflare R2](#upload-para-cloudflare-r2)
5. [Versionamento e Release](#versionamento-e-release)

---

## 🔄 Commit e Push

### Comandos Git Básicos

```powershell
# 1. Verificar status (arquivos modificados)
git status

# 2. Adicionar arquivos específicos
git add caminho/do/arquivo.tsx
git add components/TrainerSimulator.tsx

# 3. Adicionar TODOS os arquivos modificados
git add .

# 4. Fazer commit com mensagem descritiva
git commit -m "feat: adiciona novo gerador de spots RFI"
git commit -m "fix: corrige cálculo de EV no TrainerFeedback"
git commit -m "refactor: modulariza componente PokerTable"

# 5. Enviar para GitHub
git push origin main
```

### Convenções de Mensagens de Commit

Use prefixos semânticos:

- `feat:` - Nova funcionalidade
  - Exemplo: `feat: adiciona modo Tournament ao trainer`
- `fix:` - Correção de bug
  - Exemplo: `fix: corrige carregamento de nodes vazios`
- `refactor:` - Refatoração de código (sem mudar comportamento)
  - Exemplo: `refactor: extrai lógica de spots para utils/`
- `docs:` - Apenas documentação
  - Exemplo: `docs: atualiza GUIA_OPERACIONAL.md`
- `style:` - Formatação, espaços (sem alterar código)
  - Exemplo: `style: ajusta indentação em RangeGrid`
- `chore:` - Tarefas de manutenção
  - Exemplo: `chore: atualiza dependências do package.json`

### Workflow Completo

```powershell
# 1. Verificar branch atual
git branch

# 2. Verificar modificações
git status

# 3. Ver diferenças detalhadas
git diff

# 4. Adicionar arquivos
git add .

# 5. Commit
git commit -m "feat: implementa feedback visual no trainer"

# 6. Push (envia para GitHub e dispara deploy automático no Vercel)
git push origin main

# 7. Verificar se foi enviado
git log --oneline -5
```

### ⚠️ Resolução de Conflitos

Se aparecer erro de "divergent branches":

```powershell
# Baixar alterações remotas
git pull origin main

# Se houver conflitos, edite os arquivos e resolva manualmente
# Depois adicione e faça commit
git add .
git commit -m "merge: resolve conflitos"
git push origin main
```

---

## 🎯 Adicionar Novos Spots

### Passo 1: Criar Estrutura de Pastas

Os spots seguem uma hierarquia de pastas em `/spots/`:

```
spots/
├── final_table/
│   ├── speed32_1/
│   │   ├── settings.json
│   │   ├── equity.json
│   │   └── nodes/
│   │       ├── 0.json
│   │       ├── 1.json
│   │       └── ...
│   └── novo_spot_123/
│       ├── settings.json
│       ├── equity.json
│       └── nodes/
├── near_bubble/
├── after_bubble/
└── ...
```

### Passo 2: Adicionar Arquivos do Spot

Cada spot DEVE ter:

1. **`settings.json`** - Configurações do torneio
```json
{
  "tournamentName": "Speed #32",
  "gameType": "NLHE",
  "rake": 5,
  "players": 6,
  "startingStack": 1500,
  "smallBlind": 15,
  "bigBlind": 30,
  "ante": 0,
  "playerStacks": [2000, 1800, 1500, 1200, 1000, 800],
  "payouts": [500, 300, 200, 100, 50, 0]
}
```

2. **`equity.json`** - Equidade dos jogadores
```json
{
  "players": [
    { "position": "BTN", "equity": 18.5 },
    { "position": "SB", "equity": 16.2 },
    { "position": "BB", "equity": 15.8 },
    { "position": "UTG", "equity": 14.3 },
    { "position": "MP", "equity": 17.9 },
    { "position": "CO", "equity": 17.3 }
  ]
}
```

3. **`nodes/`** - Pasta com arquivos JSON dos nós da árvore de decisão
   - Cada node é um arquivo separado: `0.json`, `1.json`, `2.json`, etc.
   - Use lazy loading para árvores grandes (12,000+ nodes)

### Passo 3: Gerar Metadados

**CRÍTICO**: Após adicionar ou modificar spots, SEMPRE execute:

```powershell
node generate_solutions_optimized.cjs
```

Este script:
- Escaneia toda a estrutura `/spots/`
- Lê `settings.json` e `equity.json` de cada spot
- Gera `solutions-metadata.json` e `solutions.json`
- **Usa caminhos relativos** (`./spots/...` não `/spots/...`)
- Cria automaticamente junction point `public/spots` se não existir

### Passo 4: Reiniciar Dev Server

```powershell
# Parar servidor (Ctrl+C no terminal)
# Reiniciar
npm run dev
```

### Passo 5: Testar Localmente

1. Abra `http://localhost:3000`
2. Vá para "Solutions Library"
3. Procure o novo spot na categoria apropriada
4. Clique para carregar e verificar se todos os nodes carregam

### Passo 6: Commit e Push

```powershell
git add spots/
git add solutions-metadata.json
git add solutions.json
git commit -m "feat: adiciona novo spot {nome_do_spot}"
git push origin main
```

### ⚠️ Importante

- **Caminhos relativos**: Metadados DEVEM usar `./spots/...` (não `/spots/...`)
- **Junction point**: Windows precisa do junction `public/spots` → `spots/` para Vite servir arquivos
  - Criado automaticamente pelo `generate_solutions_optimized.cjs`
  - Se falhar, execute terminal como Administrador
- **Metadados não auto-watch**: Sempre re-execute `node generate_solutions_optimized.cjs` após mudanças

---

## 🖼️ Adicionar Imagens PNG

### Localização de Assets

```
public/
└── trainer/
    ├── card-backs/
    │   ├── back-blue.png
    │   ├── back-red.png
    │   └── ...
    ├── cards/
    │   ├── AH.png (Ás de copas)
    │   ├── KD.png (Rei de ouros)
    │   └── ...
    ├── chips/
    │   ├── chip-1.png
    │   ├── chip-5.png
    │   └── ...
    └── sounds/
        ├── card-flip.mp3
        └── timer-alert.mp3
```

### Adicionar Novo PNG

#### 1. Copiar arquivo para pasta apropriada

```powershell
# Exemplo: adicionar novo card back
copy C:\Downloads\back-green.png public\trainer\card-backs\

# Exemplo: adicionar novo chip
copy C:\Downloads\chip-1000.png public\trainer\chips\
```

#### 2. Verificar nomenclatura

**Cards**: Use código de 2 caracteres
- Valores: `A`, `K`, `Q`, `J`, `T`, `9`, `8`, `7`, `6`, `5`, `4`, `3`, `2`
- Naipes: `H` (hearts/copas), `D` (diamonds/ouros), `C` (clubs/paus), `S` (spades/espadas)
- Exemplo: `AH.png`, `KS.png`, `7D.png`

**Card Backs**: `back-{cor}.png`

**Chips**: `chip-{valor}.png`

#### 3. Usar em Componentes

```typescript
// Em qualquer componente
import { getTrainerAssetUrl } from '../config';

// Cards
const cardUrl = getTrainerAssetUrl(`cards/${rank}${suit}.png`);
// Exemplo: getTrainerAssetUrl('cards/AH.png')

// Card backs
const backUrl = getTrainerAssetUrl('card-backs/back-blue.png');

// Chips
const chipUrl = getTrainerAssetUrl('chips/chip-100.png');
```

#### 4. Otimizar Imagens (Opcional mas Recomendado)

```powershell
# Usar ImageMagick ou similar para reduzir tamanho
magick convert input.png -quality 85 -strip output.png
```

#### 5. Testar Localmente

```powershell
npm run dev
# Verificar no navegador se imagem carrega corretamente
```

#### 6. Commit e Push

```powershell
git add public/trainer/
git commit -m "feat: adiciona novo card back verde"
git push origin main
```

---

## ☁️ Upload para Cloudflare R2

### Pré-requisitos

1. **Instalar Wrangler CLI**
```powershell
npm install -g wrangler
```

2. **Autenticar com Cloudflare**
```powershell
wrangler login
```

### Upload de Spots (Arquivos JSON)

#### Método 1: Upload Completo de TODOS os Spots (RECOMENDADO)

```powershell
# PowerShell Script (com barra de progresso e tratamento de erros)
.\upload-all-spots.ps1

# Ou teste sem fazer upload real:
.\upload-all-spots.ps1 -DryRun
```

Este script:
- Faz upload de TODAS as 8 categorias (147 spots)
- Mostra barra de progresso
- Trata erros automaticamente
- Oferece upload do metadata ao final
- ⏱️ Tempo estimado: 30-60 minutos

#### Método 2: Upload Específico por Categoria

```powershell
# Upload de uma categoria específica (ex: 40-20)
$category = "40-20"
Get-ChildItem ".\spots\$category" -Directory | ForEach-Object {
    $spot = $_.Name
    Write-Host "Uploading $spot..."
    
    # Settings e Equity
    wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/settings.json" --file="./spots/$category/$spot/settings.json"
    wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/equity.json" --file="./spots/$category/$spot/equity.json"
    
    # Nodes
    Get-ChildItem ".\spots\$category\$spot\nodes\*.json" | ForEach-Object {
        wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/nodes/$($_.Name)" --file="$($_.FullName)"
    }
}
```

#### Método 3: Upload de Spot Individual

```powershell
# Upload de um único spot
$category = "40-20"
$spot = "speed32_12"

wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/settings.json" --file="./spots/$category/$spot/settings.json"
wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/equity.json" --file="./spots/$category/$spot/equity.json"

# Upload de nodes
Get-ChildItem ".\spots\$category\$spot\nodes\*.json" | ForEach-Object {
    wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/nodes/$($_.Name)" --file="$($_.FullName)"
}
```

### Upload de Assets (PNG, MP3, etc.)

```powershell
# Upload de TODOS os assets do trainer
.\upload-trainer-assets.bat

# Ou manualmente:
wrangler r2 object put gto-wizard-spots/trainer --file=./public/trainer --recursive
```

**O que está incluído:**
- `/trainer/cards/` - Cartas de baralho
- `/trainer/card-backs/` - Versos das cartas
- `/trainer/chips/` - Fichas
- `/trainer/sounds/` - Arquivos de áudio

### Upload de Metadados

```powershell
# Solutions metadata (usado pela biblioteca)
wrangler r2 object put gto-wizard-spots/solutions-metadata.json --file=./solutions-metadata.json

wrangler r2 object put gto-wizard-spots/solutions.json --file=./solutions.json
```

### Verificar Upload

```powershell
# Listar arquivos no bucket
wrangler r2 object list gto-wizard-spots --prefix=spots/final_table/

# Verificar arquivo específico
wrangler r2 object get gto-wizard-spots/spots/final_table/speed32_1/settings.json
```

### URLs de Produção

Após upload, os arquivos ficam disponíveis em:

```
https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/spots/{caminho}
https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/trainer/{caminho}
```

A aplicação usa automaticamente o CDN em produção via `config.ts`:

```typescript
const VITE_CDN_URL = import.meta.env.VITE_CDN_URL;
const isProduction = import.meta.env.PROD;

export function getResourceUrl(path: string): string {
  if (isProduction && VITE_CDN_URL) {
    return `${VITE_CDN_URL}/${path}`;
  }
  return `/${path}`;
}
```

### Workflow Completo para Novo Spot

```powershell
# 1. Adicionar spot localmente
# (criar pastas e arquivos em /spots/)

# 2. Gerar metadados
node generate_solutions_optimized.cjs

# 3. Testar localmente
npm run dev
# Verificar se spot carrega corretamente

# 4. Commit mudanças
git add spots/
git add solutions-metadata.json
git add solutions.json
git commit -m "feat: adiciona spot XYZ"
git push origin main

# 5. Upload para R2
.\upload-spots-fast.bat
# Ou para spot específico:
# wrangler r2 object put gto-wizard-spots/spots/final_table/novo_spot --file=./spots/final_table/novo_spot --recursive

# 6. Upload metadados atualizados
wrangler r2 object put gto-wizard-spots/solutions-metadata.json --file=./solutions-metadata.json
wrangler r2 object put gto-wizard-spots/solutions.json --file=./solutions.json

# 7. Verificar em produção
# Abrir https://gtowizardprivate.vercel.app
# Testar carregamento do novo spot
```

### Workflow para Novo PNG

```powershell
# 1. Adicionar PNG em public/trainer/
copy C:\Downloads\novo-chip.png public\trainer\chips\

# 2. Testar localmente
npm run dev

# 3. Commit
git add public/trainer/
git commit -m "feat: adiciona chip de 1000"
git push origin main

# 4. Upload para R2
.\upload-trainer-assets.bat
# Ou manualmente:
# wrangler r2 object put gto-wizard-spots/trainer/chips/novo-chip.png --file=./public/trainer/chips/novo-chip.png

# 5. Verificar em produção
# Abrir app e testar se imagem carrega
```

---

## 🔖 Versionamento e Release

### Scripts Disponíveis

```powershell
# Release interativo (recomendado)
.\release.bat
# Pergunta: patch (1.0.0 → 1.0.1), minor (1.0.0 → 1.1.0), ou major (1.0.0 → 2.0.0)

# Ou versões específicas:
.\version-patch.bat   # Bugfixes: 1.2.3 → 1.2.4
.\version-minor.bat   # Novas features: 1.2.3 → 1.3.0
.\version-major.bat   # Breaking changes: 1.2.3 → 2.0.0
```

### O que Acontece no Release

1. **Atualiza `package.json`**
   ```json
   {
     "version": "1.2.4"
   }
   ```

2. **Atualiza `src/version.ts`**
   ```typescript
   export const APP_VERSION = '1.2.4';
   ```

3. **Commit automático**
   ```
   git add package.json src/version.ts
   git commit -m "chore: bump version to 1.2.4"
   ```

4. **Push para GitHub**
   ```
   git push origin main
   ```

5. **Deploy automático no Vercel**
   - Vercel detecta push na branch `main`
   - Inicia build automaticamente
   - Deploy em ~2-3 minutos

### Quando Usar Cada Versão

**Patch** (1.2.3 → 1.2.4):
- Correções de bugs
- Pequenas melhorias de performance
- Ajustes de UI sem funcionalidade nova

**Minor** (1.2.3 → 1.3.0):
- Novas funcionalidades
- Novos spots adicionados
- Melhorias significativas
- Mudanças compatíveis com versão anterior

**Major** (1.2.3 → 2.0.0):
- Breaking changes (mudanças incompatíveis)
- Refatoração completa de componentes
- Mudanças no formato de dados

### Release Manual (sem scripts)

```powershell
# 1. Editar package.json e src/version.ts manualmente

# 2. Commit
git add package.json src/version.ts
git commit -m "chore: bump version to 1.2.5"

# 3. Push
git push origin main

# 4. (Opcional) Criar tag
git tag v1.2.5
git push origin v1.2.5
```

---

## 🔍 Troubleshooting

### Verificar Spots Faltando no R2

Se você perceber que alguns spots aparecem localmente mas não no Vercel, use este comando para testar:

```powershell
# Testar um spot específico no R2
$spot = "speed32_12"
$category = "40-20"
try {
    Invoke-WebRequest -Uri "https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/spots/$category/$spot/settings.json" -Method Head -ErrorAction Stop | Out-Null
    Write-Host "✓ $spot está no R2" -ForegroundColor Green
}
catch {
    Write-Host "✗ $spot FALTANDO no R2" -ForegroundColor Red
}
```

**Solução**: Se spots estiverem faltando, faça upload manual:

```powershell
# Upload de spot individual para R2
$spot = "speed32_12"
$category = "40-20"

wrangler r2 object put gto-wizard-spots/spots/$category/$spot/settings.json --file=./spots/$category/$spot/settings.json
wrangler r2 object put gto-wizard-spots/spots/$category/$spot/equity.json --file=./spots/$category/$spot/equity.json

# Upload de todos os nodes (pode demorar)
Get-ChildItem ".\spots\$category\$spot\nodes\*.json" | ForEach-Object {
    $nodeName = $_.Name
    wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/nodes/$nodeName" --file="./spots/$category/$spot/nodes/$nodeName"
}
```

### Spot não aparece na biblioteca

```powershell
# 1. Verificar estrutura de pastas
ls spots/final_table/novo_spot/
# DEVE ter: settings.json, equity.json, nodes/

# 2. Regenerar metadados
node generate_solutions_optimized.cjs

# 3. Reiniciar dev server
npm run dev

# 4. Verificar console do navegador (F12) por erros
```

### PNG não carrega

```powershell
# 1. Verificar caminho está em public/trainer/
ls public\trainer\cards\AH.png

# 2. Verificar nomenclatura (case-sensitive em produção!)
# Correto: AH.png
# Errado: ah.png, AH.PNG

# 3. Verificar upload no R2
wrangler r2 object get gto-wizard-spots/trainer/cards/AH.png

# 4. Limpar cache do navegador (Ctrl+Shift+Del)
```

### Erro "Junction point failed"

```powershell
# Executar terminal como Administrador
# Criar junction manualmente:
Remove-Item -Path public\spots -Force -ErrorAction SilentlyContinue
New-Item -ItemType Junction -Path public\spots -Target spots
```

### Upload R2 falha

```powershell
# Re-autenticar
wrangler logout
wrangler login

# Verificar conectividade
wrangler r2 bucket list

# Tentar upload menor (arquivo único)
wrangler r2 object put gto-wizard-spots/test.json --file=./solutions.json
```

---

## 📚 Referências

- **Documentação completa**: Ver `ANALISE_PROJETO.md`
- **Arquitetura visual**: Ver `ARQUITETURA_VISUAL.md`
- **Setup Firebase**: Ver `FIREBASE_SETUP.md` (se existir)
- **Deploy Vercel**: Ver `DEPLOY_STEPS.md` (se existir)
- **Separação de componentes**: Ver `POKER_TABLE_SEPARATION.md`

---

## ✅ Checklist Rápido

### Novo Spot
- [ ] Criar pasta em `/spots/{categoria}/{spot_id}/`
- [ ] Adicionar `settings.json`, `equity.json`, `nodes/*.json`
- [ ] Executar `node generate_solutions_optimized.cjs`
- [ ] Testar localmente com `npm run dev`
- [ ] Commit: `git add .` → `git commit -m "feat: ..."` → `git push`
- [ ] Upload R2: `.\upload-spots-fast.bat`
- [ ] Upload metadados: `wrangler r2 object put gto-wizard-spots/solutions-metadata.json --file=./solutions-metadata.json`
- [ ] Verificar em produção

### Novo PNG
- [ ] Copiar para `public/trainer/{categoria}/`
- [ ] Verificar nomenclatura (case-sensitive)
- [ ] Testar localmente
- [ ] Commit e push
- [ ] Upload R2: `.\upload-trainer-assets.bat`
- [ ] Verificar em produção

### Release
- [ ] Executar `.\release.bat`
- [ ] Escolher tipo de versão (patch/minor/major)
- [ ] Aguardar deploy automático do Vercel
- [ ] Testar versão em produção

---

**Última atualização**: Novembro 2025
