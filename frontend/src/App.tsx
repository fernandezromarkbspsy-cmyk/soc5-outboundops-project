import { useCallback, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { api } from './lib/api';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';

type AuthState = 'loading' | 'signed-out' | 'ready' | 'change-password' | 'unauthorized';

export default function App() {
  const [state, setState] = useState<AuthState>('loading');
  const [authError, setAuthError] = useState('');

  const resolveSession = useCallback(async (hasSession: boolean) => {
    if (!hasSession) {
      setAuthError('');
      setState('signed-out');
      return;
    }

    try {
      const profile = await api<{ must_change_password: boolean }>('/auth/me');
      setAuthError('');
      setState(profile.must_change_password ? 'change-password' : 'ready');
    } catch (cause) {
      // Keep the Supabase session so a temporary API failure does not turn a
      // successful OAuth callback into an unexplained sign-out.
      setAuthError(cause instanceof Error ? cause.message : 'Unable to load your account.');
      setState('unauthorized');
    }
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => resolveSession(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase advises against awaiting other auth calls inside this callback.
      window.setTimeout(() => void resolveSession(!!session), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [resolveSession]);

  if (state === 'loading') return <p className="state">Loading…</p>;
  if (state === 'signed-out') return <Login />;
  if (state === 'unauthorized') return <main className="state"><h1>Account access failed</h1><p className="error">{authError}</p><p>Your Google sign-in succeeded, but this account is not provisioned or the API is unavailable.</p><button onClick={() => void resolveSession(true)}>Try again</button> <button onClick={() => void supabase.auth.signOut()}>Sign out</button></main>;
  if (state === 'change-password') return <ChangePassword onComplete={() => setState('ready')} />;
  return <Dashboard />;
}
