# Arquitetura Visual do GTO Poker Range Viewer

## 1. Diagrama de Componentes Principais

```
App.tsx (Orquestrador)
├── Estado Global
│   ├── solutions: AppData[]
│   ├── selectedSolutionId: string | null
│   ├── currentNodeId: number
│   ├── selectedHand: string | null
│   └── displayMode: 'bb' | 'chips'
│
├── SolutionsLibrary (Tela Inicial)
│   ├── FileUpload
│   └── Tabela de Soluções
│       ├── Filtros
│       ├── Ordenação
│       └── Seleção
│
└── Visualizador Principal
    ├── Header
    │   └── PlayerStrategyCard (múltiplos)
    ├── RangeGrid (13x13)
    │   └── HandCell (169x)
    └── Sidebar
        ├── DisplayModeToggle
        ├── PokerTable
        ├── ActionsBar
        └── ComboDetail
```

## 2. Estrutura de Dados: AppData

```typescript
AppData {
  id: "uuid"
  fileName: "FT 3-handed 20bb avg"
  tournamentPhase: "Final table"
  
  settings: {
    handdata: {
      stacks: [17280000, 9600000, 74240000]
      blinds: [3200000, 1600000, 480000]
      bounties: [188.0, 134.0, 328.0]
    }
    eqmodel: {
      structure: {
        prizes: {1: 566, 3: 429, ...}
      }
    }
  }
  
  equity: {
    preHandEquity: [28.52, 24.53, 46.95]
  }
  
  nodes: Map<number, NodeData> {
    0: {
      player: 0
      actions: [
        {type: "F", amount: 0, node: 1}
        {type: "R", amount: 16800000, node: 3}
      ]
      hands: {
        "AA": {weight: 1.0, played: [0.0, 1.0], evs: [0.0, 2.45]}
        "72o": {weight: 1.0, played: [1.0, 0.0], evs: [0.0, -1.25]}
      }
    }
  }
}
```

## 3. Fluxo de Navegação

```
Inicialização
    ↓
SolutionsLibrary
    ↓ [Seleciona Solução]
Visualizador (Node 0)
    ↓ [Clica em Ação]
Visualizador (Node 3)
    ↓ [Clica em Mão]
ComboDetail Atualizado
```

## 4. Cálculo de HandCell

```
HandData: {played: [0.3, 0.0, 0.7], evs: [0.0, 0.0, 2.5]}
Actions: [Fold, Call, Raise]

Segmentos:
├── 30% Fold (bg-sky-600)
└── 70% Raise (bg-pink-600)

EV Total: (0.0 * 0.3) + (0.0 * 0.0) + (2.5 * 0.7) = 1.75

Renderização:
┌─────────────┐
│ 30% | 70%   │ ← Gradiente
│  Azul | Rosa │
│     AKs      │ ← Texto
│     1.75     │
└─────────────┘
```

## 5. Esquema de Cores

```
Ação      | Classe         | Cor
----------|----------------|------------
Allin     | bg-red-600     | 🟥 Vermelho
Raise     | bg-pink-600    | 🟪 Rosa
Call      | bg-lime-500    | 🟩 Verde
Fold      | bg-sky-600     | 🟦 Azul
Check     | bg-gray-500    | ⬜ Cinza
Check(BB) | bg-lime-500    | 🟩 Verde
```

## 6. Mapeamento de Posições

```
9-Max: [UTG, UTG1, UTG2, LJ, HJ, CO, BTN, SB, BB]
6-Max: [LJ, HJ, CO, BTN, SB, BB]
3-Max: [BTN, SB, BB]
Heads-Up: [BTN, BB]
```

## 7. Árvore de Decisão

```
Node 0 (BTN)
├─ Fold → Node 1
└─ Raise → Node 3
            ├─ Fold → Node 5
            ├─ Call → Node 6
            └─ Raise → Node 7
```

## 8. Cálculo de ActionsBar

```
Para cada ação:
  Σ(weight * maxCombos * frequency) = total_combos

Exemplo:
  Fold:  450 combos → 39.8%
  Raise: 680 combos → 60.2%
```
