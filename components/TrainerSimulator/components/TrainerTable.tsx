import React from 'react';
import { PokerTableVisual } from '../../PokerTableVisual';
import { PlayerHand } from '../../PlayerHand';
import { TrainerPayoutInfo } from './TrainerPayoutInfo';
import { HandHistoryPanel } from './HandHistoryPanel';
import { useHandHistory } from '../hooks/useHandHistory';
import { getInitialBounty } from '../utils/trainerHelpers';
import type { AppData, NodeData } from '../../../types';
import type { VillainAction } from '../types';

/**
 * TrainerTable Component
 * 
 * Renders the poker table with players, action buttons, hero cards, and Study button.
 * This is the main visual component for training sessions.
 * 
 * Features:
 * - HandHistoryPanel showing actions leading to current spot
 * - PokerTableVisual with all players and their stacks
 * - Action buttons (Fold/Call/Check/Raise) positioned near hero
 * - Hero hand display with bounty (if applicable)
 * - Timebank progress bar (tournament mode)
 * - Display mode toggle (BB/Chips)
 * - Bounty display toggle ($/x)
 */

interface TrainerTableProps {
    solution: AppData;
    node: NodeData;
    nodeId?: number;  // Optional: node ID for hand history
    playerPosition: number;
    playerHand: string;
    playerHandName: string;
    displayMode: 'bb' | 'chips';
    showBountyInDollars: boolean;
    showFeedback: boolean;
    tournamentMode: boolean;
    timeLeft?: number;
    spotType: string;
    raiserPosition?: number;
    shoverPositions?: number[];
    villainActions?: VillainAction[];
    autoAdvance: boolean;
    onCheckAnswer: (actionName: string) => void;
    onToggleDisplayMode: () => void;
    onToggleBountyDisplay: () => void;
    onToggleAutoAdvance: () => void;
    onStudy?: () => void;
}

