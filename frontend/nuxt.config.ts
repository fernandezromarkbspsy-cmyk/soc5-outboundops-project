export default defineNuxtConfig({
  ssr: false,
  modules: ['@nuxt/ui', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  runtimeConfig: { public: { apiUrl: process.env.NUXT_PUBLIC_API_URL || '/api', supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '', supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '' } },
  compatibilityDate: '2026-06-30'
})
