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

export function LoginBackdrop() {
  return (
    <div className="login-page is-visible" aria-hidden="true">
      <div className="login-left">
        <div className="login-brand-area">
          <div className="login-logo-mark">S5</div>
          <div className="login-brand-text">
            <strong>SOC 5</strong>
            <span>Outbound Operations</span>
          </div>
        </div>
        <div className="login-left-content">
          <h2>Operations<br />Command Center</h2>
          <p>Streamlined outbound logistics management with real-time tracking, truck coordination, and dock scheduling.</p>
          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div>
                <strong>Real-time Tracking</strong>
                <span>Live status on every request</span>
              </div>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              </div>
              <div>
                <strong>Dashboard Analytics</strong>
                <span>Actionable operational insights</span>
              </div>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <strong>Secure Access</strong>
                <span>Enterprise-grade authentication</span>
              </div>
            </div>
          </div>
        </div>
        <div className="login-left-footer">
          <span>&copy; {new Date().getFullYear()} SOC 5 Outbound</span>
        </div>
      </div>
      <div className="login-right">
        <div className="login-right-inner">
          <div className="login-form-header">
            <div className="login-mobile-logo">
              <div className="login-logo-mark small">S5</div>
              <strong>SOC 5</strong>
            </div>
            <h1>Welcome back</h1>
            <p>Sign in to your operations account</p>
          </div>
          <div className="login-skeleton-form">
            <div className="skeleton-field" />
            <div className="skeleton-field" />
            <div className="skeleton-button" />
          </div>
        </div>
      </div>
    </div>
  );
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
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(true);
      window.requestAnimationFrame(() => dialogRef.current?.focus());
    }, 80);
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
    <div className={`login-page${visible ? ' is-visible' : ''}`}>
      {/* Left Panel — Branding */}
      <div className="login-left">
        <div className="login-brand-area">
          <div className="login-logo-mark">S5</div>
          <div className="login-brand-text">
            <strong>SOC 5</strong>
            <span>Outbound Operations</span>
          </div>
        </div>
        <div className="login-left-content">
          <h2>Operations<br />Command Center</h2>
          <p>Streamlined outbound logistics management with real-time tracking, truck coordination, and dock scheduling.</p>
          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div>
                <strong>Real-time Tracking</strong>
                <span>Live status on every request</span>
              </div>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              </div>
              <div>
                <strong>Dashboard Analytics</strong>
                <span>Actionable operational insights</span>
              </div>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <strong>Secure Access</strong>
                <span>Enterprise-grade authentication</span>
              </div>
            </div>
          </div>
        </div>
        <div className="login-left-footer">
          <span>&copy; {new Date().getFullYear()} SOC 5 Outbound</span>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="login-right">
        <div className="login-right-inner" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="login-title" tabIndex={-1}>
          <div className="login-form-header">
            <div className="login-mobile-logo">
              <div className="login-logo-mark small">S5</div>
              <strong>SOC 5</strong>
            </div>
            <h1 id="login-title">Welcome back</h1>
            <p>Sign in to your operations account</p>
          </div>

          <form onSubmit={submit} className="login-form">
            <div className="login-type-toggle" role="tablist" aria-label="User type">
              <button
                type="button"
                role="tab"
                aria-selected={type === 'fte'}
                className={`login-type-btn${type === 'fte' ? ' active' : ''}`}
                onClick={() => switchType('fte')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                FTE
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={type === 'backroom'}
                className={`login-type-btn${type === 'backroom' ? ' active' : ''}`}
                onClick={() => switchType('backroom')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                Backroom
              </button>
            </div>

            {type === 'fte' ? (
              <div className="login-fields" key="fte">
                <button type="button" className="login-google-btn" disabled={busy} onClick={signInWithGoogle}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.24c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.72 7.78 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.78 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="login-divider">
                  <span>or use email verification</span>
                </div>

                <label className="login-label">
                  SPX work email
                  <input
                    type="email"
                    required
                    disabled={codeSent}
                    autoComplete="email"
                    placeholder="name@spxexpress.com"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    className="login-input"
                  />
                </label>

                {codeSent && (
                  <>
                    <label className="login-label">
                      Verification code
                      <input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6,10}"
                        minLength={6}
                        maxLength={10}
                        required
                        placeholder="Enter code"
                        value={code}
                        onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="login-input"
                      />
                    </label>
                    <div className="login-secondary-actions">
                      <button type="button" className="login-text-btn" disabled={busy || resendAfter > 0} onClick={() => void resendCode()}>
                        {resendAfter > 0 ? `Resend in ${resendAfter}s` : 'Resend code'}
                      </button>
                      <button type="button" className="login-text-btn" onClick={() => { setCodeSent(false); setCode(''); setError(''); setResendAfter(0); }}>
                        Change email
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="login-fields" key="backroom">
                <label className="login-label">
                  OPS ID
                  <input
                    required
                    autoComplete="username"
                    placeholder="ops71783"
                    value={opsId}
                    onChange={event => setOpsId(event.target.value)}
                    className="login-input"
                  />
                </label>
                <label className="login-label">
                  Password
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="login-input"
                  />
                </label>
              </div>
            )}

            {error && <p className="login-error" role="alert">{error}</p>}

            <button className="login-submit-btn" disabled={busy}>
              {submitLabel}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="login-submit-arrow"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </form>

          <p className="login-footnote">Authorized operations personnel only</p>
        </div>
      </div>
    </div>
  );
}
