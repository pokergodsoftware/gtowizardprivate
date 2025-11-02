# 🚀 Versionamento - Quick Start

## ⚡ Uso Rápido

### Fazer Release (Recomendado)

```bash
release.bat
```

Escolha:
- **1** = PATCH (bug fixes) → `1.0.0` → `1.0.1`
- **2** = MINOR (features) → `1.0.0` → `1.1.0`
- **3** = MAJOR (breaking) → `1.0.0` → `2.0.0`

Isso vai:
✅ Atualizar versão
✅ Fazer commit
✅ Fazer push
✅ Trigger deploy no Vercel

## 📍 Onde Aparece

A versão aparece no **canto inferior direito** do app:

```
                    v1.0.0
```

## 🎯 Quando Usar

| Tipo | Quando | Exemplo |
|------|--------|---------|
| **PATCH** | Bug fix, ajuste pequeno | Corrigiu cálculo de EV |
| **MINOR** | Nova feature | Adicionou leaderboard |
| **MAJOR** | Mudança grande | Novo sistema de dados |

## 📝 Exemplo Completo

```bash
# 1. Faça suas alterações
# 2. Teste localmente
npm run dev

# 3. Faça release
release.bat

# 4. Escolha tipo (1, 2 ou 3)
# 5. Pronto! Deploy automático
```

## 📚 Documentação Completa

Veja `VERSIONING.md` para detalhes completos.
