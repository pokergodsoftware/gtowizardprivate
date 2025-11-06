import React, { useState, useEffect } from 'react';
import { SpotHistory, type SpotHistoryEntry } from './SpotHistory.tsx';
import { loadSpotHistory, loadUserStats as loadUserStatsUtil, loadMarkedHands, saveMarkedHand, removeMarkedHand, type MarkedHand } from '../utils/statsUtils.ts';

interface UserStats {
    totalSpots: number;
    correctSpots: number;
    totalPoints: number;
    tournamentsPlayed?: number;
    reachedFinalTable?: number;
    completedTournaments?: number;
    statsByPhase: {
        [phase: string]: {
            total: number;
            correct: number;
            points: number;
        };
    };
}

interface UserProfileProps {
    userId: string;
    username: string;
    onBack: () => void;
    showHistoryOnly?: boolean;
    showMarkedHandsOnly?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, username, onBack, showHistoryOnly = false, showMarkedHandsOnly = false }) => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [history, setHistory] = useState<SpotHistoryEntry[]>([]);
    const [markedHands, setMarkedHands] = useState<MarkedHand[]>([]);
    const [markedHandIds, setMarkedHandIds] = useState<Set<string>>(new Set());
    // Tooltip state for chart points
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

    useEffect(() => {
        loadUserStats();
        loadMarkedHandsData();
        if (showMarkedHandsOnly) {
            loadMarkedHandsDataAsHistory();
        } else {
            loadHistory();
        }
    }, [userId, showMarkedHandsOnly]);

    const loadMarkedHandsData = async () => {
        try {
            const marked = await loadMarkedHands(userId);
            setMarkedHands(marked);
            // Create a Set of IDs for quick lookup
            const ids = new Set(marked.map(m => m.id));
            setMarkedHandIds(ids);
            console.log(`✅ Loaded ${marked.length} marked hands`);
        } catch (error: any) {
            console.error('❌ Error loading marked hands:', error);
            setMarkedHands([]);
            setMarkedHandIds(new Set());
        }
    };

    const loadMarkedHandsDataAsHistory = async () => {
        try {
            const marked = await loadMarkedHands(userId);
            setMarkedHands(marked);
            
            // Convert MarkedHand to SpotHistoryEntry to display in the same table
            const convertedHistory: SpotHistoryEntry[] = marked.map(m => ({
                id: m.id,
                hand: m.hand,
                combo: m.combo,
                isCorrect: m.isCorrect,
                timestamp: m.timestamp,
                phase: m.phase,
                points: m.isCorrect ? 1 : 0,
                solutionPath: m.solutionPath,
                nodeId: m.nodeId,
                position: m.position,
                playerAction: m.playerAction,
                ev: m.ev
            }));
            setHistory(convertedHistory);
            console.log(`✅ Loaded ${convertedHistory.length} marked hands as history`);
        } catch (error: any) {
            console.error('❌ Error loading marked hands as history:', error);
            setHistory([]);
            setMarkedHands([]);
        }
    };

    const loadHistory = async () => {
        try {
            console.log('📜 Loading spot history for user:', userId);
            const userHistory = await loadSpotHistory(userId);
            setHistory(userHistory);
            console.log(`✅ Loaded ${userHistory.length} history entries`);
        } catch (error: any) {
            console.error('❌ Error loading history in UserProfile:', {
                error,
                message: error?.message,
                code: error?.code
            });
            // Continue with empty array - keeps the UI intact
            setHistory([]);
        }
    };

    const handleToggleMark = async (entry: SpotHistoryEntry) => {
        const isCurrentlyMarked = markedHandIds.has(entry.id);
        
        if (isCurrentlyMarked) {
            // Unmark
            await removeMarkedHand(userId, entry.id);
            console.log('❌ Hand unmarked:', entry.id);
            
            // If viewing the marked-hands page, remove it from the list
            if (showMarkedHandsOnly) {
                setHistory(prev => prev.filter(h => h.id !== entry.id));
                setMarkedHands(prev => prev.filter(h => h.id !== entry.id));
            }
        } else {
            // Mark - convert SpotHistoryEntry to MarkedHand
            const markedHand: MarkedHand = {
                id: entry.id,
                timestamp: entry.timestamp,
                solutionPath: entry.solutionPath || '',
                nodeId: entry.nodeId || 0,
                hand: entry.hand,
                combo: entry.combo || '',
                position: entry.position || 0,
                playerAction: entry.playerAction || 'N/A',
                isCorrect: entry.isCorrect,
                ev: entry.ev,
                phase: entry.phase
            };
            
            await saveMarkedHand(userId, markedHand);
            console.log('⭐ Hand marked:', entry.id);
        }
        
        // Reload the list of marked hands to update the ID Set
        await loadMarkedHandsData();
    };

    const loadUserStats = async () => {
        // Try loading stats (prefer Firebase)
        const loadedStats = await loadUserStatsUtil(userId);
        
        if (loadedStats) {
            setStats(loadedStats);
        } else {
            // Initialize empty stats
            const emptyStats: UserStats = {
                totalSpots: 0,
                correctSpots: 0,
                totalPoints: 0,
                statsByPhase: {}
            };
            setStats(emptyStats);
        }
    };

    const getAccuracyPercentage = () => {
        if (!stats || stats.totalSpots === 0) return 0;
        return ((stats.correctSpots / stats.totalSpots) * 100).toFixed(1);
    };

    const getPhaseAccuracy = (phase: string) => {
        if (!stats || !stats.statsByPhase[phase]) return 0;
        const phaseStats = stats.statsByPhase[phase];
        if (phaseStats.total === 0) return 0;
        return ((phaseStats.correct / phaseStats.total) * 100).toFixed(1);
    };

    if (!stats) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    const sortedPhases = Object.entries(stats.statsByPhase).sort((a, b) => {
        const aStats = a[1] as { total: number; correct: number; points: number };
        const bStats = b[1] as { total: number; correct: number; points: number };
        const aPoints = aStats?.points || 0;
        const bPoints = bStats?.points || 0;
        return bPoints - aPoints;
    });

    // If showHistoryOnly or showMarkedHandsOnly, show only the history / marked hands
    if (showHistoryOnly || showMarkedHandsOnly) {
        const pageTitle = showMarkedHandsOnly ? '⭐ Marked Hands' : 'Practiced Hands History';
        
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="font-semibold">Back</span>
                        </button>
                        <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
                        <div></div>
                    </div>

                                {/* Spot History / Marked Hands */}
                    <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {showMarkedHandsOnly ? '⭐ Marked Hands' : 'Spot History'}
                        </h2>
                        <SpotHistory 
                            history={history} 
                            onToggleMark={handleToggleMark}
                            markedHandIds={markedHandIds}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                        <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                            <span className="font-semibold">Back</span>
                    </button>
                </div>

                {/* User Profile */}
                    <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8 mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-full p-4">
                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">{username}</h1>
                            <p className="text-gray-400 text-lg">Trainer Statistics</p>
                        </div>
                    </div>

                    {/* General statistics cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Total Points */}
                        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <span className="text-yellow-400 font-bold text-sm">POINTS</span>
                            </div>
                            <div className="text-4xl font-bold text-white">{stats.totalPoints.toFixed(1)}</div>
                        </div>

                        {/* Tournaments Played */}
                        <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-400/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4" />
                                </svg>
                                <span className="text-yellow-400 font-bold text-sm">TOURNAMENTS PLAYED</span>
                            </div>
                            <div className="text-4xl font-bold text-white">{stats.tournamentsPlayed ?? 0}</div>
                        </div>

                        {/* Reached Final Table */}
                        <div className="bg-gradient-to-br from-orange-400/20 to-orange-600/20 border border-orange-400/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                                </svg>
                                <span className="text-orange-400 font-bold text-sm">FINAL TABLE</span>
                            </div>
                            <div className="text-4xl font-bold text-white">{stats.reachedFinalTable ?? 0}</div>
                        </div>

                        {/* Completed Tournaments */}
                        <div className="bg-gradient-to-br from-lime-400/20 to-lime-600/20 border border-lime-400/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-8 h-8 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <polygon points="12,2 22,22 2,22" stroke="currentColor" strokeWidth="2" fill="none" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                </svg>
                                <span className="text-lime-400 font-bold text-sm">COMPLETED TOURNAMENTS</span>
                            </div>
                            <div className="text-4xl font-bold text-white">{stats.completedTournaments ?? 0}</div>
                        </div>

                        {/* Accuracy */}
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-green-400 font-bold text-sm">ACCURACY</span>
                            </div>
                            <div className="text-4xl font-bold text-white">{getAccuracyPercentage()}%</div>
                            <div className="text-gray-400 text-sm mt-1">{stats.correctSpots}/{stats.totalSpots} spots</div>
                        </div>

                        {/* Total Spots */}
                        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span className="text-blue-400 font-bold text-sm">SPOTS</span>
                            </div>
                            <div className="text-4xl font-bold text-white">{stats.totalSpots}</div>
                        </div>

                        {/* Mistakes */}
                        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-red-400 font-bold text-sm">MISTAKES</span>
                            </div>
                            <div className="text-4xl font-bold text-white">{stats.totalSpots - stats.correctSpots}</div>
                        </div>
                    </div>
                </div>


                {/* Statistics by Phase */}
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Performance by Tournament Phase</h2>
                    {sortedPhases.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-gray-400 text-lg">No spots played yet</p>
                            <p className="text-gray-500 text-sm mt-2">Start training to see your statistics!</p>
                        </div>
                    ) : (
                        // Line chart view: SVG based, lightweight, no external deps
                        <div>
                            {(() => {
                                // Map phases into the exact requested ordering and labels
                                const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

                                // Preferred sequence (expected phase keys and display labels)
                                // Use the exact phase keys that `saveSpotResult` writes (or their normalized form)
                                const preferred = [
                                    { expectedKey: '100~60% left', top: '100-60% left', bottom: 'Early Game' },
                                    { expectedKey: '60-40% left', top: '60-40% left', bottom: 'Mid Game' },
                                    { expectedKey: '40-20% left', top: '40-20% left', bottom: 'Late Game' },
                                    { expectedKey: 'Near bubble', top: 'Near bubble', bottom: '' },
                                    { expectedKey: '3 tables', top: '3 tables', bottom: '' },
                                    { expectedKey: '2 tables', top: '2 tables', bottom: '' },
                                    { expectedKey: 'Final table', top: 'Final table', bottom: '' },
                                ];

                                // Build mapping normalized -> original key
                                const normalizedToKey: Record<string, string> = {};
                                Object.keys(stats.statsByPhase).forEach(k => {
                                    normalizedToKey[normalize(k)] = k;
                                });

                                // Build ordered phases array following the preferred list. If a preferred phase isn't present in stats, include it with zeros.
                                const phases = preferred.map(p => {
                                    const lookup = normalize(p.expectedKey);
                                    const originalKey = normalizedToKey[lookup];
                                    const phaseStats = originalKey ? (stats.statsByPhase[originalKey] as { total: number; correct: number; points: number }) : { total: 0, correct: 0, points: 0 };
                                    const accuracy = originalKey ? parseFloat(getPhaseAccuracy(originalKey) || '0') : 0;
                                    return {
                                        key: originalKey || lookup,
                                        labelTop: p.top,
                                        labelBottom: p.bottom,
                                        accuracy,
                                        points: phaseStats?.points || 0,
                                        total: phaseStats?.total || 0,
                                        correct: phaseStats?.correct || 0,
                                    };
                                });

                                // Chart sizing and padding
                                const pointRadius = 5;
                                const chartHeight = 450; // increased by 50% to accommodate larger text and more vertical space
                                // Extra left padding prevents the first X-label from being clipped
                                const paddingLeft = 64;
                                // increase right padding so the last X-label doesn't get clipped
                                const paddingRight = 96;
                                const chartWidth = Math.max(600, paddingLeft + paddingRight + phases.length * 120);
                                const paddingTop = 28;
                                // increase bottom padding to avoid clipping of multi-line X labels
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
                                    <div className="overflow-x-auto -mx-4 px-4">
                                        <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600 relative">
                                            <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="mx-auto">
                                                {/* Horizontal grid lines and Y labels */}
                                                {[0,25,50,75,100].map(t => {
                                                    const y = yFor(t);
                                                    return (
                                                        <g key={t}>
                                                            <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#374151" strokeWidth={1} opacity={0.6} />
                                                            <text x={Math.max(8, paddingLeft - 16)} y={y + 6} fill="#9ca3af" fontSize={15}>{t}%</text>
                                                        </g>
                                                    );
                                                })}

                                                {/* X labels and small vertical ticks */}
                                                {points.map((pt, i) => (
                                                    <g key={pt.key}>
                                                        <line x1={pt.x} y1={chartHeight - paddingBottom + 6} x2={pt.x} y2={chartHeight - paddingBottom + 2} stroke="#4b5563" strokeWidth={1} />
                                                        <text x={pt.x} y={chartHeight - paddingBottom + 28} fill="#cbd5e1" fontSize={18} fontWeight={600} textAnchor="middle">{pt.labelTop}</text>
                                                        {pt.labelBottom ? (
                                                            <text x={pt.x} y={chartHeight - paddingBottom + 52} fill="#9ca3af" fontSize={17} textAnchor="middle">{pt.labelBottom}</text>
                                                        ) : (
                                                            <text x={pt.x} y={chartHeight - paddingBottom + 52} fill="#9ca3af" fontSize={17} textAnchor="middle">{pt.correct}/{pt.total} • {pt.points.toFixed(1)}pts</text>
                                                        )}
                                                    </g>
                                                ))}

                                                {/* Polyline area (optional subtle fill) */}
                                                <polyline points={linePath} fill="none" stroke="#60a5fa" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

                                                {/* Points */}
                                                {points.map(pt => (
                                                    <g key={pt.key}>
                                                        <circle
                                                            cx={pt.x}
                                                            cy={pt.y}
                                                            r={pointRadius}
                                                            fill="#1f2937"
                                                            stroke="#60a5fa"
                                                            strokeWidth={2}
                                                            style={{ cursor: 'pointer' }}
                                                            onMouseEnter={() => setTooltip({ x: pt.x, y: pt.y, content: `${pt.labelTop}${pt.labelBottom ? ' — ' + pt.labelBottom : ''}: ${pt.accuracy.toFixed(1)}% — ${pt.correct}/${pt.total} • ${pt.points.toFixed(1)}pts` })}
                                                            onMouseLeave={() => setTooltip(null)}
                                                        />
                                                        <text x={pt.x} y={pt.y - 12} fill="#fff" fontSize={17} fontWeight={700} textAnchor="middle">{pt.accuracy.toFixed(0)}%</text>
                                                    </g>
                                                ))}
                                            </svg>
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
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
