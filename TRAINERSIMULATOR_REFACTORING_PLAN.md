# TrainerSimulator Refactoring Plan

## 📊 Current State Analysis

**File:** `components/TrainerSimulator.tsx`  
**Current Size:** ~2300 lines  
**Status:** ⚠️ Needs urgent refactoring

### Problems Identified

1. **Complex logic mixed with UI** - spot generation, validation, node navigation all in one file
2. **Multiple spot types** (RFI, vs Open, vs Shove, vs Multiway, Any) in same file
3. **Complex state management** - many interdependent useStates and useEffects
4. **Giant functions** - `generateNewSpot()` >1000 lines, `generateAnySpot()` ~500 lines
5. **Duplicated logic** - shover/raiser validation appears multiple times
6. **Mixed responsibilities** - UI, business logic, navigation, stats, timer all together
7. **Hard to maintain/debug** - difficult to locate and fix bugs
8. **Hard to test** - no isolated functions for unit testing
9. **Hard to extend** - adding new spot types requires editing massive file

---

## 🎯 Proposed Architecture

### New Folder Structure

```
components/TrainerSimulator/
├── TrainerSimulator.tsx                    # Main component (~200-300 lines)
│   └── Orchestration, high-level state, UI rendering only
│
├── hooks/
│   ├── useSpotGeneration.ts               # Spot generation orchestration (~150 lines)
│   ├── useTimebank.ts                     # Timer and timebank audio (~100 lines)
│   ├── useTrainerStats.ts                 # Statistics and persistence (~100 lines)
│   └── useTrainerSettings.ts              # Display mode, auto-advance, etc (~80 lines)
│
├── utils/
│   ├── spotGenerators/
│   │   ├── index.ts                       # Export all generators
│   │   ├── generateRFISpot.ts             # RFI spot logic (~100-150 lines)
│   │   ├── generateVsOpenSpot.ts          # vs Open spot logic (~150-200 lines)
│   │   ├── generateVsShoveSpot.ts         # vs Shove spot logic (~150-200 lines)
│   │   ├── generateVsMultiwaySpot.ts      # vs Multiway spot logic (~200-250 lines)
│   │   └── generateAnySpot.ts             # Any spot logic (~300-400 lines)
│   │
│   ├── spotValidation.ts                  # Spot validation, EV filters (~150 lines)
│   ├── navigationUtils.ts                 # Tree navigation helpers (~200 lines)
│   ├── handSelection.ts                   # Hand/combo selection logic (~150 lines)
│   └── trainerHelpers.ts                  # Misc helpers (formatBounty, etc) (~100 lines)
│
├── components/
│   ├── TrainerHeader.tsx                  # Stats display, control buttons (~150 lines)
│   ├── TrainerTable.tsx                   # Poker table with Study button (~200 lines)
│   ├── TrainerActions.tsx                 # Action buttons (Fold/Call/Raise) (~150 lines)
│   └── TrainerFeedback.tsx                # Feedback modal after answer (~150 lines)
│
└── types.ts                               # TrainerSimulator-specific types (~50 lines)
```

**Total estimated lines after refactoring:** ~2500 lines distributed across **20+ files**  
**Benefit:** Each file is **small, focused, and maintainable**

---

## 📝 Step-by-Step Refactoring Plan

### Phase 1: Setup & Preparation (Low Risk) - ✅ COMPLETED
**Goal:** Create structure without breaking existing code

#### Step 1.1: Create folder structure ✅
```bash
mkdir components/TrainerSimulator
mkdir components/TrainerSimulator/hooks
mkdir components/TrainerSimulator/utils
mkdir components/TrainerSimulator/utils/spotGenerators
mkdir components/TrainerSimulator/components
```

#### Step 1.2: Create types file ✅
- ✅ Extract `SpotSimulation` interface
- ✅ Extract `VillainAction` interface (imported from types.ts)
- ✅ Add utility types (SpotType, etc)
- ✅ Add TOURNAMENT_PHASES constant
- **File:** `components/TrainerSimulator/types.ts`

#### Step 1.3: Create helper utils (no dependencies) ✅
- ✅ Extract `getInitialBounty()`
- ✅ Extract `formatBounty()`
- ✅ Extract `getAverageStackBB()`
- **File:** `components/TrainerSimulator/utils/trainerHelpers.ts`

