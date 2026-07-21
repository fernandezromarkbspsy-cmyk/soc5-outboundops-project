import { Bell, CalendarDays, Check, ChevronDown, ChevronRight, Monitor, Moon, Search, ShieldCheck, Sun, UserCircle, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useClickOutside } from '../hooks/useClickOutside';
import { api } from '../lib/api';
import { playAlertTone } from '../lib/notifications';
import { useUiStore, type ThemeMode } from '../stores/ui';
import type { AppView, Notification as AppNotification, Role, User } from '../types';

type Props = { user: User; view: AppView; onRoleChange: (role: Role) => void; onSearch: () => void };

const roles: Array<{ value: Role; label: string }> = [
  { value: 'fte_ops', label: 'FTE Ops' },
  { value: 'fte_mm', label: 'FTE Midmile' },
  { value: 'ops_pic', label: 'Ops PIC' },
  { value: 'doc_officer', label: 'Document Officer' },
  { value: 'dock_officer', label: 'Dock Officer' },
];

const page = {
  overview: { name: 'Dashboard', section: 'Overview' },
  'lh-request': { name: 'LH Request', section: 'Outbound' },
  'truck-request': { name: 'Truck Request', section: 'Midmile' },
  docking: { name: 'Docking Confirmation', section: 'Docking' },
  kpi: { name: 'KPI Analytics', section: 'Performance' },
  users: { name: 'User Management', section: 'Administration' },
};

