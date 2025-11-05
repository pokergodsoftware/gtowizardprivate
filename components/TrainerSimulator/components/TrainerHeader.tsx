import React from 'react';

/**
 * TrainerHeader Component
 * 
 * Displays training statistics, control buttons, and tournament timebank.
 * Hidden in tournament mode.
 * 
 * Features:
 * - Back button for navigation
 * - Phase selector display
 * - Training statistics (points, accuracy, tournaments)
 * - Display mode toggles (BB/Chips, Bounty display, Auto-advance)
 * - Timebank display (tournament mode only)
 */

interface TrainerStats {
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    tournamentsPlayed: number;
    reachedFinalTable: number;
    completedTournaments: number;
}

interface TrainerHeaderProps {
    stats: TrainerStats;
    tournamentMode: boolean;
    tournamentPhase?: string;
    timeLeft?: number;
    displayMode: 'bb' | 'chips';
    showBountyInDollars: boolean;
    autoAdvance: boolean;
    selectedPhases: string[];
    onToggleDisplayMode: () => void;
    onToggleShowBountyInDollars: () => void;
    onToggleAutoAdvance: () => void;
    onBack: () => void;
}

export const TrainerHeader: React.FC<TrainerHeaderProps> = ({
    stats,
    tournamentMode,
    tournamentPhase,
    timeLeft,
    displayMode,
    showBountyInDollars,
    autoAdvance,
    selectedPhases,
    onToggleDisplayMode,
    onToggleShowBountyInDollars,
    onToggleAutoAdvance,
    onBack
}) => {

    // Calculate accuracy percentage
    const accuracy = stats.totalQuestions > 0 
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
        : 0;

    const errors = stats.totalQuestions - stats.correctAnswers;

    return (
        <header className="bg-[#23272f] border-b border-gray-700 px-4 py-2">
            <div className="max-w-[1800px] mx-auto">
                {/* Top Row: Back button and Phase selector */}
                <div className="flex items-center justify-between mb-2">
                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />   
                        </svg>
                        <span className="font-semibold">Back</span>
                    </button>

                    {/* Phase Display */}
                    <h1 className="text-lg font-bold text-white">
                        {selectedPhases.length === 1 ? (
                            <span>📊 {selectedPhases[0]}</span>
                        ) : (
                            <span>📊 {selectedPhases.length} Selected phases</span>
                        )}
                    </h1>

                    {/* Spacer for alignment */}
                    <div className="w-24"></div>
                </div>

                {/* Stats Row - Same style as Tournament Mode */}
                <div className="grid grid-cols-4 gap-2">
                    {/* Played Spots */}
                    <div className="bg-blue-500/10 rounded-lg p-1.5 text-center border border-blue-500/30">
                        <div className="text-blue-400 text-[20px] mb-0.5">Played Spots</div>
                        <div className="text-blue-400 font-bold text-2xl">{stats.totalQuestions}</div>
                    </div>

                    {/* Correct */}
                    <div className="bg-green-500/10 rounded-lg p-1.5 text-center border border-green-500/30">
                        <div className="text-green-400 text-[20px] mb-0.5">Correct</div>
                        <div className="text-green-400 font-bold text-2xl">{stats.correctAnswers}</div>
                    </div>

                    {/* Mistakes */}
                    <div className="bg-red-500/10 rounded-lg p-1.5 text-center border border-red-500/30">
                        <div className="text-red-400 text-[20px] mb-0.5">Mistakes</div>
                        <div className="text-red-400 font-bold text-2xl">{errors}</div>
                    </div>

                    {/* Score */}
                    <div className="bg-purple-500/10 rounded-lg p-1.5 text-center border border-purple-500/30">
                        <div className="text-purple-400 text-[20px] mb-0.5">Score</div>
                        <div className="text-purple-400 font-bold text-2xl">
                            {stats.totalQuestions > 0 
                                ? `${Math.round((stats.correctAnswers / stats.totalQuestions) * 100)}%`
                                : '0%'
                            }
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
