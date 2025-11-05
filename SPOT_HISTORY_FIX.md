# 📝 Spot History (Practiced Hands) - Bug Fixes

## ❌ Error Identified

When clicking **"Practiced Hand History"** on the Vercel site, the following error appears:

```
Error loading spot history from Firebase: 
FirebaseError: Missing or insufficient permissions.

Failed to load history from Firebase, using localStorage: 
FirebaseError: Missing or insufficient permissions.
```

## 🔍 Root Cause

The error happens for **two reasons**:

1. **Firestore rules blocking read access** to the `spotHistory` collection
2. **Missing composite index** for the query `where('userId') + orderBy('timestamp')`

## ✅ Complete Fix

### 1. Update Firestore Rules

Open Firebase Console → Firestore Database → **Rules** and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
  // COLLECTION: users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if true;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // COLLECTION: stats (for leaderboard)
    match /stats/{userId} {
      allow read: if true;  // Public
      allow create: if true;
      allow update: if true;
    }
    
  // COLLECTION: spotHistory (for practiced hands)
    match /spotHistory/{historyId} {
      // ✅ MUDANÇA CRÍTICA: Permitir leitura pública
      allow read: if true;
      allow create: if true;
    }
  }
}
```

**⚠️ Security Note**: We're using `allow read: if true` because the system relies on local authentication (localStorage) and not Firebase Authentication. If you implement Firebase Auth in the future, change to:

```javascript
allow read: if request.auth != null && resource.data.userId == request.auth.uid;
```

### 2. Create Composite Index

The query `loadSpotHistoryFromFirebase()` uses:
```typescript
query(
  collection(db, 'spotHistory'), 
  where('userId', '==', userId),
  orderBy('timestamp', 'desc'),
  limit(100)
)
```

Isso requer um **índice composto**.

#### Automatic Method (Recommended):

1. Open the site and click **"Practiced Hand History"**
2. Open DevTools (F12) → Console
3. Look for the error: `The query requires an index. You can create it here: [LINK]`
4. **Click the link** in the error
5. Review the index and click **"Create index"**
6. Wait 2-5 minutes for the index to build

#### Manual Method:

1. Firebase Console → Firestore Database → **Indexes**
2. Click **"Create index"**
3. Configure:
  - **Collection**: `spotHistory`
  - **Field 1**: `userId` → **Ascending**
  - **Field 2**: `timestamp` → **Descending**
4. Click **"Create"**
5. Wait for build (status changes to "Enabled")

### 3. Verify Data Structure

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

## 🧪 How to Test

### Test 1: Verify Firebase has data

1. Firebase Console → Firestore Database → Data
2. Look for the `spotHistory` collection
3. Documents should match the structure above

**If no documents appear:**
- Play some spots in the trainer
- Verify entries appear in the collection

### Test 2: Test Practiced Hands UI

1. Open the trainer in the site
2. Click **"Practiced Hand History"**
3. Open DevTools (F12) → Console
4. Look for logs like:
  ```
  🔄 Loading spot history from Firebase for user: user_xxx
  ✅ Loaded 15 spot history entries from Firebase
  ```

### Test 3: Test localStorage fallback

If Firebase fails, the system should fallback to localStorage and log:
```
⚠️ Failed to load history from Firebase, using localStorage
```

## 🐛 Common Errors & Fixes

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

## 📊 Updated Data Flow

```
User plays a spot
  ↓
TrainerSimulator calls saveSpotResult()
  ↓
statsUtils.saveSpotHistory()
  ↓
Saves to localStorage (local cache)
  ↓
firebaseService.saveSpotHistoryToFirebase()
  ↓
Firestore collection 'spotHistory'
  ↓
UserProfile.tsx loads via loadSpotHistory()
  ↓
Tries Firebase first (with where + orderBy)
  ↓
Falls back to localStorage if Firebase fails
  ↓
Displays in the SpotHistory table
```

## 🔧 Code Improvements Implemented

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

## 📋 Configuration Checklist

- [ ] Firestore rules updated to allow reads for `spotHistory` (temporarily)
- [ ] Composite index created (`userId` + `timestamp`)
- [ ] Index status is "Enabled" (wait for build)
- [ ] Practiced Hand History tested without errors
- [ ] Logs show Firebase loading
- [ ] Data displays correctly in the table

## 🚀 Production Deploy

After configuration:

1. **Commit and push** code changes (already done)
2. **Configure rules and indexes** in Firebase Console
3. **Wait for the automatic deploy** on Vercel
4. **Test in production**:
  - Create a new user
  - Play some spots
  - Verify "Practiced Hand History"

## 📚 Documentos Relacionados

- `FIREBASE_RULES_FIX.md` - Configuração geral de regras
- `LEADERBOARD_FIREBASE_FIX.md` - Correção do Leaderboard
- `FIREBASE_SETUP.md` - Setup inicial do Firebase

---

**Last updated:** 04/11/2025  
**Status:** ✅ Code fixed - Waiting for Firebase configuration
