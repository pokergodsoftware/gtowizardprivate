
import React, { useMemo, useRef, useEffect } from 'react';
import type { NodeData, SettingsData } from '../types.ts';
import { getPlayerPositions, getActionName, formatChips } from '../lib/pokerUtils.ts';

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
}


const PlayerStrategyCard = React.forwardRef<HTMLDivElement, PlayerStrategyCardProps>(({ playerIndex, isActive, settings, nodeForActions, bigBlind, onClick, onNodeChange, highlightedActionNodeId, displayMode }, ref) => {
    
    const { stacks, bounties } = settings.handdata;
    const numPlayers = stacks.length;
    const positions = getPlayerPositions(numPlayers);
    
    const stack = stacks[playerIndex];
    const bounty = bounties[playerIndex] || 0;
    const position = positions[playerIndex];
    const stackInBB = bigBlind > 0 ? (stack / bigBlind).toFixed(1) : '0';
    const bountyAmount = bounty / 2;
    const bountyInBB = bigBlind > 0 ? (bountyAmount / bigBlind).toFixed(1) : '0';


    return (
        <div 
            ref={ref}
            className={`flex-shrink-0 w-48 p-2 rounded-md border-2 ${isActive ? 'border-teal-400 bg-[#3c414b]' : 'border-transparent bg-[#353a42]'} transition-colors duration-200 cursor-pointer hover:border-teal-500/50`}
            onClick={onClick}
        >
            <div>
                <span className="font-bold text-base text-gray-200">{position}</span>
                <div className="text-xs text-gray-400">{displayMode === 'bb' ? `${stack.toLocaleString()} (~${stackInBB}bb)` : formatChips(stack)}</div>
            </div>
            
            {bounty > 0 && 
                <div className="flex items-center space-x-1 text-xs text-yellow-400 mt-1">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" clipRule="evenodd" />
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    </svg>
                    <span>{displayMode === 'bb' ? `${bountyAmount.toLocaleString()} (~${bountyInBB}bb)` : formatChips(bountyAmount)}</span>
                </div>
            }

            <div className="mt-2 space-y-1 text-sm text-gray-100">
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
                                p-1 rounded transition-colors duration-150 font-medium
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


export const Header: React.FC<HeaderProps> = ({ currentNodeId, currentNode, bigBlind, settings, allNodes, onNodeChange, parentMap, pathNodeIds, displayMode, tournamentPhase, onChangeSolution }) => {
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
    
    const pathSuccessorMap = useMemo(() => {
        const map = new Map<number, number>();
        for (let i = 0; i < pathNodeIds.length - 1; i++) {
            map.set(pathNodeIds[i], pathNodeIds[i+1]);
        }
        return map;
    }, [pathNodeIds]);

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
                 {pathNodeIds.map((nodeId) => {
                     const nodeData = allNodes.get(nodeId);
                     if (!nodeData) return null;

                     const playerIndex = nodeData.player;
                     const isActive = nodeId === currentNodeId;
                     const highlightedActionNodeId = pathSuccessorMap.get(nodeId);
                     
                     return (
                        <PlayerStrategyCard
                            ref={isActive ? activePlayerCardRef : null}
                            key={nodeId}
                            playerIndex={playerIndex}
                            isActive={isActive}
                            settings={settings}
                            nodeForActions={nodeData}
                            bigBlind={bigBlind}
                            onClick={() => onNodeChange(nodeId)}
                            onNodeChange={onNodeChange}
                            highlightedActionNodeId={highlightedActionNodeId}
                            displayMode={displayMode}
                        />
                     );
                 })}
            </div>
        </header>
    );
};