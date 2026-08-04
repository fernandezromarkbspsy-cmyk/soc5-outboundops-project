import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import Reveal from './Reveal';

interface OtpVerifyFormProps {
  destination: string;
  resendAfter: number;
  busy: boolean;
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}

export default function OtpVerifyForm({
  destination,
  resendAfter,
  busy,
  onVerify,
  onResend,
  onChangeEmail,
}: OtpVerifyFormProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // Focus first input on mount
  useEffect(() => {
    const id = window.setTimeout(() => refs.current[0]?.focus(), 60);
    return () => window.clearTimeout(id);
  }, []);

  const complete = otp.every((d) => d !== '');

  const set = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const key = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const paste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const arr = Array(6).fill('');
    text.split('').forEach((char, i) => {
      arr[i] = char;
    });
    setOtp(arr);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleVerify = () => {
    if (complete && !busy) {
      onVerify(otp.join(''));
    }
  };

  return (
    <div className="login-form-container login-rise">
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            display: 'grid',
            width: '32px',
            height: '32px',
            placeItems: 'center',
            borderRadius: '8px',
            background: 'rgba(46, 123, 255, 0.15)',
            boxShadow: '0 0 0 1px rgba(46, 123, 255, 0.4)',
          }}>
            <Check size={16} style={{ color: 'var(--login-link)' }} strokeWidth={2.6} />
          </div>
          <h3 style={{
            fontFamily: "'Space Grotesk', 'Manrope', ui-sans-serif, sans-serif",
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--login-ink)',
            margin: 0,
          }}>
            Verify OTP
          </h3>
        </div>
        <p style={{
          fontSize: '12.5px',
          color: 'var(--login-muted)',
          margin: 0,
        }}>
          Code sent to <strong style={{ color: 'var(--login-ink)', fontWeight: 600 }}>{destination}</strong>
        </p>
      </Reveal>

      <Reveal delay={90}>
        <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => set(index, e.target.value)}
              onKeyDown={(e) => key(index, e)}
              onPaste={index === 0 ? paste : undefined}
              aria-label={`Digit ${index + 1}`}
              style={{
                width: '100%',
                minWidth: 0,
                height: '44px',
                borderRadius: '10px',
                border: '1px solid var(--login-line)',
                background: 'rgba(255, 255, 255, 0.07)',
                textAlign: 'center',
                fontFamily: "'Space Grotesk', 'Manrope', ui-sans-serif, sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--login-ink)',
                outline: 'none',
                transition: 'all 200ms ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--login-accent)';
                e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                e.target.style.boxShadow = '0 0 0 3px rgba(46, 123, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--login-line)';
                e.target.style.background = 'rgba(255, 255, 255, 0.07)';
                e.target.style.boxShadow = 'none';
              }}
            />
          ))}
        </div>
      </Reveal>

      <Reveal delay={150}>
        <button
          type="button"
          className="login-submit-btn"
          disabled={!complete || busy}
          onClick={handleVerify}
          style={{
            marginTop: '20px',
            ...(complete && !busy ? {
              animation: 'ready 1.7s ease-in-out infinite',
            } : {}),
          }}
        >
          {busy ? (
            <>
              <Loader2 size={16} className="login-spinner" />
              Verifying...
            </>
          ) : (
            <>
              Verify &amp; Continue
              <ArrowRight size={16} className="login-submit-arrow" />
            </>
          )}
        </button>
      </Reveal>

      <Reveal delay={210}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '16px',
          fontSize: '12px',
          color: 'var(--login-muted)',
        }}>
          {resendAfter > 0 ? (
            <>
              <span>Resend in</span>
              <span style={{ fontWeight: 600, color: 'var(--login-ink)', fontVariantNumeric: 'tabular-nums' }}>
                0:{String(resendAfter).padStart(2, '0')}
              </span>
            </>
          ) : (
            <button
              type="button"
              onClick={onResend}
              className="login-link-btn"
              style={{ fontSize: '12px' }}
            >
              Resend code
            </button>
          )}
          <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 4px' }}>|</span>
          <button
            type="button"
            onClick={onChangeEmail}
            className="login-link-btn"
            style={{ fontSize: '12px', color: 'var(--login-faint)' }}
          >
            Change email
          </button>
        </div>
      </Reveal>
    </div>
  );
}
