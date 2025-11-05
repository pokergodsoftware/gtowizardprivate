/**
 * TrainerSimulator Types
 * 
 * Type definitions specific to the Trainer Simulator component.
 * Extracted from TrainerSimulator.tsx during Phase 1 refactoring.
 */

import type { AppData, VillainAction } from '../../types.ts';

// Re-export VillainAction for easier imports
export type { VillainAction };

/**
 * Represents a single action in the hand history
 */
export interface HandHistoryAction {
    position: number;           // Player position (0-8)
    playerName: string;         // Position name (BTN, SB, BB, etc)
    action: string;             // Action type (Fold, Call, Raise 2.5BB, Allin, etc)
    amount?: number;            // Bet amount in chips (if applicable)
    amountBB?: number;          // Bet amount in big blinds (if applicable)
    street: 'Preflop' | 'Flop' | 'Turn' | 'River';
    timestamp?: number;         // Optional timestamp for animation
}

/**
 * Complete hand history data
 */
export interface HandHistoryData {
    actions: HandHistoryAction[];
    currentStreet: 'Preflop' | 'Flop' | 'Turn' | 'River';
}

/**
 * Represents a simulated poker spot for training
 */
export interface SpotSimulation {
    solution: AppData;
    nodeId: number;
    playerPosition: number;
    playerHand: string; // Specific combo (e.g., "AhKd")
    playerHandName: string; // Hand name (e.g., "AKo")
    raiserPosition?: number; // Position of the player who raised (for 'vs Open')
    shoverPositions?: number[]; // Positions of players who shoved (for 'vs Multiway shove')
    spotType: string; // Spot type: RFI, vs Open, Any, etc.
    villainActions?: VillainAction[]; // Villain actions history (for 'Any' spot type)
}

/**
 * Types of spots available for training
 */
export type SpotType = 
    | 'RFI'           // Raise First In
    | 'vs Open'       // Against a raise
    | 'vs Shove'      // Against an all-in
    | 'vs Multiway'   // Multi-way pot
    | 'Any';          // Any random spot

/**
 * Tournament phases available for filtering
 */
export const TOURNAMENT_PHASES = [
    '100~60% left',
    '60~40% left',
    '40~20% left',
    'Near bubble',
    'After bubble',
    '3 tables',
    '2 tables',
    'Final table'
] as const;

export type TournamentPhase = typeof TOURNAMENT_PHASES[number];

/**
 * User statistics for trainer
 */
export interface TrainerStats {
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    tournamentsPlayed: number;
    reachedFinalTable: number;
    completedTournaments: number;
}

/**
 * Display settings for trainer
 */
export interface TrainerDisplaySettings {
    displayMode: 'bb' | 'chips';
    showBountyInDollars: boolean;
    autoAdvance: boolean;
}
