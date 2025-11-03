/**
 * Usage Example for TrainerSimulator Hooks
 * 
 * This file demonstrates how to use the extracted hooks in the refactored TrainerSimulator.
 * DO NOT import this file in production code - it's for reference only.
 */

import React from 'react';
import { useTrainerSettings, useTimebank, useTrainerStats } from './hooks';
import type { SpotSimulation } from './types.ts';

// Example component showing hook usage
export const TrainerSimulatorExample: React.FC = () => {
    // Example state (would come from parent component)
    const [currentSpot, setCurrentSpot] = React.useState<SpotSimulation | null>(null);
    const [showFeedback, setShowFeedback] = React.useState(false);
    const tournamentMode = true;
    const userId = 'example-user-id';

    // ========================================
    // 1. useTrainerSettings Hook
    // ========================================
    const {
        displayMode,           // 'bb' | 'chips'
        toggleDisplayMode,     // () => void
        showBountyInDollars,   // boolean
        toggleShowBountyInDollars, // () => void
        autoAdvance,           // boolean
        toggleAutoAdvance      // () => void
    } = useTrainerSettings();

    // Usage example:
    // <button onClick={toggleDisplayMode}>
    //   Display: {displayMode}
    // </button>

    // ========================================
    // 2. useTrainerStats Hook
    // ========================================
    const {
        stats,        // { totalQuestions, correctAnswers, score, ... }
        updateStats,  // (isCorrect, phase, points) => void
        resetStats    // () => void
    } = useTrainerStats();

    // Usage example:
    // When user answers:
    const handleAnswer = (isCorrect: boolean) => {
        const phase = currentSpot?.solution.tournamentPhase || 'Unknown';
        const points = isCorrect ? 100 : 0;
        updateStats(isCorrect, phase, points);
    };

    // Display stats:
    // <div>
    //   Questions: {stats.totalQuestions}
    //   Correct: {stats.correctAnswers}
    //   Score: {stats.score}
    // </div>

    // ========================================
    // 3. useTimebank Hook
    // ========================================
    const handleTimeExpired = () => {
        console.log('Time expired! Auto-folding...');
        // Handle timeout logic here
        setShowFeedback(true);
        // ... fold logic
    };

    const {
        timeLeft,    // number (seconds remaining)
        stopAudios   // () => void (stop audio playback)
    } = useTimebank({
        tournamentMode,
        currentSpot,
        showFeedback,
        onTimeExpired: handleTimeExpired
    });

    // Usage example:
    // {tournamentMode && (
    //   <div className="timebank">
    //     Time: {timeLeft}s
    //   </div>
    // )}

    // Stop audios when user clicks action:
    const handleUserAction = (action: string) => {
        stopAudios(); // Stop timebank sounds
        // ... process action
    };

    // ========================================
    // Render Example
    // ========================================
    return (
        <div>
            {/* Settings Controls */}
            <div className="settings">
                <button onClick={toggleDisplayMode}>
                    Display: {displayMode}
                </button>
                <button onClick={toggleShowBountyInDollars}>
                    Bounty: {showBountyInDollars ? '$' : 'x'}
                </button>
                <button onClick={toggleAutoAdvance}>
                    Auto-advance: {autoAdvance ? 'ON' : 'OFF'}
                </button>
            </div>

            {/* Stats Display */}
            <div className="stats">
                <span>Questions: {stats.totalQuestions}</span>
                <span>Correct: {stats.correctAnswers}</span>
                <span>Score: {stats.score}</span>
            </div>

            {/* Timebank Display */}
            {tournamentMode && (
                <div className="timebank">
                    ⏱️ Time: {timeLeft}s
                </div>
            )}

            {/* Action Buttons */}
            <div className="actions">
                <button onClick={() => handleUserAction('Fold')}>
                    Fold
                </button>
                <button onClick={() => handleUserAction('Call')}>
                    Call
                </button>
            </div>
        </div>
    );
};

// ========================================
// Key Benefits of Using These Hooks:
// ========================================
//
// 1. **Separation of Concerns**
//    - State management isolated from UI logic
//    - Each hook has single responsibility
//
// 2. **Reusability**
//    - Hooks can be used in other components
//    - Easy to test in isolation
//
// 3. **Maintainability**
//    - Changes to state logic don't affect UI
//    - Clear interfaces (props/returns)
//
// 4. **Testability**
//    - Can mock hooks in tests
//    - Pure functions easy to unit test
//
// 5. **Type Safety**
//    - Full TypeScript support
//    - Autocomplete and error checking
//
// ========================================
