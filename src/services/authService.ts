import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { UserRole } from '../types';

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: UserRole
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = credential.user;

  await updateProfile(credential.user, { displayName: name });

  await setDoc(doc(db, 'users', uid), {
    userId: uid,
    name,
    email,
    phone: '',
    role,
    verificationStatus: 'PENDING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return credential.user;
}

export async function loginUser(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  return signOut(auth);
}

export async function getUserProfile(userId: string) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
}

// ─────────────────────────────────────────────
// DEMO AUTH WITH REAL FIREBASE (FIX 2)
// ─────────────────────────────────────────────

export async function loginOrCreateDemoUser(demoRole: 'COLLECTOR' | 'RECYCLER' | 'ADMIN') {
  const env = import.meta.env;
  const config = {
    COLLECTOR: {
      email: env.VITE_DEMO_COLLECTOR_EMAIL || 'collector.ashok@waste2worth.test',
      password: env.VITE_DEMO_COLLECTOR_PASSWORD || 'AshokCollector@2026',
      name: 'Ashok Kumar',
      phone: '+91 98765 43210',
      location: 'Ambattur Industrial Estate, Chennai',
    },
    RECYCLER: {
      email: env.VITE_DEMO_RECYCLER_EMAIL || 'recycler.cyril@waste2worth.test',
      password: env.VITE_DEMO_RECYCLER_PASSWORD || 'CyrilRecycler@2026',
      name: 'Cyril EcoMetal Corp',
      phone: '+91 91234 56789',
      facilityName: 'EcoMetal Circular Solutions',
      cpcbRegistrationNo: 'TNPCB/E-WASTE/2024/0981',
    },
    ADMIN: {
      email: env.VITE_DEMO_ADMIN_EMAIL || 'admin.prasanna@waste2worth.test',
      password: env.VITE_DEMO_ADMIN_PASSWORD || 'PrasannaAdmin@2026',
      name: 'Prasanna (Platform Admin)',
      phone: '+91 99999 88888',
    },
  }[demoRole];

  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, config.email, config.password);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/invalid-login-credentials'
    ) {
      credential = await createUserWithEmailAndPassword(auth, config.email, config.password);
      await updateProfile(credential.user, { displayName: config.name });
    } else {
      throw err;
    }
  }

  const uid = credential.user.uid;

  // Provision profile documents in Firestore so rules grant role-based authorization
  if (db) {
    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          userId: uid,
          name: config.name,
          email: config.email,
          phone: config.phone,
          role: demoRole,
          verificationStatus: 'VERIFIED',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (demoRole === 'COLLECTOR') {
        await setDoc(
          doc(db, 'collectorProfiles', uid),
          {
            collectorId: uid,
            fullName: config.name,
            phone: config.phone,
            email: config.email,
            location: config.location,
            status: 'VERIFIED',
            termsAccepted: true,
            participationTermsAccepted: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else if (demoRole === 'RECYCLER') {
        await setDoc(
          doc(db, 'recyclerProfiles', uid),
          {
            recyclerId: uid,
            facilityName: config.facilityName,
            contactPerson: 'Cyril Chris',
            phone: config.phone,
            email: config.email,
            cpcbRegistrationNo: config.cpcbRegistrationNo,
            verificationStatus: 'VERIFIED',
            acceptedCategories: ['PCB', 'BATTERY', 'DISPLAY', 'CABLE', 'MIXED', 'Laptop', 'LAPTOP'],
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (fErr) {
      console.warn('Could not write demo profile to Firestore:', fErr);
    }
  }

  return credential.user;
}
