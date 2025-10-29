# Deploy no Vercel - GTO Wizard Private

## ⚠️ Problema Comum: solutions-metadata.json not found

Se você receber o erro `404 (Not Found)` para `solutions-metadata.json`, siga estes passos:

## ✅ Solução

### 1. Verificar Arquivos Necessários

Certifique-se de que os seguintes arquivos existem:

```
public/
  ├── solutions-metadata.json  ✅ OBRIGATÓRIO
  ├── solutions.json
  └── spots/                   ✅ OBRIGATÓRIO (junction ou cópia)
      ├── 100-60/
      ├── 60-40/
      └── final_table/
```

### 2. Gerar solutions-metadata.json

Execute o script para gerar o arquivo de metadados:

```bash
node generate_solutions_lazy.cjs
```

Isso criará:
- `solutions-metadata.json` (raiz)
- `public/solutions-metadata.json` (cópia automática)

### 3. Verificar Junction/Link da Pasta Spots

**Opção A: Windows (Junction - Recomendado)**
```bash
# Executar como Administrador
setup_public.bat
```

**Opção B: Copiar Pasta Spots (Alternativa)**
```bash
# Se junction não funcionar, copie manualmente
xcopy /E /I /Y spots public\spots
```

### 4. Build Local (Teste)

Antes de fazer deploy, teste localmente:

```bash
npm run build
npm run preview
```

Acesse `http://localhost:4173` e verifique se:
- ✅ solutions-metadata.json carrega
- ✅ Soluções aparecem na biblioteca
- ✅ Ranges carregam ao clicar em uma solução

### 5. Deploy no Vercel

**Opção A: Via CLI**
```bash
npm install -g vercel
vercel --prod
```

**Opção B: Via GitHub**
1. Faça commit de todos os arquivos:
   ```bash
   git add .
   git commit -m "Add solutions metadata and vercel config"
   git push
   ```

2. No Vercel Dashboard:
   - Conecte o repositório
   - Configure Build Settings:
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
     - **Install Command:** `npm install`

### 6. Verificar Deploy

Após o deploy, verifique:
- ✅ `https://seu-app.vercel.app/solutions-metadata.json` retorna JSON
- ✅ `https://seu-app.vercel.app/spots/final_table/1/settings.json` retorna JSON
- ✅ App carrega sem erros

## 🔧 Troubleshooting

### Erro: "solutions-metadata.json not found"

**Causa:** Arquivo não está em `public/` ou não foi incluído no build.

**Solução:**
```bash
# Regenerar metadados
node generate_solutions_lazy.cjs

# Verificar se existe
dir public\solutions-metadata.json

# Se não existir, copiar manualmente
copy solutions-metadata.json public\solutions-metadata.json
```

### Erro: "Failed to load settings.json"

**Causa:** Pasta `spots` não está em `public/` ou junction não funciona no Vercel.

**Solução:** Copiar pasta inteira:
```bash
xcopy /E /I /Y spots public\spots
```

### Erro: "Build failed"

**Causa:** Dependências ou configuração incorreta.

**Solução:**
```bash
# Limpar cache
rm -rf node_modules package-lock.json
npm install

# Testar build
npm run build
```

## 📁 Estrutura Final para Deploy

```
WizardPrivadoo/
├── public/
│   ├── solutions-metadata.json  ← CRÍTICO
│   ├── solutions.json
│   └── spots/                   ← CRÍTICO
│       ├── 100-60/
│       ├── 60-40/
│       └── final_table/
├── src/
├── dist/                        ← Gerado pelo build
├── vercel.json                  ← Configuração Vercel
├── vite.config.ts
└── package.json
```

## ✨ Checklist Pré-Deploy

- [ ] `public/solutions-metadata.json` existe
- [ ] `public/spots/` existe e contém subpastas
- [ ] `npm run build` funciona sem erros
- [ ] `npm run preview` mostra app funcionando
- [ ] `vercel.json` está configurado
- [ ] Commit de todos os arquivos necessários

## 🚀 Deploy Automático

Para deploys futuros, basta:
```bash
git add .
git commit -m "Update solutions"
git push
```

O Vercel fará deploy automático! 🎉
