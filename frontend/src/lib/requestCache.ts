import type { QueryClient } from '@tanstack/react-query';
import type { Page, TruckRequest } from '../types';

type RequestQueryData = Page<TruckRequest> | undefined;
export type RequestSnapshot = Array<[readonly unknown[], RequestQueryData]>;

type QueryKeyMatcher = (queryKey: readonly unknown[]) => boolean;
type RequestUpdater = (request: TruckRequest) => TruckRequest | null;

function matchAll() {
  return true;
}

export function captureRequestSnapshot(queryClient: QueryClient, queryKey: readonly unknown[] = ['requests']) {
  return queryClient.getQueriesData<RequestQueryData>({ queryKey }) as RequestSnapshot;
}

export function restoreRequestSnapshot(queryClient: QueryClient, snapshot: RequestSnapshot) {
  snapshot.forEach(([key, value]) => {
    queryClient.setQueryData(key, value);
  });
}

function updatePagedQueries(queryClient: QueryClient, update: (page: Page<TruckRequest>) => Page<TruckRequest>, matcher: QueryKeyMatcher = matchAll) {
  const entries = queryClient.getQueriesData<RequestQueryData>({ queryKey: ['requests'] }) as RequestSnapshot;
  entries.forEach(([key, value]) => {
    if (!value || !matcher(key)) return;
    queryClient.setQueryData<Page<TruckRequest>>(key, update(value));
  });
}

export function prependRequest(queryClient: QueryClient, request: TruckRequest, matcher: QueryKeyMatcher = matchAll) {
  updatePagedQueries(queryClient, page => {
    if (page.data.some(item => item.id === request.id)) return page;
    const data = [request, ...page.data];
    return { ...page, data, total: page.total + 1 };
  }, matcher);
}

export function updateRequest(queryClient: QueryClient, requestId: string, updater: RequestUpdater, matcher: QueryKeyMatcher = matchAll) {
  updatePagedQueries(queryClient, page => {
    let changed = false;
    const data = page.data.flatMap(item => {
      if (item.id !== requestId) return [item];
      changed = true;
      const next = updater(item);
      return next ? [next] : [];
    });
    if (!changed) return page;
    return { ...page, data, total: data.length < page.data.length ? Math.max(0, page.total - 1) : page.total };
  }, matcher);
}

export function replaceTempRequest(queryClient: QueryClient, tempId: string, next: TruckRequest, matcher: QueryKeyMatcher = matchAll) {
  updateRequest(queryClient, tempId, () => next, matcher);
}
