# 🔥 Firebase - Configuração Completa e Obrigatória

## ⚠️ TODOS os erros no Vercel são causados por falta de configuração do Firebase!

Este documento consolida **TODAS** as configurações necessárias no Firebase Console para o sistema funcionar corretamente.

## 🚨 Erros Atuais no Vercel

1. ✅ **Cadastro de usuário** - `Missing or insufficient permissions`
2. ✅ **Salvar spot history** - `Missing or insufficient permissions`
3. ✅ **Leaderboard** - `Missing or insufficient permissions` + índice ausente
4. ✅ **Practiced Hands** - `Missing or insufficient permissions` + índice ausente
5. ✅ **My Stats** - `Missing or insufficient permissions` (ao carregar histórico)

**Todos esses erros serão resolvidos com as configurações abaixo!**

---

## 📋 Passo 1: Atualizar Regras do Firestore (OBRIGATÓRIO)

### Como acessar:
1. https://console.firebase.google.com
2. Selecione projeto: **gtoprivate-8ed0a**
3. Menu lateral: **Firestore Database**
4. Aba: **Regras** (Rules)

### Cole estas regras e clique em PUBLICAR:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==========================================
    // COLEÇÃO: users
    // Armazena dados básicos dos usuários
    // ==========================================
    match /users/{userId} {
      // Permite leitura para todos (para listar jogadores)
      allow read: if true;
      
      // Permite criar usuário sem autenticação (registro local)
      allow create: if true;
      
      // Permite atualizar apenas com autenticação
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // ==========================================
    // COLEÇÃO: stats
    // Armazena estatísticas de performance dos jogadores
    // ==========================================
    match /stats/{userId} {
      // Permite leitura pública (leaderboard)
      allow read: if true;
      
      // Permite criar stats sem autenticação (primeiro spot jogado)
      allow create: if true;
      
      // Permite atualizar stats (incrementos após cada spot)
      allow update: if true;
    }
    
    // ==========================================
    // COLEÇÃO: spotHistory
    // Armazena histórico de mãos jogadas
    // ==========================================
    match /spotHistory/{historyId} {
      // Permite leitura pública (practiced hands e my stats)
      allow read: if true;
      
      // Permite criar histórico sem autenticação
      allow create: if true;
    }
  }
}
```

### ⚠️ Por que `allow: if true`?

Este projeto usa **autenticação local** (localStorage) e não Firebase Authentication. As regras permitem operações sem autenticação Firebase porque o controle de acesso é feito no client-side.

**Para produção com mais segurança**, implemente Firebase Authentication e ajuste as regras.

---

## 📊 Passo 2: Criar Índices Compostos (OBRIGATÓRIO)

O Firestore requer índices para queries com `where` + `orderBy`.

### Índices Necessários:

| # | Coleção | Campo 1 | Ordem 1 | Campo 2 | Ordem 2 | Usado em |
|---|---------|---------|---------|---------|---------|----------|
| 1 | `stats` | `totalPoints` | Descending | (auto) | (auto) | Leaderboard |
| 2 | `spotHistory` | `userId` | Ascending | `timestamp` | Descending | Practiced Hands, My Stats |

### Como criar:

#### Opção A: Automático (Recomendado)

1. Acesse cada funcionalidade que causa erro (Leaderboard, Practiced Hands)
2. Abra DevTools (F12) → Console
3. Procure por erro: `The query requires an index. You can create it here: [LINK]`
4. **Clique no link** fornecido pelo Firebase
5. Revise e clique em **"Criar índice"**
6. Aguarde construção (2-5 minutos)

#### Opção B: Manual

1. Firebase Console → Firestore Database → **Índices**
2. Clique em **"Criar índice"**
3. Preencha conforme tabela acima
4. Clique em **"Criar"**
5. Aguarde status mudar para **"Enabled"**

**Repita para cada índice da tabela!**

---

## 🧪 Passo 3: Testar Cada Funcionalidade

Após configurar regras e índices, teste:

### ✅ Teste 1: Cadastro de Usuário
1. Crie um novo usuário no site
2. Console (F12) deve mostrar: `✅ User saved to Firebase successfully`
3. Verifique no Firebase: Firestore → `users` collection

**Se falhar:** Regras não foram aplicadas corretamente.

---

### ✅ Teste 2: Salvar Stats após Spot
1. Jogue um spot no trainer
2. Console deve mostrar: `✅ Stats saved to Firebase for: [username]`
3. Verifique no Firebase: Firestore → `stats` collection

**Se falhar:** Regras da coleção `stats` não foram aplicadas.

---

### ✅ Teste 3: Leaderboard
1. Clique em "Leaderboard"
2. Console deve mostrar:
   ```
   🏆 Loading leaderboard from Firebase...
   🔄 Fetching top 10 from Firestore...
   ✅ Loaded X players from Firebase
   ```
3. Leaderboard deve exibir jogadores com pontos, accuracy, corretos e blunders

**Se falhar:**
- Erro de permissão → Regras da coleção `stats` não aplicadas
- Erro "requires an index" → Índice 1 não foi criado

---

### ✅ Teste 4: Practiced Hands
1. Clique em "Practiced Hand History"
2. Console deve mostrar:
   ```
   🔄 Loading spot history from Firebase for user: user_xxx
   ✅ Loaded X spot history entries from Firebase
   ```
3. Tabela deve exibir histórico de mãos jogadas

**Se falhar:**
- Erro de permissão → Regras da coleção `spotHistory` não aplicadas
- Erro "requires an index" → Índice 2 não foi criado

---

### ✅ Teste 5: My Stats
1. Clique em "My Stats"
2. Console deve mostrar:
   ```
   📜 Loading spot history for user: user_xxx
   ✅ Loaded X history entries
   ```
3. Página deve exibir estatísticas e histórico sem erros

**Se falhar:** Mesmo diagnóstico do Teste 4 (usa a mesma query).

---

## 📊 Estrutura Final das Coleções

### Coleção: `users`
```json
{
  "userId": "user_1699123456_xyz",
  "username": "PlayerName",
  "createdAt": "2024-11-04T12:30:56.789Z"
}
```

### Coleção: `stats`
```json
{
  "userId": "user_1699123456_xyz",
  "username": "PlayerName",
  "totalSpots": 50,
  "correctSpots": 35,
  "incorrectSpots": 15,
  "totalPoints": 35.0,
  "accuracy": 70.0,
  "tournamentsPlayed": 2,
  "reachedFinalTable": 1,
  "completedTournaments": 1,
  "lastUpdated": "2024-11-04T12:30:56.789Z",
  "statsByPhase": {
    "Final table": {
      "total": 10,
      "correct": 7,
      "incorrect": 3,
      "points": 7.0
    }
  }
}
```

### Coleção: `spotHistory`
```json
{
  "id": "1699123456789_abc123",
  "userId": "user_1699123456_xyz",
  "hand": "AKs",
  "combo": "AhKd",
  "isCorrect": true,
  "timestamp": 1699123456789,
  "phase": "Final table",
  "points": 1,
  "solutionPath": "./spots/final_table/spot_1",
  "nodeId": 5,
  "position": 4,
  "playerAction": "Raise 2x",
  "ev": 0.456,
  "createdAt": "2024-11-04T12:30:56.789Z"
}
```

---

## 🔍 Diagnóstico de Erros Comuns

### Erro: "Missing or insufficient permissions"
**Causa:** Regras do Firestore não foram aplicadas ou estão erradas  
**Solução:**
1. Verifique se as regras foram **publicadas** (botão "Publish")
2. Data de publicação deve ser recente (hoje)
3. Limpe cache do navegador (Ctrl+Shift+Delete)
4. Teste novamente

---

### Erro: "The query requires an index"
**Causa:** Índice composto não foi criado  
**Solução:**
1. Clique no link fornecido no erro
2. Ou crie manualmente conforme Passo 2
3. Aguarde índice ficar "Enabled"
4. Teste novamente

---

### Erro: "Failed to get documents from server"
**Causa:** Sem conexão com internet ou Firebase offline  
**Solução:**
1. Verifique conexão com internet
2. Verifique status do Firebase: https://status.firebase.google.com
3. Sistema usa localStorage como fallback

---

### Dados não aparecem no Leaderboard
**Causa:** Não há dados na coleção `stats`  
**Solução:**
1. Jogue alguns spots para criar dados
2. Verifique no Firebase: Firestore → `stats`
3. Deve ter pelo menos 1 documento

---

### Console mostra warnings mas funciona
**Causa:** Sistema tem fallback para localStorage  
**Comportamento esperado:** Funciona localmente mas não sincroniza entre dispositivos  
**Solução:** Configure Firebase para ter sincronização completa

---

## 🚀 Checklist Final

Antes de considerar concluído, verifique:

- [ ] Regras do Firestore publicadas (data: hoje)
- [ ] Índice 1 criado: `stats` → `totalPoints` (Desc)
- [ ] Índice 2 criado: `spotHistory` → `userId` (Asc) + `timestamp` (Desc)
- [ ] Ambos índices com status **"Enabled"**
- [ ] Teste: Cadastrar novo usuário ✅
- [ ] Teste: Jogar spot e salvar stats ✅
- [ ] Teste: Leaderboard carrega do Firebase ✅
- [ ] Teste: Practiced Hands carrega do Firebase ✅
- [ ] Teste: My Stats carrega sem erros ✅
- [ ] Console sem erros "FirebaseError" ✅

---

## 📚 Documentos Relacionados

- `FIREBASE_RULES_FIX.md` - Detalhes sobre regras
- `LEADERBOARD_FIREBASE_FIX.md` - Correção específica do Leaderboard
- `SPOT_HISTORY_FIX.md` - Correção do Practiced Hands
- `FIREBASE_SETUP.md` - Setup inicial do Firebase

---

## ⏱️ Tempo Estimado de Configuração

- **Regras**: 2 minutos
- **Índices (automático)**: 5 minutos
- **Índices (manual)**: 3 minutos cada
- **Testes**: 5 minutos
- **Total**: ~15 minutos

---

## 🆘 Precisa de Ajuda?

Se após seguir todos os passos ainda houver erros:

1. **Capture screenshots**:
   - Página de Regras do Firestore
   - Página de Índices do Firestore
   - Console (F12) com o erro completo

2. **Verifique**:
   - Projeto correto: `gtoprivate-8ed0a`
   - Data de publicação das regras
   - Status dos índices (Building vs Enabled)

3. **Informações úteis para debug**:
   - URL exata onde ocorre o erro
   - Mensagem de erro completa do console
   - Código de erro do Firebase (ex: `permission-denied`)

---

**Última atualização:** 04/11/2025  
**Status:** ✅ Todas as correções implementadas no código - Aguardando configuração Firebase  
**Prioridade:** 🔴 ALTA - Sistema não funciona sem estas configurações
