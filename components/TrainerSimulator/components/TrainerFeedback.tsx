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
        stageStats: Record<number, { handsPlayed: number; livesLost: number }>;
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

    // Log mount/unmount
    React.useEffect(() => {
        console.log('✅ TrainerFeedback MOUNTED');
        return () => {
            console.log('❌ TrainerFeedback UNMOUNTED');
        };
    }, []);

    return (
        <div className="bg-[#23272f] rounded-lg p-2.5 max-w-4xl mx-auto">
            <div className="space-y-1.5">
                {/* Result message */}
                {(() => {
                    const handData = node.hands[currentSpot.playerHandName];
                    console.log('🔍 TrainerFeedback handData check:', {
                        playerHandName: currentSpot.playerHandName,
                        hasHandData: !!handData,
                        availableHands: Object.keys(node.hands).slice(0, 10),
                        totalHands: Object.keys(node.hands).length
                    });
                    if (!handData) {
                        console.error('❌ TrainerFeedback: handData not found!', {
                            lookingFor: currentSpot.playerHandName,
                            availableHands: Object.keys(node.hands).slice(0, 10)
                        });
                        return (
                            <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4 text-center">
                                <div className="text-red-400 font-bold text-xl mb-2">❌ ERROR</div>
                                <div className="text-white text-sm">
                                    Hand "{currentSpot.playerHandName}" not found in node.
                                </div>
                                <div className="text-gray-400 text-xs mt-2">
                                    Combos: {currentSpot.playerHand} | Node: {currentSpot.nodeId}
                                </div>
                            </div>
                        );
                    }
                    
                    const userActionIndex = node.actions.findIndex((a, idx) => {
                        // For timeout, the action is always Fold
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
                    
                    // Check if it was a timeout
                    const isTimeout = userAction?.includes('TIMEOUT') || false;
                    
                    return (
                        <div className="flex items-center gap-2">
                            <div className={`flex-1 text-center py-2 rounded-lg font-black text-xl tracking-wider ${
                                isTimeout ? 'bg-orange-500/20 text-orange-400' :
                                isCorrect ? 'bg-teal-500/20 text-teal-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                                {isTimeout ? '⏰ TIMEOUT' : isCorrect ? 'CORRECT' : 'MISTAKE'}
                            </div>
                            
                            {/* MARK HAND and STUDY buttons */}
                            <div className="flex gap-3">
                                {/* MARK HAND button */}
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
                                
                                {/* STUDY button */}
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

                {/* Horizontal cards - GTO Wizard style */}
                <div className={`grid ${
                    node.actions.length <= 2 ? 'grid-cols-2 gap-3' :
                    node.actions.length === 3 ? 'grid-cols-3 gap-2' :
                    'grid-cols-4 gap-1.5'
                }`}>
                    {(() => {
                        const handData = node.hands[currentSpot.playerHandName];
                        if (!handData) return <div className="text-red-400 col-span-3">Error: Hand data not found</div>;
                        
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
                                // For timeout, the action is always Fold
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
                            
                            // Validation logic: Pure Strategy vs Mixed Strategy
                            const isPureStrategy = maxFreq >= 0.90;
                            const gtoActionIndex = handData.played.indexOf(maxFreq);
                            
                            // Determine whether the user's choice is correct
                            const isCorrectChoice = isUserChoice && (() => {
                                if (isPureStrategy) {
                                    // Pure strategy: only the GTO action (highest frequency)
                                    return actionIndex === gtoActionIndex;
                                } else if (node.actions.length === 2) {
                                    // 2 actions: accept only the action with the highest EV
                                    const maxEV = Math.max(...handData.evs);
                                    return ev >= maxEV - 0.001; // Tolerância para float
                                } else {
                                    // 3+ actions (mixed strategy): any action with freq > 0
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

                {/* Colored progress bar */}
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
                
                {/* Tournament Results - Show when tournament ends - COMPACT VERSION */}
                {tournamentComplete && (
                    <div className="mt-3 p-4 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700">
                        {/* Compact Title */}
                        <div className="text-center mb-4">
                                    {tournamentComplete.isBusted ? (
                                        <>
                                            <div className="text-4xl mb-2">💥</div>
                                            <h2 className="text-2xl font-bold text-red-400">BUSTED!</h2>
                                            <p className="text-sm text-gray-400 mt-1">Tournament ended</p>
                                        </>
                            ) : (
                                <>
                                    <div className="text-4xl mb-2">🏆</div>
                                    <h2 className="text-2xl font-bold text-yellow-400">COMPLETE!</h2>
                                        <p className="text-sm text-gray-400 mt-1">{tournamentComplete.totalHandsPlayed} hands played</p>
                                </>
                            )}
                        </div>

                        {/* Stage Progress - Candle (Vertical) Format - EXPANDED */}
                        <div className="mb-3">
                            <h3 className="text-white font-bold mb-3 text-sm">Stage Progress</h3>
                            <div 
                                className="flex gap-2 overflow-x-auto pb-2"
                                style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#4b5563 #1f2937'
                                }}
                            >
                                {tournamentComplete.stages.map((stage, index) => {
                                    const reached = index < tournamentComplete.currentStageIndex || 
                                                  (index === tournamentComplete.currentStageIndex && tournamentComplete.isComplete);
                                    const current = index === tournamentComplete.currentStageIndex && !tournamentComplete.isComplete;
                                    
                                    // Get stage statistics
                                    const stageStat = tournamentComplete.stageStats[index];
                                    const stageHandsPlayed = stageStat?.handsPlayed || 0;
                                    const stageLivesLost = stageStat?.livesLost || 0;
                                    
                                    // If no hands were played in this stage, don't render
                                    if (stageHandsPlayed === 0 && !current) {
                                        return null;
                                    }
                                    
                                    // Calculate performance
                                    const stageHands = stage.handsToPlay;
                                    const progress = reached ? 100 : (current ? (stageHandsPlayed / stageHands) * 100 : 0);
                                    
                                    // Calculate stage score
                                    const stageScore = stageHandsPlayed > 0 
                                        ? ((stageHandsPlayed - stageLivesLost) / stageHandsPlayed * 100).toFixed(0)
                                        : '0';
                                    
                                    // Definir cor baseado no status
                                    let statusColor = '';
                                    let statusIcon = '';
                                    let barColorFrom = '';
                                    let barColorTo = '';
                                    let bgColor = '';
                                    
                                    if (reached) {
                                        statusColor = 'text-teal-400';
                                        statusIcon = '✓';
                                        barColorFrom = '#14b8a6'; // teal-500
                                        barColorTo = '#0d9488';   // teal-600
                                        bgColor = 'bg-teal-500/10 border-teal-500/30';
                                    } else if (current) {
                                        statusColor = 'text-yellow-400';
                                        statusIcon = '⚠';
                                        barColorFrom = '#eab308'; // yellow-500
                                        barColorTo = '#ca8a04';   // yellow-600
                                        bgColor = 'bg-yellow-500/10 border-yellow-500/30';
                                    } else {
                                        statusColor = 'text-gray-500';
                                        statusIcon = '○';
                                        barColorFrom = '#4b5563'; // gray-600
                                        barColorTo = '#374151';   // gray-700
                                        bgColor = 'bg-gray-700/10 border-gray-600/30';
                                    }
                                    
                                    return (
                                        <div 
                                            key={`${stage.phase}-${index}`}
                                            className={`flex flex-col items-center min-w-[90px] ${bgColor} rounded-lg p-3 border`}
                                        >
                                            {/* Status icon at top */}
                                            <div className={`text-2xl mb-2 ${statusColor} font-bold`}>
                                                {statusIcon}
                                            </div>
                                            
                                            {/* Barra vertical (candle) - EXPANDIDA */}
                                            <div className="relative w-12 h-64 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50 mb-3">
                                                <div 
                                                    className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out"
                                                    style={{
                                                        height: `${progress}%`,
                                                        background: `linear-gradient(to top, ${barColorTo}, ${barColorFrom})`
                                                    }}
                                                />
                                            </div>
                                            
                                            {/* Stage name */}
                                            <div className="text-xs text-white font-bold text-center leading-tight max-w-[86px] line-clamp-2 mb-1">
                                                {stage.displayName.replace('Field', '').replace('Table', 'T').replace('-handed', 'p')}
                                            </div>
                                            
                                            {/* Progresso */}
                                            <div className={`text-xs ${statusColor} font-bold mb-2`}>
                                                {reached ? '✓' : current ? `${stageHandsPlayed}/${stageHands}` : `0/${stageHands}`}
                                            </div>
                                            
                                            {/* Lives Lost (vermelho) */}
                                            <div className="text-center mb-1">
                                                <div className="text-[9px] text-red-400 font-semibold">Lives Lost</div>
                                                <div className="text-sm text-red-400 font-bold">{stageLivesLost.toFixed(1)}</div>
                                            </div>
                                            
                                            {/* Score % (verde) */}
                                            <div className="text-center">
                                                <div className="text-[9px] text-teal-400 font-semibold">Score</div>
                                                <div className="text-sm text-teal-400 font-bold">{stageScore}%</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Correct Moves e Score % */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-teal-500/10 rounded-lg p-3 text-center border border-teal-500/30">
                                <div className="text-teal-400 text-xs mb-1 font-semibold">Correct Moves</div>
                                <div className="text-3xl font-bold text-teal-400">{(tournamentComplete.totalHandsPlayed - tournamentComplete.mistakes).toFixed(1)}</div>
                                <div className="text-[10px] text-gray-400 mt-1">of {tournamentComplete.totalHandsPlayed} hands</div>
                            </div>
                            <div className="bg-teal-500/10 rounded-lg p-3 text-center border border-teal-500/30">
                                <div className="text-teal-400 text-xs mb-1 font-semibold">Score</div>
                                <div className="text-3xl font-bold text-teal-400">{tournamentComplete.accuracy}%</div>
                                <div className="text-[10px] text-gray-400 mt-1">overall accuracy</div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={onBack}
                                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-sm transition-all"
                            >
                                Back to Menu
                            </button>
                            <button
                                onClick={tournamentComplete.onRestart}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-lg font-bold text-sm transition-all"
                            >
                                Play Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
