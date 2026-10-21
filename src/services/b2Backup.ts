import { getFunctions, httpsCallable } from 'firebase/functions';
import { AppState } from '../types';
import { firebaseApp } from './firebase';

const functions = getFunctions(firebaseApp);

export async function uploadBackup(state: AppState): Promise<void> {
  const payload = JSON.stringify(state);
  const call = httpsCallable<{ encryptedPayload: string }, { ok: boolean }>(functions, 'uploadEncryptedBackup');
  await call({ encryptedPayload: payload });
}

export async function restoreBackup(): Promise<AppState> {
  const call = httpsCallable<undefined, { ok: boolean; encryptedPayload: string }>(functions, 'restoreEncryptedBackup');
  const result = await call(undefined);
  return JSON.parse(result.data.encryptedPayload) as AppState;
}
