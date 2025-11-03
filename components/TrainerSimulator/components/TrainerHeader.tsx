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
    // Don't render in tournament mode
    if (tournamentMode) {
        return null;
    }

    return (
        <div className="bg-[#282c33] border-b border-gray-700 p-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                {/* Left side: Back button and phase display */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-[#2d3238] hover:bg-[#353a42] text-white rounded-lg transition-colors"
                    >
                        ← Voltar
                    </button>
                    <h1 className="text-xl font-bold text-white">
                        {selectedPhases.length === 1 
                            ? selectedPhases[0]
                            : `${selectedPhases.length} Fases Selecionadas`
                        }
                    </h1>
                </div>
                
                {/* Right side: Statistics */}
                <div className="flex items-center gap-6 text-white">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-teal-400">
                            {Math.round(stats.score)}
                        </div>
                        <div className="text-xs text-gray-400">Pontos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">
                            {stats.correctAnswers}/{stats.totalQuestions}
                        </div>
                        <div className="text-xs text-gray-400">Acertos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">
                            {stats.totalQuestions > 0 
                                ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
                                : 0
                            }%
                        </div>
                        <div className="text-xs text-gray-400">Precisão</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                            {stats.tournamentsPlayed}
                        </div>
                        <div className="text-xs text-gray-400">Tournaments Played</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">
                            {stats.reachedFinalTable}
                        </div>
                        <div className="text-xs text-gray-400">Reached Final Table</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-lime-400">
                            {stats.completedTournaments}
                        </div>
                        <div className="text-xs text-gray-400">Completed Tournaments</div>
                    </div>
                </div>
            </div>
            
            {/* Timebank display (only in tournament mode) */}
            {tournamentMode && timeLeft !== undefined && (
                <div className="mt-3 flex items-center justify-center">
                    <div className={`px-4 py-2 rounded-lg font-bold ${
                        timeLeft <= 4 ? 'bg-red-600 text-white animate-pulse' :
                        timeLeft <= 8 ? 'bg-orange-500 text-white' :
                        'bg-gray-700 text-gray-300'
                    }`}>
                        ⏱️ Timebank: {timeLeft}s
                    </div>
                </div>
            )}
        </div>
    );
};
