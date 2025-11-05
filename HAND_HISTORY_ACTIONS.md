# Hand History - Como as Ações são Determinadas

## Visão Geral

O **Hand History** exibe as ações dos jogadores (Raise, Call, Fold, etc.) que levaram até o spot atual. Este documento explica todo o fluxo de como essas ações são determinadas e exibidas.

## Fluxo de Dados

```
NodeData (árbol de decisão)
    ↓
buildHandHistory() → Navega pela árvore de nós
    ↓
getActionName() → Converte tipo de ação + amount em texto
    ↓
HandHistoryPanel → Renderiza com cores e avatares
```

---

## 1. Fonte dos Dados: NodeData e Actions

### Estrutura de Dados Base (`types.ts`)

```typescript
interface Action {
  type: 'F' | 'R' | 'C' | 'X';  // Fold, Raise, Call, Check
  amount: number;                 // Valor da ação em chips (x100)
  node?: number;                  // ID do próximo nó (se houver)
}

interface NodeData {
  player: number;      // Índice do jogador (0-8)
  street: number;      // 0=Preflop, 1=Flop, 2=Turn, 3=River
  actions: Action[];   // Ações disponíveis neste nó
  // ... outros campos
}
```

**Exemplo de Action:**
```javascript
{
  type: 'R',      // Raise
  amount: 24000,  // 240 chips (divido por 100)
  node: 5         // Leva ao nó 5
}
```

---

## 2. Construção do Hand History

### `buildHandHistory()` - handHistoryBuilder.ts

Esta função é o **coração** do sistema. Ela:

1. **Constrói o caminho**: Do nó raiz (0) até o nó atual usando BFS (Breadth-First Search)
2. **Navega pelo caminho**: Para cada par de nós consecutivos, encontra qual ação foi tomada
3. **Converte ações**: Transforma dados brutos em objetos `HandHistoryAction` legíveis

```typescript
// Exemplo de caminho encontrado
path = [0, 2, 5, 12]  // Root → Nó 2 → Nó 5 → Nó 12

// Para cada transição (0→2, 2→5, 5→12):
const node = nodes.get(currentNodeId);
const actionTaken = node.actions.find(a => a.node === nextNodeId);

// Converte para descrição legível
const actionDescription = getActionDescription(
    actionTaken,
    bigBlind,
    playerStack,
    displayMode
);
```

**Output:**
```typescript
{
  position: 2,
  playerName: 'CO',
  action: 'Raise 2.5',  // ← Aqui está a determinação!
  amount: 25000,
  street: 'Preflop'
}
```

---

## 3. Determinação do Tipo de Ação: `getActionName()`

### A Função Chave (`lib/pokerUtils.ts`)

Esta é a função que **determina** se uma ação é "Raise 2.5BB", "Call", "Allin", etc.

```typescript
export const getActionName = (
    action: {type: string; amount: number}, 
    bigBlind: number, 
    playerStack: number, 
    displayMode: 'bb' | 'chips',
    allStacks?: readonly number[]
): string
```

### Lógica de Determinação

#### 1. **Fold (F)**
```typescript
case 'F': return 'Fold';
```
**Simples**: Sempre retorna "Fold"

---

#### 2. **Call (C)**
```typescript
case 'C': return 'Call';
```
**Simples**: Sempre retorna "Call"

---

#### 3. **Check (X)**
```typescript
case 'X': return 'Check';
```
**Simples**: Sempre retorna "Check"

---

#### 4. **Raise (R)** - A Mais Complexa

O Raise tem múltiplas determinações:

##### a) **Detectar All-in**
```typescript
const adjustedBigBlind = displayMode === 'bb' ? bigBlind / 100 : bigBlind;
const actionAmountBB = (action.amount / 100) / adjustedBigBlind;
const playerStackBB = (playerStack / 100) / adjustedBigBlind;

// É all-in se o raise/call usa ≥90% do stack OU deixa menos de 0.5 BB
const remainingStackBB = playerStackBB - actionAmountBB;
const isAllIn = (action.type === 'R' || action.type === 'C') && 
                playerStackBB > 0 && 
                (actionAmountBB >= playerStackBB * 0.90 || remainingStackBB < 0.5);
```

