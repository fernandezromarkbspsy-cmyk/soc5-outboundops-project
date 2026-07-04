import type { User } from '~/types'

export function useAuth(){
  const {$supabase}=useNuxtApp()
  const user=useState<User|null>('auth-user',()=>null)
  const loading=useState('auth-loading',()=>true)
  const api=useApi()
  async function resolve(){
    const {data}=await $supabase.auth.getSession()
    if(!data.session){user.value=null;loading.value=false;return}
    try{user.value=await api<User>('/auth/me')}catch{user.value=null}
    loading.value=false
  }
  async function signOut(){await $supabase.auth.signOut();user.value=null}
  return {user,loading,resolve,signOut,supabase:$supabase}
}
