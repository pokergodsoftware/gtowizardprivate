import type { SpotHistoryEntry } from '../components/SpotHistory.tsx';
import { saveStatsToFirebase } from '../src/firebase/firebaseService';

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

/**
 * Salva o resultado de um spot jogado
 */
export async function saveSpotResult(
    userId: string,
    isCorrect: boolean,
    phase: string,
    username?: string
): Promise<void> {
    try {
        const userStatsKey = `poker_stats_${userId}`;
        const storedStats = localStorage.getItem(userStatsKey);
        
        let stats: UserStats;
        
        if (storedStats) {
            stats = JSON.parse(storedStats);
        } else {
            // Inicializar stats vazias
            stats = {
                totalSpots: 0,
                correctSpots: 0,
                totalPoints: 0,
                statsByPhase: {}
            };
        }

        // Calcular pontos (1 ponto por acerto)
        const points = isCorrect ? 1 : 0;

        // Atualizar estatísticas gerais
        stats.totalSpots++;
        if (isCorrect) {
            stats.correctSpots++;
        }
        stats.totalPoints += points;

        // Atualizar estatísticas por fase
        if (!stats.statsByPhase[phase]) {
            stats.statsByPhase[phase] = { total: 0, correct: 0, points: 0 };
        }
        stats.statsByPhase[phase].total++;
        if (isCorrect) {
            stats.statsByPhase[phase].correct++;
        }
        stats.statsByPhase[phase].points += points;

        // Salvar no localStorage
        localStorage.setItem(userStatsKey, JSON.stringify(stats));

        console.log(`📊 Stats saved for user ${userId}:`, {
            isCorrect,
            phase,
            points,
            totalPoints: stats.totalPoints,
            accuracy: ((stats.correctSpots / stats.totalSpots) * 100).toFixed(1) + '%'
        });

        // Salvar também no Firebase (se username fornecido)
        if (username) {
            try {
                await saveStatsToFirebase(userId, username, isCorrect);
                console.log('☁️ Stats synced to Firebase');
            } catch (firebaseError) {
                console.warn('⚠️ Failed to sync to Firebase (offline?):', firebaseError);
                // Não falha se Firebase estiver offline
            }
        }
    } catch (err) {
        console.error('Erro ao salvar estatísticas:', err);
    }
}

/**
 * Carrega as estatísticas de um usuário
 */
export function loadUserStats(userId: string): UserStats | null {
    try {
        const userStatsKey = `poker_stats_${userId}`;
        const storedStats = localStorage.getItem(userStatsKey);
        
        if (storedStats) {
            return JSON.parse(storedStats);
        }
        return null;
    } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        return null;
    }
}

/**
 * Reseta as estatísticas de um usuário
 */
export function resetUserStats(userId: string): void {
    try {
        const userStatsKey = `poker_stats_${userId}`;
        localStorage.removeItem(userStatsKey);
        console.log(`🗑️ Stats reset for user ${userId}`);
    } catch (err) {
        console.error('Erro ao resetar estatísticas:', err);
    }
}

/**
 * Salva uma entrada no histórico de spots
 */
export function saveSpotHistory(
    userId: string,
    hand: string,
    isCorrect: boolean,
    phase: string,
    points: number,
    combo?: string,
    solutionPath?: string,
    nodeId?: number
): void {
    try {
        const historyKey = `poker_history_${userId}`;
        const storedHistory = localStorage.getItem(historyKey);
        
        let history: SpotHistoryEntry[] = storedHistory ? JSON.parse(storedHistory) : [];
        
        // Adicionar nova entrada
        const newEntry: SpotHistoryEntry = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            hand,
            combo,
            isCorrect,
            timestamp: Date.now(),
            phase,
            points,
            solutionPath,
            nodeId
        };
        
        history.push(newEntry);
        
        // Manter apenas os últimos 30
        if (history.length > 30) {
            history = history.slice(-30);
        }
        
        localStorage.setItem(historyKey, JSON.stringify(history));
        
        console.log(`📝 History saved: ${hand} ${combo || ''} (${isCorrect ? 'correct' : 'wrong'})`);
    } catch (err) {
        console.error('Erro ao salvar histórico:', err);
    }
}

/**
 * Carrega o histórico de spots de um usuário
 */
export function loadSpotHistory(userId: string): SpotHistoryEntry[] {
    try {
        const historyKey = `poker_history_${userId}`;
        const storedHistory = localStorage.getItem(historyKey);
        
        if (storedHistory) {
            return JSON.parse(storedHistory);
        }
        return [];
    } catch (err) {
        console.error('Erro ao carregar histórico:', err);
        return [];
    }
}

/**
 * Limpa o histórico de spots de um usuário
 */
export function clearSpotHistory(userId: string): void {
    try {
        const historyKey = `poker_history_${userId}`;
        localStorage.removeItem(historyKey);
        console.log(`🗑️ History cleared for user ${userId}`);
    } catch (err) {
        console.error('Erro ao limpar histórico:', err);
    }
}
