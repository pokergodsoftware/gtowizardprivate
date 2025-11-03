/**
 * Navigation Utilities
 * 
 * Helper functions for navigating the poker decision tree.
 * Extracted from TrainerSimulator.tsx during Phase 3 refactoring.
 */

import type { AppData, NodeData, Action } from '../../../types.ts';

/**
 * Type for the loadNodesForSolution function
 */
export type LoadNodesFunction = (
    solutionId: string, 
    nodeIdsToLoad?: number[]
) => Promise<AppData | null>;

/**
 * Configuration for finding a valid raiser/shover
 */
export interface FindValidPlayerConfig {
    possiblePositions: number[];
    solution: AppData;
    originalSolutionId: string;
    loadNodes: LoadNodesFunction;
    bigBlind: number;
    isShove?: boolean; // If true, looking for shove; otherwise looking for 2BB raise
}

/**
 * Result of a successful navigation
 */
export interface NavigationResult {
    nodeId: number;
    solution: AppData;
    validPosition?: number;
}

/**
 * Loads a node if it's not already in the solution
 * @param solution - Current solution
 * @param nodeId - Node ID to load
 * @param originalSolutionId - Original solution ID for loading
 * @param loadNodes - Function to load nodes
 * @returns Updated solution with the node loaded, or null if failed
 */
export const loadNodeIfNeeded = async (
    solution: AppData,
    nodeId: number,
    originalSolutionId: string,
    loadNodes: LoadNodesFunction
): Promise<AppData | null> => {
    if (solution.nodes.has(nodeId)) {
        return solution;
    }

    console.log(`📥 Loading node ${nodeId}...`);
    const updated = await loadNodes(originalSolutionId, [nodeId]);
    
    if (updated && updated.nodes.has(nodeId)) {
        console.log(`✅ Node ${nodeId} loaded successfully`);
        return updated;
    }
    
    console.error('❌ Failed to load node', nodeId);
    return null;
};

/**
 * Finds the fold action in a node's actions
 * @param actions - Array of actions
 * @returns Index of fold action, or -1 if not found
 */
export const findFoldAction = (actions: Action[]): number => {
    return actions.findIndex(a => a.type === 'F');
};

/**
 * Finds a raise action with specific amount (in BB)
 * @param actions - Array of actions
 * @param targetBB - Target raise amount in BB (e.g., 2.0 for 2BB)
 * @param bigBlind - Big blind amount
 * @param tolerance - Tolerance for matching (default 0.1 BB)
 * @returns Index of matching raise action, or -1 if not found
 */
export const findRaiseAction = (
    actions: Action[],
    targetBB: number,
    bigBlind: number,
    tolerance: number = 0.1
): number => {
    return actions.findIndex(a => {
        if (a.type !== 'R') return false;
        const raiseBB = a.amount / bigBlind;
        return Math.abs(raiseBB - targetBB) < tolerance;
    });
};

/**
 * Finds an all-in action for a player
 * @param actions - Array of actions
 * @param playerStack - Player's stack size
 * @returns Index of all-in action, or -1 if not found
 */
export const findAllInAction = (
    actions: Action[],
    playerStack: number
): number => {
    return actions.findIndex(a => {
        if (a.type !== 'R') return false;
        // Consider it all-in if the bet is more than 50% of stack
        return a.amount > (playerStack * 0.5);
    });
};

/**
 * Navigates through nodes folding all players until reaching target position
 * @param startNodeId - Starting node ID
 * @param targetPosition - Target player position to reach
 * @param solution - Current solution
 * @param originalSolutionId - Original solution ID for loading nodes
 * @param loadNodes - Function to load nodes
 * @param maxIterations - Maximum navigation iterations (default 20)
 * @returns Navigation result or null if failed
 */
