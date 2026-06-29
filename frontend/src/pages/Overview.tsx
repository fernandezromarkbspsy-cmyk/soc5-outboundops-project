import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock3, Route, Search, Truck, X } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { RequestTable } from '../components/RequestTable';
import { api } from '../lib/api';
import { useUiStore } from '../stores/ui';
import type { AppView, Page, RequestAnalytics, RequestMetrics, Status, TruckRequest, User } from '../types';

const localDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export function Overview({ user, onNavigate }: { user: User; onNavigate: (view: AppView) => void }) {
  const today = localDate();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [page, setPage] = useState(1);
  const [detailStatus, setDetailStatus] = useState<Status | 'ALL' | null>(null);
  const search = useUiStore(state => state.search);
  const setSearch = useUiStore(state => state.setSearch);
  const tableRef = useRef<HTMLElement>(null);
  const range = `date_from=${from}&date_to=${to}`;
  const requests = useQuery({ queryKey: ['requests', 'dashboard', page], queryFn: () => api<Page<TruckRequest>>(`/requests?per_page=50&page=${page}`), placeholderData: previous => previous, refetchInterval: 15_000 });
  const metrics = useQuery({ queryKey: ['request-metrics', from, to], queryFn: () => api<RequestMetrics>(`/requests/metrics?${range}`), refetchInterval: 15_000 });
  const analytics = useQuery({ queryKey: ['request-analytics', from, to], queryFn: () => api<RequestAnalytics>(`/requests/analytics?${range}`), refetchInterval: 15_000 });
  const details = useQuery({ queryKey: ['request-details', detailStatus, from, to], queryFn: () => api<Page<TruckRequest>>(`/requests?per_page=100&${range}${detailStatus !== 'ALL' ? `&status=${detailStatus}` : ''}`), enabled: detailStatus !== null });
  const targetView = user.role === 'fte_mm' ? 'truck-request' : 'lh-request';
  const cards: Array<{label:string; status:Status|'ALL'; value:number; icon:typeof Route}> = [
    { label: 'Total Request', status: 'ALL', value: metrics.data?.total ?? 0, icon: Route },
    { label: 'Pending Request', status: 'PENDING', value: metrics.data?.by_status.PENDING ?? 0, icon: Clock3 },
    { label: 'For Docking', status: 'FOR_DOCKING', value: metrics.data?.by_status.FOR_DOCKING ?? 0, icon: Truck },
    { label: 'Docked', status: 'DOCKED', value: metrics.data?.by_status.DOCKED ?? 0, icon: Truck },
  ];
  const hourly = analytics.data?.hourly ?? [];
  const max = Math.max(1, ...hourly.map(point => point.count));
  const points = hourly.map((point, index) => `${20 + index * 55},${145 - point.count / max * 110}`).join(' ');
  const peak = hourly.reduce((best, point) => point.count > best.count ? point : best, { label: '—', count: 0 });
  const sizes = ['4W', '6W', '10W', '6WF'] as const;
  const sizeTotal = sizes.reduce((sum, size) => sum + (analytics.data?.truck_sizes[size] ?? 0), 0);
  const gradients = useMemo(() => {
    let offset = 0;
    return sizes.map((size, index) => { const value = analytics.data?.truck_sizes[size] ?? 0; const start = offset; offset += sizeTotal ? value / sizeTotal * 100 : 0; return `#${['047857','10b981','6ee7b7','d1fae5'][index]} ${start}% ${offset}%`; }).join(',');
  }, [analytics.data, sizeTotal]);

  function submitSearch(event: React.FormEvent) { event.preventDefault(); if (search.trim()) onNavigate(targetView); }
  function changePage(next: number) { setPage(next); window.setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }

  return <div className="workspace-view dashboard-view">
    <header className="dashboard-heading"><div><p className="eyebrow">OPERATIONS OVERVIEW</p><h1>Dashboard</h1><p>Linehaul truck requests and current operational activity.</p></div><div className="dashboard-controls"><label><CalendarDays size={16}/><span className="sr-only">Start date</span><input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)}/><span>to</span><input type="date" value={to} min={from} onChange={e => setTo(e.target.value)}/></label><button type="button" className="text-button" onClick={() => { setFrom(today); setTo(today); }}>Today</button><form onSubmit={submitSearch}><Search size={16}/><input aria-label="Search LH requests" placeholder="Search LH requests" value={search} onChange={e => setSearch(e.target.value)}/></form></div></header>
    {(requests.error || metrics.error || analytics.error) && <p className="error notice">Dashboard data could not be loaded.</p>}
    <section className="overview-metrics" aria-label="Request metrics">{cards.map(({label,status,value,icon:Icon}, index) => <button key={status} type="button" className={`metric-card${index === 0 ? ' primary' : ''}`} onClick={() => setDetailStatus(status)}><span className="metric-icon"><Icon size={19}/></span><span><small>{label}</small><strong>{metrics.isPending ? '—' : value.toLocaleString()}</strong></span></button>)}</section>
    <section className="analytics-grid">
      <article className="panel chart-panel"><div className="panel-head"><div><h2>Hourly truck requests</h2><p>Current night shift · 6 PM to 6 AM</p></div><div className="chart-summary"><strong>{hourly.reduce((sum,p) => sum+p.count,0)}</strong><span>Total · Peak {peak.count} at {peak.label}</span></div></div><div className="line-chart"><svg viewBox="0 0 700 180" role="img" aria-label="Hourly request line chart"><line x1="20" y1="145" x2="680" y2="145"/><line x1="20" y1="90" x2="680" y2="90"/><line x1="20" y1="35" x2="680" y2="35"/><polyline points={points}/>{hourly.map((point,index) => <g key={point.label}><circle cx={20+index*55} cy={145-point.count/max*110} r="4"><title>{point.label}: {point.count}</title></circle><text x={20+index*55} y="166">{point.label}</text></g>)}</svg></div></article>
      <article className="panel chart-panel"><div className="panel-head"><div><h2>Truck sizes</h2><p>Selected date range</p></div></div><div className="donut-layout"><div className="donut" style={{background: sizeTotal ? `conic-gradient(${gradients})` : '#eef2f6'}}><span><strong>{sizeTotal}</strong><small>Total</small></span></div><div className="donut-legend">{sizes.map((size,index) => { const count=analytics.data?.truck_sizes[size]??0; return <div key={size}><i style={{background:`#${['047857','10b981','6ee7b7','d1fae5'][index]}`}}/><span>{size}</span><strong>{count} <small>({sizeTotal?Math.round(count/sizeTotal*100):0}%)</small></strong></div>; })}</div></div></article>
    </section>
    <section className={`panel data-panel dashboard-table${requests.isFetching ? ' loading' : ''}`} ref={tableRef}><div className="panel-head"><div><h2>All requests</h2><p>Newest requests first · 50 per page</p></div></div>{requests.isPending ? <div className="loading-block">Loading requests…</div> : <><RequestTable rows={requests.data?.data ?? []} emptyMessage="Request activity will appear here."/>{requests.data && <Pagination page={requests.data} onPageChange={changePage}/>}</>}</section>
    {detailStatus !== null && <div className="dialog-layer" role="presentation" onMouseDown={e => e.target === e.currentTarget && setDetailStatus(null)}><section className="form-dialog request-detail-dialog" role="dialog" aria-modal="true" aria-label="Request details"><div className="dialog-head"><div><h2>{cards.find(c=>c.status===detailStatus)?.label}</h2><p>{from} to {to} · {details.data?.total ?? 0} requests</p></div><button className="icon-button" aria-label="Close" onClick={() => setDetailStatus(null)}><X size={18}/></button></div>{details.isPending ? <div className="loading-block">Loading…</div> : <RequestTable rows={details.data?.data ?? []}/>}</section></div>}
  </div>;
}
