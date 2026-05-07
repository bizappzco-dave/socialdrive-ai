import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ configured' : '✗ MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ configured (' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ' chars)' : '✗ MISSING',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✓ configured' : '✗ MISSING',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '✗ MISSING',
    }
  })
}
