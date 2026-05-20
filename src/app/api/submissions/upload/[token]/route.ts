import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/submissions/upload/[token]
 * 
 * Get submission info by upload token
 */
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    console.log('Looking up token:', params.token)
    const supabase = createAdminClient()
    
    const { data: submission, error } = await supabase
      .from('submissions')
      .select('id, client_name, client_email, client_phone, status, brief_text, client_id')
      .eq('upload_token', params.token)
      .single()
    
    console.log('Query result:', { submission, error })
    
    if (error || !submission) {
      console.error('Submission not found:', { error, submission })
      return NextResponse.json(
        { error: 'Invalid or expired upload link', details: error?.message, hasSubmission: !!submission },
        { status: 404 }
      )
    }
    
    // Get client info separately
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, features')
      .eq('id', submission.client_id)
      .single()
    
    if (clientError) {
      console.error('Failed to get client:', clientError)
    }
    
    // Return submission with client tier info
    return NextResponse.json({
      ...submission,
      client_tier: 'simple', // Default to simple since tier column doesn't exist
      client_features: client?.features || {},
      client: client
    })
    
  } catch (error: any) {
    console.error('Failed to fetch submission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}
