# Visual Architecture of the GTO Poker Range Viewer

## 1. Main Component Diagram

```
App.tsx (Orchestrator)
├── Global State
│   ├── solutions: AppData[]
│   ├── selectedSolutionId: string | null
│   ├── currentNodeId: number
│   ├── selectedHand: string | null
│   └── displayMode: 'bb' | 'chips'
│
├── SolutionsLibrary (Home Screen)
│   ├── FileUpload
│   └── Solutions Table
│       ├── Filters
│       ├── Sorting
│       └── Selection
│
└── Main Viewer
    ├── Header
    │   └── PlayerStrategyCard (multiple)
    ├── RangeGrid (13x13)
    │   └── HandCell (169x)
    └── Sidebar
        ├── DisplayModeToggle
        ├── PokerTable
        ├── ActionsBar
        └── ComboDetail
```

## 2. Data Structure: AppData

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

## 3. Navigation Flow

```
Initialization
    ↓
SolutionsLibrary
    ↓ [Select Solution]
Viewer (Node 0)
    ↓ [Click Action]
Viewer (Node 3)
    ↓ [Click Hand]
ComboDetail Updated
```

## 4. HandCell Calculation

```
HandData: {played: [0.3, 0.0, 0.7], evs: [0.0, 0.0, 2.5]}
Actions: [Fold, Call, Raise]

Segments:
├── 30% Fold (bg-sky-600)
└── 70% Raise (bg-pink-600)

Total EV: (0.0 * 0.3) + (0.0 * 0.0) + (2.5 * 0.7) = 1.75

Rendering:
┌─────────────┐
│ 30% | 70%   │ ← Gradient
│  Blue | Pink │
│     AKs      │ ← Label
│     1.75     │
└─────────────┘
```

## 5. Color Scheme

```
Action    | Class          | Color
----------|----------------|------------
Allin     | bg-red-600     | 🟥 Red
Raise     | bg-pink-600    | 🟪 Pink
Call      | bg-lime-500    | 🟩 Green
Fold      | bg-sky-600     | 🟦 Blue
Check     | bg-gray-500    | ⬜ Gray
Check(BB) | bg-lime-500    | 🟩 Green
```

## 6. Position Mapping

```
9-Max: [UTG, UTG1, UTG2, LJ, HJ, CO, BTN, SB, BB]
6-Max: [LJ, HJ, CO, BTN, SB, BB]
3-Max: [BTN, SB, BB]
Heads-Up: [BTN, BB]
```

## 7. Decision Tree

```
Node 0 (BTN)
├─ Fold → Node 1
└─ Raise → Node 3
            ├─ Fold → Node 5
            ├─ Call → Node 6
            └─ Raise → Node 7
```

## 8. ActionsBar Calculation

```
For each action:
  Σ(weight * maxCombos * frequency) = total_combos

Example:
  Fold:  450 combos → 39.8%
  Raise: 680 combos → 60.2%
```
