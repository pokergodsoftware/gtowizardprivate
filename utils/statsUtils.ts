import type { SpotHistoryEntry } from '../components/SpotHistory.tsx';
import { 
    saveStatsToFirebase, 
    saveSpotHistoryToFirebase, 
    loadSpotHistoryFromFirebase,
    getUserStatsFromFirebase,
    updateTournamentStatsInFirebase
} from '../src/firebase/firebaseService';

interface UserStats {
    totalSpots: number;
    correctSpots: number;
    totalPoints: number;
    tournamentsPlayed: number;
    reachedFinalTable: number;
    completedTournaments: number;
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
    username?: string,
    points?: number
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
                tournamentsPlayed: 0,
                reachedFinalTable: 0,
                completedTournaments: 0,
                statsByPhase: {}
            };
        }

        // Calcular pontos (1 ponto por acerto)
        const finalPoints = points !== undefined ? points : (isCorrect ? 1 : 0);

        // Atualizar estatísticas gerais
        stats.totalSpots++;
        if (isCorrect) {
            stats.correctSpots++;
        }
        stats.totalPoints += finalPoints;

        // Estatísticas de torneio
        if (phase) {
            // Se for a primeira fase do torneio, conta como torneio jogado
            if (phase === '100~60% left') {
                stats.tournamentsPlayed++;
            }
            // Se for mesa final, conta como mesa final alcançada
            if (phase === 'Final table') {
                stats.reachedFinalTable++;
            }
            // Se for última fase (exemplo: mesa final e acerto), conta como torneio completo
            if (phase === 'Final table' && isCorrect) {
                stats.completedTournaments++;
            }
        }

        // Atualizar estatísticas por fase
        if (!stats.statsByPhase[phase]) {
            stats.statsByPhase[phase] = { total: 0, correct: 0, points: 0 };
        }
        stats.statsByPhase[phase].total++;
        if (isCorrect) {
            stats.statsByPhase[phase].correct++;
        }
        stats.statsByPhase[phase].points += finalPoints;

        // Salvar no localStorage (backup local)
        localStorage.setItem(userStatsKey, JSON.stringify(stats));

        console.log(`📊 Stats saved for user ${userId}:`, {
            isCorrect,
            phase,
            points: finalPoints,
            totalPoints: stats.totalPoints,
            accuracy: ((stats.correctSpots / stats.totalSpots) * 100).toFixed(1) + '%'
        });

        // Salvar também no Firebase
        if (username) {
            try {
                await saveStatsToFirebase(userId, username, isCorrect, phase, finalPoints);
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
 * Carrega as estatísticas de um usuário (prioriza Firebase)
 */
export async function loadUserStats(userId: string): Promise<UserStats | null> {
    try {
        // Tentar carregar do Firebase primeiro
        try {
            const firebaseStats = await getUserStatsFromFirebase(userId);
            if (firebaseStats) {
                // Salvar no localStorage como cache
                const userStatsKey = `poker_stats_${userId}`;
                localStorage.setItem(userStatsKey, JSON.stringify(firebaseStats));
                return firebaseStats;
            }
        } catch (firebaseError) {
            console.warn('⚠️ Failed to load from Firebase, using localStorage:', firebaseError);
        }
        
        // Fallback para localStorage
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
export async function saveSpotHistory(
    userId: string,
    hand: string,
    isCorrect: boolean,
    phase: string,
    points: number,
    combo?: string,
    solutionPath?: string,
    nodeId?: number,
    position?: number,
    playerAction?: string,
    ev?: number
): Promise<void> {
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
            nodeId,
            position,
            playerAction,
            ev
        };
        
        history.push(newEntry);
        
        // Manter apenas os últimos 100 no localStorage
        if (history.length > 100) {
            history = history.slice(-100);
        }
        
        localStorage.setItem(historyKey, JSON.stringify(history));
        
        console.log(`📝 History saved: ${hand} ${combo || ''} (${isCorrect ? 'correct' : 'wrong'})`);
        
        // Salvar também no Firebase
        try {
            await saveSpotHistoryToFirebase(userId, newEntry);
            console.log('☁️ History synced to Firebase');
        } catch (firebaseError) {
            console.warn('⚠️ Failed to sync history to Firebase:', firebaseError);
        }
    } catch (err) {
        console.error('Erro ao salvar histórico:', err);
    }
}

/**
 * Carrega o histórico de spots de um usuário
 */
export async function loadSpotHistory(userId: string): Promise<SpotHistoryEntry[]> {
    try {
        // Tentar carregar do Firebase primeiro
        try {
            const firebaseHistory = await loadSpotHistoryFromFirebase(userId);
            if (firebaseHistory && firebaseHistory.length > 0) {
                // Salvar no localStorage como cache
                const historyKey = `poker_history_${userId}`;
                localStorage.setItem(historyKey, JSON.stringify(firebaseHistory));
                return firebaseHistory;
            }
        } catch (firebaseError) {
            console.warn('⚠️ Failed to load history from Firebase, using localStorage:', firebaseError);
        }
        
        // Fallback para localStorage
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

/**
 * Interface para mão marcada
 */
export interface MarkedHand {
    id: string;
    timestamp: number;
    solutionPath: string;
    nodeId: number;
    hand: string;
    combo: string;
    position: number;
    playerAction: string;
    isCorrect: boolean;
    ev?: number;
    phase: string;
}

/**
 * Salva uma mão como marcada
 */
export async function saveMarkedHand(userId: string, markedHand: MarkedHand): Promise<void> {
    try {
        const markedKey = `marked_hands_${userId}`;
        const stored = localStorage.getItem(markedKey);
        let markedHands: MarkedHand[] = stored ? JSON.parse(stored) : [];
        
        // Verifica se já existe (por id único)
        const exists = markedHands.find(h => h.id === markedHand.id);
        if (!exists) {
            markedHands.push(markedHand);
            localStorage.setItem(markedKey, JSON.stringify(markedHands));
            console.log('⭐ Marked hand saved:', markedHand);
        }
        
        // TODO: Salvar também no Firebase quando implementar
    } catch (err) {
        console.error('Erro ao salvar mão marcada:', err);
    }
}

/**
 * Remove uma mão marcada
 */
export async function removeMarkedHand(userId: string, handId: string): Promise<void> {
    try {
        const markedKey = `marked_hands_${userId}`;
        const stored = localStorage.getItem(markedKey);
        if (!stored) return;
        
        let markedHands: MarkedHand[] = JSON.parse(stored);
        markedHands = markedHands.filter(h => h.id !== handId);
        localStorage.setItem(markedKey, JSON.stringify(markedHands));
        console.log('❌ Marked hand removed:', handId);
        
        // TODO: Remover também do Firebase quando implementar
    } catch (err) {
        console.error('Erro ao remover mão marcada:', err);
    }
}

/**
 * Carrega todas as mãos marcadas
 */
export async function loadMarkedHands(userId: string): Promise<MarkedHand[]> {
    try {
        const markedKey = `marked_hands_${userId}`;
        const stored = localStorage.getItem(markedKey);
        
        if (stored) {
            const markedHands: MarkedHand[] = JSON.parse(stored);
            console.log(`📖 Loaded ${markedHands.length} marked hands from localStorage`);
            return markedHands;
        }
        
        // TODO: Tentar carregar do Firebase quando implementar
        return [];
    } catch (err) {
        console.error('Erro ao carregar mãos marcadas:', err);
        return [];
    }
}

/**
 * Verifica se uma mão está marcada
 */
export function isHandMarked(userId: string, handId: string): boolean {
    try {
        const markedKey = `marked_hands_${userId}`;
        const stored = localStorage.getItem(markedKey);
        if (!stored) return false;
        
        const markedHands: MarkedHand[] = JSON.parse(stored);
        return markedHands.some(h => h.id === handId);
    } catch (err) {
        console.error('Erro ao verificar mão marcada:', err);
        return false;
    }
}
