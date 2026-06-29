import { FormEvent, useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Check, Pencil, Plus, X, XCircle } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { RequestFilters } from '../components/RequestFilters';
import { RequestTable } from '../components/RequestTable';
import type { QueueSnapshot } from '../hooks/useQueueNotifications';
import { api } from '../lib/api';
import { defaultRequestFilters, exportRequestsCsv, requestQueryString } from '../lib/requests';
import type { Page, RequestSort, TruckRequest, User } from '../types';

type EditableAction = { kind: 'edit' | 'reject'; request: TruckRequest };
type RequestPayload = { cluster: FormDataEntryValue | null; region: FormDataEntryValue | null; dock_no: FormDataEntryValue | null; backlogs: number; truck_size: FormDataEntryValue | null; truck_type: FormDataEntryValue | null };

export function OutboundRequests({ user, queue }: { user: User; queue: QueueSnapshot }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(defaultRequestFilters);
  const deferredSearch = useDeferredValue(filters.search);
  const [activeAction, setActiveAction] = useState<EditableAction | null>(null);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const appliedFilters = { ...filters, search: deferredSearch };
  const requests = useQuery({
    queryKey: ['requests', 'outbound-all', appliedFilters],
    queryFn: () => api<Page<TruckRequest>>(`/requests?${requestQueryString(appliedFilters)}`),
    placeholderData: previous => previous,
  });

  async function refreshData(message: string) {
    setNotice(message);
    await queryClient.invalidateQueries({ queryKey: ['requests'] });
    await queryClient.invalidateQueries({ queryKey: ['request-metrics'] });
  }

  const createRequest = useMutation({
    mutationFn: (payload: RequestPayload) => api<TruckRequest>('/requests', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => refreshData('LH request created.'),
  });
  const editRequest = useMutation({
    mutationFn: ({ request, payload }: { request: TruckRequest; payload: RequestPayload }) => api<TruckRequest>(`/requests/${request.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: async () => { setActiveAction(null); await refreshData('Request updated.'); },
  });
  const transition = useMutation({
    mutationFn: ({ request, action }: { request: TruckRequest; action: 'approve' | 'reject-ops' | 'cancel' }) => api<TruckRequest>(`/requests/${request.id}/${action}`, { method: 'POST', body: '{}' }),
    onSuccess: async (_, variables) => { setActiveAction(null); await refreshData(variables.action === 'approve' ? 'Request approved.' : variables.action === 'reject-ops' ? 'Request rejected.' : 'Request cancelled.'); },
  });

  const actionable = (request: TruckRequest) => request.status === 'PENDING' || request.status === 'REJECTED_BY_MM';
  const actions = (request: TruckRequest) => user.role === 'fte_ops' && actionable(request) ? <>
    <button className="table-action approve" type="button" disabled={transition.isPending} onClick={() => transition.mutate({ request, action: 'approve' })}><Check size={15} />Approve</button>
    <button className="table-action edit" type="button" disabled={editRequest.isPending} onClick={() => setActiveAction({ kind: 'edit', request })}><Pencil size={15} />Edit</button>
    <button className="table-action reject" type="button" disabled={transition.isPending} onClick={() => setActiveAction({ kind: 'reject', request })}><XCircle size={15} />Reject</button>
  </> : user.role === 'ops_pic' && actionable(request) ? <button className="table-action cancel" type="button" disabled={transition.isPending} onClick={() => setActiveAction({ kind: 'reject', request })}><Ban size={15} />Cancel</button> : null;

  function sortBy(sort: RequestSort) {
    setFilters(value => ({ ...value, sort, direction: value.sort === sort && value.direction === 'asc' ? 'desc' : 'asc', page: 1 }));
  }

  async function exportCsv() {
    setExporting(true);
    setNotice('');
    try {
      await exportRequestsCsv(appliedFilters, `lh-requests-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'CSV export failed.');
    } finally {
      setExporting(false);
    }
  }

  const error = createRequest.error || editRequest.error || transition.error;
  return <div className="workspace-view">
    <header className="page-header"><div><p className="eyebrow">OUTBOUND</p><h1>LH Request</h1><p>{user.role === 'ops_pic' ? 'Create and track your linehaul requests.' : 'Review pending requests and manage the complete outbound queue.'}</p></div></header>
    {(notice || error) && <p className={`notice${error || notice.includes('failed') ? ' error' : ' success-notice'}`}>{error?.message || notice}</p>}

    {user.role === 'ops_pic' && <InlineRequestForm busy={createRequest.isPending} onSubmit={payload => { setNotice(''); createRequest.mutate(payload); }} />}

    {user.role === 'fte_ops' && <section className="panel data-panel queue-panel"><div className="panel-head"><div><div className="section-title"><h2>Pending approval</h2>{queue.count > 0 && <span className="count-badge">{queue.count}</span>}</div><p>New requests requiring FTE Ops review</p></div></div>{queue.isPending ? <div className="loading-block">Loading approval queue...</div> : queue.error ? <p className="state error">{queue.error.message}</p> : <RequestTable rows={queue.rows} emptyMessage="No requests are awaiting approval." actions={actions} />}</section>}

    <section className="request-list-section">
      <div className="section-heading"><div><h2>{user.role === 'fte_ops' ? 'All requests' : 'Requests'}</h2><p>Search, filter, sort, and export the request history.</p></div></div>
      <RequestFilters filters={filters} exporting={exporting} onChange={setFilters} onExport={() => void exportCsv()} onRefresh={() => void requests.refetch()} />
      <section className="panel data-panel">{requests.isPending ? <div className="loading-block">Loading requests...</div> : requests.error ? <p className="state error">{requests.error.message}</p> : <><RequestTable rows={requests.data?.data ?? []} actions={actions} sort={filters.sort} direction={filters.direction} onSort={sortBy} /><Pagination page={requests.data!} onPageChange={page => setFilters(value => ({ ...value, page }))} /></>}</section>
    </section>

    {activeAction?.kind === 'edit' && <EditRequestDialog request={activeAction.request} busy={editRequest.isPending} error={editRequest.error?.message} onClose={() => setActiveAction(null)} onSubmit={payload => editRequest.mutate({ request: activeAction.request, payload })} />}
    {activeAction?.kind === 'reject' && <ConfirmRejectDialog request={activeAction.request} isCancel={user.role === 'ops_pic'} busy={transition.isPending} onClose={() => setActiveAction(null)} onConfirm={() => transition.mutate({ request: activeAction.request, action: user.role === 'fte_ops' ? 'reject-ops' : 'cancel' })} />}
  </div>;
}

function requestPayload(form: HTMLFormElement): RequestPayload {
  const data = new FormData(form);
  return { cluster: data.get('cluster'), region: data.get('region'), dock_no: data.get('dock_no'), backlogs: Number(data.get('backlogs')), truck_size: data.get('truck_size'), truck_type: data.get('truck_type') };
}

function RequestFields({ request }: { request?: TruckRequest }) {
  return <div className="form-grid request-form-grid"><label>Cluster<input name="cluster" required maxLength={120} defaultValue={request?.cluster} /></label><label>Region<input name="region" required maxLength={120} defaultValue={request?.region} /></label><label>Dock number<input name="dock_no" required maxLength={50} defaultValue={request?.dock_no} /></label><label>Backlogs<input name="backlogs" type="number" required min={0} defaultValue={request?.backlogs ?? 0} /></label><label>Truck size<select name="truck_size" defaultValue={request?.truck_size ?? '6W'}><option>4W</option><option>6W</option><option>10W</option><option>6WF</option></select></label><label>Truck type<select name="truck_type" defaultValue={request?.truck_type ?? 'WETLEASE'}><option>WETLEASE</option><option>DRYLEASE</option></select></label></div>;
}

function InlineRequestForm({ busy, onSubmit }: { busy: boolean; onSubmit: (payload: RequestPayload) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSubmit(requestPayload(event.currentTarget)); }
  return <section className="panel inline-request-form"><div className="panel-head"><div><h2>New request</h2><p>Enter the current outbound load requirement.</p></div></div><form onSubmit={submit}><RequestFields /><div className="inline-form-actions"><button disabled={busy}><Plus size={17} />{busy ? 'Creating...' : 'Create request'}</button></div></form></section>;
}

function EditRequestDialog({ request, busy, error, onClose, onSubmit }: { request: TruckRequest; busy: boolean; error?: string; onClose: () => void; onSubmit: (payload: RequestPayload) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSubmit(requestPayload(event.currentTarget)); }
  return <div className="dialog-layer"><section className="form-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="dialog-head"><div><p className="eyebrow">FTE OPS</p><h2 id="edit-title">Edit LH request</h2></div><button className="icon-button" type="button" title="Close" aria-label="Close" onClick={onClose}><X size={19} /></button></div><form onSubmit={submit}><RequestFields request={request} />{error && <p className="error notice">{error}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div></form></section></div>;
}

function ConfirmRejectDialog({ request, isCancel, busy, onClose, onConfirm }: { request: TruckRequest; isCancel: boolean; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  return <div className="dialog-layer"><section className="form-dialog compact" role="alertdialog" aria-modal="true" aria-labelledby="reject-title"><div className="dialog-head"><div><p className="eyebrow">{request.cluster}</p><h2 id="reject-title">{isCancel ? 'Cancel request' : 'Reject request'}</h2></div><button className="icon-button" type="button" title="Close" aria-label="Close" onClick={onClose}><X size={19} /></button></div><p className="dialog-copy">This request will be moved to Cancelled and removed from the active queue.</p><div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Keep request</button><button className="danger-button" type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Saving...' : isCancel ? 'Cancel request' : 'Reject request'}</button></div></section></div>;
}
