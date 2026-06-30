import { Fragment, type ReactNode, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { RequestSort, SortDirection, TruckRequest } from '../types';
import { StatusBadge } from './StatusBadge';

type Props = {
  rows: TruckRequest[];
  actions?: (request: TruckRequest) => ReactNode;
  emptyMessage?: string;
  sort?: RequestSort;
  direction?: SortDirection;
  onSort?: (sort: RequestSort) => void;
};

const columns: Array<{ key: keyof TruckRequest; sortKey?: RequestSort; label: string; render: (request: TruckRequest) => ReactNode }> = [
  { key: 'status', sortKey: 'status', label: 'Status', render: request => <StatusBadge status={request.status} /> },
  { key: 'request_timestamp', sortKey: 'request_timestamp', label: 'Request Timestamp', render: request => formatDateTime(request.request_timestamp) },
  { key: 'cluster', sortKey: 'cluster', label: 'Cluster', render: request => request.cluster },
  { key: 'region', label: 'Region', render: request => request.region },
  { key: 'dock_no', sortKey: 'dock_no', label: 'Dock No', render: request => request.dock_no },
  { key: 'backlogs', sortKey: 'backlogs', label: 'Backlogs', render: request => request.backlogs.toLocaleString() },
  { key: 'backlogs_timestamp', label: 'Backlogs Timestamp', render: request => formatDateTime(request.backlogs_timestamp) },
  { key: 'ob_fte', label: 'OB FTE', render: request => empty(request.ob_fte) },
  { key: 'truck_size', label: 'Truck Size', render: request => request.truck_size },
  { key: 'truck_type', label: 'Truck Type', render: request => request.truck_type },
  { key: 'plate_number', sortKey: 'plate_number', label: 'Plate Number', render: request => empty(request.plate_number) },
  { key: 'provide_time', label: 'Provide Time', render: request => formatDateTime(request.provide_time) },
  { key: 'linehaul_trip_no', label: 'Linehaul Trip No', render: request => empty(request.linehaul_trip_no) },
  { key: 'docked_time', label: 'Docked Time', render: request => formatDateTime(request.docked_time) },
];

export function RequestTable({ rows, actions, emptyMessage = 'No requests found.', sort, direction, onSort }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  if (!rows.length) return <div className="empty-state"><strong>No requests</strong><p>{emptyMessage}</p></div>;

  function heading(column: (typeof columns)[number]) {
    if (!onSort || !column.sortKey) return column.label;
    const active = sort === column.sortKey;
    const Icon = active ? direction === 'asc' ? ArrowUp : ArrowDown : ChevronsUpDown;
    return <button className="sort-button" type="button" onClick={() => onSort(column.sortKey!)}>{column.label}<Icon size={14} /></button>;
  }

  return <div className="table-wrap request-table-wrap"><table className="request-table"><thead><tr>{columns.map(column => <th key={column.key} className={`request-column request-column--${column.key}`}>{heading(column)}</th>)}{actions && <th><span className="sr-only">Actions</span></th>}</tr></thead><tbody>{rows.map(request => {
    const expanded = expandedId === request.id;
    return <Fragment key={request.id}>
      <tr className="request-row" aria-expanded={expanded} onClick={() => setExpandedId(value => value === request.id ? null : request.id)}>
        {columns.map(column => <td key={column.key} className={`request-column request-column--${column.key}`} data-label={column.label}>{column.render(request)}</td>)}
        {actions && <td data-label="Actions" onClick={event => event.stopPropagation()}><div className="row-actions">{actions(request)}</div></td>}
      </tr>
      {expanded && <tr className="request-detail-row"><td colSpan={columns.length + (actions ? 1 : 0)}><RequestDetails request={request} /></td></tr>}
    </Fragment>;
  })}</tbody></table></div>;
}

function empty(value: string | null | undefined) {
  return value?.trim() ? value : '-';
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function RequestDetails({ request }: { request: TruckRequest }) {
  const fields: Array<[string, ReactNode]> = [
    ['Request ID', request.id],
    ['Created By', request.created_by],
    ['Created At', formatDateTime(request.created_at)],
    ['Updated At', formatDateTime(request.updated_at)],
    ['Driver ID', empty(request.driver_id)],
    ['Rejection Remarks', empty(request.rejection_remarks)],
  ];

  return <div className="request-detail-grid">{fields.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}