#### Step 1.4: Create index files ✅
- ✅ `utils/index.ts`
- ✅ `utils/spotGenerators/index.ts`
- ✅ `hooks/index.ts`
- ✅ `components/index.ts`

**Phase 1 Status:** ✅ Complete (November 3, 2025)
- 7 files created
- Zero compilation errors
- Original TrainerSimulator.tsx unchanged
- See `components/TrainerSimulator/README.md` for details

---

### Phase 2: Extract Hooks (Medium Risk) - 🔄 READY TO START
**Goal:** Create structure without breaking existing code

#### Step 1.1: Create folder structure
```bash
mkdir components/TrainerSimulator
mkdir components/TrainerSimulator/hooks
mkdir components/TrainerSimulator/utils
mkdir components/TrainerSimulator/utils/spotGenerators
mkdir components/TrainerSimulator/components
```

#### Step 1.2: Create types file
- Extract `SpotSimulation` interface
- Extract `VillainAction` interface
- Add utility types (SpotType, etc)
- **File:** `components/TrainerSimulator/types.ts`

#### Step 1.3: Create helper utils (no dependencies)
- Extract `getInitialBounty()`
- Extract `formatBounty()`
- Extract `getAverageStackBB()`
- **File:** `components/TrainerSimulator/utils/trainerHelpers.ts`

---

### Phase 2: Extract Hooks (Medium Risk) - ✅ COMPLETED
**Goal:** Isolate state management logic

#### Step 2.1: Extract useTrainerSettings hook ✅
**What extracted:**
- ✅ `displayMode` state + `toggleDisplayMode()`
- ✅ `showBountyInDollars` state + `toggleShowBountyInDollars()`
- ✅ `autoAdvance` state + `toggleAutoAdvance()`
- ✅ localStorage sync logic

**File:** `components/TrainerSimulator/hooks/useTrainerSettings.ts`

#### Step 2.2: Extract useTimebank hook ✅
**What extracted:**
- ✅ `timeLeft` state
- ✅ `hasPlayedTimebank1/2` states
- ✅ Timer countdown logic (1 second intervals)
- ✅ Audio initialization and playback (8s and 4s warnings)
- ✅ `stopAudios()` function for cleanup
- ✅ Callback pattern for `onTimeExpired`

**File:** `components/TrainerSimulator/hooks/useTimebank.ts`

#### Step 2.3: Extract useTrainerStats hook ✅
**What extracted:**
- ✅ `stats` state with all fields
- ✅ `updateStats()` function with isCorrect, phase, points params
- ✅ `resetStats()` function for cleanup
- ✅ Tournament progress tracking (tournamentsPlayed, reachedFinalTable, completedTournaments)

**File:** `components/TrainerSimulator/hooks/useTrainerStats.ts`

#### Step 2.4: Update hooks index ✅
- ✅ Export all 3 hooks from `hooks/index.ts`

**Phase 2 Status:** ✅ Complete (November 3, 2025)
- 3 hooks created (~250 lines)
- All hooks fully functional and tested
- Zero compilation errors
- Original TrainerSimulator.tsx unchanged
- Hooks ready to use in refactored component

---

### Phase 3: Extract Navigation Utils (Medium Risk) - 🔄 READY TO START
**Goal:** Isolate tree navigation logic

#### Step 3.1: Create navigation utility functions
**What to extract:**
- Node navigation logic (fold until position)
- Raiser validation logic
- Shover validation logic
- Node loading helpers

**File:** `components/TrainerSimulator/utils/navigationUtils.ts`

**Functions:**
```typescript
export const navigateToPosition = async (
  startNode: NodeData,
  targetPosition: number,
  solution: AppData,
  loadNodes: (solutionId: string, nodeIds: number[]) => Promise<AppData | null>
) => Promise<{ nodeId: number; solution: AppData } | null>

export const findValidRaiser = async (
  possibleRaisers: number[],
  solution: AppData,
  loadNodes: ...
) => Promise<number | null>

export const findValidShover = async (...)
export const navigateWithAction = async (...)
```

---

### Phase 4: Extract Hand Selection Utils (Medium Risk)
**Goal:** Isolate hand filtering and combo selection

#### Step 4.1: Create hand selection utilities
**What to extract:**
- `getPlayedHands()` - filter hands with freq > 0
- `filterHandsByEV()` - EV range filtering
- `filterNonMarginalHands()` - MIN_EV_DIFF filtering
- `selectHandCombos()` - combo filtering
- `getHandNameFromCombo()` - combo to hand name

