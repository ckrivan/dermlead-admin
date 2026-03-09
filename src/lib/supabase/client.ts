import { createBrowserClient } from '@supabase/ssr'

// Singleton — createBrowserClient is designed to be instantiated once per browser tab.
// Multiple instances conflict over internal auth state and abort each other's requests.
let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Bypass navigator.locks — proxy.ts already handles token refresh server-side.
          // The default navigatorLock causes a deadlock on page refresh: _initialize()
          // holds an exclusive lock while getSession() and all REST queries wait for it,
          // creating an 8-16 second hang before safety timers break the deadlock.
          lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
            return fn()
          },
        },
      }
    )
  }
  return _client
}
