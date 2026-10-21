import { get, ref, serverTimestamp, set } from 'firebase/database';
import { AppState } from '../types';
import { realtimeDb } from './firebase';

const cloudStateRef = (uid: string) => ref(realtimeDb, `users/${uid}/app/state`);
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
  if (code.includes('permission-denied')) return 'Cloud access denied. Your data is being saved on this device.';
  if (code.includes('unavailable') || code.includes('network')) return 'Firebase unavailable. Your data is being saved on this device.';
  if (code.includes('invalid-argument')) return `Data ${action} payload invalid hai. Dobara try karein.`;
  return `Data ${action} nahi ho saka. Your data is being saved on this device.`;
}

export async function loadUserAppState(uid: string): Promise<AppState | null> {
  try {
    const snapshot = await get(cloudStateRef(uid));
    if (snapshot.exists()) {
      const cloudState = snapshot.val() as AppState;
      writeLocalState(uid, cloudState);
      return cloudState;
    }
  } catch (error) {
    console.info('Realtime Database unavailable; using this device storage.', error);
  }
  return readLocalState(uid);
}

export async function saveUserAppState(uid: string, state: AppState): Promise<void> {
  const cleanState = removeUndefined(state);
  writeLocalState(uid, cleanState);
  try {
    await set(cloudStateRef(uid), {
      ...cleanState,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.info('Realtime Database unavailable; local device save completed.', error);
  }
}
