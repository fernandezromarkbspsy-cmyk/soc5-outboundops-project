import { FormEvent, useEffect, useRef, useState } from 'react';
import { isAuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UserType = 'fte' | 'backroom';

const backroomEmail = (opsId: string) => `${opsId.trim().toLowerCase()}@backroom.soc5.internal`;
const authErrorMessages: Record<string, string> = {
  email_address_not_authorized: 'Email delivery is not configured for this address. Ask an administrator to enable custom SMTP in Supabase.',
  email_provider_disabled: 'Email sign-in is disabled in Supabase Authentication settings.',
  otp_disabled: 'Email OTP sign-in is disabled in Supabase Authentication settings.',
  signup_disabled: 'First-time email sign-in is disabled in Supabase Authentication settings.',
  over_email_send_rate_limit: 'Too many verification emails were requested. Wait before requesting another code.',
  over_request_rate_limit: 'Too many sign-in requests were made. Wait a few minutes and try again.',
  otp_expired: 'This verification code is invalid or expired. Request a new code.',
};

function describeAuthError(cause: unknown, fallback: string): string {
  if (isAuthError(cause)) {
    if (cause.code && authErrorMessages[cause.code]) return authErrorMessages[cause.code];
    const message = cause.message.trim();
    if (message && message !== '{}') return message;
    if (cause.status && cause.status >= 500) return 'Email authentication failed. Check the Supabase Auth logs and custom SMTP configuration.';
    if ('originalError' in cause) return describeAuthError(cause.originalError, fallback);
  }
  if (cause && typeof cause === 'object') {
    const value = cause as Record<string, unknown>;
    const code = typeof value.code === 'string' ? value.code : '';
    if (code && authErrorMessages[code]) return authErrorMessages[code];
    for (const key of ['message', 'msg', 'error_description', 'error']) {
      if (typeof value[key] === 'string' && value[key].trim() && value[key].trim() !== '{}') return value[key];
    }
  }
  if (cause instanceof Error && cause.message.trim() && cause.message.trim() !== '{}') return cause.message;
  return fallback;
}

export function Login() {
  const [type, setType] = useState<UserType>('fte');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);
  const [opsId, setOpsId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setModalVisible(true);
      window.requestAnimationFrame(() => dialogRef.current?.focus());
    }, 5);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (resendAfter <= 0) return;
    const timer = window.setTimeout(() => setResendAfter(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendAfter]);

  function switchType(next: UserType) {
    setType(next);
    setError('');
    setCodeSent(false);
    setCode('');
    setResendAfter(0);
  }

  async function signInWithGoogle() {
    setError('');
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { hd: 'spxexpress.com', prompt: 'select_account' },
        },
      });
      if (signInError) throw signInError;
    } catch (cause) {
      setError(describeAuthError(cause, 'Unable to sign in with Google.'));
      setBusy(false);
    }
  }

  async function sendCode(normalizedEmail: string) {
    if (resendAfter > 0) return;
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });
    if (sendError) throw sendError;
    setCodeSent(true);
    setResendAfter(60);
  }

  async function resendCode() {
    setError('');
    setBusy(true);
    try {
      await sendCode(email.trim().toLowerCase());
    } catch (cause) {
      setError(describeAuthError(cause, 'Unable to resend the code.'));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (type === 'fte') {
        const normalized = email.trim().toLowerCase();
        if (!normalized.endsWith('@spxexpress.com')) throw new Error('Use your @spxexpress.com work email.');
        if (!codeSent) {
          await sendCode(normalized);
        } else {
          const { error: verifyError } = await supabase.auth.verifyOtp({ email: normalized, token: code.trim(), type: 'email' });
          if (verifyError) throw verifyError;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: backroomEmail(opsId), password });
        if (signInError) throw signInError;
      }
    } catch (cause) {
      const fallback = type === 'fte'
        ? codeSent
          ? 'Unable to verify the code. Request a new code and check the Supabase Auth logs.'
          : 'Unable to send a verification email. Check the Supabase Auth logs and custom SMTP configuration.'
        : 'Unable to sign in.';
      setError(describeAuthError(cause, fallback));
    } finally {
      setBusy(false);
    }
  }

  const submitLabel = busy ? 'Please wait...' : type === 'fte' ? (codeSent ? 'Verify code' : 'Send verification code') : 'Sign in';

  return (
    <div className="auth-entry">
      <div className={`auth-modal-layer${modalVisible ? ' is-visible' : ''}`}>
        <section ref={dialogRef} className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title" tabIndex={-1}>
          <div className="auth-dialog-head">
            <div className="auth-logo" aria-hidden="true">S5</div>
            <div><p>SOC 5 OUTBOUND</p><h1 id="auth-title">Sign in</h1></div>
          </div>

          <form onSubmit={submit}>
            <div className="user-toggle" role="tablist" aria-label="User type">
              <button type="button" role="tab" aria-selected={type === 'fte'} className={type === 'fte' ? 'selected' : ''} onClick={() => switchType('fte')}>FTE</button>
              <button type="button" role="tab" aria-selected={type === 'backroom'} className={type === 'backroom' ? 'selected' : ''} onClick={() => switchType('backroom')}>Backroom</button>
            </div>

            {type === 'fte' ? (
              <div className="auth-fields" key="fte">
                <button type="button" className="google-button" disabled={busy} onClick={signInWithGoogle}><span aria-hidden="true">G</span>Continue with Google</button>
                <div className="auth-divider"><span>or use email verification</span></div>
                <label>SPX work email<input type="email" required disabled={codeSent} autoComplete="email" placeholder="name@spxexpress.com" value={email} onChange={event => setEmail(event.target.value)} /></label>
                {codeSent && <>
                  <label>Verification code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required placeholder="Enter code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))} /></label>
                  <div className="auth-secondary-actions">
                    <button type="button" className="text-button" disabled={busy || resendAfter > 0} onClick={() => void resendCode()}>{resendAfter > 0 ? `Resend in ${resendAfter}s` : 'Resend code'}</button>
                    <button type="button" className="text-button" onClick={() => { setCodeSent(false); setCode(''); setError(''); setResendAfter(0); }}>Change email</button>
                  </div>
                </>}
              </div>
            ) : (
              <div className="auth-fields" key="backroom">
                <label>OPS ID<input required autoComplete="username" placeholder="ops71783" value={opsId} onChange={event => setOpsId(event.target.value)} /></label>
                <label>Password<input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
              </div>
            )}

            {error && <p className="error auth-error" role="alert">{error}</p>}
            <button className="primary-button" disabled={busy}>{submitLabel}</button>
          </form>
          <p className="auth-footnote">Authorized operations personnel only</p>
        </section>
      </div>
    </div>
  );
}