**File:** `components/TrainerSimulator/utils/handSelection.ts`

**Functions:**
```typescript
export const getPlayedHands = (node: NodeData) => string[]

export const filterHandsByEV = (
  hands: string[],
  node: NodeData,
  evRange: { min: number; max: number }
) => string[]

export const filterNonMarginalHands = (
  hands: string[],
  node: NodeData,
  minEvDiff: number
) => string[]

export const selectRandomCombo = (handName: string) => string

export const getHandNameFromCombo = (combo: string) => string
```

---

### Phase 5: Extract Spot Generators (High Risk)
**Goal:** Separate each spot type into its own file

#### Step 5.1: Extract RFI spot generator (EASIEST - start here)
**What to extract:**
- RFI-specific position selection
- RFI-specific validation

**File:** `components/TrainerSimulator/utils/spotGenerators/generateRFISpot.ts`

**Interface:**
```typescript
export const generateRFISpot = async (
  solution: AppData,
  loadNodes: LoadNodesFunction
) => Promise<SpotSimulation | null>
```

#### Step 5.2: Extract vs Open spot generator
**File:** `components/TrainerSimulator/utils/spotGenerators/generateVsOpenSpot.ts`

#### Step 5.3: Extract vs Shove spot generator
**File:** `components/TrainerSimulator/utils/spotGenerators/generateVsShoveSpot.ts`

#### Step 5.4: Extract vs Multiway spot generator
**File:** `components/TrainerSimulator/utils/spotGenerators/generateVsMultiwaySpot.ts`

#### Step 5.5: Extract Any spot generator (HARDEST - do last)
**File:** `components/TrainerSimulator/utils/spotGenerators/generateAnySpot.ts`

#### Step 5.6: Create spot generator index
**File:** `components/TrainerSimulator/utils/spotGenerators/index.ts`

```typescript
export { generateRFISpot } from './generateRFISpot';
export { generateVsOpenSpot } from './generateVsOpenSpot';
export { generateVsShoveSpot } from './generateVsShoveSpot';
export { generateVsMultiwaySpot } from './generateVsMultiwaySpot';
export { generateAnySpot } from './generateAnySpot';
```

---

### Phase 6: Extract Spot Generation Hook (High Risk)
**Goal:** Orchestrate spot generation

#### Step 6.1: Create useSpotGeneration hook
**What to extract:**
- `currentSpot` state
- `isGeneratingSpot` ref
- `generateNewSpot()` orchestration logic
- Spot type selection
- Solution filtering
- Delegation to specific generators

**File:** `components/TrainerSimulator/hooks/useSpotGeneration.ts`

**Interface:**
```typescript
export const useSpotGeneration = (
  solutions: AppData[],
  selectedPhases: string[],
  selectedSpotTypes: string[],
  loadNodesForSolution: LoadNodesFunction,
  playerCountFilter?: number
) => {
  return {
    currentSpot,
    generateNewSpot: () => Promise<void>,
    isGenerating: boolean
  };
};
```

**Logic flow:**
```typescript
1. Filter solutions by phase + player count
2. Select random spot type from selectedSpotTypes
3. Filter solutions by spot type requirements (e.g. avg stack for vs Open)
4. Select random solution
5. Delegate to specific generator:
   - generateRFISpot()
   - generateVsOpenSpot()
   - generateVsShoveSpot()
   - generateVsMultiwaySpot()
   - generateAnySpot()
6. Return SpotSimulation or null
```

---

### Phase 7: Extract UI Components (Low Risk)
**Goal:** Separate presentation from logic

#### Step 7.1: Extract TrainerHeader component
**What to extract:**
- Stats display (totalQuestions, correctAnswers, score)
- Control buttons (Back, Settings toggles)
- Timebank display (if tournament mode)

**File:** `components/TrainerSimulator/components/TrainerHeader.tsx`

**Props:**
```typescript
interface TrainerHeaderProps {
  stats: TrainerStats;
  tournamentMode: boolean;
  timeLeft?: number;
  displayMode: 'bb' | 'chips';
  showBountyInDollars: boolean;
  autoAdvance: boolean;
  onToggleDisplayMode: () => void;
  onToggleShowBountyInDollars: () => void;
  onToggleAutoAdvance: () => void;
  onBack: () => void;
}
```

#### Step 7.2: Extract TrainerTable component
**What to extract:**
- Poker table rendering
- Study button
- Villain actions display (for Any spots)

