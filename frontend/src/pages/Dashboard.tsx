import { useEffect, useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useQueueNotifications } from '../hooks/useQueueNotifications';
import { supabase } from '../lib/supabase';
import type { AppView, User } from '../types';
import { Overview } from './Overview';
import { OutboundRequests } from './OutboundRequests';
import { MidmileRequests } from './MidmileRequests';

export function Dashboard({ user }: { user: User }) {
  const allowed = (candidate: AppView) => candidate === 'overview' || (candidate === 'lh-request' && (user.role === 'ops_pic' || user.role === 'fte_ops')) || (candidate === 'truck-request' && user.role === 'fte_mm');
  const fromPath = (): AppView => window.location.pathname === '/outbound/lh-request' ? 'lh-request' : window.location.pathname === '/midmile/truck-request' ? 'truck-request' : 'overview';
  const [view, setView] = useState<AppView>(() => allowed(fromPath()) ? fromPath() : 'overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const queue = useQueueNotifications(user);

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
    <AppSidebar user={user} activeView={view} open={menuOpen} onOpenChange={setMenuOpen} onNavigate={navigate} onSignOut={() => void supabase.auth.signOut()} pendingCount={queue.count} />
    <main className="app-content">
      <AppHeader user={user} view={view} count={queue.count} alerts={queue.alerts} onSearch={() => navigate(user.role === 'fte_mm' ? 'truck-request' : 'lh-request')} onOpenAlert={request => { queue.acknowledge(request.id); navigate(user.role === 'fte_mm' ? 'truck-request' : 'lh-request'); }} />
      {view === 'overview' && <Overview user={user} onNavigate={navigate} />}
      {view === 'lh-request' && <OutboundRequests user={user} queue={queue} />}
      {view === 'truck-request' && <MidmileRequests user={user} queue={queue} />}
    </main>
  </div>;
}
