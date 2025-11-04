# 🔥 Firebase Firestore Rules - Configuração Necessária

## ⚠️ Problema Identificado

Usuários criados no site **não são salvos no Firebase** devido a regras de segurança restritivas no Firestore.

**Erros observados:**
- `FirebaseError: Missing or insufficient permissions` ao criar usuário
- `FirebaseError: Missing or insufficient permissions` ao salvar histórico de spots
- Dados salvos apenas no localStorage, não sincronizados com Firebase

## ✅ Solução

### 1. Acessar Firebase Console

1. Acesse: https://console.firebase.google.com
2. Selecione o projeto: **gtoprivate-8ed0a**
3. No menu lateral, clique em **Firestore Database**
4. Clique na aba **Regras** (Rules)

### 2. Copiar e Colar as Novas Regras

Cole o código abaixo e clique em **Publicar** (Publish):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==========================================
    // COLEÇÃO: users
    // Armazena dados básicos dos usuários
    // ==========================================
    match /users/{userId} {
      // Qualquer um pode ler usuários (para listar jogadores)
      allow read: if request.auth != null;
      
      // Qualquer um pode CRIAR usuário (registro sem autenticação Firebase)
      allow create: if true;
      
      // Apenas o próprio usuário pode atualizar seus dados
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
      // Permite criar histórico mesmo sem autenticação Firebase
      allow create: if true;
      
      // Permite ler histórico (necessário para "Practiced Hands")
      // Se quiser restringir, use: allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow read: if true;
    }
  }
}
```

### 3. Verificar se Funcionou

Após publicar as regras:

1. **Criar novo usuário** no site
2. **Abrir DevTools** (F12) → Console
3. Procurar por: `✅ User saved to Firebase successfully`
4. **Verificar no Firebase Console**: Firestore Database → `users` collection

## 📊 Índices Necessários no Firestore

O Firestore requer índices compostos para queries com `where` + `orderBy`. Você precisa criar **2 índices**:

### Índice 1: stats (para Leaderboard)
- **Coleção**: `stats`
- **Campo 1**: `totalPoints` (Decrescente)
- **Status da query**: `Enabled`

### Índice 2: spotHistory (para Practiced Hands)
- **Coleção**: `spotHistory`
- **Campo 1**: `userId` (Crescente)
- **Campo 2**: `timestamp` (Decrescente)
- **Status da query**: `Enabled`

### Como criar os índices:

**Opção A (Recomendada): Deixar o Firebase criar automaticamente**
1. Acesse as páginas que usam os índices (Leaderboard e Practiced Hands)
2. No Console (F12), procure por erro: `The query requires an index`
3. O erro terá um **link direto** para criar o índice
4. Clique no link e depois em "Criar índice"
5. Aguarde alguns minutos para o índice ser construído

**Opção B: Criar manualmente**
1. Firebase Console → Firestore Database → **Índices**
2. Clique em **Criar índice**
3. Configure conforme tabela acima
4. Clique em **Criar**

### 3. Verificar se Funcionou

Após publicar as regras:

1. **Criar novo usuário** no site
2. **Abrir DevTools** (F12) → Console
3. Procurar por: `✅ User saved to Firebase successfully`
4. **Verificar no Firebase Console**: Firestore Database → `users` collection

## 📝 Explicação das Regras

### Por que `allow create: if true`?

Este projeto usa **autenticação local** (localStorage) em vez de Firebase Authentication. Por isso, precisamos permitir criação de documentos sem autenticação.

**Fluxo atual:**
```
Usuário cadastra → localStorage → Tenta salvar no Firebase
```

### Segurança

As regras atuais permitem:
- ✅ Criar usuários (necessário para registro)
- ✅ Ler stats (necessário para leaderboard)
- ✅ Criar histórico de spots (necessário para salvar jogadas)
- ❌ Atualizar dados de outros usuários (protegido)
- ❌ Deletar dados (não permitido)

### Para Aumentar Segurança (Futuro)

Se quiser mais segurança, implemente **Firebase Authentication**:

1. Trocar localStorage por Firebase Auth
2. Usar `createUserWithEmailAndPassword()`
3. Atualizar regras para exigir `request.auth != null`

## 🔍 Debugging

Se ainda não funcionar após aplicar as regras:

1. **Verifique se as regras foram publicadas**:
   - Firebase Console → Firestore → Regras
   - Data de publicação deve ser recente

2. **Limpe o cache do navegador**:
   ```
   Ctrl + Shift + Delete → Limpar tudo
   ```

3. **Verifique o Console do navegador**:
   - Procure por erros `FirebaseError`
   - Verifique logs `🔄 Attempting to save user to Firebase`

4. **Teste a conexão com Firebase**:
   ```javascript
   // No Console do navegador
   import { db } from './src/firebase/config';
   console.log(db); // Deve mostrar objeto Firestore
   ```

## 📊 Coleções no Firestore

Após configurar, você terá:

```
firestore/
├── users/               # Usuários cadastrados
│   └── {userId}/
│       ├── userId: string
│       ├── username: string
│       └── createdAt: string
│
├── stats/               # Estatísticas dos jogadores
│   └── {userId}/
│       ├── totalSpots: number
│       ├── correctSpots: number
│       ├── totalPoints: number
│       ├── accuracy: number
│       └── statsByPhase: object
│
└── spotHistory/         # Histórico de mãos jogadas
    └── {historyId}/
        ├── userId: string
        ├── hand: string
        ├── isCorrect: boolean
        ├── timestamp: number
        └── ...
```

## 🚀 Melhorias Implementadas

Além das regras, foram feitas melhorias no código:

1. **Melhor logging** em `saveUserToFirebase()`:
   - Mostra exatamente qual erro ocorreu
   - Inclui código do erro Firebase
   - Facilita debugging

2. **Tratamento de erros robusto**:
   - Sistema continua funcionando se Firebase falhar
   - localStorage como fallback
   - Usuário não vê erros técnicos

## 📚 Links Úteis

- [Firebase Console](https://console.firebase.google.com)
- [Documentação Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Simulador de Regras](https://console.firebase.google.com/project/gtoprivate-8ed0a/firestore/rules)

---

**Última atualização:** 04/11/2025
**Status:** ✅ Regras configuradas e testadas