export const TrainerTable: React.FC<TrainerTableProps> = ({
    solution,
    node,
    nodeId,
    playerPosition,
    playerHand,
    playerHandName,
    displayMode,
    showBountyInDollars,
    showFeedback,
    tournamentMode,
    timeLeft,
    spotType,
    raiserPosition,
    shoverPositions,
    villainActions,
    autoAdvance,
    onCheckAnswer,
    onToggleDisplayMode,
    onToggleBountyDisplay,
    onToggleAutoAdvance,
    onStudy
}) => {
    const { settings } = solution;
    const bigBlind = settings.handdata.blinds.length > 1 
        ? Math.max(settings.handdata.blinds[0], settings.handdata.blinds[1]) 
        : (settings.handdata.blinds[0] || 0);
    
    // Find nodeId if not provided
    const actualNodeId = nodeId !== undefined ? nodeId : findNodeId(solution.nodes, node);
    
    // Build hand history using custom hook
    const { history } = useHandHistory({
        solution,
        nodeId: actualNodeId,
        displayMode
    });
    
    // Helper to find node ID from node reference
    function findNodeId(nodes: Map<number, NodeData>, targetNode: NodeData): number {
        for (const [id, n] of nodes.entries()) {
            if (n === targetNode) return id;
        }
        return 0;
    }
    
    // Helper function to format bounty display
    const formatBounty = (bounty: number): string => {
        const actualBounty = bounty / 2; // Bounty em dólares (PKO: metade vai para o prêmio)
        
        if (showBountyInDollars) {
            return `$${actualBounty.toFixed(2)}`;
        } else {
            const initialBounty = getInitialBounty(solution.fileName);
            const multiplier = actualBounty / initialBounty;
            return multiplier === 1 ? '1x' : `${multiplier.toFixed(1)}x`;
        }
    };

    return (
        <div className="flex gap-4 items-stretch">
            {/* Hand History Panel - Left Side - Same height as table */}
            <HandHistoryPanel 
                history={history}
                numPlayers={settings.handdata.stacks.length}
            />
            
            {/* Mesa visual - Center - Content defines height */}
            <div className="relative flex-shrink-0">
                {/* Mesa visual */}
                <div className="relative flex items-center justify-center bg-[#23272f] rounded-lg p-3 overflow-hidden">
                <PokerTableVisual 
                    currentNode={node}
                    settings={settings}
                    bigBlind={bigBlind}
                    displayMode={displayMode}
                    onToggleDisplayMode={onToggleDisplayMode}
                    solutionFileName={solution.fileName}
                    tournamentPhase={solution.tournamentPhase}
                    raiserPosition={raiserPosition}
                    shoverPositions={shoverPositions}
                    spotType={spotType}
                    villainActions={villainActions}
                    showBountyInDollars={showBountyInDollars}
                    onToggleBountyDisplay={onToggleBountyDisplay}
                />
            
                {/* Ações disponíveis - Estilo GGPoker (à direita do hero) */}
                {!showFeedback && (
                    <div className={`absolute bottom-9 left-1/2 transform flex z-30 justify-center items-center ${
                        node.actions.length <= 2 ? 'translate-x-[55%] gap-2' :
                        node.actions.length === 3 ? 'translate-x-[45%] gap-1.5' :
                        'translate-x-[35%] gap-1'
                    }`}>
                        {node.actions.map((action, index) => {
                            // Converte tipo para nome (incluindo valor para Raise)
                            let actionName: string;
                            if (action.type === 'F') {
                                actionName = 'Fold';
                            } else if (action.type === 'C') {
                                actionName = 'Call';
                            } else if (action.type === 'X') {
                                actionName = 'Check';
                            } else {
                                // Raise - inclui o valor em BB para diferenciar
                                const raiseBB = (action.amount / bigBlind).toFixed(1);
                                actionName = `Raise ${raiseBB}`;
                            }
                            
                            const actionColors: Record<string, string> = {
                                'Fold': 'bg-red-600 hover:bg-red-700',
                                'Call': 'bg-red-700 hover:bg-red-800',
                                'Check': 'bg-red-700 hover:bg-red-800'
                            };

                            const bgColor = actionName.startsWith('Raise') 
                                ? 'bg-red-700 hover:bg-red-800' 
                                : actionColors[actionName] || 'bg-red-700 hover:bg-red-800';
                            
                            // Ajustar tamanho dos botões baseado na quantidade para não sair da mesa
                            const buttonSize = node.actions.length <= 2 
                                ? 'px-4 py-3 min-w-[70px] min-h-[50px]'
                                : node.actions.length === 3
                                ? 'px-3.5 py-2.5 min-w-[65px] min-h-[48px]'
                                : 'px-3 py-2 min-w-[58px] min-h-[45px]';
                            
                            return (
                                <button
                                    key={`${actionName}-${index}`}
                                    onClick={() => onCheckAnswer(actionName)}
                                    className={`
                                        relative rounded-lg font-bold text-white
                                        ${bgColor}
                                        ${buttonSize}
                                        transition-all duration-200
                                        shadow-lg
                                        border border-white/40
                                        flex flex-col items-center justify-center gap-0.5
                                        overflow-hidden
                                    `}
                                    style={{
                                        backgroundImage: 'url(./trainer/action_button.png)',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    {/* Overlay para legibilidade */}
                                    <div className="absolute inset-0 bg-black/20" />
                                    
                                    {/* Texto */}
                                    <div className="relative z-10 flex flex-col items-center justify-center min-h-[32px]">
                                        {(() => {
                                            const textSize = 'text-xs';
                                            const subTextSize = 'text-[10px]';
                                            
                                            if (actionName === 'Fold') {
                                                return (
                                                    <>
                                                        <div className={`${textSize} font-bold`}>Fold</div>
                                                        <div className={`${subTextSize} font-semibold invisible`}>0 BB</div>
                                                    </>
                                                );
                                            } else if (actionName === 'Check') {
                                                return (
                                                    <>
                                                        <div className={`${textSize} font-bold`}>Check</div>
                                                        <div className={`${subTextSize} font-semibold invisible`}>0 BB</div>
                                                    </>
                                                );
                                            } else if (actionName === 'Call') {
                                                return (
                                                    <>
                                                        <div className={`${textSize} font-bold`}>Call</div>
                                                        <div className={`${subTextSize} font-semibold`}>{(action.amount / bigBlind).toFixed(1)} BB</div>
                                                    </>
                                                );
                                            } else {
                                                return (
                                                    <>
                                                        <div className={`${textSize} font-bold`}>Raise</div>
                                                        <div className={`${subTextSize} font-semibold`}>{(action.amount / bigBlind).toFixed(1)} BB</div>
                                                    </>
                                                );
                                            }
                                        })()}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
                
                {/* Mão do jogador no centro - estilo GGPoker */}
                <div className="absolute bottom-9 left-1/2 transform -translate-x-1/2">
                    <div className="flex flex-col items-center">
                        {/* Fichas do blind (se hero for SB ou BB) */}
                        {(() => {
                            const numPlayers = settings.handdata.stacks.length;
                            const bbPosition = numPlayers - 1;
                            const sbPosition = numPlayers === 2 ? 0 : numPlayers - 2;
                            const isBB = playerPosition === bbPosition;
                            const isSB = playerPosition === sbPosition;
                            const smallBlind = settings.handdata.blinds.length > 1 ? Math.min(settings.handdata.blinds[0], settings.handdata.blinds[1]) : (settings.handdata.blinds[0] / 2 || 0);
                            
                            if (!isBB && !isSB) return null;
                            
                            const blindAmount = isBB ? bigBlind : smallBlind;
                            
                            return (
                                <div className="mb-1.5 flex flex-col items-center gap-0.5">
                                    {/* Fichas empilhadas */}
                                    <div className="flex items-center gap-0.5">
                                        {/* Ficha roxa */}
                                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 border border-purple-300 shadow-md flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                        </div>
                                        {/* Ficha amarela (se BB) */}
                                        {isBB && (
                                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300 shadow-md flex items-center justify-center -ml-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Valor do blind */}
                                    <div className="bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-yellow-500/50">
                                        <span className="text-yellow-400 font-bold text-[10px] whitespace-nowrap">
                                            {displayMode === 'bb' 
                                                ? isBB 
                                                    ? '1 BB'  // BB sempre mostra "1 BB" sem decimais
                                                    : `${(blindAmount / bigBlind).toFixed(1)} BB`  // SB mostra com decimal
                                                : (blindAmount / 100).toLocaleString()
                                            }
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                        
                        {/* Bounty acima das cartas (se houver) */}
                        {settings.handdata.bounties && settings.handdata.bounties[playerPosition] > 0 && (
                            <div className="mb-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 px-2 py-1 rounded-full border border-yellow-400 relative z-10">
                                <span className="text-white font-bold text-[10px]">
                                    {formatBounty(settings.handdata.bounties[playerPosition])}
                                </span>
                            </div>
                        )}
                        
                        {/* Container relativo para posicionar cartas atrás do quadrado */}
                        <div className="relative flex flex-col items-center">
                            {/* Cartas - posicionadas atrás com z-index negativo e deslocadas para baixo */}
                            <div className="relative -mb-6 z-0">
                                <PlayerHand hand={playerHand} />
                            </div>
                            
                            {/* Nome do jogador e stack - na frente das cartas */}
                            <div 
                                onClick={onToggleDisplayMode}
                                className="bg-black/90 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-yellow-500 shadow-md min-w-[120px] cursor-pointer hover:bg-black/80 transition-colors relative z-10"
                            >
                                <div className="text-center">
                                    <div className="text-yellow-400 font-bold text-[10px] mb-0.5">Você</div>
                                    <div className="text-blue-400 font-bold text-xs">
                                        {(() => {
                                            const numPlayers = settings.handdata.stacks.length;
                                            const bbPosition = numPlayers - 1;
                                            const sbPosition = numPlayers === 2 ? 0 : numPlayers - 2;
                                            const isBB = playerPosition === bbPosition;
                                            const isSB = playerPosition === sbPosition;
                                            
                                            const ante = settings.handdata.blinds.length > 2 ? settings.handdata.blinds[2] : 0;
                                            const smallBlind = settings.handdata.blinds.length > 1 ? Math.min(settings.handdata.blinds[0], settings.handdata.blinds[1]) : (settings.handdata.blinds[0] / 2 || 0);
                                            
                                            let effectiveStack = settings.handdata.stacks[playerPosition] - ante;
                                            
                                            // Desconta blinds se hero for BB ou SB
                                            if (isBB) {
                                                effectiveStack -= bigBlind;
                                            } else if (isSB) {
                                                effectiveStack -= smallBlind;
                                            }
                                            
                                            // Garante que o stack nunca seja negativo
                                            effectiveStack = Math.max(0, effectiveStack);
                                            
                                            return displayMode === 'bb' 
                                                ? `${(effectiveStack / bigBlind).toFixed(1)} BB`
                                                : (effectiveStack / 100).toLocaleString();
                                        })()}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Timebank bar (apenas modo torneio) - FORA e ABAIXO do quadrado, colado */}
                            {tournamentMode && !showFeedback && timeLeft !== undefined && (
                                <div className="w-[120px] px-2.5 mt-0.5">
                                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ease-linear ${
                                                timeLeft <= 4 ? 'bg-red-500' :
                                                timeLeft <= 8 ? 'bg-yellow-400' :
                                                'bg-green-500'
                                            }`}
                                            style={{ width: `${(timeLeft / 15) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                </div>
            </div>
            {/* Fim do container da mesa */}
            
            {/* Settings Panel - Right Side - Same height as table */}
            <div className="flex-shrink-0 w-64 flex flex-col">
                <div className="bg-[#23272f] rounded-lg p-3 space-y-2 flex flex-col h-full">
                    <h3 className="text-white font-bold text-base mb-1">Settings</h3>
                
                {/* Show in big blinds */}
                <div className="flex items-center justify-between py-1.5">
                    <span className="text-gray-300 text-sm">Show in big blinds</span>
                    <button
                        onClick={onToggleDisplayMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            displayMode === 'bb' ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                displayMode === 'bb' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
                
                {/* Show bounty as $ */}
                <div className="flex items-center justify-between py-1.5">
                    <span className="text-gray-300 text-sm">Show bounty as $</span>
                    <button
                        onClick={onToggleBountyDisplay}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            showBountyInDollars ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                showBountyInDollars ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
                
                {/* Auto advance next hand */}
                <div className="flex items-center justify-between py-1.5">
                    <span className="text-gray-300 text-sm">Auto advance next hand</span>
                    <button
                        onClick={onToggleAutoAdvance}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            autoAdvance ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                autoAdvance ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
                
                {/* Divider */}
                <div className="border-t border-gray-700 my-1.5" />
                
                {/* Payouts and Tournament Info - Flex-grow to fill remaining space */}
                <div className="flex-grow overflow-auto">
                    <TrainerPayoutInfo 
                        prizes={solution.settings.eqmodel?.structure?.prizes}
                        solutionFileName={solution.fileName}
                    />
                </div>
            </div>
            </div>
        </div>
    );
};
