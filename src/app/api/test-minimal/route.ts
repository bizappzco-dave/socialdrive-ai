import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  const results: any = {}
  
  // Test 1: Supabase with hardcoded key
  try {
    const supabase = createClient(
      'https://dqhnxzaktnejasqlfrjf.supabase.co',
      'REDACTED'
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
      apiKey: process.env.ANTHROPIC_API_KEY || 'not-set'
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
