import React from 'react';
import type { NodeData } from '../../../types';
import type { SpotSimulation } from '../types';

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
    currentSpot: SpotSimulation;
    node: NodeData;
    userAction: string | null;
    isHandMarked: boolean;
    autoAdvance: boolean;
    tournamentMode: boolean;
    bigBlind: number;
    userId: string;
    onSetIsHandMarked: (marked: boolean) => void;
    onMarkHand: () => void;
    onUnmarkHand: () => void;
    onNextSpot: () => void;
    onStudy: () => void;
    // Tournament result props
    tournamentComplete?: {
        isBusted: boolean;
        isComplete: boolean;
        totalHandsPlayed: number;
        mistakes: number;
        accuracy: string;
        stages: Array<{
            phase: string;
            handsToPlay: number;
            displayName: string;
            playerCount?: number;
        }>;
        currentStageIndex: number;
        handsPlayedInStage: number;
        onRestart: () => void;
    };
    onBack: () => void;
}

export const TrainerFeedback: React.FC<TrainerFeedbackProps> = ({
    currentSpot,
    node,
    userAction,
    isHandMarked,
    autoAdvance,
    tournamentMode,
    bigBlind,
    userId,
    onSetIsHandMarked,
    onMarkHand,
    onUnmarkHand,
    onNextSpot,
    onStudy,
    tournamentComplete,
    onBack
}) => {
    console.log('🎨 TrainerFeedback render:', {
        hasSpot: !!currentSpot,
        hasNode: !!node,
        userAction,
        handName: currentSpot?.playerHandName
    });

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
                                        if (isHandMarked) {
                                            await onUnmarkHand();
                                        } else {
                                            await onMarkHand();
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
                                    onClick={onStudy}
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
                            
                            // Determinar se a escolha do usuário está correta
                            const isCorrectChoice = isUserChoice && (() => {
                                if (isPureStrategy) {
                                    // Pure strategy: apenas a ação GTO (maior frequência)
                                    return actionIndex === gtoActionIndex;
                                } else if (node.actions.length === 2) {
                                    // 2 ações: aceita apenas a ação com maior EV
                                    const maxEV = Math.max(...handData.evs);
                                    return ev >= maxEV - 0.001; // Tolerância para float
                                } else {
                                    // 3+ ações (mixed strategy): qualquer ação com freq > 0
                                    return hasFreq;
                                }
                            })();
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

                {/* Next Hand button - only show if auto-advance is OFF */}
                {!autoAdvance && !tournamentComplete && (
                    <button
                        onClick={onNextSpot}
                        className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2.5 rounded font-bold text-sm transition-all shadow-lg uppercase tracking-wide"
                    >
                        NEXT HAND
                    </button>
                )}
                
                {/* Auto-advance message - only show if auto-advance is ON and tournament not complete */}
                {autoAdvance && !tournamentComplete && (
                    <div className="w-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 px-4 py-2.5 rounded font-bold text-sm text-center">
                        Auto-advancing in 5s...
                    </div>
                )}
                
                {/* Tournament Results - Show when tournament ends */}
                {tournamentComplete && (
                    <div className="mt-6 p-6 bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700">
                        {/* Título */}
                        <div className="text-center mb-6">
                            {tournamentComplete.isBusted ? (
                                <>
                                    <div className="text-5xl mb-3">💥</div>
                                    <h2 className="text-3xl font-bold text-red-400 mb-1">BUSTED!</h2>
                                    <p className="text-gray-400">Você cometeu 10 erros</p>
                                </>
                            ) : (
                                <>
                                    <div className="text-5xl mb-3">🏆</div>
                                    <h2 className="text-3xl font-bold text-yellow-400 mb-1">TORNEIO COMPLETO!</h2>
                                    <p className="text-gray-400">Parabéns! Você completou todas as 45 mãos</p>
                                </>
                            )}
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                                <div className="text-gray-400 text-xs mb-1">Mãos Jogadas</div>
                                <div className="text-2xl font-bold text-white">{tournamentComplete.totalHandsPlayed}</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                                <div className="text-gray-400 text-xs mb-1">Precisão</div>
                                <div className="text-2xl font-bold text-green-400">{tournamentComplete.accuracy}%</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                                <div className="text-gray-400 text-xs mb-1">Acertos</div>
                                <div className="text-2xl font-bold text-green-400">
                                    {(tournamentComplete.totalHandsPlayed - tournamentComplete.mistakes).toFixed(1)}
                                </div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                                <div className="text-gray-400 text-xs mb-1">Erros</div>
                                <div className="text-2xl font-bold text-red-400">{tournamentComplete.mistakes.toFixed(1)}</div>
                            </div>
                        </div>

                        {/* Progresso por Estágio */}
                        <div className="mb-6">
                            <h3 className="text-white font-bold mb-3 text-sm">Estágio Alcançado</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {tournamentComplete.stages.map((stage, index) => {
                                    const reached = index < tournamentComplete.currentStageIndex || 
                                                  (index === tournamentComplete.currentStageIndex && tournamentComplete.isComplete);
                                    const current = index === tournamentComplete.currentStageIndex && !tournamentComplete.isComplete;
                                    
                                    return (
                                        <div 
                                            key={`${stage.phase}-${index}`}
                                            className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                                                reached 
                                                    ? 'bg-green-500/20 border border-green-500/50'
                                                    : current
                                                        ? 'bg-yellow-500/20 border border-yellow-500/50'
                                                        : 'bg-gray-700/20 border border-gray-600/50'
                                            }`}
                                        >
                                            <span className={`font-bold ${
                                                reached ? 'text-green-400' : current ? 'text-yellow-400' : 'text-gray-500'
                                            }`}>
                                                {stage.displayName}
                                            </span>
                                            <span className={`text-xs ${
                                                reached ? 'text-green-400' : current ? 'text-yellow-400' : 'text-gray-500'
                                            }`}>
                                                {reached ? '✓ Completo' : 
                                                 current ? `${tournamentComplete.handsPlayedInStage}/${stage.handsToPlay}` : 
                                                 `0/${stage.handsToPlay}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3">
                            <button
                                onClick={onBack}
                                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-sm transition-all"
                            >
                                Voltar ao Menu
                            </button>
                            <button
                                onClick={tournamentComplete.onRestart}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-lg font-bold text-sm transition-all"
                            >
                                Jogar Novamente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
