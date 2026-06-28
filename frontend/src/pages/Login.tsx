import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

type UserType = 'fte' | 'backroom';
const backroomEmail = (opsId: string) => `${opsId.trim().toLowerCase()}@backroom.soc5.internal`;

export function Login() {
  const [type, setType] = useState<UserType>('fte');
  const [email, setEmail] = useState(''); const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false); const [opsId, setOpsId] = useState('');
  const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  function switchType(next: UserType) { setType(next); setError(''); setCodeSent(false); setCode(''); }
  async function signInWithGoogle() {
    setError(''); setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { hd: 'spxexpress.com', prompt: 'select_account' },
        },
      });
      if (error) throw error;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in with Google.');
      setBusy(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (type === 'fte') {
        const normalized = email.trim().toLowerCase();
        if (!normalized.endsWith('@spxexpress.com')) throw new Error('Use your @spxexpress.com work email.');
        if (!codeSent) {
          const { error } = await supabase.auth.signInWithOtp({ email: normalized, options: { shouldCreateUser: true } });
          if (error) throw error; setCodeSent(true);
        } else {
          const { error } = await supabase.auth.verifyOtp({ email: normalized, token: code.trim(), type: 'email' });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: backroomEmail(opsId), password });
        if (error) throw error;
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to sign in.'); }
    finally { setBusy(false); }
  }
  return <main className="login"><section><p className="eyebrow">SHOPEE SORTING FACILITY</p><h1>SOC 5 Outbound</h1><p>Truck requests, assignments, and docking in one auditable workflow.</p></section><form onSubmit={submit}><h2>Sign in</h2><div className="user-toggle" role="tablist" aria-label="User type"><button type="button" className={type === 'fte' ? 'selected' : ''} onClick={() => switchType('fte')}>FTE</button><button type="button" className={type === 'backroom' ? 'selected' : ''} onClick={() => switchType('backroom')}>Backroom</button></div>{type === 'fte' ? <><button type="button" className="google-button" disabled={busy} onClick={signInWithGoogle}><span aria-hidden="true">G</span>Continue with Google</button><div className="auth-divider"><span>or use email verification</span></div><label>SPX work email<input type="email" required disabled={codeSent} placeholder="name@spxexpress.com" value={email} onChange={e => setEmail(e.target.value)} /></label>{codeSent && <><p className="hint">Enter the six-digit verification code sent to your email.</p><label>Verification code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} /></label><button type="button" className="text-button" onClick={() => { setCodeSent(false); setCode(''); setError(''); }}>Use a different email</button></>}</> : <><label>OPS ID<input required autoComplete="username" placeholder="ops71783" value={opsId} onChange={e => setOpsId(e.target.value)} /></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label><p className="hint">First login default: soc5-outbound2026</p></>}{error && <p className="error" role="alert">{error}</p>}<button disabled={busy}>{busy ? 'Please wait…' : type === 'fte' && !codeSent ? 'Send verification code' : 'Sign in'}</button></form></main>;
}