export const foldUntilPosition = async (
    startNodeId: number,
    targetPosition: number,
    solution: AppData,
    originalSolutionId: string,
    loadNodes: LoadNodesFunction,
    maxIterations: number = 20
): Promise<NavigationResult | null> => {
    let currentNodeId = startNodeId;
    let workingSolution = solution;
    let currentNode = workingSolution.nodes.get(currentNodeId);
    let iterations = 0;

    console.log(`🔄 Folding until position ${targetPosition}...`);

    while (currentNode && currentNode.player !== targetPosition && iterations < maxIterations) {
        iterations++;
        console.log(`   Iteration ${iterations}: Player ${currentNode.player} → Fold`);

        // Find fold action
        const foldActionIndex = findFoldAction(currentNode.actions);
        
        if (foldActionIndex === -1) {
            console.error('❌ No fold action available');
            return null;
        }

        const foldAction = currentNode.actions[foldActionIndex];
        const nextNodeId = foldAction.node;

        if (!nextNodeId || nextNodeId === 0) {
            console.error('❌ Terminal node reached while folding');
            return null;
        }

        // Load next node if needed
        const updated = await loadNodeIfNeeded(
            workingSolution,
            nextNodeId,
            originalSolutionId,
            loadNodes
        );

        if (!updated) return null;
        
        workingSolution = updated;
        currentNodeId = nextNodeId;
        currentNode = workingSolution.nodes.get(currentNodeId);

        if (!currentNode) {
            console.error('❌ Node not found:', currentNodeId);
            return null;
        }
    }

    if (iterations >= maxIterations) {
        console.error('❌ Max iterations reached while folding');
        return null;
    }

    if (currentNode.player !== targetPosition) {
        console.error('❌ Failed to reach target position');
        return null;
    }

    console.log(`✅ Reached position ${targetPosition} at node ${currentNodeId}`);
    
    return {
        nodeId: currentNodeId,
        solution: workingSolution
    };
};

/**
 * Finds a valid raiser position (player who can make a 2BB raise)
 * @param config - Configuration object
 * @returns Valid raiser position or null if not found
 */
export const findValidRaiser = async (
    config: FindValidPlayerConfig
): Promise<number | null> => {
    const { possiblePositions, solution, originalSolutionId, loadNodes, bigBlind } = config;

    console.log(`🔍 Looking for valid raiser in positions: [${possiblePositions}]`);

    for (const position of possiblePositions) {
        // Fold until this position
        const navResult = await foldUntilPosition(
            0,
            position,
            solution,
            originalSolutionId,
            loadNodes
        );

        if (!navResult) continue;

        const node = navResult.solution.nodes.get(navResult.nodeId);
        if (!node) continue;

        // Check if this position can raise 2BB
        const raiseIndex = findRaiseAction(node.actions, 2.0, bigBlind);

        if (raiseIndex !== -1) {
            console.log(`✅ Found valid raiser at position ${position}`);
            return position;
        }

        console.log(`   ⚠️ Position ${position} cannot raise 2BB`);
    }

    console.log(`❌ No valid raiser found in positions: [${possiblePositions}]`);
    return null;
};

/**
 * Finds a valid shover position (player who can go all-in)
 * @param config - Configuration object
 * @returns Valid shover position or null if not found
 */
export const findValidShover = async (
    config: FindValidPlayerConfig
): Promise<number | null> => {
    const { possiblePositions, solution, originalSolutionId, loadNodes } = config;

    console.log(`🔍 Looking for valid shover in positions: [${possiblePositions}]`);

    for (const position of possiblePositions) {
        // Fold until this position
        const navResult = await foldUntilPosition(
            0,
            position,
            solution,
            originalSolutionId,
            loadNodes
        );

        if (!navResult) continue;

        const node = navResult.solution.nodes.get(navResult.nodeId);
        if (!node) continue;

        const playerStack = solution.settings.handdata.stacks[position];

        // Check if this position can shove
        const shoveIndex = findAllInAction(node.actions, playerStack);

        if (shoveIndex !== -1) {
            console.log(`✅ Found valid shover at position ${position}`);
            return position;
        }

        console.log(`   ⚠️ Position ${position} cannot shove`);
    }

    console.log(`❌ No valid shover found in positions: [${possiblePositions}]`);
    return null;
};

