import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase'; import { api } from './lib/api';
import { Dashboard } from './pages/Dashboard'; import { Login } from './pages/Login'; import { ChangePassword } from './pages/ChangePassword';
type AuthState = 'loading' | 'signed-out' | 'ready' | 'change-password';
export default function App() {
  const [state, setState] = useState<AuthState>('loading');
  async function resolveSession(hasSession: boolean) { if (!hasSession) return setState('signed-out'); try { const profile = await api<{ must_change_password: boolean }>('/auth/me'); setState(profile.must_change_password ? 'change-password' : 'ready'); } catch { await supabase.auth.signOut(); setState('signed-out'); } }
  useEffect(() => { supabase.auth.getSession().then(({ data }) => resolveSession(!!data.session)); const { data } = supabase.auth.onAuthStateChange((_event, session) => { void resolveSession(!!session); }); return () => data.subscription.unsubscribe(); }, []);
  if (state === 'loading') return <p className="state">Loading…</p>; if (state === 'signed-out') return <Login />; if (state === 'change-password') return <ChangePassword onComplete={() => setState('ready')} />; return <Dashboard />;
}
