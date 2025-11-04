/**
 * vs Open Spot Generator
 * 
 * Generates training spots where a player opens with a 2BB raise
 * and the hero must decide how to respond.
 * 
 * Part of TrainerSimulator refactoring - Phase 5
 */

import type { AppData, NodeData } from '../../../../types';
import { loadNodeIfNeeded, foldUntilPosition } from '../navigationUtils';

/**
 * Configuration for vs Open spot generation
 */
export interface VsOpenConfig {
    /** The poker solution */
    solution: AppData;
    /** Function to load nodes on demand */
    loadNodes: (solutionId: string, nodeIds: number[]) => Promise<AppData | null>;
    /** Original solution ID for node loading */
    solutionId: string;
}

/**
 * Result of vs Open spot generation
 */
export interface VsOpenSpotResult {
    /** Hero's position at the table */
    heroPosition: number;
    /** Position of the player who raised (opener) */
    raiserPosition: number;
    /** Updated solution with loaded nodes */
    solution: AppData;
    /** Success flag */
    success: boolean;
    /** Error message if failed */
    error?: string;
}

/**
 * Generates a vs Open spot
 * 
 * In "vs Open" spots:
 * 1. A player opens with a 2BB raise
 * 2. Everyone between opener and hero folds
 * 3. Hero must decide: Fold, Call, or 3-Bet
 * 
 * Requirements:
 * - Hero cannot be position 0 (someone must open before hero)
 * - At least one position before hero must have valid 2BB raise action
 * 
 * @param config - Configuration object
 * @returns vs Open spot result
 * 
 * @example
 * const result = await generateVsOpenSpot({
 *   solution,
 *   loadNodes,
 *   solutionId: solution.id
 * });
 * 
 * if (result.success) {
 *   console.log(`Hero at ${result.heroPosition} facing raise from ${result.raiserPosition}`);
 * }
 */
export async function generateVsOpenSpot(
    config: VsOpenConfig
): Promise<VsOpenSpotResult> {
    const { solution, loadNodes, solutionId } = config;

    const numPlayers = solution.settings.handdata.stacks.length;
    const blinds = solution.settings.handdata.blinds;
    const bigBlind = Math.max(blinds[0], blinds[1]);
    
    // Hero must be position 1 to BB (cannot be position 0 - someone must open first)
    const heroPosition = Math.floor(Math.random() * (numPlayers - 1)) + 1;

    // List all positions that can open (all before hero)
    const possibleRaisers = Array.from({ length: heroPosition }, (_, i) => i);

    // Try to find a valid raiser (shuffle to add randomness)
    const shuffledRaisers = possibleRaisers.sort(() => Math.random() - 0.5);
    
    for (const potentialRaiser of shuffledRaisers) {

        // Navigate to this position
        const navResult = await foldUntilPosition(
            0, // start from node 0
            potentialRaiser,
            solution,
            solutionId,
            loadNodes
        );
        
        if (!navResult) {

            continue;
        }
        
        const updatedSolution = navResult.solution;
        const checkNode = updatedSolution.nodes.get(navResult.nodeId);
        
        if (!checkNode) {

            continue;
        }
        
        // Check if this position has a 2BB raise action
        const raiseActionIndex = checkNode.actions.findIndex(a => {
            if (a.type !== 'R') return false;
            const raiseBB = a.amount / bigBlind;
            const isRaise2BB = Math.abs(raiseBB - 2.0) < 0.1; // Tolerance of 0.1 BB

            return isRaise2BB;
        });
        
        if (raiseActionIndex < 0) {

            continue;
        }
        
        // Check if ANY hand has frequency > 0 for this raise action
        const allHands = Object.keys(checkNode.hands);
        let hasFrequency = false;
        let totalFreq = 0;
        
        for (const handName of allHands) {
            const handData = checkNode.hands[handName];
            if (handData && handData.played[raiseActionIndex] > 0) {
                hasFrequency = true;
                totalFreq += handData.played[raiseActionIndex];
            }
        }
        
        if (!hasFrequency) {

            continue;
        }

        return {
            heroPosition,
            raiserPosition: potentialRaiser,
            solution: updatedSolution,
            success: true
        };
    }
    
    // No valid raiser found

    return {
        heroPosition,
        raiserPosition: -1,
        solution,
        success: false,
        error: 'No valid raiser found'
    };
}

/**
 * Validates if a solution is suitable for vs Open spot generation
 * 
 * Requirements:
 * - Average stack >= 10 BB (need enough chips for 3-betting)
 * - At least 3 players (opener, hero, and at least one other)
 * 
 * @param solution - Solution to validate
 * @returns true if solution can generate vs Open spots
 * 
 * @example
 * if (isValidVsOpenSolution(solution)) {
 *   const spot = await generateVsOpenSpot(config);
 * }
 */
export function isValidVsOpenSolution(solution: AppData): boolean {
    // Need at least 3 players (opener, hero, someone else)
    if (!solution.settings?.handdata?.stacks || solution.settings.handdata.stacks.length < 3) {
        return false;
    }
    
    // Calculate average stack in BB
    const stacks = solution.settings.handdata.stacks;
    const blinds = solution.settings.handdata.blinds;
    const bigBlind = Math.max(blinds[0], blinds[1]);
    const avgStack = stacks.reduce((a, b) => a + b, 0) / stacks.length;
    const avgStackBB = avgStack / bigBlind;
    
    // Need at least 10 BB average for meaningful 3-bet spots
    if (avgStackBB < 10) {
        return false;
    }
    
    return true;
}

/**
 * Gets valid hero positions for vs Open spots
 * 
 * @param numPlayers - Number of players at the table
 * @returns Array of valid hero positions (position 1 to BB)
 * 
 * @example
 * const validPositions = getValidVsOpenHeroPositions(6);
 * // Returns [1, 2, 3, 4, 5] (all except position 0)
 */
export function getValidVsOpenHeroPositions(numPlayers: number): number[] {
    const positions: number[] = [];
    
    // Hero can be any position from 1 to BB (cannot be position 0)
    for (let i = 1; i < numPlayers; i++) {
        positions.push(i);
    }
    
    return positions;
}
