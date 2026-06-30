import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, LayoutDashboard, Route, Search, ShipWheel, Truck, Users, X } from 'lucide-react';
import type { AppView } from '../types';

type Command = { view: AppView; label: string; description: string; icon: typeof LayoutDashboard };

const commands: Command[] = [
  { view: 'overview', label: 'Dashboard', description: 'Operational metrics and latest movement', icon: LayoutDashboard },
  { view: 'lh-request', label: 'LH Request', description: 'Outbound truck request queue', icon: Route },
  { view: 'truck-request', label: 'Truck Request', description: 'Midmile confirmation and assignment', icon: Truck },
  { view: 'docking', label: 'Docking Confirmation', description: 'Dock truck and final confirmation', icon: ShipWheel },
  { view: 'kpi', label: 'KPI Analytics', description: 'Daily volume and approval performance', icon: BarChart3 },
  { view: 'users', label: 'User Management', description: 'Manage users and roles', icon: Users },
];

export function CommandPalette({ open, activeView, canNavigate, onClose, onNavigate }: { open: boolean; activeView: AppView; canNavigate: (view: AppView) => boolean; onClose: () => void; onNavigate: (view: AppView) => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return commands.filter(command => canNavigate(command.view) && (!normalized || `${command.label} ${command.description}`.toLowerCase().includes(normalized)));
  }, [canNavigate, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    window.requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, open]);

  if (!open) return null;

  return <div className="dialog-layer command-layer" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="command-dialog" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="command-search"><Search size={18} /><input ref={inputRef} placeholder="Search pages and workflows..." value={query} onChange={event => setQuery(event.target.value)} /><button className="icon-button" type="button" aria-label="Close command palette" onClick={onClose}><X size={17} /></button></div>
      <div className="command-list">
        {filtered.length ? filtered.map(command => {
          const Icon = command.icon;
          return <button key={command.view} type="button" className={command.view === activeView ? 'active' : ''} onClick={() => { onNavigate(command.view); onClose(); }}>
            <span><Icon size={18} /></span>
            <div><strong>{command.label}</strong><small>{command.description}</small></div>
          </button>;
        }) : <p>No matching workflow.</p>}
      </div>
    </section>
  </div>;
}
