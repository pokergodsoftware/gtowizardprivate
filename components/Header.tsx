
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

    // Determinar tamanho do texto baseado no número de ações
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
        const type = settings.eqmodel.structure.bountyType ? "PKO" : "MTT"; // Simple heuristic
        const situation = settings.eqmodel.structure.name || "ICM"; // Fallback name

        return `${type} Avg. ${avgStackBB}bb • ${situation}`;

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

    // Carregar TODOS os primeiros nodes dos jogadores para mostrar todas as ações disponíveis
    useEffect(() => {
        const numPlayers = settings.handdata.stacks.length;
        
        // Carregar nodes 0 até numPlayers-1 (geralmente são os primeiros nodes de cada jogador)
        const nodesToLoad: number[] = [];
        for (let i = 0; i < numPlayers; i++) {
            if (!allNodes.has(i)) {
                nodesToLoad.push(i);
            }
        }

        // Carregar nodes se necessário
        if (nodesToLoad.length > 0) {
            console.log(`📦 Carregando primeiros nodes de todos os jogadores: [${nodesToLoad.join(', ')}]`);
            loadMultipleNodes(nodesToLoad);
        }
    }, [allNodes, settings.handdata.stacks, loadMultipleNodes]);

    // Carregar próximos nodes quando o currentNode muda (navegação em profundidade)
    useEffect(() => {
        if (!currentNode) return;
        
        const nodesToLoad: number[] = [];
        const visited = new Set<number>();
        const queue: number[] = [];
        
        // Adicionar todos os nodes filhos do node atual
        currentNode.actions.forEach(action => {
            if (typeof action.node === 'number') {
                queue.push(action.node);
            }
        });
        
        // BFS limitado para carregar nodes até encontrar todos os jogadores
        const numPlayers = settings.handdata.stacks.length;
        const foundPlayers = new Set<number>();
        
        while (queue.length > 0 && foundPlayers.size < numPlayers) {
            const nodeId = queue.shift()!;
            
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);
            
            // Adicionar à lista de nodes para carregar
            if (!allNodes.has(nodeId)) {
                nodesToLoad.push(nodeId);
            }
            
            const node = allNodes.get(nodeId);
            if (node) {
                foundPlayers.add(node.player);
                
                // Se ainda faltam jogadores, continuar explorando
                if (foundPlayers.size < numPlayers && node.actions.length > 0) {
                    const firstAction = node.actions[0];
                    if (typeof firstAction.node === 'number') {
                        queue.push(firstAction.node);
                    }
                }
            }
        }
        
        if (nodesToLoad.length > 0) {
            console.log(`📦 Carregando próximos nodes (BFS): [${nodesToLoad.join(', ')}]`);
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

    // Criar lista de todos os jogadores mostrando cards
    const allPlayerCards = useMemo(() => {
        const numPlayers = settings.handdata.stacks.length;
        const cards: Array<{ playerIndex: number; nodeId: number; showAllActions: boolean }> = [];
        
        // Criar mapa de qual node cada jogador está agindo no path atual
        const playerToNodeMap = new Map<number, number>();
        pathNodeIds.forEach(nodeId => {
            const node = allNodes.get(nodeId);
            if (node) {
                playerToNodeMap.set(node.player, nodeId);
            }
        });
        
        // Encontrar próximos nodes disponíveis para jogadores que ainda não agiram
        // Navegar pela árvore seguindo a primeira ação até encontrar todos os jogadores
        const nextNodesMap = new Map<number, number>();
        if (currentNode) {
            const visited = new Set<number>();
            const queue: number[] = [];
            
            // Adicionar todos os nodes filhos do node atual à fila
            currentNode.actions.forEach(action => {
                if (typeof action.node === 'number') {
                    queue.push(action.node);
                }
            });
            
            // BFS para encontrar os próximos nodes de cada jogador
            while (queue.length > 0) {
                const nodeId = queue.shift()!;
                
                if (visited.has(nodeId)) continue;
                visited.add(nodeId);
                
                const node = allNodes.get(nodeId);
                if (!node) continue;
                
                // Se este jogador ainda não agiu e não temos um node para ele, guardar
                if (!playerToNodeMap.has(node.player) && !nextNodesMap.has(node.player)) {
                    nextNodesMap.set(node.player, nodeId);
                }
                
                // Se ainda faltam jogadores, continuar explorando
                const numPlayers = settings.handdata.stacks.length;
                const foundPlayers = playerToNodeMap.size + nextNodesMap.size;
                
                if (foundPlayers < numPlayers && node.actions.length > 0) {
                    // Adicionar o primeiro filho à fila para continuar explorando
                    const firstAction = node.actions[0];
                    if (typeof firstAction.node === 'number' && !visited.has(firstAction.node)) {
                        queue.push(firstAction.node);
                    }
                }
            }
        }
        
        // Para cada jogador, determinar qual node mostrar
        for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
            const nodeIdInPath = playerToNodeMap.get(playerIndex);
            const nextNodeId = nextNodesMap.get(playerIndex);
            
            // Prioridade: 
            // 1. Node onde o jogador já agiu no path
            // 2. Próximo node disponível (filho do node atual)
            // 3. Node inicial do jogador
            const nodeId = nodeIdInPath !== undefined 
                ? nodeIdInPath 
                : (nextNodeId !== undefined ? nextNodeId : playerIndex);
            
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
            <div className="p-2 flex items-center gap-4">
                 <div className="flex-shrink-0">
                    <div className="font-bold text-gray-200">{solutionSummary}</div>
                    <ul className="flex items-center text-xs text-gray-400 list-disc list-inside">
                        <li className="ml-2">{tournamentPhase}</li>
                    </ul>
                </div>
                <button 
                    onClick={onChangeSolution}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#3c414b] text-gray-200 rounded-md hover:bg-[#4a505c] transition-colors"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.895.87l1.54-.653a1 1 0 0 1 1.21.363l1.18 2.045a1 1 0 0 1-.364 1.21l-1.323.882a7.04 7.04 0 0 1 0 1.648l1.323.882a1 1 0 0 1 .364 1.21l-1.18 2.045a1 1 0 0 1-1.21.363l-1.54-.653a6.993 6.993 0 0 1-1.895.87l-.331 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.895-.87l-1.54.653a1 1 0 0 1-1.21-.363L1.705 12.8a1 1 0 0 1 .364-1.21l1.323-.882a7.04 7.04 0 0 1 0-1.648L2.069 8.178a1 1 0 0 1-.364-1.21L2.885 4.923a1 1 0 0 1 1.21-.363l1.54.653a6.993 6.993 0 0 1 1.895-.87l.331-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                    </svg>
                    <span>Change</span>
                </button>
            </div>
            <div ref={scrollContainerRef} className="p-2 flex items-center space-x-2 overflow-x-auto border-t border-black/20">
                 {allPlayerCards.map(({ playerIndex, nodeId, showAllActions }) => {
                     const nodeData = nodeId >= 0 ? allNodes.get(nodeId) : null;
                     const isActive = nodeId === currentNodeId;
                     const highlightedActionNodeId = nodeId >= 0 ? pathSuccessorMap.get(nodeId) : undefined;
                     
                     // Se não tem node válido, criar um node fake com apenas Fold
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