import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { CommandPalette } from '../components/CommandPalette';
import { useQueueNotifications } from '../hooks/useQueueNotifications';
import { supabase } from '../lib/supabase';
import { useUiStore } from '../stores/ui';
import type { AppView, Role, User } from '../types';
import { Overview } from './Overview';
import { OutboundRequests } from './OutboundRequests';
import { MidmileRequests } from './MidmileRequests';
import { DockingConfirmation } from './DockingConfirmation';
import { Kpi } from './Kpi';
import { UserManagement } from './UserManagement';

export function Dashboard({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const viewRole = useUiStore(state => state.viewRole);
  const setViewRole = useUiStore(state => state.setViewRole);
  const activeUser = { ...user, role: user.is_admin && viewRole ? viewRole : user.role };
  const allowed = (candidate: AppView) => candidate === 'overview' || (candidate === 'lh-request' && (activeUser.role === 'ops_pic' || activeUser.role === 'fte_ops')) || (candidate === 'truck-request' && activeUser.role === 'fte_mm') || (candidate === 'docking' && (activeUser.role === 'doc_officer' || activeUser.role === 'dock_officer')) || (candidate === 'kpi' && activeUser.role === 'fte_ops') || (candidate === 'users' && (activeUser.role === 'fte_ops' || activeUser.role === 'fte_mm'));
  const fromPath = (): AppView => ({'/outbound/lh-request':'lh-request','/midmile/truck-request':'truck-request','/docking':'docking','/kpi':'kpi','/users':'users'}[window.location.pathname] as AppView|undefined) ?? 'overview';
  const [view, setView] = useState<AppView>(() => allowed(fromPath()) ? fromPath() : 'overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const queue = useQueueNotifications(activeUser);

  async function switchRole(role: Role) {
    setViewRole(role);
    setView('overview');
    window.history.pushState({}, '', '/dashboard');
    await queryClient.invalidateQueries();
  }

  function navigate(next: AppView, replace = false) {
    if (!allowed(next)) next = 'overview';
    const paths:Record<AppView,string>={overview:'/dashboard','lh-request':'/outbound/lh-request','truck-request':'/midmile/truck-request',docking:'/docking',kpi:'/kpi',users:'/users'};
    const path = paths[next];
    window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
    setView(next);
  }

  useEffect(() => {
    navigate(view, true);
    const onPopState = () => setView(allowed(fromPath()) ? fromPath() : 'overview');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return <div className="app-shell">
    <AppSidebar user={activeUser} activeView={view} open={menuOpen} onOpenChange={setMenuOpen} onNavigate={navigate} onSignOut={() => void supabase.auth.signOut()} pendingCount={queue.count} />
    <main className="app-content">
      <AppHeader user={activeUser} view={view} onRoleChange={switchRole} onSearch={() => navigate(activeUser.role === 'fte_mm' ? 'truck-request' : 'lh-request')} onCommand={() => setCommandOpen(true)} />
      {view === 'overview' && <Overview user={activeUser} onNavigate={navigate} />}
      {view === 'lh-request' && <OutboundRequests user={activeUser} queue={queue} />}
      {view === 'truck-request' && <MidmileRequests user={activeUser} queue={queue} />}
      {view === 'docking' && <DockingConfirmation user={activeUser} queue={queue} />}
      {view === 'kpi' && <Kpi />}
      {view === 'users' && <UserManagement />}
      <CommandPalette open={commandOpen} activeView={view} canNavigate={allowed} onClose={() => setCommandOpen(false)} onNavigate={navigate} />
    </main>
  </div>;
}
