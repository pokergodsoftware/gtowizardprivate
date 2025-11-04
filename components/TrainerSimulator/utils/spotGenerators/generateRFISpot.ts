/**
 * RFI (Raise First In) Spot Generator
 * 
 * Generates training spots where the hero is the first player to enter the pot
 * (before the flop, no one has called or raised yet).
 * 
 * Part of TrainerSimulator refactoring - Phase 5
 */

import type { AppData } from '../../../../types';

/**
 * Result of RFI spot generation
 */
export interface RFISpotResult {
    /** Hero's position at the table (0 to numPlayers-1) */
    heroPosition: number;
    /** Total number of players at the table */
    numPlayers: number;
    /** Position of the BB player */
    bbPosition: number;
}

/**
 * Generates an RFI (Raise First In) spot
 * 
 * RFI spots are the simplest type - the hero is first to act and opens the pot.
 * The hero can be any position EXCEPT Big Blind (BB always acts last preflop).
 * 
 * @param solution - The poker solution to generate spot from
 * @returns RFI spot configuration
 * 
 * @example
 * const rfiSpot = generateRFISpot(solution);
 * console.log(`Hero in position ${rfiSpot.heroPosition} opens first`);
 */
export function generateRFISpot(solution: AppData): RFISpotResult {
    const numPlayers = solution.settings.handdata.stacks.length;
    const bbPosition = numPlayers - 1; // BB is always last position
    
    // Select random position EXCEPT BB
    // BB cannot RFI (everyone acts before BB preflop)
    let heroPosition: number;
    do {
        heroPosition = Math.floor(Math.random() * numPlayers);
    } while (heroPosition === bbPosition);
    
    return {
        heroPosition,
        numPlayers,
        bbPosition
    };
}

/**
 * Validates if a solution is suitable for RFI spot generation
 * 
 * RFI spots require:
 * - At least 2 players (to have meaningful decision)
 * - Node 0 must exist (starting position)
 * 
 * @param solution - Solution to validate
 * @returns true if solution can generate RFI spots
 * 
 * @example
 * if (isValidRFISolution(solution)) {
 *   const spot = generateRFISpot(solution);
 * }
 */
export function isValidRFISolution(solution: AppData): boolean {
    // Must have at least 2 players
    if (!solution.settings?.handdata?.stacks || solution.settings.handdata.stacks.length < 2) {
        return false;
    }
    
    // Must have node 0
    if (!solution.nodes.has(0)) {
        return false;
    }
    
    return true;
}

/**
 * Gets all valid RFI positions for a given number of players
 * 
 * @param numPlayers - Number of players at the table
 * @returns Array of valid RFI positions (all except BB)
 * 
 * @example
 * const validPositions = getValidRFIPositions(6);
 * // Returns [0, 1, 2, 3, 4] (positions 0-4, excluding BB at position 5)
 */
export function getValidRFIPositions(numPlayers: number): number[] {
    const bbPosition = numPlayers - 1;
    const positions: number[] = [];
    
    for (let i = 0; i < numPlayers; i++) {
        if (i !== bbPosition) {
            positions.push(i);
        }
    }
    
    return positions;
}

/**
 * Gets position name for logging/debugging
 * 
 * @param position - Position index (0-based)
 * @param numPlayers - Total number of players
 * @returns Human-readable position name
 * 
 * @example
 * getPositionName(5, 6) // Returns "BB" (6-handed)
 * getPositionName(4, 6) // Returns "SB" (6-handed)
 * getPositionName(3, 6) // Returns "BTN" (6-handed)
 */
export function getPositionName(position: number, numPlayers: number): string {
    const bbPosition = numPlayers - 1;
    const sbPosition = numPlayers === 2 ? 0 : numPlayers - 2;
    const btnPosition = numPlayers === 2 ? 0 : numPlayers - 3;
    const coPosition = numPlayers >= 6 ? numPlayers - 4 : -1;
    const hiJackPosition = numPlayers >= 7 ? numPlayers - 5 : -1;
    
    if (position === bbPosition) return 'BB';
    if (position === sbPosition) return 'SB';
    if (position === btnPosition) return 'BTN';
    if (position === coPosition) return 'CO';
    if (position === hiJackPosition) return 'HJ';
    
    // For other positions (UTG, UTG+1, etc)
    return `UTG${position > 0 ? '+' + position : ''}`;
}
