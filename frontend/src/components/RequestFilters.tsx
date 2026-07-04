import { Download, RefreshCw, Search } from 'lucide-react';
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
  function change(values: Partial<Filters>) {
    onChange({ ...filters, ...values, page: 1 });
  }

  return <section className="request-controls" aria-label="Request filters">
    <label className="search-field"><Search size={17} /><input aria-label="Search by plate number" placeholder="Search by plate #" value={filters.search} onChange={event => change({ search: event.target.value })} /></label>
    <label className="filter-field"><span>From</span><input type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={event => change({ dateFrom: event.target.value })} /></label>
    <label className="filter-field"><span>To</span><input type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={event => change({ dateTo: event.target.value })} /></label>
    <label className="filter-field status-filter"><span>Status</span><select value={filters.status} onChange={event => change({ status: event.target.value as Status | 'ALL' })}>{statuses.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>
    <div className="control-actions">
      <button className="icon-button" type="button" title="Refresh requests" aria-label="Refresh requests" onClick={onRefresh}><RefreshCw size={18} /></button>
      <button className="export-button" type="button" disabled={exporting} onClick={onExport}><Download size={17} />{exporting ? 'Exporting' : 'CSV'}</button>
    </div>
  </section>;
}
