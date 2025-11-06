import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  updateDoc,
  increment,
  addDoc,
  where
} from 'firebase/firestore';
import { db } from './config';
import type { SpotHistoryEntry } from '../../components/SpotHistory';

export interface FirebaseUser {
  userId: string;
  username: string;
  createdAt: string;
}

export interface FirebaseStats {
  userId: string;
  username: string;
  totalSpots: number;
  correctSpots: number;
    incorrectSpots: number; // Incorrect spots (used to calculate blunders)
  totalPoints: number;
  tournamentsPlayed: number;
  reachedFinalTable: number;
  completedTournaments: number;
  accuracy: number;
  lastUpdated: string;
  statsByPhase: {
    [phase: string]: {
      total: number;
      correct: number;
        incorrect: number; // Incorrect per phase
      points: number;
    };
  };
}

/**
 * Create or update a user in Firebase
 */
export async function saveUserToFirebase(userId: string, username: string): Promise<void> {
  try {
    console.log('🔄 Firebase: Attempting to save user...', { userId, username });
    console.log('📍 Firebase: Using project:', db.app.options.projectId);
    
    const userRef = doc(db, 'users', userId);
    
    console.log('📝 Firebase: Creating document in collection "users"...');
    await setDoc(userRef, {
      userId,
      username,
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ Firebase: User document created successfully!');
    console.log('🔍 Firebase: Verify at https://console.firebase.google.com/project/' + db.app.options.projectId + '/firestore');
  } catch (error: any) {
    console.error('❌ Firebase: Error saving user:', {
      error,
      errorName: error?.name,
      message: error?.message,
      code: error?.code,
      userId,
      username,
      projectId: db.app.options.projectId
    });
    
  // Helpful error messages by error type
    if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
      console.error('🚫 FIREBASE PERMISSION DENIED!');
      console.error('📖 SOLUTION: Update Firestore rules to allow create:');
      console.error('   1. Go to: https://console.firebase.google.com/project/' + db.app.options.projectId + '/firestore/rules');
      console.error('   2. Add: allow create: if true; to users collection');
      console.error('   3. See: DATABASE_DIAGNOSTIC.md for detailed instructions');
    } else if (error?.code === 'unavailable') {
      console.error('📡 FIREBASE UNAVAILABLE - Check internet connection');
    } else if (error?.code === 'failed-precondition') {
      console.error('⚙️ FIREBASE FAILED PRECONDITION - May need to create index');
    }
    
    throw error;
  }
}

/**
 * Save statistics to Firebase
 */
export async function saveStatsToFirebase(
  userId: string,
  username: string,
  isCorrect: boolean,
  phase?: string,
  points?: number
): Promise<void> {
  try {
    console.log('🔄 Firebase: Syncing stats...', { userId, username, isCorrect, phase, points });
    
    const statsRef = doc(db, 'stats', userId);
    
  // Check if it already exists
    const statsSnap = await getDoc(statsRef);
    
    const pointsToAdd = points !== undefined ? points : (isCorrect ? 1 : 0);
    
    if (statsSnap.exists()) {
      console.log('📝 Firebase: Updating existing stats document...');
      const data = statsSnap.data();
      const statsByPhase = data.statsByPhase || {};
      
      // Update per-phase statistics if provided
      if (phase) {
        if (!statsByPhase[phase]) {
          statsByPhase[phase] = { total: 0, correct: 0, incorrect: 0, points: 0 };
        }
        statsByPhase[phase].total += 1;
        statsByPhase[phase].correct += isCorrect ? 1 : 0;
        statsByPhase[phase].incorrect += isCorrect ? 0 : 1;
        statsByPhase[phase].points += pointsToAdd;
      }
      
      // Update general statistics
      await updateDoc(statsRef, {
        totalSpots: increment(1),
        correctSpots: increment(isCorrect ? 1 : 0),
        incorrectSpots: increment(isCorrect ? 0 : 1),
        totalPoints: increment(pointsToAdd),
        lastUpdated: new Date().toISOString(),
        statsByPhase
      });
      
      // Recalculate accuracy
      const updatedSnap = await getDoc(statsRef);
      const updatedData = updatedSnap.data();
      const accuracy = (updatedData!.correctSpots / updatedData!.totalSpots) * 100;
      
      await updateDoc(statsRef, { accuracy });
      console.log('✅ Firebase: Stats updated successfully!');
    } else {
      console.log('📝 Firebase: Creating new stats document...');
      // Create new statistics
      const statsByPhase: any = {};
      if (phase) {
        statsByPhase[phase] = {
          total: 1,
          correct: isCorrect ? 1 : 0,
          incorrect: isCorrect ? 0 : 1,
          points: pointsToAdd
        };
      }
      
    // Created new statistics
      await setDoc(statsRef, {
        userId,
        username,
        totalSpots: 1,
        correctSpots: isCorrect ? 1 : 0,
        incorrectSpots: isCorrect ? 0 : 1,
        totalPoints: pointsToAdd,
        tournamentsPlayed: 0,
        reachedFinalTable: 0,
        completedTournaments: 0,
        accuracy: isCorrect ? 100 : 0,
        lastUpdated: new Date().toISOString(),
        statsByPhase
      });
      console.log('✅ Firebase: Stats created successfully!');
    }
    
    console.log('📊 Firebase: Stats synced for:', username);
  } catch (error: any) {
    console.error('❌ Firebase: Error saving stats:', {
      error,
      message: error?.message,
      code: error?.code,
      userId,
      phase
    });
    
    if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
      console.error('🚫 FIREBASE PERMISSION DENIED for stats!');
      console.error('📖 See DATABASE_DIAGNOSTIC.md for fix');
    }
    
    throw error;
  }
}

