import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  const results: any = {}
  
  // Test 1: Supabase with hardcoded key
  try {
    const supabase = createClient(
      'https://dqhnxzaktnejasqlfrjf.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxaG54emFrdG5lamFzcWxmcmpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYzNzk0NCwiZXhwIjoyMDkzMjEzOTQ0fQ.fN3J5CIs5BMuSCYNFBvV0ZLPHGhyyeNdtdOjUA59soY'
    )
    const { data, error } = await supabase.from('clients').select('id').limit(1)
    if (error) throw error
    results.supabase = '✓ SUCCESS'
  } catch (e: any) {
    results.supabase = '✗ FAILED: ' + e.message
  }
  
  // Test 2: Anthropic with hardcoded key
  try {
    const anthropic = new Anthropic({
      apiKey: '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'
    })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'hi' }]
    })
    results.anthropic = '✓ SUCCESS'
  } catch (e: any) {
    results.anthropic = '✗ FAILED: ' + e.message
  }
  
  return NextResponse.json(results)
}
