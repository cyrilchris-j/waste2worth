import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User, UserRole, RecyclerProfile } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile:  User | null;
  recyclerProfile: RecyclerProfile | null;
  role: UserRole | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userProfile: null,
  recyclerProfile: null,
  role: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile]   = useState<User | null>(null);
  const [recyclerProfile, setRecyclerProfile] = useState<RecyclerProfile | null>(null);
  const [loading, setLoading]           = useState(true);

  const loadProfiles = async (fbUser: FirebaseUser) => {
    try {
      const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
      if (userSnap.exists()) {
        const user = { ...userSnap.data(), userId: fbUser.uid } as User;
        setUserProfile(user);

        if (user.role === 'RECYCLER') {
          const rSnap = await getDoc(doc(db, 'recyclerProfiles', fbUser.uid));
          if (rSnap.exists()) {
            setRecyclerProfile({ ...rSnap.data(), recyclerId: fbUser.uid } as RecyclerProfile);
          }
        }
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
    }
  };

  const refreshProfile = async () => {
    if (firebaseUser) await loadProfiles(firebaseUser);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadProfiles(fbUser);
      } else {
        setUserProfile(null);
        setRecyclerProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const role = userProfile?.role ?? null;

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, recyclerProfile, role, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
