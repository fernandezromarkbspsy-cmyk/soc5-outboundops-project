import UserTypeToggle, { type UserType } from './UserTypeToggle';
import FteLoginForm from './FteLoginForm';
import BackroomLoginForm from './BackroomLoginForm';
import OtpVerifyForm from './OtpVerifyForm';
import MobileDivider from './MobileDivider';
import Reveal from './Reveal';

interface LoginFormPanelProps {
  userType: UserType;
  onUserTypeChange: (type: UserType) => void;
  // FTE state
  email: string;
  onEmailChange: (email: string) => void;
  codeSent: boolean;
  // Backroom state
  opsId: string;
  onOpsIdChange: (opsId: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  // Common state
  error: string;
  busy: boolean;
  resendAfter: number;
  // Handlers
  onFteSubmit: (e: React.FormEvent) => void;
  onBackroomSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onOtpVerify: (code: string) => void;
  onResendCode: () => void;
  onChangeEmail: () => void;
}

export default function LoginFormPanel({
  userType,
  onUserTypeChange,
  email,
  onEmailChange,
  codeSent,
  opsId,
  onOpsIdChange,
  password,
  onPasswordChange,
  error,
  busy,
  resendAfter,
  onFteSubmit,
  onBackroomSubmit,
  onGoogleSignIn,
  onOtpVerify,
  onResendCode,
  onChangeEmail,
}: LoginFormPanelProps) {
  const showOtpForm = userType === 'fte' && codeSent;

  return (
    <div className="login-form-panel">
      {/* Mobile divider */}
      <MobileDivider />

      {/* User type toggle */}
      <Reveal>
        <div style={{ marginBottom: '8px' }}>
          <span style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--login-faint)',
          }}>
            Login as
          </span>
          <UserTypeToggle
            value={userType}
            onChange={onUserTypeChange}
          />
        </div>
      </Reveal>

      {/* Form area */}
      {showOtpForm ? (
        <OtpVerifyForm
          destination={email}
          resendAfter={resendAfter}
          busy={busy}
          onVerify={onOtpVerify}
          onResend={onResendCode}
          onChangeEmail={onChangeEmail}
        />
      ) : userType === 'fte' ? (
        <>
          <FteLoginForm
            email={email}
            onEmailChange={onEmailChange}
            codeSent={codeSent}
            error={error}
            busy={busy}
            onSubmit={(e) => {
              // Intercept to add Google OAuth option
              if (!busy) {
                onFteSubmit(e);
              }
            }}
          />
          {/* Hidden Google button container - we handle this in the parent */}
          <button
            type="button"
            id="google-signin-trigger"
            onClick={onGoogleSignIn}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
        </>
      ) : (
        <BackroomLoginForm
          opsId={opsId}
          onOpsIdChange={onOpsIdChange}
          password={password}
          onPasswordChange={onPasswordChange}
          error={error}
          busy={busy}
          onSubmit={onBackroomSubmit}
        />
      )}

      {/* Footnote */}
      <p className="login-footnote">
        Authorized operations personnel only
      </p>
    </div>
  );
}
