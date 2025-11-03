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

#### 4. Created Index Files
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

### 🔄 Next Steps

**Phase 2: Extract Hooks** (Ready to start)
- [ ] `useTrainerSettings.ts` - Display mode, bounty display, auto-advance
- [ ] `useTimebank.ts` - Timer and timebank audio logic
- [ ] `useTrainerStats.ts` - Statistics tracking and persistence

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

**Before Phase 1:**
- 1 monolithic file: `TrainerSimulator.tsx` (~2300 lines)

**After Phase 1:**
- Folder structure created ✅
- 2 new files with extracted code ✅
- 4 index files for future exports ✅
- Original file unchanged ✅
- Zero compilation errors ✅

**Status:** ✅ Phase 1 Complete - Ready for Phase 2

---

**Last Updated:** November 3, 2025  
**Refactoring Plan:** See `TRAINERSIMULATOR_REFACTORING_PLAN.md`
