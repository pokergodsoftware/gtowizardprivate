# PlayerCard Component Architecture

## Component Hierarchy

```
PlayerCard (Main Component)
├── PlayerBadges
│   └── Badge[] (RAISE, FOLD, CALL, SHOVE, CHECK, ALLIN)
│
├── BountyBadge
│   └── Formatted bounty value
│
├── PlayerAvatar
│   ├── Avatar image (when folded)
│   └── Cards image (when active)
│
└── PlayerInfo
    ├── Dealer Button ("D") - conditional
    ├── Position label (UTG, CO, BTN, etc.)
    └── Stack (clickable, toggles BB/chips)
```

## Data Flow

```
Props Input
    │
    ├─→ State Calculations
    │   ├── shouldShowTransparent
    │   ├── playerHasFolded
    │   └── badges (from generatePlayerBadges)
    │
    ├─→ Formatting
    │   └── formattedStack (via formatStack utility)
    │
    └─→ Sub-Components
        ├── PlayerBadges (badges[])
        ├── BountyBadge (bounty, format settings)
        ├── PlayerAvatar (index, position, isFolded)
        └── PlayerInfo (position, stack, isBTN, toggle handler)
```

## Visual Layout

```
┌─────────────────────────────┐
│     [RAISE] [SHOVE]         │  ← PlayerBadges (top-right)
│                             │
│       ┌─────────────┐       │
│       │   💰 $7.50  │       │  ← BountyBadge
│       └─────────────┘       │
│                             │
│           ┌────┐            │
│       ┌───┤ 🃏 │───┐        │  ← PlayerAvatar (cards)
│       │   └────┘   │        │    or Avatar (when folded)
│       │            │        │
│    [D]│    UTG     │        │  ← PlayerInfo
│       │   23.5bb   │        │    - Dealer button (if BTN)
│       │            │        │    - Position
│       └────────────┘        │    - Stack (clickable)
│                             │
└─────────────────────────────┘
```

## Props Interface

### PlayerCard Props
```typescript
interface PlayerCardProps {
    // Identity
    index: number;
    position: string;
    
    // Game state
    stack: number;
    bounty: number;
    bigBlind: number;
    smallBlind: number;
    ante: number;
    
    // Player status flags
    isCurrentPlayer: boolean;  // Hero (hidden if true)
    isBB: boolean;
    isSB: boolean;
    isBTN: boolean;
    
    // Action flags
    isRaiser: boolean;
    isShover: boolean;
    isMultiwayShover: boolean;
    isAutoAllin: boolean;
    hasFolded: boolean;
    villainAction?: VillainAction;
    
    // Display settings
    displayMode: 'bb' | 'chips';
    showBountyInDollars: boolean;
    solutionFileName?: string;
    
    // Handlers
    onToggleDisplayMode?: () => void;
}
```

## Badge Generation Logic

```
generatePlayerBadges()
    │
    ├─→ isRaiser? → Add RAISE badge (orange)
    │
    ├─→ isShover/isMultiwayShover? → Add SHOVE badge (purple)
    │
    ├─→ isAutoAllin? → Add CALL badge (green)
    │
    ├─→ hasFolded (no other action)? → Add FOLD badge (red)
    │
    └─→ villainAction?
        ├─→ "Fold" → FOLD badge (red)
        ├─→ "Call" → CALL badge (green)
        ├─→ "Check" → CHECK badge (gray)
        ├─→ "Allin" → ALLIN badge (purple)
        └─→ "Raise*" → RAISE badge (orange)
```

## Styling System

### Action Colors (GTO Wizard Style)
```typescript
const BADGE_COLORS = {
    RAISE: 'bg-orange-500/90',   // #f97316
    SHOVE: 'bg-purple-500/90',   // #a855f7
    CALL:  'bg-green-500/90',    // #10b981
    FOLD:  'bg-red-500/80',      // #ef4444
    CHECK: 'bg-gray-500/90',     // #6b7280
    ALLIN: 'bg-purple-500/90',   // #a855f7
};
```

### Card States
- **Active**: Full opacity, cards visible
- **Folded**: 80% opacity, avatar visible
- **Hero**: Hidden (returns null)

### Z-Index Layers
- `z-0`: Avatar/Cards background
- `z-10`: Main card (position/stack)
- `z-30`: Action badges

## Performance Optimizations

### Memoization
All sub-components use `React.memo` to prevent unnecessary re-renders:
- `BountyBadge` - Only re-renders if bounty/format changes
- `PlayerAvatar` - Only re-renders if fold state changes
- `PlayerInfo` - Only re-renders if stack/position changes
- `PlayerBadges` - Only re-renders if badges array changes

### Computed Values
Calculated once per render:
- `badges` - Generated before JSX
- `formattedStack` - Pre-formatted string
- `playerHasFolded` - Boolean flag
- `shouldShowTransparent` - Boolean flag

## Integration Points

### Used By
- `PokerTableVisual` (components/PokerTable/index.tsx)
- Maps over players array to render opponent cards

### Dependencies
- `formatBounty()` - utils/pokerTableCalculations.ts
- `formatStack()` - utils/pokerTableCalculations.ts
- `getTrainerAssetUrl()` - src/config.ts

### Assets Required
- `avatar1.png` through `avatar8.png` (player avatars)
- `cards.png` (face-down cards image)

## Testing Strategy

### Unit Tests
- [ ] Badge generation for all action combinations
- [ ] Stack formatting in BB vs chips mode
- [ ] Bounty formatting for different tournament types
- [ ] Avatar number calculation (index % 8 + 1)

### Integration Tests
- [ ] Renders null for hero player
- [ ] Shows correct transparency for folded players
- [ ] Dealer button only on BTN player
- [ ] Toggle display mode updates stack format

### Visual Tests
- [ ] Badge positioning consistent across screen sizes
- [ ] Avatar/cards transition smooth
- [ ] Bounty badge visible above cards
- [ ] Dealer button aligns with card

## Related Documentation
- `POKERTABLE_BEFORE_AFTER.md` - Original PokerTable refactoring
- `POKERTABLE_ARCHITECTURE_DIAGRAM.md` - Full table architecture
- `REFACTORING_POKERTABLE.md` - Refactoring methodology
- `PLAYERCARD_REFACTOR.md` - Detailed refactoring notes