/**
 * Fetch top 10 players from Firebase
 */
export async function getTop10FromFirebase(): Promise<FirebaseStats[]> {
  try {
    console.log('🔄 Fetching top 10 from Firestore...');
    const statsRef = collection(db, 'stats');
    const q = query(statsRef, orderBy('totalPoints', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    const top10: FirebaseStats[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebaseStats;
      console.log('  📊', data.username, '-', data.totalPoints, 'points');
      top10.push(data);
    });
    
    console.log(`✅ Loaded ${top10.length} players from Firebase`);
    return top10;
  } catch (error: any) {
    console.error('❌ Error loading top 10 from Firebase:', {
      error,
      message: error?.message,
      code: error?.code,
      hint: error?.code === 'failed-precondition' 
        ? 'You may need to create a Firestore index for orderBy(totalPoints)'
        : 'Check Firestore rules and network connection'
    });
    throw error;
  }
}

/**
 * Fetch statistics for a specific user
 */
export async function getUserStatsFromFirebase(userId: string): Promise<FirebaseStats | null> {
  try {
    const statsRef = doc(db, 'stats', userId);
    const statsSnap = await getDoc(statsRef);
    
    if (statsSnap.exists()) {
      return statsSnap.data() as FirebaseStats;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error loading user stats from Firebase:', error);
    throw error;
  }
}

/**
 * Fetch all players (for full leaderboard)
 */
export async function getAllPlayersFromFirebase(): Promise<FirebaseStats[]> {
  try {
    console.log('🔄 Fetching all players from Firestore...');
    const statsRef = collection(db, 'stats');
    const q = query(statsRef, orderBy('totalPoints', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const players: FirebaseStats[] = [];
    querySnapshot.forEach((doc) => {
      players.push(doc.data() as FirebaseStats);
    });
    
    console.log(`✅ Loaded ${players.length} total players from Firebase`);
    return players;
  } catch (error: any) {
    console.error('❌ Error loading all players from Firebase:', {
      error,
      message: error?.message,
      code: error?.code
    });
    throw error;
  }
}

/**
 * Save spot history to Firebase
 */
export async function saveSpotHistoryToFirebase(
  userId: string,
  historyEntry: SpotHistoryEntry
): Promise<void> {
  try {
    const historyRef = collection(db, 'spotHistory');
    await addDoc(historyRef, {
      ...historyEntry,
      userId,
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Spot history saved to Firebase');
  } catch (error) {
    console.error('❌ Error saving spot history to Firebase:', error);
    throw error;
  }
}

/**
 * Load spot history from Firebase
 */
export async function loadSpotHistoryFromFirebase(userId: string): Promise<SpotHistoryEntry[]> {
  try {
    console.log('🔄 Loading spot history from Firebase for user:', userId);
    const historyRef = collection(db, 'spotHistory');
    const q = query(
      historyRef, 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const querySnapshot = await getDocs(q);
    
    const history: SpotHistoryEntry[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: data.id,
        hand: data.hand,
        combo: data.combo,
        isCorrect: data.isCorrect,
        timestamp: data.timestamp,
        phase: data.phase,
        points: data.points,
        solutionPath: data.solutionPath,
        nodeId: data.nodeId,
        position: data.position,
        playerAction: data.playerAction,
        ev: data.ev
      });
    });
    
    console.log(`✅ Loaded ${history.length} spot history entries from Firebase`);
    return history;
  } catch (error: any) {
    console.error('❌ Error loading spot history from Firebase:', {
      error,
      message: error?.message,
      code: error?.code,
      userId,
      hint: error?.code === 'failed-precondition' 
        ? 'You need to create a Firestore index for spotHistory collection (userId + timestamp)'
        : error?.code === 'permission-denied'
        ? 'Check Firestore rules - spotHistory read permissions'
        : 'Check network connection and Firebase config'
    });
    throw error;
  }
}

/**
 * Update tournament statistics in Firebase
 */
export async function updateTournamentStatsInFirebase(
  userId: string,
  updates: {
    tournamentsPlayed?: number;
    reachedFinalTable?: number;
    completedTournaments?: number;
  }
): Promise<void> {
  try {
    const statsRef = doc(db, 'stats', userId);
    const updateData: any = {};
    
    if (updates.tournamentsPlayed !== undefined) {
      updateData.tournamentsPlayed = increment(updates.tournamentsPlayed);
    }
    if (updates.reachedFinalTable !== undefined) {
      updateData.reachedFinalTable = increment(updates.reachedFinalTable);
    }
    if (updates.completedTournaments !== undefined) {
      updateData.completedTournaments = increment(updates.completedTournaments);
    }
    
    updateData.lastUpdated = new Date().toISOString();
    
    await updateDoc(statsRef, updateData);
    console.log('✅ Tournament stats updated in Firebase');
  } catch (error) {
    console.error('❌ Error updating tournament stats in Firebase:', error);
    throw error;
  }
}

/**
 * Save a marked hand to Firebase (collection: markedHands)
 */
export async function saveMarkedHandToFirebase(userId: string, markedHand: any): Promise<void> {
  try {
    const markedRef = collection(db, 'markedHands');
    await addDoc(markedRef, { ...markedHand, userId, createdAt: new Date().toISOString() });
    console.log('✅ Marked hand saved to Firebase');
  } catch (error) {
    console.error('❌ Error saving marked hand to Firebase:', error);
    throw error;
  }
}

/**
 * Remove a marked hand by its id (client-generated id field)
 */
export async function removeMarkedHandFromFirebase(userId: string, handId: string): Promise<void> {
  try {
    const markedRef = collection(db, 'markedHands');
    const q = query(markedRef, where('userId', '==', userId), where('id', '==', handId));
    const querySnapshot = await getDocs(q);
    const deletions = querySnapshot.docs.map(docRef => docRef.ref);
    for (const ref of deletions) {
      await updateDoc(ref, { deletedAt: new Date().toISOString() });
      // Note: we mark deletedAt instead of hard delete to preserve audit. If hard delete preferred, use deleteDoc(ref)
    }
    console.log('✅ Marked hand removal processed in Firebase');
  } catch (error) {
    console.error('❌ Error removing marked hand from Firebase:', error);
    throw error;
  }
}

/**
 * Load marked hands for a user
 */
export async function loadMarkedHandsFromFirebase(userId: string): Promise<any[]> {
  try {
    const markedRef = collection(db, 'markedHands');
    const q = query(markedRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const items: any[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      items.push(data);
    });
    console.log(`✅ Loaded ${items.length} marked hands from Firebase`);
    return items;
  } catch (error) {
    console.error('❌ Error loading marked hands from Firebase:', error);
    throw error;
  }
}

/**
 * Reset a user's stats in Firebase (set counters to zero). Use with caution.
 */
export async function resetUserStatsInFirebase(userId: string): Promise<void> {
  try {
    const statsRef = doc(db, 'stats', userId);
    await setDoc(statsRef, {
      userId,
      totalSpots: 0,
      correctSpots: 0,
      incorrectSpots: 0,
      totalPoints: 0,
      tournamentsPlayed: 0,
      reachedFinalTable: 0,
      completedTournaments: 0,
      accuracy: 0,
      lastUpdated: new Date().toISOString(),
      statsByPhase: {}
    }, { merge: true });
    console.log('✅ User stats reset in Firebase');
  } catch (error) {
    console.error('❌ Error resetting user stats in Firebase:', error);
    throw error;
  }
}

/**
 * Delete or mark user's spot history entries in Firebase
 */
export async function deleteSpotHistoryFromFirebase(userId: string): Promise<void> {
  try {
    const historyRef = collection(db, 'spotHistory');
    const q = query(historyRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    for (const docSnap of querySnapshot.docs) {
      // Soft-delete by setting deletedAt; change to deleteDoc(docSnap.ref) to hard delete
      await updateDoc(docSnap.ref, { deletedAt: new Date().toISOString() });
    }
    console.log(`✅ Cleared ${querySnapshot.size} spot history entries for user ${userId}`);
  } catch (error) {
    console.error('❌ Error clearing spot history in Firebase:', error);
    throw error;
  }
}