const themeOptions: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function AppHeader({ user, view, onRoleChange, onSearch }: Props) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const search = useUiStore(state => state.search);
  const setSearch = useUiStore(state => state.setSearch);
  const from = useUiStore(state => state.dateFrom);
  const to = useUiStore(state => state.dateTo);
  const setDateRange = useUiStore(state => state.setDateRange);
  const resetDateRange = useUiStore(state => state.resetDateRange);
  const soundEnabled = useUiStore(state => state.soundEnabled);
  const toggleSound = useUiStore(state => state.toggleSound);
  const theme = useUiStore(state => state.theme);
  const setTheme = useUiStore(state => state.setTheme);
  const searchRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const knownNotification = useRef<number | null>(null);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const closeNotifications = useCallback(() => setOpen(false), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  useClickOutside(notificationRef, closeNotifications, open);
  useClickOutside(profileRef, closeProfile, profileOpen);

  const notifications = useQuery({
    queryKey: ['notifications', user.role],
    queryFn: () => api<{ data: AppNotification[]; unread: number }>('/notifications'),
    refetchInterval: 5_000,
  });
  const read = useMutation({
    mutationFn: (id: number) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readAll = useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const count = notifications.data?.unread ?? 0;
  const alerts = notifications.data?.data ?? [];
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  useEffect(() => {
    const latest = alerts.find(item => !item.read_at);
    if (!latest) return;
    if (knownNotification.current === null) {
      knownNotification.current = latest.id;
      return;
    }
    if (latest.id !== knownNotification.current) {
      knownNotification.current = latest.id;
      setToast(latest);
      window.setTimeout(() => setToast(null), 5000);
      void client.invalidateQueries({ queryKey: ['requests'] });
      void client.invalidateQueries({ queryKey: ['kpi'] });
      playAlertTone(soundEnabled);
    }
  }, [alerts, client, soundEnabled]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  return (
    <header className="app-topbar">
      {toast && (
        <div className="app-toast" role="status">
          <Bell size={17} />
          <div><strong>{toast.title}</strong><span>{toast.body}</span></div>
        </div>
      )}
      <div className="topbar-page">
        <div className="topbar-page-copy">
          <h1>{page[view].name}</h1>
          <nav className="topbar-breadcrumbs" aria-label="Breadcrumb">
            <span>Operations</span><ChevronRight size={12} /><span>{page[view].section}</span>
          </nav>
        </div>
      </div>
      <div className="topbar-tools">
        {view === 'overview' && (
          <div className="topbar-dates">
            <CalendarDays size={17} />
            <input aria-label="Start date" type="date" value={from} max={to} onChange={e => setDateRange(e.target.value, to)} />
            <span>–</span>
            <input aria-label="End date" type="date" value={to} min={from} onChange={e => setDateRange(from, e.target.value)} />
            <button type="button" onClick={resetDateRange}>Today</button>
          </div>
        )}
        <form className="topbar-search" onSubmit={event => { event.preventDefault(); onSearch(); }}>
          <Search size={17} />
          <input ref={searchRef} aria-label="Search requests" placeholder="Search cluster, dock, plate..." value={search} onChange={e => setSearch(e.target.value)} />
          <kbd>Ctrl F</kbd>
        </form>
        <button
          className={`sound-toggle${soundEnabled ? ' is-active' : ''}`}
          type="button"
          title={soundEnabled ? 'Mute queue alerts' : 'Enable queue alerts'}
          aria-label={soundEnabled ? 'Mute queue alerts' : 'Enable queue alerts'}
          aria-pressed={soundEnabled}
          onClick={toggleSound}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          className="theme-toggle"
          type="button"
          title={`Theme: ${theme}`}
          aria-label={`Theme: ${theme}`}
          onClick={() => {
            const order: ThemeMode[] = ['light', 'dark', 'system'];
            const next = order[(order.indexOf(theme) + 1) % order.length];
            setTheme(next);
          }}
        >
          <ThemeIcon size={18} />
        </button>
        <div className="notification-menu" ref={notificationRef}>
          <button className="notification-button" type="button" title="Notifications" aria-label={`Open notifications, ${count} unread`} aria-expanded={open} onClick={() => { setProfileOpen(false); setOpen(value => !value); }}>
            <Bell size={19} />
            {count > 0 && <span>{count > 99 ? '99+' : count}</span>}
          </button>
          {open && (
            <section className="notification-popover" aria-label="Notifications">
              <div>
                <strong>Notifications</strong>
                {count > 0 ? <button className="text-button" type="button" onClick={() => readAll.mutate()}>Mark all read</button> : <span>0</span>}
              </div>
              {notifications.isPending ? <p>Loading notifications...</p> : alerts.length ? (
                <div className="notification-list">
                  {alerts.slice(0, 6).map(item => (
                    <button key={item.id} className={item.read_at ? '' : 'unread'} type="button" onClick={() => { if (!item.read_at) read.mutate(item.id); }}>
                      <span>{item.title}</span><small>{item.body}</small>
                    </button>
                  ))}
                </div>
              ) : <p>No notifications.</p>}
            </section>
          )}
        </div>
        <div className="profile-switcher" ref={profileRef}>
          <button className="topbar-user" type="button" aria-expanded={profileOpen} onClick={() => { setOpen(false); setProfileOpen(value => !value); }}>
            <UserCircle size={22} />
            <div><strong>{user.name}</strong><small>{user.is_admin ? 'Administrator' : user.role.replaceAll('_', ' ')}</small></div>
            <ChevronDown size={14} />
          </button>
          {profileOpen && (
            <section className="profile-menu">
              <header><ShieldCheck size={18} /><div><strong>Preferences</strong><small>Display and alert settings</small></div></header>
              <div className="preference-row">
                <div><span>Alert sounds</span><small>Queue and notification chimes</small></div>
                <button className={`sound-toggle${soundEnabled ? ' is-active' : ''}`} type="button" aria-pressed={soundEnabled} onClick={toggleSound}>
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>
              <div className="preference-row">
                <div><span>Theme</span><small>Light, dark, or system</small></div>
                <div className="preference-actions">
                  {themeOptions.map(option => (
                    <button key={option.value} type="button" className={theme === option.value ? 'active' : ''} onClick={() => setTheme(option.value)}>
                      <option.icon size={14} /> {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {user.is_admin && (
                <>
                  <header><ShieldCheck size={18} /><div><strong>Test role view</strong><small>Admin access remains enabled</small></div></header>
                  {roles.map(role => (
                    <button key={role.value} type="button" onClick={() => { setProfileOpen(false); void onRoleChange(role.value); }}>
                      <span>{role.label}</span>{user.role === role.value && <Check size={16} />}
                    </button>
                  ))}
                </>
              )}
              {!user.is_admin && <p>Signed in as {user.role.replaceAll('_', ' ')}</p>}
            </section>
          )}
        </div>
      </div>
    </header>
  );
}
