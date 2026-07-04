import { CalendarDays, Download, RefreshCw, Search } from 'lucide-react';
import type { RequestFilters as Filters, Status } from '../types';

const statuses: Array<Status | 'ALL'> = ['ALL', 'PENDING', 'APPROVED', 'REJECTED_BY_MM', 'ASSIGNED', 'FOR_DOCKING', 'DOCKED', 'CONFIRMED', 'CANCELLED'];

type Props = {
  filters: Filters;
  exporting: boolean;
  onChange: (next: Filters) => void;
  onExport: () => void;
  onRefresh: () => void;
};

export function RequestFilters({ filters, exporting, onChange, onExport, onRefresh }: Props) {
  const today = localDate(new Date());
  const preset = activePreset(filters.dateFrom, filters.dateTo, today);

  function change(values: Partial<Filters>) {
    onChange({ ...filters, ...values, page: 1 });
  }

  function applyPreset(value: string) {
    if (value === 'custom') return;
    if (value === 'all') return change({ dateFrom: '', dateTo: '' });
    const end = new Date(`${today}T12:00:00`);
    const start = new Date(end);
    if (value === 'yesterday') end.setDate(end.getDate() - 1);
    if (value === 'last7') start.setDate(start.getDate() - 6);
    if (value === 'month') start.setDate(1);
    if (value === 'yesterday') start.setTime(end.getTime());
    change({ dateFrom: localDate(start), dateTo: localDate(end) });
  }

  return <section className="request-controls" aria-label="Request filters">
    <label className="search-field"><Search size={17} /><input aria-label="Search by plate number" placeholder="Search by plate #" value={filters.search} onChange={event => change({ search: event.target.value })} /></label>
    <label className="filter-field date-preset"><span>Date range</span><span className="select-with-icon"><CalendarDays size={16} /><select aria-label="Date range preset" value={preset} onChange={event => applyPreset(event.target.value)}><option value="all">All dates</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="last7">Last 7 days</option><option value="month">This month</option><option value="custom">Custom range</option></select></span></label>
    <label className="filter-field"><span>From</span><input type="date" value={filters.dateFrom} max={filters.dateTo || today} onChange={event => change({ dateFrom: event.target.value })} /></label>
    <label className="filter-field"><span>To</span><input type="date" value={filters.dateTo} min={filters.dateFrom || undefined} max={today} onChange={event => change({ dateTo: event.target.value })} /></label>
    <label className="filter-field status-filter"><span>Status</span><select value={filters.status} onChange={event => change({ status: event.target.value as Status | 'ALL' })}>{statuses.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>
    <div className="control-actions">
      <button className="icon-button" type="button" title="Refresh requests" aria-label="Refresh requests" onClick={onRefresh}><RefreshCw size={18} /></button>
      <button className="export-button" type="button" disabled={exporting} onClick={onExport}><Download size={17} />{exporting ? 'Exporting' : 'CSV'}</button>
    </div>
  </section>;
}

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function activePreset(from: string, to: string, today: string) {
  if (!from && !to) return 'all';
  if (from === today && to === today) return 'today';
  const end = new Date(`${today}T12:00:00`);
  const yesterday = new Date(end); yesterday.setDate(yesterday.getDate() - 1);
  if (from === localDate(yesterday) && to === localDate(yesterday)) return 'yesterday';
  const last7 = new Date(end); last7.setDate(last7.getDate() - 6);
  if (from === localDate(last7) && to === today) return 'last7';
  const month = new Date(end); month.setDate(1);
  if (from === localDate(month) && to === today) return 'month';
  return 'custom';
}
