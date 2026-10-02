import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
  } catch (e) {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
})();

export const auth = getAuth(app);

let authResolved = false;
let currentAuthUser: User | null = null;

if (typeof window !== 'undefined') {
  try {
    onAuthStateChanged(auth, (user) => {
      authResolved = true;
      currentAuthUser = user;
    });
  } catch (e) {
    console.warn('Auth observer notice:', e);
  }
}

// Helper to check and validate active authenticated state without hanging operations
export async function ensureAuth(): Promise<User | null> {
  if (authResolved || auth.currentUser) {
    return auth.currentUser || currentAuthUser;
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      authResolved = true;
      resolve(auth.currentUser || null);
    }, 150);

    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timer);
        unsubscribe();
        authResolved = true;
        currentAuthUser = user;
        resolve(user);
      });
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

// Validate connection to Firestore as mandated by integration guidelines
export async function testConnection(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase configuration notice: operating in offline-first mode.');
    }
    return false;
  }
}

// Trigger initial health check in browser
if (typeof window !== 'undefined') {
  testConnection();
}

