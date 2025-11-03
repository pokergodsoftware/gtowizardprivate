import React, { useState, useEffect } from 'react';

interface LeaderboardEntry {
    userId: string;
    username: string;
    totalPoints: number;
    totalSpots: number;
    correctSpots: number;
    accuracy: number;
}

interface LeaderboardProps {
    currentUserId: string;
    onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId, onBack }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = () => {
        try {
            const users = JSON.parse(localStorage.getItem('poker_users') || '{}');
            const entries: LeaderboardEntry[] = [];

            console.log('🏆 Loading leaderboard...');
            console.log('📊 Total users registered:', Object.keys(users).length);

            Object.entries(users).forEach(([username, userData]: [string, any]) => {
                const userId = userData.id;
                const userStatsKey = `poker_stats_${userId}`;
                const statsData = localStorage.getItem(userStatsKey);

                console.log(`👤 Checking user: ${username} (${userId})`);
                console.log(`   Stats key: ${userStatsKey}`);
                console.log(`   Has stats: ${!!statsData}`);

                if (statsData) {
                    const stats = JSON.parse(statsData);
                    const accuracy = stats.totalSpots > 0 
                        ? (stats.correctSpots / stats.totalSpots) * 100 
                        : 0;

                    console.log(`   ✅ Stats found:`, {
                        totalPoints: stats.totalPoints,
                        totalSpots: stats.totalSpots,
                        correctSpots: stats.correctSpots,
                        accuracy: accuracy.toFixed(1) + '%'
                    });

                    entries.push({
                        userId,
                        username,
                        totalPoints: stats.totalPoints || 0,
                        totalSpots: stats.totalSpots || 0,
                        correctSpots: stats.correctSpots || 0,
                        accuracy
                    });
                } else {
                    console.log(`   ❌ No stats found for ${username}`);
                }
            });

            console.log(`📈 Total entries with stats: ${entries.length}`);

            // Ordenar por pontos (decrescente) e pegar apenas top 10
            entries.sort((a, b) => b.totalPoints - a.totalPoints);
            
            console.log('🏅 Top players:', entries.map((e, i) => `${i+1}. ${e.username} (${e.totalPoints} pts)`));
            
            // Limitar a 10 jogadores, mas sempre incluir o usuário atual se ele não estiver no top 10
            let top10 = entries.slice(0, 10);
            
            // Se o usuário atual não está no top 10, adiciona ele no final
            const currentUserInTop10 = top10.some(e => e.userId === currentUserId);
            if (!currentUserInTop10) {
                const currentUserEntry = entries.find(e => e.userId === currentUserId);
                if (currentUserEntry) {
                    console.log(`➕ Adding current user outside top 10: ${currentUserEntry.username}`);
                    top10.push(currentUserEntry);
                }
            }
            
            console.log(`✅ Final leaderboard size: ${top10.length}`);
            setLeaderboard(top10);
        } catch (err) {
            console.error('❌ Erro ao carregar leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const getMedalIcon = (position: number) => {
        if (position === 1) {
            return (
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">🥇</span>
                </div>
            );
        } else if (position === 2) {
            return (
                <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">🥈</span>
                </div>
            );
        } else if (position === 3) {
            return (
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">🥉</span>
                </div>
            );
        }
        return (
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-400 font-bold">{position}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Carregando leaderboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <div className="max-w-5xl mx-auto">
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
                    <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
                    </div>
                    <div className="w-24"></div> {/* Spacer para centralizar */}
                </div>

                {/* Pódio (Top 3) */}
                {leaderboard.length >= 3 && (
                    <div className="mb-8 flex items-end justify-center gap-4">
                        {/* 2º Lugar */}
                        <div className="flex flex-col items-center">
                            <div className="bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-500 rounded-xl p-6 w-48 mb-4 transform hover:scale-105 transition-transform">
                                <div className="flex justify-center mb-3">
                                    {getMedalIcon(2)}
                                </div>
                                <h3 className="text-white font-bold text-lg text-center mb-2 truncate">
                                    {leaderboard[1].username}
                                </h3>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-400 mb-1">
                                        {leaderboard[1].totalPoints.toFixed(1)}
                                    </div>
                                    <div className="text-gray-400 text-sm">pontos</div>
                                    <div className="text-gray-500 text-xs mt-2">
                                        {leaderboard[1].accuracy.toFixed(1)}% acertos
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-24 bg-gradient-to-t from-gray-600 to-gray-700 rounded-t-lg border-2 border-gray-500"></div>
                        </div>

                        {/* 1º Lugar */}
                        <div className="flex flex-col items-center">
                            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 border-2 border-yellow-400 rounded-xl p-6 w-52 mb-4 transform hover:scale-105 transition-transform shadow-2xl">
                                <div className="flex justify-center mb-3">
                                    {getMedalIcon(1)}
                                </div>
                                <h3 className="text-white font-bold text-xl text-center mb-2 truncate">
                                    {leaderboard[0].username}
                                </h3>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-white mb-1">
                                        {leaderboard[0].totalPoints.toFixed(1)}
                                    </div>
                                    <div className="text-yellow-200 text-sm font-semibold">pontos</div>
                                    <div className="text-yellow-200 text-xs mt-2">
                                        {leaderboard[0].accuracy.toFixed(1)}% acertos
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-32 bg-gradient-to-t from-yellow-600 to-yellow-700 rounded-t-lg border-2 border-yellow-400"></div>
                        </div>

                        {/* 3º Lugar */}
                        <div className="flex flex-col items-center">
                            <div className="bg-gradient-to-br from-orange-700 to-orange-800 border-2 border-orange-500 rounded-xl p-6 w-48 mb-4 transform hover:scale-105 transition-transform">
                                <div className="flex justify-center mb-3">
                                    {getMedalIcon(3)}
                                </div>
                                <h3 className="text-white font-bold text-lg text-center mb-2 truncate">
                                    {leaderboard[2].username}
                                </h3>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-400 mb-1">
                                        {leaderboard[2].totalPoints.toFixed(1)}
                                    </div>
                                    <div className="text-gray-400 text-sm">pontos</div>
                                    <div className="text-gray-500 text-xs mt-2">
                                        {leaderboard[2].accuracy.toFixed(1)}% acertos
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-20 bg-gradient-to-t from-orange-600 to-orange-700 rounded-t-lg border-2 border-orange-500"></div>
                        </div>
                    </div>
                )}

                {/* Lista Completa */}
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
                    <div className="bg-gray-700/50 px-6 py-4 border-b border-gray-600">
                        <h2 className="text-xl font-bold text-white">Ranking Completo</h2>
                    </div>
                    
                    {leaderboard.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-gray-400 text-lg">Nenhum jogador no ranking ainda</p>
                            <p className="text-gray-500 text-sm mt-2">Seja o primeiro a treinar!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-700">
                            {leaderboard.map((entry, index) => {
                                const isCurrentUser = entry.userId === currentUserId;
                                const position = index + 1;
                                
                                return (
                                    <div 
                                        key={entry.userId}
                                        className={`px-6 py-4 flex items-center gap-4 transition-colors ${
                                            isCurrentUser 
                                                ? 'bg-teal-500/10 border-l-4 border-teal-500' 
                                                : 'hover:bg-gray-700/30'
                                        }`}
                                    >
                                        {/* Posição */}
                                        <div className="w-16 flex justify-center">
                                            {getMedalIcon(position)}
                                        </div>

                                        {/* Username */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-bold text-lg truncate ${
                                                    isCurrentUser ? 'text-teal-400' : 'text-white'
                                                }`}>
                                                    {entry.username}
                                                </h3>
                                                {isCurrentUser && (
                                                    <span className="bg-teal-500/20 text-teal-400 text-xs font-bold px-2 py-1 rounded">
                                                        VOCÊ
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                {entry.totalSpots} spots jogados
                                            </div>
                                        </div>

                                        {/* Estatísticas */}
                                        <div className="flex items-center gap-6">
                                            {/* Pontos */}
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-yellow-400">
                                                    {entry.totalPoints.toFixed(1)}
                                                </div>
                                                <div className="text-gray-500 text-xs">pontos</div>
                                            </div>

                                            {/* Acertos */}
                                            <div className="text-right min-w-[80px]">
                                                <div className={`text-xl font-bold ${
                                                    entry.accuracy >= 70 ? 'text-green-400' : 
                                                    entry.accuracy >= 50 ? 'text-yellow-400' : 
                                                    'text-red-400'
                                                }`}>
                                                    {entry.accuracy.toFixed(1)}%
                                                </div>
                                                <div className="text-gray-500 text-xs">acertos</div>
                                            </div>

                                            {/* Corretos/Total */}
                                            <div className="text-right min-w-[80px]">
                                                <div className="text-white font-semibold">
                                                    {entry.correctSpots}/{entry.totalSpots}
                                                </div>
                                                <div className="text-gray-500 text-xs">corretos</div>
                                            </div>
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
