import { Bell } from 'lucide-react';
import { useState } from 'react';
import type { TruckRequest, User } from '../types';

type Props = {
  user: User;
  count: number;
  alerts: TruckRequest[];
  onOpenAlert: (request: TruckRequest) => void;
};

export function AppHeader({ user, count, alerts, onOpenAlert }: Props) {
  const [open, setOpen] = useState(false);

  return <header className="app-topbar">
    <div><span>Signed in as</span><strong>{user.name}</strong></div>
    {(user.role === 'fte_ops' || user.role === 'fte_mm') && <div className="notification-menu">
      <button className="notification-button" type="button" title="Open notifications" aria-label={`Open notifications, ${count} pending`} aria-expanded={open} onClick={() => setOpen(value => !value)}><Bell size={19} />{count > 0 && <span>{count > 99 ? '99+' : count}</span>}</button>
      {open && <section className="notification-popover" aria-label="Pending notifications">
        <div><strong>Pending queue</strong><span>{count}</span></div>
        {alerts.length ? <div className="notification-list">{alerts.slice(0, 8).map(request => <button key={request.id} type="button" onClick={() => { setOpen(false); onOpenAlert(request); }}><span>{request.cluster} / Dock {request.dock_no}</span><small>{request.plate_number || request.status.replaceAll('_', ' ')}</small></button>)}</div> : <p>No new alerts.</p>}
      </section>}
    </div>}
  </header>;
}
