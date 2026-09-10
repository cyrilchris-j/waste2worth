import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase credentials loaded exclusively from environment variables.
// Never hardcode secrets. Copy .env.example to .env and fill in values.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoDummyKeyForWaste2WorthLocalDev123',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'waste2worth-demo.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || 'waste2worth-demo',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'waste2worth-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

const app  = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

export default app;
