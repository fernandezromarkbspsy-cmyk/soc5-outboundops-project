import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock3, Route, Truck } from 'lucide-react';
import { RequestTable } from '../components/RequestTable';
import { api } from '../lib/api';
import type { AppView, Page, RequestMetrics, TruckRequest, User } from '../types';

export function Overview({ user, onNavigate }: { user: User; onNavigate: (view: AppView) => void }) {
  const requests = useQuery({ queryKey: ['requests', 'recent'], queryFn: () => api<Page<TruckRequest>>('/requests?per_page=8') });
  const metrics = useQuery({ queryKey: ['request-metrics'], queryFn: () => api<RequestMetrics>('/requests/metrics') });
  const loading = requests.isPending || metrics.isPending;
  const error = requests.error || metrics.error;
  const targetView = user.role === 'fte_mm' ? 'truck-request' : 'lh-request';

  return <div className="workspace-view">
    <header className="page-header"><div><p className="eyebrow">OPERATIONS OVERVIEW</p><h1>Dashboard</h1><p>Current outbound request activity and pending handoffs.</p></div>{user.role !== 'doc_officer' && <button className="secondary-command" type="button" onClick={() => onNavigate(targetView)}>{user.role === 'fte_mm' ? <Truck size={18} /> : <Route size={18} />}Open queue<ArrowRight size={17} /></button>}</header>
    {error && <p className="error notice">{error.message}</p>}
    <section className="overview-metrics" aria-label="Request metrics">
      <article><div className="metric-icon neutral"><Route size={19} /></div><div><span>Total requests</span><strong>{loading ? '--' : metrics.data?.total ?? 0}</strong></div></article>
      <article><div className="metric-icon warning"><Clock3 size={19} /></div><div><span>Pending</span><strong>{loading ? '--' : metrics.data?.by_status.PENDING ?? 0}</strong></div></article>
      <article><div className="metric-icon info"><Truck size={19} /></div><div><span>For docking</span><strong>{loading ? '--' : metrics.data?.by_status.FOR_DOCKING ?? 0}</strong></div></article>
      <article><div className="metric-icon success"><Truck size={19} /></div><div><span>Docked</span><strong>{loading ? '--' : metrics.data?.by_status.DOCKED ?? 0}</strong></div></article>
    </section>
    <section className="panel data-panel"><div className="panel-head"><div><h2>Recent activity</h2><p>Latest requests visible to your role</p></div></div>{loading ? <div className="loading-block">Loading activity...</div> : <RequestTable rows={requests.data?.data ?? []} emptyMessage="Request activity will appear here." />}</section>
  </div>;
}
