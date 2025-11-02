# 🔧 Troubleshooting - Cloudflare R2

## ❌ Problema: Solutions Library vazia no Vercel

### Sintomas:
- Solutions Library mostra "No solutions found"
- URL do R2 funciona no navegador mas não no app
- Console mostra erro 404 ao carregar `solutions-metadata.json`

### Causa:
O arquivo `solutions-metadata.json` não está na raiz do bucket R2.

### Solução:

**1. Fazer upload do metadata:**
```bash
# Via script (Windows)
upload-metadata.bat

# Ou via comando direto
wrangler r2 object put gto-wizard-spots/solutions-metadata.json --file=public/solutions-metadata.json
```

**2. Verificar se funcionou:**
Abra no navegador:
```
https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/solutions-metadata.json
```

Deve retornar um JSON com a lista de soluções.

**3. Fazer redeploy no Vercel:**
```bash
# Opção A: Push para git (deploy automático)
git add .
git commit -m "fix: ensure metadata is uploaded to R2"
git push

# Opção B: Deploy manual
vercel --prod
```

---

## ✅ Checklist de Verificação

### No Cloudflare R2:

- [ ] Bucket `gto-wizard-spots` criado
- [ ] Acesso público habilitado
- [ ] URL pública: `https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev`
- [ ] Arquivo `solutions-metadata.json` na raiz do bucket
- [ ] Pasta `spots/` com todas as subpastas
- [ ] CORS configurado (se necessário)

### No Vercel:

- [ ] Variável `VITE_CDN_URL` configurada
- [ ] Valor: `https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev`
- [ ] Environment: Production
- [ ] Deploy realizado após configurar variável

### No Código:

- [ ] `src/config.ts` existe
- [ ] `App.tsx` importa `getResourceUrl`
- [ ] Todos os `fetch()` usam `getResourceUrl()`
- [ ] `.gitignore` exclui `/spots/` e `/public/spots/`

---

## 🧪 Testes

### Teste 1: URL do R2 diretamente
```
https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/solutions-metadata.json
```
✅ Deve retornar JSON
❌ Se retornar 404: arquivo não foi enviado

### Teste 2: Spot específico
```
https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/spots/100-60/speed32_1/settings.json
```
✅ Deve retornar JSON com configurações do spot
❌ Se retornar 404: pasta spots não foi enviada

### Teste 3: App em produção
1. Abra o app no Vercel
2. F12 > Network
3. Filtre por "solutions-metadata"
4. Verifique a URL da requisição

✅ Deve ser: `https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/solutions-metadata.json`
❌ Se for `https://seu-app.vercel.app/solutions-metadata.json`: variável não configurada

---

## 📁 Estrutura Esperada no R2

```
gto-wizard-spots/
├── solutions-metadata.json          ← RAIZ DO BUCKET
└── spots/
    ├── 100-60/
    │   ├── speed32_1/
    │   │   ├── settings.json
    │   │   ├── equity.json
    │   │   └── nodes/
    │   │       ├── 0.json
    │   │       ├── 1.json
    │   │       └── ...
    │   └── ...
    ├── after_bubble/
    └── final_table/
```

---

## 🚀 Upload Completo (do zero)

Se precisar fazer upload de tudo novamente:

```bash
# 1. Instalar Wrangler (se não tiver)
npm install -g wrangler

# 2. Login na Cloudflare
wrangler login

# 3. Upload completo
upload-all-to-r2.bat

# Ou manualmente:
wrangler r2 object put gto-wizard-spots/solutions-metadata.json --file=public/solutions-metadata.json
wrangler r2 object put gto-wizard-spots --file=spots --recursive
```

---

## 🐛 Erros Comuns

### Erro: "wrangler: command not found"
**Solução:**
```bash
npm install -g wrangler
```

### Erro: "Not logged in"
**Solução:**
```bash
wrangler login
```

### Erro: "Bucket not found"
**Solução:**
Verifique o nome do bucket no comando. Deve ser exatamente: `gto-wizard-spots`

### Erro: CORS
**Solução:**
No bucket R2 > Settings > CORS Policy:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"]
  }
]
```

---

## 📞 Suporte

Se o problema persistir:

1. Verifique os logs do Vercel
2. Verifique o console do navegador (F12)
3. Teste as URLs diretamente no navegador
4. Confirme que `VITE_CDN_URL` está configurado

**Documentação:**
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Wrangler: https://developers.cloudflare.com/workers/wrangler/
- Vercel: https://vercel.com/docs
