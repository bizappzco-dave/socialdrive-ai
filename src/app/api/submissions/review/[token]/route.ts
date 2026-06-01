import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/submissions/review/[token]
 * 
 * Get submission info by review token
 */
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient()
    
    const { data: submission, error } = await supabase
      .from('submissions')
      .select('id, client_id, client_name, client_email, client_phone, status')
      .eq('review_token', params.token)
      .single()
    
    if (error) {
      console.error('Supabase error fetching submission:', error)
      console.error('Review token:', params.token)
    }
    
    if (error || !submission) {
      return NextResponse.json(
        { error: 'Invalid or expired review link' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(submission)
    
  } catch (error: any) {
    console.error('Failed to fetch submission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}
