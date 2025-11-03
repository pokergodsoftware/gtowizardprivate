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
    // Hide header in tournament mode
    if (tournamentMode) {
        return null;
    }

    // Calculate accuracy percentage
    const accuracy = stats.totalQuestions > 0 
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
        : 0;

    return (
        <header className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-4 shadow-lg">
            <div className="max-w-[1800px] mx-auto">
                {/* Top Row: Back button and Phase selector */}
                <div className="flex items-center justify-between mb-4">
                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                    >
                        <span>←</span>
                        <span>Voltar</span>
                    </button>

                    {/* Phase Display */}
                    <div className="text-slate-300 text-sm font-medium">
                        {selectedPhases.length === 1 ? (
                            <span>📊 Fase: {selectedPhases[0]}</span>
                        ) : (
                            <span>📊 Fases: {selectedPhases.join(', ')}</span>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between">
                    {/* Left: Statistics */}
                    <div className="flex items-center gap-6">
                        {/* Total Questions */}
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-xs uppercase tracking-wide">Questões</span>
                            <span className="text-white text-2xl font-bold">{stats.totalQuestions}</span>
                        </div>

                        {/* Correct Answers */}
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-xs uppercase tracking-wide">Acertos</span>
                            <span className="text-green-400 text-2xl font-bold">{stats.correctAnswers}</span>
                        </div>

                        {/* Accuracy */}
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-xs uppercase tracking-wide">Precisão</span>
                            <span className={`text-2xl font-bold ${
                                accuracy >= 70 ? 'text-green-400' : 
                                accuracy >= 50 ? 'text-yellow-400' : 
                                'text-red-400'
                            }`}>
                                {accuracy}%
                            </span>
                        </div>

                        {/* Score */}
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-xs uppercase tracking-wide">Pontos</span>
                            <span className="text-blue-400 text-2xl font-bold">{stats.score}</span>
                        </div>

                        {/* Tournament Stats (if applicable) */}
                        {stats.tournamentsPlayed > 0 && (
                            <>
                                <div className="h-8 w-px bg-slate-600"></div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-xs uppercase tracking-wide">Torneios</span>
                                    <span className="text-purple-400 text-2xl font-bold">{stats.tournamentsPlayed}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-xs uppercase tracking-wide">FT</span>
                                    <span className="text-yellow-400 text-2xl font-bold">{stats.reachedFinalTable}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-xs uppercase tracking-wide">Vitórias</span>
                                    <span className="text-green-400 text-2xl font-bold">{stats.completedTournaments}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right: Control Toggles */}
                    <div className="flex items-center gap-3">
                        {/* Display Mode Toggle (BB/Chips) */}
                        <button
                            onClick={onToggleDisplayMode}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                displayMode === 'bb'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                            title="Toggle between BB and chips display"
                        >
                            {displayMode === 'bb' ? 'BB' : 'Chips'}
                        </button>

                        {/* Bounty Display Toggle ($/x) */}
                        <button
                            onClick={onToggleShowBountyInDollars}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                showBountyInDollars
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                            title="Toggle bounty display between $ and x"
                        >
                            {showBountyInDollars ? '$' : 'x'}
                        </button>

                        {/* Auto-Advance Toggle */}
                        <button
                            onClick={onToggleAutoAdvance}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                                autoAdvance
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                            title="Auto-advance to next hand after answer"
                        >
                            <span>⏭️</span>
                            <span>{autoAdvance ? 'Auto' : 'Manual'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
