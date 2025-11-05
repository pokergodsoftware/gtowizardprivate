# Operational Guide - GTO Wizard Private

## 📋 Contents
1. [Commit & Push](#commit--push)
2. [Adding New Spots](#adding-new-spots)
3. [Adding PNG Images](#adding-png-images)
4. [Uploading to Cloudflare R2](#uploading-to-cloudflare-r2)
5. [Versioning & Releases](#versioning--releases)

---

## 🔄 Commit & Push

### Basic Git Commands

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

### Commit Message Conventions

Use semantic prefixes:

- `feat:` - New feature
  - Example: `feat: add Tournament mode to trainer`
- `fix:` - Bug fix
  - Example: `fix: fix loading of empty nodes`
- `refactor:` - Code refactor (no behavior change)
  - Example: `refactor: extract spot logic to utils/`

  ---

  ## 🔄 Commit & Push

  ### Basic Git Commands

  ```powershell
  # 1. Check status (modified files)
  git status

  # 2. Stage specific files
  git add path/to/file.tsx
  git add components/TrainerSimulator.tsx

  # 3. Stage ALL modified files
  git add .

  # 4. Commit with a descriptive message
  git commit -m "feat: add new RFI spot generator"
  git commit -m "fix: correct EV calculation in TrainerFeedback"
  git commit -m "refactor: modularize PokerTable component"

  # 5. Push to GitHub
  git push origin main
  ```

  ### Commit Message Conventions

  Use semantic prefixes:

  - `feat:` - New feature
    - Example: `feat: add Tournament mode to trainer`
  - `fix:` - Bug fix
    - Example: `fix: fix loading of empty nodes`
  - `refactor:` - Code refactor (no behavior change)
    - Example: `refactor: extract spot logic to utils/`
  - `docs:` - Documentation only
    - Example: `docs: update GUIA_OPERACIONAL.md`
  - `style:` - Formatting, whitespace (no code changes)
    - Example: `style: fix indentation in RangeGrid`
  - `chore:` - Maintenance tasks
    - Example: `chore: update dependencies in package.json`

  ### Full Workflow

  ```powershell
  # 1. Check current branch
  git branch

  # 2. Inspect changes
  git status

  # 3. View diffs
  git diff

  # 4. Stage files
  git add .

  # 5. Commit
  git commit -m "feat: implement visual feedback in trainer"

  # 6. Push (this will trigger automatic Vercel deploy)
  git push origin main

  # 7. Verify push
  git log --oneline -5
  ```

  ### ⚠️ Merge Conflicts

  If you see errors about divergent branches:

  ```powershell
  # Pull remote changes
  git pull origin main

  # If conflicts occur, edit files and resolve manually
  # Then stage and commit
  git add .
  git commit -m "merge: resolve conflicts"
  git push origin main
  ```

  ---

  ## 🎯 Adding New Spots

  ### Step 1: Create Folder Structure

  Spots follow a folder hierarchy under `/spots/`:

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
  │   └── new_spot_123/
  │       ├── settings.json
  │       ├── equity.json
  │       └── nodes/
  ├── near_bubble/
  ├── after_bubble/
  └── ...
  ```

  ### Step 2: Required Spot Files

  Each spot MUST include:

  1. **`settings.json`** - Tournament settings
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

  2. **`equity.json`** - Players' equity
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

  3. **`nodes/`** - Folder with JSON files for decision tree nodes
    - Each node is a separate file: `0.json`, `1.json`, `2.json`, etc.
    - Use lazy loading for very large trees (12,000+ nodes)

  ### Step 3: Generate Metadata

  **CRITICAL**: After adding or modifying spots, ALWAYS run:

  ```powershell
  node generate_solutions_optimized.cjs
  ```

  This script:
  - Scans the entire `/spots/` structure
  - Reads `settings.json` and `equity.json` for each spot
  - Generates `solutions-metadata.json` and `solutions.json`
  - **Uses relative paths** (`./spots/...` not `/spots/...`)
  - Creates a junction point `public/spots` -> `spots/` if missing

  ### Step 4: Restart Dev Server

  ```powershell
  # Stop server (Ctrl+C in terminal)
  # Restart
  npm run dev
  ```

  ### Step 5: Test Locally

  1. Open `http://localhost:3000`
  2. Go to "Solutions Library"
  3. Find the new spot in the appropriate category
  4. Click to load and verify nodes load correctly

  ### Step 6: Commit & Push

  ```powershell
  git add spots/
  git add solutions-metadata.json
  git add solutions.json
  git commit -m "feat: add new spot {spot_name}"
  git push origin main
  ```

  ### ⚠️ Important Notes

  - **Relative paths**: Metadata MUST use `./spots/...` (not `/spots/...`)
  - **Junction point**: On Windows the `public/spots` junction to `spots/` is required for Vite to serve files
    - It is created automatically by `generate_solutions_optimized.cjs`
    - If creation fails, run the terminal as Administrator
  - **Metadata not auto-watched**: Re-run `node generate_solutions_optimized.cjs` after changes

  ---

  ## 🖼️ Adding PNG Images

  ### Asset Locations

  ```
  public/
  └── trainer/
      ├── card-backs/
      │   ├── back-blue.png
      │   ├── back-red.png
      │   └── ...
      ├── cards/
      │   ├── AH.png (Ace of hearts)
      │   ├── KD.png (King of diamonds)
      │   └── ...
      ├── chips/
      │   ├── chip-1.png
      │   ├── chip-5.png
      │   └── ...
      └── sounds/
          ├── card-flip.mp3
          └── timer-alert.mp3
  ```

  ### Add a New PNG

  #### 1. Copy the file to the appropriate folder

  ```powershell
  # Example: add a new card back
  copy C:\Downloads\back-green.png public\trainer\card-backs\\
  ```

  #### 2. Naming Conventions

  **Cards**: Use a 2-character code
  - Ranks: `A`, `K`, `Q`, `J`, `T`, `9`, `8`, `7`, `6`, `5`, `4`, `3`, `2`
  - Suits: `H` (hearts), `D` (diamonds), `C` (clubs), `S` (spades)
  - Example: `AH.png`, `KS.png`, `7D.png`

  **Card Backs**: `back-{color}.png`

  **Chips**: `chip-{value}.png`

  #### 3. Use in Components

  ```typescript
  // In any component
  import { getTrainerAssetUrl } from '../config';

  // Cards
  const cardUrl = getTrainerAssetUrl(`cards/${rank}${suit}.png`);
  // Example: getTrainerAssetUrl('cards/AH.png')

  // Card backs
  const backUrl = getTrainerAssetUrl('card-backs/back-blue.png');

  // Chips
  const chipUrl = getTrainerAssetUrl('chips/chip-100.png');
  ```

  #### 4. Optimize Images (Optional but recommended)

  ```powershell
  # Use ImageMagick or similar to reduce file size
  magick convert input.png -quality 85 -strip output.png
  ```

  #### 5. Test Locally

  ```powershell
  npm run dev
  # Verify the image loads in the browser
  ```

  #### 6. Commit & Push

  ```powershell
  git add public/trainer/
  git commit -m "feat: add new green card back"
  git push origin main
  ```

  ---

  ## ☁️ Uploading to Cloudflare R2

  ### Prerequisites

  1. **Install Wrangler CLI**
  ```powershell
  npm install -g wrangler
  ```

  2. **Authenticate with Cloudflare**
  ```powershell
  wrangler login
  ```

  ### Uploading Spots (JSON files)

  #### Method 1: Upload All Spots (RECOMMENDED)

  ```powershell
  # PowerShell script with progress bar and error handling
  .\\upload-all-spots.ps1

  # Or a dry run
  .\\upload-all-spots.ps1 -DryRun
  ```

  This script:
  - Uploads ALL categories
  - Shows progress
  - Handles errors automatically
  - Offers metadata upload at the end
  - Estimated time: 30–60 minutes

  #### Method 2: Upload by Category

  ```powershell
  # Upload a specific category (e.g., 40-20)
  $category = "40-20"
  Get-ChildItem ".\\spots\\$category" -Directory | ForEach-Object {
      $spot = $_.Name
      Write-Host "Uploading $spot..."
    
      # Settings and Equity
      wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/settings.json" --file="./spots/$category/$spot/settings.json"
      wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/equity.json" --file="./spots/$category/$spot/equity.json"
    
      # Nodes
      Get-ChildItem ".\\spots\\$category\\$spot\\nodes\\*.json" | ForEach-Object {
          wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/nodes/$($_.Name)" --file="$($_.FullName)"
      }
  }
  ```

  #### Method 3: Upload Single Spot

  ```powershell
  # Upload a single spot
  $category = "40-20"
  $spot = "speed32_12"

  wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/settings.json" --file="./spots/$category/$spot/settings.json"
  wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/equity.json" --file="./spots/$category/$spot/equity.json"

  # Upload nodes
  Get-ChildItem ".\\spots\\$category\\$spot\\nodes\\*.json" | ForEach-Object {
      wrangler r2 object put "gto-wizard-spots/spots/$category/$spot/nodes/$($_.Name)" --file="$($_.FullName)"
  }
  ```

  ### Upload Trainer Assets (PNG, MP3, etc.)

  ```powershell
  # Upload all trainer assets
  .\\upload-trainer-assets.bat

  # Or manually:
  wrangler r2 object put gto-wizard-spots/trainer --file=./public/trainer --recursive
  ```

  Included paths:
  - `/trainer/cards/` - Deck card images
  - `/trainer/card-backs/` - Card backs
  - `/trainer/chips/` - Chip images
  - `/trainer/sounds/` - Audio files

  ### Upload Metadata

  ```powershell
  # Solutions metadata (used by the library)
  wrangler r2 object put gto-wizard-spots/solutions-metadata.json --file=./solutions-metadata.json

  wrangler r2 object put gto-wizard-spots/solutions.json --file=./solutions.json
  ```

  ### Verify Upload

  ```powershell
  # List objects in the bucket
  wrangler r2 object list gto-wizard-spots --prefix=spots/final_table/

  # Get a specific file
  wrangler r2 object get gto-wizard-spots/spots/final_table/speed32_1/settings.json
  ```

  ### Production URLs

  After upload, files are available at:

  ```
  https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/spots/{path}
  https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/trainer/{path}
  ```

  The app uses the CDN in production via `config.ts`:

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

  ### Full Workflow for a New Spot

  ```powershell
  # 1. Add the spot locally (create folders and files under /spots/)

  # 2. Generate metadata
  node generate_solutions_optimized.cjs

  # 3. Test locally
  npm run dev
  # Verify the spot loads correctly

  # 4. Commit changes
  git add spots/
  git add solutions-metadata.json
  git add solutions.json
  git commit -m "feat: add spot XYZ"
  git push origin main

  # 5. Upload to R2
  .\\upload-spots-fast.bat
  # Or for a specific spot:
  # wrangler r2 object put gto-wizard-spots/spots/final_table/new_spot --file=./spots/final_table/new_spot --recursive

  # 6. Upload updated metadata
  wrangler r2 object put gto-wizard-spots/solutions-metadata.json --file=./solutions-metadata.json
  wrangler r2 object put gto-wizard-spots/solutions.json --file=./solutions.json

  # 7. Verify in production
  # Open https://gtowizardprivate.vercel.app
  # Test loading the new spot
  ```

  ### Workflow for a New PNG

  ```powershell
  # 1. Add PNG to public/trainer/
  copy C:\Downloads\new-chip.png public\trainer\chips\\

  # 2. Test locally
  npm run dev

  # 3. Commit
  git add public/trainer/
  git commit -m "feat: add chip-1000"
  git push origin main

  # 4. Upload to R2
  .\\upload-trainer-assets.bat
  # Or manually:
  # wrangler r2 object put gto-wizard-spots/trainer/chips/new-chip.png --file=./public/trainer/chips/new-chip.png

  # 5. Verify in production
  # Open the app and confirm the image loads
  ```

  ---
   - Inicia build automaticamente
   - Deploy em ~2-3 minutos

### When to Use Each Version

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

# 4. Check browser console (F12) for errors
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
