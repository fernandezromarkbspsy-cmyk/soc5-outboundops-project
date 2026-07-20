import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Plus, ShieldCheck, UserRound, UserX, X } from 'lucide-react';
import { api } from '../lib/api';
import { swrQueryOptions } from '../lib/queryPatterns';
import type { ManagedUser, Role } from '../types';

const roles: Role[] = ['ops_pic', 'fte_ops', 'fte_mm', 'doc_officer', 'dock_officer'];
const roleLabels: Record<Role, string> = {
  ops_pic: 'Ops PIC',
  fte_ops: 'FTE Ops',
  fte_mm: 'FTE Midmile',
  doc_officer: 'Document Officer',
  dock_officer: 'Dock Officer',
};

export function UserManagement() {
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<{ data: ManagedUser[] }>('/users'), ...swrQueryOptions });
  const create = useMutation({ mutationFn: (body: unknown) => api('/users', { method: 'POST', body: JSON.stringify(body) }), onSuccess: async () => { setCreating(false); await client.invalidateQueries({ queryKey: ['users'] }); } });
  const update = useMutation({ mutationFn: ({ id, body }: { id: string; body: unknown }) => api(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }), onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }) });
  const disable = useMutation({ mutationFn: (id: string) => api(`/users/${id}/disable`, { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }) });
  const rows = users.data?.data ?? [];

  return <div className="workspace-view">
    <div className="page-actions"><button onClick={() => setCreating(true)}><Plus size={17} />Add Ops PIC</button></div>
    {(update.error || disable.error) && <p className="notice error">{(update.error || disable.error)?.message}</p>}
    <section className="panel data-panel users-panel">
      <div className="panel-head compact"><div><h2>All users</h2><p>Manage access, role views, and active operator accounts</p></div><span className="count-badge">{rows.length}</span></div>
      {users.isPending ? <div className="loading-block">Loading users...</div> : rows.length ? <div className="table-frame user-table-frame">
        <div className="table-wrap user-table-wrap">
          <table className="user-table">
            <thead><tr><th>User</th><th>Identifier</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>{rows.map(user => <tr key={user.id} className={user.is_active ? '' : 'is-disabled'}>
              <td data-label="User"><div className="user-cell"><span className="user-avatar-mini">{initials(user.name)}</span><div><strong>{user.name}</strong><small>{roleLabels[user.role]}</small></div></div></td>
              <td data-label="Identifier"><span className="identifier-cell">{user.email ? <Mail size={14} /> : <ShieldCheck size={14} />}<span>{user.email || user.ops_id || '-'}</span></span></td>
              <td data-label="Role"><select className="role-select" value={user.role} disabled={!user.is_active || update.isPending} onChange={event => update.mutate({ id: user.id, body: { name: user.name, role: event.target.value as Role } })}>{roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></td>
              <td data-label="Status"><span className={`user-status ${user.is_active ? 'active' : 'disabled'}`}>{user.is_active ? 'Active' : 'Disabled'}</span></td>
              <td data-label="Created"><span className="user-date">{formatDate(user.created_at)}</span></td>
              <td data-label="Actions"><div className="row-actions">{user.is_active ? <button className="table-action reject" disabled={disable.isPending} onClick={() => disable.mutate(user.id)}><UserX size={15} />Disable</button> : <span className="muted-action">No action</span>}</div></td>
            </tr>)}</tbody>
          </table>
        </div>
      </div> : <div className="empty-state"><UserRound size={24} /><strong>No users</strong><p>User accounts will appear here after provisioning.</p></div>}
    </section>
    {creating && <CreateUser busy={create.isPending} error={create.error?.message} onClose={() => setCreating(false)} onSubmit={body => create.mutate(body)} />}
  </div>;
}

function CreateUser({ busy, error, onClose, onSubmit }: { busy: boolean; error?: string; onClose: () => void; onSubmit: (body: unknown) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({ name: data.get('name'), ops_id: data.get('ops_id') });
  }

  return <div className="dialog-layer"><section className="form-dialog compact"><div className="dialog-head"><h2>Add Ops PIC</h2><button className="icon-button" onClick={onClose}><X /></button></div><form onSubmit={submit}><label>Name<input name="name" required /></label><label>OPS ID<input name="ops_id" required pattern="ops[0-9]+" placeholder="ops12345" /></label>{error && <p className="notice error">{error}</p>}<div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button disabled={busy}>{busy ? 'Creating...' : 'Create user'}</button></div></form></section></div>;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return (parts.map(part => part[0]).join('') || 'U').toUpperCase();
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
}
