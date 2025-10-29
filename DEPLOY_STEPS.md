# 🚀 Passos para Deploy - Cloudflare R2 + Vercel

## ✅ Checklist Rápido

### 1️⃣ Upload dos Spots para Cloudflare R2

```bash
# Instalar Wrangler (se ainda não tiver)
npm install -g wrangler

# Fazer login
wrangler login

# Upload da pasta spots
wrangler r2 object put gto-wizard-spots/spots --file=./spots --recursive
```

**Tempo estimado:** 15-30 minutos (dependendo da conexão)

---

### 2️⃣ Configurar Variável de Ambiente no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione:
   - **Name:** `VITE_CDN_URL`
   - **Value:** `https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev`
   - **Environment:** Production
5. Clique em **Save**

---

### 3️⃣ Atualizar .gitignore

Adicione ao `.gitignore`:

```gitignore
# Spots (hospedados no R2)
/spots/
/public/spots/

# Arquivos de ambiente
.env.local
.env.production.local
```

---

### 4️⃣ Commit e Deploy

```bash
# Adicionar mudanças
git add .

# Commit
git commit -m "feat: configurar Cloudflare R2 para spots"

# Push (Vercel fará deploy automático)
git push origin main
```

---

## 🧪 Testar

### Desenvolvimento (local):
```bash
npm run dev
```
- Deve carregar de `./spots/` (arquivos locais)

### Produção:
1. Acesse sua URL do Vercel
2. Abra DevTools (F12) > Network
3. Verifique se os requests vão para `https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/spots/...`

---

## 💰 Custos

- **Cloudflare R2:** ~$0.006/mês (400MB)
- **Vercel:** Grátis (Hobby plan)
- **Total:** ~$0.01/mês 🎉

---

## 🔧 Troubleshooting

### Erro CORS
No bucket R2, adicione CORS policy:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"]
  }
]
```

### Spots não carregam
1. Verifique se `VITE_CDN_URL` está no Vercel
2. Teste a URL diretamente: `https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/spots/100-60/speed32_1/settings.json`
3. Verifique console do navegador (F12)

---

## 📝 Código Atualizado

✅ `config.ts` - Criado
✅ `App.tsx` - Atualizado para usar `getResourceUrl()`
✅ `.env.example` - Criado com URL do R2
✅ `.gitignore` - Pronto para atualizar

**Próximo passo:** Fazer upload dos spots e deploy! 🚀
