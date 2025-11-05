# Combo Selection Logic Update

## Overview
Updated combo selection logic to include both positive and negative EV ranges, with different behavior based on number of available actions.

## New Logic

### 2 Actions Available
When hero has exactly 2 actions (e.g., Fold/Raise, Call/Fold):
- **Filter**: Check if ANY action's EV is in valid range
- **Positive Range**: +0.07 to +1.00
- **Negative Range**: -1.00 to -0.07
- **Pass if**: At least one action has EV in either range
- **Fail if**: All EVs are between -0.06 and +0.06 (too marginal)

**Examples:**
- ✅ **PASS**: Fold EV: -0.15, Raise EV: 0.50 (Raise in positive range)
- ✅ **PASS**: Fold EV: 0.10, Call EV: -0.20 (Call in negative range)
- ✅ **PASS**: Fold EV: -0.80, Call EV: -0.50 (both in negative range)
- ❌ **FAIL**: Fold EV: 0.05, Raise EV: -0.03 (both too marginal)
- ❌ **FAIL**: Fold EV: 2.50, Raise EV: 1.80 (both too high)

### 3+ Actions Available
When hero has 3 or more actions (e.g., Fold/Call/Raise, multiple raise sizes):
- **Filter**: Find the MOST USED action (highest frequency)
- **Check**: Only that action's EV
- **Positive Range**: +0.07 to +1.00
- **Negative Range**: -1.00 to -0.07
- **Pass if**: Most used action's EV is in either range
- **Fail if**: Most used action's EV is outside both ranges

**Examples:**
- ✅ **PASS**: Fold 50%, Call 30%, Raise 20% → Fold EV: -0.50 (most used, in negative range)
- ✅ **PASS**: Fold 20%, Call 10%, Raise 70% → Raise EV: 0.80 (most used, in positive range)
- ✅ **PASS**: Fold 40%, Call 35%, Raise 25% → Fold EV: -0.15 (most used, in negative range)
- ❌ **FAIL**: Fold 60%, Call 25%, Raise 15% → Fold EV: 0.05 (most used, too marginal)
- ❌ **FAIL**: Fold 10%, Call 5%, Raise 85% → Raise EV: 2.20 (most used, too high)

## Why This Logic?

### Including Negative EVs
- **Real poker situations**: Many spots involve choosing between bad options
- **Training value**: Learning which "bad" action is less bad is important
- **Example**: Bubble spots where all actions are negative EV, but folding is less bad than calling

### Different Logic for 2 vs 3+ Actions
- **2 Actions**: Simpler decision tree, checking any action in range provides variety
- **3+ Actions**: More complex, focusing on most used action ensures training on relevant decisions
- **Prevents noise**: Ignoring rarely used actions (5% frequency) that might have extreme EVs

### EV Range Boundaries
- **Positive**: 0.07 to 1.00
  - Above 0.07: Significant enough to matter
  - Below 1.00: Not trivially obvious
  
- **Negative**: -1.00 to -0.07
  - Below -0.07: Bad enough to be interesting
  - Above -1.00: Not catastrophically bad

- **Excluded**: -0.06 to +0.06
  - Too marginal to provide meaningful training
  - Decisions where all options are nearly identical in EV

## Code Changes

### 1. `comboSelection.ts`

**Updated Configuration:**
```typescript
export interface ComboSelectionConfig {
    minPositiveEV?: number;  // Default: 0.07
    maxPositiveEV?: number;  // Default: 1.00
    minNegativeEV?: number;  // Default: -1.00
    maxNegativeEV?: number;  // Default: -0.07
}
```

**New `isInterestingCombo()` Logic:**
- Checks number of actions in node
- For 2 actions: Loops through all EVs, checks if any in range
- For 3+ actions: Finds most used action index, checks only that EV
- Returns true if criteria met, false otherwise

**Enhanced Diagnostics:**
```typescript
getComboSelectionDiagnostics() now returns:
- numActions: How many actions available
- allEVs: Array of all EVs
- mostUsedAction: { action, freq, ev } for 3+ actions
- reason: Human-readable explanation of pass/fail
```

### 2. `useSpotGeneration.ts`

**Updated `selectRandomHand()` call:**
```typescript
selectInterestingCombo(randomHandName, handCombos, node, {
    minPositiveEV: 0.07,
    maxPositiveEV: 1.00,
    minNegativeEV: -1.00,
    maxNegativeEV: -0.07
});
```

**Enhanced Console Logs:**
- For 2 actions: Shows all EVs with range check
- For 3+ actions: Shows most used action, frequency, and EV
- Clear status: ✅ In range or ⚠️ Outside range (fallback)

## Testing

### Test Cases for 2 Actions

| Fold EV | Raise EV | Expected | Reason |
|---------|----------|----------|--------|
| -0.15 | 0.50 | ✅ Pass | Raise in positive range |
| 0.10 | -0.20 | ✅ Pass | Both in valid ranges |
| -0.80 | -0.50 | ✅ Pass | Both in negative range |
| 0.05 | -0.03 | ❌ Fail | Both too marginal |
| 2.50 | 1.80 | ❌ Fail | Both too high |
| -1.50 | -1.20 | ❌ Fail | Both too negative |

### Test Cases for 3+ Actions

| Most Used | Frequency | EV | Expected | Reason |
|-----------|-----------|-----|----------|--------|
| Fold | 50% | -0.50 | ✅ Pass | Negative range |
| Raise | 70% | 0.80 | ✅ Pass | Positive range |
| Fold | 60% | 0.05 | ❌ Fail | Too marginal |
| Raise | 85% | 2.20 | ❌ Fail | Too high |
| Call | 40% | -1.50 | ❌ Fail | Too negative |

## Console Output Examples

### 2 Actions Example:
```
✅ Selected combo: AhKd
📊 2 Actions - All EVs: [-0.15, 0.50]
   Range: Positive (+0.07 to +1.00) OR Negative (-1.00 to -0.07)
   Status: ✅ In range
```

### 3+ Actions Example:
```
✅ Selected combo: 7s6c
📊 3+ Actions - Most used: Raise (70.0%)
   EV of most used: 0.80
   Range: Positive (+0.07 to +1.00) OR Negative (-1.00 to -0.07)
   Status: ✅ In range
```

### Fallback Example:
```
✅ Selected combo: Kh8h
📊 2 Actions - All EVs: [0.05, -0.03]
   Range: Positive (+0.07 to +1.00) OR Negative (-1.00 to -0.07)
   Status: ⚠️ Outside range (fallback)
```

## Benefits

1. **More Training Spots**: Including negative EVs increases available combos
2. **Realistic Scenarios**: Players face negative EV decisions regularly (bubble, ICM pressure)
3. **Better Learning**: Understanding "less bad" vs "more bad" is crucial skill
4. **Focused Training**: For complex spots (3+ actions), trains on actually used actions
5. **Clear Feedback**: Enhanced logs make debugging easier

## Migration Notes

- **Backward Compatible**: Existing code continues to work
- **Fallback Behavior**: If no combos pass filter, random combo still selected
- **No Breaking Changes**: API signature unchanged, only internal logic updated
- **Performance**: Minimal impact, same O(n) complexity

## Future Enhancements

- Add configurable EV ranges via UI settings
- Track statistics on how often fallback is used
- Add per-spot-type EV range customization
- Visual indicator in UI showing if combo is in desired range
