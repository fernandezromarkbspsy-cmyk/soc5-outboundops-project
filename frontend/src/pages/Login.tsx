import { FormEvent, useEffect, useRef, useState } from 'react';
import { isAuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { LoginBrandingPanel, LoginFormPanel, Reveal } from '../components/login';

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

// Loading skeleton for initial page render
export function LoginBackdrop() {
  return (
    <div className="login-arena">
      <div className="login-grid-bg" aria-hidden="true" />
      <div className="login-card">
        <LoginBrandingPanel />
        <div className="login-form-panel">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            opacity: 0,
            animation: 'rise 0.5s ease forwards',
          }}>
            <div style={{ height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ height: '48px', borderRadius: '12px', background: 'rgba(46, 123, 255, 0.2)' }} />
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
  const dialogRef = useRef<HTMLDivElement>(null);

  // Entrance animation
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(true);
      window.requestAnimationFrame(() => dialogRef.current?.focus());
    }, 80);
    return () => window.clearTimeout(timer);
  }, []);

  // Resend countdown timer
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

  async function submitFte(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const normalized = email.trim().toLowerCase();
      if (!normalized.endsWith('@spxexpress.com')) throw new Error('Use your @spxexpress.com work email.');
      if (!codeSent) {
        await sendCode(normalized);
      } else {
        const { error: verifyError } = await supabase.auth.verifyOtp({ email: normalized, token: code.trim(), type: 'email' });
        if (verifyError) throw verifyError;
      }
    } catch (cause) {
      const fallback = codeSent
        ? 'Unable to verify the code. Request a new code and check the Supabase Auth logs.'
        : 'Unable to send a verification email. Check the Supabase Auth logs and custom SMTP configuration.';
      setError(describeAuthError(cause, fallback));
    } finally {
      setBusy(false);
    }
  }

  async function submitBackroom(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: backroomEmail(opsId), password });
      if (signInError) throw signInError;
    } catch (cause) {
      setError(describeAuthError(cause, 'Unable to sign in.'));
    } finally {
      setBusy(false);
    }
  }

  function handleOtpVerify(otpCode: string) {
    setCode(otpCode);
    // Trigger form submission with the OTP code
    const form = document.getElementById('login-form') as HTMLFormElement;
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    }
  }

  function handleChangeEmail() {
    setCodeSent(false);
    setCode('');
    setError('');
    setResendAfter(0);
  }

  // Handle form submission for OTP verification
  async function handleFormSubmit(event: FormEvent) {
    if (type !== 'fte' || !codeSent) return;
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const normalized = email.trim().toLowerCase();
      const { error: verifyError } = await supabase.auth.verifyOtp({ email: normalized, token: code.trim(), type: 'email' });
      if (verifyError) throw verifyError;
    } catch (cause) {
      setError(describeAuthError(cause, 'Unable to verify the code. Request a new code and check the Supabase Auth logs.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`login-arena${visible ? ' is-visible' : ''}`}>
      <div className="login-grid-bg" aria-hidden="true" />
      
      <div className="login-card" role="main">
        {/* Left panel - Branding */}
        <LoginBrandingPanel />
        
        {/* Center divider (desktop only) */}
        <div className="login-divider-line" aria-hidden="true" />
        <div className="login-divider-or" aria-hidden="true">OR</div>
        
        {/* Right panel - Form */}
        <div className="login-form-panel" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="login-title" tabIndex={-1}>
          <Reveal>
            <div className="login-mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                display: 'grid',
                width: '36px',
                height: '36px',
                placeItems: 'center',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--login-accent) 0%, var(--login-accent-2) 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.04em',
              }}>
                S5
              </div>
              <strong style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--login-ink)' }}>SOC 5</strong>
            </div>
          </Reveal>
          
          <Reveal delay={60}>
            <div style={{ marginBottom: '8px' }}>
              <h1 id="login-title" style={{
                fontFamily: "'Space Grotesk', 'Manrope', ui-sans-serif, sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--login-ink)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}>
                Welcome back
              </h1>
              <p style={{
                fontSize: '13px',
                color: 'var(--login-muted)',
                margin: '6px 0 0',
              }}>
                Sign in to your operations account
              </p>
            </div>
          </Reveal>
          
          <form id="login-form" onSubmit={handleFormSubmit} style={{ display: 'none' }} />
          
          <LoginFormPanel
            userType={type}
            onUserTypeChange={switchType}
            email={email}
            onEmailChange={setEmail}
            codeSent={codeSent}
            opsId={opsId}
            onOpsIdChange={setOpsId}
            password={password}
            onPasswordChange={setPassword}
            error={error}
            busy={busy}
            resendAfter={resendAfter}
            onFteSubmit={submitFte}
            onBackroomSubmit={submitBackroom}
            onGoogleSignIn={signInWithGoogle}
            onOtpVerify={handleOtpVerify}
            onResendCode={resendCode}
            onChangeEmail={handleChangeEmail}
          />
        </div>
      </div>
    </div>
  );
}
