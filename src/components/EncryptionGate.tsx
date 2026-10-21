import React, { useState } from 'react';
import { LockKeyhole } from 'lucide-react';

interface Props {
  onUnlock: (passphrase: string) => void;
  error?: string | null;
}

export const EncryptionGate: React.FC<Props> = ({ onUnlock, error }) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [hasExistingData, setHasExistingData] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (passphrase.trim().length < 12) return;
    if (!hasExistingData && passphrase !== confirmation) return;
    onUnlock(passphrase);
  };

  return (
    <div className="auth-shell">
      <section className="auth-card" aria-labelledby="encryption-title">
        <div className="auth-icon-bubble"><LockKeyhole size={28} /></div>
        <h2 id="encryption-title">Private data unlock</h2>
        <p className="auth-subtitle">Your ledger is encrypted before it reaches Firebase.</p>
        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          Use a separate data passphrase, not your Firebase login password. Firebase admins will only see encrypted data. If you forget this passphrase, the encrypted ledger cannot be recovered.
        </div>
        <label className="auth-field">
          Data passphrase
          <span className="auth-input-wrap"><input autoFocus type="password" minLength={12} value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder="At least 12 characters" autoComplete="new-password" /></span>
        </label>
        <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={hasExistingData} onChange={(event) => setHasExistingData(event.target.checked)} />
          I am unlocking an existing encrypted ledger
        </label>
        {!hasExistingData && <label className="auth-field mt-3">
          Confirm passphrase
          <span className="auth-input-wrap"><input type="password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repeat passphrase" autoComplete="new-password" /></span>
        </label>}
        {error && <p className="auth-message auth-error mt-3" role="alert">{error}</p>}
        <button className="auth-primary mt-4 w-full" type="button" onClick={submit} disabled={passphrase.trim().length < 12 || (!hasExistingData && passphrase !== confirmation)}>
          Unlock private ledger
        </button>
      </section>
    </div>
  );
};
