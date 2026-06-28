import { supabase } from './supabase';

const base = import.meta.env.VITE_API_URL ?? '/api';
export async function api<T>(path:string, init:RequestInit = {}):Promise<T> {
  const {data:{session}} = await supabase.auth.getSession();
  const response = await fetch(`${base}${path}`, {...init, headers:{'Content-Type':'application/json',Accept:'application/json',...(session?.access_token?{Authorization:`Bearer ${session.access_token}`} : {}),...init.headers}});
  if (!response.ok) { const body = await response.json().catch(()=>({})); throw new Error(body.message ?? `Request failed (${response.status})`); }
  return response.json();
}
