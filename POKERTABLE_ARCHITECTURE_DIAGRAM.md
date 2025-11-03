# PokerTable Component Architecture Diagram

## Visual Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                     PokerTableVisual.tsx                         │
│                     (Entry Point - 52 lines)                     │
│                                                                   │
│   - Maintains backward compatibility                             │
│   - Simple wrapper that delegates to PokerTable                  │
│   - No business logic                                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PokerTable/index.tsx                            │
│              (Main Orchestrator - 240 lines)                     │
│                                                                   │
│   - Coordinates all sub-components                               │
│   - Manages poker table state                                    │
│   - Calculates player positions and bets                         │
│   - Uses custom hooks for positioning                            │
└──────┬──────┬──────┬──────┬──────┬──────┬──────────────────────┘
       │      │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼      ▼
    ┌──┴──┐ ┌┴─────┐ ┌┴────┐ ┌┴────┐ ┌┴──┐ ┌┴──────────┐
    │Payout│ │Player│ │Chip │ │Pot  │ │Tour│ │Table Image│
    │Panel │ │Card  │ │Stack│ │Disp │ │Info│ │           │
    └─────┘ └──────┘ └─────┘ └─────┘ └────┘ └───────────┘
```

## Component Details

### 1. PayoutPanel (92 lines)
```
┌───────────────────────────┐
│  💰 Payouts      🖐️ ↺    │  ← Draggable header
├───────────────────────────┤
│  1º-2º      $125.00       │
│  3º         $75.00        │  ← Prize list
│  4º         $50.00        │     (scrollable)
│  5º         $25.00        │
└───────────────────────────┘
```
**Features:**
- Draggable with position persistence
- Reset button to return to default position
- Scrollable prize list
- Visual feedback while dragging

### 2. PlayerCard (215 lines)
```
        ┌──────────┐
        │ $7.50    │  ← Bounty (if any)
        └──────────┘
     ┌────────────────┐
     │   [RAISE]      │  ← Action badge
     ├────────────────┤
  D  │  🃏 🃏         │  ← Cards/Avatar
     ├────────────────┤
     │    BTN         │  ← Position
     │   12.5bb       │  ← Stack
     └────────────────┘
```
**Features:**
- Shows bounty above card
- Action badges (RAISE, SHOVE, FOLD, CALL, etc.)
- Button dealer indicator (D)
- Avatar when folded, cards when active
- Clickable stack to toggle display mode

### 3. ChipStack (126 lines)
```
    🔴 🟡 🟠       ← Visual chips
  ┌──────────┐
  │ 2.5 BB   │    ← Bet amount
  └──────────┘
```
**Features:**
- Colored chips (purple, yellow, orange, red)
- Different stack sizes for different bet types
- Opacity changes based on player state
- Border colors indicate action type

### 4. PotDisplay (58 lines)
```
     🟣 🟡 🟢      ← Visual chips
  ┌─────────────┐
  │ Total Pot:  │
  │  5.5 BB     │   ← Pot amount
  └─────────────┘
```
**Features:**
- Shows total pot in center
- Visual chip representation
- Toggles between BB and chip display

### 5. TournamentInfo (33 lines)
```
┌──────────────────┐          ┌──────────────────┐
│ Speed Racer $32  │          │ Stage: Near ITM  │
└──────────────────┘          └──────────────────┘
  (Top-Left)                     (Top-Right)
```
**Features:**
- Tournament name badge (yellow border)
- Stage badge (teal border)
- Auto-extracted from solution filename

## Custom Hooks Architecture

### useDraggable Hook
```
┌─────────────────────────────────────┐
│        useDraggable.ts              │
│                                     │
│  Input:                             │
│  - storageKey (optional)            │
│  - initialPosition (optional)       │
│                                     │
│  Output:                            │
│  - position: {x, y}                 │
│  - isDragging: boolean              │
│  - dragRef: RefObject               │
│  - handleMouseDown: (e) => void     │
│  - handleResetPosition: (e) => void │
│                                     │
│  Features:                          │
│  ✓ Position persistence (localStorage)│
│  ✓ Screen boundary detection        │
│  ✓ Smooth dragging                  │
│  ✓ Reset to default position        │
└─────────────────────────────────────┘
```

### usePlayerPositions Hook
```
┌─────────────────────────────────────┐
│      usePlayerPositions.ts          │
│                                     │
│  Input: None (pure calculations)    │
│                                     │
│  Output:                            │
│  - getPlayerPosition(i, total, hero)│
│    → {top: "50%", left: "50%"}      │
│  - getPlayerAngle(i, total, hero)   │
│    → number (radians)               │
│                                     │
│  Features:                          │
│  ✓ Elliptical table positioning     │
│  ✓ Auto-rotation (hero at bottom)   │
│  ✓ Works for 2-9 players            │
│  ✓ Angle calculation for chips      │
└─────────────────────────────────────┘
```

## Utility Functions Architecture

### pokerTableCalculations.ts
```
┌────────────────────────────────────────────────┐
│      utils/pokerTableCalculations.ts           │
│                                                │
│  Formatting Functions:                         │
│  ├─ formatBounty(bounty, showInDollars, file) │
│  ├─ formatStack(stack, bb, mode, ante, ...)   │
│  └─ getTournamentName(fileName)                │
│                                                │
│  Calculation Functions:                        │
│  ├─ getInitialBounty(fileName)                 │
│  ├─ calculateTotalPot(sb, bb, ante, players)   │
│  ├─ hasPlayerFolded(index, heroPosition)       │
│  └─ calculatePlayerBet(index, flags, ...)      │
│                                                │
│  All functions are pure (no side effects)      │
└────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
                    Props from Parent
                           │
                           ▼
                  PokerTableVisual
                           │
                           ▼
                      PokerTable
                   (Main Orchestrator)
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    [Calculate]     [Calculate]     [Calculate]
    Player Data     Pot Data        Position Data
           │               │               │
           │               │               │
    ┌──────┴──────┐       │        ┌──────┴──────┐
    ▼             ▼       ▼        ▼             ▼
