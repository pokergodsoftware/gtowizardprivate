import React from 'react';
import type { NodeData } from '../../../types';
import type { SpotSimulation } from '../types';
import type { MarkedHand } from '../../../utils/statsUtils';
import { saveMarkedHand } from '../../../utils/statsUtils';

/**
 * TrainerFeedback Component
 * 
 * Displays detailed feedback after user answers a training question.
 * Shows correctness, GTO frequencies, EV values, and action buttons.
 * 
 * Features:
 * - Correct/Incorrect/Timeout indicator
 * - Mark Hand button (save to favorites)
 * - Study button (opens in Solutions Viewer)
 * - Action cards with frequencies and EV
 * - Visual frequency bar
 * - Next Hand button
 */

interface TrainerFeedbackProps {
    show: boolean;
    currentSpot: SpotSimulation;
    node: NodeData;
    userAction: string | null;
    isHandMarked: boolean;
    autoAdvance: boolean;
    tournamentMode: boolean;
    bigBlind: number;
    userId: string;
    onSetIsHandMarked: (marked: boolean) => void;
    onNextSpot: () => void;
}

export const TrainerFeedback: React.FC<TrainerFeedbackProps> = ({
    show,
    currentSpot,
    node,
    userAction,
    isHandMarked,
    autoAdvance,
    tournamentMode,
    bigBlind,
    userId,
    onSetIsHandMarked,
    onNextSpot
}) => {
    if (!show) return null;

    return (
        <div className="bg-[#23272f] rounded-lg p-2.5 max-w-4xl mx-auto">
            <div className="space-y-1.5">
                {/* Mensagem de resultado */}
                {(() => {
                    const handData = node.hands[currentSpot.playerHandName];
                    if (!handData) return null;
                    
                    const userActionIndex = node.actions.findIndex((a, idx) => {
                        // Para timeout, a ação é sempre Fold
                        if (userAction?.includes('TIMEOUT')) {
                            return a.type === 'F';
                        }
                        if (a.type === 'F') return userAction === 'Fold';
                        if (a.type === 'C') return userAction === 'Call';
                        if (a.type === 'X') return userAction === 'Check';
                        if (a.type === 'R') {
                            const raiseBB = (a.amount / bigBlind).toFixed(1);
                            return userAction === `Raise ${raiseBB}`;
                        }
                        return false;
                    });
                    
                    const userActionFreq = userActionIndex >= 0 ? handData.played[userActionIndex] : 0;
                    const userActionEv = userActionIndex >= 0 && handData.evs ? handData.evs[userActionIndex] : undefined;
                    const maxFreq = Math.max(...handData.played);
                    const gtoActionIndex = handData.played.indexOf(maxFreq);
                    const isPureStrategy = maxFreq >= 0.90;
                    const isCorrect = isPureStrategy 
                        ? userActionIndex === gtoActionIndex
                        : userActionFreq > 0;
                    
                    // Verificar se foi timeout
                    const isTimeout = userAction?.includes('TIMEOUT') || false;
                    
                    return (
                        <div className="flex items-center gap-2">
                            <div className={`flex-1 text-center py-2 rounded-lg font-black text-xl tracking-wider ${
                                isTimeout ? 'bg-orange-500/20 text-orange-400' :
                                isCorrect ? 'bg-teal-500/20 text-teal-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                                {isTimeout ? '⏰ TIMEOUT' : isCorrect ? 'CORRECT' : 'MISTAKE'}
                            </div>
                            
                            {/* Botões MARK HAND e STUDY */}
                            <div className="flex gap-3">
                                {/* Botão MARK HAND */}
                                <button
                                    onClick={async () => {
                                        const newMarkedState = !isHandMarked;
                                        onSetIsHandMarked(newMarkedState);
                                        
                                        // Gerar ID único para a mão marcada (baseado em timestamp + nodeId)
                                        const handId = `${currentSpot.solution.id}_${currentSpot.nodeId}_${currentSpot.playerHand}_${Date.now()}`;
                                        
                                        if (newMarkedState) {
                                            // Marcar a mão
                                            const markedHand: MarkedHand = {
                                                id: handId,
                                                timestamp: Date.now(),
                                                solutionPath: currentSpot.solution.path || currentSpot.solution.id,
                                                nodeId: currentSpot.nodeId,
                                                hand: currentSpot.playerHandName,
                                                combo: currentSpot.playerHand,
                                                position: currentSpot.playerPosition,
                                                playerAction: userAction || 'N/A',
                                                isCorrect: isCorrect,
                                                ev: userActionEv,
                                                phase: currentSpot.solution.tournamentPhase
                                            };
                                            
                                            await saveMarkedHand(userId, markedHand);
                                            console.log('⭐ Hand marked:', markedHand);
                                        } else {
                                            // Desmarcar (precisaria buscar o ID correto, por enquanto só atualiza o estado)
                                            console.log('❌ Hand unmarked');
                                            // TODO: Implementar lógica de desmarcar baseado em critérios de busca
                                        }
                                    }}
                                    className={`${
                                        isHandMarked 
                                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 border-yellow-400/50' 
                                            : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border-gray-400/50'
                                    } text-white px-4 py-2 rounded-lg font-black text-xl tracking-wider transition-all shadow-lg border-2 whitespace-nowrap`}
                                >
                                    {isHandMarked ? '⭐ MARKED' : '☆ MARK HAND'}
                                </button>
                                
                                {/* Botão STUDY */}
                                <button
                                    onClick={() => {
                                        // Cria URL para o Solutions Library com o spot atual
                                        const baseUrl = window.location.origin + window.location.pathname;
                                        const params = new URLSearchParams();
                                        params.set('page', 'solutions');
                                        
                                        // Usa path se disponível, senão usa o id da solução
                                        const solutionPath = currentSpot.solution.path || currentSpot.solution.id;
                                        console.log('🔗 Study button - solution path:', solutionPath);
                                        console.log('🔗 Study button - solution id:', currentSpot.solution.id);
                                        
                                        params.set('solution', solutionPath);
                                        params.set('node', currentSpot.nodeId.toString());
                                        params.set('hand', currentSpot.playerHandName);
                                        
                                        const studyUrl = `${baseUrl}?${params.toString()}`;
                                        console.log('🔗 Opening study URL:', studyUrl);
                                        window.open(studyUrl, '_blank');
                                    }}
                                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg font-black text-xl tracking-wider transition-all shadow-lg border-2 border-purple-400/50 whitespace-nowrap"
                                >
                                    📚 STUDY
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {/* Cards horizontais estilo GTO Wizard */}
                <div className={`grid ${
                    node.actions.length <= 2 ? 'grid-cols-2 gap-3' :
                    node.actions.length === 3 ? 'grid-cols-3 gap-2' :
                    'grid-cols-4 gap-1.5'
                }`}>
                    {(() => {
                        const handData = node.hands[currentSpot.playerHandName];
                        if (!handData) return <div className="text-red-400 col-span-3">Erro: Dados da mão não encontrados</div>;
                        
                        return node.actions.map((action, actionIndex) => {
                            const freq = handData.played[actionIndex] || 0;
                            const percentage = (freq * 100).toFixed(1);
                            const ev = handData.evs[actionIndex] || 0;
                            const evBB = ev.toFixed(2);
                            
                            let actionName: string;
                            if (action.type === 'F') {
                                actionName = 'FOLD';
                            } else if (action.type === 'C') {
                                actionName = 'CALL';
                            } else if (action.type === 'X') {
                                actionName = 'CHECK';
                            } else {
                                const raiseBB = (action.amount / bigBlind).toFixed(0);
                                actionName = `RAISE ${raiseBB}`;
                            }
                            
                            const isUserChoice = (() => {
                                // Para timeout, a ação é sempre Fold
                                if (userAction?.includes('TIMEOUT')) {
                                    return action.type === 'F';
                                }
                                if (action.type === 'F') return userAction === 'Fold';
                                if (action.type === 'C') return userAction === 'Call';
                                if (action.type === 'X') return userAction === 'Check';
                                if (action.type === 'R') {
                                    const raiseBB = (action.amount / bigBlind).toFixed(1);
                                    return userAction === `Raise ${raiseBB}`;
                                }
                                return false;
                            })();
                            
                            const maxFreq = Math.max(...handData.played);
                            const isGTO = freq === maxFreq && freq > 0;
                            const hasFreq = freq > 0;
                            
                            // Lógica de validação: Pure Strategy vs Mixed Strategy
                            const isPureStrategy = maxFreq >= 0.90;
                            const gtoActionIndex = handData.played.indexOf(maxFreq);
                            const isCorrectChoice = isUserChoice && (isPureStrategy 
                                ? actionIndex === gtoActionIndex
                                : hasFreq);
                            const isWrongChoice = isUserChoice && !isCorrectChoice;
                            
                            return (
                                <div
                                    key={actionIndex}
                                    className={`border-2 rounded-lg p-2 ${
                                        isCorrectChoice ? 'bg-teal-500/10 border-teal-500' :
                                        isWrongChoice ? 'bg-red-500/10 border-red-500' :
                                        'bg-[#1a1d23] border-gray-700'
                                    }`}
                                >
                                    <div className="flex items-start gap-1.5 mb-1.5">
                                        {!hasFreq && (
                                            <div className="text-red-500 text-sm">⚠️</div>
                                        )}
                                        {isCorrectChoice && (
                                            <div className="text-teal-400 text-sm">✓</div>
                                        )}
                                        <div className="flex-1">
                                            <div className="text-white font-bold text-xs">{actionName}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold text-base">{percentage} %</div>
                                        <div className={`text-[10px] font-semibold ${
                                            parseFloat(evBB) >= 0 ? 'text-gray-400' : 'text-gray-400'
                                        }`}>
                                            {evBB} EV
                                        </div>
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>

                {/* Barra de progresso colorida */}
                {(() => {
                    const handData = node.hands[currentSpot.playerHandName];
                    if (!handData) return null;
                    
                    const actionColors = ['#a855f7', '#f97316', '#3b82f6', '#10b981'];
                    const labels: string[] = [];
                    
                    node.actions.forEach((action, idx) => {
                        const freq = handData.played[idx] || 0;
                        const percentage = (freq * 100).toFixed(1);
                        if (freq > 0) {
                            let actionName: string;
                            if (action.type === 'F') {
                                actionName = 'Fold';
                            } else if (action.type === 'C') {
                                actionName = 'Call';
                            } else if (action.type === 'X') {
                                actionName = 'Check';
                            } else {
                                const raiseBB = (action.amount / bigBlind).toFixed(0);
                                actionName = action.amount > 50 ? `Allin ${raiseBB}` : `Raise ${raiseBB}`;
                            }
                            labels.push(`${actionName} ${percentage}%`);
                        }
                    });
                    
                    return (
                        <div>
                            <div className="flex h-2.5 rounded-full overflow-hidden">
                                {node.actions.map((action, idx) => {
                                    const freq = handData.played[idx] || 0;
                                    const percentage = freq * 100;
                                    if (percentage === 0) return null;
                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: actionColors[idx % actionColors.length]
                                            }}
                                        />
                                    );
                                })}
                            </div>
                            <div className="text-center text-[10px] text-gray-400 mt-1.5">
                                {labels.join('  •  ')}
                            </div>
                        </div>
                    );
                })()}

                {!tournamentMode && (
                    <button
                        onClick={onNextSpot}
                        className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2.5 rounded font-bold text-sm transition-all shadow-lg uppercase tracking-wide"
                    >
                        NEXT HAND
                    </button>
                )}
                
                {tournamentMode && (
                    <div className="w-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 px-4 py-2.5 rounded font-bold text-sm text-center">
                        Auto-advancing in 5s...
                    </div>
                )}
            </div>
        </div>
    );
};
