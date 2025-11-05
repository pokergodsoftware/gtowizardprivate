# Diagnóstico: Spots 40-20 Faltando no R2

## Problema Identificado

**Local**: 14 spots na pasta `spots/40-20/`
**Vercel/R2**: 0 spots (todos faltando!)

## Spots Faltando

1. speed32_12
2. speed32_13
3. speed32_15
4. speed32_16
5. speed32_17
6. speed32_18
7. speed32_2d
8. speed32_5d
9. speed32_6d
10. speed50_1
11. speed50_2
12. speed50_3
13. speed50_4
14. speed50_5

## Causa Provável

Os spots de 40-20 nunca foram enviados para o Cloudflare R2 durante o upload inicial, ou foram deletados acidentalmente.

O `solutions-metadata.json` **contém** as 14 entradas, mas os arquivos físicos não estão no bucket R2.

## Solução

### Opção 1: Script Automático (RECOMENDADO)

Execute o script batch criado:

```powershell
.\upload-40-20-spots.bat
```

Este script faz upload de:
- `settings.json` de cada spot
- `equity.json` de cada spot  
- Todos os arquivos `nodes/*.json` de cada spot

⏱️ **Tempo estimado**: 15-30 minutos (dependendo do número de nodes)

### Opção 2: Upload Manual por Spot

```powershell
# Exemplo para speed32_12
wrangler r2 object put gto-wizard-spots/spots/40-20/speed32_12/settings.json --file=./spots/40-20/speed32_12/settings.json
wrangler r2 object put gto-wizard-spots/spots/40-20/speed32_12/equity.json --file=./spots/40-20/speed32_12/equity.json

# Upload de nodes (um por um)
wrangler r2 object put gto-wizard-spots/spots/40-20/speed32_12/nodes/0.json --file=./spots/40-20/speed32_12/nodes/0.json
# ... repetir para cada node
```

### Opção 3: Upload com Script PowerShell

```powershell
$spots = @("speed32_12", "speed32_13", "speed32_15", "speed32_16", "speed32_17", "speed32_18", "speed32_2d", "speed32_5d", "speed32_6d", "speed50_1", "speed50_2", "speed50_3", "speed50_4", "speed50_5")

foreach ($spot in $spots) {
    Write-Host "Uploading $spot..." -ForegroundColor Cyan
    
    # Settings e Equity
    wrangler r2 object put "gto-wizard-spots/spots/40-20/$spot/settings.json" --file="./spots/40-20/$spot/settings.json"
    wrangler r2 object put "gto-wizard-spots/spots/40-20/$spot/equity.json" --file="./spots/40-20/$spot/equity.json"
    
    # Nodes
    Get-ChildItem ".\spots\40-20\$spot\nodes\*.json" | ForEach-Object {
        $nodeName = $_.Name
        wrangler r2 object put "gto-wizard-spots/spots/40-20/$spot/nodes/$nodeName" --file="./spots/40-20/$spot/nodes/$nodeName"
    }
    
    Write-Host "✓ $spot concluído" -ForegroundColor Green
}
```

## Verificação Pós-Upload

Aguarde 5-10 minutos para propagação do CDN, depois teste:

```powershell
# Testar um spot
Invoke-WebRequest -Uri "https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/spots/40-20/speed32_12/settings.json" -Method Head

# Se retornar 200 OK, está funcionando!
```

Ou acesse o Vercel:
1. Vá para https://gtowizardprivate.vercel.app
2. Clique em "Solutions Library"
3. Procure categoria "40~20% left"
4. Deve mostrar 14 spots

## Prevenção Futura

Para evitar esse problema no futuro:

1. **Sempre verifique após upload**:
   ```powershell
   # Testar se spot está acessível
   Invoke-WebRequest -Uri "https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/spots/{category}/{spot}/settings.json" -Method Head
   ```

2. **Use scripts de verificação** antes de considerar upload completo

3. **Mantenha backup local** dos spots (já está fazendo isso!)

4. **Documente uploads** em arquivo de log

## Status

- [ ] Upload iniciado
- [ ] Upload concluído
- [ ] Aguardando propagação CDN (5-10 min)
- [ ] Testado no Vercel
- [ ] Confirmado: 14 spots visíveis

---

**Data**: 5 de novembro de 2025
**Responsável**: [Seu nome]
