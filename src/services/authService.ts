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

// ─────────────────────────────────────────────
// COLLECTOR & RECYCLER REGISTRATION (PHASE 2 & 3)
// ─────────────────────────────────────────────

export interface CollectorRegistrationData {
  name: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  preferredLanguage?: string;
  address?: string;
}

export async function registerCollector(data: CollectorRegistrationData) {
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const { uid } = credential.user;

  await updateProfile(credential.user, { displayName: data.name });

  if (db) {
    try {
      await setDoc(doc(db, 'users', uid), {
        userId: uid,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        city: data.city || '',
        role: 'COLLECTOR',
        verificationStatus: 'VERIFIED',
        preferredLanguage: data.preferredLanguage || 'en',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'ACTIVE',
      });

      await setDoc(doc(db, 'collectorProfiles', uid), {
        collectorId: uid,
        fullName: data.name,
        displayName: data.name,
        phone: data.phone || '',
        email: data.email,
        location: data.city || '',
        address: data.address || data.city || '',
        collectorType: 'Independent Collector',
        termsAccepted: true,
        participationTermsAccepted: true,
        status: 'VERIFIED',
        preferredLanguage: data.preferredLanguage || 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalLots: 0,
        completedLots: 0,
        earnings: 0,
      });
    } catch (fErr) {
      console.warn('[Collector Registration] Error creating Firestore profile docs:', fErr);
    }
  }

  return credential.user;
}

export interface RecyclerRegistrationData {
  orgName: string;
  contactPerson: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  cpcbRegistrationNo: string;
  acceptedCategories: string[];
  dailyCapacityKg?: number;
  preferredLanguage?: string;
}

export async function registerRecycler(data: RecyclerRegistrationData) {
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const { uid } = credential.user;

  await updateProfile(credential.user, { displayName: data.contactPerson });

  if (db) {
    try {
      await setDoc(doc(db, 'users', uid), {
        userId: uid,
        name: data.orgName,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone || '',
        city: data.city || '',
        role: 'RECYCLER',
        verificationStatus: 'PENDING',
        preferredLanguage: data.preferredLanguage || 'en',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'PENDING_VERIFICATION',
      });

      await setDoc(doc(db, 'recyclerProfiles', uid), {
        recyclerId: uid,
        facilityName: data.orgName,
        contactPerson: data.contactPerson,
        phone: data.phone || '',
        email: data.email,
        address: data.city || '',
        cpcbRegistrationNo: data.cpcbRegistrationNo || '',
        dailyCapacityKg: Number(data.dailyCapacityKg) || 1000,
        acceptedCategories: data.acceptedCategories || ['PCB', 'BATTERY', 'DISPLAY', 'CABLE', 'MIXED', 'Laptop', 'LAPTOP'],
        verificationStatus: 'PENDING',
        preferredLanguage: data.preferredLanguage || 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (fErr) {
      console.warn('[Recycler Registration] Error creating Firestore profile docs:', fErr);
    }
  }

  return credential.user;
}