**Exemplos:**
- Stack: 10 BB, Action: 9.8 BB → 98% → **All-in!** ✅
- Stack: 10 BB, Action: 9.2 BB → 92% → **All-in!** ✅
- Stack: 10 BB, Action: 9.6 BB → Remaining 0.4 BB → **All-in!** ✅
- Stack: 10 BB, Action: 8.5 BB → 85% → Not all-in ❌

##### b) **Detectar All-in de Oponente**
```typescript
// Verifica se o raise força um oponente menor a all-in
for (const stack of allStacks) {
    if (stack < playerStack) {
        const opponentStackBB = (stack / 100) / adjustedBigBlind;
        // Raise próximo ao stack do oponente?
        if (Math.abs(raiseSizeBB - opponentStackBB) < 0.05) {
            isOpponentAllIn = true;
        }
    }
}
```

##### c) **Formatar o Valor**

**Modo BB (Big Blinds):**
```typescript
if (displayMode === 'bb') {
    const raiseSizeBB = ((action.amount / 100) / adjustedBigBlind).toFixed(1);
    formattedSize = raiseSizeBB.endsWith('.0') ? raiseSizeBB.slice(0, -2) : raiseSizeBB;
}
```

**Exemplos:**
- `24000` (240 chips) com BB=100 → `"2.4"` → **"Raise 2.4"**
- `30000` (300 chips) com BB=100 → `"3.0"` → `"3"` → **"Raise 3"**

**Modo Chips:**
```typescript
if (displayMode === 'chips') {
    formattedSize = formatChips(action.amount / 100);
}
```

**Exemplos:**
- `24000` → `"240"` → **"Raise 240"**
- `123456` → `"1,234.56"` → **"Raise 1,234.56"**

##### d) **Resultado Final**
```typescript
// Para Raise:
if(isAllIn || isOpponentAllIn) 
    return `All-in ${formattedSize}`;  // Ex: "All-in 12.4"
else
    return `Raise ${formattedSize}`;  // Ex: "Raise 2.5"

// Para Call:
if (isAllIn) 
    return `All-in ${formattedSize}`;  // Ex: "All-in 7.2"
else
    return 'Call';
```

---

#### 5. **Call (C)** - Agora Detecta All-in!

Calls agora também detectam se o jogador está indo all-in:

```typescript
case 'C': 
    // Check if call is all-in (≥95% do stack)
    if (isAllIn) {
        let formattedSize: string;
        if (displayMode === 'chips') {
            formattedSize = formatChips(action.amount / 100);
        } else {
            const callSizeBB = ((action.amount / 100) / adjustedBigBlind).toFixed(1);
            formattedSize = callSizeBB.endsWith('.0') ? callSizeBB.slice(0, -2) : callSizeBB;
        }
        return `All-in ${formattedSize}`;
    }
    return 'Call';
```

**Exemplo Real (da imagem):**
- **HJ** com stack 12.6bb, call 12.45bb: ratio 98.8% → **"All-in 12.4"** 🟣 ✅
- **CO** com stack 1.9bb, call 1.75bb: ratio 92.1% → **"All-in 1.75"** 🟣 ✅
- **SB** com stack 10.68bb, call 10.03bb: ratio 93.9% → **"All-in 10"** 🟣 ✅

**Por que 90% em vez de 95%?**
Na prática do poker, quando um jogador aposta 90-94% do stack, é considerado all-in efetivo porque:
- O stack residual seria inviável para jogar (<1 BB em muitos casos)
- Nos solvers GTO, essas situações são tratadas como all-in
- Evita edge cases onde jogadores ficam com 0.2-0.5 BB restantes

---

## 4. Cores das Ações

### `getActionColor()` - lib/pokerUtils.ts

