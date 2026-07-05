"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import App from "@/soc5/App"
import { ErrorBoundary } from "@/soc5/components/ErrorBoundary"
import { supabaseConfigError } from "@/soc5/lib/supabase"

export function Soc5Application() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, refetchInterval: 15_000, retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  )

  if (supabaseConfigError) {
    return (
      <main className="state">
        <h1>Configuration error</h1>
        <p className="error">{supabaseConfigError}</p>
        <p>Configure the public Supabase variables before starting the application.</p>
      </main>
    )
  }

  return (
    <QueryClientProvider client={client}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