PlayerCard    ChipStack  PotDisplay  PayoutPanel TournamentInfo
    │             │       │           │            │
    └─────────────┴───────┴───────────┴────────────┘
                      Render UI
```

## State Management

### Component State
```
PayoutPanel:
  - position: {x, y}     (draggable position)
  - isDragging: boolean  (drag state)
  - dragStart: {x, y}    (drag origin)

PokerTable:
  - No internal state (uses props only)

All other components:
  - Stateless (pure presentation)
```

### External State (Props)
```
From Parent → PokerTableVisual → PokerTable:
  - currentNode: NodeData
  - settings: SettingsData
  - bigBlind: number
  - displayMode: 'bb' | 'chips'
  - tournamentPhase?: string
  - raiserPosition?: number
  - shoverPositions?: number[]
  - spotType?: string
  - villainActions?: VillainAction[]
  - showBountyInDollars?: boolean
  
Callbacks:
  - onToggleDisplayMode?: () => void
  - onToggleBountyDisplay?: () => void
```

## Reusability Matrix

| Component/Hook | Can be used elsewhere? | Complexity | Dependencies |
|----------------|------------------------|------------|--------------|
| PayoutPanel | ✅ Yes (any prize list) | Low | useDraggable |
| PlayerCard | ✅ Yes (any player info) | Medium | pokerUtils, calculations |
| ChipStack | ✅ Yes (any bet display) | Low | None |
| PotDisplay | ✅ Yes (any pot display) | Low | None |
| TournamentInfo | ✅ Yes (any badges) | Low | None |
| useDraggable | ✅ Yes (any draggable) | Low | React only |
| usePlayerPositions | ✅ Yes (any circular layout) | Low | None |
| pokerTableCalculations | ✅ Yes (any poker logic) | Low | None |

## Performance Considerations

### Current Implementation
- All calculations done on each render
- No memoization

### Future Optimizations
```typescript
// Example: Memoize expensive calculations
const playerPosition = useMemo(
  () => getPlayerPosition(index, numPlayers, heroPosition),
  [index, numPlayers, heroPosition]
);

const playerBet = useMemo(
  () => calculatePlayerBet(/* params */),
  [/* dependencies */]
);
```

## Testing Strategy

### Unit Tests
```
✓ utils/pokerTableCalculations.ts
  - formatBounty()
  - formatStack()
  - calculateTotalPot()
  - etc.

✓ hooks/usePlayerPositions.ts
  - getPlayerPosition() with various inputs
  - getPlayerAngle() with various inputs

✓ hooks/useDraggable.ts
  - Position updates
  - localStorage persistence
  - Boundary detection
```

### Integration Tests
```
✓ ChipStack component
  - Renders correct number of chips
  - Shows correct amount
  - Applies correct styling

✓ PlayerCard component
  - Shows correct badges
  - Displays bounty when present
  - Toggles between cards/avatar

✓ PokerTable component
  - Renders all players
  - Positions correctly
  - Calculates bets correctly
```

## Accessibility Improvements (Future)

```typescript
// Add ARIA labels
<button
  aria-label="Toggle display mode between big blinds and chips"
  onClick={onToggleDisplayMode}
>

// Add keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleAction()}
>

// Add screen reader announcements
<div role="status" aria-live="polite">
  {pot > 0 && `Pot is ${formattedPot}`}
</div>
```

---

**Architecture designed for:**
- ✅ Maintainability
- ✅ Scalability
- ✅ Reusability
- ✅ Testability
- ✅ Performance
- ✅ Accessibility (future)
