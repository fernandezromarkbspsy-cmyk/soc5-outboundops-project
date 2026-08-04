import Reveal from './Reveal';

/**
 * Outbound icon sourced from Iconify CDN (Material Design Icons set).
 */
function OutboundIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <img
      src="https://api.iconify.design/mdi:truck-fast-outline.svg?color=%23ffffff"
      alt=""
      aria-hidden
      className={className}
      loading="eager"
      draggable={false}
    />
  );
}

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: 'Real-time Tracking',
    subtitle: 'Live status on every request',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M9 21V9"/>
      </svg>
    ),
    title: 'Dashboard Analytics',
    subtitle: 'Actionable operational insights',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Secure Access',
    subtitle: 'Enterprise-grade authentication',
  },
];

const FOOTER_ITEMS = [
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
    title: 'Secure & Protected',
    subtitle: 'Your data is safe',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Authorized Access',
    subtitle: 'Personnel only',
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: '24/7 Operations',
    subtitle: 'Always available',
  },
];

export default function LoginBrandingPanel() {
  return (
    <div className="login-branding">
      {/* Brand header */}
      <Reveal>
        <div className="login-brand-header">
          <div className="login-brand-icon">
            <OutboundIcon />
          </div>
          <div className="login-brand-text">
            <strong>SOC 5 OUTBOUND</strong>
            <span>Operations Management</span>
          </div>
        </div>
      </Reveal>

      {/* Branding content */}
      <div className="login-branding-content">
        <Reveal delay={90}>
          <h2>
            Login to<br />
            continue
          </h2>
          <p>
            Use your credentials or scan QR code to access the operations dashboard
          </p>
        </Reveal>

        {/* Feature list */}
        <div className="login-feature-list">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={180 + index * 90}>
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  {feature.icon}
                </div>
                <div className="login-feature-text">
                  <strong>{feature.title}</strong>
                  <span>{feature.subtitle}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="login-footer-info">
        {FOOTER_ITEMS.map((item, index) => (
          <Reveal key={item.title} delay={450 + index * 100}>
            <div className="login-footer-item">
              <div className="login-footer-icon">
                {item.icon}
              </div>
              <div className="login-footer-text">
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
