import type { SpotHistoryEntry } from '../components/SpotHistory.tsx';
import { 
    saveStatsToFirebase, 
    saveSpotHistoryToFirebase, 
    loadSpotHistoryFromFirebase,
    getUserStatsFromFirebase,
    updateTournamentStatsInFirebase,
    saveMarkedHandToFirebase,
    removeMarkedHandFromFirebase,
    loadMarkedHandsFromFirebase,
    resetUserStatsInFirebase,
    deleteSpotHistoryFromFirebase
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
        // Calculate points (1 point per correct answer)
        const finalPoints = points !== undefined ? points : (isCorrect ? 1 : 0);

        // Save stats directly to Firebase (Firebase is the single source of truth)
        try {
            console.log('🔄 Saving stats to Firebase...', { userId, username, isCorrect, phase, points: finalPoints });
            await saveStatsToFirebase(userId, username || '', isCorrect, phase, finalPoints);
            console.log('✅ Stats saved to Firebase successfully');
        } catch (firebaseError: any) {
            console.error('❌ FIREBASE ERROR - Failed to save stats to Firebase:', firebaseError);
            // Surface the error but do not use localStorage fallback (we want to rely only on Firebase)
            throw firebaseError;
        }
    } catch (err) {
        console.error('Error saving statistics:', err);
    }
}

/**
 * Record that the user has played a full tournament.
 * This function increments the local cached stats.tournamentsPlayed and
 * attempts to update the cloud stats counter as well.
 */
export async function recordTournamentPlayed(userId: string): Promise<void> {
    try {
        const userStatsKey = `poker_stats_${userId}`;
        const storedStats = localStorage.getItem(userStatsKey);

        let stats: UserStats;
        if (storedStats) {
            stats = JSON.parse(storedStats);
        } else {
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

        stats.tournamentsPlayed = (stats.tournamentsPlayed || 0) + 1;
        localStorage.setItem(userStatsKey, JSON.stringify(stats));
        console.log(`🏆 Tournament recorded locally for ${userId}. Total tournamentsPlayed=${stats.tournamentsPlayed}`);

        // Try to update Firebase aggregate counter
        try {
            await updateTournamentStatsInFirebase(userId, { tournamentsPlayed: 1 });
            console.log('✅ Tournament counter incremented in Firebase');
        } catch (firebaseError) {
            console.warn('⚠️ Could not update tournamentsPlayed in Firebase:', firebaseError);
        }
    } catch (err) {
        console.error('Error recording tournament played:', err);
    }
}

/**
 * Record that the user has reached the Final Table in the current tournament.
 * This should be called once per tournament when the user first reaches a Final Table stage.
 */
export async function recordReachedFinalTable(userId: string): Promise<void> {
    try {
        const userStatsKey = `poker_stats_${userId}`;
        const storedStats = localStorage.getItem(userStatsKey);

        let stats: UserStats;
        if (storedStats) {
            stats = JSON.parse(storedStats);
        } else {
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

        stats.reachedFinalTable = (stats.reachedFinalTable || 0) + 1;
        localStorage.setItem(userStatsKey, JSON.stringify(stats));
        console.log(`🏁 Reached Final Table recorded locally for ${userId}. Total reachedFinalTable=${stats.reachedFinalTable}`);

        try {
            await updateTournamentStatsInFirebase(userId, { reachedFinalTable: 1 });
            console.log('✅ reachedFinalTable incremented in Firebase');
        } catch (firebaseError) {
            console.warn('⚠️ Could not update reachedFinalTable in Firebase:', firebaseError);
        }
    } catch (err) {
        console.error('Error recording reached final table:', err);
    }
}

/**
 * Record that the user has completed a tournament (answered all hands).
 * This should be called once when the tournament is completed normally (not busted).
 */
export async function recordCompletedTournament(userId: string): Promise<void> {
    try {
        const userStatsKey = `poker_stats_${userId}`;
        const storedStats = localStorage.getItem(userStatsKey);

        let stats: UserStats;
        if (storedStats) {
            stats = JSON.parse(storedStats);
        } else {
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

        stats.completedTournaments = (stats.completedTournaments || 0) + 1;
        localStorage.setItem(userStatsKey, JSON.stringify(stats));
        console.log(`🏆 Completed Tournament recorded locally for ${userId}. Total completedTournaments=${stats.completedTournaments}`);

        try {
            await updateTournamentStatsInFirebase(userId, { completedTournaments: 1 });
            console.log('✅ completedTournaments incremented in Firebase');
        } catch (firebaseError) {
            console.warn('⚠️ Could not update completedTournaments in Firebase:', firebaseError);
        }
    } catch (err) {
        console.error('Error recording completed tournament:', err);
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
        // Delete/mark history entries in Firebase
        deleteSpotHistoryFromFirebase(userId).then(() => console.log(`🗑️ History cleared in Firebase for user ${userId}`)).catch(err => console.error('Error clearing history in Firebase:', err));
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
        // Save marked hand to Firebase
        await saveMarkedHandToFirebase(userId, markedHand);
        console.log('⭐ Marked hand saved to Firebase:', markedHand);
    } catch (err) {
        console.error('Error saving marked hand:', err);
    }
}

/**
 * Remove a marked hand
 */
export async function removeMarkedHand(userId: string, handId: string): Promise<void> {
    try {
        await removeMarkedHandFromFirebase(userId, handId);
        console.log('❌ Marked hand removal requested in Firebase for:', handId);
    } catch (err) {
        console.error('Error removing marked hand:', err);
    }
}

/**
 * Load all marked hands
 */
export async function loadMarkedHands(userId: string): Promise<MarkedHand[]> {
    try {
        const items = await loadMarkedHandsFromFirebase(userId);
        // Map firebase items to MarkedHand if necessary
        const markedHands: MarkedHand[] = items.map((i: any) => ({
            id: i.id,
            timestamp: i.timestamp,
            solutionPath: i.solutionPath,
            nodeId: i.nodeId,
            hand: i.hand,
            combo: i.combo,
            position: i.position,
            playerAction: i.playerAction,
            isCorrect: i.isCorrect,
            ev: i.ev,
            phase: i.phase
        }));
        console.log(`📖 Loaded ${markedHands.length} marked hands from Firebase`);
        return markedHands;
    } catch (err) {
        console.error('Error loading marked hands:', err);
        return [];
    }
}

/**
 * Check if a hand is marked
 */
export async function isHandMarked(userId: string, handId: string): Promise<boolean> {
    try {
        const marked = await loadMarkedHands(userId);
        return marked.some(h => h.id === handId);
    } catch (err) {
        console.error('Error checking marked hand:', err);
        return false;
    }
}
