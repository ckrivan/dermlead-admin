import { createBrowserClient } from '@supabase/ssr'

// Singleton — createBrowserClient is designed to be instantiated once per browser tab.
// Multiple instances conflict over internal auth state and abort each other's requests.
let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}
