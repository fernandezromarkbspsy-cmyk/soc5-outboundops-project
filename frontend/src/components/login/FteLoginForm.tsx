import { ArrowRight, AtSign, Loader2 } from 'lucide-react';
import Reveal from './Reveal';

interface FteLoginFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  codeSent: boolean;
  error: string;
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function FteLoginForm({
  email,
  onEmailChange,
  codeSent,
  error,
  busy,
  onSubmit,
}: FteLoginFormProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="login-form-container login-rise">
      <Reveal>
        <button
          type="button"
          className="login-google-btn"
          disabled={busy}
          onClick={() => {
            // Google OAuth is handled in parent
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.24c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.72 7.78 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.78 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </Reveal>

      <Reveal delay={60}>
        <div className="login-or-divider">
          <span>or use email verification</span>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="login-field">
          <label className="login-field-label" htmlFor="fte-email">
            SPX work email
          </label>
          <div className={`login-input-wrapper ${error ? 'has-error' : ''}`}>
            <span className="login-input-icon">
              <AtSign size={16} />
            </span>
            <input
              id="fte-email"
              type="email"
              required
              disabled={codeSent || busy}
              autoComplete="email"
              placeholder="name@spxexpress.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="login-input"
            />
          </div>
        </div>
      </Reveal>

      {error && (
        <Reveal>
          <div className="login-error" role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        </Reveal>
      )}

      <Reveal delay={180}>
        <button
          type="submit"
          className="login-submit-btn"
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 size={16} className="login-spinner" />
              Please wait...
            </>
          ) : (
            <>
              {codeSent ? 'Verify code' : 'Send verification code'}
              <ArrowRight size={16} className="login-submit-arrow" />
            </>
          )}
        </button>
      </Reveal>
    </form>
  );
}
