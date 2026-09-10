import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User, UserRole, RecyclerProfile, CollectorProfile } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile:  User | null;
  recyclerProfile: RecyclerProfile | null;
  collectorProfile: CollectorProfile | null;
  role: UserRole | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  setDemoUser: (user: User, collectorProfile?: CollectorProfile, recyclerProfile?: RecyclerProfile) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userProfile: null,
  recyclerProfile: null,
  collectorProfile: null,
  role: null,
  loading: true,
  refreshProfile: async () => {},
  setDemoUser: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile]   = useState<User | null>(null);
  const [recyclerProfile, setRecyclerProfile] = useState<RecyclerProfile | null>(null);
  const [collectorProfile, setCollectorProfile] = useState<CollectorProfile | null>(null);
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
        } else if (user.role === 'COLLECTOR') {
          const cSnap = await getDoc(doc(db, 'collectorProfiles', fbUser.uid));
          if (cSnap.exists()) {
            setCollectorProfile({ ...cSnap.data(), collectorId: fbUser.uid } as CollectorProfile);
          }
        }
      } else {
        // Fallback for demo/test user without firestore doc
        const defaultRole: UserRole = 'RECYCLER';
        setUserProfile({
          userId: fbUser.uid,
          role: defaultRole,
          email: fbUser.email || '',
          name: fbUser.displayName || 'Demo User',
          displayName: fbUser.displayName || 'Demo User',
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Could not query Firestore profiles (likely offline or demo credentials):', err);
      // Do not crash - retain user record with fallback
      setUserProfile(prev => prev ?? {
        userId: fbUser.uid,
        role: 'RECYCLER',
        email: fbUser.email || '',
        name: fbUser.displayName || 'Demo User',
        createdAt: new Date().toISOString()
      });
    }
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      await loadProfiles(firebaseUser);
    }
  };

  const setDemoUser = (user: User, colProfile?: CollectorProfile, recProfile?: RecyclerProfile) => {
    setUserProfile(user);
    if (colProfile) setCollectorProfile(colProfile);
    if (recProfile) setRecyclerProfile(recProfile);
    localStorage.setItem('waste2worth:demo_user', JSON.stringify({ user, colProfile, recProfile }));
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    localStorage.removeItem('waste2worth:demo_user');
    localStorage.removeItem('waste2worth:user');
    setFirebaseUser(null);
    setUserProfile(null);
    setRecyclerProfile(null);
    setCollectorProfile(null);
  };

  useEffect(() => {
    // Check if demo user saved in localStorage first
    const saved = localStorage.getItem('waste2worth:demo_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.user) {
          setUserProfile(parsed.user);
          if (parsed.colProfile) setCollectorProfile(parsed.colProfile);
          if (parsed.recProfile) setRecyclerProfile(parsed.recProfile);
          setLoading(false);
        }
      } catch {
        // ignore
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadProfiles(fbUser);
      } else {
        // If not demo user in localStorage, clear
        const hasDemo = localStorage.getItem('waste2worth:demo_user');
        if (!hasDemo) {
          setUserProfile(null);
          setRecyclerProfile(null);
          setCollectorProfile(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const role = userProfile?.role ?? null;

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      recyclerProfile,
      collectorProfile,
      role,
      loading,
      refreshProfile,
      setDemoUser,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
