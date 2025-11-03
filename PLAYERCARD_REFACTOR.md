# PlayerCard Component Refactoring

## Overview
Refactored `PlayerCard.tsx` from a monolithic component into a modular structure with dedicated sub-components for better maintainability and reusability.

## Date
November 3, 2025

## Refactoring Goals
1. **Modularity**: Break down complex rendering logic into focused sub-components
2. **Maintainability**: Make code easier to understand and modify
3. **Reusability**: Create reusable pieces that can be tested independently
4. **Performance**: Use React.memo to prevent unnecessary re-renders

## Component Structure

### Main Component: `PlayerCard`
- **Location**: `components/PokerTable/PlayerCard.tsx`
- **Purpose**: Orchestrates sub-components and manages player state logic
- **Props**: 20+ props including position, stack, bounty, action states, display modes

### Sub-Components Created

#### 1. `BountyBadge`
```typescript
interface BountyBadgeProps {
    bounty: number;
    showBountyInDollars: boolean;
    solutionFileName?: string;
}
```
- **Purpose**: Displays player bounty with appropriate formatting
- **Styling**: Yellow gradient badge with border
- **Memoized**: Yes (React.memo)

#### 2. `PlayerAvatar`
```typescript
interface PlayerAvatarProps {
    index: number;
    position: string;
    isFolded: boolean;
}
```
- **Purpose**: Shows avatar (when folded) or cards (when active)
- **Logic**: Cycles through 8 avatar images based on player index
- **Memoized**: Yes (React.memo)

#### 3. `PlayerInfo`
```typescript
interface PlayerInfoProps {
    position: string;
    stack: string;
    isBTN: boolean;
    onToggleDisplayMode?: () => void;
}
```
- **Purpose**: Displays position label, stack size, and dealer button
- **Features**: 
  - Clickable stack to toggle BB/chips display mode
  - Dealer button ("D") positioned beside card when player is BTN
- **Memoized**: Yes (React.memo)

#### 4. `PlayerBadges`
```typescript
interface PlayerBadgesProps {
    badges: PlayerBadge[];
}

export interface PlayerBadge {
    type: 'RAISE' | 'SHOVE' | 'CALL' | 'FOLD' | 'CHECK' | 'ALLIN';
    color: string;
}
```
- **Purpose**: Renders action badges (RAISE, FOLD, CALL, etc.)
- **Position**: Top-right corner of player card
- **Memoized**: Yes (React.memo)

## Helper Functions

### `getPlayerCardClasses(shouldShowTransparent: boolean)`
- Determines CSS classes based on player transparency state
- Applies opacity-80 for folded/inactive players

### `generatePlayerBadges(...)`
- Consolidates badge generation logic from scattered conditionals
- Returns array of `PlayerBadge` objects based on player state
- **Parameters**:
  - `isRaiser`, `isShover`, `isMultiwayShover`
  - `isAutoAllin`, `hasFolded`
  - `villainAction` (optional)

## Key Improvements

### Before
- **Lines of Code**: 214
- **Structure**: Single component with nested JSX and inline conditionals
- **Badge Logic**: Scattered across multiple conditional blocks with IIFE patterns
- **Readability**: Complex nested ternaries and inline functions

### After
- **Lines of Code**: 313 (includes comments and type definitions)
- **Structure**: Modular components with clear separation of concerns
- **Badge Logic**: Centralized in `generatePlayerBadges()` helper
- **Readability**: Each sub-component has single responsibility

### Performance Benefits
- All sub-components use `React.memo` to prevent unnecessary re-renders
- Badge generation computed once per render
- Stack formatting computed before passing to `PlayerInfo`

### Maintainability Benefits
- Each sub-component can be tested independently
- Badge colors and types centralized
- Easy to add new badge types or modify existing ones
- Clear prop interfaces for each component

## Integration

### Exports
```typescript
// components/PokerTable/index.tsx
import { PlayerCard, type PlayerBadge } from './PlayerCard';
export type { PlayerBadge };
```

### Usage
The `PlayerCard` component is used in the main `PokerTableVisual` component to render opponent cards around the table. No changes to external usage required - the component maintains the same interface.

## Testing Checklist
- [ ] Verify player cards render correctly for all positions
- [ ] Test badge display for different action states
- [ ] Confirm bounty formatting in BB/chips modes
- [ ] Check dealer button position for BTN player
- [ ] Test transparency for folded players
- [ ] Verify avatar/cards toggle based on fold state
- [ ] Test stack display mode toggle functionality
- [ ] Confirm no TypeScript errors
- [ ] Test with different tournament types (speed32, speed50, speed108)

## Related Files
- `components/PokerTable/PlayerCard.tsx` - Main refactored file
- `components/PokerTable/index.tsx` - Updated exports
- `utils/pokerTableCalculations.ts` - Formatting utilities
- `src/config.ts` - Asset URL helpers
- `POKERTABLE_ARCHITECTURE_DIAGRAM.md` - Architecture documentation

## Design Pattern
Follows the **PokerTable Refactoring Pattern** established in December 2024:
1. Extract logic to utils/hooks
2. Create focused sub-components
3. Use React.memo for performance
4. Maintain clear interfaces
5. Keep components presentational

## Future Enhancements
- [ ] Extract badge colors to theme configuration
- [ ] Add animation transitions for badge changes
- [ ] Create Storybook stories for each sub-component
- [ ] Add unit tests for badge generation logic
- [ ] Consider extracting dealer button to separate component
