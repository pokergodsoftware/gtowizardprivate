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
 * Represents a simulated poker spot for training
 */
export interface SpotSimulation {
    solution: AppData;
    nodeId: number;
    playerPosition: number;
    playerHand: string; // Combo específico (ex: "AhKd")
    playerHandName: string; // Nome da mão (ex: "AKo")
    raiserPosition?: number; // Posição do jogador que deu raise (para vs Open)
    shoverPositions?: number[]; // Posições dos jogadores que deram shove (para vs Multiway shove)
    spotType: string; // Tipo de spot: RFI, vs Open, Any, etc
    villainActions?: VillainAction[]; // Histórico de ações dos vilões (para tipo Any)
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
