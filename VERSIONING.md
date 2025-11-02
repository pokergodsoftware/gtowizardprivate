# 📦 Sistema de Versionamento

Sistema automático de versionamento do GTO Wizard seguindo o padrão **Semantic Versioning (SemVer)**.

## 📋 Formato de Versão

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └─ Correções de bugs (1.0.0 → 1.0.1)
  │     └─────── Novas funcionalidades (1.0.5 → 1.1.0)
  └───────────── Mudanças importantes (1.5.3 → 2.0.0)
```

## 🚀 Como Usar

### Opção 1: Scripts Individuais

**Atualizar PATCH (correções):**
```bash
version-patch.bat
```
Exemplo: `1.0.0` → `1.0.1`

**Atualizar MINOR (features):**
```bash
version-minor.bat
```
Exemplo: `1.0.5` → `1.1.0`

**Atualizar MAJOR (breaking changes):**
```bash
version-major.bat
```
Exemplo: `1.5.3` → `2.0.0`

### Opção 2: Release Completo (Recomendado)

Atualiza versão + commit + push automático:

```bash
release.bat
```

O script vai:
1. Perguntar o tipo de atualização (PATCH/MINOR/MAJOR)
2. Atualizar `package.json` e `src/version.ts`
3. Fazer commit com mensagem `chore: release vX.X.X`
4. Fazer push para o repositório
5. Vercel fará deploy automático

## 📁 Arquivos Atualizados

Quando você atualiza a versão, os seguintes arquivos são modificados:

- **`package.json`** - Versão do pacote
- **`src/version.ts`** - Versão exportada para o app

## 👁️ Visualização no App

A versão aparece no **canto inferior direito** da tela:

```
┌─────────────────────────────┐
│                             │
│                             │
│                             │
│                      v1.0.0 │ ← Badge de versão
└─────────────────────────────┘
```

**Componente:** `VersionBadge.tsx`

## 📝 Quando Atualizar

### PATCH (x.x.X)
- Correção de bugs
- Pequenos ajustes de UI
- Melhorias de performance
- Correções de typos

**Exemplo:**
```bash
# Corrigiu bug no trainer
version-patch.bat
# 1.0.0 → 1.0.1
```

### MINOR (x.X.0)
- Nova funcionalidade
- Novo tipo de spot
- Nova página
- Melhorias significativas

**Exemplo:**
```bash
# Adicionou tipo "vs Multiway shove"
version-minor.bat
# 1.0.5 → 1.1.0
```

### MAJOR (X.0.0)
- Mudanças que quebram compatibilidade
- Redesign completo
- Mudança de arquitetura
- Remoção de features antigas

**Exemplo:**
```bash
# Migrou para novo sistema de dados
version-major.bat
# 1.5.3 → 2.0.0
```

## 🔄 Workflow Recomendado

### Desenvolvimento Normal

1. Faça suas alterações no código
2. Teste localmente
3. Execute `release.bat`
4. Escolha o tipo de versão
5. Aguarde deploy automático

### Múltiplas Alterações

Se fez várias alterações:

```bash
# Commit suas alterações primeiro
git add .
git commit -m "feat: adicionar nova funcionalidade"

# Depois atualize a versão
release.bat
```

## 📊 Histórico de Versões

Você pode ver o histórico de versões no git:

```bash
git log --oneline --grep="release"
```

Ou no GitHub/GitLab na seção de releases.

## 🎯 Exemplos Práticos

### Exemplo 1: Correção de Bug
```bash
# Você corrigiu um bug no cálculo de EV
release.bat
# Escolha: 1 (PATCH)
# Resultado: 1.2.3 → 1.2.4
```

### Exemplo 2: Nova Feature
```bash
# Você adicionou sistema de leaderboard
release.bat
# Escolha: 2 (MINOR)
# Resultado: 1.2.4 → 1.3.0
```

### Exemplo 3: Breaking Change
```bash
# Você mudou completamente a estrutura de dados
release.bat
# Escolha: 3 (MAJOR)
# Resultado: 1.3.0 → 2.0.0
```

## 🛠️ Personalização

### Mudar Posição do Badge

Edite `App.tsx`:

```tsx
// Canto inferior direito (padrão)
<VersionBadge position="bottom-right" />

// Canto inferior esquerdo
<VersionBadge position="bottom-left" />

// Canto superior direito
<VersionBadge position="top-right" />
```

### Mudar Estilo do Badge

Edite `VersionBadge.tsx`:

```tsx
// Estilo atual: cinza discreto
className="... bg-gray-800/80 ..."

// Exemplo: azul vibrante
className="... bg-blue-600/90 ..."
```

## 🔍 Verificar Versão Atual

### No código:
```typescript
import { APP_VERSION } from './src/version.ts';
console.log(APP_VERSION); // "1.0.0"
```

### No terminal:
```bash
node -p "require('./package.json').version"
```

### No app:
Olhe no canto inferior direito da tela.

## 📚 Referências

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## ❓ FAQ

**Q: Posso atualizar manualmente?**
A: Sim, edite `package.json` e `src/version.ts`, mas use os scripts para evitar inconsistências.

**Q: O que acontece se eu esquecer de atualizar a versão?**
A: Nada grave, mas fica difícil rastrear mudanças. Use `release.bat` sempre que fizer deploy.

**Q: Posso usar no desenvolvimento local?**
A: Sim, a versão aparece em dev e produção.

**Q: Como remover o badge de versão?**
A: Remova `<VersionBadge />` do `App.tsx`.
