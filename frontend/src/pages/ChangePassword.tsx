import { FormEvent, useState } from 'react';
import { Check, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

export function ChangePassword({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 12) return setError('Password must be at least 12 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await api('/auth/password-changed', { method: 'POST' });
      onComplete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to change password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="password-page">
      <section className="password-intro" aria-labelledby="password-title">
        <div className="password-brand"><span>S5</span> Outbound</div>
        <div className="password-intro-copy">
          <span className="password-icon"><ShieldCheck aria-hidden="true" /></span>
          <p className="eyebrow">FIRST-TIME SIGN IN</p>
          <h1 id="password-title">Secure your account before you continue.</h1>
          <p>Your temporary password got you through the door. Now create one that belongs only to you.</p>
        </div>
        <div className="password-note">
          <LockKeyhole aria-hidden="true" />
          <span><strong>One quick step</strong>Your new password takes effect immediately.</span>
        </div>
      </section>

      <section className="password-form-panel">
        <form className="password-form" onSubmit={submit}>
          <span className="form-kicker"><KeyRound aria-hidden="true" /> Account security</span>
          <h2>Create a new password</h2>
          <p>Use at least 12 characters. A mix of words, numbers, and symbols works best.</p>

          <label>
            New password
            <input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label>
            Confirm new password
            <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>

          <div className="password-requirement"><Check aria-hidden="true" /> Minimum 12 characters</div>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Set new password'}</button>
          <p className="password-privacy">SOC5 Outbound will never ask you to share your password.</p>
        </form>
      </section>
    </main>
  );
}
