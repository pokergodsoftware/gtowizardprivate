/**
 * Hand History Builder
 * 
 * Pure functions to build hand history from node tree navigation.
 * Extracts actions from the path leading to the current hero spot.
 */

import type { AppData, NodeData, Action } from '../../../types';
import type { HandHistoryAction, HandHistoryData } from '../types';
import { getPlayerPositions, getActionName } from '../../../lib/pokerUtils';

/**
 * Maps street number to street name
 */
const getStreetName = (street: number): 'Preflop' | 'Flop' | 'Turn' | 'River' => {
    switch (street) {
        case 0: return 'Preflop';
        case 1: return 'Flop';
        case 2: return 'Turn';
        case 3: return 'River';
        default: return 'Preflop';
    }
};

/**
 * Get action description (Fold, Call, Raise 2.5BB, All-in, etc)
 */
const getActionDescription = (
    action: Action,
    bigBlind: number,
    playerStack: number,
    displayMode: 'bb' | 'chips'
): string => {
    return getActionName(
        { type: action.type, amount: action.amount },
        bigBlind,
        playerStack,
        displayMode
    );
};

/**
 * Build path from root node (0) to target node
 * Returns array of node IDs representing the path
 */
const buildNodePath = (
    nodes: Map<number, NodeData>,
    targetNodeId: number
): number[] => {
    // If target is root, return early
    if (targetNodeId === 0) {
        return [0];
    }
    
    const path: number[] = [];
    const visited = new Set<number>();
    
    // Check if root node exists
    if (!nodes.has(0)) {
        console.error('❌ Root node (0) not found in nodes map');
        return [0];
    }
    
    // BFS to find path from node 0 to targetNodeId
    const queue: { nodeId: number; path: number[] }[] = [{ nodeId: 0, path: [0] }];
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        
        if (current.nodeId === targetNodeId) {
            console.log(`✅ Path found: ${current.path.join(' → ')}`);
            return current.path;
        }
        
        if (visited.has(current.nodeId)) continue;
        visited.add(current.nodeId);
        
        const node = nodes.get(current.nodeId);
        if (!node) {
            console.warn(`⚠️ Node ${current.nodeId} not found in map (skipping)`);
            continue;
        }
        
        // Add children to queue
        for (const action of node.actions) {
            if (action.node !== undefined && !visited.has(action.node)) {
                queue.push({
                    nodeId: action.node,
                    path: [...current.path, action.node]
                });
            }
        }
    }
    
    console.error(`❌ Path not found from 0 to ${targetNodeId}`);
    console.error(`   Nodes in map: ${Array.from(nodes.keys()).slice(0, 10).join(', ')}...`);
    console.error(`   Total nodes: ${nodes.size}`);
    return [0]; // Fallback to root if path not found
};

/**
 * Build hand history from solution and target node
 */
export const buildHandHistory = (
    solution: AppData,
    targetNodeId: number,
    displayMode: 'bb' | 'chips' = 'bb'
): HandHistoryData => {
    const actions: HandHistoryAction[] = [];
    const { settings, nodes } = solution;
    
    // Get basic info
    const numPlayers = settings.handdata.stacks.length;
    const playerPositions = getPlayerPositions(numPlayers);
    const bigBlind = Math.max(settings.handdata.blinds[0], settings.handdata.blinds[1]);
    const stacks = [...settings.handdata.stacks];
    
    // Build path from root to target
    const path = buildNodePath(nodes, targetNodeId);
    
    console.log('🎬 Building hand history:');
    console.log('  Solution:', solution.id);
    console.log('  Nodes loaded:', nodes.size);
    console.log('  Target node:', targetNodeId);
    console.log('  Path found:', path);
    console.log('  Has node 0:', nodes.has(0));
    console.log('  Has target node:', nodes.has(targetNodeId));
    
    // Track current street
    let currentStreet: 'Preflop' | 'Flop' | 'Turn' | 'River' = 'Preflop';
    
    // Navigate through path and extract actions
    for (let i = 0; i < path.length - 1; i++) {
        const currentNodeId = path[i];
        const nextNodeId = path[i + 1];
        
        const node = nodes.get(currentNodeId);
        if (!node) {
            console.error(`❌ Node ${currentNodeId} not found when building history`);
            continue;
        }
        
        // Update street if changed
        const streetName = getStreetName(node.street);
        if (streetName !== currentStreet) {
            currentStreet = streetName;
        }
        
        // Find which action leads to next node
        const actionTaken = node.actions.find(a => a.node === nextNodeId);
        if (!actionTaken) {
            console.error(`❌ No action found leading from ${currentNodeId} to ${nextNodeId}`);
            continue;
        }
        
        // Get player info
        const playerIndex = node.player;
        const playerName = playerPositions[playerIndex] || `P${playerIndex + 1}`;
        const playerStack = stacks[playerIndex];
        
        console.log(`  📊 ${playerName} action:`, {
            type: actionTaken.type,
            amount: actionTaken.amount,
            playerStack,
            amountBB: (actionTaken.amount / 100) / (bigBlind / 100),
            stackBB: (playerStack / 100) / (bigBlind / 100),
            ratio: (actionTaken.amount / playerStack).toFixed(3)
        });
        
        // Build action description
        const actionDescription = getActionDescription(
            actionTaken,
            bigBlind,
            playerStack,
            displayMode
        );
        
        // Calculate amount in BB if applicable
        let amountBB: number | undefined;
        if (actionTaken.amount > 0) {
            amountBB = actionTaken.amount / 100 / (displayMode === 'bb' ? bigBlind / 100 : bigBlind);
        }
        
        // Update stack after action (reduce by amount committed)
        // This ensures subsequent players see correct stacks for all-in detection
        if (actionTaken.type === 'R' || actionTaken.type === 'C') {
            stacks[playerIndex] = Math.max(0, stacks[playerIndex] - actionTaken.amount);
        }
        
        // Add to history
        actions.push({
            position: playerIndex,
            playerName,
            action: actionDescription,
            amount: actionTaken.amount,
            amountBB,
            street: currentStreet,
            timestamp: Date.now() + i * 100 // Stagger for animations
        });
        
        console.log(`  ${playerName}: ${actionDescription} (Street: ${currentStreet}, Remaining stack: ${stacks[playerIndex]})`);
    }
    
    return {
        actions,
        currentStreet
    };
};

/**
 * Filter actions by street
 */
export const filterActionsByStreet = (
    history: HandHistoryData,
    street: 'Preflop' | 'Flop' | 'Turn' | 'River'
): HandHistoryAction[] => {
    return history.actions.filter(a => a.street === street);
};

/**
 * Get latest action for each player
 */
export const getLatestPlayerActions = (
    history: HandHistoryData
): Map<number, HandHistoryAction> => {
    const latestActions = new Map<number, HandHistoryAction>();
    
    for (const action of history.actions) {
        latestActions.set(action.position, action);
    }
    
    return latestActions;
};
