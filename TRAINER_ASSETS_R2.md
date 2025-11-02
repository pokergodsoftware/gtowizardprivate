# 🎨 Trainer Assets no Cloudflare R2

Os assets do trainer (imagens, áudios) são hospedados no Cloudflare R2 para reduzir o tamanho do repositório e melhorar performance.

## 📁 Estrutura no R2

```
gto-wizard-spots/
└── trainer/
    ├── table.png              # Mesa de poker padrão
    ├── final_table.png        # Mesa de final table
    ├── cards.png              # Cartas viradas para baixo
    ├── avatar1.png            # Avatar jogador 1
    ├── avatar2.png            # Avatar jogador 2
    ├── avatar3.png            # Avatar jogador 3
    ├── avatar4.png            # Avatar jogador 4
    ├── avatar5.png            # Avatar jogador 5
    ├── avatar6.png            # Avatar jogador 6
    ├── avatar7.png            # Avatar jogador 7
    ├── avatar8.png            # Avatar jogador 8
    ├── timebank1.mp3          # Áudio timebank 8s
    ├── timebank2.mp3          # Áudio timebank 4s
    └── action_button.png      # Botão de ação
```

## 🚀 Upload para R2

### Opção 1: Script Automático (Recomendado)

```bash
upload-trainer-to-r2.bat
```

### Opção 2: Manual via Wrangler

```bash
# Upload de toda a pasta
wrangler r2 object put gto-wizard-spots --file=public/trainer --recursive

# Upload de arquivo específico
wrangler r2 object put gto-wizard-spots/trainer/table.png --file=public/trainer/table.png
```

## 🔧 Como Funciona

### Desenvolvimento (Local)

```typescript
// Em desenvolvimento, usa arquivos locais
getTrainerAssetUrl('table.png')
// Retorna: /trainer/table.png
```

### Produção (Vercel)

```typescript
// Em produção, usa CDN do R2
getTrainerAssetUrl('table.png')
// Retorna: https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/trainer/table.png
```

## 📝 Função Helper

**Arquivo:** `src/config.ts`

```typescript
export function getTrainerAssetUrl(filename: string): string {
  // Em desenvolvimento, usa arquivos locais
  if (config.isDevelopment) {
    return `/trainer/${filename}`;
  }
  
  // Em produção, SEMPRE usa CDN
  if (config.CDN_URL) {
    return `${config.CDN_URL}/trainer/${filename}`;
  }
  
  // Fallback para arquivos locais
  return `/trainer/${filename}`;
}
```

## 🎯 Uso no Código

### Imagens

```typescript
import { getTrainerAssetUrl } from '../src/config.ts';

// Mesa de poker
<img src={getTrainerAssetUrl('table.png')} />

// Avatar
<img src={getTrainerAssetUrl('avatar1.png')} />

// Cartas
<img src={getTrainerAssetUrl('cards.png')} />
```

### Áudios

```typescript
import { getTrainerAssetUrl } from '../src/config.ts';

// Timebank
const audio = new Audio(getTrainerAssetUrl('timebank1.mp3'));
audio.play();
```

## 🧪 Testar URLs

Após fazer upload, teste se os arquivos estão acessíveis:

```
https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/trainer/table.png
https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/trainer/avatar1.png
https://pub-7731c4a3f0aa4dd3b20de84b009f3674.r2.dev/trainer/timebank1.mp3
```

## 📦 .gitignore

A pasta `/public/trainer/` está no `.gitignore` (exceto documentação):

```gitignore
# Trainer assets (hospedados no Cloudflare R2)
/public/trainer/
!/public/trainer/AUDIO_INSTRUCTIONS.md
!/public/trainer/README_AUDIO.md
```

## 🔄 Atualizar Assets

Quando precisar atualizar um asset:

1. Modifique o arquivo localmente em `/public/trainer/`
2. Execute `upload-trainer-to-r2.bat`
3. Aguarde 1-2 minutos para propagação do CDN
4. Teste a URL no navegador

## ⚠️ Importante

- **NÃO** faça commit dos arquivos em `/public/trainer/` (exceto docs)
- **SEMPRE** faça upload para o R2 antes de fazer deploy
- Verifique se `VITE_CDN_URL` está configurado no Vercel
- CORS deve estar configurado no bucket R2

## 🐛 Troubleshooting

### Erro: Arquivo não encontrado

1. Verifique se fez upload: `upload-trainer-to-r2.bat`
2. Teste a URL diretamente no navegador
3. Aguarde 1-2 minutos para propagação

### Erro: CORS

Configure CORS no bucket R2:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"]
  }
]
```

### Desenvolvimento não funciona

Certifique-se que os arquivos existem em `/public/trainer/` localmente.
