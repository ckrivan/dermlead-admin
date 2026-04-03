import { createBrowserClient } from '@supabase/ssr'

// Singleton — one instance per browser tab to avoid auth state conflicts.
let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // No-op lock prevents a navigator.locks deadlock during initialization
          // where _initialize() holds an exclusive lock while getSession() and
          // REST queries wait for it, causing an 8-16s hang.
          // The built-in autoRefreshToken (10s tick) still runs with this —
          // it does NOT depend on navigator.locks.
          lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
            return fn()
          },
        },
      }
    )
    // Warm up session so the first storage upload doesn't hang waiting
    // for lazy auth hydration (same navigator.locks deadlock pattern).
    _client.auth.getSession()
  }

  return _client
}
