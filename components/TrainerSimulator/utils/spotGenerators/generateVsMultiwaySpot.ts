/**
 * vs Multiway Shove Spot Generator
 * 
 * Generates training spots where multiple players go all-in (shove)
 * and the hero must decide how to respond.
 * 
 * Part of TrainerSimulator refactoring - Phase 5
 */

import type { AppData, NodeData } from '../../../../types';
import { loadNodeIfNeeded, findAllInAction, findFoldAction } from '../navigationUtils';

/**
 * Configuration for vs Multiway shove spot generation
 */
export interface VsMultiwayConfig {
    /** The poker solution */
    solution: AppData;
    /** Function to load nodes on demand */
    loadNodes: (solutionId: string, nodeIds: number[]) => Promise<AppData | null>;
    /** Original solution ID for node loading */
    solutionId: string;
}

/**
 * Result of vs Multiway shove spot generation
 */
export interface VsMultiwaySpotResult {
    /** Hero's position at the table */
    heroPosition: number;
    /** Positions of players who shoved (in order) */
    shoverPositions: number[];
    /** Updated solution with loaded nodes */
    solution: AppData;
    /** Success flag */
    success: boolean;
    /** Error message if failed */
    error?: string;
}

/**
 * Determines number of shovers based on maximum possible
 * 
 * Distribution favors 2 shovers (most common multiway scenario)
 * 
 * @param maxShovers - Maximum number of positions that can shove
 * @returns Number of shovers to generate
 */
function getNumberOfShovers(maxShovers: number): number {
    if (maxShovers < 2) return maxShovers; // Not multiway if < 2
    
    const random = Math.random();
    
    if (maxShovers >= 5) {
        // Can have up to 5 all-ins
        if (random < 0.70) return 2; // 70% chance: 2 shovers
        if (random < 0.85) return 3; // 15% chance: 3 shovers
        if (random < 0.95) return 4; // 10% chance: 4 shovers
        return 5;                     // 5% chance: 5 shovers
    } else if (maxShovers === 4) {
        if (random < 0.80) return 2; // 80% chance: 2 shovers
        if (random < 0.95) return 3; // 15% chance: 3 shovers
        return 4;                     // 5% chance: 4 shovers
    } else if (maxShovers === 3) {
        if (random < 0.80) return 2; // 80% chance: 2 shovers
        return 3;                     // 20% chance: 3 shovers
    } else {
        // maxShovers === 2 (minimum multiway case)
        return 2;
    }
}

/**
 * Gets valid hero positions for multiway shove based on table size
 * 
 * Hero positions are restricted to late positions (CO, BTN, SB, BB)
 * because multiway shoves typically happen with hero in late position
 * 
 * @param numPlayers - Number of players at table
 * @returns Array of valid hero positions
 */
function getValidMultiwayHeroPositions(numPlayers: number): number[] {
    const bbPosition = numPlayers - 1;
    const sbPosition = numPlayers === 2 ? 0 : numPlayers - 2;
    const btnPosition = numPlayers === 2 ? 0 : numPlayers - 3;
    const coPosition = numPlayers >= 6 ? numPlayers - 4 : -1;
    
    if (numPlayers === 3) {
        // 3-handed: hero can only be BB
        return [bbPosition];
    } else if (numPlayers === 4) {
        // 4-handed: hero can be SB or BB
        return [sbPosition, bbPosition];
    } else if (numPlayers === 5) {
        // 5-handed: hero can be BB, SB, BTN
        return [bbPosition, sbPosition, btnPosition];
    } else if (numPlayers >= 6) {
        // 6+ handed: hero can be BB, SB, BTN, CO
        return [bbPosition, sbPosition, btnPosition, coPosition];
    }
    
    return [bbPosition]; // Fallback
}

/**
 * Generates a vs Multiway shove spot
 * 
 * In "vs Multiway shove" spots:
 * 1. Multiple players (2+) go all-in before hero
 * 2. Non-shovers fold
 * 3. Hero must decide: Fold or Call facing multiple all-ins
 * 
 * Requirements:
 * - Hero in late position (CO, BTN, SB, or BB depending on table size)
 * - At least 2 positions before hero must shove
 * - All shovers must have valid all-in actions
 * 
 * @param config - Configuration object
 * @returns vs Multiway shove spot result
 * 
 * @example
 * const result = await generateVsMultiwaySpot({
 *   solution,
 *   loadNodes,
 *   solutionId: solution.id
 * });
 * 
 * if (result.success) {
 *   console.log(`Hero at ${result.heroPosition} facing ${result.shoverPositions.length} shovers`);
 * }
 */
