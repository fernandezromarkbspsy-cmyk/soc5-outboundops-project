import { FormEvent, useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Truck, X, XCircle } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { RequestFilters } from '../components/RequestFilters';
import { RequestTable } from '../components/RequestTable';
import type { QueueSnapshot } from '../hooks/useQueueNotifications';
import { api } from '../lib/api';
import { defaultRequestFilters, exportRequestsCsv, requestQueryString } from '../lib/requests';
import type { Page, RequestSort, TruckRequest, User } from '../types';

type MmAction = 'assign-truck' | 'reject-mm';

export function MidmileRequests({ user, queue }: { user: User; queue: QueueSnapshot }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(defaultRequestFilters);
  const deferredSearch = useDeferredValue(filters.search);
  const [selected, setSelected] = useState<{ request: TruckRequest; action: MmAction } | null>(null);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const appliedFilters = { ...filters, search: deferredSearch };
  const requests = useQuery({
    queryKey: ['requests', 'midmile-all', appliedFilters],
    queryFn: () => api<Page<TruckRequest>>(`/requests?${requestQueryString(appliedFilters)}`),
    placeholderData: previous => previous,
    enabled: user.role === 'fte_mm',
  });
  const transition = useMutation({
    mutationFn: ({ request, action, payload }: { request: TruckRequest; action: MmAction; payload: Record<string, unknown> }) => api<TruckRequest>(`/requests/${request.id}/${action}`, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: async (_, variables) => { setSelected(null); setNotice(variables.action === 'assign-truck' ? 'Truck confirmed.' : 'Request returned to Outbound.'); await queryClient.invalidateQueries({ queryKey: ['requests'] }); await queryClient.invalidateQueries({ queryKey: ['request-metrics'] }); },
  });

  const actions = (request: TruckRequest) => request.status === 'APPROVED' ? <><button className="table-action assign" type="button" onClick={() => {queue.acknowledge(request.id);setSelected({ request, action: 'assign-truck' });}}><CheckCircle2 size={15} />Assign</button><button className="table-action reject" type="button" onClick={() => {queue.acknowledge(request.id);setSelected({ request, action: 'reject-mm' });}}><XCircle size={15} />Reject</button></> : null;
  function sortBy(sort: RequestSort) { setFilters(value => ({ ...value, sort, direction: value.sort === sort && value.direction === 'asc' ? 'desc' : 'asc', page: 1 })); }
  async function exportCsv() {
    setExporting(true);
    setNotice('');
    try { await exportRequestsCsv(appliedFilters, `truck-requests-${new Date().toISOString().slice(0, 10)}.csv`); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'CSV export failed.'); }
    finally { setExporting(false); }
  }

  return <div className="workspace-view">
    {(notice || transition.error) && <p className={`notice${transition.error || notice.includes('failed') ? ' error' : ' success-notice'}`}>{transition.error?.message || notice}</p>}

    <section className="panel data-panel queue-panel"><div className="panel-head"><div><div className="section-title"><h2>Pending confirmation</h2>{queue.count > 0 && <span className="count-badge">{queue.count}</span>}</div><p>Approved requests awaiting FTE Midmile confirmation</p></div></div>{queue.isPending ? <div className="loading-block">Loading confirmation queue...</div> : queue.error ? <p className="state error">{queue.error.message}</p> : <RequestTable rows={queue.rows} emptyMessage="No approved requests are awaiting confirmation." actions={actions} />}</section>

    <section className="request-list-section"><RequestFilters filters={filters} exporting={exporting} onChange={setFilters} onExport={() => void exportCsv()} onRefresh={() => void requests.refetch()} /><section className="panel data-panel">{requests.isPending ? <div className="loading-block">Loading requests...</div> : requests.error ? <p className="state error">{requests.error.message}</p> : <><RequestTable rows={requests.data?.data ?? []} actions={actions} sort={filters.sort} direction={filters.direction} onSort={sortBy} /><Pagination page={requests.data!} onPageChange={page => setFilters(value => ({ ...value, page }))} /></>}</section></section>

    {selected && <MidmileActionDialog selection={selected} busy={transition.isPending} error={transition.error?.message} onClose={() => setSelected(null)} onSubmit={payload => transition.mutate({ ...selected, payload })} />}
  </div>;
}

function MidmileActionDialog({ selection, busy, error, onClose, onSubmit }: { selection: { request: TruckRequest; action: MmAction }; busy: boolean; error?: string; onClose: () => void; onSubmit: (payload: Record<string, unknown>) => void }) {
  const confirming = selection.action === 'assign-truck';
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit(confirming ? { plate_number: data.get('plate_number'), truck_size: data.get('truck_size'), truck_type: data.get('truck_type'), provide_time: data.get('provide_time') || null } : { rejection_remarks: data.get('rejection_remarks') });
  }
  return <div className="dialog-layer"><section className="form-dialog compact" role="dialog" aria-modal="true" aria-labelledby="action-title"><div className="dialog-head"><div><p className="eyebrow">{selection.request.cluster}</p><h2 id="action-title">{confirming ? 'Assign truck' : 'Reject request'}</h2></div><button className="icon-button" type="button" title="Close" aria-label="Close" onClick={onClose}><X size={19} /></button></div><form onSubmit={submit}>{confirming ? <><label>Plate number<input name="plate_number" required maxLength={30} autoFocus /></label><label>Truck size<select name="truck_size" defaultValue={selection.request.truck_size}><option>4W</option><option>6W</option><option>10W</option><option>6WF</option></select></label><label>Truck type<select name="truck_type" defaultValue={selection.request.truck_type}><option>WETLEASE</option><option>DRYLEASE</option></select></label><label>Provide time<input name="provide_time" type="datetime-local" /></label></> : <label>Rejection remarks<textarea name="rejection_remarks" required rows={4} autoFocus /></label>}{error && <p className="error notice">{error}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button disabled={busy}>{busy ? 'Saving...' : confirming ? <><Truck size={17} />Assign truck</> : 'Reject request'}</button></div></form></section></div>;
}
