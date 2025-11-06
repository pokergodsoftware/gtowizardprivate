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

    // Tooltip for tournament chart points
    const [tooltip, setTooltip] = React.useState<{ x: number; y: number; content: string } | null>(null);

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

                        {/* Stage Progress — Chart view (per-tournament) */}
                        <div className="mb-3">
                            <h3 className="text-white font-bold mb-3 text-sm">Stage Performance (This Tournament)</h3>
                            <div className="overflow-x-auto -mx-4 px-4">
                                <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600 relative">
                                    {(() => {
                                        // Build phases data from the tournamentComplete payload
                                        const phasesAll = tournamentComplete.stages.map((stage, idx) => {
                                            const stat = tournamentComplete.stageStats[idx] || { handsPlayed: 0, livesLost: 0 };
                                            const total = stat.handsPlayed || 0;
                                            const livesLost = stat.livesLost || 0;
                                            const correct = Math.max(0, total - livesLost);
                                            const accuracy = total > 0 ? (correct / total) * 100 : 0;
                                            return {
                                                key: `${stage.phase}-${idx}`,
                                                // Build labelTop: replace Field/Table with abbreviations, convert '-handed' to 'p'
                                                // and remove leading 'Final' so labels like 'Final Table (7-handed)' become 'FT (7p)'.
                                                labelTop: (() => {
                                                    let s = stage.displayName.replace('Field', '').replace('Table', 'FT').replace('-handed', 'p').trim();
                                                    if (/^Final\b/i.test(s)) s = s.replace(/^Final\s*/i, '').trim();
                                                    return s;
                                                })(),
                                                labelBottom: `${correct}/${total}`,
                                                accuracy,
                                                points: correct,
                                                total,
                                                correct
                                            };
                                        });

                                        // Exclude stages where the user didn't respond (total === 0)
                                        const phases = phasesAll.filter(p => p.total > 0);

                                        // If no stages have data, show a friendly message
                                        if (phases.length === 0) {
                                            return (
                                                <div className="text-center text-gray-400 py-6">No stage data available for this tournament.</div>
                                            );
                                        }

                                        // Chart sizing and padding (adapted from UserProfile)
                                        const pointRadius = 5;
                                        const chartHeight = 360;
                                        const paddingLeft = 80;
                                        const paddingRight = 80;
                                        // Increase per-phase horizontal spacing by 25% over the current 60px (60 * 1.25 = 75)
                                        const chartWidth = Math.max(600, paddingLeft + paddingRight + phases.length * 60);
                                        const paddingTop = 28;
                                        const paddingBottom = 96;
                                        const plotHeight = chartHeight - paddingTop - paddingBottom;

                                        const yFor = (value: number) => paddingTop + (1 - value / 100) * plotHeight;

                                        const points = phases.map((p, i) => {
                                            const step = (chartWidth - paddingLeft - paddingRight) / Math.max(1, phases.length - 1);
                                            const x = paddingLeft + step * i;
                                            const y = yFor(p.accuracy);
                                            return { x, y, ...p };
                                        });

                                        const linePath = points.map(pt => `${pt.x},${pt.y}`).join(' ');

                                        return (
                                            <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="mx-auto">
                                                {[0,25,50,75,100].map(t => {
                                                    const y = yFor(t);
                                                    const yLabelX = Math.max(8, paddingLeft - 56);
                                                    return (
                                                        <g key={t}>
                                                            <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#374151" strokeWidth={1} opacity={0.6} />
                                                            <text x={yLabelX} y={y + 6} fill="#9ca3af" fontSize={15}>{t}%</text>
                                                        </g>
                                                    );
                                                })}

                                                {points.map((pt) => (
                                                    <g key={pt.key}>
                                                        <line x1={pt.x} y1={chartHeight - paddingBottom + 6} x2={pt.x} y2={chartHeight - paddingBottom + 2} stroke="#4b5563" strokeWidth={1} />
                                                        {/* Labels: font sizes reduced by 50% */}
                                                        <text x={pt.x} y={chartHeight - paddingBottom + 28} fill="#cbd5e1" fontSize={13} fontWeight={600} textAnchor="middle">{pt.labelTop}</text>
                                                        <text x={pt.x} y={chartHeight - paddingBottom + 52} fill="#9ca3af" fontSize={12} textAnchor="middle">{pt.labelBottom}</text>
                                                    </g>
                                                ))}

                                                <polyline points={linePath} fill="none" stroke="#60a5fa" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

                                                {points.map(pt => (
                                                    <g key={`pt-${pt.key}`}>
                                                        <circle
                                                            cx={pt.x}
                                                            cy={pt.y}
                                                            r={pointRadius}
                                                            fill="#1f2937"
                                                            stroke="#60a5fa"
                                                            strokeWidth={2}
                                                            style={{ cursor: 'pointer' }}
                                                            onMouseEnter={() => setTooltip({ x: pt.x, y: pt.y, content: `${pt.labelTop}: ${pt.accuracy.toFixed(1)}% — ${pt.correct}/${pt.total} pts` })}
                                                            onMouseLeave={() => setTooltip(null)}
                                                        />
                                                        <text x={pt.x} y={pt.y - 12} fill="#fff" fontSize={16} fontWeight={700} textAnchor="middle">{pt.accuracy.toFixed(0)}%</text>
                                                    </g>
                                                ))}
                                            </svg>
                                        );
                                    })()}

                                    {/* Tooltip (absolute within wrapper) */}
                                    {tooltip && (
                                        <div
                                            className="absolute z-50 bg-gray-900 text-white text-sm rounded px-3 py-2 shadow-lg pointer-events-none"
                                            style={{ left: tooltip.x, top: Math.max(8, tooltip.y - 48), transform: 'translateX(-50%)' }}
                                        >
                                            {tooltip.content}
                                        </div>
                                    )}
                                </div>
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
