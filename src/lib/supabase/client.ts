import { createBrowserClient } from '@supabase/ssr'

// Singleton — createBrowserClient is designed to be instantiated once per browser tab.
// Multiple instances conflict over internal auth state and abort each other's requests.
let _client: ReturnType<typeof createBrowserClient> | null = null
let _refreshSetup = false

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

  // One-time setup: refresh auth when tab becomes visible after idle.
  // The no-op lock bypasses Supabase's internal token refresh, so we
  // manually refresh when the user comes back to the tab.
  if (!_refreshSetup && typeof document !== 'undefined') {
    _refreshSetup = true
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && _client) {
        _client.auth.getSession().then(({ data: { session } }: { data: { session: { access_token: string; refresh_token: string } | null } }) => {
          if (session) {
            // Re-set the session to force a token refresh if needed
            _client!.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            })
          }
        }).catch(() => {
          // Silently ignore — proxy.ts will handle on next server request
        })
      }
    })
  }

  return _client
}
