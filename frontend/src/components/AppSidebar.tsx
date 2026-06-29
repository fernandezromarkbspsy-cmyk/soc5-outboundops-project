import { BarChart3, ChevronDown, LayoutDashboard, LogOut, Menu, Route, ShipWheel, Truck, Users, X } from 'lucide-react';
import { useState } from 'react';
import type { AppView, User } from '../types';

type Props = {
  user: User;
  activeView: AppView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: AppView) => void;
  onSignOut: () => void;
  pendingCount: number;
};

const roleNames = {
  ops_pic: 'Ops PIC',
  fte_ops: 'FTE Ops',
  fte_mm: 'FTE Midmile',
  doc_officer: 'Document Officer',
  dock_officer: 'Dock Officer',
} as const;

export function AppSidebar({ user, activeView, open, onOpenChange, onNavigate, onSignOut, pendingCount }: Props) {
  const showOutbound = user.role === 'ops_pic' || user.role === 'fte_ops';
  const showMidmile = user.role === 'fte_mm';
  const showDocking = user.role === 'doc_officer' || user.role === 'dock_officer';
  const showKpi = user.role === 'fte_ops';
  const showUsers = user.role === 'fte_ops' || user.role === 'fte_mm';
  const [expanded, setExpanded] = useState({ dashboard: true, outbound: true, midmile: true });

  function navigate(view: AppView) {
    onNavigate(view);
    onOpenChange(false);
  }

  return <>
    <button className="mobile-nav-toggle" type="button" title="Open navigation" aria-label="Open navigation" onClick={() => onOpenChange(true)}><Menu size={20} /></button>
    <div className={`sidebar-scrim${open ? ' is-open' : ''}`} onClick={() => onOpenChange(false)} />
    <aside className={`app-sidebar${open ? ' is-open' : ''}`}>
      <div className="sidebar-brand"><span>S5</span><div><strong>SOC 5</strong><small>Outbound</small></div></div>
      <button className="sidebar-close" type="button" title="Close navigation" aria-label="Close navigation" onClick={() => onOpenChange(false)}><X size={19} /></button>

      <nav aria-label="Primary navigation">
        <div className="nav-group"><button className="nav-group-toggle" type="button" aria-expanded={expanded.dashboard} onClick={() => setExpanded(value => ({ ...value, dashboard: !value.dashboard }))}><span>Dashboard</span><ChevronDown size={14} /></button>{expanded.dashboard && <button className={activeView === 'overview' ? 'active' : ''} onClick={() => navigate('overview')}><LayoutDashboard size={18} /><span>Overview</span></button>}</div>
        {showOutbound && <div className="nav-group"><button className="nav-group-toggle" type="button" aria-expanded={expanded.outbound} onClick={() => setExpanded(value => ({ ...value, outbound: !value.outbound }))}><span>Outbound</span><ChevronDown size={14} /></button>{expanded.outbound && <button className={activeView === 'lh-request' ? 'active' : ''} onClick={() => navigate('lh-request')}><Route size={18} /><span>LH Request</span>{user.role === 'fte_ops' && pendingCount > 0 && <span className="nav-badge">{pendingCount > 99 ? '99+' : pendingCount}</span>}</button>}</div>}
        {showMidmile && <div className="nav-group"><button className="nav-group-toggle" type="button" aria-expanded={expanded.midmile} onClick={() => setExpanded(value => ({ ...value, midmile: !value.midmile }))}><span>Midmile</span><ChevronDown size={14} /></button>{expanded.midmile && <button className={activeView === 'truck-request' ? 'active' : ''} onClick={() => navigate('truck-request')}><Truck size={18} /><span>Truck Request</span>{pendingCount > 0 && <span className="nav-badge">{pendingCount > 99 ? '99+' : pendingCount}</span>}</button>}</div>}
        {showDocking && <div className="nav-group"><button className={activeView === 'docking' ? 'active' : ''} onClick={() => navigate('docking')}><ShipWheel size={18}/><span>Docking Confirmation</span>{pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}</button></div>}
        {showKpi && <div className="nav-group"><button className={activeView === 'kpi' ? 'active' : ''} onClick={() => navigate('kpi')}><BarChart3 size={18}/><span>KPI Analytics</span></button></div>}
        {showUsers && <div className="nav-group"><button className={activeView === 'users' ? 'active' : ''} onClick={() => navigate('users')}><Users size={18}/><span>User Management</span></button></div>}
      </nav>

      <div className="sidebar-account">
        <div className="account-avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</div>
        <div><strong>{user.name}</strong><small>{roleNames[user.role]}</small></div>
        <button type="button" title="Sign out" aria-label="Sign out" onClick={onSignOut}><LogOut size={18} /></button>
      </div>
    </aside>
  </>;
}
