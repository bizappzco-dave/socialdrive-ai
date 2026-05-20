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
    const supabase = createAdminClient()
    
    const { data: submission, error } = await supabase
      .from('submissions')
      .select('id, client_name, client_email, client_phone, status, brief_text, client_id')
      .eq('upload_token', params.token)
      .single()
    
    if (error || !submission) {
      console.error('Submission not found:', error)
      return NextResponse.json(
        { error: 'Invalid or expired upload link' },
        { status: 404 }
      )
    }
    
    // Get client info separately
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, tier, features')
      .eq('id', submission.client_id)
      .single()
    
    // Return submission with client tier info
    return NextResponse.json({
      ...submission,
      client_tier: client?.tier || 'simple',
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
