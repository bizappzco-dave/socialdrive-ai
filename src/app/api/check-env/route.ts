import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET (' + process.env.SUPABASE_URL.length + ' chars)' : 'NOT SET',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET (' + process.env.SUPABASE_ANON_KEY.length + ' chars)' : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET (' + process.env.NEXT_PUBLIC_SUPABASE_URL.length + ' chars)' : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ' chars)' : 'NOT SET',
  })
}
