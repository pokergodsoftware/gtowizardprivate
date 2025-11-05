# Loading Transition Feature

## Overview
Added a smooth loading popup that appears during spot transitions in both Tournament Mode and Practice Mode.

## What Was Changed

### 1. New Component: `LoadingTransition.tsx`
**Location**: `components/TrainerSimulator/components/LoadingTransition.tsx`

**Features**:
- Animated spinning poker chip icon
- Loading text with contextual message
- Animated dots for visual feedback
- Backdrop blur effect for better focus
- Professional styling matching app theme

**Design Details**:
- Fixed overlay with z-index 50 (appears above everything)
- Black backdrop with 60% opacity + blur
- Cyan-themed poker chip with spade symbol
- Smooth bounce animations on loading dots
- Responsive and centered layout

### 2. Updated TrainerSimulator
**Location**: `components/TrainerSimulator.tsx`

**Changes**:
- Added `isLoadingNextHand` state to control loading visibility
- Modified `nextSpot()` to be async and show loading during transitions
- Added 100ms delay before generation to ensure smooth loading appearance
- Hides loading after new spot is fully generated
- Integrated `LoadingTransition` component in render tree

**Behavior**:
1. User clicks "Next Hand" button → Loading appears immediately
2. Auto-advance triggers → Loading shows before next spot
3. New spot generates (async operation)
4. Loading disappears when spot is ready

### 3. Updated Component Index
**Location**: `components/TrainerSimulator/components/index.ts`

Added export for `LoadingTransition` component.

## How It Works

### Flow Diagram
```
User Action (Next Hand / Auto-advance)
          ↓
    setIsLoadingNextHand(true)
          ↓
    100ms delay (smooth transition)
          ↓
    Clear previous spot state
          ↓
    await generateNewSpot() ← Can take time
          ↓
    setIsLoadingNextHand(false)
          ↓
    New spot ready to play
```

### Code Flow
```typescript
const nextSpot = async () => {
    // 1. Show loading immediately
    setIsLoadingNextHand(true);
    
    // 2. Small delay for smooth appearance
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 3. Clear old spot data
    setUserAction(null);
    setShowFeedback(false);
    // ... more cleanup
    
    // 4. Generate new spot (async - can take time)
    await generateNewSpot();
    
    // 5. Hide loading when ready
    setIsLoadingNextHand(false);
};
```

## User Experience Benefits

1. **Visual Feedback**: Users know the app is working, not frozen
2. **Smooth Transitions**: No abrupt jumps between spots
3. **Professional Feel**: Polished loading animation with poker theme
4. **Consistent UX**: Works identically in both modes (Tournament/Practice)
5. **No Blank Screens**: Loading covers the transition period

## Technical Notes

- Loading uses `fixed` positioning to overlay entire screen
- `z-index: 50` ensures it appears above all other content
- Component is conditionally rendered based on `isLoadingNextHand` state
- No performance impact when hidden (React removes from DOM)
- Async/await ensures loading shows for entire generation process

## Testing Checklist

- [x] Loading appears when clicking "Next Hand" button
- [x] Loading appears during auto-advance (both modes)
- [x] Loading hides when new spot is ready
- [x] Animation is smooth and professional
- [x] Works in Tournament Mode
- [x] Works in Practice Mode
- [x] No console errors
- [x] Proper TypeScript typing

## Future Enhancements (Optional)

- Add progress percentage if generation is slow
- Custom messages based on spot type
- Sound effect when loading completes
- Fade in/out animations for smoother transitions
- Keyboard shortcut hint during loading
