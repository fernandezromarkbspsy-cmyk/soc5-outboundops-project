import { Bell, CalendarDays, ChevronRight, Search, UserCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '../stores/ui';
import type { AppView, TruckRequest, User } from '../types';

type Props = { user:User; view:AppView; count:number; alerts:TruckRequest[]; onSearch:()=>void; onOpenAlert:(request:TruckRequest)=>void };
const page = {
  overview: { name: 'Dashboard', section: 'Overview' },
  'lh-request': { name: 'LH Request', section: 'Outbound' },
  'truck-request': { name: 'Truck Request', section: 'Midmile' },
};

export function AppHeader({ user, view, count, alerts, onSearch, onOpenAlert }: Props) {
  const [open, setOpen] = useState(false);
  const search = useUiStore(state => state.search);
  const setSearch = useUiStore(state => state.setSearch);
  const from = useUiStore(state => state.dateFrom);
  const to = useUiStore(state => state.dateTo);
  const setDateRange = useUiStore(state => state.setDateRange);
  const resetDateRange = useUiStore(state => state.resetDateRange);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') { event.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  return <header className="app-topbar">
    <div className="topbar-page"><div><nav className="topbar-breadcrumbs" aria-label="Breadcrumb"><span>Operations</span><ChevronRight size={12}/><span>{page[view].section}</span></nav><h1>{page[view].name}</h1></div></div>
    <div className="topbar-tools">
      {view === 'overview' && <div className="topbar-dates"><CalendarDays size={17}/><input aria-label="Start date" type="date" value={from} max={to} onChange={e=>setDateRange(e.target.value,to)}/><span>–</span><input aria-label="End date" type="date" value={to} min={from} onChange={e=>setDateRange(from,e.target.value)}/><button type="button" onClick={resetDateRange}>Today</button></div>}
      <form className="topbar-search" onSubmit={event=>{event.preventDefault();if(search.trim())onSearch();}}><Search size={17}/><input ref={searchRef} aria-label="Search requests" placeholder="Search requests…" value={search} onChange={e=>setSearch(e.target.value)}/><kbd>Ctrl F</kbd></form>
      {(user.role === 'fte_ops' || user.role === 'fte_mm') && <div className="notification-menu"><button className="notification-button" type="button" title="Notifications" aria-label={`Open notifications, ${count} pending`} aria-expanded={open} onClick={()=>setOpen(value=>!value)}><Bell size={19}/>{count>0&&<span>{count>99?'99+':count}</span>}</button>{open&&<section className="notification-popover" aria-label="Pending notifications"><div><strong>Pending queue</strong><span>{count}</span></div>{alerts.length?<div className="notification-list">{alerts.slice(0,6).map(request=><button key={request.id} type="button" onClick={()=>{setOpen(false);onOpenAlert(request);}}><span>{request.cluster} / Dock {request.dock_no}</span><small>{request.plate_number||request.status.replaceAll('_',' ')}</small></button>)}</div>:<p>No new alerts.</p>}</section>}</div>}
      <div className="topbar-user"><UserCircle size={22}/><div><strong>{user.name}</strong><small>{user.role.replaceAll('_',' ')}</small></div></div>
    </div>
  </header>;
}
