import React from 'react';
import type { NodeData, SettingsData } from '../types.ts';
import { getPlayerPositions } from '../lib/pokerUtils.ts';

interface PokerTableVisualProps {
    currentNode: NodeData;
    settings: SettingsData;
    bigBlind: number;
    displayMode: 'bb' | 'chips';
}

export const PokerTableVisual: React.FC<PokerTableVisualProps> = ({
    currentNode,
    settings,
    bigBlind,
    displayMode
}) => {
    const { stacks, bounties } = settings.handdata;
    const numPlayers = stacks.length;
    const positions = getPlayerPositions(numPlayers);

    // Posições dos jogadores ao redor da mesa (em porcentagem)
    const getPlayerPosition = (index: number, total: number): { top: string; left: string } => {
        // Distribuir jogadores ao redor da mesa elíptica
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Começar do topo
        
        // Raios da elipse (ajustados para a mesa)
        const radiusX = 42; // Horizontal
        const radiusY = 35; // Vertical
        
        const x = 50 + radiusX * Math.cos(angle);
        const y = 50 + radiusY * Math.sin(angle);
        
        return {
            top: `${y}%`,
            left: `${x}%`
        };
    };

    const formatStack = (stack: number): string => {
        if (displayMode === 'bb') {
            const stackBB = bigBlind > 0 ? (stack / bigBlind).toFixed(1) : '0';
            return `${stackBB}bb`;
        }
        return stack.toLocaleString();
    };

    const formatBounty = (bounty: number): string => {
        return `$${bounty.toFixed(2)}`;
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Mesa de poker */}
            <div className="relative w-full max-w-5xl aspect-[16/10]">
                <img 
                    src="/trainer/table.png" 
                    alt="Poker Table" 
                    className="w-full h-full object-contain"
                />
                
                {/* Players ao redor da mesa */}
                {stacks.map((stack, index) => {
                    const pos = getPlayerPosition(index, numPlayers);
                    const isCurrentPlayer = index === currentNode.player;
                    const position = positions[index];
                    const bounty = bounties?.[index] || 0;
                    
                    return (
                        <div
                            key={index}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{ top: pos.top, left: pos.left }}
                        >
                            {/* Card do jogador */}
                            <div className={`
                                relative flex flex-col items-center gap-2 p-3 rounded-xl
                                ${isCurrentPlayer 
                                    ? 'bg-gradient-to-br from-teal-500/30 to-purple-500/30 border-2 border-teal-400 shadow-lg shadow-teal-500/50' 
                                    : 'bg-black/60 border border-gray-600'
                                }
                                backdrop-blur-sm min-w-[120px]
                            `}>
                                {/* Posição */}
                                <div className={`
                                    text-xs font-bold px-2 py-1 rounded-full
                                    ${isCurrentPlayer ? 'bg-teal-400 text-black' : 'bg-gray-700 text-gray-300'}
                                `}>
                                    {position}
                                </div>
                                
                                {/* Stack */}
                                <div className="flex flex-col items-center gap-1">
                                    {/* Ícone de fichas */}
                                    <div className="flex items-center gap-1">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-yellow-300 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-white">$</span>
                                        </div>
                                        <span className={`
                                            text-sm font-bold
                                            ${isCurrentPlayer ? 'text-white' : 'text-gray-200'}
                                        `}>
                                            {formatStack(stack)}
                                        </span>
                                    </div>
                                    
                                    {/* Bounty (se houver) */}
                                    {bounty > 0 && (
                                        <div className="flex items-center gap-1 bg-purple-600/80 px-2 py-0.5 rounded-full">
                                            <svg className="w-3 h-3 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-[10px] font-bold text-white">
                                                {formatBounty(bounty)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Indicador de ação atual */}
                                {isCurrentPlayer && (
                                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-teal-400 rounded-full animate-pulse" />
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Pot no centro (se houver) */}
                {currentNode.pot > 0 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="bg-black/70 backdrop-blur-sm border-2 border-yellow-500 rounded-lg px-4 py-2 shadow-lg shadow-yellow-500/30">
                            <div className="text-center">
                                <div className="text-xs text-gray-400 font-semibold">POT</div>
                                <div className="text-lg font-bold text-yellow-400">
                                    {displayMode === 'bb' 
                                        ? `${(currentNode.pot / bigBlind).toFixed(1)}bb`
                                        : currentNode.pot.toLocaleString()
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
