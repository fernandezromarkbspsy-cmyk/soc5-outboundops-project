import { useQuery } from '@tanstack/react-query';
import { BarChart3, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { MetricSkeleton } from '../components/MetricSkeleton';
import { api } from '../lib/api';
import { smartRefetchInterval, swrQueryOptions } from '../lib/queryPatterns';

type Summary = {
  total: number;
  confirmed: number;
  cancelled: number;
  averageApprovalMinutes: number | null;
};

type Daily = {
  data: Array<{ date: string; total: number; confirmed: number }>;
};

export function Kpi() {
  const summary = useQuery({
    queryKey: ['kpi', 'summary'],
    queryFn: () => api<Summary>('/kpi/summary'),
    ...swrQueryOptions,
    refetchInterval: smartRefetchInterval('slow'),
  });
  const daily = useQuery({
    queryKey: ['kpi', 'daily'],
    queryFn: () => api<Daily>('/kpi/daily'),
    ...swrQueryOptions,
    refetchInterval: smartRefetchInterval('slow'),
  });

  const rows = daily.data?.data ?? [];
  const max = Math.max(1, ...rows.map(row => row.total));
  const loading = summary.isPending && !summary.data;

  return (
    <div className="workspace-view">
      {summary.error && <p className="error notice">KPI summary could not be loaded.</p>}
      <section className="overview-metrics" aria-label="KPI summary" aria-busy={loading}>
        {loading ? (
          <MetricSkeleton />
        ) : (
          <>
            <article>
              <div className="metric-icon neutral"><BarChart3 size={18} /></div>
              <div><span>Total requests</span><strong>{summary.data?.total?.toLocaleString() ?? '—'}</strong></div>
            </article>
            <article>
              <div className="metric-icon success"><CheckCircle2 size={18} /></div>
              <div><span>Confirmed</span><strong>{summary.data?.confirmed?.toLocaleString() ?? '—'}</strong></div>
            </article>
            <article>
              <div className="metric-icon warning"><XCircle size={18} /></div>
              <div><span>Cancelled</span><strong>{summary.data?.cancelled?.toLocaleString() ?? '—'}</strong></div>
            </article>
            <article>
              <div className="metric-icon info"><Clock3 size={18} /></div>
              <div>
                <span>Avg. approval</span>
                <strong>{summary.data?.averageApprovalMinutes == null ? '—' : `${Math.round(summary.data.averageApprovalMinutes)}m`}</strong>
              </div>
            </article>
          </>
        )}
      </section>

      <section className="panel kpi-chart">
        <div className="panel-head">
          <div><h2>Daily volume</h2><p>Last 30 days</p></div>
        </div>
        {daily.isPending && !rows.length ? (
          <div className="loading-block">Loading chart...</div>
        ) : daily.error ? (
          <p className="error notice">Daily KPI data could not be loaded.</p>
        ) : rows.length === 0 ? (
          <p className="compact-empty">No daily volume data yet.</p>
        ) : (
          <div className="bar-chart">
            {rows.map(row => (
              <div key={row.date}>
                <span style={{ height: `${Math.max(4, row.total / max * 180)}px` }} title={`${row.date}: ${row.total} total, ${row.confirmed} confirmed`} />
                <small>{new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
