
import React, { useMemo, useRef, useEffect } from 'react';
import type { NodeData, SettingsData } from '../types.ts';
import { getPlayerPositions, getActionName, formatChips, calculateBountyMultiplier } from '../lib/pokerUtils.ts';

interface HeaderProps {
    currentNodeId: number;
    currentNode: NodeData;
    bigBlind: number;
    settings: SettingsData;
    allNodes: Map<number, NodeData>;
    onNodeChange: (nodeId: number) => void;
    parentMap: Map<number, number>;
    pathNodeIds: number[];
    displayMode: 'bb' | 'chips';
    tournamentPhase: string;
    onChangeSolution: () => void;
    loadMultipleNodes: (nodeIds: number[]) => Promise<void>;
    fileName?: string;
}


interface PlayerStrategyCardProps {
    playerIndex: number;
    isActive: boolean;
    settings: SettingsData;
    nodeForActions?: NodeData;
    bigBlind: number;
    onClick: () => void;
    onNodeChange: (nodeId: number) => void;
    highlightedActionNodeId: number | undefined;
    displayMode: 'bb' | 'chips';
    fileName?: string;
}


const PlayerStrategyCard = React.forwardRef<HTMLDivElement, PlayerStrategyCardProps>(({ playerIndex, isActive, settings, nodeForActions, bigBlind, onClick, onNodeChange, highlightedActionNodeId, displayMode, fileName }, ref) => {
    
    const { stacks, bounties } = settings.handdata;
    const numPlayers = stacks.length;
    const positions = getPlayerPositions(numPlayers);
    
    const stack = stacks[playerIndex];
    const bounty = bounties[playerIndex] || 0;
    const position = positions[playerIndex];
    const adjustedBigBlind = displayMode === 'bb' ? bigBlind / 100 : bigBlind;
    const stackInBB = adjustedBigBlind > 0 ? ((stack / 100) / adjustedBigBlind).toFixed(1) : '0';
    const bountyAmount = bounty / 2;
    const bountyInBB = adjustedBigBlind > 0 ? ((bountyAmount / 100) / adjustedBigBlind).toFixed(1) : '0';

    // Determine text size based on the number of actions
    const numActions = nodeForActions?.actions.length || 0;
    let textSizeClass = 'text-sm';
    let paddingClass = 'px-2 py-1';
    let spaceClass = 'space-y-0.5';
    
    if (numActions > 8) {
        textSizeClass = 'text-[10px]';
        paddingClass = 'px-2 py-0.5';
        spaceClass = 'space-y-0';
    } else if (numActions > 6) {
        textSizeClass = 'text-xs';
        paddingClass = 'px-2 py-0.5';
        spaceClass = 'space-y-0';
    } else if (numActions > 4) {
        textSizeClass = 'text-sm';
        paddingClass = 'px-2 py-1';
        spaceClass = 'space-y-0.5';
    }

    return (
        <div 
            ref={ref}
            className={`flex-shrink-0 w-48 h-[180px] p-3 rounded-lg border-2 ${isActive ? 'border-teal-400 bg-[#3c414b]' : 'border-transparent bg-[#353a42]'} transition-colors duration-200 cursor-pointer hover:border-teal-500/50 flex flex-col`}
            onClick={onClick}
        >
            <div className="flex-shrink-0 mb-2">
                <span className="font-bold text-lg text-gray-200">{position}</span>
                <div className="text-xs text-gray-400">{displayMode === 'bb' ? `${stackInBB}bb` : formatChips(stack / 100)}</div>
            </div>

            <div className={`${spaceClass} text-gray-100 flex-1`}>
                {nodeForActions && nodeForActions.actions.map((action, index) => {
                     const playerStack = stacks[nodeForActions.player];
                     const actionName = getActionName(action, bigBlind, playerStack, displayMode, settings.handdata.stacks);
                     const isClickable = typeof action.node === 'number';
                     const isSelectedAction = isClickable && action.node === highlightedActionNodeId;

                     const handleActionClick = (e: React.MouseEvent) => {
                         e.stopPropagation(); // Prevent card's onClick from firing
                         if (isClickable) {
                             onNodeChange(action.node as number);
                         }
                     };

                    return (
                       <div 
                           key={index} 
                           className={`
                                ${paddingClass} rounded transition-colors duration-150 font-medium ${textSizeClass}
                                ${isSelectedAction ? 'bg-black/50' : ''}
                                ${isClickable && !isSelectedAction ? 'hover:bg-black/25' : ''}
                                ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed text-gray-400'}
                           `}
                           onClick={handleActionClick}
                       >
                           {actionName}
                       </div>
                    );
                })}
            </div>
        </div>
    );
});
PlayerStrategyCard.displayName = "PlayerStrategyCard";


