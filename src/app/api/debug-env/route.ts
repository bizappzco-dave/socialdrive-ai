import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      `✓ configured (${process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0} chars)` : 
      '✗ MISSING',
    SUPABASE_URL: process.env.SUPABASE_URL ? 
      `✓ configured` : 
      '✗ MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
      `✓ configured (${process.env.NEXT_PUBLIC_SUPABASE_URL})` : 
      '✗ MISSING',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 
      `✓ configured (${process.env.ANTHROPIC_API_KEY?.length || 0} chars)` : 
      '✗ MISSING',
  })
}
