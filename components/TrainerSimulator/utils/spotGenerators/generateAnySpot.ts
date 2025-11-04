/**
 * Any Spot Generator
 * 
 * Generates training spots by randomly navigating the decision tree.
 * Villains play their GTO strategy (selecting actions based on frequencies),
 * and we show the hero their decision at a random point in the game tree.
 * 
 * This is the most complex generator as it simulates realistic poker scenarios
 * with multiple villain actions and combo selection.
 * 
 * Part of TrainerSimulator refactoring - Phase 5
 */

import type { AppData, NodeData, VillainAction, Action } from '../../../../types';
import { loadNodeIfNeeded } from '../navigationUtils';
import { getHandNameFromCombo } from '../handSelection';

/**
 * Configuration for Any spot generation
 */
export interface AnySpotConfig {
    /** The poker solution */
    solution: AppData;
    /** Hero's position at the table */
    heroPosition: number;
    /** Function to load nodes on demand */
    loadNodes: (solutionId: string, nodeIds: number[]) => Promise<AppData | null>;
    /** Original solution ID for node loading */
    solutionId: string;
    /** All available combos (flat array) */
    allCombos: string[] | string[][];
}

/**
 * Result of Any spot generation
 */
export interface AnySpotResult {
    /** Node ID where hero acts */
    nodeId: number;
    /** Updated solution with loaded nodes */
    solution: AppData;
    /** History of villain actions leading to hero's decision */
    villainActions: VillainAction[];
    /** Success flag */
    success: boolean;
    /** Error message if failed */
    error?: string;
}

/**
 * Selects a random element from an array
 * @param arr - Array to select from
 * @returns Random element
 */
function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Determines action name from action data
 * 
 * @param action - Action from node
 * @param bigBlind - Big blind size
 * @param playerStack - Player's stack size
 * @returns Human-readable action name
 */
function getActionName(
    action: Action,
    bigBlind: number,
    playerStack: number
): { name: string; amount?: number } {
    if (action.type === 'F') {
        return { name: 'Fold' };
    } else if (action.type === 'C') {
        return { name: 'Call', amount: action.amount };
    } else if (action.type === 'X') {
        return { name: 'Check' };
    } else if (action.type === 'R') {
        const isAllin = action.amount > (playerStack * 0.5);
        
        if (isAllin) {
            return { name: 'Allin', amount: action.amount };
        } else {
            const raiseBB = (action.amount / bigBlind).toFixed(1);
            return { name: `Raise ${raiseBB}`, amount: action.amount };
        }
    }
    
    return { name: 'Unknown' };
}

/**
 * Generates an "Any" spot by randomly navigating the decision tree
 * 
 * In "Any" spots:
 * 1. Start at node 0 (preflop, before any actions)
 * 2. For each villain before hero:
 *    - Select a random combo for villain
 *    - Find villain's highest frequency action for that combo
 *    - Execute that action and move to next node
 * 3. Continue until reaching hero's decision point
 * 4. Return the node and history of villain actions
 * 
 * This creates realistic training scenarios where the hero faces
 * various bet sizes, number of players, and board textures.
 * 
 * @param config - Configuration object
 * @returns Any spot result with villain action history
 * 
 * @example
 * const result = await generateAnySpot({
 *   solution,
 *   heroPosition: 5,
 *   loadNodes,
 *   solutionId: solution.id,
 *   allCombos: combosArray
 * });
 * 
 * if (result.success) {
 *   console.log(`Hero at node ${result.nodeId}`);
 *   console.log(`Villain actions:`, result.villainActions);
 * }
 */