Cada ação tem uma cor específica baseada no GTO Wizard:

```typescript
export const getActionColor = (actionName: string): string => {
    if (actionName.includes('All-in')) return 'bg-[#d946ef]'; // 🟣 Magenta
    if (actionName.startsWith('Raise')) return 'bg-[#f97316]'; // 🟠 Laranja
    if (actionName.startsWith('Fold')) return 'bg-[#0ea5e9]';  // 🔵 Azul Cyan
    if (actionName.startsWith('Call')) return 'bg-[#10b981]';  // 🟢 Verde
    if (actionName.startsWith('Check')) return 'bg-[#6b7280]'; // ⚫ Cinza
    return 'bg-[#4b5563]'; // Fallback
};
```

**No HandHistoryPanel:**
```typescript
const getActionBubbleColor = (action: string): string => {
    const color = getActionColor(action);
    
    // Converte Tailwind bg-* para cores hex
    const colorMap: { [key: string]: string } = {
        'bg-[#d946ef]': '#d946ef',
        'bg-[#f97316]': '#f97316',
        'bg-[#0ea5e9]': '#0ea5e9',
        'bg-[#10b981]': '#10b981',
        'bg-[#6b7280]': '#6b7280',
    };
    
    return colorMap[color] || '#4b5563';
};
```

---

## 5. Renderização no HandHistoryPanel

### Estrutura Visual

```tsx
<div className="flex items-start gap-3">
    {/* Avatar com borda colorida */}
    <div 
        className="w-10 h-10 rounded-full border-2"
        style={{ borderColor: bubbleColor }}
    >
        <img src={avatarUrl} alt={playerName} />
    </div>
    
    {/* Balão de ação */}
    <div>
        <div className="text-xs text-gray-400">{playerName}</div>
        <div 
            className="rounded-lg px-3 py-2"
            style={{ backgroundColor: bubbleColor }}
        >
            {action.action}  {/* "Raise 2.5" */}
        </div>
    </div>
</div>
```

### Exemplo de Output Visual

```
[Avatar CO] (borda laranja)
   CO
   ┌─────────────┐
   │ Raise 2.5   │  (fundo laranja #f97316)
   └─────────────┘

[Avatar BTN] (borda verde)
   BTN
   ┌─────────────┐
   │ Call        │  (fundo verde #10b981)
   └─────────────┘
```

---

## Fluxo Completo - Exemplo Real

### 1. Dados Brutos (NodeData)
```javascript
// Nó 2 (CO abre)
{
  player: 2,
  street: 0,
  actions: [
    { type: 'F', amount: 0, node: undefined },
    { type: 'R', amount: 25000, node: 5 }  // 2.5 BB
  ]
}

// Nó 5 (BTN responde)
{
  player: 3,
  street: 0,
  actions: [
    { type: 'F', amount: 0, node: undefined },
    { type: 'C', amount: 25000, node: 12 }
  ]
}
```

### 2. buildHandHistory() Processa

```javascript
path = [0, 2, 5, 12]

// Transição 0 → 2
action = { type: 'R', amount: 25000 }
player = 2 (CO)
↓
getActionName({ type: 'R', amount: 25000 }, 100, 100000, 'bb')
↓
Output: "Raise 2.5"

// Transição 2 → 5
action = { type: 'C', amount: 25000 }
player = 3 (BTN)
↓
getActionName({ type: 'C', amount: 25000 }, ...)
↓
Output: "Call"
```

### 3. HandHistoryAction Gerado

```typescript
[
  {
    position: 2,
    playerName: 'CO',
    action: 'Raise 2.5',
    amount: 25000,
    amountBB: 2.5,
    street: 'Preflop'
  },
  {
    position: 3,
    playerName: 'BTN',
    action: 'Call',
    amount: 25000,
    amountBB: 2.5,
    street: 'Preflop'
  }
]
```

### 4. Renderização Final

