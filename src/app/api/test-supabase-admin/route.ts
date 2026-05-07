import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // Test Supabase connection
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, ai_tier')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        supabase: 'FAILED',
        error: error.message,
        details: error,
      }, { status: 500 })
    }
    
    // Test getting a specific client with ai_tier
    const { data: noLabel, error: noLabelError } = await supabase
      .from('clients')
      .select('id, name, ai_tier, claude_model')
      .ilike('name', '%no label%')
      .single()
    
    return NextResponse.json({
      supabase: 'SUCCESS',
      clientsFound: clients?.length || 0,
      noLabelClient: noLabel,
      noLabelError: noLabelError?.message || null,
      env: {
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
        SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `✓ (${process.env.SUPABASE_SERVICE_ROLE_KEY.length} chars)` : '✗',
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      supabase: 'FAILED',
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
