<script setup lang="ts">
import type { NavigationMenuItem, TableColumn } from '@nuxt/ui'
import type { Page, TruckRequest, Metrics } from '~/types'

const route=useRoute(), router=useRouter(), toast=useToast(), colorMode=useColorMode()
const {user,loading,resolve,signOut,supabase}=useAuth()
const api=useApi()
const open=ref(false), email=ref(''), password=ref(''), signingIn=ref(false), authError=ref('')
const search=ref(''), status=ref('ALL')
const from=ref(new Date().toISOString().slice(0,10)), to=ref(new Date().toISOString().slice(0,10))

onMounted(async()=>{await resolve();supabase.auth.onAuthStateChange(()=>setTimeout(resolve,0))})

async function login(){
  signingIn.value=true;authError.value=''
  const {error}=await supabase.auth.signInWithPassword({email:email.value,password:password.value})
  if(error)authError.value=error.message;else await resolve()
  signingIn.value=false
}

const role=computed(()=>user.value?.role)
const links=computed<NavigationMenuItem[][]>(()=>[[
  {label:'Dashboard',icon:'i-lucide-house',to:'/'},
  ...(['ops_pic','fte_ops'].includes(role.value||'')?[{label:'Outbound',icon:'i-lucide-route',to:'/outbound/lh-request'}]:[]),
  ...(role.value==='fte_mm'?[{label:'Midmile',icon:'i-lucide-truck',to:'/midmile/truck-request'}]:[]),
  ...(['doc_officer','dock_officer'].includes(role.value||'')?[{label:'Docking Confirmation',icon:'i-lucide-anchor',to:'/docking'}]:[]),
  ...(role.value==='fte_ops'?[{label:'KPI Analytics',icon:'i-lucide-chart-no-axes-combined',to:'/kpi'}]:[]),
  ...(['fte_ops','fte_mm'].includes(role.value||'')?[{label:'User Management',icon:'i-lucide-users',to:'/users'}]:[])
]])
const title=computed(()=>({
  '/':'Home','/outbound/lh-request':'LH Request','/midmile/truck-request':'Truck Request','/docking':'Docking Confirmation','/kpi':'KPI Analytics','/users':'User Management'
}[route.path]||'Dashboard'))
const isHome=computed(()=>route.path==='/')
const isRequests=computed(()=>['/outbound/lh-request','/midmile/truck-request','/docking'].includes(route.path))

const query=computed(()=>{const p=new URLSearchParams({per_page:'100',sort:'created_at',direction:'desc'});if(search.value)p.set('search',search.value);if(status.value!=='ALL')p.set('status',status.value);return p.toString()})
const {data:requests,pending:requestsPending,refresh:refreshRequests}=await useAsyncData('requests',()=>api<Page<TruckRequest>>(`/requests?${query.value}`),{watch:[query],immediate:true})
const range=computed(()=>`date_from=${from.value}&date_to=${to.value}`)
const {data:metrics}=await useAsyncData('metrics',()=>api<Metrics>(`/requests/metrics?${range.value}`),{watch:[range],immediate:true})

const columns:TableColumn<TruckRequest>[]=[
  {accessorKey:'created_at',header:'Created'}, {accessorKey:'cluster',header:'Cluster'}, {accessorKey:'region',header:'Region'},
  {accessorKey:'dock_no',header:'Dock'}, {accessorKey:'backlogs',header:'Backlogs'}, {accessorKey:'truck_size',header:'Truck size'},
  {accessorKey:'plate_number',header:'Plate number'}, {accessorKey:'status',header:'Status'}
]
const stats=computed(()=>[
  {title:'Total requests',icon:'i-lucide-route',value:metrics.value?.total||0},
  {title:'Pending requests',icon:'i-lucide-clock-3',value:metrics.value?.by_status?.PENDING||0},
  {title:'For docking',icon:'i-lucide-truck',value:metrics.value?.by_status?.FOR_DOCKING||0},
  {title:'Docked',icon:'i-lucide-circle-check',value:metrics.value?.by_status?.DOCKED||0}
])
</script>

