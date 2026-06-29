import type { ReactNode } from 'react';
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

const columns: Array<{ key: RequestSort; label: string }> = [
  { key: 'created_at', label: 'Created' },
  { key: 'cluster', label: 'Cluster' },
  { key: 'dock_no', label: 'Dock' },
  { key: 'backlogs', label: 'Load' },
  { key: 'plate_number', label: 'Plate' },
  { key: 'status', label: 'Status' },
];

export function RequestTable({ rows, actions, emptyMessage = 'No requests found.', sort, direction, onSort }: Props) {
  if (!rows.length) return <div className="empty-state"><strong>No requests</strong><p>{emptyMessage}</p></div>;

  function heading(column: { key: RequestSort; label: string }) {
    if (!onSort) return column.label;
    const active = sort === column.key;
    const Icon = active ? direction === 'asc' ? ArrowUp : ArrowDown : ChevronsUpDown;
    return <button className="sort-button" type="button" onClick={() => onSort(column.key)}>{column.label}<Icon size={14} /></button>;
  }

  return <div className="table-wrap"><table><thead><tr>{columns.slice(0, 4).map(column => <th key={column.key}>{heading(column)}</th>)}<th>Truck</th>{columns.slice(4).map(column => <th key={column.key}>{heading(column)}</th>)}{actions && <th><span className="sr-only">Actions</span></th>}</tr></thead><tbody>{rows.map(request => <tr key={request.id}><td>{new Date(request.created_at).toLocaleString()}</td><td>{request.cluster}<small>{request.region}</small></td><td>{request.dock_no}</td><td>{request.backlogs.toLocaleString()}</td><td>{request.truck_size} / {request.truck_type}</td><td>{request.plate_number || '-'}</td><td><StatusBadge status={request.status} /></td>{actions && <td><div className="row-actions">{actions(request)}</div></td>}</tr>)}</tbody></table></div>;
}
