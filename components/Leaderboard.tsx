import React, { useState, useEffect } from 'react';
import { getTop10FromFirebase, getAllPlayersFromFirebase, type FirebaseStats } from '../src/firebase/firebaseService';

interface LeaderboardEntry {
    userId: string;
    username: string;
    totalPoints: number;
    totalSpots: number;
    correctSpots: number;
    incorrectSpots: number; // Blunders/Errors
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

    const loadLeaderboard = async () => {
        try {
            console.log('🏆 Loading leaderboard from Firebase...');
            
            // Load ONLY from Firebase
            const firebaseStats = await getTop10FromFirebase();
            
            console.log('☁️ Loaded from Firebase:', firebaseStats.length, 'players');
            
            // Converter FirebaseStats para LeaderboardEntry
            const entries: LeaderboardEntry[] = firebaseStats.map(stat => ({
                userId: stat.userId,
                username: stat.username,
                totalPoints: stat.totalPoints,
                totalSpots: stat.totalSpots,
                correctSpots: stat.correctSpots,
                incorrectSpots: stat.incorrectSpots || 0, // Fallback para dados antigos
                accuracy: stat.accuracy
            }));
            
            // Check if current user is in the top 10
            const currentUserInTop10 = entries.some(e => e.userId === currentUserId);
            
            // Se não estiver, buscar todos e adicionar
            if (!currentUserInTop10) {
                console.log('🔍 Current user not in top 10, fetching all players...');
                const allPlayers = await getAllPlayersFromFirebase();
                const currentUserEntry = allPlayers.find(p => p.userId === currentUserId);
                
                if (currentUserEntry) {
                    entries.push({
                        userId: currentUserEntry.userId,
                        username: currentUserEntry.username,
                        totalPoints: currentUserEntry.totalPoints,
                        totalSpots: currentUserEntry.totalSpots,
                        correctSpots: currentUserEntry.correctSpots,
                        incorrectSpots: currentUserEntry.incorrectSpots || 0,
                        accuracy: currentUserEntry.accuracy
                    });
                    console.log('➕ Added current user to leaderboard');
                }
            }
            
            setLeaderboard(entries);
            console.log('✅ Leaderboard loaded successfully');
        } catch (err: any) {
            console.error('❌ Error loading leaderboard from Firebase:', {
                error: err,
                message: err?.message,
                code: err?.code
            });
            
        // Show a friendly error message
        alert('Error loading leaderboard. Please check:\n\n' +
            '1. Are your Firestore rules configured?\n' +
            '2. Do you have an internet connection?\n' +
            '3. Are there players registered in Firebase?\n\n' +
            'See the console (F12) for details.');
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
                <div className="text-white text-xl">Loading leaderboard...</div>
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
                        <span className="font-semibold">Back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
                    </div>
                    <div className="w-24"></div> {/* Spacer para centralizar */}
                </div>

                {/* Podium (Top 3) */}
                {leaderboard.length >= 3 && (
                    <div className="mb-8 flex items-end justify-center gap-4">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center">
                            <div className="bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-500 rounded-xl p-6 w-48 mb-4 transform hover:scale-105 transition-transform">
                                <div className="flex justify-center mb-3">
                                    {getMedalIcon(2)}
                                </div>
                                <h3 className="text-white font-bold text-lg text-center mb-2 truncate">
                                    {leaderboard[1].username || leaderboard[1].userId || '<unknown>'}
                                </h3>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-400 mb-1">
                                        {leaderboard[1].totalPoints.toFixed(1)}
                                    </div>
                                    <div className="text-gray-400 text-sm">points</div>
                                    <div className="text-gray-500 text-xs mt-2">
                                        {leaderboard[1].accuracy.toFixed(1)}% accuracy
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-24 bg-gradient-to-t from-gray-600 to-gray-700 rounded-t-lg border-2 border-gray-500"></div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center">
                            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 border-2 border-yellow-400 rounded-xl p-6 w-52 mb-4 transform hover:scale-105 transition-transform shadow-2xl">
                                <div className="flex justify-center mb-3">
                                    {getMedalIcon(1)}
                                </div>
                                <h3 className="text-white font-bold text-xl text-center mb-2 truncate">
                                    {leaderboard[0].username || leaderboard[0].userId || '<unknown>'}
                                </h3>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-white mb-1">
                                        {leaderboard[0].totalPoints.toFixed(1)}
                                    </div>
                                    <div className="text-yellow-200 text-sm font-semibold">points</div>
                                    <div className="text-yellow-200 text-xs mt-2">
                                        {leaderboard[0].accuracy.toFixed(1)}% accuracy
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-32 bg-gradient-to-t from-yellow-600 to-yellow-700 rounded-t-lg border-2 border-yellow-400"></div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center">
                            <div className="bg-gradient-to-br from-orange-700 to-orange-800 border-2 border-orange-500 rounded-xl p-6 w-48 mb-4 transform hover:scale-105 transition-transform">
                                <div className="flex justify-center mb-3">
                                    {getMedalIcon(3)}
                                </div>
                                <h3 className="text-white font-bold text-lg text-center mb-2 truncate">
                                    {leaderboard[2].username || leaderboard[2].userId || '<unknown>'}
                                </h3>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-400 mb-1">
                                        {leaderboard[2].totalPoints.toFixed(1)}
                                    </div>
                                    <div className="text-gray-400 text-sm">points</div>
                                    <div className="text-gray-500 text-xs mt-2">
                                        {leaderboard[2].accuracy.toFixed(1)}% accuracy
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
                        <h2 className="text-xl font-bold text-white">Full Leaderboard</h2>
                    </div>
                    
                    {leaderboard.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-gray-400 text-lg">No players in the leaderboard yet</p>
                            <p className="text-gray-500 text-sm mt-2">Be the first to train!</p>
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
                                                    {entry.username || entry.userId || '<unknown>'}
                                                </h3>
                                                {isCurrentUser && (
                                                    <span className="bg-teal-500/20 text-teal-400 text-xs font-bold px-2 py-1 rounded">
                                                        YOU
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                {entry.totalSpots} spots played
                                            </div>
                                        </div>

                                        {/* Statistics */}
                                        <div className="flex items-center gap-6">
                                            {/* Points */}
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-yellow-400">
                                                    {entry.totalPoints.toFixed(1)}
                                                </div>
                                                <div className="text-gray-500 text-xs">points</div>
                                            </div>

                                            {/* Accuracy */}
                                            <div className="text-right min-w-[80px]">
                                                <div className={`text-xl font-bold ${
                                                    entry.accuracy >= 70 ? 'text-green-400' : 
                                                    entry.accuracy >= 50 ? 'text-yellow-400' : 
                                                    'text-red-400'
                                                }`}>
                                                    {entry.accuracy.toFixed(1)}%
                                                </div>
                                                <div className="text-gray-500 text-xs">accuracy</div>
                                            </div>

                                            {/* Correct/Total */}
                                            <div className="text-right min-w-[80px]">
                                                <div className="text-green-400 font-semibold">
                                                    {entry.correctSpots}
                                                </div>
                                                <div className="text-gray-500 text-xs">correct</div>
                                            </div>

                                            {/* Blunders */}
                                            <div className="text-right min-w-[80px]">
                                                <div className="text-red-400 font-semibold">
                                                    {entry.incorrectSpots}
                                                </div>
                                                <div className="text-gray-500 text-xs">blunders</div>
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
