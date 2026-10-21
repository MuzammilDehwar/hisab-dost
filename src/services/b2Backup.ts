import { getFunctions, httpsCallable } from 'firebase/functions';
import { AppState } from '../types';
import { decryptJson, encryptJson } from './encryption';
import { firebaseApp } from './firebase';

const functions = getFunctions(firebaseApp);

export async function uploadEncryptedBackup(state: AppState, passphrase: string): Promise<void> {
  const encryptedPayload = JSON.stringify(await encryptJson(state, passphrase));
  const call = httpsCallable<{ encryptedPayload: string }, { ok: boolean }>(functions, 'uploadEncryptedBackup');
  await call({ encryptedPayload });
}

export async function restoreEncryptedBackup(passphrase: string): Promise<AppState> {
  const call = httpsCallable<undefined, { ok: boolean; encryptedPayload: string }>(functions, 'restoreEncryptedBackup');
  const result = await call(undefined);
  return decryptJson<AppState>(JSON.parse(result.data.encryptedPayload), passphrase);
}
