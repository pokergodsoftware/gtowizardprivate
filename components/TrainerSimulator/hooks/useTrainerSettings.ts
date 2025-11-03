/**
 * useTrainerSettings Hook
 * 
 * Manages trainer display settings with localStorage persistence.
 * Extracted from TrainerSimulator.tsx during Phase 2 refactoring.
 */

import { useState } from 'react';

export interface TrainerSettings {
    displayMode: 'bb' | 'chips';
    showBountyInDollars: boolean;
    autoAdvance: boolean;
}

export interface UseTrainerSettingsReturn {
    displayMode: 'bb' | 'chips';
    toggleDisplayMode: () => void;
    showBountyInDollars: boolean;
    toggleShowBountyInDollars: () => void;
    autoAdvance: boolean;
    toggleAutoAdvance: () => void;
}

/**
 * Custom hook for managing trainer settings
 * All settings are persisted to localStorage
 */
export const useTrainerSettings = (): UseTrainerSettingsReturn => {
    // Display mode: BB or Chips
    const [displayMode, setDisplayMode] = useState<'bb' | 'chips'>('bb');
    
    // Bounty display: $ (dollars) or x (multiplier)
    const [showBountyInDollars, setShowBountyInDollars] = useState(() => {
        // Default: true for first time users
        const stored = localStorage.getItem('trainer_show_bounty_in_dollars');
        return stored ? stored === 'true' : true;
    });
    
    // Auto-advance to next spot after answering
    const [autoAdvance, setAutoAdvance] = useState(() => {
        const stored = localStorage.getItem('trainer_auto_advance');
        return stored ? stored === 'true' : false;
    });

    // Toggle display mode between BB and Chips
    const toggleDisplayMode = () => {
        setDisplayMode(prev => prev === 'bb' ? 'chips' : 'bb');
    };
    
    // Toggle bounty display between $ and x
    const toggleShowBountyInDollars = () => {
        setShowBountyInDollars(prev => {
            localStorage.setItem('trainer_show_bounty_in_dollars', (!prev).toString());
            return !prev;
        });
    };

    // Toggle auto-advance setting
    const toggleAutoAdvance = () => {
        setAutoAdvance(prev => {
            localStorage.setItem('trainer_auto_advance', (!prev).toString());
            return !prev;
        });
    };

    return {
        displayMode,
        toggleDisplayMode,
        showBountyInDollars,
        toggleShowBountyInDollars,
        autoAdvance,
        toggleAutoAdvance
    };
};
