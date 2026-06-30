import { Bell, CalendarDays, Check, ChevronDown, ChevronRight, Command, Search, ShieldCheck, UserCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { primeAlertSound, startAlertSound, stopAlertSound } from '../lib/alertSound';
import { useUiStore } from '../stores/ui';
import type { AppView, Notification as AppNotification, Role, User } from '../types';

type Props = { user: User; view: AppView; onRoleChange: (role: Role) => void; onSearch: () => void; onCommand: () => void };
const roles: Array<{ value: Role; label: string }> = [{ value: 'fte_ops', label: 'FTE Ops' }, { value: 'fte_mm', label: 'FTE Midmile' }, { value: 'ops_pic', label: 'Ops PIC' }, { value: 'doc_officer', label: 'Document Officer' }, { value: 'dock_officer', label: 'Dock Officer' }];
const notificationSoundSource = 'app-notifications';
const page = {
  overview: { name: 'Dashboard', section: 'Overview' },
  'lh-request': { name: 'LH Request', section: 'Outbound' },
  'truck-request': { name: 'Truck Request', section: 'Midmile' },
  docking: { name: 'Docking Confirmation', section: 'Docking' },
  kpi: { name: 'KPI Analytics', section: 'Performance' },
  users: { name: 'User Management', section: 'Administration' },
};

export function AppHeader({ user, view, onRoleChange, onSearch, onCommand }: Props) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const search = useUiStore(state => state.search);
  const setSearch = useUiStore(state => state.setSearch);
  const from = useUiStore(state => state.dateFrom);
  const to = useUiStore(state => state.dateTo);
  const setDateRange = useUiStore(state => state.setDateRange);
  const resetDateRange = useUiStore(state => state.resetDateRange);
  const searchRef = useRef<HTMLInputElement>(null);
  const knownNotification = useRef<number | null>(null);
  const acknowledgedNotification = useRef<number | null>(null);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const notifications = useQuery({ queryKey: ['notifications', user.role], queryFn: () => api<{ data: AppNotification[]; unread: number }>('/notifications'), refetchInterval: 5_000 });
  const read = useMutation({ mutationFn: (id: number) => api(`/notifications/${id}/read`, { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const readAll = useMutation({ mutationFn: () => api('/notifications/read-all', { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const count = notifications.data?.unread ?? 0;
  const alerts = notifications.data?.data ?? [];
  const latestUnread = alerts.find(item => !item.read_at);
  const acknowledgeCurrentNotification = useCallback(() => { if (latestUnread) acknowledgedNotification.current = latestUnread.id; stopAlertSound(notificationSoundSource); }, [latestUnread]);

  useEffect(() => primeAlertSound(), []);
  useEffect(() => {
    if (!latestUnread) {
      acknowledgedNotification.current = null;
      stopAlertSound(notificationSoundSource);
      return;
    }
    if (knownNotification.current === null) {
      knownNotification.current = latestUnread.id;
    } else if (latestUnread.id !== knownNotification.current) {
      knownNotification.current = latestUnread.id;
      acknowledgedNotification.current = null;
      setToast(latestUnread);
      window.setTimeout(() => setToast(null), 5000);
      void client.invalidateQueries({ queryKey: ['requests'] });
      void client.invalidateQueries({ queryKey: ['kpi'] });
    }
    if (acknowledgedNotification.current !== latestUnread.id) startAlertSound(notificationSoundSource);
  }, [latestUnread, client]);
  useEffect(() => () => stopAlertSound(notificationSoundSource), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onCommand();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCommand]);

  return <header className="app-topbar">
    {toast && <div className="app-toast" role="status"><Bell size={17} /><div><strong>{toast.title}</strong><span>{toast.body}</span></div></div>}
    <div className="topbar-page"><div><nav className="topbar-breadcrumbs" aria-label="Breadcrumb"><span>Operations</span><ChevronRight size={12} /><span>{page[view].section}</span></nav><h1>{page[view].name}</h1></div></div>
    <div className="topbar-tools">
      {view === 'overview' && <div className="topbar-dates"><CalendarDays size={17} /><input aria-label="Start date" type="date" value={from} max={to} onChange={event => setDateRange(event.target.value, to)} /><span>-</span><input aria-label="End date" type="date" value={to} min={from} onChange={event => setDateRange(from, event.target.value)} /><button type="button" onClick={resetDateRange}>Today</button></div>}
      <form className="topbar-search" onSubmit={event => { event.preventDefault(); if (search.trim()) onSearch(); }}><Search size={17} /><input ref={searchRef} aria-label="Search requests" placeholder="Search requests..." value={search} onChange={event => setSearch(event.target.value)} /><kbd>Ctrl F</kbd></form>
      <button className="command-button" type="button" onClick={onCommand} title="Open command palette" aria-label="Open command palette"><Command size={17} /><kbd>Ctrl K</kbd></button>
      <div className="notification-menu">
        <button className="notification-button" type="button" title="Notifications" aria-label={`Open notifications, ${count} unread`} aria-expanded={open} onClick={() => setOpen(value => !value)}><Bell size={19} />{count > 0 && <span>{count > 99 ? '99+' : count}</span>}</button>
        {open && <section className="notification-popover" aria-label="Notifications"><div><strong>Notifications</strong>{count > 0 ? <button className="text-button" onClick={() => { acknowledgeCurrentNotification(); readAll.mutate(); }}>Mark all read</button> : <span>0</span>}</div>{alerts.length ? <div className="notification-list">{alerts.slice(0, 6).map(item => <button key={item.id} className={item.read_at ? '' : 'unread'} type="button" onClick={() => { if (!item.read_at) { acknowledgeCurrentNotification(); read.mutate(item.id); } }}><span>{item.title}</span><small>{item.body}</small></button>)}</div> : <p>No notifications.</p>}</section>}
      </div>
      <div className="profile-switcher">
        <button className="topbar-user" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen(value => !value)}><UserCircle size={22} /><div><strong>{user.name}</strong><small>{user.is_admin ? 'Administrator' : user.role.replaceAll('_', ' ')}</small></div>{user.is_admin && <ChevronDown size={14} />}</button>
        {profileOpen && <section className="profile-menu"><header><ShieldCheck size={18} /><div><strong>Test role view</strong><small>Admin access remains enabled</small></div></header>{user.is_admin ? roles.map(role => <button key={role.value} type="button" onClick={() => { setProfileOpen(false); void onRoleChange(role.value); }}><span>{role.label}</span>{user.role === role.value && <Check size={16} />}</button>) : <p>Signed in as {user.role.replaceAll('_', ' ')}</p>}</section>}
      </div>
    </div>
  </header>;
}
