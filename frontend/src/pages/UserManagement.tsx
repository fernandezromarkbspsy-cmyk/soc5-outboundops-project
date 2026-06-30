import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, UserX, X } from 'lucide-react';
import { api } from '../lib/api';
import { requiredText } from '../lib/validation';
import type { ManagedUser, Role } from '../types';

const roles: Role[] = ['ops_pic', 'fte_ops', 'fte_mm', 'doc_officer', 'dock_officer'];
const createUserSchema = z.object({
  name: requiredText('Name', 120),
  ops_id: z.string().trim().regex(/^ops[0-9]+$/i, 'OPS ID must look like ops12345.'),
});
type CreateUserFields = z.infer<typeof createUserSchema>;

export function UserManagement() {
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<{ data: ManagedUser[] }>('/users') });
  const create = useMutation({ mutationFn: (body: unknown) => api('/users', { method: 'POST', body: JSON.stringify(body) }), onSuccess: async () => { setCreating(false); await client.invalidateQueries({ queryKey: ['users'] }); } });
  const update = useMutation({ mutationFn: ({ id, body }: { id: string; body: unknown }) => api(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }), onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }) });
  const disable = useMutation({ mutationFn: (id: string) => api(`/users/${id}/disable`, { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }) });

  return <div className="workspace-view">
    <div className="page-actions"><button onClick={() => setCreating(true)}><Plus size={17} />Add Ops PIC</button></div>
    {(update.error || disable.error) && <p className="notice error">{(update.error || disable.error)?.message}</p>}
    <section className="panel data-panel">
      <div className="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Identifier</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{(users.data?.data ?? []).map(user => <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email || user.ops_id || '-'}</td>
            <td><select value={user.role} onChange={event => update.mutate({ id: user.id, body: { name: user.name, role: event.target.value as Role } })}>{roles.map(role => <option key={role}>{role}</option>)}</select></td>
            <td>{user.is_active ? 'Active' : 'Disabled'}</td>
            <td>{user.is_active && <button className="table-action reject" onClick={() => disable.mutate(user.id)}><UserX size={15} />Disable</button>}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
    {creating && <CreateUser busy={create.isPending} error={create.error?.message} onClose={() => setCreating(false)} onSubmit={body => create.mutate(body)} />}
  </div>;
}

function CreateUser({ busy, error, onClose, onSubmit }: { busy: boolean; error?: string; onClose: () => void; onSubmit: (body: CreateUserFields) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserFields>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', ops_id: '' },
  });

  return <div className="dialog-layer">
    <section className="form-dialog compact">
      <div className="dialog-head"><h2>Add Ops PIC</h2><button className="icon-button" onClick={onClose}><X /></button></div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>Name<input aria-invalid={!!errors.name} {...register('name')} />{errors.name && <span className="field-error">{errors.name.message}</span>}</label>
        <label>OPS ID<input placeholder="ops12345" aria-invalid={!!errors.ops_id} {...register('ops_id')} />{errors.ops_id && <span className="field-error">{errors.ops_id.message}</span>}</label>
        {error && <p className="notice error">{error}</p>}
        <div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button disabled={busy}>{busy ? 'Creating...' : 'Create user'}</button></div>
      </form>
    </section>
  </div>;
}
