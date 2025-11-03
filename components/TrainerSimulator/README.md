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

#### 4. Extracted Hooks (`hooks/`)
- ✅ `useTrainerSettings.ts` - Display mode, bounty display, auto-advance with localStorage
- ✅ `useTimebank.ts` - Timer countdown with audio alerts (8s, 4s warnings)
- ✅ `useTrainerStats.ts` - Statistics tracking and updates

#### 5. Created Index Files
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
import { getInitialBounty, formatBounty, getAverageStackBB } from './TrainerSimulator/utils';
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

**Phase 3: Extract Spot Generators** (Ready to start)
- [ ] `generateRFISpot.ts` - RFI spot generation
- [ ] `generateVsOpenSpot.ts` - vs Open spot generation
- [ ] `generateVsShoveSpot.ts` - vs Shove spot generation
- [ ] `generateVsMultiwaySpot.ts` - vs Multiway spot generation
- [ ] `generateAnySpot.ts` - Any spot generation

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
- Original file unchanged ✅
- Zero compilation errors ✅

**After Phase 2:**
- 3 custom hooks extracted ✅
- ~250 lines of state management logic isolated ✅
- Hooks fully functional and reusable ✅
- Zero compilation errors ✅
- Original file still unchanged ✅

**Status:** ✅ Phase 2 Complete - Ready for Phase 3

---

**Last Updated:** November 3, 2025  
**Current Phase:** ✅ Phase 2 Complete  
**Files Created:** 10 total (7 in Phase 1, 3 in Phase 2)  
**Lines Extracted:** ~450 lines organized  
**Refactoring Plan:** See `TRAINERSIMULATOR_REFACTORING_PLAN.md`