```
Hand History
Preflop

[🐵] CO
   ┌─────────────┐
   │ Raise 2.5   │ (laranja)
   └─────────────┘

[🐵] BTN
   ┌─────────────┐
   │ Call        │ (verde)
   └─────────────┘

2 actions
```

---

## Arquivos Envolvidos

| Arquivo | Responsabilidade |
|---------|------------------|
| `types.ts` | Define `Action`, `NodeData`, `HandHistoryAction` |
| `handHistoryBuilder.ts` | Navega árvore de nós e constrói histórico |
| `pokerUtils.ts` | `getActionName()` - converte action em texto |
| `pokerUtils.ts` | `getActionColor()` - define cores das ações |
| `HandHistoryPanel.tsx` | Renderiza o histórico visualmente |
| `TrainerTable.tsx` | Integra o HandHistoryPanel no trainer |

---

## Casos Especiais

### 1. All-in por Stack Curto
```typescript
// Jogador com 8 BB dá raise de 7.9 BB
actionAmountBB = 7.9
playerStackBB = 8.0
7.9 / 8.0 = 0.9875 (98.75%) > 90%
→ "All-in 7.9"
```

### 2. All-in com Call (90%+)
```typescript
// Jogador com 10 BB dá call de 9.2 BB
actionAmountBB = 9.2
playerStackBB = 10.0
9.2 / 10.0 = 0.92 (92%) > 90%
→ "All-in 9.2" (em vez de apenas "Call")
```

### 3. All-in por Stack Residual
```typescript
// Jogador com 10 BB dá call de 9.6 BB
remainingStackBB = 10.0 - 9.6 = 0.4 BB < 0.5 BB
→ "All-in 9.6" (deixaria apenas 0.4 BB, inviável)
```

### 4. All-in Forçado em Oponente
```typescript
// Hero tem 20 BB, vilão tem 12 BB
// Hero dá raise de 12 BB
raiseSizeBB = 12
opponentStackBB = 12
|12 - 12| = 0 < 0.05
→ isOpponentAllIn = true
→ "All-in 12"
```

### 5. Formatação de Decimais
```typescript
// Remove .0 desnecessários
"3.0" → "3"
"2.5" → "2.5"
"12.0" → "12"
```

### 6. Modo Chips
```typescript
// Formata com separadores de milhares
24000 → "240"
1234567 → "12,345.67"
```

---

## Debugging Tips

### Console Logs Úteis
```javascript
// Em buildHandHistory()
console.log('🎬 Building hand history:');
console.log('  Path found:', path);
console.log('  Action:', actionDescription);
console.log('  ${playerName}: ${actionDescription} (Street: ${currentStreet})');
```

### Verificar Path
```javascript
// Deve retornar caminho válido do root ao target
buildNodePath(nodes, targetNodeId)
// Output: [0, 2, 5, 12]
```

### Verificar Action
```javascript
getActionName(
    { type: 'R', amount: 25000 },
    100,  // bigBlind
    100000,  // playerStack
    'bb'
)
// Output: "Raise 2.5"
```

---

## Resumo

1. **`Action.type`** determina a categoria base (F/R/C/X)
2. **`Action.amount`** + **`bigBlind`** calculam o tamanho em BB
3. **`playerStack`** vs **`amount`** detecta all-ins (tanto para Raise quanto para Call)
   - All-in se: amount ≥ 90% do stack **OU** stack residual < 0.5 BB
4. **`getActionName()`** formata tudo em texto legível ("Raise 2.5", "All-in 7.2")
5. **`getActionColor()`** define a cor baseada no texto
6. **`HandHistoryPanel`** renderiza com avatares e balões coloridos

**A determinação é puramente matemática**: 
- Compare `amount` com `stack` → All-in? (≥90% OU deixa <0.5 BB)
- Divida `amount` por `bigBlind` → Tamanho do raise/call
- Formate com 1 decimal → "2.5", "3.0" → "3"
- **NOVO**: Calls também podem ser All-in (quando usam ≥90% do stack)
- **NOVO**: Threshold reduzido de 95% → 90% para capturar mais casos reais
