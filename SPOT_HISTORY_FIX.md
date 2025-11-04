# 📝 Spot History (Practiced Hands) - Correção de Erros

## ❌ Erro Identificado

Ao clicar em **"Practiced Hand History"** no Vercel, aparece o erro:

```
Error loading spot history from Firebase: 
FirebaseError: Missing or insufficient permissions.

Failed to load history from Firebase, using localStorage: 
FirebaseError: Missing or insufficient permissions.
```

## 🔍 Causa do Problema

O erro ocorre por **duas razões**:

1. **Regras do Firestore bloqueando leitura** da coleção `spotHistory`
2. **Falta de índice composto** para query `where('userId') + orderBy('timestamp')`

## ✅ Solução Completa

### 1. Atualizar Regras do Firestore

Acesse Firebase Console → Firestore Database → **Regras** e atualize:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // COLEÇÃO: users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if true;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // COLEÇÃO: stats (para leaderboard)
    match /stats/{userId} {
      allow read: if true;  // Público
      allow create: if true;
      allow update: if true;
    }
    
    // COLEÇÃO: spotHistory (para practiced hands)
    match /spotHistory/{historyId} {
      // ✅ MUDANÇA CRÍTICA: Permitir leitura pública
      allow read: if true;
      allow create: if true;
    }
  }
}
```

**⚠️ Nota de Segurança**: Estamos usando `allow read: if true` porque o sistema usa autenticação local (localStorage) e não Firebase Authentication. Se implementar Firebase Auth futuramente, mude para:

```javascript
allow read: if request.auth != null && resource.data.userId == request.auth.uid;
```

### 2. Criar Índice Composto

A query `loadSpotHistoryFromFirebase()` usa:
```typescript
query(
  collection(db, 'spotHistory'), 
  where('userId', '==', userId),
  orderBy('timestamp', 'desc'),
  limit(100)
)
```

Isso requer um **índice composto**.

#### Método Automático (Recomendado):

1. Acesse o site e clique em **"Practiced Hand History"**
2. Abra DevTools (F12) → Console
3. Procure por erro: `The query requires an index. You can create it here: [LINK]`
4. **Clique no link** no erro
5. Revise o índice e clique em **"Criar índice"**
6. Aguarde 2-5 minutos para construção

#### Método Manual:

1. Firebase Console → Firestore Database → **Índices**
2. Clique em **"Criar índice"**
3. Configure:
   - **Coleção**: `spotHistory`
   - **Campo 1**: `userId` → **Crescente** (Ascending)
   - **Campo 2**: `timestamp` → **Decrescente** (Descending)
4. Clique em **"Criar"**
5. Aguarde construção (status muda para "Enabled")

### 3. Verificar Estrutura dos Dados

Certifique-se que os documentos em `spotHistory` têm esta estrutura:

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

## 🧪 Como Testar

### Teste 1: Verificar se há dados no Firebase

1. Firebase Console → Firestore Database → Dados
2. Procure pela coleção `spotHistory`
3. Deve haver documentos com a estrutura acima

**Se não houver dados:**
- Jogue alguns spots no trainer
- Verifique se aparecem na coleção

### Teste 2: Testar Practiced Hands

1. Acesse o trainer no site
2. Clique em **"Practiced Hand History"**
3. Abra DevTools (F12) → Console
4. Procure pelos logs:
   ```
   🔄 Loading spot history from Firebase for user: user_xxx
   ✅ Loaded 15 spot history entries from Firebase
   ```

### Teste 3: Testar localStorage fallback

Se Firebase falhar, o sistema deve usar localStorage:
```
⚠️ Failed to load history from Firebase, using localStorage
```

## 🐛 Erros Comuns e Soluções

### Erro: "Missing or insufficient permissions"
**Causa**: Regras do Firestore bloqueando leitura  
**Solução**: Configure `allow read: if true;` na coleção `spotHistory`

### Erro: "The query requires an index"
**Causa**: Falta índice composto  
**Solução**: Clique no link do erro ou crie manualmente (ver seção 2)

### Erro: "failed-precondition"
**Causa**: Índice ainda está sendo construído  
**Solução**: Aguarde alguns minutos e tente novamente

### Practiced Hands vazio (sem erro)
**Causa**: Não há dados na coleção `spotHistory`  
**Solução**: Jogue alguns spots para criar histórico

### Dados aparecem mas estão desatualizados
**Causa**: localStorage está em cache  
**Solução**: 
```javascript
// No Console do navegador
localStorage.removeItem('poker_history_' + userId);
```

## 📊 Fluxo de Dados Atualizado

```
Usuário joga spot
      ↓
TrainerSimulator chama saveSpotResult()
      ↓
statsUtils.saveSpotHistory()
      ↓
Salva no localStorage (cache local)
      ↓
firebaseService.saveSpotHistoryToFirebase()
      ↓
Firestore collection 'spotHistory'
      ↓
UserProfile.tsx carrega via loadSpotHistory()
      ↓
Tenta Firebase primeiro (com where + orderBy)
      ↓
Fallback para localStorage se falhar
      ↓
Exibe na tabela SpotHistory
```

## 🔧 Melhorias Implementadas no Código

### `src/firebase/firebaseService.ts`

**Antes:**
```typescript
console.log('✅ Loaded spot history from Firebase:', history.length);
```

**Depois:**
```typescript
console.log(`✅ Loaded ${history.length} spot history entries from Firebase`);

// Melhor tratamento de erro com hints
catch (error: any) {
  console.error('❌ Error loading spot history from Firebase:', {
    error,
    message: error?.message,
    code: error?.code,
    userId,
    hint: error?.code === 'failed-precondition' 
      ? 'You need to create a Firestore index for spotHistory collection (userId + timestamp)'
      : error?.code === 'permission-denied'
      ? 'Check Firestore rules - spotHistory read permissions'
      : 'Check network connection and Firebase config'
  });
}
```

### `utils/statsUtils.ts`

O fallback para localStorage já estava implementado corretamente:
```typescript
try {
  const firebaseHistory = await loadSpotHistoryFromFirebase(userId);
  if (firebaseHistory && firebaseHistory.length > 0) {
    return firebaseHistory;
  }
} catch (firebaseError) {
  console.warn('⚠️ Failed to load history from Firebase, using localStorage:', firebaseError);
}

// Fallback para localStorage
const historyKey = `poker_history_${userId}`;
const storedHistory = localStorage.getItem(historyKey);
```

## 📋 Checklist de Configuração

- [ ] Regras do Firestore atualizadas com `allow read: if true` para `spotHistory`
- [ ] Índice composto criado (`userId` + `timestamp`)
- [ ] Índice com status "Enabled" (aguardar construção)
- [ ] Testado "Practiced Hand History" sem erros
- [ ] Logs mostram carregamento do Firebase
- [ ] Dados aparecem corretamente na tabela

## 🚀 Deploy em Produção

Após configurar:

1. **Commit e push** das mudanças de código (já feitas)
2. **Configure regras e índices** no Firebase Console
3. **Aguarde deploy automático** no Vercel
4. **Teste em produção**:
   - Crie usuário novo
   - Jogue spots
   - Verifique "Practiced Hand History"

## 📚 Documentos Relacionados

- `FIREBASE_RULES_FIX.md` - Configuração geral de regras
- `LEADERBOARD_FIREBASE_FIX.md` - Correção do Leaderboard
- `FIREBASE_SETUP.md` - Setup inicial do Firebase

---

**Última atualização:** 04/11/2025  
**Status:** ✅ Código corrigido - Aguardando configuração Firebase
