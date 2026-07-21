import { supabase } from './supabase';
import { useUiStore } from '../stores/ui';

const base = import.meta.env.VITE_API_URL ?? '/api';
const inFlightRequests = new Map<string, Promise<unknown>>();

type ApiErrorBody = {
  code?: string;
  message?: string;
  field_errors?: Record<string, string[] | string>;
  retryable?: boolean;
  correlation_id?: string;
};

type MutationOptions = {
  idempotencyKey?: string;
  updatedAt?: string | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly fieldErrors?: Record<string, string[] | string>,
    readonly retryable = false,
    readonly correlationId?: string
  ) {
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

export function newIdempotencyKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function mutationRequestInit(method: 'POST' | 'PUT' | 'PATCH', body: unknown, options: MutationOptions = {}): RequestInit {
  const headers: Record<string, string> = {};
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
  if (options.updatedAt) headers['If-Unmodified-Since'] = options.updatedAt;

  return {
    method,
    body: JSON.stringify(body),
    headers,
  };
}

export function describeApiError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return {
      title: 'Request failed',
      message: error instanceof Error ? error.message : 'The request could not be completed.',
    };
  }

  const suffix = error.correlationId ? ` Reference: ${error.correlationId}.` : '';
  if (error.status === 0) {
    return {
      title: 'Offline or network issue',
      message: `The app could not reach the API.${suffix}`,
    };
  }
  if (error.status === 409) {
    return {
      title: 'Data changed',
      message: `${error.message}${suffix}`,
    };
  }
  if (error.status === 422) {
    return {
      title: 'Check the form',
      message: `${error.message}${suffix}`,
    };
  }
  if (error.status === 429) {
    return {
      title: 'Too many requests',
      message: `The server asked us to slow down.${suffix}`,
    };
  }

  return {
    title: 'Request failed',
    message: `${error.message}${suffix}`,
  };
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
      response = await fetch(`${base}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          ...(viewRole ? { 'X-View-Role': viewRole } : {}),
          ...init.headers,
        },
      });
    } catch {
      throw new ApiError('Network error. Check your connection and try again.', 0, 'network_error', undefined, true);
    }

    const text = await response.text();
    let body: ApiErrorBody | unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }

    if (!response.ok) {
      const payload = body && typeof body === 'object' ? body as ApiErrorBody : {};
      throw new ApiError(
        typeof payload.message === 'string' ? payload.message : `Request failed (${response.status})`,
        response.status,
        payload.code,
        payload.field_errors,
        payload.retryable === true,
        payload.correlation_id ?? response.headers.get('X-Correlation-ID') ?? undefined
      );
    }

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
