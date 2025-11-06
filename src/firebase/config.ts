import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Read config from Vite env variables when available, fall back to the embedded values
// (Keep the embedded values only as a fallback for older setups.)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAgoINJ1gDv1cUADDRZfF2uzb0BztrOgfw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gtoprivate-8ed0a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gtoprivate-8ed0a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gtoprivate-8ed0a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "80841591955",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:80841591955:web:903868211fc1d5e0d8d166",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-02CH05HZMS"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
