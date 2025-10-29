# 🚀 Deploy com Cloudflare R2 + Vercel

Guia completo para hospedar o GTO Wizard com spots no Cloudflare R2 e código no Vercel.

---

## 📦 Parte 1: Configurar Cloudflare R2

### 1. Criar conta Cloudflare
1. Acesse: https://dash.cloudflare.com/sign-up
2. Crie uma conta gratuita (não precisa de cartão de crédito inicialmente)

### 2. Criar bucket R2
1. No dashboard Cloudflare, clique em **R2** no menu lateral
2. Clique em **Create bucket**
3. Nome do bucket: `gto-wizard-spots` (ou qualquer nome único)
4. Região: Automatic (recomendado)
5. Clique em **Create bucket**

### 3. Configurar acesso público
1. No bucket criado, vá em **Settings**
2. Role até **Public access**
3. Clique em **Allow Access** ou **Connect Domain**
4. Escolha uma das opções:
   - **Opção A (Mais fácil)**: Use o domínio R2.dev fornecido
   - **Opção B**: Conecte um domínio personalizado

5. Copie a **URL pública** (exemplo: `https://pub-abc123.r2.dev`)

### 4. Fazer upload dos spots

**Opção A - Via Dashboard (Interface Web):**
1. No bucket, clique em **Upload**
2. Arraste a pasta `spots/` inteira ou selecione os arquivos
3. Aguarde o upload completar (pode demorar ~10-20 min para 400MB)

**Opção B - Via Wrangler CLI (Mais rápido e recomendado):**

```bash
# 1. Instalar Wrangler globalmente
npm install -g wrangler

# 2. Fazer login na Cloudflare
wrangler login

# 3. Upload da pasta spots (execute na raiz do projeto)
wrangler r2 object put gto-wizard-spots --file=./spots --recursive

# Ou upload de arquivos individuais
wrangler r2 object put gto-wizard-spots/spots/100-60/speed32_1/settings.json --file=./spots/100-60/speed32_1/settings.json
```

---

## ⚙️ Parte 2: Configurar o Projeto

### 1. Criar arquivo de ambiente local

Crie o arquivo `.env.local` na raiz do projeto:

```env
# Deixe vazio para usar arquivos locais em desenvolvimento
VITE_CDN_URL=
```

### 2. Configurar variável de ambiente no Vercel

1. Acesse seu projeto no Vercel: https://vercel.com/dashboard
2. Vá em **Settings** > **Environment Variables**
3. Adicione uma nova variável:
   - **Name**: `VITE_CDN_URL`
   - **Value**: `https://pub-abc123.r2.dev` (sua URL do R2)
   - **Environment**: Production
4. Clique em **Save**

### 3. Atualizar código para usar CDN

O arquivo `src/config.ts` já foi criado com a configuração necessária.

Agora você precisa atualizar `App.tsx` para usar a função `getResourceUrl()`:

```typescript
// No topo do arquivo, adicione:
import { getResourceUrl } from './config.ts';

// Substitua todos os fetch('./...') por:
fetch(getResourceUrl('solutions-metadata.json'))
fetch(getResourceUrl(`${basePath}/settings.json`))
fetch(getResourceUrl(`${basePath}/equity.json`))
fetch(getResourceUrl(`${solution.path}/nodes/${id}.json`))
```

---

## 🔧 Parte 3: Atualizar .gitignore

Adicione ao `.gitignore` para não fazer commit da pasta spots:

```gitignore
# Spots (hospedados no R2)
/spots/
/public/spots/

# Arquivos de ambiente
.env.local
.env.production.local
```

---

## 🚀 Parte 4: Deploy

### 1. Commit e push das mudanças

```bash
git add .
git commit -m "feat: configurar Cloudflare R2 para spots"
git push origin main
```

### 2. Deploy no Vercel

O Vercel vai fazer deploy automaticamente quando você der push.

Ou faça deploy manual:
```bash
vercel --prod
```

---

## ✅ Verificação

### Testar localmente (desenvolvimento):
```bash
npm run dev
```
- Deve carregar spots de `./spots/` (arquivos locais)

### Testar em produção:
1. Acesse sua URL do Vercel
2. Abra o DevTools (F12) > Network
3. Verifique se os requests estão indo para `https://pub-abc123.r2.dev/spots/...`

---

## 💰 Custos Estimados

### Cloudflare R2:
- **Armazenamento**: $0.015/GB/mês
  - 400MB = ~$0.006/mês
  - 1GB = ~$0.015/mês
- **Operações**: 
  - 1M leituras grátis/mês
  - Depois: $0.36/milhão
- **Transferência**: GRÁTIS (sem egress fees)

### Vercel:
- **Hobby (Grátis)**: 
  - 100GB bandwidth/mês
  - Builds ilimitados
  - Domínio .vercel.app grátis

**Total estimado: $0.01 - $0.50/mês** 🎉

---

## 🔄 Atualizando Spots no Futuro

Quando adicionar novos spots:

```bash
# Upload de um spot específico
wrangler r2 object put gto-wizard-spots/spots/100-60/novo_spot --file=./spots/100-60/novo_spot --recursive

# Ou re-upload completo
wrangler r2 object put gto-wizard-spots/spots --file=./spots --recursive
```

---

## 🐛 Troubleshooting

### Erro: CORS ao carregar spots
1. No bucket R2, vá em **Settings** > **CORS Policy**
2. Adicione:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"]
  }
]
```

### Spots não carregam em produção
1. Verifique se `VITE_CDN_URL` está configurado no Vercel
2. Verifique se a URL do R2 está correta
3. Teste a URL diretamente no navegador: `https://pub-abc123.r2.dev/spots/100-60/speed32_1/settings.json`

### Upload lento via Dashboard
- Use Wrangler CLI (muito mais rápido)
- Ou faça upload em partes menores

---

## 📝 Próximos Passos

1. [ ] Criar conta Cloudflare
2. [ ] Criar bucket R2
3. [ ] Fazer upload dos spots
4. [ ] Copiar URL pública do R2
5. [ ] Configurar `VITE_CDN_URL` no Vercel
6. [ ] Atualizar código (próximo passo)
7. [ ] Fazer deploy
8. [ ] Testar em produção

---

**Dúvidas?** Verifique a documentação oficial:
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Vercel: https://vercel.com/docs
