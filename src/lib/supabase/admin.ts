import { createClient } from '@supabase/supabase-js'

/**
 * Admin client with service role key
 * Use for server-side operations that need full access
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  
  if (!url) {
    throw new Error('SUPABASE_URL is not configured')
  }
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  
  console.log('Creating Supabase admin client with URL:', url.substring(0, 30) + '...')
  console.log('Service role key length:', key.length)
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
