# TrainerSimulator Refactoring

## 📦 Phase 1: Setup & Preparation - ✅ COMPLETED

This directory contains the refactored TrainerSimulator component structure.

### ✅ What Was Done in Phase 1

#### 1. Created Folder Structure
```
components/TrainerSimulator/
├── hooks/                      # Custom React hooks (Phase 2)
├── utils/                      # Pure utility functions
│   ├── spotGenerators/         # Spot generation logic (Phase 3)
│   └── trainerHelpers.ts       # ✅ Helper functions
├── components/                 # UI sub-components (Phase 4)
└── types.ts                    # ✅ Type definitions
```

#### 2. Extracted Types (`types.ts`)
- ✅ `SpotSimulation` - Interface for poker spot simulations
- ✅ `SpotType` - Union type for spot types (RFI, vs Open, etc)
- ✅ `TOURNAMENT_PHASES` - Constant array of tournament phases
- ✅ `TournamentPhase` - Type derived from tournament phases
- ✅ `TrainerStats` - User statistics interface
- ✅ `TrainerDisplaySettings` - Display settings interface

#### 3. Extracted Helper Functions (`utils/trainerHelpers.ts`)
- ✅ `getInitialBounty(fileName)` - Determines initial bounty from filename
- ✅ `formatBounty(bounty, showInDollars, fileName)` - Formats bounty display
- ✅ `getAverageStackBB(solution)` - Calculates average stack in BB

#### 4. Extracted Navigation Utils (`utils/navigationUtils.ts`)
- ✅ `loadNodeIfNeeded()` - Loads a node if not already in solution
- ✅ `findFoldAction()` - Finds fold action in node actions
- ✅ `findRaiseAction()` - Finds raise action with specific BB amount
- ✅ `findAllInAction()` - Finds all-in action for a player
- ✅ `foldUntilPosition()` - Navigates folding until reaching target position
- ✅ `findValidRaiser()` - Finds valid position that can raise 2BB
- ✅ `findValidShover()` - Finds valid position that can go all-in
- ✅ `navigateToHeroPosition()` - Complex navigation with raiser/shover logic

#### 5. Extracted Hooks (`hooks/`)
- ✅ `useTrainerSettings.ts` - Display mode, bounty display, auto-advance with localStorage
- ✅ `useTimebank.ts` - Timer countdown with audio alerts (8s, 4s warnings)
- ✅ `useTrainerStats.ts` - Statistics tracking and updates

#### 6. Created Index Files
- ✅ `utils/index.ts` - Export point for utilities
- ✅ `utils/spotGenerators/index.ts` - Placeholder for Phase 3
- ✅ `hooks/index.ts` - Placeholder for Phase 2
- ✅ `components/index.ts` - Placeholder for Phase 4

### 📝 Usage Examples

#### Importing Types
```typescript
import type { SpotSimulation, SpotType, TrainerStats } from './TrainerSimulator/types.ts';
import { TOURNAMENT_PHASES } from './TrainerSimulator/types.ts';
```

#### Importing Utilities
```typescript
import { 
    getInitialBounty, 
    formatBounty, 
    getAverageStackBB 
} from './TrainerSimulator/utils';

// Navigation utilities
import { 
    loadNodeIfNeeded,
    foldUntilPosition,
    findValidRaiser,
    findValidShover,
    navigateToHeroPosition,
    type LoadNodesFunction,
    type NavigationResult
} from './TrainerSimulator/utils';
```

#### Importing Hooks
```typescript
import { 
    useTrainerSettings, 
    useTimebank, 
    useTrainerStats 
} from './TrainerSimulator/hooks';

// In component:
const { displayMode, toggleDisplayMode, showBountyInDollars, ... } = useTrainerSettings();
const { timeLeft, stopAudios } = useTimebank({ tournamentMode, currentSpot, showFeedback, onTimeExpired });
const { stats, updateStats } = useTrainerStats();
```

### 🔄 Next Steps

**Phase 4: Extract Hand Selection Utils** (Ready to start)
- [ ] `handSelection.ts` - Hand filtering and combo selection utilities
  - `getPlayedHands()` - Filter hands with freq > 0
  - `filterHandsByEV()` - EV range filtering
  - `filterNonMarginalHands()` - MIN_EV_DIFF filtering
  - `selectRandomCombo()` - Combo selection
  - `getHandNameFromCombo()` - Combo to hand name conversion

**Phase 3: Extract Navigation Utils** ✅ COMPLETED
- ✅ `navigationUtils.ts` - Tree navigation and validation
- ✅ 8 navigation functions extracted (~450 lines)
- ✅ Type-safe with full TypeScript support
- ✅ Reusable across all spot generators

**Phase 2: Extract Hooks** ✅ COMPLETED
- ✅ `useTrainerSettings.ts` - Display mode, bounty display, auto-advance
- ✅ `useTimebank.ts` - Timer and timebank audio logic
- ✅ `useTrainerStats.ts` - Statistics tracking and persistence

**Phase 3: Extract Spot Generators** (After Phase 2)
- [ ] `generateRFISpot.ts` - RFI spot generation
- [ ] `generateVsOpenSpot.ts` - vs Open spot generation
- [ ] `generateVsShoveSpot.ts` - vs Shove spot generation
- [ ] `generateVsMultiwaySpot.ts` - vs Multiway spot generation
- [ ] `generateAnySpot.ts` - Any spot generation

**Phase 4: Extract UI Components** (After Phase 3)
- [ ] `TrainerHeader.tsx` - Header with stats and controls
- [ ] `TrainerTable.tsx` - Poker table with Study button
- [ ] `TrainerActions.tsx` - Action buttons (Fold/Call/Raise)
- [ ] `TrainerFeedback.tsx` - Feedback modal

### ⚠️ Important Notes

1. **Backward Compatibility**: The main `TrainerSimulator.tsx` file remains unchanged and functional
2. **No Breaking Changes**: All exports maintain original interfaces
3. **Pure Functions**: Helper utilities have no dependencies on React state
4. **Type Safety**: All types properly imported from base `types.ts`

### 📊 Impact

**After Phase 1:**
- Folder structure created ✅
- 2 new files with extracted code ✅
- 4 index files for future exports ✅

**After Phase 2:**
- 3 custom hooks extracted ✅
- ~250 lines of state management logic isolated ✅

**After Phase 3:**
- 1 navigation utilities file extracted ✅
- ~450 lines of navigation logic modularized ✅
- 8 reusable navigation functions ✅
- Type-safe interfaces for all functions ✅

**Total Progress:**
- **13 files** created across 3 phases
- **~1,100 lines** extracted and organized
- Original file still unchanged ✅
- Zero compilation errors ✅

**Status:** ✅ Phase 3 Complete - Ready for Phase 4

---

**Last Updated:** November 3, 2025  
**Current Phase:** ✅ Phase 3 Complete  
**Files Created:** 13 total (7 in Phase 1, 3 in Phase 2, 3 in Phase 3)  
**Lines Extracted:** ~1,100 lines organized  
**Refactoring Plan:** See `TRAINERSIMULATOR_REFACTORING_PLAN.md`
