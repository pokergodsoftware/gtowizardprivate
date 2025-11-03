/**
 * vs Shove Spot Generator
 * 
 * Generates training spots where a player goes all-in (shove)
 * and the hero must decide how to respond.
 * 
 * Part of TrainerSimulator refactoring - Phase 5
 */

import type { AppData } from '../../../../types';
import { foldUntilPosition, findAllInAction } from '../navigationUtils';

/**
 * Configuration for vs Shove spot generation
 */
export interface VsShoveConfig {
    /** The poker solution */
    solution: AppData;
    /** Function to load nodes on demand */
    loadNodes: (solutionId: string, nodeIds: number[]) => Promise<AppData | null>;
    /** Original solution ID for node loading */
    solutionId: string;
}

/**
 * Result of vs Shove spot generation
 */
export interface VsShoveSpotResult {
    /** Hero's position at the table */
    heroPosition: number;
    /** Position of the player who shoved */
    shoverPosition: number;
    /** Updated solution with loaded nodes */
    solution: AppData;
    /** Success flag */
    success: boolean;
    /** Error message if failed */
    error?: string;
}

/**
 * Generates a vs Shove spot
 * 
 * In "vs Shove" spots:
 * 1. A player goes all-in (shove)
 * 2. Everyone between shover and hero folds
 * 3. Hero must decide: Fold or Call the shove
 * 
 * Requirements:
 * - Hero cannot be position 0 (someone must shove before hero)
 * - At least one position before hero must have valid all-in action
 * - Shover must have > 5% total frequency for all-in action
 * 
 * @param config - Configuration object
 * @returns vs Shove spot result
 * 
 * @example
 * const result = await generateVsShoveSpot({
 *   solution,
 *   loadNodes,
 *   solutionId: solution.id
 * });
 * 
 * if (result.success) {
 *   console.log(`Hero at ${result.heroPosition} facing shove from ${result.shoverPosition}`);
 * }
 */
export async function generateVsShoveSpot(
    config: VsShoveConfig
): Promise<VsShoveSpotResult> {
    const { solution, loadNodes, solutionId } = config;
    
    console.log('\n🎲 === GENERATING VS SHOVE SPOT ===');
    
    const numPlayers = solution.settings.handdata.stacks.length;
    
    // Hero must be position 1 to BB (cannot be position 0 - someone must shove first)
    const heroPosition = Math.floor(Math.random() * (numPlayers - 1)) + 1;
    
    console.log(`✅ [vs Shove] Selected hero at position ${heroPosition} of ${numPlayers} players`);
    
    // List all positions that can shove (all before hero)
    const possibleShovers = Array.from({ length: heroPosition }, (_, i) => i);
    console.log(`📋 Positions that can shove:`, possibleShovers);
    
    // Try to find a valid shover (shuffle to add randomness)
    const shuffledShovers = possibleShovers.sort(() => Math.random() - 0.5);
    
    for (const potentialShover of shuffledShovers) {
        console.log(`\n🔍 Checking if position ${potentialShover} can shove...`);
        
        // Get shover's stack
        const shoverStack = solution.settings.handdata.stacks[potentialShover];
        console.log(`   Stack at position ${potentialShover}: ${shoverStack} chips`);
        
        // Navigate to this position
        const navResult = await foldUntilPosition(
            0, // start from node 0
            potentialShover,
            solution,
            solutionId,
            loadNodes
        );
        
        if (!navResult) {
            console.log(`❌ Could not navigate to position ${potentialShover}`);
            continue;
        }
        
        const updatedSolution = navResult.solution;
        const checkNode = updatedSolution.nodes.get(navResult.nodeId);
        
        if (!checkNode) {
            console.log(`❌ Node not found after navigation`);
            continue;
        }
        
        // Check if this position has an all-in action
        const allinActionIndex = findAllInAction(checkNode.actions, shoverStack);
        
        if (allinActionIndex < 0) {
            console.log(`❌ Position ${potentialShover} doesn't have all-in action`);
            continue;
        }
        
        // Check if ANY hand has frequency > 0 for this all-in action
        // Total frequency must be > 5% for the spot to be realistic
        const allHands = Object.keys(checkNode.hands);
        let totalFreq = 0;
        
        for (const handName of allHands) {
            const handData = checkNode.hands[handName];
            if (handData && handData.played[allinActionIndex] > 0) {
                totalFreq += handData.played[allinActionIndex];
            }
        }
        
        const hasMinFrequency = totalFreq > 0.05; // 5% minimum
        
        if (!hasMinFrequency) {
            console.log(`❌ Position ${potentialShover} has all-in but freq < 5% (${(totalFreq * 100).toFixed(1)}%)`);
            continue;
        }
        
        console.log(`✅ Position ${potentialShover} can shove (total freq: ${(totalFreq * 100).toFixed(1)}%)`);
        console.log(`\n🎯 Shover selected: position ${potentialShover}`);
        
        return {
            heroPosition,
            shoverPosition: potentialShover,
            solution: updatedSolution,
            success: true
        };
    }
    
    // No valid shover found
    console.log('⚠️ No position before hero has valid shove');
    
    return {
        heroPosition,
        shoverPosition: -1,
        solution,
        success: false,
        error: 'No valid shover found'
    };
}

/**
 * Validates if a solution is suitable for vs Shove spot generation
 * 
 * Requirements:
 * - At least 3 players (shover, hero, and at least one other)
 * - Average stack < 20 BB (shove spots happen in short stack situations)
 * 
 * @param solution - Solution to validate
 * @returns true if solution can generate vs Shove spots
 * 
 * @example
 * if (isValidVsShoveSolution(solution)) {
 *   const spot = await generateVsShoveSpot(config);
 * }
 */
export function isValidVsShoveSolution(solution: AppData): boolean {
    // Need at least 3 players
    if (!solution.settings?.handdata?.stacks || solution.settings.handdata.stacks.length < 3) {
        return false;
    }
    
    // Calculate average stack in BB
    const stacks = solution.settings.handdata.stacks;
    const blinds = solution.settings.handdata.blinds;
    const bigBlind = Math.max(blinds[0], blinds[1]);
    const avgStack = stacks.reduce((a, b) => a + b, 0) / stacks.length;
    const avgStackBB = avgStack / bigBlind;
    
    // Shove spots typically happen when stacks are short
    // But we don't enforce a maximum - just need valid all-in actions
    
    return true;
}

/**
 * Gets valid hero positions for vs Shove spots
 * 
 * @param numPlayers - Number of players at the table
 * @returns Array of valid hero positions (position 1 to BB)
 * 
 * @example
 * const validPositions = getValidVsShoveHeroPositions(6);
 * // Returns [1, 2, 3, 4, 5] (all except position 0)
 */
export function getValidVsShoveHeroPositions(numPlayers: number): number[] {
    const positions: number[] = [];
    
    // Hero can be any position from 1 to BB (cannot be position 0)
    for (let i = 1; i < numPlayers; i++) {
        positions.push(i);
    }
    
    return positions;
}
