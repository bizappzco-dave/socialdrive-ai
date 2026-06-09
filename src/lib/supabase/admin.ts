import { createClient } from '@supabase/supabase-js'

/**
 * Admin client for server-side operations that must bypass RLS.
 * Prefers the new secret API key model, with legacy service_role fallback during migration.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url) {
    throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is not configured')
  }
  if (!key) {
    throw new Error('SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
