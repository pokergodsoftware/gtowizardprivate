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
 * Save the result of a played spot
 */
export async function saveSpotResult(
    userId: string,
    isCorrect: boolean,
    phase: string,
    username?: string,
    points?: number
): Promise<void> {
    try {
    // If username wasn't provided, try to read it from localStorage
        if (!username) {
            const currentUser = localStorage.getItem('poker_current_user');
            if (currentUser) {
                const userData = JSON.parse(currentUser);
                username = userData.username;
            }
        }
        
        const userStatsKey = `poker_stats_${userId}`;
        const storedStats = localStorage.getItem(userStatsKey);
        
        let stats: UserStats;
        
        if (storedStats) {
            stats = JSON.parse(storedStats);
        } else {
            // Initialize empty stats
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

    // Calculate points (1 point per correct answer)
        const finalPoints = points !== undefined ? points : (isCorrect ? 1 : 0);

    // Update global statistics
        stats.totalSpots++;
        if (isCorrect) {
            stats.correctSpots++;
        }
        stats.totalPoints += finalPoints;

    // Tournament-related statistics
        if (phase) {
            // If it's the first phase of the tournament, count as a tournament played
            if (phase === '100~60% left') {
                stats.tournamentsPlayed++;
            }
            // If it's the final table, count as final table reached
            if (phase === 'Final table') {
                stats.reachedFinalTable++;
            }
            // If it's the last phase (e.g., final table and correct), count as tournament completed
            if (phase === 'Final table' && isCorrect) {
                stats.completedTournaments++;
            }
        }

    // Update statistics per phase
        if (!stats.statsByPhase[phase]) {
            stats.statsByPhase[phase] = { total: 0, correct: 0, points: 0 };
        }
        stats.statsByPhase[phase].total++;
        if (isCorrect) {
            stats.statsByPhase[phase].correct++;
        }
        stats.statsByPhase[phase].points += finalPoints;

    // Save to localStorage (local backup)
        localStorage.setItem(userStatsKey, JSON.stringify(stats));

    console.log(`📊 Stats saved for user ${userId}:`, {
            username: username || 'NO USERNAME',
            isCorrect,
            phase,
            points: finalPoints,
            totalPoints: stats.totalPoints,
            accuracy: ((stats.correctSpots / stats.totalSpots) * 100).toFixed(1) + '%'
        });

        // Also try to save to Firebase
        if (username) {
            try {
                console.log('🔄 Syncing stats to Firebase...', { userId, username, isCorrect, phase, points: finalPoints });
                await saveStatsToFirebase(userId, username, isCorrect, phase, finalPoints);
                console.log('✅ ☁️ Stats synced to Firebase successfully!');
            } catch (firebaseError: any) {
                console.error('❌ FIREBASE ERROR - Failed to sync stats:', {
                    error: firebaseError,
                    message: firebaseError?.message,
                    code: firebaseError?.code,
                    userId,
                    phase
                });
                console.warn('⚠️ Stats saved to localStorage only (not synced to cloud)');
                console.warn('📖 See DATABASE_DIAGNOSTIC.md for troubleshooting');
                // Do not fail when Firebase is offline
            }
        } else {
            console.warn('⚠️ Username not found! Stats not synced to Firebase');
            console.warn('💡 Ensure the user is logged in before playing spots');
        }
    } catch (err) {
        console.error('Error saving statistics:', err);
    }
}

/**
 * Load a user's statistics (prefer Firebase)
 */
export async function loadUserStats(userId: string): Promise<UserStats | null> {
    try {
    // Try loading from Firebase first
        try {
            const firebaseStats = await getUserStatsFromFirebase(userId);
            if (firebaseStats) {
                // Save to localStorage as cache
                const userStatsKey = `poker_stats_${userId}`;
                localStorage.setItem(userStatsKey, JSON.stringify(firebaseStats));
                return firebaseStats;
            }
        } catch (firebaseError) {
            console.warn('⚠️ Failed to load from Firebase, falling back to localStorage:', firebaseError);
        }
        
    // Fallback to localStorage
        const userStatsKey = `poker_stats_${userId}`;
        const storedStats = localStorage.getItem(userStatsKey);
        
        if (storedStats) {
            return JSON.parse(storedStats);
        }
        return null;
    } catch (err) {
        console.error('Error loading statistics:', err);
        return null;
    }
}

/**
 * Reset a user's statistics
 */
export function resetUserStats(userId: string): void {
    try {
        const userStatsKey = `poker_stats_${userId}`;
        localStorage.removeItem(userStatsKey);
        console.log(`🗑️ Stats reset for user ${userId}`);
    } catch (err) {
        console.error('Error resetting statistics:', err);
    }
}

/**
 * Save an entry to the spot history
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
        
    // Add new entry
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
        
    // Keep only the last 100 entries in localStorage
        if (history.length > 100) {
            history = history.slice(-100);
        }
        
        localStorage.setItem(historyKey, JSON.stringify(history));
        
    console.log(`📝 History saved: ${hand} ${combo || ''} (${isCorrect ? 'correct' : 'wrong'})`);
        
        // Also try to save to Firebase
        try {
            console.log('🔄 Syncing history to Firebase...', { userId, hand, combo });
            await saveSpotHistoryToFirebase(userId, newEntry);
            console.log('✅ ☁️ History synced to Firebase successfully!');
            } catch (firebaseError: any) {
            console.error('❌ FIREBASE ERROR - Failed to sync history:', {
                error: firebaseError,
                message: firebaseError?.message,
                code: firebaseError?.code,
                userId,
                hand
            });
            console.warn('⚠️ History saved to localStorage only (not synced to cloud)');
            console.warn('📖 See DATABASE_DIAGNOSTIC.md for troubleshooting');
        }
    } catch (err) {
        console.error('Error saving history:', err);
    }
}

/**
 * Load a user's spot history
 */
export async function loadSpotHistory(userId: string): Promise<SpotHistoryEntry[]> {
    try {
    // Try loading from Firebase first
        try {
            const firebaseHistory = await loadSpotHistoryFromFirebase(userId);
            if (firebaseHistory && firebaseHistory.length > 0) {
                // Save to localStorage as cache
                const historyKey = `poker_history_${userId}`;
                localStorage.setItem(historyKey, JSON.stringify(firebaseHistory));
                return firebaseHistory;
            }
        } catch (firebaseError) {
            console.warn('⚠️ Failed to load history from Firebase, falling back to localStorage:', firebaseError);
        }
        
    // Fallback to localStorage
        const historyKey = `poker_history_${userId}`;
        const storedHistory = localStorage.getItem(historyKey);
        
        if (storedHistory) {
            return JSON.parse(storedHistory);
        }
        return [];
    } catch (err) {
        console.error('Error loading history:', err);
        return [];
    }
}

/**
 * Clear a user's spot history
 */
export function clearSpotHistory(userId: string): void {
    try {
        const historyKey = `poker_history_${userId}`;
        localStorage.removeItem(historyKey);
        console.log(`🗑️ History cleared for user ${userId}`);
    } catch (err) {
        console.error('Error clearing history:', err);
    }
}

/**
 * Interface for a marked hand
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
 * Save a hand as marked/favorited
 */
export async function saveMarkedHand(userId: string, markedHand: MarkedHand): Promise<void> {
    try {
        const markedKey = `marked_hands_${userId}`;
        const stored = localStorage.getItem(markedKey);
        let markedHands: MarkedHand[] = stored ? JSON.parse(stored) : [];
        
    // Check if it already exists (by unique id)
        const exists = markedHands.find(h => h.id === markedHand.id);
        if (!exists) {
            markedHands.push(markedHand);
            localStorage.setItem(markedKey, JSON.stringify(markedHands));
            console.log('⭐ Marked hand saved:', markedHand);
        }
        
        // TODO: Also save to Firebase when implemented
    } catch (err) {
        console.error('Error saving marked hand:', err);
    }
}

/**
 * Remove a marked hand
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
        
        // TODO: Also remove from Firebase when implemented
    } catch (err) {
        console.error('Error removing marked hand:', err);
    }
}

/**
 * Load all marked hands
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
        
        // TODO: Try loading from Firebase when implemented
        return [];
    } catch (err) {
        console.error('Error loading marked hands:', err);
        return [];
    }
}

/**
 * Check if a hand is marked
 */
export function isHandMarked(userId: string, handId: string): boolean {
    try {
        const markedKey = `marked_hands_${userId}`;
        const stored = localStorage.getItem(markedKey);
        if (!stored) return false;
        
        const markedHands: MarkedHand[] = JSON.parse(stored);
        return markedHands.some(h => h.id === handId);
    } catch (err) {
        console.error('Error checking marked hand:', err);
        return false;
    }
}
