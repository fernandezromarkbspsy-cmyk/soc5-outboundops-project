import { Bell, CalendarDays, Check, ChevronDown, ChevronRight, Search, ShieldCheck, UserCircle } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUiStore } from '../stores/ui';
import type { AppView, Notification as AppNotification, Role, User } from '../types';

type Props = { user:User; view:AppView; onRoleChange:(role:Role)=>void; onSearch:()=>void };
const roles: Array<{value:Role;label:string}> = [{value:'fte_ops',label:'FTE Ops'},{value:'fte_mm',label:'FTE Midmile'},{value:'ops_pic',label:'Ops PIC'},{value:'doc_officer',label:'Document Officer'},{value:'dock_officer',label:'Dock Officer'}];
const page = {
  overview: { name: 'Dashboard', section: 'Overview' },
  'lh-request': { name: 'LH Request', section: 'Outbound' },
  'truck-request': { name: 'Truck Request', section: 'Midmile' },
  docking: { name: 'Docking Confirmation', section: 'Docking' },
  kpi: { name: 'KPI Analytics', section: 'Performance' },
  users: { name: 'User Management', section: 'Administration' },
};

export function AppHeader({ user, view, onRoleChange, onSearch }: Props) {
  const client=useQueryClient();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const search = useUiStore(state => state.search);
  const setSearch = useUiStore(state => state.setSearch);
  const from = useUiStore(state => state.dateFrom);
  const to = useUiStore(state => state.dateTo);
  const setDateRange = useUiStore(state => state.setDateRange);
  const resetDateRange = useUiStore(state => state.resetDateRange);
  const searchRef = useRef<HTMLInputElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const notificationMenuRef = useRef<HTMLElement>(null);
  const profileMenuRef = useRef<HTMLElement>(null);
  const knownNotification = useRef<number|null>(null);
  const notificationMenuId = useId();
  const profileMenuId = useId();
  const [toast,setToast]=useState<AppNotification|null>(null);
  const notifications=useQuery({queryKey:['notifications',user.role],queryFn:()=>api<{data:AppNotification[];unread:number}>('/notifications'),refetchInterval:5_000});
  const read=useMutation({mutationFn:(id:number)=>api(`/notifications/${id}/read`,{method:'PATCH'}),onSuccess:()=>client.invalidateQueries({queryKey:['notifications']})});
  const readAll=useMutation({mutationFn:()=>api('/notifications/read-all',{method:'PATCH'}),onSuccess:()=>client.invalidateQueries({queryKey:['notifications']})});
  const count=notifications.data?.unread??0; const alerts=notifications.data?.data??[];

  useEffect(()=>{const latest=alerts.find(item=>!item.read_at);if(!latest)return;if(knownNotification.current===null){knownNotification.current=latest.id;return;}if(latest.id!==knownNotification.current){knownNotification.current=latest.id;setToast(latest);window.setTimeout(()=>setToast(null),5000);void client.invalidateQueries({queryKey:['requests']});void client.invalidateQueries({queryKey:['kpi']});const AudioContextClass=window.AudioContext;if(AudioContextClass){const context=new AudioContextClass();const oscillator=context.createOscillator();const gain=context.createGain();oscillator.frequency.value=880;gain.gain.value=.08;oscillator.connect(gain).connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+.18);}}},[alerts,client]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') { event.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  useEffect(() => {
    if (!open && !profileOpen) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (open && notificationMenuRef.current && !notificationMenuRef.current.contains(target) && !notificationButtonRef.current?.contains(target)) {
        setOpen(false);
      }
      if (profileOpen && profileMenuRef.current && !profileMenuRef.current.contains(target) && !profileButtonRef.current?.contains(target)) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (open) {
        setOpen(false);
        notificationButtonRef.current?.focus();
      }
      if (profileOpen) {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, profileOpen]);

  const searchPlaceholder = view === 'overview'
    ? 'Search requests, then press Enter'
    : `Search ${page[view].section.toLowerCase()} requests, then press Enter`;

  return <header className="app-topbar">
    {toast&&<div className="app-toast" role="status"><Bell size={17}/><div><strong>{toast.title}</strong><span>{toast.body}</span></div></div>}
    <div className="topbar-page">
      <div className="topbar-page-copy">
        <span className="topbar-eyebrow">Operations dashboard</span>
        <h1>{page[view].name}</h1>
        <nav className="topbar-breadcrumbs" aria-label="Breadcrumb"><span>Operations</span><ChevronRight size={12}/><span>{page[view].section}</span></nav>
      </div>
    </div>
    <div className="topbar-tools">
      {view === 'overview' && <div className="topbar-dates"><CalendarDays size={17}/><input aria-label="Start date" type="date" value={from} max={to} onChange={e=>setDateRange(e.target.value,to)}/><span>-</span><input aria-label="End date" type="date" value={to} min={from} onChange={e=>setDateRange(from,e.target.value)}/><button type="button" onClick={resetDateRange}>Today</button></div>}
      <form className="topbar-search" onSubmit={event=>{event.preventDefault();if(search.trim())onSearch();}}><Search size={17}/><input ref={searchRef} aria-label={`Search requests in ${page[view].section}`} placeholder={searchPlaceholder} title={searchPlaceholder} value={search} onChange={e=>setSearch(e.target.value)}/><kbd>Ctrl F</kbd></form>
      <div className="notification-menu">
        <button ref={notificationButtonRef} className="notification-button" type="button" title="Notifications" aria-label={`Open notifications, ${count} unread`} aria-expanded={open} aria-controls={notificationMenuId} onClick={()=>setOpen(value=>!value)}><Bell size={19}/>{count>0&&<span>{count>99?'99+':count}</span>}</button>
        {open&&<section ref={notificationMenuRef} id={notificationMenuId} className="notification-popover" role="menu" aria-label="Notifications"><div><strong>Notifications</strong>{count>0?<button className="text-button" type="button" onClick={()=>readAll.mutate()}>Mark all read</button>:<span>0</span>}</div>{alerts.length?<div className="notification-list">{alerts.slice(0,6).map(item=><button key={item.id} className={item.read_at?'':'unread'} type="button" role="menuitem" onClick={()=>{if(!item.read_at)read.mutate(item.id);setOpen(false);notificationButtonRef.current?.focus();}}><span>{item.title}</span><small>{item.body}</small></button>)}</div>:<p>No notifications.</p>}</section>}
      </div>
      <div className="profile-switcher">
        <button ref={profileButtonRef} className="topbar-user" type="button" aria-expanded={profileOpen} aria-controls={profileMenuId} onClick={()=>setProfileOpen(value=>!value)}><UserCircle size={22}/><div><strong>{user.name}</strong><small>{user.is_admin?'Administrator':user.role.replaceAll('_',' ')}</small></div><ChevronDown size={14} className="topbar-user-chevron" /></button>
        {profileOpen&&<section ref={profileMenuRef} id={profileMenuId} className="profile-menu" role="menu" aria-label="Profile"><header><ShieldCheck size={18}/><div><strong>Test role view</strong><small>Admin access remains enabled</small></div></header>{user.is_admin?roles.map(role=><button key={role.value} type="button" role="menuitem" onClick={()=>{setProfileOpen(false);void onRoleChange(role.value);profileButtonRef.current?.focus();}}><span>{role.label}</span>{user.role===role.value&&<Check size={16}/>}</button>):<p>Signed in as {user.role.replaceAll('_',' ')}</p>}</section>}
      </div>
    </div>
  </header>;
}
