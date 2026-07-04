import type { FetchOptions } from 'ofetch'

export function useApi(){
  const {$supabase}=useNuxtApp()
  const config=useRuntimeConfig()
  const viewRole=useState<string|null>('view-role',()=>null)
  return async function api<T>(path:string,options:FetchOptions<'json'>={}){
    const {data}=await $supabase.auth.getSession()
    return $fetch<T>(`${config.public.apiUrl}${path}`,{...options,headers:{Accept:'application/json',...(data.session?.access_token?{Authorization:`Bearer ${data.session.access_token}`} : {}),...(viewRole.value?{'X-View-Role':viewRole.value}:{}),...options.headers}})
  }
}
