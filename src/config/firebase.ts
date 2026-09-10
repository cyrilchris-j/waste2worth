import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { enableMultiTabIndexedDbPersistence, getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Firebase credentials loaded from environment variables with safe development fallbacks.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoDummyKeyForWaste2WorthLocalDev123',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'waste2worth-demo.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || 'waste2worth-demo',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'waste2worth-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

export const firebaseConfigured: boolean = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('DummyKey')
);

// Prevent duplicate initialization
const app: FirebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const firebaseApp: FirebaseApp = app;

// Enable Firestore multi-tab IndexedDB offline persistence for Collector & field operations
if (typeof window !== 'undefined' && db) {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    // Soft catch: unblocking when persistence cannot be enabled (e.g. Incognito or unsupported browser)
    console.info('Firestore offline persistence status:', err?.code || err?.message);
  });
}

export default app;
