# Phase 4 - Hand Selection Utilities ✅

**Status**: COMPLETED  
**Date**: December 2024  
**Lines extracted**: ~280 lines of complex filtering logic

## Overview

Phase 4 successfully extracted hand filtering and combo selection logic from `TrainerSimulator.tsx` into modular utility functions. This includes sophisticated algorithms for selecting "difficult" hands based on EV ranges and marginal decision thresholds.

## Files Created

### 1. `utils/handSelection.ts` (271 lines)

Core utilities for filtering and selecting poker hands:

#### Hand Filtering Functions
- **`getPlayedHands()`** - Filters hands with frequency > 0
- **`filterHandsByEV()`** - Keeps hands with EV between -0.5 and +1.5 BB (difficult range)
- **`filterHandsByWorstEV()`** - Takes bottom 30% by EV (min 5, max 50 hands)
- **`filterNonMarginalHands()`** - Removes hands with EV diff < 0.05 BB (too obvious)
- **`selectTrainingHands()`** - Smart cascade filter (tries marginal → difficult → worst → all)

#### Combo Utilities
- **`getHandNameFromCombo()`** - Converts "AsKh" → "AKo", "7h7d" → "77"
- **`selectRandomCombo()`** - Selects random combo from hand (handles flat/nested arrays)

#### Key Constants
- `MIN_EV_DIFF = 0.05` - Threshold for marginal decisions

### 2. `utils/HAND_SELECTION_EXAMPLES.ts` (220 lines)

Comprehensive usage examples:

1. **Basic Filtering** - Manual cascade workflow
2. **Smart Filtering** - Using `selectTrainingHands()`
3. **Random Hand/Combo** - Full selection workflow
4. **Worst EV Fallback** - Handling edge cases
5. **Combo Conversion** - Demo of `getHandNameFromCombo()`
6. **Full Spot Generation** - Complete integration example
7. **Debug Helpers** - Logging filter results

### 3. `utils/index.ts` (Updated)

Added export:
```typescript
export * from './handSelection.ts';
```

## Key Algorithms

### EV-Based Filtering

The hand selection uses a sophisticated multi-stage filter:

```typescript
// Stage 1: Filter by EV range (-0.5 to +1.5 BB)
const difficultHands = filterHandsByEV(node, playedHands);

// Stage 2: Remove non-marginal (EV diff > 0.05)
const marginalHands = filterNonMarginalHands(node, difficultHands);

// Stage 3: Fallback cascade
if (marginalHands.length > 0) return marginalHands;
if (difficultHands.length > 0) return difficultHands;
return filterHandsByWorstEV(node, playedHands);
```

### Combo Matching Logic

Handles reversed ranks (e.g., "KA" vs "AK"):

```typescript
const comboHand = getHandNameFromCombo(combo);
const reversedHand = rank1 !== rank2 
    ? `${rank2}${rank1}${comboHand.slice(-1)}` 
    : comboHand;

return comboHand === handName || reversedHand === handName;
```

## Usage in Main Component

**Before (in TrainerSimulator.tsx)**:
```typescript
// Lines 1335-1475: ~140 lines of inline filtering logic
const playedHands = Object.keys(currentNode.hands).filter(...);
const difficultHands = playedHands.filter(...);
const marginalHands = difficultHands.filter(...);
// ... complex EV calculations inline
```

**After (using extracted utilities)**:
```typescript
import { selectTrainingHands, selectRandomCombo } from './utils';

const trainingHands = selectTrainingHands(node);
const handName = trainingHands[Math.floor(Math.random() * trainingHands.length)];
const combo = selectRandomCombo(handName, allCombos);
```

## Technical Highlights

### 1. Smart Type Handling

The `selectRandomCombo()` function handles both flat and nested arrays:

```typescript
const flatCombos = Array.isArray(allCombos[0]) ? allCombos.flat() : allCombos;
```

This makes it flexible for different combo data structures.

### 2. Comprehensive Filtering

The cascade filter ensures we always get training hands:

- **Priority 1**: Marginal hands (best for training)
- **Priority 2**: All difficult hands (still good)
- **Priority 3**: Worst EV hands (fallback)
- **Priority 4**: All played hands (last resort)

### 3. Detailed Logging

All functions include console logging for debugging:

```typescript
console.log(`📊 Total played hands: ${playedHands.length}`);
console.log(`🎯 Hands in EV range [-0.5, +1.5]: ${difficultHands.length}`);
console.log(`⚖️ Marginal hands (EV diff > 0.05): ${marginalHands.length}`);
```

## Integration Points

### Dependencies
- `types.ts` - NodeData, HandData interfaces
- `combos.json` - Card combination data

### Used By (Future)
- Phase 5: Spot generators (RFI, vs Open, vs Shove, vs Multiway, Any)
- Phase 6: `useSpotGeneration` hook

## Testing

✅ Zero TypeScript compilation errors  
✅ All functions properly typed  
✅ Handles edge cases (no combos, no hands)  
✅ Backward compatible with existing code

## Next Steps (Phase 5)

Extract 5 spot generation functions:
1. **RFI Spots** - Generate raise-first-in scenarios
2. **vs Open Spots** - Facing a single open raise
3. **vs Shove Spots** - Facing an all-in
4. **vs Multiway Spots** - Multiple players already in
5. **Any Spots** - Random game tree navigation

These will use the hand selection utilities created in Phase 4.

## Metrics

- **Lines extracted**: ~280 lines
- **Functions created**: 7
- **Constants defined**: 1
- **Example functions**: 7
- **Files created**: 2
- **Files updated**: 1
- **Compilation errors**: 0

---

**Phase 4 Status**: ✅ COMPLETE  
**Ready for**: Phase 5 (Spot Generators)
