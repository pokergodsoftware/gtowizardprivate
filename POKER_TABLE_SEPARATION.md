# Poker Table Component Separation

## ⚠️ CRITICAL: Two Different Poker Tables

This project has **TWO COMPLETELY SEPARATE** poker table implementations that must NEVER be confused:

## 1. Solution Viewer Table (Classic)

**File:** `components/SolutionPokerTable.tsx`  
**Used by:** `components/Sidebar.tsx` (solution viewer)  
**Purpose:** Display poker situations in the main solution viewer

### Characteristics:
- Simple circular player representation
- Traditional bet display with chip icons
- Minimal visual styling
- Classic pot display in center
- No drag-and-drop features
- No advanced badges
- Stateless calculation based on node path
- Original implementation preserved

### Props Interface:
```typescript
{
  settings: SettingsData;
  activePlayerIndex: number;
  bigBlind: number;
  currentNode: NodeData;
  allNodes: Map<number, NodeData>;
  pathNodeIds: number[];
  displayMode: 'bb' | 'chips';
  fileName?: string;
}
```

---

## 2. Trainer Table (Modern)

**Files:** 
- `components/PokerTableVisual.tsx` (wrapper)
- `components/PokerTable/index.tsx` (main component)
- `components/PokerTable/*.tsx` (modular sub-components)

**Used by:** `components/TrainerSimulator.tsx`  
**Purpose:** Training mode with interactive features

### Characteristics:
- Modular component architecture
- Draggable payout panel
- Advanced player badges (raiser, shover, villain actions)
- Tournament-specific features
- Enhanced visual effects
- Different table images (final table vs regular)
- Complex spot context handling
- Uses hooks: `useDraggable`, `usePlayerPositions`

### Props Interface:
```typescript
{
  node: NodeData;
  settings: SettingsData;
  display: DisplaySettings;      // Grouped props
  tournament: TournamentInfo;    // Grouped props
  spotContext: SpotContext;      // Grouped props
  bigBlind: number;
  onDisplayChange?: (setting: keyof DisplaySettings) => void;
}
```

---

## Architecture Rules

### ❌ NEVER DO THIS:
- Import `PokerTable/index` in `Sidebar.tsx`
- Import `SolutionPokerTable` in `TrainerSimulator.tsx`
- Use trainer components in solution viewer
- Use solution components in trainer
- Refactor one thinking it's the other

### ✅ ALWAYS DO THIS:
- Check which file you're editing before making changes
- Read the warning comments at the top of each file
- Test both solution viewer AND trainer after changes
- Keep the two implementations completely independent

---

## Component Usage Map

```
App.tsx
├── Viewer (Solution Viewer)
│   └── Sidebar.tsx
│       └── SolutionPokerTable.tsx ← CLASSIC VERSION
│
└── Trainer
    └── TrainerSimulator.tsx
        └── PokerTableVisual.tsx
            └── PokerTable/index.tsx ← MODERN VERSION
```

---

## History

**2025-11-03:** Issue discovered where `Sidebar.tsx` was accidentally changed to use `PokerTable/index.tsx` (trainer version), breaking the solution viewer table. This caused the solution viewer to display the trainer-style table with drag-and-drop panels and different visual style.

**Resolution:** 
1. Renamed `PokerTable.tsx` → `SolutionPokerTable.tsx`
2. Updated `Sidebar.tsx` to use `SolutionPokerTable`
3. Added warning comments to all files
4. Created this documentation

---

## Testing Checklist

When modifying poker table code:

- [ ] Identify which table you're modifying (solution or trainer)
- [ ] Read warning comments at top of file
- [ ] Make changes only to intended version
- [ ] Test solution viewer: Load a spot, check table appearance
- [ ] Test trainer: Start training mode, check table appearance
- [ ] Verify no visual regressions in either mode
- [ ] Verify payout panel behavior (if applicable)
- [ ] Check console for errors

---

## Visual Differences

| Feature | Solution Table | Trainer Table |
|---------|---------------|---------------|
| Table Image | Single style | Final table / Regular |
| Payout Panel | Modal only | Draggable panel |
| Player Badges | None | Raiser, Shover, Villain |
| Tournament Name | No | Yes |
| Chip Display | Simple circle | ChipStack component |
| Pot Display | Text only | PotDisplay component |
| Architecture | Monolithic | Modular components |
| Interactivity | Static | Dynamic |

---

## File Protection

All protected files have warning comments at the top:

```typescript
/**
 * ComponentName - SPECIFIC FOR [SOLUTION|TRAINER] ONLY
 * 
 * ⚠️ WARNING: DO NOT use this in [other context]
 * ⚠️ [Context] uses: [correct file path]
 */
```

If you see these comments, **STOP** and verify you're editing the right file.

---

## Emergency Recovery

If tables get mixed up again:

1. Check git history for `SolutionPokerTable.tsx`
2. Restore from commit before changes
3. Verify `Sidebar.tsx` imports from `./SolutionPokerTable.tsx`
4. Test both solution viewer and trainer
5. Read this document again to understand separation

---

**Last Updated:** 2025-11-03  
**Status:** ✅ Separated and documented