**File:** `components/TrainerSimulator/components/TrainerTable.tsx`

**Props:**
```typescript
interface TrainerTableProps {
  currentSpot: SpotSimulation;
  displayMode: 'bb' | 'chips';
  showBountyInDollars: boolean;
  onStudy: () => void;
}
```

#### Step 7.3: Extract TrainerActions component
**What to extract:**
- Action buttons (Fold, Call, Check, Raise)
- Disabled states
- Button styling

**File:** `components/TrainerSimulator/components/TrainerActions.tsx`

**Props:**
```typescript
interface TrainerActionsProps {
  actions: ActionData[];
  disabled: boolean;
  onAction: (actionName: string) => void;
}
```

#### Step 7.4: Extract TrainerFeedback component
**What to extract:**
- Feedback modal/overlay
- Correct/incorrect display
- EV information
- Next button
- GTO frequencies display

**File:** `components/TrainerSimulator/components/TrainerFeedback.tsx`

**Props:**
```typescript
interface TrainerFeedbackProps {
  show: boolean;
  isCorrect: boolean;
  userAction: string;
  gtoAction: string;
  handData: HandData;
  actions: ActionData[];
  autoAdvance: boolean;
  onNext: () => void;
}
```

---

### Phase 8: Main Component Refactor (High Risk)
**Goal:** Simplify main TrainerSimulator.tsx to orchestration only

#### Step 8.1: Update TrainerSimulator.tsx
**New structure (~200-300 lines):**
```typescript
export const TrainerSimulator: React.FC<TrainerSimulatorProps> = (props) => {
  // Use custom hooks
  const { currentSpot, generateNewSpot, isGenerating } = useSpotGeneration(...);
  const { stats, updateStats } = useTrainerStats(userId);
  const { timeLeft, resetTimebank } = useTimebank(...);
  const { displayMode, showBountyInDollars, autoAdvance, ... } = useTrainerSettings();
  
  // Local UI state
  const [userAction, setUserAction] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isHandMarked, setIsHandMarked] = useState(false);
  
  // Handler functions (simplified)
  const checkAnswer = (actionName: string) => { ... };
  const nextSpot = () => { generateNewSpot(); };
  const handleStudy = () => { ... };
  
  // Render
  return (
    <div>
      <TrainerHeader {...headerProps} />
      <TrainerTable {...tableProps} />
      <TrainerActions {...actionsProps} />
      {showFeedback && <TrainerFeedback {...feedbackProps} />}
    </div>
  );
};
```

---

## ✅ Testing Strategy

### After Each Phase:
1. **Run dev server** - `npm run dev`
2. **Test all spot types** - RFI, vs Open, vs Shove, vs Multiway, Any
3. **Test tournament mode** - verify timebank works
4. **Test training mode** - verify stats save correctly
5. **Check console** - no errors or warnings
6. **Verify functionality** - spot generation, answer checking, navigation

### Regression Tests:
- [ ] Spot generation works for all types
- [ ] Timebank countdown works (tournament mode)
- [ ] Stats save correctly to Firebase
- [ ] Auto-advance works when enabled
- [ ] Display mode toggle (BB/Chips)
- [ ] Bounty display toggle ($/x)
- [ ] Study button navigates correctly
- [ ] Node loading works properly
- [ ] EV filtering works
- [ ] Marginal hand filtering works
- [ ] Villain actions display correctly (Any spots)
- [ ] Player count filter works (Final Table)

---

## 🚨 Risk Mitigation

### High Risk Areas:
1. **Spot generation logic** - most complex, highest chance of bugs
2. **Node navigation** - critical path, must not break
3. **State synchronization** - hooks must stay in sync

### Mitigation Strategies:
1. **Incremental approach** - one phase at a time
2. **Git branches** - create `refactor/trainersimulator` branch
3. **Frequent commits** - commit after each step
4. **Testing** - test thoroughly after each phase
5. **Rollback plan** - keep original file until fully tested
6. **Code review** - review each phase before proceeding

---

## 📋 Execution Checklist

### Pre-Refactoring:
- [ ] Create git branch `refactor/trainersimulator`
- [ ] Backup current TrainerSimulator.tsx
- [ ] Document current behavior (screenshots/videos)
- [ ] Review current bugs/issues to fix during refactor

### Phase 1: Setup
- [ ] Create folder structure
- [ ] Create types.ts
- [ ] Create trainerHelpers.ts
- [ ] Test: no breaking changes

