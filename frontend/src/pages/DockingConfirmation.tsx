import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ShipWheel, X } from 'lucide-react';
import { useProgressiveRows } from '../hooks/useProgressiveRows';
import { api, describeApiError, mutationRequestInit, newIdempotencyKey } from '../lib/api';
import { PrintableTruckLabel } from '../components/PrintableTruckLabel';
import { RequestTable } from '../components/RequestTable';
import { smartRefetchInterval, swrQueryOptions } from '../lib/queryPatterns';
import { captureRequestSnapshot, restoreRequestSnapshot, updateRequest } from '../lib/requestCache';
import type { Page, TruckRequest, User } from '../types';

type DockAction = 'mark-docked' | 'confirm';

export function DockingConfirmation({ user }: { user: User }) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<TruckRequest | null>(null);
  const [printable, setPrintable] = useState<TruckRequest | null>(null);
  const queue = useQuery({
    queryKey: ['requests', 'docking'],
    queryFn: () => api<Page<TruckRequest>>('/requests?per_page=100&sort=created_at&direction=desc'),
    ...swrQueryOptions,
    enabled: user.role === 'doc_officer' || user.role === 'dock_officer',
    refetchInterval: smartRefetchInterval('realtime'),
  });
  const action = useMutation({
    mutationFn: ({ request, action, payload }: { request: TruckRequest; action: DockAction; payload?: Record<string, unknown> }) => api<TruckRequest>(`/requests/${request.id}/${action}`, mutationRequestInit('POST', payload ?? {}, { idempotencyKey: newIdempotencyKey(), updatedAt: request.updated_at ?? request.created_at })),
    onMutate: async ({ request, action, payload }) => {
      await client.cancelQueries({ queryKey: ['requests'] });
      const snapshot = captureRequestSnapshot(client);
      updateRequest(client, request.id, current => action === 'mark-docked'
        ? {
            ...current,
            status: 'DOCKED',
            driver_id: typeof payload?.driver_id === 'string' ? payload.driver_id : current.driver_id,
            linehaul_trip_no: typeof payload?.linehaul_trip_no === 'string' ? payload.linehaul_trip_no : current.linehaul_trip_no,
            docked_time: typeof payload?.docked_time === 'string' ? payload.docked_time : current.docked_time,
          }
        : {
            ...current,
            status: 'CONFIRMED',
          });
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context) restoreRequestSnapshot(client, context.snapshot);
    },
    onSuccess: async (updated, variables) => {
      setSelected(null);
      if (variables.action === 'mark-docked') setPrintable(updated);
      await client.invalidateQueries({ queryKey: ['requests'] });
    },
  });
  const rows = (queue.data?.data ?? []).filter(request => request.status === 'FOR_DOCKING' || request.status === 'ASSIGNED' || request.status === 'DOCKED');
  const streamedRows = useProgressiveRows(rows);
  const actions = (request: TruckRequest) => request.status === 'DOCKED'
    ? <button className="table-action approve" onClick={() => action.mutate({ request, action: 'confirm' })}><CheckCircle2 size={15} />Confirm</button>
    : <button className="table-action assign" onClick={() => setSelected(request)}><ShipWheel size={15} />Dock truck</button>;
  const feedback = action.error ? describeApiError(action.error) : null;

  return <div className="workspace-view">
    {action.error && <p className="notice error">{feedback?.message}</p>}
    <section className="panel data-panel"><div className="panel-head"><div><h2>Docking queue</h2><p>Assigned trucks requiring dock action or final confirmation</p></div></div>{queue.isPending ? <div className="loading-block">Loading docking queue...</div> : <><RequestTable rows={streamedRows.rows} actions={actions} emptyMessage="No trucks are waiting for docking." />{streamedRows.isStreaming && <p className="streaming-hint">Streaming {streamedRows.remaining} more rows...</p>}</>}</section>
    {selected && <DockDialog request={selected} busy={action.isPending} onClose={() => setSelected(null)} onSubmit={payload => action.mutate({ request: selected, action: 'mark-docked', payload })} />}
    {printable && <PrintableTruckLabel request={printable} onClose={() => setPrintable(null)} />}
  </div>;
}

function datetimeLocal(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function DockDialog({ request, busy, onClose, onSubmit }: { request: TruckRequest; busy: boolean; onClose: () => void; onSubmit: (payload: Record<string, unknown>) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({ driver_id: data.get('driver_id'), linehaul_trip_no: data.get('linehaul_trip_no'), docked_time: data.get('docked_time') });
  }
  return <div className="dialog-layer"><section className="form-dialog compact" role="dialog" aria-modal="true"><div className="dialog-head"><div><p className="eyebrow">{request.cluster}</p><h2>Dock truck</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><form onSubmit={submit}><label>Driver ID<input name="driver_id" required autoFocus defaultValue={request.driver_id ?? ''} /></label><label>LH Trip Number<input name="linehaul_trip_no" required defaultValue={request.linehaul_trip_no ?? ''} /></label><label>Docked Time<input name="docked_time" type="datetime-local" required defaultValue={datetimeLocal(request.docked_time)} /></label><div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button disabled={busy}>{busy ? 'Saving...' : 'Mark as docked'}</button></div></form></section></div>;
}