/**
 * Navigates through the tree with specific action requirements
 * Used for complex spot types (vs Open, vs Shove, vs Multiway)
 * 
 * @param startNodeId - Starting node ID
 * @param targetPosition - Target player position to reach
 * @param solution - Current solution
 * @param originalSolutionId - Original solution ID
 * @param loadNodes - Function to load nodes
 * @param raiserPosition - Position of player who should raise (optional)
 * @param shoverPositions - Positions of players who should shove (optional)
 * @param bigBlind - Big blind amount
 * @param maxIterations - Maximum navigation iterations
 * @returns Navigation result or null if failed
 */
export const navigateToHeroPosition = async (
    startNodeId: number,
    targetPosition: number,
    solution: AppData,
    originalSolutionId: string,
    loadNodes: LoadNodesFunction,
    options: {
        raiserPosition?: number;
        shoverPositions?: number[];
        bigBlind: number;
        maxIterations?: number;
    }
): Promise<NavigationResult | null> => {
    const {
        raiserPosition,
        shoverPositions = [],
        bigBlind,
        maxIterations = 20
    } = options;

    let currentNodeId = startNodeId;
    let workingSolution = solution;
    let currentNode = workingSolution.nodes.get(currentNodeId);
    let iterations = 0;

    console.log(`🧭 Navigating to hero position ${targetPosition}...`);

    while (currentNode && currentNode.player !== targetPosition && iterations < maxIterations) {
        iterations++;
        
        const currentPlayer = currentNode.player;
        console.log(`   Iteration ${iterations}: Player ${currentPlayer}`);

        if (!currentNode.actions || currentNode.actions.length === 0) {
            console.error('❌ No actions available');
            return null;
        }

        let selectedAction: Action | null = null;
        let actionIndex = -1;

        // Determine action based on player role
        if (raiserPosition !== undefined && currentPlayer === raiserPosition) {
            // This player should raise 2BB
            actionIndex = findRaiseAction(currentNode.actions, 2.0, bigBlind);
            if (actionIndex !== -1) {
                selectedAction = currentNode.actions[actionIndex];
                console.log(`   → Raise 2BB`);
            }
        } else if (shoverPositions.includes(currentPlayer)) {
            // This player should shove
            const playerStack = workingSolution.settings.handdata.stacks[currentPlayer];
            actionIndex = findAllInAction(currentNode.actions, playerStack);
            if (actionIndex !== -1) {
                selectedAction = currentNode.actions[actionIndex];
                console.log(`   → All-in`);
            }
        } else {
            // All other players fold
            actionIndex = findFoldAction(currentNode.actions);
            if (actionIndex !== -1) {
                selectedAction = currentNode.actions[actionIndex];
                console.log(`   → Fold`);
            }
        }

        if (!selectedAction) {
            console.error(`❌ Required action not available for player ${currentPlayer}`);
            return null;
        }

        const nextNodeId = selectedAction.node;
        if (!nextNodeId || nextNodeId === 0) {
            console.error('❌ Terminal node reached prematurely');
            return null;
        }

        // Load next node if needed
        const updated = await loadNodeIfNeeded(
            workingSolution,
            nextNodeId,
            originalSolutionId,
            loadNodes
        );

        if (!updated) return null;

        workingSolution = updated;
        currentNodeId = nextNodeId;
        currentNode = workingSolution.nodes.get(currentNodeId);

        if (!currentNode) {
            console.error('❌ Node not found:', currentNodeId);
            return null;
        }
    }

    if (iterations >= maxIterations) {
        console.error('❌ Max iterations reached');
        return null;
    }

    if (currentNode.player !== targetPosition) {
        console.error('❌ Failed to reach hero position');
        return null;
    }

    console.log(`✅ Reached hero at position ${targetPosition}, node ${currentNodeId}`);

    return {
        nodeId: currentNodeId,
        solution: workingSolution
    };
};