export async function generateVsMultiwaySpot(
    config: VsMultiwayConfig
): Promise<VsMultiwaySpotResult> {
    const { solution, loadNodes, solutionId } = config;

    const numPlayers = solution.settings.handdata.stacks.length;
    const blinds = solution.settings.handdata.blinds;
    const bigBlind = Math.max(blinds[0], blinds[1]);
    
    // Get valid hero positions based on table size
    const validHeroPositions = getValidMultiwayHeroPositions(numPlayers);
    
    // Select random hero position from valid positions
    const heroPosition = validHeroPositions[Math.floor(Math.random() * validHeroPositions.length)];

    // Determine maximum number of possible shovers (all before hero)
    const maxShovers = heroPosition;

    if (maxShovers < 2) {

        return {
            heroPosition,
            shoverPositions: [],
            solution,
            success: false,
            error: 'Not enough positions for multiway shove'
        };
    }
    
    // Determine number of shovers
    const numShovers = getNumberOfShovers(maxShovers);

    // Select which positions will shove (all before hero)
    const possibleShoverPositions = Array.from({ length: heroPosition }, (_, i) => i);
    
    // Shuffle and take first numShovers positions, then sort
    const shuffled = possibleShoverPositions.sort(() => Math.random() - 0.5);
    const selectedShoverPositions = shuffled.slice(0, numShovers).sort((a, b) => a - b);

    // Navigate to each shover and verify all have valid all-in actions
    let allShoversValid = true;
    
    for (const shoverPos of selectedShoverPositions) {
        const shoverStack = solution.settings.handdata.stacks[shoverPos];

        // Navigate to this position
        // Positions before this shover either fold or shove (if they're in selectedShoverPositions)
        let checkNode: NodeData | undefined = solution.nodes.get(0);
        let checkNodeId = 0;
        let tempSolution = solution;
        let navigationPath = 0;
        
        while (checkNode && checkNode.player !== shoverPos && navigationPath < 20) {
            const currentPlayer = checkNode.player;
            
            // If this player is a previous shover, they shove
            if (selectedShoverPositions.includes(currentPlayer) && currentPlayer < shoverPos) {
                const prevShoverStack = tempSolution.settings.handdata.stacks[currentPlayer];
                const allinActionIndex = findAllInAction(checkNode.actions, prevShoverStack);
                
                if (allinActionIndex === -1) {

                    allShoversValid = false;
                    break;
                }
                
                const allinAction = checkNode.actions[allinActionIndex];
                checkNodeId = allinAction.node || 0;
            } else {
                // Otherwise, they fold
                const foldActionIndex = findFoldAction(checkNode.actions);
                
                if (foldActionIndex === -1) {

                    allShoversValid = false;
                    break;
                }
                
                const foldAction = checkNode.actions[foldActionIndex];
                checkNodeId = foldAction.node || 0;
            }
            
            if (checkNodeId === 0) {

                allShoversValid = false;
                break;
            }
            
            // Load next node if needed
            const updated = await loadNodeIfNeeded(
                tempSolution,
                checkNodeId,
                solutionId,
                loadNodes
            );
            
            if (!updated) {

                allShoversValid = false;
                break;
            }
            
            tempSolution = updated;
            checkNode = tempSolution.nodes.get(checkNodeId);
            navigationPath++;
        }
        
        if (!allShoversValid) break;
        
        if (navigationPath >= 20) {

            allShoversValid = false;
            break;
        }
        
        // Verify this player has all-in action available
        if (checkNode && checkNode.player === shoverPos) {
            const allinActionIndex = findAllInAction(checkNode.actions, shoverStack);
            
            if (allinActionIndex === -1) {

                allShoversValid = false;
                break;
            }

        } else {

            allShoversValid = false;
            break;
        }
    }
    
    if (!allShoversValid) {

        return {
            heroPosition,
            shoverPositions: [],
            solution,
            success: false,
            error: 'Invalid shover configuration'
        };
    }

    return {
        heroPosition,
        shoverPositions: selectedShoverPositions,
        solution,
        success: true
    };
}

/**
 * Validates if a solution is suitable for vs Multiway shove spot generation
 * 
 * Requirements:
 * - At least 4 players (2 shovers, hero, and at least one other)
 * - Short stacks preferred (multiway all-ins happen in push/fold situations)
 * 
 * @param solution - Solution to validate
 * @returns true if solution can generate vs Multiway spots
 * 
 * @example
 * if (isValidVsMultiwaySolution(solution)) {
 *   const spot = await generateVsMultiwaySpot(config);
 * }
 */
export function isValidVsMultiwaySolution(solution: AppData): boolean {
    // Need at least 4 players (2 shovers, hero, someone else)
    if (!solution.settings?.handdata?.stacks || solution.settings.handdata.stacks.length < 4) {
        return false;
    }
    
    return true;
}
