const SMART_POLL_LIMIT_MS = 120_000;

type PollMode = 'realtime' | 'standard' | 'slow';

function baseInterval(mode: PollMode) {
  if (mode === 'realtime') return 4_000;
  if (mode === 'slow') return 20_000;
  return 10_000;
}

function hasWindow() {
  return typeof window !== 'undefined';
}

function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function isHidden() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

export function smartRefetchInterval(mode: PollMode = 'standard') {
  const jitter = hasWindow() ? Math.floor(Math.random() * 500) : 0;
  return (query: any) => {
    if (isOffline()) return false;
    if (query.state.fetchStatus === 'fetching') return false;

    const base = baseInterval(mode) + jitter;
    const hiddenMultiplier = isHidden() ? 3 : 1;
    const failures = Math.max(0, query.state.fetchFailureCount);
    const backoffMultiplier = failures > 0 ? 2 ** Math.min(4, failures) : 1;
    return Math.min(SMART_POLL_LIMIT_MS, base * hiddenMultiplier * backoffMultiplier);
  };
}

export const swrQueryOptions = {
  staleTime: 30_000,
  gcTime: 10 * 60_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchOnMount: true,
} as const;
