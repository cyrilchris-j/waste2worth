import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { enableMultiTabIndexedDbPersistence, getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

// Firebase credentials loaded from environment variables with project fallbacks
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBtM6EwXSS0jXeru9TDtdL00eUamHbrK1w',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'waste2worth-74002.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || 'waste2worth-74002',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'waste2worth-74002.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '83976336516',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:83976336516:web:762341e3da458f8f95fed1',
};

export const firebaseConfigured: boolean = true;

// Prevent duplicate initialization
const app: FirebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const firebaseApp: FirebaseApp = app;

// Initialize Analytics conditionally
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => undefined);
}

// Enable Firestore multi-tab IndexedDB offline persistence for Collector & field operations
if (typeof window !== 'undefined' && db) {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    console.info('Firestore offline persistence status:', err?.code || err?.message);
  });
}

export default app;
