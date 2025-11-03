/**
 * useTrainerStats Hook
 * 
 * Manages trainer statistics tracking.
 * Extracted from TrainerSimulator.tsx during Phase 2 refactoring.
 */

import { useState } from 'react';
import type { TrainerStats } from '../types.ts';

export interface UseTrainerStatsReturn {
    stats: TrainerStats;
    updateStats: (
        isCorrect: boolean, 
        phase: string, 
        points: number
    ) => void;
    resetStats: () => void;
}

const INITIAL_STATS: TrainerStats = {
    totalQuestions: 0,
    correctAnswers: 0,
    score: 0,
    tournamentsPlayed: 0,
    reachedFinalTable: 0,
    completedTournaments: 0
};

/**
 * Custom hook for managing trainer statistics
 * Tracks questions, correct answers, score, and tournament progress
 */
export const useTrainerStats = (): UseTrainerStatsReturn => {
    const [stats, setStats] = useState<TrainerStats>(INITIAL_STATS);

    /**
     * Update statistics after answering a question
     * @param isCorrect - Whether the answer was correct
     * @param phase - Tournament phase (e.g., '100~60% left', 'Final table')
     * @param points - Points earned (0-100)
     */
    const updateStats = (
        isCorrect: boolean, 
        phase: string, 
        points: number
    ) => {
        setStats(prev => ({
            totalQuestions: prev.totalQuestions + 1,
            correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
            score: prev.score + points,
            tournamentsPlayed: phase === '100~60% left' 
                ? prev.tournamentsPlayed + 1 
                : prev.tournamentsPlayed,
            reachedFinalTable: phase === 'Final table' 
                ? prev.reachedFinalTable + 1 
                : prev.reachedFinalTable,
            completedTournaments: (phase === 'Final table' && isCorrect) 
                ? prev.completedTournaments + 1 
                : prev.completedTournaments
        }));

        console.log(`📊 Stats updated: ${isCorrect ? 'CORRECT' : 'WRONG'} - ${points} points - Phase: ${phase}`);
    };

    /**
     * Reset all statistics to initial values
     */
    const resetStats = () => {
        setStats(INITIAL_STATS);
        console.log('🔄 Stats reset to initial values');
    };

    return {
        stats,
        updateStats,
        resetStats
    };
};
