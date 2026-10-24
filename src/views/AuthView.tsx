import React, { FormEvent, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, Facebook, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthViewProps {
  onAuthenticated: () => void;
}

type AuthMode = 'login' | 'signup';

const readableAuthError = (error: unknown) => {
  const code = (error as { code?: string })?.code || '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email ya password ghalat hai.',
    'auth/invalid-email': 'Valid email enter karein.',
    'auth/email-already-in-use': 'Is email par account pehle se mojood hai.',
    'auth/weak-password': 'Password kam az kam 6 characters ka hona chahiye.',
    'auth/user-disabled': 'Yeh account disable hai.',
    'auth/popup-closed-by-user': 'Social login popup band kar diya gaya.',
    'auth/operation-not-allowed': 'Is login method ko Firebase Console mein enable karein.',
    'auth/network-request-failed': 'Network connection check karein.',
  };
  return messages[code] || 'Authentication mein masla hua. Dobara try karein.';
};

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setNotice('');
    setPassword('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'signup' && name.trim().length < 2) {
      setError('Apna naam enter karein.');
      return;
    }
    if (!email.includes('@')) {
      setError('Valid email enter karein.');
      return;
    }
    if (password.length < 6) {
      setError('Password kam az kam 6 characters ka hona chahiye.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      onAuthenticated();
    } catch (authError) {
      setError(readableAuthError(authError));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setNotice('');
    if (!email.includes('@')) {
      setError('Pehle apna email enter karein.');
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice('Password reset email bhej di gayi hai.');
    } catch (authError) {
      setError(readableAuthError(authError));
    } finally {
      setBusy(false);
    }
  };

  const handleSocial = async (providerName: 'Google' | 'Facebook') => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const provider = providerName === 'Google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
      onAuthenticated();
    } catch (authError) {
      setError(readableAuthError(authError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell" dir="ltr">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <main className="auth-layout">
        <section className="auth-hero" aria-label="Hisab Dost introduction">
          <div className="auth-brand-row">
            <img className="auth-brand-logo" src="/pwa-512x512.png" alt="Hisab Dost" />
            <div>
              <span className="auth-kicker">HISAB DOST</span>
              <span className="auth-brand-caption">Smart shop ledger</span>
            </div>
          </div>
          <div className="auth-heading">
            <span className="auth-eyebrow">BUILT FOR PAKISTANI SHOPKEEPERS</span>
            <h1>Apna hisaab,<br /><em>asaani se.</em></h1>
            <p>Sales, Khata aur roz ka kharcha — sab ek hi jagah, simple aur clear.</p>
          </div>
          <div className="auth-feature-grid">
            <div><strong>Khata</strong><span>Customer balances</span></div>
            <div><strong>Sales</strong><span>Daily business</span></div>
            <div><strong>Reports</strong><span>Clear decisions</span></div>
          </div>
          <div className="auth-trust"><ShieldCheck size={16} /><span>Your business records stay private to your account.</span></div>
        </section>

      <div className="auth-card-wrap">
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-kicker">WELCOME TO HISAB DOST</div>
          <h2 id="auth-title">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Login to continue to Hisab Dost' : 'Start managing your business today'}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <label className="auth-field">
                <span>Name</span>
                <div className="auth-input-wrap">
                  <UserRound size={18} />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" autoComplete="name" disabled={busy} />
                </div>
              </label>
            )}
            <label className="auth-field">
              <span>Email</span>
              <div className="auth-input-wrap">
                <Mail size={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" disabled={busy} />
              </div>
            </label>
            <label className="auth-field">
              <span className="auth-label-row">Password {mode === 'login' && <button type="button" className="auth-link auth-forgot" onClick={handleResetPassword} disabled={busy}>Forgot password?</button>}</span>
              <div className="auth-input-wrap">
                <LockKeyhole size={18} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} disabled={busy} />
                <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </label>
            {error && <p className="auth-message auth-error" role="alert">{error}</p>}
            {notice && <p className="auth-message auth-notice" role="status"><Check size={16} /> {notice}</p>}
            <button className="auth-primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Sign Up'} {!busy && <ArrowRight size={18} />}</button>
          </form>

          <div className="auth-divider"><span>or continue with</span></div>
          <div className="auth-socials">
            <button type="button" className="auth-social google" onClick={() => handleSocial('Google')} disabled={busy}><strong>G</strong><span>Google</span></button>
            <button type="button" className="auth-social facebook" onClick={() => handleSocial('Facebook')} disabled={busy}><Facebook size={19} fill="currentColor" /><span>Facebook</span></button>
          </div>
          <p className="auth-switch">{mode === 'login' ? 'Not registered yet?' : 'Already have an account?'} <button type="button" className="auth-link" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Sign Up' : 'Log In'} <ArrowRight size={14} /></button></p>
        </section>
      </div>
      </main>
      <p className="auth-footer">Simple hisaab-kitab for a smarter shop.</p>
    </div>
  );
};
