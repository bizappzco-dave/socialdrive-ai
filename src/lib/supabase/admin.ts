import { createClient } from '@supabase/supabase-js'

/**
 * Admin client with service role key
 * Use for server-side operations that need full access
 */
export function createAdminClient() {
  // Use hardcoded values as fallback (TEMPORARY - until Vercel env vars work)
  const url = process.env.SUPABASE_URL?.trim() || 'https://dqhnxzaktnejasqlfrjf.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxaG54emFrdG5lamFzcWxmcmpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYzNzk0NCwiZXhwIjoyMDkzMjEzOTQ0fQ.YourServiceRoleKeyHere'
  
  if (!url) {
    throw new Error('SUPABASE_URL is not configured')
  }
  if (!key || key.includes('YourServiceRoleKey')) {
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
