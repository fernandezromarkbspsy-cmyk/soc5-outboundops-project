import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircle2, ShipWheel, X } from 'lucide-react';
import { api } from '../lib/api';
import { PrintableTruckLabel } from '../components/PrintableTruckLabel';
import { RequestTable } from '../components/RequestTable';
import type { QueueSnapshot } from '../hooks/useQueueNotifications';
import type { Page, TruckRequest, User } from '../types';
import { requiredText } from '../lib/validation';

type DockAction = 'mark-docked' | 'confirm';
const dockSchema = z.object({
  driver_id: requiredText('Driver ID', 80),
  linehaul_trip_no: requiredText('LH Trip Number', 80),
  docked_time: requiredText('Docked time', 80),
});
type DockFields = z.infer<typeof dockSchema>;

export function DockingConfirmation({ user, queue }: { user: User; queue: QueueSnapshot }) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<TruckRequest | null>(null);
  const [printable, setPrintable] = useState<TruckRequest | null>(null);
  const dockRequests = useQuery({
    queryKey: ['requests', 'docking'],
    queryFn: () => api<Page<TruckRequest>>('/requests?per_page=100&sort=created_at&direction=desc'),
    enabled: user.role === 'doc_officer' || user.role === 'dock_officer',
  });
  const action = useMutation({
    mutationFn: ({ request, action, payload }: { request: TruckRequest; action: DockAction; payload?: Record<string, unknown> }) => api<TruckRequest>(`/requests/${request.id}/${action}`, { method: 'POST', body: JSON.stringify(payload ?? {}) }),
    onSuccess: async (updated, variables) => {
      setSelected(null);
      if (variables.action === 'mark-docked') setPrintable(updated);
      await client.invalidateQueries({ queryKey: ['requests'] });
    },
  });
  const rows = (dockRequests.data?.data ?? []).filter(request => request.status === 'FOR_DOCKING' || request.status === 'ASSIGNED' || request.status === 'DOCKED');
  const actions = (request: TruckRequest) => request.status === 'DOCKED'
    ? <button className="table-action approve" onClick={() => {queue.acknowledge(request.id);action.mutate({ request, action: 'confirm' });}}><CheckCircle2 size={15} />Confirm</button>
    : <button className="table-action assign" onClick={() => {queue.acknowledge(request.id);setSelected(request);}}><ShipWheel size={15} />Dock truck</button>;

  return <div className="workspace-view">
    {action.error && <p className="notice error">{action.error.message}</p>}
    <section className="panel data-panel"><div className="panel-head"><div><h2>Docking queue</h2><p>Assigned trucks requiring dock action or final confirmation</p></div></div>{dockRequests.isPending ? <div className="loading-block">Loading docking queue...</div> : <RequestTable rows={rows} actions={actions} emptyMessage="No trucks are waiting for docking." />}</section>
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
  const { register, handleSubmit, formState: { errors } } = useForm<DockFields>({
    resolver: zodResolver(dockSchema),
    defaultValues: { driver_id: request.driver_id ?? '', linehaul_trip_no: request.linehaul_trip_no ?? '', docked_time: datetimeLocal(request.docked_time) },
  });
  return <div className="dialog-layer"><section className="form-dialog compact" role="dialog" aria-modal="true"><div className="dialog-head"><div><p className="eyebrow">{request.cluster}</p><h2>Dock truck</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><form onSubmit={handleSubmit(onSubmit)}><label>Driver ID<input autoFocus aria-invalid={!!errors.driver_id} {...register('driver_id')} />{errors.driver_id && <span className="field-error">{errors.driver_id.message}</span>}</label><label>LH Trip Number<input aria-invalid={!!errors.linehaul_trip_no} {...register('linehaul_trip_no')} />{errors.linehaul_trip_no && <span className="field-error">{errors.linehaul_trip_no.message}</span>}</label><label>Docked Time<input type="datetime-local" aria-invalid={!!errors.docked_time} {...register('docked_time')} />{errors.docked_time && <span className="field-error">{errors.docked_time.message}</span>}</label><div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button disabled={busy}>{busy ? 'Saving...' : 'Mark as docked'}</button></div></form></section></div>;
}