<template>
  <div v-if="loading" class="min-h-screen grid place-items-center"><UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary"/></div>
  <div v-else-if="!user" class="min-h-screen grid place-items-center bg-elevated/25 p-4">
    <UCard class="w-full max-w-md">
      <template #header><div class="flex items-center gap-3"><div class="grid size-10 place-items-center rounded-lg bg-primary text-white"><UIcon name="i-lucide-warehouse" class="size-5"/></div><div><h1 class="font-semibold">SOC 5 Outbound</h1><p class="text-sm text-muted">Sign in to operations</p></div></div></template>
      <form class="space-y-4" @submit.prevent="login"><UFormField label="Email"><UInput v-model="email" type="email" icon="i-lucide-mail" class="w-full" required/></UFormField><UFormField label="Password"><UInput v-model="password" type="password" icon="i-lucide-lock" class="w-full" required/></UFormField><UAlert v-if="authError" color="error" :description="authError"/><UButton type="submit" block :loading="signingIn">Sign in</UButton></form>
    </UCard>
  </div>
  <UDashboardGroup v-else unit="rem">
    <UDashboardSidebar id="default" v-model:open="open" collapsible resizable class="bg-elevated/25" :ui="{footer:'lg:border-t lg:border-default'}">
      <template #header="{collapsed}"><UButton color="neutral" variant="ghost" block :square="collapsed" :label="collapsed?undefined:'SOC 5 Outbound'" icon="i-lucide-warehouse" trailing-icon="i-lucide-chevrons-up-down"/></template>
      <template #default="{collapsed}"><UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default"/><UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip popover @update:model-value="open=false"/></template>
      <template #footer="{collapsed}"><UDropdownMenu :items="[[{label:user.name,type:'label'}],[{label:'Appearance',icon:'i-lucide-sun-moon',children:[{label:'Light',icon:'i-lucide-sun',onSelect:()=>colorMode.preference='light'},{label:'Dark',icon:'i-lucide-moon',onSelect:()=>colorMode.preference='dark'}]}],[{label:'Log out',icon:'i-lucide-log-out',onSelect:signOut}]]"><UButton color="neutral" variant="ghost" block :square="collapsed" :label="collapsed?undefined:user.name" icon="i-lucide-circle-user" trailing-icon="i-lucide-chevrons-up-down"/></UDropdownMenu></template>
    </UDashboardSidebar>
    <UDashboardPanel id="main">
      <template #header><UDashboardNavbar :title="title"><template #leading><UDashboardSidebarCollapse/></template><template #right><UTooltip text="Toggle theme"><UButton color="neutral" variant="ghost" square :icon="colorMode.value==='dark'?'i-lucide-sun':'i-lucide-moon'" @click="colorMode.preference=colorMode.value==='dark'?'light':'dark'"/></UTooltip><UButton color="neutral" variant="ghost" square icon="i-lucide-bell"/></template></UDashboardNavbar><UDashboardToolbar v-if="isHome"><template #left><UInput v-model="from" type="date" icon="i-lucide-calendar"/><span class="text-sm text-muted">to</span><UInput v-model="to" type="date"/></template></UDashboardToolbar></template>
      <template #body>
        <template v-if="isHome"><UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px"><UPageCard v-for="stat in stats" :key="stat.title" :icon="stat.icon" :title="stat.title" variant="subtle" :ui="{container:'gap-y-1.5',wrapper:'items-start',leading:'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',title:'font-normal text-muted text-xs uppercase'}" class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"><span class="text-2xl font-semibold text-highlighted">{{stat.value}}</span></UPageCard></UPageGrid><div class="mt-6"><div class="mb-3"><h2 class="font-semibold">Recent requests</h2><p class="text-sm text-muted">Latest outbound activity</p></div><UTable :data="requests?.data?.slice(0,10)||[]" :columns="columns" :loading="requestsPending"/></div></template>
        <template v-else-if="isRequests"><div class="flex flex-wrap gap-3 mb-4"><UInput v-model="search" icon="i-lucide-search" placeholder="Search requests…" class="min-w-64"/><USelect v-model="status" :items="['ALL','PENDING','APPROVED','ASSIGNED','FOR_DOCKING','DOCKED','CONFIRMED','CANCELLED']"/><UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" @click="refreshRequests()">Refresh</UButton></div><UTable :data="requests?.data||[]" :columns="columns" :loading="requestsPending"/></template>
        <template v-else><UEmpty icon="i-lucide-layout-dashboard" :title="title" description="This operational view is connected to the existing application API."/></template>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
