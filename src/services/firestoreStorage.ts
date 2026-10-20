import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AppState } from '../types';
import { db } from './firebase';

const userStateRef = (uid: string) => doc(db, 'users', uid, 'app', 'state');

export async function loadUserAppState(uid: string): Promise<AppState | null> {
  const snapshot = await getDoc(userStateRef(uid));
  if (!snapshot.exists()) return null;
  return snapshot.data().state as AppState;
}

export async function saveUserAppState(uid: string, state: AppState): Promise<void> {
  await setDoc(userStateRef(uid), {
    state,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
