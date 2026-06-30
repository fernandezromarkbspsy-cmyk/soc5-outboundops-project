import { useDeferredValue, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { z } from 'zod';
import { Ban, Check, Pencil, Plus, Save, X, XCircle } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { RequestFilters } from '../components/RequestFilters';
import { RequestTable } from '../components/RequestTable';
import type { QueueSnapshot } from '../hooks/useQueueNotifications';
import { api } from '../lib/api';
import { defaultRequestFilters, exportRequestsCsv, requestQueryString } from '../lib/requests';
import { numberFromInput, optionalText, requiredText } from '../lib/validation';
import { useUiStore } from '../stores/ui';
import type { ClusterLookup, Page, RequestSort, TruckRequest, User } from '../types';

type EditableAction = { kind: 'edit' | 'reject'; request: TruckRequest };
const requestSchema = z.object({
  cluster: requiredText('Cluster'),
  region: requiredText('Region'),
  dock_no: requiredText('Dock number', 50),
  backlogs: numberFromInput('Backlogs'),
  backlogs_timestamp: z.string().optional().nullable(),
  truck_size: z.enum(['4W', '6W', '10W', '6WF']),
  trip_type: optionalText,
  remarks: optionalText,
});
type RequestFormInput = z.input<typeof requestSchema>;
type RequestPayload = z.output<typeof requestSchema>;

export function OutboundRequests({ user, queue }: { user: User; queue: QueueSnapshot }) {
  const queryClient = useQueryClient();
  const globalSearch = useUiStore(state => state.search);
  const setGlobalSearch = useUiStore(state => state.setSearch);
  const [filters, setFilters] = useState(() => ({ ...defaultRequestFilters, search: globalSearch }));
  const deferredSearch = useDeferredValue(filters.search);
  const [activeAction, setActiveAction] = useState<EditableAction | null>(null);
  const [creating, setCreating] = useState(false);
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
    await queryClient.invalidateQueries({ queryKey: ['request-analytics'] });
  }

  const createRequest = useMutation({
    mutationFn: (payload: RequestPayload) => api<TruckRequest>('/requests', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: async () => { setCreating(false); await refreshData('LH request created.'); },
  });
  const editRequest = useMutation({
    mutationFn: async ({ request, payload }: { request: TruckRequest; payload: RequestPayload }) => {
      await api<TruckRequest>(`/requests/${request.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      return api<TruckRequest>(`/requests/${request.id}/approve`, { method: 'POST', body: '{}' });
    },
    onSuccess: async () => { setActiveAction(null); await refreshData('Request updated and routed to FTE MM.'); },
  });
  const transition = useMutation({
    mutationFn: ({ request, action }: { request: TruckRequest; action: 'approve' | 'reject-ops' | 'cancel' }) => api<TruckRequest>(`/requests/${request.id}/${action}`, { method: 'POST', body: '{}' }),
    onSuccess: async (_, variables) => { setActiveAction(null); await refreshData(variables.action === 'approve' ? 'Request approved.' : variables.action === 'reject-ops' ? 'Request rejected.' : 'Request cancelled.'); },
  });
  const bulkApprove = useMutation({mutationFn:(ids:string[])=>api('/requests/bulk-approve',{method:'POST',body:JSON.stringify({ids})}),onSuccess:()=>refreshData('Pending requests approved.')});

  const actionable = (request: TruckRequest) => request.status === 'PENDING' || request.status === 'REJECTED_BY_MM';
  const actions = (request: TruckRequest) => user.role === 'fte_ops' && actionable(request) ? <>
    <button className="table-action approve" type="button" disabled={transition.isPending} onClick={() => {queue.acknowledge(request.id);transition.mutate({ request, action: 'approve' });}}><Check size={15} />Approve</button>
    <button className="table-action edit" type="button" disabled={editRequest.isPending} onClick={() => {queue.acknowledge(request.id);setActiveAction({ kind: 'edit', request });}}><Pencil size={15} />Edit</button>
    <button className="table-action reject" type="button" disabled={transition.isPending} onClick={() => {queue.acknowledge(request.id);setActiveAction({ kind: 'reject', request });}}><XCircle size={15} />Reject</button>
  </> : user.role === 'ops_pic' && actionable(request) ? <button className="table-action cancel" type="button" disabled={transition.isPending} onClick={() => {queue.acknowledge(request.id);setActiveAction({ kind: 'reject', request });}}><Ban size={15} />Cancel</button> : null;

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
    {(notice || error) && <p className={`notice${error || notice.includes('failed') ? ' error' : ' success-notice'}`}>{error?.message || notice}</p>}

    {user.role === 'fte_ops' && <section className="panel data-panel queue-panel"><div className="panel-head"><div><div className="section-title"><h2>Pending approval</h2>{queue.count > 0 && <span className="count-badge">{queue.count}</span>}</div><p>New requests requiring FTE Ops review</p></div>{queue.rows.length>1&&<button disabled={bulkApprove.isPending} onClick={()=>{queue.rows.forEach(row=>queue.acknowledge(row.id));bulkApprove.mutate(queue.rows.map(row=>row.id));}}><Check size={16}/>{bulkApprove.isPending?'Approving…':`Approve all (${queue.rows.length})`}</button>}</div>{queue.isPending ? <div className="loading-block">Loading approval queue...</div> : queue.error ? <p className="state error">{queue.error.message}</p> : <RequestTable rows={queue.rows} emptyMessage="No requests are awaiting approval." actions={actions} />}</section>}

    <section className="request-list-section">
      <RequestFilters filters={filters} exporting={exporting} onChange={next => { setFilters(next); setGlobalSearch(next.search); }} onExport={() => void exportCsv()} onRefresh={() => void requests.refetch()} createButton={user.role === 'ops_pic' && <button type="button" onClick={() => setCreating(true)}><Plus size={17} />Create request</button>} />
      <section className="panel data-panel">{creating && <InlineCreateRow busy={createRequest.isPending} onCancel={() => setCreating(false)} onSubmit={payload => { setNotice(''); createRequest.mutate(payload); }} />}{requests.isPending ? <div className="loading-block">Loading requests...</div> : requests.error ? <p className="state error">{requests.error.message}</p> : <><RequestTable rows={requests.data?.data ?? []} actions={actions} sort={filters.sort} direction={filters.direction} onSort={sortBy} /><Pagination page={requests.data!} onPageChange={page => setFilters(value => ({ ...value, page }))} /></>}</section>
    </section>

    {activeAction?.kind === 'edit' && <EditRequestDialog request={activeAction.request} busy={editRequest.isPending} error={editRequest.error?.message} onClose={() => setActiveAction(null)} onSubmit={payload => editRequest.mutate({ request: activeAction.request, payload })} />}
    {activeAction?.kind === 'reject' && <ConfirmRejectDialog request={activeAction.request} isCancel={user.role === 'ops_pic'} busy={transition.isPending} onClose={() => setActiveAction(null)} onConfirm={() => transition.mutate({ request: activeAction.request, action: user.role === 'fte_ops' ? 'reject-ops' : 'cancel' })} />}
  </div>;
}

function RequestFields({ register, errors }: { register: UseFormRegister<RequestFormInput>; errors: FieldErrors<RequestFormInput> }) {
  return <div className="form-grid request-form-grid">
    <label>Cluster<input aria-invalid={!!errors.cluster} maxLength={120} {...register('cluster')} />{errors.cluster && <span className="field-error">{errors.cluster.message}</span>}</label>
    <label>Region<input aria-invalid={!!errors.region} maxLength={120} {...register('region')} />{errors.region && <span className="field-error">{errors.region.message}</span>}</label>
    <label>Dock number<input aria-invalid={!!errors.dock_no} maxLength={50} {...register('dock_no')} />{errors.dock_no && <span className="field-error">{errors.dock_no.message}</span>}</label>
    <label>Backlogs<input type="number" min={0} aria-invalid={!!errors.backlogs} {...register('backlogs')} />{errors.backlogs && <span className="field-error">{errors.backlogs.message}</span>}</label>
    <label>Truck size<select {...register('truck_size')}><option>4W</option><option>6W</option><option>10W</option><option>6WF</option></select></label>
    <label>Trip type (optional)<select {...register('trip_type')}><option value="">Select trip type</option><option>1st MDT</option><option>2nd MDT</option><option>Adv Request</option></select></label>
    <label>Remarks (optional)<textarea rows={2} placeholder="Additional notes or remarks..." {...register('remarks')} /></label>
  </div>;
}

function InlineCreateRow({ busy, onCancel, onSubmit }: { busy: boolean; onCancel: () => void; onSubmit: (payload: RequestPayload) => void }) {
  const [clusterText, setClusterText] = useState('');
  const [selected, setSelected] = useState<ClusterLookup | null>(null);
  const clusterSearch = useDeferredValue(clusterText);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RequestFormInput, unknown, RequestPayload>({
    resolver: zodResolver(requestSchema),
    defaultValues: { cluster: '', region: '', dock_no: '', backlogs: 0, backlogs_timestamp: '', truck_size: '6W', trip_type: null, remarks: null },
  });
  const lookup = useQuery({
    queryKey: ['clusters', clusterSearch],
    queryFn: () => api<{ data: ClusterLookup[] }>(`/clusters?search=${encodeURIComponent(clusterSearch)}`),
    enabled: clusterSearch.trim().length >= 3,
  });

  function pick(cluster: ClusterLookup) {
    setSelected(cluster);
    setClusterText(cluster.cluster_name);
    setValue('cluster', cluster.cluster_name, { shouldValidate: true });
    setValue('region', cluster.region, { shouldValidate: true });
    setValue('dock_no', cluster.dock_number ?? '', { shouldValidate: true });
    setValue('backlogs', cluster.backlogs ?? 0, { shouldValidate: true });
    setValue('backlogs_timestamp', cluster.backlogs_ts ?? '');
  }

  return <form className="inline-create-row" onSubmit={handleSubmit(onSubmit)}>
    <label className="cluster-lookup-field">Cluster<input autoFocus maxLength={120} value={clusterText} aria-invalid={!!errors.cluster} onChange={event => { setClusterText(event.target.value); setSelected(null); setValue('cluster', event.target.value, { shouldValidate: true }); }} placeholder="Type 3 chars" />{errors.cluster && <span className="field-error">{errors.cluster.message}</span>}{lookup.data && !selected && <div className="cluster-suggestions">{lookup.data.data.length ? lookup.data.data.map(cluster => <button key={cluster.id} type="button" onClick={() => pick(cluster)}><strong>{cluster.cluster_name}</strong><span>{cluster.hub_name} / {cluster.region}</span></button>) : <p>No cluster found.</p>}</div>}</label>
    <label>Region<input readOnly {...register('region')} />{errors.region && <span className="field-error">{errors.region.message}</span>}</label>
    <label>Dock No<input maxLength={50} {...register('dock_no')} />{errors.dock_no && <span className="field-error">{errors.dock_no.message}</span>}</label>
    <label>Backlogs<input type="number" readOnly min={0} {...register('backlogs')} />{errors.backlogs && <span className="field-error">{errors.backlogs.message}</span>}</label>
    <label>Backlogs Timestamp<input readOnly value={selected?.backlogs_ts ? new Date(selected.backlogs_ts).toLocaleString() : ''} /><input type="hidden" {...register('backlogs_timestamp')} /></label>
    <label>Truck Size<select {...register('truck_size')}><option>4W</option><option>6W</option><option>10W</option><option>6WF</option></select></label>
    <label>Trip Type<select {...register('trip_type')}><option value="">Select trip type</option><option>1st MDT</option><option>2nd MDT</option><option>Adv Request</option></select></label>
    <label>Remarks<textarea rows={1} placeholder="Additional notes..." {...register('remarks')} /></label>
    <div className="inline-create-actions"><button className="secondary-button" type="button" onClick={onCancel}><X size={15} />Cancel</button><button disabled={busy || !selected}><Save size={15} />{busy ? 'Saving...' : 'Save'}</button></div>
  </form>;
}

function EditRequestDialog({ request, busy, error, onClose, onSubmit }: { request: TruckRequest; busy: boolean; error?: string; onClose: () => void; onSubmit: (payload: RequestPayload) => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RequestFormInput, unknown, RequestPayload>({
    resolver: zodResolver(requestSchema),
    defaultValues: { cluster: request.cluster, region: request.region, dock_no: request.dock_no, backlogs: request.backlogs, backlogs_timestamp: request.backlogs_timestamp ?? '', truck_size: request.truck_size as RequestPayload['truck_size'], trip_type: request.trip_type ?? null, remarks: request.remarks ?? null },
  });
  useEffect(() => reset({ cluster: request.cluster, region: request.region, dock_no: request.dock_no, backlogs: request.backlogs, backlogs_timestamp: request.backlogs_timestamp ?? '', truck_size: request.truck_size as RequestPayload['truck_size'], trip_type: request.trip_type ?? null, remarks: request.remarks ?? null }), [request, reset]);
  return <div className="dialog-layer"><section className="form-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="dialog-head"><div><p className="eyebrow">FTE OPS</p><h2 id="edit-title">Edit LH request</h2></div><button className="icon-button" type="button" title="Close" aria-label="Close" onClick={onClose}><X size={19} /></button></div><form onSubmit={handleSubmit(onSubmit)}><RequestFields register={register} errors={errors} />{error && <p className="error notice">{error}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div></form></section></div>;
}

function ConfirmRejectDialog({ request, isCancel, busy, onClose, onConfirm }: { request: TruckRequest; isCancel: boolean; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  return <div className="dialog-layer"><section className="form-dialog compact" role="alertdialog" aria-modal="true" aria-labelledby="reject-title"><div className="dialog-head"><div><p className="eyebrow">{request.cluster}</p><h2 id="reject-title">{isCancel ? 'Cancel request' : 'Reject request'}</h2></div><button className="icon-button" type="button" title="Close" aria-label="Close" onClick={onClose}><X size={19} /></button></div><p className="dialog-copy">This request will be moved to Cancelled and removed from the active queue.</p><div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Keep request</button><button className="danger-button" type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Saving...' : isCancel ? 'Cancel request' : 'Reject request'}</button></div></section></div>;
}
