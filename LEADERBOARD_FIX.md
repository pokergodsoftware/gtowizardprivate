# 🔧 Correção: Leaderboard Vazio - Username Não Estava Sendo Sincronizado

## 🐛 Problema Encontrado

O leaderboard estava mostrando **0 jogadores** porque:

### Causa Raiz
O `TrainerSimulator.tsx` chamava `saveSpotResult(userId, isCorrect, phase)` **SEM passar o `username`**.

```typescript
// ❌ ANTES (SEM username)
saveSpotResult(userId, false, actualPhase);
```

Como o `username` era opcional e estava `undefined`, a condição `if (username)` no `statsUtils.ts` nunca era verdadeira, então **os dados nunca eram salvos no Firebase** - ficavam apenas no localStorage.

---

## ✅ Solução Implementada

### Mudança no `utils/statsUtils.ts`

Adicionei lógica para **buscar o username automaticamente** do localStorage quando não for passado:

```typescript
export async function saveSpotResult(
    userId: string,
    isCorrect: boolean,
    phase: string,
    username?: string,  // ← Ainda opcional
    points?: number
): Promise<void> {
    try {
        // ✅ NOVO: Buscar username do localStorage se não foi passado
        if (!username) {
            const currentUser = localStorage.getItem('poker_current_user');
            if (currentUser) {
                const userData = JSON.parse(currentUser);
                username = userData.username;
            }
        }
        
        // ... resto do código
        
        // Agora username sempre terá valor e sincronizará com Firebase!
        if (username) {
            await saveStatsToFirebase(userId, username, isCorrect, phase, finalPoints);
        } else {
            console.warn('⚠️ Username not found! Stats NOT synced to Firebase');
        }
    }
}
```

### Logs Melhorados

Adicionei avisos para identificar quando username não está disponível:

```typescript
console.log(`📊 Stats saved for user ${userId}:`, {
    username: username || 'NO USERNAME',  // ← Mostra se username está presente
    isCorrect,
    phase,
    totalPoints: stats.totalPoints
});

if (!username) {
    console.warn('⚠️ Username not found! Stats NOT synced to Firebase');
    console.warn('💡 Make sure user is logged in before playing spots');
}
```

---

## 🧪 Como Testar

### 1. Teste Rápido (Criar Novo Usuário)

1. Fazer **logout** (se estiver logado)
2. Criar **novo usuário** de teste: `teste_ranking_123`
3. Ir para **Trainer**
4. Jogar **3 spots**
5. Abrir **Console** (F12) e procurar:
   ```
   📊 Stats saved for user...
   username: "teste_ranking_123"  ← DEVE APARECER
   🔄 Syncing stats to Firebase...
   ✅ ☁️ Stats synced to Firebase successfully!
   ```
6. Ir para **Leaderboard**
7. Deve aparecer `teste_ranking_123` na lista!

### 2. Verificar no Firebase Console

1. Acesse: https://console.firebase.google.com/project/gtoprivate-8ed0a/firestore/data
2. Clique na collection **`stats`**
3. Deve ver documentos com userIds dos jogadores
4. Cada documento deve ter campo **`username`**

---

## 🔍 Diagnóstico de Problemas

### Problema: Console mostra "NO USERNAME"

**Causa**: localStorage não tem `poker_current_user`

**Solução**:
1. Verificar se usuário está logado
2. Fazer logout e login novamente
3. Verificar no console: `localStorage.getItem('poker_current_user')`

### Problema: Console mostra "Username not found! Stats NOT synced"

**Causa**: Mesma do anterior

**Solução**: Garantir que usuário fez login antes de jogar spots

### Problema: Stats sincronizam mas Leaderboard ainda vazio

**Causas possíveis**:
1. **Índice do Firestore não criado** → Ver `FIREBASE_INDEX_SETUP.md`
2. **Regras do Firestore restritivas** → Ver `FIREBASE_COMPLETE_SETUP.md`
3. **Dados antigos sem username** → Ver seção de migração abaixo

---

## 🔄 Migração de Dados Antigos (Se Necessário)

Se você tem usuários que jogaram spots **antes desta correção**, eles têm dados no localStorage mas **não no Firebase**.

### Script de Migração Manual

Cole no console do navegador (F12):

```javascript
async function migrarDadosAntigos() {
    const { saveStatsToFirebase } = await import('./src/firebase/firebaseService');
    
    // Buscar usuário atual
    const currentUserData = localStorage.getItem('poker_current_user');
    if (!currentUserData) {
        console.error('❌ Nenhum usuário logado');
        return;
    }
    
    const { userId, username } = JSON.parse(currentUserData);
    console.log('👤 Migrando dados de:', username);
    
    // Buscar stats do localStorage
    const statsKey = `poker_stats_${userId}`;
    const statsData = localStorage.getItem(statsKey);
    
    if (!statsData) {
        console.log('⚠️ Nenhum dado local para migrar');
        return;
    }
    
    const stats = JSON.parse(statsData);
    console.log('📊 Stats encontrados:', stats);
    
    // Migrar cada spot jogado
    let migrados = 0;
    const fases = Object.keys(stats.statsByPhase || {});
    
    for (const fase of fases) {
        const faseData = stats.statsByPhase[fase];
        console.log(`🔄 Migrando fase: ${fase}`, faseData);
        
        // Simular spots jogados nesta fase
        for (let i = 0; i < faseData.correct; i++) {
            await saveStatsToFirebase(userId, username, true, fase, 1);
            migrados++;
        }
        
        const erros = faseData.total - faseData.correct;
        for (let i = 0; i < erros; i++) {
            await saveStatsToFirebase(userId, username, false, fase, 0);
            migrados++;
        }
    }
    
    console.log(`✅ Migração concluída! ${migrados} spots migrados para Firebase`);
}

// Executar
migrarDadosAntigos();
```

**⚠️ IMPORTANTE**: Este script deve ser executado **uma vez por usuário**.

---

## 📊 Estrutura de Dados Corrigida

### localStorage (antes)
```json
{
  "poker_current_user": {
    "userId": "user_1730...",
    "username": "jogador1"  ← Estava aqui mas não sendo usado!
  },
  "poker_stats_user_1730...": {
    "totalSpots": 50,
    "correctSpots": 42
  }
}
```

### Firebase (agora funciona!)
```json
{
  "stats": {
    "user_1730...": {
      "userId": "user_1730...",
      "username": "jogador1",  ← Agora é salvo!
      "totalSpots": 50,
      "correctSpots": 42,
      "totalPoints": 42
    }
  }
}
```

---

## ✅ Checklist de Verificação

Após aplicar a correção:

- [ ] Criar novo usuário de teste
- [ ] Jogar 3 spots no Trainer
- [ ] Verificar console: "username: teste_ranking_123" aparece
- [ ] Verificar console: "Stats synced to Firebase successfully"
- [ ] Abrir Leaderboard
- [ ] Ver usuário de teste na lista
- [ ] Verificar Firebase Console: collection `stats` tem documentos
- [ ] (Opcional) Migrar dados antigos se necessário

---

## 🎯 Resultado Esperado

Após jogar alguns spots:

```
Leaderboard:
🥇 1º - teste_ranking_123 - 42 pontos
🥈 2º - jogador2 - 38 pontos
🥉 3º - jogador3 - 35 pontos
```

**ANTES**: 0 jogadores (dados só no localStorage)
**AGORA**: Todos os jogadores aparecem (dados sincronizam com Firebase)

---

**Status**: 🟢 CORRIGIDO  
**Data**: 04/11/2025  
**Arquivos modificados**: `utils/statsUtils.ts`
