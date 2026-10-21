import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AppState } from '../types';
import { db } from './firebase';
import { decryptJson, encryptJson, isEncryptedPayload } from './encryption';

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
  if (code === 'data/passphrase') return 'Data passphrase ghalat hai ya encrypted data damaged hai. Dobara passphrase enter karein.';
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

export async function loadUserAppState(uid: string, passphrase: string): Promise<AppState | null> {
  const snapshot = await getDoc(userStateRef(uid));
  if (!snapshot.exists()) return null;
  const rawState = snapshot.data().state;
  if (!isEncryptedPayload(rawState)) {
    // One-time migration: legacy plaintext state is loaded only by the
    // authenticated client, then the next queued save replaces it with
    // encrypted ciphertext using the user's new data passphrase.
    return rawState as AppState;
  }
  return decryptJson<AppState>(rawState, passphrase);
}

export async function saveUserAppState(uid: string, state: AppState, passphrase: string): Promise<void> {
  const encryptedState = await encryptJson(removeUndefined(state), passphrase);
  await setDoc(userStateRef(uid), {
    state: encryptedState,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
