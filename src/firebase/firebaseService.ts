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
  incorrectSpots: number; // Spots errados (para calcular blunders)
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
      incorrect: number; // Errados por fase
      points: number;
    };
  };
}

/**
 * Criar ou atualizar usuário no Firebase
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
    
    // Mensagens de ajuda específicas por erro
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
 * Salvar estatísticas no Firebase
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
    
    // Verificar se já existe
    const statsSnap = await getDoc(statsRef);
    
    const pointsToAdd = points !== undefined ? points : (isCorrect ? 1 : 0);
    
    if (statsSnap.exists()) {
      console.log('📝 Firebase: Updating existing stats document...');
      const data = statsSnap.data();
      const statsByPhase = data.statsByPhase || {};
      
      // Atualizar estatísticas por fase se fornecida
      if (phase) {
        if (!statsByPhase[phase]) {
          statsByPhase[phase] = { total: 0, correct: 0, incorrect: 0, points: 0 };
        }
        statsByPhase[phase].total += 1;
        statsByPhase[phase].correct += isCorrect ? 1 : 0;
        statsByPhase[phase].incorrect += isCorrect ? 0 : 1;
        statsByPhase[phase].points += pointsToAdd;
      }
      
      // Atualizar estatísticas gerais
      await updateDoc(statsRef, {
        totalSpots: increment(1),
        correctSpots: increment(isCorrect ? 1 : 0),
        incorrectSpots: increment(isCorrect ? 0 : 1),
        totalPoints: increment(pointsToAdd),
        lastUpdated: new Date().toISOString(),
        statsByPhase
      });
      
      // Recalcular accuracy
      const updatedSnap = await getDoc(statsRef);
      const updatedData = updatedSnap.data();
      const accuracy = (updatedData!.correctSpots / updatedData!.totalSpots) * 100;
      
      await updateDoc(statsRef, { accuracy });
      console.log('✅ Firebase: Stats updated successfully!');
    } else {
      console.log('📝 Firebase: Creating new stats document...');
      // Criar novas estatísticas
      const statsByPhase: any = {};
      if (phase) {
        statsByPhase[phase] = {
          total: 1,
          correct: isCorrect ? 1 : 0,
          incorrect: isCorrect ? 0 : 1,
          points: pointsToAdd
        };
      }
      
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
 * Buscar top 10 jogadores do Firebase
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
 * Buscar estatísticas de um usuário específico
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
 * Buscar todos os jogadores (para leaderboard completo)
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
 * Salvar histórico de mão no Firebase
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
 * Carregar histórico de mãos do Firebase
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
 * Atualizar estatísticas de torneio no Firebase
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