export const Header: React.FC<HeaderProps> = ({ currentNodeId, currentNode, bigBlind, settings, allNodes, onNodeChange, parentMap, pathNodeIds, displayMode, tournamentPhase, onChangeSolution, loadMultipleNodes, fileName }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activePlayerCardRef = useRef<HTMLDivElement>(null);

    const solutionSummary = useMemo(() => {
        const stacks = settings.handdata.stacks;
        const totalStack = stacks.reduce((sum, stack) => sum + stack, 0);
        const avgStack = totalStack / stacks.length;
        const avgStackBB = bigBlind > 0 ? (avgStack / bigBlind).toFixed(0) : '0';
        const numPlayers = stacks.length;
        
        return {
            avgStackBB,
            numPlayers
        };
    }, [settings, bigBlind]);

    useEffect(() => {
        setTimeout(() => {
            if (activePlayerCardRef.current) {
                activePlayerCardRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                });
            }
        }, 100);
    }, [currentNodeId]);

    // Load ALL first nodes of the players to show all available actions
    useEffect(() => {
        const numPlayers = settings.handdata.stacks.length;
        
    // Load nodes 0 up to numPlayers-1 (usually the first nodes for each player)
        const nodesToLoad: number[] = [];
        for (let i = 0; i < numPlayers; i++) {
            if (!allNodes.has(i)) {
                nodesToLoad.push(i);
            }
        }

    // Load nodes if necessary
        if (nodesToLoad.length > 0) {
            console.log(`📦 Loading first nodes for all players: [${nodesToLoad.join(', ')}]`);
            loadMultipleNodes(nodesToLoad);
        }
    }, [allNodes, settings.handdata.stacks, loadMultipleNodes]);

    // Load next nodes when currentNode changes (depth navigation)
    useEffect(() => {
        if (!currentNode) return;
        
        const nodesToLoad: number[] = [];
        const visited = new Set<number>();
        const queue: number[] = [];
        
    // Enqueue all child nodes of the current node
        currentNode.actions.forEach(action => {
            if (typeof action.node === 'number') {
                queue.push(action.node);
            }
        });
        
    // Limited BFS to load nodes until all players are found
        const numPlayers = settings.handdata.stacks.length;
        const foundPlayers = new Set<number>();
        
        while (queue.length > 0 && foundPlayers.size < numPlayers) {
            const nodeId = queue.shift()!;
            
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);
            
                // Add to the list of nodes to load
            if (!allNodes.has(nodeId)) {
                nodesToLoad.push(nodeId);
            }
            
            const node = allNodes.get(nodeId);
            if (node) {
                foundPlayers.add(node.player);
                
                // If some players are still missing, continue exploring
                if (foundPlayers.size < numPlayers && node.actions.length > 0) {
                    const firstAction = node.actions[0];
                    if (typeof firstAction.node === 'number') {
                        queue.push(firstAction.node);
                    }
                }
            }
        }
        
        if (nodesToLoad.length > 0) {
            console.log(`📦 Loading next nodes (BFS): [${nodesToLoad.join(', ')}]`);
            loadMultipleNodes(nodesToLoad);
        }
    }, [currentNode, allNodes, loadMultipleNodes, settings.handdata.stacks]);
    
    const pathSuccessorMap = useMemo(() => {
        const map = new Map<number, number>();
        for (let i = 0; i < pathNodeIds.length - 1; i++) {
            map.set(pathNodeIds[i], pathNodeIds[i+1]);
        }
        return map;
    }, [pathNodeIds]);

    // Create the list of all players showing their cards
    const allPlayerCards = useMemo(() => {
        const numPlayers = settings.handdata.stacks.length;
        const cards: Array<{ playerIndex: number; nodeId: number; showAllActions: boolean }> = [];
        
    // Create a map of which node each player is acting on in the current path
        const playerToNodeMap = new Map<number, number>();
        pathNodeIds.forEach(nodeId => {
            const node = allNodes.get(nodeId);
            if (node) {
                playerToNodeMap.set(node.player, nodeId);
            }
        });
        
    // Find next available nodes for players who haven't acted yet
    // Walk the tree following the first action to find all players
        const nextNodesMap = new Map<number, number>();
        if (currentNode) {
            const visited = new Set<number>();
            const queue: number[] = [];
            
                    // Add all child nodes of the current node to the queue
            currentNode.actions.forEach(action => {
                if (typeof action.node === 'number') {
                    queue.push(action.node);
                }
            });
            
            // BFS to find the next nodes for each player
            while (queue.length > 0) {
                const nodeId = queue.shift()!;
                
                if (visited.has(nodeId)) continue;
                visited.add(nodeId);
                
                const node = allNodes.get(nodeId);
                if (!node) continue;
                
                // If this player hasn't acted yet and we don't have a node for them, record it
                if (!playerToNodeMap.has(node.player) && !nextNodesMap.has(node.player)) {
                    nextNodesMap.set(node.player, nodeId);
                }
                
                // If players are still missing, continue exploring
                const numPlayers = settings.handdata.stacks.length;
                const foundPlayers = playerToNodeMap.size + nextNodesMap.size;
                
                if (foundPlayers < numPlayers && node.actions.length > 0) {
                    // Add the first child to the queue to continue exploring
                    const firstAction = node.actions[0];
                    if (typeof firstAction.node === 'number' && !visited.has(firstAction.node)) {
                        queue.push(firstAction.node);
                    }
                }
            }
        }
        
        // For each player, determine which node to show
    // STRATEGY: Always show one card per player, prioritizing next nodes
        for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
            const nodeIdInPath = playerToNodeMap.get(playerIndex);
            const nextNodeId = nextNodesMap.get(playerIndex);
            
            // Priority:
            // 1. Next available node (child of the current node where the player hasn't acted yet)
            // 2. Current node (if it's the active player's node)
            // 3. Player's initial node (fallback)
            const nodeId = nextNodeId !== undefined 
                ? nextNodeId 
                : (nodeIdInPath !== undefined ? nodeIdInPath : playerIndex);
            
            cards.push({ 
                playerIndex, 
                nodeId,
                showAllActions: true 
            });
        }

        return cards;
    }, [settings.handdata.stacks, pathNodeIds, allNodes, currentNode]);

    return (
        <header className="bg-[#282c33] border-b border-gray-700">
            <div className="p-4 flex items-center justify-between">
                {/* Back button */}
                <button 
                    onClick={onChangeSolution}
                    className="px-4 py-2 bg-[#2d3238] hover:bg-[#353a42] text-white rounded-lg transition-colors font-semibold"
                >
                    ← Back
                </button>
                
                {/* Spot info - all aligned horizontally */}
                <div className="flex items-center gap-6 text-gray-200">
                    <div className="font-semibold text-base">
                        Avg stack {solutionSummary.avgStackBB}bb
                    </div>
                    <div className="font-semibold text-base">
                        {solutionSummary.numPlayers} Handed Table
                    </div>
                    <div className="font-semibold text-base">
                        {tournamentPhase}
                    </div>
                </div>
                
                {/* Empty spacer to balance the layout */}
                <div className="w-[100px]"></div>
            </div>
            <div ref={scrollContainerRef} className="p-2 flex items-center space-x-2 overflow-x-auto border-t border-black/20">
                 {allPlayerCards.map(({ playerIndex, nodeId, showAllActions }) => {
                     const nodeData = nodeId >= 0 ? allNodes.get(nodeId) : null;
                     const isActive = nodeId === currentNodeId;
                     const highlightedActionNodeId = nodeId >= 0 ? pathSuccessorMap.get(nodeId) : undefined;
                     
                     // If there's no valid node, create a fake node with only Fold
                     const displayNode = !showAllActions || !nodeData ? {
                         player: playerIndex,
                         street: 0,
                         children: 0,
                         sequence: [],
                         actions: [{ type: 'F' as const, amount: 0 }],
                         hands: {}
                     } : nodeData;

                     if (!displayNode) return null;
                     
                     return (
                        <PlayerStrategyCard
                            ref={isActive ? activePlayerCardRef : null}
                            key={`${playerIndex}-${nodeId}`}
                            playerIndex={playerIndex}
                            isActive={isActive}
                            settings={settings}
                            nodeForActions={displayNode}
                            bigBlind={bigBlind}
                            onClick={() => {
                                if (nodeId >= 0) {
                                    onNodeChange(nodeId);
                                }
                            }}
                            onNodeChange={onNodeChange}
                            highlightedActionNodeId={highlightedActionNodeId}
                            displayMode={displayMode}
                            fileName={fileName}
                        />
                     );
                 })}
            </div>
        </header>
    );
};