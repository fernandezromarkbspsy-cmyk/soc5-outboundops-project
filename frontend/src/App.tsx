import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { api, ApiError } from './lib/api';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';
import type { User } from './types';

type AuthState = 'loading' | 'signed-out' | 'ready' | 'change-password' | 'unauthorized';
type AuthFailure = { title: string; message: string; detail: string };

const defaultFailure: AuthFailure = {
  title: 'Account access failed',
  message: 'Unable to load your account.',
  detail: 'Sign-in succeeded, but the application could not load your account.',
};

function describeFailure(cause: unknown): AuthFailure {
  if (!(cause instanceof ApiError)) {
    return { ...defaultFailure, message: cause instanceof Error ? cause.message : defaultFailure.message };
  }
  const reference = cause.correlationId ? ` Reference: ${cause.correlationId}.` : '';
  if (cause.status === 403) {
    return {
      title: 'Account not provisioned',
      message: cause.message,
      detail: `Your sign-in succeeded, but this account does not have active application access.${reference}`,
    };
  }
  if (cause.status === 503) {
    return {
      title: 'Authentication service unavailable',
      message: cause.message,
      detail: `The API server cannot use its Supabase configuration. Retry after the deployment configuration is corrected.${reference}`,
    };
  }
  return {
    ...defaultFailure,
    message: cause.message,
    detail: cause.status === 401
      ? `The API rejected this session. Sign out, then sign in again.${reference}`
      : `${defaultFailure.detail}${reference}`,
  };
}

export default function App() {
  const [state, setState] = useState<AuthState>('loading');
  const [failure, setFailure] = useState<AuthFailure>(defaultFailure);
  const [profile, setProfile] = useState<User | null>(null);
  const lastToken = useRef<string | null>(null);
  const requestSequence = useRef(0);

  const resolveSession = useCallback(async (session: Session | null, force = false) => {
    if (!session) {
      lastToken.current = null;
      requestSequence.current += 1;
      setProfile(null);
      window.history.replaceState({}, '', '/');
      setState('signed-out');
      return;
    }
    if (!force && lastToken.current === session.access_token) return;

    lastToken.current = session.access_token;
    const requestId = ++requestSequence.current;

    try {
      const resolvedProfile = await api<User>('/auth/me');
      if (requestId !== requestSequence.current) return;
      setProfile(resolvedProfile);
      if (window.location.pathname === '/' || window.location.pathname === '/login') {
        window.history.replaceState({}, '', '/dashboard');
      }
      setState(resolvedProfile.must_change_password ? 'change-password' : 'ready');
    } catch (cause) {
      if (requestId !== requestSequence.current) return;
      // Keep the session so temporary API failures can be retried in place.
      setFailure(describeFailure(cause));
      setState('unauthorized');
    }
  }, []);

  const retrySession = useCallback(async () => {
    setState('loading');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setFailure(describeFailure(error));
      setState('unauthorized');
      return;
    }
    await resolveSession(data.session, true);
  }, [resolveSession]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Supabase advises against awaiting other auth calls inside this callback.
        window.setTimeout(() => void resolveSession(session), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [resolveSession]);

  if (state === 'loading') return <main className="app-loading" aria-busy="true" aria-live="polite"><div className="app-loading-card"><div className="app-loading-mark">S5</div><div><strong>Loading dashboard</strong><p>Preparing your session...</p></div></div></main>;
  if (state === 'signed-out') return <Login />;
  if (state === 'unauthorized') return <main className="state auth-state"><div className="auth-state-card"><h1>{failure.title}</h1><p className="error">{failure.message}</p><p>{failure.detail}</p><div className="auth-state-actions"><button type="button" onClick={() => void retrySession()}>Try again</button><button className="secondary-button" type="button" onClick={() => void supabase.auth.signOut()}>Sign out</button></div></div></main>;
  if (state === 'change-password') return <ChangePassword onComplete={() => setState('ready')} />;
  return profile ? <Dashboard user={profile} /> : <main className="app-loading" aria-busy="true" aria-live="polite"><div className="app-loading-card"><div className="app-loading-mark">S5</div><div><strong>Loading dashboard</strong><p>Preparing your session...</p></div></div></main>;
}
