import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AppState } from '../types';
import { db } from './firebase';

const userStateRef = (uid: string) => doc(db, 'users', uid, 'app', 'state');
const localStateKey = (uid: string) => `hisab-dost-local-state:${uid}`;

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

function readLocalState(uid: string): AppState | null {
  try {
    const raw = window.localStorage.getItem(localStateKey(uid));
    return raw ? JSON.parse(raw) as AppState : null;
  } catch {
    return null;
  }
}

function writeLocalState(uid: string, state: AppState): void {
  try {
    window.localStorage.setItem(localStateKey(uid), JSON.stringify(removeUndefined(state)));
  } catch (error) {
    console.warn('Local backup could not be written:', error);
  }
}

export function getFirebaseErrorMessage(error: unknown, action: 'load' | 'save' = 'load'): string {
  const code = (error as { code?: string })?.code || '';
  if (code.includes('permission-denied')) {
    return 'Cloud access unavailable. Your data is being saved on this device.';
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'Firebase unavailable. Your data is being saved on this device.';
  }
  if (code.includes('failed-precondition')) {
    return 'Cloud database is not enabled yet. Your data is being saved on this device.';
  }
  if (code.includes('invalid-argument')) {
    return `Data ${action} payload invalid hai. Optional empty fields clean karke dobara try karein.`;
  }
  return `Data ${action} nahi ho saka. Your data is being saved on this device.`;
}

export async function loadUserAppState(uid: string): Promise<AppState | null> {
  try {
    const snapshot = await getDoc(userStateRef(uid));
    if (snapshot.exists()) {
      const rawState = snapshot.data().state;
      if (rawState && typeof rawState === 'object' && 'ciphertext' in rawState) return readLocalState(uid);
      const cloudState = rawState as AppState;
      writeLocalState(uid, cloudState);
      return cloudState;
    }
  } catch (error) {
    console.info('Firestore unavailable; using this device storage.', error);
  }
  return readLocalState(uid);
}

export async function saveUserAppState(uid: string, state: AppState): Promise<void> {
  const cleanState = removeUndefined(state);
  // Always save locally first so the free version works without Firestore billing.
  writeLocalState(uid, cleanState);
  try {
    await setDoc(userStateRef(uid), {
      state: cleanState,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.info('Firestore unavailable; local device save completed.', error);
  }
}
