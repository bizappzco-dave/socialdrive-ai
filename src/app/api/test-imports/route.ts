import { NextResponse } from 'next/server'

export async function GET() {
  const results: any = {}
  
  // Test imports one by one
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    results.adminImport = '✓ OK'
    
    // Try calling it
    const client = createAdminClient()
    results.adminCall = '✓ OK'
    
    // Test query
    const { data, error } = await client.from('clients').select('id').limit(1)
    results.adminQuery = error ? '✗ ' + error.message : '✓ Found ' + data?.length + ' clients'
  } catch (e: any) {
    results.adminImport = '✗ ' + e.message
  }
  
  try {
    const { getBrandContext } = await import('@/lib/supabase/queries')
    results.queriesImport = '✓ OK'
    
    const ctx = await getBrandContext('62fae0aa-3b82-4c20-b8c7-7a8dfe01543f')
    results.brandContext = ctx ? '✓ Got context' : '✗ No context'
  } catch (e: any) {
    results.queriesImport = '✗ ' + e.message
  }
  
  try {
    const { generatePostVariationsHybrid } = await import('@/lib/ai/hybrid-generator')
    results.hybridImport = '✓ OK'
  } catch (e: any) {
    results.hybridImport = '✗ ' + e.message
  }
  
  return NextResponse.json(results)
}
