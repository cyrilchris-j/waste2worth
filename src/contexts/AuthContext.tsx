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

const createDefaultRecyclerProfile = (userId: string, name?: string, email?: string): RecyclerProfile => ({
  recyclerId: userId,
  facilityName: name || 'EcoMetal Circular Solutions',
  contactPerson: name || 'Cyril Chris',
  email: email || 'cyril@recycler.local',
  phone: '+91 91234 56789',
  address: 'SIPCOT Industrial Park, Sriperumbudur',
  state: 'Tamil Nadu',
  pincode: '602105',
  cpcbRegistrationNo: 'TNPCB/E-WASTE/2024/0981',
  cpcbValidityDate: '2028-12-31',
  dailyCapacityKg: 5000,
  acceptedCategories: ['PCB', 'BATTERY', 'DISPLAY', 'CABLE', 'MIXED'],
  verificationStatus: 'VERIFIED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createDefaultCollectorProfile = (userId: string, name?: string, email?: string): CollectorProfile => ({
  collectorId: userId,
  fullName: name || 'Ashok Kumar',
  displayName: name || 'Ashok Kumar',
  phone: '+91 98765 43210',
  email: email || 'ashok@collector.local',
  location: 'Ambattur Industrial Estate, Chennai',
  collectorType: 'Independent Scrap Aggregator',
  termsAccepted: true,
  participationTermsAccepted: true,
  status: 'VERIFIED',
  createdAt: new Date().toISOString(),
  totalLots: 4,
  completedLots: 2,
  earnings: 12500,
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
          } else {
            setRecyclerProfile(createDefaultRecyclerProfile(fbUser.uid, user.name, user.email));
          }
        } else if (user.role === 'COLLECTOR') {
          const cSnap = await getDoc(doc(db, 'collectorProfiles', fbUser.uid));
          if (cSnap.exists()) {
            setCollectorProfile({ ...cSnap.data(), collectorId: fbUser.uid } as CollectorProfile);
          } else {
            setCollectorProfile(createDefaultCollectorProfile(fbUser.uid, user.name, user.email));
          }
        }
      } else {
        // Fallback for demo/test user without firestore doc
        let defaultRole: UserRole = 'RECYCLER';
        if (fbUser.email?.toLowerCase().includes('collector')) defaultRole = 'COLLECTOR';
        else if (fbUser.email?.toLowerCase().includes('admin')) defaultRole = 'ADMIN';

        const name = fbUser.displayName || (defaultRole === 'COLLECTOR' ? 'Ashok Kumar' : defaultRole === 'ADMIN' ? 'Prasanna' : 'Cyril Chris');

        const userObj: User = {
          userId: fbUser.uid,
          role: defaultRole,
          email: fbUser.email || '',
          name,
          displayName: name,
          createdAt: new Date().toISOString()
        };
        setUserProfile(userObj);
        if (defaultRole === 'COLLECTOR') {
          setCollectorProfile(createDefaultCollectorProfile(fbUser.uid, name, fbUser.email || undefined));
        } else if (defaultRole === 'RECYCLER') {
          setRecyclerProfile(createDefaultRecyclerProfile(fbUser.uid, name, fbUser.email || undefined));
        }
      }
    } catch (err) {
      console.warn('Could not query Firestore profiles (likely offline or demo credentials):', err);
      let defaultRole: UserRole = 'RECYCLER';
      if (fbUser.email?.toLowerCase().includes('collector')) defaultRole = 'COLLECTOR';
      else if (fbUser.email?.toLowerCase().includes('admin')) defaultRole = 'ADMIN';

      const name = fbUser.displayName || (defaultRole === 'COLLECTOR' ? 'Ashok Kumar' : defaultRole === 'ADMIN' ? 'Prasanna' : 'Cyril Chris');

      setUserProfile((prev) => prev ?? {
        userId: fbUser.uid,
        role: defaultRole,
        email: fbUser.email || '',
        name,
        createdAt: new Date().toISOString()
      });
      if (defaultRole === 'COLLECTOR') {
        setCollectorProfile((prev) => prev ?? createDefaultCollectorProfile(fbUser.uid, name, fbUser.email || undefined));
      } else if (defaultRole === 'RECYCLER') {
        setRecyclerProfile((prev) => prev ?? createDefaultRecyclerProfile(fbUser.uid, name, fbUser.email || undefined));
      }
    }
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      await loadProfiles(firebaseUser);
    }
  };

  const setDemoUser = (user: User, colProfile?: CollectorProfile, recProfile?: RecyclerProfile) => {
    setUserProfile(user);
    if (colProfile) {
      setCollectorProfile(colProfile);
    } else if (user.role === 'COLLECTOR') {
      setCollectorProfile(createDefaultCollectorProfile(user.userId, user.name, user.email));
    }
    if (recProfile) {
      setRecyclerProfile(recProfile);
    } else if (user.role === 'RECYCLER') {
      setRecyclerProfile(createDefaultRecyclerProfile(user.userId, user.name, user.email));
    }
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
          if (parsed.colProfile) {
            setCollectorProfile(parsed.colProfile);
          } else if (parsed.user.role === 'COLLECTOR') {
            setCollectorProfile(createDefaultCollectorProfile(parsed.user.userId, parsed.user.name, parsed.user.email));
          }
          if (parsed.recProfile) {
            setRecyclerProfile(parsed.recProfile);
          } else if (parsed.user.role === 'RECYCLER') {
            setRecyclerProfile(createDefaultRecyclerProfile(parsed.user.userId, parsed.user.name, parsed.user.email));
          }
          setLoading(false);
        }
      } catch {
        // ignore
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setLoading(true);
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
