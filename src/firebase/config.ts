import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Substituir com suas credenciais do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAgoINJ1gDv1cUADDRZfF2uzb0BztrOgfw",
  authDomain: "gtoprivate-8ed0a.firebaseapp.com",
  projectId: "gtoprivate-8ed0a",
  storageBucket: "gtoprivate-8ed0a.firebasestorage.app",
  messagingSenderId: "80841591955",
  appId: "1:80841591955:web:903868211fc1d5e0d8d166",
  measurementId: "G-02CH05HZMS"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
