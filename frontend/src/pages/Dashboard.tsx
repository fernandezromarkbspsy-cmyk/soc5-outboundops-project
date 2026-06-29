import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useQueueNotifications } from '../hooks/useQueueNotifications';
import { supabase } from '../lib/supabase';
import { useUiStore } from '../stores/ui';
import type { AppView, Role, User } from '../types';
import { Overview } from './Overview';
import { OutboundRequests } from './OutboundRequests';
import { MidmileRequests } from './MidmileRequests';

export function Dashboard({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const viewRole = useUiStore(state => state.viewRole);
  const setViewRole = useUiStore(state => state.setViewRole);
  const activeUser = { ...user, role: user.is_admin && viewRole ? viewRole : user.role };
  const allowed = (candidate: AppView) => candidate === 'overview' || (candidate === 'lh-request' && (activeUser.role === 'ops_pic' || activeUser.role === 'fte_ops')) || (candidate === 'truck-request' && activeUser.role === 'fte_mm');
  const fromPath = (): AppView => window.location.pathname === '/outbound/lh-request' ? 'lh-request' : window.location.pathname === '/midmile/truck-request' ? 'truck-request' : 'overview';
  const [view, setView] = useState<AppView>(() => allowed(fromPath()) ? fromPath() : 'overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const queue = useQueueNotifications(activeUser);

  async function switchRole(role: Role) {
    setViewRole(role);
    setView('overview');
    window.history.pushState({}, '', '/dashboard');
    await queryClient.invalidateQueries();
  }

  function navigate(next: AppView, replace = false) {
    if (!allowed(next)) next = 'overview';
    const path = next === 'overview' ? '/dashboard' : next === 'lh-request' ? '/outbound/lh-request' : '/midmile/truck-request';
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
      <AppHeader user={activeUser} view={view} count={queue.count} alerts={queue.alerts} onRoleChange={switchRole} onSearch={() => navigate(activeUser.role === 'fte_mm' ? 'truck-request' : 'lh-request')} onOpenAlert={request => { queue.acknowledge(request.id); navigate(activeUser.role === 'fte_mm' ? 'truck-request' : 'lh-request'); }} />
      {view === 'overview' && <Overview user={activeUser} onNavigate={navigate} />}
      {view === 'lh-request' && <OutboundRequests user={activeUser} queue={queue} />}
      {view === 'truck-request' && <MidmileRequests user={activeUser} queue={queue} />}
    </main>
  </div>;
}
