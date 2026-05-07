import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const results: any = {}
  
  // Test with the exact key from env var
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  
  results.url = url?.substring(0, 30)
  results.anonKeyLength = anonKey?.length
  results.anonKeyStarts = anonKey?.substring(0, 20)
  
  try {
    const supabase = createClient(url!, anonKey!)
    const { data, error } = await supabase.from('clients').select('id').limit(1)
    results.directTest = error ? '✗ ' + error.message : '✓ Found ' + data?.length + ' clients'
  } catch (e: any) {
    results.directTest = '✗ ' + e.message
  }
  
  // Test with NEXT_PUBLIC key
  const nextPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const nextPublicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  try {
    const supabase2 = createClient(nextPublicUrl!, nextPublicAnonKey!)
    const { data, error } = await supabase2.from('clients').select('id').limit(1)
    results.nextPublicTest = error ? '✗ ' + error.message : '✓ Found ' + data?.length + ' clients'
  } catch (e: any) {
    results.nextPublicTest = '✗ ' + e.message
  }
  
  return NextResponse.json(results)
}
