import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBrandContext } from '@/lib/supabase/queries'
import { generatePostVariationsHybrid } from '@/lib/ai/hybrid-generator'

export async function GET() {
  return POST({} as Request)
}

export async function POST(request: Request) {
  try {
    const results: any = {}
    
    // Step 1: Test Supabase connection
    console.log('Step 1: Testing Supabase connection...')
    let supabase
    try {
      supabase = createAdminClient()
      const { data: testClients, error: testError } = await supabase.from('clients').select('id, name, ai_tier').limit(1)
      if (testError) throw new Error('Supabase query failed: ' + testError.message)
      results.supabaseTest = '✓ SUCCESS - found ' + testClients?.length + ' clients'
      console.log('Step 1: ✓ Supabase connection works')
    } catch (e: any) {
      results.supabaseTest = '✗ FAILED'
      results.supabaseError = e.message
      results.supabaseErrorName = e.name
      console.error('Step 1: ✗ Supabase failed:', e.message, e.name)
      return NextResponse.json(results, { status: 500 })
    }
    
    // Step 2: Test getting brand context
    console.log('Step 2: Testing brand context...')
    // Get a real client ID from the database
    const { data: clientData } = await supabase.from('clients').select('id').limit(1)
    const testClientId = clientData?.[0]?.id || '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f'
    console.log('Testing with client ID:', testClientId)
    const brandContext = await getBrandContext(testClientId)
    if (!brandContext) {
      results.brandContext = '✗ FAILED - No context for client ' + testClientId
      console.log('Step 2: ✗ Brand context not found')
      // Continue anyway with mock context
      results.mockContext = 'Using mock context for Claude test'
    } else {
      results.brandContext = '✓ SUCCESS'
      console.log('Step 2: ✓ Brand context loaded')
    }
    
    // Step 3: Test Claude API directly
    console.log('Step 3: Testing Claude API...')
    try {
      const testVariation = await generatePostVariationsHybrid({
        imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400',
        brandContext: {
          brand_name: 'Test',
          industry: 'Barber',
          location: 'Dublin',
          target_audience: 'Men 25-45',
          tone: 'Friendly',
          personality: 'Professional',
          cta: 'Book now',
          hashtags: ['#test'],
          emoji_style: 'moderate',
          post_length_pref: 'short',
        },
        clientTier: 'standard', // Will force Claude anyway
        claudeModel: 'claude-sonnet-4-5-20250929',
        count: 1,
        startText: 'Test',
      })
      results.claudeTest = '✓ SUCCESS'
      console.log('Step 3: ✓ Claude API works, generated', testVariation.length, 'variations')
    } catch (claudeError: any) {
      results.claudeTest = '✗ FAILED'
      results.claudeError = claudeError.message
      results.claudeErrorName = claudeError.name
      console.error('Step 3: ✗ Claude API failed:', claudeError.message)
    }
    
    return NextResponse.json(results)
    
  } catch (error: any) {
    console.error('Test failed:', error.message)
    return NextResponse.json({
      error: error.message,
      errorName: error.name,
      errorStack: error.stack?.substring(0, 500),
    }, { status: 500 })
  }
}
