import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AppState } from '../types';
import { db } from './firebase';

const userStateRef = (uid: string) => doc(db, 'users', uid, 'app', 'state');

function removeUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => removeUndefined(item)) as T;
  if (value && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (item !== undefined) cleaned[key] = removeUndefined(item);
    });
    return cleaned as T;
  }
  return value;
}

export function getFirebaseErrorMessage(error: unknown, action: 'load' | 'save' = 'load'): string {
  const code = (error as { code?: string })?.code || '';
  if (code.includes('permission-denied')) {
    return 'Firestore permission denied. Firebase Console mein firestore.rules deploy karein aur ensure karein ke user signed in hai.';
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'Network/Firebase service unavailable. Internet check karke Retry karein.';
  }
  if (code.includes('failed-precondition')) {
    return 'Firestore database setup complete nahi hai. Firebase Console mein Firestore Database create karein.';
  }
  if (code.includes('invalid-argument')) {
    return `Firestore ${action} payload invalid hai. Optional empty fields clean karke dobara try karein.`;
  }
  return `Data ${action} nahi ho saka. Firebase Console aur browser connection check karein.`;
}

export async function loadUserAppState(uid: string): Promise<AppState | null> {
  const snapshot = await getDoc(userStateRef(uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data().state;
  return data ? data as AppState : null;
}

export async function saveUserAppState(uid: string, state: AppState): Promise<void> {
  const cleanState = removeUndefined(state);
  await setDoc(userStateRef(uid), {
    state: cleanState,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
