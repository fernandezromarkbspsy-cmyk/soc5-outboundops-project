import { Users, Warehouse } from 'lucide-react';

export type UserType = 'fte' | 'backroom';

interface UserTypeToggleProps {
  value: UserType;
  onChange: (value: UserType) => void;
}

export default function UserTypeToggle({ value, onChange }: UserTypeToggleProps) {
  const isBackroom = value === 'backroom';

  return (
    <div
      role="tablist"
      aria-label="Login as"
      className="login-type-toggle"
    >
      {/* Sliding indicator */}
      <span
        aria-hidden
        className="login-type-toggle-indicator"
        data-type={value}
      />
      
      {/* FTE tab */}
      <button
        type="button"
        role="tab"
        aria-selected={!isBackroom}
        onClick={() => onChange('fte')}
        className={`login-type-btn ${!isBackroom ? 'active' : ''}`}
      >
        <Users size={16} strokeWidth={2.1} />
        FTE
      </button>
      
      {/* Backroom tab */}
      <button
        type="button"
        role="tab"
        aria-selected={isBackroom}
        onClick={() => onChange('backroom')}
        className={`login-type-btn ${isBackroom ? 'active' : ''}`}
      >
        <Warehouse size={16} strokeWidth={2.1} />
        Backroom
      </button>
    </div>
  );
}
