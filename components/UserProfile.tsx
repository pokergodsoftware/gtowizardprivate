import React, { useState, useEffect } from 'react';
import { SpotHistory, type SpotHistoryEntry } from './SpotHistory.tsx';
import { loadSpotHistory } from '../utils/statsUtils.ts';

interface UserStats {
    totalSpots: number;
    correctSpots: number;
    totalPoints: number;
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
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, username, onBack }) => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [history, setHistory] = useState<SpotHistoryEntry[]>([]);

    useEffect(() => {
        loadUserStats();
        loadHistory();
    }, [userId]);

    const loadHistory = () => {
        const userHistory = loadSpotHistory(userId);
        setHistory(userHistory);
    };

    const loadUserStats = () => {
        const userStatsKey = `poker_stats_${userId}`;
        const storedStats = localStorage.getItem(userStatsKey);
        
        if (storedStats) {
            setStats(JSON.parse(storedStats));
        } else {
            // Inicializar stats vazias
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
                <div className="text-white text-xl">Carregando...</div>
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
                        <span className="font-semibold">Voltar</span>
                    </button>
                </div>

                {/* Perfil do Usuário */}
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8 mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-full p-4">
                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">{username}</h1>
                            <p className="text-gray-400 text-lg">Estatísticas do Trainer</p>
                        </div>
                    </div>

                    {/* Cards de Estatísticas Gerais */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Total de Pontos */}
                        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <span className="text-yellow-400 font-bold text-sm">PONTOS</span>
                            </div>
                            <div className="text-4xl font-bold text-white">{stats.totalPoints.toFixed(1)}</div>
                        </div>

                        {/* Taxa de Acerto */}
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-green-400 font-bold text-sm">ACERTOS</span>
                            </div>
                            <div className="text-4xl font-bold text-white">{getAccuracyPercentage()}%</div>
                            <div className="text-gray-400 text-sm mt-1">{stats.correctSpots}/{stats.totalSpots} spots</div>
                        </div>

                        {/* Total de Spots */}
                        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span className="text-blue-400 font-bold text-sm">SPOTS</span>
                            </div>
                            <div className="text-4xl font-bold text-white">{stats.totalSpots}</div>
                        </div>

                        {/* Erros */}
                        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-red-400 font-bold text-sm">ERROS</span>
                            </div>
                            <div className="text-4xl font-bold text-white">{stats.totalSpots - stats.correctSpots}</div>
                        </div>
                    </div>
                </div>

                {/* Histórico de Spots */}
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Histórico de Spots</h2>
                    <SpotHistory history={history} />
                </div>

                {/* Estatísticas por Fase */}
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Desempenho por Fase do Torneio</h2>
                    {sortedPhases.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-gray-400 text-lg">Nenhum spot jogado ainda</p>
                            <p className="text-gray-500 text-sm mt-2">Comece a treinar para ver suas estatísticas!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sortedPhases.map(([phase, phaseStatsRaw]) => {
                                const phaseStats = phaseStatsRaw as { total: number; correct: number; points: number };
                                const accuracy = getPhaseAccuracy(phase);
                                const accuracyNum = parseFloat(accuracy || '0');
                                
                                return (
                                    <div key={phase} className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-white font-bold text-lg">{phase}</h3>
                                            <div className="flex items-center gap-4">
                                                <span className="text-teal-400 font-bold">{phaseStats.points.toFixed(1)} pts</span>
                                                <span className={`font-bold ${accuracyNum >= 70 ? 'text-green-400' : accuracyNum >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {accuracy}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 bg-gray-600 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-500 ${accuracyNum >= 70 ? 'bg-green-500' : accuracyNum >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${accuracyNum}%` }}
                                                />
                                            </div>
                                            <span className="text-gray-400 text-sm font-semibold min-w-[80px] text-right">
                                                {phaseStats.correct}/{phaseStats.total} spots
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