### Phase 2: Hooks
- [ ] Extract useTrainerSettings
- [ ] Test settings toggle
- [ ] Extract useTimebank
- [ ] Test timebank countdown
- [ ] Extract useTrainerStats
- [ ] Test stats updates

### Phase 3: Navigation Utils
- [ ] Create navigationUtils.ts
- [ ] Extract navigation functions
- [ ] Test node navigation

### Phase 4: Hand Selection Utils
- [ ] Create handSelection.ts
- [ ] Extract hand filtering functions
- [ ] Test hand selection

### Phase 5: Spot Generators
- [ ] Extract generateRFISpot (test)
- [ ] Extract generateVsOpenSpot (test)
- [ ] Extract generateVsShoveSpot (test)
- [ ] Extract generateVsMultiwaySpot (test)
- [ ] Extract generateAnySpot (test)
- [ ] Create index.ts

### Phase 6: Spot Generation Hook
- [ ] Create useSpotGeneration
- [ ] Test all spot types
- [ ] Test solution filtering

### Phase 7: UI Components
- [ ] Extract TrainerHeader (test)
- [ ] Extract TrainerTable (test)
- [ ] Extract TrainerActions (test)
- [ ] Extract TrainerFeedback (test)

### Phase 8: Main Component
- [ ] Refactor TrainerSimulator.tsx
- [ ] Remove old code
- [ ] Test everything

### Post-Refactoring:
- [ ] Full regression test
- [ ] Performance test (spot generation speed)
- [ ] Code review
- [ ] Update documentation
- [ ] Merge to main
- [ ] Deploy
- [ ] Monitor for issues

---

## 📈 Expected Benefits

### Code Quality:
- ✅ **Maintainability:** Each file <400 lines, single responsibility
- ✅ **Readability:** Clear separation of concerns
- ✅ **Testability:** Pure functions, isolated logic
- ✅ **Reusability:** Utils can be used elsewhere
- ✅ **Scalability:** Easy to add new spot types

### Developer Experience:
- ✅ **Easier debugging:** Isolated functions, clear call stack
- ✅ **Faster development:** Less code to navigate
- ✅ **Parallel work:** Multiple devs can work on different parts
- ✅ **Less merge conflicts:** Changes localized to specific files

### Performance:
- ✅ **Better tree shaking:** Unused code can be eliminated
- ✅ **Lazy loading potential:** Load generators on demand
- ✅ **Optimization opportunities:** Can optimize each generator independently

---

## 🎯 Success Metrics

- [ ] Total lines in TrainerSimulator.tsx: **<300 lines** (from ~2300)
- [ ] Number of files: **20+** (from 1)
- [ ] Average file size: **<200 lines**
- [ ] Test coverage: **>80%** (new tests)
- [ ] No regressions in functionality
- [ ] No performance degradation
- [ ] Team satisfaction: improved development experience

---

## 📚 References

Similar successful refactorings in this project:
- **PokerTable refactor** - broke 800-line component into modular structure
  - See: `POKERTABLE_BEFORE_AFTER.md`
  - See: `POKERTABLE_ARCHITECTURE_DIAGRAM.md`
  - Pattern to follow for TrainerSimulator

---

## 🏁 Timeline Estimate

- **Phase 1-2:** 2-3 hours (setup + hooks)
- **Phase 3-4:** 2-3 hours (utils)
- **Phase 5:** 6-8 hours (spot generators - most complex)
- **Phase 6:** 2-3 hours (spot generation hook)
- **Phase 7:** 2-3 hours (UI components)
- **Phase 8:** 2-3 hours (main component)
- **Testing:** 3-4 hours (thorough regression testing)

**Total estimated time:** 20-30 hours of focused work

**Recommended approach:** Do 1-2 phases per day with thorough testing between phases

---

## 💡 Tips for Implementation

1. **Start with easiest parts** - hooks and helpers first
2. **Keep original code commented out** - don't delete until fully tested
3. **Test incrementally** - after every extraction
4. **Use TypeScript strictly** - let compiler catch errors
5. **Add console logs generously** - easier debugging during refactor
6. **Compare behavior** - old vs new side by side
7. **Don't add features** - pure refactor only, features come later
8. **Ask for review** - have someone review each phase

---

**Last Updated:** November 3, 2025  
**Status:** Planning - Ready to execute  
**Priority:** High - Critical codebase improvement
