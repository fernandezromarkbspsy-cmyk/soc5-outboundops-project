import { supabase } from './supabase';

const base = import.meta.env.VITE_API_URL ?? '/api';
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}), ...init.headers } });
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) { throw new Error(body?.message ?? `Request failed (${response.status})`); }
  return body as T;
}
