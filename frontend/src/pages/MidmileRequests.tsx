import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircle2, Truck, X, XCircle } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { RequestFilters } from '../components/RequestFilters';
import { RequestTable } from '../components/RequestTable';
import type { QueueSnapshot } from '../hooks/useQueueNotifications';
import { api } from '../lib/api';
import { defaultRequestFilters, exportRequestsCsv, requestQueryString } from '../lib/requests';
import { optionalText, requiredText } from '../lib/validation';
import type { Page, RequestSort, TruckRequest, User } from '../types';

type MmAction = 'assign-truck' | 'reject-mm';
const assignTruckSchema = z.object({
  plate_number: requiredText('Plate number', 30),
  truck_size: z.enum(['4W', '6W', '10W', '6WF']),
  truck_type: z.enum(['WETLEASE', 'DRYLEASE']),
  provide_time: optionalText,
});
const rejectMmSchema = z.object({ rejection_remarks: requiredText('Rejection remarks', 500) });
type AssignTruckInput = z.input<typeof assignTruckSchema>;
type AssignTruckFields = z.output<typeof assignTruckSchema>;
type RejectMmFields = z.output<typeof rejectMmSchema>;

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
  const assignForm = useForm<AssignTruckInput, unknown, AssignTruckFields>({
    resolver: zodResolver(assignTruckSchema),
    defaultValues: { plate_number: '', truck_size: selection.request.truck_size as AssignTruckFields['truck_size'], truck_type: selection.request.truck_type as AssignTruckFields['truck_type'], provide_time: null },
  });
  const rejectForm = useForm<RejectMmFields>({ resolver: zodResolver(rejectMmSchema), defaultValues: { rejection_remarks: '' } });
  return <div className="dialog-layer"><section className="form-dialog compact" role="dialog" aria-modal="true" aria-labelledby="action-title"><div className="dialog-head"><div><p className="eyebrow">{selection.request.cluster}</p><h2 id="action-title">{confirming ? 'Assign truck' : 'Reject request'}</h2></div><button className="icon-button" type="button" title="Close" aria-label="Close" onClick={onClose}><X size={19} /></button></div>{confirming ? <form onSubmit={assignForm.handleSubmit(onSubmit)}><label>Plate number<input maxLength={30} autoFocus aria-invalid={!!assignForm.formState.errors.plate_number} {...assignForm.register('plate_number')} />{assignForm.formState.errors.plate_number && <span className="field-error">{assignForm.formState.errors.plate_number.message}</span>}</label><label>Truck size<select {...assignForm.register('truck_size')}><option>4W</option><option>6W</option><option>10W</option><option>6WF</option></select></label><label>Truck type<select {...assignForm.register('truck_type')}><option>WETLEASE</option><option>DRYLEASE</option></select></label><label>Provide time<input type="datetime-local" {...assignForm.register('provide_time')} /></label>{error && <p className="error notice">{error}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button disabled={busy}>{busy ? 'Saving...' : <><Truck size={17} />Assign truck</>}</button></div></form> : <form onSubmit={rejectForm.handleSubmit(onSubmit)}><label>Rejection remarks<textarea rows={4} autoFocus aria-invalid={!!rejectForm.formState.errors.rejection_remarks} {...rejectForm.register('rejection_remarks')} />{rejectForm.formState.errors.rejection_remarks && <span className="field-error">{rejectForm.formState.errors.rejection_remarks.message}</span>}</label>{error && <p className="error notice">{error}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="danger-button" disabled={busy}>{busy ? 'Saving...' : 'Reject request'}</button></div></form>}</section></div>;
}