export async function generateAnySpot(
    config: AnySpotConfig
): Promise<AnySpotResult> {
    const { solution, heroPosition, loadNodes, solutionId, allCombos } = config;

    const flatCombos: string[] = Array.isArray(allCombos[0]) ? allCombos.flat() : allCombos as string[];
    const villainActions: VillainAction[] = [];
    const blinds = solution.settings.handdata.blinds;
    const bigBlind = Math.max(blinds[0], blinds[1]);
    
    let currentNodeId = 0;
    let workingSolution = solution;
    let currentNode = workingSolution.nodes.get(currentNodeId);
    
    if (!currentNode) {
        console.error('❌ Initial node not found');
        return {
            nodeId: 0,
            solution,
            villainActions: [],
            success: false,
            error: 'Initial node not found'
        };
    }
    
    const maxIterations = 50;
    let iterations = 0;
    
    // Navigate until reaching hero
    while (currentNode && currentNode.player !== heroPosition && iterations < maxIterations) {
        iterations++;
        const villainPosition = currentNode.player;

        // 1. Select random combo for this villain
        const randomCombo = randomElement(flatCombos);
        const handName = getHandNameFromCombo(randomCombo);

        // 2. Check if this combo has data in this node
        const handData = currentNode.hands[handName];
        
        if (!handData || !handData.played) {

            // Fold
            const foldAction = currentNode.actions.find(a => a.type === 'F');
            if (!foldAction || !foldAction.node) {
                console.error('❌ No fold action available');
                return {
                    nodeId: currentNodeId,
                    solution: workingSolution,
                    villainActions,
                    success: false,
                    error: 'No fold action available'
                };
            }
            
            villainActions.push({
                position: villainPosition,
                action: 'Fold',
                combo: randomCombo
            });
            
            currentNodeId = foldAction.node;
        } else {
            // 3. Find action with highest frequency for this combo
            let maxFreq = 0;
            let bestActionIndex = -1;
            
            handData.played.forEach((freq, idx) => {
                if (freq > maxFreq) {
                    maxFreq = freq;
                    bestActionIndex = idx;
                }
            });
            
            if (bestActionIndex === -1 || maxFreq === 0) {

                const foldAction = currentNode.actions.find(a => a.type === 'F');
                if (!foldAction || !foldAction.node) {
                    console.error('❌ No fold action available');
                    return {
                        nodeId: currentNodeId,
                        solution: workingSolution,
                        villainActions,
                        success: false,
                        error: 'No fold action available for villain'
                    };
                }
                
                villainActions.push({
                    position: villainPosition,
                    action: 'Fold',
                    combo: randomCombo
                });
                
                currentNodeId = foldAction.node;
            } else {
                // 4. Execute the highest frequency action
                const selectedAction = currentNode.actions[bestActionIndex];
                const villainStack = workingSolution.settings.handdata.stacks[villainPosition];
                
                const { name: actionName, amount: actionAmount } = getActionName(
                    selectedAction,
                    bigBlind,
                    villainStack
                );

                villainActions.push({
                    position: villainPosition,
                    action: actionName,
                    amount: actionAmount,
                    combo: randomCombo
                });
                
                currentNodeId = selectedAction.node || 0;
            }
        }
        
        // Check if reached terminal node
        if (currentNodeId === 0) {

            return {
                nodeId: 0,
                solution: workingSolution,
                villainActions,
                success: false,
                error: 'Reached terminal node before hero'
            };
        }
        
        // Load next node if necessary
        if (!workingSolution.nodes.has(currentNodeId)) {

            const updated = await loadNodeIfNeeded(
                workingSolution,
                currentNodeId,
                solutionId,
                loadNodes
            );
            
            if (!updated) {
                console.error('❌ Failed to load node', currentNodeId);
                return {
                    nodeId: currentNodeId,
                    solution: workingSolution,
                    villainActions,
                    success: false,
                    error: `Failed to load node ${currentNodeId}`
                };
            }
            
            workingSolution = updated;

        }
        
        currentNode = workingSolution.nodes.get(currentNodeId);
        
        if (!currentNode) {
            console.error('❌ Node not found:', currentNodeId);
            return {
                nodeId: currentNodeId,
                solution: workingSolution,
                villainActions,
                success: false,
                error: `Node ${currentNodeId} not found`
            };
        }
    }
    
    if (iterations >= maxIterations) {
        console.error('❌ Max iterations reached in Any spot generation');
        return {
            nodeId: currentNodeId,
            solution: workingSolution,
            villainActions,
            success: false,
            error: 'Max iterations reached'
        };
    }
    
    if (!currentNode || currentNode.player !== heroPosition) {
        console.error('❌ Did not reach hero position');
        return {
            nodeId: currentNodeId,
            solution: workingSolution,
            villainActions,
            success: false,
            error: 'Did not reach hero position'
        };
    }

    return {
        nodeId: currentNodeId,
        solution: workingSolution,
        villainActions,
        success: true
    };
}

/**
 * Validates if a solution is suitable for Any spot generation
 * 
 * Requirements:
 * - At least 2 players (hero and one villain)
 * - Node 0 must exist
 * 
 * @param solution - Solution to validate
 * @returns true if solution can generate Any spots
 * 
 * @example
 * if (isValidAnySolution(solution)) {
 *   const spot = await generateAnySpot(config);
 * }
 */
export function isValidAnySolution(solution: AppData): boolean {
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
