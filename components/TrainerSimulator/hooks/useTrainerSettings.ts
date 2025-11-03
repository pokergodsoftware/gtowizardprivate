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

interface UseTrainerSettingsProps {
    tournamentMode?: boolean;
}

/**
 * Custom hook for managing trainer settings
 * All settings are persisted to localStorage
 * 
 * Default values:
 * - displayMode: 'bb' (Show in big blinds)
 * - showBountyInDollars: true (Show bounty as $)
 * - autoAdvance: true in tournament mode, false in training mode
 */
export const useTrainerSettings = ({ tournamentMode = false }: UseTrainerSettingsProps = {}): UseTrainerSettingsReturn => {
    // Display mode: BB or Chips - DEFAULT: BB
    const [displayMode, setDisplayMode] = useState<'bb' | 'chips'>(() => {
        const stored = localStorage.getItem('trainer_display_mode');
        return (stored === 'bb' || stored === 'chips') ? stored : 'bb';
    });
    
    // Bounty display: $ (dollars) or x (multiplier) - DEFAULT: $
    const [showBountyInDollars, setShowBountyInDollars] = useState(() => {
        const stored = localStorage.getItem('trainer_show_bounty_in_dollars');
        return stored ? stored === 'true' : true;
    });
    
    // Auto-advance to next spot after answering
    // DEFAULT: ON in tournament mode, OFF in training mode
    const [autoAdvance, setAutoAdvance] = useState(() => {
        const stored = localStorage.getItem('trainer_auto_advance');
        if (stored !== null) {
            return stored === 'true';
        }
        // Default based on mode
        return tournamentMode;
    });

    // Toggle display mode between BB and Chips
    const toggleDisplayMode = () => {
        setDisplayMode(prev => {
            const newMode = prev === 'bb' ? 'chips' : 'bb';
            localStorage.setItem('trainer_display_mode', newMode);
            return newMode;
        });
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
