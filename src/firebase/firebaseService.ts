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
  increment
} from 'firebase/firestore';
import { db } from './config';

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
  totalPoints: number;
  accuracy: number;
  lastUpdated: string;
}

/**
 * Criar ou atualizar usuário no Firebase
 */
export async function saveUserToFirebase(userId: string, username: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      userId,
      username,
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ User saved to Firebase:', username);
  } catch (error) {
    console.error('❌ Error saving user to Firebase:', error);
    throw error;
  }
}

/**
 * Salvar estatísticas no Firebase
 */
export async function saveStatsToFirebase(
  userId: string,
  username: string,
  isCorrect: boolean
): Promise<void> {
  try {
    const statsRef = doc(db, 'stats', userId);
    
    // Verificar se já existe
    const statsSnap = await getDoc(statsRef);
    
    if (statsSnap.exists()) {
      // Atualizar estatísticas existentes
      await updateDoc(statsRef, {
        totalSpots: increment(1),
        correctSpots: increment(isCorrect ? 1 : 0),
        totalPoints: increment(isCorrect ? 1 : 0),
        lastUpdated: new Date().toISOString()
      });
      
      // Recalcular accuracy
      const updatedSnap = await getDoc(statsRef);
      const data = updatedSnap.data();
      const accuracy = (data!.correctSpots / data!.totalSpots) * 100;
      
      await updateDoc(statsRef, { accuracy });
    } else {
      // Criar novas estatísticas
      await setDoc(statsRef, {
        userId,
        username,
        totalSpots: 1,
        correctSpots: isCorrect ? 1 : 0,
        totalPoints: isCorrect ? 1 : 0,
        accuracy: isCorrect ? 100 : 0,
        lastUpdated: new Date().toISOString()
      });
    }
    
    console.log('✅ Stats saved to Firebase for:', username);
  } catch (error) {
    console.error('❌ Error saving stats to Firebase:', error);
    throw error;
  }
}

/**
 * Buscar top 10 jogadores do Firebase
 */
export async function getTop10FromFirebase(): Promise<FirebaseStats[]> {
  try {
    const statsRef = collection(db, 'stats');
    const q = query(statsRef, orderBy('totalPoints', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    const top10: FirebaseStats[] = [];
    querySnapshot.forEach((doc) => {
      top10.push(doc.data() as FirebaseStats);
    });
    
    console.log('✅ Loaded top 10 from Firebase:', top10.length, 'players');
    return top10;
  } catch (error) {
    console.error('❌ Error loading top 10 from Firebase:', error);
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
    const statsRef = collection(db, 'stats');
    const q = query(statsRef, orderBy('totalPoints', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const players: FirebaseStats[] = [];
    querySnapshot.forEach((doc) => {
      players.push(doc.data() as FirebaseStats);
    });
    
    console.log('✅ Loaded all players from Firebase:', players.length);
    return players;
  } catch (error) {
    console.error('❌ Error loading all players from Firebase:', error);
    throw error;
  }
}
