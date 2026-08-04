import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, IdCard, Loader2, Lock } from 'lucide-react';
import Reveal from './Reveal';

interface BackroomLoginFormProps {
  opsId: string;
  onOpsIdChange: (opsId: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  error: string;
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function BackroomLoginForm({
  opsId,
  onOpsIdChange,
  password,
  onPasswordChange,
  error,
  busy,
  onSubmit,
}: BackroomLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <form noValidate onSubmit={onSubmit} className="login-form-container login-rise">
      <Reveal>
        <div className="login-field">
          <label className="login-field-label" htmlFor="backroom-opsid">
            OPS ID
          </label>
          <div className={`login-input-wrapper ${error ? 'has-error' : ''}`}>
            <span className="login-input-icon">
              <IdCard size={16} />
            </span>
            <input
              id="backroom-opsid"
              type="text"
              required
              autoComplete="username"
              placeholder="SOC5-0000"
              value={opsId}
              onChange={(e) => onOpsIdChange(e.target.value.toUpperCase())}
              className="login-input"
              style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
          </div>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="login-field">
          <label className="login-field-label" htmlFor="backroom-password">
            Password
          </label>
          <div className={`login-input-wrapper ${error ? 'has-error' : ''}`}>
            <span className="login-input-icon">
              <Lock size={16} />
            </span>
            <input
              id="backroom-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="login-input"
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
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

      <Reveal delay={120}>
        <div className="login-secondary-actions">
          <label className="login-remember-label">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="sr-only"
            />
            <span
              className={`login-checkbox ${remember ? 'checked' : ''}`}
              onClick={() => setRemember(!remember)}
            >
              {remember && (
                <svg viewBox="0 0 12 12" aria-hidden>
                  <path
                    d="M2.5 6.3 4.8 8.6 9.5 3.9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            Keep me signed in
          </label>
          <button type="button" className="login-link-btn">
            Forgot password?
          </button>
        </div>
      </Reveal>

      <Reveal delay={180}>
        <button
          type="submit"
          className="login-submit-btn"
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 size={16} className="login-spinner" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight size={16} className="login-submit-arrow" />
            </>
          )}
        </button>
      </Reveal>
    </form>
  );
}
