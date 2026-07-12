import { supabase } from './supabase';
import { useUiStore } from '../stores/ui';

const base = import.meta.env.VITE_API_URL ?? '/api';
const inFlightRequests = new Map<string, Promise<unknown>>();

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function normalizedHeaders(headers: HeadersInit | undefined) {
  if (!headers) return '';
  if (headers instanceof Headers) {
    return Array.from(headers.entries()).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}:${value}`).join('|');
  }
  if (Array.isArray(headers)) {
    return [...headers].sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}:${value}`).join('|');
  }
  return Object.entries(headers).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}:${String(value)}`).join('|');
}

function requestMethod(init: RequestInit) {
  return (init.method ?? 'GET').toUpperCase();
}

function requestDeduplicationKey(path: string, init: RequestInit, token: string | null | undefined, viewRole: string | null) {
  return [requestMethod(init), `${base}${path}`, token ?? '', viewRole ?? '', normalizedHeaders(init.headers), typeof init.body === 'string' ? init.body : ''].join('::');
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const viewRole = useUiStore.getState().viewRole;
  const method = requestMethod(init);
  const dedupeEnabled = method === 'GET';
  const dedupeKey = dedupeEnabled ? requestDeduplicationKey(path, init, session?.access_token, viewRole) : null;

  if (dedupeKey && inFlightRequests.has(dedupeKey)) {
    return inFlightRequests.get(dedupeKey)! as Promise<T>;
  }

  const request = (async () => {
    let response: Response;
    try {
      response = await fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}), ...(viewRole ? { 'X-View-Role': viewRole } : {}), ...init.headers } });
    } catch {
      throw new ApiError('Network error. Check your connection and try again.', 0);
    }
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    const message = body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
      ? body.message
      : `Request failed (${response.status})`;
    if (!response.ok) throw new ApiError(message, response.status);
    return body as T;
  })();

  if (dedupeKey) {
    inFlightRequests.set(dedupeKey, request);
    try {
      return await request;
    } finally {
      inFlightRequests.delete(dedupeKey);
    }
  }

  return request;
}
