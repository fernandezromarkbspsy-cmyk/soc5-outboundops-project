import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Truck, X } from 'lucide-react';
import { MetricSkeleton } from '../components/MetricSkeleton';
import { RequestTable } from '../components/RequestTable';
import { api } from '../lib/api';
import { smartRefetchInterval, swrQueryOptions } from '../lib/queryPatterns';
import { useUiStore } from '../stores/ui';
import type { AnalyticsRange, AppView, Page, RequestAnalytics, RequestMetrics, Status, TruckRequest, User } from '../types';

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return '';
  return points.reduce((path, point, index, all) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = all[index - 1];
    const midX = (previous.x + point.x) / 2;
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

const roleLabels: Record<User['role'], string> = {
  ops_pic: 'Ops PIC',
  fte_ops: 'FTE Ops',
  fte_mm: 'FTE Midmile',
  doc_officer: 'Document Officer',
  dock_officer: 'Dock Officer',
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Overview({ user, onNavigate }: { user: User; onNavigate: (view: AppView) => void }) {
  const from = useUiStore(state => state.dateFrom);
  const to = useUiStore(state => state.dateTo);
  const [detailStatus, setDetailStatus] = useState<Status | 'ALL' | null>(null);
  const [chartRange, setChartRange] = useState<AnalyticsRange>('shift');
  const range = `date_from=${from}&date_to=${to}`;
  const requests = useQuery({
    queryKey: ['requests', 'dashboard'],
    queryFn: () => api<Page<TruckRequest>>('/requests?per_page=100&sort=created_at&direction=desc'),
    ...swrQueryOptions,
    placeholderData: previous => previous,
    refetchInterval: smartRefetchInterval('standard'),
  });
  const metrics = useQuery({
    queryKey: ['request-metrics', from, to],
    queryFn: () => api<RequestMetrics>(`/requests/metrics?${range}`),
    ...swrQueryOptions,
    refetchInterval: smartRefetchInterval('standard'),
  });
  const analytics = useQuery({
    queryKey: ['request-analytics', from, to, chartRange],
    queryFn: () => api<RequestAnalytics>(`/requests/analytics?${range}&range=${chartRange}`),
    ...swrQueryOptions,
    refetchInterval: smartRefetchInterval('standard'),
  });
  const details = useQuery({
    queryKey: ['request-details', detailStatus, from, to],
    queryFn: () => api<Page<TruckRequest>>(`/requests?per_page=100&${range}${detailStatus !== 'ALL' ? `&status=${detailStatus}` : ''}`),
    ...swrQueryOptions,
    enabled: detailStatus !== null,
  });

  const cards: Array<{ label: string; status: Status | 'ALL'; value: number; icon: ReactNode }> = [
    { label: 'Total Request', status: 'ALL', value: metrics.data?.total ?? 0, icon: <img className="metric-icon-image" src="/dashboard-icon/light-bulb.png" alt="" aria-hidden="true" /> },
    { label: 'Pending Request', status: 'PENDING', value: metrics.data?.by_status.PENDING ?? 0, icon: <Clock3 size={18} /> },
    { label: 'For Docking', status: 'FOR_DOCKING', value: metrics.data?.by_status.FOR_DOCKING ?? 0, icon: <Truck size={18} /> },
    { label: 'Docked', status: 'DOCKED', value: metrics.data?.by_status.DOCKED ?? 0, icon: <Truck size={18} /> },
  ];
  const hourly = analytics.data?.hourly ?? [];
  const max = Math.max(1, ...hourly.map(point => point.count));
  const peak = hourly.reduce((best, point) => point.count > best.count ? point : best, { label: '-', count: 0 });
  const chartPoints = hourly.map((point, index) => ({
    ...point,
    x: 46 + index * (hourly.length > 1 ? 608 / (hourly.length - 1) : 0),
    y: 150 - point.count / max * 104,
  }));
  const linePath = smoothPath(chartPoints);
  const areaPath = chartPoints.length ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} 160 L ${chartPoints[0].x} 160 Z` : '';
  const peakPoint = chartPoints.reduce((best, point) => point.count > best.count ? point : best, { label: '-', count: 0, x: 350, y: 96 });
  const sizes = ['4W', '6W', '10W', '6WF'] as const;
  const sizeTotal = sizes.reduce((sum, size) => sum + (analytics.data?.truck_sizes[size] ?? 0), 0);
  const rows = requests.data?.data ?? [];
  const linehaulTrips = rows.filter(request => request.linehaul_trip_no || request.driver_id).slice(0, 4);
  const assignedTrucks = rows.filter(request => (request.status === 'FOR_DOCKING' || request.status === 'ASSIGNED') && request.plate_number).slice(0, 4);
  const palette = ['2f6f6a', '3f8f89', '77b7af', 'dbece8'];
  const gradients = useMemo(() => {
    let offset = 0;
    return sizes.map((size, index) => {
      const value = analytics.data?.truck_sizes[size] ?? 0;
      const start = offset;
      offset += sizeTotal ? value / sizeTotal * 100 : 0;
      return `#${palette[index]} ${start}% ${offset}%`;
    }).join(',');
  }, [analytics.data, sizeTotal]);

  const metricsLoading = metrics.isPending && !metrics.data;
  const pendingCount = metrics.data?.by_status.PENDING ?? 0;
  const forDockingCount = metrics.data?.by_status.FOR_DOCKING ?? 0;

  const chartSubtitle = chartRange === 'shift'
    ? 'Current night shift · 6 PM to 6 AM'
    : chartRange === 'weekly'
      ? `${from} to ${to} · daily totals`
      : `${from} to ${to} · last 30 days`;

  return <div className="workspace-view dashboard-view">
    {(requests.error || metrics.error || analytics.error) && <p className="error notice">Dashboard data could not be loaded. Try refreshing the page.</p>}

    <section className="dashboard-hero" aria-label="Welcome">
      <div>
        <p className="eyebrow">{roleLabels[user.role]}</p>
        <h2>{greeting()}, {user.name.split(' ')[0]}</h2>
        <p>Track linehaul requests, truck assignments, and docking progress in real time.</p>
      </div>
      <div className="hero-highlights">
        <div><strong>{from}</strong><span>Date range start</span></div>
        <div><strong>{metricsLoading ? '—' : pendingCount.toLocaleString()}</strong><span>Pending now</span></div>
        <div><strong>{metricsLoading ? '—' : forDockingCount.toLocaleString()}</strong><span>Ready to dock</span></div>
      </div>
    </section>

    <section className="overview-metrics" aria-label="Request metrics" aria-busy={metricsLoading}>
      {metricsLoading ? <MetricSkeleton /> : cards.map(({ label, status, value, icon }, index) => (
        <button key={status} type="button" className={`metric-card${index === 0 ? ' primary' : ''}`} onClick={() => setDetailStatus(status)}>
          <span className="metric-icon">{icon}</span>
          <span><small>{label}</small><strong>{value.toLocaleString()}</strong></span>
        </button>
      ))}
    </section>

    <section className="dashboard-grid">
      <article className="panel dashboard-list-panel">
        <div className="panel-head compact">
          <div><h2>Linehaul Trips</h2><p>Driver IDs from dock officer updates</p></div>
          <button className="text-button" type="button" onClick={() => onNavigate('docking')}>View all</button>
        </div>
        <div className="dashboard-list">
          {requests.isPending && !rows.length ? <p className="compact-empty">Loading recent trips...</p> : linehaulTrips.length ? linehaulTrips.map(request => (
            <div className="linehaul-row" key={request.id}>
              <span className="avatar">{(request.driver_id || request.created_by).slice(0, 1).toUpperCase()}</span>
              <div><strong>{request.driver_id || 'Driver pending'}</strong><small>Doc Officer: {request.created_by}</small></div>
              <span>{request.linehaul_trip_no || 'Trip pending'}</span>
              <span>{request.cluster}</span>
            </div>
          )) : <p className="compact-empty">No linehaul trips have been created yet.</p>}
        </div>
      </article>

      <article className="panel chart-panel line-panel">
        <div className="panel-head compact">
          <div><h2>Truck request volume</h2><p>{chartSubtitle}</p></div>
          <div className="chart-tabs" role="tablist" aria-label="Chart range">
            {([
              ['shift', 'Shift'],
              ['weekly', 'Weekly'],
              ['monthly', 'Monthly'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={chartRange === value}
                className={chartRange === value ? 'active' : ''}
                onClick={() => setChartRange(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="line-chart">
          {analytics.isPending && !hourly.length ? (
            <div className="loading-block">Loading chart...</div>
          ) : (
            <svg viewBox="0 0 700 190" role="img" aria-label="Hourly request line chart">
              <defs><linearGradient id="lineArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#245b56" stopOpacity=".22" /><stop offset="100%" stopColor="#245b56" stopOpacity="0" /></linearGradient></defs>
              <line x1="46" y1="160" x2="654" y2="160" />
              <line x1="46" y1="112" x2="654" y2="112" />
              <line x1="46" y1="64" x2="654" y2="64" />
              {areaPath && <path className="line-area" d={areaPath} />}
              <path className="line-stroke" d={linePath} />
              {chartPoints.map(point => <g key={point.label}><circle cx={point.x} cy={point.y} r="4"><title>{point.label}: {point.count}</title></circle><text x={point.x} y="178">{point.label}</text></g>)}
              {chartPoints.length > 0 && <g className="line-callout"><line x1={peakPoint.x} y1={peakPoint.y} x2={peakPoint.x} y2="160" /><rect x={Math.max(48, Math.min(peakPoint.x - 48, 604))} y={Math.max(18, peakPoint.y - 42)} width="96" height="34" rx="5" /><text x={Math.max(96, Math.min(peakPoint.x, 652))} y={Math.max(38, peakPoint.y - 22)}>{peak.label}</text><text x={Math.max(96, Math.min(peakPoint.x, 652))} y={Math.max(52, peakPoint.y - 8)}>{peak.count} requests</text></g>}
            </svg>
          )}
        </div>
        <div className="chart-summary inline"><strong>{hourly.reduce((sum, point) => sum + point.count, 0)}</strong><span>Total requests · Peak {peak.count} at {peak.label}</span></div>
      </article>

      <article className="panel chart-panel">
        <div className="panel-head compact"><div><h2>Truck sizes</h2><p>{from === to ? from : `${from} to ${to}`}</p></div></div>
        <div className="donut-layout">
          <div className="donut" style={{ background: sizeTotal ? `conic-gradient(${gradients})` : '#eef2f6' }}>
            <span><strong>{sizeTotal}</strong><small>Total</small></span>
          </div>
          <div className="donut-legend">
            {sizes.map((size, index) => {
              const count = analytics.data?.truck_sizes[size] ?? 0;
              return <div key={size}><i style={{ background: `#${palette[index]}` }} /><span>{size}</span><strong>{count} <small>({sizeTotal ? Math.round(count / sizeTotal * 100) : 0}%)</small></strong></div>;
            })}
          </div>
        </div>
      </article>

      <article className="panel dashboard-list-panel">
        <div className="panel-head compact">
          <div><h2>For Docking</h2><p>Assigned trucks with plate number</p></div>
          <button className="text-button" type="button" onClick={() => onNavigate('docking')}>View all</button>
        </div>
        <div className="dashboard-list truck-list">
          {assignedTrucks.length ? assignedTrucks.map(request => (
            <div className="truck-row" key={request.id}>
              <span className="truck-dot"><Truck size={15} /></span>
              <div><strong>{request.cluster}</strong><small>{request.status.replaceAll('_', ' ')}</small></div>
              <span>{request.plate_number}</span>
              <span>{request.truck_size}</span>
            </div>
          )) : <p className="compact-empty">No assigned trucks are ready for docking.</p>}
        </div>
      </article>
    </section>

    {detailStatus !== null && (
      <div className="dialog-layer" role="presentation" onMouseDown={event => event.target === event.currentTarget && setDetailStatus(null)}>
        <section className="form-dialog request-detail-dialog" role="dialog" aria-modal="true" aria-label="Request details">
          <div className="dialog-head">
            <div><h2>{cards.find(card => card.status === detailStatus)?.label}</h2><p>{from} to {to} · {details.data?.total ?? 0} requests</p></div>
            <button className="icon-button" aria-label="Close" onClick={() => setDetailStatus(null)}><X size={18} /></button>
          </div>
          {details.isPending ? <div className="loading-block">Loading requests...</div> : <RequestTable rows={details.data?.data ?? []} />}
        </section>
      </div>
    )}
  </div>;
}
